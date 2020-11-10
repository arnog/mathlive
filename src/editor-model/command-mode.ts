import type { Range } from '../public/mathfield';
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
        end++;
    }
    return [start - 1, end - 1];
}

export function getCommandSuggestionRange(model: ModelPrivate): Range {
    let start = 0;
    let found = false;
    while (start <= model.lastOffset && !found) {
        const atom = model.at(start);
        found = atom instanceof CommandAtom && atom.isSuggestion;
        if (!found) start++;
    }
    if (!found) return [undefined, undefined];

    let end = start;
    let done = false;
    while (end <= model.lastOffset && !done) {
        const atom = model.at(end);
        done = !(atom instanceof CommandAtom && atom.isSuggestion);
        end++;
    }
    return [start - 1, end - 1];
}

export function getCommandAtoms(model: ModelPrivate): CommandAtom[] {
    return model.getAtoms(getCommandRange(model));
}

export function getCommandString(
    model: ModelPrivate,
    options?: { withSuggestion: boolean }
): string {
    const commandAtoms = getCommandAtoms(model);
    if (options?.withSuggestion ?? false) {
        return commandAtoms.map((x) => x.value).join('');
    }
    return commandAtoms
        .filter((x) => !x.isSuggestion)
        .map((x) => x.value)
        .join('');
}
