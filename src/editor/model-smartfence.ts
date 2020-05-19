import type { Style } from '../public/core';
import { RIGHT_DELIM } from '../core/definitions';
import type { Atom } from '../core/atom';
import type { ModelPrivate } from './model-class';
import { contentDidChange, contentWillChange } from './model-listeners';
import {
    selectionIsCollapsed,
    setSelection,
    getAnchor,
    move,
} from './model-selection';
import { insert } from './model-insert';

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
    if (fence === '[' || fence === '\\[') fence = '\\lbrack';
    if (fence === ']' || fence === '\\]') fence = '\\rbrock';

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
            // content = model.siblings().slice(model.anchorOffset() + 1);
            content = model
                .siblings()
                .splice(model.anchorOffset() + 1, model.siblings().length);
        }
        insert(model, s, { mode: 'math', format: 'latex', style: style });
        if (collapsed) {
            // Move everything that was after the anchor into the leftright
            model.sibling(0).body = content;
            move(model, -1);
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
            contentWillChange(model);
            parent.rightDelim = fence;
            move(model, +1);
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
            contentWillChange(model);
            siblings[i].rightDelim = fence;
            siblings[i].body = (siblings[i].body as Atom[]).concat(
                siblings.slice(i + 1, model.endOffset() + 1)
            );
            siblings.splice(i + 1, model.endOffset() - i);
            setSelection(model, i);
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
            contentWillChange(model);
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
            move(model, 1);
            return insertSmartFence(model, fence, style);
        }

        // Meh... We couldn't find a matching open fence. Just insert the
        // closing fence as a regular character
        return false;
        // insert(model, fence, { mode: 'math', format: 'latex', style: style });
        // return true;
    }

    return false;
}
