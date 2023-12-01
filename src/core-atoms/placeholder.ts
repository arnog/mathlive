import type { ParseMode, Style } from '../public/core-types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';

export class PlaceholderAtom extends Atom {
  constructor(options?: { mode?: ParseMode; style?: Style }) {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    super({
      type: 'placeholder',
      command: '\\placeholder',
      mode: options?.mode ?? 'math',
      style: options?.style,
    });
    this.captureSelection = true;
  }

  static fromJson(json: AtomJson): PlaceholderAtom {
    return new PlaceholderAtom(json as any);
  }

  toJson(): AtomJson {
    return super.toJson();
  }

  render(context: Context): Box {
    let result: Box;
    this.value = context.placeholderSymbol;
    if (typeof context.renderPlaceholder === 'function')
      result = context.renderPlaceholder(context) as Box;
    else result = this.createBox(context);

    if (this.caret) result.classes += ' ML__placeholder-selected';

    return result;
  }

  _serialize(options: ToLatexOptions): string {
    if (options.skipPlaceholders) return '';
    return '\\placeholder{}';
  }
}
