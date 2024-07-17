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
exports.SpacingAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
var registers_utils_1 = require("../core/registers-utils");
var definitions_utils_1 = require("../latex-commands/definitions-utils");
var SpacingAtom = /** @class */ (function (_super) {
    __extends(SpacingAtom, _super);
    function SpacingAtom(options) {
        var _this = this;
        var _a;
        _this = _super.call(this, __assign({ type: 'spacing' }, options)) || this;
        _this.width = options === null || options === void 0 ? void 0 : options.width;
        _this._braced = (_a = options === null || options === void 0 ? void 0 : options.braced) !== null && _a !== void 0 ? _a : false;
        return _this;
    }
    SpacingAtom.fromJson = function (json) {
        return new SpacingAtom(json);
    };
    SpacingAtom.prototype.toJson = function () {
        var json = _super.prototype.toJson.call(this);
        if (this.width !== undefined)
            json.width = this.width;
        if (this._braced)
            json.braced = true;
        return json;
    };
    SpacingAtom.prototype.render = function (context) {
        var _a;
        if (this.command === 'space')
            return new box_1.Box(this.mode === 'math' ? null : ' ');
        var result;
        if (this.width !== undefined) {
            result = new box_1.Box(null, { classes: 'ML__mspace' });
            result.left = context.toEm(this.width);
        }
        else {
            var spacingCls = (_a = {
                '\\qquad': 'ML__qquad',
                '\\quad': 'ML__quad',
                '\\enspace': 'ML__enspace',
                '\\;': 'ML__thickspace',
                '\\:': 'ML__mediumspace',
                '\\>': 'ML__mediumspace',
                '\\,': 'ML__thinspace',
                '\\!': 'ML__negativethinspace'
            }[this.command]) !== null && _a !== void 0 ? _a : 'ML__mediumspace';
            result = new box_1.Box(null, { classes: spacingCls });
        }
        result = this.bind(context, result);
        if (this.caret)
            result.caret = this.caret;
        return result;
    };
    SpacingAtom.prototype._serialize = function (options) {
        var _a;
        if (!options.expandMacro && typeof this.verbatimLatex === 'string')
            return this.verbatimLatex;
        var def = (0, definitions_utils_1.getDefinition)(this.command, this.mode);
        if (def === null || def === void 0 ? void 0 : def.serialize)
            return def.serialize(this, options);
        // Two kinds of spacing commands:
        // - `\hskip`, `\kern`, `\hspace` and `hspace*` which take one glue
        //     argument:
        // i.e. `\hspace1em` or `\hspace{1em}`.
        // - `\quad`, etc... which take no parameters.
        var command = (_a = this.command) !== null && _a !== void 0 ? _a : '';
        if (this.width === undefined)
            return command;
        // When the value is a register, it should not be braced
        if (this._braced && !('register' in this.width))
            return "".concat(command, "{").concat((0, registers_utils_1.serializeLatexValue)(this.width), "}");
        return "".concat(command).concat((0, registers_utils_1.serializeLatexValue)(this.width));
    };
    return SpacingAtom;
}(atom_class_1.Atom));
exports.SpacingAtom = SpacingAtom;
