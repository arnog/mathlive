import { registerAtomType, decompose, Atom } from './atom-utils';
import { METRICS as FONTMETRICS } from './font-metrics';
import {
    makeSVGSpan,
    makeSpan,
    makeOrd,
    makeVlist,
    makeSymbol,
    height as spanHeight,
    skew as spanSkew,
    Span,
} from './span';
import { Context } from './context';

registerAtomType('accent', (context: Context, atom: Atom): Span[] => {
    // Accents are handled in the TeXbook pg. 443, rule 12.
    const mathstyle = context.mathstyle;
    // Build the base atom
    let base = decompose(context.cramp(), atom.body as Atom[]);
    if (atom.superscript || atom.subscript) {
        // If there is a supsub attached to the accent
        // apply it to the base.
        // Note this does not give the same result as TeX when there
        // are stacked accents, e.g. \vec{\breve{\hat{\acute{...}}}}^2
        base = [atom.attachSupsub(context, makeOrd(base), 'mord')];
    }
    // Calculate the skew of the accent. This is based on the line "If the
    // nucleus is not a single character, let s = 0; otherwise set s to the
    // kern amount for the nucleus followed by the \skewchar of its font."
    // Note that our skew metrics are just the kern between each character
    // and the skewchar.
    let skew = 0;
    if (
        Array.isArray(atom.body) &&
        atom.body.length === 1 &&
        atom.body[0].isCharacterBox()
    ) {
        skew = spanSkew(base);
    }
    // calculate the amount of space between the body and the accent
    let clearance = Math.min(spanHeight(base), mathstyle.metrics.xHeight);
    let accentBody: Span;
    if (atom.svgAccent) {
        accentBody = makeSVGSpan(atom.svgAccent);
        clearance = -clearance + FONTMETRICS.bigOpSpacing1;
    } else {
        // Build the accent
        const accent = makeSymbol('Main-Regular', atom.accent, 'math');
        // Remove the italic correction of the accent, because it only serves to
        // shift the accent over to a place we don't want.
        accent.italic = 0;
        // The \vec character that the fonts use is a combining character, and
        // thus shows up much too far to the left. To account for this, we add a
        // specific class which shifts the accent over to where we want it.
        const vecClass = atom.accent === '\u20d7' ? ' accent-vec' : '';
        accentBody = makeSpan(makeSpan(accent), 'accent-body' + vecClass);
    }
    accentBody = makeVlist(context, [base, -clearance, accentBody]);
    // Shift the accent over by the skew. Note we shift by twice the skew
    // because we are centering the accent, so by adding 2*skew to the left,
    // we shift it to the right by 1*skew.
    accentBody.children[1].setLeft(2 * skew);
    return [makeOrd([accentBody], 'accent')];
});
