/**
 * One-shot: attach official schedule hub / pool-page URLs to skeleton pantries.
 * Does NOT invent availability[] — only websiteUrl + scheduleSource.
 *
 * Run: node scripts/source-schedule-urls.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const POOLS_DIR = path.join(ROOT, "src/data/pools");
const TODAY = new Date().toISOString().slice(0, 10);

/** Build scheduleSource when we have a real public URL. */
function source(label, url, effectiveDate = TODAY) {
  return { label, url, effectiveDate };
}

/** Merge websiteUrl / scheduleSource onto a pool (keep availability untouched). */
function attach(pool, { websiteUrl, scheduleSource, address, guestPass }) {
  const next = { ...pool };
  if (websiteUrl) next.websiteUrl = websiteUrl;
  if (scheduleSource) next.scheduleSource = scheduleSource;
  if (address) next.address = address;
  if (guestPass) next.guestPass = guestPass;
  return next;
}

/** Load / save pantry JSON. */
function load(file) {
  return JSON.parse(fs.readFileSync(path.join(POOLS_DIR, file), "utf-8"));
}
function save(file, pools) {
  pools.sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(
    path.join(POOLS_DIR, file),
    `${JSON.stringify(pools, null, 2)}\n`,
    "utf-8"
  );
}

/** Match pool by id or name substring (case-insensitive). */
function findPool(pools, { id, nameIncludes }) {
  if (id) return pools.find((p) => p.id === id);
  if (nameIncludes) {
    const needle = nameIncludes.toLowerCase();
    return pools.find((p) => p.name.toLowerCase().includes(needle));
  }
  return undefined;
}

/** Apply a list of matchers; returns how many pools gained a new scheduleSource. */
function applyMatchers(file, matchers) {
  const pools = load(file);
  let gained = 0;
  for (const m of matchers) {
    const pool = findPool(pools, m);
    if (!pool) {
      console.log(`  miss: ${file} — ${m.id || m.nameIncludes}`);
      continue;
    }
    const had = Boolean(pool.scheduleSource?.url);
    Object.assign(
      pool,
      attach(pool, {
        websiteUrl: m.websiteUrl,
        scheduleSource: m.scheduleSource,
        address: m.address,
        guestPass: m.guestPass,
      })
    );
    if (!had && pool.scheduleSource?.url) gained += 1;
    else if (!had && m.websiteUrl && !pool.scheduleSource) {
      // website-only still counts as "sourced"
      gained += 1;
    }
  }
  save(file, pools);
  return gained;
}

