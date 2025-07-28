import type {
  MathstyleName,
  Dimension,
  Environment,
  ParseMode,
} from '../public/core-types';

import { Atom, isCellBranch, isNamedBranch } from '../core/atom-class';
import { Box } from '../core/box';
import { VBox, VBoxElementAndShift } from '../core/v-box';
import { makeLeftRightDelim } from '../core/delimiters';
import { Context } from '../core/context';
import { joinLatex } from '../core/tokenizer';
import { AXIS_HEIGHT, BASELINE_SKIP } from '../core/font-metrics';
import { convertDimensionToEm } from '../core/registers-utils';

import { PlaceholderAtom } from './placeholder';
import { isMatrixEnvironment } from '../latex-commands/environment-types';
import type { AtomJson, Branch, ToLatexOptions } from 'core/types';

export type ColumnFormat =
  | {
      // A regular content column, with the specified alignment.
      // 'm' is a special alignment for multline: left on first row, right on last
      // row, centered otherwise
      align: 'l' | 'c' | 'r' | 'm';
    }
  | {
      // The width of a gap between columns, or a LaTeX expression between columns
      gap: number | Readonly<Atom[]>;
    }
  | {
      // A rule (line) separating columns
      separator: 'solid' | 'dashed';
    };

export type ColSeparationType =
  // | 'align'
  // | 'alignat'
  // | 'gather'
  | 'small'
  // | 'CD'
  | undefined;

export type ArrayAtomConstructorOptions = {
  isRoot?: boolean;

  mathstyleName?: MathstyleName;

  colSeparationType?: ColSeparationType;
  leftDelim?: string;
  rightDelim?: string;
  // A multiplication factor applied to the spacing between rows and columns
  arraystretch?: number;
  // The spacing between columns
  arraycolsep?: number;

  columns?: ColumnFormat[];
  minColumns?: number;
  maxColumns?: number;
  minRows?: number;
  maxRows?: number;

  displayEquationNumber?: boolean;

  classes?: string[];
};

type ArrayRow = {
  cells: Box[];
  height: number;
  depth: number;
  pos: number;
};

/**
 * Normalize cells:
 * - ensure the array of cells is dense (not sparse)
 * - fold rows that overflow (longer than maximum number of columns)
 * - ensure each cell begins with a `first` atom
 * - ensure the minimum/maximum number of cells is respected
 * - remove last row if empty (TeX behavior)
 */

function normalizeCells(
  atom: ArrayAtom,
  cells: ReadonlyArray<Atom>[][],
  options: {
    columns: Readonly<ColumnFormat[]>;
    minColumns: number;
    minRows: number;
    maxRows: number;
  }
): Readonly<Atom[]>[][] {
  //
  // 1/
  // - Fold the array so that there are no more columns of content than
  // there are columns prescribed by the column format.
  // - Fill rows that have fewer cells than expected with empty cells
  // - Ensure that all the cells have a `first` atom.
  //

  // The number of column is determined by the colFormat
  let maxColCount = 0;
  for (const colSpec of options.columns)
    if ('align' in colSpec) maxColCount += 1;
  maxColCount = Math.max(maxColCount, options.minColumns);

  // Actual number of columns (at most `maxColCount`)
  let colCount = 0;
  const rows: ReadonlyArray<Atom>[][] = [];

  for (const row of cells) {
    colCount = Math.max(colCount, Math.min(row.length, maxColCount));
    let colIndex = 0;
    while (colIndex < row.length) {
      const newRow: ReadonlyArray<Atom>[] = [];
      const lastCol = Math.min(row.length, colIndex + maxColCount);
      while (colIndex < lastCol) {
        newRow.push(normalizeCell(row[colIndex], atom.mode));
        colIndex += 1;
      }

      if (newRow.length < options.minColumns) {
        while (newRow.length < options.minColumns)
          newRow.push([new Atom({ type: 'first', mode: atom.mode })]);
      }

      rows.push(newRow);
    }
  }

  //
  // 2/ If the last row is empty, ignore it (TeX behavior)
  // (unless there's only one row)
  //
  if (
    !atom.isMultiline &&
    rows.length > 0 &&
    rows[rows.length - 1].length === 1 &&
    isEmptyCell(rows[rows.length - 1][0])
  )
    rows.pop();

  //
  // 3/ Fill out any missing cells
  //
  const result: Readonly<Atom[]>[][] = [];
  for (const row of rows) {
    if (row.length !== colCount) {
      for (let i = row.length; i < colCount; i++) {
        if (atom.isMultiline) {
          row.push([new Atom({ type: 'first', mode: atom.mode })]);
        } else {
          row.push([
            new Atom({ type: 'first', mode: atom.mode }),
            new PlaceholderAtom(),
          ]);
        }
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
        element.parentBranch = [rowIndex, colIndex];
      }
      colIndex += 1;
    }
    rowIndex += 1;
  }

  atom.isDirty = true;

  return result;
}

