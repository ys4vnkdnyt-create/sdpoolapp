// Pantry loader: read pool schedules from JSON on disk (CLI + web).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool } from "../types/index.js";

/** Folder containing this file after compile (dist/data/). */
const DATA_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Default pantry file — kept next to per-pool TS sources until ingest script exists. */
const POOLS_JSON_PATH = path.join(DATA_DIR, "pools", "pools.json");

/** Quick shape check so a bad JSON file fails loudly at startup. */
function isPoolRecord(value: unknown): value is Pool {
  if (!value || typeof value !== "object") return false;
  const p = value as Pool;
  if (
    typeof p.id !== "string" ||
    typeof p.name !== "string" ||
    !Array.isArray(p.availability)
  ) {
    return false;
  }
  // military is optional; when present it must be true/false (not a string).
  if (p.military !== undefined && typeof p.military !== "boolean") {
    return false;
  }
  if (p.websiteUrl !== undefined && typeof p.websiteUrl !== "string") {
    return false;
  }
  if (p.contactPhone !== undefined && typeof p.contactPhone !== "string") {
    return false;
  }
  return true;
}

/** Read and parse pools.json; throws if file missing or not a pool array. */
export function loadPoolsFromJson(
  filePath: string = POOLS_JSON_PATH
): Pool[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected a JSON array of pools in ${filePath}`);
  }

  for (const entry of parsed) {
    if (!isPoolRecord(entry)) {
      throw new Error(`Invalid pool entry in ${filePath}`);
    }
  }

  return parsed;
}
