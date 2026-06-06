/**
 * Browser front counter: screens 1 (search) and 2 (results).
 * Calls GET /api/search — kitchen logic stays on the server.
 */
import {
  initAnalytics,
  trackFavoriteToggled,
  trackScreenView,
  trackSearchSubmitted,
  triggerFeedback,
} from "./analytics.js";

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

/** Pool with schedule but no lap lanes at the requested time. */
interface UnavailablePoolJson {
  poolId: string;
  name: string;
  address: string;
  distanceMiles: number;
  estimatedDriveMinutes: number;
  guestPassCostUsd: number;
  scheduleUrl?: string;
  websiteUrl?: string;
  contactPhone?: string;
  military?: boolean;
  exclusionReason: string;
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
  unavailablePools?: UnavailablePoolJson[];
}

/** Pool cards shown before "See more" on open / unavailable lists. */
const INITIAL_VISIBLE_COUNT = 5;

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

/** Browser storage key for favorited pools (pool id + display name). */
const FAVORITES_STORAGE_KEY = "sd-lap-lane-favorites";

interface FavoriteEntry {
  poolId: string;
  name: string;
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
const screenFavorites = document.getElementById("screen-favorites")!;
const favoritesList = document.getElementById("favorites-list")!;
const favoritesHint = document.getElementById("favorites-hint")!;
const navFavoritesButton = document.getElementById("nav-favorites") as HTMLButtonElement;
const feedbackButton = document.getElementById("feedback-link") as HTMLButtonElement;
const datePills = document.getElementById("date-pills")!;
const datePicker = document.getElementById("date-picker") as HTMLInputElement;
const timePickerWrap = document.getElementById("time-picker-wrap")!;
const timeTrigger = document.getElementById("time-trigger") as HTMLButtonElement;
const timeTriggerLabel = document.getElementById("time-trigger-label")!;
const timePickerPopover = document.getElementById("time-picker-popover")!;
const timeDoneButton = document.getElementById("time-done") as HTMLButtonElement;
const timeHourPills = document.getElementById("time-hour-pills")!;
const timeNativeTrigger = document.getElementById("time-native-trigger") as HTMLButtonElement;
const timeWheel = document.getElementById("time-wheel")!;
const timePicker = document.getElementById("time-picker") as HTMLInputElement;
const timeHint = document.getElementById("time-hint")!;
const locationLabel = document.getElementById("location-label")!;
const findButton = document.getElementById("find-lanes")!;
const navSearchButton = document.getElementById("nav-search") as HTMLButtonElement;
const resultsHeader = document.getElementById("results-header")!;
const resultsList = document.getElementById("results-list")!;
const resultsSeeMore = document.getElementById("results-see-more") as HTMLButtonElement;
const favoriteUnavailableSection = document.getElementById("favorite-unavailable-section")!;
const favoriteUnavailableList = document.getElementById("favorite-unavailable-list")!;
const favoriteUnavailableSeeMore = document.getElementById(
  "favorite-unavailable-see-more"
) as HTMLButtonElement;
const unavailableSection = document.getElementById("unavailable-section")!;
const unavailableList = document.getElementById("unavailable-list")!;
const unavailableSeeMore = document.getElementById("unavailable-see-more") as HTMLButtonElement;
const noScheduleSection = document.getElementById("no-schedule-section")!;
const noScheduleToggle = document.getElementById("no-schedule-toggle") as HTMLButtonElement;
const noScheduleToggleLabel = document.getElementById("no-schedule-toggle-label")!;
const noScheduleBody = document.getElementById("no-schedule-body")!;
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
/** Where favorites are saved: local, session (Safari private), or memory. */
let favoritesStorageKind: "local" | "session" | "memory" = "memory";
/** True after the first storage probe (Safari private mode, etc.). */
let favoritesStorageProbed = false;
/** Last-resort in-memory list when Safari blocks all web storage. */
let favoritesMemoryStore: FavoriteEntry[] = [];
/** Avoid double heart toggle from touchend + click on iOS Safari. */
let lastFavoriteTapMs = 0;
/** Expanded open-lane cards beyond the first INITIAL_VISIBLE_COUNT. */
let openResultsExpanded = false;
/** Expanded "not open" cards (non-favorites). */
let unavailableExpanded = false;
/** Expanded favorite "not open" cards. */
let favoriteUnavailableExpanded = false;
/** Whether the no-schedule section body is visible. */
let noScheduleExpanded = false;
/** Full open-lane rows from the last search (for re-slicing on See more). */
let lastOpenResults: SearchResultJson[] = [];
/** Full unavailable rows for favorites / others (re-sliced on See more). */
let lastFavoriteUnavailable: UnavailablePoolJson[] = [];
let lastOtherUnavailable: UnavailablePoolJson[] = [];

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

/** Hour labels for jump pills (5 AM through 9 PM). */
function hourPillValues(): number[] {
  const startH = timeToMinutes(TIME_MIN) / 60;
  const endH = timeToMinutes(TIME_MAX) / 60;
  const hours: number[] = [];
  for (let h = startH; h <= endH; h += 1) hours.push(h);
  return hours;
}

/** Short label for an hour pill, e.g. "6a", "12p", "9p". */
function formatHourPillLabel(hour24: number): string {
  if (hour24 === 0) return "12a";
  if (hour24 < 12) return `${hour24}a`;
  if (hour24 === 12) return "12p";
  return `${hour24 - 12}p`;
}

/** Highlight the pill matching the picked hour. */
function syncHourPillActiveState(): void {
  const hour = Math.floor(timeToMinutes(pickedTime) / 60);
  timeHourPills.querySelectorAll<HTMLButtonElement>(".hour-pill").forEach((btn) => {
    btn.classList.toggle("hour-pill--active", Number(btn.dataset.hour) === hour);
  });
}

/** Build hour shortcut row above the slot wheel. */
function renderHourPills(): void {
  timeHourPills.innerHTML = "";
  for (const hour of hourPillValues()) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hour-pill";
    btn.dataset.hour = String(hour);
    btn.textContent = formatHourPillLabel(hour);
    btn.addEventListener("click", () => jumpToHour(hour));
    timeHourPills.appendChild(btn);
  }
  syncHourPillActiveState();
}

