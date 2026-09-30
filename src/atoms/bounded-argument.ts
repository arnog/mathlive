import type { ParseMode, Style } from '../public/core-types';
import type { Context } from '../core/context';
import { Atom } from '../core/atom-class';
import type { Box } from '../core/box';
import type { ToLatexOptions } from 'core/types';
import { PlaceholderAtom } from './placeholder';
import { PromptAtom } from './prompt';

/**
 * A bound that behaves like ordinary content while retaining an empty slot
 * when its last character is deleted. This keeps typed bounded operators as
 * editable as MathLive's `#?` templates without drawing a prompt box around
 * the initial argument.
 */
export class BoundedArgumentAtom extends PromptAtom {
  constructor(body: readonly Atom[], options?: { mode?: ParseMode; style?: Style }) {
    super(undefined, undefined, false, body, options);
    // Keep this as an ordinary editable math atom for navigation/deletion;
    // the PromptAtom base only supplies the branch/body machinery.
    this.type = 'mord';
    this.captureSelection = false;
  }

  render(context: Context): Box | null {
    const hasContent = this.body?.some((atom) => atom.type !== 'first') ?? false;
    const box = hasContent
      ? Atom.createBox(context, this.body)
      : new PlaceholderAtom({ mode: this.mode, style: this.style }).render(context);
    return box ? this.bind(context, box) : null;
  }

  _serialize(options: ToLatexOptions): string {
    const hasContent = this.body?.some((atom) => atom.type !== 'first') ?? false;
    return hasContent ? this.bodyToLatex(options) : '\\placeholder{}';
  }
}
