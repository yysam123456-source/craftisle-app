/**
 * Generic AI Watermark Remover — multi-platform support.
 *
 * v2: Detection + Inpainting approach (replaces broken synthetic-alpha approach).
 *
 * Most AI image tools add a semi-transparent text/logo in the bottom-right corner.
 * Instead of reverse-alpha-blending (which requires precise per-platform templates),
 * this engine:
 *
 *   1. DETECTS watermark pixels as local brightness/color outliers in the corner region
 *   2. BUILDS a tight binary mask around actual watermark strokes
 *   3. INPAINTS masked pixels from surrounding non-watermark neighbors
 *
 * For Gemini images, we still delegate to @pilio's precise alpha-map engine.
 * For everything else, detection + inpainting produces visibly clean results
 * without needing platform-specific calibration data.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface PlatformConfig {
  name: string;
  displayName: string;
  /** Search region in bottom-right corner. */
  searchRegion: {
    widthRatio: number; // fraction of image width to search
    heightRatio: number; // fraction of image height to search
    marginX: number;     // px from right edge
    marginY: number;     // px from bottom edge
  };
  /** Expected watermark characteristics for detection tuning. */
  characteristics: {
    /** Is watermark typically lighter or darker than background? */
    lighter: boolean;
    /** Min brightness difference to consider a pixel "watermarked". */
    minBrightnessDelta: number;
    /** How many standard deviations above local mean counts as outlier. */
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
}

export interface RemovalResult {
  cleaned: ImageData;
  mask: Uint8ClampedArray;       // binary mask (255 = watermark pixel, 0 = clean)
  region: { x: number; y: number; w: number; h: number };
  pixelCount: number;            // how many pixels were inpainted
  confidence: number;            // 0-1, how confident we are this is a real watermark
}

// ── Platform configs ────────────────────────────────────────────────────────

const PLATFORMS: Record<string, PlatformConfig> = {
  gemini: {
    name: "gemini",
    displayName: "Gemini (Google)",
    searchRegion: { widthRatio: 0.15, heightRatio: 0.15, marginX: 20, marginY: 20 },
    characteristics: { lighter: true, minBrightnessDelta: 8, outlierSigma: 1.5 },
  },
  doubao: {
    name: "doubao",
    displayName: "豆包 (ByteDance)",
    searchRegion: { widthRatio: 0.18, heightRatio: 0.12, marginX: 16, marginY: 16 },
    characteristics: { lighter: true, minBrightnessDelta: 6, outlierSigma: 1.2 },
  },
  jimeng: {
    name: "jimeng",
    displayName: "即梦 (ByteDance)",
    searchRegion: { widthRatio: 0.18, heightRatio: 0.12, marginX: 16, marginY: 16 },
    characteristics: { lighter: true, minBrightnessDelta: 6, outlierSigma: 1.2 },
  },
  tongyi: {
    name: "tongyi",
    displayName: "通义万相 (Alibaba)",
    searchRegion: { widthRatio: 0.18, heightRatio: 0.12, marginX: 16, marginY: 16 },
    characteristics: { lighter: true, minBrightnessDelta: 6, outlierSigma: 1.2 },
  },
  wenxin: {
    name: "wenxin",
    displayName: "文心一格 (Baidu)",
    searchRegion: { widthRatio: 0.18, heightRatio: 0.12, marginX: 16, marginY: 16 },
    characteristics: { lighter: true, minBrightnessDelta: 6, outlierSigma: 1.2 },
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
    searchRegion: { widthRatio: 0.20, heightRatio: 0.15, marginX: 12, marginY: 12 },
    characteristics: { lighter: true, minBrightnessDelta: 5, outlierSigma: 1.0 },
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
  };
}

// ── Core: Detection + Inpainting ───────────────────────────────────────────

/**
 * Remove watermark using detection + inpainting.
 *
 * Algorithm:
 *   1. Compute local average brightness in the search region (excluding outliers)
 *   2. Flag pixels that are significant brightness outliers → binary mask
 *   3. Morphologically dilate mask slightly (catch semi-transparent edges)
 *   4. Inpaint masked pixels via weighted neighbor averaging
 */
