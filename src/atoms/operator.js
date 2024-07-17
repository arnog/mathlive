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
exports.OperatorAtom = void 0;
var atom_class_1 = require("../core/atom-class");
var box_1 = require("../core/box");
var tokenizer_1 = require("../core/tokenizer");
var definitions_utils_1 = require("../latex-commands/definitions-utils");
/**
 * Operators are handled in the TeXbook pg. 443-444, rule 13(a).
 *
 * An operator is not necessarily of type 'mop'. It is rendered as text
 * in a fixed font. For example, `\sin` is an operator.
 * On the other hand `\int` is an ExtensibleSymbolAtom.
 *
 */
var OperatorAtom = /** @class */ (function (_super) {
    __extends(OperatorAtom, _super);
    function OperatorAtom(symbol, options) {
        var _this = _super.call(this, __assign(__assign({}, options), { type: 'operator', isFunction: options === null || options === void 0 ? void 0 : options.isFunction })) || this;
        _this.value = symbol;
        _this.variant = options === null || options === void 0 ? void 0 : options.variant;
        _this.variantStyle = options === null || options === void 0 ? void 0 : options.variantStyle;
        _this.subsupPlacement = options === null || options === void 0 ? void 0 : options.limits;
        return _this;
    }
    OperatorAtom.fromJson = function (json) {
        return new OperatorAtom(json.symbol, json);
    };
    OperatorAtom.prototype.toJson = function () {
        var result = _super.prototype.toJson.call(this);
        if (this.variant)
            result.variant = this.variant;
        if (this.variantStyle)
            result.variantStyle = this.variantStyle;
        if (this.subsupPlacement)
            result.limits = this.subsupPlacement;
        if (this.value)
            result.symbol = this.value;
        return result;
    };
    OperatorAtom.prototype.render = function (context) {
        // Build the text from the operator's name.
        var _a;
        // Not all styles are applied, since the operators have a distinct
        // appearance (for example, can't override their font family)
        var base = new box_1.Box(this.value, {
            type: 'op',
            mode: 'math',
            maxFontSize: context.scalingFactor,
            style: {
                variant: this.variant,
                variantStyle: this.variantStyle
            },
            isSelected: this.isSelected,
            letterShapeStyle: context.letterShapeStyle
        });
        var result = base;
        if (this.superscript || this.subscript) {
            var limits = (_a = this.subsupPlacement) !== null && _a !== void 0 ? _a : 'auto';
            result =
                limits === 'over-under' || (limits === 'auto' && context.isDisplayStyle)
                    ? this.attachLimits(context, { base: base })
                    : this.attachSupsub(context, { base: base });
        }
        // Bind the generated box with its limits so they can all be selected as one
        return new box_1.Box(this.bind(context, result), {
            type: 'op',
            caret: this.caret,
            isSelected: this.isSelected,
            classes: 'ML__op-group'
        }).wrap(context);
    };
    OperatorAtom.prototype._serialize = function (options) {
        if (!(options.expandMacro ||
            options.skipStyles ||
            options.skipPlaceholders) &&
            typeof this.verbatimLatex === 'string')
            return this.verbatimLatex;
        var def = (0, definitions_utils_1.getDefinition)(this.command, this.mode);
        if (def === null || def === void 0 ? void 0 : def.serialize)
            return def.serialize(this, options);
        var result = [this.command];
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
    return OperatorAtom;
}(atom_class_1.Atom));
exports.OperatorAtom = OperatorAtom;
