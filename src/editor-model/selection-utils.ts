import { ParseMode } from 'public/core-types';
import { Offset, Range, Selection } from '../public/mathfield';
import { _Model } from './model-private';

export function compareSelection(
  a: Selection,
  b: Selection
): 'equal' | 'different' {
  if (a.direction === b.direction) {
    const l = a.ranges.length;
    if (b.ranges.length === l) {
      let i = 0;
      while (i < l && compareRange(a.ranges[i], b.ranges[i]) === 'equal') i++;

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
  for (const range of selection.ranges) {
    first = Math.min(first, range[0], range[1]);
    last = Math.max(last, range[0], range[1]);
  }
  return [first, last];
}

export function isOffset(value: unknown): value is Offset {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isRange(value: unknown): value is Range {
  return Array.isArray(value) && value.length === 2;
}

export function isSelection(value: unknown): value is Selection {
  return (
    value !== undefined &&
    value !== null &&
    typeof value === 'object' &&
    'ranges' in value! &&
    Array.isArray((value as Selection).ranges)
  );
}

export function getMode(model: _Model, offset: Offset): ParseMode | undefined {
  const atom = model.at(offset);
  let result: ParseMode | undefined;
  if (atom) {
    result = atom.mode;
    let ancestor = atom.parent;
    while (!result && ancestor) {
      if (ancestor) result = ancestor.mode;
      ancestor = ancestor.parent;
    }
  }

  return result;
}
