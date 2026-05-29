/**
 * Image compression via Sharp quality adjustment.
 * Params: { quality: number (1-100), format?: "jpeg"|"webp"|"png"|"avif" }
 */
import sharp from "sharp";
import type { ProcessResult } from "../types";

export async function compress(
  buffer: Buffer,
  params: Record<string, unknown>,
): Promise<ProcessResult> {
  const { quality = 80, format } = params as {
    quality?: number;
    format?: string;
  };

  const image = sharp(buffer);
  const metadata = await image.metadata();
  const outputFormat = format || metadata.format || "jpeg";

  let pipeline = image;
  switch (outputFormat) {
    case "jpeg":
    case "jpg":
      pipeline = pipeline.jpeg({ quality: Number(quality) });
      break;
    case "webp":
      pipeline = pipeline.webp({ quality: Number(quality) });
      break;
    case "png":
      pipeline = pipeline.png({ quality: Number(quality) });
      break;
    case "avif":
      pipeline = pipeline.avif({ quality: Number(quality) });
      break;
    default:
      pipeline = pipeline.jpeg({ quality: Number(quality) });
  }

  const result = await pipeline.toBuffer();
  const ext = outputFormat === "jpg" ? "jpg" : outputFormat;

  return {
    buffer: result,
    mimeType: `image/${outputFormat}`,
    filename: `compressed.${ext}`,
  };
}
