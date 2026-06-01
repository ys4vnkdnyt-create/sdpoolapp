/**
 * Browser front counter: screens 1 (search) and 2 (results).
 * Calls GET /api/search — kitchen logic stays on the server.
 */

/** Published schedule link (PDF or web page) from the pantry. */
interface ScheduleSourceJson {
  label: string;
  url: string;
  effectiveDate: string;
}

/** Shape of each pool row from /api/search (matches server JSON). */
interface SearchResultJson {
  poolId: string;
  name: string;
  address: string;
  lanesAvailable: number;
  estimatedDriveMinutes: number;
  distanceMiles: number;
  guestPassCostUsd: number;
  scheduleSource?: ScheduleSourceJson;
  scheduleUrl?: string;
  websiteUrl?: string;
  contactPhone?: string;
  /** Military base pool — show * and access note in results. */
  military?: boolean;
}

/** Optional nearby pool with no transcribed schedule (from /api/search). */
interface NoSchedulePoolJson {
  poolId: string;
  name: string;
  address: string;
  distanceMiles: number;
  estimatedDriveMinutes: number;
  guestPassCostUsd: number;
  scheduleUrl?: string;
  websiteUrl?: string;
  contactPhone?: string;
  hasScheduleData: false;
  military?: boolean;
  statusNote?: string;
}

interface SearchResponse {
  query: {
    date: string;
    time: string;
    sortBy?: "distance" | "cost";
    maxDriveMinutes?: number;
  };
  results: SearchResultJson[];
  noSchedulePools?: NoSchedulePoolJson[];
}

/** First and last pickable time (24h). Typical lap-swim day; real pools may narrow later. */
const TIME_SLOT_START = "05:00";
const TIME_SLOT_END = "21:00";
const TIME_SLOT_STEP_MINUTES = 30;

/** Build every half-hour from start through end, e.g. 05:00 … 21:00. */
function buildTimeSlots(
  start: string,
  end: string,
  stepMinutes: number
): string[] {
  const slots: string[] = [];
  let minutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  while (minutes <= endMinutes) {
    slots.push(minutesToTime(minutes));
    minutes += stepMinutes;
  }
  return slots;
}

/** "06:30" → minutes since midnight (for slot math). */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

/** Minutes since midnight → "06:30". */
function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const TIME_SLOTS = buildTimeSlots(
  TIME_SLOT_START,
  TIME_SLOT_END,
  TIME_SLOT_STEP_MINUTES
);

/** True when the chosen day is today (local calendar). */
function isToday(isoDate: string): boolean {
  return isoDate === dateForOffsetDays(0);
}

/**
 * Earliest selectable time today: now rounded up to the next 30‑min mark.
 * Example: 2:07 PM → first slot 2:30 PM; 2:00 PM exactly → 2:00 PM still OK.
 */
function earliestMinutesToday(): number {
  const now = new Date();
  let minutes = now.getHours() * 60 + now.getMinutes();
  const remainder = minutes % TIME_SLOT_STEP_MINUTES;
  if (remainder !== 0) {
    minutes += TIME_SLOT_STEP_MINUTES - remainder;
  }
  return minutes;
}

/** Times to show for the selected date (hide past times on Today only). */
function getVisibleTimeSlots(isoDate: string): string[] {
  if (!isToday(isoDate)) {
    return TIME_SLOTS;
  }

  const minMinutes = earliestMinutesToday();
  const endMinutes = timeToMinutes(TIME_SLOT_END);
  if (minMinutes > endMinutes) {
    return [];
  }

  return TIME_SLOTS.filter((slot) => timeToMinutes(slot) >= minMinutes);
}

/** If the current pick is hidden (e.g. switched to Today), select the first visible slot. */
function ensureSelectedTimeValid(): void {
  const visible = getVisibleTimeSlots(selectedDate);
  if (visible.length === 0) return;
  if (!visible.includes(selectedTime)) {
    selectedTime = visible[0];
  }
}

/** Default map center when the user has not shared GPS (downtown San Diego). */
const DEFAULT_USER_LOCATION = { lat: 32.7157, lng: -117.1611 };

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

