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
exports.__esModule = true;
exports.getCommandSuggestionRange = exports.getLatexGroupBody = exports.getLatexGroup = exports.LatexModeEditor = void 0;
var latex_1 = require("../atoms/latex");
var selection_utils_1 = require("../editor-model/selection-utils");
var render_1 = require("./render");
var mode_editor_1 = require("./mode-editor");
var definitions_utils_1 = require("../latex-commands/definitions-utils");
var LatexModeEditor = /** @class */ (function (_super) {
    __extends(LatexModeEditor, _super);
    function LatexModeEditor() {
        return _super.call(this, 'latex') || this;
    }
    LatexModeEditor.prototype.createAtom = function (command) {
        return new latex_1.LatexAtom(command);
    };
    LatexModeEditor.prototype.onPaste = function (mathfield, data) {
        if (!data)
            return false;
        var text = typeof data === 'string'
            ? data
            : data.getData('application/x-latex') || data.getData('text/plain');
        if (text &&
            mathfield.model.contentWillChange({
                inputType: 'insertFromPaste',
                data: text
            })) {
            mathfield.stopCoalescingUndo();
            mathfield.stopRecording();
            if (this.insert(mathfield.model, text)) {
                mathfield.startRecording();
                mathfield.snapshot('paste');
                mathfield.model.contentDidChange({ inputType: 'insertFromPaste' });
                (0, render_1.requestUpdate)(mathfield);
            }
            mathfield.startRecording();
            return true;
        }
        return false;
    };
    LatexModeEditor.prototype.insert = function (model, text, options) {
        if (!model.contentWillChange({ data: text, inputType: 'insertText' }))
            return false;
        if (!options)
            options = {};
        if (!options.insertionMode)
            options.insertionMode = 'replaceSelection';
        if (!options.selectionMode)
            options.selectionMode = 'placeholder';
        var silenceNotifications = model.silenceNotifications;
        if (options.silenceNotifications)
            model.silenceNotifications = true;
        var saveSilenceNotifications = model.silenceNotifications;
        model.silenceNotifications = true;
        // Delete any selected items
        if (options.insertionMode === 'replaceSelection' &&
            !model.selectionIsCollapsed)
            model.deleteAtoms((0, selection_utils_1.range)(model.selection));
        else if (options.insertionMode === 'replaceAll') {
            model.root.setChildren([], 'body');
            model.position = 0;
        }
        else if (options.insertionMode === 'insertBefore')
            model.collapseSelection('backward');
        else if (options.insertionMode === 'insertAfter')
            model.collapseSelection('forward');
        // Short-circuit the tokenizer and parser when in LaTeX mode
        var newAtoms = [];
        for (var _i = 0, text_1 = text; _i < text_1.length; _i++) {
            var c = text_1[_i];
            if (definitions_utils_1.COMMAND_MODE_CHARACTERS.test(c))
                newAtoms.push(new latex_1.LatexAtom(c));
        }
        //
        // Insert the new atoms
        //
        var cursor = model.at(model.position);
        // In some cases (after a SelectAll command, for example), the cursor
        // can be positoned *after* the LatexGroup. In that case, adjust to be
        // the last atom inside the LatexGroup.
        if (cursor instanceof latex_1.LatexGroupAtom)
            cursor = cursor.lastChild;
        // If there is no LatexGroup (for example, it was deleted, but we're still
        // in LaTeX mode), insert one.
        if (!(cursor.parent instanceof latex_1.LatexGroupAtom)) {
            var group = new latex_1.LatexGroupAtom();
            cursor.parent.addChildAfter(group, cursor);
            cursor = group.firstChild;
        }
        var lastNewAtom = cursor.parent.addChildrenAfter(newAtoms, cursor);
        // Prepare to dispatch notifications
        model.silenceNotifications = saveSilenceNotifications;
        if (options.selectionMode === 'before') {
            // Do nothing: don't change the position.
        }
        else if (options.selectionMode === 'item')
            model.setSelection(model.anchor, model.offsetOf(lastNewAtom));
        else if (lastNewAtom)
            model.position = model.offsetOf(lastNewAtom);
        model.contentDidChange({ data: text, inputType: 'insertText' });
        model.silenceNotifications = silenceNotifications;
        return true;
    };
    return LatexModeEditor;
}(mode_editor_1.ModeEditor));
exports.LatexModeEditor = LatexModeEditor;
function getLatexGroup(model) {
    return model.atoms.find(function (x) { return x.type === 'latexgroup'; });
}
exports.getLatexGroup = getLatexGroup;
function getLatexGroupBody(model) {
    var _a, _b;
    var atom = getLatexGroup(model);
    return (_b = (_a = atom === null || atom === void 0 ? void 0 : atom.body) === null || _a === void 0 ? void 0 : _a.filter(function (x) { return x.type === 'latex'; })) !== null && _b !== void 0 ? _b : [];
}
exports.getLatexGroupBody = getLatexGroupBody;
function getCommandSuggestionRange(model, options) {
    var _a;
    var start = 0;
    var found = false;
    var last = Number.isFinite(options === null || options === void 0 ? void 0 : options.before)
        ? (_a = options === null || options === void 0 ? void 0 : options.before) !== null && _a !== void 0 ? _a : 0
        : model.lastOffset;
    while (start <= last && !found) {
        var atom = model.at(start);
        found = atom instanceof latex_1.LatexAtom && atom.isSuggestion;
        if (!found)
            start++;
    }
    if (!found)
        return [undefined, undefined];
    var end = start;
    var done = false;
    while (end <= last && !done) {
        var atom = model.at(end);
        done = !(atom instanceof latex_1.LatexAtom && atom.isSuggestion);
        if (!done)
            end++;
    }
    return [start - 1, end - 1];
}
exports.getCommandSuggestionRange = getCommandSuggestionRange;
new LatexModeEditor();
