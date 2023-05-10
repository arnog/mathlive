import type { Style } from '../public/core-types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { makeSizedDelim } from '../core/delimiters';
import { latexCommand } from '../core/tokenizer';
import { getDefinition } from '../core-definitions/definitions-utils';

export class DelimAtom extends Atom {
  size: 1 | 2 | 3 | 4;
  constructor(
    command: string,
    delim: string,
    options: {
      size: 1 | 2 | 3 | 4;
      style: Style;
    }
  ) {
    super({ type: 'delim', command, style: options?.style });
    this.value = delim;
    this.size = options?.size;
  }

  static fromJson(json: AtomJson): DelimAtom {
    return new DelimAtom(json.command, json.delim, json as any);
  }

  toJson(): AtomJson {
    return { ...super.toJson(), delim: this.value, size: this.size };
  }

  render(_context: Context): Box {
    return new Box(this.value, { type: 'middle' });
  }

  serialize(options: ToLatexOptions): string {
    if (!options.expandMacro && typeof this.verbatimLatex === 'string')
      return this.verbatimLatex;
    const def = getDefinition(this.command, this.mode);
    if (def?.serialize) return def.serialize(this, options);

    return latexCommand(this.command, this.value);
  }
}

export class SizedDelimAtom extends Atom {
  protected delimType: 'open' | 'close';
  private readonly size: 1 | 2 | 3 | 4;
  constructor(
    command: string,
    delim: string,
    options: {
      delimType: 'open' | 'close';
      size: 1 | 2 | 3 | 4;
      style: Style;
    }
  ) {
    super({ type: 'sizeddelim', command, style: options.style });
    this.value = delim;
    this.delimType = options.delimType;
    this.size = options.size;
  }

  static fromJson(json: AtomJson): SizedDelimAtom {
    return new SizedDelimAtom(json.command, json.delim, json as any);
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
      isSelected: this.isSelected,
    });
    if (!result) return null;
    result = this.bind(context, result);
    if (this.caret) result.caret = this.caret;
    return result;
  }

  serialize(options: ToLatexOptions): string {
    if (!options.expandMacro && typeof this.verbatimLatex === 'string')
      return this.verbatimLatex;
    const def = getDefinition(this.command, this.mode);
    if (def?.serialize) return def.serialize(this, options);
    return latexCommand(this.command, this.value);
  }
}
