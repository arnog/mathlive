import { ParseMode } from '../public/core-types';
import { Offset } from '../public/mathfield';

import { ModelPrivate } from './model-private';

export function getMode(
  model: ModelPrivate,
  offset: Offset
): ParseMode | undefined {
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
