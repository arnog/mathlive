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
exports.MathMode = exports.VARIANT_REPERTOIRE = void 0;
/* eslint-disable no-new */
var atom_1 = require("./atom");
var tokenizer_1 = require("./tokenizer");
var modes_utils_1 = require("./modes-utils");
var unicode_1 = require("./unicode");
var styling_1 = require("../editor-model/styling");
// Each entry indicate the font-name (to be used to calculate font metrics)
// and the CSS classes (for proper markup styling) for each possible
// variant combinations.
var VARIANTS = {
    // Handle some special characters which are only available in "main" font (not "math")
    'main': ['Main-Regular', 'ML__cmr'],
    'main-italic': ['Main-Italic', 'ML__cmr ML__it'],
    'main-bold': ['Main-Bold', 'ML__cmr ML__bold'],
    'main-bolditalic': ['Main-BoldItalic', 'ML__cmr ML__bold ML__it'],
    'normal': ['Main-Regular', 'ML__cmr'],
    'normal-bold': ['Main-Bold', 'ML__mathbf'],
    'normal-italic': ['Math-Italic', 'ML__mathit'],
    'normal-bolditalic': ['Math-BoldItalic', 'ML__mathbfit'],
    // Extended math symbols, arrows, etc.. at their standard Unicode codepoints
    'ams': ['AMS-Regular', 'ML__ams'],
    'ams-bold': ['AMS-Regular', 'ML__ams ML__bold'],
    'ams-italic': ['AMS-Regular', 'ML__ams ML__it'],
    'ams-bolditalic': ['AMS-Regular', 'ML__ams ML__bold ML__it'],
    'sans-serif': ['SansSerif-Regular', 'ML__sans'],
    'sans-serif-bold': ['SansSerif-Regular', 'ML__sans ML__bold'],
    'sans-serif-italic': ['SansSerif-Regular', 'ML__sans ML__it'],
    'sans-serif-bolditalic': ['SansSerif-Regular', 'ML__sans ML__bold ML__it'],
    'calligraphic': ['Caligraphic-Regular', 'ML__cal'],
    'calligraphic-bold': ['Caligraphic-Regular', 'ML__cal ML__bold'],
    'calligraphic-italic': ['Caligraphic-Regular', 'ML__cal ML__it'],
    'calligraphic-bolditalic': ['Caligraphic-Regular', 'ML__cal ML__bold ML__it'],
    'script': ['Script-Regular', 'ML__script'],
    'script-bold': ['Script-Regular', 'ML__script ML__bold'],
    'script-italic': ['Script-Regular', 'ML__script ML__it'],
    'script-bolditalic': ['Script-Regular', 'ML__script ML__bold ML__it'],
    'fraktur': ['Fraktur-Regular', 'ML__frak'],
    'fraktur-bold': ['Fraktur-Regular', 'ML__frak ML__bold'],
    'fraktur-italic': ['Fraktur-Regular', 'ML__frak ML__it'],
    'fraktur-bolditalic': ['Fraktur-Regular', 'ML__frak ML__bold ML__it'],
    'monospace': ['Typewriter-Regular', 'ML__tt'],
    'monospace-bold': ['Typewriter-Regular', 'ML__tt ML__bold'],
    'monospace-italic': ['Typewriter-Regular', 'ML__tt ML__it'],
    'monospace-bolditalic': ['Typewriter-Regular', 'ML__tt ML__bold ML__it'],
    // Blackboard characters are 'A-Z' in the AMS font
    'double-struck': ['AMS-Regular', 'ML__bb'],
    'double-struck-bold': ['AMS-Regular', 'ML__bb ML__bold'],
    'double-struck-italic': ['AMS-Regular', 'ML__bb ML_italic'],
    'double-struck-bolditalic': ['AMS-Regular', 'ML__bb ML_bolditalic']
};
exports.VARIANT_REPERTOIRE = {
    'double-struck': /^[A-Z ]$/,
    'script': /^[A-Z ]$/,
    'calligraphic': /^[\dA-Z ]$/,
    'fraktur': /^[\dA-Za-z ]$|^[!"#$%&'()*+,\-./:;=?[]^’‘]$/,
    'monospace': /^[\dA-Za-z ]$|^[!"&'()*+,\-./:;=?@[\]^_~\u0131\u0237\u0393\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A5\u03A8\u03A9]$/,
    'sans-serif': /^[\dA-Za-z ]$|^[!"&'()*+,\-./:;=?@[\]^_~\u0131\u0237\u0393\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A5\u03A8\u03A9]$/
};
var GREEK_LOWERCASE = /^[\u03B1-\u03C9]|\u03D1|\u03D5|\u03D6|\u03F1|\u03F5]$/;
var GREEK_UPPERCASE = /^[\u0393|\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A5\u03A6\u03A8\u03A9]$/;
var LETTER_SHAPE_RANGES = [
    /^[a-z]$/,
    /^[A-Z]$/,
    GREEK_LOWERCASE,
    GREEK_UPPERCASE,
];
// The letterShapeStyle property indicates which characters should be
// automatically italicized (see LETTER_SHAPE_RANGES)
var LETTER_SHAPE_MODIFIER = {
    iso: ['it', 'it', 'it', 'it'],
    tex: ['it', 'it', 'it', 'up'],
    french: ['it', 'up', 'up', 'up'],
    upright: ['up', 'up', 'up', 'up']
};
// See http://ctan.math.illinois.edu/macros/latex/base/fntguide.pdf
var MathMode = /** @class */ (function (_super) {
    __extends(MathMode, _super);
    function MathMode() {
        return _super.call(this, 'math') || this;
    }
    MathMode.prototype.createAtom = function (command, info, style) {
        var _a, _b, _c, _d, _e, _f;
        if (info === null) {
            return new atom_1.Atom({
                type: 'mord',
                mode: 'math',
                command: command,
                value: command,
                style: style
            });
        }
        var isFunction;
        try {
            isFunction =
                (_c = (_a = globalThis.MathfieldElement) === null || _a === void 0 ? void 0 : _a.isFunction((_b = info.command) !== null && _b !== void 0 ? _b : command)) !== null && _c !== void 0 ? _c : false;
        }
        catch (e) {
            isFunction = false;
        }
        if (info.definitionType === 'symbol') {
            var result_1 = new atom_1.Atom({
                type: (_d = info.type) !== null && _d !== void 0 ? _d : 'mord',
                mode: 'math',
                command: (_e = info.command) !== null && _e !== void 0 ? _e : command,
                value: String.fromCodePoint(info.codepoint),
                isFunction: isFunction,
                style: style
            });
            if (command.startsWith('\\'))
                result_1.verbatimLatex = command;
            return result_1;
        }
        var result = new atom_1.Atom({
            type: 'mord',
            mode: 'math',
            command: (_f = info.command) !== null && _f !== void 0 ? _f : command,
            value: command,
            isFunction: isFunction,
            style: style
        });
        if (command.startsWith('\\'))
            result.verbatimLatex = command;
        return result;
    };
    MathMode.prototype.serialize = function (run, options) {
        var result = emitBoldRun(run, __assign(__assign({}, options), { defaultMode: 'math' }));
        if (result.length === 0 || options.defaultMode !== 'text')
            return result;
        return __spreadArray(__spreadArray(['$ '], result, true), [' $'], false);
    };
    MathMode.prototype.getFont = function (box, style) {
        var _a, _b;
        console.assert(style.variant !== undefined);
        if (style.fontFamily) {
            var _c = VARIANTS[style.fontFamily], fontName_1 = _c[0], classes_1 = _c[1];
            if (classes_1)
                box.classes += ' ' + classes_1;
            return fontName_1;
        }
        var variant = style.variant;
        var variantStyle = style.variantStyle;
        // 1. Remap to "main" font some characters that don't exist
        // in the "math" font
        // There are two fonts that include the roman italic characters, "main-it" and "math"
        // They are similar, but the "math" font has some different kernings ('f')
        // and some slightly different character shape. It doesn't include a few
        // characters, so for those characters, "main" has to be used instead
        // \imath, \jmath and \pound don't exist in "math" font,
        // so use "main" italic instead.
        if (variant === 'normal' &&
            !variantStyle &&
            /[\u00A3\u0131\u0237]/.test(box.value)) {
            variant = 'main';
            variantStyle = 'italic';
        }
        // 2. Auto-italicize some symbols, depending on the letterShapeStyle
        if (variant === 'normal' && !variantStyle && box.value.length === 1) {
            var italicize_1 = false;
            LETTER_SHAPE_RANGES.forEach(function (x, i) {
                var _a;
                if (x.test(box.value) &&
                    LETTER_SHAPE_MODIFIER[(_a = style.letterShapeStyle) !== null && _a !== void 0 ? _a : 'tex'][i] === 'it')
                    italicize_1 = true;
            });
            if (italicize_1)
                variantStyle = (0, styling_1.addItalic)(variantStyle);
        }
        // 3. Map the variant + variantStyle to a font
        if (variantStyle === 'up')
            variantStyle = undefined;
        var styledVariant = variantStyle ? variant + '-' + variantStyle : variant;
        console.assert(VARIANTS[styledVariant] !== undefined);
        var _d = VARIANTS[styledVariant], fontName = _d[0], classes = _d[1];
        // 4. If outside the font repertoire, switch to system font
        // (return NULL to use default metrics)
        if (exports.VARIANT_REPERTOIRE[variant] &&
            !exports.VARIANT_REPERTOIRE[variant].test(box.value)) {
            // Map to unicode character
            var v = (0, unicode_1.mathVariantToUnicode)(box.value, variant, variantStyle);
            if (!v) {
                // If we don't have an exact match, e.g. "bold blackboard d",
                // try to find a match for the base character and add a class style
                v = (_a = (0, unicode_1.mathVariantToUnicode)(box.value, variant)) !== null && _a !== void 0 ? _a : box.value;
                box.classes +=
                    (_b = {
                        'bold': ' ML__bold',
                        'italic': ' ML__it',
                        'bold-italic': ' ML__bold ML__it'
                    }[variantStyle !== null && variantStyle !== void 0 ? variantStyle : '']) !== null && _b !== void 0 ? _b : '';
            }
            box.value = v;
            // Return NULL to use default metrics
            return null;
        }
        // Lowercase greek letters have an incomplete repertoire (no bold)
        // so, for \mathbf to behave correctly, add a 'lcGreek' class.
        if (GREEK_LOWERCASE.test(box.value))
            box.classes += ' lcGreek';
        // 5. Assign classes based on the font
        if (classes)
            box.classes += ' ' + classes;
        return fontName;
    };
    return MathMode;
}(modes_utils_1.Mode));
exports.MathMode = MathMode;
function emitBoldRun(run, options) {
    return (0, modes_utils_1.getPropertyRuns)(run, 'bold').map(function (x) {
        var weight = (0, modes_utils_1.weightString)(x[0]);
        if (weight !== 'bold')
            return (0, tokenizer_1.joinLatex)(emitVariantRun(x, options));
        // If the parent is already bold, don't emit the bold command
        if ((0, modes_utils_1.weightString)(x[0].parent) === 'bold')
            return (0, tokenizer_1.joinLatex)(emitVariantRun(x, options));
        // Use '\mathbf' if possible, otherwise `\bm`. Note that `\bm` is
        // not as well supported as `\mathbf` but it can handle more cases
        // (i.e. greek letters, operators, variants, etc...)
        // Get the content of the run
        var value = (0, tokenizer_1.joinLatex)(x.map(function (x) { var _a; return (_a = x.value) !== null && _a !== void 0 ? _a : ''; }));
        if (/^[a-zA-Z0-9]+$/.test(value)) {
            return (0, tokenizer_1.latexCommand)('\\mathbf', (0, tokenizer_1.joinLatex)(emitVariantRun(x, options)));
        }
        // If the run contains a mix of characters, use `\bm`
        return (0, tokenizer_1.latexCommand)('\\bm', (0, tokenizer_1.joinLatex)(emitVariantRun(x, options)));
    });
}
function emitVariantRun(run, options) {
    var parent = run[0].parent;
    var contextVariant = (0, modes_utils_1.variantString)(parent);
    return (0, modes_utils_1.getPropertyRuns)(run, 'variant').map(function (x) {
        var variant = (0, modes_utils_1.variantString)(x[0]);
        var command = '';
        if (variant && variant !== contextVariant) {
            // Note that bold is handled separately, so we ignore it here.
            command = {
                'calligraphic': '\\mathcal',
                'calligraphic-uo': '\\mathcal',
                'fraktur': '\\mathfrak',
                'fraktur-uo': '\\mathfrak',
                'double-struck': '\\mathbb',
                'double-struck-uo': '\\mathbb',
                'script': '\\mathscr',
                'script-uo': '\\mathscr',
                'monospace': '\\mathtt',
                'monospace-uo': '\\mathtt',
                'sans-serif': '\\mathsf',
                'sans-serif-uo': '\\mathsf',
                'normal': '',
                'normal-up': '\\mathrm',
                'normal-italic': '\\mathnormal',
                'normal-bold': '',
                'normal-bolditalic': '\\mathbfit',
                'ams': '',
                'ams-up': '\\mathrm',
                'ams-italic': '\\mathit',
                'ams-bold': '',
                'ams-bolditalic': '\\mathbfit',
                'main': '',
                'main-up': '\\mathrm',
                'main-italic': '\\mathit',
                'main-bold': '',
                'main-bolditalic': '\\mathbfit'
            }[variant];
            console.assert(command !== undefined);
        }
        var arg = (0, tokenizer_1.joinLatex)(x.map(function (x) { return x._serialize(options); }));
        return !command ? arg : (0, tokenizer_1.latexCommand)(command, arg);
    });
}
// Singleton class
new MathMode();
