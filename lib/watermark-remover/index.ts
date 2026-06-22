/**
 * Generic AI Watermark Remover — v4
 *
 * Algorithm: Local adaptive contrast detection + FMM inpainting.
 *
 * v1: synthetic alpha map — ❌ assumed uniform alpha across region
 * v2: brightness outlier + naive average — ❌ blur on complex bg
 * v3: global robust statistics + dual-criterion — ❌ fails on dark images
 *     (global mean/std dominated by image tone, early-exits on sparse masks)
 * v4: local adaptive contrast + relaxed gates ✅
 *
 * Key insight: watermarks are a LOCAL phenomenon — they differ from their
 * immediate surroundings, not from the global image average. On a dark photo,
 * the whole image is dark; what matters is that watermark pixels are brighter
 * than the pixels RIGHT NEXT TO THEM.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface PlatformConfig {
  name: string;
  displayName: string;
  searchRegion: {
    /** Fraction of image width */
    widthRatio: number;
    /** Fraction of image height */
    heightRatio: number;
    marginX: number;
    marginY: number;
  };
}

export interface ResolvedConfig {
  platform: string;
  searchX: number;
  searchY: number;
  searchW: number;
  searchH: number;
  /** Local contrast radius (px) */
  localRadius: number;
  /** Minimum local contrast to flag as watermark (0-255 scale) */
  minLocalContrast: number;
  /** Morphological dilate radius after detection */
  dilateRadius: number;
  /** Morphological erode radius (noise removal) */
  erodeRadius: number;
}

export interface RemovalResult {
  cleaned: ImageData;
  mask: Uint8ClampedArray;
  region: { x: number; y: number; w: number; h: number };
  pixelCount: number;
  confidence: number;
  passes: number;
}

// ── Platform configs ────────────────────────────────────────────────────────

const PLATFORMS: Record<string, PlatformConfig> = {
  gemini: {
    name: "gemini",
    displayName: "Gemini (Google)",
    // Gemini star logo is small, bottom-right corner
    searchRegion: { widthRatio: 0.16, heightRatio: 0.14, marginX: 12, marginY: 12 },
  },
  jimeng: {
    name: "jimeng",
    displayName: "即梦 (ByteDance)",
    // 即梦 "⭐星绪" style text watermark, bottom-right
    searchRegion: { widthRatio: 0.25, heightRatio: 0.15, marginX: 8, marginY: 8 },
  },
  doubao: {
    name: "doubao",
    displayName: "豆包 (ByteDance)",
    searchRegion: { widthRatio: 0.25, heightRatio: 0.15, marginX: 8, marginY: 8 },
  },
  tongyi: {
    name: "tongyi",
    displayName: "通义万相 (Alibaba)",
    searchRegion: { widthRatio: 0.25, heightRatio: 0.15, marginX: 8, marginY: 8 },
  },
  wenxin: {
    name: "wenxin",
    displayName: "文心一格 (Baidu)",
    searchRegion: { widthRatio: 0.25, heightRatio: 0.15, marginX: 8, marginY: 8 },
  },
  leonardo: {
    name: "leonardo",
    displayName: "Leonardo.ai",
    searchRegion: { widthRatio: 0.18, heightRatio: 0.14, marginX: 16, marginY: 16 },
  },
  auto: {
    name: "auto",
    displayName: "Auto Detect",
    // Large search region for auto-detect — cover most of bottom-right quadrant
    searchRegion: { widthRatio: 0.30, heightRatio: 0.18, marginX: 4, marginY: 4 },
  },
};

export function getPlatformNames(): string[] {
  return Object.keys(PLATFORMS);
}

export function getPlatformConfig(name: string): PlatformConfig | null {
  return PLATFORMS[name] ?? null;
}

// ── Config resolution ──────────────────────────────────────────────────────

export function resolveConfig(
  platform: string,
  width: number,
  height: number,
): ResolvedConfig {
  const cfg = PLATFORMS[platform];
  if (!cfg) return resolveConfig("auto", width, height);

  const sr = cfg.searchRegion;

  const searchW = Math.max(100, Math.min(width - 20, Math.round(width * sr.widthRatio)));
  const searchH = Math.max(60, Math.min(height - 20, Math.round(height * sr.heightRatio)));
  const searchX = width - searchW - sr.marginX;
  const searchY = height - searchH - sr.marginY;

  return {
    platform: cfg.name,
    searchX: Math.max(0, searchX),
    searchY: Math.max(0, searchY),
    searchW,
    searchH,
    localRadius: 5,        // 5px neighborhood for local contrast
    minLocalContrast: 12,  // minimum brightness difference in 0-255 space
    dilateRadius: 3,       // expand mask to cover semi-transparent edges
    erodeRadius: 2,        // remove isolated noise pixels
  };
}

