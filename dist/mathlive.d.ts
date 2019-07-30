/**
 * @typedef {function} MathFieldCallback
 * @param {any} mf
 * @return void
 * @global
 */
declare type MathFieldCallback = (mf: any) => any;

/**
 @typedef MathFieldConfig
 @type {Object}
 @property {string} locale?
 @property {object<string, string>} strings?
 @property {number} horizontalSpacingScale?
 @property {string} namespace?
 @property {function} substituteTextArea?
 @property {"math" | "text"} defaultMode?
 @property {MathFieldCallback} onFocus?
 @property {MathFieldCallback} onBlur?
 @property {function} onKeystroke?
 @property {function} onAnnounce?
 @property {boolean} overrideDefaultInlineShortcuts?
 @property {object<string, string>} inlineShortcuts?
 @property {number} inlineShortcutTimeout?
 @property {boolean} smartFence?
 @property {boolean} smartSuperscript?
 @property {number} scriptDepth?
 @property {boolean} removeExtraneousParentheses?
 @property {boolean} ignoreSpacebarInMathMode?
 @property {string} virtualKeyboardToggleGlyph?
 @property {"manual" | "onfocus" | "off" } virtualKeyboardMode?
 @property {"all" | "numeric" | "roman" | "greek" | "functions" | "command" | string} virtualKeyboards?
 @property {"qwerty" | "azerty" | "qwertz" | "dvorak" | "colemak"} virtualKeyboardRomanLayout?
 @property {object<string, string>} customVirtualKeyboardLayers?
 @property {object<string, object>} customVirtualKeyboards?
 @property {"material" | "apple" | ""} virtualKeyboardTheme?
 @property {boolean} keypressVibration?
 @property {string} keypressSound?
 @property {string} plonkSound?
 @property {"mathlive" | "sre"} textToSpeechRules?
 @property {"ssml" | "mac"} textToSpeechMarkup?
 @property {object} textToSpeechRulesOptions?
 @property {"local" | "amazon"} speechEngine?
 @property {string} speechEngineVoice?
 @property {string} speechEngineRate?
 @property {function} onMoveOutOf?
 @property {function} onTabOutOf?
 @property {MathFieldCallback} onContentWillChange?
 @property {MathFieldCallback} onContentDidChange?
 @property {MathFieldCallback} onSelectionWillChange?
 @property {MathFieldCallback} onSelectionDidChange?
 @property {function} onUndoStateWillChange?
 @property {function} onUndoStateDidChange?
 @property {function} onModeChange?
 @property {function} onVirtualKeyboardToggle?
 @property {function} onReadAloudStatus?
 @property {function} handleSpeak?
 @property {function} handleReadAloud?
 @global
 */
