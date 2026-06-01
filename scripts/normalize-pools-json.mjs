/**
 * Rewrite pools.json with normalizeExplicitBlocks (merge overlaps / touching rows per day).
 * Does NOT add gap windows — those are applied at search time only.
 * Run: node scripts/normalize-pools-json.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeExplicitBlocks } from "../dist/services/scheduleWindows.js";

const POOLS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src/data/pools/pools.json"
);

const pools = JSON.parse(fs.readFileSync(POOLS_PATH, "utf-8"));

for (const pool of pools) {
  const before = pool.availability.length;
  pool.availability = normalizeExplicitBlocks(pool.availability);
  const after = pool.availability.length;
  if (before !== after) {
    console.log(`${pool.id}: ${before} → ${after} windows`);
  }
}

fs.writeFileSync(POOLS_PATH, JSON.stringify(pools, null, 2) + "\n");
console.log("Updated", POOLS_PATH);
