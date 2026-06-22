/**
 * Generic AI Watermark Remover — v6
 *
 * CRITICAL FIX from local validation:
 *   Users upload SCREENSHOTS of browser pages, not original images.
 *   The old algorithm searched bottom-right of the FULL image (white UI background).
 *   Now we auto-detect the content/photo area first, then search within THAT.
 *
 * Algorithm:
 *   1. Auto-detect content region (find largest non-white rectangle)
 *   2. Within content's bottom-right corner: global brightness outlier detection
 *   3. FMM (Telea) inpainting for edge-preserving repair
 *   4. Multi-pass up to 3 iterations
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface PlatformConfig {
  name: string;
  displayName: string;
  /** Search region as ratio of CONTENT area (not full image) */
  contentSearchRegion: {
    widthRatio: number;   // fraction of content width
    heightRatio: number;  // fraction of content height
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

export interface ContentRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ── Platform configs ────────────────────────────────────────────────────────

const PLATFORMS: Record<string, PlatformConfig> = {
  gemini: {
    name: "gemini",
    displayName: "Gemini (Google)",
    contentSearchRegion: { widthRatio: 0.18, heightRatio: 0.16, marginX: 12, marginY: 12 },
  },
  jimeng: {
    name: "jimeng",
    displayName: "即梦 (ByteDance)",
    contentSearchRegion: { widthRatio: 0.30, heightRatio: 0.22, marginX: 6, marginY: 6 },
  },
  doubao: {
    name: "doubao",
    displayName: "豆包 (ByteDance)",
    contentSearchRegion: { widthRatio: 0.30, heightRatio: 0.22, marginX: 6, marginY: 6 },
  },
  tongyi: {
    name: "tongyi",
    displayName: "通义万相 (Alibaba)",
    contentSearchRegion: { widthRatio: 0.30, heightRatio: 0.22, marginX: 6, marginY: 6 },
  },
  wenxin: {
    name: "wenxin",
    displayName: "文心一格 (Baidu)",
    contentSearchRegion: { widthRatio: 0.30, heightRatio: 0.22, marginX: 6, marginY: 6 },
  },
  leonardo: {
    name: "leonardo",
    displayName: "Leonardo.ai",
    contentSearchRegion: { widthRatio: 0.20, heightRatio: 0.18, marginX: 10, marginY: 10 },
  },
  auto: {
    name: "auto",
    displayName: "Auto Detect",
    contentSearchRegion: { widthRatio: 0.35, heightRatio: 0.25, marginX: 4, marginY: 4 },
  },
};

export function getPlatformNames(): string[] {
  return Object.keys(PLATFORMS);
}

export function getPlatformConfig(name: string): PlatformConfig | null {
  return PLATFORMS[name] ?? null;
}

// ── Content Region Detection ───────────────────────────────────────────────
//
// Finds the main content/photo area within an image using connected-component
// analysis on a coarse grid. Handles screenshots where the photo is surrounded
// by white/gray UI chrome or has thin dark borders.
//
// Algorithm:
//   1. Sample image at STEPpx intervals → coarse grid
//   2. Mark cell as "content" if it's not pure white (L < 0.80)
//   3. Find connected components (4-neighbor flood fill) of content cells
//   4. The largest component is the main photo/content
//   5. Return bounding box of that component
//

const CONTENT_LUM_MAX = 0.80; // above this = white/background, below = content
const GRID_STEP = 6;          // sampling step (balance speed vs accuracy)

export function detectContentRegion(imageData: ImageData): ContentRegion {
  const { width: W, height: H, data } = imageData;

  const step = GRID_STEP;
  const cols = Math.ceil(W / step);
  const rows = Math.ceil(H / step);

  // Build binary grid: 1 = content pixel (not pure white), 0 = background
  const isContent = new Uint8Array(cols * rows);

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const px = Math.min(gx * step, W - 1);
      const py = Math.min(gy * step, H - 1);
      const i = (py * W + px) * 4;
      const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;

      // Content if not pure white (exclude both white background AND pure black borders)
      if (lum < CONTENT_LUM_MAX && lum > 0.02) {
        isContent[gy * cols + gx] = 1;
      }
    }
  }

  // Connected component labeling (flood fill)
  const visited = new Uint8Array(cols * rows);
  let bestComponent: number[] | null = null;
  let bestSize = 0;

  for (let start = 0; start < isContent.length; start++) {
    if (!isContent[start] || visited[start]) continue;

    // Flood fill this component
    const stack: number[] = [start];
    const component: number[] = [];
    visited[start] = 1;

    while (stack.length > 0) {
      const idx = stack.pop()!;
      component.push(idx);
      const gx = idx % cols;
      const gy = Math.floor(idx / cols);

      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = gx + dx, ny = gy + dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        const nidx = ny * cols + nx;
        if (isContent[nidx] && !visited[nidx]) {
          visited[nidx] = 1;
          stack.push(nidx);
        }
      }
    }

    if (component.length > bestSize) {
      bestSize = component.length;
      bestComponent = component;
    }
  }

  // If no significant content found, return full image
  if (!bestComponent || bestSize < 20) {
    return { x: 0, y: 0, w: W, h: H };
  }

  // Compute bounding box of the largest component
  let minX = cols, maxX = 0, minY = rows, maxY = 0;
  for (const idx of bestComponent) {
    const gx = idx % cols;
    const gy = Math.floor(idx / cols);
    minX = Math.min(minX, gx); maxX = Math.max(maxX, gx);
    minY = Math.min(minY, gy); maxY = Math.max(maxY, gy);
  }

  // Convert back to pixel coordinates with margin
  const margin = step * 2;
  const cx = Math.max(0, minX * step - margin);
  const cy = Math.max(0, minY * step - margin);
  const cw = Math.min(W - cx, (maxX - minX + 3) * step);
  const ch = Math.min(H - cy, (maxY - minY + 3) * step);

  return { x: cx, y: cy, w: cw, h: ch };
}

