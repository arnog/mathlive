import { Atom } from '../core/atom-class';
import { Span } from '../core/span';
import { Context } from '../core/context';
import type { Style } from '../public/core';

export class OverlapAtom extends Atom {
  private readonly align?: 'left' | 'right';
  constructor(
    command: string,
    body: Atom[],
    options?: { align?: 'left' | 'right'; style: Style }
  ) {
    super('overlap', { command, style: options.style });
    this.skipBoundary = true;
    this.body = body;
    this.align = options?.align ?? 'left';
  }

  render(context: Context): Span[] {
    // For llap (18), rlap (270), clap (0)
    // smash (common), mathllap (0), mathrlap (0), mathclap (0)
    // See https://www.tug.org/TUGboat/tb22-4/tb72perlS.pdf
    // and https://tex.stackexchange.com/questions/98785/what-are-the-different-kinds-of-vertical-spacing-and-horizontal-spacing-commands
    const inner = new Span(Atom.render(context, this.body), 'inner'); // @revisit
    if (this.caret) inner.caret = this.caret;
    return [
      new Span(
        [inner, new Span(null, 'fix')],
        this.align === 'left' ? 'llap' : 'rlap',
        'mord'
      ),
    ];
  }
}
