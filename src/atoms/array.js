"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.ArrayAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
var v_box_1 = require("../core/v-box");
var delimiters_1 = require("../core/delimiters");
var context_1 = require("../core/context");
var tokenizer_1 = require("../core/tokenizer");
var font_metrics_1 = require("../core/font-metrics");
var registers_utils_1 = require("../core/registers-utils");
var placeholder_1 = require("./placeholder");
var environment_types_1 = require("../latex-commands/environment-types");
// function arrayToString(array: Atom[][][]): string {
//   if (array || array.length === 0) return `0 ⨉ 0\n`;
//   let result = `${array.length}r ⨉ ${array[0].length ?? 0}c\n`;
//   for (const row of array) {
//     result += '    ';
//     for (const cell of row) {
//       if (!cell || cell.length === 0) {
//         result += '😱';
//       } else if (cell[0].type === 'first') {
//         if (cell[1]) {
//           result += cell[1].command;
//         } else {
//           result += '∅';
//         }
//       } else {
//         result += '👎' + cell[0].command;
//       }
//       result += '  ';
//     }
//     result += '\n';
//   }
//   return result;
// }
/**
 * Normalize the array:
 * - ensure it is dense (not sparse)
 * - fold rows that overflow (longer than maximum number of columns)
 * - ensure each cell begins with a `first` atom
 * - remove last row if empty
 */
