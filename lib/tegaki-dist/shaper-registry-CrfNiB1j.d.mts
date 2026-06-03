//#region src/types.d.ts
/**
 * Current bundle format version. Incremented when the bundle format changes
 * in a way that older engines cannot consume.
 */
declare const BUNDLE_VERSION = 0;
/**
 * Set of bundle versions that this engine can consume. The engine logs a
 * console warning (once per bundle) when it encounters a version outside
 * this set.
 */
declare const COMPATIBLE_BUNDLE_VERSIONS: ReadonlySet<number>;
type LineCap = 'round' | 'butt' | 'square';
interface Point {
  x: number;
  y: number;
}
interface TimedPoint extends Point {
  t: number;
  width: number;
}
interface BBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
interface Stroke {
  points: TimedPoint[];
  order: number;
  length: number;
  animationDuration: number;
  delay: number;
  /**
   * Draw-priority rank. `0` (default) is the glyph body; negative numbers are
   * rendered later within word-level scheduling so disconnected marks — i-dots,
   * Arabic nuqṭa, diacritics — follow after every body stroke in the word.
   * Only `0` and `-1` are used today; the range is open for future priority
   * tiers.
   */
  priority?: number;
}
interface GlyphData {
  char: string;
  unicode: number;
  advanceWidth: number;
  boundingBox: BBox;
  path: string;
  skeleton: Point[][];
  strokes: Stroke[];
  totalLength: number;
  totalAnimationDuration: number;
}
interface FontOutput {
  font: {
    family: string;
    style: string;
    unitsPerEm: number;
    ascender: number;
    descender: number;
    lineCap: LineCap;
  };
  glyphs: Record<string, GlyphData>;
}
interface PathCommand {
  type: 'M' | 'L' | 'Q' | 'C' | 'Z';
  x: number;
  y: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}
/**
 * Compact glyph data for rendering.
 * - `w`: advance width
 * - `t`: total animation duration
 * - `s`: strokes, each with `p` (points as `[x, y, width]` tuples), `d` (delay),
 *   `a` (animation duration), and optional `r` (priority — see `Stroke.priority`;
 *   omitted when `0`)
 */
