"use strict";
exports.__esModule = true;
exports.addBold = exports.removeItalic = exports.addItalic = exports.applyStyle = exports.applyStyleToUnstyledAtoms = void 0;
var types_1 = require("../common/types");
var font_metrics_1 = require("../core/font-metrics");
function applyStyleToUnstyledAtoms(atom, style) {
    if (!atom || !style)
        return;
    if ((0, types_1.isArray)(atom)) {
        // Apply styling options to each atom
        atom.forEach(function (x) { return applyStyleToUnstyledAtoms(x, style); });
    }
    else if (typeof atom === 'object') {
        if (!atom.style.color &&
            !atom.style.backgroundColor &&
            !atom.style.fontFamily &&
            !atom.style.fontShape &&
            !atom.style.fontSeries &&
            !atom.style.fontSize &&
            !atom.style.variant &&
            !atom.style.variantStyle) {
            atom.applyStyle(style);
            applyStyleToUnstyledAtoms(atom.body, style);
            applyStyleToUnstyledAtoms(atom.above, style);
            applyStyleToUnstyledAtoms(atom.below, style);
            applyStyleToUnstyledAtoms(atom.subscript, style);
            applyStyleToUnstyledAtoms(atom.superscript, style);
        }
    }
}
exports.applyStyleToUnstyledAtoms = applyStyleToUnstyledAtoms;
/**
 * Apply a style (color, background) to the selection.
 *
 * If the style is already applied to the selection, remove it. If the selection
 * has the style partially applied (i.e. only some sections), remove it from
 * those sections, and apply it to the entire selection.
 */
function applyStyle(model, range, style, options) {
    function everyStyle(property, value) {
        for (var _i = 0, atoms_2 = atoms; _i < atoms_2.length; _i++) {
            var atom = atoms_2[_i];
            if (atom.style[property] !== value)
                return false;
        }
        return true;
    }
    range = model.normalizeRange(range);
    if (range[0] === range[1])
        return false;
    var atoms = model.getAtoms(range, { includeChildren: true });
    if (options.operation === 'toggle') {
        if (style.color && everyStyle('color', style.color)) {
            // If the selection already has this color, turn it off
            style.color = 'none';
            delete style.verbatimColor;
        }
        if (style.backgroundColor &&
            everyStyle('backgroundColor', style.backgroundColor)) {
            // If the selection already has this color, turn it off
            style.backgroundColor = 'none';
            delete style.verbatimBackgroundColor;
        }
        if (style.fontFamily && everyStyle('fontFamily', style.fontFamily)) {
            // If the selection already has this font family, turn it off
            style.fontFamily = 'none';
        }
        // If (style.series) style.fontSeries = style.series;
        if (style.fontSeries && everyStyle('fontSeries', style.fontSeries)) {
            // If the selection already has this series (weight), turn it off
            style.fontSeries = 'auto';
        }
        // If (style.shape) style.fontShape = style.shape;
        if (style.fontShape && everyStyle('fontShape', style.fontShape)) {
            // If the selection already has this shape (italic), turn it off
            style.fontShape = 'auto';
        }
        // If (style.size) style.fontSize = style.size;
        if (style.fontSize && everyStyle('fontSize', style.fontSize)) {
            // If the selection already has this size, reset it to default size
            style.fontSize = font_metrics_1.DEFAULT_FONT_SIZE;
        }
        if (style.variant && everyStyle('variant', style.variant)) {
            // If the selection already has this variant, turn it off
            style.variant = 'normal';
        }
        if (style.variantStyle && everyStyle('variantStyle', style.variantStyle)) {
            // If the selection already has this variant, turn it off
            style.variantStyle = '';
        }
    }
    for (var _i = 0, atoms_1 = atoms; _i < atoms_1.length; _i++) {
        var atom = atoms_1[_i];
        atom.applyStyle(style);
    }
    return true;
}
exports.applyStyle = applyStyle;
function addItalic(v) {
    return {
        'up': 'italic',
        'bold': 'bolditalic',
        'italic': 'italic',
        'bolditalic': 'bolditalic',
        '': 'italic'
    }[v !== null && v !== void 0 ? v : ''];
}
exports.addItalic = addItalic;
function removeItalic(v) {
    return {
        'up': 'up',
        'bold': 'bold',
        'italic': undefined,
        'bolditalic': 'bold',
        '': undefined
    }[v !== null && v !== void 0 ? v : ''];
}
exports.removeItalic = removeItalic;
function addBold(v) {
    return {
        'up': 'bold',
        'bold': 'bold',
        'italic': 'bolditalic',
        'bolditalic': 'bolditalic',
        '': 'bold'
    }[v !== null && v !== void 0 ? v : ''];
}
exports.addBold = addBold;
