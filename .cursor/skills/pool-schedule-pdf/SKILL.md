---
name: pool-schedule-pdf
description: >-
  Transcribe lap swim schedules from PDFs or official pool pages into
  availability[] for Lap Lane Finder, and run the project's ingest/PDF refresh
  commands. Use when the user mentions pool PDFs, schedule transcription,
  ingest refresh, YMCA/City of SD PDFs, draft.json, or real-time schedule updates.
---

# Pool schedule PDF skill

Use this skill for **real lap schedule data** in Lap Lane Finder. Never invent weekly grids.

## Goals

1. Read a published PDF or aquatics page.
2. Write accurate `availability[]` (+ `scheduleSource`) for that pool.
3. Or run the existing ingest pipeline so vision/transcribe can refresh schedules.

## Real-data rules (non-negotiable)

- **Real sources only** — published PDF or official page. Empty `availability: []` if none.
- **Reference shape** — Ryan Family YMCA–style windows (`dayOfWeek`, `startTime`, `endTime`, `lanesAvailable`).
- **Each weekday separate** — never copy Monday’s grid onto Tuesday.
- **One printed row = one window** — e.g. Thu 5:30–10:15 with 6 lanes stays one row (not three fragments).
- **Lane count missing** — use at least `1` if the PDF clearly shows lap swim but omits lane count; note uncertainty in guestPass notes if needed.
- **Confirm before writing app code** — pantry JSON / draft updates are OK when the user asked to transcribe or refresh; do not invent new TypeScript without asking.

## Gap / normalize behavior (already in the app)

Do **not** hand-split gaps into fake rows unless the PDF prints them.

- Load: `normalizeExplicitBlocks()` merges overlapping/back-to-back rows on the **same day**, keeps the **higher** lane count.
- Search: `prepareAvailabilityForSearch()` fills blank time **between** printed blocks with the **higher** neighbor lane count (min 1).

Transcribe what the PDF prints; let the app handle gaps.

## Manual transcription workflow

1. Open the PDF/page (download under `data/sources/` if useful).
2. For each weekday with lap swim, record windows in 24h `"HH:MM"`.
3. `dayOfWeek`: 0=Sun … 6=Sat.
4. Set `scheduleSource`: `{ label, url, effectiveDate }` (ISO date when known).
5. Prefer writing to `src/data/pools/<region>.draft.json` first; promote to `<region>.json` only after review (or use ingest `--apply` when the user asks).
6. Run `npm run build` and spot-check one date/time with CLI or web search.

### Window example

```json
{
  "dayOfWeek": 4,
  "startTime": "05:30",
  "endTime": "10:15",
  "lanesAvailable": 6
}
```

## Ingest / near-real-time refresh (automated)

Requires `OPENAI_API_KEY` in project `.env` (never commit or paste the key).

```bash
cd "/Users/benstern/Prototype Exercise"

# One pool (review draft)
npm run ingest -- --region san-diego --pool-id ryan-family-ymca

# YMCA SD PDFs only
npm run ingest -- --region san-diego --ymca-pdf --limit 5

# City of San Diego PDFs only
npm run ingest -- --region san-diego --city-pdf --limit 5

# All YMCA + City SD PDFs → draft
npm run ingest:refresh
# same as:
npm run ingest -- --region san-diego --refresh-pdfs

# Find schedule URLs only (no OpenAI)
npm run ingest -- --region san-diego --retry-no-schedule --skip-transcribe --limit 10

# Promote draft → live (only after review)
npm run ingest -- --region san-diego --apply
# or: cp src/data/pools/san-diego.draft.json src/data/pools/san-diego.json
```

### New region skeleton (pools, not schedules)

```bash
npm run ingest -- --region austin --center 30.2672,-97.7431 --display-name Austin --limit 25 --skip-transcribe --apply
npm run ingest:clean   # strip non-public noise
```

Metros register via `src/data/regions.json` + `src/data/pools/<id>.json` (auto-discovery).

## Quality checklist before apply

- [ ] Each day checked against the PDF (not copy-pasted across days)
- [ ] Printed rows kept as whole windows
- [ ] `scheduleSource.url` points at the live PDF/page
- [ ] No fake placeholder grids
- [ ] Build passes; one search smoke-test for a known open time

## What this skill is not

- Not a generic PDF tool outside this project’s pantry format.
- Not permission to fake schedules for skeleton metros (Phoenix, Austin, etc.) just to fill lists.
- Not a substitute for user confirmation when changing TypeScript search/ingest code.
