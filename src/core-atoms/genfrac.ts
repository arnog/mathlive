import type { MathstyleName, Style } from '../public/core-types';

import { Atom, AtomJson } from '../core/atom-class';
import { Box } from '../core/box';
import { VBox } from '../core/v-box';
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
  fractionNavigationOrder?: 'numerator-denominator' | 'denominator-numerator';
  style?: Style;
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
  readonly hasBarLine: boolean;
  readonly leftDelim?: string;
  readonly rightDelim?: string;
  private readonly continuousFraction: boolean;
  private readonly numerPrefix?: string;
  private readonly denomPrefix?: string;
  private readonly mathstyleName?: MathstyleName;
  private readonly fractionNavigationOrder?:
    | 'numerator-denominator'
    | 'denominator-numerator';

  constructor(above: Atom[], below: Atom[], options: GenfracOptions) {
    super({
      ...options,
      type: 'genfrac',
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
    this.fractionNavigationOrder = options?.fractionNavigationOrder;
  }

  static fromJson(json: AtomJson): GenfracAtom {
    return new GenfracAtom(
      json.above,
      json.below,
      json as any as GenfracOptions
    );
  }

  toJson(): AtomJson {
    const options: GenfracOptions = {};
    if (this.continuousFraction) options.continuousFraction = true;
    if (this.numerPrefix) options.numerPrefix = this.numerPrefix;
    if (this.denomPrefix) options.denomPrefix = this.denomPrefix;
    if (this.leftDelim) options.leftDelim = this.leftDelim;
    if (this.rightDelim) options.rightDelim = this.rightDelim;
    if (!this.hasBarLine) options.hasBarLine = false;
    if (this.mathstyleName) options.mathstyleName = this.mathstyleName;
    if (this.fractionNavigationOrder)
      options.fractionNavigationOrder = this.fractionNavigationOrder;
    return { ...super.toJson(), ...options };
  }

  // The order of the children, which is used for keyboard navigation order,
  // may be customized for fractions...
  get children(): Atom[] {
    if (this._children) return this._children;

    const result: Atom[] = [];
    if (this.fractionNavigationOrder === 'denominator-numerator') {
      for (const x of this.below!) {
        result.push(...x.children);
        result.push(x);
      }
      for (const x of this.above!) {
        result.push(...x.children);
        result.push(x);
      }
    } else {
      for (const x of this.above!) {
        result.push(...x.children);
        result.push(x);
      }
      for (const x of this.below!) {
        result.push(...x.children);
        result.push(x);
      }
    }

    this._children = result;
    return result;
  }

  render(context: Context): Box | null {
    const fracContext = new Context(
      { parent: context, mathstyle: this.mathstyleName },
      this.style
    );
    const metrics = fracContext.metrics;

    const numContext = new Context(
      {
        parent: fracContext,
        mathstyle: this.continuousFraction ? '' : 'numerator',
      },
      this.style
    );
    const numerBox = this.numerPrefix
      ? new Box(
          [new Box(this.numerPrefix), Atom.createBox(numContext, this.above)],
          { isTight: numContext.isTight, type: 'ignore' }
        )
      : Atom.createBox(numContext, this.above, { type: 'ignore' }) ??
        new Box(null, { type: 'ignore' });

    const denomContext = new Context(
      {
        parent: fracContext,
        mathstyle: this.continuousFraction ? '' : 'denominator',
      },
      this.style
    );
    const denomBox = this.denomPrefix
      ? new Box([
          new Box(this.denomPrefix),
          Atom.createBox(denomContext, this.below, { type: 'ignore' }),
        ])
      : Atom.createBox(denomContext, this.below, { type: 'ignore' }) ??
        new Box(null, { type: 'ignore' });

    const ruleThickness = this.hasBarLine ? metrics.defaultRuleThickness : 0;

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
      numerShift = numContext.metrics.num1; // Set u ← σ8
      clearance = ruleThickness > 0 ? 3 * ruleThickness : 7 * ruleThickness;
      denomShift = denomContext.metrics.denom1; // V ← σ11
    } else {
      if (ruleThickness > 0) {
        numerShift = numContext.metrics.num2; // U ← σ9
        clearance = ruleThickness; //  Φ ← θ
      } else {
        numerShift = numContext.metrics.num3; // U ← σ10
        clearance = 3 * metrics.defaultRuleThickness; // Φ ← 3 ξ8
      }

      denomShift = denomContext.metrics.denom2; // V ← σ12
    }

    const classes: string[] = [];
    if (this.isSelected) classes.push('ML__selected');
    const numerDepth = numerBox.depth;
    const denomHeight = denomBox.height;
    let frac: Box;
    if (ruleThickness <= 0) {
      // Rule 15c from Appendix G
      // No bar line between numerator and denominator
      const candidateClearance =
        numerShift - numerDepth - (denomHeight - denomShift);
      if (candidateClearance < clearance) {
        numerShift += (clearance - candidateClearance) / 2;
        denomShift += (clearance - candidateClearance) / 2;
      }

      frac = new VBox({
        individualShift: [
          {
            box: numerBox,
            shift: -numerShift,
            classes: [...classes, 'ML__center'],
          },
          {
            box: denomBox,
            shift: denomShift,
            classes: [...classes, 'ML__center'],
          },
        ],
      }).wrap(fracContext);
    } else {
      // Rule 15d from Appendix G of the TeXBook.
      // There is a bar line between the numerator and the denominator

      const fracLine = new Box(null, {
        classes: 'ML__frac-line',
        mode: this.mode,
        style: this.style,
      });

      // const numerLine = AXIS_HEIGHT + ruleThickness / 2;
      const denomLine = AXIS_HEIGHT - ruleThickness / 2;
      // if (numerShift < clearance + numerDepth + numerLine)
      //   numerShift = clearance + numerDepth + numerLine;

      fracLine.width = Math.max(numerBox.width, denomBox.width);
      fracLine.height = ruleThickness / 2;
      fracLine.depth = ruleThickness / 2;

      if (denomShift < clearance + denomHeight - denomLine)
        denomShift = clearance + denomHeight - denomLine;

      frac = new VBox({
        individualShift: [
          {
            box: denomBox,
            shift: denomShift,
            classes: [...classes, 'ML__center'],
          },
          { box: fracLine, shift: -denomLine, classes },
          {
            box: numerBox,
            shift: -numerShift,
            classes: [...classes, 'ML__center'],
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
            'open',
            this.leftDelim,
            delimSize,
            true,
            context,
            { style: this.style, mode: this.mode, isSelected: this.isSelected }
          )
        )
      : makeNullDelimiter(fracContext, 'open');

    let rightDelim: Box | null = null;
    if (this.continuousFraction) {
      // Zero width for `\cfrac`
      rightDelim = new Box(null, { type: 'close' });
    } else if (!this.rightDelim)
      rightDelim = makeNullDelimiter(fracContext, 'close');
    else {
      rightDelim = this.bind(
        context,
        makeCustomSizedDelim(
          'close',
          this.rightDelim,
          delimSize,
          true,
          context,
          { style: this.style, mode: this.mode, isSelected: this.isSelected }
        )
      );
    }

    // TeXBook p. 170 "fractions are treated as type Inner."
    const result = this.bind(
      context,
      new Box([leftDelim, frac, rightDelim], {
        isTight: fracContext.isTight,
        type: 'inner',
        classes: 'mfrac',
      })
    );
    if (!result) return null;
    if (this.caret) result.caret = this.caret;

    return this.attachSupsub(context, { base: result });
  }
}
