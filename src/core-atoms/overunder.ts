import { Atom, ToLatexOptions } from '../core/atom-class';
import {
  Span,
  SpanType,
  isSpanType,
  makeSVGSpan,
  makeVlist,
} from '../core/span';
import { METRICS as FONTMETRICS } from '../core/font-metrics';
import { MATHSTYLES } from '../core/mathstyle';
import { Context } from '../core/context';
import { Style } from '../public/core';
import { makeNullFence } from '../core/delimiters';

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
      subsupPlacement?: 'over-under';
      style: Style;
      toLatexOverride?: (
        atom: OverunderAtom,
        options: ToLatexOptions
      ) => string;
    }
  ) {
    super('overunder', {
      command,
      toLatexOverride: options.toLatexOverride,
      style: options.style,
    });
    this.skipBoundary = options.skipBoundary ?? true;
    this.subsupPlacement = options.subsupPlacement ? 'over-under' : undefined;

    this.body = options.body;
    this.svgAbove = options.svgAbove;
    this.svgBelow = options.svgBelow;
    this.svgBody = options.svgBody;
    this.above = options.above;
    this.below = options.below;
  }

  render(context: Context): Span {
    const body: Span[] = this.svgBody
      ? [makeSVGSpan(this.svgBody)]
      : Atom.render(context, this.body);
    const annotationStyle = context.clone({
      mathstyle: MATHSTYLES.scriptstyle,
    });
    let above: Span;
    let below: Span;
    if (this.svgAbove) {
      above = makeSVGSpan(this.svgAbove);
    } else if (this.above) {
      above = new Span(Atom.render(annotationStyle, this.above));
    }

    if (this.svgBelow) {
      below = makeSVGSpan(this.svgBelow);
    } else if (this.below) {
      below = new Span(Atom.render(annotationStyle, this.below));
    }

    if (above && below) {
      // Pad the above and below if over a "base"
      below.left = 0.3;
      below.right = 0.3;
      above.left = 0.3;
      above.right = 0.3;
    }

    let result = makeOverunderStack(
      context,
      body,
      above,
      below,
      isSpanType(this.type) ? this.type : 'mrel'
    );
    if (this.superscript || this.subscript) {
      result = this.attachLimits(context, result, 0, 0);
    }

    if (this.caret) result.caret = this.caret;
    // Bind the generated span so its components can be selected
    return this.bind(context, result);
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
  nucleus: Span[],
  above: Span,
  below: Span,
  type: SpanType
): Span {
  // If nothing above and nothing below, nothing to do.
  if (!above && !below) {
    return new Span(nucleus, { classes: 'op-over-under', type });
    // Return isArray(nucleus) ? makeSpan(nucleus) : nucleus;
  }

  let aboveShift = 0;
  let belowShift = 0;

  if (above) {
    above.height += FONTMETRICS.bigOpSpacing5;
    aboveShift = Math.max(
      FONTMETRICS.bigOpSpacing1,
      FONTMETRICS.bigOpSpacing3 - above.depth
    );
  }

  if (below) {
    below.height += FONTMETRICS.bigOpSpacing5;
    belowShift = Math.max(
      FONTMETRICS.bigOpSpacing2,
      FONTMETRICS.bigOpSpacing4 - below.height
    );
  }

  let result = null;
  const wrappedNucleus = new Span([
    makeNullFence(context, 'mopen'),
    ...nucleus,
    makeNullFence(context, 'mclose'),
  ]);

  if (below && above) {
    const bottom = below.height + below.depth + wrappedNucleus.depth;

    result = makeVlist(
      context,
      [
        0,
        below,
        belowShift,
        wrappedNucleus,
        aboveShift,
        above,
        FONTMETRICS.bigOpSpacing2,
      ],
      'bottom',
      { initialPos: bottom }
    );
    // result.height = result.height - belowShift;
    // result.depth = belowShift;
  } else if (below && !above) {
    result = makeVlist(context, [0, below, belowShift, wrappedNucleus], 'top', {
      initialPos: wrappedNucleus.height,
    });
  } else if (above && !below) {
    result = makeVlist(
      context,
      [wrappedNucleus.depth, wrappedNucleus, aboveShift, above],
      'bottom',
      { initialPos: wrappedNucleus.depth }
    );
    result.height = result.height - wrappedNucleus.depth;
    result.depth = wrappedNucleus.depth;
  }

  return new Span(result, { classes: 'op-over-under', type });
}
