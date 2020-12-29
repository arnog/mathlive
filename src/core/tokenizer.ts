/**
 * ## Reference
 * TeX source code:
 * {@link  http://tug.org/texlive/devsrc/Build/source/texk/web2c/tex.web | Tex.web}
 *
 */

import { splitGraphemes } from './grapheme-splitter';

// The 'special' tokens must be of length > 1 to distinguish
// them from literals.
// '<space>': whitespace
// '<$$>'   : display mode shift
// '<$>'    : inline mode shift
// '<{>'    : begin group
// '<}>'    : end group
// '#0'-'#9': argument
// '#?'     : placeholder
// '\' + ([a-zA-Z*]+)|([^a-zAz*])  : command
// other (length = 1)   : literal
//  See: [TeX:289](http://tug.org/texlive/devsrc/Build/source/texk/web2c/tex.web)
export type Token = string;

/**
 * Given a LaTeX expression represented as a character string,
 * the Lexer class will scan and return Tokens for the lexical
 * units in the string.
 *
 * @param s A string of LaTeX
 */
class Tokenizer {
  obeyspaces: boolean;
  private readonly s: string | string[];
  private pos: number;

  constructor(s: string) {
    this.s = splitGraphemes(s);
    this.pos = 0;
    this.obeyspaces = false;
  }

  /**
   * @return True if we reached the end of the stream
   */
  end(): boolean {
    return this.pos >= this.s.length;
  }

  /**
   * Return the next char and advance
   */
  get(): string {
    return this.pos < this.s.length ? this.s[this.pos++] : '';
  }

  /**
   * Return the next char, but do not advance
   */
  peek(): string {
    return this.s[this.pos];
  }

  /**
   * Return the next substring matching regEx and advance.
   */
  match(regEx: RegExp): string {
    // This.s can either be a string, if it's made up only of ASCII chars
    // or an array of graphemes, if it's more complicated.
    const execResult: (string | null)[] | null =
      typeof this.s === 'string'
        ? regEx.exec(this.s.slice(this.pos))
        : regEx.exec(this.s.slice(this.pos).join(''));
    if (execResult?.[0]) {
      this.pos += execResult[0].length;
      return execResult[0];
    }

    return null;
  }

  /**
   * Return the next token, or null.
   */
  next(): Token | null {
    // If we've reached the end, exit
    if (this.end()) return null;
    // Handle white space
    // In text mode, spaces are significant,
    // however they are coalesced unless \obeyspaces
    if (!this.obeyspaces && this.match(/^[ \f\n\r\t\v\u00A0\u2028\u2029]+/)) {
      // Note that browsers are inconsistent in their definitions of the
      // `\s` metacharacter, so we use an explicit pattern instead.

      // - IE:          `[ \f\n\r\t\v]`
      // - Chrome:      `[ \f\n\r\t\v\u00A0]`
      // - Firefox:     `[ \f\n\r\t\v\u00A0\u2028\u2029]`
      // - \f \u000C: form feed (FORM FEED)
      // - \n \u000A: linefeed (LINE FEED)
      // - \r \u000D: carriage return
      // - \t \u0009: tab (CHARACTER TABULATION)
      // - \v \u000B: vertical tab (LINE TABULATION)
      // - \u00A0: NON-BREAKING SPACE
      // - \u2028: LINE SEPARATOR
      // - \u2029: PARAGRAPH SEPARATOR
      return '<space>';
    }

    if (this.obeyspaces && this.match(/^[ \f\n\r\t\v\u00A0\u2028\u2029]/)) {
      // Don't coalesce when this.obeyspaces is true (different regex from above)
      return '<space>';
    }

    const next = this.get();
    // Is it a command?
    if (next === '\\') {
      if (!this.end()) {
        // A command is either a string of letters and asterisks...
        let command = this.match(/^[a-zA-Z*]+/);
        if (command) {
          // Spaces after a 'control word' are ignored
          // (but not after a 'control symbol' (single char)
          this.match(/^[ \f\n\r\t\v\u00A0\u2028\u2029]*/);
        } else {
          // ... or a single non-letter character
          command = this.get();
          if (command === ' ') {
            // The `\ ` command is equivalent to a single space
            return '<space>';
          }
        }

        return '\\' + command;
      }
    } else if (next === '{') {
      // This is a group start
      return '<{>';
    } else if (next === '}') {
      // This is a group end
      return '<}>';
    } else if (next === '^') {
      if (this.peek() === '^') {
        // It might be a ^^ command (inline hex character)
        this.get();
        // There can be zero to six carets with the same number of hex digits
        const hex = this.match(
          /^(\^(\^(\^(\^[\da-f])?[\da-f])?[\da-f])?[\da-f])?[\da-f]{2}/
        );
        if (hex) {
          return String.fromCodePoint(
            Number.parseInt(hex.slice(hex.lastIndexOf('^') + 1), 16)
          );
        }
      }

      return next;
    } else if (next === '#') {
      // This could be either a param token, or a literal # (used for
      // colorspecs, for example). A param token is a '#' followed by
      // - a digit 0-9 followed by a non-alpha, non-digit
      // - or '?' (to indicate a placeholder)
      // - or '@' (to indicate an implicit, optional, argument)
      // Otherwise, it's a literal '#'.
      if (!this.end()) {
        let isParameter = false;
        if (/[\d?@]/.test(this.peek())) {
          // Could be a param
          isParameter = true;
          // Need to look ahead to the following char
          // (to exclude, e.g. '#1c1b2d': it's not a '#' token, it's a color)
          if (this.pos + 1 < this.s.length) {
            const after = this.s[this.pos + 1];
            isParameter = /[^\dA-Za-z]/.test(after);
          }
        }

        if (isParameter) {
          return '#' + this.get();
        }

        return '#';
      }
    } else if (next === '$') {
      // Mode switch
      if (this.peek() === '$') {
        // $$
        this.get();
        return '<$$>';
      }

      // $
      return '<$>';
    }

    return next;
  }
}

