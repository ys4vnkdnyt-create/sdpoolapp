import type { Pool } from "../../types/index.js";

/**
 * Memorial Pool — City of San Diego (Logan Heights).
 * Lap swim windows from city pool program PDF (effective April 1).
 * PDF does not list lane count; 2 lanes is a conservative placeholder.
 */
export const memorialPool: Pool = {
  id: "memorial-pool",
  name: "Memorial Pool",
  address: "2902 Marcy Ave, San Diego, CA 92113",
  location: { lat: 32.703, lng: -117.139 },
  guestPass: {
    costUsd: 5,
    notes:
      "Adult daily pass; child/senior/disabled $2.25. ~2 lap lanes (PDF does not specify; limited during programs).",
  },
  scheduleSource: {
    label: "City of San Diego — Memorial pool program PDF",
    url: "https://www.sandiego.gov/sites/default/files/2024-04/memorialpoolprogram.pdf",
    effectiveDate: "2026-04-01",
  },
  availability: [
    // Pool closed Sundays — no dayOfWeek: 0 entries

    // Monday–Friday — morning through afternoon lap swim
    { dayOfWeek: 1, startTime: "10:00", endTime: "16:00", lanesAvailable: 2 },
    { dayOfWeek: 2, startTime: "10:00", endTime: "16:00", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "10:00", endTime: "16:00", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "10:00", endTime: "16:00", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "10:00", endTime: "16:00", lanesAvailable: 2 },

    // Saturday — afternoon lap swim
    { dayOfWeek: 6, startTime: "12:00", endTime: "16:00", lanesAvailable: 2 },
  ],
};
