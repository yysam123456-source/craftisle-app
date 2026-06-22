/**
 * Zero-dependency async GIF89a encoder.
 *
 * - No external libraries, no CDN, no web workers
 * - Encodes frame-by-frame with setTimeout(0) yields → UI stays responsive, progress callbacks fire
 * - Supports transparency (index 0 = transparent)
 * - LZW compression (min code size 8)
 */

// ── Types ──
export interface GIFEncodeOptions {
  /** Frame delay in centiseconds (1 cs = 10ms) */
  delay: number;
  /** Number of times to repeat; 0 = infinite */
  repeat: number;
  /** Called after each frame with progress 0..1 */
  onProgress?: (pct: number) => void;
}

// ── Binary helpers ──
function writeBytes(buf: number[], ...vals: number[]): void {
  for (const v of vals) buf.push(v & 0xff);
}

function writeShort(buf: number[], v: number): void {
  buf.push(v & 0xff, (v >> 8) & 0xff);
}

function writeString(buf: number[], s: string): void {
  for (let i = 0; i < s.length; i++) buf.push(s.charCodeAt(i));
}

/** Sub-block: length byte + data */
function subBlock(buf: number[], data: number[]): void {
  buf.push(data.length & 0xff);
  for (const b of data) buf.push(b & 0xff);
}

// ── Color quantization (simple popularity / median-cut hybrid) ──

interface ColorNode {
  r: number; g: number; b: number; a: number;
  count: number;
}

