"use strict";
exports.__esModule = true;
exports.offsetFromPoint = exports.nearestAtomFromPoint = exports.onPointerDown = exports.PointerTracker = void 0;
var utils_1 = require("./utils");
var render_1 = require("./render");
var autocomplete_1 = require("./autocomplete");
var commands_select_1 = require("../editor-model/commands-select");
var gLastTap = null;
var gTapCount = 0;
var PointerTracker = /** @class */ (function () {
    function PointerTracker() {
    }
    PointerTracker.start = function (element, evt, onMove, onCancel) {
        var _a;
        PointerTracker.element = element;
        // Have to create a new controller each time, as they can only be used once
        (_a = PointerTracker.controller) === null || _a === void 0 ? void 0 : _a.abort();
        PointerTracker.controller = new AbortController();
        var options = { signal: PointerTracker.controller.signal };
        if ('PointerEvent' in window) {
            element.addEventListener('pointermove', onMove, options);
            element.addEventListener('pointerup', onCancel, options);
            element.addEventListener('pointercancel', onCancel, options);
            if (isPointerEvent(evt)) {
                PointerTracker.pointerId = evt.pointerId;
                element.setPointerCapture(evt.pointerId);
            }
        }
        else {
            // @ts-ignore
            window.addEventListener('mousemove', onMove, options);
            // @ts-ignore
            window.addEventListener('blur', onCancel, options);
            // @ts-ignore
            window.addEventListener('mouseup', onCancel, options);
        }
    };
    PointerTracker.stop = function () {
        var _a;
        (_a = PointerTracker.controller) === null || _a === void 0 ? void 0 : _a.abort();
        PointerTracker.controller = undefined;
        if (typeof PointerTracker.pointerId === 'number') {
            PointerTracker.element.releasePointerCapture(PointerTracker.pointerId);
            PointerTracker.pointerId = undefined;
        }
    };
    return PointerTracker;
}());
exports.PointerTracker = PointerTracker;
function isPointerEvent(evt) {
    return (evt !== null &&
        globalThis.PointerEvent !== undefined &&
        evt instanceof PointerEvent);
}
function onPointerDown(mathfield, evt) {
    var _a;
    // If a mouse button other than the main one was pressed, return.
    if (evt.buttons > 1)
        return;
    //Reset the atom bounds cache
    mathfield.atomBoundsCache = new Map();
    var that = mathfield;
    var anchor;
    var trackingPointer = false;
    var trackingWords = false;
    var dirty = 'none';
    var scrollLeft = false;
    var scrollRight = false;
    var anchorX = evt.clientX;
    var anchorY = evt.clientY;
    var anchorTime = Date.now();
    var field = that.field;
    var scrollInterval = setInterval(function () {
        if (scrollLeft)
            field.scroll({ top: 0, left: field.scrollLeft - 16 });
        else if (scrollRight)
            field.scroll({ top: 0, left: field.scrollLeft + 16 });
    }, 32);
    function endPointerTracking() {
        PointerTracker.stop();
        trackingPointer = false;
        clearInterval(scrollInterval);
        mathfield.element.classList.remove('tracking');
        if (evt)
            evt.preventDefault();
    }
    function onPointerMove(evt) {
        // If we've somehow lost focus, end tracking
        if (!that.hasFocus()) {
            endPointerTracking();
            return;
        }
        var x = evt.clientX;
        var y = evt.clientY;
        // Ignore events that are within small spatial and temporal bounds
        // of the pointer down
        var hysteresis = isPointerEvent(evt) && evt.pointerType === 'touch' ? 20 : 5;
        if (Date.now() < anchorTime + 500 &&
            Math.abs(anchorX - x) < hysteresis &&
            Math.abs(anchorY - y) < hysteresis) {
            evt.preventDefault();
            evt.stopPropagation();
            return;
        }
        var fieldBounds = field.getBoundingClientRect();
        scrollRight = x > fieldBounds.right;
        scrollLeft = x < fieldBounds.left;
        var actualAnchor = anchor;
        if (isPointerEvent(evt)) {
            if (!evt.isPrimary) {
                actualAnchor = offsetFromPoint(that, evt.clientX, evt.clientY, {
                    bias: 0
                });
            }
        }
        var focus = offsetFromPoint(that, x, y, {
            bias: x <= anchorX ? (x === anchorX ? 0 : -1) : +1
        });
        if (actualAnchor >= 0 && focus >= 0) {
            that.model.extendSelectionTo(actualAnchor, focus);
            (0, render_1.requestUpdate)(mathfield);
        }
        if (trackingWords)
            (0, commands_select_1.selectGroup)(that.model);
        // Note: do not prevent default, as we need to track
        // the pointer to prevent long press if the pointer has moved
    }
    // Calculate the tap count
    if (gLastTap &&
        Math.abs(gLastTap.x - anchorX) < 5 &&
        Math.abs(gLastTap.y - anchorY) < 5 &&
        Date.now() < gLastTap.time + 500) {
        gTapCount += 1;
        gLastTap.time = anchorTime;
    }
    else {
        gLastTap = {
            x: anchorX,
            y: anchorY,
            time: anchorTime
        };
        gTapCount = 1;
    }
    var bounds = field.getBoundingClientRect();
    if (anchorX >= bounds.left &&
        anchorX <= bounds.right &&
        anchorY >= bounds.top &&
        anchorY <= bounds.bottom) {
        // Clicking or tapping the field resets the keystroke buffer
        mathfield.flushInlineShortcutBuffer();
        anchor = offsetFromPoint(mathfield, anchorX, anchorY, {
            bias: 0
        });
        // Reset the style bias if the anchor is different
        if (anchor !== mathfield.model.anchor) {
            mathfield.defaultStyle = {};
            mathfield.styleBias = 'left';
        }
        if (anchor >= 0) {
            // Set a `tracking` class to avoid triggering the hover of the virtual
            // keyboard toggle, for example
            mathfield.element.classList.add('tracking');
            if (evt.shiftKey) {
                // If the Shift key is down, extend the selection
                // (in that case, 'anchor' is actually the focus
                var wasCollapsed = mathfield.model.selectionIsCollapsed;
                mathfield.model.extendSelectionTo(mathfield.model.anchor, anchor);
                if ((0, autocomplete_1.acceptCommandSuggestion)(mathfield.model) || wasCollapsed)
                    dirty = 'all';
                else
                    dirty = 'selection';
            }
            else if (mathfield.model.at(anchor).type === 'placeholder') {
                mathfield.model.setSelection(anchor - 1, anchor);
                dirty = 'selection';
            }
            else if (((_a = mathfield.model.at(anchor).rightSibling) === null || _a === void 0 ? void 0 : _a.type) === 'placeholder') {
                mathfield.model.setSelection(anchor, anchor + 1);
                dirty = 'selection';
            }
            else {
                mathfield.model.position = anchor;
                if ((0, autocomplete_1.acceptCommandSuggestion)(mathfield.model))
                    dirty = 'all';
                else
                    dirty = 'selection';
            }
            // `evt.detail` contains the number of consecutive clicks
            // for double-click, triple-click, etc...
            // (note that `evt.detail` is not set when using pointerEvent)
            if (evt.detail === 3 || gTapCount > 2) {
                endPointerTracking();
                if (evt.detail === 3 || gTapCount === 3) {
                    // This is a triple-click
                    mathfield.model.selection = {
                        ranges: [[0, mathfield.model.lastOffset]]
                    };
                    dirty = 'all';
                }
            }
            else if (!trackingPointer) {
                trackingPointer = true;
                PointerTracker.start(field, evt, onPointerMove, endPointerTracking);
                if (evt.detail === 2 || gTapCount === 2) {
                    // This is a double-click
                    trackingWords = true;
                    (0, commands_select_1.selectGroup)(mathfield.model);
                    dirty = 'all';
                }
            }
        }
        // Focus the mathfield
        // (do it after the selection has been set, since the
        // logic on what to do on focus may depend on the selection)
        if (!mathfield.hasFocus()) {
            dirty = 'none'; // focus() will refresh
            mathfield.focus({ preventScroll: true });
        }
    }
    else
        gLastTap = null;
    mathfield.stopCoalescingUndo();
    if (dirty !== 'none') {
        if (mathfield.model.selectionIsCollapsed)
            dirty = 'all';
        (0, render_1.requestUpdate)(mathfield);
    }
    // Prevent the browser from handling.
    evt.preventDefault();
}
exports.onPointerDown = onPointerDown;
function distance(x, y, r) {
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)
        return 0;
    var dx = x - (r.left + r.right) / 2;
    var dy = y - (r.top + r.bottom) / 2;
    return dx * dx + dy * dy;
}
function nearestAtomFromPointRecursive(mathfield, cache, atom, x, y) {
    if (!atom.id)
        return [Infinity, null];
    if (cache.has(atom.id))
        return cache.get(atom.id);
    var bounds = (0, utils_1.getAtomBounds)(mathfield, atom);
    if (!bounds)
        return [Infinity, null];
    var result = [
        Infinity,
        null,
    ];
    //
    // 1. Consider any children within the horizontal bounds
    //
    if (atom.hasChildren &&
        !atom.captureSelection &&
        x >= bounds.left &&
        x <= bounds.right) {
        for (var _i = 0, _a = atom.children; _i < _a.length; _i++) {
            var child = _a[_i];
            var r = nearestAtomFromPointRecursive(mathfield, cache, child, x, y);
            if (r[0] <= result[0])
                result = r;
        }
    }
    //
    // 2. If no children matched (or there were no children), this atom matches
    //
    if (!result[1])
        result = [distance(x, y, bounds), atom];
    cache.set(atom.id, result);
    return result;
}
function nearestAtomFromPoint(mathfield, x, y) {
    var _a = nearestAtomFromPointRecursive(mathfield, new Map(), mathfield.model.root, x, y), atom = _a[1];
    return atom;
}
exports.nearestAtomFromPoint = nearestAtomFromPoint;
/**
 * @param options.bias  if 0, the midpoint of the bounding box
 * is considered to return the sibling. If &lt;0, the left sibling is
 * favored, if >0, the right sibling
 */
