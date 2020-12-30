import {
  eventToChar,
  mightProducePrintableCharacter,
} from '../editor/keyboard';
import { contentDidChange } from '../editor-model/listeners';
import type { MathfieldPrivate } from './mathfield-private';

import { ModelPrivate } from '../editor-model/model-private';
import { Atom } from '../core/atom-class';
import { LeftRightAtom } from '../core-atoms/leftright';

/**
 * Convert the atoms before the anchor to 'text' mode
 * @param count - how many atoms back to look at
 * @param {function} until - callback to indicate when to stop
 * @private
 */
function convertLastAtomsToText(
  model: ModelPrivate,
  count?: number | ((a: Atom) => boolean),
  until?: (a: Atom) => boolean
): void {
  if (typeof count !== 'number') {
    until = count;
    count = Infinity;
  }

  if (count === undefined) {
    count = Infinity;
  }

  let i = model.position;
  let done = false;
  while (!done) {
    const atom = model.at(i);
    done =
      count === 0 ||
      !atom ||
      atom.mode !== 'math' ||
      !(
        /mord|textord|mpunct/.test(atom.type) ||
        (atom.type === 'mop' && /[a-zA-Z]+/.test(atom.value))
      ) ||
      !atom.hasEmptyBranch('superscript') ||
      !atom.hasEmptyBranch('subscript') ||
      (until && !until(atom));
    if (!done) {
      atom.mode = 'text';
      atom.command = atom.value;
      atom.latex = undefined;
    }

    i -= 1;
    count -= 1;
  }

  contentDidChange(model);
}

/**
 * Convert the atoms before the anchor to 'math' mode 'mord'
 * @param {number} count - how many atoms back to look at
 * @param {function} until - callback to indicate when to stop
 * @private
 */
function convertLastAtomsToMath(
  model: ModelPrivate,
  count?: number,
  until?
): void {
  if (typeof count === 'function') {
    until = count;
    count = Infinity;
  }

  if (count === undefined) {
    count = Infinity;
  }

  let i = model.position;
  let done = false;
  while (!done) {
    const atom = model.at(i);
    done =
      count === 0 ||
      !atom ||
      atom.isFirstSibling ||
      atom.mode !== 'text' ||
      atom.value === ' ' ||
      (until && !until(atom));
    if (!done) {
      atom.mode = 'math';
    }

    i -= 1;
    count -= 1;
  }

  removeIsolatedSpace(model);
  contentDidChange(model);
}

// Export function applyMode(
//     _mathfield: MathfieldPrivate,
//     _range: Range,
//     _mode: ParseMode
// ): boolean {
// const model = mathfield.model;
// There's a mode ('text', 'math', 'command') change
// if (model.selectionIsCollapsed) {
//     // Nothing selected
//     mathfield.switchMode(mode as ParseMode);
//     return
// }
// Convert the selection from one mode to another
//         const previousMode = mathfield.mode;
//         const targetMode =
//             (getMode(model, model.position) ??
//                 mathfield.options.defaultMode) === 'math'
//                 ? 'text'
//                 : 'math';
//         let convertedSelection = mathfield.getValue(
//             mathfield.selection,
//             'ASCIIMath'
//         );
//         if (targetMode === 'math' && /^"[^"]+"$/.test(convertedSelection)) {
//             convertedSelection = convertedSelection.slice(1, -1);
//         }
//         mathfield.insert(convertedSelection, {
//             mode: targetMode,
//             selectionMode: 'item',
//             format: targetMode === 'text' ? 'text' : 'ASCIIMath',
//         });
//         mathfield.mode = targetMode;
//         const [groupStart, groupEnd] = model.getSiblingsRange(
//             model.position
//         );
//         const first = Math.min(model.anchor, model.position);
//         const last = Math.max(model.anchor, model.position);
//         if (
//             groupStart >= first &&
//             groupStart <= last &&
//             groupEnd >= first &&
//             groupEnd <= last
//         ) {
//             // The entire group was selected. Adjust parent mode if
//             // appropriate
//             const parent = model.at(model.position).parent;
//             if (
//                 parent &&
//                 (parent.type === 'group' || parent.type === 'root')
//             ) {
//                 parent.mode = targetMode;
//             }
//         }
//         // Notify of mode change
//         if (
//             mathfield.mode !== previousMode &&
//             typeof mathfield.options.onModeChange === 'function'
//         ) {
//             mathfield.options.onModeChange(mathfield, mathfield.mode);
//         }
// }
//     return false;
// }

