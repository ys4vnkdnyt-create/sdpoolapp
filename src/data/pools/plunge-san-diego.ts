import type { Pool } from "../../types/index.js";

/**
 * The Plunge San Diego — baseline lap swim from public site (7 lanes, 7am–7pm daily).
 * Calendar events may reduce lanes on specific days (not modeled in V0).
 */
export const plungeSanDiego: Pool = {
  id: "plunge-san-diego",
  name: "The Plunge San Diego",
  address: "3115 Ocean Front Walk, San Diego, CA 92109",
  location: { lat: 32.772, lng: -117.252 },
  guestPass: {
    costUsd: 15,
    notes: "Day pass from $15; see plungesandiego.com/rates",
  },
  scheduleSource: {
    label: "The Plunge — lap swim hours (web)",
    url: "https://plungesandiego.com/schedule/",
    effectiveDate: "2026-05-29",
  },
  availability: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek: dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    startTime: "07:00",
    endTime: "19:00",
    lanesAvailable: 7,
  })),
};
