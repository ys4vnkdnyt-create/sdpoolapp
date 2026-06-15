/**
 * Add North County / South Bay / military pools from published schedules.
 * Run: node scripts/patch-county-expansion.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const jsonPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/data/pools/san-diego.json"
);
const pools = JSON.parse(readFileSync(jsonPath, "utf8"));

/** Shorthand for one weekly availability block. */
function block(dayOfWeek, startTime, endTime, lanesAvailable) {
  return { dayOfWeek, startTime, endTime, lanesAvailable };
}

/** Replace pool by id or append if missing. */
function upsert(pool) {
  const i = pools.findIndex((p) => p.id === pool.id);
  if (i >= 0) pools[i] = pool;
  else pools.push(pool);
}

const YMCA_GUEST = {
  costUsd: 15,
  notes: "YMCA day pass ~$15–25; verify at desk — members use membership",
};

// —— YMCA gap: Point Loma (no public lane-grid PDF) ——
upsert({
  id: "peninsula-family-ymca",
  name: "Peninsula Family YMCA (T. Claude & Gladys B. Ryan, Point Loma)",
  address: "4390 Valeta St, San Diego, CA 92107",
  location: { lat: 32.75, lng: -117.233 },
  guestPass: YMCA_GUEST,
  scheduleSource: {
    label: "T. Claude & Gladys B. Ryan Family YMCA — branch page (pool schedule link)",
    url: "https://www.ymcasd.org/locations/t-claude-and-gladys-b-ryan-family-ymca/",
    effectiveDate: "2026-06-01",
  },
  availability: [],
});

// —— Carlsbad ——
upsert({
  id: "alga-norte-aquatic-center",
  name: "Alga Norte Aquatic Center (Carlsbad)",
  address: "6565 Alicante Rd, Carlsbad, CA 92009",
  location: { lat: 33.129, lng: -117.254 },
  guestPass: {
    costUsd: 5,
    notes: "City drop-in; competition + instructional pools — see daily pool-use calendar",
  },
  scheduleSource: {
    label: "City of Carlsbad — pool use calendars (competition pool)",
    url: "https://www.carlsbadca.gov/departments/parks-recreation/aquatics/pool-use-calendars",
    effectiveDate: "2026-06-01",
  },
  availability: [],
});

upsert({
  id: "carlsbad-monroe-swim-complex",
  name: "Carlsbad Community Swim Complex (Monroe St)",
  address: "3401 Monroe St, Carlsbad, CA 92008",
  location: { lat: 33.158, lng: -117.337 },
  guestPass: {
    costUsd: 5,
    notes: "Closed for reconstruction through summer 2026 — verify reopening",
  },
  scheduleSource: {
    label: "City of Carlsbad — aquatics (Monroe St closure notice)",
    url: "https://www.carlsbadca.gov/departments/parks-recreation/aquatics",
    effectiveDate: "2026-06-01",
  },
  availability: [],
});

// —— Oceanside city pools ——
upsert({
  id: "oceanside-brooks-street-pool",
  name: "Brooks Street Swim Center (Oceanside)",
  address: "130 Brooks St, Oceanside, CA 92054",
  location: { lat: 33.198, lng: -117.379 },
  guestPass: {
    costUsd: 5,
    notes: "City drop-in; 7 lap lanes (~33⅓ yd) — lane count approximate",
  },
  scheduleSource: {
    label: "City of Oceanside — Brooks Street Swim Center (lap swim hours)",
    url: "https://www.ci.oceanside.ca.us/Home/Components/FacilityDirectory/FacilityDirectory/2/693",
    effectiveDate: "2026-01-01",
  },
  availability: [
    ...[1, 2, 3, 4, 5].map((d) => block(d, "06:00", "13:15", 7)),
    block(6, "10:15", "13:15", 7),
    block(0, "10:15", "13:15", 7),
  ],
});

