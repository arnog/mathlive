import { Atom } from '../core/atom-class';
import { Span } from '../core/span';
import { Context } from '../core/context';

/*
 * An atom representing a syntactic error, such as an unknown command
 */
export class ErrorAtom extends Atom {
  constructor(value: string) {
    super('error', { value, command: value, mode: 'math' });
    this.latex = value;
  }

  render(context: Context): Span[] {
    const result = this.makeSpan(context, this.value);
    result.classes = 'ML__error';

    if (this.caret) result.caret = this.caret;

    return [result];
  }
}
