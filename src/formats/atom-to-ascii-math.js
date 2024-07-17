"use strict";
exports.__esModule = true;
exports.atomToAsciiMath = void 0;
var types_1 = require("../common/types");
var SPECIAL_IDENTIFIERS = {
    '\\ne': '≠',
    '\\neq': '≠',
    '\u2212': '-',
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
    '\\exponentialE': 'e',
    '\\imaginaryI': 'i',
    '\\imaginaryJ': 'j',
    '\\!': ' ',
    '\\,': ' ',
    '\\:': ' ',
    '\\>': ' ',
    '\\;': ' ',
    '\\enskip': ' ',
    '\\enspace': ' ',
    '\\qquad': ' ',
    '\\quad': ' ',
    '\\infty': 'oo',
    '\\R': 'RR',
    '\\N': 'NN',
    '\\Z': 'ZZ',
    '\\Q': 'QQ',
    '\\C': 'CC',
    '\\emptyset': 'O/',
    '\\varnothing': 'O/',
    '\\varDelta': 'Delta',
    '\\varTheta': 'Theta',
    '\\varLambda': 'Lambda',
    '\\varXi': 'Xi',
    '\\varPi': 'Pi',
    '\\varSigma': 'Sigma',
    '\\varUpsilon': 'Upsilon',
    '\\varPhi': 'Phi',
    '\\varPsi': 'Psi',
    '\\varOmega': 'Omega'
};
var SPECIAL_OPERATORS = {
    '\\pm': '+-',
    '\\colon': ':',
    '\\vert': '|',
    '\\Vert': '||',
    '\\mid': '|',
    '\\lbrack': '[',
    '\\rbrack': ']',
    '\\lbrace': '{',
    '\\rbrace': '}',
    '\\lparen': '(',
    '\\rparen': ')',
    '\\langle': '(:',
    '\\rangle': ':)',
    '\\sum': ' sum ',
    '\\prod': ' prod ',
    '\\bigcap': ' nnn ',
    '\\bigcup': ' uuu ',
    '\\int': ' int ',
    '\\oint': ' oint ',
    '\\ge': '>=',
    '\\le': '<=',
    '\\ne': '!=',
    '\\neq': '!=',
    '\\lt': '<',
    '\\gt': '>',
    '\\gets': '<-',
    '\\to': '->',
    '\\land': ' and ',
    '\\lor': ' or ',
    '\\lnot': ' not ',
    '\\forall': ' AA ',
    '\\exists': ' EE ',
    '\\in': ' in ',
    '\\notin': ' !in ',
    '\\mapsto': '|->',
    '\\implies': '=>',
    '\\iff': '<=>',
    '\\cdot': '*',
    '\\ast': '**',
    '\\star': '***',
    '\\times': 'xx',
    '\\div': '-:',
    '\\ltimes': '|><',
    '\\rtimes': '><|',
    '\\bowtie': '|><|',
    '\\circ': '@'
};
function joinAsciiMath(xs) {
    var result = '';
    for (var _i = 0, xs_1 = xs; _i < xs_1.length; _i++) {
        var x = xs_1[_i];
        var last = result[result.length - 1];
        if (last !== undefined && /\d/.test(last) && /^\d/.test(x))
            result += ' ';
        result += x;
    }
    return result;
}
/**
 * If `plain` is true, the output will not include quotes around text mode
 */
