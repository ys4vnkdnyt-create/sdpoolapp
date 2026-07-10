/**
 * One-shot CLI: remove non-public pool noise from all live region pantries.
 * Usage: node dist/ingest/cleanPantries.js
 */
import fs from "node:fs";
import path from "node:path";
import type { Pool } from "../types/index.js";
import { poolsDir } from "./paths.js";
import { shouldRemovePoolFromPantry } from "./poolNoiseFilter.js";
import { sortPoolsByName, writePoolsJson } from "./io.js";

/** List live pantry JSON files (skip *.draft.json working copies). */
function listLivePantryFiles(): string[] {
  return fs
    .readdirSync(poolsDir())
    .filter((name) => name.endsWith(".json") && !name.endsWith(".draft.json"))
    .sort();
}

/** Clean one pantry file; returns before/after counts and removed names. */
function cleanPantryFile(filename: string): {
  before: number;
  after: number;
  removed: string[];
} {
  const filePath = path.join(poolsDir(), filename);
  const pools = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Pool[];
  const kept: Pool[] = [];
  const removed: string[] = [];

  for (const pool of pools) {
    if (shouldRemovePoolFromPantry(pool)) {
      removed.push(pool.name);
    } else {
      kept.push(pool);
    }
  }

  writePoolsJson(filePath, sortPoolsByName(kept));
  return { before: pools.length, after: kept.length, removed };
}

function main(): void {
  console.log("\n=== Clean pantries — public lap options only ===\n");

  for (const filename of listLivePantryFiles()) {
    const regionId = filename.replace(/\.json$/, "");
    const result = cleanPantryFile(filename);
    console.log(
      `${regionId}: ${result.before} → ${result.after} (${result.removed.length} removed)`
    );
    for (const name of result.removed) {
      console.log(`  - ${name}`);
    }
    console.log("");
  }
}

main();
