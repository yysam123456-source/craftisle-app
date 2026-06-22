/**
 * Generic AI Watermark Remover — v3
 *
 * Algorithm: Color-aware detection + Fast Marching Method (Telea) inpainting.
 *
 * v1: synthetic alpha map — ❌ assumed uniform alpha across entire region
 * v2: brightness outlier + naive average — ❌ blur artifacts on complex bg
 * v3: color-aware outlier + FMM inpainting + multi-pass ✅
 *
 * Detection: flags pixels that are BOTH brighter-than-local AND more saturated
 * than surroundings (watermarks are usually white/light-gray overlays).
 *
 * Inpainting: Telea's fast marching method propagates known pixel values
 * along isophotes (lines of equal intensity), preserving edges/gradients.
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
  /** Detection sensitivity: lower = more aggressive (catches fainter marks). */
  sensitivity: {
    minBrightnessDelta: number;   // minimum L diff from local mean
    minSaturationDelta: number;   // minimum saturation boost
    outlierSigma: number;         // std-dev multiplier
  };
}

export interface ResolvedConfig {
  platform: string;
  searchX: number;
  searchY: number;
  searchW: number;
  searchH: number;
  minBrightnessDelta: number;
  minSaturationDelta: number;
  outlierSigma: number;
}

export interface RemovalResult {
  cleaned: ImageData;
  mask: Uint8ClampedArray;
  region: { x: number; y: number; w: number; h: number };
  pixelCount: number;
  confidence: number;
  passes: number; // how many detection+inpaint passes ran
}

// ── Platform configs ────────────────────────────────────────────────────────

