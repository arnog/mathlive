import { Atom, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { ParseMode, Style } from '../public/core';

export class PlaceholderAtom extends Atom {
  constructor(options?: { value?: string; mode?: ParseMode; style?: Style }) {
    super('placeholder', {
      mode: options?.mode,
      style: options?.style,
      value: options?.value,
    });
    this.captureSelection = true;
    this.value = '⬚';
  }

  render(context: Context): Box {
    if (typeof context.renderPlaceholder === 'function') {
      return context.renderPlaceholder(context);
    }
    return this.createBox(context, {
      classes: this.caret ? 'ML__placeholder-selected' : '',
    });
  }

  serialize(_options: ToLatexOptions): string {
    return `\\placeholder{${this.value ?? ''}}`;
  }
}