/** Format miles for a result card (API sends real miles when GPS was used). */
function formatDistanceMiles(miles: number): string {
  return miles.toFixed(1);
}

// --- DOM refs ---
const screenSearch = document.getElementById("screen-search")!;
const screenResults = document.getElementById("screen-results")!;
const datePills = document.getElementById("date-pills")!;
const datePicker = document.getElementById("date-picker") as HTMLInputElement;
const timeGrid = document.getElementById("time-grid")!;
const radiusSlider = document.getElementById("radius-slider") as HTMLInputElement;
const radiusLabel = document.getElementById("radius-label")!;
const locationLabel = document.getElementById("location-label")!;
const useLocationButton = document.getElementById("use-location")!;
const findButton = document.getElementById("find-lanes")!;
const backButton = document.getElementById("back-to-search")!;
const resultsHeader = document.getElementById("results-header")!;
const resultsList = document.getElementById("results-list")!;
const noScheduleSection = document.getElementById("no-schedule-section")!;
const noScheduleList = document.getElementById("no-schedule-list")!;
const resultsFooter = document.getElementById("results-footer")!;
const sortPills = document.getElementById("sort-pills")!;

// --- State ---
let selectedDate = dateForOffsetDays(0);
let selectedTime = TIME_SLOTS[0];
let selectedSort: "distance" | "cost" = "distance";
let radiusMiles = 5;
/** Set when geolocation succeeds; search uses real distance from here. */
let userLocation: { lat: number; lng: number } | null = null;
let locationStatus: "pending" | "ready" | "denied" | "unsupported" = "pending";

/** Keep the native date input aligned with selectedDate. */
function syncDatePickerValue(): void {
  datePicker.value = selectedDate;
}

/** Block past dates — search is for today or future only. */
function initDatePickerMin(): void {
  datePicker.min = dateForOffsetDays(0);
}

/** Highlight Today/Tomorrow/+2 pills when selectedDate matches one of them. */
function syncDatePillActiveState(): void {
  const buttons = datePills.querySelectorAll<HTMLButtonElement>(".date-pill");
  for (const btn of buttons) {
    const iso = btn.dataset.date;
    btn.classList.toggle("pill--active", iso === selectedDate);
  }
}

/** Apply a new date from pills or the date input, then refresh time slots. */
function setSelectedDate(iso: string): void {
  selectedDate = iso;
  syncDatePickerValue();
  syncDatePillActiveState();
  ensureSelectedTimeValid();
  renderTimeGrid();
}

/** Build Today / Tomorrow / +2 day pills. */
function renderDatePills(): void {
  const offsets = [0, 1, 2];
  datePills.innerHTML = "";

  for (const offset of offsets) {
    const iso = dateForOffsetDays(offset);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill date-pill";
    btn.dataset.date = iso;
    if (iso === selectedDate) btn.classList.add("pill--active");

    if (offset === 0) btn.textContent = "Today";
    else if (offset === 1) btn.textContent = "Tomorrow";
    else btn.textContent = weekdayShort(iso);

    btn.addEventListener("click", () => {
      setSelectedDate(iso);
    });
    datePills.appendChild(btn);
  }
}

