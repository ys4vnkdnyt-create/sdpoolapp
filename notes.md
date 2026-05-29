# Project cheat sheet

## The restaurant analogy


| Folder / file   | Role                                                            |
| --------------- | --------------------------------------------------------------- |
| `src/types/`    | Menu definitions — what a pool, search, and result must include |
| `src/data/`     | Pantry — pool schedules (fake sample data for now)              |
| `src/services/` | Kitchen — picks pools that match your date/time                 |
| `src/index.ts`  | Terminal counter — CLI; prints answers in the terminal        |
| `src/server.ts` | Web counter — serves the browser page and `/api/search`         |
| `src/web/app.ts`| Browser logic — date/time UI, calls the API, draws results      |
| `public/`       | What you see — `index.html`, `styles.css`, `hero-swimmer.png`   |


## When you run the app

**Terminal (CLI):**

1. `npm run dev` (optional: `-- date time`)
2. TypeScript in `src/` compiles to JavaScript in `dist/`
3. Node runs `dist/index.js`
4. Load pools → search → print results

**Browser (web UI):**

1. `npm run web`
2. Open **http://localhost:3000** in Chrome/Safari (edit files in Cursor; view the app in the browser)
3. Node runs `dist/server.js` — serves `public/` and answers `/api/search`
4. Click **Find Open Lanes** → browser requests API → same kitchen → results on screen 2

## Config files (not the app logic)

- `**package.json**` — project name + npm shortcuts (`build`, `start`, `dev`)
- `**tsconfig.json**` — TypeScript rules; `src/` → `dist/`
- `**.gitignore**` — don’t commit `node_modules/` or `dist/`
- `**README.md**` — how to install and run (for you)

## Main code files (read in this order)

1. `src/types/index.ts` — data shapes
2. `src/data/samplePools.ts` — 4 fake SD pools
3. `src/services/searchPools.ts` — matching + sort
4. `src/index.ts` — CLI entry, calls search

## Request funnel (one query)

1. Terminal: `npm run dev -- date time`
2. **Counter** (`index.ts`): `parseArgs` → `SearchQuery` → call `searchPools(samplePools, query)`
3. **Kitchen** (`searchPools.ts`): for each pool — match day + time window → else skip → drive filter → add to results → sort
4. **Counter**: `printResults` → text in terminal

Example: Mon `2026-05-18` `06:30` → La Jolla + Mission Valley + Coronado; UCSD skipped (no Monday in sample data).

## Quick glossary


| Term                          | Meaning                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| TypeScript                    | JavaScript with type checklists                                    |
| Build / compile               | Turn `.ts` files into `.js` in `dist/`                             |
| `src/`                        | Source code you edit                                               |
| `dist/`                       | Compiled output Node runs (regenerate with `npm run build`)        |
| Node                          | Runs JavaScript on your computer                                   |
| npm                           | Installs packages; runs scripts from `package.json`                |
| `npm install`                 | Download `devDependencies` into `node_modules/`                    |
| `devDependencies`             | Build tools (here: TypeScript), not the swim logic itself          |
| `node_modules/`               | Installed packages; don’t edit; don’t commit                       |
| `npm run dev`                 | Build (`tsc`) then run (`node dist/index.js`)                      |
| Interface                     | Checklist for what fields an object must have                      |
| `export` / `export interface` | Let other files import that type or value                          |
| `import type`                 | Import types only (erased when compiled)                           |
| `string`                      | Text in quotes, e.g. `"06:30"`                                     |
| `string[]`                    | List of strings (e.g. command-line args)                           |
| `const`                       | Named value you don’t reassign                                     |
| `??` (nullish coalescing)     | If the left side is only `null` or `undefined`, use the right side. Example in kitchen: drive lookup, else `30`. Does not fall back on `0` or `""`. |
| OR operator (two pipes)       | Logical OR, or “use fallback when left is falsy” (`null`, `undefined`, `0`, `""`, `false`). This repo uses `??` for defaults when only “missing” should count. Written in code as two pipe characters side by side. |
| CLI                           | App you run in the terminal (text in, text out)                    |
| Arguments (args)              | Extra words after the command that tell your app what to do. Example: `npm run dev -- 2026-05-18 06:30 cost` → args are `2026-05-18`, `06:30`, `cost`. Everything after `--` goes to your app, not npm. |
| `argv`                        | Short for “argument vector” — the list of strings Node hands your program. Same idea as args; `process.argv` is that list in code. Index 2+ are usually *your* args (date, time, sort). |
| `process.argv`                | In Node: the actual `argv` array for this run (`[node path, script path, …your args]`). |
| Parse                         | Read messy text input and turn it into structured fields the code can use (e.g. date, time, sort). Not a special keyword — we name helpers `parseSomething`. |
| `parseArgs`                   | Counter: parse `argv` into a `SearchQuery` (`date`, `time`, optional `sortBy`, optional `maxDriveMinutes`); returns `null` if date/time missing |
| `parseSortBy`                 | Counter: parse optional 4th CLI word into `distance` or `cost` (or ignore invalid) |
| `SearchQuery`                 | What you want: `date`, `time`, optional `sortBy`, `maxDriveMinutes` |
| `samplePools`                 | Pantry: array of fake pools + schedules                            |
| `searchPools()`               | Kitchen: filter + sort; returns `PoolSearchResult[]`               |
| `Record`                      | TypeScript type for a lookup table: each **key** (string) maps to one **value** (here, a number). Example: pool id → drive minutes. Not a list — you fetch by name with brackets. |
| Bracket lookup                | Read one entry from a table: `table[key]`. Example: `ESTIMATED_DRIVE_MINUTES[pool.id]` → minutes for that pool, or `undefined` if the id is missing. |
| `continue`                    | Skip rest of loop for this pool; move to next pool                 |
| `.find()`                     | First schedule window that matches day + time                      |
| Funnel                        | Each pool in or out: match window → drive filter → results → print |
| **API**                       | **A**pplication **P**rogramming **I**nterface — an agreed way for two programs to ask each other for data. In this repo: the browser orders from `server.ts`; the server runs `searchPools()` and sends back a list. You don’t put kitchen logic in the browser. |
| Request                       | The ask — e.g. browser: “lanes for 2026-05-18 at 09:00?” Implemented as a URL: `GET /api/search?date=…&time=…` |
| Response                      | The answer the server sends back — here, JSON text with `query` and `results`. |
| Endpoint                      | One “menu item” on the server — ours is **`/api/search`** (lane search only). |
| `GET`                         | HTTP verb meaning “read data only” (no form body). Our search uses GET because date/time sit in the URL. |
| JSON                          | Text shaped like `{ "name": "La Jolla YMCA", "lanesAvailable": 4 }` — easy for TypeScript/JavaScript to parse. |
| `localhost`                   | “This computer.” **`localhost:3000`** = web app running on your machine while you develop (not on the public internet). |
| `fetch()`                     | Browser built-in: send a request to a URL and get the response (used in `src/web/app.ts` for `/api/search`). |
| `npm run web`                 | Build TypeScript, then start `dist/server.js` — open http://localhost:3000 to use the UI sample. |

