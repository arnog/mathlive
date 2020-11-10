import { InsertOptions, Offset } from '../public/mathfield';

import { COMMAND_MODE_CHARACTERS, parseString } from '../core/core';
import { Atom, BranchName, NAMED_BRANCHES } from '../core/atom-class';
import { ArrayAtom } from '../core-atoms/array';

import { parseMathString } from '../editor/parse-math-string';

import { ModelPrivate } from './model-private';
import { applyStyleToUnstyledAtoms } from './styling';
import { contentDidChange, selectionDidChange } from './listeners';

import { getMode, move } from './selection';

import type { Style } from '../public/core';
import { LeftRightAtom } from '../core-atoms/leftright';
import { CommandAtom } from '../core-atoms/command';
import { CompositionAtom } from '../core-atoms/composition';
import { RIGHT_DELIM } from '../core/delimiters';
import { range } from './selection-utils';

function convertStringToAtoms(
    model: ModelPrivate,
    s: string,
    args: string[],
    options: InsertOptions
): Atom[] {
    const mode = options.mode ?? getMode(model, model.position);

    let result = [];
    if (mode === 'math' && options.format === 'ASCIIMath') {
        [, s] = parseMathString(s, { format: 'ASCIIMath' });
        result = parseString(
            s,
            'math',
            null,
            options?.macros,
            false,
            model.listeners.onError
        );

        // Simplify result.
        if (model.options.removeExtraneousParentheses) {
            simplifyParen(result);
        }
    } else if (
        mode !== 'text' &&
        (options.format === 'auto' || options.format === 'latex')
    ) {
        if (mode === 'command') {
            // Short-circuit the tokenizer and parser if in command mode
            result = [];
            for (const c of s) {
                if (COMMAND_MODE_CHARACTERS.test(c)) {
                    result.push(new CommandAtom(c));
                }
            }
        } else if (mode === 'math') {
            if (options.format === 'auto') {
                [options.format, s] = parseMathString(s);
            }

            // If the whole string is bracketed by a mode shift command, remove it
            if (/^\$\$(.*)\$\$$/.test(s)) {
                s = s.substring(2, s.length - 2);
            }

            result = parseString(
                s,
                mode,
                args,
                options.macros,
                options.smartFence ?? false,
                model.listeners.onError
            );

            // Simplify result.
            if (
                options.format !== 'latex' &&
                model.options.removeExtraneousParentheses
            ) {
                simplifyParen(result);
            }
        }
    } else if (mode === 'text') {
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

        result = parseString(
            s,
            'text',
            args,
            options.macros,
            false,
            model.listeners.onError
        );
    }

    // Some atoms may already have a style (for example if there was an
    // argument, i.e. the selection, that this was applied to).
    // So, don't apply style to atoms that are already styled, but *do*
    // apply it to newly created atoms that have no style yet.
    applyStyleToUnstyledAtoms(result, options.style);

    return result;
}

