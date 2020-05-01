import { Atom, isAtomArray } from '../core/atom';
import { contentDidChange, contentWillChange } from './model-listeners';
import { ModelPrivate } from './model-utils';
import { selectionIsCollapsed, forEachSelected } from './model-selection';

import { Style, FontSeries, FontShape } from '../public/core';

export function applyStyleToUnstyledAtoms(
    atom: Atom | Atom[],
    style: Style
): void {
    if (!atom || !style) return;
    if (isAtomArray(atom)) {
        // Apply styling options to each atom
        atom.forEach((x) => applyStyleToUnstyledAtoms(x, style));
    } else if (typeof atom === 'object') {
        if (
            !atom.color &&
            !atom.backgroundColor &&
            !atom.fontFamily &&
            !atom.fontShape &&
            !atom.fontSeries &&
            !atom.fontSize
        ) {
            atom.applyStyle(style);
            applyStyleToUnstyledAtoms(atom.body as Atom[], style);
            applyStyleToUnstyledAtoms(atom.numer, style);
            applyStyleToUnstyledAtoms(atom.denom, style);
            applyStyleToUnstyledAtoms(atom.index, style);
            applyStyleToUnstyledAtoms(atom.overscript, style);
            applyStyleToUnstyledAtoms(atom.underscript, style);
            applyStyleToUnstyledAtoms(atom.subscript, style);
            applyStyleToUnstyledAtoms(atom.superscript, style);
        }
    }
}

/**
 * Apply a style (color, background) to the selection.
 *
 * If the style is already applied to the selection, remove it. If the selection
 * has the style partially applied (i.e. only some sections), remove it from
 * those sections, and apply it to the entire selection.
 *
 * @method EditableMathlist#applyStyle
 * @private
 */

export function applyStyle(
    model: ModelPrivate,
    style: Style & { series?: FontSeries; shape?: FontShape; size?: string }
): void {
    // No selection, nothing to do.
    if (selectionIsCollapsed(model)) return;

    function everyStyle(property, value): boolean {
        let result = true;
        forEachSelected(
            model,
            (x) => {
                result = result && x[property] === value;
            },
            { recursive: true }
        );
        return result;
    }

    if (style.color && everyStyle('color', style.color)) {
        // If the selection already has this color, turn it off
        style.color = 'none';
    }

    if (
        style.backgroundColor &&
        everyStyle('backgroundColor', style.backgroundColor)
    ) {
        // If the selection already has this color, turn it off
        style.backgroundColor = 'none';
    }

    if (style.fontFamily && everyStyle('fontFamily', style.fontFamily)) {
        // If the selection already has this font family, turn it off
        style.fontFamily = 'none';
    }

    if (style.series) style.fontSeries = style.series;
    if (style.fontSeries && everyStyle('fontSeries', style.fontSeries)) {
        // If the selection already has this series (weight), turn it off
        style.fontSeries = 'auto';
    }

    if (style.shape) style.fontShape = style.shape;
    if (style.fontShape && everyStyle('fontShape', style.fontShape)) {
        // If the selection already has this shape (italic), turn it off
        style.fontShape = 'auto';
    }

    if (style.size) style.fontSize = style.size;
    if (style.fontSize && everyStyle('fontSize', style.fontSize)) {
        // If the selection already has this size, reset it to default size
        style.fontSize = 'size5';
    }

    contentWillChange(model);
    forEachSelected(model, (x) => x.applyStyle(style), { recursive: true });
    contentDidChange(model);
}
