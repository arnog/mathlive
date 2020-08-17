import { isArray } from '../common/types';

import type { Atom } from '../core/atom';

const SPECIAL_IDENTIFIERS = {
    '\u2212': '-', // MINUS SIGN
    '-': '-',
    '\\alpha': 'alpha',
    '\\beta': 'beta',
    '\\gamma': 'gamma',
    '\\delta': 'delta',
    '\\epsilon': 'epsilon',
    '\\varepsilon': 'varepsilon',
    '\\zeta': 'zeta',
    '\\eta': 'eta',
    '\\theta': 'theta',
    '\\vartheta': 'vartheta',
    '\\iota': 'iota',
    '\\kappa': 'kappa',
    '\\lambda': 'lambda',
    '\\mu': 'mu',
    '\\nu': 'nu',
    '\\xi': 'xi',
    '\\pi': 'pi',
    '\\rho': 'rho',
    '\\sigma': 'sigma',
    '\\tau': 'tau',
    '\\upsilon': 'upsilon',
    '\\phi': 'phi',
    '\\varphi': 'varphi',
    '\\chi': 'chi',
    '\\psi': 'psi',
    '\\omega': 'omega',
    '\\Gamma': 'Gamma',
    '\\Delta': 'Delta',
    '\\Theta': 'Theta',
    '\\Lambda': 'Lambda',
    '\\Xi': 'Xi',
    '\\Pi': 'Pi',
    '\\Sigma': 'Sigma',
    '\\Phi': 'Phi',
    '\\Psi': 'Psi',
    '\\Omega': 'Omega',
};

const SPECIAL_OPERATORS = {
    '\\pm': '+-',
    '\\times': 'xx',
    '\\colon': ':',
    '\\vert': '|',
    '\\Vert': '||',
    '\\mid': '|',
    '\\lbrace': '{',
    '\\rbrace': '}',
    '\\langle': '(:',
    '\\rangle': ':)',
    // '\\lfloor': '\u230a',
    // '\\rfloor': '\u230b',
    // '\\lceil': '\u2308',
    // '\\rceil': '\u2309',

    // '\\vec': '&#x20d7;',
    // '\\acute': '&#x00b4;',
    // '\\grave': '&#x0060;',
    // '\\dot': '&#x02d9;',
    // '\\ddot': '&#x00a8;',
    // '\\tilde': '&#x007e;',
    // '\\bar': '&#x00af;',
    // '\\breve': '&#x02d8;',
    // '\\check': '&#x02c7;',
    // '\\hat': '&#x005e;'
};

