import type { _Model } from './model-private';
import { Atom, isCellBranch } from '../core/atom-class';
import { ArrayAtom } from '../atoms/array';
import { LatexAtom } from '../atoms/latex';
import { TextAtom } from '../atoms/text';
import { LETTER_AND_DIGITS } from '../latex-commands/definitions-utils';
import type { Offset, Selection } from '../public/core-types';
import { isAlignEnvironment } from '../latex-commands/environment-types';
import { getCommandSuggestionRange } from '../editor-mathfield/mode-editor-latex';
import { PromptAtom } from '../atoms/prompt';
import { getLocalDOMRect } from 'editor-mathfield/utils';
import { _Mathfield } from 'editor-mathfield/mathfield-private';
import { alignedDelimiters } from './array';
import { deleteRange } from './delete';

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
  model: _Model,
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
    )
      i += dir;

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
    )
      i += dir;

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
 * If `delete` is true, the skipped range is removed.
 * @todo array
 */
export function skip(
  model: _Model,
  direction: 'forward' | 'backward',
  options?: { extend?: boolean; delete?: boolean }
): boolean {
  const previousPosition = model.position;

  if (!(options?.extend ?? false)) model.collapseSelection(direction);

  let atom = model.at(model.position);
  if (direction === 'forward') {
    if (atom.type === 'subsup') {
      atom = atom.rightSibling;
      if (!atom) atom = model.at(model.position + 1);
    } else atom = model.at(model.position + 1);
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
    // We're in a LaTeX mode zone, skip suggestion
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
        /[a-zA-Z\*]/.test(atom.value)
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
        /[a-zA-Z\*]/.test(atom.value)
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
      if (atom.type === 'mopen') level += 1;
      else if (atom.type === 'mclose') level -= 1;

      atom = atom.rightSibling;
    } while (!atom.isLastSibling && level !== 0);

    offset = model.offsetOf(atom.leftSibling);
  } else if (direction === 'backward' && atom.type === 'mclose') {
    //
    // Right after a 'mclose', skip to the corresponding balanced fence
    //
    let level = 0;
    do {
      if (atom.type === 'mopen') level += 1;
      else if (atom.type === 'mclose') level -= 1;

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
      const type = atom.type;
      if (atom.type === 'subsup') {
        // If we're after a 'subsup', skip to its left sibling
        // (the base of the super/subscript)
        offset = model.offsetOf(model.at(offset).leftSibling);
      }

      offset -= 1;
      let nextType = model.at(offset)?.type;
      // If (nextType === 'subsup') {
      //     offset = model.offsetOf(model.at(offset).leftSibling);
      // }
      while (offset >= 0 && nextType === type) {
        if (model.at(offset)?.type === 'subsup')
          offset = model.offsetOf(model.at(offset).leftSibling);
        else offset -= 1;

        nextType = model.at(offset).type;
      }
    }
  } else {
    const { type: type } = atom;
    // If (atom.type === 'subsup') {
    //     offset = model.offsetOf(model.at(offset).rightSibling);
    // }
    let nextType = model.at(offset)?.type;
    const { lastOffset } = model;
    while (
      offset <= lastOffset &&
      (nextType === type || nextType === 'subsup')
    ) {
      while (model.at(offset).rightSibling?.type === 'subsup')
        offset = model.offsetOf(model.at(offset).rightSibling);

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
    model.announce('move', previousPosition);
  } else {
    if (offset === model.position) {
      model.announce('plonk');
      return false;
    }

    if (options?.delete ?? false) {
      if (direction === 'forward')
        deleteRange(model, [previousPosition, offset], 'deleteWordForward');
      else {
        deleteRange(model, [previousPosition, offset], 'deleteWordBackward');
        model.position = offset;
      }
    } else {
      model.position = offset;
      model.announce('move', previousPosition);
    }
  }

  model.mathfield.stopCoalescingUndo();
  return true;
}

