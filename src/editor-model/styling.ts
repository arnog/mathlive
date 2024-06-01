import { Atom } from '../core/atom';
import type { _Model } from './model-private';
import { Range } from '../public/mathfield';
import { isArray } from '../common/types';
import { DEFAULT_FONT_SIZE } from '../core/font-metrics';
import type { Style, VariantStyle } from '../public/core-types';
import { PrivateStyle } from '../core/types';

export function applyStyleToUnstyledAtoms(
  atom: Atom | readonly Atom[] | undefined,
  style?: Style
): void {
  if (!atom || !style) return;
  if (isArray<Atom>(atom)) {
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
  model: _Model,
  range: Range,
  style: PrivateStyle,
  options: { operation: 'set' | 'toggle' }
): boolean {
  function everyStyle(
    property: keyof PrivateStyle,
    value: string | number
  ): boolean {
    for (const atom of atoms) if (atom.style[property] !== value) return false;

    return true;
  }

  range = model.normalizeRange(range);
  if (range[0] === range[1]) return false;

  const atoms = model.getAtoms(range, { includeChildren: true });

  if (options.operation === 'toggle') {
    if (style.color && everyStyle('color', style.color)) {
      // If the selection already has this color, turn it off
      style.color = 'none';
      delete style.verbatimColor;
    }

    if (
      style.backgroundColor &&
      everyStyle('backgroundColor', style.backgroundColor)
    ) {
      // If the selection already has this color, turn it off
      style.backgroundColor = 'none';
      delete style.verbatimBackgroundColor;
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
      style.fontSize = DEFAULT_FONT_SIZE;
    }

    if (style.variant && everyStyle('variant', style.variant)) {
      // If the selection already has this variant, turn it off
      style.variant = 'normal';
    }

    if (style.variantStyle && everyStyle('variantStyle', style.variantStyle)) {
      // If the selection already has this variant, turn it off
      style.variantStyle = '';
    }
  }

  for (const atom of atoms) atom.applyStyle(style);

  return true;
}

export function addItalic(v: VariantStyle | undefined): VariantStyle {
  return {
    'up': 'italic',
    'bold': 'bolditalic',
    'italic': 'italic',
    'bolditalic': 'bolditalic',
    '': 'italic',
  }[v ?? ''] as VariantStyle;
}

export function removeItalic(v: VariantStyle | undefined): VariantStyle {
  return {
    'up': 'up',
    'bold': 'bold',
    'italic': undefined,
    'bolditalic': 'bold',
    '': undefined,
  }[v ?? ''] as VariantStyle;
}

export function addBold(v: VariantStyle | undefined): VariantStyle {
  return {
    'up': 'bold',
    'bold': 'bold',
    'italic': 'bolditalic',
    'bolditalic': 'bolditalic',
    '': 'bold',
  }[v ?? ''] as VariantStyle;
}
