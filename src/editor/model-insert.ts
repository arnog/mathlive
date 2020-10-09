import { InsertOptions } from '../public/mathfield';

import {
    Atom,
    COMMAND_MODE_CHARACTERS,
    isAtomArray,
    parseString,
    makeRoot,
} from '../core/core';

import { parseMathString } from './parse-math-string';

import type { ModelPrivate } from './model-class';
import { invalidateVerbatimLatex, isEmptyMathlist } from './model-utils';
import { arrayCellCount, arrayCell } from './model-array-utils';
import { deleteAtoms, deleteChar } from './model-delete';
import { applyStyleToUnstyledAtoms } from './model-styling';
import { contentDidChange } from './model-listeners';

import { getAnchor } from './model-selection-utils';
import {
    selectionIsCollapsed,
    getAnchorMode,
    setSelectionOffset,
    leap,
    move,
    getSelectedAtoms,
    collapseSelectionBackward,
    collapseSelectionForward,
    getImplicitArgOffset,
    getContentFromSiblings,
} from './model-selection';

import type { Style } from '../public/core';
import { RIGHT_DELIM } from '../core/definitions';

/**
 * Normalize the model by adding 'first' atoms where necessary.
 * This function modifies the model in place.
 */
export function normalizeModel(model: ModelPrivate): void {
    model.root.forEach((x) => {
        if (
            Array.isArray(x.body) &&
            (x.body.length === 0 || x.body[0].type !== 'first')
        ) {
            x.body.unshift(new Atom(x.mode, 'first'));
        }
        if (
            x.superscript &&
            (x.superscript.length === 0 || x.superscript[0].type !== 'first')
        ) {
            x.superscript.unshift(new Atom(x.mode, 'first'));
        }
        if (
            x.subscript &&
            (x.subscript.length === 0 || x.subscript[0].type !== 'first')
        ) {
            x.subscript.unshift(new Atom(x.mode, 'first'));
        }
        if (
            x.overscript &&
            (x.overscript.length === 0 || x.overscript[0].type !== 'first')
        ) {
            x.overscript.unshift(new Atom(x.mode, 'first'));
        }
        if (
            x.underscript &&
            (x.underscript.length === 0 || x.underscript[0].type !== 'first')
        ) {
            x.underscript.unshift(new Atom(x.mode, 'first'));
        }
        if (x.numer && (x.numer.length === 0 || x.numer[0].type !== 'first')) {
            x.numer.unshift(new Atom(x.mode, 'first'));
        }
        if (x.denom && (x.denom.length === 0 || x.denom[0].type !== 'first')) {
            x.denom.unshift(new Atom(x.mode, 'first'));
        }
        if (x.index && (x.index.length === 0 || x.index[0].type !== 'first')) {
            x.index.unshift(new Atom(x.mode, 'first'));
        }
    });
}