// ── Config resolution (relative to content region) ─────────────────────────

export function resolveConfig(
  platform: string,
  width: number,
  height: number,
  contentRegion?: ContentRegion,
): ResolvedConfig & { contentRegion: ContentRegion } {
  const cfg = PLATFORMS[platform];
  if (!cfg) return resolveConfig("auto", width, height, contentRegion);

  // Auto-detect content if not provided
  const cr = contentRegion ?? { x: 0, y: 0, w: width, h: height };

  const sr = cfg.contentSearchRegion;

  // Search region is relative to CONTENT area's bottom-right
  const searchW = Math.max(80, Math.min(cr.w - 20, Math.round(cr.w * sr.widthRatio)));
  const searchH = Math.max(50, Math.min(cr.h - 20, Math.round(cr.h * sr.heightRatio)));
  const searchX = cr.x + cr.w - searchW - sr.marginX;
  const searchY = cr.y + cr.h - searchH - sr.marginY;

  return {
    platform: cfg.name,
    searchX: Math.max(0, searchX),
    searchY: Math.max(0, searchY),
    searchW,
    searchH,
    outlierSigma: 1.5,       // lowered from 2.0 for better low-contrast detection
    dilateRadius: 2,
    erodeRadius: 1,
    contentRegion: cr,
  };
}

// ── Core entry point ───────────────────────────────────────────────────────

export function removeWatermark(
  imageData: ImageData,
  config: ResolvedConfig & { contentRegion: ContentRegion },
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

    if (passResult.pixelCount < 3) break;

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

// ── Detection Methods ─────────────────────────────────────────────────────

/** Count non-zero pixels in mask */
function countMaskPixels(mask: Uint8ClampedArray, w: number, h: number): number {
  let count = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) count++;
  }
  return count;
}

/**
 * Method 1: Global brightness outlier detection
 * Works well for high-contrast watermarks (Gemini, light watermark on dark bg)
 */
function detectByBrightnessOutlier(
  data: Uint8ClampedArray,
  imgW: number,
  sx: number, sy: number,
  rw: number, rh: number,
  outlierSigma: number,
  previousMask: Uint8ClampedArray | null,
): Uint8ClampedArray {
  const pixelLums: number[] = [];
  const pixelCoords: [number, number][] = [];

  for (let ly = 0; ly < rh; ly++) {
    for (let lx = 0; lx < rw; lx++) {
      if (previousMask && previousMask[ly * rw + lx]) continue;

      const pi = (sy + ly) * imgW + (sx + lx);
      const r = data[pi * 4];
      const g = data[pi * 4 + 1];
      const b = data[pi * 4 + 2];
      pixelLums.push(r * 0.299 + g * 0.587 + b * 0.114);
      pixelCoords.push([lx, ly]);
    }
  }

  if (pixelLums.length === 0) {
    return new Uint8ClampedArray(rw * rh);
  }

  // Robust statistics: trim top/bottom 8%
  const sorted = pixelLums.slice().sort((a, b) => a - b);
  const trimN = Math.max(1, Math.floor(sorted.length * 0.08));
  const trimmed = sorted.slice(trimN, sorted.length - trimN);

  const meanL = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  const stdL = Math.sqrt(trimmed.reduce((s, l) => s + (l - meanL) ** 2, 0) / trimmed.length);
  // Use true stdL (no floor) so low-contrast watermarks remain detectable
  const threshold = outlierSigma * stdL;

  const rawMask = new Uint8ClampedArray(rw * rh);
  for (let i = 0; i < pixelLums.length; i++) {
    if (pixelLums[i] - meanL > threshold) {
      const [lx, ly] = pixelCoords[i];
      rawMask[ly * rw + lx] = 255;
    }
  }

  return rawMask;
}

