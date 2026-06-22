/**
 * Generic AI watermark remover — multi-platform support.
 *
 * Principle: most AI image tools add a semi-transparent logo/text in the
 * bottom-right corner using alpha blending:
 *   watermarked = α·logo + (1−α)·original
 *
 * Given the watermark alpha map (pre-calibrated per platform), we recover:
 *   original = (watermarked − α·logo) / (1−α)
 *
 * Supported platforms (add more by extending PLATFORMS below):
 *   - gemini      (Google Gemini, ⭐ star logo)
 *   - doubao     (字节豆包, 文字水印)
 *   - jimeng     (即梦, 文字/logo 水印)
 *   - tongyi     (通义万相, 文字水印)
 *   - wenxin     (文心一格, 文字水印)
 *   - leonardo   (Leonardo.ai, logo)
 *   - playground  (OpenAI Playground, DALL-E 2/3)
 */

// ── Platform database ────────────────────────────────────────────────────────

export interface PlatformConfig {
  name: string;
  displayName: string;
  /**
   * Known output sizes → watermark config.
   * key = "WxH"  or  "maxDim"  (max dimension, for flexible sizes)
   * value = { logoSize, marginRight, marginBottom, alpha (0-1) }
   */
  sizeRules: SizeRule[];
  /**
   * Fallback: if no size rule matches, use this config.
   * logoSize: watermark logo/tex size in px
   * marginRight: pixels from right edge
   * marginBottom: pixels from bottom edge
   * alpha: estimated max alpha (0-1), used to generate a synthetic alpha map
   * textColor: [R,G,B] of the watermark text/logo (for synthetic map)
   */
  fallback: FallbackConfig;
  /**
   * If true, the watermark is a known logo image (not just text).
   * We'll need an alpha map image for best results.
   */
  hasLogoImage: boolean;
}

export interface SizeRule {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  logoSize: number;
  marginRight: number;
  marginBottom: number;
  alpha?: number; // override fallback alpha
}

export interface FallbackConfig {
  logoSize: number;
  marginRight: number;
  marginBottom: number;
  alpha: number;
  textColor: [number, number, number]; // RGB
}

// ── Built-in platform configs ──────────────────────────────────────────────

const PLATFORMS: Record<string, PlatformConfig> = {
  gemini: {
    name: "gemini",
    displayName: "Gemini (Google)",
    hasLogoImage: true,
    sizeRules: [
      // Gemini's known output sizes
      { minWidth: 1024, minHeight: 1024, logoSize: 96, marginRight: 64, marginBottom: 64, alpha: 0.25 },
      { minWidth: 0,    minHeight: 0,    logoSize: 48, marginRight: 32, marginBottom: 32, alpha: 0.20 },
    ],
    fallback: { logoSize: 48, marginRight: 32, marginBottom: 32, alpha: 0.20, textColor: [255, 255, 255] },
  },

  doubao: {
    name: "doubao",
    displayName: "豆包 (ByteDance)",
    hasLogoImage: false, // text watermark
    sizeRules: [
      { minWidth: 1024, minHeight: 1024, logoSize: 80, marginRight: 40, marginBottom: 40, alpha: 0.18 },
      { minWidth: 0,    minHeight: 0,    logoSize: 60, marginRight: 24, marginBottom: 24, alpha: 0.15 },
    ],
    fallback: { logoSize: 60, marginRight: 24, marginBottom: 24, alpha: 0.15, textColor: [255, 255, 255] },
  },

  jimeng: {
    name: "jimeng",
    displayName: "即梦 (ByteDance)",
    hasLogoImage: false,
    sizeRules: [
      { minWidth: 1024, minHeight: 1024, logoSize: 72, marginRight: 48, marginBottom: 48, alpha: 0.16 },
      { minWidth: 0,    minHeight: 0,    logoSize: 56, marginRight: 28, marginBottom: 28, alpha: 0.14 },
    ],
    fallback: { logoSize: 56, marginRight: 28, marginBottom: 28, alpha: 0.14, textColor: [255, 255, 255] },
  },

  tongyi: {
    name: "tongyi",
    displayName: "通义万相 (Alibaba)",
    hasLogoImage: false,
    sizeRules: [
      { minWidth: 1024, minHeight: 1024, logoSize: 88, marginRight: 44, marginBottom: 44, alpha: 0.17 },
      { minWidth: 0,    minHeight: 0,    logoSize: 64, marginRight: 32, marginBottom: 32, alpha: 0.15 },
    ],
    fallback: { logoSize: 64, marginRight: 32, marginBottom: 32, alpha: 0.15, textColor: [255, 255, 255] },
  },

  wenxin: {
    name: "wenxin",
    displayName: "文心一格 (Baidu)",
    hasLogoImage: false,
    sizeRules: [
      { minWidth: 1024, minHeight: 1024, logoSize: 80, marginRight: 40, marginBottom: 40, alpha: 0.16 },
      { minWidth: 0,    minHeight: 0,    logoSize: 60, marginRight: 30, marginBottom: 30, alpha: 0.14 },
    ],
    fallback: { logoSize: 60, marginRight: 30, marginBottom: 30, alpha: 0.14, textColor: [255, 255, 255] },
  },

  leonardo: {
    name: "leonardo",
    displayName: "Leonardo.ai",
    hasLogoImage: true,
    sizeRules: [
      { minWidth: 1024, minHeight: 1024, logoSize: 64, marginRight: 48, marginBottom: 48, alpha: 0.22 },
      { minWidth: 0,    minHeight: 0,    logoSize: 48, marginRight: 32, marginBottom: 32, alpha: 0.20 },
    ],
    fallback: { logoSize: 48, marginRight: 32, marginBottom: 32, alpha: 0.20, textColor: [255, 255, 255] },
  },

  auto: {
    name: "auto",
    displayName: "Auto Detect",
    hasLogoImage: false,
    sizeRules: [],
    fallback: { logoSize: 48, marginRight: 32, marginBottom: 32, alpha: 0.18, textColor: [255, 255, 255] },
  },
};

