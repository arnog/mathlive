/* eslint-disable no-new */
import type { AutoRenderOptions } from './public/options';
export * from './public/mathlive';

import {
  AutoRenderOptionsPrivate,
  autoRenderMathInElement,
} from './addons/auto-render';
export * from './addons/auto-render';

import './virtual-keyboard/commands';

import {
  convertLatexToMarkup,
  convertLatexToMathMl,
  convertLatexToSpeakableText,
  serializeMathJsonToLatex,
} from './public/mathlive-ssr';
import type { VirtualKeyboardInterface } from './public/virtual-keyboard';

export type MathLiveGlobal = {
  version: string;
  readAloudElement: null | HTMLElement;
  readAloudMarks: { value: string; time: number }[];
  readAloudTokens: string[];
  readAloudCurrentToken: string;
  readAloudFinalToken: null | string;
  readAloudCurrentMark: string;
  readAloudAudio: HTMLAudioElement;
  readAloudStatus: string;
  readAloudMathField: any; // MathfieldPrivate;
};

// Note that this global is only global to the "browsing context". In the
// case of a page containing iframes, each iframe is a separate browsing
// context, and therefore will have its own `globalMathLive()`
export function globalMathLive(): MathLiveGlobal {
  globalThis[Symbol.for('io.cortexjs.mathlive')] ??= {};
  return globalThis[Symbol.for('io.cortexjs.mathlive')];
}

/**
 * This function is deprecated and is no longer necessary: the virtual
 * keyboard is always shared. This function will be removed in a future release
 * of MathLive.
 *
 * To access the global shared virtual keyboard use `window.mathVirtualKeyboard`
 *
 * @keywords create, make, mathfield, iframe
 * @deprecated
 */
export function makeSharedVirtualKeyboard(): VirtualKeyboardInterface {
  console.warn(
    `%cMathLive {{SDK_VERSION}}: %cmakeSharedVirtualKeyboard() is deprecated. 
    Use \`window.mathVirtualKeyboard\` to access the virtual keyboard instance.
    See https://cortexjs.io/mathlive/changelog/ for details.`,
    'color:#12b; font-size: 1.1rem',
    'color:#db1111; font-size: 1.1rem'
  );
  return window.mathVirtualKeyboard;
}

/**
 * Transform all the elements in the document body that contain LaTeX code
 * into typeset math.
 *
 * **(Caution):**
 * This is a very expensive call, as it needs to parse the entire
 * DOM tree to determine which elements need to be processed. In most cases
 * this should only be called once per document, once the DOM has been loaded.
 *
 * To render a specific element, use {@linkcode renderMathInElement | renderMathInElement()}
 * ---
 *
 *
 * @example
 * import { renderMathInDocument } from 'https://unpkg.com/mathlive?module';
 * if (window.readyState === "loading")
 *  document.addEventListener("DOMContentLoaded", () => renderMathInDocument());
 * else
 *   renderMathInDocument();
 *
 * @category Rendering
 * @keywords render, document, autorender
 */

export function renderMathInDocument(options?: AutoRenderOptions): void {
  renderMathInElement(document.body, options);
}

function getElement(element: string | HTMLElement): HTMLElement | null {
  if (typeof element === 'string') {
    const result = document.getElementById(element);
    if (result === null)
      throw new Error(`The element with ID "${element}" could not be found.`);

    return result;
  }

  return typeof element === 'string' ? null : element;
}

/**
 * Transform all the children of `element` that contain LaTeX code
 * into typeset math, recursively.
 *
 *
 * @param element An HTML DOM element, or a string containing
 * the ID of an element.
 *
 * @example
 * import { renderMathInElement } from 'https://unpkg.com/mathlive?module';
 * if (window.readyState === "loading")
 *  document.addEventListener("DOMContentLoaded", () => renderMathInElement("formula"));
 * else
 *   renderMathInElement("formula");
 *
 * @category Rendering
 * @keywords render, element, htmlelement
 */

export function renderMathInElement(
  element: string | HTMLElement,
  options?: AutoRenderOptions
): void {
  const el = getElement(element);
  if (!el) return;
  const optionsPrivate: AutoRenderOptionsPrivate = options ?? {};
  optionsPrivate.renderToMarkup ??= convertLatexToMarkup;
  optionsPrivate.renderToMathML ??= convertLatexToMathMl;
  optionsPrivate.renderToSpeakableText ??= convertLatexToSpeakableText;
  optionsPrivate.serializeToLatex ??= serializeMathJsonToLatex;
  autoRenderMathInElement(el, optionsPrivate);
}

/**
 * Current version: `{{SDK_VERSION}}`
 *
 * The version string of the SDK using the [semver](https://semver.org/) convention:
 *
 * `MAJOR`.`MINOR`.`PATCH`
 *
 * * **`MAJOR`** is incremented for incompatible API changes
 * * **`MINOR`** is incremented for new features
 * * **`PATCH`** is incremented for bug fixes
 */

export const version = {
  mathlive: '{{SDK_VERSION}}',
};

/** @internal */
// export const debug = {
//   FUNCTIONS: MathLiveDebug.FUNCTIONS,
//   MATH_SYMBOLS: MathLiveDebug.MATH_SYMBOLS,
//   TEXT_SYMBOLS: MathLiveDebug.TEXT_SYMBOLS,
//   ENVIRONMENTS: MathLiveDebug.ENVIRONMENTS,
//   DEFAULT_KEYBINDINGS: MathLiveDebug.DEFAULT_KEYBINDINGS,
//   getKeybindingMarkup: MathLiveDebug.getKeybindingMarkup,
// };
