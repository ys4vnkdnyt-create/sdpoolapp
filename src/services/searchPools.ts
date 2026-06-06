import type {
  GeoLocation,
  NoSchedulePoolResult,
  Pool,
  PoolSearchResult,
  SearchPoolsOutput,
  SearchQuery,
  SortBy,
  UnavailablePoolResult,
} from "../types/index.js";
import {
  distanceMiles,
  milesToEstimatedDriveMinutes,
} from "./distance.js";
import { prepareAvailabilityForSearch } from "./scheduleWindows.js";

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
  // New venues (placeholder drive times until maps API)
  "coggan-family-aquatic-complex": 22,
  "coronado-aquatics-center": 28,
  "brian-bent-memorial-aquatics": 30,
  "mission-valley-ymca": 18,
  "dan-mckinney-ymca": 20,
  "toby-wells-ymca": 21,
  "magdalena-ecke-ymca": 35,
  "south-bay-family-ymca": 32,
  "copley-price-ymca": 17,
  "rancho-family-ymca": 28,
  "cameron-family-ymca": 28,
  "border-view-family-ymca": 32,
  "john-a-davis-family-ymca": 22,
  "mcgrath-family-ymca": 26,
  "joe-mary-mottino-family-ymca": 38,
  "jackie-robinson-family-ymca": 18,
  "24-hour-fitness-balboa": 19,
  "24-hour-fitness-la-jolla-village": 24,
  "24-hour-fitness-rancho-penasquitos": 30,
  "la-fitness-mission-valley": 16,
  "ucsd-canyonview-pool": 26,
  "ned-baumer-pool": 28,
  "standley-aquatic-center": 25,
  "kroc-center-pool": 19,
  "pardee-aquatics-center": 32,
  "lfjcc-pool": 23,
  "admiral-prout-pool": 27,
  "mcas-miramar-pool": 26,
  "admiral-baker-pool": 24,
  // North County / South Bay / military expansion (placeholder until maps API)
  "alga-norte-aquatic-center": 38,
  "carlsbad-monroe-swim-complex": 36,
  "oceanside-brooks-street-pool": 42,
  "oceanside-wagner-aquatic-center": 40,
  "oceanside-marshall-street-pool": 41,
  "poway-community-swim-center": 28,
  "escondido-james-stone-pool": 34,
  "palomar-family-ymca": 36,
  "las-posas-pool-san-marcos": 32,
  "woodland-park-pool-san-marcos": 31,
  "vista-wave-aquatic": 38,
  "chula-vista-loma-verde-aquatic": 30,
  "chula-vista-parkway-aquatic": 28,
  "national-city-las-palmas-pool": 18,
  "la-mesa-municipal-pool": 20,
  "usd-sports-center-pool": 19,
  "southwestern-college-aquatics": 26,
  "camp-pendleton-13-area-pool": 48,
  "el-cajon-fletcher-hills-pool": 24,
  "grossmont-high-school-pool": 22,
  "helix-high-school-pool": 21,
  "santee-santana-high-school-pool": 25,
  "lakeside-el-capitan-pool": 30,
  "scripps-ranch-swim-racquet-club": 27,
  "poway-rancho-arbolitos-pool": 29,
  // legacy sample ids (if you switch back to samplePools for demos)
  "la-jolla-ymca": 18,
  "ucsd-pool": 25,
  "coronado-community": 28,
};

/** Look up fake minutes; ?? 30 = default if id is missing from the table. */
function estimateDriveMinutes(pool: Pool): number {
  return ESTIMATED_DRIVE_MINUTES[pool.id] ?? 30;
}

/** True when pool is within optional max-drive filter (reuse for both result buckets). */
function isWithinMaxDrive(
  estimatedDriveMinutes: number,
  maxDriveMinutes: number | undefined
): boolean {
  if (maxDriveMinutes === undefined) return true;
  return estimatedDriveMinutes <= maxDriveMinutes;
}

/** True when pool is within the radius slider (GPS search). */
function isWithinRadiusMiles(
  miles: number,
  maxRadiusMiles: number | undefined
): boolean {
  if (maxRadiusMiles === undefined) return true;
  return miles <= maxRadiusMiles;
}

/** Drive minutes + miles for one pool — GPS when userLocation set, else V0 table. */
function poolDistanceMetrics(
  pool: Pool,
  userLocation: GeoLocation | undefined
): { estimatedDriveMinutes: number; distanceMiles?: number } {
  if (userLocation) {
    const miles = distanceMiles(userLocation, pool.location);
    return {
      distanceMiles: Math.round(miles * 10) / 10,
      estimatedDriveMinutes: milesToEstimatedDriveMinutes(miles),
    };
  }
  return { estimatedDriveMinutes: estimateDriveMinutes(pool) };
}

/** Apply radius / max-drive filter for the active distance mode. */
function isWithinSearchRadius(
  metrics: { estimatedDriveMinutes: number; distanceMiles?: number },
  query: SearchQuery
): boolean {
  if (query.userLocation && query.maxRadiusMiles !== undefined) {
    if (metrics.distanceMiles === undefined) return false;
    return isWithinRadiusMiles(metrics.distanceMiles, query.maxRadiusMiles);
  }
  return isWithinMaxDrive(metrics.estimatedDriveMinutes, query.maxDriveMinutes);
}

/** Subtitle for venues that appear closed in name or guest-pass notes. */
function poolStatusNote(pool: Pool): string | undefined {
  const haystack = `${pool.name} ${pool.guestPass.notes ?? ""}`.toLowerCase();
  if (haystack.includes("closed")) return "Closed";
  return undefined;
}

