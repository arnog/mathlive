import {
  Atom,
  BBoxParameter,
  ToLatexOptions,
  serializeAtoms,
} from '../core/atom-class';

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
  LatexValue,
  FontFamily,
} from '../public/core-types';
import type { PrivateStyle } from '../core/types';
import { joinLatex, latexCommand } from '../core/tokenizer';
import { atomsBoxType } from '../core/box';
import { serializeLatexValue } from '../core/registers-utils';
import { Context } from '../core/context';

defineFunction('mathtip', '{:math}{:math}', {
  createAtom: (name, args: (null | Argument)[], style): Atom =>
    new TooltipAtom(argAtoms(args[0]), argAtoms(args[1]), {
      command: name,
      content: 'math',
      style,
    }),
});

defineFunction('texttip', '{:math}{:text}', {
  createAtom: (name, args: (null | Argument)[], style): Atom =>
    new TooltipAtom(argAtoms(args[0]), argAtoms(args[1]), {
      command: name,
      content: 'text',
      style,
    }),
});

defineFunction('error', '{:math}', {
  createAtom: (_name, args: (null | Argument)[], style): Atom =>
    new Atom({ args, body: argAtoms(args[0]), style }),
  serialize: (atom, options) => `\\error{${atom.bodyToLatex(options)}}`,
  render: (atom, context) => atom.createBox(context, { classes: 'ML__error' }),
});

defineFunction('ensuremath', '{:math}', {
  createAtom: (command, args: [null | Argument], style) =>
    new Atom({
      type: 'minner',
      command,
      body: argAtoms(args[0]),
      mode: 'math',
      style,
    }),
  serialize: (atom, options) => `${atom.command}{${atom.bodyToLatex(options)}}`,
});

defineFunction('color', '{:value}', {
  applyStyle: (_name, args: [LatexValue | null], context) => ({
    verbatimColor: serializeLatexValue(args[0]) ?? undefined,
    color: context.toColor(args[0] ?? { string: 'red' })!,
  }),
});

// From the xcolor package.
// Unlike what its name might suggest, this command does not set the mode to
// text. That is, it can equally be applied to math and text mode.
defineFunction('textcolor', '{:value}{content:auto*}', {
  applyStyle: (_name, args: [LatexValue | null], context) => ({
    verbatimColor: serializeLatexValue(args[0]) ?? undefined,
    color: context.toColor(args[0] ?? { string: 'red' })!,
  }),
});

// Can be preceded by e.g. '\fboxsep=4pt' (also \fboxrule)
// Note:
// - \boxed: sets content in displaystyle mode (@todo: should change type of argument)
//      equivalent to \fbox{$$<content>$$}
// - \fbox: sets content in 'auto' mode (frequency 777)
// - \framebox[<width>][<alignment>]{<content>} (<alignment> := 'c'|'t'|'b' (center, top, bottom) (frequency 28)
// @todo
defineFunction('boxed', '{content:math}', {
  createAtom: (name, args: (null | Argument)[], style): Atom =>
    new BoxAtom(name, argAtoms(args[0]), {
      framecolor: { string: 'black' },
      style,
    }),
});

// Technically, using a BoxAtom is more correct (there is a small margin around it)
// However, just changing the background color makes editing easier
defineFunction('colorbox', '{:value}{:auto*}', {
  applyMode: 'text',
  applyStyle: (_name, args: [LatexValue | null], context) => {
    return {
      verbatimBackgroundColor: serializeLatexValue(args[0]) ?? undefined,
      backgroundColor: context.toBackgroundColor(
        args[0] ?? { string: 'yellow' }
      )!,
    };
  },
});

