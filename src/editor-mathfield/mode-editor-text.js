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
exports.TextModeEditor = void 0;
var core_1 = require("../core/core");
var selection_utils_1 = require("../editor-model/selection-utils");
var styling_1 = require("../editor-model/styling");
var mode_editor_1 = require("./mode-editor");
var render_1 = require("./render");
var TextModeEditor = /** @class */ (function (_super) {
    __extends(TextModeEditor, _super);
    function TextModeEditor() {
        return _super.call(this, 'text') || this;
    }
    TextModeEditor.prototype.onPaste = function (mathfield, data) {
        if (!data)
            return false;
        var text = typeof data === 'string' ? data : data.getData('text/plain');
        if (text &&
            mathfield.model.contentWillChange({
                inputType: 'insertFromPaste',
                data: text
            })) {
            mathfield.stopCoalescingUndo();
            mathfield.stopRecording();
            if (this.insert(mathfield.model, text)) {
                mathfield.model.contentDidChange({ inputType: 'insertFromPaste' });
                mathfield.startRecording();
                mathfield.snapshot('paste');
                (0, render_1.requestUpdate)(mathfield);
            }
            mathfield.startRecording();
            return true;
        }
        return false;
    };
    TextModeEditor.prototype.insert = function (model, text, options) {
        if (options === void 0) { options = {}; }
        if (!model.contentWillChange({ data: text, inputType: 'insertText' }))
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
        // Delete any selected items
        //
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
        var newAtoms = convertStringToAtoms(text, model.mathfield.context);
        // Some atoms may already have a style (for example if there was an
        // argument, i.e. the selection, that this was applied to).
        // So, don't apply style to atoms that are already styled, but *do*
        // apply it to newly created atoms that have no style yet.
        (0, styling_1.applyStyleToUnstyledAtoms)(newAtoms, options.style);
        if (!newAtoms)
            return false;
        var cursor = model.at(model.position);
        var lastNewAtom = cursor.parent.addChildrenAfter(newAtoms, cursor);
        // Prepare to dispatch notifications
        // (for selection changes, then content change)
        model.silenceNotifications = contentWasChanging;
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
    return TextModeEditor;
}(mode_editor_1.ModeEditor));
exports.TextModeEditor = TextModeEditor;
function convertStringToAtoms(s, context) {
    // Map special TeX characters to alternatives
    // Must do this one first, since other replacements include backslash
    s = s.replace(/\\/g, '\\textbackslash ');
    s = s.replace(/#/g, '\\#');
    s = s.replace(/\$/g, '\\$');
    s = s.replace(/%/g, '\\%');
    s = s.replace(/&/g, '\\&');
    // S = s.replace(/:/g, '\\colon');     // text colon?
    // s = s.replace(/\[/g, '\\lbrack');
    // s = s.replace(/]/g, '\\rbrack');
    s = s.replace(/_/g, '\\_');
    s = s.replace(/{/g, '\\textbraceleft ');
    s = s.replace(/}/g, '\\textbraceright ');
    s = s.replace(/lbrace/g, '\\textbraceleft ');
    s = s.replace(/rbrace/g, '\\textbraceright ');
    s = s.replace(/\^/g, '\\textasciicircum ');
    s = s.replace(/~/g, '\\textasciitilde ');
    s = s.replace(/£/g, '\\textsterling ');
    return (0, core_1.parseLatex)(s, { context: context, parseMode: 'text' });
}
new TextModeEditor();
