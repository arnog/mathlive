/**
 * This module contains utilities to debug mathlive internal data structures.
 *
 * It is also used by the automated test suite.
 */

import { ParseMode } from '../public/core';
import { parseString } from '../core/parser';
import type { Span } from '../core/span';
import type { Atom } from '../core/atom';
import {
    MACROS,
    FUNCTIONS,
    MATH_SYMBOLS,
    TEXT_SYMBOLS,
    ENVIRONMENTS,
} from '../core/definitions';
import { INLINE_SHORTCUTS } from '../editor/shortcuts';
import { DEFAULT_KEYBINDINGS } from '../editor/keybindings-definitions';
import { getKeybindingMarkup } from '../editor/keybindings';

import { atomToAsciiMath } from '../editor/atom-to-ascii-math';
import { parseMathString } from '../editor/parse-math-string';

export function latexToAsciiMath(
    latex: string,
    mode: ParseMode = 'math'
): string {
    const mathlist = parseString(latex, mode, null, null);

    return atomToAsciiMath(mathlist);
}

export function asciiMathToLatex(ascii: string): string {
    const [, result] = parseMathString(ascii, { format: 'ASCIIMath' });
    return result;
}

/**
 *
 * @param symbol specify which span to consider.
 * If a string, a span whose body match the string
 * If a number, the nth span in the list
 * If an array, each element in the array indicate the nth child to traverse
 */
function getSymbol(spans: Span[], symbol: string | number | number[]): Span {
    if (!spans) return null;
    let childSymbol = null;

    if (Array.isArray(symbol)) {
        childSymbol = symbol.slice(); // Clone the array
        symbol = childSymbol.shift(); // Get the first element and remove it from the array
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

function getProp(
    spans: Span[],
    symbol: string | number | number[],
    prop: string
): Span {
    const s = getSymbol(spans, symbol);
    if (s) return s[prop];
    return null;
}

/**
 * Return the type ('mbin', etc...) of a span
 */
function getType(spans: Span[], symbol: string): string {
    const s = getSymbol(spans, symbol);
    if (s) return s.type;
    return null;
}

function getStyle(spans: Span[], symbol: string, prop: string): string {
    const s = getSymbol(spans, symbol);
    if (s?.style) return s.style[prop];
    return null;
}

function getClasses(spans: Span[], symbol: string): string {
    const s = getSymbol(spans, symbol);
    if (s) return s.classes ?? '';
    return null;
}

function hasClass(spans: Span[], symbol: string, cls: string): boolean {
    const classes = getClasses(spans, symbol);
    if (!classes) return false;
    const clsList = classes.split(' ');
    for (let j = 0; j < clsList.length; j++) {
        if (clsList[j] === cls) return true;
    }
    return false;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function spanToString(span: Span, indent = ''): string {
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
            result +=
                indent +
                'children:' +
                span.children.map((x) => spanToString(x, indent)).join('; ');
        }
        result += indent + '}';
    }
    return result;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function spanToMarkup(span: Span, indent = ''): string {
    // if (indent.length === 0) {
    //     result += '<table>';
    // }
    let result = '';
    if (Array.isArray(span)) {
        for (let i = 0; i < span.length; i++) {
            result += spanToMarkup(span[i], indent);
        }
    } else if (span) {
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
                result +=
                    '&nbsp;<span class="classes">' + span.classes + '</span>';
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
                        result +=
                            '&nbsp;<span class="styleprop">' + s + ':</span>';
                        result +=
                            '<span class="stylevalue"> ' +
                            span.style[s] +
                            '</span>;&nbsp;';
                    }
                }
            }
            if (span.children) {
                result += span.children
                    .map((x) => spanToMarkup(x, indent + '▷'))
                    .join('; ');
            }
        }
    }
    return result;
}

function mathListColorToMarkup(mathlist, propname): string {
    let result = '';
    if (mathlist[propname]) {
        result += '<span class="styleprop">' + propname + '=</span>';
        result +=
            '<span style="font-size:2em;vertical-align:middle;color:' +
            mathlist[propname] +
            '">&#9632;</span>';
        result += '<span class="stylevalue">';
        result += mathlist[propname];
        result += '</span>';
    }
    return result;
}

function mathListPropToMarkup(mathlist, propname): string {
    let result = '';
    if (mathlist[propname]) {
        result += '<span class="styleprop">' + propname + '=</span>';
        result += '<span class="stylevalue">';
        result += mathlist[propname];
        result += '</span>" ';
    }
    return result;
}

function mathlistToMarkup(mathlist: Atom | Atom[], indent = ''): string {
    if (!mathlist) return '';

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
            result +=
                '">' +
                mathlist.type +
                (mathlist.caret ? ' caret ' : '') +
                '</span>';
        }
        if (typeof mathlist.body === 'string' && mathlist.body.length > 0) {
            result += '&nbsp;<span class="value">';
            result += mathlist.body;
            if (
                mathlist.body.charCodeAt(0) < 32 ||
                mathlist.body.charCodeAt(0) > 127
            ) {
                result +=
                    '&nbsp;U+' +
                    (
                        '000000' + mathlist.body.charCodeAt(0).toString(16)
                    ).substr(-6);
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
        result += mathlistToMarkup(mathlist.body as Atom[], indent + '▶');
        result += mathlistToMarkup(mathlist.numer, indent + '\u25B2');
        result += mathlistToMarkup(mathlist.denom, indent + '\u25Bc');

        if (mathlist.array) {
            for (let i = 0; i < mathlist.array.length; i++) {
                result +=
                    '<br>' +
                    indent +
                    '\u2317 row ' +
                    (i + 1) +
                    '/' +
                    mathlist.array.length;
                for (let j = 0; j < mathlist.array[i].length; j++) {
                    result += mathlistToMarkup(
                        mathlist.array[i][j],
                        indent + '\u2317\u232A'
                    );
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

    spanToString,

    hasClass,
    getClasses,
    getProp,
    getStyle,
    getType,

    latexToAsciiMath,
    asciiMathToLatex,
    FUNCTIONS,
    MATH_SYMBOLS,
    TEXT_SYMBOLS,
    ENVIRONMENTS,
    MACROS,

    INLINE_SHORTCUTS,
    DEFAULT_KEYBINDINGS,

    getKeybindingMarkup,
};
