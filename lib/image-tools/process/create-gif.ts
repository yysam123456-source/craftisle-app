/**
 * Animated GIF creator — composes multiple frames into a single animated GIF.
 * Requires gif-encoder-2 (pure JS, no native deps).
 *
 * Params: { frameDelay?: number } — delay between frames in ms (default 500)
 *
 * WARNING: Vercel free tier has a 4.5 MB body limit.
 * Example: 5 PNG frames @ 500KB each = 2.5MB raw → ~1.5MB GIF output.
 * Keep frames ≤400×400px and ≤8 frames for reliable results.
 */
// @ts-ignore — gif-encoder-2 has no types
import GIFEncoder from "gif-encoder-2";
import sharp from "sharp";
import type { ProcessResult } from "../types";

/** Maximum total input size (bytes) — Vercel free tier is 4.5MB, we cap at 4MB */
const MAX_TOTAL_INPUT_SIZE = 4 * 1024 * 1024;

/** Maximum output GIF dimension */
const MAX_GIFFRAME_SIZE = 480;

export async function createGif(
  buffers: Buffer[],
  params: Record<string, unknown>,
): Promise<ProcessResult> {
  const frameDelay = (params.frameDelay as number) ?? 500;

  if (buffers.length === 0) {
    throw new Error("No frames provided");
  }

  if (buffers.length === 1) {
    // Single frame — just return it as-is
    const meta = await sharp(buffers[0]).metadata();
    return {
      buffer: buffers[0],
      mimeType: `image/${meta.format ?? "png"}`,
      filename: "single-frame.gif",
      metadata: { frameCount: 1, note: "Single frame — not animated" },
    };
  }

  // Total input size check
  const totalSize = buffers.reduce((sum, b) => sum + b.length, 0);
  if (totalSize > MAX_TOTAL_INPUT_SIZE) {
    const sizeMB = (totalSize / 1024 / 1024).toFixed(1);
    throw new Error(
      `Total input size (${sizeMB} MB) exceeds Vercel free tier limit (4 MB). ` +
        `Reduce frame count or use smaller images. Recommended: ≤${Math.floor(MAX_TOTAL_INPUT_SIZE / buffers.length / 1024)}KB per frame.`,
    );
  }

  // Process each frame: resize to consistent dimensions, convert to RGBA raw pixels
  const frameData: { data: Buffer; width: number; height: number }[] = [];

  for (const buf of buffers) {
    const image = sharp(buf);
    const meta = await image.metadata();

    let w = meta.width ?? 400;
    let h = meta.height ?? 400;

    // Scale down if too large
    if (w > MAX_GIFFRAME_SIZE || h > MAX_GIFFRAME_SIZE) {
      const scale = MAX_GIFFRAME_SIZE / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const { data, info } = await image
      .resize(w, h, { fit: "fill" })
      .removeAlpha()
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    frameData.push({ data, width: info.width, height: info.height });
  }

  // All frames must have the same dimensions
  const refW = frameData[0].width;
  const refH = frameData[0].height;

  // Create GIF encoder
  const encoder = new GIFEncoder(refW, refH, "neuquant", true);
  encoder.start();
  encoder.setDelay(frameDelay);
  encoder.setQuality(10); // 1-30, lower = smaller file
  encoder.setRepeat(0); // 0 = loop forever

  for (const frame of frameData) {
    // Resize to match reference dimensions if needed
    if (frame.width !== refW || frame.height !== refH) {
      const resized = await sharp(frame.data, {
        raw: { width: frame.width, height: frame.height, channels: 4 },
      })
        .resize(refW, refH, { fit: "fill" })
        .removeAlpha()
        .ensureAlpha()
        .raw()
        .toBuffer();
      encoder.addFrame(resized as unknown as Uint8Array);
    } else {
      encoder.addFrame(frame.data as unknown as Uint8Array);
    }
  }

  encoder.finish();
  const gifBuffer = encoder.out.getData() as Buffer;

  return {
    buffer: gifBuffer,
    mimeType: "image/gif",
    filename: "animated.gif",
    metadata: {
      frameCount: buffers.length,
      delay: frameDelay,
      width: refW,
      height: refH,
      outputSize: gifBuffer.length,
      outputSizeKB: Math.round(gifBuffer.length / 1024),
    },
  };
}
