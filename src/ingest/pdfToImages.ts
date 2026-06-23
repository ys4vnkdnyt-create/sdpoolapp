import { pdf } from "pdf-to-img";

/**
 * Render PDF pages to PNG buffers for vision transcription.
 * scale 2 keeps YMCA grid text readable without huge payloads.
 */
export async function pdfBufferToPngImages(
  buffer: Buffer,
  maxPages = 2
): Promise<Buffer[]> {
  const images: Buffer[] = [];
  const doc = await pdf(buffer, { scale: 2 });

  for await (const page of doc) {
    images.push(page);
    if (images.length >= maxPages) break;
  }

  return images;
}