function offsetFromPoint(mathfield, x, y, options) {
    var _a;
    //
    // 1/ Check if we're inside the mathfield bounding box
    //
    var bounds = mathfield.field
        .querySelector('.ML__latex')
        .getBoundingClientRect();
    if (!bounds)
        return 0;
    if (x > bounds.right || y > bounds.bottom + 8)
        return mathfield.model.lastOffset;
    if (x < bounds.left || y < bounds.top - 8)
        return 0;
    options = options !== null && options !== void 0 ? options : {};
    options.bias = (_a = options.bias) !== null && _a !== void 0 ? _a : 0;
    //
    // 2/ Find the deepest element that is near the point that was
    // clicked on (the point could be outside of the element)
    //
    var atom = nearestAtomFromPoint(mathfield, x, y);
    //
    // 3/ Find the first parent from root that doesn't have a `captureSelection`
    //    flag
    //
    var parents = [];
    var parent = atom;
    while (parent) {
        parents.unshift(parent);
        parent = parent.parent;
    }
    for (var _i = 0, parents_1 = parents; _i < parents_1.length; _i++) {
        var x_1 = parents_1[_i];
        if (x_1.captureSelection) {
            atom = x_1;
            break;
        }
    }
    var result = mathfield.model.offsetOf(atom);
    if (result < 0)
        return -1;
    //
    // 4/ Account for the desired bias
    //
    if (atom.leftSibling) {
        if (options.bias === 0 && atom.type !== 'placeholder') {
            // If the point clicked is to the left of the vertical midline,
            // adjust the offset to *before* the atom (i.e. after the
            // preceding atom)
            var bounds_1 = (0, utils_1.getAtomBounds)(mathfield, atom);
            if (bounds_1 && x < (bounds_1.left + bounds_1.right) / 2)
                result = mathfield.model.offsetOf(atom.leftSibling);
        }
        else if (options.bias < 0)
            result = mathfield.model.offsetOf(atom.leftSibling);
    }
    return result;
}
exports.offsetFromPoint = offsetFromPoint;
