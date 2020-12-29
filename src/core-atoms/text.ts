import { Style } from '../public/core';
import { Atom, ToLatexOptions } from '../core/atom-class';
import { Span } from '../core/span';
import { Context } from '../core/context';
import { charToLatex } from '../core-definitions/definitions-utils';

export class TextAtom extends Atom {
  constructor(command: string, value: string, style: Style) {
    super('text', { command, mode: 'text' });
    this.value = value;
    this.latex = value;
    this.applyStyle(style);
  }

  render(context: Context): Span[] {
    const result = this.makeSpan(context, this.value);
    if (this.caret) result.caret = this.caret;
    return [result];
  }

  toLatex(_options: ToLatexOptions): string {
    return this.latex ?? charToLatex('text', this.value);
  }
}
