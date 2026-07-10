import type { GeoLocation } from "../types/index.js";
import { distanceMiles } from "../services/distance.js";
import { isLikelyNonLapPool } from "./poolNoiseFilter.js";
import type { DiscoveredCandidate } from "./types.js";

/** Miles → meters for the Overpass `around:` filter. */
function milesToMeters(miles: number): number {
  return Math.round(miles * 1609.34);
}

/** Build a street address string from OSM addr:* tags. */
function formatOsmAddress(tags: Record<string, string>): string {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"],
    tags["addr:state"],
    tags["addr:postcode"],
  ].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return tags["addr:full"] ?? "Address not listed";
}

/** Parse one Overpass element into a candidate, or null when unusable. */
function parseOverpassElement(
  el: OverpassElement,
  center: GeoLocation
): DiscoveredCandidate | null {
  const tags = el.tags ?? {};
  const name = tags.name ?? tags.operator;
  if (!name) return null;
  if (isLikelyNonLapPool(name, tags)) return null;

  let lat = el.lat;
  let lng = el.lon;
  if ((lat === undefined || lng === undefined) && el.center) {
    lat = el.center.lat;
    lng = el.center.lon;
  }
  if (lat === undefined || lng === undefined) return null;

  const location = { lat, lng };
  const websiteUrl = tags.website ?? tags["contact:website"];

  return {
    osmId: `${el.type}/${el.id}`,
    name,
    address: formatOsmAddress(tags),
    location,
    websiteUrl: websiteUrl?.trim() || undefined,
    distanceMiles: Math.round(distanceMiles(center, location) * 10) / 10,
  };
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

/** Run one Overpass query (GET) with one retry on 429/504. */
async function queryOverpass(
  overpassUrl: string,
  query: string
): Promise<OverpassResponse> {
  const requestUrl = `${overpassUrl}?data=${encodeURIComponent(query)}`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const res = await fetch(requestUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "LapLaneFinder-Ingest/0.1 (schedule research; contact via github)",
      },
    });

    if (res.ok) {
      return (await res.json()) as OverpassResponse;
    }

    if ((res.status === 429 || res.status === 504) && attempt === 0) {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    throw new Error(`Overpass ${overpassUrl} failed (${res.status})`);
  }

  throw new Error(`Overpass ${overpassUrl} failed after retry`);
}

/**
 * Find public swimming pools near a point using OpenStreetMap (free, no API key).
 * Returns deduped candidates sorted closest-first.
 */
export async function discoverPoolsNear(
  center: GeoLocation,
  radiusMiles: number
): Promise<DiscoveredCandidate[]> {
  const radiusM = milesToMeters(radiusMiles);
  const query = `[out:json][timeout:90];
(
  nwr["leisure"="swimming_pool"](around:${radiusM},${center.lat},${center.lng});
  nwr["amenity"="swimming_pool"](around:${radiusM},${center.lat},${center.lng});
);
out center;`;

  const mirrors = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  let lastError: Error | null = null;
  let data: OverpassResponse | null = null;
  for (const mirror of mirrors) {
    try {
      data = await queryOverpass(mirror, query);
      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      await new Promise((r) => setTimeout(r, 2500));
    }
  }
  if (!data) {
    throw lastError ?? new Error("All Overpass mirrors failed");
  }
  const byOsmId = new Map<string, DiscoveredCandidate>();

  for (const el of data.elements ?? []) {
    const candidate = parseOverpassElement(el, center);
    if (!candidate) continue;
    byOsmId.set(candidate.osmId, candidate);
  }

  return [...byOsmId.values()].sort(
    (a, b) => a.distanceMiles - b.distanceMiles
  );
}

/** True when a discovered pin is essentially the same place as an existing pool. */
export function isDuplicateOfExisting(
  candidate: DiscoveredCandidate,
  existing: { location: GeoLocation; name: string }[],
  maxMiles = 0.15
): boolean {
  for (const pool of existing) {
    const miles = distanceMiles(candidate.location, pool.location);
    if (miles <= maxMiles) return true;
    const a = candidate.name.toLowerCase();
    const b = pool.name.toLowerCase();
    if (miles <= 0.5 && (a.includes(b.slice(0, 12)) || b.includes(a.slice(0, 12)))) {
      return true;
    }
  }
  return false;
}
