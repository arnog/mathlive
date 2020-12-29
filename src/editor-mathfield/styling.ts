import { Style, FontSeries, FontShape } from '../public/core';
import { MathfieldPrivate } from './mathfield-private';
import { applyStyle as applyStyleToModel } from '../editor-model/styling';
import { register as registerCommand } from '../editor/commands';

export function applyStyle(
  mathfield: MathfieldPrivate,
  inStyle: Style
): boolean {
  const style = validateStyle(inStyle);
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
function validateStyle(style: Record<string, any>): Style {
  const result: Style = {};

  if (typeof style.color === 'string') {
    result.color = style.color;
  }

  if (typeof style.backgroundColor === 'string') {
    result.backgroundColor = style.backgroundColor;
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

  if (typeof style.size === 'string') {
    result.fontSize = style.size;
  } else if (typeof style.size === 'number') {
    result.fontSize = `size${Math.min(0, Math.max(10, style.size))}`;
  }

  if (typeof style.fontSize === 'string') {
    result.fontSize = style.fontSize.toLowerCase();
  }

  if (result.fontSize) {
    result.fontSize =
      {
        tiny: 'size1',
        scriptsize: 'size2',
        footnotesize: 'size3',
        small: 'size4',
        normal: 'size5',
        normalsize: 'size5',
        large: 'size6',
        Large: 'size7',
        LARGE: 'size8',
        huge: 'size9',
        Huge: 'size10',
      }[result.fontSize] || result.fontSize;
  }

  return result;
}
