import { defineFunction, ParseFunctionResult } from './definitions-utils';
import type { Atom } from './atom';

defineFunction(
    [
        'arccos',
        'arcsin',
        'arctan',
        'arctg', // Not Latex standard. Used in France
        'arcctg', // Not Latex standard. Used in France
        'arg',
        'ch', // Not Latex standard. \cosh
        'cos',
        'cosh',
        'cot',
        'coth',
        'ctg', // Not Latex standard. Used in France
        'cth',
        'cotg', // Not Latex standard. Used in France
        'csc', // Not Latex standard. \cth
        'cosec', // Not Latex standard.
        'deg',
        'dim',
        'exp',
        'hom',
        'inf',
        'ker',
        'lg',
        'lb', // Not Latex standard. US Dept of Commerce recommendation for log2
        'lg', // Not Latex standard. In German and Russian literature,  log10.
        // Sometimes used as the log2
        'ln',
        'log',
        'Pr',
        'sec',
        'sh', // Not Latex standard. \sinh
        'sin',
        'sinh',
        'sup',
        'tan',
        'tanh',
        'tg', // Not Latex standard. Used in France
        'th', // Not Latex standard. \tanh
    ],
    '',
    null,
    function (name) {
        return {
            type: 'mop',
            limits: 'nolimits',
            isSymbol: false,
            isFunction: true,
            body: name.slice(1),
            variant: 'main',
            variantStyle: 'up',
        };
    }
);

defineFunction(['liminf', 'limsup'], '', null, (name) => {
    return {
        type: 'mop',
        limits: 'limits',
        isSymbol: false,
        body: { '\\liminf': 'lim inf', '\\limsup': 'lim sup' }[name],
        variant: 'main',
    };
});

defineFunction(['lim', 'mod'], '', null, function (name) {
    return {
        type: 'mop',
        limits: 'limits',
        isSymbol: false,
        body: name.slice(1),
        variant: 'main',
    };
});

// With Limits
defineFunction(['det', 'max', 'min'], '', null, function (name) {
    return {
        type: 'mop',
        limits: 'limits',
        isSymbol: false,
        isFunction: true,
        body: name.slice(1),
        variant: 'main',
    };
});

// Root
defineFunction(
    'sqrt',
    '[index:auto]{radicand:auto}',
    null,
    (_name, args) => {
        return {
            type: 'surd',
            body: args[1] as Atom[],
            index: args[0] as Atom[],
        };
    },
    (name, _parent, atom, emit) => {
        let args = '';
        if (typeof atom.index !== 'undefined') {
            args += `[${emit(atom, atom.index)}]`;
        }
        args += `{${emit(atom, atom.body as Atom[])}}`;
        return name + args;
    }
);

// Fractions
defineFunction(
    ['frac', 'dfrac', 'tfrac', 'cfrac', 'binom', 'dbinom', 'tbinom'],
    '{numerator}{denominator}',
    null,
    (name, args): ParseFunctionResult => {
        const result: ParseFunctionResult = {
            type: 'genfrac',
            numer: args[0] as Atom[],
            denom: args[1] as Atom[],
            mathstyle: 'auto',
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
    },
    (name, _parent, atom, emit) => {
        return `${name}{${emit(atom, atom.numer)}}{${emit(atom, atom.denom)}}`;
    }
);

defineFunction(
    ['over', 'atop', 'choose'],
    '',
    { infix: true },
    (name, args): ParseFunctionResult => {
        const numer = args[0] as Atom[];
        const denom = args[1] as Atom[];
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
            mathstyle: 'auto',
        };
    },
    (name, _parent, atom, emit) => {
        return `{${emit(atom, atom.numer)}${name} ${emit(atom, atom.denom)}}`;
    }
);

// Slashed package
/*
defineFunction('\\slashed'
*/

defineFunction(
    'pdiff',
    '{numerator}{denominator}',
    null,
    (_funcname, args): ParseFunctionResult => {
        return {
            type: 'genfrac',
            numer: args[0] as Atom[],
            denom: args[1] as Atom[],
            numerPrefix: '\u2202',
            denomPrefix: '\u2202',
            hasBarLine: true,
            leftDelim: null,
            rightDelim: null,
            mathstyle: 'auto',
        };
    },
    (name, _parent, atom, emit) => {
        return `${name}{${emit(atom, atom.numer)}}{${emit(atom, atom.denom)}}`;
    }
);

// Limits, symbols
defineFunction(
    [
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
        'smallint',
        'intop',
    ],
    '',
    null,
    (name): ParseFunctionResult => {
        return {
            type: 'mop',
            limits: 'auto',
            isSymbol: true,
            variant: 'main',
            body: {
                coprod: '\u2210',
                bigvee: '\u22c1',
                bigwedge: '\u22c0',
                biguplus: '\u2a04',
                bigcap: '\u22c2',
                bigcup: '\u22c3',
                intop: '\u222b',
                prod: '\u220f',
                sum: '\u2211',
                bigotimes: '\u2a02',
                bigoplus: '\u2a01',
                bigodot: '\u2a00',
                bigsqcup: '\u2a06',
                smallint: '\u222b',
            }[name.slice(1)],
        };
    }
);

// No limits, symbols (i.e. display larger in 'display' mode, and
// centered on the baseline)
const EXTENSIBLE_SYMBOLS = {
    int: '\u222b',
    iint: '\u222c',
    iiint: '\u222d',
    oint: '\u222e',
    oiint: '\u222f',
    oiiint: '\u2230',
    intclockwise: '\u2231',
    varointclockwise: '\u2232',
    ointctrclockwise: '\u2233',
    intctrclockwise: '\u2a11',
    sqcup: '\u2294',
    sqcap: '\u2293',
    uplus: '\u228e',
    wr: '\u2240',
    amalg: '\u2a3f',
    Cap: '\u22d2',
    Cup: '\u22d3',
    doublecap: '\u22d2',
    doublecup: '\u22d3',
};
defineFunction(Object.keys(EXTENSIBLE_SYMBOLS), '', null, function (name) {
    return {
        type: 'mop',
        limits: 'nolimits',
        isSymbol: true,
        body: EXTENSIBLE_SYMBOLS[name.slice(1)],
        variant: { '\u22d2': 'ams', '\u22d3': 'ams' }[
            EXTENSIBLE_SYMBOLS[name.slice(1)]
        ],
    };
});

defineFunction(['Re', 'Im'], '', null, function (name): ParseFunctionResult {
    return {
        type: 'mop',
        limits: 'nolimits',
        isSymbol: false,
        isFunction: true,
        body: { '\\Re': '\u211c', '\\Im': '\u2111' }[name],
        variant: 'fraktur',
    };
});

defineFunction('middle', '{:delim}', null, function (
    name,
    args
): ParseFunctionResult {
    return { type: 'delim', delim: args[0] as string };
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
