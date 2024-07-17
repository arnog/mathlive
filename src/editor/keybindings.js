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
exports.normalizeKeybindings = exports.getKeybindingsForCommand = exports.getCommandForKeybinding = void 0;
var types_1 = require("../common/types");
var keyboard_layout_1 = require("./keyboard-layout");
var keybindings_definitions_1 = require("./keybindings-definitions");
var capabilities_1 = require("../ui/utils/capabilities");
var keyboard_1 = require("../ui/events/keyboard");
var keyboard_2 = require("./keyboard");
/**
 * @param p The platform to test against.
 */
function matchPlatform(p) {
    if ((0, capabilities_1.isBrowser)()) {
        var plat = (0, capabilities_1.osPlatform)();
        var isNeg = p.startsWith('!');
        var isMatch = p.endsWith(plat);
        if (isNeg && !isMatch)
            return true;
        if (!isNeg && isMatch)
            return true;
    }
    if (p === '!other')
        return false;
    return p === 'other';
}
/**
 * Return the selector matching the keystroke.
 * The keybindings and keystroke should be in normalized form
 * (i.e. using key code, e.g. `[KeyQ]`)
 *
 */
function getCommandForKeybinding(keybindings, mode, evt) {
    if (keybindings.length === 0)
        return '';
    // Normalize keystroke to the format (order of modifiers) expected
    // by keybindings
    var keystroke = (0, keyboard_layout_1.keystrokeModifiersToString)((0, keyboard_layout_1.keystrokeModifiersFromString)((0, keyboard_2.keyboardEventToString)(evt)));
    var altKeystroke = (0, keyboard_layout_1.keystrokeModifiersToString)({
        key: evt.key,
        shift: evt.shiftKey,
        alt: evt.altKey,
        ctrl: evt.ctrlKey,
        meta: evt.metaKey || (evt.ctrlKey && /macos|ios/.test((0, capabilities_1.osPlatform)())),
        cmd: false,
        win: false
    });
    // Try to match using a virtual keystroke
    for (var i = keybindings.length - 1; i >= 0; i--) {
        if (keybindings[i].key === keystroke ||
            keybindings[i].key === altKeystroke) {
            if (!keybindings[i].ifMode || keybindings[i].ifMode === mode)
                return keybindings[i].command;
        }
    }
    return '';
}
exports.getCommandForKeybinding = getCommandForKeybinding;
function commandToString(command) {
    var result = command;
    if ((0, types_1.isArray)(result)) {
        result =
            result.length > 0 ? result[0] + '(' + result.slice(1).join('') + ')' : '';
    }
    return result;
}
function getKeybindingsForCommand(keybindings, command) {
    var result = [];
    if (typeof command === 'string') {
        var candidate = keybindings_definitions_1.REVERSE_KEYBINDINGS[command];
        if ((0, types_1.isArray)(candidate))
            result = candidate.slice();
        else if (candidate)
            result.push(candidate);
    }
    // A command can be either a simple selector, or a selector
    // with arguments. Normalize it to a string
    var normalizedCommand = commandToString(command);
    var regex = new RegExp('^' +
        normalizedCommand
            .replace('\\', '\\\\')
            .replace('|', '\\|')
            .replace('*', '\\*')
            .replace('$', '\\$')
            .replace('^', '\\^') +
        '([^*a-zA-Z]|$)');
    for (var _i = 0, keybindings_1 = keybindings; _i < keybindings_1.length; _i++) {
        var keybinding = keybindings_1[_i];
        if (regex.test(commandToString(keybinding.command)))
            result.push(keybinding.key);
    }
    return result.map(keyboard_1.getKeybindingMarkup);
}
exports.getKeybindingsForCommand = getKeybindingsForCommand;
/**
 * Return a normalized keybinding that account for the current
 * keyboard layout. For example, a keybinding with the key `{` and
 * a US layout will return 'shift+[' and '{' (the latter is the key code).
 *
 */
