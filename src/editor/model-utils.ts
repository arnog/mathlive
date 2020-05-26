import type { ParseMode } from '../public/core';
import type { Mathfield } from '../public/mathfield';
import type { ModelPrivate } from './model-class';

import type { MacroDictionary } from '../core/definitions';
import type { Atom } from '../core/atom';

export type ModelOptions = {
    mode: ParseMode;
    macros: MacroDictionary;
    removeExtraneousParentheses: boolean;
};

export type ModelHooks = {
    announce?: (
        target: Mathfield, // @revisit: could drop this argument
        command: string, // verb
        // | 'plonk'
        // | 'replacement'
        //     | 'line'
        //     | 'move'
        //     | 'moveUp'
        //     | 'moveDown'
        //     | 'deleted'
        //     | 'deleted: numerator'
        //     | 'deleted: denominator'
        //     | 'deleted: root'
        //     | 'deleted: superscript',
        modelBefore: ModelPrivate,
        atoms: Atom[] // object of the command
    ) => void;
    moveOut?: (
        sender: ModelPrivate,
        direction: 'forward' | 'backward'
    ) => boolean;
    tabOut?: (
        sender: ModelPrivate,
        direction: 'forward' | 'backward'
    ) => boolean;
};

export function isEmptyMathlist(atoms: Atom[]): boolean {
    return (
        atoms.length === 0 || (atoms.length === 1 && atoms[0].type === 'first')
    );
}

export function removeSuggestion(model: ModelPrivate): void {
    const siblings = model.siblings();
    // Remove all `suggestion` atoms
    for (let i = siblings.length - 1; i >= 0; i--) {
        if (siblings[i].isSuggestion) {
            siblings.splice(i, 1);
        }
    }
}

/**
 * Clear the verbatim Latex property for the parent node and its parents.
 * This will cause the latex value to be re-calculated.
 */
export function invalidateVerbatimLatex(model: ModelPrivate): void {
    let depth = 1;
    let atom = model.ancestor(depth);
    while (atom) {
        atom.latex = undefined;
        depth += 1;
        atom = model.ancestor(depth);
    }
}