function normalizeCell(
  cell: ReadonlyArray<Atom>,
  mode: ParseMode
): ReadonlyArray<Atom> {
  if (cell.length === 0) return [new Atom({ type: 'first', mode })];
  if (cell[0].type !== 'first')
    return [new Atom({ type: 'first', mode }), ...cell];
  console.assert(!cell.slice(1).some((x) => x.type === 'first'));
  return cell;
}

function isEmptyCell(cell: ReadonlyArray<Atom>): boolean {
  return cell.length === 1 && cell[0].type === 'first';
}

// See http://ctan.math.utah.edu/ctan/tex-archive/macros/latex/base/lttab.dtx
export class ArrayAtom extends Atom {
  environmentName: Environment;

  /** True if the environment is multiline. In a multiline environment,
   * pressing return automatically creates a new row. In non-multiline
   * environments, pressing alt+return creates a new row.
   */
  get isMultiline(): boolean {
    const env = this.environmentName;
    return [
      'lines',
      'multline',
      'multline*',
      'align',
      'split',
      'gather',
      'gathered',
    ].includes(env);
  }

  // The array is a 2D array of cells, each cell being an array of atoms
  private _rows: (undefined | Readonly<Atom[]>)[][];

  rowGaps: Readonly<Dimension[]>;
  arraystretch?: number;
  arraycolsep?: number;
  colSeparationType?: ColSeparationType;
  leftDelim?: string;
  rightDelim?: string;
  mathstyleName?: MathstyleName;

  colFormat: Readonly<ColumnFormat[]>;
  minColumns: number;
  minRows: number;
  maxRows: number;

  // Additional classes when rendering the array
  classes: string[];

