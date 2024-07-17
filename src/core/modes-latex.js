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
exports.LatexMode = void 0;
/* eslint-disable no-new */
var modes_utils_1 = require("./modes-utils");
var latex_1 = require("../atoms/latex");
var LatexMode = /** @class */ (function (_super) {
    __extends(LatexMode, _super);
    function LatexMode() {
        return _super.call(this, 'latex') || this;
    }
    LatexMode.prototype.createAtom = function (command) {
        return new latex_1.LatexAtom(command);
    };
    LatexMode.prototype.serialize = function (run, _options) {
        return run
            .filter(function (x) { return x instanceof latex_1.LatexAtom && !x.isSuggestion; })
            .map(function (x) { return x.value; });
    };
    LatexMode.prototype.getFont = function () {
        return null;
    };
    return LatexMode;
}(modes_utils_1.Mode));
exports.LatexMode = LatexMode;
new LatexMode();