export function removeWatermark(
  imageData: ImageData,
  config: ResolvedConfig,
): RemovalResult {
  const { width, height, data } = imageData;
  const { searchX, searchY, searchW, searchH, lighter, minBrightnessDelta, outlierSigma } = config;

  // Clamp search region
  const sx = Math.max(0, searchX);
  const sy = Math.max(0, searchY);
  const ex = Math.min(width, sx + searchW);
  const ey = Math.min(height, sy + searchH);
  const rw = ex - sx;
  const rh = ey - sy;

  if (rw < 10 || rh < 10) {
    return {
      cleaned: new ImageData(new Uint8ClampedArray(data), width, height),
      mask: new Uint8ClampedArray(rw * rh),
      region: { x: sx, y: sy, w: rw, h: rh },
      pixelCount: 0,
      confidence: 0,
    };
  }

  // Step 1: Compute brightness map of search region
  const brightness = new Float32Array(rw * rh);
  let sumB = 0;
  let count = 0;

  for (let y = sy; y < ey; y++) {
    for (let x = sx; x < ex; x++) {
      const pi = y * width + x;
      const b = (data[pi * 4] + data[pi * 4 + 1] + data[pi * 4 + 2]) / 3;
      const si = (y - sy) * rw + (x - sx);
      brightness[si] = b;
      sumB += b;
      count++;
    }
  }

  const globalMean = sumB / count;

  // Step 2: Iterative outlier detection
  // First pass: compute robust mean (excluding extremes)
  let robustSum = 0;
  let robustCount = 0;
  for (let i = 0; i < brightness.length; i++) {
    const d = Math.abs(brightness[i] - globalMean);
    if (d < 60) { // exclude extreme outliers from robust mean
      robustSum += brightness[i];
      robustCount++;
    }
  }
  const robustMean = robustCount > 0 ? robustSum / robustCount : globalMean;

  // Compute std dev from robust mean
  let sumSq = 0;
  for (let i = 0; i < brightness.length; i++) {
    const d = brightness[i] - robustMean;
    sumSq += d * d;
  }
  const stdDev = Math.sqrt(sumSq / count);

  // Step 3: Build binary mask of watermark pixels
  const rawMask = new Uint8ClampedArray(rw * rh);
  const threshold = Math.max(minBrightnessDelta, outlierSigma * stdDev);

  for (let si = 0; si < brightness.length; si++) {
    const diff = lighter
      ? brightness[si] - robustMean  // watermark is LIGHTER than bg
      : robustMean - brightness[si]; // watermark is DARKER than bg
    if (diff > threshold) {
      rawMask[si] = 255;
    }
  }

  // Step 4: Morphological cleanup
  // 4a: Dilate slightly to catch semi-transparent edges (radius=1)
  const dilatedMask = morphDilate(rawMask, rw, rh, 1);

  // 4b: Erode to remove isolated noise pixels (radius=1), then dilate back
  // This cleans up salt-and-pepper noise while keeping real watermark shapes
  const cleanedMask = morphErode(dilatedMask, rw, rh, 1);
  const finalMask = morphDilate(cleanedMask, rw, rh, 1);

  // Count masked pixels
  let pixelCount = 0;
  for (let i = 0; i < finalMask.length; i++) {
    if (finalMask[i]) pixelCount++;
  }

  // Confidence: based on what fraction of region is watermarked and clustering
  const density = pixelCount / (rw * rh);
  const confidence = computeConfidence(finalMask, rw, rh, density);

  // If too few pixels or too low confidence, return original
  if (pixelCount < 20 || confidence < 0.1) {
    return {
      cleaned: new ImageData(new Uint8ClampedArray(data), width, height),
      mask: finalMask,
      region: { x: sx, y: sy, w: rw, h: rh },
      pixelCount: 0,
      confidence,
    };
  }

  // Step 5: Inpaint masked pixels
  const output = new ImageData(new Uint8ClampedArray(data), width, height);
  inpaint(output.data, finalMask, sx, sy, rw, rh, width, height);

  return {
    cleaned: output,
    mask: finalMask,
    region: { x: sx, y: sy, w: rw, h: rh },
    pixelCount,
    confidence,
  };
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
      let val = 255; // assume ON unless all neighbors are OFF
      for (let dy = -radius; dy <= radius && val; dy++) {
        for (let dx = -radius; dx <= radius && val; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            if (!mask[ny * w + nx]) val = 0;
          }
        }
      }
      out[y * w + x] = val;
    }
  }
  return out;
}

