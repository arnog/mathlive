/**
 *
 * Use MathLive to render and edit mathematical formulas in your browser.
 *
 * This module exports {@link #functions%3Amathlive some functions} and the {@link #class%3AMathField `Mathfield`} class.
 *
 * See {@tutorial USAGE_GUIDE the Usage Guide} for more details on how to get
 * started.
 *
 * @example
 * // To invoke the functions in this module, import the `mathlive` module.
 *
 * import mathlive from 'dist/mathlive.mjs';
 *
 * console.log(mathlive.latexToMarkup('e^{i\\pi}+1=0'));
 *
 * @module mathlive
 * @packageDocumentation MathLive API Reference
 *
 */

import { Mathfield } from './mathfield';
import { MathfieldConfig } from './config';

export { Mathfield };
export { MathfieldConfig };

/**
 * Converts a LaTeX string to a string of HTML markup.
 *
 * @param {string} text A string of valid LaTeX. It does not have to start
 * with a mode token such as `$$` or `\(`.
 *
 * @param {"displaystyle" | "textstyle"} options.mathstyle If `'displaystyle'` the "display" mode of TeX
 * is used to typeset the formula, which is most appropriate for formulas that are
 * displayed in a standalone block.
 *
 * If `'textstyle'` is used, the "text" mode
 * of TeX is used, which is most appropriate when displaying math "inline"
 * with other text (on the same line).
 *
 * @param {"mathlist" | "span" | "html"} [options.format='html'] For debugging purposes, this function
 * can also return a text representation of internal data structures
 * used to construct the markup.
 *
 * @param {object} [options.macros] A dictionary of LaTeX macros
 */
export declare function latexToMarkup(text: string, options: any): string;

/**
 * Convert a DOM element into an editable mathfield.
 *
 * After the DOM element has been created, the value `element.mathfield` will
 * return a reference to the mathfield object. This value is also returned
 * by `makeMathField`
 *
 * @param element A DOM element, for example as obtained
 * by `document.getElementById()`, or the ID of a DOM element as a string.
 *
 * @param config See {@tutorial CONFIG} for details.
 *
 *
 * Given the HTML markup:
 * ```html
 * <span id='equation'>$f(x)=sin(x)$</span>
 * ```
 * The following code will turn the span into an editable mathfield.
 * ```
 * import MathLive from 'dist/mathlive.mjs';
 * MathLive.makeMathField('equation');
 * ```
 *
 */
export declare function makeMathField(
    element: HTMLElement | string,
    config: MathfieldConfig
): Mathfield;

/**
 * Converts a LaTeX string to a string of MathML markup.
 *
 * @param {string} latex A string of valid LaTeX. It does not have to start
 * with a mode token such as a `$$` or `\(`.
 * @param {object} options
 * @param {boolean} [options.generateID=false] - If true, add an `"extid"` attribute
 * to the MathML nodes with a value matching the `atomID`. This can be used
 * to map items on the screen with their MathML representation or vice-versa.
 */
export declare function latexToMathML(latex, options): string;

/**
 * Converts a LaTeX string to an Abstract Syntax Tree (MathJSON)
 *
 * **See:** {@tutorial MATHJSON}
 *
 * @param {string} latex A string of valid LaTeX. It does not have to start
 * with a mode token such as a `$$` or `\(`.
 * @param {Object.<string, any>} [options]
 * @param {object} [options.macros] A dictionary of LaTeX macros
 *
 * @return {object} The Abstract Syntax Tree as an object literal using the MathJSON format.
 */
export declare function latexToAST(latex, options);