/** Build the time slot grid on screen 1. */
function renderTimeGrid(): void {
  timeGrid.innerHTML = "";

  const slots = getVisibleTimeSlots(selectedDate);
  if (slots.length === 0) {
    timeGrid.innerHTML =
      '<p class="time-grid__empty">No more lap-swim times left today. Try Tomorrow.</p>';
    findButton.toggleAttribute("disabled", true);
    return;
  }

  findButton.toggleAttribute("disabled", false);

  for (const slot of slots) {
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

/** Pretty-print a 10-digit US phone for display. */
function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/** Build tel: href from stored phone string. */
function phoneToTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `tel:+1${digits}` : `tel:${digits}`;
}

/**
 * Search-result cards only: official schedule link + call the pool.
 * (Not shown on a separate browse-all list — only pools in your search.)
 */
function renderSearchResultActions(links: {
  scheduleUrl?: string;
  websiteUrl?: string;
  contactPhone?: string;
}): string {
  const parts: string[] = [];
  const scheduleLink = links.scheduleUrl ?? links.websiteUrl;

  if (scheduleLink) {
    parts.push(
      `<a class="pool-card__action pool-card__action--schedule" href="${escapeHtml(scheduleLink)}" target="_blank" rel="noopener noreferrer">View schedule</a>`
    );
  }

  if (links.contactPhone) {
    const tel = phoneToTelHref(links.contactPhone);
    const phoneLabel = formatPhoneDisplay(links.contactPhone);
    parts.push(
      `<a class="pool-card__action pool-card__action--call" href="${escapeHtml(tel)}" title="Call ${escapeHtml(phoneLabel)}">Call pool</a>`
    );
  }

  if (parts.length === 0) return "";
  return `<div class="pool-card__actions">${parts.join("")}</div>`;
}

/** Pool display name — asterisk marks military bases (access may be restricted). */
function formatPoolName(name: string, military?: boolean): string {
  const label = military ? `${name} *` : name;
  return escapeHtml(label);
}

/** Visible note on military pool cards (under the address). */
function renderMilitaryDescription(military?: boolean): string {
  if (!military) return "";
  return `<p class="pool-card__military">Military base pool — base access or military ID may be required.</p>`;
}

/** One pool card on screen 2. */
function renderResultCard(r: SearchResultJson): string {
  const miles = formatDistanceMiles(r.distanceMiles);
  const actions = renderSearchResultActions({
    scheduleUrl: r.scheduleUrl ?? r.scheduleSource?.url,
    websiteUrl: r.websiteUrl,
    contactPhone: r.contactPhone,
  });
  const militaryNote = renderMilitaryDescription(r.military);

  return `
    <article class="pool-card" data-pool-id="${r.poolId}">
      <div class="pool-card__top">
        <div>
          <h2 class="pool-card__name">${formatPoolName(r.name, r.military)}</h2>
          <p class="pool-card__meta">${escapeHtml(r.address)}</p>
          ${militaryNote}
        </div>
        <span class="badge badge--open">• ${r.lanesAvailable} Open</span>
      </div>
      <div class="pool-card__stats">
        <span>◎ ${miles} mi</span>
        <span>⏱ ${r.estimatedDriveMinutes} min</span>
        <span>$ ${r.guestPassCostUsd} drop-in</span>
      </div>${actions}
    </article>
  `;
}

/** Card for a nearby pool without schedule data — no lane badge or "open" label. */
function renderNoScheduleCard(p: NoSchedulePoolJson): string {
  const subtitle = p.statusNote
    ? `<p class="pool-card__status">${escapeHtml(p.statusNote)}</p>`
    : "";
  const militaryNote = renderMilitaryDescription(p.military);
  const actions = renderSearchResultActions({
    scheduleUrl: p.scheduleUrl,
    websiteUrl: p.websiteUrl,
    contactPhone: p.contactPhone,
  });

  return `
    <article class="pool-card pool-card--no-schedule" data-pool-id="${p.poolId}">
      <div class="pool-card__top">
        <div>
          <h2 class="pool-card__name">${formatPoolName(p.name, p.military)}</h2>
          ${subtitle}
          <p class="pool-card__meta">${escapeHtml(p.address)}</p>
          ${militaryNote}
        </div>
      </div>
      <div class="pool-card__stats">
        <span>◎ ${p.distanceMiles.toFixed(1)} mi</span>
        <span>⏱ ${p.estimatedDriveMinutes} min</span>
        <span>$ ${p.guestPassCostUsd} drop-in</span>
      </div>${actions}
    </article>
  `;
}

/** Show or hide the optional no-schedule section below open-lane results. */
function renderNoScheduleSection(pools: NoSchedulePoolJson[] | undefined): void {
  const rows = pools ?? [];
  if (rows.length === 0) {
    noScheduleSection.hidden = true;
    noScheduleList.innerHTML = "";
    return;
  }

  noScheduleSection.hidden = false;
  noScheduleList.innerHTML = rows.map(renderNoScheduleCard).join("");
}

/** Prevent HTML injection from pool names in sample data. */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/** Update the location line under the radius slider. */
function setLocationLabel(text: string): void {
  locationLabel.textContent = text;
}

/** Ask the browser for GPS (must run after a tap — browsers block silent requests). */
function requestUserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }
    // enableHighAccuracy false = faster fix indoors; true often times out on laptops.
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
    );
  });
}

