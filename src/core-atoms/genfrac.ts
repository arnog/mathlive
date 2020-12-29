import { Atom, ToLatexOptions } from '../core/atom-class';
import { MATHSTYLES, MathStyleName } from '../core/mathstyle';
import { METRICS as FONTMETRICS } from '../core/font-metrics';
import {
  Span,
  makeHlist,
  makeVlist,
  depth as spanDepth,
  height as spanHeight,
} from '../core/span';
import { makeCustomSizedDelim } from '../core/delimiters';
import { Context } from '../core/context';
import { Style } from '../public/core';

export type GenfracOptions = {
  continuousFraction?: boolean;
  numerPrefix?: string;
  denomPrefix?: string;
  leftDelim?: string;
  rightDelim?: string;
  hasBarLine?: boolean;
  mathStyleName?: MathStyleName | 'auto';
  style?: Style;
  toLatexOverride?: (atom: GenfracAtom, options: ToLatexOptions) => string;
};

/**
 * Gengrac -- Generalized fraction
 *
 * Decompose fractions, binomials, and in general anything made
 * of two expressions on top of each other, optionally separated by a bar,
 * and optionally surrounded by fences (parentheses, brackets, etc...)
 *
 * Depending on the type of fraction the mathstyle is either
 * display math or inline math (which is indicated by 'textstyle'). This value can
 * also be set to 'auto', which indicates it should use the current mathstyle
 */
