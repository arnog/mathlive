import { Offset } from '../public/mathfield';
import type { ParseMode } from '../public/core';

import { ModelPrivate } from './model-private';

export function getMode(model: ModelPrivate, offset: Offset): ParseMode {
  const atom = model.at(offset);
  let result: ParseMode;
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
