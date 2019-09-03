/**
 * This module deals with creating delimiters of various sizes. The TeXbook
 * discusses these routines on page 441-442, in the "Another subroutine sets box
 * x to a specified variable delimiter" paragraph.
 *
 * There are three main routines here. `makeSmallDelim` makes a delimiter in the
 * normal font, but in either text, script, or scriptscript style.
 * `makeLargeDelim` makes a delimiter in textstyle, but in one of the Size1,
 * Size2, Size3, or Size4 fonts. `makeStackedDelim` makes a delimiter out of
 * smaller pieces that are stacked on top of one another.
 *
 * The functions take a parameter `center`, which determines if the delimiter
 * should be centered around the axis.
 *
 * Then, there are three exposed functions. `sizedDelim` makes a delimiter in
 * one of the given sizes. This is used for things like `\bigl`.
 * `customSizedDelim` makes a delimiter with a given total height+depth. It is
 * called in places like `\sqrt`. `leftRightDelim` makes an appropriate
 * delimiter which surrounds an expression of a given height an depth. It is
 * used in `\left` and `\right`.
 * @summary   Handling of delimiters surrounds symbols.
 * @module core/delimiters
 * @private
 */

import Definitions from './definitions.js';
import Span from './span.js';
import Mathstyle from './mathstyle.js';
import FontMetrics from './fontMetrics.js';

const makeSymbol = Span.makeSymbol;
const makeSpan = Span.makeSpan;
const makeVlist = Span.makeVlist;



/**
 * Makes a small delimiter. This is a delimiter that comes in the Main-Regular
 * font, but is restyled to either be in textstyle, scriptstyle, or
 * scriptscriptstyle.
 * @memberof module:delimiters
 * @private
 */
function makeSmallDelim(type, delim, style, center, context, classes) {
    const text = makeSymbol('AMS-Regular', Definitions.getValue('math', delim));

    const span = Span.makeStyleWrap(type, text, context.mathstyle, style, classes);

    if (center) {
        span.setTop((1 - context.mathstyle.sizeMultiplier / style.sizeMultiplier) *
            context.mathstyle.metrics.axisHeight);
    }
    span.setStyle('color', context.color);
    if (typeof context.opacity === 'number') span.setStyle('opacity', context.opacity);

    return span;
}

/**
 * Makes a large delimiter. This is a delimiter that comes in the Size1, Size2,
 * Size3, or Size4 fonts. It is always rendered in textstyle.
 * @memberof module:delimiters
 * @private
 */
function makeLargeDelim(type, delim, size, center, context, classes) {
    const inner = makeSymbol('Size' + size + '-Regular',
        Definitions.getValue('math', delim));

    const result = Span.makeStyleWrap( type,
            makeSpan(inner, 'delimsizing size' + size),
            context.mathstyle, Mathstyle.TEXT, classes);

    if (center) {
        result.setTop((1 - context.mathstyle.sizeMultiplier) *
            context.mathstyle.metrics.axisHeight);
    }
    result.setStyle('color', context.color);
    if (typeof context.opacity === 'number') result.setStyle('opacity', context.opacity);

    return result;
}

/**
 * Make an inner span with the given offset and in the given font. This is used
 * in `makeStackedDelim` to make the stacking pieces for the delimiter.
 * @memberof module:delimiters
 * @private
 */
function makeInner(symbol, font) {
    let sizeClass = '';
    // Apply the correct CSS class to choose the right font.
    if (font === 'Size1-Regular') {
        sizeClass = ' delim-size1';
    } else if (font === 'Size4-Regular') {
        sizeClass = ' delim-size4';
    }

    // @todo: revisit if all this wrapping is needed or if the spans could
    // be simplified
    const inner = makeSpan(makeSymbol(font,
        Definitions.getValue('math', symbol)), 'delimsizinginner' + sizeClass);

    return inner;
}

/**
 * Make a stacked delimiter out of a given delimiter, with the total height at
 * least `heightTotal`. This routine is mentioned on page 442 of the TeXbook.
 * @memberof module:delimiters
 * @private
 */
