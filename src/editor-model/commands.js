"use strict";
exports.__esModule = true;
exports.move = exports.skip = exports.wordBoundaryOffset = void 0;
var array_1 = require("../atoms/array");
var latex_1 = require("../atoms/latex");
var text_1 = require("../atoms/text");
var definitions_utils_1 = require("../latex-commands/definitions-utils");
var mode_editor_latex_1 = require("../editor-mathfield/mode-editor-latex");
var utils_1 = require("editor-mathfield/utils");
/*
 * Calculates the offset of the "next word".
 * This is inspired by the behavior of text editors on macOS, namely:
    blue   yellow
      ^-
         ^-------
 * That is:

 * (1) If starts with an alphanumerical character, find the first alphanumerical
 * character which is followed by a non-alphanumerical character
 *
 * The behavior regarding non-alphanumeric characters is less consistent.
 * Here's the behavior we use:
 *
 *   +=-()_:”     blue
 * ^---------
 *   +=-()_:”     blue
 *      ^---------
 *   +=-()_:”blue
 *      ^--------
 *
 * (2) If starts in whitespace, skip whitespace, then find first non-whitespace*
 *    followed by whitespace
 * (*) Pages actually uses the character class of the first non-whitespace
 * encountered.
 *
 * (3) If starts in a non-whitespace, non alphanumerical character, find the first
 *      whitespace
 *
 */
function wordBoundaryOffset(model, offset, direction) {
    if (model.at(offset).mode !== 'text')
        return offset;
    var dir = direction === 'backward' ? -1 : +1;
    var result;
    if (definitions_utils_1.LETTER_AND_DIGITS.test(model.at(offset).value)) {
        // (1) We start with an alphanumerical character
        var i = offset;
        var match = void 0;
        do {
            match =
                model.at(i).mode === 'text' &&
                    definitions_utils_1.LETTER_AND_DIGITS.test(model.at(i).value);
            i += dir;
        } while (model.at(i) && match);
        result = model.at(i) ? i - 2 * dir : i - dir;
    }
    else if (/\s/.test(model.at(offset).value)) {
        // (2) We start with whitespace
        // Skip whitespace
        var i = offset;
        while (model.at(i) &&
            model.at(i).mode === 'text' &&
            /\s/.test(model.at(i).value))
            i += dir;
        if (!model.at(i)) {
            // We've reached the end
            result = i - dir;
        }
        else {
            var match = true;
            do {
                match = model.at(i).mode === 'text' && !/\s/.test(model.at(i).value);
                i += dir;
            } while (model.at(i) && match);
            result = model.at(i) ? i - 2 * dir : i - dir;
        }
    }
    else {
        // (3)
        var i = offset;
        // Skip non-whitespace
        while (model.at(i) &&
            model.at(i).mode === 'text' &&
            !/\s/.test(model.at(i).value))
            i += dir;
        result = model.at(i) ? i : i - dir;
        var match = true;
        while (model.at(i) && match) {
            match = model.at(i).mode === 'text' && /\s/.test(model.at(i).value);
            if (match)
                result = i;
            i += dir;
        }
        result = model.at(i) ? i - 2 * dir : i - dir;
    }
    return result - (dir > 0 ? 0 : 1);
}
exports.wordBoundaryOffset = wordBoundaryOffset;
/**
 * Keyboard navigation with alt/option:
 * Move the insertion point to the next/previous point of interest.
 * A point of interest is an atom of a different type (mbin, mord, etc...)
 * than the current focus.
 * If `extend` is true, the selection will be extended. Otherwise, it is
 * collapsed, then moved.
 * @todo array
 */
