import type { Style } from '../public/core-types';

import { Atom, AtomJson } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import type { BoxType } from '../core/types';

export class OverlapAtom extends Atom {
  private readonly align?: 'left' | 'right';
  private readonly boxType?: BoxType;
  constructor(
    command: string,
    body: string | Atom[],
    options?: { align?: 'left' | 'right'; boxType?: BoxType; style: Style }
  ) {
    super({
      type: 'overlap',
      command,
      body: typeof body === 'string' ? [new Atom({ value: body })] : body,
      style: options?.style,
    });

    this.skipBoundary = true;
    this.align = options?.align;
    this.boxType = options?.boxType;
  }

  static fromJson(json: AtomJson): OverlapAtom {
    return new OverlapAtom(json.command, json.body, json as any);
  }

  toJson(): AtomJson {
    const options: { [key: string]: any } = {};
    if (this.align) options.align = this.align;
    if (this.boxType) options.boxType = this.boxType;
    return { ...super.toJson(), ...options };
  }

  render(context: Context): Box | null {
    // For llap (18), rlap (270), clap (0)
    // smash (common), mathllap (0), mathrlap (0), mathclap (0)
    // See https://www.tug.org/TUGboat/tb22-4/tb72perlS.pdf
    // and https://tex.stackexchange.com/questions/98785/what-are-the-different-kinds-of-vertical-spacing-and-horizontal-spacing-commands
    const inner = Atom.createBox(context, this.body, { classes: 'inner' }); // @revisit
    if (!inner) return null;
    if (this.caret) inner.caret = this.caret;
    return this.bind(
      context,
      new Box([inner, new Box(null, { classes: 'fix' })], {
        classes: this.align === 'right' ? 'rlap' : 'llap',
        type: this.boxType,
      })
    );
  }
}
