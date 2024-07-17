"use strict";
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
exports.complete = exports.acceptCommandSuggestion = exports.updateAutocomplete = exports.removeSuggestion = void 0;
var latex_1 = require("../atoms/latex");
var definitions_utils_1 = require("../latex-commands/definitions-utils");
var suggestion_popover_1 = require("../editor/suggestion-popover");
var render_1 = require("./render");
var mode_editor_latex_1 = require("./mode-editor-latex");
var mode_editor_1 = require("./mode-editor");
function removeSuggestion(mathfield) {
    var group = (0, mode_editor_latex_1.getLatexGroupBody)(mathfield.model).filter(function (x) { return x.isSuggestion; });
    if (group.length === 0)
        return;
    mathfield.model.position = mathfield.model.offsetOf(group[0].leftSibling);
    for (var _i = 0, group_1 = group; _i < group_1.length; _i++) {
        var atom = group_1[_i];
        atom.parent.removeChild(atom);
    }
}
exports.removeSuggestion = removeSuggestion;
function updateAutocomplete(mathfield, options) {
    var _a;
    var model = mathfield.model;
    // Remove any error indicator and any suggestions
    removeSuggestion(mathfield);
    for (var _i = 0, _b = (0, mode_editor_latex_1.getLatexGroupBody)(model); _i < _b.length; _i++) {
        var atom_1 = _b[_i];
        atom_1.isError = false;
    }
    if (!model.selectionIsCollapsed ||
        mathfield.options.popoverPolicy === 'off') {
        (0, suggestion_popover_1.hideSuggestionPopover)(mathfield);
        return;
    }
    // The current command is the sequence of atoms around the insertion point
    // that ends on the left with a '\' and on the right with a non-command
    // character.
    var commandAtoms = [];
    var atom = model.at(model.position);
    while (atom && atom instanceof latex_1.LatexAtom && /^[a-zA-Z\*]$/.test(atom.value))
        atom = atom.leftSibling;
    if (atom && atom instanceof latex_1.LatexAtom && atom.value === '\\') {
        // We've found the start of a command.
        // Go forward and collect the potential atoms of the command
        commandAtoms.push(atom);
        atom = atom.rightSibling;
        while (atom &&
            atom instanceof latex_1.LatexAtom &&
            /^[a-zA-Z\*]$/.test(atom.value)) {
            commandAtoms.push(atom);
            atom = atom.rightSibling;
        }
    }
    var command = commandAtoms.map(function (x) { return x.value; }).join('');
    var suggestions = (0, definitions_utils_1.suggest)(mathfield, command);
    if (suggestions.length === 0) {
        // This looks like a command name, but not a known one
        if (/^\\[a-zA-Z\*]+$/.test(command))
            for (var _c = 0, commandAtoms_1 = commandAtoms; _c < commandAtoms_1.length; _c++) {
                var atom_2 = commandAtoms_1[_c];
                atom_2.isError = true;
            }
        (0, suggestion_popover_1.hideSuggestionPopover)(mathfield);
        return;
    }
    var index = (_a = options === null || options === void 0 ? void 0 : options.atIndex) !== null && _a !== void 0 ? _a : 0;
    mathfield.suggestionIndex =
        index < 0 ? suggestions.length - 1 : index % suggestions.length;
    var suggestion = suggestions[mathfield.suggestionIndex];
    if (suggestion !== command) {
        var lastAtom = commandAtoms[commandAtoms.length - 1];
        lastAtom.parent.addChildrenAfter(__spreadArray([], suggestion.slice(command.length - suggestion.length), true).map(function (x) { return new latex_1.LatexAtom(x, { isSuggestion: true }); }), lastAtom);
        (0, render_1.render)(mathfield, { interactive: true });
    }
    (0, suggestion_popover_1.showSuggestionPopover)(mathfield, suggestions);
}
exports.updateAutocomplete = updateAutocomplete;
function acceptCommandSuggestion(model) {
    var _a = (0, mode_editor_latex_1.getCommandSuggestionRange)(model, {
        before: model.position
    }), from = _a[0], to = _a[1];
    if (from === undefined || to === undefined)
        return false;
    var result = false;
    model.getAtoms([from, to]).forEach(function (x) {
        if (x.isSuggestion) {
            x.isSuggestion = false;
            result = true;
        }
    });
    return result;
}
exports.acceptCommandSuggestion = acceptCommandSuggestion;
/**
 * When in LaTeX mode, insert the LaTeX being edited and leave LaTeX mode
 *
 */
function complete(mathfield, completion, options) {
    var _a, _b;
    if (completion === void 0) { completion = 'accept'; }
    (0, suggestion_popover_1.hideSuggestionPopover)(mathfield);
    var latexGroup = (0, mode_editor_latex_1.getLatexGroup)(mathfield.model);
    if (!latexGroup)
        return false;
    if (completion === 'accept-suggestion' || completion === 'accept-all') {
        var suggestions = (0, mode_editor_latex_1.getLatexGroupBody)(mathfield.model).filter(function (x) { return x.isSuggestion; });
        if (suggestions.length !== 0) {
            for (var _i = 0, suggestions_1 = suggestions; _i < suggestions_1.length; _i++) {
                var suggestion = suggestions_1[_i];
                suggestion.isSuggestion = false;
            }
            mathfield.model.position = mathfield.model.offsetOf(suggestions[suggestions.length - 1]);
        }
        if (completion === 'accept-suggestion')
            return suggestions.length !== 0;
    }
    var body = (0, mode_editor_latex_1.getLatexGroupBody)(mathfield.model).filter(function (x) { return !x.isSuggestion; });
    var latex = body.map(function (x) { return x.value; }).join('');
    var newPos = latexGroup.leftSibling;
    latexGroup.parent.removeChild(latexGroup);
    mathfield.model.position = mathfield.model.offsetOf(newPos);
    mathfield.switchMode((_a = options === null || options === void 0 ? void 0 : options.mode) !== null && _a !== void 0 ? _a : 'math');
    if (completion === 'reject')
        return true;
    mode_editor_1.ModeEditor.insert(mathfield.model, latex, {
        selectionMode: ((_b = options === null || options === void 0 ? void 0 : options.selectItem) !== null && _b !== void 0 ? _b : false) ? 'item' : 'placeholder',
        format: 'latex',
        mode: 'math'
    });
    mathfield.snapshot();
    mathfield.model.announce('replacement');
    mathfield.switchMode('math');
    return true;
}
exports.complete = complete;
