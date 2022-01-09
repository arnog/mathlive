import {
  ApplyStyleDefinitionOptions,
  Argument,
  CreateAtomOptions,
  defineFunction,
} from './definitions-utils';
import { Atom, BBoxParameter, ToLatexOptions } from '../core/atom-class';
import {
  FontShape,
  FontSeries,
  FontSize,
  Dimension,
  Glue,
} from '../public/core';
import { GroupAtom } from '../core-atoms/group';
import { BoxAtom } from '../core-atoms/box';
import { PhantomAtom } from '../core-atoms/phantom';
import { SizedDelimAtom } from '../core-atoms/delim';
import { SpacingAtom } from '../core-atoms/spacing';
import { LineAtom } from '../core-atoms/line';
import { OverunderAtom } from '../core-atoms/overunder';
import { OverlapAtom } from '../core-atoms/overlap';
import { GenfracAtom } from '../core-atoms/genfrac';
import { RuleAtom } from '../core-atoms/rule';
import { OperatorAtom } from '../core-atoms/operator';
import { MathstyleName } from '../core/mathstyle';
import { BoxType } from '../core/box';
import { PrivateStyle } from '../core/context';

defineFunction('ensuremath', '{:math}', {
  createAtom: (_name: string, args: Argument[], style: PrivateStyle): Atom =>
    new GroupAtom(args[0] as Atom[], {
      mode: 'math',
      latexOpen: '\\ensuremath{',
      latexClose: '}',
      style,
      // mathstyleName: 'textstyle',
    }),
});

defineFunction('color', '{:string}', {
  applyStyle: (
    _name,
    args,
    options: ApplyStyleDefinitionOptions
  ): PrivateStyle => {
    const color = args[0] as string;
    return {
      verbatimColor: args[0] as string,
      color: options.colorMap?.(color) ?? color,
    };
  },
});

// From the xcolor package.
// Unlike what its name might suggest, this command does not set the mode to text
// That is, it can equally be applied to math and text mode.
defineFunction('textcolor', '{:string}{content:auto*}', {
  applyStyle: (
    _name,
    args,
    options: ApplyStyleDefinitionOptions
  ): PrivateStyle => {
    const color = args[0] as string;
    return {
      verbatimColor: color,
      color: options.colorMap?.(color) ?? color,
    };
  },
});

// Can be preceded by e.g. '\fboxsep=4pt' (also \fboxrule)
// Note:
// - \boxed: sets content in displaystyle mode (@todo: should change type of argument)
//      equivalent to \fbox{$$<content>$$}
// - \fbox: sets content in 'auto' mode (frequency 777)
// - \framebox[<width>][<alignment>]{<content>} (<alignment> := 'c'|'t'|'b' (center, top, bottom) (frequency 28)
// @todo
defineFunction('boxed', '{content:math}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
    new BoxAtom(name, args[0] as Atom[], {
      framecolor: 'black',
      style,
    }),
});

// Technically, using a BoxAtom is more correct (there is a small margin around it)
// However, just changing the background color makes editing easier
defineFunction('colorbox', '{:string}{content:auto*}', {
  applyMode: 'text',
  applyStyle: (
    _name,
    args,
    options: ApplyStyleDefinitionOptions
  ): PrivateStyle => {
    const color = args[0] as string;
    return {
      verbatimBackgroundColor: args[0] as string,
      backgroundColor: options.backgroundColorMap?.(color) ?? color,
    };
  },
});

defineFunction(
  'fcolorbox',
  '{frame-color:string}{background-color:string}{content:auto}',
  {
    applyMode: 'text',
    createAtom: (
      name: string,
      args: Argument[],
      style: PrivateStyle,
      options: CreateAtomOptions
    ): Atom => {
      const color = args[0] as string;
      const bgColor = args[1] as string;
      return new BoxAtom(name, args[2] as Atom[], {
        verbatimFramecolor: color, // Save this value to restore it verbatim later
        framecolor: options.colorMap?.(color) ?? color,
        verbatimBackgroundcolor: args[1] as string, // Save this value to restore it verbatim later
        backgroundcolor: options.backgroundColorMap?.(bgColor) ?? bgColor,
        style,
        serialize: (atom: BoxAtom, options: ToLatexOptions) =>
          `${atom.command}{${atom.verbatimFramecolor ?? atom.framecolor}{${
            atom.verbatimBackgroundcolor ?? atom.backgroundcolor
          }}{${atom.bodyToLatex(options)}}`,
      });
    },
  }
);

