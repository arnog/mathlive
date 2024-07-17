"use strict";
exports.__esModule = true;
exports.ModeEditor = exports.defaultExportHook = void 0;
var text_1 = require("../atoms/text");
var selection_utils_1 = require("../editor-model/selection-utils");
var parse_math_string_1 = require("../formats/parse-math-string");
var CLIPBOARD_LATEX_BEGIN = '$$';
var CLIPBOARD_LATEX_END = '$$';
/** @internal */
var defaultExportHook = function (_from, latex, _range) {
    // Add a wrapper around the LaTeX to be exported, if necessary
    if (!parse_math_string_1.MODE_SHIFT_COMMANDS.some(function (x) { return latex.startsWith(x[0]) && latex.endsWith(x[1]); }))
        latex = "".concat(CLIPBOARD_LATEX_BEGIN, " ").concat(latex, " ").concat(CLIPBOARD_LATEX_END);
    return latex;
};
exports.defaultExportHook = defaultExportHook;
/** @internal */
var ModeEditor = /** @class */ (function () {
    function ModeEditor(name) {
        ModeEditor._modes[name] = this;
    }
    ModeEditor.onPaste = function (mode, mathfield, data) {
        var _a;
        if (!mathfield.contentEditable && mathfield.userSelect === 'none') {
            mathfield.model.announce('plonk');
            return false;
        }
        if (typeof data === 'string') {
            var dataTransfer = new DataTransfer();
            dataTransfer.setData('text/plain', data);
            data = dataTransfer;
        }
        var redispatchedEvent = new ClipboardEvent('paste', {
            clipboardData: data,
            cancelable: true
        });
        if (!((_a = mathfield.host) === null || _a === void 0 ? void 0 : _a.dispatchEvent(redispatchedEvent)))
            return false;
        return ModeEditor._modes[mode].onPaste(mathfield, data);
    };
    /** Call this method from a menu */
    ModeEditor.copyToClipboard = function (mathfield, format) {
        if (!mathfield.contentEditable && mathfield.userSelect === 'none') {
            mathfield.model.announce('plonk');
            return;
        }
        var model = mathfield.model;
        var exportRange = model.selectionIsCollapsed
            ? [0, model.lastOffset]
            : (0, selection_utils_1.range)(model.selection);
        var latex = model.getValue(exportRange, format);
        navigator.clipboard.writeText(latex).then(function () {
            /* Resolved - text copied to clipboard successfully */
        }, function () { return mathfield.model.announce('plonk'); });
    };
    /** Call this method in response to a clipboard event */
    ModeEditor.onCopy = function (mathfield, ev) {
        var _a;
        if (!ev.clipboardData)
            return;
        if (!mathfield.contentEditable && mathfield.userSelect === 'none') {
            mathfield.model.announce('plonk');
            return;
        }
        var model = mathfield.model;
        var exportRange = model.selectionIsCollapsed
            ? [0, model.lastOffset]
            : (0, selection_utils_1.range)(model.selection);
        var atoms = model.getAtoms(exportRange);
        if (atoms.every(function (x) { return x.mode === 'text' || !x.mode; })) {
            // If the entire selection is in text mode, put the selection as plain
            // text on the clipboard
            ev.clipboardData.setData('text/plain', atoms
                .filter(function (x) { return x instanceof text_1.TextAtom; })
                .map(function (x) { return x.value; })
                .join(''));
        }
        else if (atoms.every(function (x) { return x.mode === 'latex'; })) {
            // If the entire selection is in LaTeX mode, put the selection as plain
            // text on the clipboard
            ev.clipboardData.setData('text/plain', model
                .getAtoms(exportRange, { includeChildren: true })
                .map(function (x) { var _a; return (_a = x.value) !== null && _a !== void 0 ? _a : ''; })
                .join(''));
        }
        else {
            //
            // 1. Get LaTeX of selection
            //
            var latex = void 0;
            if (atoms.length === 1 && atoms[0].verbatimLatex !== undefined)
                latex = atoms[0].verbatimLatex;
            else
                latex = model.getValue(exportRange, 'latex-expanded');
            //
            // 2. Put latex flavor on clipboard
            //
            ev.clipboardData.setData('application/x-latex', latex);
            //
            // 3. Put text flavor on clipboard
            // (see defaultExportHook)
            //
            try {
                ev.clipboardData.setData('text/plain', mathfield.options.onExport(mathfield, latex, exportRange));
            }
            catch (_b) { }
            //
            // 4. Put serialized atoms on clipboard
            //
            if (atoms.length === 1) {
                var atom = atoms[0];
                if (atom.type === 'root' || atom.type === 'group')
                    atoms = atom.body.filter(function (x) { return x.type !== 'first'; });
            }
            try {
                ev.clipboardData.setData('application/json+mathlive', JSON.stringify(atoms.map(function (x) { return x.toJson(); })));
            }
            catch (_c) { }
            //
            // 5. Put other flavors on the clipboard (MathJSON)
            //
            if ((_a = window[Symbol["for"]('io.cortexjs.compute-engine')]) === null || _a === void 0 ? void 0 : _a.ComputeEngine) {
                var ce = globalThis.MathfieldElement.computeEngine;
                if (ce) {
                    try {
                        var options = ce.jsonSerializationOptions;
                        ce.jsonSerializationOptions = { metadata: ['latex'] };
                        var expr = ce.parse(model.getValue(exportRange, 'latex-unstyled'));
                        ce.jsonSerializationOptions = options;
                        var mathJson = JSON.stringify(expr.json);
                        if (mathJson)
                            ev.clipboardData.setData('application/json', mathJson);
                    }
                    catch (_d) { }
                }
            }
        }
        // Prevent the current document selection from being written to the clipboard.
        ev.preventDefault();
    };
    ModeEditor.insert = function (model, text, options) {
        var _a;
        if (options === void 0) { options = {}; }
        var mode = options.mode === 'auto' ? model.mode : (_a = options.mode) !== null && _a !== void 0 ? _a : model.mode;
        return ModeEditor._modes[mode].insert(model, text, options);
    };
    ModeEditor.prototype.onPaste = function (_mathfield, _data) {
        return false;
    };
    ModeEditor.prototype.insert = function (_model, _text, _options) {
        return false;
    };
    ModeEditor._modes = {};
    return ModeEditor;
}());
exports.ModeEditor = ModeEditor;
