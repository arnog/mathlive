import { Atom, isCellBranch } from '../core/atom';

import { register as registerCommand } from '../editor/commands';

import type { _Model } from './model-private';
import { ArrayAtom } from '../atoms/array';
import { Environment, TabularEnvironment } from '../public/core-types';
import { makeEnvironment } from '../latex-commands/environments';
import { PlaceholderAtom } from '../atoms/placeholder';
import { LeftRightAtom } from '../atoms/leftright';
import { range } from './selection-utils';
export * from './array-utils';

/**
 * Return the first and last siblings of the current cell
 */

function cellSiblings(model: _Model): [Atom, Atom] {
  let atom: Atom | undefined = model.at(model.position);

  while (atom && !isCellBranch(atom.parentBranch)) atom = atom.parent!;

  return [atom.firstSibling, atom.lastSibling];
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
  model: _Model,
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
  if (atom?.type === 'array') {
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

      let array: ArrayAtom;
      if (where.endsWith('column')) {
        if (firstCell.length === 0) firstCell = placeholderCell();
        if (secondCell.length === 0) secondCell = placeholderCell();
        array = makeEnvironment('split', [[firstCell, secondCell]]);
        model.root = array;
        if (isPlaceholderCell(array, 0, 0)) selectCell(model, array, 0, 0);
        else if (isPlaceholderCell(array, 0, 1)) selectCell(model, array, 0, 1);
        else model.position = model.offsetOf(cursor);
      } else {
        // if (firstCell.length === 0) firstCell = emptyCell();
        // if (secondCell.length === 0) secondCell = emptyCell();
        array = makeEnvironment('lines', [[firstCell], [secondCell]]);
        model.root = array;
        // if (isPlaceholderCell(array, 0, 0)) selectCell(model, array, 0, 0);
        // else if (isPlaceholderCell(array, 1, 0)) selectCell(model, array, 1, 0);
        // else
        // Select the second line
        selectCell(model, array, 1, 0);
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
  if (cell?.length !== 2) return false;
  return cell[1].type === 'placeholder';
}

function cellRange(
  model: _Model,
  array: ArrayAtom,
  row: number,
  column: number
): [number, number] | number {
  const cell = array.getCell(row, column);
  if (!cell) return -1;
  return [model.offsetOf(cell[0]), model.offsetOf(cell[cell.length - 1])];
}

function selectCell(
  model: _Model,
  array: ArrayAtom,
  row: number,
  column: number
) {
  const range = cellRange(model, array, row, column);
  if (typeof range !== 'number') model.setSelection(range);
}

function setPositionInCell(
  model: _Model,
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
  model: _Model,
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

export function addRowAfter(model: _Model): boolean {
  // Only add a row if the current position is in the top level of a cell
  // or at the top level of the root (in which case we'll convert to a `lines` environment)
  const cursor = model.at(model.position);
  if (
    !isCellBranch(cursor.parentBranch) &&
    cursor.parent !== model.root &&
    model.root.type !== 'root'
  ) {
    model.announce('plonk');
    return false;
  }

  if (!model.contentWillChange({ inputType: 'insertText' })) return false;

  // If in multiline mode, split the current line
  if (model.parentEnvironment?.isMultiline) {
    // If there's a selection, delete it
    if (!model.selectionIsCollapsed) model.deleteAtoms(range(model.selection));

    // Get content before/after the cursor
    const [first, last] = cellSiblings(model)!;
    const after = model.extractAtoms([model.position, model.offsetOf(last)]);
    const before = model.extractAtoms([model.offsetOf(first), model.position]);

    const array = first.parent as ArrayAtom;
    const [row, col] = first.parentBranch as [number, number];

    array.setCell(row, col, before);

    // Add row after the current row
    addCell(model, 'after row');

    // Set row following cell
    array.setCell(row + 1, col, after);

    model.position = model.offsetOf(array.getCell(row + 1, col)![0]);

    model.contentDidChange({ inputType: 'insertText' });
    return true;
  }

  addCell(model, 'after row');
  model.contentDidChange({ inputType: 'insertText' });
  return true;
}

export function addRowBefore(model: _Model): boolean {
  if (!model.contentWillChange({ inputType: 'insertText' })) return false;
  addCell(model, 'before row');
  model.contentDidChange({ inputType: 'insertText' });
  return true;
}

export function addColumnAfter(model: _Model): boolean {
  if (!model.contentWillChange({ inputType: 'insertText' })) return false;
  addCell(model, 'after column');
  model.contentDidChange({ inputType: 'insertText' });
  return true;
}

export function addColumnBefore(model: _Model): boolean {
  if (!model.contentWillChange({ inputType: 'insertText' })) return false;
  addCell(model, 'before column');
  model.contentDidChange({ inputType: 'insertText' });
  return true;
}

export function setEnvironment(
  model: _Model,
  environment: TabularEnvironment
): boolean {
  if (!model.contentWillChange({})) return false;
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

  const atom = model.at(model.position);
  const arrayAtom =
    atom.type === 'array' ? (atom as ArrayAtom) : model.parentEnvironment!;
  arrayAtom.environmentName = environment;
  arrayAtom.leftDelim = leftDelim;
  arrayAtom.rightDelim = rightDelim;
  model.contentDidChange({});
  return true;
}

/**
 * Internal primitive to remove a column/row in a matrix
 */
function removeCell(model: _Model, where: 'row' | 'column'): void {
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
    if (pos !== undefined) model.setPositionHandlingPlaceholder(pos);
  }
}

export function removeRow(model: _Model): boolean {
  if (!model.contentWillChange({ inputType: 'deleteContent' })) return false;
  removeCell(model, 'row');
  model.contentDidChange({ inputType: 'deleteContent' });
  return true;
}

export function removeColumn(model: _Model): boolean {
  if (!model.contentWillChange({ inputType: 'deleteContent' })) return false;
  removeCell(model, 'column');
  model.contentDidChange({ inputType: 'deleteContent' });
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

function emptyCell() {
  return [new Atom({ type: 'first', mode: 'math' })];
}
