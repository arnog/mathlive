/**
 * This module contains the definitions of all the symbols and commands, for
 * example `\alpha`, `\sin`, `\mathrm`.
 * There are a few exceptions with some "built-in" commands that require
 * special parsing such as `\char`.
 * @module core/definitions
 * @private
 */
import FontMetrics from './fontMetrics.js';


/**
 * To organize the symbols when generating the documentation, we
 * keep track of a category that gets assigned to each symbol.
 * @private
 */
let category = '';

const MATH_SYMBOLS = {};

const FUNCTIONS = {};

const ENVIRONMENTS = {};

const MACROS = {
    'iff':      '\\;\u27fa\\;',         //>2,000 Note: additional spaces around the arrows
    'nicefrac': '^{#1}\\!\\!/\\!_{#2}',

    // From bracket.sty, Diract notation
    'bra':      '\\mathinner{\\langle{#1}|}',
    'ket':      '\\mathinner{|{#1}\\rangle}',
    'braket':   '\\mathinner{\\langle{#1}\\rangle}',
    'set':      '\\mathinner{\\lbrace #1 \\rbrace}',
    'Bra':      '\\left\\langle #1\\right|',
    'Ket':      '\\left|#1\\right\\rangle',
    'Braket':   '\\left\\langle{#1}\\right\\rangle',
    'Set':      '\\left\\lbrace #1 \\right\\rbrace',

};


const RIGHT_DELIM = {
    '(':        ')',
    '{':        '}',
    '[':        ']',
    '|':        '|',
    '\\lbrace': '\\rbrace',
    '\\{':      '\\}',
    '\\langle': '\\rangle',
    '\\lfloor': '\\rfloor',
    '\\lceil':  '\\rceil',
    '\\vert':   '\\vert',
    '\\lvert':  '\\rvert',
    '\\Vert':   '\\Vert',
    '\\lVert':  '\\rVert',
    '\\lbrack': '\\rbrack',
    '\\ulcorner':   '\\urcorner',
    '\\llcorner':   '\\lrcorner',
    '\\lgroup': '\\rgroup',
    '\\lmoustache': '\\rmoustache'
}


// Frequency of a symbol.
// String constants corresponding to frequency values,
// which are the number of results returned by latexsearch.com
// When the precise number is known, it is provided. Otherwise,
// the following constants are used to denote an estimate.
const CRYPTIC = 'CRYPTIC';
const ARCANE = 'ARCANE';
// const VERY_RARE = 'VERY_RARE';
const RARE = 'RARE';
const UNCOMMON = 'UNCOMMON';
const COMMON = 'COMMON';
const SUPERCOMMON = 'SUPERCOMMON';

/**
 * @type {Object.<string, number>}
 * @private
 */
const FREQUENCY_VALUE = {
    'CRYPTIC': 0,
    'ARCANE': 200,
    'VERY_RARE': 600,
    'RARE': 1200,
    'UNCOMMON': 2000,
    'COMMON': 3000,
    'SUPERCOMMON': 4000
}


/**
 * Set the frequency of the specified symbol.
 * Default frequency is UNCOMMON
 * The argument list is a frequency value, followed by one or more symbol strings
 * For example:
 *  frequency(COMMON , '\\sin', '\\cos')
 * @param {string|number} value The frequency as a string constant,
 * or a numeric value [0...2000]
 * @param {...string}
 * @memberof module:definitions
 * @private
 */
function frequency(value, ...symbols) {
    const v = typeof value === 'string' ? FREQUENCY_VALUE[value] : value;

    for (const symbol of symbols) {
        if (MATH_SYMBOLS[symbol]) {
            MATH_SYMBOLS[symbol].frequency = v;
        }
        if (FUNCTIONS[symbol]) {
            // Make a copy of the entry, since it could be shared by multiple
            // symbols
            FUNCTIONS[symbol] = Object.assign({}, FUNCTIONS[symbol]);
            FUNCTIONS[symbol].frequency = v;
        }
    }
}



/**
 *
 * @param {string} latexName    The common LaTeX command for this symbol
 * @param {(string|string[])} mode
 * @param {string} fontFamily
 * @param {string} type
 * @param {string} value
 * @param {(number|string)} [frequency]
 * @memberof module:definitions
 * @private
 */
function defineSymbol(latexName, fontFamily, type, value, frequency) {
    if (fontFamily && !/^(ams|cmr|bb|cal|frak|scr)$/.test(fontFamily)) {
        console.log(fontFamily, latexName);
    }
    // Convert a frequency constant to a numerical value
    if (typeof frequency === 'string') frequency = FREQUENCY_VALUE[frequency];
    MATH_SYMBOLS[latexName] = {
        type: type === ORD ? MATHORD : type,
        baseFontFamily: fontFamily,
        value: value,
        category: category,         // To group items when generating the documentation
        frequency: frequency
    };
}



/**
 * Define a set of single-character symbols and all their attributes.
 * The value associated with the symbol is the symbol itself.
 * @param {string} string a string of single character symbols
 * @param {string} mode
 * @param {string} fontFamily
 * @param {string} type
 * @param {(string|number)} [frequency]
 * @memberof module:definitions
 * @private
 */
function defineSymbols(string) {
    for (let i = 0; i < string.length; i++) {
        const ch = string.charAt(i);
        defineSymbol(ch, '', MATHORD, ch);
    }
}

/**
 * Define a set of single-character symbols as a range of Unicode codepoints
 * @param {number} from First Unicode codepoint
 * @param {number} to Last Unicode codepoint
 * @memberof module:definitions
 * @private
 */
function defineSymbolRange(from, to) {
    for (let i = from; i <= to; i++) {
        const ch = String.fromCodePoint(i);
        defineSymbol(ch, '', 'mord', ch);
    }
}


const CODEPOINT_SHORTCUTS = {
    8739:   '|',
    0x00b7: '\\cdot',
    0x00bc: '\\frac{1}{4}',
    0x00bd: '\\frac{1}{2}',
    0x00be: '\\frac{3}{4}',
    0x2070: '^{0}',
    0x2071: '^{i}',
    0x00b9: '^{1}',
    0x00b2: '^{2}',
    0x00b3: '^{3}',
    0x2074: '^{4}',
    0x2075: '^{5}',
    0x2076: '^{6}',
    0x2077: '^{7}',
    0x2078: '^{8}',
    0x2079: '^{9}',
    0x207a: '^{+}',
    0x207b: '^{-}',
    0x207c: '^{=}',
    0x207f: '^{n}',

    0x2080: '_{0}',
    0x2081: '_{1}',
    0x2082: '_{2}',
    0x2083: '_{3}',
    0x2084: '_{4}',
    0x2085: '_{5}',
    0x2086: '_{6}',
    0x2087: '_{7}',
    0x2088: '_{8}',
    0x2089: '_{9}',
    0x208A: '_{+}',
    0x208B: '_{-}',
    0x208C: '_{=}',
    0x2090: '_{a}',
    0x2091: '_{e}',
    0x2092: '_{o}',
    0x2093: '_{x}',

    0x2032: '\\prime',
    0x2033: '\\doubleprime',
    0x2220: '\\angle',

    0x2102: '\\C',
    0x2115: '\\N',
    0x2119: '\\P',
    0x211A: '\\Q',
    0x211D: '\\R',
    0x2124: '\\Z',
};


/**
 * Given a character, return a LaTeX expression matching its Unicode codepoint.
 * If there is a matching symbol (e.g. \alpha) it is returned.
 * @param {string} parseMode
 * @param {number} cp
 * @return {string}
 * @memberof module:definitions
 * @private
 */
function matchCodepoint(parseMode, cp) {
    const s = String.fromCodePoint(cp);

    // Some symbols map to multiple codepoints.
    // Some symbols are 'pseudosuperscript'. Convert them to a super(or sub)script.
    // Map their alternative codepoints here.
    if (parseMode === 'math' && CODEPOINT_SHORTCUTS[s]) return CODEPOINT_SHORTCUTS[s];

    // Don't map 'simple' code point.
    // For example "C" maps to \doubleStruckCapitalC, not the desired "C"
    if (cp > 32 && cp < 127) return s;

    let result = '';
    if (parseMode === 'math') {
        for (const p in MATH_SYMBOLS) {
            if (Object.prototype.hasOwnProperty.call(MATH_SYMBOLS, p)) {
                if (MATH_SYMBOLS[p].value === s) {
                    result = p;
                    break;
                }
            }
        }
    } else {
        for (const p in TEXT_SYMBOLS) {
            if (Object.prototype.hasOwnProperty.call(TEXT_SYMBOLS, p)) {
                if (TEXT_SYMBOLS[p] === s) {
                    result = p;
                    break;
                }
            }
        }
    }

    return result || s;
}



/**
 * Given a Unicode character returns {char:, variant:, style} corresponding
 * to this codepoint. `variant` is optional.
 * This maps characters such as "blackboard uppercase C" to
 * {char: 'C', variant: 'double-struck', style:''}
 * @param {string} char
 */

/* Some symbols in the MATHEMATICAL ALPHANUMERICAL SYMBOLS block had
   been previously defined in other blocks. Remap them */
const MATH_LETTER_EXCEPTIONS = {
    0x1d455: 0x0210e,
    0x1D49D: 0x0212C,
    0x1D4A0: 0x02130,
    0x1D4A1: 0x02131,
    0x1D4A3: 0x0210B,
    0x1D4A4: 0x02110,
    0x1D4A7: 0x02112,
    0x1D4A8: 0x02133,
    0x1D4AD: 0x0211B,
    0x1D4BA: 0x0212F,
    0x1D4BC: 0x0210A,
    0x1D4C4: 0x02134,
    0x1D506: 0x0212D,
    0x1D50B: 0x0210C,
    0x1D50C: 0x02111,
    0x1D515: 0x0211C,
    0x1D51D: 0x02128,
    0x1D53A: 0x02102,
    0x1D53F: 0x0210D,
    0x1D545: 0x02115,
    0x1D547: 0x02119,
    0x1D548: 0x0211A,
    0x1D549: 0x0211D,
    0x1D551: 0x02124,
}


const MATH_UNICODE_BLOCKS = [
    { start: 0x1D400, len: 26, offset: 65, style: 'bold' },
    { start: 0x1D41A, len: 26, offset: 97, style: 'bold' },
    { start: 0x1D434, len: 26, offset: 65, style: 'italic' },
    { start: 0x1D44E, len: 26, offset: 97, style: 'italic' },
    { start: 0x1D468, len: 26, offset: 65, style: 'bolditalic'},
    { start: 0x1D482, len: 26, offset: 97, style: 'bolditalic'},

    { start: 0x1D49c, len: 26, offset: 65, variant: 'script'},
    { start: 0x1D4b6, len: 26, offset: 97, variant: 'script'},
    { start: 0x1D4d0, len: 26, offset: 65, variant: 'script', style: 'bold'},
    { start: 0x1D4ea, len: 26, offset: 97, variant: 'script', style: 'bold'},

    { start: 0x1D504, len: 26, offset: 65, variant: 'fraktur'},
    { start: 0x1D51e, len: 26, offset: 97, variant: 'fraktur'},
    { start: 0x1D56c, len: 26, offset: 65, variant: 'fraktur', style: 'bold'},
    { start: 0x1D586, len: 26, offset: 97, variant: 'fraktur', style: 'bold'},

    { start: 0x1D538, len: 26, offset: 65, variant: 'double-struck'},
    { start: 0x1D552, len: 26, offset: 97, variant: 'double-struck'},

    { start: 0x1D5A0, len: 26, offset: 65, variant: 'sans-serif'},
    { start: 0x1D5BA, len: 26, offset: 97, variant: 'sans-serif'},
    { start: 0x1D5D4, len: 26, offset: 65, variant: 'sans-serif', style: 'bold'},
    { start: 0x1D5EE, len: 26, offset: 97, variant: 'sans-serif', style: 'bold'},
    { start: 0x1D608, len: 26, offset: 65, variant: 'sans-serif', style: 'italic'},
    { start: 0x1D622, len: 26, offset: 97, variant: 'sans-serif', style: 'italic'},
    { start: 0x1D63c, len: 26, offset: 65, variant: 'sans-serif', style: 'bolditalic'},
    { start: 0x1D656, len: 26, offset: 97, variant: 'sans-serif', style: 'bolditalic'},

    { start: 0x1D670, len: 26, offset: 65, variant: 'monospace'},
    { start: 0x1D68A, len: 26, offset: 97, variant: 'monospace'},

    { start: 0x1D6A8, len: 25, offset: 0x391, style: 'bold'},
    { start: 0x1D6C2, len: 25, offset: 0x3B1, style: 'bold'},
    { start: 0x1D6E2, len: 25, offset: 0x391, style: 'italic'},
    { start: 0x1D6FC, len: 25, offset: 0x3B1, style: 'italic'},
    { start: 0x1D71C, len: 25, offset: 0x391, style: 'bolditalic'},
    { start: 0x1D736, len: 25, offset: 0x3B1, style: 'bolditalic'},
    { start: 0x1D756, len: 25, offset: 0x391, variant: 'sans-serif', style: 'bold'},
    { start: 0x1D770, len: 25, offset: 0x3B1, variant: 'sans-serif', style: 'bold'},
    { start: 0x1D790, len: 25, offset: 0x391, variant: 'sans-serif', style: 'bolditalic'},
    { start: 0x1D7AA, len: 25, offset: 0x3B1, variant: 'sans-serif', style: 'bolditalic'},


    { start: 0x1D7CE, len: 10, offset: 48, variant: '', style: 'bold' },
    { start: 0x1D7D8, len: 10, offset: 48, variant: 'double-struck' },
    { start: 0x1D7E3, len: 10, offset: 48, variant: 'sans-serif' },
    { start: 0x1D7Ec, len: 10, offset: 48, variant: 'sans-serif', style: 'bold' },
    { start: 0x1D7F6, len: 10, offset: 48, variant: 'monospace'},
]


function unicodeToMathVariant(char) {
    let codepoint = char;
    if (typeof char === 'string') codepoint = char.codePointAt(0);
    if ((codepoint < 0x1d400 || codepoint > 0x1d7ff) &&
        (codepoint < 0x2100 || codepoint > 0x214f)) {
            return {char:char};
    }

    // Handle the 'gap' letters by converting them back into their logical range
    for (const c in MATH_LETTER_EXCEPTIONS) {
        if (Object.prototype.hasOwnProperty.call(MATH_LETTER_EXCEPTIONS, c)) {
            if (MATH_LETTER_EXCEPTIONS[c] === codepoint) {
                codepoint = c;
                break;
            }
        }
    }


    for (let i = 0; i < MATH_UNICODE_BLOCKS.length; i++) {
        if (codepoint >= MATH_UNICODE_BLOCKS[i].start &&
            codepoint < MATH_UNICODE_BLOCKS[i].start + MATH_UNICODE_BLOCKS[i].len) {
                return {
                    char: String.fromCodePoint(codepoint - MATH_UNICODE_BLOCKS[i].start + MATH_UNICODE_BLOCKS[i].offset),
                    variant: MATH_UNICODE_BLOCKS[i].variant,
                    style: MATH_UNICODE_BLOCKS[i].style,
                }
        }
    }

    return {char:char};
}

/**
 * Given a character and variant ('bb', 'cal', etc...)
 * return the corresponding unicode character (a string)
 * @param {string} char
 * @param {string} variant
 * @memberof module:definitions
 * @private
 */
function mathVariantToUnicode(char, variant, style) {
    if (!/[A-Za-z0-9]/.test(char)) return char;
    if (!variant && !style) return char;

    const codepoint = char.codePointAt(0);

    for (let i = 0; i < MATH_UNICODE_BLOCKS.length; i++) {
        if (!variant || MATH_UNICODE_BLOCKS[i].variant === variant) {
            if (!style || MATH_UNICODE_BLOCKS[i].style === style) {
                if (codepoint >= MATH_UNICODE_BLOCKS[i].offset &&
                    codepoint < MATH_UNICODE_BLOCKS[i].offset + MATH_UNICODE_BLOCKS[i].len) {
                        const result =
                                MATH_UNICODE_BLOCKS[i].start +
                                codepoint - MATH_UNICODE_BLOCKS[i].offset;
                        return String.fromCodePoint(MATH_LETTER_EXCEPTIONS[result] || result);
                }
            }
        }
    }

    return char;
}



