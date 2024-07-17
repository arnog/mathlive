"use strict";
/**
 * ## Reference
 * TeX source code:
 * {@link  http://tug.org/texlive/devsrc/Build/source/texk/web2c/tex.web | Tex.web}
 *
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.tokensToString = exports.latexCommand = exports.joinLatex = exports.tokenize = void 0;
var grapheme_splitter_1 = require("./grapheme-splitter");
/**
 * Given a LaTeX string, the Tokenizer will return Tokens for the lexical
 * units in the string.
 *
 * @param s A LaTeX string
 */
var Tokenizer = /** @class */ (function () {
    function Tokenizer(s) {
        this.obeyspaces = false;
        this.pos = 0;
        this.s = (0, grapheme_splitter_1.splitGraphemes)(s);
    }
    /**
     * @return True if we reached the end of the stream
     */
    Tokenizer.prototype.end = function () {
        return this.pos >= this.s.length;
    };
    /**
     * Return the next char and advance
     */
    Tokenizer.prototype.get = function () {
        return this.pos < this.s.length ? this.s[this.pos++] : '';
    };
    /**
     * Return the next char, but do not advance
     */
    Tokenizer.prototype.peek = function () {
        return this.s[this.pos];
    };
    /**
     * Return the next substring matching regEx and advance.
     */
    Tokenizer.prototype.match = function (regEx) {
        // This can either be a string, if it's made up only of ASCII chars
        // or an array of graphemes, if it's more complicated.
        var execResult = typeof this.s === 'string'
            ? regEx.exec(this.s.slice(this.pos))
            : regEx.exec(this.s.slice(this.pos).join(''));
        if (execResult === null || execResult === void 0 ? void 0 : execResult[0]) {
            this.pos += execResult[0].length;
            return execResult[0];
        }
        return '';
    };
    /**
     * Return the next token, or null.
     */
    Tokenizer.prototype.next = function () {
        // If we've reached the end, exit
        if (this.end())
            return null;
        // Handle white space
        // In text mode, spaces are significant, however they are coalesced
        // unless \obeyspaces
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
            // Don't coalesce when this.obeyspaces is true (different regex
            // from above)
            return '<space>';
        }
        var next = this.get();
        // Is it a command?
        if (next === '\\') {
            if (!this.end()) {
                // A command is either a string of letters and asterisks...
                var command = this.match(/^[a-zA-Z\*]+/);
                if (command) {
                    // Spaces after a 'control word' are ignored
                    // (but not after a 'control symbol' (single char)
                    this.match(/^[ \f\n\r\t\v\u00A0\u2028\u2029]*/);
                }
                else {
                    // ... or a single non-letter character
                    command = this.get();
                }
                return '\\' + command;
            }
        }
        else if (next === '{') {
            // This is a group start
            return '<{>';
        }
        else if (next === '}') {
            // This is a group end
            return '<}>';
        }
        else if (next === '^') {
            if (this.peek() === '^') {
                // It might be a ^^ command (inline hex character)
                this.get();
                // There can be zero to six carets with the same number of hex digits
                var hex = this.match(/^(\^(\^(\^(\^[\da-f])?[\da-f])?[\da-f])?[\da-f])?[\da-f]{2}/);
                if (hex) {
                    return String.fromCodePoint(Number.parseInt(hex.slice(hex.lastIndexOf('^') + 1), 16));
                }
            }
            return next;
        }
        else if (next === '#') {
            // This could be either a param token, or a literal # (used for
            // colorspecs, for example). A param token is a '#' followed by
            // - a digit 0-9 followed by a non-alpha, non-digit
            // - or '?' (to indicate a placeholder)
            // - or '@' (to indicate an implicit, optional, argument)
            // Otherwise, it's a literal '#'.
            if (!this.end()) {
                var isParameter = false;
                if (/[\d?@]/.test(this.peek())) {
                    // Could be a param
                    isParameter = true;
                    // Need to look ahead to the following char
                    // (to exclude, e.g. '#1c1b2d': it's not a '#' token, it's a color)
                    if (this.pos + 1 < this.s.length) {
                        var after = this.s[this.pos + 1];
                        isParameter = /[^\dA-Za-z]/.test(after);
                    }
                }
                if (isParameter)
                    return '#' + this.get();
                return '#';
            }
        }
        else if (next === '$') {
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
    };
    return Tokenizer;
}());
// Some primitive commands need to be handled in the expansion phase
// (the 'gullet')
function expand(lex, args) {
    var _a, _b, _c, _d;
    var result = [];
    var token = lex.next();
    if (token) {
        if (token === '\\relax') {
            // Do nothing
        }
        else if (token === '\\noexpand') {
            // Do not expand the next token
            token = lex.next();
            if (token)
                result.push(token);
        }
        else if (token === '\\obeyspaces')
            lex.obeyspaces = true;
        else if (token === '\\bgroup') {
            // Begin group, synonym for opening brace
            result.push('<{>');
        }
        else if (token === '\\egroup') {
            // End group, synonym for closing brace
            result.push('<}>');
        }
        else if (token === '\\string') {
            // Turn the next token into a string
            token = lex.next();
            if (token) {
                if (token.startsWith('\\'))
                    for (var _i = 0, token_1 = token; _i < token_1.length; _i++) {
                        var x = token_1[_i];
                        result.push(x === '\\' ? '\\backslash' : x);
                    }
                else if (token === '<{>')
                    result.push('\\{');
                else if (token === '<space>')
                    result.push('~');
                else if (token === '<}>')
                    result.push('\\}');
            }
        }
        else if (token === '\\csname') {
            // Turn the next tokens, until `\endcsname`, into a command
            while (lex.peek() === '<space>')
                lex.next();
            var command = '';
            var done = false;
            var tokens = [];
            do {
                if (tokens.length === 0) {
                    // We're out of tokens to look at, get some more
                    if (/^#[\d?@]$/.test(lex.peek())) {
                        // Expand parameters (but not commands)
                        var parameter = lex.get().slice(1);
                        tokens = tokenize((_b = (_a = args === null || args === void 0 ? void 0 : args(parameter)) !== null && _a !== void 0 ? _a : args === null || args === void 0 ? void 0 : args('?')) !== null && _b !== void 0 ? _b : '\\placeholder{}', args);
                        token = tokens[0];
                    }
                    else {
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
                            (typeof token === 'string' &&
                                token.length > 1 &&
                                token.startsWith('\\'));
                }
                if (!done)
                    command += tokens.shift();
            } while (!done);
            if (command)
                result.push('\\' + command);
            result.push.apply(result, tokens);
        }
        else if (token === '\\endcsname') {
            // Unexpected \endcsname are ignored
        }
        else if (token.length > 1 && token.startsWith('#')) {
            // It's a parameter to expand
            var parameter = token.slice(1);
            result.push.apply(result, tokenize((_d = (_c = args === null || args === void 0 ? void 0 : args(parameter)) !== null && _c !== void 0 ? _c : args === null || args === void 0 ? void 0 : args('?')) !== null && _d !== void 0 ? _d : '\\placeholder{}', args));
        }
        else
            result.push(token);
    }
    return result;
}
/**
 * Create Tokens from a stream of LaTeX
 *
 * @param s - A string of LaTeX. It can include comments (with the `%`
 * marker) and multiple lines.
 */
function tokenize(s, args) {
    if (args === void 0) { args = null; }
    if (!s)
        return [];
    // Merge multiple lines into one, and remove comments
    var lines = [];
    var sep = '';
    for (var _i = 0, _a = s.toString().split(/\r?\n/); _i < _a.length; _i++) {
        var line = _a[_i];
        if (sep)
            lines.push(sep);
        sep = ' ';
        // Remove everything after a % (comment marker)
        // (but \% should be preserved...)
        var m = line.match(/((?:\\%)|[^%])*/);
        if (m !== null)
            lines.push(m[0]);
    }
    var tokenizer = new Tokenizer(lines.join(''));
    var result = [];
    do
        result.push.apply(result, expand(tokenizer, args));
    while (!tokenizer.end());
    return result;
}
exports.tokenize = tokenize;
function joinLatex(segments) {
    var sep = '';
    var result = [];
    for (var _i = 0, segments_1 = segments; _i < segments_1.length; _i++) {
        var segment = segments_1[_i];
        if (segment) {
            // If the segment begins with a char that *could* be in a command
            // name... insert a separator (if one was needed for the previous segment)
            if (sep && /^[a-zA-Z\*]/.test(segment))
                result.push(sep);
            result.push(segment);
            // If the segment is a command with an unbraced argument using a hex
            // number, add a separator now.
            if (/^\\[a-zA-Z]+\*?[\"\'][^\ ]+$/.test(segment))
                result.push(' ');
            // If the segment ends in a command, we may need a separator for
            // the next segment
            sep = /\\[a-zA-Z]+\*?$/.test(segment) ? ' ' : '';
        }
    }
    return result.join('');
}
exports.joinLatex = joinLatex;
/**
 * Return a LaTeX fragment given a command and its arguments.
 * Note that `command` may include optional arguments, e.g. `\\bbox[red]`
 */
function latexCommand(command) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    console.assert(command.startsWith('\\'));
    if (args.length === 0)
        return command;
    // While TeX (Knuth) tends to minimize the use of braces, e.g. prefering
    // `\frac xy` over `\frac{x}{y}` we are implementing the more conservative
    // LaTeX convention that use braces by default.
    // Note that the custom serializer for `\frac` does omit braces when
    // both arguments are digits, i.e. `\frac34`.
    // See a discussion on this topic here: https://tex.stackexchange.com/questions/82329/how-bad-for-tex-is-omitting-braces-even-if-the-result-is-the-same
    return joinLatex(__spreadArray([command], args.map(function (x) { return "{".concat(x, "}"); }), true));
}
exports.latexCommand = latexCommand;
function tokensToString(tokens) {
    return joinLatex(tokens.map(function (token) {
        var _a;
        return (_a = ({
            '<space>': ' ',
            '<$$>': '$$',
            '<$>': '$',
            '<{>': '{',
            '<}>': '}'
        })[token]) !== null && _a !== void 0 ? _a : token;
    }));
}
exports.tokensToString = tokensToString;
