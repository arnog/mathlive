import type { Dimension } from '../public/core-types';
import type { GlobalContext } from 'core/types';

import { Atom } from '../core/atom-class';
import { PlaceholderAtom } from '../core-atoms/placeholder';
import { ArrayAtom, ColumnFormat } from '../core-atoms/array';

import {
  defineEnvironment,
  defineTabularEnvironment,
} from './definitions-utils';
import { Environment, TabularEnvironment } from './environment-types';

/*
The star at the end of the name of a displayed math environment causes that
the formula lines won't be numbered. Otherwise they would automatically get a number.

\notag will also turn off the numbering.
\shoveright and \shoveleft will force alignment of a line

The only difference between align and equation is the spacing of the formulas.
You should attempt to use equation when possible, and align when you have multi-line formulas.
Equation will have space before/after < 1em if line before/after is short enough.

Also: equation throws an error when you have an & inside the environment,
so look out for that when converting between the two.

Whereas align produces a structure whose width is the full line width, aligned
gives a width that is the actual width of the contents, thus it can be used as
a component in a containing expression, e.g. for putting the entire alignment
in a parenthesis
*/
defineEnvironment(
  'math',
  '',
  (
    context: GlobalContext,
    name: Environment,
    array: Atom[][][],
    rowGaps: Dimension[]
  ): Atom => {
    if (isEnvironmentEmpty(array)) {
      // set default contents
      array = [[[new Atom('first', context), new PlaceholderAtom(context)]]];
    }

    return new ArrayAtom(context, name, array, rowGaps, {
      mathstyleName: 'textstyle',
    });
  }
);

defineEnvironment(
  'displaymath',
  '',
  (
    context: GlobalContext,
    name: Environment,
    array: Atom[][][],
    rowGaps: Dimension[]
  ): Atom => {
    if (isEnvironmentEmpty(array)) {
      // set default contents
      array = [[[new Atom('first', context), new PlaceholderAtom(context)]]];
    }

    return new ArrayAtom(context, name, array, rowGaps, {
      mathstyleName: 'textstyle',
    });
  }
);

defineTabularEnvironment(
  'array',
  '{columns:colspec}',
  (
    context: GlobalContext,
    name: TabularEnvironment,
    array: Atom[][][],
    rowGaps: Dimension[],
    args
  ): Atom => {
    if (isEnvironmentEmpty(array)) {
      // set default contents
      array = [[[new Atom('first', context), new PlaceholderAtom(context)]]];
    }

    return new ArrayAtom(context, name, array, rowGaps, {
      columns: args[0] as ColumnFormat[],
      mathstyleName: 'textstyle',
    });
  }
);

defineTabularEnvironment(
  ['equation', 'equation*', 'subequations'],
  '',
  (
    context: GlobalContext,
    name: TabularEnvironment,
    array: Atom[][][],
    rowGaps: Dimension[]
  ): Atom => {
    if (isEnvironmentEmpty(array)) {
      // set default contents
      array = [[[new Atom('first', context), new PlaceholderAtom(context)]]];
    }

    return new ArrayAtom(context, name, array, rowGaps, {
      columns: [{ align: 'c' }],
    });
  }
);

// Note spelling: MULTLINE, not multiline.
defineTabularEnvironment(
  'multline',
  '',
  (
    context: GlobalContext,
    name: TabularEnvironment,
    array: Atom[][][],
    rowGaps: Dimension[]
  ): Atom => {
    if (isEnvironmentEmpty(array)) {
      // set default contents
      array = [[[new Atom('first', context), new PlaceholderAtom(context)]]];
    }

    return new ArrayAtom(context, name, array, rowGaps, {
      columns: [{ align: 'm' }],
    });
  }
);

// An AMS-Math environment
// See amsmath.dtx:3565
// Note that some versions of AMS-Math have a gap on the left.
// More recent version suppresses that gap, but have an option to turn it back on
// for backward compatibility.
// Note that technically, 'eqnarray' behaves (slightly) differently. However,
// is is generally recommended to avoid using eqnarray and use align isntead.
// https://texblog.net/latex-archive/maths/eqnarray-align-environment/
defineTabularEnvironment(
  ['align', 'align*', 'aligned', 'eqnarray'],
  '',
  (
    context: GlobalContext,
    name: TabularEnvironment,
    array: Atom[][][],
    rowGaps: Dimension[]
  ): Atom => {
    let colCount = 0;
    if (isEnvironmentEmpty(array)) {
      // set default contents
      array = [
        [
          [new Atom('first', context), new PlaceholderAtom(context)],
          [new Atom('first', context), new PlaceholderAtom(context)],
        ],
      ];
    }
    for (const row of array) colCount = Math.max(colCount, row.length);

    const colFormat: ColumnFormat[] = [
      { gap: 0 },
      { align: 'r' },
      { gap: 0.25 },
      { align: 'l' },
    ];
    let i = 2;
    while (i < colCount) {
      colFormat.push({ gap: 1 });
      colFormat.push({ align: 'r' });
      colFormat.push({ gap: 0.25 });
      colFormat.push({ align: 'l' });
      i += 2;
    }

    colFormat.push({ gap: 0 });

    return new ArrayAtom(context, name, array, rowGaps, {
      arraycolsep: 0,
      columns: colFormat,
      colSeparationType: 'align',
      jot: 0.3,
      minColumns: 2,
    });
  }
);

