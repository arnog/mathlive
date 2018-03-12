define(['mathlive/core/mathAtom', 'mathlive/core/color'],
    function(MathAtom, Color) {


const SPECIAL_OPERATORS = {
    '\\pm': '&PlusMinus;',
    '\\times': '&times;',
    '\\colon': ':',
    '\\lbrace': '{',
    '\\rbrace': '}',
    '\\vert': '|',
    '\\Vert': '\u2225',
    '\\mid': '\u2223',
    '\\vec': '&#x20d7;',
    '\\acute': '&#x00b4;',
    '\\grave': '&#x0060;',
    '\\dot': '&#x02d9;',
    '\\ddot': '&#x00a8;',
    '\\tilde': '&#x007e;',
    '\\bar': '&#x00af;',
    '\\breve': '&#x02d8;',
    '\\check': '&#x02c7;',
    '\\hat': '&#x005e;'
};


function xmlEscape(str) {
    return str
        // .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}


function scanIdentifier(stream, final) {
    let result = false;
    final = final || stream.atoms.length;
    let mathML = '';
    let body = '';
    let superscript = -1;
    let subscript = -1;
    const atom = stream.atoms[stream.index];

    if (stream.index < final && 
        (atom.type === 'mord' || atom.type === 'textord') && 
        '0123456789,.'.indexOf(atom.latex) < 0) {
        body = atom.toMathML();
        if (atom.superscript) {
            superscript = stream.index;
        }
        if (atom.subscript) {
            subscript = stream.index;
        }
        stream.index += 1;
    }

    if (body.length > 0) {
        result = true;

        // If there are separate atoms for sub/sup, record them
        if (isSuperscriptAtom(stream)) {
            superscript = stream.index;
            stream.index += 1;
        }
        if (isSubscriptAtom(stream)) {
            subscript = stream.index;
            stream.index += 1;
        }


        if (superscript >= 0 && subscript >= 0) {
            mathML = '<msubsup>' + body;
            mathML += toMathML(stream.atoms[subscript].subscript).mathML;
            mathML += toMathML(stream.atoms[superscript].superscript).mathML;
            mathML += '</msubsup>';            
        } else if (superscript >= 0) {
            mathML = '<msup>' + body;
            mathML += toMathML(stream.atoms[superscript].superscript).mathML;
            mathML += '</msup>';            
        } else if (subscript >= 0) {
            mathML = '<msub>' + body;
            mathML += toMathML(stream.atoms[subscript].subscript).mathML;
            mathML += '</msub>';            
        } else {
            mathML = body;
        }

        if (stream.lastType === 'mi' || 
            stream.lastType === 'mn' || 
            stream.lastType === 'fence') {
            mathML = '<mo>&InvisibleTimes;</mo>' + mathML;
        }

        if (body === '<mi>f</mi>' || body === '<mi>g</mi>') {
            mathML += '<mo> &ApplyFunction; </mo>';
            stream.lastType = 'applyfunction';
        } else {
            stream.lastType = 'mi';
        }

        stream.mathML += mathML;
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

function isSubscriptAtom(stream) {
    return stream.index < stream.atoms.length && 
        stream.atoms[stream.index].subscript && 
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



function parseSubsup(base, stream) {
    let result = false;
    let mathML = '';
    let atom = stream.atoms[stream.index - 1];

    if (!atom) return false;

    if (!atom.superscript && !atom.subscript) {
        if (isSuperscriptAtom(stream) || isSubscriptAtom(stream)) {
            atom = stream.atoms[stream.index];
            stream.index += 1;
        }
    }
    if (!atom) return false;

    if (atom.superscript && atom.subscript) {
        mathML = '<msubsup>' + base;
        mathML += toMathML(atom.subscript).mathML;
        mathML += toMathML(atom.superscript).mathML;
        mathML += '</msubsup>';
    } else if (atom.superscript) {
        mathML = '<msup>' + base;
        mathML += toMathML(atom.superscript).mathML;
        mathML += '</msup>';
    } else if (atom.subscript) {
        mathML = '<msub>' + base;
        mathML += toMathML(atom.subscript).mathML;
        mathML += '</msub>';
    }

    if (mathML.length > 0) {
        result = true;
        stream.mathML += mathML;
        stream.lastType = '';
    }
    return result;
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
            // TODO: could add attribute indicating it's a fence (fence=true)
            mathML = '<mrow>';
            mathML += toMo(stream.atoms[openIndex]);
    
            mathML += toMathML(stream.atoms, openIndex + 1, closeIndex).mathML;
    
            // TODO: could add attribute indicating it's a fence (fence=true)
            mathML += toMo(stream.atoms[closeIndex]);
            mathML += '</mrow>';

            if (stream.lastType === 'mi' || 
                stream.lastType === 'mn' || 
                stream.lastType === 'fence') {
                mathML = '<mo>&InvisibleTimes;</mo>' + mathML;
            }
            stream.index = closeIndex + 1;

            if (parseSubsup(mathML, stream)) {
                result = true;
                stream.lastType = '';
                mathML = '';
            }

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
    const atom = stream.atoms[stream.index];

    if (stream.index < final && (
        atom.type === 'mbin' || atom.type === 'mrel')) {
        mathML += stream.atoms[stream.index].toMathML();
        stream.index += 1;
        lastType = 'mo';
    } else if (stream.index < final && atom.type === 'mop') {
        // mathML += '<mrow>';

        if (atom.limits && (atom.superscript || atom.subscript)) {
            // Operator with limits, e.g. \sum
            const op = toMo(atom);
            if (atom.superscript && atom.subscript) {
                // Both superscript and subscript
                mathML += (atom.limits !== 'nolimits' ? '<munderover>' : '<msubsup>') + op;
                mathML += toMathML(atom.subscript).mathML;
                mathML += toMathML(atom.superscript).mathML;
                mathML += (atom.limits !== 'nolimits' ? '</munderover>' : '</msubsup>');
            } else if (atom.superscript) {
                // Superscript only
                mathML += (atom.limits !== 'nolimits' ? '<mover>' : '<msup>') + op;
                mathML += toMathML(atom.superscript).mathML;
                mathML += (atom.limits !== 'nolimits' ? '</mover>' : '</msup>');
            } else {
                // Subscript only
                mathML += (atom.limits !== 'nolimits' ? '<munder>' : '<msub>') + op;
                mathML += toMathML(atom.subscript).mathML;
                mathML += (atom.limits !== 'nolimits' ? '</munder>' : '</msub>');
            }
            lastType = 'mo';
        } else {

            mathML += toMi(stream.atoms[stream.index]);

            mathML += '<mo> &ApplyFunction; </mo>';

            // mathML += scanArgument(stream);
            lastType = 'applyfunction';
        }
        // mathML += '</mrow>';

        if (stream.lastType === 'mi' || stream.lastType === 'mn') {
            mathML = '<mo>&InvisibleTimes;</mo>' + mathML;
        }
        stream.index += 1;
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
 * @param {number} final last index of the input to stop conversion to 
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
                let mathML = result.atoms[result.index].toMathML();
                if (result.lastType === 'mn' && mathML.length > 0 && result.atoms[result.index].type === 'genfrac') {
                    // If this is a fraction preceded by a number (e.g. 2 1/2), 
                    // add an "invisible plus" (U+0264) character in front of it
                    mathML = '<mo>&#x2064;</mo>' + mathML;
                }
                result.lastType = '';
                if (mathML.length > 0) {
                    result.mathML += mathML;
                    count += 1;
                }
                result.index += 1;
            }
        }

        // If there are more than a single element, wrap them in a mrow tag.
        if (count > 1) {
            result.mathML = '<mrow>' + result.mathML + '</mrow>';
        }
    }

    return result;
}

function toMi(atom) {
    let result = '';
    if (atom) {
        if (atom.value) {
            result = xmlEscape(atom.value);
        } else {
            result = toMathML(atom.children).mathML;
        }
        if (result) {
            result = '<mi>' + result + '</mi>';
        }
    }
    return result;
}

function toMo(atom) {
    let result = '';
    if (atom) {
        if (atom.value) {
            result = xmlEscape(atom.value);
        } else {
            result = toMathML(atom.children).mathML;
        }
        if (result && !result.match(/^<mo>(.*)<\/mo>$/)) {
            result = '<mo>' + result + '</mo>';
        }
    }
    return result;
}

function toString(atoms) {
    if (!atoms) return undefined;
    let result = '';
    for (const atom of atoms) {
        if (atom.type === 'textord' || atom.type === 'mord') {
            result += atom.value;
        }
    }
    return xmlEscape(result);
}


/**
 * Return a MathML fragment representation of a single atom
 * 
 * @return {string}
 */
MathAtom.MathAtom.prototype.toMathML = function() {
    const SPECIAL_IDENTIFIERS = {
        '\\exponentialE': '&ExponentialE;',
        '\\imaginaryI': '&ImaginaryI;',
        '\\differentialD': '&DifferentialD;',
        '\\capitalDifferentialD': '&CapitalDifferentialD;',
        '\\alpha': '&alpha;',
        '\\pi': '&pi;',
        '\\infty' : '&infin;',
        '\\forall' : '&forall;',
        '\\nexists': '&nexists;',
        '\\exists': '&exist;',
        '\\hbar': '\u210f',
        '\\cdotp': '\u22c5',
        '\\ldots': '\u2026',
        '\\cdots': '\u22ef',
        '\\ddots': '\u22f1',
        '\\vdots': '\u22ee',
        '\\ldotp': '\u002e',
                // TODO: include all the 'textord' that are identifiers, not operators.
    };

    const MATH_VARIANTS = {
        'mathbb': 'double-struck',
        'mathbf': 'bold',
        'mathcal': 'script',
        'mathfrak': 'fraktur',
        'mathscr': 'script',
        'mathsf': 'sans-serif',
        'mathtt': 'monospace'
    };
    const SPACING = {
        '\\!':          -3 / 18,
        '\\ ':          6 / 18,
        '\\,':          3 / 18,
        '\\:':          4 / 18,
        '\\;':          5 / 18,
        '\\quad':       1,
        '\\qquad':      2,
        '\\enskip':    .5,
    };

    let result = '';
    let sep = '';
    let col, row, i;
    let underscript, overscript, body;
    let variant = MATH_VARIANTS[this.fontFamily || this.font] || '';
    if (variant) {
        variant = ' mathvariant="' + variant + '"';
    }

    const command = this.latex ? this.latex.trim() : null;
    switch(this.type) {
        case 'group':
        case 'root':
            result = toMathML(this.children).mathML;
            break;

        case 'array':
            if ((this.lFence && this.lFence !== '.') || 
                (this.rFence && this.rFence !== '.')) {
                result += '<mrow>';
                if ((this.lFence && this.lFence !== '.')) {
                    result += '<mo>' + (SPECIAL_OPERATORS[this.lFence] || this.lFence) + '</mo>';
                }
            }
            result += '<mtable';
            if (this.colFormat) {
                result += ' columnalign="';
                for (i = 0; i < this.colFormat.length; i++) {
                    if (this.colFormat[i].align) {
                        result += {l:'left', c:'center', r:'right'}[this.colFormat[i].align] + ' ';
                    }
                }
                result += '"';
            }
        
            result += '>';
            for (row = 0; row < this.array.length; row++) {
                result += '<mtr>';
                for (col = 0; col < this.array[row].length; col++) {
                    result += '<mtd>' + toMathML(this.array[row][col]).mathML + '</mtd>';
                }
                result += '</mtr>';
            }
            
            result += '</mtable>';

            if ((this.lFence && this.lFence !== '.') || 
                (this.rFence && this.rFence !== '.')) {
                if ((this.rFence && this.rFence !== '.')) {
                    result += '<mo>' + (SPECIAL_OPERATORS[this.lFence] || this.rFence) + '</mo>';
                }
                result += '</mrow>';
            }
            break;

        case 'genfrac':
            if (this.leftDelim || this.rightDelim) {
                result += '<mrow>';
            }
            if (this.leftDelim && this.leftDelim !== '.') {
                result += '<mo>' + (SPECIAL_OPERATORS[this.leftDelim] || this.leftDelim) + '</mo>';
            }
            if (this.hasBarLine) {
                result += '<mfrac>';
                result += toMathML(this.numer).mathML || '<mi>&nbsp;</mi>';
                result += toMathML(this.denom).mathML || '<mi>&nbsp;</mi>';
                result += '</mfrac>';
            } else {
                // No bar line, i.e. \choose, etc...
                result += '<mtable>';
                result += '<mtr>' + toMathML(this.numer).mathML + '</mtr>';
                result += '<mtr>' + toMathML(this.denom).mathML + '</mtr>';
                result += '</mtable>';
            }
            if (this.rightDelim && this.rightDelim !== '.') {
                result += '<mo>' + (SPECIAL_OPERATORS[this.rightDelim] || this.rightDelim) + '</mo>';
            }
            if (this.leftDelim || this.rightDelim) {
                result += '</mrow>';
            }
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
            // TODO: could add fence=true attribute
            result = '<mrow>';
            if (this.leftDelim && this.leftDelim !== '.') {
                result += '<mo>' + (SPECIAL_OPERATORS[this.leftDelim] || this.leftDelim) + '</mo>';
            }
            result += toMathML(this.body).mathML;
            if (this.rightDelim && this.rightDelim !== '.') {
                result += '<mo>' + (SPECIAL_OPERATORS[this.rightDelim] || this.rightDelim) + '</mo>';
            }
            result += '</mrow>';
            break;

        case 'delim':
            result += '<mo>' + (SPECIAL_OPERATORS[this.delim] || this.delim) + '</mo>';
            break;

        case 'sizeddelim':
            break;

        case 'rule':
            break;

        case 'font':
            if (command === '\\text' || command === '\\textrm' ||
                command === '\\textsf' || command === '\\texttt' ||
                command === '\\textnormal' || command === '\\textbf' ||
                command === '\\textit') {
                result += '<mtext' + variant + '>';
                // Replace first and last space in text with a &nbsp; to ensure they 
                // are actually displayed (content surrounded by a tag gets trimmed)
                // TODO: alternative: use <mspace>
                result += toString(this.body).
                    replace(/^\s/, '&nbsp;').
                    replace(/\s$/, '&nbsp;');
                result += '</mtext>';
            } else {
                result += '<mi' + variant + '>' + toString(this.body) + '</mi>';
            }
            break;

        case 'accent':
            result += '<mover accent="true">';
            result += toMathML(this.body).mathML;
            result += '<mo>' + (SPECIAL_OPERATORS[command] || this.accent) + '</mo>';
            result += '</mover>'
            break;

        case 'line':
        case 'overlap':
            break;

        case 'overunder':
            overscript = this.overscript;
            underscript = this.underscript;
            if (overscript && underscript) {
                body = this.body;
            } else if (overscript) {
                body = this.body;
                if (this.body[0] && this.body[0].underscript) {
                    underscript = this.body[0].underscript;
                    body = this.body[0].body;
                } else if (this.body[0] && this.body[0].type === 'first' && this.body[1] && this.body[1].underscript) {
                    underscript = this.body[1].underscript;
                    body = this.body[1].body;
                }
            } else if (underscript) {
                body = this.body;
                if (this.body[0] && this.body[0].overscript) {
                    overscript = this.body[0].overscript;
                    body = this.body[0].body;
                } else if (this.body[0] && this.body[0].type === 'first' && this.body[1] && this.body[1].overscript) {
                    overscript = this.body[1].overscript;
                    body = this.body[1].body;
                }
            }
            
            if (overscript && underscript) {
                result += '<munderover' + variant + '>' + toMathML(body).mathML;
                result += toMathML(underscript).mathML;
                result += toMathML(overscript).mathML;
                result += '</munderover>';
            } else if (overscript) {
                result += '<mover' + variant + '>' + toMathML(body).mathML;
                result += toMathML(overscript).mathML;
                result += '</mover>';
            } else if (underscript) {
                result += '<munder' + variant + '>' + toMathML(body).mathML;
                result += toMathML(underscript).mathML;
                result += '</munder>';
            }
            break;

        case 'mord':
            result = SPECIAL_IDENTIFIERS[command] || command || this.value;
            if (result.length > 0 && result.charAt(0) === '\\') {
                // This is an identifier with no special handling. Use the 
                // Unicode value
                if (this.value && this.value.charCodeAt(0) > 255) {
                    result = '&#x' + ('000000' + 
                        this.value.charCodeAt(0).toString(16)).substr(-4) + ';';
                } else if (this.value) {
                    result = this.value.charAt(0);
                }
            }
            result = '<mi' + variant + '>' + xmlEscape(result) + '</mi>';
            break;

        case 'mbin':
        case 'mrel':
        case 'textord':
        case 'minner':
            if (command && SPECIAL_IDENTIFIERS[command]) {
                // Some 'textord' are actually identifiers. Check them here.
                result = '<mi>' + SPECIAL_IDENTIFIERS[command] + '</mi>';
            } else if (command && SPECIAL_OPERATORS[command]) {
                result = '<mo>' + SPECIAL_OPERATORS[command] + '</mo>';
            } else {
                result = toMo(this);
            }
            break;

        case 'mpunct':
            result = '<mo separator="true">' + (SPECIAL_OPERATORS[command] || command) + '</mo>';
            break;
 
        case 'op':
        case 'mop':
            if (this.value !== '\u200b') {
                // Not ZERO-WIDTH
                if (command === '\\operatorname') {
                    result += '<mo>' + this.value + '</mo>';
                } else {
                    result += '<mo>' + command || this.value + '</mo>';
                }
            }    
            break;

        case 'color':
            if (this.textcolor) {
                result += '<mstyle color="' + Color.stringToColor(this.textcolor) + '">'; 
                result += toMathML(this.body).mathML;
                result += '</mstyle>';
            }
            break;

        case 'mathstyle':
            // TODO: mathstyle is a switch. Need to figure out its scope to properly wrap it around a <mstyle> tag
            // if (this.mathstyle === 'displaystyle') {
            //     result += '<mstyle displaystyle="true">'; 
            //     result += '</mstyle>'; 
            // } else {
            //     result += '<mstyle displaystyle="false">'; 
            //     result += '</mstyle>'; 
            // };
            break;

        case 'box':
            result = '<menclose notation="box"';
            if (this.backgroundcolor) {
                result += ' mathbackground="' + Color.stringToColor(this.backgroundcolor) + '"';
            }
            result += '>' + toMathML(this.body).mathML + '</menclose>';
            break;

        case 'spacing':
            result += '<mspace width="' + (SPACING[command] || 0) + 'em"/>';
            break;

        case 'enclose':
            result = '<menclose notation="';
            for (const notation in this.notation) {
                if (this.notation.hasOwnProperty(notation) && 
                    this.notation[notation]) {
                    result += sep + notation;
                    sep = ' ';
                }
            }
            result += '">' + toMathML(this.body).mathML + '</menclose>';
            break;

        case 'sizing':
            break;

        case 'space':
            result += '&nbsp;'
            break;
            
    }
    return result;
}


MathAtom.toMathML = function(atoms) {
    return toMathML(atoms).mathML;
}


// Export the public interface for this module
return { 
}


})
