import { ParseMode, Variant, VariantStyle } from './context';
import { Atom, AtomType, Notations, Colspec } from './atom-utils';
import { FontSeries, FontShape } from './context';

export const MATH_SYMBOLS = {};
// Map a character to some corresponding Latex
// This is used for some characters such as ² SUPERSCRIPT TWO
// The table will also be populated by any registered symbol
// from MATH_SYMBOLS
// prettier-ignore
export const REVERSE_MATH_SYMBOLS = {
    '\u2223': '|',
    '\u00b7': '\\cdot',
    '\u00bc': '\\frac{1}{4}',
    '\u00bd': '\\frac{1}{2}',
    '\u00be': '\\frac{3}{4}',
    '\u2070': '^{0}',
    '\u2071': '^{i}', // eslint-disable-line
    '\u00b9': '^{1}',
    '\u00b2': '^{2}',
    '\u00b3': '^{3}',
    '\u2074': '^{4}',
    '\u2075': '^{5}',
    '\u2076': '^{6}',
    '\u2077': '^{7}',
    '\u2078': '^{8}',
    '\u2079': '^{9}',
    '\u207a': '^{+}',
    '\u207b': '^{-}',
    '\u207c': '^{=}',
    '\u207f': '^{n}', // eslint-disable-line
    '\u2080': '_{0}',
    '\u2081': '_{1}',
    '\u2082': '_{2}',
    '\u2083': '_{3}',
    '\u2084': '_{4}',
    '\u2085': '_{5}',
    '\u2086': '_{6}',
    '\u2087': '_{7}',
    '\u2088': '_{8}',
    '\u2089': '_{9}',
    '\u208a': '_{+}',
    '\u208b': '_{-}',
    '\u208c': '_{=}',
    '\u2090': '_{a}',
    '\u2091': '_{e}',
    '\u2092': '_{o}',
    '\u2093': '_{x}',

    '\u2032': '\\prime',
    '\u2033': '\\doubleprime',
    '\u2035': '\\backprime',
    '\u2036': '\\backdoubleprime',
    '\u2220': '\\angle',

    '\u2102': '\\C',
    '\u2115': '\\N',
    '\u2119': '\\P',
    '\u211a': '\\Q',
    '\u211d': '\\R',
    '\u2124': '\\Z',
};

export const FUNCTIONS = {};

export const ENVIRONMENTS = {};

type EmitFunction = (
    name: string,
    parent: Atom,
    atom: Atom,
    emit: (parent: Atom, atoms: Atom[]) => string
) => string;

export type ParseFunctionResult = {
    type?: string;

    mode?: string;
    mathstyle?: string;

    skipBoundary?: boolean;
    captureSelection?: boolean;

    body?: string | Atom[];
    svgBelow?: string; // type = 'overunder'

    limits?: 'limits' | 'nolimits' | 'accent' | 'auto';
    accent?: string;

    latexOpen?: string; // type = 'group'
    latexClose?: string; // type = 'group'
    color?: string; // type = ''
    verbatimBackgroundcolor?: string;
    backgroundcolor?: string;
    framecolor?: string;
    verbatimFramecolor?: string;
    fontSize?:
        | 'size1'
        | 'size2'
        | 'size3'
        | 'size4'
        | 'size5'
        | 'size6'
        | 'size7'
        | 'size8'
        | 'size9'
        | 'size10';
    fontSeries?: FontSeries;
    fontShape?: FontShape;
    fontFamily?: string;
    variant?: Variant;
    variantStyle?: VariantStyle;

    cssClass?: string;
    cssId?: string;
    isFunction?: boolean;
    isSymbol?: boolean;

    size?: string; // type = 'sizeddelim'
    cls?: string; // type = 'sizeddelim'    @revisit: use cssClass?
    delim?: string;

    // type = 'genfrac'
    hasBarLine?: boolean;
    leftDelim?: string;
    rightDelim?: string;
    numer?: Atom[];
    denom?: Atom[];
    continuousFraction?: boolean;
    numerPrefix?: string;
    denomPrefix?: string;

    // type = 'enclose'
    notation?: Notations;
    borderStyle?: string;
    padding?: number | string;
    svgStrokeStyle?: string;
    strokeColor?: string;
    strokeWidth?: number;
    strokeStyle?: string;
    shadow?: string;

    // type = 'array'
    arraystretch?: number;
    colFormat?: Colspec[];
    // arraycolsep?: number;
    // jot?: number;
    lFence?: string;
    rFence?: string;
};

