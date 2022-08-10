/* eslint-disable no-new */
import type {
  AutoRenderOptions,
  RemoteVirtualKeyboardOptions,
  TextToSpeechOptions,
} from './public/options';

import { Atom } from './core/atom-class';
import {
  parseLatex,
  validateLatex as validateLatexInternal,
} from './core/parser';
import { adjustInterAtomSpacing, coalesce, makeStruts, Box } from './core/box';
import {
  AutoRenderOptionsPrivate,
  autoRenderMathInElement,
} from './addons/auto-render';
import MathLiveDebug, {
  asciiMathToLatex,
  latexToAsciiMath,
} from './addons/debug';
import { atomToSpeakableText } from './editor/atom-to-speakable-text';
import { atomsToMathML } from './addons/math-ml';

import './addons/definitions-metadata';

import './editor/virtual-keyboard-commands';
import { RemoteVirtualKeyboard } from './editor-mathfield/remote-virtual-keyboard';
import { Context } from './core/context';
import { defaultGlobalContext } from './core/core';
import { DEFAULT_FONT_SIZE } from './core/font-metrics';
import { isBrowser, throwIfNotInBrowser } from './common/capabilities';

export * from './public/mathlive';
export * from './addons/auto-render';

import { version as computeEngineVersion } from '@cortex-js/compute-engine';
import { LatexSyntaxError } from './public/mathlive';
export * from '@cortex-js/compute-engine';

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
  if (!window.mathlive?.sharedVirtualKeyboard) {
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
    if (!window.mathlive) window.mathlive = {};
    window.mathlive.sharedVirtualKeyboard = new RemoteVirtualKeyboard(options);
  }
  return window.mathlive?.sharedVirtualKeyboard;
}

/**
 * Convert a LaTeX string to a string of HTML markup.
 *
 * **(Note)**
 *
 * This function does not interact with the DOM. The function does not load
 * fonts or inject stylesheets in the document. It can be used
 * on the server side.
 *
 * To get the output of this function to correctly display
 * in a document, use the mathlive static style sheet by adding the following
 * to the `<head>` of the document:
 *
 * ```html
 * <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
 * ```
 *
 * ---
 *
 * @param text A string of valid LaTeX. It does not have to start
 * with a mode token such as `$$` or `\(`.
 *
 * @param options.mathstyle If `"displaystyle"` the "display" mode of TeX
 * is used to typeset the formula, which is most appropriate for formulas that are
 * displayed in a standalone block.
 *
 * If `"textstyle"` is used, the "text" mode
 * of TeX is used, which is most appropriate when displaying math "inline"
 * with other text (on the same line).
 *
 * @param  options.macros A dictionary of LaTeX macros
 *
 *
 * @category Converting
 * @keywords convert, latex, markup
 */
export function convertLatexToMarkup(
  text: string,
  options?: {
    mathstyle?: 'displaystyle' | 'textstyle';
    format?: string;
  }
): string {
  options = options ?? {};
  options.mathstyle = options.mathstyle ?? 'displaystyle';

  const context = defaultGlobalContext();

  //
  // 1. Parse the formula and return a tree of atoms, e.g. 'genfrac'.
  //
  const root = new Atom('root', context);
  root.body = parseLatex(text, context, {
    parseMode: 'math',
    mathstyle: options.mathstyle,
  });

  //
  // 2. Transform the math atoms into elementary boxes
  // for example from genfrac to VBox.
  //
  const box = root.render(
    new Context(
      {
        registers: context.registers,
        renderPlaceholder: () => new Box(0xa0, { maxFontSize: 1.0 }),
      },
      {
        fontSize: DEFAULT_FONT_SIZE,
        letterShapeStyle: context.letterShapeStyle,
      },
      options.mathstyle
    )
  );

  if (!box) return '';

  //
  // 3. Adjust to `mord` according to TeX spacing rules
  //
  adjustInterAtomSpacing(box);

  //
  // 2. Simplify by coalescing adjacent boxes
  //    for example, from <span>1</span><span>2</span>
  //    to <span>12</span>
  //
  coalesce(box);

  //
  // 4. Wrap the expression with struts
  //
  const wrapper = makeStruts(box, { classes: 'ML__mathlive' });

  //
  // 5. Generate markup
  //

  return wrapper.toMarkup();
}

export function validateLatex(s: string): LatexSyntaxError[] {
  return validateLatexInternal(s, defaultGlobalContext());
}

/**
 * Convert a LaTeX string to a string of MathML markup.
 *
 * @param latex A string of valid LaTeX. It does not have to start
 * with a mode token such as a `$$` or `\(`.
 * @param options.generateId If true, add an `"extid"` attribute
 * to the MathML nodes with a value matching the `atomID`. This can be used
 * to map items on the screen with their MathML representation or vice-versa.
 * @param options.onError Callback invoked when an error is encountered while
 * parsing the input string.
 *
 * @category Converting
 */

export function convertLatexToMathMl(
  latex: string,
  options: { generateID?: boolean } = {}
): string {
  return atomsToMathML(
    parseLatex(latex, defaultGlobalContext(), {
      parseMode: 'math',
      args: () => '',
      mathstyle: 'displaystyle',
    }),
    options
  );
}

/**
 * Convert a LaTeX string to a textual representation ready to be spoken
 *
 * @param latex A string of valid LaTeX. It does not have to start
 * with a mode token such as a `$$` or `\(`.
 *
 * @param options {@inheritDoc TextToSpeechOptions}
 *
 * @return The spoken representation of the input LaTeX.
 * @example
 * console.log(convertLatexToSpeakableText('\\frac{1}{2}'));
 * // 'half'
 * @category Converting
 * @keywords convert, latex, speech, speakable, text, speakable text
 */
export function convertLatexToSpeakableText(
  latex: string,
  options: Partial<TextToSpeechOptions> = {}
): string {
  const atoms = parseLatex(latex, defaultGlobalContext(), {
    parseMode: 'math',
    mathstyle: 'displaystyle',
  });

  return atomToSpeakableText(atoms, options as Required<TextToSpeechOptions>);
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
 * Read {@tutorial getting-started | Getting Started}.
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
 * Read {@tutorial mathfield-getting-started | Getting Started}.
 *
 * @param element An HTML DOM element, or a string containing
 * the ID of an element.
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
  computeEngine: computeEngineVersion,
};

/** @internal */
export const debug = {
  latexToAsciiMath,
  asciiMathToLatex,
  FUNCTIONS: MathLiveDebug.FUNCTIONS,
  MATH_SYMBOLS: MathLiveDebug.MATH_SYMBOLS,
  TEXT_SYMBOLS: MathLiveDebug.TEXT_SYMBOLS,
  ENVIRONMENTS: MathLiveDebug.ENVIRONMENTS,
  DEFAULT_KEYBINDINGS: MathLiveDebug.DEFAULT_KEYBINDINGS,
  getKeybindingMarkup: MathLiveDebug.getKeybindingMarkup,
};
