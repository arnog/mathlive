import { colorToString } from './color';
import { register, getPropertyRuns } from './modes-utils';
import { getInfo, mathVariantToUnicode } from './definitions-utils';
import { Atom } from './atom';

// Each entry indicate the font-name (to be used to calculate font metrics)
// and the CSS classes (for proper markup styling) for each possible
// variant combinations.
const VARIANTS = {
    // Handle some special characters which are only available in "main" font (not "math")
    main: ['Main-Regular', 'ML__cmr'],
    'main-italic': ['Main-Italic', 'ML__cmr ML__it'],
    'main-bold': ['Main-Bold', 'ML__cmr ML__bold'],
    'main-bolditalic': ['Main-BoldItalic', 'ML__cmr ML_bold ML__it'],

    normal: ['Main-Regular', 'ML__cmr'], // 'main' font. There is no 'math' regular (upright)
    'normal-bold': ['Main-Bold', 'ML__mathbf'], // 'main' font. There is no 'math' bold
    'normal-italic': ['Math-Italic', 'ML__mathit'], // Special metrics for 'math'
    'normal-bolditalic': ['Math-BoldItalic', 'ML__mathbfit'], // Special metrics for 'math'

    // Extended math symbols, arrows, etc.. at their standard Unicode codepoints
    ams: ['AMS-Regular', 'ML__ams'],
    'ams-bold': ['AMS-Regular', 'ML__ams'],
    'ams-italic': ['AMS-Regular', 'ML__ams'],
    'ams-bolditalic': ['AMS-Regular', 'ML__ams'],

    'sans-serif': ['SansSerif-Regular', 'ML__sans'],
    'sans-serif-bold': ['SansSerif-Regular', 'ML__sans ML__bold'],
    'sans-serif-italic': ['SansSerif-Regular', 'ML__sans'],
    'sans-serif-bolditalic': ['SansSerif-Regular', 'ML__sans'],

    calligraphic: ['Caligraphic-Regular', 'ML__cal'],
    'calligraphic-bold': ['Caligraphic-Regular', 'ML__cal ML__bold'],
    'calligraphic-italic': ['Caligraphic-Regular', 'ML__cal ML__it'],
    'calligraphic-bolditalic': [
        'Caligraphic-Regular',
        'ML__cal ML__bold ML__it',
    ],

    script: ['Script-Regular', 'ML__script'],
    'script-bold': ['Script-Regular', 'ML__script ML__bold'],
    'script-italic': ['Script-Regular', 'ML__script ML__it'],
    'script-bolditalic': ['Script-Regular', 'ML__script ML__bold ML__it'],

    fraktur: ['Fraktur-Regular', 'ML__frak'],
    'fraktur-bold': ['Fraktur-Regular', 'ML__frak'],
    'fraktur-italic': ['Fraktur-Regular', 'ML__frak'],
    'fraktur-bolditalic': ['Fraktur-Regular', 'ML__frak'],

    monospace: ['Typewriter-Regular', 'ML__tt'],
    'monospace-bold': ['Typewriter-Regular', 'ML__tt ML__bold'],
    'monospace-italic': ['Typewriter-Regular', 'ML__tt ML__it'],
    'monospace-bolditalic': ['Typewriter-Regular', 'ML__tt ML__bold ML__it'],

    // Blackboard characters are 'A-Z' in the AMS font
    'double-struck': ['AMS-Regular', 'ML__bb'],
    'double-struck-bold': ['AMS-Regular', 'ML__bb'],
    'double-struck-italic': ['AMS-Regular', 'ML__bb'],
    'double-struck-bolditalic': ['AMS-Regular', 'ML__bb'],
};

