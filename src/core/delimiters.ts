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

import { Box } from './box';
import { VBoxChild, VBox } from './v-box';
import {
  getCharacterMetrics,
  PT_PER_EM,
  AXIS_HEIGHT,
  FONT_SCALE,
} from './font-metrics';
import { Context } from './context';
import type { MathstyleName, ParseMode, Style } from '../public/core-types';
import { BoxType } from './types';

export const RIGHT_DELIM = {
  '(': ')',
  '{': '}',
  '[': ']',
  '|': '|',
  '\\lbrace': '\\rbrace',
  '\\lparen': '\\rparen',
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

export const LEFT_DELIM = Object.fromEntries(
  Object.entries(RIGHT_DELIM).map(([leftDelim, rightDelim]) => [
    rightDelim,
    leftDelim,
  ])
);

function getSymbolValue(symbol: string): number {
  return (
    {
      '[': 0x5b, // '[',
      ']': 0x5d, // ']',
      '(': 0x28, // '(',
      ')': 0x29, // ')',
      '\\mid': 0x2223,
      '|': 0x2223,
      '\u2223': 0x2223, // DIVIDES
      '\u2225': 0x2225, // PARALLEL TO
      '\\|': 0x2223,
      '\\{': 0x7b, // '{',
      '\\}': 0x7d, // '}',
      '\\lbrace': 0x7b, // '{',
      '\\rbrace': 0x7d, // '}',
      '\\lparen': 0x28, // '('
      '\\rparen': 0x29, // ')'
      '\\lbrack': 0x5b, // '[',
      '\\rbrack': 0x5d, // ']',
      '\\vert': 0x2223,
      '\\lvert': 0x2223,
      '\\mvert': 0x2223,
      '\\rvert': 0x2223,
      '\\Vert': 0x2225,
      '\\lVert': 0x2225,
      '\\mVert': 0x2225,
      '\\rVert': 0x2225,
      '\\parallel': 0x2225,
      '\\shortparallel': 0x2225,
      '\\langle': 0x27e8,
      '\\rangle': 0x27e9,
      '\\lfloor': 0x230a,
      '\\rfloor': 0x230b,
      '\\lceil': 0x2308,
      '\\rceil': 0x2309,
      '\\ulcorner': 0x250c,
      '\\urcorner': 0x2510,
      '\\llcorner': 0x2514,
      '\\lrcorner': 0x2518,
      '\\lgroup': 0x27ee,
      '\\rgroup': 0x27ef,
      '\\lmoustache': 0x23b0,
      '\\rmoustache': 0x23b1,
      '\\surd': 0x221a,
    }[symbol] ?? symbol.codePointAt(0)!
  );
}

/**
 * Makes a small delimiter. This is a delimiter that comes in the Main-Regular
 * font, but is restyled to either be in textstyle, scriptstyle, or
 * scriptscriptstyle.
 */
function makeSmallDelim(
  delim: string,
  context: Context,
  center: boolean,
  options: {
    classes?: string;
    isSelected: boolean;
    type: 'open' | 'close' | 'inner';
  }
): Box {
  const text = new Box(getSymbolValue(delim), {
    fontFamily: 'Main-Regular',
    isSelected: options.isSelected,
  });

  const box = text.wrap(context, {
    type: options.type,
    classes: 'ML__small-delim ' + (options.classes ?? ''),
  });

  if (center) box.setTop((1 - context.scalingFactor) * AXIS_HEIGHT);

  return box;
}

/**
 * Makes a large delimiter. This is a delimiter that comes in the Size1, Size2,
 * Size3, or Size4 fonts.
 */
function makeLargeDelim(
  delim: string,
  size: number,
  center: boolean,
  parentContext: Context,
  options: {
    classes?: string;
    isSelected: boolean;
    type?: 'open' | 'close' | 'inner';
    mode?: ParseMode;
    style?: Style;
  }
): Box {
  // Delimiters ignore the mathstyle, so use a 'textstyle' context.
  const context = new Context(
    { parent: parentContext, mathstyle: 'textstyle' },
    options?.style
  );
  const result = new Box(getSymbolValue(delim), {
    fontFamily: `Size${size}-Regular`,
    isSelected: options.isSelected,
    classes: (options.classes ?? '') + ` ML__delim-size${size}`,
    type: options.type ?? 'ignore',
  }).wrap(context);

  if (center) result.setTop((1 - context.scalingFactor) * AXIS_HEIGHT);

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
    type?: BoxType;
    mode?: ParseMode;
    style?: Style;
  }
): Box {
  // There are four parts, the top, an optional middle, a repeated part, and a
  // bottom.
  let top: number;
  let middle: number | null;
  let repeat: number;
  let bottom: number;
  top = repeat = bottom = getSymbolValue(delim);
  middle = null;
  // Also keep track of what font the delimiters are in
  let fontFamily = 'Size1-Regular';

  // We set the parts and font based on the symbol. Note that we use
  // 0x23d0 instead of '|' and 0x2016 instead of '\\|' for the
  // repeats of the arrows
  if (
    delim === '\\vert' ||
    delim === '\\lvert' ||
    delim === '\\rvert' ||
    delim === '\\mvert' ||
    delim === '\\mid'
  )
    repeat = top = bottom = 0x2223;
  else if (
    delim === '\\Vert' ||
    delim === '\\lVert' ||
    delim === '\\rVert' ||
    delim === '\\mVert' ||
    delim === '\\|'
  )
    repeat = top = bottom = 0x2225;
  else if (delim === '\\uparrow') repeat = bottom = 0x23d0;
  else if (delim === '\\Uparrow') repeat = bottom = 0x2016;
  else if (delim === '\\downarrow') top = repeat = 0x23d0;
  else if (delim === '\\Downarrow') top = repeat = 0x2016;
  else if (delim === '\\updownarrow') {
    top = 0x2191;
    repeat = 0x23d0;
    bottom = 0x2193;
  } else if (delim === '\\Updownarrow') {
    top = 0x21d1;
    repeat = 0x2016;
    bottom = 0x21d3;
  } else if (delim === '[' || delim === '\\lbrack') {
    top = 0x23a1;
    repeat = 0x23a2;
    bottom = 0x23a3;
    fontFamily = 'Size4-Regular';
  } else if (delim === ']' || delim === '\\rbrack') {
    top = 0x23a4;
    repeat = 0x23a5;
    bottom = 0x23a6;
    fontFamily = 'Size4-Regular';
  } else if (delim === '\\lfloor' || delim === '\u230a') {
    repeat = top = 0x23a2;
    bottom = 0x23a3;
    fontFamily = 'Size4-Regular';
  } else if (delim === '\\lceil' || delim === '\u2308') {
    top = 0x23a1;
    repeat = bottom = 0x23a2;
    fontFamily = 'Size4-Regular';
  } else if (delim === '\\rfloor' || delim === '\u230b') {
    repeat = top = 0x23a5;
    bottom = 0x23a6;
    fontFamily = 'Size4-Regular';
  } else if (delim === '\\rceil' || delim === '\u2309') {
    top = 0x23a4;
    repeat = bottom = 0x23a5;
    fontFamily = 'Size4-Regular';
  } else if (delim === '(' || delim === '\\lparen') {
    top = 0x239b;
    repeat = 0x239c;
    bottom = 0x239d;
    fontFamily = 'Size4-Regular';
  } else if (delim === ')' || delim === '\\rparen') {
    top = 0x239e;
    repeat = 0x239f;
    bottom = 0x23a0;
    fontFamily = 'Size4-Regular';
  } else if (delim === '\\{' || delim === '\\lbrace') {
    top = 0x23a7;
    middle = 0x23a8;
    bottom = 0x23a9;
    repeat = 0x23aa;
    fontFamily = 'Size4-Regular';
  } else if (delim === '\\}' || delim === '\\rbrace') {
    top = 0x23ab;
    middle = 0x23ac;
    bottom = 0x23ad;
    repeat = 0x23aa;
    fontFamily = 'Size4-Regular';
  } else if (delim === '\\lgroup' || delim === '\u27ee') {
    top = 0x23a7;
    bottom = 0x23a9;
    repeat = 0x23aa;
    fontFamily = 'Size4-Regular';
  } else if (delim === '\\rgroup' || delim === '\u27ef') {
    top = 0x23ab;
    bottom = 0x23ad;
    repeat = 0x23aa;
    fontFamily = 'Size4-Regular';
  } else if (delim === '\\lmoustache' || delim === '\u23b0') {
    top = 0x23a7;
    bottom = 0x23ad;
    repeat = 0x23aa;
    fontFamily = 'Size4-Regular';
  } else if (delim === '\\rmoustache' || delim === '\u23b1') {
    top = 0x23ab;
    bottom = 0x23a9;
    repeat = 0x23aa;
    fontFamily = 'Size4-Regular';
  } else if (delim === '\\surd') {
    top = 0xe001;
    bottom = 0x23b7;
    repeat = 0xe000;
    fontFamily = 'Size4-Regular';
  } else if (delim === '\\ulcorner') {
    top = 0x250c;
    repeat = bottom = 0x20;
  } else if (delim === '\\urcorner') {
    top = 0x2510;
    repeat = bottom = 0x20;
  } else if (delim === '\\llcorner') {
    bottom = 0x2514;
    repeat = top = 0x20;
  } else if (delim === '\\lrcorner') {
    top = 0x2518;
    repeat = top = 0x20;
  }

  // Get the metrics of the four sections
  const topMetrics = getCharacterMetrics(top, fontFamily);
  const topHeightTotal = topMetrics.height + topMetrics.depth;
  const repeatMetrics = getCharacterMetrics(repeat, fontFamily);
  const repeatHeightTotal = repeatMetrics.height + repeatMetrics.depth;
  const bottomMetrics = getCharacterMetrics(bottom, fontFamily);
  const bottomHeightTotal = bottomMetrics.height + bottomMetrics.depth;
  let middleHeightTotal = 0;
  let middleFactor = 1;
  if (middle !== null) {
    const middleMetrics = getCharacterMetrics(middle, fontFamily);
    middleHeightTotal = middleMetrics.height + middleMetrics.depth;
    middleFactor = 2; // Repeat symmetrically above and below middle
  }

  // Calculate the minimal height that the delimiter can have.
  // It is at least the size of the top, bottom, and optional middle combined.
  const minHeight = topHeightTotal + bottomHeightTotal + middleHeightTotal;

  // Compute the number of copies of the repeat symbol we will need
  const repeatCount = Math.max(
    0,
    Math.ceil((heightTotal - minHeight) / (middleFactor * repeatHeightTotal))
  );

  // Compute the total height of the delimiter including all the symbols
  const realHeightTotal =
    minHeight + repeatCount * middleFactor * repeatHeightTotal;

  // The center of the delimiter is placed at the center of the axis. Note
  // that in this context, 'center' means that the delimiter should be
  // centered around the axis in the current style, while normally it is
  // centered around the axis in textstyle.
  let axisHeight = AXIS_HEIGHT;

  if (center) axisHeight = axisHeight * context.scalingFactor;

  // Calculate the depth
  const depth = realHeightTotal / 2 - axisHeight;

  // Now, we start building the pieces that will go into the vlist

  const OVERLAP = 0.008; // Overlap between segments, in em

  // Keep a list of the inner pieces
  const stack: VBoxChild[] = [];

  // Add the bottom symbol
  stack.push({ box: new Box(bottom, { fontFamily }) });
  stack.push(-OVERLAP);

  const repeatBox = new Box(repeat, { fontFamily });

  if (middle === null) {
    // Add that many symbols
    for (let i = 0; i < repeatCount; i++) stack.push({ box: repeatBox });
  } else {
    // When there is a middle bit, we need the middle part and two repeated
    // sections
    for (let i = 0; i < repeatCount; i++) stack.push({ box: repeatBox });

    stack.push(-OVERLAP);
    stack.push({ box: new Box(middle, { fontFamily }) });
    stack.push(-OVERLAP);

    for (let i = 0; i < repeatCount; i++) stack.push({ box: repeatBox });
  }

  // Add the top symbol
  stack.push(-OVERLAP);
  stack.push({ box: new Box(top, { fontFamily }) });

  // Finally, build the vlist

  let sizeClass = '';
  // Apply the correct CSS class to choose the right font.
  if (fontFamily === 'Size1-Regular') sizeClass = ' delim-size1';
  else if (fontFamily === 'Size4-Regular') sizeClass = ' delim-size4';

  const inner = new VBox(
    {
      bottom: depth,
      children: stack,
    },
    { classes: sizeClass }
  );

  const result = new Box(inner, {
    ...(options ?? {}),
    classes: (options?.classes ?? '') + ' ML__delim-mult',
  });
  // result.setStyle('vertical-align', (result.depth + axisHeight) / 2, 'em');

  return result;
}

