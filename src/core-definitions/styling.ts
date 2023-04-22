import { Atom, BBoxParameter, ToLatexOptions } from '../core/atom-class';

import { GroupAtom } from '../core-atoms/group';
import { BoxAtom } from '../core-atoms/box';
import { ChoiceAtom } from '../core-atoms/choice';
import { PhantomAtom } from '../core-atoms/phantom';
import { SizedDelimAtom } from '../core-atoms/delim';
import { SpacingAtom } from '../core-atoms/spacing';
import { LineAtom } from '../core-atoms/line';
import { OverunderAtom } from '../core-atoms/overunder';
import { OverlapAtom } from '../core-atoms/overlap';
import '../core-atoms/genfrac';
import { RuleAtom } from '../core-atoms/rule';
import { OperatorAtom } from '../core-atoms/operator';

import { Argument, argAtoms, defineFunction } from './definitions-utils';
import { TooltipAtom } from '../core-atoms/tooltip';
import type {
  FontSize,
  FontSeries,
  FontShape,
  Glue,
  Dimension,
  MathstyleName,
} from '../public/core-types';
import { GlobalContext, PrivateStyle } from '../core/types';
import { latexCommand } from '../core/tokenizer';
import { atomsBoxType } from '../core/box';
import { NewLineAtom } from '../core-atoms/newline';

defineFunction('mathtip', '{:math}{:math}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new TooltipAtom(argAtoms(args[0]), argAtoms(args[1]), context, {
      command: name,
      content: 'math',
      style,
    }),
});

defineFunction('texttip', '{:math}{:text}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new TooltipAtom(argAtoms(args[0]), argAtoms(args[1]), context, {
      command: name,
      content: 'text',
      style,
    }),
});

