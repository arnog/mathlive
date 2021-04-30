import { Atom, ToLatexOptions } from '../core/atom-class';
import { Context } from '../core/context';
import { Span } from '../core/span';

export class MacroAtom extends Atom {
  macroLatex: string;

  constructor(macro: string, args: string, body: Atom[]) {
    super('macro', { command: macro });
    this.body = body;
    // Set the `captureSelection` attribute so that the atom is handled
    // as an unbreakable unit
    this.captureSelection = true;
    // Don't use verbatimLatex to save the macro, as it can get wiped when
    // the atom is modified (adding super/subscript, for example).
    this.macroLatex = macro + args;
  }

  toLatex(options: ToLatexOptions): string {
    return options.expandMacro ? this.bodyToLatex(options) : this.macroLatex;
  }

  render(context: Context): Span {
    const result = Atom.render(context, this.body);
    if (this.caret) result.caret = this.caret;
    return this.bind(context, result);
  }
}
