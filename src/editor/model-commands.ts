import { register } from './commands';
import type { ModelInterface } from './model-utils';
import {
    setSelection,
    move,
    leap,
    skip,
    jumpToMathFieldBoundary,
    up,
    down,
    collapseSelectionForward,
    getAnchor,
    getAnchorStyle,
    selectGroup,
    extend,
    setSelectionExtent,
    selectAll,
    moveAfterParent,
} from './model-selection';
import { deleteChar } from './model-delete';
import { Atom } from '../core/atom';

/**
 * Switch the cursor to the superscript and select it. If there is no subscript
 * yet, create one.
 */
export function moveToSuperscript(model: ModelInterface): boolean {
    collapseSelectionForward(model);
    if (getAnchor(model).superscript) {
        if (getAnchor(model).subscript) {
            getAnchor(model).superscript = [new Atom('', 'first')];
        } else {
            const sibling = model.sibling(1);
            if (sibling?.superscript) {
                model.path[model.path.length - 1].offset += 1;
                //            setSelection(model, model.anchorOffset() + 1);
            } else if (sibling?.subscript) {
                model.path[model.path.length - 1].offset += 1;
                //            setSelection(model, model.anchorOffset() + 1);
                getAnchor(model).superscript = [new Atom('', 'first')];
            } else {
                if (getAnchor(model).limits !== 'limits') {
                    model
                        .siblings()
                        .splice(
                            model.anchorOffset() + 1,
                            0,
                            new Atom(
                                model.parent().mode,
                                'msubsup',
                                '\u200b',
                                getAnchorStyle(model)
                            )
                        );
                    model.path[model.path.length - 1].offset += 1;
                    //            setSelection(model, model.anchorOffset() + 1);
                }
                getAnchor(model).superscript = [new Atom('', 'first')];
            }
        }
        return true;
    }
    model.path.push({ relation: 'superscript', offset: 0 });
    selectGroup(model);
    return true;
}

/**
 * Switch the cursor to the subscript and select it. If there is no subscript
 * yet, create one.
 */
export function moveToSubscript(model: ModelInterface): boolean {
    collapseSelectionForward(model);
    if (!getAnchor(model).subscript) {
        if (getAnchor(model).superscript) {
            getAnchor(model).subscript = [new Atom('', 'first')];
        } else {
            const sibling = model.sibling(1);
            if (sibling?.subscript) {
                model.path[model.path.length - 1].offset += 1;
                // setSelection(model, model.anchorOffset() + 1);
            } else if (sibling?.superscript) {
                model.path[model.path.length - 1].offset += 1;
                // setSelection(model, model.anchorOffset() + 1);
                getAnchor(model).subscript = [new Atom('', 'first')];
            } else {
                if (getAnchor(model).limits !== 'limits') {
                    model
                        .siblings()
                        .splice(
                            model.anchorOffset() + 1,
                            0,
                            new Atom(
                                model.parent().mode,
                                'msubsup',
                                '\u200b',
                                getAnchorStyle(model)
                            )
                        );
                    model.path[model.path.length - 1].offset += 1;
                    // setSelection(model, model.anchorOffset() + 1);
                }
                getAnchor(model).subscript = [new Atom('', 'first')];
            }
        }
    }
    model.path.push({ relation: 'subscript', offset: 0 });
    selectGroup(model);
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
        moveToOpposite: (model: ModelInterface): boolean => {
            const OPPOSITE_RELATIONS = {
                superscript: 'subscript',
                subscript: 'superscript',
                denom: 'numer',
                numer: 'denom',
            };
            const oppositeRelation = OPPOSITE_RELATIONS[model.relation()];
            if (!oppositeRelation) {
                moveToSuperscript(model);
            }

            if (!model.parent()[oppositeRelation]) {
                // Don't have children of the opposite relation yet
                // Add them
                model.parent()[oppositeRelation] = [new Atom('', 'first')];
            }

            setSelection(model, 0, 'end', oppositeRelation);
            return true;
        },
        moveBeforeParent: (model: ModelInterface): boolean => {
            if (model.path.length > 1) {
                model.path.pop();
                setSelection(model, model.anchorOffset() - 1);
                return true;
            }
            model.announce('plonk');
            return false;
        },
        moveAfterParent: (model: ModelInterface): boolean =>
            moveAfterParent(model),

        moveToNextPlaceholder: (model: ModelInterface): boolean =>
            leap(model, +1),
        moveToPreviousPlaceholder: (model: ModelInterface): boolean =>
            leap(model, -1),
        moveToNextChar: (model: ModelInterface): boolean => move(model, +1),
        moveToPreviousChar: (model: ModelInterface): boolean => move(model, -1),
        moveUp: (model: ModelInterface): boolean => up(model),
        moveDown: (model: ModelInterface): boolean => down(model),
        moveToNextWord: (model: ModelInterface): boolean => skip(model, +1),
        moveToPreviousWord: (model: ModelInterface): boolean => skip(model, -1),
        moveToGroupStart: (model: ModelInterface): boolean =>
            setSelection(model, 0),
        moveToGroupEnd: (model: ModelInterface): boolean =>
            setSelection(model, -1),
        moveToMathFieldStart: (model: ModelInterface): boolean =>
            jumpToMathFieldBoundary(model, -1),
        moveToMathFieldEnd: (model: ModelInterface): boolean =>
            jumpToMathFieldBoundary(model, +1),
        moveToSuperscript: (model: ModelInterface): boolean =>
            moveToSuperscript(model),
    },
    { target: 'model', category: 'selection-anchor' }
);

