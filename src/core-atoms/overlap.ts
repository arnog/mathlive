import { Atom } from '../core/atom-class';
import { Span, SpanType } from '../core/span';
import { Context } from '../core/context';
import type { Style } from '../public/core';

export class OverlapAtom extends Atom {
  private readonly align?: 'left' | 'right';
  private readonly spanType: SpanType;
  constructor(
    command: string,
    body: string | Atom[],
    options?: { align?: 'left' | 'right'; spanType?: SpanType; style: Style }
  ) {
    super('overlap', { command, style: options.style });
    this.skipBoundary = true;
    if (typeof body === 'string') {
      this.body = [new Atom('mord', { value: body })];
    } else {
      this.body = body;
    }
    this.align = options?.align ?? 'left';
    this.spanType = options?.spanType ?? 'mord';
  }

  render(context: Context): Span {
    // For llap (18), rlap (270), clap (0)
    // smash (common), mathllap (0), mathrlap (0), mathclap (0)
    // See https://www.tug.org/TUGboat/tb22-4/tb72perlS.pdf
    // and https://tex.stackexchange.com/questions/98785/what-are-the-different-kinds-of-vertical-spacing-and-horizontal-spacing-commands
    const inner = new Span(Atom.render(context, this.body), {
      classes: 'inner',
    }); // @revisit
    if (this.caret) inner.caret = this.caret;
    return new Span([inner, new Span(null, { classes: 'fix' })], {
      classes: this.align === 'left' ? 'llap' : 'rlap',
      type: this.spanType,
    });
  }
}
