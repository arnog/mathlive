import { InsertOptions } from '../public/mathfield';

import {
    Atom,
    COMMAND_MODE_CHARACTERS,
    isAtomArray,
    parseString,
} from '../core/core';

import { parseMathString } from './parse-math-string';

import type { ModelPrivate } from './model-class';
import { invalidateVerbatimLatex, isEmptyMathlist } from './model-utils';
import { arrayCellCount, arrayCell } from './model-array-utils';
import { deleteAtoms, deleteChar } from './model-delete';
import { insertSmartFence } from './model-smartfence';
import { applyStyleToUnstyledAtoms } from './model-styling';
import { contentDidChange, contentWillChange } from './model-listeners';

import {
    selectionIsCollapsed,
    getAnchorMode,
    setSelection,
    leap,
    move,
    getSelectedAtoms,
    collapseSelectionBackward,
    collapseSelectionForward,
    getImplicitArgOffset,
    getContentFromSiblings,
} from './model-selection';

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
            contentWillChange(model);
            parent.rightDelim = s;
            move(model, +1);
            contentDidChange(model);
            return;
        }
    } else if (insertSmartFence(model, s, options.style)) {
        return;
    }

    const suppressChangeNotifications = model.suppressChangeNotifications;
    if (options.suppressChangeNotifications) {
        model.suppressChangeNotifications = true;
    }
    // Dispatch notifications
    contentWillChange(model);
    const contentWasChanging = model.suppressChangeNotifications;
    model.suppressChangeNotifications = true;

    if (!options.insertionMode) options.insertionMode = 'replaceSelection';
    if (!options.selectionMode) options.selectionMode = 'placeholder';
    if (!options.format) options.format = 'auto';
    options.macros = options.macros ?? model.options.macros;

    const mode = options.mode || getAnchorMode(model);
    let mathlist;

    // Save the content of the selection, if any
    const args = [getSelectedAtoms(model)];

    // If a placeholder was specified, use it
    if (options.placeholder !== undefined) {
        args['?'] = options.placeholder;
    }

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

            // Replace placeholders
            s = s.replace(/(^|[^\\])#\?/g, '$1\\placeholder{}');

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
            if (/^\$\$(.*)\$\$$/.test(s)) {
                s = s.substring(2, s.length - 2);
            }
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
        Array.prototype.splice.apply(
            model.siblings(),
            [model.anchorOffset() + 1, 0].concat(mathlist)
        );
    }

    // If needed, make sure there's a first atom in the siblings list
    model.insertFirstAtom();

    // Prepare to dispatch notifications
    // (for selection changes, then content change)
    model.suppressChangeNotifications = contentWasChanging;

    // Update the anchor's location
    if (options.selectionMode === 'placeholder') {
        // Move to the next placeholder
        let newPlaceholders = [];
        for (const atom of mathlist) {
            newPlaceholders = newPlaceholders.concat(
                atom.filter((atom) => atom.type === 'placeholder')
            );
        }
        if (newPlaceholders.length === 0 || !leap(model, +1, false)) {
            // No placeholder found, move to right after what we just inserted
            setSelection(model, model.anchorOffset() + mathlist.length);
            // model.path[model.path.length - 1].offset += mathlist.length;
        } else {
            model.announce('move'); // should have placeholder selected
        }
    } else if (options.selectionMode === 'before') {
        // Do nothing: don't change the anchorOffset.
    } else if (options.selectionMode === 'after') {
        setSelection(model, model.anchorOffset() + mathlist.length);
    } else if (options.selectionMode === 'item') {
        setSelection(model, model.anchorOffset(), mathlist.length);
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