// There are three kinds of delimiters, delimiters that stack when they become
// too large
const stackLargeDelimiters = new Set([
  '(',
  ')',
  '\\lparen',
  '\\rparen',
  '[',
  ']',
  '\\lbrack',
  '\\rbrack',
  '\\{',
  '\\}',
  '\\lbrace',
  '\\rbrace',
  '\\lfloor',
  '\\rfloor',
  '\\lceil',
  '\\rceil',
  '\\surd',
  '\u230a',
  '\u230b',
  '\u2308',
  '\u2309',
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
  '\u27ee',
  '\u27ef',
  '\u23b0',
  '\u23b1',
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
    isSelected: boolean;
    classes?: string;
    type?: 'open' | 'close';
    mode?: ParseMode;
    style?: Style;
  }
): Box | null {
  // Empty delimiters still count as elements, even though they don't
  // show anything: they may affect horizontal spacing
  if (delim === undefined || delim === '.')
    return makeNullDelimiter(context, options.classes);

  // < and > turn into \langle and \rangle in delimiters
  if (delim === '<' || delim === '\\lt' || delim === '\u27e8')
    delim = '\\langle';
  else if (delim === '>' || delim === '\\gt' || delim === '\u27e9')
    delim = '\\rangle';

  // Sized delimiters are never centered.
  if (stackLargeDelimiters.has(delim) || stackNeverDelimiters.has(delim))
    return makeLargeDelim(delim, size, false, context, options);

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
  mathstyle?: MathstyleName;
  size?: 1 | 2 | 3 | 4;
}

