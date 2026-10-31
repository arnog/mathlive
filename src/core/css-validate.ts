/**
 * Validation of CSS values that originate from the LaTeX input.
 *
 * LaTeX commands such as `\enclose`, `\bbox`, `\color` and `\fontfamily`
 * accept free-form strings that end up inside the `style` attribute of the
 * generated HTML. The attribute quoting prevents a value from closing the
 * attribute, but a `;` inside the value would still add arbitrary CSS
 * declarations (for example `background:url(...)` to make a network request
 * or `position:fixed` to overlay the page). The functions in this module
 * accept only a strict subset of the CSS grammar for each kind of value and
 * return `undefined` for anything else. Callers must drop the value or use a
 * safe default when they get `undefined`.
 */

const CSS_LENGTH = /^-?(\d+|\d*\.\d+)(px|em|rem|ex|ch|pt|pc|cm|mm|in|vw|vh|%)?$/;

const CSS_COLOR =
  /^([a-zA-Z]+|#[0-9a-fA-F]{3,8}|(rgba?|hsla?)\(\s*[-\d.,%\s/]*\s*\)|var\(--[\w-]+\))$/;

const CSS_BORDER_STYLE =
  /^(none|hidden|solid|dashed|dotted|double|groove|ridge|inset|outset)$/;

/**
 * Split a CSS value on whitespace, keeping the arguments of a function such
 * as `rgba(0, 0, 0, .5)` together. Returns `undefined` if the parentheses are
 * not balanced.
 */
export function splitCssTokens(value: string): string[] | undefined {
  const tokens: string[] = [];
  let depth = 0;
  let current = '';
  for (const c of value.trim()) {
    if (c === '(') depth += 1;
    else if (c === ')') depth -= 1;
    if (depth < 0) return undefined;
    if (/\s/.test(c) && depth === 0) {
      if (current) tokens.push(current);
      current = '';
    } else current += c;
  }
  if (depth !== 0) return undefined;
  if (current) tokens.push(current);
  return tokens;
}

export function isCssLength(token: string): boolean {
  return CSS_LENGTH.test(token);
}

export function isCssColor(token: string): boolean {
  return CSS_COLOR.test(token);
}

/** A single CSS length (for example `2px` or `.5em`), or `undefined`. */
export function validateCssLength(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  return isCssLength(v) ? v : undefined;
}

/**
 * A single CSS color: a keyword (`red`, `currentColor`, `transparent`), a
 * hex color, an `rgb()`/`rgba()`/`hsl()`/`hsla()` function with numeric
 * arguments, or a `var(--name)` reference. Returns `undefined` otherwise.
 */
export function validateCssColor(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const tokens = splitCssTokens(value);
  if (!tokens || tokens.length !== 1) return undefined;
  return isCssColor(tokens[0]) ? tokens[0] : undefined;
}

/**
 * A CSS `border` shorthand: up to one length, one border style keyword and
 * one color, in any order. Returns the tokens joined by a single space, or
 * `undefined`.
 */
export function validateCssBorder(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const tokens = splitCssTokens(value);
  if (!tokens || tokens.length === 0 || tokens.length > 3) return undefined;
  let lengths = 0;
  let styles = 0;
  let colors = 0;
  for (const token of tokens) {
    if (isCssLength(token)) lengths += 1;
    else if (CSS_BORDER_STYLE.test(token)) styles += 1;
    else if (isCssColor(token)) colors += 1;
    else return undefined;
  }
  if (lengths > 1 || styles > 1 || colors > 1) return undefined;
  return tokens.join(' ');
}

/**
 * The argument of a CSS `drop-shadow()` filter: two or three lengths
 * (offset-x, offset-y and an optional blur radius) and an optional color, in
 * any order. Returns `undefined` otherwise.
 */
export function validateShadow(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const tokens = splitCssTokens(value);
  if (!tokens || tokens.length < 2 || tokens.length > 4) return undefined;
  let lengths = 0;
  let colors = 0;
  for (const token of tokens) {
    if (isCssLength(token)) lengths += 1;
    else if (isCssColor(token)) colors += 1;
    else return undefined;
  }
  if (lengths < 2 || lengths > 3 || colors > 1) return undefined;
  return tokens.join(' ');
}

/**
 * A CSS `font-family` list: family names made of letters, digits, spaces,
 * hyphens and underscores, optionally quoted, separated by commas. Returns
 * `undefined` otherwise.
 */
export function validateFontFamily(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  return /^[A-Za-z0-9 _'",-]+$/.test(v) ? v : undefined;
}