### API in this project (restaurant again)

| Piece | File | Role |
| ----- | ---- | ---- |
| Customer | Browser + `src/web/app.ts` | Clicks Find Open Lanes |
| Counter | `src/server.ts` | Receives `/api/search`, calls kitchen |
| Kitchen | `src/services/searchPools.ts` | Same funnel as CLI |
| Menu line | `GET /api/search?date=&time=&sortBy=&maxDriveMinutes=` | The only API endpoint in V0 |

**Why use an API?** Same kitchen can serve CLI, web, and later a phone app — only the “how you order” changes (terminal args vs URL).

## Weekdays in code (`dayOfWeek`)

0 = Sunday · 1 = Monday · 2 = Tuesday · 3 = Wednesday · 4 = Thursday · 5 = Friday · 6 = Saturday

## System diagrams

How the pieces fit together. View in Cursor/GitHub preview, or paste the `mermaid` blocks into [mermaid.live](https://mermaid.live).

### V0 today (what’s in the repo)

```mermaid
flowchart TB
  subgraph user["You"]
    CLI["Terminal command\nnpm run dev -- date time"]
  end

  subgraph counter["src/index.ts — Counter"]
    parse["parseArgs\n→ SearchQuery"]
    print["printResults\n→ terminal text"]
  end

  subgraph kitchen["src/services/searchPools.ts — Kitchen"]
    search["searchPools()\nmatch day + time\nfilter drive time\nsort results"]
    helpers["timeToMinutes\ngetDayOfWeek\nisTimeInWindow\nestimateDriveMinutes"]
  end

  subgraph pantry["src/data/samplePools.ts — Pantry"]
    pools["samplePools[]\n4 fake SD pools + schedules"]
  end

  subgraph menu["src/types/index.ts — Menu"]
    types["Pool, SearchQuery\nPoolSearchResult, …"]
  end

  subgraph build["Build & run"]
    tsc["tsc compile\nsrc → dist"]
    node["node dist/index.js"]
  end

  CLI --> parse
  parse --> search
  pools --> search
  search --> print
  print --> CLI

  types -.-> pantry
  types -.-> kitchen
  types -.-> counter

  CLI --> tsc --> node
  node --> parse
```



**One request:** You type date/time → counter builds a question → kitchen checks each pool in the pantry → counter prints what survived the funnel.

**Code path to follow:** `index.ts` (bottom) → `searchPools.ts` → `samplePools.ts` → back to `printResults`.

### Later (product vision — not built yet)

```mermaid
flowchart LR
  subgraph future_ui["Later: apps/web"]
    UI["Browser UI\npick date/time"]
  end

  subgraph core["Same core — keep this"]
    kitchen2["searchPools()"]
    pantry2["data/\nreal schedules"]
  end

  subgraph sources["Later: data sources"]
    PDF["PDFs"]
    WEB["Web / Google Docs"]
    API["APIs if any"]
  end

  subgraph external["Later: external services"]
    maps["Maps / traffic\nreal drive times"]
  end

  UI --> kitchen2
  pantry2 --> kitchen2
  PDF --> pantry2
  WEB --> pantry2
  API --> pantry2
  maps --> kitchen2
```



**Idea:** UI and data collection change; `searchPools` + types stay the center.

---

## Session learnings (saved)

**Organization:** menu (`types/`) → pantry (`data/`) → kitchen (`services/`) → counter (`index.ts`).

**Flow:** Input date/time → `searchPools` funnel (match window → drive filter → sort) → printed summary (not a raw data dump).

**Concepts touched:** `export interface`, `string` / `string[]`, `const`, `parseArgs` / `process.argv`, `npm install` / `node_modules` / `devDependencies`, compile `src` → `dist`.

**Still building depth on:** line-by-line kitchen logic — revisit when we change that code.

**Thursday lunch trace (2026-05-21 12:15):** Only Coronado — its pantry window is Thursday `12:00`–`13:30`. UCSD has Thursday AM only (`06:00`–`08:00`), so 12:15 is out. Contrast: Monday `2026-05-18` `12:15` → La Jolla only (Monday lunch `12:00`–`13:00`).

**Product stance:** incremental slices + small ships (CLI → web → one real pool); tiny feature next.

**Repo state:** All `src/` files have learning comments; `npm install` has been run at least once in this project.

---

## Resume here (next session)

### Welcome back (quick refresh)

**One sentence:** You type a date and time; the app lists San Diego pools that have a **lap lane open then**, with fake drive time and guest pass price.

**North star:** Lane open at your date/time is **#1**. Distance, cost, and sort only help you pick among pools that already match.

**How the code is organized (restaurant):** `index.ts` = counter · `searchPools.ts` = kitchen · `samplePools.ts` = pantry · `types/` = menu.

**What’s built (V0):** 4 fake pools · sort nearest or cheapest (`distance` / `cost`) · max drive filter (default 60 min, hard cap 1 hour). All saved in git.

**Run these first:**

```bash
cd "/Users/benstern/Prototype Exercise"
npm run dev -- 2026-05-18 06:30
npm run dev -- 2026-05-18 06:30 cost
npm run dev -- 2026-05-18 06:30 distance 20
```

**Pick one next step:** one **real** pool schedule in the pantry · or start a simple web UI (same kitchen underneath). *(Thursday lunch trace done — see **Session learnings**.)*

**Latest save:** `e4b6524` — lane opening documented as north star (`git log -1` to confirm).

**Paste into a new Agent chat:**

> I’m back on the SD lap lane project. Read `notes.md` **Welcome back** and **Resume here**, plus `AGENTS.md` and `VISION.md`. Lane open at date/time is the priority. Continue with the next tiny slice in notes.

---

**Use a new Agent chat** (not this thread). Open folder `Prototype Exercise`; Cursor reads `AGENTS.md` automatically.

**Read first:** This file (funnel + glossary + diagrams above), `AGENTS.md`, `VISION.md`.

**Done (project so far):**

- Walked all of `src/` (types → data → services → index); inline learning comments throughout
- `npm install` + run & trace; funnel mental model + system diagrams in this file
- 4th fake pool (Coronado) in `samplePools.ts` — shows on Monday AM test query
- Sort: CLI 4th arg `distance` \| `cost` (`parseSortBy`, `parseArgs`); `SearchQuery.sortBy`; kitchen sort branches
- Glossary expanded: parse, args, `argv`, `??`, OR (`||`), `Record`, bracket lookup
- Max drive from CLI: `npm run dev -- date time [distance|cost] [maxDriveMinutes]` (or `date time 20` for max drive only); kitchen filters; demo default **60 min**; values over 60 capped at 1 hour

**Product priority:** Lane open at requested date/time is #1; distance/cost/sort are only for comparing pools that already match.

**Next (tiny slice):**

1. **Web UI slice 1** — done: `npm run web` → http://localhost:3000
2. **Real pantry** — `src/data/pools/` (Ryan YMCA from PDF + Plunge from web); fake data in `samplePools.ts` for tests only
3. **Next:** Mission Valley / other branches (need that branch’s PDF); screen 3; show `scheduleSource` in UI

**Future (in `VISION.md`):** pool amenities · workouts/notes section · possible MySwimPro-style integration

**Done this session:** Thursday lunch trace (`npm run dev -- 2026-05-21 12:15`); Monday lunch contrast (`2026-05-18 12:15`).

**How to work with the agent:** Short steps · explain any new code · gray comments in files · wait for **got it** before the next chunk.

**Run commands (sanity check):**

```bash
cd "/Users/benstern/Prototype Exercise"
npm run dev -- 2026-05-18 06:30
npm run dev -- 2026-05-18 06:30 distance 20   # drops pools over 20 min (MV 22, Coronado 28)
```

**Paste into the new chat:**

> Resume the SD lap lane project. Read `notes.md` from **Resume here** and **Session learnings**. Coronado, CLI sort, and CLI max drive are done. Continue with the next tiny slice in notes.

