import type { LaneAvailabilityWindow } from "../types/index.js";
import {
  getOpenAiApiKey,
  parseLlmAvailabilityJson,
  SCHEDULE_TRANSCRIBE_SYSTEM_PROMPT,
} from "./transcribeShared.js";

/**
 * Use OpenAI to turn plain schedule text into weekly availability windows.
 * Requires OPENAI_API_KEY in the environment — never commit the key.
 */
export async function transcribeScheduleWithOpenAI(
  poolName: string,
  sourceUrl: string,
  pageText: string
): Promise<LaneAvailabilityWindow[]> {
  const apiKey = getOpenAiApiKey();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

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
        { role: "system", content: SCHEDULE_TRANSCRIBE_SYSTEM_PROMPT },
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

  return parseLlmAvailabilityJson(content);
}
