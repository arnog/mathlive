import { TextAtom } from '../core-atoms/text';
import { ModelPrivate } from '../editor-model/model-private';
import { range } from '../editor-model/selection-utils';
import { MODE_SHIFT_COMMANDS } from '../editor/parse-math-string';
import { ParseMode } from '../public/core';
import { InsertOptions, Range } from '../public/mathfield';
import { MathfieldPrivate } from './mathfield-private';

const CLIPBOARD_LATEX_BEGIN = '\\begin{equation*}';
const CLIPBOARD_LATEX_END = '\\end{equation*}';

export const defaultExportHook = (
  _from: MathfieldPrivate,
  latex: string,
  _range: Range
): string => {
  // Add a wrapper around the Latex to be exported, if necessary
  if (
    !MODE_SHIFT_COMMANDS.some(
      (x) => latex.startsWith(x[0]) && latex.endsWith(x[1])
    )
  ) {
    latex = `${CLIPBOARD_LATEX_BEGIN} ${latex} ${CLIPBOARD_LATEX_END}`;
  }
  return latex;
};

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
    if (!ev.clipboardData) return;
    const model = mathfield.model;
    const exportRange: Range = model.selectionIsCollapsed
      ? [0, model.lastOffset]
      : range(model.selection);

    const atoms = model.getAtoms(exportRange);
    if (atoms.every((x) => x.mode === 'text' || !x.mode)) {
      // If the entire selection is in text mode, put the selection as plain
      // text on the clipboard
      ev.clipboardData.setData(
        'text/plain',
        atoms
          .filter((x) => x instanceof TextAtom)
          .map((x) => x.value)
          .join('')
      );
    } else if (atoms.every((x) => x.mode === 'latex')) {
      // If the entire selection is in Latex mode, put the selection as plain
      // text on the clipboard
      ev.clipboardData.setData(
        'text/plain',
        model
          .getAtoms(exportRange, { includeChildren: true })
          .map((x) => x.value ?? '')
          .join('')
      );
    } else {
      //
      // 1. Put text flavor on the clipboard
      //
      let latex = '';
      if (atoms.length === 1 && atoms[0].verbatimLatex) {
        latex = atoms[0].verbatimLatex;
      }
      if (!latex) {
        latex = model.getValue(exportRange, 'latex-expanded');
      }

      //
      // 2. Put latex flavor on clipboard
      //
      ev.clipboardData.setData('application/x-latex', latex);

      //
      // 3. Put text flavor on clipboard
      // (see defaultExportHook)
      //

      ev.clipboardData.setData(
        'text/plain',
        mathfield.options.onExport(mathfield, latex, exportRange)
      );

      //
      // 3. Put other flavors on the clipboard
      //
      const mathJson = model.getValue(exportRange, 'math-json');
      if (mathJson) {
        ev.clipboardData.setData('application/json', mathJson);
      }
      const mathMl = model.getValue(exportRange, 'math-ml');
      if (mathMl) {
        ev.clipboardData.setData('application/mathml+xml', mathMl);
      }
    }
    // Prevent the current document selection from being written to the clipboard.
    ev.preventDefault();
  }

  static insert(
    mode: ParseMode,
    model: ModelPrivate,
    text: string,
    options: InsertOptions & {
      colorMap?: (name: string) => string | undefined;
      backgroundColorMap?: (name: string) => string | undefined;
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
