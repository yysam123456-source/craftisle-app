/**
 * Generic AI Watermark Remover — v7
 *
 * ROOT CAUSE FIX: v3-v6 all broke because they changed the proven v2 detection.
 * v2 worked because it searched bottom-right of FULL IMAGE using simple brightness
 * average with robust statistics and a minBrightnessDelta safety floor.
 *
 * v7 = v2's exact detection algorithm + FMM (Telea) inpainting for better repair quality.
 *
 * Algorithm:
 *   1. Search bottom-right corner of IMAGE (not "content region" — that was the bug!)
 *   2. Simple brightness average (R+G+B)/3 — not ITU-R luminance
 *   3. Robust mean (exclude |diff|>60 outliers) + stdDev
 *   4. Threshold = max(minBrightnessDelta, sigma*stdDev)
 *   5. Morphological cleanup (dilate/erode/dilate)
 *   6. FMM (Telea) inpainting for edge-preserving repair
 *   7. Multi-pass up to 3 iterations
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface PlatformConfig {
  name: string;
  displayName: string;
  /** Search region in bottom-right corner of the FULL image */
  searchRegion: {
    widthRatio: number; // fraction of image width to search
    heightRatio: number; // fraction of image height to search
    marginX: number;     // px from right edge
    marginY: number;     // px from bottom edge
  };
  /** Detection tuning parameters */
  characteristics: {
    /** Is watermark typically lighter or darker than background? */
    lighter: boolean;
    /** Minimum absolute brightness difference to consider pixel watermarked */
    minBrightnessDelta: number;
    /** How many standard deviations above local mean counts as outlier */
    outlierSigma: number;
  };
}

export interface ResolvedConfig {
  platform: string;
  searchX: number;
  searchY: number;
  searchW: number;
  searchH: number;
  lighter: boolean;
  minBrightnessDelta: number;
  outlierSigma: number;
  dilateRadius: number;
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
    searchRegion: { widthRatio: 0.15, heightRatio: 0.15, marginX: 20, marginY: 20 },
    characteristics: { lighter: true, minBrightnessDelta: 8, outlierSigma: 1.5 },
  },
  jimeng: {
    name: "jimeng",
    displayName: "即梦 (ByteDance)",
    searchRegion: { widthRatio: 0.22, heightRatio: 0.16, marginX: 12, marginY: 12 },
    characteristics: { lighter: true, minBrightnessDelta: 5, outlierSigma: 1.2 },
  },
  doubao: {
    name: "doubao",
    displayName: "豆包 (ByteDance)",
    searchRegion: { widthRatio: 0.22, heightRatio: 0.16, marginX: 12, marginY: 12 },
    characteristics: { lighter: true, minBrightnessDelta: 5, outlierSigma: 1.2 },
  },
  tongyi: {
    name: "tongyi",
    displayName: "通义万相 (Alibaba)",
    searchRegion: { widthRatio: 0.22, heightRatio: 0.16, marginX: 12, marginY: 12 },
    characteristics: { lighter: true, minBrightnessDelta: 5, outlierSigma: 1.2 },
  },
  wenxin: {
    name: "wenxin",
    displayName: "文心一格 (Baidu)",
    searchRegion: { widthRatio: 0.22, heightRatio: 0.16, marginX: 12, marginY: 12 },
    characteristics: { lighter: true, minBrightnessDelta: 5, outlierSigma: 1.2 },
  },
  leonardo: {
    name: "leonardo",
    displayName: "Leonardo.ai",
    searchRegion: { widthRatio: 0.14, heightRatio: 0.14, marginX: 24, marginY: 24 },
    characteristics: { lighter: true, minBrightnessDelta: 10, outlierSigma: 1.8 },
  },
  auto: {
    name: "auto",
    displayName: "Auto Detect",
    searchRegion: { widthRatio: 0.25, heightRatio: 0.18, marginX: 10, marginY: 10 },
    characteristics: { lighter: true, minBrightnessDelta: 5, outlierSigma: 1.0 },
  },
};

export function getPlatformNames(): string[] {
  return Object.keys(PLATFORMS);
}

export function getPlatformConfig(name: string): PlatformConfig | null {
  return PLATFORMS[name] ?? null;
}

// ── Config resolution (v2-style: relative to FULL image) ──────────────────

