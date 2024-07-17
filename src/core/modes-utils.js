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
exports.getPropertyRuns = exports.variantString = exports.weightString = exports.getModeRuns = exports.Mode = void 0;
var definitions_utils_1 = require("../latex-commands/definitions-utils");
var tokenizer_1 = require("./tokenizer");
var Mode = /** @class */ (function () {
    function Mode(name) {
        Mode._registry[name] = this;
    }
    Mode.createAtom = function (mode, command, style) {
        return Mode._registry[mode].createAtom(command, (0, definitions_utils_1.getDefinition)(command, mode), style);
    };
    Mode.serialize = function (atoms, options) {
        var _a;
        if (!atoms || atoms.length === 0)
            return '';
        if ((_a = options.skipStyles) !== null && _a !== void 0 ? _a : false) {
            var body = [];
            for (var _i = 0, _b = getModeRuns(atoms); _i < _b.length; _i++) {
                var run = _b[_i];
                var mode = Mode._registry[run[0].mode];
                body.push.apply(body, mode.serialize(run, options));
            }
            return (0, tokenizer_1.joinLatex)(body);
        }
        return (0, tokenizer_1.joinLatex)(emitFontSizeRun(atoms, options));
    };
    Mode.getFont = function (mode, box, style) {
        return Mode._registry[mode].getFont(box, style);
    };
    Mode._registry = {};
    return Mode;
}());
exports.Mode = Mode;
/*
 * Return an array of runs with the same mode
 */
function getModeRuns(atoms) {
    var result = [];
    var run = [];
    var currentMode = 'NONE';
    for (var _i = 0, atoms_1 = atoms; _i < atoms_1.length; _i++) {
        var atom = atoms_1[_i];
        if (atom.type !== 'first') {
            if (atom.mode !== currentMode) {
                if (run.length > 0)
                    result.push(run);
                run = [atom];
                currentMode = atom.mode;
            }
            else
                run.push(atom);
        }
    }
    // Push whatever is left
    if (run.length > 0)
        result.push(run);
    return result;
}
exports.getModeRuns = getModeRuns;
/** This "weight" is only for math mode. Text mode uses fontSeries. */
function weightString(atom) {
    if (!atom || atom.mode !== 'math')
        return '';
    var style = atom.style;
    if (!style)
        return '';
    if (!style.variantStyle)
        return '';
    if (style.variantStyle === 'bold' || style.variantStyle === 'bolditalic')
        return 'bold';
    return '';
}
exports.weightString = weightString;
/** Combine variant and variantStyle in one string */
function variantString(atom) {
    if (!atom)
        return '';
    var style = atom.style;
    if (!style)
        return '';
    var result = style.variant;
    if (result === undefined)
        return 'normal';
    if (![
        'calligraphic',
        'fraktur',
        'double-struck',
        'script',
        'monospace',
        'sans-serif',
    ].includes(result) &&
        style.variantStyle)
        result += '-' + style.variantStyle;
    return result;
}
exports.variantString = variantString;
/*
 * Return an array of runs (array of atoms with the same value
 *   for the specified property)
 */
function getPropertyRuns(atoms, property) {
    var result = [];
    var run = [];
    var currentValue = undefined;
    for (var _i = 0, atoms_2 = atoms; _i < atoms_2.length; _i++) {
        var atom = atoms_2[_i];
        if (atom.type === 'first')
            continue;
        // The 'variant' property combines the variant and variantStyle
        var value = void 0;
        if (property === 'variant')
            value = variantString(atom);
        else if (property === 'bold')
            value = weightString(atom);
        else
            value = atom.style[property];
        if (value === currentValue) {
            // Same value, add it to the current run
            run.push(atom);
        }
        else {
            // The value of property for this atom is different from the
            // current value, start a new run
            if (run.length > 0)
                result.push(run);
            run = [atom];
            currentValue = value;
        }
    }
    // Push whatever is left
    if (run.length > 0)
        result.push(run);
    return result;
}
exports.getPropertyRuns = getPropertyRuns;
function emitColorRun(run, options) {
    var _a;
    var parent = run[0].parent;
    var parentColor = parent === null || parent === void 0 ? void 0 : parent.style.color;
    var result = [];
    // Since `\textcolor{}` applies to both text and math mode, wrap mode first, then
    // textcolor
    for (var _i = 0, _b = getModeRuns(run); _i < _b.length; _i++) {
        var modeRun = _b[_i];
        var mode = options.defaultMode;
        for (var _c = 0, _d = getPropertyRuns(modeRun, 'color'); _c < _d.length; _c++) {
            var colorRun = _d[_c];
            var style = colorRun[0].style;
            var body = Mode._registry[colorRun[0].mode].serialize(colorRun, __assign(__assign({}, options), { defaultMode: mode === 'text' ? 'text' : 'math' }));
            if (!options.skipStyles &&
                style.color &&
                style.color !== 'none' &&
                (!parent || parentColor !== style.color)) {
                result.push((0, tokenizer_1.latexCommand)('\\textcolor', (_a = style.verbatimColor) !== null && _a !== void 0 ? _a : style.color, (0, tokenizer_1.joinLatex)(body)));
            }
            else
                result.push((0, tokenizer_1.joinLatex)(body));
        }
    }
    return result;
}
function emitBackgroundColorRun(run, options) {
    var parent = run[0].parent;
    var parentColor = parent === null || parent === void 0 ? void 0 : parent.style.backgroundColor;
    return getPropertyRuns(run, 'backgroundColor').map(function (x) {
        var _a;
        if (x.length > 0 || x[0].type !== 'box') {
            var style = x[0].style;
            if (style.backgroundColor &&
                style.backgroundColor !== 'none' &&
                (!parent || parentColor !== style.backgroundColor)) {
                return (0, tokenizer_1.latexCommand)('\\colorbox', (_a = style.verbatimBackgroundColor) !== null && _a !== void 0 ? _a : style.backgroundColor, (0, tokenizer_1.joinLatex)(emitColorRun(x, __assign(__assign({}, options), { defaultMode: 'text' }))));
            }
        }
        return (0, tokenizer_1.joinLatex)(emitColorRun(x, options));
    });
}
function emitFontSizeRun(run, options) {
    if (run.length === 0)
        return [];
    var parent = run[0].parent;
    var contextFontsize = parent === null || parent === void 0 ? void 0 : parent.style.fontSize;
    var result = [];
    for (var _i = 0, _a = getPropertyRuns(run, 'fontSize'); _i < _a.length; _i++) {
        var sizeRun = _a[_i];
        var fontsize = sizeRun[0].style.fontSize;
        var body = emitBackgroundColorRun(sizeRun, options);
        if (body) {
            if (fontsize &&
                fontsize !== 'auto' &&
                (!parent || contextFontsize !== fontsize)) {
                result.push.apply(result, __spreadArray([[
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
                    ][fontsize]], body, false));
            }
            else
                result.push.apply(result, body);
        }
    }
    return result;
}