/**
 * Going backwards from the anchor, if a text zone consisting of a single
 * space character is found (i.e. it is surrounded by math zone),
 * remove it.
 */
export function removeIsolatedSpace(model: ModelPrivate): void {
  let i = model.position - 1;
  while (i >= 0 && model.at(i)?.mode === 'math') {
    i -= 1;
  }

  if (i < 0) return;
  // If the atom before the last one converted is a
  // text mode space, preceded by a math mode atom,
  // remove the space
  if (
    model.at(i).mode === 'text' &&
    model.at(i).value === ' ' &&
    model.at(i - 1).mode === 'math'
  ) {
    model.at(i - 1).parent.removeChild(model.at(i - 1));
    contentDidChange(model);
    // We need to adjust the selection after doing some surgery on the atoms list
    // But we don't want to receive selection notification changes
    // which could have a side effect of changing the mode :(
    const save = model.suppressChangeNotifications;
    model.suppressChangeNotifications = true;
    model.position -= 1;
    model.suppressChangeNotifications = save;
  }
}

/**
 * Return the characters before the insertion point that could potentially be
 * turned into text mode.
 * This excludes things like 'mop' (e.g. \sin)
 */
function getTextBeforePosition(model: ModelPrivate): string {
  // Going backwards, accumulate
  let result = '';
  let i = model.position;
  let done = false;
  while (!done) {
    const atom = model.at(i);
    done = !(
      atom &&
      (atom.mode === 'text' ||
        (atom.mode === 'math' && /mord|textord|mpunct/.test(atom.type)))
    );
    if (!done) {
      result = atom.value + result;
    }

    i -= 1;
  }

  return result;
}
/**
 * Consider whether to switch mode give the content before the insertion point
 * and the character being input
 *
 * @param keystroke
 * @param evt - a Event corresponding to the keystroke
 * @return true if the mode should change
 */

