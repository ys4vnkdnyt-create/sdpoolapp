// Web counter: serves the browser UI and runs the kitchen for /api/search.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { samplePools } from "./data/samplePools.js";
import { searchPools } from "./services/searchPools.js";
import type { PoolSearchResult, SearchQuery, SortBy } from "./types/index.js";

const PORT = 3000;
const MAX_DRIVE_MINUTES = 60;

// Folders next to compiled server.js (dist/server.js → dist/../public)
const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(SERVER_DIR, "..");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const WEB_APP_JS = path.join(SERVER_DIR, "web", "app.js");

/** One pool row we send to the browser (flat JSON, no nested Pool object). */
interface SearchResultJson {
  poolId: string;
  name: string;
  address: string;
  lanesAvailable: number;
  estimatedDriveMinutes: number;
  guestPassCostUsd: number;
}

/** Turn kitchen results into simple JSON for the frontend. */
function resultsToJson(results: PoolSearchResult[]): SearchResultJson[] {
  return results.map((r) => ({
    poolId: r.pool.id,
    name: r.pool.name,
    address: r.pool.address,
    lanesAvailable: r.lanesAvailable,
    estimatedDriveMinutes: r.estimatedDriveMinutes,
    guestPassCostUsd: r.guestPassCostUsd,
  }));
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
  if (sortBy) query.sortBy = sortBy;
  if (maxDriveMinutes !== undefined) query.maxDriveMinutes = maxDriveMinutes;
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

  const results = searchPools(samplePools, query);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      query,
      results: resultsToJson(results),
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

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`\nSD Lap Lane Finder — web UI`);
  console.log(`Open http://localhost:${PORT} in your browser\n`);
});
