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
exports.getHref = exports.getElementInfo = exports.getLocalDOMRect = exports.validateOrigin = exports.getSelectionBounds = exports.getAtomBounds = exports.adjustForScrolling = exports.getCaretPoint = exports.isValidMathfield = void 0;
var atom_class_1 = require("../core/atom-class");
/**
 * Checks if the argument is a valid Mathfield.
 * After a Mathfield has been destroyed (for example by calling `dispose()`
 * the Mathfield is no longer valid. However, there may be some pending
 * operations invoked via requestAnimationFrame() for example, that would
 * need to ensure the mathfield is still valid by the time they're executed.
 */
function isValidMathfield(mf) {
    var _a;
    return ((_a = mf.element) === null || _a === void 0 ? void 0 : _a.mathfield) === mf;
}
exports.isValidMathfield = isValidMathfield;
/**
 * Return the element which has the caret
 */
function findElementWithCaret(element) {
    var _a, _b;
    return ((_b = (_a = element.querySelector('.ML__caret')) !== null && _a !== void 0 ? _a : element.querySelector('.ML__text-caret')) !== null && _b !== void 0 ? _b : element.querySelector('.ML__latex-caret'));
}
/**
 * Return the (x,y) client coordinates of the caret in viewport coordinates
 */
function getCaretPoint(element) {
    var caret = findElementWithCaret(element);
    if (!caret)
        return null;
    var bounds = caret.getBoundingClientRect();
    return {
        x: bounds.right,
        y: bounds.bottom,
        height: bounds.height
    };
}
exports.getCaretPoint = getCaretPoint;
function branchId(atom) {
    var _a;
    if (!atom.parent)
        return 'root';
    var result = (_a = atom.parent.id) !== null && _a !== void 0 ? _a : '';
    result +=
        typeof atom.parentBranch === 'string'
            ? '-' + atom.parentBranch
            : "-".concat(atom.parentBranch[0], "/").concat(atom.parentBranch[0]);
    return result;
}
function adjustForScrolling(mathfield, rect, scaleFactor) {
    if (!rect)
        return null;
    var fieldRect = mathfield.field.getBoundingClientRect();
    var w = rect.right - rect.left;
    var h = rect.bottom - rect.top;
    var left = Math.ceil(rect.left - fieldRect.left + mathfield.field.scrollLeft * scaleFactor);
    var top = Math.ceil(rect.top - fieldRect.top);
    return { left: left, right: left + w, top: top, bottom: top + h };
}
exports.adjustForScrolling = adjustForScrolling;
function getNodeBounds(node) {
    var bounds = node.getBoundingClientRect();
    var marginRight = parseInt(getComputedStyle(node).marginRight);
    var result = {
        top: bounds.top - 1,
        bottom: bounds.bottom,
        left: bounds.left,
        right: bounds.right - 1 + marginRight
    };
    if (node.children.length === 0 || node.tagName.toUpperCase() === 'SVG')
        return result;
    for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
        var child = _a[_i];
        if (child.nodeType === 1 &&
            'atomId' in child.dataset &&
            !child.classList.contains('ML__pstrut')) {
            var r = getNodeBounds(child);
            result.left = Math.min(result.left, r.left);
            result.right = Math.max(result.right, r.right);
            result.top = Math.min(result.top, r.top);
            result.bottom = Math.max(result.bottom, r.bottom);
        }
    }
    return result;
}
function getAtomBounds(mathfield, atom) {
    var _a, _b;
    if (!atom.id)
        return null;
    var result = (_b = (_a = mathfield.atomBoundsCache) === null || _a === void 0 ? void 0 : _a.get(atom.id)) !== null && _b !== void 0 ? _b : null;
    if (result !== null)
        return result;
    var node = mathfield.field.querySelector("[data-atom-id=\"".concat(atom.id, "\"]"));
    result = node ? getNodeBounds(node) : null;
    if (mathfield.atomBoundsCache) {
        if (result)
            mathfield.atomBoundsCache.set(atom.id, result);
        else
            mathfield.atomBoundsCache["delete"](atom.id);
    }
    return result !== null && result !== void 0 ? result : null;
}
exports.getAtomBounds = getAtomBounds;
/*
 * Return an array of bounds for the specified range, at most
 * one rect per branch.
 */