export function getPlatformNames(): string[] {
  return Object.keys(PLATFORMS);
}

export function getPlatformConfig(name: string): PlatformConfig | null {
  return PLATFORMS[name] ?? null;
}

// ── Config resolution ──────────────────────────────────────────────────────

export interface ResolvedConfig {
  platform: string;
  logoSize: number;
  marginRight: number;
  marginBottom: number;
  alpha: number;
  textColor: [number, number, number];
}

export function resolveConfig(
  platform: string,
  width: number,
  height: number,
): ResolvedConfig {
  const cfg = PLATFORMS[platform];
  if (!cfg) return resolveConfig("auto", width, height);

  // Try size rules (first match wins)
  for (const rule of cfg.sizeRules) {
    const wOk = (rule.minWidth ?? 0) <= width && width <= (rule.maxWidth ?? Infinity);
    const hOk = (rule.minHeight ?? 0) <= height && height <= (rule.maxHeight ?? Infinity);
    if (wOk && hOk) {
      return {
        platform: cfg.name,
        logoSize: rule.logoSize,
        marginRight: rule.marginRight,
        marginBottom: rule.marginBottom,
        alpha: rule.alpha ?? cfg.fallback.alpha,
        textColor: cfg.fallback.textColor,
      };
    }
  }

  return {
    platform: cfg.name,
    logoSize: cfg.fallback.logoSize,
    marginRight: cfg.fallback.marginRight,
    marginBottom: cfg.fallback.marginBottom,
    alpha: cfg.fallback.alpha,
    textColor: cfg.fallback.textColor,
  };
}

// ── Synthetic alpha map generation ─────────────────────────────────────────
// For platforms without a pre-calibrated alpha map image,
// generate a synthetic one based on typical watermark appearance.
//
// Typical AI watermark: semi-transparent text/logo in bottom-right corner.
// The alpha map is usually:
//   - high alpha at the watermark logo/text pixels
//   - 0 (or very low) elsewhere
//
// We approximate with a soft radial gradient + rectangular region.

export function generateSyntheticAlphaMap(
  logoSize: number,
  alphaMax: number, // 0-1
  type: "logo" | "text" = "text",
): Float32Array {
  const map = new Float32Array(logoSize * logoSize);
  const cx = logoSize / 2;
  const cy = logoSize / 2;
  const maxR = logoSize / 2;

  for (let y = 0; y < logoSize; y++) {
    for (let x = 0; x < logoSize; x++) {
      if (type === "logo") {
        // Radial gradient: strongest at center
        const dx = x - cx;
        const dy = y - cy;
        const r = Math.sqrt(dx * dx + dy * dy) / maxR;
        const a = r < 1 ? alphaMax * (1 - r * r) : 0;
        map[y * logoSize + x] = Math.max(0, Math.min(1, a));
      } else {
        // Text-like: assume full opacity in most of the region, with soft edges
        const edgeDist = Math.min(x, y, logoSize - 1 - x, logoSize - 1 - y);
        const softEdge = 4;
        const edgeAlpha = edgeDist < softEdge
          ? (alphaMax * edgeDist) / softEdge
          : alphaMax;
        // Slightly lower alpha in center to simulate text being not fully opaque
        const dx = x - cx;
        const dy = y - cy;
        const centerBoost = 1 - 0.3 * Math.exp(-(dx * dx + dy * dy) / (2 * (logoSize / 6) ** 2));
        map[y * logoSize + x] = Math.max(0, Math.min(1, edgeAlpha * centerBoost));
      }
    }
  }

  return map;
}

// ── Actual watermark removal ───────────────────────────────────────────────

