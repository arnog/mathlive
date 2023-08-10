import { ArrayAtom } from '../core-atoms/array';
import { LeftRightAtom } from '../core-atoms/leftright';
import { PlaceholderAtom } from '../core-atoms/placeholder';
import { makeEnvironment } from '../core-definitions/environments';
import { Atom } from '../core/atom';
import { register as registerCommand } from '../editor/commands';
import { Environment, TabularEnvironment } from '../public/core-types';
import { arrayCell, arrayIndex } from './array-utils';
import { contentDidChange, contentWillChange } from './listeners';

import type { ModelPrivate } from './model-private';
import type { Style } from '../public/core-types';
export * from './array-utils';

/**
 * Join all the cells at the indicated row into a single list of atoms
 */
export function arrayJoinColumns(
  row: Atom[][],
  separator = ',',
  style?: Style
): Atom[] {
  if (!row) return [];
  const result: Atom[] = [new Atom({ type: 'first' })];
  let sep: Atom | null = null;
  for (let cell of row) {
    // Remove the 'first' atom, if present
    if (cell?.length > 0 && cell[0].type === 'first') cell = cell.slice(1);

    if (cell?.length > 0) {
      if (sep) result.push(sep);
      else sep = new Atom({ type: 'mpunct', value: separator, style });

      result.push(...cell);
    }
  }

  return result;
}

/**
 * Join all the rows into a single atom list
 */
export function arrayJoinRows(
  array: Atom[][][],
  separators = [';', ','],
  style?: Style
): Atom[] {
  const result: Atom[] = [new Atom({ type: 'first' })];
  let sep: Atom | null = null;
  for (const row of array) {
    if (sep) result.push(sep);
    else sep = new Atom({ type: 'mpunct', value: separators[0], style });

    result.push(...arrayJoinColumns(row, separators[1]));
  }

  return result;
}

/**
 * Return the number of non-empty cells in that column
 */
export function arrayColumnCellCount(array: Atom[][][], col: number): number {
  let result = 0;
  const colRow = { col, row: 0 };
  while (colRow.row < array.length) {
    const cell = arrayCell(array, colRow);
    if (cell && cell.length > 0) {
      let cellLength = cell.length;
      if (cell[0].type === 'first') cellLength -= 1;
      if (cellLength > 0) result += 1;
    }

    colRow.row += 1;
  }

  return result;
}

/**
 * Remove the indicated column from the array
 */
export function arrayRemoveColumn(array: Atom[][][], col: number): void {
  let row = 0;
  while (row < array.length) {
    if (array[row][col]) array[row].splice(col, 1);

    row += 1;
  }
}

/**
 * Remove the indicated row from the array
 */
export function arrayRemoveRow(array: Atom[][][], row: number): void {
  array.splice(row, 1);
}

/**
 * Return the first non-empty cell, row by row
 */
export function arrayFirstCellByRow(array: Atom[][][]): string {
  const colRow = { col: 0, row: 0 };
  while (colRow.row < array.length && !arrayCell(array, colRow))
    colRow.row += 1;

  return arrayCell(array, colRow) ? `cell${arrayIndex(array, colRow)}` : '';
}

/**
 * If we're inside an array, return that parent array.
 *
 * Otherwise, consider creating an array based on the context (sibling atoms).
 *
 * If at root, create a `lines` environment.
 * If left sibling is `(` (or `\left( with matching \right))`) create a `pmatrix`
 * If left sibling is `[` create a `bmatrix`
 * If left sibling is { create a `cases`
 * If left sibling is \vert `vmatrix`
 * If left sibling is \Vert `Vmatrix`
 * If other \left\right create a matrix (inside the left-right)
 *
 * If inside a leftright, use the content of the leftright as the initial cell
 */