defineFunction('error', '{:math}', {
  createAtom: (
    _name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new GroupAtom(argAtoms(args[0]), context, {
      mode: 'math',
      command: '\\error',
      renderClass: 'ML__error',
      style,
    }),
});

defineFunction('ensuremath', '{:math}', {
  // applyMode: 'math',
  createAtom: (
    _name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new GroupAtom(argAtoms(args[0]), context, {
      mode: 'math',
      latexOpen: '\\ensuremath{',
      latexClose: '}',
      style,
      // mathstyleName: 'textstyle',
    }),
});

defineFunction('color', '{:string}', {
  applyStyle: (_name, context, args: (string | null)[]) => {
    const color = args[0] ?? 'red';
    return {
      verbatimColor: args[0] ?? undefined,
      color: context.colorMap?.(color) ?? color,
    };
  },
});

// From the xcolor package.
// Unlike what its name might suggest, this command does not set the mode to text
// That is, it can equally be applied to math and text mode.
defineFunction('textcolor', '{:string}{content:auto*}', {
  applyStyle: (_name, context, args: (string | null)[]) => {
    const color = args[0] ?? 'red';
    return {
      verbatimColor: args[0] ?? undefined,
      color: context.colorMap?.(color) ?? color,
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
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new BoxAtom(name, argAtoms(args[0]), context, {
      framecolor: 'black',
      style,
    }),
});

// Technically, using a BoxAtom is more correct (there is a small margin around it)
// However, just changing the background color makes editing easier
defineFunction('colorbox', '{:string}{content:auto*}', {
  applyMode: 'text',
  applyStyle: (_name, context, args: (string | null)[]) => {
    const color = args[0] ?? 'yellow';
    return {
      verbatimBackgroundColor: args[0] ?? undefined,
      backgroundColor: context.backgroundColorMap?.(color) ?? color,
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
      context: GlobalContext,
      style: PrivateStyle,
      args: [null | string, null | string, null | Argument]
    ): Atom => {
      const color = args[0] ?? 'blue';
      const bgColor = args[1] ?? 'yellow';
      return new BoxAtom(name, argAtoms(args[2]), context, {
        verbatimFramecolor: color, // Save this value to restore it verbatim later
        framecolor: context.colorMap?.(color) ?? color,
        verbatimBackgroundcolor: args[1] ?? undefined, // Save this value to restore it verbatim later
        backgroundcolor: context.backgroundColorMap?.(bgColor) ?? bgColor,
        style,
        serialize: (atom: BoxAtom, options: ToLatexOptions) =>
          latexCommand(
            atom.command,
            atom.verbatimFramecolor ?? atom.framecolor ?? '',
            atom.verbatimBackgroundcolor ?? atom.backgroundcolor ?? '',
            atom.bodyToLatex(options)
          ),
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
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: [BBoxParameter | null, null | Argument]
  ): Atom => {
    if (args[0]) {
      const arg = args[0];
      return new BoxAtom(name, argAtoms(args[1]), context, {
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
            if (atom.padding) bboxParameters.push(atom.padding!);

            if (atom.border) bboxParameters.push(`border: ${atom.border!}`);

            if (atom.verbatimBackgroundcolor || atom.backgroundcolor) {
              bboxParameters.push(
                atom.verbatimBackgroundcolor! ?? atom.backgroundcolor!
              );
            }

            result += `[${bboxParameters.join(',')}]`;
          }

          return latexCommand(result, atom.bodyToLatex(options));
        },
      });
    }

    return new BoxAtom(name, argAtoms(args[1]), context, { style });
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
    createAtom: (
      name: string,
      context: GlobalContext,
      style: PrivateStyle,
      args: (null | Argument)[]
    ): Atom =>
      new GroupAtom(argAtoms(args[0]), context, {
        latexOpen: `{${name} `,
        latexClose: '}',
        style,
        mathstyleName: name.slice(1) as MathstyleName,
        break: true,
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
    applyStyle: (name): PrivateStyle => {
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
  applyStyle: (_name, _context, args: [null | FontSeries]): PrivateStyle => {
    return { fontSeries: args[0] ?? 'auto' };
  },
});
// SHAPE: italic, small caps
defineFunction('fontshape', '{:string}', {
  ifMode: 'text',
  applyStyle: (_name, _context, args: [null | FontShape]): PrivateStyle => {
    return { fontShape: args[0] ?? 'auto' };
  },
});

// FONT FAMILY: Fraktur, Calligraphic, ...
defineFunction('fontfamily', '{:string}', {
  ifMode: 'text',
  applyStyle: (_name, _context, args: [null | string]): PrivateStyle => {
    return { fontFamily: args[0] ?? 'roman' };
  },
});

// In LaTeX, the \fontseries, \fontshape, \fontfamily, \fontsize commands
// do not take effect until \selectfont is encoded. In our implementation,
// they take effect immediately, and \selectfont is a no-op
defineFunction('selectfont', '', {
  ifMode: 'text',
  applyStyle: () => ({}),
});

// \bf works in any mode
// As per the LaTeX 2.09 semantics, it overrides shape, family
defineFunction('bf', '', {
  applyStyle: () => ({ fontSeries: 'b', fontShape: 'n', fontFamily: 'cmr' }),
});

// Note: These function work a little bit differently than LaTex
// In LaTeX, \bm{x\mathrm{y}} yield a bold x and an upright y.
// This is not necesarily intentional, but a side effect of the (current)
// implementation of \bm
defineFunction(['boldsymbol', 'bm'], '{:math*}', {
  applyMode: 'math',
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new GroupAtom(argAtoms(args[0]), context, {
      latexOpen: `${name}{`,
      latexClose: '}',
      style,
      renderClass: 'ML__boldsymbol',
    }),
});

// Note: switches to math mode
defineFunction('bold', '{:math*}', {
  applyMode: 'math',
  applyStyle: () => ({ variantStyle: 'bold' }),
});

defineFunction('bfseries', '', {
  applyMode: 'text',
  applyStyle: () => ({ fontSeries: 'b' }),
});
defineFunction('mdseries', '', {
  applyMode: 'text',
  applyStyle: () => ({ fontSeries: 'm' }),
});
defineFunction('upshape', '', {
  applyMode: 'text',
  applyStyle: () => ({ fontShape: 'n' }),
});
defineFunction('slshape', '', {
  applyMode: 'text',
  applyStyle: () => ({ fontShape: 'sl' }),
});
// Small caps
defineFunction('scshape', '', {
  applyMode: 'text',
  applyStyle: () => ({ fontShape: 'sc' }),
});

defineFunction('textbf', '{:text*}', {
  applyMode: 'text',
  applyStyle: () => ({ fontSeries: 'b' }),
});
defineFunction('textmd', '{:text*}', {
  applyMode: 'text',
  applyStyle: () => ({ fontSeries: 'm' }),
});

defineFunction('textup', '{:text*}', {
  applyMode: 'text',
  applyStyle: () => ({ fontShape: 'n' }),
});

// @todo: family could be 'none' or 'default'
// "normal" font of the body text, not necessarily roman
defineFunction('textnormal', '{:text*}', {
  applyMode: 'text',
  applyStyle: () => ({ fontShape: 'n', fontSeries: 'm' }),
});

defineFunction('textsl', '{:text*}', {
  applyMode: 'text',
  applyStyle: () => ({ fontShape: 'sl' }),
});

defineFunction('textit', '{:text*}', {
  applyMode: 'text',
  applyStyle: () => ({ fontShape: 'it' }),
});

defineFunction('textsc', '{:text*}', {
  applyMode: 'text',
  applyStyle: () => ({ fontShape: 'sc' }),
});
defineFunction('textrm', '{:text*}', {
  applyMode: 'text',
  applyStyle: () => ({ fontFamily: 'roman' }),
});

defineFunction('textsf', '{:text*}', {
  applyMode: 'text',
  applyStyle: () => ({ fontFamily: 'sans-serif' }),
});

defineFunction('texttt', '{:text*}', {
  applyMode: 'text',
  applyStyle: () => ({ fontFamily: 'monospace' }),
});

// Note: \mathbf is a no-op in text mode
defineFunction('mathbf', '{:math*}', {
  applyMode: 'math',
  applyStyle: () => ({ variant: 'normal', variantStyle: 'bold' }),
});

// `\mathnormal` includes italic correction, `\mathit` doesn't
defineFunction('mathit', '{:math*}', {
  applyMode: 'math',
  applyStyle: () => ({ variant: 'main', variantStyle: 'italic' }),
});

// `\mathnormal` includes italic correction, `\mathit` doesn't
defineFunction('mathnormal', '{:math*}', {
  applyMode: 'math',
  applyStyle: () => ({ variant: 'normal', variantStyle: 'italic' }),
});

// From the ISOMath package
defineFunction('mathbfit', '{:math*}', {
  applyMode: 'math',
  applyStyle: () => ({ variant: 'main', variantStyle: 'bolditalic' }),
});

defineFunction('mathrm', '{:math*}', {
  applyMode: 'math',
  applyStyle: () => ({ variant: 'normal', variantStyle: 'up' }),
});

defineFunction('mathsf', '{:math*}', {
  applyMode: 'math',
  applyStyle: () => ({ variant: 'sans-serif', variantStyle: 'up' }),
});
defineFunction('mathtt', '{:math*}', {
  applyMode: 'math',
  applyStyle: () => ({ variant: 'monospace', variantStyle: 'up' }),
});

defineFunction('it', '', {
  applyStyle: () => ({
    fontSeries: 'm',
    fontShape: 'it',
    fontFamily: 'cmr',
    variantStyle: 'italic', // For math mode
  }),
});

// In LaTeX, \rmfamily, \sffamily and \ttfamily are no-op in math mode.
defineFunction('rmfamily', '', {
  applyStyle: () => ({ fontFamily: 'roman' }),
});

defineFunction('sffamily', '', {
  applyStyle: () => ({ fontFamily: 'sans-serif' }),
});

defineFunction('ttfamily', '', {
  applyStyle: () => ({ fontFamily: 'monospace' }),
});

// In LaTeX, \Bbb and \mathbb are no-op in text mode.
// They also map lowercase characters to different glyphs.
// Note that \Bbb has been deprecated for over 20 years (as well as \rm, \it, \bf)
defineFunction(['Bbb', 'mathbb'], '{:math*}', {
  applyStyle: () => ({ variant: 'double-struck', variantStyle: 'up' }),
});

defineFunction(['frak', 'mathfrak'], '{:math*}', {
  applyStyle: () => ({ variant: 'fraktur', variantStyle: 'up' }),
});

defineFunction('mathcal', '{:math*}', {
  applyStyle: () => ({ variant: 'calligraphic', variantStyle: 'up' }),
});

defineFunction('mathscr', '{:math*}', {
  applyStyle: () => ({ variant: 'script', variantStyle: 'up' }),
});

/*
 * Rough synomym for \text{}
 * An \mbox within math mode does not use the current math font; rather it uses
 * the typeface of the surrounding running text.
 */
defineFunction('mbox', '{:text}', {
  ifMode: 'math',
  createAtom: (
    command: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new GroupAtom(argAtoms(args[0]), context, {
      style,
      mode: 'text',
      command,
      serialize: (atom: GroupAtom, options: ToLatexOptions) =>
        latexCommand(
          '\\mbox',
          atom.bodyToLatex({
            ...options,
            skipModeCommand: true,
          })
        ),
    }),
});

defineFunction('text', '{:text}', {
  ifMode: 'math',
  applyMode: 'text',
});

/* A MathJax extension: assign a class to the element */
defineFunction('class', '{name:string}{content:auto*}', {
  createAtom: (
    _name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: [null | string, null | Argument]
  ): Atom =>
    new GroupAtom(argAtoms(args[1]), context, {
      customClass: args[0] ?? '',
      style,
    }),
});

/* A MathJax extension: assign an ID to the element */
defineFunction('cssId', '{id:string}{content:auto}', {
  createAtom: (
    _name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: [null | string, null | Argument]
  ): Atom =>
    new GroupAtom(argAtoms(args[1]), context, {
      cssId: args[0] ?? '',
      style,
    }),
});

/*  assign an property to the element */
defineFunction('htmlData', '{data:string}{content:auto}', {
  createAtom: (
    _name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: [null | string, null | Argument]
  ): Atom =>
    new GroupAtom(argAtoms(args[1]), context, {
      htmlData: args[0] ?? '',
      style,
    }),
});

/* assign CSS styles to the element */
defineFunction('htmlStyle', '{data:string}{content:auto}', {
  createAtom: (
    _name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: [null | string, null | Argument]
  ): Atom =>
    new GroupAtom(argAtoms(args[1]), context, {
      htmlStyle: args[0] ?? '',
      style,
    }),
});

/* Note: in TeX, \em is restricted to text mode. We extend it to math
 * This is the 'switch' variant of \emph, i.e:
 * `\emph{important text}`
 * `{\em important text}`
 */
defineFunction('em', '{:auto*}', {
  createAtom: (
    _name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new GroupAtom(argAtoms(args[0]), context, {
      latexOpen: '\\em',
      latexClose: '',
      renderClass: 'ML__emph',
      style,
    }),
});

/* Note: in TeX, \emph is restricted to text mode. We extend it to math */
defineFunction('emph', '{:auto}', {
  createAtom: (
    _name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new GroupAtom(argAtoms(args[0]), context, {
      latexOpen: '\\emph{',
      latexClose: '}',
      renderClass: 'ML__emph',
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
    createAtom: (
      name: string,
      context: GlobalContext,
      style: PrivateStyle,
      args: (null | string)[]
    ): Atom =>
      new SizedDelimAtom(name, args[0] ?? '.', context, {
        size: DELIMITER_SIZES[name].size,
        delimType: DELIMITER_SIZES[name].mclass,
        style,
      }),
  }
);

/*
% \hspace: register name or braced argument, glue in any unit
$$+\hspace{1ex}+$$
$$+\hspace{1em plus1ex minus 2pt}+$$
$$+\hspace\textwidth+$$
$$+\hspace{\textwidth}+$$
$$+\hspace\thinmuskip+$$ % Incompatible glue units
$$+\hspace1ex+$$         % Illegal unit of measure (pt inserted).
$$+\hspace{1}+$$         % Illegal unit of measure (pt inserted).
$$+\hspace10+$$          % Illegal unit of measure (pt inserted).
$$+\hspace1pt+$$         % Illegal unit of measure (pt inserted).
$$+\hspace1em+$$         % Illegal unit of measure (pt inserted).
*/
defineFunction(
  [
    'hspace',
    'hspace*',
    // \hspace* inserts a non-breakable space, but since we don't line break...
    // it's the same as \hspace.
  ],
  '{width:dimension}',
  {
    createAtom: (name, context, style, args: [null | Dimension]) =>
      new SpacingAtom(name, style, context, args[0] ?? { dimension: 0 }),
  }
);

/*

Compared to LaTeX, we're a bit more lenient:
- we accept any units, i.e. "mu" units in non-mu variants, and non-mu
   units in mu variants
- we accept both braced and unbraced variants


% \kern: register or unbraced glue in non-mu units
$$+\kern11pt+$$
$$+\kern11pt plus2ex minus3pt+$$
$$+\kern2em+$$
$$+\kern\thinmuskip+$$   % Incompatible glue units
$$+\kern{11pt}+$$        % Missing number, treated as zero

% \mkern: register or unbraced glue in mu units
$$+\mkern11mu+$$
$$+\mkern11mu plus1mu minus2mu+$$
$$+\mkern\thinmuskip+$$
$$+\mkern{\thinmuskip}+$$ % Illegal unit of measure (mu inserted).
$$+\mkern11+$$           % Illegal unit of measure (mu inserted).
$$+\mkern{11mu}+$$       % Missing number, treated as zero.

% \mskip: register or unbraced glue in mu units
$$+\mskip5mu+$$
$$+\mskip5mu plus 1mu minus 1mu+$$
$$+\mskip\thinmuskip+$$
$$+\mskip1em+$$          % Illegal unit of measure (mu inserted).
$$+\mskip5+$$            % Illegal unit of measure (mu inserted).
$$+\mskip{5}+$$          % Missing number, treated as zero

% \hskip: register or unbraced glue in non-mu units
$$+\hskip5pt+$$
$$+\hskip5pt plus 1em minus 1ex+$$
$$+\hskip\textwidth+$$
$$+\hskip1em+$$
$$+\hskip5+$$            % Illegal unit of measure (pt inserted).
$$+\hskip{5}+$$          % Missing number, treated as zero

 From amsmath
% \mspace: require register or braced glue in mu units
$$\mspace{12mu}+$$
$$\mspace{12mu plus 1mu minus 2mu}+$$
$$\mspace12mu+$$        % Illegal unit of measure (mu inserted).
$$\mspace1em+$$         % Illegal unit of measure (mu inserted).
$$\mspace1em plus 2ex+$$% Illegal unit of measure (mu inserted).
$$\mspace{1em}+$$       % Illegal unit of measure (mu inserted).
$$\mspace12+$$          % Illegal unit of measure (mu inserted).


*/
defineFunction(['mkern', 'kern', 'mskip', 'hskip', 'mspace'], '{width:glue}', {
  createAtom: (name, context, style, args: (null | Glue)[]) =>
    new SpacingAtom(name, style, context, args[0] ?? { dimension: 0 }),
});

// New line
defineFunction('\\', '', {
  createAtom: (command, context, style) =>
    new NewLineAtom(command, context, style),
});

defineFunction('mathop', '{:auto}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new OperatorAtom(name, argAtoms(args[0]), context, {
      type: 'mop',
      captureSelection: true,
      limits: 'over-under',
      isFunction: true,
      hasArgument: true,
      style,
    }),
});

defineFunction('mathchoice', '{:math}{:math}{:math}{:math}', {
  createAtom: (
    _name: string,
    context: GlobalContext,
    _style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new ChoiceAtom(
      args.map((x) => argAtoms(x)),
      context
    ),
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
      name: string,
      context: GlobalContext,
      style: PrivateStyle,
      args: (null | Argument)[]
    ): Atom =>
      new OperatorAtom(name, argAtoms(args[0]), context, {
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
        )[name],
        captureSelection: true,
        hasArgument: true,
        style,
      }),
  }
);

// @todo see http://mirrors.ibiblio.org/CTAN/macros/latex/required/amsmath/amsopn.pdf
// for list of additional operators

defineFunction(['operatorname', 'operatorname*'], '{operator:math}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom => {
    const result = new OperatorAtom(name, argAtoms(args[0]), context, {
      isFunction: true,
      hasArgument: true,
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
  constructor(codepoint: number, style: PrivateStyle, context: GlobalContext) {
    if (!Number.isFinite(codepoint)) codepoint = 0x2753; // BLACK QUESTION MARK
    super('mord', context, {
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
  createAtom: (
    _name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: [null | number]
  ): Atom => new UnicodeAtom(args[0] ?? 0xfffd, style, context),
});

// A box of the width and height
defineFunction('rule', '[raise:dimen]{width:dimen}{thickness:dimen}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Dimension)[]
  ): Atom =>
    new RuleAtom(name, context, {
      shift: args[0] ?? { dimension: 0 },
      width: args[1] ?? { dimension: 1, unit: 'em' },
      height: args[2] ?? { dimension: 1, unit: 'em' },
      style,
    }),
});

// An overline
defineFunction('overline', '{:auto}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new LineAtom(name, argAtoms(args[0]), context, {
      position: 'overline',
      style,
    }),
});

defineFunction('underline', '{:auto}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new LineAtom(name, argAtoms(args[0]), context, {
      position: 'underline',
      style,
    }),
});

defineFunction('overset', '{above:auto}{base:auto}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new OverunderAtom(name, context, {
      above: argAtoms(args[0]),
      body: argAtoms(args[1]),
      skipBoundary: false,
      style,
      boxType: atomsBoxType(argAtoms(args[1])),
      serialize: (atom: OverunderAtom, options: ToLatexOptions) =>
        latexCommand(
          atom.command,
          atom.aboveToLatex(options),
          atom.bodyToLatex(options)
        ),
    }),
});

defineFunction('underset', '{below:auto}{base:auto}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new OverunderAtom(name, context, {
      below: argAtoms(args[0]),
      body: argAtoms(args[1]),
      skipBoundary: false,
      style,
      boxType: atomsBoxType(argAtoms(args[1])),
      serialize: (atom: OverunderAtom, options: ToLatexOptions) =>
        latexCommand(
          name,
          atom.belowToLatex(options),
          atom.bodyToLatex(options)
        ),
    }),
});

