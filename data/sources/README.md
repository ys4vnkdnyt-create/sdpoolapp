# Schedule sources (real data)

Files and links we use to fill the pantry. **Lane times must match the source** — when a PDF changes, re-download and update `src/data/pools/`.

| File / link | Pool | Notes |
|-------------|------|--------|
| [05.2026-Pool-Schedule.pdf](https://www.ymcasd.org/wp-content/uploads/2025/09/05.2026-Pool-Schedule.pdf) | **Ryan Family YMCA** (outdoor lap pool) | Effective 5/3/2026. Local copy: `ymca-pool-schedule-2026.pdf`. Not Mission Valley — check branch name on the PDF header. |
| [plungesandiego.com/schedule](https://plungesandiego.com/schedule/) | The Plunge | Baseline lap swim 7am–7pm, 7 lanes; calendar may restrict lanes on some days (later). |
| [alliedgardenspoolprogram.pdf](https://www.sandiego.gov/sites/default/files/2024-04/alliedgardenspoolprogram.pdf) | **Allied Gardens Swimming Pool** | Effective Feb 27. Local copy: `allied-gardens-pool-program.pdf`. Closed Sundays. Lane count not in PDF (placeholder: 2). |
| [budkearnspoolprogram.pdf](https://www.sandiego.gov/sites/default/files/2024-04/budkearnspoolprogram.pdf) | **Bud Kearns Memorial Pool** | Effective May 4. Local copy: `bud-kearns-pool-program.pdf`. Closed Sundays. Lap swim M/W/F 12–7pm, Tu/Th 10:15am–8:30pm, Sat two windows. Lane count not in PDF (placeholder: 2). |
| [carmelmountainpoolprogram.pdf](https://www.sandiego.gov/sites/default/files/2024-04/carmelmountainpoolprogram.pdf) | **Carmel Mountain Ranch** (City of SD) | Effective Jan 1. Closed Sundays. Lap swim Mon/Wed/Fri 7am–5pm, Tue/Thu 10:30am–6pm, Sat 12–4pm — see `carmel-mountain-pool.ts`. Lane count not in PDF (placeholder: 2). Local copy: `carmel-mountain-pool-program.pdf`. |
| [carmelvalleypoolprogram.pdf](https://www.sandiego.gov/sites/default/files/2024-04/carmelvalleypoolprogram.pdf) | **Carmel Valley Pool** (City of SD) | Effective April 2026. Closed Fri/Sat. Lap swim Sun 1–4pm, Mon–Thu 11:30am–2pm and 3–5pm — see `carmel-valley-pool.ts`. Lane count not in PDF (placeholder: 2). Local copy: `carmel-valley-pool-program.pdf`. |
| [cityheightspoolprogram.pdf](https://www.sandiego.gov/sites/default/files/2024-04/cityheightspoolprogram.pdf) | **City Heights Swim Center** (City of SD) | Effective Feb 27. Closed Saturdays. Lap swim Mon–Fri 10:30am–12pm and 1–5pm, Sun 12–3:30pm — see `city-heights-pool.ts`. Lane count not in PDF (placeholder: 2). Local copy: `city-heights-pool-program.pdf`. |
| [clairemontpoolprogram.pdf](https://www.sandiego.gov/sites/default/files/2024-04/clairemontpoolprogram.pdf) | **Clairemont Pool** (City of SD) | Closure notice only (renovations Oct 26, 2024 – spring 2026). **No lap swim windows in PDF** — see `clairemont-pool.ts` (empty availability). Local copy: `clairemont-pool-program.pdf`. |
| [kearnymesapoolprogram.pdf](https://www.sandiego.gov/sites/default/files/2024-04/kearnymesapoolprogram.pdf) | **Kearny Mesa Pool** (City of SD) | Effective March 9. Closed Fri/Sat. Lap swim Mon/Wed 2:30–5pm, Tue/Thu 12–2pm and 3–5pm, Sun 12–3pm and 3:30–5pm — see `kearny-mesa-pool.ts`. Lane count not in PDF (placeholder: 2). Local copy: `kearny-mesa-pool-program.pdf`. |
| [colinadelsolpoolprogram.pdf](https://www.sandiego.gov/sites/default/files/2024-04/colinadelsolpoolprogram.pdf) | **Colina del Sol Pool** (City of SD) | Effective March 10. Closed Sun/Mon. Lap swim Tue/Thu 11am–5pm, Fri 1–5pm, Sat 12–4pm — see `colina-del-sol-pool.ts`. Lane count not in PDF (placeholder: 2). Local copy: `colina-del-sol-pool-program.pdf`. |
| [mlkpoolprogram.pdf](https://www.sandiego.gov/sites/default/files/2024-04/mlkpoolprogram.pdf) | **Dr. Martin Luther King Jr. Pool** (City of SD) | Effective June 1. Closed Sun/Mon. Lap swim Tue/Thu 11am–12:30pm & 5–6:30pm, Wed/Fri 12:30–2pm & 2:45–4:15pm, Sat 1:45–4pm — see `mlk-pool.ts`. Lane count not in PDF (placeholder: 2). Local copy: `mlk-pool-program.pdf`. |
| [swansonpoolprogram.pdf](https://www.sandiego.gov/sites/default/files/2024-04/swansonpoolprogram.pdf) | **Swanson Swimming Pool** (City of SD) | Effective March 14. Closed Sun/Mon. Lap swim Wed/Fri 11am–3:30pm, Sat 11:30am–4pm — see `swanson-pool.ts`. Lane count not in PDF (placeholder: 2). Local copy: `swanson-pool-program.pdf`. |
| [memorialpoolprogram.pdf](https://www.sandiego.gov/sites/default/files/2024-04/memorialpoolprogram.pdf) | **Memorial Pool** (City of SD) | Effective April 1. Closed Sundays. Lap swim Mon–Fri 10am–4pm, Sat 12–4pm — see `memorial-pool.ts`. Lane count not in PDF (placeholder: 2). Local copy: `memorial-pool-program.pdf`. |
| [vistaterracepoolprogram.pdf](https://www.sandiego.gov/sites/default/files/2024-04/vistaterracepoolprogram.pdf) | **Vista Terrace Pool** (City of SD) | Effective April 1. Lap swim Sun 11:30am–4:30pm, Mon/Tue/Thu 2–6pm — see `vista-terrace-pool.ts`. Closed Wed/Fri/Sat. Lane count not in PDF (placeholder: 2). Local copy: `vista-terrace-pool-program.pdf`. |
| [tierrasantapoolprogram.pdf](https://www.sandiego.gov/sites/default/files/2024-04/tierrasantapoolprogram.pdf) | **Tierrasanta Community Pool** (City of SD) | Effective March 2026. Closed Sundays; no Sat lap swim on PDF. Lap swim Mon/Wed/Fri 10am–3pm, Tue/Thu 12–3pm, Mon–Fri 4–8pm — see `tierrasanta-pool.ts`. Lane count not in PDF (placeholder: 2). Local copy: `tierrasanta-pool-program.pdf`. |

## Re-ingest YMCA PDF (optional)

Requires Python `pdfplumber` in `.pdf-tools/` (local only, not committed):

```bash
curl -sL -o data/sources/ymca-pool-schedule-2026.pdf \
  "https://www.ymcasd.org/wp-content/uploads/2025/09/05.2026-Pool-Schedule.pdf"
```

Then compare grid output to `src/data/pools/ryan-family-ymca.ts` and update windows if the Y changes the PDF.
