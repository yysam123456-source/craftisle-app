// ID Photo processing engine
// Models:
//   - ISNet (via @imgly/background-removal): fast, general purpose, ~5MB
//   - RMBG-1.4 (via @huggingface/transformers): high precision, human-focused, ~170MB
//   - Canvas fallback: color-keying, instant, no quality

// ─── Dynamic module loaders (runtime only, webpack cannot statically resolve) ──

let _mlModule: typeof import("@imgly/background-removal") | null = null;
let _tfModule: any = null;

async function getMLModule() {
  if (!_mlModule) {
    const _pkg = "@imgly/background-removal";
    // @ts-ignore — dynamic import, runtime-only
    _mlModule = await import(/* webpackIgnore: true */ _pkg);
  }
  return _mlModule;
}

async function getTFModule() {
  if (!_tfModule) {
    // Load @huggingface/transformers from CDN — not bundled by webpack
    const _url = "https://esm.sh/@huggingface/transformers@4.2.0";
    // @ts-ignore — dynamic import from CDN, runtime-only
    _tfModule = await import(/* webpackIgnore: true */ _url);
  }
  return _tfModule;
}

export interface IDPhotoSize {
  name: string;
  width: number;
  height: number;
  label?: string;
}

export const ID_PHOTO_SIZES: IDPhotoSize[] = [
  { name: "1 Inch", width: 295, height: 413, label: "25×35 mm" },
  { name: "2 Inch", width: 413, height: 579, label: "35×49 mm" },
  { name: "Passport", width: 330, height: 453, label: "35×45 mm" },
  { name: "US Visa", width: 600, height: 600, label: "51×51 mm" },
  { name: "UK Visa", width: 350, height: 450, label: "35×45 mm" },
  { name: "Schengen", width: 350, height: 450, label: "35×45 mm" },
];

export const BG_COLORS: { name: string; value: string }[] = [
  { name: "White", value: "#ffffff" },
  { name: "Blue", value: "#438edb" },
  { name: "Red", value: "#d9001b" },
  { name: "Light Blue", value: "#1a73e8" },
  { name: "Light Gray", value: "#f0f0f0" },
];

// ─── ML-based background removal (primary) ──────────────────────────────

let modelPreloaded = false;

/** Preload the ISNet model so first removal is faster. Safe to call multiple times. */
export async function preloadModel(
  onProgress?: (msg: string, pct: number) => void
): Promise<void> {
  if (modelPreloaded) return;
  onProgress?.("Loading AI model…", 10);
  const ml = await getMLModule();
  if (!ml) throw new Error("ML module not loaded");
  await ml.preload({
    progress: (key, current, total) => {
      if (key.includes("downloading") || key.includes("computing")) {
        onProgress?.("Loading AI model…", Math.round((current / total) * 90));
      }
    },
  });
  modelPreloaded = true;
}

interface RemoveBackgroundOptionsML {
  /** Progress callback: (message, percent 0–100) */
  onProgress?: (percent: number) => void;
}

/**
 * Remove background using the ISNet ML model.
 * Returns ImageData with alpha channel (transparent where bg was removed).
 */
export async function removeBackgroundML(
  imageData: ImageData,
  options: RemoveBackgroundOptionsML = {}
): Promise<ImageData> {
  const { onProgress } = options;

  onProgress?.(5);

  // Ensure model is loaded
  if (!modelPreloaded) {
    await preloadModel((msg, pct) => onProgress?.(Math.round(pct * 0.3)));
  }

  onProgress?.(30);

  // Run ML inference — output as PNG with transparency
  const ml = await getMLModule();
  if (!ml) throw new Error("ML module not loaded");
  const blob: Blob = await ml.removeBackground(imageData, {
    model: "isnet",
    output: {
      format: "image/png",
      quality: 0.92,
    },
    progress: (key, current, total) => {
      // Map internal progress to our scale (30% → 85%)
      onProgress?.(30 + Math.round((current / Math.max(total, 1)) * 55));
    },
    device: "gpu",
  });

  onProgress?.(85);

  // Convert Blob → Image → Canvas → ImageData
  const img = await createImageFromBlob(blob);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const result = ctx.getImageData(0, 0, canvas.width, canvas.height);

  onProgress?.(100);
  return result;
}

