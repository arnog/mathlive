/* eslint-disable no-new */

import { MathfieldPrivate } from './mathfield-private';

import { InsertOptions, Offset, OutputFormat } from '../public/mathfield';
import type { Style } from '../public/core';
import MathfieldElement from '../public/mathfield-element';

import { requestUpdate } from './render';

import { range } from '../editor-model/selection-utils';
import { ModelPrivate } from '../editor-model/model-private';
import { applyStyleToUnstyledAtoms } from '../editor-model/styling';
import {
  contentDidChange,
  selectionDidChange,
  placeholderDidChange,
} from '../editor-model/listeners';
import {
  parseMathString,
  trimModeShiftCommand,
} from '../editor/parse-math-string';

import { ModeEditor } from './mode-editor';

import { RIGHT_DELIM, LEFT_DELIM } from '../core/delimiters';
import { parseLatex } from '../core/parser';
import { fromJson } from '../core/atom';
import { Atom } from '../core/atom-class';
import { ArrayAtom } from '../core-atoms/array';
import { LeftRightAtom } from '../core-atoms/leftright';
import { PlaceholderAtom } from '../core-atoms/placeholder';

import { Expression } from '@cortex-js/compute-engine/dist/types/math-json/math-json-format';

export class MathModeEditor extends ModeEditor {
  constructor() {
    super('math');
  }

  onPaste(mathfield: MathfieldPrivate, ev: ClipboardEvent): boolean {
    if (!ev.clipboardData) return false;
    let text = '';
    let format: 'auto' | OutputFormat = 'auto';

    //
    // 1/ Try to get serialized atoms
    //
    try {
      const atomJson = JSON.parse(
        ev.clipboardData.getData('application/json+mathlive')
      );
      if (atomJson && Array.isArray(atomJson)) {
        mathfield.snapshot();

        const atoms = fromJson(atomJson);
        const { model } = mathfield;
        if (!model.selectionIsCollapsed)
          model.deleteAtoms(range(model.selection));
        const cursor = model.at(model.position);
        cursor.parent!.addChildrenAfter(atoms, cursor);
        model.position = model.offsetOf(atoms[atoms.length - 1]);

        contentDidChange(model);
        requestUpdate(mathfield);

        ev.preventDefault();
        ev.stopPropagation();
        return true;
      }
    } catch {}

    //
    // 2/ Try to get a MathJSON data type
    //
    const json = ev.clipboardData.getData('application/json');
    if (json) {
      const expr = JSON.parse(json);
      if (typeof expr === 'object' && 'latex' in expr && expr.latex)
        text = expr.latex;
      if (!text) {
        try {
          const box = mathfield.computeEngine.box(expr);
          if (!box.has('Error')) text = box.latex;
        } catch {
          text = '';
        }
      }
      if (!text) format = 'latex';
    }

    //
    // 3/ Try to get raw LaTeX
    //

    if (!text) {
      text = ev.clipboardData.getData('application/x-latex');
      if (text) format = 'latex';
    }

    //
    // 4/ If that didn't work, try some plain text
    // (could be LaTeX, could be MathASCII)
    //
    if (!text) text = ev.clipboardData.getData('text/plain');

    if (text) {
      mathfield.snapshot();

      let wasLatex: boolean;
      [wasLatex, text] = trimModeShiftCommand(text);
      if (format === 'auto' && wasLatex) format = 'latex';
      if (
        this.insert(mathfield.model, text, {
          smartFence: mathfield.options.smartFence,
          colorMap: mathfield.colorMap,
          backgroundColorMap: mathfield.backgroundColorMap,
          format,
        })
      ) {
        contentDidChange(mathfield.model);
        requestUpdate(mathfield);
      }

      ev.preventDefault();
      ev.stopPropagation();
      return true;
    }

    return false;
  }

