import { Atom, Branch } from '../core/atom';
import { parseLatex } from '../core/parser';
import type {
  FindOptions,
  Range,
  ReplacementFunction,
} from '../public/mathfield';
import { ModelPrivate } from './model-private';

function match(pattern: string | RegExp, latex: string): boolean {
  if (typeof pattern === 'string') {
    return pattern === latex;
  }

  return pattern.test(latex);
}

function findInBranch(
  model: ModelPrivate,
  atom: Atom,
  branchName: Branch,
  value: string | RegExp,
  options: FindOptions
): Range[] {
  const branch = atom.branch(branchName);
  if (!branch) return [];
  const result = [];
  let { length } = branch;
  // For each length...
  while (length > 0) {
    // Consider each possible position in the branch
    for (let i = 1; i < branch.length - length + 1; i++) {
      const latex = Atom.toLatex(branch.slice(i, i + length), {
        expandMacro: false,
      });
      if (match(value, latex)) {
        result.push([
          model.offsetOf(branch[i].leftSibling),
          model.offsetOf(branch[i + length - 1]),
        ]);
        i += length;
      }
    }

    length--;
  }

  return branch.reduce(
    (acc, x) => [...acc, ...findInAtom(model, x, value, options)],
    result
  );
}

function findInAtom(
  model: ModelPrivate,
  atom: Atom,
  value: string | RegExp,
  options: FindOptions
): Range[] {
  if (atom.type === 'first') return [];

  // If the mode doesn't match, ignore this atom
  if (options?.mode && options.mode !== atom.mode) return [];

  return atom.branches.reduce((acc, x) => {
    return [...acc, ...findInBranch(model, atom, x, value, options)];
  }, []);
}

export function find(
  model: ModelPrivate,
  value: string | RegExp,
  options: FindOptions
): Range[] {
  return findInBranch(model, model.root, 'body', value, options).sort(
    (a, b) => {
      if (b[0] === a[0]) {
        return b[1] - a[1];
      }

      return b[0] - a[0];
    }
  );
}

function replaceInBranch(
  model: ModelPrivate,
  atom: Atom,
  branchName: Branch,
  pattern: string | RegExp,
  replacement: string | ReplacementFunction,
  options: FindOptions
): void {
  const branch = atom.branch(branchName);
  if (!branch) return;

  let i = 1;
  while (i < branch.length) {
    let length = branch.length - i;
    while (length > 0) {
      let matched = false;
      const latex = Atom.toLatex(branch.slice(i, i + length), {
        expandMacro: false,
      });
      console.log('testing ' + latex);
      const replacementArgs: any = { latex };
      if (typeof pattern === 'string' && latex === pattern) {
        matched = true;
      } else if (pattern instanceof RegExp) {
        const match = latex.match(pattern);
        if (match !== null) {
          matched = true;
          if (match.length > 0) {
            replacementArgs.p = [...match];
          }

          replacementArgs.groups = match.groups;
        }
      }

      if (matched) {
        // Remove the atoms that matched
        for (let j = i; j < i + length; j++) {
          atom.removeChild(branch[j]);
        }

        let replacementString: string;
        if (typeof replacement === 'string') {
          replacementString = replacement;
          if (replacementArgs.p) {
            replacementArgs.p.forEach((x, index) => {
              if (typeof x === 'string') {
                replacementString = replacementString.replace(
                  '$' + Number(index).toString(),
                  x
                );
              }
            });
          }

          if (replacementArgs.groups) {
            Object.keys(replacementArgs.groups).forEach((x) => {
              if (typeof x === 'string') {
                replacementString = replacementString.replace(
                  '$' + x,
                  replacementArgs.groups[x]
                );
              }
            });
          }

          replacementString = replacementString.replace('$$', '$');
        } else {
          replacementString = replacement(replacementArgs);
        }

        const lastChild = atom.addChildrenAfter(
          parseLatex(replacementString, atom.mode),
          branch[i - 1]
        );
        i = branch.indexOf(lastChild) + 1;
        length = branch.length - i;
      } else {
        length--;
      }
    }

    i++;
  }

  branch.forEach((x) => replaceInAtom(model, x, pattern, replacement, options));
}

function replaceInAtom(
  model: ModelPrivate,
  atom: Atom,
  pattern: string | RegExp,
  replacement: string | ReplacementFunction,
  options: FindOptions
): void {
  if (atom.type === 'first') return;

  // If the mode doesn't match, ignore this atom
  if (options?.mode && options.mode !== atom.mode) return;

  atom.branches.forEach((x) =>
    replaceInBranch(model, atom, x, pattern, replacement, options)
  );
}

export function replace(
  model: ModelPrivate,
  pattern: string | RegExp,
  replacement: string | ReplacementFunction,
  options: FindOptions
): void {
  replaceInBranch(model, model.root, 'body', pattern, replacement, options);

  model.position = model.normalizeOffset(model.position);
}