export function insert(
    model: ModelPrivate,
    s: string,
    options: InsertOptions
): boolean {
    if (!options.insertionMode) options.insertionMode = 'replaceSelection';
    if (!options.selectionMode) options.selectionMode = 'placeholder';
    if (!options.format) options.format = 'auto';
    options.macros = options.macros ?? model.options.macros;

    //
    // Try to insert a smart fence.
    //
    if (!(options.smartFence ?? false)) {
        // When smartFence is turned off, only do a "smart" fence insert
        // if we're inside a `leftright`, at the last char
        const parent = model.at(model.position).parent;
        if (
            parent instanceof LeftRightAtom &&
            parent.rightDelim === '?' &&
            model.at(model.position).isLastSibling &&
            /^[)}\]|]$/.test(s)
        ) {
            parent.rightDelim = s;
            model.position += 1;
            selectionDidChange(model);
            contentDidChange(model);
            return true;
        }
    } else if (
        model.selectionIsCollapsed &&
        insertSmartFence(model, s, options.style)
    ) {
        return true;
    }

    const suppressChangeNotifications = model.suppressChangeNotifications;
    if (options.suppressChangeNotifications) {
        model.suppressChangeNotifications = true;
    }
    const contentWasChanging = model.suppressChangeNotifications;
    model.suppressChangeNotifications = true;

    //
    // Save the content of the selection, if any
    //
    const args: string[] = [];
    args[0] = model.getValue(model.selection);
    args['?'] = options.placeholder ?? '\\placeholder{}';
    args['@'] = args['?'];

    //
    // Delete any selected items
    //
    if (
        options.insertionMode === 'replaceSelection' &&
        !model.selectionIsCollapsed
    ) {
        model.deleteAtoms(range(model.selection));
    } else if (options.insertionMode === 'replaceAll') {
        model.root.setChildren([], 'body');
        model.position = 0;
    } else if (options.insertionMode === 'insertBefore') {
        model.collapseSelection('backward');
    } else if (options.insertionMode === 'insertAfter') {
        model.collapseSelection('forward');
    }

    //
    // Delete any placeholders before or after the insertion point
    //
    if (
        !model.at(model.position).isLastSibling &&
        model.at(model.position + 1).type === 'placeholder'
    ) {
        // Before a `placeholder`
        model.deleteAtoms([model.position, model.position + 1]);
    } else if (model.at(model.position).type === 'placeholder') {
        // After a `placeholder`
        model.deleteAtoms([model.position - 1, model.position]);
    }

    //
    // Calculate the implicit argument (#@)
    //
    const mode = options.mode ?? getMode(model, model.position);
    if (mode === 'math') {
        if (args[0]) {
            // There was a selection, we'll use it for #@
            args['@'] = args[0];
        } else if (/(^|[^\\])#@/.test(s)) {
            // We'll use the preceding `mord`s or text mode atoms for it (implicit argument)
            const offset = getImplicitArgOffset(model);
            if (offset >= 0) {
                args['@'] = model.getValue(offset, model.position);
                model.deleteAtoms([offset, model.position]);
            }
        }
        if (!args[0]) args[0] = args['?'];
    }

    const newAtoms = convertStringToAtoms(model, s, args, options);
    if (!newAtoms) return false;

    //
    // Insert the new atoms
    //
    const parent = model.at(model.position).parent;
    // Are we inserting a fraction inside a lefright?
    if (
        options.format !== 'latex' &&
        model.options.removeExtraneousParentheses &&
        parent instanceof LeftRightAtom &&
        parent.leftDelim === '(' &&
        parent.hasEmptyBranch('body') &&
        newAtoms.length === 1 &&
        newAtoms[0].type === 'genfrac'
    ) {
        // Remove the leftright
        // i.e. `\left(\frac{}{}\right))` -> `\frac{}{}`
        const newParent = parent.parent;
        const branch = parent.treeBranch;
        newParent.removeChild(parent);
        newParent.setChildren(newAtoms, branch);
    } else {
        if (options.format === 'latex' && args.length === 1 && !args[0]) {
            // If we are given a latex string with no arguments, store it verbatim
            // Caution: we can only do this if the toLatex() for this parent
            // would return an empty string. If the latex is generated using other
            // properties than parent.body, for example by adding '\left.' and
            // '\right.' with a 'leftright' type, we can't use this shortcut.
            if (parent.type === 'root' && parent.hasEmptyBranch('body')) {
                parent.latex = s;
            }
        }
        const cursor = model.at(model.position);
        cursor.parent.addChildrenAfter(newAtoms, cursor);
    }

    // Prepare to dispatch notifications
    // (for selection changes, then content change)
    model.suppressChangeNotifications = contentWasChanging;

    const lastNewAtom = newAtoms[newAtoms.length - 1];
    // Update the anchor's location
    if (options.selectionMode === 'placeholder') {
        // Move to the next placeholder
        const newPlaceholders = newAtoms.reduce(
            (acc, atom) => [
                ...acc,
                ...atom.children.filter((x) => x.type === 'placeholder'),
            ],
            []
        );

        if (newPlaceholders.length > 0) {
            const placeholderOffset = model.offsetOf(newPlaceholders[0]);
            model.setSelection(placeholderOffset - 1, placeholderOffset);
            model.announce('move'); // should have placeholder selected
        } else if (lastNewAtom) {
            // No placeholder found, move to right after what we just inserted
            model.position = model.offsetOf(lastNewAtom);
        }
    } else if (options.selectionMode === 'before') {
        // Do nothing: don't change the anchorOffset.
    } else if (options.selectionMode === 'after') {
        if (lastNewAtom) {
            model.position = model.offsetOf(lastNewAtom);
        }
    } else if (options.selectionMode === 'item') {
        model.setSelection(model.anchor, model.offsetOf(lastNewAtom));
    }

    contentDidChange(model);

    model.suppressChangeNotifications = suppressChangeNotifications;

    return true;
}

