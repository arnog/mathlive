/**
 * @typedef {function} MathFieldCallback
 * @param {MathField} mathfield
 * @return {void}
 * @global
 */
declare type MathFieldCallback = (mathfield: MathField) => void;

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
 @property {object<string, string>} macros?
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
    macros?: {
        [key: string]: string;
    };
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
     * Reverts this mathfield to its original content.
     *
     * After this method has been
     * called, no other methods can be called on the object.
     *
     * To turn the
     * element back into a mathfield, call `MathLive.makeMathField()` on the
     * element again to get a new mathfield object.
     *
     * @method MathField#$revertToOriginalContent
     */
    $revertToOriginalContent(): void;
    /**
     * Performs a command defined by a selector.
     *
     *
    #### Moving the insertion point
    
    | Name                 | Description               |
    | --------------------- | ------------------------- |
    | `"moveToNextChar"` | |
    | `"moveToPreviousChar"` | |
    | `"moveUp"` | |
    | `"moveDown"` | |
    | `"moveToNextPlaceholder"` | |
    | `"moveToPreviousPlaceholder"` | |
    | `"moveToNextWord"` | |
    | `"moveToPreviousWord"` | |
    | `"moveToGroupStart"` | |
    | `"moveToGroupEnd"` | |
    | `"moveToMathFieldStart"` | |
    | `"moveToMathFieldEnd"` | |
    | `"moveToSuperscript"` | |
    | `"moveToSubscript"` | |
    | `"moveToOpposite"` | |
    | `"moveBeforeParent"` | |
    | `"moveAfterParent"` | |
    
    
    #### Selection
    
    | Name                 | Description               |
    | --------------------- | ------------------------- |
    | `"selectGroup"` | Select all the atoms in the current group, that is all the siblings.<br> When the selection is in a numerator, the group is the numerator.<br>When the selection is a superscript or subscript, the group is the supsub.|
    | `"selectAll"` | Select all the atoms in the mathfield|
    
    
    #### Extending the selection
    
    | Name                 | Description               |
    | --------------------- | ------------------------- |
    | `"extendToNextChar"` | |
    | `"extendToPreviousChar"` | |
    | `"extendToNextWord"` | |
    | `"extendToPreviousWord"` | |
    | `"extendUp"` | |
    | `"extendDown"` | |
    | `"extendToNextBoundary"` | |
    | `"extendToPreviousBoundary"` | |
    | `"extendToGroupStart"` | |
    | `"extendToGroupEnd"` | |
    | `"extendToMathFieldStart"` | |
    | `"extendToMathFieldEnd"` | |
    
    
    #### Editing / deleting
    
    | Name                 | Description               |
    | --------------------- | ------------------------- |
    | `"deleteAll"` | Delete everything in the field |
    | `"delete"` | Delete the current selection |
    | `"deleteNextChar"` | |
    | `"deletePreviousChar"` | |
    | `"deleteNextWord"` | |
    | `"deletePreviousWord"` | |
    | `"deleteToGroupStart"` | |
    | `"deleteToGroupEnd"` | |
    | `"deleteToMathFieldEnd"` | |
    | `"transpose"` | |
    
    
    #### Editing a matrix
    
    | Name                 | Description               |
    | --------------------- | ------------------------- |
    | `"addRowAfter"` | |
    | `"addRowBefore"` | |
    | `"addColumnAfter"` | |
    | `"addColumnBefore"` | |
    
    
    #### Other editing commands
    
    | Name                 | Description               |
    | --------------------- | ------------------------- |
    | `"scrollIntoView"` | |
    | `"scrollToStart"` | |
    | `"switchMode"` | |
    | `"complete"` | |
    | `"nextSuggestion"` | |
    | `"previousSuggestion"` | |
    | `"toggleKeystrokeCaption"` | |
    | `"applyStyle"` | |
    
    
    #### Clipboard
    
    | Name                 | Description               |
    | --------------------- | ------------------------- |
    | `"undo"` | |
    | `"redo"` | |
    | `"copyToClipboard"` | |
    | `"cutToClipboard"` | |
    | `"pasteFromClipboard"` | |
    
    
    #### Virtual Keyboard
    
    | Name                 | Description               |
    | --------------------- | ------------------------- |
    | `"toggleVirtualKeyboard"` | |
    | `"showVirtualKeyboard"` | |
    | `"hideVirtualKeyboard"` | |
    | `"toggleVirtualKeyboardAlt"` | |
    | `"toggleVirtualKeyboardShift"` | |
    | `"showAlternateKeys"` | |
    | `"hideAlternateKeys"` | |
    | `"performAlternateKeys"` | |
    | `"switchKeyboardLayer"` | |
    | `"shiftKeyboardLayer"` | |
    | `"unshiftKeyboardLayer"` | |
    | `"insertAndUnshiftKeyboardLayer"` | |
    | `"performWithFeedback"` | |
    
    
    #### Speech
    
    | Name                 | Description               |
    | --------------------- | ------------------------- |
    | `"speak"` | speaks the amount specified by the first parameter. |
     *
     * @param {string|string[]} command - A selector, or an array whose first element
     * is a selector, and whose subsequent elements are arguments to the selector.
     *
     * Note that selectors do not include a final "_". They can be passed either
     * in camelCase or kebab-case.
     *
     * ```javascript
     * mf.$perform('selectAll');
     * mf.$perform('select-all');
     * ```
     * In the above example, both calls invoke the same selector.
     *
     *
     * @method MathField#$perform
     */
    $perform(command: string | string[]): void;
    /**
     * Returns a textual representation of the mathfield.
     *
     * @param {string} [format] - The format of the result.
     *
    | Format              | Description             |
    | :------------------ | :---------------------- |
    | `"latex"`             |LaTeX rendering of the content, with LaTeX macros not expanded|
    | `"latex-expanded"`    |All macros are recursively expanded to their definition|
    | `"json"`              | A MathJSON abstract syntax tree, as an object literal formated as a JSON string (see {@tutorial MATHJSON})|
    | `"spoken"`            |Spoken text rendering, using the default format defined in config, which could be either text or SSML markup.|
    | `"spoken-text"`       |A plain spoken text rendering of the content.|
    | `"spoken-ssml"`       |A SSML (Speech Synthesis Markup Language) version of the content, which can be used with some text-to-speech engines such as AWS|
    | `"spoken-ssml-withHighlighting"`|Like `"spoken-ssml"` but with additional annotations necessary for synchronized higlighting (read aloud)|
    | `"mathML"`            | A string of MathML markup|
     *
     * **Default** = `"latex"`
     * @return {string}
     * @category Accessing the Content
     * @method MathField#$text
     */
    $text(format?: string): string;
    /**
     * Returns a textual representation of the selection in the mathfield.
     *
     * @param {string} [format] - The format of the result.
     *
    | Format              | Description             |
    | :------------------ | :---------------------- |
    | `"latex"`             |LaTeX rendering of the content, with LaTeX macros not expanded|
    | `"latex-expanded"`    |All macros are recursively expanded to their definition|
    | `"json"`              | A MathJSON abstract syntax tree, as an object literal formated as a JSON string (see {@tutorial MATHJSON})|
    | `"spoken"`            |Spoken text rendering, using the default format defined in config, which could be either text or SSML markup.|
    | `"spoken-text"`       |A plain spoken text rendering of the content.|
    | `"spoken-ssml"`       |A SSML (Speech Synthesis Markup Language) version of the content, which can be used with some text-to-speech engines such as AWS|
    | `"spoken-ssml-withHighlighting"`|Like `"spoken-ssml"` but with additional annotations necessary for synchronized higlighting (read aloud)|
    | `"mathML"`            | A string of MathML markup|
     *
     * **Default** = `"latex"`
     * @return {string}
     * @category Accessing the Content
     * @method MathField#$selectedText
     */
    $selectedText(format?: string): string;
    /**
     * Checks if the selection is collapsed.
     *
     * @return {boolean} True if the length of the selection is 0, that is, if it is a single
     * insertion point.
     * @category Selection
     * @method MathField#$selectionIsCollapsed
     */
    $selectionIsCollapsed(): boolean;
    /**
     * Returns the depth of the selection group.
     *
     * If the selection is at the root level, returns 0.
     *
     * If the selection is a portion of the numerator of a fraction
     * which is at the root level, return 1. Note that in that case, the numerator
     * would be the "selection group".
     *
     * @return {number}
     * @category Selection
     * @method MathField#$selectionDepth
     */
    $selectionDepth(): number;
    /**
     * Checks if the selection starts at the beginning of the selection group.
     *
     * @return {boolean}
     * @category Selection
     * @method MathField#$selectionAtStart
     */
    $selectionAtStart(): boolean;
    /**
     * Checks if the selection extends to the end of the selection group.
     *
     * @return {boolean}
     * @category Selection
     * @method MathField#$selectionAtEnd
     */
    $selectionAtEnd(): boolean;
    /**
     * Sets or gets the content of the mathfield.
     *
     * If `text` is not empty, sets the content of the mathfield to the
     * text interpreted as a LaTeX expression.
     *
     * If `text` is empty (or omitted), return the content of the mathfield as a
     * LaTeX expression.
     * @param {string} [text]
     *
     * @param {Object.<string, any>} [options]
     * @param {boolean} [options.suppressChangeNotifications] - If true, the
     * handlers for the contentWillChange and contentDidChange notifications will
     * not be invoked. **Default** = `false`.
     *
     * @return {string}
     * @category Accessing the Content
     * @method MathField#$latex
     */
    $latex(text?: string, options?: {
        suppressChangeNotifications?: boolean;
    }): string;
    /**
     * Return the DOM element associated with this mathfield.
     *
     * Note that `this.$el().mathfield === this`
     *
     * @return {HTMLElement}
     * @method MathField#$el
     */
    $el(): HTMLElement;
    /**
     * Inserts a block of text at the current insertion point.
     *
     * This method can be called explicitly or invoked as a selector with {@linkcode MathField#$perform $perform("insert")}
     * .
     *
     * After the insertion, the selection will be set according to the `selectionMode`.
     *
     * @param {string} s - The text to be inserted
     *
     * @param {Object.<string, any>} [options]
     *
     * @param {"replaceSelection"|"replaceAll"|"insertBefore"|"insertAfter"} options.insertionMode -
     *
    | <!-- -->    | <!-- -->    |
    | :---------- | :---------- |
    |`"replaceSelection"`| (default)|
    |`"replaceAll"`| |
    |`"insertBefore"`| |
    |`"insertAfter"`| |
     *
     * @param {'placeholder' | 'after' | 'before' | 'item'} options.selectionMode - Describes where the selection
     * will be after the insertion:
     *
    | <!-- -->    | <!-- -->    |
    | :---------- | :---------- |
    |`"placeholder"`| The selection will be the first available placeholder in the text that has been inserted (default)|
    |`"after"`| The selection will be an insertion point after the inserted text|
    |`"before"`| The selection will be an insertion point before the inserted text|
    |`"item"`| The inserted text will be selected|
     *
     * @param {'auto' | 'latex'} options.format - The format of the string `s`:
     *
    | <!-- -->    | <!-- -->    |
    |:------------|:------------|
    |`"auto"`| The string is Latex fragment or command) (default)|
    |`"latex"`| The string is a Latex fragment|
     *
     * @param {boolean} options.focus - If true, the mathfield will be focused after
     * the insertion
     *
     * @param {boolean} options.feedback - If true, provide audio and haptic feedback
     *
     * @param {"text" | "math" | ""} options.mode - If empty, the current mode
     * is used (default)
     *
     * @param {boolean} options.resetStyle - If true, the style after the insertion
     * is the same as the style before. If false, the style after the
     * insertion is the style of the last inserted atom.
     *
     * @category Changing the Content
     * @method MathField#$insert
     */
    $insert(s: string, options?: {
        insertionMode: "replaceSelection" | "replaceAll" | "insertBefore" | "insertAfter";
        selectionMode: 'placeholder' | 'after' | 'before' | 'item';
        format: 'auto' | 'latex';
        focus: boolean;
        feedback: boolean;
        mode: "text" | "math" | "";
        resetStyle: boolean;
    }): void;
    /**
     * Updates the style (color, bold, italic, etc...) of the selection or sets
     * the style to be applied to future input.
     *
     * If there is a selection, the style is applied to the selection
     *
     * If the selection already has this style, remove it. If the selection
     * has the style partially applied (i.e. only some sections), remove it from
     * those sections, and apply it to the entire selection.
     *
     * If there is no selection, the style will apply to the next character typed.
     *
     * @param {object} style  The style properties to be applied. All the
     * properties are optional and they can be combined.
     *
     * @param {string} [style.mode] - Either `"math"`, `"text"` or `"command"`
     *
     * @param {string} [style.color] - The text/fill color, as a CSS RGB value or
     * a string for some "well-known" colors, e.g. `"red"`, `"#f00"`, etc...
     *
     * @param {string} [style.backgroundColor] - The background color.
     *
     * @param {string} [style.fontFamily] - The font family used to render text.
     *
     * This value can the name of a locally available font, or a CSS font stack, e.g.
     * `"Avenir"`, `"Georgia, serif"`, etc...
     *
     * This can also be one of the following TeX-specific values:
     *
    | <!-- -->    | <!-- -->    |
    | :---------- | :---------- |
    |`"cmr"`| Computer Modern Roman, serif|
    |`"cmss"`| Computer Modern Sans-serif, latin characters only|
    |`"cmtt"`| Typewriter, slab, latin characters only|
    |`"cal"`| Calligraphic style, uppercase latin letters and digits only|
    |`"frak"`| Fraktur, gothic, uppercase, lowercase and digits|
    |`"bb"`| Blackboard bold, uppercase only|
    |`"scr"`| Script style, uppercase only|
     *
     * @param {string} [style.series] - The font 'series', i.e. weight and
     * stretch.
     *
     * The following values can be combined, for example: `"ebc"`: extra-bold,
     * condensed. Aside from `"b"`, these attributes may not have visible effect if the
     * font family does not support this attribute:
     *
    | <!-- -->    | <!-- -->    |
    | :---------- | :---------- |
    |`"ul"`| ultra-light weight|
    |`"el"`| extra-light|
    |`"l"`| light|
    |`"sl"`| semi-light|
    |`"m"`| medium (default)|
    |`"sb"`| semi-bold|
    |`"b"`| bold|
    |`"eb"`| extra-bold|
    |`"ub"`| ultra-bold|
    |`"uc"`| ultra-condensed|
    |`"ec"`| extra-condensed|
    |`"c"`| condensed|
    |`"sc"`| semi-condensed|
    |`"n"`| normal (default)|
    |`"sx"`| semi-expanded|
    |`"x"`| expanded|
    |`"ex"`| extra-expanded|
    |`"ux"`| ultra-expanded|
     *
     * @param {string} [style.shape] - The font "shape", i.e. italic or upright.
     *
    | <!-- -->    | <!-- -->    |
    | :---------- | :---------- |
    |`"auto"`| italic or upright, depending on mode and letter (single letters are italic in math mode)|
    |`"up"`| upright|
    |`"it"`| italic|
    |`"sl"`| slanted or oblique (often the same as italic)|
    |`"sc"`| small caps|
    |`"ol"`| outline|
     *
     * @param {string} [style.size] - The font size:  `"size1"`...`"size10"`.
     * '"size5"' is the default size
     *
     * @category Changing the Content
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
     * For example `"Alt-KeyU"`.
     *
     * See [W3C UIEvents](https://www.w3.org/TR/uievents/#code-virtual-keyboards)
     * for more information on the format of the descriptor.
     *
     * @param {Event?} [evt] - An event corresponding to the keystroke. Pass this
     * event if the keystroke originated from a user interaction that produced it.
     * If the keystroke is synthetic (for example, triggered in response to a
     * click or other event not involving a keyboard), omit it.
     * @return {boolean}
     * @category Changing the Content
     * @method MathField#$keystroke
     */
    $keystroke(keys: string, evt?: Event): boolean;
    /**
     * Simulates a user typing the keys indicated by text.
     *
     * @param {string} text - A sequence of one or more characters.
     * @category Changing the Content
     * @method MathField#$typedText
     */
    $typedText(text: string): void;
    /**
     *
     * Update the configuration options for this mathfield.
     *
     * @param {MathFieldConfig} config - See {@tutorial CONFIG Configuration Options} for details.
     *
     * @method MathField#$setConfig
     */
    $setConfig(config: MathFieldConfig): void;
    /**
     *
     * Speak some part of the expression, either with or without synchronized highlighting.
     *
     * @param {string} amount - `"all"`, `"selection"`, `"left"`, `"right"`, `"group"`, `"parent"`
     * @param {object} speakOptions
     * @param {boolean} speakOptions.withHighlighting - If true, synchronized
     * highlighting of speech will happen (if possible). Default is false.
     *
     * @method MathField#speak_
     */
    speak_(amount: string, speakOptions: {
        withHighlighting: boolean;
    }): void;
    /**
     * The DOM element this mathfield is attached to.
    */
    element: HTMLElement;
    /**
     * A set of key/value pairs that can
    be used to customize the behavior of the mathfield
    */
    config: {
        [key: string]: any;
    };
    /**
     * A unique ID identifying this mathfield
    */
    id: string;
    /**
     * True if the keystroke caption
    panel is visible
    */
    keystrokeCaptionVisible: boolean;
    /**
     * True if the virtual keyboard is
    visible
    */
    virtualKeyboardVisible: boolean;
    /**
     * The last few keystrokes, to look out
    for inline shortcuts
    */
    keystrokeBuffer: string;
    /**
     * The saved state for each of the
    past keystrokes
    */
    keystrokeBufferStates: object[];
}

