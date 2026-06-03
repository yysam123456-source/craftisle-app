import { _ as TegakiEffectName, d as LineCap, g as TegakiEffectConfigs, h as TegakiBundle, n as registerShaper, r as BundleShaper, v as TegakiEffects, y as TegakiGlyphData } from "./shaper-registry-CrfNiB1j.mjs";

//#region src/lib/timeline.d.ts
interface TimelineConfig {
  /** Pause between glyphs (seconds). Default: `0.1` */
  glyphGap?: number;
  /** Pause after a space character (seconds). Default: `0.15` */
  wordGap?: number;
  /** Pause after a newline / line break (seconds). Default: `0.3` */
  lineGap?: number;
  /** Duration for characters without glyph data (seconds). Default: `0.2` */
  unknownDuration?: number;
  /**
   * Easing function for each stroke's animation progress `(0–1) → (0–1)`.
   * Applied per-stroke to map linear draw progress to eased progress.
   * Default: ease-out exponential (`1 - 2^(-10t)`).
   */
  strokeEasing?: (t: number) => number;
  /**
   * Easing function for each glyph's local time progress `(0–1) → (0–1)`.
   * Applied per-glyph to map linear time within the glyph to eased time.
   * Default: linear (no easing).
   */
  glyphEasing?: (t: number) => number;
  /**
   * When `true` (default), disconnected marks tagged by the generator — i-dots,
   * Arabic nuqṭa, diacritics — are deferred so every body stroke in a word
   * draws before any dot in that word. When `false`, strokes animate in their
   * bundled order with no deferral.
   *
   * Ignored when `stagger` is set — stagger mode treats every stroke uniformly.
   */
  deferDots?: boolean;
  /**
   * Optional staggered scheduling: each glyph starts a fixed advance after the
   * previous glyph started, regardless of whether the previous glyph has
   * finished drawing. Replaces the default "previous-end + glyphGap" cadence.
   *
   * Word and line breaks still pause for `wordGap` / `lineGap`. Dot deferral
   * is bypassed (each stroke draws in its bundled order). See
   * {@link TimelineStaggerConfig} for `advance` and `duration` semantics.
   */
  stagger?: TimelineStaggerConfig;
}
interface TimelineStaggerConfig {
  /**
   * Delay between the start of consecutive glyphs.
   * - Number: seconds (e.g. `0.3`).
   * - String ending in `%`: percentage of the previous glyph's **effective**
   *   duration — i.e. the `duration` field below when set, otherwise the
   *   bundled `glyph.t`. So `"100%"` always means "start once the previous
   *   glyph finishes", and `"50%"` always means "start halfway through",
   *   regardless of whether `duration` is overridden.
   */
  advance: number | `${number}%`;
  /**
   * Per-glyph draw duration.
   * - `'auto'` (default): each glyph plays for its bundled duration; strokes
   *   keep their bundled `d`/`a` timing.
   * - Number: every glyph is scaled to take exactly this many seconds. All
   *   strokes inside the glyph are time-scaled (`d * scale`, `a * scale` where
   *   `scale = duration / bundledDuration`).
   */
  duration?: number | 'auto';
}
interface TimelineEntry {
  /** First grapheme of the cluster this entry represents. Used for fallback glyph lookup. */
  char: string;
  /** Grapheme index of `char` in the full text — matches `layout.charOffsets`. */
  graphemeIndex: number;
  /**
   * Shaped glyph key (when a shaper produced this entry). Bare numeric string
   * for primary-subset glyphs (e.g. `"42"`), or `"<subsetIndex>:<gid>"` for
   * glyphs from an `extraFontUrls` subset — same format used as the key into
   * `bundle.glyphDataById`.
   */
  glyphId?: string;
  offset: number;
  duration: number;
  hasGlyph: boolean;
  /**
   * Sparse per-stroke override of the bundled stroke's `d` (delay) field. When
   * `strokeDelays[i]` is a number, the renderer treats that value as stroke
   * `i`'s delay (relative to `offset`) instead of the delay stored in the
   * glyph. Populated by word-level dot deferral: priority-tagged strokes get
   * shifted to after every body stroke in the word has drawn.
   */
  strokeDelays?: (number | undefined)[];
  /**
   * X offset of this glyph relative to its visual line's left edge, in em.
   * Populated by `applyShaperPositions` from the shaper's pen-walk: this is
   * `pen.x + dx` where `dx` is the GPOS x-offset for the glyph. The engine
   * combines it with `layout.lineLefts[lineIdx]` to get the final draw x.
   *
   * Why per-entry rather than per-grapheme: in clusters with mark glyphs
   * (e.g. Arabic dot below ي), the base and the mark have different `dx` via
   * mark-attachment GPOS. Storing per-entry preserves both. Falls back to
   * `layout.charOffsets[graphemeIndex]` when undefined.
   */
  xOffsetEm?: number;
  /**
   * Y offset of this glyph relative to the line baseline, in em (positive =
   * down, mirroring CSS axis). Populated by `applyShaperPositions` as
   * `-dy / unitsPerEm` (HB's `dy` is y-up, ours is y-down). Encodes Arabic
   * cursive-attachment GPOS — Aref Ruqaa's wavy Ruq'ah baseline lifts each
   * connected letter by ~250 font units — and mark-attachment vertical
   * offsets. The engine adds `yOffsetEm * fontSize` to `glyphY` so the glyph
   * draws at the correct cursive-lifted height.
   */
  yOffsetEm?: number;
  /**
   * Multiplier applied to bundled stroke `d` (delay) and `a` (animation
   * duration) when drawing this glyph. Populated by stagger mode with a static
   * `duration` to scale the glyph's strokes to fit the new slot. Undefined or
   * `1` means use the bundled timing as-is.
   */
  strokeTimeScale?: number;
}
interface Timeline {
  entries: TimelineEntry[];
  totalDuration: number;
}
declare function computeTimeline(text: string, font: TegakiBundle, config?: TimelineConfig, shaper?: BundleShaper | null): Timeline;
//#endregion
//#region src/lib/textLayout.d.ts
interface TextLayout {
  /** Character indices per line */
  lines: number[][];
  /** X offset within line in em per character index */
  charOffsets: number[];
  /** Width in em per character index */
  charWidths: number[];
  /**
   * Visual-left edge of each line in em (parallel to `lines`). Populated by
   * `applyShaperPositions` and consumed by the engine when a timeline entry
   * carries per-glyph offsets \u2014 engine adds `lineLefts[lineIdx]` to
   * `entry.xOffsetEm` to get the absolute x position. Undefined when the
   * shaper path isn't taken; consumers must fall back to `charOffsets`.
   */
  lineLefts?: number[];
}
/**
 * Axis-aligned bounding box of the laid-out text in the ctx coordinate space
 * used by the engine's glyph loop (i.e. after `padH`/`padV` translation).
 * `width` is the max line advance; `height` is `lines.length * lineHeight`.
 */
