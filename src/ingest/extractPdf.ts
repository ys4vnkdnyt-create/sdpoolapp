import pdf from "pdf-parse/lib/pdf-parse.js";

/** Download a PDF URL and return the raw bytes (or null on failure). */
export async function fetchPdfBuffer(url: string): Promise<Buffer | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/pdf,*/*",
        "User-Agent":
          "LapLaneFinder-Ingest/0.1 (schedule research; contact via github)",
      },
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Pull plain text from a PDF buffer (first pages only for quick validation). */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text ?? "";
}

/** True when extracted PDF text looks like a lap schedule, not policy/handbook fluff. */
export function pdfTextLooksLikeSchedule(text: string): boolean {
  const lower = text.toLowerCase();
  if (/responsible use agreement|student use agreement|\brua\b/.test(lower)) {
    return false;
  }
  if (/lap swim|lap lane|recreational swim|masters swim|open swim/.test(lower)) {
    return true;
  }
  // Time patterns like 6:00 AM or 06:00 near day names
  if (/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(lower)) {
    return /\d{1,2}:\d{2}/.test(lower);
  }
  return false;
}

/** Download a PDF and return its text when it looks schedule-related. */
export async function fetchPdfScheduleText(url: string): Promise<string | null> {
  const buf = await fetchPdfBuffer(url);
  if (!buf) return null;
  try {
    const text = await extractPdfText(buf);
    if (!pdfTextLooksLikeSchedule(text)) return null;
    return text.slice(0, 14_000);
  } catch {
    return null;
  }
}
