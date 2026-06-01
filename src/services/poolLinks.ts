import type { Pool } from "../types/index.js";

/** Links and phone we show on pool cards (from pantry or org defaults). */
export interface PoolLinks {
  scheduleUrl?: string;
  websiteUrl?: string;
  contactPhone?: string;
}

/** Main lines when a pool has no dedicated phone in the pantry. */
const ORG_PHONE_BY_POOL_ID: Record<string, string> = {
  "ryan-family-ymca": "6192268888",
  "cameron-family-ymca": "8584848390",
  "copley-price-ymca": "6192639622",
  "john-a-davis-family-ymca": "8582713010",
  "border-view-family-ymca": "6194287942",
  "mcgrath-family-ymca": "7609419622",
  "magdalena-ecke-ymca": "7609429622",
  "mission-valley-ymca": "6192983576",
  "dan-mckinney-ymca": "8584533483",
  "toby-wells-ymca": "8584969622",
  "joe-mary-mottino-family-ymca": "7609419622",
  "jackie-robinson-family-ymca": "6192640140",
  "south-bay-family-ymca": "6194219622",
  "rancho-family-ymca": "8584848390",
  "palomar-family-ymca": "7602689622",
  "plunge-san-diego": "6197561141",
  "coggan-family-aquatic-complex": "6196671300",
  "coronado-aquatics-center": "6195227344",
  "brian-bent-memorial-aquatics": "6194237946",
  "kroc-center-pool": "6192873622",
  "pardee-aquatics-center": "8587202184",
  "lfjcc-pool": "8583621348",
  "ucsd-canyonview-pool": "8585342547",
};

/** Facility / org homepages when schedule is a PDF. */
const WEBSITE_BY_POOL_ID: Record<string, string> = {
  "ryan-family-ymca": "https://www.ymcasd.org/locations/t-claude-and-gladys-b-ryan-family-ymca/",
  "cameron-family-ymca": "https://www.ymcasd.org/locations/cameron-family-ymca/",
  "copley-price-ymca": "https://www.ymcasd.org/locations/copley-price-family-ymca/",
  "john-a-davis-family-ymca": "https://www.ymcasd.org/locations/john-a-davis-family-ymca/",
  "border-view-family-ymca": "https://www.ymcasd.org/locations/border-view-family-ymca/",
  "mcgrath-family-ymca": "https://www.ymcasd.org/locations/mcgrath-family-ymca/",
  "magdalena-ecke-ymca": "https://www.ymcasd.org/locations/magdalena-ecke-family-ymca/",
  "mission-valley-ymca": "https://www.ymcasd.org/locations/mission-valley-ymca/",
  "dan-mckinney-ymca": "https://www.ymcasd.org/locations/dan-mckinney-family-ymca/",
  "toby-wells-ymca": "https://www.ymcasd.org/locations/toby-wells-ymca/",
  "joe-mary-mottino-family-ymca": "https://www.ymcasd.org/locations/joe-and-mary-mottino-family-ymca/",
  "jackie-robinson-family-ymca": "https://www.ymcasd.org/locations/jackie-robinson-family-ymca/",
  "south-bay-family-ymca": "https://www.ymcasd.org/locations/south-bay-family-ymca/",
  "rancho-family-ymca": "https://www.ymcasd.org/locations/rancho-family-ymca/",
  "palomar-family-ymca": "https://www.ymca.org/locations/palomar-family-ymca",
};

/** Guess org homepage from schedule URL host. */
function deriveWebsiteFromScheduleUrl(scheduleUrl: string): string | undefined {
  try {
    const host = new URL(scheduleUrl).hostname;
    if (host.includes("sandiego.gov")) {
      return "https://www.sandiego.gov/park-and-recreation/aquatics";
    }
    if (host.includes("ymcasd.org")) {
      return "https://www.ymcasd.org/locations/";
    }
    if (host.includes("coronado.ca.us")) {
      return "https://www.coronado.ca.us/311/Aquatics-Center";
    }
    if (host.includes("chulavistaca.gov")) {
      return "https://www.chulavistaca.gov/departments/parks-and-recreation/aquatics";
    }
    if (host.includes("nationalcityca.gov")) {
      return "https://www.nationalcityca.gov/government/community-services/las-palmas-pool";
    }
    if (host.includes("ci.oceanside.ca.us")) {
      return "https://www.ci.oceanside.ca.us/government/parks-recreation/aquatics";
    }
    if (host.includes("carlsbadca.gov")) {
      return "https://www.carlsbadca.gov/departments/parks-recreation/aquatics";
    }
    if (host.includes("poway.org")) {
      return "https://poway.org/504/Aquatics";
    }
    if (host.includes("24hourfitness.com")) {
      return scheduleUrl;
    }
    if (host.includes("lafitness.com")) {
      return scheduleUrl;
    }
    // Non-PDF page doubles as facility site.
    if (!scheduleUrl.toLowerCase().endsWith(".pdf")) {
      return scheduleUrl;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/** Fallback phone by pool type when id is not in the table. */
function derivePhone(pool: Pool): string | undefined {
  const id = pool.id;
  if (id.includes("ymca")) return "8582921611";
  if (
    id.endsWith("-pool") &&
    (id.includes("allied") ||
      id.includes("bud-kearns") ||
      id.includes("carmel") ||
      id.includes("city-heights") ||
      id.includes("clairemont") ||
      id.includes("colina") ||
      id.includes("kearny") ||
      id.includes("memorial") ||
      id.includes("mlk") ||
      id.includes("swanson") ||
      id.includes("tierrasanta") ||
      id.includes("vista-terrace") ||
      id.includes("ned-baumer") ||
      id.includes("standley"))
  ) {
    return "6195258247";
  }
  if (id.includes("24-hour-fitness")) return "8004326348";
  if (id.includes("la-fitness")) return "8004326348";
  if (pool.military) return "6195567404";
  return undefined;
}

/** Resolve schedule, website, and call links for UI cards. */
export function resolvePoolLinks(pool: Pool): PoolLinks {
  const scheduleUrl = pool.scheduleSource?.url;
  const websiteUrl =
    pool.websiteUrl ??
    WEBSITE_BY_POOL_ID[pool.id] ??
    (scheduleUrl ? deriveWebsiteFromScheduleUrl(scheduleUrl) : undefined);

  const contactPhone =
    pool.contactPhone ??
    ORG_PHONE_BY_POOL_ID[pool.id] ??
    derivePhone(pool);

  return { scheduleUrl, websiteUrl, contactPhone };
}

/** Digits only for tel: links. */
export function phoneToTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `tel:+1${digits}` : `tel:${digits}`;
}
