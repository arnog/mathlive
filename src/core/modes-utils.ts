import { Style, ParseMode } from '../public/core';

import type { GroupAtom } from '../core-atoms/group';
import { NormalizedMacroDictionary } from '../core-definitions/definitions-utils';

import { Atom, ToLatexOptions } from './atom';
import type { Box } from './box';
import { GlobalContext } from './context';
import { ArgumentType } from './parser';
import type { Token } from './tokenizer';

export interface ParseTokensOptions {
  macros: NormalizedMacroDictionary;
  smartFence: boolean;
  style: Style;
  args: (arg: string) => string;
  parse: (
    mode: ArgumentType,
    tokens: Token[],
    options: ParseTokensOptions
  ) => [Atom[], Token[]];
}

export abstract class Mode {
  static _registry: Record<string, Mode> = {};
  constructor(name: string) {
    Mode._registry[name] = this;
  }

  static createAtom(
    mode: ParseMode,
    command: string,
    context: GlobalContext,
    style?: Style
  ): Atom | null {
    return Mode._registry[mode].createAtom(command, context, style);
  }

  // `run` should be a run (sequence) of atoms all with the same
  // mode
  static serialize(run: Atom[], options: ToLatexOptions): string {
    console.assert(run.length > 0);
    const mode = Mode._registry[run[0].mode];
    return mode.serialize(run, options);
  }

  static applyStyle(mode: ParseMode, box: Box, style: Style): string | null {
    return Mode._registry[mode].applyStyle(box, style);
  }

  abstract createAtom(
    command: string,
    context: GlobalContext,
    style?: Style
  ): Atom | null;

  abstract serialize(_run: Atom[], _options: ToLatexOptions): string;

  /*
   * Apply the styling (bold, italic, etc..) as classes to the box, and return
   * the effective font name to be used for metrics
   * ('Main-Regular', 'Caligraphic-Regular' etc...)
   */
  abstract applyStyle(_box: Box, _style: Style): string | null;
}

/*
 * Return an array of runs with the same mode
 */
export function getModeRuns(atoms: Atom[]): Atom[][] {
  const result: Atom[][] = [];
  let run: Atom[] = [];
  let currentMode = 'NONE';
  for (const atom of atoms) {
    if (atom.type !== 'first') {
      if (atom.mode !== currentMode) {
        if (run.length > 0) result.push(run);
        run = [atom];
        currentMode = atom.mode;
      } else run.push(atom);
    }
  }
  // Push whatever is left
  if (run.length > 0) result.push(run);
  return result;
}

/*
 * Return an array of runs (array of atoms with the same value
 *   for the specified property)
 */
export function getPropertyRuns(
  atoms: Atom[],
  property: keyof Style | 'cssClass'
): Atom[][] {
  const result: Atom[][] = [];
  let run: Atom[] = [];
  let currentValue: string | number | undefined = undefined;
  for (const atom of atoms) {
    if (atom.type !== 'first' && atom.style) {
      let value: string | number | undefined;
      if (property === 'variant') {
        value = atom.style.variant;
        if (atom.style.variantStyle && atom.style.variantStyle !== 'up')
          value += '-' + atom.style.variantStyle;
      } else if (property === 'cssClass') {
        if (atom.type === 'group') value = (atom as GroupAtom).customClass;
      } else value = atom.style[property];

      if (value === currentValue) {
        // Same value, add it to the current run
        run.push(atom);
      } else {
        // The value of property for this atom is different from the
        // current value, start a new run
        if (run.length > 0) result.push(run);
        run = [atom];
        currentValue = value;
      }
    }
  }

  // Push whatever is left
  if (run.length > 0) result.push(run);
  return result;
}
