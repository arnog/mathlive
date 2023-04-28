import type { Style } from '../public/core-types';

import {
  Atom,
  AtomJson,
  NAMED_BRANCHES,
  ToLatexOptions,
} from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';

export class SubsupAtom extends Atom {
  constructor(options?: { style?: Style }) {
    super('subsup', { style: options?.style });
    this.subsupPlacement = 'auto';
  }

  static fromJson(json: { [key: string]: any }): SubsupAtom {
    const result = new SubsupAtom(json as any);
    for (const branch of NAMED_BRANCHES)
      if (json[branch]) result.setChildren(json[branch], branch);

    return result;
  }

  toJson(): AtomJson {
    return super.toJson();
  }

  render(context: Context): Box {
    // The box type of a `subsup` atom is 'supsub' as it doesn't
    // have any special INTER_BOX_SPACING with its attached atom (previous box)

    const phantomContex = new Context({ parent: context, isPhantom: true });
    const leftSibling = this.leftSibling;
    const base = leftSibling.render(phantomContex) ?? new Box(null);
    const phantom = new Box(null, { height: base.height, depth: base.depth });
    // > subscripts and superscripts merely get attached to atoms without
    // > changing the atomic type. -- TeXBook p. 171
    return this.attachSupsub(context, {
      base: phantom,
      isCharacterBox: leftSibling.isCharacterBox(),
      // Set to 'skip' so that it is skipped during inter-box spacing
      // adjustment.
      type: 'skip',
    });
  }

  serialize(options: ToLatexOptions): string {
    return this.supsubToLatex(options);
  }
}
