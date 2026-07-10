import type { Region } from "../data/regions.js";
import { getAllRegions } from "../data/regions.js";
import type { GeoLocation } from "../types/index.js";
import { distanceMiles } from "./distance.js";

/** Nearest metro to a GPS point, plus whether the user is inside that metro's radius. */
export interface RegionProximity {
  region: Region;
  /** Miles from user to the region center (one decimal). */
  distanceMiles: number;
  /** True when distance <= region.maxDistanceMiles (in coverage for auto-match). */
  inCoverage: boolean;
}

/** GPS match: best in-coverage metro (nearest among overlaps) + closest center overall. */
export interface RegionGpsMatch {
  /** Nearest metro whose radius contains the user; null when outside all radii. */
  inCoverage: RegionProximity | null;
  /** Closest metro center regardless of radius (for browse suggestions). */
  nearestOverall: RegionProximity | null;
}

/** Score every region — used for overlap (e.g. Denver vs Boulder corridor). */
export function resolveRegionGpsMatch(
  location: GeoLocation,
  regions: Region[] = getAllRegions()
): RegionGpsMatch {
  const inCoverageMatches: RegionProximity[] = [];
  let nearestOverall: RegionProximity | null = null;
  let nearestMiles = Infinity;

  for (const region of regions) {
    const miles = distanceMiles(location, region.center);
    const proximity: RegionProximity = {
      region,
      distanceMiles: Math.round(miles * 10) / 10,
      inCoverage: miles <= region.maxDistanceMiles,
    };

    if (miles < nearestMiles) {
      nearestMiles = miles;
      nearestOverall = proximity;
    }
    if (proximity.inCoverage) {
      inCoverageMatches.push(proximity);
    }
  }

  inCoverageMatches.sort((a, b) => a.distanceMiles - b.distanceMiles);

  return {
    inCoverage: inCoverageMatches[0] ?? null,
    nearestOverall,
  };
}

/** Closest region center only (legacy helper). */
export function resolveRegionProximity(
  location: GeoLocation,
  regions: Region[] = getAllRegions()
): RegionProximity | null {
  return resolveRegionGpsMatch(location, regions).nearestOverall;
}

/**
 * Pick the nearest region whose center is within maxDistanceMiles of the user.
 * When several overlap, returns the closest center among in-coverage metros.
 */
export function resolveRegionForLocation(
  location: GeoLocation,
  regions: Region[] = getAllRegions()
): Region | null {
  return resolveRegionGpsMatch(location, regions).inCoverage?.region ?? null;
}