  insert(
    model: ModelPrivate,
    input: string | Expression,
    options: InsertOptions & {
      colorMap: (name: string) => string | undefined;
      backgroundColorMap: (name: string) => string | undefined;
    }
  ): boolean {
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
      if (options.insertionMode !== 'replaceAll') {
        const { parent } = model.at(model.position);
        if (
          parent instanceof LeftRightAtom &&
          parent.rightDelim === '?' &&
          model.at(model.position).isLastSibling &&
          typeof input === 'string' &&
          /^[)}\]|]$/.test(input)
        ) {
          parent.isDirty = true;
          parent.rightDelim = input;
          model.position += 1;
          selectionDidChange(model);
          contentDidChange(model);
          return true;
        }
      }
    } else if (
      model.selectionIsCollapsed &&
      typeof input === 'string' &&
      insertSmartFence(model, input, options.style)
    )
      return true;

    const { suppressChangeNotifications } = model;
    if (options.suppressChangeNotifications)
      model.suppressChangeNotifications = true;

    const contentWasChanging = model.suppressChangeNotifications;
    model.suppressChangeNotifications = true;

    //
    // Save the content of the selection, if any
    //
    const args: Record<string, string> = {};
    args[0] = model.getValue(model.selection, 'latex-unstyled');
    args['?'] = '\\placeholder{}';
    args['@'] = args['?'];

    //
    // Delete any selected items
    //
    if (
      options.insertionMode === 'replaceSelection' &&
      !model.selectionIsCollapsed
    )
      model.deleteAtoms(range(model.selection));
    else if (options.insertionMode === 'replaceAll') {
      model.root.setChildren([], 'body');
      model.position = 0;
    } else if (options.insertionMode === 'insertBefore')
      model.collapseSelection('backward');
    else if (options.insertionMode === 'insertAfter')
      model.collapseSelection('forward');

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
    }

    //
    // Calculate the implicit argument (#@)
    //
    if (args[0]) {
      // There was a selection, we'll use it for #@
      args['@'] = args[0];
    } else if (typeof input === 'string' && /(^|[^\\])#@/.test(input)) {
      // We'll use the preceding `mord`s or text mode atoms for it (implicit argument)
      const offset = getImplicitArgOffset(model);
      if (offset >= 0) {
        args['@'] = model.getValue(offset, model.position, 'latex-unstyled');
        model.deleteAtoms([offset, model.position]);
      }
    }

    if (!args[0]) args[0] = args['?'];

    let usedArg = false;
    const argFunction = (arg: string): string => {
      usedArg = true;
      return args[arg];
    };

    const [format, newAtoms] = convertStringToAtoms(
      model,
      input,
      argFunction,
      options
    );
    if (!newAtoms) return false;

    const placeholdersFound = findPlaceholders(newAtoms);

    const fillInTheBlankPlaceholders = placeholdersFound.filter(
      (atom) =>
        atom.placeholderId &&
        !model.mathfield._placeholders.has(atom.placeholderId)
    );

    // Remove placeholders that have a matching placeholder ID
    // (those are placeholders used for "fill-in-the-blank")
    const idsFound = placeholdersFound.map((atom) => atom.placeholderId);
    [...model.mathfield._placeholders.keys()]
      .filter((placeholderId) => !idsFound.includes(placeholderId))
      .forEach((placeholderId) => {
        if (model.mathfield._placeholders.has(placeholderId)) {
          model.mathfield._placeholders.get(placeholderId)?.field.remove();

          model.mathfield._placeholders.delete(placeholderId);
        }
      });

    fillInTheBlankPlaceholders.forEach((placeholder) => {
      console.assert(
        !!placeholder.placeholderId &&
          !model.mathfield._placeholders.has(placeholder.placeholderId)
      );
      const element = new MathfieldElement({
        virtualKeyboardMode: 'onfocus',
        readOnly: false,
        fontsDirectory: model.mathfield.options.fontsDirectory,
      });
      const container = model.mathfield.element?.querySelector(
        '.ML__placeholdercontainer'
      );

      element.value = placeholder.defaultValue?.length
        ? Atom.serialize(placeholder.defaultValue, { defaultMode: 'text' })
        : '';
      element.classList.add('nested-mathfield');
      element.style.display = 'inline-block';
      element.style.zIndex = '1001';
      element.style.position = 'absolute';
      element.style.minWidth = '30px';

      const style = document.createElement('style');
      style.textContent = `.nested-mathfield { border: 1px solid black; }
          .ML__container{ min-height:auto !important; }
          `;
      element.appendChild(style);
      element.addEventListener('input', () => {
        placeholderDidChange(model, placeholder.placeholderId!);
        // this timeout gives some time for a placeholder to render properly
        // before rendering the main field.
        setTimeout(() => requestUpdate(model.mathfield));
      });
      container?.appendChild(element);

      model.mathfield._placeholders.set(placeholder.placeholderId as string, {
        atom: placeholder,
        field: element,
      });
    });

    //
    // Insert the new atoms
    //
    const { parent } = model.at(model.position);
    // Are we inserting a fraction inside a lefright?
    if (
      format !== 'latex' &&
      model.options.removeExtraneousParentheses &&
      parent instanceof LeftRightAtom &&
      parent.leftDelim === '(' &&
      parent.hasEmptyBranch('body') &&
      newAtoms.length === 1 &&
      newAtoms[0].type === 'genfrac'
    ) {
      // Remove the leftright
      // i.e. `\left(\frac{}{}\right))` -> `\frac{}{}`
      const newParent = parent.parent!;
      const branch = parent.treeBranch!;
      newParent.removeChild(parent);
      newParent.setChildren(newAtoms, branch);
    }

    const hadEmptyBody = parent!.hasEmptyBranch('body');

    const cursor = model.at(model.position);
    cursor.parent!.addChildrenAfter(newAtoms, cursor);

    if (format === 'latex' && typeof input === 'string') {
      // If we are given a latex string with no arguments, store it as
      // "verbatim latex".
      // Caution: we can only do this if the `serialize()` for this parent
      // would return an empty string. If the latex is generated using other
      // properties than parent.body, for example by adding '\left.' and
      // '\right.' with a 'leftright' type, we can't use this shortcut.
      if (parent!.type === 'root' && hadEmptyBody && !usedArg)
        parent!.verbatimLatex = input;
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
      if (lastNewAtom) model.position = model.offsetOf(lastNewAtom);
    } else if (options.selectionMode === 'item')
      model.setSelection(model.anchor, model.offsetOf(lastNewAtom));

    contentDidChange(model);

    model.suppressChangeNotifications = suppressChangeNotifications;

    return true;
  }
}

