/* eslint-disable no-new */

import type { Expression } from '@cortex-js/compute-engine/dist/types/math-json';

import type { InsertOptions, Offset, OutputFormat } from '../public/core-types';

import { requestUpdate } from './render';

import { LEFT_DELIM } from '../core/delimiters';
import { parseLatex } from '../core/parser';
import { fromJson } from '../core/atom';
import { Atom } from '../core/atom-class';
import { ArrayAtom } from '../atoms/array';
import { LeftRightAtom } from '../atoms/leftright';

import { range } from '../editor-model/selection-utils';
import { _Model } from '../editor-model/model-private';
import { applyStyleToUnstyledAtoms } from '../editor-model/styling';
import {
  parseMathString,
  trimModeShiftCommand,
} from '../formats/parse-math-string';

import { _Mathfield } from './mathfield-private';
import { ModeEditor } from './mode-editor';
import type { AtomJson } from 'core/types';

export class MathModeEditor extends ModeEditor {
  constructor() {
    super('math');
  }

  onPaste(mathfield: _Mathfield, data: DataTransfer | string | null): boolean {
    if (!data) return false;

    if (
      !mathfield.model.contentWillChange({
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
        const atomJson: AtomJson | AtomJson[] = JSON.parse(json);
        if (atomJson && Array.isArray(atomJson)) {
          mathfield.snapshot();

          const atoms = fromJson(atomJson) as unknown as Atom[];
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

          model.contentDidChange({ inputType: 'insertFromPaste' });
          requestUpdate(mathfield);

          return true;
        }
      } catch {}
    }

    //
    // 2/ Try to get a MathJSON data type
    //
    json = typeof data !== 'string' ? data.getData('application/json') : '';
    if (json && globalThis.MathfieldElement.computeEngine) {
      try {
        const expr = JSON.parse(json);
        if (typeof expr === 'object' && 'latex' in expr && expr.latex)
          text = expr.latex;
        if (!text) {
          const box = globalThis.MathfieldElement.computeEngine.box(expr);
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
    // (could be LaTeX, could be ASCIIMath)
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

  insert(model: _Model, input: string, options: InsertOptions): boolean {
    const data =
      typeof input === 'string'
        ? input
        : globalThis.MathfieldElement.computeEngine?.box(input).latex ?? '';

    if (
      !options.silenceNotifications &&
      !model.contentWillChange({ data, inputType: 'insertText' })
    )
      return false;

    if (!options.insertionMode) options.insertionMode = 'replaceSelection';
    if (!options.selectionMode) options.selectionMode = 'placeholder';
    if (!options.format) options.format = 'auto';

    const { silenceNotifications } = model;
    if (options.silenceNotifications) model.silenceNotifications = true;

    const contentWasChanging = model.silenceNotifications;
    model.silenceNotifications = true;

    //
    // 1/ Calculate the arguments (#0, #@, #?)
    //

    const args: Record<string, string> = {
      '?': '\\placeholder{}',
      '@': '\\placeholder{}',
    };

    // 1.1/ Save the content of the selection, if any
    args[0] =
      options.insertionMode === 'replaceAll'
        ? ''
        : model.getValue(model.selection, 'latex-unstyled');

    //
    // Delete any selected items
    //
    if (options.insertionMode === 'replaceSelection')
      model.deleteAtoms(range(model.selection));
    else if (options.insertionMode === 'replaceAll') model.deleteAtoms();
    else if (options.insertionMode === 'insertBefore')
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
    let implicitArgumentOffset = -1;
    if (args[0]) {
      // There was a selection, we'll use it for #@
      args['@'] = args[0];
    } else if (typeof input === 'string' && /(^|[^\\])#@/.test(input)) {
      // We'll use the preceding `mord`s for it (implicit argument)
      implicitArgumentOffset = getImplicitArgOffset(model);
      if (implicitArgumentOffset >= 0) {
        args['@'] = model.getValue(
          implicitArgumentOffset,
          model.position,
          'latex'
        );
      }
    }

    if (!args[0]) args[0] = args['?'];

    //
    // 2/ Make atoms for the input
    //

    let usedArg = false;
    const argFunction = (arg: string): string => {
      usedArg = true;
      return args[arg];
    };

    let [format, newAtoms] = convertStringToAtoms(
      model,
      input,
      argFunction,
      options
    );
    if (!newAtoms) return false;

    const insertingFraction =
      newAtoms.length === 1 && newAtoms[0].type === 'genfrac';

    if (
      insertingFraction &&
      implicitArgumentOffset >= 0 &&
      typeof model.mathfield.options.isImplicitFunction === 'function' &&
      model.mathfield.options.isImplicitFunction(
        model.at(model.position).command
      )
    ) {
      // If this is a fraction, and the implicit argument is a function,
      // try again, but without the implicit argument
      // If `\sin` and a fraction is inserted, we want `\sin \frac{}{}`,
      // not `\frac{\sin{}}{}`
      args['@'] = args['?'];
      usedArg = false;
      [format, newAtoms] = convertStringToAtoms(
        model,
        input,
        argFunction,
        options
      );
    } else if (implicitArgumentOffset >= 0) {
      // Remove implicit argument
      model.deleteAtoms([implicitArgumentOffset, model.position]);
    }

    //
    // 3/ Insert the new atoms
    //

    if (newAtoms.length === 1 && newAtoms[0].isRoot) {
      model.root = newAtoms[0];
    } else {
      const { parent } = model.at(model.position);
      const hadEmptyBody = parent!.hasEmptyBranch('body');

      // Are we inserting a fraction inside a leftright?
      if (
        insertingFraction &&
        format !== 'latex' &&
        model.mathfield.options.removeExtraneousParentheses &&
        parent instanceof LeftRightAtom &&
        parent.leftDelim === '(' &&
        hadEmptyBody
      ) {
        // Remove the leftright
        // i.e. `\left(\frac{}{}\right))` -> `\frac{}{}`
        const newParent = parent.parent!;
        const branch = parent.parentBranch!;
        newParent.removeChild(parent);
        newParent.setChildren(newAtoms, branch);
      }

      const cursor = model.at(model.position);
      cursor.parent!.addChildrenAfter(newAtoms, cursor);

      if (format === 'latex' && typeof input === 'string') {
        // If we are given a latex string with no arguments, store it as
        // "verbatim latex".
        // Caution: we can only do this if the `serialize()` for this parent
        // would return an empty string. If the latex is generated using other
        // properties than parent.body, for example by adding '\left.' and
        // '\right.' with a 'leftright' type, we can't use this shortcut.
        if (parent?.type === 'root' && hadEmptyBody && !usedArg)
          parent!.verbatimLatex = input;
      }
    }

    //
    // 4/ Prepare to dispatch notifications
    // (for selection changes, then content change)
    //
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
      } else if (lastNewAtom?.body?.length) {
        // Some commands have a body which behaves like a placeholder (such as square root)
        const body = lastNewAtom.body;
        model.setSelection(
          model.offsetOf(body[0]),
          model.offsetOf(body[body.length - 1]) + 1
        );
      } else {
        // No placeholder found, move to right after what we just inserted
        model.position = model.offsetOf(lastNewAtom);
      }
    } else if (options.selectionMode === 'before') {
      // Do nothing: don't change the position.
    } else if (options.selectionMode === 'after') {
      if (lastNewAtom) model.position = model.offsetOf(lastNewAtom);
    } else if (options.selectionMode === 'item')
      model.setSelection(model.anchor, model.offsetOf(lastNewAtom));

    model.contentDidChange({ data, inputType: 'insertText' });

    model.silenceNotifications = silenceNotifications;

    return true;
  }
}

function convertStringToAtoms(
  model: _Model,
  s: string | Expression,
  args: (arg: string) => string,
  options: InsertOptions
): [OutputFormat, Readonly<Atom[]>] {
  let format: OutputFormat | undefined = undefined;
  let result: Readonly<Atom[]> = [];

  if (typeof s !== 'string' || options.format === 'math-json') {
    const ce = globalThis.MathfieldElement.computeEngine;
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
      result = result.map((x) => removeExtraneousParenthesis(x));
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
      result = result.map((x) => removeExtraneousParenthesis(x));
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

function removeExtraneousParenthesis(atom: Atom): Atom {
  if (
    atom instanceof LeftRightAtom &&
    atom.leftDelim !== '(' &&
    atom.rightDelim === ')'
  ) {
    const children = atom.body?.filter((x) => x.type !== 'first');
    // If this is a single frac inside a leftright: remove the leftright
    if (children?.length === 1 && children[0].type === 'genfrac')
      return children[0];
  }

  for (const branch of atom.branches) {
    if (!atom.hasEmptyBranch(branch)) {
      atom.setChildren(
        atom.branch(branch)!.map((x) => removeExtraneousParenthesis(x)),
        branch
      );
    }
  }

  if (atom instanceof ArrayAtom) {
    atom.forEachCell((cell, row, column) => {
      atom.setCell(
        row,
        column,
        cell.map((x) => removeExtraneousParenthesis(x))
      );
    });
  }

  return atom;
}

/**
 * Locate the offset before the insertion point that would indicate
 * a good place to select as an implicit argument.
 *
 * For example with '1+\sin(x)', if the insertion point is at the
 * end, the implicit arg offset would be after the plus. As a result,
 * inserting a fraction after the sin would yield: '1+\frac{\sin(x)}{\placeholder{}}'
 */
function getImplicitArgOffset(model: _Model): Offset {
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
  // A digit, or a decimal point
  if (atom.isDigit()) return true;
  if (
    atom.type &&
    /^(mord|surd|subsup|leftright|mop|mclose)$/.test(atom.type)
  ) {
    // Exclude `\int`, \`sum`, etc...
    if (atom.type === 'extensible-symbol') return false;

    return true;
  }

  return false;
}

new MathModeEditor();