// Delimiters that never stack try small delimiters and large delimiters only
const stackNeverDelimiterSequence: DelimiterInfo[] = [
  { type: 'small', mathstyle: 'scriptscriptstyle' },
  { type: 'small', mathstyle: 'scriptstyle' },
  { type: 'small', mathstyle: 'textstyle' },
  { type: 'large', size: 1 },
  { type: 'large', size: 2 },
  { type: 'large', size: 3 },
  { type: 'large', size: 4 },
];

// Delimiters that always stack try the small delimiters first, then stack
const stackAlwaysDelimiterSequence: DelimiterInfo[] = [
  { type: 'small', mathstyle: 'scriptscriptstyle' },
  { type: 'small', mathstyle: 'scriptscriptstyle' },
  { type: 'small', mathstyle: 'textstyle' },
  { type: 'stack' },
];

// Delimiters that stack when large try the small and then large delimiters, and
// stack afterwards
const stackLargeDelimiterSequence: DelimiterInfo[] = [
  { type: 'small', mathstyle: 'scriptscriptstyle' },
  { type: 'small', mathstyle: 'scriptstyle' },
  { type: 'small', mathstyle: 'textstyle' },
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
  if (info.type === 'small') return 'Main-Regular';

  if (info.type === 'large') return 'Size' + info.size + '-Regular';

  console.assert(info.type === 'stack');
  return 'Size4-Regular';
}