export function resolveConfig(
  platform: string,
  width: number,
  height: number,
): ResolvedConfig {
  const cfg = PLATFORMS[platform];
  if (!cfg) return resolveConfig("auto", width, height);

  const sr = cfg.searchRegion;
  const ch = cfg.characteristics;

  const searchW = Math.max(60, Math.min(width, Math.round(width * sr.widthRatio)));
  const searchH = Math.max(40, Math.min(height, Math.round(height * sr.heightRatio)));
  const searchX = width - searchW - sr.marginX;
  const searchY = height - searchH - sr.marginY;

  return {
    platform: cfg.name,
    searchX,
    searchY,
    searchW,
    searchH,
    lighter: ch.lighter,
    minBrightnessDelta: ch.minBrightnessDelta,
    outlierSigma: ch.outlierSigma,
    dilateRadius: 2,
    erodeRadius: 1,
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
  const MAX_PASSES = 3;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const source = pass === 0 ? imageData : output;
    const passResult = detectAndInpaint(source, config, combinedMask);

    if (passResult.pixelCount < 20) break;

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

// ── Single-pass: v2 Detection + FMM Inpainting ─────────────────────────────

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
  const { width: imgW, height: imgH, data } = source;
  const { searchX, searchY, searchW, searchH, lighter, minBrightnessDelta, outlierSigma, dilateRadius, erodeRadius } = config;

  const sx = Math.max(0, Math.round(searchX));
  const sy = Math.max(0, Math.round(searchY));
  const ex = Math.min(imgW, sx + searchW);
  const ey = Math.min(imgH, sy + searchH);
  const rw = ex - sx;
  const rh = ey - sy;

  if (rw < 10 || rh < 10) {
    return makeEmptyResult(source, config);
  }

  // ═══ STEP 1: Compute brightness map of search region (v2: simple average) ═══

  const brightness = new Float32Array(rw * rh);
  let sumB = 0;
  let count = 0;

  for (let ly = 0; ly < rh; ly++) {
    for (let lx = 0; lx < rw; lx++) {
      if (previousMask && previousMask[ly * rw + lx]) continue;

      const pi = (sy + ly) * imgW + (sx + lx);
      const b = (data[pi * 4] + data[pi * 4 + 1] + data[pi * 4 + 2]) / 3; // v2: simple average
      brightness[ly * rw + lx] = b;
      sumB += b;
      count++;
    }
  }

  if (count === 0) {
    return makeEmptyResult(source, config);
  }

  // ═══ STEP 2: Robust statistics (v2: exclude |diff|>60 from mean) ═══

  const globalMean = sumB / count;

  // First pass: compute robust mean (excluding extreme outliers)
  let robustSum = 0;
  let robustCount = 0;
  for (let i = 0; i < brightness.length; i++) {
    if (previousMask && previousMask[i]) continue;
    const d = Math.abs(brightness[i] - globalMean);
    if (d < 60) { // exclude extreme outliers (>60 away from mean)
      robustSum += brightness[i];
      robustCount++;
    }
  }
  const robustMean = robustCount > 0 ? robustSum / robustCount : globalMean;

  // Compute std dev from robust mean
  let sumSq = 0;
  let stdCount = 0;
  for (let i = 0; i < brightness.length; i++) {
    if (previousMask && previousMask[i]) continue;
    const d = brightness[i] - robustMean;
    sumSq += d * d;
    stdCount++;
  }
  const stdDev = stdCount > 0 ? Math.sqrt(sumSq / stdCount) : 0;

  // ═══ STEP 3: Build binary mask (v2: threshold = max(minDelta, sigma*std)) ═══

  const threshold = Math.max(minBrightnessDelta, outlierSigma * stdDev);

  const rawMask = new Uint8ClampedArray(rw * rh);
  for (let si = 0; si < brightness.length; si++) {
    if (previousMask && previousMask[si]) continue;

    const diff = lighter
      ? brightness[si] - robustMean  // watermark is LIGHTER than bg
      : robustMean - brightness[si]; // watermark is DARKER than bg
    if (diff > threshold) {
      rawMask[si] = 255;
    }
  }

  // ═══ STEP 4: Morphological cleanup ═══

  let finalMask = morphDilate(rawMask, rw, rh, 1);  // catch semi-transparent edges
  finalMask = morphErode(finalMask, rw, rh, 1);       // remove noise pixels
  finalMask = morphDilate(finalMask, rw, rh, 1);       // restore text thickness

  if (previousMask) {
    for (let i = 0; i < finalMask.length; i++) {
      if (previousMask[i]) finalMask[i] = 255;
    }
  }

  let pixelCount = 0;
  for (let i = 0; i < finalMask.length; i++) {
    if (finalMask[i]) pixelCount++;
  }

  if (pixelCount < 20) {
    return { cleaned: source, mask: finalMask, pixelCount: 0, confidence: 0 };
  }

  // ═══ STEP 5: FMM Inpainting (upgrade from v2's naive averaging) ═══

  const outputImage = new ImageData(new Uint8ClampedArray(data), imgW, imgH);
  fmmInpaint(outputImage.data, finalMask, sx, sy, rw, rh, imgW, imgH);

  const density = pixelCount / (rw * rh);
  const confidence = computeConfidence(finalMask, rw, rh, density);

  return { cleaned: outputImage, mask: finalMask, pixelCount, confidence };
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

function fmmInpaint(
  imgData: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  ox: number, oy: number,
  mw: number, mh: number,
  imgW: number, _imgH: number,
): void {
  const state = new Int8Array(mw * mh);
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

  // Seed narrow band
  for (let my = 0; my < mh; my++) {
    for (let mx = 0; mx < mw; mx++) {
      if (state[my * mw + mx] !== 0) continue;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
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

      const distSq = dx * dx * step * step + dy * dy * step * step;
      if (distSq < 1) continue;
      const weight = 1.0 / distSq;

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
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) val = mask[ny * w + nx];
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
  if (density < 0.005 || density > 0.8) return 0;

  let connected = 0;
  const visited = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] && !visited[i]) {
      floodCount(mask, visited, w, h, i % w, Math.floor(i / w));
      connected++;
    }
  }

  const clusterScore = connected === 1 ? 1.0 : connected === 2 ? 0.7 : Math.max(0, 0.4 / connected);
  const densityScore = density < 0.25 ? 1.0 : Math.max(0, 1.0 - (density - 0.25) * 2.5);

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

// ── Auto-detection (v2-style: no content region) ─────────────────────────

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
