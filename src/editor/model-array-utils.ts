import { Atom } from '../core/atom';

/**
 * Convert an array row/col into an array index.
 */
export function arrayIndex(array, rowCol): number {
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
export function arrayColRow(array, index) {
    if (typeof index === 'string') {
        const m = index.match(/cell([0-9]*)$/);
        if (m) index = parseInt(m[1]);
    }
    const result = { row: 0, col: 0 };
    while (index > 0) {
        result.col += 1;
        if (!array[result.row] || result.col >= array[result.row].length) {
            result.col = 0;
            result.row += 1;
        }
        index -= 1;
    }

    return result;
}

/**
 * Return the array cell corresponding to colrow or null (for example in
 * a sparse array)
 *
 * @param {Atom[][]} array
 * @param {number|string|object} colrow
 * @private
 */
export function arrayCell(array, colrow) {
    if (typeof colrow !== 'object') colrow = arrayColRow(array, colrow);
    let result;
    if (Array.isArray(array[colrow.row])) {
        result = array[colrow.row][colrow.col] || null;
    }
    // If the 'first' math atom is missing, insert it
    if (result && (result.length === 0 || result[0].type !== 'first')) {
        result.unshift(new Atom('', 'first'));
    }
    return result;
}

/**
 * Total numbers of cells (include sparse cells) in the array.
 * @param {Atom[][]} array
 * @private
 */
export function arrayCellCount(array: Atom[][][]) {
    let result = 0;
    let numRows = 0;
    let numCols = 1;
    for (const row of array) {
        numRows += 1;
        if (row.length > numCols) numCols = row.length;
    }
    result = numRows * numCols;
    return result;
}

/**
 * Adjust colRow to point to the next/previous available row
 * If no more rows, go to the next/previous column
 * If no more columns, return null
 */
export function arrayAdjustRow(array: Atom[][][], colRow, dir: number) {
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
