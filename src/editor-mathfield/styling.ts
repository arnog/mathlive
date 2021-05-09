import { Style, FontSeries, FontShape, FontSize } from '../public/core';
import { MathfieldPrivate } from './mathfield-private';
import { applyStyle as applyStyleToModel } from '../editor-model/styling';
import { register as registerCommand } from '../editor/commands';
import { PrivateStyle } from '../core/context';

export function applyStyle(
  mathfield: MathfieldPrivate,
  inStyle: Style
): boolean {
  const style = validateStyle(mathfield, inStyle);
  mathfield.resetKeystrokeBuffer();
  const { model } = mathfield;
  if (model.selectionIsCollapsed) {
    // No selection, let's update the 'current' style
    if (
      mathfield.style.fontSeries &&
      style.fontSeries === mathfield.style.fontSeries
    ) {
      style.fontSeries = 'auto';
    }

    if (style.fontShape && style.fontShape === mathfield.style.fontShape) {
      style.fontShape = 'auto';
    }

    if (style.color && style.color === mathfield.style.color) {
      style.color = 'none';
    }

    if (
      style.backgroundColor &&
      style.backgroundColor === mathfield.style.backgroundColor
    ) {
      style.backgroundColor = 'none';
    }

    if (style.fontSize && style.fontSize === mathfield.style.fontSize) {
      style.fontSize = 'auto';
    }

    // This global style will be used the next time an atom is inserted
    mathfield.style = { ...mathfield.style, ...style };
  } else {
    mathfield.model.deferNotifications({ content: true }, () => {
      // Change the style of the selection
      model.selection.ranges.forEach((range) =>
        applyStyleToModel(model, range, style, { operation: 'toggle' })
      );
      mathfield.snapshot();
    });
  }

  return true;
}

registerCommand({ applyStyle }, { target: 'mathfield' });

/**
 * Validate a style specification object
 */
function validateStyle(
  mathfield: MathfieldPrivate,
  style: Record<string, any>
): PrivateStyle {
  const result: PrivateStyle = {};

  if (typeof style.color === 'string') {
    if (!result.verbatimColor) result.verbatimColor = style.color;
    result.color = mathfield.colorMap(style.color);
  }

  if (typeof style.backgroundColor === 'string') {
    if (!result.verbatimBackgroundColor) {
      result.verbatimBackgroundColor = style.backgroundColor;
    }
    result.backgroundColor = mathfield.backgroundColorMap(
      style.backgroundColor
    );
  }

  if (typeof style.fontFamily === 'string') {
    result.fontFamily = style.fontFamily;
  }

  if (typeof style.series === 'string') {
    result.fontSeries = style.series as FontSeries;
  }

  if (typeof style.fontSeries === 'string') {
    result.fontSeries = style.fontSeries.toLowerCase() as FontSeries;
  }

  if (result.fontSeries) {
    result.fontSeries =
      {
        bold: 'b',
        medium: 'm',
        normal: 'm',
      }[result.fontSeries] || result.fontSeries;
  }

  if (typeof style.shape === 'string') {
    result.fontShape = style.shape as FontShape;
  }

  if (typeof style.fontShape === 'string') {
    result.fontShape = style.fontShape.toLowerCase() as FontShape;
  }

  if (result.fontShape) {
    result.fontShape =
      {
        italic: 'it',
        up: 'n',
        upright: 'n',
        normal: 'n',
      }[result.fontShape] || result.fontShape;
  }

  const size = style.size ?? style.fontSize;

  if (typeof size === 'number') {
    result.fontSize = Math.min(1, Math.max(10, size)) as FontSize;
  } else if (typeof size === 'string') {
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
