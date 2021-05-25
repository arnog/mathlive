import { Atom, ToLatexOptions } from '../core/atom-class';
import { Context } from '../core/context';
import { Box } from '../core/box';
import { Dimension, Style } from '../public/core';
import {
  convertDimensionToEm,
  serializeDimension,
} from '../core/registers-utils';

export class RuleAtom extends Atom {
  private readonly height: Dimension;
  private readonly width: Dimension;
  private readonly shift: Dimension;
  constructor(
    command: string,
    options: {
      height: Dimension;
      width: Dimension;
      shift?: Dimension | null;
      style: Style;
    }
  ) {
    super('rule', { command, style: options.style });
    this.shift = options.shift ?? { dimension: 0 };
    this.height = options.height;
    this.width = options.width;
  }

  render(parentContext: Context): Box | null {
    // The mathstyle sizing corrections (size delta) do not
    // apply to the dimensions of rules. Create a 'textstyle'
    // context to do the measurements without accounting for the mathstyle.
    const context = new Context(parentContext, this.style, 'textstyle');

    const shift = convertDimensionToEm(this.shift);
    const width = convertDimensionToEm(this.width);
    const height = convertDimensionToEm(this.height);
    const result = new Box(null, { classes: 'rule', type: 'mord' });
    result.setStyle('border-right-width', width, 'em');
    result.setStyle('border-top-width', height, 'em');
    result.setStyle('border-color', this.style.color);
    result.setStyle('vertical-align', shift, 'em');
    if (context.isSelected) result.setStyle('opacity', '50%');
    result.width = width;
    result.height = height + shift;
    result.depth = -shift;
    this.bind(parentContext, result);
    if (this.caret) result.caret = this.caret;
    return result.wrap(context);
  }

  serialize(_options: ToLatexOptions): string {
    let result = this.command ?? '';
    if (this.shift) {
      result += `[${serializeDimension(this.shift)}]`;
    }

    result += `{${serializeDimension(this.width)}}{${serializeDimension(
      this.height
    )}}`;
    return result;
  }
}
