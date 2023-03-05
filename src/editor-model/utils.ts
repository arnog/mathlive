import type { ParseMode } from '../public/core';
import type { Offset, Range, Selection } from '../public/mathfield';

import { NormalizedMacroDictionary } from '../core-definitions/definitions-utils';

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

// /** If in prompt mode, returns the nearest position inside a \prompt */
// export function getEditablePosition(pos: number, model: ModelPrivate): number {
//   if (!model.mathfield.promptMode) return pos;

//   // find all the prompt atoms
//   const prompts = model
//     .getAllAtoms(0)
//     .filter((atom: Atom) => atom.command === '\\prompt');

//   // Map prompts to their child ranges
//   const promptRanges = prompts.map((p) => {
//     const offset = model.offsetOf(p);
//     const numChildren = p.children.length;
//     return [offset - numChildren, offset - 1] as Range;
//   });

//   if (promptRanges.length > 0) {
//     // Find the closest range to pos
//     const closest = promptRanges.reduce((bestYet, currentRange) => {
//       const bestDistance =
//         pos >= bestYet[0] && pos <= bestYet[1]
//           ? 0
//           : Math.min(Math.abs(pos - bestYet[0]), Math.abs(pos - bestYet[1]));

//       const currentDistance =
//         pos >= currentRange[0] && pos <= currentRange[1]
//           ? 0
//           : Math.min(
//               Math.abs(pos - currentRange[0]),
//               Math.abs(pos - currentRange[1])
//             );

//       return currentDistance < bestDistance ? currentRange : bestYet;
//     });

//     if (pos >= closest[0] && pos <= closest[1]) {
//       // pos is inside a \prompt
//       return pos;
//     } else {
//       return closest[1];
//     }
//   }

//   return pos;
// }