/**
 * Create, remove or update a composition atom at the current location
 */
export function updateComposition(model: ModelPrivate, s: string): void {
    const cursor = model.at(model.position);

    // We're creating or updating a composition
    if (cursor.type === 'composition') {
        // Composition already in progress, update it
        cursor.value = s;
    } else {
        // No composition yet, create one

        // Remove previous caret
        const caret = cursor.caret;
        cursor.caret = '';

        // Create 'composition' atom, with caret
        const atom = new CompositionAtom(s, { mode: cursor.mode });
        atom.caret = caret;
        cursor.parent.addChildAfter(atom, cursor);

        //Move cursor one past the composition zone
        model.position += 1;
    }
}

/**
 * Remove the composition zone
 */
export function removeComposition(model: ModelPrivate): void {
    const cursor = model.at(model.position);
    if (cursor.type === 'composition') {
        cursor.parent.removeChild(cursor);
        model.position -= 1;
    }
}

function removeParen(atoms: Atom[]): Atom[] | null {
    if (!atoms) return null;

    console.assert(atoms[0].type === 'first');
    if (atoms.length > 1) return null;

    const atom = atoms[0];
    if (
        atom instanceof LeftRightAtom &&
        atom.leftDelim === '(' &&
        atom.rightDelim === ')'
    ) {
        return atom.removeBranch('body');
    }
    return null;
}

/**
 * If it's a fraction with a parenthesized numerator or denominator
 * remove the parentheses
 * @revisit: don't need model, only need to know if removeExtraneousParentheses
 *              Check at callsites.
 */