/**
 * Method 2: Edge-based detection (Sobel + adaptive threshold)
 * Works for low-contrast watermarks where text has edges but similar brightness
 */
function detectByEdge(
  data: Uint8ClampedArray,
  imgW: number,
  sx: number, sy: number,
  rw: number, rh: number,
  previousMask: Uint8ClampedArray | null,
): Uint8ClampedArray {
  // Build grayscale array for search region
  const gray = new Float32Array(rw * rh);
  for (let ly = 0; ly < rh; ly++) {
    for (let lx = 0; lx < rw; lx++) {
      if (previousMask && previousMask[ly * rw + lx]) continue;
      const pi = (sy + ly) * imgW + (sx + lx);
      gray[ly * rw + lx] = (data[pi * 4] * 0.299 + data[pi * 4 + 1] * 0.587 + data[pi * 4 + 2] * 0.114) / 255;
    }
  }

  // Compute Sobel gradient magnitude
  const gradMag = new Float32Array(rw * rh);
  let maxGrad = 0;

  for (let ly = 1; ly < rh - 1; ly++) {
    for (let lx = 1; lx < rw - 1; lx++) {
      if (previousMask && previousMask[ly * rw + lx]) continue;

      const gx = 
        -gray[(ly - 1) * rw + (lx - 1)] + gray[(ly - 1) * rw + (lx + 1)] +
        -2 * gray[ly * rw + (lx - 1)] + 2 * gray[ly * rw + (lx + 1)] +
        -gray[(ly + 1) * rw + (lx - 1)] + gray[(ly + 1) * rw + (lx + 1)];

      const gy = 
        -gray[(ly - 1) * rw + (lx - 1)] - 2 * gray[(ly - 1) * rw + lx] - gray[(ly - 1) * rw + (lx + 1)] +
        gray[(ly + 1) * rw + (lx - 1)] + 2 * gray[(ly + 1) * rw + lx] + gray[(ly + 1) * rw + (lx + 1)];

      const mag = Math.sqrt(gx * gx + gy * gy);
      gradMag[ly * rw + lx] = mag;
      if (mag > maxGrad) maxGrad = mag;
    }
  }

  // Adaptive threshold: median + 3 * MAD (Median Absolute Deviation)
  const validGrad: number[] = [];
  for (let i = 0; i < gradMag.length; i++) {
    if (gradMag[i] > 0 && !(previousMask && previousMask[i])) {
      validGrad.push(gradMag[i]);
    }
  }

  if (validGrad.length === 0) {
    return new Uint8ClampedArray(rw * rh);
  }

  const sortedGrad = validGrad.slice().sort((a, b) => a - b);
  const median = sortedGrad[Math.floor(sortedGrad.length / 2)];
  const mad = validGrad.reduce((s, g) => s + Math.abs(g - median), 0) / validGrad.length;
  const edgeThreshold = median + 3 * mad;

  // Build edge mask
  const edgeMask = new Uint8ClampedArray(rw * rh);
  for (let i = 0; i < gradMag.length; i++) {
    if (gradMag[i] > edgeThreshold) {
      edgeMask[i] = 255;
    }
  }

  // Dilate heavily to fill text regions (edges → filled text)
  let filledMask = morphDilate(edgeMask, rw, rh, 4);
  filledMask = morphDilate(filledMask, rw, rh, 3);
  filledMask = morphErode(filledMask, rw, rh, 2);

  return filledMask;
}

/**
 * Method 3: Local standard deviation detection
 * Detects textured regions (watermark text) vs smooth background
 */
