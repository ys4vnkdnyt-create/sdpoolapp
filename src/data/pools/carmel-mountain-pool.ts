import type { Pool } from "../../types/index.js";

/**
 * Carmel Mountain Ranch Swimming Pool — City of San Diego.
 * Lap swim windows from city pool program PDF (effective January 1).
 * PDF does not list lane count; 2 lanes is a conservative placeholder.
 */
export const carmelMountainPool: Pool = {
  id: "carmel-mountain-pool",
  name: "Carmel Mountain Ranch Swimming Pool",
  address: "12159 World Trade Drive, San Diego, CA 92128",
  location: { lat: 32.957, lng: -117.083 },
  guestPass: {
    costUsd: 5,
    notes:
      "Adult daily pass; child/senior $2.25. ~2 lap lanes (PDF does not specify; limited during programs).",
  },
  scheduleSource: {
    label: "City of San Diego — Carmel Mountain pool program PDF",
    url: "https://www.sandiego.gov/sites/default/files/2024-04/carmelmountainpoolprogram.pdf",
    effectiveDate: "2026-01-01",
  },
  availability: [
    // Pool closed Sundays — no dayOfWeek: 0 entries

    // Monday, Wednesday, Friday — 7:00am–5:00pm lap swim
    { dayOfWeek: 1, startTime: "07:00", endTime: "17:00", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "07:00", endTime: "17:00", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "07:00", endTime: "17:00", lanesAvailable: 2 },

    // Tuesday and Thursday — 10:30am–6:00pm lap swim
    { dayOfWeek: 2, startTime: "10:30", endTime: "18:00", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "10:30", endTime: "18:00", lanesAvailable: 2 },

    // Saturday — 12:00pm–4:00pm lap swim
    { dayOfWeek: 6, startTime: "12:00", endTime: "16:00", lanesAvailable: 2 },
  ],
};
