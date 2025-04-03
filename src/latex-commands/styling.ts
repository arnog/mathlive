import { Atom } from '../core/atom-class';

import { GroupAtom } from '../atoms/group';
import { BoxAtom } from '../atoms/box';
import { PhantomAtom } from '../atoms/phantom';
import { SizedDelimAtom } from '../atoms/delim';
import { SpacingAtom } from '../atoms/spacing';
import { OverunderAtom } from '../atoms/overunder';
import { OverlapAtom } from '../atoms/overlap';
import '../atoms/genfrac';

import { argAtoms, defineFunction } from './definitions-utils';
import { TooltipAtom } from '../atoms/tooltip';
import type {
  FontSize,
  FontSeries,
  FontShape,
  MathstyleName,
  LatexValue,
  FontFamily,
} from '../public/core-types';
import type {
  BBoxParameter,
  CreateAtomOptions,
  PrivateStyle,
  ToLatexOptions,
} from '../core/types';
import { joinLatex, latexCommand } from '../core/tokenizer';
import { Box, atomsBoxType } from '../core/box';
import {
  multiplyLatexValue,
  serializeLatexValue,
} from '../core/registers-utils';
import { Context } from '../core/context';
import { T, Tc, S, Sc, SS, SSc } from '../core/mathstyle';
import { VBox } from '../core/v-box';
import type { Argument } from './types';
import { removeItalic } from '../editor-model/styling';

defineFunction('mathtip', '{:auto}{:math}', {
  createAtom: (
    options: CreateAtomOptions<[Argument | null, Argument | null]>
  ) =>
    new TooltipAtom({
      ...options,
      body: argAtoms(options.args![0]),
      tooltip: argAtoms(options.args![1]),
      content: 'math',
    }),
  serialize: (atom: TooltipAtom, options) =>
    options.skipStyles
      ? atom.bodyToLatex(options)
      : `\\mathtip{${atom.bodyToLatex(options)}}{${Atom.serialize(
          [atom.tooltip],
          {
            ...options,
            defaultMode: 'math',
          }
        )}}`,
});

defineFunction('texttip', '{:auto}{:text}', {
  createAtom: (
    options: CreateAtomOptions<[Argument | null, Argument | null]>
  ): Atom =>
    new TooltipAtom({
      ...options,
      body: argAtoms(options.args![0]),
      tooltip: argAtoms(options.args![1]),
      content: 'text',
    }),
  serialize: (atom: TooltipAtom, options) =>
    options.skipStyles
      ? atom.bodyToLatex(options)
      : `\\texttip{${atom.bodyToLatex(options)}}{${Atom.serialize(
          [atom.tooltip],
          {
            ...options,
            defaultMode: 'text',
          }
        )}}`,
});

defineFunction('error', '{:math}', {
  createAtom: (options: CreateAtomOptions<[Argument | null]>): Atom =>
    new Atom({ ...options, body: argAtoms(options.args![0]) }),
  serialize: (atom, options) => `\\error{${atom.bodyToLatex(options)}}`,
  render: (atom, context) => atom.createBox(context, { classes: 'ML__error' }),
});

defineFunction('ensuremath', '{:math}', {
  createAtom: (options) =>
    new Atom({ ...options, body: argAtoms(options.args![0]) }),
  serialize: (atom, options) =>
    `${atom.command}{${atom.bodyToLatex({ ...options, defaultMode: 'math' })}}`,
});

defineFunction('color', '{:value}', {
  applyStyle: (style, _name, args: [LatexValue | null], context) => ({
    ...style,
    verbatimColor: serializeLatexValue(args[0]) ?? undefined,
    color: context.toColor(args[0] ?? { string: 'red' })!,
  }),
});