defineFunction('overunderset', '{above:auto}{below:auto}{base:auto}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new OverunderAtom(name, context, {
      above: argAtoms(args[0]),
      below: argAtoms(args[1]),
      body: argAtoms(args[2]),
      skipBoundary: false,
      style,
      boxType: atomsBoxType(argAtoms(args[2])),
      serialize: (atom: OverunderAtom, options: ToLatexOptions) =>
        latexCommand(
          atom.command,
          atom.aboveToLatex(options),
          atom.bodyToLatex(options)
        ),
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
    createAtom: (
      name: string,
      context: GlobalContext,
      style: PrivateStyle,
      args: (null | Argument)[]
    ): Atom =>
      new OverunderAtom(name, context, {
        body: argAtoms(args[2]),
        above: argAtoms(args[1]),
        below: argAtoms(args[0]),
        skipBoundary: false,
        style,
        boxType: name === '\\stackrel' ? 'rel' : 'bin',
        serialize: (atom: OverunderAtom, options: ToLatexOptions) =>
          latexCommand(
            atom.command,
            atom.aboveToLatex(options),
            atom.bodyToLatex(options)
          ),
      }),
  }
);

defineFunction('smash', '[:string]{:auto}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: [null | string, null | Argument]
  ): Atom => {
    if (!args[0]) {
      return new PhantomAtom(name, argAtoms(args[1]), context, {
        smashHeight: true,
        smashDepth: true,
        style,
      });
    }

    return new PhantomAtom(name, argAtoms(args[1]), context, {
      smashHeight: args[0].includes('t'),
      smashDepth: args[0].includes('b'),
      style,
    });
  },
});

