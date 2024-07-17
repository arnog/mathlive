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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.GenfracAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
var v_box_1 = require("../core/v-box");
var delimiters_1 = require("../core/delimiters");
var context_1 = require("../core/context");
var font_metrics_1 = require("../core/font-metrics");
/**
 * Genfrac -- Generalized Fraction
 *
 * Decompose fractions, binomials, and in general anything made
 * of a numerator and denominator, optionally separated by a fraction bar,
 * and optionally surrounded by delimiters (parentheses, brackets, etc...).
 *
 * Depending on the type of fraction the mathstyle is either
 * displaystyle or textstyle. This value can also be set to 'auto',
 * to indicate it should use the current mathstyle
 */
var GenfracAtom = /** @class */ (function (_super) {
    __extends(GenfracAtom, _super);
    function GenfracAtom(above, below, options) {
        var _this = this;
        var _a, _b, _c;
        _this = _super.call(this, __assign(__assign({}, options), { type: 'genfrac', displayContainsHighlight: true })) || this;
        _this.above = above;
        _this.below = below;
        _this.hasBarLine = (_a = options === null || options === void 0 ? void 0 : options.hasBarLine) !== null && _a !== void 0 ? _a : true;
        _this.continuousFraction = (_b = options === null || options === void 0 ? void 0 : options.continuousFraction) !== null && _b !== void 0 ? _b : false;
        _this.align = (_c = options === null || options === void 0 ? void 0 : options.align) !== null && _c !== void 0 ? _c : 'center';
        _this.numerPrefix = options === null || options === void 0 ? void 0 : options.numerPrefix;
        _this.denomPrefix = options === null || options === void 0 ? void 0 : options.denomPrefix;
        _this.mathstyleName = options === null || options === void 0 ? void 0 : options.mathstyleName;
        _this.leftDelim = options === null || options === void 0 ? void 0 : options.leftDelim;
        _this.rightDelim = options === null || options === void 0 ? void 0 : options.rightDelim;
        _this.fractionNavigationOrder = options === null || options === void 0 ? void 0 : options.fractionNavigationOrder;
        return _this;
    }
    GenfracAtom.fromJson = function (json) {
        return new GenfracAtom(json.above, json.below, json);
    };
    GenfracAtom.prototype.toJson = function () {
        var options = {};
        if (this.continuousFraction)
            options.continuousFraction = true;
        if (this.align !== 'center')
            options.align = this.align;
        if (this.numerPrefix)
            options.numerPrefix = this.numerPrefix;
        if (this.denomPrefix)
            options.denomPrefix = this.denomPrefix;
        if (this.leftDelim)
            options.leftDelim = this.leftDelim;
        if (this.rightDelim)
            options.rightDelim = this.rightDelim;
        if (!this.hasBarLine)
            options.hasBarLine = false;
        if (this.mathstyleName)
            options.mathstyleName = this.mathstyleName;
        if (this.fractionNavigationOrder)
            options.fractionNavigationOrder = this.fractionNavigationOrder;
        return __assign(__assign({}, _super.prototype.toJson.call(this)), options);
    };
    Object.defineProperty(GenfracAtom.prototype, "children", {
        // The order of the children, which is used for keyboard navigation order,
        // may be customized for fractions...
        get: function () {
            if (this._children)
                return this._children;
            var result = [];
            if (this.fractionNavigationOrder === 'denominator-numerator') {
                for (var _i = 0, _a = this.below; _i < _a.length; _i++) {
                    var x = _a[_i];
                    result.push.apply(result, x.children);
                    result.push(x);
                }
                for (var _b = 0, _c = this.above; _b < _c.length; _b++) {
                    var x = _c[_b];
                    result.push.apply(result, x.children);
                    result.push(x);
                }
            }
            else {
                for (var _d = 0, _e = this.above; _d < _e.length; _d++) {
                    var x = _e[_d];
                    result.push.apply(result, x.children);
                    result.push(x);
                }
                for (var _f = 0, _g = this.below; _f < _g.length; _f++) {
                    var x = _g[_f];
                    result.push.apply(result, x.children);
                    result.push(x);
                }
            }
            this._children = result;
            return result;
        },
        enumerable: false,
        configurable: true
    });
    GenfracAtom.prototype.render = function (context) {
        var _a, _b;
        var fracContext = new context_1.Context({ parent: context, mathstyle: this.mathstyleName }, this.style);
        var metrics = fracContext.metrics;
        var numContext = new context_1.Context({
            parent: fracContext,
            mathstyle: this.continuousFraction ? '' : 'numerator'
        }, this.style);
        var numerBox = this.numerPrefix
            ? new box_1.Box([new box_1.Box(this.numerPrefix), atom_class_1.Atom.createBox(numContext, this.above)], { isTight: numContext.isTight, type: 'ignore' })
            : (_a = atom_class_1.Atom.createBox(numContext, this.above, { type: 'ignore' })) !== null && _a !== void 0 ? _a : new box_1.Box(null, { type: 'ignore' });
        var denomContext = new context_1.Context({
            parent: fracContext,
            mathstyle: this.continuousFraction ? '' : 'denominator'
        }, this.style);
        var denomBox = this.denomPrefix
            ? new box_1.Box([
                new box_1.Box(this.denomPrefix),
                atom_class_1.Atom.createBox(denomContext, this.below, { type: 'ignore' }),
            ])
            : (_b = atom_class_1.Atom.createBox(denomContext, this.below, { type: 'ignore' })) !== null && _b !== void 0 ? _b : new box_1.Box(null, { type: 'ignore' });
        var ruleThickness = this.hasBarLine ? metrics.defaultRuleThickness : 0;
        // Rule 15b from TeXBook Appendix G, p.444
        //
        // 15b. If C > T, set u ← σ8 and v ← σ11. Otherwise set u ← σ9 or σ10,according
        // as θ ̸= 0 or θ = 0, and set v ← σ12. (The fraction will be typeset with
        // its numerator shifted up by an amount u with respect to the current
        // baseline, and with the denominator shifted down by v, unless the boxes
        // are unusually large.)
        var numerShift;
        var clearance = 0;
        var denomShift;
        if (fracContext.isDisplayStyle) {
            numerShift = numContext.metrics.num1; // Set u ← σ8
            clearance = ruleThickness > 0 ? 3 * ruleThickness : 7 * ruleThickness;
            denomShift = denomContext.metrics.denom1; // V ← σ11
        }
        else {
            if (ruleThickness > 0) {
                numerShift = numContext.metrics.num2; // U ← σ9
                clearance = ruleThickness; //  Φ ← θ
            }
            else {
                numerShift = numContext.metrics.num3; // U ← σ10
                clearance = 3 * metrics.defaultRuleThickness; // Φ ← 3 ξ8
            }
            denomShift = denomContext.metrics.denom2; // V ← σ12
        }
        var classes = [];
        if (this.isSelected)
            classes.push('ML__selected');
        var numerDepth = numerBox.depth;
        var denomHeight = denomBox.height;
        var frac;
        if (ruleThickness <= 0) {
            // Rule 15c from Appendix G
            // No bar line between numerator and denominator
            var candidateClearance = numerShift - numerDepth - (denomHeight - denomShift);
            if (candidateClearance < clearance) {
                numerShift += (clearance - candidateClearance) / 2;
                denomShift += (clearance - candidateClearance) / 2;
            }
            frac = new v_box_1.VBox({
                individualShift: [
                    {
                        box: numerBox,
                        shift: -numerShift,
                        classes: __spreadArray(__spreadArray([], classes, true), [align(this.align)], false)
                    },
                    {
                        box: denomBox,
                        shift: denomShift,
                        classes: __spreadArray(__spreadArray([], classes, true), [align(this.align)], false)
                    },
                ]
            }).wrap(fracContext);
        }
        else {
            // Rule 15d from Appendix G of the TeXBook.
            // There is a bar line between the numerator and the denominator
            var fracLine = new box_1.Box(null, {
                classes: 'ML__frac-line',
                mode: this.mode,
                style: this.style
            });
            fracLine.softWidth = Math.max(numerBox.width, denomBox.width);
            fracLine.height = ruleThickness / 2;
            fracLine.depth = ruleThickness / 2;
            var numerLine = font_metrics_1.AXIS_HEIGHT + ruleThickness / 2;
            if (numerShift < clearance + numerDepth + numerLine)
                numerShift = clearance + numerDepth + numerLine;
            var denomLine = font_metrics_1.AXIS_HEIGHT - ruleThickness / 2;
            if (denomShift < clearance + denomHeight - denomLine)
                denomShift = clearance + denomHeight - denomLine;
            frac = new v_box_1.VBox({
                individualShift: [
                    {
                        box: denomBox,
                        shift: denomShift,
                        classes: __spreadArray(__spreadArray([], classes, true), [align(this.align)], false)
                    },
                    { box: fracLine, shift: -denomLine, classes: classes },
                    {
                        box: numerBox,
                        shift: -numerShift,
                        classes: __spreadArray(__spreadArray([], classes, true), [align(this.align)], false)
                    },
                ]
            }).wrap(fracContext);
            // console.log('denom', denomBox.height, denomBox.depth);
            // console.log('fracline', fracLine.height, fracLine.depth);
            // console.log('numer', numerBox.height, numerBox.depth);
            // console.log('frac', frac.height, frac.depth);
            // console.log(
            //   'expected',
            //   denomBox.height + denomBox.depth + fracLine.height,
            //   numerBox.height + numerBox.depth + fracLine.depth
            // );
        }
        // Rule 15e of Appendix G
        var delimSize = fracContext.isDisplayStyle
            ? metrics.delim1
            : metrics.delim2;
        // Optional delimiters
        var leftDelim = this.leftDelim
            ? this.bind(context, (0, delimiters_1.makeCustomSizedDelim)('open', this.leftDelim, delimSize, true, context, { style: this.style, mode: this.mode, isSelected: this.isSelected }))
            : (0, delimiters_1.makeNullDelimiter)(fracContext, 'ML__open');
        var rightDelim = null;
        if (this.continuousFraction) {
            // Zero width for `\cfrac`
            rightDelim = new box_1.Box(null, { type: 'close' });
        }
        else if (!this.rightDelim)
            rightDelim = (0, delimiters_1.makeNullDelimiter)(fracContext, 'ML__close');
        else {
            rightDelim = this.bind(context, (0, delimiters_1.makeCustomSizedDelim)('close', this.rightDelim, delimSize, true, context, { style: this.style, mode: this.mode, isSelected: this.isSelected }));
        }
        // TeXBook p. 170 "fractions are treated as type Inner."
        var mfrac = new box_1.Box([leftDelim, frac, rightDelim], {
            isTight: fracContext.isTight,
            type: 'inner',
            classes: 'ML__mfrac'
        });
        var result = this.bind(context, mfrac);
        if (this.caret)
            result.caret = this.caret;
        return this.attachSupsub(context, { base: result });
    };
    return GenfracAtom;
}(atom_class_1.Atom));
exports.GenfracAtom = GenfracAtom;
function align(v) {
    var _a;
    return ((_a = {
        left: 'ML__left',
        right: 'ML__right',
        center: 'ML__center'
    }[v]) !== null && _a !== void 0 ? _a : 'ML__center');
}
