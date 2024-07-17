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
exports.LatexGroupAtom = exports.LatexAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
/**
 * Atom for raw latex character, while in LaTeX editing mode
 */
var LatexAtom = /** @class */ (function (_super) {
    __extends(LatexAtom, _super);
    function LatexAtom(value, options) {
        var _this = this;
        var _a;
        _this = _super.call(this, { type: 'latex', value: value, mode: 'latex' }) || this;
        _this.isSuggestion = (_a = options === null || options === void 0 ? void 0 : options.isSuggestion) !== null && _a !== void 0 ? _a : false;
        _this.isError = false;
        return _this;
    }
    LatexAtom.fromJson = function (json) {
        var result = new LatexAtom(json.value);
        if (json.isSuggestion)
            result.isSuggestion = true;
        if (json.isError)
            result.isError = true;
        return result;
    };
    LatexAtom.prototype.toJson = function () {
        var options = {};
        if (this.isSuggestion)
            options.isSuggestion = true;
        if (this.isError)
            options.isError = true;
        return __assign({ type: 'latex', value: this.value }, options);
    };
    LatexAtom.prototype.render = function (context) {
        var result = new box_1.Box(this.value, {
            classes: this.isSuggestion
                ? 'ML__suggestion'
                : this.isError
                    ? 'ML__error'
                    : '',
            type: 'latex',
            maxFontSize: 1.0
        });
        if (!result)
            return null;
        if (this.caret)
            result.caret = this.caret;
        return this.bind(context, result);
    };
    return LatexAtom;
}(atom_class_1.Atom));
exports.LatexAtom = LatexAtom;
/**
 * A group that represents a raw LaTeX editing zone.
 * There is only one LatexGroupAtom at a time in an expression.
 * All the children of a LatexGroupAtom are LatexAtom.
 */
var LatexGroupAtom = /** @class */ (function (_super) {
    __extends(LatexGroupAtom, _super);
    function LatexGroupAtom(latex) {
        if (latex === void 0) { latex = ''; }
        var _this = _super.call(this, { type: 'latexgroup', mode: 'latex' }) || this;
        _this.body = __spreadArray([], latex, true).map(function (c) { return new LatexAtom(c); });
        _this.skipBoundary = true;
        return _this;
    }
    LatexGroupAtom.fromJson = function (_json) {
        return new LatexGroupAtom();
    };
    LatexGroupAtom.prototype.toJson = function () {
        return _super.prototype.toJson.call(this);
    };
    LatexGroupAtom.prototype.render = function (context) {
        var box = atom_class_1.Atom.createBox(context, this.body);
        if (!box)
            return null;
        if (this.caret)
            box.caret = this.caret;
        // Need to bind the group so that the DOM element can be matched
        // and the atom iterated recursively. Otherwise, it behaves
        // as if `captureSelection === true`
        return this.bind(context, box);
    };
    LatexGroupAtom.prototype._serialize = function (_options) {
        var _a, _b;
        return (_b = (_a = this.body) === null || _a === void 0 ? void 0 : _a.map(function (x) { return x.value; }).join('')) !== null && _b !== void 0 ? _b : '';
    };
    return LatexGroupAtom;
}(atom_class_1.Atom));
exports.LatexGroupAtom = LatexGroupAtom;