// \bbox, MathJax extension
// The first argument is a CSS border property shorthand, e.g.
//      \bbox[red], \bbox[5px,border:2px solid red]
// The MathJax syntax is
//      arglist ::= <arg>[,<arg>[,<arg>]]
//      arg ::= [<background:string>|<padding:dimen>|<style>]
//      style ::= 'border:' <string>

defineFunction('bbox', '[:bbox]{body:auto}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom => {
    if (args[0]) {
      const arg = args[0] as BBoxParameter;
      return new BoxAtom(name, args[1] as Atom[], {
        padding: arg.padding,
        border: arg.border,
        backgroundcolor: arg.backgroundcolor,
        style,
        serialize: (atom: BoxAtom, options: ToLatexOptions) => {
          let result = name;
          if (
            Number.isFinite(atom.padding) ||
            atom.border !== undefined ||
            atom.backgroundcolor !== undefined
          ) {
            const bboxParameters: string[] = [];
            if (atom.padding) {
              bboxParameters.push(atom.padding!);
            }

            if (atom.border) {
              bboxParameters.push(`border: ${atom.border!}`);
            }

            if (atom.verbatimBackgroundcolor || atom.backgroundcolor) {
              bboxParameters.push(
                atom.verbatimBackgroundcolor! ?? atom.backgroundcolor!
              );
            }

            result += `[${bboxParameters.join(',')}]`;
          }

          return result + `{${atom.bodyToLatex(options)}}`;
        },
      });
    }

    return new BoxAtom(name, args[1] as Atom[], { style });
  },
});

// The `\displaystyle` and `\textstyle` commands do not change the current size
// but they do change how some of the layout is done.
// `\scriptstyle` reduces the size by one on the FontSizeScale, and
// `\scriptscriptstyle` reduces it by two.
defineFunction(
  ['displaystyle', 'textstyle', 'scriptstyle', 'scriptscriptstyle'],
  '{:rest}',
  {
    createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
      new GroupAtom(args[0] as Atom[], {
        latexOpen: `{${name} `,
        latexClose: '}',
        style,
        mathstyleName: name.slice(1) as MathstyleName,
      }),
  }
);

// Size
//
// These size function are absolute. That is applying `\Large \Large X` does
// not make twice as "Large".
//
// This is unlike the `\scriptstyle` and `\scriptscriptstyle` commands, which
// are relative, that is `\scriptstyle \scriptstyle x` is smaller than
// `\scriptstyle x`.
defineFunction(
  [
    'tiny',
    'scriptsize',
    'footnotesize',
    'small',
    'normalsize',
    'large',
    'Large',
    'LARGE',
    'huge',
    'Huge',
  ],
  '',
  {
    // TeX behaves very inconsistently when sizing commands are applied
    // to math mode. We allow sizing commands to be applied in both math and
    // text mode
    applyStyle: (name, _args): PrivateStyle => {
      return {
        fontSize: {
          '\\tiny': 1,
          '\\scriptsize': 2, // Not to be confused with \scriptstyle
          '\\footnotesize': 3,
          '\\small': 4,
          '\\normalsize': 5,
          '\\large': 6,
          '\\Large': 7,
          '\\LARGE': 8,
          '\\huge': 9,
          '\\Huge': 10,
        }[name] as FontSize,
      };
    },
  }
);

// \fontseries only works in text mode
defineFunction('fontseries', '{:string}', {
  ifMode: 'text',
  applyStyle: (_name, args): PrivateStyle => {
    return { fontSeries: args[0] as string as FontSeries };
  },
});
// SHAPE: italic, small caps
defineFunction('fontshape', '{:string}', {
  ifMode: 'text',
  applyStyle: (_name, args): PrivateStyle => {
    return { fontShape: args[0] as FontShape };
  },
});

// FONT FAMILY: Fraktur, Calligraphic, ...
defineFunction('fontfamily', '{:string}', {
  ifMode: 'text',
  applyStyle: (_name, args): PrivateStyle => {
    return { fontFamily: args[0] as string };
  },
});

