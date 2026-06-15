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
import { transcribeScheduleWithOpenAI } from "./transcribe.js";
import { fetchPdfScheduleText } from "./extractPdf.js";

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

/** Attempt to find and transcribe a lap schedule for one pool. */
export async function ingestScheduleForPool(
  pool: Pool,
  skipTranscribe: boolean
): Promise<ScheduleAttemptResult> {
  const startUrl = pool.websiteUrl;
  if (!startUrl) {
    return { availability: [], status: "no_source", detail: "No website URL" };
  }

  const found = await findBestScheduleUrl(startUrl);
  if (!found) {
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
    if (skipTranscribe || !process.env.OPENAI_API_KEY?.trim()) {
      return {
        availability: [],
        scheduleSource,
        status: "pdf_only",
        detail:
          "PDF found — set OPENAI_API_KEY to auto-transcribe, or transcribe manually",
      };
    }

    const pdfText = await fetchPdfScheduleText(found.url);
    if (!pdfText) {
      return {
        availability: [],
        status: "no_source",
        detail: "PDF is not a lap schedule (or could not read it)",
      };
    }

    try {
      const windows = await transcribeScheduleWithOpenAI(
        pool.name,
        found.url,
        pdfText
      );
      const valid = windows.filter(isValidWindow);
      if (valid.length === 0) {
        return {
          availability: [],
          scheduleSource,
          status: "no_source",
          detail: "LLM returned no valid lap windows from PDF",
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
        detail: `PDF transcription failed: ${msg}`,
      };
    }
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
  pool.availability = result.availability;

  if (!result.scheduleSource) return;

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
