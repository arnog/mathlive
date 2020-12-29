import { isArray } from '../common/types';
import { ParseMode } from '../public/core';
import { Atom } from './atom-class';

/**
/**
 * Return an atom suitable for use as the root of a formula.
 */

export function makeRoot(parseMode: ParseMode, body: Atom[] = []): Atom {
  const root = new Atom('root', { mode: parseMode });
  // If making a new root, make sure the initial body is not already
  // attached to another root. That spells trouble.
  console.assert(body.every((x) => !x.parent));
  root.body = body;
  return root;
}

export function isAtomArray(arg: string | Atom | Atom[]): arg is Atom[] {
  return isArray(arg);
}
