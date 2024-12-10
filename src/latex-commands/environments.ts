import type { Dimension, Environment } from '../public/core-types';

import { Atom } from '../core/atom-class';
import { PlaceholderAtom } from '../atoms/placeholder';
import { ArrayAtom, ColumnFormat } from '../atoms/array';

import {
  defineEnvironment,
  defineFunction,
  defineTabularEnvironment,
} from './definitions-utils';
import type { Argument } from './types';
import { Parser } from 'core/parser';

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
defineEnvironment(['math', 'displaymath'], makeEnvironment);

defineEnvironment('center', makeEnvironment);

defineFunction('displaylines', '', {
  parse: (parser: Parser) => {
    const lines: Atom[][][] = [];
    let line: Atom[] = [];
    parser.skipWhitespace();
    if (!parser.match('<{>')) return [];
    parser.beginContext({ tabular: true });
    do {
      if (parser.end() || parser.match('<}>')) break;
      if (parser.matchColumnSeparator() || parser.matchRowSeparator()) {
        lines.push([line]);
        line = [];
      } else {
        line.push(
          ...parser.scan((token) =>
            ['<}>', '&', '\\cr', '\\\\', '\\tabularnewline'].includes(token)
          )
        );
      }
    } while (true);
    parser.endContext();
    lines.push([line]);
    return lines as Argument[];
  },
  createAtom: (options) =>
    new ArrayAtom('lines', options.args as Readonly<Atom[]>[][], [], {
      // arraystretch: 1.2,
      leftDelim: '.',
      rightDelim: '.',
      columns: [{ align: 'l' }],
    }),
});

defineTabularEnvironment(
  'array',
  '{columns:colspec}',
  (name, array, rowGaps, args) => {
    return new ArrayAtom(name, defaultContent(array), rowGaps, {
      columns: args[0] as ColumnFormat[],
      mathstyleName: 'textstyle',
    });
  }
);

defineTabularEnvironment(
  ['equation', 'equation*', 'subequations'],
  '',
  (
    name: Environment,
    array: Readonly<Atom[]>[][],
    rowGaps: Dimension[]
  ): Atom => {
    return new ArrayAtom(name, defaultContent(array), rowGaps, {
      columns: [{ align: 'c' }],
    });
  }
);

// Note spelling: MULTLINE, not multiline.
defineTabularEnvironment(['multline', 'multline*'], '', makeEnvironment);

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
  makeEnvironment
);

// DefineEnvironment('alignat', '', function(name, args) {
//     return {

//     };
// });

// defineEnvironment('flalign', '', function(name, args) {
//     return {

//     };
// });

defineTabularEnvironment('split', '', makeEnvironment);

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
defineTabularEnvironment(
  ['gather', 'gather*', 'gathered'],
  '',
  makeEnvironment
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
  makeEnvironment
);

defineTabularEnvironment(
  ['smallmatrix', 'smallmatrix*'],
  '[columns:colspec]',
  makeEnvironment
);

// \cases is standard LaTeX
// \dcases is from the mathtools package

// \rcases is from the mathtools package
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
defineTabularEnvironment(['cases', 'dcases', 'rcases'], '', makeEnvironment);

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

function isContentEmpty(array: Readonly<Atom[]>[][]) {
  for (const row of array)
    for (const col of row) if (col.length > 0) return false;
  return true;
}

function defaultContent(array: Readonly<Atom[]>[][], count = 1) {
  if (isContentEmpty(array)) {
    return Array(count).fill([
      [new Atom({ type: 'first' }), new PlaceholderAtom()],
    ]);
  }
  return array.map((row) => {
    if (row.length === 0) return [[new Atom({ type: 'first' })]];
    return row.map((cell) => {
      if (cell.length === 0) return [new Atom({ type: 'first' })];

      if (cell[0].type === 'first') return cell;
      return [new Atom({ type: 'first' }), ...cell];
    });
  });
}

