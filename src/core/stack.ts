import { Style } from '../public/core';
import { Context } from './context';
import { Span, SpanType } from './span';

export type StackElement = {
  span: Span;
  marginLeft?: number;
  marginRight?: number;
  wrapperClasses?: string[];
  wrapperStyle?: Style;
};

export type StackElementAndShift = StackElement & { shift: number };

// A list of child or kern nodes to be stacked on top of each other (i.e. the
// first element will be at the bottom, and the last at the top).
export type StackChild = StackElement | number;

type StackParam =
  | {
      // Each child contains how much it should be shifted downward.
      individualShift: StackElementAndShift[];
    }
  | {
      // "top": The positionData specifies the topmost point of the vlist (note this
      //        is expected to be a height, so positive values move up).
      top: number;
      children: StackChild[];
    }
  | {
      // "bottom": The positionData specifies the bottommost point of the vlist (note
      //           this is expected to be a depth, so positive values move down).
      bottom: number;
      children: StackChild[];
    }
  | {
      // "shift": The vlist will be positioned such that its baseline is positionData
      //          away from the baseline of the first child which MUST be an
      //          "elem". Positive values move downwards.
      shift: number;
      children: StackChild[];
    }
  | {
      // The vlist is positioned so that its baseline is aligned with the baseline
      // of the first child which MUST be an "elem". This is equivalent to "shift"
      // with positionData=0.
      firstBaseline: StackChild[];
    };

// Computes the updated `children` list and the overall depth.
function getVListChildrenAndDepth(
  params: StackParam
): [
  children: (StackChild | StackElementAndShift)[] | StackChild[],
  depth: number
] {
  if ('individualShift' in params) {
    const oldChildren = params.individualShift;
    let prevChild = oldChildren[0];
    const children: (StackChild | StackElementAndShift)[] = [prevChild];

    // Add in kerns to the list of params.children to get each element to be
    // shifted to the correct specified shift
    const depth = -prevChild.shift - prevChild.span.depth;
    let currPos = depth;
    for (let i = 1; i < oldChildren.length; i++) {
      const child = oldChildren[i];
      const diff = -child.shift - currPos - child.span.depth;
      const size = diff - (prevChild.span.height + prevChild.span.depth);

      currPos = currPos + diff;

      children.push(size);
      children.push(child);

      prevChild = child;
    }

    return [children, depth];
  }

  if ('top' in params) {
    // We always start at the bottom, so calculate the bottom by adding up
    // all the sizes
    let bottom = params.top;
    for (const child of params.children) {
      bottom -=
        typeof child === 'number'
          ? child
          : child.span.height + child.span.depth;
    }
    return [params.children, bottom];
  } else if ('bottom' in params) {
    return [params.children, -params.bottom];
  } else if ('firstBaseline' in params) {
    const firstChild = params.firstBaseline[0];
    if (typeof firstChild === 'number') {
      throw new Error('First child must be an element.');
    }
    return [params.firstBaseline, -firstChild.span.depth];
  } else if ('shift' in params) {
    const firstChild = params.children[0];
    if (typeof firstChild === 'number') {
      throw new Error('First child must be an element.');
    }
    return [params.children, -firstChild.span.depth - params.shift];
  }
  return [null, 0];
}

/**
 * Makes a vertical list by stacking elements and kerns on top of each other.
 * Allows for many different ways of specifying the positioning method.
 *
 * See VListParam documentation above.
 *
 * Return a single row if the stack is entirely above the baseline.
 * Otherwise return 2 rows, the second one representing depth below the baseline.
 * This is necessary to workaround a Safari... behavior (see vlist-s and vlist-t2)
 */
function makeRows(
  params: StackParam
): [rows: Span[], height: number, depth: number] {
  const [children, depth] = getVListChildrenAndDepth(params);

  // Create a strut that is taller than any list item. The strut is added to
  // each item, where it will determine the item's baseline. Since it has
  // `overflow:hidden`, the strut's top edge will sit on the item's line box's
  // top edge and the strut's bottom edge will sit on the item's baseline,
  // with no additional line-height spacing. This allows the item baseline to
  // be positioned precisely without worrying about font ascent and
  // line-height.
  let pstrutSize = 0;
  for (const child of children) {
    if (typeof child !== 'number') {
      const span = child.span;
      pstrutSize = Math.max(pstrutSize, span.maxFontSize, span.height);
    }
  }
  pstrutSize += 2;
  const pstrut = new Span(null, { classes: 'pstrut' });
  pstrut.setStyle('height', pstrutSize, 'em');

  // Create a new list of actual children at the correct offsets
  const realChildren = [];
  let minPos = depth;
  let maxPos = depth;
  let currPos = depth;
  for (const child of children) {
    if (typeof child === 'number') {
      currPos += child;
    } else {
      const span = child.span;
      const classes = child.wrapperClasses ?? [];

      const childWrap = new Span([pstrut, span], {
        classes: classes.join(' '),
        style: child.wrapperStyle,
      });
      childWrap.setStyle('top', -pstrutSize - currPos - span.depth, 'em');
      if (child.marginLeft) {
        childWrap.setStyle('margin-left', child.marginLeft, 'em');
      }
      if (child.marginRight) {
        childWrap.setStyle('margin-right', child.marginRight, 'em');
      }

      realChildren.push(childWrap);
      currPos += span.height + span.depth;
    }
    minPos = Math.min(minPos, currPos);
    maxPos = Math.max(maxPos, currPos);
  }

  // The vlist contents go in a table-cell with `vertical-align:bottom`.
  // This cell's bottom edge will determine the containing table's baseline
  // without overly expanding the containing line-box.
  const vlist = new Span(realChildren, { classes: 'vlist' });
  vlist.setStyle('height', maxPos, 'em');

  // A second row is used if necessary to represent the vlist's depth.
  let rows: Span[];
  if (minPos < 0) {
    // We will define depth in an empty span with display: table-cell.
    // It should render with the height that we define. But Chrome, in
    // contenteditable mode only, treats that span as if it contains some
    // text content. And that min-height over-rides our desired height.
    // So we put another empty span inside the depth strut span.
    const depthStrut = new Span(new Span(null), { classes: 'vlist' });
    depthStrut.setStyle('height', -minPos, 'em');

    // Safari wants the first row to have inline content; otherwise it
    // puts the bottom of the *second* row on the baseline.
    const topStrut = new Span(0x200b, {
      classes: 'vlist-s',
      maxFontSize: 0,
      height: 0,
      depth: 0,
    });

    rows = [
      new Span([vlist, topStrut], { classes: 'vlist-r' }),
      new Span(depthStrut, { classes: 'vlist-r' }),
    ];
  } else {
    rows = [new Span(vlist, { classes: 'vlist-r' })];
  }

  return [rows, maxPos, -minPos];
}

