import { joinLatex, latexCommand } from '../core/tokenizer';

import { Atom } from '../core/atom-class';
import { OperatorAtom } from '../core-atoms/operator';
import { SurdAtom } from '../core-atoms/surd';
import { GenfracAtom, GenfracOptions } from '../core-atoms/genfrac';
import { DelimAtom } from '../core-atoms/delim';

import { Argument, argAtoms, defineFunction } from './definitions-utils';
import { GroupAtom } from '../core-atoms/group';
import type { Style } from '../public/core-types';
import type { GlobalContext } from '../core/types';
import { PlaceholderAtom } from '../core-atoms/placeholder';

defineFunction(
  [
    'arccos',
    'arcsin',
    'arctan',
    'arctg', // Not LaTeX standard. Used in France
    'arcctg', // Not LaTeX standard. Used in France
    'arg',
    'ch', // Not LaTeX standard. \cosh
    'cos',
    'cosh',
    'cot',
    'cotg', // Not LaTeX standard. Used in France
    'coth',
    'ctg', // Not LaTeX standard. Used in France
    'cth',
    'csc', // Not LaTeX standard. \cth
    'cosec', // Not LaTeX standard.
    'dim',
    'exp',
    'hom',
    'inf',
    'ker',
    'lb', // Not LaTeX standard. US Dept of Commerce recommendation for log2
    'lg', // Not LaTeX standard. In German and Russian literature,  log10.
    // Sometimes used as the log2
    'ln',
    'log',
    'Pr',
    'sec',
    'sh', // Not LaTeX standard. \sinh
    'sin',
    'sinh',
    'sup',
    'tan',
    'tanh',
    'tg', // Not LaTeX standard. Used in France
    'th', // Not LaTeX standard. \tanh
    'arcsec',
    'arccsc',
    'arsinh',
    'arcosh',
    'artanh',
    'arcsech',
    'arccsch',
  ],
  '',
  {
    isFunction: true,
    ifMode: 'math',
    createAtom: (command, context, style) =>
      new OperatorAtom(command, command.slice(1), context, {
        limits: 'adjacent',
        isFunction: true,
        variant: 'main',
        variantStyle: 'up',
        style,
      }),
  }
);

defineFunction(['liminf', 'limsup'], '', {
  ifMode: 'math',
  createAtom: (command, context, style) =>
    new OperatorAtom(
      command,
      { '\\liminf': 'lim inf', '\\limsup': 'lim sup' }[command]!,
      context,
      {
        limits: 'over-under',
        variant: 'main',
        style,
      }
    ),
});

defineFunction(['lim', 'mod'], '', {
  ifMode: 'math',
  createAtom: (command, context, style) =>
    new OperatorAtom(command, command.slice(1), context, {
      limits: 'over-under',
      variant: 'main',
      style,
    }),
});

// With Limits
defineFunction(['det', 'max', 'min'], '', {
  ifMode: 'math',
  isFunction: true,
  createAtom: (command, context, style) =>
    new OperatorAtom(command, command.slice(1), context, {
      limits: 'over-under',
      isFunction: true,
      variant: 'main',
      style,
    }),
});

defineFunction(['ang'], '{:math}', {
  ifMode: 'math',
  isFunction: true,
  createAtom: (_command, context, style, args) =>
    new GroupAtom(
      [
        ...argAtoms(args[0]),
        new Atom('mord', context, { value: '\u00b0', style }),
      ],
      context,
      {
        mode: 'math',
        latexOpen: '\\ang{',
        latexClose: '}',
        style,
      }
    ),
});

// Root
defineFunction('sqrt', '[index:auto]{radicand:expression}', {
  ifMode: 'math',
  createAtom: (command, context, style, args) =>
    new SurdAtom(command, context, {
      body: argAtoms(args[1]),
      index: args[0] ? argAtoms(args[0]) : undefined,
      style,
    }),
});

// Fractions
defineFunction(
  ['frac', 'dfrac', 'tfrac', 'cfrac', 'binom', 'dbinom', 'tbinom'],
  '{:expression}{:expression}',
  {
    ifMode: 'math',
    createAtom: (command, context, style, args) => {
      const genfracOptions: GenfracOptions = { style };
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

      return new GenfracAtom(
        command,
        !args[0] ? [new PlaceholderAtom(context)] : argAtoms(args[0]),
        !args[1] ? [new PlaceholderAtom(context)] : argAtoms(args[1]),
        context,
        {
          ...genfracOptions,
          serialize: (atom, options) => {
            const numer = atom.aboveToLatex(options);
            const denom = atom.belowToLatex(options);
            // Special case serialization when numer and denom are digits
            if (/^[0-9]$/.test(numer) && /^[0-9]$/.test(denom))
              return `${command}${numer}${denom}`;

            return latexCommand(command, numer, denom);
          },
        }
      );
    },
  }
);

