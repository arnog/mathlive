import { Box } from '../core/box';
import { Context } from '../core/context';
import { Style } from '../public/core';

import { Atom, ToLatexOptions } from '../core/atom-class';

/**
 * Atom for raw latex character, while in Latex editing mode
 */
export class LatexAtom extends Atom {
  isSuggestion: boolean; // This atom is a suggestion
  isError: boolean;
  constructor(
    value: string,
    options?: {
      isSuggestion: boolean;
    }
  ) {
    super('latex', { value, mode: 'latex' });
    this.isSuggestion = options?.isSuggestion ?? false;
    this.isError = false;
    this.verbatimLatex = value;
  }

  get computedStyle(): Style {
    return {};
  }

  render(context: Context): Box {
    const result = new Box(this.value, {
      classes: this.isSuggestion
        ? 'ML__suggestion'
        : this.isError
        ? 'ML__error'
        : '',
      type: 'latex',
      maxFontSize: 1.0,
    });
    if (this.caret) result.caret = this.caret;
    return this.bind(context, result);
  }
}

/**
 * A group that represents a raw Latex editing zone.
 * There is only one LatexGroupAtom at a time in an expression.
 */
export class LatexGroupAtom extends Atom {
  constructor(latex: string) {
    super('group', { mode: 'latex' });
    this.body = [...latex].map((x) => new LatexAtom(x));

    this.skipBoundary = false;
  }

  render(context: Context): Box {
    const box = Atom.createBox(context, this.body, { newList: true });

    if (this.caret) box.caret = this.caret;
    // Need to bind the group so that the DOM element can be matched
    // and the atom iterated recursively. Otherwise, it behaves
    // as if `captureSelection === true`
    return this.bind(context, box);
  }

  serialize(_options: ToLatexOptions): string {
    return this.body.map((x) => x.value).join('');
  }
}
