import type { Dimension, Glue, Style } from '../public/core-types';
import type { GlobalContext } from '../core/types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import {
  convertGlueOrDimensionToEm,
  serializeGlueOrDimenstion,
} from '../core/registers-utils';

export class SpacingAtom extends Atom {
  private readonly width: Glue | Dimension | undefined;
  _braced: boolean;
  constructor(
    command: string,
    style: Style,
    context: GlobalContext,
    width?: Glue | Dimension,
    options?: { braced: boolean }
  ) {
    super('spacing', context, { command, style });
    this.width = width;
    this._braced = options?.braced ?? false;
  }

  static fromJson(json: AtomJson, context: GlobalContext): SpacingAtom {
    return new SpacingAtom(json.command, json.style, context, json.width, {
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
    let result: Box;
    if (this.width !== undefined) {
      result = new Box(null, { classes: 'mspace' });
      result.left = convertGlueOrDimensionToEm(this.width);
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
    // - `\hskip`, `\kern`, `\hspace` and `hspace*` which take one glue argument:
    // i.e. `\hspace1em` or `\hspace{1em}`.
    // - `\quad`, etc... which take no parameters.
    const command = this.command ?? '';

    if (this.width === undefined) return command;

    // @todo Note: when the value is a register, it should not be braced
    if (this._braced)
      return `${command}{${serializeGlueOrDimenstion(this.width)}}`;
    return `${command}${serializeGlueOrDimenstion(this.width)}`;
  }
}