function convertStringToAtoms(
  model: ModelPrivate,
  s: string | Expression,
  args: (arg: string) => string,
  options: InsertOptions & {
    colorMap: (name: string) => string | undefined;
    backgroundColorMap: (name: string) => string | undefined;
  }
): [OutputFormat, Atom[]] {
  let format: OutputFormat | undefined = undefined;
  let result: Atom[] = [];

  if (typeof s !== 'string' || options.format === 'math-json') {
    [format, s] = [
      'latex',
      model.mathfield.computeEngine.box(s as Expression).latex as string,
    ];
    result = parseLatex(s, {
      parseMode: 'math',
      macros: options?.macros,
      onError: model.listeners.onError,
      colorMap: options.colorMap,
      backgroundColorMap: options.backgroundColorMap,
    });
  } else if (typeof s === 'string' && options.format === 'ascii-math') {
    [format, s] = parseMathString(s, {
      format: 'ascii-math',
      inlineShortcuts: model.mathfield.options.inlineShortcuts,
    });
    result = parseLatex(s, {
      parseMode: 'math',
      macros: options?.macros,
      onError: model.listeners.onError,
      colorMap: options.colorMap,
      backgroundColorMap: options.backgroundColorMap,
    });

    // Simplify result.
    if (format !== 'latex' && model.options.removeExtraneousParentheses)
      simplifyParen(result);
  } else if (options.format === 'auto' || options.format === 'latex') {
    if (options.format === 'auto') {
      [format, s] = parseMathString(s, {
        format: 'auto',
        inlineShortcuts: model.mathfield.options.inlineShortcuts,
      });
    }

    // If the whole string is bracketed by a mode shift command, remove it
    if (options.format === 'latex') [, s] = trimModeShiftCommand(s);

    result = parseLatex(s, {
      parseMode: 'math',
      args: args,
      macros: { ...model.options.macros, ...(options.macros ?? {}) },
      smartFence: options.smartFence,
      onError: model.listeners.onError,
      colorMap: options.colorMap,
      backgroundColorMap: options.backgroundColorMap,
    });

    // Simplify result.
    if (options.format !== 'latex' && model.options.removeExtraneousParentheses)
      simplifyParen(result);
  }

  //
  // Some atoms may already have a style (for example if there was an
  // argument, i.e. the selection, that this was applied to).
  // So, don't apply style to atoms that are already styled, but *do*
  // apply it to newly created atoms that have no style yet.
  //
  applyStyleToUnstyledAtoms(result, options.style);

  return [format ?? 'latex', result];
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
  )
    return atom.removeBranch('body');

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
      for (let j = 0; atom.body![j]; j++) {
        if (atom.body![j].type === 'genfrac') {
          genFracCount++;
          genFracIndex = j;
        }

        nonGenFracCount++;
      }

      if (nonGenFracCount === 0 && genFracCount === 1) {
        // This is a single frac inside a leftright: remove the leftright
        atoms[i] = atom.body![genFracIndex];
      }
    }
  }

  for (const atom of atoms) {
    for (const branch of atom.branches) {
      if (!atom.hasEmptyBranch(branch)) {
        simplifyParen(atom.branch(branch)!);
        const newChildren = removeParen(atom.branch(branch)!);
        if (newChildren) atom.setChildren(newChildren, branch);
      }
    }

    if (atom instanceof ArrayAtom) for (const x of atom.cells) simplifyParen(x);
  }
}