export function atomToAsciiMath(atom: Atom | Atom[]): string {
    if (!atom) return '';
    if (isArray(atom)) {
        let result = '';
        if (atom.length === 0) return '';
        if (atom[0].type === 'first') atom = atom.slice(1);
        if (atom.length === 0) return '';
        if (atom[0].mode === 'text') {
            // Text mode... put it in (ASCII) quotes
            let i = 0;
            result = '"';
            while (atom[i] && atom[i].mode === 'text') {
                result += atom[i].body;
                i++;
            }
            result += '"' + atomToAsciiMath(atom.slice(i));
        } else if (atom[0].mode === 'math') {
            let i = 0;
            while (atom[i] && atom[i].mode === 'math') {
                result += atomToAsciiMath(atom[i]);
                i++;
            }
            result += atomToAsciiMath(atom.slice(i));
        } else {
            console.warn('toASCIIMath: Unexpected mode');
        }
        return result.trim();
    }

    if (atom.mode === 'text') {
        return '"' + atom.body + '"'; // text -- add in (ASCII) quotes
    }

    let result = '';
    const command = atom.symbol;
    let m;

    switch (atom.type) {
        case 'group':
        case 'root':
            result = atomToAsciiMath(atom.body as Atom[]);
            break;

        case 'array':
            break;

        case 'genfrac':
            if (atom.leftDelim || atom.rightDelim) {
                result +=
                    atom.leftDelim === '.' || !atom.leftDelim
                        ? '{:'
                        : atom.leftDelim;
            }
            if (atom.hasBarLine) {
                result += '(';
                result += atomToAsciiMath(atom.numer);
                result += ')/(';
                result += atomToAsciiMath(atom.denom);
                result += ')';
            } else {
                // No bar line, i.e. \choose, etc...
                result += '(' + atomToAsciiMath(atom.numer) + '),';
                result += '(' + atomToAsciiMath(atom.denom) + ')';
            }
            if (atom.leftDelim || atom.rightDelim) {
                result +=
                    atom.rightDelim === '.' || !atom.rightDelim
                        ? '{:'
                        : atom.rightDelim;
            }
            break;

        case 'surd':
            if (atom.index) {
                result +=
                    'root(' +
                    atomToAsciiMath(atom.index) +
                    ')(' +
                    atomToAsciiMath(atom.body as Atom[]) +
                    ')';
            } else {
                result += 'sqrt(' + atomToAsciiMath(atom.body as Atom[]) + ')';
            }
            break;

        case 'leftright':
            result +=
                atom.leftDelim === '.' || !atom.leftDelim
                    ? '{:'
                    : atom.leftDelim;
            result += atomToAsciiMath(atom.body as Atom[]);
            result +=
                atom.rightDelim === '.' || !atom.rightDelim
                    ? ':}'
                    : atom.rightDelim;
            break;

        case 'sizeddelim':
        case 'delim':
            // result += '<mo separator="true"' + makeID(atom.id, options) + '>' + (SPECIAL_OPERATORS[atom.delim] || atom.delim) + '</mo>';
            break;

        case 'overlap':
            break;

        case 'overunder':
            break;

        case 'mord':
            // @todo, deal with some special identifiers: \alpha, etc...
            result =
                SPECIAL_IDENTIFIERS[command] ||
                command ||
                (typeof atom.body === 'string' ? atom.body : '');
            if (result[0] === '\\') result = String(result);
            m = command
                ? command.match(/[{]?\\char"([0-9abcdefABCDEF]*)[}]?/)
                : null;
            if (m) {
                // It's a \char command
                result = String.fromCharCode(parseInt('0x' + m[1]));
            } else if (result.length > 0 && result.charAt(0) === '\\') {
                // atom is an identifier with no special handling. Use the
                // Unicode value
                if (typeof atom.body === 'string') {
                    result = atom.body.charAt(0);
                } else {
                    result = atom.symbol;
                }
            }
            // result = '<mi' + variant + makeID(atom.id, options) + '>' + xmlEscape(result) + '</mi>';
            break;

        case 'mbin':
        case 'mrel':
        case 'textord':
        case 'minner':
            if (command && SPECIAL_IDENTIFIERS[command]) {
                // Some 'textord' are actually identifiers. Check them here.
                result = SPECIAL_IDENTIFIERS[command];
            } else if (command && SPECIAL_OPERATORS[command]) {
                result = SPECIAL_OPERATORS[command];
            } else {
                result = atom.body as string;
            }
            break;

        case 'mopen':
        case 'mclose':
            result += atom.body;
            break;

        case 'mpunct':
            result = SPECIAL_OPERATORS[command] || command;
            break;

        case 'mop':
            if (atom.body !== '\u200b') {
                // Not ZERO-WIDTH
                result = '';
                if (command === '\\operatorname') {
                    result += atomToAsciiMath(atom.body as Atom[]);
                } else {
                    result += atom.body || command;
                }
                result += ' ';
            }
            break;

        case 'mathstyle':
            break;

        case 'box':
            break;

        case 'spacing':
            break;

        case 'enclose':
            break;

        case 'space':
            result = ' ';
            break;
    }
    // Subscripts before superscripts (according to the ASCIIMath spec)
    if (atom.subscript) {
        result += '_';
        const arg = atomToAsciiMath(atom.subscript);
        if (arg.length > 1 && !/^(-)?\d+(\.\d*)?$/.test(arg)) {
            result += '(' + arg + ')';
        } else {
            result += arg;
        }
    }

    if (atom.superscript) {
        result += '^';
        const arg = atomToAsciiMath(atom.superscript);
        if (arg.length > 1 && !/^(-)?\d+(\.\d*)?$/.test(arg)) {
            result += '(' + arg + ')';
        } else {
            result += arg;
        }
    }

    return result;
}
