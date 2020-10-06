import { isArray } from '../common/types';

import type { ParseMode } from '../public/core';

import { LETTER_AND_DIGITS } from '../core/definitions';
import { Atom } from '../core/atom';
import {
    Selection,
    Path,
    pathDistance,
    clone as clonePath,
    pathCommonAncestor,
    pathFromString,
} from './path';

import { ModelPrivate } from './model-class'; // @revisit. Circular dependency because
// we need to create a model to make an iterator (we could use model-utils forward
// declaration otherwise
import { isEmptyMathlist, removeSuggestion } from './model-utils';
import {
    arrayCellCount,
    arrayCell,
    arrayIndex,
    arrayColRow,
    arrayAdjustRow,
} from './model-array-utils';
import { selectionDidChange, selectionWillChange } from './model-listeners';

/**
 * Return true if the atom could be a part of a number
 * i.e. "-12354.568"
 */
function isNumber(atom: Atom): boolean {
    if (!atom) return false;
    return (
        (atom.type === 'mord' && /[0-9.]/.test(atom.body as string)) ||
        (atom.type === 'mpunct' && atom.body === ',')
    );
}

/**
 * Return a `{start:, end:}` for the offsets of the command around the insertion
 * point, or null.
 * - `start` is the first atom which is of type `command`
 * - `end` is after the last atom of type `command`
 */
export function getCommandOffsets(
    model: ModelPrivate
): { start: number; end: number } {
    const siblings = model.siblings();
    if (siblings.length <= 1) return null;

    let start = Math.min(model.endOffset(), siblings.length - 1);
    // let start = Math.max(0, model.endOffset());
    if (siblings[start].type !== 'command') return null;
    while (start > 0 && siblings[start].type === 'command') start -= 1;

    let end = model.startOffset() + 1;
    while (end <= siblings.length - 1 && siblings[end].type === 'command') {
        end += 1;
    }
    if (end > start) {
        return { start: start + 1, end: end };
    }
    return null;
}

export function positionInsertionPointAfterCommitedCommand(
    model: ModelPrivate
): void {
    const siblings = model.siblings();
    const command = getCommandOffsets(model);
    let i = command.start;
    while (i < command.end && !siblings[i].isSuggestion) {
        i++;
    }
    setSelection(model, i - 1);
}

export function getAnchorMode(model: ModelPrivate): ParseMode {
    const anchor = selectionIsCollapsed(model)
        ? getAnchor(model)
        : model.sibling(1);
    let result: ParseMode;
    if (anchor) {
        if (anchor.type === 'command') {
            return 'command';
        }
        result = anchor.mode as ParseMode;
    }
    let i = 1;
    let ancestor = model.ancestor(i);
    while (!result && ancestor) {
        if (ancestor) result = ancestor.mode as ParseMode;
        i += 1;
        ancestor = model.ancestor(i);
    }
    return result;
}

// @revisit any
export function getAnchorStyle(model: ModelPrivate): any {
    const anchor = selectionIsCollapsed(model)
        ? getAnchor(model)
        : model.sibling(1);
    let result;
    if (anchor && anchor.type !== 'first') {
        if (anchor.type === 'command') {
            return {};
        }
        result = {
            color: anchor.color,
            backgroundColor: anchor.backgroundColor,
            fontFamily: anchor.fontFamily,
            fontShape: anchor.fontShape,
            fontSeries: anchor.fontSeries,
            fontSize: anchor.fontSize,
        };
    }
    let i = 1;
    let ancestor = model.ancestor(i);
    while (!result && ancestor) {
        if (ancestor) {
            result = {
                color: ancestor.color,
                backgroundColor: ancestor.backgroundColor,
                fontFamily: ancestor.fontFamily,
                fontShape: ancestor.fontShape,
                fontSeries: ancestor.fontSeries,
                fontSize: ancestor.fontSize,
            };
        }
        i += 1;
        ancestor = model.ancestor(i);
    }
    return result;
}

/**
 * Move to the next/previous placeholder or empty child list.
 * @return False if no placeholder found and did not move
 */
export function leap(
    model: ModelPrivate,
    dir: -1 | 1 = 1,
    callHooks = true
): boolean {
    const savedSuppressChangeNotifications = model.suppressChangeNotifications;
    model.suppressChangeNotifications = true;
    const oldPath = model.clone();
    const oldExtent = model.extent;
    move(model, dir);

    if (getAnchor(model).type === 'placeholder') {
        // If we're already at a placeholder, move by one more (the placeholder
        // is right after the insertion point)
        move(model, dir);
    }
    // Candidate placeholders are atom of type 'placeholder'
    // or empty children list (except for the root: if the root is empty,
    // it is not a valid placeholder)
    const placeholders = filter(
        model,
        (path, atom) =>
            atom.type === 'placeholder' ||
            (path.length > 1 && model.siblings().length === 1),
        dir
    );

    // If no placeholders were found, call handler or move to the next focusable
    // element in the document
    if (placeholders.length === 0) {
        // Restore the selection
        setPath(model, oldPath, oldExtent);
        if (callHooks) {
            if (
                model.hooks?.tabOut &&
                model.hooks.tabOut(model, dir > 0 ? 'forward' : 'backward') &&
                document.activeElement
            ) {
                const tabbable = getTabbableElements();
                let index =
                    tabbable.indexOf(document.activeElement as HTMLElement) +
                    dir;
                if (index < 0) index = tabbable.length - 1;
                if (index >= tabbable.length) index = 0;
                tabbable[index].focus();
            }
        }
        model.suppressChangeNotifications = savedSuppressChangeNotifications;
        return false;
    }

    // Set the selection to the next placeholder
    selectionWillChange(model);
    setPath(model, placeholders[0]);
    if (getAnchor(model).type === 'placeholder') setSelectionExtent(model, -1);
    model.announce('move', oldPath);
    selectionDidChange(model);
    model.suppressChangeNotifications = savedSuppressChangeNotifications;
    return true;
}