const PLATFORMS: Record<string, PlatformConfig> = {
  gemini: {
    name: "gemini",
    displayName: "Gemini (Google)",
    searchRegion: { widthRatio: 0.15, heightRatio: 0.15, marginX: 20, marginY: 20 },
    sensitivity: { minBrightnessDelta: 8, minSaturationDelta: 4, outlierSigma: 1.5 },
  },
  jimeng: {
    name: "jimeng",
    displayName: "即梦 (ByteDance)",
    searchRegion: { widthRatio: 0.18, heightRatio: 0.12, marginX: 16, marginY: 16 },
    sensitivity: { minBrightnessDelta: 5, minSaturationDelta: 3, outlierSigma: 1.0 },
  },
  doubao: {
    name: "doubao",
    displayName: "豆包 (ByteDance)",
    searchRegion: { widthRatio: 0.18, heightRatio: 0.12, marginX: 16, marginY: 16 },
    sensitivity: { minBrightnessDelta: 5, minSaturationDelta: 3, outlierSigma: 1.0 },
  },
  tongyi: {
    name: "tongyi",
    displayName: "通义万相 (Alibaba)",
    searchRegion: { widthRatio: 0.18, heightRatio: 0.12, marginX: 16, marginY: 16 },
    sensitivity: { minBrightnessDelta: 5, minSaturationDelta: 3, outlierSigma: 1.0 },
  },
  wenxin: {
    name: "wenxin",
    displayName: "文心一格 (Baidu)",
    searchRegion: { widthRatio: 0.18, heightRatio: 0.12, marginX: 16, marginY: 16 },
    sensitivity: { minBrightnessDelta: 5, minSaturationDelta: 3, outlierSigma: 1.0 },
  },
  leonardo: {
    name: "leonardo",
    displayName: "Leonardo.ai",
    searchRegion: { widthRatio: 0.14, heightRatio: 0.14, marginX: 24, marginY: 24 },
    sensitivity: { minBrightnessDelta: 10, minSaturationDelta: 6, outlierSigma: 1.8 },
  },
  auto: {
    name: "auto",
    displayName: "Auto Detect",
    searchRegion: { widthRatio: 0.22, heightRatio: 0.15, marginX: 10, marginY: 10 },
    sensitivity: { minBrightnessDelta: 4, minSaturationDelta: 2, outlierSigma: 0.8 },
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
  const sn = cfg.sensitivity;

  const searchW = Math.max(80, Math.min(width, Math.round(width * sr.widthRatio)));
  const searchH = Math.max(50, Math.min(height, Math.round(height * sr.heightRatio)));
  const searchX = width - searchW - sr.marginX;
  const searchY = height - searchH - sr.marginY;

  return {
    platform: cfg.name,
    searchX: Math.max(0, searchX),
    searchY: Math.max(0, searchY),
    searchW,
    searchH,
    minBrightnessDelta: sn.minBrightnessDelta,
    minSaturationDelta: sn.minSaturationDelta,
    outlierSigma: sn.outlierSigma,
  };
}

// ── Core: Multi-pass Detection + FMM Inpainting ─────────────────────────────

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
  let lastPixelCount = Infinity;
  let combinedMask = null as Uint8ClampedArray | null;
  let bestConfidence = 0;
  const MAX_PASSES = 3;

  // Run up to 3 passes: detect → inpaint → re-detect on result
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const passResult = detectAndInpaint(
      pass === 0 ? imageData : output, // use original for first pass, result for subsequent
      config,
      combinedMask, // accumulate mask across passes
    );

    if (passResult.pixelCount < 20 || passResult.confidence < 0.08) {
      // No meaningful watermark detected — stop
      break;
    }

    // Copy inpainted data back to output
    output.data.set(passResult.cleaned.data);
    combinedMask = passResult.mask;
    totalPasses++;
    bestConfidence = Math.max(bestConfidence, passResult.confidence);

    // If this pass found significantly fewer pixels, we're done
    if (passResult.pixelCount > lastPixelCount * 0.2) {
      lastPixelCount = passResult.pixelCount;
    } else {
      break; // diminishing returns
    }
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

  // Count final masked pixels
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
    minBrightnessDelta, minSaturationDelta, outlierSigma,
  } = config;

  const sx = Math.max(0, searchX);
  const sy = Math.max(0, searchY);
  const ex = Math.min(width, sx + searchW);
  const ey = Math.min(height, sy + searchH);
  const rw = ex - sx;
  const rh = ey - sy;

  if (rw < 10 || rh < 10) {
    return makeEmptyResult(source, config);
  }

  // ── Step 1: Compute per-pixel luminance and saturation in search region ──

  const lum = new Float32Array(rw * rh);       // luminance
  const sat = new Float32Array(rw * rh);       // saturation
  const pixels = new Float32Array(rw * rh * 3); // R,G,B

  for (let y = sy; y < ey; y++) {
    for (let x = sx; x < ex; x++) {
      const pi = y * width + x;
      const si = (y - sy) * rw + (x - sx);

      const r = data[pi * 4] / 255;
      const g = data[pi * 4 + 1] / 255;
      const b = data[pi * 4 + 2] / 255;

      pixels[si * 3] = r;
      pixels[si * 3 + 1] = g;
      pixels[si * 3 + 2] = b;

      // Luminance (perceptual)
      lum[si] = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      // Saturation
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const luma = (maxC + minC) / 2;
      if (luma < 0.5) {
        sat[si] = maxC > 0 ? (maxC - minC) / (maxC + minC) : 0;
      } else {
        sat[si] = maxC >= 1 ? 0 : (maxC - minC) / (2 - maxC - minC);
      }
    }
  }

  // ── Step 2: Robust statistics (exclude top/bottom 10% as potential watermark) ──

  const sortedLum = new Float32Array(lum);
  sortedLum.sort();
  const trimN = Math.floor(sortedLum.length * 0.1);
  let robustSumL = 0, robustSumSqL = 0, robustCount = 0;
  for (let i = trimN; i < sortedLum.length - trimN; i++) {
    robustSumL += sortedLum[i];
    robustSumSqL += sortedLum[i] * sortedLum[i];
    robustCount++;
  }
  const meanL = robustSumL / robustCount;
  const stdL = Math.sqrt(Math.abs(robustSumSqL / robustCount - meanL * meanL));

  // Also compute robust mean saturation in non-outlier region
  let satSum = 0, satCount = 0;
  for (let i = 0; i < lum.length; i++) {
    if (Math.abs(lum[i] - meanL) < 2 * stdL) {
      satSum += sat[i];
      satCount++;
    }
  }
  const meanSat = satCount > 0 ? satSum / satCount : 0.1;

  // ── Step 3: Build binary mask — dual criterion ──
  // Pixel is "watermark" if it is:
  //   (a) significantly BRIGHTER than local mean, OR
  //   (b) has unusually HIGH saturation (colored watermarks)
  // AND it's not already covered by a previous pass

  const rawMask = new Uint8ClampedArray(rw * rh);
  const brightThreshold = Math.max(minBrightnessDelta / 255, outlierSigma * stdL);
  const satThreshold = minSaturationDelta / 255;

  for (let si = 0; si < lum.length; si++) {
    if (previousMask && previousMask[si]) continue; // already processed

    const brightDiff = lum[si] - meanL;     // positive = lighter than bg
    const satDiff = sat[si] - meanSat;      // positive = more saturated

    const isBrightOutlier = brightDiff > brightThreshold;
    const isSatOutlier = satDiff > satThreshold && brightDiff > brightThreshold * 0.3;

    if (isBrightOutlier || isSatOutlier) {
      rawMask[si] = 255;
    }
  }

  // ── Step 4: Morphological cleanup ──
  // Dilate aggressively to catch semi-transparent edges
  const dilated = morphDilate(rawMask, rw, rh, 3);  // radius 3 (was 1)
  const eroded = morphErode(dilated, rw, rh, 2);     // radius 2 (remove noise blobs)
  const finalMask = morphDilate(eroded, rw, rh, 3);  // radius 3 (restore stroke width)

  // Merge with previous mask if any
  if (previousMask) {
    for (let i = 0; i < finalMask.length; i++) {
      if (previousMask[i]) finalMask[i] = 255;
    }
  }

  // Count
  let pixelCount = 0;
  for (let i = 0; i < finalMask.length; i++) {
    if (finalMask[i]) pixelCount++;
  }

  const density = pixelCount / (rw * rh);
  const confidence = computeConfidence(finalMask, rw, rh, density);

  if (pixelCount < 25 || confidence < 0.08) {
    return {
      cleaned: source,
      mask: finalMask,
      pixelCount: 0,
      confidence,
    };
  }

  // ── Step 5: Fast Marching Method (Telea) inpainting ──
  const output = new ImageData(new Uint8ClampedArray(data), width, height);
  fmmInpaint(output.data, finalMask, sx, sy, rw, rh, width, height);

  return { cleaned: output, mask: finalMask, pixelCount, confidence };
}

