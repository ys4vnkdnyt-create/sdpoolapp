/**
 * PostHog analytics — init from server-injected config, track app events.
 * Disabled when POSTHOG_KEY is missing (local dev without env vars).
 */
import { DisplaySurveyType, posthog } from "posthog-js";

/** Config written by GET /config/analytics.js (see server.ts). */
export interface AnalyticsConfig {
  apiKey: string;
  apiHost: string;
  /** Optional survey id for the Feedback button (POSTHOG_FEEDBACK_SURVEY_ID). */
  feedbackSurveyId?: string;
}

declare global {
  interface Window {
    __ANALYTICS_CONFIG__?: AnalyticsConfig;
  }
}

let analyticsReady = false;
let feedbackToastTimer = 0;

/** True when PostHog was initialized with a project key. */
export function isAnalyticsReady(): boolean {
  return analyticsReady;
}

/** Read config from the inline script the server serves. */
function readConfig(): AnalyticsConfig | null {
  const cfg = window.__ANALYTICS_CONFIG__;
  if (!cfg?.apiKey?.trim()) return null;
  return cfg;
}

/** Start PostHog once; surveys load automatically when enabled in the dashboard. */
export function initAnalytics(): void {
  if (analyticsReady) return;

  const cfg = readConfig();
  if (!cfg) return;

  posthog.init(cfg.apiKey, {
    api_host: cfg.apiHost || "https://us.i.posthog.com",
    // Native pageview on first load — fills PostHog DAU / Page views tiles.
    capture_pageview: true,
    persistence: "localStorage+cookie",
  });

  analyticsReady = true;
  posthog.capture("app_loaded");
}

/** Fire a custom event when analytics is active. */
function trackEvent(
  name: string,
  properties?: Record<string, string | number | boolean>
): void {
  if (!analyticsReady) return;
  posthog.capture(name, properties);
}

/** Standard PostHog pageview when user moves between SPA screens (after first load). */
function capturePageView(screen: "search" | "results" | "favorites"): void {
  if (!analyticsReady) return;
  posthog.capture("$pageview", {
    screen,
    $pathname: `/${screen}`,
    $current_url: `${window.location.origin}${window.location.pathname}#${screen}`,
  });
}

/** Screen change from showScreen() — search, results, or favorites. */
export function trackScreenView(screen: "search" | "results" | "favorites"): void {
  capturePageView(screen);
  trackEvent("screen_view", { screen });
}

/** User tapped Find Open Lanes (no GPS or other PII). */
export function trackSearchSubmitted(props: {
  date: string;
  time: string;
  sort_by: "distance" | "cost";
  results_count: number;
}): void {
  trackEvent("search_submitted", props);
}

/** Heart tapped on a pool card. */
export function trackFavoriteToggled(poolId: string, favorited: boolean): void {
  trackEvent("favorite_toggled", { pool_id: poolId, favorited });
}

/** Brief message when Feedback is tapped but no PostHog survey is available yet. */
function showFeedbackToast(message: string): void {
  let toast = document.getElementById("feedback-toast");
  if (!toast) {
    toast = document.createElement("p");
    toast.id = "feedback-toast";
    toast.className = "feedback-toast";
    toast.setAttribute("role", "status");
    toast.hidden = true;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(feedbackToastTimer);
  feedbackToastTimer = window.setTimeout(() => {
    toast!.hidden = true;
  }, 4500);
}

/** Open a PostHog popover survey by id (ignores delay/URL rules for the Feedback button). */
function openFeedbackSurvey(surveyId: string): void {
  posthog.displaySurvey(surveyId, {
    displayType: DisplaySurveyType.Popover,
    ignoreConditions: true,
    ignoreDelay: true,
  });
}

/** Try env survey id, then matching surveys, then any active popover/API survey. */
function tryShowFeedbackSurvey(): void {
  const envSurveyId = window.__ANALYTICS_CONFIG__?.feedbackSurveyId?.trim();
  if (envSurveyId) {
    openFeedbackSurvey(envSurveyId);
    return;
  }

  const openFirstSurvey = (
    surveys: Array<{ id?: string; type?: string }>
  ): boolean => {
    const match =
      surveys.find((s) => s.type === "popover" || s.type === "api") ??
      surveys[0];
    if (!match?.id) return false;
    openFeedbackSurvey(match.id);
    return true;
  };

  // Event-triggered surveys may not match immediately after the click event.
  posthog.getActiveMatchingSurveys((surveys) => {
    if (openFirstSurvey(surveys)) return;

    posthog.getSurveys((allSurveys) => {
      if (openFirstSurvey(allSurveys)) return;

      showFeedbackToast(
        "Thanks — feedback isn't set up yet. We'll add a short form here soon."
      );
    }, true);
  }, true);
}

/** Feedback button — fires analytics event and opens a PostHog survey when configured. */
export function triggerFeedback(): void {
  if (!analyticsReady) {
    showFeedbackToast("Feedback isn't available right now. Try again later.");
    return;
  }

  trackEvent("feedback_link_clicked");

  // Surveys load async; retry once so event-triggered rules can catch up.
  const run = (): void => {
    posthog.onSurveysLoaded(() => {
      tryShowFeedbackSurvey();
    });
  };
  run();
  window.setTimeout(run, 400);
}
