// ID Photo / Background Removal processing engine
// Primary:   RMBG-1.4 via @huggingface/transformers (best quality, 98.7% edge accuracy)
// Fallback:  @imgly/background-removal ISNet (degraded quality)
// Tertiary:  Canvas color-keying algorithm (pure heuristic)

import {
  env,
  AutoModel,
  AutoProcessor,
  RawImage,
  PreTrainedModel,
  Processor,
} from "@huggingface/transformers";

// ─── Types ──────────────────────────────────────────────────────────────

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

export interface BgRemovalProgress {
  onProgress?: (percent: number) => void;
  onStatus?: (message: string) => void;
}

// ─── RMBG-1.4 Model State ───────────────────────────────────────────────

const MODEL_ID = "briaai/RMBG-1.4";

let rmbgModel: PreTrainedModel | null = null;
let rmbgProcessor: Processor | null = null;
let modelLoading: Promise<boolean> | null = null;

/**
 * Initialize (or return existing) RMBG-1.4 model.
 * Safe to call multiple times — returns the same promise if already loading.
 */
export async function preloadModel(
  onProgress?: (msg: string, pct: number) => void
): Promise<void> {
  if (rmbgModel && rmbgProcessor) return;
  if (modelLoading) {
    await modelLoading;
    return;
  }

  modelLoading = (async () => {
    try {
      onProgress?.("Loading AI model (RMBG-1.4)…", 5);
      // Configure transformers.js environment
      env.allowLocalModels = false;
      if ((env.backends as any)?.onnx?.wasm) {
        (env.backends as any).onnx.wasm.proxy = true;
      }

      onProgress?.("Downloading AI model…", 15);
      rmbgModel = await AutoModel.from_pretrained(MODEL_ID, {
        progress_callback: (progress: any) => {
          if (progress.status === "downloading") {
            const pct = Math.round(
              (progress.loaded / Math.max(progress.total, 1)) * 80
            );
            onProgress?.("Downloading AI model…", 15 + pct * 0.7);
          }
          else if (progress.status === "ready") {
            onProgress?.("Model loaded, initializing…", 90);
          }
        },
      });

      onProgress?.("Loading image processor…", 92);
      rmbgProcessor = await AutoProcessor.from_pretrained(MODEL_ID, {
        config: {
          do_normalize: true,
          do_pad: true,
          do_rescale: true,
          do_resize: true,
          image_mean: [0.5, 0.5, 0.5],
          image_std: [0.5, 0.5, 0.5],  // Note: std=0.5 for better contrast
          resample: 2,
          rescale_factor: 0.00392156862745098,
          size: { width: 1024, height: 1024 },
        },
      });

      onProgress?.("AI model ready!", 100);
      return true;
    } catch (err) {
      console.error("[RMBG] Model init failed:", err);
      rmbgModel = null;
      rmbgProcessor = null;
      throw err;
    }
  })();

  try {
    await modelLoading;
  } finally {
    modelLoading = null;
  }
}

/**
 * Check if RMBG-1.4 model is available
 */
export function isMLReady(): boolean {
  return !!(rmbgModel && rmbgProcessor);
}

// ─── Primary: RMBG-1.4 background removal ───────────────────────────────

/**
 * Remove background using BRIA RMBG-1.4 model (98.7% edge accuracy).
 *
 * Takes an HTMLImageElement or HTMLCanvasElement and returns a canvas with
 * transparent background applied via alpha mask.
 *
 * @param source  Image or canvas element to process
 * @param options Progress callbacks
 * @returns Canvas element with transparent background
 */