/**
 * Return an array of tabbable elements, approximately in the order a browser
 * would (the browsers are inconsistent), which is first by accounting
 * for non-null tabIndex, then null tabIndex, then document order of focusable
 * elements.
 */
function getTabbableElements(): HTMLElement[] {
    // const focussableElements = `a[href]:not([disabled]),
    // button:not([disabled]),
    // textarea:not([disabled]),
    // input[type=text]:not([disabled]),
    // select:not([disabled]),
    // [contentEditable="true"],
    // [tabindex]:not([disabled]):not([tabindex="-1"])`;
    // // Get all the potentially focusable elements
    // // and exclude (1) those that are invisible (width and height = 0)
    // // (2) not the active element
    // // (3) the ancestor of the active element

    // return Array.prototype.filter.call(
    //     document.querySelectorAll(focussableElements),
    //     (element) =>
    //         ((element.offsetWidth > 0 || element.offsetHeight > 0) &&
    //             !element.contains(document.activeElement)) ||
    //         element === document.activeElement
    // );

    function tabbable(el: HTMLElement) {
        const regularTabbables = [];
        const orderedTabbables = [];

        const candidates = Array.from(
            el.querySelectorAll<
                HTMLElement
            >(`input, select, textarea, a[href], button, 
        [tabindex], audio[controls], video[controls],
        [contenteditable]:not([contenteditable="false"]), details>summary`)
        ).filter(isNodeMatchingSelectorTabbable);

        candidates.forEach((candidate, i) => {
            const candidateTabindex = getTabindex(candidate);
            if (candidateTabindex === 0) {
                regularTabbables.push(candidate);
            } else {
                orderedTabbables.push({
                    documentOrder: i,
                    tabIndex: candidateTabindex,
                    node: candidate,
                });
            }
        });

        return orderedTabbables
            .sort((a, b) =>
                a.tabIndex === b.tabIndex
                    ? a.documentOrder - b.documentOrder
                    : a.tabIndex - b.tabIndex
            )
            .map((a) => a.node)
            .concat(regularTabbables);
    }

    function isNodeMatchingSelectorTabbable(el: HTMLElement): boolean {
        if (
            !isNodeMatchingSelectorFocusable(el) ||
            isNonTabbableRadio(el) ||
            getTabindex(el) < 0
        ) {
            return false;
        }
        return true;
    }

    function isNodeMatchingSelectorFocusable(node) {
        if (
            node.disabled ||
            (node.tagName === 'INPUT' && node.type === 'hidden') ||
            isHidden(node)
        ) {
            return false;
        }
        return true;
    }

    function getTabindex(node: HTMLElement): number {
        const tabindexAttr = parseInt(node.getAttribute('tabindex'), 10);

        if (!isNaN(tabindexAttr)) {
            return tabindexAttr;
        }

        // Browsers do not return `tabIndex` correctly for contentEditable nodes;
        // so if they don't have a tabindex attribute specifically set, assume it's 0.
        if (node.contentEditable === 'true') {
            return 0;
        }

        // in Chrome, <audio controls/> and <video controls/> elements get a default
        //  `tabIndex` of -1 when the 'tabindex' attribute isn't specified in the DOM,
        //  yet they are still part of the regular tab order; in FF, they get a default
        //  `tabIndex` of 0; since Chrome still puts those elements in the regular tab
        //  order, consider their tab index to be 0
        if (
            (node.nodeName === 'AUDIO' || node.nodeName === 'VIDEO') &&
            node.getAttribute('tabindex') === null
        ) {
            return 0;
        }

        return node.tabIndex;
    }

    function isNonTabbableRadio(node: HTMLElement): boolean {
        return (
            node.tagName === 'INPUT' &&
            (node as HTMLInputElement).type === 'radio' &&
            !isTabbableRadio(node as HTMLInputElement)
        );
    }

    function getCheckedRadio(nodes, form) {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].checked && nodes[i].form === form) {
                return nodes[i];
            }
        }
        return null;
    }

    function isTabbableRadio(node: HTMLInputElement): boolean {
        if (!node.name) {
            return true;
        }
        const radioScope = node.form || node.ownerDocument;
        const radioSet = radioScope.querySelectorAll(
            'input[type="radio"][name="' + node.name + '"]'
        );
        const checked = getCheckedRadio(radioSet, node.form);
        return !checked || checked === node;
    }

    function isHidden(el: HTMLElement) {
        if (
            el === document.activeElement ||
            el.contains(document.activeElement)
        ) {
            return false;
        }

        if (getComputedStyle(el).visibility === 'hidden') return true;

        // Note that browsers generally don't consider the bounding rect
        // as a criteria to determine if an item is focusable, but we want
        // to exclude the invisible textareas used to capture keyoard input.
        const bounds = el.getBoundingClientRect();
        if (bounds.width === 0 || bounds.height === 0) return true;

        while (el) {
            if (getComputedStyle(el).display === 'none') return true;
            el = el.parentElement;
        }

        return false;
    }
    return tabbable(document.body);
}

/**
 * @param offset
 * - &gt;0: index of the child in the group where the selection will start from
 * - <0: index counting from the end of the group
 * @param extent Number of items in the selection:
 * - 0: collapsed selection, single insertion point
 * - &gt;0: selection extending _after_ the offset
 * - <0: selection extending _before_ the offset
 * - `'end'`: selection extending to the end of the group
 * - `'start'`: selection extending to the beginning of the group
 * @param relation e.g. `'body'`, `'superscript'`, etc...
 * @return False if the relation is invalid (no such children)
 */
