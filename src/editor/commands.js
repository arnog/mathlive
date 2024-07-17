"use strict";
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
exports.parseCommand = exports.perform = exports.getCommandTarget = exports.register = exports.COMMANDS = exports.HAPTIC_FEEDBACK_DURATION = void 0;
var types_1 = require("../common/types");
var render_1 = require("../editor-mathfield/render");
var autocomplete_1 = require("../editor-mathfield/autocomplete");
var capabilities_1 = require("../ui/utils/capabilities");
var mathfield_element_1 = require("../public/mathfield-element");
// @revisit: move to mathfield.vibrate()
exports.HAPTIC_FEEDBACK_DURATION = 3; // In ms
/**
 * Register one or more selectors.
 * The selector function return true to request a render update of the expression.
 */
function register(commands, options) {
    options = __assign({ target: 'mathfield', canUndo: false, audioFeedback: undefined, changeContent: false, changeSelection: false }, (options !== null && options !== void 0 ? options : {}));
    if (!exports.COMMANDS)
        exports.COMMANDS = {};
    for (var _i = 0, _a = Object.keys(commands); _i < _a.length; _i++) {
        var selector = _a[_i];
        console.assert(!exports.COMMANDS[selector], 'Selector already defined: ', selector);
        exports.COMMANDS[selector] = __assign(__assign({}, options), { fn: commands[selector] });
    }
}
exports.register = register;
function getCommandInfo(command) {
    var selector;
    if (Array.isArray(command)) {
        if (command[0] === 'performWithFeedback')
            return getCommandInfo(command[1]);
        selector = command[0];
    }
    else
        selector = command;
    return exports.COMMANDS[selector];
}
function getCommandTarget(command) {
    var _a;
    return (_a = getCommandInfo(command)) === null || _a === void 0 ? void 0 : _a.target;
}
exports.getCommandTarget = getCommandTarget;
function perform(mathfield, command) {
    var _a, _b;
    var _c, _d;
    command = parseCommand(command);
    if (!command)
        return false;
    var selector;
    var args = [];
    var handled = false;
    var dirty = false;
    if ((0, types_1.isArray)(command)) {
        selector = command[0];
        args = command.slice(1);
    }
    else
        selector = command;
    var info = exports.COMMANDS[selector];
    var commandTarget = info === null || info === void 0 ? void 0 : info.target;
    if (commandTarget === 'model') {
        // If in promptLocked (readOnly && selection node within prompt) mode,
        // reject commands that would modify the content.
        if (!mathfield.isSelectionEditable && (info === null || info === void 0 ? void 0 : info.changeContent)) {
            mathfield.model.announce('plonk');
            return false;
        }
        if (/^(delete|add)/.test(selector)) {
            if (selector !== 'deleteBackward')
                mathfield.flushInlineShortcutBuffer();
            mathfield.snapshot(selector);
        }
        if (!/^complete/.test(selector))
            (0, autocomplete_1.removeSuggestion)(mathfield);
        (_a = exports.COMMANDS[selector]).fn.apply(_a, __spreadArray([mathfield.model], args, false));
        (0, autocomplete_1.updateAutocomplete)(mathfield);
        dirty = true;
        handled = true;
    }
    else if (commandTarget === 'virtual-keyboard') {
        dirty = (_d = (_c = window.mathVirtualKeyboard) === null || _c === void 0 ? void 0 : _c.executeCommand(command)) !== null && _d !== void 0 ? _d : false;
        handled = true;
    }
    else if (exports.COMMANDS[selector]) {
        if (!mathfield.isSelectionEditable && (info === null || info === void 0 ? void 0 : info.changeContent)) {
            mathfield.model.announce('plonk');
            return false;
        }
        if (/^(undo|redo)/.test(selector))
            mathfield.flushInlineShortcutBuffer();
        dirty = (_b = exports.COMMANDS[selector]).fn.apply(_b, __spreadArray([mathfield], args, false));
        handled = true;
    }
    else
        throw new Error("Unknown command \"".concat(selector, "\""));
    // Virtual keyboard commands do not update mathfield state
    if (commandTarget !== 'virtual-keyboard') {
        // If the command changed the selection so that it is no longer
        // collapsed, or if it was an editing command (but not backspace,
        // which is handled separately), reset the inline shortcut buffer and
        // the user style
        if (!mathfield.model.selectionIsCollapsed ||
            ((info === null || info === void 0 ? void 0 : info.changeSelection) && selector !== 'deleteBackward')) {
            mathfield.flushInlineShortcutBuffer();
            if (!(info === null || info === void 0 ? void 0 : info.changeContent))
                mathfield.stopCoalescingUndo();
            mathfield.defaultStyle = {};
        }
    }
    // Render the mathfield
    if (dirty)
        (0, render_1.requestUpdate)(mathfield);
    return handled;
}
exports.perform = perform;
/**
 * Perform a command, but:
 * * focus the mathfield
 * * provide haptic and audio feedback
 * This is used by the virtual keyboard when command keys (delete, arrows,
 *  etc..) are pressed.
 */
