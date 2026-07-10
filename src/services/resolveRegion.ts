import type { Region } from "../data/regions.js";
import { getAllRegions } from "../data/regions.js";
import type { GeoLocation } from "../types/index.js";
import { distanceMiles } from "./distance.js";

/**
 * Pick the nearest region whose center is within maxDistanceMiles of the user.
 * Returns null when no region is close enough (e.g. tester outside all coverage).
 */
export function resolveRegionForLocation(
  location: GeoLocation,
  regions: Region[] = getAllRegions()
): Region | null {
  let best: Region | null = null;
  let bestDistance = Infinity;

  for (const region of regions) {
    const miles = distanceMiles(location, region.center);
    if (miles <= region.maxDistanceMiles && miles < bestDistance) {
      best = region;
      bestDistance = miles;
    }
  }

  return best;
}
