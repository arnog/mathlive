import { Atom, AtomType, ToLatexOptions } from '../core/atom-class';
import { Span, height as spanHeight, depth as spanDepth } from '../core/span';
import { Context } from '../core/context';
import { Style } from '../public/core';

export class SubsupAtom extends Atom {
  baseType: AtomType;
  constructor(options?: { baseType?: AtomType; style?: Style }) {
    super('msubsup', { style: options?.style });
    this.baseType = options?.baseType;
  }

  render(context: Context): Span[] {
    // The caret for this atom type is handled by its elements
    const baseType =
      {
        mbin: 'mbin',
        mop: 'mop',
        mrel: 'mrel',
        mopen: 'mopen',
        mclose: 'mclose',
        mpunct: 'mpunct',
        minner: 'minner',
        spacing: 'spacing',
      }[this.baseType] ?? 'mord';
    const result = new Span('\u200B', '', baseType);
    if (context.phantomBase) {
      result.height = spanHeight(context.phantomBase);
      result.depth = spanDepth(context.phantomBase);
    }

    console.assert(!this.limits);

    return [this.attachSupsub(context, result, result.type)];
  }

  toLatex(options: ToLatexOptions): string {
    return this.supsubToLatex(options);
  }
}
