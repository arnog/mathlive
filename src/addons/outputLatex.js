define(['mathlive/core/mathAtom'],
    function(MathAtom) {


/**
 * Give an atom or an array of atoms, return a LaTeX string representation
 * @return {string}
 * @param {string|MathAtom|MathAtom[]} value 
 * @private
 */
function latexify(value) {
    let result = '';
    if (Array.isArray(value)) {
        for (const child of value) {
            result += latexify(child);
        }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
        result = value.toString();
    } else if (typeof value === 'string') {
        result = value;
    } else if (value && typeof value.toLatex === 'function') {
        result = value.toLatex();
    }
    return result;
}



/**
 * Return a LaTeX representation of the atom
 * 
 * @return {string}
 */
MathAtom.MathAtom.prototype.toLatex = function() {
    let result = '';
    let col, row = 0;
    let i = 0;
    const command = this.latex ? this.latex.trim() : null;
    switch(this.type) {
        case 'group':
            result += this.latexOpen || '';
            result += latexify(this.children);  
            result += this.latexClose || '';
            break;

        case 'array':
            result += '\\begin{' + this.env.name + '}';
            if (this.env.name === 'array') {
                result += '{';
                if (this.colFormat) {
                    for (i = 0; i < this.colFormat.length; i++) {
                        result += this.colFormat[i].align;
                    }
                }
                result += '}';
            }
            for (row = 0; row < this.array.length; row++) {
                for (col = 0; col < this.array[row].length; col++) {
                    if (col > 0) result += ' & ';
                    result += latexify(this.array[row][col]);
                }
                result += ' \\\\ ';
            }
            result += '\\end{' + this.env.name + '}';
            break;

        case 'root':
            result = latexify(this.children);
            break;

        case 'genfrac':
            if (this.value === 'choose' || this.value === 'atop') {
                result += '{';
                result += latexify(this.numer)
                result += '\\' + this.value + ' ';
                result += latexify(this.denom);
                result += '}';
            } else {
                // @todo: deal with fracs delimiters
                result += this.latex;
                result += `{${latexify(this.numer)}}{${latexify(this.denom)}}`;
            }
            break;

        case 'surd':
            result += '\\sqrt';
            if (this.index) {
                result += '[';
                result += latexify(this.index);
                result += ']';
            }
            result += `{${latexify(this.body)}}`;
            break;

        case 'leftright':
            result += '\\left' + this.leftDelim + ' ';
            result += latexify(this.body);
            result += '\\right' + this.rightDelim + ' ';
            break;

        case 'delim':
            result += this.latex + this.delim + ' ';
            break;
        

        case 'sizeddelim':
            // @todo
            break;

        case 'rule':
            result += command;
            if (this.shift) {
                result += `[${latexify(this.shift)}]`;
            }
            result += `{${latexify(this.width)}}{${latexify(this.height)}}`;
            break;

        case 'line':
        case 'overlap':
        case 'font':
        case 'accent':
            result += `${command}{${latexify(this.body)}}`;
            break;

        case 'overunder':
            result += `${command}{${latexify(this.overscript || this.underscript)}}{${latexify(this.body)}}`;
            break;

        case 'mord':
        case 'minner':
        case 'mbin':
        case 'mrel':
        case 'mpunct':
        case 'mopen':
        case 'mclose':
        case 'textord':
            if (this.latex === '\\mathbin' || this.latex === '\\mathrel' || 
                this.latex === '\\mathopen' || this.latex === '\\mathclose' || 
                this.latex === '\\mathpunct' || this.latex === '\\mathord' || 
                this.latex === '\\mathinner') {
                result += this.latex + '{' + latexify(this.children) + '}';
            } else if (this.value) {
                if (this.value !== '\u200b') {
                    // Not ZERO-WIDTH
                    result += this.latex || this.value;
                }
            } else {
                result += latexify(this.children);
            }
            break;

        case 'op':
        case 'mop':
            if (this.value !== '\u200b') {
                // Not ZERO-WIDTH
                if (this.latex === '\\mathop ') {
                    result += this.latex + '{' + latexify(this.children) + '}';                    
                } else if (this.latex === '\\operatorname ') {
                        result += this.latex + '{' + this.value + '}';
                } else {
                    result += this.latex || this.value;
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
                result += '{' + this.textcolor + '}{' + latexify(this.body) + '}';
            }
            break;

        case 'box':
            if (command === '\\bbox') {
                result += command;
                if (this.padding || this.border || this.backgroundcolor) {
                    let bboxParams = latexify(this.padding);
                    if (this.border) {
                        if (bboxParams) bboxParams += ',';
                        bboxParams += 'border:' + latexify(this.border);
                    }
                    if (this.backgroundcolor) {
                        if (bboxParams) bboxParams += ',';
                        bboxParams += latexify(this.backgroundcolor);
                    }
                    result += `[${bboxParams}]`;
                }
                result += `{${latexify(this.body)}}`;
            } else if (command === '\\boxed') {
                result += `\\boxed{${latexify(this.body)}}`;
            } else {
                // \\colorbox, \\fcolorbox
                result += command;
                if (this.framecolor) {
                    result += `{${latexify(this.framecolor)}}`;
                }
                if (this.backgroundcolor) {
                    result += `{${latexify(this.backgroundcolor)}}`;
                }
                result += `{${latexify(this.body)}}`;
            }
            break;

        case 'spacing':
            result += command;
            if (this.width) {
                result += `{${latexify(this.width)}}`;
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
            result += `{${latexify(this.body)}}`;
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
            // @todo
            break;

        case 'first':
            break;  

        default:
            console.log('unknown atom type "' + this.type + '"');
            break;
            
    }
    if (this.superscript) {
        const sup = latexify(this.superscript);
        if (sup.length === 1) {
            result += '^' + sup;
        } else {
            result += '^{' + sup + '}';
        }
    }
    if (this.subscript) {
        const sub = latexify(this.subscript);
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