function parentArray(
  model: ModelPrivate,
  where: 'after row' | 'before row' | 'after column' | 'before column'
): [ArrayAtom | undefined, [row: number, col: number]] {
  let atom: Atom | undefined = model.at(model.position);

  while (atom && !(atom.parent instanceof ArrayAtom)) atom = atom.parent;

  //
  // Conversion:
  // if we are in an array, but the addition of cell is not compatible,
  // change the array type
  //
  //
  if (atom && atom.type === 'array') {
    const array = atom as ArrayAtom;
    if (array.environmentName === 'lines') {
      // Convert to `split` if adding columns
      // @todo
    }
  }

  //
  // If no array was found, try to create one
  //
  if (!atom || !(atom.parent instanceof ArrayAtom)) {
    const cursor = model.at(model.position);
    atom = cursor;

    //
    // 1/ Handle insertion at the root (when the root is not already an array)
    //
    if (!atom.parent!.parent) {
      let secondCell = model.extractAtoms([model.position, model.lastOffset]);
      let firstCell = model.extractAtoms([0, model.position]);
      if (firstCell.length === 0) firstCell = placeholderCell();
      if (secondCell.length === 0) secondCell = placeholderCell();
      let array: ArrayAtom;
      if (where.endsWith('column')) {
        array = makeEnvironment('split', [[firstCell, secondCell]]);
        model.root = array;
        if (isPlaceholderCell(array, 0, 0)) selectCell(model, array, 0, 0);
        else if (isPlaceholderCell(array, 0, 1)) selectCell(model, array, 0, 1);
        else model.position = model.offsetOf(cursor);
      } else {
        array = makeEnvironment('lines', [[firstCell], [secondCell]]);
        model.root = array;
        if (isPlaceholderCell(array, 0, 0)) selectCell(model, array, 0, 0);
        else if (isPlaceholderCell(array, 1, 0)) selectCell(model, array, 1, 0);
        else model.position = model.offsetOf(cursor);
      }

      // We've created the environment and the cells, no need to add a row/column, so return undefined
      return [undefined, [0, 0]];
    }

    //
    // 2/ Are we inside a \left...\right...?
    //
    if (atom.parent instanceof LeftRightAtom) {
      const parent = atom.parent;
      let secondCell = model.extractAtoms([
        model.position,
        model.offsetOf(parent.lastChild),
      ]);
      let firstCell = model.extractAtoms([
        model.offsetOf(parent.firstChild),
        model.position,
      ]);
      if (firstCell.length === 0) firstCell = placeholderCell();
      if (secondCell.length === 0) secondCell = placeholderCell();

      let envName: Environment = 'pmatrix';
      const lDelim = parent.leftDelim;
      const rDelim = parent.rightDelim;
      if (lDelim === '(' && (rDelim === ')' || rDelim === '?'))
        envName = 'pmatrix';
      else if (
        (lDelim === '[' || lDelim === '\\lbrack') &&
        (rDelim === ']' || rDelim === '\\rbrack' || rDelim === '?')
      )
        envName = 'bmatrix';
      else if (lDelim === '\\vert' && rDelim === '\\vert') envName = 'vmatrix';
      else if (lDelim === '\\Vert' && rDelim === '\\Vert') envName = 'Vmatrix';
      else if (
        (lDelim === '{' || lDelim === '\\lbrace') &&
        (rDelim === '.' || rDelim === '?')
      )
        envName = 'cases';

      const array = makeEnvironment(
        envName,
        where.endsWith('column')
          ? [[firstCell, secondCell]]
          : [[firstCell], [secondCell]]
      );

      parent.parent!.addChildBefore(array, parent);
      parent.parent!.removeChild(parent);
      if (isPlaceholderCell(array, 0, 0)) selectCell(model, array, 0, 0);
      else if (where.endsWith('column')) {
        if (isPlaceholderCell(array, 0, 1)) selectCell(model, array, 0, 1);
        else model.position = model.offsetOf(atom);
      } else {
        if (isPlaceholderCell(array, 1, 0)) selectCell(model, array, 1, 0);
        else model.position = model.offsetOf(atom);
      }

      return [undefined, [0, 0]];
    }
  }

  return atom && atom.parent instanceof ArrayAtom
    ? [atom.parent, atom.parentBranch! as [number, number]]
    : [undefined, [0, 0]];
}

function isPlaceholderCell(
  array: ArrayAtom,
  row: number,
  column: number
): boolean {
  // const pos = model.offsetOf(array.getCell(row, column)![1]);
  // return pos >= 0 && model.at(pos).type === 'placeholder';
  const cell = array.getCell(row, column);
  if (!cell || cell.length !== 2) return false;
  return cell[1].type === 'placeholder';
}

function cellRange(
  model: ModelPrivate,
  array: ArrayAtom,
  row: number,
  column: number
): [number, number] | number {
  const cell = array.getCell(row, column);
  if (!cell) return -1;
  return [model.offsetOf(cell[0]), model.offsetOf(cell[cell.length - 1])];
}

function selectCell(
  model: ModelPrivate,
  array: ArrayAtom,
  row: number,
  column: number
) {
  const range = cellRange(model, array, row, column);
  if (typeof range !== 'number') model.setSelection(range);
}

function setPositionInCell(
  model: ModelPrivate,
  array: ArrayAtom,
  row: number,
  column: number,
  pos: 'start' | 'end'
) {
  const cell = array.getCell(row, column);
  if (!cell) return;
  model.setPositionHandlingPlaceholder(
    model.offsetOf(cell[pos === 'start' ? 0 : cell.length - 1])
  );
}

/**
 * Internal primitive to add a column/row in an array.
 * Insert an array if necessary.
 */
