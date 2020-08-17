import { isArray, isFunction } from '../common/types';

import type { Atom } from './atom';
import { emit as emitDefinition } from './definitions';
import { joinLatex, emitLatexRun, getPropertyRuns } from './modes-utils';
import { colorToString } from './color';

// See https://tex.stackexchange.com/questions/58098/what-are-all-the-font-styles-i-can-use-in-math-mode

/*
 * Return an array of runs with the same mode
 */
function getModeRuns(atoms: Atom[]): Atom[][] {
    const result = [];
    let run = [];
    let currentMode = 'NONE';
    atoms.forEach((atom) => {
        if (atom.type !== 'first') {
            if (atom.mode !== currentMode) {
                if (run.length > 0) result.push(run);
                run = [atom];
                currentMode = atom.mode;
            } else {
                run.push(atom);
            }
        }
    });
    // Push whatever is left
    if (run.length > 0) result.push(run);
    return result;
}

/**
 *
 * @param {Atom} parent the parent or predecessor of the atom list
 * @param {Atom[]} atoms the list of atoms to transform to LaTeX
 * @param {boolean} expandMacro true if macros should be expanded
 * @result {string} a LaTeX string
 */
function latexifyArray(parent, atoms, expandMacro): string {
    if (atoms.length === 0) return '';
    if (atoms[0].type === 'first') {
        if (atoms.length === 1) return '';
        // Remove the 'first' atom, if present
        atoms = atoms.slice(1);
    }
    if (atoms.length === 0) return '';

    return joinLatex(
        getPropertyRuns(atoms, 'cssClass').map((x) => {
            const result = joinLatex(
                getPropertyRuns(x, 'color').map((x) =>
                    joinLatex(
                        getModeRuns(x).map((x) =>
                            emitLatexRun(parent, x, expandMacro)
                        )
                    )
                )
            );
            if (
                x[0].cssClass &&
                (typeof parent === 'undefined' ||
                    parent.cssClass !== x[0].cssClass)
            ) {
                if (x[0].cssClass === 'ML__boldsymbol') {
                    return '\\boldsymbol{' + result + '}';
                } else if (x[0].cssClass === 'ML__emph') {
                    return '\\emph{' + result + '}';
                }
                return '\\class{' + x[0].cssClass + '}{' + result + '}';
            }
            return result;
        })
    );
}

/**
 * Given an atom or an array of atoms, return a LaTeX string representation
 */
function latexify(
    parent: Atom,
    value: boolean | number | string | Atom | Atom[],
    expandMacro: boolean
): string {
    let result = '';
    if (isArray(value)) {
        result = latexifyArray(parent, value, expandMacro);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
        result = value.toString();
    } else if (typeof value === 'string') {
        result = value.replace(/\s/g, '~');
    } else if (
        typeof value !== 'undefined' &&
        value !== null &&
        isFunction(value.toLatex)
    ) {
        result = value.toLatex(expandMacro);
    }
    return result;
}

/**
 * Return a LaTeX representation of the atom.
 *
 * @param {boolean} expandMacro - If true, macros are fully expanded. This will
 * no longer round-trip.
 *
 */
