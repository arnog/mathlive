import { Atom, ToLatexOptions } from '../core/atom-class';
import { Span, SpanType } from '../core/span';
import { Context } from '../core/context';
import { makeSizedDelim } from '../core/delimiters';
import { Style } from '../public/core';

export class DelimAtom extends Atom {
  size: 1 | 2 | 3 | 4;
  constructor(
    command: string,
    delim: string,
    options?: {
      size?: 1 | 2 | 3 | 4;
      style: Style;
    }
  ) {
    super('delim', { command, style: options?.style });
    this.value = delim;
    this.size = options?.size;
  }

  render(_context: Context): Span[] {
    const span = new Span(null, '');
    span.delim = this.value;
    return [span];
  }

  toLatex(_options: ToLatexOptions): string {
    if (this.value.length === 1) {
      return this.command + this.value;
    }

    return this.command + '{' + this.value + '}';
  }
}

export class SizedDelimAtom extends Atom {
  protected delimClass?: SpanType;
  private readonly size: 1 | 2 | 3 | 4;
  constructor(
    command: string,
    delim: string,
    options: {
      delimClass: SpanType;
      size: 1 | 2 | 3 | 4;
      style: Style;
    }
  ) {
    super('sizeddelim', { command, style: options.style });
    this.value = delim;
    this.delimClass = options.delimClass;
    this.size = options.size;
  }

  render(context: Context): Span[] {
    const result = this.bind(
      context,
      makeSizedDelim(this.delimClass, this.value, this.size, context)
    );
    if (this.caret) result.caret = this.caret;
    return [result];
  }

  toLatex(_options: ToLatexOptions): string {
    if (this.value.length === 1) {
      return this.command + this.value;
    }

    return this.command + '{' + this.value + '}';
  }
}
