import { Style } from '../public/core';
import { Context } from './context';
import { Box, BoxType } from './box';

export type VBoxElement = {
  box: Box;
  marginLeft?: number;
  marginRight?: number;
  classes?: string[];
  style?: Style;
};

export type VBoxElementAndShift = VBoxElement & { shift: number };

// A list of child or kern nodes to be stacked on top of each other (i.e. the
// first element will be at the bottom, and the last at the top).
export type VBoxChild = VBoxElement | number;

type VBoxParam =
  | {
      // Each child contains how much it should be shifted downward.
      individualShift: VBoxElementAndShift[];
    }
  | {
      // "top": The positionData specifies the topmost point of the vlist (note this
      //        is expected to be a height, so positive values move up).
      top: number;
      children: VBoxChild[];
    }
  | {
      // "bottom": The positionData specifies the bottommost point of the vlist (note
      //           this is expected to be a depth, so positive values move down).
      bottom: number;
      children: VBoxChild[];
    }
  | {
      // "shift": The vlist will be positioned such that its baseline is positionData
      //          away from the baseline of the first child which MUST be an
      //          "elem". Positive values move downwards.
      shift: number;
      children: VBoxChild[];
    }
  | {
      // The vlist is positioned so that its baseline is aligned with the baseline
      // of the first child which MUST be an "elem". This is equivalent to "shift"
      // with positionData=0.
      firstBaseline: VBoxChild[];
    };

// Computes the updated `children` list and the overall depth.
function getVListChildrenAndDepth(
  params: VBoxParam
): [
  children: null | (VBoxChild | VBoxElementAndShift)[] | VBoxChild[],
  depth: number
] {
  if ('individualShift' in params) {
    const oldChildren = params.individualShift;
    let prevChild = oldChildren[0];
    const children: (VBoxChild | VBoxElementAndShift)[] = [prevChild];

    // Add in kerns to the list of params.children to get each element to be
    // shifted to the correct specified shift
    const depth = -prevChild.shift - prevChild.box.depth;
    let currPos = depth;
    for (let i = 1; i < oldChildren.length; i++) {
      const child = oldChildren[i];
      const diff = -child.shift - currPos - child.box.depth;
      const size = diff - (prevChild.box.height + prevChild.box.depth);

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
        typeof child === 'number' ? child : child.box.height + child.box.depth;
    }
    return [params.children, bottom];
  } else if ('bottom' in params) {
    return [params.children, -params.bottom];
  } else if ('firstBaseline' in params) {
    const firstChild = params.firstBaseline[0];
    if (typeof firstChild === 'number') {
      throw new Error('First child must be an element.');
    }
    return [params.firstBaseline, -firstChild.box.depth];
  } else if ('shift' in params) {
    const firstChild = params.children[0];
    if (typeof firstChild === 'number') {
      throw new Error('First child must be an element.');
    }
    return [params.children, -firstChild.box.depth - params.shift];
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
  params: VBoxParam
): [rows: Box[], height: number, depth: number] {
  const [children, depth] = getVListChildrenAndDepth(params);
  if (!children) return [[], 0, 0];

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
      const box = child.box;
      pstrutSize = Math.max(pstrutSize, box.maxFontSize, box.height);
    }
  }
  pstrutSize += 2;
  const pstrut = new Box(null, { classes: 'pstrut' });
  pstrut.setStyle('height', pstrutSize, 'em');

  // Create a new list of actual children at the correct offsets
  const realChildren: Box[] = [];
  let minPos = depth;
  let maxPos = depth;
  let currPos = depth;
  for (const child of children) {
    if (typeof child === 'number') {
      currPos += child;
    } else {
      const box = child.box;
      const classes = child.classes ?? [];

      const childWrap = new Box([pstrut, box], {
        classes: classes.join(' '),
        style: child.style,
      });
      childWrap.setStyle('top', -pstrutSize - currPos - box.depth, 'em');
      if (child.marginLeft) {
        childWrap.setStyle('margin-left', child.marginLeft, 'em');
      }
      if (child.marginRight) {
        childWrap.setStyle('margin-right', child.marginRight, 'em');
      }

      realChildren.push(childWrap);
      currPos += box.height + box.depth;
    }
    minPos = Math.min(minPos, currPos);
    maxPos = Math.max(maxPos, currPos);
  }

  // The vlist contents go in a table-cell with `vertical-align:bottom`.
  // This cell's bottom edge will determine the containing table's baseline
  // without overly expanding the containing line-box.
  const vlist = new Box(realChildren, { classes: 'vlist' });
  vlist.setStyle('height', maxPos, 'em');

  // A second row is used if necessary to represent the vlist's depth.
  let rows: Box[];
  if (minPos < 0) {
    // We will define depth in an empty box with display: table-cell.
    // It should render with the height that we define. But Chrome, in
    // contenteditable mode only, treats that box as if it contains some
    // text content. And that min-height over-rides our desired height.
    // So we put another empty box inside the depth strut box.
    const depthStrut = new Box(new Box(null), { classes: 'vlist' });
    depthStrut.setStyle('height', -minPos, 'em');

    // Safari wants the first row to have inline content; otherwise it
    // puts the bottom of the *second* row on the baseline.
    const topStrut = new Box(0x200b, {
      classes: 'vlist-s',
      maxFontSize: 0,
      height: 0,
      depth: 0,
    });

    rows = [
      new Box([vlist, topStrut], { classes: 'vlist-r' }),
      new Box(depthStrut, { classes: 'vlist-r' }),
    ];
  } else {
    rows = [new Box(vlist, { classes: 'vlist-r' })];
  }

  return [rows, maxPos, -minPos];
}

