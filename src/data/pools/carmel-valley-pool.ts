import type { Pool } from "../../types/index.js";

/**
 * Carmel Valley Pool — City of San Diego.
 * Lap swim windows from city pool program PDF (effective April 2026).
 * PDF does not list lane count; 2 lanes is a conservative placeholder.
 */
export const carmelValleyPool: Pool = {
  id: "carmel-valley-pool",
  name: "Carmel Valley Pool",
  address: "3777 Townsgate Drive, San Diego, CA 92130",
  location: { lat: 32.940, lng: -117.240 },
  guestPass: {
    costUsd: 5,
    notes:
      "Adult daily pass; child/senior/disabled $2.25. ~2 lap lanes (PDF does not specify; limited during programs).",
  },
  scheduleSource: {
    label: "City of San Diego — Carmel Valley pool program PDF",
    url: "https://www.sandiego.gov/sites/default/files/2024-04/carmelvalleypoolprogram.pdf",
    effectiveDate: "2026-04-01",
  },
  availability: [
    // Pool closed Friday and Saturday — no dayOfWeek: 5 or 6 entries

    // Sunday — 1:00pm–4:00pm lap swim
    { dayOfWeek: 0, startTime: "13:00", endTime: "16:00", lanesAvailable: 2 },

    // Monday through Thursday — 11:30am–2:00pm and 3:00pm–5:00pm
    { dayOfWeek: 1, startTime: "11:30", endTime: "14:00", lanesAvailable: 2 },
    { dayOfWeek: 1, startTime: "15:00", endTime: "17:00", lanesAvailable: 2 },
    { dayOfWeek: 2, startTime: "11:30", endTime: "14:00", lanesAvailable: 2 },
    { dayOfWeek: 2, startTime: "15:00", endTime: "17:00", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "11:30", endTime: "14:00", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "15:00", endTime: "17:00", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "11:30", endTime: "14:00", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "15:00", endTime: "17:00", lanesAvailable: 2 },
  ],
};
