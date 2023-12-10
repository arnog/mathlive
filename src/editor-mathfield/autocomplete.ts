import { LatexAtom } from '../atoms/latex';
import { suggest } from '../latex-commands/definitions-utils';

import type { _Model } from '../editor-model/model-private';

import {
  hideSuggestionPopover,
  showSuggestionPopover,
} from '../editor/suggestion-popover';

import type { _Mathfield } from './mathfield-private';
import { render } from './render';
import {
  getLatexGroupBody,
  getCommandSuggestionRange,
  getLatexGroup,
} from './mode-editor-latex';
import { ModeEditor } from './mode-editor';
import { ParseMode } from '../public/core-types';

export function removeSuggestion(mathfield: _Mathfield): void {
  const group = getLatexGroupBody(mathfield.model).filter(
    (x) => x.isSuggestion
  );
  if (group.length === 0) return;
  mathfield.model.position = mathfield.model.offsetOf(group[0].leftSibling);
  for (const atom of group) atom.parent!.removeChild(atom);
}

export function updateAutocomplete(
  mathfield: _Mathfield,
  options?: { atIndex?: number }
): void {
  const { model } = mathfield;
  // Remove any error indicator and any suggestions
  removeSuggestion(mathfield);
  for (const atom of getLatexGroupBody(model)) atom.isError = false;

  if (
    !model.selectionIsCollapsed ||
    mathfield.options.popoverPolicy === 'off'
  ) {
    hideSuggestionPopover(mathfield);
    return;
  }

  // The current command is the sequence of atoms around the insertion point
  // that ends on the left with a '\' and on the right with a non-command
  // character.
  const commandAtoms: LatexAtom[] = [];
  let atom = model.at(model.position);

  while (atom && atom instanceof LatexAtom && /^[a-zA-Z\*]$/.test(atom.value))
    atom = atom.leftSibling;

  if (atom && atom instanceof LatexAtom && atom.value === '\\') {
    // We've found the start of a command.
    // Go forward and collect the potential atoms of the command
    commandAtoms.push(atom);
    atom = atom.rightSibling;
    while (
      atom &&
      atom instanceof LatexAtom &&
      /^[a-zA-Z\*]$/.test(atom.value)
    ) {
      commandAtoms.push(atom);
      atom = atom.rightSibling;
    }
  }

  const command = commandAtoms.map((x) => x.value).join('');
  const suggestions = suggest(mathfield, command);

  if (suggestions.length === 0) {
    // This looks like a command name, but not a known one
    if (/^\\[a-zA-Z\*]+$/.test(command))
      for (const atom of commandAtoms) atom.isError = true;

    hideSuggestionPopover(mathfield);
    return;
  }

  const index = options?.atIndex ?? 0;
  mathfield.suggestionIndex =
    index < 0 ? suggestions.length - 1 : index % suggestions.length;

  const suggestion = suggestions[mathfield.suggestionIndex];

  if (suggestion !== command) {
    const lastAtom = commandAtoms[commandAtoms.length - 1];
    lastAtom.parent!.addChildrenAfter(
      [...suggestion.slice(command.length - suggestion.length)].map(
        (x) => new LatexAtom(x, { isSuggestion: true })
      ),
      lastAtom
    );
    render(mathfield, { interactive: true });
  }

  showSuggestionPopover(mathfield, suggestions);
}

export function acceptCommandSuggestion(model: _Model): boolean {
  const [from, to] = getCommandSuggestionRange(model, {
    before: model.position,
  });
  if (from === undefined || to === undefined) return false;
  let result = false;
  model.getAtoms([from, to]).forEach((x: LatexAtom) => {
    if (x.isSuggestion) {
      x.isSuggestion = false;
      result = true;
    }
  });
  return result;
}

/**
 * When in LaTeX mode, insert the LaTeX being edited and leave LaTeX mode
 *
 */
export function complete(
  mathfield: _Mathfield,
  completion:
    | 'reject'
    | 'accept'
    | 'accept-suggestion'
    | 'accept-all' = 'accept',
  options?: { mode?: ParseMode; selectItem?: boolean }
): boolean {
  hideSuggestionPopover(mathfield);
  const latexGroup = getLatexGroup(mathfield.model);
  if (!latexGroup) return false;

  if (completion === 'accept-suggestion' || completion === 'accept-all') {
    const suggestions = getLatexGroupBody(mathfield.model).filter(
      (x) => x.isSuggestion
    );
    if (suggestions.length !== 0) {
      for (const suggestion of suggestions) suggestion.isSuggestion = false;

      mathfield.model.position = mathfield.model.offsetOf(
        suggestions[suggestions.length - 1]
      );
    }
    if (completion === 'accept-suggestion') return suggestions.length !== 0;
  }

  const body = getLatexGroupBody(mathfield.model).filter(
    (x) => !x.isSuggestion
  );

  const latex = body.map((x) => x.value).join('');

  const newPos = latexGroup.leftSibling;
  latexGroup.parent!.removeChild(latexGroup);
  mathfield.model.position = mathfield.model.offsetOf(newPos);
  mathfield.switchMode(options?.mode ?? 'math');

  if (completion === 'reject') return true;

  ModeEditor.insert(mathfield.model, latex, {
    selectionMode: options?.selectItem ?? false ? 'item' : 'placeholder',
    format: 'latex',
    mode: 'math',
  });

  mathfield.snapshot();
  mathfield.model.announce('replacement');
  mathfield.switchMode('math');
  return true;
}
