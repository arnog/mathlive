import Keyboard from './editor-keyboard';
import { selectionIsCollapsed, setSelection } from './model-selection';
import { contentDidChange, contentWillChange } from './model-listeners';
import type { MathfieldPrivate } from './mathfield-class';
/**
 * Convert the atoms before the anchor to 'text' mode
 * @param count - how many atoms back to look at
 * @param {function} until - callback to indicate when to stop
 * @private
 */
function convertLastAtomsToText(
    mathfield: MathfieldPrivate,
    count: number,
    until?
): void {
    if (typeof count === 'function') {
        until = count;
        count = Infinity;
    }
    if (typeof count === 'undefined') {
        count = Infinity;
    }
    let i = 0;
    let done = false;
    contentWillChange(mathfield.model);
    while (!done) {
        const atom = mathfield.model.sibling(i);
        done =
            count === 0 ||
            !atom ||
            atom.mode !== 'math' ||
            !(
                /mord|textord|mpunct/.test(atom.type) ||
                (atom.type === 'mop' && /[a-zA-Z]+/.test(atom.body as string))
            ) ||
            !!atom.superscript ||
            !!atom.subscript ||
            (until && !until(atom));
        if (!done) {
            atom.applyStyle({ mode: 'text' });
            atom.symbol = atom.body as string;
            atom.latex = '';
        }
        i -= 1;
        count -= 1;
    }
    contentDidChange(mathfield.model);
}
/**
 * Convert the atoms before the anchor to 'math' mode 'mord'
 * @param {number} count - how many atoms back to look at
 * @param {function} until - callback to indicate when to stop
 * @private
 */
function convertLastAtomsToMath(
    mathfield: MathfieldPrivate,
    count?: number,
    until?
): void {
    if (typeof count === 'function') {
        until = count;
        count = Infinity;
    }
    if (typeof count === 'undefined') {
        count = Infinity;
    }
    contentWillChange(mathfield.model);
    let i = 0;
    let done = false;
    while (!done) {
        const atom = mathfield.model.sibling(i);
        done =
            count === 0 ||
            !atom ||
            atom.mode !== 'text' ||
            atom.body === ' ' ||
            (until && !until(atom));
        if (!done) {
            atom.applyStyle({ mode: 'math' });
        }
        i -= 1;
        count -= 1;
    }
    removeIsolatedSpace(mathfield);
    contentDidChange(mathfield.model);
}
/**
 * Going backwards from the anchor, if a text zone consisting of a single
 * space character is found (i.e. it is surrounded by math zone),
 * remove it.
 */
export function removeIsolatedSpace(mathfield: MathfieldPrivate): void {
    let i = 0;
    while (
        mathfield.model.sibling(i) &&
        mathfield.model.sibling(i).mode === 'math'
    ) {
        i -= 1;
    }
    // If the atom before the last one converted is a
    // text mode space, preceded by a math mode atom,
    // remove the space
    if (
        mathfield.model.sibling(i) &&
        mathfield.model.sibling(i).mode === 'text' &&
        mathfield.model.sibling(i).body === ' ' &&
        (!mathfield.model.sibling(i - 1) ||
            mathfield.model.sibling(i - 1).mode === 'math')
    ) {
        contentWillChange(mathfield.model);
        mathfield.model.siblings().splice(i - 1, 1);
        contentDidChange(mathfield.model);
        // We need to adjust the selection after doing some surgery on the atoms list
        // But we don't want to receive selection notification changes
        // which could have a side effect of changing the mode :(
        const save = mathfield.model.suppressChangeNotifications;
        mathfield.model.suppressChangeNotifications = true;
        setSelection(mathfield.model, mathfield.model.anchorOffset() - 1);
        mathfield.model.suppressChangeNotifications = save;
    }
}
/**
 * Return the characters before anchor that could potentially be turned
 * into text mode.
 * This excludes things like 'mop' (e.g. \sin)
 */
function getTextBeforeAnchor(mathfield: MathfieldPrivate): string {
    // Going backwards, accumulate
    let result = '';
    let i = 0;
    let done = false;
    while (!done) {
        const atom = mathfield.model.sibling(i);
        done = !(
            atom &&
            ((atom.mode === 'text' && !atom.type) ||
                (atom.mode === 'math' && /mord|textord|mpunct/.test(atom.type)))
        );
        if (!done) {
            result = atom.body + result;
        }
        i -= 1;
    }
    return result;
}
/**
 * Consider whether to switch mode give the content before the anchor
 * and the character being input
 *
 * @param {string} keystroke
 * @param {Event} evt - a Event corresponding to the keystroke
 * @return true if the mode should change
 */

