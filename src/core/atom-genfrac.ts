import { registerAtomType, decompose, Atom } from './atom-utils';
import { MATHSTYLES } from './mathstyle';
import { METRICS as FONTMETRICS } from './font-metrics';
import { makeSpan, makeHlist, makeVlist, Span } from './span';
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
    // Rule 15b from Appendix G
    let numShift: number;
    let clearance: number;
    let denomShift: number;
    if (mathstyle.size === MATHSTYLES.displaystyle.size) {
        numShift = mathstyle.metrics.num1;
        if (ruleWidth > 0) {
            clearance = 3 * ruleWidth;
        } else {
            clearance = 7 * FONTMETRICS.defaultRuleThickness;
        }
        denomShift = mathstyle.metrics.denom1;
    } else {
        if (ruleWidth > 0) {
            numShift = mathstyle.metrics.num2;
            clearance = ruleWidth;
        } else {
            numShift = mathstyle.metrics.num3;
            clearance = 3 * FONTMETRICS.defaultRuleThickness;
        }
        denomShift = mathstyle.metrics.denom2;
    }
    const numerDepth = numerReset ? numerReset.depth : 0;
    const denomHeight = denomReset ? denomReset.height : 0;
    let frac: string | Span;
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
        if (
            numShift - numerDepth - (axisHeight + 0.5 * ruleWidth) <
            clearance
        ) {
            numShift +=
                clearance -
                (numShift - numerDepth - (axisHeight + 0.5 * ruleWidth));
        }
        if (
            axisHeight - 0.5 * ruleWidth - (denomHeight - denomShift) <
            clearance
        ) {
            denomShift +=
                clearance -
                (axisHeight - 0.5 * ruleWidth - (denomHeight - denomShift));
        }
        const mid = makeSpan(
            null,
            /* newContext.mathstyle.adjustTo(MATHSTYLES.textstyle) + */ ' frac-line'
        );
        mid.applyStyle(atom.getStyle());
        // @todo: do we really need to reset the size?
        // Manually set the height of the line because its height is
        // created in CSS
        mid.height = ruleWidth;
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