function findPlaceholders(atoms: Atom[]): PlaceholderAtom[] {
  if (!atoms) return [];
  const result: PlaceholderAtom[] = [];
  for (const atom of atoms) {
    for (const branch of atom.branches) {
      if (!atom.hasEmptyBranch(branch)) {
        const branchPlaceholder = findPlaceholders(atom.branch(branch)!);
        result.push(...branchPlaceholder);
      }
    }

    if (atom instanceof PlaceholderAtom) result.push(atom);
  }

  return result;
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
    while (!atom.isFirstSibling && atom.mode === 'text')
      atom = atom.leftSibling;

    return model.offsetOf(atom);
  }

  // Find the first 'mrel', 'mbin', etc... to the left of the insertion point
  // until the first sibling.
  // Terms inside of delimiters (parens, brackets, etc) are grouped and kept together.
  const atomAtCursor = atom;
  const delimiterStack: string[] = [];

  while (
    !atom.isFirstSibling &&
    (isImplicitArg(atom) || delimiterStack.length > 0)
  ) {
    if (atom.type === 'mclose') delimiterStack.unshift(atom.value);

    if (
      atom.type === 'mopen' &&
      delimiterStack.length > 0 &&
      atom.value === LEFT_DELIM[delimiterStack[0]]
    )
      delimiterStack.shift();

    atom = atom.leftSibling;
  }

  if (atomAtCursor === atom) return -1;

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
  if (/^(mord|surd|msubsup|leftright|mop|mclose)$/.test(atom.type)) {
    // Exclude `\int`, \`sum`, etc...
    if (atom.isExtensibleSymbol) return false;
    // Exclude trig functions (they can be written as `\sin \frac\pi3` without parens)
    if (atom.isFunction) return false;
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
  style?: Style
): boolean {
  console.assert(model.selectionIsCollapsed);
  const atom = model.at(model.position);
  const { parent } = atom;
  let delims =
    parent instanceof LeftRightAtom
      ? parent.leftDelim! + parent.rightDelim!
      : '';
  if (delims === '\\lbrace\\rbrace') delims = '{}';
  if (delims === '\\{\\}') delims = '{}';
  if (delims === '\\lparen\\rparen') delims = '()';

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
    ModeEditor.insert('math', model, `\\left${fence}\\right?`, {
      format: 'latex',
      style,
    });
    // If there is content after the anchor, move it into the `leftright` atom
    if (atom.lastSibling.type !== 'first') {
      const lastSiblingOffset = model.offsetOf(atom.lastSibling);
      const content = model.extractAtoms([model.position, lastSiblingOffset]);
      model.at(model.position).body = content;
      model.position -= 1;
    }
    return true;
  }

  //
  // 3. Is it a close fence?
  //
  let lDelim = '';
  Object.keys(RIGHT_DELIM).forEach((delim) => {
    if (fence === RIGHT_DELIM[delim]) lDelim = delim;
  });
  if (lDelim) {
    // We found a matching open fence, so it was a valid close fence.
    // Note that `lDelim` may not match `fence`. That's OK.

    // If we're the last atom inside a 'leftright',
    // update the parent
    if (parent instanceof LeftRightAtom && atom.isLastSibling) {
      parent.isDirty = true;
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
      if (atom instanceof LeftRightAtom && atom.rightDelim === '?') break;
    }

    const match = model.at(i);
    if (i >= firstSibling && match instanceof LeftRightAtom) {
      match.rightDelim = fence;
      match.addChildren(
        model.extractAtoms([i, model.position]),
        atom.treeBranch!
      );
      model.position = i;
      contentDidChange(model);
      return true;
    }

    // If we're inside a `leftright`, but not the last atom,
    // and the `leftright` right delim is indeterminate
    // adjust the body (put everything after the insertion point outside)
    if (parent instanceof LeftRightAtom && parent.rightDelim === '?') {
      parent.isDirty = true;
      parent.rightDelim = fence;

      parent.parent!.addChildren(
        model.extractAtoms([model.position, model.offsetOf(atom.lastSibling)]),
        parent.treeBranch!
      );
      model.position = model.offsetOf(parent);
      contentDidChange(model);

      return true;
    }

    // Is our grand-parent a 'leftright'?
    // If `\left(\frac{1}{x|}\right?` with the cursor at `|`
    // go up to the 'leftright' and apply it there instead
    const grandparent = parent!.parent;
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
