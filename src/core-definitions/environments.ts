import {
  defineEnvironment,
  defineTabularEnvironment,
} from './definitions-utils';
import type { Atom } from '../core/atom-class';
import { ArrayAtom, Colspec } from '../core-atoms/array';

/*

See http://texdoc.net/texmf-dist/doc/latex/amsmath/amsldoc.pdf

<columns> ::= <column>*<line>
<column> ::= <line>('l'|'c'|'r')
<line> ::= '|' | '||' | ''

'math',
                frequency 0
'displaymath',
                frequency 8

'equation'      centered, numbered
                frequency 8

'subequations'   with an 'equation' environment, appends a letter to eq no
                frequency 1

'array',        {columns:text}
                cells are textstyle math
                no fence

'eqnarray'      DEPRECATED see http://www.tug.org/pracjourn/2006-4/madsen/madsen.pdf
                {rcl}
                first and last cell in each row is displaystyle math
                each cell has a margin of \arraycolsep
                Each line has a eqno
                frequency 7


'theorem'       text mode. Prepends in bold 'Theorem <counter>', then body in italics.

'multline'      single column
                first row left aligned, last right aligned, others centered
                last line has an eqn. counter. multline* will omit the counter
                no output if inside an equation
                

'gather'        at most two columns
                first column centered, second column right aligned
                frequency 1

'gathered'      must be in equation environment
                single column,
                centered
                frequency: COMMON
                optional argument: [b], [t] to vertical align

'align'        multiple columns,
                alternating rl
                there is some 'space' (additional column?) between each pair
                each line is numbered (except when inside an equation environment)
                there is an implicit {} at the beginning of left columns

'aligned'      must be in equation environment
                frequency: COMMON
                @{}r@{}l@{\quad}@{}r@{}l@{}

'split'         must be in an equation environment,
                two columns, additional columns are interpreted as line breaks
                first column is right aligned, second column is left aligned
                entire construct is numbered (as opposed to 'align' where each line is numbered)
                frequency: 0


'alignedat'
From AMSMath:
---The alignedat environment was changed to take two arguments rather
than one: a mandatory argument (as formerly) specifying the number of
align structures, and a new optional one specifying the placement of the
environment (parallel to the optional argument of aligned). However,
aligned is simpler to use, allowing any number of aligned structures
automatically, and therefore the use of alignedat is deprecated.


 'alignat'      {pairs:number}
                {rl} alternating as many times as indicated by <pairs> arg
                no space between column pairs (unlike align)
                there is an implicit {} at the beginning of left columns
                frequency: 0

 'flalign'      multiple columns
                alternate rl
                third column further away than align...?
                frequency: 0


'matrix'        at most 10 columns
                cells centered
                no fence
                no colsep at beginning or end
                (mathtools package add an optional arg for the cell alignment)
                frequency: COMMON

'pmatrix'       fence: ()
                frequency: COMMON

'bmatrix'       fence: []
                frequency: COMMON

'Bmatrix'       fence: {}
                frequency: 237

'vmatrix'       fence: \vert
                frequency: 368

'Vmatrix'       fence: \Vert
                frequency: 41

'smallmatrix'   displaystyle: scriptstyle (?)
                frequency: 279

'cases'
                frequency: COMMON
                l@{2}l

'center'        text mode only?
                frequency: ?
*/
// See https://en.wikibooks.org/wiki/LaTeX/Mathematics
// and http://www.ele.uri.edu/faculty/vetter/Other-stuff/latex/Mathmode.pdf

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
  (name: string, array: Atom[][][], rowGaps: number[]): Atom =>
    new ArrayAtom(name, array, rowGaps, { mathStyleName: 'textstyle' })
);

defineEnvironment(
  'displaymath',
  '',
  (name: string, array: Atom[][][], rowGaps: number[]): Atom =>
    new ArrayAtom(name, array, rowGaps, { mathStyleName: 'textstyle' })
);

