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

/** Earliest and latest pickable swim time (24h). */
const TIME_MIN = "05:00";
const TIME_MAX = "21:00";
const TIME_STEP_MINUTES = 15;

/**
 * Fixed radius sent to the API — no slider in the UI.
 * 40 mi covers metro San Diego + North County suburbs; results are sorted by distance.
 */
const SEARCH_RADIUS_MILES = 40;

/** "06:30" → minutes since midnight (for time bounds). */
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

/**
 * Round up to the next 15-minute boundary for lap-schedule search.
 * 6:07 → 6:15; 6:15 stays 6:15. Clamped to TIME_MIN–TIME_MAX.
 */
function roundUpTo15Min(time: string): string {
  let minutes = timeToMinutes(time);
  const remainder = minutes % TIME_STEP_MINUTES;
  if (remainder !== 0) {
    minutes += TIME_STEP_MINUTES - remainder;
  }
  const minM = timeToMinutes(TIME_MIN);
  const maxM = timeToMinutes(TIME_MAX);
  minutes = Math.max(minM, Math.min(maxM, minutes));
  return minutesToTime(minutes);
}

/** True when the chosen day is today (local calendar). */
function isToday(isoDate: string): boolean {
  return isoDate === dateForOffsetDays(0);
}

/** Earliest selectable time today: now rounded up to the next whole minute. */
function earliestMinutesTodayPicker(): number {
  const now = new Date();
  let minutes = now.getHours() * 60 + now.getMinutes();
  if (now.getSeconds() > 0 || now.getMilliseconds() > 0) {
    minutes += 1;
  }
  return minutes;
}

/** Min time for wheels / native picker on the selected date (minute precision). */
function minTimeForDate(isoDate: string): string {
  if (!isToday(isoDate)) return TIME_MIN;
  const earliest = earliestMinutesTodayPicker();
  const end = timeToMinutes(TIME_MAX);
  if (earliest > end) return TIME_MAX;
  return minutesToTime(earliest);
}

/** Earliest 15-minute slot on the wheel for the chosen date. */
function minSlotTimeForDate(isoDate: string): string {
  return roundUpTo15Min(minTimeForDate(isoDate));
}

/** Snap a time onto the 15-minute grid (round up, same as search). */
function snapTimeToStep(time: string): string {
  return roundUpTo15Min(time);
}

/** Default wheel time on load: now, rounded up to the next 15 minutes. */
function defaultPickedTimeForDate(isoDate: string): string {
  const now = new Date();
  const nowTime = minutesToTime(now.getHours() * 60 + now.getMinutes());
  let time = roundUpTo15Min(nowTime);
  const minM = timeToMinutes(TIME_MIN);
  const maxM = timeToMinutes(TIME_MAX);
  let minutes = timeToMinutes(time);
  minutes = Math.max(minM, Math.min(maxM, minutes));
  time = minutesToTime(minutes);
  if (isToday(isoDate) && timeToMinutes(time) < timeToMinutes(minSlotTimeForDate(isoDate))) {
    time = minSlotTimeForDate(isoDate);
  }
  return time;
}

/** True when no lap-swim times remain today. */
function isPastEndOfDayToday(isoDate: string): boolean {
  return (
    isToday(isoDate) &&
    earliestMinutesTodayPicker() > timeToMinutes(TIME_MAX)
  );
}

/** Clamp wheel pick to bounds; refresh search time (15-min round-up). */
function ensurePickedTimeValid(): void {
  if (isPastEndOfDayToday(selectedDate)) return;

  const min = minSlotTimeForDate(selectedDate);
  if (timeToMinutes(pickedTime) < timeToMinutes(min)) {
    pickedTime = min;
  }
  if (timeToMinutes(pickedTime) > timeToMinutes(TIME_MAX)) {
    pickedTime = TIME_MAX;
  }
  selectedTime = roundUpTo15Min(pickedTime);
}