function detectByLocalStdDev(
  data: Uint8ClampedArray,
  imgW: number,
  sx: number, sy: number,
  rw: number, rh: number,
  previousMask: Uint8ClampedArray | null,
): Uint8ClampedArray {
  // Build grayscale array
  const gray = new Float32Array(rw * rh);
  for (let ly = 0; ly < rh; ly++) {
    for (let lx = 0; lx < rw; lx++) {
      if (previousMask && previousMask[ly * rw + lx]) continue;
      const pi = (sy + ly) * imgW + (sx + lx);
      gray[ly * rw + lx] = (data[pi * 4] * 0.299 + data[pi * 4 + 1] * 0.587 + data[pi * 4 + 2] * 0.114) / 255;
    }
  }

  // Compute local standard deviation (5x5 window)
  const localStd = new Float32Array(rw * rh);
  let maxStd = 0;

  for (let ly = 2; ly < rh - 2; ly++) {
    for (let lx = 2; lx < rw - 2; lx++) {
      if (previousMask && previousMask[ly * rw + lx]) continue;

      const vals: number[] = [];
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          vals.push(gray[(ly + dy) * rw + (lx + dx)]);
        }
      }
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
      localStd[ly * rw + lx] = std;
      if (std > maxStd) maxStd = std;
    }
  }

  // Adaptive threshold: use a percentile-based approach
  const validStd: number[] = [];
  for (let i = 0; i < localStd.length; i++) {
    if (localStd[i] > 0 && !(previousMask && previousMask[i])) {
      validStd.push(localStd[i]);
    }
  }

  if (validStd.length === 0) {
    return new Uint8ClampedArray(rw * rh);
  }

  const sortedStd = validStd.slice().sort((a, b) => a - b);
  // Use 80th percentile as threshold (textured regions are in top 20%)
  const percentile80 = sortedStd[Math.floor(sortedStd.length * 0.80)];
  const threshold = Math.max(percentile80, 0.002); // minimum threshold

  const rawMask = new Uint8ClampedArray(rw * rh);
  for (let i = 0; i < localStd.length; i++) {
    if (localStd[i] > threshold) {
      rawMask[i] = 255;
    }
  }

  return rawMask;
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
  config: ResolvedConfig & { contentRegion: ContentRegion },
  previousMask: Uint8ClampedArray | null,
): PassResult {
  const { width: imgW, height: imgH, data } = source;
  const { searchX, searchY, searchW, searchH, outlierSigma, dilateRadius, erodeRadius } = config;

  const sx = Math.max(0, Math.round(searchX));
  const sy = Math.max(0, Math.round(searchY));
  const ex = Math.min(imgW, sx + searchW);
  const ey = Math.min(imgH, sy + searchH);
  const rw = ex - sx;
  const rh = ey - sy;

  if (rw < 10 || rh < 10) {
    return makeEmptyResult(source, config);
  }

  // ═══ STEP 1: Try brightness outlier detection first ═══

  let rawMask = detectByBrightnessOutlier(data, imgW, sx, sy, rw, rh, outlierSigma, previousMask);

  // ═══ STEP 2: If too few pixels, try edge-based detection (for low-contrast watermarks) ═══

  let pixelCount = countMaskPixels(rawMask, rw, rh);
  if (pixelCount < 5) {
    const edgeMask = detectByEdge(data, imgW, sx, sy, rw, rh, previousMask);
    if (countMaskPixels(edgeMask, rw, rh) > pixelCount) {
      rawMask = edgeMask;
    }
  }

  // ═══ STEP 3: If still too few, try local std dev detection ═══

  pixelCount = countMaskPixels(rawMask, rw, rh);
  if (pixelCount < 5) {
    const stdMask = detectByLocalStdDev(data, imgW, sx, sy, rw, rh, previousMask);
    if (countMaskPixels(stdMask, rw, rh) > pixelCount) {
      rawMask = stdMask;
    }
  }

  // ═══ STEP 4: Morphological Cleanup ═══

  let finalMask = morphDilate(rawMask, rw, rh, dilateRadius);
  finalMask = morphErode(finalMask, rw, rh, erodeRadius);
  finalMask = morphDilate(finalMask, rw, rh, 1);

  if (previousMask) {
    for (let i = 0; i < finalMask.length; i++) {
      if (previousMask[i]) finalMask[i] = 255;
    }
  }

  let totalPixelCount = 0;
  for (let i = 0; i < finalMask.length; i++) {
    if (finalMask[i]) totalPixelCount++;
  }

  if (totalPixelCount < 3) {
    return { cleaned: source, mask: finalMask, pixelCount: 0, confidence: 0 };
  }

  // ═══ STEP 5: FMM Inpainting ═══

  const output = new ImageData(new Uint8ClampedArray(data), imgW, imgH);
  fmmInpaint(output.data, finalMask, sx, sy, rw, rh, imgW, imgH);

  const density = totalPixelCount / (rw * rh);
  const confidence = computeConfidence(finalMask, rw, rh, density);

  return { cleaned: output, mask: finalMask, pixelCount: totalPixelCount, confidence };
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
  if (density < 0.0003 || density > 0.95) return 0;

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

// ── Auto-detection ────────────────────────────────────────────────────────

export function autoDetectPlatform(
  imageData: ImageData,
  platforms: string[] = ["jimeng", "doubao", "gemini"],
): string {
  const { width, height } = imageData;
  const contentRegion = detectContentRegion(imageData);

  let bestPlatform = "jimeng";
  let bestScore = -Infinity;

  for (const p of platforms) {
    const cfg = resolveConfig(p, width, height, contentRegion);
    const result = removeWatermark(imageData, cfg);
    const score = result.pixelCount * result.confidence;
    if (score > bestScore && result.passes > 0) {
      bestScore = score;
      bestPlatform = p;
    }
  }

  return bestPlatform;
}