/** Sort open-lane results by distance or guest-pass cost. */
function sortOpenResults(
  results: PoolSearchResult[],
  sortBy: SortBy
): PoolSearchResult[] {
  if (sortBy === "cost") {
    return results.sort(
      (a, b) =>
        a.guestPassCostUsd - b.guestPassCostUsd ||
        a.estimatedDriveMinutes - b.estimatedDriveMinutes
    );
  }

  return results.sort((a, b) => {
    const distA = a.distanceMiles ?? a.estimatedDriveMinutes;
    const distB = b.distanceMiles ?? b.estimatedDriveMinutes;
    return distA - distB || a.guestPassCostUsd - b.guestPassCostUsd;
  });
}

/** Short weekday name for exclusion messages. */
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** "09:00" → "9:00 AM" for user-facing schedule hints. */
function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = Number(hStr);
  const m = mStr ?? "00";
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

/** Explain why a pool with schedule data is not in open-lane results. */
function exclusionReasonForPool(
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6,
  dayWindows: ReturnType<typeof prepareAvailabilityForSearch>
): string {
  const dayName = WEEKDAY_NAMES[day];

  if (dayWindows.length === 0) {
    return `No lap swim scheduled on ${dayName}s.`;
  }

  const ranges = dayWindows
    .map(
      (w) =>
        `${formatTime12h(w.startTime)}–${formatTime12h(w.endTime)}`
    )
    .join(", ");

  return `No lap lanes open at your time. ${dayName} lap swim: ${ranges}.`;
}

/** In-radius pools with schedule but no lane window at the requested date/time. */
function findUnavailablePools(
  pools: Pool[],
  query: SearchQuery,
  openPoolIds: Set<string>
): UnavailablePoolResult[] {
  const day = getDayOfWeek(query.date);
  const requestMinutes = timeToMinutes(query.time);
  const unavailable: UnavailablePoolResult[] = [];

  for (const pool of pools) {
    if (openPoolIds.has(pool.id)) continue;
    if (pool.availability.length === 0) continue;

    const scheduleWindows = prepareAvailabilityForSearch(pool.availability);
    const matchingWindow = scheduleWindows.find(
      (w) =>
        w.dayOfWeek === day &&
        isTimeInWindow(requestMinutes, w.startTime, w.endTime)
    );
    if (matchingWindow) continue;

    const metrics = poolDistanceMetrics(pool, query.userLocation);
    if (!isWithinSearchRadius(metrics, query)) continue;

    const dayWindows = scheduleWindows.filter((w) => w.dayOfWeek === day);
    unavailable.push({
      pool,
      estimatedDriveMinutes: metrics.estimatedDriveMinutes,
      guestPassCostUsd: pool.guestPass.costUsd,
      distanceMiles: metrics.distanceMiles,
      exclusionReason: exclusionReasonForPool(day, dayWindows),
    });
  }

  return unavailable.sort((a, b) => {
    const distA = a.distanceMiles ?? a.estimatedDriveMinutes;
    const distB = b.distanceMiles ?? b.estimatedDriveMinutes;
    return distA - distB;
  });
}

/** Collect in-radius pools with empty availability[] (not shown as lanes open). */
function findNoSchedulePools(
  pools: Pool[],
  query: SearchQuery
): NoSchedulePoolResult[] {
  const noSchedule: NoSchedulePoolResult[] = [];

  for (const pool of pools) {
    if (pool.availability.length > 0) continue;

    const metrics = poolDistanceMetrics(pool, query.userLocation);
    if (!isWithinSearchRadius(metrics, query)) continue;

    noSchedule.push({
      pool,
      estimatedDriveMinutes: metrics.estimatedDriveMinutes,
      guestPassCostUsd: pool.guestPass.costUsd,
      hasScheduleData: false,
      statusNote: poolStatusNote(pool),
      distanceMiles: metrics.distanceMiles,
    });
  }

  // Always nearest-first for optional venues (independent of cost sort).
  return noSchedule.sort((a, b) => {
    const distA = a.distanceMiles ?? a.estimatedDriveMinutes;
    const distB = b.distanceMiles ?? b.estimatedDriveMinutes;
    return distA - distB;
  });
}

/**
 * Kitchen: given all pools and a query, return matching pools sorted by
 * query.sortBy (distance or cost; defaults to distance), plus nearby pools
 * with no schedule data when they fall within the radius filter.
 */
export function searchPools(pools: Pool[], query: SearchQuery): SearchPoolsOutput {
  const day = getDayOfWeek(query.date);
  const requestMinutes = timeToMinutes(query.time);

  const results: PoolSearchResult[] = [];

  for (const pool of pools) {
    // Normalize per-day PDF rows, then treat gaps between blocks as open (scheduleWindows.ts).
    const scheduleWindows = prepareAvailabilityForSearch(pool.availability);

    // find first schedule window that matches this weekday and time
    const matchingWindow = scheduleWindows.find(
      (w) =>
        w.dayOfWeek === day &&
        isTimeInWindow(requestMinutes, w.startTime, w.endTime)
    );

    if (!matchingWindow) continue; // no lane window → skip this pool

    const metrics = poolDistanceMetrics(pool, query.userLocation);
    if (!isWithinSearchRadius(metrics, query)) continue;

    results.push({
      pool,
      lanesAvailable: matchingWindow.lanesAvailable,
      estimatedDriveMinutes: metrics.estimatedDriveMinutes,
      guestPassCostUsd: pool.guestPass.costUsd,
      distanceMiles: metrics.distanceMiles,
    });
  }

  const sortBy = query.sortBy ?? "distance";
  const openPoolIds = new Set(results.map((r) => r.pool.id));

  return {
    results: sortOpenResults(results, sortBy),
    noSchedulePools: findNoSchedulePools(pools, query),
    unavailablePools: findUnavailablePools(pools, query, openPoolIds),
  };
}
