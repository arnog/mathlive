/* eslint-disable no-new */
import { Offset, Range, InsertOptions } from '../public/mathfield';
import { LatexAtom, LatexGroupAtom } from '../core-atoms/latex';
import { range } from '../editor-model/selection-utils';
import { Atom } from '../core/atom-class';
import { ModelPrivate } from '../editor-model/model-private';
import { contentDidChange, contentWillChange } from '../editor-model/listeners';

import { MathfieldPrivate } from './mathfield-private';
import { requestUpdate } from './render';
import { ModeEditor } from './mode-editor';
import { COMMAND_MODE_CHARACTERS } from '../core-definitions/definitions';
import type { GlobalContext } from '../core/types';
import type { Style } from '../public/core-types';

export class LatexModeEditor extends ModeEditor {
  constructor() {
    super('latex');
  }

  createAtom(
    command: string,
    context: GlobalContext,
    _style?: Style
  ): Atom | null {
    return new LatexAtom(command, context);
  }

  onPaste(
    mathfield: MathfieldPrivate,
    data: DataTransfer | string | null
  ): boolean {
    if (!data) return false;
    const text =
      typeof data === 'string'
        ? data
        : data.getData('text/x-latex') ?? data.getData('text/plain');

    if (
      text &&
      contentWillChange(mathfield.model, {
        inputType: 'insertFromPaste',
        data: text,
      })
    ) {
      mathfield.snapshot();
      if (this.insert(mathfield.model, text)) {
        contentDidChange(mathfield.model, { inputType: 'insertFromPaste' });
        requestUpdate(mathfield);
      }
      return true;
    }

    return false;
  }

  insert(model: ModelPrivate, text: string, options?: InsertOptions): boolean {
    if (!contentWillChange(model, { data: text, inputType: 'insertText' }))
      return false;
    if (!options) options = {};
    if (!options.insertionMode) options.insertionMode = 'replaceSelection';
    if (!options.selectionMode) options.selectionMode = 'placeholder';

    const { suppressChangeNotifications } = model;
    if (options.suppressChangeNotifications)
      model.suppressChangeNotifications = true;

    const savedSuppressChangeNotifications = model.suppressChangeNotifications;
    model.suppressChangeNotifications = true;

    // Delete any selected items
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

    // Short-circuit the tokenizer and parser when in LaTeX mode
    const newAtoms: Atom[] = [];
    for (const c of text) {
      if (COMMAND_MODE_CHARACTERS.test(c))
        newAtoms.push(new LatexAtom(c, model.mathfield));
    }

    //
    // Insert the new atoms
    //
    let cursor = model.at(model.position);
    // In some cases (after a SelectAll command, for example), the cursor
    // can be positoned *after* the LatexGroup. In that case, adjust to be
    // the last atom inside the LatexGroup.
    if (cursor instanceof LatexGroupAtom) cursor = cursor.lastChild;

    // If there is no LatexGroup (for example, it was deleted, but we're still
    // in LaTeX mode), insert one.
    if (!(cursor.parent instanceof LatexGroupAtom)) {
      const group = new LatexGroupAtom('', model.mathfield);
      cursor.parent!.addChildAfter(group, cursor);
      cursor = group.firstChild;
    }

    const lastNewAtom = cursor.parent!.addChildrenAfter(newAtoms, cursor);

    // Prepare to dispatch notifications
    model.suppressChangeNotifications = savedSuppressChangeNotifications;

    if (options.selectionMode === 'before') {
      // Do nothing: don't change the position.
    } else if (options.selectionMode === 'item')
      model.setSelection(model.anchor, model.offsetOf(lastNewAtom));
    else if (lastNewAtom) model.position = model.offsetOf(lastNewAtom);

    contentDidChange(model, { data: text, inputType: 'insertText' });

    model.suppressChangeNotifications = suppressChangeNotifications;

    return true;
  }
}

export function getLatexGroup(model: ModelPrivate): LatexGroupAtom | undefined {
  return model.atoms.find((x) => x instanceof LatexGroupAtom);
}

export function getLatexGroupBody(model: ModelPrivate): LatexAtom[] {
  const atom = model.atoms.find((x) => x instanceof LatexGroupAtom);
  if (!atom) return [];
  return (
    (atom.body?.filter((x) => x instanceof LatexAtom) as LatexAtom[]) ?? []
  );
}

export function getCommandSuggestionRange(
  model: ModelPrivate,
  options?: { before: Offset }
): Range | [undefined, undefined] {
  let start = 0;
  let found = false;
  const last = Number.isFinite(options?.before)
    ? options?.before ?? 0
    : model.lastOffset;
  while (start <= last && !found) {
    const atom = model.at(start);
    found = atom instanceof LatexAtom && atom.isSuggestion;
    if (!found) start++;
  }

  if (!found) return [undefined, undefined];

  let end = start;
  let done = false;
  while (end <= last && !done) {
    const atom = model.at(end);
    done = !(atom instanceof LatexAtom && atom.isSuggestion);
    if (!done) end++;
  }

  return [start - 1, end - 1];
}

new LatexModeEditor();
