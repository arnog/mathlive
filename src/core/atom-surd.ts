import { registerAtomType, decompose, Atom } from './atom-utils';
import { MATHSTYLES } from './mathstyle';
import { METRICS as FONTMETRICS } from './font-metrics';
import {
    makeSpan,
    makeOrd,
    makeVlist,
    depth as spanDepth,
    height as spanHeight,
    Span,
} from './span';
import { Context } from './context';

import { makeCustomSizedDelim } from './delimiters';

registerAtomType('surd', (context: Context, atom: Atom): Span[] => {
    // See the TeXbook pg. 443, Rule 11.
    // http://www.ctex.org/documents/shredder/src/texbook.pdf
    const mathstyle = context.mathstyle;
    // First, we do the same steps as in overline to build the inner group
    // and line
    console.assert(Array.isArray(atom.body));
    const inner = decompose(context.cramp(), atom.body as Atom[]);
    const ruleWidth =
        FONTMETRICS.defaultRuleThickness / mathstyle.sizeMultiplier;
    let phi = ruleWidth;
    if (mathstyle.id < MATHSTYLES.textstyle.id) {
        phi = mathstyle.metrics.xHeight;
    }
    // Calculate the clearance between the body and line
    let lineClearance = ruleWidth + phi / 4;
    const innerTotalHeight = Math.max(
        2 * phi,
        (spanHeight(inner) + spanDepth(inner)) * mathstyle.sizeMultiplier
    );
    const minDelimiterHeight = innerTotalHeight + (lineClearance + ruleWidth);

    // Create a \surd delimiter of the required minimum size
    const delim = makeSpan(
        makeCustomSizedDelim('', '\\surd', minDelimiterHeight, false, context),
        'sqrt-sign'
    );
    delim.applyStyle(atom.getStyle());

    const delimDepth = delim.height + delim.depth - ruleWidth;

    // Adjust the clearance based on the delimiter size
    if (delimDepth > spanHeight(inner) + spanDepth(inner) + lineClearance) {
        lineClearance =
            (lineClearance +
                delimDepth -
                (spanHeight(inner) + spanDepth(inner))) /
            2;
    }

    // Shift the delimiter so that its top lines up with the top of the line
    delim.setTop(
        delim.height - spanHeight(inner) - (lineClearance + ruleWidth)
    );
    const line = makeSpan(
        null,
        context.mathstyle.adjustTo(MATHSTYLES.textstyle) + ' sqrt-line'
    );
    line.applyStyle(atom.getStyle());
    line.height = ruleWidth;

    const body = makeVlist(context, [inner, lineClearance, line, ruleWidth]);

    if (!atom.index) {
        return [atom.bind(context, makeOrd([delim, body], 'sqrt'))];
    }

    // Handle the optional root index
    // The index is always in scriptscript style
    const newcontext = context.clone({
        mathstyle: MATHSTYLES.scriptscriptstyle,
    });
    const root = makeSpan(
        decompose(newcontext, atom.index),
        mathstyle.adjustTo(MATHSTYLES.scriptscriptstyle)
    );
    // Figure out the height and depth of the inner part
    const innerRootHeight = Math.max(delim.height, body.height);
    const innerRootDepth = Math.max(delim.depth, body.depth);
    // The amount the index is shifted by. This is taken from the TeX
    // source, in the definition of `\r@@t`.
    const toShift = 0.6 * (innerRootHeight - innerRootDepth);
    // Build a VList with the superscript shifted up correctly
    const rootVlist = makeVlist(context, [root], 'shift', -toShift);
    // Add a class surrounding it so we can add on the appropriate
    // kerning
    return [
        atom.bind(
            context,
            makeOrd([makeSpan(rootVlist, 'root'), delim, body], 'sqrt')
        ),
    ];
});