/**
 * Handle keyboard navigation (arrow keys)
 */
export function move(
  model: _Model,
  direction: 'forward' | 'backward' | 'upward' | 'downward',
  options?: { extend: boolean }
): boolean {
  options = options ?? { extend: false };

  model.mathfield.styleBias = direction === 'backward' ? 'right' : 'left';

  if (direction !== 'forward') {
    const [from, to] = getCommandSuggestionRange(model);
    if (from !== undefined && to !== undefined) model.deleteAtoms([from, to]);
  }

  if (direction === 'upward') return moveUpward(model, options);
  if (direction === 'downward') return moveDownward(model, options);

  if (options.extend) {
    let pos = nextValidPosition(model, model.position, direction);
    if (pos < 0) pos = 0;
    if (pos > model.lastOffset) pos = model.lastOffset;
    const result = model.setSelection(model.anchor, pos);
    model.mathfield.stopCoalescingUndo();
    return result;
  }

  if (model.selectionIsPlaceholder) {
    model.collapseSelection(direction);
    const result = move(model, direction);
    model.mathfield.stopCoalescingUndo();
    return result;
  }

  let pos = model.position;
  const previousPosition = pos;
  if (model.collapseSelection(direction)) {
    pos = model.position;
    if (!isValidPosition(model, pos))
      pos = nextValidPosition(model, pos, direction);
  } else {
    //
    // Kedyou: Customize cursor movement in aligned environment
    //
    const atom = model.at(pos);

    if (
      atom.parent instanceof ArrayAtom &&
      isAlignEnvironment(atom.parent.environmentName)
    ) {
      const aligned = atom.parent;

      if (direction === 'forward') {
        // if you are in the first column
        if (atom.parentBranch![1] === 0) {
          const leftCell = aligned.rows[atom.parentBranch![0]][0];
          const rightCellFirstAtom =
            aligned.rows[atom.parentBranch![0]][1]?.[1];
          if (
            leftCell[leftCell.length - 1] === atom && // if you are at the last atom of the first column
            rightCellFirstAtom && // the right cell has a first atom
            alignedDelimiters.has(rightCellFirstAtom.command) // that atom is an aligned delimiter
          ) {
            // skip past the 'aligning delimiter' in the second column
            pos++;
          }
        } else if (model.lastOffset === pos + 1) {
          // prevent moving outside of aligned environment
          model.announce('plonk');
          return true;
        }
      } else if (direction === 'backward') {
        if (pos === 1) {
          // prevent moving outside of aligned environment
          model.announce('plonk');
          return true;
        } else if (
          atom.parentBranch![1] === 1 && // if you are in the second column
          aligned.rows[atom.parentBranch![0]][1][1] === atom && // if you are positioned at the first element
          alignedDelimiters.has(atom.command) // if the first element is an aligned delimiter
        ) {
          // skip past the 'aligning delimiter' in the second column and into the first column
          pos--;
        }
      }
    }

    pos = nextValidPosition(model, pos, direction);
  }

  if (pos < 0 || pos > model.lastOffset) {
    // We're going out of bounds
    let success = true; // True => perform default handling
    if (!model.silenceNotifications) {
      success =
        model.mathfield.host?.dispatchEvent(
          new CustomEvent('move-out', {
            detail: { direction },
            cancelable: true,
            bubbles: true,
            composed: true,
          })
        ) ?? true;
    }
    if (success) model.announce('plonk');
    return success;
  }

  model.setPositionHandlingPlaceholder(pos);
  model.mathfield.stopCoalescingUndo();
  model.announce('move', previousPosition);

  return true;
}

function nextValidPosition(
  model: _Model,
  pos: number,
  direction: 'forward' | 'backward'
): number {
  pos = pos + (direction === 'forward' ? +1 : -1);

  if (pos < 0 || pos > model.lastOffset) return pos;

  if (!isValidPosition(model, pos))
    return nextValidPosition(model, pos, direction);

  return pos;
}

