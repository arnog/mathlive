import { Box } from './box';

/**
 * Following TeX, a line can be broken after a binary operator or a relation,
 * as long as it is at the top level of the formula, i.e. not inside a
 * fraction, a radical or a delimited group.
 *                                                        -- TeXBook, p. 173
 *
 * CSS only offers a break opportunity between two atomic inline boxes, so the
 * boxes of the top-level row are grouped in `ML__nobreak` segments: the
 * browser can break a line between two segments, but not inside one.
 *
 * The markup is unchanged if the formula has no break point.
 */
export function applyLineBreaks(root: Box): Box {
  if (!root.children || !hasBreakPoint(root.children)) return root;

  let afterOperator = false;

  const segment = (boxes: Box[]): Box[] => {
    const result: Box[] = [];
    let current: Box[] = [];

    const flush = () => {
      if (current.length === 0) return;
      const spacingOnly = current.every((x) => x.type === 'skip');
      result.push(
        ...(spacingOnly
          ? current
          : [new Box(current, { classes: 'ML__nobreak', type: 'ignore' })])
      );
      current = [];
    };

    for (const box of boxes) {
      if (box.type === 'lift' && box.children && hasBreakPoint(box.children)) {
        flush();
        box.children = segment(box.children);
        result.push(box);
        continue;
      }

      current.push(box);

      // End the segment after the space following the operator, so that the
      // next line starts flush with its operand
      if (box.type !== 'skip') afterOperator = isBreakPoint(box);
      else if (afterOperator) {
        flush();
        afterOperator = false;
      }
    }

    flush();

    return result;
  };

  root.children = segment(root.children);

  return root;
}

function isBreakPoint(box: Box): boolean {
  return box.type === 'bin' || box.type === 'rel';
}

/** A 'lift' box is a transparent wrapper: its children are part of the row */
function hasBreakPoint(boxes: readonly Box[]): boolean {
  return boxes.some(
    (box) =>
      isBreakPoint(box) ||
      (box.type === 'lift' && box.children && hasBreakPoint(box.children))
  );
}