// DefineEnvironment('alignat', '', function(name, args) {
//     return {

//     };
// });

// defineEnvironment('flalign', '', function(name, args) {
//     return {

//     };
// });

defineTabularEnvironment(
  'split',
  '',
  (
    context: GlobalContext,
    name: TabularEnvironment,
    array: Atom[][][],
    rowGaps: Dimension[]
  ): Atom => {
    if (isEnvironmentEmpty(array)) {
      // set default contents
      array = [
        [
          [new Atom('first', context), new PlaceholderAtom(context)],
          [new Atom('first', context), new PlaceholderAtom(context)],
        ],
      ];
    }
    return new ArrayAtom(context, name, array, rowGaps, {
      columns: [{ align: 'r' }, { align: 'l' }],
      minColumns: 2,
    });
  }
);

defineTabularEnvironment(
  ['gather', 'gathered'],
  '',
  (
    context: GlobalContext,
    name: TabularEnvironment,
    array: Atom[][][],
    rowGaps: Dimension[]
  ): Atom => {
    // An AMS-Math environment
    // %    The \env{gathered} environment is for several lines that are
    // %    centered independently.
    // From amstex.sty
    // \newenvironment{gathered}[1][c]{%
    //   \relax\ifmmode\else\nonmatherr@{\begin{gathered}}\fi
    //   \null\,%
    //   \if #1t\vtop \else \if#1b\vbox \else \vcenter \fi\fi
    //   \bgroup\Let@\restore@math@cr
    //   \ifinany@\else\openup\jot\fi\ialign
    //   \bgroup\hfil\strut@$\m@th\displaystyle##$\hfil\crcr

    if (isEnvironmentEmpty(array)) {
      // set default contents
      array = [[[new Atom('first', context), new PlaceholderAtom(context)]]];
    }

    return new ArrayAtom(context, name, array, rowGaps, {
      columns: [{ gap: 0.25 }, { align: 'c' }, { gap: 0 }],
      colSeparationType: 'gather',
    });
  }
);

// DefineEnvironment('cardinality', '',  function() {
//     const result = {};

//     result.mathstyle = 'textstyle';
//     result.lFence = '|';
//     result.rFence = '|';

//     return result;
// });

defineTabularEnvironment(
  [
    'matrix',
    'pmatrix',
    'bmatrix',
    'Bmatrix',
    'vmatrix',
    'Vmatrix',
    'matrix*',
    'pmatrix*',
    'bmatrix*',
    'Bmatrix*',
    'vmatrix*',
    'Vmatrix*',
  ],
  '[columns:colspec]',
  (
    context: GlobalContext,
    name: TabularEnvironment,
    array: Atom[][][],
    rowGaps: Dimension[],
    args
  ): Atom => {
    if (isEnvironmentEmpty(array)) {
      // set default contents
      array = [[[new Atom('first', context), new PlaceholderAtom(context)]]];
    }

    // From amstex.sty:
    // \def\matrix{\hskip -\arraycolsep\array{*\c@MaxMatrixCols c}}
    // \def\endmatrix{\endarray \hskip -\arraycolsep}
    let leftDelim = '.';
    let rightDelim = '.';
    switch (name) {
      case 'pmatrix':
      case 'pmatrix*':
        leftDelim = '(';
        rightDelim = ')';
        break;

      case 'bmatrix':
      case 'bmatrix*':
        leftDelim = '[';
        rightDelim = ']';
        break;

      case 'Bmatrix':
      case 'Bmatrix*':
        leftDelim = '\\lbrace';
        rightDelim = '\\rbrace';
        break;

      case 'vmatrix':
      case 'vmatrix*':
        leftDelim = '\\vert';
        rightDelim = '\\vert';
        break;

      case 'Vmatrix':
      case 'Vmatrix*':
        leftDelim = '\\Vert';
        rightDelim = '\\Vert';
        break;

      case 'matrix':
      case 'matrix*':
        // Specifying a fence, even a null fence,
        // will prevent the insertion of an initial and final gap
        leftDelim = '.';
        rightDelim = '.';
        break;
      default:
    }

    return new ArrayAtom(context, name, array, rowGaps, {
      mathstyleName: 'textstyle',
      leftDelim,
      rightDelim,
      columns: (args[0] as ColumnFormat[]) ?? [
        { align: 'c' },
        { align: 'c' },
        { align: 'c' },
        { align: 'c' },
        { align: 'c' },
        { align: 'c' },
        { align: 'c' },
        { align: 'c' },
        { align: 'c' },
        { align: 'c' },
      ],
    });
  }
);

