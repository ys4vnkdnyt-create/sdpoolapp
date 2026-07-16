import type { Pool } from "../types/index.js";

/** True when the name signals a public lap venue (city, YMCA, rec center, etc.). */
function isLikelyPublicLapVenue(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    /\bcity of\b/.test(lower) ||
    /\bcounty\b/.test(lower) ||
    /\bparks and recreation\b/.test(lower) ||
    /\bymca\b/.test(lower) ||
    /\brecreation center\b/.test(lower) ||
    /\brec center\b/.test(lower) ||
    /\bcommunity center\b/.test(lower) ||
    /\baquatic center\b/.test(lower) ||
    /\bpublic pool\b/.test(lower) ||
    /\bmunicipal\b/.test(lower) ||
    /\buniversity\b/.test(lower) ||
    /\bu\.? of a\b/.test(lower) ||
    /\bcampus rec\b/.test(lower) ||
    /\bhigh school pool\b/.test(lower) ||
    /\bcollege\b/.test(lower) ||
    /\bwellness & aquatic\b/.test(lower) ||
    /\bsports center pool\b/.test(lower)
  );
}

/** Names that are never public lap options, even if they slipped into a pantry. */
function isAbsurdNonPublicName(name: string): boolean {
  const lower = name.trim().toLowerCase();
  if (!lower) return true;
  return (
    lower === "pool" ||
    /\bsplash pad\b/.test(lower) ||
    /\bhot tub\b/.test(lower) ||
    /\bleslie'?s pool supplies\b/.test(lower) ||
    /\bpool supplies\b/.test(lower)
  );
}

/**
 * True when a pool is unlikely to be a public drop-in lap option.
 * Used during OSM discovery and when cleaning skeleton pantries.
 */
export function isLikelyNonLapPool(
  name: string,
  tags?: Record<string, string>
): boolean {
  const lower = name.trim().toLowerCase();
  if (!lower) return true;

  // Military bases can be public for eligible swimmers — keep when tagged.
  const isMilitary = tags?.military === "yes" || tags?.military === "true";

  if (tags?.access === "private" && !isMilitary) return true;

  if (isAbsurdNonPublicName(name)) return true;

  // Water parks, lesson pools, and retail — not public lap drop-in.
  if (/\bwave pool\b/.test(lower)) return true;
  if (/\bwater park\b|\bsix flags\b|\bwet n wild\b|\bcommotion ocean\b/.test(lower)) {
    return true;
  }
  if (/\bswim school\b/.test(lower)) return true;
  if (/\bhotel\b|\bresort\b|\blodge pool\b|\blodge\b/.test(lower)) return true;
  if (/\bspa\b/.test(lower) && !/\bymca\b/.test(lower)) return true;
  if (/\bapartment\b|\bcondo\b|\bhoa\b/.test(lower)) return true;
  if (/\bcountry club\b|\bmarina club\b/.test(lower)) return true;
  if (/\bprivado\b|\bvillas pool\b/.test(lower)) return true;
  if (/\brooftop pool\b/.test(lower)) return true;
  if (/\bla quinta\b/.test(lower)) return true;
  if (/\bthe phoenician\b/.test(lower)) return true;
  if (/\brevel surf\b/.test(lower)) return true;
  if (/\bracoon lagoon\b|\braccoon lagoon\b/.test(lower)) return true;
  if (/\bhurricane bay\b/.test(lower)) return true;
  if (/\bchildren'?s pool\b/.test(lower)) return true;
  if (/\bheated pool\b/.test(lower)) return true;
  if (/\bsuper 8\b/.test(lower)) return true;
  if (/\becono lodge\b/.test(lower)) return true;
  if (/\btennis club\b|\bracquet club\b|\bswim & tennis\b/.test(lower)) return true;
  if (/\b24 hour fitness\b|\bla fitness\b/.test(lower)) return true;
  if (/\bprivate\b/.test(lower)) return true;
  if (/\bmarriott\b|\bdays inn\b|\bextended stay\b|\bhilton\b|\bramada\b|\bfairmont\b/.test(lower)) {
    return true;
  }
  if (/\bcabana club\b|\bhomeowners association\b|\bicha\b/.test(lower)) return true;
  if (/\bbaby pool\b|\bkid'?s\)? pool\b|\bshallow \(kid/.test(lower)) return true;
  if (/\bdisneyland\b|\bmonorail pool\b/.test(lower)) return true;
  if (/\bpool service\b|\bgreystar\b/.test(lower)) return true;
  if (lower === "-" || lower === "jacuzzi") return true;

  // Public venues override HOA-style naming below.
  if (isLikelyPublicLapVenue(name)) return false;

  // HOA / subdivision pools — not public drop-in options.
  if (/\bcommunity pool\b/.test(lower)) return true;
  if (/\bvillage pool\b/.test(lower)) return true;
  if (/\bvillage swimming pool\b/.test(lower)) return true;
  if (/\bgardens swimming pool\b/.test(lower)) return true;
  if (/\bhollow pool\b/.test(lower)) return true;
  if (/\bhill community pool\b/.test(lower)) return true;
  if (/\bconnect at .* pool\b/.test(lower)) return true;
  if (/\bsouthpark \d pool\b/.test(lower)) return true;

  return false;
}

/**
 * Whether to drop a pool from a live pantry file.
 * San Diego safety: keep anything with real schedule data unless the name is absurd.
 */
export function shouldRemovePoolFromPantry(pool: Pool): boolean {
  if (pool.military) return false;

  if (pool.availability.length > 0) {
    return isAbsurdNonPublicName(pool.name);
  }

  return isLikelyNonLapPool(pool.name);
}
