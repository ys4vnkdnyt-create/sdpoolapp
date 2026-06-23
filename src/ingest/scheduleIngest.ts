import type {
  LaneAvailabilityWindow,
  Pool,
  ScheduleSource,
} from "../types/index.js";
import { normalizeExplicitBlocks } from "../services/scheduleWindows.js";
import {
  buildScheduleSource,
  fetchSchedulePageText,
  findBestScheduleUrl,
} from "./fetchSchedule.js";
import type { DiscoveredCandidate, ScheduleAttemptResult } from "./types.js";
import { fetchPdfBuffer, fetchPdfScheduleText } from "./extractPdf.js";
import { pdfBufferToPngImages } from "./pdfToImages.js";
import { transcribeScheduleWithOpenAI } from "./transcribe.js";
import { transcribeScheduleFromPdfImages } from "./transcribeVision.js";

/** Default guest pass placeholder until a human verifies pricing. */
export function defaultGuestPass(): Pool["guestPass"] {
  return {
    costUsd: 0,
    notes:
      "Day pass unknown — verify at front desk (added by ingest agent; not confirmed).",
  };
}

/** Turn a discovered OSM row into a pantry Pool with empty availability. */
export function candidateToPool(
  candidate: DiscoveredCandidate,
  poolId: string
): Pool {
  const pool: Pool = {
    id: poolId,
    name: candidate.name,
    address: candidate.address,
    location: candidate.location,
    guestPass: defaultGuestPass(),
    availability: [],
  };
  if (candidate.websiteUrl) {
    pool.websiteUrl = candidate.websiteUrl;
  }
  return pool;
}

/** Validate one availability window from the LLM before saving. */
function isValidWindow(w: LaneAvailabilityWindow): boolean {
  if (w.dayOfWeek < 0 || w.dayOfWeek > 6) return false;
  if (!/^\d{2}:\d{2}$/.test(w.startTime) || !/^\d{2}:\d{2}$/.test(w.endTime)) {
    return false;
  }
  if (w.lanesAvailable < 1) return false;
  return true;
}

/** True when a URL path ends in .pdf (query strings ignored). */
function isPdfUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return url.toLowerCase().includes(".pdf");
  }
}

/** Fetch and optionally transcribe one known PDF schedule URL. */
async function ingestPdfUrl(
  pool: Pool,
  pdfUrl: string,
  skipTranscribe: boolean,
  existingSource?: ScheduleSource
): Promise<ScheduleAttemptResult> {
  const scheduleSource: ScheduleSource =
    existingSource ?? buildScheduleSource(pool.name, pdfUrl, "pdf");

  if (skipTranscribe || !process.env.OPENAI_API_KEY?.trim()) {
    return {
      availability: [],
      scheduleSource,
      status: "pdf_only",
      detail:
        "PDF found — set OPENAI_API_KEY to auto-transcribe, or transcribe manually",
    };
  }

  const pdfBuffer = await fetchPdfBuffer(pdfUrl);
  if (!pdfBuffer) {
    return {
      availability: [],
      scheduleSource,
      status: "pdf_only",
      detail: "PDF found but download failed — link saved",
    };
  }

  // Vision first — grid PDFs (YMCA, city pools) lose structure in plain text.
  let visionRanEmpty = false;
  try {
    const pngPages = await pdfBufferToPngImages(pdfBuffer);
    const visionWindows = await transcribeScheduleFromPdfImages(
      pool.name,
      pdfUrl,
      pngPages
    );
    const visionValid = visionWindows.filter(isValidWindow);
    if (visionValid.length > 0) {
      return {
        availability: normalizeExplicitBlocks(visionValid),
        scheduleSource,
        status: "transcribed",
        detail: `vision (${visionValid.length} windows)`,
      };
    }
    visionRanEmpty = pngPages.length > 0;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Fall through to text path unless vision hard-failed (auth/quota).
    if (/401|403|429/.test(msg)) {
      return {
        availability: [],
        scheduleSource,
        status: "fetch_failed",
        detail: `Vision transcription failed: ${msg}`,
      };
    }
  }

  // Text fallback when vision returns nothing or soft-fails.
  try {
    const text = await fetchPdfScheduleText(pdfUrl);
    if (!text) {
      return {
        availability: [],
        scheduleSource,
        status: "pdf_only",
        detail: visionRanEmpty
          ? "PDF read — no lap swim schedule found (closure or non-schedule doc)"
          : "PDF found but vision and text could not read it — link saved",
      };
    }

    const windows = await transcribeScheduleWithOpenAI(pool.name, pdfUrl, text);
    const valid = windows.filter(isValidWindow);
    if (valid.length === 0) {
      return {
        availability: [],
        scheduleSource,
        status: "pdf_only",
        detail: visionRanEmpty
          ? "PDF read — no lap swim schedule found"
          : "LLM returned no valid lap windows from PDF — link saved",
      };
    }
    return {
      availability: normalizeExplicitBlocks(valid),
      scheduleSource,
      status: "transcribed",
      detail: `text (${valid.length} windows)`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      availability: [],
      scheduleSource,
      status: "fetch_failed",
      detail: `PDF transcription failed: ${msg}`,
    };
  }
}

