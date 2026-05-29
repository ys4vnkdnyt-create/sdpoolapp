import type { Pool } from "../../types/index.js";

/**
 * Tierrasanta Community Pool — City of San Diego.
 * Lap swim windows from city pool program PDF (effective March 2026).
 * PDF does not list lane count; 2 lanes is a conservative placeholder.
 */
export const tierrasantaPool: Pool = {
  id: "tierrasanta-pool",
  name: "Tierrasanta Community Pool",
  address: "11238 Clairemont Mesa Blvd, San Diego, CA 92124",
  location: { lat: 32.834, lng: -117.107 },
  guestPass: {
    costUsd: 5,
    notes:
      "Adult daily pass; child/senior/disabled $2.25. ~2 lap lanes (PDF does not specify; limited during programs).",
  },
  scheduleSource: {
    label: "City of San Diego — Tierrasanta pool program PDF",
    url: "https://www.sandiego.gov/sites/default/files/2024-04/tierrasantapoolprogram.pdf",
    effectiveDate: "2026-03-01",
  },
  availability: [
    // Pool closed Sundays — no dayOfWeek: 0 entries
    // No Saturday lap swim on PDF — no dayOfWeek: 6 entries

    // Monday, Wednesday, Friday — morning through afternoon lap swim
    { dayOfWeek: 1, startTime: "10:00", endTime: "15:00", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "10:00", endTime: "15:00", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "10:00", endTime: "15:00", lanesAvailable: 2 },

    // Tuesday and Thursday — midday lap swim only (no 10am window)
    { dayOfWeek: 2, startTime: "12:00", endTime: "15:00", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "12:00", endTime: "15:00", lanesAvailable: 2 },

    // Monday through Friday — evening lap swim
    { dayOfWeek: 1, startTime: "16:00", endTime: "20:00", lanesAvailable: 2 },
    { dayOfWeek: 2, startTime: "16:00", endTime: "20:00", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "16:00", endTime: "20:00", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "16:00", endTime: "20:00", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "16:00", endTime: "20:00", lanesAvailable: 2 },
  ],
};
