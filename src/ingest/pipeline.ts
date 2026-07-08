import type { Pool } from "../types/index.js";
import {
  discoverPoolsNear,
  isDuplicateOfExisting,
} from "./discover.js";
import { loadExistingPools, sortPoolsByName, writePoolsJson } from "./io.js";
import { draftFilePath, poolFilePath } from "./paths.js";
import {
  applyScheduleAttempt,
  candidateToPool,
  ingestScheduleForPool,
} from "./scheduleIngest.js";
import { uniquePoolId } from "./slug.js";
import type { IngestOptions, IngestReport } from "./types.js";

/** Small delay between schedule fetches so we don't hammer websites. */
function ingestDelayMs(): number {
  const raw = process.env.INGEST_DELAY_MS;
  const n = raw ? Number(raw) : 800;
  return Number.isFinite(n) && n >= 0 ? n : 800;
}

/** True when a pool has a YMCA San Diego PDF schedule URL. */
function isYmcPdfPool(pool: Pool): boolean {
  const url = pool.scheduleSource?.url?.toLowerCase() ?? "";
  return pool.id.includes("ymca") && url.includes("ymcasd.org") && url.endsWith(".pdf");
}

/** True when a pool has a City of San Diego PDF schedule URL. */
function isCityPdfPool(pool: Pool): boolean {
  const url = pool.scheduleSource?.url?.toLowerCase() ?? "";
  return url.includes("sandiego.gov") && url.endsWith(".pdf");
}

