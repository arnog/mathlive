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
    const command = this.latex ? this.latex.trim() : null;
    switch(this.type) {
        case 'group':
            result += this.latexOpen || '';
            result += latexify(this.children);  
            result += this.latexClose || '';
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
                result += '\\frac';
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
            result += '\\left' + this.leftDelim;
            result += latexify(this.body);
            result += '\\right' + this.rightDelim;
            break;
        case 'delim':
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
            if (this.value) {
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
        // @todo
            if (this.value !== '\u200b') {
                // Not ZERO-WIDTH
                result += this.latex || this.value;
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
                result += `{${this.textcolor}{${latexify(this.body)}}`;
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
                result += command;
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
            result += `${command}{${latexify(this.width)}}`;
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

        case 'space':
        case 'sizing':
        case 'mathstyle':
            // @todo
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