/**
 * Traverse a sequence of types of delimiters to decide what kind of delimiter
 * should be used to create a delimiter of the given height+depth.
 * @param delim - a character value (not a command)
 */
function traverseSequence(
  delim: number,
  height: number,
  sequence: DelimiterInfo[],
  context: Context
): DelimiterInfo {
  // Here, we choose the index we should start at in the sequences. In smaller
  // sizes (which correspond to larger numbers in style.size) we start earlier
  // in the sequence. Thus:
  // - scriptscript starts at index 0,
  // - script starts at index 1,
  // - text and display start at 2
  const start = { '-4': 0, '-3': 1, '0': 2 }[context.mathstyle.sizeDelta];
  for (let i = start; i < sequence.length; i++) {
    if (sequence[i].type === 'stack') {
      // This is always the last delimiter, so we just break the loop now.
      break;
    }

    const metrics = getCharacterMetrics(delim, delimTypeToFont(sequence[i]));
    if (metrics.defaultMetrics) {
      // If we don't have metrics info for this character,
      // assume we'll construct as a small delimiter
      return { type: 'small', mathstyle: 'scriptstyle' };
    }

    let heightDepth = metrics.height + metrics.depth;

    // Small delimiters are scaled down versions of the same font, so we
    // account for the style change size.

    if (sequence[i].type === 'small') {
      if (sequence[i].mathstyle === 'scriptscriptstyle') {
        heightDepth *= Math.max(
          FONT_SCALE[Math.max(1, context.size - 2)],
          context.minFontScale
        );
      } else if (sequence[i].mathstyle === 'scriptstyle') {
        heightDepth *= Math.max(
          FONT_SCALE[Math.max(1, context.size - 1)],
          context.minFontScale
        );
      }
    }

    // Check if the delimiter at this size works for the given height.
    if (heightDepth > height) return sequence[i];
  }

  // If we reached the end of the sequence, return the last sequence element.
  return sequence[sequence.length - 1];
}