function isValidPosition(model: _Model, pos: number): boolean {
  const atom = model.at(pos);

  // If we're inside a captureSelection, that's not a valid position
  let parent = atom.parent;
  while (parent && !parent.inCaptureSelection) parent = parent.parent;
  if (parent?.inCaptureSelection) return false;

  if (atom.parent?.skipBoundary) {
    if (!atom.isFirstSibling && atom.isLastSibling) return false;
    if (atom.type === 'first') return false;
  }

  if (model.mathfield.hasEditablePrompts && !atom.parentPrompt) return false;

  return true;
}

function getClosestAtomToXPosition(
  mathfield: _Mathfield,
  search: Readonly<Atom[]>,
  x: number
): Atom {
  let prevX = Infinity;

  let i = 0;
  for (; i < search.length; i++) {
    const atom = search[i];
    const el = mathfield.getHTMLElement(atom);

    if (!el) continue;

    const toX = getLocalDOMRect(el).right;
    const abs = Math.abs(x - toX);

    if (abs <= prevX) {
      // minimise distance to x
      prevX = abs;
    } else {
      // this element is further away
      break;
    }
  }
  return search[i - 1];
}

function moveToClosestAtomVertically(
  model: _Model,
  fromAtom: Atom,
  toAtoms: Readonly<Atom[]>,
  extend: boolean,
  direction: 'up' | 'down'
) {
  // If prompting mode, filter toAtoms for ID's placeholders
  const hasEditablePrompts = model.mathfield.hasEditablePrompts;
  const editableAtoms = !hasEditablePrompts
    ? toAtoms
    : toAtoms.filter((a) => a.type === 'prompt' && !a.captureSelection);

  // calculate best atom to put cursor at based on real x coordinate
  const fromX = getLocalDOMRect(model.mathfield.getHTMLElement(fromAtom)).right;
  const targetSelection =
    model.offsetOf(
      getClosestAtomToXPosition(model.mathfield, editableAtoms, fromX)
    ) - (hasEditablePrompts ? 1 : 0); // jump inside prompt

  if (extend) {
    const [left, right] = model.selection.ranges[0];

    let newSelection: Selection;
    const cmp = direction === 'up' ? left : right;
    if (targetSelection < cmp) {
      // extending selection upwards / reducing selection downwards
      newSelection = {
        ranges: [[targetSelection, right]],
        direction: 'backward',
      };
    } else {
      // reducing selection upwards / extending selection downwards
      newSelection = {
        ranges: [[left, targetSelection]],
        direction: 'forward',
      };
    }

    model.setSelection(newSelection);
  } else {
    // move cursor
    model.setPositionHandlingPlaceholder(targetSelection);
  }

  model.announce(`move ${direction}`);
}

