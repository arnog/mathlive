import { Atom, AtomJson } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';

import type { ParseMode, Style } from '../public/core-types';
import type { GlobalContext } from '../core/types';

export class NewLineAtom extends Atom {
  constructor(command: string, context: GlobalContext, style: Style) {
    super('newline', context, { command, style });
    this.skipBoundary = true;
  }

  static fromJson(json: AtomJson, context: GlobalContext): NewLineAtom {
    return new NewLineAtom(json.command, context, json as any);
  }

  toJson(): AtomJson {
    return super.toJson();
  }

  render(context: Context): Box | null {
    const box = new Box(null, {
      classes: 'ML__newline',
      type: 'newline',
    });
    box.caret = (this.caret as ParseMode) ?? null;
    this.bind(context, box);
    return box;
  }

  serialize(): string {
    return '\\\\';
  }
}
