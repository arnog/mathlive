"use strict";
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
exports.applyInterBoxSpacing = void 0;
var skip_box_1 = require("./skip-box");
/*
 * See http://www.tug.org/TUGboat/tb30-3/tb96vieth.pdf for
 * typesetting conventions for mathematical physics (units, etc...)
 */
/**
 *
 * Extract from the TeXBook:
 *
 * > In fact, TEX’s rules for spacing in formulas are fairly simple. A
 * > formula is converted to a math list as described at the end of Chapter 17,
 * > and the math list consists chiefly of “atoms” of eight basic types:
 * > Ord (ordinary), Op (large operator), Bin (binary operation),
 * > Rel (relation), Open (opening), Close (closing), Punct (punctuation),
 * > and Inner (a delimited subformula).
 * > Other kinds of atoms, which arise from commands like \overline or
 * > \mathaccent or \vcenter, etc., are all treated as type Ord; fractions are
 * > treated as type Inner.
 *
 * > The following table is used to determine the spacing between pair of
 * > adjacent atoms.
 *                                                          -- TeXBook, p. 170
 *
 * @todo
 * > If the math list turns out to be simply a single Ord atom
 * > without subscripts or superscripts, or an Acc whose nucleus
 * > is an Ord, the enclosing braces are effectively removed.
 * -- TeXBook, p. 290
 *
 * Superscript and subscript are considered part of the atom
 * they're attached to, and don't affect its type.
 *
 * In this table
 * - "3" = `\thinmuskip`
 * - "4" = `\medmuskip`
 * - "5" = `\thickmuskip`
 *
 */
var INTER_BOX_SPACING = {
    ord: { op: 3, bin: 4, rel: 5, inner: 3 },
    op: { ord: 3, op: 3, rel: 5, inner: 3 },
    bin: { ord: 4, op: 4, open: 4, inner: 4 },
    rel: { ord: 5, op: 5, open: 5, inner: 5 },
    close: { op: 3, bin: 4, rel: 5, inner: 3 },
    punct: { ord: 3, op: 3, rel: 3, open: 3, punct: 3, inner: 3 },
    inner: { ord: 3, op: 3, bin: 4, rel: 5, open: 3, punct: 3, inner: 3 }
};
/**
 * This table is used when the mathstyle is 'tight' (scriptstyle or
 * scriptscriptstyle).
 */
var INTER_BOX_TIGHT_SPACING = {
    ord: { op: 3 },
    op: { ord: 3, op: 3 },
    close: { op: 3 },
    inner: { op: 3 }
};
/**
 *  Handle proper spacing of, e.g. "-4" vs "1-4", by adjusting some box type
 */
function adjustType(boxes) {
    traverseBoxes(boxes, function (prev, cur) {
        // > 5. If the current item is a Bin atom, and if this was the first atom
        // >   in the list, or if the most recent previous atom was Bin, Op, Rel,
        // >   Open, or Punct, change the current Bin to Ord and continue with
        // >   Rule 14.
        // >   Otherwise continue with Rule 17.
        //                                                    -- TexBook p. 442
        if (cur.type === 'bin' &&
            (!prev || /^(middle|bin|op|rel|open|punct)$/.test(prev.type)))
            cur.type = 'ord';
        // > 6. If the current item is a Rel or Close or Punct atom, and if the
        // >    most recent previous atom was Bin, change that previous Bin to Ord.
        // >    Continue with Rule 17.
        if ((prev === null || prev === void 0 ? void 0 : prev.type) === 'bin' && /^(rel|close|punct)$/.test(cur.type))
            prev.type = 'ord';
        if (cur.type !== 'ignore')
            prev = cur;
    });
}
//
// Adjust the atom(/box) types according to the TeX rules and the corresponding
// spacing
//
function applyInterBoxSpacing(root, context) {
    if (!root.children)
        return root;
    var boxes = root.children;
    adjustType(boxes);
    var thin = context.getRegisterAsEm('thinmuskip');
    var med = context.getRegisterAsEm('medmuskip');
    var thick = context.getRegisterAsEm('thickmuskip');
    traverseBoxes(boxes, function (prev, cur) {
        var _a, _b, _c;
        if (!prev)
            return;
        var prevType = prev.type;
        var table = cur.isTight
            ? (_a = INTER_BOX_TIGHT_SPACING[prevType]) !== null && _a !== void 0 ? _a : null
            : (_b = INTER_BOX_SPACING[prevType]) !== null && _b !== void 0 ? _b : null;
        var hskip = (_c = table === null || table === void 0 ? void 0 : table[cur.type]) !== null && _c !== void 0 ? _c : null;
        if (hskip === 3)
            (0, skip_box_1.addSkipBefore)(cur, thin);
        if (hskip === 4)
            (0, skip_box_1.addSkipBefore)(cur, med);
        if (hskip === 5)
            (0, skip_box_1.addSkipBefore)(cur, thick);
    });
    return root;
}
exports.applyInterBoxSpacing = applyInterBoxSpacing;
function traverseBoxes(boxes, f, prev) {
    if (prev === void 0) { prev = undefined; }
    if (!boxes)
        return prev;
    // Make a copy of the boxes, as the `f()` may modify it (when inserting skips)
    boxes = __spreadArray([], boxes, true);
    for (var _i = 0, boxes_1 = boxes; _i < boxes_1.length; _i++) {
        var cur = boxes_1[_i];
        if (cur.type === 'lift')
            prev = traverseBoxes(cur.children, f, prev);
        else if (cur.type === 'ignore')
            traverseBoxes(cur.children, f);
        else {
            f(prev, cur);
            traverseBoxes(cur.children, f);
            prev = cur;
        }
    }
    return prev;
}