defineFunction(
  'fcolorbox',
  '{frame-color:value}{background-color:value}{content:auto}',
  {
    applyMode: 'text',
    createAtom: (
      name,
      args: [null | LatexValue, null | LatexValue, null | Argument],
      style
    ): Atom => {
      return new BoxAtom(name, argAtoms(args[2]), {
        framecolor: args[0] ?? { string: 'blue' },
        backgroundcolor: args[1] ?? { string: 'yellow' },
        style,
      });
    },
    serialize: (atom: BoxAtom, options: ToLatexOptions) =>
      latexCommand(
        atom.command,
        serializeLatexValue(atom.framecolor) ?? '',
        serializeLatexValue(atom.backgroundcolor) ?? '',
        atom.bodyToLatex(options)
      ),
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
    name,
    args: [BBoxParameter | null, null | Argument],
    style
  ): Atom => {
    const arg = args[0];
    if (!arg) return new BoxAtom(name, argAtoms(args[1]), { style });
    return new BoxAtom(name, argAtoms(args[1]), {
      padding: arg.padding,
      border: arg.border,
      backgroundcolor: arg.backgroundcolor ?? undefined,
      style,
    });
  },
  serialize: (atom: BoxAtom, options: ToLatexOptions) => {
    let result = atom.command;
    if (
      Number.isFinite(atom.padding) ||
      atom.border !== undefined ||
      atom.backgroundcolor !== undefined
    ) {
      const bboxParameters: string[] = [];
      if (atom.padding)
        bboxParameters.push(serializeLatexValue(atom.padding) ?? '');

      if (atom.border) bboxParameters.push(`border: ${atom.border}`);

      if (atom.backgroundcolor)
        bboxParameters.push(serializeLatexValue(atom.backgroundcolor) ?? '');

      result += `[${bboxParameters.join(',')}]`;
    }

    return latexCommand(result, atom.bodyToLatex(options));
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
    createAtom: (command, args: (null | Argument)[], style): Atom =>
      new Atom({ command, body: argAtoms(args[0]), style }),
    render: (atom, context) => {
      const ctx = new Context(
        { parent: context, mathstyle: atom.command.slice(1) as MathstyleName },
        atom.style
      );
      const box = Atom.createBox(ctx, atom.body, {
        type: 'lift',
        mode: 'math',
        style: atom.style,
      })!;

      if (atom.caret) box.caret = atom.caret;
      return atom.bind(context, box);
    },
    serialize: (atom, options) =>
      `{${joinLatex([atom.command, atom.bodyToLatex(options)])}}`,
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
  applyStyle: (_name, args: [null | FontSeries]): PrivateStyle => {
    return { fontSeries: args[0] ?? 'auto' };
  },
});
// SHAPE: italic, small caps
defineFunction('fontshape', '{:string}', {
  ifMode: 'text',
  applyStyle: (_name, args: [null | FontShape]): PrivateStyle => {
    return { fontShape: args[0] ?? 'auto' };
  },
});

