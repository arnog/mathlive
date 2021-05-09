/**
 * This module contains metrics regarding fonts and individual symbols. The sigma
 * and xi variables, as well as the CHARACTER_METRICS_MAP map contain data extracted from
 * TeX, TeX font metrics, and the TTF files. These data are then exposed via the
 * `metrics` variable and the getCharacterMetrics function.
 */
import CHARACTER_METRICS_MAP from './font-metrics-data';

// This CHARACTER_METRICS_MAP contains a mapping from font name and character
// code to character metrics, including height, depth, italic correction, and
// skew (kern from the character to the corresponding \skewchar).
// This map is generated via `make metrics`. It should not be changed manually.

interface CharacterMetrics {
  defaultMetrics: boolean;
  depth: number;
  height: number;
  italic: number;
  skew: number;
}

// See http://www.ntg.nl/maps/38/03.pdf for an explanation of the metrics
// and how they relate to the OpenFont math   metrics
export interface FontMetrics<T = number> {
  slant: T;
  space: T;
  stretch: T;
  shrink: T;
  xHeight: T; // sigma 5 = accent base height
  quad: T;
  extraSpace: T;
  num1: T; // sigma 8 = FractionNumeratorDisplayStyleShiftUp
  num2: T; // sigma 9 = FractionNumeratorShiftUp
  num3: T; // sigma 10 = StackTopShiftUp
  denom1: T; // sigma 11 = StackBottomDisplayStyleShiftDown = FractionDenominatorDisplayStyleShiftDown
  denom2: T; // sigma 12 = StackBottomShiftDown = FractionDenominatorShiftDown
  sup1: T; //sigma 13 = SuperscriptShiftUp
  sup2: T;
  sup3: T; // sigma 15 = SuperscriptShiftUpCramped
  sub1: T; // sigma 16 = SubscriptShiftDown
  sub2: T;
  supDrop: T; // sigma 18 = SuperscriptBaselineDropMax
  subDrop: T; // sigma 19 = SubscriptBaselineDropMin
  delim1: T;
  delim2: T; // sigma 21 = DelimitedSubFormulaMinHeight
  axisHeight: T; // sigma 22

  // Note: xi14: offset from baseline for superscript TexBook p. 179
  // Note: xi16: offset from baseline for subscript

  // The \sqrt rule width is taken from the height of the surd character.
  // Since we use the same font at all sizes, this thickness doesn't scale.

  defaultRuleThickness: T; // xi8; cmex7: 0.049
  bigOpSpacing1: T; // xi9
  bigOpSpacing2: T; // xi10
  bigOpSpacing3: T; // xi11
  bigOpSpacing4: T; // xi12; cmex7: 0.611
  bigOpSpacing5: T; // xi13; cmex7: 0.143

  sqrtRuleThickness: T;

  // The space between adjacent `|` columns in an array definition.
  // From article.cls.txt:455
  doubleRuleSep: T;

  // The width of separator lines in {array} environments. From
  // `\showthe\arrayrulewidth` in LaTeX. Equals 0.4 / ptPerEm.
  arrayRuleWidth: T;
  arrayColSep: T;
  baselineSkip: T;

  // Two values from LaTeX source2e:
  fboxSep: T; // From letter.dtx:1626
  fboxRule: T; // From letter.dtx:1627
}

// This regex combines
// - Hiragana: [\u3040-\u309F]
// - Katakana: [\u30A0-\u30FF]
// - CJK ideograms: [\u4E00-\u9FAF]
// - Hangul syllables: [\uAC00-\uD7AF]
// Notably missing are half width Katakana and Romaji glyphs.
const CJK_REGEX = /[\u3040-\u309F]|[\u30A0-\u30FF]|[\u4E00-\u9FAF]|[\uAC00-\uD7AF]/;

// This value determines how large a pt is, for metrics which are defined
// in terms of pts.
// This value should equal `@ptperem` in core.less; if you change it make sure the
// values match.
export const PT_PER_EM = 10.0;

// In math typesetting, the term axis refers to a horizontal reference line
// used for positioning elements in a formula. The math axis is similar to but
// distinct from the baseline for regular text layout. For example, in a
// simple equation, a minus symbol or fraction rule would be on the axis, but
// a string for a variable name would be set on a baseline that is offset from
// the axis. The axisHeight value determines the amount of that offset.
// (from https://docs.microsoft.com/en-us/typography/opentype/spec/math)
export const AXIS_HEIGHT = 0.25;

// The minimum space between the botton of two successive lines in a paragraph (in em)
export const BASELINE_SKIP = 1.2;

export const X_HEIGHT = 0.431; // sigma 5

