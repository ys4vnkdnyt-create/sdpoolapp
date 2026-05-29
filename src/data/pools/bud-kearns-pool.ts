import type { Pool } from "../../types/index.js";

/**
 * Bud Kearns Memorial Pool — City of San Diego (Morley Field, Balboa Park area).
 * Lap swim windows from city pool program PDF (effective May 4).
 * PDF does not list lane count; 2 lanes is a conservative placeholder.
 */
export const budKearnsPool: Pool = {
  id: "bud-kearns-pool",
  name: "Bud Kearns Memorial Pool",
  address: "2229 Morley Field Drive, San Diego, CA 92104",
  location: { lat: 32.740, lng: -117.140 },
  guestPass: {
    costUsd: 5,
    notes:
      "Adult daily pass; child/senior/disabled $2.25. ~2 lap lanes (PDF does not specify; limited after 3pm).",
  },
  scheduleSource: {
    label: "City of San Diego — Bud Kearns pool program PDF",
    url: "https://www.sandiego.gov/sites/default/files/2024-04/budkearnspoolprogram.pdf",
    effectiveDate: "2026-05-04",
  },
  availability: [
    // Pool closed Sundays — no dayOfWeek: 0 entries

    // Monday, Wednesday, Friday — 12:00pm–7:00pm
    { dayOfWeek: 1, startTime: "12:00", endTime: "19:00", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "12:00", endTime: "19:00", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "12:00", endTime: "19:00", lanesAvailable: 2 },

    // Tuesday and Thursday — 10:15am–8:30pm
    { dayOfWeek: 2, startTime: "10:15", endTime: "20:30", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "10:15", endTime: "20:30", lanesAvailable: 2 },

    // Saturday — 10:15am–12:45pm and 1:30pm–3:30pm
    { dayOfWeek: 6, startTime: "10:15", endTime: "12:45", lanesAvailable: 2 },
    { dayOfWeek: 6, startTime: "13:30", endTime: "15:30", lanesAvailable: 2 },
  ],
};