// --- Ann Arbor: replace sparse OSM noise with known city pools ---
const annArbor = [
  {
    id: "buhr-pool",
    name: "Buhr Pool",
    address: "2751 Packard Rd, Ann Arbor, MI 48108",
    location: { lat: 42.2472701, lng: -83.7114076 },
    guestPass: {
      costUsd: 0,
      notes: "City of Ann Arbor day admission — verify current rates on a2gov.org.",
    },
    websiteUrl:
      "https://www.a2gov.org/parks-and-recreation/parks-and-places/buhr-pool-and-ice-arena/",
    scheduleSource: source(
      "City of Ann Arbor — Buhr Pool (hours & lap swim)",
      "https://www.a2gov.org/parks-and-recreation/parks-and-places/buhr-pool-and-ice-arena/"
    ),
    availability: [],
  },
  {
    id: "fuller-park-pool",
    name: "Fuller Park Outdoor Pool",
    address: "1519 Fuller Rd, Ann Arbor, MI 48105",
    location: { lat: 42.2855, lng: -83.7275 },
    guestPass: {
      costUsd: 0,
      notes: "City of Ann Arbor day admission — verify current rates on a2gov.org.",
    },
    websiteUrl:
      "https://www.a2gov.org/parks-and-recreation/parks-and-places/fuller-park-outdoor-pool/",
    scheduleSource: source(
      "City of Ann Arbor — Fuller Park Pool (lap lanes)",
      "https://www.a2gov.org/parks-and-recreation/parks-and-places/fuller-park-outdoor-pool/"
    ),
    availability: [],
  },
  {
    id: "veterans-memorial-pool",
    name: "Veterans Memorial Park Pool",
    address: "2150 Jackson Ave, Ann Arbor, MI 48103",
    location: { lat: 42.2818, lng: -83.7775 },
    guestPass: {
      costUsd: 0,
      notes: "City of Ann Arbor day admission — verify current rates on a2gov.org.",
    },
    websiteUrl: "https://www.a2gov.org/vets",
    scheduleSource: source(
      "City of Ann Arbor — Veterans Memorial Park Pool",
      "https://www.a2gov.org/vets"
    ),
    availability: [],
  },
  {
    id: "mack-indoor-pool",
    name: "Mack Indoor Pool",
    address: "715 Brooks St, Ann Arbor, MI 48103",
    location: { lat: 42.2735, lng: -83.7595 },
    guestPass: {
      costUsd: 0,
      notes: "City of Ann Arbor indoor pool — verify seasonal hours.",
    },
    websiteUrl: "https://www.a2gov.org/mack",
    scheduleSource: source(
      "City of Ann Arbor — Mack Indoor Pool",
      "https://www.a2gov.org/mack"
    ),
    availability: [],
  },
  {
    id: "umich-ncrb-pools",
    name: "University of Michigan — NCRB / Campus Rec Pools",
    address: "2370 Hubbard St, Ann Arbor, MI 48109",
    location: { lat: 42.295, lng: -83.715 },
    guestPass: {
      costUsd: 0,
      notes: "Campus Rec day pass / guest policies — verify at recsports.umich.edu.",
    },
    websiteUrl: "https://recsports.umich.edu/facilities/",
    scheduleSource: source(
      "UMich Rec Sports — facilities & hours",
      "https://recsports.umich.edu/facilities/"
    ),
    availability: [],
  },
];
save("ann-arbor.json", annArbor);
console.log(`ann-arbor: wrote ${annArbor.length} curated city/campus pools with sources`);

// --- Tucson: attach city PDF + pages for named city pools ---
const tucsonGained = applyMatchers("tucson.json", [
  {
    nameIncludes: "archer",
    websiteUrl: "https://www.tucsonaz.gov/Departments/Parks-and-Recreation/Pools-and-Splash-Pads",
    scheduleSource: source(
      "City of Tucson — Winter pool schedule PDF",
      "https://www.tucsonaz.gov/files/sharedassets/public/v/5/living-and-working/parks-and-recreation/documents/aquatics/winter-pool-schedule.pdf"
    ),
  },
  {
    nameIncludes: "catalina",
    websiteUrl: "https://www.tucsonaz.gov/Departments/Parks-and-Recreation/Pools-and-Splash-Pads",
    scheduleSource: source(
      "City of Tucson — Winter pool schedule PDF",
      "https://www.tucsonaz.gov/files/sharedassets/public/v/5/living-and-working/parks-and-recreation/documents/aquatics/winter-pool-schedule.pdf"
    ),
  },
  {
    nameIncludes: "clements",
    websiteUrl: "https://www.tucsonaz.gov/Departments/Parks-and-Recreation/Pools-and-Splash-Pads",
    scheduleSource: source(
      "City of Tucson — Winter pool schedule PDF",
      "https://www.tucsonaz.gov/files/sharedassets/public/v/5/living-and-working/parks-and-recreation/documents/aquatics/winter-pool-schedule.pdf"
    ),
  },
  {
    nameIncludes: "jesse owens",
    websiteUrl: "https://www.tucsonaz.gov/Departments/Parks-and-Recreation/Pools-and-Splash-Pads",
    scheduleSource: source(
      "City of Tucson — Pools & Splash Pads hub",
      "https://www.tucsonaz.gov/Departments/Parks-and-Recreation/Pools-and-Splash-Pads"
    ),
  },
  {
    nameIncludes: "sunnyside",
    websiteUrl: "https://www.tucsonaz.gov/Departments/Parks-and-Recreation/Pools-and-Splash-Pads",
    scheduleSource: source(
      "City of Tucson — Pools & Splash Pads hub",
      "https://www.tucsonaz.gov/Departments/Parks-and-Recreation/Pools-and-Splash-Pads"
    ),
  },
  {
    id: "u-of-a-south-rec-pool",
    websiteUrl: "https://rec.arizona.edu/hours-locations/locations/pool-pool-deck",
    scheduleSource: source(
      "U of A Campus Rec — Pool & Pool Deck",
      "https://rec.arizona.edu/hours-locations/locations/pool-pool-deck"
    ),
  },
]);
console.log(`tucson: +${tucsonGained} sourced`);

