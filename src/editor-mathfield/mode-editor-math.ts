/* eslint-disable no-new */
import { InsertOptions, Offset, Range } from '../public/mathfield';
import { MathfieldPrivate } from './mathfield-private';
import { jsonToLatex } from '../addons/math-json';
import { requestUpdate } from './render';
import { range } from '../editor-model/selection-utils';
import { ModeEditor } from './mode-editor';
import { ModelPrivate } from '../editor-model/model-private';

import { Atom, BranchName } from '../core/atom-class';
import { ArrayAtom } from '../core-atoms/array';

import { parseMathString } from '../editor/parse-math-string';

import type { Style } from '../public/core';
import { LeftRightAtom } from '../core-atoms/leftright';
import { RIGHT_DELIM } from '../core/delimiters';
import {
  contentDidChange,
  selectionDidChange,
} from '../editor-model/listeners';
import { applyStyleToUnstyledAtoms } from '../editor-model/styling';
import { parseLatex } from '../core/parser';

export class MathModeEditor extends ModeEditor {
  constructor() {
    super('math');
  }

  onPaste(mathfield: MathfieldPrivate, ev: ClipboardEvent): boolean {
    let text = '';

    // Try to get a MathJSON data type
    const json = ev.clipboardData.getData('application/json');
    if (json) {
      try {
        text = jsonToLatex(JSON.parse(json), {});
      } catch {
        text = '';
      }
    }

    // If that didn't work, try some plain text
    if (!text) {
      text = ev.clipboardData.getData('text/plain');
    }

    if (text) {
      if (
        this.insert(mathfield.model, text, {
          smartFence: mathfield.options.smartFence,
        })
      ) {
        requestUpdate(mathfield);
      }

      ev.preventDefault();
      ev.stopPropagation();
    }

    return true;
  }

  onCopy(mathfield: MathfieldPrivate, ev: ClipboardEvent): void {
    const value: Range = mathfield.model.selectionIsCollapsed
      ? [0, mathfield.model.lastOffset]
      : range(mathfield.selection);
    ev.clipboardData.setData(
      'text/plain',
      '$$' + mathfield.getValue(value, 'latex-expanded') + '$$'
    );
    ev.clipboardData.setData(
      'application/json',
      mathfield.getValue(value, 'json')
    );
    ev.clipboardData.setData(
      'application/xml',
      mathfield.getValue(value, 'mathML')
    );
    // Prevent the current document selection from being written to the clipboard.
    ev.preventDefault();
  }

