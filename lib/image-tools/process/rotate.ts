/**
 * Image rotation via Sharp.
 * Params: { angle: number, background?: string (hex color) }
 */
import sharp from "sharp";
import type { ProcessResult } from "../types";

export async function rotate(
  buffer: Buffer,
  params: Record<string, unknown>,
): Promise<ProcessResult> {
  const { angle = 90, background } = params as {
    angle?: number;
    background?: string;
  };

  const metadata = await sharp(buffer).metadata();

  const result = await sharp(buffer)
    .rotate(Number(angle), {
      background: background
        ? (background as string)
        : { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .toBuffer();

  return {
    buffer: result,
    mimeType: `image/${metadata.format ?? "jpeg"}`,
    filename: `rotated.${metadata.format ?? "jpg"}`,
  };
}