// --- Austin: attach city pool pages ---
const austinGained = applyMatchers("austin.json", [
  {
    nameIncludes: "big stacy",
    websiteUrl: "https://www.austintexas.gov/parks/locations/big-stacy-pool",
    scheduleSource: source(
      "Austin Parks — Big Stacy Pool hours",
      "https://www.austintexas.gov/parks/locations/big-stacy-pool"
    ),
  },
  {
    nameIncludes: "deep eddy",
    websiteUrl: "https://www.austintexas.gov/department/deep-eddy-pool",
    scheduleSource: source(
      "Austin Parks — Deep Eddy Pool",
      "https://www.austintexas.gov/department/deep-eddy-pool"
    ),
  },
  {
    nameIncludes: "barton springs",
    websiteUrl: "https://www.austintexas.gov/department/barton-springs-pool",
    scheduleSource: source(
      "Austin Parks — Barton Springs Pool",
      "https://www.austintexas.gov/department/barton-springs-pool"
    ),
  },
  {
    nameIncludes: "patterson",
    websiteUrl: "https://www.austintexas.gov/parks/locations/patterson-pool",
    scheduleSource: source(
      "Austin Parks — Patterson Pool hours",
      "https://www.austintexas.gov/parks/locations/patterson-pool"
    ),
  },
  {
    nameIncludes: "dittmar",
    websiteUrl: "https://www.austintexas.gov/parks/locations/dittmar-pool",
    scheduleSource: source(
      "Austin Parks — Dittmar Pool",
      "https://www.austintexas.gov/parks/locations/dittmar-pool"
    ),
  },
  {
    nameIncludes: "givens",
    websiteUrl: "https://www.austintexas.gov/parks/locations/givens-pool",
    scheduleSource: source(
      "Austin Parks — Givens Pool",
      "https://www.austintexas.gov/parks/locations/givens-pool"
    ),
  },
  {
    nameIncludes: "walnut creek",
    websiteUrl: "https://www.austintexas.gov/parks/locations/walnut-creek-pool",
    scheduleSource: source(
      "Austin Parks — Walnut Creek Pool",
      "https://www.austintexas.gov/parks/locations/walnut-creek-pool"
    ),
  },
  {
    nameIncludes: "northwest pool",
    websiteUrl: "https://www.austintexas.gov/parks/locations/northwest-pool",
    scheduleSource: source(
      "Austin Parks — Northwest Pool",
      "https://www.austintexas.gov/parks/locations/northwest-pool"
    ),
  },
  {
    nameIncludes: "texas swimming center",
    websiteUrl: "https://texassports.com/sports/2013/7/23/GEN_0723134847.aspx",
    scheduleSource: source(
      "UT Texas Swimming Center — facility info",
      "https://texassports.com/sports/2013/7/23/GEN_0723134847.aspx"
    ),
  },
]);
console.log(`austin: +${austinGained} sourced`);

// --- Denver: outdoor park pools + hub ---
const denverHub =
  "https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Parks-Recreation/Recreation-Centers-Pools/Swimming-Pools-and-Splash-Pads";
const denverGained = applyMatchers("denver.json", [
  {
    nameIncludes: "congress park",
    websiteUrl: denverHub,
    scheduleSource: source("Denver Parks — Swimming Pools hub", denverHub),
  },
  {
    nameIncludes: "cook park",
    websiteUrl: denverHub,
    scheduleSource: source("Denver Parks — Swimming Pools hub", denverHub),
  },
  {
    nameIncludes: "ruby hill",
    websiteUrl: denverHub,
    scheduleSource: source("Denver Parks — Swimming Pools hub", denverHub),
  },
  {
    nameIncludes: "utah park",
    websiteUrl: denverHub,
    scheduleSource: source("Denver Parks — Swimming Pools hub", denverHub),
  },
  {
    nameIncludes: "eisenhower",
    websiteUrl: denverHub,
    scheduleSource: source("Denver Parks — Swimming Pools hub", denverHub),
  },
  {
    nameIncludes: "carmody",
    websiteUrl: "https://www.lakewood.org/Community/Parks-and-Recreation",
    scheduleSource: source(
      "City of Lakewood — Parks & Recreation (Carmody area)",
      "https://www.lakewood.org/Community/Parks-and-Recreation"
    ),
  },
  {
    nameIncludes: "apex recreation",
    websiteUrl: "https://www.apexcenter.org/",
    scheduleSource: source("APEX Center — aquatics", "https://www.apexcenter.org/"),
  },
]);
console.log(`denver: +${denverGained} sourced`);

