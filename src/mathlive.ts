/* eslint-disable no-new */
import type {
  AutoRenderOptions,
  MathfieldOptions,
  RemoteVirtualKeyboardOptions,
} from './public/options';
export * from './public/mathlive';

import {
  AutoRenderOptionsPrivate,
  autoRenderMathInElement,
} from './addons/auto-render';
export * from './addons/auto-render';
import MathLiveDebug from './addons/debug';
import './addons/definitions-metadata';

import { VirtualKeyboard } from './editor/virtual-keyboard-utils';
import './editor/virtual-keyboard-commands';
import { RemoteVirtualKeyboard } from './editor-mathfield/remote-virtual-keyboard';

import { isBrowser, throwIfNotInBrowser } from './common/capabilities';
import {
  convertLatexToMarkup,
  convertLatexToMathMl,
  convertLatexToSpeakableText,
  serializeMathJsonToLatex,
} from 'public/mathlive-ssr';

export type MathLiveGlobal = {
  version: string;
  sharedVirtualKeyboard?: RemoteVirtualKeyboard;
  visibleVirtualKeyboard?: VirtualKeyboard;
  config: Partial<MathfieldOptions>; // for speechEngine, speakHook
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

export function globalMathLive(): MathLiveGlobal {
  globalThis[Symbol.for('io.cortexjs.mathlive')] ??= {};
  return globalThis[Symbol.for('io.cortexjs.mathlive')];
}

/**
 * Setup the document to use a single shared virtual keyboard amongst
 * all `<math-field>` instances in the document, including those in _iframes_.
 *
 * `makeSharedVirtualKeyboard()` should be called as early as possible,
 * and before any new mathfield element is created: it doesn't apply
 * retroactively.
 *
 * `<math-field>` elements in an _iframe_ should have the
 * `use-shared-virtual-keyboard` attribute.
 *
 * The shared virtual keyboard coordinates focus between multiple mathfield
 * elements and renders the virtual keyboard with the options passed by param
 * of this method.
 *
 * Calling `setOptions()` on a mathfield with options related to the keyboard
 * will affect this shared virtual keyboard instance when the mathfield is
 * focused.
 *
 * @param options Options to configure the shared virtual keyboard.
 *
 * ```html
 * <iframe src="...">
 *      <!-- The iframe page content -->
 *      <math-field virtual-keyboard-mode="onfocus" use-shared-virtual-keyboard />
 *
 *      <script type="module">
 *          import 'https://unpkg.com/mathlive?module';
 *      </script>
 * </iframe>
 * ```
 *
 * ```javascript
 *  import { makeSharedVirtualKeyboard } from 'https://unpkg.com/mathlive?module';
 *
 *  makeSharedVirtualKeyboard();
 * ```
 * Read more about [sharing virtual keyboards](https://cortexjs.io/mathlive/guides/virtual-keyboards/#shared-virtual-keyboard)
 *
 * @keywords create, make, mathfield, iframe
 */
export function makeSharedVirtualKeyboard(
  options?: Partial<RemoteVirtualKeyboardOptions>
): RemoteVirtualKeyboard {
  if (!globalMathLive().sharedVirtualKeyboard) {
    if (
      [...document.querySelectorAll('math-field')].some(
        (x) =>
          x.isConnected &&
          x['_mathfield'] &&
          x['_mathfield']['_virtualKeyboard']
      )
    ) {
      console.error(
        'ERROR: makeSharedVirtualKeyboard() must be called before any mathfield element is connected to the DOM'
      );
    }
    globalMathLive().sharedVirtualKeyboard = new RemoteVirtualKeyboard(options);
  }
  return globalMathLive().sharedVirtualKeyboard!;
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
 * document.addEventListener("load", () => renderMathInDocument());
 *
 * @category Rendering
 * @keywords render, document, autorender
 */

export function renderMathInDocument(options?: AutoRenderOptions): void {
  throwIfNotInBrowser();
  renderMathInElement(document.body, options);
}

function getElement(element: string | HTMLElement): HTMLElement | null {
  if (typeof element === 'string' && isBrowser()) {
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
 * document.addEventListener("load", () => renderMathInElement('formula));
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
export const debug = {
  FUNCTIONS: MathLiveDebug.FUNCTIONS,
  MATH_SYMBOLS: MathLiveDebug.MATH_SYMBOLS,
  TEXT_SYMBOLS: MathLiveDebug.TEXT_SYMBOLS,
  ENVIRONMENTS: MathLiveDebug.ENVIRONMENTS,
  DEFAULT_KEYBINDINGS: MathLiveDebug.DEFAULT_KEYBINDINGS,
  getKeybindingMarkup: MathLiveDebug.getKeybindingMarkup,
};
