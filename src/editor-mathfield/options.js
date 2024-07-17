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
exports.effectiveMode = exports.getDefault = exports.get = exports.update = void 0;
var types_1 = require("../common/types");
var l10n_1 = require("../core/l10n");
var color_1 = require("../core/color");
var definitions_utils_1 = require("../latex-commands/definitions-utils");
var mode_editor_1 = require("./mode-editor");
var shortcuts_definitions_1 = require("../editor/shortcuts-definitions");
var keybindings_definitions_1 = require("../editor/keybindings-definitions");
var global_1 = require("../virtual-keyboard/global");
var styling_1 = require("./styling");
function update(updates) {
    var result = {};
    var _loop_1 = function (key) {
        switch (key) {
            case 'scriptDepth':
                var scriptDepth = updates.scriptDepth;
                if ((0, types_1.isArray)(scriptDepth))
                    result.scriptDepth = [scriptDepth[0], scriptDepth[1]];
                else if (typeof scriptDepth === 'number')
                    result.scriptDepth = [scriptDepth, scriptDepth];
                else if (typeof scriptDepth === 'string') {
                    var _b = scriptDepth
                        .split(',')
                        .map(function (x) { return parseInt(x.trim()); }), from = _b[0], to = _b[1];
                    result.scriptDepth = [from, to];
                }
                else
                    throw new TypeError('Unexpected value for scriptDepth');
                break;
            case 'mathVirtualKeyboardPolicy':
                var keyboardPolicy = updates.mathVirtualKeyboardPolicy.toLowerCase();
                // The 'sandboxed' policy requires the use of a VirtualKeyboard
                // (not a proxy) while inside an iframe.
                // Redefine the `mathVirtualKeyboard` getter in the current browsing context
                if (keyboardPolicy === 'sandboxed') {
                    if (window !== window['top']) {
                        var kbd_1 = global_1.VirtualKeyboard.singleton;
                        Object.defineProperty(window, 'mathVirtualKeyboard', {
                            get: function () { return kbd_1; }
                        });
                    }
                    keyboardPolicy = 'manual';
                }
                result.mathVirtualKeyboardPolicy = keyboardPolicy;
                break;
            case 'letterShapeStyle':
                if (updates.letterShapeStyle === 'auto') {
                    // Letter shape style (locale dependent)
                    if (l10n_1.l10n.locale.startsWith('fr'))
                        result.letterShapeStyle = 'french';
                    else
                        result.letterShapeStyle = 'tex';
                }
                else
                    result.letterShapeStyle = updates.letterShapeStyle;
                break;
            case 'defaultMode':
                if (!['text', 'math', 'inline-math'].includes(updates.defaultMode)) {
                    console.error("MathLive {{SDK_VERSION}}:  valid values for defaultMode are \"text\", \"math\" or \"inline-math\"");
                    result.defaultMode = 'math';
                }
                else
                    result.defaultMode = updates.defaultMode;
                break;
            case 'macros':
                result.macros = (0, definitions_utils_1.normalizeMacroDictionary)(updates.macros);
                break;
            default:
                if ((0, types_1.isArray)(updates[key]))
                    result[key] = __spreadArray([], updates[key], true);
                else if (typeof updates[key] === 'object' &&
                    !(updates[key] instanceof Element) &&
                    key !== 'computeEngine')
                    result[key] = __assign({}, updates[key]);
                else
                    result[key] = updates[key];
        }
    };
    for (var _i = 0, _a = Object.keys(updates); _i < _a.length; _i++) {
        var key = _a[_i];
        _loop_1(key);
    }
    return result;
}
exports.update = update;
function get(config, keys) {
    var resolvedKeys;
    if (typeof keys === 'string')
        resolvedKeys = [keys];
    else if (keys === undefined)
        resolvedKeys = Object.keys(config);
    else
        resolvedKeys = keys;
    var result = {};
    for (var _i = 0, resolvedKeys_1 = resolvedKeys; _i < resolvedKeys_1.length; _i++) {
        var x = resolvedKeys_1[_i];
        if (config[x] === null)
            result[x] = null;
        else if ((0, types_1.isArray)(config[x]))
            result[x] = __spreadArray([], config[x], true);
        else if (typeof config[x] === 'object' &&
            !(config[x] instanceof Element) &&
            x !== 'computeEngine') {
            // Some object literal, make a copy (for keypressSound, macros, etc...)
            result[x] = __assign({}, config[x]);
        }
        else
            result[x] = config[x];
    }
    // If requested a single key, return its value
    if (typeof keys === 'string')
        return result[keys];
    return result;
}
exports.get = get;
function getDefault() {
    return {
        readOnly: false,
        defaultMode: 'math',
        macros: {},
        registers: {},
        colorMap: color_1.defaultColorMap,
        backgroundColorMap: color_1.defaultBackgroundColorMap,
        letterShapeStyle: l10n_1.l10n.locale.startsWith('fr') ? 'french' : 'tex',
        minFontScale: 0,
        maxMatrixCols: 10,
        smartMode: false,
        smartFence: true,
        smartSuperscript: true,
        scriptDepth: [Infinity, Infinity],
        removeExtraneousParentheses: true,
        isImplicitFunction: function (x) {
            return [
                '\\sin',
                '\\cos',
                '\\tan',
                '\\arcsin',
                '\\arccos',
                '\\arctan',
                '\\arcsec',
                '\\arccsc',
                '\\arsinh',
                '\\arcosh',
                '\\artanh',
                '\\arcsech',
                '\\arccsch',
                '\\arg',
                '\\ch',
                '\\cosec',
                '\\cosh',
                '\\cot',
                '\\cotg',
                '\\coth',
                '\\csc',
                '\\ctg',
                '\\cth',
                '\\sec',
                '\\sinh',
                '\\sh',
                '\\tanh',
                '\\tg',
                '\\th',
                '\\lg',
                '\\lb',
                '\\log',
                '\\ln',
            ].includes(x);
        },
        mathModeSpace: '',
        placeholderSymbol: '▢',
        contentPlaceholder: '',
        popoverPolicy: 'auto',
        environmentPopoverPolicy: 'off',
        keybindings: keybindings_definitions_1.DEFAULT_KEYBINDINGS,
        inlineShortcuts: shortcuts_definitions_1.INLINE_SHORTCUTS,
        inlineShortcutTimeout: 0,
        mathVirtualKeyboardPolicy: 'auto',
        virtualKeyboardTargetOrigin: window === null || window === void 0 ? void 0 : window.origin,
        originValidator: 'none',
        onInsertStyle: styling_1.defaultInsertStyleHook,
        onInlineShortcut: function () { return ''; },
        onScrollIntoView: null,
        onExport: mode_editor_1.defaultExportHook,
        value: ''
    };
}
exports.getDefault = getDefault;
function effectiveMode(options) {
    if (options.defaultMode === 'inline-math')
        return 'math';
    return options.defaultMode;
}
exports.effectiveMode = effectiveMode;
