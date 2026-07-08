import fs from "node:fs";
import type { Pool } from "../types/index.js";
import { filterValidWindows } from "./availabilityGuards.js";
import { poolFilePath } from "./paths.js";

/** Read existing pantry JSON if the file exists; otherwise []. */
export function loadExistingPools(poolsFile: string): Pool[] {
  const filePath = poolFilePath(poolsFile);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as Pool[];
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected a JSON array of pools in ${filePath}`);
  }
  // Keep explicit transcribed rows — normalize happens at app load, not in ingest.
  return parsed;
}

/** Write pretty-printed pool array to disk. */
export function writePoolsJson(filePath: string, pools: Pool[]): void {
  const normalized = pools.map((pool) => ({
    ...pool,
    // Store explicit PDF rows; app normalizes on load for search.
    availability: filterValidWindows(pool.availability),
  }));
  fs.writeFileSync(filePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf-8");
}

/** Sort pools alphabetically by name for stable diffs. */
export function sortPoolsByName(pools: Pool[]): Pool[] {
  return [...pools].sort((a, b) => a.name.localeCompare(b.name));
}
