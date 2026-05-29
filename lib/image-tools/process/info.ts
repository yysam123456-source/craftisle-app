/**
 * Image metadata reader — returns JSON with dimensions, format, etc.
 * Params: {}
 * Returns: JSON-only (no image buffer)
 */
import sharp from "sharp";
import type { ProcessResult } from "../types";

export async function info(
  buffer: Buffer,
  _params: Record<string, unknown>,
): Promise<ProcessResult> {
  const metadata = await sharp(buffer).metadata();
  const stats = await sharp(buffer).stats();

  const result: Record<string, unknown> = {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    space: metadata.space,
    channels: metadata.channels,
    depth: metadata.depth,
    density: metadata.density,
    hasAlpha: metadata.hasAlpha ?? false,
    hasProfile: metadata.hasProfile ?? false,
    size: metadata.size,
    dominant: stats.dominant,
  };

  // Remove undefined fields
  for (const key of Object.keys(result)) {
    if (result[key] === undefined) delete result[key];
  }

  return {
    mimeType: "application/json",
    filename: "info.json",
    metadata: result,
  };
}
