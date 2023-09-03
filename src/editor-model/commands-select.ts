import { register } from '../editor/commands';
import type { ModelPrivate } from './model-private';
import { LETTER_AND_DIGITS } from '../core-definitions/definitions-utils';
import { move, skip } from './commands';
import { range } from './selection-utils';

/**
 * Select all the atoms in the current group, that is all the siblings.
 * When the selection is in a numerator, the group is the numerator. When
 * the selection is a superscript or subscript, the group is the supsub.
 * When the selection is in a text zone, the "group" is a word.
 */
export function selectGroup(model: ModelPrivate): boolean {
  let [start, end] = range(model.selection);
  start = boundary(model, start, 'backward');
  end = boundary(model, end, 'forward');

  if (start === end) {
    const atom = model.at(start);
    // Select the content of a leftright (when clicking on the right delimiter)
    if (atom.type === 'leftright')
      return model.setSelection(model.offsetOf(atom.firstChild!) - 1, end);

    // Select the content of a leftright (when clicking on the left delimiter)
    // or on the root of a surd
    if (
      atom.type === 'first' &&
      (atom.parent!.type === 'leftright' || atom.parent!.type === 'surd')
    ) {
      return model.setSelection(
        start - 1,
        model.offsetOf(atom.parent!.lastChild!) + 1
      );
    }
    model.setSelection(start - 1, end);
  } else model.setSelection(start, end);

  return true;
}

/** Extend the position to the next boundary */
function boundary(
  model: ModelPrivate,
  pos: number,
  direction: 'forward' | 'backward'
): number {
  let atom = model.at(pos);
  if (!atom) return pos;

  const dir = direction === 'forward' ? 1 : -1;

  //
  // Text mode zone
  //
  if (atom.mode === 'text') {
    while (atom) {
      if (atom.mode !== 'text' || !LETTER_AND_DIGITS.test(atom.value)) break;
      pos += dir;
      atom = model.at(pos);
    }
    return direction === 'backward' ? pos - 1 : pos;
  }

  //
  // Latex mode zone
  //
  if (atom.mode === 'latex') {
    if (/[a-zA-Z\*]/.test(atom.value)) {
      // Possible command
      if (direction === 'backward') {
        // Look backward until we find a non-letter or a backslash
        while (
          atom &&
          atom.mode === 'latex' &&
          atom.value !== '\\' &&
          /[a-zA-Z]/.test(atom.value)
        ) {
          pos += dir;
          atom = model.at(pos);
        }
      } else {
        // Look backward until we find a non-letter or a star
        while (atom && atom.mode === 'latex' && /[a-zA-Z\*]/.test(atom.value)) {
          pos += dir;
          atom = model.at(pos);
        }
      }
    } else if (atom.value === '{') {
      if (direction === 'forward') {
        // Start of a group, select whole group
        while (atom && atom.mode === 'latex' && atom.value !== '}') {
          pos += dir;
          atom = model.at(pos);
        }
        return pos;
      }
      return pos - 1;
    } else if (atom.value === '}') {
      if (direction === 'backward') {
        while (atom && atom.mode === 'latex' && atom.value !== '{') {
          pos += dir;
          atom = model.at(pos);
        }
        return pos - 1;
      }
      return pos;
    }

    return pos - 1;
  }

  //
  // Math mode zone
  //
  if (atom.mode === 'math') {
    //
    // In a number, select all the digits
    //
    if (atom.isDigit()) {
      while (model.at(pos + dir)?.isDigit()) pos += dir;
      return direction === 'backward' ? pos - 1 : pos;
    }

    //
    // In a styled area, select all the atoms with the same style
    //
    if (atom.style.variant || atom.style.variantStyle) {
      let x = model.at(pos)?.style;
      while (
        x &&
        x.variant === atom.style.variant &&
        x.variantStyle === atom.style.variantStyle
      ) {
        x = model.at(pos + dir)?.style;
        pos += dir;
      }
      return direction === 'backward' ? pos - 1 : pos;
    }

    return pos;
  }

  return pos;
}

register(
  {
    selectGroup: (model) => {
      const result = selectGroup(model);
      if (!result) model.announce('plonk');
      return result;
    },

    selectAll: (model) => model.setSelection(0, model.lastOffset),
    extendSelectionForward: (model) => move(model, 'forward', { extend: true }),
    extendSelectionBackward: (model) =>
      move(model, 'backward', { extend: true }),
    extendToNextWord: (model) => skip(model, 'forward', { extend: true }),
    extendToPreviousWord: (model) => skip(model, 'backward', { extend: true }),
    extendSelectionUpward: (model) => move(model, 'upward', { extend: true }),
    extendSelectionDownward: (model) =>
      move(model, 'downward', { extend: true }),
    /**
     * Extend the selection until the next boundary is reached. A boundary
     * is defined by an atom of a different type (mbin, mord, etc...)
     * than the current focus. For example, in "1234+x=y", if the focus is between
     * "1" and "2", invoking `extendToNextBoundary_` would extend the selection
     * to "234".
     */
    extendToNextBoundary: (model) => skip(model, 'forward', { extend: true }),
    /**
     * Extend the selection until the previous boundary is reached. A boundary
     * is defined by an atom of a different type (mbin, mord, etc...)
     * than the current focus. For example, in "1+23456", if the focus is between
     * "5" and "6", invoking `extendToPreviousBoundary` would extend the selection
     * to "2345".
     */
    extendToPreviousBoundary: (model) =>
      skip(model, 'backward', { extend: true }),
    extendToGroupStart: (model) => {
      const result = model.setSelection(
        model.anchor,
        model.offsetOf(model.at(model.position).firstSibling)
      );
      if (!result) model.announce('plonk');
      return result;
    },
    extendToGroupEnd: (model) => {
      const result = model.setSelection(
        model.anchor,
        model.offsetOf(model.at(model.position).lastSibling)
      );
      if (!result) model.announce('plonk');
      return result;
    },
    extendToMathFieldStart: (model) => {
      const result = model.setSelection(model.anchor, 0);
      if (!result) model.announce('plonk');
      return result;
    },
    extendToMathFieldEnd: (model) => {
      const result = model.setSelection(model.anchor, model.lastOffset);
      if (!result) model.announce('plonk');
      return result;
    },
  },
  { target: 'model', changeSelection: true }
);
