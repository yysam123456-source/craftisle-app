import { _ as findEffect, a as createBundle, b as hasRenderHooks, c as resolveBundle, d as computeTimeline, f as computeLayoutBbox, h as drawGlyph, i as domCreateElement, l as BUNDLE_VERSION, m as ensureFontFace, n as buildChildren, o as getBundle, p as computeTextLayout, r as buildRootProps, s as registerBundle, t as TegakiEngine, u as COMPATIBLE_BUNDLE_VERSIONS, v as findEffects, x as resolveEffects, y as getEffectDefinition } from "../core-MwnsJAbN.mjs";
import { createEffect, createMemo, on, onCleanup, onMount, splitProps } from "solid-js";
import { jsx } from "solid-js/jsx-runtime";
//#region src/solid/TegakiRenderer.tsx
/** @jsxImportSource solid-js */
function solidCreateElement(tag, props, ...children) {
	const parts = [];
	for (const [key, value] of Object.entries(props)) {
		if (value == null || value === false) continue;
		if (key === "style" && typeof value === "object") {
			const css = Object.entries(value).filter(([, v]) => v != null).map(([k, v]) => {
				return `${k.startsWith("--") ? k : k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${typeof v === "number" && !k.startsWith("--") ? `${v}px` : String(v)}`;
			}).join(";");
			if (css) parts.push(`style="${escapeAttr(css)}"`);
		} else if (typeof value === "boolean") parts.push(key);
		else parts.push(`${key}="${escapeAttr(String(value))}"`);
	}
	return `${parts.length > 0 ? `<${tag} ${parts.join(" ")}>` : `<${tag}>`}${children.map((c) => typeof c === "string" && !c.startsWith("<") ? escapeHtml(c) : c).join("")}</${tag}>`;
}
function escapeAttr(s) {
	return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeHtml(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function TegakiRenderer(props) {
	const [local, divProps] = splitProps(props, [
		"text",
		"font",
		"time",
		"onComplete",
		"onChangeTimeline",
		"effects",
		"quality",
		"timing",
		"showOverlay",
		"direction",
		"shaper",
		"ref"
	]);
	let container;
	let engine = null;
	const engineOptions = createMemo(() => ({
		text: local.text,
		font: local.font,
		time: local.time,
		effects: local.effects,
		quality: local.quality,
		timing: local.timing,
		showOverlay: local.showOverlay,
		direction: local.direction,
		shaper: local.shaper,
		onComplete: local.onComplete,
		onChangeTimeline: local.onChangeTimeline
	}));
	const { rootProps, content } = TegakiEngine.renderElements(engineOptions(), solidCreateElement);
	const innerHTML = content;
	onMount(() => {
		engine = new TegakiEngine(container, {
			...engineOptions(),
			adopt: true
		});
		local.ref?.({
			engine,
			element: container
		});
	});
	onCleanup(() => {
		engine?.destroy();
		engine = null;
	});
	createEffect(on(engineOptions, (options) => {
		engine?.update(options);
	}));
	const mergedStyle = {
		...rootProps.style,
		...typeof divProps.style === "object" ? divProps.style : {}
	};
	return /* @__PURE__ */ jsx("div", {
		ref: container,
		"data-tegaki": "root",
		dir: "auto",
		...divProps,
		style: mergedStyle,
		innerHTML
	});
}
//#endregion
export { BUNDLE_VERSION, COMPATIBLE_BUNDLE_VERSIONS, TegakiEngine, TegakiRenderer, buildChildren, buildRootProps, computeLayoutBbox, computeTextLayout, computeTimeline, createBundle, domCreateElement, drawGlyph, ensureFontFace, findEffect, findEffects, getBundle, getEffectDefinition, hasRenderHooks, registerBundle, resolveBundle, resolveEffects };

//# sourceMappingURL=index.mjs.map