/**
 * Menu definitions: shapes every other file must follow.
 * Interfaces = checklists; they disappear when code compiles (no runtime cost).
 */

/** A point on the map (latitude / longitude). */
export interface GeoLocation {
  lat: number; // north–south
  lng: number; // east–west
}

/** Day-pass price and optional fine print. */
export interface GuestPassInfo {
  costUsd: number;
  notes?: string; // ? = optional field
}

/**
 * One recurring lap-lane window (same every week for now).
 * Later we may add one-off date overrides (holidays, closures).
 */
export interface LaneAvailabilityWindow {
  /** 0 = Sunday … 6 = Saturday (matches JavaScript Date.getDay()) */
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string; // inclusive start, 24h "HH:mm"
  endTime: string; // exclusive end — 08:00 means slot ends just before 8am
  lanesAvailable: number;
}

/** Where weekly lane windows came from (PDF, web page, etc.). */
export interface ScheduleSource {
  label: string; // human-readable, e.g. "YMCA pool schedule PDF"
  url: string;
  effectiveDate: string; // ISO YYYY-MM-DD — "effective" date on the document
}

/** Everything we store about one pool. */
export interface Pool {
  id: string; // stable key, e.g. for fake drive-time lookup
  name: string;
  address: string;
  location: GeoLocation;
  guestPass: GuestPassInfo;
  availability: LaneAvailabilityWindow[]; // list of weekly windows
  scheduleSource?: ScheduleSource; // set when data is from a real published schedule
  /** Military base pool — access may require ID / sponsor; UI shows * on name. */
  military?: boolean;
  /** Facility homepage (hours, directions) — separate from schedule PDF when set. */
  websiteUrl?: string;
  /** Front desk / aquatics desk — shown as Call on pool cards. */
  contactPhone?: string;
}

/** How to order results after the funnel (kitchen applies this at the end). */
export type SortBy = "distance" | "cost";

/** What the user wants: a date, a time, and optional filters. */
export interface SearchQuery {
  date: string; // ISO YYYY-MM-DD
  time: string; // 24h HH:mm
  maxDriveMinutes?: number; // skip pools farther than this (placeholder drive table)
  /** When set with userLocation, filter by straight-line miles (from radius slider). */
  maxRadiusMiles?: number;
  sortBy?: SortBy; // optional; kitchen defaults to "distance" when omitted
  userLocation?: GeoLocation;
}

/** One line in the printed / UI results list. */
export interface PoolSearchResult {
  pool: Pool;
  lanesAvailable: number;
  estimatedDriveMinutes: number;
  guestPassCostUsd: number;
  /** Set when search used the user's GPS location for distance. */
  distanceMiles?: number;
}

/** Nearby pool with no transcribed lap schedule — shown separately, not as "open". */
export interface NoSchedulePoolResult {
  pool: Pool;
  estimatedDriveMinutes: number;
  guestPassCostUsd: number;
  /** Always false — signals empty availability[] in the pantry. */
  hasScheduleData: false;
  /** Short subtitle when notes/name imply closure (e.g. Clairemont). */
  statusNote?: string;
  distanceMiles?: number;
}

/** Full kitchen output: open lanes plus optional nearby venues without schedule data. */
export interface SearchPoolsOutput {
  results: PoolSearchResult[];
  noSchedulePools: NoSchedulePoolResult[];
}
