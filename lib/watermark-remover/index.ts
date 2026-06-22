/**
 * Generic AI Watermark Remover — v8
 *
 * ROOT CAUSE FIX (v7): v3-v6 all broke because they changed the proven v2 detection.
 * v2 worked because it searched bottom-right of FULL IMAGE using simple brightness
 * average with robust statistics and a minBrightnessDelta safety floor.
 *
 * REPAIR UPGRADE (v8): Replaced FMM (Telea) inpainting with Background Fill.
 * FMM failed on dark-background watermarks because it propagated contaminated edge values.
 * Background Fill samples only non-masked neighbors → clean repair.
 *
 * Algorithm:
 *   1. Search bottom-right corner of IMAGE (not "content region" — that was the bug!)
 *   2. Simple brightness average (R+G+B)/3 — not ITU-R luminance
 *   3. Robust mean (exclude |diff|>60 outliers) + stdDev
 *   4. Threshold = max(minBrightnessDelta, sigma*stdDev)
 *   5. Morphological cleanup (dilate/erode/dilate)
 *   6. Background Fill: sample non-masked neighbors with inverse-distance weighting
 *   7. Multi-pass up to 3 iterations (pass 2+ catches residuals)
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

  // ═══ STEP 5: Background Fill Repair (v8: replaces FMM for better results) ═══

  const outputImage = new ImageData(new Uint8ClampedArray(data), imgW, imgH);
  backgroundFill(outputImage.data, finalMask, sx, sy, rw, rh, imgW);

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

// ── Background Fill Repair (v8: replaces FMM for more aggressive watermark removal) ──
// For each masked pixel, sample nearby non-masked pixels with inverse-distance weighting.
// Works much better than FMM on uniform backgrounds where watermark text is brighter/darker than surroundings.

function backgroundFill(
  imgData: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  ox: number, oy: number,
  mw: number, mh: number,
  imgW: number,
  sampleRadius = 20,
): void {
  const filled = new Set<number>();
  type QueueEntry = [number, number, number];
  const queue: QueueEntry[] = [];
  const inQueue = new Uint8Array(mw * mh);

  // Seed: find mask border pixels (masked + adjacent to unmasked)
  for (let my = 0; my < mh; my++) {
    for (let mx = 0; mx < mw; mx++) {
      if (!mask[my * mw + mx]) continue;
      let hasUnmaskedNeighbor = false;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = mx + dx, ny = my + dy;
        if (nx >= 0 && nx < mw && ny >= 0 && ny < mh && !mask[ny * mw + nx]) {
          hasUnmaskedNeighbor = true;
          break;
        }
      }
      if (hasUnmaskedNeighbor) {
        queue.push([mx, my, 0]);
        inQueue[my * mw + mx] = 1;
      }
    }
  }

  while (queue.length > 0) {
    const [mx, my, _dist] = queue.shift()!;
    const idx = my * mw + mx;
    if (!mask[idx] || filled.has(idx)) continue;
    filled.add(idx);

    const pixIdx = (oy + my) * imgW + (ox + mx);

    // Sample non-masked neighbors within radius
    let sr = 0, sg = 0, sb = 0, sc = 0;
    const r2 = sampleRadius * sampleRadius;

    for (let cy = Math.max(0, my - sampleRadius); cy <= Math.min(mh - 1, my + sampleRadius); cy++) {
      for (let cx = Math.max(0, mx - sampleRadius); cx <= Math.min(mw - 1, mx + sampleRadius); cx++) {
        if (mask[cy * mw + cx]) continue; // skip masked pixels
        const d2 = (cx - mx) ** 2 + (cy - my) ** 2;
        if (d2 > r2) continue;
        const w = 1.0 / (1 + d2); // inverse distance weighting
        const p = (oy + cy) * imgW + (ox + cx);
        sr += imgData[p * 4] * w;
        sg += imgData[p * 4 + 1] * w;
        sb += imgData[p * 4 + 2] * w;
        sc += w;
      }
    }

    if (sc > 0) {
      imgData[pixIdx * 4] = clamp(Math.round(sr / sc));
      imgData[pixIdx * 4 + 1] = clamp(Math.round(sg / sc));
      imgData[pixIdx * 4 + 2] = clamp(Math.round(sb / sc));
    }

    // Enqueue masked neighbors
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nx = mx + dx, ny = my + dy, nidx = ny * mw + nx;
      if (nx >= 0 && nx < mw && ny >= 0 && ny < mh && mask[nidx] && !inQueue[nidx] && !filled.has(nidx)) {
        queue.push([nx, ny, _dist + 1]);
        inQueue[nidx] = 1;
      }
    }
  }
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
