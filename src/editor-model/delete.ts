import { LeftRightAtom } from '../core-atoms/leftright';
import { OperatorAtom } from '../core-atoms/operator';
import { Atom, Branch } from '../core/atom';
import type { Range } from '../public/mathfield';
import { ModelPrivate } from './model-private';
import { range } from './selection-utils';
// import {
//     arrayFirstCellByRow,
//     arrayColRow,
//     arrayAdjustRow,
//     arrayIndex,
//     arrayJoinColumns,
//     arrayRemoveRow,
//     arrayColumnCellCount,
//     arrayRemoveColumn,
//     arrayJoinRows,
// } from './model-array';

// function deleteFirstSiblingInArray(model: ModelPrivate): boolean {
//     const contentWasChanging = model.suppressChangeNotifications;
//     model.suppressChangeNotifications = true;
//     const array = model.parent.array;
//     if (arrayFirstCellByRow(array) === model.relation) {
//         // (1) First cell:
//         // delete array, replace it with linearized content
//         const atoms = arrayJoinRows(array);
//         model.path.pop();
//         model.siblings().splice(model.anchorOffset(), 1, ...atoms);
//         model._iter = null;
//         setSelectionOffset(model, model.anchorOffset() - 1, atoms.length);
//     } else {
//         const colRow = arrayColRow(array, model.relation);
//         if (colRow.col === 0) {
//             // (2) First (non-empty) column (but not first row):

//             // Move to the end of the last cell of the previous row
//             const dest = arrayAdjustRow(array, colRow, -1);
//             dest.col = array[dest.row].length - 1;

//             model.path[model.path.length - 1].relation = ('cell' +
//                 arrayIndex(array, dest)) as Relation;
//             const destLength = array[dest.row][dest.col].length;

//             // (2.1) Linearize it and merge it with last cell of previous row
//             // (note that atoms could be empty if there are no non-empty
//             // cells left in the row)
//             const atoms = arrayJoinColumns(array[colRow.row]);
//             array[dest.row][dest.col] = array[dest.row][dest.col].concat(atoms);
//             setSelectionOffset(model, destLength - 1, atoms.length);

//             // (2.2) Remove row
//             arrayRemoveRow(array, colRow.row);
//         } else {
//             // (3) Non-first column
//             // (3.1) If column is empty, remove it
//             if (arrayColumnCellCount(array, colRow.col) === 0) {
//                 arrayRemoveColumn(array, colRow.col);
//                 colRow.col -= 1;
//                 model.path[model.path.length - 1].relation = ('cell' +
//                     arrayIndex(array, colRow)) as Relation;
//                 const destCell = array[colRow.row][colRow.col];
//                 setSelectionOffset(model, destCell.length - 1, 0);
//             }
//             // (3.2) merge cell with cell in previous column
//         }
//     }

//     // Dispatch notifications
//     model.suppressChangeNotifications = contentWasChanging;
//     selectionDidChange(model);
//     contentDidChange(model);
//     return true;
// }

/**
 * Handle special cases when deleting an atom as per the table below
 * - deleting an empty numerator: demote fraction
 * - forward-deleting a square root: demote it
 * - delete last atom inside a square root: delete the square root
 * - delete last atom in a subsup: delete the subsup
 * - etc...
 *
 *
 * @param branch: if deleting inside an atom, the branch being delete
 * (always the first or last atom of the branch). If undefined, the atom
 * itself is about to be deleted.
 *
 * @return true if handled
 */