/** True when the wheel pick differs from the time sent to search. */
function isTimeRoundedForSearch(): boolean {
  return pickedTime !== selectedTime;
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

/** Short weekday for results header when not Today/Tomorrow, e.g. "Wed". */
function weekdayShort(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

/** Full weekday for date pills, e.g. "Wednesday". */
function weekdayFull(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "long" });
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

  return `Open Lanes for ${dayLabel} · ${formatTime12h(time)}`;
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
const timePickerWrap = document.getElementById("time-picker-wrap")!;
const timeTrigger = document.getElementById("time-trigger") as HTMLButtonElement;
const timeTriggerLabel = document.getElementById("time-trigger-label")!;
const timePickerPopover = document.getElementById("time-picker-popover")!;
const timeDoneButton = document.getElementById("time-done") as HTMLButtonElement;
const timeWheel = document.getElementById("time-wheel")!;
const timePicker = document.getElementById("time-picker") as HTMLInputElement;
const timeHint = document.getElementById("time-hint")!;
const locationLabel = document.getElementById("location-label")!;
const useLocationButton = document.getElementById("use-location")!;
/** Label span inside the location button (text updates when GPS is on). */
const useLocationLabel = useLocationButton.querySelector<HTMLElement>(".btn__label")!;
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
/** Time shown on the slot wheel (15-minute steps). */
let pickedTime = defaultPickedTimeForDate(dateForOffsetDays(0));
/** Rounded-up time sent to GET /api/search (30-minute steps). */
let selectedTime = roundUpTo15Min(pickedTime);
/** Whether the vertical slot wheel is expanded. */
let timePickerOpen = false;
/** Distance first when GPS or fallback lat/lng is sent. */
let selectedSort: "distance" | "cost" = "distance";
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

/** Cache key so we know when to rebuild slot rows. */
let timeWheelBuiltKey = "";

/** True while we scroll the wheel from code (avoids scroll-end feedback loops). */
let timeWheelScrollFromCode = false;
let timeWheelScrollTimer: number | undefined;

/** 15-minute slots from 5:00 AM through 9:00 PM valid for the chosen date. */
function availableTimeSlots(isoDate: string): string[] {
  if (isPastEndOfDayToday(isoDate)) return [];

  const minM = timeToMinutes(minSlotTimeForDate(isoDate));
  const maxM = timeToMinutes(TIME_MAX);
  const slots: string[] = [];

  for (let m = timeToMinutes(TIME_MIN); m <= maxM; m += TIME_STEP_MINUTES) {
    if (m >= minM) slots.push(minutesToTime(m));
  }
  return slots;
}

/** Slot buttons in the wheel (empty when past end of day). */
function timeWheelItems(): HTMLButtonElement[] {
  return [...timeWheel.querySelectorAll<HTMLButtonElement>(".time-wheel__item")];
}

/** Index of the row whose center is closest to the wheel viewport center. */
function timeWheelIndexFromScroll(): number {
  const items = timeWheelItems();
  if (!items.length) return 0;

  const viewport = timeWheel.getBoundingClientRect();
  const centerY = viewport.top + viewport.height / 2;
  let bestIndex = 0;
  let bestDistance = Infinity;

  items.forEach((item, i) => {
    const row = item.getBoundingClientRect();
    const rowCenterY = row.top + row.height / 2;
    const distance = Math.abs(rowCenterY - centerY);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  });

  return bestIndex;
}

/** True when the row at index is already centered in the wheel viewport. */
function isTimeWheelRowCentered(index: number): boolean {
  const item = timeWheelItems()[index];
  if (!item) return true;

  const viewport = timeWheel.getBoundingClientRect();
  const centerY = viewport.top + viewport.height / 2;
  const row = item.getBoundingClientRect();
  const rowCenterY = row.top + row.height / 2;
  return Math.abs(rowCenterY - centerY) <= 2;
}

/** Scroll a row into the center band (reliable on iOS Safari). */
function scrollTimeWheelToIndex(index: number, smooth = true): void {
  const item = timeWheelItems()[index];
  if (!item) return;

  timeWheelScrollFromCode = true;
  item.scrollIntoView({
    block: "center",
    inline: "nearest",
    behavior: smooth ? "smooth" : "auto",
  });
  window.setTimeout(() => {
    timeWheelScrollFromCode = false;
  }, smooth ? 400 : 60);
}

/** Scroll so the chosen slot sits in the center row. */
function scrollTimeSlotIntoView(time: string, smooth = true): void {
  const slots = availableTimeSlots(selectedDate);
  const index = slots.indexOf(snapTimeToStep(time));
  if (index < 0) return;
  scrollTimeWheelToIndex(index, smooth);
}

/** After layout, center the default / current slot (open + rebuild). */
function scrollTimeSlotAfterLayout(time: string, smooth = false): void {
  const run = () => scrollTimeSlotIntoView(time, smooth);
  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}

/** After the user scrolls, snap to the nearest row and update pickedTime. */
function applyTimeFromWheelScroll(): void {
  if (timeWheelScrollFromCode) return;

  const slots = availableTimeSlots(selectedDate);
  if (!slots.length) return;

  const index = timeWheelIndexFromScroll();

  if (!isTimeWheelRowCentered(index)) {
    scrollTimeWheelToIndex(index, true);
  }

  const time = slots[index];
  if (time !== pickedTime) {
    pickedTime = time;
    selectedTime = roundUpTo15Min(pickedTime);
    syncTimePickerAndHint();
  }
  syncTimeWheelActiveState(false);
}

/** Show hint when search uses a rounded-up 15-minute time. */
function syncTimeSearchHint(): void {
  if (isPastEndOfDayToday(selectedDate)) return;

  if (isTimeRoundedForSearch()) {
    timeHint.hidden = false;
    timeHint.textContent = `Schedule search uses ${formatTime12h(selectedTime)} (rounded up from ${formatTime12h(pickedTime)}).`;
  } else {
    timeHint.hidden = true;
    timeHint.textContent = "";
  }
}

/** Update the collapsed time button label on the search screen. */
function syncTimeTriggerLabel(): void {
  timeTriggerLabel.textContent = formatTime12h(pickedTime);
}

/** Expand the 15-minute slot wheel. */
function openTimePicker(): void {
  if (timePickerOpen || isPastEndOfDayToday(selectedDate)) return;
  timePickerOpen = true;
  timePickerPopover.hidden = false;
  timePickerWrap.classList.add("time-picker-wrap--open");
  timeTrigger.setAttribute("aria-expanded", "true");
  scrollTimeSlotAfterLayout(pickedTime, false);
}

/** Collapse the slot wheel after Done or an outside tap. */
function closeTimePicker(): void {
  if (!timePickerOpen) return;
  timePickerOpen = false;
  timePickerPopover.hidden = true;
  timePickerWrap.classList.remove("time-picker-wrap--open");
  timeTrigger.setAttribute("aria-expanded", "false");
  syncTimeTriggerLabel();
  syncTimeSearchHint();
}

/** Keep hidden native input aligned with wheel pick. */
function syncTimePickerAndHint(): void {
  timePicker.min = minTimeForDate(selectedDate);
  timePicker.max = TIME_MAX;
  timePicker.step = String(TIME_STEP_MINUTES * 60);
  timePicker.value = pickedTime;
  syncTimeTriggerLabel();
  syncTimeSearchHint();
}

/** Build vertical slot rows for the current date. */
function renderTimeWheel(): void {
  const slots = availableTimeSlots(selectedDate);
  timeWheel.innerHTML = "";

  if (slots.length === 0) {
    timeWheel.setAttribute("aria-disabled", "true");
    return;
  }

  timeWheel.removeAttribute("aria-disabled");

  if (!slots.includes(pickedTime)) {
    pickedTime = slots[0];
    selectedTime = roundUpTo15Min(pickedTime);
  }

  for (const time of slots) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "time-wheel__item";
    btn.dataset.time = time;
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", String(time === pickedTime));
    if (time === pickedTime) btn.classList.add("time-wheel__item--active");
    btn.textContent = formatTime12h(time);

    btn.addEventListener("click", () => {
      const slots = availableTimeSlots(selectedDate);
      const index = slots.indexOf(time);
      if (index < 0) return;

      pickedTime = snapTimeToStep(time);
      selectedTime = roundUpTo15Min(pickedTime);
      scrollTimeWheelToIndex(index, true);
      syncTimeWheelActiveState(false);
      syncTimePickerAndHint();
    });
    timeWheel.appendChild(btn);
  }

  timeWheelBuiltKey = `${selectedDate}-${minSlotTimeForDate(selectedDate)}`;
  scrollTimeSlotAfterLayout(pickedTime, false);
}

