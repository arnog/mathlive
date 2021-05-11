import type { Style } from '../public/core';

import { Atom, ToLatexOptions } from '../core/atom-class';
import type { MathstyleName } from '../core/mathstyle';
import { Span } from '../core/span';
import { Stack } from '../core/stack';
import { makeCustomSizedDelim, makeNullDelimiter } from '../core/delimiters';
import { Context } from '../core/context';
import { AXIS_HEIGHT } from '../core/font-metrics';

export type GenfracOptions = {
  continuousFraction?: boolean;
  numerPrefix?: string;
  denomPrefix?: string;
  leftDelim?: string;
  rightDelim?: string;
  hasBarLine?: boolean;
  mathstyleName?: MathstyleName;
  style?: Style;
  toLatexOverride?: (atom: GenfracAtom, options: ToLatexOptions) => string;
};

/**
 * Genfrac -- Generalized Fraction
 *
 * Decompose fractions, binomials, and in general anything made
 * of a numerator and denominator, optionally separated by a fraction bar,
 * and optionally surrounded by delimiters (parentheses, brackets, etc...).
 *
 * Depending on the type of fraction the mathstyle is either
 * displaystyle or textstyle. This value can also be set to 'auto',
 * to indicate it should use the current mathstyle
 */
export class GenfracAtom extends Atom {
  hasBarLine: boolean;
  leftDelim?: string;
  rightDelim?: string;
  private readonly continuousFraction: boolean;
  private readonly numerPrefix?: string;
  private readonly denomPrefix?: string;
  private readonly mathstyleName: MathstyleName;
  constructor(
    command: string,
    above: Atom[],
    below: Atom[],
    options?: GenfracOptions
  ) {
    super('genfrac', {
      style: options.style,
      command,
      toLatexOverride: options.toLatexOverride,
      displayContainsHighlight: true,
    });
    this.above = above;
    this.below = below;
    this.hasBarLine = options?.hasBarLine ?? true;
    this.continuousFraction = options?.continuousFraction ?? false;
    this.numerPrefix = options?.numerPrefix;
    this.denomPrefix = options?.denomPrefix;
    this.mathstyleName = options?.mathstyleName;
    this.leftDelim = options?.leftDelim;
    this.rightDelim = options?.rightDelim;
  }

  toLatex(options: ToLatexOptions): string {
    return (
      this.command +
      `{${this.aboveToLatex(options)}}` +
      `{${this.belowToLatex(options)}}`
    );
  }

