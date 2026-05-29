# SD Lap Lane Finder (prototype)

TypeScript prototype for finding San Diego lap lane availability. See [VISION.md](./VISION.md) for product goals.

## Project layout (built for growth)

```text
src/
  types/       Shared models (Pool, SearchQuery, …)
  data/        Pool schedules (sample now; real sources later)
  services/    Business logic (search, sort) — no UI here
  index.ts     CLI demo (V0)
  server.ts    Web server (browser UI + /api/search)
  web/app.ts   Browser UI logic (screens 1–2)
public/        HTML, CSS, hero image (served by server)
```

**Later (without restructuring core logic):**

- `apps/web/` — browser UI (Vite + React + TypeScript) that imports from `src/services`
- `src/data/sources/` — PDF / URL / scraper adapters per pool

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS). Includes `npm`.

Check:

```bash
node -v
npm -v
```

## Setup

```bash
cd "/Users/benstern/Prototype Exercise"
npm install
npm run build
npm run start
```

Demo with a specific date/time (Monday 2026-05-18 06:30 matches sample YMCA windows):

```bash
npm run dev -- 2026-05-18 06:30
```

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run start` | Run compiled CLI |
| `npm run dev` | Build + run CLI (optional date/time args) |
| `npm run web` | Build + start browser UI at http://localhost:3000 |
| `npm run typecheck` | Type-check without emitting files |

### Web UI

```bash
npm run web
```

Open http://localhost:3000 — pick date/time, tap **Find Open Lanes**. Same `searchPools()` kitchen as the CLI.

## Learning path

1. Read `src/types/index.ts` — data shapes the whole app uses
2. Read `src/data/samplePools.ts` — fake schedules
3. Read `src/services/searchPools.ts` — matching + sort logic
4. Read `src/index.ts` — thin CLI that calls the service
