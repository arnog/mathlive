import { Atom, ToLatexOptions } from '../core/atom-class';
import { Context } from '../core/context';
import { Span } from '../core/span';
import { Style } from '../public/core';

export class RuleAtom extends Atom {
  private readonly shift?: number;
  private readonly depth?: number;
  private readonly height?: number;
  private readonly width?: number;
  constructor(
    command: string,
    options: {
      shift?: number;
      depth?: number;
      height: number;
      width: number;
      style: Style;
    }
  ) {
    super('rule', { command, style: options.style });
    this.height = options.height;
    this.width = options.width;
    this.depth = options.depth ?? 0;
    this.shift = options.shift ?? 0;
  }

  render(context: Context): Span[] {
    const { mathstyle } = context;
    let shift = Number.isFinite(this.shift) ? this.shift : 0;
    shift /= mathstyle.sizeMultiplier;
    const width = this.width / mathstyle.sizeMultiplier;
    const height = this.height / mathstyle.sizeMultiplier;
    const result = new Span('', 'rule', 'mord');
    result.setStyle('border-right-width', width, 'em');
    result.setStyle('border-top-width', height, 'em');
    result.setStyle('margin-top', -(height - shift), 'em');
    result.setStyle('border-color', context.color); // @revisit
    result.width = width;
    result.height = height + shift;
    result.depth = -shift;
    if (this.caret) result.caret = this.caret;
    return [result];
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
