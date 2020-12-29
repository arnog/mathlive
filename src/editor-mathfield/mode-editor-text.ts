/* eslint-disable no-new */
import { Range, InsertOptions } from '../public/mathfield';
import { ModeEditor } from './mode-editor';
import { TextAtom } from '../core-atoms/text';
import { MathfieldPrivate } from './mathfield-private';
import { requestUpdate } from './render';

import { parseLatex } from '../core/core';
import { Atom } from '../core/atom-class';
import { ModelPrivate } from '../editor-model/model-private';
import { range } from '../editor-model/selection-utils';
import { applyStyleToUnstyledAtoms } from '../editor-model/styling';
import { contentDidChange } from '../editor-model/listeners';

export class TextModeEditor extends ModeEditor {
  constructor() {
    super('text');
  }

  onPaste(mathfield: MathfieldPrivate, ev: ClipboardEvent): boolean {
    const text = ev.clipboardData.getData('text/plain');

    if (text) {
      if (this.insert(mathfield.model, text)) {
        requestUpdate(mathfield);
      }

      ev.preventDefault();
      ev.stopPropagation();
      return true;
    }

    return false;
  }

  onCopy(mathfield: MathfieldPrivate, ev: ClipboardEvent): void {
    const r: Range = mathfield.model.selectionIsCollapsed
      ? [0, mathfield.model.lastOffset]
      : range(mathfield.selection);
    ev.clipboardData.setData(
      'text/plain',
      mathfield.model
        .getAtoms(r)
        .filter((x) => x instanceof TextAtom)
        .map((x) => x.value)
        .join('')
    );
    // Prevent the current document selection from being written to the clipboard.
    ev.preventDefault();
  }

  insert(
    model: ModelPrivate,
    text: string,
    options: InsertOptions = {}
  ): boolean {
    if (!options.insertionMode) options.insertionMode = 'replaceSelection';
    if (!options.selectionMode) options.selectionMode = 'placeholder';
    if (!options.format) options.format = 'auto';
    options.macros = options.macros ?? model.options.macros;

    const { suppressChangeNotifications } = model;
    if (options.suppressChangeNotifications) {
      model.suppressChangeNotifications = true;
    }

    const contentWasChanging = model.suppressChangeNotifications;
    model.suppressChangeNotifications = true;

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

    const newAtoms = convertStringToAtoms(text);
    // Some atoms may already have a style (for example if there was an
    // argument, i.e. the selection, that this was applied to).
    // So, don't apply style to atoms that are already styled, but *do*
    // apply it to newly created atoms that have no style yet.
    applyStyleToUnstyledAtoms(newAtoms, options.style);
    if (!newAtoms) return false;

    const cursor = model.at(model.position);
    const lastNewAtom = cursor.parent.addChildrenAfter(newAtoms, cursor);

    // Prepare to dispatch notifications
    // (for selection changes, then content change)
    model.suppressChangeNotifications = contentWasChanging;

    if (options.selectionMode === 'before') {
      // Do nothing: don't change the position.
    } else if (options.selectionMode === 'item') {
      model.setSelection(model.anchor, model.offsetOf(lastNewAtom));
    } else if (lastNewAtom) {
      model.position = model.offsetOf(lastNewAtom);
    }

    contentDidChange(model);

    model.suppressChangeNotifications = suppressChangeNotifications;

    return true;
  }
}

function convertStringToAtoms(s: string): Atom[] {
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

  return parseLatex(s, 'text');
}

new TextModeEditor();
