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
    // Surveys extension is on by default — popover surveys show per dashboard rules.
    capture_pageview: false,
    persistence: "localStorage+cookie",
  });

  analyticsReady = true;
  posthog.capture("app_loaded");
}

/** Fire a custom event when analytics is active. */
export function trackEvent(
  name: string,
  properties?: Record<string, string | number | boolean>
): void {
  if (!analyticsReady) return;
  posthog.capture(name, properties);
}

/** Screen change from showScreen() — search, results, or favorites. */
export function trackScreenView(screen: "search" | "results" | "favorites"): void {
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

/** Feedback link — event for survey triggers; optional forced popover survey. */
export function triggerFeedback(): void {
  trackEvent("feedback_link_clicked");

  const surveyId = window.__ANALYTICS_CONFIG__?.feedbackSurveyId?.trim();
  if (!surveyId || !analyticsReady) return;

  posthog.displaySurvey(surveyId, {
    displayType: DisplaySurveyType.Popover,
    ignoreConditions: true,
    ignoreDelay: true,
  });
}
