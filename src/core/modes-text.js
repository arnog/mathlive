"use strict";
/* eslint-disable no-new */
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
exports.TextMode = void 0;
var text_1 = require("../atoms/text");
var modes_utils_1 = require("./modes-utils");
var tokenizer_1 = require("./tokenizer");
function emitStringTextRun(run, options) {
    return run.map(function (x) { return x._serialize(options); });
}
function emitFontShapeTextRun(run, options) {
    return (0, modes_utils_1.getPropertyRuns)(run, 'fontShape').map(function (x) {
        var s = emitStringTextRun(x, options);
        var fontShape = x[0].style.fontShape;
        var command = '';
        if (fontShape === 'it')
            command = '\\textit';
        if (fontShape === 'sl')
            command = '\\textsl';
        if (fontShape === 'sc')
            command = '\\textsc';
        if (fontShape === 'n')
            command = '\\textup';
        if (!command && fontShape)
            return "{".concat((0, tokenizer_1.latexCommand)('\\fontshape', fontShape)).concat((0, tokenizer_1.joinLatex)(s), "}");
        return command ? (0, tokenizer_1.latexCommand)(command, (0, tokenizer_1.joinLatex)(s)) : (0, tokenizer_1.joinLatex)(s);
    });
}
function emitFontSeriesTextRun(run, options) {
    return (0, modes_utils_1.getPropertyRuns)(run, 'fontSeries').map(function (x) {
        var s = emitFontShapeTextRun(x, options);
        var fontSeries = x[0].style.fontSeries;
        var command = '';
        if (fontSeries === 'b')
            command = '\\textbf';
        if (fontSeries === 'l')
            command = '\\textlf';
        if (fontSeries === 'm')
            command = '\\textmd';
        if (fontSeries && !command)
            return "{".concat((0, tokenizer_1.latexCommand)('\\fontseries', fontSeries)).concat((0, tokenizer_1.joinLatex)(s), "}");
        return command ? (0, tokenizer_1.latexCommand)(command, (0, tokenizer_1.joinLatex)(s)) : (0, tokenizer_1.joinLatex)(s);
    });
}
function emitSizeTextRun(run, options) {
    return (0, modes_utils_1.getPropertyRuns)(run, 'fontSize').map(function (x) {
        var _a, _b;
        var s = emitFontSeriesTextRun(x, options);
        var command = (_b = [
            '',
            '\\tiny',
            '\\scriptsize',
            '\\footnotesize',
            '\\small',
            '\\normalsize',
            '\\large',
            '\\Large',
            '\\LARGE',
            '\\huge',
            '\\Huge',
        ][(_a = x[0].style.fontSize) !== null && _a !== void 0 ? _a : '']) !== null && _b !== void 0 ? _b : '';
        return command ? "".concat(command, " ").concat((0, tokenizer_1.joinLatex)(s)) : (0, tokenizer_1.joinLatex)(s);
    });
}
function emitFontFamilyTextRun(run, options, needsWrap) {
    return (0, modes_utils_1.getPropertyRuns)(run, 'fontFamily').map(function (x) {
        var _a;
        needsWrap =
            needsWrap &&
                !x.every(function (x) {
                    return x.style.fontFamily ||
                        x.style.fontShape ||
                        x.style.fontSeries ||
                        x.style.fontSize;
                });
        var s = emitSizeTextRun(x, options);
        var fontFamily = x[0].style.fontFamily;
        var command = (_a = {
            'roman': 'textrm',
            'monospace': 'texttt',
            'sans-serif': 'textsf'
        }[fontFamily !== null && fontFamily !== void 0 ? fontFamily : '']) !== null && _a !== void 0 ? _a : '';
        if (command)
            return "\\".concat(command, "{").concat((0, tokenizer_1.joinLatex)(s), "}");
        if (fontFamily)
            return "{\\fontfamily{".concat(x[0].style.fontFamily, "} ").concat((0, tokenizer_1.joinLatex)(s), "}");
        if (needsWrap)
            return "\\text{".concat((0, tokenizer_1.joinLatex)(s), "}");
        return (0, tokenizer_1.joinLatex)(s);
    });
}
var TEXT_FONT_CLASS = {
    'roman': '',
    'sans-serif': 'ML__sans',
    'monospace': 'ML__tt'
};
var TextMode = /** @class */ (function (_super) {
    __extends(TextMode, _super);
    function TextMode() {
        return _super.call(this, 'text') || this;
    }
    TextMode.prototype.createAtom = function (command, info, style) {
        if (!info)
            return null;
        if (info.definitionType === 'symbol') {
            return new text_1.TextAtom(command, String.fromCodePoint(info.codepoint), style !== null && style !== void 0 ? style : {});
        }
        return null;
    };
    TextMode.prototype.serialize = function (run, options) {
        return emitFontFamilyTextRun(run, __assign(__assign({}, options), { defaultMode: 'text' }), options.defaultMode !== 'text');
    };
    /**
     * Return the font-family name
     */
    TextMode.prototype.getFont = function (box, style) {
        var _a, _b, _c, _d, _e;
        var fontFamily = style.fontFamily;
        if (TEXT_FONT_CLASS[fontFamily])
            box.classes += ' ' + TEXT_FONT_CLASS[fontFamily];
        else if (fontFamily) {
            // Not a well-known family. Use a style.
            box.setStyle('font-family', fontFamily);
        }
        if (style.fontShape) {
            box.classes += ' ';
            box.classes +=
                (_a = {
                    it: 'ML__it',
                    sl: 'ML__shape_sl',
                    sc: 'ML__shape_sc',
                    ol: 'ML__shape_ol'
                }[style.fontShape]) !== null && _a !== void 0 ? _a : '';
        }
        if (style.fontSeries) {
            var m = style.fontSeries.match(/(.?[lbm])?(.?[cx])?/);
            if (m) {
                box.classes += ' ';
                box.classes +=
                    (_c = {
                        ul: 'ML__series_ul',
                        el: 'ML__series_el',
                        l: 'ML__series_l',
                        sl: 'ML__series_sl',
                        m: '',
                        sb: 'ML__series_sb',
                        b: 'ML__bold',
                        eb: 'ML__series_eb',
                        ub: 'ML__series_ub'
                    }[(_b = m[1]) !== null && _b !== void 0 ? _b : '']) !== null && _c !== void 0 ? _c : '';
                box.classes += ' ';
                box.classes +=
                    (_e = {
                        uc: 'ML__series_uc',
                        ec: 'ML__series_ec',
                        c: 'ML__series_c',
                        sc: 'ML__series_sc',
                        n: '',
                        sx: 'ML__series_sx',
                        x: 'ML__series_x',
                        ex: 'ML__series_ex',
                        ux: 'ML__series_ux'
                    }[(_d = m[2]) !== null && _d !== void 0 ? _d : '']) !== null && _e !== void 0 ? _e : '';
            }
        }
        // Always use the metrics of 'Main-Regular' in text mode
        return 'Main-Regular';
    };
    return TextMode;
}(modes_utils_1.Mode));
exports.TextMode = TextMode;
// Singleton class
new TextMode();
