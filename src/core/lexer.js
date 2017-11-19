/*global require:false*/
/*global define:false*/

/**
 * @module lexer
 * @private
 */
/**
 * ## Reference
 * TeX source code:
 * {@link  http://tug.org/texlive/devsrc/Build/source/texk/web2c/tex.web|Tex.web}
 * 
 * For a list of standard TeX macros, see:
 * {@link ftp://tug.ctan.org/pub/tex-archive/systems/knuth/dist/lib/plain.tex|plain.tex}
*/


define(['mathlive/core/grapheme-splitter'], function(GraphemeSplitter) {


/**
 * 
 * A token can be of type:
 *  - `literal`: the value is the character this token represents. This can be 
 * a combination of Unicode codepoints, for example for emojis.
 *  - `^` and `_`: superscript and subscript commands.
 *  - command: a command such as \sin
 *  - `{` and `}`: begin and end group (use for arguments of commands and for grouping)
 *  - `#`: parameter
 *
 *  - `esc`: start of a special command. Followed by commandliteral tokens.
 *  - `backslash`: start of a special command. Followed by commandliteral tokens.
 *  - `commandliteral`: a-zA-Z for special commands (esc sequence, etc...)
 *  - `placeholder`: a placeholder value meant to be replaced by some actual value
 *  - `space`: one or more space characters (including tab, etc...)
 * 
 *  See: [TeX:289](http://tug.org/texlive/devsrc/Build/source/texk/web2c/tex.web)
 * @property {string} value
 * @property {string} type
 * @class Token
 * @global
 * @private
 */
function Token(type, value) {
    this.type = type;
    this.value = value;
    console.assert(!(type === 'literal' && value === '}'));
}

/**
 * @param {string} s 
 * @class Lexer
 * @global
 * @private
 */
function Lexer(s) {
    this.s = GraphemeSplitter.splitGraphemes(s);
    this.pos = 0;
}

/**
 * @return {boolean} True if we reached the end of the stream
 * @method Lexer#end
 * @private
 */
Lexer.prototype.end = function() {
    return this.pos >= this.s.length;
}

/** 
 * Return the next char and advance 
 * @return {string}
 * @method Lexer#get
 */
Lexer.prototype.get = function() {
    return this.pos < this.s.length ? this.s[this.pos++] : null;
}

/**
 * Return the next char, but do not advance
 * @return {string}
 * @method Lexer#peek
 * @private
 */
Lexer.prototype.peek = function() {
    return this.pos < this.s.length ? this.s[this.pos] : null;
}

/**
 * Return the next substring matching regEx and advance.
 * @param {RegEx} regEx
 * @return {?string}
 * @method Lexer#scan
 * @private
 */
Lexer.prototype.scan = function(regEx) {
    let result;
    // this.s can either be a string, if it's made up only of ASCII chars
    // or an array of graphemes, if it's more complicated.
    if (typeof this.s === 'string') {
        result = regEx.exec(this.s.slice(this.pos)); 
    } else {
        result = regEx.exec(this.s.slice(this.pos).join('')); 
    }
    if (result) {
        this.pos += result[0].length;
        return result[0];
    }
    return null;
}


/**
 * Return true if next char is white space. Does not advance.
 * Note that browsers are inconsistent in their definitions of the 
 * `\s` metacharacter, so use an explicit string match instead.
 * 
 * - Chrome:      `[ \t\n\v\f\r\u00A0]`
 * - Firefox:     `[ \t\n\v\f\r\u00A0\u2028\u2029]`
 * - IE:          `[ \t\n\v\f\r]`
 * 
 * See [Stackoverflow](http://stackoverflow.com/questions/6073637/)
 * @method Lexer#isWhiteSpace
 * @private
 */
Lexer.prototype.isWhiteSpace = function() {
    return ' \f\n\r\t\v\u00A0\u2028\u2029'.indexOf(this.s[this.pos]) !== -1;
    /*
        - \t \u0009: tab (CHARACTER TABULATION)
        - \n \u000A: linefeed (LINE FEED)
        - \v \u000B: vertical tab (LINE TABULATION)
        - \f \u000C: form feed (FORM FEED)
        - \r \u000D: carriage return
        - \u00A0: NON-BREAKING SPACE
        - \u2028: LINE SEPARATOR
        - \u2029: PARAGRAPH SEPARATOR

        Could be considered:
        - \u1680 OGHAM SPACE MARK
        - \u2000-\u200a spacing
        - \u202f NARROW NO-BREAK SPACE
        - \u205F MEDIDUM MATHEMATICAL SPACE
        - \u3000 IDEOGRAPHIC SPACE
        - \uFEFF ZERO WITH NON-BREAKING SPACE
    */
}


/***
 * Advance until non-white-space char.
 * Returns number of chars skipped.
 * @method Lexer#skipWhiteSpace
 * @private
 */
Lexer.prototype.skipWhiteSpace = function() {
    const savedPos = this.pos;
    while (!this.end() && this.isWhiteSpace()) {
        this.get();
    }
    return this.pos - savedPos;
}



/**
 * Return a single token, or null, created from the lexer.
 * 
 * @returns {Token}
 * @method Lexer#makeToken
 * @private
 */
Lexer.prototype.makeToken = function() {
    // If we've reached the end, exit
    if (this.end()) return null;

    // Skip white space
    if (this.skipWhiteSpace() > 0) return new Token('space');

    let result = null;

    // Is it a command?
    if (this.peek() === '\\') {
        this.get();  // Skip the initial \
        if (!this.end()) {
            // A command is either a string of letters and asterisks...
            let command = this.scan(/^[a-zA-Z*]+/);
            if (!command) {
                // ... or a single non-letter character
                command = this.get();
            }
            // There are a few special commands that are handled here...
            if (command === 'bgroup') {
                // Begin group, synonym for opening brace
                result = new Token('{');
            } else if (command === 'egroup') {
                // End group, synonym for closing brace
                result = new Token('}');
            } else {
                result = new Token('command', command);
            }
        }

    // Is it a group start/end?
    } else if (this.peek() === '{' || this.peek() === '}') {
        result = new Token(this.get());

    } else if (this.peek() === '#') {
        // This could be either a param token, or a literal # (used for 
        // colorspecs, for example). A param token is a '#' followed by
        // - a digit 0-9 followed by a non-alpha, non-digit 
        // - or '?'. 
        // Otherwise, it's a literal '#'.
        this.get();
        if (!this.end()) {
            let isParam = false;
            let next = this.peek();
            if (/[0-9?]/.test(next)) {
                // Could be a param
                // Need to look ahead to the following char
                if (this.pos + 1 < this.s.length) {
                    const after = this.s[this.pos + 1];
                    isParam = /[^0-9A-Za-z]/.test(after);
                }
            }
            if (isParam) {
                result = new Token('placeholder');
                next = this.get();
                if (next >= '0' && next <= '9') {
                    result.value = parseInt(next);
                } else {
                    result.value = '?';
                }
            } else {
                result = new Token('literal', '#');
            }
        }


        // result = new Token(this.get());
        // if (!this.end()) {
        //     const next = this.get();
        //     if (next >= '0' && next <= '9') {
        //         result.value = parseInt(next);
        //     } else {
        //         result.value = next;
        //     }
        // }

    } else if (this.peek() === '^') {
        result = new Token(this.get());

    } else if (this.peek() === '_') {
        result = new Token(this.get());

    } else if (this.peek() === '~') {
        // Spacing
        this.get();
        result = new Token('command', 'space');

    // Is it ESCAPE
    } else if (this.peek() === '\u001b') {   // ESCAPE character
        result = new Token('esc', this.get());

    // Is it a mode switch? 
    } else if (this.peek() === '$') {
        this.get();
        if (this.peek() === '$') {
            // $$ 
            this.get();
            result = new Token('$$');
        } else {
            // $
            result = new Token('$');
        }
    } else {
        result = new Token('literal', this.get());
    }

    return result;
}


/**
 * Create Tokens from a stream of LaTeX
 * 
 * @param {string} s - A string o LaTeX. It can include comments (with the `%`
 * marker) and multiple lines.
 * @return {Token[]}
 * @memberof module:lexer
 * @private
 */
function tokenize(s) {
    const result = [];
    const lines = s.toString().split(/\r?\n/);
    let stream = '';
    for (const line of lines) {
        // Remove everything after a % (comment marker)
        // (but \% should be preserved...)
        // @todo there's probably a better way of doing this using s.split(regex)
        let previousChar = '';
        for (let i = 0; i < line.length; i++) {
            const c = line.charAt(i);
            if (c === '%' && previousChar !== '\\') {
                break;
            }
            stream += c;
            previousChar = c;
        }
    }

    const lex = new Lexer(stream);
    while (!lex.end()) {
        const token = lex.makeToken();
        if (token) result.push(token);
    }

    return result;
}





return {
    tokenize
}




})
