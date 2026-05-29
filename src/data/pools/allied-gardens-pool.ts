import type { Pool } from "../../types/index.js";

/**
 * Allied Gardens Swimming Pool — City of San Diego.
 * Lap swim windows from city pool program PDF (effective Feb 27).
 * PDF does not list lane count; 2 lanes is a conservative placeholder.
 */
export const alliedGardensPool: Pool = {
  id: "allied-gardens-pool",
  name: "Allied Gardens Swimming Pool",
  address: "6707 Glenroy St, San Diego, CA 92120",
  location: { lat: 32.807, lng: -117.089 },
  guestPass: {
    costUsd: 5,
    notes:
      "Adult daily pass; child/senior $2.25. ~2 lap lanes (PDF does not specify; limited during programs).",
  },
  scheduleSource: {
    label: "City of San Diego — Allied Gardens pool program PDF",
    url: "https://www.sandiego.gov/sites/default/files/2024-04/alliedgardenspoolprogram.pdf",
    effectiveDate: "2026-02-27",
  },
  availability: [
    // Pool closed Sundays — no dayOfWeek: 0 entries

    // Monday, Wednesday, Friday — morning and afternoon lap swim
    { dayOfWeek: 1, startTime: "07:30", endTime: "12:30", lanesAvailable: 2 },
    { dayOfWeek: 1, startTime: "13:30", endTime: "18:00", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "07:30", endTime: "12:30", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "13:30", endTime: "18:00", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "07:30", endTime: "12:30", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "13:30", endTime: "18:00", lanesAvailable: 2 },

    // Tuesday and Thursday — afternoon/evening only
    { dayOfWeek: 2, startTime: "13:30", endTime: "19:30", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "13:30", endTime: "19:30", lanesAvailable: 2 },

    // Saturday — afternoon lap swim
    { dayOfWeek: 6, startTime: "13:00", endTime: "16:00", lanesAvailable: 2 },
  ],
};
