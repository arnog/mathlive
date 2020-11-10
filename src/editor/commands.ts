import { isArray } from '../common/types';

import { hidePopover, showPopoverWithLatex } from './popover'; // @revisit
import { suggest } from '../core-definitions/definitions';
import type { MathfieldPrivate } from '../editor-mathfield/mathfield-private';
import { getCommandString } from '../editor-model/command-mode';
import { requestUpdate } from '../editor-mathfield/render';
import { SelectorPrivate, CommandRegistry } from './commands-definitions';
export { SelectorPrivate };

// @revisit: move to mathfield.vibrate()
export const HAPTIC_FEEDBACK_DURATION = 3; // in ms

interface RegisterCommandOptions {
    target: 'model' | 'mathfield' | 'virtual-keyboard';
    category?:
        | 'delete'
        | 'edit' // Changes the content
        | 'array-edit' // Changes the content
        | 'autocomplete'
        | 'clipboard'
        | 'scroll'
        | 'selection-anchor'
        | 'selection-extend'
        | 'speech'
        | 'virtual-keyboard'
        | '';
    audioFeedback?: string;
    canUndo?: boolean;
    changeContent?: boolean; // To update popover
    changeSelection?: boolean; // To update inline shortcut buffer
}

const COMMANDS: CommandRegistry<RegisterCommandOptions> = {};

export function register(
    commands: { [selector: string]: (...args: any[]) => boolean },
    options?: RegisterCommandOptions
): void {
    options = options ?? { target: 'mathfield', canUndo: false };

    Object.keys(commands).forEach((selector) => {
        console.assert(
            !COMMANDS[selector],
            'Selector already defined: ',
            selector
        );
        COMMANDS[selector] = { ...options, fn: commands[selector] };
    });
}

export function perform(
    mathfield: MathfieldPrivate,
    command: SelectorPrivate | [SelectorPrivate, ...any[]]
): boolean {
    if (!command) {
        return false;
    }

    let selector: SelectorPrivate;
    let args: string[] = [];
    let handled = false;
    let dirty = false;

    if (isArray(command)) {
        selector = command[0] as SelectorPrivate;
        args = command.slice(1);
    } else {
        selector = command;
    }

    // Convert kebab case (like-this) to camel case (likeThis).
    selector = selector.replace(/-\w/g, (m) =>
        m[1].toUpperCase()
    ) as SelectorPrivate;
    if (COMMANDS[selector]?.target === 'model') {
        if (/^(delete|transpose|add)/.test(selector)) {
            if (selector !== 'deleteBackward') {
                mathfield.resetKeystrokeBuffer();
            }
        }
        if (
            /^(delete|transpose|add)/.test(selector) &&
            mathfield.mode !== 'command'
        ) {
            // Update the undo state to account for the current selection
            mathfield.popUndoStack();
            mathfield.snapshot();
        }
        COMMANDS[selector].fn(mathfield.model, ...args);
        if (
            /^(delete|transpose|add)/.test(selector) &&
            mathfield.mode !== 'command'
        ) {
            mathfield.snapshot();
        }
        if (/^(delete)/.test(selector) && mathfield.mode === 'command') {
            const command = getCommandString(mathfield.model);
            const suggestions = suggest(command);
            if (suggestions.length === 0) {
                hidePopover(mathfield);
            } else {
                showPopoverWithLatex(
                    mathfield,
                    suggestions[0].match,
                    suggestions.length > 1
                );
            }
        }
        dirty = true;
        handled = true;
    } else if (COMMANDS[selector]) {
        dirty = COMMANDS[selector].fn(mathfield, ...args);
        handled = true;
    } else {
        throw Error('Unknown command "' + selector + '"');
    }
    // If the command changed the selection so that it is no longer
    // collapsed, or if it was an editing command, reset the inline
    // shortcut buffer and the user style
    if (
        !mathfield.model.selectionIsCollapsed ||
        /^(transpose|paste|complete|((moveToNextChar|moveToPreviousChar|extend).*))_$/.test(
            selector
        )
    ) {
        mathfield.resetKeystrokeBuffer();
        mathfield.style = {};
    }
    // Render the mathlist
    if (dirty) {
        requestUpdate(mathfield);
    }
    return handled;
}

/**
 * Perform a command, but:
 * * focus the mathfield
 * * provide haptic and audio feedback
 * This is used by the virtual keyboard when command keys (delete, arrows, etc..)
 * are pressed.
 */

export function performWithFeedback(
    mathfield: MathfieldPrivate,
    selector: SelectorPrivate
): boolean {
    // @revisit: have a registry of commands -> sound
    mathfield.focus();
    if (mathfield.options.keypressVibration && navigator?.vibrate) {
        navigator.vibrate(HAPTIC_FEEDBACK_DURATION);
    }
    // Convert kebab case to camel case.
    selector = selector.replace(/-\w/g, (m) =>
        m[1].toUpperCase()
    ) as SelectorPrivate;
    if (
        selector === 'moveToNextPlaceholder' ||
        selector === 'moveToPreviousPlaceholder' ||
        selector === 'complete'
    ) {
        mathfield.returnKeypressSound?.play().catch(console.warn);
    } else if (
        selector === 'deleteBackward' ||
        selector === 'deleteForward' ||
        selector === 'deletePreviousWord' ||
        selector === 'deleteNextWord' ||
        selector === 'deleteToGroupStart' ||
        selector === 'deleteToGroupEnd' ||
        selector === 'deleteToMathFieldStart' ||
        selector === 'deleteToMathFieldEnd'
    ) {
        mathfield.deleteKeypressSound?.play().catch(console.warn);
    } else {
        mathfield.keypressSound?.play().catch(console.warn);
    }
    return mathfield.executeCommand(selector);
}

register({
    performWithFeedback: (
        mathfield: MathfieldPrivate,
        command: SelectorPrivate
    ): boolean => performWithFeedback(mathfield, command),
});
