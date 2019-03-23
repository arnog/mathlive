const SPECIAL_IDENTIFIERS = {
};

const SPECIAL_OPERATORS = {
};

export function toASCIIMath(atom, options){
    if (Array.isArray(atom)) {
        return atom.map(x => toASCIIMath(x, options)).join('');
    }

    let result = '';
    const command = atom.latex ? atom.latex.trim() : null;
    let m;
    switch(atom.type) {
        case 'group':
        case 'root':
            result = toASCIIMath(atom.body, options);
            // @todo convert sup, sub
            break;

        case 'array':
            // if ((atom.lFence && atom.lFence !== '.') ||
            //     (atom.rFence && atom.rFence !== '.')) {
            //     result += '<mrow>';
            //     if ((atom.lFence && atom.lFence !== '.')) {
            //         result += '<mo>' + (SPECIAL_OPERATORS[atom.lFence] || atom.lFence) + '</mo>';
            //     }
            // }
            // result += '<mtable';
            // if (atom.colFormat) {
            //     result += ' columnalign="';
            //     for (i = 0; i < atom.colFormat.length; i++) {
            //         if (atom.colFormat[i].align) {
            //             result += {l:'left', c:'center', r:'right'}[atom.colFormat[i].align] + ' ';
            //         }
            //     }
            //     result += '"';
            // }

            // result += '>';
            // for (row = 0; row < atom.array.length; row++) {
            //     result += '<mtr>';
            //     for (col = 0; col < atom.array[row].length; col++) {
            //         result += '<mtd>' + toMathML(atom.array[row][col], 0, 0, options).mathML + '</mtd>';
            //     }
            //     result += '</mtr>';
            // }

            // result += '</mtable>';

            // if ((atom.lFence && atom.lFence !== '.') ||
            //     (atom.rFence && atom.rFence !== '.')) {
            //     if ((atom.rFence && atom.rFence !== '.')) {
            //         result += '<mo>' + (SPECIAL_OPERATORS[atom.lFence] || atom.rFence) + '</mo>';
            //     }
            //     result += '</mrow>';
            // }
            break;

        case 'genfrac':
            if (atom.leftDelim || atom.rightDelim) {
                result += (atom.leftDelim === '.' || !atom.leftDelim) ? '{:' : atom.leftDelim;
            }
            if (atom.hasBarLine) {
                result += '(';
                result += toASCIIMath(atom.numer, options);
                result += ')/(';
                result += toASCIIMath(atom.denom, options);
                result += ')';
            } else {
                // No bar line, i.e. \choose, etc...
                result += '(' + toASCIIMath(atom.numer, options) + '),';
                result += '(' + toASCIIMath(atom.denom, options) + ')';
            }
            if (atom.leftDelim || atom.rightDelim) {
                result += (atom.rightDelim === '.' || !atom.rightDelim) ? '{:' : atom.rightDelim;
            }
        break;

        case 'surd':
            if (atom.index) {
                result += 'root(' + toASCIIMath(atom.index, options) + ')(' +
                     toASCIIMath(atom.body, options) + ')';
            } else {
                result += 'sqrt(' + toASCIIMath(atom.body, options) + ')';
            }
            break;

        case 'leftright':
            result += (atom.leftDelim === '.' || !atom.leftDelim) ? '{:' : atom.leftDelim;
            result += toASCIIMath(atom.body, options);
            result += (atom.rightDelim === '.' || !atom.rightDelim) ? '{:' : atom.rightDelim;
            break;

        case 'sizeddelim':
        case 'delim':
            // result += '<mo separator="true"' + makeID(atom.id, options) + '>' + (SPECIAL_OPERATORS[atom.delim] || atom.delim) + '</mo>';
            break;


        case 'font':
            // if (command === '\\text' || command === '\\textrm' ||
            //     command === '\\textsf' || command === '\\texttt' ||
            //     command === '\\textnormal' || command === '\\textbf' ||
            //     command === '\\textit') {
            //     result += '<mtext' + variant + makeID(atom.id, options) + '>';
            //     // Replace first and last space in text with a &nbsp; to ensure they
            //     // are actually displayed (content surrounded by a tag gets trimmed)
            //     // TODO: alternative: use <mspace>
            //     result += toString(atom.body).
            //         replace(/^\s/, '&nbsp;').
            //         replace(/\s$/, '&nbsp;');
            //     result += '</mtext>';
            // } else {
            //     result += '<mi' + variant + '>' + toString(atom.body) + '</mi>';
            // }
            break;

        case 'accent':
            // result += '<mover accent="true"' + makeID(atom.id, options) + '>';
            // result += toMathML(atom.body, 0, 0, options).mathML;
            // result += '<mo>' + (SPECIAL_OPERATORS[command] || atom.accent) + '</mo>';
            // result += '</mover>'
            break;

        case 'line':
        case 'overlap':
            break;

        case 'overunder':
            // overscript = atom.overscript;
            // underscript = atom.underscript;
            // if (overscript && underscript) {
            //     body = atom.body;
            // } else if (overscript) {
            //     body = atom.body;
            //     if (atom.body[0] && atom.body[0].underscript) {
            //         underscript = atom.body[0].underscript;
            //         body = atom.body[0].body;
            //     } else if (atom.body[0] && atom.body[0].type === 'first' && atom.body[1] && atom.body[1].underscript) {
            //         underscript = atom.body[1].underscript;
            //         body = atom.body[1].body;
            //     }
            // } else if (underscript) {
            //     body = atom.body;
            //     if (atom.body[0] && atom.body[0].overscript) {
            //         overscript = atom.body[0].overscript;
            //         body = atom.body[0].body;
            //     } else if (atom.body[0] && atom.body[0].type === 'first' && atom.body[1] && atom.body[1].overscript) {
            //         overscript = atom.body[1].overscript;
            //         body = atom.body[1].body;
            //     }
            // }

            // if (overscript && underscript) {
            //     result += '<munderover' + variant + makeID(atom.id, options) + '>' + toMathML(body, 0, 0, options).mathML;
            //     result += toMathML(underscript, 0, 0, options).mathML;
            //     result += toMathML(overscript, 0, 0, options).mathML;
            //     result += '</munderover>';
            // } else if (overscript) {
            //     result += '<mover' + variant + makeID(atom.id, options) + '>' + toMathML(body, options).mathML;
            //     result += toMathML(overscript, 0, 0, options).mathML;
            //     result += '</mover>';
            // } else if (underscript) {
            //     result += '<munder' + variant + makeID(atom.id, options) + '>' + toMathML(body, options).mathML;
            //     result += toMathML(underscript, 0, 0, options).mathML;
            //     result += '</munder>';
            // }
            break;

        case 'mord':
            // @todo, deal with some special identifiers: \alpha, etc...
            result = SPECIAL_IDENTIFIERS[command] || command || 
                (typeof atom.body === 'string' ? atom.body : '');
            m = command ? command.match(/[{]?\\char"([0-9abcdefABCDEF]*)[}]?/) : null;
            if (m) {
                // It's a \char command
                result = '&#x' + m[1] + ';'
                // @todo: convert to unicode fromCharCode(parseInt('0x' + ...))
            } else if (result.length > 0 && result.charAt(0) === '\\') {
                // atom is an identifier with no special handling. Use the
                // Unicode value
                if (typeof atom.body === 'string' && atom.body.charCodeAt(0) > 255) {
                    result = '&#x' + ('000000' +
                        atom.body.charCodeAt(0).toString(16)).substr(-4) + ';';
                // @todo: convert to unicode fromCharCode(parseInt('0x' + ...))
                } else if (typeof atom.body === 'string') {
                    result = atom.body.charAt(0);
                } else {
                    result = atom.latex;
                }
            }
            // result = '<mi' + variant + makeID(atom.id, options) + '>' + xmlEscape(result) + '</mi>';
            break;

        case 'mbin':
        case 'mrel':
        case 'textord':
        case 'minner':
            if (command && SPECIAL_IDENTIFIERS[command]) {
                // Some 'textord' are actually identifiers. Check them here.
                result = SPECIAL_IDENTIFIERS[command];
            } else if (command && SPECIAL_OPERATORS[command]) {
                result = SPECIAL_OPERATORS[command];
            } else {
                result = atom.body;
            }
            break;

        case 'mpunct':
            result = SPECIAL_OPERATORS[command] || command;
            break;

        case 'mop':
            if (atom.body !== '\u200b') {
                // Not ZERO-WIDTH
                result = '';
                if (command === '\\operatorname') {
                    result += atom.body;
                } else {
                    result += command || atom.body;
                }
            }
            break;

        case 'color':
            // if (atom.textcolor) {
            //     result += '<mstyle color="' + Color.stringToColor(atom.textcolor) + '"';
            //     result +=  makeID(atom.id, options) + '>';
            //     result += toMathML(atom.body, 0, 0, options).mathML;
            //     result += '</mstyle>';
            // }
            break;

        case 'mathstyle':
            // TODO: mathstyle is a switch. Need to figure out its scope to properly wrap it around a <mstyle> tag
            // if (atom.mathstyle === 'displaystyle') {
            //     result += '<mstyle displaystyle="true">';
            //     result += '</mstyle>';
            // } else {
            //     result += '<mstyle displaystyle="false">';
            //     result += '</mstyle>';
            // };
            break;

        case 'box':
            // result = '<menclose notation="box"';
            // if (atom.backgroundcolor) {
            //     result += ' mathbackground="' + Color.stringToColor(atom.backgroundcolor) + '"';
            // }
            // result += makeID(atom.id, options) + '>' + toMathML(atom.body, 0, 0, options).mathML + '</menclose>';
            break;

        case 'spacing':
            // result += '<mspace width="' + (SPACING[command] || 0) + 'em"/>';
            break;

        case 'enclose':
            // result = '<menclose notation="';
            // for (const notation in atom.notation) {
            //     if (atom.notation.hasOwnProperty(notation) &&
            //         atom.notation[notation]) {
            //         result += sep + notation;
            //         sep = ' ';
            //     }
            // }
            // result += makeID(atom.id, options) + '">' + toMathML(atom.body, 0, 0, options).mathML + '</menclose>';
            break;

        case 'sizing':
            break;

        case 'space':
            result = ' '
            break;

    }
    return result;
}

export default {
    toASCIIMath
}