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
 */

import { makeSymbol, makeVlist, SpanType, Span, makeHlist } from './span';
import { Mathstyle, MATHSTYLES } from './mathstyle';
import {
  getCharacterMetrics,
  METRICS,
  SIZING_MULTIPLIER,
} from './font-metrics';
import type { Context } from './context';
import { ParseMode, Style } from '../public/core';
export const RIGHT_DELIM = {
  '(': ')',
  '{': '}',
  '[': ']',
  '|': '|',
  '\\lbrace': '\\rbrace',
  '\\{': '\\}',
  '\\langle': '\\rangle',
  '\\lfloor': '\\rfloor',
  '\\lceil': '\\rceil',
  '\\vert': '\\vert',
  '\\lvert': '\\rvert',
  '\\Vert': '\\Vert',
  '\\lVert': '\\rVert',
  '\\lbrack': '\\rbrack',
  '\\ulcorner': '\\urcorner',
  '\\llcorner': '\\lrcorner',
  '\\lgroup': '\\rgroup',
  '\\lmoustache': '\\rmoustache',
};

function makeStyleWrap(
  children: Span | Span[],
  fromStyle: Mathstyle,
  toStyle: Mathstyle,
  options: {
    classes?: string;
    type?: SpanType;
    mode?: ParseMode;
    style?: Style;
  }
): Span {
  const result = makeHlist(children, {
    ...options,
    classes:
      (options.classes ?? '') + ' style-wrap ' + fromStyle.adjustTo(toStyle),
  });

  const multiplier = toStyle.sizeMultiplier / fromStyle.sizeMultiplier;
  result.height *= multiplier;
  result.depth *= multiplier;
  result.maxFontSize = multiplier; /** @revisit: shouldn't that be `multiplier` ? */

  return result;
}

function getSymbolValue(symbol: string): string {
  return (
    {
      '[': '[',
      ']': ']',
      '(': '(',
      ')': ')',
      '\\mid': '\u2223',
      '|': '\u2223',
      '\u2223': '\u2223', // DIVIDES
      '\u2225': '\u2225', // PARALLEL TO
      '\\|': '\u2223',
      '\\{': '{',
      '\\}': '}',
      '\\lbrace': '{',
      '\\rbrace': '}',
      '\\lbrack': '[',
      '\\rbrack': ']',
      '\\vert': '\u2223',
      '\\lvert': '\u2223',
      '\\mvert': '\u2223',
      '\\rvert': '\u2223',
      '\\Vert': '\u2225',
      '\\lVert': '\u2225',
      '\\mVert': '\u2225',
      '\\rVert': '\u2225',
      '\\parallel': '\u2225',
      '\\shortparallel': '\u2225',
      '\\langle': '\u27E8',
      '\\rangle': '\u27E9',
      '\\lfloor': '\u230A',
      '\\rfloor': '\u230B',
      '\\lceil': '\u2308',
      '\\rceil': '\u2309',
      '\\ulcorner': '\u250C',
      '\\urcorner': '\u2510',
      '\\llcorner': '\u2514',
      '\\lrcorner': '\u2518',
      '\\lgroup': '\u27EE',
      '\\rgroup': '\u27EF',
      '\\lmoustache': '\u23B0',
      '\\rmoustache': '\u23B1',
      '\\surd': '\u221A',
    }[symbol] ?? symbol
  );
}

/**
 * Makes a small delimiter. This is a delimiter that comes in the Main-Regular
 * font, but is restyled to either be in textstyle, scriptstyle, or
 * scriptscriptstyle.
 */
function makeSmallDelim(
  delim: string,
  mathstyle: Mathstyle,
  center: boolean,
  context: Context,
  options: {
    classes: string;
    type: 'mopen' | 'mclose' | 'minner';
    mode?: ParseMode;
    style?: Style;
  }
): Span {
  const text = makeSymbol('Main-Regular', getSymbolValue(delim));

  const span = makeStyleWrap(text, context.mathstyle, mathstyle, options);

  if (center) {
    span.setTop(
      (1 - context.mathstyle.sizeMultiplier / mathstyle.sizeMultiplier) *
        context.mathstyle.metrics.axisHeight *
        SIZING_MULTIPLIER[context.size]
    );
  }

  span.setStyle('color', context.color);
  if (typeof context.opacity === 'number') {
    span.setStyle('opacity', context.opacity);
  }

  return span;
}

/**
 * Makes a large delimiter. This is a delimiter that comes in the Size1, Size2,
 * Size3, or Size4 fonts. It is always rendered in textstyle.
 */
