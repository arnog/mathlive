import {
  Atom,
  Branch,
  isColRowBranch,
  isNamedBranch,
  ToLatexOptions,
} from '../core/atom-class';
import { Span } from '../core/span';
import { Stack, StackElementAndShift } from '../core/stack';
import { makeLeftRightDelim } from '../core/delimiters';
import { MathstyleName } from '../core/mathstyle';
import { Context } from '../core/context';
import { joinLatex } from '../core/tokenizer';
import { PlaceholderAtom } from './placeholder';
import { AXIS_HEIGHT, BASELINE_SKIP } from '../core/font-metrics';

export type ColumnFormat =
  | {
      // A regular content column, with the specified alignment.
      // 'm' is a special alignement for multline: left on first row, right on last
      // row, centered otherwise
      align?: 'l' | 'c' | 'r' | 'm';
    }
  | {
      // The width of a gap between columns, or a Latex expression between columns
      gap?: number | Atom[];
    }
  | {
      // A rule (line) separating columns
      separator?: 'solid' | 'dashed';
    };

export type ColSeparationType =
  | 'align'
  | 'alignat'
  | 'gather'
  | 'small'
  | 'CD'
  | undefined;

export type ArrayAtomConstructorOptions = {
  // Params: FunctionArgumentDefiniton[];
  // parser: ParseFunction;
  mathstyleName?: MathstyleName;
  columns?: ColumnFormat[];
  colSeparationType?: ColSeparationType;
  leftDelim?: string;
  rightDelim?: string;
  // Jot is an extra gap between lines of numbered equation.
  // It's 3pt by default in LaTeX (ltmath.dtx:181)
  jot?: number;
  // A multiplication factor applied to the spacing between rows and columns
  arraystretch?: number;
  arraycolsep?: number;
};

type ArrayRow = {
  cells: Span[];
  height: number;
  depth: number;
  pos: number;
};

// function arrayToString(array: Atom[][][]): string {
//   if (array || array.length === 0) return `0 ⨉ 0\n`;
//   let result = `${array.length}r ⨉ ${array[0].length ?? 0}c\n`;

//   for (const row of array) {
//     result += '    ';
//     for (const cell of row) {
//       if (!cell || cell.length === 0) {
//         result += '😱';
//       } else if (cell[0].type === 'first') {
//         if (cell[1]) {
//           result += cell[1].command;
//         } else {
//           result += '∅';
//         }
//       } else {
//         result += '👎' + cell[0].command;
//       }
//       result += '  ';
//     }
//     result += '\n';
//   }

//   return result;
// }

/**
 * Normalize the array:
 * - ensure it is dense (not sparse)
 * - fold rows that overflow (longer than maximum number of columns)
 * - ensure each cell begins with a `first` atom
 * - remove last row if empty
 */

function normalizeArray(
  atom: ArrayAtom,
  array: Atom[][][],
  colFormat: ColumnFormat[]
): Atom[][][] {
  //
  // 1/
  // - Fold the array so that there are no more columns of content than
  // there are columns prescribed by the column format.
  // - Fill rows that have fewer cells than expected with empty cells
  // - Ensure that all the cells have a `first` atom.
  //

  // The number of column is determined by the colFormat
  let maxColCount = 0;
  for (const colSpec of colFormat) {
    if ('align' in colSpec) maxColCount += 1;
  }
  // Actual number of columns (at most `maxColCount`)
  let colCount = 0;
  const rows: Atom[][][] = [];

  for (const row of array) {
    let colIndex = 0;
    colCount = Math.max(colCount, Math.min(row.length, maxColCount));
    while (colIndex < row.length) {
      const newRow = [];
      const lastCol = Math.min(row.length, colIndex + maxColCount);
      while (colIndex < lastCol) {
        if (row[colIndex].length > 0 && row[colIndex][0].type !== 'first') {
          newRow.push([
            new Atom('first', { mode: atom.mode }),
            ...row[colIndex],
          ]);
        } else {
          newRow.push(row[colIndex]);
        }
        colIndex += 1;
      }

      rows.push(newRow);
    }
  }

  //
  // 2/ If the last row is empty, ignore it (TeX behavior)
  //
  if (
    rows[rows.length - 1].length === 1 &&
    rows[rows.length - 1][0].length === 0
  ) {
    rows.pop();
  }

  //
  // 3/ Fill out any missing cells
  //
  const result: Atom[][][] = [];
  for (const row of rows) {
    if (row.length !== colCount) {
      for (let i = row.length; i < colCount; i++) {
        row.push([
          new Atom('first', { mode: atom.mode }),
          new PlaceholderAtom(),
        ]);
      }
    }
    result.push(row);
  }

  //
  // 4/ Set the `parent` and `treeBranch` for each cell
  //
  let rowIndex = 0;
  let colIndex = 0;
  for (const row of result) {
    colIndex = 0;
    for (const cell of row) {
      for (const element of cell) {
        element.parent = atom;
        element.treeBranch = [rowIndex, colIndex];
      }
      colIndex += 1;
    }
    rowIndex += 1;
  }

  atom.isDirty = true;

  return result;
}

