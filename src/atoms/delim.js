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
exports.__esModule = true;
exports.SizedDelimAtom = exports.MiddleDelimAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
var delimiters_1 = require("../core/delimiters");
var tokenizer_1 = require("../core/tokenizer");
var definitions_utils_1 = require("../latex-commands/definitions-utils");
var MiddleDelimAtom = /** @class */ (function (_super) {
    __extends(MiddleDelimAtom, _super);
    function MiddleDelimAtom(options) {
        var _this = _super.call(this, __assign(__assign({}, options), { type: 'delim' })) || this;
        _this.value = options.delim;
        _this.size = options.size;
        return _this;
    }
    MiddleDelimAtom.fromJson = function (json) {
        return new MiddleDelimAtom(json);
    };
    MiddleDelimAtom.prototype.toJson = function () {
        return __assign(__assign({}, _super.prototype.toJson.call(this)), { delim: this.value, size: this.size });
    };
    MiddleDelimAtom.prototype.render = function (_context) {
        return new box_1.Box(this.value, { type: 'middle' });
    };
    MiddleDelimAtom.prototype._serialize = function (options) {
        if (!(options.expandMacro ||
            options.skipStyles ||
            options.skipPlaceholders) &&
            typeof this.verbatimLatex === 'string')
            return this.verbatimLatex;
        var def = (0, definitions_utils_1.getDefinition)(this.command, this.mode);
        if (def === null || def === void 0 ? void 0 : def.serialize)
            return def.serialize(this, options);
        return (0, tokenizer_1.latexCommand)(this.command, this.value);
    };
    return MiddleDelimAtom;
}(atom_class_1.Atom));
exports.MiddleDelimAtom = MiddleDelimAtom;
var SizedDelimAtom = /** @class */ (function (_super) {
    __extends(SizedDelimAtom, _super);
    function SizedDelimAtom(options) {
        var _this = _super.call(this, __assign(__assign({}, options), { type: 'sizeddelim', value: options.delim })) || this;
        _this.delimType = options.delimType;
        _this.size = options.size;
        return _this;
    }
    SizedDelimAtom.fromJson = function (json) {
        return new SizedDelimAtom(json);
    };
    SizedDelimAtom.prototype.toJson = function () {
        return __assign(__assign({}, _super.prototype.toJson.call(this)), { delim: this.value, size: this.size, delimType: this.delimType });
    };
    SizedDelimAtom.prototype.render = function (context) {
        var result = (0, delimiters_1.makeSizedDelim)(this.value, this.size, context, {
            classes: { open: 'ML__open', close: 'ML__close' }[this.delimType],
            type: this.delimType,
            isSelected: this.isSelected
        });
        if (!result)
            return null;
        result = this.bind(context, result);
        if (this.caret)
            result.caret = this.caret;
        return result;
    };
    SizedDelimAtom.prototype._serialize = function (options) {
        if (!(options.expandMacro ||
            options.skipStyles ||
            options.skipPlaceholders) &&
            typeof this.verbatimLatex === 'string')
            return this.verbatimLatex;
        var def = (0, definitions_utils_1.getDefinition)(this.command, this.mode);
        if (def === null || def === void 0 ? void 0 : def.serialize)
            return def.serialize(this, options);
        return (0, tokenizer_1.latexCommand)(this.command, this.value);
    };
    return SizedDelimAtom;
}(atom_class_1.Atom));
exports.SizedDelimAtom = SizedDelimAtom;
