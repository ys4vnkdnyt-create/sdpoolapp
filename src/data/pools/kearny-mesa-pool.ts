import type { Pool } from "../../types/index.js";

/**
 * Kearny Mesa Pool — City of San Diego.
 * Lap swim windows from city pool program PDF (effective March 9).
 * PDF does not list lane count; 2 lanes is a conservative placeholder.
 */
export const kearnyMesaPool: Pool = {
  id: "kearny-mesa-pool",
  name: "Kearny Mesa Pool",
  address: "3170 Armstrong Street, San Diego, CA 92111",
  location: { lat: 32.822, lng: -117.158 },
  guestPass: {
    costUsd: 5,
    notes:
      "Adult daily pass; child/senior/disabled $2.25. ~2 lap lanes (PDF does not specify; limited during programs).",
  },
  scheduleSource: {
    label: "City of San Diego — Kearny Mesa pool program PDF",
    url: "https://www.sandiego.gov/sites/default/files/2024-04/kearnymesapoolprogram.pdf",
    effectiveDate: "2026-03-09",
  },
  availability: [
    // Pool closed Fridays and Saturdays — no dayOfWeek: 5 or 6 entries

    // Monday and Wednesday — afternoon lap swim
    { dayOfWeek: 1, startTime: "14:30", endTime: "17:00", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "14:30", endTime: "17:00", lanesAvailable: 2 },

    // Tuesday and Thursday — midday and afternoon lap swim
    { dayOfWeek: 2, startTime: "12:00", endTime: "14:00", lanesAvailable: 2 },
    { dayOfWeek: 2, startTime: "15:00", endTime: "17:00", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "12:00", endTime: "14:00", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "15:00", endTime: "17:00", lanesAvailable: 2 },

    // Sunday — midday and late-afternoon lap swim
    { dayOfWeek: 0, startTime: "12:00", endTime: "15:00", lanesAvailable: 2 },
    { dayOfWeek: 0, startTime: "15:30", endTime: "17:00", lanesAvailable: 2 },
  ],
};