// See http://ctan.math.utah.edu/ctan/tex-archive/macros/latex/base/lttab.dtx
export class ArrayAtom extends Atom {
  array: Atom[][][];
  environmentName: string;
  rowGaps: number[];
  colFormat: ColumnFormat[];
  arraystretch?: number;
  arraycolsep?: number;
  colSeparationType?: ColSeparationType;
  jot?: number;
  leftDelim?: string;
  rightDelim?: string;
  mathstyleName?: MathstyleName;

  constructor(
    envName: string,
    array: Atom[][][],
    rowGaps: number[],
    options: ArrayAtomConstructorOptions = {}
  ) {
    super('array');
    this.environmentName = envName;
    this.rowGaps = rowGaps;
    if (options.mathstyleName) this.mathstyleName = options.mathstyleName;

    if (options.columns) {
      if (options.columns.length === 0) {
        this.colFormat = [{ align: 'l' }];
      } else {
        this.colFormat = options.columns;
      }
    }
    // The TeX definition is that arrays by default have a maximum
    // of 10, left-aligned, columns.
    if (!this.colFormat) {
      this.colFormat = [
        { align: 'l' },
        { align: 'l' },
        { align: 'l' },
        { align: 'l' },
        { align: 'l' },
        { align: 'l' },
        { align: 'l' },
        { align: 'l' },
        { align: 'l' },
        { align: 'l' },
      ];
    }

    this.array = normalizeArray(this, array, this.colFormat);
    // console.log(arrayToString(this.array));
    if (options.leftDelim) this.leftDelim = options.leftDelim;
    if (options.rightDelim) this.rightDelim = options.rightDelim;
    if (options.jot !== undefined) this.jot = options.jot;
    if (options.arraycolsep) this.arraycolsep = options.arraycolsep;
    this.colSeparationType = options.colSeparationType;
    // Default \arraystretch from lttab.dtx
    this.arraystretch = options.arraystretch ?? 1.0;
  }

  branch(cell: Branch): Atom[] | null {
    if (!isColRowBranch(cell)) return null;
    return this.array[cell[0]][cell[1]];
  }

  get branches(): Branch[] {
    const result = super.branches;
    this.array.forEach((_, col) => {
      this.array[col].forEach((_, row) => {
        if (this.array[col][row]) {
          result.push([col, row]);
        }
      });
    });
    return result;
  }

  createBranch(cell: Branch): Atom[] {
    if (!isColRowBranch(cell)) return [];
    return [];
  }

  get rowCount(): number {
    return this.array.length;
  }

  get colCount(): number {
    return this.array[0].length;
  }

  removeBranch(name: Branch): Atom[] {
    if (isNamedBranch(name)) {
      return super.removeBranch(name);
    }

    const children = this.branch(name);
    this.array[name[0]][name[1]] = null;
    children.forEach((x) => {
      x.parent = null;
      x.treeBranch = undefined;
    });
    // Drop the 'first' element
    console.assert(children[0].type === 'first');
    children.shift();
    this.isDirty = true;
    return children;
  }

  get hasChildren(): boolean {
    return this.children.length > 0;
  }

  get children(): Atom[] {
    const result = [];
    this.array.forEach((row) => {
      row.forEach((col) => {
        col.forEach((x) => {
          result.push(...x.children);
          result.push(x);
        });
      });
    });
    return [...result, ...super.children];
  }

