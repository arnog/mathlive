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
 * import { convertLatexToSpeakableText } from 'https://unpkg.com/mathlive/dist/mathlive.min.mjs';
 *
 * console.log(convertLatexToSpeakableText('e^{i\\pi}+1=0'));
 * </script>
 *
 * @packageDocumentation MathLive SDK Reference {{SDK_VERSION}}
 * @version {{SDK_VERSION}}
 *
 */

import { Mathfield } from './mathfield';
import { MathfieldElement } from './mathfield-element';
import {
  MathfieldOptions,
  RemoteVirtualKeyboardOptions,
  TextToSpeechOptions,
} from './options';
import { MacroDictionary, ErrorListener, ParserErrorCode } from './core';

export { Mathfield };
export { MathfieldOptions as MathfieldConfig };
export { MathfieldElement };

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
export declare const version: string;

/**
 * Convert a DOM element into an editable mathfield.
 *
 * Consider using a `<math-field>` tag or `new MathfieldElement()` instead. {.notice--warning}
 *
 * The `mathfield` property of the DOM element is a reference to the corresponding
 * `Mathfield` object. This value is also returned by `makeMathField()`.
 *
 * @param element A DOM element, for example as obtained
 * by `document.getElementById()`, or the ID of a DOM element as a string.
 *
 *
 * Given the HTML markup:
 * ```html
 * <span id='equation'>$f(x)=sin(x)$</span>
 * ```
 * The following code will turn the span into an editable mathfield.
 * ```javascript
 * import { makeMathField } from 'https://unpkg.com/mathlive/dist/mathlive.min.mjs';
 * makeMathField('equation');
 * ```
 * @keywords create, make, mathfield
 * @deprecated Use `new [[MathfieldElement]]()`
 */
export declare function makeMathField(
  element: HTMLElement | string,
  options: Partial<MathfieldOptions>
): Mathfield;

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
 *          import { makeMathField } from 'https://unpkg.com/mathlive/dist/mathlive.min.mjs';
 *      </script>
 * </iframe>
 * ```
 *
 * ```javascript
 *  import { makeRemoteClient } from 'https://unpkg.com/mathlive/dist/mathlive.min.mjs';
 *
 *  makeRemoteClient({});
 * ```
 * @keywords create, make, mathfield, iframe
 */
export declare function makeSharedVirtualKeyboard(
  options: RemoteVirtualKeyboardOptions
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
 * ```html
 *     <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
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
    onError?: ErrorListener<ParserErrorCode>;
  }
): string;

/**
 * @deprecated Use [[`convertLatexToMarkup`]]
 * @category Converting
 */
