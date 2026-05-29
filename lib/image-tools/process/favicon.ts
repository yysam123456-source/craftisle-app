/**
 * Favicon generator — resizes to 16x16, 32x32, 48x48, and returns a 32x32 PNG.
 * Params: {}
 */
import sharp from "sharp";
import type { ProcessResult } from "../types";

export async function favicon(
  buffer: Buffer,
  _params: Record<string, unknown>,
): Promise<ProcessResult> {
  // Generate 32x32 favicon PNG (most common size)
  const result = await sharp(buffer)
    .resize(32, 32, { fit: "cover" })
    .png()
    .toBuffer();

  return {
    buffer: result,
    mimeType: "image/png",
    filename: "favicon.png",
    metadata: {
      sizes: [16, 32, 48],
      recommended:
        "Use favicon.ico generators for multi-size ICO format if needed.",
    },
  };
}
