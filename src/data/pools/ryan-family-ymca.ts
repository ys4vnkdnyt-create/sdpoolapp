import type { Pool } from "../../types/index.js";

/**
 * Ryan Family YMCA — outdoor lap pool.
 * Transcribed from YMCA of San Diego County pool schedule PDF (effective 5/3/2026).
 * Parenthesis in PDF = lanes available; windows with 0 lanes are omitted.
 */
export const ryanFamilyYmc: Pool = {
  id: "ryan-family-ymca",
  name: "Ryan Family YMCA (Point Loma, outdoor lap pool)",
  address: "4390 Valeta St, San Diego, CA 92107",
  location: { lat: 32.75, lng: -117.233 },
  guestPass: {
    costUsd: 15,
    notes: "YMCA day pass; verify at desk — members use membership",
  },
  scheduleSource: {
    label: "Ryan Family YMCA (Point Loma) — outdoor lap pool schedule PDF (May 2026)",
    url: "https://www.ymcasd.org/wp-content/uploads/2025/09/05.2026-Pool-Schedule.pdf",
    effectiveDate: "2026-05-03",
  },
  availability: [
    // —— Sunday (0) ——
    { dayOfWeek: 0, startTime: "08:00", endTime: "09:30", lanesAvailable: 6 },
    { dayOfWeek: 0, startTime: "09:30", endTime: "13:30", lanesAvailable: 5 },
    { dayOfWeek: 0, startTime: "14:00", endTime: "14:45", lanesAvailable: 6 },

    // —— Monday (1) ——
    { dayOfWeek: 1, startTime: "07:00", endTime: "08:00", lanesAvailable: 6 },
    { dayOfWeek: 1, startTime: "09:00", endTime: "10:00", lanesAvailable: 3 },
    { dayOfWeek: 1, startTime: "10:15", endTime: "11:00", lanesAvailable: 3 },
    { dayOfWeek: 1, startTime: "11:00", endTime: "12:00", lanesAvailable: 6 },
    { dayOfWeek: 1, startTime: "14:00", endTime: "14:25", lanesAvailable: 5 },
    { dayOfWeek: 1, startTime: "14:25", endTime: "15:45", lanesAvailable: 4 },
    { dayOfWeek: 1, startTime: "15:45", endTime: "16:30", lanesAvailable: 1 },
    { dayOfWeek: 1, startTime: "19:15", endTime: "19:30", lanesAvailable: 2 },
    { dayOfWeek: 1, startTime: "19:30", endTime: "20:45", lanesAvailable: 6 },

    // —— Tuesday (2) ——
    { dayOfWeek: 2, startTime: "08:00", endTime: "09:00", lanesAvailable: 6 },
    { dayOfWeek: 2, startTime: "10:15", endTime: "11:00", lanesAvailable: 3 },
    { dayOfWeek: 2, startTime: "11:00", endTime: "12:00", lanesAvailable: 6 },
    { dayOfWeek: 2, startTime: "14:00", endTime: "14:25", lanesAvailable: 5 },
    { dayOfWeek: 2, startTime: "14:25", endTime: "15:45", lanesAvailable: 5 },
    { dayOfWeek: 2, startTime: "15:15", endTime: "16:30", lanesAvailable: 1 },
    { dayOfWeek: 2, startTime: "19:00", endTime: "19:30", lanesAvailable: 1 },
    { dayOfWeek: 2, startTime: "19:30", endTime: "20:45", lanesAvailable: 6 },

    // —— Wednesday (3) ——
    { dayOfWeek: 3, startTime: "05:30", endTime: "06:30", lanesAvailable: 3 },
    { dayOfWeek: 3, startTime: "09:30", endTime: "10:15", lanesAvailable: 4 },
    { dayOfWeek: 3, startTime: "10:00", endTime: "11:00", lanesAvailable: 1 },
    { dayOfWeek: 3, startTime: "11:00", endTime: "12:10", lanesAvailable: 4 },
    { dayOfWeek: 3, startTime: "12:10", endTime: "14:00", lanesAvailable: 6 },
    { dayOfWeek: 3, startTime: "14:00", endTime: "14:25", lanesAvailable: 5 },
    { dayOfWeek: 3, startTime: "14:25", endTime: "15:15", lanesAvailable: 5 },
    { dayOfWeek: 3, startTime: "15:15", endTime: "15:45", lanesAvailable: 3 },
    { dayOfWeek: 3, startTime: "15:45", endTime: "19:30", lanesAvailable: 1 },
    { dayOfWeek: 3, startTime: "19:30", endTime: "20:45", lanesAvailable: 6 },

    // —— Thursday (4) ——
    { dayOfWeek: 4, startTime: "05:30", endTime: "10:15", lanesAvailable: 6 },
    { dayOfWeek: 4, startTime: "10:15", endTime: "11:00", lanesAvailable: 3 },
    { dayOfWeek: 4, startTime: "11:00", endTime: "12:00", lanesAvailable: 6 },
    { dayOfWeek: 4, startTime: "14:00", endTime: "14:25", lanesAvailable: 5 },
    { dayOfWeek: 4, startTime: "14:25", endTime: "15:45", lanesAvailable: 5 },
    { dayOfWeek: 4, startTime: "15:15", endTime: "16:30", lanesAvailable: 1 },
    { dayOfWeek: 4, startTime: "19:00", endTime: "19:30", lanesAvailable: 1 },
    { dayOfWeek: 4, startTime: "19:30", endTime: "20:45", lanesAvailable: 6 },

    // —— Friday (5) ——
    { dayOfWeek: 5, startTime: "08:00", endTime: "09:00", lanesAvailable: 6 },
    { dayOfWeek: 5, startTime: "10:15", endTime: "11:00", lanesAvailable: 3 },
    { dayOfWeek: 5, startTime: "11:15", endTime: "12:15", lanesAvailable: 3 },
    { dayOfWeek: 5, startTime: "12:15", endTime: "14:25", lanesAvailable: 6 },
    { dayOfWeek: 5, startTime: "14:25", endTime: "16:00", lanesAvailable: 5 },
    { dayOfWeek: 5, startTime: "16:00", endTime: "17:00", lanesAvailable: 1 },
    { dayOfWeek: 5, startTime: "19:00", endTime: "20:45", lanesAvailable: 6 },

    // —— Saturday (6) ——
    { dayOfWeek: 6, startTime: "07:00", endTime: "08:20", lanesAvailable: 6 },
    { dayOfWeek: 6, startTime: "08:20", endTime: "12:40", lanesAvailable: 4 },
    { dayOfWeek: 6, startTime: "13:00", endTime: "14:45", lanesAvailable: 5 },
  ],
};
