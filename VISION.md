# Product Vision

## One-liner

An app that shows San Diego swim pool lap lane availability for a date and time you choose.

---

## Problem

It is clunky and takes a lot of work to find a lap lane that is open for swimming. It would be nice not to have to go to a pool’s website, open a PDF or Google Doc of lane availability, and hunt for the answer—I want that information right away.

## Who it’s for

Likely a serious swimmer, triathlete, or someone who swims at different pools and has flexible hours.

## Core job to be done

When I want to swim laps, I need to know **where** I can get a lane **at the time I care about**, without calling around or showing up blind. I also want to know how much a guest pass might cost at each option and how far away each pool is (including travel time with traffic).

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

---

## Success looks like

- A fast app that solves this problem quickly

---

## Open questions

- Which source types can we reliably collect from first? (See **Data sources** above.)

---

## Notes & raw ideas

*(Add anything else here—we can organize later.)*  

- Ask for system diagram so it will show me how pieces work together
- Watch video that explains functions in coding

