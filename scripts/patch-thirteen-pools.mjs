/**
 * Populate real availability[] for the 13 pools that were empty after enforce-real-data.
 * Sources: branch PDFs/pages, BGC Pardee lap PDF, Navy directory, SI LMSC / USMS where noted.
 * Run: node scripts/patch-thirteen-pools.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const jsonPath = join(dirname(fileURLToPath(import.meta.url)), "../src/data/pools/pools.json");
const pools = JSON.parse(readFileSync(jsonPath, "utf8"));

/** Find pool by id. */
function pool(id) {
  const p = pools.find((x) => x.id === id);
  if (!p) throw new Error(`Pool not found: ${id}`);
  return p;
}

/** One availability window. */
function block(dayOfWeek, startTime, endTime, lanesAvailable) {
  return { dayOfWeek, startTime, endTime, lanesAvailable };
}

/** Append blocks for each day in days[]. */
function forDays(days, startTime, endTime, lanes) {
  return days.map((d) => block(d, startTime, endTime, lanes));
}

// —— 1. Clairemont: still closed for renovation ——
const clairemont = pool("clairemont-pool");
clairemont.availability = [];
clairemont.guestPass.notes =
  "Adult daily pass when open; pool closed for renovations — no lap schedule. Call (858) 581-9923 for reopening.";

// —— 2. BBMAC: CMA masters M/W/F 6–7am (SI LMSC); daily calendar varies ——
const bbmac = pool("brian-bent-memorial-aquatics");
bbmac.guestPass.notes =
  "Drop-in $10; lap hours change daily — see BBMAC lap swim calendar. Below: Coronado Masters (CMA) M/W/F 6–7am only.";
bbmac.scheduleSource = {
  label: "BBMAC — lap swim calendar + CMA masters (SI LMSC)",
  url: "https://bbmac.org/Lap-Swim/index.html",
  effectiveDate: "2026-06-01",
};
bbmac.availability = [
  block(1, "06:00", "07:00", 3),
  block(3, "06:00", "07:00", 3),
  block(5, "06:00", "07:00", 3),
];

// —— 3–5. YMCA branch PDFs (Spring/Summer 2026) ——
const jackie = pool("jackie-robinson-family-ymca");
jackie.guestPass.notes =
  "YMCA day pass; outdoor lap pool — transcribed from branch Spring/Summer 2026 PDF.";
jackie.scheduleSource = {
  label: "Jackie Robinson Family YMCA — pool schedule PDF (Spring/Summer 2026)",
  url: "https://www.ymcasd.org/wp-content/uploads/2026/02/Pool-Schedule-Spring-Summer-2026.pdf",
  effectiveDate: "2026-02-01",
};
jackie.availability = [
  ...forDays([1, 2, 3, 4, 5], "06:30", "11:00", 6),
  ...forDays([1, 2, 3, 4, 5], "11:00", "15:00", 2),
  ...forDays([1, 2, 3, 4, 5], "16:00", "17:00", 2),
  block(6, "08:00", "13:00", 2),
  block(6, "12:00", "16:00", 2),
  block(0, "09:30", "12:30", 2),
];

const rancho = pool("rancho-family-ymca");
rancho.guestPass.notes =
  "YMCA day pass; indoor main lap pool — transcribed from Spring 2026 branch PDF (lane counts in parentheses).";
rancho.scheduleSource = {
  label: "Rancho Family YMCA — Spring pool schedule PDF (2026)",
  url: "https://www.ymcasd.org/wp-content/uploads/2026/04/Spring-Pool-Schedule-2026-2.pdf",
  effectiveDate: "2026-04-01",
};
const mf = [1, 3, 5];
const tuTh = [2, 4];
rancho.availability = [
  ...forDays(mf, "05:30", "06:00", 5),
  ...forDays(tuTh, "05:30", "06:00", 5),
  ...forDays([3], "05:30", "06:30", 1),
  ...forDays(tuTh, "06:30", "08:15", 5),
  ...forDays(tuTh, "08:15", "09:00", 3),
  ...forDays([1, 2, 3, 4, 5], "06:00", "16:00", 4),
  ...forDays([1, 2, 3, 4, 5], "16:00", "19:30", 1),
  ...forDays([1, 2, 3, 4, 5], "19:30", "20:00", 1),
  ...forDays([1, 2, 3, 4, 5], "20:00", "20:15", 5),
  block(6, "07:00", "13:00", 4),
  block(6, "18:00", "19:45", 5),
  block(0, "07:00", "13:00", 4),
];

const southBay = pool("south-bay-family-ymca");
southBay.guestPass.notes =
  "YMCA day pass; competition pool — transcribed from May 2026 branch PDF (lanes noted per program).";
southBay.scheduleSource = {
  label: "South Bay Family YMCA — pool schedule PDF (May 2026)",
  url: "https://www.ymcasd.org/wp-content/uploads/2026/05/SB-Pool-Schedule-Untitled-Page.pdf",
  effectiveDate: "2026-05-01",
};
southBay.availability = [
  ...forDays([1, 3, 5], "05:30", "06:30", 2),
  ...forDays([1, 2, 3, 4, 5], "07:30", "08:15", 4),
  ...forDays([1, 2, 3, 4, 5], "08:15", "13:00", 3),
  block(6, "08:00", "14:45", 3),
  block(0, "09:00", "12:50", 3),
];

// —— 6–8. Gyms: no public lap-lane schedule ——
for (const id of [
  "24-hour-fitness-balboa",
  "24-hour-fitness-la-jolla-village",
  "24-hour-fitness-rancho-penasquitos",
  "la-fitness-mission-valley",
]) {
  const p = pool(id);
  p.availability = [];
  p.guestPass.notes =
    "Guest/day pass varies; no public lap-lane schedule on club site — excluded from search until a source exists.";
}

