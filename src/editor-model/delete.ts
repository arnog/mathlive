import { ContentChangeType } from '../public/options';
import type { Range } from '../public/mathfield';

import { LeftRightAtom } from '../core-atoms/leftright';
import { Atom, Branch } from '../core/atom';
import { ModelPrivate } from './model-private';
import { range } from './selection-utils';
import MathfieldElement from 'public/mathfield-element';
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
 * Handle special cases when deleting an atom as per the table below:
 * - deleting an empty numerator: demote fraction
 * - forward-deleting a square root: demote it
 * - delete last atom inside a square root: delete the square root
 * - delete last atom in a subsup: delete the subsup
 * - etc...
 *
 * Note that `onDelete` may be called twice: once on the atom being deleted
 * directly (in this case `branch` is `undefined`) and a second time
 * on the parent if the atom was the first/last (in which case `branch` indicate
 * which branch the atom was in).
 *
 *
 * @param branch: if deleting inside an atom, the branch being deleted
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

  //
  // 'leftright': \left\right
  //
  if (parent && atom instanceof LeftRightAtom) {
    const atStart =
      (!branch && direction === 'forward') ||
      (branch === 'body' && direction === 'backward');
    let pos = atStart
      ? model.offsetOf(atom.firstChild)
      : model.offsetOf(atom.lastChild);

    if (atStart) {
      if (atom.rightDelim !== '?' && atom.rightDelim !== '.') {
        atom.leftDelim = '.';
        atom.isDirty = true;
      } else {
        // Hoist body
        parent.addChildrenAfter(atom.removeBranch('body'), atom);
        parent.removeChild(atom);
        // decrement position
        pos--;
      }
    } else {
      if (atom.leftDelim !== '?' && atom.leftDelim !== '.') {
        atom.rightDelim = '.';
        atom.isDirty = true;
      } else {
        // Hoist body
        parent.addChildrenAfter(atom.removeBranch('body'), atom);
        parent.removeChild(atom);
        // decrement position
        pos--;
      }
    }

    model.position = pos;
    return true;
  }

  //
  // 'surd': square root
  //
  if (parent && atom.type === 'surd') {
    if (
      (direction === 'forward' && !branch) ||
      (direction === 'backward' && branch === 'body')
    ) {
      // Before fwd or body 1st bwd: Demote body
      const pos = atom.leftSibling;
      if (atom.hasChildren)
        parent.addChildrenAfter(atom.removeBranch('body'), atom);

      parent.removeChild(atom);
      model.position = model.offsetOf(pos);
    } else if (direction === 'forward' && branch === 'body') {
      // Body last fwd: move to after
      model.position = model.offsetOf(atom);
    } else if (!branch && direction === 'backward') {
      // After bwd: move to last of body
      if (atom.hasChildren) model.position = model.offsetOf(atom.lastChild);
      else {
        model.position = Math.max(0, model.offsetOf(atom) - 1);
        parent.removeChild(atom);
      }
    } else if (branch === 'above') {
      if (atom.hasEmptyBranch('above')) atom.removeBranch('above');

      if (direction === 'backward') {
        // Above 1st
        model.position = model.offsetOf(atom.leftSibling);
      } else {
        // Above last
        model.position = model.offsetOf(atom.body![0]);
      }
    }

    return true;
  }

  //
  // 'box': \boxed, \fbox 'enclose': \cancel
  //
  if (parent && (atom.type === 'box' || atom.type === 'enclose')) {
    const pos =
      (branch && direction === 'backward') ||
      (!branch && direction === 'forward')
        ? atom.leftSibling
        : atom.lastChild;
    parent.addChildrenAfter(atom.removeBranch('body'), atom);
    parent.removeChild(atom);
    model.position = model.offsetOf(pos);
    return true;
  }

  //
  // 'genfrac': \frac, \choose, etc...
  //

  if (atom.type === 'genfrac' || atom.type === 'overunder') {
    if (!branch) {
      // After or before atom
      if (atom.type === 'overunder' && atom.hasEmptyBranch('body'))
        return false;
      if (
        atom.type === 'genfrac' &&
        atom.hasEmptyBranch('below') &&
        atom.hasEmptyBranch('above')
      )
        return false;
      model.position = model.offsetOf(
        direction === 'forward' ? atom.firstChild : atom.lastChild
      );
      return true;
    }

    const firstBranch =
      MathfieldElement.fractionNavigationOrder === 'numerator-denominator'
        ? 'above'
        : 'below';
    const secondBranch = firstBranch === 'above' ? 'below' : 'above';

    if (
      parent &&
      ((direction === 'forward' && branch === firstBranch) ||
        (direction === 'backward' && branch === secondBranch))
    ) {
      // Above last or below first: hoist
      const first = atom.removeBranch(firstBranch);
      const second = atom.removeBranch(secondBranch);

      parent.addChildrenAfter([...first, ...second], atom);
      parent.removeChild(atom);
      model.position = model.offsetOf(
        first.length > 0 ? first[first.length - 1] : second[0]
      );
      return true;
    }

    if (direction === 'backward')
      model.position = model.offsetOf(atom.leftSibling);
    else model.position = model.offsetOf(atom);

    return true;
  }

  if (atom.isExtensibleSymbol || atom.type === 'subsup') {
    //
    // Extensible operator: \sum, \int, etc...
    // Superscript/subscript carrier
    //
    if (!branch && direction === 'forward') return false;
    if (!branch) {
      if (atom.subscript || atom.superscript) {
        const pos: Atom | undefined =
          direction === 'forward'
            ? atom.superscript?.[0] ?? atom.subscript?.[0]
            : atom.subscript?.[0].lastSibling ??
              atom.superscript?.[0].lastSibling;
        if (pos) model.position = model.offsetOf(pos);
        return true;
      }

      return false;
    }

    if (!atom.hasChildren && atom.type === 'subsup') {
      // We've removed the last branch of a subsup
      const pos =
        direction === 'forward'
          ? model.offsetOf(atom)
          : Math.max(0, model.offsetOf(atom) - 1);
      atom.parent!.removeChild(atom);
      model.position = pos;
      return true;
    }

    if (branch === 'superscript') {
      if (direction === 'backward') {
        const pos = model.offsetOf(atom.firstChild) - 1;
        console.assert(pos >= 0);
        model.position = pos;
      } else if (atom.subscript)
        model.position = model.offsetOf(atom.subscript[0]);
      else model.position = model.offsetOf(atom);
    } else if (branch === 'subscript') {
      if (direction === 'backward' && atom.superscript) {
        // Subscript first: move to superscript end
        model.position = model.offsetOf(atom.superscript[0].lastSibling);
      } else if (direction === 'backward') {
        // Subscript first: move to before
        model.position = model.offsetOf(atom.firstChild) - 1;
      } else {
        // Subscript last: move after
        model.position = model.offsetOf(atom);
      }
    }

    if (branch && atom.hasEmptyBranch(branch)) {
      atom.removeBranch(branch);
      if (atom.type === 'subsup' && !atom.subscript && !atom.superscript) {
        // We've removed the last branch of a subsup
        const pos =
          direction === 'forward'
            ? model.offsetOf(atom)
            : Math.max(0, model.offsetOf(atom) - 1);
        atom.parent!.removeChild(atom);
        model.position = pos;
      }
    }

    return true;
  }

  if (parent?.type === 'genfrac' && !branch && atom.type !== 'first') {
    let pos = model.offsetOf(atom.leftSibling);
    parent.removeChild(atom);
    if (parent.hasEmptyBranch('above') && parent.hasEmptyBranch('below')) {
      // The last numerator or denominator of a fraction has been deleted:
      // delete the fraction
      pos = model.offsetOf(parent.leftSibling);
      parent.parent!.removeChild(parent);
      model.announce('delete', undefined, [parent]);
      model.position = pos;
      return true;
    }
    model.announce('delete', undefined, [atom]);
    model.position = pos;
    return true;
  }

  // In the sup or sub of, e.g. \ln.
  // removing any sub or sup should remove the parent
  if (
    direction === 'backward' &&
    (parent?.command === '\\ln' || parent?.command === '\\log') &&
    atom.parentBranch !== 'body'
  ) {
    const pos = model.offsetOf(parent.leftSibling);
    parent.parent!.removeChild(parent);
    model.announce('delete', undefined, [parent]);
    model.position = pos;
    return true;
  }

  return false;
}

