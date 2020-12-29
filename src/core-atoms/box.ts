import { Atom, ToLatexOptions } from '../core/atom-class';
import { METRICS as FONTMETRICS } from '../core/font-metrics';
import { depth as spanDepth, height as spanHeight, Span } from '../core/span';
import { Context } from '../core/context';
import { Style } from '../public/core';

export class BoxAtom extends Atom {
  readonly framecolor?: string;
  readonly verbatimFramecolor?: string;
  readonly backgroundcolor?: string;
  readonly verbatimBackgroundcolor?: string;
  readonly padding?: number;
  readonly border?: string;

  constructor(
    command: string,
    body: Atom[],
    options: {
      framecolor?: string;
      verbatimFramecolor?: string;
      backgroundcolor?: string;
      verbatimBackgroundcolor?: string;
      padding?: number;
      border?: string;
      style: Style;
      toLatexOverride?: (atom: BoxAtom, options: ToLatexOptions) => string;
    }
  ) {
    super('box', {
      command,
      toLatexOverride: options.toLatexOverride,
      style: options.style,
    });
    this.body = body;

    this.framecolor = options.framecolor;
    this.verbatimFramecolor = options.verbatimBackgroundcolor;
    this.backgroundcolor = options.backgroundcolor;
    this.verbatimBackgroundcolor = options.verbatimBackgroundcolor;
    this.padding = options.padding;
    this.border = options.border;
  }

  render(context: Context): Span[] {
    // The padding extends outside of the base
    const padding =
      typeof this.padding === 'number' ? this.padding : FONTMETRICS.fboxsep;

    // Base is the main content "inside" the box
    const content = new Span(Atom.render(context, this.body), '', 'mord');
    content.setStyle('vertical-align', -spanDepth(content), 'em');
    content.setStyle('height', 0);
    const base = new Span(content, '', 'mord');

    // This span will represent the box (background and border)
    // It's positioned to overlap the base
    // The 'ML__box' class is required to prevent the span from being omitted
    // during rendering (it looks like an empty, no-op span)
    const box = new Span('', 'ML__box');
    box.setStyle('position', 'absolute');

    box.setStyle(
      'height',
      spanHeight(base) + spanDepth(base) + 2 * padding,
      'em'
    );
    if (padding === 0) {
      box.setStyle('width', '100%');
    } else {
      box.setStyle('width', `calc(100% + ${2 * padding}em)`);
    }

    box.setStyle('top', -2 * padding, 'em');
    box.setStyle('left', -padding, 'em');
    box.setStyle('z-index', '-1'); // Ensure the box is *behind* the base
    box.setStyle('box-sizing', 'border-box');

    if (this.backgroundcolor) {
      box.setStyle('background-color', this.backgroundcolor);
    }

    if (this.framecolor) {
      box.setStyle(
        'border',
        `${FONTMETRICS.fboxrule} em solid ${this.framecolor}`
      );
    }

    if (this.border) box.setStyle('border', this.border);

    base.setStyle('display', 'inline-block');
    base.setStyle('height', spanHeight(base) + spanDepth(base), 'em');

    // The result is a span that encloses the box and the base
    const result = new Span([box, base]);
    // Set its position as relative so that the box can be absolute positioned
    // over the base
    result.setStyle('position', 'relative');
    result.setStyle('vertical-align', -padding + spanDepth(base), 'em');

    // The padding adds to the width and height of the pod
    result.height = spanHeight(base) + padding;
    result.depth = spanDepth(base) + padding;
    result.left = padding;
    result.right = padding;
    result.setStyle('height', result.height + result.depth - 2 * padding, 'em');
    result.setStyle('top', -padding, 'em');
    result.setStyle('display', 'inline-block');

    if (this.caret) result.caret = this.caret;

    return [this.attachSupsub(context, result, result.type)];
  }
}
