/**
 * Color adjustment via Sharp modulate + linear.
 * Params: { brightness?: number, saturation?: number, hue?: number, contrast?: number }
 * All values are multipliers: 1.0 = no change, >1 = increase, <1 = decrease.
 */
import sharp from "sharp";
import type { ProcessResult } from "../types";

export async function colorAdjust(
  buffer: Buffer,
  params: Record<string, unknown>,
): Promise<ProcessResult> {
  const {
    brightness = 1,
    saturation = 1,
    hue = 0,
    contrast = 1,
  } = params as {
    brightness?: number;
    saturation?: number;
    hue?: number;
    contrast?: number;
  };

  const image = sharp(buffer);
  const metadata = await image.metadata();

  // Apply adjustments
  const result = await image
    .modulate({
      brightness: Number(brightness),
      saturation: Number(saturation),
      hue: Number(hue),
    })
    .linear(Number(contrast), -(128 * (Number(contrast) - 1)))
    .toBuffer();

  return {
    buffer: result,
    mimeType: `image/${metadata.format ?? "jpeg"}`,
    filename: `adjusted.${metadata.format ?? "jpg"}`,
    metadata: {
      brightness,
      saturation,
      hue,
      contrast,
    },
  };
}
