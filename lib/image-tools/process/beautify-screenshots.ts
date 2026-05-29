/**
 * Screenshot beautifier — adds padding, shadow, rounded corners, and border.
 * Params: { padding?: number, borderRadius?: number, shadow?: boolean, shadowOffset?: number, border?: boolean, borderColor?: string, borderWidth?: number, bgColor?: string }
 */
import sharp from "sharp";
import type { ProcessResult } from "../types";

export async function beautifyScreenshots(
  buffer: Buffer,
  params: Record<string, unknown>,
): Promise<ProcessResult> {
  const {
    padding = 40,
    borderRadius = 12,
    shadow = true,
    shadowOffset = 8,
    border = true,
    borderColor = "#e5e7eb",
    borderWidth = 1,
    bgColor = "#ffffff",
    shadowBlur = 20,
    shadowOpacity = 0.15,
  } = params as {
    padding?: number;
    borderRadius?: number;
    shadow?: boolean;
    shadowOffset?: number;
    border?: boolean;
    borderColor?: string;
    borderWidth?: number;
    bgColor?: string;
    shadowBlur?: number;
    shadowOpacity?: number;
  };

  const image = sharp(buffer);
  const metadata = await image.metadata();

  const imgW = metadata.width ?? 800;
  const imgH = metadata.height ?? 600;
  const pad = Math.round(Number(padding));
  const radius = Math.round(Number(borderRadius));
  const blur = Math.round(Number(shadowBlur));
  const sOffset = Math.round(Number(shadowOffset));
  const bWidth = Math.round(Number(borderWidth));

  const canvasW = imgW + pad * 2 + (shadow ? sOffset + blur : 0);
  const canvasH = imgH + pad * 2 + (shadow ? sOffset + blur : 0);

  // Parse bgColor
  const { r: bgR, g: bgG, b: bgB } = parseHexColor(bgColor);

  // 1. Create shadow layer if enabled (blurred dark rectangle)
  if (shadow) {
    // Create a rounded rectangle as shadow
    const shadowSvg = `<svg width="${canvasW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="blur">
          <feGaussianBlur stdDeviation="${Math.max(1, blur / 3)}"/>
        </filter>
      </defs>
      <rect
        x="${sOffset + blur * 0.3}"
        y="${sOffset + blur * 0.3}"
        width="${imgW + pad * 2}"
        height="${imgH + pad * 2}"
        rx="${radius}"
        ry="${radius}"
        fill="rgba(0,0,0,${shadowOpacity})"
        filter="url(#blur)"
      />
    </svg>`;

    const shadowBuf = await sharp({
      create: {
        width: canvasW,
        height: canvasH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .composite([{ input: Buffer.from(shadowSvg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    // 2. Draw the screenshot with rounded corners
    const maskSvg = roundedRectSvg(imgW + pad * 2, imgH + pad * 2, radius);
    const screenshotLayer = await sharp(buffer)
      .resize(imgW, imgH, { fit: "fill" })
      .extend({
        top: pad,
        bottom: pad,
        left: pad,
        right: pad,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toBuffer();

    // 3. Composite: background → shadow → screenshot
    const result = await sharp({
      create: {
        width: canvasW,
        height: canvasH,
        channels: 4,
        background: { r: bgR, g: bgG, b: bgB, alpha: 1 },
      },
    })
      .png()
      .composite([
        { input: shadowBuf, top: 0, left: 0 },
        {
          input: screenshotLayer,
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer();

    return {
      buffer: result,
      mimeType: "image/png",
      filename: "beautified-screenshot.png",
      metadata: {
        originalWidth: imgW,
        originalHeight: imgH,
        canvasWidth: canvasW,
        canvasHeight: canvasH,
        padding: pad,
        borderRadius: radius,
        shadow: true,
        border,
      },
    };
  }

  // No shadow — simpler path
  const result = await image
    .resize(imgW, imgH, { fit: "fill" })
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: bgR, g: bgG, b: bgB, alpha: 1 },
    })
    .png()
    .toBuffer();

  return {
    buffer: result,
    mimeType: "image/png",
    filename: "beautified-screenshot.png",
    metadata: {
      originalWidth: imgW,
      originalHeight: imgH,
      padding: pad,
      borderRadius: radius,
      shadow: false,
      border,
    },
  };
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function roundedRectSvg(w: number, h: number, r: number): string {
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="white"/>
  </svg>`;
}