interface LayoutBBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
/**
 * Compute the text bounding box from a measured layout. Inputs are in CSS
 * pixels. Assumes the layout's char offsets are em-relative to the left edge
 * of each line (as produced by `computeTextLayout`).
 */
declare function computeLayoutBbox(layout: TextLayout, fontSize: number, lineHeight: number): LayoutBBox;
/**
 * Measure text layout using the Range API on an existing DOM element.
 * The element must already be in the document with correct text content,
 * font, line-height, white-space, and width styles applied.
 */
declare function computeTextLayout(el: HTMLElement, fontSize: number): TextLayout;
/**
 * Measure text layout by creating a temporary off-screen DOM element.
 */
declare function computeTextLayout(text: string, fontSize: number, fontFamily: string, lineHeight: number, maxWidth: number): TextLayout;
//#endregion
//#region src/lib/effects.d.ts
interface ResolvedEffect<K extends TegakiEffectName = TegakiEffectName> {
  effect: K;
  order: number;
  config: TegakiEffectConfigs[K];
}
/**
 * Context passed to effect render hooks. Covers everything a hook might need
 * to prepare or finalize state that spans the whole text layout (as opposed
 * to the per-glyph state owned by `drawGlyph`).
 *
 * The `ctx` has already been translated so its origin is the top-left of the
 * content box (i.e. `(0, 0)` is the top-left of `bbox`). Hooks that mutate ctx
 * state (transforms, strokeStyle, compositing, filters) are expected to
 * save/restore as needed so they don't leak into adjacent effects or the
 * glyph loop unintentionally.
 */
