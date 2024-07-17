"use strict";
exports.__esModule = true;
exports.arrayCell = exports.arrayIndex = void 0;
var types_1 = require("../common/types");
/**
 * Convert an array row/col into an array index.
 */
function arrayIndex(array, rowCol) {
    var result = 0;
    for (var i = 0; i < rowCol.row; i++)
        for (var j = 0; j < array[i].length; j++)
            result += 1;
    result += rowCol.col;
    return result;
}
exports.arrayIndex = arrayIndex;
/**
 * Convert an array index (scalar) to an array row/col.
 * @return {object}
 * - row: number
 * - col: number
 */
function arrayColRow(array, index) {
    if ((0, types_1.isArray)(index))
        return { col: index[0], row: index[1] };
    var i = 0;
    if (typeof index === 'string') {
        var m = index.match(/cell(\d*)$/);
        if (m)
            i = Number.parseInt(m[1]);
    }
    else
        i = index;
    var result = { row: 0, col: 0 };
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
function arrayCell(array, colrow) {
    var _a;
    if (typeof colrow === 'number' ||
        typeof colrow === 'string' ||
        (0, types_1.isArray)(colrow))
        colrow = arrayColRow(array, colrow);
    var result = null;
    if ((0, types_1.isArray)(array[colrow.row])) {
        result = (_a = array[colrow.row][colrow.col]) !== null && _a !== void 0 ? _a : null;
        console.assert(result.length > 0);
        console.assert(result[0].type === 'first');
    }
    return result;
}
exports.arrayCell = arrayCell;
/**
 * Total numbers of cells (include sparse cells) in the array.
 */
// function arrayCellCount(array: Atom[][][]): number {
//   let result = 0;
//   let numberRows = 0;
//   let numberCols = 1;
//   for (const row of array) {
//     numberRows += 1;
//     if (row.length > numberCols) numberCols = row.length;
//   }
//   result = numberRows * numberCols;
//   return result;
// }
/**
 * Adjust colRow to point to the next/previous available row
 * If no more rows, go to the next/previous column
 * If no more columns, return null
 */
// export function arrayAdjustRow(
//   array: Atom[][][],
//   colRow: { col: number; row: number },
//   dir: number
// ): null | { col: number; row: number } {
//   const result = { ...colRow };
//   result.row += dir;
//   if (result.row < 0) {
//     result.col += dir;
//     result.row = array.length - 1;
//     if (result.col < 0) return null;
//     while (result.row >= 0 && !arrayCell(array, result)) result.row -= 1;
//     if (result.row < 0) return null;
//   } else if (result.row >= array.length) {
//     result.col += dir;
//     result.row = 0;
//     while (result.row < array.length && !arrayCell(array, result))
//       result.row += 1;
//     if (result.row > array.length - 1) return null;
//   }
//   return result;
// }
