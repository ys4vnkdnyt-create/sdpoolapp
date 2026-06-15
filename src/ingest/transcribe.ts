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

/**
 * Use OpenAI to turn plain schedule text into weekly availability windows.
 * Requires OPENAI_API_KEY in the environment — never commit the key.
 */
export async function transcribeScheduleWithOpenAI(
  poolName: string,
  sourceUrl: string,
  pageText: string
): Promise<LaneAvailabilityWindow[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const systemPrompt = `You transcribe public lap-swim schedules into structured JSON for a swim pool finder app.

Rules:
- Only include times explicitly labeled as lap swim, lap lanes, lap swimming, or masters (when lanes are for lap swimming).
- Do NOT include water aerobics, swim lessons, recreation swim, or family swim unless lap lanes are clearly available.
- dayOfWeek: 0=Sunday through 6=Saturday (JavaScript convention).
- Times in 24-hour "HH:mm". endTime is exclusive (08:00 means the slot ends just before 8am).
- One printed row with a lane count = one window. Do not split one row into fragments.
- If lane count is not stated, use 1 and note uncertainty in your reasoning (but still output JSON only).
- If you cannot find a reliable lap schedule, return {"availability": []}.
- Return JSON only: {"availability": [...]}`;

  const userPrompt = `Pool: ${poolName}
Source URL: ${sourceUrl}

Schedule text:
${pageText}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty content");
  }

  const parsed = JSON.parse(content) as LlmSchedulePayload;
  const rows = parsed.availability ?? [];

  return rows.map((w) => ({
    dayOfWeek: w.dayOfWeek as LaneAvailabilityWindow["dayOfWeek"],
    startTime: w.startTime,
    endTime: w.endTime,
    lanesAvailable: w.lanesAvailable,
  }));
}