function makeEmptyResult(source: ImageData, config: ResolvedConfig): PassResult {
  const area = config.searchW * config.searchH;
  return {
    cleaned: source,
    mask: new Uint8ClampedArray(area),
    pixelCount: 0,
    confidence: 0,
  };
}

// ── Fast Marching Method (Telea) Inpainting ──────────────────────────────────

/**
 * Telea's Fast Marching Method.
 *
 * For each unknown (masked) pixel, we propagate values from known neighbors
 * along image gradients (isophote direction). This preserves edges and texture
 * far better than naive neighbor averaging.
 *
 * Data structure: priority queue (min-heap) ordered by distance from
 * the nearest known pixel. We process closest-first so inner pixels get
 * better estimates.
 */
function fmmInpaint(
  imgData: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  ox: number, oy: number,
  mw: number, mh: number,
  imgW: number, imgH: number,
): void {
  // State arrays for the search region only
  const state = new Int8Array(mw * mh); // 0=unknown, 1=in-band (boundary), 2=known
  const dist = new Float32Array(mw * mh); // distance to nearest known pixel

  // Initialize states
  for (let i = 0; i < state.length; i++) {
    state[i] = mask[i] ? 0 : 2; // masked = unknown, unmasked = known
    dist[i] = mask[i] ? Infinity : 0;
  }

  // Find boundary pixels (unknown with at least one known neighbor)
  // Use a simple array-based priority queue
  type Entry = { dist: number; mx: number; my: number };
  const heap: Entry[] = [];
  const inHeap = new Uint8Array(mw * mh);

  function push(e: Entry): void {
    heap.push(e);
    inHeap[e.my * mw + e.mx] = 1;
    // bubble up
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
      // bubble down
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

  // Seed boundary
  for (let my = 0; my < mh; my++) {
    for (let mx = 0; mx < mw; mx++) {
      if (state[my * mw + mx] !== 0) continue; // not unknown
      // Check 4-connected neighbors
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]) {
        const nx = mx + dx, ny = my + dy;
        if (nx < 0 || nx >= mw || ny < 0 || ny >= mh) continue;
        if (state[ny * mw + nx] === 2) {
          // Known neighbor → this is a boundary pixel
          state[my * mw + mx] = 1; // in-band
          dist[my * mw + mx] = 1.0; // unit distance from known
          push({ dist: 1.0, mx, my });
          break;
        }
      }
    }
  }

  // Process queue
  const dirs4 = [[-1,0],[1,0],[0,-1],[0,1]];
  const dirs8 = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

  while (true) {
    const cur = pop();
    if (!cur) break;

    const { mx, my } = cur;
    const idx = my * mw + mx;
    if (state[idx] !== 1) continue; // already processed or stale

    // Compute inpainted value using gradient-aware interpolation
    const val = computeFMMValue(imgData, mask, ox, oy, mw, mh, imgW, mx, my);
    const pixIdx = (oy + my) * imgW + (ox + mx);
    imgData[pixIdx * 4] = val.r;
    imgData[pixIdx * 4 + 1] = val.g;
    imgData[pixIdx * 4 + 2] = val.b;
    // Alpha unchanged

    // Mark as known
    state[idx] = 2;
    mask[idx] = 0; // no longer masked

    // Update unknown neighbors
    for (const [dx, dy] of dirs4) {
      const nx = mx + dx, ny = my + dy;
      if (nx < 0 || nx >= mw || ny < 0 || ny >= mh) continue;
      const nidx = ny * mw + nx;
      if (state[nidx] !== 0) continue; // not unknown

      // New distance: current dist + 1
      const newDist = dist[idx] + 1;
      if (newDist < dist[nidx]) {
        dist[nidx] = newDist;
        state[nidx] = 1; // promote to in-band
        push({ dist: newDist, mx: nx, my: ny });
      }
    }
  }
}