declare type MathFieldConfig = {
    locale?: string;
    strings?: {
        [key: string]: string;
    };
    horizontalSpacingScale?: number;
    namespace?: string;
    substituteTextArea?: (...params: any[]) => any;
    defaultMode?: "math" | "text";
    onFocus?: MathFieldCallback;
    onBlur?: MathFieldCallback;
    onKeystroke?: (...params: any[]) => any;
    onAnnounce?: (...params: any[]) => any;
    overrideDefaultInlineShortcuts?: boolean;
    inlineShortcuts?: {
        [key: string]: string;
    };
    inlineShortcutTimeout?: number;
    smartFence?: boolean;
    smartSuperscript?: boolean;
    scriptDepth?: number;
    removeExtraneousParentheses?: boolean;
    ignoreSpacebarInMathMode?: boolean;
    virtualKeyboardToggleGlyph?: string;
    virtualKeyboardMode?: "manual" | "onfocus" | "off";
    virtualKeyboards?: "all" | "numeric" | "roman" | "greek" | "functions" | "command" | string;
    virtualKeyboardRomanLayout?: "qwerty" | "azerty" | "qwertz" | "dvorak" | "colemak";
    customVirtualKeyboardLayers?: {
        [key: string]: string;
    };
    customVirtualKeyboards?: {
        [key: string]: object;
    };
    virtualKeyboardTheme?: "material" | "apple" | "";
    keypressVibration?: boolean;
    keypressSound?: string;
    plonkSound?: string;
    textToSpeechRules?: "mathlive" | "sre";
    textToSpeechMarkup?: "ssml" | "mac";
    textToSpeechRulesOptions?: any;
    speechEngine?: "local" | "amazon";
    speechEngineVoice?: string;
    speechEngineRate?: string;
    onMoveOutOf?: (...params: any[]) => any;
    onTabOutOf?: (...params: any[]) => any;
    onContentWillChange?: MathFieldCallback;
    onContentDidChange?: MathFieldCallback;
    onSelectionWillChange?: MathFieldCallback;
    onSelectionDidChange?: MathFieldCallback;
    onUndoStateWillChange?: (...params: any[]) => any;
    onUndoStateDidChange?: (...params: any[]) => any;
    onModeChange?: (...params: any[]) => any;
    onVirtualKeyboardToggle?: (...params: any[]) => any;
    onReadAloudStatus?: (...params: any[]) => any;
    handleSpeak?: (...params: any[]) => any;
    handleReadAloud?: (...params: any[]) => any;
};

/**
 *
 * @property {HTMLElement} element - The DOM element this mathfield is attached to.
 * @property {Object.<string, any>} config - A set of key/value pairs that can
 * be used to customize the behavior of the mathfield
 * @property {string} id - A unique ID identifying this mathfield
 * @property {boolean} keystrokeCaptionVisible - True if the keystroke caption
 * panel is visible
 * @property {boolean} virtualKeyboardVisible - True if the virtual keyboard is
 * visible
 * @property {string} keystrokeBuffer The last few keystrokes, to look out
 * for inline shortcuts
 * @property {object[]} keystrokeBufferStates The saved state for each of the
 * past keystrokes
 * @class MathField
 * @global
 */
