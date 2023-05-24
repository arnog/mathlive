import { joinLatex, latexCommand } from '../core/tokenizer';

import { Atom } from '../core/atom-class';
import { OperatorAtom } from '../core-atoms/operator';
import { SurdAtom } from '../core-atoms/surd';
import { GenfracAtom, GenfracOptions } from '../core-atoms/genfrac';
import { DelimAtom } from '../core-atoms/delim';

import { Argument, argAtoms, defineFunction } from './definitions-utils';
import { PlaceholderAtom } from '../core-atoms/placeholder';
import { serializeLatexValue } from '../core/registers-utils';
import { LatexValue } from '../public/core-types';
import { Context } from '../core/context';
import { Box } from '../core/box';

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
    createAtom: (command, _args, style) =>
      new OperatorAtom(command, command.slice(1), {
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
  createAtom: (command, _args, style) =>
    new OperatorAtom(
      command,
      { '\\liminf': 'lim inf', '\\limsup': 'lim sup' }[command]!,
      {
        limits: 'over-under',
        variant: 'main',
        style,
      }
    ),
});

defineFunction(['lim', 'mod'], '', {
  ifMode: 'math',
  createAtom: (command, _args, style) =>
    new OperatorAtom(command, command.slice(1), {
      limits: 'over-under',
      variant: 'main',
      style,
    }),
});

// With Limits
defineFunction(['det', 'max', 'min'], '', {
  ifMode: 'math',
  isFunction: true,
  createAtom: (command, _args, style) =>
    new OperatorAtom(command, command.slice(1), {
      limits: 'over-under',
      isFunction: true,
      variant: 'main',
      style,
    }),
});

defineFunction(['ang'], '{:math}', {
  ifMode: 'math',
  createAtom: (command, args, style) =>
    new Atom({ command, body: argAtoms(args[0]), mode: 'math', style }),
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
  createAtom: (command, args, style) =>
    new SurdAtom(command, {
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
    createAtom: (command, args, style) => {
      console.log('---------funtions.ts > createAtom-------');
      console.warn('error!!');

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
      //when we enter a fraction "/" then enter a numberator then delete it the numerator, the placeholder is missing

      //replace !args=0] with an isEmpty function - if falsy or empty object
      let numerEmpty = false;
      if (args[0]) {
        numerEmpty = args[0]['group'].length === 0;
        console.log('numeratorEmpty:', numerEmpty);
      }
      return new GenfracAtom(
        command,
        numerEmpty ? [new PlaceholderAtom()] : argAtoms(args[0]),
        // !args[0] ? [new PlaceholderAtom()] : argAtoms(args[0]), //old
        !args[1] ? [new PlaceholderAtom()] : argAtoms(args[1]),
        genfracOptions
      );
    },
    serialize: (atom, options) => {
      let numer = atom.aboveToLatex(options);

      // if (numer === '') numer = '\\placeholder{}'; //delete
      // console.log('serialize with numer:', numer);

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
  createAtom: (command, args, style) =>
    new GenfracAtom(command, argAtoms(args[0]), argAtoms(args[1]), {
      hasBarLine: false,
      leftDelim: command === '\\brace' ? '\\lbrace' : '\\lbrack',
      rightDelim: command === '\\brace' ? '\\rbrace' : '\\rbrack',
      style,
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
  createAtom: (command, args, style) => {
    let leftDelim: string | undefined = undefined;
    let rightDelim: string | undefined = undefined;

    if (command === '\\choose') {
      leftDelim = '(';
      rightDelim = ')';
    }

    return new GenfracAtom(command, argAtoms(args[0]), argAtoms(args[1]), {
      hasBarLine: command === '\\over',
      leftDelim,
      rightDelim,
      style,
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
      command,
      args: [Argument | null, Argument | null, string | null, string | null],
      style
    ) =>
      new GenfracAtom(command, argAtoms(args[0]), argAtoms(args[1]), {
        leftDelim: args[2] ?? '.',
        rightDelim: args[3] ?? '.',
        hasBarLine: false,
        style,
      }),
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
  createAtom: (command, args, style) =>
    new GenfracAtom(command, argAtoms(args[0]), argAtoms(args[1]), {
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
    createAtom: (command, args, style) =>
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
  createAtom: (command, args, style) =>
    new OperatorAtom(command, '\u222B', {
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
  createAtom: (command, args, style) =>
    new OperatorAtom(command, EXTENSIBLE_SYMBOLS[command.slice(1)], {
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
  createAtom: (command, args, style) =>
    new OperatorAtom(
      command,
      { '\\Re': '\u211C', '\\Im': '\u2111' }[command]!,
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
  createAtom: (command, args: [string | null], style) =>
    new DelimAtom(command, args[0] ?? '|', { size: 1, style }),
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
  createAtom: (command, args: [LatexValue | null], style) =>
    new Atom({
      command,
      captureSelection: true,
      args,
      style,
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
