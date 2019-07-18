/**
 * This module contains utilities to debug mathlive internal data structures.
 * 
 * It is also used by the automated test suite.
 * 
 * @module addons/debug
 * @private
 */

import { toASCIIMath } from '../editor/outputASCIIMath.js';
import Lexer from '../core/lexer.js';
import ParserModule from '../core/parser.js';
import { parseMathString } from '../editor/editor-editableMathlist.js';

export function latexToAsciiMath(latex, mode) {
    mode = mode || 'math';

    const mathlist = ParserModule.parseTokens(
        Lexer.tokenize(latex), mode, null, null);

    return toASCIIMath(mathlist);
}

export function asciiMathToLatex(ascii) {
    return parseMathString(ascii, {format: 'ASCIIMath'});
}

/**
 * 
 * @param {object[]} spans 
 * @param {string|number|number[]} symbol specify which span to consider. 
 * If a string, a span whose body match the string
 * If a number, the nth span in the list
 * If an array, each element in the array indicate the nth child to traverse
 * @private
 */
function getSymbol(spans, symbol) {
    if (!spans) return null;
    let childSymbol = null;

    if (Array.isArray(symbol)) {
        childSymbol = symbol.slice();  // Clone the array
        symbol = childSymbol.shift();   // Get the first element and remove it from the array
    }

    let result = null;
    if (typeof symbol === 'number' && symbol < spans.length) {
        if (childSymbol && childSymbol.length > 0) {
            return getSymbol(spans[symbol].children, childSymbol);
        }
        return spans[symbol];
    } else if (typeof symbol === 'string') {
        for (let i = 0; i < spans.length; i++) {
            // Does this span match the symbol we're looking for?
            if (spans[i].body === symbol) {
                if (childSymbol && childSymbol.length > 0) {
                    return getSymbol(spans[i].children, childSymbol);
                }
                return spans[i];
            }
            // If not, try its children
            result = getSymbol(spans[i].children, symbol);
            if (result) return result;
        }
        return result;
    }
    return null;
}

function getProp(spans, symbol, prop) {
    const s = getSymbol(spans, symbol);
    if (s) return s[prop];
    return null;
}

/**
 * Return the type ('mbin', etc...) of a span
 * @param {Span[]} spans 
 * @param {string} symbol 
 * @return {string}
 * @private
*/
function getType(spans, symbol) {
    const s = getSymbol(spans, symbol);
    if (s) return s.type;
    return null;
}

/**
 * Return the tag ('span', 'var', etc...) of a span
 * @param {Span[]} spans 
 * @param {string} symbol 
 * @return {string}
 * @private
*/
function getTag(spans, symbol) {
    const s = getSymbol(spans, symbol);
    if (s) return s.tag;
    return null;
}


function getStyle(spans, symbol, prop) {
    const s = getSymbol(spans, symbol);
    if (s && s.style) return s.style[prop];
    return null;
}

function getClasses(spans, symbol) {
    const s = getSymbol(spans, symbol);
    if (s) return s.classes || '';
    return null;
}


