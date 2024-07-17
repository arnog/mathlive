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
exports.moveAfterParent = void 0;
var capabilities_1 = require("../ui/utils/capabilities");
var subsup_1 = require("../atoms/subsup");
var commands_1 = require("../editor/commands");
var commands_2 = require("./commands");
var types_1 = require("../common/types");
function moveAfterParent(model) {
    var previousPosition = model.position;
    var parent = model.at(previousPosition).parent;
    // Do nothing if at the root.
    if (!(parent === null || parent === void 0 ? void 0 : parent.parent)) {
        model.announce('plonk');
        return false;
    }
    model.position = model.offsetOf(parent);
    model.mathfield.stopCoalescingUndo();
    model.announce('move', previousPosition);
    return true;
}
exports.moveAfterParent = moveAfterParent;
function superscriptDepth(model) {
    var result = 0;
    var atom = model.at(model.position);
    var wasSuperscript = false;
    while (atom) {
        if (!atom.hasEmptyBranch('superscript') ||
            !atom.hasEmptyBranch('subscript'))
            result += 1;
        if (!atom.hasEmptyBranch('superscript'))
            wasSuperscript = true;
        else if (!atom.hasEmptyBranch('subscript'))
            wasSuperscript = false;
        atom = atom.parent;
    }
    return wasSuperscript ? result : 0;
}
function subscriptDepth(model) {
    var result = 0;
    var atom = model.at(model.position);
    var wasSubscript = false;
    while (atom) {
        if (!atom.hasEmptyBranch('superscript') ||
            !atom.hasEmptyBranch('subscript'))
            result += 1;
        if (!atom.hasEmptyBranch('superscript'))
            wasSubscript = false;
        else if (!atom.hasEmptyBranch('subscript'))
            wasSubscript = true;
        atom = atom.parent;
    }
    return wasSubscript ? result : 0;
}
/**
 * Switch the cursor to the superscript and select it. If there is no subscript
 * yet, create one.
 */
function moveToSuperscript(model) {
    var _a;
    model.collapseSelection();
    if (superscriptDepth(model) >= model.mathfield.options.scriptDepth[1]) {
        model.announce('plonk');
        return false;
    }
    var target = model.at(model.position);
    if (target.subsupPlacement === undefined) {
        // This atom can't have a superscript/subscript:
        // add an adjacent `subsup` atom instead.
        if (((_a = target.rightSibling) === null || _a === void 0 ? void 0 : _a.type) !== 'subsup') {
            target.parent.addChildAfter(new subsup_1.SubsupAtom({ style: target.style }), target);
        }
        target = target.rightSibling;
    }
    // Ensure there is a superscript branch
    target.createBranch('superscript');
    model.setSelection(model.getSiblingsRange(model.offsetOf(target.superscript[0])));
    return true;
}
/**
 * Switch the cursor to the subscript and select it. If there is no subscript
 * yet, create one.
 */
function moveToSubscript(model) {
    var _a;
    model.collapseSelection();
    if (subscriptDepth(model) >= model.mathfield.options.scriptDepth[0]) {
        model.announce('plonk');
        return false;
    }
    var target = model.at(model.position);
    if (target.subsupPlacement === undefined) {
        // This atom can't have a superscript/subscript:
        // add an adjacent `subsup` atom instead.
        if (((_a = model.at(model.position + 1)) === null || _a === void 0 ? void 0 : _a.type) !== 'subsup') {
            target.parent.addChildAfter(new subsup_1.SubsupAtom({ style: model.at(model.position).style }), target);
        }
        target = model.at(model.position + 1);
    }
    // Ensure there is a subscript branch
    target.createBranch('subscript');
    model.setSelection(model.getSiblingsRange(model.offsetOf(target.subscript[0])));
    return true;
}
/**
 * Return an array of tabbable elements, approximately in the order a browser
 * would (the browsers are inconsistent), which is first by accounting
 * for non-null tabIndex, then null tabIndex, then document order of focusable
 * elements.
 */