function quantizeTo256(pixels: Uint8ClampedArray): { palette: Uint8Array; indices: Uint8Array } {
  const len = pixels.length >> 2; // number of pixels
  const colorMap = new Map<number, ColorNode>();

  // Collect unique colors
  for (let i = 0; i < len; i++) {
    const off = i << 2;
    // Round to 4-level per channel to merge similar colors
    const key =
      ((pixels[off]     & 0xfc) << 16) |
      ((pixels[off + 1] & 0xfc) << 8) |
      (pixels[off + 2]  & 0xfc) |
      ((pixels[off + 3] > 128 ? 1 : 0) << 24); // alpha threshold
    let node = colorMap.get(key);
    if (!node) {
      node = { r: 0, g: 0, b: 0, a: 0, count: 0 };
      colorMap.set(key, node);
    }
    node.r += pixels[off];
    node.g += pixels[off + 1];
    node.b += pixels[off + 2];
    node.a += pixels[off + 3];
    node.count++;
  }

  const colors = Array.from(colorMap.values());
  const totalColors = colors.length;

  // If <= 256 colors, use directly (sorted by frequency, transparent first)
  if (totalColors <= 256) {
    colors.sort((a, b) => {
      // Transparent-ish colors first (low alpha)
      const aAvgA = a.a / a.count;
      const bAvgA = b.b / b.count;
      if (aAvgA < 128 && bAvgA >= 128) return -1;
      if (aAvgA >= 128 && bAvgA < 128) return 1;
      return b.count - a.count; // most frequent first
    });
    const palette = new Uint8Array(256 * 3); // RGB only for GIF
    const indexMap = new Map<number, number>();
    for (let i = 0; i < totalColors; i++) {
      const c = colors[i];
      palette[i * 3]     = Math.round(c.r / c.count);
      palette[i * 3 + 1] = Math.round(c.g / c.count);
      palette[i * 3 + 2] = Math.round(c.b / c.count);

      // Rebuild key from averaged values
      const key =
        ((Math.round(c.r / c.count) & 0xfc) << 16) |
        ((Math.round(c.g / c.count) & 0xfc) << 8) |
        (Math.round(c.b / c.count) & 0xfc) |
        ((Math.round(c.a / c.count) > 128 ? 1 : 0) << 24);
      indexMap.set(key, i);
    }
    // Fill remaining palette slots with black
    for (let i = totalColors; i < 256; i++) {
      palette[i * 3] = 0; palette[i * 3 + 1] = 0; palette[i * 3 + 2] = 0;
    }

    // Build index array
    const indices = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      const off = i << 2;
      const key =
        ((pixels[off]     & 0xfc) << 16) |
        ((pixels[off + 1] & 0xfc) << 8) |
        (pixels[off + 2]  & 0xfc) |
        ((pixels[off + 3] > 128 ? 1 : 0) << 24);
      indices[i] = indexMap.get(key) ?? 0;
    }

    return { palette, indices };
  }

  // > 256 colors: simple box quantization (divide space into 8x8x8 grid)
  const palette = new Uint8Array(256 * 3);
  const indices = new Uint8Array(len);
  const grid = new Map<number, { r: number; g: number; b: number; count: number }>();

  for (let i = 0; i < len; i++) {
    const off = i << 2;
    const ri = Math.floor(pixels[off] / 32);       // 0..7
    const gi = Math.floor(pixels[off + 1] / 32);
    const bi = Math.floor(pixels[off + 2] / 32);
    const key = (ri << 6) | (gi << 3) | bi;
    let entry = grid.get(key);
    if (!entry) { entry = { r: 0, g: 0, b: 0, count: 0 }; grid.set(key, entry); }
    entry.r += pixels[off]; entry.g += pixels[off + 1]; entry.b += pixels[off + 2]; entry.count++;
  }

  const sortedGrid = Array.from(grid.entries()).sort((a, b) => b[1].count - a[1].count);
  const used = Math.min(256, sortedGrid.length);
  const gridIdx = new Map<number, number>();

  for (let i = 0; i < used; i++) {
    const [key, val] = sortedGrid[i];
    gridIdx.set(key, i);
    palette[i * 3]     = Math.round(val.r / val.count);
    palette[i * 3 + 1] = Math.round(val.g / val.count);
    palette[i * 3 + 2] = Math.round(val.b / val.count);
  }
  for (let i = used; i < 256; i++) { palette[i * 3] = 0; palette[i * 3 + 1] = 0; palette[i * 3 + 2] = 0; }

  for (let i = 0; i < len; i++) {
    const off = i << 2;
    const ri = Math.min(7, Math.floor(pixels[off] / 32));
    const gi = Math.min(7, Math.floor(pixels[off + 1] / 32));
    const bi = Math.min(7, Math.floor(pixels[off + 2] / 32));
    const key = (ri << 6) | (gi << 3) | bi;
    indices[i] = gridIdx.get(key) ?? 0;
  }

  return { palette, indices };
}

// ── LZW compression ──

function lzwEncode(indices: Uint8Array, minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;

  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const table = new Map<string, number>();

  // Initialize table with single-byte entries
  for (let i = 0; i < clearCode; i++) {
    table.set(String.fromCharCode(i), i);
  }

  const outputBits: number[] = [];
  let bitBuffer = 0;
  let bitsInBuffer = 0;

  function emit(code: number, codeLen: number): void {
    bitBuffer |= code << bitsInBuffer;
    bitsInBuffer += codeLen;
    while (bitsInBuffer >= 8) {
      outputBits.push(bitBuffer & 0xff);
      bitBuffer >>= 8;
      bitsInBuffer -= 8;
    }
  }

  emit(clearCode, codeSize);

  let buffer = "";
  for (let i = 0; i < indices.length; i++) {
    const ch = String.fromCharCode(indices[i]);
    const combined = buffer + ch;
    if (table.has(combined)) {
      buffer = combined;
    } else {
      emit(table.get(buffer)!, codeSize);
      if (nextCode < 4096) {
        table.set(combined, nextCode++);
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        // Table full — emit clear code and reset
        emit(clearCode, codeSize);
        codeSize = minCodeSize + 1;
        nextCode = eoiCode + 1;
        table.clear();
        for (let j = 0; j < clearCode; j++) {
          table.set(String.fromCharCode(j), j);
        }
      }
      buffer = ch;
    }
  }

  if (buffer.length > 0) {
    emit(table.get(buffer)!, codeSize);
  }

  emit(eoiCode, codeSize);

  // Flush remaining bits
  if (bitsInBuffer > 0) {
    outputBits.push(bitBuffer & 0xff);
  }

  return outputBits;
}

