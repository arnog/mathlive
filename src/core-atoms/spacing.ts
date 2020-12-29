import { Atom, ToLatexOptions } from '../core/atom-class';
import { Span } from '../core/span';
import { Context } from '../core/context';
import { Style } from '../public/core';

export class SpacingAtom extends Atom {
  private readonly width: number;

  constructor(command: string, style: Style, width?: number) {
    super('spacing', { command, style });
    this.width = width;
  }

  render(context: Context): Span[] {
    let result: Span;
    // A spacing command (\quad, etc...)
    // @revisit: is value needed? Is it ever set?
    if (this.value === '\u200B') {
      // ZERO-WIDTH SPACE
      result = this.makeSpan(context, '\u200B');
    } else if (this.value === '\u00A0') {
      result =
        this.mode === 'math'
          ? this.makeSpan(context, ' ')
          : this.makeSpan(context, '\u00A0');
    } else if (Number.isFinite(this.width)) {
      result = new Span('\u200B', 'mspace ');
      result.left = this.width;
    } else {
      const spacingCls: string =
        {
          '\\qquad': 'qquad',
          '\\quad': 'quad',
          '\\enspace': 'enspace',
          '\\;': 'thickspace',
          '\\:': 'mediumspace',
          '\\,': 'thinspace',
          '\\!': 'negativethinspace',
        }[this.command] ?? 'mediumspace';
      result = new Span('\u200B', 'mspace ' + spacingCls);
    }

    if (this.caret) result.caret = this.caret;
    return [result];
  }

  toLatex(_options: ToLatexOptions): string {
    // Three kinds of spacing commands:
    // \hskip and \kern which take one implicit parameter
    // \hspace and hspace* with take one *explicit* parameter
    // \quad, etc... which take no parameters.
    let result = this.command;
    if (this.command === '\\hspace' || this.command === '\\hspace*') {
      result += '{';
      result += Number.isFinite(this.width)
        ? Number(this.width).toString() + 'em'
        : '0em';
      result += '}';
    } else {
      result += ' ';
      if (Number.isFinite(this.width)) {
        result += Number(this.width).toString() + 'em ';
      }
    }

    return result;
  }
}
