import { registerAtomType, decompose, Atom } from './atom-utils';
import { MATHSTYLES } from './mathstyle';
import { METRICS as FONTMETRICS } from './font-metrics';
import {
    Span,
    makeSpan,
    makeHlist,
    makeVlist,
    depth as spanDepth,
    height as spanHeight,
} from './span';
import { makeCustomSizedDelim } from './delimiters';
import { Context } from './context';

/**
 * Gengrac -- Generalized fraction
 *
 * Decompose fractions, binomials, and in general anything made
 * of two expressions on top of each other, optionally separated by a bar,
 * and optionally surrounded by fences (parentheses, brackets, etc...)
 *
 * Depending on the type of fraction the mathstyle is either
 * display math or inline math (which is indicated by 'textstyle'). This value can
 * also be set to 'auto', which indicates it should use the current mathstyle
 */
registerAtomType('genfrac', (context: Context, atom: Atom): Span[] => {
    const mathstyle =
        atom.mathstyle === 'auto'
            ? context.mathstyle
            : MATHSTYLES[atom.mathstyle];
    const newContext = context.clone({ mathstyle: mathstyle });
    let numer = [];
    if (atom.numerPrefix) {
        numer.push(makeSpan(atom.numerPrefix, 'mord'));
    }
    const numeratorStyle = atom.continuousFraction
        ? mathstyle
        : mathstyle.fracNum();
    numer = numer.concat(
        decompose(newContext.clone({ mathstyle: numeratorStyle }), atom.numer)
    );
    const numerReset = makeHlist(
        numer,
        context.mathstyle.adjustTo(numeratorStyle)
    );
    let denom = [];
    if (atom.denomPrefix) {
        denom.push(makeSpan(atom.denomPrefix, 'mord'));
    }
    const denominatorStyle = atom.continuousFraction
        ? mathstyle
        : mathstyle.fracDen();
    denom = denom.concat(
        decompose(newContext.clone({ mathstyle: denominatorStyle }), atom.denom)
    );
    const denomReset = makeHlist(
        denom,
        context.mathstyle.adjustTo(denominatorStyle)
    );
    const ruleWidth = !atom.hasBarLine
        ? 0
        : FONTMETRICS.defaultRuleThickness / mathstyle.sizeMultiplier;
    // Rule 15b from TeXBook Appendix G, p.444
    //
    // 15b. If C > T, set u ← σ8 and v ← σ11. Otherwise set u ← σ9 or σ10,according
    // as θ ̸= 0 or θ = 0, and set v ← σ12. (The fraction will be typeset with
    // its numerator shifted up by an amount u with respect to the current
    // baseline, and with the denominator shifted down by v, unless the boxes
    // are unusually large.)
    let numShift: number;
    let clearance = 0;
    let denomShift: number;
    if (mathstyle.size === MATHSTYLES.displaystyle.size) {
        numShift = mathstyle.metrics.num1; // set u ← σ8
        if (ruleWidth > 0) {
            clearance = 3 * ruleWidth; //  φ ← 3θ
        } else {
            clearance = 7 * FONTMETRICS.defaultRuleThickness; // φ ← 7 ξ8
        }
        denomShift = mathstyle.metrics.denom1; // v ← σ11
    } else {
        if (ruleWidth > 0) {
            numShift = mathstyle.metrics.num2; // u ← σ9
            clearance = ruleWidth; //  φ ← θ
        } else {
            numShift = mathstyle.metrics.num3; // u ← σ10
            clearance = 3 * FONTMETRICS.defaultRuleThickness; // φ ← 3 ξ8
        }
        denomShift = mathstyle.metrics.denom2; // v ← σ12
    }
    const numerDepth = numerReset ? spanDepth(numerReset) : 0;
    const denomHeight = denomReset ? spanHeight(denomReset) : 0;
    let frac: Span;
    if (ruleWidth === 0) {
        // Rule 15c from Appendix G
        // No bar line between numerator and denominator
        const candidateClearance =
            numShift - numerDepth - (denomHeight - denomShift);
        if (candidateClearance < clearance) {
            numShift += 0.5 * (clearance - candidateClearance);
            denomShift += 0.5 * (clearance - candidateClearance);
        }
        frac = makeVlist(
            newContext,
            [numerReset, -numShift, denomReset, denomShift],
            'individualShift'
        );
    } else {
        // Rule 15d from Appendix G
        // There is a bar line between the numerator and the denominator
        const axisHeight = mathstyle.metrics.axisHeight;
        const numerLine = axisHeight + 0.5 * ruleWidth;
        const denomLine = axisHeight - 0.5 * ruleWidth;
        if (numShift - numerDepth - numerLine < clearance) {
            numShift += clearance - (numShift - numerDepth - numerLine);
        }
        if (denomLine - (denomHeight - denomShift) < clearance) {
            denomShift += clearance - (denomLine - (denomHeight - denomShift));
        }
        const mid = makeSpan(null, ' frac-line');
        mid.applyStyle(atom.getStyle());
        // Manually set the height of the line because its height is
        // created in CSS
        mid.height = ruleWidth / 2;
        mid.depth = ruleWidth / 2;
        const elements = [];
        if (numerReset) {
            elements.push(numerReset);
            elements.push(-numShift);
        }
        elements.push(mid);
        elements.push(ruleWidth / 2 - axisHeight);
        if (denomReset) {
            elements.push(denomReset);
            elements.push(denomShift);
        }
        frac = makeVlist(newContext, elements, 'individualShift');
    }
    // Add a 'mfrac' class to provide proper context for
    // other css selectors (such as 'frac-line')
    frac.classes += ' mfrac';
    // Since we manually change the style sometimes (with \dfrac or \tfrac),
    // account for the possible size change here.
    frac.height *= mathstyle.sizeMultiplier / context.mathstyle.sizeMultiplier;
    frac.depth *= mathstyle.sizeMultiplier / context.mathstyle.sizeMultiplier;
    // if (!atom.leftDelim && !atom.rightDelim) {
    //     return makeOrd(frac,
    //         context.parentMathstyle.adjustTo(mathstyle) +
    //         ((context.parentSize !== context.size) ?
    //             (' sizing reset-' + context.parentSize + ' ' + context.size) : ''));
    // }
    // Rule 15e of Appendix G
    const delimSize =
        mathstyle.size === MATHSTYLES.displaystyle.size
            ? mathstyle.metrics.delim1
            : mathstyle.metrics.delim2;
    // Optional delimiters
    const leftDelim = atom.bind(
        context,
        makeCustomSizedDelim(
            'mopen',
            atom.leftDelim,
            delimSize,
            true,
            context.clone({ mathstyle: mathstyle })
        )
    );
    const rightDelim = atom.bind(
        context,
        makeCustomSizedDelim(
            'mclose',
            atom.rightDelim,
            delimSize,
            true,
            context.clone({ mathstyle: mathstyle })
        )
    );
    leftDelim.applyStyle(atom.getStyle());
    rightDelim.applyStyle(atom.getStyle());

    return [
        atom.bind(
            context,
            makeSpan(
                [leftDelim, frac, rightDelim],
                context.parentSize !== context.size
                    ? 'sizing reset-' + context.parentSize + ' ' + context.size
                    : '',
                'mord'
            )
        ),
    ];
});
