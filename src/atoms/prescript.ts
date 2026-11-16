import { Atom, makeScripts } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import type { AtomJson, CreateAtomOptions } from '../core/types';

/**
 * Scripts before a base, flush right against it: `\prescript{14}{6}{C}`
 * (mathtools), as in an isotope or a tensor index.
 *
 * - `above`: the superscript before the base
 * - `below`: the subscript before the base
 * - `body`: the base
 *
 * Scripts after the base attach to it as they do to any atom.
 */
export class PrescriptAtom extends Atom {
  constructor(
    options: CreateAtomOptions & {
      above?: readonly Atom[];
      below?: readonly Atom[];
      body?: readonly Atom[];
    }
  ) {
    super({ ...options, type: 'prescript', body: options.body ?? [] });
    this.above = options.above ?? [];
    this.below = options.below ?? [];
  }

  static fromJson(json: AtomJson): PrescriptAtom {
    return new PrescriptAtom(json as any);
  }

  /** The scripts come first, as they are drawn: above, below, then the base */
  get children(): readonly Atom[] {
    if (this._children) return this._children;
    const result: Atom[] = [];
    for (const branch of ['above', 'below', 'body'] as const) {
      for (const x of this.branch(branch) ?? []) {
        result.push(...x.children);
        result.push(x);
      }
    }
    this._children = result;
    return result;
  }

  render(context: Context): Box | null {
    const base =
      Atom.createBox(context, this.body, { type: 'ignore' }) ??
      new Box(null, { type: 'ignore' });

    // As mathtools does, the scripts attach to a phantom of the base, so they
    // are placed for its height and depth
    const scripts = makeScripts(context, {
      base,
      superscript: this.above,
      subscript: this.below,
      isCharacterBox: false,
      align: 'right',
    });

    const result = new Box(
      scripts ? [new Box(scripts, { classes: 'ML__msubsup' }), base] : [base],
      { type: 'ord' }
    );
    if (this.caret) result.caret = this.caret;
    return this.bind(context, result);
  }
}
