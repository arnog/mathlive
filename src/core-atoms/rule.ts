import { Atom, ToLatexOptions } from '../core/atom-class';
import { Context } from '../core/context';
import { Span } from '../core/span';
import { Style } from '../public/core';

export class RuleAtom extends Atom {
  private readonly height: number;
  private readonly width: number;
  private readonly shift: number;
  constructor(
    command: string,
    options: {
      height: number;
      width: number;
      shift?: number | null;
      style: Style;
    }
  ) {
    super('rule', { command, style: options.style });
    this.shift = options.shift ?? 0;
    this.height = options.height;
    this.width = options.width;
  }

  render(parentContext: Context): Span {
    // The mathstyle sizing corrections (size delta) do not
    // apply to the dimensions of rules. Create a 'textstyle'
    // context to do the measurements without accounting for the mathstyle.
    const context = new Context(parentContext, this.style, 'textstyle');

    const shift = Number.isFinite(this.shift) ? this.shift : 0;
    const width = this.width;
    const height = this.height;
    const result = new Span(null, { classes: 'rule', type: 'mord' });
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

  toLatex(options: ToLatexOptions): string {
    let result = this.command;
    if (this.shift) {
      result += `[${Atom.toLatex(this.shift, options)}em]`;
    }

    result +=
      `{${Atom.toLatex(this.width, options)}em}` +
      `{${Atom.toLatex(this.height, options)}em}`;
    return result;
  }
}
