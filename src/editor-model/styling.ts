import { Atom, isAtomArray } from '../core/atom';
import type { ModelPrivate } from './model-private';
import { Range } from '../public/mathfield';
import { Style } from '../public/core';

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
      !atom.style.color &&
      !atom.style.backgroundColor &&
      !atom.style.fontFamily &&
      !atom.style.fontShape &&
      !atom.style.fontSeries &&
      !atom.style.fontSize &&
      !atom.style.variant &&
      !atom.style.variantStyle
    ) {
      atom.applyStyle(style);
      applyStyleToUnstyledAtoms(atom.body, style);
      applyStyleToUnstyledAtoms(atom.above, style);
      applyStyleToUnstyledAtoms(atom.below, style);
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
 */

export function applyStyle(
  model: ModelPrivate,
  range: Range,
  style: Style,
  options: { operation: 'set' | 'toggle' }
): boolean {
  function everyStyle(property, value): boolean {
    let result = true;
    atoms.forEach((x: Atom) => {
      result = result && x.style[property] === value;
    });
    return result;
  }

  range = model.normalizeRange(range);
  if (range[0] === range[1]) return false;

  const atoms = model.getAtoms(range, { includeChildren: true });

  if (options.operation === 'toggle') {
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

    // If (style.series) style.fontSeries = style.series;
    if (style.fontSeries && everyStyle('fontSeries', style.fontSeries)) {
      // If the selection already has this series (weight), turn it off
      style.fontSeries = 'auto';
    }

    // If (style.shape) style.fontShape = style.shape;
    if (style.fontShape && everyStyle('fontShape', style.fontShape)) {
      // If the selection already has this shape (italic), turn it off
      style.fontShape = 'auto';
    }

    // If (style.size) style.fontSize = style.size;
    if (style.fontSize && everyStyle('fontSize', style.fontSize)) {
      // If the selection already has this size, reset it to default size
      style.fontSize = 'size5';
    }
  }

  atoms.forEach((x) => x.applyStyle(style));

  return true;
}
