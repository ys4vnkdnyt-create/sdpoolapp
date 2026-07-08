/**
 * CLI for the region ingest pipeline.
 *
 * Examples:
 *   npm run ingest -- --region san-diego --dry-run --limit 3
 *   npm run ingest -- --region austin --center 30.2672,-97.7431 --radius-miles 50 --display-name Austin
 *   npm run ingest -- --region san-diego --retry-no-schedule --limit 5
 *
 * Optional env (auto-loaded from .env in project root):
 *   OPENAI_API_KEY — auto-transcribe HTML/PDF schedule pages
 *   INGEST_DELAY_MS — pause between pool fetches (default 800)
 */
import { loadDotEnv } from "./loadEnv.js";
import { getRegionById } from "../data/regions.js";
import { runIngestPipeline, printIngestReport } from "./pipeline.js";
import type { IngestOptions } from "./types.js";

/** Parse "lat,lng" from --center. */
function parseCenter(value: string | undefined): { lat: number; lng: number } | null {
  if (!value) return null;
  const [latStr, lngStr] = value.split(",").map((s) => s.trim());
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Parse positive integer from --limit. */
function parseLimit(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Parse non-negative integer from --skip. */
function parseSkip(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/** Print usage when args are missing or invalid. */
function printHelp(): void {
  console.log(`
Lap Lane Finder — region ingest pipeline

Discover public pools (OpenStreetMap) near a map center, try to find lap schedules,
and write a draft JSON pantry file for your review.

Usage:
  npm run ingest -- --region <id> [options]

Options:
  --region <id>           Region slug (e.g. san-diego, austin)
  --center <lat,lng>      Map center (required for new regions not in regions.ts)
  --radius-miles <n>      Search radius (default: region config or 50)
  --display-name <name>   Label for reports (default: region id)
  --pools-file <file>     Pantry filename (default: <region>.json)
  --limit <n>             Process at most N new pools (or retries)
  --skip <n>              Skip first N empty-schedule pools (with --retry-no-schedule)
  --pool-id <id>          Re-run schedule ingest for one pantry pool (e.g. ryan-family-ymca)
  --ymca-pdf              Re-transcribe all YMCA pools with ymcasd.org PDF links
  --dry-run               Report only — do not write JSON
  --write-draft           Write src/data/pools/<region>.draft.json (default when not dry-run)
  --apply                 Write src/data/pools/<pools-file> (overwrites live data)
  --retry-no-schedule     Re-attempt schedule for existing pools with availability: []
  --skip-transcribe       Find schedule URLs only; do not call OpenAI

Environment (.env in project root is loaded automatically):
  OPENAI_API_KEY          Transcribe schedule pages/PDFs (required for auto-transcribe)
  OPENAI_VISION_MODEL     Vision PDF model (default gpt-4o)
  OPENAI_MODEL            Text fallback model (default gpt-4o-mini)
  INGEST_DELAY_MS         Milliseconds between HTTP requests (default 800)

Examples:
  npm run ingest -- --region san-diego --dry-run --limit 5
  npm run ingest -- --region san-diego --pool-id ryan-family-ymca
  npm run ingest -- --region san-diego --ymca-pdf --limit 3
  npm run ingest -- --region san-diego --retry-no-schedule --skip 5 --limit 3
  npm run ingest -- --region austin --center 30.2672,-97.7431 --radius-miles 50 --display-name Austin --limit 10
  npm run ingest -- --region san-diego --retry-no-schedule --limit 3 --skip-transcribe
`);
}

/** Build IngestOptions from process.argv. */
function parseCliArgs(argv: string[]): IngestOptions | null {
  const args = argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    if (i === -1 || i + 1 >= args.length) return undefined;
    return args[i + 1];
  };
  const has = (flag: string): boolean => args.includes(flag);

  const regionId = get("--region");
  if (!regionId) {
    printHelp();
    return null;
  }

  const known = getRegionById(regionId);
  const centerFromFlag = parseCenter(get("--center"));
  const center = centerFromFlag ?? known?.center;
  if (!center) {
    console.error(
      `Unknown region "${regionId}" and no --center provided. Add the region to src/data/regions.ts or pass --center lat,lng`
    );
    return null;
  }

  const radiusMiles = Number(get("--radius-miles")) || known?.maxDistanceMiles || 50;
  const displayName = get("--display-name") ?? known?.displayName ?? regionId;
  const poolsFile = get("--pools-file") ?? known?.poolsFile ?? `${regionId}.json`;
  const dryRun = has("--dry-run");
  const apply = has("--apply");

  return {
    regionId,
    center,
    radiusMiles,
    displayName,
    poolsFile,
    limit: parseLimit(get("--limit")),
    dryRun,
    writeDraft: !dryRun && (has("--write-draft") || !apply),
    apply: !dryRun && apply,
    retryNoSchedule: has("--retry-no-schedule"),
    skipTranscribe: has("--skip-transcribe"),
    poolId: get("--pool-id"),
    skip: parseSkip(get("--skip")),
    ymcaPdf: has("--ymca-pdf"),
  };
}

async function main(): Promise<void> {
  loadDotEnv();

  const options = parseCliArgs(process.argv);
  if (!options) {
    process.exitCode = 1;
    return;
  }

  if (options.apply) {
    console.warn(
      "\n⚠ --apply will overwrite the live pantry file. Review drafts first.\n"
    );
  }

  try {
    const report = await runIngestPipeline(options);
    printIngestReport(report);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}

void main();
