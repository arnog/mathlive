import { Argument, defineFunction } from './definitions-utils';
import type { Atom, ToLatexOptions } from '../core/atom-class';
import { OperatorAtom } from '../core-atoms/operator';
import { SurdAtom } from '../core-atoms/surd';
import { GenfracAtom, GenfracOptions } from '../core-atoms/genfrac';
import { DelimAtom } from '../core-atoms/delim';
import { Style } from '../public/core';

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
    {
        isFunction: true,
        createAtom: (command: string, _args: Argument[], style: Style): Atom =>
            new OperatorAtom(command, command.slice(1), {
                limits: 'nolimits',
                isExtensibleSymbol: false,
                isFunction: true,
                variant: 'main',
                variantStyle: 'up',
                style,
            }),
    }
);

defineFunction(['liminf', 'limsup'], '', {
    createAtom: (command: string, _args: Argument[], style: Style): Atom =>
        new OperatorAtom(
            command,
            { '\\liminf': 'lim inf', '\\limsup': 'lim sup' }[command],
            {
                limits: 'limits',
                isExtensibleSymbol: false,
                variant: 'main',
                style,
            }
        ),
});

defineFunction(['lim', 'mod'], '', {
    createAtom: (command: string, _args: Argument[], style: Style): Atom =>
        new OperatorAtom(command, command.slice(1), {
            limits: 'limits',
            isExtensibleSymbol: false,
            variant: 'main',
            style,
        }),
});

// With Limits
defineFunction(['det', 'max', 'min'], '', {
    isFunction: true,
    createAtom: (command: string, _args: Argument[], style: Style): Atom =>
        new OperatorAtom(command, command.slice(1), {
            limits: 'limits',
            isExtensibleSymbol: false,
            isFunction: true,
            variant: 'main',
            style,
        }),
});

// Root
defineFunction('sqrt', '[index:auto]{radicand:auto}', {
    createAtom: (command: string, args: Argument[], style: Style): Atom =>
        new SurdAtom(command, {
            body: args[1] as Atom[],
            index: args[0] as Atom[],
            style,
        }),
});

// Fractions
defineFunction(
    ['frac', 'dfrac', 'tfrac', 'cfrac', 'binom', 'dbinom', 'tbinom'],
    '{numerator}{denominator}',
    {
        createAtom: (command: string, args: Argument[], style: Style): Atom => {
            const options: GenfracOptions = {
                mathStyleName: 'auto',
                style,
            };
            switch (command) {
                case '\\dfrac':
                case '\\frac':
                case '\\tfrac':
                    options.hasBarLine = true;
                    break;
                case '\\atopfrac':
                    options.hasBarLine = false;
                    break;
                case '\\dbinom':
                case '\\binom':
                case '\\tbinom':
                    options.hasBarLine = false;
                    options.leftDelim = '(';
                    options.rightDelim = ')';
                    break;
            }

            switch (command) {
                case '\\dfrac':
                case '\\dbinom':
                    options.mathStyleName = 'displaystyle';
                    break;
                case '\\tfrac':
                case '\\tbinom':
                    options.mathStyleName = 'textstyle';
                    break;
                case '\\cfrac':
                    options.hasBarLine = true;
                    options.continuousFraction = true;
                    break;
            }
            return new GenfracAtom(
                command,
                args[0] as Atom[],
                args[1] as Atom[],
                options
            );
        },
    }
);

defineFunction(['over', 'atop', 'choose'], '', {
    infix: true,
    createAtom: (command: string, args: Argument[], style: Style): Atom => {
        let leftDelim: string;
        let rightDelim: string;

        if (command === '\\choose') {
            leftDelim = '(';
            rightDelim = ')';
        }
        return new GenfracAtom(command, args[0] as Atom[], args[1] as Atom[], {
            hasBarLine: command === '\\over',
            leftDelim: leftDelim,
            rightDelim: rightDelim,
            style,
            toLatexOverride: (atom: GenfracAtom, options: ToLatexOptions) =>
                `{${atom.aboveToLatex(options)}${
                    atom.command
                } ${atom.belowToLatex(options)}}`,
        });
    },
});

// Slashed package
/*
defineFunction('\\slashed'
*/

defineFunction('pdiff', '{numerator}{denominator}', {
    createAtom: (command: string, args: Argument[], style: Style): Atom =>
        new GenfracAtom(command, args[0] as Atom[], args[1] as Atom[], {
            hasBarLine: true,
            numerPrefix: '\u2202',
            denomPrefix: '\u2202',
            style,
        }),
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
    {
        createAtom: (command: string, args: Argument[], style: Style): Atom =>
            new OperatorAtom(
                command,
                {
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
                }[command.slice(1)],
                {
                    isExtensibleSymbol: true,
                    limits: 'auto',
                    variant: 'main',
                    style,
                }
            ),
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
defineFunction(Object.keys(EXTENSIBLE_SYMBOLS), '', {
    createAtom: (command: string, _args: Argument[], style: Style): Atom =>
        new OperatorAtom(command, EXTENSIBLE_SYMBOLS[command.slice(1)], {
            limits: 'nolimits',
            isExtensibleSymbol: true,
            style,
            variant: { '\u22d2': 'ams', '\u22d3': 'ams' }[
                EXTENSIBLE_SYMBOLS[command.slice(1)]
            ],
        }),
});

defineFunction(['Re', 'Im'], '', {
    createAtom: (command: string, _args: Argument[], style: Style): Atom =>
        new OperatorAtom(
            command,
            { '\\Re': '\u211c', '\\Im': '\u2111' }[command],
            {
                limits: 'nolimits',
                style,
                isExtensibleSymbol: false,
                isFunction: true,
                variant: 'fraktur',
            }
        ),
});

defineFunction('middle', '{:delim}', {
    createAtom: (command: string, args: Argument[], style: Style): Atom =>
        new DelimAtom(command, args[0] as string, { style }),
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
