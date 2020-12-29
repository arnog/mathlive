import { Range, Selection } from '../public/mathfield';

export function compareSelection(
  a: Selection,
  b: Selection
): 'equal' | 'different' {
  if (a.direction === b.direction) {
    const l = a.ranges.length;
    if (b.ranges.length === l) {
      let i = 0;
      while (i < l && compareRange(a.ranges[i], b.ranges[i]) === 'equal') {
        i++;
      }

      return i === l ? 'equal' : 'different';
    }
  }

  return 'different';
}

function compareRange(a: Range, b: Range): 'equal' | 'different' {
  if (a[0] === b[0] && a[1] === b[1]) return 'equal';
  return 'different';
}

/**
 * Return the smallest and largest offsets in a selection
 */
export function range(selection: Selection): Range {
  let first = Infinity;
  let last = -Infinity;
  selection.ranges.forEach((x) => {
    first = Math.min(first, x[0], x[1]);
    last = Math.max(last, x[0], x[1]);
  });
  return [first, last];
}