upsert({
  id: "oceanside-wagner-aquatic-center",
  name: "William A. Wagner Aquatic Center / El Corazon (Oceanside)",
  address: "3306 Senior Center Dr, Oceanside, CA 92056",
  location: { lat: 33.214, lng: -117.284 },
  guestPass: {
    costUsd: 5,
    notes: "City drop-in; long-course Tue/Thu mornings — lane count not published (min 1)",
  },
  scheduleSource: {
    label: "City of Oceanside — aquatics FAQ (Wagner lap swim hours)",
    url: "https://www.ci.oceanside.ca.us/government/parks-recreation/aquatics/frequently-asked-questions-aquatics",
    effectiveDate: "2026-01-01",
  },
  availability: [
    ...[1, 2, 3, 4, 5].flatMap((d) => [
      block(d, "06:00", "08:00", 1),
      block(d, "09:00", "19:00", 1),
    ]),
    block(6, "10:00", "17:00", 1),
    block(0, "10:00", "17:00", 1),
  ],
});

upsert({
  id: "oceanside-marshall-street-pool",
  name: "Marshall Street Swim Center (Oceanside, seasonal)",
  address: "1404 Marshall St, Oceanside, CA 92058",
  location: { lat: 33.196, lng: -117.358 },
  guestPass: {
    costUsd: 5,
    notes: "Summer-season outdoor pool — call 760-435-5535 for current lap hours",
  },
  scheduleSource: {
    label: "City of Oceanside — aquatics (Marshall St seasonal)",
    url: "https://www.ci.oceanside.ca.us/government/parks-recreation/aquatics",
    effectiveDate: "2026-06-01",
  },
  availability: [],
});

// —— Poway ——
upsert({
  id: "poway-community-swim-center",
  name: "Poway Community Swim Center",
  address: "13094 Civic Center Dr, Poway, CA 92064",
  location: { lat: 32.954, lng: -117.038 },
  guestPass: {
    costUsd: 5,
    notes: "City drop-in; 50m/25yd pool — hours change seasonally (see city page)",
  },
  scheduleSource: {
    label: "City of Poway — Swim Center Hours (Apr 12–Jun 4, 2026 season)",
    url: "https://poway.org/504/Hours",
    effectiveDate: "2026-04-12",
  },
  availability: [
    block(1, "10:30", "19:00", 2),
    block(3, "10:30", "19:00", 2),
    block(5, "10:30", "19:00", 2),
    block(2, "05:30", "13:30", 2),
    block(2, "14:00", "19:00", 2),
    block(4, "05:30", "13:30", 2),
    block(4, "14:00", "19:00", 2),
    block(6, "10:30", "17:00", 2),
    block(0, "10:30", "17:00", 2),
  ],
});

// —— Escondido ——
upsert({
  id: "escondido-james-stone-pool",
  name: "James A. Stone Pool (Escondido)",
  address: "131 W Woodward Ave, Escondido, CA 92025",
  location: { lat: 33.124, lng: -117.081 },
  guestPass: {
    costUsd: 5,
    notes: "Cash drop-in; seasonal lap swim — max 24 swimmers, lanes not published (min 1)",
  },
  scheduleSource: {
    label: "City of Escondido — aquatics (James Stone lap swim, summer season)",
    url: "https://www.escondido.gov/734/Aquatics",
    effectiveDate: "2025-04-01",
  },
  availability: [
    block(2, "07:00", "10:00", 1),
    block(4, "07:00", "10:00", 1),
    block(6, "07:00", "10:00", 1),
    block(0, "07:00", "10:00", 1),
  ],
});

upsert({
  id: "palomar-family-ymca",
  name: "Palomar Family YMCA (Escondido, outdoor pool)",
  address: "1050 N Broadway, Escondido, CA 92026",
  location: { lat: 33.137, lng: -117.08 },
  guestPass: { costUsd: 25, notes: "YMCA day pass; no public lane-grid PDF — call branch" },
  scheduleSource: {
    label: "Palomar Family YMCA — branch page",
    url: "https://www.ymca.org/locations/palomar-family-ymca",
    effectiveDate: "2026-06-01",
  },
  availability: [],
});