/**
 * Converts an Abstract Syntax Tree (MathJSON) to a LaTeX string.
 *
 * **See:** {@tutorial MATHJSON}
 *
 * @param {object} ast - The Abstract Syntax Tree as an object literal (MathJSON).
 * @param {Object.<string, any>} options
 * @param {number} [options.precision=14] The number of digits used in the
 * representation of numbers. **Default** = 14.
 * @param {string} [options.decimalMarker='.'] The character used as the decimal
 * marker. **Default** = `"."`.
 * @param {string} [options.groupSeparator='\\, '] The character used to separate group of numbers, typically thousands. **Default** = `"\\, "`
 * @param {string} [options.product='\\cdot '] The character used to indicate product. Other option would be `"\\times "`. **Default** = `"\\cdot "`
 * @param {string} [options.exponentProduct='\\cdot '] The character used before an
 * exponent indicator. **Default** = `"\\cdot "`
 * @param {string} [options.exponentMarker=''] The character used to indicate an
 * exponent. **Default** = `""`
 * @param {"auto" | "engineering" | "on"} [options.scientificNotation='auto'] The format used for numbers
 * using the scientific notation. **Default** = `"auto"`
 * @param {string} [options.beginRepeatingDigits='\\overline{'] The string
 * used at the begining of repeating digits. **Default** = `"\\overline{"`
 * @param {string} [options.endRepeatingDigits='}'] The string
 * used at the end of repeating digits. **Default** = `"}"`
 *
 * @return {string} The LaTeX representation of the Abstract Syntax Tree, if valid.
 * @category Converting
 * @function module:mathlive#astToLatex
 */
export declare function astToLatex(ast, options);

/**
 * Converts a LaTeX string to a textual representation ready to be spoken
 *
 * @param {string} latex A string of valid LaTeX. It does not have to start
 * with a mode token such as a `$$` or `\(`.
 *
 * @param {Object.<string, any>} options
 *
 * @param {"mathlive" | "sre"} [options.textToSpeechRules='mathlive'] The set of text to
 * speech rules to use.
 *
 * A value of `"mathlive"` (the default) indicates that
 * the simple rules built into MathLive should be used.
 *
 * A value of `"sre"` indicates that the Speech Rule Engine from Volker Sorge
 * should be used.
 * Note that SRE is not included or loaded by MathLive and for this option to
 * work SRE should be loaded separately.
 *
 * @param {string} [options.textToSpeechMarkup=''] The markup syntax to use
 * for the output of conversion to spoken text.
 *
 * Possible values are `ssml` for
 * the SSML markup or `mac` for the MacOS markup (e.g. `"[[ltr]]"`)
 *
 * @param {Object.<string, any>} [options.textToSpeechRulesOptions={}] A set of
 * key/value pairs that can be used to configure the speech rule engine.
 *
 * Which options are available depends on the speech rule engine in use. There
 * are no options available with MathLive's built-in engine. The options for
 * the SRE engine are documented [here]{@link:https://github.com/zorkow/speech-rule-engine}
 * @return {string} The spoken representation of the input LaTeX.
 * @example
 * console.log(MathLive.latexToSpeakableText('\\frac{1}{2}'));
 * // ➡︎'half'
 */
export declare function latexToSpeakableText(latex, options);

/**
 * Transform all the elements in the document body that contain LaTeX code
 * into typeset math.
 *
 * **Note:** This is a very expensive call, as it needs to parse the entire
 * DOM tree to determine which elements need to be processed. In most cases
 * this should only be called once per document, once the DOM has been loaded.
 * To render a specific element, use {@linkcode module:mathlive#renderMathInElement renderMathInElement()}
 *
 * **See:** {@tutorial USAGE_GUIDE}
 *
 * @param {object<string, any>} [options={}] See {@linkcode module:mathlive#renderMathInElement renderMathInElement()}
 * for details
 * @example
 * import MathLive from 'dist/mathlive.mjs';
 * document.addEventListener("load", () => {
 *     MathLive.renderMathInDocument();
 * });
 *
 */
export declare function renderMathInDocument(options);

