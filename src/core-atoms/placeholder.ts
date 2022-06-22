import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { ParseMode, Style } from '../public/core';

const PLACEHOLDER_STRING = '■';
//'■' U+25A0 BLACK SQUARE
//'▢' U+25A2 WHITE SQUARE WITH ROUNDED CORNERS
//'⬚' U+2B1A DOTTED SQUARE

export class PlaceholderAtom extends Atom {
  readonly placeholderId?: string;
  readonly defaultValue?: Atom[];
  constructor(options?: {
    value?: string;
    mode?: ParseMode;
    style?: Style;
    placeholderId?: string;
    default?: Atom[];
  }) {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const value = options?.value || PLACEHOLDER_STRING;
    super('placeholder', {
      mode: options?.mode ?? 'math',
      style: options?.style,
      value: value,
      command: options?.value
        ? `\\placeholder{${options.value}}`
        : '\\placeholder{}',
    });
    this.captureSelection = true;
    this.placeholderId = options?.placeholderId;
    this.defaultValue = options?.default;
  }

  static fromJson(json: AtomJson): PlaceholderAtom {
    return new PlaceholderAtom(json as any);
  }

  toJson(): AtomJson {
    const result = super.toJson();
    if (this.placeholderId) result.placeholderId = this.placeholderId;
    if (this.value === PLACEHOLDER_STRING) delete result.value;
    if (this.defaultValue)
      result.defaultValue = this.defaultValue.map((x) => x.toJson());

    return result;
  }

  render(context: Context): Box {
    if (typeof context.renderPlaceholder === 'function')
      return context.renderPlaceholder(context, this);

    return this.createBox(context, {
      classes: this.caret ? 'ML__placeholder-selected' : '',
    });
  }

  serialize(options: ToLatexOptions): string {
    let value = this.value ?? '';
    if (value === PLACEHOLDER_STRING) value = '';
    const id = this.placeholderId ? `[${this.placeholderId}]` : '';
    const defaultValue = this.defaultValue
      ? `[${Atom.serialize(this.defaultValue, options)}]`
      : '';
    return `\\placeholder${id}${defaultValue}{${value}}`;
  }
}