declare class MathField {
    /**
     * Revert this math field to its original content. After this method has been
     * called, no other methods can be called on the MathField object. To turn the
     * element back into a MathField, call `MathLive.makeMathField()` on the
     * element again to get a new math field object.
     *
     * @method MathField#$revertToOriginalContent
     */
    $revertToOriginalContent(): void;
    /**
     * @param {string|string[]} command - A selector, or an array whose first element
     * is a selector, and whose subsequent elements are arguments to the selector.
     * Note that selectors do not include a final "_". They can be passed either
     * in camelCase or kebab-case. So:
     * ```javascript
     * mf.$perform('selectAll');
     * mf.$perform('select-all');
     * ```
     * both calls are valid and invoke the same selector.
     *
     * @method MathField#$perform
     */
    $perform(command: string | string[]): void;
    /**
     * Return a textual representation of the mathfield.
     * @param {string} [format='latex']. One of
     * * `'latex'`
     * * `'latex-expanded'` : all macros are recursively expanded to their definition
     * * `'spoken'`
     * * `'spoken-text'`
     * * `'spoken-ssml'`
     * * `spoken-ssml-withHighlighting`
     * * `'mathML'`
     * * `'json'`
     * @return {string}
     * @method MathField#$text
     */
    $text(format?: string): string;
    /**
     * Return a textual representation of the selection in the mathfield.
     * @param {string} [format='latex']. One of
     * * `'latex'`
     * * `'latex-expanded'` : all macros are recursively expanded to their definition
     * * `'spoken'`
     * * `'spoken-text'`
     * * `'spoken-ssml'`
     * * `spoken-ssml-withHighlighting`
     * * `'mathML'`
     * * `'json'`
     * @return {string}
     * @method MathField#$selectedText
     */
    $selectedText(format?: string): string;
    /**
     * Return true if the length of the selection is 0, that is, if it is a single
     * insertion point.
     * @return {boolean}
     * @method MathField#$selectionIsCollapsed
     */
    $selectionIsCollapsed(): boolean;
    /**
     * Return the depth of the selection group. If the selection is at the root level,
     * returns 0. If the selection is a portion of the numerator of a fraction
     * which is at the root level, return 1. Note that in that case, the numerator
     * would be the "selection group".
     * @return {number}
     * @method MathField#$selectionDepth
     */
    $selectionDepth(): number;
    /**
     * Return true if the selection starts at the beginning of the selection group.
     * @return {boolean}
     * @method MathField#$selectionAtStart
     */
    $selectionAtStart(): boolean;
    /**
     * Return true if the selection extends to the end of the selection group.
     * @return {boolean}
     * @method MathField#$selectionAtEnd
     */
    $selectionAtEnd(): boolean;
    /**
     * If `text` is not empty, sets the content of the mathfield to the
     * text interpreted as a LaTeX expression.
     * If `text` is empty (or omitted), return the content of the mahtfield as a
     * LaTeX expression.
     * @param {string} text
     *
     * @param {Object.<string, any>} options
     * @param {boolean} options.suppressChangeNotifications - If true, the
     * handlers for the contentWillChange and contentDidChange notifications will
     * not be invoked. Default `false`.
     *
     * @return {string}
     * @method MathField#$latex
     */
    $latex(text: string, options: {
        suppressChangeNotifications: boolean;
    }): string;
    /**
     * Return the DOM element associated with this mathfield.
     *
     * Note that `this.$el().mathfield = this`
     * @return {HTMLElement}
     * @method MathField#$el
     */
    $el(): HTMLElement;
    /**
     * This method can be invoked as a selector with {@linkcode MathField#$perform $perform("insert")}
     * or called explicitly.
     *
     * It will insert the specified block of text at the current insertion point,
     * according to the insertion mode specified.
     *
     * After the insertion, the selection will be set according to the `selectionMode`.
     * @param {string} s - The text to be inserted
     *
     * @param {Object.<string, any>} [options={}]
     *
     * @param {'placeholder' | 'after' | 'before' | 'item'} options.selectionMode - Describes where the selection
     * will be after the insertion:
     * * `'placeholder'`: the selection will be the first available placeholder
     * in the item that has been inserted (default)
     * * `'after'`: the selection will be an insertion point after the item that
     * has been inserted,
     * * `'before'`: the selection will be an insertion point before
     * the item that has been inserted
     * * `'item'`: the item that was inserted will be selected
     *
     * @param {'auto' | 'latex'} options.format - The format of the string `s`:
     * * `'auto'`: the string is interpreted as a latex fragment or command)
     * (default)
     * * `'latex'`: the string is interpreted strictly as a latex fragment
     *
     * @param {boolean} options.focus - If true, the mathfield will be focused after
     * the insertion
     *
     * @param {boolean} options.feedback - If true, provide audio and haptic feedback
     *
     * @param {'text' | 'math' | ''} options.mode - 'text' or 'math'. If empty, the current mode
     * is used (default)
     *
     * @param {boolean} options.resetStyle - If true, the style after the insertion
     * is the same as the style before (if false, the style after the
     * insertion is the style of the last inserted atom).
     *
     * @method MathField#$insert
     */
    $insert(s: string, options?: {
        selectionMode: 'placeholder' | 'after' | 'before' | 'item';
        format: 'auto' | 'latex';
        focus: boolean;
        feedback: boolean;
        mode: 'text' | 'math' | '';
        resetStyle: boolean;
    }): void;
    /**
     * Apply a style (color, bold, italic, etc...).
     *
     * If there is a selection, the style is applied to the selection
     *
     * If the selection already has this style, remove it. If the selection
     * has the style partially applied (i.e. only some sections), remove it from
     * those sections, and apply it to the entire selection.
     *
     * If there is no selection, the style will apply to the next character typed.
     *
     * @param {object} style  an object with the following properties. All the
     * properties are optional, but they can be combined.
     *
     * @param {string} [style.mode=''] - Either `'math'`, `'text'` or '`command`'
     * @param {string} [style.color=''] - The text/fill color, as a CSS RGB value or
     * a string for some 'well-known' colors, e.g. 'red', '#f00', etc...
     *
     * @param {string} [style.backgroundColor=''] - The background color.
     *
     * @param {string} [style.fontFamily=''] - The font family used to render text.
     * This value can the name of a locally available font, or a CSS font stack, e.g.
     * "Avenir", "Georgia, serif", etc...
     * This can also be one of the following TeX-specific values:
     * - 'cmr': Computer Modern Roman, serif
     * - 'cmss': Computer Modern Sans-serif, latin characters only
     * - 'cmtt': Typewriter, slab, latin characters only
     * - 'cal': Calligraphic style, uppercase latin letters and digits only
     * - 'frak': Fraktur, gothic, uppercase, lowercase and digits
     * - 'bb': Blackboard bold, uppercase only
     * - 'scr': Script style, uppercase only
     *
     * @param {string} [style.series=''] - The font 'series', i.e. weight and
     * stretch. The following values can be combined, for example: "ebc": extra-bold,
     * condensed. Aside from 'b', these attributes may not have visible effect if the
     * font family does not support this attribute:
     * - 'ul' ultra-light weight
     * - 'el': extra-light
     * - 'l': light
     * - 'sl': semi-light
     * - 'm': medium (default)
     * - 'sb': semi-bold
     * - 'b': bold
     * - 'eb': extra-bold
     * - 'ub': ultra-bold
     * - 'uc': ultra-condensed
     * - 'ec': extra-condensed
     * - 'c': condensed
     * - 'sc': semi-condensed
     * - 'n': normal (default)
     * - 'sx': semi-expanded
     * - 'x': expanded
     * - 'ex': extra-expanded
     * - 'ux': ultra-expanded
     *
     * @param {string} [style.shape=''] - The font 'shape', i.e. italic.
     * - 'auto': italic or upright, depending on mode and letter (single letters are
     * italic in math mode)
     * - 'up': upright
     * - 'it': italic
     * - 'sl': slanted or oblique (often the same as italic)
     * - 'sc': small caps
     * - 'ol': outline
     *
     * @param {string} [style.size=''] - The font size:  'size1'...'size10'
     * 'size5' is the default size
     * @method MathField#$applyStyle
     *
     */
    $applyStyle(style: {
        mode?: string;
        color?: string;
        backgroundColor?: string;
        fontFamily?: string;
        series?: string;
        shape?: string;
        size?: string;
    }): void;
    /**
     * @param {string} keys - A string representation of a key combination.
     *
     * For example `'Alt-KeyU'`.
     *
     * See [W3C UIEvents](https://www.w3.org/TR/uievents/#code-virtual-keyboards)
     * @param {Event} evt
     * @return {boolean}
     * @method MathField#$keystroke
     */
    $keystroke(keys: string, evt: Event): boolean;
    /**
     * Simulate a user typing the keys indicated by text.
     * @param {string} text - A sequence of one or more characters.
     * @method MathField#$typedText
     */
    $typedText(text: string): void;
    /**
     *
     * Update the configuration options for this mathfield.
     *
     * @param {MathFieldConfig} [config={}] See {@tutorial CONFIG} for details.
     *
     * @method MathField#$setConfig
     */
    $setConfig(config?: MathFieldConfig): void;
    /**
     *
     * Speak some part of the expression, either with or without synchronized highlighting.
     *
     * @param {string} amount (all, selection, left, right, group, parent)
     * @param {object} speakOptions
     * @param {boolean} speakOptions.withHighlighting - If true, synchronized highlighting of speech will happen (if possible). Default is false.
     *
     * @method MathField#speak_
     */
    speak_(amount: string, speakOptions: {
        withHighlighting: boolean;
    }): void;
}

