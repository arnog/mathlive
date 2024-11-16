import type { Selector } from './commands';
import type {
  ApplyStyleOptions,
  InsertOptions,
  Offset,
  OutputFormat,
  Style,
  Range,
  Selection,
} from './core-types';

export type InsertStyleHook = (
  sender: Mathfield,
  at: Offset,
  info: { before: Offset; after: Offset }
) => Readonly<Style>;

/** @internal */
export interface Mathfield {
  /**
   * Execute a {@linkcode Commands|command} defined by a selector.
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
   */

  insert(s: string, options?: InsertOptions): boolean;

  /**
   * Return true if the mathfield is currently focused (responds to keyboard
   * input).
   *
   */
  hasFocus(): boolean;

  focus?(): void;
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
   * Return the content of the `\placeholder{}` command with the `placeholderId`
   */
  getPromptValue(placeholderId: string, format?: OutputFormat): string;

  getPrompts(filter?: {
    id?: string;
    locked?: boolean;
    correctness?: 'correct' | 'incorrect' | 'undefined';
  }): string[];
}

/** @internal */
export interface Model {
  readonly mathfield: Mathfield;
}