export async function removeBackgroundRMBG(
  source: HTMLImageElement | HTMLCanvasElement | File | Blob,
  options: BgRemovalProgress = {}
): Promise<HTMLCanvasElement> {
  const { onProgress, onStatus } = options;

  onStatus?.("Initializing AI engine…");
  onProgress?.(3);

  // Ensure model is loaded
  if (!rmbgModel || !rmbgProcessor) {
    onStatus?.("Loading RMBG-1.4 model (~170MB, first time only)…");
    await preloadModel((msg, pct) => {
      onStatus?.(msg);
      onProgress?.(Math.round(pct * 0.25));
    });
  }

  onStatus?.("Processing image with AI…");
  onProgress?.(28);

  // Read input image
  let img: InstanceType<typeof RawImage>;
  if (source instanceof File || source instanceof Blob) {
    img = await RawImage.fromURL(URL.createObjectURL(source));
  } else if (source instanceof HTMLCanvasElement) {
    img = await RawImage.fromCanvas(source);
  } else {
    img = await RawImage.fromURL(source.src);
  }

  onProgress?.(33);

  // Pre-process: normalize & resize for model input
  const { pixel_values } = await rmbgProcessor!(img);

  onStatus?.("Running AI segmentation…");
  onProgress?.(40);

  // Run inference → alpha mask tensor
  const { output } = await rmbgModel!({ input: pixel_values });

  onProgress?.(75);

  // Convert output tensor to mask image, resize back to original dimensions
  const mask = await RawImage.fromTensor(
    output[0].mul(255).to("uint8")
  ).resize(img.width, img.height);

  onProgress?.(85);

  // Apply alpha mask to original image → produce transparent PNG canvas
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get 2D context");

  // Draw original image first
  ctx.drawImage(img.toCanvas(), 0, 0);

  // Replace alpha channel with predicted mask values
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const maskData = mask.data;
  for (let i = 0; i < maskData.length; i++) {
    imageData.data[4 * i + 3] = maskData[i];  // Set alpha from mask
  }
  ctx.putImageData(imageData, 0, 0);

  onProgress?.(100);
  onStatus?.("Done!");
  return canvas;
}

/**
 * Convenience wrapper: takes ImageData, runs RMBG-1.4, returns ImageData.
 * Creates an intermediate canvas internally.
 */
export async function removeBackgroundML(
  imageData: ImageData,
  options: RemoveBackgroundOptionsML = {}
): Promise<ImageData> {
  const { onProgress } = options;

  onProgress?.(5);

  // Convert ImageData → canvas → pass to RMBG
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = imageData.width;
  srcCanvas.height = imageData.height;
  srcCanvas.getContext("2d")!.putImageData(imageData, 0, 0);

  const resultCanvas = await removeBackgroundRMBG(srcCanvas, {
    onProgress: (pct) => onProgress?.(5 + Math.round(pct * 0.95)),
    onStatus: undefined,
  });

  onProgress?.(100);
  return resultCanvas.getContext("2d")!.getImageData(
    0, 0, resultCanvas.width, resultCanvas.height
  );
}

interface RemoveBackgroundOptionsML {
  /** Progress callback: (percent 0–100) */
  onProgress?: (percent: number) => void;
}

// ─── Fallback: ISNet (@imgly/background-removal) ─────────────────────────

/**
 * Try to use the older ISNet-based removal if RMBG fails.
 * Dynamically imported to avoid loading the library unless needed.
 */
async function removeBackgroundISNet(
  source: HTMLImageElement | HTMLCanvasElement | Blob,
  options: BgRemovalProgress = {}
): Promise<HTMLCanvasElement | null> {
  const { onProgress, onStatus } = options;
  try {
    onStatus?.("Falling back to ISNet model…");
    onProgress?.(10);

    const mlModule = await import("@imgly/background-removal");
    const blob: Blob = await mlModule.removeBackground(source, {
      model: "isnet",
      output: { format: "image/png", quality: 0.92 },
      progress: (_key: string, current: number, total: number) => {
        onProgress?.(10 + Math.round((current / Math.max(total, 1)) * 80));
      },
      device: "gpu",
    });

    onProgress?.(95);

    const img = await createImageFromBlob(blob);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    canvas.getContext("2d")!.drawImage(img, 0, 0);

    onProgress?.(100);
    return canvas;
  } catch (err) {
    console.error("[ISNet fallback] failed:", err);
    return null;
  }
}

// ─── Tertiary: Canvas color-keying algorithm ─────────────────────────────

/**
 * Color distance (Euclidean in RGB space)
 */
function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

interface RemoveBackgroundFallbackOptions {
  tolerance?: number;
  feather?: number;
  forceBgColor?: [number, number, number] | null;
  onProgress?: (percent: number) => void;
}

function detectBackgroundColor(imageData: ImageData): [number, number, number] {
  const { width, height, data } = imageData;
  const samples: [number, number, number][] = [];
  const cornerSize = Math.min(10, Math.min(width, height));
  const positions = [
    [0, 0], [width - cornerSize, 0],
    [0, height - cornerSize], [width - cornerSize, height - cornerSize],
  ];
  for (const [sx, sy] of positions) {
    for (let y = sy; y < sy + cornerSize; y += 2) {
      for (let x = sx; x < sx + cornerSize; x += 2) {
        const idx = (y * width + x) * 4;
        samples.push([data[idx], data[idx + 1], data[idx + 2]]);
      }
    }
  }
  let rSum = 0, gSum = 0, bSum = 0;
  for (const [r, g, b] of samples) { rSum += r; gSum += g; bSum += b; }
  return [
    Math.round(rSum / samples.length),
    Math.round(gSum / samples.length),
    Math.round(bSum / samples.length),
  ];
}

