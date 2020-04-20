import { hidePopover, showPopoverWithLatex } from './editor-popover'; // @revisit
import { suggest } from '../core/definitions';
import { Mathfield } from './mathfield-utils';
import { selectionIsCollapsed } from './model-selection';
import { extractCommandStringAroundInsertionPoint } from './model-command-mode';
import { requestUpdate } from './mathfield-render';
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
    mathfield: Mathfield,
    command: SelectorPrivate | string[]
): boolean {
    if (!command) {
        return false;
    }

    let selector: SelectorPrivate;
    let args: string[] = [];
    let handled = false;
    let dirty = false;

    if (Array.isArray(command)) {
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
            mathfield.resetKeystrokeBuffer();
        }
        if (
            /^(delete|transpose|add)/.test(selector) &&
            mathfield.mode !== 'command'
        ) {
            // Update the undo state to account for the current selection
            mathfield.undoManager.pop();
            mathfield.undoManager.snapshot(mathfield.config);
        }
        COMMANDS[selector].fn(mathfield.model, ...args);
        if (
            /^(delete|transpose|add)/.test(selector) &&
            mathfield.mode !== 'command'
        ) {
            mathfield.undoManager.snapshot(mathfield.config);
        }
        if (/^(delete)/.test(selector) && mathfield.mode === 'command') {
            const command = extractCommandStringAroundInsertionPoint(
                mathfield.model
            );
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
        !selectionIsCollapsed(mathfield.model) ||
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

export function performWithFeedback(mathfield: Mathfield, selector): boolean {
    // @revisit: have a registry of commands -> sound
    mathfield.$focus();
    if (mathfield.config.keypressVibration && navigator.vibrate) {
        navigator.vibrate(HAPTIC_FEEDBACK_DURATION);
    }
    // Convert kebab case to camel case.
    selector = selector.replace(/-\w/g, (m) => m[1].toUpperCase());
    if (
        selector === 'moveToNextPlaceholder' ||
        selector === 'moveToPreviousPlaceholder' ||
        selector === 'complete'
    ) {
        if (mathfield.returnKeypressSound) {
            mathfield.returnKeypressSound.load();
            mathfield.returnKeypressSound
                .play()
                .catch((err) => console.warn(err));
        } else if (mathfield.keypressSound) {
            mathfield.keypressSound.load();
            mathfield.keypressSound.play().catch((err) => console.warn(err));
        }
    } else if (
        selector === 'deletePreviousChar' ||
        selector === 'deleteNextChar' ||
        selector === 'deletePreviousWord' ||
        selector === 'deleteNextWord' ||
        selector === 'deleteToGroupStart' ||
        selector === 'deleteToGroupEnd' ||
        selector === 'deleteToMathFieldStart' ||
        selector === 'deleteToMathFieldEnd'
    ) {
        if (mathfield.deleteKeypressSound) {
            mathfield.deleteKeypressSound.load();
            mathfield.deleteKeypressSound
                .play()
                .catch((err) => console.warn(err));
        } else if (mathfield.keypressSound) {
            mathfield.keypressSound.load();
            mathfield.keypressSound.play().catch((err) => console.warn(err));
        }
    } else if (mathfield.keypressSound) {
        mathfield.keypressSound.load();
        mathfield.keypressSound.play().catch((err) => console.warn(err));
    }
    return mathfield.$perform(selector);
}

register({
    performWithFeedback: (mathfield: Mathfield, command: string): boolean =>
        performWithFeedback(mathfield, command),
});