defineTabularEnvironment(
  'array',
  '{columns:colspec}',
  (name: string, array: Atom[][][], rowGaps: number[], args): Atom =>
    new ArrayAtom(name, array, rowGaps, {
      colFormat: args[0] as Colspec[],
      mathStyleName: 'textstyle',
    })
);

defineTabularEnvironment(
  ['equation', 'equation', 'subequations'],
  '',
  (name: string, array: Atom[][][], rowGaps: number[]): Atom =>
    new ArrayAtom(name, array, rowGaps, {
      colFormat: [{ align: 'c' }],
    })
);

// Note spelling: MULTLINE, not multiline.
defineTabularEnvironment(
  'multline',
  '',
  (name: string, array: Atom[][][], rowGaps: number[]): Atom =>
    new ArrayAtom(name, array, rowGaps, {
      colFormat: [{ align: 'm' }],
    })
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
  (name: string, array: Atom[][][], rowGaps: number[]): Atom => {
    let colCount = 0;
    for (const row of array) {
      colCount = Math.max(colCount, row.length);
    }

    const colFormat: Colspec[] = [
      { gap: 0 },
      { align: 'r' },
      { gap: 0 },
      { align: 'l' },
    ];
    let i = 2;
    while (i < colCount) {
      colFormat.push({ gap: 1 });
      colFormat.push({ align: 'r' });
      colFormat.push({ gap: 0 });
      colFormat.push({ align: 'l' });
      i += 2;
    }

    colFormat.push({ gap: 0 });

    return new ArrayAtom(name, array, rowGaps, {
      arraycolsep: 0,
      colFormat,
      jot: 0.3,
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
  (name: string, array: Atom[][][], rowGaps: number[]): Atom =>
    new ArrayAtom(name, array, rowGaps, {
      colFormat: [{ align: 'r' }, { align: 'l' }],
    })
);

defineTabularEnvironment(
  ['gather', 'gathered'],
  '',
  (name: string, array: Atom[][][], rowGaps: number[]): Atom =>
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
    new ArrayAtom(name, array, rowGaps, {
      colFormat: [{ gap: 0.25 }, { align: 'c' }, { gap: 0 }],
    })
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
    'smallmatrix',
    'matrix*',
    'pmatrix*',
    'bmatrix*',
    'Bmatrix*',
    'vmatrix*',
    'Vmatrix*',
    'smallmatrix*',
  ],
  '[columns:colspec]',
  (name: string, array: Atom[][][], rowGaps: number[], args): Atom => {
    // From amstex.sty:
    // \def\matrix{\hskip -\arraycolsep\array{*\c@MaxMatrixCols c}}
    // \def\endmatrix{\endarray \hskip -\arraycolsep}
    let leftDelim: string;
    let rightDelim: string;
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

    return new ArrayAtom(name, array, rowGaps, {
      mathStyleName: name.startsWith('smallmatrix')
        ? 'scriptstyle'
        : 'textstyle',
      leftDelim,
      rightDelim,
      colFormat: (args[0] as Colspec[]) ?? [
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
  'cases',
  '',
  (name: string, array: Atom[][][], rowGaps: number[]): Atom => {
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
    return new ArrayAtom(name, array, rowGaps, {
      arraystretch: 1.2,
      leftDelim: '\\lbrace',
      rightDelim: '.',
      colFormat: [{ align: 'l' }, { gap: 1 }, { align: 'l' }],
    });
  }
);

defineTabularEnvironment(
  'rcases',
  '',
  (name: string, array: Atom[][][], rowGaps: number[]): Atom => {
    return new ArrayAtom(name, array, rowGaps, {
      arraystretch: 1.2,
      leftDelim: '.',
      rightDelim: '\\rbrace',
      colFormat: [{ align: 'l' }, { gap: 1 }, { align: 'l' }],
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
  (name: string, array: Atom[][][], rowGaps: number[]): Atom =>
    new ArrayAtom(name, array, rowGaps, { colFormat: [{ align: 'c' }] })
);