function makeStackedDelim(type, delim, heightTotal, center, context,
                                classes) {
    // There are four parts, the top, an optional middle, a repeated part, and a
    // bottom.
    let top;
    let middle;
    let repeat;
    let bottom;
    top = repeat = bottom = Definitions.getValue('math', delim);
    middle = null;
    // Also keep track of what font the delimiters are in
    let font = 'Size1-Regular';

    // We set the parts and font based on the symbol. Note that we use
    // '\u23d0' instead of '|' and '\u2016' instead of '\\|' for the
    // repeats of the arrows
    if (delim === '\\vert' || delim === '\\lvert' || delim === '\\rvert' || delim === '\\mvert' || delim === '\\mid') {
        repeat = top = bottom = '\u2223';
    } else if (delim === '\\Vert' || delim === '\\lVert' ||
                delim === '\\rVert' || delim === '\\mVert' || delim === '\\|') {
        repeat = top = bottom = '\u2225';
    } else if (delim === '\\uparrow') {
        repeat = bottom = '\u23d0';
    } else if (delim === '\\Uparrow') {
        repeat = bottom = '\u2016';
    } else if (delim === '\\downarrow') {
        top = repeat = '\u23d0';
    } else if (delim === '\\Downarrow') {
        top = repeat = '\u2016';
    } else if (delim === '\\updownarrow') {
        top = '\u2191';
        repeat = '\u23d0';
        bottom = '\u2193';
    } else if (delim === '\\Updownarrow') {
        top = '\u21d1';
        repeat = '\u2016';
        bottom = '\u21d3';
    } else if (delim === '[' || delim === '\\lbrack') {
        top = '\u23a1';
        repeat = '\u23a2';
        bottom = '\u23a3';
        font = 'Size4-Regular';
    } else if (delim === ']' || delim === '\\rbrack') {
        top = '\u23a4';
        repeat = '\u23a5';
        bottom = '\u23a6';
        font = 'Size4-Regular';
    } else if (delim === '\\lfloor') {
        repeat = top = '\u23a2';
        bottom = '\u23a3';
        font = 'Size4-Regular';
    } else if (delim === '\\lceil') {
        top = '\u23a1';
        repeat = bottom = '\u23a2';
        font = 'Size4-Regular';
    } else if (delim === '\\rfloor') {
        repeat = top = '\u23a5';
        bottom = '\u23a6';
        font = 'Size4-Regular';
    } else if (delim === '\\rceil') {
        top = '\u23a4';
        repeat = bottom = '\u23a5';
        font = 'Size4-Regular';
    } else if (delim === '(') {
        top = '\u239b';
        repeat = '\u239c';
        bottom = '\u239d';
        font = 'Size4-Regular';
    } else if (delim === ')') {
        top = '\u239e';
        repeat = '\u239f';
        bottom = '\u23a0';
        font = 'Size4-Regular';
    } else if (delim === '\\{' || delim === '\\lbrace') {
        top = '\u23a7';
        middle = '\u23a8';
        bottom = '\u23a9';
        repeat = '\u23aa';
        font = 'Size4-Regular';
    } else if (delim === '\\}' || delim === '\\rbrace') {
        top = '\u23ab';
        middle = '\u23ac';
        bottom = '\u23ad';
        repeat = '\u23aa';
        font = 'Size4-Regular';
    } else if (delim === '\\lgroup') {
        top = '\u23a7';
        bottom = '\u23a9';
        repeat = '\u23aa';
        font = 'Size4-Regular';
    } else if (delim === '\\rgroup') {
        top = '\u23ab';
        bottom = '\u23ad';
        repeat = '\u23aa';
        font = 'Size4-Regular';
    } else if (delim === '\\lmoustache') {
        top = '\u23a7';
        bottom = '\u23ad';
        repeat = '\u23aa';
        font = 'Size4-Regular';
    } else if (delim === '\\rmoustache') {
        top = '\u23ab';
        bottom = '\u23a9';
        repeat = '\u23aa';
        font = 'Size4-Regular';
    } else if (delim === '\\surd') {
        top = '\ue001';
        bottom = '\u23b7';
        repeat = '\ue000';
        font = 'Size4-Regular';
    } else if (delim === '\\ulcorner') {
        top = '\u250c';
        repeat = bottom = ' ';
    } else if (delim === '\\urcorner') {
        top = '\u2510';
        repeat = bottom = ' ';
    } else if (delim === '\\llcorner') {
        bottom = '\u2514';
        repeat = top = ' ';
    } else if (delim === '\\lrcorner') {
        top = '\u2518';
        repeat = top = ' ';
    }

    // Get the metrics of the four sections
    const topMetrics = FontMetrics.getCharacterMetrics(
            Definitions.getValue('math', top), font);
    const topHeightTotal = topMetrics.height + topMetrics.depth;
    const repeatMetrics = FontMetrics.getCharacterMetrics(
            Definitions.getValue('math', repeat), font);
    const repeatHeightTotal = repeatMetrics.height + repeatMetrics.depth;
    const bottomMetrics = FontMetrics.getCharacterMetrics(
            Definitions.getValue('math', bottom), font);
    const bottomHeightTotal = bottomMetrics.height + bottomMetrics.depth;
    let middleHeightTotal = 0;
    let middleFactor = 1;
    if (middle !== null) {
        const middleMetrics = FontMetrics.getCharacterMetrics(
                Definitions.getValue('math', middle), font);
        middleHeightTotal = middleMetrics.height + middleMetrics.depth;
        middleFactor = 2; // repeat symmetrically above and below middle
    }

    // Calculate the minimal height that the delimiter can have.
    // It is at least the size of the top, bottom, and optional middle combined.
    const minHeight = topHeightTotal + bottomHeightTotal + middleHeightTotal;

    // Compute the number of copies of the repeat symbol we will need
    const repeatCount = Math.ceil(
        (heightTotal - minHeight) / (middleFactor * repeatHeightTotal));

    // Compute the total height of the delimiter including all the symbols
    const realHeightTotal =
        minHeight + repeatCount * middleFactor * repeatHeightTotal;

    // The center of the delimiter is placed at the center of the axis. Note
    // that in this context, 'center' means that the delimiter should be
    // centered around the axis in the current style, while normally it is
    // centered around the axis in textstyle.
    let axisHeight = context.mathstyle.metrics.axisHeight;
    if (center) {
        axisHeight *= context.mathstyle.sizeMultiplier;
    }
    // Calculate the depth
    const depth = realHeightTotal / 2 - axisHeight;

    // Now, we start building the pieces that will go into the vlist

    // Keep a list of the inner pieces
    const inners = [];

    // Add the bottom symbol
    inners.push(makeInner(bottom, font));

    if (middle === null) {
        // Add that many symbols
        for (let i = 0; i < repeatCount; i++) {
            inners.push(makeInner(repeat, font));
        }
    } else {
        // When there is a middle bit, we need the middle part and two repeated
        // sections
        for (let i = 0; i < repeatCount; i++) {
            inners.push(makeInner(repeat, font));
        }
        inners.push(makeInner(middle, font));
        for (let i = 0; i < repeatCount; i++) {
            inners.push(makeInner(repeat, font));
        }
    }

    // Add the top symbol
    inners.push(makeInner(top, font));

    // Finally, build the vlist
    const inner = makeVlist(context, inners, 'bottom', depth);
    inner.setStyle('color', context.color);
    if (typeof context.opacity === 'number') inner.setStyle('opacity', context.opacity);

    return Span.makeStyleWrap(type, makeSpan(inner, 'delimsizing mult'),
        context.mathstyle, Mathstyle.TEXT, classes);
}