function performWithFeedback(mathfield, selector) {
    var _a;
    if (!mathfield)
        return false;
    mathfield.focus();
    if (mathfield_element_1["default"].keypressVibration && (0, capabilities_1.canVibrate)())
        navigator.vibrate(exports.HAPTIC_FEEDBACK_DURATION);
    var info = getCommandInfo(selector);
    globalThis.MathfieldElement.playSound((_a = info === null || info === void 0 ? void 0 : info.audioFeedback) !== null && _a !== void 0 ? _a : 'keypress');
    var result = mathfield.executeCommand(selector);
    mathfield.scrollIntoView();
    return result;
}
register({
    performWithFeedback: function (mathfield, command) { return performWithFeedback(mathfield, command); }
});
function nextSuggestion(mathfield) {
    // The modulo of the suggestionIndex is used to determine which suggestion
    // to display, so no need to worry about rolling over.
    (0, autocomplete_1.updateAutocomplete)(mathfield, { atIndex: mathfield.suggestionIndex + 1 });
    return false;
}
function previousSuggestion(mathfield) {
    (0, autocomplete_1.updateAutocomplete)(mathfield, { atIndex: mathfield.suggestionIndex - 1 });
    return false;
}
register({ complete: autocomplete_1.complete }, {
    target: 'mathfield',
    audioFeedback: 'return',
    canUndo: true,
    changeContent: true,
    changeSelection: true
});
register({
    dispatchEvent: function (mathfield, event, detail) {
        var _a, _b;
        return (_b = (_a = mathfield.host) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new CustomEvent(event, { detail: detail }))) !== null && _b !== void 0 ? _b : false;
    }
}, { target: 'mathfield' });
register({ nextSuggestion: nextSuggestion, previousSuggestion: previousSuggestion }, {
    target: 'mathfield',
    audioFeedback: 'keypress',
    changeSelection: true
});
/**
 * A command can be a string or an array of strings.
 * - string: `selector(arg1, arg2)`
 * - array: `['selector', arg1, arg2]`
 *
 * In both cases, the selector can be in kebab or camel case.
 *
 */
function parseCommand(command) {
    if (!command)
        return undefined;
    if ((0, types_1.isArray)(command) && command.length > 0) {
        var selector_1 = command[0];
        // Convert kebab case (like-this) to camel case (likeThis).
        selector_1.replace(/-\w/g, function (m) { return m[1].toUpperCase(); });
        if (selector_1 === 'performWithFeedback' && command.length === 2) {
            return [selector_1, parseCommand(command[1])];
        }
        return __spreadArray([selector_1], command.slice(1), true);
    }
    // Is it a string of the form `selector(arg1, arg2)`?
    if (typeof command !== 'string')
        return undefined;
    var match = command.trim().match(/^([a-zA-Z0-9-]+)\((.*)\)$/);
    if (match) {
        var selector_2 = match[1];
        selector_2.replace(/-\w/g, function (m) { return m[1].toUpperCase(); });
        var args = match[2].split(',').map(function (x) { return x.trim(); });
        return __spreadArray([
            selector_2
        ], args.map(function (arg) {
            if (/"[^"]*"/.test(arg))
                return arg.slice(1, -1);
            if (/'[^']*'/.test(arg))
                return arg.slice(1, -1);
            if (/^true$/.test(arg))
                return true;
            if (/^false$/.test(arg))
                return false;
            if (/^[-]?\d+$/.test(arg))
                return parseInt(arg, 10);
            // Is it an object literal?
            if (/^\{.*\}$/.test(arg)) {
                try {
                    return JSON.parse(arg);
                }
                catch (e) {
                    console.error('Invalid argument:', arg);
                    return arg;
                }
            }
            return parseCommand(arg);
        }), true);
    }
    var selector = command;
    selector.replace(/-\w/g, function (m) { return m[1].toUpperCase(); });
    return selector;
}
exports.parseCommand = parseCommand;