export function insert(
    model: ModelPrivate,
    s: string,
    options: InsertOptions
): void {
    // Try to insert a smart fence.
    if (!(options.smartFence ?? false)) {
        // When smartFence is turned off, only do a "smart" fence insert
        // if we're inside a `leftright`, at the last char
        const parent = model.parent();
        if (
            parent?.type === 'leftright' &&
            parent.rightDelim === '?' &&
            model.endOffset() === model.siblings().length - 1 &&
            /^[)}\]|]$/.test(s)
        ) {
            parent.rightDelim = s;
            move(model, 'forward');
            normalizeModel(model);
            contentDidChange(model);
            return;
        }
    } else if (insertSmartFence(model, s, options.style)) {
        normalizeModel(model);
        return;
    }

    const suppressChangeNotifications = model.suppressChangeNotifications;
    if (options.suppressChangeNotifications) {
        model.suppressChangeNotifications = true;
    }
    const contentWasChanging = model.suppressChangeNotifications;
    model.suppressChangeNotifications = true;

    if (!options.insertionMode) options.insertionMode = 'replaceSelection';
    if (!options.selectionMode) options.selectionMode = 'placeholder';
    if (!options.format) options.format = 'auto';
    options.macros = options.macros ?? model.options.macros;

    const mode = options.mode || getAnchorMode(model);
    let mathlist: Atom[];

    // Save the content of the selection, if any
    const args: (string | Atom[])[] = [
        makeRoot('math', getSelectedAtoms(model)).toLatex(false),
    ];

    // If a placeholder was specified, use it
    const placeholder = options.placeholder ?? '\\placeholder{}';
    args['?'] = placeholder;

    // Delete any selected items
    if (
        options.insertionMode === 'replaceSelection' &&
        !selectionIsCollapsed(model)
    ) {
        deleteChar(model);
    } else if (options.insertionMode === 'replaceAll') {
        model.root.body = [];
        model.root.latex = '';
        model.path = [{ relation: 'body', offset: 0 }];
        model.extent = 0;
    } else if (options.insertionMode === 'insertBefore') {
        collapseSelectionBackward(model);
    } else if (options.insertionMode === 'insertAfter') {
        collapseSelectionForward(model);
    }

    // Delete any placeholders before or after the insertion point
    const siblings = model.siblings();
    const firstOffset = model.startOffset();
    if (
        firstOffset + 1 < siblings.length &&
        siblings[firstOffset + 1] &&
        siblings[firstOffset + 1].type === 'placeholder'
    ) {
        deleteChar(model, 1);
    } else if (
        firstOffset > 0 &&
        siblings[firstOffset] &&
        siblings[firstOffset].type === 'placeholder'
    ) {
        deleteChar(model, -1);
    }

    if (mode === 'math' && options.format === 'ASCIIMath') {
        [, s] = parseMathString(s, { format: 'ASCIIMath' });
        mathlist = parseString(
            s,
            'math',
            null,
            options?.macros,
            false,
            model.listeners.onError
        );

        // Simplify result.
        simplifyParen(model, mathlist);
    } else if (
        mode !== 'text' &&
        (options.format === 'auto' || options.format === 'latex')
    ) {
        if (mode === 'command') {
            // Short-circuit the tokenizer and parser if in command mode
            mathlist = [];
            for (const c of s) {
                if (COMMAND_MODE_CHARACTERS.test(c)) {
                    mathlist.push(new Atom('command', 'command', c));
                }
            }
        } else if (s === '\u001b') {
            // Insert an 'esc' character triggers the command mode
            mathlist = [new Atom('command', 'command', '\\')];
        } else {
            if (options.format === 'auto') {
                [options.format, s] = parseMathString(s);
            }

            if (args[0]) {
                // There was a selection, we'll use it for #@
                s = s.replace(/(^|[^\\])#@/g, '$1#0');
            } else if (/(^|[^\\])#@/.test(s)) {
                // If we're inserting a latex fragment that includes a #@ argument
                // substitute the preceding `mord`s or text mode atoms for it (implicit argument)
                const offset = getImplicitArgOffset(model);
                s = s.replace(
                    /(^|[^\\])#@/g,
                    '$1' +
                        getContentFromSiblings(
                            model,
                            offset + 1,
                            model.startOffset()
                        )
                );
                // Delete the implicit argument
                deleteAtoms(model, offset - model.startOffset());
            } else {
                // No selection, no 'mord' before. Let's make '#@' a placeholder.
                s = s.replace(/(^|[^\\])#@/g, '$1#?');
            }
            // If the whole string is bracketed by a mode shift command, remove it
            if (/^\$\$(.*)\$\$$/.test(s)) {
                s = s.substring(2, s.length - 2);
            }
            if (!args[0]) args[0] = placeholder;
            mathlist = parseString(
                s,
                mode,
                args,
                options.macros,
                options.smartFence ?? false,
                model.listeners.onError
            );

            // Simplify result.
            if (options.format !== 'latex') {
                simplifyParen(model, mathlist);
            }
        }
    } else if (mode === 'text' || options.format === 'text') {
        // Map special TeX characters to alternatives
        // Must do this one first, since other replacements include backslash
        s = s.replace(/\\/g, '\\textbackslash ');

        s = s.replace(/#/g, '\\#');
        s = s.replace(/\$/g, '\\$');
        s = s.replace(/%/g, '\\%');
        s = s.replace(/&/g, '\\&');
        // s = s.replace(/:/g, '\\colon');     // text colon?
        // s = s.replace(/\[/g, '\\lbrack');
        // s = s.replace(/]/g, '\\rbrack');
        s = s.replace(/_/g, '\\_');
        s = s.replace(/{/g, '\\textbraceleft ');
        s = s.replace(/}/g, '\\textbraceright ');
        s = s.replace(/\^/g, '\\textasciicircum ');
        s = s.replace(/~/g, '\\textasciitilde ');
        s = s.replace(/£/g, '\\textsterling ');

        mathlist = parseString(
            s,
            'text',
            args,
            options.macros,
            false,
            model.listeners.onError
        );
    }

    // Something has been inserted, and the parent's verbatim latex is no longer valid
    invalidateVerbatimLatex(model);

    // Some atoms may already have a style (for example if there was an
    // argument, i.e. the selection, that this was applied to).
    // So, don't apply style to atoms that are already styled, but *do*
    // apply it to newly created atoms that have no style yet.
    applyStyleToUnstyledAtoms(mathlist, options.style);

    // Insert the mathlist at the position following the anchor
    const parent = model.parent();
    if (
        options.format !== 'latex' &&
        model.options.removeExtraneousParentheses &&
        parent &&
        parent.type === 'leftright' &&
        parent.leftDelim === '(' &&
        isEmptyMathlist(parent.body as Atom[]) &&
        mathlist &&
        mathlist.length === 1 &&
        mathlist[0].type === 'genfrac'
    ) {
        // If the insert is fraction inside a lefright, remove the leftright
        model.path.pop();
        model.siblings()[model.anchorOffset()] = mathlist[0];
    } else {
        if (options.format === 'latex' && args.length === 1 && !args[0]) {
            // If we are given a latex string with no arguments, store it verbatim
            // Caution: we can only do this if the toLatex() for this parent
            // would return an empty string. If the latex is generated using other
            // properties than parent.body, for example by adding '\left.' and
            // '\right.' with a 'leftright' type, we can't use this shortcut.
            if (
                parent.type === 'root' &&
                isEmptyMathlist(parent.body as Atom[])
            ) {
                parent.latex = s;
            }
        }
        model.siblings().splice(model.anchorOffset() + 1, 0, ...mathlist);
    }

    // If needed, make sure there's a first atom in the siblings list
    normalizeModel(model);

    // Prepare to dispatch notifications
    // (for selection changes, then content change)
    model.suppressChangeNotifications = contentWasChanging;

    // Update the anchor's location
    if (options.selectionMode === 'placeholder') {
        // Move to the next placeholder
        const newPlaceholders = [];
        for (const atom of mathlist) {
            atom.forEach((x) => {
                if (x.type === 'placeholder') newPlaceholders.push(x);
            });
        }
        if (newPlaceholders.length === 0 || !leap(model, +1, false)) {
            // No placeholder found, move to right after what we just inserted
            setSelectionOffset(model, model.anchorOffset() + mathlist.length);
            // model.path[model.path.length - 1].offset += mathlist.length;
        } else {
            model.announce('move'); // should have placeholder selected
        }
    } else if (options.selectionMode === 'before') {
        // Do nothing: don't change the anchorOffset.
    } else if (options.selectionMode === 'after') {
        setSelectionOffset(model, model.anchorOffset() + mathlist.length);
    } else if (options.selectionMode === 'item') {
        setSelectionOffset(model, model.anchorOffset(), mathlist.length);
    }

    contentDidChange(model);

    model.suppressChangeNotifications = suppressChangeNotifications;
}

function removeParen(list: Atom[]): Atom[] {
    if (!list) return undefined;

    if (
        list.length === 1 &&
        list[0].type === 'leftright' &&
        list[0].leftDelim === '('
    ) {
        list = list[0].body as Atom[];
    }

    return list;
}

/**
 * If it's a fraction with a parenthesized numerator or denominator
 * remove the parentheses
 *
 */
function simplifyParen(model: ModelPrivate, atoms: Atom[]): void {
    if (atoms && model.options.removeExtraneousParentheses) {
        for (let i = 0; atoms[i]; i++) {
            if (atoms[i].type === 'leftright' && atoms[i].leftDelim === '(') {
                if (isAtomArray(atoms[i].body)) {
                    let genFracCount = 0;
                    let genFracIndex = 0;
                    let nonGenFracCount = 0;
                    for (let j = 0; atoms[i].body[j]; j++) {
                        if ((atoms[i].body[j] as Atom).type === 'genfrac') {
                            genFracCount++;
                            genFracIndex = j;
                        }
                        if ((atoms[i].body[j] as Atom).type !== 'first') {
                            nonGenFracCount++;
                        }
                    }
                    if (nonGenFracCount === 0 && genFracCount === 1) {
                        // This is a single frac inside a leftright: remove the leftright
                        atoms[i] = atoms[i].body[genFracIndex] as Atom;
                    }
                }
            }
        }

        atoms.forEach((atom) => {
            if (atom.type === 'genfrac') {
                simplifyParen(model, atom.numer);
                simplifyParen(model, atom.denom);
                atom.numer = removeParen(atom.numer);
                atom.denom = removeParen(atom.denom);
            }
            if (atom.superscript) {
                simplifyParen(model, atom.superscript);
                atom.superscript = removeParen(atom.superscript);
            }
            if (atom.subscript) {
                simplifyParen(model, atom.subscript);
                atom.subscript = removeParen(atom.subscript);
            }
            if (atom.underscript) {
                simplifyParen(model, atom.underscript);
                atom.underscript = removeParen(atom.underscript);
            }
            if (atom.overscript) {
                simplifyParen(model, atom.overscript);
                atom.overscript = removeParen(atom.overscript);
            }
            if (atom.index) {
                simplifyParen(model, atom.index);
                atom.index = removeParen(atom.index);
            }
            if (atom.type === 'surd') {
                simplifyParen(model, atom.body as Atom[]);
                atom.body = removeParen(atom.body as Atom[]);
            } else if (isAtomArray(atom.body)) {
                simplifyParen(model, atom.body);
            }

            if (atom.array) {
                for (let i = arrayCellCount(atom.array); i >= 0; i--) {
                    simplifyParen(model, arrayCell(atom.array, i));
                }
            }
        });
    }
}

// const MATCHING_FENCE = {
//     '\\lbrace': ['\\rbrace'],
//     '(': [')', ']', '\\rbrack'],
//     // For (open/closed) intervals
//     '\\rbrack': [')', ']', '\\rbrack', '[', '\\lbrack'],
//     '\\lbrack': [')', ']', '\\rbrack', '[', '\\lbrack'],
// };

/**
 * Insert a smart fence '(', '{', '[', etc...
 * If not handled (because `fence` wasn't a fence), return false.
 */
export function insertSmartFence(
    model: ModelPrivate,
    fence: string,
    style: Style
): boolean {
    const parent = model.parent();
    let delims =
        parent.type === 'leftright' ? parent.leftDelim + parent.rightDelim : '';
    if (delims === '\\lbrace\\rbrace') delims = '{}';
    if (delims === '\\{\\}') delims = '{}';

    //
    // 1. Are we inserting a middle fence?
    // ...as in {...|...}
    //
    if (delims === '{}' && /\||\\vert|\\Vert|\\mvert|\\mid/.test(fence)) {
        insert(model, '\\,\\middle' + fence + '\\, ', {
            mode: 'math',
            format: 'latex',
            style: style,
        });
        return true;
    }
    // Normalize some fences.
    // Note that '{' and '}' are not valid braces.
    // They should be '\{' or '\lbrace' and '\}' or '\rbrace'
    if (fence === '{' || fence === '\\{') fence = '\\lbrace';
    if (fence === '}' || fence === '\\}') fence = '\\rbrace';
    if (fence === '[') fence = '\\lbrack';
    if (fence === ']') fence = '\\rbrack';

    //
    // 2. Is it an open fence?
    //
    const rDelim = RIGHT_DELIM[fence];
    if (rDelim && !(parent.type === 'leftright' && parent.leftDelim === '|')) {
        // We have a valid open fence as input
        let s = '';
        const collapsed =
            selectionIsCollapsed(model) ||
            getAnchor(model).type === 'placeholder';

        if (model.sibling(0).isFunction) {
            // We're before a function (e.g. `\sin`, or 'f'):  this is an
            // argument list.
            // Use `\mleft...\mright'.
            s = '\\mleft' + fence + '\\mright';
        } else {
            s = '\\left' + fence + '\\right';
        }
        s += collapsed ? '?' : rDelim;

        let content = [];
        if (collapsed) {
            content = model
                .siblings()
                .splice(model.anchorOffset() + 1, model.siblings().length);
        }
        insert(model, s, { mode: 'math', format: 'latex', style: style });
        if (collapsed) {
            // Move everything that was after the anchor into the leftright
            model.sibling(0).body = content;
            move(model, 'backward');
        }
        return true;
    }

    //
    // 3. Is it a close fence?
    //
    let lDelim: string;
    Object.keys(RIGHT_DELIM).forEach((delim) => {
        if (fence === RIGHT_DELIM[delim]) lDelim = delim;
    });
    if (lDelim) {
        // We found the matching open fence, so it was a valid close fence.
        // Note that `lDelim` may not match `fence`. That's OK.

        // If we're the last atom inside a 'leftright',
        // update the parent
        if (
            parent &&
            parent.type === 'leftright' &&
            model.endOffset() === model.siblings().length - 1
        ) {
            parent.rightDelim = fence;
            move(model, 'forward');
            contentDidChange(model);
            return true;
        }

        // If we have a `leftright` sibling to our left
        // with an indeterminate right fence,
        // move what's between us and the `leftright` inside the `leftright`
        const siblings = model.siblings();
        let i: number;
        for (i = model.endOffset(); i >= 0; i--) {
            if (
                siblings[i].type === 'leftright' &&
                siblings[i].rightDelim === '?'
            ) {
                break;
            }
        }
        if (i >= 0) {
            siblings[i].rightDelim = fence;
            siblings[i].body = (siblings[i].body as Atom[]).concat(
                siblings.slice(i + 1, model.endOffset() + 1)
            );
            siblings.splice(i + 1, model.endOffset() - i);
            setSelectionOffset(model, i);
            contentDidChange(model);
            return true;
        }

        // If we're inside a `leftright`, but not the last atom,
        // and the `leftright` right delim is indeterminate
        // adjust the body (put everything after the insertion point outside)
        if (
            parent &&
            parent.type === 'leftright' &&
            parent.rightDelim === '?'
        ) {
            parent.rightDelim = fence;

            const tail = siblings.slice(model.endOffset() + 1);
            siblings.splice(model.endOffset() + 1);
            model.path.pop();

            // Array.prototype.splice.apply(
            //     model.siblings(),
            //     [model.endOffset() + 1, 0].concat(tail)
            // );
            // @revisit: veryfiy this does the right thing
            model.siblings().splice(model.endOffset() + 1, 0, ...tail);
            contentDidChange(model);

            return true;
        }

        // Is our grand-parent a 'leftright'?
        // If `\left(\frac{1}{x|}\right?` with the caret at `|`
        // go up to the 'leftright' and apply it there instead
        const grandparent = model.ancestor(2);
        if (
            grandparent &&
            grandparent.type === 'leftright' &&
            grandparent.rightDelim === '?' &&
            model.endOffset() === siblings.length - 1
        ) {
            move(model, 'forward');
            return insertSmartFence(model, fence, style);
        }

        // Meh... We couldn't find a matching open fence. Just insert the
        // closing fence as a regular character
        return false;
    }

    return false;
}