// ── Core entry point ───────────────────────────────────────────────────────

export function removeWatermark(
  imageData: ImageData,
  config: ResolvedConfig,
): RemovalResult {
  const output = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height,
  );

  let totalPasses = 0;
  let combinedMask = null as Uint8ClampedArray | null;
  let bestConfidence = 0;
  const MAX_PASSES = 2;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const source = pass === 0 ? imageData : output;
    const passResult = detectAndInpaint(source, config, combinedMask);

    // v4: much more lenient gate — process even weak detections
    if (passResult.pixelCount < 5) break;

    output.data.set(passResult.cleaned.data);
    combinedMask = passResult.mask;
    totalPasses++;
    bestConfidence = Math.max(bestConfidence, passResult.confidence);
  }

  if (!combinedMask || totalPasses === 0) {
    return {
      cleaned: new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height),
      mask: new Uint8ClampedArray(config.searchW * config.searchH),
      region: { x: config.searchX, y: config.searchY, w: config.searchW, h: config.searchH },
      pixelCount: 0,
      confidence: 0,
      passes: 0,
    };
  }

  let pixelCount = 0;
  for (let i = 0; i < combinedMask.length; i++) {
    if (combinedMask[i]) pixelCount++;
  }

  return {
    cleaned: output,
    mask: combinedMask,
    region: { x: config.searchX, y: config.searchY, w: config.searchW, h: config.searchH },
    pixelCount,
    confidence: bestConfidence,
    passes: totalPasses,
  };
}

// ── Single-pass: Detect + Inpaint ─────────────────────────────────────────

interface PassResult {
  cleaned: ImageData;
  mask: Uint8ClampedArray;
  pixelCount: number;
  confidence: number;
}

