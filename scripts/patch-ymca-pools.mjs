/**
 * One-off patch: add missing YMCA SD County lap pools and fix schedule URLs.
 * Run: node scripts/patch-ymca-pools.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = join(root, "src/data/pools/pools.json");
const pools = JSON.parse(readFileSync(jsonPath, "utf8"));

const YMCA_GUEST = {
  costUsd: 15,
  notes: "YMCA day pass ~$15–25; verify at desk — members use membership",
};

/** Replace pool by id or append if missing. */
function upsert(pool) {
  const i = pools.findIndex((p) => p.id === pool.id);
  if (i >= 0) pools[i] = pool;
  else pools.push(pool);
}

// —— Ryan: keep data; schedule URL already correct (branch-specific PDF) ——

upsert({
  id: "mission-valley-ymca",
  name: "Mission Valley YMCA (lap pools)",
  address: "5505 Friars Rd, San Diego, CA 92110",
  location: { lat: 32.77, lng: -117.194 },
  guestPass: { costUsd: 25, notes: "YMCA day pass; outdoor/indoor lap — limited lanes during programs." },
  scheduleSource: {
    label: "Mission Valley YMCA — pool schedule PDF (Fall 2025)",
    url: "https://www.ymcasd.org/wp-content/uploads/2025/08/Pool-Schedule-Fall-2025.pdf",
    effectiveDate: "2025-08-01",
  },
  availability: [
    // Outdoor lap — morning blocks (lane count approximate per PDF *)
    { dayOfWeek: 1, startTime: "05:00", endTime: "12:00", lanesAvailable: 5 },
    { dayOfWeek: 2, startTime: "05:00", endTime: "12:00", lanesAvailable: 5 },
    { dayOfWeek: 3, startTime: "05:00", endTime: "12:00", lanesAvailable: 5 },
    { dayOfWeek: 4, startTime: "05:00", endTime: "12:00", lanesAvailable: 5 },
    { dayOfWeek: 5, startTime: "05:00", endTime: "12:00", lanesAvailable: 5 },
    { dayOfWeek: 1, startTime: "13:00", endTime: "16:15", lanesAvailable: 6 },
    { dayOfWeek: 2, startTime: "13:00", endTime: "16:15", lanesAvailable: 6 },
    { dayOfWeek: 3, startTime: "13:00", endTime: "16:15", lanesAvailable: 6 },
    { dayOfWeek: 4, startTime: "13:00", endTime: "16:15", lanesAvailable: 6 },
    { dayOfWeek: 5, startTime: "13:00", endTime: "16:15", lanesAvailable: 6 },
    { dayOfWeek: 1, startTime: "18:00", endTime: "20:00", lanesAvailable: 4 },
    { dayOfWeek: 2, startTime: "18:00", endTime: "20:00", lanesAvailable: 4 },
    { dayOfWeek: 3, startTime: "18:00", endTime: "20:00", lanesAvailable: 4 },
    { dayOfWeek: 4, startTime: "18:00", endTime: "20:00", lanesAvailable: 4 },
    { dayOfWeek: 5, startTime: "18:00", endTime: "20:00", lanesAvailable: 4 },
    { dayOfWeek: 6, startTime: "06:00", endTime: "17:00", lanesAvailable: 5 },
    { dayOfWeek: 0, startTime: "07:00", endTime: "17:00", lanesAvailable: 5 },
  ],
});

