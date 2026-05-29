/**
 * Format conversion via Sharp.
 * Params: { format: "jpeg"|"png"|"webp"|"avif"|"tiff"|"gif" }
 */
import sharp from "sharp";
import type { ProcessResult } from "../types";

export async function convert(
  buffer: Buffer,
  params: Record<string, unknown>,
): Promise<ProcessResult> {
  const { format } = params as { format: string };

  const outputFormat = format || "jpeg";
  const originalMeta = await sharp(buffer).metadata();

  const result = await sharp(buffer)
    .toFormat(outputFormat as keyof sharp.FormatEnum)
    .toBuffer();

  const ext = outputFormat === "jpeg" ? "jpg" : outputFormat;

  return {
    buffer: result,
    mimeType: `image/${outputFormat}`,
    filename: `converted.${ext}`,
    metadata: {
      originalFormat: originalMeta.format,
      convertedTo: outputFormat,
    },
  };
}
