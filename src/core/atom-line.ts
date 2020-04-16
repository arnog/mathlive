import { registerAtomType, decompose, Atom } from './atom-utils';
import { MATHSTYLES } from './mathstyle';
import { METRICS as FONTMETRICS } from './font-metrics';
import { makeSpan, makeVlist, height as spanHeight, Span } from './span';
import { Context } from './context';

/**
 * \overline and \underline
 */
registerAtomType('line', (context: Context, atom: Atom): Span[] => {
    const mathstyle = context.mathstyle;
    // TeXBook:443. Rule 9 and 10
    const inner = decompose(context.cramp(), atom.body as Atom[]);
    const ruleWidth =
        FONTMETRICS.defaultRuleThickness / mathstyle.sizeMultiplier;
    const line = makeSpan(
        null,
        context.mathstyle.adjustTo(MATHSTYLES.textstyle) +
            ' ' +
            atom.position +
            '-line'
    );
    line.height = ruleWidth;
    line.maxFontSize = 1.0;
    let vlist;
    if (atom.position === 'overline') {
        vlist = makeVlist(context, [inner, 3 * ruleWidth, line, ruleWidth]);
    } else {
        const innerSpan = makeSpan(inner);
        vlist = makeVlist(
            context,
            [ruleWidth, line, 3 * ruleWidth, innerSpan],
            'top',
            spanHeight(innerSpan)
        );
    }
    return [makeSpan(vlist, atom.position, 'mord')];
});
