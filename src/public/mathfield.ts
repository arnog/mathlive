import { Selector } from './commands';
import { CombinedVirtualKeyboardOptions, MathfieldOptions } from './options';
import { ParseMode, Style } from './core';
import { PromptAtom } from 'core-atoms/prompt';

/**
 *
| Format                | Description             |
| :-------------------- | :---------------------- |
| `"ascii-math"`        | A string of [ASCIIMath](http://asciimath.org/). |
| `"latex"`             | LaTeX rendering of the content, with LaTeX macros not expanded. |
| `"latex-expanded"`    | All macros are recursively expanded to their definition. |
| `"latex-unstyled"`    | Styling (background color, color) is ignored |
| `"math-json"`         | A MathJSON abstract syntax tree, as an object literal formated as a JSON string. Note: you must import the CortexJS Compute Engine to obtain a result. |
| `"math-ml"`           | A string of MathML markup. |
| `"spoken"`            | Spoken text rendering, using the default format defined in config, which could be either text or SSML markup. |
| `"spoken-text"`       | A plain spoken text rendering of the content. |
| `"spoken-ssml"`       | A SSML (Speech Synthesis Markup Language) version of the content, which can be used with some text-to-speech engines such as AWS. |
| `"spoken-ssml-with-highlighting"`| Like `"spoken-ssml"` but with additional annotations necessary for synchronized highlighting (read aloud). |

   * To use the`"math-json"` format the Compute Engine library must be loaded. Use for example:
   * ```js
import "https://unpkg.com/@cortex-js/compute-engine?module";
```
   *

*/
export type OutputFormat =
  | 'ascii-math'
  | 'latex'
  | 'latex-expanded'
  | 'latex-unstyled'
  | 'math-json'
  | 'math-ml'
  | 'spoken'
  | 'spoken-text'
  | 'spoken-ssml'
  | 'spoken-ssml-with-highlighting';

export type InsertOptions = {
  /** If `"auto"` or omitted, the current mode is used */
  mode?: ParseMode | 'auto';
  /**
     * The format of the input string:
     *
    | <!-- -->    | <!-- -->    |
    |:------------|:------------|
    |`"auto"`| The string is LaTeX fragment or command) (default)|
    |`"latex"`| The string is a LaTeX fragment|
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

  suppressChangeNotifications?: boolean;
  style?: Style;
  /** If `true`, the mathfield will be focused after
   * the insertion
   */
  focus?: boolean;
  /** If `true`, provide audio and haptic feedback
   */
  feedback?: boolean;
  /** If `true`, scroll the mathfield into view after insertion such that the
   * insertion point is visible
   */
  scrollIntoView?: boolean;
  /** If `true`, the style after the insertion
   * is the same as the style before. If false, the style after the
   * insertion is the style of the last inserted atom.
   */
  resetStyle?: boolean;
};

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
 * A pair of offsets (boundary points) that can be used to denote a fragment
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
 * A selection is a set of ranges (to support discontinuous selection, for
 * example when selecting a column in a matrix).
 *
 * If there is a single range and that range is collapsed, the selection is
 * collapsed.
 *
 * A selection can also have a direction. While many operations are insensitive
 * to the direction, a few are. For example, when selecting a fragment of an
 * expression from left to right, the direction of this range will be "forward".
 * Pressing the left arrow key will sets the insertion at the start of the range.
 * Conversely, if the selection is made from right to left, the direction is
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
 * - `VirtualKeyboard`
 * - `VirtualKeyboardDelegate` (used when the virtual keyboard is shared amongst
 * mathfield instances)
 * - `RemoteVirtualKeyboard` (the shared virtual keyboard instance)
 */
export interface VirtualKeyboardInterface {
  visible: boolean;
  height: number;
  /** Called once when the keyboard is created */
  create(): void;
  /** After calling dispose() the Virtual Keyboard is no longer valid and
   * cannot be brought back. Use disable() for temporarily deactivating the
   * keyboard. */
  dispose(): void;
  executeCommand(command: string | [string, ...any[]]): boolean;
  focusMathfield(): void;
  blurMathfield(): void;
  updateToolbar(mf: Mathfield): void;
  enable(): void;
  disable(): void;
  stateWillChange(visible: boolean): boolean;
  stateChanged(): void;
  setOptions(options: CombinedVirtualKeyboardOptions): void;
}

export interface Mathfield {
  mode: ParseMode;

  getOptions(): MathfieldOptions;
  getOptions<K extends keyof MathfieldOptions>(
    keys: K[]
  ): Pick<MathfieldOptions, K>;
  getOption<K extends keyof MathfieldOptions>(key: K): MathfieldOptions[K];

  setOptions(options: Partial<MathfieldOptions>): void;

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
   * Return a textual representation of the content of the mathfield.
   *
   * @param format - The format of the result. If using `math-json`
   * the Compute Engine library must be loaded, for example with:
   *
   * ```js
import "https://unpkg.com/@cortex-js/compute-engine?module";
```
   *
   *
   * **Default:** `"latex"`
   *
   * @category Accessing the Content
   */
  getValue(format?: OutputFormat): string;
  /** Return the value of the mathfield from `start` to `end` */
  getValue(start: Offset, end: Offset, format?: OutputFormat): string;
  /** Return the value of the mathfield in `range` */
  getValue(range: Range | Selection, format?: OutputFormat): string;
  /** @internal */
  getValue(
    arg1?: Offset | OutputFormat | Range | Selection,
    arg2?: Offset | OutputFormat,
    arg3?: OutputFormat
  ): string;

  select(): void;

  /**
   * Set the content of the mathfield to the text interpreted as a
   * LaTeX expression.
   *
   * @category Accessing the Content
   */
  setValue(latex?: string, options?: InsertOptions): void;

  /**
   * Insert a block of text at the current insertion point.
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
   * Return true if the mathfield is currently focused (responds to keyboard
   * input).
   *
   * @category Focus
   *
   */
  hasFocus(): boolean;

  /**
   * @category Focus
   */
  focus?(): void;
  /**
   * @category Focus
   */
  blur?(): void;

  /**
   * Update the style (color, bold, italic, etc...) of the selection or sets
   * the style to be applied to future input.
   *
   * If there is no selection and no range is specified, the style will
   * apply to the next character typed.
   *
   * If a range is specified, the style is applied to the range, otherwise,
   * if there is a selection, the style is applied to the selection.
   *
   * If the operation is `"toggle"` and the range already has this style,
   * remove it. If the range
   * has the style partially applied (i.e. only some sections), remove it from
   * those sections, and apply it to the entire range.
   *
   * If the operation is `"set"`, the style is applied to the range,
   * whether it already has the style or not.
   *
   * The default operation is `"set"`.
   *
   */
  applyStyle(style: Style, options?: ApplyStyleOptions): void;

  /**
   * The bottom location of the caret (insertion point) in viewport
   * coordinates.
   *
   * See also [[`setCaretPoint`]]
   * @category Selection
   */
  getCaretPoint?(): { x: number; y: number } | null;
  setCaretPoint(x: number, y: number): boolean;

  /**
   * Return a nested mathfield element that match the provided `placeholderId`
   * @param placeholderId
   */
  getPromptContent(placeholderId: string): string;

  get prompts(): string[];

  virtualKeyboardState: 'visible' | 'hidden';
}

export interface Model {
  readonly mathfield: Mathfield;
}
