/**
 * Patch pools.json with transcribed schedules (YMCA Toby Wells, city Ned/Standley,
 * Coronado June 2026, Coggan web hours, gym notes). Run: node scripts/patch-schedules-2026.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = join(root, "src/data/pools/pools.json");
const pools = JSON.parse(readFileSync(jsonPath, "utf8"));

/** Replace one pool entry by id. */
function upsert(pool) {
  const i = pools.findIndex((p) => p.id === pool.id);
  if (i >= 0) pools[i] = pool;
  else pools.push(pool);
}

// —— Toby Wells — winter 2025 lap-pool PDF (lane counts in parentheses) ——
upsert({
  id: "toby-wells-ymca",
  name: "Toby Wells YMCA (indoor lap pool)",
  address: "5105 Overland Ave, San Diego, CA 92123",
  location: { lat: 32.83, lng: -117.13 },
  guestPass: {
    costUsd: 25,
    notes: "YMCA day pass; indoor lap pool — lane counts from branch PDF; family swim shares pool some afternoons.",
  },
  scheduleSource: {
    label: "Toby Wells YMCA — pool schedule PDF (winter 2025)",
    url: "https://www.ymcasd.org/wp-content/uploads/2025/02/Pool-Scedule-winter-2025.pdf",
    effectiveDate: "2025-01-01",
  },
  availability: [
    // Mon–Fri early
    ...[1, 2, 3, 4, 5].flatMap((d) => [
      { dayOfWeek: d, startTime: "05:30", endTime: "09:00", lanesAvailable: 6 },
      { dayOfWeek: d, startTime: "09:00", endTime: "10:00", lanesAvailable: d === 5 ? 2 : 1 },
      { dayOfWeek: d, startTime: "10:00", endTime: "12:00", lanesAvailable: 3 },
      { dayOfWeek: d, startTime: "12:00", endTime: "14:00", lanesAvailable: 3 },
      { dayOfWeek: d, startTime: "14:00", endTime: "16:00", lanesAvailable: 3 },
    ]),
    // Mon/Tue/Wed/Thu/Fri evening lap (PDF varies 1–3 lanes)
    { dayOfWeek: 1, startTime: "16:00", endTime: "20:30", lanesAvailable: 2 },
    { dayOfWeek: 2, startTime: "16:00", endTime: "20:30", lanesAvailable: 1 },
    { dayOfWeek: 3, startTime: "16:00", endTime: "20:30", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "16:00", endTime: "20:30", lanesAvailable: 1 },
    { dayOfWeek: 5, startTime: "16:00", endTime: "20:30", lanesAvailable: 3 },
    // Saturday
    { dayOfWeek: 6, startTime: "08:00", endTime: "09:00", lanesAvailable: 3 },
    { dayOfWeek: 6, startTime: "10:00", endTime: "12:00", lanesAvailable: 3 },
    { dayOfWeek: 6, startTime: "14:00", endTime: "16:00", lanesAvailable: 3 },
    // Sunday
    { dayOfWeek: 0, startTime: "08:00", endTime: "13:00", lanesAvailable: 3 },
  ],
});

// —— Ned Baumer — city PDF effective June 1 (lap swim only; ~2 lanes assumed) ——
upsert({
  id: "ned-baumer-pool",
  name: "Ned Baumer Aquatic Center (Mira Mesa)",
  address: "10440 Black Mountain Rd, San Diego, CA 92126",
  location: { lat: 32.912, lng: -117.113 },
  guestPass: {
    costUsd: 5,
    notes: "City adult day pass; closed Fri/Sun. PDF lists lap swim windows only (~2 lanes; limited during programs).",
  },
  scheduleSource: {
    label: "City of San Diego — Ned Baumer pool program PDF",
    url: "https://www.sandiego.gov/sites/default/files/2024-04/nedbaumerpoolprogram.pdf",
    effectiveDate: "2026-06-01",
  },
  availability: [
    { dayOfWeek: 1, startTime: "13:30", endTime: "17:30", lanesAvailable: 2 },
    { dayOfWeek: 2, startTime: "13:30", endTime: "17:30", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "13:30", endTime: "17:30", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "13:30", endTime: "17:30", lanesAvailable: 2 },
    { dayOfWeek: 6, startTime: "09:00", endTime: "14:00", lanesAvailable: 2 },
  ],
});

