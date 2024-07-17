"use strict";
exports.__esModule = true;
exports.getInlineShortcut = void 0;
var definitions_utils_1 = require("../latex-commands/definitions-utils");
/**
 *
 * @param siblings atoms preceding this potential shortcut
 */
function validateShortcut(siblings, shortcut) {
    if (!shortcut)
        return '';
    // If it's a simple shortcut (no conditional), it's always valid
    if (typeof shortcut === 'string')
        return shortcut;
    // If we have no context, we assume all the shortcuts are valid
    if (!siblings || shortcut.after === undefined)
        return shortcut.value;
    var nothing = false;
    var letter = false;
    var digit = false;
    var isFunction = false;
    var frac = false;
    var surd = false;
    var binop = false;
    var relop = false;
    var operator = false;
    var punct = false;
    var array = false;
    var openfence = false;
    var closefence = false;
    var text = false;
    var space = false;
    // Find first sibling left which is not a placeholder or subsup
    var sibling = siblings[0]; // sibling immediately left
    var index = 0;
    while ((sibling === null || sibling === void 0 ? void 0 : sibling.type) && /^(subsup|placeholder)$/.test(sibling.type)) {
        index += 1;
        sibling = siblings[index];
    }
    nothing = !sibling || sibling.type === 'first'; // Start of a group
    if (sibling) {
        text = sibling.mode === 'text';
        letter = !text && sibling.type === 'mord' && definitions_utils_1.LETTER.test(sibling.value);
        digit = !text && sibling.type === 'mord' && /\d+$/.test(sibling.value);
        isFunction = !text && sibling.isFunction;
        frac = sibling.type === 'genfrac';
        surd = sibling.type === 'surd';
        binop = sibling.type === 'mbin';
        relop = sibling.type === 'mrel';
        operator =
            sibling.type === 'mop' ||
                sibling.type === 'operator' ||
                sibling.type === 'extensible-symbol';
        punct = sibling.type === 'mpunct' || sibling.type === 'minner';
        array = sibling.type === 'array';
        openfence = sibling.type === 'mopen';
        closefence = sibling.type === 'mclose' || sibling.type === 'leftright';
        space = sibling.type === 'space';
    }
    // If this is a conditional shortcut, consider the conditions now
    if ((shortcut.after.includes('nothing') && nothing) ||
        (shortcut.after.includes('letter') && letter) ||
        (shortcut.after.includes('digit') && digit) ||
        (shortcut.after.includes('function') && isFunction) ||
        (shortcut.after.includes('frac') && frac) ||
        (shortcut.after.includes('surd') && surd) ||
        (shortcut.after.includes('binop') && binop) ||
        (shortcut.after.includes('relop') && relop) ||
        (shortcut.after.includes('operator') && operator) ||
        (shortcut.after.includes('punct') && punct) ||
        (shortcut.after.includes('array') && array) ||
        (shortcut.after.includes('openfence') && openfence) ||
        (shortcut.after.includes('closefence') && closefence) ||
        (shortcut.after.includes('text') && text) ||
        (shortcut.after.includes('space') && space))
        return shortcut.value;
    return '';
}
/**
 *
 * @param context - atoms preceding the candidate, potentially used
 * to reduce which shortcuts are applicable. If 'null', no restrictions are
 * applied.
 * @param s - candidate inline shortcuts (e.g. `"pi"`)
 * @return A replacement string matching the shortcut (e.g. `"\pi"`)
 */
function getInlineShortcut(context, s, shortcuts) {
    if (!shortcuts)
        return '';
    return validateShortcut(context, shortcuts[s]);
}
exports.getInlineShortcut = getInlineShortcut;
