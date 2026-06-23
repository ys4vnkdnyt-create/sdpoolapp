import type { LaneAvailabilityWindow } from "../types/index.js";
import {
  getOpenAiApiKey,
  parseLlmAvailabilityJson,
  SCHEDULE_TRANSCRIBE_SYSTEM_PROMPT,
  VISION_GRID_EXTRA_PROMPT,
} from "./transcribeShared.js";

/**
 * Use OpenAI vision to transcribe a lap schedule from PDF page images.
 * Requires OPENAI_API_KEY — use gpt-4o (or OPENAI_VISION_MODEL) for grid PDFs.
 */
export async function transcribeScheduleFromPdfImages(
  poolName: string,
  sourceUrl: string,
  pngPages: Buffer[]
): Promise<LaneAvailabilityWindow[]> {
  if (pngPages.length === 0) {
    throw new Error("No PDF page images to transcribe");
  }

  const apiKey = getOpenAiApiKey();
  const model =
    process.env.OPENAI_VISION_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o";

  const systemPrompt =
    SCHEDULE_TRANSCRIBE_SYSTEM_PROMPT + VISION_GRID_EXTRA_PROMPT;

  const userText = `Pool: ${poolName}
Source URL: ${sourceUrl}

Transcribe all lap swim availability from the attached schedule PDF page(s).`;

  const imageParts = pngPages.map((page) => ({
    type: "image_url" as const,
    image_url: {
      url: `data:image/png;base64,${page.toString("base64")}`,
      detail: "high" as const,
    },
  }));

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
        {
          role: "user",
          content: [{ type: "text", text: userText }, ...imageParts],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI vision API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI vision returned empty content");
  }

  return parseLlmAvailabilityJson(content);
}
