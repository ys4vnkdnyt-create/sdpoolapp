import type { GeoLocation, Pool, ScheduleSource } from "../types/index.js";

/** CLI options for the region ingest pipeline. */
export interface IngestOptions {
  /** Region slug used in filenames, e.g. "austin". */
  regionId: string;
  /** Map center for discovery (region center or explicit --center). */
  center: GeoLocation;
  /** Search radius in miles (defaults to region config or 50). */
  radiusMiles: number;
  /** Human label for reports, e.g. "Austin". */
  displayName: string;
  /** Pantry filename under src/data/pools/, e.g. "austin.json". */
  poolsFile: string;
  /** Max pools to process (useful while testing). */
  limit: number;
  /** When true, only print the report — no JSON written. */
  dryRun: boolean;
  /** Write {regionId}.draft.json (default output). */
  writeDraft: boolean;
  /** Overwrite src/data/pools/{poolsFile} — requires explicit flag. */
  apply: boolean;
  /** Re-attempt schedule fetch for existing pools with availability: []. */
  retryNoSchedule: boolean;
  /** Skip OpenAI even when OPENAI_API_KEY is set. */
  skipTranscribe: boolean;
  /** Re-run schedule ingest for one pantry pool id (e.g. ryan-family-ymca). */
  poolId?: string;
  /** Skip the first N pools in retry-no-schedule mode. */
  skip: number;
  /** Re-transcribe all YMCA pools with a ymcasd.org PDF schedule link. */
  ymcaPdf: boolean;
}

/** One pool row returned from OpenStreetMap discovery. */
export interface DiscoveredCandidate {
  osmId: string;
  name: string;
  address: string;
  location: GeoLocation;
  websiteUrl?: string;
  distanceMiles: number;
}

/** Result of trying to read a lap schedule for one pool. */
export interface ScheduleAttemptResult {
  availability: Pool["availability"];
  scheduleSource?: ScheduleSource;
  /** Why availability stayed empty (for the ingest report). */
  status: "transcribed" | "pdf_only" | "no_source" | "fetch_failed" | "skipped";
  detail?: string;
}

/** Summary printed after a pipeline run. */
export interface IngestReport {
  regionId: string;
  displayName: string;
  discovered: number;
  merged: number;
  transcribed: number;
  pdfOnly: number;
  noSchedule: number;
  skippedExisting: number;
  outputPath?: string;
  lines: string[];
}