function detectAndInpaint(
  source: ImageData,
  config: ResolvedConfig,
  previousMask: Uint8ClampedArray | null,
): PassResult {
  const { width, height, data } = source;
  const {
    searchX, searchY, searchW, searchH,
    localRadius, minLocalContrast, dilateRadius, erodeRadius,
  } = config;

  const sx = Math.max(0, Math.round(searchX));
  const sy = Math.max(0, Math.round(searchY));
  const ex = Math.min(width, sx + searchW);
  const ey = Math.min(height, sy + searchH);
  const rw = ex - sx;
  const rh = ey - sy;

  if (rw < 10 || rh < 10) {
    return makeEmptyResult(source, config);
  }

  // ── Step 1: Local adaptive contrast detection ──
  //
  // For each pixel, compute the mean of its neighborhood (radius R).
  // If this pixel is significantly brighter than its neighbors → watermark candidate.
  //
  // This works regardless of global image brightness because we compare
  // each pixel to its IMMEDIATE surroundings.

  const rawMask = new Uint8ClampedArray(rw * rh);
  const R = localRadius;

  // Pre-compute a box-blurred version of the luminance for efficient local means
  const lum = new Float32Array(rw * rh);       // per-pixel luminance

  for (let y = sy; y < ey; y++) {
    for (let x = sx; x < ex; x++) {
      const pi = y * width + x;
      const si = (y - sy) * rw + (x - sx);
      const r = data[pi * 4];
      const g = data[pi * 4 + 1];
      const b = data[pi * 4 + 2];
      lum[si] = 0.2126 * r + 0.7152 * g + 0.0722 * b;  // 0-255 range
    }
  }

  // Compute local mean using integral image for O(1) per pixel
  const integral = buildIntegral(lum, rw, rh);

  for (let ly = 0; ly < rh; ly++) {
    for (let lx = 0; lx < rw; lx++) {
      const si = ly * rw + lx;

      if (previousMask && previousMask[si]) continue; // already processed

      // Local mean via integral image
      const x0 = Math.max(0, lx - R);
      const y0 = Math.max(0, ly - R);
      const x1 = Math.min(rw - 1, lx + R);
      const y1 = Math.min(rh-1, ly + R);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);
      const localMean = sumRect(integral, rw, x0, y0, x1, y1) / area;

      const pixelVal = lum[si];
      const contrast = pixelVal - localMean;  // positive = brighter than neighbors

      // Watermark pixels are BRIGHTER than surroundings
      // Use a modest threshold — even faint marks should be caught
      if (contrast > minLocalContrast) {
        rawMask[si] = 255;
      }
    }
  }

  // ── Step 2: Also detect via local color-distance (catches colored watermarks) ──
  // For pixels not yet flagged by brightness, check if they have unusual hue/saturation

  const colorMask = new Uint8ClampedArray(rw * rh);
  const rIntegral = buildIntegralChannel(data, width, sx, sy, rw, rh, 0); // R channel
  const gIntegral = buildIntegralChannel(data, width, sx, sy, rw, rh, 1); // G channel
  const bIntegral = buildIntegralChannel(data, width, sx, sy, rw, rh, 2); // B channel

  for (let ly = 0; ly < rh; ly++) {
    for (let lx = 0; lx < rw; lx++) {
      const si = ly * rw + lx;
      if (rawMask[si]) continue; // already flagged by brightness
      if (previousMask && previousMask[si]) continue;

      const x0 = Math.max(0, lx - R);
      const y0 = Math.max(0, ly - R);
      const x1 = Math.min(rw-1, lx + R);
      const y1 = Math.min(rh-1, ly + R);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);

      const lr = sumRect(rIntegral, rw, x0, y0, x1, y1) / area;
      const lg = sumRect(gIntegral, rw, x0, y0, x1, y1) / area;
      const lb = sumRect(bIntegral, rw, x0, y0, x1, y1) / area;

      const pi = (sy + ly) * width + (sx + lx);
      const pr = data[pi * 4];
      const pg = data[pi * 4 + 1];
      const pb = data[pi * 4 + 2];

      // Euclidean color distance from local mean
      const colorDist = Math.sqrt(
        (pr - lr) ** 2 + (pg - lg) ** 2 + (pb - lb) ** 2
      );

      // If pixel is notably different in color AND lighter
      const brightnessDiff = (0.2126*pr + 0.7152*pg + 0.0722*pb) -
                              (0.2126*lr + 0.7152*lg + 0.0722*lb);

      if (colorDist > minLocalContrast * 1.5 && brightnessDiff > minLocalContrast * 0.5) {
        colorMask[si] = 255;
      }
    }
  }

  // Combine masks
  for (let i = 0; i < rawMask.length; i++) {
    if (colorMask[i]) rawMask[i] = 255;
  }

  // ── Step 3: Morphological cleanup ──

  const dilated = morphDilate(rawMask, rw, rh, dilateRadius);
  const eroded = morphErode(dilated, rw, rh, erodeRadius);
  const finalMask = morphDilate(eroded, rw, rh, dilateRadius);

  // Merge with previous mask
  if (previousMask) {
    for (let i = 0; i < finalMask.length; i++) {
      if (previousMask[i]) finalMask[i] = 255;
    }
  }

  // Count masked pixels
  let pixelCount = 0;
  for (let i = 0; i < finalMask.length; i++) {
    if (finalMask[i]) pixelCount++;
  }

  const density = pixelCount / (rw * rh);
  const confidence = computeConfidence(finalMask, rw, rh, density);

  // v4: very lenient gate — try inpainting even with few pixels
  if (pixelCount < 5) {
    return { cleaned: source, mask: finalMask, pixelCount: 0, confidence };
  }

  // ── Step 4: Fast Marching Method (Telea) inpainting ──
  const output = new ImageData(new Uint8ClampedArray(data), width, height);
  fmmInpaint(output.data, finalMask, sx, sy, rw, rh, width, height);

  return { cleaned: output, mask: finalMask, pixelCount, confidence };
}

function makeEmptyResult(source: ImageData, config: ResolvedConfig): PassResult {
  return {
    cleaned: source,
    mask: new Uint8ClampedArray(config.searchW * config.searchH),
    pixelCount: 0,
    confidence: 0,
  };
}

// ── Integral Image helpers ────────────────────────────────────────────────

function buildIntegral(values: Float32Array, w: number, h: number): Float32Array {
  const integral = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < w; x++) {
      rowSum += values[y * w + x];
      integral[y * w + x] = rowSum + (y > 0 ? integral[(y - 1) * w + x] : 0);
    }
  }
  return integral;
}

