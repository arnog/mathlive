"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
exports.__esModule = true;
exports.removeColumn = exports.removeRow = exports.setEnvironment = exports.addColumnBefore = exports.addColumnAfter = exports.addRowBefore = exports.addRowAfter = void 0;
var commands_1 = require("../editor/commands");
var array_1 = require("../atoms/array");
var environments_1 = require("../latex-commands/environments");
var placeholder_1 = require("../atoms/placeholder");
var leftright_1 = require("../atoms/leftright");
__exportStar(require("./array-utils"), exports);
/**
 * Join all the cells at the indicated row into a single list of atoms
 */
// function arrayJoinColumns(
//   row: Atom[][],
//   separator = ',',
//   style?: Style
// ): Atom[] {
//   if (!row) return [];
//   const result: Atom[] = [new Atom({ type: 'first' })];
//   let sep: Atom | null = null;
//   for (let cell of row) {
//     // Remove the 'first' atom, if present
//     if (cell?.length > 0 && cell[0].type === 'first') cell = cell.slice(1);
//     if (cell?.length > 0) {
//       if (sep) result.push(sep);
//       else sep = new Atom({ type: 'mpunct', value: separator, style });
//       result.push(...cell);
//     }
//   }
//   return result;
// }
/**
 * Join all the rows into a single atom list
 */
// export function arrayJoinRows(
//   array: Atom[][][],
//   separators = [';', ','],
//   style?: Style
// ): Atom[] {
//   const result: Atom[] = [new Atom({ type: 'first' })];
//   let sep: Atom | null = null;
//   for (const row of array) {
//     if (sep) result.push(sep);
//     else sep = new Atom({ type: 'mpunct', value: separators[0], style });
//     result.push(...arrayJoinColumns(row, separators[1]));
//   }
//   return result;
// }
/**
 * Return the number of non-empty cells in that column
 */
// export function arrayColumnCellCount(array: Atom[][][], col: number): number {
//   let result = 0;
//   const colRow = { col, row: 0 };
//   while (colRow.row < array.length) {
//     const cell = arrayCell(array, colRow);
//     if (cell && cell.length > 0) {
//       let cellLength = cell.length;
//       if (cell[0].type === 'first') cellLength -= 1;
//       if (cellLength > 0) result += 1;
//     }
//     colRow.row += 1;
//   }
//   return result;
// }
/**
 * Remove the indicated column from the array
 */
// export function arrayRemoveRow(array: Atom[][][], col: number): void {
//   let row = 0;
//   while (row < array.length) {
//     if (array[row][col]) array[row].splice(col, 1);
//     row += 1;
//   }
// }
/**
 * Remove the indicated row from the array
 */
//  function arrayRemoveRow(array: Atom[][][], row: number): void {
//   array.splice(row, 1);
// }
/**
 * Return the first non-empty cell, row by row
 */
