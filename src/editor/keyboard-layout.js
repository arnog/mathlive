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
exports.__esModule = true;
exports.getDefaultKeyboardLayout = exports.getKeyboardLayouts = exports.getActiveKeyboardLayout = exports.setKeyboardLayout = exports.setKeyboardLayoutLocale = exports.validateKeyboardLayout = exports.normalizeKeyboardEvent = exports.getCodeForKey = exports.register = exports.platform = exports.gKeyboardLayout = exports.keystrokeModifiersToString = exports.keystrokeModifiersFromString = void 0;
var capabilities_1 = require("../ui/utils/capabilities");
var dvorak_1 = require("./keyboard-layouts/dvorak");
var english_1 = require("./keyboard-layouts/english");
var french_1 = require("./keyboard-layouts/french");
var german_1 = require("./keyboard-layouts/german");
var spanish_1 = require("./keyboard-layouts/spanish");
function keystrokeModifiersFromString(key) {
    var segments = key.split('+');
    var result = {
        shift: false,
        alt: false,
        cmd: false,
        win: false,
        meta: false,
        ctrl: false,
        key: segments.pop()
    };
    if (segments.includes('shift'))
        result.shift = true;
    if (segments.includes('alt'))
        result.alt = true;
    if (segments.includes('ctrl'))
        result.ctrl = true;
    if (segments.includes('cmd'))
        result.cmd = true;
    if (segments.includes('win'))
        result.win = true;
    if (segments.includes('meta'))
        result.meta = true;
    return result;
}
exports.keystrokeModifiersFromString = keystrokeModifiersFromString;
function keystrokeModifiersToString(key) {
    var result = '';
    if (key.shift)
        result += 'shift+';
    if (key.alt)
        result += 'alt+';
    if (key.ctrl)
        result += 'ctrl+';
    if (key.cmd)
        result += 'cmd+';
    if (key.win)
        result += 'win+';
    if (key.meta)
        result += 'meta+';
    return result + key.key;
}
exports.keystrokeModifiersToString = keystrokeModifiersToString;
/* prettier-ignore */
var BASE_LAYOUT_MAPPING = {
    enter: '[Enter]',
    escape: '[Escape]',
    backspace: '[Backspace]',
    tab: '[Tab]',
    space: '[Space]',
    pausebreak: '[Pause]',
    insert: '[Insert]',
    home: '[Home]',
    pageup: '[PageUp]',
    "delete": '[Delete]',
    end: '[End]',
    pagedown: '[PageDown]',
    right: '[ArrowRight]',
    left: '[ArrowLeft]',
    down: '[ArrowDown]',
    up: '[ArrowUp]',
    numpad0: '[Numpad0]',
    numpad1: '[Numpad1]',
    numpad2: '[Numpad2]',
    numpad3: '[Numpad3]',
    numpad4: '[Numpad4]',
    numpad5: '[Numpad5]',
    numpad6: '[Numpad6]',
    numpad7: '[Numpad7]',
    numpad8: '[Numpad8]',
    numpad9: '[Numpad9]',
    'numpad_divide': '[NumpadDivide]',
    'numpad_multiply': '[NumpadMultiply]',
    'numpad_subtract': '[NumpadSubtract]',
    'numpad_add': '[NumpadAdd]',
    'numpad_decimal': '[NumpadDecimal]',
    'numpad_separator': '[NumpadComma]',
    capslock: '[Capslock]',
    f1: '[F1]',
    f2: '[F2]',
    f3: '[F3]',
    f4: '[F4]',
    f5: '[F5]',
    f6: '[F6]',
    f7: '[F7]',
    f8: '[F8]',
    f9: '[F9]',
    f10: '[F10]',
    f11: '[F11]',
    f12: '[F12]',
    f13: '[F13]',
    f14: '[F14]',
    f15: '[F15]',
    f16: '[F16]',
    f17: '[F17]',
    f18: '[F18]',
    f19: '[F19]'
};
var gKeyboardLayouts = [];
function platform() {
    switch ((0, capabilities_1.osPlatform)()) {
        case 'macos':
        case 'ios':
            return 'apple';
        case 'windows':
            return 'windows';
        // case 'android':
        // case 'chromeos':
    }
    return 'linux';
}
exports.platform = platform;
function register(layout) {
    if (!layout.platform || layout.platform === platform())
        gKeyboardLayouts.push(layout);
}
exports.register = register;
/** Given the current estimated keyboard layout,
 *  return the unmodified key for the event.
 * For example, on AZERTY option+shift+'A' = 'Æ' -> 'a'
 * (event though the code is KeyQ)
 */