// Some primitive commands need to be handled in the expansion phase
// (the 'gullet')
function expand(lex: Tokenizer, args: string[]): Token[] {
  let result: Token[] = [];
  let token = lex.next();
  if (token) {
    if (token === '\\relax') {
      // Do nothing
    } else if (token === '\\noexpand') {
      // Do not expand the next token
      token = lex.next();
      if (token) {
        result.push(token);
      }
    } else if (token === '\\obeyspaces') {
      lex.obeyspaces = true;
    } else if (token === '\\space' || token === '~') {
      // The `\space` command is equivalent to a single space
      // The ~ is an 'active character' (a single character macro)
      // that maps to <space>
      result.push('<space>');
    } else if (token === '\\bgroup') {
      // Begin group, synonym for opening brace
      result.push('<{>');
    } else if (token === '\\egroup') {
      // End group, synonym for closing brace
      result.push('<}>');
    } else if (token === '\\string') {
      // Turn the next token into a string
      token = lex.next();
      if (token) {
        if (token.startsWith('\\')) {
          [...token].forEach((x) =>
            result.push(x === '\\' ? '\\backslash' : x)
          );
        } else if (token === '<{>') {
          result.push('\\{');
        } else if (token === '<space>') {
          result.push('~');
        } else if (token === '<}>') {
          result.push('\\}');
        }
      }
    } else if (token === '\\csname') {
      // Turn the next tokens, until `\endcsname`, into a command
      while (lex.peek() === '<space>') {
        lex.next();
      }

      let command = '';
      let done = false;
      let tokens = [];
      do {
        if (tokens.length === 0) {
          // We're out of tokens to look at, get some more
          if (/^#[\d?@]$/.test(lex.peek())) {
            // Expand parameters (but not commands)
            const parameter = lex.get().slice(1);
            tokens = tokenize(
              args?.[parameter] ?? args?.['?'] ?? '\\placeholder{}',
              args
            );
            token = tokens[0];
          } else {
            token = lex.next();
            tokens = token ? [token] : [];
          }
        }

        done = tokens.length === 0;
        if (!done && token === '\\endcsname') {
          done = true;
          tokens.shift();
        }

        if (!done) {
          done =
            token === '<$>' ||
            token === '<$$>' ||
            token === '<{>' ||
            token === '<}>' ||
            (token.length > 1 && token.startsWith('\\'));
        }

        if (!done) {
          command += tokens.shift();
        }
      } while (!done);

      if (command) {
        result.push('\\' + command);
      }

      result = result.concat(tokens);
    } else if (token === '\\endcsname') {
      // Unexpected \endcsname are ignored
    } else if (token.length > 1 && token.startsWith('#')) {
      // It's a parameter to expand
      const parameter = token.slice(1);
      result = result.concat(
        tokenize(args?.[parameter] ?? args?.['?'] ?? '\\placeholder{}', args)
      );
    } else {
      result.push(token);
    }
  }

  return result;
}

/**
 * Create Tokens from a stream of LaTeX
 *
 * @param s - A string of LaTeX. It can include comments (with the `%`
 * marker) and multiple lines.
 */
export function tokenize(s: string, args: string[]): Token[] {
  // Merge multiple lines into one, and remove comments
  const lines = s.toString().split(/\r?\n/);
  let stream = '';
  let sep = '';
  for (const line of lines) {
    stream += sep;
    sep = ' ';
    // Remove everything after a % (comment marker)
    // (but \% should be preserved...)
    const m = line.match(/((?:\\%)|[^%])*/);
    if (m !== null) stream += m[0];
  }

  const tokenizer = new Tokenizer(stream);
  let result: Token[] = [];
  do {
    result = result.concat(expand(tokenizer, args));
  } while (!tokenizer.end());

  return result;
}

export function joinLatex(segments: string[]): string {
  let sep = '';
  let result = '';
  for (const segment of segments) {
    if (segment) {
      if (/[a-zA-Z*]/.test(segment[0])) {
        // If the segment begins with a char that *could* be in a command
        // name... insert a separator (if one was needed for the previous segment)
        result += sep;
      }

      // If the segment ends in a command...
      sep = /\\[a-zA-Z]+\*?$/.test(segment) ? ' ' : '';
      result += segment;
    }
  }

  return result;
}

export function tokensToString(tokens: Token[]): string {
  const result = joinLatex(
    tokens.map((token) => {
      return (
        {
          '<space>': ' ',
          '<$$>': '$$',
          '<$>': '$',
          '<{>': '{',
          '<}>': '}',
        }[token] ?? token
      );
    })
  );
  return result;
}
