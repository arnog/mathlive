"use strict";
/* eslint-disable no-new */
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
exports.MathModeEditor = void 0;
var render_1 = require("./render");
var delimiters_1 = require("../core/delimiters");
var parser_1 = require("../core/parser");
var atom_1 = require("../core/atom");
var array_1 = require("../atoms/array");
var leftright_1 = require("../atoms/leftright");
var selection_utils_1 = require("../editor-model/selection-utils");
var styling_1 = require("../editor-model/styling");
var parse_math_string_1 = require("../formats/parse-math-string");
var mode_editor_1 = require("./mode-editor");
var MathModeEditor = /** @class */ (function (_super) {
    __extends(MathModeEditor, _super);
    function MathModeEditor() {
        return _super.call(this, 'math') || this;
    }
    MathModeEditor.prototype.onPaste = function (mathfield, data) {
        var _a;
        if (!data)
            return false;
        if (!mathfield.model.contentWillChange({
            data: typeof data === 'string' ? data : null,
            dataTransfer: typeof data === 'string' ? null : data,
            inputType: 'insertFromPaste'
        }))
            return false;
        var text = '';
        var format = 'auto';
        //
        // 1/ Try to get serialized atoms
        //
        var json = typeof data !== 'string' ? data.getData('application/json+mathlive') : '';
        if (json) {
            try {
                var atomJson = JSON.parse(json);
                if (atomJson && Array.isArray(atomJson)) {
                    mathfield.snapshot();
                    var atoms = (0, atom_1.fromJson)(atomJson);
                    var model = mathfield.model;
                    if (!model.selectionIsCollapsed)
                        model.deleteAtoms((0, selection_utils_1.range)(model.selection));
                    var cursor = model.at(model.position);
                    if (cursor.parent instanceof array_1.ArrayAtom) {
                        console.assert(cursor.parentBranch !== undefined);
                        // use 'first' atoms as environment column delimiter
                        var columns = [];
                        var buffer = [];
                        // trim 'first' from array of atoms
                        if (atoms[0].type === 'first')
                            atoms.shift();
                        if (atoms[atoms.length - 1].type === 'first')
                            atoms.pop();
                        for (var _i = 0, atoms_1 = atoms; _i < atoms_1.length; _i++) {
                            var atom = atoms_1[_i];
                            if (atom.type === 'first' && buffer.length > 0) {
                                columns.push(buffer);
                                buffer = [atom];
                            }
                            else
                                buffer.push(atom);
                        }
                        if (buffer.length > 0)
                            columns.push(buffer);
                        // expand environment columns to paste size
                        var currentRow = Number(cursor.parentBranch[0]);
                        var currentColumn = Number(cursor.parentBranch[1]);
                        var maxColumns = cursor.parent.maxColumns;
                        while (cursor.parent.colCount - currentColumn < columns.length &&
                            cursor.parent.colCount < maxColumns)
                            cursor.parent.addColumn();
                        // add content to the first cell
                        cursor.parent.addChildrenAfter(columns[0], cursor);
                        // replace the rest of the columns
                        for (var i = 1; i < columns.length; i++) {
                            currentColumn++;
                            if (currentColumn >= maxColumns) {
                                currentColumn = 0;
                                cursor.parent.addRowAfter(currentRow);
                                currentRow++;
                            }
                            cursor.parent.setCell(currentRow, currentColumn, columns[i]);
                        }
                    }
                    else {
                        cursor.parent.addChildrenAfter(atoms.filter(function (a) { return a.type !== 'first'; }), cursor);
                    }
                    model.position = model.offsetOf(atoms[atoms.length - 1]);
                    model.contentDidChange({ inputType: 'insertFromPaste' });
                    (0, render_1.requestUpdate)(mathfield);
                    return true;
                }
            }
            catch (_b) { }
        }
        //
        // 2/ Try to get a MathJSON data type
        //
        json = typeof data !== 'string' ? data.getData('application/json') : '';
        if (json && globalThis.MathfieldElement.computeEngine) {
            try {
                var expr = JSON.parse(json);
                if (typeof expr === 'object' && 'latex' in expr && expr.latex)
                    text = expr.latex;
                if (!text) {
                    var box = globalThis.MathfieldElement.computeEngine.box(expr);
                    if (box && !box.has('Error'))
                        text = box.latex;
                }
                if (!text)
                    format = 'latex';
            }
            catch (_c) { }
        }
        //
        // 3/ Try to get raw LaTeX
        //
        if (!text && typeof data !== 'string') {
            text = data.getData('application/x-latex');
            if (text)
                format = 'latex';
        }
        //
        // 4/ If that didn't work, try some plain text
        // (could be LaTeX, could be ASCIIMath)
        //
        if (!text)
            text = typeof data === 'string' ? data : data.getData('text/plain');
        if (text) {
            var wasLatex = void 0;
            _a = (0, parse_math_string_1.trimModeShiftCommand)(text), wasLatex = _a[0], text = _a[1];
            if (format === 'auto' && wasLatex)
                format = 'latex';
            mathfield.stopCoalescingUndo();
            mathfield.stopRecording();
            if (this.insert(mathfield.model, text, { format: format })) {
                mathfield.startRecording();
                mathfield.snapshot('paste');
                (0, render_1.requestUpdate)(mathfield);
            }
            mathfield.startRecording();
            return true;
        }
        return false;
    };
    MathModeEditor.prototype.insert = function (model, input, options) {
        var _a;
        var _b, _c;
        var data = typeof input === 'string'
            ? input
            : (_c = (_b = globalThis.MathfieldElement.computeEngine) === null || _b === void 0 ? void 0 : _b.box(input).latex) !== null && _c !== void 0 ? _c : '';
        if (!options.silenceNotifications &&
            !model.contentWillChange({ data: data, inputType: 'insertText' }))
            return false;
        if (!options.insertionMode)
            options.insertionMode = 'replaceSelection';
        if (!options.selectionMode)
            options.selectionMode = 'placeholder';
        if (!options.format)
            options.format = 'auto';
        var silenceNotifications = model.silenceNotifications;
        if (options.silenceNotifications)
            model.silenceNotifications = true;
        var contentWasChanging = model.silenceNotifications;
        model.silenceNotifications = true;
        //
        // 1/ Calculate the arguments (#0, #@, #?)
        //
        var args = {
            '?': '\\placeholder{}',
            '@': '\\placeholder{}'
        };
        // 1.1/ Save the content of the selection, if any
        args[0] =
            options.insertionMode === 'replaceAll'
                ? ''
                : model.getValue(model.selection, 'latex-unstyled');
        //
        // Delete any selected items
        //
        if (options.insertionMode === 'replaceSelection')
            model.deleteAtoms((0, selection_utils_1.range)(model.selection));
        else if (options.insertionMode === 'replaceAll')
            model.deleteAtoms();
        else if (options.insertionMode === 'insertBefore')
            model.collapseSelection('backward');
        else if (options.insertionMode === 'insertAfter')
            model.collapseSelection('forward');
        //
        // Delete any placeholders before or after the insertion point
        //
        if (!model.at(model.position).isLastSibling &&
            model.at(model.position + 1).type === 'placeholder') {
            // Before a `placeholder`
            model.deleteAtoms([model.position, model.position + 1]);
        }
        else if (model.at(model.position).type === 'placeholder') {
            // After a `placeholder`
            model.deleteAtoms([model.position - 1, model.position]);
        }
        //
        // Calculate the implicit argument (#@)
        //
        var implicitArgumentOffset = -1;
        if (args[0]) {
            // There was a selection, we'll use it for #@
            args['@'] = args[0];
        }
        else if (typeof input === 'string' && /(^|[^\\])#@/.test(input)) {
            // We'll use the preceding `mord`s for it (implicit argument)
            implicitArgumentOffset = getImplicitArgOffset(model);
            if (implicitArgumentOffset >= 0) {
                args['@'] = model.getValue(implicitArgumentOffset, model.position, 'latex');
            }
        }
        if (!args[0])
            args[0] = args['?'];
        //
        // 2/ Make atoms for the input
        //
        var usedArg = false;
        var argFunction = function (arg) {
            usedArg = true;
            return args[arg];
        };
        var _d = convertStringToAtoms(model, input, argFunction, options), format = _d[0], newAtoms = _d[1];
        if (!newAtoms)
            return false;
        var insertingFraction = newAtoms.length === 1 && newAtoms[0].type === 'genfrac';
        if (insertingFraction &&
            implicitArgumentOffset >= 0 &&
            typeof model.mathfield.options.isImplicitFunction === 'function' &&
            model.mathfield.options.isImplicitFunction(model.at(model.position).command)) {
            // If this is a fraction, and the implicit argument is a function,
            // try again, but without the implicit argument
            // If `\sin` and a fraction is inserted, we want `\sin \frac{}{}`,
            // not `\frac{\sin{}}{}`
            args['@'] = args['?'];
            usedArg = false;
            _a = convertStringToAtoms(model, input, argFunction, options), format = _a[0], newAtoms = _a[1];
        }
        else if (implicitArgumentOffset >= 0) {
            // Remove implicit argument
            model.deleteAtoms([implicitArgumentOffset, model.position]);
        }
        //
        // 3/ Insert the new atoms
        //
        var parent = model.at(model.position).parent;
        var hadEmptyBody = parent.hasEmptyBranch('body');
        // Are we inserting a fraction inside a leftright?
        if (insertingFraction &&
            format !== 'latex' &&
            model.mathfield.options.removeExtraneousParentheses &&
            parent instanceof leftright_1.LeftRightAtom &&
            parent.leftDelim === '(' &&
            hadEmptyBody) {
            // Remove the leftright
            // i.e. `\left(\frac{}{}\right))` -> `\frac{}{}`
            var newParent = parent.parent;
            var branch = parent.parentBranch;
            newParent.removeChild(parent);
            newParent.setChildren(newAtoms, branch);
        }
        var cursor = model.at(model.position);
        cursor.parent.addChildrenAfter(newAtoms, cursor);
        if (format === 'latex' && typeof input === 'string') {
            // If we are given a latex string with no arguments, store it as
            // "verbatim latex".
            // Caution: we can only do this if the `serialize()` for this parent
            // would return an empty string. If the latex is generated using other
            // properties than parent.body, for example by adding '\left.' and
            // '\right.' with a 'leftright' type, we can't use this shortcut.
            if ((parent === null || parent === void 0 ? void 0 : parent.type) === 'root' && hadEmptyBody && !usedArg)
                parent.verbatimLatex = input;
        }
        //
        // 4/ Prepare to dispatch notifications
        // (for selection changes, then content change)
        //
        model.silenceNotifications = contentWasChanging;
        var lastNewAtom = newAtoms[newAtoms.length - 1];
        //
        // Update the anchor's location
        //
        if (options.selectionMode === 'placeholder') {
            // Move to the next placeholder
            var placeholder = newAtoms
                .flatMap(function (x) { return __spreadArray([x], x.children, true); })
                .find(function (x) { return x.type === 'placeholder'; });
            if (placeholder) {
                var placeholderOffset = model.offsetOf(placeholder);
                model.setSelection(placeholderOffset - 1, placeholderOffset);
                model.announce('move'); // Should have placeholder selected
            }
            else if (lastNewAtom) {
                // No placeholder found, move to right after what we just inserted
                model.position = model.offsetOf(lastNewAtom);
            }
        }
        else if (options.selectionMode === 'before') {
            // Do nothing: don't change the position.
        }
        else if (options.selectionMode === 'after') {
            if (lastNewAtom)
                model.position = model.offsetOf(lastNewAtom);
        }
        else if (options.selectionMode === 'item')
            model.setSelection(model.anchor, model.offsetOf(lastNewAtom));
        model.contentDidChange({ data: data, inputType: 'insertText' });
        model.silenceNotifications = silenceNotifications;
        return true;
    };
    return MathModeEditor;
}(mode_editor_1.ModeEditor));
exports.MathModeEditor = MathModeEditor;
function convertStringToAtoms(model, s, args, options) {
    var _a, _b, _c, _d;
    var _e;
    var format = undefined;
    var result = [];
    if (typeof s !== 'string' || options.format === 'math-json') {
        var ce = globalThis.MathfieldElement.computeEngine;
        if (!ce)
            return ['math-json', []];
        _a = ['latex', ce.box(s).latex], format = _a[0], s = _a[1];
        result = (0, parser_1.parseLatex)(s, { context: model.mathfield.context });
    }
    else if (typeof s === 'string' && options.format === 'ascii-math') {
        _b = (0, parse_math_string_1.parseMathString)(s, {
            format: 'ascii-math',
            inlineShortcuts: model.mathfield.options.inlineShortcuts
        }), format = _b[0], s = _b[1];
        result = (0, parser_1.parseLatex)(s, { context: model.mathfield.context });
        // Simplify result.
        if (format !== 'latex' &&
            model.mathfield.options.removeExtraneousParentheses)
            result = result.map(function (x) { return removeExtraneousParenthesis(x); });
    }
    else if (options.format === 'auto' || ((_e = options.format) === null || _e === void 0 ? void 0 : _e.startsWith('latex'))) {
        if (options.format === 'auto') {
            _c = (0, parse_math_string_1.parseMathString)(s, {
                format: 'auto',
                inlineShortcuts: model.mathfield.options.inlineShortcuts
            }), format = _c[0], s = _c[1];
        }
        // If the whole string is bracketed by a mode shift command, remove it
        if (options.format === 'latex')
            _d = (0, parse_math_string_1.trimModeShiftCommand)(s), s = _d[1];
        result = (0, parser_1.parseLatex)(s, {
            context: model.mathfield.context,
            args: args
        });
        // Simplify result.
        if (options.format !== 'latex' &&
            model.mathfield.options.removeExtraneousParentheses)
            result = result.map(function (x) { return removeExtraneousParenthesis(x); });
    }
    //
    // Some atoms may already have a style (for example if there was an
    // argument, i.e. the selection, that this was applied to).
    // So, don't apply style to atoms that are already styled, but *do*
    // apply it to newly created atoms that have no style yet.
    //
    (0, styling_1.applyStyleToUnstyledAtoms)(result, options.style);
    return [format !== null && format !== void 0 ? format : 'latex', result];
}
function removeExtraneousParenthesis(atom) {
    var _a;
    if (atom instanceof leftright_1.LeftRightAtom &&
        atom.leftDelim !== '(' &&
        atom.rightDelim === ')') {
        var children = (_a = atom.body) === null || _a === void 0 ? void 0 : _a.filter(function (x) { return x.type !== 'first'; });
        // If this is a single frac inside a leftright: remove the leftright
        if ((children === null || children === void 0 ? void 0 : children.length) === 1 && children[0].type === 'genfrac')
            return children[0];
    }
    for (var _i = 0, _b = atom.branches; _i < _b.length; _i++) {
        var branch = _b[_i];
        if (!atom.hasEmptyBranch(branch)) {
            atom.setChildren(atom.branch(branch).map(function (x) { return removeExtraneousParenthesis(x); }), branch);
        }
    }
    if (atom instanceof array_1.ArrayAtom) {
        atom.forEachCell(function (cell, row, column) {
            atom.setCell(row, column, cell.map(function (x) { return removeExtraneousParenthesis(x); }));
        });
    }
    return atom;
}
/**
 * Locate the offset before the insertion point that would indicate
 * a good place to select as an implicit argument.
 *
 * For example with '1+\sin(x)', if the insertion point is at the
 * end, the implicit arg offset would be after the plus. As a result,
 * inserting a fraction after the sin would yield: '1+\frac{\sin(x)}{\placeholder{}}'
 */
