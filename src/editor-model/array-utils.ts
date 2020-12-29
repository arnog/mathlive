import { isArray } from '../common/types';

import { Atom } from '../core/atom';

/**
 * Convert an array row/col into an array index.
 */
export function arrayIndex(
  array: Atom[][][],
  rowCol: { col: number; row: number }
): number {
  let result = 0;

  for (let i = 0; i < rowCol.row; i++) {
    for (let j = 0; j < array[i].length; j++) {
      result += 1;
    }
  }

  result += rowCol.col;

  return result;
}

/**
 * Convert an array index (scalar) to an array row/col.
 * @return {object}
 * - row: number
 * - col: number
 */
export function arrayColRow(
  array: Atom[][][],
  index: number | string | [col: number, row: number]
): {
  col: number;
  row: number;
} {
  if (Array.isArray(index)) {
    return { col: index[0], row: index[1] };
  }

  let i: number;
  if (typeof index === 'string') {
    const m = index.match(/cell(\d*)$/);
    if (m) i = Number.parseInt(m[1]);
  } else {
    i = index;
  }

  const result = { row: 0, col: 0 };
  while (i > 0) {
    result.col += 1;
    if (!array[result.row] || result.col >= array[result.row].length) {
      result.col = 0;
      result.row += 1;
    }

    i -= 1;
  }

  return result;
}

/**
 * Return the array cell corresponding to colrow or null (for example in
 * a sparse array)
 * @revisit: simply colrow argument to always be [,]
 */
export function arrayCell(
  array: Atom[][][],
  colrow:
    | string
    | number
    | { col: number; row: number }
    | [col: number, row: number]
): Atom[] {
  if (
    typeof colrow === 'number' ||
    typeof colrow === 'string' ||
    Array.isArray(colrow)
  ) {
    colrow = arrayColRow(array, colrow);
  }

  let result: Atom[];
  if (isArray(array[colrow.row])) {
    result = array[colrow.row][colrow.col] ?? null;
    console.assert(result.length > 0);
    console.assert(result[0].type === 'first');
  }

  return result;
}

/**
 * Total numbers of cells (include sparse cells) in the array.
 */
export function arrayCellCount(array: Atom[][][]): number {
  let result = 0;
  let numberRows = 0;
  let numberCols = 1;
  for (const row of array) {
    numberRows += 1;
    if (row.length > numberCols) numberCols = row.length;
  }

  result = numberRows * numberCols;
  return result;
}

/**
 * Adjust colRow to point to the next/previous available row
 * If no more rows, go to the next/previous column
 * If no more columns, return null
 */
export function arrayAdjustRow(
  array: Atom[][][],
  colRow: { col: number; row: number },
  dir: number
): { col: number; row: number } {
  const result = { ...colRow };
  result.row += dir;
  if (result.row < 0) {
    result.col += dir;
    result.row = array.length - 1;
    if (result.col < 0) return null;
    while (result.row >= 0 && !arrayCell(array, result)) {
      result.row -= 1;
    }

    if (result.row < 0) return null;
  } else if (result.row >= array.length) {
    result.col += dir;
    result.row = 0;
    while (result.row < array.length && !arrayCell(array, result)) {
      result.row += 1;
    }

    if (result.row > array.length - 1) return null;
  }

  return result;
}
