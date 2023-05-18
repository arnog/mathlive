import {
  Atom,
  AtomJson,
  CreateAtomOptions,
  ToLatexOptions,
} from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { makeSizedDelim } from '../core/delimiters';
import { latexCommand } from '../core/tokenizer';
import { getDefinition } from '../core-definitions/definitions-utils';

export class MiddleDelimAtom extends Atom {
  size: 1 | 2 | 3 | 4;
  constructor(
    options: CreateAtomOptions & {
      delim: string;
      size: 1 | 2 | 3 | 4;
    }
  ) {
    super({ ...options, type: 'delim' });
    this.value = options.delim;
    this.size = options.size;
  }

  static fromJson(json: AtomJson): MiddleDelimAtom {
    return new MiddleDelimAtom(json as any);
  }

  toJson(): AtomJson {
    return { ...super.toJson(), delim: this.value, size: this.size };
  }

  render(_context: Context): Box {
    return new Box(this.value, { type: 'middle' });
  }

  _serialize(options: ToLatexOptions): string {
    if (
      !(options.expandMacro || options.skipStyles) &&
      typeof this.verbatimLatex === 'string'
    )
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
    options: CreateAtomOptions & {
      delim: string;
      delimType: 'open' | 'close';
      size: 1 | 2 | 3 | 4;
    }
  ) {
    super({ ...options, type: 'sizeddelim', value: options.delim });
    this.delimType = options.delimType;
    this.size = options.size;
  }

  static fromJson(json: AtomJson): SizedDelimAtom {
    return new SizedDelimAtom(json as any);
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

  _serialize(options: ToLatexOptions): string {
    if (
      !(options.expandMacro || options.skipStyles) &&
      typeof this.verbatimLatex === 'string'
    )
      return this.verbatimLatex;
    const def = getDefinition(this.command, this.mode);
    if (def?.serialize) return def.serialize(this, options);
    return latexCommand(this.command, this.value);
  }
}
