import type { GlobalContext, Style } from '../core/types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { charToLatex } from '../core-definitions/definitions-utils';

export class TextAtom extends Atom {
  constructor(
    command: string,
    value: string,
    style: Style,
    context: GlobalContext
  ) {
    super('text', context, {
      command,
      mode: 'text',
      displayContainsHighlight: true,
    });
    this.value = value;
    this.verbatimLatex = value;
    this.applyStyle(style);
  }

  static fromJson(json: AtomJson, context: GlobalContext): TextAtom {
    return new TextAtom(json.command, json.value, json.style, context);
  }

  toJson(): AtomJson {
    return super.toJson();
  }

  render(context: Context): Box {
    const result = this.createBox(context);
    if (this.caret) result.caret = this.caret;
    return result;
  }

  serialize(_options: ToLatexOptions): string {
    return this.verbatimLatex ?? charToLatex('text', this.value.codePointAt(0));
  }
}
