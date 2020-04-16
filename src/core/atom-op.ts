import { registerAtomType, decompose, Atom } from './atom-utils';
import { MATHSTYLES } from './mathstyle';
import { makeSymbol, makeSpan, Span } from './span';
import { Context } from './context';

/**
 * Operators are handled in the TeXbook pg. 443-444, rule 13(a).
 */
registerAtomType('mop', (context: Context, atom: Atom): Span[] => {
    const mathstyle = context.mathstyle;
    let base;
    let baseShift = 0;
    let slant = 0;
    if (atom.isSymbol) {
        // If this is a symbol, create the symbol.

        // Most symbol operators get larger in displaystyle (rule 13)
        const large =
            mathstyle.size === MATHSTYLES.displaystyle.size &&
            atom.symbol !== '\\smallint';

        base = makeSymbol(
            large ? 'Size2-Regular' : 'Size1-Regular',
            atom.body as string,
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

        base.applyStyle({
            color: atom.phantom ? 'transparent' : atom.color,
            backgroundColor: atom.phantom
                ? 'transparent'
                : atom.backgroundColor,
            cssId: atom.cssId,
            cssClass: atom.cssClass,
            letterShapeStyle: context.letterShapeStyle,
        });
    } else if (Array.isArray(atom.body)) {
        // If this is a list, decompose that list.
        base = makeSpan(decompose(context, atom.body), '', 'mop');
    } else {
        // Otherwise, this is a text operator. Build the text from the
        // operator's name.
        console.assert(atom.type === 'mop');
        base = atom.makeSpan(context, atom.body);
    }

    // Bind the generated span and this atom so the atom can be retrieved
    // from the span later.
    atom.bind(context, base);

    if (atom.isSymbol) base.setTop(baseShift);
    let result = base;
    if (atom.superscript || atom.subscript) {
        const limits = atom.limits || 'auto';
        if (
            atom.alwaysHandleSupSub ||
            limits === 'limits' ||
            (limits === 'auto' &&
                mathstyle.size === MATHSTYLES.displaystyle.size)
        ) {
            result = atom.attachLimits(context, base, baseShift, slant);
        } else {
            result = atom.attachSupsub(context, base, 'mop');
        }
    }
    return result;
});
