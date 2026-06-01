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

/** Group availability rows by weekday (0 = Sunday … 6 = Saturday). */
function groupByDay(
  windows: LaneAvailabilityWindow[]
): Map<number, LaneAvailabilityWindow[]> {
  const byDay = new Map<number, LaneAvailabilityWindow[]>();
  for (const w of windows) {
    const list = byDay.get(w.dayOfWeek) ?? [];
    list.push({ ...w });
    byDay.set(w.dayOfWeek, list);
  }
  return byDay;
}

/**
 * Merge overlapping windows on one weekday.
 * Same printed row split twice → one block; lane count = highest in the overlap.
 */
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
 * Merge back-to-back blocks on the same day (end time of one = start of next).
 * PDFs sometimes split one session into adjacent rows; use the higher lane count.
 */
function mergeTouchingDayWindows(
  windows: LaneAvailabilityWindow[]
): LaneAvailabilityWindow[] {
  if (windows.length <= 1) return windows;

  const sorted = [...windows].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
  const merged: LaneAvailabilityWindow[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const last = merged[merged.length - 1];

    if (last.endTime === cur.startTime) {
      last.endTime = cur.endTime;
      last.lanesAvailable = Math.max(last.lanesAvailable, cur.lanesAvailable);
    } else {
      merged.push({ ...cur });
    }
  }

  return merged;
}

/**
 * Step 1 before search: clean up transcribed rows per weekday.
 * Each day is independent — we never copy one day's grid onto another.
 */
export function normalizeExplicitBlocks(
  windows: LaneAvailabilityWindow[]
): LaneAvailabilityWindow[] {
  if (windows.length === 0) return [];

  const out: LaneAvailabilityWindow[] = [];

  for (const [, dayWindows] of groupByDay(windows)) {
    const merged = mergeTouchingDayWindows(
      mergeOverlappingDayWindows(dayWindows)
    );
    out.push(...merged);
  }

  return out;
}

/**
 * Step 2: blank space between printed blocks on the same day still means lap lanes open.
 * Use the higher lane count from either side (not the lower).
 */
export function expandGapsBetweenBlocks(
  explicitWindows: LaneAvailabilityWindow[]
): LaneAvailabilityWindow[] {
  if (explicitWindows.length === 0) return [];

  const gapWindows: LaneAvailabilityWindow[] = [];

  for (const [day, dayWindows] of groupByDay(explicitWindows)) {
    const sorted = [...dayWindows].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      const left = sorted[i];
      const right = sorted[i + 1];
      const gapStart = timeToMinutes(left.endTime);
      const gapEnd = timeToMinutes(right.startTime);

      if (gapEnd <= gapStart) continue;

      gapWindows.push({
        dayOfWeek: day as LaneAvailabilityWindow["dayOfWeek"],
        startTime: left.endTime,
        endTime: right.startTime,
        lanesAvailable: Math.max(
          1,
          left.lanesAvailable,
          right.lanesAvailable
        ),
      });
    }
  }

  return [...explicitWindows, ...gapWindows];
}

/** Full pipeline used by search: normalize PDF rows, then fill inter-block gaps. */
export function prepareAvailabilityForSearch(
  windows: LaneAvailabilityWindow[]
): LaneAvailabilityWindow[] {
  return expandGapsBetweenBlocks(normalizeExplicitBlocks(windows));
}
