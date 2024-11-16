import type { AtomJson } from 'core/types';
import type { ParseMode, Selection } from 'public/core-types';

export type AnnounceVerb =
  | 'plonk'
  | 'focus'
  | 'replacement'
  | 'line'
  | 'move'
  | 'move up'
  | 'move down'
  | 'delete'
  | 'delete: numerator'
  | 'delete: denominator'
  | 'delete: root'
  | 'delete: superscript';

export type ModelState = {
  content: AtomJson;
  selection: Selection;
  mode: ParseMode;
};

export type GetAtomOptions = {
  includeChildren?: boolean;
};
