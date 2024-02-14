/**
 *
 * Importing this package in a web page will make the `<math-field>` custom
 * element available. Use it as a drop-in replacement for `<textarea>` or
 * `<input type="text">` to allow the user to type and edit mathematical
 * expressions.
 *
 *
 * @example
 *
 * ```html
 * <script src="https://unpkg.com/mathlive"></script>
 *  <math-field>\frac{1}{2}</math-field>
 * <script>
 * const mf = document.querySelector('math-field');
 * mf.addEventListener('input', (ev) => {
 *  console.log('New value:', mf.value);
 * });
 * </script>
 * ```
 *
 * @packageDocumentation Mathfield API Reference
 * @version {{SDK_VERSION}}
 *
 */

import type { VirtualKeyboardInterface } from './virtual-keyboard';
import type { StaticRenderOptions } from './options';

export * from './commands';
export * from './core-types';
export * from './options';
export * from './mathfield';
export * from './mathfield-element';
export * from './mathlive-ssr';
export * from './virtual-keyboard';

export declare function renderMathInDocument(
  options?: StaticRenderOptions
): void;

export declare function renderMathInElement(
  element: string | HTMLElement,
  options?: StaticRenderOptions
): void;

export declare const version: {
  mathlive: string;
};

declare global {
  interface Window {
    mathVirtualKeyboard: VirtualKeyboardInterface & EventTarget;
  }
}
