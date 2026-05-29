/**
 * Passport photo generator.
 * Resizes + crops to standard photo sizes with optional white background padding.
 * Params: { preset: "1inch"|"2inch"|"us-visa"|"eu-passport"|"custom", width?: number, height?: number }
 */
import sharp from "sharp";
import type { ProcessResult } from "../types";

const PRESETS: Record<string, { width: number; height: number; label: string }> = {
  "1inch": { width: 295, height: 413, label: "1-inch (25×35mm)" },
  "2inch": { width: 413, height: 579, label: "2-inch (35×49mm)" },
  "us-visa": { width: 600, height: 600, label: "US Visa (51×51mm)" },
  "eu-passport": { width: 413, height: 531, label: "EU Passport (35×45mm)" },
};

export async function passportPhoto(
  buffer: Buffer,
  params: Record<string, unknown>,
): Promise<ProcessResult> {
  const { preset = "1inch", width: customW, height: customH } = params as {
    preset?: string;
    width?: number;
    height?: number;
  };

  let targetW: number;
  let targetH: number;
  let label: string;

  if (preset === "custom" && customW && customH) {
    targetW = Number(customW);
    targetH = Number(customH);
    label = `Custom (${targetW}×${targetH})`;
  } else if (PRESETS[preset]) {
    targetW = PRESETS[preset].width;
    targetH = PRESETS[preset].height;
    label = PRESETS[preset].label;
  } else {
    // Default to 1-inch
    targetW = PRESETS["1inch"].width;
    targetH = PRESETS["1inch"].height;
    label = PRESETS["1inch"].label;
  }

  const image = sharp(buffer);
  const metadata = await image.metadata();

  // Resize to cover target area, then crop center
  const result = await image
    .resize({
      width: targetW,
      height: targetH,
      fit: "cover",
      position: "center",
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 95 })
    .toBuffer();

  return {
    buffer: result,
    mimeType: "image/jpeg",
    filename: `passport-${preset}.jpg`,
    metadata: {
      preset: label,
      targetWidth: targetW,
      targetHeight: targetH,
      originalWidth: metadata.width,
      originalHeight: metadata.height,
    },
  };
}
