import { Atom, ToLatexOptions } from '../core/atom-class';
import { Span } from '../core/span';
import { Context } from '../core/context';
import { Style } from '../public/core';

export class SubsupAtom extends Atom {
  constructor(options?: { style?: Style }) {
    super('msubsup', { style: options?.style });
  }

  render(context: Context): Span {
    // The caret for this atom type is handled by its elements
    console.assert(!this.subsupPlacement);

    // The span type of a `subsup` atom is 'supsub' as it doesn't
    // have any special INTER_ATOM_SPACING with its attached atom (previous span)

    const phantomContex = new Context(context, { isPhantom: true });
    const base = this.leftSibling.render(phantomContex) ?? new Span(null);
    const phantom = new Span(null, { height: base.height, depth: base.depth });
    return this.attachSupsub(context, {
      base: phantom,
      isCharacterBox: this.leftSibling.isCharacterBox(),
      // Set to 'supsub' so that it is skipped when walking the
      // atom to adjust for spacing.
      type: 'supsub',
    });
  }

  toLatex(options: ToLatexOptions): string {
    return this.supsubToLatex(options);
  }
}
