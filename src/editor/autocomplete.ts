import { ParseMode } from '../public/core';
import type { Atom } from '../core/atom';
import { CommandAtom } from '../core-atoms/command';

import { suggest } from '../core-definitions/definitions-utils';

import type { ModelPrivate } from '../editor-model/model-private';
import { contentDidChange } from '../editor-model/listeners';
import {
    getCommandString,
    getCommandRange,
    getCommandSuggestionRange,
    getCommandAtoms,
} from '../editor-model/command-mode';

import { register as registerCommand } from './commands';
import type { MathfieldPrivate } from '../editor-mathfield/mathfield-private';
import { hidePopover, showPopoverWithLatex } from './popover';
import { insert } from '../editor-model/insert';
import { parseString } from '../core/parser';
import { requestUpdate } from '../editor-mathfield/render';

export function acceptCommandSuggestion(model: ModelPrivate): void {
    model
        .getAtoms(getCommandSuggestionRange(model))
        .forEach((x: CommandAtom) => {
            x.isSuggestion = false;
        });
}

export function insertSuggestion(model: ModelPrivate, s: string): void {
    // Remove any previous suggestion
    model.deleteAtoms(getCommandSuggestionRange(model));

    const atoms = [];
    for (const c of s) {
        atoms.push(new CommandAtom(c, { isSuggestion: true }));
    }

    const cursor = model.at(model.position);
    cursor.parent.addChildrenAfter(atoms, cursor);
}

/**
 * When in command mode, insert the command in progress and leave command mode
 *
 * @param options.discard if true, the entire command is discarded and the
 * mode switched back to math
 * @param options.acceptSuggestion if true, accept the suggestion to
 * complete the command. Otherwise, only use what has been entered so far.
 */
export function complete(
    mathfield: MathfieldPrivate,
    completion: 'reject' | 'accept' | 'accept-with-suggestion',
    options?: { mode: ParseMode }
): boolean {
    hidePopover(mathfield);

    if (completion === 'reject') {
        mathfield.model.deleteAtoms(getCommandRange(mathfield.model));
        mathfield.switchMode(options?.mode ?? 'math');
        return true;
    }
    const command = getCommandString(mathfield.model, {
        withSuggestion: completion === 'accept-with-suggestion',
    });
    if (!command) return false;

    if (command === '\\(' || command === '\\)') {
        mathfield.model.deleteAtoms(getCommandRange(mathfield.model));
        insert(mathfield.model, command.slice(1), {
            mode: mathfield.mode,
        });
    } else {
        // We'll assume we want to insert in math mode
        // (commands are only available in math mode)
        mathfield.switchMode('math');
        // Interpret the input as LaTeX code
        const atoms = parseString(
            command,
            'math',
            null,
            mathfield.options.macros
        );
        if (atoms) {
            insertCommand(mathfield.model, atoms);
        } else {
            getCommandAtoms(mathfield.model).forEach((x) => {
                x.isError = true;
            });
        }
    }
    mathfield.snapshot();
    mathfield.model.announce('replacement');
    return true;
}

function updateSuggestion(mathfield: MathfieldPrivate): boolean {
    const model = mathfield.model;
    model.deleteAtoms(getCommandSuggestionRange(model));
    const command = getCommandString(model);
    const suggestions = suggest(command);
    if (suggestions.length === 0) {
        hidePopover(mathfield);
        getCommandAtoms(mathfield.model).forEach((x) => {
            x.isError = true;
        });
    } else {
        const index = mathfield.suggestionIndex % suggestions.length;
        const l = command.length - suggestions[index].match.length;
        if (l !== 0) {
            insertSuggestion(
                mathfield.model,
                suggestions[index].match.substr(l)
            );
        }
        showPopoverWithLatex(
            mathfield,
            suggestions[index].match,
            suggestions.length > 1
        );
    }
    requestUpdate(mathfield);
    return true;
}

function nextSuggestion(mathfield: MathfieldPrivate): boolean {
    mathfield.suggestionIndex += 1;
    // The modulo of the suggestionIndex is used to determine which suggestion
    // to display, so no need to worry about rolling over.
    updateSuggestion(mathfield);
    return false;
}

function previousSuggestion(mathfield: MathfieldPrivate): boolean {
    mathfield.suggestionIndex -= 1;
    if (mathfield.suggestionIndex < 0) {
        // We're rolling over
        // Get the list of suggestions, so we can know how many there are
        // Not very efficient, but simple.
        mathfield.model.deleteAtoms(getCommandSuggestionRange(mathfield.model));
        const suggestions = suggest(getCommandString(mathfield.model));
        mathfield.suggestionIndex = suggestions.length - 1;
    }
    updateSuggestion(mathfield);
    return false;
}

function insertCommand(model: ModelPrivate, atoms: Atom[]): void {
    let didChange = model.deleteAtoms(getCommandRange(model));

    if (atoms) {
        // Find any placeholders in the new atoms
        const placeholders = [];
        atoms.forEach((atom) =>
            atom.children.forEach((x) => {
                if (x.type === 'placeholder') placeholders.push(x);
            })
        );

        // Insert the new atoms
        const cursor = model.at(model.position);
        cursor.parent.addChildrenAfter(atoms, cursor);
        didChange = true;

        // Change the selection
        if (placeholders.length > 0) {
            const offset = model.offsetOf(placeholders[0]);
            console.assert(offset >= 0);
            model.setSelection(offset - 1, offset);
        } else {
            // No placeholder, move after the last new atom
            model.position = model.offsetOf(atoms[atoms.length - 1]);
        }
    }

    if (didChange) {
        // Dispatch notifications
        contentDidChange(model);
    }
}

registerCommand(
    {
        complete: complete,
        nextSuggestion: nextSuggestion,
        previousSuggestion: previousSuggestion,
    },
    { target: 'mathfield', category: 'autocomplete' }
);