type ParseFunction = (
    name: string,
    args: (string | Atom[])[]
) => ParseFunctionResult;

export type MacroDefinition = { def: string; args?: number };
export type MacroDictionary = { [name: string]: string | MacroDefinition };

export const MACROS: MacroDictionary = {
    iff: '\\;\u27fa\\;', //>2,000 Note: additional spaces around the arrows
    nicefrac: '^{#1}\\!\\!/\\!_{#2}',

    // From bracket.sty, Dirac notation
    bra: '\\mathinner{\\langle{#1}|}',
    ket: '\\mathinner{|{#1}\\rangle}',
    braket: '\\mathinner{\\langle{#1}\\rangle}',
    set: '\\mathinner{\\lbrace #1 \\rbrace}',
    Bra: '\\left\\langle #1\\right|',
    Ket: '\\left|#1\\right\\rangle',
    Braket: '\\left\\langle{#1}\\right\\rangle',
    Set: '\\left\\lbrace #1 \\right\\rbrace',
};

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

// Body-text symbols
// See http://ctan.mirrors.hoobly.com/info/symbols/comprehensive/symbols-a4.pdf, p14

export const TEXT_SYMBOLS = {
    '\\#': '\u0023',
    '\\&': '\u0026',
    '\\$': '$',
    '\\%': '%',
    '\\_': '_',
    '\\euro': '\u20AC',
    '\\maltese': '\u2720',
    '\\{': '{',
    '\\}': '}',
    '\\nobreakspace': '\u00A0',
    '\\ldots': '\u2026',
    '\\textellipsis': '\u2026',
    '\\backslash': '\\',
    '`': '\u2018',
    "'": '\u2019',
    '``': '\u201c',
    "''": '\u201d',
    '\\degree': '\u00b0',
    '\\textasciicircum': '^',
    '\\textasciitilde': '~',
    '\\textasteriskcentered': '*',
    '\\textbackslash': '\\',
    '\\textbraceleft': '{',
    '\\textbraceright': '}',
    '\\textbullet': '•',
    '\\textdollar': '$',
    '\\textsterling': '£',
    '–': '\u2013', // EN DASH
    '—': '\u2014', // EM DASH
    '‘': '\u2018', // LEFT SINGLE QUOTATION MARK
    '’': '\u2019', // RIGHT SINGLE QUOTATION MARK
    '“': '\u201C', // LEFT DOUBLE QUOTATION MARK
    '”': '\u201D', // RIGHT DOUBLE QUOTATION MARK
    '"': '\u201D', // DOUBLE PRIME
    '\\ss': '\u00df', // LATIN SMALL LETTER SHARP S
    '\\ae': '\u00E6', // LATIN SMALL LETTER AE
    '\\oe': '\u0153', // LATIN SMALL LIGATURE OE
    '\\AE': '\u00c6', // LATIN CAPITAL LETTER AE
    '\\OE': '\u0152', // LATIN CAPITAL LIGATURE OE
    '\\O': '\u00d8', // LATIN CAPITAL LETTER O WITH STROKE
    '\\i': '\u0131', // LATIN SMALL LETTER DOTLESS I
    '\\j': '\u0237', // LATIN SMALL LETTER DOTLESS J
    '\\aa': '\u00e5', // LATIN SMALL LETTER A WITH RING ABOVE
    '\\AA': '\u00c5', // LATIN CAPITAL LETTER A WITH RING ABOVE
};

