import { ParseMode, Style } from '../public/core';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context, GlobalContext } from '../core/context';

export class CompositionAtom extends Atom {
  constructor(
    value: string,
    context: GlobalContext,
    options?: { mode: ParseMode }
  ) {
    super('composition', context, { mode: options?.mode ?? 'math', value });
  }

  static fromJson(
    json: { [key: string]: any },
    context: GlobalContext
  ): CompositionAtom {
    return new CompositionAtom(json.value, context, json as any);
  }

  toJson(): AtomJson {
    return super.toJson();
  }

  get computedStyle(): Style {
    return {};
  }

  render(context: Context): Box {
    // In theory one would like to be able to draw the clauses
    // in an active composition. Unfortunately, there are
    // no API to give access to those clauses :(
    const result = new Box(this.value, {
      classes: 'ML__composition',
      type: 'composition',
    });
    this.bind(context, result);
    if (this.caret) result.caret = this.caret;
    return result;
  }

  serialize(_options: ToLatexOptions): string {
    return '';
  }
}
