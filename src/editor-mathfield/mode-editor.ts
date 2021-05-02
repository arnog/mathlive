import { TextAtom } from '../core-atoms/text';
import { ModelPrivate } from '../editor-model/model-private';
import { range } from '../editor-model/selection-utils';
import { ParseMode } from '../public/core';
import { InsertOptions, Range } from '../public/mathfield';
import { MathfieldPrivate } from './mathfield-private';

export class ModeEditor {
  static _registry: Record<string, ModeEditor> = {};
  constructor(name: string) {
    ModeEditor._registry[name] = this;
  }

  static onPaste(
    mode: ParseMode,
    mathfield: MathfieldPrivate,
    ev: ClipboardEvent
  ): boolean {
    return ModeEditor._registry[mode].onPaste(mathfield, ev);
  }

  static onCopy(mathfield: MathfieldPrivate, ev: ClipboardEvent): void {
    const model = mathfield.model;
    const value: Range = model.selectionIsCollapsed
      ? [0, model.lastOffset]
      : range(mathfield.selection);

    const atoms = model.getAtoms(value);
    if (atoms.every((x) => x.mode === 'text' || !x.mode)) {
      // If the entire selection is in text mode, simply put some plain
      // text on the clipboard
      ev.clipboardData.setData(
        'text/plain',
        atoms
          .filter((x) => x instanceof TextAtom)
          .map((x) => x.value)
          .join('')
      );
    } else if (atoms.every((x) => x.mode === 'latex')) {
      // If the entire selection is in latex mode, simply put some plain
      // text on the clipboard
      ev.clipboardData.setData(
        'text/plain',
        model
          .getAtoms(value, { includeChildren: true })
          .map((x) => x.value ?? '')
          .join('')
      );
    } else {
      ev.clipboardData.setData(
        'text/plain',
        '\\[ ' + mathfield.getValue(value, 'latex-expanded') + ' \\]'
      );
      ev.clipboardData.setData(
        'application/json',
        mathfield.getValue(value, 'math-json')
      );
      ev.clipboardData.setData(
        'application/xml',
        mathfield.getValue(value, 'math-ml')
      );
    }
    // Prevent the current document selection from being written to the clipboard.
    ev.preventDefault();
  }

  static insert(
    mode: ParseMode,
    model: ModelPrivate,
    text: string,
    options: InsertOptions & {
      colorMap?: (name: string) => string;
      backgroundColorMap?: (name: string) => string;
    } = {}
  ): boolean {
    return ModeEditor._registry[mode].insert(model, text, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPaste(_mathfield: MathfieldPrivate, _ev: ClipboardEvent): boolean {
    return false;
  }

  insert(
    _model: ModelPrivate,
    _text: string,
    _options: InsertOptions
  ): boolean {
    return false;
  }
}
