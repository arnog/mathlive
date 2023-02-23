import { ParseMode, Style } from '../public/core';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context, GlobalContext } from '../core/context';
import { PromptAtom } from './prompt';

export class PlaceholderAtom extends Atom {
  readonly placeholderId?: string;
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
    this.placeholderId = options?.placeholderId;
  }

  static fromJson(json: AtomJson, context: GlobalContext): PlaceholderAtom {
    console.log(json);
    if (json.placeholderId)
      return new PromptAtom(
        context,
        json.placeholderId,
        json.body,
        json as any
      );
    return new PlaceholderAtom(context, json as any);
  }

  toJson(): AtomJson {
    const result = super.toJson();
    if (this.placeholderId) result.placeholderId = this.placeholderId;
    if (this.value === this.context.placeholderSymbol) delete result.value;
    if (this.defaultValue)
      result.defaultValue = this.defaultValue.map((x) => x.toJson());

    return result;
  }

  render(context: Context): Box | null {
    if (typeof context.renderPlaceholder === 'function')
      return context.renderPlaceholder(context, this);

    let classes = '';
    if (this.caret) classes += 'ML__placeholder-selected ';
    if (this.isSelected) classes += ' ML__selected ';
    return this.createBox(context, { classes });
  }

  serialize(options: ToLatexOptions): string {
    let value = this.value;
    if (value === this.context.placeholderSymbol) value = '';
    console.log(value);
    return `\\placeholder{${this.value ?? ''}}`;
  }
}