register(
    {
        selectGroup: (model: ModelInterface): boolean => selectGroup(model),

        selectAll: (model: ModelInterface): boolean => selectAll(model),
        extendToNextChar: (model: ModelInterface): boolean => extend(model, +1),
        extendToPreviousChar: (model: ModelInterface): boolean =>
            extend(model, -1),
        extendToNextWord: (model: ModelInterface): boolean =>
            skip(model, +1, { extend: true }),
        extendToPreviousWord: (model: ModelInterface): boolean =>
            skip(model, -1, { extend: true }),
        extendUp: (model: ModelInterface): boolean =>
            up(model, { extend: true }),
        extendDown: (model: ModelInterface): boolean =>
            down(model, { extend: true }),
        /**
         * Extend the selection until the next boundary is reached. A boundary
         * is defined by an atom of a different type (mbin, mord, etc...)
         * than the current focus. For example, in "1234+x=y", if the focus is between
         * "1" and "2", invoking `extendToNextBoundary_` would extend the selection
         * to "234".
         */
        extendToNextBoundary: (model: ModelInterface): boolean =>
            skip(model, +1, { extend: true }),

        /**
         * Extend the selection until the previous boundary is reached. A boundary
         * is defined by an atom of a different type (mbin, mord, etc...)
         * than the current focus. For example, in "1+23456", if the focus is between
         * "5" and "6", invoking `extendToPreviousBoundary` would extend the selection
         * to "2345".
         */
        extendToPreviousBoundary: (model: ModelInterface): boolean =>
            skip(model, -1, { extend: true }),
        extendToGroupStart: (model: ModelInterface): boolean =>
            setSelectionExtent(model, -model.anchorOffset()),
        extendToGroupEnd: (model: ModelInterface): boolean =>
            setSelectionExtent(
                model,
                model.siblings().length - model.anchorOffset()
            ),
        extendToMathFieldStart: (model: ModelInterface): boolean =>
            jumpToMathFieldBoundary(model, -1, { extend: true }),
        extendToMathFieldEnd: (model: ModelInterface): boolean =>
            jumpToMathFieldBoundary(model, +1, { extend: true }),
    },
    { target: 'model', category: 'selection-extend' }
);

register(
    {
        deleteAll: (model: ModelInterface): boolean => {
            selectAll(model);
            return deleteChar(model);
        },
        deleteNextChar: (model: ModelInterface): boolean =>
            deleteChar(model, +1),
        deletePreviousChar: (model: ModelInterface): boolean =>
            deleteChar(model, -1),
        deleteNextWord: (model: ModelInterface): boolean => {
            skip(model, +1, { extend: true });
            return deleteChar(model);
        },
        deletePreviousWord: (model: ModelInterface): boolean => {
            skip(model, -1, { extend: true });
            return deleteChar(model);
        },
        deleteToGroupStart: (model: ModelInterface): boolean => {
            setSelectionExtent(model, -model.anchorOffset());
            return deleteChar(model);
        },
        deleteToGroupEnd: (model: ModelInterface): boolean => {
            jumpToMathFieldBoundary(model, -1, { extend: true });
            return deleteChar(model);
        },
        deleteToMathFieldEnd: (model: ModelInterface): boolean => {
            jumpToMathFieldBoundary(model, +1, { extend: true });
            return deleteChar(model);
        },
    },
    { target: 'model', category: 'delete' }
);
