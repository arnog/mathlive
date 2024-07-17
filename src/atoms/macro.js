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
exports.MacroArgumentAtom = exports.MacroAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var MacroAtom = /** @class */ (function (_super) {
    __extends(MacroAtom, _super);
    function MacroAtom(macro, options) {
        var _this = this;
        var _a;
        _this = _super.call(this, { type: 'macro', command: macro, style: options.style }) || this;
        _this.body = options.body;
        // Set the `captureSelection` attribute to true so that the atom is handled
        // as an unbreakable unit
        if (options.captureSelection === undefined) {
            if (options.args)
                _this.captureSelection = false;
            else
                _this.captureSelection = true;
        }
        else
            _this.captureSelection = options.captureSelection;
        // Don't use verbatimLatex to save the macro, as it can get wiped when
        // the atom is modified (adding super/subscript, for example).
        _this.macroArgs = options.args;
        _this.expand = (_a = options.expand) !== null && _a !== void 0 ? _a : false;
        return _this;
    }
    MacroAtom.fromJson = function (json) {
        return new MacroAtom(json.command, json);
    };
    MacroAtom.prototype.toJson = function () {
        var options = _super.prototype.toJson.call(this);
        if (this.expand)
            options.expand = true;
        if (this.captureSelection !== undefined)
            options.captureSelection = this.captureSelection;
        if (this.macroArgs)
            options.args = this.macroArgs;
        return options;
    };
    MacroAtom.prototype._serialize = function (options) {
        var _a;
        return options.expandMacro && this.expand
            ? this.bodyToLatex(options)
            : this.command + ((_a = this.macroArgs) !== null && _a !== void 0 ? _a : '');
    };
    MacroAtom.prototype.render = function (context) {
        var result = atom_class_1.Atom.createBox(context, this.body, { type: 'lift' });
        if (!result)
            return null;
        if (this.caret)
            result.caret = this.caret;
        return this.bind(context, result);
    };
    return MacroAtom;
}(atom_class_1.Atom));
exports.MacroAtom = MacroAtom;
var MacroArgumentAtom = /** @class */ (function (_super) {
    __extends(MacroArgumentAtom, _super);
    function MacroArgumentAtom() {
        return _super.call(this, { type: 'macro-argument' }) || this;
    }
    MacroArgumentAtom.fromJson = function (_json) {
        return new MacroArgumentAtom();
    };
    MacroArgumentAtom.prototype.toJson = function () {
        var options = _super.prototype.toJson.call(this);
        return options;
    };
    MacroArgumentAtom.prototype._serialize = function (_options) {
        return '';
    };
    MacroArgumentAtom.prototype.render = function (_context) {
        // const result = Atom.createBox(context, this.body);
        // if (!result) return null;
        // if (this.caret) result.caret = this.caret;
        // return this.bind(context, result);
        return null;
    };
    return MacroArgumentAtom;
}(atom_class_1.Atom));
exports.MacroArgumentAtom = MacroArgumentAtom;
