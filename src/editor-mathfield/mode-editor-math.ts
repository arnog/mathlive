/* eslint-disable no-new */

import type { Expression } from '@cortex-js/compute-engine/dist/types/math-json/math-json-format';

import { InsertOptions, Offset, OutputFormat } from '../public/mathfield';

import { requestUpdate } from './render';

import { RIGHT_DELIM, LEFT_DELIM } from '../core/delimiters';
import { parseLatex } from '../core/parser';
import { fromJson } from '../core/atom';
import { Atom } from '../core/atom-class';
import { ArrayAtom } from '../core-atoms/array';
import { LeftRightAtom } from '../core-atoms/leftright';

import { range } from '../editor-model/selection-utils';
import { ModelPrivate } from '../editor-model/model-private';
import { applyStyleToUnstyledAtoms } from '../editor-model/styling';
import {
  contentDidChange,
  selectionDidChange,
  contentWillChange,
} from '../editor-model/listeners';
import {
  parseMathString,
  trimModeShiftCommand,
} from '../editor/parse-math-string';

import { MathfieldPrivate } from './mathfield-private';
import { ModeEditor } from './mode-editor';
import type { Style } from '../public/core-types';

export class MathModeEditor extends ModeEditor {
  constructor() {
    super('math');
  }

  onPaste(
    mathfield: MathfieldPrivate,
    data: DataTransfer | string | null
  ): boolean {
    if (!data) return false;

    if (
      !contentWillChange(mathfield.model, {
        data: typeof data === 'string' ? data : null,
        dataTransfer: typeof data === 'string' ? null : data,
        inputType: 'insertFromPaste',
      })
    )
      return false;

    let text = '';
    let format: 'auto' | OutputFormat = 'auto';

    //
    // 1/ Try to get serialized atoms
    //
    let json =
      typeof data !== 'string' ? data.getData('application/json+mathlive') : '';
    if (json) {
      try {
        const atomJson = JSON.parse(json);
        if (atomJson && Array.isArray(atomJson)) {
          mathfield.snapshot();

          const atoms = fromJson(atomJson);
          const { model } = mathfield;
          if (!model.selectionIsCollapsed)
            model.deleteAtoms(range(model.selection));
          const cursor = model.at(model.position);

          if (cursor.parent instanceof ArrayAtom) {
            console.assert(cursor.parentBranch !== undefined);
            // use 'first' atoms as environment column delimiter
            const columns: Atom[][] = [];
            let buffer: Atom[] = [];
            // trim 'first' from array of atoms
            if (atoms[0].type === 'first') atoms.shift();
            if (atoms[atoms.length - 1].type === 'first') atoms.pop();
            for (const atom of atoms) {
              if (atom.type === 'first' && buffer.length > 0) {
                columns.push(buffer);
                buffer = [atom];
              } else buffer.push(atom);
            }
            if (buffer.length > 0) columns.push(buffer);

            // expand environment columns to paste size
            let currentRow = Number(cursor.parentBranch![0]);
            let currentColumn = Number(cursor.parentBranch![1]);
            const maxColumns = cursor.parent.maxColumns;
            while (
              cursor.parent.colCount - currentColumn < columns.length &&
              cursor.parent.colCount < maxColumns
            )
              cursor.parent.addColumn();

            // add content to the first cell
            cursor.parent.addChildrenAfter(columns[0], cursor);
            // replace the rest of the columns
            for (let i = 1; i < columns.length; i++) {
              currentColumn++;
              if (currentColumn >= maxColumns) {
                currentColumn = 0;
                cursor.parent.addRowAfter(currentRow);
                currentRow++;
              }
              cursor.parent.setCell(currentRow, currentColumn, columns[i]);
            }
          } else {
            cursor.parent!.addChildrenAfter(
              atoms.filter((a) => a.type !== 'first'),
              cursor
            );
          }

          model.position = model.offsetOf(atoms[atoms.length - 1]);

          contentDidChange(model, { inputType: 'insertFromPaste' });
          requestUpdate(mathfield);

          return true;
        }
      } catch {}
    }

    //
    // 2/ Try to get a MathJSON data type
    //
    json = typeof data !== 'string' ? data.getData('application/json') : '';
    if (json && window.MathfieldElement.computeEngine) {
      try {
        const expr = JSON.parse(json);
        if (typeof expr === 'object' && 'latex' in expr && expr.latex)
          text = expr.latex;
        if (!text) {
          const box = window.MathfieldElement.computeEngine.box(expr);
          if (box && !box.has('Error')) text = box.latex;
        }
        if (!text) format = 'latex';
      } catch {}
    }

    //
    // 3/ Try to get raw LaTeX
    //

    if (!text && typeof data !== 'string') {
      text = data.getData('application/x-latex');
      if (text) format = 'latex';
    }

    //
    // 4/ If that didn't work, try some plain text
    // (could be LaTeX, could be MathASCII)
    //
    if (!text)
      text = typeof data === 'string' ? data : data.getData('text/plain');

    if (text) {
      let wasLatex: boolean;
      [wasLatex, text] = trimModeShiftCommand(text);
      if (format === 'auto' && wasLatex) format = 'latex';
      mathfield.stopCoalescingUndo();
      mathfield.stopRecording();
      if (this.insert(mathfield.model, text, { format })) {
        mathfield.startRecording();
        mathfield.snapshot('paste');
        requestUpdate(mathfield);
      }
      mathfield.startRecording();
      return true;
    }

    return false;
  }

