import type { ParseMode } from '../public/core-types';
import { TextAtom } from '../atoms/text';
import { _Model } from '../editor-model/model-private';
import { range } from '../editor-model/selection-utils';
import { MODE_SHIFT_COMMANDS } from '../formats/parse-math-string';
import { InsertOptions, OutputFormat, Range } from '../public/mathfield';
import { _Mathfield } from './mathfield-private';

const CLIPBOARD_LATEX_BEGIN = '$$';
const CLIPBOARD_LATEX_END = '$$';

/** @internal */
export const defaultExportHook = (
  _from: _Mathfield,
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

/** @internal */
export class ModeEditor {
  static _modes: Record<string, ModeEditor> = {};

  constructor(name: string) {
    ModeEditor._modes[name] = this;
  }

  static onPaste(
    mode: ParseMode,
    mathfield: _Mathfield,
    data: DataTransfer | string | null
  ): boolean {
    if (!mathfield.contentEditable && mathfield.userSelect === 'none') {
      mathfield.model.announce('plonk');
      return false;
    }
    if (typeof data === 'string') {
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', data);
      data = dataTransfer;
    }

    const redispatchedEvent = new ClipboardEvent('paste', {
      clipboardData: data,
      cancelable: true,
    });
    if (!mathfield.host?.dispatchEvent(redispatchedEvent)) return false;

    return ModeEditor._modes[mode].onPaste(mathfield, data);
  }

  /** Call this method from a menu */
  static copyToClipboard(mathfield: _Mathfield, format: OutputFormat): void {
    if (!mathfield.contentEditable && mathfield.userSelect === 'none') {
      mathfield.model.announce('plonk');
      return;
    }
    const model = mathfield.model;
    const exportRange: Range = model.selectionIsCollapsed
      ? [0, model.lastOffset]
      : range(model.selection);

    const latex = model.getValue(exportRange, format);

    navigator.clipboard.writeText(latex).then(
      () => {
        /* Resolved - text copied to clipboard successfully */
      },
      () => mathfield.model.announce('plonk')
    );
  }

  /** Call this method in response to a clipboard event */
  static onCopy(mathfield: _Mathfield, ev: ClipboardEvent): void {
    if (!ev.clipboardData) return;
    if (!mathfield.contentEditable && mathfield.userSelect === 'none') {
      mathfield.model.announce('plonk');
      return;
    }

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
      if (atoms.length === 1) {
        const atom = atoms[0];
        if (atom.type === 'root' || atom.type === 'group')
          atoms = atom.body!.filter((x) => x.type !== 'first');
      }
      try {
        ev.clipboardData.setData(
          'application/json+mathlive',
          JSON.stringify(atoms.map((x) => x.toJson()))
        );
      } catch {}

      //
      // 5. Put other flavors on the clipboard (MathJSON)
      //
      if (window[Symbol.for('io.cortexjs.compute-engine')]?.ComputeEngine) {
        const ce = globalThis.MathfieldElement.computeEngine;
        if (ce) {
          try {
            const options = ce.jsonSerializationOptions;
            ce.jsonSerializationOptions = { metadata: ['latex'] };
            const expr = ce.parse(
              model.getValue(exportRange, 'latex-unstyled')
            );
            ce.jsonSerializationOptions = options;

            const mathJson = JSON.stringify(expr.json);
            if (mathJson)
              ev.clipboardData.setData('application/json', mathJson);
          } catch {}
        }
      }
    }
    // Prevent the current document selection from being written to the clipboard.
    ev.preventDefault();
  }

  static insert(
    model: _Model,
    text: string,
    options: InsertOptions = {}
  ): boolean {
    const mode =
      options.mode === 'auto' ? model.mode : options.mode ?? model.mode;
    return ModeEditor._modes[mode].insert(model, text, options);
  }

  onPaste(
    _mathfield: _Mathfield,
    _data: DataTransfer | string | null
  ): boolean {
    return false;
  }

  insert(_model: _Model, _text: string, _options: InsertOptions): boolean {
    return false;
  }
}
