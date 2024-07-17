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
exports.BoxAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
var context_1 = require("../core/context");
var tokenizer_1 = require("../core/tokenizer");
/**
 * A BoxAtom is an atom that renders a box around its content.
 * Not to be confused with the Box class, which represents the geometric
 * rendering of an atom.
 */
var BoxAtom = /** @class */ (function (_super) {
    __extends(BoxAtom, _super);
    function BoxAtom(options) {
        var _this = _super.call(this, {
            mode: options.mode,
            command: options.command,
            style: options.style,
            body: options.body,
            type: 'box'
        }) || this;
        _this.framecolor = options.framecolor;
        _this.backgroundcolor = options.backgroundcolor;
        _this.padding = options.padding;
        _this.offset = options.offset;
        _this.border = options.border;
        return _this;
    }
    BoxAtom.fromJson = function (json) {
        return new BoxAtom(json);
    };
    BoxAtom.prototype.toJson = function () {
        return __assign(__assign({}, _super.prototype.toJson.call(this)), { framecolor: this.framecolor, backgroundcolor: this.backgroundcolor, padding: this.padding, offset: this.offset, border: this.border });
    };
    BoxAtom.prototype.render = function (parentContext) {
        var _a, _b, _c, _d;
        // Base is the main content "inside" the box
        var base = atom_class_1.Atom.createBox(parentContext, this.body, { type: 'lift' });
        if (!base)
            return null;
        var offset = parentContext.toEm((_a = this.offset) !== null && _a !== void 0 ? _a : { dimension: 0 });
        base.depth += offset;
        base.setStyle('display', 'inline-block');
        base.setStyle('position', 'relative');
        base.setStyle('height', Math.floor(100 * base.height + base.depth) / 100, 'em');
        base.setStyle('vertical-align', -Math.floor(100 * base.height) / 100, 'em');
        var context = new context_1.Context({ parent: parentContext }, this.style);
        // The padding extends outside of the base
        var padding = context.toEm((_b = this.padding) !== null && _b !== void 0 ? _b : { register: 'fboxsep' });
        // let borderWidth = '';
        // if (this.framecolor)
        //   borderWidth = `${context.getRegisterAsEm('fboxrule')}em`;
        // else if (this.border) borderWidth = lineWidth(this.border);
        // This box will represent the box (background and border).
        // It's positioned to overlap the base.
        // The 'ML__box' class is required to prevent the box from being omitted
        // during rendering (it looks like an empty, no-op box)
        var box = new box_1.Box(null, { classes: 'ML__box' });
        box.height = base.height + padding;
        box.depth = base.depth + padding;
        box.setStyle('box-sizing', 'border-box');
        box.setStyle('position', 'absolute');
        box.setStyle('top', -padding + 0.3, 'em'); // empirical
        box.setStyle('left', 0);
        box.setStyle('height', box.height + box.depth, 'em');
        box.setStyle('width', '100%');
        if (this.backgroundcolor) {
            box.setStyle('background-color', (_c = context.toColor(this.backgroundcolor)) !== null && _c !== void 0 ? _c : 'transparent');
        }
        if (this.framecolor) {
            box.setStyle('border', "".concat(context.getRegisterAsEm('fboxrule', 2), "em solid ").concat((_d = context.toColor(this.framecolor)) !== null && _d !== void 0 ? _d : 'black'));
        }
        if (this.border)
            box.setStyle('border', this.border);
        // box.setStyle('top', /* width of the border */);
        // The result is a box that encloses the box and the base
        var result = new box_1.Box([box, base], { type: 'lift' });
        // Set its position as relative so that the box can be absolute positioned
        // over the base
        result.setStyle('display', 'inline-block');
        result.setStyle('position', 'relative');
        result.setStyle('line-height', 0);
        // The padding adds to the depth, height and width of the box
        result.height = base.height + padding + (offset > 0 ? offset : 0);
        result.depth = base.depth + padding + (offset < 0 ? -offset : 0);
        result.setStyle('padding-left', padding, 'em');
        result.setStyle('padding-right', padding, 'em');
        result.setStyle('height', Math.floor(100 * (base.height + base.depth + 2 * padding + Math.abs(offset))) / 100, 'em');
        result.setStyle('margin-top', -padding, 'em');
        result.setStyle('top', Math.floor(100 * (base.depth - base.height + 2 * padding - offset)) / 100, 'em');
        result.setStyle('vertical-align', Math.floor(100 * (base.depth + 2 * padding)) / 100, 'em');
        if (this.caret)
            result.caret = this.caret;
        return this.attachSupsub(parentContext, { base: result });
    };
    BoxAtom.prototype._serialize = function (options) {
        if (!options.skipStyles)
            return _super.prototype._serialize.call(this, options);
        return (0, tokenizer_1.joinLatex)([this.bodyToLatex(options), this.supsubToLatex(options)]);
    };
    return BoxAtom;
}(atom_class_1.Atom));
exports.BoxAtom = BoxAtom;
// function lineWidth(s: string): string {
//   const m = s.match(/[\d]+(\.[\d]+)?[a-zA-Z]+/);
//   if (m) return m[0];
//   return '';
// }