// There are three kinds of delimiters, delimiters that stack when they become
// too large
const stackLargeDelimiters = [
    '(', ')', '[', '\\lbrack', ']', '\\rbrack',
    '\\{', '\\lbrace', '\\}', '\\rbrace',
    '\\lfloor', '\\rfloor', '\\lceil', '\\rceil',
    '\\surd',
];

// delimiters that always stack
const stackAlwaysDelimiters = [
    '\\uparrow', '\\downarrow', '\\updownarrow',
    '\\Uparrow', '\\Downarrow', '\\Updownarrow',
    '|', '\\|', '\\vert', '\\Vert',
    '\\lvert', '\\rvert', '\\lVert', '\\rVert',
    '\\mvert', '\\mid',
    '\\lgroup', '\\rgroup', '\\lmoustache', '\\rmoustache',
];

// and delimiters that never stack
const stackNeverDelimiters = [
    '<', '>', '\\langle', '\\rangle', '/', '\\backslash', '\\lt', '\\gt',
];

// Metrics of the different sizes. Found by looking at TeX's output of
// $\bigl| // \Bigl| \biggl| \Biggl| \showlists$
// Used to create stacked delimiters of appropriate sizes in makeSizedDelim.
const sizeToMaxHeight = [0, 1.2, 1.8, 2.4, 3.0];

/**
 * Used to create a delimiter of a specific size, where `size` is 1, 2, 3, or 4.
 * @memberof module:delimiters
 * @private
 */