function moveUpward(model: _Model, options?: { extend: boolean }): boolean {
  const extend = options?.extend ?? false;

  if (!extend) model.collapseSelection('backward');

  // Callback when there is nowhere to move
  const handleDeadEnd = () => {
    let success = true; // True => perform default handling
    if (!model.silenceNotifications) {
      success =
        model.mathfield.host?.dispatchEvent(
          new CustomEvent('move-out', {
            detail: { direction: 'upward' },
            cancelable: true,
            bubbles: true,
            composed: true,
          })
        ) ?? true;
    }
    model.announce(success ? 'line' : 'plonk');
    return success;
  };

  // Find a target branch
  // This is to handle the case: `\frac{x}{\sqrt{y}}`. If we're at `y`
  // we'd expect to move to `x`, even though `\sqrt` doesn't have an 'above'
  // branch, but one of its ancestor does.
  const baseAtom = model.at(model.position);
  let atom = baseAtom;

  while (
    atom &&
    atom.parentBranch !== 'below' &&
    !(Array.isArray(atom.parentBranch) && atom.parent instanceof ArrayAtom)
  )
    atom = atom.parent!;

  // handle navigating through matrices and such
  if (Array.isArray(atom?.parentBranch) && atom.parent instanceof ArrayAtom) {
    const arrayAtom = atom.parent;
    if (atom.parentBranch[0] < 1) return handleDeadEnd();

    const rowAbove = atom.parentBranch[0] - 1;
    const aboveCell = arrayAtom.getCell(rowAbove, atom.parentBranch[1])!;

    // Check if the cell has any editable regions
    const cellHasPrompt = aboveCell.some(
      (a: PromptAtom) => a.type === 'prompt' && !a.captureSelection
    );
    if (!cellHasPrompt && model.mathfield.hasEditablePrompts)
      return handleDeadEnd();

    moveToClosestAtomVertically(model, baseAtom, aboveCell, extend, 'up');
  } else if (atom) {
    // If branch doesn't exist, create it
    const branch =
      atom.parent!.branch('above') ?? atom.parent!.createBranch('above');

    // Check if the branch has any editable regions
    const branchHasPrompt = branch.some(
      (a: PromptAtom) => a.type === 'prompt' && a.placeholderId
    );
    if (!branchHasPrompt && model.mathfield.hasEditablePrompts)
      return handleDeadEnd();

    moveToClosestAtomVertically(model, baseAtom, branch, extend, 'up');
  } else return handleDeadEnd();

  model.mathfield.stopCoalescingUndo();

  return true;
}

function moveDownward(model: _Model, options?: { extend: boolean }): boolean {
  const extend = options?.extend ?? false;

  if (!extend) model.collapseSelection('forward');
  // Callback when there is nowhere to move
  const handleDeadEnd = () => {
    let success = true; // True => perform default handling
    if (!model.silenceNotifications) {
      success =
        model.mathfield.host?.dispatchEvent(
          new CustomEvent('move-out', {
            detail: { direction: 'downward' },
            cancelable: true,
            bubbles: true,
            composed: true,
          })
        ) ?? true;
    }
    model.announce(success ? 'line' : 'plonk');
    return success;
  };

  // Find a target branch
  // This is to handle the case: `\frac{\sqrt{x}}{y}`. If we're at `x`
  // we'd expect to move to `y`, even though `\sqrt` doesn't have a 'below'
  // branch, but one of its ancestor does.
  const baseAtom = model.at(model.position);
  let atom = baseAtom;

  while (
    atom &&
    atom.parentBranch !== 'above' &&
    !(isCellBranch(atom.parentBranch) && atom.parent instanceof ArrayAtom)
  )
    atom = atom.parent!;

  // handle navigating through matrices and such
  if (isCellBranch(atom?.parentBranch) && atom.parent instanceof ArrayAtom) {
    const arrayAtom = atom.parent;
    if (atom.parentBranch[0] + 1 > arrayAtom.rows.length - 1)
      return handleDeadEnd();

    const rowBelow = atom.parentBranch[0] + 1;
    const belowCell = arrayAtom.getCell(rowBelow, atom.parentBranch[1])!;

    // Check if the cell has any editable regions
    const cellHasPrompt = belowCell.some(
      (a: PromptAtom) => a.type === 'prompt' && !a.captureSelection
    );
    if (!cellHasPrompt && model.mathfield.hasEditablePrompts)
      return handleDeadEnd();

    moveToClosestAtomVertically(model, baseAtom, belowCell, extend, 'down');
  } else if (atom) {
    // If branch doesn't exist, create it
    const branch =
      atom.parent!.branch('below') ?? atom.parent!.createBranch('below');
    // Check if the branch has any editable regions
    const branchHasPrompt = branch.some((a: PromptAtom) => a.type === 'prompt');
    if (!branchHasPrompt && model.mathfield.hasEditablePrompts)
      return handleDeadEnd();
    moveToClosestAtomVertically(model, baseAtom, branch, extend, 'down');
  } else return handleDeadEnd();

  return true;
}
