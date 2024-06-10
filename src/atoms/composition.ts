import type { ParseMode, Style } from '../public/core-types';

import { Atom } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import type { AtomJson, ToLatexOptions } from 'core/types';

export class CompositionAtom extends Atom {
  constructor(value: string, options?: { mode: ParseMode }) {
    super({ type: 'composition', mode: options?.mode ?? 'math', value });
  }

  static fromJson(json: { [key: string]: any }): CompositionAtom {
    return new CompositionAtom(json.value, json as any);
  }

  toJson(): AtomJson {
    return super.toJson();
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

  _serialize(_options: ToLatexOptions): string {
    return '';
  }
}
