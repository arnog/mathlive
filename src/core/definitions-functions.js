import { defineFunction } from './definitions-utils.js';

defineFunction(
    [
        'arcsin',
        'arccos',
        'arctan',
        'arctg',
        'arcctg',
        'arg',
        'ch',
        'cos',
        'cosec',
        'cosh',
        'cot',
        'cotg',
        'coth',
        'csc',
        'ctg',
        'cth',
        'sec',
        'sin',
        'sinh',
        'sh',
        'tan',
        'tanh',
        'tg',
        'th',
    ],
    '',
    null,
    function(name) {
        return {
            type: 'mop',
            limits: 'nolimits',
            symbol: false,
            isFunction: true,
            body: name.slice(1),
            baseFontFamily: 'cmr',
        };
    }
);

defineFunction(
    ['deg', 'dim', 'exp', 'hom', 'ker', 'lb', 'lg', 'ln', 'log'],
    '',
    null,
    function(name) {
        return {
            type: 'mop',
            limits: 'nolimits',
            symbol: false,
            isFunction: true,
            body: name.slice(1),
            baseFontFamily: 'cmr',
        };
    }
);

defineFunction(['lim', 'mod'], '', null, function(name) {
    return {
        type: 'mop',
        limits: 'limits',
        symbol: false,
        body: name.slice(1),
        baseFontFamily: 'cmr',
    };
});
defineFunction(['det', 'max', 'min'], '', null, function(name) {
    return {
        type: 'mop',
        limits: 'limits',
        symbol: false,
        isFunction: true,
        body: name.slice(1),
        baseFontFamily: 'cmr',
    };
});

// Root
defineFunction('sqrt', '[index:auto]{radicand:auto}', null, function(
    name,
    args
) {
    return {
        type: 'surd',
        body: args[1],
        index: args[0],
    };
});

// Fractions
defineFunction(
    ['frac', 'dfrac', 'tfrac', 'cfrac', 'binom', 'dbinom', 'tbinom'],
    '{numerator}{denominator}',
    null,
    function(name, args) {
        const result = {
            type: 'genfrac',
            numer: args[0],
            denom: args[1],
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
    }
);

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

defineFunction(
    ['over' /* 21 */, 'atop' /* 12 */, 'choose' /* 1968 */],
    '',
    { infix: true },
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
            mathstyle: 'auto',
        };
    }
);

// Slashed package
/*
defineFunction('\\slashed'
*/

defineFunction('pdiff', '{numerator}{denominator}', null, function(
    _funcname,
    args
) {
    return {
        type: 'genfrac',
        numer: args[0],
        denom: args[1],
        numerPrefix: '\u2202',
        denomPrefix: '\u2202',
        hasBarLine: true,
        leftDelim: null,
        rightDelim: null,
        mathstyle: 'auto',
    };
});

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
    function(name) {
        return {
            type: 'mop',
            limits: 'auto',
            symbol: true,
            baseFontFamily: 'cmr',
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

// No limits, symbols
defineFunction(
    [
        'int',
        'iint',
        'iiint',
        'oint',
        'oiint',
        'oiiint',
        'intclockwise',
        'varointclockwise',
        'ointctrclockwise',
        'intctrclockwise',
    ],
    '',
    null,
    function(name) {
        return {
            type: 'mop',
            limits: 'nolimits',
            symbol: true,
            body: {
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
            }[name.slice(1)],
        };
    }
);

defineFunction(['Re', 'Im'], '', null, function(name) {
    return {
        type: 'mop',
        limits: 'nolimits',
        symbol: false,
        isFunction: true,
        body: { '\\Re': '\u211c', '\\Im': '\u2111' }[name],
        baseFontFamily: 'frak',
    };
});

defineFunction('middle', '{:delim}', null, function(name, args) {
    return { type: 'delim', delim: args[0] };
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
