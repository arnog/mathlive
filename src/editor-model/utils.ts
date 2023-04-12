import type {
  NormalizedMacroDictionary,
  ParseMode,
} from '../public/core-types';
import type { Offset, Range, Selection } from '../public/mathfield';

export type ModelOptions = {
  mode: ParseMode;
  macros: NormalizedMacroDictionary;
  removeExtraneousParentheses: boolean;
};

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
