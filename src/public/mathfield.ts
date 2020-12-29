import { Selector } from './commands';
import { MathfieldOptions } from './options';
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
export type OutputFormat =
  | 'latex'
  | 'latex-expanded'
  | 'mathjson' // Work progress next generation MathJson
  | 'json'
  | 'json-2'
  | 'spoken'
  | 'spoken-text'
  | 'spoken-ssml'
  | 'spoken-ssml-withHighlighting'
  | 'mathML'
  | 'ASCIIMath';

export type InsertOptions = {
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
  format?: OutputFormat | 'auto';
  insertionMode?:
    | 'replaceSelection'
    | 'replaceAll'
    | 'insertBefore'
    | 'insertAfter';
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

export type FindOptions = {
  mode?: ParseMode;
};

export type ReplacementFunction = (args: {
  range: Range;
  match: string;
  latex: string;
  p: string[];
}) => string;

export type ApplyStyleOptions = {
  range?: Range;
  operation?: 'set' | 'toggle';
  suppressChangeNotifications?: boolean;
};

/**
 * A position of the caret/insertion point from the beginning of the formula.
 */
export type Offset = number;

/**
 * A pair of offests (boundary points) that can be used to denote a fragment
 * of an expression.
 *
 * A range is said to be collapsed when start and end are equal.
 *
 * When specifying a range, a negative offset can be used to indicate an
 * offset from the last valid offset, i.e. -1 is the last valid offset, -2
 * is one offset before that, etc...
 *
 * A normalized range will always be such that start <= end, start >= 0,
 * end >= 0,  start < lastOffset, end < lastOffset. All the methods return
 * a normalized range.
 *
 * **See Also**
 * * [[`Selection`]]
 */

export type Range = [start: Offset, end: Offset];

/**
 * A selection is a set of ranges (to support discontinous selection, for
 * example when selecting a column in a matrix).
 *
 * If there is a single range and that range is collapsed, the selection is
 * collapsed.
 *
 * A selection can also have a direction. While many operations are insensitive
 * to the direction, a few are. For example, when selecting a fragment of an
 * expression from left to right, the direction of this range will be "forward".
 * Pressing the left arrow key will sets the insertion at the start of the range.
 * Conversely, if the selectionis made from right to left, the direction is
 * "backward" and pressing the left arrow key will set the insertion point at
 * the end of the range.
 *
 * **See Also**
 * * [[`Range`]]
 */
export type Selection = {
  ranges: Range[];
  direction?: 'forward' | 'backward' | 'none';
};

/**
 * This interface is implemented by:
 * - VirtualKeyboard
 * - VirtualKeyboardDelegate (used when the virtual keyboard is shared amongst
 * mathfield instances)
 * - RemoteVirtualKeyboard (the shared virtual keyboard instance)
 */
export interface VirtualKeyboardInterface {
  visible: boolean;
  height: number;
  dispose(): void;
  executeCommand(command: string | [string, ...any[]]): boolean;
  focusMathfield(): void;
  blurMathfield(): void;
  enable(): void;
  disable(): void;
  stateChanged(): void;
}

export interface Mathfield {
  mode: ParseMode;

  /**
   * @deprecated Use [[`getOptions`]]
   */
  getConfig?<K extends keyof MathfieldOptions>(
    keys: K[]
  ): Pick<MathfieldOptions, K>;
  /**
   * @deprecated Use [[`getOptions`]]
   */
  getConfig?<K extends keyof MathfieldOptions>(key: K): MathfieldOptions[K];
  /**
   * @deprecated Use [[`getOptions`]]
   */
  getConfig?(): MathfieldOptions;

  getOptions(): MathfieldOptions;
  getOptions<K extends keyof MathfieldOptions>(
    keys: K[]
  ): Pick<MathfieldOptions, K>;
  getOption<K extends keyof MathfieldOptions>(key: K): MathfieldOptions[K];

  /**
   * @deprecated Use [[`setOptions`]]
   */
  setConfig?(options: Partial<MathfieldOptions>): void;

  setOptions(options: Partial<MathfieldOptions>): void;

  /**
   * Reverts this mathfield to its original content.
   *
   * After this method has been called, no other methods can be called on
   * the object.
   *
   * To turn the element back into a mathfield, call
   * `makeMathField()` on the element again to get a new mathfield object.
   *
   * @deprecated
   */
  $revertToOriginalContent?(): void;

  /**
   * Execute a [[`Commands`|command]] defined by a selector.
   * ```javascript
   * mfe.executeCommand('add-column-after');
   * mfe.executeCommand(['switch-mode', 'math']);
   * ```
   *
   * @param command - A selector, or an array whose first element
   * is a selector, and whose subsequent elements are arguments to the selector.
   *
   * Selectors can be passed either in camelCase or kebab-case.
   *
   * ```javascript
   * // Both calls do the same thing
   * mfe.executeCommand('selectAll');
   * mfe.executeCommand('select-all');
   * ```
   */
  executeCommand(command: Selector | [Selector, ...any[]]): boolean;

  /**
   * @deprecated Use [[`executeCommand`]]
   */
  $perform?(command: Selector | [Selector, ...any[]]): boolean;

  /**
   * Returns a textual representation of the mathfield.
   *
   * @param format - The format of the result.
   * **Default** = `"latex"`
   * @category Accessing the Content
   */
  getValue(format?: OutputFormat): string;
  getValue(start: Offset, end: Offset, format?: OutputFormat): string;
  getValue(range: Range | Selection, format?: OutputFormat): string;
  getValue(
    arg1?: Offset | OutputFormat | Range | Selection,
    arg2?: Offset | OutputFormat,
    arg3?: OutputFormat
  ): string;

  /**
   * @deprecated Use [[`getValue`]]
   */
  $text?(format?: OutputFormat): string;

  /**
   * Returns a textual representation of the selection in the mathfield.
   *
   * @param format - The format of the result.
   * **Default** = `"latex"`
   * @category Accessing the Content
   * @deprecated Use `mfe.getValue(mfe.selection)`
   */
  $selectedText?(format?: OutputFormat): string;

  select(): void;

  /**
   * @deprecated Use [[`select`]]
   */
  $select?(): void;

  /**
   * @deprecated Use [[`executeCommand`]]
   */
  $clearSelection?(): void;

  /**
   * Checks if the selection is collapsed.
   *
   * @return True if the length of the selection is 0, that is, if it is a single
   * insertion point.
   *
   * @deprecated Use `mfe.selection[0].collapsed`
   */
  $selectionIsCollapsed?(): boolean;

  /**
   * Returns the depth of the selection group.
   *
   * If the selection is at the root level, returns 0.
   *
   * If the selection is a portion of the numerator of a fraction
   * which is at the root level, return 1. Note that in that case, the numerator
   * would be the "selection group".
   *
   * @deprecated Use `mfe.selection[0].depth`
   */
  $selectionDepth?(): number;

  /**
   * Checks if the selection starts at the beginning of the selection group.
   *
   * @deprecated
   *
   */
  $selectionAtStart?(): boolean;

  /**
   * Checks if the selection extends to the end of the selection group.
   *
   * @deprecated
   */
  $selectionAtEnd?(): boolean;

  /**
   * Sets the content of the mathfield to the
   * text interpreted as a LaTeX expression.
   *
   * @category Accessing the Content
   */
  setValue(latex?: string, options?: InsertOptions): void;

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
   *
   * @deprecated Use [[`setValue`]] and [[`getValue`]]
   */
  $latex?(text?: string, options?: InsertOptions): string;

  /**
   * Return the DOM element associated with this mathfield.
   *
   * Note that `this.$el().mathfield === this`
   *
   * @deprecated
   */
  $el?(): HTMLElement;

  /**
   * Inserts a block of text at the current insertion point.
   *
   * This method can be called explicitly or invoked as a selector with
   * `executeCommand("insert")`.
   *
   * After the insertion, the selection will be set according to the
   * `options.selectionMode`.
   *
   * @category Changing the Content
   */

  insert(s: string, options?: InsertOptions): boolean;

  /**
   *
   * @deprecated Use [[`insert`]]
   */
  $insert?(s: string, options?: InsertOptions): boolean;

  /**
   * @category Focus
   *
   * @deprecated Use [[`hasFocus`]]
   */
  $hasFocus?(): boolean;
  /**
   * @category Focus
   *
   */
  hasFocus(): boolean;
  /**
   * @category Focus
   * @deprecated Use [[`focus`]]
   */
  $focus?(): void;
  /**
   * @category Focus
   * @deprecated Use [[`blur`]]
   */
  $blur?(): void;

  /**
   * @category Focus
   */
  focus?(): void;
  /**
   * @category Focus
   */
  blur?(): void;

  /**
   * Updates the style (color, bold, italic, etc...) of the selection or sets
   * the style to be applied to future input.
   *
   * If there is no selection and no range is specified, the style will
   * apply to the next character typed.
   *
   * If a range is specified, the style is applied to the range, otherwise,
   * if there is a selection, the style is applied to the selection.
   *
   * If the operation is 'toggle' and the range already has this style,
   * remove it. If the range
   * has the style partially applied (i.e. only some sections), remove it from
   * those sections, and apply it to the entire range.
   *
   * If the operation is 'set', the style is applied to the range,
   * whether it already has the style or not.
   *
   * The default operation is 'set'.
   *
   */
  applyStyle(style: Style, options?: ApplyStyleOptions): void;
  /**
   * @deprecated Use [[`applyStyle`]]
   */
  $applyStyle?(style: Style): void;

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
   * @deprecated Use [[`executeCommand`]] or [[`setValue`]]
   */
  $keystroke?(keys: string, evt?: KeyboardEvent): boolean;

  /**
   * Simulates a user typing the keys indicated by text.
   *
   * @param text - A sequence of one or more characters.
   * @category Changing the Content
   * @deprecated Use [[`executeCommand`]] or [[`setValue`]]
   */
  $typedText?(text: string): void;

  getCaretPoint?(): { x: number; y: number } | null;
  setCaretPoint(x: number, y: number): boolean;

  /**
   * Search the formula for items matching the **pattern** as a Latex string or
   * as a regular expression matching a Latex string.
   *
   * Results are returned as a `Range` array. If no results are found
   * an empty array is returned.
   */
  find(pattern: string | RegExp, options?: FindOptions): Range[];

  /**
   * Replace the pattern items matching the **pattern** with the
   * **replacement** value.
   *
   * If **replacement** is a function, the function is called
   * for each match and the function return value will be
   * used as the replacement.
   */
  replace(
    pattern: string | RegExp,
    replacement: string | ReplacementFunction,
    options?: FindOptions
  ): void;
}

export interface Model {
  readonly mathfield: Mathfield;
}
