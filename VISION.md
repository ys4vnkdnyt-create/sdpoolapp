# Product Vision

## One-liner

An app that shows San Diego swim pool lap lane availability for a date and time you choose.

## North star (priority order)

**Lane opening at your date and time is the product.** Everything else supports that answer.

1. **Is there a lap lane open when I want to swim?** — non-negotiable; wrong or stale here and the app fails
2. **Which pools qualify** — only pools that pass #1 get listed
3. **Help me choose among those** — distance, drive time, guest pass cost, sort, **amenities** (nice-to-have; never replace #1)

If we cut scope, protect the funnel: match day + time window → lanes available. Defer nicer sorting, maps, amenities, training features, and extra pools before we weaken lane-open signal.

---

## Problem

It is clunky and takes a lot of work to find a lap lane that is open for swimming. It would be nice not to have to go to a pool’s website, open a PDF or Google Doc of lane availability, and hunt for the answer—I want that information right away.

## Who it’s for

Likely a serious swimmer, triathlete, or someone who swims at different pools and has flexible hours.

## Core job to be done

When I want to swim laps, I need to know **whether a lap lane is actually open at the time I care about** and **where** that is—without calling around or showing up blind. After that, I want help comparing options: guest pass cost and how far away each pool is (including travel time with traffic).

---

## User experience (happy path)

A user opens the app and enters the date and time they want a lane. The app returns which pools have a lane available within a preselected geographic radius. For each option, it shows travel time (including traffic) and estimated guest pass cost.

## What the user asks / inputs

- After profile setup and onboarding *(out of scope for now)*, the user requests a lane at a chosen hour on a chosen date (likely via dropdown selection).

---

## What the user gets back

- A list of pools with an open lap lane at the requested date and time, within the selected radius
- Travel time to each pool (including traffic)
- Estimated guest pass cost for each pool

**Sort / filter by:**

- Distance
- Guest pass cost

---

## Pools & data

*(To define: which San Diego pools to include, and how we keep lane schedules up to date.)*

### Data sources (how pools might publish schedules)

Pools often post lane availability in different formats. The app may need to read from one or more of these:


| Type                       | What it is                                                                        | Example                                                |
| -------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **PDF on your computer**   | A file you downloaded or saved locally                                            | `lane-schedule.pdf` in Downloads                       |
| **PDF at a URL**           | The same PDF format, hosted on the web—you open it via a link                     | `https://somepool.com/lane-schedule.pdf`               |
| **Web page or Google Doc** | Schedule shown in a browser (HTML) or a shared doc, not always a real `.pdf` file | Pool “Aquatics” page, or a Google Doc link pools share |


**Why this matters:** If we automate collection, each type needs a different approach. PDFs at URLs and local PDFs are similar; web pages and Google Docs are often harder because layout and links change.

**Caveats:** Formats vary by pool; links can break or move; “web PDF” sometimes just means a PDF opened in the browser, and sometimes people mean any schedule they view online.

## Out of scope (for now)

- User profile, onboarding, and membership tracking (so the app can mark a pool as free if you already belong)
- *Hours the lane is available* *(confirm whether this is in or out of v1)*
- Pool amenities (see **Future ideas**)
- Workouts, swim notes, and third-party training app links (see **Future ideas**)

---

## Future ideas (backlog)

*Not V0 or web slice 1 — capture so we do not lose them.*

### Pool amenities

After a pool passes “lane open at your time,” show **amenities** to help you pick among qualifying pools. Examples to define per pool:

- Pull buoys / paddles / kickboards available
- Hot tub, sauna, locker rooms, showers
- Parking, outdoor vs indoor, water temperature (if published)

**Product fit:** Same tier as distance and guest pass — comparison only among pools that already have a lane. May become **filters** later (e.g. “must have parking”).

**Data:** Likely manual or semi-manual per pool at first (like fake drive times today), unless a source exposes structured amenity data.

### Workouts and notes

A separate area of the app (not the search funnel) for **your** swimming:

- Log or view **workouts** (sets, distance, focus)
- **Notes** (how the swim felt, pool conditions, things to remember)

**Product fit:** Keeps “find a lane” fast; training journal lives beside it for serious swimmers and triathletes.

**Open design questions:** Is this built in-app, export-only, or mostly a link-out? Do notes attach to a pool + date from a past search?

### Integration: MySwimPro (and similar)

Possible **integration** with apps like [MySwimPro](https://www.myswimpro.com) — e.g. open a planned workout, sync completed swims, or deep-link from a search result to “train here.”

**Caveats:** Needs their API or partner program (if any), account linking, and privacy choices. Treat as **explore later**; not required for lane-finder value.

---

## Success looks like

- A fast app that solves this problem quickly

---

## Open questions

- Which source types can we reliably collect from first? (See **Data sources** above.)

---

## UI direction (Replit wireframes — May 2026)

**Reference:** 3-screen mobile flow (teal header, rounded cards, bottom nav: Search · Saved · Profile).

| Screen | Purpose | Build order |
|--------|---------|-------------|
| **1 — Search / home** | Date pills (Today / Tomorrow / …), time grid, radius slider, **Find Open Lanes** | **Slice 1** (wire up `searchPools`) |
| **2 — Results** | “Open lanes for {date} · {time}”, sort pills (Distance / Drive time / Cost), pool cards with “• N Open”, mi / min / $ | **Slice 2** |
| **3 — Pool detail** | Address, lane grid by time, Reserve, amenities pills | **Later** (needs per-lane data we do not have in V0) |

**Hero (screen 1):** Use the **swimmer cartoon** at the top of the teal header block — above “When do you want to swim?” (replace the small doodle in the Replit mock with the full illustration asset). Asset in project: `assets/Screenshot_2026-05-29_at_3.06.18_PM-…png` (copy to `public/` when building, e.g. `public/hero-swimmer.png`).

**Slice 1 scope:** Match screen 1 layout + screen 2 list (fake pantry data). Defer Saved/Profile nav, Reserve button, and lane-level grid until data model supports it.

**Note:** Stock image may show a watermark — use a licensed export or your own art for anything public-facing.

---

## Notes & raw ideas

- Ask for system diagram so it will show me how pieces work together
- Watch video that explains functions in coding

