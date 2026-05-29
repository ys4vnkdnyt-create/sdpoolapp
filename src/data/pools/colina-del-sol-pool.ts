import type { Pool } from "../../types/index.js";

/**
 * Colina del Sol Pool — City of San Diego.
 * Lap swim windows from city pool program PDF (effective March 10).
 * PDF does not list lane count; 2 lanes is a conservative placeholder.
 */
export const colinaDelSolPool: Pool = {
  id: "colina-del-sol-pool",
  name: "Colina del Sol Pool",
  address: "4150 54th Place, San Diego, CA 92105",
  location: { lat: 32.754, lng: -117.084 },
  guestPass: {
    costUsd: 5,
    notes:
      "Adult daily pass; child/senior/disabled $2.25. ~2 lap lanes (PDF does not specify; limited during programs).",
  },
  scheduleSource: {
    label: "City of San Diego — Colina del Sol pool program PDF",
    url: "https://www.sandiego.gov/sites/default/files/2024-04/colinadelsolpoolprogram.pdf",
    effectiveDate: "2026-03-10",
  },
  availability: [
    // Pool closed Sundays and Mondays — no dayOfWeek: 0 or 1 entries

    // Tuesday and Thursday — 11:00am–5:00pm
    { dayOfWeek: 2, startTime: "11:00", endTime: "17:00", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "11:00", endTime: "17:00", lanesAvailable: 2 },

    // Friday — 1:00pm–5:00pm
    { dayOfWeek: 5, startTime: "13:00", endTime: "17:00", lanesAvailable: 2 },

    // Saturday — 12:00pm–4:00pm
    { dayOfWeek: 6, startTime: "12:00", endTime: "16:00", lanesAvailable: 2 },
  ],
};
