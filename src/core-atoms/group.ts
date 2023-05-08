import type { MathstyleName, ParseMode, Style } from '../public/core-types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Context } from '../core/context';
import type { Box } from '../core/box';
import type { BoxType } from '../core/types';
import { Argument } from '../core-definitions/definitions-utils';

export class GroupAtom extends Atom {
  boxType?: BoxType;
  mathstyleName?: MathstyleName;

  latexOpen?: string;
  latexClose?: string;

  constructor(
    arg: Atom[] | undefined,
    options?: {
      args?: (Argument | null)[];
      mode?: ParseMode;
      style?: Style;
      boxType?: BoxType;
      mathstyleName?: MathstyleName;
      latexOpen?: string;
      latexClose?: string;
      captureSelection?: boolean;
    }
  ) {
    super('group', {
      args: options?.args,
      mode: options?.mode ?? 'math',
      style: options?.style,
    });
    this.body = arg;
    this.mathstyleName = options?.mathstyleName;

    this.latexOpen = options?.latexOpen;
    this.latexClose = options?.latexClose;

    this.boxType = options?.boxType;
    this.skipBoundary = true;
    this.captureSelection = options?.captureSelection ?? false;
    this.displayContainsHighlight = false;

    // French decimal point
    if (arg && arg.length === 1 && arg[0].command === ',')
      this.captureSelection = true;
  }

  static fromJson(json: AtomJson): GroupAtom {
    return new GroupAtom(json.body, json as any);
  }

  toJson(): AtomJson {
    const result: { [key: string]: any } = {};
    if (this.mathstyleName) result.mathstyleName = this.mathstyleName;
    if (this.latexOpen) result.latexOpen = this.latexOpen;
    if (this.latexClose) result.latexClose = this.latexClose;
    if (this.boxType) result.boxType = this.boxType;

    return { ...super.toJson(), ...result };
  }

  render(context: Context): Box | null {
    // The scope of the context is this group, so clone it
    // so that any changes to it will be discarded when finished
    // with this group.
    // Note that the mathstyle property is optional and could be undefined
    // If that's the case, clone() returns a clone of the
    // context with the same mathstyle.
    const localContext = new Context(
      { parent: context, mathstyle: this.mathstyleName },
      this.style
    );
    const box = Atom.createBox(localContext, this.body, {
      type: this.boxType,
      mode: this.mode,
      style: { backgroundColor: this.style.backgroundColor },
    });
    if (!box) return null;
    if (this.caret) box.caret = this.caret;
    // Need to bind the group so that the DOM element can be matched
    // and the atom iterated recursively. Otherwise, it behaves
    // as if `captureSelection === true`
    return this.bind(context, box);
  }

  serialize(options: ToLatexOptions): string {
    const body = super.serialize(options);

    if (typeof this.latexOpen === 'string')
      return this.latexOpen + body + this.latexClose;

    return body;
  }
}
