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
exports.SubsupAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
var context_1 = require("../core/context");
var SubsupAtom = /** @class */ (function (_super) {
    __extends(SubsupAtom, _super);
    function SubsupAtom(options) {
        var _this = _super.call(this, { type: 'subsup', style: options === null || options === void 0 ? void 0 : options.style }) || this;
        _this.subsupPlacement = 'auto';
        return _this;
    }
    SubsupAtom.fromJson = function (json) {
        var result = new SubsupAtom(json);
        for (var _i = 0, NAMED_BRANCHES_1 = atom_class_1.NAMED_BRANCHES; _i < NAMED_BRANCHES_1.length; _i++) {
            var branch = NAMED_BRANCHES_1[_i];
            if (json[branch])
                result.setChildren(json[branch], branch);
        }
        return result;
    };
    SubsupAtom.prototype.render = function (context) {
        // The box type of a `subsup` atom is 'supsub' as it doesn't
        // have any special INTER_BOX_SPACING with its attached atom (previous box)
        var _a;
        var phantomCtx = new context_1.Context({ parent: context, isPhantom: true });
        var leftSibling = this.leftSibling;
        var base = (_a = leftSibling.render(phantomCtx)) !== null && _a !== void 0 ? _a : new box_1.Box(null);
        var phantom = new box_1.Box(null);
        phantom.height = base.height;
        phantom.depth = base.depth;
        // > subscripts and superscripts merely get attached to atoms without
        // > changing the atomic type. -- TeXBook p. 171
        return this.attachSupsub(context, {
            base: phantom,
            isCharacterBox: leftSibling.isCharacterBox(),
            // Set to 'ignore' so that it is ignored during inter-box spacing
            // adjustment.
            type: 'ignore'
        });
    };
    SubsupAtom.prototype._serialize = function (options) {
        return this.supsubToLatex(options);
    };
    return SubsupAtom;
}(atom_class_1.Atom));
exports.SubsupAtom = SubsupAtom;
