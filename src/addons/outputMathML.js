define(['mathlive/core/mathAtom'],
    function(MathAtom) {

// TODO
// leftright and sizeddelim as fences
// arguments (e.g. sin(x))

// SAMPLES
// 10+2xy
    // <mrow>
    //  <mn>10</mn>
    //  <mo>+</mo>
    //  <mn>2</mn>
    //  <mo>&InvisibleTimes;</mo><mi>x</mi>
    //  <mo>&InvisibleTimes;</mo><mi>y</mi>
    //  </mrow>

// 123+45^6

// 12^2+34x^2

// \frac{1}{3+x}

// \sin x
    // <mrow>
    //  <mi> sin </mi>
    //  <mo> &ApplyFunction; </mo>
    //  <mi> x </mi>
    // </mrow>

// \sin (x + \pi)

// \sin (x / 2)





function scanIdentifier(stream, final) {
    let result = false;
    final = final || stream.atoms.length;
    let mathML = '';
    let superscript = -1;

    if (stream.index < final && 
        stream.atoms[stream.index].type === 'mord' && 
        '0123456789,.'.indexOf(stream.atoms[stream.index].latex) < 0 && 
        superscript < 0
    ) {
        mathML += stream.atoms[stream.index].toMathML();
        if (stream.atoms[stream.index].superscript) {
            superscript = stream.index;
        }
        stream.index += 1;
    }

    if (mathML.length > 0) {
        result = true;
        mathML = mathML;

        if (isSuperscriptAtom(stream)) {
            superscript = stream.index;
            stream.index += 1;
        }
        if (superscript >= 0) {
            mathML = '<msup>' + mathML;
            mathML +=  toMathML(stream.atoms[superscript].superscript).mathML;
            mathML += '</msup>';            
        }

        if (stream.lastType === 'mi' || stream.lastType === 'mn' || stream.lastType === 'applyfunction') {
            mathML = '<mo>&InvisibleTimes;</mo>' + mathML;
        }
        stream.mathML += mathML;
        stream.lastType = 'mi';
    }

    return result;
}

/**
 * Return true if the current atom is a standalone superscript atom
 * i.e. an atom with no content, except of a superscript.
 * Superscripts can be encoded either as an attribute on the last atom
 * or as a standalone, empty, atom following the one to which it applies.
 * @param {*} stream 
 */
function isSuperscriptAtom(stream) {
    return stream.index < stream.atoms.length && 
        stream.atoms[stream.index].superscript && 
        stream.atoms[stream.index].type === 'mord' &&
        stream.atoms[stream.index].value === '\u200b';
}

function indexOfSuperscriptInNumber(stream) {

    let result = -1;
    let i = stream.index;
    let done = false;
    let found = false;
    while (i < stream.atoms.length && !done && !found) {
        done = stream.atoms[i].type !== 'mord' ||
            '0123456789,.'.indexOf(stream.atoms[i].latex) < 0;
        found = !done && stream.atoms[i].superscript;
        i++
    }

    if (found) {
        result = i;
    }

    return result;
}

function scanArgument(stream, final) {
    // TODO
    // A single identifier, number, frac, etc...
    // or a fenced list

    return '';
}

function scanNumber(stream, final) {
    let result = false;
    final = final || stream.atoms.length;
    let mathML = '';

    let superscript = indexOfSuperscriptInNumber(stream);
    if (superscript >= 0 && superscript < final) {
        final = superscript;
    }

    while (stream.index < final && 
        stream.atoms[stream.index].type === 'mord' && 
        '0123456789,.'.indexOf(stream.atoms[stream.index].latex) >= 0
    ) {
        mathML += stream.atoms[stream.index].latex;
        stream.index += 1;
    }


    if (mathML.length > 0) {
        result = true;
        mathML = '<mn>' + mathML + '</mn>';

        if (superscript < 0 && isSuperscriptAtom(stream)) {
            superscript = stream.index;
            stream.index += 1;
        }

        if (superscript >= 0) {
            mathML = '<msup>' + mathML;
            mathML +=  toMathML(stream.atoms[superscript].superscript).mathML;
            mathML += '</msup>';
        }
    
        stream.mathML += mathML;
        stream.lastType = 'mn';
    }

    return result;
}

function scanFence(stream, final) {
    let result = false;
    final = final || stream.atoms.length;
    let mathML = '';
    let lastType = '';

    if (stream.index < final &&
        stream.atoms[stream.index].type === 'mopen') {
        let found = false;
        let depth = 0;
        const openIndex = stream.index;
        let closeIndex = -1;
        let index = openIndex + 1;
        while (index < final && !found) {
            if (stream.atoms[index].type === 'mopen') {
                depth += 1;
            } else if (stream.atoms[index].type === 'mclose') {
                depth -= 1;
            }
            if (depth === -1) {
                found = true;
                closeIndex = index;
            }
            index += 1;
        }
        if (found) {
            mathML = '<mfenced open="';
            mathML += stream.atoms[openIndex].value;
            mathML += '" close="';
            mathML += stream.atoms[closeIndex].value;
            mathML += '">';
    
            mathML += toMathML(stream.atoms, openIndex + 1, closeIndex).mathML;
    
            mathML += '</mfenced>';
    
            if (stream.lastType === 'mi' || stream.lastType === 'mn' || stream.lastType === 'applyfunction') {
                mathML = '<mo>&InvisibleTimes;</mo>' + mathML;
            }
            stream.index = closeIndex + 1;
            lastType = 'fence';
        }
    }

    if (mathML.length > 0) {
        result = true;
        stream.mathML += mathML;
        stream.lastType = lastType;
    }

    return result;
}

function scanOperator(stream, final) {
    let result = false;
    final = final || stream.atoms.length;
    let mathML = '';
    let lastType = '';

    if (stream.index < final && (
        stream.atoms[stream.index].type === 'mbin' ||
        stream.atoms[stream.index].type === 'mrel')) {
            mathML += stream.atoms[stream.index].toMathML();
            stream.index += 1;
            lastType = 'mo';
        } else if (stream.index < final && 
        stream.atoms[stream.index].type === 'mop') {
        mathML += '<mrow>';

        mathML += '<mi>' + stream.atoms[stream.index].value + '</mi>';

        mathML += '<mo> &ApplyFunction; </mo>';

        mathML += scanArgument(stream);

        mathML += '</mrow>';

        if (stream.lastType === 'mi' || stream.lastType === 'mn' || stream.lastType === 'applyfunction') {
            mathML = '<mo>&InvisibleTimes;</mo>' + mathML;
        }
        stream.index += 1;
        lastType = 'applyfunction';
    }

    if (mathML.length > 0) {
        result = true;
        stream.mathML += mathML;
        stream.lastType = lastType;
    }

    return result;
}


/**
 * Given an atom or an array of atoms, return their MathML representation as 
 * a string.
 * @return {string}
 * @param {string|MathAtom|MathAtom[]} input
 * @param {number} initial index of the input to start conversion from
 * @param {number{ final last index of the input to stop conversion to 
 * @private
 */
function toMathML(input, initial, final) {
    const result = {
        atoms: input,
        index: initial || 0,
        mathML: '',
        lastType: ''
    };
    final = final || input.length;

    if (typeof input === 'number' || typeof input === 'boolean') {
        result.mathML = input.toString();
    } else if (typeof input === 'string') {
        result.mathML = input;
    } else if (input && typeof input.toMathML === 'function') {
        result.mathML = input.toMathML();
    } else if (Array.isArray(input)) {
        let count = 0;

        while (result.index < final) {
            if (scanNumber(result, final) ||
                scanIdentifier(result, final) ||
                scanOperator(result, final) ||
                scanFence(result, final)) {
                    count += 1;
            } else if (result.index < final) {
                result.mathML += result.atoms[result.index].toMathML();
                result.lastType = '';
                result.index += 1;
                count += 1;
            }
        }

        // If there are more than a single element, wrap them in a mrow tag.
        if (count > 1) {
            result.mathML = '<mrow>' + result.mathML + '</mrow>';
        }
    }

    return result;
}




/**
 * Return a MathML fragment representation of a single atom
 * 
 * @return {string}
 */
MathAtom.MathAtom.prototype.toMathML = function() {
    const SPECIAL_OPERATORS = {
        '\\pm': '&PlusMinus;',
        '\\times': '&times;'
    };

    const SPECIAL_IDENTIFIERS = {
        '\\exponentialE': '&ExponentialE;',
        '\\imaginaryI': '&ImaginaryI;',
        '\\differentialD': '&DifferentialD;',
        '\\capitalDifferentialD': '&CapitalDifferentialD;',
        '\\alpha': '&alpha;',
        '\\pi': '&pi;'
    };

    let result = '';
    const command = this.latex ? this.latex.trim() : null;
    switch(this.type) {
        case 'group':
        case 'root':
            result = toMathML(this.children).mathML;
            break;

        case 'genfrac':
            // @todo: deal with fracs delimiters
            result += '<mfrac>';
            result += toMathML(this.numer).mathML;
            result += toMathML(this.denom).mathML;
            result += '</mfrac>';
            break;

        case 'surd':
            if (this.index) {
                result += '<mroot>';
                result += toMathML(this.body).mathML;
                result += toMathML(this.index).mathML;
                result += '</mroot>';
            } else {
                result += '<msqrt>';
                result += toMathML(this.body).mathML;
                result += '</msqrt>';
            }
            break;

        case 'leftright':
            break;

        case 'delim':
        case 'sizeddelim':
            break;

        case 'rule':
            break;

        case 'line':
        case 'overlap':
        case 'font':
        case 'accent':
            break;

        case 'overunder':
            break;

        case 'mord':
        case 'textord':
            result = SPECIAL_IDENTIFIERS[command] || command || this.value;
            if (result.length > 0 && result.charAt(0) === '\\') {
                // This is an identifier with no special handling. Use the 
                // Unicode value
                if (this.value) {
                    result = '&#x' + ('000000' + 
                        this.value.charCodeAt(0).toString(16)).substr(-4) + ';';
                }
            }
            result = '<mi>' + result + '</mi>';
            break;

        case 'mbin':
        case 'mrel':
            if (command && SPECIAL_OPERATORS[command]) {
                result = '<mo>' + SPECIAL_OPERATORS[command] + '</mo>';
            } else {
                result = '<mo>' + (this.value ||  toMathML(this.children).mathML) + '</mo>';
            }
            break;

        case 'mopen':
        case 'mclose':
        case 'mpunct':
            result = '<mo>' + command + '</mo>';
            break;

        case 'minner':
            break;

        case 'op':
        case 'mop':
            break;

        case 'color':
            break;
        case 'box':
            break;

        case 'spacing':
            break;

        case 'enclose':
            break;

        case 'space':
        case 'sizing':
        case 'mathstyle':
            break;
            
    }
    return result;
}


// Export the public interface for this module
return { 
}


})
