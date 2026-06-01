// Web counter: serves the browser UI and runs the kitchen for /api/search.
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pools } from "./data/pools/index.js";
import { searchPools } from "./services/searchPools.js";
import { resolvePoolLinks } from "./services/poolLinks.js";
import type {
  GeoLocation,
  NoSchedulePoolResult,
  PoolSearchResult,
  SearchQuery,
  SortBy,
} from "./types/index.js";

/** Listen on all interfaces so phones on the same Wi‑Fi can connect (override with HOST). */
const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = Number(process.env.PORT) || 3000;
const MAX_DRIVE_MINUTES = 60;

// Folders next to compiled server.js (dist/server.js → dist/../public)
const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(SERVER_DIR, "..");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const WEB_APP_JS = path.join(SERVER_DIR, "web", "app.js");

/** Schedule link we pass through to the browser (from pool pantry). */
interface ScheduleSourceJson {
  label: string;
  url: string;
  effectiveDate: string;
}

/** Schedule, website, and phone links for pool cards. */
interface PoolLinksJson {
  scheduleUrl?: string;
  websiteUrl?: string;
  contactPhone?: string;
}

/** One pool row we send to the browser (flat JSON, no nested Pool object). */
interface SearchResultJson {
  poolId: string;
  name: string;
  address: string;
  lanesAvailable: number;
  estimatedDriveMinutes: number;
  distanceMiles: number;
  guestPassCostUsd: number;
  scheduleSource?: ScheduleSourceJson;
  scheduleUrl?: string;
  websiteUrl?: string;
  contactPhone?: string;
  /** True when pool is on a military base — browser adds * to the name. */
  military?: boolean;
}

/** Nearby pool with no lap schedule in the app (optional section below open lanes). */
interface NoSchedulePoolJson {
  poolId: string;
  name: string;
  address: string;
  distanceMiles: number;
  estimatedDriveMinutes: number;
  guestPassCostUsd: number;
  scheduleUrl?: string;
  websiteUrl?: string;
  contactPhone?: string;
  hasScheduleData: false;
  military?: boolean;
  statusNote?: string;
}

/** One row in GET /api/pools (full directory for browse screen). */
interface PoolDirectoryEntryJson {
  poolId: string;
  name: string;
  address: string;
  military?: boolean;
  scheduleUrl?: string;
  websiteUrl?: string;
  contactPhone?: string;
}

/** Attach resolved links from pantry + org defaults. */
function applyPoolLinksJson(
  row: PoolLinksJson,
  pool: (typeof pools)[number]
): void {
  const links = resolvePoolLinks(pool);
  if (links.scheduleUrl) row.scheduleUrl = links.scheduleUrl;
  if (links.websiteUrl) row.websiteUrl = links.websiteUrl;
  if (links.contactPhone) row.contactPhone = links.contactPhone;
}

/** V0 placeholder: drive minutes → rough miles (matches browser cards). */
function driveMinutesToMiles(minutes: number): number {
  return Math.round((minutes / 3) * 10) / 10;
}

/** Turn no-schedule kitchen rows into JSON for the optional results section. */
function noScheduleToJson(rows: NoSchedulePoolResult[]): NoSchedulePoolJson[] {
  return rows.map((r) => {
    const row: NoSchedulePoolJson = {
      poolId: r.pool.id,
      name: r.pool.name,
      address: r.pool.address,
      distanceMiles:
        r.distanceMiles ?? driveMinutesToMiles(r.estimatedDriveMinutes),
      estimatedDriveMinutes: r.estimatedDriveMinutes,
      guestPassCostUsd: r.guestPassCostUsd,
      hasScheduleData: false,
    };
    applyPoolLinksJson(row, r.pool);
    if (r.pool.military) row.military = true;
    if (r.statusNote) row.statusNote = r.statusNote;
    return row;
  });
}

/** Turn kitchen open-lane results into simple JSON for the frontend. */
function resultsToJson(results: PoolSearchResult[]): SearchResultJson[] {
  return results.map((r) => {
    const row: SearchResultJson = {
      poolId: r.pool.id,
      name: r.pool.name,
      address: r.pool.address,
      lanesAvailable: r.lanesAvailable,
      estimatedDriveMinutes: r.estimatedDriveMinutes,
      distanceMiles:
        r.distanceMiles ?? driveMinutesToMiles(r.estimatedDriveMinutes),
      guestPassCostUsd: r.guestPassCostUsd,
    };
    // Only send schedule link when we have a published source (most real pools do).
    if (r.pool.scheduleSource) {
      row.scheduleSource = r.pool.scheduleSource;
    }
    if (r.pool.military) {
      row.military = true;
    }
    applyPoolLinksJson(row, r.pool);
    return row;
  });
}

