import { ParseMode } from '../public/core';

import { LatexAtom } from '../core-atoms/latex';
import { suggest } from '../core-definitions/definitions-utils';

import type { ModelPrivate } from '../editor-model/model-private';

import { hidePopover, showPopoverWithLatex } from '../editor/popover';

import type { MathfieldPrivate } from './mathfield-private';
import { requestUpdate } from './render';
import {
  getLatexGroupBody,
  getCommandSuggestionRange,
  getLatexGroup,
} from './mode-editor-latex';
import { ModeEditor } from './mode-editor';

export function updateAutocomplete(
  mathfield: MathfieldPrivate,
  options?: { atIndex?: number }
): void {
  const { model } = mathfield;
  // Remove any error indicator and any suggestions
  getLatexGroupBody(model).forEach((x) => {
    if (x.isSuggestion) {
      x.parent.removeChild(x);
    } else {
      x.isError = false;
    }
  });

  if (!model.selectionIsCollapsed) {
    hidePopover(mathfield);
    return;
  }

  // The current command is the sequence of atom around the insertion point
  // that ends on the left with a '\\' and on the right with a non-command
  // character.
  const command = [];
  let atom = model.at(model.position);
  while (atom && atom instanceof LatexAtom && /[a-zA-Z*]$/.test(atom.value)) {
    command.unshift(atom);
    atom = atom.leftSibling;
  }

  if (atom && atom instanceof LatexAtom && atom.value === '\\') {
    // We found the beginning of a command, include the atoms after the
    // insertion point
    command.unshift(atom);
    atom = model.at(model.position).rightSibling;
    while (atom && atom instanceof LatexAtom && /[a-zA-Z*]$/.test(atom.value)) {
      command.push(atom);
      atom = atom.rightSibling;
    }
  }

  const commandString = command.map((x) => x.value).join('');
  const suggestions = commandString ? suggest(commandString) : [];

  if (suggestions.length === 0) {
    if (/^\\[a-zA-Z\\*]+$/.test(commandString)) {
      // This looks like a command name, but not a known one
      command.forEach((x) => {
        x.isError = true;
      });
    }

    hidePopover(mathfield);
    return;
  }

  mathfield.suggestionIndex = options?.atIndex ?? 0;
  if (mathfield.suggestionIndex < 0) {
    mathfield.suggestionIndex = suggestions.length - 1;
  }

  const suggestion =
    suggestions[mathfield.suggestionIndex % suggestions.length].match;
  if (suggestion !== commandString) {
    const lastAtom = command[command.length - 1];
    lastAtom.parent.addChildrenAfter(
      [...suggestion.slice(commandString.length - suggestion.length)].map(
        (x) => new LatexAtom(x, { isSuggestion: true })
      ),
      lastAtom
    );
    requestUpdate(mathfield);
  }

  showPopoverWithLatex(mathfield, suggestion, suggestions.length > 1);
}

export function acceptCommandSuggestion(model: ModelPrivate): void {
  model
    .getAtoms(getCommandSuggestionRange(model, { before: model.position }))
    .forEach((x: LatexAtom) => {
      x.isSuggestion = false;
    });
}

/**
 * When in latex mode, insert the latex being edited and leave latex mode
 *
 */
export function complete(
  mathfield: MathfieldPrivate,
  completion: 'reject' | 'accept' | 'accept-suggestion' = 'accept',
  options?: { mode?: ParseMode; selectItem?: boolean }
): boolean {
  hidePopover(mathfield);
  const latexGroup = getLatexGroup(mathfield.model);
  if (!latexGroup) return false;

  if (completion === 'accept-suggestion') {
    const suggestion = getLatexGroupBody(mathfield.model).filter(
      (x) => x.isSuggestion
    );
    if (suggestion.length === 0) return false;
    suggestion.forEach((x) => {
      x.isSuggestion = false;
    });
    mathfield.model.position = mathfield.model.offsetOf(
      suggestion[suggestion.length - 1]
    );
    return true;
  }

  const body = getLatexGroupBody(mathfield.model).filter(
    (x) => !x.isSuggestion
  );

  const latex = body.map((x) => x.value).join('');

  const newPos = latexGroup.leftSibling;
  latexGroup.parent.removeChild(latexGroup);
  mathfield.model.position = mathfield.model.offsetOf(newPos);
  mathfield.mode = options?.mode ?? 'math';

  if (completion === 'reject') return true;

  ModeEditor.insert('math', mathfield.model, latex, {
    macros: mathfield.options.macros,
    selectionMode: options?.selectItem ?? false ? 'item' : 'placeholder',
  });

  mathfield.snapshot();
  mathfield.model.announce('replacement');
  return true;
}
