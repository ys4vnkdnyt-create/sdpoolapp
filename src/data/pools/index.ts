/**
 * Pantry: pools backed by real published schedules.
 * Fake/sample pools live in ../samplePools.ts for experiments only.
 */
import { alliedGardensPool } from "./allied-gardens-pool.js";
import { budKearnsPool } from "./bud-kearns-pool.js";
import { carmelMountainPool } from "./carmel-mountain-pool.js";
import { carmelValleyPool } from "./carmel-valley-pool.js";
import { clairemontPool } from "./clairemont-pool.js";
import { cityHeightsPool } from "./city-heights-pool.js";
import { colinaDelSolPool } from "./colina-del-sol-pool.js";
import { kearnyMesaPool } from "./kearny-mesa-pool.js";
import { memorialPool } from "./memorial-pool.js";
import { mlkPool } from "./mlk-pool.js";
import { plungeSanDiego } from "./plunge-san-diego.js";
import { ryanFamilyYmc } from "./ryan-family-ymca.js";
import { swansonPool } from "./swanson-pool.js";
import { tierrasantaPool } from "./tierrasanta-pool.js";
import { vistaTerracePool } from "./vista-terrace-pool.js";
import type { Pool } from "../../types/index.js";

/** All pools the app searches (CLI + web). */
export const pools: Pool[] = [
  ryanFamilyYmc,
  plungeSanDiego,
  alliedGardensPool,
  carmelMountainPool,
  budKearnsPool,
  carmelValleyPool,
  cityHeightsPool,
  clairemontPool,
  colinaDelSolPool,
  kearnyMesaPool,
  mlkPool,
  memorialPool,
  swansonPool,
  tierrasantaPool,
  vistaTerracePool,
];