function makeSizedDelim(type, delim, size, context, classes) {
    if (delim === '.') {
        // Empty delimiters still count as elements, even though they don't
        // show anything.
        return makeNullFence(type, context, classes);
        // return makeSpan('', classes);
    }

    // < and > turn into \langle and \rangle in delimiters
    if (delim === '<' || delim === '\\lt') {
        delim = '\\langle';
    } else if (delim === '>' || delim === '\\gt') {
        delim = '\\rangle';
    }

    // Sized delimiters are never centered.
    if (stackLargeDelimiters.includes(delim) ||
        stackNeverDelimiters.includes(delim)) {
        return makeLargeDelim(type, delim, size, false, context, classes);
    } else if (stackAlwaysDelimiters.includes(delim)) {
        return makeStackedDelim(
            type, delim, sizeToMaxHeight[size], false, context, classes);
    }
    console.assert(false, 'Unknown delimiter \'' + delim + '\'');
    return null;
}

/*
 * There are three different sequences of delimiter sizes that the delimiters
 * follow depending on the kind of delimiter. This is used when creating custom
 * sized delimiters to decide whether to create a small, large, or stacked
 * delimiter.
 *
 * In real TeX, these sequences aren't explicitly defined, but are instead
 * defined inside the font metrics. Since there are only three sequences that
 * are possible for the delimiters that TeX defines, it is easier to just encode
 * them explicitly here.
 */

// Delimiters that never stack try small delimiters and large delimiters only
const stackNeverDelimiterSequence = [
    {type: 'small', mathstyle: Mathstyle.SCRIPTSCRIPT},
    {type: 'small', mathstyle: Mathstyle.SCRIPT},
    {type: 'small', mathstyle: Mathstyle.TEXT},
    {type: 'large', size: 1},
    {type: 'large', size: 2},
    {type: 'large', size: 3},
    {type: 'large', size: 4},
];

// Delimiters that always stack try the small delimiters first, then stack
const stackAlwaysDelimiterSequence = [
    {type: 'small', mathstyle: Mathstyle.SCRIPTSCRIPT},
    {type: 'small', mathstyle: Mathstyle.SCRIPT},
    {type: 'small', mathstyle: Mathstyle.TEXT},
    {type: 'stack'},
];

// Delimiters that stack when large try the small and then large delimiters, and
// stack afterwards
const stackLargeDelimiterSequence = [
    {type: 'small', mathstyle: Mathstyle.SCRIPTSCRIPT},
    {type: 'small', mathstyle: Mathstyle.SCRIPT},
    {type: 'small', mathstyle: Mathstyle.TEXT},
    {type: 'large', size: 1},
    {type: 'large', size: 2},
    {type: 'large', size: 3},
    {type: 'large', size: 4},
    {type: 'stack'},
];

/*
 * Get the font used in a delimiter based on what kind of delimiter it is.
 */
function delimTypeToFont(type) {
    if (type.type === 'small') {
        return 'Main-Regular';
    } else if (type.type === 'large') {
        return 'Size' + type.size + '-Regular';
    }
    console.assert(type.type === 'stack');
    return 'Size4-Regular';
}

/**
 * Traverse a sequence of types of delimiters to decide what kind of delimiter
 * should be used to create a delimiter of the given height+depth.
 * @param {string} delim: a character value (not a command)
 * @memberof module:delimiters
 * @private
 */
function traverseSequence(delim, height, sequence, context) {
    // Here, we choose the index we should start at in the sequences. In smaller
    // sizes (which correspond to larger numbers in style.size) we start earlier
    // in the sequence. Thus, scriptscript starts at index 3-3=0, script starts
    // at index 3-2=1, text starts at 3-1=2, and display starts at min(2,3-0)=2
    const start = Math.min(2, 3 - context.mathstyle.size);
    for (let i = start; i < sequence.length; i++) {
        if (sequence[i].type === 'stack') {
            // This is always the last delimiter, so we just break the loop now.
            break;
        }

        const metrics = FontMetrics.getCharacterMetrics(
                delim,
                delimTypeToFont(sequence[i]));
        if (metrics.defaultMetrics) {
            // If we don't have metrics info for this character,
            // assume we'll construct as a small delimiter
            return {type: 'small', mathstyle: Mathstyle.SCRIPT};
        }
        let heightDepth = metrics.height + metrics.depth;

        // Small delimiters are scaled down versions of the same font, so we
        // account for the style change size.

        if (sequence[i].type === 'small') {
            heightDepth *= sequence[i].mathstyle.sizeMultiplier;
        }

        // Check if the delimiter at this size works for the given height.
        if (heightDepth > height) {
            return sequence[i];
        }
    }

    // If we reached the end of the sequence, return the last sequence element.
    return sequence[sequence.length - 1];
}