function atomToAsciiMath(atom, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    if (!atom)
        return '';
    if ((0, types_1.isArray)(atom)) {
        if (atom.length === 0)
            return '';
        if (atom[0].mode === 'latex')
            return atom.map(function (x) { return atomToAsciiMath(x); }).join('');
        if (atom[0].mode === 'text') {
            // Text mode... put it in (ASCII) quotes
            var i_1 = 0;
            var text = '';
            while (((_a = atom[i_1]) === null || _a === void 0 ? void 0 : _a.mode) === 'text') {
                text += atom[i_1].body
                    ? atomToAsciiMath(atom[i_1].body, options)
                    : atom[i_1].value;
                i_1++;
            }
            if (options === null || options === void 0 ? void 0 : options.plain)
                return text + atomToAsciiMath(atom.slice(i_1), options);
            return "\"".concat(text, "\" ").concat(atomToAsciiMath(atom.slice(i_1)));
        }
        var i = 0;
        var result_1 = [];
        while (atom[i] && atom[i].mode === 'math') {
            var digits = '';
            while (atom[i] && atom[i].type === 'mord' && /\d/.test(atom[i].value))
                digits += atom[i++].value;
            if (digits)
                result_1.push(digits);
            else
                result_1.push(atomToAsciiMath(atom[i++], options));
        }
        result_1.push(atomToAsciiMath(atom.slice(i), options));
        return joinAsciiMath(result_1);
    }
    if (atom.mode === 'text')
        return (options === null || options === void 0 ? void 0 : options.plain) ? atom.value : "\"".concat(atom.value, "\"");
    var result = '';
    var command = atom.command;
    var m;
    if (command === '\\placeholder')
        return "(".concat(atomToAsciiMath(atom.body, options), ")");
    switch (atom.type) {
        case 'accent':
            var accent = {
                '\\vec': 'vec',
                '\\dot': 'dot',
                '\\ddot': 'ddot',
                '\\bar': 'bar',
                '\\hat': 'hat',
                '\\acute': 'acute;',
                '\\grave': 'grave',
                '\\tilde': 'tilde',
                '\\breve': 'breave',
                '\\check': 'check'
            }[command];
            result = "".concat(accent !== null && accent !== void 0 ? accent : '', " ").concat(atomToAsciiMath(atom.body, options), " ");
            break;
        case 'first':
            return '';
        case 'latexgroup':
            return atom.body.map(function (x) { return x.value; }).join('');
        case 'group':
        case 'root':
            result =
                (_b = SPECIAL_IDENTIFIERS[command]) !== null && _b !== void 0 ? _b : atomToAsciiMath(atom.body, options);
            break;
        case 'genfrac':
            {
                var genfracAtom = atom;
                if (genfracAtom.leftDelim || genfracAtom.rightDelim) {
                    result =
                        genfracAtom.leftDelim === '.' || !genfracAtom.leftDelim
                            ? '{:'
                            : genfracAtom.leftDelim;
                }
                if (genfracAtom.hasBarLine) {
                    result += '(';
                    result += atomToAsciiMath(genfracAtom.above, options);
                    result += ')/(';
                    result += atomToAsciiMath(genfracAtom.below, options);
                    result += ')';
                }
                else {
                    // No bar line, i.e. \choose, etc...
                    result += '(' + atomToAsciiMath(genfracAtom.above, options) + '),';
                    result += '(' + atomToAsciiMath(genfracAtom.below, options) + ')';
                }
                if (genfracAtom.leftDelim || genfracAtom.rightDelim) {
                    result +=
                        genfracAtom.rightDelim === '.' || !genfracAtom.rightDelim
                            ? '{:'
                            : genfracAtom.rightDelim;
                }
            }
            break;
        case 'surd':
            result += !atom.hasEmptyBranch('above')
                ? 'root(' +
                    atomToAsciiMath(atom.above, options) +
                    ')(' +
                    atomToAsciiMath(atom.body, options) +
                    ')'
                : 'sqrt(' + atomToAsciiMath(atom.body, options) + ')';
            break;
        case 'latex':
            result = atom.value;
            break;
        case 'leftright':
            {
                var leftrightAtom = atom;
                var lDelim = leftrightAtom.leftDelim;
                if (lDelim && SPECIAL_OPERATORS[lDelim])
                    lDelim = SPECIAL_OPERATORS[lDelim];
                result += lDelim === '.' || !lDelim ? '{:' : lDelim;
                result += atomToAsciiMath(leftrightAtom.body, options);
                var rDelim = leftrightAtom.matchingRightDelim();
                if (rDelim && SPECIAL_OPERATORS[rDelim])
                    rDelim = SPECIAL_OPERATORS[rDelim];
                result += rDelim === '.' || !rDelim ? ':}' : rDelim;
            }
            break;
        case 'sizeddelim':
        case 'delim':
            // Result += '<mo separator="true"' + makeID(atom.id, options) + '>' + (SPECIAL_OPERATORS[atom.delim] || atom.delim) + '</mo>';
            result = atom.value;
            break;
        case 'overlap':
            break;
        case 'overunder':
            break;
        case 'mord':
            result =
                (_d = (_c = SPECIAL_IDENTIFIERS[command]) !== null && _c !== void 0 ? _c : command) !== null && _d !== void 0 ? _d : (typeof atom.value === 'string' ? atom.value : '');
            if (result.startsWith('\\'))
                result += ' ';
            m = command ? command.match(/{?\\char"([\dabcdefABCDEF]+)}?/) : null;
            if (m) {
                // It's a \char command
                result = String.fromCodePoint(Number.parseInt('0x' + m[1]));
            }
            else if (result.length > 0 && result.startsWith('\\')) {
                // Atom is an identifier with no special handling. Use the
                // Unicode value
                result =
                    typeof atom.value === 'string'
                        ? atom.value.charAt(0)
                        : atom.command;
            }
            result = asciiStyle(result, atom.style);
            break;
        case 'mbin':
        case 'mrel':
        case 'minner':
            result =
                (_f = (_e = SPECIAL_IDENTIFIERS[command]) !== null && _e !== void 0 ? _e : SPECIAL_OPERATORS[command]) !== null && _f !== void 0 ? _f : atom.value;
            break;
        case 'mopen':
        case 'mclose':
            result = atom.value;
            break;
        case 'mpunct':
            result = (_g = SPECIAL_OPERATORS[command]) !== null && _g !== void 0 ? _g : command;
            break;
        case 'mop':
        case 'operator':
        case 'extensible-symbol':
            // Not ZERO-WIDTH
            if (atom.value !== '\u200B') {
                if (SPECIAL_OPERATORS[command])
                    result = SPECIAL_OPERATORS[command];
                else {
                    result =
                        command === '\\operatorname'
                            ? atomToAsciiMath(atom.body, options)
                            : (_h = atom.value) !== null && _h !== void 0 ? _h : command;
                }
                result += ' ';
            }
            break;
        case 'array':
            var array = atom.array;
            var environment = atom.environmentName;
            var rowDelim = (_j = {
                'bmatrix': ['[', ']'],
                'bmatrix*': ['[', ']']
            }[environment]) !== null && _j !== void 0 ? _j : ['(', ')'];
            var rows = [];
            for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
                var row = array_1[_i];
                var cells = [];
                for (var _p = 0, row_1 = row; _p < row_1.length; _p++) {
                    var cell = row_1[_p];
                    cells.push(rowDelim[0] + atomToAsciiMath(cell, options) + rowDelim[1]);
                }
                rows.push(cells.join(','));
            }
            var delim = (_k = {
                'bmatrix': ['[', ']'],
                'bmatrix*': ['[', ']'],
                'cases': ['{', ':}']
            }[environment]) !== null && _k !== void 0 ? _k : ['(', ')'];
            result = delim[0] + rows.join(',') + delim[1];
            break;
        case 'box':
            break;
        case 'spacing':
            result = (_l = SPECIAL_IDENTIFIERS[command]) !== null && _l !== void 0 ? _l : ' ';
            break;
        case 'enclose':
            result = '(' + atomToAsciiMath(atom.body, options) + ')';
            break;
        case 'space':
            result = ' ';
            break;
        case 'subsup':
            result = '';
            break;
        case 'macro':
            result =
                (_o = (_m = SPECIAL_IDENTIFIERS[command]) !== null && _m !== void 0 ? _m : SPECIAL_OPERATORS[command]) !== null && _o !== void 0 ? _o : atomToAsciiMath(atom.body, options);
            break;
    }
    // Subscripts before superscripts (according to the ASCIIMath spec)
    if (!atom.hasEmptyBranch('subscript')) {
        result += '_';
        var arg = atomToAsciiMath(atom.subscript, options);
        result += arg.length !== 1 ? "(".concat(arg, ")") : arg;
    }
    if (!atom.hasEmptyBranch('superscript')) {
        result += '^';
        var arg = atomToAsciiMath(atom.superscript, options);
        result += arg.length !== 1 ? "(".concat(arg, ")") : arg;
    }
    return result;
}
exports.atomToAsciiMath = atomToAsciiMath;
function asciiStyle(body, style) {
    if (!style)
        return body;
    var result = body;
    if (style.variant === 'double-struck')
        result = "bbb \"".concat(result, "\"");
    if (style.variant === 'script')
        result = "cc \"".concat(result, "\"");
    if (style.variant === 'fraktur')
        result = "fr \"".concat(result, "\"");
    if (style.variant === 'sans-serif')
        result = "sf \"".concat(result, "\"");
    if (style.variant === 'monospace')
        result = "tt \"".concat(result, "\"");
    if (style.variantStyle === 'bold')
        result = "bb \"".concat(result, "\"");
    if (style.color)
        return "color({".concat(style.color, "})(").concat(result, ")");
    return result;
}
