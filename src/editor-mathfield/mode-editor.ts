import { TextAtom } from '../core-atoms/text';
import { ModelPrivate } from '../editor-model/model-private';
import { range } from '../editor-model/selection-utils';
import { MODE_SHIFT_COMMANDS } from '../editor/parse-math-string';
import { ParseMode } from '../public/core';
import { InsertOptions, Range } from '../public/mathfield';
import { MathfieldPrivate } from './mathfield-private';

const CLIPBOARD_LATEX_BEGIN = '$$';
const CLIPBOARD_LATEX_END = '$$';

export const defaultExportHook = (
  _from: MathfieldPrivate,
  latex: string,
  _range: Range
): string => {
  // Add a wrapper around the LaTeX to be exported, if necessary
  if (
    !MODE_SHIFT_COMMANDS.some(
      (x) => latex.startsWith(x[0]) && latex.endsWith(x[1])
    )
  )
    latex = `${CLIPBOARD_LATEX_BEGIN} ${latex} ${CLIPBOARD_LATEX_END}`;

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
    const redispatchedEvent = new ClipboardEvent('paste', {
      clipboardData: ev.clipboardData,
      cancelable: true,
    });
    if (!mathfield.host?.dispatchEvent(redispatchedEvent)) return false;

    return ModeEditor._registry[mode].onPaste(mathfield, ev);
  }

  static onCopy(mathfield: MathfieldPrivate, ev: ClipboardEvent): void {
    if (!ev.clipboardData) return;
    const model = mathfield.model;
    const exportRange: Range = model.selectionIsCollapsed
      ? [0, model.lastOffset]
      : range(model.selection);

    let atoms = model.getAtoms(exportRange);
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
      // If the entire selection is in LaTeX mode, put the selection as plain
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
      // 1. Get LaTeX of selection
      //
      let latex: string;
      if (atoms.length === 1 && atoms[0].verbatimLatex !== undefined)
        latex = atoms[0].verbatimLatex;
      else latex = model.getValue(exportRange, 'latex-expanded');

      //
      // 2. Put latex flavor on clipboard
      //
      ev.clipboardData.setData('application/x-latex', latex);

      //
      // 3. Put text flavor on clipboard
      // (see defaultExportHook)
      //
      try {
        ev.clipboardData.setData(
          'text/plain',
          mathfield.options.onExport(mathfield, latex, exportRange)
        );
      } catch {}

      //
      // 4. Put serialized atoms on clipboard
      //
      if (
        atoms.length === 1 &&
        (atoms[0].type === 'root' || atoms[0].type === 'group')
      )
        atoms = atoms[0].body!.filter((x) => x.type !== 'first');
      try {
        ev.clipboardData.setData(
          'application/json+mathlive',
          JSON.stringify(atoms.map((x) => x.toJson()))
        );
      } catch {}

      //
      // 5. Put other flavors on the clipboard (MathJSON)
      //
      const ce = mathfield.computeEngine;
      if (ce) {
        try {
          ce.jsonSerializationOptions = { metadata: ['latex'] };
          const expr = ce.parse(latex);

          const mathJson = JSON.stringify(expr.json);
          if (mathJson) ev.clipboardData.setData('application/json', mathJson);
        } catch {}
      }
    }
    // Prevent the current document selection from being written to the clipboard.
    ev.preventDefault();
  }

  static insert(
    mode: ParseMode,
    model: ModelPrivate,
    text: string,
    options: InsertOptions = {}
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
