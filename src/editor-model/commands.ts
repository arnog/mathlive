import type { ModelPrivate } from './model-private';
import { SubsupAtom } from '../core-atoms/subsup';
import { LatexAtom } from '../core-atoms/latex';
import { TextAtom } from '../core-atoms/text';
import { LETTER_AND_DIGITS } from '../core-definitions/definitions';
import { Offset } from '../public/mathfield';
import { getCommandSuggestionRange } from '../editor-mathfield/mode-editor-latex';

/*
 * Calculates the offset of the "next word".
 * This is inspired by the behavior of text editors on macOS, namely:
    blue   yellow
      ^-
         ^-------
 * That is:

 * (1) If starts with an alphanumerical character, find the first alphanumerical
 * character which is followed by a non-alphanumerical character
 *
 * The behavior regarding non-alphanumeric characters is less consistent.
 * Here's the behavior we use:
 *
 *   +=-()_:”     blue
 * ^---------
 *   +=-()_:”     blue
 *      ^---------
 *   +=-()_:”blue
 *      ^--------
 *
 * (2) If starts in whitespace, skip whitespace, then find first non-whitespace*
 *    followed by whitespace
 * (*) Pages actually uses the character class of the first non-whitespace
 * encountered.
 *
 * (3) If starts in a non-whitespace, non alphanumerical character, find the first
 *      whitespace
 *
 */
export function wordBoundaryOffset(
  model: ModelPrivate,
  offset: Offset,
  direction: 'forward' | 'backward'
): number {
  if (model.at(offset).mode !== 'text') return offset;
  const dir = direction === 'backward' ? -1 : +1;
  let result;
  if (LETTER_AND_DIGITS.test(model.at(offset).value)) {
    // (1) We start with an alphanumerical character
    let i = offset;
    let match;
    do {
      match =
        model.at(i).mode === 'text' &&
        LETTER_AND_DIGITS.test(model.at(i).value);
      i += dir;
    } while (model.at(i) && match);

    result = model.at(i) ? i - 2 * dir : i - dir;
  } else if (/\s/.test(model.at(offset).value)) {
    // (2) We start with whitespace

    // Skip whitespace
    let i = offset;
    while (
      model.at(i) &&
      model.at(i).mode === 'text' &&
      /\s/.test(model.at(i).value)
    ) {
      i += dir;
    }

    if (!model.at(i)) {
      // We've reached the end
      result = i - dir;
    } else {
      let match = true;
      do {
        match = model.at(i).mode === 'text' && !/\s/.test(model.at(i).value);
        i += dir;
      } while (model.at(i) && match);

      result = model.at(i) ? i - 2 * dir : i - dir;
    }
  } else {
    // (3)
    let i = offset;
    // Skip non-whitespace
    while (
      model.at(i) &&
      model.at(i).mode === 'text' &&
      !/\s/.test(model.at(i).value)
    ) {
      i += dir;
    }

    result = model.at(i) ? i : i - dir;
    let match = true;
    while (model.at(i) && match) {
      match = model.at(i).mode === 'text' && /\s/.test(model.at(i).value);
      if (match) result = i;
      i += dir;
    }

    result = model.at(i) ? i - 2 * dir : i - dir;
  }

  return result - (dir > 0 ? 0 : 1);
}

/**
 * Keyboard navigation with alt/option:
 * Move the insertion point to the next/previous point of interest.
 * A point of interest is an atom of a different type (mbin, mord, etc...)
 * than the current focus.
 * If `extend` is true, the selection will be extended. Otherwise, it is
 * collapsed, then moved.
 * @todo array
 */