  constructor(
    envName: Environment,
    array: Readonly<Atom[]>[][],
    rowGaps: Readonly<Dimension[]>,
    options: Readonly<ArrayAtomConstructorOptions> = {}
  ) {
    super({ type: 'array', isRoot: options.isRoot });
    this.environmentName = envName;

    if (options.columns) {
      if (options.columns.length === 0) this.colFormat = [{ align: 'l' }];
      else this.colFormat = [...options.columns];
    } else {
      if (options.minColumns) {
        // Repeat {align: 'l'} as many times as minColumns
        const columns: ColumnFormat[] = [];
        for (let i = 0; i < options.minColumns; i++)
          columns.push({ align: 'l' });
        this.colFormat = columns;
      } else {
        // In TeX definition, if no columns are specified, a maximum of
        // 10 left-aligned columns is assumed

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
    }

    this.minColumns = options.minColumns ?? 1;
    this.minRows = options.minRows ?? 1;
    this.maxRows = options.maxRows ?? Infinity;

    this._rows = normalizeCells(this, array, {
      columns: this.colFormat,
      minColumns: this.minColumns,
      minRows: this.minRows,
      maxRows: this.maxRows,
    });

    this.rowGaps = rowGaps;

    if (options.arraycolsep !== undefined)
      this.arraycolsep = options.arraycolsep;
    this.colSeparationType = options.colSeparationType;
    // Default \arraystretch from lttab.dtx
    if (options.arraystretch !== undefined)
      this.arraystretch = options.arraystretch;

    if (options.mathstyleName) this.mathstyleName = options.mathstyleName;
    if (options.leftDelim) this.leftDelim = options.leftDelim;
    if (options.rightDelim) this.rightDelim = options.rightDelim;

    this.classes = options.classes ?? [];
  }

  static fromJson(json: AtomJson): ArrayAtom {
    return new ArrayAtom(
      json.environmentName,
      json.array,
      json.rowGaps,
      json as any
    );
  }

  toJson(): AtomJson {
    const result: AtomJson = {
      ...super.toJson(),
      environmentName: this.environmentName,
      array: this._rows.map((row) =>
        row.map((col) => col!.map((x) => x.toJson()))
      ),
      rowGaps: this.rowGaps,
      columns: this.colFormat,
      colSeparationType: this.colSeparationType,
      minColumns: this.minColumns,
      minRows: this.minRows,
      maxRows: this.maxRows,
    };

    if (this.arraystretch !== undefined)
      result.arraystretch = this.arraystretch;
    if (this.arraycolsep !== undefined) result.arraycolsep = this.arraycolsep;
    if (this.leftDelim) result.leftDelim = this.leftDelim;
    if (this.rightDelim) result.rightDelim = this.rightDelim;
    if (this.isRoot) result.isRoot = true;
    result.minColumns = this.minColumns;
    result.minRows = this.minRows;
    result.maxRows = this.maxRows;
    if (this.mathstyleName) result.mathstyleName = this.mathstyleName;
    if (this.classes.length > 0) result.classes = this.classes;

    return result;
  }

  branch(cell: Branch): Readonly<Atom[]> | undefined {
    if (!isCellBranch(cell)) return undefined;
    return this._rows[cell[0]][cell[1]] ?? undefined;
  }

  createBranch(cell: Branch): Atom[] {
    if (!isCellBranch(cell)) return [];
    this.isDirty = true;
    return (this.branch(cell) as Atom[]) ?? [];
  }

  get rowCount(): number {
    return this._rows.length;
  }

  get colCount(): number {
    return this._rows[0].length;
  }

  get maxColumns(): number {
    return this.colFormat.filter((col) => Boolean(col['align'])).length;
  }

  removeBranch(name: Branch): Readonly<Atom[]> {
    if (isNamedBranch(name)) return super.removeBranch(name);

    const [_first, ...children] = this.branch(name)!;
    // Drop the 'first' element
    console.assert(_first.type === 'first');

    this._rows[name[0]][name[1]] = undefined;
    children.forEach((x) => {
      x.parent = undefined;
      x.parentBranch = undefined;
    });

    this.isDirty = true;
    return children;
  }

  get hasChildren(): boolean {
    return this.children.length > 0;
  }

  get children(): Readonly<Atom[]> {
    const result: Atom[] = [];
    for (const row of this._rows) {
      for (const cell of row) {
        if (cell) {
          for (const atom of cell) {
            result.push(...atom.children);
            result.push(atom);
          }
        }
      }
    }
    return [...result, ...super.children];
  }

  render(context: Context): Box | null {
    // See http://tug.ctan.org/macros/latex/base/ltfsstrc.dtx
    // and http://tug.ctan.org/macros/latex/base/lttab.dtx

    const innerContext = new Context(
      { parent: context, mathstyle: this.mathstyleName },
      this.style
    );

    const arrayRuleWidth = innerContext.getRegisterAsEm('arrayrulewidth');
    const arrayColSep = innerContext.getRegisterAsEm('arraycolsep');
    const doubleRuleSep = innerContext.getRegisterAsEm('doublerulesep');

    // Row spacing
    const arraystretch =
      this.arraystretch ??
      innerContext.getRegisterAsNumber('arraystretch') ??
      1.0;
    let arraycolsep =
      typeof this.arraycolsep === 'number' ? this.arraycolsep : arrayColSep;
    if (this.colSeparationType === 'small') {
      // We're in a {smallmatrix}. Default column space is \thickspace,
      // i.e. 5/18em = 0.2778em, per amsmath.dtx for {smallmatrix}.
      // But that needs adjustment because LaTeX applies \scriptstyle to the
      // entire array, including the colspace, but this function applies
      // \scriptstyle only inside each element.
      const localMultiplier = new Context({
        parent: context,
        mathstyle: 'scriptstyle',
      }).scalingFactor;
      arraycolsep = 0.2778 * (localMultiplier / context.scalingFactor);
    }
    const arrayskip = arraystretch * BASELINE_SKIP;
    const arstrutHeight = 0.7 * arrayskip;
    const arstrutDepth = 0.3 * arrayskip; // \@arstrutbox in lttab.dtx
    let totalHeight = 0;
    const body: ArrayRow[] = [];
    let nc = 0;
    const nr = this._rows.length;
    for (let r = 0; r < nr; ++r) {
      const inrow = this._rows[r];
      nc = Math.max(nc, inrow.length);
      // The "inner" is in mathstyleName. Create a **new** context for the
      // cells, with the same mathstyleName, but this will prevent the
      // style correction from being applied twice
      const cellContext = new Context(
        { parent: innerContext, mathstyle: this.mathstyleName },
        this.style
      );
      let height = arstrutHeight / cellContext.scalingFactor; // \@array adds an \@arstrut
      let depth = arstrutDepth / cellContext.scalingFactor; // To each row (via the template)
      const outrow: ArrayRow = { cells: [], height: 0, depth: 0, pos: 0 };
      for (const element of inrow) {
        const elt =
          Atom.createBox(cellContext, element, { type: 'ignore' }) ??
          new Box(null, { type: 'ignore' });
        depth = Math.max(depth, elt.depth);
        height = Math.max(height, elt.height);
        outrow.cells.push(elt);
      }

      let gap: number = convertDimensionToEm(this.rowGaps[r]) ?? 0;
      if (gap > 0) {
        // \@argarraycr
        gap += arstrutDepth;
        depth = Math.max(depth, gap); // \@xargarraycr

        gap = 0;
      }

      // If not last row, add 'jot' of depth
      // This does not apply to matrix environments, and cases.
      // It *does* appear to apply to `dcases` and `rcases` environments
      if (
        r < nr - 1 &&
        !isMatrixEnvironment(this.environmentName) &&
        this.environmentName !== 'cases' &&
        this.environmentName !== 'array'
      )
        depth += innerContext.getRegisterAsEm('jot');

      outrow.height = height;
      outrow.depth = depth;
      totalHeight += height;
      outrow.pos = totalHeight;
      totalHeight += depth + gap; // \@yargarraycr
      body.push(outrow);
    }

    const offset = totalHeight / 2 + AXIS_HEIGHT;
    const contentCols: Box[] = [];
    for (let colIndex = 0; colIndex < nc; colIndex++) {
      const stack: VBoxElementAndShift[] = [];
      for (const row of body) {
        const element = row.cells[colIndex];
        if (element) {
          element.depth = row.depth;
          element.height = row.height;

          stack.push({ box: element, shift: row.pos - offset });
        }
      }

      if (stack.length > 0)
        contentCols.push(new VBox({ individualShift: stack }));
    }

    // Iterate over each column description.
    // Each `colDesc` will indicate whether to insert a gap, a rule or
    // a column from 'contentCols'
    const cols: Box[] = [];
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
          new Box(contentCols[currentContentCol], {
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
          const col = makeColOfRepeatingElements(
            context,
            body,
            offset,
            colDesc.gap
          );
          if (col) cols.push(col);
        }

        previousColContent = false;
        previousColRule = false;
        firstColumn = false;
      } else if ('separator' in colDesc) {
        //
        // It's a column separator.
        //

        const separator = new Box(null, { classes: 'ML__vertical-separator' });
        separator.height = totalHeight;
        separator.setStyle('height', totalHeight, 'em');
        separator.setStyle(
          'border-right',
          `${arrayRuleWidth}em ${colDesc.separator} currentColor`
        );
        // We have box-sizing border-box, no need to correct the margin
        // separator.setStyle(
        //   'margin',
        //   `0 -${context.metrics.arrayRuleWidth / 2}em`
        // );
        separator.setStyle('vertical-align', -(totalHeight - offset), 'em');
        let gap = 0;
        if (previousColRule) gap = doubleRuleSep - arrayRuleWidth;
        else if (previousColContent) gap = arraycolsep - arrayRuleWidth;

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

    const inner = new Box(cols, {
      classes: ['ML__mtable', ...this.classes].join(' '),
    });

    if (
      (!this.leftDelim || this.leftDelim === '.') &&
      (!this.rightDelim || this.rightDelim === '.')
    ) {
      // There are no delimiters around the array, just return what
      // we've built so far.
      if (this.caret) inner.caret = this.caret;
      return this.bind(context, inner);
    }

    // There is at least one delimiter. Wrap the inner of the array with
    // appropriate left and right delimiters
    const innerHeight = inner.height;
    const innerDepth = inner.depth;
    const base = this.bind(
      context,
      new Box(
        [
          this.bind(
            context,
            makeLeftRightDelim(
              'open',
              this.leftDelim ?? '.',
              innerHeight,
              innerDepth,
              innerContext,
              { isSelected: this.isSelected }
            )
          ),
          inner,
          this.bind(
            context,
            makeLeftRightDelim(
              'close',
              this.rightDelim ?? '.',
              innerHeight,
              innerDepth,
              innerContext,
              { isSelected: this.isSelected }
            )
          ),
        ],
        { type: 'ord' }
      )
    );
    if (!base) return null;

    base.setStyle('display', 'inline-block');
    if (this.caret) base.caret = this.caret;

    return this.bind(context, this.attachSupsub(context, { base: base }));
  }

  _serialize(options: ToLatexOptions): string {
    const result: string[] = [];

    if (this.environmentName === 'lines') result.push(`\\displaylines{`);
    else result.push(`\\begin{${this.environmentName}}`);

    if (this.environmentName === 'array') {
      result.push('{');
      if (this.colFormat !== undefined) {
        for (const format of this.colFormat) {
          if ('align' in format && typeof format.align === 'string')
            result.push(format.align);
          else if ('separator' in format && format.separator === 'solid')
            result.push('|');
          else if ('separator' in format && format.separator === 'dashed')
            result.push(':');
        }
      }

      result.push('}');
    }

    for (let row = 0; row < this._rows.length; row++) {
      for (let col = 0; col < this._rows[row].length; col++) {
        if (col > 0) result.push(' & ');
        result.push(Atom.serialize(this._rows[row][col], options));
      }

      // Adds a separator between rows (but not after the last row)
      if (row < this._rows.length - 1) {
        const gap = this.rowGaps[row];
        if (gap?.dimension)
          result.push(`\\\\[${gap.dimension} ${gap.unit ?? 'pt'}] `);
        else result.push('\\\\ ');
      }
    }

    if (this.environmentName === 'lines') result.push(`}`);
    else result.push(`\\end{${this.environmentName}}`);

    return joinLatex(result);
  }

  forEachCell(
    callback: (cell: Readonly<Atom[]>, row: number, col: number) => void
  ): void {
    for (let i = 0; i < this.rowCount; i++)
      for (let j = 0; j < this.colCount; j++) callback(this._rows[i][j]!, i, j);
  }

  getCell(row: number, col: number): Readonly<Atom[]> | undefined {
    return this._rows[row]?.[col];
  }

  setCell(row: number, column: number, value: Readonly<Atom[]>): void {
    console.assert(
      this.type === 'array' &&
        Array.isArray(this._rows) &&
        this._rows[row][column] !== undefined
    );
    for (const atom of this._rows[row][column]!) {
      atom.parent = undefined;
      atom.parentBranch = undefined;
    }

    const atoms = [
      new Atom({ type: 'first', mode: this.mode }),
      ...value.filter((x) => x.type !== 'first'),
    ];

    this._rows[row][column] = atoms;

    adjustBranches(this);

    this.isDirty = true;
  }

  addRowBefore(row: number): void {
    console.assert(this.type === 'array' && Array.isArray(this._rows));

    this._rows.splice(
      row,
      0,
      Array.from({ length: this.colCount }, () =>
        makeEmptyCell(this, !this.isMultiline)
      )
    );
    adjustBranches(this);
    this.isDirty = true;
  }

  addRowAfter(row: number): void {
    console.assert(this.type === 'array' && Array.isArray(this._rows));

    this._rows.splice(
      row + 1,
      0,
      Array.from({ length: this.colCount }, () =>
        makeEmptyCell(this, !this.isMultiline)
      )
    );

    adjustBranches(this);
    this.isDirty = true;
  }

  removeRow(row: number): void {
    console.assert(
      this.type === 'array' && Array.isArray(this._rows) && this.rowCount > row
    );

    const deleted = this._rows.splice(row, 1);
    for (const column of deleted) {
      for (const cell of column) {
        if (cell) {
          for (const child of cell) {
            child.parent = undefined;
            child.parentBranch = undefined;
          }
        }
      }
    }

    adjustBranches(this);
    this.isDirty = true;
  }

  addColumnBefore(col: number): void {
    console.assert(this.type === 'array' && Array.isArray(this._rows));
    for (const row of this._rows) row.splice(col, 0, makeEmptyCell(this));

    adjustBranches(this);
    this.isDirty = true;
  }

  addColumnAfter(col: number): void {
    console.assert(this.type === 'array' && Array.isArray(this._rows));
    for (const row of this._rows) row.splice(col + 1, 0, makeEmptyCell(this));

    adjustBranches(this);
    this.isDirty = true;
  }

  addColumn(): void {
    this.addColumnAfter(this.colCount - 1);
  }

  removeColumn(col: number): void {
    console.assert(
      this.type === 'array' && Array.isArray(this._rows) && this.colCount > col
    );
    for (const row of this._rows) {
      const deleted = row.splice(col, 1);
      for (const cell of deleted) {
        if (cell) {
          for (const child of cell) {
            child.parent = undefined;
            child.parentBranch = undefined;
          }
        }
      }
    }
    adjustBranches(this);
    this.isDirty = true;
  }

  get cells(): Readonly<Atom[]>[] {
    const result: Readonly<Atom[]>[] = [];
    for (const row of this._rows) {
      for (const cell of row)
        if (cell) result.push(cell.filter((x) => x.type !== 'first'));
    }
    return result;
  }

  get rows(): (undefined | Readonly<Atom[]>)[][] {
    return this._rows!;
  }
}

/**
 * Create an empty cell
 */
function makeEmptyCell(
  parent: ArrayAtom,
  withPlaceholder = false
): Readonly<Atom[]> {
  const first = new Atom({ type: 'first', mode: parent.mode });
  first.parent = parent;
  let result = [first];
  if (withPlaceholder) {
    const placeholder = new PlaceholderAtom();
    placeholder.parent = parent;
    result.push(placeholder);
  }
  return result;
}

function adjustBranches(array: ArrayAtom): void {
  for (let i = 0; i < array.rowCount; i++) {
    for (let j = 0; j < array.colCount; j++) {
      const atoms = array.getCell(i, j);
      if (atoms)
        for (const atom of atoms) {
          if (atom) {
            atom.parent = array;
            atom.parentBranch = [i, j];
          }
        }
    }
  }
}

function adjustCellBranch(cell: ReadonlyArray<Atom>, row: number, col: number) {
  for (const atom of cell) atom.parentBranch = [row, col];
}

/**
 * Create a column separator box.
 */
function makeColGap(width: number): Box {
  const result = new Box(null, { classes: 'ML__arraycolsep' });
  result.width = width;
  return result;
}

/**
 * Create a column of repeating elements.
 */
function makeColOfRepeatingElements(
  context: Context,
  rows: ArrayRow[],
  offset: number,
  element: Readonly<Atom[]> | undefined
): Box | null {
  if (!element) return null;
  const col: VBoxElementAndShift[] = [];
  for (const row of rows) {
    const cell = Atom.createBox(context, element, { type: 'ignore' });
    if (cell) {
      cell.depth = row.depth;
      cell.height = row.height;
      col.push({ box: cell, shift: row.pos - offset });
    }
  }

  return new VBox({ individualShift: col }).wrap(context);
}
