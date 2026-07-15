# AI Assistant Instructions

You are helping me with this project. Follow the rules below in every conversation.

## Rules

- Be direct and concise; prefer shorter answers when possible
- Ask clarifying questions when requirements or context are missing
- Match existing project conventions before introducing new patterns
- Keep changes focused—do not expand scope beyond what was asked
- When you update durable decisions or preferences, suggest edits to this file
- Do not write code without confirming with me first
- Keep instructions simple and avoid heavy tech jargon; when jargon is necessary, explain it
- I am not the best typist—polish spelling, grammar, and wording in prose I write (docs, notes, messages, Markdown) so it reads clean and professional; do not apply this to code
- No commits unless I ask
- Use TypeScript only—I want to learn it—and show me the code being used
- Explain any new code that is generated
- Add brief inline comments (gray in the editor) for each function and for non-obvious lines so the code is easier to follow while learning

## Project Context

**Pool schedule data:** Use **real data only** — transcribe from published PDFs or official pages (Ryan Family YMCA is the reference shape for `availability[]`). No broad fake weekly windows or placeholder grids. If a venue has no public lap schedule, set `availability` to `[]` so search excludes it until real data exists.

**Transcribing schedules (per weekday):**
- Transcribe **each day separately** from the PDF — never copy Monday’s grid onto Tuesday.
- One printed row with a lane count = **one** `availability` window (e.g. Thu 5:30–10:15 with 6 lanes, not three short fragments).
- At load, `normalizeExplicitBlocks()` merges overlapping or back-to-back rows on the **same day** and keeps the **higher** lane count.

**Gaps between schedule blocks:** Blank time between two printed blocks on the **same day** usually still means lap lanes are open. Search uses `prepareAvailabilityForSearch()` in `scheduleWindows.ts`: normalize, then fill gaps using the **higher** lane count from either neighboring block (at least 1).

I am learning how to build with AI and am giving myself a prototype project. The project will address a pain point I had in the past as an athlete.

I want to create an application that tells me local San Diego swim pool **lap lane availability (open or not) at the date and time I ask about**—that is the most important part of the project. Distance and guest pass cost help me choose among pools that already have a lane open; they are secondary. I will ask for more information when we work on this further.

## Learning plan: fresh schedules on search (complex path)

Goal: fetch and read pool schedules **at search time** (not a big stored library of weekly grids). Keep long-term storage small: pool metadata + `scheduleSource.url` only.

**Four steps:**

1. **User** → location + date/time  
2. **Server** → nearby pools (geo + `/api/search`)  
3. **Server** → for each nearby pool, **fetch** its PDF/page **now**, **parse** into `availability[]`  
4. **Server** → answer open/closed, return JSON (parsed schedule can be discarded after; optional short in-memory cache)

**Learning order:** (1) live fetch on search for one pool type → (2) add short cache → (3) add a second schedule format → (4) skills per format (City PDF, YMCA PDF, web table).

**Skill vs app:** Skills teach the AI how to build/maintain parsers and transcription rules. Live user search is **code** on the server.

## About Me

- I used to work in tech (small startup ops) but have been a professional athlete for the last ~7 years (triathlon)
- I barely used a laptop during my pro career, so I am a bit rusty with tools, tech lingo, and navigation
- I want to learn how to build with AI from scratch, understand it better, and master how to use it in various scenarios
- I also want to play the long game and really understand AI “under the hood,” so I want to see more about its logic and coding as I work to build something

