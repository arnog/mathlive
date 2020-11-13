import { ParseMode } from '../public/core';

import type { Atom } from '../core/atom';
import { parseLatex } from '../core/parser';
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
import { insert } from '../editor-model/insert';

import { hidePopover, showPopoverWithLatex } from '../editor/popover';

import type { MathfieldPrivate } from './mathfield-private';
import { requestUpdate } from './render';

export function updateAutocomplete(
    mathfield: MathfieldPrivate,
    options?: { atIndex?: number }
): void {
    const model = mathfield.model;
    // Remove any error indicator and any suggestions
    const atoms = getCommandAtoms(model);
    atoms.forEach((x) => {
        if (x.isSuggestion) {
            x.parent.removeChild(x);
        } else {
            x.isError = false;
        }
    });

    if (!model.selectionIsCollapsed) {
        hidePopover(mathfield);
        return;
    }

    // The current command is the sequence of around the insertion point
    // that ends on the left with a '\\' and on the right with a non-command
    // character.
    const command = [];
    let atom = model.at(model.position);
    while (
        atom &&
        atom instanceof CommandAtom &&
        /[a-zA-Z*]$/.test(atom.value)
    ) {
        command.unshift(atom);
        atom = atom.leftSibling;
    }
    if (atom && atom instanceof CommandAtom && atom.value === '\\') {
        // We found the beginning of a command, include the atoms after the
        // insertion point
        command.unshift(atom);
        atom = model.at(model.position).rightSibling;
        while (
            atom &&
            atom instanceof CommandAtom &&
            /[a-zA-Z*]$/.test(atom.value)
        ) {
            command.push(atom);
            atom = atom.rightSibling;
        }
    }

    const commandString = command.map((x) => x.value).join('');
    const suggestions = commandString ? suggest(commandString) : [];

    if (suggestions.length === 0) {
        if (/^\\[a-zA-Z\\*]+$/.test(commandString)) {
            // This looks like a command name, but not a known one
            command.forEach((x) => {
                x.isError = true;
            });
        }
        hidePopover(mathfield);
        return;
    }

    mathfield.suggestionIndex = options?.atIndex ?? 0;
    if (mathfield.suggestionIndex < 0) {
        mathfield.suggestionIndex = suggestions.length - 1;
    }

    const suggestion =
        suggestions[mathfield.suggestionIndex % suggestions.length].match;
    if (suggestion !== commandString) {
        const lastAtom = command[command.length - 1];
        lastAtom.parent.addChildrenAfter(
            Array.from(
                suggestion.substr(commandString.length - suggestion.length)
            ).map((x) => new CommandAtom(x, { isSuggestion: true })),
            lastAtom
        );
        requestUpdate(mathfield);
    }
    showPopoverWithLatex(mathfield, suggestion, suggestions.length > 1);
}

export function acceptCommandSuggestion(model: ModelPrivate): void {
    model
        .getAtoms(getCommandSuggestionRange(model, { before: model.position }))
        .forEach((x: CommandAtom) => {
            x.isSuggestion = false;
        });
}

/**
 * When in command mode, insert the command in progress and leave command mode
 *
 */
export function complete(
    mathfield: MathfieldPrivate,
    completion: 'reject' | 'accept' | 'accept-suggestion' = 'accept',
    options?: { mode?: ParseMode; selectItem?: boolean }
): boolean {
    hidePopover(mathfield);

    if (completion === 'reject') {
        mathfield.model.deleteAtoms(getCommandRange(mathfield.model));
        mathfield.switchMode(options?.mode ?? 'math');
        return true;
    }
    if (completion === 'accept-suggestion') {
        acceptCommandSuggestion(mathfield.model);
    }
    const command = getCommandString(mathfield.model);
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
        const atoms = parseLatex(
            command,
            'math',
            null,
            mathfield.options.macros
        );
        if (atoms) {
            insertCommand(mathfield.model, atoms, {
                selectItem: options?.selectItem ?? false,
            });
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

function insertCommand(
    model: ModelPrivate,
    atoms: Atom[],
    options: { selectItem: boolean }
): void {
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
            // No placeholder.
            if (options.selectItem) {
                model.setSelection(
                    model.offsetOf(atoms[0]) - 1,
                    model.offsetOf(atoms[atoms.length - 1])
                );
            } else {
                // Move after the last new atom
                model.position = model.offsetOf(atoms[atoms.length - 1]);
            }
        }
    }

    if (didChange) {
        // Dispatch notifications
        contentDidChange(model);
    }
}
