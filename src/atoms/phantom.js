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
exports.PhantomAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
var v_box_1 = require("../core/v-box");
var context_1 = require("../core/context");
var PhantomAtom = /** @class */ (function (_super) {
    __extends(PhantomAtom, _super);
    function PhantomAtom(options) {
        var _this = this;
        var _a, _b, _c, _d;
        _this = _super.call(this, __assign(__assign({}, options), { type: 'phantom' })) || this;
        _this.captureSelection = true;
        _this.isInvisible = (_a = options.isInvisible) !== null && _a !== void 0 ? _a : false;
        _this.smashDepth = (_b = options.smashDepth) !== null && _b !== void 0 ? _b : false;
        _this.smashHeight = (_c = options.smashHeight) !== null && _c !== void 0 ? _c : false;
        _this.smashWidth = (_d = options.smashWidth) !== null && _d !== void 0 ? _d : false;
        return _this;
    }
    PhantomAtom.fromJson = function (json) {
        return new PhantomAtom(json);
    };
    PhantomAtom.prototype.toJson = function () {
        var options = {};
        if (this.isInvisible)
            options.isInvisible = true;
        if (this.smashDepth)
            options.smashDepth = true;
        if (this.smashHeight)
            options.smashHeight = true;
        if (this.smashWidth)
            options.smashWidth = true;
        return __assign(__assign({}, _super.prototype.toJson.call(this)), options);
    };
    PhantomAtom.prototype.render = function (context) {
        var phantom = new context_1.Context({ parent: context, isPhantom: true });
        if (!this.smashDepth && !this.smashHeight && !this.smashWidth) {
            console.assert(this.isInvisible);
            return atom_class_1.Atom.createBox(phantom, this.body, { classes: 'ML__inner' });
        }
        var content = atom_class_1.Atom.createBox(this.isInvisible ? phantom : context, this.body);
        if (!content)
            return null;
        if (this.smashWidth) {
            var fix = new box_1.Box(null, { classes: 'ML__fix' });
            return new box_1.Box([content, fix], { classes: 'ML__rlap' }).wrap(context);
        }
        if (!this.smashHeight && !this.smashDepth)
            return content;
        if (this.smashHeight)
            content.height = 0;
        if (this.smashDepth)
            content.depth = 0;
        if (content.children) {
            for (var _i = 0, _a = content.children; _i < _a.length; _i++) {
                var box = _a[_i];
                if (this.smashHeight)
                    box.height = 0;
                if (this.smashDepth)
                    box.depth = 0;
            }
        }
        // We create a stack to suppress the HTML line height by setting
        // the display to 'table-cell' which prevents the browser from
        // acting on that height.
        return new v_box_1.VBox({ firstBaseline: [{ box: content }] }, { type: content.type }).wrap(context);
    };
    return PhantomAtom;
}(atom_class_1.Atom));
exports.PhantomAtom = PhantomAtom;
