// Import { getEnvironmentDefinition } from '../core/definitions';
import { Atom } from '../core/atom';
import type { ModelPrivate } from './model-private';
import { contentDidChange } from './listeners';
import { register as registerCommand } from '../editor/commands';
import { arrayIndex, arrayCell } from './array-utils';
import { Style } from '../public/core';
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
  let result: Atom[] = [new Atom('first')];
  let sep: Atom;
  for (let cell of row) {
    if (cell && cell.length > 0 && cell[0].type === 'first') {
      // Remove the 'first' atom, if present
      cell = cell.slice(1);
    }

    if (cell && cell.length > 0) {
      if (sep) {
        result.push(sep);
      } else {
        sep = new Atom('mpunct', { value: separator, style });
      }

      result = result.concat(cell);
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
  let result: Atom[] = [new Atom('first')];
  let sep: Atom;
  for (const row of array) {
    if (sep) {
      result.push(sep);
    } else {
      sep = new Atom('mpunct', { value: separators[0], style });
    }

    result = result.concat(arrayJoinColumns(row, separators[1]));
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
      if (cellLength > 0) {
        result += 1;
      }
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
    if (array[row][col]) {
      array[row].splice(col, 1);
    }

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
  while (colRow.row < array.length && !arrayCell(array, colRow)) {
    colRow.row += 1;
  }

  return arrayCell(array, colRow) ? `cell${arrayIndex(array, colRow)}` : '';
}

/**
 * Internal primitive to add a column/row in a matrix
 */
function addCell(
  _model: ModelPrivate,
  _where: 'after row' | 'before row' | 'after column' | 'before column'
): void {
  // This command is only applicable if we're in an array
  // const parent = model.parent;
  // if (parent && parent.type === 'array' && isArray(parent.array)) {
  //     const relation = model.relation;
  //     if (parent.array) {
  //         const colRow = arrayColRow(parent.array, relation);
  //         if (where === 'after row' || where === 'before row') {
  //             // Insert a row
  //             colRow.col = 0;
  //             colRow.row = colRow.row + (where === 'after row' ? 1 : 0);
  //             parent.array.splice(colRow.row, 0, [[]]);
  //         } else {
  //             // Insert a column
  //             colRow.col += where === 'after column' ? 1 : 0;
  //             parent.array[colRow.row].splice(colRow.col, 0, []);
  //         }
  //         const cellIndex = arrayIndex(parent.array, colRow);
  //         model.path.pop();
  //         model.path.push({
  //             relation: ('cell' + cellIndex.toString()) as Relation,
  //             offset: 0,
  //         });
  //         model.insertFirstAtom();
  //     }
  // }
}

export function convertParentToArray(_model: ModelPrivate): void {
  // Const parent = model.parent;
  // if (parent.type === 'leftright') {
  //     parent.type = 'array';
  //     const envName =
  //         { '(': 'pmatrix', '\\lbrack': 'bmatrix', '\\lbrace': 'cases' }[
  //             parent.leftDelim
  //         ] ?? 'matrix';
  //     const env = getEnvironmentDefinition(envName);
  //     const array = [[parent.branches.body]];
  //     Object.assign(parent, env.parser(envName, [], array));
  //     parent.mode = getAnchorMode(model);
  //     parent.environmentName = envName;
  //     parent.array = array;
  //     parent.rowGaps = [0];
  //     delete parent.branches.body;
  //     model.path[model.path.length - 1].relation = 'cell0' as Relation;
  // }
  // Note: could also be a group, or we could be a subscript or an
  // underscript (for multi-valued conditions on a \sum, for example)
  // Or if at root, this could be a 'align*' environment
}

export function addRowAfter(model: ModelPrivate): boolean {
  convertParentToArray(model);
  addCell(model, 'after row');
  contentDidChange(model);
  return true;
}

export function addRowBefore(model: ModelPrivate): boolean {
  convertParentToArray(model);
  addCell(model, 'before row');
  contentDidChange(model);
  return true;
}

export function addColumnAfter(model: ModelPrivate): boolean {
  convertParentToArray(model);
  addCell(model, 'after column');
  contentDidChange(model);
  return true;
}

export function addColumnBefore(model: ModelPrivate): boolean {
  convertParentToArray(model);
  addCell(model, 'before column');
  contentDidChange(model);
  return true;
}

registerCommand(
  {
    addRowAfter,
    addColumnAfter,
    addRowBefore,
    addColumnBefore,
  },
  { target: 'model', category: 'array-edit' }
);
