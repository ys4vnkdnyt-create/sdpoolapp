/** Strip HTML tags and collapse whitespace for LLM input. */
export function htmlToPlainText(html: string, maxChars = 14_000): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = withoutScripts
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, maxChars);
}

/** Resolve a possibly relative href against a page URL. */
export function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

/** Score schedule link candidates — higher = more likely a lap schedule. */
function scoreScheduleUrl(url: string): number {
  const lower = url.toLowerCase();
  let score = 0;
  if (lower.endsWith(".pdf")) score += 4;
  if (/schedule|lap|aquatic|pool|program|swim/.test(lower)) score += 2;
  if (/ymca|recreation|aquatics/.test(lower)) score += 1;
  if (/rua|use-agreement|responsible-use|student.*agreement/.test(lower)) score -= 8;
  return score;
}

/** Pull hrefs from HTML that might point at a lap schedule. */
export function findScheduleLinkCandidates(
  html: string,
  pageUrl: string
): string[] {
  const hrefRegex = /href=["']([^"']+)["']/gi;
  const seen = new Set<string>();
  const scored: Array<{ url: string; score: number }> = [];

  let match: RegExpExecArray | null;
  while ((match = hrefRegex.exec(html)) !== null) {
    const resolved = resolveUrl(match[1], pageUrl);
    if (!resolved || seen.has(resolved)) continue;
    if (resolved.startsWith("mailto:") || resolved.startsWith("tel:")) continue;
    seen.add(resolved);
    const score = scoreScheduleUrl(resolved);
    if (score >= 2) {
      scored.push({ url: resolved, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.url)
    .slice(0, 8);
}

/** Fetch a URL with a timeout and a simple bot User-Agent. */
export async function fetchUrlText(
  url: string,
  timeoutMs = 20_000
): Promise<{ contentType: string; body: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "LapLaneFinder-Ingest/0.1 (schedule research; contact via github)",
        Accept: "text/html,application/pdf,*/*",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const contentType = res.headers.get("content-type") ?? "";
    const body = await res.text();
    return { contentType, body };
  } finally {
    clearTimeout(timer);
  }
}

/** True when the response looks like a PDF rather than HTML. */
export function isPdfResponse(contentType: string, url: string): boolean {
  if (contentType.includes("application/pdf")) return true;
  return url.toLowerCase().split("?")[0].endsWith(".pdf");
}

/** Today's date as ISO YYYY-MM-DD for scheduleSource.effectiveDate. */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Build a scheduleSource object for a found URL. */
export function buildScheduleSource(
  poolName: string,
  url: string,
  kind: "pdf" | "web"
): { label: string; url: string; effectiveDate: string } {
  const label =
    kind === "pdf"
      ? `${poolName} — lap schedule PDF (ingest agent; verify before trusting)`
      : `${poolName} — lap schedule page (ingest agent; verify before trusting)`;
  return {
    label,
    url,
    effectiveDate: todayIsoDate(),
  };
}

/** Try homepage first, then best schedule link from that page. */
export async function findBestScheduleUrl(
  websiteUrl: string
): Promise<{ url: string; kind: "pdf" | "web" } | null> {
  const normalized = websiteUrl.startsWith("http")
    ? websiteUrl
    : `https://${websiteUrl}`;

  try {
    const home = await fetchUrlText(normalized);
    if (isPdfResponse(home.contentType, normalized)) {
      return { url: normalized, kind: "pdf" };
    }

    const candidates = findScheduleLinkCandidates(home.body, normalized);
    if (candidates.length === 0) return null;

    const best = candidates[0];
    return {
      url: best,
      kind: best.toLowerCase().includes(".pdf") ? "pdf" : "web",
    };
  } catch {
    return null;
  }
}

/** Fetch schedule page text when the source is HTML (not PDF). */
export async function fetchSchedulePageText(
  url: string
): Promise<string | null> {
  try {
    const { contentType, body } = await fetchUrlText(url);
    if (isPdfResponse(contentType, url)) return null;
    const text = htmlToPlainText(body);
    return text.length >= 80 ? text : null;
  } catch {
    return null;
  }
}