  render(context: Context): Span | null {
    // See http://tug.ctan.org/macros/latex/base/ltfsstrc.dtx
    // and http://tug.ctan.org/macros/latex/base/lttab.dtx

    const innerContext = new Context(context, this.style, this.mathstyleName);

    // Row spacing
    const arraystretch = this.arraystretch;
    let arraycolsep =
      typeof this.arraycolsep === 'number'
        ? this.arraycolsep
        : context.metrics.arrayColSep;
    if (this.colSeparationType === 'small') {
      // We're in a {smallmatrix}. Default column space is \thickspace,
      // i.e. 5/18em = 0.2778em, per amsmath.dtx for {smallmatrix}.
      // But that needs adjustment because LaTeX applies \scriptstyle to the
      // entire array, including the colspace, but this function applies
      // \scriptstyle only inside each element.
      const localMultiplier = new Context(context, null, 'scriptstyle')
        .scalingFactor;
      arraycolsep = 0.2778 * (localMultiplier / context.scalingFactor);
    }
    const arrayskip = arraystretch * BASELINE_SKIP;
    const arstrutHeight = 0.7 * arrayskip;
    const arstrutDepth = 0.3 * arrayskip; // \@arstrutbox in lttab.dtx
    let totalHeight = 0;
    const body = [];
    let nc = 0;
    const nr = this.array.length;
    for (let r = 0; r < nr; ++r) {
      const inrow = this.array[r];
      nc = Math.max(nc, inrow.length);
      // The "inner" is in mathstyleName. Create a **new** context for the
      // cells, with the same mathstyleName, but this will prevent the
      // style correction from being applied twice
      const cellContext = new Context(
        innerContext,
        this.style,
        this.mathstyleName
      );
      let height = arstrutHeight / cellContext.scalingFactor; // \@array adds an \@arstrut
      let depth = arstrutDepth / cellContext.scalingFactor; // To each row (via the template)
      const outrow: ArrayRow = { cells: [], height: 0, depth: 0, pos: 0 };
      for (const element of inrow) {
        const elt =
          Atom.render(cellContext, element, { newList: true }) ??
          new Span(null, { newList: true });
        depth = Math.max(depth, elt.depth);
        height = Math.max(height, elt.height);
        outrow.cells.push(elt);
      }

      let gap = this.rowGaps[r] ?? 0;
      if (gap > 0) {
        // \@argarraycr
        gap += arstrutDepth;
        depth = Math.max(depth, gap); // \@xargarraycr

        gap = 0;
      }

      if (this.jot !== undefined) {
        depth += this.jot;
      }

      outrow.height = height;
      outrow.depth = depth;
      totalHeight += height;
      outrow.pos = totalHeight;
      totalHeight += depth + gap; // \@yargarraycr
      body.push(outrow);
    }

    const offset = totalHeight / 2 + AXIS_HEIGHT;
    const contentCols = [];
    for (let colIndex = 0; colIndex < nc; colIndex++) {
      const stack: StackElementAndShift[] = [];
      for (const row of body) {
        const element = row.cells[colIndex];
        element.depth = row.depth;
        element.height = row.height;

        stack.push({ span: element, shift: row.pos - offset });
      }

      if (stack.length > 0) {
        contentCols.push(new Stack({ individualShift: stack }));
      }
    }

    // Iterate over each column description.
    // Each `colDesc` will indicate whether to insert a gap, a rule or
    // a column from 'contentCols'
    const cols = [];
    let previousColContent = false;
    let previousColRule = false;
    let currentContentCol = 0;
    let firstColumn = !this.leftDelim;
    const { colFormat } = this;
    for (const colDesc of colFormat) {
      if ('align' in colDesc && currentContentCol >= contentCols.length) {
        // If there are more column format than content, we're done
        break;
      }
      if ('align' in colDesc) {
        // If an alignment is specified, insert a column of content
        if (previousColContent) {
          // If no gap was provided, insert a default gap between
          // consecutive columns of content
          cols.push(makeColGap(2 * arraycolsep));
        } else if (previousColRule || firstColumn) {
          // If the previous column was a rule or this is the first column
          // add a smaller gap
          cols.push(makeColGap(arraycolsep));
        }

        cols.push(
          new Span(contentCols[currentContentCol], {
            classes: 'col-align-' + colDesc.align,
          })
        );
        currentContentCol++;
        previousColContent = true;
        previousColRule = false;
        firstColumn = false;
      } else if ('gap' in colDesc) {
        //
        // Something to insert in between columns of content
        //
        if (typeof colDesc.gap === 'number') {
          // It's a number, indicating how much space, in em,
          // to leave in between columns
          cols.push(makeColGap(colDesc.gap));
        } else {
          // It's a list of atoms.
          // Create a column made up of the mathlist
          // as many times as there are rows.
          cols.push(
            makeColOfRepeatingElements(context, body, offset, colDesc.gap)
          );
        }

        previousColContent = false;
        previousColRule = false;
        firstColumn = false;
      } else if ('separator' in colDesc) {
        //
        // It's a column separator.
        //

        const separator = new Span(null, { classes: 'vertical-separator' });
        separator.setStyle('height', totalHeight, 'em');
        separator.setStyle(
          'border-right',
          `${context.metrics.arrayRuleWidth}em ${colDesc.separator} currentColor`
        );
        // We have box-sizing border-box, no need to correct the margin
        // separator.setStyle(
        //   'margin',
        //   `0 -${context.metrics.arrayRuleWidth / 2}em`
        // );
        separator.setStyle('vertical-align', -(totalHeight - offset), 'em');
        let gap = 0;
        if (previousColRule) {
          gap = context.metrics.doubleRuleSep - context.metrics.arrayRuleWidth;
        } else if (previousColContent) {
          gap = arraycolsep - context.metrics.arrayRuleWidth;
        }
        separator.left = gap;
        cols.push(separator);
        previousColContent = false;
        previousColRule = true;
        firstColumn = false;
      }
    }

    if (previousColContent && !this.rightDelim) {
      // If the last column was content, add a small gap
      cols.push(makeColGap(arraycolsep));
    }

    const inner = new Span(cols, { classes: 'mtable' });

    if (
      (!this.leftDelim || this.leftDelim === '.') &&
      (!this.rightDelim || this.rightDelim === '.')
    ) {
      // There are no delimiters around the array, just return what
      // we've built so far.
      return inner;
    }

    // There is at least one delimiter. Wrap the inner of the array with
    // appropriate left and right delimiters
    const innerHeight = inner.height;
    const innerDepth = inner.depth;
    const result = this.bind(
      context,
      new Span(
        [
          this.bind(
            context,
            makeLeftRightDelim(
              'mopen',
              this.leftDelim,
              innerHeight,
              innerDepth,
              innerContext
            )
          ),
          inner,
          this.bind(
            context,
            makeLeftRightDelim(
              'mclose',
              this.rightDelim,
              innerHeight,
              innerDepth,
              innerContext
            )
          ),
        ],
        { type: 'mord' }
      )
    );
    if (this.caret) result.caret = this.caret;

    return this.attachSupsub(context, { base: result });
  }

