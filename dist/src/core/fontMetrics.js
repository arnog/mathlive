/* eslint no-unused-vars:0 */
/**
 * This module contains metrics regarding fonts and individual symbols. The sigma
 * and xi variables, as well as the metricMap map contain data extracted from
 * TeX, TeX font metrics, and the TTF files. These data are then exposed via the
 * `metrics` variable and the getCharacterMetrics function.
 * @module core/fontMetrics
 * @private
 */
import metricMap from './fontMetricsData.js';

// This metricMap contains a mapping from font name and character code to character
// metrics, including height, depth, italic correction, and skew (kern from the
// character to the corresponding \skewchar)
// This map is generated via `make metrics`. It should not be changed manually.

// const hangulRegex = /[\uAC00-\uD7AF]/;

// This regex combines
// - Hiragana: [\u3040-\u309F]
// - Katakana: [\u30A0-\u30FF]
// - CJK ideograms: [\u4E00-\u9FAF]
// - Hangul syllables: [\uAC00-\uD7AF]
// Notably missing are half width Katakana and Romaji glyphs.
const cjkRegex =
    /[\u3040-\u309F]|[\u30A0-\u30FF]|[\u4E00-\u9FAF]|[\uAC00-\uD7AF]/;


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
 * ``` bash
      tftopl cmsy10
      tftopl cmsy7
      tftopl cmsy5
    ```
 *
 * The output of each of these commands is quite lengthy.  The only part we
 * care about is the FONTDIMEN section. Each value is measured in EMs.
 * @memberof module:fontMetrics
 */
export const SIGMAS = {
    slant: [0.250, 0.250, 0.250],       // sigma1
    space: [0.000, 0.000, 0.000],       // sigma2
    stretch: [0.000, 0.000, 0.000],     // sigma3
    shrink: [0.000, 0.000, 0.000],      // sigma4
    xHeight: [0.431, 0.431, 0.431],     // sigma5
    quad: [1.000, 1.171, 1.472],        // sigma6
    extraSpace: [0.000, 0.000, 0.000],  // sigma7
    num1: [0.677, 0.732, 0.925],        // sigma8
    num2: [0.394, 0.384, 0.387],        // sigma9
    num3: [0.444, 0.471, 0.504],        // sigma10
    denom1: [0.686, 0.752, 1.025],      // sigma11
    denom2: [0.345, 0.344, 0.532],      // sigma12
    sup1: [0.413, 0.503, 0.504],        // sigma13
    sup2: [0.363, 0.431, 0.404],        // sigma14
    sup3: [0.289, 0.286, 0.294],        // sigma15
    sub1: [0.150, 0.143, 0.200],        // sigma16
    sub2: [0.247, 0.286, 0.400],        // sigma17
    supDrop: [0.386, 0.353, 0.494],     // sigma18
    subDrop: [0.050, 0.071, 0.100],     // sigma19
    delim1: [2.390, 1.700, 1.980],      // sigma20
    delim2: [1.010, 1.157, 1.420],      // sigma21
    axisHeight: [0.250, 0.250, 0.250],  // sigma22
};

// These font metrics are extracted from TeX by using
// \font\a=cmex10
// \showthe\fontdimenX\a
// where X is the corresponding variable number. These correspond to the font
// parameters of the extension fonts (family 3). See the TeXbook, page 441.
const xi1 = 0;
const xi2 = 0;
const xi3 = 0;
const xi4 = 0;
const xi5 = 0.431;
const xi6 = 1;
const xi7 = 0;
const xi8 = 0.04;
const xi9 = 0.111;
const xi10 = 0.166;
const xi11 = 0.2;
const xi12 = 0.6;
const xi13 = 0.1;

// This value determines how large a pt is, for metrics which are defined in
// terms of pts.
// This value is also used in katex.less; if you change it make sure the values
// match.
const ptPerEm = 10.0;

// The space between adjacent `|` columns in an array definition. From
// article.cls.txt:455
const doubleRuleSep = 2.0 / ptPerEm;

/*
 * This is just a mapping from common names to real metrics
 */