function buildIntegralChannel(
  data: Uint8ClampedArray, imgW: number,
  ox: number, oy: number, w: number, h: number,
  channel: number,
): Float32Array {
  const integral = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < w; x++) {
      const pixIdx = (oy + y) * imgW + (ox + x);
      rowSum += data[pixIdx * 4 + channel];
      integral[y * w + x] = rowSum + (y > 0 ? integral[(y - 1) * w + x] : 0);
    }
  }
  return integral;
}

/** Sum of values in rectangle [x0,y0] to [x1,y1] inclusive, using integral image. */
function sumRect(integral: Float32Array, w: number, x0: number, y0: number, x1: number, y1: number): number {
  const total = integral[y1 * w + x1];
  const top = y0 > 0 ? integral[(y0 - 1) * w + x1] : 0;
  const left = x0 > 0 ? integral[y1 * w + (x0 - 1)] : 0;
  const topLeft = (y0 > 0 && x0 > 0) ? integral[(y0 - 1) * w + (x0 - 1)] : 0;
  return total - top - left + topLeft;
}

// ── Fast Marching Method (Telea) Inpainting ──────────────────────────────────

function fmmInpaint(
  imgData: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  ox: number, oy: number,
  mw: number, mh: number,
  imgW: number, _imgH: number,
): void {
  const state = new Int8Array(mw * mh); // 0=unknown, 1=in-band, 2=known
  const dist = new Float32Array(mw * mh);

  for (let i = 0; i < state.length; i++) {
    state[i] = mask[i] ? 0 : 2;
    dist[i] = mask[i] ? Infinity : 0;
  }

  type Entry = { dist: number; mx: number; my: number };
  const heap: Entry[] = [];
  const inHeap = new Uint8Array(mw * mh);

  function push(e: Entry): void {
    heap.push(e);
    inHeap[e.my * mw + e.mx] = 1;
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p].dist <= heap[i].dist) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  }

  function pop(): Entry | undefined {
    if (heap.length === 0) return undefined;
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      while (true) {
        const left = i * 2 + 1;
        const right = i * 2 + 2;
        let smallest = i;
        if (left < heap.length && heap[left].dist < heap[smallest].dist) smallest = left;
        if (right < heap.length && heap[right].dist < heap[smallest].dist) smallest = right;
        if (smallest === i) break;
        [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
        i = smallest;
      }
    }
    inHeap[top.my * mw + top.mx] = 0;
    return top;
  }

  // Seed boundary pixels
  for (let my = 0; my < mh; my++) {
    for (let mx = 0; mx < mw; mx++) {
      if (state[my * mw + mx] !== 0) continue;
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]) {
        const nx = mx + dx, ny = my + dy;
        if (nx < 0 || nx >= mw || ny < 0 || ny >= mh) continue;
        if (state[ny * mw + nx] === 2) {
          state[my * mw + mx] = 1;
          dist[my * mw + mx] = 1.0;
          push({ dist: 1.0, mx, my });
          break;
        }
      }
    }
  }

  const dirs4 = [[-1,0],[1,0],[0,-1],[0,1]];

  while (true) {
    const cur = pop();
    if (!cur) break;
    const { mx, my } = cur;
    const idx = my * mw + mx;
    if (state[idx] !== 1) continue;

    const val = computeFMMValue(imgData, ox, oy, mw, mh, imgW, mx, my);
    const pixIdx = (oy + my) * imgW + (ox + mx);
    imgData[pixIdx * 4] = val.r;
    imgData[pixIdx * 4 + 1] = val.g;
    imgData[pixIdx * 4 + 2] = val.b;

    state[idx] = 2;
    mask[idx] = 0;

    for (const [dx, dy] of dirs4) {
      const nx = mx + dx, ny = my + dy;
      if (nx < 0 || nx >= mw || ny < 0 || ny >= mh) continue;
      const nidx = ny * mw + nx;
      if (state[nidx] !== 0) continue;
      const newDist = dist[idx] + 1;
      if (newDist < dist[nidx]) {
        dist[nidx] = newDist;
        state[nidx] = 1;
        push({ dist: newDist, mx: nx, my: ny });
      }
    }
  }
}