interface RenderStageContext {
  ctx: CanvasRenderingContext2D;
  layout: TextLayout;
  fontSize: number;
  lineHeight: number;
  unitsPerEm: number;
  ascender: number;
  descender: number;
  /** Text bounding box in the current ctx coordinate space (CSS pixels). */
  bbox: LayoutBBox;
  /** The base color string resolved from `getComputedStyle().color`. */
  baseColor: string;
  /** Engine seed, offset by whatever the caller chose (currently the engine root seed). */
  seed: number;
  /**
   * Stroke paint override for the whole glyph loop. A `beforeRender` hook sets
   * this to e.g. a `CanvasGradient` when the effect wants every stroke to share
   * a single canvas-space paint. The engine reads it after all hooks have run
   * and threads it through to `drawGlyph`. `shadowColor` (used by `glow`) still
   * reads from `baseColor` since Canvas shadows don't accept gradients.
   */
  strokeStyle?: string | CanvasGradient | CanvasPattern;
}
/**
 * Metadata describing how an effect participates in rendering. The per-glyph
 * branch of an effect still lives inside `drawGlyph`; these hooks exist for
 * effects whose behavior spans the full layout (e.g. a gradient whose color
 * stops map to canvas-space position rather than per-stroke progress).
 *
 * `beforeRender` hooks run in forward order (same order as `_resolvedEffects`
 * after sorting by `order`). `afterRender` hooks run in reverse order so
 * save/restore-style pairs nest correctly.
 */
interface EffectDefinition {
  beforeRender?(stage: RenderStageContext, config: any): void;
  afterRender?(stage: RenderStageContext, config: any): void;
}
/**
 * Normalizes an effects record into a sorted array of resolved effects.
 * Known keys infer the effect name; custom keys read it from the `effect` field.
 * Boolean `true` becomes an empty config. `false`/absent entries are skipped.
 */
declare function resolveEffects(effects: Record<string, any> | undefined): ResolvedEffect[];
/** Check if a specific effect is active. */
declare function findEffect<K extends TegakiEffectName>(effects: ResolvedEffect[], name: K): ResolvedEffect<K> | undefined;
/** Get all instances of a specific effect (for duplicates). */
declare function findEffects<K extends TegakiEffectName>(effects: ResolvedEffect[], name: K): ResolvedEffect<K>[];
/** Look up the render-hook metadata for an effect name. Unknown names return undefined. */
declare function getEffectDefinition(name: string): EffectDefinition | undefined;
/** True when any resolved effect defines a before/after render hook. */
declare function hasRenderHooks(effects: ResolvedEffect[]): boolean;
//#endregion
//#region src/lib/strokeCache.d.ts
/**
 * A single vertex in a subdivided stroke polyline. Consecutive vertices form
 * a drawable sub-segment. Coordinates are in font units and pre-wobble: the
 * renderer applies wobble, scale, and translation at draw time so that one
 * cached subdivision can be reused across every instance of the same glyph.
 */
