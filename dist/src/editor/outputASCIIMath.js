const SPECIAL_IDENTIFIERS = {
    '\u2212':       '-',  // MINUS SIGN
    '-':            '-', 
    '\\alpha':      'alpha',
    '\\beta':       'beta',
    '\\gamma':      'gamma',
    '\\delta':      'delta',
    '\\epsilon':    'epsilon',
    '\\varepsilon': 'varepsilon',
    '\\zeta':       'zeta',
    '\\eta':        'eta',
    '\\theta':      'theta',
    '\\vartheta':   'vartheta',
    '\\iota':       'iota',
    '\\kappa':      'kappa',
    '\\lambda':     'lambda',
    '\\mu':         'mu',
    '\\nu':         'nu',
    '\\xi':         'xi',
    '\\pi':         'pi',
    '\\rho':        'rho',
    '\\sigma':      'sigma',
    '\\tau':        'tau',
    '\\upsilon':    'upsilon',
    '\\phi':        'phi',
    '\\varphi':     'varphi',
    '\\chi':        'chi',
    '\\psi':        'psi',
    '\\omega':      'omega',
    '\\Gamma':      'Gamma',
    '\\Delta':      'Delta',
    '\\Theta':      'Theta',
    '\\Lambda':     'Lambda',
    '\\Xi':         'Xi',
    '\\Pi':         'Pi',
    '\\Sigma':      'Sigma',
    '\\Phi':        'Phi',
    '\\Psi':        'Psi',
    '\\Omega':      'Omega',
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

export function toASCIIMath(atom, options){
    if (!atom) return '';
    if (Array.isArray(atom)) {
        let result = '';
        if (atom.length === 0) return '';
        if (atom[0].type === 'first') atom.shift();
        if (atom[0].mode === 'text') {
            // Text mode... put it in (ASCII) quotes
            let i = 0;
            result = '"';
            while (atom[i] && atom[i].mode === 'text') {
                result += atom[i].body;
                i++;
            }
            result += '"' + toASCIIMath(atom.slice(i), options);
        } else {
            let i = 0;
            while (atom[i] && atom[i].mode === 'math') {
                result += toASCIIMath(atom[i], options);
                i++;
            }
            result += toASCIIMath(atom.slice(i), options);
        }
        return result.trim();
    }

    let result = '';
    const command = atom.latex ? atom.latex.trim() : null;
    let m;

    switch(atom.type) {
        case 'group':
        case 'root':
            result = toASCIIMath(atom.body, options);
            break;

        case 'array':
            break;

        case 'genfrac':
            if (atom.leftDelim || atom.rightDelim) {
                result += (atom.leftDelim === '.' || !atom.leftDelim) ? '{:' : atom.leftDelim;
            }
            if (atom.hasBarLine) {
                result += '(';
                result += toASCIIMath(atom.numer, options);
                result += ')/(';
                result += toASCIIMath(atom.denom, options);
                result += ')';
            } else {
                // No bar line, i.e. \choose, etc...
                result += '(' + toASCIIMath(atom.numer, options) + '),';
                result += '(' + toASCIIMath(atom.denom, options) + ')';
            }
            if (atom.leftDelim || atom.rightDelim) {
                result += (atom.rightDelim === '.' || !atom.rightDelim) ? '{:' : atom.rightDelim;
            }
        break;

        case 'surd':
            if (atom.index) {
                result += 'root(' + toASCIIMath(atom.index, options) + ')(' +
                     toASCIIMath(atom.body, options) + ')';
            } else {
                result += 'sqrt(' + toASCIIMath(atom.body, options) + ')';
            }
            break;

        case 'leftright':
            result += (atom.leftDelim === '.' || !atom.leftDelim) ? '{:' : atom.leftDelim;
            result += toASCIIMath(atom.body, options);
            result += (atom.rightDelim === '.' || !atom.rightDelim) ? '{:' : atom.rightDelim;
            break;

        case 'sizeddelim':
        case 'delim':
            // result += '<mo separator="true"' + makeID(atom.id, options) + '>' + (SPECIAL_OPERATORS[atom.delim] || atom.delim) + '</mo>';
            break;


        case 'accent':
            break;

        case 'line':
        case 'overlap':
            break;

        case 'overunder':

            break;

        case 'mord':
            // @todo, deal with some special identifiers: \alpha, etc...
            result = SPECIAL_IDENTIFIERS[command] || command || 
                (typeof atom.body === 'string' ? atom.body : '');
            if (result[0] === '\\') result += '';
            m = command ? command.match(/[{]?\\char"([0-9abcdefABCDEF]*)[}]?/) : null;
            if (m) {
                // It's a \char command
                result = String.fromCharCode(parseInt('0x' + m[1]))
            } else if (result.length > 0 && result.charAt(0) === '\\') {
                // atom is an identifier with no special handling. Use the
                // Unicode value
                if (typeof atom.body === 'string') {
                    result = atom.body.charAt(0);
                } else {
                    result = atom.latex;
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
                result = atom.body;
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
                    result += atom.body;
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
            result = ' '
            break;

    }
    // Subscripts before superscripts (according to the ASCIIMath spec)
    if (atom.subscript) {
        result += '_';
        const arg = toASCIIMath(atom.subscript, options);
        if (arg.length > 1 && !/^(-)?\d+(\.\d*)?$/.test(arg)) {
            result += '(' + arg + ')'
        } else {
            result += arg;
        }
    }

    if (atom.superscript) {
        result += '^';
        const arg = toASCIIMath(atom.superscript, options);
        if (arg.length > 1 && !/^(-)?\d+(\.\d*)?$/.test(arg)) {
            result += '(' + arg + ')'
        } else {
            result += arg;
        }
    }

    return result;
}

export default {
    toASCIIMath
}