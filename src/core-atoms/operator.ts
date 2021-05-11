import { Atom, AtomType, ToLatexOptions } from '../core/atom-class';
import { Span } from '../core/span';
import { Context } from '../core/context';
import { Style, Variant, VariantStyle } from '../public/core';
import { joinLatex } from '../core/tokenizer';
import { AXIS_HEIGHT } from '../core/font-metrics';

/**
 * Operators are handled in the TeXbook pg. 443-444, rule 13(a).
 */
export class OperatorAtom extends Atom {
  private readonly variant: Variant;
  private readonly variantStyle: VariantStyle;

  constructor(
    command: string,
    symbol: string | Atom[],
    options: {
      type?: AtomType;
      isExtensibleSymbol?: boolean;
      isFunction?: boolean;
      captureSelection?: boolean;
      // Unlike `style`, `variant` and `variantStyle` are applied to the
      // content of this atom, but not propagated to the next atom
      variant?: Variant;
      variantStyle?: VariantStyle;
      limits?: 'auto' | 'over-under' | 'adjacent';
      style?: Style;
    }
  ) {
    super(options.type ?? 'mop', {
      command,
      style: options.style,
      isFunction: options?.isFunction,
    });
    if (typeof symbol === 'string') {
      this.value = symbol;
    } else {
      this.body = symbol;
    }

    this.captureSelection = options.captureSelection;
    this.variant = options?.variant;
    this.variantStyle = options?.variantStyle;
    this.subsupPlacement = options?.limits;
    this.isExtensibleSymbol = options?.isExtensibleSymbol ?? false;
  }

  render(context: Context): Span {
    let base: Span;
    let baseShift = 0;
    let slant = 0;
    if (this.isExtensibleSymbol) {
      // Most symbol operators get larger in displaystyle (rule 13)
      // except `\smallint`
      const large = context.isDisplayStyle && this.value !== '\\smallint';

      base = new Span(this.value, {
        fontFamily: large ? 'Size2-Regular' : 'Size1-Regular',
        classes: 'op-symbol ' + (large ? 'large-op' : 'small-op'),
        type: 'mop',
        maxFontSize: context.scalingFactor,
      });

      // Shift the symbol so its center lies on the axis (rule 13). It
      // appears that our fonts have the centers of the symbols already
      // almost on the axis, so these numbers are very small. Note we
      // don't actually apply this here, but instead it is used either in
      // the vlist creation or separately when there are no limits.
      baseShift =
        (base.height - base.depth) / 2 - AXIS_HEIGHT * context.scalingFactor;

      // The slant of the symbol is just its italic correction.
      slant = base.italic;
      base.setStyle('color', this.style.color);
      base.setStyle('background-color', this.style.backgroundColor);
    } else if (this.body) {
      // If this is a list, decompose that list.
      base = Atom.render(context, this.body, { newList: true });
      base.setStyle('color', this.style.color);
      base.setStyle('background-color', this.style.backgroundColor);
    } else {
      // Otherwise, this is a text operator. Build the text from the
      // operator's name.
      console.assert(this.type === 'mop');
      // Not all styles are applied, since the operators have a distinct
      // appearance (for example, can't override their font family)
      base = new Span(this.value, {
        type: 'mop',
        mode: 'math',
        maxFontSize: context.scalingFactor,
        style: {
          color: this.style.color,
          backgroundColor: this.style.backgroundColor,
          letterShapeStyle: context.letterShapeStyle,
          variant: this.variant,
          variantStyle: this.variantStyle,
        },
      });
    }

    if (this.isExtensibleSymbol) base.setTop(baseShift);
    let result = base;
    if (this.superscript || this.subscript) {
      const limits = this.subsupPlacement ?? 'auto';
      result =
        limits === 'over-under' || (limits === 'auto' && context.isDisplayStyle)
          ? this.attachLimits(context, { base, baseShift, slant })
          : this.attachSupsub(context, { base });
    }

    if (this.caret) result.caret = this.caret;

    // Bind the generated span with its limits so they
    // can all be selected as one
    return new Span(this.bind(context, result), {
      type: 'mop',
      classes: 'op-group',
    });
  }

  toLatex(options: ToLatexOptions): string {
    let result = '';
    if (this.value !== '\u200B') {
      // Not ZERO-WIDTH
      result +=
        this.command === '\\mathop' || this.command === '\\operatorname'
          ? this.command + `{${this.bodyToLatex(options)}}`
          : this.command;
    }

    if (this.explicitSubsupPlacement) {
      if (this.subsupPlacement === 'over-under') result += '\\limits';
      if (this.subsupPlacement === 'adjacent') result += '\\nolimits';
    }
    result = joinLatex([result, this.supsubToLatex(options)]);

    return result;
  }
}