interface SubVertex {
  /** X in font units, pre-wobble. */
  x: number;
  /** Y in font units, pre-wobble. */
  y: number;
  /** Stroke width at this vertex, in font units. */
  width: number;
  /** Accumulated length from the start of the stroke, in font units. */
  cumLen: number;
  /** Fractional original-point index (used to keep wobble phase continuous). */
  idx: number;
}
interface SubdividedStroke {
  /** Ordered vertices; vertices[i] → vertices[i+1] is a drawable sub-segment. */
  vertices: SubVertex[];
  /** Total polyline length in font units. */
  totalLen: number;
  /** Mean width across the original points in font units. */
  avgWidth: number;
}
//#endregion
//#region src/lib/drawGlyph.d.ts
type Stroke = TegakiGlyphData['s'][number];
interface GlyphPosition {
  /** X offset in CSS pixels */
  x: number;
  /** Y offset in CSS pixels (top of em square) */
  y: number;
  /** Font size in CSS pixels */
  fontSize: number;
  /** Units per em from the font */
  unitsPerEm: number;
  /** Font ascender in font units */
  ascender: number;
  /** Font descender in font units (negative) */
  descender: number;
}
/**
 * Draw a single glyph's strokes onto a canvas context, animated up to `localTime`.
 * `localTime` is seconds relative to this glyph's start (0 = glyph begins).
 *
 * `getSubdivided` returns a shared, cached subdivision of each stroke (in font
 * units, pre-wobble). The engine owns the cache and invalidates it when the
 * font, fontSize, or segment size changes; if omitted here, strokes are
 * subdivided inline each call (useful for testing).
 *
 * `strokeDelays` is a sparse per-stroke override of the bundled `d` field. When
 * `strokeDelays[i]` is a number, it replaces `glyph.s[i].d` as the stroke's
 * delay relative to `localTime = 0`. Used by the timeline scheduler to defer
 * priority-tagged strokes (disconnected marks / i-dots / Arabic nuqṭa) to
 * after every body stroke in the word has drawn.
 *
 * `strokeTimeScale` multiplies both bundled `d` and `a` so a glyph's strokes
 * fit a stretched/compressed time slot (used by stagger mode with a static
 * `duration`). Defaults to `1` (no scaling). `strokeDelays` are already
 * scheduler-relative seconds and are not affected by this scale.
 */
declare function drawGlyph(ctx: CanvasRenderingContext2D, glyph: TegakiGlyphData, pos: GlyphPosition, localTime: number, lineCap: LineCap, color: string, effects?: ResolvedEffect[], seed?: number, getSubdivided?: (stroke: Stroke) => SubdividedStroke, strokeEasing?: ((t: number) => number) | undefined, strokeScale?: number, strokeStyleOverride?: string | CanvasGradient | CanvasPattern, strokeDelays?: (number | undefined)[], strokeTimeScale?: number): void;
//#endregion
//#region src/lib/font.d.ts
/**
 * Ensures the bundle's font face is loaded and available for rendering.
 * Resolves immediately if the font is already loaded.
 */
declare function ensureFontFace(bundle: TegakiBundle): Promise<void>;
//#endregion
//#region src/core/bundle-registry.d.ts
/** Register a font bundle so it can be referenced by family name. */
declare function registerBundle(bundle: TegakiBundle): void;
/** Look up a registered bundle by family name. */
declare function getBundle(family: string): TegakiBundle | undefined;
declare function resolveBundle(font: TegakiBundle | string | undefined): TegakiBundle | undefined;
//#endregion
//#region src/core/createBundle.d.ts
/**
 * Creates a {@link TegakiBundle} from its constituent parts.
 *
 * Useful when loading font data from a CDN or other source where the
 * pre-built bundle modules aren't available:
 *
 * ```js
 * const glyphData = await fetch('.../glyphData.json').then(r => r.json());
 * const bundle = createBundle({
 *   family: 'Caveat',
 *   fontUrl: '.../caveat.ttf',
 *   glyphData,
 * });
 * ```
 */