// —— Standley — city PDF effective June 8 ——
upsert({
  id: "standley-aquatic-center",
  name: "Standley Aquatic Center (University City)",
  address: "3605 Governor Dr, San Diego, CA 92122",
  location: { lat: 32.864, lng: -117.222 },
  guestPass: {
    costUsd: 5,
    notes: "City/school joint-use; closed Fri/Sat. PDF lap swim windows (~2 lanes; limited during programs).",
  },
  scheduleSource: {
    label: "City of San Diego — Standley pool program PDF",
    url: "https://www.sandiego.gov/sites/default/files/2024-04/standleypoolprogram.pdf",
    effectiveDate: "2026-06-08",
  },
  availability: [
    { dayOfWeek: 1, startTime: "09:30", endTime: "16:45", lanesAvailable: 2 },
    { dayOfWeek: 1, startTime: "18:15", endTime: "20:30", lanesAvailable: 2 },
    { dayOfWeek: 2, startTime: "07:00", endTime: "16:45", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "09:30", endTime: "16:45", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "18:15", endTime: "20:30", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "07:00", endTime: "16:45", lanesAvailable: 2 },
    { dayOfWeek: 0, startTime: "11:00", endTime: "16:00", lanesAvailable: 2 },
  ],
});

// —— Coronado — June 8+ aquatics PDF (25m / 25yd lap rows; ‡ = limited lanes) ——
upsert({
  id: "coronado-aquatics-center",
  name: "Coronado Community Aquatics Center",
  address: "1845 Strand Way, Coronado, CA 92118",
  location: { lat: 32.685, lng: -117.174 },
  guestPass: {
    costUsd: 8,
    notes: "Resident day pass $8 adult; ‡ = very limited lap lanes during aqua/family programs (see city PDF).",
  },
  scheduleSource: {
    label: "City of Coronado — Aquatics Center hours (June 8+ 2026)",
    url: "https://www.coronado.ca.us/DocumentCenter/View/9149",
    effectiveDate: "2026-06-08",
  },
  availability: [
    // Mon / Wed / Fri — morning 25m lap (limited ‡)
    { dayOfWeek: 1, startTime: "05:30", endTime: "08:00", lanesAvailable: 2 },
    { dayOfWeek: 1, startTime: "09:00", endTime: "13:00", lanesAvailable: 3 },
    { dayOfWeek: 1, startTime: "15:00", endTime: "20:00", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "05:30", endTime: "08:00", lanesAvailable: 2 },
    { dayOfWeek: 3, startTime: "09:00", endTime: "13:00", lanesAvailable: 3 },
    { dayOfWeek: 3, startTime: "15:00", endTime: "20:00", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "05:30", endTime: "08:00", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "09:00", endTime: "13:00", lanesAvailable: 3 },
    { dayOfWeek: 5, startTime: "15:00", endTime: "18:30", lanesAvailable: 2 },
    // Tue / Thu — split morning / afternoon per PDF
    { dayOfWeek: 2, startTime: "05:30", endTime: "08:00", lanesAvailable: 2 },
    { dayOfWeek: 2, startTime: "09:00", endTime: "13:00", lanesAvailable: 3 },
    { dayOfWeek: 2, startTime: "15:00", endTime: "20:00", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "05:30", endTime: "08:00", lanesAvailable: 2 },
    { dayOfWeek: 4, startTime: "09:00", endTime: "13:00", lanesAvailable: 3 },
    { dayOfWeek: 4, startTime: "15:00", endTime: "20:00", lanesAvailable: 2 },
    // Weekend
    { dayOfWeek: 6, startTime: "07:30", endTime: "11:00", lanesAvailable: 2 },
    { dayOfWeek: 6, startTime: "11:00", endTime: "16:30", lanesAvailable: 3 },
    { dayOfWeek: 0, startTime: "10:00", endTime: "15:30", lanesAvailable: 3 },
  ],
});