export class VBox extends Box {
  constructor(
    content: VBoxParam,
    options?: { classes?: string; type?: BoxType }
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
    base: Box;
    baseShift?: number;
    slant?: number;
    above: Box | null;
    aboveShift?: number;
    below: Box | null;
    belowShift?: number;
    type?: BoxType;
  }
): Box {
  // If nothing above and nothing below, nothing to do.
  // if (!options.above && !options.below) {
  //   return new Span(options.base, { type: options.boxType ?? 'mop' }).wrap(
  //     context
  //   );
  //   // return options.base;
  // }
  const metrics = context.metrics;

  // IE8 clips \int if it is in a display: inline-block. We wrap it
  // in a new box so it is an inline, and works.
  // @todo: revisit
  const base = new Box(options.base);

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

  let result: Box | null = null;

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
    result = new VBox({
      bottom,
      children: [
        metrics.bigOpSpacing5,
        {
          box: options.below,
          marginLeft: -slant,
          classes: ['ML__center'],
        },
        belowShift,
        //  We need to center the base to account for the case where the
        // above/below is wider
        { box: base, classes: ['ML__center'] },
        aboveShift,
        {
          box: options.above,
          marginLeft: slant,
          classes: ['ML__center'],
        },
        metrics.bigOpSpacing5,
      ],
    }).wrap(context);
  } else if (options.below && !options.above) {
    result = new VBox({
      top: base.height - baseShift,
      children: [
        metrics.bigOpSpacing5,
        {
          box: options.below,
          marginLeft: -slant,
          classes: ['ML__center'],
        },
        belowShift,
        { box: base, classes: ['ML__center'] },
      ],
    }).wrap(context);
  } else if (!options.below && options.above) {
    const bottom = base.depth + baseShift;

    result = new VBox({
      bottom,
      children: [
        { box: base, classes: ['ML__center'] },
        aboveShift,
        {
          box: options.above,
          marginLeft: slant,
          classes: ['ML__center'],
        },
        metrics.bigOpSpacing5,
      ],
    }).wrap(context);
  } else {
    const bottom = base.depth + baseShift;
    result = new VBox({
      bottom,
      children: [{ box: base }, metrics.bigOpSpacing5],
    }).wrap(context);
  }
  console.assert(options.type !== undefined);
  return new Box(result, { type: options.type ?? 'mop' });
}
