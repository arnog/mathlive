import { register as registerCommand } from './commands';
import { selectionIsCollapsed } from './model-selection';
import type { MathfieldPrivate } from './mathfield-class';
import { requestUpdate } from './mathfield-render';
import { insert } from './model-insert';
import { astToLatex } from '../mathlive';

export function onPaste(
    mathfield: MathfieldPrivate,
    ev: ClipboardEvent
): boolean {
    let text = '';

    // Try to get a MathJSON data type
    const json = ev.clipboardData.getData('application/json');
    if (json) {
        try {
            text = astToLatex(json, {});
        } catch (e) {
            text = '';
        }
    }
    // If that didn't work, try some plain text
    if (!text) {
        text = ev.clipboardData.getData('text/plain');
    }

    if (text) {
        insert(mathfield.model, text, {
            smartFence: mathfield.options.smartFence,
            mode: 'math',
        });

        requestUpdate(mathfield);
        ev.preventDefault();
        ev.stopPropagation();
    }
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
            '$$' + mathfield.getValue('latex-expanded') + '$$'
        );
        e.clipboardData.setData('application/json', mathfield.getValue('json'));
        e.clipboardData.setData(
            'application/xml',
            mathfield.getValue('mathML')
        );
    } else {
        e.clipboardData.setData(
            'text/plain',
            '$$' +
                mathfield.getValue(mathfield.selection, 'latex-expanded') +
                '$$'
        );
        e.clipboardData.setData(
            'application/json',
            mathfield.getValue(mathfield.selection, 'json')
        );
        e.clipboardData.setData(
            'application/xml',
            mathfield.getValue(mathfield.selection, 'mathML')
        );
    }
    // Prevent the current document selection from being written to the clipboard.
    e.preventDefault();
}

registerCommand(
    {
        copyToClipboard: (mathfield: MathfieldPrivate) => {
            mathfield.focus();
            // If the selection is empty, select the entire field before
            // copying it.
            if (selectionIsCollapsed(mathfield.model)) {
                mathfield.select();
            }
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