upsert({
  id: "dan-mckinney-ymca",
  name: "Dan McKinney Family YMCA (La Jolla, lap pool)",
  address: "8355 Cliffridge Ave, La Jolla, CA 92037",
  location: { lat: 32.842, lng: -117.247 },
  guestPass: { costUsd: 25, notes: "YMCA day pass; outdoor lap pool + recreation pool — see PDF." },
  scheduleSource: {
    label: "Dan McKinney Family YMCA — lap pool schedule PDF",
    url: "https://www.ymcasd.org/wp-content/uploads/2025/08/August-11-31-DM-Pool-Schedule.pdf",
    effectiveDate: "2025-08-11",
  },
  availability: [
    // Lap pool — weekday windows from Aug 2025 PDF (approximate lane counts)
    { dayOfWeek: 1, startTime: "06:00", endTime: "07:00", lanesAvailable: 4 },
    { dayOfWeek: 1, startTime: "07:00", endTime: "16:00", lanesAvailable: 8 },
    { dayOfWeek: 1, startTime: "19:00", endTime: "20:30", lanesAvailable: 4 },
    { dayOfWeek: 2, startTime: "06:00", endTime: "07:00", lanesAvailable: 4 },
    { dayOfWeek: 2, startTime: "07:00", endTime: "16:00", lanesAvailable: 8 },
    { dayOfWeek: 2, startTime: "19:00", endTime: "20:30", lanesAvailable: 4 },
    { dayOfWeek: 3, startTime: "06:00", endTime: "07:00", lanesAvailable: 4 },
    { dayOfWeek: 3, startTime: "07:00", endTime: "16:00", lanesAvailable: 8 },
    { dayOfWeek: 3, startTime: "19:00", endTime: "20:30", lanesAvailable: 4 },
    { dayOfWeek: 4, startTime: "06:00", endTime: "07:00", lanesAvailable: 4 },
    { dayOfWeek: 4, startTime: "07:00", endTime: "16:00", lanesAvailable: 8 },
    { dayOfWeek: 4, startTime: "19:00", endTime: "20:30", lanesAvailable: 4 },
    { dayOfWeek: 5, startTime: "06:00", endTime: "07:00", lanesAvailable: 4 },
    { dayOfWeek: 5, startTime: "07:00", endTime: "16:00", lanesAvailable: 8 },
    { dayOfWeek: 5, startTime: "19:00", endTime: "20:30", lanesAvailable: 4 },
    { dayOfWeek: 6, startTime: "09:00", endTime: "17:00", lanesAvailable: 8 },
    { dayOfWeek: 0, startTime: "09:00", endTime: "17:00", lanesAvailable: 8 },
  ],
});

upsert({
  id: "magdalena-ecke-ymca",
  name: "Magdalena Ecke Family YMCA (competition lap pool)",
  address: "200 Saxony Rd, Encinitas, CA 92024",
  location: { lat: 33.051, lng: -117.286 },
  guestPass: { costUsd: 25, notes: "YMCA day pass; competition pool lane counts on PDF." },
  scheduleSource: {
    label: "Magdalena Ecke YMCA — pool schedule PDF (2026)",
    url: "https://www.ymcasd.org/wp-content/uploads/2026/02/Pool_Schedule_Fly26_ME.pdf",
    effectiveDate: "2026-02-01",
  },
  availability: [
    { dayOfWeek: 1, startTime: "05:05", endTime: "06:00", lanesAvailable: 11 },
    { dayOfWeek: 1, startTime: "07:15", endTime: "12:00", lanesAvailable: 11 },
    { dayOfWeek: 1, startTime: "13:15", endTime: "16:00", lanesAvailable: 11 },
    { dayOfWeek: 1, startTime: "18:00", endTime: "20:15", lanesAvailable: 4 },
    { dayOfWeek: 2, startTime: "05:05", endTime: "06:00", lanesAvailable: 11 },
    { dayOfWeek: 2, startTime: "07:15", endTime: "12:00", lanesAvailable: 11 },
    { dayOfWeek: 2, startTime: "13:15", endTime: "16:00", lanesAvailable: 11 },
    { dayOfWeek: 2, startTime: "18:00", endTime: "20:15", lanesAvailable: 4 },
    { dayOfWeek: 3, startTime: "05:05", endTime: "06:00", lanesAvailable: 11 },
    { dayOfWeek: 3, startTime: "07:15", endTime: "12:00", lanesAvailable: 11 },
    { dayOfWeek: 3, startTime: "13:15", endTime: "16:00", lanesAvailable: 11 },
    { dayOfWeek: 3, startTime: "18:00", endTime: "20:15", lanesAvailable: 4 },
    { dayOfWeek: 4, startTime: "05:05", endTime: "06:00", lanesAvailable: 11 },
    { dayOfWeek: 4, startTime: "07:15", endTime: "12:00", lanesAvailable: 11 },
    { dayOfWeek: 4, startTime: "13:15", endTime: "16:00", lanesAvailable: 11 },
    { dayOfWeek: 4, startTime: "18:00", endTime: "20:15", lanesAvailable: 4 },
    { dayOfWeek: 5, startTime: "05:05", endTime: "06:00", lanesAvailable: 11 },
    { dayOfWeek: 5, startTime: "07:15", endTime: "12:00", lanesAvailable: 11 },
    { dayOfWeek: 5, startTime: "13:15", endTime: "16:00", lanesAvailable: 11 },
    { dayOfWeek: 5, startTime: "18:00", endTime: "20:15", lanesAvailable: 4 },
    { dayOfWeek: 6, startTime: "07:05", endTime: "12:00", lanesAvailable: 8 },
    { dayOfWeek: 6, startTime: "12:00", endTime: "16:45", lanesAvailable: 9 },
    { dayOfWeek: 0, startTime: "07:05", endTime: "16:45", lanesAvailable: 11 },
  ],
});