/*
 *
 * In TeX, there are actually three sets of dimensions, one for each of
 * textstyle, scriptstyle, and scriptscriptstyle.  These are provided in the
 * the arrays below, in that order.
 *
 * The font metrics are stored in fonts cmsy10, cmsy7, and cmsy5 respectively.
 * This was determined by running the following script:
 *``` bash
      latex -interaction=nonstopmode \
      '\documentclass{article}\usepackage{amsmath}\begin{document}' \
      '$a$ \expandafter\show\the\textfont2' \
      '\expandafter\show\the\scriptfont2' \
      '\expandafter\show\the\scriptscriptfont2' \
      '\stop'
  ```
 * The metrics themselves were retrieved using the following commands:
 *
    ``` bash
      tftopl cmsy10     # displaystyle and textstyle
      tftopl cmsy7      # scriptstyle
      tftopl cmsy5      # scriptscriptstyle
    ```
 *
 * The output of each of these commands is quite lengthy.  The only part we
 * care about is the FONTDIMEN section. Each value is measured in EMs.
 */
export const FONT_METRICS: FontMetrics<
  [normalsize: number, scriptsize: number, scriptscriptsize: number]
> = {
  slant: [0.25, 0.25, 0.25],
  space: [0.0, 0.0, 0.0],
  stretch: [0.0, 0.0, 0.0],
  shrink: [0.0, 0.0, 0.0],
  xHeight: [X_HEIGHT, X_HEIGHT, X_HEIGHT],
  quad: [1.0, 1.171, 1.472],
  extraSpace: [0.0, 0.0, 0.0],
  num1: [0.677, 0.732, 0.925],
  num2: [0.394, 0.384, 0.387],
  num3: [0.444, 0.471, 0.504],
  denom1: [0.686, 0.752, 1.025],
  denom2: [0.345, 0.344, 0.532],
  sup1: [0.413, 0.503, 0.504],
  sup2: [0.363, 0.431, 0.404],
  sup3: [0.289, 0.286, 0.294],
  sub1: [0.15, 0.143, 0.2],
  sub2: [0.247, 0.286, 0.4],
  supDrop: [0.386, 0.353, 0.494],
  subDrop: [0.05, 0.071, 0.1],
  delim1: [2.39, 1.7, 1.98],
  delim2: [1.01, 1.157, 1.42],
  axisHeight: [AXIS_HEIGHT, AXIS_HEIGHT, AXIS_HEIGHT],

  defaultRuleThickness: [0.04, 0.049, 0.049],
  bigOpSpacing1: [0.111, 0.111, 0.111],
  bigOpSpacing2: [0.166, 0.166, 0.166],
  bigOpSpacing3: [0.2, 0.2, 0.2],
  bigOpSpacing4: [0.6, 0.611, 0.611],
  bigOpSpacing5: [0.1, 0.143, 0.143],
  sqrtRuleThickness: [0.04, 0.04, 0.04],

  // pxPerEm: (PT_PER_EM * 4) / 3, // A CSS pt is fixed at 1.333px

  // The space between adjacent `|` columns in an array definition. From
  // `\showthe\doublerulesep` in LaTeX. Equals 2.0 / ptPerEm.
  doubleRuleSep: [0.2, 0.2, 0.2],

  // The width of separator lines in {array} environments. From
  // `\showthe\arrayrulewidth` in LaTeX. Equals 0.4 / ptPerEm.
  arrayRuleWidth: [0.04, 0.04, 0.04],
  arrayColSep: [0.5, 0.5, 0.5],
  baselineSkip: [BASELINE_SKIP, BASELINE_SKIP, BASELINE_SKIP],

  fboxSep: [0.3, 0.3, 0.3], //        3 pt / ptPerEm
  fboxRule: [0.04, 0.04, 0.04], // 0.4 pt / ptPerEm
};

// Maps a scale index from 1..10 to a value expressed in `em` relative
// to the fontsize of the mathfield.
export const FONT_SCALE = [
  0, // not used
  0.5, // size 1 = scriptscriptstyle
  0.7, // size 2 = scriptstyle
  0.8,
  0.9,
  1.0, // size 5 = default
  1.2,
  1.44,
  1.728,
  2.074,
  2.488, //size 10
];

export const DEFAULT_FONT_SIZE = 5;