// —— Coggan — lap swim page (no per-lane counts; Olympic pool ~6 lanes typical) ——
upsert({
  id: "coggan-family-aquatic-complex",
  name: "Coggan Family Aquatic Complex",
  address: "800 Nautilus St, La Jolla, CA 92037",
  location: { lat: 32.852, lng: -117.275 },
  guestPass: {
    costUsd: 10,
    notes: "Day pass ~$10 adult; website lists lap hours only (no lane count) — space shared with teams/meets.",
  },
  scheduleSource: {
    label: "Coggan Aquatic Complex — lap swim hours (web)",
    url: "https://www.cogganaquatics.org/lap-swim",
    effectiveDate: "2026-06-01",
  },
  availability: [
    { dayOfWeek: 1, startTime: "06:00", endTime: "15:00", lanesAvailable: 4 },
    { dayOfWeek: 2, startTime: "06:00", endTime: "15:00", lanesAvailable: 4 },
    { dayOfWeek: 3, startTime: "06:00", endTime: "15:00", lanesAvailable: 4 },
    { dayOfWeek: 4, startTime: "06:00", endTime: "15:00", lanesAvailable: 4 },
    { dayOfWeek: 5, startTime: "06:00", endTime: "15:00", lanesAvailable: 4 },
    { dayOfWeek: 6, startTime: "08:00", endTime: "14:00", lanesAvailable: 4 },
    { dayOfWeek: 0, startTime: "08:00", endTime: "14:00", lanesAvailable: 4 },
  ],
});

// —— BBMAC — no fixed weekly grid; masters/CMA typical mornings only (partial) ——
upsert({
  id: "brian-bent-memorial-aquatics",
  name: "Brian Bent Memorial Aquatics Complex (BBMAC)",
  address: "818 6th St, Coronado, CA 92118",
  location: { lat: 32.698, lng: -117.179 },
  guestPass: {
    costUsd: 10,
    notes: "Drop-in $10; daily lap calendar only (bbmac.org/Lap-Swim) — windows below are typical masters mornings, not guaranteed.",
  },
  scheduleSource: {
    label: "BBMAC — lap swim calendar (daily; partial typical hours)",
    url: "https://bbmac.org/Lap-Swim/index.html",
    effectiveDate: "2026-06-01",
  },
  availability: [
    { dayOfWeek: 1, startTime: "05:30", endTime: "07:30", lanesAvailable: 3 },
    { dayOfWeek: 2, startTime: "05:30", endTime: "07:30", lanesAvailable: 3 },
    { dayOfWeek: 3, startTime: "05:30", endTime: "07:30", lanesAvailable: 3 },
    { dayOfWeek: 4, startTime: "05:30", endTime: "07:30", lanesAvailable: 3 },
    { dayOfWeek: 5, startTime: "05:30", endTime: "07:30", lanesAvailable: 3 },
    { dayOfWeek: 6, startTime: "05:30", endTime: "07:30", lanesAvailable: 2 },
  ],
});

// —— UCSD Canyonview — masters workout times (public page) ——
upsert({
  id: "ucsd-canyonview-pool",
  name: "UC San Diego — Canyonview Aquatics Center",
  address: "330 S Sports Center Dr, La Jolla, CA 92093",
  location: { lat: 32.879, lng: -117.234 },
  guestPass: {
    costUsd: 15,
    notes: "Masters drop-in $15; workouts Mon–Fri 6:00 & 7:30am, Mon–Thu 6pm, Sat 7:30am (~4 lanes during masters).",
  },
  scheduleSource: {
    label: "UCSD Recreation — Masters Swimming workout schedule",
    url: "https://recreation.ucsd.edu/competitive-sports/masters/",
    effectiveDate: "2026-06-01",
  },
  availability: [
    { dayOfWeek: 1, startTime: "06:00", endTime: "07:30", lanesAvailable: 4 },
    { dayOfWeek: 1, startTime: "07:30", endTime: "09:00", lanesAvailable: 4 },
    { dayOfWeek: 1, startTime: "18:00", endTime: "19:30", lanesAvailable: 3 },
    { dayOfWeek: 2, startTime: "06:00", endTime: "07:30", lanesAvailable: 4 },
    { dayOfWeek: 2, startTime: "07:30", endTime: "09:00", lanesAvailable: 4 },
    { dayOfWeek: 2, startTime: "18:00", endTime: "19:30", lanesAvailable: 3 },
    { dayOfWeek: 3, startTime: "06:00", endTime: "07:30", lanesAvailable: 4 },
    { dayOfWeek: 3, startTime: "07:30", endTime: "09:00", lanesAvailable: 4 },
    { dayOfWeek: 3, startTime: "18:00", endTime: "19:30", lanesAvailable: 3 },
    { dayOfWeek: 4, startTime: "06:00", endTime: "07:30", lanesAvailable: 4 },
    { dayOfWeek: 4, startTime: "07:30", endTime: "09:00", lanesAvailable: 4 },
    { dayOfWeek: 4, startTime: "18:00", endTime: "19:30", lanesAvailable: 3 },
    { dayOfWeek: 5, startTime: "06:00", endTime: "07:30", lanesAvailable: 4 },
    { dayOfWeek: 5, startTime: "07:30", endTime: "09:00", lanesAvailable: 4 },
    { dayOfWeek: 6, startTime: "07:30", endTime: "09:00", lanesAvailable: 3 },
  ],
});

