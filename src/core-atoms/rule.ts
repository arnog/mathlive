import type { Dimension, Style } from '../public/core-types';
import type { GlobalContext } from '../core/types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Context } from '../core/context';
import { Box } from '../core/box';
import {
  convertDimensionToEm,
  serializeDimension,
} from '../core/registers-utils';
import { latexCommand } from '../core/tokenizer';

export class RuleAtom extends Atom {
  private readonly height: Dimension;
  private readonly width: Dimension;
  private readonly shift: Dimension;
  constructor(
    command: string,
    context: GlobalContext,
    options: {
      height: Dimension;
      width: Dimension;
      shift?: Dimension | null;
      style: Style;
    }
  ) {
    super('rule', context, { command, style: options.style });
    this.shift = options.shift ?? { dimension: 0 };
    this.height = options.height;
    this.width = options.width;
  }

  static fromJson(json: AtomJson, context: GlobalContext): RuleAtom {
    return new RuleAtom(json.command, context, json as any);
  }

  toJson(): AtomJson {
    const options: { [key: string]: any } = {
      height: this.height,
      width: this.width,
    };
    if (this.shift) options.shift = this.shift;
    return { ...super.toJson(), ...options };
  }

  render(parentContext: Context): Box | null {
    // The mathstyle sizing corrections (size delta) do not
    // apply to the dimensions of rules. Create a 'textstyle'
    // context to do the measurements without accounting for the mathstyle.
    const context = new Context(parentContext, this.style, 'textstyle');

    const shift = convertDimensionToEm(this.shift);
    const width = convertDimensionToEm(this.width);
    const height = convertDimensionToEm(this.height);
    const result = new Box(null, { classes: 'rule', type: 'ord' });
    result.setStyle('border-right-width', width, 'em');
    result.setStyle('border-top-width', height, 'em');
    result.setStyle('border-color', this.style.color);
    result.setStyle('vertical-align', shift, 'em');
    if (this.isSelected) result.setStyle('opacity', '50%');
    result.width = width;
    result.height = height + shift;
    result.depth = -shift;
    this.bind(parentContext, result);
    if (this.caret) result.caret = this.caret;
    return result.wrap(context);
  }

  serialize(_options: ToLatexOptions): string {
    let command = this.command ?? '';
    if (this.shift) command += `[${serializeDimension(this.shift)}]`;

    return latexCommand(
      command,
      serializeDimension(this.width),
      serializeDimension(this.height)
    );
  }
}
