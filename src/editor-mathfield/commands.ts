import { ParseMode } from '../public/core';
import { register as registerCommand } from '../editor/commands';
import { complete } from './autocomplete';
import type { MathfieldPrivate } from './mathfield-private';
import { onTypedText } from './keyboard-input';
import { toggleKeystrokeCaption } from './keystroke-caption';
import { contentDidChange, contentWillChange } from 'editor-model/listeners';

registerCommand({
  undo: (mathfield: MathfieldPrivate) => {
    complete(mathfield, 'accept');
    // Undo to the previous state
    mathfield.undo();
    return true;
  },
  redo: (mathfield: MathfieldPrivate) => {
    complete(mathfield, 'accept');
    mathfield.redo();
    return true;
  },
  scrollIntoView: (mathfield: MathfieldPrivate) => {
    mathfield.scrollIntoView();
    return true;
  },
  scrollToStart: (mathfield: MathfieldPrivate) => {
    mathfield.field!.scroll(0, 0);
    return true;
  },
  scrollToEnd: (mathfield: MathfieldPrivate) => {
    const fieldBounds = mathfield.field!.getBoundingClientRect();
    mathfield.field!.scroll(fieldBounds.left - window.scrollX, 0);
    return true;
  },
  enterLatexMode: (mathfield: MathfieldPrivate) => {
    mathfield.switchMode('latex');
    return true;
  },
  toggleKeystrokeCaption: toggleKeystrokeCaption,
  plonk: (mathfield: MathfieldPrivate) => {
    mathfield.model.announce('plonk');
    return true;
  },
  switchMode: (
    mathfield: MathfieldPrivate,
    mode: ParseMode,
    prefix: string,
    suffix: string
  ) => {
    mathfield.switchMode(mode, prefix, suffix);
    return true;
  },
  insert: (mathfield: MathfieldPrivate, s: string, options) =>
    mathfield.insert(s, options),
  typedText: (mathfield: MathfieldPrivate, text: string, options) => {
    onTypedText(mathfield, text, options);
    return true;
  },
  insertDecimalSeparator: (mathfield: MathfieldPrivate) => {
    if (
      mathfield.mode === 'math' &&
      mathfield.options.decimalSeparator === ','
    ) {
      const model = mathfield.model;
      const child = model.at(Math.max(model.position, model.anchor));
      if (child.isDigit()) {
        mathfield.snapshot();
        mathfield.insert('{,}', { format: 'latex' });
        return true;
      }
    }
    mathfield.insert('.');
    return true;
  },
  commit: (mathfield: MathfieldPrivate) => {
    if (contentWillChange(mathfield.model, { inputType: 'insertLineBreak' })) {
      // No matching keybinding: trigger a commit

      if (mathfield.host) {
        mathfield.host.dispatchEvent(
          new Event('change', {
            bubbles: true,
            composed: true,
          })
        );
      }

      // Dispatch an 'input' event matching the behavior of `<textarea>`
      contentDidChange(mathfield.model, { inputType: 'insertLineBreak' });
    }
    return true;
  },
});

registerCommand(
  {
    copyToClipboard: (mathfield: MathfieldPrivate) => {
      mathfield.focus();
      // If the selection is empty, select the entire field before
      // copying it.
      if (mathfield.model.selectionIsCollapsed) mathfield.select();

      document.execCommand('copy');
      return false;
    },

    cutToClipboard: (mathfield: MathfieldPrivate) => {
      mathfield.focus();
      document.execCommand('cut');
      return true;
    },

    pasteFromClipboard: (mathfield: MathfieldPrivate) => {
      mathfield.focus();
      document.execCommand('paste');
      return true;
    },
  },
  { target: 'mathfield', category: 'clipboard' }
);
