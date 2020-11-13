import type { Offset, Range } from '../public/mathfield';
import { CommandAtom } from '../core-atoms/command';
import type { ModelPrivate } from './model-private';

/**
 * Return the range of the command in the expression or
 * `[undefined, undefined]`.
 *
 * (There should be at most one command in an expression)
 */
export function getCommandRange(model: ModelPrivate): Range {
    let start = 0;
    let found = false;
    while (start <= model.lastOffset && !found) {
        found = model.at(start) instanceof CommandAtom;
        if (!found) start++;
    }
    if (!found) return [undefined, undefined];

    let end = start;
    let done = false;
    while (end <= model.lastOffset && !done) {
        done = !(model.at(end) instanceof CommandAtom);
        if (!done) end++;
    }
    return [start - 1, end - 1];
}

export function getCommandSuggestionRange(
    model: ModelPrivate,
    options?: { before: Offset }
): Range {
    let start = 0;
    let found = false;
    const last = isFinite(options?.before) ? options.before : model.lastOffset;
    while (start <= last && !found) {
        const atom = model.at(start);
        found = atom instanceof CommandAtom && atom.isSuggestion;
        if (!found) start++;
    }
    if (!found) return [undefined, undefined];

    let end = start;
    let done = false;
    while (end <= last && !done) {
        const atom = model.at(end);
        done = !(atom instanceof CommandAtom && atom.isSuggestion);
        if (!done) end++;
    }
    return [start - 1, end - 1];
}

export function getCommandAtoms(model: ModelPrivate): CommandAtom[] {
    return model.getAtoms(getCommandRange(model));
}

export function getCommandString(model: ModelPrivate): string {
    return model
        .getAtoms(getCommandRange(model))
        .map((x) => x.value)
        .join('');
}