export function setSelection(
    model: ModelPrivate,
    offset = 0,
    extent: number | 'end' | 'start' = 0,
    relation = ''
): boolean {
    // If no relation ("children", "superscript", etc...) is specified
    // keep the current relation
    const oldRelation = model.path[model.path.length - 1].relation;
    if (!relation) relation = oldRelation;

    // If the relation is invalid, exit and return false
    const parent = model.parent();
    if (!parent && relation !== 'body') return false;
    const arrayRelation = relation.startsWith('cell');
    if (
        (!arrayRelation && !parent[relation]) ||
        (arrayRelation && !parent.array)
    ) {
        return false;
    }

    const relationChanged = relation !== oldRelation;
    // Temporarily set the path to the potentially new relation to get the
    // right siblings
    model.path[model.path.length - 1].relation = relation;

    // Invoking siblings() will have the side-effect of adding the 'first'
    // atom if necessary
    // ... and we want the siblings with the potentially new relation...
    const siblings = model.siblings();
    const siblingsCount = siblings.length;

    // Restore the relation
    model.path[model.path.length - 1].relation = oldRelation;

    const oldExtent = model.extent;
    if (extent === 'end') {
        extent = siblingsCount - offset - 1;
    } else if (extent === 'start') {
        extent = -offset;
    }
    setSelectionExtent(model, extent);
    const extentChanged = model.extent !== oldExtent;
    setSelectionExtent(model, oldExtent);

    // Calculate the new offset, and make sure it is in range
    // (setSelection can be called with an offset that greater than
    // the number of children, for example when doing an up from a
    // numerator to a smaller denominator, e.g. "1/(x+1)".
    if (offset < 0) {
        offset = siblingsCount + offset;
    }
    offset = Math.max(0, Math.min(offset, siblingsCount - 1));

    const oldOffset = model.path[model.path.length - 1].offset;
    const offsetChanged = oldOffset !== offset;

    if (relationChanged || offsetChanged || extentChanged) {
        if (relationChanged) {
            adjustPlaceholder(model);
        }
        selectionWillChange(model);

        model.path[model.path.length - 1].relation = relation;
        model.path[model.path.length - 1].offset = offset;
        setSelectionExtent(model, extent);

        selectionDidChange(model);
    }

    return true;
}

/**
 * Move the anchor to the next permissible atom
 */
export function next(
    model: ModelPrivate,
    options?: { iterateAll?: boolean }
): void {
    options = options ?? {};

    const NEXT_RELATION = {
        body: 'numer',
        numer: 'denom',
        denom: 'index',
        index: 'overscript',
        overscript: 'underscript',
        underscript: 'subscript',
        subscript: 'superscript',
    };

    if (model.anchorOffset() === model.siblings().length - 1) {
        adjustPlaceholder(model);

        // We've reached the end of this list.
        // Is there another list to consider?
        let relation = NEXT_RELATION[model.relation()];
        const parent = model.parent();
        while (relation && !parent[relation]) {
            relation = NEXT_RELATION[relation];
        }

        // We found a new relation/set of siblings...
        if (relation) {
            setSelection(model, 0, 0, relation);
            return;
        }

        // No more siblings, check if we have a sibling cell in an array
        if (model.parent().array) {
            const maxCellCount = arrayCellCount(model.parent().array);
            let cellIndex =
                parseInt(model.relation().match(/cell([0-9]*)$/)[1]) + 1;
            while (cellIndex < maxCellCount) {
                const cell = arrayCell(model.parent().array, cellIndex);
                // Some cells could be null (sparse array), so skip them
                if (cell && setSelection(model, 0, 0, 'cell' + cellIndex)) {
                    selectionDidChange(model);
                    return;
                }
                cellIndex += 1;
            }
        }

        // No more siblings, go up to the parent.
        if (model.path.length === 1) {
            // Invoke handler and perform default if they return true.
            if (
                model.suppressChangeNotifications ||
                !model.hooks?.moveOut ||
                model.hooks.moveOut(model, 'forward')
            ) {
                // We're at the root, so loop back
                model.path[0].offset = 0;
            }
        } else {
            // We've reached the end of the siblings. If we're a group
            // with skipBoundary, when exiting, move one past the next atom
            const skip = !options.iterateAll && model.parent().skipBoundary;
            model.path.pop();
            if (skip) {
                next(model, options);
            }
        }

        selectionDidChange(model);
        return;
    }

    // Still some siblings to go through. Move on to the next one.
    setSelection(model, model.anchorOffset() + 1);
    const anchor = getAnchor(model);

    // Dive into its components, if the new anchor is a compound atom,
    // and allows capture of the selection by its sub-elements
    if (anchor && !anchor.captureSelection) {
        let relation;
        if (anchor.array) {
            // Find the first non-empty cell in this array
            let cellIndex = 0;
            relation = '';
            const maxCellCount = arrayCellCount(anchor.array);
            while (!relation && cellIndex < maxCellCount) {
                // Some cells could be null (sparse array), so skip them
                if (arrayCell(anchor.array, cellIndex)) {
                    relation = 'cell' + cellIndex.toString();
                }
                cellIndex += 1;
            }
            console.assert(relation);
            model.path.push({ relation: relation, offset: 0 });
            setSelection(model, 0, 0, relation);
            return;
        }
        relation = 'body';
        while (relation) {
            if (isArray(anchor[relation])) {
                model.path.push({ relation: relation, offset: 0 });
                model.insertFirstAtom();
                if (!options.iterateAll && anchor.skipBoundary) {
                    next(model, options);
                }
                return;
            }
            relation = NEXT_RELATION[relation];
        }
    }
}

