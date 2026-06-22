/**
 * Zero-dependency async GIF89a encoder.
 *
 * Palette:  global 256-entry, built from ALL frames.
 *   index 0 = transparent (any alpha < 128).
 *   index 1-255 = top-frequency opaque-pixel RGB values.
 * Quantisation:  5-bit-per-channel LUT (32³ = 32768 entries).
 * LZW:  correct bit-packing via Uint8Array, correct code-size expansion.
 * Yields to UI every ~5% of frames via setTimeout(0).
 */

export interface GIFEncodeOptions {
  delay: number;      // centiseconds
  repeat: number;      // 0 = infinite
  onProgress?: (pct: number) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function writeShort(buf: number[], v: number): void {
  buf.push(v & 0xff, (v >> 8) & 0xff);
}

function writeStr(buf: number[], s: string): void {
  for (let i = 0; i < s.length; i++) buf.push(s.charCodeAt(i));
}

// ── 3D LUT for fast nearest-neighbour lookup ───────────────────────────

function buildPalette(
  frames: ImageData[],
): { palette: Uint8Array; lut: Uint8Array } {
  // 1. Collect opaque-pixel RGB frequencies
  const freq = new Map<number, number>();
  for (const fd of frames) {
    const d = fd.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) continue;
      const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
      freq.set(key, (freq.get(key) ?? 0) + 1);
    }
  }

  // 2. Sort by frequency desc, pick top-255 (index 0 reserved)
  const sorted = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]);
  const used = Math.min(255, sorted.length);

  const palette = new Uint8Array(256 * 3);   // index 0 = black (transparent)
  const keyToIdx = new Map<number, number>();

  for (let i = 0; i < used; i++) {
    const [key] = sorted[i];
    const idx = i + 1;
    palette[idx * 3]     = (key >> 16) & 0xff;
    palette[idx * 3 + 1] = (key >> 8)  & 0xff;
    palette[idx * 3 + 2] =  key        & 0xff;
    keyToIdx.set(key, idx);
  }

  // 3. Build 5-bit-per-channel LUT (32 levels per channel)
  const lut = new Uint8Array(32 * 32 * 32);

  // Pre-extract palette RGBs (skip index 0 = transparent)
  const pRgb: [number, number, number][] = [[0, 0, 0]];
  for (let i = 0; i < used; i++) {
    const [key] = sorted[i];
    pRgb.push([(key >> 16) & 0xff, (key >> 8) & 0xff, key & 0xff]);
  }

  for (let ri = 0; ri < 32; ri++) {
    const pr = (ri * 255 + 16) >> 5;
    for (let gi = 0; gi < 32; gi++) {
      const pg = (gi * 255 + 16) >> 5;
      for (let bi = 0; bi < 32; bi++) {
        const pb = (bi * 255 + 16) >> 5;
        let best = 1, bestD = Infinity;
        for (let j = 1; j < pRgb.length; j++) {
          const dr = pr - pRgb[j][0];
          const dg = pg - pRgb[j][1];
          const db = pb - pRgb[j][2];
          const d = dr * dr + dg * dg + db * db;
          if (d < bestD) { bestD = d; best = j; }
        }
        lut[(ri << 10) | (gi << 5) | bi] = best;
      }
    }
  }

  return { palette, lut };
}

// ── LZW Compression (correct bit-packing) ─────────────────────────────

/**
 * GIF LZW with correct variable-width codes.
 *
 * Bit packing: write bits LSB-first into Uint8Array.
 * codeSize expansion: bump when nextCode > (1 << codeSize).
 * Table reset: when nextCode > 4095, emit CLEAR, reinitialise.
 */
