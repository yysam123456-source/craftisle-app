/**
 * Color palette extraction via Sharp stats.
 * Params: { count?: number (max colors, default 5) }
 * Returns JSON metadata — not an image.
 */
import sharp from "sharp";
import type { ProcessResult } from "../types";

export async function colorPalette(
  buffer: Buffer,
  params: Record<string, unknown>,
): Promise<ProcessResult> {
  const { count = 5 } = params as { count?: number };

  const image = sharp(buffer);
  const metadata = await image.metadata();

  // Scale down for faster processing, then extract pixel data
  const { data, info } = await image
    .resize(100, 100, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Simple color quantization: bucket into predefined color ranges
  const colorMap = new Map<string, number>();
  for (let i = 0; i < data.length; i += info.channels) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = `${r},${g},${b}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  const sorted = [...colorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, Number(count))
    .map(([key, _count]) => {
      const [r, g, b] = key.split(",").map(Number);
      return { r, g, b, hex: `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}` };
    });

  return {
    // Generate a small palette preview image
    buffer: await createPalettePreview(sorted, info.width || 100),
    mimeType: "image/png",
    filename: "palette.png",
    metadata: {
      palette: sorted,
      originalWidth: metadata.width,
      originalHeight: metadata.height,
    },
  };
}

async function createPalettePreview(
  colors: { r: number; g: number; b: number }[],
  width: number,
): Promise<Buffer> {
  const barHeight = 40;
  const totalHeight = barHeight * colors.length;

  // Create raw RGBA pixel data
  const channels = 3;
  const rawData = Buffer.alloc(width * totalHeight * channels);

  for (let row = 0; row < totalHeight; row++) {
    const colorIndex = Math.floor(row / barHeight);
    const color = colors[colorIndex] || colors[0];
    for (let col = 0; col < width; col++) {
      const offset = (row * width + col) * channels;
      rawData[offset] = color.r;
      rawData[offset + 1] = color.g;
      rawData[offset + 2] = color.b;
    }
  }

  return sharp(rawData, {
    raw: { width, height: totalHeight, channels },
  })
    .png()
    .toBuffer();
}
