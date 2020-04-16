import { registerAtomType, decompose, Atom } from './atom-utils';
import {
    Span,
    SpanType,
    isSpanType,
    makeSVGSpan,
    makeSpan,
    makeVlist,
    depth as spanDepth,
    height as spanHeight,
} from './span';
import { METRICS as FONTMETRICS } from './font-metrics';
import { MATHSTYLES } from './mathstyle';
import { Context } from './context';

// An `overunder` atom has the following attributes:
// - body: atoms[]: atoms displayed on the base line
// - svgBody: string. A SVG graphic displayed on the base line (if present, the body is ignored)
// - overscript: atoms[]: atoms displayed above the body
// - svgAbove: string. A named SVG graphic above the element
// - underscript: atoms[]: atoms displayed below the body
// - svgBelow: string. A named SVG graphic below the element
// - skipBoundary: boolean. If true, ignore atom boundary when keyboard navigating
registerAtomType('overunder', (context: Context, atom: Atom): Span[] => {
    const body: Span | Span[] = atom.svgBody
        ? makeSVGSpan(atom.svgBody)
        : decompose(context, atom.body as Atom[]);
    const annotationStyle = context.clone({
        mathstyle: MATHSTYLES.scriptstyle,
    });
    let above: Span;
    let below: Span;
    if (atom.svgAbove) {
        above = makeSVGSpan(atom.svgAbove);
    } else if (atom.overscript) {
        above = makeSpan(
            decompose(annotationStyle, atom.overscript),
            context.mathstyle.adjustTo(annotationStyle.mathstyle)
        );
    }
    if (atom.svgBelow) {
        below = makeSVGSpan(atom.svgBelow);
    } else if (atom.underscript) {
        below = makeSpan(
            decompose(annotationStyle, atom.underscript),
            context.mathstyle.adjustTo(annotationStyle.mathstyle)
        );
    }
    if (above && below) {
        // Pad the above and below if over a "base"
        below.setLeft(0.3);
        below.setRight(0.3);
        above.setLeft(0.3);
        above.setRight(0.3);
    }
    return makeOverunderStack(
        context,
        body,
        above,
        below,
        isSpanType(atom.type) ? atom.type : 'mord'
    );
});

/**
 * Combine a nucleus with an atom above and an atom below. Used to form
 * stacks for the 'overunder' atom type .
 *
 * @param {Span} nucleus The base over and under which the atoms will
 * be placed.
 * @param {string} type The type ('mop', 'mrel', etc...) of the result
 */
function makeOverunderStack(
    context: Context,
    nucleus: Span | Span[],
    above: Span,
    below: Span,
    type: SpanType
): Span[] {
    // If nothing above and nothing below, nothing to do.
    if (!above && !below) return Array.isArray(nucleus) ? nucleus : [nucleus];

    let aboveShift = 0;
    let belowShift = 0;

    if (above) {
        aboveShift = Math.max(
            FONTMETRICS.bigOpSpacing1,
            FONTMETRICS.bigOpSpacing3 - spanDepth(above)
        );
    }
    if (below) {
        belowShift = Math.max(
            FONTMETRICS.bigOpSpacing2,
            FONTMETRICS.bigOpSpacing4 - spanHeight(below)
        );
    }

    let result = null;

    if (below && above) {
        const bottom =
            spanHeight(below) + spanDepth(below) + spanDepth(nucleus);

        result = makeVlist(
            context,
            [
                0,
                below,
                FONTMETRICS.bigOpSpacing3 + spanDepth(nucleus),
                nucleus,
                -aboveShift,
                above,
                FONTMETRICS.bigOpSpacing2,
            ],
            'bottom',
            bottom
        );
    } else if (below && !above) {
        const top = spanHeight(nucleus);

        result = makeVlist(
            context,
            [0, below, belowShift, nucleus],
            'top',
            top
        );
    } else if (above && !below) {
        result = makeVlist(
            context,
            [
                nucleus,
                Math.max(
                    FONTMETRICS.bigOpSpacing2,
                    aboveShift - spanDepth(above)
                ), // TeXBook 13a, p.444
                above,
                0,
            ],
            'bottom',
            spanDepth(nucleus)
        );
    }

    return [makeSpan(result, 'op-over-under', type)];
}
