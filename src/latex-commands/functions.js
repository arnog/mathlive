"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var tokenizer_1 = require("../core/tokenizer");
var atom_class_1 = require("../core/atom-class");
var extensible_symbol_1 = require("../atoms/extensible-symbol");
var surd_1 = require("../atoms/surd");
var genfrac_1 = require("../atoms/genfrac");
var delim_1 = require("../atoms/delim");
var definitions_utils_1 = require("./definitions-utils");
var placeholder_1 = require("../atoms/placeholder");
var registers_utils_1 = require("../core/registers-utils");
var context_1 = require("../core/context");
var box_1 = require("../core/box");
var operator_1 = require("../atoms/operator");
(0, definitions_utils_1.defineFunction)([
    'arccos',
    'arcsin',
    'arctan',
    'arctg',
    'arcctg',
    'arg',
    'ch',
    'cos',
    'cosh',
    'cot',
    'cotg',
    'coth',
    'ctg',
    'cth',
    'csc',
    'cosec',
    'deg',
    'dim',
    'exp',
    'gcd',
    'hom',
    'inf',
    'ker',
    'lb',
    'lg',
    // Sometimes used as the log2
    'ln',
    'log',
    'Pr',
    'sec',
    'sh',
    'sin',
    'sinh',
    'sup',
    'tan',
    'tanh',
    'tg',
    'th',
    'arcsec',
    'arccsc',
    'arsinh',
    'arcosh',
    'artanh',
    'arcsech',
    'arccsch',
], '', {
    isFunction: true,
    ifMode: 'math',
    createAtom: function (options) {
        return new operator_1.OperatorAtom(options.command.slice(1), __assign(__assign({}, options), { limits: 'adjacent', isFunction: true, variant: 'main', variantStyle: 'up' }));
    }
});
(0, definitions_utils_1.defineFunction)(['liminf', 'limsup'], '', {
    ifMode: 'math',
    createAtom: function (options) {
        return new operator_1.OperatorAtom({ '\\liminf': 'lim inf', '\\limsup': 'lim sup' }[options.command], __assign(__assign({}, options), { limits: 'over-under', variant: 'main' }));
    }
});
(0, definitions_utils_1.defineFunction)(['lim', 'mod'], '', {
    ifMode: 'math',
    createAtom: function (options) {
        return new operator_1.OperatorAtom(options.command.slice(1), __assign(__assign({}, options), { limits: 'over-under', variant: 'main' }));
    }
});
// With Limits
(0, definitions_utils_1.defineFunction)(['det', 'max', 'min'], '', {
    ifMode: 'math',
    isFunction: true,
    createAtom: function (options) {
        return new operator_1.OperatorAtom(options.command.slice(1), __assign(__assign({}, options), { limits: 'over-under', isFunction: true, variant: 'main' }));
    }
});
(0, definitions_utils_1.defineFunction)(['ang'], '{:math}', {
    ifMode: 'math',
    createAtom: function (options) {
        return new atom_class_1.Atom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]) }));
    },
    serialize: function (atom, options) { return "\\ang{".concat(atom.bodyToLatex(options), "}"); },
    render: function (atom, context) {
        var box = atom.createBox(context);
        var caret = box.caret;
        box.caret = undefined;
        var deg = new box_1.Box('\u00b0', {
            style: __assign(__assign({}, atom.style), { variant: 'normal', variantStyle: 'up' })
        });
        return new box_1.Box([box, deg], {
            type: 'inner',
            isSelected: atom.isSelected,
            caret: caret
        });
    }
});
// Root
(0, definitions_utils_1.defineFunction)('sqrt', '[index:auto]{radicand:expression}', {
    ifMode: 'math',
    createAtom: function (options) {
        return new surd_1.SurdAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[1]), index: options.args[0] ? (0, definitions_utils_1.argAtoms)(options.args[0]) : undefined }));
    }
});
// Fractions
(0, definitions_utils_1.defineFunction)(['frac', 'dfrac', 'tfrac', 'binom', 'dbinom', 'tbinom'], '{:expression}{:expression}', {
    ifMode: 'math',
    createAtom: function (options) {
        var genfracOptions = __assign({}, options);
        var command = options.command;
        var args = options.args;
        switch (command) {
            case '\\dfrac':
            case '\\frac':
            case '\\tfrac':
                genfracOptions.hasBarLine = true;
                break;
            case '\\atopfrac':
                genfracOptions.hasBarLine = false;
                break;
            case '\\dbinom':
            case '\\binom':
            case '\\tbinom':
                genfracOptions.hasBarLine = false;
                genfracOptions.leftDelim = '(';
                genfracOptions.rightDelim = ')';
                break;
            case '\\cfrac':
                genfracOptions.hasBarLine = true;
                genfracOptions.continuousFraction = true;
                break;
            default:
        }
        switch (command) {
            case '\\dfrac':
            case '\\dbinom':
                genfracOptions.mathstyleName = 'displaystyle';
                break;
            case '\\tfrac':
            case '\\tbinom':
                genfracOptions.mathstyleName = 'textstyle';
                break;
            default:
        }
        return new genfrac_1.GenfracAtom(!args[0] ? [new placeholder_1.PlaceholderAtom()] : (0, definitions_utils_1.argAtoms)(args[0]), !args[1] ? [new placeholder_1.PlaceholderAtom()] : (0, definitions_utils_1.argAtoms)(args[1]), genfracOptions);
    },
    serialize: function (atom, options) {
        var numer = atom.aboveToLatex(options);
        var denom = atom.belowToLatex(options);
        // Special case serialization when numer and denom are digits
        if (/^[0-9]$/.test(numer) && /^[0-9]$/.test(denom))
            return "".concat(atom.command).concat(numer).concat(denom);
        return (0, tokenizer_1.latexCommand)(atom.command, numer, denom);
    }
});
(0, definitions_utils_1.defineFunction)(['cfrac'], '[:string]{:expression}{:expression}', {
    ifMode: 'math',
    createAtom: function (options) {
        var genfracOptions = __assign({}, options);
        var args = options.args;
        genfracOptions.hasBarLine = true;
        genfracOptions.continuousFraction = true;
        if (args[0] === 'r')
            genfracOptions.align = 'right';
        if (args[0] === 'l')
            genfracOptions.align = 'left';
        return new genfrac_1.GenfracAtom(!args[1] ? [new placeholder_1.PlaceholderAtom()] : (0, definitions_utils_1.argAtoms)(args[1]), !args[2] ? [new placeholder_1.PlaceholderAtom()] : (0, definitions_utils_1.argAtoms)(args[2]), genfracOptions);
    },
    serialize: function (atom, options) {
        var numer = atom.aboveToLatex(options);
        var denom = atom.belowToLatex(options);
        return (0, tokenizer_1.latexCommand)(atom.command, numer, denom);
    }
});
(0, definitions_utils_1.defineFunction)(['brace', 'brack'], '', {
    infix: true,
    createAtom: function (options) {
        return new genfrac_1.GenfracAtom((0, definitions_utils_1.argAtoms)(options.args[0]), (0, definitions_utils_1.argAtoms)(options.args[1]), __assign(__assign({}, options), { hasBarLine: false, leftDelim: options.command === '\\brace' ? '\\lbrace' : '\\lbrack', rightDelim: options.command === '\\brace' ? '\\rbrace' : '\\rbrack' }));
    },
    serialize: function (atom, options) {
        return (0, tokenizer_1.joinLatex)([
            atom.aboveToLatex(options),
            atom.command,
            atom.belowToLatex(options),
        ]);
    }
});
(0, definitions_utils_1.defineFunction)(['over', 'atop', 'choose'], '', {
    infix: true,
    createAtom: function (options) {
        var leftDelim = undefined;
        var rightDelim = undefined;
        var args = options.args;
        if (options.command === '\\choose') {
            leftDelim = '(';
            rightDelim = ')';
        }
        return new genfrac_1.GenfracAtom((0, definitions_utils_1.argAtoms)(args[0]), (0, definitions_utils_1.argAtoms)(args[1]), __assign(__assign({}, options), { hasBarLine: options.command === '\\over', leftDelim: leftDelim, rightDelim: rightDelim }));
    },
    serialize: function (atom, options) {
        return (0, tokenizer_1.joinLatex)([
            atom.aboveToLatex(options),
            atom.command,
            atom.belowToLatex(options),
        ]);
    }
});
(0, definitions_utils_1.defineFunction)(['overwithdelims', 'atopwithdelims'], '{numer:auto}{denom:auto}{left-delim:delim}{right-delim:delim}', {
    infix: true,
    createAtom: function (options) {
        var _a, _b;
        var args = options.args;
        return new genfrac_1.GenfracAtom((0, definitions_utils_1.argAtoms)(args[0]), (0, definitions_utils_1.argAtoms)(args[1]), __assign(__assign({}, options), { leftDelim: (_a = args[2]) !== null && _a !== void 0 ? _a : '.', rightDelim: (_b = args[3]) !== null && _b !== void 0 ? _b : '.', hasBarLine: false }));
    },
    serialize: function (atom, options) {
        return "".concat(atom.aboveToLatex(options), " ").concat(atom.command).concat(atom.leftDelim).concat(atom.rightDelim).concat(atom.belowToLatex(options));
    }
});
// Slashed package
/*
defineFunction('\\slashed'
*/
(0, definitions_utils_1.defineFunction)('pdiff', '{numerator}{denominator}', {
    ifMode: 'math',
    createAtom: function (options) {
        return new genfrac_1.GenfracAtom((0, definitions_utils_1.argAtoms)(options.args[0]), (0, definitions_utils_1.argAtoms)(options.args[1]), __assign(__assign({}, options), { hasBarLine: true, numerPrefix: '\u2202', denomPrefix: '\u2202' }));
    }
});
// Limits, symbols
(0, definitions_utils_1.defineFunction)([
    'sum',
    'prod',
    'bigcup',
    'bigcap',
    'coprod',
    'bigvee',
    'bigwedge',
    'biguplus',
    'bigotimes',
    'bigoplus',
    'bigodot',
    'bigsqcup',
    'intop',
], '', {
    ifMode: 'math',
    createAtom: function (options) {
        return new extensible_symbol_1.ExtensibleSymbolAtom({
            coprod: '\u2210',
            bigvee: '\u22C1',
            bigwedge: '\u22C0',
            biguplus: '\u2A04',
            bigcap: '\u22C2',
            bigcup: '\u22C3',
            intop: '\u222B',
            prod: '\u220F',
            sum: '\u2211',
            bigotimes: '\u2A02',
            bigoplus: '\u2A01',
            bigodot: '\u2A00',
            bigsqcup: '\u2A06',
            smallint: '\u222B'
        }[options.command.slice(1)], __assign(__assign({}, options), { limits: 'auto', variant: 'main' }));
    }
});
// Non-extensible symbol
(0, definitions_utils_1.defineFunction)('smallint', '', {
    ifMode: 'math',
    createAtom: function (options) {
        return new operator_1.OperatorAtom('\u222B', __assign(__assign({}, options), { limits: 'adjacent', variant: 'main' }));
    }
});
// No limits, symbols (i.e. display larger in 'display' mode, and
// centered on the baseline)
var EXTENSIBLE_SYMBOLS = {
    int: '\u222B',
    iint: '\u222C',
    iiint: '\u222D',
    oint: '\u222E',
    oiint: '\u222F',
    oiiint: '\u2230',
    intclockwise: '\u2231',
    varointclockwise: '\u2232',
    ointctrclockwise: '\u2233',
    intctrclockwise: '\u2A11',
    sqcup: '\u2294',
    sqcap: '\u2293',
    uplus: '\u228E',
    wr: '\u2240',
    amalg: '\u2A3F',
    Cap: '\u22D2',
    Cup: '\u22D3',
    doublecap: '\u22D2',
    doublecup: '\u22D3'
};
(0, definitions_utils_1.defineFunction)(Object.keys(EXTENSIBLE_SYMBOLS), '', {
    ifMode: 'math',
    createAtom: function (options) {
        var command = options.command;
        var symbol = EXTENSIBLE_SYMBOLS[command.slice(1)];
        return new extensible_symbol_1.ExtensibleSymbolAtom(symbol, __assign(__assign({}, options), { limits: 'adjacent', variant: { '\u22D2': 'ams', '\u22D3': 'ams' }[symbol] }));
    }
});
(0, definitions_utils_1.defineFunction)(['Re', 'Im'], '', {
    ifMode: 'math',
    createAtom: function (options) {
        return new operator_1.OperatorAtom({ '\\Re': '\u211C', '\\Im': '\u2111' }[options.command], __assign(__assign({}, options), { limits: 'adjacent', isFunction: true, variant: 'fraktur' }));
    }
});
(0, definitions_utils_1.defineFunction)('middle', '{:delim}', {
    ifMode: 'math',
    createAtom: function (options) {
        var _a;
        return new delim_1.MiddleDelimAtom(__assign(__assign({}, options), { delim: (_a = options.args[0]) !== null && _a !== void 0 ? _a : '|', size: 1 }));
    }
});
// TODO
// Some missing greek letters, but see https://reference.wolfram.com/language/tutorial/LettersAndLetterLikeForms.html
// koppa, stigma, Sampi
// See https://tex.stackexchange.com/questions/231878/accessing-archaic-greek-koppa-in-the-birkmult-document-class
// Capital Alpha, etc...
// Colon (ratio) (2236)
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
(0, definitions_utils_1.defineFunction)('the', '{:value}', {
    createAtom: function (options) {
        return new atom_class_1.Atom(__assign(__assign({}, options), { captureSelection: true, verbatimLatex: null }));
    },
    render: function (atom, parent) {
        var _a;
        var ctx = new context_1.Context({ parent: parent }, atom.style);
        var classes = '';
        if (atom.isSelected)
            classes += ' ML__selected';
        var arg = ctx.evaluate(atom.args[0]);
        return new box_1.Box(((_a = (0, registers_utils_1.serializeLatexValue)(arg)) !== null && _a !== void 0 ? _a : '').split('').map(function (x) {
            return new box_1.Box(x, {
                type: 'ord',
                classes: classes,
                mode: atom.mode,
                isSelected: atom.isSelected,
                style: __assign({ variant: 'main' }, atom.style)
            });
        }), {
            type: 'lift',
            style: atom.style,
            caret: atom.caret,
            isSelected: atom.isSelected,
            classes: classes
        }).wrap(ctx);
    },
    serialize: function (atom) { var _a; return "\\the".concat((_a = (0, registers_utils_1.serializeLatexValue)(atom.args[0])) !== null && _a !== void 0 ? _a : '\\relax'); }
});