// —— Gyms: no public lane-level schedule — narrow to “pool open” guess + note ——
const gymNote =
  "No public lap-lane schedule; pool may close for aqua classes — verify at front desk.";

function patchGym(id, name, address, lat, lng, url, label) {
  const p = pools.find((x) => x.id === id);
  if (!p) return;
  p.guestPass = { ...p.guestPass, notes: gymNote };
  p.scheduleSource = { label, url, effectiveDate: "2026-06-01" };
  // Keep minimal weekday daytime guess (2 lanes) so search is conservative
  p.availability = [1, 2, 3, 4, 5].map((d) => ({
    dayOfWeek: d,
    startTime: "09:00",
    endTime: "11:00",
    lanesAvailable: 1,
  }));
}

patchGym(
  "24-hour-fitness-balboa",
  null,
  null,
  null,
  null,
  "https://www.24hourfitness.com/gyms/san-diego-ca/balboa-ultra-sport",
  "24 Hour Fitness — Balboa (no lane schedule published)"
);
patchGym(
  "24-hour-fitness-la-jolla-village",
  null,
  null,
  null,
  null,
  "https://www.24hourfitness.com/gyms/san-diego-ca/la-jolla-village-sport",
  "24 Hour Fitness — La Jolla Village (no lane schedule published)"
);
patchGym(
  "24-hour-fitness-rancho-penasquitos",
  null,
  null,
  null,
  null,
  "https://www.24hourfitness.com/gyms/san-diego-ca/rancho-penasquitos-sport",
  "24 Hour Fitness — Rancho Peñasquitos (no lane schedule published)"
);
patchGym(
  "la-fitness-mission-valley",
  null,
  null,
  null,
  null,
  "https://www.lafitness.com/Pages/clubhome.aspx?clubid=1279",
  "LA Fitness — Mission Valley (no lane schedule published)"
);

// —— Kroc: keep known masters windows; drop all-day placeholders ——
upsert({
  id: "kroc-center-pool",
  name: "Salvation Army Kroc Center — aquatics",
  address: "6845 University Ave, San Diego, CA 92115",
  location: { lat: 32.714, lng: -117.067 },
  guestPass: {
    costUsd: 10,
    notes: "Kroc day pass; lap swim times vary — call aquatics; ~2 lanes when lap swim posted.",
  },
  scheduleSource: {
    label: "Kroc Center San Diego — aquatics (partial; verify at facility)",
    url: "https://sd.kroccenter.org/kroc-san-diego/",
    effectiveDate: "2026-06-01",
  },
  availability: [
    { dayOfWeek: 2, startTime: "06:00", endTime: "07:00", lanesAvailable: 2 },
    { dayOfWeek: 5, startTime: "06:00", endTime: "07:00", lanesAvailable: 2 },
    { dayOfWeek: 0, startTime: "08:45", endTime: "09:45", lanesAvailable: 2 },
  ],
});

writeFileSync(jsonPath, `${JSON.stringify(pools, null, 2)}\n`);
console.log("Patched schedule windows in pools.json");