function onDelete(
    model: ModelPrivate,
    direction: 'forward' | 'backward',
    atom: Atom,
    branch?: Branch
): boolean {
    const parent = atom.parent;
    if (atom instanceof LeftRightAtom) {
        //
        // 'leftright': \left\right
        //
        const atStart =
            (!branch && direction === 'forward') ||
            (branch === 'body' && direction === 'backward');
        const pos = atStart
            ? model.offsetOf(atom) - 1
            : model.offsetOf(atom.lastChild);
        if (!atStart && atom.leftDelim !== '?' && atom.leftDelim !== '.') {
            // Insert open fence
            parent.addChildBefore(
                new Atom('mopen', { value: atom.leftDelim }),
                atom
            );
        } else if (
            atStart &&
            atom.rightDelim !== '?' &&
            atom.rightDelim !== '.'
        ) {
            // Insert closing fence
            parent.addChildAfter(
                new Atom('mclose', { value: atom.rightDelim }),
                atom
            );
        }
        // Hoist body
        parent.addChildrenAfter(atom.removeBranch('body'), atom);
        parent.removeChild(atom);
        model.position = pos;
        return true;
    } else if (atom.type === 'surd') {
        //
        // 'surd': square root
        //
        if (
            (direction === 'forward' && !branch) ||
            (direction === 'backward' && branch === 'body')
        ) {
            // Before fwd or body 1st bwd: Demote body
            const pos = atom.leftSibling;
            parent.addChildrenAfter(atom.removeBranch('body'), atom);
            parent.removeChild(atom);
            model.position = model.offsetOf(pos);
        } else if (direction === 'forward' && branch === 'body') {
            // body last fwd: move to after
            model.position = model.offsetOf(atom);
        } else if (!branch && direction === 'backward') {
            // after bwd: move to last of body
            model.position = model.offsetOf(atom.lastChild);
        } else if (branch === 'above') {
            if (atom.hasEmptyBranch('above')) {
                atom.removeBranch('above');
            }
            if (direction === 'backward') {
                // above 1st
                model.position = model.offsetOf(atom.leftSibling);
            } else {
                // above last
                model.position = model.offsetOf(atom.body[0]);
            }
        }
        return true;
    } else if (atom.type === 'box' || atom.type === 'enclose') {
        //
        // 'box': \boxed, \fbox 'enclose': \cancel
        //
        const pos =
            (branch && direction === 'backward') ||
            (!branch && direction === 'forward')
                ? atom.leftSibling
                : atom.lastChild;
        parent.addChildrenAfter(atom.removeBranch('body'), atom);
        parent.removeChild(atom);
        model.position = model.offsetOf(pos);
        return true;
    } else if (atom.type === 'genfrac' || atom.type === 'overunder') {
        //
        // 'genfrac': \frac, \choose, etc...
        //
        if (!branch) {
            // After or before atom
            if (!atom.hasChildren) return false;
            model.position = model.offsetOf(
                direction === 'forward' ? atom.firstChild : atom.lastChild
            );
            return true;
        }
        if (
            (direction === 'forward' && branch === 'above') ||
            (direction === 'backward' && branch === 'below')
        ) {
            // above last or below first: hoist
            const above = atom.removeBranch('above');
            const below = atom.removeBranch('below');

            parent.addChildrenAfter([...above, ...below], atom);
            parent.removeChild(atom);
            model.position = model.offsetOf(
                above.length > 0 ? above[above.length - 1] : below[0]
            );
            return true;
        }

        if (direction === 'backward') {
            // above first: move to before
            model.position = model.offsetOf(atom.leftSibling);
            return true;
        }
        // below last: move to after
        model.position = model.offsetOf(atom);
        return true;
    } else if (
        (atom instanceof OperatorAtom && atom.isExtensibleSymbol) ||
        atom.type === 'msubsup'
    ) {
        //
        // Extensible operator: \sum, \int, etc...
        // Superscript/subscript carrier
        //
        if (!branch && direction === 'forward') return false;
        if (!branch) {
            if (atom.subscript || atom.superscript) {
                let pos: Atom;
                if (direction === 'forward') {
                    // before
                    pos = atom.superscript?.[0] ?? atom.subscript?.[0];
                } else {
                    // after
                    pos =
                        atom.subscript?.[0].lastSibling ??
                        atom.superscript?.[0].lastSibling;
                }
                model.position = model.offsetOf(pos);
                return true;
            }

            return false;
        }
        if (branch && atom.hasEmptyBranch(branch)) {
            atom.removeBranch(branch);
        }

        if (!atom.hasChildren) {
            // We've removed the last branch of a msubsup
            const pos =
                direction === 'forward'
                    ? model.offsetOf(atom)
                    : Math.max(0, model.offsetOf(atom) - 1);
            atom.parent.removeChild(atom);
            model.position = pos;
            return true;
        }

        if (branch === 'superscript') {
            if (direction === 'backward') {
                const pos = model.offsetOf(atom.firstChild) - 1;
                console.assert(pos >= 0);
                model.position = pos;
            } else if (atom.subscript) {
                model.position = model.offsetOf(atom.subscript[0]);
            } else {
                model.position = model.offsetOf(atom);
            }
        } else if (branch === 'subscript') {
            if (direction === 'backward' && atom.superscript) {
                // subscript first: move to superscript end
                model.position = model.offsetOf(
                    atom.superscript[0].lastSibling
                );
            } else if (direction === 'backward') {
                // subscript first: move to before
                model.position = model.offsetOf(atom.firstChild) - 1;
            } else {
                // subscript last: move after
                model.position = model.offsetOf(atom);
            }
        }
        return true;
    }

    return false;
}

/**
 * Delete the item at the current position
 */
export function deleteBackward(model: ModelPrivate): boolean {
    if (!model.selectionIsCollapsed) {
        return deleteRange(model, range(model.selection));
    }

    let target = model.at(model.position);

    if (target && onDelete(model, 'backward', target)) return true;

    if (target?.isFirstSibling) {
        if (onDelete(model, 'backward', target.parent, target.treeBranch)) {
            return true;
        }
        target = null;
    }

    // At the first position: nothing to delete...
    if (!target) {
        model.announce('plonk');
        return false;
    }

    return model.deferNotifications({ content: true, selection: true }, () => {
        const offset = model.offsetOf(target.leftSibling);
        target.parent.removeChild(target);
        model.announce('delete', null, [target]);
        model.position = offset;
    });
}

/**
 * Delete the item forward of the current position, update the position and
 * send notifications
 */
export function deleteForward(model: ModelPrivate): boolean {
    if (!model.selectionIsCollapsed) {
        return deleteRange(model, range(model.selection));
    }

    let target = model.at(model.position).rightSibling;

    if (target && onDelete(model, 'forward', target)) return true;

    if (!target) {
        target = model.at(model.position);
        if (
            target.isLastSibling &&
            onDelete(model, 'forward', target.parent, target.treeBranch)
        ) {
            return true;
        }
        target = null;
    } else if (
        model.at(model.position).isLastSibling &&
        onDelete(model, 'forward', target.parent, target.treeBranch)
    ) {
        return true;
    }

    if (model.position === model.lastOffset || !target) {
        model.announce('plonk');
        return false;
    }

    return model.deferNotifications({ content: true, selection: true }, () => {
        target.parent.removeChild(target);
        let sibling = model.at(model.position)?.rightSibling;
        while (sibling?.type === 'msubsup') {
            sibling.parent.removeChild(sibling);
            sibling = model.at(model.position)?.rightSibling;
        }
        model.announce('delete', null, [target]);
    });
}

/**
 * Delete the specified range, as a result of a user action: this will
 * account for special cases such as deleting empty denominator, and will
 * provide appropriate feedback to screen readers.
 *
 * Use model.deleteAtoms() for operations that are not a result of
 * user action.
 */

export function deleteRange(model: ModelPrivate, range: Range): boolean {
    model.deleteAtoms(range);
    return true;
}
