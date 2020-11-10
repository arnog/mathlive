import {
    ErrorListener,
    Style,
    MacroDictionary,
    ParserErrorCode,
    ParseMode,
} from '../public/core';

import type { Span } from './span';
import type { Token } from './tokenizer';
import { Atom, ToLatexOptions } from './atom';
import type { ArgumentType } from './context';

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
                value = atom['customClass'];
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

export const MODES_REGISTRY = {};

export function register(
    name: string,
    definition: {
        emitLatexRun: (run: Atom[], options: ToLatexOptions) => string;
        applyStyle: (span: Span, style: Style) => string;
        parse?: (
            tokens: Token[],
            onError: ErrorListener<ParserErrorCode>,
            options: ParseTokensOptions
        ) => Atom[];
    }
): void {
    MODES_REGISTRY[name] = { ...definition };
}

export function emitLatexRun(run: Atom[], options: ToLatexOptions): string {
    if (MODES_REGISTRY[run[0].mode]?.emitLatexRun) {
        return MODES_REGISTRY[run[0].mode].emitLatexRun(run, options);
    }
    return '';
}

export function parseTokens(
    mode: ParseMode,
    tokens: Token[],
    onError: ErrorListener<ParserErrorCode>,
    options: ParseTokensOptions
): Atom[] {
    if (MODES_REGISTRY[mode]?.parse) {
        return MODES_REGISTRY[mode].parse(tokens, onError, options);
    }
    return null;
}

/*
 * Apply the styling (bold, italic, etc..) as classes to the atom, and return
 * the effective font name to be used for metrics
 * ('Main-Regular', 'Caligraphic-Regualr' etc...)
 */
export function applyStyle(mode: ParseMode, span: Span, style: Style): string {
    if (MODES_REGISTRY[mode]?.applyStyle) {
        return MODES_REGISTRY[mode].applyStyle(span, style);
    }
    return '';
}
