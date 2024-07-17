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
exports.OverlapAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
var OverlapAtom = /** @class */ (function (_super) {
    __extends(OverlapAtom, _super);
    function OverlapAtom(options) {
        var _this = this;
        var body = options.body;
        _this = _super.call(this, __assign(__assign({}, options), { type: 'overlap', body: typeof body === 'string' ? [new atom_class_1.Atom({ value: body })] : body, style: options === null || options === void 0 ? void 0 : options.style })) || this;
        _this.skipBoundary = true;
        _this.align = options === null || options === void 0 ? void 0 : options.align;
        _this.boxType = options === null || options === void 0 ? void 0 : options.boxType;
        return _this;
    }
    OverlapAtom.fromJson = function (json) {
        return new OverlapAtom(json);
    };
    OverlapAtom.prototype.toJson = function () {
        var options = {};
        if (this.align)
            options.align = this.align;
        if (this.boxType)
            options.boxType = this.boxType;
        return __assign(__assign({}, _super.prototype.toJson.call(this)), options);
    };
    OverlapAtom.prototype.render = function (context) {
        // For llap (18), rlap (270), clap (0)
        // smash (common), mathllap (0), mathrlap (0), mathclap (0)
        // See https://www.tug.org/TUGboat/tb22-4/tb72perlS.pdf
        // and https://tex.stackexchange.com/questions/98785/what-are-the-different-kinds-of-vertical-spacing-and-horizontal-spacing-commands
        var inner = atom_class_1.Atom.createBox(context, this.body, { classes: 'ML__inner' }); // @revisit
        if (!inner)
            return null;
        if (this.caret)
            inner.caret = this.caret;
        return this.bind(context, new box_1.Box([inner, new box_1.Box(null, { classes: 'ML__fix' })], {
            classes: this.align === 'right' ? 'ML__rlap' : 'ML__llap',
            type: this.boxType
        }));
    };
    return OverlapAtom;
}(atom_class_1.Atom));
exports.OverlapAtom = OverlapAtom;
