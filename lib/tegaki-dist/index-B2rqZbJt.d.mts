import { v as TegakiEffects } from "./shaper-registry-CrfNiB1j.mjs";
import { i as TegakiEngine, o as TegakiEngineOptions } from "./index-BVYJFRMq.mjs";
import * as _$react from "react";
import { ComponentPropsWithoutRef, ElementType, Ref } from "react";

//#region src/lib/utils.d.ts
type Coercible = string | number | boolean | null | undefined | readonly Coercible[];
//#endregion
//#region src/react/TegakiRenderer.d.ts
/** Imperative handle exposed via the `ref` prop. */
interface TegakiRendererHandle {
  /** The underlying engine instance. `null` before mount and after unmount. */
  readonly engine: TegakiEngine | null;
  /** The container DOM element. */
  readonly element: HTMLElement | null;
}
interface TegakiRendererBaseProps<E extends TegakiEffects<E> = Record<string, never>> extends Omit<TegakiEngineOptions, 'effects'> {
  /** Imperative handle ref for playback controls and DOM access. */
  ref?: Ref<TegakiRendererHandle>;
  /** Children coerced to string. Strings and numbers are kept; everything else is ignored. */
  children?: Coercible;
  /** Visual effects applied during canvas rendering. */
  effects?: E;
  /** When true, the rendered text is editable via contentEditable. */
  editable?: boolean;
  /** Called when the user edits the text (only when `editable` is true). */
  onTextChange?: (text: string) => void;
}
type TegakiRendererProps<C extends ElementType = 'div', E extends TegakiEffects<E> = Record<string, never>> = {
  as?: C;
} & TegakiRendererBaseProps<E> & Omit<ComponentPropsWithoutRef<C>, keyof TegakiRendererBaseProps<Record<string, never>> | 'as'>;
declare function TegakiRenderer<const C extends ElementType = 'div', const E extends TegakiEffects<E> = Record<string, never>>(props: TegakiRendererProps<C, E>): _$react.ReactElement<any, string | _$react.JSXElementConstructor<any>>;
//#endregion
export { TegakiRendererHandle as n, TegakiRendererProps as r, TegakiRenderer as t };
//# sourceMappingURL=index-B2rqZbJt.d.mts.map