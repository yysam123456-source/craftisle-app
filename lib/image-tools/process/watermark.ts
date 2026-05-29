/**
 * Image watermarking via Sharp SVG text overlay.
 * Params: { text: string, position?: "bottom-right"|"bottom-left"|"top-right"|"top-left"|"center", opacity?: number, fontSize?: number, color?: string }
 */
import sharp from "sharp";
import type { ProcessResult } from "../types";

export async function watermark(
  buffer: Buffer,
  params: Record<string, unknown>,
): Promise<ProcessResult> {
  const {
    text,
    position = "bottom-right",
    opacity = 0.5,
    fontSize = 32,
    color = "#ffffff",
  } = params as {
    text?: string;
    position?: string;
    opacity?: number;
    fontSize?: number;
    color?: string;
  };

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Watermark text is required");
  }

  const image = sharp(buffer);
  const metadata = await image.metadata();

  const imgWidth = metadata.width ?? 800;
  const imgHeight = metadata.height ?? 600;

  // Calculate text dimensions (rough estimate)
  const textWidth = text.length * fontSize * 0.6;
  const textHeight = fontSize * 1.4;
  const padding = fontSize;

  // Position mapping
  const positions: Record<string, { x: number; y: number; anchor: string }> = {
    "bottom-right": { x: imgWidth - padding, y: imgHeight - padding, anchor: "end" },
    "bottom-left": { x: padding, y: imgHeight - padding, anchor: "start" },
    "top-right": { x: imgWidth - padding, y: padding + textHeight, anchor: "end" },
    "top-left": { x: padding, y: padding + textHeight, anchor: "start" },
    center: {
      x: Math.round(imgWidth / 2),
      y: Math.round(imgHeight / 2),
      anchor: "middle",
    },
  };

  const pos = positions[position] || positions["bottom-right"];

  // Build SVG watermark with the text
  const svgText = `<svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">
    <text
      x="${pos.x}"
      y="${pos.y}"
      text-anchor="${pos.anchor}"
      font-family="Arial, sans-serif"
      font-size="${fontSize}px"
      fill="${color}"
      fill-opacity="${opacity}"
      font-weight="bold"
    >${escapeXml(text)}</text>
  </svg>`;

  const result = await image
    .composite([
      {
        input: Buffer.from(svgText),
        top: 0,
        left: 0,
      },
    ])
    .toBuffer();

  return {
    buffer: result,
    mimeType: `image/${metadata.format ?? "jpeg"}`,
    filename: `watermarked.${metadata.format ?? "jpg"}`,
    metadata: {
      watermarkText: text,
      position,
    },
  };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