// FONT FAMILY: roman, sans-serif, monospace
defineFunction('fontfamily', '{:string}', {
  ifMode: 'text',
  applyStyle: (_name, args: [null | FontFamily]): PrivateStyle => {
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
defineFunction('bf', '{:rest}', {
  applyStyle: () => ({ fontSeries: 'b', fontShape: 'n', fontFamily: 'roman' }),
});

// Note: These function work a little bit differently than LaTex
// In LaTeX, \bm{x\mathrm{y}} yield a bold x and an upright y.
// This is not necesarily intentional, but a side effect of the (current)
// implementation of \bm
defineFunction(['boldsymbol', 'bm'], '{:math}', {
  applyMode: 'math',
  createAtom: (command, args: (null | Argument)[], style): Atom =>
    new Atom({ command, body: argAtoms(args[0]), style }),
  serialize: (atom, options) => `${atom.command}{${atom.bodyToLatex(options)}}`,
  render: (atom: Atom, context: Context) =>
    atom.createBox(context, { classes: 'ML__boldsymbol' }),
});

// Note: switches to math mode
defineFunction('bold', '{:math*}', {
  applyMode: 'math',
  applyStyle: () => ({ variantStyle: 'bold' }),
});

defineFunction('bfseries', '{:rest}', {
  applyMode: 'text',
  applyStyle: () => ({ fontSeries: 'b' }),
});
defineFunction('mdseries', '{:rest}', {
  applyMode: 'text',
  applyStyle: () => ({ fontSeries: 'm' }),
});
defineFunction('upshape', '{:rest}', {
  applyMode: 'text',
  applyStyle: () => ({ fontShape: 'n' }),
});
defineFunction('slshape', '{:rest}', {
  applyMode: 'text',
  applyStyle: () => ({ fontShape: 'sl' }),
});
// Small caps
defineFunction('scshape', '{:rest}', {
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

defineFunction('it', '{:rest}', {
  applyStyle: () => ({
    fontSeries: 'm',
    fontShape: 'it',
    fontFamily: 'roman',
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
  createAtom: (command, args: (null | Argument)[], style): Atom =>
    new Atom({
      type: 'mord',
      command,
      style,
      body: argAtoms(args[0]),
      mode: 'math',
    }),
  serialize: (atom: GroupAtom, options: ToLatexOptions) =>
    latexCommand(
      '\\mbox',
      atom.bodyToLatex({ ...options, skipModeCommand: true })
    ),
});

defineFunction('text', '{:text}', {
  ifMode: 'math',
  applyMode: 'text',
});

/* Assign a class to the element.`class` is a MathJax extension, `htmlClass`
   is a KaTeX extension. */
defineFunction(['class', 'htmlClass'], '{name:string}{content:auto}', {
  createAtom: (command, args: [null | string, null | Argument], style): Atom =>
    new Atom({
      command,
      args,
      body: argAtoms(args[1]),
      style,
    }),
  serialize: (atom, options) => {
    if (!atom.args?.[0]) return atom.serialize(options);
    return `${atom.command}{${atom.args![0] as string}}{${atom.serialize(
      options
    )}}`;
  },
  render: (atom, context) =>
    atom.createBox(context, { classes: (atom.args![0] as string) ?? '' }),
});

/* Assign an ID to the element. `cssId` is a MathJax extension,
   `htmlId` is a KaTeX extension. */
defineFunction(['cssId', 'htmlId'], '{id:string}{content:auto}', {
  createAtom: (command, args: [null | string, null | Argument], style): Atom =>
    new Atom({
      command,
      args,
      body: argAtoms(args[1]),
      style,
    }),
  serialize: (atom, options) => {
    if (!atom.args?.[0]) return atom.serialize(options);
    return `${atom.command}{${atom.args![0] as string}}{${atom.serialize(
      options
    )}}`;
  },
  render: (atom, context) => {
    const box = atom.createBox(context);
    box.cssId = (atom.args![0] as string) ?? '';
    return box;
  },
});

/* Assign an attribute to the element (MathJAX extension) */
defineFunction('htmlData', '{data:string}{content:auto}', {
  createAtom: (command, args: [null | string, null | Argument], style): Atom =>
    new Atom({
      command,
      body: argAtoms(args[1]),
      args,
      style,
    }),
  serialize: (atom, options) => {
    if (!atom.args?.[0]) return atom.serialize(options);
    return `\\htmlData{${atom.args![0] as string}}{${atom.serialize(options)}}`;
  },
  render: (atom, context) => {
    const box = atom.createBox(context);
    box.htmlData = (atom.args![0] as string) ?? '';
    return box;
  },
});

/* Assign CSS styles to the element. `style` is a MathJax extension,
  `htmlStyle` is the KaTeX extension. */
defineFunction(['style', 'htmlStyle'], '{data:string}{content:auto}', {
  createAtom: (command, args: [null | string, null | Argument], style): Atom =>
    new Atom({
      command,
      args,
      body: argAtoms(args[1]),
      style,
    }),
  serialize: (atom, options) => {
    if (!atom.args?.[0]) return atom.serialize(options);
    return `${atom.command}{${atom.args![0] as string}}{${atom.serialize(
      options
    )}}`;
  },
  render: (atom, context) => {
    const box = atom.createBox(context);
    box.htmlStyle = (atom.args![0] as string) ?? '';
    return box;
  },
});

/* Note: in TeX, \em is restricted to text mode. We extend it to math
 * This is the 'switch' variant of \emph, i.e:
 * `\emph{important text}`
 * `{\em important text}`
 */
defineFunction('em', '{:rest}', {
  createAtom: (command: string, args: (null | Argument)[], style): Atom =>
    new Atom({ command, body: argAtoms(args[0]), args, style }),
  serialize: (atom, options) => `{\\em ${atom.bodyToLatex(options)}}`,
  render: (atom, context) =>
    atom.createBox(context, { classes: 'ML__emph', boxType: 'lift' }),
});

/* Note: in TeX, \emph is restricted to text mode. We extend it to math */
defineFunction('emph', '{:auto}', {
  createAtom: (command, args: (null | Argument)[], style): Atom =>
    new Atom({ command, body: argAtoms(args[0]), args, style }),
  serialize: (atom, options) => `\\emph{${atom.bodyToLatex(options)}}`,
  render: (atom, context) =>
    atom.createBox(context, { classes: 'ML__emph', boxType: 'lift' }),
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
    createAtom: (name, args: (null | string)[], style): Atom =>
      new SizedDelimAtom(name, args[0] ?? '.', {
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
  '{width:value}',
  {
    createAtom: (name, args: [null | Dimension], style) =>
      new SpacingAtom(name, style, args[0] ?? { dimension: 0 }),
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
defineFunction(['mkern', 'kern', 'mskip', 'hskip', 'mspace'], '{width:value}', {
  createAtom: (name, args: (null | Glue)[], style) =>
    new SpacingAtom(name, style, args[0] ?? { dimension: 0 }),
});

defineFunction('mathop', '{:auto}', {
  createAtom: (name, args: (null | Argument)[], style): Atom =>
    new OperatorAtom(name, argAtoms(args[0]), {
      limits: 'over-under',
      isFunction: true,
      hasArgument: true,
      style,
    }),
});

defineFunction('mathchoice', '{:math}{:math}{:math}{:math}', {
  createAtom: (_name, args: (null | Argument)[]): Atom =>
    new ChoiceAtom(args.map((x) => argAtoms(x))),
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
    createAtom: (name, args: (null | Argument)[], style): Atom =>
      new OperatorAtom(name, argAtoms(args[0]), {
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
        hasArgument: true,
        style,
      }),
  }
);

// @todo see http://mirrors.ibiblio.org/CTAN/macros/latex/required/amsmath/amsopn.pdf
// for list of additional operators

defineFunction(['operatorname', 'operatorname*'], '{operator:math}', {
  createAtom: (name, args: (null | Argument)[], style): Atom => {
    const result = new OperatorAtom(name, argAtoms(args[0]), {
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

/** This is a MathJax extension */
defineFunction('unicode', '{charcode:value}', {
  createAtom: (command, args: (null | LatexValue)[], style) =>
    new Atom({ command, args, style }),
  serialize: (atom) =>
    `\\unicode${serializeLatexValue(
      (atom.args![0] as LatexValue) ?? { number: 0x2753, base: 'hexadecimal' }
    )}`,
  render: (atom, context) => {
    let value = context.evaluate(atom.args![0] as LatexValue);
    if (!value || !('number' in value))
      value = { number: 0x2753, base: 'hexadecimal' }; // BLACK QUESTION MARK;
    atom.value = String.fromCodePoint(value.number);
    return atom.createBox(context);
  },
});

// A box of the width and height
defineFunction('rule', '[raise:value]{width:value}{thickness:value}', {
  createAtom: (name, args: (null | LatexValue)[], style) =>
    new RuleAtom(name, {
      shift: args[0] ?? { dimension: 0 },
      width: args[1] ?? { dimension: 1, unit: 'em' },
      height: args[2] ?? { dimension: 1, unit: 'em' },
      style,
    }),
});

// An overline
defineFunction('overline', '{:auto}', {
  createAtom: (name, args: (null | Argument)[], style): Atom =>
    new LineAtom(name, argAtoms(args[0]), {
      position: 'overline',
      style,
    }),
});

defineFunction('underline', '{:auto}', {
  createAtom: (name, args: (null | Argument)[], style): Atom =>
    new LineAtom(name, argAtoms(args[0]), {
      position: 'underline',
      style,
    }),
});

defineFunction('overset', '{above:auto}{base:auto}', {
  createAtom: (name, args: (null | Argument)[], style): Atom =>
    new OverunderAtom(name, {
      above: argAtoms(args[0]),
      body: argAtoms(args[1]),
      skipBoundary: false,
      style,
      boxType: atomsBoxType(argAtoms(args[1])),
    }),
  serialize: (atom: OverunderAtom, options: ToLatexOptions) =>
    latexCommand(
      atom.command,
      atom.aboveToLatex(options),
      atom.bodyToLatex(options)
    ),
});

defineFunction('underset', '{below:auto}{base:auto}', {
  createAtom: (name, args: (null | Argument)[], style): Atom =>
    new OverunderAtom(name, {
      below: argAtoms(args[0]),
      body: argAtoms(args[1]),
      skipBoundary: false,
      style,
      boxType: atomsBoxType(argAtoms(args[1])),
    }),
  serialize: (atom: OverunderAtom, options: ToLatexOptions) =>
    latexCommand(
      atom.command,
      atom.belowToLatex(options),
      atom.bodyToLatex(options)
    ),
});

defineFunction('overunderset', '{above:auto}{below:auto}{base:auto}', {
  createAtom: (name, args: (null | Argument)[], style): Atom =>
    new OverunderAtom(name, {
      above: argAtoms(args[0]),
      below: argAtoms(args[1]),
      body: argAtoms(args[2]),
      skipBoundary: false,
      style,
      boxType: atomsBoxType(argAtoms(args[2])),
    }),
  serialize: (atom: OverunderAtom, options: ToLatexOptions) =>
    latexCommand(
      atom.command,
      atom.aboveToLatex(options),
      atom.bodyToLatex(options)
    ),
});

// `\stackrel` and `\stackbin` stack an item and provide an explicit
// atom type of the result. They are considered obsolete commands.
// `\underset` and `\overset` are recommended instead, which automatically
// calculate the resulting type.
defineFunction(
  ['stackrel', 'stackbin'],
  '[below:auto]{above:auto}{base:auto}',
  {
    createAtom: (name, args: (null | Argument)[], style): Atom =>
      new OverunderAtom(name, {
        body: argAtoms(args[2]),
        above: argAtoms(args[1]),
        below: argAtoms(args[0]),
        skipBoundary: false,
        style,
        boxType: name === '\\stackrel' ? 'rel' : 'bin',
      }),
    serialize: (atom: OverunderAtom, options: ToLatexOptions) =>
      latexCommand(
        atom.command,
        atom.aboveToLatex(options),
        atom.bodyToLatex(options)
      ),
  }
);

defineFunction('smash', '[:string]{:auto}', {
  createAtom: (name, args: [null | string, null | Argument], style) =>
    new PhantomAtom(name, argAtoms(args[1]), {
      smashHeight: args[0]?.includes('t') ?? true,
      smashDepth: args[0]?.includes('b') ?? true,
      style,
    }),
});

defineFunction(['vphantom'], '{:auto}', {
  createAtom: (name, args: (null | Argument)[], style): Atom =>
    new PhantomAtom(name, argAtoms(args[0]), {
      isInvisible: true,
      smashWidth: true,
      style,
    }),
});

defineFunction(['hphantom'], '{:auto}', {
  createAtom: (name, args: (null | Argument)[], style): Atom =>
    new PhantomAtom(name, argAtoms(args[0]), {
      isInvisible: true,
      smashHeight: true,
      smashDepth: true,
      style,
    }),
});

defineFunction(['phantom'], '{:auto}', {
  createAtom: (name, args: (null | Argument)[], style): Atom =>
    new PhantomAtom(name, argAtoms(args[0]), {
      isInvisible: true,
      style,
    }),
});

defineFunction('not', '{:math}', {
  createAtom: (command, args: (null | Argument)[], style): Atom => {
    const arg = argAtoms(args[0]);
    if (args.length < 1 || args[0] === null || arg.length === 0) {
      return new Atom({
        type: 'mrel',
        command,
        args,
        style,
        value: '\ue020',
      });
    }

    const result = new Atom({
      command,
      body: [new OverlapAtom('', '\ue020', { align: 'right', style }), ...arg],
      args,
      style,
      captureSelection: true,
    });
    return result;
  },
  serialize: (atom: Atom | GroupAtom, options) => {
    const arg = atom.args![0]!;
    const isGroup = typeof arg === 'object' && 'group' in arg;
    if (atom.value !== '\ue020') {
      return isGroup
        ? `\\not{${serializeAtoms(arg.group, options)}}`
        : `\\not${serializeAtoms(arg as Atom[], options)}`;
    }
    return isGroup ? `\\not{}` : `\\not`;
  },
  render: (atom, context) => {
    if (atom.value) return atom.createBox(context);

    const isGroup =
      typeof atom.args![0] === 'object' && 'group' in atom.args![0]!;
    const type = isGroup ? 'ord' : atomsBoxType(argAtoms(atom.args![0]));
    const box = Atom.createBox(context, atom.body, { type })!;
    if (atom.caret) box.caret = atom.caret;
    return atom.bind(context, box);
  },
});

defineFunction(['ne', 'neq'], '', {
  createAtom: (command, _args, style): Atom =>
    new Atom({
      type: 'mrel',
      body: [
        new OverlapAtom('', '\ue020', {
          align: 'right',
          style,
          boxType: 'rel',
        }),
        new Atom({ style, value: '=' }),
      ],
      captureSelection: true,
      command,
      style,
    }),
  serialize: (atom) => atom.command,
});

defineFunction('rlap', '{:auto}', {
  createAtom: (name, args: (null | Argument)[], style) =>
    new OverlapAtom(name, argAtoms(args[0]), {
      align: 'right',
      style,
    }),
});

defineFunction('llap', '{:auto}', {
  createAtom: (name, args: (null | Argument)[], style): Atom =>
    new OverlapAtom(name, argAtoms(args[0]), { style }),
});

defineFunction('mathllap', '{:auto}', {
  createAtom: (name, args: (null | Argument)[], style) =>
    new OverlapAtom(name, argAtoms(args[0]), { style }),
});

defineFunction('mathrlap', '{:auto}', {
  createAtom: (name, args: (null | Argument)[], style) =>
    new OverlapAtom(name, argAtoms(args[0]), {
      align: 'right',
      style,
    }),
});

defineFunction('raisebox', '{:value}{:text}', {
  createAtom: (name, args: [null | LatexValue, null | Argument], style) =>
    new BoxAtom(name, argAtoms(args[1]), {
      padding: { dimension: 0 },
      raise: args[0] ?? { dimension: 0 },
      style,
    }),
  serialize: (atom: BoxAtom, options) =>
    latexCommand(
      '\\raisebox',
      serializeLatexValue(atom.raise) ?? '0pt',
      atom.bodyToLatex(options)
    ),
});
