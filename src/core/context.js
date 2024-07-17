"use strict";
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
exports.Context = void 0;
var font_metrics_1 = require("./font-metrics");
var mathstyle_1 = require("./mathstyle");
var registers_utils_1 = require("./registers-utils");
var context_utils_1 = require("./context-utils");
/**
 * The `Context` represents the rendering context of the current rendering
 * subtree.
 *
 * It keeps a reference to the parent context which is necessary to calculate
 * the proper scaling/fontsize since all sizes are specified in em and the
 * absolute value of an em depends of the fontsize of the parent context.
 *
 * A new subtree is entered for example by:
 * - an explicit group enclosed in braces `{...}`
 * - a semi-simple group enclosed in `\bgroup...\endgroup`
 * - the cells of a tabular environment
 * - the numerator or denominator of a fraction
 * - the root and radix of a fraction
 *
 * When a new subtree is entered, a new Context is created, linked to the
 * parent context.
 *
 * When the subtree is exited, a 'wrapper' box is created to adjust the
 * fontsize on entry, and adjust the height/depth of the box to account for
 * the new fontsize (if applicable).
 *
 * The effective font size is determined by:
 * - the 'size' property, which represent a size set by a sizing command
 * (e.g. `\Huge`, `\tiny`, etc...)
 * - a size delta from the mathstyle (-1 for scriptstyle for example)
 */
