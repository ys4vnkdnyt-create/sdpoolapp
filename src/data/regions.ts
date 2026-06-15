import type { GeoLocation } from "../types/index.js";

/** One metro area the app can serve (pools live in a separate JSON file). */
export interface Region {
  id: string;
  displayName: string;
  /** Fallback map center when GPS is unavailable (also used for region matching). */
  center: GeoLocation;
  /** User must be within this many miles of center to count as "in" the region. */
  maxDistanceMiles: number;
  /** Pool pantry filename under dist/data/pools/ (and src/data/pools/). */
  poolsFile: string;
}

/** Default region when GPS is denied or unavailable (only one region today). */
export const DEFAULT_REGION_ID = "san-diego";

/** All regions shipped in this deploy — add entries here when a new city is ready. */
export const REGIONS: Region[] = [
  {
    id: "san-diego",
    displayName: "San Diego",
    center: { lat: 32.7157, lng: -117.1611 },
    maxDistanceMiles: 80,
    poolsFile: "san-diego.json",
  },
  {
    id: "phoenix",
    displayName: "Phoenix",
    center: { lat: 33.4484, lng: -112.074 },
    maxDistanceMiles: 50,
    poolsFile: "phoenix.json",
  },
];

/** Look up a region by id; undefined when the id is unknown. */
export function getRegionById(regionId: string): Region | undefined {
  return REGIONS.find((r) => r.id === regionId);
}

/** Default region config (San Diego until more cities are added). */
export function getDefaultRegion(): Region {
  const region = getRegionById(DEFAULT_REGION_ID);
  if (!region) {
    throw new Error(`Default region "${DEFAULT_REGION_ID}" is missing from REGIONS`);
  }
  return region;
}
