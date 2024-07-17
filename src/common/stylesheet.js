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
exports.releaseStylesheet = exports.injectStylesheet = exports.getStylesheet = exports.getStylesheetContent = void 0;
// @ts-ignore-error
var mathfield_less_1 = require("../../css/mathfield.less");
// @ts-ignore-error
var core_less_1 = require("../../css/core.less");
// @ts-ignore-error
var environment_popover_less_1 = require("../../css/environment-popover.less");
// @ts-ignore-error
var suggestion_popover_less_1 = require("../../css/suggestion-popover.less");
// @ts-ignore-error
var keystroke_caption_less_1 = require("../../css/keystroke-caption.less");
// @ts-ignore-error
var virtual_keyboard_less_1 = require("../../css/virtual-keyboard.less");
var style_less_1 = require("../ui/style.less");
var style_less_2 = require("../ui/menu/style.less");
var gStylesheets;
function getStylesheetContent(id) {
    var content = '';
    switch (id) {
        //
        // Note: the `position: relative` is required to fix https://github.com/arnog/mathlive/issues/971
        //
        case 'mathfield-element':
            content = "\n    :host { display: inline-block; background-color: field; color: fieldtext; border-width: 1px; border-style: solid; border-color: #acacac; border-radius: 2px;}\n    :host([hidden]) { display: none; }\n    :host([disabled]), :host([disabled]:focus), :host([disabled]:focus-within) { outline: none; opacity:  .5; }\n    :host(:focus), :host(:focus-within) {\n      outline: Highlight auto 1px;    /* For Firefox */\n      outline: -webkit-focus-ring-color auto 1px;\n    }\n    :host([readonly]:focus), :host([readonly]:focus-within),\n    :host([read-only]:focus), :host([read-only]:focus-within) {\n      outline: none;\n    }";
            break;
        case 'core':
            content = core_less_1["default"];
            break;
        case 'mathfield':
            content = mathfield_less_1["default"];
            break;
        case 'environment-popover':
            content = environment_popover_less_1["default"];
            break;
        case 'suggestion-popover':
            content = suggestion_popover_less_1["default"];
            break;
        case 'keystroke-caption':
            content = keystroke_caption_less_1["default"];
            break;
        case 'virtual-keyboard':
            content = virtual_keyboard_less_1["default"];
            break;
        case 'ui':
            content = style_less_1["default"];
            break;
        case 'menu':
            content = style_less_2["default"];
            break;
        default:
            debugger;
    }
    return content;
}
exports.getStylesheetContent = getStylesheetContent;
function getStylesheet(id) {
    if (!gStylesheets)
        gStylesheets = {};
    if (gStylesheets[id])
        return gStylesheets[id];
    gStylesheets[id] = new CSSStyleSheet();
    // @ts-ignore
    gStylesheets[id].replaceSync(getStylesheetContent(id));
    return gStylesheets[id];
}
exports.getStylesheet = getStylesheet;
var gInjectedStylesheets;
function injectStylesheet(id) {
    var _a;
    if (!('adoptedStyleSheets' in document)) {
        if (window.document.getElementById("mathlive-style-".concat(id)))
            return;
        var styleNode = window.document.createElement('style');
        styleNode.id = "mathlive-style-".concat(id);
        styleNode.append(window.document.createTextNode(getStylesheetContent(id)));
        window.document.head.appendChild(styleNode);
        return;
    }
    if (!gInjectedStylesheets)
        gInjectedStylesheets = {};
    if (((_a = gInjectedStylesheets[id]) !== null && _a !== void 0 ? _a : 0) !== 0)
        gInjectedStylesheets[id] += 1;
    else {
        var stylesheet = getStylesheet(id);
        // @ts-ignore
        document.adoptedStyleSheets = __spreadArray(__spreadArray([], document.adoptedStyleSheets, true), [stylesheet], false);
        gInjectedStylesheets[id] = 1;
    }
}
exports.injectStylesheet = injectStylesheet;
function releaseStylesheet(id) {
    if (!('adoptedStyleSheets' in document))
        return;
    if (!(gInjectedStylesheets === null || gInjectedStylesheets === void 0 ? void 0 : gInjectedStylesheets[id]))
        return;
    gInjectedStylesheets[id] -= 1;
    if (gInjectedStylesheets[id] <= 0) {
        var stylesheet_1 = gStylesheets[id];
        // @ts-ignore
        document.adoptedStyleSheets = document.adoptedStyleSheets.filter(function (x) { return x !== stylesheet_1; });
    }
}
exports.releaseStylesheet = releaseStylesheet;
