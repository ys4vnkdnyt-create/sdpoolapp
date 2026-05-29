// import type = types only (erased at compile); .js = Node ESM path to the compiled file
import type { Pool } from "../types/index.js";

/**
 * Fake San Diego pools — for learning/tests only.
 * The live app uses real schedules in `pools/index.ts` (Ryan YMCA PDF + Plunge web).
 */
export const samplePools: Pool[] = [
  {
    id: "la-jolla-ymca",
    name: "La Jolla YMCA",
    address: "8355 Cliffridge Ave, La Jolla, CA",
    location: { lat: 32.837, lng: -117.274 },
    guestPass: { costUsd: 15, notes: "Day pass; verify at desk" },
    availability: [
      { dayOfWeek: 1, startTime: "06:00", endTime: "08:00", lanesAvailable: 4 }, // Monday AM
      { dayOfWeek: 1, startTime: "12:00", endTime: "13:00", lanesAvailable: 2 }, // Monday lunch
      { dayOfWeek: 3, startTime: "06:00", endTime: "08:00", lanesAvailable: 3 }, // Wednesday AM
    ],
  },
  {
    id: "mission-valley-ymca",
    name: "Mission Valley YMCA",
    address: "5505 Friars Rd, San Diego, CA",
    location: { lat: 32.767, lng: -117.156 },
    guestPass: { costUsd: 12 },
    availability: [
      { dayOfWeek: 1, startTime: "05:30", endTime: "07:30", lanesAvailable: 6 },
      { dayOfWeek: 2, startTime: "05:30", endTime: "07:30", lanesAvailable: 5 },
      { dayOfWeek: 5, startTime: "06:00", endTime: "08:00", lanesAvailable: 4 }, // Friday
    ],
  },
  {
    id: "ucsd-pool",
    name: "UC San Diego Recreation Pool",
    address: "3117 Voigt Dr, La Jolla, CA",
    location: { lat: 32.88, lng: -117.234 },
    guestPass: { costUsd: 10, notes: "Community access; rules vary" },
    availability: [
      { dayOfWeek: 2, startTime: "06:00", endTime: "08:00", lanesAvailable: 8 }, // Tuesday
      { dayOfWeek: 4, startTime: "06:00", endTime: "08:00", lanesAvailable: 8 }, // Thursday
      { dayOfWeek: 6, startTime: "07:00", endTime: "09:00", lanesAvailable: 6 }, // Saturday
    ],
  },
  // 4th fake pool — different neighborhood; Monday AM so it appears in the usual test query
  {
    id: "coronado-community",
    name: "Coronado Community Center",
    address: "1845 Strand Way, Coronado, CA",
    location: { lat: 32.686, lng: -117.179 }, // south of downtown SD
    guestPass: { costUsd: 8, notes: "Community pool day pass" },
    availability: [
      { dayOfWeek: 1, startTime: "06:00", endTime: "08:00", lanesAvailable: 3 }, // Monday AM
      { dayOfWeek: 4, startTime: "12:00", endTime: "13:30", lanesAvailable: 2 }, // Thursday lunch
    ],
  },
];