// —— San Marcos ——
upsert({
  id: "las-posas-pool-san-marcos",
  name: "Las Posas Pool (Cerro de las Posas, San Marcos)",
  address: "1387 W Borden Rd, San Marcos, CA 92069",
  location: { lat: 33.16, lng: -117.187 },
  guestPass: {
    costUsd: 4,
    notes: "City drop-in or Splash Pass; lane count not published (min 1)",
  },
  scheduleSource: {
    label: "City of San Marcos — Pools & Programs (lap swim)",
    url: "https://www.sanmarcosca.gov/Parks-Recreation/Pools-Programs",
    effectiveDate: "2026-01-01",
  },
  availability: [
    ...[1, 2, 3, 4].flatMap((d) => [
      block(d, "06:30", "10:30", 1),
      block(d, "16:30", "19:30", 1),
    ]),
    block(6, "06:30", "14:30", 1),
    block(0, "06:30", "14:30", 1),
  ],
});

upsert({
  id: "woodland-park-pool-san-marcos",
  name: "Woodland Park Pool (San Marcos)",
  address: "671 Woodland Pkwy, San Marcos, CA 92069",
  location: { lat: 33.15, lng: -117.132 },
  guestPass: {
    costUsd: 4,
    notes: "Reopening for summer 2026 — verify hours at city aquatics page",
  },
  scheduleSource: {
    label: "City of San Marcos — Woodland Park Pool (seasonal reopening)",
    url: "https://www.sanmarcosca.gov/Parks-Recreation/Find-Parks-Pools-Facilities/Woodland-Park-Pool",
    effectiveDate: "2026-06-15",
  },
  availability: [],
});

// —— Vista ——
upsert({
  id: "vista-wave-aquatic",
  name: "The Wave Waterpark (Vista, competition pool lap swim)",
  address: "101 Wave Dr, Vista, CA 92084",
  location: { lat: 33.2, lng: -117.074 },
  guestPass: {
    costUsd: 5,
    notes: "Lap swim drop-in $5; seasonal program — verify on city/wave site",
  },
  scheduleSource: {
    label: "City of Vista / Wave Waterpark — lap swim program (M/W/F mornings)",
    url: "https://www.thewavewaterpark.com/programs/lap-swim",
    effectiveDate: "2026-04-13",
  },
  availability: [
    block(1, "06:00", "08:00", 1),
    block(3, "06:00", "08:00", 1),
    block(5, "06:00", "08:00", 1),
  ],
});

// —— Chula Vista city (not South Bay YMCA) ——
upsert({
  id: "chula-vista-loma-verde-aquatic",
  name: "Loma Verde Aquatic Center (Chula Vista)",
  address: "1420 Loma Ln, Chula Vista, CA 91911",
  location: { lat: 32.604, lng: -117.048 },
  guestPass: {
    costUsd: 5,
    notes: "City aquatics; 50m competition pool — call 619-409-1988 for lap grid",
  },
  scheduleSource: {
    label: "City of Chula Vista — Loma Verde Aquatic Center",
    url: "https://www.chulavistaca.gov/departments/parks-and-recreation/community-centers/loma-verde-aquatic-center",
    effectiveDate: "2026-06-01",
  },
  availability: [],
});

upsert({
  id: "chula-vista-parkway-aquatic",
  name: "Parkway Aquatic Center (Chula Vista)",
  address: "385 Parkway, Chula Vista, CA 91910",
  location: { lat: 32.627, lng: -117.084 },
  guestPass: {
    costUsd: 5,
    notes: "Seasonal lap swim — check city site; no lockers",
  },
  scheduleSource: {
    label: "City of Chula Vista — Parkway Aquatic Center",
    url: "https://www.chulavistaca.gov/departments/parks-and-recreation/community-centers/parkway-aquatic-center",
    effectiveDate: "2026-06-01",
  },
  availability: [],
});

// —— National City ——
upsert({
  id: "national-city-las-palmas-pool",
  name: "Las Palmas Pool (National City)",
  address: "1800 E 22nd St, National City, CA 91950",
  location: { lat: 32.661, lng: -117.098 },
  guestPass: {
    costUsd: 5,
    notes: "Short-term pool schedule PDFs on city site — transcribe when current",
  },
  scheduleSource: {
    label: "City of National City — Las Palmas Pool",
    url: "https://www.nationalcityca.gov/government/community-services/las-palmas-pool",
    effectiveDate: "2026-06-01",
  },
  availability: [],
});

