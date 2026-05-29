/**
 * Image cropping via Sharp extract.
 * Params: { x: number, y: number, width: number, height: number }
 */
import sharp from "sharp";
import type { ProcessResult } from "../types";

export async function crop(
  buffer: Buffer,
  params: Record<string, unknown>,
): Promise<ProcessResult> {
  const { x, y, width, height } = params as {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  const image = sharp(buffer);
  const metadata = await image.metadata();

  const result = await image
    .extract({
      left: Math.round(Number(x)),
      top: Math.round(Number(y)),
      width: Math.round(Number(width)),
      height: Math.round(Number(height)),
    })
    .toBuffer();

  return {
    buffer: result,
    mimeType: `image/${metadata.format ?? "jpeg"}`,
    filename: `cropped.${metadata.format ?? "jpg"}`,
  };
}
