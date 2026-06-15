import fs from "node:fs";
import type { Pool } from "../types/index.js";
import { loadPoolsFromJson } from "../data/loadPools.js";
import { normalizeExplicitBlocks } from "../services/scheduleWindows.js";
import { poolFilePath } from "./paths.js";

/** Read existing pantry JSON if the file exists; otherwise []. */
export function loadExistingPools(poolsFile: string): Pool[] {
  const filePath = poolFilePath(poolsFile);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return loadPoolsFromJson(filePath);
}

/** Write pretty-printed pool array to disk. */
export function writePoolsJson(filePath: string, pools: Pool[]): void {
  const normalized = pools.map((pool) => ({
    ...pool,
    availability: normalizeExplicitBlocks(pool.availability),
  }));
  fs.writeFileSync(filePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf-8");
}

/** Sort pools alphabetically by name for stable diffs. */
export function sortPoolsByName(pools: Pool[]): Pool[] {
  return [...pools].sort((a, b) => a.name.localeCompare(b.name));
}
