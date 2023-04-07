import { register as registerCommand } from '../editor/commands';
import { complete } from './autocomplete';
import type { MathfieldPrivate } from './mathfield-private';
import { onInput } from './keyboard-input';
import { toggleKeystrokeCaption } from './keystroke-caption';
import { contentDidChange, contentWillChange } from '../editor-model/listeners';
import { requestUpdate } from './render';
import { ParseMode } from '../public/core-types';

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
    onInput(mathfield, text, options);
    return true;
  },
  insertDecimalSeparator: (mathfield: MathfieldPrivate) => {
    if (
      mathfield.mode === 'math' &&
      window.MathfieldElement.decimalSeparator === ','
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
  // A 'commit' command is used to simulate pressing the return/enter key,
  // e.g. when using a virtual keyboard
  commit: (mathfield: MathfieldPrivate) => {
    if (contentWillChange(mathfield.model, { inputType: 'insertLineBreak' })) {
      mathfield.host?.dispatchEvent(
        new Event('change', { bubbles: true, composed: true })
      );
      contentDidChange(mathfield.model, { inputType: 'insertLineBreak' });
    }
    return true;
  },
  insertPrompt: (
    mathfield: MathfieldPrivate,
    id?: string,
    options?
  ): boolean => {
    const promptIds = mathfield.getPrompts();
    let prosepectiveId =
      'prompt-' +
      Date.now().toString(36).slice(-2) +
      Math.floor(Math.random() * 0x186a0).toString(36);
    let i = 0;
    while (promptIds.includes(prosepectiveId) && i < 100) {
      if (i === 99) {
        console.error('could not find a unique ID after 100 tries');
        return false;
      }
      prosepectiveId =
        'prompt-' +
        Date.now().toString(36).slice(-2) +
        Math.floor(Math.random() * 0x186a0).toString(36);
      i++;
    }
    mathfield.insert(`\\placeholder[${id ?? prosepectiveId}]{}`, options);
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

      if (
        'queryCommandSupported' in document &&
        document.queryCommandSupported('copy')
      )
        document.execCommand('copy');
      else {
        mathfield.element!.querySelector('.ML__keyboard-sink')!.dispatchEvent(
          new ClipboardEvent('copy', {
            bubbles: true,
            composed: true,
          })
        );
      }
      return false;
    },

    cutToClipboard: (mathfield: MathfieldPrivate) => {
      mathfield.focus();

      if (
        'queryCommandSupported' in document &&
        document.queryCommandSupported('cut')
      )
        document.execCommand('cut');
      else {
        mathfield.element!.querySelector('.ML__keyboard-sink')!.dispatchEvent(
          new ClipboardEvent('cut', {
            bubbles: true,
            composed: true,
          })
        );
      }
      return true;
    },

    pasteFromClipboard: (mathfield: MathfieldPrivate) => {
      mathfield.focus();
      if (
        'queryCommandSupported' in document &&
        document.queryCommandSupported('paste')
      )
        document.execCommand('paste');
      else {
        navigator.clipboard.readText().then((text) => {
          if (
            text &&
            contentWillChange(mathfield.model, {
              inputType: 'insertFromPaste',
              data: text,
            })
          ) {
            mathfield.snapshot();
            if (mathfield.insert(text)) {
              contentDidChange(mathfield.model, {
                inputType: 'insertFromPaste',
              });
              requestUpdate(mathfield);
            }
          } else mathfield.model.announce('plonk');
        });
      }

      return true;
    },
  },
  { target: 'mathfield', category: 'clipboard' }
);