function skip(model, direction, options) {
    var _a, _b, _c, _d, _e, _f, _g;
    var previousPosition = model.position;
    if (!((_a = options === null || options === void 0 ? void 0 : options.extend) !== null && _a !== void 0 ? _a : false))
        model.collapseSelection(direction);
    var atom = model.at(model.position);
    if (direction === 'forward') {
        if (atom.type === 'subsup') {
            atom = atom.rightSibling;
            if (!atom)
                atom = model.at(model.position + 1);
        }
        else
            atom = model.at(model.position + 1);
    }
    if (!atom) {
        model.announce('plonk');
        return false;
    }
    var offset = model.offsetOf(atom);
    if (atom instanceof text_1.TextAtom) {
        //
        // We're in a text zone, skip word by word
        //
        offset = wordBoundaryOffset(model, offset, direction);
    }
    else if (atom instanceof latex_1.LatexAtom) {
        //
        // We're in a LaTeX mode zone, skip suggestion
        //
        if (atom.isSuggestion) {
            // Since suggestions are always at the end, this must be forward
            console.assert(direction === 'forward');
            while (atom && atom instanceof latex_1.LatexAtom) {
                atom.isSuggestion = false;
                offset = model.offsetOf(atom);
                atom = atom.rightSibling;
            }
        }
        else if (direction === 'forward') {
            atom = atom.rightSibling;
            if (!atom || !(atom instanceof latex_1.LatexAtom)) {
                // At the end of the command
                model.announce('plonk');
                return false;
            }
            while (atom &&
                atom instanceof latex_1.LatexAtom &&
                /[a-zA-Z\*]/.test(atom.value)) {
                offset = model.offsetOf(atom);
                atom = atom.rightSibling;
            }
        }
        else {
            atom = atom.leftSibling;
            if (!atom || !(atom instanceof latex_1.LatexAtom)) {
                // At the start of the command
                model.announce('plonk');
                return false;
            }
            while (atom &&
                atom instanceof latex_1.LatexAtom &&
                /[a-zA-Z\*]/.test(atom.value)) {
                offset = model.offsetOf(atom);
                atom = atom.leftSibling;
            }
        }
    }
    else if (direction === 'forward' && atom.type === 'mopen') {
        //
        // Right before a 'mopen', skip to the corresponding balanced fence
        //
        var level = 0;
        do {
            if (atom.type === 'mopen')
                level += 1;
            else if (atom.type === 'mclose')
                level -= 1;
            atom = atom.rightSibling;
        } while (!atom.isLastSibling && level !== 0);
        offset = model.offsetOf(atom.leftSibling);
    }
    else if (direction === 'backward' && atom.type === 'mclose') {
        //
        // Right after a 'mclose', skip to the corresponding balanced fence
        //
        var level = 0;
        do {
            if (atom.type === 'mopen')
                level += 1;
            else if (atom.type === 'mclose')
                level -= 1;
            atom = atom.leftSibling;
        } while (!atom.isFirstSibling && level !== 0);
        offset = model.offsetOf(atom);
    }
    else if (direction === 'backward') {
        //
        // We're in a regular math zone (not before/after a fence)
        //
        if (atom.type === 'first') {
            while (offset > 0 && atom.type === 'first') {
                offset -= 1;
                atom = model.at(offset);
            }
        }
        else {
            var type = atom.type;
            if (atom.type === 'subsup') {
                // If we're after a 'subsup', skip to its left sibling
                // (the base of the super/subscript)
                offset = model.offsetOf(model.at(offset).leftSibling);
            }
            offset -= 1;
            var nextType = (_b = model.at(offset)) === null || _b === void 0 ? void 0 : _b.type;
            // If (nextType === 'subsup') {
            //     offset = model.offsetOf(model.at(offset).leftSibling);
            // }
            while (offset >= 0 && nextType === type) {
                if (((_c = model.at(offset)) === null || _c === void 0 ? void 0 : _c.type) === 'subsup')
                    offset = model.offsetOf(model.at(offset).leftSibling);
                else
                    offset -= 1;
                nextType = model.at(offset).type;
            }
        }
    }
    else {
        var type = atom.type;
        // If (atom.type === 'subsup') {
        //     offset = model.offsetOf(model.at(offset).rightSibling);
        // }
        var nextType = (_d = model.at(offset)) === null || _d === void 0 ? void 0 : _d.type;
        var lastOffset = model.lastOffset;
        while (offset <= lastOffset &&
            (nextType === type || nextType === 'subsup')) {
            while (((_e = model.at(offset).rightSibling) === null || _e === void 0 ? void 0 : _e.type) === 'subsup')
                offset = model.offsetOf(model.at(offset).rightSibling);
            offset += 1;
            nextType = (_f = model.at(offset)) === null || _f === void 0 ? void 0 : _f.type;
        }
        offset -= 1;
    }
    if ((_g = options === null || options === void 0 ? void 0 : options.extend) !== null && _g !== void 0 ? _g : false) {
        if (!model.setSelection(model.anchor, offset)) {
            model.announce('plonk');
            return false;
        }
    }
    else {
        if (offset === model.position) {
            model.announce('plonk');
            return false;
        }
        model.position = offset;
    }
    model.announce('move', previousPosition);
    model.mathfield.stopCoalescingUndo();
    return true;
}
exports.skip = skip;
/**
 * Handle keyboard navigation (arrow keys)
 */