export function previous(
    model: ModelPrivate,
    options?: { iterateAll?: boolean }
): void {
    options = options ?? {};

    const PREVIOUS_RELATION = {
        numer: 'body',
        denom: 'numer',
        index: 'denom',
        overscript: 'index',
        underscript: 'overscript',
        subscript: 'underscript',
        superscript: 'subscript',
    };
    if (
        !options.iterateAll &&
        model.anchorOffset() === 1 &&
        model.parent() &&
        model.parent().skipBoundary
    ) {
        setSelection(model, 0);
    }
    if (model.anchorOffset() < 1) {
        // We've reached the first of these siblings.
        // Is there another set of siblings to consider?
        let relation = PREVIOUS_RELATION[model.relation()];
        while (relation && !setSelection(model, -1, 0, relation)) {
            relation = PREVIOUS_RELATION[relation];
        }
        // Ignore the body of the subsup scaffolding and of
        // 'mop' atoms (for example, \sum): their body is not editable.
        const parentType = model.parent() ? model.parent().type : 'none';
        if (
            relation === 'body' &&
            (parentType === 'msubsup' || parentType === 'mop')
        ) {
            relation = null;
        }
        // We found a new relation/set of siblings...
        if (relation) return;

        adjustPlaceholder(model);

        selectionWillChange(model);

        // No more siblings, check if we have a sibling cell in an array
        if (model.relation().startsWith('cell')) {
            let cellIndex =
                parseInt(model.relation().match(/cell([0-9]*)$/)[1]) - 1;
            while (cellIndex >= 0) {
                const cell = arrayCell(model.parent().array, cellIndex);
                if (cell && setSelection(model, -1, 0, 'cell' + cellIndex)) {
                    selectionDidChange(model);
                    return;
                }
                cellIndex -= 1;
            }
        }

        // No more siblings, go up to the parent.
        if (model.path.length === 1) {
            // Invoke handler and perform default if they return true.
            if (
                model.suppressChangeNotifications ||
                !model.hooks?.moveOut ||
                model.hooks.moveOut(model, 'backward')
            ) {
                // We're at the root, so loop back
                model.path[0].offset = model.root.body.length - 1;
            }
        } else {
            model.path.pop();
            setSelection(model, model.anchorOffset() - 1);
        }

        selectionDidChange(model);
        return;
    }

    // If the new anchor is a compound atom, dive into its components
    const anchor = getAnchor(model);
    // Only dive in if the atom allows capture of the selection by
    // its sub-elements
    if (!anchor.captureSelection) {
        let relation;
        if (anchor.array) {
            relation = '';
            const maxCellCount = arrayCellCount(anchor.array);
            let cellIndex = maxCellCount - 1;
            while (!relation && cellIndex < maxCellCount) {
                // Some cells could be null (sparse array), so skip them
                if (arrayCell(anchor.array, cellIndex)) {
                    relation = 'cell' + cellIndex.toString();
                }
                cellIndex -= 1;
            }
            cellIndex += 1;
            console.assert(relation);
            model.path.push({
                relation: relation,
                offset: arrayCell(anchor.array, cellIndex).length - 1,
            });
            setSelection(model, -1, 0, relation);
            return;
        }
        relation = 'superscript';
        while (relation) {
            if (isArray(anchor[relation])) {
                model.path.push({
                    relation: relation,
                    offset: anchor[relation].length - 1,
                });

                setSelection(model, -1, 0, relation);
                return;
            }
            relation = PREVIOUS_RELATION[relation];
        }
    }
    // There wasn't a component to navigate to, so...
    // Still some siblings to go through: move on to the previous one.
    setSelection(model, model.anchorOffset() - 1);

    if (
        !options.iterateAll &&
        model.sibling(0) &&
        model.sibling(0).skipBoundary
    ) {
        previous(model, options);
    }
}

export function move(
    model: ModelPrivate,
    dist: number,
    options?: { extend: any }
): boolean {
    options = options ?? { extend: false };
    const extend = options.extend ?? false;

    removeSuggestion(model);

    if (extend) {
        extend(model, dist, options);
    } else {
        const oldPath = model.clone();
        // const previousParent = model.parent();
        // const previousRelation = model.relation();
        // const previousSiblings = model.siblings();

        if (dist > 0) {
            if (collapseSelectionForward(model)) dist--;
            while (dist > 0) {
                next(model);
                dist--;
            }
        } else if (dist < 0) {
            if (collapseSelectionBackward(model)) dist++;
            while (dist !== 0) {
                previous(model);
                dist++;
            }
        }

        // ** @todo: can't do that without updating the path.
        // If the siblings list we left was empty, remove the relation
        // if (previousSiblings.length <= 1) {
        //     if (['superscript', 'subscript', 'index'].includes(previousRelation)) {
        //         previousParent[previousRelation] = null;
        //     }
        // }
        model.announce('move', oldPath);
    }
    return true;
}

export function up(
    model: ModelPrivate,
    options?: { extend: boolean }
): boolean {
    options = options ?? { extend: false };
    const extend = options.extend ?? false;

    collapseSelectionBackward(model);
    const relation = model.relation();

    if (relation === 'denom') {
        if (extend) {
            selectionWillChange(model);
            model.path.pop();
            model.path[model.path.length - 1].offset -= 1;
            setSelectionExtent(model, 1);
            selectionDidChange(model);
        } else {
            setSelection(model, model.anchorOffset(), 0, 'numer');
        }
        model.announce('moveUp');
    } else if (model.parent().array) {
        // In an array
        let colRow = arrayColRow(model.parent().array, relation);
        colRow = arrayAdjustRow(model.parent().array, colRow, -1);
        if (colRow && arrayCell(model.parent().array, colRow)) {
            model.path[model.path.length - 1].relation =
                'cell' + arrayIndex(model.parent().array, colRow);
            setSelection(model, model.anchorOffset());

            model.announce('moveUp');
        } else {
            move(model, -1, options);
        }
    } else {
        model.announce('line');
        if (
            !model.suppressChangeNotifications &&
            !model.hooks?.moveOut(model, 'upward')
        ) {
            return false;
        }
    }
    return true;
}

