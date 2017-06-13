define(['mathlive/core/mathAtom'],
    function(MathAtom) {


/**
 * Return a LaTeX representation of the atom
 * 
 * @return {string}
 */
MathAtom.MathAtom.prototype.toLatex = function() {
    let result = '';
    switch(this.type) {
        case 'group':
        case 'root':
            for(const child of this.children) {
                result += child.toLatex();
            }
            break;
        case 'genfrac':
            // @todo: deal with fracs delimiters
            result += '\\frac';
            result += '{';
            for(const child of this.numer) result += child.toLatex();
            result += '}';
            result += '{';
            for(const child of this.denom) result += child.toLatex();
            result += '}';
            break;
        case 'surd':
            result += '\\sqrt';
            if (this.index) {
                result += '[';
                for(const child of this.index) result += child.toLatex();
                result += ']';
            }
            result += '{';
            for(const child of this.body) result += child.toLatex();
            result += '}';
            break;
        case 'accent':
            break;
        case 'leftright':
            result += '\\left' + this.leftDelim;
            for(const child of this.body) result += child.toLatex();
            result += '\\right' + this.rightDelim;
            break;
        case 'delim':
        case 'sizeddelim':
            // @todo
            break;
        case 'line':
            // @todo
            break;
        case 'rule':
            // @todo
            break;
        case 'overunder':
            // @todo
            break;
        case 'overlap':
            // @todo
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
                for(const child of this.children) {
                    result += child.toLatex();
                }
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
        case 'font':
        case 'space':
        case 'spacing':
        case 'color':
        case 'sizing':
        case 'mathstyle':
        case 'box':
            // @todo
            break;
            
    }
    if (this.superscript) {
        let sup = '';
        for(const child of this.superscript) sup += child.toLatex();
        if (sup.length === 1) {
            result += '^' + sup;
        } else {
            result += '^{' + sup + '}';
        }
    }
    if (this.subscript) {
        let sub = '';
        for(const child of this.subscript) sub += child.toLatex();
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
