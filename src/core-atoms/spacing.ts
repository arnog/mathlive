import type { Glue, Style, GlobalContext } from '../public/core-types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { convertGlueToEm } from '../core/registers-utils';

export class SpacingAtom extends Atom {
  private readonly width?: Glue;

  constructor(
    command: string,
    style: Style,
    context: GlobalContext,
    width?: Glue
  ) {
    super('spacing', context, { command, style });
    this.width = width;
  }

  static fromJson(json: AtomJson, context: GlobalContext): SpacingAtom {
    return new SpacingAtom(json.command, json.style, context, json.width);
  }

  toJson(): AtomJson {
    const options: { [key: string]: any } = {};
    if (this.width) options.width = this.width;
    return { ...super.toJson(), ...options };
  }

  render(context: Context): Box {
    let result: Box;
    if (this.width) {
      result = new Box(null, { classes: 'mspace' });
      result.left = convertGlueToEm(this.width);
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
        }[this.command!] ?? 'mediumspace';
      result = new Box(null, { classes: spacingCls });
    }

    result = this.bind(context, result);
    if (this.caret) result.caret = this.caret;
    return result;
  }

  serialize(_options: ToLatexOptions): string {
    // Two kinds of spacing commands:
    // - `\hskip`, `\kern`, `\hspace` and `hspace*` which take one glue argument:
    // i.e. `\hspace1em` or `\hspace{1em}`.
    // - `\quad`, etc... which take no parameters.
    let result = this.command ?? '';
    if (this.command === '\\hspace' || this.command === '\\hspace*') {
      if (Number.isFinite(this.width)) result += `{${this.width}em'}`;
      else result += `{0pt}`;
    } else if (Number.isFinite(this.width)) result += ` ${this.width}em`;

    return result;
  }
}