export function down(
    model: ModelPrivate,
    options?: { extend: boolean }
): boolean {
    options = options ?? { extend: false };
    const extend = options.extend ?? false;

    collapseSelectionForward(model);
    const relation = model.relation();
    if (relation === 'numer') {
        if (extend) {
            selectionWillChange(model);
            model.path.pop();
            model.path[model.path.length - 1].offset -= 1;
            setSelectionExtent(model, 1);
            selectionDidChange(model);
        } else {
            setSelection(model, model.anchorOffset(), 0, 'denom');
        }
        model.announce('moveDown');
    } else if (model.parent().array) {
        // In an array
        let colRow = arrayColRow(model.parent().array, relation);
        colRow = arrayAdjustRow(model.parent().array, colRow, +1);
        // @revisit: validate this codepath
        if (colRow && arrayCell(model.parent().array, colRow)) {
            model.path[model.path.length - 1].relation =
                'cell' + arrayIndex(model.parent().array, colRow);
            setSelection(model, model.anchorOffset());

            model.announce('moveDown');
        } else {
            move(model, +1, options);
        }
    } else {
        model.announce('line');
        if (
            !model.suppressChangeNotifications &&
            !model.hooks?.moveOut(model, 'downward')
        ) {
            return false;
        }
    }
    return true;
}

/**
 * Change the range of the selection
 *
 * @param dist - The change (positive or negative) to the extent
 * of the selection. The anchor point does not move.
 */
export function extend(model: ModelPrivate, dist: number): boolean {
    let offset = model.path[model.path.length - 1].offset;
    let extent = 0;
    const oldPath = model.clone();

    extent = model.extent + dist;

    const newFocusOffset = offset + extent;
    if (newFocusOffset < 0 && extent !== 0) {
        // We're trying to extend beyond the first element.
        // Go up to the parent.
        if (model.path.length > 1) {
            selectionWillChange(model);
            model.path.pop();
            // model.path[model.path.length - 1].offset -= 1;
            setSelectionExtent(model, -1);
            selectionDidChange(model);
            model.announce('move', oldPath);
            return true;
        }
        // @todo exit left extend
        // If we're at the very beginning, nothing to do.
        offset = model.path[model.path.length - 1].offset;
        extent = model.extent;
    } else if (newFocusOffset >= model.siblings().length) {
        // We're trying to extend beyond the last element.
        // Go up to the parent
        if (model.path.length > 1) {
            selectionWillChange(model);
            model.path.pop();
            model.path[model.path.length - 1].offset -= 1;
            setSelectionExtent(model, 1);
            selectionDidChange(model);
            model.announce('move', oldPath);
            return true;
        }
        // @todo exit right extend
        if (selectionIsCollapsed(model)) {
            offset -= 1;
        }
        extent -= 1;
    }
    setSelection(model, offset, extent);
    model.announce('move', oldPath);
    return true;
}

/**
 * Move the selection focus to the next/previous point of interest.
 * A point of interest is an atom of a different type (mbin, mord, etc...)
 * than the current focus.
 * If `extend` is true, the selection will be extended. Otherwise, it is
 * collapsed, then moved.
 * @param dir +1 to skip forward, -1 to skip back
 */
export function skip(
    model: ModelPrivate,
    dir: 1 | -1,
    options?: { extend: boolean }
): boolean {
    options = options ?? { extend: false };
    const extend = options.extend ?? false;
    dir = dir < 0 ? -1 : +1;

    const oldPath = model.clone();

    const siblings = model.siblings();
    const focus = model.focusOffset();
    let offset = focus + dir;
    if (extend) offset = Math.min(Math.max(0, offset), siblings.length - 1);
    if (offset < 0 || offset >= siblings.length) {
        // If we've reached the end, just move out of the list
        move(model, dir, options);
        return;
    }
    if (siblings[offset] && siblings[offset].mode === 'text') {
        // We're in a text zone, skip word by word
        offset = wordBoundaryOffset(model, offset, dir);
        if (offset < 0 && !extend) {
            setSelection(model, 0);
            return;
        }
        if (offset > siblings.length) {
            setSelection(model, siblings.length - 1);
            move(model, dir, options);
            return;
        }
    } else {
        const type = siblings[offset] ? siblings[offset].type : '';
        if ((type === 'mopen' && dir > 0) || (type === 'mclose' && dir < 0)) {
            // We're right before (or after) an opening (or closing)
            // fence. Skip to the balanced element (in level, but not necessarily in
            // fence symbol).
            let level = type === 'mopen' ? 1 : -1;
            offset += dir > 0 ? 1 : -1;
            while (offset >= 0 && offset < siblings.length && level !== 0) {
                if (siblings[offset].type === 'mopen') {
                    level += 1;
                } else if (siblings[offset].type === 'mclose') {
                    level -= 1;
                }
                offset += dir;
            }
            if (level !== 0) {
                // We did not find a balanced element. Just move a little.
                offset = focus + dir;
            }
            if (dir > 0) offset = offset - 1;
        } else {
            while (
                siblings[offset] &&
                siblings[offset].mode === 'math' &&
                siblings[offset].type === type
            ) {
                offset += dir;
            }
            offset -= dir > 0 ? 1 : 0;
        }
    }

    if (extend) {
        const anchor = model.anchorOffset();
        setSelection(model, anchor, offset - anchor);
    } else {
        setSelection(model, offset);
    }
    model.announce('move', oldPath);
}

/**
 * Move to the next/previous expression boundary
 */
export function jump(
    model: ModelPrivate,
    dir: number,
    options?: { extend: boolean }
): boolean {
    options = options ?? { extend: false };
    dir = dir < 0 ? -1 : +1;

    const siblings = model.siblings();
    let focus = model.focusOffset();
    if (dir > 0) focus = Math.min(focus + 1, siblings.length - 1);

    const offset = dir < 0 ? 0 : siblings.length - 1;

    if (options.extend ?? false) {
        extend(model, offset - focus);
    } else {
        move(model, offset - focus);
    }
    return true;
}

