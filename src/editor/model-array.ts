import { getEnvironmentInfo } from '../core/definitions';
import { Atom } from '../core/atom';
import { ModelPrivate } from './model-utils';
import { contentDidChange, contentWillChange } from './model-listeners';
import { getAnchorMode } from './model-selection';
import { register as registerCommand } from './commands';
import { arrayIndex, arrayColRow, arrayCell } from './model-array-utils';
export * from './model-array-utils';

/**
 * Join all the cells at the indicated row into a single mathlist
 */
export function arrayJoinColumns(
    row: Atom[][],
    separator = ',',
    style?
): Atom[] {
    if (!row) return [];
    let result: Atom[] = [];
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
                sep = new Atom('math', 'mpunct', separator, style);
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
    style?
): Atom[] {
    let result = [];
    let sep;
    for (const row of array) {
        if (sep) {
            result.push(sep);
        } else {
            sep = new Atom('math', 'mpunct', separators[0], style);
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
    const colRow = { col: col, row: 0 };
    while (colRow.row < array.length) {
        const cell = arrayCell(array, colRow);
        if (cell && cell.length > 0) {
            let cellLen = cell.length;
            if (cell[0].type === 'first') cellLen -= 1;
            if (cellLen > 0) {
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
export function arrayFirstCellByRow(array: Atom[][][]) {
    const colRow = { col: 0, row: 0 };
    while (colRow.row < array.length && !arrayCell(array, colRow)) {
        colRow.row += 1;
    }
    return arrayCell(array, colRow) ? 'cell' + arrayIndex(array, colRow) : '';
}

/**
 * Internal primitive to add a column/row in a matrix
 */
function addCell(
    model: ModelPrivate,
    where: 'after row' | 'before row' | 'after column' | 'before column'
) {
    // This command is only applicable if we're in an array
    const parent = model.parent();
    if (parent && parent.type === 'array' && Array.isArray(parent.array)) {
        const relation = model.relation();
        if (parent.array) {
            const colRow = arrayColRow(parent.array, relation);

            if (where === 'after row' || where === 'before row') {
                // Insert a row
                colRow.col = 0;
                colRow.row = colRow.row + (where === 'after row' ? 1 : 0);

                parent.array.splice(colRow.row, 0, [[]]);
            } else {
                // Insert a column
                colRow.col += where === 'after column' ? 1 : 0;
                parent.array[colRow.row].splice(colRow.col, 0, []);
            }

            const cellIndex = arrayIndex(parent.array, colRow);

            model.path.pop();
            model.path.push({
                relation: 'cell' + cellIndex.toString(),
                offset: 0,
            });
            model.insertFirstAtom();
        }
    }
}

export function convertParentToArray(model: ModelPrivate): void {
    const parent = model.parent();
    if (parent.type === 'leftright') {
        parent.type = 'array';
        const envName =
            { '(': 'pmatrix', '\\lbrack': 'bmatrix', '\\lbrace': 'cases' }[
                parent.leftDelim
            ] || 'matrix';
        const env = getEnvironmentInfo(envName);
        const array = [[parent.body as Atom[]]];
        if (env.parser) {
            Object.assign(parent, env.parser(envName, [], array));
        }
        parent.mode = getAnchorMode(model);
        parent.env = { ...env };
        parent.env.name = envName;
        parent.array = array;
        parent.rowGaps = [0];
        delete parent.body;
        model.path[model.path.length - 1].relation = 'cell0';
    }
    // Note: could also be a group, or we could be a subscript or an
    // underscript (for multi-valued conditions on a \sum, for example)
    // Or if at root, this could be a 'align*' environment
}

export function addRowAfter(model: ModelPrivate): boolean {
    contentWillChange(model);
    convertParentToArray(model);
    addCell(model, 'after row');
    contentDidChange(model);
    return true;
}

export function addRowBefore(model: ModelPrivate): boolean {
    contentWillChange(model);
    convertParentToArray(model);
    addCell(model, 'before row');
    contentDidChange(model);
    return true;
}
export function addColumnAfter(model: ModelPrivate): boolean {
    contentWillChange(model);
    convertParentToArray(model);
    addCell(model, 'after column');
    contentDidChange(model);
    return true;
}

export function addColumnBefore(model: ModelPrivate): boolean {
    contentWillChange(model);
    convertParentToArray(model);
    addCell(model, 'before column');
    contentDidChange(model);
    return true;
}

registerCommand(
    {
        addRowAfter: addRowAfter,
        addColumnAfter: addColumnAfter,
        addRowBefore: addRowBefore,
        addColumnBefore: addColumnBefore,
    },
    { target: 'model', category: 'array-edit' }
);
