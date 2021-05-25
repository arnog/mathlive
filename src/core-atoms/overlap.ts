import { Atom } from '../core/atom-class';
import { Box, BoxType } from '../core/box';
import { Context } from '../core/context';
import type { Style } from '../public/core';

export class OverlapAtom extends Atom {
  private readonly align?: 'left' | 'right';
  private readonly boxType: BoxType;
  constructor(
    command: string,
    body: string | Atom[],
    options?: { align?: 'left' | 'right'; boxType?: BoxType; style: Style }
  ) {
    super('overlap', { command, style: options?.style });
    this.skipBoundary = true;
    if (typeof body === 'string') {
      this.body = [new Atom('mord', { value: body })];
    } else {
      this.body = body;
    }
    this.align = options?.align ?? 'left';
    this.boxType = options?.boxType ?? 'mord';
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
        classes: this.align === 'left' ? 'llap' : 'rlap',
        type: this.boxType,
      })
    );
  }
}