  insert(
    model: ModelPrivate,
    input: string | Expression,
    options: InsertOptions
  ): boolean {
    const data =
      typeof input === 'string'
        ? input
        : window.MathfieldElement.computeEngine?.box(input).latex ?? '';
    if (
      !options.silenceNotifications &&
      !contentWillChange(model, { data, inputType: 'insertText' })
    )
      return false;
    if (!options.insertionMode) options.insertionMode = 'replaceSelection';
    if (!options.selectionMode) options.selectionMode = 'placeholder';
    if (!options.format) options.format = 'auto';

    //
    // Try to insert a smart fence.
    //
    if (!model.mathfield.smartFence) {
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
          contentDidChange(model, { data, inputType: 'insertText' });
          return true;
        }
      }
    } else if (
      model.selectionIsCollapsed &&
      typeof input === 'string' &&
      insertSmartFence(model, input, options.style)
    )
      return true;

    const { silenceNotifications } = model;
    if (options.silenceNotifications) model.silenceNotifications = true;

    const contentWasChanging = model.silenceNotifications;
    model.silenceNotifications = true;

    //
    // Save the content of the selection, if any
    //
    const args: Record<string, string> = {};
    args[0] =
      options.insertionMode === 'replaceAll'
        ? ''
        : model.getValue(model.selection, 'latex-unstyled');
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

    //
    // Insert the new atoms
    //
    const { parent } = model.at(model.position);
    // Are we inserting a fraction inside a leftright?
    if (
      format !== 'latex' &&
      model.mathfield.options.removeExtraneousParentheses &&
      parent instanceof LeftRightAtom &&
      parent.leftDelim === '(' &&
      parent.hasEmptyBranch('body') &&
      newAtoms.length === 1 &&
      newAtoms[0].type === 'genfrac'
    ) {
      // Remove the leftright
      // i.e. `\left(\frac{}{}\right))` -> `\frac{}{}`
      const newParent = parent.parent!;
      const branch = parent.parentBranch!;
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
      if (!parent!.parent && hadEmptyBody && !usedArg)
        parent!.verbatimLatex = input;
    }

    // Prepare to dispatch notifications
    // (for selection changes, then content change)
    model.silenceNotifications = contentWasChanging;

    const lastNewAtom = newAtoms[newAtoms.length - 1];

    //
    // Update the anchor's location
    //
    if (options.selectionMode === 'placeholder') {
      // Move to the next placeholder
      const placeholder = newAtoms
        .flatMap((x) => [x, ...x.children])
        .find((x) => x.type === 'placeholder');

      if (placeholder) {
        const placeholderOffset = model.offsetOf(placeholder);
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

    contentDidChange(model, { data, inputType: 'insertText' });

    model.silenceNotifications = silenceNotifications;

    return true;
  }
}

