import { _Mathfield } from './mathfield-private';
import { applyStyle as applyStyleToModel } from '../editor-model/styling';
import { register as registerCommand } from '../editor/commands';
import type {
  Style,
  FontSeries,
  FontShape,
  FontSize,
  FontFamily,
  Variant,
  VariantStyle,
} from '../public/core-types';
import { PrivateStyle } from '../core/types';
import { Offset } from 'mathlive';
import { Atom } from 'core/atom';
import { _Model } from 'editor-model/model-private';

export function applyStyle(mathfield: _Mathfield, inStyle: Style): boolean {
  mathfield.flushInlineShortcutBuffer();
  mathfield.stopCoalescingUndo();

  const style = validateStyle(mathfield, inStyle);
  const { model } = mathfield;
  if (model.selectionIsCollapsed) {
    // No selection, let's update the 'current' style
    if (
      mathfield.defaultStyle.fontSeries &&
      style.fontSeries === mathfield.defaultStyle.fontSeries
    )
      style.fontSeries = 'auto';

    if (style.fontShape && style.fontShape === mathfield.defaultStyle.fontShape)
      style.fontShape = 'auto';

    if (style.color && style.color === mathfield.defaultStyle.color)
      style.color = 'none';

    if (
      style.backgroundColor &&
      style.backgroundColor === mathfield.defaultStyle.backgroundColor
    )
      style.backgroundColor = 'none';

    if (style.fontSize && style.fontSize === mathfield.defaultStyle.fontSize)
      style.fontSize = 'auto';

    // This global style will be used the next time an atom is inserted
    mathfield.defaultStyle = { ...mathfield.defaultStyle, ...style };
  } else {
    mathfield.model.deferNotifications(
      { content: true, type: 'insertText' },
      () => {
        // Change the style of the selection
        model.selection.ranges.forEach((range) =>
          applyStyleToModel(model, range, style, { operation: 'toggle' })
        );
        mathfield.snapshot('style-change');
      }
    );
  }

  return true;
}

registerCommand(
  { applyStyle },
  {
    target: 'mathfield',
    canUndo: true,
    changeContent: true,
  }
);

/**
 * Validate a style specification object
 */
export function validateStyle(
  mathfield: _Mathfield,
  style: Record<string, any>
): PrivateStyle {
  const result: PrivateStyle = {};

  if (typeof style.color === 'string') {
    const newColor =
      mathfield.colorMap(style.color ?? style.verbatimColor) ?? 'none';
    if (newColor !== style.color)
      result.verbatimColor = style.verbatimColor ?? style.color;
    result.color = newColor;
  }

  if (typeof style.backgroundColor === 'string') {
    const newColor =
      mathfield.backgroundColorMap(
        style.backgroundColor ?? style.verbatimBackgroundColor
      ) ?? 'none';
    if (newColor !== style.backgroundColor) {
      result.verbatimBackgroundColor =
        style.verbatimBackgroundColor ?? style.backgroundColor;
    }
    result.backgroundColor = newColor;
  }

  if (typeof style.fontFamily === 'string')
    result.fontFamily = style.fontFamily as FontFamily;

  if (typeof style.series === 'string')
    result.fontSeries = style.series as FontSeries;

  if (typeof style.fontSeries === 'string')
    result.fontSeries = style.fontSeries.toLowerCase() as FontSeries;

  if (result.fontSeries) {
    result.fontSeries =
      {
        bold: 'b',
        medium: 'm',
        normal: 'm',
      }[result.fontSeries] ?? result.fontSeries;
  }

  if (typeof style.shape === 'string')
    result.fontShape = style.shape as FontShape;

  if (typeof style.fontShape === 'string')
    result.fontShape = style.fontShape.toLowerCase() as FontShape;

  if (result.fontShape) {
    result.fontShape =
      {
        italic: 'it',
        up: 'n',
        upright: 'n',
        normal: 'n',
      }[result.fontShape] ?? result.fontShape;
  }

  if (style.variant) result.variant = style.variant.toLowerCase() as Variant;

  if (style.variantStyle)
    result.variantStyle = style.variantStyle.toLowerCase() as VariantStyle;

  const size = style.size ?? style.fontSize;

  if (typeof size === 'number')
    result.fontSize = Math.max(1, Math.min(10, size)) as FontSize;
  else if (typeof size === 'string') {
    result.fontSize =
      ({
        size1: 1,
        size2: 2,
        size3: 3,
        size4: 4,
        size5: 5,
        size6: 6,
        size7: 7,
        size8: 8,
        size9: 9,
        size10: 10,
      }[size.toLowerCase()] as FontSize) ??
      ({
        tiny: 1,
        scriptsize: 2,
        footnotesize: 3,
        small: 4,
        normal: 5,
        normalsize: 5,
        large: 6,
        Large: 7,
        LARGE: 8,
        huge: 9,
        Huge: 10,
      }[size] as FontSize);
  }

  return result;
}

/** Default hook to determine the style to be applied when a new
 *  element is inserted
 */

export function defaultInsertStyleHook(
  mathfield: _Mathfield,
  offset: Offset,
  info: { before: Offset; after: Offset; latex: string }
): Readonly<Style> {
  const model = mathfield.model;

  if (model.mode === 'latex') return {};

  const bias = mathfield.styleBias;
  if (bias === 'none') return mathfield.defaultStyle;

  // In text mode, we inherit the style of the sibling atom
  if (model.mode === 'text')
    return (
      model.at(bias === 'right' ? info.after : info.before)?.style ??
      mathfield.defaultStyle
    );

  if (model.mode === 'math') {
    const atom = model.at(bias === 'right' ? info.after : info.before);
    if (!atom) return mathfield.defaultStyle;
    return { ...atom.style, variant: 'normal' };
  }

  return {};
}

export function computeInsertStyle(mathfield: _Mathfield): Readonly<Style> {
  let hook = mathfield.options.onInsertStyle;
  if (hook === null) return {};
  if (hook === undefined) hook = defaultInsertStyleHook;

  const model = mathfield.model;
  const bias = mathfield.styleBias;
  const atom = model.at(model.position);

  const before = ungroup(model, atom, bias);
  const after = ungroup(model, atom.rightSibling, bias);

  return hook(mathfield, model.position, { before, after });
}

function ungroup(
  model: _Model,
  atom: Atom | undefined,
  bias: 'left' | 'right' | 'none'
): Offset {
  if (!atom) return -1;
  if (atom.type === 'first' && bias !== 'right') return -1;
  if (atom.type !== 'group') return model.offsetOf(atom);
  if (!atom.body || atom.body.length < 2) return -1;
  if (atom.body?.length === 1) return model.offsetOf(atom.body[0]);
  if (bias !== 'right') return model.offsetOf(atom.body[0]);
  return model.offsetOf(atom.body[atom.body.length - 1]);
}