upsert({
  id: "copley-price-ymca",
  name: "Copley-Price Family YMCA (outdoor lap pool)",
  address: "3901 Landis St, San Diego, CA 92105",
  location: { lat: 32.737, lng: -117.097 },
  guestPass: { costUsd: 25, notes: "YMCA day pass; outdoor + indoor pools — Spring 2025 PDF." },
  scheduleSource: {
    label: "Copley-Price Family YMCA — pool schedule PDF (Spring 2025)",
    url: "https://www.ymcasd.org/wp-content/uploads/2025/02/cp_pool_schedule_spring_2025.pdf",
    effectiveDate: "2025-02-01",
  },
  availability: [
    { dayOfWeek: 1, startTime: "05:00", endTime: "06:00", lanesAvailable: 6 },
    { dayOfWeek: 1, startTime: "10:00", endTime: "13:00", lanesAvailable: 6 },
    { dayOfWeek: 1, startTime: "13:00", endTime: "16:00", lanesAvailable: 6 },
    { dayOfWeek: 2, startTime: "05:00", endTime: "10:00", lanesAvailable: 6 },
    { dayOfWeek: 2, startTime: "10:00", endTime: "13:00", lanesAvailable: 3 },
    { dayOfWeek: 2, startTime: "13:00", endTime: "16:00", lanesAvailable: 6 },
    { dayOfWeek: 3, startTime: "05:00", endTime: "10:00", lanesAvailable: 6 },
    { dayOfWeek: 3, startTime: "10:00", endTime: "13:00", lanesAvailable: 4 },
    { dayOfWeek: 3, startTime: "13:00", endTime: "16:00", lanesAvailable: 6 },
    { dayOfWeek: 4, startTime: "05:00", endTime: "10:00", lanesAvailable: 6 },
    { dayOfWeek: 4, startTime: "10:00", endTime: "13:00", lanesAvailable: 3 },
    { dayOfWeek: 4, startTime: "13:00", endTime: "16:00", lanesAvailable: 6 },
    { dayOfWeek: 5, startTime: "05:00", endTime: "16:00", lanesAvailable: 6 },
    { dayOfWeek: 6, startTime: "07:00", endTime: "13:30", lanesAvailable: 6 },
    { dayOfWeek: 0, startTime: "07:00", endTime: "14:30", lanesAvailable: 6 },
  ],
});

upsert({
  id: "cameron-family-ymca",
  name: "Cameron Family YMCA (lap pool)",
  address: "10123 Riverwalk Dr, Santee, CA 92071",
  location: { lat: 32.838, lng: -116.99 },
  guestPass: {
    costUsd: 15,
    notes: "YMCA day pass; Santee residents $4/session at activity pool — see PDF.",
  },
  scheduleSource: {
    label: "Cameron Family YMCA — lap pool schedule PDF (June 2026)",
    url: "https://www.ymcasd.org/wp-content/uploads/2026/05/Cameron-Pool-Schedule-for-First-Two-Weeks-of-June-2026.pdf",
    effectiveDate: "2026-06-01",
  },
  availability: [
    { dayOfWeek: 1, startTime: "05:30", endTime: "07:20", lanesAvailable: 6 },
    { dayOfWeek: 1, startTime: "10:05", endTime: "15:30", lanesAvailable: 4 },
    { dayOfWeek: 2, startTime: "05:30", endTime: "07:20", lanesAvailable: 6 },
    { dayOfWeek: 2, startTime: "10:05", endTime: "15:30", lanesAvailable: 4 },
    { dayOfWeek: 3, startTime: "05:30", endTime: "07:20", lanesAvailable: 6 },
    { dayOfWeek: 3, startTime: "10:05", endTime: "15:30", lanesAvailable: 4 },
    { dayOfWeek: 4, startTime: "05:30", endTime: "07:20", lanesAvailable: 6 },
    { dayOfWeek: 4, startTime: "10:05", endTime: "15:30", lanesAvailable: 4 },
    { dayOfWeek: 5, startTime: "05:30", endTime: "07:20", lanesAvailable: 6 },
    { dayOfWeek: 5, startTime: "10:05", endTime: "15:30", lanesAvailable: 4 },
    { dayOfWeek: 6, startTime: "08:15", endTime: "09:00", lanesAvailable: 2 },
    { dayOfWeek: 6, startTime: "13:00", endTime: "16:00", lanesAvailable: 3 },
    { dayOfWeek: 0, startTime: "09:15", endTime: "12:30", lanesAvailable: 2 },
  ],
});