  toLatex(options: ToLatexOptions): string {
    let result = '\\begin{' + this.environmentName + '}';
    if (this.environmentName === 'array') {
      result += '{';
      if (this.colFormat !== undefined) {
        for (const format of this.colFormat) {
          if ('align' in format) {
            result += format.align;
          } else if ('separator' in format && format.separator === 'solid') {
            result += '|';
          } else if ('separator' in format && format.separator === 'dashed') {
            result += ':';
          }
        }
      }

      result += '}';
    }

    for (let row = 0; row < this.array.length; row++) {
      for (let col = 0; col < this.array[row].length; col++) {
        if (col > 0) result += ' & ';
        result = joinLatex([
          result,
          Atom.toLatex(this.array[row][col], options),
        ]);
      }

      // Adds a separator between rows (but not after the last row)
      if (row < this.array.length - 1) {
        result += ' \\\\ ';
      }
    }

    result += '\\end{' + this.environmentName + '}';

    return result;
  }

  getCell(row: number, col: number): Atom[] {
    return this.array[row][col];
  }

  setCell(_row: number, _column: number, _value: Atom[]): void {
    // @todo array
    console.assert(this.type === 'array' && Array.isArray(this.array));
    this.isDirty = true;
  }

  addRowBefore(_row: number): void {
    console.assert(this.type === 'array' && Array.isArray(this.array));
    // @todo array
    this.isDirty = true;
  }

  addRowAfter(_row: number): void {
    console.assert(this.type === 'array' && Array.isArray(this.array));
    // @todo array
    this.isDirty = true;
  }

  addColumnBefore(_col: number): void {
    console.assert(this.type === 'array' && Array.isArray(this.array));
    this.isDirty = true;
  }

  addColumnAfter(_col: number): void {
    console.assert(this.type === 'array' && Array.isArray(this.array));
    // @todo array
    this.isDirty = true;
  }

  get cells(): Atom[][] {
    const result = [];
    this.array.forEach((row) => {
      row.forEach((cell) => {
        cell.forEach((x) => {
          result.push(x);
        });
      });
    });
    return result;
  }
}
/**
 * Create a column separator span.
 *
 */
function makeColGap(width: number): Span {
  const separator = new Span(null, { classes: 'arraycolsep' });
  separator.width = width;
  return separator;
}

/**
 * Create a column of repeating elements.
 */
function makeColOfRepeatingElements(
  context: Context,
  rows: ArrayRow[],
  offset: number,
  element: Atom[]
): Span {
  const col: StackElementAndShift[] = [];
  for (const row of rows) {
    const cell = Atom.render(context, element, { newList: true });
    cell.depth = row.depth;
    cell.height = row.height;
    col.push({ span: cell, shift: row.pos - offset });
  }

  return new Stack({ individualShift: col }).wrap(context);
}