export class GenfracAtom extends Atom {
  leftDelim?: string;
  rightDelim?: string;
  hasBarLine: boolean;
  private readonly continuousFraction: boolean;
  private readonly numerPrefix?: string;
  private readonly denomPrefix?: string;
  private readonly mathStyleName: MathStyleName | 'auto';
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
    });
    this.above = above;
    this.below = below;
    this.hasBarLine = options?.hasBarLine ?? true;
    this.continuousFraction = options?.continuousFraction ?? false;
    this.numerPrefix = options?.numerPrefix;
    this.denomPrefix = options?.denomPrefix;
    this.mathStyleName = options?.mathStyleName ?? 'auto';
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

  render(context: Context): Span[] {
    const mathstyle =
      this.mathStyleName === 'auto'
        ? context.mathstyle
        : MATHSTYLES[this.mathStyleName];
    const newContext = context.clone({ mathstyle });
    const style = this.computedStyle;
    let numer = [];
    if (this.numerPrefix) {
      numer.push(new Span(this.numerPrefix, 'mord'));
    }

    const numeratorStyle = this.continuousFraction
      ? mathstyle
      : mathstyle.fracNum();
    numer = numer.concat(
      Atom.render(newContext.clone({ mathstyle: numeratorStyle }), this.above)
    );
    const numerReset = makeHlist(
      numer,
      context.mathstyle.adjustTo(numeratorStyle)
    );
    let denom = [];
    if (this.denomPrefix) {
      denom.push(new Span(this.denomPrefix, 'mord'));
    }

    const denominatorStyle = this.continuousFraction
      ? mathstyle
      : mathstyle.fracDen();
    denom = denom.concat(
      Atom.render(newContext.clone({ mathstyle: denominatorStyle }), this.below)
    );
    const denomReset = makeHlist(
      denom,
      context.mathstyle.adjustTo(denominatorStyle)
    );
    const ruleWidth = !this.hasBarLine
      ? 0
      : FONTMETRICS.defaultRuleThickness / mathstyle.sizeMultiplier;
    // Rule 15b from TeXBook Appendix G, p.444
    //
    // 15b. If C > T, set u ← σ8 and v ← σ11. Otherwise set u ← σ9 or σ10,according
    // as θ ̸= 0 or θ = 0, and set v ← σ12. (The fraction will be typeset with
    // its numerator shifted up by an amount u with respect to the current
    // baseline, and with the denominator shifted down by v, unless the boxes
    // are unusually large.)
    let numberShift: number;
    let clearance = 0;
    let denomShift: number;
    if (mathstyle.size === MATHSTYLES.displaystyle.size) {
      numberShift = mathstyle.metrics.num1; // Set u ← σ8
      clearance =
        ruleWidth > 0 ? 3 * ruleWidth : 7 * FONTMETRICS.defaultRuleThickness;
      denomShift = mathstyle.metrics.denom1; // V ← σ11
    } else {
      if (ruleWidth > 0) {
        numberShift = mathstyle.metrics.num2; // U ← σ9
        clearance = ruleWidth; //  Φ ← θ
      } else {
        numberShift = mathstyle.metrics.num3; // U ← σ10
        clearance = 3 * FONTMETRICS.defaultRuleThickness; // Φ ← 3 ξ8
      }

      denomShift = mathstyle.metrics.denom2; // V ← σ12
    }

    const numerDepth = spanDepth(numerReset);
    const denomHeight = spanHeight(denomReset);
    let frac: Span;
    if (ruleWidth === 0) {
      // Rule 15c from Appendix G
      // No bar line between numerator and denominator
      const candidateClearance =
        numberShift - numerDepth - (denomHeight - denomShift);
      if (candidateClearance < clearance) {
        numberShift += 0.5 * (clearance - candidateClearance);
        denomShift += 0.5 * (clearance - candidateClearance);
      }

      frac = makeVlist(
        newContext,
        [numerReset, -numberShift, denomReset, denomShift],
        'individualShift'
      );
    } else {
      // Rule 15d from Appendix G
      // There is a bar line between the numerator and the denominator
      const { axisHeight } = mathstyle.metrics;
      const numerLine = axisHeight + 0.5 * ruleWidth;
      const denomLine = axisHeight - 0.5 * ruleWidth;
      if (numberShift - numerDepth - numerLine < clearance) {
        numberShift += clearance - (numberShift - numerDepth - numerLine);
      }

      if (denomLine - (denomHeight - denomShift) < clearance) {
        denomShift += clearance - (denomLine - (denomHeight - denomShift));
      }

      const mid = new Span(null, ' frac-line');
      mid.applyStyle(this.mode, style);
      // Manually set the height of the line because its height is
      // created in CSS
      mid.height = ruleWidth / 2;
      mid.depth = ruleWidth / 2;
      frac = makeVlist(
        newContext,
        [
          denomReset,
          denomShift,
          mid,
          ruleWidth / 2 - axisHeight,
          numerReset,
          -numberShift,
        ],
        'individualShift'
      );
    }

    // Add a 'mfrac' class to provide proper context for
    // other css selectors (such as 'frac-line')
    frac.classes += ' mfrac';
    // Since we manually change the style sometimes (with \dfrac or \tfrac),
    // account for the possible size change here.
    frac.height *= mathstyle.sizeMultiplier / context.mathstyle.sizeMultiplier;
    frac.depth *= mathstyle.sizeMultiplier / context.mathstyle.sizeMultiplier;

    // Rule 15e of Appendix G
    const delimSize =
      mathstyle.size === MATHSTYLES.displaystyle.size
        ? mathstyle.metrics.delim1
        : mathstyle.metrics.delim2;

    // Optional delimiters
    const leftDelim = this.bind(
      context,
      makeCustomSizedDelim(
        'mopen',
        this.leftDelim,
        delimSize,
        true,
        context.clone({ mathstyle })
      )
    );
    leftDelim.applyStyle(this.mode, style);

    const rightDelim = this.bind(
      context,
      makeCustomSizedDelim(
        'mclose',
        this.rightDelim,
        delimSize,
        true,
        context.clone({ mathstyle })
      )
    );
    rightDelim.applyStyle(this.mode, style);

    const result = this.bind(
      context,
      // MakeStruts(
      new Span(
        [leftDelim, frac, rightDelim],
        context.parentSize !== context.size
          ? 'sizing reset-' + context.parentSize + ' ' + context.size
          : '',
        'mord'
        // )
      )
    );

    if (this.caret) result.caret = this.caret;

    return [this.attachSupsub(context, result, result.type)];
  }
}
