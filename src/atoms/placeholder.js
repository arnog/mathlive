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
exports.PlaceholderAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var PlaceholderAtom = /** @class */ (function (_super) {
    __extends(PlaceholderAtom, _super);
    function PlaceholderAtom(options) {
        var _this = this;
        var _a;
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        _this = _super.call(this, {
            type: 'placeholder',
            command: '\\placeholder',
            mode: (_a = options === null || options === void 0 ? void 0 : options.mode) !== null && _a !== void 0 ? _a : 'math',
            style: options === null || options === void 0 ? void 0 : options.style
        }) || this;
        _this.captureSelection = true;
        return _this;
    }
    PlaceholderAtom.fromJson = function (json) {
        return new PlaceholderAtom(json);
    };
    PlaceholderAtom.prototype.toJson = function () {
        return _super.prototype.toJson.call(this);
    };
    PlaceholderAtom.prototype.render = function (context) {
        var result;
        this.value = context.placeholderSymbol;
        if (typeof context.renderPlaceholder === 'function')
            result = context.renderPlaceholder(context);
        else
            result = this.createBox(context);
        if (this.caret)
            result.classes += ' ML__placeholder-selected';
        return result;
    };
    PlaceholderAtom.prototype._serialize = function (options) {
        if (options.skipPlaceholders)
            return '';
        return '\\placeholder{}';
    };
    return PlaceholderAtom;
}(atom_class_1.Atom));
exports.PlaceholderAtom = PlaceholderAtom;