  insert(model: ModelPrivate, text: string, options: InsertOptions): boolean {
    if (!options.insertionMode) options.insertionMode = 'replaceSelection';
    if (!options.selectionMode) options.selectionMode = 'placeholder';
    if (!options.format) options.format = 'auto';
    options.macros = options.macros ?? model.options.macros;

    //
    // Try to insert a smart fence.
    //
    if (!(options.smartFence ?? false)) {
      // When smartFence is turned off, only do a "smart" fence insert
      // if we're inside a `leftright`, at the last char
      const { parent } = model.at(model.position);
      if (
        parent instanceof LeftRightAtom &&
        parent.rightDelim === '?' &&
        model.at(model.position).isLastSibling &&
        /^[)}\]|]$/.test(text)
      ) {
        parent.rightDelim = text;
        model.position += 1;
        selectionDidChange(model);
        contentDidChange(model);
        return true;
      }
    } else if (
      model.selectionIsCollapsed &&
      insertSmartFence(model, text, options.style)
    ) {
      return true;
    }

    const { suppressChangeNotifications } = model;
    if (options.suppressChangeNotifications) {
      model.suppressChangeNotifications = true;
    }

    const contentWasChanging = model.suppressChangeNotifications;
    model.suppressChangeNotifications = true;

    //
    // Save the content of the selection, if any
    //
    const args: string[] = [];
    args[0] = model.getValue(model.selection);
    args['?'] = options.placeholder ?? '\\placeholder{}';
    args['@'] = args['?'];

    //
    // Delete any selected items
    //
    if (
      options.insertionMode === 'replaceSelection' &&
      !model.selectionIsCollapsed
    ) {
      model.position = model.deleteAtoms(range(model.selection));
    } else if (options.insertionMode === 'replaceAll') {
      model.root.setChildren([], 'body');
      model.position = 0;
    } else if (options.insertionMode === 'insertBefore') {
      model.collapseSelection('backward');
    } else if (options.insertionMode === 'insertAfter') {
      model.collapseSelection('forward');
    }

    //
    // Delete any placeholders before or after the insertion point
    //
    if (
      !model.at(model.position).isLastSibling &&
      model.at(model.position + 1).type === 'placeholder'
    ) {
      // Before a `placeholder`
      model.deleteAtoms([model.position, model.position + 1]);
    } else if (model.at(model.position).type === 'placeholder') {
      // After a `placeholder`
      model.deleteAtoms([model.position - 1, model.position]);
      model.position -= 1;
    }

    //
    // Calculate the implicit argument (#@)
    //
    if (args[0]) {
      // There was a selection, we'll use it for #@
      args['@'] = args[0];
    } else if (/(^|[^\\])#@/.test(text)) {
      // We'll use the preceding `mord`s or text mode atoms for it (implicit argument)
      const offset = getImplicitArgOffset(model);
      if (offset >= 0) {
        args['@'] = model.getValue(offset, model.position);
        model.deleteAtoms([offset, model.position]);
        model.position = offset;
      }
    }

    if (!args[0]) args[0] = args['?'];

    const newAtoms = convertStringToAtoms(model, text, args, options);
    if (!newAtoms) return false;

    //
    // Insert the new atoms
    //
    const { parent } = model.at(model.position);
    // Are we inserting a fraction inside a lefright?
    if (
      options.format !== 'latex' &&
      model.options.removeExtraneousParentheses &&
      parent instanceof LeftRightAtom &&
      parent.leftDelim === '(' &&
      parent.hasEmptyBranch('body') &&
      newAtoms.length === 1 &&
      newAtoms[0].type === 'genfrac'
    ) {
      // Remove the leftright
      // i.e. `\left(\frac{}{}\right))` -> `\frac{}{}`
      const newParent = parent.parent;
      const branch = parent.treeBranch;
      newParent.removeChild(parent);
      newParent.setChildren(newAtoms, branch);
    } else {
      if (options.format === 'latex' && args.length === 1 && !args[0]) {
        // If we are given a latex string with no arguments, store it verbatim
        // Caution: we can only do this if the toLatex() for this parent
        // would return an empty string. If the latex is generated using other
        // properties than parent.body, for example by adding '\left.' and
        // '\right.' with a 'leftright' type, we can't use this shortcut.
        if (parent.type === 'root' && parent.hasEmptyBranch('body')) {
          parent.latex = text;
        }
      }

      const cursor = model.at(model.position);
      cursor.parent.addChildrenAfter(newAtoms, cursor);
    }

    // Prepare to dispatch notifications
    // (for selection changes, then content change)
    model.suppressChangeNotifications = contentWasChanging;

    const lastNewAtom = newAtoms[newAtoms.length - 1];
    // Update the anchor's location
    if (options.selectionMode === 'placeholder') {
      // Move to the next placeholder
      const newPlaceholders = newAtoms.reduce(
        (acc, atom) => [
          ...acc,
          ...atom.children.filter((x) => x.type === 'placeholder'),
        ],
        []
      );

      if (newPlaceholders.length > 0) {
        const placeholderOffset = model.offsetOf(newPlaceholders[0]);
        model.setSelection(placeholderOffset - 1, placeholderOffset);
        model.announce('move'); // Should have placeholder selected
      } else if (lastNewAtom) {
        // No placeholder found, move to right after what we just inserted
        model.position = model.offsetOf(lastNewAtom);
      }
    } else if (options.selectionMode === 'before') {
      // Do nothing: don't change the position.
    } else if (options.selectionMode === 'after') {
      if (lastNewAtom) {
        model.position = model.offsetOf(lastNewAtom);
      }
    } else if (options.selectionMode === 'item') {
      model.setSelection(model.anchor, model.offsetOf(lastNewAtom));
    }

    contentDidChange(model);

    model.suppressChangeNotifications = suppressChangeNotifications;

    return true;
  }
}