export function jumpToMathFieldBoundary(
    model: ModelPrivate,
    dir = 1,
    options?: { extend: boolean }
): boolean {
    options = options ?? { extend: false };
    dir = dir < 0 ? -1 : +1;

    const oldPath = model.clone();
    const path = [{ relation: 'body', offset: model.path[0].offset }];
    let extent;

    if (!options.extend ?? false) {
        // Change the anchor to the end/start of the root expression
        path[0].offset = dir < 0 ? 0 : model.root.body.length - 1;
        extent = 0;
    } else {
        // Don't change the anchor, but update the extent
        if (dir < 0) {
            if (path[0].offset > 0) {
                extent = -path[0].offset;
            } else {
                // @todo exit left extend
            }
        } else {
            if (path[0].offset < model.siblings().length - 1) {
                extent = model.siblings().length - 1 - path[0].offset;
            } else {
                // @todo exit right extend
            }
        }
    }

    setPath(model, path, extent);
    model.announce('move', oldPath);
    return true;
}

/**
 * @return The currently selected atoms, or `null` if the
 * selection is collapsed
 */
export function getSelectedAtoms(model: ModelPrivate): Atom[] {
    if (selectionIsCollapsed(model)) return null;
    const result = [];
    const siblings = model.siblings();
    const firstOffset = model.startOffset() + 1;
    const lastOffset = model.endOffset() + 1;
    for (let i = firstOffset; i < lastOffset; i++) {
        if (siblings[i] && siblings[i].type !== 'first') {
            result.push(siblings[i]);
        }
    }

    return result;
}

/**
 * @return True if `atom` is within the selection range
 * @todo: poorly named, since this is specific to the selection, not the math
 * field
 */
// export function contains(model: Model, atom) {
//     if (selectionIsCollapsed(model)) return false;
//     const siblings = model.siblings();
//     const firstOffset = model.startOffset();
//     const lastOffset = model.endOffset();
//     for (let i = firstOffset; i < lastOffset; i++) {
//         if (atomContains(siblings[i], atom)) return true;
//     }
//     return false;
// }

/**
 * Select all the atoms in the current group, that is all the siblings.
 * When the selection is in a numerator, the group is the numerator. When
 * the selection is a superscript or subscript, the group is the supsub.
 * When the selection is in a text zone, the "group" is a word.
 */
export function selectGroup(model: ModelPrivate): boolean {
    const siblings = model.siblings();
    if (getAnchorMode(model) === 'text') {
        let start = model.startOffset();
        let end = model.endOffset();
        //
        while (
            siblings[start] &&
            siblings[start].mode === 'text' &&
            LETTER_AND_DIGITS.test(siblings[start].body as string)
        ) {
            start -= 1;
        }
        while (
            siblings[end] &&
            siblings[end].mode === 'text' &&
            LETTER_AND_DIGITS.test(siblings[end].body as string)
        ) {
            end += 1;
        }
        end -= 1;
        if (start >= end) {
            // No word found. Select a single character
            setSelection(model, model.endOffset() - 1, 1);
            return true;
        }

        setSelection(model, start, end - start);
    } else {
        // In a math zone, select all the sibling nodes
        if (
            model.sibling(0).type === 'mord' &&
            /[0-9,.]/.test(model.sibling(0).body as string)
        ) {
            // In a number, select all the digits
            let start = model.startOffset();
            let end = model.endOffset();
            //
            while (isNumber(siblings[start])) start -= 1;
            while (isNumber(siblings[end])) end += 1;
            end -= 1;
            setSelection(model, start, end - start);
        } else {
            setSelection(model, 0, 'end');
        }
    }
    return true;
}

export function selectAll(model: ModelPrivate): boolean {
    model.path = [{ relation: 'body', offset: 0 }];
    return setSelection(model, 0, 'end');
}

/**
 * @return {boolean} True if the selection is an insertion point.
 */
export function selectionIsCollapsed(model: ModelPrivate): boolean {
    return model.extent === 0;
}

export function setSelectionExtent(
    model: ModelPrivate,
    extent: number
): boolean {
    model.extent = extent;
    return true;
}

export function collapseSelectionForward(model: ModelPrivate): boolean {
    if (model.extent === 0) return false;

    setSelection(model, model.endOffset());
    return true;
}

export function collapseSelectionBackward(model: ModelPrivate): boolean {
    if (model.extent === 0) return false;

    setSelection(model, model.startOffset());
    return true;
}

export function moveAfterParent(model: ModelPrivate): boolean {
    if (model.path.length > 1) {
        const oldPath = model.clone();
        model.path.pop();
        setSelectionExtent(model, 0);
        model.announce('move', oldPath);
        return true;
    }
    model.announce('plonk');
    return false;
}

/**
 * The atom where the selection starts.
 *
 * When the selection is extended the anchor remains fixed. The anchor
 * could be either before or after the focus.
 */
export function getAnchor(model: ModelPrivate): Atom {
    if (model.parent().array) {
        return arrayCell(model.parent().array, model.relation())[
            model.anchorOffset()
        ];
    }
    const siblings = model.siblings();
    return siblings[Math.min(siblings.length - 1, model.anchorOffset())];
}

/**
 * Extend the selection between `from` and `to` nodes
 *
 * @param {object} options
 * - options.extendToWordBoundary
 * @return true if the range was actually changed
 */
