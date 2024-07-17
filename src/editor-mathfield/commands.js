"use strict";
exports.__esModule = true;
var commands_1 = require("../editor/commands");
var keyboard_input_1 = require("./keyboard-input");
var keystroke_caption_1 = require("./keystroke-caption");
var render_1 = require("./render");
var autocomplete_1 = require("./autocomplete");
(0, commands_1.register)({
    undo: function (mathfield) {
        mathfield.undo();
        return true;
    },
    redo: function (mathfield) {
        mathfield.redo();
        return true;
    },
    scrollIntoView: function (mathfield) {
        mathfield.scrollIntoView();
        return true;
    },
    scrollToStart: function (mathfield) {
        mathfield.field.scroll(0, 0);
        return true;
    },
    scrollToEnd: function (mathfield) {
        var fieldBounds = mathfield.field.getBoundingClientRect();
        mathfield.field.scroll(fieldBounds.left - window.scrollX, 0);
        return true;
    },
    toggleKeystrokeCaption: keystroke_caption_1.toggleKeystrokeCaption,
    toggleContextMenu: function (mathfield) {
        var result = mathfield.toggleContextMenu();
        if (!result)
            mathfield.model.announce('plonk');
        return result;
    },
    plonk: function (mathfield) {
        mathfield.model.announce('plonk');
        return true;
    },
    switchMode: function (mathfield, mode, prefix, suffix) {
        mathfield.switchMode(mode, prefix, suffix);
        return true;
    },
    insert: function (mathfield, s, options) {
        return mathfield.insert(s, options);
    },
    typedText: function (mathfield, text, options) {
        (0, keyboard_input_1.onInput)(mathfield, text, options);
        return true;
    },
    insertDecimalSeparator: function (mathfield) {
        var model = mathfield.model;
        if (model.mode === 'math' &&
            globalThis.MathfieldElement.decimalSeparator === ',') {
            var child = model.at(Math.max(model.position, model.anchor));
            if (child.isDigit()) {
                mathfield.insert('{,}', { format: 'latex' });
                mathfield.snapshot('insert-mord');
                return true;
            }
        }
        mathfield.insert('.');
        return true;
    },
    // A 'commit' command is used to simulate pressing the return/enter key,
    // e.g. when using a virtual keyboard
    commit: function (mathfield) {
        var _a;
        if (mathfield.model.contentWillChange({ inputType: 'insertLineBreak' })) {
            (_a = mathfield.host) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            mathfield.model.contentDidChange({ inputType: 'insertLineBreak' });
        }
        return true;
    },
    insertPrompt: function (mathfield, id, options) {
        var promptIds = mathfield.getPrompts();
        var prospectiveId = 'prompt-' +
            Date.now().toString(36).slice(-2) +
            Math.floor(Math.random() * 0x186a0).toString(36);
        var i = 0;
        while (promptIds.includes(prospectiveId) && i < 100) {
            if (i === 99) {
                console.error('could not find a unique ID after 100 tries');
                return false;
            }
            prospectiveId =
                'prompt-' +
                    Date.now().toString(36).slice(-2) +
                    Math.floor(Math.random() * 0x186a0).toString(36);
            i++;
        }
        mathfield.insert("\\placeholder[".concat(id !== null && id !== void 0 ? id : prospectiveId, "]{}"), options);
        return true;
    }
});
(0, commands_1.register)({
    copyToClipboard: function (mathfield) {
        mathfield.focus();
        // If the selection is empty, select the entire field before
        // copying it.
        if (mathfield.model.selectionIsCollapsed)
            mathfield.select();
        if (!('queryCommandSupported' in document &&
            document.queryCommandSupported('copy') &&
            document.execCommand('copy'))) {
            mathfield.element.querySelector('.ML__keyboard-sink').dispatchEvent(new ClipboardEvent('copy', {
                bubbles: true,
                composed: true
            }));
        }
        return false;
    }
}, { target: 'mathfield' });
(0, commands_1.register)({
    cutToClipboard: function (mathfield) {
        mathfield.focus();
        if (!('queryCommandSupported' in document &&
            document.queryCommandSupported('cut') &&
            document.execCommand('cut'))) {
            mathfield.element.querySelector('.ML__keyboard-sink').dispatchEvent(new ClipboardEvent('cut', {
                bubbles: true,
                composed: true
            }));
        }
        return true;
    },
    pasteFromClipboard: function (mathfield) {
        mathfield.focus();
        if ('queryCommandSupported' in document &&
            document.queryCommandSupported('paste')) {
            document.execCommand('paste');
            return true;
        }
        navigator.clipboard.readText().then(function (text) {
            if (text &&
                mathfield.model.contentWillChange({
                    inputType: 'insertFromPaste',
                    data: text
                })) {
                mathfield.stopCoalescingUndo();
                mathfield.stopRecording();
                if (mathfield.insert(text, { mode: mathfield.model.mode })) {
                    (0, autocomplete_1.updateAutocomplete)(mathfield);
                    mathfield.startRecording();
                    mathfield.snapshot('paste');
                    mathfield.model.contentDidChange({ inputType: 'insertFromPaste' });
                    (0, render_1.requestUpdate)(mathfield);
                }
            }
            else
                mathfield.model.announce('plonk');
            mathfield.startRecording();
        });
        return true;
    }
}, {
    target: 'mathfield',
    canUndo: true,
    changeContent: true,
    changeSelection: true
});