function getTabbableElements() {
    function tabbable(element) {
        var regularTabbables = [];
        var orderedTabbables = [];
        var candidates = __spreadArray([], element.querySelectorAll("input, select, textarea, a[href], button,\n        [tabindex], audio[controls], video[controls],\n        [contenteditable]:not([contenteditable=\"false\"]), details>summary"), true).filter(isNodeMatchingSelectorTabbable);
        candidates.forEach(function (candidate, i) {
            var candidateTabindex = getTabindex(candidate);
            if (candidateTabindex === 0)
                regularTabbables.push(candidate);
            else {
                orderedTabbables.push({
                    documentOrder: i,
                    tabIndex: candidateTabindex,
                    node: candidate
                });
            }
        });
        return orderedTabbables
            .sort(function (a, b) {
            return a.tabIndex === b.tabIndex
                ? a.documentOrder - b.documentOrder
                : a.tabIndex - b.tabIndex;
        })
            .map(function (a) { return a.node; })
            .concat(regularTabbables);
    }
    function isNodeMatchingSelectorTabbable(element) {
        if (!isNodeMatchingSelectorFocusable(element) ||
            isNonTabbableRadio(element) ||
            getTabindex(element) < 0)
            return false;
        return true;
    }
    function isNodeMatchingSelectorFocusable(node) {
        if (node.disabled ||
            (node.type === 'hidden' && node.tagName.toUpperCase() === 'INPUT') ||
            isHidden(node))
            return false;
        return true;
    }
    function getTabindex(node) {
        var _a;
        var tabindexAttr = Number.parseInt((_a = node.getAttribute('tabindex')) !== null && _a !== void 0 ? _a : 'NaN', 10);
        if (!Number.isNaN(tabindexAttr))
            return tabindexAttr;
        // Browsers do not return `tabIndex` correctly for contentEditable nodes;
        // so if they don't have a tabindex attribute specifically set, assume it's 0.
        if (node.contentEditable === 'true')
            return 0;
        // In Chrome, <audio controls/> and <video controls/> elements get a default
        //  `tabIndex` of -1 when the 'tabindex' attribute isn't specified in the DOM,
        //  yet they are still part of the regular tab order; in FF, they get a default
        //  `tabIndex` of 0; since Chrome still puts those elements in the regular tab
        //  order, consider their tab index to be 0
        if ((node.nodeName === 'AUDIO' || node.nodeName === 'VIDEO') &&
            node.getAttribute('tabindex') === null)
            return 0;
        return node.tabIndex;
    }
    function isNonTabbableRadio(node) {
        return (node.tagName.toUpperCase() === 'INPUT' &&
            node.type === 'radio' &&
            !isTabbableRadio(node));
    }
    function getCheckedRadio(nodes, form) {
        for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
            var node = nodes_1[_i];
            if (node.checked && node.form === form)
                return node;
        }
        return null;
    }
    function isTabbableRadio(node) {
        var _a;
        if (!node.name)
            return true;
        var radioScope = (_a = node.form) !== null && _a !== void 0 ? _a : node.ownerDocument;
        var radioSet = radioScope.querySelectorAll('input[type="radio"][name="' + node.name + '"]');
        var checked = getCheckedRadio(radioSet, node.form);
        return !checked || checked === node;
    }
    function isHidden(element) {
        if (!(0, capabilities_1.isBrowser)() ||
            element === document.activeElement ||
            element.contains(document.activeElement))
            return false;
        if (getComputedStyle(element).visibility === 'hidden')
            return true;
        // Note that browsers generally don't consider the bounding rect
        // as a criteria to determine if an item is focusable, but we want
        // to exclude the invisible textareas used to capture keyoard input.
        var bounds = element.getBoundingClientRect();
        if (bounds.width === 0 || bounds.height === 0)
            return true;
        while (element) {
            if (getComputedStyle(element).display === 'none')
                return true;
            element = element.parentElement;
        }
        return false;
    }
    if (!(0, capabilities_1.isBrowser)())
        return [];
    return tabbable(document.body);
}
// Select all the children of an atom, or a branch
function select(model, target, direction) {
    if (direction === void 0) { direction = 'forward'; }
    var previousPosition = model.position;
    if ((0, types_1.isArray)(target)) {
        // The target is a branch. Select all the atoms in the branch
        var first = model.offsetOf(target[0]);
        var last = model.offsetOf(target[target.length - 1]);
        if (direction === 'forward')
            model.setSelection(first, last);
        else
            model.setSelection(last, first);
        model.announce('move', previousPosition);
        model.mathfield.stopCoalescingUndo();
        return true;
    }
    if (direction === 'forward')
        return select(model, [target.leftSibling, target]);
    return select(model, [target, target.leftSibling]);
}
function leapTo(model, target) {
    var previousPosition = model.position;
    if (typeof target === 'number')
        target = model.at(target);
    // Set the selection to the next leap target
    if (target.type === 'prompt') {
        model.setSelection(model.offsetOf(target.firstChild), model.offsetOf(target.lastChild));
    }
    else {
        var newPosition = model.offsetOf(target);
        if (target.type === 'placeholder')
            model.setSelection(newPosition - 1, newPosition);
        else
            model.position = newPosition;
    }
    model.announce('move', previousPosition);
    model.mathfield.stopCoalescingUndo();
    return true;
}
/**
 * Move to the next/previous leap target: placeholder, editable prompt or
 * empty child list.
 * @return `false` if no placeholder found and did not move
 */
