import { _ as findEffect, a as createBundle, b as hasRenderHooks, c as resolveBundle, d as computeTimeline, f as computeLayoutBbox, h as drawGlyph, i as domCreateElement, l as BUNDLE_VERSION, m as ensureFontFace, n as buildChildren, o as getBundle, p as computeTextLayout, r as buildRootProps, s as registerBundle, t as TegakiEngine, u as COMPATIBLE_BUNDLE_VERSIONS, v as findEffects, x as resolveEffects, y as getEffectDefinition } from "../core-MwnsJAbN.mjs";
//#region src/wc/TegakiElement.ts
/**
* Observed attribute names.
* - `text`: the text to render (also settable via textContent)
* - `font`: registered bundle name (see {@link TegakiEngine.registerBundle})
* - `time`: time control — a number (seconds) or percentage string like `"50%"` (progress) for controlled mode, `"css"` for CSS mode, omit for uncontrolled
* - `speed`: playback speed multiplier (uncontrolled mode, default `1`). Mutually exclusive with `duration`.
* - `duration`: stretch/compress one iteration to this many seconds (uncontrolled mode). Mutually exclusive with `speed`; takes precedence when both are present.
* - `playing`: whether animation is playing (uncontrolled mode, default `true`)
* - `loop`: loop animation (uncontrolled mode, default `false`)
* - `delay`: delay before animation starts (seconds, uncontrolled mode, default `0`)
* - `loop-gap`: pause between loop iterations (seconds, uncontrolled mode, default `0`)
* - `pixel-ratio`: supersampling factor on top of devicePixelRatio (quality knob, default `1`)
* - `segment-size`: segment size for rendering (quality knob)
* - `smoothing`: smooth strokes with a centripetal Catmull-Rom spline (quality knob)
* - `show-overlay`: show debug overlay
* - `direction`: text direction (`"ltr"` or `"rtl"`)
* - `no-shaper`: disable text shaping for this instance (use the char-keyed grapheme path)
*
* The `easing` option is not exposed as an attribute (it takes a function);
* set it via the `time` JS property for full uncontrolled-mode configuration.
*/
const OBSERVED_ATTRS = [
	"text",
	"font",
	"time",
	"speed",
	"duration",
	"playing",
	"loop",
	"delay",
	"loop-gap",
	"pixel-ratio",
	"segment-size",
	"smoothing",
	"show-overlay",
	"direction",
	"no-shaper"
];
var TegakiElement = class extends HTMLElement {
	static observedAttributes = [...OBSERVED_ATTRS];
	_engine = null;
	_container;
	_font;
	_effects;
	_timing;
	_quality;
	_onComplete;
	_onChangeTimeline;
	constructor() {
		super();
		const shadow = this.attachShadow({ mode: "open" });
		const style = document.createElement("style");
		style.textContent = `:host { display: inline-block; }`;
		shadow.appendChild(style);
		this._container = document.createElement("div");
		shadow.appendChild(this._container);
	}
	connectedCallback() {
		this._engine = new TegakiEngine(this._container, this._buildOptions());
	}
	disconnectedCallback() {
		this._engine?.destroy();
		this._engine = null;
	}
	attributeChangedCallback(_name, _oldValue, _newValue) {
		this._engine?.update(this._buildOptions());
	}
	/** The underlying engine instance. */
	get engine() {
		return this._engine;
	}
	/** Set the font bundle directly (alternative to the `font` attribute for registered names). */
	get font() {
		return this._font;
	}
	set font(value) {
		this._font = value;
		this._engine?.update(this._buildOptions());
	}
	/** Visual effects configuration. */
	get effects() {
		return this._effects;
	}
	set effects(value) {
		this._effects = value;
		this._engine?.update(this._buildOptions());
	}
	/** Timeline timing configuration. */
	get timing() {
		return this._timing;
	}
	set timing(value) {
		this._timing = value;
		this._engine?.update(this._buildOptions());
	}
	/** Render-quality configuration (supersampling, segment subdivision). */
	get quality() {
		return this._quality;
	}
	set quality(value) {
		this._quality = value;
		this._engine?.update(this._buildOptions());
	}
	/** Callback when animation completes. */
	get onComplete() {
		return this._onComplete;
	}
	set onComplete(value) {
		this._onComplete = value;
		this._engine?.update(this._buildOptions());
	}
	/** Callback fired after the engine recomputes its timeline. */
	get onChangeTimeline() {
		return this._onChangeTimeline;
	}
	set onChangeTimeline(value) {
		this._onChangeTimeline = value;
		this._engine?.update(this._buildOptions());
	}
	play() {
		this._engine?.play();
	}
	pause() {
		this._engine?.pause();
	}
	seek(time) {
		this._engine?.seek(time);
	}
	restart() {
		this._engine?.restart();
	}
	get currentTime() {
		return this._engine?.currentTime ?? 0;
	}
	get duration() {
		return this._engine?.duration ?? 0;
	}
	get isPlaying() {
		return this._engine?.isPlaying ?? false;
	}
	get isComplete() {
		return this._engine?.isComplete ?? false;
	}
	_buildOptions() {
		const text = this.getAttribute("text") ?? this.textContent ?? "";
		const fontAttr = this.getAttribute("font");
		const font = this._font ?? (fontAttr || void 0);
		const time = this._resolveTime();
		const directionAttr = this.getAttribute("direction");
		return {
			text,
			font,
			time,
			effects: this._effects,
			timing: this._timing,
			quality: this._resolveQuality(),
			showOverlay: this.hasAttribute("show-overlay"),
			direction: directionAttr === "rtl" || directionAttr === "ltr" ? directionAttr : void 0,
			shaper: this.hasAttribute("no-shaper") ? false : void 0,
			onComplete: this._onComplete,
			onChangeTimeline: this._onChangeTimeline
		};
	}
	/**
	* Merge the `quality` JS property with `pixel-ratio` / `segment-size` /
	* `smoothing` attribute shortcuts. Attributes override properties on a
	* per-field basis.
	*/
	_resolveQuality() {
		const pixelRatioAttr = this._getNumberAttr("pixel-ratio");
		const segmentSizeAttr = this._getNumberAttr("segment-size");
		const smoothingAttr = this.hasAttribute("smoothing");
		if (pixelRatioAttr == null && segmentSizeAttr == null && !smoothingAttr) return this._quality;
		return {
			...this._quality,
			...pixelRatioAttr != null ? { pixelRatio: pixelRatioAttr } : {},
			...segmentSizeAttr != null ? { segmentSize: segmentSizeAttr } : {},
			...smoothingAttr ? { smoothing: true } : {}
		};
	}
	_resolveTime() {
		const timeAttr = this.getAttribute("time");
		if (timeAttr === "css") return "css";
		if (timeAttr != null) {
			const num = Number(timeAttr);
			if (!Number.isNaN(num)) return num;
			if (timeAttr.trim().endsWith("%")) return timeAttr;
		}
		const hasSpeed = this.hasAttribute("speed");
		const hasDuration = this.hasAttribute("duration");
		const hasPlaying = this.hasAttribute("playing");
		const hasLoop = this.hasAttribute("loop");
		const hasDelay = this.hasAttribute("delay");
		const hasLoopGap = this.hasAttribute("loop-gap");
		if (hasSpeed || hasDuration || hasPlaying || hasLoop || hasDelay || hasLoopGap) {
			const shared = {
				mode: "uncontrolled",
				playing: this.getAttribute("playing") !== "false",
				loop: this.hasAttribute("loop"),
				delay: this._getNumberAttr("delay"),
				loopGap: this._getNumberAttr("loop-gap")
			};
			if (hasDuration) return {
				...shared,
				duration: this._getNumberAttr("duration")
			};
			return {
				...shared,
				speed: this._getNumberAttr("speed") ?? 1
			};
		}
	}
	_getNumberAttr(name) {
		const value = this.getAttribute(name);
		if (value == null) return void 0;
		const num = Number(value);
		return Number.isNaN(num) ? void 0 : num;
	}
};
/**
* Register the `<tegaki-renderer>` custom element.
* Call this once before using the element in HTML.
*
* @param tagName - Custom element tag name. Default: `'tegaki-renderer'`.
*   Note: custom element names must contain a hyphen per the HTML spec.
*/
function registerTegakiElement(tagName = "tegaki-renderer") {
	if (!customElements.get(tagName)) customElements.define(tagName, TegakiElement);
}
//#endregion
export { BUNDLE_VERSION, COMPATIBLE_BUNDLE_VERSIONS, TegakiElement, TegakiEngine, buildChildren, buildRootProps, computeLayoutBbox, computeTextLayout, computeTimeline, createBundle, domCreateElement, drawGlyph, ensureFontFace, findEffect, findEffects, getBundle, getEffectDefinition, hasRenderHooks, registerBundle, registerTegakiElement, resolveBundle, resolveEffects };

//# sourceMappingURL=index.mjs.map