export const METRICS = {
    defaultRuleThickness: xi8,
    bigOpSpacing1: xi9,
    bigOpSpacing2: xi10,
    bigOpSpacing3: xi11,
    bigOpSpacing4: xi12,
    bigOpSpacing5: xi13,
    ptPerEm: ptPerEm,
    pxPerEm: ptPerEm * 4.0 / 3.0,   // A CSS pt is fixed at 1.333px
    doubleRuleSep: 2.0 / ptPerEm,
    arraycolsep: 5.0 / ptPerEm,
    baselineskip: 12.0 / ptPerEm,
    arrayrulewidth: 0.4 / ptPerEm,
    fboxsep: 3 / ptPerEm,               // From letter.dtx:1626
    fboxrule: 0.4 / ptPerEm,               // From letter.dtx:1627
};


// These are very rough approximations.  We default to Times New Roman which
// should have Latin-1 and Cyrillic characters, but may not depending on the
// operating system.  The metrics do not account for extra height from the
// accents.  In the case of Cyrillic characters which have both ascenders and
// descenders we prefer approximations with ascenders, primarily to prevent
// the fraction bar or root line from intersecting the glyph.
// TODO(kevinb) allow union of multiple glyph metrics for better accuracy.
const extraCharacterMap = {
    '\u00a0': '\u0020',     // NON-BREAKING SPACE is like space
    '\u200b': '\u0020',     // ZERO WIDTH SPACE is like space
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
 * metricMap table. It takes a character as a string, and a font name.
 *
 * Note: the `width` property may be undefined if fontMetricsData.js wasn't
 * built using `Make extended_metrics`.
 * @param {string} character 
 * @param {string} fontCode 
 * @memberof module:fontMetrics
 * @private
 */
const getCharacterMetrics = function(character, fontCode) {
    const fontName = {
        'cal': 'Caligraphic-Regular',
        'ams': 'AMS-Regular',
        'frak': 'Fraktur-Regular',
        'bb': 'AMS-Regular',
        'scr': 'Script-Regular',
        'cmr': 'Main-Regular',
        'cmtt': 'Typewriter-Regular',
        'cmss': 'SansSerif-Regular'
    }[fontCode] || fontCode;
    
    // console.assert(character.length === 1);
    // console.assert(metricMap[fontName], 'Unknown font "' + fontName + '"');

    let ch = character.charCodeAt(0);

    if (character[0] in extraCharacterMap) {
        ch = extraCharacterMap[character[0]].charCodeAt(0);
    } else if (cjkRegex.test(character[0])) {
        ch = 77; // 'M'.charCodeAt(0);
    }
    const metrics = metricMap[fontName][ch];

    if (!metrics) {
        // console.warn(
        //     'No metrics for ' +
        //     '"' + character + '" (U+' + ('000000' + ch.toString(16)).substr(-6) + ')' +
        //     ' in font "' + fontName + '"');
        // Assume default values.
        // depth + height should be less than 1.0 em
        return {
            defaultMetrics: true,
            depth: .20,
            height: .70,
            italic: 0,
            skew: 0
        }
    }

    if (metrics) {
        return {
            depth: metrics[0],
            height: metrics[1],
            italic: metrics[2],
            skew: metrics[3]
        }
    }

    return null;
}


/**
 *
 * @param {number|string} value If value is a string, it may be suffixed
 * with a unit, which will override the `unit` paramter
 * @param {string} unit
 * @param {number} precision
 * @private
 */
function convertDimenToEm(value, unit, precision) {
    if (typeof value === 'string') {
        const m = value.match(/([-+]?[0-9.]*)\s*([a-zA-Z]+)/);
        if (!m) {
            value = parseFloat(value);
        } else {
            value = parseFloat(m[1]);
            unit = m[2].toLowerCase();
        }
    }

    // If the units are missing, TeX assumes 'pt'
    const f = {
        'pt': 1.0,
        'mm': 7227 / 2540,
        'cm': 7227 / 254,
        'ex': 35271 / 8192,
        'px': 3.0 / 4.0,
        'em': METRICS.ptPerEm,
        'bp': 803 / 800,
        'dd': 1238 / 1157,
        'pc': 12.0,
        'in': 72.27,
        'mu': 10 / 18,

    }[unit] || 1.0

    if (isFinite(precision)) {
        const factor = Math.pow(10, precision);
        return Math.round((value / METRICS.ptPerEm) * f * factor) / factor;
    }

    return (value / METRICS.ptPerEm) * f;
}

function convertDimenToPx(value, unit) {
    return convertDimenToEm(value, unit) * (4.0 / 3.0) * METRICS.ptPerEm;
}


export default {
    toEm : convertDimenToEm,
    toPx: convertDimenToPx,
    METRICS,
    SIGMAS,
    getCharacterMetrics
}