/**
 * Make a delimiter of a given height+depth, with optional centering. Here, we
 * traverse the sequences, and create a delimiter that the sequence tells us to.
 */
export function makeCustomSizedDelim(
  type: 'open' | 'close' | 'inner',
  delim: string,
  height: number,
  center: boolean,
  context: Context,
  options: {
    classes?: string;
    isSelected: boolean;
    mode?: ParseMode;
    style?: Style;
  }
): Box {
  if (!delim || delim.length === 0 || delim === '.')
    return makeNullDelimiter(context);

  if (delim === '<' || delim === '\\lt') delim = '\\langle';
  else if (delim === '>' || delim === '\\gt') delim = '\\rangle';

  // Decide what sequence to use
  let sequence: DelimiterInfo[];
  if (stackNeverDelimiters.has(delim)) sequence = stackNeverDelimiterSequence;
  else if (stackLargeDelimiters.has(delim))
    sequence = stackLargeDelimiterSequence;
  else sequence = stackAlwaysDelimiterSequence;

  // Look through the sequence
  const delimType = traverseSequence(
    getSymbolValue(delim),
    height,
    sequence,
    context
  );
  const ctx = new Context(
    { parent: context, mathstyle: delimType.mathstyle },
    options?.style
  );
  // Depending on the sequence element we decided on,
  // call the appropriate function.
  if (delimType.type === 'small')
    return makeSmallDelim(delim, ctx, center, { ...options, type });

  if (delimType.type === 'large') {
    return makeLargeDelim(delim, delimType.size!, center, ctx, {
      ...options,
      type,
    });
  }

  console.assert(delimType.type === 'stack');
  return makeStackedDelim(delim, height, center, ctx, { ...options, type });
}

/**
 * Make a delimiter for use with `\left` and `\right`, given a height and depth
 * of an expression that the delimiters surround.
 * See tex.web:14994
 */
export function makeLeftRightDelim(
  type: 'open' | 'close' | 'inner',
  delim: string,
  height: number,
  depth: number,
  context: Context,
  options: {
    isSelected: boolean;
    classes?: string;
    style?: Style;
    mode?: ParseMode;
  }
): Box {
  // If this is the empty delimiter, return a null fence
  if (delim === '.') return makeNullDelimiter(context, options?.classes);

  // We always center \left/\right delimiters, so the axis is always shifted
  const axisHeight = AXIS_HEIGHT * context.scalingFactor;
  // Taken from TeX source, tex.web, function make_left_right
  const delimiterFactor = 901; // Plain.tex:327, texboox:152
  // @todo: use register `\delimitershortfall`
  const delimiterExtend = 5 / PT_PER_EM; // Plain.tex:345, texboox:152

  const maxDistFromAxis = Math.max(height - axisHeight, depth + axisHeight);
  const totalHeight = Math.max(
    (maxDistFromAxis / 500) * delimiterFactor,
    2 * maxDistFromAxis - delimiterExtend
  );

  // Finally, we defer to `makeCustomSizedDelim` with our calculated total
  // height
  return makeCustomSizedDelim(type, delim, totalHeight, true, context, options);
}

export function makeNullDelimiter(parent: Context, classes?: string): Box {
  // The size of the null delimiter is independent of the current mathstyle
  const box = new Box(null, {
    classes: ' nulldelimiter ' + (classes ?? ''),
    type: 'ignore',
  });
  box.width = parent.getRegisterAsEm('nulldelimiterspace');
  return box.wrap(new Context({ parent, mathstyle: 'textstyle' }));
}
