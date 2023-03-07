import { ParseMode, Style } from '../public/core';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context, GlobalContext } from '../core/context';

export class PlaceholderAtom extends Atom {
  readonly defaultValue?: Atom[];
  constructor(
    context: GlobalContext,
    options?: {
      value?: string;
      mode?: ParseMode;
      style?: Style;
      placeholderId?: string;
    }
  ) {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const value = options?.value || context.placeholderSymbol;
    super('placeholder', context, {
      mode: options?.mode ?? 'math',
      style: options?.style,
      value,
      command: '\\placeholder',
    });
    this.captureSelection = true;
  }

  static fromJson(json: AtomJson, context: GlobalContext): PlaceholderAtom {
    return new PlaceholderAtom(context, json as any);
  }

  toJson(): AtomJson {
    const result = super.toJson();
    if (this.value === this.context.placeholderSymbol) delete result.value;
    if (this.defaultValue)
      result.defaultValue = this.defaultValue.map((x) => x.toJson());

    return result;
  }

  render(context: Context): Box {
    if (typeof context.renderPlaceholder === 'function')
      return context.renderPlaceholder(context, this);

    let classes = '';
    if (this.caret) classes += 'ML__placeholder-selected ';
    if (this.isSelected) classes += ' ML__selected ';
    return this.createBox(context, { classes });
  }

  serialize(_options: ToLatexOptions): string {
    let value = this.value;
    if (value === this.context.placeholderSymbol) value = '';
    return `\\placeholder{${this.value}}`;
  }
}
