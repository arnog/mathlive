import type { Style } from '../public/core-types';
import type { GlobalContext } from '../core/types';

import {
  Atom,
  AtomJson,
  NAMED_BRANCHES,
  ToLatexOptions,
} from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';

export class SubsupAtom extends Atom {
  constructor(context: GlobalContext, options?: { style?: Style }) {
    super('subsup', context, { style: options?.style });
  }

  static fromJson(
    json: { [key: string]: any },
    context: GlobalContext
  ): SubsupAtom {
    const result = new SubsupAtom(context, json as any);
    for (const branch of NAMED_BRANCHES)
      if (json[branch]) result.setChildren(json[branch], branch);

    return result;
  }

  toJson(): AtomJson {
    return super.toJson();
  }

  render(context: Context): Box {
    // The caret for this atom type is handled by its elements
    console.assert(!this.subsupPlacement);

    // The box type of a `subsup` atom is 'supsub' as it doesn't
    // have any special INTER_BOX_SPACING with its attached atom (previous box)

    const leftSibling = this.leftSibling;
    const phantomContex = new Context(context, { isPhantom: true });
    const base = leftSibling.render(phantomContex) ?? new Box(null);
    const phantom = new Box(null, { height: base.height, depth: base.depth });
    return this.attachSupsub(context, {
      base: phantom,
      isCharacterBox: leftSibling.isCharacterBox(),
      // Set to 'none' so that it is skipped during inter-box spacing
      // adjustment.
      type: 'none',
    });
  }

  serialize(options: ToLatexOptions): string {
    return this.supsubToLatex(options);
  }
}