export class Stack extends Span {
  constructor(
    content: StackParam,
    options?: { classes?: string; type?: SpanType }
  ) {
    const [rows, height, depth] = makeRows(content);
    super(rows.length === 1 ? rows[0] : rows, {
      classes:
        (options?.classes ?? '') +
        ' vlist-t' +
        (rows.length === 2 ? ' vlist-t2' : ''),
      height,
      depth,
      type: options?.type,
    });
  }
}

/* Combine a nucleus with an atom above and an atom below. Used to form
 * limits.
 *
 * @param context
 * @param nucleus The base over and under which the atoms will
 * be placed.
 * @param nucleusShift The vertical shift of the nucleus from
 * the baseline.
 * @param slant For operators that have a slant, such as \int,
 * indicate by how much to horizontally offset the above and below atoms
 */
export function makeLimitsStack(
  context: Context,
  options: {
    base: Span;
    baseShift?: number;
    slant?: number;
    above: Span;
    aboveShift?: number;
    below: Span;
    belowShift?: number;
    type?: SpanType;
  }
): Span {
  // If nothing above and nothing below, nothing to do.
  // if (!options.above && !options.below) {
  //   return new Span(options.base, { type: options.spanType ?? 'mop' }).wrap(
  //     context
  //   );
  //   // return options.base;
  // }
  const metrics = context.metrics;

  // IE8 clips \int if it is in a display: inline-block. We wrap it
  // in a new span so it is an inline, and works.
  // @todo: revisit
  const base = new Span(options.base);

  const baseShift = options.baseShift ?? 0;
  const slant = options.slant ?? 0;

  let aboveShift = 0;
  let belowShift = 0;

  if (options.above) {
    aboveShift =
      options.aboveShift ??
      Math.max(
        metrics.bigOpSpacing1,
        metrics.bigOpSpacing3 - options.above.depth
      );
  }

  if (options.below) {
    belowShift =
      options.belowShift ??
      Math.max(
        metrics.bigOpSpacing2,
        metrics.bigOpSpacing4 - options.below.height
      );
  }

  let result: Span | null = null;

  if (options.below && options.above) {
    const bottom =
      metrics.bigOpSpacing5 +
      options.below.height +
      options.below.depth +
      belowShift +
      base.depth +
      baseShift;

    // Here, we shift the limits by the slant of the symbol. Note
    // that we are supposed to shift the limits by 1/2 of the slant,
    // but since we are centering the limits adding a full slant of
    // margin will shift by 1/2 that.
    result = new Stack({
      bottom,
      children: [
        metrics.bigOpSpacing5,
        {
          span: options.below,
          marginLeft: -slant,
          wrapperClasses: ['ML__center'],
        },
        belowShift,
        //  We need to center the base to account for the case where the
        // above/below is wider
        { span: base, wrapperClasses: ['ML__center'] },
        aboveShift,
        {
          span: options.above,
          marginLeft: slant,
          wrapperClasses: ['ML__center'],
        },
        metrics.bigOpSpacing5,
      ],
    }).wrap(context);
  } else if (options.below && !options.above) {
    result = new Stack({
      top: base.height - baseShift,
      children: [
        metrics.bigOpSpacing5,
        {
          span: options.below,
          marginLeft: -slant,
          wrapperClasses: ['ML__center'],
        },
        belowShift,
        { span: base, wrapperClasses: ['ML__center'] },
      ],
    }).wrap(context);
  } else if (!options.below && options.above) {
    const bottom = base.depth + baseShift;

    result = new Stack({
      bottom,
      children: [
        { span: base, wrapperClasses: ['ML__center'] },
        aboveShift,
        {
          span: options.above,
          marginLeft: slant,
          wrapperClasses: ['ML__center'],
        },
        metrics.bigOpSpacing5,
      ],
    }).wrap(context);
  } else {
    const bottom = base.depth + baseShift;
    result = new Stack({
      bottom,
      children: [{ span: base }, metrics.bigOpSpacing5],
    }).wrap(context);
  }
  console.assert(options.type !== undefined);
  return new Span(result, { type: options.type ?? 'mop' });
}
