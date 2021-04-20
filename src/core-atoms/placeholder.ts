import { Atom, ToLatexOptions } from '../core/atom-class';
import { Span } from '../core/span';
import { Context } from '../core/context';
import { ParseMode, Style } from '../public/core';

export class PlaceholderAtom extends Atom {
  constructor(options?: { value?: string; mode?: ParseMode; style?: Style }) {
    super('placeholder', {
      mode: options?.mode,
      style: options?.style,
      value: options?.value,
    });
    this.captureSelection = true;
  }

  render(context: Context): Span {
    return this.makeSpan(context, '⬚', {
      classes: this.caret ? 'ML__placeholder-selected' : '',
    });
  }

  toLatex(_options: ToLatexOptions): string {
    return `\\placeholder{${this.value ?? ''}}`;
  }
}