function simplifyParen(atoms: Atom[]): void {
    if (!atoms) return;
    for (let i = 0; atoms[i]; i++) {
        const atom = atoms[i];
        if (atom instanceof LeftRightAtom && atom.leftDelim === '(') {
            let genFracCount = 0;
            let genFracIndex = 0;
            let nonGenFracCount = 0;
            for (let j = 0; atom.body[j]; j++) {
                if (atom.body[j].type === 'genfrac') {
                    genFracCount++;
                    genFracIndex = j;
                }
                nonGenFracCount++;
            }
            if (nonGenFracCount === 0 && genFracCount === 1) {
                // This is a single frac inside a leftright: remove the leftright
                atoms[i] = atom.body[genFracIndex];
            }
        }
    }

    atoms.forEach((atom) => {
        NAMED_BRANCHES.forEach((branch: BranchName) => {
            if (!atom.hasEmptyBranch(branch)) {
                simplifyParen(atom.branch(branch));
                const newChildren = removeParen(atom.branch(branch));
                if (newChildren) atom.setChildren(newChildren, branch);
            }
        });

        if (atom instanceof ArrayAtom) {
            atom.cells.forEach((x) => simplifyParen(x));
        }
    });
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
    console.assert(model.selectionIsCollapsed);
    const atom = model.at(model.position);
    const parent = atom.parent;
    let delims =
        parent instanceof LeftRightAtom
            ? parent.leftDelim + parent.rightDelim
            : '';
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
    if (
        rDelim &&
        !(parent instanceof LeftRightAtom && parent.leftDelim === '|')
    ) {
        // We have a valid open fence as input
        let s = '';

        if (atom.isFunction) {
            // We're before a function (e.g. `\sin`, or 'f'):  this is an
            // argument list.
            // Use `\mleft...\mright'.
            s = '\\mleft' + fence + '\\mright' + rDelim;
        } else {
            s = '\\left' + fence + '\\right?';
        }

        const lastSiblingOffset = model.offsetOf(atom.lastSibling);
        const content = model.extractAtoms([model.position, lastSiblingOffset]);
        insert(model, s, { mode: 'math', format: 'latex', style: style });
        // Move everything that was after the anchor into the leftright
        model.at(model.position).body = content;
        model.position -= 1;
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
        // We found a matching open fence, so it was a valid close fence.
        // Note that `lDelim` may not match `fence`. That's OK.

        // If we're the last atom inside a 'leftright',
        // update the parent
        if (parent instanceof LeftRightAtom && atom.isLastSibling) {
            parent.rightDelim = fence;
            model.position += 1;
            contentDidChange(model);
            return true;
        }
        // If we have a `leftright` sibling to our left
        // with an indeterminate right fence,
        // move what's between us and the `leftright` inside the `leftright`
        const firstSibling = model.offsetOf(atom.firstSibling);
        let i: number;
        for (i = model.position; i >= firstSibling; i--) {
            const atom = model.at(i);
            if (atom instanceof LeftRightAtom && atom.rightDelim === '?') {
                break;
            }
        }
        const match = model.at(i);
        if (i >= firstSibling && match instanceof LeftRightAtom) {
            match.rightDelim = fence;
            match.addChildren(
                model.extractAtoms([i, model.position]),
                atom.treeBranch
            );
            contentDidChange(model);
            return true;
        }

        // If we're inside a `leftright`, but not the last atom,
        // and the `leftright` right delim is indeterminate
        // adjust the body (put everything after the insertion point outside)
        if (parent instanceof LeftRightAtom && parent.rightDelim === '?') {
            parent.rightDelim = fence;

            parent.parent.addChildren(
                model.extractAtoms([
                    model.position,
                    model.offsetOf(atom.lastSibling),
                ]),
                parent.treeBranch
            );
            model.position = model.offsetOf(parent);
            contentDidChange(model);

            return true;
        }

        // Is our grand-parent a 'leftright'?
        // If `\left(\frac{1}{x|}\right?` with the cursor at `|`
        // go up to the 'leftright' and apply it there instead
        const grandparent = parent.parent;
        if (
            grandparent instanceof LeftRightAtom &&
            grandparent.rightDelim === '?' &&
            model.at(model.position).isLastSibling
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

/**
 * Locate the offset before the insertion point that would indicate
 * a good place to select as an implicit argument.
 *
 * For example with '1+\sin(x)', if the insertion point is at the
 * end, the implicit arg offset would be after the plus. As a result,
 * inserting a fraction after the sin would yield: '1+\frac{\sin(c)}{\placeholder{}}'
 */
function getImplicitArgOffset(model: ModelPrivate): Offset {
    let atom = model.at(model.position);
    if (atom.mode === 'text') {
        while (!atom.isFirstSibling && atom.mode === 'text') {
            atom = atom.leftSibling;
        }
        return model.offsetOf(atom);
    }
    if (!isImplicitArg(atom)) {
        return -1;
    }
    // Find the first 'mrel', etc... to the left of the insertion point
    // until the first sibling
    while (!atom.isFirstSibling && isImplicitArg(atom)) {
        atom = atom.leftSibling;
    }

    return model.offsetOf(atom);
}

/**
 *
 * Predicate returns true if the atom should be considered an implicit argument.
 *
 * Used for example when typing "/" to insert a fraction: all the atoms to
 * the left of insertion point that return true for `isImplicitArg()` will
 * be included as the numerator
 */
function isImplicitArg(atom: Atom): boolean {
    if (/^(mord|surd|msubsup|leftright|mop)$/.test(atom.type)) {
        // Exclude `\int`, \`sum`, etc...
        if (atom.isExtensibleSymbol) return false;
        return true;
    }
    return false;
}
