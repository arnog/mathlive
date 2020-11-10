import { register } from '../editor/commands';
import type { ModelPrivate } from './model-private';
import {
    move,
    leap,
    skip,
    selectGroup,
    moveAfterParent,
    wordBoundaryOffset,
} from './selection';
import { deleteForward, deleteBackward, deleteRange } from './delete';
import { Atom, BranchName } from '../core/atom';
import { SubsupAtom } from '../core-atoms/subsup';

/**
 * Switch the cursor to the superscript and select it. If there is no subscript
 * yet, create one.
 */
export function moveToSuperscript(model: ModelPrivate): boolean {
    model.collapseSelection();
    if (superscriptDepth(model) >= model.mathfield.options.scriptDepth[1]) {
        model.announce('plonk');
        return false;
    }
    let target = model.at(model.position);

    if (target.limits !== 'limits' && target.limits !== 'auto') {
        // This atom can't have a superscript/subscript:
        // add an adjacent `msubsup` atom instead.
        if (model.at(model.position + 1)?.type !== 'msubsup') {
            target.parent.addChildAfter(
                new SubsupAtom({
                    baseType: target.type,
                    style: model.at(model.position).computedStyle,
                }),
                target
            );
        }
        target = model.at(model.position + 1);
    }
    // Ensure there is a superscript branch
    target.createBranch('superscript');
    model.setSelection(
        model.getSiblingsRange(model.offsetOf(target.superscript[0]))
    );

    return true;
}

/**
 * Switch the cursor to the subscript and select it. If there is no subscript
 * yet, create one.
 */
export function moveToSubscript(model: ModelPrivate): boolean {
    model.collapseSelection();
    if (subscriptDepth(model) >= model.mathfield.options.scriptDepth[0]) {
        model.announce('plonk');
        return false;
    }
    let target = model.at(model.position);

    if (target.limits !== 'limits' && target.limits !== 'auto') {
        // This atom can't have a superscript/subscript:
        // add an adjacent `msubsup` atom instead.
        if (model.at(model.position + 1)?.type !== 'msubsup') {
            target.parent.addChildAfter(
                new Atom('msubsup', {
                    mode: target.mode,
                    value: '\u200b',
                    style: model.at(model.position).computedStyle,
                }),
                target
            );
        }
        target = model.at(model.position + 1);
    }
    // Ensure there is a subscript branch
    target.createBranch('subscript');
    model.setSelection(
        model.getSiblingsRange(model.offsetOf(target.subscript[0]))
    );
    return true;
}

/**
 * If cursor is currently in:
 * - superscript: move to subscript, creating it if necessary
 * - subscript: move to superscript, creating it if necessary
 * - numerator: move to denominator
 * - denominator: move to numerator
 * - otherwise: move to superscript
 */
register(
    {
        moveToOpposite: (model: ModelPrivate): boolean => {
            const OPPOSITE_RELATIONS = {
                superscript: 'subscript',
                subscript: 'superscript',
                above: 'below',
                below: 'above',
            };
            const cursor = model.at(model.position);
            const parent = cursor.parent;
            if (!parent) return false;
            const relation = cursor.treeBranch;
            let oppositeRelation: BranchName;
            if (typeof relation === 'string') {
                oppositeRelation = OPPOSITE_RELATIONS[relation];
            }
            if (!oppositeRelation) {
                if (!cursor.limits) {
                    return moveToSuperscript(model);
                }
                return moveToSubscript(model);
            }

            if (!parent.branch(oppositeRelation)) {
                // Don't have children of the opposite relation yet
                // Add them
                parent.createBranch(oppositeRelation);
            }

            return model.setSelection(
                model.getBranchRange(model.offsetOf(parent), oppositeRelation)
            );
        },
        moveBeforeParent: (model: ModelPrivate): boolean => {
            const parent = model.at(model.position).parent;
            if (!parent) {
                model.announce('plonk');
                return false;
            }
            model.position = model.offsetOf(parent);
            return true;
        },
        moveAfterParent: (model: ModelPrivate): boolean =>
            moveAfterParent(model),

        moveToNextPlaceholder: (model: ModelPrivate): boolean =>
            leap(model, 'forward'),
        moveToPreviousPlaceholder: (model: ModelPrivate): boolean =>
            leap(model, 'backward'),
        moveToNextChar: (model: ModelPrivate): boolean =>
            move(model, 'forward'),
        moveToPreviousChar: (model: ModelPrivate): boolean =>
            move(model, 'backward'),
        moveUp: (model: ModelPrivate): boolean => move(model, 'upward'),
        moveDown: (model: ModelPrivate): boolean => move(model, 'downward'),
        moveToNextWord: (model: ModelPrivate): boolean =>
            skip(model, 'forward'),
        moveToPreviousWord: (model: ModelPrivate): boolean =>
            skip(model, 'backward'),
        moveToGroupStart: (model: ModelPrivate): boolean => {
            model.position = model.offsetOf(
                model.at(model.position).firstSibling
            );
            return true;
        },
        moveToGroupEnd: (model: ModelPrivate): boolean => {
            model.position = model.offsetOf(
                model.at(model.position).lastSibling
            );
            return true;
        },
        moveToMathFieldStart: (model: ModelPrivate): boolean => {
            model.position = 0;
            return true;
        },
        moveToMathFieldEnd: (model: ModelPrivate): boolean => {
            model.position = model.lastOffset;
            return true;
        },
        moveToSuperscript: (model: ModelPrivate): boolean =>
            moveToSuperscript(model),
        moveToSubscript: (model: ModelPrivate): boolean =>
            moveToSubscript(model),
    },
    { target: 'model', category: 'selection-anchor' }
);