// These are very rough approximations.  We default to Times New Roman which
// should have Latin-1 and Cyrillic characters, but may not depending on the
// operating system.  The metrics do not account for extra height from the
// accents.  In the case of Cyrillic characters which have both ascenders and
// descenders we prefer approximations with ascenders, primarily to prevent
// the fraction bar or root line from intersecting the glyph.
// TODO(kevinb) allow union of multiple glyph metrics for better accuracy.
const extraCharacterMap = {
  '\u00A0': '\u0020', // NON-BREAKING SPACE is like space
  '\u200B': '\u0020', // ZERO WIDTH SPACE is like space
  // Latin-1
  'Å': 'A',
  'Ç': 'C',
  'Ð': 'D',
  'Þ': 'o',
  'å': 'a',
  'ç': 'c',
  'ð': 'd',
  'þ': 'o',

  // Cyrillic
  'А': 'A',
  'Б': 'B',
  'В': 'B',
  'Г': 'F',
  'Д': 'A',
  'Е': 'E',
  'Ж': 'K',
  'З': '3',
  'И': 'N',
  'Й': 'N',
  'К': 'K',
  'Л': 'N',
  'М': 'M',
  'Н': 'H',
  'О': 'O',
  'П': 'N',
  'Р': 'P',
  'С': 'C',
  'Т': 'T',
  'У': 'y',
  'Ф': 'O',
  'Х': 'X',
  'Ц': 'U',
  'Ч': 'h',
  'Ш': 'W',
  'Щ': 'W',
  'Ъ': 'B',
  'Ы': 'X',
  'Ь': 'B',
  'Э': '3',
  'Ю': 'X',
  'Я': 'R',
  'а': 'a',
  'б': 'b',
  'в': 'a',
  'г': 'r',
  'д': 'y',
  'е': 'e',
  'ж': 'm',
  'з': 'e',
  'и': 'n',
  'й': 'n',
  'к': 'n',
  'л': 'n',
  'м': 'm',
  'н': 'n',
  'о': 'o',
  'п': 'n',
  'р': 'p',
  'с': 'c',
  'т': 'o',
  'у': 'y',
  'ф': 'b',
  'х': 'x',
  'ц': 'n',
  'ч': 'n',
  'ш': 'w',
  'щ': 'w',
  'ъ': 'a',
  'ы': 'm',
  'ь': 'a',
  'э': 'e',
  'ю': 'm',
  'я': 'r',
};

/**
 * This function is a convenience function for looking up information in the
 * CHARACTER_METRICS_MAP table. It takes a codepoint, and a font name.
 *
 * @param fontName e.g. 'Main-Regular', 'Typewriter-Regular', etc...
 */
export function getCharacterMetrics(
  codepoint: number,
  fontName: string
): CharacterMetrics {
  console.assert(
    CHARACTER_METRICS_MAP[fontName],
    'Unknown font "' + fontName + '"'
  );

  const metrics = CHARACTER_METRICS_MAP[fontName][codepoint];

  if (metrics) {
    return {
      defaultMetrics: false,
      depth: metrics[0],
      height: metrics[1],
      italic: metrics[2],
      skew: metrics[3],
    };
  }

  if (codepoint === 11034) {
    // Placeholder character
    return {
      defaultMetrics: true,
      depth: 0.2,
      height: 0.8,
      italic: 0,
      skew: 0,
    };
  }

  const char = String.fromCodePoint(codepoint);

  if (char in extraCharacterMap) {
    codepoint = extraCharacterMap[char].codePointAt(0);
  } else if (CJK_REGEX.test(codepoint[0])) {
    codepoint = 77; // 'M'.codepointAt(0);
    return {
      defaultMetrics: true,
      depth: 0.2,
      height: 0.9,
      italic: 0,
      skew: 0,
    };
  }

  return {
    defaultMetrics: true,
    depth: 0.2,
    height: 0.7,
    italic: 0,
    skew: 0,
  };
}

/**
 *
 * @param value If value is a string, it may be suffixed
 * with a unit, which will override the `unit` paramter
 */
export function convertDimenToEm(
  value: number | string,
  unit: string,
  precision = Number.NaN
): number {
  if (typeof value === 'string') {
    const m = value.match(/([-+]?[\d.]*)\s*([a-zA-Z]+)/);
    if (!m) {
      value = Number.parseFloat(value);
    } else {
      value = Number.parseFloat(m[1]);
      unit = m[2].toLowerCase();
    }
  }

  // If the units are missing, TeX assumes 'pt'
  const f =
    {
      pt: 1,
      mm: 7227 / 2540,
      cm: 7227 / 254,
      ex: 35271 / 8192,
      px: 3 / 4,
      em: PT_PER_EM,
      bp: 803 / 800,
      dd: 1238 / 1157,
      pc: 12,
      in: 72.27,
      mu: 10 / 18,
    }[unit] || 1;

  if (Number.isFinite(precision)) {
    const factor = 10 ** precision;
    return Math.round((value / PT_PER_EM) * f * factor) / factor;
  }

  return (value / PT_PER_EM) * f;
}

export function convertDimenToPx(value: string | number, unit: string): number {
  return convertDimenToEm(value, unit) * (4 / 3) * PT_PER_EM;
}
