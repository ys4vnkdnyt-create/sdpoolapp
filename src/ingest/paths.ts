import path from "node:path";
import { fileURLToPath } from "node:url";

/** Project root (repo folder) when running compiled dist/ingest/*.js. */
export function projectRoot(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

/** Folder containing region pantry JSON files. */
export function poolsDir(): string {
  return path.join(projectRoot(), "src/data/pools");
}

/** Full path to a region pantry or draft file. */
export function poolFilePath(filename: string): string {
  return path.join(poolsDir(), filename);
}

/** Draft output path for review before --apply. */
export function draftFilePath(regionId: string): string {
  return path.join(poolsDir(), `${regionId}.draft.json`);
}
