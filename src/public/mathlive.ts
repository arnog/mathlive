/**
 *
 * Use MathLive to render and edit mathematical formulas.
 *
 *
 * @example
 * <script type="module">
 * // Load the `MathLive` module from a CDN
 * import { convertLatexToSpeakableText } from 'https://unpkg.com/mathlive?module';
 *
 * console.log(convertLatexToSpeakableText('e^{i\\pi}+1=0'));
 * </script>
 *
 * @packageDocumentation MathLive SDK Reference {{SDK_VERSION}}
 * @version {{SDK_VERSION}}
 *
 */

import type { VirtualKeyboardOptions } from 'virtual-keyboard/public';
import type { VirtualKeyboardInterface } from 'virtual-keyboard/types';
import type { AutoRenderOptions } from './options';

export * from './commands';
export * from '../core/types';
export * from './options';
export * from './mathfield';
export * from './mathfield-element';
export * from './mathlive-ssr';

export declare function makeSharedVirtualKeyboard(
  options?: Partial<VirtualKeyboardOptions>
): VirtualKeyboardInterface & EventTarget;

export declare function renderMathInDocument(options?: AutoRenderOptions): void;

export declare function renderMathInElement(
  element: string | HTMLElement,
  options?: AutoRenderOptions
): void;

export declare const version: {
  mathlive: string;
};