export function setRange(
    model: ModelPrivate,
    from: Path,
    to: Path,
    options: { extendToWordBoundary?: boolean } = {
        extendToWordBoundary: false,
    }
): boolean {
    // Measure the 'distance' between `from` and `to`
    const distance = pathDistance(from, to);
    if (distance === 0) {
        // `from` and `to` are equal.

        if (options.extendToWordBoundary) {
            from = wordBoundary(model, from, -1);
            to = wordBoundary(model, to, +1);
            return setRange(model, from, to);
        }

        // Set the path to a collapsed insertion point
        return setPath(model, clonePath(from), 0);
    }

    if (distance === 1) {
        const extent = to[to.length - 1].offset - from[from.length - 1].offset;
        if (options.extendToWordBoundary) {
            from = wordBoundary(model, from, extent < 0 ? +1 : -1);
            to = wordBoundary(model, to, extent < 0 ? -1 : +1);
            return setRange(model, from, to);
        }
        // They're siblings, set an extent
        return setPath(model, clonePath(from), extent);
    }

    // They're neither identical, not siblings.

    // Find the common ancestor between the nodes
    let commonAncestor = pathCommonAncestor(from, to);
    const ancestorDepth = commonAncestor.length;
    if (
        from.length === ancestorDepth ||
        to.length === ancestorDepth ||
        from[ancestorDepth].relation !== to[ancestorDepth].relation
    ) {
        return setPath(model, commonAncestor, -1);
    }

    commonAncestor.push(from[ancestorDepth]);
    commonAncestor = clonePath(commonAncestor);

    let extent = to[ancestorDepth].offset - from[ancestorDepth].offset + 1;

    if (extent <= 0) {
        if (to.length > ancestorDepth + 1) {
            // axb/c+y -> select from y to x
            commonAncestor[ancestorDepth].relation = to[ancestorDepth].relation;
            commonAncestor[ancestorDepth].offset = to[ancestorDepth].offset;
            commonAncestor[commonAncestor.length - 1].offset -= 1;
            extent = -extent + 2;
        } else {
            // x+(ayb/c) -> select from y to x
            commonAncestor[ancestorDepth].relation = to[ancestorDepth].relation;
            commonAncestor[ancestorDepth].offset = to[ancestorDepth].offset;
            extent = -extent + 1;
        }
    } else if (to.length <= from.length) {
        // axb/c+y -> select from x to y
        commonAncestor[commonAncestor.length - 1].offset -= 1;
    } else if (to.length > from.length) {
        commonAncestor[ancestorDepth].offset -= 1;
    }

    return setPath(model, commonAncestor, extent);
}

/**
 *
 * @param  extent the length of the selection
 * @return true if the path has actually changed
 */
export function setPath(
    model: ModelPrivate,
    inSelection: string | Path | Selection,
    extent = 0
): boolean {
    let selection: Selection;
    // Convert to a path array if necessary
    if (typeof inSelection === 'string') {
        selection = pathFromString(inSelection);
    } else if (isArray(inSelection)) {
        // need to temporarily change the path of this to use 'sibling()'
        const newPath = clonePath(inSelection as Path);
        const oldPath = model.path;
        model.path = newPath;
        if (extent === 0 && getAnchor(model).type === 'placeholder') {
            // select the placeholder
            newPath[newPath.length - 1].offset = model.anchorOffset() - 1;
            extent = 1;
        }
        selection = {
            path: newPath,
            extent: extent || 0,
        };
        model.path = oldPath;
    } else {
        selection = inSelection;
    }

    const pathChanged = pathDistance(model.path, selection.path) !== 0;
    const extentChanged = selection.extent !== model.extent;

    if (pathChanged || extentChanged) {
        if (pathChanged) {
            adjustPlaceholder(model);
        }
        selectionWillChange(model);

        model.path = clonePath(selection.path);

        if (model.siblings().length < model.anchorOffset()) {
            // The new path is out of bounds.
            // Reset the path to something valid
            console.warn(
                'Invalid selection: ' +
                    model.toString() +
                    ' in "' +
                    model.root.toLatex(false) +
                    '"'
            );

            model.path = [{ relation: 'body', offset: 0 }];
            model.extent = 0;
        } else {
            setSelectionExtent(model, selection.extent);
        }

        selectionDidChange(model);
    }

    return pathChanged || extentChanged;
}

/**
 * Locate the offset before the insertion point that would indicate
 * a good place to select as an implicit argument.
 * For example with '1+\sin(x)', if the insertion point is at the
 * end, the implicit arg offset would be after the plus. As a result,
 * inserting a fraction after the sin would yield: '1+\frac{\sin(c)}{\placeholder{}}'
 */
export function getImplicitArgOffset(model: ModelPrivate): number {
    const siblings = model.siblings();

    let result = model.startOffset();
    if (siblings[result].mode === 'text') {
        while (result >= 1 && siblings[result].mode === 'text') {
            result--;
        }
    } else {
        // Find the first 'mrel', etc... to the left of the insertion point
        while (
            result >= 1 &&
            /^(mord|surd|msubsup|leftright|mop)$/.test(siblings[result].type)
        ) {
            result--;
        }
    }

    return result;
}

/**
 *
 * @param cb - A callback called for each selected atom in the
 * mathlist.
 */
export function forEachSelected(
    model: ModelPrivate,
    cb: (atom: Atom) => void,
    options?: { recursive?: boolean }
): void {
    options = options ?? {};
    options.recursive = options.recursive ?? false;

    const siblings = model.siblings();
    const firstOffset = model.startOffset() + 1;
    const lastOffset = model.endOffset() + 1;

    if (options.recursive) {
        for (let i = firstOffset; i < lastOffset; i++) {
            if (siblings[i] && siblings[i].type !== 'first') {
                siblings[i].forEach(cb);
            }
        }
    } else {
        for (let i = firstOffset; i < lastOffset; i++) {
            if (siblings[i] && siblings[i].type !== 'first') {
                cb(siblings[i]);
            }
        }
    }
}