export declare function latexToMarkup(
  text: string,
  options?: {
    mathstyle?: 'displaystyle' | 'textstyle';
    letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
    macros?: MacroDictionary;
    onError?: ErrorListener<ParserErrorCode>;
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
  options?: {
    macros?: MacroDictionary;
    generateID: boolean;
    onError?: ErrorListener<ParserErrorCode>;
  }
): string;

/**
 * @deprecated Use [[`convertLatexToMathMl`]]
 * @category Converting
 */
export declare function latexToMathML(
  latex: string,
  options?: {
    macros?: MacroDictionary;
    generateID: boolean;
    onError?: ErrorListener<ParserErrorCode>;
  }
): string;

/**
 * Convert a LaTeX string to a {@tutorial math-json | MathJSON } Abstract Syntax Tree
 *
 * **See Also:** [[astToLatex|astToLatex()]]
 *
 * @param latex A string of valid LaTeX. It does not have to start
 * with a mode token such as a `$$` or `\(`.
 * @param options.macros A dictionary of LaTeX macros
 * @param options.onError Callback invoked when an error is encountered while
 * parsing the input string.
 *
 * @return  The Abstract Syntax Tree as an object literal using the MathJSON format.
 * @category Converting
 * @keywords convert, latex, mathjson, ast
 * @deprecated Use MathJSON
 */
export declare function latexToAST(
  latex: string,
  options?: {
    macros?: MacroDictionary;
    onError?: ErrorListener<ParserErrorCode | string>;
  }
);

/**
 * Converts a {@tutorial math-json | MathJSON } Abstract Syntax Tree to a LaTeX string.
 *
 * **See Also:** [[latexToAST|latexToAST()]]
 *
 * @return The LaTeX representation of the Abstract Syntax Tree, if valid.
 * @category Converting
 * @keywords convert, latex, mathjson, ast
 * @deprecated Use MathJSON
 */
export declare function astToLatex(
  mathJson: any,
  options?: {
    /** The number of digits used in the representation of numbers. **Default** = 14 */
    precision?: number;
    /** The character used as the decimal marker. **Default** = `"."`. */
    decimalMarker?: string;
    /** The character used to separate group of numbers, typically thousands. **Default** = `"\\, "` */
    groupSeparator?: string;
    /** The character used to indicate product. Other option would be `"\\times "`. **Default** = `"\\cdot "` */
    product?: string;
    /** The character used before an exponent indicator. **Default** = `"\\cdot "` */
    exponentProduct?: string;
    /** The character used to indicate an exponent. **Default** = `""` */
    exponentMarker?: string;
    /** The format used for numbers using the scientific notation. **Default** = `"auto"` * /
        scientificNotation?: 'auto' | 'engineering' | 'on';
        /** The string used at the begining of repeating digits. **Default** = `"\\overline{"` */
    beginRepeatingDigits?: string;
    /** The string used at the end of repeating digits. **Default** = `"}"` */
    endRepeatingDigits?: string;
  }
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
  options: TextToSpeechOptions & {
    macros?: MacroDictionary;
    onError?: ErrorListener<ParserErrorCode>;
  }
): string;

/**
 * @deprecated Use [[`convertLatexToSpeakableText`]]
 * @category Converting
 */
export declare function latexToSpeakableText(
  latex: string,
  options: TextToSpeechOptions & {
    macros?: MacroDictionary;
    onError?: ErrorListener<ParserErrorCode>;
  }
): string;

export type AutoRenderOptions = {
  /** Namespace that is added to `data-`  attributes to avoid collisions with other libraries.
   *
   * It is empty by default.
   *
   * The namespace should be a string of lowercase letters.
   */
  namespace?: string;

  /**
   * A URL fragment pointing to the directory containing the fonts
   * necessary to render a formula.
   *
   * These fonts are available in the `/dist/fonts` directory of the SDK.
   *
   * Customize this value to reflect where you have copied these fonts,
   * or to use the CDN version.
   *
   * The default value is './fonts'.
   *
   * Changing this setting after the mathfield has been created will have
   * no effect.
   *
   * ```javascript
   * {
   *      // Use the CDN version
   *      fontsDirectory: ''
   * }
   * ```
   * ```javascript
   * {
   *      // Use a directory called 'fonts', located next to the
   *      // `mathlive.js` (or `mathlive.mjs`) file.
   *      fontsDirectory: './fonts'
   * }
   * ```
   * ```javascript
   * {
   *      // Use a directory located at the top your website
   *      fontsDirectory: 'https://example.com/fonts'
   * }
   * ```
   *
   */
  fontsDirectory?: string;

  /**
   * Support for [Trusted Type](https://w3c.github.io/webappsec-trusted-types/dist/spec/).
   *
   * This optional function will be called whenever the DOM is modified
   * by injecting a string of HTML, allowing that string to be sanitized
   * according to a policy defined by the host.
   */
  createHTML?: (html: string) => any;

  /** Custom LaTeX macros */
  macros?: MacroDictionary;

  /** An array of tag names whose content will
   *  not be scanned for delimiters (unless their class matches the `processClass`
   * pattern below.
   *
   * **Default:** `['noscript', 'style', 'textarea', 'pre', 'code', 'annotation', 'annotation-xml']`
   */
  skipTags?: string[];

  /**
   * A string used as a regular expression of class names of elements whose content will not be
   * scanned for delimiter
   *
   * **Default**: `'tex2jax_ignore'`
   */
  ignoreClass?: string;

  /**
   * A string used as a
   * regular expression of class names of elements whose content **will** be
   * scanned for delimiters,  even if their tag name or parent class name would
   * have prevented them from doing so.
   *
   * **Default**: `'tex2jax_process'`
   *
   * */
  processClass?: string;

  /**
   * `<script>` tags of the
   * indicated type will be processed while others will be ignored.
   *
   * **Default**: `'math/tex'`
   */
  processScriptType?: string;

  /** The format(s) in
   * which to render the math for screen readers:
   * - `'mathml'` MathML
   * - `'speakable-text'` Spoken representation
   *
   * You can pass an empty string to turn off the rendering of accessible content.
   * You can pass multiple values separated by spaces, e.g `'mathml speakable-text'`
   *
   * **Default**: `'mathml'`
   */
  renderAccessibleContent?: string;

  /** If true, store the
   * original textual content of the element in a `data-original-content`
   * attribute. This value can be accessed for example to restore the element to
   * its original value:
   * ```javascript
   *      elem.innerHTML = elem.dataset.originalContent;
   * ```
   * @deprecatd
   *
   */
  preserveOriginalContent?: boolean;

  /**
   * If true, generate markup that can
   * be read aloud later using {@linkcode speak}
   *
   * **Default**: `false`
   */
  readAloud?: boolean;

  TeX?: {
    /** If false, math expression
     * that start with `\begin{` will not automatically be rendered.
     */

    processEnvironments?: boolean;

    /**
     * Delimiter pairs that will trigger a render of the content in
     * display style or inline, respectively.
     *
     * **Default**: `{display: [ ['$$', '$$'], ['\\[', '\\]'] ] ], inline: [ ['\\(','\\)'] ] ]}`
     *
     */
    delimiters?: {
      display: [openDelim: string, closeDelim: string][];
      inline: [openDelim: string, closeDelim: string][];
    };
  };
};

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
 * Read {@tutorial mathfield-getting-started | Getting Started}.
 *
 * @example
 * import { renderMathInDocument } from 'https://unpkg.com/mathlive/dist/mathlive.min.mjs';
 * document.addEventListener("load", () => {
 *     renderMathInDocument();
 * });
 *
 * @category Rendering
 * @keywords render, document
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
 * After calling {@linkcode renderMathInElement}
 * or {@linkcode makeMathField} the original content
 * can be restored by calling this function.
 *
 * @category Rendering
 * @keywords revert, original, content
 * @deprecated
 */
export declare function revertToOriginalContent(
  element: HTMLElement,
  /** The namespace used for the `data-`
   * attributes. If you used a namespace with `renderMathInElement`, you must
   * use the same namespace here.
   */
  options?: {
    namespace?: string;
  }
): void;

/**
 * After calling {@linkcode renderMathInElement}
 * or {@linkcode makeMathField} the original content
 * can be retrieved by calling this function.
 *
 * Given the following markup:
 * ```html
 * <span id='equation'>$$f(x)=sin(x)$$</span>
 * ```
 * The following code:
 * ```javascript
 * renderMathInElement('equation');
 * console.log(getOriginalContent('equation'));
 * ```
 * will output:
 * ```
 * $$f(x)=sin(x)$$
 * ```
 * @param {string | HTMLElement | Mathfield} element - A DOM element ID, a DOM
 * element or a Mathfield.
 *
 * @category Rendering
 * @keywords original, content
 * @deprecated
 */
export declare function getOriginalContent(
  element: string | HTMLElement,
  options?: {
    /** The namespace used for the `data-` attributes.
     * If you used a namespace with `renderMathInElement()`, you must
     * use the same namespace here. */
    namespace?: string;
  }
): string;
