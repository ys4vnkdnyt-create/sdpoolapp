// Counter: wires pantry + kitchen, prints to the terminal (CLI).
import { pools } from "./data/pools/index.js";
import { searchPools } from "./services/searchPools.js";
import type { SearchQuery, SortBy } from "./types/index.js";

/** Product cap: we do not search pools more than one hour away (for now). */
const MAX_DRIVE_MINUTES = 60;

/** Turn optional CLI word into sortBy, or undefined (kitchen defaults to distance). */
function parseSortBy(arg: string | undefined): SortBy | undefined {
  if (arg === "cost") return "cost";
  if (arg === "distance") return "distance";
  return undefined;
}

/** Turn optional CLI word into maxDriveMinutes; warn and return undefined if invalid. */
function parseMaxDriveMinutes(arg: string | undefined): number | undefined {
  if (arg === undefined) return undefined;

  const minutes = Number(arg);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    console.warn(
      `(Ignoring max drive "${arg}"; pass a positive number of minutes.)\n`
    );
    return undefined;
  }

  // Cap at one hour — product rule, not a technical limit
  if (minutes > MAX_DRIVE_MINUTES) {
    console.warn(
      `(Max drive capped at ${MAX_DRIVE_MINUTES} min (1 hour); you passed ${minutes}.)\n`
    );
    return MAX_DRIVE_MINUTES;
  }

  return minutes;
}

/**
 * Read date, time, and optional sort / max drive from command-line args.
 * argv[2]=date, [3]=time, [4]=sort or maxDrive, [5]=maxDrive when [4] is sort.
 */
function parseArgs(argv: string[]): SearchQuery | null {
  // Usage: npm run dev -- 2026-05-20 06:30 [distance|cost] [maxDriveMinutes]
  const [, , date, time, arg4, arg5] = argv; // skip node path and script path
  if (!date || !time) return null; // caller will use demo defaults

  let sortBy: SortBy | undefined;
  let maxDriveMinutes: number | undefined;

  const sortFromArg4 = parseSortBy(arg4);
  if (sortFromArg4) {
    // arg4 is sort; optional arg5 is max drive cap
    sortBy = sortFromArg4;
    maxDriveMinutes = parseMaxDriveMinutes(arg5);
  } else if (arg4) {
    // arg4 is not sort — try as max drive only (e.g. npm run dev -- date time 20)
    maxDriveMinutes = parseMaxDriveMinutes(arg4);
    if (maxDriveMinutes === undefined) {
      console.warn(
        `(Ignoring "${arg4}"; use sort "distance" or "cost", or a positive number for max drive.)\n`
      );
    }
  }

  // Build query: only include optional fields when set (keeps object small)
  const query: SearchQuery = { date, time };
  if (sortBy) query.sortBy = sortBy;
  if (maxDriveMinutes !== undefined) query.maxDriveMinutes = maxDriveMinutes;
  return query;
}

/** Print a human-readable list of search results (or a no-match message). */
function printResults(query: SearchQuery, results: ReturnType<typeof searchPools>): void {
  const sortLabel = query.sortBy === "cost" ? "cheapest guest pass" : "nearest";
  console.log(`\nLap lanes near you — ${query.date} at ${query.time}`);
  console.log(`Sorted by: ${sortLabel}`);
  if (query.maxDriveMinutes !== undefined) {
    console.log(`Max drive: ${query.maxDriveMinutes} min`);
  }
  console.log("");

  if (results.length === 0) {
    console.log("No pools with lap lanes in that window (sample data only).\n");
    return;
  }

  for (const r of results) {
    console.log(`• ${r.pool.name}`);
    console.log(`  ${r.pool.address}`);
    console.log(`  Lanes available: ${r.lanesAvailable}`);
    console.log(`  Drive ~${r.estimatedDriveMinutes} min`);
    console.log(`  Guest pass: $${r.guestPassCostUsd}`);
    console.log("");
  }
}

// --- Run once when Node starts this file ---

const parsed = parseArgs(process.argv);

// Demo query if you did not pass date/time on the command line
const query: SearchQuery =
  parsed ?? {
    date: "2026-05-18", // Monday in sample data
    time: "06:30",
    maxDriveMinutes: MAX_DRIVE_MINUTES, // demo: search within one hour
  };

if (!parsed) {
  console.log(
    "(Using demo query; npm run dev -- 2026-05-18 06:30 [distance|cost] [maxDriveMinutes])\n"
  );
}

const results = searchPools(pools, query);
printResults(query, results);