function addCell(
  model: ModelPrivate,
  where: 'after row' | 'before row' | 'after column' | 'before column'
): void {
  const [arrayAtom, [row, column]] = parentArray(model, where);
  if (!arrayAtom) return;

  switch (where) {
    case 'after row':
      arrayAtom.addRowAfter(row);
      setPositionInCell(model, arrayAtom, row + 1, 0, 'end');
      break;

    case 'after column':
      if (arrayAtom.maxColumns <= arrayAtom.colCount) {
        model.announce('plonk');
        return;
      }
      arrayAtom.addColumnAfter(column);
      setPositionInCell(model, arrayAtom, row, column + 1, 'end');
      break;

    case 'before row':
      arrayAtom.addRowBefore(row);
      setPositionInCell(model, arrayAtom, row, 0, 'start');
      break;

    case 'before column':
      if (arrayAtom.maxColumns <= arrayAtom.colCount) {
        model.announce('plonk');
        return;
      }
      arrayAtom.addColumnBefore(column);
      setPositionInCell(model, arrayAtom, row, column, 'start');
      break;
  }
}

export function addRowAfter(model: ModelPrivate): boolean {
  if (!contentWillChange(model, { inputType: 'insertText' })) return false;
  addCell(model, 'after row');
  contentDidChange(model, { inputType: 'insertText' });
  return true;
}

export function addRowBefore(model: ModelPrivate): boolean {
  if (!contentWillChange(model, { inputType: 'insertText' })) return false;
  addCell(model, 'before row');
  contentDidChange(model, { inputType: 'insertText' });
  return true;
}

export function addColumnAfter(model: ModelPrivate): boolean {
  if (!contentWillChange(model, { inputType: 'insertText' })) return false;
  addCell(model, 'after column');
  contentDidChange(model, { inputType: 'insertText' });
  return true;
}

export function addColumnBefore(model: ModelPrivate): boolean {
  if (!contentWillChange(model, { inputType: 'insertText' })) return false;
  addCell(model, 'before column');
  contentDidChange(model, { inputType: 'insertText' });
  return true;
}

export function setEnvironment(
  model: ModelPrivate,
  environment: TabularEnvironment
): boolean {
  if (!contentWillChange(model, {})) return false;
  model.mathfield.snapshot();
  let leftDelim = '.';
  let rightDelim = '.';
  switch (environment) {
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
    case 'cases':
    case 'dcases':
      leftDelim = '\\lbrace';
      break;
    case 'rcases':
      rightDelim = '\\rbrace';
      break;
  }

  const arrayAtom = model.parentEnvironment!;
  arrayAtom.environmentName = environment;
  arrayAtom.leftDelim = leftDelim;
  arrayAtom.rightDelim = rightDelim;
  contentDidChange(model, {});
  return true;
}

/**
 * Internal primitive to remove a column/row in a matrix
 */
function removeCell(model: ModelPrivate, where: 'row' | 'column'): void {
  // This command is only applicable if we're in an ArrayAtom
  let atom = model.at(model.position);

  while (
    atom &&
    !(Array.isArray(atom.parentBranch) && atom.parent instanceof ArrayAtom)
  )
    atom = atom.parent!;

  if (Array.isArray(atom?.parentBranch) && atom?.parent instanceof ArrayAtom) {
    const arrayAtom = atom.parent;
    const treeBranch = atom.parentBranch;
    let pos: number | undefined;
    switch (where) {
      case 'row':
        if (arrayAtom.rowCount > 1) {
          arrayAtom.removeRow(treeBranch[0]);
          const cell = arrayAtom.getCell(
            Math.max(0, treeBranch[0] - 1),
            treeBranch[1]
          )!;
          pos = model.offsetOf(cell[cell.length - 1]);
        }
        break;

      case 'column':
        if (arrayAtom.colCount > arrayAtom.minColumns) {
          arrayAtom.removeColumn(treeBranch[1]);
          const cell = arrayAtom.getCell(
            treeBranch[0],
            Math.max(0, treeBranch[1] - 1)
          )!;
          pos = model.offsetOf(cell[cell.length - 1]);
        }
        break;
    }
    if (pos) model.setPositionHandlingPlaceholder(pos);
  }
}

export function removeRow(model: ModelPrivate): boolean {
  if (!contentWillChange(model, { inputType: 'deleteContent' })) return false;
  removeCell(model, 'row');
  contentDidChange(model, { inputType: 'deleteContent' });
  return true;
}

export function removeColumn(model: ModelPrivate): boolean {
  if (!contentWillChange(model, { inputType: 'deleteContent' })) return false;
  removeCell(model, 'column');
  contentDidChange(model, { inputType: 'deleteContent' });
  return true;
}

registerCommand(
  {
    addRowAfter,
    addColumnAfter,
    addRowBefore,
    addColumnBefore,
    removeRow,
    removeColumn,
    setEnvironment,
  },
  {
    target: 'model',
    canUndo: true,
    changeContent: true,
    changeSelection: true,
  }
);

function placeholderCell() {
  return [new PlaceholderAtom()];
}
