/**
 * Pantry: pools loaded from pools.json (see ../loadPools.ts).
 * Per-pool .ts files remain as human-readable source until a PDF ingest script writes JSON.
 */
import { loadPoolsFromJson } from "../loadPools.js";

/** All pools the app searches (CLI + web). */
export const pools = loadPoolsFromJson();