interface TegakiGlyphData {
  w: number;
  t: number;
  s: {
    p: ([x: number, y: number, width: number] | number[])[];
    d: number;
    a: number;
    r?: number;
  }[];
}
type BaseEffectConfig = {
  enabled?: boolean;
};
/** A length value: plain number is pixels, string `"${number}em"` is relative to font size. */
type CSSLength = number | `${number}em`;
type TegakiEffectConfigs = {
  glow: BaseEffectConfig & {
    radius?: CSSLength;
    color?: string;
    offsetX?: number;
    offsetY?: number;
  };
  wobble: BaseEffectConfig & {
    amplitude?: number;
    frequency?: number;
    mode?: 'sine' | 'noise';
  };
  pressureWidth: BaseEffectConfig & {
    strength?: number;
  };
  taper: BaseEffectConfig & {
    startLength?: number;
    endLength?: number;
  };
  strokeGradient: BaseEffectConfig & {
    colors?: string[] | 'rainbow';
    saturation?: number;
    lightness?: number;
  };
  /**
   * Linear gradient spanning the whole text bounding box (CSS `background-clip: text` style).
   * Unlike `strokeGradient`, the color stops map to canvas-space position — the leftmost pixel of
   * the first glyph is `colors[0]` and the rightmost pixel of the last glyph is `colors[N]`,
   * regardless of stroke boundaries.
   *
   * - `colors`: ordered color stops (2+ stops).
   * - `angle`: direction in degrees. `0` = left→right (default). `90` = top→bottom.
   *   Positive values rotate clockwise (y-down screen convention).
   */
  globalGradient: BaseEffectConfig & {
    colors?: string[];
    angle?: number;
  };
};
type TegakiEffectName = keyof TegakiEffectConfigs;
/** Effects that can only appear once (cannot be used with custom keys). */
type TegakiSingletonEffectName = 'pressureWidth' | 'wobble' | 'taper' | 'strokeGradient' | 'globalGradient';
/** Effects that can be duplicated with custom keys. */
type TegakiMultiEffectName = Exclude<TegakiEffectName, TegakiSingletonEffectName>;
type TegakiCustomEffect = { [K in TegakiMultiEffectName]: TegakiEffectConfigs[K] & {
  effect: K;
  order?: number;
} }[TegakiMultiEffectName];
/** Validates an effects object: known keys infer `effect`, unknown keys require it (singleton effects excluded). */
type TegakiEffects<T> = { [K in keyof T]: K extends TegakiEffectName ? (TegakiEffectConfigs[K] & {
  effect?: K;
  order?: number;
}) | boolean : TegakiCustomEffect | boolean };
interface TegakiBundle {
  /** Bundle format version. Used by the engine to warn about incompatible bundles. */
  version?: number;
  family: string;
  /**
   * Original font family name, used as a CSS fallback for characters not in
   * the generated glyph set. Present when the bundle was generated from a
   * subset of the font (the default). When absent, `family` is the original
   * name (full-font bundle).
   */
  fullFamily?: string;
  lineCap: LineCap;
  fontUrl: string;
  /**
   * Additional subset font URLs (e.g. Arabic/Hebrew/CJK subsets served alongside
   * Latin). Registered under the same `family` as `fontUrl` for DOM layout and
   * fed into the shaper so cross-script text gets shaped against the subset
   * that actually contains its glyphs — required for positional forms in
   * Arabic, conjuncts in Indic, etc.
   */
  extraFontUrls?: string[];
  /** URL to the full (non-subsetted) font file bundled for fallback rendering. */
  fullFontUrl?: string;
  fontFaceCSS: string;
  unitsPerEm: number;
  ascender: number;
  descender: number;
  /** Default glyphs keyed by character. Used as a fallback when a shaped glyph id is absent. */
  glyphData: Record<string, TegakiGlyphData>;
  /**
   * Glyphs keyed by shaper output. Populated when the bundle was generated
   * with ligature/contextual-alternate support. Keys are the shaper's
   * opentype glyph id as a string (e.g. `"42"`) for glyphs from the primary
   * font, or `"<subsetIndex>:<gid>"` (e.g. `"1:42"`) for glyphs from an
   * `extraFontUrls` subset — subset index matches the position in
   * `extraFontUrls` + 1 (0 is reserved for the primary). Includes every glyph
   * the shaper emits — nominal, ligature, contextual variant — so a shaped
   * glyph never needs to fall back through `glyphData[char]`. That fallback
   * is brittle for complex-script clusters where `entry.char` is a
   * multi-codepoint grapheme (Devanagari `"हि"`, `"स्ते"`) and `glyphData`
   * is keyed per single codepoint. Misses still fall back to `glyphData[char]`
   * for the no-shaper path.
   */
  glyphDataById?: Record<string, TegakiGlyphData>;
  /**
   * OpenType feature tags the bundle was generated with (e.g. `['liga', 'calt']`).
   * The renderer enables these during shaping. Absent when no variant glyphs
   * were generated.
   */
  features?: readonly string[];
}
//#endregion
//#region src/lib/shaper.d.ts
interface ShapedGlyph {
  /**
   * Shaper output key — the opentype glyph id for primary-subset glyphs (e.g.
   * `"42"`), or `"<subsetIndex>:<gid>"` for glyphs from an `extraFontUrls`
   * subset (e.g. `"1:42"`). Used directly to look up `glyphDataById`.
   */
  g: string;
  /** Cluster offset (utf16 code-unit index into the shaped substring). */
  cl: number;
  /** X advance in font units. */
  ax: number;
  /** Y advance in font units. */
  ay: number;
  /** X offset (displacement from pen position) in font units. */
  dx: number;
  /** Y offset (displacement from pen position) in font units. */
  dy: number;
}
interface BundleShaper {
  shape(text: string): ShapedGlyph[];
}
//#endregion
//#region src/core/shaper-registry.d.ts
/**
 * Factory invoked once per bundle to produce (or decline) a shaper.
 *
 * Return `null` when the bundle doesn't need shaping or the environment can't
 * run it — the renderer falls back to its char-keyed glyph path. Return a
 * `Promise<BundleShaper>` when shaper init is async (wasm load, font fetch).
 */
type ShaperFactory = (bundle: TegakiBundle) => Promise<BundleShaper> | null;
/**
 * Register a shaper factory. Shaping is opt-in — without a registered factory,
 * the renderer iterates raw graphemes and uses the bundle's char-keyed
 * `glyphData` map. Use `tegaki/shaper-harfbuzz` for fonts that need complex
 * shaping (ligatures, contextual forms, Arabic/Indic scripts).
 *
 * Re-registering replaces the previous factory and invalidates the shaper
 * cache. Pass `null` to unregister.
 */
declare function registerShaper(f: ShaperFactory | null): void;
//#endregion
export { TimedPoint as S, TegakiEffectName as _, BBox as a, TegakiMultiEffectName as b, CSSLength as c, LineCap as d, PathCommand as f, TegakiEffectConfigs as g, TegakiBundle as h, ShapedGlyph as i, FontOutput as l, Stroke as m, registerShaper as n, BUNDLE_VERSION as o, Point as p, BundleShaper as r, COMPATIBLE_BUNDLE_VERSIONS as s, ShaperFactory as t, GlyphData as u, TegakiEffects as v, TegakiSingletonEffectName as x, TegakiGlyphData as y };
//# sourceMappingURL=shaper-registry-CrfNiB1j.d.mts.map