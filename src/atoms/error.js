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
exports.__esModule = true;
exports.ErrorAtom = void 0;
var atom_class_1 = require("../core/atom-class");
/*
 * An atom representing a syntactic error, such as an unknown command
 */
var ErrorAtom = /** @class */ (function (_super) {
    __extends(ErrorAtom, _super);
    function ErrorAtom(value) {
        var _this = _super.call(this, { type: 'error', value: value, command: value, mode: 'math' }) || this;
        _this.verbatimLatex = value;
        return _this;
    }
    ErrorAtom.fromJson = function (json) {
        return new ErrorAtom(json.command);
    };
    ErrorAtom.prototype.toJson = function () {
        return _super.prototype.toJson.call(this);
    };
    ErrorAtom.prototype.render = function (context) {
        var result = this.createBox(context, { classes: 'ML__error' });
        if (this.caret)
            result.caret = this.caret;
        return result;
    };
    return ErrorAtom;
}(atom_class_1.Atom));
exports.ErrorAtom = ErrorAtom;