// function arrayFirstCellByRow(array: Atom[][][]): string {
//   const colRow = { col: 0, row: 0 };
//   while (colRow.row < array.length && !arrayCell(array, colRow))
//     colRow.row += 1;
//   return arrayCell(array, colRow) ? `cell${arrayIndex(array, colRow)}` : '';
// }
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
function parentArray(model, where) {
    var atom = model.at(model.position);
    while (atom && !(atom.parent instanceof array_1.ArrayAtom))
        atom = atom.parent;
    //
    // Conversion:
    // if we are in an array, but the addition of cell is not compatible,
    // change the array type
    //
    //
    if (atom && atom.type === 'array') {
        var array = atom;
        if (array.environmentName === 'lines') {
            // Convert to `split` if adding columns
            // @todo
        }
    }
    //
    // If no array was found, try to create one
    //
    if (!atom || !(atom.parent instanceof array_1.ArrayAtom)) {
        var cursor = model.at(model.position);
        atom = cursor;
        //
        // 1/ Handle insertion at the root (when the root is not already an array)
        //
        if (!atom.parent.parent) {
            var secondCell = model.extractAtoms([model.position, model.lastOffset]);
            var firstCell = model.extractAtoms([0, model.position]);
            if (firstCell.length === 0)
                firstCell = placeholderCell();
            if (secondCell.length === 0)
                secondCell = placeholderCell();
            var array = void 0;
            if (where.endsWith('column')) {
                array = (0, environments_1.makeEnvironment)('split', [[firstCell, secondCell]]);
                model.root = array;
                if (isPlaceholderCell(array, 0, 0))
                    selectCell(model, array, 0, 0);
                else if (isPlaceholderCell(array, 0, 1))
                    selectCell(model, array, 0, 1);
                else
                    model.position = model.offsetOf(cursor);
            }
            else {
                array = (0, environments_1.makeEnvironment)('lines', [[firstCell], [secondCell]]);
                model.root = array;
                if (isPlaceholderCell(array, 0, 0))
                    selectCell(model, array, 0, 0);
                else if (isPlaceholderCell(array, 1, 0))
                    selectCell(model, array, 1, 0);
                else
                    model.position = model.offsetOf(cursor);
            }
            // We've created the environment and the cells, no need to add a row/column, so return undefined
            return [undefined, [0, 0]];
        }
        //
        // 2/ Are we inside a \left...\right...?
        //
        if (atom.parent instanceof leftright_1.LeftRightAtom) {
            var parent_1 = atom.parent;
            var secondCell = model.extractAtoms([
                model.position,
                model.offsetOf(parent_1.lastChild),
            ]);
            var firstCell = model.extractAtoms([
                model.offsetOf(parent_1.firstChild),
                model.position,
            ]);
            if (firstCell.length === 0)
                firstCell = placeholderCell();
            if (secondCell.length === 0)
                secondCell = placeholderCell();
            var envName = 'pmatrix';
            var lDelim = parent_1.leftDelim;
            var rDelim = parent_1.rightDelim;
            if (lDelim === '(' && (rDelim === ')' || rDelim === '?'))
                envName = 'pmatrix';
            else if ((lDelim === '[' || lDelim === '\\lbrack') &&
                (rDelim === ']' || rDelim === '\\rbrack' || rDelim === '?'))
                envName = 'bmatrix';
            else if (lDelim === '\\vert' && rDelim === '\\vert')
                envName = 'vmatrix';
            else if (lDelim === '\\Vert' && rDelim === '\\Vert')
                envName = 'Vmatrix';
            else if ((lDelim === '{' || lDelim === '\\lbrace') &&
                (rDelim === '.' || rDelim === '?'))
                envName = 'cases';
            var array = (0, environments_1.makeEnvironment)(envName, where.endsWith('column')
                ? [[firstCell, secondCell]]
                : [[firstCell], [secondCell]]);
            parent_1.parent.addChildBefore(array, parent_1);
            parent_1.parent.removeChild(parent_1);
            if (isPlaceholderCell(array, 0, 0))
                selectCell(model, array, 0, 0);
            else if (where.endsWith('column')) {
                if (isPlaceholderCell(array, 0, 1))
                    selectCell(model, array, 0, 1);
                else
                    model.position = model.offsetOf(atom);
            }
            else {
                if (isPlaceholderCell(array, 1, 0))
                    selectCell(model, array, 1, 0);
                else
                    model.position = model.offsetOf(atom);
            }
            return [undefined, [0, 0]];
        }
    }
    return atom && atom.parent instanceof array_1.ArrayAtom
        ? [atom.parent, atom.parentBranch]
        : [undefined, [0, 0]];
}
function isPlaceholderCell(array, row, column) {
    // const pos = model.offsetOf(array.getCell(row, column)![1]);
    // return pos >= 0 && model.at(pos).type === 'placeholder';
    var cell = array.getCell(row, column);
    if (!cell || cell.length !== 2)
        return false;
    return cell[1].type === 'placeholder';
}
function cellRange(model, array, row, column) {
    var cell = array.getCell(row, column);
    if (!cell)
        return -1;
    return [model.offsetOf(cell[0]), model.offsetOf(cell[cell.length - 1])];
}
function selectCell(model, array, row, column) {
    var range = cellRange(model, array, row, column);
    if (typeof range !== 'number')
        model.setSelection(range);
}
function setPositionInCell(model, array, row, column, pos) {
    var cell = array.getCell(row, column);
    if (!cell)
        return;
    model.setPositionHandlingPlaceholder(model.offsetOf(cell[pos === 'start' ? 0 : cell.length - 1]));
}
/**
 * Internal primitive to add a column/row in an array.
 * Insert an array if necessary.
 */
