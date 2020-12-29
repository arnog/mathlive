/**
 * This module contains utilities to debug mathlive internal data structures.
 *
 * It is also used by the automated test suite.
 */

import { ParseMode } from '../public/core';
import { parseLatex } from '../core/parser';
import type { Span } from '../core/span';
import {
  MACROS,
  FUNCTIONS,
  MATH_SYMBOLS,
  TEXT_SYMBOLS,
  ENVIRONMENTS,
} from '../core-definitions/definitions';
import { INLINE_SHORTCUTS } from '../editor/shortcuts';
import { DEFAULT_KEYBINDINGS } from '../editor/keybindings-definitions';
import { getKeybindingMarkup } from '../editor/keybindings';

import { atomToAsciiMath } from '../editor/atom-to-ascii-math';
import { parseMathString } from '../editor/parse-math-string';

export function latexToAsciiMath(
  latex: string,
  mode: ParseMode = 'math'
): string {
  const mathlist = parseLatex(latex, mode, null, null);

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
  }

  if (typeof symbol === 'string') {
    for (const span of spans) {
      // Does this span match the symbol we're looking for?
      if (span.value === symbol) {
        if (childSymbol && childSymbol.length > 0) {
          return getSymbol(span.children, childSymbol);
        }

        return span;
      }

      // If not, try its children
      result = getSymbol(span.children, symbol);
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
  for (const element of clsList) {
    if (element === cls) return true;
  }

  return false;
}

/// /////////////////////////////////////////////////////////////////////////////
/// /////////////////////////////////////////////////////////////////////////////
/// /////////////////////////////////////////////////////////////////////////////

function spanToString(span: Span, indent = ''): string {
  let result = '';
  if (Array.isArray(span)) {
    if (span.length === 0) {
      result += '[]\n';
    } else {
      result += '[\n';
      for (let i = 0; i < span.length; i++) {
        result += spanToString(span[i], `\t ${indent}${i} ,`);
        result += i < span.length - 1 ? ',\n' : '\n';
      }

      result += indent + ']\n';
    }
  } else {
    result = indent + '{\n';
    if (span.type) {
      result += indent + 'type:"' + span.type + '",\n';
    }

    if (span.value && span.value.length > 0) {
      result += indent + 'body:"' + span.value + '",\n';
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

/// /////////////////////////////////////////////////////////////////////////////
/// /////////////////////////////////////////////////////////////////////////////
/// /////////////////////////////////////////////////////////////////////////////

function spanToMarkup(span: Span, indent = ''): string {
  // If (indent.length === 0) {
  //     result += '<table>';
  // }
  let result = '';
  if (Array.isArray(span)) {
    for (const element of span) {
      result += spanToMarkup(element, indent);
    }
  } else if (span) {
    result = '<br>' + indent;
    if (span.classes.includes('fontsize-ensurer')) {
      result += 'FONTSIZE-ENSURER';
    } else {
      if (span.type) {
        result += '<span class="type">' + span.type + '</span>';
      }

      if (span.value && span.value.length > 0) {
        result += '<span class="value">' + span.value + '</span>';
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
            result +=
              '<span class="stylevalue"> ' + span.style[s] + '</span>;&nbsp;';
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

const MathliveDebug = {
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

// Export the public interface for this module
export default MathliveDebug;
