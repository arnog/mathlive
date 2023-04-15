/* eslint-disable no-new */
import type { InsertOptions } from '../public/mathfield';

import { parseLatex } from '../core/core';
import { Atom } from '../core/atom-class';
import { ModelPrivate } from '../editor-model/model-private';
import { range } from '../editor-model/selection-utils';
import { applyStyleToUnstyledAtoms } from '../editor-model/styling';
import { contentDidChange, contentWillChange } from '../editor-model/listeners';

import { MathfieldPrivate } from './mathfield-private';
import { ModeEditor } from './mode-editor';
import { requestUpdate } from './render';
import type { GlobalContext } from '../core/types';

export class TextModeEditor extends ModeEditor {
  constructor() {
    super('text');
  }

  onPaste(
    mathfield: MathfieldPrivate,
    data: DataTransfer | string | null
  ): boolean {
    if (!data) return false;

    const text = typeof data === 'string' ? data : data.getData('text/plain');

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

  insert(
    model: ModelPrivate,
    text: string,
    options: InsertOptions = {}
  ): boolean {
    if (!contentWillChange(model, { data: text, inputType: 'insertText' }))
      return false;
    if (!options.insertionMode) options.insertionMode = 'replaceSelection';
    if (!options.selectionMode) options.selectionMode = 'placeholder';
    if (!options.format) options.format = 'auto';

    const { suppressChangeNotifications } = model;
    if (options.suppressChangeNotifications)
      model.suppressChangeNotifications = true;

    const contentWasChanging = model.suppressChangeNotifications;
    model.suppressChangeNotifications = true;

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

    const newAtoms = convertStringToAtoms(text, model.mathfield);
    // Some atoms may already have a style (for example if there was an
    // argument, i.e. the selection, that this was applied to).
    // So, don't apply style to atoms that are already styled, but *do*
    // apply it to newly created atoms that have no style yet.
    applyStyleToUnstyledAtoms(newAtoms, options.style);
    if (!newAtoms) return false;

    const cursor = model.at(model.position);
    const lastNewAtom = cursor.parent!.addChildrenAfter(newAtoms, cursor);

    // Prepare to dispatch notifications
    // (for selection changes, then content change)
    model.suppressChangeNotifications = contentWasChanging;

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

function convertStringToAtoms(s: string, context: GlobalContext): Atom[] {
  // Map special TeX characters to alternatives
  // Must do this one first, since other replacements include backslash
  s = s.replace(/\\/g, '\\textbackslash ');

  s = s.replace(/#/g, '\\#');
  s = s.replace(/\$/g, '\\$');
  s = s.replace(/%/g, '\\%');
  s = s.replace(/&/g, '\\&');
  // S = s.replace(/:/g, '\\colon');     // text colon?
  // s = s.replace(/\[/g, '\\lbrack');
  // s = s.replace(/]/g, '\\rbrack');
  s = s.replace(/_/g, '\\_');
  s = s.replace(/{/g, '\\textbraceleft ');
  s = s.replace(/}/g, '\\textbraceright ');
  s = s.replace(/\^/g, '\\textasciicircum ');
  s = s.replace(/~/g, '\\textasciitilde ');
  s = s.replace(/£/g, '\\textsterling ');

  return parseLatex(s, context, { parseMode: 'text' });
}

new TextModeEditor();