var Context = /** @class */ (function () {
    function Context(options, style) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        var template;
        if (options === null || options === void 0 ? void 0 : options.parent) {
            this.parent = options.parent;
            template = options.parent;
            this.registers = {};
        }
        else {
            template = __assign(__assign({}, (0, context_utils_1.getDefaultContext)()), ((_a = options === null || options === void 0 ? void 0 : options.from) !== null && _a !== void 0 ? _a : {}));
            this.registers = template.registers;
        }
        if (template.atomIdsSettings)
            this.atomIdsSettings = __assign({}, template.atomIdsSettings);
        this.renderPlaceholder = template.renderPlaceholder;
        this.isPhantom = (_d = (_b = options === null || options === void 0 ? void 0 : options.isPhantom) !== null && _b !== void 0 ? _b : (_c = this.parent) === null || _c === void 0 ? void 0 : _c.isPhantom) !== null && _d !== void 0 ? _d : false;
        this.letterShapeStyle = template.letterShapeStyle;
        this.minFontScale = template.minFontScale;
        this.maxMatrixCols = template.maxMatrixCols;
        if ((style === null || style === void 0 ? void 0 : style.color) && style.color !== 'none')
            this.color = style.color;
        else
            this.color = (_f = (_e = this.parent) === null || _e === void 0 ? void 0 : _e.color) !== null && _f !== void 0 ? _f : '';
        if ((style === null || style === void 0 ? void 0 : style.backgroundColor) && style.backgroundColor !== 'none')
            this.backgroundColor = style.backgroundColor;
        else
            this.backgroundColor = (_h = (_g = this.parent) === null || _g === void 0 ? void 0 : _g.backgroundColor) !== null && _h !== void 0 ? _h : '';
        if ((style === null || style === void 0 ? void 0 : style.fontSize) &&
            style.fontSize !== 'auto' &&
            style.fontSize !== ((_j = this.parent) === null || _j === void 0 ? void 0 : _j.size))
            this.size = style.fontSize;
        else
            this.size = (_l = (_k = this.parent) === null || _k === void 0 ? void 0 : _k.size) !== null && _l !== void 0 ? _l : font_metrics_1.DEFAULT_FONT_SIZE;
        var mathstyle = (_o = (_m = this.parent) === null || _m === void 0 ? void 0 : _m.mathstyle) !== null && _o !== void 0 ? _o : mathstyle_1.MATHSTYLES.displaystyle;
        if (typeof (options === null || options === void 0 ? void 0 : options.mathstyle) === 'string') {
            if (template instanceof Context) {
                switch (options.mathstyle) {
                    case 'cramp':
                        mathstyle = mathstyle.cramp;
                        break;
                    case 'superscript':
                        mathstyle = mathstyle.sup;
                        break;
                    case 'subscript':
                        mathstyle = mathstyle.sub;
                        break;
                    case 'numerator':
                        mathstyle = mathstyle.fracNum;
                        break;
                    case 'denominator':
                        mathstyle = mathstyle.fracDen;
                        break;
                }
            }
            switch (options.mathstyle) {
                case 'textstyle':
                    mathstyle = mathstyle_1.MATHSTYLES.textstyle;
                    break;
                case 'displaystyle':
                    mathstyle = mathstyle_1.MATHSTYLES.displaystyle;
                    break;
                case 'scriptstyle':
                    mathstyle = mathstyle_1.MATHSTYLES.scriptstyle;
                    break;
                case 'scriptscriptstyle':
                    mathstyle = mathstyle_1.MATHSTYLES.scriptscriptstyle;
                    break;
                case '':
                case 'auto':
                    break;
            }
        }
        this.mathstyle = mathstyle;
        this.smartFence = template.smartFence;
        this.placeholderSymbol = template.placeholderSymbol;
        this.colorMap = (_p = template.colorMap) !== null && _p !== void 0 ? _p : (function (x) { return x; });
        this.backgroundColorMap = (_q = template.backgroundColorMap) !== null && _q !== void 0 ? _q : (function (x) { return x; });
        this.getMacro = template.getMacro;
        console.assert(this.parent !== undefined || this.registers !== undefined);
    }
    Context.prototype.makeID = function () {
        if (!this.atomIdsSettings)
            return undefined;
        if (this.atomIdsSettings.overrideID)
            return this.atomIdsSettings.overrideID;
        if (typeof this.atomIdsSettings.seed !== 'number') {
            return "".concat(Date.now().toString(36).slice(-2)).concat(Math.floor(Math.random() * 0x186a0).toString(36));
        }
        var result = this.atomIdsSettings.seed.toString(36);
        this.atomIdsSettings.seed += 1;
        return result;
    };
    // Scale a value, in em, to account for the fontsize and mathstyle
    // of this context
    Context.prototype.scale = function (value) {
        return value * this.effectiveFontSize;
    };
    Object.defineProperty(Context.prototype, "scalingFactor", {
        get: function () {
            if (!this.parent)
                return 1.0;
            return this.effectiveFontSize / this.parent.effectiveFontSize;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "isDisplayStyle", {
        get: function () {
            return this.mathstyle.id === mathstyle_1.D || this.mathstyle.id === mathstyle_1.Dc;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "isCramped", {
        get: function () {
            return this.mathstyle.cramped;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "isTight", {
        get: function () {
            return this.mathstyle.isTight;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "metrics", {
        get: function () {
            return this.mathstyle.metrics;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Context.prototype, "effectiveFontSize", {
        // Return the font size, in em relative to the mathfield fontsize,
        // accounting both for the base font size and the mathstyle
        get: function () {
            return Math.max(font_metrics_1.FONT_SCALE[Math.max(1, this.size + this.mathstyle.sizeDelta)], this.minFontScale);
        },
        enumerable: false,
        configurable: true
    });
    Context.prototype.getRegister = function (name) {
        var _a;
        if ((_a = this.registers) === null || _a === void 0 ? void 0 : _a[name])
            return this.registers[name];
        if (this.parent)
            return this.parent.getRegister(name);
        return undefined;
    };
    Context.prototype.getRegisterAsNumber = function (name) {
        var val = this.getRegister(name);
        if (typeof val === 'number')
            return val;
        if (typeof val === 'string')
            return Number(val);
        return undefined;
    };
    Context.prototype.getRegisterAsGlue = function (name) {
        var _a;
        if ((_a = this.registers) === null || _a === void 0 ? void 0 : _a[name]) {
            var value = this.registers[name];
            if (typeof value === 'object' && 'glue' in value)
                return value;
            else if (typeof value === 'object' && 'dimension' in value)
                return { glue: { dimension: value.dimension } };
            else if (typeof value === 'number')
                return { glue: { dimension: value } };
            return undefined;
        }
        if (this.parent)
            return this.parent.getRegisterAsGlue(name);
        return undefined;
    };
    Context.prototype.getRegisterAsEm = function (name, precision) {
        return (0, registers_utils_1.convertDimensionToEm)(this.getRegisterAsDimension(name), precision);
    };
    Context.prototype.getRegisterAsDimension = function (name) {
        var _a;
        if ((_a = this.registers) === null || _a === void 0 ? void 0 : _a[name]) {
            var value = this.registers[name];
            if (typeof value === 'object' && 'glue' in value)
                return value.glue;
            else if (typeof value === 'object' && 'dimension' in value)
                return value;
            else if (typeof value === 'number')
                return { dimension: value };
            return undefined;
        }
        if (this.parent)
            return this.parent.getRegisterAsDimension(name);
        return undefined;
    };
    Context.prototype.setRegister = function (name, value) {
        if (value === undefined) {
            delete this.registers[name];
            return;
        }
        this.registers[name] = value;
    };
    Context.prototype.evaluate = function (value) {
        if (!value || !('register' in value))
            return value;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        var context = this;
        if ('global' in value && value.global)
            while (context.parent)
                context = context.parent;
        var factor = 1;
        if ('factor' in value && value.factor !== 1 && value.factor !== undefined)
            factor = value.factor;
        var val = context.getRegister(value.register);
        if (val === undefined)
            return undefined;
        if (typeof val === 'string')
            return { string: Number(val).toString() + val };
        if (typeof val === 'number')
            return { number: factor * val };
        var result = context.evaluate(val);
        if (result === undefined)
            return undefined;
        if ('string' in result)
            return { string: Number(val).toString() + result.string };
        if ('number' in result)
            return { number: factor * result.number };
        if ('dimension' in result)
            return __assign(__assign({}, result), { dimension: factor * result.dimension });
        if ('glue' in result) {
            return __assign(__assign({}, result), { glue: __assign(__assign({}, result.glue), { dimension: factor * result.glue.dimension }), shrink: result.shrink
                    ? __assign(__assign({}, result.shrink), { dimension: factor * result.shrink.dimension }) : undefined, grow: result.grow
                    ? __assign(__assign({}, result.grow), { dimension: factor * result.grow.dimension }) : undefined });
        }
        return value;
    };
    Context.prototype.toDimension = function (value) {
        var val = this.evaluate(value);
        if (val === undefined)
            return null;
        if ('dimension' in val)
            return val;
        if ('glue' in val)
            return val.glue;
        if ('number' in val)
            return { dimension: val.number };
        return null;
    };
    Context.prototype.toEm = function (value, precision) {
        if (value === null)
            return 0;
        var dimen = this.toDimension(value);
        if (dimen === null)
            return 0;
        return (0, registers_utils_1.convertDimensionToPt)(dimen, precision) / font_metrics_1.PT_PER_EM;
    };
    Context.prototype.toNumber = function (value) {
        if (value === null)
            return null;
        var val = this.evaluate(value);
        if (val === undefined)
            return null;
        if ('number' in val)
            return val.number;
        if ('dimension' in val)
            return val.dimension;
        if ('glue' in val)
            return val.glue.dimension;
        if ('string' in val)
            return Number(val.string);
        return null;
    };
    Context.prototype.toColor = function (value) {
        var _a, _b;
        if (value === null)
            return null;
        var val = this.evaluate(value);
        if (val === undefined)
            return null;
        if ('string' in val)
            return (_b = (_a = this.colorMap) === null || _a === void 0 ? void 0 : _a.call(this, val.string)) !== null && _b !== void 0 ? _b : val.string;
        return null;
    };
    Context.prototype.toBackgroundColor = function (value) {
        var _a, _b;
        if (value === null)
            return null;
        var val = this.evaluate(value);
        if (val === undefined)
            return null;
        if ('string' in val)
            return (_b = (_a = this.backgroundColorMap) === null || _a === void 0 ? void 0 : _a.call(this, val.string)) !== null && _b !== void 0 ? _b : val.string;
        return null;
    };
    return Context;
}());
exports.Context = Context;
