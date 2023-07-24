import { MiddleDelimAtom } from '../core-atoms/delim';
import { GenfracAtom, GenfracOptions } from '../core-atoms/genfrac';
import { OperatorAtom } from '../core-atoms/operator';
import { PlaceholderAtom } from '../core-atoms/placeholder';
import { SurdAtom } from '../core-atoms/surd';
import { Atom, CreateAtomOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { serializeLatexValue } from '../core/registers-utils';
import { joinLatex, latexCommand } from '../core/tokenizer';
import { LatexValue } from '../public/core-types';
import { argAtoms, Argument, defineFunction } from './definitions-utils';

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
    createAtom: (options) =>
      new OperatorAtom(options.command!.slice(1), {
        ...options,
        limits: 'adjacent',
        isFunction: true,
        variant: 'main',
        variantStyle: 'up',
      }),
  }
);

defineFunction(['liminf', 'limsup'], '', {
  ifMode: 'math',
  createAtom: (options) =>
    new OperatorAtom(
      { '\\liminf': 'lim inf', '\\limsup': 'lim sup' }[options.command!]!,
      { ...options, limits: 'over-under', variant: 'main' }
    ),
});

defineFunction(['lim', 'mod'], '', {
  ifMode: 'math',
  createAtom: (options) =>
    new OperatorAtom(options.command!.slice(1), {
      ...options,
      limits: 'over-under',
      variant: 'main',
    }),
});

// With Limits
defineFunction(['det', 'max', 'min'], '', {
  ifMode: 'math',
  isFunction: true,
  createAtom: (options) =>
    new OperatorAtom(options.command!.slice(1), {
      ...options,
      limits: 'over-under',
      isFunction: true,
      variant: 'main',
    }),
});

defineFunction(['ang'], '{:math}', {
  ifMode: 'math',
  createAtom: (options) =>
    new Atom({ ...options, body: argAtoms(options.args![0]) }),
  serialize: (atom, options) => `\\ang{${atom.bodyToLatex(options)}}`,
  render: (atom, context) => {
    const box = atom.createBox(context);
    const caret = box.caret;
    box.caret = undefined;

    const deg = new Box('\u00b0', {
      style: { ...atom.style, variant: 'normal', variantStyle: 'up' },
    });

    return new Box([box, deg], {
      type: 'inner',
      isSelected: atom.isSelected,
      caret,
    });
  },
});

// Root
defineFunction('sqrt', '[index:auto]{radicand:expression}', {
  ifMode: 'math',
  createAtom: (options) =>
    new SurdAtom({
      ...options,
      body: argAtoms(options.args![1]),
      index: options.args![0] ? argAtoms(options.args![0]) : undefined,
    }),
});

// Fractions
defineFunction(
  ['frac', 'dfrac', 'tfrac', 'cfrac', 'binom', 'dbinom', 'tbinom'],
  '{:expression}{:expression}',
  {
    ifMode: 'math',
    createAtom: (options) => {
      const genfracOptions: GenfracOptions = { ...options };
      const command = options.command!;
      const args = options.args!;
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
        !args[0] ? [new PlaceholderAtom()] : argAtoms(args[0]),
        !args[1] ? [new PlaceholderAtom()] : argAtoms(args[1]),
        genfracOptions
      );
    },
    serialize: (atom, options) => {
      const numer = atom.aboveToLatex(options);
      const denom = atom.belowToLatex(options);
      // Special case serialization when numer and denom are digits
      if (/^[0-9]$/.test(numer) && /^[0-9]$/.test(denom))
        return `${atom.command}${numer}${denom}`;

      return latexCommand(atom.command, numer, denom);
    },
  }
);

defineFunction(['brace', 'brack'], '', {
  infix: true,
  createAtom: (options) =>
    new GenfracAtom(argAtoms(options.args![0]), argAtoms(options.args![1]), {
      ...options,
      hasBarLine: false,
      leftDelim: options.command === '\\brace' ? '\\lbrace' : '\\lbrack',
      rightDelim: options.command === '\\brace' ? '\\rbrace' : '\\rbrack',
    }),
  serialize: (atom, options) =>
    joinLatex([
      atom.aboveToLatex(options),
      atom.command,
      atom.belowToLatex(options),
    ]),
});