register(
    {
        selectGroup: (model: ModelPrivate): boolean => selectGroup(model),

        selectAll: (model: ModelPrivate): boolean =>
            model.setSelection(0, model.lastOffset),
        extendSelectionForward: (model: ModelPrivate): boolean =>
            model.extendSelection('forward'),
        extendSelectionBackward: (model: ModelPrivate): boolean =>
            model.extendSelection('backward'),
        extendToNextWord: (model: ModelPrivate): boolean =>
            skip(model, 'forward', { extend: true }),
        extendToPreviousWord: (model: ModelPrivate): boolean =>
            skip(model, 'backward', { extend: true }),
        extendSelectionUpward: (model: ModelPrivate): boolean =>
            move(model, 'upward', { extend: true }),
        extendSelectionDownward: (model: ModelPrivate): boolean =>
            move(model, 'downward', { extend: true }),
        /**
         * Extend the selection until the next boundary is reached. A boundary
         * is defined by an atom of a different type (mbin, mord, etc...)
         * than the current focus. For example, in "1234+x=y", if the focus is between
         * "1" and "2", invoking `extendToNextBoundary_` would extend the selection
         * to "234".
         */
        extendToNextBoundary: (model: ModelPrivate): boolean =>
            skip(model, 'forward', { extend: true }),
        /**
         * Extend the selection until the previous boundary is reached. A boundary
         * is defined by an atom of a different type (mbin, mord, etc...)
         * than the current focus. For example, in "1+23456", if the focus is between
         * "5" and "6", invoking `extendToPreviousBoundary` would extend the selection
         * to "2345".
         */
        extendToPreviousBoundary: (model: ModelPrivate): boolean =>
            skip(model, 'backward', { extend: true }),
        extendToGroupStart: (model: ModelPrivate): boolean =>
            model.setSelection(
                model.anchor,
                model.offsetOf(model.at(model.position).firstSibling)
            ),
        extendToGroupEnd: (model: ModelPrivate): boolean =>
            model.setSelection(
                model.anchor,
                model.offsetOf(model.at(model.position).lastSibling)
            ),
        extendToMathFieldStart: (model: ModelPrivate): boolean =>
            model.setSelection(model.anchor, 0),
        extendToMathFieldEnd: (model: ModelPrivate): boolean =>
            model.setSelection(model.anchor, model.lastOffset),
    },
    { target: 'model', category: 'selection-extend' }
);

function superscriptDepth(model: ModelPrivate): number {
    let result = 0;
    let atom = model.at(model.position);
    let wasSuperscript = false;
    while (atom) {
        if (
            !atom.hasEmptyBranch('superscript') ||
            !atom.hasEmptyBranch('subscript')
        ) {
            result += 1;
        }
        if (!atom.hasEmptyBranch('superscript')) {
            wasSuperscript = true;
        } else if (!atom.hasEmptyBranch('subscript')) {
            wasSuperscript = false;
        }
        atom = atom.parent;
    }
    return wasSuperscript ? result : 0;
}
function subscriptDepth(model: ModelPrivate): number {
    let result = 0;
    let atom = model.at(model.position);
    let wasSubscript = false;
    while (atom) {
        if (
            !atom.hasEmptyBranch('superscript') ||
            !atom.hasEmptyBranch('subscript')
        ) {
            result += 1;
        }
        if (!atom.hasEmptyBranch('superscript')) {
            wasSubscript = false;
        } else if (!atom.hasEmptyBranch('subscript')) {
            wasSubscript = true;
        }
        atom = atom.parent;
    }
    return wasSubscript ? result : 0;
}

register(
    {
        deleteAll: (model: ModelPrivate): boolean => {
            return deleteRange(model, [0, -1]);
        },
        deleteForward: (model: ModelPrivate): boolean => deleteForward(model),
        deleteBackward: (model: ModelPrivate): boolean => deleteBackward(model),
        deleteNextWord: (model: ModelPrivate): boolean =>
            deleteRange(model, [
                model.anchor,
                wordBoundaryOffset(model, model.position, 'forward'),
            ]),
        deletePreviousWord: (model: ModelPrivate): boolean =>
            deleteRange(model, [
                model.anchor,
                wordBoundaryOffset(model, model.position, 'backward'),
            ]),
        deleteToGroupStart: (model: ModelPrivate): boolean =>
            deleteRange(model, [
                model.anchor,
                model.offsetOf(model.at(model.position).firstSibling),
            ]),
        deleteToGroupEnd: (model: ModelPrivate): boolean =>
            deleteRange(model, [
                model.anchor,
                model.offsetOf(model.at(model.position).lastSibling),
            ]),
        deleteToMathFieldStart: (model: ModelPrivate): boolean =>
            deleteRange(model, [model.anchor, 0]),
        deleteToMathFieldEnd: (model: ModelPrivate): boolean =>
            deleteRange(model, [model.anchor, -1]),
    },
    { target: 'model', category: 'delete' }
);