function getRangeBounds(mathfield, range, options) {
    // The key of the map is a 'branchId', i.e. "atom id + branch"
    var rects = new Map();
    for (var _i = 0, _a = mathfield.model.getAtoms(range, {
        includeChildren: true
    }); _i < _a.length; _i++) {
        var atom = _a[_i];
        if ((options === null || options === void 0 ? void 0 : options.excludeAtomsWithBackground) && atom.style.backgroundColor)
            continue;
        // Logic to accommodate mathfield hosted in an isotropically
        // scale-transformed element.
        // Without this, the selection indicator will not be in the right place.
        // 1. Inquire how big the mathfield thinks it is
        var field = mathfield.field;
        var offsetWidth = field.offsetWidth;
        // 2. Get the actual screen width of the box
        var actualWidth = Math.floor(field.getBoundingClientRect().width);
        // 3. Divide the two to get the scale factor
        var scaleFactor = actualWidth / offsetWidth;
        scaleFactor = isNaN(scaleFactor) ? 1 : scaleFactor;
        var bounds = adjustForScrolling(mathfield, getAtomBounds(mathfield, atom), scaleFactor);
        if (bounds) {
            var id = branchId(atom);
            if (rects.has(id)) {
                var r = rects.get(id);
                rects.set(id, {
                    left: Math.min(r.left, bounds.left),
                    right: Math.max(r.right, bounds.right),
                    top: Math.min(r.top, bounds.top),
                    bottom: Math.max(r.bottom, bounds.bottom)
                });
            }
            else
                rects.set(id, bounds);
        }
    }
    return __spreadArray([], rects.values(), true);
}
function getSelectionBounds(mathfield, options) {
    return mathfield.model.selection.ranges.reduce(function (acc, x) { return acc.concat.apply(acc, getRangeBounds(mathfield, x, options)); }, []);
}
exports.getSelectionBounds = getSelectionBounds;
function validateOrigin(origin, originValidator) {
    if (origin === '*' || originValidator === 'none')
        return true;
    if (originValidator === 'same-origin')
        return !window.origin || origin === window.origin;
    if (typeof originValidator === 'function')
        return originValidator(origin);
    return false;
}
exports.validateOrigin = validateOrigin;
/**
 * Calculates a DOMRect like getBoundingClientRect
 * but excluding any CSS transforms
 */
function getLocalDOMRect(el) {
    var offsetTop = 0;
    var offsetLeft = 0;
    var width = el.offsetWidth;
    var height = el.offsetHeight;
    while (el instanceof HTMLElement) {
        offsetTop += el.offsetTop;
        offsetLeft += el.offsetLeft;
        el = el.offsetParent;
    }
    return new DOMRect(offsetLeft, offsetTop, width, height);
}
exports.getLocalDOMRect = getLocalDOMRect;
function getElementInfo(mf, offset) {
    if (!mf)
        return undefined;
    var atom = mf.model.at(offset);
    if (!atom)
        return undefined;
    var result = {};
    var bounds = getAtomBounds(mf, atom);
    if (bounds)
        result.bounds = new DOMRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
    result.depth = atom.treeDepth - 2;
    result.style = atom.style;
    // Look for some 'htmlData' in the atom or its ancestors
    var a = atom;
    while (a) {
        if (a.command === '\\htmlData' && a.args && typeof a.args[0] === 'string') {
            var entries = a.args[0].split(',');
            for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                var entry = entries_1[_i];
                var matched = entry.match(/([^=]+)=(.+$)/);
                if (matched) {
                    var key = matched[1].trim().replace(/ /g, '-');
                    if (key) {
                        if (!result.data)
                            result.data = {};
                        result.data[key] = matched[2];
                    }
                }
                else {
                    var key = entry.trim().replace(/ /g, '-');
                    if (key) {
                        if (!result.data)
                            result.data = {};
                        result.data[key] = undefined;
                    }
                }
            }
        }
        if (a.command === '\\htmlId' || a.command === '\\cssId') {
            if (!result.id && a.args && typeof a.args[0] === 'string') {
                result.id = a.args[0];
            }
        }
        a = a.parent;
    }
    if (atom.mode === 'math' || atom.mode === 'text')
        result.latex = atom_class_1.Atom.serialize([atom], { defaultMode: 'math' });
    return result;
}
exports.getElementInfo = getElementInfo;
function getHref(mf, offset) {
    var a = mf.model.at(offset);
    while (a) {
        if (a.command === '\\href') {
            var url = a.args[0];
            if (typeof url === 'string')
                return url;
        }
        a = a.parent;
    }
    return '';
}
exports.getHref = getHref;