/** Highlight the centered / selected row without rebuilding the wheel. */
function syncTimeWheelActiveState(scrollIntoView = true): void {
  const buttons = timeWheelItems();
  const index = timeWheelIndexFromScroll();
  buttons.forEach((btn, i) => {
    const isActive = btn.dataset.time === pickedTime;
    btn.classList.toggle("time-wheel__item--active", isActive);
    btn.classList.toggle("time-wheel__item--centered", i === index);
    btn.setAttribute("aria-selected", String(isActive));
  });
  if (scrollIntoView) scrollTimeSlotIntoView(pickedTime, false);
}

/** Sync wheel, trigger, hidden input, hint, and search button state. */
function syncTimeControls(): void {
  const pastEnd = isPastEndOfDayToday(selectedDate);

  if (pastEnd) {
    timePicker.value = "";
    timePicker.disabled = true;
    timeTrigger.disabled = true;
    timeWheel.innerHTML = "";
    timeWheelBuiltKey = "";
    timeWheel.setAttribute("aria-disabled", "true");
    closeTimePicker();
    timeHint.hidden = false;
    timeHint.textContent =
      "No more lap-swim times left today. Try Tomorrow or another date.";
    findButton.toggleAttribute("disabled", true);
    return;
  }

  timePicker.disabled = false;
  timeTrigger.disabled = false;
  findButton.toggleAttribute("disabled", false);

  ensurePickedTimeValid();
  syncTimeTriggerLabel();

  const wheelKey = `${selectedDate}-${minSlotTimeForDate(selectedDate)}`;
  const slots = availableTimeSlots(selectedDate);
  const needsRebuild =
    wheelKey !== timeWheelBuiltKey ||
    timeWheel.children.length !== slots.length ||
    slots.some(
      (t, i) =>
        (timeWheel.children[i] as HTMLButtonElement | undefined)?.dataset.time !==
        t
    );

  if (needsRebuild) {
    renderTimeWheel();
  } else {
    syncTimeWheelActiveState();
  }

  syncTimePickerAndHint();
}

