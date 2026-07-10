import fs from "node:fs";
import path from "node:path";
import type { GeoLocation } from "../types/index.js";
import { projectRoot } from "./paths.js";

/** One metro row stored in src/data/regions.json. */
export interface RegionMetaRecord {
  id: string;
  displayName: string;
  center: GeoLocation;
  maxDistanceMiles: number;
}

interface RegionsConfigFile {
  defaultRegionId: string;
  regions: RegionMetaRecord[];
}

/** Path to the editable regions config (src/, not dist/). */
export function regionsConfigPath(): string {
  return path.join(projectRoot(), "src/data/regions.json");
}

/** Read regions.json from the repo (ingest writes here; build copies to dist/). */
export function readRegionsConfigFile(): RegionsConfigFile {
  const filePath = regionsConfigPath();
  if (!fs.existsSync(filePath)) {
    return { defaultRegionId: "san-diego", regions: [] };
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as RegionsConfigFile;
  if (!parsed.defaultRegionId || !Array.isArray(parsed.regions)) {
    throw new Error(`Invalid regions config in ${filePath}`);
  }
  return parsed;
}

/** Insert or update one region in src/data/regions.json (called by ingest). */
export function upsertRegionInConfig(record: RegionMetaRecord): void {
  const filePath = regionsConfigPath();
  const config = readRegionsConfigFile();
  const index = config.regions.findIndex((entry) => entry.id === record.id);

  if (index === -1) {
    config.regions.push(record);
    config.regions.sort((a, b) => a.id.localeCompare(b.id));
  } else {
    config.regions[index] = record;
  }

  fs.writeFileSync(filePath, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
}

/** Ensure an empty pantry file exists before first ingest for a new metro. */
export function ensureEmptyPantryFile(poolsFile: string): void {
  const filePath = path.join(projectRoot(), "src/data/pools", poolsFile);
  if (fs.existsSync(filePath)) return;
  fs.writeFileSync(filePath, "[]\n", "utf-8");
}
