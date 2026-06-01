import type { LaneAvailabilityWindow } from "../types/index.js";

/** "08:30" → minutes since midnight. */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Minutes since midnight → "08:30". */
function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Merge overlapping windows on one weekday (for finding gaps between blocks). */
function mergeOverlappingDayWindows(
  windows: LaneAvailabilityWindow[]
): LaneAvailabilityWindow[] {
  if (windows.length === 0) return [];

  const sorted = [...windows].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
  const merged: LaneAvailabilityWindow[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const last = merged[merged.length - 1];
    const lastEnd = timeToMinutes(last.endTime);
    const curStart = timeToMinutes(cur.startTime);

    if (curStart <= lastEnd) {
      const newEnd = Math.max(lastEnd, timeToMinutes(cur.endTime));
      last.endTime = minutesToTime(newEnd);
      last.lanesAvailable = Math.max(last.lanesAvailable, cur.lanesAvailable);
    } else {
      merged.push({ ...cur });
    }
  }

  return merged;
}

/**
 * Pool schedules often leave blank space between printed blocks; that usually
 * still means lap lanes are open. Fill those gaps (same weekday only).
 */
export function expandAvailabilityWithGaps(
  windows: LaneAvailabilityWindow[]
): LaneAvailabilityWindow[] {
  if (windows.length === 0) return [];

  const byDay = new Map<number, LaneAvailabilityWindow[]>();
  for (const w of windows) {
    const list = byDay.get(w.dayOfWeek) ?? [];
    list.push(w);
    byDay.set(w.dayOfWeek, list);
  }

  const gapWindows: LaneAvailabilityWindow[] = [];

  for (const [day, dayWindows] of byDay) {
    const merged = mergeOverlappingDayWindows(dayWindows);

    for (let i = 0; i < merged.length - 1; i++) {
      const left = merged[i];
      const right = merged[i + 1];
      const gapStart = timeToMinutes(left.endTime);
      const gapEnd = timeToMinutes(right.startTime);

      if (gapEnd <= gapStart) continue;

      gapWindows.push({
        dayOfWeek: day as LaneAvailabilityWindow["dayOfWeek"],
        startTime: left.endTime,
        endTime: right.startTime,
        // Conservative: fewer lanes than the blocks on either side; at least 1.
        lanesAvailable: Math.max(
          1,
          Math.min(left.lanesAvailable, right.lanesAvailable)
        ),
      });
    }
  }

  return [...windows, ...gapWindows];
}
