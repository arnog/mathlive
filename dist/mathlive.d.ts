/**
 *
 * Use MathLive to render and edit mathematical formulas in your browser.
 *
 *
 * Read {@tutorial mathfield-getting-started | Getting Started} for more info.
 *
 * @example
 * <script type="module">
 * // To invoke the functions in this module, import the `Mathlive` module.
 *
 * import MathLive from 'https://unpkg.com/mathlive/dist/mathlive.mjs';
 *
 * console.log(MathLive.latexToAST('e^{i\\pi}+1=0'));
 * </script>
 *
 * @packageDocumentation MathLive SDK Reference {{GIT_VERSION}}
 * @version {{GIT_VERSION}}
 *
 */
import { Mathfield } from './mathfield';
import { MathfieldConfig, TextToSpeechOptions } from './config';
import { MacroDictionary, ParserErrorListener } from './core';
export { Mathfield };
export { MathfieldConfig };
/**
 * The version string for this build of the SDK in the form of:
 *
 * `git tag`-`number of comits`-g`abbreviated commit hash`
 *
 * The `git tag` uses [semver](https://semver.org/):
 * - The first number is the **MAJOR** version, incremented for
 * incompatible API changes
 * - The second number is the **MINOR** version, incremented for new features
 * - The third number is the **PATCH** version, incremented for bug fixes
 *
 * Current version: `{{GIT_VERSION}}`
 *
 */
export declare const version: string;
/**
 * Converts a LaTeX string to a string of HTML markup.
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
export declare function latexToMarkup(text: string, options: {
    mathstyle?: 'displaystyle' | 'textstyle';
    letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
    macros?: MacroDictionary;
    onError?: ParserErrorListener;
}): string;
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
 *
 * Given the HTML markup:
 * ```html
 * <span id='equation'>$f(x)=sin(x)$</span>
 * ```
 * The following code will turn the span into an editable mathfield.
 * ```javascript
 * import MathLive from 'https://unpkg.com/mathlive/dist/mathlive.mjs';
 * MathLive.makeMathField('equation');
 * ```
 * @keywords create, make, mathfield
 */
export declare function makeMathField(element: HTMLElement | string, config: MathfieldConfig): Mathfield;
/**
 * Converts a LaTeX string to a string of MathML markup.
 *
 * @param latex A string of valid LaTeX. It does not have to start
 * with a mode token such as a `$$` or `\(`.
 * @param options.generateId If true, add an `"extid"` attribute
 * to the MathML nodes with a value matching the `atomID`. This can be used
 * to map items on the screen with their MathML representation or vice-versa.
 * @param options.onError Callback invoked when an error is encountered while
 * parsing the input string.
 */
export declare function latexToMathML(latex: string, options: {
    macros?: MacroDictionary;
    generateID: boolean;
    onError?: ParserErrorListener;
}): string;
/**
 * Converts a LaTeX string to an {@tutorial math-json | MathJSON } Abstract Syntax Tree
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
 */
export declare function latexToAST(latex: string, options?: {
    macros?: MacroDictionary;
    onError?: ParserErrorListener;
}): any;
/**
 * Converts a {@tutorial math-json | MathJSON } Abstract Syntax Tree to a LaTeX string.
 *
 * **See Also:** [[latexToAST|latexToAST()]]
 *
 * @return The LaTeX representation of the Abstract Syntax Tree, if valid.
 * @category Converting
 * @keywords convert, latex, mathjson, ast
 */
export declare function astToLatex(mathJson: any, options?: {
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
}): string;
/**
 * Converts a LaTeX string to a textual representation ready to be spoken
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
 * console.log(MathLive.latexToSpeakableText('\\frac{1}{2}'));
 * // 'half'
 * @category Converting
 * @keywords convert, latex, speech, speakable, text, speakable text
 */
export declare function latexToSpeakableText(latex: string, options: TextToSpeechOptions & {
    macros?: MacroDictionary;
    onError?: ParserErrorListener;
}): string;
export declare type AutoRenderOptions = {
    /** Namespace that is added to `data-`  attributes to avoid collisions with other libraries.
     *
     * It is empty by default.
     *
     * The namespace should be a string of lowercase letters.
     */
    namespace?: string;
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
     *
     * **Default**: `'mathml'`
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
        /** if false, math expression
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
            display: string[][];
            inline: string[][];
        };
    };
    /** A function that will convert any LaTeX found to
     * HTML markup. This is only useful to override the default MathLive renderer
     */
    renderToMarkup?: Function;
    /**
     * a function that will convert any LaTeX found to
     * MathML markup.
     */
    renderToMathML?: Function;
    /** A function that will convert any LaTeX found to
     * speakable text markup. */
    renderToSpeakableText?: Function;
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
 * import MathLive from 'https://unpkg.com/mathlive/dist/mathlive.mjs';
 * document.addEventListener("load", () => {
 *     MathLive.renderMathInDocument();
 * });
 *
 * @category Rendering
 * @keywords render, document
 */
export declare function renderMathInDocument(options?: AutoRenderOptions): void;
/**
 * Transform all the children of `element`, recursively, that contain LaTeX code
 * into typeset math.
 *
 * Read {@tutorial mathfield-getting-started | Getting Started}.
 *
 * @param element An HTML DOM element, or a string containing
 * the ID of an element.
 *
 * @category Rendering
 * @keywords render, element, htmlelement
 */
export declare function renderMathInElement(element: string | HTMLElement, options?: AutoRenderOptions): void;
/**
 *
 * @category Rendering
 * @keywords revert, original, content
 */
export declare function revertToOriginalContent(element: HTMLElement, 
/** The namespace used for the `data-`
 * attributes. If you used a namespace with `renderMathInElement`, you must
 * use the same namespace here.
 */
options?: {
    namespace?: string;
}): void;
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
 * MathLive.renderMathInElement('equation');
 * console.log(MathLive.getOriginalContent('equation'));
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
 */
export declare function getOriginalContent(element: string | HTMLElement, options?: {
    /** The namespace used for the `data-` attributes.
     * If you used a namespace with `renderMathInElement()`, you must
     * use the same namespace here. */
    namespace?: string;
}): string;