/** Highlight Today/Tomorrow/+2 date pills when selectedDate matches one of them. */
function syncDatePillActiveState(): void {
  const buttons = datePills.querySelectorAll<HTMLButtonElement>(".date-pill");
  for (const btn of buttons) {
    const iso = btn.dataset.date;
    btn.classList.toggle("date-pill--active", iso === selectedDate);
  }
}

/** Apply a new date from pills or the date input, then refresh time bounds. */
function setSelectedDate(iso: string): void {
  selectedDate = iso;
  syncDatePickerValue();
  syncDatePillActiveState();
  syncTimeControls();
}

/** Build Today / Tomorrow / +2 day pills (soft card style in CSS). */
function renderDatePills(): void {
  const offsets = [0, 1, 2];
  datePills.innerHTML = "";

  for (const offset of offsets) {
    const iso = dateForOffsetDays(offset);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "date-pill";
    btn.dataset.date = iso;
    if (iso === selectedDate) btn.classList.add("date-pill--active");

    let label: string;
    if (offset === 0) label = "Today";
    else if (offset === 1) label = "Tomorrow";
    else label = weekdayFull(iso);

    btn.innerHTML = `<span class="date-pill__label">${label}</span>`;

    btn.addEventListener("click", () => {
      setSelectedDate(iso);
    });
    datePills.appendChild(btn);
  }
}

