import { Atom, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { ParseMode, Style } from '../public/core';

export class PlaceholderAtom extends Atom {
  placeholderId?: string;
  defaultValue?: Atom[];
  constructor(options?: {
    value?: string;
    mode?: ParseMode;
    style?: Style;
    placeholderId?: string;
    default?: Atom[];
  }) {
    super('placeholder', {
      mode: options?.mode,
      style: options?.style,
      value: options?.value,
    });
    this.captureSelection = true;
    this.value = '⬚';
    this.placeholderId = options?.placeholderId;
    this.defaultValue = options?.default;
  }

  render(context: Context): Box {
    if (typeof context.renderPlaceholder === 'function') {
      return context.renderPlaceholder(context, this);
    }
    return this.createBox(context, {
      classes: this.caret ? 'ML__placeholder-selected' : '',
    });
  }

  serialize(_options: ToLatexOptions): string {
    const id = this.placeholderId ? `[${this.placeholderId}]` : '';
    const defaultValue = this.defaultValue
      ? `[${Atom.serialize(this.defaultValue, _options)}}]`
      : '';
    return `\\placeholder${id}${defaultValue}{${this.value ?? ''}}`;
  }
}
