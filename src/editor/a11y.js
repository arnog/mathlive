"use strict";
exports.__esModule = true;
exports.defaultAnnounceHook = void 0;
var atom_to_speakable_text_1 = require("../formats/atom-to-speakable-text");
/**
 *
 * @param arg1 an optional string prefix
 * @param arg2 an atom or an array of atoms
 * @returns a string representation of the atoms as spoken text
 */
function speakableText(arg1, arg2) {
    if (typeof arg1 === 'string')
        return arg1 + (0, atom_to_speakable_text_1.atomToSpeakableText)(arg2);
    return (0, atom_to_speakable_text_1.atomToSpeakableText)(arg1);
}
/**
 * Given an atom, describe the relationship between the atom
 * and its siblings and their parent.
 */
function relationName(atom) {
    var _a;
    var result = undefined;
    if (atom.parent.type === 'prompt') {
        if (atom.parentBranch === 'body')
            result = 'prompt';
    }
    else if (atom.parentBranch === 'body') {
        if (atom.type === 'first') {
            if (atom.parent.type === 'root')
                result = 'mathfield';
            else if (atom.parent.type === 'surd')
                result = 'radicand';
            else if (atom.parent.type === 'genfrac')
                result = 'fraction';
            else if (atom.parent.type === 'sizeddelim')
                result = 'delimiter';
            if (result)
                return result;
        }
        if (atom.type === 'subsup') {
            if (atom.superscript && atom.subscript)
                result = 'superscript and subscript';
            else if (atom.superscript)
                result = 'superscript';
            else if (atom.subscript)
                result = 'subscript';
        }
        else if (atom.type) {
            result =
                (_a = {
                    'accent': 'accented',
                    'array': 'array',
                    'box': 'box',
                    'chem': 'chemical formula',
                    'delim': 'delimiter',
                    'enclose': 'cross out',
                    'extensible-symbol': 'extensible symbol',
                    'error': 'error',
                    'first': 'first',
                    'genfrac': 'fraction',
                    'group': 'group',
                    'latex': 'LaTeX',
                    'leftright': 'delimiter',
                    'line': 'line',
                    'subsup': 'subscript-superscript',
                    'operator': 'operator',
                    'overunder': 'over-under',
                    'placeholder': 'placeholder',
                    'rule': 'rule',
                    'sizeddelim': 'delimiter',
                    'space': 'space',
                    'spacing': 'spacing',
                    'surd': 'square root',
                    'text': 'text',
                    'prompt': 'prompt',
                    'root': 'math field',
                    'mop': 'operator'
                }[atom.type]) !== null && _a !== void 0 ? _a : 'parent';
        }
    }
    else if (atom.parent.type === 'genfrac') {
        if (atom.parentBranch === 'above')
            return 'numerator';
        if (atom.parentBranch === 'below')
            return 'denominator';
    }
    else if (atom.parent.type === 'surd') {
        if (atom.parentBranch === 'above')
            result = 'index';
    }
    else if (atom.parentBranch === 'superscript')
        result = 'superscript';
    else if (atom.parentBranch === 'subscript')
        result = 'subscript';
    if (!result)
        console.log('unknown relationship');
    return result !== null && result !== void 0 ? result : 'parent';
}
/**
 * Announce a change in selection or content via the aria-live region.
 *
 * @param action The action that invoked the change.
 * @param previousPosition The position of the insertion point before the change
 */
function defaultAnnounceHook(mathfield, action, previousPosition, atoms) {
    var liveText = '';
    if (action === 'plonk') {
        // Use this sound to indicate minor errors, for
        // example when an action has no effect.
        globalThis.MathfieldElement.playSound('plonk');
        // As a side effect, reset the keystroke buffer
        mathfield.flushInlineShortcutBuffer();
        return;
    }
    if (action === 'delete')
        liveText = speakableText('deleted: ', atoms);
    else if (action === 'focus' || action.includes('move')) {
        //* ** FIX: could also be moveUp or moveDown -- do something different like provide context???
        //* ** FIX -- should be xxx selected/unselected */
        liveText = getRelationshipAsSpokenText(mathfield.model, previousPosition);
        liveText += getNextAtomAsSpokenText(mathfield.model);
    }
    else if (action === 'replacement') {
        // Announce the contents
        liveText = speakableText(mathfield.model.at(mathfield.model.position));
    }
    else if (action === 'line') {
        // Announce the current line -- currently that's everything
        // mathfield.accessibleMathML.innerHTML = mathfield.options.createHTML(
        //     '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
        //         atomsToMathML(mathfield.model.root, mathfield.options) +
        //         '</math>'
        // );
        var label = speakableText(mathfield.model.root);
        mathfield.keyboardDelegate.setAriaLabel(label);
        /** * FIX -- testing hack for setting braille ***/
        // mathfield.accessibleMathML.focus();
        // console.log("before sleep");
        // sleep(1000).then(() => {
        //     mathfield.textarea.focus();
        //     console.log("after sleep");
        // });
    }
    else
        liveText = atoms ? speakableText(action + ' ', atoms) : action;
    if (liveText) {
        // Aria-live regions are only spoken when it changes; force a change by
        // alternately using nonbreaking space or narrow nonbreaking space
        var ariaLiveChangeHack = mathfield.ariaLiveText.textContent.includes('\u00a0')
            ? ' \u202F '
            : ' \u00A0 ';
        mathfield.ariaLiveText.textContent = liveText + ariaLiveChangeHack;
    }
}
exports.defaultAnnounceHook = defaultAnnounceHook;
function getRelationshipAsSpokenText(model, previousOffset) {
    if (Number.isNaN(previousOffset))
        return '';
    var previous = model.at(previousOffset);
    if (!previous)
        return '';
    if (previous.treeDepth <= model.at(model.position).treeDepth)
        return '';
    var result = '';
    var ancestor = previous.parent;
    var newParent = model.at(model.position).parent;
    while (ancestor !== model.root && ancestor !== newParent) {
        result += "out of ".concat(relationName(ancestor), ";");
        ancestor = ancestor.parent;
    }
    return result;
}
/**
 *
 * Return the spoken text for the atom to the right of the current selection.
 * Take into consideration the position amongst siblings to include 'start of'
 * and 'end of' if applicable.
 */
function getNextAtomAsSpokenText(model) {
    if (!model.selectionIsCollapsed)
        return "selected: ".concat(speakableText(model.getAtoms(model.selection)));
    var result = '';
    // Announce start of denominator, etc
    var cursor = model.at(model.position);
    if (cursor.isFirstSibling)
        result = "start of ".concat(relationName(cursor), ": ");
    if (cursor.isLastSibling) {
        // Don't say both start and end
        if (!cursor.isFirstSibling) {
            if (!cursor.parent.parent)
                return "".concat(speakableText(cursor), "; end of mathfield");
            result = "".concat(speakableText(cursor), "; end of ").concat(relationName(cursor));
        }
    }
    else
        result += speakableText(cursor);
    return result;
}
