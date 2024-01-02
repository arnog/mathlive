import type { LatexValue } from '../public/core-types';

import { Atom } from '../core/atom-class';
import { Box } from '../core/box';
import type { Context } from '../core/context';
import { serializeLatexValue } from '../core/registers-utils';
import { getDefinition } from '../latex-commands/definitions-utils';
import type { CreateAtomOptions, AtomJson, ToLatexOptions } from 'core/types';

export class SpacingAtom extends Atom {
  private readonly width: LatexValue | undefined;
  private _braced: boolean;
  constructor(
    options: CreateAtomOptions & {
      width?: LatexValue;
      braced?: boolean;
    }
  ) {
    super({ type: 'spacing', ...options });
    this.width = options?.width;
    this._braced = options?.braced ?? false;
  }

  static fromJson(json: AtomJson): SpacingAtom {
    return new SpacingAtom(json as any);
  }

  toJson(): AtomJson {
    const json: { [key: string]: any } = super.toJson();
    if (this.width !== undefined) json.width = this.width;
    if (this._braced) json.braced = true;
    return json;
  }

  render(context: Context): Box {
    if (this.command === 'space')
      return new Box(this.mode === 'math' ? null : ' ');

    let result: Box;
    if (this.width !== undefined) {
      result = new Box(null, { classes: 'mspace' });
      result.left = context.toEm(this.width);
    } else {
      const spacingCls =
        {
          '\\qquad': 'qquad',
          '\\quad': 'quad',
          '\\enspace': 'enspace',
          '\\;': 'thickspace',
          '\\:': 'mediumspace',
          '\\>': 'mediumspace',
          '\\,': 'thinspace',
          '\\!': 'negativethinspace',
        }[this.command!] ?? 'mediumspace';
      result = new Box(null, { classes: spacingCls });
    }

    result = this.bind(context, result);
    if (this.caret) result.caret = this.caret;
    return result;
  }

  _serialize(options: ToLatexOptions): string {
    if (!options.expandMacro && typeof this.verbatimLatex === 'string')
      return this.verbatimLatex;
    const def = getDefinition(this.command, this.mode);
    if (def?.serialize) return def.serialize(this, options);

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