function codepointToLatex(parseMode, cp) {
    // Codepoint shortcuts have priority over variants
    // That is, "\N" vs "\mathbb{N}"
    if (parseMode === 'text') return String.fromCodePoint(cp);

    let result;
    if (CODEPOINT_SHORTCUTS[cp]) return CODEPOINT_SHORTCUTS[cp];
    const v = unicodeToMathVariant(cp);
    if (!v.style && !v.variant) return matchCodepoint(parseMode, cp);
    result = v.char;
    if (v.variant) {
        result = '\\' + v.variant + '{' + result + '}';
    }
    if (v.style === 'bold') {
        result = '\\mathbf{' + result + '}';
    } else if (v.style === 'italic') {
        result = '\\mathit{' + result + '}';
    } else if (v.style === 'bolditalic') {
        result = '\\mathbf{\\mathit{' + result + '}}';
    }
    return '\\mathord{' + result + '}';    
}



function unicodeStringToLatex(parseMode, s) {
    let result = '';
    for (const cp of s) {
        result += codepointToLatex(parseMode, cp.codePointAt(0));
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
function commandAllowed(mode, command) {
    if (FUNCTIONS[command] && (mode !== 'text' || FUNCTIONS[command].allowedInText)) {
        return true;
    }

    if ({'text': TEXT_SYMBOLS, 'math': MATH_SYMBOLS}[mode][command]) {
        return true;
    }

    return false;
}


function getValue(mode, symbol) {
    if (mode === 'math') {
        return MATH_SYMBOLS[symbol] && MATH_SYMBOLS[symbol].value ? 
            MATH_SYMBOLS[symbol].value : symbol;
    }
    return TEXT_SYMBOLS[symbol] ? TEXT_SYMBOLS[symbol] : symbol;
}

function getEnvironmentInfo(name) {
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
 * @param {object} macros A macros dictionary
 * @return {object} An info structure about the symbol, or null
 * @memberof module:definitions
 * @private
 */
function getInfo(symbol, parseMode, macros) {

    if (symbol.length === 0) return null;

    let info = null;

    if (symbol.charAt(0) === '\\') {
        // This could be a function or a symbol
        info = FUNCTIONS[symbol];
        if (info) {
            // We've got a match
            if (parseMode === 'math' || info.allowedInText) return info;

            // That's a valid function, but it's not allowed in non-math mode,
            // and we're in non-math mode
            return null;
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
                    allowedInText: false,
                    params: [],
                    infix: false
                }
                while (argCount >= 1) {
                    info.params.push({
                        optional: false,
                        type: 'math',
                        defaultValue: null,
                        placeholder: null
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
    if (info && info.type === 'mord' && 
        (info.value === 'f' || info.value === 'g' || info.value === 'h')) {
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
function suggest(s) {
    if (s.length <= 1) return [];
    const result = [];

    // Iterate over items in the dictionary
    for (const p in FUNCTIONS) {
        if (Object.prototype.hasOwnProperty.call(FUNCTIONS, p)) {
            if (p.startsWith(s) && !FUNCTIONS[p].infix) {
                result.push({match:p, frequency:FUNCTIONS[p].frequency});
            }
        }
    }

    for (const p in MATH_SYMBOLS) {
        if (Object.prototype.hasOwnProperty.call(MATH_SYMBOLS, p)) {
            if (p.startsWith(s)) {
                result.push({match:p, frequency:MATH_SYMBOLS[p].frequency});
            }
        }
    }

    result.sort( (a, b)  => {
        if (a.frequency === b.frequency) {
            return a.match.length - b.match.length;
        }
        return (b.frequency || 0) - (a.frequency || 0);
    });

    return result;
}

// Fonts
const MAIN = '';            // The "main" KaTeX font (in fact one of several
                            // depending on the math variant, size, etc...)
const AMS = 'ams';          // Some symbols are not in the "main" KaTeX font
                            // or have a different glyph available in the "AMS"
                            // font (`\hbar` and `\hslash` for example).

// Type
const ORD = 'mord';
const MATHORD = 'mord'; // Ordinary, e.g. '/'
const BIN = 'mbin';     // e.g. '+'
const REL = 'mrel';     // e.g. '='
const OPEN = 'mopen';   // e.g. '('
const CLOSE = 'mclose'; // e.g. ')'
const PUNCT = 'mpunct'; // e.g. ','
const INNER = 'minner'; // for fractions and \left...\right.


// const ACCENT = 'accent';
const SPACING = 'spacing';



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
function parseParamTemplateArgument(argTemplate, isOptional) {
    let r = argTemplate.match(/=(.+)/);
    let defaultValue = '{}';
    let type = 'auto';
    let placeholder = null;

    if (r) {
        console.assert(isOptional,
            "Can't provide a default value for required parameters");
        defaultValue = r[1];
    }
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
        placeholder: placeholder
    }
}

function parseParamTemplate(paramTemplate) {
    if (!paramTemplate || paramTemplate.length === 0) return [];

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


function parseArgAsString(arg) {
    return arg.map(x => x.body).join('');
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
function defineEnvironment(names, params, options, parser) {
    if (typeof names === 'string') names = [names];
    if (!options) options = {};
    const parsedParams = parseParamTemplate(params);

    // Set default values of functions
    const data = {
        // 'category' is a global variable keeping track of the
        // the current category being defined. This value is used
        // strictly to group items in generateDocumentation().
        category: category,

        // Params: the parameters for this function, an array of
        // {optional, type, defaultValue, placeholder}
        params: parsedParams,

        // Callback to parse the arguments
        parser: parser,

        mathstyle: 'displaystyle',

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
 * - allowedInText
 * @param {function} parseFunction
 * @memberof module:definitions
 * @private
 */
function defineFunction(names, params, options, parseFunction) {
    if (typeof names === 'string') {
        names = [names];
    }

    if (!options) options = {};

    // Set default values of functions
    const data = {
        // 'category' is a global variable keeping track of the
        // the current category being defined. This value is used
        // strictly to group items in generateDocumentation().
        category: category,

        // The base font family, if present, indicates that this font family 
        // should always be used to render atom. For example, functions such
        // as "sin", etc... are always drawn in a roman font,
        // regardless of the font styling a user may specify.
        baseFontFamily: options.fontFamily,

        // The parameters for this function, an array of
        // {optional, type, defaultValue, placeholder}
        params: parseParamTemplate(params),

        allowedInText: !!options.allowedInText,
        infix: !!options.infix,
        parse: parseFunction
    };
    for (const name of names) {
        FUNCTIONS[name] = data;
    }
}



category = 'Environments';
/*

<columns> ::= <column>*<line>
<column> ::= <line>('l'|'c'|'r')
<line> ::= '|' | '||' | ''

'math',
                frequency 0
'displaymath',
                frequency 8

'equation'      centered, numbered
                frequency 8

'subequations'   with an 'equation' environment, appends a letter to eq no
                frequency 1

'array',        {columns:text}
                cells are textstyle math
                no fence

'eqnarray'      DEPRECATED see http://www.tug.org/pracjourn/2006-4/madsen/madsen.pdf
                {rcl}
                first and last cell in each row is displaystyle math
                each cell has a margin of \arraycolsep
                Each line has a eqno
                frequency 7


'theorem'       text mode. Prepends in bold 'Theorem <counter>', then body in italics.

'multline'      single column
                first row left aligned, last right aligned, others centered
                last line has an eqn. counter. multline* will omit the counter
                no output if inside an equation
                

'gather'        at most two columns
                first column centered, second column right aligned
                frequency 1

'gathered'      must be in equation environment
                single column,
                centered
                frequency: COMMON
                optional argument: [b], [t] to vertical align

'align'        multiple columns,
                alternating rl
                there is some 'space' (additional column?) between each pair
                each line is numbered (except when inside an equation environment)
                there is an implicit {} at the beginning of left columns

'aligned'      must be in equation environment
                frequency: COMMON
                @{}r@{}l@{\quad}@{}r@{}l@{}

'split'         must be in an equation environment,
                two columns, additional columns are interpreted as line breaks
                first column is right aligned, second column is left aligned
                entire construct is numbered (as opposed to 'align' where each line is numbered)
                frequency: 0


'alignedat'
From AMSMath:
---The alignedat environment was changed to take two arguments rather
than one: a mandatory argument (as formerly) specifying the number of
align structures, and a new optional one specifying the placement of the
environment (parallel to the optional argument of aligned). However,
aligned is simpler to use, allowing any number of aligned structures
automatically, and therefore the use of alignedat is deprecated.


 'alignat'      {pairs:number}
                {rl} alternating as many times as indicated by <pairs> arg
                no space between column pairs (unlike align)
                there is an implicit {} at the beginning of left columns
                frequency: 0

 'flalign'      multiple columns
                alternate rl
                third column further away than align...?
                frequency: 0


'matrix'        at most 10 columns
                cells centered
                no fence
                no colsep at beginning or end
                (mathtools package add an optional arg for the cell alignment)
                frequency: COMMON

'pmatrix'       fence: ()
                frequency: COMMON

'bmatrix'       fence: []
                frequency: COMMON

'Bmatrix'       fence: {}
                frequency: 237

'vmatrix'       fence: \vert
                frequency: 368

'Vmatrix'       fence: \Vert
                frequency: 41

'smallmatrix'   displaystyle: scriptstyle (?)
                frequency: 279

'cases'
                frequency: COMMON
                l@{2}l

'center'        text mode only?
                frequency: ?
*/
    // See https://en.wikibooks.org/wiki/LaTeX/Mathematics
    // and http://www.ele.uri.edu/faculty/vetter/Other-stuff/latex/Mathmode.pdf

/*
The star at the end of the name of a displayed math environment causes that
the formula lines won't be numbered. Otherwise they would automatically get a number.

\notag will also turn off the numbering.
\shoveright and \shoveleft will force alignment of a line

The only difference between align and equation is the spacing of the formulas.
You should attempt to use equation when possible, and align when you have multi-line formulas.
Equation will have space before/after < 1em if line before/after is short enough.

Also: equation throws an error when you have an & inside the environment,
so look out for that when converting between the two.



Whereas align produces a structure whose width is the full line width, aligned
gives a width that is the actual width of the contents, thus it can be used as
a component in a containing expression, e.g. for putting the entire alignment
in a parenthesis
*/
defineEnvironment('math', '', {frequency: 0}, function() {
    return { mathstyle: 'textstyle'};
});

defineEnvironment('displaymath', '', {
    frequency: 8,
    }, function() {
    return {
        mathstyle: 'displaystyle',
    };
});

// defineEnvironment('text', '', {
//     frequency: 0,
//     }, function(name, args) {
//     return {
//         mathstyle: 'text',         // @todo: not quite right, not a style, a parsemode...
//     };
// });


defineEnvironment('array', '{columns:colspec}', {
    frequency: COMMON
}, function(name, args) {
    return {
        colFormat: args[0],
        mathstyle: 'textstyle',
    };
});

defineEnvironment('eqnarray', '', {}, function() {
    return {

    };
});

defineEnvironment('equation', '', {}, function() {
    return {
        colFormat: [{ align: 'c'}]
    };
});

defineEnvironment('subequations', '', {}, function() {
    return {
        colFormat: [{ align: 'c'}]
    };
});

// Note spelling: MULTLINE, not multiline.
defineEnvironment('multline', '', {}, function() {
    return {
        firstRowFormat: [{align: 'l'}],
        colFormat: [{align: 'c'}],
        lastRowFormat: [{align: 'r'}],

    };
});

// An AMS-Math environment
// See amsmath.dtx:3565
// Note that some versions of AMS-Math have a gap on the left.
// More recent version suppresses that gap, but have an option to turn it back on
// for backward compatibility.
defineEnvironment(['align', 'aligned'], '', {}, function(name, args, array) {
    let colCount = 0;
    for (const row of array) {
        colCount = Math.max(colCount, row.length);
    }
    const colFormat = [
            { gap:     0, } ,
            { align:   'r', } ,
            { gap:     0, } ,
            { align:   'l', } ,
    ];
    let i = 2;
    while ( i < colCount) {
        colFormat.push({gap:1});
        colFormat.push({align:'r'});
        colFormat.push({gap:0});
        colFormat.push({align:'l'});
        i += 2;
    }
    colFormat.push({gap: 0});

    return {
        colFormat: colFormat,
        jot: 0.3,   // Jot is an extra gap between lines of numbered equation.
                    // It's 3pt by default in LaTeX (ltmath.dtx:181)
    };
});

// defineEnvironment('alignat', '', {}, function(name, args) {
//     return {

//     };
// });

// defineEnvironment('flalign', '', {}, function(name, args) {
//     return {

//     };
// });

defineEnvironment('split', '', {}, function() {
    return {

    };
});


defineEnvironment(['gather', 'gathered'], '', {}, function() {
// An AMS-Math environment
// %    The \env{gathered} environment is for several lines that are
// %    centered independently.
// From amstex.sty
// \newenvironment{gathered}[1][c]{%
//   \relax\ifmmode\else\nonmatherr@{\begin{gathered}}\fi
//   \null\,%
//   \if #1t\vtop \else \if#1b\vbox \else \vcenter \fi\fi
//   \bgroup\Let@\restore@math@cr
//   \ifinany@\else\openup\jot\fi\ialign
//   \bgroup\hfil\strut@$\m@th\displaystyle##$\hfil\crcr

    return {
        colFormat: [{gap:.25}, { align: 'c', }, {gap:0}],
        jot: .3
    };
});

// defineEnvironment('cardinality', '', {}, function() {
//     const result = {};

//     result.mathstyle = 'textstyle';
//     result.lFence = '|';
//     result.rFence = '|';

//     return result;
// });



defineEnvironment(['matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix',
    'Vmatrix', 'smallmatrix', 'matrix*', 'pmatrix*', 'bmatrix*', 'Bmatrix*', 'vmatrix*',
    'Vmatrix*', 'smallmatrix*'], '[columns:colspec]', {}, function(name, args) {
// From amstex.sty:
// \def\matrix{\hskip -\arraycolsep\array{*\c@MaxMatrixCols c}}
// \def\endmatrix{\endarray \hskip -\arraycolsep}
    const result = {};

    result.mathstyle = 'textstyle';

    switch (name) {
        case 'pmatrix':
        case 'pmatrix*':
            result.lFence = '(';
            result.rFence = ')';
            break;

        case 'bmatrix':
        case 'bmatrix*':
            result.lFence = '[';
            result.rFence = ']';
            break;

        case 'Bmatrix':
        case 'Bmatrix*':
            result.lFence = '\\lbrace';
            result.rFence = '\\rbrace';
            break;

        case 'vmatrix':
        case 'vmatrix*':
            result.lFence = '\\vert';
            result.rFence = '\\vert';
            break;

        case 'Vmatrix':
        case 'Vmatrix*':
            result.lFence = '\\Vert';
            result.rFence = '\\Vert';
            break;

        case 'smallmatrix':
        case 'smallmatrix*':
            result.mathstyle = 'scriptstyle';
            break;

        case 'matrix':
        case 'matrix*':
            // Specifying a fence, even a null fence,
            // will prevent the insertion of an initial and final gap
            result.lFence = '.';
            result.rFence = '.';
            break;
        default:
    }

    result.colFormat = args[0] || [{align:'c'}, {align:'c'}, {align:'c'},
        {align:'c'}, {align:'c'}, {align:'c'},
        {align:'c'}, {align:'c'}, {align:'c'},
        {align:'c'}];

    return result;
});




defineEnvironment('cases', '', {}, function() {
// From amstex.sty:
// \def\cases{\left\{\def\arraystretch{1.2}\hskip-\arraycolsep
//   \array{l@{\quad}l}}
// \def\endcases{\endarray\hskip-\arraycolsep\right.}
// From amsmath.dtx
// \def\env@cases{%
//   \let\@ifnextchar\new@ifnextchar
//   \left\lbrace
//   \def\arraystretch{1.2}%
//   \array{@{}l@{\quad}l@{}}%

    return {
        arraystretch: 1.2,
        lFence: '\\lbrace',
        rFence: '.',
        colFormat: [
            { align: 'l', } ,
            { gap: 1, } ,
            { align: 'l', }
        ]
    }
});


defineEnvironment('theorem', '', {}, function() {
    return {

    };
});


defineEnvironment('center', '', {}, function() {
    return {colFormat: [{align:'c'}]};
});



category = '';
// Simple characters allowed in math mode
defineSymbols('0123456789/@.');
defineSymbolRange(0x0041, 0x005A);          // a-z
defineSymbolRange(0x0061, 0x007A);          // A-Z



category = 'Trigonometry';
defineFunction([
    '\\arcsin', '\\arccos', '\\arctan', '\\arctg', '\\arcctg',
    '\\arg', '\\ch', '\\cos', '\\cosec', '\\cosh', '\\cot', '\\cotg',
    '\\coth', '\\csc', '\\ctg', '\\cth',
    '\\sec', '\\sin',
    '\\sinh', '\\sh', '\\tan', '\\tanh', '\\tg', '\\th',],
    '', null, function(name) {
    return {
        type: 'mop',
        limits: 'nolimits',
        symbol: false,
        isFunction: true,
        body: name.slice(1),
        baseFontFamily: 'cmr'
    };
})

frequency(SUPERCOMMON, '\\cos', '\\sin', '\\tan');


frequency(UNCOMMON, '\\arcsin', '\\arccos', '\\arctan', '\\arctg', '\\arcctg',
    '\\arcsec', '\\arccsc');

frequency(UNCOMMON, '\\arsinh', '\\arccosh', '\\arctanh',
    '\\arcsech', '\\arccsch');

frequency(UNCOMMON, '\\arg', '\\ch', '\\cosec', '\\cosh', '\\cot', '\\cotg',
    '\\coth', '\\csc', '\\ctg', '\\cth',
    '\\lg', '\\lb', '\\sec',
    '\\sinh', '\\sh', '\\tanh', '\\tg', '\\th');



category = 'Functions';

defineFunction([
    '\\deg', '\\dim', '\\exp', '\\hom', '\\ker',
    '\\lb', '\\lg', '\\ln', '\\log'],
    '', null, function(name) {
    return {
        type: 'mop',
        limits: 'nolimits',
        symbol: false,
        isFunction: true,
        body: name.slice(1),
        baseFontFamily: 'cmr'
    };
})
frequency(SUPERCOMMON, '\\ln', '\\log', '\\exp');

frequency(292, '\\hom');
frequency(COMMON, '\\dim');
frequency(COMMON, '\\ker', '\\deg');     // >2,000


defineFunction(['\\lim', '\\mod'],
    '', null, function(name) {
    return {
        type: 'mop',
        limits: 'limits',
        symbol: false,
        body: name.slice(1),
        baseFontFamily: 'cmr'
    };
})
defineFunction(['\\det', '\\max', '\\min'],
    '', null, function(name) {
    return {
        type: 'mop',
        limits: 'limits',
        symbol: false,
        isFunction: true,
        body: name.slice(1),
        baseFontFamily: 'cmr'
    };
})
frequency(SUPERCOMMON, '\\lim');
frequency(COMMON, '\\det');
frequency(COMMON, '\\mod');
frequency(COMMON, '\\min');
frequency(COMMON, '\\max');


category = 'Decoration';

// A box of the width and height
defineFunction('\\rule', '[raise:dimen]{width:dimen}{thickness:dimen}', null,
function(name, args) {
    return {
        type: 'rule',
        shift: args[0],
        width: args[1],
        height: args[2],
    };
});

defineFunction('\\color', '{:color}', {allowedInText: true}, (_name, args) => { 
    return { color: args[0] }
});


// From the xcolor package.
// As per xcolor, this command does not set the mode to text 
// (unlike what its name might suggest)
defineFunction('\\textcolor', '{:color}{content:auto*}', {allowedInText: true}, (_name, args) => {
    return { color: args[0] };
});

frequency(3, '\\textcolor');


// An overline
defineFunction('\\overline', '{:auto}', null, function(name, args) {
    return {
        type: 'line',
        position: 'overline',
        skipBoundary: true,
        body: args[0], };
});
    frequency(COMMON, '\\overline');   // > 2,000

defineFunction('\\underline', '{:auto}', null, function(name, args) {
    return { type: 'line', position: 'underline', skipBoundary: true, body: args[0], };
});
    frequency(COMMON, '\\underline');   // > 2,000

defineFunction('\\overset', '{annotation:auto}{symbol:auto}', null, function(name, args) {
    return { type: 'overunder', overscript: args[0], skipBoundary: true, body: args[1]};
});
    frequency(COMMON, '\\overset');   // > 2,000

defineFunction('\\underset', '{annotation:auto}{symbol:auto}', null, function(name, args) {
    return { type: 'overunder', underscript: args[0], skipBoundary: true, body: args[1]};
});
    frequency(COMMON, '\\underset');   // > 2,000

defineFunction(['\\stackrel', '\\stackbin'], '{annotation:auto}{symbol:auto}', null,
    function(name, args) {
    return {
        type: 'overunder',
        overscript: args[0],
        skipBoundary: true,
        body: args[1],
        mathtype: name === '\\stackrel' ? 'mrel' : 'mbin',
    };
});
    frequency(COMMON, '\\stackrel');   // > 2,000
    frequency(0, '\\stackbin');



defineFunction('\\rlap', '{:auto}', null, function(name, args) {
    return { type: 'overlap', align: 'right', skipBoundary: true, body: args[0], };
});
    frequency(270, '\\rlap');

defineFunction('\\llap', '{:auto}', null, function(name, args) {
    return { type: 'overlap', align: 'left', skipBoundary: true, body: args[0], };
});
    frequency(18, '\\llap');

defineFunction('\\mathrlap', '{:auto}', null, function(name, args) {
    return { type: 'overlap', mode: 'math', align: 'right', skipBoundary: true, body: args[0], };
});
    frequency(CRYPTIC, '\\mathrlap');

defineFunction('\\mathllap', '{:auto}', null, function(name, args) {
    return { type: 'overlap', mode: 'math', align: 'left', skipBoundary: true, body: args[0], };
});
    frequency(CRYPTIC, '\\mathllap');




// Can be preceded by e.g. '\fboxsep=4pt' (also \fboxrule)
// Note:
// - \boxed: sets content in displaystyle mode (@todo: should change type of argument)
//      equivalent to \fbox{$$<content>$$}
// - \fbox: sets content in 'auto' mode (frequency 777)
// - \framebox[<width>][<alignment>]{<content>} (<alignment> := 'c'|'t'|'b' (center, top, bottom) (frequency 28)
// @todo
defineFunction('\\boxed', '{content:math}', null,
    function(name, args) {
        return {
            type: 'box',
            framecolor: 'black',
            skipBoundary: true,
            body: args[0]
        }
    }
)
    frequency(1236, '\\boxed');

defineFunction('\\colorbox', '{background-color:color}{content:auto}', {allowedInText: true},
    function(name, args) {
        return {
            type: 'box',
            backgroundcolor: args[0],
            skipBoundary: true,
            body: args[1]
        }
    }
)
    frequency(CRYPTIC, '\\colorbox');



defineFunction('\\fcolorbox', '{frame-color:color}{background-color:color}{content:auto}', {allowedInText: true},
    function(name, args) {
        return {
            type: 'box',
            framecolor: args[0],
            backgroundcolor: args[1],
            skipBoundary: true,
            body: args[2]
        }
    }
)
    frequency(CRYPTIC, '\\fcolorbox');


// \bbox, MathJax extension
// The first argument is a CSS border property shorthand, e.g.
// \bbox[red], \bbox[5px,border:2px solid red]
// The MathJax syntax is
// arglist ::= <arg>[,<arg>[,<arg>]]
// arg ::= [<background:color>|<padding:dimen>|<style>]
// style ::= 'border:' <string>

defineFunction('\\bbox', '[:bbox]{body:auto}', {allowedInText: true},
    function(name, args) {
        if (args[0]) {
            return {
                type: 'box',
                padding: args[0].padding,
                border: args[0].border,
                backgroundcolor: args[0].backgroundcolor,
                skipBoundary: true,
                body: args[1]
            }
        }
        return {
            type: 'box',
            skipBoundary: true,
            body: args[1]
        }
    }
)
    frequency(CRYPTIC, '\\bbox');


// \enclose, a MathJax extension mapping to the MathML `menclose` tag.
// The first argument is a comma delimited list of notations, as defined
// here: https://developer.mozilla.org/en-US/docs/Web/MathML/Element/menclose
// The second, optional, specifies the style to use for the notations.
defineFunction('\\enclose', '{notation:string}[style:string]{body:auto}', null,
    function(name, args) {
        let notations =  args[0] || [];
        const result = {
            type: 'enclose',
            strokeColor: 'currentColor',
            strokeWidth: 1,
            strokeStyle: 'solid',
            backgroundcolor: 'transparent',
            padding: 'auto',
            shadow: 'auto',
            captureSelection: true,     // Do not let children be selected
            body: args[2]
        }

        // Extract info from style string
        if (args[1]) {
            // Split the string by comma delimited sub-strings, ignoring commas
            // that may be inside (). For example"x, rgb(a, b, c)" would return
            // ['x', 'rgb(a, b, c)']
            const styles = args[1].split(/,(?![^(]*\)(?:(?:[^(]*\)){2})*[^"]*$)/);
            for (const s of styles) {
                const shorthand = s.match(/\s*(\S+)\s+(\S+)\s+(.*)/);
                if (shorthand) {
                    result.strokeWidth = FontMetrics.toPx(shorthand[1], 'px');
                    if (!isFinite(result.strokeWidth)) {
                        result.strokeWidth = 1;
                    }
                    result.strokeStyle = shorthand[2];
                    result.strokeColor = shorthand[3];
                } else {
                    const attribute = s.match(/\s*([a-z]*)\s*=\s*"(.*)"/);
                    if (attribute) {
                        if (attribute[1] === 'mathbackground') {
                            result.backgroundcolor = attribute[2];
                        } else if (attribute[1] === 'mathcolor') {
                            result.strokeColor = attribute[2];
                        } else if (attribute[1] === 'padding') {
                            result.padding = FontMetrics.toPx(attribute[2], 'px');
                        } else if (attribute[1] === 'shadow') {
                            result.shadow = attribute[2];
                        }
                    }
                }
            }
            if (result.strokeStyle === 'dashed') {
                result.svgStrokeStyle = '5,5';
            } else if (result.strokeStyle === 'dotted') {
                result.svgStrokeStyle = '1,5';
            }
        }
        result.borderStyle = result.strokeWidth + 'px ' +
            result.strokeStyle + ' ' + result.strokeColor;

        // Normalize the list of notations.
        notations = notations.toString().split(/[, ]/).
            filter(v => v.length > 0).map(v => v.toLowerCase());
        result.notation = {};
        for (const notation of notations) {
            result.notation[notation] = true;
        }
        if (result.notation['updiagonalarrow']) result.notation['updiagonalstrike'] = false;
        if (result.notation['box']) {
            result.notation['left'] = false;
            result.notation['right'] = false;
            result.notation['bottom'] = false;
            result.notation['top'] = false;
        }
        return result;
    }
)

    frequency(CRYPTIC, '\\enclose');

defineFunction('\\cancel', '{body:auto}', null,
    function(name, args) {
        return {
            type: 'enclose',
            strokeColor: 'currentColor',
            strokeWidth: 1,
            strokeStyle: 'solid',
            borderStyle: '1px solid currentColor',
            backgroundcolor: 'transparent',
            padding: 'auto',
            shadow: 'auto',
            notation: {"updiagonalstrike": true},
            body: args[0]
        }
    }
)

defineFunction('\\bcancel', '{body:auto}', null,
    function(name, args) {
        return {
            type: 'enclose',
            strokeColor: 'currentColor',
            strokeWidth: 1,
            strokeStyle: 'solid',
            borderStyle: '1px solid currentColor',
            backgroundcolor: 'transparent',
            padding: 'auto',
            shadow: 'auto',
            notation: {"downdiagonalstrike": true},
            body: args[0]
        }
    }
)

defineFunction('\\xcancel', '{body:auto}', null,
    function(name, args) {
        return {
            type: 'enclose',
            strokeColor: 'currentColor',
            strokeWidth: 1,
            strokeStyle: 'solid',
            borderStyle: '1px solid currentColor',
            backgroundcolor: 'transparent',
            padding: 'auto',
            shadow: 'auto',
            notation: {"updiagonalstrike": true, "downdiagonalstrike": true},
            body: args[0]
        }
    }
)

    frequency(CRYPTIC, '\\cancel', '\\bcancel', '\\xcancel');






category = 'Styling';

// Size
defineFunction([
    '\\tiny', '\\scriptsize', '\\footnotesize', '\\small',
    '\\normalsize',
    '\\large', '\\Large', '\\LARGE', '\\huge', '\\Huge'
], '', {allowedInText: true},
    function(name, _args) {
        return {
            fontSize: {
                'tiny': 'size1',
                'scriptsize': 'size2',
                'footnotesize': 'size3',
                'small': 'size4',
                'normalsize': 'size5',
                'large': 'size6',
                'Large': 'size7',
                'LARGE': 'size8',
                'huge': 'size9',
                'Huge': 'size10'
            }[name.slice(1)]
        }
    }
)


// SERIES: weight
defineFunction('\\fontseries', '{:text}', {allowedInText: true}, (_name, args) => {
    return { fontSeries: parseArgAsString(args[0]) }
});

defineFunction('\\bf', '', {allowedInText: true}, (_name, _args) => {
    return { fontSeries: 'b' }
});

defineFunction('\\bm', '{:math*}', {allowedInText: true}, (_name, _args) => {
    return { fontSeries: 'b' }
});

// Note: switches to math mode
defineFunction('\\bold', '', {allowedInText: true}, (_name, _args) => {
    return { mode: 'math', fontSeries: 'b' }
});

defineFunction(['\\mathbf', '\\boldsymbol'], '{:math*}', {allowedInText: true}, (_name, _args) => {
    return { mode: 'math', fontSeries: 'b', fontShape: 'n' }
});

defineFunction('\\bfseries', '', {allowedInText: true}, (_name, _args) => {
    return { fontSeries: 'b' }
});

defineFunction('\\textbf', '{:text*}', {allowedInText: true}, (_name, _args) => {
    return { fontSeries: 'b' }
});

defineFunction('\\mathmd', '{:math*}', {allowedInText: true}, (_name, _args) => {
    return { mode: 'math', fontSeries: 'm', fontShape: 'n' }
});

defineFunction('\\mdseries', '', {allowedInText: true}, (_name, _args) => {
    return { fontSeries: 'm' }
});

defineFunction('\\textmd', '{:math*}', {allowedInText: true}, (_name, _args) => {
    return { fontSeries: 'm' }
});

// @todo \textlf

// SHAPE: italic, small caps
defineFunction('\\fontshape', '{:text}', {allowedInText: true}, (_name, args) => {
    return { fontShape: parseArgAsString(args[0]) }
});

defineFunction('\\it', '', {allowedInText: true}, (_name, _args) => {
    return { fontShape: 'it' }
});

defineFunction('\\mathit', '{:math*}', {allowedInText: true}, (_name, _args) => {
    return { mode: 'math', fontSeries: 'm', fontShape: 'it' }
});

defineFunction('\\upshape', '', {allowedInText: true}, (_name, _args) => {
    return { fontShape: 'n' }
});

defineFunction('\\textup', '{:text*}', {allowedInText: true}, (_name, _args) => {
    return { fontShape: 'n' }
});

defineFunction('\\textit', '{:text*}', {allowedInText: true}, (_name, _args) => {
    return { fontShape: 'it' }
});

defineFunction('\\slshape', '', {allowedInText: true}, (_name, _args) => {
    return { fontShape: 'sl' }
});

defineFunction('\\textsl', '{:text*}', {allowedInText: true}, (_name, _args) => {
    return { fontShape: 'sl' }
});

// Small caps (switches to text mode)
defineFunction('\\scshape', '', {allowedInText: true}, (_name, _args) => {
    return { mode: 'text', fontShape: 'sc' }
});

defineFunction('\\textsc', '{:text*}', {allowedInText: true}, (_name, _args) => {
    return { fontShape: 'sc' }
});


// FONT FAMILY: Fraktur, Calligraphic, ...

defineFunction('\\fontfamily', '{:text}', {allowedInText: true}, (_name, args) => {
    return { fontFamily: parseArgAsString(args[0]) }
});

defineFunction('\\mathrm', '{:math*}', {allowedInText: true}, (_name, _args) => {
    return { mode: 'math', fontFamily: 'cmr', fontSeries: 'm', fontShape: 'n' }
});

defineFunction('\\rmfamily', '', {allowedInText: true}, (_name, _args) => {
    return { fontFamily: 'cmr' }
});

defineFunction('\\textrm', '{:text*}', {allowedInText: true}, (_name, _args) => {
    return { fontFamily: 'cmr' }
});

defineFunction('\\mathsf', '{:math*}', {allowedInText: true}, (_name, _args) => {
    return { mode:'math', baseFontFamily: 'cmss', fontSeries: 'm', fontShape: 'n' }
});

defineFunction('\\sffamily', '', {allowedInText: true}, (_name, _args) => {
    return { fontFamily: 'cmss' }
});

defineFunction('\\textsf', '{:text*}', {allowedInText: true}, (_name, _args) => {
    return { fontFamily: 'cmss' }
});

defineFunction('\\mathtt', '{:math*}', {allowedInText: true}, (_name, _args) => {
    return { mode:'math', baseFontFamily: 'cmtt', fontSeries: 'm', fontShape: 'n' }
});

defineFunction('\\ttfamily', '', {allowedInText: true}, (_name, _args) => {
    return { fontFamily: 'cmtt' }
});

defineFunction('\\texttt', '{:text*}', {allowedInText: true}, (_name, _args) => {
    return { fontFamily: 'cmtt' }
});

defineFunction(['\\Bbb', '\\mathbb'], '{:math*}', {allowedInText: true}, (_name, _args) => {
    return { mode:'math', baseFontFamily: 'bb' }
});

defineFunction(['\\frak', '\\mathfrak'], '{:math*}', {allowedInText: true}, (_name, _args) => {
    return { baseFontFamily: 'frak' }
});

defineFunction('\\mathcal', '{:math*}', {allowedInText: true}, (_name, _args) => {
    return { mode:'math', baseFontFamily: 'cal', fontSeries: 'm', fontShape: 'n' }
});

defineFunction('\\mathscr', '{:math*}', {allowedInText: true}, (_name, _args) => {
    return { mode:'math', baseFontFamily: 'scr', fontSeries: 'm', fontShape: 'n' }
});



    frequency(SUPERCOMMON, '\\mathbb');
    frequency(1081, '\\Bbb');
    frequency(0, '\\mathcal');
    frequency(COMMON, '\\mathfrak');
    frequency(271, '\\frak');
    frequency(COMMON, '\\mathscr');
    frequency(UNCOMMON, '\\mathsf');
    frequency(COMMON, '\\mathtt');
    frequency(COMMON, '\\boldsymbol');

    // frequency(780, '\\tt');


// @todo: family could be 'none' or 'default'
// "normal" font of the body text, not necessarily roman
defineFunction('\\textnormal', '{:text*}', {allowedInText: true}, (_name, _args) => {
    return { fontFamily: 'cmr', fontShape: 'n', fontSeries: 'n' }
});


// Rough synomym for \text{}
/*
An \mbox within math mode does not use the current math font; rather it uses 
the typeface of the surrounding running text.
*/
defineFunction('\\mbox', '{:text*}', null, (_name, _args) => {
    return { fontFamily: 'cmr' }
});



defineFunction('\\text', '{:text*}', {allowedInText: true}, (_name, _args) => {
    return { }
});


/* A MathJax extension: assign a class to the element */
defineFunction('\\class', '{name:text}{content:auto*}', {allowedInText: true}, (_name, args) => {
    return { cssClass: parseArgAsString(args[0]) }
});

/* A MathJax extension: assign an ID to the element */
defineFunction('\\cssId', '{id:text}{content:auto}', {allowedInText: true}, (_name, args) => {
    return { cssId: parseArgAsString(args[0]), body: args[1], type: 'group' }
});

/* Note: in TeX, \em is restricted to text mode. We extend it to math */
defineFunction('\\em', '', {allowedInText: true}, (_name, _args) => {
    return { cssClass: 'ML__emph', type: 'group' }
});

/* Note: in TeX, \emph is restricted to text mode. We extend it to math */
defineFunction('\\emph', '{:auto}', {allowedInText: true}, (_name, args) => {
    return { cssClass: 'ML__emph', body: args[0], type: 'group', skipBoundary: true }
});



frequency(COMMON, '\\textrm');
frequency(COMMON, '\\textit');
frequency(COMMON, '\\textsf');
frequency(COMMON, '\\texttt');
frequency(433, '\\textnormal');
frequency(COMMON, '\\textbf');
frequency(421, '\\textup');
frequency(819, '\\emph');
frequency(49, '\\em');


category = 'Operators';

// Root
defineFunction('\\sqrt', '[index:auto]{radicand:auto}', null,
function(name, args) {
    return {
        type: 'surd',
        body: args[1],
        index: args[0]
    };
});
frequency(SUPERCOMMON, '\\sqrt');

category = 'Fractions';
// Fractions
defineFunction([
    '\\frac', '\\dfrac', '\\tfrac',
    '\\cfrac',
    '\\binom', '\\dbinom', '\\tbinom'
], '{numerator}{denominator}', null, function(name, args) {
    const result = {
        type: 'genfrac',
        numer: args[0],
        denom: args[1],
        mathstyle: 'auto'
    };

    switch (name) {
        case '\\dfrac':
        case '\\frac':
        case '\\tfrac':
        case '\\cfrac':
            result.hasBarLine = true;
            break;
        case '\\\\atopfrac':
            result.hasBarLine = false;
            break;
        case '\\dbinom':
        case '\\binom':
        case '\\tbinom':
            result.hasBarLine = false;
            result.leftDelim = '(';
            result.rightDelim = ')';
            break;
    }

    switch (name) {
        case '\\dfrac':
        case '\\dbinom':
            result.mathstyle = 'displaystyle';
            break;
        case '\\tfrac':
        case '\\tbinom':
            result.mathstyle = 'textstyle';
            break;
    }

    if (name === '\\cfrac') {
        result.continuousFraction = true;
    }

    return result;

});

/* \\substack: frequency 16 */

/*
\over = \above 0.4pt
\atop = \above 0pt
\choose = \atopwithdelims()
*/
// infix commands:
// {above}\atop{below} --> \genfrac{}{}{0pt}{above}{below}
// {above}\atopwithdelims{leftdelim}{rightdelim}{below} --> \genfrac{leftdelim}{rightdelim}{0pt}{0/1/2/3}{above}{below}
//  Note: 0/1/2/3 -> displaystyle, textstyle, scriptstyle, scriptscriptstyle
// \atopwithdelimiters
// a\above 0.5pt b               -->
// \abovewithdelims
// \choose              --> \binom
    // \choose = \atopwithdelims()          INFIX
    // \def\brack{\atopwithdelims[]}        INFIX
    // \def\brace{\atopwithdelims\{\}}      INFIX

// '\\above', /* {dim} 122 */
// '\\overwithdelims' /* {leftdelim}{rightdelim} w/ barline 15 */,
// '\\atopwithdelims' /* {leftdelim}{rightdelim} no barline 0 */,
// '\\atop' /* nodelims, no barline 0 */,
// '\\brack', '\\brace' like \choose, but
//      with braces and brackets fences. 0 usage in latexsearch */

defineFunction([
    '\\over' /* 21 */ ,
    '\\atop' /* 12 */,
    '\\choose' /* 1968 */
], '', {infix: true},
        function(name, args) {
    const numer = args[0];
    const denom = args[1];
    let hasBarLine = false;
    let leftDelim = null;
    let rightDelim = null;

    switch (name) {
        case '\\atop':
            break;
        case '\\over':
            hasBarLine = true;
            break;
        case '\\choose':
            hasBarLine = false;
            leftDelim = '(';
            rightDelim = ')';
            break;
        default:
            throw new Error('Unrecognized genfrac command');
    }
    return {
        type: 'genfrac',
        numer: numer,
        denom: denom,
        hasBarLine: hasBarLine,
        leftDelim: leftDelim,
        rightDelim: rightDelim,
        mathstyle: 'auto'
    };
});
    frequency(21, '\\over');
    frequency(12, '\\atop');
    frequency(1968, '\\choose');

defineFunction([
    '\\overwithdelims' /* 21 */ ,
    '\\atopwithdelims' /* COMMON */,

], '{left-delim:delim}{right-delim:delim}', {infix: true},
        function(name, args) {
    return {
        type: 'genfrac',
        numer: args[0],
        denom: args[1],
        hasBarLine: false,
        leftDelim: args[2],
        rightDelim: args[3],
        mathstyle: 'auto'
    };
});
    frequency(15, '\\overwithdelims');
    frequency(COMMON, '\\atopwithdelims');

// frequency(COMMON, '\\frac');
// frequency(UNCOMMON, '\\binom');
// frequency(RARE, '\\dfrac', '\\tfrac', '\\dbinom', '\\tbinom');


// Slashed package
/*
defineFunction('\\slashed'
*/

category = 'Fractions';
defineFunction('\\pdiff', '{numerator}{denominator}' , null, function(_funcname, args) {
    return {
        type: 'genfrac',
        numer: args[0],
        denom: args[1],
        numerPrefix: '\u2202',
        denomPrefix: '\u2202',
        hasBarLine: true,
        leftDelim: null,
        rightDelim: null,
        mathstyle: 'auto'
    };
})

// frequency(RARE, '\\pdiff');



// Quantifiers
category = 'Quantifiers';
defineSymbol( '\\forall',  MAIN,  MATHORD, '\u2200', SUPERCOMMON);
defineSymbol( '\\exists',  MAIN,  MATHORD, '\u2203', SUPERCOMMON);
defineSymbol( '\\nexists',  AMS,  MATHORD, '\u2204', SUPERCOMMON);
defineSymbol( '\\mid',  MAIN,  REL, '\u2223', COMMON);
defineSymbol( '\\top',  MAIN,  MATHORD, '\u22a4', RARE);
defineSymbol( '\\bot',  MAIN,  MATHORD, '\u22a5', RARE);


category = 'Variable Sized Symbols'

// Limits, symbols
defineFunction([
    '\\sum', '\\prod', '\\bigcup', '\\bigcap',
    '\\coprod', '\\bigvee', '\\bigwedge', '\\biguplus',
    '\\bigotimes',
    '\\bigoplus', '\\bigodot', '\\bigsqcup', '\\smallint', '\\intop',
],  '', null, function(name) {
    return {
        type: 'mop',
        limits: 'auto',
        symbol: true,
        baseFontFamily: 'cmr',
        body: {
            'coprod': '\u2210',
            'bigvee': '\u22c1',
            'bigwedge': '\u22c0',
            'biguplus': '\u2a04',
            'bigcap': '\u22c2',
            'bigcup': '\u22c3',
            'intop': '\u222b',
            'prod': '\u220f',
            'sum': '\u2211',
            'bigotimes': '\u2a02',
            'bigoplus': '\u2a01',
            'bigodot': '\u2a00',
            'bigsqcup': '\u2a06',
            'smallint': '\u222b',
            }[name.slice(1)],
    };
});

// No limits, symbols
defineFunction(['\\int', '\\iint', '\\iiint', '\\oint', '\\oiint',
    '\\oiiint', '\\intclockwise', '\\varointclockwise',
    '\\ointctrclockwise', '\\intctrclockwise'
], '', null, function(name) {
    return {
        type: 'mop',
        limits: 'nolimits',
        symbol: true,
        body: {
            'int': '\u222b',
            'iint': '\u222c',
            'iiint': '\u222d',
            'oint': '\u222e',
            'oiint': '\u222f',
            'oiiint': '\u2230',
            'intclockwise': '\u2231',
            'varointclockwise': '\u2232',
            'ointctrclockwise': '\u2233',
            'intctrclockwise': '\u2a11',
            }[name.slice(1)],
    };
});



frequency(SUPERCOMMON, '\\sum', '\\prod', '\\bigcap', '\\bigcup', '\\int');

frequency(COMMON, '\\bigoplus', '\\smallint', '\\iint', '\\oint');
frequency(RARE, '\\bigwedge', '\\bigvee');


frequency(756, '\\coprod');

frequency(723, '\\bigsqcup');
frequency(1241, '\\bigotimes');
frequency(150, '\\bigodot');
frequency(174, '\\biguplus');

frequency(878,  '\\iiint');

frequency(97,  '\\intop');


// Misc Symbols
category = 'Various';
defineSymbol( '\\sharp',  MAIN,  MATHORD, '\u266f', COMMON); // >2,000
defineSymbol( '\\flat',  MAIN,  MATHORD, '\u266d', 590);
defineSymbol( '\\natural',  MAIN,  MATHORD, '\u266e', 278);
defineSymbol( '\\#',  MAIN,  MATHORD, '\u0023', RARE);
defineSymbol( '\\&',  MAIN,  MATHORD, '\u0026', RARE);
defineSymbol( '\\clubsuit',  MAIN,  MATHORD, '\u2663', 172);
defineSymbol( '\\heartsuit',  MAIN,  MATHORD, '\u2661', ARCANE);
defineSymbol( '\\spadesuit',  MAIN,  MATHORD, '\u2660', ARCANE);
defineSymbol( '\\diamondsuit',  MAIN,  MATHORD, '\u2662', CRYPTIC);


// defineSymbol( '\\cross',  MAIN,  MATHORD, '\uF4A0'); // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\transpose',  MAIN,  MATHORD, '\uF3C7'); // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\conjugate', 'conj'],  MAIN,  MATHORD, '\uF3C8'); // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\conjugatetranspose',  MAIN,  MATHORD, '\uF3C9'); // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\hermitianconjugate',  MAIN,  MATHORD, '\uF3CE'); // NOTE: not a real TeX symbol, but Mathematica
defineSymbol( '\\differencedelta',  MAIN,  REL, '\u2206', COMMON);

category = 'Letters and Letter Like Forms';

defineFunction('\\unicode', '{charcode:number}', null,
function(name, args) {
    let codepoint = parseInt(args[0]);
    if (!isFinite(codepoint)) codepoint = 0x2753; // BLACK QUESTION MARK
    return {
        type: 'mord',
        body: String.fromCodePoint(codepoint)
    }
});
defineSymbol( '\\backslash',  MAIN,  MATHORD, '\\');

defineSymbol( '?',  MAIN,  MATHORD, '?');
defineSymbol( '!',  MAIN,  MATHORD, '!');

defineSymbol( '\\nabla',  MAIN,  MATHORD, '\u2207', SUPERCOMMON);
defineSymbol( '\\partial',  MAIN,  MATHORD, '\u2202', SUPERCOMMON); // >2,000

defineSymbol( '\\ell',  MAIN,  MATHORD, '\u2113', COMMON); // >2,000
defineSymbol( '\\imaginaryI',  MAIN,  MATHORD, 'i'); // NOTE: not a real TeX symbol, but Mathematica
// NOTE: set in math as per ISO 80000-2:2009.
defineSymbol( '\\imaginaryJ',  MAIN,  MATHORD, 'j'); // NOTE: not a real TeX symbol, but Mathematica
// NOTE: set in math as per ISO 80000-2:2009.

defineFunction(['\\Re', '\\Im'],
    '', null, function(name) {
    return {
        type: 'mop',
        limits: 'nolimits',
        symbol: false,
        isFunction: true,
        body: {'\\Re': '\u211c', '\\Im': '\u2111'}[name],
        baseFontFamily: 'frak'
    };
})


defineSymbol( '\\hbar',  MAIN,  MATHORD, '\u210f', COMMON); // >2,000
defineSymbol( '\\hslash',  AMS,  MATHORD, '\u210f', COMMON); // >2,000

defineSymbol( '\\differentialD',  'cmr',  MATHORD, 'd'); // NOTE: not a real TeX symbol, but Mathematica
defineSymbol( '\\rd',  'cmr',  MATHORD, 'd'); // NOTE: not a real TeX symbol, but used in ProofWiki
// NOTE: set in math as per ISO 80000-2:2009.
defineSymbol( '\\capitalDifferentialD',  'cmr',  MATHORD, 'D'); // NOTE: not a real TeX symbol, but Mathematica
// NOTE: set in math as per ISO 80000-2:2009.
defineSymbol( '\\rD',  'cmr',  MATHORD, 'D'); // NOTE: not a real TeX symbol
defineSymbol( '\\exponentialE',  'cmr',  MATHORD, 'e'); // NOTE: not a real TeX symbol, but Mathematica
// NOTE: set in math as per ISO 80000-2:2009.


defineSymbol( '\\Finv',  AMS,  MATHORD, '\u2132', 3);
defineSymbol( '\\Game',  AMS,  MATHORD, '\u2141', 1);

defineSymbol( '\\wp',  MAIN,  MATHORD, '\u2118', 1306);
defineSymbol( '\\eth',  AMS,  MATHORD, '\u00f0', 77);

defineSymbol( '\\mho',  AMS,  MATHORD, '\u2127', 138);

defineSymbol( '\\Bbbk',  AMS,  MATHORD, '\u006b');
defineSymbol( '\\doubleStruckCapitalN',  'bb',  MATHORD, 'N');    // NOTE: Not TeX?
defineSymbol( '\\N',  'bb',  MATHORD, 'N');    // NOTE: Check if standard Latex
defineSymbol( '\\doubleStruckCapitalR',  'bb',  MATHORD, 'R');    // NOTE: Not TeX?
defineSymbol( '\\R',  'bb',  MATHORD, 'R');    // NOTE: Check if standard Latex
defineSymbol( '\\doubleStruckCapitalQ',  'bb',  MATHORD, 'Q');    // NOTE: Not TeX?
defineSymbol( '\\Q',  'bb',  MATHORD, 'Q');    // NOTE: Check if standard Latex
defineSymbol( '\\doubleStruckCapitalC',  'bb',  MATHORD, 'C');    // NOTE: Not TeX?
defineSymbol( '\\C',  'bb',  MATHORD, 'C');    // NOTE: Check if standard Latex
defineSymbol( '\\doubleStruckCapitalZ',  'bb',  MATHORD, 'Z');    // NOTE: Not TeX?
defineSymbol( '\\Z',  'bb',  MATHORD, 'Z');    // NOTE: Check if standard Latex
defineSymbol( '\\doubleStruckCapitalP',  'bb',  MATHORD, 'P');    // NOTE: Not TeX?
defineSymbol( '\\P',  'bb',  MATHORD, 'P');    // NOTE: Check if standard Latex

defineSymbol( '\\scriptCapitalE',  'scr',  MATHORD, 'E');    // NOTE: Not TeX?
defineSymbol( '\\scriptCapitalH',  'scr',  MATHORD, 'H');    // NOTE: Not TeX?
defineSymbol( '\\scriptCapitalL',  'scr',  MATHORD, 'L');    // NOTE: Not TeX?

defineSymbol( '\\gothicCapitalC',  'frak',  MATHORD, 'C');    // NOTE: Not TeX?
defineSymbol( '\\gothicCapitalH',  'frak',  MATHORD, 'H');    // NOTE: Not TeX?
defineSymbol( '\\gothicCapitalI',  'frak',  MATHORD, 'I');    // NOTE: Not TeX?
defineSymbol( '\\gothicCapitalR',  'frak',  MATHORD, 'R');    // NOTE: Not TeX?


defineSymbol( '\\pounds',  MAIN,  MATHORD, '\u00a3', 509);
defineSymbol( '\\yen',  AMS,  MATHORD, '\u00a5', 57);
defineSymbol( '\\euro',  MAIN,  MATHORD, '\u20AC', 4); // NOTE: not TeX built-in, but textcomp package




// TODO Koppa, Stigma, Sampi


// Math and Text

category = 'Crosses';
defineSymbol( '\\textdagger',  MAIN,  BIN, '\u2020');
defineSymbol( '\\dagger',  MAIN,  BIN, '\u2020', COMMON);         // >2000
defineSymbol( '\\dag',  MAIN,  BIN, '\u2020', COMMON);        // >2000 results
defineSymbol( '\\ddag',  MAIN,  BIN, '\u2021', 500);    // 500 results in latexsearch
defineSymbol( '\\textdaggerdbl',  MAIN,  BIN, '\u2021');
defineSymbol( '\\ddagger',  MAIN,  BIN, '\u2021', 353);        // 353 results in latexsearch
defineSymbol( '\\maltese',  AMS,  MATHORD, '\u2720', 24);



// Arrow Symbols
category = 'Arrows';

defineSymbol( '\\longrightarrow',  MAIN,  REL, '\u27f6', SUPERCOMMON);    // >2,000
defineSymbol( '\\rightarrow',  MAIN,  REL, '\u2192', SUPERCOMMON);     // >2,000
defineSymbol( '\\Longrightarrow',  MAIN,  REL, '\u27f9', SUPERCOMMON);         // See \\implies
defineSymbol( '\\Rightarrow',  MAIN,  REL, '\u21d2', SUPERCOMMON);    // >2,000

defineSymbol( '\\longmapsto',  MAIN,  REL, '\u27fc', COMMON);    // >2,000
defineSymbol( '\\mapsto',  MAIN,  REL, '\u21a6', COMMON);    // >2,000

defineSymbol( '\\Longleftrightarrow',  MAIN,  REL, '\u27fa', COMMON);    // >2,000

defineSymbol( '\\rightleftarrows',  AMS,  REL, '\u21c4', COMMON);    // >2,000

defineSymbol( '\\leftarrow',  MAIN,  REL, '\u2190', COMMON);     // >2,000

defineSymbol( '\\curvearrowleft',  AMS,  REL, '\u21b6', COMMON);    // >2,000

defineSymbol( '\\uparrow',  MAIN,  REL, '\u2191', COMMON);    // >2,000
defineSymbol( '\\downarrow',  MAIN,  REL, '\u2193', COMMON);  // >2,000

defineSymbol( '\\hookrightarrow',  MAIN,  REL, '\u21aa', COMMON);         // >2,000
defineSymbol( '\\rightharpoonup',  MAIN,  REL, '\u21c0', COMMON);         // >2,000
defineSymbol( '\\rightleftharpoons',  MAIN,  REL, '\u21cc', COMMON);         // >2,000

defineSymbol( '\\Leftarrow',  MAIN,  REL, '\u21d0', 1695);
defineSymbol( '\\longleftrightarrow',  MAIN,  REL, '\u27f7', 1599);
defineSymbol( '\\longleftarrow',  MAIN,  REL, '\u27f5', 878);
defineSymbol( '\\Longleftarrow',  MAIN,  REL, '\u27f8', 296);

defineSymbol( '\\searrow',  MAIN,  REL, '\u2198', 1609);
defineSymbol( '\\nearrow',  MAIN,  REL, '\u2197', 1301);
defineSymbol( '\\swarrow',  MAIN,  REL, '\u2199', 167);
defineSymbol( '\\nwarrow',  MAIN,  REL, '\u2196', 108);

defineSymbol( '\\Uparrow',  MAIN,  REL, '\u21d1', 257);
defineSymbol( '\\Downarrow',  MAIN,  REL, '\u21d3', 556);
defineSymbol( '\\updownarrow',  MAIN,  REL, '\u2195', 192);
defineSymbol( '\\Updownarrow',  MAIN,  REL, '\u21d5', 161);

defineSymbol( '\\hookleftarrow',  MAIN,  REL, '\u21a9', 115);
defineSymbol( '\\leftharpoonup',  MAIN,  REL, '\u21bc', 93);
defineSymbol( '\\leftharpoondown',  MAIN,  REL, '\u21bd', 42);
defineSymbol( '\\rightharpoondown',  MAIN,  REL, '\u21c1', 80);

defineSymbol( '\\leftrightarrows',  AMS,  REL, '\u21c6', 765);

defineSymbol( '\\dashrightarrow',  AMS,  REL, '\u21e2', 311);
defineSymbol( '\\dashleftarrow',  AMS,  REL, '\u21e0', 5);
defineSymbol( '\\leftleftarrows',  AMS,  REL, '\u21c7', 8);
defineSymbol( '\\Lleftarrow',  AMS,  REL, '\u21da', 7);
defineSymbol( '\\twoheadleftarrow',  AMS,  REL, '\u219e', 32);
defineSymbol( '\\leftarrowtail',  AMS,  REL, '\u21a2', 25);
defineSymbol( '\\looparrowleft',  AMS,  REL, '\u21ab', 6);
defineSymbol( '\\leftrightharpoons',  AMS,  REL, '\u21cb', 205);
defineSymbol( '\\circlearrowleft',  AMS,  REL, '\u21ba', 105);
defineSymbol( '\\Lsh',  AMS,  REL, '\u21b0', 11);
defineSymbol( '\\upuparrows',  AMS,  REL, '\u21c8', 15);
defineSymbol( '\\downharpoonleft',  AMS,  REL, '\u21c3', 21);
defineSymbol( '\\multimap',  AMS,  REL, '\u22b8', 108);
defineSymbol( '\\leftrightsquigarrow',  AMS,  REL, '\u21ad', 31);
defineSymbol( '\\twoheadrightarrow',  AMS,  REL, '\u21a0', 835);
defineSymbol( '\\rightarrowtail',  AMS,  REL, '\u21a3', 195);
defineSymbol( '\\looparrowright',  AMS,  REL, '\u21ac', 37);
defineSymbol( '\\curvearrowright',  AMS,  REL, '\u21b7', 209);
defineSymbol( '\\circlearrowright',  AMS,  REL, '\u21bb', 63);
defineSymbol( '\\Rsh',  AMS,  REL, '\u21b1', 18);
defineSymbol( '\\downdownarrows',  AMS,  REL, '\u21ca', 6);
defineSymbol( '\\upharpoonright',  AMS,  REL, '\u21be', 579);
defineSymbol( '\\downharpoonright',  AMS,  REL, '\u21c2', 39);
defineSymbol( '\\rightsquigarrow',  AMS,  REL, '\u21dd', 674);
defineSymbol( '\\leadsto',  AMS,  REL, '\u21dd', 709);
defineSymbol( '\\Rrightarrow',  AMS,  REL, '\u21db', 62);
defineSymbol( '\\restriction',  AMS,  REL, '\u21be', 29);
defineSymbol( '\\upharpoonleft',  AMS,  REL, '\u21bf', CRYPTIC);
defineSymbol( '\\rightrightarrows',  AMS,  REL, '\u21c9', CRYPTIC);

// AMS Negated Arrows
category = 'Negated Arrows';
defineSymbol( '\\nrightarrow',  AMS,  REL, '\u219b', 324);
defineSymbol( '\\nRightarrow',  AMS,  REL, '\u21cf', 107);
defineSymbol( '\\nleftrightarrow',  AMS,  REL, '\u21ae', 36);
defineSymbol( '\\nLeftrightarrow',  AMS,  REL, '\u21ce', 20);
defineSymbol( '\\nleftarrow',  AMS,  REL, '\u219a', 7);
defineSymbol( '\\nLeftarrow',  AMS,  REL, '\u21cd', 5);

// AMS Negated Binary Relations
category = 'Negated Relations';
defineSymbol( '\\nless',  AMS,  REL, '\u226e', 146);
defineSymbol( '\\nleqslant',  AMS,  REL, '\ue010', 58);
defineSymbol( '\\lneq',  AMS,  REL, '\u2a87', 54);
defineSymbol( '\\lneqq',  AMS,  REL, '\u2268', 36);
defineSymbol( '\\nleqq',  AMS,  REL, '\ue011', 18);

defineSymbol( '\\unlhd',  AMS,  BIN, '\u22b4', 253);
defineSymbol( '\\unrhd',  AMS,  BIN, '\u22b5', 66);

defineSymbol( '\\lvertneqq',  AMS,  REL, '\ue00c', 6);
defineSymbol( '\\lnsim',  AMS,  REL, '\u22e6', 4);
defineSymbol( '\\lnapprox',  AMS,  REL, '\u2a89', CRYPTIC);
defineSymbol( '\\nprec',  AMS,  REL, '\u2280', 71);
defineSymbol( '\\npreceq',  AMS,  REL, '\u22e0', 57);
defineSymbol( '\\precnsim',  AMS,  REL, '\u22e8', 4);
defineSymbol( '\\precnapprox',  AMS,  REL, '\u2ab9', 2);
defineSymbol( '\\nsim',  AMS,  REL, '\u2241', 40);
defineSymbol( '\\nshortmid',  AMS,  REL, '\ue006', 1);
defineSymbol( '\\nmid',  AMS,  REL, '\u2224', 417);
defineSymbol( '\\nvdash',  AMS,  REL, '\u22ac', 266);
defineSymbol( '\\nvDash',  AMS,  REL, '\u22ad', 405);
defineSymbol( '\\ngtr',  AMS,  REL, '\u226f', 90);
defineSymbol( '\\ngeqslant',  AMS,  REL, '\ue00f', 23);
defineSymbol( '\\ngeqq',  AMS,  REL, '\ue00e', 12);
defineSymbol( '\\gneq',  AMS,  REL, '\u2a88', 29);
defineSymbol( '\\gneqq',  AMS,  REL, '\u2269', 35);
defineSymbol( '\\gvertneqq',  AMS,  REL, '\ue00d', 6);
defineSymbol( '\\gnsim',  AMS,  REL, '\u22e7', 3);
defineSymbol( '\\gnapprox',  AMS,  REL, '\u2a8a', CRYPTIC);
defineSymbol( '\\nsucc',  AMS,  REL, '\u2281', 44);
defineSymbol( '\\nsucceq',  AMS,  REL, '\u22e1', CRYPTIC);
defineSymbol( '\\succnsim',  AMS,  REL, '\u22e9', 4);
defineSymbol( '\\succnapprox',  AMS,  REL, '\u2aba', CRYPTIC);
defineSymbol( '\\ncong',  AMS,  REL, '\u2246', 128);
defineSymbol( '\\nshortparallel',  AMS,  REL, '\ue007', 6);
defineSymbol( '\\nparallel',  AMS,  REL, '\u2226', 54);
defineSymbol( '\\nVDash',  AMS,  REL, '\u22af', 5);
defineSymbol( '\\nsupseteqq',  AMS,  REL, '\ue018', 1);
defineSymbol( '\\supsetneq',  AMS,  REL, '\u228b', 286);
defineSymbol( '\\varsupsetneq',  AMS,  REL, '\ue01b', 2);
defineSymbol( '\\supsetneqq',  AMS,  REL, '\u2acc', 49);
defineSymbol( '\\varsupsetneqq',  AMS,  REL, '\ue019', 3);
defineSymbol( '\\nVdash',  AMS,  REL, '\u22ae', 179);
defineSymbol( '\\precneqq',  AMS,  REL, '\u2ab5', 11);
defineSymbol( '\\succneqq',  AMS,  REL, '\u2ab6', 3);
defineSymbol( '\\nsubseteqq',  AMS,  REL, '\ue016', 16);


// AMS Misc
category = 'Various';
defineSymbol( '\\checkmark',  AMS,  MATHORD, '\u2713', 1025);

defineSymbol( '\\diagup',  AMS,  MATHORD, '\u2571', 440);
defineSymbol( '\\diagdown',  AMS,  MATHORD, '\u2572', 175);

defineSymbol( '\\measuredangle',  AMS,  MATHORD, '\u2221', 271);
defineSymbol( '\\sphericalangle',  AMS,  MATHORD, '\u2222', 156);

defineSymbol( '\\backprime',  AMS,  MATHORD, '\u2035', 104);
defineSymbol( '\\backdoubleprime',  AMS,  MATHORD, '\u2036', CRYPTIC);

category = 'Shapes';
defineSymbol( '\\ast',  MAIN,  BIN, '\u2217', SUPERCOMMON);        // >2,000
defineSymbol( '\\star',  MAIN,  BIN, '\u22c6', COMMON);       // >2,000
defineSymbol( '\\diamond',  MAIN,  BIN, '\u22c4', 1356);
defineSymbol( '\\Diamond',  AMS,  MATHORD, '\u25ca', 695);
defineSymbol( '\\lozenge',  AMS,  MATHORD, '\u25ca', 422);
defineSymbol( '\\blacklozenge',  AMS,  MATHORD, '\u29eb', 344);
defineSymbol( '\\bigstar',  AMS,  MATHORD, '\u2605', 168);

// AMS Hebrew
category = 'Hebrew';
defineSymbol( '\\aleph',  MAIN,  MATHORD, '\u2135', 1381);
defineSymbol( '\\beth',  AMS,  MATHORD, '\u2136', 54);
defineSymbol( '\\daleth',  AMS,  MATHORD, '\u2138', 43);
defineSymbol( '\\gimel',  AMS,  MATHORD, '\u2137', 36);


// AMS Delimiters
category = 'Fences';

defineSymbol( '\\lbrace',  MAIN,  OPEN, '{', SUPERCOMMON);    // >2,000
defineSymbol( '\\rbrace',  MAIN,  CLOSE, '}', SUPERCOMMON);    // >2,000
defineSymbol( '\\langle',  MAIN,  OPEN, '\u27e8', COMMON);    // >2,000
defineSymbol( '\\rangle',  MAIN,  CLOSE, '\u27e9', COMMON);
defineSymbol( '\\lfloor',  MAIN,  OPEN, '\u230a', COMMON);    // >2,000
defineSymbol( '\\rfloor',  MAIN,  CLOSE, '\u230b',COMMON);    // >2,000
defineSymbol( '\\lceil',  MAIN,  OPEN, '\u2308', COMMON);    // >2,000
defineSymbol( '\\rceil',  MAIN,  CLOSE, '\u2309', COMMON);  // >2,000

defineSymbol( '\\vert',  MAIN,  MATHORD, '\u2223', SUPERCOMMON);    // >2,000
defineSymbol( '\\mvert',  MAIN,  REL, '\u2223');
defineSymbol( '\\lvert',  MAIN,  OPEN, '\u2223', 496);
defineSymbol( '\\rvert',  MAIN,  CLOSE, '\u2223', 496);
defineSymbol( '\\|',  MAIN,  MATHORD, '\u2225');
defineSymbol( '\\Vert',  MAIN,  MATHORD, '\u2225', SUPERCOMMON);    // >2,000
defineSymbol( '\\mVert',  MAIN,  MATHORD, '\u2225');
defineSymbol( '\\lVert',  MAIN,  OPEN, '\u2225', 287);
defineSymbol( '\\rVert',  MAIN,  CLOSE, '\u2225', CRYPTIC);

defineSymbol( '\\lbrack',  MAIN,  OPEN, '[', 574);
defineSymbol( '\\rbrack',  MAIN,  CLOSE, ']', 213);
defineSymbol( '\\{',  MAIN,  OPEN, '{');
defineSymbol( '\\}',  MAIN,  CLOSE, '}');


defineSymbol( '(',  MAIN,  OPEN, '(');
defineSymbol( ')',  MAIN,  CLOSE, ')');
defineSymbol( '[',  MAIN,  OPEN, '[');
defineSymbol( ']',  MAIN,  CLOSE, ']');

defineSymbol( '\\ulcorner',  AMS,  OPEN, '\u250c', 296);
defineSymbol( '\\urcorner',  AMS,  CLOSE, '\u2510', 310);
defineSymbol( '\\llcorner',  AMS,  OPEN, '\u2514', 137);
defineSymbol( '\\lrcorner',  AMS,  CLOSE, '\u2518', 199);

// Large Delimiters

defineSymbol( '\\lgroup',  MAIN,  OPEN, '\u27ee', 24);
defineSymbol( '\\rgroup',  MAIN,  CLOSE, '\u27ef', 24);
defineSymbol( '\\lmoustache',  MAIN,  OPEN, '\u23b0', CRYPTIC);
defineSymbol( '\\rmoustache',  MAIN,  CLOSE, '\u23b1', CRYPTIC);

defineFunction(['\\middle'], '{:delim}', null, function(name, args) {
    return {type: 'delim', delim: args[0]};
});


category = 'Sizing';

// Extra data needed for the delimiter parse function down below
const delimiterSizes = {
    '\\bigl' : {mclass: 'mopen',    size: 1},
    '\\Bigl' : {mclass: 'mopen',    size: 2},
    '\\biggl': {mclass: 'mopen',    size: 3},
    '\\Biggl': {mclass: 'mopen',    size: 4},
    '\\bigr' : {mclass: 'mclose',   size: 1},
    '\\Bigr' : {mclass: 'mclose',   size: 2},
    '\\biggr': {mclass: 'mclose',   size: 3},
    '\\Biggr': {mclass: 'mclose',   size: 4},
    '\\bigm' : {mclass: 'mrel',     size: 1},
    '\\Bigm' : {mclass: 'mrel',     size: 2},
    '\\biggm': {mclass: 'mrel',     size: 3},
    '\\Biggm': {mclass: 'mrel',     size: 4},
    '\\big'  : {mclass: 'mord',     size: 1},
    '\\Big'  : {mclass: 'mord',     size: 2},
    '\\bigg' : {mclass: 'mord',     size: 3},
    '\\Bigg' : {mclass: 'mord',     size: 4},
};


defineFunction([
    '\\bigl', '\\Bigl', '\\biggl', '\\Biggl',
    '\\bigr', '\\Bigr', '\\biggr', '\\Biggr',
    '\\bigm', '\\Bigm', '\\biggm', '\\Biggm',
    '\\big',  '\\Big',  '\\bigg',  '\\Bigg',
], '{:delim}', null, function(name, args) {

    return {
        type: 'sizeddelim',
        size: delimiterSizes[name].size,
        cls: delimiterSizes[name].mclass,
        delim: args[0],
    };
});



// Relations
category = 'Relations';
defineSymbol( '=',  MAIN,  REL, '=', SUPERCOMMON);
defineSymbol( '\\ne',  MAIN,  REL, '\u2260', SUPERCOMMON);     // >2,000
defineSymbol( '\\neq',  MAIN,  REL, '\u2260', COMMON);     // >2,000
// defineSymbol( '\\longequal',  MAIN,  REL, '\uF7D9');   // NOTE: Not TeXematica

defineSymbol( '<',  MAIN,  REL, '<', SUPERCOMMON);     // >2,000
defineSymbol( '\\lt',  MAIN,  REL, '<', COMMON);     // >2,000
defineSymbol( '>',  MAIN,  REL, '>', SUPERCOMMON);     // >2,000
defineSymbol( '\\gt',  MAIN,  REL, '>', COMMON);     // >2,000

defineSymbol( '\\le',  MAIN,  REL, '\u2264', COMMON);     // >2,000
defineSymbol( '\\ge',  MAIN,  REL, '\u2265', COMMON);     // >2,000

defineSymbol( '\\leqslant',  AMS,  REL, '\u2a7d', SUPERCOMMON);              // > 2,000
defineSymbol( '\\geqslant',  AMS,  REL, '\u2a7e', SUPERCOMMON);              // > 2,000

defineSymbol( '\\leq',  MAIN,  REL, '\u2264', COMMON);     // >2,000
defineSymbol( '\\geq',  MAIN,  REL, '\u2265', COMMON);     // >2,000

defineSymbol( '\\ll',  MAIN,  REL, '\u226a');
defineSymbol( '\\gg',  MAIN,  REL, '\u226b', COMMON);   // >2,000
defineSymbol( '\\coloneq',  MAIN,  REL, '\u2254', 5);
defineSymbol( '\\measeq',  MAIN,  REL, '\u225D');     // MEASSURED BY
defineSymbol( '\\eqdef',  MAIN,  REL, '\u225E');
defineSymbol( '\\questeq',  MAIN,  REL, '\u225F');    // QUESTIONED EQUAL TO


defineSymbol( ':',  MAIN,  REL, ':');
defineSymbol( '\\cong',  MAIN,  REL, '\u2245', COMMON);     // >2,000

defineSymbol( '\\equiv',  MAIN,  REL, '\u2261', COMMON);     // >2,000

defineSymbol( '\\prec',  MAIN,  REL, '\u227a', COMMON);   // >2,000
defineSymbol( '\\preceq',  MAIN,  REL, '\u2aaf', COMMON); // >2,000
defineSymbol( '\\succ',  MAIN,  REL, '\u227b', COMMON);     // >2,000
defineSymbol( '\\succeq',  MAIN,  REL, '\u2ab0', 1916);

defineSymbol( '\\perp',  MAIN,  REL, '\u22a5', COMMON);              // > 2,000
defineSymbol( '\\parallel',  MAIN,  REL, '\u2225', COMMON);   // >2,000

defineSymbol( '\\propto',  MAIN,  REL, '\u221d', COMMON);              // > 2,000
defineSymbol( '\\Colon',  MAIN,  REL, '\u2237');

defineSymbol( '\\smile',  MAIN,  REL, '\u2323', COMMON);              // > 2,000
defineSymbol( '\\frown',  MAIN,  REL, '\u2322', COMMON);              // > 2,000



defineSymbol( '\\sim',  MAIN,  REL, '\u223c', COMMON);   // >2,000
defineSymbol( '\\gtrsim',  AMS,  REL, '\u2273', COMMON);   // >2,000


defineSymbol( '\\approx',  MAIN,  REL, '\u2248', SUPERCOMMON);     // >2,000

defineSymbol( '\\approxeq',  AMS,  REL, '\u224a', 147);
defineSymbol( '\\thickapprox',  AMS,  REL, '\u2248', 377);
defineSymbol( '\\lessapprox',  AMS,  REL, '\u2a85', 146);
defineSymbol( '\\gtrapprox',  AMS,  REL, '\u2a86', 95);
defineSymbol( '\\precapprox',  AMS,  REL, '\u2ab7', 50);
defineSymbol( '\\succapprox',  AMS,  REL, '\u2ab8', CRYPTIC);


defineSymbol( '\\thicksim',  AMS,  REL, '\u223c', 779);
defineSymbol( '\\succsim',  AMS,  REL, '\u227f', 251);
defineSymbol( '\\precsim',  AMS,  REL, '\u227e', 104);
defineSymbol( '\\backsim',  AMS,  REL, '\u223d', 251);
defineSymbol( '\\eqsim',  AMS,  REL, '\u2242', 62);
defineSymbol( '\\backsimeq',  AMS,  REL, '\u22cd', 91);
defineSymbol( '\\simeq',  MAIN,  REL, '\u2243', CRYPTIC);
defineSymbol( '\\lesssim',  AMS,  REL, '\u2272', CRYPTIC);

defineSymbol( '\\nleq',  AMS,  REL, '\u2270', 369);
defineSymbol( '\\ngeq',  AMS,  REL, '\u2271', 164);

defineSymbol( '\\smallsmile',  AMS,  REL, '\u2323', 31);
defineSymbol( '\\smallfrown',  AMS,  REL, '\u2322', 71);
defineSymbol( '\\bowtie',  MAIN,  REL, '\u22c8', 558);

defineSymbol( '\\asymp',  MAIN,  REL, '\u224d', 755);

defineSymbol( '\\sqsubseteq',  MAIN,  REL, '\u2291', 1255);
defineSymbol( '\\sqsupseteq',  MAIN,  REL, '\u2292', 183);


defineSymbol( '\\leqq',  AMS,  REL, '\u2266', 1356);
defineSymbol( '\\eqslantless',  AMS,  REL, '\u2a95', 15);

defineSymbol( '\\lll',  AMS,  REL, '\u22d8', 157);
defineSymbol( '\\lessgtr',  AMS,  REL, '\u2276', 281);
defineSymbol( '\\lesseqgtr',  AMS,  REL, '\u22da', 134);
defineSymbol( '\\lesseqqgtr',  AMS,  REL, '\u2a8b', CRYPTIC);
defineSymbol( '\\risingdotseq',  AMS,  REL, '\u2253', 8);
defineSymbol( '\\fallingdotseq',  AMS,  REL, '\u2252', 99);
defineSymbol( '\\subseteqq',  AMS,  REL, '\u2ac5', 82);
defineSymbol( '\\Subset',  AMS,  REL, '\u22d0');
defineSymbol( '\\sqsubset',  AMS,  REL, '\u228f', 309);
defineSymbol( '\\preccurlyeq',  AMS,  REL, '\u227c', 549);
defineSymbol( '\\curlyeqprec',  AMS,  REL, '\u22de', 14);
defineSymbol( '\\vDash',  AMS,  REL, '\u22a8', 646);
defineSymbol( '\\Vvdash',  AMS,  REL, '\u22aa', 20);
defineSymbol( '\\bumpeq',  AMS,  REL, '\u224f', 13);
defineSymbol( '\\Bumpeq',  AMS,  REL, '\u224e', 12);
defineSymbol( '\\geqq',  AMS,  REL, '\u2267', 972);
defineSymbol( '\\eqslantgtr',  AMS,  REL, '\u2a96', 13);
defineSymbol( '\\ggg',  AMS,  REL, '\u22d9', 127);
defineSymbol( '\\gtrless',  AMS,  REL, '\u2277', 417);
defineSymbol( '\\gtreqless',  AMS,  REL, '\u22db', 190);
defineSymbol( '\\gtreqqless',  AMS,  REL, '\u2a8c', 91);

defineSymbol( '\\supseteqq',  AMS,  REL, '\u2ac6', 6);
defineSymbol( '\\Supset',  AMS,  REL, '\u22d1', 34);
defineSymbol( '\\sqsupset',  AMS,  REL, '\u2290', 71);
defineSymbol( '\\succcurlyeq',  AMS,  REL, '\u227d', 442);
defineSymbol( '\\curlyeqsucc',  AMS,  REL, '\u22df', 10);
defineSymbol( '\\Vdash',  AMS,  REL, '\u22a9', 276);
defineSymbol( '\\shortmid',  AMS,  REL, '\u2223', 67);
defineSymbol( '\\shortparallel',  AMS,  REL, '\u2225', 17);
defineSymbol( '\\between',  AMS,  REL, '\u226c', 110);
defineSymbol( '\\pitchfork',  AMS,  REL, '\u22d4', 66);
defineSymbol( '\\varpropto',  AMS,  REL, '\u221d', 203);
defineSymbol( '\\backepsilon',  AMS,  REL, '\u220d', 176);
defineSymbol( '\\llless',  AMS,  REL, '\u22d8', CRYPTIC);
defineSymbol( '\\gggtr',  AMS,  REL, '\u22d9', CRYPTIC);
defineSymbol( '\\lhd',  AMS,  BIN, '\u22b2', 447);
defineSymbol( '\\rhd',  AMS,  BIN, '\u22b3', 338);
defineSymbol( '\\Join',  MAIN,  REL, '\u22c8', 35);

defineSymbol( '\\doteq',  MAIN,  REL, '\u2250', 1450);
defineSymbol( '\\doteqdot',  AMS,  REL, '\u2251', 60);
defineSymbol( '\\Doteq',  AMS,  REL, '\u2251', CRYPTIC);
defineSymbol( '\\eqcirc',  AMS,  REL, '\u2256', 6);
defineSymbol( '\\circeq',  AMS,  REL, '\u2257', 31);
defineSymbol( '\\lessdot',  AMS,  BIN, '\u22d6', 88);
defineSymbol( '\\gtrdot',  AMS,  BIN, '\u22d7', 45);

// In TeX, '~' is a spacing command (non-breaking space). 
// However, '~' is used as an ASCII Math shortctut character, so define a \\~
// command which maps to the '~' character
defineSymbol( '\\~',  MAIN,  REL, '~');


category = 'Logic';
defineSymbol( '\\leftrightarrow',  MAIN,  REL, '\u2194', SUPERCOMMON);    // >2,000
defineSymbol( '\\Leftrightarrow',  MAIN,  REL, '\u21d4', SUPERCOMMON);    // >2,000
// defineSymbol( '\\iff',  MAIN,  REL, '\\;\u27fa\\;', SUPERCOMMON);        // >2,000 Note: additional spaces around the arrows
defineSymbol( '\\to',  MAIN,  REL, '\u2192', SUPERCOMMON);    // >2,000
defineSymbol( '\\models',  MAIN,  REL, '\u22a8', COMMON);    // >2,000
defineSymbol( '\\vdash',  MAIN,  REL, '\u22a2', COMMON);    // >2,000

defineSymbol( '\\therefore',  AMS,  REL, '\u2234', 1129);
defineSymbol( '\\because',  AMS,  REL, '\u2235', 388);
defineSymbol( '\\implies',  MAIN,  REL, '\u27f9', 1858);
defineSymbol( '\\gets',  MAIN,  REL, '\u2190', 150);
defineSymbol( '\\dashv',  MAIN,  REL, '\u22a3', 299);
defineSymbol( '\\impliedby',  MAIN,  REL, '\u27f8', CRYPTIC);
defineSymbol( '\\biconditional',  MAIN,  REL, '\u27f7', CRYPTIC);
defineSymbol( '\\roundimplies',  MAIN,  REL, '\u2970', CRYPTIC);

// AMS Binary Operators
category = 'Operators';
defineSymbol( '+',  MAIN,  BIN, '+', SUPERCOMMON); // > 2,000
defineSymbol( '-',  MAIN,  BIN, '\u2212', SUPERCOMMON); // > 2,000
defineSymbol( '\u2212',  MAIN,  BIN, '\u2212', SUPERCOMMON); // > 2,000
defineSymbol( '\\pm',  MAIN,  BIN, '\u00b1', COMMON); // > 2,000
defineSymbol( '\\mp',  MAIN,  BIN, '\u2213', COMMON); // > 2,000
defineSymbol( '*',  MAIN,  BIN, '\u2217', COMMON); // > 2,000
defineSymbol( '\\times',  MAIN,  BIN, '\u00d7', COMMON); // > 2,000
defineSymbol( '\\div',  MAIN,  BIN, '\u00f7', COMMON); // > 2,000
defineSymbol( '\\surd',  MAIN,  MATHORD, '\u221a', COMMON); // > 2,000

defineSymbol( '\\divides',  MAIN,  BIN, '\u2223', CRYPTIC);
    // From MnSymbol package


defineSymbol( '\\ltimes',  AMS,  BIN, '\u22c9', 576);
defineSymbol( '\\rtimes',  AMS,  BIN, '\u22ca', 946);
defineSymbol( '\\leftthreetimes',  AMS,  BIN, '\u22cb', 34);
defineSymbol( '\\rightthreetimes',  AMS,  BIN, '\u22cc', 14);
defineSymbol( '\\intercal',  AMS,  BIN, '\u22ba', 478);
defineSymbol( '\\dotplus',  AMS,  BIN, '\u2214', 81);
defineSymbol( '\\centerdot',  AMS,  BIN, '\u22c5', 271);
defineSymbol( '\\doublebarwedge',  AMS,  BIN, '\u2a5e', 5);
defineSymbol( '\\divideontimes',  AMS,  BIN, '\u22c7', 51);
defineSymbol( '\\cdot',  MAIN,  BIN, '\u22c5', CRYPTIC);


category = 'Others';
defineSymbol( '\\infty',  MAIN,  MATHORD, '\u221e', SUPERCOMMON);    // >2,000
defineSymbol( '\\prime',  MAIN,  ORD, '\u2032', SUPERCOMMON);    // >2,000
defineSymbol( '\\doubleprime',  MAIN,  MATHORD, '\u2033');   // NOTE: Not in TeX, but Mathematica
defineSymbol( '\\angle',  MAIN,  MATHORD, '\u2220', COMMON);    // >2,000
defineSymbol( '`',  MAIN,  MATHORD, '\u2018');
defineSymbol( '\\$',  MAIN,  MATHORD, '$');
defineSymbol( '\\%',  MAIN,  MATHORD, '%');
defineSymbol( '\\_',  MAIN,  MATHORD, '_');

category = 'Greek';
// Note: In TeX, greek symbols are only available in Math mode
defineSymbol( '\\alpha',  MAIN,  ORD, '\u03b1', COMMON);    // >2,000
defineSymbol( '\\beta',  MAIN,  ORD, '\u03b2', COMMON);    // >2,000
defineSymbol( '\\gamma',  MAIN,  ORD, '\u03b3', COMMON);    // >2,000
defineSymbol( '\\delta',  MAIN,  ORD, '\u03b4', COMMON);    // >2,000
defineSymbol( '\\epsilon',  MAIN,  ORD, '\u03f5', COMMON);    // >2,000
defineSymbol( '\\varepsilon',  MAIN,  ORD, '\u03b5');
defineSymbol( '\\zeta',  MAIN,  ORD, '\u03b6', COMMON);    // >2,000
defineSymbol( '\\eta',  MAIN,  ORD, '\u03b7', COMMON);    // >2,000
defineSymbol( '\\theta',  MAIN,  ORD, '\u03b8', COMMON);    // >2,000
defineSymbol( '\\vartheta',  MAIN,  ORD, '\u03d1', COMMON);    // >2,000
defineSymbol( '\\iota',  MAIN,  ORD, '\u03b9', COMMON);    // >2,000
defineSymbol( '\\kappa',  MAIN,  ORD, '\u03ba', COMMON);    // >2,000
defineSymbol( '\\varkappa',  AMS,  ORD, '\u03f0', COMMON);    // >2,000
defineSymbol( '\\lambda',  MAIN,  ORD, '\u03bb', COMMON);    // >2,000
defineSymbol( '\\mu',  MAIN,  ORD, '\u03bc', COMMON);    // >2,000
defineSymbol( '\\nu',  MAIN,  ORD, '\u03bd', COMMON);    // >2,000
defineSymbol( '\\xi',  MAIN,  ORD, '\u03be', COMMON);    // >2,000
defineSymbol( '\\omicron',  MAIN,  ORD, 'o');
defineSymbol( '\\pi',  MAIN,  ORD, '\u03c0', COMMON);    // >2,000
defineSymbol( '\\varpi',  MAIN,  ORD, '\u03d6', COMMON);    // >2,000
defineSymbol( '\\rho',  MAIN,  ORD, '\u03c1', COMMON);    // >2,000
defineSymbol( '\\varrho',  MAIN,  ORD, '\u03f1', COMMON);    // >2,000
defineSymbol( '\\sigma',  MAIN,  ORD, '\u03c3', COMMON);    // >2,000
defineSymbol( '\\varsigma',  MAIN,  ORD, '\u03c2', COMMON);    // >2,000
defineSymbol( '\\tau',  MAIN,  ORD, '\u03c4', COMMON);    // >2,000
defineSymbol( '\\phi',  MAIN,  ORD, '\u03d5', COMMON);    // >2,000
defineSymbol( '\\varphi',  MAIN,  ORD, '\u03c6', COMMON);    // >2,000
defineSymbol( '\\upsilon',  MAIN,  ORD, '\u03c5', COMMON);    // >2,000
defineSymbol( '\\chi',  MAIN,  ORD, '\u03c7', COMMON);    // >2,000
defineSymbol( '\\psi',  MAIN,  ORD, '\u03c8', COMMON);    // >2,000
defineSymbol( '\\omega',  MAIN,  ORD, '\u03c9', COMMON);    // >2,000

defineSymbol( '\\Gamma',  MAIN,  ORD, '\u0393', COMMON);    // >2,000
defineSymbol( '\\Delta',  MAIN,  ORD, '\u0394', COMMON);    // >2,000
defineSymbol( '\\Theta',  MAIN,  ORD, '\u0398', COMMON);    // >2,000
defineSymbol( '\\Lambda',  MAIN,  ORD, '\u039b', COMMON);    // >2,000
defineSymbol( '\\Xi',  MAIN,  ORD, '\u039e', COMMON);    // >2,000
defineSymbol( '\\Pi',  MAIN,  ORD, '\u03a0', COMMON);    // >2,000
defineSymbol( '\\Sigma',  MAIN,  ORD, '\u03a3', COMMON);    // >2,000
defineSymbol( '\\Upsilon',  MAIN,  ORD, '\u03a5', COMMON);    // >2,000
defineSymbol( '\\Phi',  MAIN,  ORD, '\u03a6', COMMON);    // >2,000
defineSymbol( '\\Psi',  MAIN,  ORD, '\u03a8', COMMON);    // >2,000
defineSymbol( '\\Omega',  MAIN,  ORD, '\u03a9', COMMON);    // >2,000

// AMS Greek
defineSymbol( '\\digamma',  AMS,  ORD, '\u03dd', 248);

category = 'Others';
defineSymbol( '\\emptyset',  MAIN,  MATHORD, '\u2205', SUPERCOMMON);    // >2,000
defineSymbol( '\\varnothing',  AMS,  MATHORD, '\u2205', SUPERCOMMON);    // >2,000



category = 'Set Operators';
defineSymbol( '\\cap',  MAIN,  BIN, '\u2229', SUPERCOMMON);
defineSymbol( '\\cup',  MAIN,  BIN, '\u222a', SUPERCOMMON);
defineSymbol( '\\setminus',  MAIN,  BIN, '\u2216', COMMON);    // >2,000
defineSymbol( '\\smallsetminus',  AMS,  BIN, '\u2216', 254);
defineSymbol( '\\complement',  AMS,  MATHORD, '\u2201', 200);

category = 'Set Relations';
defineSymbol( '\\in',  MAIN,  REL, '\u2208', SUPERCOMMON);    // >2,000
defineSymbol( '\\notin',  MAIN,  REL, '\u2209', SUPERCOMMON);    // >2,000
defineSymbol( '\\not',  MAIN,  REL, '\u0338', COMMON);
defineSymbol( '\\ni',  MAIN,  REL, '\u220b', COMMON);    // >2,000
defineSymbol( '\\owns',  MAIN,  REL, '\u220b', 18);
defineSymbol( '\\subset',  MAIN,  REL, '\u2282', SUPERCOMMON);    // >2,000
defineSymbol( '\\supset',  MAIN,  REL, '\u2283', SUPERCOMMON);    // >2,000
defineSymbol( '\\subseteq',  MAIN,  REL, '\u2286', SUPERCOMMON);    // >2,000
defineSymbol( '\\supseteq',  MAIN,  REL, '\u2287', SUPERCOMMON);    // >2,000
defineSymbol( '\\subsetneq',  AMS,  REL, '\u228a', 1945);
defineSymbol( '\\varsubsetneq',  AMS,  REL, '\ue01a', 198);
defineSymbol( '\\subsetneqq',  AMS,  REL, '\u2acb', 314);
defineSymbol( '\\varsubsetneqq',  AMS,  REL, '\ue017', 55);
defineSymbol( '\\nsubset',  AMS,  REL, '\u2284', CRYPTIC);    // NOTE: Not TeX?
defineSymbol( '\\nsupset',  AMS,  REL, '\u2285', CRYPTIC);    // NOTE: Not TeX?
defineSymbol( '\\nsubseteq',  AMS,  REL, '\u2288', 950);
defineSymbol( '\\nsupseteq',  AMS,  REL, '\u2289', 49);


category = 'Spacing';
// See http://tex.stackexchange.com/questions/41476/lengths-and-when-to-use-them
defineSymbol( '\\ ',  MAIN,  SPACING, '\u00a0');
defineSymbol( '~',  MAIN,  SPACING, '\u00a0');
defineSymbol( '\\space',  MAIN,  SPACING, '\u00a0');

defineSymbol( '\\!',  MAIN,  SPACING, null);
defineSymbol( '\\,', MAIN,  SPACING,  null);
defineSymbol( '\\:',  MAIN,  SPACING, null);
defineSymbol( '\\;',  MAIN,  SPACING, null);
defineSymbol( '\\enskip',  MAIN,  SPACING, null);
// \enspace is a TeX command (not LaTeX) equivalent to a \skip
defineSymbol( '\\enspace',  MAIN,  SPACING, null, 672);
defineSymbol( '\\quad',  MAIN,  SPACING, null, COMMON);    // >2,000
defineSymbol( '\\qquad',  MAIN,  SPACING, null, COMMON);    // >2,000

defineFunction([
    '\\hspace', '\\hspace*'
    // \hspace* inserts a non-breakable space, but since we don't line break...
    // it's the same as \hspace.
], '{width:skip}', {allowedInText: true}, function(_name, args) {
    return {
        type: 'spacing',
        width: args[0] || 0
    }
});


/**
 * If possible, i.e. if they are all simple atoms, return a string made up of
 * their body
 * @param {object[]} atoms
 * @memberof module:definitions
 * @private
 */
function getSimpleString(atoms) {
    let result = '';
    let success = true;
    for (const atom of atoms) {
        if (typeof atom.body === 'string') {
            result += atom.body;
        } else {
            success = false;
        }
    } 
    return success ? result : '';
}

defineFunction([
    '\\mathop', '\\mathbin', '\\mathrel', '\\mathopen',
    '\\mathclose', '\\mathpunct', '\\mathord', '\\mathinner'
], '{:auto}', null, function(name, args) {
    const result = {
        type: {
            '\\mathop': 'mop',
            '\\mathbin': 'mbin',
            '\\mathrel': 'mrel',
            '\\mathopen': 'mopen',
            '\\mathclose': 'mclose',
            '\\mathpunct': 'mpunct',
            '\\mathord': 'mord',
            '\\mathinner': 'minner'
        }[name],
        body: getSimpleString(args[0]) || args[0],
        captureSelection: true,     // Do not let children be selected
        baseFontFamily: name === '\\mathop' ? 'math' : ''
    };
    if (name === '\\mathop') {
        result.limits = 'nolimits';
        result.isFunction = true;
    }
    return result;
})

defineFunction([
    '\\operatorname', '\\operatorname*'
], '{operator:string}', null, function(name, args) {
    const result = {
        type: 'mop',
        skipBoundary: true,
        body: args[0],
        isFunction: true,
        baseFontFamily: 'cmr'
    };

    if (name === '\\operatorname') {
        result.limits = 'nolimits'
    } else if (name === '\\operatorname*') {
        result.limits = 'limits';
    }

    return result;
})


// Punctuation
category = 'Punctuation';
defineSymbol( '\\colon',  MAIN,  PUNCT, ':', COMMON);    // >2,000
defineSymbol( '\\cdotp',  MAIN,  PUNCT, '\u22c5', COMMON); // >2,000
defineSymbol( '\\ldots',  MAIN,  INNER, '\u2026', COMMON);    // >2,000
defineSymbol( '\\cdots',  MAIN,  INNER, '\u22ef', COMMON);    // >2,000
defineSymbol( '\\ddots',  MAIN,  INNER, '\u22f1', COMMON);    // >2,000
defineSymbol( '\\mathellipsis',  MAIN,  INNER, '\u2026', 91);
defineSymbol( '\\vdots',  MAIN,  MATHORD, '\u22ee', COMMON);    // >2,000
defineSymbol( '\\ldotp',  MAIN,  PUNCT, '\u002e', 18);
defineSymbol( ',', MAIN, PUNCT,  ',');
defineSymbol( ';',  MAIN,  PUNCT, ';');


category = 'Logical Operators';
defineSymbol( '\\wedge',  MAIN,  BIN, '\u2227', SUPERCOMMON);    // >2,000
defineSymbol( '\\vee',  MAIN,  BIN, '\u2228', SUPERCOMMON);    // >2,000

defineSymbol( '\\lnot',  MAIN,  MATHORD, '\u00ac', COMMON);   // >2,000
defineSymbol( '\\neg',  MAIN,  MATHORD, '\u00ac', SUPERCOMMON);   // >2,000

defineSymbol( '\\land',  MAIN,  BIN, '\u2227', 659);
defineSymbol( '\\lor',  MAIN,  BIN, '\u2228', 364);
defineSymbol( '\\barwedge',  AMS,  BIN, '\u22bc', 21);
defineSymbol( '\\veebar',  AMS,  BIN, '\u22bb', 43);
defineSymbol( '\\nor',  AMS,  BIN, '\u22bb', 7);           // NOTE: Not TeXematica
defineSymbol( '\\curlywedge',  AMS,  BIN, '\u22cf', 58);
defineSymbol( '\\curlyvee',  AMS,  BIN, '\u22ce', 57);

category = 'Boxes';
defineSymbol( '\\square',  AMS,  MATHORD, '\u25a1', COMMON);  // >2,000
defineSymbol( '\\Box',  AMS,  MATHORD, '\u25a1', COMMON);  // >2,000
defineSymbol( '\\blacksquare',  AMS,  MATHORD, '\u25a0', 1679);
defineSymbol( '\\boxminus',  AMS,  BIN, '\u229f', 79);
defineSymbol( '\\boxplus',  AMS,  BIN, '\u229e', 276);
defineSymbol( '\\boxtimes',  AMS,  BIN, '\u22a0', 457);
defineSymbol( '\\boxdot',  AMS,  BIN, '\u22a1', 120);

category = 'Circles';
defineSymbol( '\\circ',  MAIN,  BIN, '\u2218', SUPERCOMMON);  // >2,000
defineSymbol( '\\bigcirc',  MAIN,  BIN, '\u25ef', 903);
defineSymbol( '\\bullet',  MAIN,  BIN, '\u2219', COMMON); // >2,000
defineSymbol( '\\circleddash',  AMS,  BIN, '\u229d', COMMON);     // >2,000
defineSymbol( '\\circledast',  AMS,  BIN, '\u229b', 339);
defineSymbol( '\\oplus',  MAIN,  BIN, '\u2295', COMMON); // >2,000
defineSymbol( '\\ominus',  MAIN,  BIN, '\u2296', 1568);
defineSymbol( '\\otimes',  MAIN,  BIN, '\u2297', COMMON);   // >2,000
defineSymbol( '\\odot',  MAIN,  BIN, '\u2299', COMMON);   // >2,000
defineSymbol( '\\circledcirc',  AMS,  BIN, '\u229a', 93);
defineSymbol( '\\oslash',  MAIN,  BIN, '\u2298', 497);
defineSymbol( '\\circledS',  AMS,  MATHORD, '\u24c8', 31);
defineSymbol( '\\circledR',  AMS,  MATHORD, '\u00ae', 1329);


category = 'Triangles';
defineSymbol( '\\triangle',  MAIN,  MATHORD, '\u25b3', COMMON);   // > 2,000
defineSymbol( '\\triangleq',  AMS,  REL, '\u225c', COMMON);  // >2,000
defineSymbol( '\\bigtriangleup',  MAIN,  BIN, '\u25b3', 1773);
defineSymbol( '\\vartriangle',  AMS,  REL, '\u25b3', 762);

defineSymbol( '\\triangledown',  AMS,  MATHORD, '\u25bd', 520);
defineSymbol( '\\bigtriangledown',  MAIN,  BIN, '\u25bd', 661);

defineSymbol( '\\triangleleft',  MAIN,  BIN, '\u25c3', 534);
defineSymbol( '\\vartriangleleft',  AMS,  REL, '\u22b2', 281);
defineSymbol( '\\trianglelefteq',  AMS,  REL, '\u22b4', 176);
defineSymbol( '\\ntriangleleft',  AMS,  REL, '\u22ea', 13);
defineSymbol( '\\ntrianglelefteq',  AMS,  REL, '\u22ec', 22);

defineSymbol( '\\triangleright',  MAIN,  BIN, '\u25b9', 516);
defineSymbol( '\\vartriangleright',  AMS,  REL, '\u22b3', 209);
defineSymbol( '\\trianglerighteq',  AMS,  REL, '\u22b5', 45);
defineSymbol( '\\ntriangleright',  AMS,  REL, '\u22eb', 15);
defineSymbol( '\\ntrianglerighteq',  AMS,  REL, '\u22ed', 6);

defineSymbol( '\\blacktriangle',  AMS,  MATHORD, '\u25b2', 360);
defineSymbol( '\\blacktriangledown',  AMS,  MATHORD, '\u25bc', 159);
defineSymbol( '\\blacktriangleleft',  AMS,  REL, '\u25c0', 101);
defineSymbol( '\\blacktriangleright',  AMS,  REL, '\u25b6', 271);



category = 'Others';
defineSymbol( '\\/',  MAIN,  ORD, '/');
defineSymbol( '|',  MAIN,  'textord', '\u2223');


category = 'Big Operators';
defineSymbol( '\\sqcup',  MAIN,  BIN, '\u2294', 1717);        // 63
defineSymbol( '\\sqcap',  MAIN,  BIN, '\u2293', 735);         // 38
defineSymbol( '\\uplus',  MAIN,  BIN, '\u228e', 597);
defineSymbol( '\\wr',  MAIN,  BIN, '\u2240', 286);
defineSymbol( '\\Cap',  AMS,  BIN, '\u22d2', 2);
defineSymbol( '\\Cup',  AMS,  BIN, '\u22d3', 2);
defineSymbol( '\\doublecap',  AMS,  BIN, '\u22d2', 1);
defineSymbol( '\\doublecup',  AMS,  BIN, '\u22d3', 1);
defineSymbol( '\\amalg',  MAIN,  BIN, '\u2a3f', CRYPTIC);
defineSymbol( '\\And',  MAIN,  BIN, '\u0026');

category = 'Accents';
// defineSymbol( '\\bar',  MAIN,  ACCENT, '\u00af', COMMON);    // >2,000


// defineSymbol( '\\vec',  MAIN,  ACCENT, '\u20d7');
// defineSymbol( '\\hat',  MAIN,  ACCENT, '\u005e');
// defineSymbol( '\\dot',  MAIN,  ACCENT, '\u02d9');

// defineSymbol( '\\ddot',  MAIN,  ACCENT, '\u00a8', COMMON);    // >2,000

// defineSymbol( '\\acute',  MAIN,  ACCENT, '\u00b4', COMMON);    // >2,000
// defineSymbol( '\\tilde',  MAIN,  ACCENT, '\u007e', COMMON);    // >2,000
// defineSymbol( '\\check',  MAIN,  ACCENT, '\u02c7', COMMON);    // >2,000
// defineSymbol( '\\breve',  MAIN,  ACCENT, '\u02d8', 1548);
// defineSymbol( '\\grave',  MAIN,  ACCENT, '\u0060', 735);

defineFunction([
    '\\acute', '\\grave', '\\dot', '\\ddot', '\\mathring',
    '\\tilde', '\\bar', '\\breve', '\\check', '\\hat', '\\vec',
], '{body:auto}', null, function(name, args) {
    return {
        type: 'accent',
        accent: {
            '\\acute': '\u02ca',
            '\\grave': '\u02cb',
            '\\dot': '\u02d9',
            '\\ddot': '\u00a8',
            '\\mathring': '\u02da',
            '\\tilde': '\u007e',
            '\\bar': '\u02c9',
            '\\breve': '\u02d8',
            '\\check': '\u02c7',
            '\\hat': '\u005e',
            '\\vec': '\u20d7',
        }[name],
        limits: 'accent',   // This will suppress the regular
                            // supsub attachment and will delegate
                            // it to the decomposeAccent
                            // (any non-null value would do)
        skipBoundary: true,
        body: args[0],
    };
});

frequency(COMMON, '\\bar', '\\ddot', '\\acute', '\\tilde', '\\check');
frequency(1548, '\\breve');
frequency(735, '\\grave');
frequency(SUPERCOMMON, '\\vec');

    // note('\\( \\bar{x}\\): Average of the values \\( (x_1,\\ldots ,x_n) \\)');


category = 'Letters and Letter Like Forms';
defineSymbol( '\\imath',  MAIN,  MATHORD, '\u0131');
defineSymbol( '\\jmath',  MAIN,  MATHORD, '\u0237');

category = 'Others';
defineSymbol( '\\degree',  MAIN,  MATHORD, '\u00b0', 46);

category = 'Others';
defineSymbol( "'",  MAIN,  MATHORD, '\u2032');        // Prime
defineSymbol( '"',  MAIN,  MATHORD, '\u201D');       // Double Prime
// defineSymbol( "\'',  MAIN,  MATHORD, '\u2033');       // Double Prime



// From plain.tex
category = 'Others';

defineFunction('\\^', '{:string}',
    {allowedInText: true}, 
    function(name, args) {
    return {
        type: 'mord',
        limits: 'nolimits',
        symbol: true,
        isFunction: false,
        body: args[0] ? 
            ({'a':'â','e':'ê','i':'î','o':'ô','u':'û',
            'A':'Â','E':'Ê','I':'Î','O':'Ô','U':'Û'}[args[0]] || '^') :
            '^',
        baseFontFamily: 'cmr'
    };
})

defineFunction("\\`", '{:string}', 
    {allowedInText: true}, 
    function(name, args) {
    return {
        type: 'mord',
        limits: 'nolimits',
        symbol: true,
        isFunction: false,
        body: args[0] ? 
            ({'a':'à','e':'è','i':'ì','o':'ò','u':'ù',
            'A':'À','E':'È','I':'Ì','O':'Ò','U':'Ù'}[args[0]] || '`') :
            '`',
        baseFontFamily: 'cmr'
    };
})


defineFunction("\\'", '{:string}', 
    {allowedInText: true}, 
    function(name, args) {
    return {
        type: 'mord',
        limits: 'nolimits',
        symbol: true,
        isFunction: false,
        body: args[0] ? 
            ({'a':'á','e':'é','i':'í','o':'ó','u':'ú',
            'A':'Á','E':'É','I':'Í','O':'Ó','U':'Ú'}[args[0]] || '\u005e') :
            '\u005e',
        baseFontFamily: 'cmr'
    };
})

defineFunction('\\~', '{:string}', 
    {allowedInText: true}, 
    function(name, args) {
    return {
        type: 'mord',
        limits: 'nolimits',
        symbol: true,
        isFunction: false,
        body: args[0] ? 
            ({'n':'ñ', 'N':'Ñ', 'a':'ã', 'o':'õ', 'A':'Ã', 'O':'Õ'}[args[0]] || '\u00B4') :
            '\u00B4',
        baseFontFamily: 'cmr'
    };
})

defineFunction('\\c', '{:string}', 
    {allowedInText: true}, 
    function(name, args) {
    return {
        type: 'mord',
        limits: 'nolimits',
        symbol: true,
        isFunction: false,
        body: args[0] ? 
            ({'c':'ç', 'C':'Ç'}[args[0]] || '') :
            '',
        baseFontFamily: 'cmr'
    };
})

// Body-text symbols
// See http://ctan.mirrors.hoobly.com/info/symbols/comprehensive/symbols-a4.pdf, p14

const TEXT_SYMBOLS = {
    '\\#':               '\u0023',
    '\\&':               '\u0026',
    '\\$':               '$',
    '\\%':               '%',
    '\\_':               '_',
    '\\euro':            '\u20AC',
    '\\maltese':         '\u2720',
    '\\{':               '{',
    '\\}':               '}',
    '\\nobreakspace':    '\u00A0',
    '\\ldots':           '\u2026',
    '\\textellipsis':    '\u2026',
    '\\backslash':       '\\',
    '`':                 '\u2018',
    '\'':                '\u2019',
    '``':                '\u201c',
    '\'\'':              '\u201d',
    '\\degree':          '\u00b0',
    '\\textasciicircum': '^',
    '\\textasciitilde':  '~',
    '\\textasteriskcentered':     '*',
    '\\textbackslash':  '\\',
    '\\textbraceleft':  '{',
    '\\textbraceright': '}',
    '\\textbullet':     '•',
    '\\textdollar':     '$',
    '\\textsterling':   '£',
    '–':                '\u2013',   // EN DASH
    '—':                '\u2014',   // EM DASH
    '‘':                '\u2018',   // LEFT SINGLE QUOTATION MARK
    '’':                '\u2019',   // RIGHT SINGLE QUOTATION MARK
    '“':                '\u201C',   // LEFT DOUBLE QUOTATION MARK
    '”':                '\u201D',   // RIGHT DOUBLE QUOTATION MARK
    '"':                '\u201D',   // DOUBLE PRIME
    '\\ss':             '\u00df',   // LATIN SMALL LETTER SHARP S
    '\\ae':             '\u00E6',   // LATIN SMALL LETTER AE
    '\\oe':             '\u0153',   // LATIN SMALL LIGATURE OE
    '\\AE':             '\u00c6',   // LATIN CAPITAL LETTER AE
    '\\OE':             '\u0152',   // LATIN CAPITAL LIGATURE OE
    '\\O':              '\u00d8',   // LATIN CAPITAL LETTER O WITH STROKE
    '\\i':              '\u0131',   // LATIN SMALL LETTER DOTLESS I
    '\\j':              '\u0237',   // LATIN SMALL LETTER DOTLESS J
    '\\aa':             '\u00e5',   // LATIN SMALL LETTER A WITH RING ABOVE
    '\\AA':             '\u00c5',   // LATIN CAPITAL LETTER A WITH RING ABOVE

};


const COMMAND_MODE_CHARACTERS = /[a-zA-Z0-9!@*()-=+{}[\]\\';:?/.,~<>`|'$%#&^_" ]/;

// Word boundaries for Cyrillic, Polish, French, German, Italian
// and Spanish. We use \p{L} (Unicode property escapes: "Letter")
// but Firefox doesn't support it 
// (https://bugzilla.mozilla.org/show_bug.cgi?id=1361876). Booo...
// See also https://stackoverflow.com/questions/26133593/using-regex-to-match-international-unicode-alphanumeric-characters-in-javascript
const LETTER = 
    typeof navigator !== 'undefined' && /firefox|edge/i.test(navigator.userAgent) ?
        /[a-zA-ZаАбБвВгГдДеЕёЁжЖзЗиИйЙкКлЛмМнНоОпПрРсСтТуУфФхХцЦчЧшШщЩъЪыЫьЬэЭюЮяĄąĆćĘęŁłŃńÓóŚśŹźŻżàâäôéèëêïîçùûüÿæœÀÂÄÔÉÈËÊÏÎŸÇÙÛÜÆŒäöüßÄÖÜẞàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚáéíñóúüÁÉÍÑÓÚÜ]/ :
        new RegExp("\\p{Letter}", 'u');

const LETTER_AND_DIGITS = 
    typeof navigator !== 'undefined'  && /firefox|edge/i.test(navigator.userAgent) ?
        /[0-9a-zA-ZаАбБвВгГдДеЕёЁжЖзЗиИйЙкКлЛмМнНоОпПрРсСтТуУфФхХцЦчЧшШщЩъЪыЫьЬэЭюЮяĄąĆćĘęŁłŃńÓóŚśŹźŻżàâäôéèëêïîçùûüÿæœÀÂÄÔÉÈËÊÏÎŸÇÙÛÜÆŒäöüßÄÖÜẞàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚáéíñóúüÁÉÍÑÓÚÜ]/ :
        new RegExp("[0-9\\p{Letter}]", 'u');

export default {
    matchCodepoint,
    commandAllowed,
    unicodeToMathVariant,
    mathVariantToUnicode,
    unicodeStringToLatex,
    getInfo,
    getValue,
    getEnvironmentInfo,
    suggest,
    FREQUENCY_VALUE,
    TEXT_SYMBOLS,
    MATH_SYMBOLS,
    ENVIRONMENTS,

    RIGHT_DELIM,
    FUNCTIONS,
    MACROS,

    COMMAND_MODE_CHARACTERS,
    LETTER,
    LETTER_AND_DIGITS
}



// TODO
// Some missing greek letters, but see https://reference.wolfram.com/language/tutorial/LettersAndLetterLikeForms.html
// koppa, stigma, Sampi
// See https://tex.stackexchange.com/questions/231878/accessing-archaic-greek-koppa-in-the-birkmult-document-class
// Capital Alpha, etc...
// Colon (ratio) (2236)
// Function names can have '*' in them

// Review:
// https://en.wikipedia.org/wiki/Help:Displaying_a_formula

// https://reference.wolfram.com/language/tutorial/LettersAndLetterLikeForms.html
// ftp://ftp.dante.de/tex-archive/info/symbols/comprehensive/symbols-a4.pdf

// Media Wiki Reference
// https://en.wikipedia.org/wiki/Help:Displaying_a_formula

// MathJax Reference
// http://docs.mathjax.org/en/latest/tex.html#supported-latex-commands
// http://www.onemathematicalcat.org/MathJaxDocumentation/TeXSyntax.htm

// LaTeX Reference
// http://ctan.sharelatex.com/tex-archive/info/latex2e-help-texinfo/latex2e.html

// iBooks Author/Pages
// https://support.apple.com/en-au/HT202501

// Mathematica Reference
// https://reference.wolfram.com/language/tutorial/NamesOfSymbolsAndMathematicalObjects.html
// https://reference.wolfram.com/language/guide/MathematicalTypesetting.html
/*
    * @todo \sb (equivalent to _) $\mathfrak{sl}\sb 2$ frequency 184
    * @todo \sp (equivalent to ^) $\mathfrak{sl}\sp 2$ frequency 274
    * \intertext    frequency 0


    See http://mirrors.ibiblio.org/CTAN/macros/latex/contrib/mathtools/mathtools.pdf

*/