defineTabularEnvironment(
  ['smallmatrix', 'smallmatrix*'],
  '[columns:colspec]',
  (
    context: GlobalContext,
    name: TabularEnvironment,
    array: Atom[][][],
    rowGaps: Dimension[],
    args
  ): Atom => {
    if (isEnvironmentEmpty(array)) {
      // set default contents
      array = [[[new Atom('first', context), new PlaceholderAtom(context)]]];
    }

    return new ArrayAtom(context, name, array, rowGaps, {
      mathstyleName: 'scriptstyle',
      columns: (args[0] as ColumnFormat[]) ?? [
        { align: 'c' },
        { align: 'c' },
        { align: 'c' },
        { align: 'c' },
        { align: 'c' },
        { align: 'c' },
        { align: 'c' },
        { align: 'c' },
        { align: 'c' },
        { align: 'c' },
      ],
      colSeparationType: 'small',
      arraystretch: 0.5,
    });
  }
);

// \cases is standard LaTeX
// \dcases is from the mathtools package
defineTabularEnvironment(
  ['cases', 'dcases'],
  '',
  (
    context: GlobalContext,
    name: TabularEnvironment,
    array: Atom[][][],
    rowGaps: Dimension[]
  ): Atom => {
    // From amstex.sty:
    // \def\cases{\left\{\def\arraystretch{1.2}\hskip-\arraycolsep
    //   \array{l@{\quad}l}}
    // \def\endcases{\endarray\hskip-\arraycolsep\right.}
    // From amsmath.dtx
    // \def\env@cases{%
    //   \let\@ifnextchar\new@ifnextchar
    //   \left\lbrace
    //   \def\arraystretch{1.2}%
    //   \array{@{}l@{\quad}l@{}}%

    if (isEnvironmentEmpty(array)) {
      // set default contents
      array = [[[new Atom('first', context), new PlaceholderAtom(context)]]];
    }

    return new ArrayAtom(context, name, array, rowGaps, {
      mathstyleName: name === 'dcases' ? 'displaystyle' : 'textstyle',
      arraystretch: 1.2,
      leftDelim: '\\lbrace',
      rightDelim: '.',
      columns: [{ align: 'l' }, { gap: 1 }, { align: 'l' }],
    });
  }
);

// \rcases is from the mathtools package
defineTabularEnvironment(
  'rcases',
  '',
  (
    context: GlobalContext,
    name: TabularEnvironment,
    array: Atom[][][],
    rowGaps: Dimension[]
  ): Atom => {
    if (isEnvironmentEmpty(array)) {
      // set default contents
      array = [[[new Atom('first', context), new PlaceholderAtom(context)]]];
    }

    return new ArrayAtom(context, name, array, rowGaps, {
      arraystretch: 1.2,
      leftDelim: '.',
      rightDelim: '\\rbrace',
      columns: [{ align: 'l' }, { gap: 1 }, { align: 'l' }],
    });
  }
);

// This is a text mode environment
/*
\begin{theorem}
Let $f$ be a function whose derivative exists in every point, then $f$
is a continuous function.
\end{theorem}
*/
// defineEnvironment('theorem', '', function () {
//     return {};
// });

defineEnvironment(
  'center',
  '',
  (
    context: GlobalContext,
    name: Environment,
    array: Atom[][][],
    rowGaps: Dimension[]
  ): Atom => {
    if (isEnvironmentEmpty(array)) {
      // set default contents
      array = [[[new Atom('first', context), new PlaceholderAtom(context)]]];
    }

    return new ArrayAtom(context, name, array, rowGaps, {
      columns: [{ align: 'c' }],
    });
  }
);

function isEnvironmentEmpty(array: Atom[][][]) {
  for (const row of array)
    for (const col of row) if (col.length > 0) return false;
  return true;
}