/** Attempt to find and transcribe a lap schedule for one pool. */
export async function ingestScheduleForPool(
  pool: Pool,
  skipTranscribe: boolean
): Promise<ScheduleAttemptResult> {
  const storedPdfUrl =
    pool.scheduleSource?.url && isPdfUrl(pool.scheduleSource.url)
      ? pool.scheduleSource.url
      : undefined;
  if (storedPdfUrl) {
    return ingestPdfUrl(pool, storedPdfUrl, skipTranscribe, pool.scheduleSource);
  }

  const startUrl = pool.websiteUrl ?? pool.scheduleSource?.url;
  if (!startUrl) {
    return { availability: [], status: "no_source", detail: "No website URL" };
  }

  const found = await findBestScheduleUrl(startUrl);
  if (!found) {
    if (pool.scheduleSource?.url) {
      if (isPdfUrl(pool.scheduleSource.url)) {
        return ingestPdfUrl(pool, pool.scheduleSource.url, skipTranscribe, pool.scheduleSource);
      }
      return {
        availability: [],
        scheduleSource: pool.scheduleSource,
        status: "pdf_only",
        detail: "Stored schedule link kept — could not scrape website for updates",
      };
    }
    return {
      availability: [],
      status: "no_source",
      detail: "No schedule link on website",
    };
  }

  const scheduleSource: ScheduleSource = buildScheduleSource(
    pool.name,
    found.url,
    found.kind
  );

  if (found.kind === "pdf") {
    return ingestPdfUrl(pool, found.url, skipTranscribe, scheduleSource);
  }

  const pageText = await fetchSchedulePageText(found.url);
  if (!pageText) {
    return {
      availability: [],
      scheduleSource,
      status: "fetch_failed",
      detail: "Could not read schedule page text",
    };
  }

  if (skipTranscribe || !process.env.OPENAI_API_KEY?.trim()) {
    return {
      availability: [],
      scheduleSource,
      status: "pdf_only",
      detail: "Schedule page found — set OPENAI_API_KEY to auto-transcribe",
    };
  }

  try {
    const windows = await transcribeScheduleWithOpenAI(
      pool.name,
      found.url,
      pageText
    );
    const valid = windows.filter(isValidWindow);
    if (valid.length === 0) {
      return {
        availability: [],
        scheduleSource,
        status: "no_source",
        detail: "LLM returned no valid lap windows",
      };
    }
    return {
      availability: normalizeExplicitBlocks(valid),
      scheduleSource,
      status: "transcribed",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      availability: [],
      scheduleSource,
      status: "fetch_failed",
      detail: `Transcription failed: ${msg}`,
    };
  }
}

/** Apply schedule attempt onto an existing pool object (mutates pool). */
export function applyScheduleAttempt(
  pool: Pool,
  result: ScheduleAttemptResult,
  options?: { preserveSourceOnMiss?: boolean }
): void {
  // Keep existing lanes when a retry misses — do not wipe good pantry data.
  if (result.status === "transcribed" || result.availability.length > 0) {
    pool.availability = result.availability;
  } else if (pool.availability.length === 0) {
    pool.availability = result.availability;
  }

  if (!result.scheduleSource) return;

  // PDF/HTML source found but not transcribed — always save the link for the UI.
  if (result.status === "pdf_only") {
    pool.scheduleSource = result.scheduleSource;
    return;
  }

  const preserve = options?.preserveSourceOnMiss ?? false;
  if (preserve && result.availability.length === 0 && pool.scheduleSource) {
    const next = result.scheduleSource.url.toLowerCase();
    const bad =
      next.startsWith("mailto:") ||
      next.startsWith("tel:") ||
      /pilates|yoga|membership-only|login/.test(next);
    if (bad) return;

    const existing = pool.scheduleSource.url.toLowerCase();
    const existingScore = scoreScheduleUrl(existing);
    const nextScore = scoreScheduleUrl(next);
    if (nextScore <= existingScore) return;
  }

  pool.scheduleSource = result.scheduleSource;
}

/** Score schedule URLs — shared with fetchSchedule (duplicated minimally for apply guard). */
function scoreScheduleUrl(url: string): number {
  const lower = url.toLowerCase();
  let score = 0;
  if (lower.endsWith(".pdf")) score += 4;
  if (/schedule|lap|aquatic|pool|program|swim/.test(lower)) score += 2;
  if (/ymca|recreation|sandiego\.gov|carlsbad|chulavista/.test(lower)) score += 1;
  if (lower.startsWith("mailto:") || lower.startsWith("tel:")) score -= 10;
  if (/rua|use-agreement|responsible-use|pilates|yoga/.test(lower)) score -= 8;
  return score;
}