defineFunction(['brace', 'brack'], '', {
  infix: true,
  createAtom: (command, context, style, args) =>
    new GenfracAtom(command, argAtoms(args[0]), argAtoms(args[1]), context, {
      hasBarLine: false,
      leftDelim: command === '\\brace' ? '\\lbrace' : '\\lbrack',
      rightDelim: command === '\\brace' ? '\\rbrace' : '\\rbrack',
      style,
      serialize: (atom, options) =>
        joinLatex([
          atom.aboveToLatex(options),
          atom.command,
          atom.belowToLatex(options),
        ]),
    }),
});

defineFunction(['over', 'atop', 'choose'], '', {
  infix: true,
  createAtom: (command, context, style, args) => {
    let leftDelim: string | undefined = undefined;
    let rightDelim: string | undefined = undefined;

    if (command === '\\choose') {
      leftDelim = '(';
      rightDelim = ')';
    }

    return new GenfracAtom(
      command,
      argAtoms(args[0]),
      argAtoms(args[1]),
      context,
      {
        hasBarLine: command === '\\over',
        leftDelim,
        rightDelim,
        style,
        serialize: (atom, options) =>
          joinLatex([
            atom.aboveToLatex(options),
            atom.command,
            atom.belowToLatex(options),
          ]),
      }
    );
  },
});

defineFunction(
  ['overwithdelims', 'atopwithdelims'],
  '{numer:auto}{denom:auto}{left-delim:delim}{right-delim:delim}',
  {
    infix: true,
    createAtom: (
      command,
      context,
      style,
      args: [Argument | null, Argument | null, string | null, string | null]
    ) =>
      new GenfracAtom(command, argAtoms(args[0]), argAtoms(args[1]), context, {
        leftDelim: args[2] ?? '.',
        rightDelim: args[3] ?? '.',
        hasBarLine: false,
        style,
        serialize: (atom, options) =>
          `${atom.aboveToLatex(options)} ${atom.command}${atom.leftDelim}${
            atom.rightDelim
          }${atom.belowToLatex(options)}`,
      }),
  }
);

// Slashed package
/*
defineFunction('\\slashed'
*/

defineFunction('pdiff', '{numerator}{denominator}', {
  ifMode: 'math',
  createAtom: (
    command: string,
    context: GlobalContext,
    style: Style,
    args: Argument[]
  ): Atom =>
    new GenfracAtom(command, argAtoms(args[0]), argAtoms(args[1]), context, {
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
    'intop',
  ],
  '',
  {
    ifMode: 'math',
    createAtom: (command, context, style) =>
      new OperatorAtom(
        command,
        {
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
          smallint: '\u222B',
        }[command.slice(1)]!,
        context,
        {
          isExtensibleSymbol: true,
          limits: 'auto',
          variant: 'main',
          style,
        }
      ),
  }
);

// Non-extensible symbol
defineFunction('smallint', '', {
  ifMode: 'math',
  createAtom: (command, context, style) =>
    new OperatorAtom(command, '\u222B', context, {
      limits: 'adjacent',
      isExtensibleSymbol: false,
      style,
      variant: 'main',
    }),
});

// No limits, symbols (i.e. display larger in 'display' mode, and
// centered on the baseline)
const EXTENSIBLE_SYMBOLS = {
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
  doublecup: '\u22D3',
};
defineFunction(Object.keys(EXTENSIBLE_SYMBOLS), '', {
  ifMode: 'math',
  createAtom: (command, context, style) =>
    new OperatorAtom(command, EXTENSIBLE_SYMBOLS[command.slice(1)], context, {
      limits: 'adjacent',
      isExtensibleSymbol: true,
      style,
      variant: { '\u22D2': 'ams', '\u22D3': 'ams' }[
        EXTENSIBLE_SYMBOLS[command.slice(1)]
      ],
    }),
});

defineFunction(['Re', 'Im'], '', {
  ifMode: 'math',
  createAtom: (command, context, style) =>
    new OperatorAtom(
      command,
      { '\\Re': '\u211C', '\\Im': '\u2111' }[command]!,
      context,
      {
        limits: 'adjacent',
        style,
        isFunction: true,
        variant: 'fraktur',
      }
    ),
});

defineFunction('middle', '{:delim}', {
  ifMode: 'math',
  createAtom: (command, context, style, args: [string | null]) =>
    new DelimAtom(command, args[0] ?? '|', context, { size: 1, style }),
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