function move(model, direction, options) {
    var _a, _b;
    options = options !== null && options !== void 0 ? options : { extend: false };
    model.mathfield.styleBias = direction === 'backward' ? 'right' : 'left';
    if (direction !== 'forward') {
        var _c = (0, mode_editor_latex_1.getCommandSuggestionRange)(model), from = _c[0], to = _c[1];
        if (from !== undefined && to !== undefined)
            model.deleteAtoms([from, to]);
    }
    if (direction === 'upward')
        return moveUpward(model, options);
    if (direction === 'downward')
        return moveDownward(model, options);
    if (options.extend) {
        var pos_1 = nextValidPosition(model, model.position, direction);
        if (pos_1 < 0)
            pos_1 = 0;
        if (pos_1 > model.lastOffset)
            pos_1 = model.lastOffset;
        var result = model.setSelection(model.anchor, pos_1);
        model.mathfield.stopCoalescingUndo();
        return result;
    }
    if (model.selectionIsPlaceholder) {
        model.collapseSelection(direction);
        var result = move(model, direction);
        model.mathfield.stopCoalescingUndo();
        return result;
    }
    var pos = model.position;
    var previousPosition = pos;
    if (model.collapseSelection(direction)) {
        pos = model.position;
        if (!isValidPosition(model, pos))
            pos = nextValidPosition(model, pos, direction);
    }
    else
        pos = nextValidPosition(model, pos, direction);
    if (pos < 0 || pos > model.lastOffset) {
        // We're going out of bounds
        var success = true; // True => perform default handling
        if (!model.silenceNotifications) {
            success =
                (_b = (_a = model.mathfield.host) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new CustomEvent('move-out', {
                    detail: { direction: direction },
                    cancelable: true,
                    bubbles: true,
                    composed: true
                }))) !== null && _b !== void 0 ? _b : true;
        }
        if (success)
            model.announce('plonk');
        return success;
    }
    model.setPositionHandlingPlaceholder(pos);
    model.mathfield.stopCoalescingUndo();
    model.announce('move', previousPosition);
    return true;
}
exports.move = move;
function nextValidPosition(model, pos, direction) {
    pos = pos + (direction === 'forward' ? +1 : -1);
    if (pos < 0 || pos > model.lastOffset)
        return pos;
    if (!isValidPosition(model, pos))
        return nextValidPosition(model, pos, direction);
    return pos;
}
function isValidPosition(model, pos) {
    var _a;
    var atom = model.at(pos);
    // If we're inside a captureSelection, that's not a valid position
    var parent = atom.parent;
    while (parent && !parent.inCaptureSelection)
        parent = parent.parent;
    if (parent === null || parent === void 0 ? void 0 : parent.inCaptureSelection)
        return false;
    if ((_a = atom.parent) === null || _a === void 0 ? void 0 : _a.skipBoundary) {
        if (!atom.isFirstSibling && atom.isLastSibling)
            return false;
        if (atom.type === 'first')
            return false;
    }
    if (model.mathfield.hasEditablePrompts && !atom.parentPrompt)
        return false;
    return true;
}
function getClosestAtomToXPosition(mathfield, search, x) {
    var prevX = Infinity;
    var i = 0;
    for (; i < search.length; i++) {
        var atom = search[i];
        var el = mathfield.getHTMLElement(atom);
        if (!el)
            continue;
        var toX = (0, utils_1.getLocalDOMRect)(el).right;
        var abs = Math.abs(x - toX);
        if (abs <= prevX) {
            // minimise distance to x
            prevX = abs;
        }
        else {
            // this element is further away
            break;
        }
    }
    return search[i - 1];
}
function moveToClosestAtomVertically(model, fromAtom, toAtoms, extend, direction) {
    // If prompting mode, filter toAtoms for ID's placeholders
    var hasEditablePrompts = model.mathfield.hasEditablePrompts;
    var editableAtoms = !hasEditablePrompts
        ? toAtoms
        : toAtoms.filter(function (a) { return a.type === 'prompt' && !a.captureSelection; });
    // calculate best atom to put cursor at based on real x coordinate
    var fromX = (0, utils_1.getLocalDOMRect)(model.mathfield.getHTMLElement(fromAtom)).right;
    var targetSelection = model.offsetOf(getClosestAtomToXPosition(model.mathfield, editableAtoms, fromX)) - (hasEditablePrompts ? 1 : 0); // jump inside prompt
    if (extend) {
        var _a = model.selection.ranges[0], left = _a[0], right = _a[1];
        var newSelection = void 0;
        var cmp = direction === 'up' ? left : right;
        if (targetSelection < cmp) {
            // extending selection upwards / reducing selection downwards
            newSelection = {
                ranges: [[targetSelection, right]],
                direction: 'backward'
            };
        }
        else {
            // reducing selection upwards / extending selection downwards
            newSelection = {
                ranges: [[left, targetSelection]],
                direction: 'forward'
            };
        }
        model.setSelection(newSelection);
    }
    else {
        // move cursor
        model.setPositionHandlingPlaceholder(targetSelection);
    }
    model.announce("move ".concat(direction));
}
function moveUpward(model, options) {
    var _a, _b;
    var extend = (_a = options === null || options === void 0 ? void 0 : options.extend) !== null && _a !== void 0 ? _a : false;
    if (!extend)
        model.collapseSelection('backward');
    // Callback when there is nowhere to move
    var handleDeadEnd = function () {
        var _a, _b;
        var success = true; // True => perform default handling
        if (!model.silenceNotifications) {
            success =
                (_b = (_a = model.mathfield.host) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new CustomEvent('move-out', {
                    detail: { direction: 'upward' },
                    cancelable: true,
                    bubbles: true,
                    composed: true
                }))) !== null && _b !== void 0 ? _b : true;
        }
        model.announce(success ? 'line' : 'plonk');
        return success;
    };
    // Find a target branch
    // This is to handle the case: `\frac{x}{\sqrt{y}}`. If we're at `y`
    // we'd expect to move to `x`, even though `\sqrt` doesn't have an 'above'
    // branch, but one of its ancestor does.
    var baseAtom = model.at(model.position);
    var atom = baseAtom;
    while (atom &&
        atom.parentBranch !== 'below' &&
        !(Array.isArray(atom.parentBranch) && atom.parent instanceof array_1.ArrayAtom))
        atom = atom.parent;
    // handle navigating through matrices and such
    if (Array.isArray(atom === null || atom === void 0 ? void 0 : atom.parentBranch) && atom.parent instanceof array_1.ArrayAtom) {
        var arrayAtom = atom.parent;
        if (atom.parentBranch[0] < 1)
            return handleDeadEnd();
        var rowAbove = atom.parentBranch[0] - 1;
        var aboveCell = arrayAtom.array[rowAbove][atom.parentBranch[1]];
        // Check if the cell has any editable regions
        var cellHasPrompt = aboveCell.some(function (a) { return a.type === 'prompt' && !a.captureSelection; });
        if (!cellHasPrompt && model.mathfield.hasEditablePrompts)
            return handleDeadEnd();
        moveToClosestAtomVertically(model, baseAtom, aboveCell, extend, 'up');
    }
    else if (atom) {
        // If branch doesn't exist, create it
        var branch = (_b = atom.parent.branch('above')) !== null && _b !== void 0 ? _b : atom.parent.createBranch('above');
        // Check if the branch has any editable regions
        var branchHasPrompt = branch.some(function (a) { return a.type === 'prompt' && a.placeholderId; });
        if (!branchHasPrompt && model.mathfield.hasEditablePrompts)
            return handleDeadEnd();
        moveToClosestAtomVertically(model, baseAtom, branch, extend, 'up');
    }
    else
        return handleDeadEnd();
    model.mathfield.stopCoalescingUndo();
    return true;
}
function moveDownward(model, options) {
    var _a, _b;
    var extend = (_a = options === null || options === void 0 ? void 0 : options.extend) !== null && _a !== void 0 ? _a : false;
    if (!extend)
        model.collapseSelection('forward');
    // Callback when there is nowhere to move
    var handleDeadEnd = function () {
        var _a, _b;
        var success = true; // True => perform default handling
        if (!model.silenceNotifications) {
            success =
                (_b = (_a = model.mathfield.host) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new CustomEvent('move-out', {
                    detail: { direction: 'downward' },
                    cancelable: true,
                    bubbles: true,
                    composed: true
                }))) !== null && _b !== void 0 ? _b : true;
        }
        model.announce(success ? 'line' : 'plonk');
        return success;
    };
    // Find a target branch
    // This is to handle the case: `\frac{\sqrt{x}}{y}`. If we're at `x`
    // we'd expect to move to `y`, even though `\sqrt` doesn't have a 'below'
    // branch, but one of its ancestor does.
    var baseAtom = model.at(model.position);
    var atom = baseAtom;
    while (atom &&
        atom.parentBranch !== 'above' &&
        !(Array.isArray(atom.parentBranch) && atom.parent instanceof array_1.ArrayAtom))
        atom = atom.parent;
    // handle navigating through matrices and such
    if (Array.isArray(atom === null || atom === void 0 ? void 0 : atom.parentBranch) && atom.parent instanceof array_1.ArrayAtom) {
        var arrayAtom = atom.parent;
        if (atom.parentBranch[0] + 1 > arrayAtom.array.length - 1)
            return handleDeadEnd();
        var rowBelow = atom.parentBranch[0] + 1;
        var belowCell = arrayAtom.array[rowBelow][atom.parentBranch[1]];
        // Check if the cell has any editable regions
        var cellHasPrompt = belowCell.some(function (a) { return a.type === 'prompt' && !a.captureSelection; });
        if (!cellHasPrompt && model.mathfield.hasEditablePrompts)
            return handleDeadEnd();
        moveToClosestAtomVertically(model, baseAtom, belowCell, extend, 'down');
    }
    else if (atom) {
        // If branch doesn't exist, create it
        var branch = (_b = atom.parent.branch('below')) !== null && _b !== void 0 ? _b : atom.parent.createBranch('below');
        // Check if the branch has any editable regions
        var branchHasPrompt = branch.some(function (a) { return a.type === 'prompt'; });
        if (!branchHasPrompt && model.mathfield.hasEditablePrompts)
            return handleDeadEnd();
        moveToClosestAtomVertically(model, baseAtom, branch, extend, 'down');
    }
    else
        return handleDeadEnd();
    return true;
}
