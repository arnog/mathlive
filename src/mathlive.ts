/* eslint-disable no-new */
import type { StaticRenderOptions } from './public/options';
export * from './public/mathlive';

import {
  StaticRenderOptionsPrivate,
  _renderMathInElement,
} from './addons/static-render';
export * from './addons/static-render';

import './virtual-keyboard/commands';

import {
  convertLatexToMarkup,
  convertLatexToMathMl,
  convertLatexToSpeakableText,
  convertMathJsonToLatex,
} from './public/mathlive-ssr';

/** @hidden */
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
  readAloudMathfield: any; // _Mathfield;
};

// Note that this global is only global to the "browsing context". In the
// case of a page containing iframes, each iframe is a separate browsing
// context, and therefore will have its own `globalMathLive()`
/** @hidden */
export function globalMathLive(): MathLiveGlobal {
  globalThis[Symbol.for('io.cortexjs.mathlive')] ??= {};
  return globalThis[Symbol.for('io.cortexjs.mathlive')];
}

/**
 * Transform all the elements in the document body that contain LaTeX code
 * into typeset math.
 *
 * **Caution**
 *
 * This is a very expensive call, as it needs to parse the entire
 * DOM tree to determine which elements need to be processed. In most cases
 * this should only be called once per document, once the DOM has been loaded.
 *
 * To render a specific element, use {@linkcode renderMathInElement | renderMathInElement()}
 *
 *
 * @example
 * import { renderMathInDocument } from 'https://unpkg.com/mathlive?module';
 * renderMathInDocument();
 *
 * @category Static Rendering
 * @keywords render, document, autorender
 */

export function renderMathInDocument(options?: StaticRenderOptions): void {
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', () =>
      renderMathInElement(document.body, options)
    );
  else renderMathInElement(document.body, options);
}

function getElement(element: string | HTMLElement): HTMLElement | null {
  if (typeof element === 'string') {
    const result = document.getElementById(element);
    if (result === null)
      throw new Error(`The element with ID "${element}" could not be found.`);

    return result;
  }

  return element;
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
 * renderMathInElement("formula");
 *
 * @category Static Rendering
 * @keywords render, element, htmlelement
 */

export function renderMathInElement(
  element: string | HTMLElement,
  options?: StaticRenderOptions
): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () =>
      renderMathInElement(element, options)
    );
    return;
  }

  const el = getElement(element);
  if (!el) return;

  const optionsPrivate: StaticRenderOptionsPrivate = options ?? {};
  optionsPrivate.renderToMarkup ??= convertLatexToMarkup;
  optionsPrivate.renderToMathML ??= convertLatexToMathMl;
  optionsPrivate.renderToSpeakableText ??= convertLatexToSpeakableText;
  optionsPrivate.serializeToLatex ??= convertMathJsonToLatex;
  _renderMathInElement(el, optionsPrivate);
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
//   ENVIRONMENTS: MathLiveDebug.ENVIRONMENTS,
//   DEFAULT_KEYBINDINGS: MathLiveDebug.DEFAULT_KEYBINDINGS,
//   getKeybindingMarkup: MathLiveDebug.getKeybindingMarkup,
// };