// In LaTeX, the \fontseries, \fontshape, \fontfamily, \fontsize commands
// do not take effect until \selectfont is encoded. In our implementation,
// they take effect immediately, and \selectfont is a no-op
defineFunction('selectfont', '', {
  ifMode: 'text',
  applyStyle: (_name, _args): PrivateStyle => {
    return {};
  },
});

// \bf works in any mode
// As per the LaTeX 2.09 semantics, it overrides shape, family
defineFunction('bf', '', {
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontSeries: 'b', fontShape: 'n', fontFamily: 'cmr' };
  },
});

// Note: These function work a little bit differently than LaTex
// In LaTeX, \bm{x\mathrm{y}} yield a bold x and an upright y.
// This is not necesarily intentional, but a side effect of the (current)
// implementation of \bm
defineFunction(['boldsymbol', 'bm'], '{:math*}', {
  applyMode: 'math',
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
    new GroupAtom(args[0] as Atom[], {
      latexOpen: `${name}{`,
      latexClose: '}',
      style,
      customClass: 'ML__boldsymbol',
    }),
});

// Note: switches to math mode
defineFunction('bold', '{:math*}', {
  applyMode: 'math',
  applyStyle: (_name, _args): PrivateStyle => {
    return { variantStyle: 'bold' };
  },
});

defineFunction('bfseries', '', {
  applyMode: 'text',
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontSeries: 'b' };
  },
});
defineFunction('mdseries', '', {
  applyMode: 'text',
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontSeries: 'm' };
  },
});
defineFunction('upshape', '', {
  applyMode: 'text',
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontShape: 'n' };
  },
});
defineFunction('slshape', '', {
  applyMode: 'text',
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontShape: 'sl' };
  },
});
// Small caps
defineFunction('scshape', '', {
  applyMode: 'text',
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontShape: 'sc' };
  },
});

defineFunction('textbf', '{:text*}', {
  applyMode: 'text',
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontSeries: 'b' };
  },
});
defineFunction('textmd', '{:text*}', {
  applyMode: 'text',
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontSeries: 'm' };
  },
});

defineFunction('textup', '{:text*}', {
  applyMode: 'text',
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontShape: 'n' };
  },
});

// @todo: family could be 'none' or 'default'
// "normal" font of the body text, not necessarily roman
defineFunction('textnormal', '{:text*}', {
  applyMode: 'text',
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontShape: 'n', fontSeries: 'm' };
  },
});

defineFunction('textsl', '{:text*}', {
  applyMode: 'text',
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontShape: 'sl' };
  },
});

defineFunction('textit', '{:text*}', {
  applyMode: 'text',
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontShape: 'it' };
  },
});

defineFunction('textsc', '{:text*}', {
  applyMode: 'text',
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontShape: 'sc' };
  },
});
defineFunction('textrm', '{:text*}', {
  applyMode: 'text',
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontFamily: 'roman' };
  },
});

defineFunction('textsf', '{:text*}', {
  applyMode: 'text',
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontFamily: 'sans-serif' };
  },
});

defineFunction('texttt', '{:text*}', {
  applyMode: 'text',
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontFamily: 'monospace' };
  },
});

// Note: \mathbf is a no-op in text mode
defineFunction('mathbf', '{:math*}', {
  applyMode: 'math',
  applyStyle: (_name, _args): PrivateStyle => {
    return { variant: 'normal', variantStyle: 'bold' };
  },
});

defineFunction('mathit', '{:math*}', {
  applyMode: 'math',
  applyStyle: (_name, _args): PrivateStyle => {
    return { variant: 'normal', variantStyle: 'italic' };
  },
});

// From the ISOMath package
defineFunction('mathbfit', '{:math*}', {
  applyMode: 'math',
  applyStyle: (_name, _args): PrivateStyle => {
    return { variant: 'normal', variantStyle: 'bolditalic' };
  },
});

defineFunction('mathrm', '{:math*}', {
  applyMode: 'math',
  applyStyle: (_name, _args): PrivateStyle => {
    return { variant: 'normal', variantStyle: 'up' };
  },
});