/**
 * Return an array of potential shortcuts
 * @param {string} s
 * @param {object} config
 * @return {string[]}
 */
declare function startsWithString(s: string, config: any): string[];

/**
 *
 * @param {string} mode
 * @param {object[]} siblings atoms preceding this potential shortcut
 * @param {string} shortcut
 */
declare function validateShortcut(mode: string, siblings: object[], shortcut: string): void;

/**
 *
 * This modules exports the MathLive entry points.
 *
 * @module mathlive
 * @example
 * // To invoke the functions in this module, import the MathLive module.
 *
 * import MathLive from 'dist/mathlive.mjs';
 *
 * const markup = MathLive.latexToMarkup('e^{i\\pi}+1=0');
 *
 */
declare module "mathlive" {
    /**
     * Convert a LaTeX string to a string of HTML markup.
     *
     * @param {string} text A string of valid LaTeX. It does not have to start
     * with a mode token such as `$$` or `\(`.
     *
     * @param {string} mathstyle If `'displaystyle'` the "display" mode of TeX
     * is used to typeset the formula, which is most appropriate for formulas that are
     * displayed in a standalone block. If `'textstyle'` is used, the "text" mode
     * of TeX is used, which is most appropriate when displaying math "inline"
     * with other text (on the same line).
     *
     * @param {string} [format='html'] For debugging purposes, this function
     * can also return a text representation of internal data structures
     * used to construct the markup. Valid values include `'mathlist'` and `'span'`
     *
     * @return {string}
     * @function module:mathlive#latexToMarkup
     */
    function latexToMarkup(text: string, mathstyle: string, format?: string): string;
    /**
     * Convert a DOM element into an editable math field.
     *
     * After the DOM element has been created, the value `element.mathfield` will
     * return a reference to the mathfield object. This value is also returned
     * by `makeMathField`
     *
     * @param {HTMLElement|string} element A DOM element, for example as obtained
     * by `document.getElementById()`, or the ID of a DOM element as a string.
     *
     * @param {MathFieldConfig} [config={}] See {@tutorial CONFIG} for details.
     *
     *
     * @return {MathField}
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
     * @function module:mathlive#makeMathField
     */
    function makeMathField(element: HTMLElement | string, config?: MathFieldConfig): MathField;
    /**
     * Convert a LaTeX string to a string of MathML markup.
     *
     * @param {string} latex A string of valid LaTeX. It does not have to start
     * with a mode token such as a `$$` or `\(`.
     * @param {object} options
     * @param {boolean} [options.generateID=false] - If true, add an `extid` attribute
     * to the MathML nodes with a value matching the `atomID`.
     * @return {string}
     * @function module:mathlive#latexToMathML
     */
    function latexToMathML(latex: string, options: {
        generateID?: boolean;
    }): string;
    /**
     * Convert a LaTeX string to an Abstract Syntax Tree
     *
     * **See:** {@tutorial MASTON}
     *
     * @param {string} latex A string of valid LaTeX. It does not have to start
     * with a mode token such as a `$$` or `\(`.
     *
     * @return {object} The Abstract Syntax Tree as a JavaScript object.
     * @function module:mathlive#latexToAST
     */
    function latexToAST(latex: string): any;
    /**
     * Convert a LaTeX string to a textual representation ready to be spoken
     *
     * @param {string} latex A string of valid LaTeX. It does not have to start
     * with a mode token such as a `$$` or `\(`.
     *
     * @param {Object.<string, any>} options -
     *
     * @param {string} [options.textToSpeechRules='mathlive'] Specify which
     * set of text to speech rules to use.
     *
     * A value of `mathlive` indicates that
     * the simple rules built into MathLive should be used. A value of `sre`
     * indicates that the Speech Rule Engine from Volker Sorge should be used.
     * Note that SRE is not included or loaded by MathLive and for this option to
     * work SRE should be loaded separately.
     *
     * @param {string} [options.textToSpeechMarkup=''] The markup syntax to use
     * for the output of conversion to spoken text.
     *
     * Possible values are `ssml` for
     * the SSML markup or `mac` for the MacOS markup (e.g. `[[ltr]]`)
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
     * @function module:mathlive#latexToSpeakableText
     */
    function latexToSpeakableText(latex: string, options: {
        textToSpeechRules?: string;
        textToSpeechMarkup?: string;
        textToSpeechRulesOptions?: {
            [key: string]: any;
        };
    }): string;
    /**
     * Highlight the span corresponding to the specified atomID
     * This is used for TTS with synchronized highlighting (read aloud)
     *
     * @param {string} atomID
     *
     */
    function highlightAtomID(atomID: string): void;
    /**
     * Return the status of a Read Aloud operation (reading with synchronized
     * highlighting).
     *
     * Possible values include:
     * - `ready`
     * - `playing`
     * - `paused`
     * - `unavailable`
     *
     * **See** {@linkcode module:editor-mathfield#speak speak}
     * @return {string}
     * @function module:mathlive#readAloudStatus
     */
    function readAloudStatus(): string;
    /**
     * If a Read Aloud operation is in progress, stop it.
     *
     * **See** {@linkcode module:editor/mathfield#speak speak}
     * @function module:mathlive#pauseReadAloud
     */
    function pauseReadAloud(): void;
    /**
     * If a Read Aloud operation is paused, resume it
     *
     * **See** {@linkcode module:editor-mathfield#speak speak}
     * @function module:mathlive#resumeReadAloud
     */
    function resumeReadAloud(): void;
    /**
     * If a Read Aloud operation is in progress, read from a specified token
     *
     * **See** {@linkcode module:editor-mathfield#speak speak}
     *
     * @param {string} token
     * @param {number} [count]
     * @function module:mathlive#playReadAloud
     */
    function playReadAloud(token: string, count?: number): void;
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
    function renderMathInDocument(options?: {
        [key: string]: any;
    }): void;
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
     *
     * @function module:mathlive#renderMathInElement
     */
    function renderMathInElement(element: HTMLElement | string, options?: {
        namespace?: string;
        macros?: object[];
        skipTags?: string[];
        ignoreClass?: string;
        processClass?: string;
        processScriptType?: string;
        renderAccessibleContent?: string;
        preserveOriginalContent?: boolean;
        readAloud?: boolean;
    }, renderToMarkup?: (...params: any[]) => any, renderToMathML?: (...params: any[]) => any, renderToSpeakableText?: (...params: any[]) => any): void;
    /**
     *
     * @param {string|HTMLElement|MathField} element
     * @param {Object.<string, any>} [options={}]
     * @param {string} options.namespace The namespace used for the `data-`
     * attributes. If you used a namespace with `renderMathInElement`, you must
     * use the same namespace here.
     * @function module:mathlive#revertToOriginalContent
     */
    function revertToOriginalContent(element: string | HTMLElement | MathField, options?: {
        namespace: string;
    }): void;
    /**
     * After calling {@linkcode module:mathlive#renderMathInElement renderMathInElement}
     * or {@linkcode module:mathlive#makeMathField makeMathField} the original content
     * can be retrived by calling this function.
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
     * @param {string | HTMLElement | MathField} element - A DOM element ID, a DOM
     * element or a MathField.
     * @param {object} [options={}]
     * @param {string} [options.namespace=""] The namespace used for the `data-`
     * attributes.
     * If you used a namespace with `renderMathInElement`, you must
     * use the same namespace here.
     * @return {string} the original content of the element.
     * @function module:mathlive#getOriginalContent
     */
    function getOriginalContent(element: string | HTMLElement | MathField, options?: {
        namespace?: string;
    }): string;
}

