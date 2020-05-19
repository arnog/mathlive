/* 0.50.8 */import { Selector } from './commands';
import { MathfieldConfig } from './config';
import { ParseMode, MacroDictionary, Style } from './core';
/**
 * | Format              | Description             |
| :------------------ | :---------------------- |
| `"latex"`             |LaTeX rendering of the content, with LaTeX macros not expanded|
| `"latex-expanded"`    |All macros are recursively expanded to their definition|
| `"json"`              | A {@tutorial math-json | MathJSON }abstract syntax tree, as an object literal formated as a JSON string|
| `"spoken"`            |Spoken text rendering, using the default format defined in config, which could be either text or SSML markup.|
| `"spoken-text"`       |A plain spoken text rendering of the content.|
| `"spoken-ssml"`       |A SSML (Speech Synthesis Markup Language) version of the content, which can be used with some text-to-speech engines such as AWS|
| `"spoken-ssml-withHighlighting"`|Like `"spoken-ssml"` but with additional annotations necessary for synchronized higlighting (read aloud)|
| `"mathML"`            | A string of MathML markup|
*/
export declare type OutputFormat = 'latex' | 'latex-expanded' | 'json' | 'json-2' | 'spoken' | 'spoken-text' | 'spoken-ssml' | 'spoken-ssml-withHighlighting' | 'mathML' | 'ASCIIMath';
export declare type InsertOptions = {
    /** If `"auto"` or omitted, the current mode is used */
    mode?: ParseMode | 'auto';
    /**
 * The format of the input string:
 *
| <!-- -->    | <!-- -->    |
|:------------|:------------|
|`"auto"`| The string is Latex fragment or command) (default)|
|`"latex"`| The string is a Latex fragment|
 *
 */
    format?: string;
    insertionMode?: 'replaceSelection' | 'replaceAll' | 'insertBefore' | 'insertAfter';
    /**
  * Describes where the selection
  * will be after the insertion:
   | <!-- -->    | <!-- -->    |
   | :---------- | :---------- |
   |`"placeholder"`| The selection will be the first available placeholder in the text that has been inserted (default)|
   |`"after"`| The selection will be an insertion point after the inserted text|
   |`"before"`| The selection will be an insertion point before the inserted text|
   |`"item"`| The inserted text will be selected|
*/
    selectionMode?: 'placeholder' | 'after' | 'before' | 'item';
    placeholder?: string;
    suppressChangeNotifications?: boolean;
    style?: Style;
    /**
     *  If true, promote plain fences, e.g. `(`,
     * as `\left...\right` or `\mleft...\mright`
     */
    smartFence?: boolean;
    macros?: MacroDictionary;
    /** If true, the mathfield will be focused after
     * the insertion
     */
    focus?: boolean;
    /** If true, provide audio and haptic feedback
     */
    feedback?: boolean;
    /** If true, the style after the insertion
     * is the same as the style before. If false, the style after the
     * insertion is the style of the last inserted atom.
     */
    resetStyle?: boolean;
};
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
    $revertToOriginalContent(): void;
    /**
     * Performs a command defined by a selector.
     *
     *
     *
     * @param command - A selector, or an array whose first element
     * is a selector, and whose subsequent elements are arguments to the selector.
     *
     * Note that selectors do not include a final "_". They can be passed either
     * in camelCase or kebab-case.
     *
     * ```javascript
     * mathfield.$perform('selectAll');
     * mathfield.$perform('select-all');
     * ```
     * In the above example, both calls invoke the same selector.
     *
     */
    $perform(command: Selector | any[]): boolean;
    /**
     * Returns a textual representation of the mathfield.
     *
     * @param format - The format of the result.
     * **Default** = `"latex"`
     * @return {string}
     * @category Accessing the Content
     */
    $text(format?: OutputFormat): string;
    /**
     * Returns a textual representation of the selection in the mathfield.
     *
     * @param format - The format of the result.
     * **Default** = `"latex"`
     * @category Accessing the Content
     */
    $selectedText(format?: OutputFormat): string;
    $select(): void;
    $clearSelection(): void;
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
     *
     * @category Accessing the Content
     */
    $latex(text?: string, options?: InsertOptions): string;
    /**
     * Return the DOM element associated with this mathfield.
     *
     * Note that `this.$el().mathfield === this`
     */
    $el(): HTMLElement;
    /**
     * Inserts a block of text at the current insertion point.
     *
     * This method can be called explicitly or invoked as a selector with
     * `$perform("insert")`.
     *
     * After the insertion, the selection will be set according to the
     * `options.selectionMode`.
     *
     *
     * @category Changing the Content
     */
    $insert(s: string, options?: InsertOptions): boolean;
    /**
     * @category Focus
     */
    $hasFocus(): boolean;
    /**
     * @category Focus
     */
    $focus(): void;
    /**
     * @category Focus
     */
    $blur(): void;
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
     */
    $applyStyle(style: Style): void;
    /**
     * @param keys - A string representation of a key combination.
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
     * @return Return true if the field need to be re-rendered
     * @category Changing the Content
     */
    $keystroke(keys: string, evt?: KeyboardEvent): boolean;
    /**
     * Simulates a user typing the keys indicated by text.
     *
     * @param text - A sequence of one or more characters.
     * @category Changing the Content
     */
    $typedText(text: string): void;
}
export interface Model {
    mathfield: Mathfield;
}