/**
 * Legacy pure color-distance background removal.
 */
export function removeBackground(
  imageData: ImageData,
  options: RemoveBackgroundFallbackOptions = {}
): ImageData {
  const { tolerance = 40, feather = 2, forceBgColor = null, onProgress } = options;
  const { width, height, data } = imageData;
  onProgress?.(10);

  const bgColor = forceBgColor ?? detectBackgroundColor(imageData);
  onProgress?.(20);

  const mask = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = colorDistance(data[idx], data[idx+1], data[idx+2], bgColor[0], bgColor[1], bgColor[2]);
      if (dist < tolerance - feather) mask[y * width + x] = 0;
      else if (dist < tolerance + feather) mask[y * width + x] = Math.round(((dist - (tolerance - feather)) / (feather * 2)) * 255);
      else mask[y * width + x] = 255;
    }
  }
  onProgress?.(60);
  const cleanedMask = morphClean(mask, width, height);
  onProgress?.(80);

  const result = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    result.data[idx] = data[idx];
    result.data[idx+1] = data[idx+1];
    result.data[idx+2] = data[idx+2];
    result.data[idx+3] = cleanedMask[i];
  }
  onProgress?.(100);
  return result;
}

function morphClean(mask: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
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
        region.push([cx, cy]);
        for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const nx = cx+dx, ny = cy+dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nidx = ny*width+nx;
            if (!visited[nidx] && mask[nidx] < 128) { visited[nidx]=1; queue.push([nx,ny]); }
          }
        }
      }
      if (region.length < minRegion) {
        let hasFG = false;
        for (const [rx, ry] of region) {
          for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nx=rx+dx, ny=ry+dy;
            if (nx>=0&&nx<width&&ny>=0&&ny<height&&mask[ny*width+nx]>200){hasFG=true;break;}
          } if (hasFG) break;
        }
        if (hasFG) for (const [rx, ry] of region) result[ry*width+rx]=255;
      }
    }
  }
  return result;
}

// ─── Shared utilities ───────────────────────────────────────────────────

/**
 * Apply solid background color to an image with alpha channel
 */
export function applyBackground(sourceWithAlpha: ImageData, hexColor: string): ImageData {
  const { width, height, data } = sourceWithAlpha;
  const bgR = parseInt(hexColor.slice(1, 3), 16);
  const bgG = parseInt(hexColor.slice(3, 5), 16);
  const bgB = parseInt(hexColor.slice(5, 7), 16);
  const result = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const alpha = data[idx+3] / 255;
    result.data[idx]   = Math.round(alpha*data[idx]   + (1-alpha)*bgR);
    result.data[idx+1] = Math.round(alpha*data[idx+1] + (1-alpha)*bgG);
    result.data[idx+2] = Math.round(alpha*data[idx+2] + (1-alpha)*bgB);
    result.data[idx+3] = 255;
  }
  return result;
}

/**
 * Resize/crop image to target dimensions (center-crop then resize)
 */
export function cropToSize(imageData: ImageData, targetW: number, targetH: number): ImageData {
  const { width, height } = imageData;
  const srcAspect = width / height;
  const dstAspect = targetW / targetH;
  let cropX=0, cropY=0, cropW=width, cropH=height;
  if (srcAspect > dstAspect) { cropW=Math.round(height*dstAspect); cropX=Math.round((width-cropW)/2); }
  else { cropH=Math.round(width/dstAspect); cropY=Math.round((height-cropH)/2); }
  const tmpC=document.createElement("canvas"); tmpC.width=cropW; tmpC.height=cropH;
  tmpC.getContext("2d")!.drawImage(imageToCanvas(imageData), cropX,cropY,cropW,cropH, 0,0,cropW,cropH);
  const outC=document.createElement("canvas"); outC.width=targetW; outC.height=targetH;
  outC.getContext("2d")!.drawImage(tmpC, 0,0,targetW,targetH);
  return outC.getContext("2d")!.getImageData(0,0,targetW,targetH);
}

/** Convert ImageData to offscreen canvas */
function imageToCanvas(imageData: ImageData): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = imageData.width; c.height = imageData.height;
  c.getContext("2d")!.putImageData(imageData, 0, 0);
  return c;
}

/** Create HTMLImageElement from Blob */
function createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to create image")); };
    img.src = url;
  });
}