export const COMMAND_MODE_CHARACTERS = /[a-zA-Z0-9!@*()-=+{}[\]\\';:?/.,~<>`|'$%#&^_" ]/;

// Word boundaries for Cyrillic, Polish, French, German, Italian
// and Spanish. We use \p{L} (Unicode property escapes: "Letter")
// but Firefox doesn't support it
// (https://bugzilla.mozilla.org/show_bug.cgi?id=1361876). Booo...
// See also https://stackoverflow.com/questions/26133593/using-regex-to-match-international-unicode-alphanumeric-characters-in-javascript
export const LETTER =
    typeof navigator !== 'undefined' &&
    /firefox|edge/i.test(navigator.userAgent)
        ? /[a-zA-ZаАбБвВгГдДеЕёЁжЖзЗиИйЙкКлЛмМнНоОпПрРсСтТуУфФхХцЦчЧшШщЩъЪыЫьЬэЭюЮяĄąĆćĘęŁłŃńÓóŚśŹźŻżàâäôéèëêïîçùûüÿæœÀÂÄÔÉÈËÊÏÎŸÇÙÛÜÆŒäöüßÄÖÜẞàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚáéíñóúüÁÉÍÑÓÚÜ]/
        : new RegExp('\\p{Letter}', 'u');

export const LETTER_AND_DIGITS =
    typeof navigator !== 'undefined' &&
    /firefox|edge/i.test(navigator.userAgent)
        ? /[0-9a-zA-ZаАбБвВгГдДеЕёЁжЖзЗиИйЙкКлЛмМнНоОпПрРсСтТуУфФхХцЦчЧшШщЩъЪыЫьЬэЭюЮяĄąĆćĘęŁłŃńÓóŚśŹźŻżàâäôéèëêïîçùûüÿæœÀÂÄÔÉÈËÊÏÎŸÇÙÛÜÆŒäöüßÄÖÜẞàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚáéíñóúüÁÉÍÑÓÚÜ]/
        : new RegExp('[0-9\\p{Letter}]', 'u');

/**
 *
 * @param {string} symbol    The LaTeX command for this symbol, for
 * example `\alpha` or `+`
 *
 * @memberof module:definitions
 * @private
 */
export function defineSymbol(
    symbol: string,
    value: string,
    type: AtomType = 'mord',
    variant: Variant | '' = ''
): void {
    MATH_SYMBOLS[symbol] = {
        type,
        variant,
        value,
    };
    if (!REVERSE_MATH_SYMBOLS[value]) {
        if (!variant) {
            REVERSE_MATH_SYMBOLS[value] = symbol;
        }
    } else {
        if (!variant) {
            console.warn(
                'Multiple definitions for ',
                value,
                REVERSE_MATH_SYMBOLS[value],
                symbol
            );
        } else {
            console.warn(
                'Multiple definitions with variant for ',
                value,
                variant,
                REVERSE_MATH_SYMBOLS[value],
                symbol
            );
        }
    }
}

/**
 * Define a set of single-character symbols as 'mord' symbols.
 * @param {string} string a string of single character symbols
 * @memberof module:definitions
 * @private
 */
export function defineSymbols(string: string): void {
    for (let i = 0; i < string.length; i++) {
        const ch = string.charAt(i);
        defineSymbol(ch, ch);
    }
}

/**
 * Define a set of single-character symbols as a range of Unicode codepoints
 * @param {number} from First Unicode codepoint
 * @param {number} to Last Unicode codepoint
 * @memberof module:definitions
 * @private
 */
export function defineSymbolRange(from: number, to: number): void {
    for (let i = from; i <= to; i++) {
        const ch = String.fromCodePoint(i);
        defineSymbol(ch, ch);
    }
}

/**
 * Given a character, return a LaTeX expression matching its Unicode codepoint.
 * If there is a matching symbol (e.g. \alpha) it is returned.
 */
export function charToLatex(parseMode: ParseMode, s: string): string {
    if (parseMode === 'math') {
        return REVERSE_MATH_SYMBOLS[s] || s;
    }
    if (parseMode === 'text') {
        return (
            Object.keys(TEXT_SYMBOLS).find((x) => TEXT_SYMBOLS[x] === s) || s
        );
    }
    return s;
}

/**
 * Given a Unicode character returns {char:, variant:, style} corresponding
 * to this codepoint. `variant` is optional.
 * This maps characters such as ℂ ("blackboard uppercase C") to
 * {char: 'C', variant: 'double-struck', style:''}
 * @param {string} char
 */

/* Some symbols in the MATHEMATICAL ALPHANUMERICAL SYMBOLS block had
   been previously defined in other blocks. Remap them */
const MATH_LETTER_EXCEPTIONS = {
    0x1d455: 0x0210e,
    0x1d49d: 0x0212c,
    0x1d4a0: 0x02130,
    0x1d4a1: 0x02131,
    0x1d4a3: 0x0210b,
    0x1d4a4: 0x02110,
    0x1d4a7: 0x02112,
    0x1d4a8: 0x02133,
    0x1d4ad: 0x0211b,
    0x1d4ba: 0x0212f,
    0x1d4bc: 0x0210a,
    0x1d4c4: 0x02134,
    0x1d506: 0x0212d,
    0x1d50b: 0x0210c,
    0x1d50c: 0x02111,
    0x1d515: 0x0211c,
    0x1d51d: 0x02128,
    0x1d53a: 0x02102,
    0x1d53f: 0x0210d,
    0x1d545: 0x02115,
    0x1d547: 0x02119,
    0x1d548: 0x0211a,
    0x1d549: 0x0211d,
    0x1d551: 0x02124,
};

const MATH_UNICODE_BLOCKS = [
    { start: 0x1d400, len: 26, offset: 65, style: 'bold' },
    { start: 0x1d41a, len: 26, offset: 97, style: 'bold' },
    { start: 0x1d434, len: 26, offset: 65, style: 'italic' },
    { start: 0x1d44e, len: 26, offset: 97, style: 'italic' },
    { start: 0x1d468, len: 26, offset: 65, style: 'bolditalic' },
    { start: 0x1d482, len: 26, offset: 97, style: 'bolditalic' },

    { start: 0x1d49c, len: 26, offset: 65, variant: 'script' },
    { start: 0x1d4b6, len: 26, offset: 97, variant: 'script' },
    { start: 0x1d4d0, len: 26, offset: 65, variant: 'script', style: 'bold' },
    { start: 0x1d4ea, len: 26, offset: 97, variant: 'script', style: 'bold' },

    { start: 0x1d504, len: 26, offset: 65, variant: 'fraktur' },
    { start: 0x1d51e, len: 26, offset: 97, variant: 'fraktur' },
    { start: 0x1d56c, len: 26, offset: 65, variant: 'fraktur', style: 'bold' },
    { start: 0x1d586, len: 26, offset: 97, variant: 'fraktur', style: 'bold' },

    { start: 0x1d538, len: 26, offset: 65, variant: 'double-struck' },
    { start: 0x1d552, len: 26, offset: 97, variant: 'double-struck' },

    { start: 0x1d5a0, len: 26, offset: 65, variant: 'sans-serif' },
    { start: 0x1d5ba, len: 26, offset: 97, variant: 'sans-serif' },
    {
        start: 0x1d5d4,
        len: 26,
        offset: 65,
        variant: 'sans-serif',
        style: 'bold',
    },
    {
        start: 0x1d5ee,
        len: 26,
        offset: 97,
        variant: 'sans-serif',
        style: 'bold',
    },
    {
        start: 0x1d608,
        len: 26,
        offset: 65,
        variant: 'sans-serif',
        style: 'italic',
    },
    {
        start: 0x1d622,
        len: 26,
        offset: 97,
        variant: 'sans-serif',
        style: 'italic',
    },
    {
        start: 0x1d63c,
        len: 26,
        offset: 65,
        variant: 'sans-serif',
        style: 'bolditalic',
    },
    {
        start: 0x1d656,
        len: 26,
        offset: 97,
        variant: 'sans-serif',
        style: 'bolditalic',
    },

    { start: 0x1d670, len: 26, offset: 65, variant: 'monospace' },
    { start: 0x1d68a, len: 26, offset: 97, variant: 'monospace' },

    { start: 0x1d6a8, len: 25, offset: 0x391, style: 'bold' },
    { start: 0x1d6c2, len: 25, offset: 0x3b1, style: 'bold' },
    { start: 0x1d6e2, len: 25, offset: 0x391, style: 'italic' },
    { start: 0x1d6fc, len: 25, offset: 0x3b1, style: 'italic' },
    { start: 0x1d71c, len: 25, offset: 0x391, style: 'bolditalic' },
    { start: 0x1d736, len: 25, offset: 0x3b1, style: 'bolditalic' },
    {
        start: 0x1d756,
        len: 25,
        offset: 0x391,
        variant: 'sans-serif',
        style: 'bold',
    },
    {
        start: 0x1d770,
        len: 25,
        offset: 0x3b1,
        variant: 'sans-serif',
        style: 'bold',
    },
    {
        start: 0x1d790,
        len: 25,
        offset: 0x391,
        variant: 'sans-serif',
        style: 'bolditalic',
    },
    {
        start: 0x1d7aa,
        len: 25,
        offset: 0x3b1,
        variant: 'sans-serif',
        style: 'bolditalic',
    },

    { start: 0x1d7ce, len: 10, offset: 48, variant: '', style: 'bold' },
    { start: 0x1d7d8, len: 10, offset: 48, variant: 'double-struck' },
    { start: 0x1d7e3, len: 10, offset: 48, variant: 'sans-serif' },
    {
        start: 0x1d7ec,
        len: 10,
        offset: 48,
        variant: 'sans-serif',
        style: 'bold',
    },
    { start: 0x1d7f6, len: 10, offset: 48, variant: 'monospace' },
];

function unicodeToMathVariant(
    codepoint: number
): { char: string; variant?: string; style?: string } {
    if (
        (codepoint < 0x1d400 || codepoint > 0x1d7ff) &&
        (codepoint < 0x2100 || codepoint > 0x214f)
    ) {
        return { char: String.fromCodePoint(codepoint) };
    }

    // Handle the 'gap' letters by converting them back into their logical range
    for (const c in MATH_LETTER_EXCEPTIONS) {
        if (Object.prototype.hasOwnProperty.call(MATH_LETTER_EXCEPTIONS, c)) {
            if (MATH_LETTER_EXCEPTIONS[c] === codepoint) {
                codepoint = c.codePointAt(0);
                break;
            }
        }
    }

    for (let i = 0; i < MATH_UNICODE_BLOCKS.length; i++) {
        if (
            codepoint >= MATH_UNICODE_BLOCKS[i].start &&
            codepoint <
                MATH_UNICODE_BLOCKS[i].start + MATH_UNICODE_BLOCKS[i].len
        ) {
            return {
                char: String.fromCodePoint(
                    codepoint -
                        MATH_UNICODE_BLOCKS[i].start +
                        MATH_UNICODE_BLOCKS[i].offset
                ),
                variant: MATH_UNICODE_BLOCKS[i].variant,
                style: MATH_UNICODE_BLOCKS[i].style,
            };
        }
    }

    return { char: String.fromCodePoint(codepoint) };
}

/**
 * Given a character and variant ('double-struck', 'fraktur', etc...)
 * return the corresponding unicode character (a string)
 * @param {string} char
 * @param {string} variant
 * @memberof module:definitions
 * @private
 */
export function mathVariantToUnicode(char, variant, style) {
    if (!/[A-Za-z0-9]/.test(char)) return char;
    if (!variant && !style) return char;

    const codepoint = char.codePointAt(0);

    for (let i = 0; i < MATH_UNICODE_BLOCKS.length; i++) {
        if (!variant || MATH_UNICODE_BLOCKS[i].variant === variant) {
            if (!style || MATH_UNICODE_BLOCKS[i].style === style) {
                if (
                    codepoint >= MATH_UNICODE_BLOCKS[i].offset &&
                    codepoint <
                        MATH_UNICODE_BLOCKS[i].offset +
                            MATH_UNICODE_BLOCKS[i].len
                ) {
                    const result =
                        MATH_UNICODE_BLOCKS[i].start +
                        codepoint -
                        MATH_UNICODE_BLOCKS[i].offset;
                    return String.fromCodePoint(
                        MATH_LETTER_EXCEPTIONS[result] || result
                    );
                }
            }
        }
    }

    return char;
}

export function unicodeCharToLatex(parseMode: ParseMode, char: string): string {
    if (parseMode === 'text') {
        return charToLatex(parseMode, char) || char;
    }

    let result: string;
    // Codepoint shortcuts have priority over variants
    // That is, "\N" vs "\mathbb{N}"
    // if (CODEPOINT_SHORTCUTS[cp]) return CODEPOINT_SHORTCUTS[cp];
    result = charToLatex(parseMode, char);
    if (result) return result;

    const cp = char.codePointAt(0);
    const v = unicodeToMathVariant(cp);
    if (!v.style && !v.variant) return '';

    result = v.char;
    if (v.variant) {
        result = '\\' + v.variant + '{' + result + '}';
    }
    if (v.style === 'bold') {
        result = '\\mathbf{' + result + '}';
    } else if (v.style === 'italic') {
        result = '\\mathit{' + result + '}';
    } else if (v.style === 'bolditalic') {
        result = '\\mathbfit{' + result + '}';
    }
    return '\\mathord{' + result + '}';
}

export function unicodeStringToLatex(parseMode: ParseMode, s: string): string {
    let result = '';
    let needSpace = false;
    for (const c of s) {
        if (needSpace) {
            if (parseMode === 'text') {
                result += '{}';
            } else {
                result += ' ';
            }
        }
        needSpace = false;
        const latex = unicodeCharToLatex(parseMode, c);
        if (latex) {
            result += latex;
            needSpace = /\\[a-zA-Z0-9]+\*?$/.test(latex);
        } else {
            result += c;
        }
    }
    return result;
}

/**
 *
 * @param {string} mode
 * @param {string} command
 * @return {boolean} True if command is allowed in the mode
 * (note that command can also be a single character, e.g. "a")
 * @memberof module:definitions
 * @private
 */
export function commandAllowed(mode: ParseMode, command: string): boolean {
    if (
        FUNCTIONS[command] &&
        (!FUNCTIONS[command].mode || FUNCTIONS[command].mode.includes(mode))
    ) {
        return true;
    }
    if ({ text: TEXT_SYMBOLS, math: MATH_SYMBOLS }[mode][command]) {
        return true;
    }

    return false;
}

export function getValue(mode: ParseMode, symbol: string): string {
    if (mode === 'math') {
        return MATH_SYMBOLS[symbol] && MATH_SYMBOLS[symbol].value
            ? MATH_SYMBOLS[symbol].value
            : symbol;
    }
    return TEXT_SYMBOLS[symbol] ? TEXT_SYMBOLS[symbol] : symbol;
}

export function emit(symbol, parent, atom, emitFn) {
    console.assert(atom);
    console.assert(symbol, 'Missing command for ', atom.body);

    if (FUNCTIONS[symbol] && FUNCTIONS[symbol].emit) {
        return FUNCTIONS[symbol].emit(symbol, parent, atom, emitFn);
    }

    if (MATH_SYMBOLS[symbol] || TEXT_SYMBOLS[symbol]) {
        // Add a space after commands, to avoid, e.g.
        // '\sin' + 'x' -> '\sinx' instead of '\sin x'
        return symbol + (/^\\.*[a-zA-Z0-9]$/.test(symbol) ? ' ' : '');
    }

    if (
        FUNCTIONS[symbol] &&
        FUNCTIONS[symbol].params &&
        FUNCTIONS[symbol].params.length === 1 &&
        atom.body
    ) {
        return symbol + '{' + emitFn(atom, atom.body) + '}';
    }
    // No custom emit function provided, return the symbol (could be a character)
    return symbol;
}

export function getEnvironmentInfo(name: string) {
    let result = ENVIRONMENTS[name];
    if (!result) {
        result = {
            params: '',
            parser: null,
            mathstyle: 'displaystyle',
            tabular: true,
            colFormat: [],
            lFence: '.',
            rFence: '.',
            // arrayStretch: 1,
        };
    }
    return result;
}

/**
 * @param {string} symbol    A command (e.g. '\alpha') or a character (e.g. 'a')
 * @param {string} parseMode One of 'math' or 'text'
 * @param {MacroDictionary} macros={} A macros dictionary
 * @return {object} An info structure about the symbol, or null
 * @memberof module:definitions
 * @private
 */
export function getInfo(
    symbol: string,
    parseMode: ParseMode,
    macros: MacroDictionary
) {
    if (!symbol || symbol.length === 0) return null;

    let info = null;

    if (symbol.charAt(0) === '\\') {
        // This could be a function or a symbol
        info = FUNCTIONS[symbol];
        if (info) {
            // We've got a match

            // Validate that the current mode is supported by the command
            if (info.mode && !info.mode.includes(parseMode)) return null;

            return info;
        }

        if (!info) {
            // It wasn't a function, maybe it's a symbol?
            if (parseMode === 'math') {
                info = MATH_SYMBOLS[symbol];
            } else if (TEXT_SYMBOLS[symbol]) {
                info = { value: TEXT_SYMBOLS[symbol] };
            }
        }

        if (!info) {
            // Maybe it's a macro
            const command = symbol.slice(1);
            if (macros && macros[command]) {
                let def = macros[command];
                if (typeof def === 'object') {
                    def = def.def;
                }
                let argCount = 0;
                // Let's see if there are arguments in the definition.
                if (/(^|[^\\])#1/.test(def)) argCount = 1;
                if (/(^|[^\\])#2/.test(def)) argCount = 2;
                if (/(^|[^\\])#3/.test(def)) argCount = 3;
                if (/(^|[^\\])#4/.test(def)) argCount = 4;
                if (/(^|[^\\])#5/.test(def)) argCount = 5;
                if (/(^|[^\\])#6/.test(def)) argCount = 6;
                if (/(^|[^\\])#7/.test(def)) argCount = 7;
                if (/(^|[^\\])#8/.test(def)) argCount = 8;
                if (/(^|[^\\])#9/.test(def)) argCount = 9;
                info = {
                    type: 'group',
                    mode: 'math',
                    params: [],
                    infix: false,
                };
                while (argCount >= 1) {
                    info.params.push({
                        optional: false,
                        type: 'math',
                        defaultValue: null,
                        placeholder: null,
                    });
                    argCount -= 1;
                }
            }
        }
    } else {
        if (parseMode === 'math') {
            info = MATH_SYMBOLS[symbol];
        } else if (TEXT_SYMBOLS[symbol]) {
            info = { value: TEXT_SYMBOLS[symbol] };
        }
    }

    // Special case `f`, `g` and `h` are recognized as functions.
    if (
        info &&
        info.type === 'mord' &&
        (info.value === 'f' || info.value === 'g' || info.value === 'h')
    ) {
        info.isFunction = true;
    }

    return info;
}

/**
 * Return an array of suggestion for completing string 's'.
 * For example, for 'si', it could return ['sin', 'sinh', 'sim', 'simeq', 'sigma']
 * Infix operators are excluded, since they are deprecated commands.
 * @param {string} s
 * @return {string[]}
 * @memberof module:definitions
 * @private
 */
export function suggest(s: string): string[] {
    if (s.length <= 1) return [];
    const result = [];

    // Iterate over items in the dictionary
    for (const p in FUNCTIONS) {
        if (Object.prototype.hasOwnProperty.call(FUNCTIONS, p)) {
            if (p.startsWith(s) && !FUNCTIONS[p].infix) {
                result.push({ match: p, frequency: FUNCTIONS[p].frequency });
            }
        }
    }

    for (const p in MATH_SYMBOLS) {
        if (Object.prototype.hasOwnProperty.call(MATH_SYMBOLS, p)) {
            if (p.startsWith(s)) {
                result.push({ match: p, frequency: MATH_SYMBOLS[p].frequency });
            }
        }
    }

    result.sort((a, b) => {
        if (a.frequency === b.frequency) {
            return a.match.length - b.match.length;
        }
        return (b.frequency || 0) - (a.frequency || 0);
    });

    return result;
}

/**
 * An argument template has the following syntax:
 *
 * <placeholder>:<type>=<default>
 *
 * where
 * - <placeholder> is a string whose value is displayed when the argument
 *   is missing
 * - <type> is one of 'string', 'color', 'dimen', 'auto', 'text', 'math'
 * - <default> is the default value if none is provided for an optional
 * parameter
 *
 * @param {string} argTemplate
 * @param {boolean} isOptional
 * @memberof module:definitions
 * @private
 */
function parseParamTemplateArgument(argTemplate: string, isOptional: boolean) {
    let r = argTemplate.match(/=(.+)/);
    const defaultValue = r ? r[1] : isOptional ? '[]' : '{}';
    let type = 'auto';
    let placeholder = null;

    // Parse the type (:type)
    r = argTemplate.match(/:([^=]+)/);
    if (r) type = r[1].trim();

    // Parse the placeholder
    r = argTemplate.match(/^([^:=]+)/);
    if (r) placeholder = r[1].trim();

    return {
        optional: isOptional,
        type: type,
        defaultValue: defaultValue,
        placeholder: placeholder,
    };
}

function parseParamTemplate(paramTemplate) {
    if (!paramTemplate) return [];

    let result = [];
    let params = paramTemplate.split(']');
    if (params[0].charAt(0) === '[') {
        // We found at least one optional parameter.
        result.push(parseParamTemplateArgument(params[0].slice(1), true));
        // Parse the rest
        for (let i = 1; i <= params.length; i++) {
            result = result.concat(parseParamTemplate(params[i]));
        }
    } else {
        params = paramTemplate.split('}');
        if (params[0].charAt(0) === '{') {
            // We found a required parameter
            result.push(parseParamTemplateArgument(params[0].slice(1), false));
            // Parse the rest
            for (let i = 1; i <= params.length; i++) {
                result = result.concat(parseParamTemplate(params[i]));
            }
        }
    }

    return result;
}

/**
 * If possible, i.e. if they are all simple atoms, return a string made up of
 * their body
 * @param {object[]} atoms
 * @memberof module:definitions
 * @private
 */
export function parseArgAsString(atoms: Atom[]): string {
    let result = '';
    let success = true;
    atoms.forEach((atom) => {
        if (typeof atom.body === 'string') {
            result += atom.body;
        } else {
            success = false;
        }
    });
    return success ? result : '';
}

/**
 * Define one or more environments to be used with
 *         \begin{<env-name>}...\end{<env-name>}.
 *
 * @param {string|string[]} names
 * @param {string} params The number and type of required and optional parameters.
 * @param {object} options
 * -
 * @param {function(*)} parser
 * @memberof module:definitions
 * @private
 */
export function defineEnvironment(
    names: string | string[],
    params: string,
    options,
    parser
): void {
    if (typeof names === 'string') names = [names];
    if (!options) options = {};
    const parsedParams = parseParamTemplate(params);

    // Set default values of functions
    const data = {
        // Params: the parameters for this function, an array of
        // {optional, type, defaultValue, placeholder}
        params: parsedParams,

        // Callback to parse the arguments
        parser: parser,

        tabular: options.tabular || true,
        colFormat: options.colFormat || [],
    };
    for (const name of names) {
        ENVIRONMENTS[name] = data;
    }
}

/**
 * Define one of more functions.
 *
 * @param {string|string[]} names
 * @param {string} params The number and type of required and optional parameters.
 * For example: '{}' defines a single mandatory parameter
 * '[index=2]{indicand:auto}' defines two params, one optional, one required

 * @param {object} options
 * - infix
 * - mode
 * @param {function} parseFunction
 * @memberof module:definitions
 * @private
 */
export function defineFunction(
    names: string | string[],
    params: string,
    options: { mode?: ParseMode; infix?: boolean },
    parseFunction?: ParseFunction,
    emitFunction?: EmitFunction
): void {
    if (typeof names === 'string') {
        names = [names];
    }

    if (!options) options = {};

    // Set default values of functions
    const data = {
        // The parameters for this function, an array of
        // {optional, type, defaultValue, placeholder}
        params: parseParamTemplate(params),

        mode: options.mode,
        infix: !!options.infix,
        parse: parseFunction,
        emit: emitFunction,
    };
    names.forEach((name) => {
        FUNCTIONS['\\' + name] = data;
    });
}
