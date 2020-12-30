import {
  Atom,
  Branch,
  isColRowBranch,
  isNamedBranch,
  ToLatexOptions,
} from '../core/atom-class';
import {
  makeVlist,
  depth as spanDepth,
  height as spanHeight,
  Span,
} from '../core/span';
import { METRICS as FONTMETRICS } from '../core/font-metrics';
import { makeLeftRightDelim } from '../core/delimiters';
import { MathStyleName, MATHSTYLES } from '../core/mathstyle';
import { Context } from '../core/context';
import { joinLatex } from '../core/tokenizer';

export type Colspec = {
  gap?: number | Atom[];
  // 'm' is a special alignement for multline: left on first row, right on last
  // row, centered otherwise
  align?: 'l' | 'c' | 'r' | 'm';
  rule?: boolean;
};

export type ArrayAtomConstructorOptions = {
  // Params: FunctionArgumentDefiniton[];
  // parser: ParseFunction;
  mathStyleName?: MathStyleName;
  colFormat?: Colspec[];
  leftDelim?: string;
  rightDelim?: string;
  jot?: number; // Jot is an extra gap between lines of numbered equation.
  // It's 3pt by default in LaTeX (ltmath.dtx:181)
  arraystretch?: number;
  arraycolsep?: number;
};

type ArrayRow = {
  cells: Span[][];
  height: number;
  depth: number;
  pos: number;
};

export class ArrayAtom extends Atom {
  array: Atom[][][];
  environmentName: string;
  rowGaps: number[];
  colFormat: Colspec[];
  arraystretch?: number;
  arraycolsep?: number;
  jot?: number;
  leftDelim?: string;
  rightDelim?: string;
  mathStyleName?: MathStyleName;

