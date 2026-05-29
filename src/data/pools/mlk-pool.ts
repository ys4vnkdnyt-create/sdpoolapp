import type { Pool } from "../../types/index.js";

/**
 * Dr. Martin Luther King Jr. Pool — City of San Diego.
 * Lap swim windows from city pool program PDF (effective June 1).
 * PDF does not list lane count; 2 lanes is a conservative placeholder.
 */
export const mlkPool: Pool = {
  id: "mlk-pool",
  name: "Dr. Martin Luther King Jr. Pool",
  address: "6401 Skyline Dr, San Diego, CA 92114",
  location: { lat: 32.707, lng: -117.072 },
  guestPass: {
    costUsd: 5,
    notes:
      "Adult daily pass; child/senior/disabled $2.25. ~2 lap lanes (PDF does not specify; limited during programs).",
  },
  scheduleSource: {
    label: "City of San Diego — MLK pool program PDF",
    url: "https://www.sandiego.gov/sites/default/files/2024-04/mlkpoolprogram.pdf",
    effectiveDate: "2026-06-01",
  },
  availability: [
    // Pool closed Sundays and Mondays — no dayOfWeek: 0 or 1 entries

    // Tuesday and Thursday — morning and evening lap swim
    { dayOfWeek: 2, startTime: "11:00", endTime: "12:30", lanesAvailable: 2 },
    { dayOfWeek: 2, startTime: "17:00", endTime: "18:30", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "11:00", endTime: "12:30", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "17:00", endTime: "18:30", lanesAvailable: 2 },

    // Wednesday and Friday — afternoon lap swim (two windows)
    { dayOfWeek: 3, startTime: "12:30", endTime: "14:00", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "14:45", endTime: "16:15", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "12:30", endTime: "14:00", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "14:45", endTime: "16:15", lanesAvailable: 2 },

    // Saturday — afternoon lap swim
    { dayOfWeek: 6, startTime: "13:45", endTime: "16:00", lanesAvailable: 2 },
  ],
};
