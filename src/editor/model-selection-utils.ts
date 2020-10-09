import { isArray } from '../common/types';
import { Atom } from '../core/core';
import { ModelPrivate } from './model-class';

import { arrayCell } from './model-array-utils';
import { selectionDidChange } from './model-listeners';
import {
    Selection,
    Path,
    pathFromString,
    pathDistance,
    clone as clonePath,
} from './path';

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
        selection.extent = extent;
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
            extent: extent ?? 0,
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
            model.extent = selection.extent;
        }

        selectionDidChange(model);
    }

    return pathChanged || extentChanged;
}

/**
 * When changing the selection, if the former selection is an empty list,
 * insert a placeholder if necessary. For example, if in an empty numerator.
 */
export function adjustPlaceholder(model: ModelPrivate): void {
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

// @revisit any
export function getAnchorStyle(model: ModelPrivate): any {
    const anchor = model.extent === 0 ? getAnchor(model) : model.sibling(1);
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
