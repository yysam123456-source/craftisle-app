/**
 * Strip EXIF / ICC / XMP metadata from image.
 * Params: {}
 */
import sharp from "sharp";
import type { ProcessResult } from "../types";

export async function stripMetadata(
  buffer: Buffer,
  _params: Record<string, unknown>,
): Promise<ProcessResult> {
  const metadata = await sharp(buffer).metadata();

  const result = await sharp(buffer).withMetadata({}).toBuffer();

  return {
    buffer: result,
    mimeType: `image/${metadata.format ?? "jpeg"}`,
    filename: `stripped.${metadata.format ?? "jpg"}`,
    metadata: {
      stripped: true,
      originalFormat: metadata.format,
    },
  };
}