export function smartMode(
  mathfield: MathfieldPrivate,
  keystroke: string,
  evt: KeyboardEvent
): boolean {
  if (mathfield.smartModeSuppressed) {
    return false;
  }

  const { model } = mathfield;
  // Are we at the end of a group?
  if (!model.at(model.position).isLastSibling) {
    return false;
  }

  // Is there an event that would produce a printable char?
  // (i.e. not an arrow key, etc...)
  if (!evt || !mightProducePrintableCharacter(evt)) {
    return false;
  }

  const c = eventToChar(evt);
  if (!model.selectionIsCollapsed) {
    // There is a selection
    if (mathfield.mode === 'text') {
      // If the character is '/' or '_' or '^', switch to 'math'
      if (/[/_^]/.test(c)) {
        return true;
      }
    }

    return false;
  }

  const context = getTextBeforePosition(model) + c;
  if (mathfield.mode === 'text') {
    // We're in text mode. Should we switch to math?
    if (keystroke === 'Esc' || /[/\\]/.test(c)) {
      // If this is a command for a fraction,
      // or the '\' command mode key
      // switch to 'math'
      return true;
    }

    if (/[\^_]/.test(c)) {
      // If this is a superscript or subscript
      // switch to 'math'
      if (/(^|\s)[a-zA-Z][^_]$/.test(context)) {
        // If left hand context is a single letter,
        // convert it to math
        convertLastAtomsToMath(model, 1);
      }

      return true;
    }

    // If this is a closing matching fence
    // switch to 'math' mode
    const lFence = { ')': '(', '}': '{', ']': '[' }[c];
    const { parent } = model.at(model.position);
    if (
      lFence &&
      parent instanceof LeftRightAtom &&
      parent.leftDelim === lFence
    ) {
      return true;
    }

    if (/(^|[^a-zA-Z])(a|I) $/.test(context)) {
      // Single letters that are valid words in the current language
      // Do nothing. @todo: localization
      return false;
    }

    if (/[$€£₤₺¥¤฿¢₡₧₨₹₩₱]/u.test(c)) {
      // A currency symbol.
      // Switch to math mode
      return true;
    }

    if (/(^|[^a-zA-Z'’])[a-zA-Z] $/.test(context)) {
      // An isolated letter, followed by a space:
      // Convert the letter to math, stay in text mode.
      convertLastAtomsToMath(model, 1);
      return false;
    }

    if (/\D\.[^\d\s]$/.test(context)) {
      // A period followed by something other than space or a digit
      // and not preceded by a digit.
      // We thought this was a text period, but turns out it's not
      // Turn it into a \cdot
      convertLastAtomsToMath(model, 1);
      const atom = model.at(model.position);
      atom.value = '⋅'; // Centered dot
      atom.style.variant = 'normal'; // @revisit. Was 'auto'. Check for proper conversion.
      atom.command = '\\cdot';
      atom.latex = undefined;
      contentDidChange(model);
      return true;
    }

    if (/(^|\s)[a-zA-Z][^a-zA-Z]$/.test(context)) {
      // Single letter (x), followed by a non-letter (>, =...)
      convertLastAtomsToMath(model, 1);
      return true;
    }

    if (/\.\d$/.test(context)) {
      // If the new character is a digit,
      // and it was preceded by a dot (which may have been converted
      // to text)
      // turn the dot back into 'math'
      convertLastAtomsToMath(model, 1);
      return true;
    }

    if (/\([\d+\-.]$/.test(context)) {
      // An open paren followed by a number
      // Turn the paren back to math and switch.
      convertLastAtomsToMath(model, 1);
      return true;
    }

    if (/\([a-z][,;]$/.test(context)) {
      // An open paren followed by a single letter, then a "," or ";"
      // Turn the paren back and letter to math and switch.
      convertLastAtomsToMath(model, 2);
      return true;
    }

    // The tests above can look behind and change what had previously
    // been entered. Now, let's just look at the typed character.
    if (/[\d+\-=><*|]$/.test(c)) {
      // If this new character looks like a number,
      // or a relational operator (=, <, >)
      // or a "*" or "|"
      // (note that <=, >=, etc... are handled separately as shortcuts)
      // switch to 'math'
      removeIsolatedSpace(model);
      return true;
    }
  } else {
    // We're in math mode. Should we switch to text?
    if (keystroke === '[Space]') {
      convertLastAtomsToText(model, undefined, (a) =>
        /[a-z][:,;.]$/.test(a.value)
      );
      return true;
    }

    if (/[a-zA-Z]{3,}$/.test(context) && !/(dxd|abc|xyz|uvw)$/.test(context)) {
      // A sequence of three characters
      // (except for some exceptions)
      // Convert them to text.
      convertLastAtomsToText(model, undefined, (a) => /[a-zA-Z]/.test(a.value));
      return true;
    }

    if (/(^|\W)(if)$/i.test(context)) {
      // @todo localization
      convertLastAtomsToText(model, 1);
      return true;
    }

    if (
      /(\u0393|\u0394|\u0398|\u039B|\u039E|\u03A0|\u03A3|\u03A5|\u03A6|\u03A8|\u03A9|[\u03B1-\u03C9]|\u03D1|\u03D5|\u03D6|\u03F1|\u03F5){3,}$/u.test(
        context
      ) &&
      !/(αβγ)$/.test(context)
    ) {
      // A sequence of three *greek* characters
      // (except for one exception)
      // Convert them to text.
      convertLastAtomsToText(model, undefined, (a) =>
        /(:|,|;|.|\u0393|\u0394|\u0398|\u039B|\u039E|\u03A0|\u03A3|\u03A5|\u03A6|\u03A8|\u03A9|[\u03B1-\u03C9]|\u03D1|\u03D5|\u03D6|\u03F1|\u03F5)/u.test(
          a.value
        )
      );
      return true;
    }

    if (c === '?') {
      // If the last character is a question mark,
      // turn it to 'text'
      return true;
    }

    if (c === '.' && !/[\d-+]\.$/.test(context)) {
      // A period after something other than a digit (or minus)
      return true;
    }
  }

  return false;
}