function convertStringToAtoms(
  model: ModelPrivate,
  s: string,
  args: string[],
  options: InsertOptions
): Atom[] {
  let result = [];
  if (options.format === 'ASCIIMath') {
    [, s] = parseMathString(s, { format: 'ASCIIMath' });
    result = parseLatex(
      s,
      'math',
      null,
      options?.macros,
      false,
      model.listeners.onError
    );

    // Simplify result.
    if (model.options.removeExtraneousParentheses) {
      simplifyParen(result);
    }
  } else if (options.format === 'auto' || options.format === 'latex') {
    if (options.format === 'auto') {
      [options.format, s] = parseMathString(s);
    }

    // If the whole string is bracketed by a mode shift command, remove it
    if (/^\$\$(.*)\$\$$/.test(s)) {
      s = s.substring(2, s.length - 2);
    }

    result = parseLatex(
      s,
      'math',
      args,
      options.macros,
      options.smartFence ?? false,
      model.listeners.onError
    );

    // Simplify result.
    if (
      options.format !== 'latex' &&
      model.options.removeExtraneousParentheses
    ) {
      simplifyParen(result);
    }
  }

  // Some atoms may already have a style (for example if there was an
  // argument, i.e. the selection, that this was applied to).
  // So, don't apply style to atoms that are already styled, but *do*
  // apply it to newly created atoms that have no style yet.
  applyStyleToUnstyledAtoms(result, options.style);

  return result;
}

function removeParen(atoms: Atom[]): Atom[] | null {
  if (!atoms) return null;

  console.assert(atoms[0].type === 'first');
  if (atoms.length > 1) return null;

  const atom = atoms[0];
  if (
    atom instanceof LeftRightAtom &&
    atom.leftDelim === '(' &&
    atom.rightDelim === ')'
  ) {
    return atom.removeBranch('body');
  }

  return null;
}

/**
 * If it's a fraction with a parenthesized numerator or denominator
 * remove the parentheses
 * @revisit: don't need model, only need to know if removeExtraneousParentheses
 *              Check at callsites.
 */
function simplifyParen(atoms: Atom[]): void {
  if (!atoms) return;
  for (let i = 0; atoms[i]; i++) {
    const atom = atoms[i];
    if (atom instanceof LeftRightAtom && atom.leftDelim === '(') {
      let genFracCount = 0;
      let genFracIndex = 0;
      let nonGenFracCount = 0;
      for (let j = 0; atom.body[j]; j++) {
        if (atom.body[j].type === 'genfrac') {
          genFracCount++;
          genFracIndex = j;
        }

        nonGenFracCount++;
      }

      if (nonGenFracCount === 0 && genFracCount === 1) {
        // This is a single frac inside a leftright: remove the leftright
        atoms[i] = atom.body[genFracIndex];
      }
    }
  }

  atoms.forEach((atom) => {
    atom.branches.forEach((branch: BranchName) => {
      if (!atom.hasEmptyBranch(branch)) {
        simplifyParen(atom.branch(branch));
        const newChildren = removeParen(atom.branch(branch));
        if (newChildren) atom.setChildren(newChildren, branch);
      }
    });

    if (atom instanceof ArrayAtom) {
      atom.cells.forEach((x) => simplifyParen(x));
    }
  });
}

/**
 * Locate the offset before the insertion point that would indicate
 * a good place to select as an implicit argument.
 *
 * For example with '1+\sin(x)', if the insertion point is at the
 * end, the implicit arg offset would be after the plus. As a result,
 * inserting a fraction after the sin would yield: '1+\frac{\sin(c)}{\placeholder{}}'
 */
function getImplicitArgOffset(model: ModelPrivate): Offset {
  let atom = model.at(model.position);
  if (atom.mode === 'text') {
    while (!atom.isFirstSibling && atom.mode === 'text') {
      atom = atom.leftSibling;
    }

    return model.offsetOf(atom);
  }

  if (!isImplicitArg(atom)) {
    return -1;
  }

  // Find the first 'mrel', etc... to the left of the insertion point
  // until the first sibling
  while (!atom.isFirstSibling && isImplicitArg(atom)) {
    atom = atom.leftSibling;
  }

  return model.offsetOf(atom);
}

/**
 *
 * Predicate returns true if the atom should be considered an implicit argument.
 *
 * Used for example when typing "/" to insert a fraction: all the atoms to
 * the left of insertion point that return true for `isImplicitArg()` will
 * be included as the numerator
 */
function isImplicitArg(atom: Atom): boolean {
  if (/^(mord|surd|msubsup|leftright|mop)$/.test(atom.type)) {
    // Exclude `\int`, \`sum`, etc...
    if (atom.isExtensibleSymbol) return false;
    return true;
  }

  return false;
}

/**
 * Insert a smart fence '(', '{', '[', etc...
 * If not handled (because `fence` wasn't a fence), return false.
 */