  constructor(
    envName: string,
    array: Atom[][][],
    rowGaps: number[],
    options: ArrayAtomConstructorOptions = {}
  ) {
    super('array');
    this.environmentName = envName;
    // The array could be sparse, desparsify-it.
    // Each cell need to be inserted (with a 'first' atom)
    // @todo
    this.array = array;
    this.rowGaps = rowGaps;
    if (options.mathStyleName) this.mathStyleName = options.mathStyleName;
    if (options.colFormat) this.colFormat = options.colFormat;
    if (this.colFormat && this.colFormat.length === 0) {
      this.colFormat = [{ align: 'l' }];
    }

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

    if (options.leftDelim) this.leftDelim = options.leftDelim;
    if (options.rightDelim) this.rightDelim = options.rightDelim;
    if (options.jot) this.jot = options.jot;
    if (options.arraycolsep) this.arraycolsep = options.arraycolsep;
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

  render(context: Context): Span[] | null {
    // See http://tug.ctan.org/macros/latex/base/ltfsstrc.dtx
    // and http://tug.ctan.org/macros/latex/base/lttab.dtx
    const { colFormat } = this;
    // Fold the array so that there are no more columns of content than
    // there are columns prescribed by the column format.
    const array = [];
    let colMax = 0; // Maximum number of columns of content
    for (const colSpec of colFormat) {
      if (colSpec.align) colMax++;
    }

    for (const row of this.array) {
      let colIndex = 0;
      while (colIndex < row.length) {
        const newRow = [];
        const lastCol = Math.min(row.length, colIndex + colMax);
        while (colIndex < lastCol) {
          newRow.push(row[colIndex++]);
        }

        array.push(newRow);
      }
    }

    // If the last row is empty, ignore it.
    if (
      array[array.length - 1].length === 1 &&
      array[array.length - 1][0].length === 0
    ) {
      array.pop();
    }

    const mathstyle = this.mathStyleName
      ? MATHSTYLES[this.mathStyleName]
      : context.mathstyle;
    // Row spacing
    // Default \arraystretch from lttab.dtx
    const arraystretch = this.arraystretch || 1;
    const arraycolsep =
      typeof this.arraycolsep === 'number'
        ? this.arraycolsep
        : FONTMETRICS.arraycolsep;
    const arrayskip = arraystretch * FONTMETRICS.baselineskip;
    const arstrutHeight = 0.7 * arrayskip;
    const arstrutDepth = 0.3 * arrayskip; // \@arstrutbox in lttab.dtx
    let totalHeight = 0;
    let nc = 0;
    const body = [];
    const nr = array.length;
    for (let r = 0; r < nr; ++r) {
      const inrow = array[r];
      nc = Math.max(nc, inrow.length);
      let height = arstrutHeight; // \@array adds an \@arstrut
      let depth = arstrutDepth; // To each row (via the template)
      const outrow: ArrayRow = { cells: [], height: 0, depth: 0, pos: 0 };
      for (const element of inrow) {
        const localContext = context.clone({
          mathstyle: MATHSTYLES[this.mathStyleName],
        });
        const cell = Atom.render(localContext, element) || [];
        const elt = [new Span(null, '', 'mord')].concat(cell);
        depth = Math.max(depth, spanDepth(elt));
        height = Math.max(height, spanHeight(elt));
        outrow.cells.push(elt);
      }

      let jot = r === nr - 1 ? 0 : this.jot || 0;
      if (this.rowGaps?.[r]) {
        jot = this.rowGaps[r];
        if (jot > 0) {
          // \@argarraycr
          jot += arstrutDepth;
          if (depth < jot) {
            depth = jot; // \@xargarraycr
          }

          jot = 0;
        }
      }

      outrow.height = height;
      outrow.depth = depth;
      totalHeight += height;
      outrow.pos = totalHeight;
      totalHeight += depth + jot; // \@yargarraycr
      body.push(outrow);
    }

    const offset = totalHeight / 2 + mathstyle.metrics.axisHeight;
    const contentCols = [];
    for (let colIndex = 0; colIndex < nc; colIndex++) {
      const col = [];
      for (const row of body) {
        const element = row.cells[colIndex];
        if (!element) {
          continue;
        }

        element.depth = row.depth;
        element.height = row.height;

        col.push(element);
        col.push(row.pos - offset);
      }

      if (col.length > 0) {
        contentCols.push(makeVlist(context, col, 'individualShift'));
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
    for (const colDesc of colFormat) {
      if (colDesc.align && currentContentCol >= contentCols.length) {
        break;
      } else if (colDesc.align && currentContentCol < contentCols.length) {
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
          new Span(contentCols[currentContentCol], 'col-align-' + colDesc.align)
        );
        currentContentCol++;
        previousColContent = true;
        previousColRule = false;
        firstColumn = false;
      } else if (colDesc.gap !== undefined) {
        // Something to insert in between columns of content
        if (typeof colDesc.gap === 'number') {
          // It's a number, indicating how much space, in em,
          // to leave in between columns
          cols.push(makeColGap(colDesc.gap));
        } else {
          // It's a mathlist
          // Create a column made up of the mathlist
          // as many times as there are rows.
          cols.push(
            makeColOfRepeatingElements(context, body, offset, colDesc.gap)
          );
        }

        previousColContent = false;
        previousColRule = false;
        firstColumn = false;
      } else if (colDesc.rule) {
        // It's a rule.
        const separator = new Span(null, 'vertical-separator');
        separator.setStyle('height', totalHeight, 'em');
        // Result.setTop((1 - context.mathstyle.sizeMultiplier) *
        //     context.mathstyle.metrics.axisHeight);
        separator.setStyle(
          'margin-top',
          3 * context.mathstyle.metrics.axisHeight - offset,
          'em'
        );
        separator.setStyle('vertical-align', 'top');
        // Separator.setStyle('display', 'inline-block');
        let gap = 0;
        if (previousColRule) {
          gap = FONTMETRICS.doubleRuleSep - FONTMETRICS.arrayrulewidth;
        } else if (previousColContent) {
          gap = arraycolsep - FONTMETRICS.arrayrulewidth;
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

    if (
      (!this.leftDelim || this.leftDelim === '.') &&
      (!this.rightDelim || this.rightDelim === '.')
    ) {
      // There are no delimiters around the array, just return what
      // we've built so far.
      return [new Span(cols, 'mtable', 'mord')];
    }

    // There is at least one delimiter. Wrap the core of the array with
    // appropriate left and right delimiters
    // const inner = new Span(new Span(cols, 'mtable'), 'mord');
    const inner = new Span(cols, 'mtable');
    const innerHeight = spanHeight(inner);
    const innerDepth = spanDepth(inner);
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
              context
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
              context
            )
          ),
        ],
        '',
        'mord'
      )
    );
    if (this.caret) result.caret = this.caret;

    return [this.attachSupsub(context, result, result.type)];
  }

  toLatex(options: ToLatexOptions): string {
    let result = '\\begin{' + this.environmentName + '}';
    if (this.environmentName === 'array') {
      result += '{';
      if (this.colFormat !== undefined) {
        for (let i = 0; i < this.colFormat.length; i++) {
          if (this.colFormat[i].align) {
            result += this.colFormat[i].align;
          } else if (this.colFormat[i].rule) {
            result += '|';
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
  const separator = new Span('\u200B', 'arraycolsep');
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
  const col = [];
  for (const row of rows) {
    const cell = new Span(Atom.render(context, element));
    cell.depth = row.depth;
    cell.height = row.height;
    col.push(cell);
    col.push(row.pos - offset);
  }

  return makeVlist(context, col, 'individualShift');
}