/** Alphabetical list of all pools with schedule / website / phone links. */
function handleApiPools(res: http.ServerResponse): void {
  const entries: PoolDirectoryEntryJson[] = pools
    .map((pool) => {
      const row: PoolDirectoryEntryJson = {
        poolId: pool.id,
        name: pool.name,
        address: pool.address,
      };
      if (pool.military) row.military = true;
      applyPoolLinksJson(row, pool);
      return row;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ pools: entries }));
}

/** Parse sortBy query param; kitchen defaults to distance when missing. */
function parseSortBy(value: string | null): SortBy | undefined {
  if (value === "cost" || value === "distance") return value;
  return undefined;
}

/** Parse max drive minutes from query; cap at product max. */
function parseMaxDriveMinutes(value: string | null): number | undefined {
  if (!value) return undefined;
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) return undefined;
  return Math.min(minutes, MAX_DRIVE_MINUTES);
}

/** Parse radius in miles from query (used with user GPS). */
function parseMaxRadiusMiles(value: string | null): number | undefined {
  if (!value) return undefined;
  const miles = Number(value);
  if (!Number.isFinite(miles) || miles <= 0) return undefined;
  return Math.min(miles, 60);
}

/** Parse lat,lng from query when the browser shared the user's location. */
function parseUserLocation(
  latParam: string | null,
  lngParam: string | null
): GeoLocation | undefined {
  if (!latParam || !lngParam) return undefined;
  const lat = Number(latParam);
  const lng = Number(lngParam);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined;
  return { lat, lng };
}

/** Build SearchQuery from URL search params. */
function parseSearchQuery(url: URL): SearchQuery | null {
  const date = url.searchParams.get("date");
  const time = url.searchParams.get("time");
  if (!date || !time) return null;

  const query: SearchQuery = { date, time };
  const sortBy = parseSortBy(url.searchParams.get("sortBy"));
  const maxDriveMinutes = parseMaxDriveMinutes(
    url.searchParams.get("maxDriveMinutes")
  );
  const maxRadiusMiles = parseMaxRadiusMiles(
    url.searchParams.get("maxRadiusMiles")
  );
  const userLocation = parseUserLocation(
    url.searchParams.get("lat"),
    url.searchParams.get("lng")
  );

  if (sortBy) query.sortBy = sortBy;
  if (maxDriveMinutes !== undefined) query.maxDriveMinutes = maxDriveMinutes;
  if (maxRadiusMiles !== undefined) query.maxRadiusMiles = maxRadiusMiles;
  if (userLocation) query.userLocation = userLocation;
  return query;
}

/** JSON response for GET /api/search. */
function handleApiSearch(
  url: URL,
  res: http.ServerResponse
): void {
  const query = parseSearchQuery(url);
  if (!query) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing date or time query params." }));
    return;
  }

  const { results, noSchedulePools } = searchPools(pools, query);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      query,
      results: resultsToJson(results),
      noSchedulePools: noScheduleToJson(noSchedulePools),
    })
  );
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

/** Safe path under a root folder (blocks .. traversal). */
function safeFilePath(root: string, relativePath: string): string | null {
  const rootResolved = path.resolve(root);
  const full = path.resolve(root, relativePath);
  if (!full.startsWith(rootResolved + path.sep) && full !== rootResolved) {
    return null;
  }
  return full;
}

/** Read a file and send it, or 404. */
function sendFile(
  filePath: string,
  res: http.ServerResponse
): void {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

/** Route each HTTP request to API or static files. */
function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/api/search") {
    handleApiSearch(url, res);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/pools") {
    handleApiPools(res);
    return;
  }

  // Compiled browser TypeScript
  if (req.method === "GET" && url.pathname === "/web/app.js") {
    sendFile(WEB_APP_JS, res);
    return;
  }

  // Static files from public/ (default index.html)
  let relativePath = url.pathname.replace(/^\//, "");
  if (relativePath === "") relativePath = "index.html";

  const publicFile = safeFilePath(PUBLIC_DIR, relativePath);
  if (publicFile) {
    sendFile(publicFile, res);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
}

/** IPv4 LAN addresses (for “open on phone” hints in the terminal). */
function getLanIpv4Addresses(): string[] {
  const nets = os.networkInterfaces();
  const addrs: string[] = [];
  for (const ifaces of Object.values(nets)) {
    for (const net of ifaces ?? []) {
      const isV4 = String(net.family) === "IPv4" || String(net.family) === "4";
      if (isV4 && !net.internal) addrs.push(net.address);
    }
  }
  return addrs;
}

const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log(`\nSD Lap Lane Finder — web UI`);
  console.log(`On this Mac:  http://localhost:${PORT}`);
  const lan = getLanIpv4Addresses();
  if (lan.length > 0) {
    console.log(`On your phone (same Wi‑Fi):`);
    for (const ip of lan) {
      console.log(`  http://${ip}:${PORT}`);
    }
  } else {
    console.log(`On your phone: use your Mac’s Wi‑Fi IP with port ${PORT}`);
  }
  console.log(`\nSee MOBILE.md for tunnel / deploy options.\n`);
});
