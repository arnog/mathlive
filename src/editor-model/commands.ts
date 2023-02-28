import type { ModelPrivate } from './model-private';
import { MathfieldPrivate, getLocalDOMRect } from '../editor/mathfield';
import { Atom } from '../core/atom-class';
import { ArrayAtom } from '../core-atoms/array';
import { LatexAtom } from '../core-atoms/latex';
import { TextAtom } from '../core-atoms/text';
import { LETTER_AND_DIGITS } from '../core-definitions/definitions';
import type { Offset, Selection } from '../public/mathfield';
import { getCommandSuggestionRange } from '../editor-mathfield/mode-editor-latex';
import { PlaceholderAtom } from 'core-atoms/placeholder';
import { PromptAtom } from 'core-atoms/prompt';

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
 * @todo array
 */
export function skip(
  model: ModelPrivate,
  direction: 'forward' | 'backward',
  options?: { extend: boolean }
): boolean {
  const previousPosition = model.position;

  if (!(options?.extend ?? false)) model.collapseSelection(direction);

  let atom = model.at(model.position);
  if (direction === 'forward') {
    if (atom.type === 'msubsup') {
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
        if (model.at(offset)?.type === 'msubsup')
          offset = model.offsetOf(model.at(offset).leftSibling);
        else offset -= 1;

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
      while (model.at(offset).rightSibling?.type === 'msubsup')
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
    const [from, to] = getCommandSuggestionRange(model);
    if (from !== undefined && to !== undefined) model.deleteAtoms([from, to]);
  }

  if (direction === 'upward') return moveUpward(model, options);
  if (direction === 'downward') return moveDownward(model, options);

  const previousPosition = model.position;

  if (options.extend) return model.extendSelection(direction);

  if (model.selectionIsPlaceholder) {
    model.collapseSelection(direction);
    return move(model, direction);
  }

  const handleDeadEnd = () => {
    // We're going out of bounds
    let result = true; // True => perform default handling
    if (!model.suppressChangeNotifications) {
      result =
        model.mathfield.host?.dispatchEvent(
          new CustomEvent('move-out', {
            detail: { direction },
            cancelable: true,
            bubbles: true,
            composed: true,
          })
        ) ?? true;
    }
    if (result) model.announce('plonk');
    return result;
  };

  if (!model.collapseSelection(direction)) {
    let pos = model.position + (direction === 'forward' ? +1 : -1);
    let atom = model.at(pos);

    //
    // 1. Handle ID'd placeholders, `captureSelection` and `skipBoundary`
    //
    if (pos >= 0 && pos <= model.lastOffset) {
      if (direction === 'forward') {
        if (model.mathfield.prompting && !model.at(pos).inPrompt) {
          // The new position is not ediatble, instead look forward for the next prompt:
          const nextAtoms = model
            .getAtoms(pos, -1)
            .map((a) => [a, ...a.children])
            .flat();

          const nextPrompts: Atom[] = nextAtoms.filter(
            (p: PromptAtom) => p.type === 'prompt' && !p.correctness
          );
          const nextPrompt = nextPrompts[0];
          if (!nextPrompt) return handleDeadEnd();
          pos = model.offsetOf(nextPrompt) - 1;
        } else if (atom.inCaptureSelection) {
          // If in a capture selection, while going forward jump to
          // after
          while (!atom.captureSelection) atom = atom.parent!;
          pos = model.offsetOf(atom);
        } else if (
          !atom.isFirstSibling &&
          atom.isLastSibling &&
          atom.parent?.skipBoundary
        ) {
          // When going forward if next is skipboundary, move 2
          if (pos + 1 === model.lastOffset) pos = pos + 1;
          else {
            model.position = pos;
            return move(model, 'forward', options);
          }
        } else if (
          atom.parent?.skipBoundary &&
          atom.rightSibling?.isLastSibling
        )
          pos += 2;
        else if (atom.parent?.skipBoundary && atom.type === 'first') pos += 1;
        else if (atom instanceof LatexAtom && atom.isSuggestion)
          atom.isSuggestion = false;
      } else if (direction === 'backward') {
        if (model.mathfield.prompting && !model.at(pos).inPrompt) {
          // The new position is not ediatble, instead look forward for the previous prompt:
          const previousAtoms = model
            .getAtoms(0, pos)
            .map((a) => [a, ...a.children])
            .flat();

          const previousPrompts: Atom[] = previousAtoms.filter(
            (p: PromptAtom) => p.type === 'prompt' && !p.correctness
          );
          const previousPrompt = previousPrompts[previousPrompts.length - 1];
          if (!previousPrompt) return handleDeadEnd();

          pos = model.offsetOf(previousPrompt) - 1;
        } else if (atom.parent?.inCaptureSelection) {
          // If in a capture selection while going backward, jump to
          // before
          while (!atom.captureSelection) atom = atom.parent!;
          pos = Math.max(0, model.offsetOf(atom.leftSibling));
        } else if (atom.skipBoundary) {
          // When going backward, if land on first of group and previous
          // (atom) is skipboundary,  move - 2
          pos = Math.max(0, model.position - 2);
        } else if (atom.parent?.skipBoundary && atom.type === 'first')
          pos = Math.max(0, model.position - 2);
      }
    }

    //
    // 2. Handle out of bounds
    //
    if (pos < 0 || pos > model.lastOffset) {
      return handleDeadEnd();
    }

    //
    // 3. Handle placeholder
    //
    model.setPositionHandlingPlaceholder(pos);
  }

  model.announce('move', previousPosition);
  return true;
}

function getClosestAtomToXPosition(
  mathfield: MathfieldPrivate,
  search: Atom[],
  x: number
): Atom {
  let prevX = Infinity;
  let i = 0;
  for (; i < search.length; i++) {
    const toX = getLocalDOMRect(mathfield.getHTMLElement(search[i])).right;
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
  model: ModelPrivate,
  fromAtom: Atom,
  toAtoms: Atom[],
  extend: boolean,
  direction: 'up' | 'down'
) {
  // If prompting mode, filter toAtoms for ID's placeholders
  const editableAtoms = toAtoms.filter(
    (a: PromptAtom) =>
      !model.mathfield.prompting || (a.type === 'prompt' && !a.correctness)
  );

  // calculate best atom to put cursor at based on real x coordinate
  const fromX = getLocalDOMRect(model.mathfield.getHTMLElement(fromAtom)).right;
  const targetSelection =
    model.offsetOf(
      getClosestAtomToXPosition(model.mathfield, editableAtoms, fromX)
    ) - (model.mathfield.prompting ? 1 : 0); // jump inside prompt

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

function moveUpward(
  model: ModelPrivate,
  options?: { extend: boolean }
): boolean {
  const extend = options?.extend ?? false;

  if (!extend) model.collapseSelection('backward');

  // Callback when there is nowhere to move
  const handleDeadEnd = () => {
    let result = true; // True => perform default handling
    if (!model.suppressChangeNotifications) {
      result =
        model.mathfield.host?.dispatchEvent(
          new CustomEvent('move-out', {
            detail: { direction: 'upward' },
            cancelable: true,
            bubbles: true,
            composed: true,
          })
        ) ?? true;
    }
    model.announce(result ? 'plonk' : 'line');
    return result;
  };

  // Find a target branch
  // This is to handle the case: `\frac{x}{\sqrt{y}}`. If we're at `y`
  // we'd expect to move to `x`, even though `\sqrt` doesn't have an 'above'
  // branch, but one of its ancestor does.
  const baseAtom = model.at(model.position);
  let atom = baseAtom;

  while (
    atom &&
    atom.treeBranch !== 'below' &&
    !(Array.isArray(atom.treeBranch) && atom.parent instanceof ArrayAtom)
  )
    atom = atom.parent!;

  // handle navigating through matrices and such
  if (Array.isArray(atom?.treeBranch) && atom.parent instanceof ArrayAtom) {
    const arrayAtom = atom.parent;
    if (atom.treeBranch[0] < 1) return handleDeadEnd();

    const rowAbove = atom.treeBranch[0] - 1;
    const aboveCell = arrayAtom.array[rowAbove][atom.treeBranch[1]]!;

    // Check if the cell has any editable regions
    const cellHasPrompt = aboveCell.some(
      (a: PromptAtom) => a.type === 'prompt' && !a.correctness
    );
    if (!cellHasPrompt && model.mathfield.prompting) return handleDeadEnd();

    moveToClosestAtomVertically(model, baseAtom, aboveCell, extend, 'up');
  } else if (atom) {
    // If branch doesn't exist, create it
    const branch =
      atom.parent!.branch('above') ?? atom.parent!.createBranch('above');

    // Check if the branch has any editable regions
    const branchHasPrompt = branch.some(
      (a: PromptAtom) => a.type === 'prompt' && a.placeholderId
    );
    if (!branchHasPrompt && model.mathfield.prompting) return handleDeadEnd();

    moveToClosestAtomVertically(model, baseAtom, branch, extend, 'up');
  } else {
    return handleDeadEnd();
  }

  return true;
}

function moveDownward(
  model: ModelPrivate,
  options?: { extend: boolean }
): boolean {
  const extend = options?.extend ?? false;

  if (!extend) model.collapseSelection('forward');
  // Callback when there is nowhere to move
  const handleDeadEnd = () => {
    let result = true; // True => perform default handling
    if (!model.suppressChangeNotifications) {
      result =
        model.mathfield.host?.dispatchEvent(
          new CustomEvent('move-out', {
            detail: { direction: 'downward' },
            cancelable: true,
            bubbles: true,
            composed: true,
          })
        ) ?? true;
    }
    model.announce(result ? 'plonk' : 'line');
    return result;
  };

  // Find a target branch
  // This is to handle the case: `\frac{\sqrt{x}}{y}`. If we're at `x`
  // we'd expect to move to `y`, even though `\sqrt` doesn't have a 'below'
  // branch, but one of its ancestor does.
  const baseAtom = model.at(model.position);
  let atom = baseAtom;

  while (
    atom &&
    atom.treeBranch !== 'above' &&
    !(Array.isArray(atom.treeBranch) && atom.parent instanceof ArrayAtom)
  )
    atom = atom.parent!;

  // handle navigating through matrices and such
  if (Array.isArray(atom?.treeBranch) && atom.parent instanceof ArrayAtom) {
    const arrayAtom = atom.parent;
    if (atom.treeBranch[0] + 1 > arrayAtom.array.length - 1)
      return handleDeadEnd();

    const rowBelow = atom.treeBranch[0] + 1;
    const belowCell = arrayAtom.array[rowBelow][atom.treeBranch[1]]!;

    // Check if the cell has any editable regions
    const cellHasPrompt = belowCell.some(
      (a: PromptAtom) => a.type === 'prompt' && !a.correctness
    );
    if (!cellHasPrompt && model.mathfield.prompting) return handleDeadEnd();

    moveToClosestAtomVertically(model, baseAtom, belowCell, extend, 'down');
  } else if (atom) {
    // If branch doesn't exist, create it
    const branch =
      atom.parent!.branch('below') ?? atom.parent!.createBranch('below');
    // Check if the branch has any editable regions
    const branchHasPrompt = branch.some(
      (a: PromptAtom) => a.type === 'prompt' && a.placeholderId
    );
    if (!branchHasPrompt && model.mathfield.prompting) return handleDeadEnd();
    moveToClosestAtomVertically(model, baseAtom, branch, extend, 'down');
  } else {
    return handleDeadEnd();
  }

  return true;
}
