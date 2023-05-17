import type { LatexValue } from '../public/core-types';

import { Atom, AtomJson, CreateAtomOptions } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';

export class BoxAtom extends Atom {
  readonly framecolor?: LatexValue;
  readonly backgroundcolor?: LatexValue;
  readonly padding?: LatexValue;
  readonly offset?: LatexValue; // Vertical offset (used by \raisebox)
  readonly border?: string;

  constructor(
    options: CreateAtomOptions & {
      body: Atom[];
      framecolor?: LatexValue;
      backgroundcolor?: LatexValue;
      padding?: LatexValue;
      offset?: LatexValue;
      border?: string;
    }
  ) {
    super({
      mode: options.mode,
      command: options.command,
      style: options.style,
      body: options.body,
      type: 'box',
    });

    this.framecolor = options.framecolor;
    this.backgroundcolor = options.backgroundcolor;
    this.padding = options.padding;
    this.offset = options.offset;
    this.border = options.border;
  }

  static fromJson(json: { [key: string]: any }): BoxAtom {
    return new BoxAtom(json as any);
  }

  toJson(): AtomJson {
    return {
      ...super.toJson(),
      framecolor: this.framecolor,
      backgroundcolor: this.backgroundcolor,
      padding: this.padding,
      offset: this.offset,
      border: this.border,
    };
  }

  render(parentContext: Context): Box | null {
    // Base is the main content "inside" the box
    const base = Atom.createBox(parentContext, this.body, { type: 'ord' });
    if (!base) return null;

    const offset = parentContext.toEm(this.offset ?? { dimension: 0 });
    base.depth += offset;
    // base.setStyle('display', 'inline-block');
    // base.setStyle('position', 'relative');
    // base.setStyle('background-color', 'rgba(255, 0, 0, .2)');
    // base.setStyle('vertical-align', raise, 'em');

    const context = new Context({ parent: parentContext }, this.style);

    // The padding extends outside of the base
    const padding = context.toEm(this.padding ?? { register: 'fboxsep' });

    // let borderWidth = '';
    // if (this.framecolor)
    //   borderWidth = `${context.getRegisterAsEm('fboxrule')}em`;
    // else if (this.border) borderWidth = lineWidth(this.border);

    // This box will represent the box (background and border).
    // It's positioned to overlap the base.
    // The 'ML__box' class is required to prevent the box from being omitted
    // during rendering (it looks like an empty, no-op box)
    const box = new Box(null, { classes: 'ML__box' });
    box.height = base.height + padding;
    box.depth = base.depth + padding;
    box.setStyle('box-sizing', 'border-box');
    box.setStyle('position', 'absolute');
    box.setStyle('top', -padding + 0.3, 'em'); // empirical

    box.setStyle('height', box.height + box.depth, 'em');
    box.setStyle('left', 0);
    box.setStyle('width', '100%');

    if (this.backgroundcolor) {
      box.setStyle(
        'background-color',
        context.toColor(this.backgroundcolor) ?? 'transparent'
      );
    }
    if (this.framecolor) {
      box.setStyle(
        'border',
        `${context.getRegisterAsEm('fboxrule', 2)}em solid ${
          context.toColor(this.framecolor) ?? 'black'
        }`
      );
    }

    if (this.border) box.setStyle('border', this.border);
    // box.setStyle('top', /* width of the border */);

    base.setStyle('display', 'inline-block');
    base.setStyle('position', 'relative');
    base.setStyle('height', base.height + base.depth, 'em');
    base.setStyle('vertical-align', -base.height, 'em');

    // The result is a box that encloses the box and the base
    const result = new Box([box, base]);
    // Set its position as relative so that the box can be absolute positioned
    // over the base
    result.setStyle('display', 'inline-block');
    result.setStyle('position', 'relative');
    result.setStyle('line-height', 0);

    // The padding adds to the depth, height and width of the box
    result.height = base.height + padding + (offset > 0 ? offset : 0);
    result.depth = base.depth + padding + (offset < 0 ? -offset : 0);
    result.setStyle('padding-left', padding, 'em');
    result.setStyle('padding-right', padding, 'em');
    result.setStyle(
      'height',
      base.height + base.depth + 2 * padding + Math.abs(offset),
      'em'
    );
    result.setStyle('margin-top', -padding, 'em');
    result.setStyle(
      'top',
      base.depth - base.height + 2 * padding - offset,
      'em'
    );
    result.setStyle('vertical-align', base.depth + 2 * padding, 'em');

    if (this.caret) result.caret = this.caret;

    return this.attachSupsub(parentContext, { base: result });
  }
}

// function lineWidth(s: string): string {
//   const m = s.match(/[\d]+(\.[\d]+)?[a-zA-Z]+/);
//   if (m) return m[0];
//   return '';
// }