// —— 9. Kroc: USMS masters windows (live comp-pool calendar for full lap swim) ——
const kroc = pool("kroc-center-pool");
kroc.guestPass.notes =
  "Kroc day pass; comp-pool lap swim varies — see sd.kroccenter.org lap swim calendar. Below: published masters workouts only.";
kroc.scheduleSource = {
  label: "Kroc Center San Diego — lap swim + USMS masters",
  url: "https://sd.kroccenter.org/kroc-san-diego/lap-swim/",
  effectiveDate: "2026-06-01",
};
kroc.availability = [
  block(2, "06:00", "07:00", 2),
  block(4, "06:00", "07:00", 2),
  block(0, "08:45", "09:45", 2),
];

// —— 10. Pardee — Summer 2026 lap PDF (comp + rec pools; use higher lane count per window) ——
const pardee = pool("pardee-aquatics-center");
pardee.guestPass.notes =
  "BGC day pass; lap swim from published Summer 2026 PDF (comp + rec pools; schedules change seasonally).";
pardee.scheduleSource = {
  label: "Pardee Aquatics Center — Summer 2026 lap swim PDF (Jun 15–Aug 9)",
  url: "https://bgcgreatertogether.org/wp-content/uploads/2026/06/Summer-2026-Lap-Swim-Schedule-B_Patty-Mariscal.pdf",
  effectiveDate: "2026-06-15",
};
function pardeeDay(d, comp, rec) {
  const rows = [];
  for (const [start, end, lanes] of comp) rows.push(block(d, start, end, lanes));
  for (const [start, end, lanes] of rec) rows.push(block(d, start, end, lanes));
  return rows;
}
pardee.availability = [
  ...pardeeDay(1, [["05:00", "06:30", 4], ["10:10", "11:40", 8], ["13:00", "14:20", 9]], [["05:00", "08:45", 6], ["19:00", "20:00", 6]]),
  ...pardeeDay(2, [["10:10", "11:40", 8], ["13:00", "14:20", 9]], [["06:00", "08:45", 6], ["19:00", "20:00", 6]]),
  ...pardeeDay(3, [["05:00", "06:30", 4], ["10:10", "11:40", 8], ["13:00", "14:20", 9]], [["05:00", "08:45", 6], ["19:00", "20:00", 6]]),
  ...pardeeDay(4, [["10:10", "11:40", 8], ["13:00", "14:20", 9]], [["06:00", "08:45", 6], ["19:00", "20:00", 6]]),
  ...pardeeDay(5, [["05:00", "06:30", 4], ["13:00", "16:30", 9]], [["05:00", "08:45", 6], ["10:00", "11:00", 6], ["14:30", "16:30", 6]]),
  ...pardeeDay(6, [["10:45", "12:00", 4], ["12:00", "16:15", 9]], [["08:00", "16:15", 6]]),
  ...pardeeDay(0, [["08:00", "11:00", 4], ["11:00", "16:15", 9]], [["08:00", "16:15", 6]]),
];

// —— 11. LFJCC — published lap swim hours (limited lanes during team 3:30–6:30 M–Th) ——
const lfjcc = pool("lfjcc-pool");
lfjcc.guestPass.notes =
  "JCC guest pass; lap swim hours from lfjcc.org — fewer lanes Mon–Thu 3:30–6:30pm (swim team).";
lfjcc.scheduleSource = {
  label: "Lawrence Family JCC — aquatics / lap swimming hours",
  url: "https://www.lfjcc.org/qualcomm/aquatics.aspx",
  effectiveDate: "2026-06-01",
};
lfjcc.availability = [
  ...forDays([1, 2, 3, 4], "06:00", "15:30", 3),
  ...forDays([1, 2, 3, 4], "18:30", "20:30", 2),
  ...forDays([5], "06:00", "15:30", 3),
  ...forDays([6, 0], "07:00", "17:30", 3),
];

// —— 12–13. Navy pools — published lap swim hours (lane count not stated → 1) ——
const prout = pool("admiral-prout-pool");
prout.guestPass.notes =
  "Military ID required; lap swim M–F 5–8am & 11am–1pm per Navy Life / base directory — lane count not published.";
prout.scheduleSource = {
  label: "Navy Life SW — Admiral Prout Pool (lap swim hours)",
  url: "https://sandiego.navylifesw.com/programs/f6791849-5d31-4c6b-b90e-458552792d33",
  effectiveDate: "2026-06-01",
};
prout.availability = [
  ...forDays([1, 2, 3, 4, 5], "05:00", "08:00", 1),
  ...forDays([1, 2, 3, 4, 5], "11:00", "13:00", 1),
];

const baker = pool("admiral-baker-pool");
baker.guestPass.notes =
  "Military & affiliates; NMCSD lap pool M–F 5:30–8:30am & 10am–7pm, Sat–Sun 12:30–4:30pm per base directory — lane count not published.";
baker.scheduleSource = {
  label: "NMCSD Balboa Pool — Navy Life / base directory lap hours",
  url: "https://medcenter.navylifesw.com/programs/2dbe9a6d-d502-4e02-811c-3860f9c55028",
  effectiveDate: "2026-06-01",
};
baker.availability = [
  ...forDays([1, 2, 3, 4, 5], "05:30", "08:30", 1),
  ...forDays([1, 2, 3, 4, 5], "10:00", "19:00", 1),
  ...forDays([6, 0], "12:30", "16:30", 1),
];

writeFileSync(jsonPath, `${JSON.stringify(pools, null, 2)}\n`);
const searchable = pools.filter((p) => p.availability.length > 0).length;
console.log(`Patched ${jsonPath}`);
console.log(`Pools: ${pools.length}, searchable: ${searchable}`);
