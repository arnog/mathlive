declare module "types-utils" {
    type Filter<T, Cond, U extends keyof T = keyof T> = {
        [K in U]: T[K] extends Cond ? K : never;
    }[U];
    export type Keys<T> = Filter<T, Function> & string;
}
declare module "core" {
    export type ParseMode = 'math' | 'text' | 'command';
    /**
     * Variants can map either to math characters in specific Unicode range
     * (see https://en.wikipedia.org/wiki/Mathematical_Alphanumeric_Symbols)
     * e.g. 𝒜, 𝔄, 𝖠, 𝙰, 𝔸, A, 𝐴
     * or to some built-in fonts (e.g. 'SansSerif-Regular').
     *
     * 'normal' is a synthetic variant that maps either to 'main' (roman) or
     * 'math' (italic) depending on the symbol and the letterShapeStyle.
     */
    export type Variant = 'ams' | 'double-struck' | 'calligraphic' | 'script' | 'fraktur' | 'sans-serif' | 'monospace' | 'normal' | 'main' | 'math';
    export type VariantStyle = 'up' | 'bold' | 'italic' | 'bolditalic' | '';
    export type FontShape = 'auto' | 'n' | 'it' | 'sl' | 'sc' | '';
    export type FontSeries = 'auto' | 'm' | 'b' | 'l' | '';
    export interface Style {
        mode?: ParseMode | string;
        color?: string;
        backgroundColor?: string;
        variant?: Variant;
        variantStyle?: VariantStyle;
        fontFamily?: string;
        fontShape?: FontShape;
        fontSeries?: FontSeries;
        fontSize?: string;
        cssId?: string;
        cssClass?: string;
        letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
    }
    export type MacroDefinition = {
        def: string;
        args?: number;
    };
    export type MacroDictionary = {
        [name: string]: string | MacroDefinition;
    };
}
declare module "model" {
    import { Mathfield } from "mathfield";
    export interface Model {
        mathfield: Mathfield;
    }
}
declare module "commands" {
    import { Keys } from "types-utils";
    import { ParseMode } from "core";
    import { Mathfield } from "mathfield";
    import { Model } from "model";
    export type SpeechScope = 'all' | 'selection' | 'left' | 'right' | 'group' | 'parent';
    export interface Commands {
        undo: (mathfield: Mathfield) => boolean;
        redo: (mathfield: Mathfield) => boolean;
        performWithFeedback: (mathfield: Mathfield, command: string) => boolean;
        complete: (mathfield: Mathfield) => boolean;
        nextSuggestion: (mathfield: Mathfield) => boolean;
        previousSuggestion: (mathfield: Mathfield) => boolean;
        copyToClipboard: (mathfield: Mathfield) => boolean;
        cutToClipboard: (mathfield: Mathfield) => boolean;
        pasteFromClipboard: (mathfield: Mathfield) => boolean;
        scrollIntoView: (mathfield: Mathfield) => boolean;
        scrollToStart: (mathfield: Mathfield) => boolean;
        scrollToEnd: (mathfield: Mathfield) => boolean;
        enterCommandMode: (mathfield: Mathfield) => boolean;
        toggleKeystrokeCaption: (mathfield: Mathfield) => boolean;
        switchMode: (mathfield: Mathfield, mode: ParseMode) => boolean;
        insert: (mathfield: Mathfield, s: string, options: any) => boolean;
        /**
         *
         * @param {string} text
         * @param {object} [options]
         * @param {boolean} [options.focus] - If true, the mathfield will be focused.
         * @param {boolean} [options.feedback] - If true, provide audio and haptic feedback.
         * @param {boolean} [options.simulateKeystroke] - If true, generate some synthetic
         * keystrokes (useful to trigger inline shortcuts, for example).
         */
        typedText: (text: any, options: any) => boolean;
        speak: (mathfield: Mathfield, scope: SpeechScope, options: {
            withHighlighting: boolean;
        }) => boolean;
        addRowAfter: (model: Model) => boolean;
        addColumnAfter: (model: Model) => boolean;
        addRowBefore: (model: Model) => boolean;
        addColumnBefore: (model: Model) => boolean;
        deleteAll: (model: Model) => boolean;
        moveToOpposite: (model: Model) => boolean;
        moveBeforeParent: (model: Model) => boolean;
        moveAfterParent: (model: Model) => boolean;
        moveToNextPlaceholder: (model: Model) => boolean;
        moveToPreviousPlaceholder: (model: Model) => boolean;
        moveToNextChar: (model: Model) => boolean;
        moveToPreviousChar: (model: Model) => boolean;
        moveUp: (model: Model) => boolean;
        moveDown: (model: Model) => boolean;
        moveToNextWord: (model: Model) => boolean;
        moveToPreviousWord: (model: Model) => boolean;
        moveToGroupStart: (model: Model) => boolean;
        moveToGroupEnd: (model: Model) => boolean;
        moveToMathFieldStart: (model: Model) => boolean;
        moveToMathFieldEnd: (model: Model) => boolean;
        moveToSuperscript: (model: Model) => boolean;
        selectGroup: (model: Model) => boolean;
        selectAll: (model: Model) => boolean;
        extendToNextChar: (model: Model) => boolean;
        extendToPreviousChar: (model: Model) => boolean;
        extendToNextWord: (model: Model) => boolean;
        extendToPreviousWord: (model: Model) => boolean;
        extendUp: (model: Model) => boolean;
        extendDown: (model: Model) => boolean;
        extendToNextBoundary: (model: Model) => boolean;
        extendToPreviousBoundary: (model: Model) => boolean;
        extendToGroupStart: (model: Model) => boolean;
        extendToGroupEnd: (model: Model) => boolean;
        extendToMathFieldStart: (model: Model) => boolean;
        extendToMathFieldEnd: (model: Model) => boolean;
    }
    export type Selector = Keys<Commands>;
}
declare module "shortcuts" {
    import { ParseMode } from "core";
    export type InlineShortcutDefinition = string | {
        value: string;
        mode?: ParseMode;
        after?: string;
    };
}
declare module "config" {
    import { MacroDictionary, ParseMode } from "core";
    import { InlineShortcutDefinition } from "shortcuts";
    class Mathfield {
    }
    export type TextToSpeechOptions = {
        textToSpeechRules?: 'mathlive' | 'sre';
        textToSpeechMarkup?: '' | 'ssml' | 'ssml_step' | 'mac';
        textToSpeechRulesOptions?: {
            [key: string]: string;
        };
        speechEngine?: 'local' | 'amazon';
        speechEngineVoice?: string;
        speechEngineRate?: string;
        speakHook?: (text: string, config: MathfieldConfig) => void;
        readAloudHook?: (element: HTMLElement, text: string, config: MathfieldConfig) => void;
    };
    export type VirtualKeyboardOptions = {
        virtualKeyboardToggleGlyph?: string;
        virtualKeyboardMode?: 'auto' | 'manual' | 'onfocus' | 'off';
        virtualKeyboards?: 'all' | 'numeric' | 'roman' | 'greek' | 'functions' | 'command' | string;
        virtualKeyboardLayout?: 'auto' | 'qwerty' | 'azerty' | 'qwertz' | 'dvorak' | 'colemak';
        customVirtualKeyboardLayers?: {
            [layer: string]: string;
        };
        customVirtualKeyboards?: {
            [layer: string]: string;
        };
        virtualKeyboardTheme?: 'material' | 'apple' | '';
        keypressVibration?: boolean;
        keypressSound?: string | HTMLAudioElement | {
            spacebar?: string | HTMLAudioElement;
            return?: string | HTMLAudioElement;
            delete?: string | HTMLAudioElement;
            default: string | HTMLAudioElement;
        };
        plonkSound?: string | HTMLAudioElement;
    };
    export interface MathfieldHooks {
        onKeystroke?: (sender: Mathfield, keystroke: string, ev: KeyboardEvent) => boolean;
        onMoveOutOf?: (sender: Mathfield, direction: 'forward' | 'backward') => boolean;
        onTabOutOf?: (sender: Mathfield, direction: 'forward' | 'backward') => boolean;
    }
    export type UndoStateChangeListener = (target: Mathfield, action: 'undo' | 'redo' | 'snapshot') => void;
    export interface MathfieldListeners {
        onBlur?: (sender: Mathfield) => void;
        onFocus?: (sender: Mathfield) => void;
        onContentWillChange?: (sender: Mathfield) => void;
        onContentDidChange?: (sender: Mathfield) => void;
        onSelectionWillChange?: (sender: Mathfield) => void;
        onSelectionDidChange?: (sender: Mathfield) => void;
        onUndoStateWillChange?: UndoStateChangeListener;
        onUndoStateDidChange?: UndoStateChangeListener;
        onModeChange?: (sender: Mathfield, mode: ParseMode) => void;
        onVirtualKeyboardToggle?: (sender: Mathfield, visible: boolean, keyboardElement: HTMLElement) => void;
        onReadAloudStatus?: (sender: Mathfield) => void;
    }
    export type InlineShortcutsOptions = {
        /** @deprecated : Use `mf.setConfig('inlineShortcuts', {...mf.getConfig('inlineShortcuts'),...newShortcuts})` to add `newShortcuts` to the default ones */
        overrideDefaultInlineShortcuts?: boolean;
        inlineShortcuts?: {
            [key: string]: InlineShortcutDefinition;
        };
        inlineShortcutTimeout?: number;
    };
    export type LocalizationOptions = {
        locale?: string;
        strings?: {
            [locale: string]: {
                [key: string]: string;
            };
        };
    };
    export type EditingOptions = {
        readOnly?: boolean;
        smartMode?: boolean;
        smartFence?: boolean;
        smartSuperscript?: boolean;
        scriptDepth?: number | [number, number];
        removeExtraneousParentheses?: boolean;
        ignoreSpacebarInMathMode?: boolean;
    };
    export type LayoutOptions = {
        defaultMode?: 'math' | 'text';
        macros?: MacroDictionary;
        horizontalSpacingScale?: number;
        letterShapeStyle?: 'auto' | 'tex' | 'iso' | 'french' | 'upright';
    };
    /**
     * See {@tutorial CONFIG Configuration Options} for details.
     */
    export type MathfieldConfig = LayoutOptions & EditingOptions & LocalizationOptions & InlineShortcutsOptions & VirtualKeyboardOptions & TextToSpeechOptions & MathfieldHooks & MathfieldListeners & {
        namespace?: string;
        substituteTextArea?: string | (() => HTMLElement);
    };
}
declare module "mathfield" {
    import { Selector } from "commands";
    import { MathfieldConfig } from "config";
    export interface Mathfield {
        getConfig(keys: keyof MathfieldConfig): any;
        getConfig(keys: string[]): MathfieldConfig;
        getConfig(keys: keyof MathfieldConfig | string[]): any | MathfieldConfig;
        $setConfig(config: MathfieldConfig): void;
        /**
         * Reverts this mathfield to its original content.
         *
         * After this method has been called, no other methods can be called on
         * the object.
         *
         * To turn the element back into a mathfield, call
         * `MathLive.makeMathField()` on the element again to get a new mathfield object.
         */
        $revertToOriginalContent(): any;
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
         */
        $perform(command: Selector): boolean;
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
         * @method Mathfield#$text
         */
        $text(format: string): string;
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
         * @method Mathfield#$selectedText
         */
        $selectedText(format: string): string;
        $select(): any;
        $clearSelection(): any;
        /**
         * Checks if the selection is collapsed.
         *
         * @return True if the length of the selection is 0, that is, if it is a single
         * insertion point.
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
         */
        $selectionDepth(): number;
        /**
         * Checks if the selection starts at the beginning of the selection group.
         */
        $selectionAtStart(): boolean;
        /**
         * Checks if the selection extends to the end of the selection group.
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
         * @method Mathfield#$latex
         */
        $latex(text?: any, options?: any): any;
        /**
         * Return the DOM element associated with this mathfield.
         *
         * Note that `this.$el().mathfield === this`
         */
        $el(): any;
        /**
         * Inserts a block of text at the current insertion point.
         *
         * This method can be called explicitly or invoked as a selector with {@linkcode Mathfield#$perform $perform("insert")}
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
         * @param {object} options.style
         *
         * @param {boolean} options.resetStyle - If true, the style after the insertion
         * is the same as the style before. If false, the style after the
         * insertion is the style of the last inserted atom.
         *
         * @param {boolean} options.smartFence - If true, promote plain fences, e.g. `(`,
         * as `\left...\right` or `\mleft...\mright`
         *
         * @param {boolean} options.suppressChangeNotifications - If true, the
         * handlers for the contentWillChange, contentDidChange, selectionWillChange and
         * selectionDidChange notifications will not be invoked. Default `false`.
         *
         * @category Changing the Content
         */
        $insert(s: string, options?: any): boolean;
        $hasFocus(): any;
        $focus(): any;
        $blur(): any;
        $applyStyle(style: any): any;
        /**
         * @param {string} keys - A string representation of a key combination.
         *
         * For example `"Alt-KeyU"`.
         *
         * See [W3C UIEvents](https://www.w3.org/TR/uievents/#code-virtual-keyboards)
         * for more information on the format of the descriptor.
         *
         * @param evt - An event corresponding to the keystroke. Pass this
         * event if the keystroke originated from a user interaction that produced it.
         * If the keystroke is synthetic (for example, triggered in response to a
         * click or other event not involving a keyboard), omit it.
         * @return {boolean} Return true if the field need to be re-rendered
         * @category Changing the Content
         */
        $keystroke(keys: string, evt?: KeyboardEvent): any;
        /**
         * Simulates a user typing the keys indicated by text.
         *
         * @param text - A sequence of one or more characters.
         * @category Changing the Content
         */
        $typedText(text: string): any;
    }
}
declare module "mathlive" {
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
    import { Mathfield } from "mathfield";
    import { MathfieldConfig } from "config";
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
    export function latexToMarkup(text: string, options: any): string;
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
    export function makeMathField(element: HTMLElement | string, config: MathfieldConfig): Mathfield;
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
    export function latexToMathML(latex: any, options: any): string;
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
    export function latexToAST(latex: any, options: any): any;
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
    export function astToLatex(ast: any, options: any): any;
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
    export function latexToSpeakableText(latex: any, options: any): any;
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
    export function renderMathInDocument(options: any): any;
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
    export function renderMathInElement(element: any, options: any): any;
    /**
     *
     * @param {string|HTMLElement|Mathfield} element
     * @param {Object.<string, any>} [options={}]
     * @param {string} options.namespace The namespace used for the `data-`
     * attributes. If you used a namespace with `renderMathInElement`, you must
     * use the same namespace here.
     */
    export function revertToOriginalContent(element: any, options: any): any;
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
    export function getOriginalContent(element: any, options: any): any;
}
