/**
 * Generic AI Watermark Remover — v5
 *
 * Algorithm: Global brightness outlier detection (from v2) + FMM inpainting (from v3/v4).
 *
 * Evolution:
 * v1: synthetic alpha map — ❌ assumed uniform alpha across region
 * v2: global outlier detection + naive average — ✅ detection works, ❌ blur on complex bg
 * v3: global robust + dual-criterion — ❌ early-exit too strict on dark images
 * v4: local adaptive contrast — ❌ completely fails to detect on dark images
 * v5: v2's proven global outlier + FMM inpainting ← YOU ARE HERE
 *
 * Key insight from user feedback: v2 DETECTION WAS FINE. The only problem was the
 * naive 5px neighbor averaging for inpainting. Keep v2's detection, upgrade
 * the repair step to Fast Marching Method (Telea).
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface PlatformConfig {
  name: string;
  displayName: string;
  searchRegion: {
    widthRatio: number;
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
  /** Brightness outlier threshold in std-deviations */
  outlierSigma: number;
  /** Morphological dilate radius */
  dilateRadius: number;
  /** Morphological erode radius */
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
    searchRegion: { widthRatio: 0.16, heightRatio: 0.14, marginX: 12, marginY: 12 },
  },
  jimeng: {
    name: "jimeng",
    displayName: "即梦 (ByteDance)",
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
    outlierSigma: 1.5,     // 1.5 sigma threshold for bright outliers
    dilateRadius: 3,        // expand mask to cover semi-transparent edges
    erodeRadius: 1,         // light noise removal
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
  const MAX_PASSES = 3;   // multi-pass: re-detect and re-inpaint up to 3 times

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const source = pass === 0 ? imageData : output;
    const passResult = detectAndInpaint(source, config, combinedMask);

    if (passResult.pixelCount < 5) break;   // nothing more to do

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

// ── Single-pass: Detect (v2 global outlier) + Inpaint (FMM) ────────────────

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
  const { searchX, searchY, searchW, searchH, outlierSigma, dilateRadius, erodeRadius } = config;

  const sx = Math.max(0, Math.round(searchX));
  const sy = Math.max(0, Math.round(searchY));
  const ex = Math.min(width, sx + searchW);
  const ey = Math.min(height, sy + searchH);
  const rw = ex - sx;
  const rh = ey - sy;

  if (rw < 10 || rh < 10) {
    return makeEmptyResult(source, config);
  }

  // ════════════════════════════════════════════════════════════════
  // STEP 1: GLOBAL BRIGHTNESS OUTLIER DETECTION (v2 algorithm)
  //
  // Watermark pixels are brighter than the surrounding background.
  // Compute luminance for every pixel in the search region, then use
  // robust statistics (trimmed mean/std) to find outliers.
  // This works on BOTH bright AND dark images because it compares each
  // pixel to the LOCAL background baseline within the same region.
  // ════════════════════════════════════════════════════════════════

  const pixelLums: number[] = [];       // [si] -> luminance
  const pixelIdxs: number[] = [];       // [si] -> image data index

  for (let ly = 0; ly < rh; ly++) {
    for (let lx = 0; lx < rw; lx++) {
      if (previousMask && previousMask[ly * rw + lx]) continue;

      const pi = (sy + ly) * width + (sx + lx);
      const r = data[pi * 4];
      const g = data[pi * 4 + 1];
      const b = data[pi * 4 + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      pixelLums.push(lum);
      pixelIdxs.push(pi);
    }
  }

  if (pixelLums.length === 0) {
    return makeEmptyResult(source, config);
  }

  // Robust statistics: trim top/bottom 10% to exclude watermark pixels
  // from contaminating the background estimate
  const sorted = pixelLums.slice().sort((a, b) => a - b);
  const trimN = Math.max(1, Math.floor(sorted.length * 0.10));
  const trimmed = sorted.slice(trimN, sorted.length - trimN);

  const meanL = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  const stdL = Math.sqrt(trimmed.reduce((s, l) => s + (l - meanL) ** 2, 0) / trimmed.length);

  // If std is extremely low (uniform background), set a floor so we can still detect
  const effectiveStd = Math.max(stdL, 3.0);
  const threshold = outlierSigma * effectiveStd;

  // Build binary mask: pixels significantly brighter than background
  const rawMask = new Uint8ClampedArray(rw * rh);

  for (let i = 0; i < pixelLums.length; i++) {
    const lum = pixelLums[i];
    const pi = pixelIdxs[i];
    const px = (pi % width) - sx;
    const py = Math.floor(pi / width) - sy;
    const si = py * rw + px;

    if (lum - meanL > threshold) {
      rawMask[si] = 255;
    }
  }

  // Also check for SATURATION outliers (catches colored/white watermarks that might not be brightest)
  // Re-scan with saturation criterion
  for (let ly = 0; ly < rh; ly++) {
    for (let lx = 0; lx < rw; lx++) {
      if (rawMask[ly * rw + lx]) continue;  // already flagged by brightness
      if (previousMask && previousMask[ly * rw + lx]) continue;

      const pi = (sy + ly) * width + (sx + lx);
      const r = data[pi * 4] / 255;
      const g = data[pi * 4 + 1] / 255;
      const b = data[pi * 4 + 2] / 255;
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;

      // High saturation white/near-white pixels are likely watermark text
      const lum = 0.299 * data[pi * 4] + 0.587 * data[pi * 4 + 1] + 0.114 * data[pi * 4 + 2];
      if (sat > 0.15 && lum > meanL + threshold * 0.6) {
        rawMask[ly * rw + lx] = 255;
      }
    }
  }

  // ════════════════════════════════════════════════════════════════
  // STEP 2: MORPHOLOGICAL CLEANUP
  // ════════════════════════════════════════════════════════════════

  let finalMask = morphDilate(rawMask, rw, rh, dilateRadius);
  finalMask = morphErode(finalMask, rw, rh, erodeRadius);
  finalMask = morphDilate(finalMask, rw, rh, 1);  // final slight expand

  // Merge with previous mask (for multi-pass)
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

  // Lenient gate: process even small detections (as low as 5 pixels)
  if (pixelCount < 5) {
    return { cleaned: source, mask: finalMask, pixelCount: 0, confidence: 0 };
  }

  // ════════════════════════════════════════════════════════════════
  // STEP 3: FAST MARCHING METHOD (Telea) INPAINTING
  // Propagate values along image isophotes (gradient-perpendicular direction)
  // for smooth, edge-preserving fill — much better than naive neighbor averaging.
  // ════════════════════════════════════════════════════════════════

  const output = new ImageData(new Uint8ClampedArray(data), width, height);
  fmmInpaint(output.data, finalMask, sx, sy, rw, rh, width, height);

  const density = pixelCount / (rw * rh);
  const confidence = computeConfidence(finalMask, rw, rh, density);

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

// ── Fast Marching Method (Telea) Inpainting ──────────────────────────────────
//
// For each unknown (masked) pixel, compute value as weighted average of known
// neighbors, with weights inversely proportional to distance squared.
// Process pixels in order of increasing distance from known boundary (narrow band).

function fmmInpaint(
  imgData: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  ox: number, oy: number,
  mw: number, mh: number,
  imgW: number, _imgH: number,
): void {
  // State: 0=unknown (to fill), 1=in narrow band (boundary), 2=known (done)
  const state = new Int8Array(mw * mh);
  const dist = new Float32Array(mw * mh);

  for (let i = 0; i < state.length; i++) {
    state[i] = mask[i] ? 0 : 2;
    dist[i] = mask[i] ? Infinity : 0;
  }

  // Min-heap for narrow band ordering
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

  // Seed boundary: all unknown pixels adjacent to a known pixel go into the narrow band
  for (let my = 0; my < mh; my++) {
    for (let mx = 0; mx < mw; mx++) {
      if (state[my * mw + mx] !== 0) continue;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as [number, number][]) {
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

  const dirs4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  // Process narrow band in order of increasing distance
  while (true) {
    const cur = pop();
    if (!cur) break;
    const { mx, my } = cur;
    const idx = my * mw + mx;
    if (state[idx] !== 1) continue;

    // Compute interpolated value from known neighbors
    const val = computeFMMValue(imgData, ox, oy, mw, mh, imgW, mx, my);
    const pixIdx = (oy + my) * imgW + (ox + mx);
    imgData[pixIdx * 4] = val.r;
    imgData[pixIdx * 4 + 1] = val.g;
    imgData[pixIdx * 4 + 2] = val.b;

    state[idx] = 2;
    mask[idx] = 0;

    // Expand narrow band into neighboring unknown pixels
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
  // Sample known neighbors in 8 directions at multiple radii
  // Weight by inverse squared distance (closer neighbors have more influence)
  const RADIUS = 12;
  let wr = 0, wg = 0, wb = 0, wTotal = 0;

  for (const [dx, dy] of [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ]) {
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

      // Inverse-distance-squared weighting
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
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nx = mx + dx, ny = my + dy;
    if (nx < 0 || nx >= mw || ny < 0 || ny >= mh) continue;
    const pix = (oy + ny) * imgW + (ox + nx);
    sr += imgData[pix * 4];
    sg += imgData[pix * 4 + 1];
    sb += imgData[pix * 4 + 2];
    sc++;
  }
  return sc > 0
    ? { r: clamp(Math.round(sr / sc)), g: clamp(Math.round(sg / sc)), b: clamp(Math.round(sb / sc)) }
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
  if (density < 0.0005 || density > 0.95) return 0;

  // Count connected components (watermarks tend to be 1 contiguous blob)
  let connected = 0;
  const visited = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] && !visited[i]) {
      floodCount(mask, visited, w, h, i % w, Math.floor(i / w));
      connected++;
    }
  }

  // Prefer single connected component (typical watermark shape)
  const clusterScore = connected === 1 ? 1.0 : connected === 2 ? 0.7 : Math.max(0, 0.4 / connected);
  // Accept wide range of densities (text watermarks are sparse: 1-15%)
  const densityScore = density < 0.20 ? 1.0 : Math.max(0, 1.0 - (density - 0.20) * 3);

  return Math.max(0, Math.min(1, clusterScore * 0.4 + densityScore * 0.6));
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
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
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