/** Set swim time (15-minute slot) and refresh wheel + search time. */
function setPickedTime(time: string): void {
  pickedTime = snapTimeToStep(time);
  ensurePickedTimeValid();
  syncTimeControls();
}

/** Read time from the hidden native picker (fallback). */
function setPickedTimeFromPicker(): void {
  if (!timePicker.value) return;
  setPickedTime(timePicker.value);
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

/** Update the location status line on the search screen. */
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
      return "Location unavailable — using San Diego center; pools still sorted by distance from there.";
    }
    if (err.code === err.TIMEOUT) {
      return "Location timed out — using San Diego center for now.";
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
    setLocationLabel("Pools will be sorted by distance from you");
    useLocationLabel.textContent = "Location on";
    useLocationButton.setAttribute("aria-pressed", "true");
  } catch (err) {
    locationStatus = "denied";
    userLocation = DEFAULT_USER_LOCATION;
    setLocationLabel(locationErrorMessage(err));
    useLocationLabel.textContent = "Use My Location";
    useLocationButton.setAttribute("aria-pressed", "false");
  }
}

/** Call the server kitchen and paint screen 2. */
async function runSearch(): Promise<void> {
  // Browsers only show the Allow/Deny prompt after a click (Find Open Lanes counts).
  await ensureUserLocationFromGesture();

  if (isPastEndOfDayToday(selectedDate)) {
    return;
  }

  const params = new URLSearchParams({
    date: selectedDate,
    time: selectedTime,
    sortBy: selectedSort,
    maxRadiusMiles: String(SEARCH_RADIUS_MILES),
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
    resultsList.innerHTML = `<p class="empty">No pools with lap lanes open at that time. Try another time or date.</p>`;
  } else {
    resultsList.innerHTML = data.results.map(renderResultCard).join("");
  }

  renderNoScheduleSection(data.noSchedulePools);

  const locationHint =
    locationStatus === "ready"
      ? " Sorted closest first from your location."
      : " Sorted by distance from San Diego center until you allow location.";
  resultsFooter.textContent = `Showing pools within about ${SEARCH_RADIUS_MILES} miles.${locationHint}`;
  showScreen("results");
}

// --- Wire up events ---
datePicker.addEventListener("change", () => {
  if (!datePicker.value) return;
  setSelectedDate(datePicker.value);
});

timePicker.addEventListener("change", () => {
  setPickedTimeFromPicker();
});

timePicker.addEventListener("input", () => {
  setPickedTimeFromPicker();
});

timeTrigger.addEventListener("click", () => {
  if (timePickerOpen) closeTimePicker();
  else openTimePicker();
});

timeDoneButton.addEventListener("click", () => {
  closeTimePicker();
});

document.addEventListener("pointerdown", (e) => {
  if (!timePickerOpen) return;
  const target = e.target as Node;
  if (!timePickerWrap.contains(target)) closeTimePicker();
});

timeWheel.addEventListener("scrollend", () => {
  applyTimeFromWheelScroll();
});
timeWheel.addEventListener(
  "scroll",
  () => {
    if (timeWheelScrollFromCode) return;
    syncTimeWheelActiveState(false);
    window.clearTimeout(timeWheelScrollTimer);
    timeWheelScrollTimer = window.setTimeout(() => {
      applyTimeFromWheelScroll();
    }, 120);
  },
  { passive: true }
);

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
ensurePickedTimeValid();
syncTimeTriggerLabel();
syncTimeControls();
renderSortPills();
showScreen("search");
setLocationLabel(
  "Tap either button — your browser will ask to allow location"
);
userLocation = DEFAULT_USER_LOCATION;