const VARIANT_REPERTOIRE = {
    'double-struck': /^[A-Z ]$/,
    script: /^[A-Z ]$/,
    calligraphic: /^[0-9A-Z ]$/,
    fraktur: /^[0-9A-Za-z ]$|^[!"#$%&'()*+,\-./:;=?[]^’‘]$/,
    monospace: /^[0-9A-Za-z ]$|^[!"&'()*+,\-./:;=?@[\]^_~\u0131\u0237\u0393\u0394\u0398\u039b\u039e\u03A0\u03A3\u03A5\u03A8\u03a9]$/,
    'sans-serif': /^[0-9A-Za-z ]$|^[!"&'()*+,\-./:;=?@[\]^_~\u0131\u0237\u0393\u0394\u0398\u039b\u039e\u03A0\u03A3\u03A5\u03A8\u03a9]$/,
};

const GREEK_LOWERCASE = /^[\u03b1-\u03c9]|\u03d1|\u03d5|\u03d6|\u03f1|\u03f5]$/;
const GREEK_UPPERCASE = /^[\u0393|\u0394|\u0398|\u039b|\u039E|\u03A0|\u03A3|\u03a5|\u03a6|\u03a8|\u03a9]$/;

const LETTER_SHAPE_RANGES = [
    /^[a-z]$/, // Lowercase latin
    /^[A-Z]$/, // Upppercase latin
    GREEK_LOWERCASE,
    GREEK_UPPERCASE,
];

// The letterShapeStyle property indicates which characters should be
// automatically italicized (see LETTER_SHAPE_RANGES)
const LETTER_SHAPE_MODIFIER = {
    iso: ['it', 'it', 'it', 'it'],
    tex: ['it', 'it', 'it', 'up'],
    french: ['it', 'up', 'up', 'up'],
    upright: ['up', 'up', 'up', 'up'],
};

// See http://ctan.math.illinois.edu/macros/latex/base/fntguide.pdf

function emitLatexMathRun(
    context: Atom,
    run: Atom[],
    expandMacro: boolean
): string {
    let contextValue = context.variant;
    if (context.variantStyle && context.variantStyle !== 'up') {
        contextValue += '-' + context.variantStyle;
    }
    return getPropertyRuns(run, 'color')
        .map((x) => {
            const result = getPropertyRuns(x, 'variant')
                .map((x) => {
                    let value = x[0].variant;
                    if (x[0].variantStyle && x[0].variantStyle !== 'up') {
                        value += '-' + x[0].variantStyle;
                    }
                    // Check if all the atoms in this run have a base
                    // variant identical to the current variant
                    // If so, we can skip wrapping them
                    if (
                        x.every((x) => {
                            const info = getInfo(x.symbol, context.mode, null);
                            if (!info || !(info.variant || info.variantStyle)) {
                                return false;
                            }
                            let styledValue = x.variant;
                            if (x.variantStyle && x.variantStyle !== 'up') {
                                styledValue += '-' + x.variantStyle;
                            }
                            return styledValue === value;
                        })
                    ) {
                        return x.map((x) => x.toLatex(expandMacro)).join('');
                    }

                    let command = '';
                    if (value && value !== contextValue) {
                        command = {
                            calligraphic: '\\mathcal{',
                            fraktur: '\\mathfrak{',
                            'double-struck': '\\mathbb{',
                            script: '\\mathscr{',
                            monospace: '\\mathtt{',
                            'sans-serif': '\\mathsf{',
                            normal: '\\mathrm{',
                            'normal-italic': '\\mathit{',
                            'normal-bold': '\\mathbf{',
                            'normal-bolditalic': '\\mathbfit{',
                            ams: '',
                            'ams-italic': '\\mathit{',
                            'ams-bold': '\\mathbf{',
                            'ams-bolditalic': '\\mathbfit{',
                            main: '',
                            'main-italic': '\\mathit{',
                            'main-bold': '\\mathbf{',
                            'main-bolditalic': '\\mathbfit{',
                            // There are a few rare font families possible, which
                            // are not supported:
                            // mathbbm, mathbbmss, mathbbmtt, mathds, swab, goth
                            // In addition, the 'main' and 'math' font technically
                            // map to \mathnormal{}
                        }[value];
                        console.assert(typeof command !== 'undefined');
                    }
                    return (
                        command +
                        x.map((x) => x.toLatex(expandMacro)).join('') +
                        (command ? '}' : '')
                    );
                })
                .join('');
            if (x[0].color && (!context || context.color !== x[0].color)) {
                return (
                    '\\textcolor{' +
                    colorToString(x[0].color) +
                    '}{' +
                    result +
                    '}'
                );
            }
            return result;
        })
        .join('');
}

function applyStyle(atom, style) {
    // letterShapeStyle will usually be set automatically, except when the
    // locale cannot be determined, in which case its value will be 'auto'
    // which we default to 'tex'
    const letterShapeStyle =
        style.letterShapeStyle === 'auto' || !style.letterShapeStyle
            ? 'tex'
            : style.letterShapeStyle;
    let variant = style.variant || 'normal';
    let variantStyle = style.variantStyle || '';

    // 1. Remap to "main" font some characters that don't exist
    // in the "math" font

    // There are two fonts that include the roman italic characters, "main-it" and "math"
    // They are similar, but the "math" font has some different kernings ('f')
    // and some slightly different character shape. It doesn't include a few
    // characters, so for those characters, "main" has to be used instead

    // \imath, \jmath and \pound don't exist in "math" font,
    // so use "main" italic instead.
    if (
        variant === 'normal' &&
        !variantStyle &&
        /\u00a3|\u0131|\u0237/.test(atom.body)
    ) {
        variant = 'main';
        variantStyle = 'italic';
    }

    // 2. If no explicit variant style, auto-italicize some symbols,
    // depending on the letterShapeStyle
    if (variant === 'normal' && !variantStyle && atom.body.length === 1) {
        LETTER_SHAPE_RANGES.forEach((x, i) => {
            if (
                x.test(atom.body) &&
                LETTER_SHAPE_MODIFIER[letterShapeStyle][i] === 'it'
            ) {
                variantStyle = 'italic';
            }
        });
    }

    // 3. Map the variant + variantStyle to a font
    if (variantStyle === 'up') {
        variantStyle = '';
    }
    const styledVariant = variantStyle ? variant + '-' + variantStyle : variant;

    console.assert(VARIANTS[styledVariant]);

    const [fontName, classes] = VARIANTS[styledVariant];

    // 4. If outside the font repertoire, switch to system font
    // (return NULL to use default metrics)
    if (
        VARIANT_REPERTOIRE[variant] &&
        !VARIANT_REPERTOIRE[variant].test(atom.body)
    ) {
        // Map to unicode character
        atom.body = mathVariantToUnicode(atom.body, variant, variantStyle);
        atom.variant = '';
        atom.variantStyle = '';
        // Return NULL to use default metrics
        return null;
    }
    // Lowercase greek letters have an incomplete repertoire (no bold)
    // so, for \mathbf to behave correctly, add a 'lcGreek' class.
    if (GREEK_LOWERCASE.test(atom.body)) {
        atom.classes += ' lcGreek';
    }

    // 5. Assign classes based on the font
    if (classes) {
        atom.classes += ' ' + classes;
    }

    return fontName;
}

register('math', {
    emitLatexRun: emitLatexMathRun,
    applyStyle,
});
