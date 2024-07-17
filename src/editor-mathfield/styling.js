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
exports.computeInsertStyle = exports.defaultInsertStyleHook = exports.validateStyle = exports.applyStyle = void 0;
var styling_1 = require("../editor-model/styling");
var commands_1 = require("../editor/commands");
function applyStyle(mathfield, inStyle) {
    mathfield.flushInlineShortcutBuffer();
    mathfield.stopCoalescingUndo();
    var style = validateStyle(mathfield, inStyle);
    var model = mathfield.model;
    if (model.selectionIsCollapsed) {
        // No selection, let's update the 'current' style
        if (mathfield.defaultStyle.fontSeries &&
            style.fontSeries === mathfield.defaultStyle.fontSeries)
            style.fontSeries = 'auto';
        if (style.fontShape && style.fontShape === mathfield.defaultStyle.fontShape)
            style.fontShape = 'auto';
        if (style.color && style.color === mathfield.defaultStyle.color)
            style.color = 'none';
        if (style.backgroundColor &&
            style.backgroundColor === mathfield.defaultStyle.backgroundColor)
            style.backgroundColor = 'none';
        if (style.fontSize && style.fontSize === mathfield.defaultStyle.fontSize)
            style.fontSize = 'auto';
        // This global style will be used the next time an atom is inserted
        mathfield.defaultStyle = __assign(__assign({}, mathfield.defaultStyle), style);
    }
    else {
        mathfield.model.deferNotifications({ content: true, type: 'insertText' }, function () {
            // Change the style of the selection
            model.selection.ranges.forEach(function (range) {
                return (0, styling_1.applyStyle)(model, range, style, { operation: 'toggle' });
            });
            mathfield.snapshot('style-change');
        });
    }
    return true;
}
exports.applyStyle = applyStyle;
(0, commands_1.register)({ applyStyle: applyStyle }, {
    target: 'mathfield',
    canUndo: true,
    changeContent: true
});
/**
 * Validate a style specification object
 */
function validateStyle(mathfield, style) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    var result = {};
    if (typeof style.color === 'string') {
        var newColor = (_b = mathfield.colorMap((_a = style.color) !== null && _a !== void 0 ? _a : style.verbatimColor)) !== null && _b !== void 0 ? _b : 'none';
        if (newColor !== style.color)
            result.verbatimColor = (_c = style.verbatimColor) !== null && _c !== void 0 ? _c : style.color;
        result.color = newColor;
    }
    if (typeof style.backgroundColor === 'string') {
        var newColor = (_e = mathfield.backgroundColorMap((_d = style.backgroundColor) !== null && _d !== void 0 ? _d : style.verbatimBackgroundColor)) !== null && _e !== void 0 ? _e : 'none';
        if (newColor !== style.backgroundColor) {
            result.verbatimBackgroundColor =
                (_f = style.verbatimBackgroundColor) !== null && _f !== void 0 ? _f : style.backgroundColor;
        }
        result.backgroundColor = newColor;
    }
    if (typeof style.fontFamily === 'string')
        result.fontFamily = style.fontFamily;
    if (typeof style.series === 'string')
        result.fontSeries = style.series;
    if (typeof style.fontSeries === 'string')
        result.fontSeries = style.fontSeries.toLowerCase();
    if (result.fontSeries) {
        result.fontSeries =
            (_g = {
                bold: 'b',
                medium: 'm',
                normal: 'm'
            }[result.fontSeries]) !== null && _g !== void 0 ? _g : result.fontSeries;
    }
    if (typeof style.shape === 'string')
        result.fontShape = style.shape;
    if (typeof style.fontShape === 'string')
        result.fontShape = style.fontShape.toLowerCase();
    if (result.fontShape) {
        result.fontShape =
            (_h = {
                italic: 'it',
                up: 'n',
                upright: 'n',
                normal: 'n'
            }[result.fontShape]) !== null && _h !== void 0 ? _h : result.fontShape;
    }
    if (style.variant)
        result.variant = style.variant.toLowerCase();
    if (style.variantStyle)
        result.variantStyle = style.variantStyle.toLowerCase();
    var size = (_j = style.size) !== null && _j !== void 0 ? _j : style.fontSize;
    if (typeof size === 'number')
        result.fontSize = Math.max(1, Math.min(10, size));
    else if (typeof size === 'string') {
        result.fontSize =
            (_k = {
                size1: 1,
                size2: 2,
                size3: 3,
                size4: 4,
                size5: 5,
                size6: 6,
                size7: 7,
                size8: 8,
                size9: 9,
                size10: 10
            }[size.toLowerCase()]) !== null && _k !== void 0 ? _k : {
                tiny: 1,
                scriptsize: 2,
                footnotesize: 3,
                small: 4,
                normal: 5,
                normalsize: 5,
                large: 6,
                Large: 7,
                LARGE: 8,
                huge: 9,
                Huge: 10
            }[size];
    }
    return result;
}
exports.validateStyle = validateStyle;
/** Default hook to determine the style to be applied when a new
 *  element is inserted
 */
function defaultInsertStyleHook(mathfield, offset, info) {
    var _a, _b;
    var model = mathfield.model;
    if (model.mode === 'latex')
        return {};
    var bias = mathfield.styleBias;
    if (bias === 'none')
        return mathfield.defaultStyle;
    // In text mode, we inherit the style of the sibling atom
    if (model.mode === 'text')
        return ((_b = (_a = model.at(bias === 'right' ? info.after : info.before)) === null || _a === void 0 ? void 0 : _a.style) !== null && _b !== void 0 ? _b : mathfield.defaultStyle);
    if (model.mode === 'math') {
        var atom = model.at(bias === 'right' ? info.after : info.before);
        if (!atom)
            return mathfield.defaultStyle;
        return __assign(__assign({}, atom.style), { variant: 'normal' });
    }
    return {};
}
exports.defaultInsertStyleHook = defaultInsertStyleHook;
function computeInsertStyle(mathfield) {
    var hook = mathfield.options.onInsertStyle;
    if (hook === null)
        return {};
    if (hook === undefined)
        hook = defaultInsertStyleHook;
    var model = mathfield.model;
    var bias = mathfield.styleBias;
    var atom = model.at(model.position);
    var before = ungroup(model, atom, bias);
    var after = ungroup(model, atom.rightSibling, bias);
    return hook(mathfield, model.position, { before: before, after: after });
}
exports.computeInsertStyle = computeInsertStyle;
function ungroup(model, atom, bias) {
    var _a;
    if (!atom)
        return -1;
    if (atom.type === 'first' && bias !== 'right')
        return -1;
    if (atom.type !== 'group')
        return model.offsetOf(atom);
    if (!atom.body || atom.body.length < 2)
        return -1;
    if (((_a = atom.body) === null || _a === void 0 ? void 0 : _a.length) === 1)
        return model.offsetOf(atom.body[0]);
    if (bias !== 'right')
        return model.offsetOf(atom.body[0]);
    return model.offsetOf(atom.body[atom.body.length - 1]);
}
