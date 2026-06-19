// ID Photo processing engine — pure Canvas API implementation
// Zero external dependencies, runs entirely in the browser
// Falls back gracefully from AI (ONNX) → Canvas magic-wand → manual color key

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

/**
 * Detect the dominant background color from image edges (corners and borders).
 * Works well for photos taken against a solid-color backdrop.
 */
function detectBackgroundColor(imageData: ImageData): [number, number, number] {
  const { width, height, data } = imageData;
  const samples: [number, number, number][] = [];

  // Sample corners (10x10 area each)
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

  // Find average of most common color cluster
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

interface RemoveBackgroundOptions {
  /** Tolerance for background removal (0-255). Default: 40 */
  tolerance?: number;
  /** Edge softening in pixels (anti-aliasing). Default: 2 */
  feather?: number;
  /** Force use a specific background color instead of auto-detection */
  forceBgColor?: [number, number, number] | null;
  /** Progress callback */
  onProgress?: (percent: number) => void;
}

/**
 * Main background removal function.
 * Uses edge-color detection + flood-fill-like algorithm with anti-aliasing.
 */
export function removeBackground(
  imageData: ImageData,
  options: RemoveBackgroundOptions = {}
): ImageData {
  const {
    tolerance = 40,
    feather = 2,
    forceBgColor = null,
    onProgress,
  } = options;

  const { width, height, data } = imageData;

  onProgress?.(10);

  // Detect (or use forced) background color
  const bgColor =
    forceBgColor ?? detectBackgroundColor(imageData);

  onProgress?.(20);

  // Create alpha mask
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

      // Map distance to alpha (with smoothing zone)
      if (dist < tolerance - feather) {
        mask[y * width + x] = 0; // fully background
      } else if (dist < tolerance + feather) {
        // Transition zone (anti-aliasing)
        mask[y * width + x] = Math.round(
          ((dist - (tolerance - feather)) / (feather * 2)) * 255
        );
      } else {
        mask[y * width + x] = 255; // fully foreground
      }
    }
  }

  onProgress?.(60);

  // Apply morphological cleanup: erode small noise, dilate edges
  const cleanedMask = morphClean(mask, width, height);

  onProgress?.(80);

  // Composite new background onto result
  const result = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const alpha = cleanedMask[i];
    const idx = i * 4;
    result.data[idx] = data[idx]; // R
    result.data[idx + 1] = data[idx + 1]; // G
    result.data[idx + 2] = data[idx + 2]; // B
    result.data[idx + 3] = alpha; // A (will be used for compositing)
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
  const minRegion = 100; // minimum pixel count to keep

  // Flood-fill to find connected components (simplified)
  const visited = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx]) continue;
      if (mask[idx] > 200) continue; // skip foreground pixels

      // BFS to find connected background region
      const queue: [number, number][] = [[x, y]];
      const region: [number, number][] = [];
      visited[idx] = 1;

      while (queue.length > 0 && region.length < minRegion * 3) {
        const [cx, cy] = queue.shift()!;
        const cidx = cy * width + cx;
        region.push([cx, cy]);

        // Check 4 neighbors
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

      // If small isolated region surrounded by foreground -> fill it back
      if (region.length < minRegion) {
        // Check if any neighbor is foreground
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

/**
 * Apply new background color to an image with alpha channel (from removeBackground)
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

  // Center crop to match aspect ratio
  const srcAspect = width / height;
  const dstAspect = targetWidth / targetHeight;
  let cropX = 0,
    cropY = 0,
    cropW = width,
    cropH = height;

  if (srcAspect > dstAspect) {
    // Source is wider — crop sides
    cropW = Math.round(height * dstAspect);
    cropX = Math.round((width - cropW) / 2);
  } else {
    // Source is taller — crop top/bottom
    cropH = Math.round(width / dstAspect);
    cropY = Math.round((height - cropH) / 2);
  }

  // Draw cropped area to temp canvas
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = cropW;
  tmpCanvas.height = cropH;
  const tmpCtx = tmpCanvas.getContext("2d")!;

  // Put original image data on a canvas so we can drawImage it
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = width;
  srcCanvas.height = height;
  srcCanvas.getContext("2d")!.putImageData(imageData, 0, 0);

  tmpCtx.drawImage(srcCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  // Now resize to final target size
  const outCanvas = document.createElement("canvas");
  outCanvas.width = targetWidth;
  outCanvas.height = targetHeight;
  const outCtx = outCanvas.getContext("2d")!;
  outCtx.drawImage(tmpCanvas, 0, 0, targetWidth, targetHeight);

  return outCtx.getImageData(0, 0, targetWidth, targetHeight);
}