export function getContentFromSiblings(
    model: ModelPrivate,
    start: number,
    end: number
): string {
    const siblings = model.siblings();
    if (isEmptyMathlist(siblings)) return '';
    if (siblings[0].type === 'first' && start === 0) {
        start = 1;
    }
    if (
        model.parent().type === 'root' &&
        start === 1 &&
        end === siblings.length - 1
    ) {
        // It's the entire sibling list. Get the parent's latex
        return model.parent().toLatex(false);
    }
    let result = '';
    let i = start;
    while (i <= end) {
        result += siblings[i].toLatex(false);
        i++;
    }
    return result;
}

/**
 * When changing the selection, if the former selection is an empty list,
 * insert a placeholder if necessary. For example, if in an empty numerator.
 */
function adjustPlaceholder(model: ModelPrivate): void {
    // Should we insert a placeholder?
    // Check if we're an empty list that is the child of a fraction
    const siblings = model.siblings();
    if (siblings && siblings.length <= 1) {
        let placeholder;
        const relation = model.relation();
        if (relation === 'numer') {
            placeholder = 'numerator';
        } else if (relation === 'denom') {
            placeholder = 'denominator';
        } else if (model.parent().type === 'surd' && relation === 'body') {
            // Surd (roots)
            placeholder = 'radicand';
        } else if (model.parent().type === 'overunder' && relation === 'body') {
            placeholder = 'base';
        } else if (relation === 'underscript' || relation === 'overscript') {
            placeholder = 'annotation';
        }
        if (placeholder) {
            // ◌ ⬚
            // const placeholderAtom = [
            //     new Atom('math', 'placeholder', '⬚', getAnchorStyle(model)),
            // ];
            // Array.prototype.splice.apply(
            //     siblings,
            //     [1, 0].concat(placeholderAtom)
            // );
            // @revisit
            siblings.splice(
                1,
                0,
                new Atom('math', 'placeholder', '⬚', getAnchorStyle(model))
            );
        }
    }
}

function wordBoundary(model: ModelPrivate, path, dir): Path {
    dir = dir < 0 ? -1 : +1;

    const iter = new ModelPrivate();
    iter.path = clonePath(path);
    iter.root = model.root;

    let i = 0;
    while (
        iter.sibling(i) &&
        iter.sibling(i).mode === 'text' &&
        LETTER_AND_DIGITS.test(iter.sibling(i).body as string)
    ) {
        i += dir;
    }
    if (!iter.sibling(i)) i -= dir;
    iter.path[iter.path.length - 1].offset += i;
    return iter.path;
}

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
function wordBoundaryOffset(
    model: ModelPrivate,
    offset: number,
    dir: number
): number {
    dir = dir < 0 ? -1 : +1;

    const siblings = model.siblings();
    if (!siblings[offset]) return offset;
    if (siblings[offset].mode !== 'text') return offset;

    let result;
    if (LETTER_AND_DIGITS.test(siblings[offset].body as string)) {
        // (1) We start with an alphanumerical character
        let i = offset;
        let match;
        do {
            match =
                siblings[i].mode === 'text' &&
                LETTER_AND_DIGITS.test(siblings[i].body as string);
            i += dir;
        } while (siblings[i] && match);
        result = siblings[i] ? i - 2 * dir : i - dir;
    } else if (/\s/.test(siblings[offset].body as string)) {
        // (2) We start with whitespace

        // Skip whitespace
        let i = offset;
        while (
            siblings[i] &&
            siblings[i].mode === 'text' &&
            /\s/.test(siblings[i].body as string)
        ) {
            i += dir;
        }
        if (!siblings[i]) {
            // We've reached the end
            result = i - dir;
        } else {
            let match = true;
            do {
                match =
                    siblings[i].mode === 'text' &&
                    !/\s/.test(siblings[i].body as string);
                i += dir;
            } while (siblings[i] && match);
            result = siblings[i] ? i - 2 * dir : i - dir;
        }
    } else {
        // (3)
        let i = offset;
        // Skip non-whitespace
        while (
            siblings[i] &&
            siblings[i].mode === 'text' &&
            !/\s/.test(siblings[i].body as string)
        ) {
            i += dir;
        }
        result = siblings[i] ? i : i - dir;
        let match = true;
        while (siblings[i] && match) {
            match =
                siblings[i].mode === 'text' &&
                /\s/.test(siblings[i].body as string);
            if (match) result = i;
            i += dir;
        }
        result = siblings[i] ? i - 2 * dir : i - dir;
    }

    return result - (dir > 0 ? 0 : 1);
}

/**
 * Iterate over each atom in the expression, starting with the focus.
 *
 * Return an array of all the paths for which the callback predicate
 * returned true.
 *
 * @param {function} cb - A predicate being passed a path and the atom at this
 * path. Return true to include the designated atom in the result.
 * @param {number} dir - `+1` to iterate forward, `-1` to iterate backward.
 * @return The paths (as a string) for all the atoms which the predicate is true
 */
export function filter(
    model: ModelPrivate,
    cb: (path: Path, anchor: Atom) => boolean,
    dir: -1 | 1 = +1
): string[] {
    dir = dir < 0 ? -1 : +1;

    const result = [];

    const iter = new ModelPrivate();
    iter.path = clonePath(model.path);
    iter.extent = model.extent;
    iter.root = model.root;

    if (dir >= 0) {
        collapseSelectionForward(iter);
    } else {
        collapseSelectionBackward(iter);
        move(iter, 1);
    }
    const initialAnchor = getAnchor(iter);
    do {
        if (cb.bind(iter)(iter.path, getAnchor(iter))) {
            result.push(iter.toString());
        }
        if (dir >= 0) {
            next(iter, { iterateAll: true });
        } else {
            previous(iter, { iterateAll: true });
        }
    } while (initialAnchor !== getAnchor(iter));

    return result;
}
