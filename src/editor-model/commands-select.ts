import { register } from '../editor/commands';
import type { ModelPrivate } from './model-private';
import { Atom } from '../core/atom';
import { LETTER_AND_DIGITS } from '../core-definitions/definitions';
import { getMode } from './selection';
import { move, skip } from './commands';

/**
 * Return true if the atom could be a part of a number
 * i.e. "-12354.568"
 */
function isNumber(atom: Atom): boolean {
  if (!atom) return false;
  return (
    (atom.type === 'mord' && /[\d.]/.test(atom.value)) ||
    (atom.type === 'mpunct' && atom.value === ',')
  );
}

/**
 * Select all the atoms in the current group, that is all the siblings.
 * When the selection is in a numerator, the group is the numerator. When
 * the selection is a superscript or subscript, the group is the supsub.
 * When the selection is in a text zone, the "group" is a word.
 */
export function selectGroup(model: ModelPrivate): boolean {
  if (getMode(model, model.position) === 'text') {
    let start = Math.min(model.anchor, model.position);
    let end = Math.max(model.anchor, model.position);
    //
    let done = false;
    while (!done && start > 0) {
      const atom = model.at(start);
      if (atom.mode === 'text' && LETTER_AND_DIGITS.test(atom.value)) {
        start -= 1;
      } else {
        done = true;
      }
    }

    done = false;
    while (!done && end <= model.lastOffset) {
      const atom = model.at(end);
      if (atom.mode === 'text' && LETTER_AND_DIGITS.test(atom.value)) {
        end += 1;
      } else {
        done = true;
      }
    }

    if (done) {
      end -= 1;
    }

    if (start >= end) {
      // No word found. Select a single character
      model.setSelection(end - 1, end);
      return true;
    }

    model.setSelection(start, end);
  } else {
    const atom = model.at(model.position);
    // In a math zone, select all the sibling nodes
    if (isNumber(atom)) {
      // In a number, select all the digits
      let start = Math.min(model.anchor, model.position);
      let end = Math.max(model.anchor, model.position);
      //
      while (isNumber(model.at(start))) start -= 1;
      while (isNumber(model.at(end))) end += 1;
      model.setSelection(start, end - 1);
    } else {
      model.setSelection(
        model.offsetOf(atom.firstSibling),
        model.offsetOf(atom.lastSibling)
      );
    }
  }

  return true;
}

register(
  {
    selectGroup: (model: ModelPrivate): boolean => {
      const result = selectGroup(model);
      if (!result) model.announce('plonk');
      return result;
    },

    selectAll: (model: ModelPrivate): boolean =>
      model.setSelection(0, model.lastOffset),
    extendSelectionForward: (model: ModelPrivate): boolean => {
      const result = model.extendSelection('forward');
      if (!result) model.announce('plonk');
      return result;
    },
    extendSelectionBackward: (model: ModelPrivate): boolean => {
      const result = model.extendSelection('backward');
      if (!result) model.announce('plonk');
      return result;
    },

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
    extendToGroupStart: (model: ModelPrivate): boolean => {
      const result = model.setSelection(
        model.anchor,
        model.offsetOf(model.at(model.position).firstSibling)
      );
      if (!result) model.announce('plonk');
      return result;
    },
    extendToGroupEnd: (model: ModelPrivate): boolean => {
      const result = model.setSelection(
        model.anchor,
        model.offsetOf(model.at(model.position).lastSibling)
      );
      if (!result) model.announce('plonk');
      return result;
    },
    extendToMathFieldStart: (model: ModelPrivate): boolean => {
      const result = model.setSelection(model.anchor, 0);
      if (!result) model.announce('plonk');
      return result;
    },
    extendToMathFieldEnd: (model: ModelPrivate): boolean => {
      const result = model.setSelection(model.anchor, model.lastOffset);
      if (!result) model.announce('plonk');
      return result;
    },
  },
  { target: 'model', category: 'selection-extend' }
);
