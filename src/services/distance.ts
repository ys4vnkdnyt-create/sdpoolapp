import type { GeoLocation } from "../types/index.js";

/** Earth radius in miles (mean). */
const EARTH_RADIUS_MILES = 3958.8;

/** Straight-line distance in miles between two lat/lng points (Haversine). */
export function distanceMiles(a: GeoLocation, b: GeoLocation): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_MILES * c;
}

/** Rough urban drive time from straight-line miles (placeholder until maps API). */
export function milesToEstimatedDriveMinutes(miles: number): number {
  return Math.max(1, Math.round(miles * 2.5));
}
