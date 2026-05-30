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
- `**.gitignore**` — don't commit `node_modules/` or `dist/`
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
| `node_modules/`               | Installed packages; don't edit; don't commit                       |
| `npm run dev`                 | Build (`tsc`) then run (`node dist/index.js`)                      |
| Interface                     | Checklist for what fields an object must have                      |
| `export` / `export interface` | Let other files import that type or value                          |
| `import type`                 | Import types only (erased when compiled)                           |
| `string`                      | Text in quotes, e.g. `"06:30"`                                     |
| `string[]`                    | List of strings (e.g. command-line args)                           |
| `const`                       | Named value you don't reassign                                     |
| `??` (nullish coalescing)     | If the left side is only `null` or `undefined`, use the right side. Example in kitchen: drive lookup, else `30`. Does not fall back on `0` or `""`. |
| OR operator (two pipes)       | Logical OR, or "use fallback when left is falsy" (`null`, `undefined`, `0`, `""`, `false`). This repo uses `??` for defaults when only "missing" should count. Written in code as two pipe characters side by side. |
| CLI                           | App you run in the terminal (text in, text out)                    |
| Arguments (args)              | Extra words after the command that tell your app what to do. Example: `npm run dev -- 2026-05-18 06:30 cost` → args are `2026-05-18`, `06:30`, `cost`. Everything after `--` goes to your app, not npm. |
| `argv`                        | Short for "argument vector" — the list of strings Node hands your program. Same idea as args; `process.argv` is that list in code. Index 2+ are usually *your* args (date, time, sort). |
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
| **API**                       | **A**pplication **P**rogramming **I**nterface — an agreed way for two programs to ask each other for data. In this repo: the browser orders from `server.ts`; the server runs `searchPools()` and sends back a list. You don't put kitchen logic in the browser. |
| Request                       | The ask — e.g. browser: "lanes for 2026-05-18 at 09:00?" Implemented as a URL: `GET /api/search?date=…&time=…` |
| Response                      | The answer the server sends back — here, JSON text with `query` and `results`. |
| Endpoint                      | One "menu item" on the server — ours is **`/api/search`** (lane search only). |
| `GET`                         | HTTP verb meaning "read data only" (no form body). Our search uses GET because date/time sit in the URL. |
| JSON                          | Text shaped like `{ "name": "La Jolla YMCA", "lanesAvailable": 4 }` — easy for TypeScript/JavaScript to parse. |
| `localhost`                   | "This computer." **`localhost:3000`** = web app running on your machine while you develop (not on the public internet). |
| `fetch()`                     | Browser built-in: send a request to a URL and get the response (used in `src/web/app.ts` for `/api/search`). |
| **curl**                      | Terminal tool to fetch a URL and print the response — test the **API** without a browser. Same **Endpoint** as `fetch()`: e.g. `curl "http://localhost:3000/api/search?date=…&time=…"` sends a **GET** **Request**; server sends back **JSON** **Response**. |
| `npm run web`                 | Build TypeScript, then start `dist/server.js` — open http://localhost:3000 to use the UI sample. |

### API in this project (restaurant again)

| Piece | File | Role |
| ----- | ---- | ---- |
| Customer | Browser + `src/web/app.ts` | Clicks Find Open Lanes |
| Counter | `src/server.ts` | Receives `/api/search`, calls kitchen |
| Kitchen | `src/services/searchPools.ts` | Same funnel as CLI |
| Menu line | `GET /api/search?date=&time=&sortBy=&maxDriveMinutes=` | The only API endpoint in V0 |

**Why use an API?** Same kitchen can serve CLI, web, and later a phone app — only the "how you order" changes (terminal args vs URL).

## Weekdays in code (`dayOfWeek`)

0 = Sunday · 1 = Monday · 2 = Tuesday · 3 = Wednesday · 4 = Thursday · 5 = Friday · 6 = Saturday

## System diagrams

How the pieces fit together. View in Cursor/GitHub preview, or paste the `mermaid` blocks into [mermaid.live](https://mermaid.live).

### V0 today (what's in the repo)

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

**Use a new Agent chat** (not this thread). Open folder `Prototype Exercise`; Cursor reads `AGENTS.md` automatically.

**Read first:** This file (**Resume here** + funnel/glossary above), `AGENTS.md`, `VISION.md`.

### Welcome back / refresher

**North star (one sentence):** You pick a date and time; the app tells you which San Diego pools have a **lap lane open then** — that is priority #1; distance and guest pass cost only help you choose among pools that already match.

**What's built now (May 2026):**

- **Web UI:** Screens 1–2, hero swimmer, date picker + Today/Tomorrow pills, time grid 5am–9pm (half-hour slots), hides past times on Today · `npm run web` → http://localhost:3000
- **Real pantry:** 15 pools in `src/data/pools/` (12 city SD PDFs + Ryan YMCA + Plunge; Clairemont closure-only with empty availability; Vista Terrace added)
- **PDF archive:** Source PDFs in `data/sources/`; `scheduleSource` on `Pool` type
- **CLI + web** both load from `pools/index.ts` (not `samplePools`)
- **Latest commit:** `e27d979` (real pools + web wiring)
- **Uncommitted (dirty working tree):** date picker + Today/Tomorrow pills + hide-past-times — `public/index.html`, `public/styles.css`, `src/web/app.ts` (run `git status` to confirm)
- **Push blocked:** No git remote configured yet — create a GitHub repo, then `git remote add origin <url>`

**Sanity checks done:**

- Ryan YMCA, Wed `2026-06-03`: `06:00` → 3 lanes · `09:00` → absent · `12:00` → 4 · `14:00` → 5 · `20:00` → 6 — matches data file

**Your priorities (expressed):**

- **Scalability roadmap:** A JSON pools · B PDF ingest script · C PDF link on results (phone) · D SQLite + refresh · E deploy
- Spot-check more pools
- **Slice 1 next:** JSON loader + "View schedule" PDF button on result cards

**How to work with the agent:** Short steps · explain any new code · gray comments in files · wait for **got it** before the next chunk.

**Run commands:**

```bash
cd "/Users/benstern/Prototype Exercise"
npm run web
npm run dev -- 2026-06-03 12:00
# Ryan YMCA sanity: Wed 2026-06-03 at 12:00 should show Ryan with 4 lanes
```

**Next (tiny slice):**

1. **Commit date picker** (if ready) — uncommitted changes in `public/index.html`, `public/styles.css`, `src/web/app.ts`
2. **JSON loader + "View schedule"** — load pools from JSON; PDF button on each result card (uses `scheduleSource`)
3. **Spot-check** more pools against source PDFs
4. **GitHub remote** — create repo + `git remote add origin` so push works
5. Later roadmap: PDF ingest script → SQLite + refresh → deploy

**Future (in `VISION.md`):** pool amenities · workouts/notes section · possible MySwimPro-style integration

**Paste into new Agent chat:**

```
I'm back on the SD lap lane project. Read notes.md "Resume here" and "Welcome back / refresher", plus AGENTS.md and VISION.md. Lane open at date/time is #1. Latest commit e27d979; date picker may be uncommitted — check git status. Continue with the next tiny slice: JSON loader + "View schedule" PDF button on result cards.
```