function getImplicitArgOffset(model) {
    var atom = model.at(model.position);
    if (atom.mode === 'text') {
        while (!atom.isFirstSibling && atom.mode === 'text')
            atom = atom.leftSibling;
        return model.offsetOf(atom);
    }
    // Find the first 'mrel', 'mbin', etc... to the left of the insertion point
    // until the first sibling.
    // Terms inside of delimiters (parens, brackets, etc) are grouped and kept together.
    var atomAtCursor = atom;
    var afterDelim = false;
    if (atom.type === 'mclose') {
        var delim = delimiters_1.LEFT_DELIM[atom.value];
        while (!atom.isFirstSibling &&
            !(atom.type === 'mopen' && atom.value === delim))
            atom = atom.leftSibling;
        if (!atom.isFirstSibling)
            atom = atom.leftSibling;
        afterDelim = true;
    }
    else if (atom.type === 'leftright') {
        atom = atom.leftSibling;
        afterDelim = true;
    }
    if (afterDelim) {
        while (!atom.isFirstSibling && (atom.isFunction || isImplicitArg(atom)))
            atom = atom.leftSibling;
    }
    else {
        var delimiterStack = [];
        while (!atom.isFirstSibling &&
            (isImplicitArg(atom) || delimiterStack.length > 0)) {
            if (atom.type === 'mclose')
                delimiterStack.unshift(atom.value);
            if (atom.type === 'mopen' &&
                delimiterStack.length > 0 &&
                atom.value === delimiters_1.LEFT_DELIM[delimiterStack[0]])
                delimiterStack.shift();
            atom = atom.leftSibling;
        }
    }
    if (atomAtCursor === atom)
        return -1;
    return model.offsetOf(atom);
}
/**
 *
 * Predicate returns true if the atom should be considered an implicit argument.
 *
 * Used for example when typing "/" to insert a fraction: all the atoms to
 * the left of insertion point that return true for `isImplicitArg()` will
 * be included as the numerator
 */
function isImplicitArg(atom) {
    // A digit, or a decimal point
    if (atom.isDigit())
        return true;
    if (atom.type &&
        /^(mord|surd|subsup|leftright|mop|mclose)$/.test(atom.type)) {
        // Exclude `\int`, \`sum`, etc...
        if (atom.type === 'extensible-symbol')
            return false;
        return true;
    }
    return false;
}
new MathModeEditor();
