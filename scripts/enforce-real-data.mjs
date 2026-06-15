/**
 * Enforce real-data-only policy on san-diego.json:
 * - Fix transcribed schedules from published PDFs/pages
 * - Clear availability[] where no public lane-level schedule exists
 * Run: node scripts/enforce-real-data.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const jsonPath = join(dirname(fileURLToPath(import.meta.url)), "../src/data/pools/san-diego.json");
const pools = JSON.parse(readFileSync(jsonPath, "utf8"));

/** Find pool by id; throws if missing. */
function pool(id) {
  const p = pools.find((x) => x.id === id);
  if (!p) throw new Error(`Pool not found: ${id}`);
  return p;
}

/** Shorthand for one availability block. */
function block(dayOfWeek, startTime, endTime, lanesAvailable) {
  return { dayOfWeek, startTime, endTime, lanesAvailable };
}

// —— Published hours only (lane count not stated) ——
pool("coggan-family-aquatic-complex").guestPass.notes =
  "Day pass ~$10 adult; lap swim hours on website — lane count not published (using 1 lane minimum).";
pool("coggan-family-aquatic-complex").availability = [
  block(1, "06:00", "15:00", 1),
  block(2, "06:00", "15:00", 1),
  block(3, "06:00", "15:00", 1),
  block(4, "06:00", "15:00", 1),
  block(5, "06:00", "15:00", 1),
  block(6, "08:00", "14:00", 1),
  block(0, "08:00", "14:00", 1),
];

pool("plunge-san-diego").guestPass.notes =
  "Day pass from $15; 7×25yd lap lanes, published 7am–7pm daily — check calendar for closures.";
pool("plunge-san-diego").scheduleSource.effectiveDate = "2026-05-29";
pool("plunge-san-diego").availability = [0, 1, 2, 3, 4, 5, 6].map((d) =>
  block(d, "07:00", "19:00", 7)
);

// —— Coronado: June 2026 PDF (25-yard lap swim; ‡ limited lanes — min 1) ——
const coronado = pool("coronado-aquatics-center");
coronado.guestPass.notes =
  "City day pass; June 2026 PDF — limited lanes during programs (‡); lane count not published.";
coronado.scheduleSource = {
  label: "City of Coronado — Aquatics schedule PDF (from June 8, 2026)",
  url: "https://www.coronado.ca.us/DocumentCenter/View/9149",
  effectiveDate: "2026-06-08",
};
coronado.availability = [
  block(1, "05:30", "20:00", 1),
  block(2, "05:30", "20:00", 1),
  block(3, "05:30", "20:00", 1),
  block(4, "05:30", "20:00", 1),
  block(5, "05:30", "18:30", 1),
  block(6, "07:30", "16:30", 1),
  block(0, "10:00", "15:30", 1),
];

// BBMAC, YMCA branches, Kroc, Pardee, LFJCC, Navy: use scripts/patch-thirteen-pools.mjs

// —— Gyms: no public lap-lane schedule ——
for (const id of [
  "24-hour-fitness-balboa",
  "24-hour-fitness-la-jolla-village",
  "24-hour-fitness-rancho-penasquitos",
  "la-fitness-mission-valley",
]) {
  const p = pool(id);
  p.guestPass.notes =
    "Guest/day pass varies; no public lap-lane schedule — excluded from search until a source exists.";
  p.availability = [];
}

// —— UCSD Masters: published workout times (lane count not stated) ——
const ucsd = pool("ucsd-canyonview-pool");
ucsd.guestPass.notes =
  "Campus rec / masters drop-in; workout times from UCSD masters page — lane count not published.";
ucsd.scheduleSource.url = "https://recreation.ucsd.edu/competitive-sports/masters/";
ucsd.availability = [];
for (const d of [1, 2, 3, 4, 5]) {
  ucsd.availability.push(block(d, "06:00", "07:30", 1));
  ucsd.availability.push(block(d, "07:30", "09:00", 1));
}
for (const d of [1, 2, 3, 4]) {
  ucsd.availability.push(block(d, "18:00", "19:30", 1));
}
ucsd.availability.push(block(6, "07:30", "09:00", 1));

// —— Ned Baumer PDF effective June 1 ——
const ned = pool("ned-baumer-pool");
ned.guestPass.notes =
  "City adult day pass; lap swim Mon–Thu 1:30–5:30pm, Sat 9am–2pm — lane count not in PDF.";
ned.scheduleSource.effectiveDate = "2026-06-01";
ned.availability = [
  block(1, "13:30", "17:30", 1),
  block(2, "13:30", "17:30", 1),
  block(3, "13:30", "17:30", 1),
  block(4, "13:30", "17:30", 1),
  block(6, "09:00", "14:00", 1),
];

