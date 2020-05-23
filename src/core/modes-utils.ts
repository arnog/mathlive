import { ErrorListener, Style, MacroDictionary } from '../public/core';

import type { Span } from './span';
import type { Token } from './lexer';
import type { Atom } from './atom';
import type { ParseModePrivate } from './context';

export interface ParseTokensOptions {
    args: (string | Atom[])[];
    macros: MacroDictionary;
    smartFence: boolean;
    style: Style;
    parse: (
        mode: ParseModePrivate,
        tokens: Token[],
        options: ParseTokensOptions
    ) => [Atom[], Token[]];
}

export function joinLatex(segments: string[]): string {
    let sep = '';
    let result = '';
    for (const segment of segments) {
        if (/[a-zA-Z*]/.test(segment[0])) {
            // If the segment begins with a char that *could* be in a command
            // name... insert a separator (if one was needed for the previous segment)
            result += sep;
        }
        // If the segment ends in a command...
        if (/\\[a-zA-Z]+\*?$/.test(segment)) {
            // ... potentially add a space before the next segment
            sep = ' ';
        } else {
            sep = '';
        }
        result += segment;
    }
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
        if (atom.type !== 'first') {
            let value: string;
            if (property === 'variant') {
                value = atom.variant;
                if (atom.variantStyle && atom.variantStyle !== 'up') {
                    value += '-' + atom.variantStyle;
                }
            } else {
                value = atom[property];
            }
            // If the value of this atom is different from the
            // current value, start a new run
            if (value !== currentValue) {
                if (run.length > 0) result.push(run);
                run = [atom];
                currentValue = value;
            } else {
                // Same value, add it to the current run
                run.push(atom);
            }
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
        emitLatexRun: (
            context: Atom,
            run: Atom[],
            expandMacro: boolean
        ) => string;
        applyStyle: (span: Span, style: Style) => string;
        parse?: (
            tokens: Token[],
            error: ErrorListener,
            options: ParseTokensOptions
        ) => Atom[];
    }
): void {
    MODES_REGISTRY[name] = { ...definition };
}

export function emitLatexRun(
    parent: Atom,
    run: Atom[],
    expandMacro: boolean
): string {
    if (
        MODES_REGISTRY[run[0].mode] &&
        MODES_REGISTRY[run[0].mode].emitLatexRun
    ) {
        return MODES_REGISTRY[run[0].mode].emitLatexRun(
            parent,
            run,
            expandMacro
        );
    }
    return '';
}

export function parseTokens(
    mode: ParseModePrivate,
    tokens: Token[],
    error: ErrorListener,
    options: ParseTokensOptions
): Atom[] {
    if (MODES_REGISTRY[mode] && MODES_REGISTRY[mode].parse) {
        return MODES_REGISTRY[mode].parse(tokens, error, options);
    }
    return null;
}

/*
 * Apply the styling (bold, italic, etc..) as classes to the atom, and return
 * the effective font name to be used for metrics
 * ('Main-Regular', 'Caligraphic-Regualr' etc...)
 */
export function applyStyle(span: Span, style: Style): string {
    if (MODES_REGISTRY[style.mode] && MODES_REGISTRY[style.mode].applyStyle) {
        return MODES_REGISTRY[style.mode].applyStyle(span, style);
    }
    return '';
}
