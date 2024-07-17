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
exports.TextAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var definitions_utils_1 = require("../latex-commands/definitions-utils");
var TextAtom = /** @class */ (function (_super) {
    __extends(TextAtom, _super);
    function TextAtom(command, value, style) {
        var _this = _super.call(this, {
            type: 'text',
            command: command,
            mode: 'text',
            displayContainsHighlight: true
        }) || this;
        _this.value = value;
        _this.verbatimLatex = value;
        _this.applyStyle(style);
        return _this;
    }
    TextAtom.fromJson = function (json) {
        return new TextAtom(json.command, json.value, json.style);
    };
    TextAtom.prototype.render = function (context) {
        var result = this.createBox(context);
        if (this.caret)
            result.caret = this.caret;
        return result;
    };
    TextAtom.prototype._serialize = function (_options) {
        var _a;
        return (_a = this.verbatimLatex) !== null && _a !== void 0 ? _a : (0, definitions_utils_1.charToLatex)('text', this.value.codePointAt(0));
    };
    return TextAtom;
}(atom_class_1.Atom));
exports.TextAtom = TextAtom;
