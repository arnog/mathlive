import {
    ModelInterface,
    removeSuggestion,
    invalidateVerbatimLatex,
} from './model-utils';
import {
    selectionWillChange,
    selectionDidChange,
    contentDidChange,
    contentWillChange,
} from './model-listeners';
import { setSelection, move, selectionIsCollapsed } from './model-selection';
import {
    arrayFirstCellByRow,
    arrayColRow,
    arrayAdjustRow,
    arrayIndex,
    arrayJoinColumns,
    arrayRemoveRow,
    arrayColumnCellCount,
    arrayRemoveColumn,
    arrayJoinRows,
} from './model-array';

/**
 * @param dir If the selection is not collapsed, and dir is
 * negative, delete backwards, starting with the anchor atom.
 * That is, delete(-1) will delete only the anchor atom.
 * If dir = 0, delete only if the selection is not collapsed
 */
function delete_(model: ModelInterface, dir: 0 | -1 | 1 = 0) {
    // Dispatch notifications
    contentWillChange(model);
    selectionWillChange(model);
    const contentWasChanging = model.suppressChangeNotifications;
    model.suppressChangeNotifications = true;

    dir = dir < 0 ? -1 : dir > 0 ? +1 : dir;

    removeSuggestion(model);

    if (model.parent().array) {
        if (dir < 0 && model.startOffset() === 0) {
            const array = model.parent().array;
            if (arrayFirstCellByRow(array) === model.relation()) {
                // (1) First cell:
                // delete array, replace it with linearized content
                const atoms = arrayJoinRows(array);
                model.path.pop();
                model.siblings().splice(model.anchorOffset(), 1, ...atoms);
                setSelection(model, model.anchorOffset() - 1, atoms.length);
            } else {
                const colRow = arrayColRow(array, model.relation());
                if (colRow.col === 0) {
                    // (2) First (non-empty) column (but not first row):

                    // Move to the end of the last cell of the previous row
                    const dest = arrayAdjustRow(array, colRow, -1);
                    dest.col = array[dest.row].length - 1;

                    model.path[model.path.length - 1].relation =
                        'cell' + arrayIndex(array, dest);
                    const destLength = array[dest.row][dest.col].length;

                    // (2.1) Linearize it and merge it with last cell of previous row
                    // (note that atoms could be empty if there are no non-empty
                    // cells left in the row)
                    const atoms = arrayJoinColumns(array[colRow.row]);
                    array[dest.row][dest.col] = array[dest.row][
                        dest.col
                    ].concat(atoms);
                    setSelection(model, destLength - 1, atoms.length);

                    // (2.2) Remove row
                    arrayRemoveRow(array, colRow.row);
                } else {
                    // (3) Non-first column
                    // (3.1) If column is empty, remove it
                    if (arrayColumnCellCount(array, colRow.col) === 0) {
                        arrayRemoveColumn(array, colRow.col);
                        colRow.col -= 1;
                        model.path[model.path.length - 1].relation =
                            'cell' + arrayIndex(array, colRow);
                        const destCell = array[colRow.row][colRow.col];
                        setSelection(model, destCell.length - 1, 0);
                    }
                    // (3.2) merge cell with cell in previous column
                }
            }

            // Dispatch notifications
            model.suppressChangeNotifications = contentWasChanging;
            selectionDidChange(model);
            contentDidChange(model);
            return;
        }
    }

    const siblings = model.siblings();

    if (!selectionIsCollapsed(model)) {
        // There is a selection extent. Delete all the atoms within it.
        const first = model.startOffset() + 1;
        const last = model.endOffset() + 1;

        model.announce('deleted', null, siblings.slice(first, last));
        siblings.splice(first, last - first);

        // Adjust the anchor
        setSelection(model, first - 1);
    } else {
        const anchorOffset = model.anchorOffset();
        if (dir < 0) {
            if (anchorOffset !== 0) {
                // We're not at the begining of the sibling list.
                // If the previous sibling is a compound (fractions, group),
                // just move into it, otherwise delete it
                const sibling = model.sibling(0);
                if (sibling.type === 'leftright') {
                    sibling.rightDelim = '?';
                    move(model, -1);
                } else if (
                    !sibling.captureSelection &&
                    /^(group|array|genfrac|surd|leftright|overlap|overunder|box|mathstyle|sizing)$/.test(
                        sibling.type
                    )
                ) {
                    move(model, -1);
                } else {
                    model.announce(
                        'deleted',
                        null,
                        siblings.slice(anchorOffset, anchorOffset + 1)
                    );
                    siblings.splice(anchorOffset, 1);
                    setSelection(model, anchorOffset - 1);
                }
            } else {
                // We're at the beginning of the sibling list.
                // Delete what comes before
                const relation = model.relation();
                if (relation === 'superscript' || relation === 'subscript') {
                    const supsub = model
                        .parent()
                        [relation].filter(
                            (atom) =>
                                atom.type !== 'placeholder' &&
                                atom.type !== 'first'
                        );
                    model.parent()[relation] = null;
                    model.path.pop();
                    // Array.prototype.splice.apply(
                    //     model.siblings(),
                    //     [model.anchorOffset(), 0].concat(supsub)
                    // );
                    // @revisit
                    model.siblings().splice(model.anchorOffset(), 0, ...supsub);
                    setSelection(model, model.anchorOffset() - 1);
                    model.announce('deleted: ' + relation);
                } else if (relation === 'denom') {
                    // Fraction denominator
                    const numer = model
                        .parent()
                        .numer.filter(
                            (atom) =>
                                atom.type !== 'placeholder' &&
                                atom.type !== 'first'
                        );
                    const denom = model
                        .parent()
                        .denom.filter(
                            (atom) =>
                                atom.type !== 'placeholder' &&
                                atom.type !== 'first'
                        );
                    model.path.pop();
                    // Array.prototype.splice.apply(
                    //     model.siblings(),
                    //     [model.anchorOffset(), 1].concat(denom)
                    // );
                    // @revisit
                    model.siblings().splice(model.anchorOffset(), 1, ...denom);
                    // Array.prototype.splice.apply(
                    //     model.siblings(),
                    //     [model.anchorOffset(), 0].concat(numer)
                    // );
                    // @revisit
                    model.siblings().splice(model.anchorOffset(), 0, ...numer);
                    setSelection(
                        model,
                        model.anchorOffset() + numer.length - 1
                    );
                    model.announce('deleted: denominator');
                } else if (relation === 'body') {
                    const body = model
                        .siblings()
                        .filter((atom) => atom.type !== 'placeholder');
                    if (model.path.length > 1) {
                        body.shift(); // Remove the 'first' atom
                        model.path.pop();
                        // Array.prototype.splice.apply(
                        //     model.siblings(),
                        //     [model.anchorOffset(), 1].concat(body)
                        // );
                        // @revisit
                        model
                            .siblings()
                            .splice(model.anchorOffset(), 1, ...body);
                        setSelection(model, model.anchorOffset() - 1);
                        model.announce('deleted: root');
                    }
                } else {
                    move(model, -1);
                    deleteChar(model, -1);
                }
            }
        } else if (dir > 0) {
            if (anchorOffset !== siblings.length - 1) {
                if (
                    /^(group|array|genfrac|surd|leftright|overlap|overunder|box|mathstyle|sizing)$/.test(
                        model.sibling(1).type
                    )
                ) {
                    move(model, +1);
                } else {
                    model.announce(
                        'deleted',
                        null,
                        siblings.slice(anchorOffset + 1, anchorOffset + 2)
                    );
                    siblings.splice(anchorOffset + 1, 1);
                }
            } else {
                // We're at the end of the sibling list, delete what comes next
                const relation = model.relation();
                if (relation === 'numer') {
                    const numer = model
                        .parent()
                        .numer.filter(
                            (atom) =>
                                atom.type !== 'placeholder' &&
                                atom.type !== 'first'
                        );
                    const denom = model
                        .parent()
                        .denom.filter(
                            (atom) =>
                                atom.type !== 'placeholder' &&
                                atom.type !== 'first'
                        );
                    model.path.pop();
                    // Array.prototype.splice.apply(
                    //     model.siblings(),
                    //     [model.anchorOffset(), 1].concat(denom)
                    // );
                    // Array.prototype.splice.apply(
                    //     model.siblings(),
                    //     [model.anchorOffset(), 0].concat(numer)
                    // );
                    // @revisit
                    model.siblings().splice(model.anchorOffset(), 1, ...denom);
                    model.siblings().splice(model.anchorOffset(), 0, ...numer);
                    setSelection(
                        model,
                        model.anchorOffset() + numer.length - 1
                    );
                    model.announce('deleted: numerator');
                } else {
                    move(model, 1);
                    deleteChar(model, -1);
                }
            }
        }
    }

    // Something has been deleted and the parent latex is no longer valid
    invalidateVerbatimLatex(model);

    // Dispatch notifications
    model.suppressChangeNotifications = contentWasChanging;
    selectionDidChange(model);
    contentDidChange(model);
}

/**
 * Delete sibling atoms
 */
export function deleteAtoms(model: ModelInterface, count: number) {
    if (count > 0) {
        model.siblings().splice(model.anchorOffset() + 1, count);
    } else {
        model.siblings().splice(model.anchorOffset() + count + 1, -count);
        setSelection(model, model.anchorOffset() + count);
    }
}

/**
 * Delete the selection, or multiple characters
 */
export function deleteChar(model: ModelInterface, count = 0): boolean {
    if (count === 0) {
        delete_(model, 0);
    } else if (count > 0) {
        while (count > 0) {
            delete_(model, +1);
            count--;
        }
    } else {
        while (count < 0) {
            delete_(model, -1);
            count++;
        }
    }
    return true;
}
