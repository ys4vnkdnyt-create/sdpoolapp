/**
 * Report pools whose weekday grids look copy-pasted (same times/lanes on many days).
 * Run: node scripts/audit-pool-schedules.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const POOLS_PATH = path.join(ROOT, "src/data/pools/pools.json");

/** Fingerprint one weekday's windows for comparison. */
function dayFingerprint(windows, day) {
  return windows
    .filter((w) => w.dayOfWeek === day)
    .map((w) => `${w.startTime}-${w.endTime}:${w.lanesAvailable}`)
    .sort()
    .join("|");
}

const pools = JSON.parse(fs.readFileSync(POOLS_PATH, "utf-8"));
let flagged = 0;

for (const pool of pools) {
  if (!pool.availability?.length) continue;

  const fingerprints = new Map();
  for (let day = 0; day <= 6; day++) {
    const fp = dayFingerprint(pool.availability, day);
    if (!fp) continue;
    const list = fingerprints.get(fp) ?? [];
    list.push(day);
    fingerprints.set(fp, list);
  }

  for (const [fp, days] of fingerprints) {
    if (days.length >= 4) {
      flagged++;
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      console.log(
        `\n${pool.name} (${pool.id}): same grid on ${days.map((d) => dayNames[d]).join(", ")}`
      );
      console.log(`  pattern: ${fp.slice(0, 120)}${fp.length > 120 ? "…" : ""}`);
    }
  }
}

console.log(
  flagged
    ? `\n${flagged} pool(s) flagged — verify each day against the PDF.`
    : "\nNo copy-paste patterns detected (4+ identical weekdays)."
);
