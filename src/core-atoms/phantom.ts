import type { Style, GlobalContext } from '../core/types';

import { Atom, AtomJson } from '../core/atom-class';
import { Box } from '../core/box';
import { VBox } from '../core/v-box';
import { Context } from '../core/context';

export class PhantomAtom extends Atom {
  private readonly isInvisible: boolean;
  private readonly smashHeight: boolean;
  private readonly smashDepth: boolean;
  private readonly smashWidth: boolean;
  constructor(
    command: string,
    body: Atom[],
    context: GlobalContext,
    options: {
      smashHeight?: boolean;
      smashDepth?: boolean;
      smashWidth?: boolean;
      isInvisible?: boolean;
      style: Style;
    }
  ) {
    super('phantom', context, { command, style: options.style });
    this.captureSelection = true;
    this.body = body;
    this.isInvisible = options.isInvisible ?? false;
    this.smashDepth = options.smashDepth ?? false;
    this.smashHeight = options.smashHeight ?? false;
    this.smashWidth = options.smashWidth ?? false;
  }

  static fromJson(json: AtomJson, context: GlobalContext): PhantomAtom {
    return new PhantomAtom(json.command, json.body, context, json as any);
  }

  toJson(): AtomJson {
    const options: { [key: string]: any } = {};
    if (this.isInvisible) options.isInvisible = true;
    if (this.smashDepth) options.smashDepth = true;
    if (this.smashHeight) options.smashHeight = true;
    if (this.smashWidth) options.smashWidth = true;
    return { ...super.toJson(), ...options };
  }

  render(context: Context): Box | null {
    const phantom = new Context(context, { isPhantom: true });

    if (!this.smashDepth && !this.smashHeight && !this.smashWidth) {
      console.assert(this.isInvisible);
      return Atom.createBox(phantom, this.body, { classes: 'inner' });
    }

    const content = Atom.createBox(
      this.isInvisible ? phantom : context,
      this.body
    );

    if (!content) return null;

    if (this.smashWidth) {
      const fix = new Box(null, { classes: 'fix' });
      return new Box([content, fix], { classes: 'rlap' }).wrap(context);
    }

    if (!this.smashHeight && !this.smashDepth) return content;

    if (this.smashHeight) content.height = 0;
    if (this.smashDepth) content.depth = 0;
    if (content.children) {
      for (const box of content.children) {
        if (this.smashHeight) box.height = 0;
        if (this.smashDepth) box.depth = 0;
      }
    }
    // We create a stack to suppress the HTML line height by setting
    // the display to 'table-cell' which prevents the browser from
    // acting on that height.
    return new VBox(
      { firstBaseline: [{ box: content }] },
      { type: 'mord' }
    ).wrap(context);
  }
}
