import type { Pool } from "../../types/index.js";

/**
 * Swanson Swimming Pool — City of San Diego.
 * Lap swim windows from city pool program PDF (effective March 14).
 * PDF does not list lane count; 2 lanes is a conservative placeholder.
 */
export const swansonPool: Pool = {
  id: "swanson-pool",
  name: "Swanson Swimming Pool",
  address: "3585 Governor Drive, San Diego, CA 92122",
  location: { lat: 32.864, lng: -117.223 },
  guestPass: {
    costUsd: 5,
    notes:
      "Adult daily pass; child/senior/disabled $2.25. ~2 lap lanes (PDF does not specify; limited during programs).",
  },
  scheduleSource: {
    label: "City of San Diego — Swanson pool program PDF",
    url: "https://www.sandiego.gov/sites/default/files/2024-04/swansonpoolprogram.pdf",
    effectiveDate: "2026-03-14",
  },
  availability: [
    // Pool closed Sundays and Mondays — no dayOfWeek: 0 or 1 entries

    // Wednesday and Friday — midday lap swim
    { dayOfWeek: 3, startTime: "11:00", endTime: "15:30", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "11:00", endTime: "15:30", lanesAvailable: 2 },

    // Saturday — late-morning through afternoon lap swim
    { dayOfWeek: 6, startTime: "11:30", endTime: "16:00", lanesAvailable: 2 },
  ],
};
