import { Atom, AtomType, ToLatexOptions } from '../core/atom-class';
import { MATHSTYLES } from '../core/mathstyle';
import { makeSymbol, Span } from '../core/span';
import { Context } from '../core/context';
import { Style, Variant, VariantStyle } from '../public/core';
import { joinLatex } from '../core/tokenizer';

/**
 * Operators are handled in the TeXbook pg. 443-444, rule 13(a).
 */
export class OperatorAtom extends Atom {
    private variant: Variant;
    private variantStyle: VariantStyle;
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
            limits?: 'limits' | 'nolimits' | 'accent' | 'overunder' | 'auto';
            style?: Style;
        }
    ) {
        super(options.type ?? 'mop', {
            command,
            style: options.style,
            isExtensibleSymbol: options?.isExtensibleSymbol,
            isFunction: options?.isFunction,
        });
        if (typeof symbol === 'string') {
            this.value = symbol as string;
        } else {
            this.body = symbol as Atom[];
        }
        this.captureSelection = options.captureSelection;
        this.variant = options?.variant;
        this.variantStyle = options?.variantStyle;
        this.limits = options?.limits;
    }
    render(context: Context): Span[] {
        const mathstyle = context.mathstyle;
        let base: Span;
        let baseShift = 0;
        let slant = 0;
        if (this.isExtensibleSymbol) {
            // Most symbol operators get larger in displaystyle (rule 13)
            // except `\smallint`
            const large =
                mathstyle.size === MATHSTYLES.displaystyle.size &&
                this.value !== '\\smallint';

            base = makeSymbol(
                large ? 'Size2-Regular' : 'Size1-Regular',
                this.value,
                'op-symbol ' + (large ? 'large-op' : 'small-op'),
                'mop'
            );

            // Shift the symbol so its center lies on the axis (rule 13). It
            // appears that our fonts have the centers of the symbols already
            // almost on the axis, so these numbers are very small. Note we
            // don't actually apply this here, but instead it is used either in
            // the vlist creation or separately when there are no limits.
            baseShift =
                (base.height - base.depth) / 2 -
                mathstyle.metrics.axisHeight * mathstyle.sizeMultiplier;

            // The slant of the symbol is just its italic correction.
            slant = base.italic;
            base.applyStyle(this.mode, {
                color: this.style.color,
                backgroundColor: this.style.backgroundColor,
            });
        } else if (this.body) {
            // If this is a list, decompose that list.
            base = new Span(Atom.render(context, this.body), '', 'mop');
            base.applyStyle(this.mode, {
                color: this.style.color,
                backgroundColor: this.style.backgroundColor,
            });
        } else {
            // Otherwise, this is a text operator. Build the text from the
            // operator's name.
            console.assert(this.type === 'mop');
            base = this.makeSpan(context, this.value);
            // Not all styles are applied, since the operators have a distinct
            // appearance (for example, can't override their font family)
            base.applyStyle(this.mode, {
                color: this.style.color,
                backgroundColor: this.style.backgroundColor,
                letterShapeStyle: context.letterShapeStyle,
                variant: this.variant,
                variantStyle: this.variantStyle,
            });
        }

        if (this.isExtensibleSymbol) base.setTop(baseShift);
        let result = base;
        if (this.superscript || this.subscript) {
            const limits = this.limits ?? 'auto';
            if (
                limits === 'limits' ||
                (limits === 'auto' &&
                    mathstyle.size === MATHSTYLES.displaystyle.size)
            ) {
                result = this.attachLimits(context, base, baseShift, slant);
            } else {
                result = this.attachSupsub(context, base, 'mop');
            }
        }

        if (this.caret) result.caret = this.caret;

        // Bind the generated span with its limits so they
        // can all be selected as one
        this.bind(context, result);
        return [result];
    }
    toLatex(options: ToLatexOptions): string {
        let result = '';
        if (this.value !== '\u200b') {
            // Not ZERO-WIDTH
            if (
                this.command === '\\mathop' ||
                this.command === '\\operatorname'
            ) {
                result += this.command + `{${this.bodyToLatex(options)}}`;
            } else {
                result += this.command;
            }
        }
        result = joinLatex([result, this.supsubToLatex(options)]);
        if (this.explicitLimits) {
            if (this.limits === 'limits') result += '\\limits';
            if (this.limits === 'nolimits') result += '\\nolimits';
        }
        return result;
    }
}