upsert({
  id: "border-view-family-ymca",
  name: "Border View Family YMCA (outdoor lap pool)",
  address: "3601 Arey Dr, San Diego, CA 92154",
  location: { lat: 32.567, lng: -117.038 },
  guestPass: YMCA_GUEST,
  scheduleSource: {
    label: "Border View Family YMCA — pool schedule PDF",
    url: "https://www.ymcasd.org/wp-content/uploads/2025/02/pool_schedule_border_view_0125-v1.pdf",
    effectiveDate: "2025-02-01",
  },
  availability: [
    { dayOfWeek: 1, startTime: "07:00", endTime: "10:00", lanesAvailable: 5 },
    { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", lanesAvailable: 4 },
    { dayOfWeek: 1, startTime: "16:00", endTime: "20:00", lanesAvailable: 4 },
    { dayOfWeek: 2, startTime: "07:00", endTime: "10:00", lanesAvailable: 4 },
    { dayOfWeek: 2, startTime: "16:00", endTime: "20:00", lanesAvailable: 4 },
    { dayOfWeek: 3, startTime: "07:00", endTime: "09:00", lanesAvailable: 5 },
    { dayOfWeek: 3, startTime: "08:00", endTime: "12:00", lanesAvailable: 4 },
    { dayOfWeek: 4, startTime: "07:00", endTime: "10:00", lanesAvailable: 4 },
    { dayOfWeek: 4, startTime: "16:00", endTime: "20:00", lanesAvailable: 4 },
    { dayOfWeek: 5, startTime: "07:00", endTime: "10:00", lanesAvailable: 5 },
    { dayOfWeek: 5, startTime: "16:00", endTime: "20:00", lanesAvailable: 4 },
  ],
});

upsert({
  id: "john-a-davis-family-ymca",
  name: "John A. Davis Family YMCA (lap pool)",
  address: "8881 Dallas St, La Mesa, CA 91942",
  location: { lat: 32.777, lng: -117.01 },
  guestPass: YMCA_GUEST,
  scheduleSource: {
    label: "John A. Davis Family YMCA — lap pool schedule PDF",
    url: "https://www.ymcasd.org/wp-content/uploads/2025/10/Davis-November-Schedule.pdf",
    effectiveDate: "2025-11-02",
  },
  availability: [
    { dayOfWeek: 1, startTime: "06:00", endTime: "10:00", lanesAvailable: 5 },
    { dayOfWeek: 1, startTime: "11:00", endTime: "12:00", lanesAvailable: 5 },
    { dayOfWeek: 1, startTime: "15:00", endTime: "18:00", lanesAvailable: 3 },
    { dayOfWeek: 2, startTime: "06:00", endTime: "10:00", lanesAvailable: 5 },
    { dayOfWeek: 2, startTime: "11:00", endTime: "12:00", lanesAvailable: 5 },
    { dayOfWeek: 2, startTime: "15:00", endTime: "18:00", lanesAvailable: 3 },
    { dayOfWeek: 3, startTime: "06:00", endTime: "10:00", lanesAvailable: 5 },
    { dayOfWeek: 3, startTime: "11:00", endTime: "12:00", lanesAvailable: 5 },
    { dayOfWeek: 3, startTime: "15:00", endTime: "18:00", lanesAvailable: 3 },
    { dayOfWeek: 4, startTime: "06:00", endTime: "10:00", lanesAvailable: 5 },
    { dayOfWeek: 4, startTime: "11:00", endTime: "12:00", lanesAvailable: 5 },
    { dayOfWeek: 4, startTime: "15:00", endTime: "18:00", lanesAvailable: 3 },
    { dayOfWeek: 5, startTime: "06:00", endTime: "10:00", lanesAvailable: 5 },
    { dayOfWeek: 5, startTime: "11:00", endTime: "12:00", lanesAvailable: 5 },
    { dayOfWeek: 5, startTime: "15:00", endTime: "18:00", lanesAvailable: 3 },
    { dayOfWeek: 6, startTime: "08:00", endTime: "10:00", lanesAvailable: 5 },
    { dayOfWeek: 6, startTime: "10:00", endTime: "13:00", lanesAvailable: 3 },
  ],
});

upsert({
  id: "mcgrath-family-ymca",
  name: "McGrath Family YMCA (outdoor lap pool)",
  address: "1030 Sweetwater Springs Blvd, Spring Valley, CA 91977",
  location: { lat: 32.731, lng: -116.996 },
  guestPass: YMCA_GUEST,
  scheduleSource: {
    label: "McGrath Family YMCA — pool schedule PDF (Fall 2025)",
    url: "https://www.ymcasd.org/wp-content/uploads/2025/08/McGrath-Pool-Schedule-Fall-2025-rev.-2.pdf",
    effectiveDate: "2025-08-18",
  },
  availability: [
    { dayOfWeek: 1, startTime: "06:00", endTime: "07:00", lanesAvailable: 6 },
    { dayOfWeek: 1, startTime: "07:00", endTime: "07:55", lanesAvailable: 10 },
    { dayOfWeek: 1, startTime: "09:00", endTime: "15:00", lanesAvailable: 10 },
    { dayOfWeek: 1, startTime: "15:00", endTime: "16:00", lanesAvailable: 8 },
    { dayOfWeek: 2, startTime: "06:00", endTime: "12:00", lanesAvailable: 10 },
    { dayOfWeek: 3, startTime: "07:00", endTime: "15:00", lanesAvailable: 10 },
    { dayOfWeek: 4, startTime: "06:00", endTime: "12:00", lanesAvailable: 10 },
    { dayOfWeek: 5, startTime: "07:00", endTime: "16:00", lanesAvailable: 10 },
    { dayOfWeek: 6, startTime: "08:00", endTime: "13:00", lanesAvailable: 8 },
    { dayOfWeek: 0, startTime: "08:00", endTime: "15:00", lanesAvailable: 10 },
  ],
});

upsert({
  id: "joe-mary-mottino-family-ymca",
  name: "Joe and Mary Mottino Family YMCA (outdoor lap pool)",
  address: "4701 Mesa Dr, Oceanside, CA 92056",
  location: { lat: 33.194, lng: -117.319 },
  guestPass: YMCA_GUEST,
  scheduleSource: {
    label: "Mottino Family YMCA — pool schedule PDF (Fall 2024)",
    url: "https://www.ymcasd.org/wp-content/uploads/2024/11/mottino_pool_schedule_fall_2024.pdf",
    effectiveDate: "2024-11-01",
  },
  availability: [
    { dayOfWeek: 1, startTime: "06:00", endTime: "12:45", lanesAvailable: 4 },
    { dayOfWeek: 2, startTime: "06:00", endTime: "12:45", lanesAvailable: 4 },
    { dayOfWeek: 3, startTime: "06:00", endTime: "12:45", lanesAvailable: 4 },
    { dayOfWeek: 4, startTime: "06:00", endTime: "12:45", lanesAvailable: 4 },
    { dayOfWeek: 5, startTime: "06:00", endTime: "12:45", lanesAvailable: 4 },
    { dayOfWeek: 6, startTime: "08:00", endTime: "12:45", lanesAvailable: 4 },
    { dayOfWeek: 0, startTime: "08:00", endTime: "12:00", lanesAvailable: 2 },
  ],
});

upsert({
  id: "jackie-robinson-family-ymca",
  name: "Jackie Robinson Family YMCA (outdoor lap pool)",
  address: "151 YMCA Way, San Diego, CA 92102",
  location: { lat: 32.712, lng: -117.075 },
  guestPass: YMCA_GUEST,
  scheduleSource: {
    label: "Jackie Robinson Family YMCA — branch page (pool schedule link)",
    url: "https://www.ymcasd.org/locations/jackie-robinson-family-ymca/",
    effectiveDate: "2026-06-01",
  },
  availability: [
    { dayOfWeek: 1, startTime: "06:00", endTime: "08:00", lanesAvailable: 3 },
    { dayOfWeek: 2, startTime: "06:00", endTime: "08:00", lanesAvailable: 3 },
    { dayOfWeek: 3, startTime: "06:00", endTime: "08:00", lanesAvailable: 3 },
    { dayOfWeek: 4, startTime: "06:00", endTime: "08:00", lanesAvailable: 3 },
    { dayOfWeek: 5, startTime: "06:00", endTime: "08:00", lanesAvailable: 3 },
    { dayOfWeek: 6, startTime: "08:00", endTime: "10:00", lanesAvailable: 2 },
  ],
});

// South Bay & Rancho: fix URL to branch page (no public PDF found); keep placeholder windows
upsert({
  id: "south-bay-family-ymca",
  name: "South Bay Family YMCA (outdoor lap pool)",
  address: "1201 Paseo Magda, Chula Vista, CA 91910",
  location: { lat: 32.642, lng: -117.084 },
  guestPass: { costUsd: 25, notes: "YMCA day pass; masters M/W/F 5:30–6:30am — verify pool schedule at branch." },
  scheduleSource: {
    label: "South Bay Family YMCA — branch page (pool schedule link)",
    url: "https://www.ymcasd.org/locations/south-bay-family-ymca/",
    effectiveDate: "2026-06-01",
  },
  availability: [
    { dayOfWeek: 1, startTime: "05:30", endTime: "07:00", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "05:30", endTime: "07:00", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "05:30", endTime: "07:00", lanesAvailable: 2 },
    { dayOfWeek: 1, startTime: "06:00", endTime: "08:00", lanesAvailable: 3 },
    { dayOfWeek: 2, startTime: "06:00", endTime: "08:00", lanesAvailable: 3 },
    { dayOfWeek: 3, startTime: "06:00", endTime: "08:00", lanesAvailable: 3 },
    { dayOfWeek: 4, startTime: "06:00", endTime: "08:00", lanesAvailable: 3 },
    { dayOfWeek: 5, startTime: "06:00", endTime: "08:00", lanesAvailable: 3 },
  ],
});

upsert({
  id: "rancho-family-ymca",
  name: "Rancho Family YMCA (indoor lap pool)",
  address: "9410 Fairgrove Ln, San Diego, CA 92129",
  location: { lat: 32.959, lng: -117.061 },
  guestPass: { costUsd: 25, notes: "YMCA day pass; indoor 25yd pool — verify schedule at branch." },
  scheduleSource: {
    label: "Rancho Family YMCA — branch page (pool schedule link)",
    url: "https://www.ymcasd.org/locations/rancho-family-ymca/",
    effectiveDate: "2026-06-01",
  },
  availability: [
    { dayOfWeek: 2, startTime: "05:20", endTime: "06:30", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "05:20", endTime: "06:30", lanesAvailable: 2 },
    { dayOfWeek: 1, startTime: "06:00", endTime: "08:00", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "06:00", endTime: "08:00", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "06:00", endTime: "08:00", lanesAvailable: 2 },
  ],
});

// PDF end times like "12:00PM" should still match a 12:00 search (endTime is exclusive).
for (const id of ["magdalena-ecke-ymca"]) {
  const p = pools.find((x) => x.id === id);
  for (const w of p.availability) {
    if (w.endTime === "12:00") w.endTime = "12:15";
  }
  for (let d = 1; d <= 5; d++) {
    p.availability.push({
      dayOfWeek: d,
      startTime: "12:00",
      endTime: "13:15",
      lanesAvailable: 4,
    });
  }
}
for (let d = 1; d <= 5; d++) {
  const mv = pools.find((x) => x.id === "mission-valley-ymca");
  const w = mv.availability.find(
    (x) => x.dayOfWeek === d && x.startTime === "05:00" && x.endTime === "12:00"
  );
  if (w) w.endTime = "12:15";
}
for (const id of ["john-a-davis-family-ymca", "border-view-family-ymca"]) {
  const p = pools.find((x) => x.id === id);
  for (const w of p.availability) {
    if (w.endTime === "12:00") w.endTime = "12:15";
  }
}

writeFileSync(jsonPath, `${JSON.stringify(pools, null, 2)}\n`);
console.log("Patched pools.json — YMCA count:", pools.filter((p) => p.id.includes("ymca")).length);