/** Jump the wheel to the first valid slot in the chosen hour. */
function jumpToHour(hour: number): void {
  const slots = availableTimeSlots(selectedDate);
  const hourStart = hour * 60;
  const first = slots.find((t) => timeToMinutes(t) >= hourStart);
  if (!first) return;

  pickedTime = first;
  selectedTime = roundUpTo15Min(pickedTime);
  const index = slots.indexOf(first);
  if (index >= 0) scrollTimeWheelToIndex(index, false);
  syncTimeWheelActiveState(false);
  syncTimePickerAndHint();
  syncHourPillActiveState();
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
    syncHourPillActiveState();
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
  renderHourPills();
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
  syncHourPillActiveState();
}

/** Read time from the hidden native picker (fallback). */
function setPickedTimeFromPicker(): void {
  if (!timePicker.value) return;
  setPickedTime(timePicker.value);
}

type AppScreen = "search" | "results" | "favorites";

/** Pool row from GET /api/pools (address for favorites list). */
interface PoolDirectoryEntryJson {
  poolId: string;
  name: string;
  address: string;
  military?: boolean;
}

/** Show home, lane results, or favorites; update bottom nav highlight. */
function showScreen(which: AppScreen): void {
  screenSearch.hidden = which !== "search";
  screenResults.hidden = which !== "results";
  screenFavorites.hidden = which !== "favorites";
  navSearchButton.classList.toggle("bottom-nav__item--active", which === "search");
  navFavoritesButton.classList.toggle(
    "bottom-nav__item--active",
    which === "favorites"
  );
  trackScreenView(which);
}