function makeLargeDelim(
  delim: string,
  size: number,
  center: boolean,
  context: Context,
  options: {
    classes?: string;
    type?: 'mopen' | 'mclose' | 'minner';
    mode?: ParseMode;
    style?: Style;
  }
): Span {
  const result = makeStyleWrap(
    makeSymbol('Size' + size + '-Regular', getSymbolValue(delim), {
      classes: 'delimsizing size' + size,
    }),
    context.mathstyle,
    MATHSTYLES.textstyle,
    options
  );

  if (center) {
    result.setTop(
      (1 - context.mathstyle.sizeMultiplier) *
        context.mathstyle.metrics.axisHeight *
        SIZING_MULTIPLIER[context.size]
    );
  }

  result.setStyle('color', context.color);
  if (typeof context.opacity === 'number') {
    result.setStyle('opacity', context.opacity);
  }

  return result;
}

/**
 * Make a stacked delimiter out of a given delimiter, with the total height at
 * least `heightTotal`. This routine is mentioned on page 442 of the TeXbook.
 */
function makeStackedDelim(
  delim: string,
  heightTotal: number,
  center: boolean,
  context: Context,
  options: {
    classes?: string;
    type?: SpanType;
    mode?: ParseMode;
    style?: Style;
  }
): Span {
  // There are four parts, the top, an optional middle, a repeated part, and a
  // bottom.
  let top: string;
  let middle: string;
  let repeat: string;
  let bottom: string;
  top = repeat = bottom = getSymbolValue(delim);
  middle = null;
  // Also keep track of what font the delimiters are in
  let font = 'Size1-Regular';

  // We set the parts and font based on the symbol. Note that we use
  // '\u23d0' instead of '|' and '\u2016' instead of '\\|' for the
  // repeats of the arrows
  if (
    delim === '\\vert' ||
    delim === '\\lvert' ||
    delim === '\\rvert' ||
    delim === '\\mvert' ||
    delim === '\\mid'
  ) {
    repeat = top = bottom = '\u2223';
  } else if (
    delim === '\\Vert' ||
    delim === '\\lVert' ||
    delim === '\\rVert' ||
    delim === '\\mVert' ||
    delim === '\\|'
  ) {
    repeat = top = bottom = '\u2225';
  } else if (delim === '\\uparrow') {
    repeat = bottom = '\u23D0';
  } else if (delim === '\\Uparrow') {
    repeat = bottom = '\u2016';
  } else if (delim === '\\downarrow') {
    top = repeat = '\u23D0';
  } else if (delim === '\\Downarrow') {
    top = repeat = '\u2016';
  } else if (delim === '\\updownarrow') {
    top = '\u2191';
    repeat = '\u23D0';
    bottom = '\u2193';
  } else if (delim === '\\Updownarrow') {
    top = '\u21D1';
    repeat = '\u2016';
    bottom = '\u21D3';
  } else if (delim === '[' || delim === '\\lbrack') {
    top = '\u23A1';
    repeat = '\u23A2';
    bottom = '\u23A3';
    font = 'Size4-Regular';
  } else if (delim === ']' || delim === '\\rbrack') {
    top = '\u23A4';
    repeat = '\u23A5';
    bottom = '\u23A6';
    font = 'Size4-Regular';
  } else if (delim === '\\lfloor') {
    repeat = top = '\u23A2';
    bottom = '\u23A3';
    font = 'Size4-Regular';
  } else if (delim === '\\lceil') {
    top = '\u23A1';
    repeat = bottom = '\u23A2';
    font = 'Size4-Regular';
  } else if (delim === '\\rfloor') {
    repeat = top = '\u23A5';
    bottom = '\u23A6';
    font = 'Size4-Regular';
  } else if (delim === '\\rceil') {
    top = '\u23A4';
    repeat = bottom = '\u23A5';
    font = 'Size4-Regular';
  } else if (delim === '(') {
    top = '\u239B';
    repeat = '\u239C';
    bottom = '\u239D';
    font = 'Size4-Regular';
  } else if (delim === ')') {
    top = '\u239E';
    repeat = '\u239F';
    bottom = '\u23A0';
    font = 'Size4-Regular';
  } else if (delim === '\\{' || delim === '\\lbrace') {
    top = '\u23A7';
    middle = '\u23A8';
    bottom = '\u23A9';
    repeat = '\u23AA';
    font = 'Size4-Regular';
  } else if (delim === '\\}' || delim === '\\rbrace') {
    top = '\u23AB';
    middle = '\u23AC';
    bottom = '\u23AD';
    repeat = '\u23AA';
    font = 'Size4-Regular';
  } else if (delim === '\\lgroup') {
    top = '\u23A7';
    bottom = '\u23A9';
    repeat = '\u23AA';
    font = 'Size4-Regular';
  } else if (delim === '\\rgroup') {
    top = '\u23AB';
    bottom = '\u23AD';
    repeat = '\u23AA';
    font = 'Size4-Regular';
  } else if (delim === '\\lmoustache') {
    top = '\u23A7';
    bottom = '\u23AD';
    repeat = '\u23AA';
    font = 'Size4-Regular';
  } else if (delim === '\\rmoustache') {
    top = '\u23AB';
    bottom = '\u23A9';
    repeat = '\u23AA';
    font = 'Size4-Regular';
  } else if (delim === '\\surd') {
    top = '\uE001';
    bottom = '\u23B7';
    repeat = '\uE000';
    font = 'Size4-Regular';
  } else if (delim === '\\ulcorner') {
    top = '\u250C';
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
  const topMetrics = getCharacterMetrics(getSymbolValue(top), font);
  const topHeightTotal = topMetrics.height + topMetrics.depth;
  const repeatMetrics = getCharacterMetrics(getSymbolValue(repeat), font);
  const repeatHeightTotal = repeatMetrics.height + repeatMetrics.depth;
  const bottomMetrics = getCharacterMetrics(getSymbolValue(bottom), font);
  const bottomHeightTotal = bottomMetrics.height + bottomMetrics.depth;
  let middleHeightTotal = 0;
  let middleFactor = 1;
  if (middle !== null) {
    const middleMetrics = getCharacterMetrics(getSymbolValue(middle), font);
    middleHeightTotal = middleMetrics.height + middleMetrics.depth;
    middleFactor = 2; // Repeat symmetrically above and below middle
  }

  // Calculate the minimal height that the delimiter can have.
  // It is at least the size of the top, bottom, and optional middle combined.
  const minHeight = topHeightTotal + bottomHeightTotal + middleHeightTotal;

  // Compute the number of copies of the repeat symbol we will need
  const repeatCount = Math.ceil(
    (heightTotal - minHeight) / (middleFactor * repeatHeightTotal)
  );

  // Compute the total height of the delimiter including all the symbols
  const realHeightTotal =
    minHeight + repeatCount * middleFactor * repeatHeightTotal;

  // The center of the delimiter is placed at the center of the axis. Note
  // that in this context, 'center' means that the delimiter should be
  // centered around the axis in the current style, while normally it is
  // centered around the axis in textstyle.
  let { axisHeight } = context.mathstyle.metrics;

  if (center) {
    axisHeight =
      axisHeight *
      context.mathstyle.sizeMultiplier *
      SIZING_MULTIPLIER[context.size];
  }

  // Calculate the depth
  const depth = realHeightTotal / 2 - axisHeight;

  // Now, we start building the pieces that will go into the vlist

  // Keep a list of the inner pieces
  const inners = [];
  let sizeClass = '';
  // Apply the correct CSS class to choose the right font.
  if (font === 'Size1-Regular') {
    sizeClass = ' delim-size1';
  } else if (font === 'Size4-Regular') {
    sizeClass = ' delim-size4';
  }

  // Add the bottom symbol
  inners.push(makeSymbol(font, getSymbolValue(bottom)));

  const repeatSpan = makeSymbol(font, getSymbolValue(repeat));

  if (middle === null) {
    // Add that many symbols
    for (let i = 0; i < repeatCount; i++) {
      inners.push(repeatSpan);
    }
  } else {
    // When there is a middle bit, we need the middle part and two repeated
    // sections
    for (let i = 0; i < repeatCount; i++) {
      inners.push(repeatSpan);
    }

    inners.push(makeSymbol(font, getSymbolValue(middle)));

    for (let i = 0; i < repeatCount; i++) {
      inners.push(repeatSpan);
    }
  }

  // Add the top symbol
  inners.push(makeSymbol(font, getSymbolValue(top)));

  // Finally, build the vlist
  const inner = makeVlist(context, inners, 'bottom', {
    initialPos: depth,
    classes: 'delimsizinginner' + sizeClass,
  });
  inner.setStyle('color', context.color);
  if (typeof context.opacity === 'number') {
    inner.setStyle('opacity', context.opacity);
  }

  const result = new Span(inner, { classes: 'delimsizing mult' });
  result.setStyle(
    'vertical-align',
    -context.mathstyle.metrics.axisHeight * SIZING_MULTIPLIER[context.size],
    'em'
  );

  return makeStyleWrap(
    result,
    context.mathstyle,
    MATHSTYLES.textstyle,
    options
  );
}

// There are three kinds of delimiters, delimiters that stack when they become
// too large
const stackLargeDelimiters = new Set([
  '(',
  ')',
  '[',
  '\\lbrack',
  ']',
  '\\rbrack',
  '\\{',
  '\\lbrace',
  '\\}',
  '\\rbrace',
  '\\lfloor',
  '\\rfloor',
  '\\lceil',
  '\\rceil',
  '\\surd',
]);

// Delimiters that always stack
const stackAlwaysDelimiters = new Set([
  '\\uparrow',
  '\\downarrow',
  '\\updownarrow',
  '\\Uparrow',
  '\\Downarrow',
  '\\Updownarrow',
  '|',
  '\\|',
  '\\vert',
  '\\Vert',
  '\\lvert',
  '\\rvert',
  '\\lVert',
  '\\rVert',
  '\\mvert',
  '\\mid',
  '\\lgroup',
  '\\rgroup',
  '\\lmoustache',
  '\\rmoustache',
]);

// And delimiters that never stack
const stackNeverDelimiters = new Set([
  '<',
  '>',
  '\\langle',
  '\\rangle',
  '/',
  '\\backslash',
  '\\lt',
  '\\gt',
]);

// Metrics of the different sizes. Found by looking at TeX's output of
// $\bigl| // \Bigl| \biggl| \Biggl| \showlists$
// Used to create stacked delimiters of appropriate sizes in makeSizedDelim.
const sizeToMaxHeight = [0, 1.2, 1.8, 2.4, 3];

/**
 * Used to create a delimiter of a specific size, where `size` is 1, 2, 3, or 4.
 */
export function makeSizedDelim(
  delim: string | undefined,
  size: 1 | 2 | 3 | 4,
  context: Context,
  options: {
    classes: string;
    type?: 'mopen' | 'mclose';
    mode?: ParseMode;
    style?: Style;
  }
): Span {
  if (delim === undefined || delim === '.') {
    // Empty delimiters still count as elements, even though they don't
    // show anything.
    return makeNullFence(context, options.type, options.classes);
  }

  // < and > turn into \langle and \rangle in delimiters
  if (delim === '<' || delim === '\\lt') {
    delim = '\\langle';
  } else if (delim === '>' || delim === '\\gt') {
    delim = '\\rangle';
  }

  // Sized delimiters are never centered.
  if (stackLargeDelimiters.has(delim) || stackNeverDelimiters.has(delim)) {
    return makeLargeDelim(delim, size, false, context, options);
  }

  if (stackAlwaysDelimiters.has(delim)) {
    return makeStackedDelim(
      delim,
      sizeToMaxHeight[size],
      false,
      context,
      options
    );
  }

  console.assert(false, "Unknown delimiter '" + delim + "'");
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

interface DelimiterInfo {
  type: 'small' | 'large' | 'stack';
  mathstyle?: Mathstyle;
  size?: 1 | 2 | 3 | 4;
}

// Delimiters that never stack try small delimiters and large delimiters only
const stackNeverDelimiterSequence: DelimiterInfo[] = [
  { type: 'small', mathstyle: MATHSTYLES.scriptscriptstyle },
  { type: 'small', mathstyle: MATHSTYLES.scriptstyle },
  { type: 'small', mathstyle: MATHSTYLES.textstyle },
  { type: 'large', size: 1 },
  { type: 'large', size: 2 },
  { type: 'large', size: 3 },
  { type: 'large', size: 4 },
];

// Delimiters that always stack try the small delimiters first, then stack
const stackAlwaysDelimiterSequence: DelimiterInfo[] = [
  { type: 'small', mathstyle: MATHSTYLES.scriptscriptstyle },
  { type: 'small', mathstyle: MATHSTYLES.scriptstyle },
  { type: 'small', mathstyle: MATHSTYLES.textstyle },
  { type: 'stack' },
];

// Delimiters that stack when large try the small and then large delimiters, and
// stack afterwards
const stackLargeDelimiterSequence: DelimiterInfo[] = [
  { type: 'small', mathstyle: MATHSTYLES.scriptscriptstyle },
  { type: 'small', mathstyle: MATHSTYLES.scriptstyle },
  { type: 'small', mathstyle: MATHSTYLES.textstyle },
  { type: 'large', size: 1 },
  { type: 'large', size: 2 },
  { type: 'large', size: 3 },
  { type: 'large', size: 4 },
  { type: 'stack' },
];

/*
 * Get the font used in a delimiter based on what kind of delimiter it is.
 */
function delimTypeToFont(info: DelimiterInfo): string {
  if (info.type === 'small') {
    return 'Main-Regular';
  }

  if (info.type === 'large') {
    return 'Size' + info.size + '-Regular';
  }

  console.assert(info.type === 'stack');
  return 'Size4-Regular';
}

/**
 * Traverse a sequence of types of delimiters to decide what kind of delimiter
 * should be used to create a delimiter of the given height+depth.
 * @param delim - a character value (not a command)
 */
function traverseSequence(
  delim: string,
  height: number,
  sequence: DelimiterInfo[],
  context: Context
): DelimiterInfo {
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

    const metrics = getCharacterMetrics(delim, delimTypeToFont(sequence[i]));
    if (metrics.defaultMetrics) {
      // If we don't have metrics info for this character,
      // assume we'll construct as a small delimiter
      return { type: 'small', mathstyle: MATHSTYLES.scriptstyle };
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
 */
export function makeCustomSizedDelim(
  type: 'mopen' | 'mclose' | 'minner',
  delim: string,
  height: number,
  center: boolean,
  context: Context,
  options?: {
    classes?: string;
    mode?: ParseMode;
    style?: Style;
  }
): Span {
  if (!delim || delim.length === 0 || delim === '.') {
    return makeNullFence(context, type, type);
  }

  if (delim === '<' || delim === '\\lt') {
    delim = '\\langle';
  } else if (delim === '>' || delim === '\\gt') {
    delim = '\\rangle';
  }

  // Decide what sequence to use
  let sequence: DelimiterInfo[];
  if (stackNeverDelimiters.has(delim)) {
    sequence = stackNeverDelimiterSequence;
  } else if (stackLargeDelimiters.has(delim)) {
    sequence = stackLargeDelimiterSequence;
  } else {
    sequence = stackAlwaysDelimiterSequence;
  }

  // Look through the sequence
  const delimType = traverseSequence(
    getSymbolValue(delim),
    height,
    sequence,
    context
  );

  // Depending on the sequence element we decided on,
  // call the appropriate function.
  if (delimType.type === 'small') {
    return makeSmallDelim(delim, delimType.mathstyle, center, context, {
      type,
      classes: 'ML__small-delim ' + (options?.classes ?? ''),
    });
  }

  if (delimType.type === 'large') {
    return makeLargeDelim(delim, delimType.size, center, context, {
      ...options,
      type,
    });
  }

  console.assert(delimType.type === 'stack');
  return makeStackedDelim(delim, height, center, context, {
    ...options,
    type,
  });
}

/**
 * Make a delimiter for use with `\left` and `\right`, given a height and depth
 * of an expression that the delimiters surround.
 * See tex.web:14994
 */
export function makeLeftRightDelim(
  type: 'mopen' | 'mclose' | 'minner',
  delim: string,
  height: number,
  depth: number,
  context: Context,
  options?: { classes?: string; style?: Style; mode?: ParseMode }
): Span {
  // If this is the empty delimiter, return a null fence
  if (delim === '.') {
    return makeNullFence(context, type, options?.classes);
  }

  // We always center \left/\right delimiters, so the axis is always shifted
  const axisHeight =
    context.mathstyle.metrics.axisHeight *
    context.mathstyle.sizeMultiplier *
    SIZING_MULTIPLIER[context.size];
  // Taken from TeX source, tex.web, function make_left_right
  const delimiterFactor = 901; // Plain.tex:327, texboox:152
  const delimiterShortfall = 5 / METRICS.ptPerEm; // Plain.tex:345, texboox:152

  const maxDistFromAxis = Math.max(height - axisHeight, depth + axisHeight);
  const totalHeight = Math.max(
    (maxDistFromAxis / 500) * delimiterFactor,
    2 * maxDistFromAxis - delimiterShortfall
  );

  // Finally, we defer to `makeCustomSizedDelim` with our calculated total
  // height
  return makeCustomSizedDelim(type, delim, totalHeight, true, context, options);
}

export function makeNullFence(
  context: Context,
  type: 'mopen' | 'mclose' | 'minner',
  classes?: string
): Span {
  let sizeAdjust = '';
  if (context.size !== 'size5') {
    sizeAdjust = `sizing reset-${context.size} size5`;
  }
  return new Span(null, {
    // Reset the font-size to the default (size5)
    classes:
      sizeAdjust +
      // Correct from scriptstyle/scriptscriptstyle to textstyle if necessary
      context.mathstyle.adjustTo(MATHSTYLES.textstyle) +
      // The null delimiter has a width, specified by class 'nulldelimiter'
      ' nulldelimiter ' +
      (classes ?? ''),
    type,
  });
}
