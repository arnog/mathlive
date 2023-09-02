import type { Variant } from '../public/core-types';

import {
  Atom,
  AtomJson,
  CreateAtomOptions,
  ToLatexOptions,
} from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { joinLatex } from '../core/tokenizer';
import { AXIS_HEIGHT } from '../core/font-metrics';
import { getDefinition } from '../core-definitions/definitions-utils';

/**
 * Operators are handled in the TeXbook pg. 443-444, rule 13(a).
 */
export class ExtensibleSymbolAtom extends Atom {
  private readonly variant?: Variant;

  constructor(
    symbol: string,
    options: CreateAtomOptions & {
      isFunction?: boolean;
      // Unlike `style`, `variant` and `variantStyle` are applied to the
      // content of this atom, but not propagated to the next atom
      variant?: Variant;
      limits?: 'auto' | 'over-under' | 'adjacent';
    }
  ) {
    super({
      ...options,
      type: 'extensible-symbol',
      isFunction: options?.isFunction,
    });
    this.value = symbol;

    this.variant = options?.variant;
    this.subsupPlacement = options?.limits;
  }

  static fromJson(json: AtomJson): ExtensibleSymbolAtom {
    return new ExtensibleSymbolAtom(json.symbol, json as any);
  }

  toJson(): AtomJson {
    const result = super.toJson();

    if (this.variant) result.variant = this.variant;
    if (this.subsupPlacement) result.limits = this.subsupPlacement;
    if (this.isExtensibleSymbol) result.isExtensibleSymbol = true;
    if (this.value) result.symbol = this.value;
    return result;
  }

  render(context: Context): Box | null {
    // Most symbol operators get larger in displaystyle (rule 13)
    // except `\smallint`
    const large = context.isDisplayStyle && this.value !== '\\smallint';

    const base = new Box(this.value, {
      fontFamily: large ? 'Size2-Regular' : 'Size1-Regular',
      classes: 'op-symbol ' + (large ? 'large-op' : 'small-op'),
      type: 'op',
      maxFontSize: context.scalingFactor,
      isSelected: this.isSelected,
    });

    if (!base) return null;

    // Apply italic correction
    base.right = base.italic;

    // Shift the symbol so its center lies on the axis (rule 13). It
    // appears that our fonts have the centers of the symbols already
    // almost on the axis, so these numbers are very small. Note we
    // don't actually apply this here, but instead it is used either in
    // the vlist creation or separately when there are no limits.
    const baseShift =
      (base.height - base.depth) / 2 - AXIS_HEIGHT * context.scalingFactor;

    // The slant of the symbol is just its italic correction.
    const slant = base.italic;
    base.setTop(baseShift);

    let result = base;
    if (this.superscript || this.subscript) {
      const limits = this.subsupPlacement ?? 'auto';
      result =
        limits === 'over-under' || (limits === 'auto' && context.isDisplayStyle)
          ? this.attachLimits(context, { base, baseShift, slant })
          : this.attachSupsub(context, { base });
    }

    // Bind the generated box with its limits so they
    // can all be selected as one
    return new Box(this.bind(context, result), {
      type: 'op',
      caret: this.caret,
      isSelected: this.isSelected,
      classes: 'op-group',
    }).wrap(context);
  }

  _serialize(options: ToLatexOptions): string {
    if (
      !(options.expandMacro || options.skipStyles) &&
      typeof this.verbatimLatex === 'string'
    )
      return this.verbatimLatex;
    const def = getDefinition(this.command, this.mode);
    if (def?.serialize) return def.serialize(this, options);

    const result: string[] = [];

    result.push(this.command!);

    if (this.explicitSubsupPlacement) {
      if (this.subsupPlacement === 'over-under') result.push('\\limits');
      if (this.subsupPlacement === 'adjacent') result.push('\\nolimits');
      if (this.subsupPlacement === 'auto') result.push('\\displaylimits');
    }

    result.push(this.supsubToLatex(options));
    return joinLatex(result);
  }
}
