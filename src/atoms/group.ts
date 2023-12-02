import type { ParseMode, Style } from '../public/core-types';

import { Atom } from '../core/atom-class';
import type { Context } from '../core/context';
import type { Box } from '../core/box';
import type { AtomJson, BoxType, ToLatexOptions } from '../core/types';
import { getDefinition } from '../latex-commands/definitions-utils';

export class GroupAtom extends Atom {
  private boxType?: BoxType;

  constructor(arg: Atom[], mode: ParseMode, style?: Style) {
    super({ type: 'group', mode, style });
    this.body = arg;

    // Non-empty groups introduce a break in the
    // inter-box spacing. Empty groups (`{}`) do not.
    this.boxType = arg.length > 1 ? 'ord' : 'ignore';

    this.skipBoundary = true;
    this.displayContainsHighlight = false;

    // French decimal point, i.e. `{,}`
    if (arg && arg.length === 1 && arg[0].command === ',')
      this.captureSelection = true;
  }

  static fromJson(json: AtomJson): GroupAtom {
    return new GroupAtom(json.body, json.mode, json.style);
  }

  render(context: Context): Box | null {
    const box = Atom.createBox(context, this.body, { type: this.boxType });
    if (!box) return null;
    if (this.caret) box.caret = this.caret;
    // Need to bind the group so that the DOM element can be matched
    // and the atom iterated recursively. Otherwise, it behaves
    // as if `captureSelection === true`
    return this.bind(context, box);
  }

  _serialize(options: ToLatexOptions): string {
    if (
      !(
        options.expandMacro ||
        options.skipStyles ||
        options.skipPlaceholders
      ) &&
      typeof this.verbatimLatex === 'string'
    )
      return this.verbatimLatex;
    const def = getDefinition(this.command, this.mode);
    if (def?.serialize) return def.serialize(this, options);

    return `{${this.bodyToLatex(options)}}`;
  }
}