// ─── High-precision model: RMBG-1.4 via transformers.js ──────────────────

/**
 * Model options for background removal.
 * - "standard": ISNet (~5MB, fast, general purpose)
 * - "high-prec": RMBG-1.4 (~170MB, high precision, human-focused)
 */
export type BGRemovalModel = "standard" | "high-prec";

/** Preloaded image-segmentation pipeline for RMBG-1.4 */
let _rmbgPipeline: any = null;
let _rmbgPreloaded = false;

/**
 * Preload RMBG-1.4 high-precision model.
 * Uses transformers.js pipeline API (handles preprocessing/postprocessing automatically).
 */
export async function preloadRMBG(
  onProgress?: (msg: string, pct: number) => void
): Promise<void> {
  if (_rmbgPreloaded) return;
  console.log("[RMBG] Loading briaai/RMBG-1.4 from HuggingFace...");
  onProgress?.("Loading high-precision model (RMBG-1.4)…", 5);

  try {
    const tf = await getTFModule();
    const { pipeline } = tf;

    console.log("[RMBG] Creating image-segmentation pipeline...");
    onProgress?.("Downloading model weights…", 10);

    _rmbgPipeline = await pipeline("image-segmentation", "briaai/RMBG-1.4", {
      device: "wasm",
      progress_callback: (p: any) => {
        console.log(`[RMBG] Pipeline: status=${p.status} file=${p.file || "N/A"} ${p.loaded ?? "?"}/${p.total ?? "?"}`);
        if (p.status === "downloading") {
          const pct = p.total > 0 ? Math.round((p.loaded / p.total) * 80) : 10;
          onProgress?.(`Downloading RMBG-1.4 (${formatBytes(p.loaded)})…`, 10 + pct);
        } else if (p.status === "ready") {
          onProgress?.("Model loaded, initializing…", 92);
        }
      },
    });

    _rmbgPreloaded = true;
    console.log("[RMBG] Pipeline ready!");
    onProgress?.("High-precision model ready ✓", 100);
  } catch (err) {
    console.error("[RMBG] preload FAILED:", err);
    throw new Error(
      `Failed to load RMBG-1.4 model: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/** Format bytes to human-readable string */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

interface RemoveBackgroundRMBGOptions {
  onProgress?: (percent: number) => void;
}

/**
 * Remove background using RMBG-1.4 high-precision model.
 * Uses transformers.js pipeline API — much more reliable than manual AutoModel calls.
 * Optimized for human portraits: hair edges, shoulders, side profiles, complex lighting.
 */
export async function removeBackgroundRMBG(
  imageData: ImageData,
  options: RemoveBackgroundRMBGOptions = {}
): Promise<ImageData> {
  const { onProgress } = options;
  onProgress?.(5);
  console.log("[RMBG] Starting high-precision background removal");

  // Ensure model is loaded
  if (!_rmbgPreloaded || !_rmbgPipeline) {
    console.log("[RMBG] Model not preloaded, loading now...");
    await preloadRMBG((msg, pct) => onProgress?.(Math.round(pct * 0.45)));
  }

  if (!_rmbgPipeline) {
    throw new Error("RMBG-1.4 pipeline not initialized after preload");
  }

  onProgress?.(50);
  console.log("[RMBG] Converting ImageData to RawImage...");

  // ImageData → Canvas → Blob → URL → RawImage
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = imageData.width;
  tmpCanvas.height = imageData.height;
  tmpCanvas.getContext("2d")!.putImageData(imageData, 0, 0);
  const blob = await new Promise<Blob>((res) =>
    tmpCanvas.toBlob((b) => res(b!), "image/png")
  );
  const imgUrl = URL.createObjectURL(blob);

  try {
    onProgress?.(55);
    const tf = await getTFModule();
    const { RawImage } = tf;

    const rawImg = await RawImage.fromURL(imgUrl);
    console.log(`[RMBG] RawImage: ${rawImg.width}x${rawImg.height}`);

    URL.revokeObjectURL(imgUrl);
    onProgress?.(60);

    // Run the segmentation pipeline
    console.log("[RMBG] Running inference...");
    const result = await _rmbgPipeline(rawImg);
    onProgress?.(85);
    console.log("[RMBG] Inference done:", typeof result, Array.isArray(result) ? `array[${result.length}]` : "object");

    // ── Parse pipeline output into alpha mask ──
    let maskData: Float32Array | Uint8Array;
    let maskH: number;
    let maskW: number;

    if (Array.isArray(result) && result.length > 0) {
      const best = result.reduce((a: any, b: any) =>
        (a.score || 0) > (b.score || 0) ? a : b
      );
      const maskTensor = best.mask || best;

      if (!maskTensor || !maskTensor.dims || !maskTensor.data) {
        throw new Error(`Unexpected output item: keys=${Object.keys(best).join(",")}`);
      }

      const rawData = maskTensor.data;
      const len = rawData.length;
      const probs = new Float32Array(len);
      for (let i = 0; i < len; i++) probs[i] = 1 / (1 + Math.exp(-rawData[i]));

      const dims = maskTensor.dims;
      if (dims.length === 3) { maskH = dims[1]; maskW = dims[2]; }
      else if (dims.length === 2) { maskH = dims[0]; maskW = dims[1]; }
      else if (dims.length === 4 && dims[0] === 1 && dims[1] === 1) { maskH = dims[2]; maskW = dims[3]; }
      else { maskH = imageData.height; maskW = imageData.width; }
      maskData = probs;

    } else if (result && typeof result === "object") {
      const outputKey = Object.keys(result).find(k =>
        result[k]?.data instanceof Float32Array || result[k]?.data instanceof Uint8Array
      ) || "output";
      const t = result[outputKey];
      if (!t?.data) throw new Error(`No tensor in output. Keys: ${Object.keys(result).join(",")}`);

      const rawData = t.data;
      const len = rawData.length;
      const probs = new Float32Array(len);
      for (let i = 0; i < len; i++) probs[i] = 1 / (1 + Math.exp(-rawData[i]));
      const dims = t.dims;
      if (dims?.length === 4) { maskH = dims[2]; maskW = dims[3]; }
      else if (dims?.length === 3) { maskH = dims[1]; maskW = dims[2]; }
      else { maskH = imageData.height; maskW = imageData.width; }
      maskData = probs;
    } else {
      throw new Error(`Unexpected output: ${typeof result}`);
    }

    console.log(`[RMBG] Mask: ${maskW}x${maskH}, Image: ${imageData.width}x${imageData.height}`);

    onProgress?.(88);

    // Resize + apply as alpha
    let finalMask: Uint8ClampedArray;
    if (maskW !== imageData.width || maskH !== imageData.height) {
      finalMask = resizeMaskBilinear(maskData, maskH, maskW, imageData.height, imageData.width);
    } else {
      finalMask = new Uint8ClampedArray(imageData.width * imageData.height);
      for (let i = 0; i < maskData.length; i++) {
        finalMask[i] = Math.round(Math.max(0, Math.min(1, maskData[i])) * 255);
      }
    }

    onProgress?.(95);

    const out = new ImageData(imageData.width, imageData.height);
    for (let i = 0; i < imageData.width * imageData.height; i++) {
      const idx = i * 4;
      out.data[idx]     = imageData.data[idx];
      out.data[idx + 1] = imageData.data[idx + 1];
      out.data[idx + 2] = imageData.data[idx + 2];
      out.data[idx + 3] = finalMask[i];
    }

    onProgress?.(100);
    console.log("[RMBG] Success!");
    return out;
  } finally {
    if (imgUrl.startsWith("blob:")) URL.revokeObjectURL(imgUrl);
  }
}


/** Bilinear resize mask tensor to original image size */
function resizeMaskBilinear(
  mask: Float32Array | Uint8Array,
  srcH: number,
  srcW: number,
  dstH: number,
  dstW: number
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(dstH * dstW);
  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const sx = (dx + 0.5) * (srcW / dstW) - 0.5;
      const sy = (dy + 0.5) * (srcH / dstH) - 0.5;
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const x1 = Math.min(x0 + 1, srcW - 1);
      const y1 = Math.min(y0 + 1, srcH - 1);
      const wx = sx - x0;
      const wy = sy - y0;

      const v00 = mask[y0 * srcW + x0];
      const v10 = mask[y1 * srcW + x0];
      const v01 = mask[y0 * srcW + x1];
      const v11 = mask[y1 * srcW + x1];

      const val = (1 - wy) * ((1 - wx) * v00 + wx * v01) + wy * ((1 - wx) * v10 + wx * v11);
      result[dy * dstW + dx] = Math.round(Math.max(0, Math.min(1, val)) * 255);
    }
  }
  return result;
}
// ─── Fallback: Canvas color-keying algorithm ───────────────────────────

/**
 * Color distance (Euclidean in RGB space)
 */
function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  return Math.sqrt(
    (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2
  );
}

interface RemoveBackgroundFallbackOptions {
  tolerance?: number;
  feather?: number;
  forceBgColor?: [number, number, number] | null;
  onProgress?: (percent: number) => void;
}

/**
 * Detect the dominant background color from image edges (corners and borders).
 * Works well for photos taken against a solid-color backdrop.
 */
function detectBackgroundColor(imageData: ImageData): [number, number, number] {
  const { width, height, data } = imageData;
  const samples: [number, number, number][] = [];

  const cornerSize = Math.min(10, Math.min(width, height));
  const positions = [
    [0, 0],
    [width - cornerSize, 0],
    [0, height - cornerSize],
    [width - cornerSize, height - cornerSize],
  ];

  for (const [sx, sy] of positions) {
    for (let y = sy; y < sy + cornerSize; y += 2) {
      for (let x = sx; x < sx + cornerSize; x += 2) {
        const idx = (y * width + x) * 4;
        samples.push([data[idx], data[idx + 1], data[idx + 2]]);
      }
    }
  }

  let rSum = 0,
    gSum = 0,
    bSum = 0;
  for (const [r, g, b] of samples) {
    rSum += r;
    gSum += g;
    bSum += b;
  }
  return [
    Math.round(rSum / samples.length),
    Math.round(gSum / samples.length),
    Math.round(bSum / samples.length),
  ];
}

/**
 * Legacy fallback: pure color-distance background removal.
 * Only used when ML fails or is not available.
 */
export function removeBackground(
  imageData: ImageData,
  options: RemoveBackgroundFallbackOptions = {}
): ImageData {
  const {
    tolerance = 40,
    feather = 2,
    forceBgColor = null,
    onProgress,
  } = options;

  const { width, height, data } = imageData;

  onProgress?.(10);

  const bgColor =
    forceBgColor ?? detectBackgroundColor(imageData);

  onProgress?.(20);

  const mask = new Uint8ClampedArray(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = colorDistance(
        data[idx],
        data[idx + 1],
        data[idx + 2],
        bgColor[0],
        bgColor[1],
        bgColor[2]
      );

      if (dist < tolerance - feather) {
        mask[y * width + x] = 0;
      } else if (dist < tolerance + feather) {
        mask[y * width + x] = Math.round(
          ((dist - (tolerance - feather)) / (feather * 2)) * 255
        );
      } else {
        mask[y * width + x] = 255;
      }
    }
  }

  onProgress?.(60);
  const cleanedMask = morphClean(mask, width, height);
  onProgress?.(80);

  const result = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const alpha = cleanedMask[i];
    const idx = i * 4;
    result.data[idx] = data[idx];
    result.data[idx + 1] = data[idx + 1];
    result.data[idx + 2] = data[idx + 2];
    result.data[idx + 3] = alpha;
  }

  onProgress?.(100);
  return result;
}

/**
 * Simple morphological cleanup: remove isolated small regions
 */
function morphClean(
  mask: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(mask);
  const minRegion = 100;
  const visited = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx]) continue;
      if (mask[idx] > 200) continue;

      const queue: [number, number][] = [[x, y]];
      const region: [number, number][] = [];
      visited[idx] = 1;

      while (queue.length > 0 && region.length < minRegion * 3) {
        const [cx, cy] = queue.shift()!;
        const cidx = cy * width + cx;
        region.push([cx, cy]);

        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ]) {
          const nx = cx + dx,
            ny = cy + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nidx = ny * width + nx;
            if (!visited[nidx] && mask[nidx] < 128) {
              visited[nidx] = 1;
              queue.push([nx, ny]);
            }
          }
        }
      }

      if (region.length < minRegion) {
        let hasForegroundNeighbor = false;
        for (const [rx, ry] of region) {
          for (const [dx, dy] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ]) {
            const nx = rx + dx,
              ny = ry + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (mask[ny * width + nx] > 200) {
                hasForegroundNeighbor = true;
                break;
              }
            }
          }
          if (hasForegroundNeighbor) break;
        }

        if (hasForegroundNeighbor) {
          for (const [rx, ry] of region) {
            result[ry * width + rx] = 255;
          }
        }
      }
    }
  }

  return result;
}

// ─── Shared utilities ───────────────────────────────────────────────────

/**
 * Apply new background color to an image with alpha channel
 */
export function applyBackground(
  sourceWithAlpha: ImageData,
  hexColor: string
): ImageData {
  const { width, height, data } = sourceWithAlpha;
  const bgR = parseInt(hexColor.slice(1, 3), 16);
  const bgG = parseInt(hexColor.slice(3, 5), 16);
  const bgB = parseInt(hexColor.slice(5, 7), 16);

  const result = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const alpha = data[idx + 3] / 255;
    result.data[idx] = Math.round(alpha * data[idx] + (1 - alpha) * bgR);
    result.data[idx + 1] = Math.round(alpha * data[idx + 1] + (1 - alpha) * bgG);
    result.data[idx + 2] = Math.round(alpha * data[idx + 2] + (1 - alpha) * bgB);
    result.data[idx + 3] = 255;
  }

  return result;
}

/**
 * Resize/crop image to target dimensions (center-crop then resize)
 */
export function cropToSize(
  imageData: ImageData,
  targetWidth: number,
  targetHeight: number
): ImageData {
  const { width, height } = imageData;

  const srcAspect = width / height;
  const dstAspect = targetWidth / targetHeight;
  let cropX = 0,
    cropY = 0,
    cropW = width,
    cropH = height;

  if (srcAspect > dstAspect) {
    cropW = Math.round(height * dstAspect);
    cropX = Math.round((width - cropW) / 2);
  } else {
    cropH = Math.round(width / dstAspect);
    cropY = Math.round((height - cropH) / 2);
  }

  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = cropW;
  tmpCanvas.height = cropH;
  const tmpCtx = tmpCanvas.getContext("2d")!;

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = width;
  srcCanvas.height = height;
  srcCanvas.getContext("2d")!.putImageData(imageData, 0, 0);

  tmpCtx.drawImage(srcCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = targetWidth;
  outCanvas.height = targetHeight;
  const outCtx = outCanvas.getContext("2d")!;
  outCtx.drawImage(tmpCanvas, 0, 0, targetWidth, targetHeight);

  return outCtx.getImageData(0, 0, targetWidth, targetHeight);
}

// ─── Internal helpers ───────────────────────────────────────────────────

/** Create an HTMLImageElement from a Blob */
function createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to create image from ML result blob"));
    };
    img.src = url;
  });
}