/** Load pool directory once (names + addresses for favorites cards). */
async function fetchPoolDirectory(): Promise<PoolDirectoryEntryJson[]> {
  const res = await fetch("/api/pools");
  if (!res.ok) return [];
  const data = (await res.json()) as { pools: PoolDirectoryEntryJson[] };
  return data.pools ?? [];
}

/** One saved pool card (Favorites tab and Home). */
function renderFavoriteCardHtml(
  entry: FavoriteEntry,
  meta?: PoolDirectoryEntryJson
): string {
  const address = meta?.address
    ? `<p class="favorite-card__meta">${escapeHtml(meta.address)}</p>`
    : "";
  return `
    <article class="favorite-card" data-pool-id="${escapeHtml(entry.poolId)}">
      <div class="favorite-card__row">
        <h2 class="favorite-card__name">${escapeHtml(entry.name)}</h2>
        <button type="button" class="pool-card__favorite" data-pool-id="${escapeAttr(entry.poolId)}" data-pool-name="${escapeAttr(entry.name)}" aria-label="Remove from favorites" aria-pressed="true">♥</button>
      </div>
      ${address}
      <button type="button" class="btn btn--secondary favorite-card__check" data-check-pool-id="${escapeHtml(entry.poolId)}">
        Check open lanes now
      </button>
    </article>
  `;
}

/** Draw favorite cards into any list container (shared by Home + Favorites tab). */
async function paintFavoritesList(
  container: HTMLElement,
  entries: FavoriteEntry[]
): Promise<void> {
  if (entries.length === 0) {
    container.innerHTML = "";
    return;
  }

  let directory: PoolDirectoryEntryJson[] = [];
  try {
    directory = await fetchPoolDirectory();
  } catch {
    /* show names only */
  }

  container.innerHTML = entries
    .map((entry) =>
      renderFavoriteCardHtml(
        entry,
        directory.find((p) => p.poolId === entry.poolId)
      )
    )
    .join("");
  wireFavoriteButtons(container);
}

/** Paint the favorites screen from localStorage + pantry addresses. */
async function renderFavoritesScreen(): Promise<void> {
  const entries = loadFavoriteEntries();
  if (entries.length === 0) {
    favoritesList.innerHTML = `<p class="empty">No favorites yet. Run a search, then tap ♡ on a pool to save it here.</p>`;
    return;
  }

  await paintFavoritesList(favoritesList, entries);
}

/** Open favorites tab and refresh the list. */
async function openFavoritesScreen(): Promise<void> {
  showScreen("favorites");
  if (!probeFavoritesStorage()) {
    showFavoritesStorageError();
    return;
  }
  const notice = favoritesStorageNotice();
  favoritesHint.textContent = notice ?? "Saved with ♡ on search results";
  await renderFavoritesScreen();
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

/** Parse JSON array of favorite entries. */
function parseFavoriteEntries(raw: string | null): FavoriteEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is FavoriteEntry =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as FavoriteEntry).poolId === "string" &&
        typeof (x as FavoriteEntry).name === "string"
    );
  } catch {
    return [];
  }
}

/**
 * Safari private mode can throw on setItem OR accept writes that do not persist.
 * Verify with read-back; fall back to sessionStorage, then memory.
 */