/**
 * Make a delimiter of a given height+depth, with optional centering. Here, we
 * traverse the sequences, and create a delimiter that the sequence tells us to.
 *
 * @param {string} type 'mopen' or 'mclose'
 * @param {string} delim
 * @param {number} height
 * @param {boolean} center
 * @param {Context.Context} context
 * @param {string[]} classes
 * @memberof module:delimiters
 * @private
 */
function makeCustomSizedDelim(type, delim, height, center, context, classes) {
    if (!delim || delim.length === 0 || delim === '.') {
        return makeNullFence(type, context, type);
    }

    if (delim === '<' || delim === '\\lt') {
        delim = '\\langle';
    } else if (delim === '>' || delim === '\\gt') {
        delim = '\\rangle';
    }

    // Decide what sequence to use
    let sequence;
    if (stackNeverDelimiters.includes(delim)) {
        sequence = stackNeverDelimiterSequence;
    } else if (stackLargeDelimiters.includes(delim)) {
        sequence = stackLargeDelimiterSequence;
    } else {
        sequence = stackAlwaysDelimiterSequence;
    }

    // Look through the sequence
    const delimType = traverseSequence(Definitions.getValue('math', delim),
        height, sequence, context);

    // Depending on the sequence element we decided on, call the appropriate
    // function.
    if (delimType.type === 'small') {
        return makeSmallDelim(type, delim, delimType.mathstyle, center, context,
                              classes);
    } else if (delimType.type === 'large') {
        return makeLargeDelim(type, delim, delimType.size, center, context,
                              classes);
    }
    console.assert(delimType.type === 'stack');
    return makeStackedDelim(type, delim, height, center, context, classes);
}

/**
 * Make a delimiter for use with `\left` and `\right`, given a height and depth
 * of an expression that the delimiters surround.
 * See tex.web:14994
 * @memberof module:delimiters
 * @private
 */
function makeLeftRightDelim(type, delim, height, depth, context, classes) {
    // If this is the empty delimiter, return a null fence
    if (delim === '.') {
        return makeNullFence(type, context, classes);
    }

    // We always center \left/\right delimiters, so the axis is always shifted
    const axisHeight =
        context.mathstyle.metrics.axisHeight * context.mathstyle.sizeMultiplier;

    // Taken from TeX source, tex.web, function make_left_right
    const delimiterFactor = 901;    // plain.tex:327
    const delimiterShortfall = 5.0 / FontMetrics.METRICS.ptPerEm;  // plain.tex:345

    let delta2 = depth + axisHeight;
    let delta1 = height - axisHeight;
    delta1 = Math.max(delta2, delta1);

    let delta  = (delta1 * delimiterFactor) / 500;
    delta2  = 2 * delta1 - delimiterShortfall;
    delta = Math.max(delta, delta2);

    // const maxDistFromAxis = Math.max(height - axisHeight, depth + axisHeight);
    // const totalHeight = Math.max(
    //     // In real TeX, calculations are done using integral values which are
    //     // 65536 per pt, or 655360 per em. So, the division here truncates in
    //     // TeX but doesn't here, producing different results. If we wanted to
    //     // exactly match TeX's calculation, we could do
    //     //   Math.floor(655360 * maxDistFromAxis / 500) *
    //     //    delimiterFactor / 655360
    //     // (To see the difference, compare
    //     //    x^{x^{\left(\rule{0.1em}{0.68em}\right)}}
    //     // in TeX and KaTeX)
    //     maxDistFromAxis / 500 * delimiterFactor,
    //     2 * maxDistFromAxis - delimiterShortfall);

    // Finally, we defer to `makeCustomSizedDelim` with our calculated total
    // height
    return makeCustomSizedDelim(type, delim, delta, true, context, classes);
}

/**
 *
 * @param {Context} context
 * @param {string} [type] either 'mopen', 'mclose' or null
 * @memberof module:delimiters
 * @private
 */
function makeNullFence(type, context, classes) {
    return Span.makeSpanOfType(type, '',
        'sizing' +                                           // @todo not useful, redundant with 'nulldelimiter'
        // 'reset-' + context.size, 'size5',                 // @todo: that seems like a lot of resizing... do we need both?
        context.mathstyle.adjustTo(Mathstyle.TEXT) +

        ' nulldelimiter '            // The null delimiter has a width, specified by class 'nulldelimiter'
        + (classes || '')
    );
}


// Export the public interface for this module
export default {
    makeSizedDelim,
    makeCustomSizedDelim,
    makeLeftRightDelim
}