// —— La Mesa ——
upsert({
  id: "la-mesa-municipal-pool",
  name: "La Mesa Municipal Pool",
  address: "5100 Memorial Dr, La Mesa, CA 91941",
  location: { lat: 32.759, lng: -117.023 },
  guestPass: {
    costUsd: 6,
    notes: "City drop-in; spring hours Mar 16–Jun 12, 2026 on website",
  },
  scheduleSource: {
    label: "City of La Mesa — Aquatics (spring 2026 lap swim)",
    url: "https://www.cityoflamesa.us/915/Aquatics",
    effectiveDate: "2026-03-16",
  },
  availability: [
    ...[1, 2, 3, 4, 5].flatMap((d) => [
      block(d, "06:00", "08:30", 2),
      block(d, "11:30", "15:00", 2),
    ]),
    block(1, "18:00", "19:30", 2),
    block(2, "18:00", "19:30", 2),
    block(3, "18:00", "19:30", 2),
    block(4, "18:00", "19:30", 2),
  ],
});

// —— USD / college ——
upsert({
  id: "usd-sports-center-pool",
  name: "USD Sports Center Pool (outdoor)",
  address: "5998 Alcala Park, San Diego, CA 92110",
  location: { lat: 32.772, lng: -117.189 },
  guestPass: {
    costUsd: 0,
    notes: "Campus recreation — no public lap-lane grid published",
  },
  scheduleSource: {
    label: "USD Campus Recreation — aquatics",
    url: "https://www.sandiego.edu/campus-recreation/recreation-classes/aquatics-swimming.php",
    effectiveDate: "2026-06-01",
  },
  availability: [],
});

upsert({
  id: "southwestern-college-aquatics",
  name: "Southwestern College Wellness & Aquatic Complex",
  address: "900 Otay Lakes Rd, Chula Vista, CA 91910",
  location: { lat: 32.64, lng: -116.982 },
  guestPass: {
    costUsd: 10,
    notes: "Community college facility — contact SWCWAC for public lap hours",
  },
  scheduleSource: {
    label: "Southwestern College — Wellness & Aquatic Complex",
    url: "https://www.swccd.edu/swc-community/wellness-and-aquatics-complex/index.aspx",
    effectiveDate: "2026-06-01",
  },
  availability: [],
});

// —— Military ——
upsert({
  id: "camp-pendleton-13-area-pool",
  name: "Camp Pendleton 13 Area Pool",
  address: "Bldg 1315, Vandegrift Blvd, Camp Pendleton, CA 92058",
  location: { lat: 33.304, lng: -117.451 },
  guestPass: {
    costUsd: 0,
    notes: "Base access required; active duty free — see MCCS aquatics",
  },
  scheduleSource: {
    label: "MCCS Camp Pendleton — 13 Area Pool (lap swim & unit PT)",
    url: "https://pendleton.usmc-mccs.org/recreation-fitness/recreation/aquatics/13-area-pool",
    effectiveDate: "2026-06-01",
  },
  military: true,
  availability: [
    block(1, "11:00", "13:00", 1),
    block(2, "11:00", "13:00", 1),
    block(3, "11:00", "13:00", 1),
    block(4, "11:00", "13:00", 1),
  ],
});

// —— East County GUHSD / city ——
upsert({
  id: "el-cajon-fletcher-hills-pool",
  name: "Fletcher Hills Recreation Center Pool (El Cajon)",
  address: "2345 Center Pl, El Cajon, CA 92020",
  location: { lat: 32.79, lng: -116.962 },
  guestPass: {
    costUsd: 5,
    notes: "City recreation; lane count not published (min 1)",
  },
  scheduleSource: {
    label: "City of El Cajon — Fletcher Hills recreation (pool hours via SI LMSC / city)",
    url: "https://www.cityofelcajon.us/your-government/departments/recreation/recreation-centers",
    effectiveDate: "2026-01-01",
  },
  availability: [
    block(1, "14:15", "18:00", 1),
    block(3, "14:15", "18:00", 1),
    block(4, "14:15", "18:00", 1),
    block(5, "14:15", "18:00", 1),
    block(2, "13:00", "18:00", 1),
  ],
});

