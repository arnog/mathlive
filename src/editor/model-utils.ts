import type { ParseMode } from '../public/core';
import type { Mathfield, Range } from '../public/mathfield';
import type { ModelPrivate } from './model-class';

import type { MacroDictionary } from '../core/definitions';
import type { Atom } from '../core/atom';
import { PositionIterator } from './model-iterator';

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
        direction: 'forward' | 'backward' | 'upward' | 'downward'
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

/**
 * Ensure that the range is valid and canonical, i.e.
 * - start <= end
 * - collapsed = start === end
 * - start >= 0, end >=0
 */
export function normalizeRange(iter: PositionIterator, range: Range): Range {
    const result: Range = { ...range };

    const lastPosition = iter.lastPosition;

    // 1. Normalize the start
    if (result.start < 0) {
        result.start = Math.max(0, lastPosition + result.start + 1);
    } else if (isNaN(result.start)) {
        result.start = 0;
    } else {
        result.start = Math.min(result.start, lastPosition);
    }

    // 2. Normalize the end
    if (result.end < 0) {
        result.end = Math.max(0, lastPosition + result.end + 1);
    } else if (isNaN(result.end)) {
        result.end = result.start;
    } else {
        result.end = Math.min(result.end, lastPosition);
    }
    // 3. Normalize the direction
    if (result.start < result.end) {
        result.direction = 'forward';
    } else {
        [result.start, result.end] = [result.end, result.start];
        result.direction = 'backward';
    }
    // 4. Normalize `collapsed`
    result.collapsed = result.start === result.end;
    if (result.collapsed) {
        result.direction = 'none';
    }
    // 5. Normalize the depth
    if (iter.positions[result.start]) {
        result.depth = iter.positions[result.start].depth - 1;
    }
    return result;
}
