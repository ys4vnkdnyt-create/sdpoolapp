// Load metro regions from regions.json + any pool pantry files on disk.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { GeoLocation } from "../types/index.js";
import type { Pool } from "../types/index.js";
import { loadPoolsFromJson } from "./loadPools.js";

/** One metro area the app can serve (pools live in a separate JSON file). */
export interface Region {
  id: string;
  displayName: string;
  /** Fallback map center when GPS is unavailable (also used for region matching). */
  center: GeoLocation;
  /** User must be within this many miles of center to count as "in" the region. */
  maxDistanceMiles: number;
  /** Pool pantry filename under dist/data/pools/ (and src/data/pools/). */
  poolsFile: string;
}

/** Shape of src/data/regions.json (no poolsFile — derived from id). */
interface RegionMetaJson {
  id: string;
  displayName: string;
  center: GeoLocation;
  maxDistanceMiles: number;
}

interface RegionsConfigJson {
  defaultRegionId: string;
  regions: RegionMetaJson[];
}

/** Folder containing compiled data files (dist/data/). */
const DATA_DIR = path.dirname(fileURLToPath(import.meta.url));

const REGIONS_CONFIG_PATH = path.join(DATA_DIR, "regions.json");
const POOLS_DIR = path.join(DATA_DIR, "pools");

/** Default GPS radius when a pantry file has no regions.json entry yet. */
const DEFAULT_MAX_DISTANCE_MILES = 50;

/** Read and validate regions.json; throws when missing or malformed. */
function readRegionsConfig(): RegionsConfigJson {
  if (!fs.existsSync(REGIONS_CONFIG_PATH)) {
    throw new Error(`Missing regions config: ${REGIONS_CONFIG_PATH}`);
  }
  const parsed = JSON.parse(fs.readFileSync(REGIONS_CONFIG_PATH, "utf-8")) as RegionsConfigJson;
  if (!parsed.defaultRegionId || !Array.isArray(parsed.regions)) {
    throw new Error(`Invalid regions config in ${REGIONS_CONFIG_PATH}`);
  }
  return parsed;
}

/** Turn "san-diego" into "San Diego" for auto-registered metros. */
function humanizeRegionId(id: string): string {
  return id
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Average lat/lng of pools that have coordinates (fallback center for new regions). */
function centroidFromPools(pools: Pool[]): GeoLocation | null {
  const located = pools.filter(
    (pool) =>
      pool.location &&
      Number.isFinite(pool.location.lat) &&
      Number.isFinite(pool.location.lng)
  );
  if (located.length === 0) return null;

  const lat =
    located.reduce((sum, pool) => sum + pool.location.lat, 0) / located.length;
  const lng =
    located.reduce((sum, pool) => sum + pool.location.lng, 0) / located.length;
  return { lat, lng };
}

/** Legacy combined pantry — not a metro region file. */
const EXCLUDED_PANTRY_FILENAMES = new Set(["pools.json"]);

/** List live pantry JSON files (exclude *.draft.json and legacy names). */
function listPantryFilenames(): string[] {
  if (!fs.existsSync(POOLS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(POOLS_DIR)
    .filter((name) => {
      if (!name.endsWith(".json") || name.endsWith(".draft.json")) return false;
      if (EXCLUDED_PANTRY_FILENAMES.has(name)) return false;
      // Must parse as a pool array (skips stray JSON in dist/data/pools).
      try {
        loadPoolsFromJson(path.join(POOLS_DIR, name));
        return true;
      } catch {
        return false;
      }
    })
    .sort();
}

/** Build the full region list: regions.json metadata merged with pantry files on disk. */
function discoverRegions(): Region[] {
  const config = readRegionsConfig();
  const metaById = new Map(config.regions.map((entry) => [entry.id, entry]));
  const regions: Region[] = [];

  for (const poolsFile of listPantryFilenames()) {
    const id = poolsFile.replace(/\.json$/, "");
    const meta = metaById.get(id);
    const filePath = path.join(POOLS_DIR, poolsFile);

    if (meta) {
      regions.push({
        id: meta.id,
        displayName: meta.displayName,
        center: meta.center,
        maxDistanceMiles: meta.maxDistanceMiles,
        poolsFile,
      });
      continue;
    }

    // Auto-register: pantry exists but no regions.json row yet.
    const pools = loadPoolsFromJson(filePath);
    const center = centroidFromPools(pools);
    if (!center) {
      throw new Error(
        `Pantry ${poolsFile} has no regions.json entry and no pool coordinates — run ingest with --center or add metadata to regions.json`
      );
    }

    regions.push({
      id,
      displayName: humanizeRegionId(id),
      center,
      maxDistanceMiles: DEFAULT_MAX_DISTANCE_MILES,
      poolsFile,
    });
  }

  if (regions.length === 0) {
    throw new Error(`No region pantry files found in ${POOLS_DIR}`);
  }

  return regions;
}

/** Cached at server startup — add a pantry file + rebuild to pick up new metros. */
const ALL_REGIONS: Region[] = discoverRegions();

/** All regions shipped in this deploy (from regions.json + pool files). */
export function getAllRegions(): Region[] {
  return ALL_REGIONS;
}

/** Default region id from regions.json. */
export function getDefaultRegionId(): string {
  const config = readRegionsConfig();
  return config.defaultRegionId;
}

/** Look up a region by id; undefined when the id is unknown. */
export function getRegionById(regionId: string): Region | undefined {
  return ALL_REGIONS.find((region) => region.id === regionId);
}

/** Default region config (San Diego until regions.json changes). */
export function getDefaultRegion(): Region {
  const id = getDefaultRegionId();
  const region = getRegionById(id);
  if (!region) {
    throw new Error(
      `Default region "${id}" is missing — check regions.json and ${id}.json pantry`
    );
  }
  return region;
}

/** Back-compat alias used across the codebase. */
export const REGIONS = ALL_REGIONS;
