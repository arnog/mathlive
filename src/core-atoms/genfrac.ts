import type { MathstyleName, Style } from '../public/core-types';
import type { GlobalContext } from '../core/types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { VBox } from '../core/v-box';
import { makeCustomSizedDelim, makeNullDelimiter } from '../core/delimiters';
import { Context } from '../core/context';
import { AXIS_HEIGHT } from '../core/font-metrics';
import { latexCommand } from '../core/tokenizer';

export type GenfracOptions = {
  continuousFraction?: boolean;
  numerPrefix?: string;
  denomPrefix?: string;
  leftDelim?: string;
  rightDelim?: string;
  hasBarLine?: boolean;
  mathstyleName?: MathstyleName;
  style?: Style;
  serialize?: (atom: GenfracAtom, options: ToLatexOptions) => string;
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

  constructor(
    command: string,
    above: Atom[],
    below: Atom[],
    context: GlobalContext,
    options: GenfracOptions
  ) {
    super('genfrac', context, {
      style: options.style,
      command,
      serialize: options.serialize,
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

  static fromJson(json: AtomJson, context: GlobalContext): GenfracAtom {
    return new GenfracAtom(
      json.command,
      json.above,
      json.below,
      context,
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
    return { ...super.toJson(), ...options };
  }

  serialize(options: ToLatexOptions): string {
    return latexCommand(
      this.command,
      this.aboveToLatex(options),
      this.belowToLatex(options)
    );
  }

  // The order of the children, which is used for keyboard navigation order,
  // may be customized for fractions...
  get children(): Atom[] {
    if (this._children) return this._children;

    const result: Atom[] = [];
    if (this.context.fractionNavigationOrder === 'numerator-denominator') {
      for (const x of this.above!) {
        result.push(...x.children);
        result.push(x);
      }
      for (const x of this.below!) {
        result.push(...x.children);
        result.push(x);
      }
    } else {
      for (const x of this.below!) {
        result.push(...x.children);
        result.push(x);
      }
      for (const x of this.above!) {
        result.push(...x.children);
        result.push(x);
      }
    }

    this._children = result;
    return result;
  }

  render(context: Context): Box | null {
    const fracContext = new Context(context, this.style, this.mathstyleName);
    const metrics = fracContext.metrics;

    const numContext = new Context(
      fracContext,
      this.style,
      this.continuousFraction ? '' : 'numerator'
    );
    const numerBox = this.numerPrefix
      ? new Box(
          [new Box(this.numerPrefix), Atom.createBox(numContext, this.above)],
          { isTight: numContext.isTight, newList: true }
        )
      : Atom.createBox(numContext, this.above, { newList: true }) ??
        new Box(null, { newList: true });

    const denomContext = new Context(
      fracContext,
      this.style,
      this.continuousFraction ? '' : 'denominator'
    );
    const denomBox = this.denomPrefix
      ? new Box([
          new Box(this.denomPrefix),
          Atom.createBox(denomContext, this.below, { newList: true }),
        ])
      : Atom.createBox(denomContext, this.below, { newList: true }) ??
        new Box(null, { newList: true });

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

    const classes: string[] = [];
    if (this.isSelected) classes.push('ML__selected');
    const numerDepth = numerBox.depth;
    const denomHeight = denomBox.height;
    let frac: Box;
    if (ruleWidth <= 0) {
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
      const numerLine = AXIS_HEIGHT + ruleWidth / 2;
      const denomLine = AXIS_HEIGHT - ruleWidth / 2;
      if (numerShift < clearance + numerDepth + numerLine)
        numerShift = clearance + numerDepth + numerLine;

      if (denomShift < clearance + denomHeight - denomLine)
        denomShift = clearance + denomHeight - denomLine;

      const fracLine = new Box(null, {
        classes: 'ML__frac-line',
        mode: this.mode,
        style: this.style,
      });
      // Manually set the height of the frac line because its height is
      // created in CSS
      fracLine.height = ruleWidth / 2;
      fracLine.depth = ruleWidth / 2;
      frac = new VBox({
        individualShift: [
          {
            box: denomBox,
            shift: denomShift,
            classes: [...classes, 'ML__center'],
          },
          { box: fracLine, shift: -denomLine + ruleWidth / 2, classes },
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

    const selectClasses = this.isSelected ? ' ML__selected' : '';

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
            { style: this.style, mode: this.mode, classes: selectClasses }
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
          { style: this.style, mode: this.mode, classes: selectClasses }
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