declare function createBundle({
  family,
  fullFamily,
  fontUrl,
  fullFontUrl,
  glyphData,
  lineCap,
  unitsPerEm,
  ascender,
  descender
}: {
  family: string;
  fullFamily?: string;
  fontUrl: string;
  fullFontUrl?: string;
  glyphData: Record<string, TegakiGlyphData>;
  lineCap?: LineCap;
  unitsPerEm?: number;
  ascender?: number;
  descender?: number;
}): TegakiBundle;
//#endregion
//#region src/core/types.d.ts
/** Fields shared by both speed- and duration-paced uncontrolled modes. */
interface UncontrolledShared {
  mode: 'uncontrolled';
  /** Initial time in seconds. Default: `0` */
  initialTime?: number;
  /** Whether animation is playing. Default: `true` */
  playing?: boolean;
  /** Loop animation when it reaches the end. Default: `false` */
  loop?: boolean;
  /**
   * Delay before the animation starts (seconds). Applied once on
   * initialization and again on {@link TegakiEngine.restart}. Default: `0`
   */
  delay?: number;
  /**
   * Pause between loop iterations (seconds). Only effective when
   * `loop` is `true`. Default: `0`
   */
  loopGap?: number;
  /**
   * Easing function mapping linear progress `(0–1)` to displayed progress `(0–1)`.
   * Applied at read-time so `currentTime`, `onTimeChange`, and the CSS custom
   * properties all reflect the eased value. Completion is evaluated against
   * linear progress so curves that overshoot or undershoot the endpoints do
   * not trip completion early or late.
   */
  easing?: (t: number) => number;
  /** Called on every frame with the current (eased) time. */
  onTimeChange?: (time: number) => void;
}
type TimeControlMode = {
  controlled: {
    mode: 'controlled'; /** Current time in seconds (default), or progress 0–1 when `unit` is `'progress'`. */
    value: number; /** Interpret `value` as seconds (default) or as a 0–1 progress ratio. */
    unit?: 'seconds' | 'progress';
  };
  uncontrolled: (UncontrolledShared & {
    /** Playback speed multiplier. Default: `1` */speed?: number;
    /**
     * Catch-up strength. When positive, playback speeds up when there is a
     * large amount of remaining animation and decays back to normal gradually.
     * `0` disables catch-up (default). Higher values ramp up more aggressively.
     * Typical range: `0.2` – `2`.
     */
    catchUp?: number;
    duration?: never;
  }) | (UncontrolledShared & {
    /**
     * Stretch or compress playback so one iteration takes exactly this many
     * seconds. Mutually exclusive with `speed` / `catchUp`.
     */
    duration?: number;
    speed?: never;
    catchUp?: never;
  });
  css: {
    mode: 'css';
  };
};
/**
 * A plain number is shorthand for `{ mode: 'controlled', value: number }`.
 * A percentage string like `'50%'` is shorthand for
 * `{ mode: 'controlled', value: 0.5, unit: 'progress' }`.
 * `'css'` is shorthand for `{ mode: 'css' }`.
 * Omit for uncontrolled mode with default settings.
 */
type TimeControlProp = null | undefined | number | `${number}%` | 'css' | TimeControlMode[keyof TimeControlMode];
/**
 * Render-quality knobs. These trade CPU/GPU cost for visual fidelity.
 * They do not change the style of the rendered text — see `effects` for that.
 */
