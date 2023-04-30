import type { LatexValue, Style } from '../public/core-types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import type { Context } from '../core/context';
import { serializeLatexValue } from '../core/registers-utils';

export class SpacingAtom extends Atom {
  private readonly width: LatexValue | undefined;
  _braced: boolean;
  constructor(
    command: string,
    style: Style,
    width?: LatexValue,
    options?: { braced: boolean }
  ) {
    super('spacing', { command, style });
    this.width = width;
    this._braced = options?.braced ?? false;
  }

  static fromJson(json: AtomJson): SpacingAtom {
    return new SpacingAtom(json.command, json.style, json.width, {
      braced: json.braced,
    });
  }

  toJson(): AtomJson {
    const options: { [key: string]: any } = {};
    if (this.width !== undefined) options.width = this.width;
    if (this._braced) options.braced = true;
    return { ...super.toJson(), ...options };
  }

  render(context: Context): Box {
    if (this.command === 'space')
      return new Box(this.mode === 'math' ? null : ' ');

    let result: Box;
    if (this.width !== undefined) {
      result = new Box(null, { classes: 'mspace' });
      result.left = context.toEm(this.width) ?? 0;
    } else {
      const spacingCls =
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
    // - `\hskip`, `\kern`, `\hspace` and `hspace*` which take one glue
    //     argument:
    // i.e. `\hspace1em` or `\hspace{1em}`.
    // - `\quad`, etc... which take no parameters.
    const command = this.command ?? '';

    if (this.width === undefined) return command;

    // When the value is a register, it should not be braced
    if (this._braced && !('register' in this.width))
      return `${command}{${serializeLatexValue(this.width)}}`;
    return `${command}${serializeLatexValue(this.width)}`;
  }
}
