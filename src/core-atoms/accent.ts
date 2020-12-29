import type { Context } from '../core/context';
import { Atom } from '../core/atom-class';

import {
  makeSVGSpan,
  makeVlist,
  makeSymbol,
  height as spanHeight,
  skew as spanSkew,
  Span,
} from '../core/span';
import { METRICS as FONTMETRICS } from '../core/font-metrics';
import { Style } from '../public/core';

export class AccentAtom extends Atom {
  private readonly accent?: string;
  private readonly svgAccent?: string;
  constructor(
    command: string,
    body: Atom[],
    options: { accentChar?: string; svgAccent?: string; style: Style }
  ) {
    super('accent', { command, style: options.style });
    if (options.accentChar) {
      this.accent = options.accentChar;
    } else {
      this.svgAccent = options?.svgAccent;
    }

    this.body = body;
    this.skipBoundary = true;
    this.limits = 'accent'; // This will suppress the regular
    // supsub attachment and will delegate
    // it to the decomposeAccent
    // (any non-null value would do)
  }

  render(context: Context): Span[] {
    // Accents are handled in the TeXbook pg. 443, rule 12.
    const { mathstyle } = context;
    // Build the base atom
    const base = Atom.render(context.cramp(), this.body);
    // Calculate the skew of the accent. This is based on the line "If the
    // nucleus is not a single character, let s = 0; otherwise set s to the
    // kern amount for the nucleus followed by the \skewchar of its font."
    // Note that our skew metrics are just the kern between each character
    // and the skewchar.
    let skew = 0;
    if (
      !this.hasEmptyBranch('body') &&
      this.body.length === 2 &&
      this.body[1].isCharacterBox()
    ) {
      skew = spanSkew(base);
    }

    // Calculate the amount of space between the body and the accent
    let clearance = Math.min(spanHeight(base), mathstyle.metrics.xHeight);
    let accentBody: Span;
    if (this.svgAccent) {
      accentBody = makeSVGSpan(this.svgAccent);
      clearance = -clearance + FONTMETRICS.bigOpSpacing1;
    } else {
      // Build the accent
      const accent = makeSymbol('Main-Regular', this.accent, 'math');
      // Remove the italic correction of the accent, because it only serves to
      // shift the accent over to a place we don't want.
      accent.italic = 0;
      // The \vec character that the fonts use is a combining character, and
      // thus shows up much too far to the left. To account for this, we add a
      // specific class which shifts the accent over to where we want it.
      const vecClass = this.accent === '\u20D7' ? ' accent-vec' : '';
      accentBody = new Span(new Span(accent), 'accent-body' + vecClass);
    }

    accentBody = makeVlist(context, [base, -clearance, accentBody]);
    // Shift the accent over by the skew. Note we shift by twice the skew
    // because we are centering the accent, so by adding 2*skew to the left,
    // we shift it to the right by 1*skew.
    accentBody.children[accentBody.children.length - 1].left = 2 * skew;
    const result = new Span(accentBody, 'accent', 'mord');
    if (this.caret) result.caret = this.caret;
    return [this.attachSupsub(context, result, result.type)];
  }
}
