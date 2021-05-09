import { Style } from '../public/core';
import { Atom, ToLatexOptions } from '../core/atom-class';
import { Span } from '../core/span';
import { Context } from '../core/context';
import { charToLatex } from '../core-definitions/definitions-utils';

export class TextAtom extends Atom {
  constructor(command: string, value: string, style: Style) {
    super('text', { command, mode: 'text', displayContainsHighlight: true });
    this.value = value;
    this.verbatimLatex = value;
    this.applyStyle(style);
  }

  render(context: Context): Span {
    const result = this.makeSpan(context);
    if (this.caret) result.caret = this.caret;
    return result;
  }

  toLatex(_options: ToLatexOptions): string {
    return this.verbatimLatex ?? charToLatex('text', this.value);
  }
}