function normalizeKeybinding(keybinding, layout) {
    if (keybinding.ifPlatform &&
        !/^!?(macos|windows|android|ios|chromeos|other)$/.test(keybinding.ifPlatform)) {
        throw new Error("Unexpected platform \"".concat(keybinding.ifPlatform, "\" for keybinding ").concat(keybinding.key));
    }
    if (keybinding.ifLayout !== undefined &&
        (layout.score === 0 || !keybinding.ifLayout.includes(layout.id)))
        return undefined;
    var modifiers = (0, keyboard_layout_1.keystrokeModifiersFromString)(keybinding.key);
    var platform = keybinding.ifPlatform;
    if (modifiers.cmd) {
        if (platform && platform !== 'macos' && platform !== 'ios') {
            throw new Error('Unexpected "cmd" modifier with platform "' +
                platform +
                '"' +
                '\n' +
                '"cmd" modifier can only be used with macOS or iOS platform.');
        }
        if (!platform)
            platform = (0, capabilities_1.osPlatform)() === 'ios' ? 'ios' : 'macos';
        modifiers.win = false;
        modifiers.cmd = false;
        modifiers.meta = true;
    }
    if (modifiers.win) {
        if (platform && platform !== 'windows') {
            throw new Error('Unexpected "win" modifier with platform "' +
                platform +
                '"' +
                '\n' +
                '"win" modifier can only be used with Windows platform.');
        }
        platform = 'windows';
        modifiers.win = false;
        modifiers.cmd = false;
        modifiers.meta = true;
    }
    if (platform && !matchPlatform(platform))
        return undefined;
    //
    // Is this a keybinding specified with a key code (e.g.  `[KeyW]`)?
    //
    if (/^\[.+\]$/.test(modifiers.key))
        return __assign(__assign({}, keybinding), { key: (0, keyboard_layout_1.keystrokeModifiersToString)(modifiers) });
    //
    // This is not a key code (e.g. `[KeyQ]`) it's a simple key (e.g. `a`).
    // Map it to a key code given the current keyboard layout.
    //
    var code = (0, keyboard_layout_1.getCodeForKey)(modifiers.key, layout);
    if (!code)
        return __assign(__assign({}, keybinding), { key: (0, keyboard_layout_1.keystrokeModifiersToString)(modifiers) });
    if ((code.shift && modifiers.shift) || (code.alt && modifiers.alt)) {
        throw new Error("The keybinding ".concat(keybinding.key, " (").concat(selectorToString(keybinding.command), ") is conflicting with the key combination ").concat((0, keyboard_layout_1.keystrokeModifiersToString)(code), " using the ").concat(layout.displayName, " keyboard layout"));
    }
    code.shift = code.shift || modifiers.shift;
    code.alt = code.alt || modifiers.alt;
    code.meta = modifiers.meta;
    code.ctrl = modifiers.ctrl;
    return __assign(__assign({}, keybinding), { key: (0, keyboard_layout_1.keystrokeModifiersToString)(code) });
}
function selectorToString(selector) {
    if (Array.isArray(selector)) {
        var sel = __spreadArray([], selector, true);
        return (sel.shift() +
            '(' +
            sel
                .map(function (x) { return (typeof x === 'string' ? "\"".concat(x, "\"") : x.toString()); })
                .join(', ') +
            ')');
    }
    return selector;
}
/**
 * Parse the input keybindings and return them normalized:
 * - 'keys' are transformed to 'code' according to the current keyboard layout
 * - keybindings that don't apply to the current platform are removed
 */
function normalizeKeybindings(keybindings, layout) {
    var errors = [];
    var result = [];
    var _loop_1 = function (x) {
        try {
            var binding_1 = normalizeKeybinding(x, layout);
            if (!binding_1)
                return "continue";
            // Is there a conflict with an existing keybinding?
            var conflict = result.find(function (x) { return x.key === binding_1.key && x.ifMode === binding_1.ifMode; });
            if (conflict) {
                throw new Error("Ambiguous key binding ".concat(x.key, " (").concat(selectorToString(x.command), ") matches ").concat(conflict.key, " (").concat(selectorToString(conflict.command), ") with the ").concat(layout.displayName, " keyboard layout"));
            }
            result.push(binding_1);
        }
        catch (error) {
            if (error instanceof Error)
                errors.push(error.message);
        }
    };
    for (var _i = 0, keybindings_2 = keybindings; _i < keybindings_2.length; _i++) {
        var x = keybindings_2[_i];
        _loop_1(x);
    }
    return [result, errors];
}
exports.normalizeKeybindings = normalizeKeybindings;