export function atomToLatex(atom: Atom, expandMacro: boolean): string {
    expandMacro = typeof expandMacro === 'undefined' ? false : expandMacro;
    // If we have some verbatim latex for this atom, use it.
    // This allow non-significant punctuation to be preserved when possible.
    if (!expandMacro && atom.latex) {
        return atom.latex;
    }
    let result = '';
    let col = 0;
    let row = 0;
    let i = 0;
    const command = atom.symbol;
    let segments = [];
    const emit = (parent: Atom, atom: string | number | Atom[]): string =>
        latexify(parent, atom, expandMacro);

    // atom.mode=='text' is handled in the switch by looking at atom.type===''
    switch (atom.type) {
        case 'group':
            if (command) {
                // This is a macro
                result = expandMacro ? emit(atom, atom.body) : atom.latex;
            } else {
                result =
                    atom.latexOpen || (atom.cssId || atom.cssClass ? '' : '{');

                if (atom.cssId) result += '\\cssId{' + atom.cssId + '}{';

                if (atom.cssClass === 'ML__emph') {
                    result += `\\emph{${emit(atom, atom.body)}`;
                } else {
                    if (atom.cssClass) {
                        result += '\\class{' + atom.cssClass + '}{';
                    }
                    result += emit(atom, atom.body);

                    if (atom.cssClass) result += '}';
                }
                if (atom.cssId) result += '}';

                result +=
                    atom.latexClose || (atom.cssId || atom.cssClass ? '' : '}');
            }
            break;

        case 'array':
            result += '\\begin{' + atom.environmentName + '}';
            if (atom.environmentName === 'array') {
                result += '{';
                if (typeof atom.colFormat !== 'undefined') {
                    for (i = 0; i < atom.colFormat.length; i++) {
                        if (atom.colFormat[i].align) {
                            result += atom.colFormat[i].align;
                        } else if (atom.colFormat[i].rule) {
                            result += '|';
                        }
                    }
                }
                result += '}';
            }
            for (row = 0; row < atom.array.length; row++) {
                for (col = 0; col < atom.array[row].length; col++) {
                    if (col > 0) result += ' & ';
                    result += emit(atom, atom.array[row][col]);
                }
                // Adds a separator between rows (but not after the last row)
                if (row < atom.array.length - 1) {
                    result += ' \\\\ ';
                }
            }
            result += '\\end{' + atom.environmentName + '}';
            break;

        case 'root':
            result = emit(atom, atom.body);
            break;

        case 'leftright':
            if (atom.inner) {
                segments = [
                    '\\left' + (atom.leftDelim || '.'),
                    emit(atom, atom.body),
                    '\\right' + (atom.rightDelim || '.'),
                ];
            } else {
                if (expandMacro) {
                    // If we're in 'expandMacro' mode (i.e. interchange format
                    // used, e.g., on the clipboard for maximum compatibility
                    // with other LaTeX renderers), drop the `\mleft(` and `\mright`)
                    // commands
                    segments = [
                        atom.leftDelim === '.' ? '' : atom.leftDelim,
                        emit(atom, atom.body),
                        atom.rightDelim === '.' ? '' : atom.rightDelim,
                    ];
                } else {
                    segments = [
                        '\\mleft' + (atom.leftDelim || '.'),
                        emit(atom, atom.body),
                        '\\mright' + (atom.rightDelim || '.'),
                    ];
                }
            }
            result += joinLatex(segments);
            break;

        case 'delim':
        case 'sizeddelim':
            result += command + '{' + atom.delim + '}';
            break;

        case 'rule':
            result += command;
            if (atom.shift) {
                result += `[${emit(atom, atom.shift)}em]`;
            }
            result += `{${emit(atom, atom.width)}em}{${emit(
                atom,
                atom.height
            )}em}`;
            break;

        case 'mord':
        case 'minner':
        case 'mbin':
        case 'mrel':
        case 'mpunct':
        case 'mopen':
        case 'mclose':
        case 'textord':
            if (command === '\\char"') {
                result += atom.latex;
            } else {
                result += emitDefinition(command, null, atom, emit);
            }
            break;

        case 'mop':
            if (atom.body !== '\u200b') {
                // Not ZERO-WIDTH
                if (command === '\\mathop') {
                    // The argument to mathop is math, therefor atom.body can be an expression
                    result += command + '{' + emit(atom, atom.body) + '}';
                } else if (command === '\\operatorname') {
                    // The argument to `\operatorname` is 'math' and needs to be latexified
                    result += command + '{' + emit(atom, atom.body) + '}';
                } else {
                    result += command;
                    if (/^\\.*[a-zA-Z0-9]$/.test(command)) {
                        // Add a space after commands, to avoid, e.g.
                        // '\sin' + 'x' -> '\sinx' instead of '\sin x'
                        result += ' ';
                    }
                }
            }
            if (atom.explicitLimits) {
                if (atom.limits === 'limits') result += '\\limits ';
                if (atom.limits === 'nolimits') result += '\\nolimits ';
            }
            break;

        case 'spacing':
            // Three kinds of spacing commands:
            // \hskip and \kern which take one implicit parameter
            // \hspace and hspace* with take one *explicit* parameter
            // \quad, etc... which take no parameters.
            result += command;
            if (command === '\\hspace' || command === '\\hspace*') {
                result += '{';
                if (atom.width) {
                    result += Number(atom.width).toString() + 'em';
                } else {
                    result += '0em';
                }
                result += '}';
            } else {
                result += ' ';
                if (atom.width) {
                    result += Number(atom.width).toString() + 'em ';
                }
            }

            break;

        case 'enclose':
            result += command;
            if (command === '\\enclose') {
                result += '{' + Object.keys(atom.notation).join(' ') + '}';

                // \enclose can have optional parameters...
                let style = '';
                let sep = '';
                if (
                    atom.backgroundColor &&
                    atom.backgroundColor !== 'transparent'
                ) {
                    style +=
                        sep +
                        'mathbackground="' +
                        colorToString(atom.backgroundColor) +
                        '"';
                    sep = ',';
                }
                if (atom.shadow && atom.shadow !== 'auto') {
                    style += sep + 'shadow="' + atom.shadow + '"';
                    sep = ',';
                }
                if (atom.strokeWidth !== 1 || atom.strokeStyle !== 'solid') {
                    style += sep + atom.borderStyle;
                    sep = ',';
                } else if (
                    atom.strokeColor &&
                    atom.strokeColor !== 'currentColor'
                ) {
                    style +=
                        sep +
                        'mathcolor="' +
                        colorToString(atom.strokeColor) +
                        '"';
                    sep = ',';
                }

                if (style) {
                    result += `[${style}]`;
                }
            }
            result += `{${emit(atom, atom.body)}}`;
            break;

        case 'mathstyle':
            result += '\\' + atom.mathstyle;
            break;

        case 'space':
            result += atom.symbol;
            break;

        case 'placeholder':
            result += '\\placeholder{}';
            break;

        case 'first':
        case 'command':
        case 'msubsup':
            break;

        case 'error':
            result += atom.latex;
            break;

        case '':
            console.assert(
                atom.mode === 'text',
                'Null atom type in mode ' + atom.mode
            );
            console.error('Attempting to emit a text atom');
            break;

        default:
            result = emitDefinition(command, null, atom, emit);
            console.assert(
                Boolean(result),
                'Missing custom emiter for ',
                command || atom.body
            );
            if (!result) {
                result += command;
            }

            break;
    }
    if (typeof atom.superscript !== 'undefined') {
        let sup = emit(atom, atom.superscript);
        if (sup.length === 1) {
            if (sup === '\u2032') {
                // PRIME
                sup = '\\prime ';
            } else if (sup === '\u2033') {
                // DOUBLE-PRIME
                sup = '\\doubleprime ';
            }
            result += '^' + sup;
        } else {
            result += '^{' + sup + '}';
        }
    }
    if (typeof atom.subscript !== 'undefined') {
        const sub = emit(atom, atom.subscript);
        if (sub.length === 1) {
            result += '_' + sub;
        } else {
            result += '_{' + sub + '}';
        }
    }
    return result;
}
