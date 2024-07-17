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
exports.LeftRightAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
var delimiters_1 = require("../core/delimiters");
var context_1 = require("../core/context");
var tokenizer_1 = require("../core/tokenizer");
/**
 *  \left....\right
 *
 * Note that we can encounter malformed \left...\right, for example
 * a \left without a matching \right or vice versa. In that case, the
 * leftDelim (resp. rightDelim) will be undefined. We still need to handle
 * those cases.
 *
 */
var LeftRightAtom = /** @class */ (function (_super) {
    __extends(LeftRightAtom, _super);
    function LeftRightAtom(variant, body, options) {
        var _this = _super.call(this, {
            type: 'leftright',
            style: options.style,
            displayContainsHighlight: true
        }) || this;
        _this.variant = variant;
        _this.body = body;
        _this.leftDelim = options.leftDelim;
        _this.rightDelim = options.rightDelim;
        return _this;
    }
    LeftRightAtom.fromJson = function (json) {
        var _a;
        return new LeftRightAtom((_a = json.variant) !== null && _a !== void 0 ? _a : '', json.body, json);
    };
    LeftRightAtom.prototype.toJson = function () {
        var result = _super.prototype.toJson.call(this);
        if (this.variant)
            result.variant = this.variant;
        if (this.leftDelim)
            result.leftDelim = this.leftDelim;
        if (this.rightDelim)
            result.rightDelim = this.rightDelim;
        return result;
    };
    LeftRightAtom.prototype._serialize = function (options) {
        var _a, _b;
        var rightDelim = this.matchingRightDelim();
        if (this.variant === 'left...right') {
            return (0, tokenizer_1.joinLatex)([
                '\\left',
                (_a = this.leftDelim) !== null && _a !== void 0 ? _a : '.',
                this.bodyToLatex(options),
                '\\right',
                rightDelim,
            ]);
        }
        if (this.variant === 'mleft...mright') {
            return (0, tokenizer_1.joinLatex)([
                '\\mleft',
                (_b = this.leftDelim) !== null && _b !== void 0 ? _b : '.',
                this.bodyToLatex(options),
                '\\mright',
                rightDelim,
            ]);
        }
        return (0, tokenizer_1.joinLatex)([
            !this.leftDelim || this.leftDelim === '.' ? '' : this.leftDelim,
            this.bodyToLatex(options),
            rightDelim,
        ]);
    };
    LeftRightAtom.prototype.matchingRightDelim = function () {
        var _a, _b;
        if (this.rightDelim && this.rightDelim !== '?')
            return this.rightDelim;
        var leftDelim = (_a = this.leftDelim) !== null && _a !== void 0 ? _a : '.';
        return (_b = delimiters_1.RIGHT_DELIM[leftDelim]) !== null && _b !== void 0 ? _b : leftDelim;
    };
    LeftRightAtom.prototype.render = function (parentContext) {
        var _a, _b;
        var context = new context_1.Context({ parent: parentContext }, this.style);
        console.assert(this.body !== undefined);
        // Calculate its height and depth
        // The size of delimiters is the same, regardless of what mathstyle we are
        // in. Thus, to correctly calculate the size of delimiter we need around
        // a group, we scale down the inner size based on the size.
        var delimContext = new context_1.Context({ parent: parentContext, mathstyle: 'textstyle' }, this.style);
        var inner = (_a = atom_class_1.Atom.createBox(context, this.body, { type: 'inner' })) !== null && _a !== void 0 ? _a : new box_1.Box(null, { type: 'inner' });
        var innerHeight = inner.height / delimContext.scalingFactor;
        var innerDepth = inner.depth / delimContext.scalingFactor;
        var boxes = [];
        // Add the left delimiter to the beginning of the expression
        // @revisit: we call bind() on three difference boxes. Each box should
        // have a different ID. We should have a Box.hitTest() method to properly
        // handle the different boxes.
        if (this.leftDelim) {
            boxes.push(this.bind(delimContext, (0, delimiters_1.makeLeftRightDelim)('open', this.leftDelim, innerHeight, innerDepth, delimContext, {
                isSelected: this.isSelected,
                classes: 'ML__open' + (this.containsCaret ? ' ML__contains-caret' : ''),
                mode: this.mode,
                style: this.style
            })));
        }
        if (inner) {
            // Now that we know the height/depth of the `\left...\right`,
            // replace the middle delimiter (\middle) boxes with correctly sized ones
            upgradeMiddle(inner.children, this, context, innerHeight, innerDepth);
            boxes.push(inner);
        }
        // Add the right delimiter to the end of the expression.
        if (this.rightDelim) {
            var classes = this.containsCaret ? ' ML__contains-caret' : '';
            var delim = this.rightDelim;
            if (delim === '?') {
                if (context.smartFence) {
                    // Use a placeholder delimiter matching the open delimiter
                    delim = this.matchingRightDelim();
                    classes += ' ML__smart-fence__close';
                }
                else
                    delim = '.';
            }
            boxes.push(this.bind(delimContext, (0, delimiters_1.makeLeftRightDelim)('close', delim, innerHeight, innerDepth, delimContext, {
                isSelected: this.isSelected,
                classes: classes + ' ML__close',
                mode: this.mode,
                style: this.style
            })));
        }
        // If the left sibling is a function (e.g. `\sin`, `f`...)
        // or we use the `mleft...mright` variant,
        // use a tighter spacing
        var tightSpacing = this.variant === 'mleft...mright';
        var sibling = this.leftSibling;
        if (sibling) {
            if (!tightSpacing && sibling.isFunction)
                tightSpacing = true;
            if (!tightSpacing &&
                sibling.type === 'subsup' &&
                ((_b = sibling.leftSibling) === null || _b === void 0 ? void 0 : _b.isFunction))
                tightSpacing = true;
        }
        var result = new box_1.Box(boxes, {
            type: tightSpacing ? 'close' : 'inner',
            classes: 'ML__left-right'
        });
        result.setStyle('margin-top', "".concat(-inner.depth, "em"));
        result.setStyle('height', "".concat(inner.height + inner.depth, "em"));
        if (this.caret)
            result.caret = this.caret;
        return this.bind(context, result.wrap(context));
    };
    return LeftRightAtom;
}(atom_class_1.Atom));
exports.LeftRightAtom = LeftRightAtom;
function upgradeMiddle(boxes, atom, context, height, depth) {
    if (!boxes)
        return;
    for (var i = 0; i < boxes.length; i++) {
        var child = boxes[i];
        if (child.type === 'middle') {
            boxes[i] = atom.bind(context, (0, delimiters_1.makeLeftRightDelim)('inner', child.value, height, depth, context, {
                isSelected: atom.isSelected
            }));
            boxes[i].caret = child.caret;
            boxes[i].isSelected = child.isSelected;
            boxes[i].cssId = child.cssId;
            boxes[i].htmlData = child.htmlData;
            boxes[i].htmlStyle = child.htmlStyle;
            boxes[i].attributes = child.attributes;
            boxes[i].cssProperties = child.cssProperties;
        }
        else if (child.children)
            upgradeMiddle(child.children, atom, context, height, depth);
    }
}
