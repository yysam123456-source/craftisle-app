import { S as TimedPoint, _ as TegakiEffectName, a as BBox, b as TegakiMultiEffectName, c as CSSLength, d as LineCap, f as PathCommand, g as TegakiEffectConfigs, h as TegakiBundle, i as ShapedGlyph, l as FontOutput, m as Stroke, o as BUNDLE_VERSION, p as Point, r as BundleShaper, s as COMPATIBLE_BUNDLE_VERSIONS, t as ShaperFactory, u as GlyphData, v as TegakiEffects, x as TegakiSingletonEffectName, y as TegakiGlyphData } from "../shaper-registry-CrfNiB1j.mjs";
import { A as TimelineEntry, C as resolveEffects, D as computeTextLayout, E as computeLayoutBbox, M as computeTimeline, O as Timeline, S as hasRenderHooks, T as TextLayout, _ as RenderStageContext, a as CreateElementFn, b as findEffects, c as TimeControlMode, d as getBundle, f as registerBundle, g as EffectDefinition, h as drawGlyph, i as TegakiEngine, j as TimelineStaggerConfig, k as TimelineConfig, l as TimeControlProp, m as ensureFontFace, n as buildRootProps, o as TegakiEngineOptions, p as resolveBundle, r as domCreateElement, s as TegakiQuality, t as buildChildren, u as createBundle, v as ResolvedEffect, w as LayoutBBox, x as getEffectDefinition, y as findEffect } from "../index-BVYJFRMq.mjs";

//#region src/wc/TegakiElement.d.ts
declare class TegakiElement extends HTMLElement {
  static observedAttributes: ("text" | "font" | "time" | "speed" | "duration" | "playing" | "loop" | "delay" | "loop-gap" | "pixel-ratio" | "segment-size" | "smoothing" | "show-overlay" | "direction" | "no-shaper")[];
  private _engine;
  private _container;
  private _font;
  private _effects;
  private _timing;
  private _quality;
  private _onComplete;
  private _onChangeTimeline;
  constructor();
  connectedCallback(): void;
  disconnectedCallback(): void;
  attributeChangedCallback(_name: string, _oldValue: string | null, _newValue: string | null): void;
  /** The underlying engine instance. */
  get engine(): TegakiEngine | null;
  /** Set the font bundle directly (alternative to the `font` attribute for registered names). */
  get font(): TegakiBundle | string | undefined;
  set font(value: TegakiBundle | string | undefined);
  /** Visual effects configuration. */
  get effects(): TegakiEngineOptions['effects'];
  set effects(value: TegakiEngineOptions['effects']);
  /** Timeline timing configuration. */
  get timing(): TegakiEngineOptions['timing'];
  set timing(value: TegakiEngineOptions['timing']);
  /** Render-quality configuration (supersampling, segment subdivision). */
  get quality(): TegakiEngineOptions['quality'];
  set quality(value: TegakiEngineOptions['quality']);
  /** Callback when animation completes. */
  get onComplete(): (() => void) | undefined;
  set onComplete(value: (() => void) | undefined);
  /** Callback fired after the engine recomputes its timeline. */
  get onChangeTimeline(): TegakiEngineOptions['onChangeTimeline'];
  set onChangeTimeline(value: TegakiEngineOptions['onChangeTimeline']);
  play(): void;
  pause(): void;
  seek(time: number | `${number}%`): void;
  restart(): void;
  get currentTime(): number;
  get duration(): number;
  get isPlaying(): boolean;
  get isComplete(): boolean;
  private _buildOptions;
  /**
   * Merge the `quality` JS property with `pixel-ratio` / `segment-size` /
   * `smoothing` attribute shortcuts. Attributes override properties on a
   * per-field basis.
   */
  private _resolveQuality;
  private _resolveTime;
  private _getNumberAttr;
}
/**
 * Register the `<tegaki-renderer>` custom element.
 * Call this once before using the element in HTML.
 *
 * @param tagName - Custom element tag name. Default: `'tegaki-renderer'`.
 *   Note: custom element names must contain a hyphen per the HTML spec.
 */
declare function registerTegakiElement(tagName?: string): void;
//#endregion
export { BBox, BUNDLE_VERSION, BundleShaper, COMPATIBLE_BUNDLE_VERSIONS, CSSLength, CreateElementFn, EffectDefinition, FontOutput, GlyphData, LayoutBBox, LineCap, PathCommand, Point, RenderStageContext, ResolvedEffect, ShapedGlyph, ShaperFactory, Stroke, TegakiBundle, TegakiEffectConfigs, TegakiEffectName, TegakiEffects, TegakiElement, TegakiEngine, TegakiEngineOptions, TegakiGlyphData, TegakiMultiEffectName, TegakiQuality, TegakiSingletonEffectName, TextLayout, TimeControlMode, TimeControlProp, TimedPoint, Timeline, TimelineConfig, TimelineEntry, TimelineStaggerConfig, buildChildren, buildRootProps, computeLayoutBbox, computeTextLayout, computeTimeline, createBundle, domCreateElement, drawGlyph, ensureFontFace, findEffect, findEffects, getBundle, getEffectDefinition, hasRenderHooks, registerBundle, registerTegakiElement, resolveBundle, resolveEffects };
//# sourceMappingURL=index.d.mts.map