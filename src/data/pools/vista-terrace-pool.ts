import type { Pool } from "../../types/index.js";

/**
 * Vista Terrace Pool — City of San Diego (San Ysidro).
 * Lap swim windows from city pool program PDF (effective April 1).
 * PDF does not list lane count; 2 lanes is a conservative placeholder.
 */
export const vistaTerracePool: Pool = {
  id: "vista-terrace-pool",
  name: "Vista Terrace Pool",
  address: "301 Athey Ave, San Ysidro, CA 92173",
  location: { lat: 32.567, lng: -117.043 },
  guestPass: {
    costUsd: 5,
    notes:
      "Adult daily pass; child/senior/disabled $2.25. ~2 lap lanes (PDF does not specify; limited during programs).",
  },
  scheduleSource: {
    label: "City of San Diego — Vista Terrace pool program PDF",
    url: "https://www.sandiego.gov/sites/default/files/2024-04/vistaterracepoolprogram.pdf",
    effectiveDate: "2026-04-01",
  },
  availability: [
    // Sunday — late-morning through afternoon lap swim
    { dayOfWeek: 0, startTime: "11:30", endTime: "16:30", lanesAvailable: 2 },

    // Monday, Tuesday, Thursday — afternoon lap swim (closed Wed/Fri/Sat)
    { dayOfWeek: 1, startTime: "14:00", endTime: "18:00", lanesAvailable: 2 },
    { dayOfWeek: 2, startTime: "14:00", endTime: "18:00", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "14:00", endTime: "18:00", lanesAvailable: 2 },
  ],
};
