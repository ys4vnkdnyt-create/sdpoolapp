import type { Pool } from "../../types/index.js";

/**
 * City Heights Swim Center — City of San Diego.
 * Lap swim windows from city pool program PDF (effective Feb 27).
 * PDF does not list lane count; 2 lanes is a conservative placeholder.
 */
export const cityHeightsPool: Pool = {
  id: "city-heights-pool",
  name: "City Heights Swim Center",
  address: "4380 Landis Street, San Diego, CA 92105",
  location: { lat: 32.740, lng: -117.097 },
  guestPass: {
    costUsd: 5,
    notes:
      "Adult daily pass; child/senior/disabled $2.25. ~2 lap lanes (PDF does not specify; limited during programs).",
  },
  scheduleSource: {
    label: "City of San Diego — City Heights pool program PDF",
    url: "https://www.sandiego.gov/sites/default/files/2024-04/cityheightspoolprogram.pdf",
    effectiveDate: "2026-02-27",
  },
  availability: [
    // Pool closed Saturdays — no dayOfWeek: 6 entries

    // Monday–Friday — morning and afternoon lap swim
    { dayOfWeek: 1, startTime: "10:30", endTime: "12:00", lanesAvailable: 2 },
    { dayOfWeek: 1, startTime: "13:00", endTime: "17:00", lanesAvailable: 2 },
    { dayOfWeek: 2, startTime: "10:30", endTime: "12:00", lanesAvailable: 2 },
    { dayOfWeek: 2, startTime: "13:00", endTime: "17:00", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "10:30", endTime: "12:00", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "13:00", endTime: "17:00", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "10:30", endTime: "12:00", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "13:00", endTime: "17:00", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "10:30", endTime: "12:00", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "13:00", endTime: "17:00", lanesAvailable: 2 },

    // Sunday — afternoon lap swim
    { dayOfWeek: 0, startTime: "12:00", endTime: "15:30", lanesAvailable: 2 },
  ],
};