/**
 * Delete the item at the current position
 */
export function deleteBackward(model: ModelPrivate): boolean {
  if (!model.mathfield.isSelectionEditable) return false;

  if (!model.contentWillChange({ inputType: 'deleteContentBackward' }))
    return false;

  if (!model.selectionIsCollapsed)
    return deleteRange(model, range(model.selection), 'deleteContentBackward');

  return model.deferNotifications(
    { content: true, selection: true, type: 'deleteContentBackward' },
    () => {
      let target: Atom | null = model.at(model.position);

      if (target && onDelete(model, 'backward', target)) return;

      if (target?.isFirstSibling) {
        if (onDelete(model, 'backward', target.parent!, target.parentBranch))
          return;

        target = null;
      }

      // At the first position: nothing to delete...
      if (!target) {
        model.announce('plonk');
        return;
      }

      model.position = model.offsetOf(target.leftSibling);
      target.parent!.removeChild(target);
      model.announce('delete', undefined, [target]);
    }
  );
}

/**
 * Delete the item forward of the current position, update the position and
 * send notifications
 */
export function deleteForward(model: ModelPrivate): boolean {
  if (!model.mathfield.isSelectionEditable) return false;

  if (!model.contentWillChange({ inputType: 'deleteContentForward' }))
    return false;
  if (!model.selectionIsCollapsed)
    return deleteRange(model, range(model.selection), 'deleteContentForward');

  return model.deferNotifications(
    { content: true, selection: true, type: 'deleteContentForward' },
    () => {
      let target: Atom | undefined = model.at(model.position).rightSibling;

      if (target && onDelete(model, 'forward', target)) return;

      if (!target) {
        target = model.at(model.position);
        if (
          target.isLastSibling &&
          onDelete(model, 'forward', target.parent!, target.parentBranch)
        )
          return;

        target = undefined;
      } else if (
        model.at(model.position).isLastSibling &&
        onDelete(model, 'forward', target.parent!, target.parentBranch)
      )
        return;

      if (model.position === model.lastOffset || !target) {
        model.announce('plonk');
        return;
      }

      target.parent!.removeChild(target);
      let sibling = model.at(model.position)?.rightSibling;
      while (sibling?.type === 'subsup') {
        sibling.parent!.removeChild(sibling);
        sibling = model.at(model.position)?.rightSibling;
      }

      model.announce('delete', undefined, [target]);
    }
  );
}