interface TegakiQuality {
  /**
   * Internal supersampling factor applied on top of `window.devicePixelRatio`.
   * Values > 1 draw into a larger backing canvas and let the browser downsample
   * to the displayed size, producing higher-quality antialiasing at a quadratic
   * cost in pixels filled. Values < 1 save cost at the expense of sharpness.
   * Default: `1`.
   */
  pixelRatio?: number;
  /**
   * Maximum drawn segment length in CSS pixels when stroke-varying effects
   * (`pressureWidth`, `taper`, `wobble`, `strokeGradient`) are active. Smaller values
   * produce smoother transitions at the cost of more draw calls per stroke.
   * Because this is measured in pixels, subdivision count scales with rendered
   * size: a glyph drawn at 10px is cheaper to render than the same glyph at
   * 100px. Defaults to `2` when such effects are on, otherwise segments are not
   * subdivided.
   */
  segmentSize?: number;
  /**
   * Clip handwriting strokes to the filled text shape using canvas composite
   * operations (`destination-in`). Strokes that extend beyond the glyph
   * outlines are masked away, producing a "drawn inside the text" effect.
   *
   * - `false` (default) — no clipping.
   * - `true` — clip with no stroke width change.
   * - A number > 0 — clip and scale stroke widths by that factor. Values
   *   around `2`–`3` make the strokes fill more of the glyph interior,
   *   producing a result closer to the original filled text.
   */
  clipText?: boolean | number;
  /**
   * Smooth stroke polylines with a centripetal Catmull-Rom spline through the
   * original glyph points. Hides the faceted corners visible at large render
   * sizes where the baked polyline resolution shows through.
   *
   * Requires subdivision to be active — when enabled without a `segmentSize`,
   * `segmentSize` defaults to `2` CSS px. Default: `false` (unchanged behavior).
   */
  smoothing?: boolean;
}
interface TegakiEngineOptions {
  text?: string;
  /** A font bundle, or a registered bundle name (see {@link TegakiEngine.registerBundle}). */
  font?: TegakiBundle | string;
  time?: TimeControlProp;
  effects?: TegakiEffects<Record<string, any>>;
  timing?: TimelineConfig;
  /** Render-quality knobs (supersampling, segment subdivision). */
  quality?: TegakiQuality;
  showOverlay?: boolean;
  onComplete?: () => void;
  /**
   * Fires after the engine recomputes its timeline — on initial load, font
   * swaps, text changes, and again once async shaper resolution finishes.
   * The argument is the same `Timeline` exposed via `engine.timeline`. Use
   * this instead of calling `computeTimeline` from the host: a manual call
   * without the engine's resolved shaper returns the pre-shaping
   * totalDuration.
   */
  onChangeTimeline?: (timeline: Timeline) => void;
  /** Text direction. When set, applies the CSS `direction` property to the container. */
  direction?: 'ltr' | 'rtl';
  /**
   * Whether this engine instance uses the globally-registered shaper. When
   * `false`, the engine ignores the shaper factory and renders via the
   * char-keyed grapheme path — useful for opting one renderer out of shaping
   * (e.g. side-by-side comparisons, lightweight previews) without unregistering
   * the shaper for the whole process. Default: `true`.
   */
  shaper?: boolean;
}
type CreateElementFn<T> = (tag: string, props: Record<string, any>, ...children: (T | string)[]) => T;
//#endregion
//#region src/core/engine.d.ts
declare class TegakiEngine {
  /** Register a font bundle so it can be referenced by family name. */
  static registerBundle: typeof registerBundle;
  /** Look up a registered bundle by family name. */
  static getBundle: typeof getBundle;
  /**
   * Register a shaper factory. Shaping is opt-in — without a registered
   * factory, the renderer iterates raw graphemes and uses the bundle's
   * char-keyed `glyphData` map. Pass the `harfbuzzShaper` export from
   * `tegaki/shaper-harfbuzz` for fonts that need complex shaping.
   *
   * Re-registering replaces the previous factory and invalidates the cache.
   * Pass `null` to unregister.
   */
  static registerShaper: typeof registerShaper;
  private _rootEl;
  private _contentEl;
  private _sentinelEl;
  private _canvasEl;
  private _overlayEl;
  private _canvasFallbackEl;
  private _maskCanvas;
  private _text;
  private _font;
  private _timeControl;
  private _effects;
  private _timing;
  private _quality;
  private _showOverlay;
  private _onComplete;
  private _onChangeTimeline;
  private _direction;
  private _resolvedEffects;
  private _seed;
  private _timeline;
  private _layout;
  private _layoutKey;
  private _fontReady;
  private _shaper;
  private _shaperReady;
  private _shaperEnabled;
  private _strokeCache;
  private _strokeCacheKey;
  private _containerWidth;
  private _fontSize;
  private _lineHeight;
  private _currentColor;
  private _internalTime;
  private _cssTime;
  private _playing;
  private _smoothedBoost;
  private _delayRemaining;
  private _loopGapRemaining;
  private _lastTs;
  private _rafId;
  private _prevCompleted;
  private _prefersReducedMotion;
  private _destroyed;
  private _resizeObserver;
  private _mql;
  /**
   * Returns the props (including style) that should be applied to the container element,
   * plus the inner content tree rendered via a framework `createElement` callback.
   *
   * Each child element receives a `data-tegaki` attribute so the engine can adopt
   * pre-rendered elements later via `new TegakiEngine(container, { adopt: true })`.
   */
  static renderElements<T>(options: TegakiEngineOptions, createElement: CreateElementFn<T>): {
    rootProps: Record<string, any>;
    content: T;
  };
  constructor(container: HTMLElement, options?: TegakiEngineOptions & {
    adopt?: boolean;
  });
  get currentTime(): number;
  get duration(): number;
  /**
   * The engine's current timeline — the same object that drives rendering.
   * Reflects the resolved shaper once the (async) shaper promise has
   * settled; use the `onChangeTimeline` option to be notified of recomputations.
   * Treat the returned object as read-only.
   */
  get timeline(): Timeline;
  /**
   * Compute a timeline for arbitrary text against this engine's currently-
   * loaded font, timing config, and resolved shaper. Useful for measuring
   * the duration of hypothetical text without changing what's rendered
   * (e.g. layout planning, fade-in scheduling).
   *
   * Returns an empty timeline when no font is loaded. The result reflects
   * shaper state at call time — call after `onChangeTimeline` has fired
   * once to be sure the shaper has resolved.
   */
  computeTimeline(text: string): Timeline;
  get isPlaying(): boolean;
  get isComplete(): boolean;
  get element(): HTMLElement;
  play(): void;
  pause(): void;
  /**
   * Seek the (uncontrolled) timeline to an absolute time. Accepts seconds
   * (number) or a percentage string like `"50%"`, which is interpreted as
   * a fraction of the timeline's total duration.
   */
  seek(time: number | `${number}%`): void;
  restart(): void;
  update(options: Partial<TegakiEngineOptions>): void;
  destroy(): void;
  /** Estimate line-height from font metrics when CSS returns "normal". */
  private _fallbackLineHeight;
  private _measure;
  private _updateDom;
  private _updateCssProperties;
  private _updateOverlayStyle;
  private _updateSentinelTransition;
  private _onResize;
  private _onSentinelTransition;
  private _onReducedMotionChange;
  private _loadFont;
  /**
   * Resolve the shaper for the current font. Called when the font changes or
   * when the `shaper` option is toggled. Drops any in-flight shaper for the
   * previous font; the `_font === currentFont` guard inside the promise
   * handler discards stale resolutions.
   */
  private _loadShaper;
  private _recomputeTimeline;
  private _recomputeLayout;
  private _evaluatePlayback;
  private _startLoop;
  private _stopLoop;
  private _tick;
  private _notifyTimeChange;
  private _checkCompletion;
  private _render;
}
//#endregion
//#region src/core/render-elements.d.ts
declare function buildRootProps(options: TegakiEngineOptions): Record<string, any>;
declare function buildChildren<T>(options: TegakiEngineOptions, h: CreateElementFn<T>): T;
declare function domCreateElement(tag: string, props: Record<string, any>, ...children: (HTMLElement | string)[]): HTMLElement;
//#endregion
export { TimelineEntry as A, resolveEffects as C, computeTextLayout as D, computeLayoutBbox as E, computeTimeline as M, Timeline as O, hasRenderHooks as S, TextLayout as T, RenderStageContext as _, CreateElementFn as a, findEffects as b, TimeControlMode as c, getBundle as d, registerBundle as f, EffectDefinition as g, drawGlyph as h, TegakiEngine as i, TimelineStaggerConfig as j, TimelineConfig as k, TimeControlProp as l, ensureFontFace as m, buildRootProps as n, TegakiEngineOptions as o, resolveBundle as p, domCreateElement as r, TegakiQuality as s, buildChildren as t, createBundle as u, ResolvedEffect as v, LayoutBBox as w, getEffectDefinition as x, findEffect as y };
//# sourceMappingURL=index-BVYJFRMq.d.mts.map