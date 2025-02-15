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

/** @category Styles */

export type InsertStyleHook = (
  sender: Mathfield,
  at: Offset,
  info: { before: Offset; after: Offset }
) => Readonly<Style>;

/** @internal */
export interface Mathfield {
  executeCommand(command: Selector | [Selector, ...any[]]): boolean;

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

  setValue(latex?: string, options?: InsertOptions): void;

  insert(s: string, options?: InsertOptions): boolean;

  hasFocus(): boolean;

  focus?(): void;
  blur?(): void;

  applyStyle(style: Style, options?: ApplyStyleOptions): void;

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
