/**
 * Region types and loaders — metadata lives in regions.json;
 * any src/data/pools/{id}.json file (except *.draft.json) auto-registers a metro.
 */
export type { Region } from "./loadRegions.js";
export {
  getAllRegions,
  getDefaultRegion,
  getDefaultRegionId,
  getRegionById,
  REGIONS,
} from "./loadRegions.js";
