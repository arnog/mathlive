import type { Style } from '../public/core-types';

import { Atom, NAMED_BRANCHES, ToLatexOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';

export class SubsupAtom extends Atom {
  constructor(options?: { style?: Style }) {
    super({ type: 'subsup', style: options?.style });
    this.subsupPlacement = 'auto';
  }

  static fromJson(json: { [key: string]: any }): SubsupAtom {
    const result = new SubsupAtom(json as any);
    for (const branch of NAMED_BRANCHES)
      if (json[branch]) result.setChildren(json[branch], branch);

    return result;
  }

  render(context: Context): Box {
    // The box type of a `subsup` atom is 'supsub' as it doesn't
    // have any special INTER_BOX_SPACING with its attached atom (previous box)

    const phantomCtx = new Context({ parent: context, isPhantom: true });
    const leftSibling = this.leftSibling;
    const base = leftSibling.render(phantomCtx) ?? new Box(null);
    const phantom = new Box(null);
    phantom.height = base.height;
    phantom.depth = base.depth;
    // > subscripts and superscripts merely get attached to atoms without
    // > changing the atomic type. -- TeXBook p. 171
    return this.attachSupsub(context, {
      base: phantom,
      isCharacterBox: leftSibling.isCharacterBox(),
      // Set to 'ignore' so that it is ignored during inter-box spacing
      // adjustment.
      type: 'ignore',
    });
  }

  _serialize(options: ToLatexOptions): string {
    return this.supsubToLatex(options);
  }
}
