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
exports.ExtensibleSymbolAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
var tokenizer_1 = require("../core/tokenizer");
var font_metrics_1 = require("../core/font-metrics");
var definitions_utils_1 = require("../latex-commands/definitions-utils");
/**
 * Operators are handled in the TeXbook pg. 443-444, rule 13(a).
 */
var ExtensibleSymbolAtom = /** @class */ (function (_super) {
    __extends(ExtensibleSymbolAtom, _super);
    function ExtensibleSymbolAtom(symbol, options) {
        var _this = _super.call(this, __assign(__assign({}, options), { type: 'extensible-symbol', isFunction: options === null || options === void 0 ? void 0 : options.isFunction })) || this;
        _this.value = symbol;
        _this.variant = options === null || options === void 0 ? void 0 : options.variant;
        _this.subsupPlacement = options === null || options === void 0 ? void 0 : options.limits;
        return _this;
    }
    ExtensibleSymbolAtom.fromJson = function (json) {
        return new ExtensibleSymbolAtom(json.symbol, json);
    };
    ExtensibleSymbolAtom.prototype.toJson = function () {
        var result = _super.prototype.toJson.call(this);
        if (this.variant)
            result.variant = this.variant;
        if (this.subsupPlacement)
            result.limits = this.subsupPlacement;
        if (this.value)
            result.symbol = this.value;
        return result;
    };
    ExtensibleSymbolAtom.prototype.render = function (context) {
        var _a;
        // Most symbol operators get larger in displaystyle (rule 13)
        // except `\smallint`
        var large = context.isDisplayStyle && this.value !== '\\smallint';
        var base = new box_1.Box(this.value, {
            fontFamily: large ? 'Size2-Regular' : 'Size1-Regular',
            classes: 'ML__op-symbol ' + (large ? 'ML__large-op' : 'ML__small-op'),
            type: 'op',
            maxFontSize: context.scalingFactor,
            isSelected: this.isSelected
        });
        if (!base)
            return null;
        // Apply italic correction
        base.right = base.italic;
        // Shift the symbol so its center lies on the axis (rule 13). It
        // appears that our fonts have the centers of the symbols already
        // almost on the axis, so these numbers are very small. Note we
        // don't actually apply this here, but instead it is used either in
        // the vlist creation or separately when there are no limits.
        var baseShift = (base.height - base.depth) / 2 - font_metrics_1.AXIS_HEIGHT * context.scalingFactor;
        // The slant of the symbol is just its italic correction.
        var slant = base.italic;
        base.setTop(baseShift);
        var result = base;
        if (this.superscript || this.subscript) {
            var limits = (_a = this.subsupPlacement) !== null && _a !== void 0 ? _a : 'auto';
            if (limits === 'auto' && context.isDisplayStyle)
                limits = 'over-under';
            result =
                limits === 'over-under'
                    ? this.attachLimits(context, { base: base, baseShift: baseShift, slant: slant })
                    : this.attachSupsub(context, { base: base });
        }
        // Bind the generated box with its limits so they
        // can all be selected as one
        return new box_1.Box(this.bind(context, result), {
            type: 'op',
            caret: this.caret,
            isSelected: this.isSelected,
            classes: 'ML__op-group'
        }).wrap(context);
    };
    ExtensibleSymbolAtom.prototype._serialize = function (options) {
        if (!(options.expandMacro ||
            options.skipStyles ||
            options.skipPlaceholders) &&
            typeof this.verbatimLatex === 'string')
            return this.verbatimLatex;
        var def = (0, definitions_utils_1.getDefinition)(this.command, this.mode);
        if (def === null || def === void 0 ? void 0 : def.serialize)
            return def.serialize(this, options);
        var result = [];
        result.push(this.command);
        if (this.explicitSubsupPlacement) {
            if (this.subsupPlacement === 'over-under')
                result.push('\\limits');
            if (this.subsupPlacement === 'adjacent')
                result.push('\\nolimits');
            if (this.subsupPlacement === 'auto')
                result.push('\\displaylimits');
        }
        result.push(this.supsubToLatex(options));
        return (0, tokenizer_1.joinLatex)(result);
    };
    return ExtensibleSymbolAtom;
}(atom_class_1.Atom));
exports.ExtensibleSymbolAtom = ExtensibleSymbolAtom;