function normalizeArray(atom, array, colFormat) {
    //
    // 1/
    // - Fold the array so that there are no more columns of content than
    // there are columns prescribed by the column format.
    // - Fill rows that have fewer cells than expected with empty cells
    // - Ensure that all the cells have a `first` atom.
    //
    // The number of column is determined by the colFormat
    var maxColCount = 0;
    for (var _i = 0, colFormat_1 = colFormat; _i < colFormat_1.length; _i++) {
        var colSpec = colFormat_1[_i];
        if ('align' in colSpec)
            maxColCount += 1;
    }
    // Actual number of columns (at most `maxColCount`)
    var colCount = 0;
    var rows = [];
    for (var _a = 0, array_1 = array; _a < array_1.length; _a++) {
        var row = array_1[_a];
        var colIndex_1 = 0;
        colCount = Math.max(colCount, Math.min(row.length, maxColCount));
        while (colIndex_1 < row.length) {
            var newRow = [];
            var lastCol = Math.min(row.length, colIndex_1 + maxColCount);
            while (colIndex_1 < lastCol) {
                var cell = row[colIndex_1];
                if (cell.length === 0)
                    newRow.push([new atom_class_1.Atom({ type: 'first', mode: atom.mode })]);
                else if (cell[0].type !== 'first')
                    newRow.push(__spreadArray([new atom_class_1.Atom({ type: 'first', mode: atom.mode })], cell, true));
                else {
                    console.assert(!cell.slice(1).some(function (x) { return x.type === 'first'; }));
                    newRow.push(cell);
                }
                colIndex_1 += 1;
            }
            rows.push(newRow);
        }
    }
    //
    // 2/ If the last row is empty, ignore it (TeX behavior)
    // (unless there's only one row)
    //
    if (rows.length > 0 &&
        rows[rows.length - 1].length === 1 &&
        rows[rows.length - 1][0].length === 1 &&
        rows[rows.length - 1][0][0].type === 'first')
        rows.pop();
    //
    // 3/ Fill out any missing cells
    //
    var result = [];
    for (var _b = 0, rows_1 = rows; _b < rows_1.length; _b++) {
        var row = rows_1[_b];
        if (row.length !== colCount) {
            for (var i = row.length; i < colCount; i++) {
                row.push([
                    new atom_class_1.Atom({ type: 'first', mode: atom.mode }),
                    new placeholder_1.PlaceholderAtom(),
                ]);
            }
        }
        result.push(row);
    }
    //
    // 4/ Set the `parent` and `treeBranch` for each cell
    //
    var rowIndex = 0;
    var colIndex = 0;
    for (var _c = 0, result_1 = result; _c < result_1.length; _c++) {
        var row = result_1[_c];
        colIndex = 0;
        for (var _d = 0, row_1 = row; _d < row_1.length; _d++) {
            var cell = row_1[_d];
            for (var _e = 0, cell_1 = cell; _e < cell_1.length; _e++) {
                var element = cell_1[_e];
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
// See http://ctan.math.utah.edu/ctan/tex-archive/macros/latex/base/lttab.dtx
var ArrayAtom = /** @class */ (function (_super) {
    __extends(ArrayAtom, _super);
    function ArrayAtom(envName, array, rowGaps, options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        var _a;
        _this = _super.call(this, { type: 'array' }) || this;
        _this.environmentName = envName;
        _this.rowGaps = rowGaps;
        if (options.mathstyleName)
            _this.mathstyleName = options.mathstyleName;
        if (options.columns) {
            if (options.columns.length === 0)
                _this.colFormat = [{ align: 'l' }];
            else
                _this.colFormat = options.columns;
        }
        // The TeX definition is that arrays by default have a maximum
        // of 10, left-aligned, columns.
        if (!_this.colFormat) {
            _this.colFormat = [
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
        _this.array = normalizeArray(_this, array, _this.colFormat);
        // console.log(arrayToString(this.array));
        if (options.leftDelim)
            _this.leftDelim = options.leftDelim;
        if (options.rightDelim)
            _this.rightDelim = options.rightDelim;
        if (options.arraycolsep !== undefined)
            _this.arraycolsep = options.arraycolsep;
        _this.colSeparationType = options.colSeparationType;
        // Default \arraystretch from lttab.dtx
        if (options.arraystretch !== undefined)
            _this.arraystretch = options.arraystretch;
        _this.minColumns = (_a = options.minColumns) !== null && _a !== void 0 ? _a : 1;
        return _this;
    }
    ArrayAtom.fromJson = function (json) {
        return new ArrayAtom(json.environmentName, json.array, json.rowGaps, json);
    };
    ArrayAtom.prototype.toJson = function () {
        var result = __assign(__assign({}, _super.prototype.toJson.call(this)), { environmentName: this.environmentName, array: this.array.map(function (row) {
                return row.map(function (col) { return col.map(function (x) { return x.toJson(); }); });
            }), rowGaps: this.rowGaps, columns: this.colFormat, colSeparationType: this.colSeparationType });
        if (this.arraystretch !== undefined)
            result.arraystretch = this.arraystretch;
        if (this.arraycolsep !== undefined)
            result.arraycolsep = this.arraycolsep;
        if (this.leftDelim)
            result.leftDelim = this.leftDelim;
        if (this.rightDelim)
            result.rightDelim = this.rightDelim;
        return result;
    };
    ArrayAtom.prototype.branch = function (cell) {
        var _a;
        if (!(0, atom_class_1.isCellBranch)(cell))
            return undefined;
        return (_a = this.array[cell[0]][cell[1]]) !== null && _a !== void 0 ? _a : undefined;
    };
    ArrayAtom.prototype.createBranch = function (cell) {
        var _a;
        if (!(0, atom_class_1.isCellBranch)(cell))
            return [];
        this.isDirty = true;
        return (_a = this.branch(cell)) !== null && _a !== void 0 ? _a : [];
    };
    Object.defineProperty(ArrayAtom.prototype, "rowCount", {
        get: function () {
            return this.array.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ArrayAtom.prototype, "colCount", {
        get: function () {
            return this.array[0].length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ArrayAtom.prototype, "maxColumns", {
        get: function () {
            return this.colFormat.filter(function (col) { return Boolean(col['align']); }).length;
        },
        enumerable: false,
        configurable: true
    });
    ArrayAtom.prototype.removeBranch = function (name) {
        if ((0, atom_class_1.isNamedBranch)(name))
            return _super.prototype.removeBranch.call(this, name);
        var _a = this.branch(name), _first = _a[0], children = _a.slice(1);
        // Drop the 'first' element
        console.assert(_first.type === 'first');
        this.array[name[0]][name[1]] = undefined;
        children.forEach(function (x) {
            x.parent = undefined;
            x.parentBranch = undefined;
        });
        this.isDirty = true;
        return children;
    };
    Object.defineProperty(ArrayAtom.prototype, "hasChildren", {
        get: function () {
            return this.children.length > 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ArrayAtom.prototype, "children", {
        get: function () {
            var result = [];
            for (var _i = 0, _a = this.array; _i < _a.length; _i++) {
                var row = _a[_i];
                for (var _b = 0, row_2 = row; _b < row_2.length; _b++) {
                    var cell = row_2[_b];
                    if (cell) {
                        for (var _c = 0, cell_2 = cell; _c < cell_2.length; _c++) {
                            var atom = cell_2[_c];
                            result.push.apply(result, atom.children);
                            result.push(atom);
                        }
                    }
                }
            }
            return __spreadArray(__spreadArray([], result, true), _super.prototype.children, true);
        },
        enumerable: false,
        configurable: true
    });
    ArrayAtom.prototype.render = function (context) {
        // See http://tug.ctan.org/macros/latex/base/ltfsstrc.dtx
        // and http://tug.ctan.org/macros/latex/base/lttab.dtx
        var _a, _b, _c, _d, _e, _f;
        var innerContext = new context_1.Context({ parent: context, mathstyle: this.mathstyleName }, this.style);
        var arrayRuleWidth = innerContext.getRegisterAsEm('arrayrulewidth');
        var arrayColSep = innerContext.getRegisterAsEm('arraycolsep');
        var doubleRuleSep = innerContext.getRegisterAsEm('doublerulesep');
        // Row spacing
        var arraystretch = (_b = (_a = this.arraystretch) !== null && _a !== void 0 ? _a : innerContext.getRegisterAsNumber('arraystretch')) !== null && _b !== void 0 ? _b : 1.0;
        var arraycolsep = typeof this.arraycolsep === 'number' ? this.arraycolsep : arrayColSep;
        if (this.colSeparationType === 'small') {
            // We're in a {smallmatrix}. Default column space is \thickspace,
            // i.e. 5/18em = 0.2778em, per amsmath.dtx for {smallmatrix}.
            // But that needs adjustment because LaTeX applies \scriptstyle to the
            // entire array, including the colspace, but this function applies
            // \scriptstyle only inside each element.
            var localMultiplier = new context_1.Context({
                parent: context,
                mathstyle: 'scriptstyle'
            }).scalingFactor;
            arraycolsep = 0.2778 * (localMultiplier / context.scalingFactor);
        }
        var arrayskip = arraystretch * font_metrics_1.BASELINE_SKIP;
        var arstrutHeight = 0.7 * arrayskip;
        var arstrutDepth = 0.3 * arrayskip; // \@arstrutbox in lttab.dtx
        var totalHeight = 0;
        var body = [];
        var nc = 0;
        var nr = this.array.length;
        for (var r = 0; r < nr; ++r) {
            var inrow = this.array[r];
            nc = Math.max(nc, inrow.length);
            // The "inner" is in mathstyleName. Create a **new** context for the
            // cells, with the same mathstyleName, but this will prevent the
            // style correction from being applied twice
            var cellContext = new context_1.Context({ parent: innerContext, mathstyle: this.mathstyleName }, this.style);
            var height = arstrutHeight / cellContext.scalingFactor; // \@array adds an \@arstrut
            var depth = arstrutDepth / cellContext.scalingFactor; // To each row (via the template)
            var outrow = { cells: [], height: 0, depth: 0, pos: 0 };
            for (var _i = 0, inrow_1 = inrow; _i < inrow_1.length; _i++) {
                var element = inrow_1[_i];
                var elt = (_c = atom_class_1.Atom.createBox(cellContext, element, { type: 'ignore' })) !== null && _c !== void 0 ? _c : new box_1.Box(null, { type: 'ignore' });
                depth = Math.max(depth, elt.depth);
                height = Math.max(height, elt.height);
                outrow.cells.push(elt);
            }
            var gap = (_d = (0, registers_utils_1.convertDimensionToEm)(this.rowGaps[r])) !== null && _d !== void 0 ? _d : 0;
            if (gap > 0) {
                // \@argarraycr
                gap += arstrutDepth;
                depth = Math.max(depth, gap); // \@xargarraycr
                gap = 0;
            }
            // If not last row, add 'jot' of depth
            // This does not apply to matrix environments, and cases.
            // It *does* appear to apply to `dcases` and `rcases` environments
            if (r < nr - 1 &&
                !(0, environment_types_1.isMatrixEnvironment)(this.environmentName) &&
                this.environmentName !== 'cases' &&
                this.environmentName !== 'array')
                depth += innerContext.getRegisterAsEm('jot');
            outrow.height = height;
            outrow.depth = depth;
            totalHeight += height;
            outrow.pos = totalHeight;
            totalHeight += depth + gap; // \@yargarraycr
            body.push(outrow);
        }
        var offset = totalHeight / 2 + font_metrics_1.AXIS_HEIGHT;
        var contentCols = [];
        for (var colIndex = 0; colIndex < nc; colIndex++) {
            var stack = [];
            for (var _g = 0, body_1 = body; _g < body_1.length; _g++) {
                var row = body_1[_g];
                var element = row.cells[colIndex];
                element.depth = row.depth;
                element.height = row.height;
                stack.push({ box: element, shift: row.pos - offset });
            }
            if (stack.length > 0)
                contentCols.push(new v_box_1.VBox({ individualShift: stack }));
        }
        // Iterate over each column description.
        // Each `colDesc` will indicate whether to insert a gap, a rule or
        // a column from 'contentCols'
        var cols = [];
        var previousColContent = false;
        var previousColRule = false;
        var currentContentCol = 0;
        var firstColumn = !this.leftDelim;
        var colFormat = this.colFormat;
        for (var _h = 0, colFormat_2 = colFormat; _h < colFormat_2.length; _h++) {
            var colDesc = colFormat_2[_h];
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
                }
                else if (previousColRule || firstColumn) {
                    // If the previous column was a rule or this is the first column
                    // add a smaller gap
                    cols.push(makeColGap(arraycolsep));
                }
                cols.push(new box_1.Box(contentCols[currentContentCol], {
                    classes: 'col-align-' + colDesc.align
                }));
                currentContentCol++;
                previousColContent = true;
                previousColRule = false;
                firstColumn = false;
            }
            else if ('gap' in colDesc) {
                //
                // Something to insert in between columns of content
                //
                if (typeof colDesc.gap === 'number') {
                    // It's a number, indicating how much space, in em,
                    // to leave in between columns
                    cols.push(makeColGap(colDesc.gap));
                }
                else {
                    // It's a list of atoms.
                    // Create a column made up of the mathlist
                    // as many times as there are rows.
                    var col = makeColOfRepeatingElements(context, body, offset, colDesc.gap);
                    if (col)
                        cols.push(col);
                }
                previousColContent = false;
                previousColRule = false;
                firstColumn = false;
            }
            else if ('separator' in colDesc) {
                //
                // It's a column separator.
                //
                var separator = new box_1.Box(null, { classes: 'ML__vertical-separator' });
                separator.height = totalHeight;
                separator.setStyle('height', totalHeight, 'em');
                separator.setStyle('border-right', "".concat(arrayRuleWidth, "em ").concat(colDesc.separator, " currentColor"));
                // We have box-sizing border-box, no need to correct the margin
                // separator.setStyle(
                //   'margin',
                //   `0 -${context.metrics.arrayRuleWidth / 2}em`
                // );
                separator.setStyle('vertical-align', -(totalHeight - offset), 'em');
                var gap = 0;
                if (previousColRule)
                    gap = doubleRuleSep - arrayRuleWidth;
                else if (previousColContent)
                    gap = arraycolsep - arrayRuleWidth;
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
        var inner = new box_1.Box(cols, { classes: 'ML__mtable' });
        if ((!this.leftDelim || this.leftDelim === '.') &&
            (!this.rightDelim || this.rightDelim === '.')) {
            // There are no delimiters around the array, just return what
            // we've built so far.
            if (this.caret)
                inner.caret = this.caret;
            return this.bind(context, inner);
        }
        // There is at least one delimiter. Wrap the inner of the array with
        // appropriate left and right delimiters
        var innerHeight = inner.height;
        var innerDepth = inner.depth;
        var base = this.bind(context, new box_1.Box([
            this.bind(context, (0, delimiters_1.makeLeftRightDelim)('open', (_e = this.leftDelim) !== null && _e !== void 0 ? _e : '.', innerHeight, innerDepth, innerContext, { isSelected: this.isSelected })),
            inner,
            this.bind(context, (0, delimiters_1.makeLeftRightDelim)('close', (_f = this.rightDelim) !== null && _f !== void 0 ? _f : '.', innerHeight, innerDepth, innerContext, { isSelected: this.isSelected })),
        ], { type: 'ord' }));
        if (!base)
            return null;
        base.setStyle('display', 'inline-block');
        if (this.caret)
            base.caret = this.caret;
        return this.bind(context, this.attachSupsub(context, { base: base }));
    };
    ArrayAtom.prototype._serialize = function (options) {
        var _a;
        var result = [];
        if (this.environmentName === 'lines')
            result.push("{\\displaylines");
        else
            result.push("\\begin{".concat(this.environmentName, "}"));
        if (this.environmentName === 'array') {
            result.push('{');
            if (this.colFormat !== undefined) {
                for (var _i = 0, _b = this.colFormat; _i < _b.length; _i++) {
                    var format = _b[_i];
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
        for (var row = 0; row < this.array.length; row++) {
            for (var col = 0; col < this.array[row].length; col++) {
                if (col > 0)
                    result.push(' & ');
                result.push(atom_class_1.Atom.serialize(this.array[row][col], options));
            }
            // Adds a separator between rows (but not after the last row)
            if (row < this.array.length - 1) {
                var gap = this.rowGaps[row];
                if (gap === null || gap === void 0 ? void 0 : gap.dimension)
                    result.push("\\\\[".concat(gap.dimension, " ").concat((_a = gap.unit) !== null && _a !== void 0 ? _a : 'pt', "] "));
                else
                    result.push('\\\\ ');
            }
        }
        if (this.environmentName === 'lines')
            result.push("}");
        else
            result.push("\\end{".concat(this.environmentName, "}"));
        return (0, tokenizer_1.joinLatex)(result);
    };
    ArrayAtom.prototype.forEachCell = function (callback) {
        for (var i = 0; i < this.rowCount; i++)
            for (var j = 0; j < this.colCount; j++)
                callback(this.array[i][j], i, j);
    };
    ArrayAtom.prototype.getCell = function (row, col) {
        return this.array[row][col];
    };
    ArrayAtom.prototype.setCell = function (row, column, value) {
        console.assert(this.type === 'array' &&
            Array.isArray(this.array) &&
            this.array[row][column] !== undefined);
        for (var _i = 0, _a = this.array[row][column]; _i < _a.length; _i++) {
            var atom = _a[_i];
            atom.parent = undefined;
            atom.parentBranch = undefined;
        }
        var atoms = value;
        if (value.length === 0 || value[0].type !== 'first')
            atoms = __spreadArray([new atom_class_1.Atom({ type: 'first', mode: this.mode })], value, true);
        this.array[row][column] = atoms;
        for (var _b = 0, atoms_1 = atoms; _b < atoms_1.length; _b++) {
            var atom = atoms_1[_b];
            atom.parent = this;
            atom.parentBranch = [row, column];
        }
        this.isDirty = true;
    };
    ArrayAtom.prototype.addRowBefore = function (row) {
        console.assert(this.type === 'array' && Array.isArray(this.array));
        var newRow = [];
        for (var i = 0; i < this.colCount; i++)
            newRow.push(makePlaceholderCell(this));
        this.array.splice(row, 0, newRow);
        for (var i = row; i < this.rowCount; i++) {
            for (var j = 0; j < this.colCount; j++) {
                var atoms = this.array[i][j];
                if (atoms)
                    for (var _i = 0, atoms_2 = atoms; _i < atoms_2.length; _i++) {
                        var atom = atoms_2[_i];
                        atom.parentBranch = [i, j];
                    }
            }
        }
        this.isDirty = true;
    };
    ArrayAtom.prototype.addRowAfter = function (row) {
        console.assert(this.type === 'array' && Array.isArray(this.array));
        var newRow = [];
        for (var i = 0; i < this.colCount; i++)
            newRow.push(makePlaceholderCell(this));
        this.array.splice(row + 1, 0, newRow);
        for (var i = row + 1; i < this.rowCount; i++) {
            for (var j = 0; j < this.colCount; j++) {
                var atoms = this.array[i][j];
                if (atoms)
                    for (var _i = 0, atoms_3 = atoms; _i < atoms_3.length; _i++) {
                        var atom = atoms_3[_i];
                        atom.parentBranch = [i, j];
                    }
            }
        }
        this.isDirty = true;
    };
    ArrayAtom.prototype.removeRow = function (row) {
        console.assert(this.type === 'array' && Array.isArray(this.array) && this.rowCount > row);
        var deleted = this.array.splice(row, 1);
        for (var _i = 0, deleted_1 = deleted; _i < deleted_1.length; _i++) {
            var column = deleted_1[_i];
            for (var _a = 0, column_1 = column; _a < column_1.length; _a++) {
                var cell = column_1[_a];
                if (cell) {
                    for (var _b = 0, cell_3 = cell; _b < cell_3.length; _b++) {
                        var child = cell_3[_b];
                        child.parent = undefined;
                        child.parentBranch = undefined;
                    }
                }
            }
        }
        for (var i = row; i < this.rowCount; i++) {
            for (var j = 0; j < this.colCount; j++) {
                var atoms = this.array[i][j];
                if (atoms)
                    for (var _c = 0, atoms_4 = atoms; _c < atoms_4.length; _c++) {
                        var atom = atoms_4[_c];
                        atom.parentBranch = [i, j];
                    }
            }
        }
        this.isDirty = true;
    };
    ArrayAtom.prototype.addColumnBefore = function (col) {
        console.assert(this.type === 'array' && Array.isArray(this.array));
        for (var _i = 0, _a = this.array; _i < _a.length; _i++) {
            var row = _a[_i];
            row.splice(col, 0, makePlaceholderCell(this));
        }
        for (var i = 0; i < this.rowCount; i++) {
            for (var j = col; j < this.colCount; j++) {
                var atoms = this.array[i][j];
                if (atoms)
                    for (var _b = 0, atoms_5 = atoms; _b < atoms_5.length; _b++) {
                        var atom = atoms_5[_b];
                        atom.parentBranch = [i, j];
                    }
            }
        }
        this.isDirty = true;
    };
    ArrayAtom.prototype.addColumnAfter = function (col) {
        console.assert(this.type === 'array' && Array.isArray(this.array));
        for (var _i = 0, _a = this.array; _i < _a.length; _i++) {
            var row = _a[_i];
            row.splice(col + 1, 0, makePlaceholderCell(this));
        }
        for (var i = 0; i < this.rowCount; i++) {
            for (var j = col + 1; j < this.colCount; j++) {
                var atoms = this.array[i][j];
                if (atoms)
                    for (var _b = 0, atoms_6 = atoms; _b < atoms_6.length; _b++) {
                        var atom = atoms_6[_b];
                        atom.parentBranch = [i, j];
                    }
            }
        }
        this.isDirty = true;
    };
    ArrayAtom.prototype.addColumn = function () {
        this.addColumnAfter(this.colCount - 1);
    };
    ArrayAtom.prototype.removeColumn = function (col) {
        console.assert(this.type === 'array' && Array.isArray(this.array) && this.colCount > col);
        for (var _i = 0, _a = this.array; _i < _a.length; _i++) {
            var row = _a[_i];
            var deleted = row.splice(col, 1);
            for (var _b = 0, deleted_2 = deleted; _b < deleted_2.length; _b++) {
                var cell = deleted_2[_b];
                if (cell) {
                    for (var _c = 0, cell_4 = cell; _c < cell_4.length; _c++) {
                        var child = cell_4[_c];
                        child.parent = undefined;
                        child.parentBranch = undefined;
                    }
                }
            }
        }
        for (var i = 0; i < this.rowCount; i++) {
            for (var j = col; j < this.colCount; j++) {
                var atoms = this.array[i][j];
                if (atoms)
                    for (var _d = 0, atoms_7 = atoms; _d < atoms_7.length; _d++) {
                        var atom = atoms_7[_d];
                        atom.parentBranch = [i, j];
                    }
            }
        }
        this.isDirty = true;
    };
    Object.defineProperty(ArrayAtom.prototype, "cells", {
        get: function () {
            var result = [];
            for (var _i = 0, _a = this.array; _i < _a.length; _i++) {
                var row = _a[_i];
                for (var _b = 0, row_3 = row; _b < row_3.length; _b++) {
                    var cell = row_3[_b];
                    if (cell)
                        result.push(cell.filter(function (x) { return x.type !== 'first'; }));
                }
            }
            return result;
        },
        enumerable: false,
        configurable: true
    });
    return ArrayAtom;
}(atom_class_1.Atom));
exports.ArrayAtom = ArrayAtom;
/**
 * Create a matrix cell with a placeholder atom in it.
 */
function makePlaceholderCell(parent) {
    var first = new atom_class_1.Atom({ type: 'first', mode: parent.mode });
    first.parent = parent;
    var placeholder = new placeholder_1.PlaceholderAtom();
    placeholder.parent = parent;
    return [first, placeholder];
}
/**
 * Create a column separator box.
 */
function makeColGap(width) {
    var result = new box_1.Box(null, { classes: 'ML__arraycolsep' });
    result.width = width;
    return result;
}
/**
 * Create a column of repeating elements.
 */
function makeColOfRepeatingElements(context, rows, offset, element) {
    if (!element)
        return null;
    var col = [];
    for (var _i = 0, rows_2 = rows; _i < rows_2.length; _i++) {
        var row = rows_2[_i];
        var cell = atom_class_1.Atom.createBox(context, element, { type: 'ignore' });
        if (cell) {
            cell.depth = row.depth;
            cell.height = row.height;
            col.push({ box: cell, shift: row.pos - offset });
        }
    }
    return new v_box_1.VBox({ individualShift: col }).wrap(context);
}
