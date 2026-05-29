import type { Pool, PoolSearchResult, SearchQuery } from "../types/index.js";

/** Turn "06:30" into minutes since midnight so we can compare times as numbers. */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number); // split "HH:mm", parse both parts
  return h * 60 + m;
}

/** Turn "2026-05-18" into weekday 0–6 (noon avoids timezone edge cases on the date). */
function getDayOfWeek(isoDate: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/** True if request time falls inside [start, end) — end is exclusive. */
function isTimeInWindow(
  requestMinutes: number,
  startTime: string,
  endTime: string
): boolean {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return requestMinutes >= start && requestMinutes < end;
}

/** V0 placeholder drive times by pool id (replace with maps API later). */
const ESTIMATED_DRIVE_MINUTES: Record<string, number> = {
  "ryan-family-ymca": 20,
  "plunge-san-diego": 22,
  "allied-gardens-pool": 24,
  "bud-kearns-pool": 14,
  "carmel-mountain-pool": 32,
  "carmel-valley-pool": 30,
  "city-heights-pool": 16,
  "clairemont-pool": 20,
  "kearny-mesa-pool": 22,
  "colina-del-sol-pool": 15,
  "memorial-pool": 17,
  "mlk-pool": 18,
  "swanson-pool": 26,
  "vista-terrace-pool": 30,
  "tierrasanta-pool": 23,
  // legacy sample ids (if you switch back to samplePools for demos)
  "la-jolla-ymca": 18,
  "mission-valley-ymca": 22,
  "ucsd-pool": 25,
  "coronado-community": 28,
};

/** Look up fake minutes; ?? 30 = default if id is missing from the table. */
function estimateDriveMinutes(pool: Pool): number {
  return ESTIMATED_DRIVE_MINUTES[pool.id] ?? 30;
}

/**
 * Kitchen: given all pools and a query, return matching pools sorted by
 * query.sortBy (distance or cost; defaults to distance).
 */
export function searchPools(pools: Pool[], query: SearchQuery): PoolSearchResult[] {
  const day = getDayOfWeek(query.date);
  const requestMinutes = timeToMinutes(query.time);

  const results: PoolSearchResult[] = [];

  for (const pool of pools) {
    // find first schedule window that matches this weekday and time
    const matchingWindow = pool.availability.find(
      (w) =>
        w.dayOfWeek === day &&
        isTimeInWindow(requestMinutes, w.startTime, w.endTime)
    );

    if (!matchingWindow) continue; // no lane window → skip this pool

    const estimatedDriveMinutes = estimateDriveMinutes(pool);

    // optional filter: drop pools that are "too far" for this query
    if (
      query.maxDriveMinutes !== undefined &&
      estimatedDriveMinutes > query.maxDriveMinutes
    ) {
      continue;
    }

    results.push({
      pool,
      lanesAvailable: matchingWindow.lanesAvailable,
      estimatedDriveMinutes,
      guestPassCostUsd: pool.guestPass.costUsd,
    });
  }

  // Default matches old behavior when CLI does not pass sortBy yet (Step 3)
  const sortBy = query.sortBy ?? "distance";

  if (sortBy === "cost") {
    // Cheapest guest pass first; if tie, nearer pool first
    return results.sort(
      (a, b) =>
        a.guestPassCostUsd - b.guestPassCostUsd ||
        a.estimatedDriveMinutes - b.estimatedDriveMinutes
    );
  }

  // distance: nearer first; if tie, cheaper guest pass first
  return results.sort(
    (a, b) =>
      a.estimatedDriveMinutes - b.estimatedDriveMinutes ||
      a.guestPassCostUsd - b.guestPassCostUsd
  );
}