export function makeEnvironment(
  name: Environment,
  content: Readonly<Atom[]>[][] = [[[]]],
  rowGaps: Readonly<Dimension[]> = [],
  args: readonly (null | Argument)[] = [],
  maxMatrixCols?: number
): ArrayAtom {
  content = defaultContent(
    content,
    ['split', 'align', 'align*', 'aligned', 'eqnarray'].includes(name) ? 2 : 1
  );
  switch (name) {
    case 'math':
      return new ArrayAtom(name, content, rowGaps, {
        mathstyleName: 'textstyle',
      });
    case 'displaymath':
      return new ArrayAtom(name, content, rowGaps, {
        mathstyleName: 'textstyle',
      });
    case 'center':
      return new ArrayAtom(name, content, rowGaps, {
        columns: [{ align: 'c' }],
      });
    case 'multline':
    case 'multline*':
      return new ArrayAtom(name, content, rowGaps, {
        columns: [{ align: 'm' }],
        leftDelim: '.',
        rightDelim: '.',
      });
    case 'split':
      return new ArrayAtom(name, content, rowGaps, {
        columns: [{ align: 'r' }, { align: 'l' }],
        minColumns: 2,
      });
    case 'gather':
    case 'gathered':
      return new ArrayAtom(name, content, rowGaps, {
        columns: [{ gap: 0.25 }, { align: 'c' }, { gap: 0 }],
        // colSeparationType: 'gather',
      });
    case 'pmatrix':
    case 'pmatrix*':
      return new ArrayAtom(name, content, rowGaps, {
        mathstyleName: 'textstyle',
        leftDelim: '(',
        rightDelim: ')',
        columns: defaultColumns(args[0], maxMatrixCols),
      });
    case 'bmatrix':
    case 'bmatrix*':
      return new ArrayAtom(name, content, rowGaps, {
        mathstyleName: 'textstyle',
        leftDelim: '[',
        rightDelim: ']',
        columns: defaultColumns(args[0], maxMatrixCols),
      });
    case 'Bmatrix':
    case 'Bmatrix*':
      return new ArrayAtom(name, content, rowGaps, {
        mathstyleName: 'textstyle',
        leftDelim: '\\lbrace',
        rightDelim: '\\rbrace',
        columns: defaultColumns(args[0], maxMatrixCols),
      });
    case 'vmatrix':
    case 'vmatrix*':
      return new ArrayAtom(name, content, rowGaps, {
        mathstyleName: 'textstyle',
        leftDelim: '\\vert',
        rightDelim: '\\vert',
        columns: defaultColumns(args[0], maxMatrixCols),
      });
    case 'Vmatrix':
    case 'Vmatrix*':
      return new ArrayAtom(name, content, rowGaps, {
        mathstyleName: 'textstyle',
        leftDelim: '\\Vert',
        rightDelim: '\\Vert',
        columns: defaultColumns(args[0], maxMatrixCols),
      });
    case 'matrix':
    case 'matrix*':
      // Specifying a fence, even a null fence,
      // will prevent the insertion of an initial and final gap
      return new ArrayAtom(name, content, rowGaps, {
        mathstyleName: 'textstyle',
        leftDelim: '.',
        rightDelim: '.',
        columns: defaultColumns(args?.[0], maxMatrixCols),
      });
    case 'smallmatrix':
    case 'smallmatrix*':
      return new ArrayAtom(name, content, rowGaps, {
        mathstyleName: 'scriptstyle',
        columns: defaultColumns(args?.[0], maxMatrixCols),
        colSeparationType: 'small',
        arraystretch: 0.5,
      });
    case 'cases':
    case 'dcases':
      return new ArrayAtom(name, content, rowGaps, {
        mathstyleName: name === 'dcases' ? 'displaystyle' : 'textstyle',
        arraystretch: 1.2,
        leftDelim: '\\lbrace',
        rightDelim: '.',
        columns: [{ align: 'l' }, { gap: 1 }, { align: 'l' }],
      });
    case 'rcases':
      return new ArrayAtom(name, content, rowGaps, {
        arraystretch: 1.2,
        leftDelim: '.',
        rightDelim: '\\rbrace',
        columns: [{ align: 'l' }, { gap: 1 }, { align: 'l' }],
      });
    case 'lines':
      return new ArrayAtom(name, content, rowGaps, {
        // arraystretch: 1.2,
        leftDelim: '.',
        rightDelim: '.',
        columns: [{ align: 'l' }],
      });

    case 'align':
    case 'align*':
    case 'aligned':
    case 'eqnarray': {
      let colCount = 0;
      for (const row of content) colCount = Math.max(colCount, row.length);

      const columns: ColumnFormat[] = [
        { gap: 0 },
        { align: 'r' },
        { gap: 0.25 },
        { align: 'l' },
      ];
      let i = 2;
      while (i < colCount) {
        columns.push({ gap: 1 }, { align: 'r' }, { gap: 0.25 }, { align: 'l' });
        i += 2;
      }

      columns.push({ gap: 0 });

      return new ArrayAtom(name, content, rowGaps, {
        arraycolsep: 0,
        columns,
        // colSeparationType: 'align',
        minColumns: 2,
      });
    }
  }

  // 'math'
  return new ArrayAtom(name, content, rowGaps, {
    mathstyleName: 'textstyle',
  });
}

function defaultColumns(
  args: null | Argument,
  maxMatrixCols: number = 10
): ColumnFormat[] {
  return (args as ColumnFormat[]) ?? Array(maxMatrixCols).fill({ align: 'c' });
}
