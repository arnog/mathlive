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
exports.addSkipBefore = exports.SkipBox = void 0;
var box_1 = require("./box");
var SkipBox = /** @class */ (function (_super) {
    __extends(SkipBox, _super);
    function SkipBox(width) {
        var _this = _super.call(this, null, { type: 'skip' }) || this;
        _this._width = width;
        return _this;
    }
    SkipBox.prototype.toMarkup = function () {
        return "<span style=\"display:inline-block;width:".concat(Math.ceil(this.width * 100) / 100, "em\"></span>");
    };
    return SkipBox;
}(box_1.Box));
exports.SkipBox = SkipBox;
function addSkipBefore(box, width) {
    if (!box.parent)
        return;
    var siblings = box.parent.children;
    var i = siblings.indexOf(box);
    // If box is the first non-ignore box of its parent,
    // it is a candidate to have the skip box lifted up
    var j = i - 1;
    while (j >= 0) {
        if (siblings[j].type === 'ignore')
            j -= 1;
        else
            break;
    }
    if (j < 0 && box.parent.parent && box.parent.type === 'lift') {
        addSkipBefore(box.parent, width);
        return;
    }
    // If there's a skip box to our left, merge
    if (i > 0 && siblings[i - 1].type === 'skip')
        siblings[i - 1].width += width;
    else
        siblings.splice(i, 0, new SkipBox(width));
}
exports.addSkipBefore = addSkipBefore;
