import type { Style } from '../public/core-types';
import type { GlobalContext } from '../core/types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { makeSizedDelim } from '../core/delimiters';
import { latexCommand } from '../core/tokenizer';

export class DelimAtom extends Atom {
  size: 1 | 2 | 3 | 4;
  constructor(
    command: string,
    delim: string,
    context: GlobalContext,
    options: {
      size: 1 | 2 | 3 | 4;
      style: Style;
    }
  ) {
    super('delim', context, { command, style: options?.style });
    this.value = delim;
    this.size = options?.size;
  }

  static fromJson(json: AtomJson, context: GlobalContext): DelimAtom {
    return new DelimAtom(json.command, json.delim, context, json as any);
  }

  toJson(): AtomJson {
    return { ...super.toJson(), delim: this.value, size: this.size };
  }

  render(_context: Context): Box {
    const box = new Box(null);
    box.delim = this.value;
    return box;
  }

  serialize(_options: ToLatexOptions): string {
    return latexCommand(this.command, this.value);
  }
}

export class SizedDelimAtom extends Atom {
  protected delimType: 'open' | 'close';
  private readonly size: 1 | 2 | 3 | 4;
  constructor(
    command: string,
    delim: string,
    context: GlobalContext,
    options: {
      delimType: 'open' | 'close';
      size: 1 | 2 | 3 | 4;
      style: Style;
    }
  ) {
    super('sizeddelim', context, { command, style: options.style });
    this.value = delim;
    this.delimType = options.delimType;
    this.size = options.size;
  }

  static fromJson(json: AtomJson, context: GlobalContext): SizedDelimAtom {
    return new SizedDelimAtom(json.command, json.delim, context, json as any);
  }

  toJson(): AtomJson {
    return {
      ...super.toJson(),
      delim: this.value,
      size: this.size,
      delimType: this.delimType,
    };
  }

  render(context: Context): Box | null {
    let result = makeSizedDelim(this.value, this.size, context, {
      classes: { open: 'mopen', close: 'mclose' }[this.delimType],
      type: this.delimType,
    });
    if (!result) return null;
    result = this.bind(context, result);
    if (this.caret) result.caret = this.caret;
    return result;
  }

  serialize(_options: ToLatexOptions): string {
    return latexCommand(this.command, this.value);
  }
}