defineFunction('mathsf', '{:math*}', {
  applyMode: 'math',
  applyStyle: (_name, _args): PrivateStyle => {
    return { variant: 'sans-serif', variantStyle: 'up' };
  },
});
defineFunction('mathtt', '{:math*}', {
  applyMode: 'math',
  applyStyle: (_name, _args): PrivateStyle => {
    return { variant: 'monospace', variantStyle: 'up' };
  },
});

defineFunction('it', '', {
  applyStyle: (_name, _args): PrivateStyle => {
    return {
      fontSeries: 'm',
      fontShape: 'it',
      fontFamily: 'cmr',
      variantStyle: 'italic', // For math mode
    };
  },
});

// In LaTeX, \rmfamily, \sffamily and \ttfamily are no-op in math mode.
defineFunction('rmfamily', '', {
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontFamily: 'roman' };
  },
});

defineFunction('sffamily', '', {
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontFamily: 'sans-serif' };
  },
});

defineFunction('ttfamily', '', {
  applyStyle: (_name, _args): PrivateStyle => {
    return { fontFamily: 'monospace' };
  },
});

// In LaTeX, \Bbb and \mathbb are no-op in text mode.
// They also map lowercase characters to different glyphs.
// Note that \Bbb has been deprecated for over 20 years (as well as \rm, \it, \bf)
defineFunction(['Bbb', 'mathbb'], '{:math*}', {
  applyStyle: (_name, _args): PrivateStyle => {
    return { variant: 'double-struck', variantStyle: 'up' };
  },
});

defineFunction(['frak', 'mathfrak'], '{:math*}', {
  applyStyle: (_name, _args) => {
    return { variant: 'fraktur', variantStyle: 'up' };
  },
});

defineFunction('mathcal', '{:math*}', {
  applyStyle: (_name, _args) => {
    return { variant: 'calligraphic', variantStyle: 'up' };
  },
});

defineFunction('mathscr', '{:math*}', {
  applyStyle: (_name, _args): PrivateStyle => {
    return { variant: 'script', variantStyle: 'up' };
  },
});

/*
 * Rough synomym for \text{}
 * An \mbox within math mode does not use the current math font; rather it uses
 * the typeface of the surrounding running text.
 */
defineFunction('mbox', '{:text}', {
  ifMode: 'math',
  createAtom: (_name: string, args: Argument[], style: PrivateStyle): Atom =>
    new GroupAtom(args[0] as Atom[], {
      changeMode: true,
      style,
      mode: 'text',
      serialize: (atom: GroupAtom, options: ToLatexOptions) =>
        `\\mbox{${atom.bodyToLatex({
          ...options,
          skipModeCommand: true,
        })}}`,
    }),
});

defineFunction('text', '{:text}', {
  ifMode: 'math',
  applyMode: 'text',
});

/* A MathJax extension: assign a class to the element */
defineFunction('class', '{name:string}{content:auto*}', {
  createAtom: (_command: string, args: Argument[], style: PrivateStyle): Atom =>
    new GroupAtom(args[1] as Atom[], {
      customClass: args[0] as string,
      style,
    }),
});

/* A MathJax extension: assign an ID to the element */
defineFunction('cssId', '{id:string}{content:auto}', {
  createAtom: (command: string, args: Argument[], style: PrivateStyle): Atom =>
    new GroupAtom(args[1] as Atom[], {
      cssId: args[0] as string,
      style,
    }),
});

/*  assign an property to the element */
defineFunction('htmlData', '{data:string}{content:auto}', {
  createAtom: (command: string, args: Argument[], style: PrivateStyle): Atom =>
    new GroupAtom(args[1] as Atom[], {
      htmlData: args[0] as string,
      style,
    }),
});

/* assign CSS styles to the element */
defineFunction('htmlStyle', '{data:string}{content:auto}', {
  createAtom: (command: string, args: Argument[], style: PrivateStyle): Atom =>
    new GroupAtom(args[1] as Atom[], {
      htmlStyle: args[0] as string,
      style,
    }),
});

/* Note: in TeX, \em is restricted to text mode. We extend it to math
 * This is the 'switch' variant of \emph, i.e:
 * `\emph{important text}`
 * `{\em important text}`
 */