function computeFMMValue(
  imgData: Uint8ClampedArray,
  ox: number, oy: number,
  mw: number, mh: number,
  imgW: number,
  mx: number, my: number,
): { r: number; g: number; b: number } {
  const RADIUS = 10; // larger neighborhood for smoother fill
  let wr = 0, wg = 0, wb = 0, wTotal = 0;

  for (const [dx, dy] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
    for (let step = 1; step <= RADIUS; step++) {
      const qx = mx + dx * step;
      const qy = my + dy * step;
      if (qx < 0 || qx >= mw || qy < 0 || qy >= mh) continue;

      const pixQ = (oy + qy) * imgW + (ox + qx);
      const qr = imgData[pixQ * 4];
      const qg = imgData[pixQ * 4 + 1];
      const qb = imgData[pixQ * 4 + 2];

      const dirX = mx - qx;
      const dirY = my - qy;
      const distSq = dirX * dirX + dirY * dirY;
      if (distSq < 1) continue;
      const dist = Math.sqrt(distSq);

      // Inverse distance weight (simple but effective)
      const weight = 1.0 / (dist * dist);

      wr += qr * weight;
      wg += qg * weight;
      wb += qb * weight;
      wTotal += weight;
    }
  }

  if (wTotal > 0) {
    return {
      r: clamp(Math.round(wr / wTotal)),
      g: clamp(Math.round(wg / wTotal)),
      b: clamp(Math.round(wb / wTotal)),
    };
  }

  // Fallback: simple 4-neighbor average
  let sr = 0, sg = 0, sb = 0, sc = 0;
  for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const nx = mx + dx, ny = my + dy;
    if (nx < 0 || nx >= mw || ny < 0 || ny >= mh) continue;
    const pix = (oy + ny) * imgW + (ox + nx);
    sr += imgData[pix * 4];
    sg += imgData[pix * 4 + 1];
    sb += imgData[pix * 4 + 2];
    sc++;
  }
  return sc > 0
    ? { r: clamp(Math.round(sr/sc)), g: clamp(Math.round(sg/sc)), b: clamp(Math.round(sb/sc)) }
    : { r: 0, g: 0, b: 0 };
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, v));
}

// ── Morphological operations ───────────────────────────────────────────────

function morphDilate(mask: Uint8ClampedArray, w: number, h: number, radius: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let val = 0;
      for (let dy = -radius; dy <= radius && !val; dy++) {
        for (let dx = -radius; dx <= radius && !val; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            val = mask[ny * w + nx];
          }
        }
      }
      out[y * w + x] = val;
    }
  }
  return out;
}

function morphErode(mask: Uint8ClampedArray, w: number, h: number, radius: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let val = 255;
      for (let dy = -radius; dy <= radius && val; dy++) {
        for (let dx = -radius; dx <= radius && val; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            if (!mask[ny * w + nx]) val = 0;
          } else {
            val = 0;
          }
        }
      }
      out[y * w + x] = val;
    }
  }
  return out;
}

// ── Confidence scoring ────────────────────────────────────────────────────

function computeConfidence(
  mask: Uint8ClampedArray, w: number, h: number, density: number,
): number {
  if (density < 0.001 || density > 0.9) return 0;

  let connected = 0;
  const visited = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] && !visited[i]) {
      floodCount(mask, visited, w, h, i % w, Math.floor(i / w));
      connected++;
    }
  }

  const clusterScore = connected > 0 ? Math.min(1, 30 / connected) : 0;
  // v4: broader acceptable density range
  const densityScore = 1 - Math.abs(density - 0.08) * 6;
  return Math.max(0, Math.min(1, clusterScore * 0.3 + Math.max(0, densityScore) * 0.7));
}

function floodCount(
  mask: Uint8ClampedArray, visited: Uint8Array, w: number, h: number, startX: number, startY: number,
): number {
  const stack: [number, number][] = [[startX, startY]];
  let size = 0;
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    const i = y * w + x;
    if (!mask[i] || visited[i]) continue;
    visited[i] = 1;
    size++;
    stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
  }
  return size;
}

// ── Auto-detection ────────────────────────────────────────────────────────

export function autoDetectPlatform(
  imageData: ImageData,
  platforms: string[] = ["jimeng", "doubao", "gemini"],
): string {
  const { width, height } = imageData;

  let bestPlatform = "jimeng";
  let bestScore = -Infinity;

  for (const p of platforms) {
    const cfg = resolveConfig(p, width, height);
    const result = removeWatermark(imageData, cfg);
    const score = result.pixelCount * result.confidence;
    if (score > bestScore && result.passes > 0) {
      bestScore = score;
      bestPlatform = p;
    }
  }

  return bestPlatform;
}