function lzwCompress(indices: Uint8Array, minLZW: number): number[] {
  const CLEAR = 1 << minLZW;
  const EOI   = CLEAR + 1;

  let codeSize = minLZW + 1;
  let nextCode = EOI + 1;
  const MAX_CODE = 4096;

  // Trie: each code maps to a Map<nextByte, childCode>
  // code 0..255: implicit (single byte, no trie entry needed)
  const trie: (Map<number, number> | undefined)[] = new Array(MAX_CODE);
  for (let i = 0; i < 256; i++) trie[i] = new Map<number, number>();

  // Bit-packing state
  const out: number[] = [];
  let curByte = 0, curBit = 0;

  function emit(code: number): void {
    let c = code;
    for (let i = 0; i < codeSize; i++) {
      if (c & 1) curByte |= (1 << curBit);
      c >>= 1;
      curBit++;
      if (curBit === 8) {
        out.push(curByte);
        curByte = 0;
        curBit = 0;
      }
    }
  }

  function resetTable(): void {
    // Clear ALL trie entries (root + extended)
    for (let i = 0; i < MAX_CODE; i++) {
      trie[i]?.clear();
    }
    // Re-initialize root entries (codes 0..255 = single pixels)
    for (let i = 0; i < 256; i++) {
      if (!trie[i]) trie[i] = new Map<number, number>();
    }
    codeSize = minLZW + 1;
    nextCode = EOI + 1;
  }

  emit(CLEAR);

  let w = indices[0];  // current code (starts as first pixel)

  for (let i = 1; i < indices.length; i++) {
    const px = indices[i];
    const children = trie[w];
    if (children && children.has(px)) {
      w = children.get(px)!;
    } else {
      emit(w);

      if (children && nextCode < MAX_CODE) {
        children.set(px, nextCode);
        trie[nextCode] = new Map<number, number>();
        nextCode++;
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else if (nextCode >= MAX_CODE) {
        emit(CLEAR);
        resetTable();
        // Re-initialise root entries for w and px
        trie[w] = trie[w] || new Map<number, number>();
        trie[px] = trie[px] || new Map<number, number>();
      }

      w = px;
    }
  }

  emit(w);
  emit(EOI);

  // Flush remaining bits
  if (curBit > 0) {
    out.push(curByte);
  }

  return out;
}

// ── Sub-block packing ───────────────────────────────────────────────────

function packSubBlocks(bits: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < bits.length; i += 255) {
    const end = Math.min(i + 255, bits.length);
    out.push(end - i);
    for (let j = i; j < end; j++) out.push(bits[j]);
  }
  out.push(0);   // block terminator
  return out;
}

// ── Main entry point ─────────────────────────────────────────────────────

export async function encodeGIF(
  frames: ImageData[],
  width: number,
  height: number,
  opts: GIFEncodeOptions = { delay: 10, repeat: 0 },
): Promise<Blob> {
  const { delay, repeat, onProgress } = opts;
  const out: number[] = [];

  // 1. Build global palette + LUT
  const { palette, lut } = buildPalette(frames);

  // 2. GIF Header + Logical Screen Descriptor
  writeStr(out, "GIF89a");
  writeShort(out, width);
  writeShort(out, height);
  // Packed: GCT flag=1, color res=7 (8 bits), sort=0, GCT size=7 (256 entries)
  out.push(0b1111_0111);
  out.push(0x00);   // bg color index
  out.push(0x00);   // pixel aspect ratio

  // 3. Global Color Table (768 bytes)
  for (let i = 0; i < 256 * 3; i++) out.push(palette[i]);

  // 4. Netscape Extension (looping)
  if (repeat !== 1) {
    out.push(0x21, 0xFF, 0x0B);
    writeStr(out, "NETSCAPE2.0");
    out.push(0x03, 0x01);
    writeShort(out, repeat === 0 ? 0 : repeat);
    out.push(0x00);
  }

  // 5. Encode frames
  const totalFrames = frames.length;
  const MIN_LZW = 8;

  for (let f = 0; f < totalFrames; f++) {
    const fd = frames[f];
    const px = fd.data;
    const numPx = px.length >> 2;

    // Quantise each pixel via LUT
    const indices = new Uint8Array(numPx);
    for (let i = 0; i < numPx; i++) {
      const off = i << 2;
      if (px[off + 3] < 128) {
        indices[i] = 0;   // transparent
      } else {
        const ri = px[off]     >> 3;   // 8-bit → 5-bit
        const gi = px[off + 1] >> 3;
        const bi = px[off + 2] >> 3;
        indices[i] = lut[(ri << 10) | (gi << 5) | bi];
      }
    }

    // Graphic Control Extension
    out.push(0x21, 0xF9);
    out.push(0x04);
    // disposal=2 (restore to bg), transparent=1
    // disposal=1 (do not dispose) also works for cumulative frames;
    // disposal=2 is safer for transparent-background animation.
    out.push(0x29);              // 0010_1001 = disposal=2, transparent=1
    writeShort(out, delay);     // delay in centiseconds
    out.push(0x00);           // transparent color index
    out.push(0x00);           // block terminator

    // Image Descriptor
    out.push(0x2C);
    writeShort(out, 0);        // left
    writeShort(out, 0);        // top
    writeShort(out, width);
    writeShort(out, height);
    out.push(0x00);           // no local color table

    // LZW-compressed image data
    out.push(MIN_LZW);
    const compressed = lzwCompress(indices, MIN_LZW);
    const packed = packSubBlocks(compressed);
    for (const b of packed) out.push(b);

    // Yield to UI
    if (
      onProgress &&
      (f % Math.max(1, Math.floor(totalFrames / 20)) === 0 ||
       f === totalFrames - 1)
    ) {
      onProgress((f + 1) / totalFrames);
      await new Promise<void>((r) => setTimeout(r, 0));
    }
  }

  // 6. Trailer
  out.push(0x3B);

  return new Blob([new Uint8Array(out)], { type: "image/gif" });
}
