import {
  ErrorListener,
  Style,
  MacroDictionary,
  ParserErrorCode,
  ParseMode,
} from '../public/core';

import type { Span } from './span';
import type { Token } from './tokenizer';
import type { ArgumentType } from './context';
import type { GroupAtom } from '../core-atoms/group';
import { Atom, ToLatexOptions } from './atom';

export interface ParseTokensOptions {
  args: (string | Atom[])[];
  macros: MacroDictionary;
  smartFence: boolean;
  style: Style;
  parse: (
    mode: ArgumentType,
    tokens: Token[],
    options: ParseTokensOptions
  ) => [Atom[], Token[]];
}

export class Mode {
  static _registry: Record<string, Mode> = {};
  constructor(name: string) {
    Mode._registry[name] = this;
  }

  static createAtom(mode: ParseMode, command: string, style: Style): Atom {
    return Mode._registry[mode].createAtom(command, style);
  }

  static parseTokens(
    mode: ParseMode,
    tokens: Token[],
    onError: ErrorListener<ParserErrorCode>,
    options: ParseTokensOptions
  ): Atom[] {
    return Mode._registry[mode].parseTokens(tokens, onError, options);
  }

  // `run` should be a run (sequence) of atoms all with the same
  // mode
  static toLatex(run: Atom[], options: ToLatexOptions): string {
    console.assert(run.length > 0);
    const mode = Mode._registry[run[0].mode];
    return mode.toLatex(run, options);
  }

  static applyStyle(mode: ParseMode, span: Span, style: Style): string {
    return Mode._registry[mode].applyStyle(span, style);
  }

  createAtom(_command: string, _style: Style): Atom | null {
    return null;
  }

  parseTokens(
    _tokens: Token[],
    _onError: ErrorListener<ParserErrorCode>,
    _options: ParseTokensOptions
  ): Atom[] | null {
    return null;
  }

  toLatex(_run: Atom[], _options: ToLatexOptions): string {
    return '';
  }

  /*
   * Apply the styling (bold, italic, etc..) as classes to the span, and return
   * the effective font name to be used for metrics
   * ('Main-Regular', 'Caligraphic-Regualr' etc...)
   */
  applyStyle(_span: Span, _style: Style): string {
    return '';
  }
}

/*
 * Return an array of runs with the same mode
 */
export function getModeRuns(atoms: Atom[]): Atom[][] {
  const result = [];
  let run = [];
  let currentMode = 'NONE';
  atoms.forEach((atom) => {
    if (atom.type === 'first') return;
    if (atom.mode !== currentMode) {
      if (run.length > 0) result.push(run);
      run = [atom];
      currentMode = atom.mode;
    } else {
      run.push(atom);
    }
  });
  // Push whatever is left
  if (run.length > 0) result.push(run);
  return result;
}

/*
 * Return an array of runs (array of atoms with the same value
 *   for the specified property)
 */
export function getPropertyRuns(atoms: Atom[], property: string): Atom[][] {
  const result = [];
  let run = [];
  let currentValue: string;
  atoms.forEach((atom: Atom) => {
    if (atom.type === 'first') return;
    let value: string;
    if (property === 'variant') {
      value = atom.style.variant;
      if (atom.style.variantStyle && atom.style.variantStyle !== 'up') {
        value += '-' + atom.style.variantStyle;
      }
    } else if (property === 'cssClass') {
      if (atom.type === 'group') {
        value = (atom as GroupAtom).customClass;
      }
    } else {
      value = atom.style[property];
    }

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
  });

  // Push whatever is left
  if (run.length > 0) result.push(run);
  return result;
}
