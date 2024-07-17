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
exports.CompositionAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
var CompositionAtom = /** @class */ (function (_super) {
    __extends(CompositionAtom, _super);
    function CompositionAtom(value, options) {
        var _a;
        return _super.call(this, { type: 'composition', mode: (_a = options === null || options === void 0 ? void 0 : options.mode) !== null && _a !== void 0 ? _a : 'math', value: value }) || this;
    }
    CompositionAtom.fromJson = function (json) {
        return new CompositionAtom(json.value, json);
    };
    CompositionAtom.prototype.toJson = function () {
        return _super.prototype.toJson.call(this);
    };
    CompositionAtom.prototype.render = function (context) {
        // In theory one would like to be able to draw the clauses
        // in an active composition. Unfortunately, there are
        // no API to give access to those clauses :(
        var result = new box_1.Box(this.value, {
            classes: 'ML__composition',
            type: 'composition'
        });
        this.bind(context, result);
        if (this.caret)
            result.caret = this.caret;
        return result;
    };
    CompositionAtom.prototype._serialize = function (_options) {
        return '';
    };
    return CompositionAtom;
}(atom_class_1.Atom));
exports.CompositionAtom = CompositionAtom;