/**
 *
 * Use MathLive to render and edit mathematical formulas in your browser.
 *
 * This module exports {@link #functions%3Amathlive some functions} and the {@link #class%3AMathField `MathField`} class.
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
declare module "mathlive" {
    /**
     * Converts a LaTeX string to a string of HTML markup.
     *
     * @param {string} text A string of valid LaTeX. It does not have to start
     * with a mode token such as `$$` or `\(`.
     *
     * @param {"displaystyle" | "textstyle"} mathstyle If `'displaystyle'` the "display" mode of TeX
     * is used to typeset the formula, which is most appropriate for formulas that are
     * displayed in a standalone block.
     *
     * If `'textstyle'` is used, the "text" mode
     * of TeX is used, which is most appropriate when displaying math "inline"
     * with other text (on the same line).
     *
     * @param {"mathlist" | "span" | "html"} [format='html'] For debugging purposes, this function
     * can also return a text representation of internal data structures
     * used to construct the markup.
     *
     * @return {string}
     * @category Converting
     * @function module:mathlive#latexToMarkup
     */
    function latexToMarkup(text: string, mathstyle: "displaystyle" | "textstyle", format?: "mathlist" | "span" | "html"): string;
    /**
     * Convert a DOM element into an editable mathfield.
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
     * Converts a LaTeX string to a string of MathML markup.
     *
     * @param {string} latex A string of valid LaTeX. It does not have to start
     * with a mode token such as a `$$` or `\(`.
     * @param {object} options
     * @param {boolean} [options.generateID=false] - If true, add an `"extid"` attribute
     * to the MathML nodes with a value matching the `atomID`. This can be used
     * to map items on the screen with their MathML representation or vice-versa.
     * @return {string}
     * @category Converting
     * @function module:mathlive#latexToMathML
     */
    function latexToMathML(latex: string, options: {
        generateID?: boolean;
    }): string;
    /**
     * Converts a LaTeX string to an Abstract Syntax Tree (MathJSON)
     *
     * **See:** {@tutorial MATHJSON}
     *
     * @param {string} latex A string of valid LaTeX. It does not have to start
     * with a mode token such as a `$$` or `\(`.
     * @param {Object.<string, any>} options
     * @param {object} [options.macros] A dictionary of LaTeX macros
     *
     * @return {object} The Abstract Syntax Tree as an object literal using the MathJSON format.
     * @category Converting
     * @function module:mathlive#latexToAST
     */
    function latexToAST(latex: string, options: {
        macros?: any;
    }): any;
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
    function astToLatex(ast: any, options: {
        precision?: number;
        decimalMarker?: string;
        groupSeparator?: string;
        product?: string;
        exponentProduct?: string;
        exponentMarker?: string;
        scientificNotation?: "auto" | "engineering" | "on";
        beginRepeatingDigits?: string;
        endRepeatingDigits?: string;
    }): string;
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
     * @category Converting
     * @function module:mathlive#latexToSpeakableText
     */
    function latexToSpeakableText(latex: string, options: {
        textToSpeechRules?: "mathlive" | "sre";
        textToSpeechMarkup?: string;
        textToSpeechRulesOptions?: {
            [key: string]: any;
        };
    }): string;
    /**
     * Highlights the span corresponding to the specified atomID.
     *
     * This is used for text-to-speech with synchronized highlighting (read aloud)
     *
     * @category Read Aloud
     * @param {string} atomID
     *
     */
    function highlightAtomID(atomID: string): void;
    /**
     * Returns the status of a Read Aloud operation (reading with synchronized
     * highlighting).
     *
     * Possible values are:
     * - `"ready"`
     * - `"playing"`
     * - `"paused"`
     * - `"unavailable"`
     *
     * **See** {@linkcode module:editor-mathfield#speak speak}
     * @category Read Aloud
     * @return {"ready" | "playing" | "paused" | "unavailable"}
     * @function module:mathlive#readAloudStatus
     */
    function readAloudStatus(): "ready" | "playing" | "paused" | "unavailable";
    /**
     * Pauses a read aloud operation if one is in progress.
     *
     * **See** {@linkcode module:editor/mathfield#speak speak}
     * @category Read Aloud
     * @function module:mathlive#pauseReadAloud
     */
    function pauseReadAloud(): void;
    /**
     * Resumes a read aloud operation if one was paused.
     *
     * **See** {@linkcode module:editor-mathfield#speak speak}
     * @category Read Aloud
     * @function module:mathlive#resumeReadAloud
     */
    function resumeReadAloud(): void;
    /**
     * If a Read Aloud operation is in progress, read from a specified token
     *
     * **See** {@linkcode module:editor-mathfield#speak speak}
     *
     * @param {string} [token]
     * @param {number} [count] The number of tokens to read.
     * @category Read Aloud
     * @function module:mathlive#playReadAloud
     */
    function playReadAloud(token?: string, count?: number): void;
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
     * @param {string | HTMLElement | MathField} element - A DOM element ID, a DOM
     * element or a MathField.
     * @param {object} [options={}]
     * @param {string} [options.namespace=""] The namespace used for the `data-`
     * attributes.
     * If you used a namespace with `renderMathInElement()`, you must
     * use the same namespace here.
     * @return {string} the original content of the element.
     * @function module:mathlive#getOriginalContent
     */
    function getOriginalContent(element: string | HTMLElement | MathField, options?: {
        namespace?: string;
    }): string;
}

