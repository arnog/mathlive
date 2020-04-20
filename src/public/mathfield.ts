import { Selector } from './commands';
import { MathfieldConfig } from './config';

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
    $revertToOriginalContent();

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

    $select();

    $clearSelection();

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
    $latex(text?, options?);

    /**
     * Return the DOM element associated with this mathfield.
     *
     * Note that `this.$el().mathfield === this`
     */
    $el();

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
    $insert(s: string, options?): boolean;

    $hasFocus();
    $focus();
    $blur();

    $applyStyle(style);

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
    $keystroke(keys: string, evt?: KeyboardEvent);

    /**
     * Simulates a user typing the keys indicated by text.
     *
     * @param text - A sequence of one or more characters.
     * @category Changing the Content
     */
    $typedText(text: string);
}