export function skip(
  model: ModelPrivate,
  direction: 'forward' | 'backward',
  options?: { extend: boolean }
): boolean {
  const previousPosition = model.position;

  if (!(options?.extend ?? false)) {
    model.collapseSelection(direction);
  }

  let atom = model.at(model.position);
  if (direction === 'forward') {
    if (atom.type === 'msubsup') {
      atom = atom.rightSibling;
      if (!atom) {
        atom = model.at(model.position + 1);
      }
    } else {
      atom = model.at(model.position + 1);
    }
  }

  if (!atom) {
    model.announce('plonk');
    return false;
  }

  let offset = model.offsetOf(atom);

  if (atom instanceof TextAtom) {
    //
    // We're in a text zone, skip word by word
    //
    offset = wordBoundaryOffset(model, offset, direction);
  } else if (atom instanceof LatexAtom) {
    //
    // We're in a command zone, skip suggestion
    //
    if (atom.isSuggestion) {
      // Since suggestions are always at the end, this must be forward
      console.assert(direction === 'forward');
      while (atom && atom instanceof LatexAtom) {
        atom.isSuggestion = false;
        offset = model.offsetOf(atom);
        atom = atom.rightSibling;
      }
    } else if (direction === 'forward') {
      atom = atom.rightSibling;
      if (!atom || !(atom instanceof LatexAtom)) {
        // At the end of the command
        model.announce('plonk');
        return false;
      }

      while (
        atom &&
        atom instanceof LatexAtom &&
        /[a-zA-Z*]/.test(atom.value)
      ) {
        offset = model.offsetOf(atom);
        atom = atom.rightSibling;
      }
    } else {
      atom = atom.leftSibling;
      if (!atom || !(atom instanceof LatexAtom)) {
        // At the start of the command
        model.announce('plonk');
        return false;
      }

      while (
        atom &&
        atom instanceof LatexAtom &&
        /[a-zA-Z*]/.test(atom.value)
      ) {
        offset = model.offsetOf(atom);
        atom = atom.leftSibling;
      }
    }
  } else if (direction === 'forward' && atom.type === 'mopen') {
    //
    // Right before a 'mopen', skip to the corresponding balanced fence
    //
    let level = 0;
    do {
      if (atom.type === 'mopen') {
        level += 1;
      } else if (atom.type === 'mclose') {
        level -= 1;
      }

      atom = atom.rightSibling;
    } while (!atom.isLastSibling && level !== 0);

    offset = model.offsetOf(atom.leftSibling);
  } else if (direction === 'backward' && atom.type === 'mclose') {
    //
    // Right after a 'mclose', skip to the corresponding balanced fence
    //
    let level = 0;
    do {
      if (atom.type === 'mopen') {
        level += 1;
      } else if (atom.type === 'mclose') {
        level -= 1;
      }

      atom = atom.leftSibling;
    } while (!atom.isFirstSibling && level !== 0);

    offset = model.offsetOf(atom);
  } else if (direction === 'backward') {
    //
    // We're in a regular math zone (not before/after a fence)
    //
    if (atom.type === 'first') {
      while (offset > 0 && atom.type === 'first') {
        offset -= 1;
        atom = model.at(offset);
      }
    } else {
      const type = atom instanceof SubsupAtom ? atom.baseType : atom.type;
      if (atom.type === 'msubsup') {
        // If we're after a 'msubsup', skip to its left sibling
        // (the base of the super/subscript)
        offset = model.offsetOf(model.at(offset).leftSibling);
      }

      offset -= 1;
      let nextType = model.at(offset)?.type;
      // If (nextType === 'msubsup') {
      //     offset = model.offsetOf(model.at(offset).leftSibling);
      // }
      while (offset >= 0 && nextType === type) {
        if (model.at(offset)?.type === 'msubsup') {
          offset = model.offsetOf(model.at(offset).leftSibling);
        } else {
          offset -= 1;
        }

        nextType = model.at(offset).type;
      }
    }
  } else {
    const { type } = atom;
    // If (atom.type === 'msubsup') {
    //     offset = model.offsetOf(model.at(offset).rightSibling);
    // }
    let nextType = model.at(offset)?.type;
    const { lastOffset } = model;
    while (
      offset <= lastOffset &&
      (nextType === type || nextType === 'msubsup')
    ) {
      while (model.at(offset).rightSibling?.type === 'msubsup') {
        offset = model.offsetOf(model.at(offset).rightSibling);
      }

      offset += 1;
      nextType = model.at(offset)?.type;
    }

    offset -= 1;
  }

  if (options?.extend ?? false) {
    if (!model.setSelection(model.anchor, offset)) {
      model.announce('plonk');
      return false;
    }
  } else {
    if (offset === model.position) {
      model.announce('plonk');
      return false;
    }

    model.position = offset;
  }

  model.announce('move', previousPosition);
  return true;
}

/**
 * Handle keyboard navigation (arrow keys)
 */
export function move(
  model: ModelPrivate,
  direction: 'forward' | 'backward' | 'upward' | 'downward',
  options?: { extend: boolean }
): boolean {
  options = options ?? { extend: false };

  if (direction !== 'forward') {
    model.deleteAtoms(getCommandSuggestionRange(model));
  }

  if (direction === 'upward') return moveUpward(model, options);
  if (direction === 'downward') return moveDownward(model, options);

  const previousPosition = model.position;

  if (options.extend) {
    return model.extendSelection(direction);
  }

  if (model.selectionIsPlaceholder) {
    model.collapseSelection(direction);
    return move(model, direction);
  }

  if (!model.collapseSelection(direction)) {
    let pos = model.position + (direction === 'forward' ? +1 : -1);

    //
    // 1. Handle `captureSelection` and `skipBoundary`
    //
    if (direction === 'forward') {
      const atom = model.at(model.position + 1);
      if (atom?.parent?.captureSelection) {
        // When going forward, if in a capture selection, jump to
        // after
        pos = model.offsetOf(atom?.parent.lastChild) + 1;
      } else if (atom?.skipBoundary) {
        // When going forward if next is skipboundary, move 2
        pos += 1;
      } else if (atom instanceof LatexAtom && atom.isSuggestion) {
        atom.isSuggestion = false;
      }
    } else if (direction === 'backward') {
      const atom = model.at(model.position - 1);
      if (atom?.parent?.captureSelection) {
        // When going backward, if in a capture selection, jump to
        // before
        pos = Math.max(0, model.offsetOf(atom?.parent.firstChild) - 1);
      } else if (atom?.isFirstSibling && atom.parent?.skipBoundary) {
        // When going backward, if land on first of group and previous is
        // skipbounday,  move -2
        pos -= 1;
      }
    }

    //
    // 2. Handle out of bounds
    //
    if (pos < 0 || pos > model.lastOffset) {
      // We're going out of bounds
      let result = true; // True => perform default handling
      if (!model.suppressChangeNotifications) {
        result = model.hooks?.moveOut(model, direction);
      }

      if (result) model.announce('plonk');
      return result;
    }

    //
    // 3. Handle placeholder
    //
    setPositionHandlingPlaceholder(model, pos);
  }

  model.announce('move', previousPosition);
  return true;
}