// ── Inpainting ─────────────────────────────────────────────────────────────

/**
 * Replace masked pixels with weighted average of valid (unmasked) neighbors.
 * Uses a larger kernel (radius=5) for smoother results on text watermarks.
 */
function inpaint(
  data: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  ox: number, oy: number,   // origin of mask in image coords
  mw: number, mh: number,   // mask dimensions
  imgW: number, imgH: number,
): void {
  const RADIUS = 5;
  const tmp = new Float32Array(mw * mh * 3); // accumulated R,G,B sums
  const tmpW = new Float32Array(mw *mh);      // weight sums

  // Pass 1: accumulate neighbor contributions into masked pixels
  for (let my = 0; my < mh; my++) {
    for (let mx = 0; mx < mw; mx++) {
      if (!mask[my * mw + mx]) continue; // only process masked pixels

      let wr = 0, wg = 0, wb = 0, wt = 0;

      for (let dy = -RADIUS; dy <= RADIUS; dy++) {
        for (let dx = -RADIUS; dx <= RADIUS; dx++) {
          const nx = mx + dx;
          const ny = my + dy;
          if (nx < 0 || nx >= mw || ny < 0 || ny >= mh) continue;
          if (mask[ny * mw + nx]) continue; // skip other masked pixels

          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > RADIUS) continue;
          const weight = 1.0 - dist / RADIUS; // linear falloff

          const pix = (oy + ny) * imgW + (ox + nx);
          wr += data[pix * 4] * weight;
          wg += data[pix * 4 + 1] * weight;
          wb += data[pix * 4 + 2] * weight;
          wt += weight;
        }
      }

      const idx = (my * mw + mx) * 3;
      if (wt > 0) {
        tmp[idx] = wr / wt;
        tmp[idx + 1] = wg / wt;
        tmp[idx + 2] = wb / wt;
        tmpW[my * mw + mx] = 1;
      }
    }
  }

  // Pass 2: write back inpainted values
  for (let my = 0; my < mh; my++) {
    for (let mx = 0; mx < mw; mx++) {
      if (!tmpW[my * mw + mx]) continue;
      const pix = (oy + my) * imgW + (ox + mx);
      const idx = (my * mw + mx) * 3;
      data[pix * 4] = Math.max(0, Math.min(255, Math.round(tmp[idx])));
      data[pix * 4 + 1] = Math.max(0, Math.min(255, Math.round(tmp[idx + 1])));
      data[pix * 4 + 2] = Math.max(0, Math.min(255, Math.round(tmp[idx + 2])));
      // Alpha unchanged
    }
  }
}

// ── Confidence scoring ────────────────────────────────────────────────────

function computeConfidence(
  mask: Uint8ClampedArray, w: number, h: number, density: number,
): number {
  if (density < 0.005 || density > 0.8) return 0; // too sparse or too dense = not a watermark

  // Check spatial clustering: real watermarks form connected regions
  let connected = 0;
  const visited = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] && !visited[i]) {
      floodCount(mask, visited, w, h, i % w, Math.floor(i / w));
      connected++;
    }
  }

  // Real watermarks: few connected components (text strokes), moderate density
  const clusterScore = Math.min(1, connected / 30); // fewer clusters = higher score (capped at ~30 chars worth)
  const densityScore = 1 - Math.abs(density - 0.08) * 5; // ideal ~8% coverage
  return Math.max(0, Math.min(1, clusterScore * 0.4 + Math.max(0, densityScore) * 0.6));
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

/**
 * Try each platform config and pick the one that detects the most plausible watermark.
 */
export function autoDetectPlatform(
  imageData: ImageData,
  platforms: string[] = ["gemini", "doubao", "jimeng", "tongyi", "wenxin"],
): string {
  const { width, height } = imageData;

  let bestPlatform = "doubao"; // default for Chinese AI tools (most likely)
  let bestScore = -Infinity;

  for (const p of platforms) {
    const cfg = resolveConfig(p, width, height);
    const result = removeWatermark(imageData, cfg);
    // Score: balance between pixel count (more = more likely real watermark) and confidence
    const score = result.pixelCount * result.confidence;
    if (score > bestScore && result.confidence > 0.15) {
      bestScore = score;
      bestPlatform = p;
    }
  }

  return bestPlatform;
}
