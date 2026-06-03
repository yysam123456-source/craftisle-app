import { Blob, Buffer, Face, Feature, Font, shape } from "harfbuzzjs";
//#region src/shaper-harfbuzz/index.ts
const SHAPER_MANAGED_FEATURES = new Set([
	"init",
	"medi",
	"fina",
	"isol",
	"rlig"
]);
/**
* Whitespace boundaries split shaping runs (see `BundleShaper.shape`).
* Covers ASCII whitespace plus the Unicode space block — anything browsers
* also treat as a word separator for line-breaking and text shaping.
*/
function isShapingWhitespace(code) {
	return code === 32 || code === 9 || code === 10 || code === 13 || code === 12 || code === 11 || code === 160 || code >= 8192 && code <= 8202 || code === 8232 || code === 8233 || code === 8239 || code === 8287 || code === 12288;
}
/**
* Tokenise `text` into alternating whitespace / non-whitespace segments.
* Browsers shape each non-whitespace word in isolation, so contextual
* features (calt/liga/clig) never bridge a space; we want the same here so
* canvas output matches the DOM overlay's glyphs.
*/
function splitForShaping(text) {
	const out = [];
	if (!text) return out;
	let segStart = 0;
	let segIsWs = isShapingWhitespace(text.charCodeAt(0));
	for (let i = 1; i <= text.length; i++) {
		const atEnd = i === text.length;
		const isWs = !atEnd && isShapingWhitespace(text.charCodeAt(i));
		if (atEnd || isWs !== segIsWs) {
			out.push({
				text: text.slice(segStart, i),
				offset: segStart,
				isWhitespace: segIsWs
			});
			segStart = i;
			segIsWs = isWs;
		}
	}
	return out;
}
/** Build a harfbuzz feature string from bundle features, filtering shaper-managed enables. */
function toHbFeatureString(enabled) {
	const parts = [];
	for (const tag of enabled) {
		if (SHAPER_MANAGED_FEATURES.has(tag)) continue;
		parts.push(tag);
	}
	return parts.join(",");
}
/** Parse the filtered feature tags into `Feature[]` for `shape()`. */
function toHbFeatures(enabled) {
	const out = [];
	for (const tag of enabled) {
		if (SHAPER_MANAGED_FEATURES.has(tag)) continue;
		const f = Feature.fromString(tag);
		if (f) out.push(f);
	}
	return out;
}
async function buildShaper(bundle) {
	const urls = [bundle.fontUrl, ...bundle.extraFontUrls ?? []];
	const subsets = (await Promise.all(urls.map(async (url) => (await fetch(url)).arrayBuffer()))).map((buf) => {
		const blob = new Blob(buf);
		const face = new Face(blob, 0);
		return {
			font: new Font(face),
			face,
			blob,
			codepoints: new Set(face.collectUnicodes())
		};
	});
	const features = toHbFeatures(bundle.features ?? []);
	const shapeRun = (subsetIdx, runText, runStart) => {
		const subset = subsets[subsetIdx];
		const buffer = new Buffer();
		buffer.addText(runText);
		buffer.guessSegmentProperties();
		shape(subset.font, buffer, features);
		const infos = buffer.getGlyphInfosAndPositions();
		const prefix = subsetIdx === 0 ? "" : `${subsetIdx}:`;
		return infos.map((g) => ({
			g: `${prefix}${g.codepoint}`,
			cl: runStart + g.cluster,
			ax: g.xAdvance ?? 0,
			ay: g.yAdvance ?? 0,
			dx: g.xOffset ?? 0,
			dy: g.yOffset ?? 0
		}));
	};
	const pickSubset = (cp) => {
		for (let i = 0; i < subsets.length; i++) if (subsets[i].codepoints.has(cp)) return i;
		return -1;
	};
	const shapeSegment = (segText, segOffset) => {
		if (subsets.length === 1) return shapeRun(0, segText, segOffset);
		const out = [];
		let runStart = 0;
		let runSubset = -2;
		const flush = (endUtf16) => {
			if (endUtf16 === runStart) return;
			const effective = runSubset < 0 ? 0 : runSubset;
			out.push(...shapeRun(effective, segText.slice(runStart, endUtf16), segOffset + runStart));
		};
		for (let i = 0; i < segText.length;) {
			const cp = segText.codePointAt(i) ?? segText.charCodeAt(i);
			const step = cp > 65535 ? 2 : 1;
			const subset = pickSubset(cp);
			if (subset !== runSubset) {
				flush(i);
				runStart = i;
				runSubset = subset;
			}
			i += step;
		}
		flush(segText.length);
		return out;
	};
	const dominantSubset = (segText) => {
		if (!segText) return 0;
		const sub = pickSubset(segText.codePointAt(0) ?? segText.charCodeAt(0));
		return sub < 0 ? 0 : sub;
	};
	return { shape(text) {
		if (!text) return [];
		const segments = splitForShaping(text);
		const out = [];
		for (let i = 0; i < segments.length; i++) {
			const seg = segments[i];
			if (!seg.isWhitespace) {
				out.push(...shapeSegment(seg.text, seg.offset));
				continue;
			}
			let neighbourIdx = -1;
			for (let j = i - 1; j >= 0; j--) if (!segments[j].isWhitespace) {
				neighbourIdx = j;
				break;
			}
			if (neighbourIdx < 0) {
				for (let j = i + 1; j < segments.length; j++) if (!segments[j].isWhitespace) {
					neighbourIdx = j;
					break;
				}
			}
			if (neighbourIdx < 0) {
				out.push(...shapeSegment(seg.text, seg.offset));
				continue;
			}
			const neighbour = segments[neighbourIdx];
			const subset = dominantSubset(neighbour.text);
			const composite = neighbourIdx < i ? `${neighbour.text}${seg.text}` : `${seg.text}${neighbour.text}`;
			const compositeOffset = neighbourIdx < i ? neighbour.offset : seg.offset;
			const wsStart = seg.offset;
			const wsEnd = seg.offset + seg.text.length;
			for (const g of shapeRun(subset, composite, compositeOffset)) if (g.cl >= wsStart && g.cl < wsEnd) out.push(g);
		}
		return out;
	} };
}
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
const harfbuzzShaper = (bundle) => {
	if (typeof fetch === "undefined") return null;
	if (!bundle.glyphDataById) return null;
	return buildShaper(bundle);
};
//#endregion
export { harfbuzzShaper as default, isShapingWhitespace, splitForShaping, toHbFeatureString };

//# sourceMappingURL=index.mjs.map