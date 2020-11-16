import { Atom, Branch, NAMED_BRANCHES } from '../core/atom';
import type { FindOptions, Range } from '../public/mathfield';
import { ModelPrivate } from './model-private';

function match(value: string | RegExp, latex: string): boolean {
    if (typeof value === 'string') {
        return value === latex;
    }
    if (value.test(latex)) {
        console.log('matches ', latex);
        return true;
    }
    return false;
}

function findInBranch(
    model: ModelPrivate,
    atom: Atom,
    branchName: Branch,
    value: string | RegExp,
    options: FindOptions
): Range[] {
    // Iterate each position.
    const branch = atom.branch(branchName);
    if (!branch) return [];
    const result = [];
    let length = branch.length;
    while (length > 0) {
        for (let i = 1; i < branch.length - length + 1; i++) {
            const latex = Atom.toLatex(branch.slice(i, i + length), {
                expandMacro: false,
            });
            if (match(value, latex)) {
                result.push([
                    model.offsetOf(branch[i].leftSibling),
                    model.offsetOf(branch[i + length - 1]),
                ]);
            }
        }
        length--;
    }
    return branch.reduce(
        (acc, x) => [...acc, ...findRecursive(model, x, value, options)],
        result
    );
}
function findRecursive(
    model: ModelPrivate,
    atom: Atom,
    value: string | RegExp,
    options: FindOptions
): Range[] {
    if (atom.type === 'first') return [];

    // If the mode doesn't match, ignore this atom
    if (options?.mode && options.mode !== atom.mode) return [];

    return NAMED_BRANCHES.reduce((acc, x) => {
        return [...acc, ...findInBranch(model, atom, x, value, options)];
    }, []);

    // @todo array
}

export function find(
    model: ModelPrivate,
    value: string | RegExp,
    options: FindOptions
): Range[] {
    return findInBranch(model, model.root, 'body', value, options);
}
