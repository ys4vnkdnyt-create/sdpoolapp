import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool } from "../types/index.js";
import { loadPoolsFromJson } from "./loadPools.js";
import {
  getDefaultRegion,
  getRegionById,
  type Region,
  REGIONS,
} from "./regions.js";

/** Folder containing compiled data files (dist/data/). */
const DATA_DIR = path.dirname(fileURLToPath(import.meta.url));

const POOLS_DIR = path.join(DATA_DIR, "pools");

/** Pools loaded per region id at server startup. */
const poolsByRegion = new Map<string, Pool[]>();

/** Load every region's pantry file once. */
function loadAllRegionPools(): void {
  for (const region of REGIONS) {
    const filePath = path.join(POOLS_DIR, region.poolsFile);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing pool file for region "${region.id}": ${filePath}`);
    }
    poolsByRegion.set(region.id, loadPoolsFromJson(filePath));
  }
}

loadAllRegionPools();

/** Pools for one region; empty array when the id is unknown. */
export function getPoolsForRegion(regionId: string): Pool[] {
  return poolsByRegion.get(regionId) ?? [];
}

/** All pools in the default region (CLI and legacy imports). */
export const pools = getPoolsForRegion(getDefaultRegion().id);

/** Region metadata plus pool count (for /config/app.js). */
export function listRegionsPublic(): Array<{
  id: string;
  displayName: string;
  center: Region["center"];
  maxDistanceMiles: number;
  poolCount: number;
}> {
  return REGIONS.map((region) => ({
    id: region.id,
    displayName: region.displayName,
    center: region.center,
    maxDistanceMiles: region.maxDistanceMiles,
    poolCount: getPoolsForRegion(region.id).length,
  }));
}

/** Resolve region id string to config, or undefined. */
export { getRegionById, getDefaultRegion, REGIONS };