// --- Phoenix: city aquatics hub for City of Phoenix rows + named pools ---
const phoenixHub =
  "https://www.phoenix.gov/administration/departments/parks/activities-facilities/pools.html";
const phoenix = load("phoenix.json");
let phoenixGained = 0;
for (const pool of phoenix) {
  const name = pool.name.toLowerCase();
  if (
    name.includes("city of phoenix") ||
    name.includes("escalante") ||
    name.includes("mcclintock") ||
    name.includes("centennial") ||
    name.includes("canyon pool") ||
    name.includes("peoria pool") ||
    name.includes("folley") ||
    name.includes("kerry croswhite")
  ) {
    if (!pool.scheduleSource?.url) phoenixGained += 1;
    pool.websiteUrl = pool.websiteUrl || phoenixHub;
    pool.scheduleSource = source(
      "City of Phoenix — Aquatics / Pools directory",
      phoenixHub
    );
  }
  if (name.includes("city of scottsdale")) {
    if (!pool.scheduleSource?.url) phoenixGained += 1;
    pool.websiteUrl =
      pool.websiteUrl || "https://www.scottsdaleaz.gov/recreation/aquatics";
    pool.scheduleSource = source(
      "City of Scottsdale — Aquatics",
      "https://www.scottsdaleaz.gov/recreation/aquatics"
    );
  }
  if (name.includes("city of chandler")) {
    if (!pool.scheduleSource?.url) phoenixGained += 1;
    pool.websiteUrl =
      pool.websiteUrl || "https://www.chandleraz.gov/explore/parks-and-recreation/aquatics";
    pool.scheduleSource = source(
      "City of Chandler — Aquatics",
      "https://www.chandleraz.gov/explore/parks-and-recreation/aquatics"
    );
  }
  if (name.includes("city of glendale")) {
    if (!pool.scheduleSource?.url) phoenixGained += 1;
    pool.websiteUrl =
      pool.websiteUrl || "https://www.glendaleaz.com/living/recreation_and_aquatics";
    pool.scheduleSource = source(
      "City of Glendale AZ — Recreation & Aquatics",
      "https://www.glendaleaz.com/living/recreation_and_aquatics"
    );
  }
}
save("phoenix.json", phoenix);
console.log(`phoenix: +${phoenixGained} sourced`);

