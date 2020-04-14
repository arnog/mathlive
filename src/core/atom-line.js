import { registerAtomType, decompose } from './atom-utils.js';
import { MATHSTYLES } from './mathstyle';
import { METRICS as FONTMETRICS } from './font-metrics.js';
import { makeSpan, makeOrd, makeVlist, height as spanHeight } from './span.js';

/**
 * \overline and \underline
 *
 * @private
 */
registerAtomType('line', (context, atom) => {
    const mathstyle = context.mathstyle;
    // TeXBook:443. Rule 9 and 10
    const inner = decompose(context.cramp(), atom.body);
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
    return makeOrd(vlist, atom.position);
});