upsert({
  id: "grossmont-high-school-pool",
  name: "Grossmont High School Pool (GUHSD public lap)",
  address: "1100 Murray Dr, El Cajon, CA 92020",
  location: { lat: 32.82, lng: -117.007 },
  guestPass: {
    costUsd: 5,
    notes: "Seasonal GUHSD aquatics brochure — transcribe when posted",
  },
  scheduleSource: {
    label: "Grossmont Union HS District — aquatics",
    url: "https://www.guhsd.net/Departments/Business-Services/Facilities-and-Construction/Aquatics/index.html",
    effectiveDate: "2026-06-01",
  },
  availability: [],
});

upsert({
  id: "helix-high-school-pool",
  name: "Helix High School Pool (La Mesa, GUHSD)",
  address: "7323 University Ave, La Mesa, CA 91942",
  location: { lat: 32.761, lng: -117.008 },
  guestPass: {
    costUsd: 5,
    notes: "Call GUHSD aquatics 619-644-8172 for seasonal lap hours",
  },
  scheduleSource: {
    label: "GUHSD aquatics — Helix High School",
    url: "https://www.guhsd.net/Departments/Business-Services/Facilities-and-Construction/Aquatics/Locations/index.html",
    effectiveDate: "2026-06-01",
  },
  availability: [],
});

upsert({
  id: "santee-santana-high-school-pool",
  name: "Santana High School Pool (Santee, GUHSD)",
  address: "9915 Magnolia Ave, Santee, CA 92071",
  location: { lat: 32.845, lng: -116.985 },
  guestPass: {
    costUsd: 5,
    notes: "Seasonal GUHSD lap swim — see district aquatics brochure",
  },
  scheduleSource: {
    label: "GUHSD aquatics — Santana High School",
    url: "https://www.guhsd.net/Departments/Business-Services/Facilities-and-Construction/Aquatics/index.html",
    effectiveDate: "2026-06-01",
  },
  availability: [],
});

upsert({
  id: "lakeside-el-capitan-pool",
  name: "El Capitan High School Pool (Lakeside, GUHSD)",
  address: "10410 Ashwood St, Lakeside, CA 92040",
  location: { lat: 32.857, lng: -116.922 },
  guestPass: {
    costUsd: 5,
    notes: "Seasonal GUHSD lap swim — see district aquatics brochure",
  },
  scheduleSource: {
    label: "GUHSD aquatics — El Capitan High School",
    url: "https://www.guhsd.net/Departments/Business-Services/Facilities-and-Construction/Aquatics/index.html",
    effectiveDate: "2026-06-01",
  },
  availability: [],
});

// —— Private clubs (no public grid) ——
upsert({
  id: "scripps-ranch-swim-racquet-club",
  name: "Scripps Ranch Swim & Racquet Club (private)",
  address: "9875 Aviary Dr, San Diego, CA 92131",
  location: { lat: 32.913, lng: -117.091 },
  guestPass: {
    costUsd: 0,
    notes: "Private club — call 858-271-6222 for guest/lap policy",
  },
  scheduleSource: {
    label: "Scripps Ranch SRC — private club",
    url: "http://www.srsrc.com/",
    effectiveDate: "2026-06-01",
  },
  availability: [],
});

upsert({
  id: "poway-rancho-arbolitos-pool",
  name: "Rancho Arbolitos Swim & Tennis Club (private, Poway)",
  address: "14343 Silverset St, Poway, CA 92064",
  location: { lat: 32.939, lng: -117.05 },
  guestPass: {
    costUsd: 0,
    notes: "Private club — call for lap swim / guest access",
  },
  scheduleSource: {
    label: "Rancho Arbolitos — private club",
    url: "http://ranchoarbolitos.com/",
    effectiveDate: "2026-06-01",
  },
  availability: [],
});

writeFileSync(jsonPath, `${JSON.stringify(pools, null, 2)}\n`);
const searchable = pools.filter((p) => p.availability.length > 0).length;
console.log(`san-diego.json: ${pools.length} pools, ${searchable} searchable (non-empty availability)`);