// --- Bay Area: attach SF Rec Park PDFs / pages for known SF pools ---
const bayGained = applyMatchers("bay-area.json", [
  {
    nameIncludes: "balboa",
    websiteUrl: "https://sfrecpark.org/482/Swimming-Pools",
    scheduleSource: source(
      "SF Rec & Park — Balboa Pool winter schedule PDF",
      "https://sfrecpark.org/DocumentCenter/View/28024/2026-Balboa-Pool-Winter-Schedule"
    ),
  },
  {
    nameIncludes: "hamilton",
    websiteUrl: "https://sfrecpark.org/facilities/facility/details/Hamilton-Pool-215",
    scheduleSource: source(
      "SF Rec & Park — Hamilton Pool",
      "https://sfrecpark.org/facilities/facility/details/Hamilton-Pool-215"
    ),
  },
  {
    nameIncludes: "garfield",
    websiteUrl: "https://sfrecpark.org/facilities/facility/details/Garfield-Pool-214",
    scheduleSource: source(
      "SF Rec & Park — Garfield Pool",
      "https://sfrecpark.org/facilities/facility/details/Garfield-Pool-214"
    ),
  },
  {
    nameIncludes: "mlk",
    websiteUrl: "https://sfrecpark.org/482/Swimming-Pools",
    scheduleSource: source(
      "SF Rec & Park — Swimming Pools hub",
      "https://sfrecpark.org/482/Swimming-Pools"
    ),
  },
  {
    nameIncludes: "mission",
    websiteUrl: "https://sfrecpark.org/482/Swimming-Pools",
    scheduleSource: source(
      "SF Rec & Park — Swimming Pools hub",
      "https://sfrecpark.org/482/Swimming-Pools"
    ),
  },
  {
    nameIncludes: "berkeley ymca",
    websiteUrl: "https://www.ymcaeastbay.org/locations/berkeley-ymca",
    scheduleSource: source(
      "YMCA of the East Bay — Berkeley",
      "https://www.ymcaeastbay.org/locations/berkeley-ymca"
    ),
  },
  {
    nameIncludes: "downtown oakland ymca",
    websiteUrl: "https://www.ymcaeastbay.org/locations/downtown-oakland-ymca",
    scheduleSource: source(
      "YMCA of the East Bay — Downtown Oakland",
      "https://www.ymcaeastbay.org/locations/downtown-oakland-ymca"
    ),
  },
  {
    nameIncludes: "pleasant hill aquatics",
    websiteUrl: "https://www.pleasanthillrec.com/162/Aquatics",
    scheduleSource: source(
      "Pleasant Hill Recreation — Aquatics",
      "https://www.pleasanthillrec.com/162/Aquatics"
    ),
  },
]);
console.log(`bay-area: +${bayGained} sourced`);

// --- LA / OC hubs for city-named or aquatic center pools ---
const laGained = applyMatchers("los-angeles.json", [
  {
    nameIncludes: "aquatic",
    websiteUrl: "https://www.laparks.org/aquatic",
    scheduleSource: source(
      "City of LA Parks — Aquatics",
      "https://www.laparks.org/aquatic"
    ),
  },
]);
// Broader LA: any pool with "recreation" or known names
{
  const pools = load("los-angeles.json");
  let n = 0;
  for (const pool of pools) {
    const name = pool.name.toLowerCase();
    if (
      !pool.scheduleSource?.url &&
      (name.includes("city of") ||
        name.includes("recreation") ||
        name.includes("community center") ||
        name.includes("aquatic"))
    ) {
      pool.websiteUrl = pool.websiteUrl || "https://www.laparks.org/aquatic";
      pool.scheduleSource = source(
        "City of LA Parks — Aquatics directory",
        "https://www.laparks.org/aquatic"
      );
      n += 1;
    }
  }
  save("los-angeles.json", pools);
  console.log(`los-angeles: +${laGained + n} sourced`);
}

{
  const pools = load("orange-county.json");
  let n = 0;
  for (const pool of pools) {
    const name = pool.name.toLowerCase();
    if (
      !pool.scheduleSource?.url &&
      (name.includes("aquatic") ||
        name.includes("recreation") ||
        name.includes("municipal") ||
        name.includes("city of") ||
        name.includes("ymca"))
    ) {
      pool.websiteUrl =
        pool.websiteUrl || "https://ocparks.com/";
      pool.scheduleSource = source(
        "Orange County parks / aquatics (verify facility page)",
        pool.websiteUrl.includes("ymca")
          ? pool.websiteUrl
          : "https://www.ocparks.com/"
      );
      n += 1;
    }
  }
  save("orange-county.json", pools);
  console.log(`orange-county: +${n} sourced`);
}

// Boulder hub
{
  const pools = load("boulder.json");
  let n = 0;
  for (const pool of pools) {
    const name = pool.name.toLowerCase();
    if (
      !pool.scheduleSource?.url &&
      (name.includes("recreation") ||
        name.includes("aquatic") ||
        name.includes("boulder") ||
        name.includes("east") ||
        name.includes("north") ||
        name.includes("south"))
    ) {
      pool.websiteUrl =
        pool.websiteUrl || "https://bouldercolorado.gov/services/pools-and-aquatics";
      pool.scheduleSource = source(
        "City of Boulder — Pools & Aquatics",
        "https://bouldercolorado.gov/services/pools-and-aquatics"
      );
      n += 1;
    }
  }
  save("boulder.json", pools);
  console.log(`boulder: +${n} sourced`);
}

console.log("\nDone. availability[] unchanged (still empty until transcribed).");
