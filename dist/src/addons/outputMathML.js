/**
 * 
 * This module outputs a formula to MathML.
 * 
 * To use it, use the {@linkcode MathAtom#toMathML MathAtom.toMathML()}  method.
 * 
 * @module addons/outputMathML
 * @private
 */

import MathAtom from '../core/mathAtom.js';
import Color from '../core/color.js';


const SPECIAL_OPERATORS = {
    '\\pm': '&PlusMinus;',
    '\\times': '&times;',
    '\\colon': ':',
    '\\vert': '|',
    '\\Vert': '\u2225',
    '\\mid': '\u2223',
    '\\lbrace': '{',
    '\\rbrace': '}',
    '\\langle': '\u27e8',
    '\\rangle': '\u27e9',
    '\\lfloor': '\u230a',
    '\\rfloor': '\u230b',
    '\\lceil': '\u2308',
    '\\rceil': '\u2309',

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

function makeID(id, options) {
    if (!id || !options.generateID) return '';
    // Note: the 'extid' attribute is recognized by SRE as an attribute
    // to be passed to SSML as a <mark> tag.
    return ' extid="' + id + '"';
}


function scanIdentifier(stream, final, options) {
    let result = false;
    final = final || stream.atoms.length;
    let mathML = '';
    let body = '';
    let superscript = -1;
    let subscript = -1;
    const atom = stream.atoms[stream.index];

    if (stream.index < final &&
        (atom.type === 'mord' || atom.type === 'textord') &&
        '0123456789,.'.indexOf(atom.body) < 0) {
        body = atom.toMathML(options);
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
            mathML += toMathML(stream.atoms[subscript].subscript, 0, 0, options).mathML;
            mathML += toMathML(stream.atoms[superscript].superscript, 0, 0, options).mathML;
            mathML += '</msubsup>';
        } else if (superscript >= 0) {
            mathML = '<msup>' + body;
            if (isSuperscriptAtom(stream)) {
                // There's another superscript after this one. Maybe double-prime?
                const sup = toMathML(stream.atoms[superscript].superscript, 0, 0, options).mathML;

                const sup2 = toMathML(stream.atoms[superscript + 1].superscript, 0, 0, options).mathML;
                if ((sup === '<mi>\u2032</mi>' || sup === '<mi>&#x2032;</mi>') && 
                    (sup2 === '<mi>\u2032</mi>' || sup2 === '<mi>&#x2032;</mi>')) {
                    mathML += '<mi>&#x2033;</mi>';
                } else if (sup === '<mi>\u2032</mi>' || sup === '<mi>&#x2032;</mi>') {
                    mathML += '<mi>&#x2032;</mi>';
                } else {
                    mathML += sup;
                }

            } else {
                mathML += toMathML(stream.atoms[superscript].superscript, 0, 0, options).mathML;
            }
            mathML += '</msup>';
        } else if (subscript >= 0) {
            mathML = '<msub>' + body;
            mathML += toMathML(stream.atoms[subscript].subscript, 0, 0, options).mathML;
            mathML += '</msub>';
        } else {
            mathML = body;
        }

        if ((stream.lastType === 'mi' ||
            stream.lastType === 'mn' ||
            stream.lastType === 'mtext' ||
            stream.lastType === 'fence') &&
            !/^<mo>(.*)<\/mo>$/.test(mathML)) {
            mathML = '<mo>&InvisibleTimes;</mo>' + mathML;
        }

        if (body.endsWith('>f</mi>') || body.endsWith('>g</mi>')) {
            mathML += '<mo> &ApplyFunction; </mo>';
            stream.lastType = 'applyfunction';
        } else {
            stream.lastType = /^<mo>(.*)<\/mo>$/.test(mathML) ? 'mo' : 'mi';
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
 * @param {object} stream
 * @private
 */
function isSuperscriptAtom(stream) {
    return stream.index < stream.atoms.length &&
        stream.atoms[stream.index].superscript &&
        stream.atoms[stream.index].type === 'msubsup'
}



function isSubscriptAtom(stream) {
    return stream.index < stream.atoms.length &&
        stream.atoms[stream.index].subscript &&
        stream.atoms[stream.index].type === 'msubsup'
}



function indexOfSuperscriptInNumber(stream) {

    let result = -1;
    let i = stream.index;
    let done = false;
    let found = false;
    while (i < stream.atoms.length && !done && !found) {
        done = stream.atoms[i].type !== 'mord' ||
            '0123456789,.'.indexOf(stream.atoms[i].body) < 0;
        found = !done && stream.atoms[i].superscript;
        i++
    }

    if (found) {
        result = i - 1;
    }

    return result;
}



function parseSubsup(base, stream, options) {
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
        mathML += toMathML(atom.subscript, 0, 0, options).mathML;
        mathML += toMathML(atom.superscript, 0, 0, options).mathML;
        mathML += '</msubsup>';
    } else if (atom.superscript) {
        mathML = '<msup>' + base;
        mathML += toMathML(atom.superscript, 0, 0, options).mathML;
        mathML += '</msup>';
    } else if (atom.subscript) {
        mathML = '<msub>' + base;
        mathML += toMathML(atom.subscript, 0, 0, options).mathML;
        mathML += '</msub>';
    }

    if (mathML.length > 0) {
        result = true;
        stream.mathML += mathML;
        stream.lastType = '';
    }
    return result;
}


function scanText(stream, final, options) {
    let result = false;
    final = final || stream.atoms.length;
    const initial = stream.index;
    let mathML = '';
    while (stream.index < final &&
           stream.atoms[stream.index].mode === 'text'
        ) {
        mathML += stream.atoms[stream.index].body ? stream.atoms[stream.index].body : ' ';
        stream.index += 1;
    }

    if (mathML.length > 0) {
        result = true;
        mathML = '<mtext' + makeID(stream.atoms[initial].id, options) + '>' + mathML + '</mtext>';

        stream.mathML += mathML;
        stream.lastType = 'mtext';
    }

    return result;
}

function scanNumber(stream, final, options) {
    let result = false;
    final = final || stream.atoms.length;
    const initial = stream.index;
    let mathML = '';

    let superscript = indexOfSuperscriptInNumber(stream);
    if (superscript >= 0 && superscript < final) {
        final = superscript;
    }

    while (stream.index < final &&
        stream.atoms[stream.index].type === 'mord' &&
        '0123456789,.'.indexOf(stream.atoms[stream.index].body) >= 0
    ) {
        mathML += stream.atoms[stream.index].body;
        stream.index += 1;
    }


    if (mathML.length > 0) {
        result = true;
        mathML = '<mn' + makeID(stream.atoms[initial].id, options) + '>' + mathML + '</mn>';

        if (superscript < 0 && isSuperscriptAtom(stream)) {
            superscript = stream.index;
            stream.index += 1;
        }

        if (superscript >= 0) {
            mathML = '<msup>' + mathML;
            mathML += toMathML(stream.atoms[superscript].superscript, 0, 0, options).mathML;
            mathML += '</msup>';
        }

        stream.mathML += mathML;
        stream.lastType = 'mn';
    }

    return result;
}

function scanFence(stream, final, options) {
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
            mathML += toMo(stream.atoms[openIndex], options);

            mathML += toMathML(stream.atoms, openIndex + 1, closeIndex, options).mathML;

            // TODO: could add attribute indicating it's a fence (fence=true)
            mathML += toMo(stream.atoms[closeIndex], options);
            mathML += '</mrow>';

            if (stream.lastType === 'mi' ||
                stream.lastType === 'mn' ||
                stream.lastType === 'mfrac' ||
                stream.lastType === 'fence') {
                mathML = '<mo>&InvisibleTimes;</mo>' + mathML;
            }
            stream.index = closeIndex + 1;

            if (parseSubsup(mathML, stream, options)) {
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

function scanOperator(stream, final, options) {
    let result = false;
    final = final || stream.atoms.length;
    let mathML = '';
    let lastType = '';
    const atom = stream.atoms[stream.index];

    if (stream.index < final && (
        atom.type === 'mbin' || atom.type === 'mrel')) {
        mathML += stream.atoms[stream.index].toMathML(options);
        stream.index += 1;
        lastType = 'mo';
    } else if (stream.index < final && atom.type === 'mop') {
        // mathML += '<mrow>';

        if ((atom.limits === 'limits') && (atom.superscript || atom.subscript)) {
            // Operator with limits, e.g. \sum
            const op = toMo(atom, options);
            if (atom.superscript && atom.subscript) {
                // Both superscript and subscript
                mathML += (atom.limits !== 'nolimits' ? '<munderover>' : '<msubsup>') + op;
                mathML += toMathML(atom.subscript, 0, 0, options).mathML;
                mathML += toMathML(atom.superscript, 0, 0, options).mathML;
                mathML += (atom.limits !== 'nolimits' ? '</munderover>' : '</msubsup>');
            } else if (atom.superscript) {
                // Superscript only
                mathML += (atom.limits !== 'nolimits' ? '<mover>' : '<msup>') + op;
                mathML += toMathML(atom.superscript, 0, 0, options).mathML;
                mathML += (atom.limits !== 'nolimits' ? '</mover>' : '</msup>');
            } else {
                // Subscript only
                mathML += (atom.limits !== 'nolimits' ? '<munder>' : '<msub>') + op;
                mathML += toMathML(atom.subscript, 0, 0, options).mathML;
                mathML += (atom.limits !== 'nolimits' ? '</munder>' : '</msub>');
            }
            lastType = 'mo';

        } else {
            const atom = stream.atoms[stream.index];
            const isUnit = atom.latex.indexOf('\\operatorname') === 0;
            const op = isUnit ?
                '<mi class="MathML-Unit"' + makeID(atom.id, options) + '>' + toString(atom.body) + '</mi>' :
                toMo(atom, options);
            mathML += op;
            stream.index += 1;
            if (parseSubsup(mathML, stream, options)) {
                result = true;
                stream.lastType = '';
                mathML = '';
            }
            stream.index -= 1;
            if (!isUnit && !/^<mo>(.*)<\/mo>$/.test(op)) {
                mathML += '<mo>&#x2061;</mo>';      // APPLY FUNCTION
                // mathML += scanArgument(stream);
                lastType = 'applyfunction';
            } else {
                lastType = isUnit ? 'mi' : 'mo';
            }
        }
        // mathML += '</mrow>';

        if ((stream.lastType === 'mi' || stream.lastType === 'mn') &&
            !/^<mo>(.*)<\/mo>$/.test(mathML)) {
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
function toMathML(input, initial, final, options) {
    const result = {
        atoms: input,
        index: initial || 0,
        mathML: '',
        lastType: ''
    };
    final = final || (input ? input.length : 0);

    if (typeof input === 'number' || typeof input === 'boolean') {
        result.mathML = input.toString();
    } else if (typeof input === 'string') {
        result.mathML = input;
    } else if (input && typeof input.toMathML === 'function') {
        result.mathML = input.toMathML(options);
    } else if (Array.isArray(input)) {
        let count = 0;

        while (result.index < final) {
            if (scanText(result, final, options) ||
                scanNumber(result, final, options) ||
                scanIdentifier(result, final, options) ||
                scanOperator(result, final, options) ||
                scanFence(result, final, options)) {
                    count += 1;
            } else if (result.index < final) {
                let mathML = result.atoms[result.index].toMathML(options);
                if (result.lastType === 'mn' && mathML.length > 0 &&
                        result.atoms[result.index].type === 'genfrac') {
                    // If this is a fraction preceded by a number (e.g. 2 1/2),
                    // add an "invisible plus" (U+0264) character in front of it
                    mathML = '<mo>&#x2064;</mo>' + mathML;
                }
                if (result.atoms[result.index].type === 'genfrac') {
                    result.lastType = 'mfrac';
                } else {
                    result.lastType = '';
                }
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

function toMo(atom, options) {
    let result = '';
    const body = toString(atom.body);
    if (body) {
        result = '<mo' + makeID(atom.id, options) + '>' + body + '</mo>';
    }
    return result;
}

function toString(atoms) {
    if (!atoms) return '';
    if (typeof atoms === 'string') return xmlEscape(atoms);
    if (!Array.isArray(atoms) && typeof atoms.body === 'string') {
        return xmlEscape(atoms.body);
    }
    let result = '';
    for (const atom of atoms) {
        if (typeof atom.body === 'string') {
            result += atom.body;
        }
    }
    return xmlEscape(result);
}


/**
 * Return a MathML fragment representation of a single atom
 *
 * @return {string}
 * @private
 */
MathAtom.MathAtom.prototype.toMathML = function(options) {
    const SPECIAL_IDENTIFIERS = {
        '\\exponentialE': '&#x02147;',
        '\\imaginaryI': '&#x2148;',
        '\\differentialD': '&#x2146;',
        '\\capitalDifferentialD': '&#x2145;',
        '\\alpha': '&#x03b1;',
        '\\pi': '&#x03c0;',
        '\\infty' : '&#x221e;',
        '\\forall' : '&#x2200;',
        '\\nexists': '&#x2204;',
        '\\exists': '&#x2203;',
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
        'cal': 'script', 
        'frak': 'fraktur', 
        'bb': 'double-struck',
        'scr': 'script',
        'cmtt': 'monospace',
        'cmss': 'sans-serif'
    };
    const SPACING = {
        '\\!':          -3 / 18,
        '\\ ':          6 / 18,
        '\\,':          3 / 18,
        '\\:':          4 / 18,
        '\\;':          5 / 18,
        '\\enspace':    .5,
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
    let m;
    switch(this.type) {
        case 'group':
        case 'root':
            result = toMathML(this.body, 0, 0, options).mathML;
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
                    result += '<mtd>' + toMathML(this.array[row][col], 0, 0, options).mathML + '</mtd>';
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
                result += '<mo' + makeID(this.id, options) + '>' + (SPECIAL_OPERATORS[this.leftDelim] || this.leftDelim) + '</mo>';
            }
            if (this.hasBarLine) {
                result += '<mfrac>';
                result += toMathML(this.numer, 0, 0, options).mathML || '<mi>&nbsp;</mi>';
                result += toMathML(this.denom, 0, 0, options).mathML || '<mi>&nbsp;</mi>';
                result += '</mfrac>';
            } else {
                // No bar line, i.e. \choose, etc...
                result += '<mtable' + makeID(this.id, options) + '>';
                result += '<mtr>' + toMathML(this.numer, 0, 0, options).mathML + '</mtr>';
                result += '<mtr>' + toMathML(this.denom, 0, 0, options).mathML + '</mtr>';
                result += '</mtable>';
            }
            if (this.rightDelim && this.rightDelim !== '.') {
                result += '<mo' + makeID(this.id, options) + '>' + (SPECIAL_OPERATORS[this.rightDelim] || this.rightDelim) + '</mo>';
            }
            if (this.leftDelim || this.rightDelim) {
                result += '</mrow>';
            }
        break;

        case 'surd':
            if (this.index) {
                result += '<mroot' + makeID(this.id, options) + '>';
                result += toMathML(this.body, 0, 0, options).mathML;
                result += toMathML(this.index, 0, 0, options).mathML;
                result += '</mroot>';
            } else {
                result += '<msqrt' + makeID(this.id, options) + '>';
                result += toMathML(this.body, 0, 0, options).mathML;
                result += '</msqrt>';
            }
            break;

        case 'leftright':
            // TODO: could add fence=true attribute
            result = '<mrow>';
            if (this.leftDelim && this.leftDelim !== '.') {
                result += '<mo' + makeID(this.id, options) + '>' + (SPECIAL_OPERATORS[this.leftDelim] || this.leftDelim) + '</mo>';
            }
            if (this.body) result += toMathML(this.body, 0, 0, options).mathML;
            if (this.rightDelim && this.rightDelim !== '.') {
                result += '<mo' + makeID(this.id, options) + '>' + (SPECIAL_OPERATORS[this.rightDelim] || this.rightDelim) + '</mo>';
            }
            result += '</mrow>';
            break;

        case 'sizeddelim':
        case 'delim':
            result += '<mo separator="true"' + makeID(this.id, options) + '>' + (SPECIAL_OPERATORS[this.delim] || this.delim) + '</mo>';
            break;


        case 'accent':
            result += '<mover accent="true"' + makeID(this.id, options) + '>';
            result += toMathML(this.body, 0, 0, options).mathML;
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
                result += '<munderover' + variant + makeID(this.id, options) + '>' + toMathML(body, 0, 0, options).mathML;
                result += toMathML(underscript, 0, 0, options).mathML;
                result += toMathML(overscript, 0, 0, options).mathML;
                result += '</munderover>';
            } else if (overscript) {
                result += '<mover' + variant + makeID(this.id, options) + '>' + toMathML(body, options).mathML;
                result += toMathML(overscript, 0, 0, options).mathML;
                result += '</mover>';
            } else if (underscript) {
                result += '<munder' + variant + makeID(this.id, options) + '>' + toMathML(body, options).mathML;
                result += toMathML(underscript, 0, 0, options).mathML;
                result += '</munder>';
            }
            break;

        case 'mord': {
            result = SPECIAL_IDENTIFIERS[command] || command || (typeof this.body === 'string' ? this.body : '');
            m = command ? command.match(/[{]?\\char"([0-9abcdefABCDEF]*)[}]?/) : null;
            if (m) {
                // It's a \char command
                result = '&#x' + m[1] + ';'
            } else if (result.length > 0 && result.charAt(0) === '\\') {
                // This is an identifier with no special handling. Use the
                // Unicode value
                if (typeof this.body === 'string' && this.body.charCodeAt(0) > 255) {
                    result = '&#x' + ('000000' +
                        this.body.charCodeAt(0).toString(16)).substr(-4) + ';';
                } else if (typeof this.body === 'string') {
                    result = this.body.charAt(0);
                } else {
                    result = this.body;
                }
            }
            const tag = /\d/.test(result) ? 'mn' : 'mi';
            result = '<' + tag + variant + makeID(this.id, options) + '>' + xmlEscape(result) + '</' + tag + '>';
            break;
        }
        case 'mbin':
        case 'mrel':
        case 'textord':
        case 'minner':
            if (command && SPECIAL_IDENTIFIERS[command]) {
                // Some 'textord' are actually identifiers. Check them here.
                result = '<mi' + makeID(this.id, options) + '>' + SPECIAL_IDENTIFIERS[command] + '</mi>';
            } else if (command && SPECIAL_OPERATORS[command]) {
                result = '<mo' + makeID(this.id, options) + '>' + SPECIAL_OPERATORS[command] + '</mo>';
            } else {
                result = toMo(this, options);
            }
            break;

        case 'mpunct':
            result = '<mo separator="true"' + makeID(this.id, options) + '>' + (SPECIAL_OPERATORS[command] || command) + '</mo>';
            break;

        case 'mop':
            if (this.body !== '\u200b') {
                // Not ZERO-WIDTH
                result = '<mo' + makeID(this.id, options) + '>';
                if (command === '\\operatorname') {
                    result += this.body;
                } else {
                    result += command || this.body;
                }
                result += '</mo>';
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
            result += makeID(this.id, options) + '>' + toMathML(this.body, 0, 0, options).mathML + '</menclose>';
            break;

        case 'spacing':
            result += '<mspace width="' + (SPACING[command] || 0) + 'em"/>';
            break;

        case 'enclose':
            result = '<menclose notation="';
            for (const notation in this.notation) {
                if (Object.prototype.hasOwnProperty.call(this.notation, notation) &&
                    this.notation[notation]) {
                    result += sep + notation;
                    sep = ' ';
                }
            }
            result += makeID(this.id, options) + '">' + toMathML(this.body, 0, 0, options).mathML + '</menclose>';
            break;

        case 'space':
            result += '&nbsp;'
            break;

    }
    return result;
}


MathAtom.toMathML = function(atoms, options) {
    return toMathML(atoms, 0, 0, options).mathML;
}


// Export the public interface for this module
export default {
}