function hasClass(spans, symbol, cls) {
    let classes = getClasses(spans, symbol);
    if (!classes) return false;
    classes = classes.split(' ');
    for (let j = 0; j < classes.length; j++) {
        if (classes[j] === cls) return true;
    }
    return false;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function spanToString(span, indent) {
    indent = indent || '';

    let result = '';
    if (Array.isArray(span)) {
        if (span.length === 0) {
            result += '[]\n';
        } else {
            result += '[\n';
            for (let i = 0; i < span.length; i++) {
                result += spanToString(span[i], '\t' + indent + i + ',');
                result += i < span.length - 1 ? ',\n' : '\n';
            }
            result += indent + ']\n';
        }
    } else {
        result = indent + '{\n';
        if (span.type) {
            result += indent + 'type:"' + span.type + '",\n';
        }
        if (span.body && span.body.length > 0) {
            result += indent + 'body:"' + span.body + '",\n';
        }
        if (span.classes && span.classes.length > 0) {
            result += indent + 'classes:"' + span.classes + '",\n';
        }
        if (span.style) {
            for (const s in span.style) {
                if (Object.prototype.hasOwnProperty.call(span.style, s)) {
                    result += indent + s + ':"';
                    result += span.style[s] + '",\n';
                }
            }
        }
        if (span.children && span.children.length > 0) {
            result += indent + 'children:' + spanToString(span.children, indent);
        }
        result += indent + '}';
    }
    return result;
}

function mathlistPropToString(mathlist, prop, indent) {
    const value = mathlist[prop];
    if (typeof value === 'string') {
        return indent + prop + ':"' + value + '",\n';
    } else if (typeof value === 'boolean') {
        return indent + prop + ':' + value + ',\n';
    } else if (typeof value === 'number') {
        return indent + prop + ':' + value + ',\n';
    } else if (Array.isArray(value)) {
        return indent + prop + ':' + mathlistToString(value, indent + '\t') + ',\n';
    }
    return '';
}

function mathlistToString(mathlist, indent) {
    if (!mathlist) return ''; 

    indent = indent || '';
    let result = '';
    if (Array.isArray(mathlist)) {
        if (mathlist.length === 0) return '';
        result += '[\n';
        for (let i = 0; i < mathlist.length; i++) {
            result += mathlistToString(mathlist[i], indent + '\t') + ',\n';
        }
        result += indent + ']\n';
    } else {
        result = indent + '{\n';
        result += mathlistPropToString(mathlist, 'type', indent);
        result += mathlistPropToString(mathlist, 'value', indent);

        result += mathlistPropToString(mathlist, 'fontFamily', indent);

        // Type 'genfrac'
        result += mathlistPropToString(mathlist, 'hasBarLine', indent);
        result += mathlistPropToString(mathlist, 'leftDelim', indent);
        result += mathlistPropToString(mathlist, 'rightDelim', indent);
        result += mathlistPropToString(mathlist, 'numer', indent);
        result += mathlistPropToString(mathlist, 'denom', indent);

        // Type...?
        result += mathlistPropToString(mathlist, 'limits', indent);
        result += mathlistPropToString(mathlist, 'symbol', indent);

        // Type 'color'
        result += mathlistPropToString(mathlist, 'framecolor', indent);

        // Type 'line'
        result += mathlistPropToString(mathlist, 'position', indent);

        // Type 'mathstyle'
        result += mathlistPropToString(mathlist, 'mathstyle', indent);

        // Common
        result += mathlistPropToString(mathlist, 'superscript', indent);
        result += mathlistPropToString(mathlist, 'subscript', indent);
        result += mathlistPropToString(mathlist, 'body', indent);

        result += mathlistPropToString(mathlist, 'array', indent);

        result += indent + '}';
    }
    return result;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function spanToMarkup(span, indent) {
    indent = indent || '';
    // if (indent.length === 0) {
    //     result += '<table>';
    // }
    let result = '';
    if (Array.isArray(span)) {
        for (let i = 0; i < span.length; i++) {
            result += spanToMarkup(span[i], indent);
        }
    } else if (span && span.tag !== 'table') {
        result = '<br>' + indent;
        if (span.classes.includes('fontsize-ensurer')) {
            result += 'FONTSIZE-ENSURER';
        } else {
            if (span.type) {
                result += '<span class="type">' + span.type + '</span>';
            }
            if (span.body && span.body.length > 0) {
                result += '<span class="value">' + span.body + '</span>';
            }
            if (span.classes && span.classes.length > 0) {
                result += '&nbsp;<span class="classes">' + span.classes + '</span>';
            }
            if (span.isTight) {
                result += '&nbsp;<span class="stylevalue"> tight </span>';
            }
            if (span.caret) {
                result += '&nbsp;<span class="stylevalue"> caret </span>';
            }

            if (span.style) {
                for (const s in span.style) {
                    if (Object.prototype.hasOwnProperty.call(span.style, s)) {
                        result += '&nbsp;<span class="styleprop">' + s + ':</span>';
                        result += '<span class="stylevalue"> ' + span.style[s] + '</span>;&nbsp;';
                    }
                }
            }
            if (span.children) {
                result += spanToMarkup(span.children, indent + '▷');
            }
        }
    } else if (span) {
        result += '<br>' + indent + 'table ' + span.array[0].length + '&times;' + span.array.length;
        for (let i = 0; i < span.array.length; i++) {
            for (let j = 0; j < span.array[i].length; j++) {
                result += '<br>' + indent + '[' + (i + 1) + ', ' + (j + 1) + '] ';
                result += spanToMarkup(span.array[i][j], '');
            }
        }
    }
    return result;
}

function mathListColorToMarkup(mathlist, propname) {
    let result = '';
    if (mathlist[propname]) {
        result += '<span class="styleprop">' + propname + '=</span>'; 
        result += '<span style="font-size:2em;vertical-align:middle;color:' + mathlist[propname] + '">&#9632;</span>';    
        result += '<span class="stylevalue">';
        result += mathlist[propname];
        result += '</span>';
    }
    return result;
}

function mathListPropToMarkup(mathlist, propname) {
    let result = '';
    if (mathlist[propname]) {
        result += '<span class="styleprop">' + propname + '=</span>'; 
        result += '<span class="stylevalue">';
        result += mathlist[propname]
        result += '</span>" ';
    }
    return result;
}

function mathlistToMarkup(mathlist, indent) {
    if (!mathlist) return ''; 

    indent = indent || '';
    let result = '';
    if (Array.isArray(mathlist)) {
        for (let i = 0; i < mathlist.length; i++) {
            result += mathlistToMarkup(mathlist[i], i + '.' + indent);
        }
    } else {
        result = '<br>' + indent;
        if (mathlist.type) {
            result += '<span class="type';
            result += mathlist.isSelected ? ' selected' : '';
            result += mathlist.caret ? ' caret' : '';
            result += '">' + mathlist.type + 
                (mathlist.caret ? ' caret ' : '') + '</span>';
        }
        if (typeof mathlist.body === 'string' && mathlist.body.length > 0) {
            result += '&nbsp;<span class="value">';
            result += mathlist.body;
            if (mathlist.body.charCodeAt(0) < 32 
                || mathlist.body.charCodeAt(0) > 127) {
                result += '&nbsp;U+' + ('000000' + 
                    mathlist.body.charCodeAt(0).toString(16)).substr(-6);
            }
            result += '</span>&nbsp;';
        }
        if (mathlist.fontFamily === 'mathrm') {
            result += '<span style="opacity:.2">';
            result += mathListPropToMarkup(mathlist, 'fontFamily');
            result += '</span>';
        } else {
            result += mathListPropToMarkup(mathlist, 'fontFamily');
        }
        // Type 'genfrac'
        result += mathListPropToMarkup(mathlist, 'hasBarLine');
        result += mathListPropToMarkup(mathlist, 'leftDelim');
        result += mathListPropToMarkup(mathlist, 'rightDelim');
        result += mathListPropToMarkup(mathlist, 'continuousFraction');

        // Type...?
        result += mathListPropToMarkup(mathlist, 'limits');
        result += mathListPropToMarkup(mathlist, 'symbol');

        // Type 'color'
        result += mathListColorToMarkup(mathlist, 'framecolor');

        // Type 'mathstyle'
        result += mathListPropToMarkup(mathlist, 'mathstyle');

        // Type 'sizeddelim'
        result += mathListPropToMarkup(mathlist, 'size');
        result += mathListPropToMarkup(mathlist, 'cls');
        result += mathListPropToMarkup(mathlist, 'delim');

        // Type 'rule'
        result += mathListPropToMarkup(mathlist, 'shift');
        result += mathListPropToMarkup(mathlist, 'width');
        result += mathListPropToMarkup(mathlist, 'height');

        // Type 'line'
        result += mathListPropToMarkup(mathlist, 'position');
        
        // Type 'overunder'
        result += mathlistToMarkup(mathlist.overscript, indent + '↑');
        result += mathlistToMarkup(mathlist.underscript, indent + '↓');

        result += mathlistToMarkup(mathlist.superscript, indent + '↑');
        result += mathlistToMarkup(mathlist.subscript, indent + '↓');
        result += mathlistToMarkup(mathlist.body, indent + '▶');
        result += mathlistToMarkup(mathlist.numer, indent + '\u25B2');
        result += mathlistToMarkup(mathlist.denom, indent + '\u25Bc');

        if (mathlist.array) {
            for (let i = 0; i < mathlist.array.length; i++) {
                result += '<br>' + indent + '\u2317 row ' + (i + 1) + '/' + mathlist.array.length;
                for (let j = 0; j < mathlist.array[i].length; j++) {
                    result += mathlistToMarkup(mathlist.array[i][j], indent + '\u2317\u232A');
                }
            }
        }
    }
    return result;
}






// Export the public interface for this module
export default { 
    mathlistToMarkup,
    spanToMarkup,

    mathlistToString,
    spanToString,
    
    hasClass,
    getClasses,
    getProp,
    getStyle,
    getType,
    getTag,

    latexToAsciiMath,
    asciiMathToLatex,
}