function setPositionHandlingPlaceholder(
  model: ModelPrivate,
  pos: Offset
): void {
  if (model.at(pos)?.type === 'placeholder') {
    // We're going right of a placeholder: select it
    model.setSelection(pos - 1, pos);
  } else if (model.at(pos)?.rightSibling?.type === 'placeholder') {
    // We're going left of a placeholder: select it
    model.setSelection(pos, pos + 1);
  } else {
    model.position = pos;
  }
}

function moveUpward(
  model: ModelPrivate,
  options?: { extend: boolean }
): boolean {
  const extend = options?.extend ?? false;

  model.collapseSelection('backward');
  // Find a target branch
  // This is to handle the case: `\frac{x}{\sqrt{y}}`. If we're at `y`
  // we'd expectto move to `x`, even though `\sqrt` doesn't have an 'above'
  // branch, but one of its ancestor does.
  let atom = model.at(model.position);
  while (atom && atom.treeBranch !== 'below') {
    atom = atom.parent;
  }

  if (atom) {
    if (extend) {
      model.setSelection(
        model.offsetOf(atom.parent.leftSibling),
        model.offsetOf(atom.parent)
      );
    } else {
      // If branch doesn't exist, create it
      const branch =
        atom.parent.branch('above') ?? atom.parent.createBranch('above');

      // Move to the last atom of the branch
      setPositionHandlingPlaceholder(
        model,
        model.offsetOf(branch[branch.length - 1])
      );
    }

    model.announce('move up');
    // } else if (model.parent.array) {
    //     // In an array
    //     let colRow = arrayColRow(model.parent.array, relation);
    //     colRow = arrayAdjustRow(model.parent.array, colRow, -1);
    //     if (colRow && arrayCell(model.parent.array, colRow)) {
    //         model.path[model.path.length - 1].relation = ('cell' +
    //             arrayIndex(model.parent.array, colRow)) as Relation;
    //         setSelectionOffset(model, model.anchorOffset());

    //         model.announce('moveUp');
    //     } else {
    //         move(model, 'backward', options);
    //     }
  } else if (!model.at(model.position).parent?.parent) {
    let result = true; // True => perform default handling
    if (!model.suppressChangeNotifications) {
      result = model.hooks?.moveOut(model, 'upward');
    }

    model.announce(result ? 'plonk' : 'line');
    return result;
  }

  return true;
}

function moveDownward(
  model: ModelPrivate,
  options?: { extend: boolean }
): boolean {
  const extend = options?.extend ?? false;

  model.collapseSelection('forward');
  let atom = model.at(model.position);
  while (atom && atom.treeBranch !== 'above') {
    atom = atom.parent;
  }

  if (atom) {
    if (extend) {
      model.setSelection(
        model.offsetOf(atom.parent.leftSibling),
        model.offsetOf(atom.parent)
      );
    } else {
      // If branch doesn't exist, create it
      const branch =
        atom.parent.branch('below') ?? atom.parent.createBranch('below');

      // Move to the last atom of the branch
      setPositionHandlingPlaceholder(
        model,
        model.offsetOf(branch[branch.length - 1])
      );
    }

    model.announce('move down');
    //     // In an array
    //     let colRow = arrayColRow(model.parent.array, relation);
    //     colRow = arrayAdjustRow(model.parent.array, colRow, +1);
    //     // @revisit: validate this codepath
    //     if (colRow && arrayCell(model.parent.array, colRow)) {
    //         model.path[model.path.length - 1].relation = ('cell' +
    //             arrayIndex(model.parent.array, colRow)) as Relation;
    //         setSelectionOffset(model, model.anchorOffset());
    //         model.announce('moveDown');
    //     } else {
    //         move(model, 'forward', options);
    //     }
  } else if (!model.at(model.position).parent?.parent) {
    let result = true; // True => perform default handling
    if (!model.suppressChangeNotifications) {
      result = model.hooks?.moveOut(model, 'downward');
    }

    model.announce(result ? 'plonk' : 'line');
    return result;
  }

  return true;
}
