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

import {
  AlignEnvironment,
  CasesEnvironment,
  Environment,
  MatrixEnvironment,
  TabularEnvironment,
} from '../public/core-types';

const matrices = [
  'matrix',
  'matrix*',
  'pmatrix',
  'pmatrix*',
  'bmatrix',
  'bmatrix*',
  'Bmatrix',
  'Bmatrix*',
  'vmatrix',
  'vmatrix*',
  'Vmatrix',
  'Vmatrix*',
];
const cases = ['cases', 'dcases', 'rcases'];

const align = ['align', 'align*', 'aligned', 'gather', 'gathered', 'split'];
const otherTabular = ['array', 'subequations', 'eqnarray'];
export function isTabularEnvironment(
  environment: Environment
): environment is TabularEnvironment {
  return otherTabular
    .concat(align)
    .concat(cases)
    .concat(matrices)
    .includes(environment);
}

export function isMatrixEnvironment(
  environment: Environment
): environment is MatrixEnvironment {
  return matrices.includes(environment);
}

export function isCasesEnvironment(
  environment: Environment
): environment is CasesEnvironment {
  return cases.includes(environment);
}

export function isAlignEnvironment(
  environment: Environment
): environment is AlignEnvironment {
  return align.includes(environment);
}
