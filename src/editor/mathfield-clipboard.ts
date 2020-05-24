import { register as registerCommand } from './commands';
import { selectionIsCollapsed } from './model-selection';
import type { MathfieldPrivate } from './mathfield-class';
import { requestUpdate } from './mathfield-render';

export function onPaste(mathfield: MathfieldPrivate): boolean {
    // Make note we're in the process of pasting. The subsequent call to
    // onTypedText() will take care of interpreting the clipboard content
    mathfield.pasteInProgress = true;
    return true;
}
export function onCut(mathfield: MathfieldPrivate): boolean {
    // Clearing the selection will have the side effect of clearing the
    // content of the textarea. However, the textarea value is what will
    // be copied to the clipboard, so defer the clearing of the selection
    // to later, after the cut operation has been handled.
    setTimeout(
        function (): void {
            mathfield.$clearSelection();
            requestUpdate(mathfield);
        }.bind(mathfield),
        0
    );
    return true;
}
export function onCopy(mathfield: MathfieldPrivate, e: ClipboardEvent): void {
    if (selectionIsCollapsed(mathfield.model)) {
        e.clipboardData.setData(
            'text/plain',
            '$$' + mathfield.$text('latex-expanded') + '$$'
        );
        e.clipboardData.setData('application/json', mathfield.$text('json'));
        e.clipboardData.setData('application/xml', mathfield.$text('mathML'));
    } else {
        e.clipboardData.setData(
            'text/plain',
            '$$' + mathfield.$selectedText('latex-expanded') + '$$'
        );
        e.clipboardData.setData(
            'application/json',
            mathfield.$selectedText('json')
        );
        e.clipboardData.setData(
            'application/xml',
            mathfield.$selectedText('mathML')
        );
    }
    // Prevent the current document selection from being written to the clipboard.
    e.preventDefault();
}

registerCommand(
    {
        copyToClipboard: (mathfield: MathfieldPrivate) => {
            mathfield.$focus();
            // If the selection is empty, select the entire field before
            // copying it.
            if (selectionIsCollapsed(mathfield.model)) {
                mathfield.$select();
            }
            document.execCommand('copy');
            return false;
        },

        cutToClipboard: (mathfield: MathfieldPrivate) => {
            mathfield.$focus();
            document.execCommand('cut');
            return true;
        },

        pasteFromClipboard: (mathfield: MathfieldPrivate) => {
            mathfield.$focus();
            document.execCommand('paste');
            return true;
        },
    },
    { target: 'mathfield', category: 'clipboard' }
);