function probeStorageCandidate(storage: Storage): boolean {
  try {
    const probe = "__sd_lane_fav_probe__";
    storage.setItem(probe, "ok");
    if (storage.getItem(probe) !== "ok") return false;
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** Pick the best storage backend for this browser (runs once at load). */
function probeFavoritesStorage(): boolean {
  if (favoritesStorageProbed) return true;

  if (probeStorageCandidate(localStorage)) {
    favoritesStorageKind = "local";
  } else if (probeStorageCandidate(sessionStorage)) {
    favoritesStorageKind = "session";
  } else {
    favoritesStorageKind = "memory";
  }
  favoritesStorageProbed = true;
  return true;
}

/** Active Storage API, or null when using the in-memory fallback. */
function favoritesStorage(): Storage | null {
  if (favoritesStorageKind === "local") return localStorage;
  if (favoritesStorageKind === "session") return sessionStorage;
  return null;
}

/** Read saved favorites (localStorage, sessionStorage, or memory). */
function loadFavoriteEntries(): FavoriteEntry[] {
  probeFavoritesStorage();
  const storage = favoritesStorage();
  if (storage) {
    return parseFavoriteEntries(storage.getItem(FAVORITES_STORAGE_KEY));
  }
  return [...favoritesMemoryStore];
}

/** Persist favorites; false only when every backend fails. */
function saveFavoriteEntries(entries: FavoriteEntry[]): boolean {
  probeFavoritesStorage();
  const storage = favoritesStorage();
  if (storage) {
    try {
      storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(entries));
      if (
        storage.getItem(FAVORITES_STORAGE_KEY) !== JSON.stringify(entries)
      ) {
        favoritesStorageKind = "memory";
        favoritesMemoryStore = [...entries];
        return true;
      }
      return true;
    } catch {
      favoritesStorageKind = "memory";
    }
  }
  favoritesMemoryStore = [...entries];
  return true;
}

/** Hint when Safari private mode only allows session-scoped saves. */
function favoritesStorageNotice(): string | null {
  if (favoritesStorageKind === "session") {
    return "Favorites save for this visit only (Safari private mode). Use a normal window to keep them after refresh.";
  }
  if (favoritesStorageKind === "memory") {
    return "Favorites work until you close this tab. Turn off Private Browsing to save them longer.";
  }
  return null;
}

/** Tell the user when favorites cannot be saved. */
function showFavoritesStorageError(): void {
  const msg =
    "Could not save favorites — in Safari try a non-private window, or Settings → Safari → allow website data.";
  favoritesHint.textContent = msg;
  if (!screenFavorites.hidden) {
    favoritesList.innerHTML = `<p class="empty">${escapeHtml(msg)}</p>`;
  }
}

/** True when this pool id is already in favorites. */
function isPoolFavorite(poolId: string): boolean {
  return loadFavoriteEntries().some((e) => e.poolId === poolId);
}

/**
 * Add or remove a favorite.
 * Returns true when now favorited, false when removed, null when save failed.
 */
function togglePoolFavorite(poolId: string, name: string): boolean | null {
  let entries = loadFavoriteEntries();
  const existing = entries.findIndex((e) => e.poolId === poolId);
  if (existing >= 0) {
    entries = entries.filter((e) => e.poolId !== poolId);
    if (!saveFavoriteEntries(entries)) {
      showFavoritesStorageError();
      return null;
    }
    return false;
  }
  entries.push({ poolId, name });
  if (!saveFavoriteEntries(entries)) {
    showFavoritesStorageError();
    return null;
  }
  return true;
}

/** Escape text for HTML attribute values (data-pool-id, data-pool-name). */
function escapeAttr(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

/** Read pool id + name from a heart button (getAttribute avoids dataset quirks). */
function favoriteTapFromButton(
  btn: HTMLButtonElement
): { poolId: string; poolName: string } | null {
  const poolId = btn.getAttribute("data-pool-id");
  if (!poolId) return null;
  let poolName = btn.getAttribute("data-pool-name") ?? "";
  if (!poolName.trim()) {
    const card = btn.closest(".pool-card, .favorite-card");
    const nameEl = card?.querySelector(".pool-card__name, .favorite-card__name");
    poolName = (nameEl?.textContent ?? "").replace(/\s+\*$/, "").trim();
  }
  if (!poolName) return null;
  return { poolId, poolName };
}

/** Handle one heart tap on results or favorites list. */
function handleFavoriteHeartTap(btn: HTMLButtonElement): void {
  const ids = favoriteTapFromButton(btn);
  if (!ids) return;
  const result = togglePoolFavorite(ids.poolId, ids.poolName);
  if (result === null) return;
  trackFavoriteToggled(ids.poolId, result);
  syncFavoriteButton(btn, result);
  const notice = favoritesStorageNotice();
  if (!screenFavorites.hidden) {
    if (notice) favoritesHint.textContent = notice;
    void renderFavoritesScreen();
  }
}

/** Safari often sets event.target to the ♡ text node, not the button — use parent. */
function eventTargetElement(e: Event): Element | null {
  const t = e.target;
  if (t instanceof Element) return t;
  if (t instanceof Text) return t.parentElement;
  return null;
}

/** Attach tap handlers directly to each heart (reliable on iOS Safari). */
function wireFavoriteButtons(container: ParentNode): void {
  container.querySelectorAll<HTMLButtonElement>(".pool-card__favorite").forEach((btn) => {
    const onTap = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const now = Date.now();
      if (now - lastFavoriteTapMs < 400) return;
      lastFavoriteTapMs = now;
      handleFavoriteHeartTap(btn);
    };
    btn.addEventListener("click", onTap);
    btn.addEventListener("touchend", onTap, { passive: false });
  });
}

/** Tiny heart control beside the pool name. */
function renderFavoriteButton(poolId: string, poolName: string): string {
  const on = isPoolFavorite(poolId);
  const label = on ? "Remove from favorites" : "Add to favorites";
  const symbol = on ? "♥" : "♡";
  return `<button type="button" class="pool-card__favorite" data-pool-id="${escapeAttr(poolId)}" data-pool-name="${escapeAttr(poolName)}" aria-label="${escapeAttr(label)}" aria-pressed="${on ? "true" : "false"}">${symbol}</button>`;
}

/** Sync heart icon and aria after toggle without re-running search. */
function syncFavoriteButton(btn: HTMLButtonElement, favorited: boolean): void {
  btn.setAttribute("aria-pressed", favorited ? "true" : "false");
  btn.setAttribute(
    "aria-label",
    favorited ? "Remove from favorites" : "Add to favorites"
  );
  btn.textContent = favorited ? "♥" : "♡";
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
          <div class="pool-card__name-row">
            <h2 class="pool-card__name">${formatPoolName(r.name, r.military)}</h2>
            ${renderFavoriteButton(r.poolId, r.name)}
          </div>
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
          <div class="pool-card__name-row">
            <h2 class="pool-card__name">${formatPoolName(p.name, p.military)}</h2>
            ${renderFavoriteButton(p.poolId, p.name)}
          </div>
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

/** Card for a pool with schedule but no lanes open at search time. */
function renderUnavailableCard(p: UnavailablePoolJson): string {
  const militaryNote = renderMilitaryDescription(p.military);
  const actions = renderSearchResultActions({
    scheduleUrl: p.scheduleUrl,
    websiteUrl: p.websiteUrl,
    contactPhone: p.contactPhone,
  });

  return `
    <article class="pool-card pool-card--unavailable" data-pool-id="${p.poolId}">
      <div class="pool-card__top">
        <div>
          <div class="pool-card__name-row">
            <h2 class="pool-card__name">${formatPoolName(p.name, p.military)}</h2>
            ${renderFavoriteButton(p.poolId, p.name)}
          </div>
          <p class="pool-card__exclusion">${escapeHtml(p.exclusionReason)}</p>
          <p class="pool-card__meta">${escapeHtml(p.address)}</p>
          ${militaryNote}
        </div>
        <span class="badge badge--closed">Not open</span>
      </div>
      <div class="pool-card__stats">
        <span>◎ ${p.distanceMiles.toFixed(1)} mi</span>
        <span>⏱ ${p.estimatedDriveMinutes} min</span>
        <span>$ ${p.guestPassCostUsd} drop-in</span>
      </div>${actions}
    </article>
  `;
}

/** Reset list expansion when a new search runs. */
function resetResultsExpandState(): void {
  openResultsExpanded = false;
  unavailableExpanded = false;
  favoriteUnavailableExpanded = false;
  noScheduleExpanded = false;
  lastOpenResults = [];
  lastFavoriteUnavailable = [];
  lastOtherUnavailable = [];
}

/** Slice a list for first paint; return how many rows stay hidden. */
function sliceForDisplay<T>(
  items: T[],
  expanded: boolean,
  limit = INITIAL_VISIBLE_COUNT
): { visible: T[]; hiddenCount: number } {
  if (expanded || items.length <= limit) {
    return { visible: items, hiddenCount: 0 };
  }
  return { visible: items.slice(0, limit), hiddenCount: items.length - limit };
}

/** Show, hide, or label a See more button for a truncated list. */
function syncSeeMoreButton(
  btn: HTMLButtonElement,
  hiddenCount: number,
  noun: string
): void {
  if (hiddenCount <= 0) {
    btn.hidden = true;
    return;
  }
  btn.hidden = false;
  btn.textContent = `See ${hiddenCount} more ${noun}`;
}

/** Paint open-lane cards (first 5 until See more). */
function renderOpenResults(results: SearchResultJson[]): void {
  lastOpenResults = results;
  const { visible, hiddenCount } = sliceForDisplay(results, openResultsExpanded);

  if (results.length === 0) {
    resultsList.innerHTML = `<p class="empty">No pools with lap lanes open at that time. Try another time or date.</p>`;
    resultsSeeMore.hidden = true;
    return;
  }

  resultsList.innerHTML = visible.map(renderResultCard).join("");
  wireFavoriteButtons(resultsList);
  syncSeeMoreButton(resultsSeeMore, hiddenCount, "pools");
}

/** Reveal all open-lane cards after See more. */
function expandOpenResults(): void {
  openResultsExpanded = true;
  renderOpenResults(lastOpenResults);
}

/** Favorited pools that have schedule but aren’t open at search time. */
function renderFavoriteUnavailableSection(
  unavailable: UnavailablePoolJson[] | undefined
): void {
  const favoriteIds = new Set(loadFavoriteEntries().map((e) => e.poolId));
  const rows = (unavailable ?? []).filter((p) => favoriteIds.has(p.poolId));
  lastFavoriteUnavailable = rows;

  if (rows.length === 0) {
    favoriteUnavailableSection.hidden = true;
    favoriteUnavailableList.innerHTML = "";
    favoriteUnavailableSeeMore.hidden = true;
    return;
  }

  const { visible, hiddenCount } = sliceForDisplay(
    rows,
    favoriteUnavailableExpanded
  );

  favoriteUnavailableSection.hidden = false;
  favoriteUnavailableList.innerHTML = visible.map(renderUnavailableCard).join("");
  wireFavoriteButtons(favoriteUnavailableList);
  syncSeeMoreButton(favoriteUnavailableSeeMore, hiddenCount, "favorites");
}

/** Re-render favorite-unavailable cards from cached rows. */
function expandFavoriteUnavailableResults(): void {
  favoriteUnavailableExpanded = true;
  const { visible, hiddenCount } = sliceForDisplay(
    lastFavoriteUnavailable,
    true
  );
  favoriteUnavailableList.innerHTML = visible.map(renderUnavailableCard).join("");
  wireFavoriteButtons(favoriteUnavailableList);
  syncSeeMoreButton(favoriteUnavailableSeeMore, hiddenCount, "favorites");
}

/** Re-render other-unavailable cards from cached rows. */
function expandOtherUnavailableResults(): void {
  unavailableExpanded = true;
  const { visible, hiddenCount } = sliceForDisplay(lastOtherUnavailable, true);
  unavailableList.innerHTML = visible.map(renderUnavailableCard).join("");
  wireFavoriteButtons(unavailableList);
  syncSeeMoreButton(unavailableSeeMore, hiddenCount, "pools");
}

/** Other in-radius pools not open at search time. */
function renderOtherUnavailableSection(
  unavailable: UnavailablePoolJson[] | undefined
): void {
  const favoriteIds = new Set(loadFavoriteEntries().map((e) => e.poolId));
  const rows = (unavailable ?? []).filter((p) => !favoriteIds.has(p.poolId));
  lastOtherUnavailable = rows;

  if (rows.length === 0) {
    unavailableSection.hidden = true;
    unavailableList.innerHTML = "";
    unavailableSeeMore.hidden = true;
    return;
  }

  const { visible, hiddenCount } = sliceForDisplay(rows, unavailableExpanded);

  unavailableSection.hidden = false;
  unavailableList.innerHTML = visible.map(renderUnavailableCard).join("");
  wireFavoriteButtons(unavailableList);
  syncSeeMoreButton(unavailableSeeMore, hiddenCount, "pools");
}

/** Sync no-schedule collapse toggle and optional pool count in the title. */
function syncNoScheduleCollapse(poolCount: number): void {
  noScheduleToggle.setAttribute("aria-expanded", noScheduleExpanded ? "true" : "false");
  noScheduleBody.hidden = !noScheduleExpanded;
  noScheduleToggleLabel.textContent = noScheduleExpanded ? "Hide" : "Show";
  const title = noScheduleSection.querySelector(".no-schedule-section__title");
  if (title) {
    title.textContent =
      poolCount > 0
        ? `Nearby — schedule not in app yet (${poolCount})`
        : "Nearby — schedule not in app yet";
  }
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
  wireFavoriteButtons(noScheduleList);
  syncNoScheduleCollapse(rows.length);
}

/** Expand or collapse the no-schedule section body. */
function toggleNoScheduleSection(): void {
  noScheduleExpanded = !noScheduleExpanded;
  syncNoScheduleCollapse(noScheduleList.querySelectorAll(".pool-card").length);
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

/** Browsers only expose GPS on https or localhost — not on http://192.168.x.x. */
function geolocationAvailable(): boolean {
  return window.isSecureContext && typeof navigator.geolocation !== "undefined";
}

/** Hint before first search — explains http:// LAN limitation on phones. */
function defaultLocationHint(): string {
  if (!window.isSecureContext) {
    return "This link is not https, so your phone can’t use GPS — search still works, sorted from downtown San Diego.";
  }
  return "Tap Find Open Lanes — we’ll ask for your location to sort by distance";
}

/** Ask the browser for GPS (must run after a tap — browsers block silent requests). */
function requestUserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!geolocationAvailable()) {
      reject(new Error("insecure"));
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
  if (err instanceof Error && err.message === "insecure") {
    return "GPS needs https — using downtown San Diego. See MOBILE.md for tunnel or Render.";
  }
  if (err instanceof GeolocationPositionError) {
    if (err.code === err.PERMISSION_DENIED) {
      if (!window.isSecureContext) {
        return "GPS needs https on your phone — using downtown San Diego. Try a tunnel or Render link.";
      }
      return "Location denied — showing pools sorted from San Diego center.";
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

/** Request GPS after Find Open Lanes tap (required by Chrome/Safari). */
async function ensureUserLocationFromGesture(): Promise<void> {
  if (locationStatus === "ready" && userLocation) return;
  // After deny/unsupported, keep SD center — don’t re-prompt every search.
  if (locationStatus === "denied" || locationStatus === "unsupported") {
    userLocation = DEFAULT_USER_LOCATION;
    return;
  }

  if (!geolocationAvailable()) {
    locationStatus = "unsupported";
    userLocation = DEFAULT_USER_LOCATION;
    setLocationLabel(locationErrorMessage(new Error("insecure")));
    return;
  }

  try {
    userLocation = await requestUserLocation();
    locationStatus = "ready";
    setLocationLabel("Sorted by distance from you");
  } catch (err) {
    locationStatus =
      err instanceof Error &&
      (err.message === "unsupported" || err.message === "insecure")
        ? "unsupported"
        : "denied";
    userLocation = DEFAULT_USER_LOCATION;
    setLocationLabel(locationErrorMessage(err));
  }
}

/** Call the server kitchen and paint screen 2. */
async function runSearch(): Promise<void> {
  findButton.setAttribute("disabled", "true");
  if (locationStatus === "pending") {
    setLocationLabel("Getting your location…");
  }
  // Browsers only show the Allow/Deny prompt after a tap on Find Open Lanes.
  await ensureUserLocationFromGesture();
  findButton.removeAttribute("disabled");

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
    resultsSeeMore.hidden = true;
    favoriteUnavailableSection.hidden = true;
    favoriteUnavailableSeeMore.hidden = true;
    unavailableSection.hidden = true;
    unavailableSeeMore.hidden = true;
    noScheduleSection.hidden = true;
    showScreen("results");
    return;
  }

  const data = (await res.json()) as SearchResponse;
  resetResultsExpandState();
  trackSearchSubmitted({
    date: data.query.date,
    time: data.query.time,
    sort_by: data.query.sortBy ?? selectedSort,
    results_count: data.results.length,
  });
  resultsHeader.textContent = formatResultsHeader(
    data.query.date,
    data.query.time
  );

  renderOpenResults(data.results);

  renderNoScheduleSection(data.noSchedulePools);
  renderFavoriteUnavailableSection(data.unavailablePools);
  renderOtherUnavailableSection(data.unavailablePools);

  const locationHint =
    locationStatus === "ready"
      ? " Sorted closest first from your location."
      : " Sorted by distance from San Diego center.";
  resultsFooter.textContent = `Showing pools within about ${SEARCH_RADIUS_MILES} miles.${locationHint}`;
  showScreen("results");
}

/** From Favorites: use today + next slot, then search and show results in one tap. */
async function checkFavoritePoolNow(): Promise<void> {
  selectedDate = dateForOffsetDays(0);
  pickedTime = defaultPickedTimeForDate(selectedDate);
  selectedTime = roundUpTo15Min(pickedTime);
  syncDatePickerValue();
  syncDatePillActiveState();
  syncTimeControls();
  closeTimePicker();
  await runSearch();
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

timeNativeTrigger.addEventListener("click", () => {
  timePicker.removeAttribute("aria-hidden");
  if (typeof timePicker.showPicker === "function") {
    timePicker.showPicker();
  } else {
    timePicker.click();
  }
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

findButton.addEventListener("click", () => void runSearch());
navSearchButton.addEventListener("click", () => showScreen("search"));
navFavoritesButton.addEventListener("click", () => void openFavoritesScreen());

/** Favorites lists: check-lanes button (hearts wired when cards are painted). */
function onFavoriteListAction(e: Event): void {
  const el = eventTargetElement(e);
  if (!el) return;
  if (el.closest(".pool-card__favorite")) return;
  const check = el.closest<HTMLButtonElement>("[data-check-pool-id]");
  if (check?.dataset.checkPoolId) {
    e.preventDefault();
    void checkFavoritePoolNow();
  }
}

screenFavorites.addEventListener("click", onFavoriteListAction);
screenFavorites.addEventListener("touchend", onFavoriteListAction, {
  passive: false,
});

sortPills.addEventListener("click", (e) => {
  const btn = eventTargetElement(e)?.closest<HTMLButtonElement>("[data-sort]");
  if (!btn?.dataset.sort) return;
  selectedSort = btn.dataset.sort as "distance" | "cost";
  renderSortPills();
  void runSearch();
});

resultsSeeMore.addEventListener("click", () => expandOpenResults());
unavailableSeeMore.addEventListener("click", () => expandOtherUnavailableResults());
favoriteUnavailableSeeMore.addEventListener("click", () =>
  expandFavoriteUnavailableResults()
);
noScheduleToggle.addEventListener("click", () => toggleNoScheduleSection());

/** Wire UI and run first paint after PostHog init (no-op when POSTHOG_KEY unset). */
function bootApp(): void {
  initAnalytics();

  probeFavoritesStorage();
  initDatePickerMin();
  renderDatePills();
  syncDatePickerValue();
  ensurePickedTimeValid();
  syncTimeTriggerLabel();
  syncTimeControls();
  renderSortPills();
  showScreen("search");
  setLocationLabel(defaultLocationHint());
  userLocation = DEFAULT_USER_LOCATION;

  feedbackButton.addEventListener("click", () => triggerFeedback());
}

bootApp();
