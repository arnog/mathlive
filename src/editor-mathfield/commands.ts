import { register as registerCommand } from '../editor/commands';
import type { _Mathfield } from './mathfield-private';
import { onInput } from './keyboard-input';
import { toggleKeystrokeCaption } from './keystroke-caption';
import { requestUpdate } from './render';
import { ParseMode } from '../public/core-types';
import { updateAutocomplete } from './autocomplete';

registerCommand({
  undo: (mathfield: _Mathfield) => {
    mathfield.undo();
    return true;
  },
  redo: (mathfield: _Mathfield) => {
    mathfield.redo();
    return true;
  },
  scrollIntoView: (mathfield: _Mathfield) => {
    mathfield.scrollIntoView();
    return true;
  },
  scrollToStart: (mathfield: _Mathfield) => {
    mathfield.field!.scroll(0, 0);
    return true;
  },
  scrollToEnd: (mathfield: _Mathfield) => {
    const fieldBounds = mathfield.field!.getBoundingClientRect();
    mathfield.field!.scroll(fieldBounds.left - window.scrollX, 0);
    return true;
  },
  toggleKeystrokeCaption: toggleKeystrokeCaption,
  plonk: (mathfield: _Mathfield) => {
    mathfield.model.announce('plonk');
    return true;
  },
  switchMode: (
    mathfield: _Mathfield,
    mode: ParseMode,
    prefix: string,
    suffix: string
  ) => {
    mathfield.switchMode(mode, prefix, suffix);
    return true;
  },
  insert: (mathfield: _Mathfield, s: string, options) =>
    mathfield.insert(s, options),
  typedText: (mathfield: _Mathfield, text: string, options) => {
    onInput(mathfield, text, options);
    return true;
  },
  insertDecimalSeparator: (mathfield: _Mathfield) => {
    const model = mathfield.model;
    if (
      model.mode === 'math' &&
      window.MathfieldElement.decimalSeparator === ','
    ) {
      const child = model.at(Math.max(model.position, model.anchor));
      if (child.isDigit()) {
        mathfield.insert('{,}', { format: 'latex' });
        mathfield.snapshot('insert-mord');
        return true;
      }
    }
    mathfield.insert('.');
    return true;
  },
  // A 'commit' command is used to simulate pressing the return/enter key,
  // e.g. when using a virtual keyboard
  commit: (mathfield: _Mathfield) => {
    if (mathfield.model.contentWillChange({ inputType: 'insertLineBreak' })) {
      mathfield.host?.dispatchEvent(
        new Event('change', { bubbles: true, composed: true })
      );
      mathfield.model.contentDidChange({ inputType: 'insertLineBreak' });
    }
    return true;
  },
  insertPrompt: (mathfield: _Mathfield, id?: string, options?): boolean => {
    const promptIds = mathfield.getPrompts();
    let prospectiveId =
      'prompt-' +
      Date.now().toString(36).slice(-2) +
      Math.floor(Math.random() * 0x186a0).toString(36);
    let i = 0;
    while (promptIds.includes(prospectiveId) && i < 100) {
      if (i === 99) {
        console.error('could not find a unique ID after 100 tries');
        return false;
      }
      prospectiveId =
        'prompt-' +
        Date.now().toString(36).slice(-2) +
        Math.floor(Math.random() * 0x186a0).toString(36);
      i++;
    }
    mathfield.insert(`\\placeholder[${id ?? prospectiveId}]{}`, options);
    return true;
  },
});

registerCommand(
  {
    copyToClipboard: (mathfield: _Mathfield) => {
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
  },
  { target: 'mathfield' }
);

registerCommand(
  {
    cutToClipboard: (mathfield: _Mathfield) => {
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

    pasteFromClipboard: (mathfield: _Mathfield) => {
      mathfield.focus();
      if (
        'queryCommandSupported' in document &&
        document.queryCommandSupported('paste')
      ) {
        document.execCommand('paste');
        return true;
      }

      navigator.clipboard.readText().then((text) => {
        if (
          text &&
          mathfield.model.contentWillChange({
            inputType: 'insertFromPaste',
            data: text,
          })
        ) {
          mathfield.stopCoalescingUndo();
          mathfield.stopRecording();
          if (mathfield.insert(text, { mode: mathfield.model.mode })) {
            updateAutocomplete(mathfield);
            mathfield.startRecording();
            mathfield.snapshot('paste');
            mathfield.model.contentDidChange({ inputType: 'insertFromPaste' });
            requestUpdate(mathfield);
          }
        } else mathfield.model.announce('plonk');
        mathfield.startRecording();
      });

      return true;
    },
  },
  {
    target: 'mathfield',
    canUndo: true,
    changeContent: true,
    changeSelection: true,
  }
);
