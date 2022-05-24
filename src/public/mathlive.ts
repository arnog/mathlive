/**
 *
 * Use MathLive to render and edit mathematical formulas.
 *
 *
 * Read {@tutorial mathfield-getting-started | Getting Started} for more info.
 *
 * @example
 * <script type="module">
 * // Load the `Mathlive` module from a CDN
 * import { convertLatexToSpeakableText } from 'https://unpkg.com/mathlive?module';
 *
 * console.log(convertLatexToSpeakableText('e^{i\\pi}+1=0'));
 * </script>
 *
 * @packageDocumentation MathLive SDK Reference {{SDK_VERSION}}
 * @version {{SDK_VERSION}}
 *
 */

import { AutoRenderOptions } from '../mathlive';
import {
  MacroDictionary,
  Registers,
  ErrorListener,
  ParserErrorCode,
  MathfieldErrorCode,
} from './core';
import { RemoteVirtualKeyboardOptions, TextToSpeechOptions } from './options';

export * from './commands';
export * from './core';
export * from './options';
export * from './mathfield';
export * from './mathfield-element';

export * from '../mathlive';

/**
 * Initialize remote client for mathfield elements rendered in child frames.
 * This client instance control focus between multiple frames and mathfield elements and
 * renders the virtual keyboard with required options passed by params of this method.
 *
 * @param options Options to configure virtual keyboard that will be rendered on this frame.
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
 *  makeSharedVirtualKeyboard({});
 * ```
 * @keywords create, make, mathfield, iframe
 */
export declare function makeSharedVirtualKeyboard(
  options: Partial<RemoteVirtualKeyboardOptions>
): void;
/**
 * Convert a LaTeX string to a string of HTML markup.
 *
 * **(Note)**
 *
 * This function does not interact with the DOM. It can be used
 * on the server side. The function does not load fonts or inject stylesheets
 * in the document. To get the output of this function to correctly display
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
 * @param options.mathstyle If `'displaystyle'` the "display" mode of TeX
 * is used to typeset the formula, which is most appropriate for formulas that are
 * displayed in a standalone block.
 *
 * If `'textstyle'` is used, the "text" mode
 * of TeX is used, which is most appropriate when displaying math "inline"
 * with other text (on the same line).
 *
 * @param  options.macros A dictionary of LaTeX macros
 *
 * @param  options.onError A function invoked when a syntax error is encountered.
 * An attempt to recover will be made even when an error is reported.
 *
 * @category Converting
 * @keywords convert, latex, markup
 */
export declare function convertLatexToMarkup(
  text: string,
  options?: {
    mathstyle?: 'displaystyle' | 'textstyle';
    letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
    macros?: MacroDictionary;
    registers?: Registers;
    colorMap?: (name: string) => string | undefined;
    backgroundColorMap?: (name: string) => string | undefined;
    onError?: ErrorListener<ParserErrorCode>;
    format?: string;
  }
): string;
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
export declare function convertLatexToMathMl(
  latex: string,
  options?: Partial<{
    macros: MacroDictionary;
    registers?: Registers;
    colorMap?: (name: string) => string | undefined;
    backgroundColorMap?: (name: string) => string | undefined;
    onError: ErrorListener<ParserErrorCode>;
    generateID: boolean;
  }>
): string;
/**
 * Convert a LaTeX string to a textual representation ready to be spoken
 *
 * @param latex A string of valid LaTeX. It does not have to start
 * with a mode token such as a `$$` or `\(`.
 *
 * @param options {@inheritDoc TextToSpeechOptions}
 * @param options.onError Callback invoked when an error is encountered while
 * parsing the input string.
 *
 * @return The spoken representation of the input LaTeX.
 * @example
 * console.log(convertLatexToSpeakableText('\\frac{1}{2}'));
 * // 'half'
 * @category Converting
 * @keywords convert, latex, speech, speakable, text, speakable text
 */
export declare function convertLatexToSpeakableText(
  latex: string,
  options?: Partial<
    TextToSpeechOptions & {
      macros?: MacroDictionary;
      registers?: Registers;
      colorMap?: (name: string) => string | undefined;
      backgroundColorMap?: (name: string) => string | undefined;
      onError?: ErrorListener<ParserErrorCode | MathfieldErrorCode>;
    }
  >
): string;
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
export declare function renderMathInDocument(options?: AutoRenderOptions): void;
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
export declare function renderMathInElement(
  element: string | HTMLElement,
  options?: AutoRenderOptions
): void;
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
export declare const version: {
  mathlive: string;
  computeEngine: string;
};
