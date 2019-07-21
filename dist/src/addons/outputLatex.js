/**
 * This module outputs a formula to LaTeX.
 * 
 * To use it, use the {@linkcode MathAtom#toLatex MathAtom.toLatex()}  method.
 * 
 * @module addons/outputLatex
 * @private
 */

import MathAtom from '../core/mathAtom.js';
import Color from '../core/color.js';

function findLongestRun(atoms, property, value) {
    let i = 0;
    if (property === 'fontFamily') {
        while (atoms[i]) {
            if (atoms[i].type !== 'mop' && 
                (atoms[i].fontFamily || atoms[i].baseFontFamily) !== value) break
            i++;
        }
    } else {
        while (atoms[i]) {
            if (atoms[i].type !== 'mop' && 
                atoms[i][property] !== value) break
            i++;
        }
    }
    return i;
}

/**
 * 
 * @param {MathAtom} parent the parent or predecessor of the atom list
 * @param {MathAtom[]} atoms the list of atoms to transform to LaTeX
 * @param {boolean} expandMacro true if macros should be expanded
 * @result {string} a LaTeX string
 * @private
 */
function latexifyArray(parent, properties, atoms, expandMacro) {
    if (atoms.length === 0) return '';

    if (properties.length === 0) {
        // We've (recursively) checked:
        // all the atoms have the same properties
        return atoms.map(x => x.toLatex(expandMacro)).join('');
    }

    let result = '';
    let prefix = '';
    let suffix = '';
    const prop = properties[0];
    let propValue = atoms[0][prop];
    if (prop === 'fontFamily') propValue = atoms[0].fontFamily || atoms[0].baseFontFamily;

    const i = findLongestRun(atoms, prop, propValue);

    if (atoms[0].mode === 'text') {
        if (prop === 'fontShape' && atoms[0].fontShape) {
            if (atoms[0].fontShape === 'it') {
                prefix = '\\textit{'
                suffix = '}';
            } else if (atoms[0].fontShape === 'sl') {
                prefix = '\\textsl{'
                suffix = '}';
            } else if (atoms[0].fontShape === 'sc') {
                prefix = '\\textsc{'
                suffix = '}';
            } else if (atoms[0].fontShape === 'n') {
                prefix = '\\textup{'
                suffix = '}';
            } else {
                prefix = '\\text{\\fontshape{' + atoms[0].fontShape + '}';
                suffix = '}';
            }
        } else if (prop === 'fontSeries' && atoms[0].fontSeries) {
            if (atoms[0].fontSeries === 'b') {
                prefix = '\\textbf{'
                suffix = '}';
            } else if (atoms[0].fontSeries === 'l') {
                prefix = '\\textlf{'
                suffix = '}';
            } else if (atoms[0].fontSeries === 'm') {
                prefix = '\\textmd{'
                suffix = '}';
            } else {
                prefix = '\\text{\\fontseries{' + atoms[0].fontSeries + '}';
                suffix = '}';
            }
        } else if (prop === 'mode') {
            let allAtomsHaveShapeOrSeriesOrFontFamily = true;
            for (let j = 0; j < i; j++) {
                if (!atoms[j].fontSeries && 
                    !atoms[j].fontShape && 
                    !atoms[j].fontFamily &&
                    !atoms[j].baseFontFamily) {
                    allAtomsHaveShapeOrSeriesOrFontFamily = false;
                    break;
                }
            }
            if (!allAtomsHaveShapeOrSeriesOrFontFamily) {
                // Wrap in text, only if there isn't a shape or series on 
                // all the atoms, because if so, it will be wrapped in a 
                // \\textbf, \\textit, etc... and the \\text would be redundant
                prefix = '\\text{';
                suffix = '}';
            }
        } else if (prop === 'fontSize' && atoms[0].fontSize) {
            const command = {
                'size1': 'tiny',
                'size2': 'scriptsize',
                'size3': 'footnotesize',
                'size4': 'small',
                'size5': 'normalsize',
                'size6': 'large',
                'size7': 'Large',
                'size8': 'LARGE',
                'size9': 'huge',
                'size10': 'Huge'
            }[atoms[0].fontSize] || '';
            prefix = '{\\' + command + ' ';
            suffix = '}';

        } else if (prop === 'fontFamily' && 
            (atoms[0].fontFamily || atoms[0].baseFontFamily)) {
            const command = {
                'cmr': 'textrm',
                'cmtt': 'texttt',
                'cmss': 'textsf'
            }[atoms[0].fontFamily || atoms[0].baseFontFamily] || '';
            if (!command) {
                prefix += '{\\fontfamily{' + (atoms[0].fontFamily || atoms[0].baseFontFamily) + '}';
                suffix = '}';
            } else {
                prefix = '\\' + command + '{';
                suffix = '}';
            }
        }
    } else if (atoms[0].mode === 'math') {
        if (prop === 'fontSeries') {
            if (atoms[0].fontSeries === 'b') {
                prefix = '\\mathbf{';
                suffix = '}';
            } else if (atoms[0].fontSeries && atoms[0].fontSeries !== 'n') {
                prefix = '{\\fontSeries{' + atoms[0].fontSeries + '}';
                suffix = '}';
            }
        } else if (prop === 'fontShape') {
            if (atoms[0].fontShape === 'it') {
                prefix = '\\mathit{';
                suffix = '}';
            } else if (atoms[0].fontShape === 'n') {
                prefix = '{\\upshape ';
                suffix = '}';
            } else if (atoms[0].fontShape && atoms[0].fontShape !== 'n') {
                prefix = '{\\fontShape{' + atoms[0].fontShape + '}';
                suffix = '}';
            }

        } else if (prop === 'fontSize' && atoms[0].fontSize) {
            const command = {
                'size1': 'tiny',
                'size2': 'scriptsize',
                'size3': 'footnotesize',
                'size4': 'small',
                'size5': 'normalsize',
                'size6': 'large',
                'size7': 'Large',
                'size8': 'LARGE',
                'size9': 'huge',
                'size10': 'Huge'
            }[atoms[0].fontSize] || '';
            prefix = '{\\' + command + ' ';
            suffix = '}';

        } else if (prop === 'fontFamily' && (atoms[0].fontFamily || atoms[0].baseFontFamily)) {
            if (!/^(math|main|mainrm)$/.test(atoms[0].fontFamily || atoms[0].baseFontFamily)) {
                const command = {
                    'cal': 'mathcal', 
                    'frak': 'mathfrak', 
                    'bb': 'mathbb',
                    'scr': 'mathscr',
                    'cmr': 'mathrm',
                    'cmtt': 'mathtt',
                    'cmss': 'mathsf'
                }[atoms[0].fontFamily || atoms[0].baseFontFamily] || '';
                if (!command) {
                    prefix += '{\\fontfamily{' + (atoms[0].fontFamily || atoms[0].baseFontFamily) + '}';
                    suffix = '}';
                } else {
                    if (/^\\operatorname{/.test(atoms[0].latex)) {
                        return atoms[0].latex + latexifyArray(parent, properties, atoms.slice(i), expandMacro);
                    }
                    if (!atoms[0].isFunction) {
                        prefix = '\\' + command + '{';
                        suffix = '}';
                    }
                    // These command have an implicit fontSeries/fontShape, so
                    // we're done checking properties now.
                    properties = [];
                }
            }
        }
    }

    if (prop === 'color' && atoms[0].color &&
         atoms[0].color !== 'none' &&
         (!parent || parent.color !== atoms[0].color)) {
        prefix = '\\textcolor{' + Color.colorToString(atoms[0].color) + '}{';
        suffix = '}';
    }

    if (prop === 'backgroundColor' && atoms[0].backgroundColor &&
         atoms[0].backgroundColor !== 'none' &&
         (!parent || parent.backgroundColor !== atoms[0].backgroundColor)) {
        prefix = '\\colorbox{' + Color.colorToString(atoms[0].backgroundColor) + '}{';
        suffix = '}';
    }

    result += prefix;

    result += latexifyArray(parent, 
        properties.slice(1), 
        atoms.slice(0, i), 
        expandMacro);

    result += suffix;

    // latexify the rest
    result += latexifyArray(parent, properties, atoms.slice(i), expandMacro);

    return result;
}



/**
 * Given an atom or an array of atoms, return a LaTeX string representation
 * @return {string}
 * @param {string|MathAtom|MathAtom[]} value
 * @private
 */
function latexify(parent, value, expandMacro) {
    let result = '';
    if (Array.isArray(value) && value.length > 0) {
        if (value[0].type === 'first') {
            // Remove the 'first' atom, if present
            value = value.slice(1);
            if (value.length === 0) return '';
        }

        result = latexifyArray(parent, [
            'mode', 
            'color', 
            'backgroundColor', 
            'fontSize',
            'fontFamily',
            'fontShape', 
            'fontSeries', 
            ], value, expandMacro);
        // if (result.startsWith('{') && result.endsWith('}')) {
        //     result = result.slice(1, result.length - 1);
        // }

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
 * @memberof module:core/mathAtom~MathAtom
 * @private
 */
MathAtom.MathAtom.prototype.toLatex = function(expandMacro) {
    expandMacro = expandMacro === undefined ? false : expandMacro;
    let result = '';
    let col, row = 0;
    let i = 0;
    const m = !this.latex ? null : this.latex.match(/^(\\[^{\s0-9]+)/);
    const command = m ? m[1] : null;
    switch(this.type) {
        case 'group':
            result += this.latexOpen || ((this.cssId || this.cssClass) ? '' : '{');

            if (this.cssId) result += '\\cssId{' + this.cssId + '}{';

            if (this.cssClass === 'ML__emph') {
                result += '\\emph{' + latexify(this, this.body, expandMacro) + '}';
            } else {
                if (this.cssClass) result += '\\class{' + this.cssClass + '}{';

                result += expandMacro ? latexify(this, this.body, true) :
                    (this.latex || latexify(this, this.body, false));

                if (this.cssClass) result += '}';
            }
            if (this.cssId) result += '}';

            result += this.latexClose || ((this.cssId || this.cssClass) ? '' : '}');
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
                    result += latexify(this, this.array[row][col], expandMacro);
                }
                // Adds a separator between rows (but not after the last row)
                if (row < this.array.length - 1) {
                    result += ' \\\\ ';
                }
            }
            result += '\\end{' + this.env.name + '}';
            break;

        case 'root':
            result = latexify(this, this.body, expandMacro);
            break;

        case 'genfrac':
            if (/^(choose|atop|over)$/.test(this.body)) {
                // Infix commands.
                result += '{';
                result += latexify(this, this.numer, expandMacro)
                result += '\\' + this.body + ' ';
                result += latexify(this, this.denom, expandMacro);
                result += '}';
            } else {
                // @todo: deal with fracs delimiters
                result += command;
                result += `{${latexify(this, this.numer, expandMacro)}}{${latexify(this, this.denom, expandMacro)}}`;
            }
            break;

        case 'surd':
            result += '\\sqrt';
            if (this.index) {
                result += '[';
                result += latexify(this, this.index, expandMacro);
                result += ']';
            }
            result += `{${latexify(this, this.body, expandMacro)}}`;
            break;

        case 'leftright':
            if (this.inner) {
                result += '\\left' + (this.leftDelim || '.');
                if (this.leftDelim && this.leftDelim.length > 1) result += ' ';
                result += latexify(this, this.body, expandMacro);
                result += '\\right' + (this.rightDelim || '.');
                if (this.rightDelim && this.rightDelim.length > 1) result += ' ';
            } else {
                result += '\\mleft' + (this.leftDelim || '.');
                if (this.leftDelim && this.leftDelim.length > 1) result += ' ';
                result += latexify(this, this.body, expandMacro);
                result += '\\mright' + (this.rightDelim || '.');
                if (this.rightDelim && this.rightDelim.length > 1) result += ' ';
            }
            break;

        case 'delim':
        case 'sizeddelim':
            result += command + '{' + this.delim + '}';
            break;

        case 'rule':
            result += command;
            if (this.shift) {
                result += `[${latexify(this, this.shift, expandMacro)}em]`;
            }
            result += `{${latexify(this, this.width, expandMacro)}em}{${latexify(this, this.height, expandMacro)}em}`;
            break;

        case 'line':
        case 'overlap':
        case 'accent':
            result += `${command}{${latexify(this, this.body, expandMacro)}}`;
            break;

        case 'overunder':
            result += `${command}{${latexify(this, this.overscript || this.underscript, expandMacro)}}{${latexify(parent, this.body, expandMacro)}}`;
            break;

        case 'mord':
        case 'minner':
        case 'mbin':
        case 'mrel':
        case 'mpunct':
        case 'mopen':
        case 'mclose':
        case 'textord':
        case '':        // mode = text
            if (/^\\(mathbin|mathrel|mathopen|mathclose|mathpunct|mathord|mathinner)/.test(command)) {
                result += command + '{' + latexify(this, this.body, expandMacro) + '}';
            } else if (command === '\\char"') {
                result += this.latex + ' ';
            } else if (command === '\\unicode') {
                result += '\\unicode{"';
                result += ('000000' + this.body.charCodeAt(0).toString(16)).toUpperCase().substr(-6);
                result += '}';
            } else if (this.latex || typeof this.body === 'string') {
                // Not ZERO-WIDTH
                if (this.latex && this.latex[0] === '\\') {
                    result += this.latex;
                    if (/[a-zA-Z0-9]$/.test(this.latex)) {
                        result += ' ';
                    }
                } else if (command) {
                    result += command;
                } else {
                    result += this.body !== '\u200b' ? (this.latex || this.body) : '';
                }
            }
            break;

        case 'mop':
            if (this.body !== '\u200b') {
                // Not ZERO-WIDTH
                if (command === '\\mathop') {
                    // The argument to mathop is math, therefor this.body can be an expression
                    result += command + '{' + latexify(this, this.body, expandMacro) + '}';
                } else if (command === '\\operatorname') {
                    // The argument to operator name is text, therefore this.body is a string
                    result += command + '{' + this.body + '}';
                } else {
                    if (this.latex && this.latex[0] === '\\') {
                        result += this.latex;
                        if (/[a-zA-Z0-9]$/.test(this.latex)) {
                            result += ' ';
                        }
                    } else if (command) {
                        result += command;
                    } else {
                        result += this.body !== '\u200b' ? (this.latex || this.body) : '';
                    }
                }
            }
            if (this.explicitLimits) {
                if (this.limits === 'limits') result += '\\limits ';
                if (this.limits === 'nolimits') result += '\\nolimits ';
            }
            break;


        case 'box':
            if (command === '\\bbox') {
                result += command;
                if (isFinite(this.padding) || 
                    typeof this.border !== 'undefined' || 
                    typeof this.backgroundcolor !== 'undefined') {
                    const bboxParams = [];
                    if (isFinite(this.padding)) {
                        bboxParams.push(Math.floor(1e2 * this.padding) / 1e2 + 'em')
                    }
                    if (this.border) {
                        bboxParams.push('border:' + this.border);
                    }
                    if (this.backgroundcolor) {
                        bboxParams.push(Color.colorToString(this.backgroundcolor));
                    }
                    result += `[${bboxParams.join(',')}]`;
                }
                result += `{${latexify(this, this.body, expandMacro)}}`;
            } else if (command === '\\boxed') {
                result += `\\boxed{${latexify(this, this.body, expandMacro)}}`;
            } else {
                // \\colorbox, \\fcolorbox
                result += command;
                if (this.framecolor) {
                    result += `{${Color.colorToString(this.framecolor)}}`;
                }
                if (this.backgroundcolor) {
                    result += `{${Color.colorToString(this.backgroundcolor)}}`;
                }
                result += `{${latexify(this, this.body, expandMacro)}}`;
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
                    result += '0em'
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
                    if (Object.prototype.hasOwnProperty.call(this.notation, notation) &&
                        this.notation[notation]) {
                        result += sep + notation;
                        sep = ' ';
                    }
                }
                result += '}';

                // \enclose can have optional parameters...
                let style = '';
                sep = '';
                if (this.backgroundcolor && this.backgroundcolor !== 'transparent') {
                    style += sep + 'mathbackground="' + Color.colorToString(this.backgroundcolor) + '"';
                    sep = ',';
                }
                if (this.shadow && this.shadow !== 'auto') {
                    style += sep + 'shadow="' + this.shadow + '"';
                    sep = ',';
                }
                if (this.strokeWidth !== 1 || this.strokeStyle !== 'solid') {
                    style += sep + this.borderStyle;
                    sep = ',';
                } else if (this.strokeColor && this.strokeColor !== 'currentColor') {
                    style += sep + 'mathcolor="' + Color.colorToString(this.strokeColor) + '"';
                    sep = ',';
                }


                if (style) {
                    result += `[${style}]`;
                }
            }
            result += `{${latexify(this, this.body, expandMacro)}}`;
            break;

        case 'mathstyle':
            result += '\\' + this.mathstyle + ' ';
            break;

        case 'space':
            result += this.latex;
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


        default:
            console.warn('Unexpected atom type "' + this.type + 
                '" in "' + (this.latex || this.value) + '"');
            break;

    }
    if (this.superscript) {
        let sup = latexify(this, this.superscript, expandMacro);
        if (sup.length === 1) {
            if (sup === '\u2032') {     // PRIME
                sup = '\\prime ';
            } else if (sup === '\u2033') {      // DOUBLE-PRIME
                sup = '\\doubleprime ';
            }
            result += '^' + sup;
        } else {
            result += '^{' + sup + '}';
        }
    }
    if (this.subscript) {
        const sub = latexify(this, this.subscript, expandMacro);
        if (sub.length === 1) {
            result += '_' + sub;
        } else {
            result += '_{' + sub + '}';
        }
    }
    return result;
}


// Export the public interface for this module
export default {
}



