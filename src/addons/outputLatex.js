define(['mathlive/core/mathAtom'],
    function(MathAtom) {


/**
 * Give an atom or an array of atoms, return a LaTeX string representation
 * @return {string}
 * @param {string|MathAtom|MathAtom[]} value 
 * @private
 */
function latexify(value, expandMacro) {
    let result = '';
    if (Array.isArray(value)) {
        for (const child of value) {
            result += latexify(child, expandMacro);
        }
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
 * Return a LaTeX representation of the atom
 * 
 * @param {boolean} expandMacro - If true, macros are fully expanded. This will
 * no longer round-trip.
 * 
 * @return {string}
 */
MathAtom.MathAtom.prototype.toLatex = function(expandMacro) {
    expandMacro = expandMacro === undefined ? false : expandMacro;
    let result = '';
    let col, row = 0;
    let i = 0;
    const command = this.latex ? this.latex.trim() : null;
    switch(this.type) {
        case 'group':
            result += this.latexOpen || '';
            result += expandMacro ? latexify(this.body, true) : 
                (this.latex || latexify(this.body, false)); 
            result += this.latexClose || '';
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
                    result += latexify(this.array[row][col], expandMacro);
                }
                // Adds a separator between rows (but not after the last row)
                if (row < this.array.length - 1) {
                    result += ' \\\\ ';
                }
            }
            result += '\\end{' + this.env.name + '}';
            break;

        case 'root':
            result = latexify(this.body, expandMacro);
            break;

        case 'genfrac':
            if (this.body === 'choose' || this.body === 'atop') {
                // Infix commands.
                result += '{';
                result += latexify(this.numer, expandMacro)
                result += '\\' + this.body + ' ';
                result += latexify(this.denom, expandMacro);
                result += '}';
            } else {
                // @todo: deal with fracs delimiters
                result += this.latex;
                result += `{${latexify(this.numer, expandMacro)}}{${latexify(this.denom, expandMacro)}}`;
            }
            break;

        case 'surd':
            result += '\\sqrt';
            if (this.index) {
                result += '[';
                result += latexify(this.index, expandMacro);
                result += ']';
            }
            result += `{${latexify(this.body, expandMacro)}}`;
            break;

        case 'leftright':
            result += '\\left' + (this.leftDelim || '.') + ' ';
            result += latexify(this.body, expandMacro);
            result += '\\right' + (this.rightDelim || '.') + ' ';
            break;

        case 'delim':
        case 'sizeddelim':
            result += command + '{' + this.delim + '}';
            break;

        case 'rule':
            result += command;
            if (this.shift) {
                result += `[${latexify(this.shift, expandMacro)}em]`;
            }
            result += `{${latexify(this.width, expandMacro)}em}{${latexify(this.height, expandMacro)}em}`;
            break;

        case 'line':
        case 'overlap':
        case 'font':
        case 'accent':
            result += `${command}{${latexify(this.body, expandMacro)}}`;
            break;

        case 'overunder':
            result += `${command}{${latexify(this.overscript || this.underscript, expandMacro)}}{${latexify(this.body, expandMacro)}}`;
            break;

        case 'mord':
        case 'minner':
        case 'mbin':
        case 'mrel':
        case 'mpunct':
        case 'mopen':
        case 'mclose':
        case 'textord':
            if (command === '\\mathbin' || command === '\\mathrel' || 
                command === '\\mathopen' || command === '\\mathclose' || 
                command === '\\mathpunct' || command === '\\mathord' || 
                command === '\\mathinner') {
                result += command + '{' + latexify(this.body, expandMacro) + '}';
            } else if (command === '\\unicode') {
                result += '\\unicode{"';
                result += ('000000' + this.body.charCodeAt(0).toString(16)).toUpperCase().substr(-6);
                result += '}';
            } else if (this.latex || typeof this.body === 'string') {
                // Not ZERO-WIDTH
                if (this.latex && this.latex[0] === '\\') {
                    result += this.latex + ' ';
                } else if (this.latex) {
                    result += this.latex;
                } else {
                    result += this.body !== '\u200b' ? this.body : '';
                }
            }
            break;

        case 'mop':
            if (this.body !== '\u200b') {
                // Not ZERO-WIDTH
                if (command === '\\mathop' || command === '\\operatorname') {
                    result += command + '{' + latexify(this.body, expandMacro) + '}';                    
                } else {
                    result += this.latex || this.body;
                }
            }
            if (this.explicitLimits) {
                if (this.limits === 'limits') result += '\\limits ';
                if (this.limits === 'nolimits') result += '\\nolimits ';
            }
            break;

        case 'color':
            result += command;
            if (this.color) {
                result += `{${this.color}}`;
            } else if (this.textcolor) {
                result += '{' + this.textcolor + '}{' + latexify(this.body, expandMacro) + '}';
            }
            break;

        case 'box':
            if (command === '\\bbox') {
                result += command;
                if (this.padding || this.border || this.backgroundcolor) {
                    let bboxParams = latexify(this.padding, expandMacro);
                    if (this.border) {
                        if (bboxParams) bboxParams += ',';
                        bboxParams += 'border:' + latexify(this.border, expandMacro);
                    }
                    if (this.backgroundcolor) {
                        if (bboxParams) bboxParams += ',';
                        bboxParams += latexify(this.backgroundcolor, expandMacro);
                    }
                    result += `[${bboxParams}]`;
                }
                result += `{${latexify(this.body, expandMacro)}}`;
            } else if (command === '\\boxed') {
                result += `\\boxed{${latexify(this.body, expandMacro)}}`;
            } else {
                // \\colorbox, \\fcolorbox
                result += command;
                if (this.framecolor) {
                    result += `{${latexify(this.framecolor, expandMacro)}}`;
                }
                if (this.backgroundcolor) {
                    result += `{${latexify(this.backgroundcolor, expandMacro)}}`;
                }
                result += `{${latexify(this.body, expandMacro)}}`;
            }
            break;

        case 'spacing':
            result += command;
            if (this.width) {
                result += `{${latexify(this.width, expandMacro)}}`;
            } else {
                result += ' ';
            }
            break;

        case 'enclose':
            result += command;
            if (command === '\\enclose') {
                result += '{';
                let sep = '';
                for (const notation in this.notation) {
                    if (this.notation.hasOwnProperty(notation) && 
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
                    style += sep + 'mathbackground="' + this.backgroundcolor + '"';
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
                    style += sep + 'mathcolor="' + this.strokeColor + '"';
                    sep = ',';
                }


                if (style) {
                    result += `[${style}]`;
                }
            }
            result += `{${latexify(this.body, expandMacro)}}`;
            break;

        case 'mathstyle':
            result += '\\' + this.mathstyle + ' ';
            break;

        case 'sizing':
            result =  {'size1': '\\tiny ', 
                'size2': '\\scriptsize ', 
                'size3': '\\footnotesize ',
                'size4': '\\small ', 
                'size5': '\\normalsize ',
                'size6': '\\large ', 
                'size7': '\\Large ', 
                'size8': '\\LARGE ', 
                'size9': '\\huge ',
                'size10': '\\Huge '}[this.size] || '';
            break;

        case 'space':
            result += this.latex;
            break;

        case 'first':
        case 'placeholder':
        case 'command':
            break;  

        default:
            console.log('unknown atom type "' + this.type + '"');
            break;
            
    }
    if (this.superscript) {
        const sup = latexify(this.superscript, expandMacro);
        if (sup.length === 1) {
            result += '^' + sup;
        } else {
            result += '^{' + sup + '}';
        }
    }
    if (this.subscript) {
        const sub = latexify(this.subscript, expandMacro);
        if (sub.length === 1) {
            result += '_' + sub;
        } else {
            result += '_{' + sub + '}';
        }
    }
    return result;
}


// Export the public interface for this module
return { 
}


})
