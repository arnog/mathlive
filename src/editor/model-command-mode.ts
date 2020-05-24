import { isArray } from '../common/types';

import type { Atom } from '../core/atom';

import type { ModelPrivate } from './model-class';
import { contentDidChange, contentWillChange } from './model-listeners';
import { arrayCellCount, arrayCell } from './model-array-utils';
import {
    getCommandOffsets,
    setSelectionExtent,
    setSelection,
    leap,
} from './model-selection';

export function extractCommandStringAroundInsertionPoint(
    model: ModelPrivate,
    beforeInsertionPointOnly = false
): string {
    let result = '';

    const command = getCommandOffsets(model);
    if (command) {
        const end = beforeInsertionPointOnly
            ? model.anchorOffset() + 1
            : command.end;
        const siblings = model.siblings();
        for (let i = command.start; i < end; i++) {
            // All these atoms are 'command' atom with a body that's
            // a single character
            result += siblings[i].body || '';
        }
    }
    return result;
}

/**
 * @param value - If true, decorate the command string around the
 * insertion point with an error indicator (red dotted underline). If false,
 * remove it.
 */
export function decorateCommandStringAroundInsertionPoint(
    model: ModelPrivate,
    hasError: boolean
): void {
    const command = getCommandOffsets(model);
    if (command) {
        const siblings = model.siblings();
        for (let i = command.start; i < command.end; i++) {
            siblings[i].error = hasError;
        }
    }
}

export function commitCommandStringBeforeInsertionPoint(
    model: ModelPrivate
): void {
    const command = getCommandOffsets(model);
    if (command) {
        const siblings = model.siblings();
        const anchorOffset = model.anchorOffset() + 1;
        for (let i = command.start; i < anchorOffset; i++) {
            if (siblings[i]) {
                siblings[i].suggestion = false;
            }
        }
    }
}

export function spliceCommandStringAroundInsertionPoint(
    model: ModelPrivate,
    mathlist: Atom[]
): void {
    const command = getCommandOffsets(model);
    if (command) {
        // Dispatch notifications
        contentWillChange(model);

        if (!mathlist) {
            model.siblings().splice(command.start, command.end - command.start);
            setSelection(model, command.start - 1, 0);
        } else {
            // Array.prototype.splice.apply(
            //     model.siblings(),
            //     [command.start, command.end - command.start].concat(mathlist)
            // );
            // @revisit
            model
                .siblings()
                .splice(
                    command.start,
                    command.end - command.start,
                    ...mathlist
                );
            let newPlaceholders = [];
            for (const atom of mathlist) {
                newPlaceholders = newPlaceholders.concat(
                    atom.filter((atom) => atom.type === 'placeholder')
                );
            }
            setSelectionExtent(model, 0);

            // Set the anchor offset to a reasonable value that can be used by
            // leap(). In particular, the current offset value may be invalid
            // if the length of the mathlist is shorter than the name of the command
            model.path[model.path.length - 1].offset = command.start - 1;

            if (newPlaceholders.length === 0 || !leap(model, +1, false)) {
                setSelection(model, command.start + mathlist.length - 1);
            }
        }

        // Dispatch notifications
        contentDidChange(model);
    }
}

function removeCommandStringFromAtom(atom: Atom | Atom[]): void {
    if (!atom) return;
    if (isArray(atom)) {
        for (let i = atom.length - 1; i >= 0; i--) {
            if (atom[i].type === 'command') {
                atom.splice(i, 1);
                // i += 1;
            } else {
                removeCommandStringFromAtom(atom[i]);
            }
        }
        return;
    }

    removeCommandStringFromAtom(atom.body as Atom[]);
    removeCommandStringFromAtom(atom.superscript);
    removeCommandStringFromAtom(atom.subscript);
    removeCommandStringFromAtom(atom.underscript);
    removeCommandStringFromAtom(atom.overscript);
    removeCommandStringFromAtom(atom.numer);
    removeCommandStringFromAtom(atom.denom);
    removeCommandStringFromAtom(atom.index);

    if (atom.array) {
        for (let j = arrayCellCount(atom.array); j >= 0; j--) {
            removeCommandStringFromAtom(arrayCell(atom.array, j));
        }
    }
}

export function removeCommandString(model: ModelPrivate): void {
    contentWillChange(model);
    const contentWasChanging = model.suppressChangeNotifications;
    model.suppressChangeNotifications = true;

    removeCommandStringFromAtom(model.root.body as Atom[]);

    model.suppressChangeNotifications = contentWasChanging;
    contentDidChange(model);
}