defineFunction('em', '{:auto*}', {
  createAtom: (command: string, args: Argument[], style: PrivateStyle): Atom =>
    new GroupAtom(args[0] as Atom[], {
      latexOpen: '\\em',
      latexClose: '',
      customClass: 'ML__emph',
      style,
    }),
});

/* Note: in TeX, \emph is restricted to text mode. We extend it to math */
defineFunction('emph', '{:auto}', {
  createAtom: (command: string, args: Argument[], style: PrivateStyle): Atom =>
    new GroupAtom(args[0] as Atom[], {
      latexOpen: '\\emph{',
      latexClose: '}',
      customClass: 'ML__emph',
      style,
    }),
});

// Extra data needed for the delimiter parse function down below
const DELIMITER_SIZES = {
  '\\bigl': { mclass: 'mopen', size: 1 },
  '\\Bigl': { mclass: 'mopen', size: 2 },
  '\\biggl': { mclass: 'mopen', size: 3 },
  '\\Biggl': { mclass: 'mopen', size: 4 },
  '\\bigr': { mclass: 'mclose', size: 1 },
  '\\Bigr': { mclass: 'mclose', size: 2 },
  '\\biggr': { mclass: 'mclose', size: 3 },
  '\\Biggr': { mclass: 'mclose', size: 4 },
  '\\bigm': { mclass: 'mrel', size: 1 },
  '\\Bigm': { mclass: 'mrel', size: 2 },
  '\\biggm': { mclass: 'mrel', size: 3 },
  '\\Biggm': { mclass: 'mrel', size: 4 },
  '\\big': { mclass: 'mord', size: 1 },
  '\\Big': { mclass: 'mord', size: 2 },
  '\\bigg': { mclass: 'mord', size: 3 },
  '\\Bigg': { mclass: 'mord', size: 4 },
};

defineFunction(
  [
    'bigl',
    'Bigl',
    'biggl',
    'Biggl',
    'bigr',
    'Bigr',
    'biggr',
    'Biggr',
    'bigm',
    'Bigm',
    'biggm',
    'Biggm',
    'big',
    'Big',
    'bigg',
    'Bigg',
  ],
  '{:delim}',
  {
    createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
      new SizedDelimAtom(name, args[0] as string, {
        size: DELIMITER_SIZES[name].size,
        delimClass: DELIMITER_SIZES[name].mclass,
        style,
      }),
  }
);

defineFunction(
  [
    'hspace',
    'hspace*',
    // \hspace* inserts a non-breakable space, but since we don't line break...
    // it's the same as \hspace.
  ],
  '{width:glue}',
  {
    createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
      new SpacingAtom(
        name,
        style,
        (args[0] as Glue) ?? { glue: { dimension: 0 } }
      ),
  }
);

defineFunction('mathop', '{:auto}', {
  createAtom: (command: string, args: Argument[], style: PrivateStyle): Atom =>
    new OperatorAtom(command, args[0] as Atom[], {
      type: 'mop',
      captureSelection: true,
      limits: 'over-under',
      isFunction: true,
      style,
    }),
});

defineFunction(
  [
    'mathbin',
    'mathrel',
    'mathopen',
    'mathclose',
    'mathpunct',
    'mathord',
    'mathinner',
  ],
  '{:auto}',
  {
    createAtom: (
      command: string,
      args: Argument[],
      style: PrivateStyle
    ): Atom =>
      new OperatorAtom(command, args[0] as Atom[], {
        type: (
          {
            '\\mathbin': 'mbin',
            '\\mathrel': 'mrel',
            '\\mathopen': 'mopen',
            '\\mathclose': 'mclose',
            '\\mathpunct': 'mpunct',
            '\\mathord': 'mord',
            '\\mathinner': 'minner',
          } as const
        )[command],
        captureSelection: true,
        style,
      }),
  }
);

// @todo see http://mirrors.ibiblio.org/CTAN/macros/latex/required/amsmath/amsopn.pdf
// for list of additional operators

