import { ParseMode } from '../public/core';
import { register as registerCommand } from './commands';
import { complete } from './autocomplete';
import { Mathfield } from './mathfield-utils';
import { onTypedText } from './mathfield-keyboard-input';

registerCommand({
    undo: (mathfield: Mathfield) => {
        complete(mathfield);
        // Undo to the previous state
        mathfield.undoManager.undo(mathfield.config);
        return true;
    },
    redo: (mathfield: Mathfield) => {
        complete(mathfield);
        mathfield.undoManager.redo(mathfield.config);
        return true;
    },
    scrollIntoView: (mathfield: Mathfield) => {
        mathfield.scrollIntoView();
        return true;
    },
    scrollToStart: (mathfield: Mathfield) => {
        mathfield.field.scroll(0, 0);
        return true;
    },
    scrollToEnd: (mathfield: Mathfield) => {
        const fieldBounds = mathfield.field.getBoundingClientRect();
        mathfield.field.scroll(fieldBounds.left - window.scrollX, 0);
        return true;
    },
    enterCommandMode: (mathfield: Mathfield) => {
        mathfield.switchMode('command');
        return true;
    },
    toggleKeystrokeCaption: (mathfield: Mathfield) => {
        mathfield.keystrokeCaptionVisible = !mathfield.keystrokeCaptionVisible;
        mathfield.keystrokeCaption.innerHTML = '';
        if (!mathfield.keystrokeCaptionVisible) {
            mathfield.keystrokeCaption.style.visibility = 'hidden';
        }
        return false;
    },
    switchMode: (mathfield: Mathfield, mode: ParseMode) => {
        mathfield.switchMode(mode);
        return true;
    },
    insert: (mathfield: Mathfield, s: string, options) =>
        mathfield.$insert(s, options),
    typedText: (mathfield: Mathfield, text: string) => {
        onTypedText(mathfield, text);
        return true;
    },
});
