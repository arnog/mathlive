/*global require:false*/
/*global define:false*/
/* eslint max-len: 0 */

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


/**
 * This module contains the definitions of all the symbols and commands, for 
 * example `\alpha`, `\sin`, `\mathrm`.
 * There are a few exceptions with some "built-in" commands that require
 * special parsing such as `\char`.
 * @module definitions
 * @private
 */
define(['mathlive/core/fontMetrics'], function(FontMetrics) {




/**
 * To organize the symbols when generating the documentation, we 
 * keep track of a category that gets assigned to each symbol.
 * @private
 */
let category = '';

const TEXT_SYMBOLS = {};
const MATH_SYMBOLS = {};
const COMMAND_SYMBOLS = {};

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
 * @type {object.<string, number>}
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
 * @param {?}
 * @memberof module:definitions
 * @private
 */
function frequency(value, ...symbols) {
    const v = typeof value === 'string' ? FREQUENCY_VALUE[value] : value;

    for (const symbol of symbols) {
       if (TEXT_SYMBOLS[symbol]) {
            TEXT_SYMBOLS[symbol].frequency = v;
        }
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
function defineSymbol(latexName, mode, fontFamily, type, value, frequency) {
    
    console.assert(fontFamily === 'main' || fontFamily === 'ams' ||
        fontFamily === 'mathrm' || fontFamily === 'mathbb' || 
        fontFamily === 'mathfrak' || fontFamily === 'mathcal' || 
        fontFamily === 'mathscr' || 
        Array.isArray(fontFamily),
        "Unknown font family " + fontFamily + " for " + latexName);

    // Convert a frequency constant to a numerical value
    if (typeof frequency === 'string') frequency = FREQUENCY_VALUE[frequency];

    if (mode.includes(TEXT)) {
        TEXT_SYMBOLS[latexName] = {
            symbol: true,
            category: category,         // To group items when generating the documentation
            fontFamily: fontFamily,
            type: type === ORD ? TEXTORD : type,
            skipBoundary: true, 
            body: value,
            frequency: frequency
        };
    }
    if (mode.includes(MATH)) {
        MATH_SYMBOLS[latexName] = {
            symbol: true,
            category: category,         // To group items when generating the documentation
            fontFamily: fontFamily,
            type: type === ORD ? MATHORD : type,
            skipBoundary: true, 
            value: value,
            frequency: frequency
        };
    }
    if (mode.includes(COMMAND)) {
        COMMAND_SYMBOLS[latexName] = {
            fontFamily: fontFamily,
            type: type,
            value: value};
    }
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
function defineSymbols(string, mode, fontFamily, type, frequency) {
    for(let i = 0; i < string.length; i++) {
        const ch = string.charAt(i);
        defineSymbol(ch, mode, fontFamily, type, ch, frequency);
    }
}

/**
 * Define a set of single-character symbols as a range of Unicode codepoints
 * @param {number} from First Unicode codepoint
 * @param {number} to Last Unicode codepoint
 * @param {string} mode 
 * @param {string} fontFamily 
 * @param {string} type 
 * @param {(string|number)} [frequency] 
 * @memberof module:definitions
 * @private
 */
function defineSymbolRange(from, to, mode, fontFamily, type, frequency) {
    for(let i = from; i <= to; i++) {
        const ch = String.fromCodePoint(i);
        defineSymbol(ch, mode, fontFamily, type, ch, frequency);
    }
}


const CODEPOINT_SHORTCUTS = { 
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

    0x2102: '\\C',
    0x2115: '\\N',
    0x2119: '\\P',
    0x211A: '\\Q',
    0x211D: '\\R',
    0x2124: '\\Z',
    };
/**
 * Given a character, return a LaTeX expression matching its Unicode codepoint.
 * The return string is in the ASCII range.
 * If there is a matching symbol (e.g. \alpha) it is returned.
 * If there is no matching symbol and it is outside the ASCII range, an 
 * expression with \char is returned.
 * @param {string} s
 * @return {string}
 * @memberof module:definitions
 * @private
 */
function matchCodepoint(s) {
    const codepoint = s.codePointAt(0);

    // Some symbols map to multiple codepoints. 
    // Some symbols are 'pseudosuperscript'. Convert them to a super(or sub)script.
    // Map their alternative codepoints here.
    let result = CODEPOINT_SHORTCUTS[s];
    if (result) return result;

    if (codepoint > 32 && codepoint < 127) return s;

    for (const p in MATH_SYMBOLS) {
        if (MATH_SYMBOLS.hasOwnProperty(p)) {
            if (MATH_SYMBOLS[p].value === s || MATH_SYMBOLS[p].body === s) {
                result = p;
                if (p[0] === '\\') result += ' ';
            }
        }
    }

    // No symbol was found, return a \char command
    if (!result) {
        if (codepoint < 32 || codepoint >= 127) {
            result = '\\char"' + 
                    ('000000' + codepoint.toString(16)).toUpperCase().substr(-6)
        } else {
            result = s;
        }
    }
    return result;
}



/**
 * Given a Unicode character returns {char:, variant:, style} corresponding 
 * to this codepoint. `variant` is optional and is one of 'mathbb', 
 * 'mathfrak', 'mathcal', 'mathscr', 'mathsf' and 'mathtt'
 * This maps characters such as "blackboard uppercase C" to 
 * {char: 'C', variant: 'mathbb', style:}
 * @param {string} char 
 */

/* Some symbols in the MATHEMATICAL ALPHANUMERICAL SYMBOLS blocked had 
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

    { start: 0x1D49c, len: 26, offset: 65, variant: 'mathcal'},
    { start: 0x1D4b6, len: 26, offset: 97, variant: 'mathcal'},
    { start: 0x1D4d0, len: 26, offset: 65, variant: 'mathcal', style: 'bold'},
    { start: 0x1D4ea, len: 26, offset: 97, variant: 'mathcal', style: 'bold'},

    { start: 0x1D504, len: 26, offset: 65, variant: 'mathfrak'},
    { start: 0x1D51e, len: 26, offset: 97, variant: 'mathfrak'},
    { start: 0x1D56c, len: 26, offset: 65, variant: 'mathfrak', style: 'bold'},
    { start: 0x1D586, len: 26, offset: 97, variant: 'mathfrak', style: 'bold'},
 
    { start: 0x1D538, len: 26, offset: 65, variant: 'mathbb'},
    { start: 0x1D552, len: 26, offset: 97, variant: 'mathbb'},

    { start: 0x1D5A0, len: 26, offset: 65, variant: 'mathsf'},
    { start: 0x1D5BA, len: 26, offset: 97, variant: 'mathsf'},
    { start: 0x1D5D4, len: 26, offset: 65, variant: 'mathsf', style: 'bold'},
    { start: 0x1D5EE, len: 26, offset: 97, variant: 'mathsf', style: 'bold'},
    { start: 0x1D608, len: 26, offset: 65, variant: 'mathsf', style: 'italic'},
    { start: 0x1D622, len: 26, offset: 97, variant: 'mathsf', style: 'italic'},
    { start: 0x1D63c, len: 26, offset: 65, variant: 'mathsf', style: 'bolditalic'},
    { start: 0x1D656, len: 26, offset: 97, variant: 'mathsf', style: 'bolditalic'},
    
    { start: 0x1D670, len: 26, offset: 65, variant: 'mathtt'},
    { start: 0x1D68A, len: 26, offset: 97, variant: 'mathtt'},

    { start: 0x1D6A8, len: 25, offset: 0x391, style: 'bold'},
    { start: 0x1D6C2, len: 25, offset: 0x3B1, style: 'bold'},
    { start: 0x1D6E2, len: 25, offset: 0x391, style: 'italic'},
    { start: 0x1D6FC, len: 25, offset: 0x3B1, style: 'italic'},
    { start: 0x1D71C, len: 25, offset: 0x391, style: 'bolditalic'},
    { start: 0x1D736, len: 25, offset: 0x3B1, style: 'bolditalic'},
    { start: 0x1D756, len: 25, offset: 0x391, variant: 'mathsf', style: 'bold'},
    { start: 0x1D770, len: 25, offset: 0x3B1, variant: 'mathsf', style: 'bold'},
    { start: 0x1D790, len: 25, offset: 0x391, variant: 'mathsf', style: 'bolditalic'},
    { start: 0x1D7AA, len: 25, offset: 0x3B1, variant: 'mathsf', style: 'bolditalic'},


    { start: 0x1D7CE, len: 10, offset: 48, variant: '', style: 'bold' },
    { start: 0x1D7D8, len: 10, offset: 48, variant: 'mathbb' },
    { start: 0x1D7E3, len: 10, offset: 48, variant: 'mathsf' },
    { start: 0x1D7Ec, len: 10, offset: 48, variant: 'mathsf', style: 'bold' },
    { start: 0x1D7F6, len: 10, offset: 48, variant: 'mathtt'},
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
        if (MATH_LETTER_EXCEPTIONS.hasOwnProperty(c)) {
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
 * Given a character and variant ('mathbb', 'mathcal', etc...) 
 * return the corresponding unicode character (a string)
 * @param {string} char 
 * @param {string} variant 
 */
function mathVariantToUnicode(char, variant, style) {
    if (!/[A-Za-z0-9]/.test(char)) return char;

    const codepoint = char.codePointAt(0);
    
    for (let i = 0; i < MATH_UNICODE_BLOCKS.length; i++) {
        if (!variant || MATH_UNICODE_BLOCKS[i].variant === variant) {
            if (!style || MATH_UNICODE_BLOCKS[i].style === style) {
                if (codepoint >= MATH_UNICODE_BLOCKS[i].offset && 
                    codepoint < MATH_UNICODE_BLOCKS[i].offset + MATH_UNICODE_BLOCKS[i].len) {
                        return String.fromCodePoint(
                                MATH_UNICODE_BLOCKS[i].start + 
                                codepoint - MATH_UNICODE_BLOCKS[i].offset);
                }
            }
        }
    }

    return char;
}



function codepointToLatex(cp) {
    if (CODEPOINT_SHORTCUTS[cp]) return CODEPOINT_SHORTCUTS[cp];

    let result;
    // const s = String.fromCodePoint(cp);
    // for (const p in MATH_SYMBOLS) {
    //     if (MATH_SYMBOLS.hasOwnProperty(p)) {
    //         if (MATH_SYMBOLS[p].value === s || MATH_SYMBOLS[p].body === s) {
    //             result = p;
    //             if (p[0] === '\\') result += ' ';
    //             return result;
    //         }
    //     }
    // }

    const v = unicodeToMathVariant(cp);
    if (!v.style && !v.variant) return String.fromCodePoint(cp);
    result =  v.char;
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



function unicodeStringToLatex(s) {
    let result = '';
    for (const cp of s) {
        result += codepointToLatex(cp.codePointAt(0));
    }
    return result;
}



/**
 * 
 * @param {string} mode 
 * @param {string} s 
 * @return {Object}
 * @memberof module:definitions
 * @private
 */
function matchFunction(mode, s) {
    let result = null;
    for (const p in FUNCTIONS) {
        if (FUNCTIONS.hasOwnProperty(p)) {
            if (s === p && (mode !== 'text' || FUNCTIONS[p].allowedInText)) {
                if (!result || result.value.length < p.length) {
                    result = {
                        latexName: p,
                        value: p.slice(1)
                    };
                }
            }
        }
    }
    return result;
}

function matchSymbol(mode, s) {
    const a = mode === 'text' ? TEXT_SYMBOLS : (mode === 'command' ? COMMAND_SYMBOLS : MATH_SYMBOLS);
    let result = null;
    for (const p in a) {
        if (a.hasOwnProperty(p)) {
            const candidate = p;

            if (s === candidate) {
                if (!result || result.match.length < candidate.length) {
                    result = {
                        latexName: p,
                        fontFamily: a[p].fontFamily,
                        value: a[p].value,
                        type: a[p].type,
                        match: candidate
                    }
                }
            }

            if (a[p].fullName && s === '\\[' + a[p].fullName + ']') {
                result = {
                    latexName: p,
                    fontFamily: a[p].fontFamily,
                    value: a[p].value,
                    type: a[p].type,
                    match: '\\[' + a[p].fullName + ']'
                };
                break;
            }
        }
    }

    return result;
}


function getFontName(mode, symbol) {
    const a = mode === 'math' ? MATH_SYMBOLS : TEXT_SYMBOLS;
    return a[symbol] && a[symbol].fontFamily === 'ams' ? 
        'AMS-Regular' : 'Main-Regular';
}

function getValue(mode, symbol) {
    const a = mode === 'math' ? MATH_SYMBOLS : TEXT_SYMBOLS;
    return a[symbol] && a[symbol].value ? a[symbol].value : symbol;
}

function getEnvironmentInfo(name) {
    let result = ENVIRONMENTS[name];
    if (!result) {
        result = {
            params: '',
            parser: null,
            mathstyle: 'displaystyle',
            tabular: true,
            maxColumns: 10,
            colFormat: [],
            leftFence: '.',
            rightFence: '.',
            // arrayStretch: 1,            
        };
    }
    return result;
}

/**
 * @param {string} symbol    A command (e.g. '\alpha') or a character (e.g. 'a')
 * @param {string} parseMode One of 'math', 'text', 'string', 'color', 'dimen', etc...
 * @param {object} macros A macros dictionary
 * @return {any} An info structure about the symbol, or null
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
            const a = parseMode === 'math' ? MATH_SYMBOLS : TEXT_SYMBOLS;
            info = a[symbol];
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

        if (!info) {
            // No luck so far, return some error info...
            info = { 
                    type: 'error',
                    params: [],
                    allowedInText: false,
                    infix: false,
            }
        }

    } else {
        let a = MATH_SYMBOLS;
        if (parseMode === 'command') a = COMMAND_SYMBOLS;
        if (parseMode === 'text') a = TEXT_SYMBOLS;

        info = a[symbol];
    }

    // Special case `f` and `g` to be recognized as functions.
    if (info && info.type === 'mord' && (info.value === 'f' || info.value === 'g')) {
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
    const result = [];

    // Iterate over items in the dictionary
    for (const p in FUNCTIONS) {
        if (FUNCTIONS.hasOwnProperty(p)) {
            if (p.startsWith(s) && !FUNCTIONS[p].infix) {
                result.push({match:p, frequency:FUNCTIONS[p].frequency});
            }
        }
    }

    for (const p in MATH_SYMBOLS) {
        if (MATH_SYMBOLS.hasOwnProperty(p)) {
            if (p.startsWith(s)) {
                result.push({match:p, frequency:MATH_SYMBOLS[p].frequency});
            }
        }
    }

    result.sort( function(a, b) { 
        if (a.frequency === b.frequency) {
            return b.match.length - a.match.length;
        }
        return (b.frequency || 0) - (a.frequency || 0);
    });
    
    return result;
}


// Modes
const MATH = '[math]';
const TEXT = '[text]';
const COMMAND = '[command]';

// Fonts
const MAIN = 'main';        // The "main" KaTeX font (in fact one of several
                            // depending on the math variant, size, etc...)
const AMS = 'ams';          // Some symbols are not in the "main" KaTeX font
                            // or have a different glyph available in the "AMS"
                            // font (`\hbar` and `\hslash` for example).

// Type
const ORD = '[ord]';    // Either MATHORD or TEXTORD, depending on the mode
const MATHORD = 'mord'; // Ordinary, e.g. '/'
const BIN = 'mbin';     // e.g. '+'
const REL = 'mrel';     // e.g. '='
const OPEN = 'mopen';   // e.g. '('
const CLOSE = 'mclose'; // e.g. ')'
const PUNCT = 'mpunct'; // e.g. ','
const INNER = 'minner'; // for fractions and \left...\right.

const TEXTORD = 'textord';

// const ACCENT = 'accent';
const SPACING = 'spacing';
const COMMANDLITERAL = 'command'; // Not in TeX. Values in a command sequence (e.g. ESC + ...)





// TODO:
// SGML &alpha;



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

/**
 * Define one or more environments to be used with 
 *         \begin{<env-name>}...\end{<env-name>}.
 * 
 * @param {string|string[]} names 
 * @param {string} params The number and type of required and optional parameters. 
 * @param {Object} options   
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
        maxColumns: options.maxColumns || 10,
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
 * '[index=2]{indicand}' defines two params, one optional, one required
 
 * @param {Object} options   
 * - infix
 * - allowedInText
 * @param {function} handler 
 * @memberof module:definitions
 * @private
 */
function defineFunction(names, params, options, handler) {
    if (typeof names === 'string') {
        names = [names];
    }

    if (!options) options = {};

    const parsedParams = parseParamTemplate(params);

    // Set default values of functions
    const data = {
        // 'category' is a global variable keeping track of the
        // the current category being defined. This value is used
        // strictly to group items in generateDocumentation().
        category: category,

        fontFamily: options.fontFamily,

        // Params: the parameters for this function, an array of
        // {optional, type, defaultValue, placeholder}
        params: parsedParams,

        allowedInText: !!options.allowedInText,
        infix: !!options.infix,
        handler: handler
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

'array',        {columns:text} 
                cells are textstyle math
                no fence

'eqnarray'      DEPRECATED see http://www.tug.org/pracjourn/2006-4/madsen/madsen.pdf
                {rcl}
                first and last cell in each row is displaystyle math
                each cell has a margin of \arraycolsep
                Each line has a eqno
                frequency 7

'equation',     centered, numbered
                frequency 8

'subequations'   with an 'equation' environment, appends a letter to eq no
                frequency 1

'theorem'       text mode. Prepends in bold 'Theorem <counter>', then body in italics.

 
 'multline'     single column 
                first row left aligned, last right aligned, others centered
                last line has an eqn. 
                no output if inside an equation 
 
 'gather'       at most two columns
                first column centered, second column right aligned
                frequency 1

 'align'        multiple columns, 
                alternating rl
                there is some 'space' (additional column?) between each pair
                each line is numbered (except when inside an equation environment)
                there is an implicit {} at the beginning of left columns

 'aligned'      must be in equation environment 
                frequency: COMMON
                @{}r@{}l@{\quad}@{}r@{}l@{}

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

'split'         must be in an equation environment, 
                two columns, additional columns are interpreted as line breaks
                firs column is right aligned, second column is left aligned
                entire construct is numbered
                frequency: 0

'gathered'      single columm, 
                centered
                may need to be in equation environment?
                frequency: COMMON


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


category = 'Trigonometry';
defineFunction([
    '\\arcsin', '\\arccos', '\\arctan', '\\arctg', '\\arcctg',
    '\\arg', '\\ch', '\\cos', '\\cosec', '\\cosh', '\\cot', '\\cotg',
    '\\coth', '\\csc', '\\ctg', '\\cth', 
    '\\sec', '\\sin',
    '\\sinh', '\\sh', '\\tan', '\\tanh', '\\tg', '\\th',], 
    '', {fontFamily:'mainrm'}, function(name) {
    return {
        type: 'mop',
        limits: 'nolimits',
        symbol: false,
        isFunction: true,
        body: name.slice(1),
        fontFamily: 'mainrm'
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
    '', {fontFamily:'mainrm'}, function(name) {
    return {
        type: 'mop',
        limits: 'nolimits',
        symbol: false,
        isFunction: true,
        body: name.slice(1),
        fontFamily: 'mainrm'
    };
})
frequency(SUPERCOMMON, '\\ln', '\\log', '\\exp');

frequency(292, '\\hom');
frequency(COMMON, '\\dim');
frequency(COMMON, '\\ker', '\\deg');     // >2,000


defineFunction(['\\lim', '\\mod'], 
    '', {fontFamily:'mainrm'}, function(name) {
    return {
        type: 'mop',
        limits: 'limits',
        symbol: false,
        body: name.slice(1),
        fontFamily: 'mainrm'
    };
})
defineFunction(['\\det', '\\max', '\\min'], 
    '', {fontFamily:'mainrm'}, function(name) {
    return {
        type: 'mop',
        limits: 'limits',
        symbol: false,
        isFunction: true,
        body: name.slice(1),
        fontFamily: 'mainrm'
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

defineFunction('\\color', '{:color}', null, 
    function(name, args) {
        return { 
            type: 'color',
            color: args[0],
        };
    }
)
defineFunction('\\textcolor', '{:color}{content:auto}', null, 
    function(name, args) {
        return { 
            type: 'color',
            textcolor: args[0],
            skipBoundary: true,
            body: args[1]
        };
    }
)
    frequency(3, '\\textcolor');


defineFunction('\\class', '{cl:string}{content:auto}', null,
    function (name, args) {
        return {
            type: 'class',
            htmlClass: args[0],
            skipBoundary: true,
            body: args[1]
        };
    }
)
frequency(3, '\\class');

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



defineFunction('\\rlap', '{:text}', null, function(name, args) {
    return { type: 'overlap', align: 'right', skipBoundary: true, body: args[0], };
});
    frequency(270, '\\rlap');

defineFunction('\\llap', '{:text}', null, function(name, args) {
    return { type: 'overlap', align: 'left', skipBoundary: true, body: args[0], };
});
    frequency(18, '\\llap');

defineFunction('\\mathrlap', '{:auto}', null, function(name, args) {
    return { type: 'overlap', align: 'right', skipBoundary: true, body: args[0], };
});
    frequency(CRYPTIC, '\\mathrlap');

defineFunction('\\mathllap', '{:auto}', null, function(name, args) {
    return { type: 'overlap', align: 'left', skipBoundary: true, body: args[0], };
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

defineFunction('\\colorbox', '{background-color:color}{content:auto}', null, 
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



defineFunction('\\fcolorbox', '{frame-color:color}{background-color:color}{content:auto}', null, 
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

defineFunction('\\bbox', '[:bbox]{body:auto}', null, 
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
                    if (isNaN(result.strokeWidth)) {
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
        notations = notations.split(/[, ]/).
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



// defineFunction([
    // '\\tiny', '\\scriptsize', '\\footnotesize', '\\small', 
    // '\\normalsize',
    // '\\large', '\\Large', '\\LARGE', '\\huge', '\\Huge'
// ], '', null, 
//     function(name, args) {
//         return { 
//             type: '',
//             size: name;
//         }
//     }
// )










const FONT_ALIASES = {
    '\\Bbb': '\\mathbb',
    '\\bold': '\\mathbf',
    '\\frak': '\\mathfrak',
    '\\boldsymbol': '\\mathbf',
    '\\bm': '\\mathbf',
    '\\bf': '\\mathbf',
    '\\it': '\\mathit'
};

category = 'Styling';
defineFunction([
    // styles
    '\\mathrm', '\\mathit', '\\mathbf', '\\bf', '\\it',

    // families
    '\\mathbb', '\\mathcal', '\\mathfrak', '\\mathscr', '\\mathsf',
    '\\mathtt',

    // aliases
    '\\Bbb', '\\bold', '\\frak', '\\boldsymbol', '\\bm'
    ], '{text:math}', {}, function(funcName, args) {
    if (funcName in FONT_ALIASES) {
        funcName = FONT_ALIASES[funcName];
    }
    return {
        type: 'font',
        font: funcName.slice(1),
        skipBoundary: true,
        body: args[0],
        captureSelection: true
    };
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


// Rough synomym for \text{}
defineFunction(['\\mbox'], '{text:text}', {allowedInText: true}, function(name, args) {
    return {
        type: 'font',
        skipBoundary: true, 
        body: args[0],
        font: 'mathrm'
    };
});

// Non-mathy text, possibly in a font
defineFunction([
    '\\text', '\\textrm', '\\textsf', '\\texttt', '\\textnormal',
    '\\textbf', '\\textit',

    // toggle
    '\\emph', '\\em',
], '{text:text}', {allowedInText: true}, function(name, args) {
    return {
        type: 'font',
        skipBoundary: true,
        body: args[0],
        font: { '\\text': null, '\\textrm': 'mathrm', '\\textup': 'mathrm', 
                '\\textnormal': 'mathrm', 
                '\\textsf': 'mathsf', '\\texttt': 'mathtt', 
                '\\textbf': 'mathbf', '\\textit': 'textit', 
                '\\emph': 'emph', '\\em': 'emph'}[name],
    };
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
], '{numerator}{denominator}', {}, function(name, args) {
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
defineFunction(['\\pdiff'], '{numerator}{denominator}' , {}, function(funcname, args) {
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
defineSymbol( '\\forall', MATH,  MAIN,  TEXTORD, '\u2200', SUPERCOMMON);
defineSymbol( '\\exists', MATH,  MAIN,  TEXTORD, '\u2203', SUPERCOMMON);
defineSymbol( '\\nexists', MATH,  AMS,  TEXTORD, '\u2204', SUPERCOMMON);
defineSymbol( '\\mid', MATH,  MAIN,  REL, '\u2223', COMMON);
defineSymbol( '\\top', MATH,  MAIN,  TEXTORD, '\u22a4', RARE);
defineSymbol( '\\bot', MATH,  MAIN,  TEXTORD, '\u22a5', RARE);


category = 'Variable Sized Symbols'

// Limits, symbols
defineFunction([
    '\\sum', '\\prod', '\\bigcup', '\\bigcap',
    '\\coprod', '\\bigvee', '\\bigwedge', '\\biguplus', 
    '\\bigotimes',
    '\\bigoplus', '\\bigodot', '\\bigsqcup', '\\smallint', '\\intop', 
],  '', {}, function(name) {
    return {
        type: 'mop',
        limits: 'auto',
        symbol: true,
        fontFamily: 'main',
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
], '', {}, function(name) {
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
defineSymbol( '\\sharp', MATH,  MAIN,  TEXTORD, '\u266f', COMMON); // >2,000
defineSymbol( '\\flat', MATH,  MAIN,  TEXTORD, '\u266d', 590);
defineSymbol( '\\natural', MATH,  MAIN,  TEXTORD, '\u266e', 278);
defineSymbol( '\\#', MATH,  MAIN,  TEXTORD, '\u0023', RARE);
defineSymbol( '\\#', TEXT,  MAIN,  TEXTORD, '\u0023', RARE);
defineSymbol( '\\&', MATH,  MAIN,  TEXTORD, '\u0026', RARE);
defineSymbol( '\\&', TEXT,  MAIN,  TEXTORD, '\u0026', RARE);
defineSymbol( '\\clubsuit', MATH,  MAIN,  TEXTORD, '\u2663', 172);
defineSymbol( '\\heartsuit', MATH,  MAIN,  TEXTORD, '\u2661', ARCANE);
defineSymbol( '\\spadesuit', MATH,  MAIN,  TEXTORD, '\u2660', ARCANE);
defineSymbol( '\\diamondsuit', MATH,  MAIN,  TEXTORD, '\u2662', CRYPTIC);


// defineSymbol( '\\cross', MATH,  MAIN,  MATHORD, '\uF4A0'); // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\transpose', MATH,  MAIN,  MATHORD, '\uF3C7'); // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\conjugate', 'conj'], MATH,  MAIN,  MATHORD, '\uF3C8'); // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\conjugatetranspose', MATH,  MAIN,  MATHORD, '\uF3C9'); // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\hermitianconjugate', MATH,  MAIN,  MATHORD, '\uF3CE'); // NOTE: not a real TeX symbol, but Mathematica
defineSymbol( '\\differencedelta', MATH,  MAIN,  REL, '\u2206', COMMON);

category = 'Letters and Letter Like Forms';

defineFunction(['\\unicode'], '{charcode:number}', null, 
function(name, args) {
    let codepoint = parseInt(args[0]);
    if (isNaN(codepoint)) codepoint = 0x2753; // BLACK QUESTION MARK
    return {
        type: 'mord',
        fontFamily: 'main',
        body: String.fromCodePoint(codepoint)
    }
});



defineSymbol( '\\nabla', MATH,  MAIN,  TEXTORD, '\u2207', SUPERCOMMON);
defineSymbol( '\\partial', MATH,  MAIN,  TEXTORD, '\u2202', SUPERCOMMON); // >2,000

defineSymbol( '\\ell', MATH,  MAIN,  TEXTORD, '\u2113', COMMON); // >2,000
defineSymbol( '\\imaginaryI', MATH,  'main',  MATHORD, 'i'); // NOTE: not a real TeX symbol, but Mathematica
// NOTE: set in math as per ISO 80000-2:2009.
defineSymbol( '\\imaginaryJ', MATH,  'main',  MATHORD, 'j'); // NOTE: not a real TeX symbol, but Mathematica
// NOTE: set in math as per ISO 80000-2:2009.
defineSymbol( '\\Re', MATH,  MAIN,  TEXTORD, '\u211c', COMMON); // >2,000
defineSymbol( '\\Im', MATH,  MAIN,  TEXTORD, '\u2111', COMMON); // >2,000

defineSymbol( '\\hbar', MATH,  MAIN,  TEXTORD, '\u210f', COMMON); // >2,000
defineSymbol( '\\hslash', MATH,  AMS,  TEXTORD, '\u210f', COMMON); // >2,000

defineSymbol( '\\differentialD', MATH,  'mathrm',  MATHORD, 'd'); // NOTE: not a real TeX symbol, but Mathematica
defineSymbol( '\\rd', MATH,  'mathrm',  MATHORD, 'd'); // NOTE: not a real TeX symbol, but used in ProofWiki
// NOTE: set in math as per ISO 80000-2:2009.
defineSymbol( '\\capitalDifferentialD', MATH,  'mathrm',  MATHORD, 'D'); // NOTE: not a real TeX symbol, but Mathematica
// NOTE: set in math as per ISO 80000-2:2009.
defineSymbol( '\\rD', MATH,  'mathrm',  MATHORD, 'D'); // NOTE: not a real TeX symbol
defineSymbol( '\\exponentialE', MATH,  'mathrm',  MATHORD, 'e'); // NOTE: not a real TeX symbol, but Mathematica
// NOTE: set in math as per ISO 80000-2:2009.


defineSymbol( '\\Finv', MATH,  AMS,  TEXTORD, '\u2132', 3);
defineSymbol( '\\Game', MATH,  AMS,  TEXTORD, '\u2141', 1);

defineSymbol( '\\wp', MATH,  MAIN,  TEXTORD, '\u2118', 1306);
defineSymbol( '\\eth', MATH,  AMS,  TEXTORD, '\u00f0', 77);

defineSymbol( '\\mho', MATH,  AMS,  TEXTORD, '\u2127', 138);

defineSymbol( '\\Bbbk', MATH,  AMS,  TEXTORD, '\u006b');
defineSymbol( '\\doubleStruckCapitalN', MATH,  'mathbb',  MATHORD, 'N');    // NOTE: Not TeX?
defineSymbol( '\\N', MATH,  'mathbb',  MATHORD, 'N');    // NOTE: Check if standard Latex
defineSymbol( '\\doubleStruckCapitalR', MATH,  'mathbb',  MATHORD, 'R');    // NOTE: Not TeX?
defineSymbol( '\\R', MATH,  'mathbb',  MATHORD, 'R');    // NOTE: Check if standard Latex
defineSymbol( '\\doubleStruckCapitalQ', MATH,  'mathbb',  MATHORD, 'Q');    // NOTE: Not TeX?
defineSymbol( '\\Q', MATH,  'mathbb',  MATHORD, 'Q');    // NOTE: Check if standard Latex
defineSymbol( '\\doubleStruckCapitalC', MATH,  'mathbb',  MATHORD, 'C');    // NOTE: Not TeX?
defineSymbol( '\\C', MATH,  'mathbb',  MATHORD, 'C');    // NOTE: Check if standard Latex
defineSymbol( '\\doubleStruckCapitalZ', MATH,  'mathbb',  MATHORD, 'Z');    // NOTE: Not TeX?
defineSymbol( '\\Z', MATH,  'mathbb',  MATHORD, 'Z');    // NOTE: Check if standard Latex
defineSymbol( '\\doubleStruckCapitalP', MATH,  'mathbb',  MATHORD, 'P');    // NOTE: Not TeX?
defineSymbol( '\\P', MATH,  'mathbb',  MATHORD, 'P');    // NOTE: Check if standard Latex

defineSymbol( '\\scriptCapitalE', MATH,  'mathscr',  MATHORD, 'E');    // NOTE: Not TeX?
defineSymbol( '\\scriptCapitalH', MATH,  'mathscr',  MATHORD, 'H');    // NOTE: Not TeX?
defineSymbol( '\\scriptCapitalL', MATH,  'mathscr',  MATHORD, 'L');    // NOTE: Not TeX?

defineSymbol( '\\gothicCapitalC', MATH,  'mathfrak',  MATHORD, 'C');    // NOTE: Not TeX?
defineSymbol( '\\gothicCapitalH', MATH,  'mathfrak',  MATHORD, 'H');    // NOTE: Not TeX?
defineSymbol( '\\gothicCapitalI', MATH,  'mathfrak',  MATHORD, 'I');    // NOTE: Not TeX?
defineSymbol( '\\gothicCapitalR', MATH,  'mathfrak',  MATHORD, 'R');    // NOTE: Not TeX?


defineSymbol( '\\pounds', MATH,  MAIN,  MATHORD, '\u00a3', 509);
defineSymbol( '\\yen', MATH,  AMS,  TEXTORD, '\u00a5', 57);
defineSymbol( '\\euro', MATH,  MAIN,  MATHORD, '\u20AC', 4); // NOTE: not TeX built-in, but textcomp package
defineSymbol( '\\euro', TEXT,  MAIN,  TEXTORD, '\u20AC', 4); // NOTE: not a real TeX symbol, but Mathematica




// TODO Koppa, Stigma, Sampi


// Math and Text

category = 'Crosses';
defineSymbol( '\\textdagger', MATH,  MAIN,  BIN, '\u2020');
defineSymbol( '\\dagger', MATH,  MAIN,  BIN, '\u2020', COMMON);         // >2000
defineSymbol( '\\dag', MATH,  MAIN,  BIN, '\u2020', COMMON);        // >2000 results
defineSymbol( '\\ddag', MATH,  MAIN,  BIN, '\u2021', 500);    // 500 results in latexsearch
defineSymbol( '\\textdaggerdbl', MATH,  MAIN,  BIN, '\u2021');
defineSymbol( '\\ddagger', MATH,  MAIN,  BIN, '\u2021', 353);        // 353 results in latexsearch
defineSymbol( '\\maltese', MATH,  AMS,  TEXTORD, '\u2720', 24);
defineSymbol( '\\maltese', TEXT,  AMS,  TEXTORD, '\u2720', 24);



// Arrow Symbols
category = 'Arrows';

defineSymbol( '\\longrightarrow', MATH,  MAIN,  REL, '\u27f6', SUPERCOMMON);    // >2,000
defineSymbol( '\\rightarrow', MATH,  MAIN,  REL, '\u2192', SUPERCOMMON);     // >2,000
defineSymbol( '\\Longrightarrow', MATH,  MAIN,  REL, '\u27f9', SUPERCOMMON);         // See \\implies
defineSymbol( '\\Rightarrow', MATH,  MAIN,  REL, '\u21d2', SUPERCOMMON);    // >2,000

defineSymbol( '\\longmapsto', MATH,  MAIN,  REL, '\u27fc', COMMON);    // >2,000
defineSymbol( '\\mapsto', MATH,  MAIN,  REL, '\u21a6', COMMON);    // >2,000

defineSymbol( '\\Longleftrightarrow', MATH,  MAIN,  REL, '\u27fa', COMMON);    // >2,000

defineSymbol( '\\rightleftarrows', MATH,  AMS,  REL, '\u21c4', COMMON);    // >2,000

defineSymbol( '\\leftarrow', MATH,  MAIN,  REL, '\u2190', COMMON);     // >2,000

defineSymbol( '\\curvearrowleft', MATH,  AMS,  REL, '\u21b6', COMMON);    // >2,000

defineSymbol( '\\uparrow', MATH,  MAIN,  REL, '\u2191', COMMON);    // >2,000
defineSymbol( '\\downarrow', MATH,  MAIN,  REL, '\u2193', COMMON);  // >2,000

defineSymbol( '\\hookrightarrow', MATH,  MAIN,  REL, '\u21aa', COMMON);         // >2,000
defineSymbol( '\\rightharpoonup', MATH,  MAIN,  REL, '\u21c0', COMMON);         // >2,000
defineSymbol( '\\rightleftharpoons', MATH,  MAIN,  REL, '\u21cc', COMMON);         // >2,000

defineSymbol( '\\Leftarrow', MATH,  MAIN,  REL, '\u21d0', 1695);
defineSymbol( '\\longleftrightarrow', MATH,  MAIN,  REL, '\u27f7', 1599);
defineSymbol( '\\longleftarrow', MATH,  MAIN,  REL, '\u27f5', 878);
defineSymbol( '\\Longleftarrow', MATH,  MAIN,  REL, '\u27f8', 296);

defineSymbol( '\\searrow', MATH,  MAIN,  REL, '\u2198', 1609);
defineSymbol( '\\nearrow', MATH,  MAIN,  REL, '\u2197', 1301);
defineSymbol( '\\swarrow', MATH,  MAIN,  REL, '\u2199', 167);
defineSymbol( '\\nwarrow', MATH,  MAIN,  REL, '\u2196', 108);

defineSymbol( '\\Uparrow', MATH,  MAIN,  REL, '\u21d1', 257);
defineSymbol( '\\Downarrow', MATH,  MAIN,  REL, '\u21d3', 556);
defineSymbol( '\\updownarrow', MATH,  MAIN,  REL, '\u2195', 192);
defineSymbol( '\\Updownarrow', MATH,  MAIN,  REL, '\u21d5', 161);

defineSymbol( '\\hookleftarrow', MATH,  MAIN,  REL, '\u21a9', 115);
defineSymbol( '\\leftharpoonup', MATH,  MAIN,  REL, '\u21bc', 93);
defineSymbol( '\\leftharpoondown', MATH,  MAIN,  REL, '\u21bd', 42);
defineSymbol( '\\rightharpoondown', MATH,  MAIN,  REL, '\u21c1', 80);

defineSymbol( '\\leftrightarrows', MATH,  AMS,  REL, '\u21c6', 765);

defineSymbol( '\\dashrightarrow', MATH,  AMS,  REL, '\u21e2', 311);
defineSymbol( '\\dashleftarrow', MATH,  AMS,  REL, '\u21e0', 5);
defineSymbol( '\\leftleftarrows', MATH,  AMS,  REL, '\u21c7', 8);
defineSymbol( '\\Lleftarrow', MATH,  AMS,  REL, '\u21da', 7);
defineSymbol( '\\twoheadleftarrow', MATH,  AMS,  REL, '\u219e', 32);
defineSymbol( '\\leftarrowtail', MATH,  AMS,  REL, '\u21a2', 25);
defineSymbol( '\\looparrowleft', MATH,  AMS,  REL, '\u21ab', 6);
defineSymbol( '\\leftrightharpoons', MATH,  AMS,  REL, '\u21cb', 205);
defineSymbol( '\\circlearrowleft', MATH,  AMS,  REL, '\u21ba', 105);
defineSymbol( '\\Lsh', MATH,  AMS,  REL, '\u21b0', 11);
defineSymbol( '\\upuparrows', MATH,  AMS,  REL, '\u21c8', 15);
defineSymbol( '\\downharpoonleft', MATH,  AMS,  REL, '\u21c3', 21);
defineSymbol( '\\multimap', MATH,  AMS,  REL, '\u22b8', 108);
defineSymbol( '\\leftrightsquigarrow', MATH,  AMS,  REL, '\u21ad', 31);
defineSymbol( '\\twoheadrightarrow', MATH,  AMS,  REL, '\u21a0', 835);
defineSymbol( '\\rightarrowtail', MATH,  AMS,  REL, '\u21a3', 195);
defineSymbol( '\\looparrowright', MATH,  AMS,  REL, '\u21ac', 37);
defineSymbol( '\\curvearrowright', MATH,  AMS,  REL, '\u21b7', 209);
defineSymbol( '\\circlearrowright', MATH,  AMS,  REL, '\u21bb', 63);
defineSymbol( '\\Rsh', MATH,  AMS,  REL, '\u21b1', 18);
defineSymbol( '\\downdownarrows', MATH,  AMS,  REL, '\u21ca', 6);
defineSymbol( '\\upharpoonright', MATH,  AMS,  REL, '\u21be', 579);
defineSymbol( '\\downharpoonright', MATH,  AMS,  REL, '\u21c2', 39);
defineSymbol( '\\rightsquigarrow', MATH,  AMS,  REL, '\u21dd', 674);
defineSymbol( '\\leadsto', MATH,  AMS,  REL, '\u21dd', 709);
defineSymbol( '\\Rrightarrow', MATH,  AMS,  REL, '\u21db', 62);
defineSymbol( '\\restriction', MATH,  AMS,  REL, '\u21be', 29);
defineSymbol( '\\upharpoonleft', MATH,  AMS,  REL, '\u21bf', CRYPTIC);
defineSymbol( '\\rightrightarrows', MATH,  AMS,  REL, '\u21c9', CRYPTIC);

// AMS Negated Arrows
category = 'Negated Arrows';
defineSymbol( '\\nrightarrow', MATH,  AMS,  REL, '\u219b', 324);
defineSymbol( '\\nRightarrow', MATH,  AMS,  REL, '\u21cf', 107);
defineSymbol( '\\nleftrightarrow', MATH,  AMS,  REL, '\u21ae', 36);
defineSymbol( '\\nLeftrightarrow', MATH,  AMS,  REL, '\u21ce', 20);
defineSymbol( '\\nleftarrow', MATH,  AMS,  REL, '\u219a', 7);
defineSymbol( '\\nLeftarrow', MATH,  AMS,  REL, '\u21cd', 5);

// AMS Negated Binary Relations
category = 'Negated Relations';
defineSymbol( '\\nless', MATH,  AMS,  REL, '\u226e', 146);
defineSymbol( '\\nleqslant', MATH,  AMS,  REL, '\ue010', 58);
defineSymbol( '\\lneq', MATH,  AMS,  REL, '\u2a87', 54);
defineSymbol( '\\lneqq', MATH,  AMS,  REL, '\u2268', 36);
defineSymbol( '\\nleqq', MATH,  AMS,  REL, '\ue011', 18);

defineSymbol( '\\unlhd', MATH,  AMS,  BIN, '\u22b4', 253);
defineSymbol( '\\unrhd', MATH,  AMS,  BIN, '\u22b5', 66);

defineSymbol( '\\lvertneqq', MATH,  AMS,  REL, '\ue00c', 6);
defineSymbol( '\\lnsim', MATH,  AMS,  REL, '\u22e6', 4);
defineSymbol( '\\lnapprox', MATH,  AMS,  REL, '\u2a89', CRYPTIC);
defineSymbol( '\\nprec', MATH,  AMS,  REL, '\u2280', 71);
defineSymbol( '\\npreceq', MATH,  AMS,  REL, '\u22e0', 57);
defineSymbol( '\\precnsim', MATH,  AMS,  REL, '\u22e8', 4);
defineSymbol( '\\precnapprox', MATH,  AMS,  REL, '\u2ab9', 2);
defineSymbol( '\\nsim', MATH,  AMS,  REL, '\u2241', 40);
defineSymbol( '\\nshortmid', MATH,  AMS,  REL, '\ue006', 1);
defineSymbol( '\\nmid', MATH,  AMS,  REL, '\u2224', 417);
defineSymbol( '\\nvdash', MATH,  AMS,  REL, '\u22ac', 266);
defineSymbol( '\\nvDash', MATH,  AMS,  REL, '\u22ad', 405);
defineSymbol( '\\ngtr', MATH,  AMS,  REL, '\u226f', 90);
defineSymbol( '\\ngeqslant', MATH,  AMS,  REL, '\ue00f', 23);
defineSymbol( '\\ngeqq', MATH,  AMS,  REL, '\ue00e', 12);
defineSymbol( '\\gneq', MATH,  AMS,  REL, '\u2a88', 29);
defineSymbol( '\\gneqq', MATH,  AMS,  REL, '\u2269', 35);
defineSymbol( '\\gvertneqq', MATH,  AMS,  REL, '\ue00d', 6);
defineSymbol( '\\gnsim', MATH,  AMS,  REL, '\u22e7', 3);
defineSymbol( '\\gnapprox', MATH,  AMS,  REL, '\u2a8a', CRYPTIC);
defineSymbol( '\\nsucc', MATH,  AMS,  REL, '\u2281', 44);
defineSymbol( '\\nsucceq', MATH,  AMS,  REL, '\u22e1', CRYPTIC);
defineSymbol( '\\succnsim', MATH,  AMS,  REL, '\u22e9', 4);
defineSymbol( '\\succnapprox', MATH,  AMS,  REL, '\u2aba', CRYPTIC);
defineSymbol( '\\ncong', MATH,  AMS,  REL, '\u2246', 128);
defineSymbol( '\\nshortparallel', MATH,  AMS,  REL, '\ue007', 6);
defineSymbol( '\\nparallel', MATH,  AMS,  REL, '\u2226', 54);
defineSymbol( '\\nVDash', MATH,  AMS,  REL, '\u22af', 5);
defineSymbol( '\\nsupseteqq', MATH,  AMS,  REL, '\ue018', 1);
defineSymbol( '\\supsetneq', MATH,  AMS,  REL, '\u228b', 286);
defineSymbol( '\\varsupsetneq', MATH,  AMS,  REL, '\ue01b', 2);
defineSymbol( '\\supsetneqq', MATH,  AMS,  REL, '\u2acc', 49);
defineSymbol( '\\varsupsetneqq', MATH,  AMS,  REL, '\ue019', 3);
defineSymbol( '\\nVdash', MATH,  AMS,  REL, '\u22ae', 179);
defineSymbol( '\\precneqq', MATH,  AMS,  REL, '\u2ab5', 11);
defineSymbol( '\\succneqq', MATH,  AMS,  REL, '\u2ab6', 3);
defineSymbol( '\\nsubseteqq', MATH,  AMS,  REL, '\ue016', 16);


// AMS Misc
category = 'Various';
defineSymbol( '\\checkmark', MATH,  AMS,  TEXTORD, '\u2713', 1025);

defineSymbol( '\\diagup', MATH,  AMS,  TEXTORD, '\u2571', 440);
defineSymbol( '\\diagdown', MATH,  AMS,  TEXTORD, '\u2572', 175);

defineSymbol( '\\measuredangle', MATH,  AMS,  TEXTORD, '\u2221', 271);
defineSymbol( '\\sphericalangle', MATH,  AMS,  TEXTORD, '\u2222', 156);

defineSymbol( '\\backprime', MATH,  AMS,  TEXTORD, '\u2035', 104);
defineSymbol( '\\backdoubleprime', MATH,  AMS,  TEXTORD, '\u2036', CRYPTIC);

category = 'Shapes';
defineSymbol( '\\ast', MATH,  MAIN,  BIN, '\u2217', SUPERCOMMON);        // >2,000
defineSymbol( '\\star', MATH,  MAIN,  BIN, '\u22c6', COMMON);       // >2,000
defineSymbol( '\\diamond', MATH,  MAIN,  BIN, '\u22c4', 1356);
defineSymbol( '\\Diamond', MATH,  AMS,  TEXTORD, '\u25ca', 695);
defineSymbol( '\\lozenge', MATH,  AMS,  TEXTORD, '\u25ca', 422);
defineSymbol( '\\blacklozenge', MATH,  AMS,  TEXTORD, '\u29eb', 344);
defineSymbol( '\\bigstar', MATH,  AMS,  TEXTORD, '\u2605', 168);

// AMS Hebrew
category = 'Hebrew';
defineSymbol( '\\aleph', MATH,  MAIN,  TEXTORD, '\u2135', 1381);
defineSymbol( '\\beth', MATH,  AMS,  TEXTORD, '\u2136', 54);
defineSymbol( '\\daleth', MATH,  AMS,  TEXTORD, '\u2138', 43);
defineSymbol( '\\gimel', MATH,  AMS,  TEXTORD, '\u2137', 36);


// AMS Delimiters
category = 'Fences';

defineSymbol( '\\lbrace', MATH,  MAIN,  OPEN, '{', SUPERCOMMON);    // >2,000
defineSymbol( '\\rbrace', MATH,  MAIN,  CLOSE, '}', SUPERCOMMON);    // >2,000
defineSymbol( '\\langle', MATH,  MAIN,  OPEN, '\u27e8', COMMON);    // >2,000
defineSymbol( '\\rangle', MATH,  MAIN,  CLOSE, '\u27e9', COMMON);
defineSymbol( '\\lfloor', MATH,  MAIN,  OPEN, '\u230a', COMMON);    // >2,000
defineSymbol( '\\rfloor', MATH,  MAIN,  CLOSE, '\u230b',COMMON);    // >2,000
defineSymbol( '\\lceil', MATH,  MAIN,  OPEN, '\u2308', COMMON);    // >2,000
defineSymbol( '\\rceil', MATH,  MAIN,  CLOSE, '\u2309', COMMON);  // >2,000

defineSymbol( '\\vert', MATH,  MAIN,  MATHORD, '\u2223', SUPERCOMMON);    // >2,000
defineSymbol( '\\mvert', MATH,  MAIN,  REL, '\u2223');
defineSymbol( '\\lvert', MATH,  MAIN,  OPEN, '\u2223', 496);
defineSymbol( '\\rvert', MATH,  MAIN,  CLOSE, '\u2223', 496);
defineSymbol( '\\|', MATH,  MAIN,  TEXTORD, '\u2225');
defineSymbol( '\\Vert', MATH,  MAIN,  TEXTORD, '\u2225', SUPERCOMMON);    // >2,000
defineSymbol( '\\mVert', MATH,  MAIN,  TEXTORD, '\u2225');
defineSymbol( '\\lVert', MATH,  MAIN,  OPEN, '\u2225', 287);
defineSymbol( '\\rVert', MATH,  MAIN,  CLOSE, '\u2225', CRYPTIC);

defineSymbol( '\\lbrack', MATH,  MAIN,  OPEN, '[', 574);
defineSymbol( '\\rbrack', MATH,  MAIN,  CLOSE, ']', 213);
defineSymbol( '\\{', MATH,  MAIN,  OPEN, '{');
defineSymbol( '\\{', TEXT,  MAIN,  TEXTORD, '{');
defineSymbol( '\\}', MATH,  MAIN,  CLOSE, '}');
defineSymbol( '\\}', TEXT,  MAIN,  TEXTORD, '}');


defineSymbol( '(', MATH,  MAIN,  OPEN, '(');
defineSymbol( ')', MATH,  MAIN,  CLOSE, ')');
defineSymbol( '[', MATH,  MAIN,  OPEN, '[');
defineSymbol( ']', MATH,  MAIN,  CLOSE, ']');
defineSymbol( '?', MATH,  MAIN,  TEXTORD, '?');
defineSymbol( '!', MATH,  MAIN,  TEXTORD, '!');

defineSymbol( '\\ulcorner', MATH,  AMS,  OPEN, '\u250c', 296);
defineSymbol( '\\urcorner', MATH,  AMS,  CLOSE, '\u2510', 310);
defineSymbol( '\\llcorner', MATH,  AMS,  OPEN, '\u2514', 137);
defineSymbol( '\\lrcorner', MATH,  AMS,  CLOSE, '\u2518', 199);

// Large Delimiters

defineSymbol( '\\lgroup', MATH,  MAIN,  OPEN, '\u27ee', 24);
defineSymbol( '\\rgroup', MATH,  MAIN,  CLOSE, '\u27ef', 24);
defineSymbol( '\\lmoustache', MATH,  MAIN,  OPEN, '\u23b0', CRYPTIC);
defineSymbol( '\\rmoustache', MATH,  MAIN,  CLOSE, '\u23b1', CRYPTIC);

defineFunction(['\\middle'], '{:delim}', {}, function(name, args) {
    return {type: 'delim', delim: args[0]};
});

// Extra data needed for the delimiter handler down below
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
], '{:delim}', {}, function(name, args) {

    return {
        type: 'sizeddelim',
        size: delimiterSizes[name].size,
        cls: delimiterSizes[name].mclass,
        delim: args[0],
    };
});





// Relations
category = 'Relations';
defineSymbol( '=', MATH,  MAIN,  REL, '=', SUPERCOMMON);
defineSymbol( '\\ne', MATH,  MAIN,  REL, '\u2260', SUPERCOMMON);     // >2,000
defineSymbol( '\\neq', MATH,  MAIN,  REL, '\u2260', COMMON);     // >2,000
// defineSymbol( '\\longequal', MATH,  MAIN,  REL, '\uF7D9');   // NOTE: Not TeX, Mathematica

defineSymbol( '<', MATH,  MAIN,  REL, '<', SUPERCOMMON);     // >2,000
defineSymbol( '\\lt', MATH,  MAIN,  REL, '<', COMMON);     // >2,000
defineSymbol( '>', MATH,  MAIN,  REL, '>', SUPERCOMMON);     // >2,000
defineSymbol( '\\gt', MATH,  MAIN,  REL, '>', COMMON);     // >2,000

defineSymbol( '\\le', MATH,  MAIN,  REL, '\u2264', COMMON);     // >2,000
defineSymbol( '\\ge', MATH,  MAIN,  REL, '\u2265', COMMON);     // >2,000

defineSymbol( '\\leqslant', MATH,  AMS,  REL, '\u2a7d', SUPERCOMMON);              // > 2,000
defineSymbol( '\\geqslant', MATH,  AMS,  REL, '\u2a7e', SUPERCOMMON);              // > 2,000

defineSymbol( '\\leq', MATH,  MAIN,  REL, '\u2264', COMMON);     // >2,000
defineSymbol( '\\geq', MATH,  MAIN,  REL, '\u2265', COMMON);     // >2,000

defineSymbol( '\\ll', MATH,  MAIN,  REL, '\u226a');
defineSymbol( '\\gg', MATH,  MAIN,  REL, '\u226b', COMMON);   // >2,000
defineSymbol( '\\coloneq', MATH,  MAIN,  REL, '\u2254', 5);
defineSymbol( '\\measeq', MATH,  MAIN,  REL, '\u225D');     // MEASSURED BY
defineSymbol( '\\eqdef', MATH,  MAIN,  REL, '\u225E');
defineSymbol( '\\questeq', MATH,  MAIN,  REL, '\u225F');    // QUESTIONED EQUAL TO


defineSymbol( ':', MATH,  MAIN,  REL, ':');
defineSymbol( '\\cong', MATH,  MAIN,  REL, '\u2245', COMMON);     // >2,000

defineSymbol( '\\equiv', MATH,  MAIN,  REL, '\u2261', COMMON);     // >2,000

defineSymbol( '\\prec', MATH,  MAIN,  REL, '\u227a', COMMON);   // >2,000
defineSymbol( '\\preceq', MATH,  MAIN,  REL, '\u2aaf', COMMON); // >2,000
defineSymbol( '\\succ', MATH,  MAIN,  REL, '\u227b', COMMON);     // >2,000
defineSymbol( '\\succeq', MATH,  MAIN,  REL, '\u2ab0', 1916);

defineSymbol( '\\perp', MATH,  MAIN,  REL, '\u22a5', COMMON);              // > 2,000
defineSymbol( '\\parallel', MATH,  MAIN,  REL, '\u2225', COMMON);   // >2,000

defineSymbol( '\\propto', MATH,  MAIN,  REL, '\u221d', COMMON);              // > 2,000
defineSymbol( '\\Colon', MATH,  MAIN,  REL, '\u2237');

defineSymbol( '\\smile', MATH,  MAIN,  REL, '\u2323', COMMON);              // > 2,000
defineSymbol( '\\frown', MATH,  MAIN,  REL, '\u2322', COMMON);              // > 2,000



defineSymbol( '\\sim', MATH,  MAIN,  REL, '\u223c', COMMON);   // >2,000
defineSymbol( '\\gtrsim', MATH,  AMS,  REL, '\u2273', COMMON);   // >2,000


defineSymbol( '\\approx', MATH,  MAIN,  REL, '\u2248', SUPERCOMMON);     // >2,000

defineSymbol( '\\approxeq', MATH,  AMS,  REL, '\u224a', 147);
defineSymbol( '\\thickapprox', MATH,  AMS,  REL, '\u2248', 377);
defineSymbol( '\\lessapprox', MATH,  AMS,  REL, '\u2a85', 146);
defineSymbol( '\\gtrapprox', MATH,  AMS,  REL, '\u2a86', 95);
defineSymbol( '\\precapprox', MATH,  AMS,  REL, '\u2ab7', 50);
defineSymbol( '\\succapprox', MATH,  AMS,  REL, '\u2ab8', CRYPTIC);


defineSymbol( '\\thicksim', MATH,  AMS,  REL, '\u223c', 779);
defineSymbol( '\\succsim', MATH,  AMS,  REL, '\u227f', 251);
defineSymbol( '\\precsim', MATH,  AMS,  REL, '\u227e', 104);
defineSymbol( '\\backsim', MATH,  AMS,  REL, '\u223d', 251);
defineSymbol( '\\eqsim', MATH,  AMS,  REL, '\u2242', 62);
defineSymbol( '\\backsimeq', MATH,  AMS,  REL, '\u22cd', 91);
defineSymbol( '\\simeq', MATH,  MAIN,  REL, '\u2243', CRYPTIC);
defineSymbol( '\\lesssim', MATH,  AMS,  REL, '\u2272', CRYPTIC);

defineSymbol( '\\nleq', MATH,  AMS,  REL, '\u2270', 369);
defineSymbol( '\\ngeq', MATH,  AMS,  REL, '\u2271', 164);

defineSymbol( '\\smallsmile', MATH,  AMS,  REL, '\u2323', 31);
defineSymbol( '\\smallfrown', MATH,  AMS,  REL, '\u2322', 71);
defineSymbol( '\\bowtie', MATH,  MAIN,  REL, '\u22c8', 558);

defineSymbol( '\\asymp', MATH,  MAIN,  REL, '\u224d', 755);

defineSymbol( '\\sqsubseteq', MATH,  MAIN,  REL, '\u2291', 1255);
defineSymbol( '\\sqsupseteq', MATH,  MAIN,  REL, '\u2292', 183);


defineSymbol( '\\leqq', MATH,  AMS,  REL, '\u2266', 1356);
defineSymbol( '\\eqslantless', MATH,  AMS,  REL, '\u2a95', 15);

defineSymbol( '\\lll', MATH,  AMS,  REL, '\u22d8', 157);
defineSymbol( '\\lessgtr', MATH,  AMS,  REL, '\u2276', 281);
defineSymbol( '\\lesseqgtr', MATH,  AMS,  REL, '\u22da', 134);
defineSymbol( '\\lesseqqgtr', MATH,  AMS,  REL, '\u2a8b', CRYPTIC);
defineSymbol( '\\risingdotseq', MATH,  AMS,  REL, '\u2253', 8);
defineSymbol( '\\fallingdotseq', MATH,  AMS,  REL, '\u2252', 99);
defineSymbol( '\\subseteqq', MATH,  AMS,  REL, '\u2ac5', 82);
defineSymbol( '\\Subset', MATH,  AMS,  REL, '\u22d0');
defineSymbol( '\\sqsubset', MATH,  AMS,  REL, '\u228f', 309);
defineSymbol( '\\preccurlyeq', MATH,  AMS,  REL, '\u227c', 549);
defineSymbol( '\\curlyeqprec', MATH,  AMS,  REL, '\u22de', 14);
defineSymbol( '\\vDash', MATH,  AMS,  REL, '\u22a8', 646);
defineSymbol( '\\Vvdash', MATH,  AMS,  REL, '\u22aa', 20);
defineSymbol( '\\bumpeq', MATH,  AMS,  REL, '\u224f', 13);
defineSymbol( '\\Bumpeq', MATH,  AMS,  REL, '\u224e', 12);
defineSymbol( '\\geqq', MATH,  AMS,  REL, '\u2267', 972);
defineSymbol( '\\eqslantgtr', MATH,  AMS,  REL, '\u2a96', 13);
defineSymbol( '\\ggg', MATH,  AMS,  REL, '\u22d9', 127);
defineSymbol( '\\gtrless', MATH,  AMS,  REL, '\u2277', 417);
defineSymbol( '\\gtreqless', MATH,  AMS,  REL, '\u22db', 190);
defineSymbol( '\\gtreqqless', MATH,  AMS,  REL, '\u2a8c', 91);

defineSymbol( '\\supseteqq', MATH,  AMS,  REL, '\u2ac6', 6);
defineSymbol( '\\Supset', MATH,  AMS,  REL, '\u22d1', 34);
defineSymbol( '\\sqsupset', MATH,  AMS,  REL, '\u2290', 71);
defineSymbol( '\\succcurlyeq', MATH,  AMS,  REL, '\u227d', 442);
defineSymbol( '\\curlyeqsucc', MATH,  AMS,  REL, '\u22df', 10);
defineSymbol( '\\Vdash', MATH,  AMS,  REL, '\u22a9', 276);
defineSymbol( '\\shortmid', MATH,  AMS,  REL, '\u2223', 67);
defineSymbol( '\\shortparallel', MATH,  AMS,  REL, '\u2225', 17);
defineSymbol( '\\between', MATH,  AMS,  REL, '\u226c', 110);
defineSymbol( '\\pitchfork', MATH,  AMS,  REL, '\u22d4', 66);
defineSymbol( '\\varpropto', MATH,  AMS,  REL, '\u221d', 203);
defineSymbol( '\\backepsilon', MATH,  AMS,  REL, '\u220d', 176);
defineSymbol( '\\llless', MATH,  AMS,  REL, '\u22d8', CRYPTIC);
defineSymbol( '\\gggtr', MATH,  AMS,  REL, '\u22d9', CRYPTIC);
defineSymbol( '\\lhd', MATH,  AMS,  BIN, '\u22b2', 447);
defineSymbol( '\\rhd', MATH,  AMS,  BIN, '\u22b3', 338);
defineSymbol( '\\Join', MATH,  MAIN,  REL, '\u22c8', 35);

defineSymbol( '\\doteq', MATH,  MAIN,  REL, '\u2250', 1450);
defineSymbol( '\\doteqdot', MATH,  AMS,  REL, '\u2251', 60);
defineSymbol( '\\Doteq', MATH,  AMS,  REL, '\u2251', CRYPTIC);
defineSymbol( '\\eqcirc', MATH,  AMS,  REL, '\u2256', 6);
defineSymbol( '\\circeq', MATH,  AMS,  REL, '\u2257', 31);
defineSymbol( '\\lessdot', MATH,  AMS,  BIN, '\u22d6', 88);
defineSymbol( '\\gtrdot', MATH,  AMS,  BIN, '\u22d7', 45);



category = 'Logic';
defineSymbol( '\\leftrightarrow', MATH,  MAIN,  REL, '\u2194', SUPERCOMMON);    // >2,000
defineSymbol( '\\Leftrightarrow', MATH,  MAIN,  REL, '\u21d4', SUPERCOMMON);    // >2,000
// defineSymbol( '\\iff', MATH,  MAIN,  REL, '\\;\u27fa\\;', SUPERCOMMON);        // >2,000 Note: additional spaces around the arrows
defineSymbol( '\\to', MATH,  MAIN,  REL, '\u2192', SUPERCOMMON);    // >2,000
defineSymbol( '\\models', MATH,  MAIN,  REL, '\u22a8', COMMON);    // >2,000
defineSymbol( '\\vdash', MATH,  MAIN,  REL, '\u22a2', COMMON);    // >2,000

defineSymbol( '\\therefore', MATH,  AMS,  REL, '\u2234', 1129);
defineSymbol( '\\because', MATH,  AMS,  REL, '\u2235', 388);
defineSymbol( '\\implies', MATH,  MAIN,  REL, '\u27f9', 1858);
defineSymbol( '\\gets', MATH,  MAIN,  REL, '\u2190', 150);
defineSymbol( '\\dashv', MATH,  MAIN,  REL, '\u22a3', 299);
defineSymbol( '\\impliedby', MATH,  MAIN,  REL, '\u27f8', CRYPTIC);
defineSymbol( '\\biconditional', MATH,  MAIN,  REL, '\u27f7', CRYPTIC);
defineSymbol( '\\roundimplies', MATH,  MAIN,  REL, '\u2970', CRYPTIC);

// AMS Binary Operators
category = 'Operators';
defineSymbol( '+', MATH,  MAIN,  BIN, '+', SUPERCOMMON); // > 2,000
defineSymbol( '-', MATH,  MAIN,  BIN, '\u2212', SUPERCOMMON); // > 2,000
defineSymbol( '\u2212', MATH,  MAIN,  BIN, '\u2212', SUPERCOMMON); // > 2,000
defineSymbol( '\\pm', MATH,  MAIN,  BIN, '\u00b1', COMMON); // > 2,000
defineSymbol( '\\mp', MATH,  MAIN,  BIN, '\u2213', COMMON); // > 2,000
defineSymbol( '*', MATH,  MAIN,  BIN, '\u2217', COMMON); // > 2,000
defineSymbol( '\\times', MATH,  MAIN,  BIN, '\u00d7', COMMON); // > 2,000
defineSymbol( '\\div', MATH,  MAIN,  BIN, '\u00f7', COMMON); // > 2,000
defineSymbol( '\\surd', MATH,  MAIN,  TEXTORD, '\u221a', COMMON); // > 2,000

defineSymbol( '\\divides', MATH,  MAIN,  BIN, '\u2223', CRYPTIC);
    // From MnSymbol package


defineSymbol( '\\ltimes', MATH,  AMS,  BIN, '\u22c9', 576);
defineSymbol( '\\rtimes', MATH,  AMS,  BIN, '\u22ca', 946);
defineSymbol( '\\leftthreetimes', MATH,  AMS,  BIN, '\u22cb', 34);
defineSymbol( '\\rightthreetimes', MATH,  AMS,  BIN, '\u22cc', 14);
defineSymbol( '\\intercal', MATH,  AMS,  BIN, '\u22ba', 478);
defineSymbol( '\\dotplus', MATH,  AMS,  BIN, '\u2214', 81);
defineSymbol( '\\centerdot', MATH,  AMS,  BIN, '\u22c5', 271);
defineSymbol( '\\doublebarwedge', MATH,  AMS,  BIN, '\u2a5e', 5);
defineSymbol( '\\divideontimes', MATH,  AMS,  BIN, '\u22c7', 51);
defineSymbol( '\\cdot', MATH,  MAIN,  BIN, '\u22c5', CRYPTIC);


category = 'Others';
defineSymbol( '\\infty', MATH,  MAIN,  TEXTORD, '\u221e', SUPERCOMMON);    // >2,000
defineSymbol( '\\prime', MATH,  MAIN,  ORD, '\u2032', SUPERCOMMON);    // >2,000
defineSymbol( '\\doubleprime', MATH,  MAIN,  TEXTORD, '\u2033');   // NOTE: Not in TeX, but Mathematica
defineSymbol( '\\angle', MATH,  MAIN,  TEXTORD, '\u2220', COMMON);    // >2,000
defineSymbol( '`', MATH,  MAIN,  TEXTORD, '\u2018');
defineSymbol( '\\$', MATH,  MAIN,  TEXTORD, '$');
defineSymbol( '\\$', TEXT,  MAIN,  TEXTORD, '$');
defineSymbol( '\\%', MATH,  MAIN,  TEXTORD, '%');
defineSymbol( '\\%', TEXT,  MAIN,  TEXTORD, '%');
defineSymbol( '\\_', MATH,  MAIN,  TEXTORD, '_');
defineSymbol( '\\_', TEXT,  MAIN,  TEXTORD, '_');

category = 'Greek';
// Note: In TeX, greek symbols are only available in Math mode
defineSymbol( '\\alpha',  MATH,  MAIN,  ORD, '\u03b1', COMMON);    // >2,000
defineSymbol( '\\beta', MATH,  MAIN,  ORD, '\u03b2', COMMON);    // >2,000
defineSymbol( '\\gamma', MATH,  MAIN,  ORD, '\u03b3', COMMON);    // >2,000
defineSymbol( '\\delta', MATH,  MAIN,  ORD, '\u03b4', COMMON);    // >2,000
defineSymbol( '\\epsilon', MATH,  MAIN,  ORD, '\u03f5', COMMON);    // >2,000
defineSymbol( '\\varepsilon', MATH,  MAIN,  ORD, '\u03b5');
defineSymbol( '\\zeta', MATH,  MAIN,  ORD, '\u03b6', COMMON);    // >2,000
defineSymbol( '\\eta', MATH,  MAIN,  ORD, '\u03b7', COMMON);    // >2,000
defineSymbol( '\\theta', MATH,  MAIN,  ORD, '\u03b8', COMMON);    // >2,000
defineSymbol( '\\vartheta', MATH,  MAIN,  ORD, '\u03d1', COMMON);    // >2,000
defineSymbol( '\\iota', MATH,  MAIN,  ORD, '\u03b9', COMMON);    // >2,000
defineSymbol( '\\kappa', MATH,  MAIN,  ORD, '\u03ba', COMMON);    // >2,000
defineSymbol( '\\varkappa', MATH,  AMS,  ORD, '\u03f0', COMMON);    // >2,000
defineSymbol( '\\lambda', MATH,  MAIN,  ORD, '\u03bb', COMMON);    // >2,000
defineSymbol( '\\mu', MATH,  MAIN,  ORD, '\u03bc', COMMON);    // >2,000
defineSymbol( '\\nu', MATH,  MAIN,  ORD, '\u03bd', COMMON);    // >2,000
defineSymbol( '\\xi', MATH,  MAIN,  ORD, '\u03be', COMMON);    // >2,000
defineSymbol( '\\omicron', MATH,  MAIN,  ORD, 'o');
defineSymbol( '\\pi', MATH,  MAIN,  ORD, '\u03c0', COMMON);    // >2,000
defineSymbol( '\\varpi', MATH,  MAIN,  ORD, '\u03d6', COMMON);    // >2,000
defineSymbol( '\\rho', MATH,  MAIN,  ORD, '\u03c1', COMMON);    // >2,000
defineSymbol( '\\varrho', MATH,  MAIN,  ORD, '\u03f1', COMMON);    // >2,000
defineSymbol( '\\sigma', MATH,  MAIN,  ORD, '\u03c3', COMMON);    // >2,000
defineSymbol( '\\varsigma', MATH,  MAIN,  ORD, '\u03c2', COMMON);    // >2,000
defineSymbol( '\\tau', MATH,  MAIN,  ORD, '\u03c4', COMMON);    // >2,000
defineSymbol( '\\phi', MATH,  MAIN,  ORD, '\u03d5', COMMON);    // >2,000
defineSymbol( '\\varphi', MATH,  MAIN,  ORD, '\u03c6', COMMON);    // >2,000
defineSymbol( '\\upsilon', MATH,  MAIN,  ORD, '\u03c5', COMMON);    // >2,000
defineSymbol( '\\chi', MATH,  MAIN,  ORD, '\u03c7', COMMON);    // >2,000
defineSymbol( '\\psi', MATH,  MAIN,  ORD, '\u03c8', COMMON);    // >2,000
defineSymbol( '\\omega', MATH,  MAIN,  ORD, '\u03c9', COMMON);    // >2,000

defineSymbol( '\\Gamma', MATH,  MAIN,  ORD, '\u0393', COMMON);    // >2,000
defineSymbol( '\\Delta', MATH,  MAIN,  ORD, '\u0394', COMMON);    // >2,000
defineSymbol( '\\Theta', MATH,  MAIN,  ORD, '\u0398', COMMON);    // >2,000
defineSymbol( '\\Lambda', MATH,  MAIN,  ORD, '\u039b', COMMON);    // >2,000
defineSymbol( '\\Xi', MATH,  MAIN,  ORD, '\u039e', COMMON);    // >2,000
defineSymbol( '\\Pi', MATH,  MAIN,  ORD, '\u03a0', COMMON);    // >2,000
defineSymbol( '\\Sigma', MATH,  MAIN,  ORD, '\u03a3', COMMON);    // >2,000
defineSymbol( '\\Upsilon', MATH,  MAIN,  ORD, '\u03a5', COMMON);    // >2,000
defineSymbol( '\\Phi', MATH,  MAIN,  ORD, '\u03a6', COMMON);    // >2,000
defineSymbol( '\\Psi', MATH,  MAIN,  ORD, '\u03a8', COMMON);    // >2,000
defineSymbol( '\\Omega', MATH,  MAIN,  ORD, '\u03a9', COMMON);    // >2,000

// AMS Greek
defineSymbol( '\\digamma', MATH,  AMS,  ORD, '\u03dd', 248);

category = 'Others';
defineSymbol( '\\emptyset', [TEXT, MATH],  MAIN,  TEXTORD, '\u2205', SUPERCOMMON);    // >2,000
defineSymbol( '\\varnothing', [TEXT, MATH],  AMS,  TEXTORD, '\u2205', SUPERCOMMON);    // >2,000



category = 'Set Operators';
defineSymbol( '\\cap', MATH,  MAIN,  BIN, '\u2229', SUPERCOMMON);
defineSymbol( '\\cup', MATH,  MAIN,  BIN, '\u222a', SUPERCOMMON);
defineSymbol( '\\setminus', MATH,  MAIN,  BIN, '\u2216', COMMON);    // >2,000
defineSymbol( '\\smallsetminus', MATH,  AMS,  BIN, '\u2216', 254);
defineSymbol( '\\complement', MATH,  AMS,  TEXTORD, '\u2201', 200);

category = 'Set Relations';
defineSymbol( '\\in', MATH,  MAIN,  REL, '\u2208', SUPERCOMMON);    // >2,000
defineSymbol( '\\notin', MATH,  MAIN,  REL, '\u2209', SUPERCOMMON);    // >2,000
defineSymbol( '\\not', MATH,  MAIN,  REL, '\u0338', COMMON);
defineSymbol( '\\ni', MATH,  MAIN,  REL, '\u220b', COMMON);    // >2,000
defineSymbol( '\\owns', MATH,  MAIN,  REL, '\u220b', 18);
defineSymbol( '\\subset', MATH,  MAIN,  REL, '\u2282', SUPERCOMMON);    // >2,000
defineSymbol( '\\supset', MATH,  MAIN,  REL, '\u2283', SUPERCOMMON);    // >2,000
defineSymbol( '\\subseteq', MATH,  MAIN,  REL, '\u2286', SUPERCOMMON);    // >2,000
defineSymbol( '\\supseteq', MATH,  MAIN,  REL, '\u2287', SUPERCOMMON);    // >2,000
defineSymbol( '\\subsetneq', MATH,  AMS,  REL, '\u228a', 1945);
defineSymbol( '\\varsubsetneq', MATH,  AMS,  REL, '\ue01a', 198);
defineSymbol( '\\subsetneqq', MATH,  AMS,  REL, '\u2acb', 314);
defineSymbol( '\\varsubsetneqq', MATH,  AMS,  REL, '\ue017', 55);
defineSymbol( '\\nsubset', MATH,  AMS,  REL, '\u2284', CRYPTIC);    // NOTE: Not TeX?
defineSymbol( '\\nsupset', MATH,  AMS,  REL, '\u2285', CRYPTIC);    // NOTE: Not TeX?
defineSymbol( '\\nsubseteq', MATH,  AMS,  REL, '\u2288', 950);
defineSymbol( '\\nsupseteq', MATH,  AMS,  REL, '\u2289', 49);


category = 'Spacing';
// See http://tex.stackexchange.com/questions/41476/lengths-and-when-to-use-them
defineSymbol( '\\ ', MATH,  MAIN,  SPACING, '\u00a0');
defineSymbol( '~', MATH,  MAIN,  SPACING, '\u00a0');
defineSymbol( '\\space', MATH,  MAIN,  SPACING, '\u00a0');
defineSymbol( '\\nobreakspace', [TEXT, MATH],  MAIN,  SPACING, '\u00a0');

defineSymbol( '\\!', MATH,  MAIN,  SPACING, null);
defineSymbol( '\\,', MATH, MAIN,  SPACING,  null);
defineSymbol( '\\:', MATH,  MAIN,  SPACING, null);
defineSymbol( '\\;', MATH,  MAIN,  SPACING, null);
defineSymbol( '\\enskip', MATH,  MAIN,  SPACING, null);
// \enspace is a TeX command (not LaTeX) equivalent to a \skip
defineSymbol( '\\enspace', MATH,  MAIN,  SPACING, null, 672);
defineSymbol( '\\quad', MATH,  MAIN,  SPACING, null, COMMON);    // >2,000
defineSymbol( '\\qquad', MATH,  MAIN,  SPACING, null, COMMON);    // >2,000

defineFunction([
    '\\hspace', '\\hspace*'
    // \hspace* inserts a non-breakable space, but since we don't line break...
    // it's the same as \hspace.
], '{width:skip}', null, function(name, args) {
    return { 
        type: 'spacing',
        width: args[0] || 0
    }
});


/**
 * If possible, i.e. if they are all simple atoms, return a string made up of 
 * their body
 * @param {object[]} atoms 
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
        isFunction: true
    };

    if (name === '\\operatorname') {
        result.limits = 'nolimits'
    } else if (name === '\\operatorname*') {
        result.limits = 'limits';
    }

    return result;
})



category = 'Ignore';        // Do not document...
defineSymbol( ' ', TEXT,  MAIN,  SPACING, '\u00a0');


// Punctuation
category = 'Punctuation';
defineSymbol( '\\colon', MATH,  MAIN,  PUNCT, ':', COMMON);    // >2,000
defineSymbol( '\\cdotp', MATH,  MAIN,  PUNCT, '\u22c5', COMMON); // >2,000
defineSymbol( '\\ldots', TEXT,  MAIN,  INNER, '\u2026', COMMON);    // >2,000
defineSymbol( '\\ldots', MATH,  MAIN,  INNER, '\u2026', COMMON);    // >2,000
defineSymbol( '\\cdots', MATH,  MAIN,  INNER, '\u22ef', COMMON);    // >2,000
defineSymbol( '\\ddots', MATH,  MAIN,  INNER, '\u22f1', COMMON);    // >2,000
defineSymbol( '\\mathellipsis', MATH,  MAIN,  INNER, '\u2026', 91);
defineSymbol( '\\textellipsis', TEXT,  MAIN,  INNER, '\u2026', 12);
defineSymbol( '\\vdots', MATH,  MAIN,  TEXTORD, '\u22ee', COMMON);    // >2,000
defineSymbol( '\\ldotp', MATH,  MAIN,  PUNCT, '\u002e', 18);
defineSymbol( ',', MATH, MAIN, PUNCT,  ',');
defineSymbol( ';', MATH,  MAIN,  PUNCT, ';');
defineSymbol( '--', TEXT,  MAIN,  TEXTORD, '\u2013');
defineSymbol( '---', TEXT,  MAIN,  TEXTORD, '\u2014');


category = 'Logical Operators';
defineSymbol( '\\wedge', MATH,  MAIN,  BIN, '\u2227', SUPERCOMMON);    // >2,000
defineSymbol( '\\vee', MATH,  MAIN,  BIN, '\u2228', SUPERCOMMON);    // >2,000

defineSymbol( '\\lnot', MATH,  MAIN,  TEXTORD, '\u00ac', COMMON);   // >2,000
defineSymbol( '\\neg', MATH,  MAIN,  TEXTORD, '\u00ac', SUPERCOMMON);   // >2,000

defineSymbol( '\\land', MATH,  MAIN,  BIN, '\u2227', 659);
defineSymbol( '\\lor', MATH,  MAIN,  BIN, '\u2228', 364);
defineSymbol( '\\barwedge', MATH,  AMS,  BIN, '\u22bc', 21);
defineSymbol( '\\veebar', MATH,  AMS,  BIN, '\u22bb', 43);
defineSymbol( '\\nor', MATH,  AMS,  BIN, '\u22bb', 7);           // NOTE: Not TeX, Mathematica
defineSymbol( '\\curlywedge', MATH,  AMS,  BIN, '\u22cf', 58);
defineSymbol( '\\curlyvee', MATH,  AMS,  BIN, '\u22ce', 57);

category = 'Boxes';
defineSymbol( '\\square', MATH,  AMS,  TEXTORD, '\u25a1', COMMON);  // >2,000
defineSymbol( '\\Box', MATH,  AMS,  TEXTORD, '\u25a1', COMMON);  // >2,000
defineSymbol( '\\blacksquare', MATH,  AMS,  TEXTORD, '\u25a0', 1679);
defineSymbol( '\\boxminus', MATH,  AMS,  BIN, '\u229f', 79);
defineSymbol( '\\boxplus', MATH,  AMS,  BIN, '\u229e', 276);
defineSymbol( '\\boxtimes', MATH,  AMS,  BIN, '\u22a0', 457);
defineSymbol( '\\boxdot', MATH,  AMS,  BIN, '\u22a1', 120);

category = 'Circles';
defineSymbol( '\\circ', MATH,  MAIN,  BIN, '\u2218', SUPERCOMMON);  // >2,000
defineSymbol( '\\bigcirc', MATH,  MAIN,  BIN, '\u25ef', 903);
defineSymbol( '\\bullet', MATH,  MAIN,  BIN, '\u2219', COMMON); // >2,000
defineSymbol( '\\circleddash', MATH,  AMS,  BIN, '\u229d', COMMON);     // >2,000
defineSymbol( '\\circledast', MATH,  AMS,  BIN, '\u229b', 339);
defineSymbol( '\\oplus', MATH,  MAIN,  BIN, '\u2295', COMMON); // >2,000
defineSymbol( '\\ominus', MATH,  MAIN,  BIN, '\u2296', 1568);
defineSymbol( '\\otimes', MATH,  MAIN,  BIN, '\u2297', COMMON);   // >2,000
defineSymbol( '\\odot', MATH,  MAIN,  BIN, '\u2299', COMMON);   // >2,000
defineSymbol( '\\circledcirc', MATH,  AMS,  BIN, '\u229a', 93);
defineSymbol( '\\oslash', MATH,  MAIN,  BIN, '\u2298', 497);
defineSymbol( '\\circledS', MATH,  AMS,  TEXTORD, '\u24c8', 31);
defineSymbol( '\\circledR', MATH,  AMS,  TEXTORD, '\u00ae', 1329);


category = 'Triangles';
defineSymbol( '\\triangle', MATH,  MAIN,  TEXTORD, '\u25b3', COMMON);   // > 2,000
defineSymbol( '\\triangleq', MATH,  AMS,  REL, '\u225c', COMMON);  // >2,000
defineSymbol( '\\bigtriangleup', MATH,  MAIN,  BIN, '\u25b3', 1773);
defineSymbol( '\\vartriangle', MATH,  AMS,  REL, '\u25b3', 762);

defineSymbol( '\\triangledown', MATH,  AMS,  TEXTORD, '\u25bd', 520);
defineSymbol( '\\bigtriangledown', MATH,  MAIN,  BIN, '\u25bd', 661);

defineSymbol( '\\triangleleft', MATH,  MAIN,  BIN, '\u25c3', 534);
defineSymbol( '\\vartriangleleft', MATH,  AMS,  REL, '\u22b2', 281);
defineSymbol( '\\trianglelefteq', MATH,  AMS,  REL, '\u22b4', 176);
defineSymbol( '\\ntriangleleft', MATH,  AMS,  REL, '\u22ea', 13);
defineSymbol( '\\ntrianglelefteq', MATH,  AMS,  REL, '\u22ec', 22);

defineSymbol( '\\triangleright', MATH,  MAIN,  BIN, '\u25b9', 516);
defineSymbol( '\\vartriangleright', MATH,  AMS,  REL, '\u22b3', 209);
defineSymbol( '\\trianglerighteq', MATH,  AMS,  REL, '\u22b5', 45);
defineSymbol( '\\ntriangleright', MATH,  AMS,  REL, '\u22eb', 15);
defineSymbol( '\\ntrianglerighteq', MATH,  AMS,  REL, '\u22ed', 6);

defineSymbol( '\\blacktriangle', MATH,  AMS,  TEXTORD, '\u25b2', 360);
defineSymbol( '\\blacktriangledown', MATH,  AMS,  TEXTORD, '\u25bc', 159);
defineSymbol( '\\blacktriangleleft', MATH,  AMS,  REL, '\u25c0', 101);
defineSymbol( '\\blacktriangleright', MATH,  AMS,  REL, '\u25b6', 271);



category = 'Others';
defineSymbol( '\\backslash', [TEXT, MATH],  MAIN,  ORD, '\\');
defineSymbol( '|', MATH,  MAIN,  TEXTORD, '\u2223');


category = 'Big Operators';
defineSymbol( '\\sqcup', MATH,  MAIN,  BIN, '\u2294', 1717);        // 63
defineSymbol( '\\sqcap', MATH,  MAIN,  BIN, '\u2293', 735);         // 38
defineSymbol( '\\uplus', MATH,  MAIN,  BIN, '\u228e', 597);
defineSymbol( '\\wr', MATH,  MAIN,  BIN, '\u2240', 286);
defineSymbol( '\\Cap', MATH,  AMS,  BIN, '\u22d2', 2);
defineSymbol( '\\Cup', MATH,  AMS,  BIN, '\u22d3', 2);
defineSymbol( '\\doublecap', MATH,  AMS,  BIN, '\u22d2', 1);
defineSymbol( '\\doublecup', MATH,  AMS,  BIN, '\u22d3', 1);
defineSymbol( '\\amalg', MATH,  MAIN,  BIN, '\u2a3f', CRYPTIC);
defineSymbol( '\\And', MATH,  MAIN,  BIN, '\u0026');

category = 'Accents';
// defineSymbol( '\\bar', MATH,  MAIN,  ACCENT, '\u00af', COMMON);    // >2,000


// defineSymbol( '\\vec', MATH,  MAIN,  ACCENT, '\u20d7');
// defineSymbol( '\\hat', MATH,  MAIN,  ACCENT, '\u005e');
// defineSymbol( '\\dot', MATH,  MAIN,  ACCENT, '\u02d9');

// defineSymbol( '\\ddot', MATH,  MAIN,  ACCENT, '\u00a8', COMMON);    // >2,000

// defineSymbol( '\\acute', MATH,  MAIN,  ACCENT, '\u00b4', COMMON);    // >2,000
// defineSymbol( '\\tilde', MATH,  MAIN,  ACCENT, '\u007e', COMMON);    // >2,000
// defineSymbol( '\\check', MATH,  MAIN,  ACCENT, '\u02c7', COMMON);    // >2,000
// defineSymbol( '\\breve', MATH,  MAIN,  ACCENT, '\u02d8', 1548);
// defineSymbol( '\\grave', MATH,  MAIN,  ACCENT, '\u0060', 735);

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
defineSymbol( '\\imath', MATH,  MAIN,  MATHORD, '\u0131');
defineSymbol( '\\jmath', MATH,  MAIN,  MATHORD, '\u0237');

category = 'Others';
defineSymbol( '`', TEXT,  MAIN,  TEXTORD, '\u2018');
defineSymbol( "'", TEXT,  MAIN,  TEXTORD, '\u2019');
defineSymbol( '``', TEXT,  MAIN,  TEXTORD, '\u201c');
defineSymbol( "''", TEXT,  MAIN,  TEXTORD, '\u201d');
defineSymbol( '\\degree', MATH,  MAIN,  TEXTORD, '\u00b0', 46);
defineSymbol( '\\degree', TEXT,  MAIN,  TEXTORD, '\u00b0', 46);

category = 'Others';
defineSymbol( "'", MATH,  MAIN,  TEXTORD, '\u2032');        // Prime
defineSymbol( '"', MATH,  MAIN,  TEXTORD, '\u201D');       // Double Prime
// defineSymbol( "\'', MATH,  MAIN,  TEXTORD, '\u2033');       // Double Prime

category = '';
// Some characters allowed in math mode (along all the others above for MATH mode)
defineSymbols('0123456789/@.', MATH, MAIN, MATHORD);

// List of characters allowed when in TEXT mode (e.g. inside a \text{})
defineSymbols('0123456789!@*()-=+[]";:?/.,', TEXT, MAIN, TEXTORD);

// List of characters allowed to be entered when in COMMAND mode:
defineSymbols("0123456789!@*()-=+{}[]\\';:?/.,~<>`|'$%#&^_\" ", COMMAND, MAIN, COMMANDLITERAL);

// a-z
defineSymbolRange(0x0041, 0x005A, MATH, MAIN, MATHORD);
defineSymbolRange(0x0041, 0x005A, COMMAND, MAIN, COMMANDLITERAL);

// A-Z
defineSymbolRange(0x0061, 0x007A, MATH, MAIN, MATHORD);
defineSymbolRange(0x0061, 0x007A, COMMAND, MAIN, COMMANDLITERAL);


// Unicode versions of some characters
defineSymbol('–', TEXT, MAIN, TEXTORD, '\u2013');   // EN DASH
defineSymbol('—', TEXT, MAIN, TEXTORD, '\u2014');   // EM DASH
defineSymbol('‘', TEXT, MAIN, TEXTORD, '\u2018');   // LEFT SINGLE QUOTATION MARK
defineSymbol('’', TEXT, MAIN, TEXTORD, '\u2019');   // RIGHT SINGLE QUOTATION MARK
defineSymbol('“', TEXT, MAIN, TEXTORD, '\u201C');   // LEFT DOUBLE QUOTATION MARK
defineSymbol('”', TEXT, MAIN, TEXTORD, '\u201D');   // RIGHT DOUBLE QUOTATION MARK
defineSymbol('"', TEXT, MAIN, TEXTORD, '\u201D');   // DOUBLE PRIME

// From plain.tex
category = 'Others';
defineSymbol('\\%', TEXT + MATH, MAIN, TEXTORD, '%');          // PERCENT
defineSymbol('\\&', TEXT + MATH, MAIN, TEXTORD, '\u0026');     // AMPERSAND
// defineSymbol('\\#', TEXT + MATH, MAIN, TEXTORD, '\u00A3');     // POUND SIGN
defineSymbol('\\$', TEXT + MATH, MAIN, TEXTORD, '$');
defineSymbol('\\ss', TEXT, MAIN, TEXTORD, '\u00df');          // LATIN SMALL LETTER SHARP S
defineSymbol('\\ae', TEXT, MAIN, TEXTORD, '\u00E6');    // LATIN SMALL LETTER AE
defineSymbol('\\oe', TEXT, MAIN, TEXTORD, '\u0153');    // LATIN SMALL LIGATURE OE
defineSymbol('\\AE', TEXT, MAIN, TEXTORD, '\u00c6');    // LATIN CAPITAL LETTER AE
defineSymbol('\\OE', TEXT, MAIN, TEXTORD, '\u0152');    // LATIN CAPITAL LIGATURE OE
defineSymbol('\\O', TEXT, MAIN, TEXTORD, '\u00d8');     // LATIN CAPITAL LETTER O WITH STROKE
defineSymbol('\\i', TEXT + MATH, MAIN, TEXTORD, '\u0131');     // LATIN SMALL LETTER DOTLESS I
defineSymbol('\\j', TEXT + MATH, MAIN, TEXTORD, '\u0237');     // LATIN SMALL LETTER DOTLESS J
defineSymbol('\\aa', TEXT + MATH, MAIN, TEXTORD, '\u00e5');    // LATIN SMALL LETTER A WITH RING ABOVE
defineSymbol('\\AA', TEXT + MATH, MAIN, TEXTORD, '\u00c5');    // LATIN CAPITAL LETTER A WITH RING ABOVE



return {
    matchCodepoint,
    matchSymbol,
    matchFunction,
    unicodeToMathVariant,
    mathVariantToUnicode,
    codepointToLatex,
    unicodeStringToLatex,
    getInfo,
    getValue,
    getFontName,
    getEnvironmentInfo,
    suggest,
    FREQUENCY_VALUE,
    TEXT_SYMBOLS,
    MATH_SYMBOLS,
    COMMAND_SYMBOLS,
    ENVIRONMENTS,

    RIGHT_DELIM,
    FUNCTIONS,
    MACROS,
}

})