defineFunction(['operatorname', 'operatorname*'], '{operator:math}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom => {
    const result = new OperatorAtom(name, args[0] as Atom[], {
      isFunction: true,
      limits: name === '\\operatorname' ? 'adjacent' : 'over-under',
      style,
    });
    result.captureSelection = true; // Do not let children be selected

    /*
        The \operatorname commands is defined with:

        \gdef\newmcodes@{\mathcode`\'39\mathcode`\*42\mathcode`\."613A%
        \ifnum\mathcode`\-=45 \else
            \mathchardef\std@minus\mathcode`\-\relax
        \fi
        \mathcode`\-45\mathcode`\/47\mathcode`\:"603A\relax}


        \mathcode assigns to a character its category (2=mbin), its font family (0=cmr),
        and its character code.

        It basically temporarily reassigns to ":.'-/*" the values/properties
        these characters have in text mode (but importantly, not to " " (space))

        */

    if (result.body) {
      result.body.forEach((x) => {
        if (x.type !== 'first') {
          x.type = 'mord';
          x.value = { '\u2217': '*', '\u2212': '-' }[x.value] ?? x.value;
          x.isFunction = false;
          if (!x.style.variant && !x.style.variantStyle) {
            // No variant as been specified (as it could have been with
            // \operatorname{\mathit{lim}} for example)
            // Bypass the default auto styling by specifing an upright style
            x.style.variant = 'main';
            x.style.variantStyle = 'up';
          }
        }
      });
    }
    return result;
  },
});

class UnicodeAtom extends Atom {
  codepoint: number;
  constructor(arg: string, style: PrivateStyle) {
    let codepoint = Number.parseInt(arg);
    if (!Number.isFinite(codepoint)) codepoint = 0x2753; // BLACK QUESTION MARK
    super('mord', {
      value: String.fromCodePoint(codepoint),
      style,
    });
    this.codepoint = codepoint;
  }

  serialize(_options: ToLatexOptions): string {
    return (
      '\\unicode"' +
      ('000000' + this.codepoint.toString(16)).toUpperCase().slice(-6)
    );
  }
}

defineFunction('unicode', '{charcode:number}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
    new UnicodeAtom(args[0] as string, style),
});

// A box of the width and height
defineFunction('rule', '[raise:dimen]{width:dimen}{thickness:dimen}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
    new RuleAtom(name, {
      shift: args[0] as Dimension,
      width: args[1] as Dimension,
      height: args[2] as Dimension,
      style,
    }),
});

// An overline
defineFunction('overline', '{:auto}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
    new LineAtom(name, args[0] as Atom[], {
      position: 'overline',
      style,
    }),
});

defineFunction('underline', '{:auto}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
    new LineAtom(name, args[0] as Atom[], {
      position: 'underline',
      style,
    }),
});

export function binRelType(atoms: Atom[]): BoxType {
  if (atoms.length === 1) {
    const atom = atoms[0];
    if (atom.type === 'mbin') return 'mbin';
    if (atom.type === 'mrel') return 'mrel';
  }
  return 'mord';
}

defineFunction('overset', '{above:auto}{base:auto}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
    new OverunderAtom(name, {
      above: args[0] as Atom[],
      body: args[1] as Atom[],
      skipBoundary: false,
      style,
      boxType: binRelType(args[1] as Atom[]),
      serialize: (atom: OverunderAtom, options: ToLatexOptions) =>
        `${atom.command}{${atom.aboveToLatex(options)}}` +
        `{${atom.bodyToLatex(options)}}`,
    }),
});

defineFunction('underset', '{below:auto}{base:auto}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
    new OverunderAtom(name, {
      below: args[0] as Atom[],
      body: args[1] as Atom[],
      skipBoundary: false,
      style,
      boxType: binRelType(args[1] as Atom[]),
      serialize: (atom: OverunderAtom, options: ToLatexOptions) =>
        `${name}{${atom.belowToLatex(options)}}` +
        `{${atom.bodyToLatex(options)}}`,
    }),
});

defineFunction('overunderset', '{above:auto}{below:auto}{base:auto}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
    new OverunderAtom(name, {
      above: args[0] as Atom[],
      below: args[1] as Atom[],
      body: args[2] as Atom[],
      skipBoundary: false,
      style,
      boxType: binRelType(args[2] as Atom[]),
      serialize: (atom: OverunderAtom, options: ToLatexOptions) =>
        `${atom.command}{${atom.aboveToLatex(options)}}` +
        `{${atom.bodyToLatex(options)}}`,
    }),
});

