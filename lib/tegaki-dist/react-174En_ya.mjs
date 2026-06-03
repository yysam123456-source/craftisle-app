import { g as coerceToString, t as TegakiEngine } from "./core-MwnsJAbN.mjs";
import { createElement, useEffect, useImperativeHandle, useRef, useState } from "react";
//#region src/react/TegakiRenderer.tsx
function reactCreateElement(tag, props, ...children) {
	return createElement(tag, {
		...props,
		key: props["data-tegaki"]
	}, ...children);
}
function TegakiRenderer(props) {
	const { as: Tag = "div", ref, font, text, children, time: timeProp, onComplete, onChangeTimeline, effects, quality, timing, showOverlay, direction, shaper, editable, onTextChange, ...elementProps } = props;
	const containerRef = useRef(null);
	const engineRef = useRef(null);
	const resolvedText = text ?? coerceToString(children);
	const [internalText, setInternalText] = useState(resolvedText);
	const [prevResolvedText, setPrevResolvedText] = useState(resolvedText);
	if (prevResolvedText !== resolvedText) {
		setPrevResolvedText(resolvedText);
		setInternalText(resolvedText);
	}
	const engineOptions = {
		text: editable ? internalText : resolvedText,
		font,
		time: timeProp,
		effects,
		quality,
		timing,
		showOverlay,
		direction,
		shaper,
		onComplete,
		onChangeTimeline
	};
	const { rootProps, content } = TegakiEngine.renderElements(engineOptions, reactCreateElement);
	const { style: rootStyle, ...rootAttrs } = rootProps;
	useEffect(() => {
		const engine = new TegakiEngine(containerRef.current, { adopt: true });
		engineRef.current = engine;
		return () => {
			engine.destroy();
			engineRef.current = null;
		};
	}, []);
	useEffect(() => {
		engineRef.current?.update(engineOptions);
	});
	const onTextChangeRef = useRef(onTextChange);
	onTextChangeRef.current = onTextChange;
	useEffect(() => {
		if (!editable) return;
		const container = containerRef.current;
		if (!container) return;
		const overlay = container.querySelector("[data-tegaki=\"overlay\"]");
		if (!overlay) return;
		overlay.contentEditable = "plaintext-only";
		overlay.style.caretColor = "auto";
		const handleInput = () => {
			const newText = overlay.textContent ?? "";
			setInternalText(newText);
			onTextChangeRef.current?.(newText);
		};
		overlay.addEventListener("input", handleInput);
		return () => {
			overlay.removeEventListener("input", handleInput);
			overlay.contentEditable = "inherit";
			overlay.style.caretColor = "";
		};
	}, [editable]);
	useImperativeHandle(ref, () => ({
		get engine() {
			return engineRef.current;
		},
		get element() {
			return containerRef.current;
		}
	}), []);
	const mergedStyle = {
		...rootStyle,
		...elementProps.style
	};
	return createElement(Tag, {
		...rootAttrs,
		...elementProps,
		ref: containerRef,
		style: mergedStyle
	}, content);
}
//#endregion
export { TegakiRenderer as t };

//# sourceMappingURL=react-174En_ya.mjs.map