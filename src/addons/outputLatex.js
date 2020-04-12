/**
 * This module outputs a formula to LaTeX.
 *
 * To use it, use the {@linkcode Atom#toLatex Atom.toLatex()}  method.
 *
 * @module addons/outputLatex
 * @private
 */

import { Atom } from '../core/atom.js';
import { emit as emitDefinition } from '../core/definitions.js';
import { emitLatexRun, getPropertyRuns } from '../core/modes.js';
import { colorToString } from '../core/color.js';

// See https://tex.stackexchange.com/questions/58098/what-are-all-the-font-styles-i-can-use-in-math-mode

/*
 * Return an array of runs with the same mode
 */
function getModeRuns(atoms) {
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
 * @private
 */
function latexifyArray(parent, atoms, expandMacro) {
    if (atoms.length === 0) return '';
    if (atoms[0].type === 'first') {
        if (atoms.length === 1) return '';
        // Remove the 'first' atom, if present
        atoms = atoms.slice(1);
    }
    if (atoms.length === 0) return '';

    return getPropertyRuns(atoms, 'cssClass')
        .map((x) => {
            const result = getPropertyRuns(x, 'color')
                .map((x) =>
                    getModeRuns(x)
                        .map((x) => emitLatexRun(parent, x, expandMacro))
                        .join('')
                )
                .join('');
            if (
                x[0].cssClass &&
                (!parent || parent.cssClass !== x[0].cssClass)
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
        .join('');
}

/**
 * Given an atom or an array of atoms, return a LaTeX string representation
 * @return {string}
 * @param {string|Atom|Atom[]} value
 * @param {boolean} expandMacro
 * @private
 */
function latexify(parent, value, expandMacro) {
    let result = '';
    if (Array.isArray(value)) {
        result = latexifyArray(parent, value, expandMacro);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
        result = value.toString();
    } else if (typeof value === 'string') {
        result = value.replace(/\s/g, '~');
    } else if (value && typeof value.toLatex === 'function') {
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
 * @return {string}
 * @memberof module:core/atom~Atom
 * @private
 */
Atom.prototype.toLatex = function (expandMacro) {
    expandMacro = typeof expandMacro === 'undefined' ? false : expandMacro;
    // @todo: enable this after clearing out this.latex on edit
    // if (!expandMacro && this.latex) {
    //     return this.latex;
    // }
    let result = '';
    let col = 0;
    let row = 0;
    let i = 0;
    const command = this.symbol;
    const emit = (parent, atom) => latexify(parent, atom, expandMacro);

    // this.mode=='text' is handled in the switch by looking at this.type===''
    switch (this.type) {
        case 'group':
            if (command) {
                // This is a macro
                console.assert(this.latex, 'No latex for ' + command);
                if (!expandMacro) {
                    result = this.latex;
                } else {
                    result = `${command}{${emit(this, this.body)}}`;
                }
            } else {
                result =
                    this.latexOpen || (this.cssId || this.cssClass ? '' : '{');

                if (this.cssId) result += '\\cssId{' + this.cssId + '}{';

                if (this.cssClass === 'ML__emph') {
                    result += `\\emph{${emit(this, this.body)}`;
                } else {
                    if (this.cssClass) {
                        result += '\\class{' + this.cssClass + '}{';
                    }
                    result += emit(this, this.body);

                    if (this.cssClass) result += '}';
                }
                if (this.cssId) result += '}';

                result +=
                    this.latexClose || (this.cssId || this.cssClass ? '' : '}');
            }
            break;

        case 'array':
            result += '\\begin{' + this.env.name + '}';
            if (this.env.name === 'array') {
                result += '{';
                if (this.colFormat) {
                    for (i = 0; i < this.colFormat.length; i++) {
                        if (this.colFormat[i].align) {
                            result += this.colFormat[i].align;
                        } else if (this.colFormat[i].rule) {
                            result += '|';
                        }
                    }
                }
                result += '}';
            }
            for (row = 0; row < this.array.length; row++) {
                for (col = 0; col < this.array[row].length; col++) {
                    if (col > 0) result += ' & ';
                    result += emit(this, this.array[row][col]);
                }
                // Adds a separator between rows (but not after the last row)
                if (row < this.array.length - 1) {
                    result += ' \\\\ ';
                }
            }
            result += '\\end{' + this.env.name + '}';
            break;

        case 'root':
            result = emit(this, this.body);
            break;

        case 'leftright':
            if (this.inner) {
                result += '\\left' + (this.leftDelim || '.');
                if (this.leftDelim && this.leftDelim.length > 1) result += ' ';
                result += emit(this, this.body);
                result += '\\right' + (this.rightDelim || '.');
                if (this.rightDelim && this.rightDelim.length > 1) {
                    result += ' ';
                }
            } else {
                if (
                    expandMacro &&
                    this.leftDelim === '(' &&
                    this.rightDelim === ')'
                ) {
                    // If we're in 'expandMacro' mode (i.e. interchange format
                    // used, e.g., on the clipboard for maximum compatibility
                    // with other LaTeX renderers), drop the `\mleft(` and `\mright`)
                    // commands
                    result += `(${emit(this, this.body)})`;
                } else {
                    result += '\\mleft' + (this.leftDelim || '.');
                    if (this.leftDelim && this.leftDelim.length > 1) {
                        result += ' ';
                    }
                    result += emit(this, this.body);
                    result += '\\mright' + (this.rightDelim || '.');
                    if (this.rightDelim && this.rightDelim.length > 1) {
                        result += ' ';
                    }
                }
            }
            break;

        case 'delim':
        case 'sizeddelim':
            result += command + '{' + this.delim + '}';
            break;

        case 'rule':
            result += command;
            if (this.shift) {
                result += `[${emit(this, this.shift)}em]`;
            }
            result += `{${emit(this, this.width)}em}{${emit(
                this,
                this.height
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
                result += this.latex + ' ';
            } else {
                result += emitDefinition(command, null, this, emit);
            }
            break;

        case 'mop':
            if (this.body !== '\u200b') {
                // Not ZERO-WIDTH
                if (command === '\\mathop') {
                    // The argument to mathop is math, therefor this.body can be an expression
                    result += command + '{' + emit(this, this.body) + '}';
                } else if (command === '\\operatorname') {
                    // The argument to `\operatorname` is 'math' and needs to be latexified
                    result += command + '{' + emit(this, this.body) + '}';
                } else {
                    result += command;
                    if (/^\\.*[a-zA-Z0-9]$/.test(command)) {
                        // Add a space after commands, to avoid, e.g.
                        // '\sin' + 'x' -> '\sinx' instead of '\sin x'
                        result += ' ';
                    }
                }
            }
            if (this.explicitLimits) {
                if (this.limits === 'limits') result += '\\limits ';
                if (this.limits === 'nolimits') result += '\\nolimits ';
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
                if (this.width) {
                    result += this.width + 'em';
                } else {
                    result += '0em';
                }
                result += '}';
            } else {
                result += ' ';
                if (this.width) {
                    result += this.width + 'em ';
                }
            }

            break;

        case 'enclose':
            result += command;
            if (command === '\\enclose') {
                result += '{';
                let sep = '';
                for (const notation in this.notation) {
                    if (
                        Object.prototype.hasOwnProperty.call(
                            this.notation,
                            notation
                        ) &&
                        this.notation[notation]
                    ) {
                        result += sep + notation;
                        sep = ' ';
                    }
                }
                result += '}';

                // \enclose can have optional parameters...
                let style = '';
                sep = '';
                if (
                    this.backgroundcolor &&
                    this.backgroundcolor !== 'transparent'
                ) {
                    style +=
                        sep +
                        'mathbackground="' +
                        colorToString(this.backgroundcolor) +
                        '"';
                    sep = ',';
                }
                if (this.shadow && this.shadow !== 'auto') {
                    style += sep + 'shadow="' + this.shadow + '"';
                    sep = ',';
                }
                if (this.strokeWidth !== 1 || this.strokeStyle !== 'solid') {
                    style += sep + this.borderStyle;
                    sep = ',';
                } else if (
                    this.strokeColor &&
                    this.strokeColor !== 'currentColor'
                ) {
                    style +=
                        sep +
                        'mathcolor="' +
                        colorToString(this.strokeColor) +
                        '"';
                    sep = ',';
                }

                if (style) {
                    result += `[${style}]`;
                }
            }
            result += `{${emit(this, this.body)}}`;
            break;

        case 'mathstyle':
            result += '\\' + this.mathstyle + ' ';
            break;

        case 'space':
            result += this.symbol;
            break;

        case 'placeholder':
            result += '\\placeholder{' + (this.value || '') + '}';
            break;

        case 'first':
        case 'command':
        case 'msubsup':
            break;

        case 'error':
            result += this.latex;
            break;

        case '':
            console.assert(
                this.mode === 'text',
                'Null atom type in mode ' + this.mode
            );
            console.error('Attempting to emit a text atom');
            break;

        default:
            result = emitDefinition(command, parent, this, emit);
            console.assert(
                result,
                'Missing custom emiter for ',
                command || this.body
            );
            if (!result) {
                result += command;
            }

            break;
    }
    if (this.superscript) {
        let sup = emit(this, this.superscript);
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
    if (this.subscript) {
        const sub = emit(this, this.subscript);
        if (sub.length === 1) {
            result += '_' + sub;
        } else {
            result += '_{' + sub + '}';
        }
    }
    return result;
};
