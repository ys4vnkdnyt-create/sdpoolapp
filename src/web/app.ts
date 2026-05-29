/**
 * Browser front counter: screens 1 (search) and 2 (results).
 * Calls GET /api/search — kitchen logic stays on the server.
 */

/** Shape of each pool row from /api/search (matches server JSON). */
interface SearchResultJson {
  poolId: string;
  name: string;
  address: string;
  lanesAvailable: number;
  estimatedDriveMinutes: number;
  guestPassCostUsd: number;
}

interface SearchResponse {
  query: {
    date: string;
    time: string;
    sortBy?: "distance" | "cost";
    maxDriveMinutes?: number;
  };
  results: SearchResultJson[];
}

/** Lap-swim times shown on screen 1 (24h HH:mm). */
const TIME_SLOTS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
];

/** Rough miles → minutes for V0 (real app would use maps). */
function milesToDriveMinutes(miles: number): number {
  return Math.round(miles * 3);
}

/** ISO date YYYY-MM-DD for today + offset days. */
function dateForOffsetDays(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Short label for a date pill, e.g. "Wed". */
function weekdayShort(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

/** "9:00 AM" from "09:00". */
function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = Number(hStr);
  const m = mStr ?? "00";
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

/** "Today · 9:00 AM" for the results header. */
function formatResultsHeader(date: string, time: string): string {
  const today = dateForOffsetDays(0);
  const tomorrow = dateForOffsetDays(1);
  let dayLabel: string;
  if (date === today) dayLabel = "Today";
  else if (date === tomorrow) dayLabel = "Tomorrow";
  else dayLabel = weekdayShort(date);

  return `Open lanes for ${dayLabel} · ${formatTime12h(time)}`;
}

/** V0 fake miles from drive minutes (placeholder until maps). */
function fakeMilesFromDriveMinutes(minutes: number): string {
  return (minutes / 3).toFixed(1);
}

// --- DOM refs ---
const screenSearch = document.getElementById("screen-search")!;
const screenResults = document.getElementById("screen-results")!;
const datePills = document.getElementById("date-pills")!;
const timeGrid = document.getElementById("time-grid")!;
const radiusSlider = document.getElementById("radius-slider") as HTMLInputElement;
const radiusLabel = document.getElementById("radius-label")!;
const findButton = document.getElementById("find-lanes")!;
const backButton = document.getElementById("back-to-search")!;
const resultsHeader = document.getElementById("results-header")!;
const resultsList = document.getElementById("results-list")!;
const resultsFooter = document.getElementById("results-footer")!;
const sortPills = document.getElementById("sort-pills")!;

// --- State ---
let selectedDate = dateForOffsetDays(0);
let selectedTime = "09:00";
let selectedSort: "distance" | "cost" = "distance";
let radiusMiles = 5;

/** Build Today / Tomorrow / +2 day pills. */
function renderDatePills(): void {
  const offsets = [0, 1, 2];
  datePills.innerHTML = "";

  for (const offset of offsets) {
    const iso = dateForOffsetDays(offset);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill date-pill";
    if (iso === selectedDate) btn.classList.add("pill--active");

    if (offset === 0) btn.textContent = "Today";
    else if (offset === 1) btn.textContent = "Tomorrow";
    else btn.textContent = weekdayShort(iso);

    btn.addEventListener("click", () => {
      selectedDate = iso;
      renderDatePills();
    });
    datePills.appendChild(btn);
  }
}

/** Build the time slot grid on screen 1. */
function renderTimeGrid(): void {
  timeGrid.innerHTML = "";

  for (const slot of TIME_SLOTS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "time-slot";
    if (slot === selectedTime) btn.classList.add("time-slot--active");
    btn.textContent = formatTime12h(slot);

    btn.addEventListener("click", () => {
      selectedTime = slot;
      renderTimeGrid();
    });
    timeGrid.appendChild(btn);
  }
}

/** Update "Within X miles" label when slider moves. */
function updateRadiusLabel(): void {
  radiusMiles = Number(radiusSlider.value);
  radiusLabel.textContent = `Within ${radiusMiles} miles`;
}

/** Show search or results screen. */
function showScreen(which: "search" | "results"): void {
  screenSearch.hidden = which !== "search";
  screenResults.hidden = which !== "results";
}

/** Highlight the active sort pill. */
function renderSortPills(): void {
  const buttons = sortPills.querySelectorAll<HTMLButtonElement>("[data-sort]");
  for (const btn of buttons) {
    const sort = btn.dataset.sort as "distance" | "cost";
    btn.classList.toggle("pill--active", sort === selectedSort);
  }
}

/** One pool card on screen 2. */
function renderResultCard(r: SearchResultJson): string {
  const miles = fakeMilesFromDriveMinutes(r.estimatedDriveMinutes);
  return `
    <article class="pool-card" data-pool-id="${r.poolId}">
      <div class="pool-card__top">
        <div>
          <h2 class="pool-card__name">${escapeHtml(r.name)}</h2>
          <p class="pool-card__meta">${escapeHtml(r.address)}</p>
        </div>
        <span class="badge badge--open">• ${r.lanesAvailable} Open</span>
      </div>
      <div class="pool-card__stats">
        <span>◎ ${miles} mi</span>
        <span>⏱ ${r.estimatedDriveMinutes} min</span>
        <span>$ ${r.guestPassCostUsd} drop-in</span>
      </div>
    </article>
  `;
}

/** Prevent HTML injection from pool names in sample data. */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/** Call the server kitchen and paint screen 2. */
async function runSearch(): Promise<void> {
  const maxDriveMinutes = milesToDriveMinutes(radiusMiles);
  const params = new URLSearchParams({
    date: selectedDate,
    time: selectedTime,
    sortBy: selectedSort,
    maxDriveMinutes: String(maxDriveMinutes),
  });

  const res = await fetch(`/api/search?${params}`);
  if (!res.ok) {
    resultsList.innerHTML = `<p class="empty">Search failed. Is the server running?</p>`;
    showScreen("results");
    return;
  }

  const data = (await res.json()) as SearchResponse;
  resultsHeader.textContent = formatResultsHeader(
    data.query.date,
    data.query.time
  );

  if (data.results.length === 0) {
    resultsList.innerHTML = `<p class="empty">No pools with lap lanes in that window (sample data only).</p>`;
  } else {
    resultsList.innerHTML = data.results.map(renderResultCard).join("");
  }

  resultsFooter.textContent = `End of results within ${radiusMiles} miles (sample drive times).`;
  showScreen("results");
}

// --- Wire up events ---
radiusSlider.addEventListener("input", updateRadiusLabel);
findButton.addEventListener("click", () => void runSearch());
backButton.addEventListener("click", () => showScreen("search"));

sortPills.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-sort]");
  if (!btn?.dataset.sort) return;
  selectedSort = btn.dataset.sort as "distance" | "cost";
  renderSortPills();
  void runSearch();
});

// --- First paint ---
renderDatePills();
renderTimeGrid();
updateRadiusLabel();
renderSortPills();
showScreen("search");