// export function getUnmodifiedKey(evt: KeyboardEvent): string {
//     if (!evt.shiftKey && !evt.altKey) {
//         return evt.key;
//     }
//     // @todo: iterate over the entries for the current layout,
//     // with the alt+shift modifiers set accordingly
//     // and find the (first) entry that matches
//     const layout = gKeyboardLayouts[0] ?? DEFAULT_KEYBOARD_LAYOUT;
//     const index =
//         evt.shiftKey && evt.altKey ? 3 : evt.altKey ? 2 : evt.shiftKey ? 1 : 0;
//     for (const [key, value] of Object.entries(layout.mapping)) {
//         if (key === evt.code && value[index] === evt.key) {
//             return value[0];
//         }
//     }
//     // We did not find a perfect match...
//     // Look for an entry even if the keycode doesn't match...
//     for (const [, value] of Object.entries(layout.mapping)) {
//         if (value[index] === evt.key) {
//             return value[0];
//         }
//     }
//     // Really? Nothing matched?! Just return the key...
//     return evt.key;
// }
function getCodeForKey(k, layout) {
    var _a;
    var result = {
        shift: false,
        alt: false,
        cmd: false,
        win: false,
        meta: false,
        ctrl: false,
        key: ''
    };
    if (!k)
        return result;
    for (var _i = 0, _b = Object.entries(layout.mapping); _i < _b.length; _i++) {
        var _c = _b[_i], key = _c[0], value = _c[1];
        if (value[0] === k) {
            result.key = "[".concat(key, "]");
            return result;
        }
        if (value[1] === k) {
            result.shift = true;
            result.key = "[".concat(key, "]");
            return result;
        }
        if (value[2] === k) {
            result.alt = true;
            result.key = "[".concat(key, "]");
            return result;
        }
        if (value[3] === k) {
            result.shift = true;
            result.alt = true;
            result.key = "[".concat(key, "]");
            return result;
        }
    }
    result.key = (_a = BASE_LAYOUT_MAPPING[k]) !== null && _a !== void 0 ? _a : '';
    return result;
}
exports.getCodeForKey = getCodeForKey;
function normalizeKeyboardEvent(evt) {
    if (evt.code)
        return evt;
    // For virtual keyboards (iOS, Android) and Microsoft Edge (!)
    // the `evt.code`, which represents the physical key pressed, is set
    // to undefined. In that case, map the virtual key ("q") to a
    // pseudo-hardware key ("KeyQ")
    var mapping = Object.entries(getActiveKeyboardLayout().mapping);
    var altKey = false;
    var shiftKey = false;
    var code = '';
    for (var index = 0; index < 4; index++) {
        for (var _i = 0, mapping_1 = mapping; _i < mapping_1.length; _i++) {
            var _a = mapping_1[_i], key = _a[0], value = _a[1];
            if (value[index] === evt.key) {
                code = key;
                if (index === 3) {
                    altKey = true;
                    shiftKey = true;
                }
                else if (index === 2)
                    altKey = true;
                else if (index === 1)
                    shiftKey = true;
                break;
            }
        }
        if (code)
            break;
    }
    return new KeyboardEvent(evt.type, __assign(__assign({}, evt), { altKey: altKey, shiftKey: shiftKey, code: code }));
}
exports.normalizeKeyboardEvent = normalizeKeyboardEvent;
// Given this keyboard event, and the `code`, `key` and modifiers
// in it, increase the score of layouts that do match it.
// Calling repeatedly this function will improve the accuracy of the
// keyboard layout estimate.
function validateKeyboardLayout(evt) {
    var _a, _b;
    if (!evt)
        return;
    if (evt.key === 'Unidentified')
        return;
    // Dead keys do not have enough info to validate the keyboard
    // (we don't know what char they could produce, only the physical key associated with them )
    if (evt.key === 'Dead')
        return;
    var index = evt.shiftKey && evt.altKey ? 3 : evt.altKey ? 2 : evt.shiftKey ? 1 : 0;
    for (var _i = 0, gKeyboardLayouts_1 = gKeyboardLayouts; _i < gKeyboardLayouts_1.length; _i++) {
        var layout = gKeyboardLayouts_1[_i];
        if (((_a = layout.mapping[evt.code]) === null || _a === void 0 ? void 0 : _a[index]) === evt.key) {
            // Increase the score of the layouts that have a mapping compatible with
            // this keyboard event.
            layout.score += 1;
        }
        else if ((_b = layout.mapping[evt.code]) === null || _b === void 0 ? void 0 : _b[index]) {
            // There is a mapping, but it's not compatible with this keystroke:
            // zero-out the score
            layout.score = 0;
        }
    }
    gKeyboardLayouts.sort(function (a, b) { return b.score - a.score; });
}
exports.validateKeyboardLayout = validateKeyboardLayout;
function setKeyboardLayoutLocale(locale) {
    exports.gKeyboardLayout = gKeyboardLayouts.find(function (x) { return locale.startsWith(x.locale); });
}
exports.setKeyboardLayoutLocale = setKeyboardLayoutLocale;
function setKeyboardLayout(name) {
    // If name is 'auto', the layout is not found, and set to undefined
    exports.gKeyboardLayout = gKeyboardLayouts.find(function (x) { return x.id === name; });
    return exports.gKeyboardLayout;
}
exports.setKeyboardLayout = setKeyboardLayout;
function getActiveKeyboardLayout() {
    return exports.gKeyboardLayout !== null && exports.gKeyboardLayout !== void 0 ? exports.gKeyboardLayout : gKeyboardLayouts[0];
}
exports.getActiveKeyboardLayout = getActiveKeyboardLayout;
function getKeyboardLayouts() {
    return gKeyboardLayouts;
}
exports.getKeyboardLayouts = getKeyboardLayouts;
function getDefaultKeyboardLayout() {
    switch (platform()) {
        case 'apple':
            return english_1.APPLE_ENGLISH;
        case 'windows':
            return english_1.WINDOWS_ENGLISH;
        case 'linux':
            return english_1.LINUX_ENGLISH;
    }
    return english_1.APPLE_ENGLISH;
}
exports.getDefaultKeyboardLayout = getDefaultKeyboardLayout;
switch (platform()) {
    case 'apple':
        register(english_1.APPLE_ENGLISH);
        register(french_1.APPLE_FRENCH);
        register(spanish_1.APPLE_SPANISH);
        register(german_1.APPLE_GERMAN);
        break;
    case 'windows':
        register(english_1.WINDOWS_ENGLISH);
        register(french_1.WINDOWS_FRENCH);
        register(spanish_1.WINDOWS_SPANISH);
        register(german_1.WINDOWS_GERMAN);
        break;
    case 'linux':
        register(english_1.LINUX_ENGLISH);
        register(french_1.LINUX_FRENCH);
        register(spanish_1.LINUX_SPANISH);
        register(german_1.LINUX_GERMAN);
        break;
}
register(dvorak_1.DVORAK);
