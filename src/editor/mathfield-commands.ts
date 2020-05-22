import { ParseMode } from '../public/core';
import { register as registerCommand } from './commands';
import { complete } from './autocomplete';
import type { MathfieldPrivate } from './mathfield-class';
import { onTypedText } from './mathfield-keyboard-input';

registerCommand({
    undo: (mathfield: MathfieldPrivate) => {
        complete(mathfield);
        // Undo to the previous state
        mathfield.undo();
        return true;
    },
    redo: (mathfield: MathfieldPrivate) => {
        complete(mathfield);
        mathfield.redo();
        return true;
    },
    scrollIntoView: (mathfield: MathfieldPrivate) => {
        mathfield.scrollIntoView();
        return true;
    },
    scrollToStart: (mathfield: MathfieldPrivate) => {
        mathfield.field.scroll(0, 0);
        return true;
    },
    scrollToEnd: (mathfield: MathfieldPrivate) => {
        const fieldBounds = mathfield.field.getBoundingClientRect();
        mathfield.field.scroll(fieldBounds.left - window.scrollX, 0);
        return true;
    },
    enterCommandMode: (mathfield: MathfieldPrivate) => {
        mathfield.switchMode('command');
        return true;
    },
    toggleKeystrokeCaption: (mathfield: MathfieldPrivate) => {
        mathfield.keystrokeCaptionVisible = !mathfield.keystrokeCaptionVisible;
        mathfield.keystrokeCaption.innerHTML = '';
        if (!mathfield.keystrokeCaptionVisible) {
            mathfield.keystrokeCaption.style.visibility = 'hidden';
        }
        return false;
    },
    switchMode: (mathfield: MathfieldPrivate, mode: ParseMode) => {
        mathfield.switchMode(mode);
        return true;
    },
    insert: (mathfield: MathfieldPrivate, s: string, options) =>
        mathfield.$insert(s, options),
    typedText: (mathfield: MathfieldPrivate, text: string) => {
        onTypedText(mathfield, text);
        return true;
    },
});
