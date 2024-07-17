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
exports.multiplyLatexValue = exports.serializeLatexValue = exports.serializeGlueOrDimention = exports.serializeGlue = exports.serializeDimension = exports.convertDimensionToPixel = exports.convertGlueOrDimensionToEm = exports.convertGlueToEm = exports.convertDimensionToEm = exports.convertDimensionToPt = void 0;
var font_metrics_1 = require("./font-metrics");
function convertDimensionToPt(value, precision) {
    var _a;
    if (!value)
        return 0;
    // If the units are missing, TeX assumes 'pt'
    var f = {
        pt: 1,
        mm: 7227 / 2540,
        cm: 7227 / 254,
        ex: 35271 / 8192,
        px: 3 / 4,
        em: font_metrics_1.PT_PER_EM,
        bp: 803 / 800,
        dd: 1238 / 1157,
        pc: 12,
        "in": 72.27,
        mu: 10 / 18
    }[(_a = value.unit) !== null && _a !== void 0 ? _a : 'pt'];
    if (Number.isFinite(precision)) {
        var factor = Math.pow(10, precision);
        return Math.round((value.dimension / font_metrics_1.PT_PER_EM) * f * factor) / factor;
    }
    return value.dimension * f;
}
exports.convertDimensionToPt = convertDimensionToPt;
function convertDimensionToEm(value, precision) {
    if (value === null)
        return 0;
    var result = convertDimensionToPt(value) / font_metrics_1.PT_PER_EM;
    if (Number.isFinite(precision)) {
        var factor = Math.pow(10, precision);
        return Math.round(result * factor) / factor;
    }
    return result;
}
exports.convertDimensionToEm = convertDimensionToEm;
function convertGlueToEm(value) {
    return convertDimensionToEm(value.glue);
}
exports.convertGlueToEm = convertGlueToEm;
function convertGlueOrDimensionToEm(value) {
    if ('glue' in value)
        return convertDimensionToEm(value.glue);
    return convertDimensionToEm(value);
}
exports.convertGlueOrDimensionToEm = convertGlueOrDimensionToEm;
function convertDimensionToPixel(value) {
    return convertDimensionToEm(value) * (4 / 3) * font_metrics_1.PT_PER_EM;
}
exports.convertDimensionToPixel = convertDimensionToPixel;
function serializeDimension(value) {
    var _a;
    return "".concat(value.dimension).concat((_a = value.unit) !== null && _a !== void 0 ? _a : 'pt');
}
exports.serializeDimension = serializeDimension;
function serializeGlue(value) {
    var result = serializeDimension(value.glue);
    if (value.grow && value.grow.dimension !== 0)
        result += " plus ".concat(serializeDimension(value.grow));
    if (value.shrink && value.shrink.dimension !== 0)
        result += " minus ".concat(serializeDimension(value.shrink));
    return result;
}
exports.serializeGlue = serializeGlue;
function serializeGlueOrDimention(value) {
    if ('glue' in value)
        return serializeGlue(value);
    return serializeDimension(value);
}
exports.serializeGlueOrDimention = serializeGlueOrDimention;
function serializeLatexValue(value) {
    var _a, _b;
    if (value === null || value === undefined)
        return null;
    var result = '';
    if ('dimension' in value)
        result = "".concat(value.dimension).concat((_a = value.unit) !== null && _a !== void 0 ? _a : 'pt');
    if ('glue' in value)
        result = serializeGlue(value);
    if ('number' in value) {
        if (!('base' in value) || value.base === 'decimal')
            result = Number(value.number).toString();
        else if (value.base === 'alpha')
            result = "`".concat(String.fromCodePoint(value.number));
        else {
            var i = Math.round(value.number) >>> 0;
            if (value.base === 'hexadecimal') {
                result = Number(i).toString(16).toUpperCase();
                if (i <= 0xff)
                    result = result.padStart(2, '0');
                else if (i <= 0xffff)
                    result = result.padStart(4, '0');
                else if (i <= 0xffffff)
                    result = result.padStart(6, '0');
                else
                    result = result.padStart(8, '0');
                result = "\"".concat(result);
            }
            else if (value.base === 'octal') {
                result = Number(i).toString(8);
                if (i <= 63)
                    result = result.padStart(2, '0');
                else if (i <= 0x7777)
                    result = result.padStart(4, '0');
                else
                    result = result.padStart(8, '0');
                result = "'".concat(result);
            }
        }
    }
    if ('register' in value) {
        if ('factor' in value) {
            if (value.factor === -1)
                result = '-';
            else if (value.factor !== 1)
                result = Number(value.factor).toString();
        }
        if ('global' in value && value.global)
            result += '\\global';
        result += "\\".concat(value.register);
    }
    if ('string' in value)
        result = value.string;
    if ((_b = value.relax) !== null && _b !== void 0 ? _b : false)
        result += '\\relax';
    return result;
}
exports.serializeLatexValue = serializeLatexValue;
function multiplyLatexValue(value, factor) {
    if (value === null || value === undefined)
        return null;
    if ('number' in value)
        return __assign(__assign({}, value), { number: value.number * factor });
    if ('register' in value) {
        if ('factor' in value && value.factor)
            return __assign(__assign({}, value), { factor: value.factor * factor });
        return __assign(__assign({}, value), { factor: factor });
    }
    if ('dimension' in value)
        return __assign(__assign({}, value), { dimension: value.dimension * factor });
    if ('glue' in value) {
        if (value.shrink && value.grow) {
            return {
                glue: multiplyLatexValue(value.glue, factor),
                shrink: multiplyLatexValue(value.shrink, factor),
                grow: multiplyLatexValue(value.grow, factor)
            };
        }
        if (value.shrink) {
            return {
                glue: multiplyLatexValue(value.glue, factor),
                shrink: multiplyLatexValue(value.shrink, factor)
            };
        }
        if (value.grow) {
            return {
                glue: multiplyLatexValue(value.glue, factor),
                grow: multiplyLatexValue(value.grow, factor)
            };
        }
        return {
            glue: multiplyLatexValue(value.glue, factor)
        };
    }
    return null;
}
exports.multiplyLatexValue = multiplyLatexValue;
