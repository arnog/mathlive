import { Context } from '../core/context';
import { Atom } from '../core/atom-class';

import { makeSVGSpan, Span } from '../core/span';
import { Stack } from '../core/stack';
import { Style } from '../public/core';
import { X_HEIGHT } from '../core/font-metrics';

export class AccentAtom extends Atom {
  private readonly accent?: number;
  private readonly svgAccent?: string;
  constructor(
    command: string,
    body: Atom[],
    options: { accentChar?: number; svgAccent?: string; style: Style }
  ) {
    super('accent', { command, style: options.style });
    if (options.accentChar) {
      this.accent = options.accentChar;
    } else {
      this.svgAccent = options?.svgAccent;
    }

    this.body = body;
    this.skipBoundary = true;
    // this.limits = 'accent'; // This will suppress the regular
    // supsub attachment and will delegate
    // it to the decomposeAccent
    // (any non-null value would do)
  }

  render(parentContext: Context): Span {
    const context = new Context(parentContext, this.style, 'cramp');
    // Accents are handled in the TeXbook pg. 443, rule 12.

    //
    // 1. Build the base atom
    //
    const base = Atom.render(context, this.body) ?? new Span(null);

    //
    // 2. Skew
    //
    // Calculate the skew of the accent.
    // > If the nucleus is not a single character, let s = 0; otherwise set s
    // > to the kern amount for the nucleus followed by the \skewchar of its
    // > font.
    // Note that our skew metrics are just the kern between each character
    // and the skewchar.
    let skew = 0;
    if (
      !this.hasEmptyBranch('body') &&
      this.body.length === 2 &&
      this.body[1].isCharacterBox()
    ) {
      skew = base.skew;
    }

    //
    // 3. Calculate the amount of space between the base and the accent
    //
    let clearance = Math.min(base.height, X_HEIGHT);

    //
    // 4. Build the accent
    //
    let accentSpan: Span;
    if (this.svgAccent) {
      accentSpan = makeSVGSpan(this.svgAccent);
      clearance = context.metrics.bigOpSpacing1 - clearance;
    } else {
      // Build the accent
      const accent = new Span(this.accent, { fontFamily: 'Main-Regular' });
      // Remove the italic correction of the accent, because it only serves to
      // shift the accent over to a place we don't want.
      accent.italic = 0;
      // The \vec character that the fonts use is a combining character, and
      // thus shows up much too far to the left. To account for this, we add a
      // specific class which shifts the accent over to where we want it.
      const vecClass = this.accent === 0x20d7 ? ' ML__accent-vec' : '';
      accentSpan = new Span(new Span(accent), {
        classes: 'ML__accent-body' + vecClass,
      });
    }

    //
    // 5. Combine the base and the accent
    //

    // Shift the accent over by the skew. Note we shift by twice the skew
    // because we are centering the accent, so by adding 2*skew to the left,
    // we shift it to the right by 1*skew.
    accentSpan = new Stack({
      shift: 0,
      children: [
        { span: new Span(base) },
        -clearance,
        {
          span: accentSpan,
          marginLeft: base.left + 2 * skew,
          wrapperClasses: ['ML__center'],
        },
      ],
    });

    const result = new Span(accentSpan, { newList: true, type: 'mord' });
    if (this.caret) result.caret = this.caret;
    this.bind(context, result.wrap(context));
    return this.attachSupsub(context, { base: result });
  }
}
