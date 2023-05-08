import type { LatexValue, Style } from '../public/core-types';

import { Atom, AtomJson } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';

export class BoxAtom extends Atom {
  readonly framecolor?: LatexValue;
  readonly backgroundcolor?: LatexValue;
  readonly padding?: LatexValue;
  readonly raise?: LatexValue; // Vertical offset (used by \raisebox)
  readonly border?: string;

  constructor(
    command: string,
    body: Atom[],
    options: {
      framecolor?: LatexValue;
      backgroundcolor?: LatexValue;
      padding?: LatexValue;
      raise?: LatexValue;
      border?: string;
      style: Style;
    }
  ) {
    super({ type: 'box', command, style: options.style });
    this.body = body;

    this.framecolor = options.framecolor;
    this.backgroundcolor = options.backgroundcolor;
    this.padding = options.padding;
    this.border = options.border;
  }

  static fromJson(json: { [key: string]: any }): BoxAtom {
    return new BoxAtom(json.command, json.body, json as any);
  }

  toJson(): AtomJson {
    return {
      ...super.toJson(),
      framecolor: this.framecolor,
      backgroundcolor: this.backgroundcolor,
      padding: this.padding,
      raise: this.raise,
      border: this.border,
    };
  }

  render(parentContext: Context): Box | null {
    const context = new Context({ parent: parentContext }, this.style);

    const fboxsep = context.getRegisterAsEm('fboxsep');

    // The padding extends outside of the base
    const padding = this.padding ? context.toEm(this.padding) : fboxsep;

    // Base is the main content "inside" the box
    const base = Atom.createBox(parentContext, this.body, { type: 'ord' });
    if (!base) return null;

    let borderWidth = '';
    if (this.framecolor)
      borderWidth = `${context.getRegisterAsEm('fboxrule')}em`;
    else if (this.border) borderWidth = lineWidth(this.border);

    // This box will represent the box (background and border).
    // It's positioned to overlap the base.
    // The 'ML__box' class is required to prevent the box from being omitted
    // during rendering (it looks like an empty, no-op box)
    const box = new Box(null, { classes: 'ML__box' });
    box.height = base.height + padding;
    box.depth = base.depth + padding;
    box.setStyle('box-sizing', 'border-box');
    box.setStyle('position', 'absolute');
    if (!borderWidth) box.setStyle('bottom', padding, 'em');
    else box.setStyle('bottom', `calc(${padding}em - 2 * ${borderWidth})`);

    box.setStyle('height', box.height + box.depth, 'em');
    if (padding === 0) box.setStyle('width', '100%');
    else {
      box.setStyle('width', `calc(100% + ${2 * padding}em)`);
      box.setStyle('left', -padding, 'em');
    }

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

    // The padding adds to the width and height of the pod
    result.height = base.height + padding;
    result.depth = base.depth + padding;
    result.left = padding;
    result.right = padding;
    result.setStyle('height', base.height + base.depth + 2 * padding, 'em');
    result.setStyle('margin-top', -padding, 'em');
    result.setStyle('top', base.depth - base.height + 2 * padding, 'em');
    result.setStyle('vertical-align', base.depth + 2 * padding, 'em');

    if (this.caret) result.caret = this.caret;

    return this.attachSupsub(parentContext, { base: result });
  }
}

function lineWidth(s: string): string {
  const m = s.match(/[\d]+(\.[\d]+)?[a-zA-Z]+/);
  if (m) return m[0];
  return '';
}
