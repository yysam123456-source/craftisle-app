/**
 * Meme generator — overlays top and bottom text on an image.
 * Params: { topText?: string, bottomText?: string, fontSize?: number, fontColor?: string, strokeColor?: string }
 */
import sharp from "sharp";
import type { ProcessResult } from "../types";

export async function generateMeme(
  buffer: Buffer,
  params: Record<string, unknown>,
): Promise<ProcessResult> {
  const {
    topText,
    bottomText,
    fontSize = 48,
    fontColor = "#ffffff",
    strokeColor = "#000000",
  } = params as {
    topText?: string;
    bottomText?: string;
    fontSize?: number;
    fontColor?: string;
    strokeColor?: string;
  };

  if (!topText && !bottomText) {
    throw new Error("At least one of topText or bottomText is required");
  }

  const image = sharp(buffer);
  const metadata = await image.metadata();

  const imgWidth = metadata.width ?? 800;
  const imgHeight = metadata.height ?? 600;

  // Stroke text filter for meme-style outlined text
  const strokeSize = Math.max(2, Math.round(fontSize / 16));
  const svgTextFilter = `
    <filter id="stroke">
      <feMorphology in="SourceAlpha" operator="dilate" radius="${strokeSize}" result="expanded"/>
      <feFlood flood-color="${strokeColor}" result="color"/>
      <feComposite in="color" in2="expanded" operator="in" result="outline"/>
      <feComposite in="outline" in2="SourceGraphic" operator="over"/>
    </filter>`;

  const maxCharsPerLine = Math.floor(imgWidth / (fontSize * 0.55));

  const topLines = wrapText(topText ?? "", maxCharsPerLine);
  const bottomLines = wrapText(bottomText ?? "", maxCharsPerLine);

  const topSvg = topLines.length > 0
    ? topLines
        .map(
          (line, i) =>
            `<text x="50%" y="${fontSize + i * fontSize * 1.2}" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-size="${fontSize}px" fill="${fontColor}" font-weight="bold" filter="url(#stroke)">${escapeXmlForSvg(line)}</text>`,
        )
        .join("\n")
    : "";

  const bottomSvg = bottomLines.length > 0
    ? bottomLines
        .map(
          (line, i) =>
            `<text x="50%" y="${imgHeight - (bottomLines.length - 1 - i) * fontSize * 1.2 - fontSize * 0.3}" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-size="${fontSize}px" fill="${fontColor}" font-weight="bold" filter="url(#stroke)">${escapeXmlForSvg(line)}</text>`,
        )
        .join("\n")
    : "";

  const svg = `<svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">
    <defs>${svgTextFilter}</defs>
    ${topSvg}
    ${bottomSvg}
  </svg>`;

  const result = await image
    .composite([
      {
        input: Buffer.from(svg),
        top: 0,
        left: 0,
      },
    ])
    .toBuffer();

  return {
    buffer: result,
    mimeType: `image/${metadata.format ?? "jpeg"}`,
    filename: `meme.${metadata.format ?? "jpg"}`,
    metadata: {
      topText: topText || "",
      bottomText: bottomText || "",
    },
  };
}

function escapeXmlForSvg(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      // Handle long single word — force break
      if (word.length > maxChars) {
        for (let i = 0; i < word.length; i += maxChars) {
          lines.push(word.slice(i, i + maxChars));
        }
        current = "";
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}
