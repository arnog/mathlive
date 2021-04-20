import { Atom, ToLatexOptions } from '../core/atom-class';
import { Span, height as spanHeight, depth as spanDepth } from '../core/span';
import { Context } from '../core/context';
import { Style } from '../public/core';

export class SubsupAtom extends Atom {
  constructor(options?: { style?: Style }) {
    super('msubsup', { style: options?.style });
  }

  render(context: Context): Span {
    // The caret for this atom type is handled by its elements

    // The span type of a `subsup` atom is 'supsub' as it doesn't
    // have any special INTER_ATOM_SPACING with its attached atom (previous span)
    const result = new Span('\u200B', { type: 'supsub' });
    if (context.phantomBase) {
      result.height = spanHeight(context.phantomBase);
      result.depth = spanDepth(context.phantomBase);
    }

    console.assert(!this.subsupPlacement);

    return this.attachSupsub(context, result, 'supsub');
  }

  toLatex(options: ToLatexOptions): string {
    return this.supsubToLatex(options);
  }
}