export function insertSmartFence(
  model: ModelPrivate,
  fence: string,
  style: Style
): boolean {
  console.assert(model.selectionIsCollapsed);
  const atom = model.at(model.position);
  const { parent } = atom;
  let delims =
    parent instanceof LeftRightAtom ? parent.leftDelim + parent.rightDelim : '';
  if (delims === '\\lbrace\\rbrace') delims = '{}';
  if (delims === '\\{\\}') delims = '{}';

  //
  // 1. Are we inserting a middle fence?
  // ...as in {...|...}
  //
  if (delims === '{}' && /\||\\vert|\\Vert|\\mvert|\\mid/.test(fence)) {
    ModeEditor.insert('math', model, '\\,\\middle' + fence + '\\, ', {
      format: 'latex',
      style,
    });
    return true;
  }

  // Normalize some fences.
  // Note that '{' and '}' are not valid braces.
  // They should be '\{' or '\lbrace' and '\}' or '\rbrace'
  if (fence === '{' || fence === '\\{') fence = '\\lbrace';
  if (fence === '}' || fence === '\\}') fence = '\\rbrace';
  if (fence === '[') fence = '\\lbrack';
  if (fence === ']') fence = '\\rbrack';

  //
  // 2. Is it an open fence?
  //
  const rDelim = RIGHT_DELIM[fence];
  if (
    rDelim &&
    !(parent instanceof LeftRightAtom && parent.leftDelim === '|')
  ) {
    // We have a valid open fence as input
    let s = '';

    // If we're before a function (e.g. `\sin`, or 'f'):  this is an
    // argument list: Use `\mleft...\mright'.

    s = atom.isFunction
      ? `\\mleft${fence}\\mright${rDelim}`
      : `\\left${fence}\\right?`;

    const lastSiblingOffset = model.offsetOf(atom.lastSibling);
    const content = model.extractAtoms([model.position, lastSiblingOffset]);
    ModeEditor.insert('math', model, s, {
      format: 'latex',
      style,
    });
    // Move everything that was after the anchor into the leftright
    model.at(model.position).body = content;
    model.position -= 1;
    return true;
  }

  //
  // 3. Is it a close fence?
  //
  let lDelim: string;
  Object.keys(RIGHT_DELIM).forEach((delim) => {
    if (fence === RIGHT_DELIM[delim]) lDelim = delim;
  });
  if (lDelim) {
    // We found a matching open fence, so it was a valid close fence.
    // Note that `lDelim` may not match `fence`. That's OK.

    // If we're the last atom inside a 'leftright',
    // update the parent
    if (parent instanceof LeftRightAtom && atom.isLastSibling) {
      parent.rightDelim = fence;
      model.position += 1;
      contentDidChange(model);
      return true;
    }

    // If we have a `leftright` sibling to our left
    // with an indeterminate right fence,
    // move what's between us and the `leftright` inside the `leftright`
    const firstSibling = model.offsetOf(atom.firstSibling);
    let i: number;
    for (i = model.position; i >= firstSibling; i--) {
      const atom = model.at(i);
      if (atom instanceof LeftRightAtom && atom.rightDelim === '?') {
        break;
      }
    }

    const match = model.at(i);
    if (i >= firstSibling && match instanceof LeftRightAtom) {
      match.rightDelim = fence;
      match.addChildren(
        model.extractAtoms([i, model.position]),
        atom.treeBranch
      );
      model.position = i;
      contentDidChange(model);
      return true;
    }

    // If we're inside a `leftright`, but not the last atom,
    // and the `leftright` right delim is indeterminate
    // adjust the body (put everything after the insertion point outside)
    if (parent instanceof LeftRightAtom && parent.rightDelim === '?') {
      parent.rightDelim = fence;

      parent.parent.addChildren(
        model.extractAtoms([model.position, model.offsetOf(atom.lastSibling)]),
        parent.treeBranch
      );
      model.position = model.offsetOf(parent);
      contentDidChange(model);

      return true;
    }

    // Is our grand-parent a 'leftright'?
    // If `\left(\frac{1}{x|}\right?` with the cursor at `|`
    // go up to the 'leftright' and apply it there instead
    const grandparent = parent.parent;
    if (
      grandparent instanceof LeftRightAtom &&
      grandparent.rightDelim === '?' &&
      model.at(model.position).isLastSibling
    ) {
      model.position = model.offsetOf(grandparent);
      return insertSmartFence(model, fence, style);
    }

    // Meh... We couldn't find a matching open fence. Just insert the
    // closing fence as a regular character
    return false;
  }

  return false;
}

new MathModeEditor();
