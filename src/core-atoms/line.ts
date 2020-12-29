import { Atom } from '../core/atom-class';
import { MATHSTYLES } from '../core/mathstyle';
import { METRICS as FONTMETRICS } from '../core/font-metrics';
import { Span, makeVlist, height as spanHeight } from '../core/span';
import { Context } from '../core/context';
import { Style } from '../public/core';

export class LineAtom extends Atom {
  private readonly position: 'overline' | 'underline';
  constructor(
    command: string,
    body: Atom[],
    options: { position: 'overline' | 'underline'; style: Style }
  ) {
    super('line', { command, style: options.style });
    this.skipBoundary = true;
    this.body = body;
    this.position = options.position;
  }

  render(context: Context): Span[] {
    const { mathstyle } = context;
    // TeXBook:443. Rule 9 and 10
    const inner = Atom.render(context.cramp(), this.body);
    const ruleWidth =
      FONTMETRICS.defaultRuleThickness / mathstyle.sizeMultiplier;
    const line = new Span(
      null,
      context.mathstyle.adjustTo(MATHSTYLES.textstyle) +
        ' ' +
        this.position +
        '-line'
    );
    line.height = ruleWidth;
    line.maxFontSize = 1;
    let vlist;
    if (this.position === 'overline') {
      vlist = makeVlist(context, [inner, 3 * ruleWidth, line, ruleWidth]);
    } else {
      const innerSpan = new Span(inner);
      vlist = makeVlist(
        context,
        [ruleWidth, line, 3 * ruleWidth, innerSpan],
        'top',
        spanHeight(innerSpan)
      );
    }

    if (this.caret) vlist.caret = this.caret;
    return [new Span(vlist, this.position, 'mord')];
  }
}