function packIntoSubBlocks(data: number[]): number[] {
  const result: number[] = [];
  let maxSubBlock = 255;
  for (let i = 0; i < data.length; i += maxSubBlock) {
    const chunk = data.slice(i, Math.min(i + maxSubBlock, data.length));
    result.push(chunk.length);
    for (const b of chunk) result.push(b);
  }
  result.push(0); // block terminator
  return result;
}

// ── Main encode function ──

export async function encodeGIF(
  frames: ImageData[],
  width: number,
  height: number,
  options: GIFEncodeOptions = { delay: 10, repeat: 0 },
): Promise<Blob> {

  const { delay, repeat, onProgress } = options;
  const out: number[] = [];

  // ── Header ──
  writeString(out, "GIF89a");

  // ── Logical Screen Descriptor ──
  writeShort(out, width);
  writeShort(out, height);
  // Packed byte: global color table flag=1, color resolution=1, sort=0, size of GCT=7 (256 entries)
  out.push(0xf0); // 11110000
  out.push(0x00); // background color index
  out.push(0x00); // pixel aspect ratio

  // ── Global Color Table (will be overwritten by first frame's palette) ──
  // Placeholder — filled in after first frame quantization
  const gctOffset = out.length;
  for (let i = 0; i < 256 * 3; i++) out.push(0);

  // ── Netscape Extension (looping) ──
  if (repeat !== 1) {
    out.push(0x21); // extension introducer
    out.push(0xFF); // application extension label
    writeString(out, "NETSCAPE");
    out.push(0x02); // block size
    out.push(0x03); // sub-block ID
    writeShort(out, repeat === 0 ? 0 : repeat); // loop count
    out.push(0x00); // terminator
  }

  // ── Encode frames one by one with yielding ──
  let firstPalette: Uint8Array | null = null;

  for (let f = 0; f < frames.length; f++) {
    const imgData = frames[f];

    // Quantize
    const { palette, indices } = quantizeTo256(imgData.data);

    // Update GCT with first frame's palette
    if (!firstPalette) {
      firstPalette = palette;
      for (let i = 0; i < 256 * 3; i++) out[gctOffset + i] = palette[i];
    }

    // ── Graphic Control Extension ──
    out.push(0x21); // extension introducer
    out.push(0xF9); // GCE label
    out.push(0x04); // block size
    // Packed: disposal=1 (do not dispose), user input=0, transparent color=1
    out.push(0x01); // disposal method + transparent flag
    writeShort(out, delay); // delay time
    out.push(0x00); // transparent color index (index 0)
    out.push(0x00); // terminator

    // ── Image Descriptor ──
    out.push(0x2C); // image separator
    writeShort(out, 0); // left position
    writeShort(out, 0); // top position
    writeShort(out, width); // image width
    writeShort(out, height); // image height
    // Packed: no local color table (use GCT), not interlaced, not sorted
    out.push(0x00);

    // ── LZW Compressed Image Data ──
    out.push(0x08); // minimum LZW code size
    const compressed = lzwEncode(indices, 8);
    const subBlocks = packIntoSubBlocks(compressed);
    for (const b of subBlocks) out.push(b);

    // ── Yield control back to browser every frame so UI updates ──
    if (onProgress && (f % Math.max(1, Math.floor(frames.length / 20)) === 0 || f === frames.length - 1)) {
      onProgress((f + 1) / frames.length);
      await new Promise<void>((r) => setTimeout(() => r(), 0));
    }
  }

  // ── Trailer ──
  out.push(0x3B);

  return new Blob([new Uint8Array(out)], { type: "image/gif" });
}
