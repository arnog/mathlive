import { Atom, AtomJson } from '../core/atom-class';
import type { Box } from '../core/box';
import type { Context } from '../core/context';

/*
 * An atom representing a syntactic error, such as an unknown command
 */
export class ErrorAtom extends Atom {
  constructor(value: string) {
    super({ type: 'error', value, command: value, mode: 'math' });
    this.verbatimLatex = value;
  }

  static fromJson(json: AtomJson): ErrorAtom {
    return new ErrorAtom(json.command);
  }

  toJson(): AtomJson {
    return super.toJson();
  }

  render(context: Context): Box {
    const result = this.createBox(context, { classes: 'ML__error' });

    if (this.caret) result.caret = this.caret;

    return result;
  }
}