/** Turn a GeolocationPositionError into text the user can act on. */
function locationErrorMessage(err: unknown): string {
  if (err instanceof GeolocationPositionError) {
    if (err.code === err.PERMISSION_DENIED) {
      return "Location denied — allow this site in browser settings, or tap the lock icon in the address bar.";
    }
    if (err.code === err.POSITION_UNAVAILABLE) {
      return "Location unavailable — check Wi‑Fi or try outdoors; using San Diego center.";
    }
    if (err.code === err.TIMEOUT) {
      return "Location timed out — try again; using San Diego center for now.";
    }
  }
  if (err instanceof Error && err.message === "unsupported") {
    return "This browser does not support location — using San Diego center.";
  }
  return "Could not get location — using San Diego center.";
}

/** Request GPS after user taps a button (required by Chrome/Safari). */
async function ensureUserLocationFromGesture(): Promise<void> {
  if (locationStatus === "ready" && userLocation) return;

  try {
    userLocation = await requestUserLocation();
    locationStatus = "ready";
    setLocationLabel("Searching from your current location");
    useLocationButton.textContent = "Location on";
    useLocationButton.setAttribute("aria-pressed", "true");
  } catch (err) {
    locationStatus = "denied";
    userLocation = DEFAULT_USER_LOCATION;
    setLocationLabel(locationErrorMessage(err));
    useLocationButton.textContent = "Use my location";
    useLocationButton.setAttribute("aria-pressed", "false");
  }
}

/** Call the server kitchen and paint screen 2. */
async function runSearch(): Promise<void> {
  // Browsers only show the Allow/Deny prompt after a click (Find Open Lanes counts).
  await ensureUserLocationFromGesture();

  const params = new URLSearchParams({
    date: selectedDate,
    time: selectedTime,
    sortBy: selectedSort,
    maxRadiusMiles: String(radiusMiles),
  });

  const origin = userLocation ?? DEFAULT_USER_LOCATION;
  params.set("lat", String(origin.lat));
  params.set("lng", String(origin.lng));

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
    resultsList.innerHTML = `<p class="empty">No pools with lap lanes open in that window. Try a wider radius or another time.</p>`;
  } else {
    resultsList.innerHTML = data.results.map(renderResultCard).join("");
  }

  renderNoScheduleSection(data.noSchedulePools);

  const allRows = [...data.results, ...(data.noSchedulePools ?? [])];
  const locationHint =
    locationStatus === "ready"
      ? " Distances are from your location."
      : " Distances use San Diego center until you allow location.";
  resultsFooter.textContent = `End of results within ${radiusMiles} miles (estimated drive times).${locationHint}`;
  showScreen("results");
}

// --- Wire up events ---
datePicker.addEventListener("change", () => {
  if (!datePicker.value) return;
  setSelectedDate(datePicker.value);
});

radiusSlider.addEventListener("input", updateRadiusLabel);
useLocationButton.addEventListener("click", () => {
  void (async () => {
    useLocationButton.setAttribute("disabled", "true");
    setLocationLabel("Getting your location…");
    await ensureUserLocationFromGesture();
    useLocationButton.removeAttribute("disabled");
  })();
});
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
initDatePickerMin();
renderDatePills();
syncDatePickerValue();
ensureSelectedTimeValid();
renderTimeGrid();
updateRadiusLabel();
renderSortPills();
showScreen("search");
setLocationLabel(
  "Tap «Use my location» or «Find Open Lanes» — your browser will ask to allow"
);
userLocation = DEFAULT_USER_LOCATION;