/**
 * Transform all the children of `element`, recursively, that contain LaTeX code
 * into typeset math.
 *
 * **See:** {@tutorial USAGE_GUIDE}
 *
 * @param {HTMLElement|string} element An HTML DOM element, or a string containing
 * the ID of an element.
 * @param {object} [options={}]
 *
 * @param {string} [options.namespace=''] - Namespace that is added to `data-`
 * attributes to avoid collisions with other libraries.
 *
 * It is empty by default.
 *
 * The namespace should be a string of lowercase letters.
 *
 * @param {object[]} [options.macros={}] - Custom LaTeX macros
 *
 * @param {string[]} [options.skipTags=['noscript', 'style', 'textarea', 'pre', 'code', 'annotation', 'annotation-xml'] ]
 * an array of tag names whose content will
 *  not be scanned for delimiters (unless their class matches the `processClass`
 * pattern below.
 *
 * @param {string} [options.ignoreClass='tex2jax_ignore'] a string used as a
 * regular expression of class names of elements whose content will not be
 * scanned for delimiters

 * @param {string} [options.processClass='tex2jax_process']   a string used as a
 * regular expression of class names of elements whose content **will** be
 * scanned for delimiters,  even if their tag name or parent class name would
 * have prevented them from doing so.
 *
 * @param {string} [options.processScriptType="math/tex"] `<script>` tags of the
 * indicated type will be processed while others will be ignored.

 *
 * @param {string} [options.renderAccessibleContent='mathml'] The format(s) in
 * which to render the math for screen readers:
 * - `'mathml'` MathML
 * - `'speakable-text'` Spoken representation
 *
 * You can pass an empty string to turn off the rendering of accessible content.
 *
 * You can pass multiple values separated by spaces, e.g `'mathml speakable-text'`
 *
 * @param {boolean} [options.preserveOriginalContent=true] if true, store the
 * original textual content of the element in a `data-original-content`
 * attribute. This value can be accessed for example to restore the element to
 * its original value:
 * ```javascript
 *      elem.innerHTML = elem.dataset.originalContent;
 * ```
 * @param {boolean} [options.readAloud=false] if true, generate markup that can
 * be read aloud later using {@linkcode module:editor-mathfield#speak speak}
 *
 * @param {boolean} [options.TeX.processEnvironments=true] if false, math expression
 * that start with `\begin{` will not automatically be rendered.
 *
 * @param {string[][]} [options.TeX.delimiters.inline=[['\\(','\\)']] ] arrays
 * of delimiter pairs that will trigger a render of the content in 'textstyle'
 *
 * @param {string[][]} [options.TeX.delimiters.display=[['$$', '$$'], ['\\[', '\\]']] ] arrays
 * of delimiter pairs that will trigger a render of the content in
 * 'displaystyle'.
 *
 * @param {function} [renderToMarkup] a function that will convert any LaTeX found to
 * HTML markup. This is only useful to override the default MathLive renderer
 *
 * @param {function} [renderToMathML] a function that will convert any LaTeX found to
 * MathML markup.
 *
 * @param {function} [renderToSpeakableText] a function that will convert any LaTeX found to
 * speakable text markup.
 */

export declare function renderMathInElement(element, options);

/**
 *
 * @param {string|HTMLElement|Mathfield} element
 * @param {Object.<string, any>} [options={}]
 * @param {string} options.namespace The namespace used for the `data-`
 * attributes. If you used a namespace with `renderMathInElement`, you must
 * use the same namespace here.
 */
export declare function revertToOriginalContent(element, options);

/**
 * After calling {@linkcode module:mathlive#renderMathInElement renderMathInElement}
 * or {@linkcode module:mathlive#makeMathField makeMathField} the original content
 * can be retrieved by calling this function.
 *
 * Given the following markup:
 * ```html
 * <span id='equation'>$$f(x)=sin(x)$$</span>
 * ```
 * The following code:
 * ```javascript
 * MathLive.renderMathInElement('equation');
 * console.log(MathLive.getOriginalContent('equation'));
 * ```
 * will output:
 * ```
 * $$f(x)=sin(x)$$
 * ```
 * @param {string | HTMLElement | Mathfield} element - A DOM element ID, a DOM
 * element or a Mathfield.
 * @param {object} [options={}]
 * @param {string} [options.namespace=""] The namespace used for the `data-`
 * attributes.
 * If you used a namespace with `renderMathInElement()`, you must
 * use the same namespace here.
 * @return {string} the original content of the element.
 */
export declare function getOriginalContent(element, options);
