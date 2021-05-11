import { Atom, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { Style } from '../public/core';

export class SpacingAtom extends Atom {
  private readonly width: number;

  constructor(command: string, style: Style, width?: number) {
    super('spacing', { command, style });
    this.width = width;
  }

  render(_context: Context): Box {
    let result: Box;
    if (Number.isFinite(this.width)) {
      result = new Box(null, { classes: 'mspace' });
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
      result = new Box(null, { classes: spacingCls });
    }

    if (this.caret) result.caret = this.caret;
    return result;
  }

  serialize(_options: ToLatexOptions): string {
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
