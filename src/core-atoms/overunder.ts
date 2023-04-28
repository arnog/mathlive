import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Box, makeSVGBox } from '../core/box';
import { VBox } from '../core/v-box';
import { Context } from '../core/context';
import { makeNullDelimiter } from '../core/delimiters';
import type { BoxType, PrivateStyle } from '../core/types';

// An `overunder` atom has the following attributes:
// - body: atoms[]: atoms displayed on the base line
// - svgBody: string. A SVG graphic displayed on the base line (if present, the body is ignored)
// - above: atoms[]: atoms displayed above the body
// - svgAbove: string. A named SVG graphic above the element
// - below: atoms[]: atoms displayed below the body
// - svgBelow: string. A named SVG graphic below the element
export class OverunderAtom extends Atom {
  svgAbove?: string;
  svgBelow?: string;
  svgBody?: string;
  boxType: BoxType;
  paddedBody: boolean;
  paddedLabels: boolean;
  constructor(
    command: string,
    options: {
      body?: Atom[];
      above?: Atom[];
      below?: Atom[];
      svgBody?: string;
      svgAbove?: string;
      svgBelow?: string;
      skipBoundary?: boolean;
      style: PrivateStyle;
      boxType?: BoxType;
      supsubPlacement?: 'over-under' | 'adjacent';
      paddedBody?: boolean;
      paddedLabels?: boolean;
      serialize?: (atom: OverunderAtom, options: ToLatexOptions) => string;
    }
  ) {
    super('overunder', {
      command,
      serialize: options.serialize,
      style: options.style,
    });
    this.skipBoundary = options.skipBoundary ?? true;
    this.subsupPlacement = options.supsubPlacement;

    this.body = options.body;
    this.svgAbove = options.svgAbove;
    this.svgBelow = options.svgBelow;
    this.svgBody = options.svgBody;
    this.above = options.above;
    this.below = options.below;
    this.boxType = options.boxType ?? 'ord';
    this.paddedBody = options.paddedBody ?? false;
    this.paddedLabels = options.paddedLabels ?? false;
  }

  static fromJson(json: AtomJson): OverunderAtom {
    return new OverunderAtom(json.command, json as any);
  }

  toJson(): AtomJson {
    const options: { [key: string]: any } = {};
    if (!this.skipBoundary) options.skipBoundary = false;
    if (this.subsupPlacement) options.subsupPlacement = this.subsupPlacement;
    if (this.svgAbove) options.svgAbove = this.svgAbove;
    if (this.svgBelow) options.svgBelow = this.svgBelow;
    if (this.svgBody) options.svgBody = this.svgBody;
    if (this.boxType !== 'ord') options.boxType = this.boxType;
    if (this.paddedBody) options.paddedBody = true;
    if (this.paddedLabels) options.paddedLabels = true;
    return { ...super.toJson(), ...options };
  }

  /**
   * Combine a base with an atom above and an atom below.
   *
   * See http://tug.ctan.org/macros/latex/required/amsmath/amsmath.dtx
   *
   * > \newcommand{\overset}[2]{\binrel@{#2}%
   * > \binrel@@{\mathop{\kern\z@#2}\limits^{#1}}}
   *
   */

  render(parentContext: Context): Box | null {
    let body = this.svgBody
      ? makeSVGBox(this.svgBody)
      : Atom.createBox(parentContext, this.body, { type: 'skip' });
    const annotationContext = new Context(
      { parent: parentContext, mathstyle: 'scriptstyle' },
      this.style
    );
    let above: Box | null = null;
    // let aboveShift: number;
    if (this.svgAbove) above = makeSVGBox(this.svgAbove);
    // aboveShift = 0;
    // aboveShift = -above.depth;
    else if (this.above)
      above = Atom.createBox(annotationContext, this.above, { type: 'skip' });

    let below: Box | null = null;
    // let belowShift: number;
    if (this.svgBelow) below = makeSVGBox(this.svgBelow);
    // belowShift = 0;
    // belowShift = below.height;
    else if (this.below)
      below = Atom.createBox(annotationContext, this.below, { type: 'skip' });

    if (this.paddedBody) {
      // The base of \overset are padded, but \overbrace aren't
      body = new Box(
        [
          makeNullDelimiter(parentContext, 'open'),
          body,
          makeNullDelimiter(parentContext, 'close'),
        ],
        { type: 'skip' }
      );
    }

    // this.bind(parentContext, base);

    let base = makeOverunderStack(parentContext, {
      base: body,
      above,
      // aboveShift,
      below,
      // belowShift,
      type:
        this.boxType === 'bin' || this.boxType === 'rel' ? this.boxType : 'ord',
      paddedAboveBelow: this.paddedLabels,
    });

    if (!base) return null;

    if (this.subsupPlacement === 'over-under')
      base = this.attachLimits(parentContext, { base, type: base.type });
    else base = this.attachSupsub(parentContext, { base });

    if (this.caret) base.caret = this.caret;

    // Bind the generated box so its components can be selected
    return this.bind(parentContext, base);
  }
}

/**
 * Combine a nucleus with an atom above and an atom below. Used to form
 * stacks for the 'overunder' atom type .
 *
 * @param nucleus The base over and under which the atoms will
 * be placed.
 * @param type The type ('mop', 'mrel', etc...) of the result
 */
function makeOverunderStack(
  context: Context,
  options: {
    base: Box | null;
    above: Box | null;
    below: Box | null;
    type: BoxType;
    paddedAboveBelow: boolean;
  }
): Box | null {
  // If no base, nothing to do
  if (!options.base) return null;
  // If nothing above and nothing below, nothing to do.
  if (!options.above && !options.below) {
    const box = new Box(options.base, { type: options.type });
    box.setStyle('position', 'relative');
    return box;
  }

  let aboveShift = 0;

  if (options.above)
    aboveShift = -options.above.depth + context.metrics.bigOpSpacing2; // Empirical

  let result: Box | null = null;
  const base = options.base;

  const baseShift = 0;
  // (wrappedNucleus.height - wrappedNucleus.depth) / 2 -
  // context.mathstyle.metrics.axisHeight;

  const classes = ['ML__center'];
  if (options.paddedAboveBelow) classes.push('ML__label_padding');

  if (options.below && options.above) {
    const bottom =
      context.metrics.bigOpSpacing5 +
      options.below.height +
      options.below.depth +
      base.depth +
      baseShift;

    result = new VBox({
      bottom,
      children: [
        context.metrics.bigOpSpacing5,
        { box: options.below, classes },
        { box: base, classes: ['ML__center'] },
        aboveShift,
        { box: options.above, classes },
        context.metrics.bigOpSpacing5,
      ],
    });
  } else if (options.below) {
    result = new VBox({
      top: base.height - baseShift,
      children: [
        context.metrics.bigOpSpacing5,
        { box: options.below, classes },
        { box: base, classes: ['ML__center'] },
      ],
    });
  } else if (options.above) {
    result = new VBox({
      bottom: base.depth + baseShift,
      children: [
        // base.depth,
        { box: base, classes: ['ML__center'] },
        aboveShift,
        { box: options.above, classes },
        context.metrics.bigOpSpacing5,
      ],
    });
  }

  return new Box(result, { type: options.type });
}