function leap(model, dir) {
    var _a, _b;
    var dist = dir === 'forward' ? 1 : -1;
    // If we're already at a placeholder, move by one more (the placeholder
    // is right after the insertion point)
    if (model.at(model.anchor).type === 'placeholder')
        (0, commands_2.move)(model, dir);
    var origin;
    // If we're in a prompt, start looking after/before the prompt
    var parentPrompt = model.at(model.anchor).parentPrompt;
    if (parentPrompt) {
        if (dir === 'forward')
            origin = model.offsetOf(parentPrompt) + 1;
        else
            origin = model.offsetOf(parentPrompt.leftSibling);
    }
    else
        origin = Math.max(model.position + dist, 0);
    var target = leapTarget(model, origin, dir);
    // If no leap target was found, call handler or move to the next focusable
    // element in the document
    if (!target ||
        (dir === 'forward' && model.offsetOf(target) < origin) ||
        (dir === 'backward' && model.offsetOf(target) > origin)) {
        var success = (_b = (_a = model.mathfield.host) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new CustomEvent('move-out', {
            detail: { direction: dir },
            cancelable: true,
            bubbles: true,
            composed: true
        }))) !== null && _b !== void 0 ? _b : true;
        if (!success) {
            model.announce('plonk');
            return false;
        }
        var tabbable = getTabbableElements();
        // If there are no other elements to focus, plonk.
        if (!document.activeElement || tabbable.length <= 1) {
            model.announce('plonk');
            return false;
        }
        //
        // Focus on next/previous tabbable element
        //
        var index = tabbable.indexOf(document.activeElement) + dist;
        if (index < 0)
            index = tabbable.length - 1;
        if (index >= tabbable.length)
            index = 0;
        tabbable[index].focus();
        model.mathfield.stopCoalescingUndo();
        return true;
    }
    // Set the selection to the next leap target
    leapTo(model, target);
    return true;
}
// Candidate leap targets are atoms of type 'placeholder' or
// 'prompt' or empty children list (except for the root:
// if the root is empty, it is not a valid leap target)
function leapTarget(model, origin, dir) {
    if (origin === void 0) { origin = 0; }
    if (dir === void 0) { dir = 'forward'; }
    return model.findAtom(function (atom) {
        return atom.type === 'placeholder' ||
            atom.type === 'prompt' ||
            (!model.mathfield.readOnly &&
                atom.treeDepth > 2 &&
                atom.isFirstSibling &&
                atom.isLastSibling);
    }, origin, dir);
}
/**
 * If cursor is currently in:
 * - superscript: move to subscript, creating it if necessary
 * - subscript: move to superscript, creating it if necessary
 * - numerator: move to denominator
 * - denominator: move to numerator
 * - otherwise: move to superscript
 */
