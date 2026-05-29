/**
 * Image resizing via Sharp.
 * Params: { width?: number, height?: number, fit?: "cover"|"contain"|"fill"|"inside"|"outside" }
 */
import sharp from "sharp";
import type { ProcessResult } from "../types";

export async function resize(
  buffer: Buffer,
  params: Record<string, unknown>,
): Promise<ProcessResult> {
  const { width, height, fit = "inside" } = params as {
    width?: number;
    height?: number;
    fit?: string;
  };

  const image = sharp(buffer);
  const metadata = await image.metadata();

  const result = await image
    .resize({
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      fit: fit as "cover" | "contain" | "fill" | "inside" | "outside",
      withoutEnlargement: true,
    })
    .toBuffer();

  return {
    buffer: result,
    mimeType: `image/${metadata.format ?? "jpeg"}`,
    filename: `resized.${metadata.format ?? "jpg"}`,
    metadata: {
      originalWidth: metadata.width,
      originalHeight: metadata.height,
    },
  };
}
