import type { Variant, VariantStyle } from '../public/core-types';

import { Atom } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { joinLatex } from '../core/tokenizer';
import { getDefinition } from '../latex-commands/definitions-utils';
import type { CreateAtomOptions, AtomJson, ToLatexOptions } from 'core/types';

/**
 * Operators are handled in the TeXbook pg. 443-444, rule 13(a).
 *
 * An operator is not necessarily of type 'mop'. It is rendered as text
 * in a fixed font. For example, `\sin` is an operator.
 * On the other hand `\int` is an ExtensibleSymbolAtom.
 *
 */
export class OperatorAtom extends Atom {
  private readonly variant?: Variant;
  private readonly variantStyle?: VariantStyle;

  constructor(
    symbol: string,
    options: CreateAtomOptions & {
      isFunction?: boolean;
      variant?: Variant;
      variantStyle?: VariantStyle;
      limits?: 'auto' | 'over-under' | 'adjacent';
    }
  ) {
    super({
      ...options,
      type: 'operator',
      isFunction: options?.isFunction,
    });
    this.value = symbol;

    this.variant = options?.variant;
    this.variantStyle = options?.variantStyle;
    this.subsupPlacement = options?.limits;
  }

  static fromJson(json: AtomJson): OperatorAtom {
    return new OperatorAtom(json.symbol, json as any);
  }

  toJson(): AtomJson {
    const result = super.toJson();

    if (this.variant) result.variant = this.variant;
    if (this.variantStyle) result.variantStyle = this.variantStyle;
    if (this.subsupPlacement) result.limits = this.subsupPlacement;
    if (this.value) result.symbol = this.value;
    return result;
  }

  render(context: Context): Box | null {
    // Build the text from the operator's name.

    // Not all styles are applied, since the operators have a distinct
    // appearance (for example, can't override their font family)
    const base = new Box(this.value, {
      type: 'op',
      mode: 'math',
      maxFontSize: context.scalingFactor,
      style: {
        variant: this.variant,
        variantStyle: this.variantStyle,
      },
      isSelected: this.isSelected,
      letterShapeStyle: context.letterShapeStyle,
    });

    let result = base;
    if (this.superscript || this.subscript) {
      const limits = this.subsupPlacement ?? 'auto';
      result =
        limits === 'over-under' || (limits === 'auto' && context.isDisplayStyle)
          ? this.attachLimits(context, { base })
          : this.attachSupsub(context, { base });
    }

    // Bind the generated box with its limits so they can all be selected as one
    return new Box(this.bind(context, result), {
      type: 'op',
      caret: this.caret,
      isSelected: this.isSelected,
      classes: 'op-group',
    }).wrap(context);
  }

  _serialize(options: ToLatexOptions): string {
    if (
      !(
        options.expandMacro ||
        options.skipStyles ||
        options.skipPlaceholders
      ) &&
      typeof this.verbatimLatex === 'string'
    )
      return this.verbatimLatex;
    const def = getDefinition(this.command, this.mode);
    if (def?.serialize) return def.serialize(this, options);

    const result: string[] = [this.command!];

    if (this.explicitSubsupPlacement) {
      if (this.subsupPlacement === 'over-under') result.push('\\limits');
      if (this.subsupPlacement === 'adjacent') result.push('\\nolimits');
      if (this.subsupPlacement === 'auto') result.push('\\displaylimits');
    }

    result.push(this.supsubToLatex(options));
    return joinLatex(result);
  }
}
