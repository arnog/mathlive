import type { ParseMode } from '../public/core';
import type { Mathfield, Offset, Range, Selection } from '../public/mathfield';
import { ModelPrivate } from './model-private';

import type { MacroDictionary } from '../core-definitions/definitions';
import type { Atom } from '../core/atom';

export type ModelOptions = {
  mode: ParseMode;
  macros: MacroDictionary;
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

export type ModelHooks = {
  announce?: (
    target: Mathfield, // @revisit: could drop this argument
    verb: AnnounceVerb,
    previousPosition: number,
    object: Atom[] // Object of the command
  ) => void;
  /*
   * Return false if handled.
   */
  moveOut?: (
    sender: ModelPrivate,
    direction: 'forward' | 'backward' | 'upward' | 'downward'
  ) => boolean;
  /*
   * Return false if handled.
   */
  tabOut?: (sender: ModelPrivate, direction: 'forward' | 'backward') => boolean;
};

export function isOffset(value: unknown): value is Offset {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isRange(value: unknown): value is Range {
  return Array.isArray(value) && value.length === 2;
}

export function isSelection(value: unknown): value is Selection {
  return (
    typeof value === 'object' &&
    'ranges' in value &&
    Array.isArray((value as Selection).ranges)
  );
}
