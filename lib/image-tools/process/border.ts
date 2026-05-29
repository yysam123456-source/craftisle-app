/**
 * Add border to image via Sharp extend.
 * Params: { size: number (px), color?: string (hex), side?: "all"|"top"|"bottom"|"left"|"right" }
 */
import sharp from "sharp";
import type { ProcessResult } from "../types";

export async function border(
  buffer: Buffer,
  params: Record<string, unknown>,
): Promise<ProcessResult> {
  const { size = 10, color = "#000000", side = "all" } = params as {
    size?: number;
    color?: string;
    side?: string;
  };

  const metadata = await sharp(buffer).metadata();

  const extendOptions: sharp.ExtendOptions = {
    background: color as string,
  };

  switch (side) {
    case "top":
      extendOptions.top = Number(size);
      break;
    case "bottom":
      extendOptions.bottom = Number(size);
      break;
    case "left":
      extendOptions.left = Number(size);
      break;
    case "right":
      extendOptions.right = Number(size);
      break;
    default:
      extendOptions.top = Number(size);
      extendOptions.bottom = Number(size);
      extendOptions.left = Number(size);
      extendOptions.right = Number(size);
  }

  const result = await sharp(buffer).extend(extendOptions).toBuffer();

  return {
    buffer: result,
    mimeType: `image/${metadata.format ?? "jpeg"}`,
    filename: `bordered.${metadata.format ?? "jpg"}`,
  };
}