defineFunction(['vphantom'], '{:auto*}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new PhantomAtom(name, argAtoms(args[1]), context, {
      isInvisible: true,
      smashWidth: true,
      style,
    }),
});

defineFunction(['hphantom'], '{:auto*}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new PhantomAtom(name, argAtoms(args[1]), context, {
      isInvisible: true,
      smashHeight: true,
      smashDepth: true,
      style,
    }),
});

defineFunction(['phantom'], '{:auto*}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new PhantomAtom(name, argAtoms(args[1]), context, {
      isInvisible: true,
      style,
    }),
});

defineFunction('not', '{:math}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: [null | Argument]
  ): Atom => {
    const arg = argAtoms(args[0]);
    if (args.length < 1 || args[0] === null || arg.length === 0) {
      return new Atom('mrel', context, {
        command: name,
        style,
        value: '\ue020',
        serialize: (_atom, _options) =>
          args[0] !== null && arg.length === 0 ? `\\not{}` : `\\not`,
      });
    }
    const isGroup = typeof args[0] === 'object' && 'group' in args[0];
    const result = new GroupAtom(
      [
        new OverlapAtom(name, '\ue020', context, {
          align: 'right',
          style,
          boxType: isGroup ? 'inner' : atomsBoxType(arg),
        }),
        ...arg,
      ],
      context,
      {
        boxType: isGroup ? 'inner' : atomsBoxType(arg),
        captureSelection: true,
        command: '\\not',
        serialize: (_atom, options) =>
          isGroup
            ? `\\not{${Atom.serialize(arg, options)}}`
            : `\\not${Atom.serialize(arg, options)}`,
      }
    );
    return result;
  },
});

defineFunction(['ne', 'neq'], '', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle
  ): Atom =>
    new GroupAtom(
      [
        new OverlapAtom(name, '\ue020', context, {
          align: 'right',
          style,
          boxType: 'rel',
        }),
        new Atom('mrel', context, { style, value: '=' }),
      ],
      context,
      {
        boxType: 'rel',
        captureSelection: true,
        serialize: () => name,
        command: name,
      }
    ),
});

defineFunction('rlap', '{:auto}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new OverlapAtom(name, argAtoms(args[0]), context, {
      align: 'right',
      style,
    }),
});

defineFunction('llap', '{:auto}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom => new OverlapAtom(name, argAtoms(args[0]), context, { style }),
});

defineFunction('mathllap', '{:auto}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom => new OverlapAtom(name, argAtoms(args[0]), context, { style }),
});

defineFunction('mathrlap', '{:auto}', {
  createAtom: (
    name: string,
    context: GlobalContext,
    style: PrivateStyle,
    args: (null | Argument)[]
  ): Atom =>
    new OverlapAtom(name, argAtoms(args[0]), context, {
      align: 'right',
      style,
    }),
});