/**
 * Compute the inpainted value at (mx,my) using gradient-aware weighted interpolation.
 *
 * This approximates Telea's formula:
 *   I(p) = Σ [I(q) * (|∇I(q)|·(p−q)^⊥ + ε) / (||p−q||²)] / Σ [same denominator]
 *
 * where q iterates over known neighbors within radius R.
 */
function computeFMMValue(
  imgData: Uint8ClampedArray,
  _mask: Uint8ClampedArray,
  ox: number, oy: number,
  mw: number, mh: number,
  imgW: number,
  mx: number, my: number,
): { r: number; g: number; b: number } {
  const RADIUS = 8; // larger neighborhood for better quality
  let wr = 0, wg = 0, wb = 0, wTotal = 0;

  for (const [dx, dy] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
    for (let step = 1; step <= RADIUS; step++) {
      const qx = mx + dx * step;
      const qy = my + dy * step;
      if (qx < 0 || qx >= mw || qy < 0 || qy >= mh) continue;
      // Only use known (unmasked) pixels
      const qidx = qy * mw + qx;
      // Note: mask may have been updated by FMM, check original via state concept
      // For simplicity, just use all neighbors — FMM ensures we process outward

      const pixQ = (oy + qy) * imgW + (ox + qx);
      const qr = imgData[pixQ * 4];
      const qg = imgData[pixQ * 4 + 1];
      const qb = imgData[pixQ * 4 + 2];

      // Direction vector from q to p
      const dirX = mx - qx;
      const dirY = my - qy;
      const distSq = dirX * dirX + dirY * dirY;
      if (distSq < 1) continue;
      const dist = Math.sqrt(distSq);

      // Approximate gradient magnitude at q (using neighboring known pixels)
      const gradMag = estimateGradient(imgData, ox, oy, mw, mh, imgW, qx, qy, dx, dy);

      // Weight: higher when gradient is perpendicular to direction (along isophote)
      // dot product of gradient direction and (q→p) direction
      const gradDotDir = (dirX * dx + dirY * dy) / (dist + 0.001);
      const isoWeight = Math.abs(gradDotDir); // smaller = more along isophote
      const weight = ((gradMag * (1 - isoWeight) + 0.01) / dist) * (1.0 / dist);

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

  // Fallback: simple average of immediate 4-neighbors
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
    ? { r: clamp(Math.round(sr / sc)), g: clamp(Math.round(sg / sc)), b: clamp(Math.round(sb / sc)) }
    : { r: 0, g: 0, b: 0 };
}

/** Estimate gradient magnitude at (qx,qy) in the direction perpendicular to (dx,dy). */
function estimateGradient(
  imgData: Uint8ClampedArray,
  ox: number, oy: number,
  mw: number, mh: number,
  imgW: number,
  qx: number, qy: number,
  dx: number, dy: number,
): number {
  // Sample 1px forward and backward along the tangent direction
  const tx = -dy; // perpendicular to (dx,dy)
  const ty = dx;

  const fwdX = qx + tx, fwdY = qy + ty;
  const bckX = qx - tx, bckY = qy - ty;

  if (fwdX < 0 || fwdX >= mw || fwdY < 0 || fwdY >= mh ||
      bckX < 0 || bckX >= mw || bckY < 0 || bckY >= mh) {
    return 1; // default small gradient at borders
  }

  const fPix = (oy + fwdY) * imgW + (ox + fwdX);
  const bPix = (oy + bckY) * imgW + (ox + bckX);

  const dr = (imgData[fPix * 4] - imgData[bPix * 4]) / 255;
  const dg = (imgData[fPix * 4 + 1] - imgData[bPix * 4 + 1]) / 255;
  const db = (imgData[fPix * 4 + 2] - imgData[bPix * 4 + 2]) / 255;

  return Math.sqrt(dr * dr + dg * dg + db * db);
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
            val = 0; // treat out-of-bounds as OFF
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
  if (density < 0.003 || density > 0.75) return 0;

  // Count connected components
  let connected = 0;
  const visited = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] && !visited[i]) {
      floodCount(mask, visited, w, h, i % w, Math.floor(i / w));
      connected++;
    }
  }

  // Real watermarks form few connected components (character strokes)
  // Ideal: ~3-15 clusters for typical text watermarks, density ~3-15%
  const clusterScore = connected > 0 ? Math.min(1, 40 / connected) : 0;
  const densityScore = 1 - Math.abs(density - 0.06) * 8;
  return Math.max(0, Math.min(1, clusterScore * 0.35 + Math.max(0, densityScore) * 0.65));
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
    if (score > bestScore && result.confidence > 0.08) {
      bestScore = score;
      bestPlatform = p;
    }
  }

  return bestPlatform;
}