/**
 * Delete the specified range, as a result of a user action: this will
 * account for special cases such as deleting empty denominator, and will
 * provide appropriate feedback to screen readers.
 *
 * Use model.deleteAtoms() for operations that are not a result of
 * user action.
 */

export function deleteRange(
  model: ModelPrivate,
  range: Range,
  type: ContentChangeType
): boolean {
  const result = model.getAtoms(range);
  if (result.length > 0 && result[0].parent) {
    let firstChild = result[0].parent!.firstChild;
    if (firstChild.type === 'first') firstChild = firstChild.rightSibling;
    const lastChild = result[result.length - 1].parent!.lastChild;

    let firstSelected = result[0];
    if (firstSelected.type === 'first')
      firstSelected = firstSelected.rightSibling;
    const lastSelected = result[result.length - 1];

    // If we're deleting all the children, also delete the parent
    // (for example for surd/\sqrt)
    if (firstSelected === firstChild && lastSelected === lastChild) {
      const parent = result[0].parent!;
      if (parent.parent && parent.type !== 'prompt')
        range = [model.offsetOf(parent.leftSibling), model.offsetOf(parent)];
    }

    // If we have a placeholder denominator selected,
    // hoist the denominator
    if (
      result.length === 1 &&
      result[0].type === 'placeholder' &&
      result[0].parent.type === 'genfrac'
    ) {
      const genfrac = result[0].parent!;
      const branch = result[0].parentBranch === 'below' ? 'above' : 'below';
      const pos = model.offsetOf(genfrac.leftSibling);
      return model.deferNotifications(
        { content: true, selection: true, type },
        () => {
          const numer = genfrac.removeBranch(branch);
          if (!(numer.length === 1 && numer[0].type === 'placeholder')) {
            const lastAtom = genfrac.parent!.addChildrenAfter(numer, genfrac);
            genfrac.parent?.removeChild(genfrac);
            model.position = model.offsetOf(lastAtom);
          } else {
            genfrac.parent?.removeChild(genfrac);
            model.position = Math.max(0, pos);
          }
        }
      );
    }
  }
  return model.deferNotifications(
    { content: true, selection: true, type },
    () => model.deleteAtoms(range)
  );
}