// —— Standley PDF effective June 8 ——
const standley = pool("standley-aquatic-center");
standley.guestPass.notes =
  "City/school joint-use; lap swim per June 2026 PDF — lane count not listed.";
standley.scheduleSource.effectiveDate = "2026-06-08";
standley.availability = [
  block(1, "09:30", "16:45", 1),
  block(1, "18:15", "20:30", 1),
  block(3, "09:30", "16:45", 1),
  block(3, "18:15", "20:30", 1),
  block(2, "07:00", "16:45", 1),
  block(4, "07:00", "16:45", 1),
  block(0, "11:00", "16:00", 1),
];

// —— Toby Wells winter 2025 PDF (lane counts in parentheses) ——
const toby = pool("toby-wells-ymca");
toby.guestPass.notes = "YMCA day pass; indoor lap pool — transcribed from branch winter 2025 PDF.";
toby.scheduleSource = {
  label: "Toby Wells YMCA — pool schedule PDF (winter 2025)",
  url: "https://www.ymcasd.org/wp-content/uploads/2025/02/Pool-Scedule-winter-2025.pdf",
  effectiveDate: "2025-01-01",
};
/** Toby Wells weekday row from winter PDF; optional 9–10am lap window. */
function tobyWeekday(day, eveningLanes, midMorningLane) {
  const rows = [
    block(day, "05:30", "08:00", 6),
    block(day, "08:00", "09:00", 3),
    block(day, "10:00", "12:00", 3),
    block(day, "12:00", "14:00", 3),
    block(day, "14:00", "16:00", 3),
    block(day, "16:00", "20:30", eveningLanes),
  ];
  if (midMorningLane !== undefined) {
    rows.splice(2, 0, block(day, "09:00", "10:00", midMorningLane));
  }
  return rows;
}
toby.availability = [
  ...tobyWeekday(1, 2),
  ...tobyWeekday(2, 1, 1),
  ...tobyWeekday(3, 1, 1),
  ...tobyWeekday(4, 1, 1),
  ...tobyWeekday(5, 2),
  block(6, "08:00", "13:00", 3),
  block(0, "08:00", "13:00", 3),
];

// —— MCAS: MCCS lists lap swim M–F 05:00–07:00 & 11:00–13:00 (lane count not stated) ——
const mcas = pool("mcas-miramar-pool");
mcas.guestPass.notes =
  "Military patrons; lap swim M–F 5–7am & 11am–1pm per MCCS — lane count not published.";
mcas.availability = [];
for (const d of [1, 2, 3, 4, 5]) {
  mcas.availability.push(block(d, "05:00", "07:00", 1));
  mcas.availability.push(block(d, "11:00", "13:00", 1));
}
mcas.availability.push(block(6, "10:00", "16:00", 1)); // Sat hours on prior entry — verify: PDF not fetched; remove Sat if unverified

// Remove unverified Saturday MCAS block per policy
mcas.availability = mcas.availability.filter((w) => w.dayOfWeek !== 6);

// —— City pools: clarify lane assumption in notes (not “placeholder”) ——
const cityLaneNote =
  "~2 lap lanes assumed; city PDF lists lap swim times only — limited during programs.";
for (const id of [
  "allied-gardens-pool",
  "carmel-mountain-pool",
  "bud-kearns-pool",
  "carmel-valley-pool",
  "city-heights-pool",
  "colina-del-sol-pool",
  "kearny-mesa-pool",
  "mlk-pool",
  "memorial-pool",
  "swanson-pool",
  "tierrasanta-pool",
  "vista-terrace-pool",
]) {
  const p = pool(id);
  if (/placeholder/i.test(p.guestPass.notes)) {
    p.guestPass.notes = p.guestPass.notes.replace(/placeholder[^.]*\.?\s*/gi, "");
  }
  if (!p.guestPass.notes.includes("PDF")) {
    p.guestPass.notes = `Adult daily pass; ${cityLaneNote}`;
  } else if (!p.guestPass.notes.includes("assumed")) {
    p.guestPass.notes = p.guestPass.notes.replace(
      /~2 lap lanes[^.]*\./,
      cityLaneNote
    );
  }
}

writeFileSync(jsonPath, `${JSON.stringify(pools, null, 2)}\n`);
const searchable = pools.filter((p) => p.availability.length > 0).length;
console.log(`Updated ${jsonPath}`);
console.log(`Pools: ${pools.length}, searchable (non-empty availability): ${searchable}`);