// `\stackrel` and `\stackbin` stack an item and provide an explicit
// atom type of the result. They are considered obsolete commands.
// `\underset` and `\overset` are recommended instead, which automatically
// calculate the resulting type.
defineFunction(
  ['stackrel', 'stackbin'],
  '[below:auto]{above:auto}{base:auto}',
  {
    createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
      new OverunderAtom(name, {
        body: args[2] as Atom[],
        above: args[1] as Atom[],
        below: args[0] as Atom[],
        skipBoundary: false,
        style,
        boxType: name === '\\stackrel' ? 'mrel' : 'mbin',
        serialize: (atom: OverunderAtom, options: ToLatexOptions) =>
          `${atom.command}{${atom.aboveToLatex(options)}}` +
          `{${atom.bodyToLatex(options)}}`,
      }),
  }
);

defineFunction(
  ['overwithdelims', 'atopwithdelims'],
  '{numer:auto}{denom:auto}{left-delim:delim}{right-delim:delim}',
  {
    infix: true,
    createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
      new GenfracAtom(name, args[0] as Atom[], args[1] as Atom[], {
        leftDelim: args[2] as string,
        rightDelim: args[3] as string,
        hasBarLine: false,
        style,
        serialize: (atom: GenfracAtom, options: ToLatexOptions) =>
          `${atom.aboveToLatex(options)} ${atom.command}${atom.leftDelim}${
            atom.rightDelim
          }${atom.belowToLatex(options)}`,
      }),
  }
);

defineFunction('smash', '[:string]{:auto}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom => {
    if (!args[0]) {
      return new PhantomAtom(name, args[1] as Atom[], {
        smashHeight: true,
        smashDepth: true,
        style,
      });
    }

    return new PhantomAtom(name, args[1] as Atom[], {
      smashHeight: (args[0] as string).includes('t'),
      smashDepth: (args[0] as string).includes('b'),
      style,
    });
  },
});

defineFunction(['vphantom'], '{:auto*}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
    new PhantomAtom(name, args[1] as Atom[], {
      isInvisible: true,
      smashWidth: true,
      style,
    }),
});

defineFunction(['hphantom'], '{:auto*}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
    new PhantomAtom(name, args[1] as Atom[], {
      isInvisible: true,
      smashHeight: true,
      smashDepth: true,
      style,
    }),
});

defineFunction(['phantom'], '{:auto*}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
    new PhantomAtom(name, args[1] as Atom[], {
      isInvisible: true,
      style,
    }),
});

defineFunction('not', '{:math}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom => {
    if (args.length < 1 || args[0] === null) {
      return new Atom('mrel', { command: name, style, value: '\ue020' });
    }
    const arg = args[0] as Atom[];
    return new GroupAtom(
      [
        new OverlapAtom(name, '\ue020', {
          align: 'right',
          style,
          boxType: 'mrel',
        }),
        ...arg,
      ],
      {
        boxType: 'mrel',
        captureSelection: true,
        serialize: (atom: GroupAtom, options) => {
          const argLatex = Atom.serialize(arg, options);
          if (argLatex.length === 1 && !/[a-zA-Z]/.test(argLatex)) {
            return '\\not' + argLatex;
          }
          return `\\not{${argLatex}}`;
        },
      }
    );
  },
});

defineFunction(['ne', 'neq'], '', {
  createAtom: (name: string, _args: Argument[], style: PrivateStyle): Atom =>
    new GroupAtom(
      [
        new OverlapAtom(name, '\ue020', {
          align: 'right',
          style,
          boxType: 'mrel',
        }),
        new Atom('mrel', { style, value: '=' }),
      ],
      { boxType: 'mrel', captureSelection: true, serialize: () => name }
    ),
});

defineFunction('rlap', '{:auto}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
    new OverlapAtom(name, args[0] as Atom[], { align: 'right', style }),
});

defineFunction('llap', '{:auto}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
    new OverlapAtom(name, args[0] as Atom[], { style }),
});

defineFunction('mathllap', '{:auto}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
    new OverlapAtom(name, args[0] as Atom[], { style }),
});

defineFunction('mathrlap', '{:auto}', {
  createAtom: (name: string, args: Argument[], style: PrivateStyle): Atom =>
    new OverlapAtom(name, args[0] as Atom[], { align: 'right', style }),
});