(0, commands_1.register)({
    moveToOpposite: function (model) {
        var OPPOSITE_RELATIONS = {
            superscript: 'subscript',
            subscript: 'superscript',
            above: 'below',
            below: 'above'
        };
        var cursor = model.at(model.position);
        var parent = cursor.parent;
        if (!parent) {
            model.announce('plonk');
            return false;
        }
        var relation = cursor.parentBranch;
        var oppositeRelation;
        if (typeof relation === 'string')
            oppositeRelation = OPPOSITE_RELATIONS[relation];
        if (!oppositeRelation) {
            var result_1 = cursor.subsupPlacement
                ? moveToSubscript(model)
                : moveToSuperscript(model);
            model.mathfield.stopCoalescingUndo();
            return result_1;
        }
        if (!parent.branch(oppositeRelation)) {
            // Don't have children of the opposite relation yet
            // Add them
            parent.createBranch(oppositeRelation);
        }
        var result = model.setSelection(model.getBranchRange(model.offsetOf(parent), oppositeRelation));
        model.mathfield.stopCoalescingUndo();
        return result;
    },
    moveBeforeParent: function (model) {
        var parent = model.at(model.position).parent;
        if (!parent) {
            model.announce('plonk');
            return false;
        }
        model.position = model.offsetOf(parent);
        model.mathfield.stopCoalescingUndo();
        return true;
    },
    moveAfterParent: function (model) { return moveAfterParent(model); },
    moveToNextChar: function (model) { return (0, commands_2.move)(model, 'forward'); },
    moveToPreviousChar: function (model) { return (0, commands_2.move)(model, 'backward'); },
    moveUp: function (model) { return (0, commands_2.move)(model, 'upward'); },
    moveDown: function (model) { return (0, commands_2.move)(model, 'downward'); },
    moveToNextWord: function (model) { return (0, commands_2.skip)(model, 'forward'); },
    moveToPreviousWord: function (model) { return (0, commands_2.skip)(model, 'backward'); },
    moveToGroupStart: function (model) {
        var pos = model.offsetOf(model.at(model.position).firstSibling);
        if (pos === model.position) {
            model.announce('plonk');
            return false;
        }
        model.position = pos;
        model.mathfield.stopCoalescingUndo();
        return true;
    },
    moveToGroupEnd: function (model) {
        var pos = model.offsetOf(model.at(model.position).lastSibling);
        if (pos === model.position) {
            model.announce('plonk');
            return false;
        }
        model.position = pos;
        model.mathfield.stopCoalescingUndo();
        return true;
    },
    moveToNextGroup: function (model) {
        var _a, _b, _c, _d;
        //
        // 1/ If at the end of the matfield, leap to next tabbable element
        //
        if (model.position === model.lastOffset &&
            model.anchor === model.lastOffset)
            return leap(model, 'forward');
        //
        // 2/ If in text zone, move to first non-text atom
        //
        var atom = model.at(model.position);
        var mode = atom.mode;
        if (mode === 'text') {
            if (model.selectionIsCollapsed) {
                // 2.1/ Select entire zone
                var first = atom;
                while (first && first.mode === 'text')
                    first = first.leftSibling;
                var last = atom;
                while (((_a = last.rightSibling) === null || _a === void 0 ? void 0 : _a.mode) === 'text')
                    last = last.rightSibling;
                if (first && last)
                    return select(model, [first, last]);
            }
            if (atom.rightSibling.mode === 'text') {
                var next = atom;
                while (next && next.mode === 'text')
                    next = next.rightSibling;
                // Leap to after text zone
                if (next) {
                    leapTo(model, (_b = next.leftSibling) !== null && _b !== void 0 ? _b : next);
                    model.mathfield.switchMode('math');
                    return true;
                }
                // If text zone is last zone, move to end of mathfield
                return leapTo(model, model.lastOffset);
            }
        }
        //
        // 3/ Find a placeholder, a prompt or empty group.
        // They have priority over other options below
        //
        // If we're in a prompt, start looking after the prompt
        var parentPrompt = model.at(model.anchor).parentPrompt;
        var origin = parentPrompt
            ? model.offsetOf(parentPrompt) + 1
            : Math.max(model.position + 1, 0);
        var target = leapTarget(model, origin, 'forward');
        if (target && model.offsetOf(target) < origin)
            return leap(model, 'forward');
        if (target)
            return leapTo(model, target);
        //
        // ?/ @todo In LaTeX mode, do something?
        //
        //
        // 4/ In math zone, move to sibling branch, or out of parent
        //
        //
        // 4.1/ Find the next eligible sibling group
        //
        var sibling = findSibling(model, atom, function (x) { return x.type === 'leftright' || x.type === 'text'; }, 'forward');
        if (sibling) {
            // If found a text atom, select the entire zone
            if (sibling.mode === 'text') {
                var last = sibling;
                while (last && last.mode === 'text')
                    last = last.rightSibling;
                return select(model, [
                    (_c = sibling.leftSibling) !== null && _c !== void 0 ? _c : sibling,
                    (_d = last.leftSibling) !== null && _d !== void 0 ? _d : last,
                ]);
            }
            return select(model, sibling);
        }
        var parent = atom.parent;
        if (parent) {
            // 4.2/ Select parent if leftright or surd without index
            if (parent.type === 'leftright' || parent.type === 'surd')
                return select(model, parent);
            // 4.3/ If in an atom with a supsub, try subsup
            if (atom.parentBranch === 'superscript' && parent.subscript)
                return select(model, parent.subscript);
            // 4.4/ If an above branch, try below
            if (atom.parentBranch === 'above' && parent.below)
                return select(model, parent.below);
            // 4.5/ If in a branch (with no "sister" branch), move after parent
            if (atom.parentBranch === 'superscript' ||
                atom.parentBranch === 'subscript')
                return leapTo(model, parent);
            if (atom.parentBranch === 'above' || atom.parentBranch === 'below')
                return select(model, parent);
        }
        // 4.6/ No eligible group found, move to end of mathfield
        return leapTo(model, model.lastOffset);
    },
    moveToPreviousGroup: function (model) {
        var _a;
        //
        // 1/ If at the start of the matfield, leap to previous tabbable element
        //
        if (model.position === 0 && model.anchor === 0)
            return leap(model, 'backward');
        //
        // 2/ If in text zone, move to first text atom
        //
        var atom = model.at(model.position);
        var mode = atom.mode;
        if (mode === 'text') {
            if (model.selectionIsCollapsed) {
                // 2.1/ Select entire zone
                var first = atom;
                while (first && first.mode === 'text')
                    first = first.leftSibling;
                var last = atom;
                while (((_a = last.rightSibling) === null || _a === void 0 ? void 0 : _a.mode) === 'text')
                    last = last.rightSibling;
                if (first && last)
                    return select(model, [first, last]);
            }
            while (atom && atom.mode === 'text')
                atom = atom.leftSibling;
            if (atom)
                return leapTo(model, atom);
            // If text zone is first zone, move to start of mathfield
            return leapTo(model, 0);
        }
        //
        // 3/ Find a placeholder, a prompt or empty group.
        //
        // If we're in a prompt, start looking before the prompt
        var parentPrompt = model.at(model.anchor).parentPrompt;
        var origin = parentPrompt
            ? model.offsetOf(parentPrompt.leftSibling)
            : Math.max(model.position - 1, 0);
        var target = leapTarget(model, origin, 'backward');
        if (target && model.offsetOf(target) > origin)
            return leap(model, 'backward');
        if (target)
            return leapTo(model, target);
        //
        // 4/ In math zone, move to sibling branch, or out of parent
        //
        if (mode === 'math') {
            //
            // 4.1/ Find the previous eligible sibling group
            //
            var sibling = findSibling(model, atom, function (x) { return x.type === 'leftright' || x.type === 'text'; }, 'backward');
            if (sibling) {
                // If found a text atom, select the entire zone
                if (sibling.mode === 'text') {
                    var first = sibling;
                    while (first && first.mode === 'text')
                        first = first.leftSibling;
                    return select(model, [sibling, first]);
                }
                return select(model, sibling);
            }
            var parent_1 = atom.parent;
            if (parent_1) {
                // 4.2/ Select parent if leftright or surd without index
                if (parent_1.type === 'leftright' || parent_1.type === 'surd')
                    return select(model, parent_1);
                // 4.3/ If in an atom with a supsub, try subsup
                if (atom.parentBranch === 'subscript' && parent_1.superscript)
                    return select(model, parent_1.superscript);
                // 4.4/ If in a below branch, try above
                if (atom.parentBranch === 'below' && parent_1.above)
                    return select(model, parent_1.above);
                // 4.5/ If in a branch (with no "sister" branch), move after parent
                if (atom.parentBranch === 'superscript' ||
                    atom.parentBranch === 'subscript')
                    return leapTo(model, parent_1);
                if (atom.parentBranch === 'above' || atom.parentBranch === 'below')
                    return select(model, parent_1);
            }
            // 4.6/ No eligible group found, move to start of mathfield
            return leapTo(model, 0);
        }
        //
        // 5/ @todo In LaTeX mode, do something?
        //
        return false;
    },
    moveToMathfieldStart: function (model) {
        if (model.selectionIsCollapsed && model.position === 0) {
            model.announce('plonk');
            return false;
        }
        model.position = 0;
        model.mathfield.stopCoalescingUndo();
        return true;
    },
    moveToMathfieldEnd: function (model) {
        if (model.selectionIsCollapsed && model.position === model.lastOffset) {
            model.announce('plonk');
            return false;
        }
        model.position = model.lastOffset;
        model.mathfield.stopCoalescingUndo();
        return true;
    },
    moveToSuperscript: moveToSuperscript,
    moveToSubscript: moveToSubscript
}, { target: 'model', changeSelection: true });
(0, commands_1.register)({
    moveToNextPlaceholder: function (model) { return leap(model, 'forward'); },
    moveToPreviousPlaceholder: function (model) { return leap(model, 'backward'); }
}, { target: 'model', changeSelection: true, audioFeedback: 'return' });
function findSibling(model, atom, pred, dir) {
    if (dir === 'forward') {
        var result_2 = atom.rightSibling;
        while (result_2 && !pred(result_2))
            result_2 = result_2.rightSibling;
        return result_2;
    }
    var result = atom.leftSibling;
    while (result && !pred(result))
        result = result.leftSibling;
    return result;
}