defineFunction(['over', 'atop', 'choose'], '', {
  infix: true,
  createAtom: (options) => {
    let leftDelim: string | undefined = undefined;
    let rightDelim: string | undefined = undefined;

    const args = options.args!;

    if (options.command! === '\\choose') {
      leftDelim = '(';
      rightDelim = ')';
    }

    return new GenfracAtom(argAtoms(args[0]), argAtoms(args[1]), {
      ...options,
      hasBarLine: options.command === '\\over',
      leftDelim,
      rightDelim,
    });
  },
  serialize: (atom, options) =>
    joinLatex([
      atom.aboveToLatex(options),
      atom.command,
      atom.belowToLatex(options),
    ]),
});

defineFunction(
  ['overwithdelims', 'atopwithdelims'],
  '{numer:auto}{denom:auto}{left-delim:delim}{right-delim:delim}',
  {
    infix: true,
    createAtom: (
      options: CreateAtomOptions<[Argument, Argument, string, string]>
    ) => {
      const args = options.args!;
      return new GenfracAtom(argAtoms(args[0]), argAtoms(args[1]), {
        ...options,
        leftDelim: args[2] ?? '.',
        rightDelim: args[3] ?? '.',
        hasBarLine: false,
      });
    },
    serialize: (atom: GenfracAtom, options) =>
      `${atom.aboveToLatex(options)} ${atom.command}${atom.leftDelim}${
        atom.rightDelim
      }${atom.belowToLatex(options)}`,
  }
);

// Slashed package
/*
defineFunction('\\slashed'
*/

defineFunction('pdiff', '{numerator}{denominator}', {
  ifMode: 'math',
  createAtom: (options) =>
    new GenfracAtom(argAtoms(options.args![0]), argAtoms(options.args![1]), {
      ...options,
      hasBarLine: true,
      numerPrefix: '\u2202',
      denomPrefix: '\u2202',
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
    createAtom: (options) =>
      new OperatorAtom(
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
        }[options.command!.slice(1)]!,
        {
          ...options,
          isExtensibleSymbol: true,
          limits: 'auto',
          variant: 'main',
        }
      ),
  }
);

// Non-extensible symbol
defineFunction('smallint', '', {
  ifMode: 'math',
  createAtom: (options) =>
    new OperatorAtom('\u222B', {
      ...options,
      limits: 'adjacent',
      isExtensibleSymbol: false,
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
  createAtom: (options) => {
    const command = options.command!;
    const symbol = EXTENSIBLE_SYMBOLS[command.slice(1)];
    return new OperatorAtom(symbol, {
      ...options,
      limits: 'adjacent',
      isExtensibleSymbol: true,
      variant: { '\u22D2': 'ams', '\u22D3': 'ams' }[symbol],
    });
  },
});

defineFunction(['Re', 'Im'], '', {
  ifMode: 'math',
  createAtom: (options) =>
    new OperatorAtom(
      { '\\Re': '\u211C', '\\Im': '\u2111' }[options.command!]!,
      {
        ...options,
        limits: 'adjacent',
        isFunction: true,
        variant: 'fraktur',
      }
    ),
});

defineFunction('middle', '{:delim}', {
  ifMode: 'math',
  createAtom: (options: CreateAtomOptions<[string]>) =>
    new MiddleDelimAtom({
      ...options,
      delim: options.args![0] ?? '|',
      size: 1,
    }),
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

defineFunction('the', '{:value}', {
  createAtom: (options) =>
    new Atom({
      ...options,
      captureSelection: true,
      verbatimLatex: null, // disable verbatim LaTeX
    }),
  render: (atom, parent) => {
    const ctx = new Context({ parent }, atom.style);
    let classes = '';
    if (atom.isSelected) classes += ' ML__selected';
    const arg = ctx.evaluate(atom.args![0] as LatexValue);

    return new Box(
      (serializeLatexValue(arg) ?? '').split('').map(
        (x) =>
          new Box(x, {
            type: 'ord',
            classes,
            mode: atom.mode,
            isSelected: atom.isSelected,
            style: { variant: 'main', ...atom.style },
          })
      ),
      {
        type: 'lift',
        style: atom.style,
        caret: atom.caret,
        isSelected: atom.isSelected,
        classes,
      }
    ).wrap(ctx);
  },
  serialize: (atom) =>
    `\\the${serializeLatexValue(atom.args![0] as LatexValue) ?? '\\relax'}`,
});