// From the xcolor package.
// Unlike what its name might suggest, this command does not set the mode to
// text. That is, it can equally be applied to math and text mode.
defineFunction('textcolor', '{:value}{content:auto*}', {
  applyStyle: (style, _name, args: [LatexValue | null], context) => ({
    ...style,
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
  createAtom: (options) =>
    new BoxAtom({
      ...options,
      body: argAtoms(options.args![0]),
      framecolor: { string: 'black' },
    }),
});

// Technically, using a BoxAtom is more correct (there is a small margin
// around it). However, just changing the background color makes editing easier
defineFunction('colorbox', '{:value}{:text*}', {
  applyStyle: (style, _name, args: [LatexValue | null], context) => {
    return {
      ...style,
      verbatimBackgroundColor: serializeLatexValue(args[0]) ?? undefined,
      backgroundColor: context.toBackgroundColor(
        args[0] ?? { string: 'yellow' }
      )!,
    };
  },
});

defineFunction(
  'fcolorbox',
  '{frame-color:value}{background-color:value}{content:text}',
  {
    applyMode: 'text',
    createAtom: (
      options: CreateAtomOptions<
        [LatexValue | null, LatexValue | null, Argument | null]
      >
    ): Atom => {
      return new BoxAtom({
        ...options,
        body: argAtoms(options.args![2]),
        framecolor: options.args![0] ?? { string: 'blue' },
        backgroundcolor: options.args![1] ?? { string: 'yellow' },
      });
    },
    serialize: (atom: BoxAtom, options) =>
      options.skipStyles
        ? atom.bodyToLatex({ ...options, defaultMode: 'text' })
        : latexCommand(
            atom.command,
            serializeLatexValue(atom.framecolor) ?? '',
            serializeLatexValue(atom.backgroundcolor) ?? '',
            atom.bodyToLatex({ ...options, defaultMode: 'text' })
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
    options: CreateAtomOptions<[BBoxParameter | null, Argument | null]>
  ) => {
    const arg = options.args![0];
    const body = argAtoms(options.args![1]);
    if (!arg) return new BoxAtom({ ...options, body });
    return new BoxAtom({
      ...options,
      body,
      padding: arg.padding,
      border: arg.border,
      backgroundcolor: arg.backgroundcolor ?? undefined,
    });
  },
  serialize: (atom: BoxAtom, options: ToLatexOptions) => {
    if (options.skipStyles) return atom.bodyToLatex(options);
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
    createAtom: (options): Atom =>
      new Atom({ ...options, body: argAtoms(options.args![0]) }),
    render: (atom, context) => {
      const ctx = new Context(
        { parent: context, mathstyle: atom.command.slice(1) as MathstyleName },
        atom.style
      );
      const box = Atom.createBox(ctx, atom.body, { type: 'lift' })!;

      if (atom.caret) box.caret = atom.caret;
      return atom.bind(context, box);
    },
    serialize: (atom, options) =>
      options.skipStyles
        ? atom.bodyToLatex(options)
        : `{${joinLatex([atom.command, atom.bodyToLatex(options)])}}`,
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
    applyStyle: (style, name): PrivateStyle => {
      return {
        ...style,
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
  applyStyle: (style, _name, args: [null | FontSeries]): PrivateStyle => {
    return { ...style, fontSeries: args[0] ?? 'auto' };
  },
});
// SHAPE: italic, small caps
defineFunction('fontshape', '{:string}', {
  ifMode: 'text',
  applyStyle: (style, _name, args: [null | FontShape]): PrivateStyle => {
    return { ...style, fontShape: args[0] ?? 'auto' };
  },
});

// FONT FAMILY: roman, sans-serif, monospace
defineFunction('fontfamily', '{:string}', {
  ifMode: 'text',
  applyStyle: (style, _name, args: [null | FontFamily]): PrivateStyle => {
    return { ...style, fontFamily: args[0] ?? 'roman' };
  },
});

// In LaTeX, the \fontseries, \fontshape, \fontfamily, \fontsize commands
// do not take effect until \selectfont is encoded. In our implementation,
// they take effect immediately, and \selectfont is a no-op
defineFunction('selectfont', '', {
  ifMode: 'text',
  applyStyle: (style) => style,
});

// \bf works in any mode
// As per the LaTeX 2.09 semantics, it overrides shape, family
defineFunction('bf', '{:rest*}', {
  applyStyle: (style) => ({
    ...style,
    fontSeries: 'b',
    fontShape: 'n',
    fontFamily: 'roman',
  }),
});

// In LaTeX, \boldsymbol does not preserve proper kerning between characters
defineFunction(['boldsymbol', 'bm', 'bold'], '{:math*}', {
  applyMode: 'math',
  applyStyle: (style) => ({ ...style, variantStyle: 'bold' }),
});

defineFunction('bfseries', '{:rest*}', {
  applyMode: 'text',
  applyStyle: (style) => ({ ...style, fontSeries: 'b' }),
});
defineFunction('mdseries', '{:rest*}', {
  applyMode: 'text',
  applyStyle: (style) => ({ ...style, fontSeries: 'm' }),
});
defineFunction('upshape', '{:rest*}', {
  applyMode: 'text',
  applyStyle: (style) => ({ ...style, fontShape: 'n' }),
});
defineFunction('slshape', '{:rest*}', {
  applyMode: 'text',
  applyStyle: (style) => ({ ...style, fontShape: 'sl' }),
});
// Small caps
defineFunction('scshape', '{:rest*}', {
  applyMode: 'text',
  applyStyle: (style) => ({ ...style, fontShape: 'sc' }),
});

defineFunction('textbf', '{:text*}', {
  applyMode: 'text',
  applyStyle: (style) => ({ ...style, fontSeries: 'b' }),
});
defineFunction('textmd', '{:text*}', {
  applyMode: 'text',
  applyStyle: (style) => ({ ...style, fontSeries: 'm' }),
});

defineFunction('textup', '{:text*}', {
  applyMode: 'text',
  applyStyle: (style) => ({ ...style, fontShape: 'n' }),
});

// @todo: family could be 'none' or 'default'
// "normal" font of the body text, not necessarily roman
defineFunction('textnormal', '{:text*}', {
  applyMode: 'text',
  applyStyle: (style) => ({ ...style, fontShape: 'n', fontSeries: 'm' }),
});

defineFunction('textsl', '{:text*}', {
  applyMode: 'text',
  applyStyle: (style) => ({ ...style, fontShape: 'sl' }),
});

defineFunction('textit', '{:text*}', {
  applyMode: 'text',
  applyStyle: (style) => ({ ...style, fontShape: 'it' }),
});

defineFunction('textsc', '{:text*}', {
  applyMode: 'text',
  applyStyle: (style) => ({ ...style, fontShape: 'sc' }),
});
defineFunction('textrm', '{:text*}', {
  applyMode: 'text',
  applyStyle: (style) => ({ ...style, fontFamily: 'roman' }),
});

defineFunction('textsf', '{:text*}', {
  applyMode: 'text',
  applyStyle: (style) => ({ ...style, fontFamily: 'sans-serif' }),
});

defineFunction('texttt', '{:text*}', {
  applyMode: 'text',
  applyStyle: (style) => ({ ...style, fontFamily: 'monospace' }),
});

// Note: \mathbf is a no-op in text mode
defineFunction('mathbf', '{:math*}', {
  applyMode: 'math',
  applyStyle: (style) => ({
    ...style,
    variant: 'normal',
    variantStyle: 'bold',
  }),
});

// `\mathnormal` includes italic correction, `\mathit` doesn't
defineFunction('mathit', '{:math*}', {
  applyMode: 'math',
  applyStyle: (style) => ({
    ...style,
    variant: 'main',
    variantStyle: 'italic',
  }),
});

// `\mathnormal` includes italic correction, `\mathit` doesn't
defineFunction('mathnormal', '{:math*}', {
  applyMode: 'math',
  applyStyle: (style) => ({
    ...style,
    variant: 'normal',
    variantStyle: 'italic',
  }),
});

// From the ISOMath package
defineFunction('mathbfit', '{:math*}', {
  applyMode: 'math',
  applyStyle: (style) => ({
    ...style,
    variant: 'main',
    variantStyle: 'bolditalic',
  }),
});

defineFunction('mathrm', '{:math*}', {
  applyMode: 'math',
  applyStyle: (style) => ({ ...style, variant: 'normal', variantStyle: 'up' }),
});

//
// Alternate implementation: instead of a style, we create a new atom
//
// defineFunction('mathrm', '{:math}', {
//   applyMode: 'math',
//   createAtom: (options) =>
//     new Atom({
//       ...options,
//       type: 'mord',
//       skipBoundary: true,
//       body: argAtoms(options.args![0]).map((x) => {
//         x.applyStyle({ variant: 'normal', variantStyle: 'up' });
//         return x;
//       }),
//       mode: 'math',
//     }),
//   serialize: (atom: GroupAtom, options) => atom.bodyToLatex(options),
// });

defineFunction('mathsf', '{:math*}', {
  applyMode: 'math',
  applyStyle: (style) => ({
    ...style,
    variant: 'sans-serif',
    variantStyle: 'up',
  }),
});
defineFunction('mathtt', '{:math*}', {
  applyMode: 'math',
  applyStyle: (style) => ({
    ...style,
    variant: 'monospace',
    variantStyle: 'up',
  }),
});

defineFunction('it', '{:rest*}', {
  applyStyle: (style) => ({
    ...style,
    fontSeries: 'm',
    fontShape: 'it',
    fontFamily: 'roman',
    variantStyle: 'italic', // For math mode
  }),
});

// In LaTeX, \rmfamily, \sffamily and \ttfamily are no-op in math mode.
defineFunction('rmfamily', '{:rest*}', {
  applyStyle: (style) => ({ ...style, fontFamily: 'roman' }),
});

defineFunction('sffamily', '{:rest*}', {
  applyStyle: (style) => ({ ...style, fontFamily: 'sans-serif' }),
});

defineFunction('ttfamily', '{:rest*}', {
  applyStyle: (style) => ({ ...style, fontFamily: 'monospace' }),
});

// In LaTeX, \Bbb and \mathbb are no-op in text mode.
// They also map lowercase characters to different glyphs.
// Note that \Bbb has been deprecated for over 20 years (as well as \rm, \it, \bf)
defineFunction(['Bbb', 'mathbb'], '{:math*}', {
  applyStyle: (style) => ({
    ...style,
    variant: 'double-struck',
    variantStyle: removeItalic(style.variantStyle),
  }),
});

defineFunction(['frak', 'mathfrak'], '{:math*}', {
  applyStyle: (style) => ({
    ...style,
    variant: 'fraktur',
    variantStyle: removeItalic(style.variantStyle),
  }),
});

defineFunction('mathcal', '{:math*}', {
  // Note that in LaTeX, \mathcal forces the 'up' variant. Use \bm to get bold
  applyStyle: (style) => ({
    ...style,
    variant: 'calligraphic',
    variantStyle: removeItalic(style.variantStyle),
  }),
});

defineFunction('mathscr', '{:math*}', {
  applyStyle: (style) => ({
    ...style,
    variant: 'script',
    variantStyle: removeItalic(style.variantStyle),
  }),
});

/*
 * Rough synonym for \text{}
 * An \mbox within math mode does not use the current math font; rather it uses
 * the typeface of the surrounding running text.
 */
defineFunction('mbox', '{:text}', {
  ifMode: 'math',
  createAtom: (options) =>
    new Atom({
      ...options,
      type: 'mord',
      body: argAtoms(options.args![0]),
      mode: 'math',
    }),
  serialize: (atom: GroupAtom, options) =>
    latexCommand(
      '\\mbox',
      atom.bodyToLatex({ ...options, defaultMode: 'text' })
    ),
});

defineFunction('text', '{:text}', {
  ifMode: 'math',
  applyMode: 'text',
});

/* Assign a class to the element.`class` is a MathJax extension, `htmlClass`
   is a KaTeX extension. */
defineFunction(['class', 'htmlClass'], '{name:string}{content:auto}', {
  createAtom: (
    options: CreateAtomOptions<[string | null, Argument | null]>
  ): Atom => new Atom({ ...options, body: argAtoms(options.args![1]) }),
  serialize: (atom, options) => {
    if (!atom.args![0] || options.skipStyles) return atom.bodyToLatex(options);
    return `${atom.command}{${atom.args![0] as string}}{${atom.bodyToLatex(
      options
    )}}`;
  },
  render: (atom, context) =>
    atom.createBox(context, { classes: (atom.args![0] as string) ?? '' }),
});

/* Assign an ID to the element. `cssId` is a MathJax extension,
   `htmlId` is a KaTeX extension. */
defineFunction(['cssId', 'htmlId'], '{id:string}{content:auto}', {
  createAtom: (
    options: CreateAtomOptions<[string | null, Argument | null]>
  ): Atom => new Atom({ ...options, body: argAtoms(options.args![1]) }),
  serialize: (atom, options) => {
    if (!atom.args?.[0] || options.skipStyles) return atom.bodyToLatex(options);
    return `${atom.command}{${atom.args![0] as string}}{${atom.bodyToLatex(
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
  createAtom: (options: CreateAtomOptions<[string | null, Argument | null]>) =>
    new Atom({ ...options, body: argAtoms(options.args![1]) }),
  serialize: (atom, options) => {
    if (!atom.args?.[0] || options.skipStyles) return atom.bodyToLatex(options);
    return `\\htmlData{${atom.args![0] as string}}{${atom.bodyToLatex(
      options
    )}}`;
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
  createAtom: (options: CreateAtomOptions<[string | null, Argument | null]>) =>
    new Atom({ ...options, body: argAtoms(options.args![1]) }),
  serialize: (atom, options) => {
    if (!atom.args?.[0] || options.skipStyles) return atom.bodyToLatex(options);
    return `${atom.command}{${atom.args![0] as string}}{${atom.bodyToLatex(
      options
    )}}`;
  },
  render: (atom, context) => {
    const box = atom.createBox(context);
    box.htmlStyle = (atom.args![0] as string) ?? '';
    return box;
  },
});

defineFunction('href', '{url:string}{content:auto}', {
  createAtom: (options: CreateAtomOptions<[string | null, Argument | null]>) =>
    new Atom({ ...options, body: argAtoms(options.args![1]) }),
  render: (atom, context) => {
    const box = atom.createBox(context);
    const href = (atom.args![0] as string) ?? '';

    if (href) box.htmlData = `href=${href}`;

    return box;
  },
});

/* Note: in TeX, \em is restricted to text mode. We extend it to math
 * This is the 'switch' variant of \emph, i.e:
 * `\emph{important text}`
 * `{\em important text}`
 */
defineFunction('em', '{:rest}', {
  createAtom: (options) =>
    new Atom({ ...options, body: argAtoms(options.args![0]) }),
  serialize: (atom, options) =>
    options.skipStyles
      ? atom.bodyToLatex(options)
      : `{\\em ${atom.bodyToLatex(options)}}`,
  render: (atom, context) =>
    atom.createBox(context, { classes: 'ML__emph', boxType: 'lift' }),
});

/* Note: in TeX, \emph is restricted to text mode. We extend it to math */
defineFunction('emph', '{:auto}', {
  createAtom: (options) =>
    new Atom({ ...options, body: argAtoms(options.args![1]) }),
  serialize: (atom, options) =>
    options.skipStyles
      ? atom.bodyToLatex(options)
      : `\\emph{${atom.bodyToLatex(options)}}`,
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
    createAtom: (options: CreateAtomOptions<[string | null]>) =>
      new SizedDelimAtom({
        ...options,
        delim: options.args![0] ?? '.',
        size: DELIMITER_SIZES[options.command!].size,
        delimType: DELIMITER_SIZES[options.command!].mclass,
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
    createAtom: (options: CreateAtomOptions<[LatexValue | null]>) =>
      new SpacingAtom({
        ...options,
        width: options.args![0] ?? { dimension: 0 },
      }),
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
  createAtom: (options: CreateAtomOptions<[LatexValue | null]>) =>
    new SpacingAtom({
      ...options,
      width: options.args![0] ?? { dimension: 0 },
    }),
});

defineFunction('mathchoice', '{:math}{:math}{:math}{:math}', {
  // display, text, script and scriptscript
  createAtom: (options) => new Atom(options),
  render: (atom, context) => {
    let i = 0;
    const d = context.mathstyle.id;
    if (d === T || d === Tc) i = 1;
    if (d === S || d === Sc) i = 2;
    if (d === SS || d === SSc) i = 3;
    const body = argAtoms(atom.args![i] as Atom[]);
    return Atom.createBox(context, body);
  },
  serialize: (atom, options) =>
    `\\mathchoice{${Atom.serialize(
      atom.args![0] as Atom[],
      options
    )}}{${Atom.serialize(atom.args![1] as Atom[], options)}}{${Atom.serialize(
      atom.args![2] as Atom[],
      options
    )}}{${Atom.serialize(atom.args![3] as Atom[], options)}}`,
});

defineFunction('mathop', '{:auto}', {
  createAtom: (options) =>
    new Atom({
      ...options,
      type: 'mop',
      body: argAtoms(options.args![0]),
      limits: 'over-under',
      isFunction: true,
      captureSelection: true,
    }),
  render: (atom, context) => {
    let base = Atom.createBox(context, atom.body)!;
    if (atom.superscript || atom.subscript) {
      const limits = atom.subsupPlacement ?? 'auto';
      base =
        limits === 'over-under' || (limits === 'auto' && context.isDisplayStyle)
          ? atom.attachLimits(context, { base })
          : atom.attachSupsub(context, { base });
    }
    if (atom.caret) base.caret = atom.caret;
    return new Box(atom.bind(context, base), {
      type: 'op',
      isSelected: atom.isSelected,
      classes: 'ML__op-group',
    });
  },
  serialize: (atom, options) => {
    const result = [latexCommand(atom.command, atom.bodyToLatex(options))];
    if (atom.explicitSubsupPlacement) {
      if (atom.subsupPlacement === 'over-under') result.push('\\limits');
      if (atom.subsupPlacement === 'adjacent') result.push('\\nolimits');
      if (atom.subsupPlacement === 'auto') result.push('\\displaylimits');
    }
    result.push(atom.supsubToLatex(options));
    return joinLatex(result);
  },
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
    createAtom: (options) =>
      new Atom({
        ...options,
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
        )[options.command!],
        body: argAtoms(options.args![0]),
      }),
  }
);

// @todo see http://mirrors.ibiblio.org/CTAN/macros/latex/required/amsmath/amsopn.pdf
// for list of additional operators

defineFunction(['operatorname', 'operatorname*'], '{operator:math}', {
  createAtom: (options): Atom => {
    /*
      The \operatorname commands is defined with:

      \gdef\newmcodes@{\mathcode`\'39\mathcode`\*42\mathcode`\."613A%
      \ifnum\mathcode`\-=45 \else
          \mathchardef\std@minus\mathcode`\-\relax
      \fi
      \mathcode`\-45\mathcode`\/47\mathcode`\:"603A\relax}


      \mathcode assigns to a character its category (2=mbin), its font
      family (0=cmr), and its character code.

      It basically temporarily reassigns to ":.'-/*" the values/properties
      these characters have in text mode (but importantly, not to " " (space))

    */
    const body = argAtoms(options.args![0]).map((x) => {
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
      return x;
    });
    return new Atom({
      ...options,
      type: 'mop',
      body,
      isFunction: true,
      limits: options.command! === '\\operatorname' ? 'adjacent' : 'over-under',
    });
  },
  render: (atom, context) => {
    let base = Atom.createBox(context, atom.body)!;
    if (atom.superscript || atom.subscript) {
      const limits = atom.subsupPlacement ?? 'auto';
      base =
        limits === 'over-under' || (limits === 'auto' && context.isDisplayStyle)
          ? atom.attachLimits(context, { base })
          : atom.attachSupsub(context, { base });
    }
    if (atom.caret) base.caret = atom.caret;
    return new Box(atom.bind(context, base), {
      type: 'op',
      isSelected: atom.isSelected,
      classes: 'ML__op-group',
    });
  },
  serialize: (atom, options) => {
    const result = [latexCommand(atom.command, atom.bodyToLatex(options))];
    if (atom.explicitSubsupPlacement) {
      if (atom.subsupPlacement === 'over-under') result.push('\\limits');
      if (atom.subsupPlacement === 'adjacent') result.push('\\nolimits');
      if (atom.subsupPlacement === 'auto') result.push('\\displaylimits');
    }
    result.push(atom.supsubToLatex(options));
    return joinLatex(result);
  },
});

/** This is a MathJax extension */
defineFunction(['char', 'unicode'], '{charcode:value}', {
  createAtom: (options) =>
    new Atom({ ...options, type: options.mode === 'text' ? 'text' : 'mord' }),
  serialize: (atom) =>
    `${atom.command!}${serializeLatexValue(
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
  createAtom: (options) => new Atom(options),
  render: (
    atom: Atom<[LatexValue | null, LatexValue | null, LatexValue | null]>,
    context
  ) => {
    // The mathstyle sizing corrections (size delta) do not
    // apply to the dimensions of rules. Create a 'textstyle'
    // context to do the measurements without accounting for the mathstyle.
    const ctx = new Context(
      { parent: context, mathstyle: 'textstyle' },
      atom.style
    );

    const shift = ctx.toEm(atom.args[0] ?? { dimension: 0 });
    const width = ctx.toEm(atom.args[1] ?? { dimension: 10 });
    const height = ctx.toEm(atom.args[2] ?? { dimension: 10 });
    const result = new Box(null, {
      classes: 'ML__rule',
      type: 'ord',
    });
    result.width = width;
    result.height = height + shift;
    result.depth = -shift;
    result.setStyle('border-right-width', width, 'em');
    result.setStyle('border-top-width', height, 'em');
    result.setStyle('border-color', atom.style.color);
    result.setStyle('vertical-align', shift, 'em');
    if (atom.isSelected) result.setStyle('opacity', '50%');
    atom.bind(ctx, result);
    if (atom.caret) result.caret = atom.caret;
    return result.wrap(context);
  },
  serialize: (
    atom: Atom<[LatexValue | null, LatexValue | null, LatexValue | null]>
  ) =>
    `\\rule${
      atom.args[0] ? `[${serializeLatexValue(atom.args![0])}]` : ''
    }{${serializeLatexValue(atom.args![1])}}{${serializeLatexValue(
      atom.args![2]
    )}}`,
});

// An overline
defineFunction(['overline', 'underline'], '{:auto}', {
  createAtom: (options) =>
    new Atom({ ...options, body: argAtoms(options.args![0]) }),
  render: (atom, parentContext) => {
    const position = atom.command.substring(1);
    // TeXBook:443. Rule 9 and 10
    // > Math accents, and the operations \sqrt and \overline, change
    // > uncramped styles to their cramped counterparts; for example, D
    // > changes to D′, but D′ stays as it was. -- TeXBook p. 152
    const context = new Context(
      { parent: parentContext, mathstyle: 'cramp' },
      atom.style
    );
    const inner = Atom.createBox(context, atom.body);
    if (!inner) return null;
    const ruleThickness =
      context.metrics.defaultRuleThickness / context.scalingFactor;
    const line = new Box(null, { classes: position + '-line' });
    line.height = ruleThickness;
    line.maxFontSize = ruleThickness * 1.125 * context.scalingFactor;
    let stack: Box;
    if (position === 'overline') {
      stack = new VBox({
        shift: 0,
        children: [
          { box: inner },
          3 * ruleThickness,
          { box: line },
          ruleThickness,
        ],
      });
    } else {
      stack = new VBox({
        top: inner.height,
        children: [
          ruleThickness,
          { box: line },
          3 * ruleThickness,
          { box: inner },
        ],
      });
    }

    if (atom.caret) stack.caret = atom.caret;
    return new Box(stack, { classes: position, type: 'ignore' });
  },
});

defineFunction('overset', '{:auto}{base:auto}', {
  createAtom: (options): Atom => {
    const body = argAtoms(options.args![1]);
    return new OverunderAtom({
      ...options,
      above: argAtoms(options.args![0]),
      body,
      skipBoundary: false,
      boxType: atomsBoxType(body),
    });
  },
  serialize: (atom: OverunderAtom, options: ToLatexOptions) =>
    latexCommand(
      atom.command,
      atom.aboveToLatex(options),
      atom.bodyToLatex(options)
    ),
});

defineFunction('underset', '{:auto}{base:auto}', {
  createAtom: (options): Atom => {
    const body = argAtoms(options.args![1]);
    return new OverunderAtom({
      ...options,
      below: argAtoms(options.args![0]),
      body,
      skipBoundary: false,
      boxType: atomsBoxType(body),
    });
  },
  serialize: (atom: OverunderAtom, options: ToLatexOptions) =>
    latexCommand(
      atom.command,
      atom.belowToLatex(options),
      atom.bodyToLatex(options)
    ),
});

defineFunction('overunderset', '{above:auto}{below:auto}{base:auto}', {
  createAtom: (options): Atom => {
    const body = argAtoms(options.args![2]);
    return new OverunderAtom({
      ...options,
      above: argAtoms(options.args![0]),
      below: argAtoms(options.args![1]),
      body,
      skipBoundary: false,
      boxType: atomsBoxType(body),
    });
  },
  serialize: (atom: OverunderAtom, options: ToLatexOptions) =>
    latexCommand(
      atom.command,
      atom.belowToLatex(options),
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
    createAtom: (options): Atom =>
      new OverunderAtom({
        ...options,
        body: argAtoms(options.args![2]),
        above: argAtoms(options.args![1]),
        below: argAtoms(options.args![0]),
        skipBoundary: false,
        boxType: options.command === '\\stackrel' ? 'rel' : 'bin',
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
  createAtom: (options: CreateAtomOptions<[string | null, Argument | null]>) =>
    new PhantomAtom({
      ...options,
      body: argAtoms(options.args![1]),
      smashHeight: options.args![0]?.includes('t') ?? true,
      smashDepth: options.args![0]?.includes('b') ?? true,
    }),
});

defineFunction('vphantom', '{:auto}', {
  createAtom: (options): Atom =>
    new PhantomAtom({
      ...options,
      body: argAtoms(options.args![0]),
      isInvisible: true,
      smashWidth: true,
    }),
});

defineFunction('hphantom', '{:auto}', {
  createAtom: (options): Atom =>
    new PhantomAtom({
      ...options,
      body: argAtoms(options.args![0]),
      isInvisible: true,
      smashHeight: true,
      smashDepth: true,
    }),
});

defineFunction('phantom', '{:auto}', {
  createAtom: (options): Atom =>
    new PhantomAtom({
      ...options,
      body: argAtoms(options.args![0]),
      isInvisible: true,
    }),
});

defineFunction('mathstrut', '', {
  createAtom: (options): Atom =>
    new PhantomAtom({
      ...options,
      body: [new Atom({ value: '(' })],
      isInvisible: true,
    }),
});

defineFunction('not', '{:math}', {
  createAtom: (options) => {
    const body = argAtoms(options.args![0]);
    if (body.length === 0)
      return new Atom({ ...options, type: 'mrel', value: '\ue020' });

    return new Atom({
      ...options,
      body: [
        new OverlapAtom({ ...options, body: '\ue020', align: 'right' }),
        ...body,
      ],
      captureSelection: true,
    });
  },
  serialize: (atom: Atom | GroupAtom, options) => {
    const arg = atom.args![0]!;
    const isGroup = arg && typeof arg === 'object' && 'group' in arg;
    if (atom.value !== '\ue020') {
      return isGroup
        ? `\\not{${Atom.serialize(arg.group, options)}}`
        : `\\not${Atom.serialize(arg as Atom[], options)}`;
    }
    return isGroup ? `\\not{}` : `\\not`;
  },
  render: (atom, context) => {
    if (atom.value) return atom.createBox(context);

    const isGroup =
      atom.args![0] &&
      typeof atom.args![0] === 'object' &&
      'group' in atom.args![0]!;
    const type = isGroup ? 'ord' : atomsBoxType(argAtoms(atom.args![0]));
    const box = Atom.createBox(context, atom.body, { type })!;
    if (atom.caret) box.caret = atom.caret;
    return atom.bind(context, box);
  },
});

defineFunction(['ne', 'neq'], '', {
  createAtom: (options) =>
    new Atom({
      ...options,
      type: 'mrel',
      body: [
        new OverlapAtom({
          ...options,
          body: '\ue020',
          align: 'right',
          boxType: 'rel',
        }),
        new Atom({ ...options, value: '=' }),
      ],
      captureSelection: true,
    }),
  serialize: (atom) => atom.command,
});

defineFunction('rlap', '{:auto}', {
  createAtom: (options) =>
    new OverlapAtom({
      ...options,
      body: argAtoms(options.args![0]),
      align: 'right',
    }),
});

defineFunction('llap', '{:auto}', {
  createAtom: (options): Atom =>
    new OverlapAtom({
      ...options,
      body: argAtoms(options.args![0]),
      align: 'left',
    }),
});

defineFunction('mathrlap', '{:math}', {
  createAtom: (options) =>
    new OverlapAtom({
      ...options,
      body: argAtoms(options.args![0]),
      align: 'right',
    }),
});

defineFunction('mathllap', '{:math}', {
  createAtom: (options): Atom =>
    new OverlapAtom({
      ...options,
      body: argAtoms(options.args![0]),
      align: 'left',
    }),
});

defineFunction('raisebox', '{:value}{:text}', {
  createAtom: (
    options: CreateAtomOptions<[LatexValue | null, Argument | null]>
  ) =>
    new BoxAtom({
      ...options,
      body: argAtoms(options.args![1]),
      padding: { dimension: 0 },
      offset: options.args![0] ?? { dimension: 0 },
    }),
  serialize: (atom: BoxAtom, options) =>
    latexCommand(
      '\\raisebox',
      serializeLatexValue(atom.offset) ?? '0pt',
      atom.bodyToLatex(options)
    ),
});

defineFunction('raise', '{:value}{:auto}', {
  createAtom: (
    options: CreateAtomOptions<[LatexValue | null, Argument | null]>
  ) =>
    new BoxAtom({
      ...options,
      body: argAtoms(options.args![1]),
      padding: { dimension: 0 },
      offset: options.args![0] ?? { dimension: 0 },
    }),
  serialize: (atom: BoxAtom, options) =>
    latexCommand(
      '\\raise',
      serializeLatexValue(atom.offset) ?? '0pt',
      atom.bodyToLatex(options)
    ),
});

defineFunction('lower', '{:value}{:auto}', {
  createAtom: (
    options: CreateAtomOptions<[LatexValue | null, Argument | null]>
  ) =>
    new BoxAtom({
      ...options,
      body: argAtoms(options.args![1]),
      padding: { dimension: 0 },
      offset: multiplyLatexValue(options.args![0], -1) ?? { dimension: 0 },
    }),
  serialize: (atom: BoxAtom, options) =>
    latexCommand(
      '\\lower',
      serializeLatexValue(
        multiplyLatexValue(atom.offset ?? { dimension: 0 }, -1)
      ) ?? '0pt',
      atom.bodyToLatex(options)
    ),
});
