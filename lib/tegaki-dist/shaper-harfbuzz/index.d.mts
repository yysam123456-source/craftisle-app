import { t as ShaperFactory } from "../shaper-registry-CrfNiB1j.mjs";

//#region src/shaper-harfbuzz/index.d.ts
/**
 * Whitespace boundaries split shaping runs (see `BundleShaper.shape`).
 * Covers ASCII whitespace plus the Unicode space block — anything browsers
 * also treat as a word separator for line-breaking and text shaping.
 */
declare function isShapingWhitespace(code: number): boolean;
/** A run of consecutive characters with the same `isWhitespace` classification. */
interface ShapingSegment {
  text: string;
  /** UTF-16 offset of `text` in the original input. */
  offset: number;
  isWhitespace: boolean;
}
/**
 * Tokenise `text` into alternating whitespace / non-whitespace segments.
 * Browsers shape each non-whitespace word in isolation, so contextual
 * features (calt/liga/clig) never bridge a space; we want the same here so
 * canvas output matches the DOM overlay's glyphs.
 */
declare function splitForShaping(text: string): ShapingSegment[];
/** Build a harfbuzz feature string from bundle features, filtering shaper-managed enables. */
declare function toHbFeatureString(enabled: readonly string[]): string;
/**
 * Harfbuzz shaper factory. Pass to `TegakiEngine.registerShaper` once at app
 * startup to enable complex shaping (ligatures, contextual alternates,
 * Arabic/Indic scripts) for every bundle that declares `glyphDataById`.
 *
 * ```ts
 * import { TegakiEngine } from 'tegaki/core';
 * import harfbuzzShaper from 'tegaki/shaper-harfbuzz';
 * TegakiEngine.registerShaper(harfbuzzShaper);
 * ```
 *
 * Declines bundles without `glyphDataById` (nothing to resolve shaped glyph
 * ids against) and environments without `fetch` (SSR). The renderer's
 * char-keyed fallback handles both cases.
 */
declare const harfbuzzShaper: ShaperFactory;
//#endregion
export { ShapingSegment, harfbuzzShaper as default, isShapingWhitespace, splitForShaping, toHbFeatureString };
//# sourceMappingURL=index.d.mts.map