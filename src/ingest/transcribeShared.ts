import type { LaneAvailabilityWindow } from "../types/index.js";

/** Shape we ask the LLM to return (JSON object with an array). */
interface LlmSchedulePayload {
  availability?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    lanesAvailable: number;
  }>;
}

/** Shared rules for text and vision schedule transcription. */
export const SCHEDULE_TRANSCRIBE_SYSTEM_PROMPT = `You transcribe public lap-swim schedules into structured JSON for a swim pool finder app.

Rules:
- Only include times explicitly labeled as lap swim, lap lanes, lap swimming, or masters (when lanes are for lap swimming).
- Do NOT include water aerobics, swim lessons, recreation swim, or family swim unless lap lanes are clearly available.
- dayOfWeek: 0=Sunday through 6=Saturday (JavaScript convention).
- Times in 24-hour "HH:mm". endTime is exclusive (08:00 means the slot ends just before 8am).
- One printed row with a lane count = one window. Do not split one row into fragments.
- If lane count is not stated, use 1 and note uncertainty in your reasoning (but still output JSON only).
- If you cannot find a reliable lap schedule, return {"availability": []}.
- Return JSON only: {"availability": [...]}`;

/** Extra guidance when reading a PDF grid image (YMCA-style weekly columns). */
export const VISION_GRID_EXTRA_PROMPT = `

You are reading a PDF schedule grid image (often YMCA-style: days as columns, time down the left).
- Read each day column separately — never copy Monday onto Tuesday.
- Numbers in parentheses like (6) or "Lap Swim (4)" mean lanes available for lap swim in that block.
- Omit blocks with 0 lanes or no lap swim.
- When camp swim and lap swim overlap, use the lap swim lane count shown for that block.
- Transcribe every distinct lap swim block on each day with its lane count.`;

/** Read OPENAI_API_KEY from the environment — never commit the key. */
export function getOpenAiApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return apiKey;
}

/** Parse LLM JSON content into availability windows. */
export function parseLlmAvailabilityJson(
  content: string
): LaneAvailabilityWindow[] {
  const parsed = JSON.parse(content) as LlmSchedulePayload;
  const rows = parsed.availability ?? [];

  return rows.map((w) => ({
    dayOfWeek: w.dayOfWeek as LaneAvailabilityWindow["dayOfWeek"],
    startTime: w.startTime,
    endTime: w.endTime,
    lanesAvailable: w.lanesAvailable,
  }));
}
