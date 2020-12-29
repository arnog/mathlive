import { Atom, ToLatexOptions } from '../core/atom-class';
import { Context } from '../core/context';
import { Span } from '../core/span';

export class MacroAtom extends Atom {
  constructor(macro: string, args: string, body: Atom[]) {
    super('macro', { command: macro });
    this.body = body;
    // Set the `captureSelection` attribute so that the atom is handled
    // as an unbreakable unit
    this.captureSelection = true;
    this.latex = macro + args;
  }

  toLatex(options: ToLatexOptions): string {
    return options.expandMacro ? this.bodyToLatex(options) : this.latex;
  }

  render(context: Context): Span[] {
    const result = new Span(Atom.render(context, this.body), '', 'mord');
    if (this.caret) result.caret = this.caret;
    this.bind(context, result);
    return [result];
  }
}
