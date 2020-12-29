import { Span } from '../core/span';
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
    this.latex = value;
  }

  get computedStyle(): Style {
    return {};
  }

  render(context: Context): Span[] {
    const result = new Span(
      this.value,
      this.isSuggestion ? 'ML__suggestion' : this.isError ? 'ML__error' : '',
      'latex'
    );
    if (this.caret) result.caret = this.caret;
    this.bind(context, result);
    return [result];
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

  render(context: Context): Span[] {
    const span = new Span(Atom.render(context, this.body), '', 'mord');

    if (this.caret) span.caret = this.caret;
    // Need to bind the group so that the DOM element can be matched
    // and the atom iterated recursively. Otherwise, it behaves
    // as if `captureSelection === true`
    this.bind(context, span);
    return [span];
  }

  toLatex(_options: ToLatexOptions): string {
    return this.body.map((x) => x.value).join('');
  }
}