function convertStringToAtoms(
  model: ModelPrivate,
  s: string | Expression,
  args: (arg: string) => string,
  options: InsertOptions
): [OutputFormat, Atom[]] {
  let format: OutputFormat | undefined = undefined;
  let result: Atom[] = [];

  if (typeof s !== 'string' || options.format === 'math-json') {
    const ce = window.MathfieldElement.computeEngine;
    if (!ce) return ['math-json', []];

    [format, s] = ['latex', ce.box(s as Expression).latex as string];
    result = parseLatex(s, { context: model.mathfield.context });
  } else if (typeof s === 'string' && options.format === 'ascii-math') {
    [format, s] = parseMathString(s, {
      format: 'ascii-math',
      inlineShortcuts: model.mathfield.options.inlineShortcuts,
    });
    result = parseLatex(s, { context: model.mathfield.context });

    // Simplify result.
    if (
      format !== 'latex' &&
      model.mathfield.options.removeExtraneousParentheses
    )
      simplifyParen(result);
  } else if (options.format === 'auto' || options.format?.startsWith('latex')) {
    if (options.format === 'auto') {
      [format, s] = parseMathString(s, {
        format: 'auto',
        inlineShortcuts: model.mathfield.options.inlineShortcuts,
      });
    }

    // If the whole string is bracketed by a mode shift command, remove it
    if (options.format === 'latex') [, s] = trimModeShiftCommand(s);

    result = parseLatex(s, {
      context: model.mathfield.context,
      args: args,
    });

    // Simplify result.
    if (
      options.format !== 'latex' &&
      model.mathfield.options.removeExtraneousParentheses
    )
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
  let afterDelim = false;

  if (atom.type === 'mclose') {
    const delim = LEFT_DELIM[atom.value];
    while (
      !atom.isFirstSibling &&
      !(atom.type === 'mopen' && atom.value === delim)
    )
      atom = atom.leftSibling;
    if (!atom.isFirstSibling) atom = atom.leftSibling;
    afterDelim = true;
  } else if (atom.type === 'leftright') {
    atom = atom.leftSibling;
    afterDelim = true;
  }

  if (afterDelim) {
    while (!atom.isFirstSibling && (atom.isFunction || isImplicitArg(atom)))
      atom = atom.leftSibling;
  } else {
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

function isValidClose(open: string | undefined, close: string): boolean {
  if (!open) return true;

  if (
    ['(', '{', '[', '\\lbrace', '\\lparen', '\\{', '\\lbrack'].includes(open)
  ) {
    return [')', '}', ']', '\\rbrace', '\\rparen', '\\}', '\\rbrack'].includes(
      close
    );
  }
  return RIGHT_DELIM[open] === close;
}

function isValidOpen(open: string, close: string | undefined): boolean {
  if (!close) return true;

  if (
    [')', '}', ']', '\\rbrace', '\\rparen', '\\}', '\\rbrack'].includes(close)
  ) {
    return ['(', '{', '[', '\\lbrace', '\\lparen', '\\{', '\\lbrack'].includes(
      open
    );
  }
  return LEFT_DELIM[close] === open;
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

  // Normalize some fences.
  // Note that '{' and '}' are not valid braces.
  // They should be '\{' or '\lbrace' and '\}' or '\rbrace'
  if (fence === '{' || fence === '\\{') fence = '\\lbrace';
  if (fence === '}' || fence === '\\}') fence = '\\rbrace';
  if (fence === '[') fence = '\\lbrack';
  if (fence === ']') fence = '\\rbrack';

  //
  // 1. Are we inserting a middle fence?
  // ...as in {...|...}
  //
  if (/\||\\vert|\\Vert|\\mvert|\\mid/.test(fence)) {
    let delims =
      parent instanceof LeftRightAtom
        ? parent.leftDelim! + parent.rightDelim!
        : '';
    if (delims === '\\lbrace\\rbrace') delims = '{}';
    if (delims === '\\{\\}') delims = '{}';
    if (delims === '\\lparen\\rparen') delims = '()';
    if (delims === '{}') {
      ModeEditor.insert(model, '\\,\\middle' + fence + '\\, ', {
        format: 'latex',
        style,
      });
      return true;
    }
  }

  //
  // 2. Is it an open fence?
  //
  const rDelim = RIGHT_DELIM[fence];
  if (rDelim) {
    if (
      parent instanceof LeftRightAtom &&
      parent.firstChild === atom && // At first child
      (parent.leftDelim! === '?' || parent.leftDelim! === '.')
    ) {
      parent.leftDelim = fence;
      parent.isDirty = true;
      contentDidChange(model, { data: fence, inputType: 'insertText' });
      return true;
    }

    // Is there a matching right delim as a right sibling?
    if (!(parent instanceof LeftRightAtom)) {
      let sibling = atom;
      while (sibling) {
        if (sibling.type === 'mclose' && sibling.value === rDelim) break;
        sibling = sibling.rightSibling;
      }

      if (sibling) {
        // We've found a matching sibling
        const body = model.extractAtoms([
          model.offsetOf(atom),
          model.offsetOf(sibling),
        ]);
        body.pop();
        parent!.addChildrenAfter(
          [
            new LeftRightAtom('left...right', body, {
              leftDelim: fence,
              rightDelim: rDelim,
            }),
          ],
          atom
        );
        model.position = model.offsetOf(parent!.firstChild) + 1;
        contentDidChange(model, { data: fence, inputType: 'insertText' });
        return true;
      }
    }

    // If we have a `leftright` sibling to our right
    // with an indeterminate left fence,
    // move what's between us and the `leftright` inside the `leftright`
    const lastSibling = model.offsetOf(atom.lastSibling);
    let i: number;
    for (i = model.position; i <= lastSibling; i++) {
      const atom = model.at(i);
      if (
        atom instanceof LeftRightAtom &&
        (atom.leftDelim === '?' || atom.leftDelim === '.') &&
        isValidOpen(fence, atom.rightDelim)
      )
        break;
    }

    const match = model.at(i);
    if (i <= lastSibling && match instanceof LeftRightAtom) {
      match.leftDelim = fence;

      let extractedAtoms = model.extractAtoms([model.position, i - 1]);
      // remove any atoms of type 'first'
      extractedAtoms = extractedAtoms.filter((value) => value.type !== 'first');
      match.addChildren(extractedAtoms, match.parentBranch!);

      model.position += 1;
      contentDidChange(model, { data: fence, inputType: 'insertText' });
      return true;
    }

    // If we're inside a `leftright`, but not the first atom,
    // and the `leftright` left delim is indeterminate
    // adjust the body (put everything before the insertion point outside)
    if (
      parent instanceof LeftRightAtom &&
      (parent.leftDelim === '?' || parent.leftDelim === '.') &&
      isValidOpen(fence, parent.rightDelim)
    ) {
      parent.isDirty = true;
      parent.leftDelim = fence;

      const extractedAtoms = model.extractAtoms([
        model.offsetOf(atom.firstSibling),
        model.position,
      ]);

      for (const extractedAtom of extractedAtoms)
        parent.parent!.addChildBefore(extractedAtom, parent);

      //model.position = model.offsetOf(parent);
      contentDidChange(model, { data: fence, inputType: 'insertText' });

      return true;
    }

    if (!(parent instanceof LeftRightAtom && parent.leftDelim === '|')) {
      // We have a valid open fence as input
      ModeEditor.insert(model, `\\left${fence}\\right?`, {
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
  }

  //
  // 3. Is it a close fence?
  //
  const targetLeftDelim = LEFT_DELIM[fence];
  if (targetLeftDelim) {
    // We found a target open fence matching this delim.
    // Note that `targetLeftDelim` may not match `fence`. That's OK.

    // Check if there's a stand-alone sibling atom matching...
    let sibling = atom;
    while (sibling) {
      // There is a left sibling that matches: make a leftright
      if (sibling.type === 'mopen' && sibling.value === targetLeftDelim) {
        const insertAfter = sibling.leftSibling!;
        const body = model.extractAtoms([
          model.offsetOf(sibling.leftSibling),
          model.offsetOf(atom),
        ]);
        body.shift();
        const result = new LeftRightAtom('left...right', body, {
          leftDelim: targetLeftDelim,
          rightDelim: fence,
        });

        parent!.addChildrenAfter([result], insertAfter);
        model.position = model.offsetOf(result);
        contentDidChange(model, { data: fence, inputType: 'insertText' });
        return true;
      }
      sibling = sibling.leftSibling;
    }

    // If we're the last atom inside a 'leftright', update the parent
    if (
      parent instanceof LeftRightAtom &&
      atom.isLastSibling &&
      isValidClose(parent.leftDelim, fence)
    ) {
      parent.isDirty = true;
      parent.rightDelim = fence;
      model.position += 1;
      contentDidChange(model, { data: fence, inputType: 'insertText' });
      return true;
    }

    // If we have a `leftright` sibling to our left
    // with an indeterminate right fence,
    // move what's between us and the `leftright` inside the `leftright`
    const firstSibling = model.offsetOf(atom.firstSibling);
    let i: number;
    for (i = model.position; i >= firstSibling; i--) {
      const atom = model.at(i);
      if (
        atom instanceof LeftRightAtom &&
        (atom.rightDelim === '?' || atom.rightDelim === '.') &&
        isValidClose(atom.leftDelim, fence)
      )
        break;
    }

    const match = model.at(i);
    if (i >= firstSibling && match instanceof LeftRightAtom) {
      match.rightDelim = fence;
      match.addChildren(
        model.extractAtoms([i, model.position]),
        match.parentBranch!
      );
      contentDidChange(model, { data: fence, inputType: 'insertText' });
      return true;
    }

    // If we're inside a `leftright`, but not the last atom,
    // and the `leftright` right delim is indeterminate
    // adjust the body (put everything after the insertion point outside)
    if (
      parent instanceof LeftRightAtom &&
      (parent.rightDelim === '?' || parent.rightDelim === '.') &&
      isValidClose(parent.leftDelim, fence)
    ) {
      parent.isDirty = true;
      parent.rightDelim = fence;

      parent.parent!.addChildren(
        model.extractAtoms([model.position, model.offsetOf(atom.lastSibling)]),
        parent.parentBranch!
      );
      model.position = model.offsetOf(parent);
      contentDidChange(model, { data: fence, inputType: 'insertText' });

      return true;
    }

    // Is our grand-parent a 'leftright'?
    // If `\left(\frac{1}{x|}\right?` with the cursor at `|`
    // go up to the 'leftright' and apply it there instead
    const grandparent = parent!.parent;
    if (
      grandparent instanceof LeftRightAtom &&
      (grandparent.rightDelim === '?' || grandparent.rightDelim === '.') &&
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