/** True when a pool has a PDF schedule worth auto-refreshing (YMCA or City of SD). */
function isRefreshPdfPool(pool: Pool): boolean {
  return isYmcPdfPool(pool) || isCityPdfPool(pool);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Run discovery + optional schedule ingest; write draft or apply to pantry file. */
export async function runIngestPipeline(
  options: IngestOptions
): Promise<IngestReport> {
  const report: IngestReport = {
    regionId: options.regionId,
    displayName: options.displayName,
    discovered: 0,
    merged: 0,
    transcribed: 0,
    pdfOnly: 0,
    noSchedule: 0,
    skippedExisting: 0,
    lines: [],
  };

  const existing = loadExistingPools(options.poolsFile);
  const usedIds = new Set(existing.map((p) => p.id));
  const merged: Pool[] = [...existing];

  report.lines.push(
    `Region: ${options.displayName} (${options.regionId})`,
    `Center: ${options.center.lat}, ${options.center.lng} — radius ${options.radiusMiles} mi`,
    `Existing pools in ${options.poolsFile}: ${existing.length}`
  );

  const discoverRadiusMiles = Math.min(options.radiusMiles, 40);
  if (discoverRadiusMiles < options.radiusMiles) {
    report.lines.push(
      `Discovery radius capped at ${discoverRadiusMiles} mi (Overpass API limit; app GPS region radius stays ${options.radiusMiles} mi)`
    );
  }

  if (options.retryNoSchedule) {
    report.lines.push("Mode: retry schedule for pools with availability: []");
    let attempted = 0;
    let skipped = 0;
    for (const pool of merged) {
      if (pool.availability.length > 0) continue;
      if (!pool.websiteUrl && !pool.scheduleSource?.url) continue;
      if (options.skip > 0 && skipped < options.skip) {
        skipped += 1;
        continue;
      }
      if (options.limit > 0 && attempted >= options.limit) break;
      attempted += 1;

      if (!pool.websiteUrl && pool.scheduleSource?.url) {
        pool.websiteUrl = pool.scheduleSource.url;
      }

      report.lines.push(`Retry: ${pool.name}`);
      const result = await ingestScheduleForPool(pool, options.skipTranscribe);
      applyScheduleAttempt(pool, result, { preserveSourceOnMiss: true });
      tallyScheduleResult(report, pool.name, result);
      await sleep(ingestDelayMs());
    }
  } else if (options.ymcaPdf) {
    report.lines.push("Mode: re-transcribe YMCA PDF schedules (vision)");
    let attempted = 0;
    let skipped = 0;
    for (const pool of merged) {
      if (!isYmcPdfPool(pool)) continue;
      if (options.skip > 0 && skipped < options.skip) {
        skipped += 1;
        continue;
      }
      if (options.limit > 0 && attempted >= options.limit) break;
      attempted += 1;

      report.lines.push(`YMCA PDF: ${pool.name} (${pool.id})`);
      const result = await ingestScheduleForPool(pool, options.skipTranscribe);
      applyScheduleAttempt(pool, result, { preserveSourceOnMiss: true });
      tallyScheduleResult(report, pool.name, result);
      await sleep(ingestDelayMs());
    }
    report.lines.push(`YMCA PDF pools processed: ${attempted}`);
  } else if (options.cityPdf) {
    report.lines.push("Mode: re-transcribe City of SD PDF schedules (vision)");
    let attempted = 0;
    let skipped = 0;
    for (const pool of merged) {
      if (!isCityPdfPool(pool)) continue;
      if (options.skip > 0 && skipped < options.skip) {
        skipped += 1;
        continue;
      }
      if (options.limit > 0 && attempted >= options.limit) break;
      attempted += 1;

      report.lines.push(`City PDF: ${pool.name} (${pool.id})`);
      const result = await ingestScheduleForPool(pool, options.skipTranscribe);
      applyScheduleAttempt(pool, result, { preserveSourceOnMiss: true });
      tallyScheduleResult(report, pool.name, result);
      await sleep(ingestDelayMs());
    }
    report.lines.push(`City PDF pools processed: ${attempted}`);
  } else if (options.refreshPdfs) {
    report.lines.push("Mode: refresh YMCA + City of SD PDF schedules (vision)");
    let attempted = 0;
    let skipped = 0;
    for (const pool of merged) {
      if (!isRefreshPdfPool(pool)) continue;
      if (options.skip > 0 && skipped < options.skip) {
        skipped += 1;
        continue;
      }
      if (options.limit > 0 && attempted >= options.limit) break;
      attempted += 1;

      report.lines.push(`PDF refresh: ${pool.name} (${pool.id})`);
      const result = await ingestScheduleForPool(pool, options.skipTranscribe);
      applyScheduleAttempt(pool, result, { preserveSourceOnMiss: true });
      tallyScheduleResult(report, pool.name, result);
      await sleep(ingestDelayMs());
    }
    report.lines.push(`PDF refresh pools processed: ${attempted}`);
  } else if (options.poolId) {
    const pool = merged.find((p) => p.id === options.poolId);
    if (!pool) {
      report.lines.push(`Pool not found in ${options.poolsFile}: ${options.poolId}`);
    } else {
      report.lines.push(`Mode: single pool — ${pool.name} (${pool.id})`);
      if (!pool.websiteUrl && pool.scheduleSource?.url) {
        pool.websiteUrl = pool.scheduleSource.url;
      }
      const result = await ingestScheduleForPool(pool, options.skipTranscribe);
      applyScheduleAttempt(pool, result, { preserveSourceOnMiss: true });
      tallyScheduleResult(report, pool.name, result);
    }
  } else {
    report.lines.push("Discovering pools via OpenStreetMap…");
    const candidates = await discoverPoolsNear(
      options.center,
      discoverRadiusMiles
    );
    report.discovered = candidates.length;
    report.lines.push(`OSM candidates in radius: ${candidates.length}`);

    let processed = 0;
    for (const candidate of candidates) {
      if (isDuplicateOfExisting(candidate, merged)) {
        report.skippedExisting += 1;
        continue;
      }
      if (options.limit > 0 && processed >= options.limit) break;

      const poolId = uniquePoolId(candidate.name, usedIds);
      const pool = candidateToPool(candidate, poolId);
      report.lines.push(
        `New: ${pool.name} (${candidate.distanceMiles} mi) — ${pool.websiteUrl ?? "no website"}`
      );

      const result = await ingestScheduleForPool(pool, options.skipTranscribe);
      applyScheduleAttempt(pool, result, { preserveSourceOnMiss: true });
      tallyScheduleResult(report, pool.name, result);

      merged.push(pool);
      processed += 1;
      report.merged += 1;
      await sleep(ingestDelayMs());
    }
  }

  const finalPools = sortPoolsByName(merged);

  if (options.dryRun) {
    report.lines.push("Dry run — no files written.");
    return report;
  }

  const outPath = options.apply
    ? poolFilePath(options.poolsFile)
    : draftFilePath(options.regionId);

  if (options.writeDraft || options.apply) {
    writePoolsJson(outPath, finalPools);
    report.outputPath = outPath;
    report.lines.push(`Wrote ${finalPools.length} pools → ${outPath}`);
    if (!options.apply) {
      report.lines.push(
        "Review the draft, then re-run with --apply to replace the live pantry file."
      );
    }
  }

  report.lines.push(
    `Summary: +${report.merged} new, ${report.transcribed} transcribed, ${report.pdfOnly} PDF/source only, ${report.noSchedule} no schedule, ${report.skippedExisting} skipped duplicates`
  );

  return report;
}

/** Update report counters from one schedule attempt. */
function tallyScheduleResult(
  report: IngestReport,
  poolName: string,
  result: import("./types.js").ScheduleAttemptResult
): void {
  const detail = result.detail ? ` — ${result.detail}` : "";
  switch (result.status) {
    case "transcribed":
      report.transcribed += 1;
      report.lines.push(`  ✓ Schedule transcribed: ${poolName}${detail}`);
      break;
    case "pdf_only":
      report.pdfOnly += 1;
      report.lines.push(`  ○ Source found (no lanes yet): ${poolName}${detail}`);
      break;
    case "no_source":
    case "fetch_failed":
    case "skipped":
      report.noSchedule += 1;
      report.lines.push(`  — No schedule yet: ${poolName}${detail}`);
      break;
  }
}

/** Print the ingest report to the terminal. */
export function printIngestReport(report: IngestReport): void {
  console.log("\n=== Lap Lane Finder — region ingest ===\n");
  for (const line of report.lines) {
    console.log(line);
  }
  console.log("");
}