  render(context: Context): Span {
    const fracContext = new Context(context, this.style, this.mathstyleName);
    const metrics = fracContext.metrics;

    const numContext = new Context(
      fracContext,
      this.style,
      this.continuousFraction ? '' : 'numerator'
    );
    const numerSpan = this.numerPrefix
      ? new Span(
          [new Span(this.numerPrefix), Atom.render(numContext, this.above)],
          { isTight: numContext.isTight, newList: true }
        )
      : Atom.render(numContext, this.above, { newList: true }) ??
        new Span(null, { newList: true });

    const denomContext = new Context(
      fracContext,
      this.style,
      this.continuousFraction ? '' : 'denominator'
    );
    const denomSpan = this.denomPrefix
      ? new Span([
          new Span(this.denomPrefix),
          Atom.render(denomContext, this.below, { newList: true }),
        ])
      : Atom.render(denomContext, this.below, { newList: true }) ??
        new Span(null, { newList: true });

    const ruleWidth = this.hasBarLine ? metrics.defaultRuleThickness : 0;

    // Rule 15b from TeXBook Appendix G, p.444
    //
    // 15b. If C > T, set u ← σ8 and v ← σ11. Otherwise set u ← σ9 or σ10,according
    // as θ ̸= 0 or θ = 0, and set v ← σ12. (The fraction will be typeset with
    // its numerator shifted up by an amount u with respect to the current
    // baseline, and with the denominator shifted down by v, unless the boxes
    // are unusually large.)
    let numerShift: number;
    let clearance = 0;
    let denomShift: number;
    if (fracContext.isDisplayStyle) {
      numerShift = metrics.num1; // Set u ← σ8
      clearance = ruleWidth > 0 ? 3 * ruleWidth : 7 * ruleWidth;
      denomShift = metrics.denom1; // V ← σ11
    } else {
      if (ruleWidth > 0) {
        numerShift = metrics.num2; // U ← σ9
        clearance = ruleWidth; //  Φ ← θ
      } else {
        numerShift = metrics.num3; // U ← σ10
        clearance = 3 * ruleWidth; // Φ ← 3 ξ8
      }

      denomShift = metrics.denom2; // V ← σ12
    }

    const numerDepth = numerSpan.depth;
    const denomHeight = denomSpan.height;
    let frac: Span;
    if (ruleWidth <= 0) {
      // Rule 15c from Appendix G
      // No bar line between numerator and denominator
      const candidateClearance =
        numerShift - numerDepth - (denomHeight - denomShift);
      if (candidateClearance < clearance) {
        numerShift += (clearance - candidateClearance) / 2;
        denomShift += (clearance - candidateClearance) / 2;
      }

      frac = new Stack({
        individualShift: [
          {
            span: numerSpan,
            shift: -numerShift,
            wrapperClasses: ['ML__center'],
          },
          {
            span: denomSpan,
            shift: denomShift,
            wrapperClasses: ['ML__center'],
          },
        ],
      }).wrap(fracContext);
    } else {
      // Rule 15d from Appendix G of the TeXBook.
      // There is a bar line between the numerator and the denominator
      const numerLine = AXIS_HEIGHT + ruleWidth / 2;
      const denomLine = AXIS_HEIGHT - ruleWidth / 2;
      if (numerShift < clearance + numerDepth + numerLine) {
        numerShift = clearance + numerDepth + numerLine;
      }

      if (denomShift < clearance + denomHeight - denomLine) {
        denomShift = clearance + denomHeight - denomLine;
      }

      const fracLine = new Span(null, {
        classes: 'ML__frac-line',
        mode: this.mode,
        style: this.style,
      });
      // Manually set the height of the frac line because its height is
      // created in CSS
      fracLine.height = ruleWidth / 2;
      fracLine.depth = ruleWidth / 2;
      frac = new Stack({
        individualShift: [
          {
            span: denomSpan,
            shift: denomShift,
            wrapperClasses: ['ML__center'],
          },
          { span: fracLine, shift: -denomLine },
          {
            span: numerSpan,
            shift: -numerShift,
            wrapperClasses: ['ML__center'],
          },
        ],
      }).wrap(fracContext);
    }

    // Rule 15e of Appendix G
    const delimSize = fracContext.isDisplayStyle
      ? metrics.delim1
      : metrics.delim2;

    // Optional delimiters
    const leftDelim = this.leftDelim
      ? this.bind(
          context,
          makeCustomSizedDelim(
            'mopen',
            this.leftDelim,
            delimSize,
            true,
            context,
            { style: this.style, mode: this.mode }
          )
        )
      : makeNullDelimiter(fracContext, 'mopen');

    let rightDelim: Span;
    if (this.continuousFraction) {
      // Zero width for `\cfrac`
      rightDelim = new Span(null, { type: 'mclose' });
    } else if (!this.rightDelim) {
      rightDelim = makeNullDelimiter(fracContext, 'mclose');
    } else {
      rightDelim = this.bind(
        context,
        makeCustomSizedDelim(
          'mclose',
          this.rightDelim,
          delimSize,
          true,
          context,
          { style: this.style, mode: this.mode }
        )
      );
    }

    // TeXBook p. 170 "fractions are treated as type Inner."
    // However, we add the nullDelimiter above which effectively account for this.
    const result = this.bind(
      context,
      new Span([leftDelim, frac, rightDelim], {
        isTight: fracContext.isTight,
        type: 'mord',
        classes: 'mfrac',
      })
    );

    if (this.caret) result.caret = this.caret;

    return this.attachSupsub(context, { base: result });
  }
}