function addCell(model, where) {
    var _a = parentArray(model, where), arrayAtom = _a[0], _b = _a[1], row = _b[0], column = _b[1];
    if (!arrayAtom)
        return;
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
function addRowAfter(model) {
    if (!model.contentWillChange({ inputType: 'insertText' }))
        return false;
    addCell(model, 'after row');
    model.contentDidChange({ inputType: 'insertText' });
    return true;
}
exports.addRowAfter = addRowAfter;
function addRowBefore(model) {
    if (!model.contentWillChange({ inputType: 'insertText' }))
        return false;
    addCell(model, 'before row');
    model.contentDidChange({ inputType: 'insertText' });
    return true;
}
exports.addRowBefore = addRowBefore;
function addColumnAfter(model) {
    if (!model.contentWillChange({ inputType: 'insertText' }))
        return false;
    addCell(model, 'after column');
    model.contentDidChange({ inputType: 'insertText' });
    return true;
}
exports.addColumnAfter = addColumnAfter;
function addColumnBefore(model) {
    if (!model.contentWillChange({ inputType: 'insertText' }))
        return false;
    addCell(model, 'before column');
    model.contentDidChange({ inputType: 'insertText' });
    return true;
}
exports.addColumnBefore = addColumnBefore;
function setEnvironment(model, environment) {
    if (!model.contentWillChange({}))
        return false;
    model.mathfield.snapshot();
    var leftDelim = '.';
    var rightDelim = '.';
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
    var atom = model.at(model.position);
    var arrayAtom = atom.type === 'array' ? atom : model.parentEnvironment;
    arrayAtom.environmentName = environment;
    arrayAtom.leftDelim = leftDelim;
    arrayAtom.rightDelim = rightDelim;
    model.contentDidChange({});
    return true;
}
exports.setEnvironment = setEnvironment;
/**
 * Internal primitive to remove a column/row in a matrix
 */
function removeCell(model, where) {
    // This command is only applicable if we're in an ArrayAtom
    var atom = model.at(model.position);
    while (atom &&
        !(Array.isArray(atom.parentBranch) && atom.parent instanceof array_1.ArrayAtom))
        atom = atom.parent;
    if (Array.isArray(atom === null || atom === void 0 ? void 0 : atom.parentBranch) && (atom === null || atom === void 0 ? void 0 : atom.parent) instanceof array_1.ArrayAtom) {
        var arrayAtom = atom.parent;
        var treeBranch = atom.parentBranch;
        var pos = void 0;
        switch (where) {
            case 'row':
                if (arrayAtom.rowCount > 1) {
                    arrayAtom.removeRow(treeBranch[0]);
                    var cell = arrayAtom.getCell(Math.max(0, treeBranch[0] - 1), treeBranch[1]);
                    pos = model.offsetOf(cell[cell.length - 1]);
                }
                break;
            case 'column':
                if (arrayAtom.colCount > arrayAtom.minColumns) {
                    arrayAtom.removeColumn(treeBranch[1]);
                    var cell = arrayAtom.getCell(treeBranch[0], Math.max(0, treeBranch[1] - 1));
                    pos = model.offsetOf(cell[cell.length - 1]);
                }
                break;
        }
        if (pos)
            model.setPositionHandlingPlaceholder(pos);
    }
}
function removeRow(model) {
    if (!model.contentWillChange({ inputType: 'deleteContent' }))
        return false;
    removeCell(model, 'row');
    model.contentDidChange({ inputType: 'deleteContent' });
    return true;
}
exports.removeRow = removeRow;
function removeColumn(model) {
    if (!model.contentWillChange({ inputType: 'deleteContent' }))
        return false;
    removeCell(model, 'column');
    model.contentDidChange({ inputType: 'deleteContent' });
    return true;
}
exports.removeColumn = removeColumn;
(0, commands_1.register)({
    addRowAfter: addRowAfter,
    addColumnAfter: addColumnAfter,
    addRowBefore: addRowBefore,
    addColumnBefore: addColumnBefore,
    removeRow: removeRow,
    removeColumn: removeColumn,
    setEnvironment: setEnvironment
}, {
    target: 'model',
    canUndo: true,
    changeContent: true,
    changeSelection: true
});
function placeholderCell() {
    return [new placeholder_1.PlaceholderAtom()];
}