/**
 * Remove watermark from an ImageData using reverse alpha blending.
 *
 * @param imageData - The input image (RGBA)
 * @param config    - Resolved platform config
 * @returns         - The cleaned ImageData (new object, original not mutated)
 *
 * Algorithm:
 *   For each pixel in the watermark region:
 *     w = alphaMap[i]
 *     wP = watermarked pixel (R,G,B)
 *     logoColor = textColor (or average of watermark region if we could extract it)
 *
 *     originalR = (wP_R - w * logoColor_R) / (1 - w)
 *     ... similarly for G, B
 *
 *   Clamp to [0, 255].
 *
 * Limitation: this assumes the logo color is known and uniform.
 * For text watermarks, the actual text color varies slightly but is usually
 * near white (255,255,255) or light gray.
 */
export function removeWatermark(
  imageData: ImageData,
  config: ResolvedConfig,
  options: { useGeminiEngine?: boolean } = {},
): { cleaned: ImageData; region: { x: number; y: number; w: number; h: number } } {
  const { width, height, data } = imageData;
  const cleaned = new ImageData(new Uint8ClampedArray(data), width, height);

  // Watermark region
  const rx = width - config.marginRight - config.logoSize;
  const ry = height - config.marginBottom - config.logoSize;
  const rw = config.logoSize;
  const rh = config.logoSize;

  // Generate synthetic alpha map
  const alphaMap = generateSyntheticAlphaMap(
    config.logoSize,
    config.alpha,
    PLATFORMS[config.platform]?.hasLogoImage ? "logo" : "text",
  );

  const [lr, lg, lb] = config.textColor;

  for (let y = ry; y < ry + rh; y++) {
    if (y < 0 || y >= height) continue;
    for (let x = rx; x < rx + rw; x++) {
      if (x < 0 || x >= width) continue;

      const pi = y * width + x;
      const si = (y - ry) * rw + (x - rx);

      const w = alphaMap[si];
      if (w < 0.01) continue; // Nearly transparent, skip

      const denom = 1 - w;
      if (denom < 0.01) {
        // Fully opaque watermark pixel — can't recover, try to inpaint from neighbors later
        continue;
      }

      for (let c = 0; c < 3; c++) {
        const wp = data[pi * 4 + c];
        const logoC = c === 0 ? lr : c === 1 ? lg : lb;
        const recovered = (wp - w * logoC) / denom;
        cleaned.data[pi * 4 + c] = Math.max(0, Math.min(255, Math.round(recovered)));
      }
      // Keep original alpha
    }
  }

  return {
    cleaned,
    region: { x: rx, y: ry, w: rw, h: rh },
  };
}

/**
 * Try to auto-detect which platform by checking watermark region characteristics.
 * This is a heuristic: check if the bottom-right corner region has
 * consistent "watermark-like" pixels (slightly more white-ish, semi-transparent).
 */
export function autoDetectPlatform(
  imageData: ImageData,
  platforms: string[] = ["gemini", "doubao", "jimeng", "tongyi", "wenxin"],
): string {
  const { width, height, data } = imageData;

  let bestPlatform = "auto";
  let bestScore = -Infinity;

  for (const p of platforms) {
    const cfg = PLATFORMS[p];
    if (!cfg) continue;

    const resolved = resolveConfig(p, width, height);
    const rx = width - resolved.marginRight - resolved.logoSize;
    const ry = height - resolved.marginBottom - resolved.logoSize;
    const rw = resolved.logoSize;
    const rh = resolved.logoSize;

    // Score: how "watermark-like" is this region?
    // Watermark pixels tend to be:
    //   - lighter than surrounding (white-ish logo on dark-ish image)
    //   - or darker on light image (dark logo)
    // Heuristic: compute avg brightness of region vs. region just outside it
    let regionBrightness = 0;
    let outerBrightness = 0;
    let regionCount = 0;
    let outerCount = 0;

    for (let y = Math.max(0, ry - 10); y < Math.min(height, ry + rh + 10); y++) {
      for (let x = Math.max(0, rx - 10); x < Math.min(width, rx + rw + 10); x++) {
        const pi = y * width + x;
        const b = (data[pi * 4] + data[pi * 4 + 1] + data[pi * 4 + 2]) / 3;
        if (y >= ry && y < ry + rh && x >= rx && x < rx + rw) {
          regionBrightness += b;
          regionCount++;
        } else {
          outerBrightness += b;
          outerCount++;
        }
      }
    }

    if (regionCount === 0) continue;

    const regionAvg = regionBrightness / regionCount;
    const outerAvg = outerBrightness / outerCount;
    const diff = Math.abs(regionAvg - outerAvg);

    // Also check if region has "white-ish" pixels (typical of AI watermarks)
    let whitePixels = 0;
    for (let y = ry; y < ry + rh && y < height; y++) {
      for (let x = rx; x < rx + rw && x < width; x++) {
        const pi = y * width + x;
        const r = data[pi * 4];
        const g = data[pi * 4 + 1];
        const b = data[pi * 4 + 2];
        if (r > 200 && g > 200 && b > 200) whitePixels++;
      }
    }
    const whiteRatio = whitePixels / (rw * rh);

    const score = diff * 0.5 + whiteRatio * 255 * 0.5;

    if (score > bestScore) {
      bestScore = score;
      bestPlatform = p;
    }
  }

  return bestPlatform;
}
