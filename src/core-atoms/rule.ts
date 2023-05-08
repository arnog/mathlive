import type { LatexValue, Style } from '../public/core-types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Context } from '../core/context';
import { Box } from '../core/box';
import { serializeLatexValue } from '../core/registers-utils';
import { latexCommand } from '../core/tokenizer';

export class RuleAtom extends Atom {
  private readonly height: LatexValue;
  private readonly width: LatexValue;
  private readonly shift: LatexValue;
  constructor(
    command: string,
    options: {
      height: LatexValue;
      width: LatexValue;
      shift?: LatexValue | null;
      style: Style;
    }
  ) {
    super({ type: 'rule', command, style: options.style });
    this.shift = options.shift ?? { dimension: 0 };
    this.height = options.height;
    this.width = options.width;
  }

  static fromJson(json: AtomJson): RuleAtom {
    return new RuleAtom(json.command, json as any);
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
    const context = new Context(
      {
        parent: parentContext,
        mathstyle: 'textstyle',
      },
      this.style
    );

    const shift = context.toEm(this.shift) ?? 1.0;
    const width = context.toEm(this.width) ?? 1.0;
    const height = context.toEm(this.height) ?? 1.0;
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
    if (this.shift) command += `[${serializeLatexValue(this.shift)}]`;

    return latexCommand(
      command,
      serializeLatexValue(this.width) ?? '',
      serializeLatexValue(this.height) ?? ''
    );
  }
}