export function smartMode_(
    mathfield: MathfieldPrivate,
    keystroke: string,
    evt
): boolean {
    if (mathfield.smartModeSuppressed) {
        return false;
    }
    if (mathfield.model.endOffset() < mathfield.model.siblings().length - 1) {
        return false;
    }
    if (!evt || evt.ctrlKey || evt.metaKey) {
        return false;
    }
    const c = Keyboard.eventToChar(evt);
    if (c.length > 1) {
        return false;
    } // Backspace, Left, etc...
    if (!selectionIsCollapsed(mathfield.model)) {
        // There is a selection
        if (mathfield.mode === 'text') {
            if (/[/_^]/.test(c)) {
                return true;
            }
        }
        return false;
    }
    const context = getTextBeforeAnchor(mathfield) + c;
    if (mathfield.mode === 'text') {
        // We're in text mode. Should we switch to math?
        if (keystroke === 'Esc' || /[/\\]/.test(c)) {
            // If this is a command for a fraction,
            // or the '\' command mode key
            // switch to 'math'
            return true;
        }
        if (/[\^_]/.test(c)) {
            // If this is a superscript or subscript
            // switch to 'math'
            if (/(^|\s)[a-zA-Z][^_]$/.test(context)) {
                // If left hand context is a single letter,
                // convert it to math
                convertLastAtomsToMath(mathfield, 1);
            }
            return true;
        }
        // If this is a closing matching fence
        // switch to 'math' mode
        const lFence = { ')': '(', '}': '{', ']': '[' }[c];
        if (
            lFence &&
            mathfield.model.parent() &&
            mathfield.model.parent().type === 'leftright' &&
            mathfield.model.parent().leftDelim === lFence
        ) {
            return true;
        }
        if (/(^|[^a-zA-Z])(a|I)[ ]$/.test(context)) {
            // Single letters that are valid words in the current language
            // Do nothing. @todo: localization
            return false;
        }
        if (/[$€£₤₺¥¤฿¢₡₧₨₹₩₱]/u.test(c)) {
            // A currency symbol.
            // Switch to math mode
            return true;
        }
        if (/(^|[^a-zA-Z'’])[a-zA-Z][ ]$/.test(context)) {
            // An isolated letter, followed by a space:
            // Convert the letter to math, stay in text mode.
            convertLastAtomsToMath(mathfield, 1);
            return false;
        }
        if (/[^0-9]\.[^0-9\s]$/.test(context)) {
            // A period followed by something other than space or a digit
            // and not preceded by a digit.
            // We thought this was a text period, but turns out it's not
            // Turn it into a \cdot
            convertLastAtomsToMath(mathfield, 1);
            const atom = mathfield.model.sibling(0);
            atom.body = '⋅'; // centered dot
            atom.variant = 'normal'; // @revisit. Was 'auto'. Check for proper conversion.
            atom.symbol = '\\cdot';
            atom.latex = '';
            return true;
        }
        if (/(^|\s)[a-zA-Z][^a-zA-Z]$/.test(context)) {
            // Single letter (x), followed by a non-letter (>, =...)
            convertLastAtomsToMath(mathfield, 1);
            return true;
        }
        if (/\.[0-9]$/.test(context)) {
            // If the new character is a digit,
            // and it was preceded by a dot (which may have been converted
            // to text)
            // turn the dot back into 'math'
            convertLastAtomsToMath(mathfield, 1);
            return true;
        }
        if (/[(][0-9+\-.]$/.test(context)) {
            // An open paren followed by a number
            // Turn the paren back to math and switch.
            convertLastAtomsToMath(mathfield, 1);
            return true;
        }
        if (/[(][a-z][,;]$/.test(context)) {
            // An open paren followed by a single letter, then a "," or ";"
            // Turn the paren back and letter to math and switch.
            convertLastAtomsToMath(mathfield, 2);
            return true;
        }
        // The tests above can look behind and change what had previously
        // been entered. Now, let's just look at the typed character.
        if (/[0-9+\-=><*|]$/.test(c)) {
            // If this new character looks like a number,
            // or a relational operator (=, <, >)
            // or a "*" or "|"
            // (note that <=, >=, etc... are handled separately as shortcuts)
            // switch to 'math'
            removeIsolatedSpace(mathfield);
            return true;
        }
    } else {
        // We're in math mode. Should we switch to text?
        if (keystroke === 'Spacebar') {
            convertLastAtomsToText(mathfield, undefined, (a) =>
                /[a-z][:,;.]$/.test(a.body)
            );
            return true;
        }
        if (
            /[a-zA-Z]{3,}$/.test(context) &&
            !/(dxd|abc|xyz|uvw)$/.test(context)
        ) {
            // A sequence of three characters
            // (except for some exceptions)
            // Convert them to text.
            convertLastAtomsToText(mathfield, undefined, (a) =>
                /[a-zA-Z:,;.]/.test(a.body)
            );
            return true;
        }
        if (/(^|\W)(if|If)$/i.test(context)) {
            // @todo localization
            convertLastAtomsToText(mathfield, 1);
            return true;
        }
        if (
            /(\u0393|\u0394|\u0398|\u039b|\u039E|\u03A0|\u03A3|\u03a5|\u03a6|\u03a8|\u03a9|[\u03b1-\u03c9]|\u03d1|\u03d5|\u03d6|\u03f1|\u03f5){3,}$/u.test(
                context
            ) &&
            !/(αβγ)$/.test(context)
        ) {
            // A sequence of three *greek* characters
            // (except for one exception)
            // Convert them to text.
            convertLastAtomsToText(mathfield, undefined, (a) =>
                /(:|,|;|.|\u0393|\u0394|\u0398|\u039b|\u039E|\u03A0|\u03A3|\u03a5|\u03a6|\u03a8|\u03a9|[\u03b1-\u03c9]|\u03d1|\u03d5|\u03d6|\u03f1|\u03f5)/u.test(
                    a.body
                )
            );
            return true;
        }
        if (/\?|\./.test(c)) {
            // If the last character is a period or question mark,
            // turn it to 'text'
            return true;
        }
    }
    return false;
}
