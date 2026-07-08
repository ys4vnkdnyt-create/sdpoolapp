import type { LaneAvailabilityWindow } from "../types/index.js";

/** True when one window has valid day, times, and at least 1 lane. */
export function isValidAvailabilityWindow(
  w: LaneAvailabilityWindow
): boolean {
  if (w.dayOfWeek < 0 || w.dayOfWeek > 6) return false;
  if (!/^\d{2}:\d{2}$/.test(w.startTime) || !/^\d{2}:\d{2}$/.test(w.endTime)) {
    return false;
  }
  // undefined/null lanes used to slip through (undefined < 1 is false in JS).
  if (!Number.isFinite(w.lanesAvailable) || w.lanesAvailable < 1) return false;
  if (timeToMinutes(w.startTime) >= timeToMinutes(w.endTime)) return false;
  return true;
}

/** Keep only rows safe to save in the pantry. */
export function filterValidWindows(
  windows: LaneAvailabilityWindow[]
): LaneAvailabilityWindow[] {
  return windows.filter(isValidAvailabilityWindow);
}

/** Every row must pass validation (used before apply). */
export function availabilityIsHealthy(windows: LaneAvailabilityWindow[]): boolean {
  return windows.length > 0 && windows.every(isValidAvailabilityWindow);
}

/**
 * Whether ingest should replace existing availability with a new transcription.
 * Empty pools accept any healthy schedule; populated pools reject thin/bad output.
 */
export function shouldReplaceAvailability(
  existing: LaneAvailabilityWindow[],
  incoming: LaneAvailabilityWindow[]
): boolean {
  if (!availabilityIsHealthy(incoming)) return false;
  if (existing.length === 0) return true;

  const minWindows = Math.max(5, Math.floor(existing.length * 0.5));
  return incoming.length >= minWindows;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
