/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-empty-function */
import { ErrorListener } from '../../public/core';
import { Expression, ErrorCode } from '../public';
import { ParseLatexOptions, LatexDictionaryEntry, LatexToken } from './public';
import {
    isFunctionObject,
    getFunctionName,
    getArgs,
    isNumberObject,
} from '../utils';
import { tokensToString } from '../../core/modes';
import { IndexedLatexDictionary, indexLatexDictionary } from './definitions';
import { DEFAULT_PARSE_LATEX_OPTIONS } from './utils';
import { GROUP, DIVIDE, LATEX, NOTHING } from '../dictionary';

export class Scanner implements Scanner {
    readonly tokens: LatexToken[];
    protected index = 0;

    readonly onError: ErrorListener<ErrorCode>;

    readonly dictionary: IndexedLatexDictionary;

    readonly options: Required<ParseLatexOptions>;

    private invisibleOperatorPrecedence: number;

    constructor(
        tokens: LatexToken[],
        options: Required<ParseLatexOptions> & {
            onError: ErrorListener<ErrorCode>;
            indexedLatexDictionary?: IndexedLatexDictionary;
        }
    ) {
        this.options = { ...DEFAULT_PARSE_LATEX_OPTIONS, ...options };
        this.tokens = tokens;

        this.onError = (err) => {
            return options.onError({
                ...err,
                before: this.latexBefore(),
                after: this.latexAfter(),
            });
        };
        this.dictionary =
            options.indexedLatexDictionary ??
            indexLatexDictionary(options.dictionary, options.onError);

        let def: LatexDictionaryEntry;
        this.invisibleOperatorPrecedence = 0;
        if (this.options.invisibleOperator) {
            def = this.dictionary.name.get(this.options.invisibleOperator);
            if (!def) {
                options.onError({
                    code: 'unknown-operator',
                    arg: this.options.invisibleOperator,
                });
            } else if (typeof def.precedence === 'undefined') {
                options.onError({
                    code: 'expected-operator',
                    arg: this.options.invisibleOperator,
                });
            } else {
                this.invisibleOperatorPrecedence = def.precedence;
            }
        }
        if (this.options.superscriptOperator) {
            def = this.dictionary.name.get(this.options.superscriptOperator);
            if (!def) {
                options.onError({
                    code: 'unknown-operator',
                    arg: this.options.superscriptOperator,
                });
            } else if (typeof def.precedence === 'undefined') {
                options.onError({
                    code: 'expected-operator',
                    arg: this.options.superscriptOperator,
                });
            }
        }

        if (this.options.subscriptOperator) {
            def = this.dictionary.name.get(this.options.subscriptOperator);
            if (!def) {
                options.onError({
                    code: 'unknown-operator',
                    arg: this.options.subscriptOperator,
                });
            } else if (typeof def.precedence === 'undefined') {
                options.onError({
                    code: 'expected-operator',
                    arg: this.options.subscriptOperator,
                });
            }
        }
    }

    clone(start: number, end: number): Scanner {
        const result = new Scanner(this.tokens.slice(start, end), {
            ...this.options,
            dictionary: [],
            indexedLatexDictionary: this.dictionary,
            onError: this.onError,
        });
        return result;
    }

    atEnd(): boolean {
        return this.index >= this.tokens.length;
    }

    peek(): LatexToken {
        return this.tokens[this.index];
    }

    latex(start: number, end?: number): string {
        return tokensToString(this.tokens.slice(start, end));
    }

    latexAhead(n: number): string {
        return tokensToString(this.tokens.slice(this.index, this.index + n));
    }
    latexBefore(): string {
        return this.latex(0, this.index);
    }
    latexAfter(): string {
        return this.latex(this.index);
    }

    /**
     * Return at most `maxLookahead` strings made from the tokens
     * ahead.
     *
     * The index in the returned array correspond to the number of tokens.
     * Note that since a token can be longer than one char ('\\pi', but also
     * some astral plane unicode characters), the length of the string
     * does not match that index. However, knowing the index is important
     * to know by how many tokens to advance.
     *
     */
    lookAhead(): string[] {
        let n = Math.min(
            this.dictionary.lookahead,
            this.tokens.length - this.index
        );
        const result: string[] = [];
        while (n > 0) {
            result[n] = this.latexAhead(n--);
        }
        return result;
    }

    peekDefinition(
        kind:
            | 'symbol'
            | 'function'
            | 'infix'
            | 'matchfix'
            | 'prefix'
            | 'postfix'
            | 'superfix'
            | 'subfix'
            | 'operator'
    ): [LatexDictionaryEntry, number] {
        let defs: LatexDictionaryEntry[];
        if (kind === 'operator') {
            defs = this.lookAhead().map(
                (x, n) =>
                    this.dictionary.infix[n]?.get(x) ??
                    this.dictionary.postfix[n]?.get(x) ??
                    this.dictionary.prefix[n]?.get(x)
            );
        } else {
            defs = this.lookAhead().map((x, n) =>
                this.dictionary[kind][n]?.get(x)
            );
        }
        for (let i = defs.length; i > 0; i--) {
            if (defs[i]) return [defs[i], i];
        }
        return [null, 0];
    }

    next(): LatexToken {
        return this.tokens[this.index++];
    }

    skipSpace(): boolean {
        if (!this.options.skipSpace) return false;
        let result = false;
        while (this.match('<space>')) {
            result = true;
        }
        return result;
    }

    match(target: LatexToken): boolean {
        if (this.tokens[this.index] === target) {
            this.index++;
            return true;
        }
        return false;
    }

    matchAny(targets: LatexToken[]): LatexToken {
        if (targets.includes(this.tokens[this.index])) {
            return this.tokens[this.index++];
        }
        return '';
    }

    matchWhile(targets: LatexToken[]): LatexToken[] {
        const result: LatexToken[] = [];
        while (targets.includes(this.tokens[this.index])) {
            result.push(this.tokens[this.index++]);
        }
        return result;
    }

    matchSign(): string {
        let isNegative = false;
        let done = false;
        while (!done) {
            if (this.skipSpace()) {
                done = false;
            } else if (this.match('-')) {
                isNegative = !isNegative;
                done = false;
            } else if (this.match('+')) {
                done = false;
            } else {
                done = true;
            }
        }
        return isNegative ? '-' : '+';
    }

    matchDigits(): string {
        const result = this.matchWhile([
            '0',
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            this.options.groupSeparator ?? '',
        ]);
        if (result) {
            return result
                .filter((x) => x !== this.options.groupSeparator)
                .join('');
        }
        return '';
    }

    matchSignedInteger(): string {
        const savedIndex = this.index;
        const sign = this.matchSign();
        const result = this.matchDigits();
        if (result) return (sign === '-' ? '-' : '') + result;

        this.index = savedIndex;
        return '';
    }

    matchExponent(): string {
        const savedIndex = this.index;
        let result = '';

        if (this.matchAny(['e', 'E', 'd', 'D'])) {
            const exponent = this.matchSignedInteger();
            if (exponent) {
                result = 'e' + exponent;
            }
        }
        if (result) return result;

        if (this.match('\\times')) {
            this.skipSpace();
            if (this.match('1') && this.match('0') && this.match('^')) {
                if (/[0-9]/.test(this.peek())) {
                    return 'e' + this.next();
                }
                if (this.match('<{>')) {
                    this.skipSpace();
                    const exponent = this.matchSignedInteger();
                    this.skipSpace();
                    if (this.match('<}>') && exponent) {
                        return 'e' + exponent;
                    }
                }
            }
        }

        this.index = savedIndex;
        return '';
    }

    matchNumber(): string {
        if (!this.options.parseNumbers) return '';
        const savedIndex = this.index;

        let result = this.matchDigits();
        if (!result) return '';

        if (this.match(this.options.decimalMarker ?? '')) {
            result += '.' + (this.matchDigits() ?? '');
        }
        result += this.matchExponent() ?? '';

        if (result) return result;

        this.index = savedIndex;
        return '';
    }
    matchOperator(
        kind: 'infix' | 'prefix' | 'postfix',
        lhs: Expression | null = null,
        minPrec = 0
    ): Expression | null {
        const [def, n] = this.peekDefinition(kind);

        if (!def) return null;

        if (typeof def.parse === 'function') {
            // Custom parser found
            const latex = this.latexAhead(n);
            this.index += n;
            let rhs = null;
            [lhs, rhs] = def.parse(lhs, this, minPrec, latex);
            if (!rhs) {
                this.index -= n;
                return null;
            }
            return this.applyInvisibleOperator(lhs, rhs);
        }

        let prec = def.precedence;
        if (prec < minPrec) return null;
        prec += def.associativity === 'left' ? 1 : 0;

        this.index += n;
        const rhs = this.matchExpression(prec);
        return this.applyInvisibleOperator(
            ...this.applyOperator(def.parse as string, lhs, rhs)
        );
    }

    matchArguments(kind: '' | 'group' | 'implicit'): Expression[] | null {
        if (!kind) return null;
        const savedIndex = this.index;
        let result: Expression[] | null = null;
        const group = this.matchMatchfixOperator();
        if (group) {
            if (kind === 'group' && getFunctionName(group) === GROUP) {
                // We got a group i.e. `f(a, b, c)`
                result = getArgs(group);
            } else if (kind === 'implicit') {
                // Does this function allow arguments with optional parentheses?
                // (i.e. trig functions, as in `\cos x`.
                if (getFunctionName(group) === GROUP) {
                    result = getArgs(group);
                } else if (group) {
                    // There was a matchfix, the "group" is the argument, i.e.
                    // `\sin [a, b, c]`
                    result = [group];
                }
                {
                    // No group, but arguments without parentheses are allowed
                    // Read a primary
                    // (i.e. we interpret `\cos x + 1` as `\cos(x) + 1`)
                    const primary = this.matchPrimary();
                    if (primary) result = [primary];
                }
            } else {
                // The element following the function does not match
                // a possible argument list
                // That's OK, but need to undo the parsing of the matchfix
                // This is the case: `f[a]`
                this.index = savedIndex;
            }
        }
        return result;
    }

    matchMatchfixOperator(): Expression | null {
        const [def, n] = this.peekDefinition('matchfix');
        if (!def) return null;
        let result: Expression | null = null;

        if (typeof def.parse === 'function') {
            // Custom parser: invoke it.
            const latex = this.latexAhead(n);
            this.index += n;
            return this.applyInvisibleOperator(
                ...def.parse(null, this, 0, latex)
            );
        }

        this.index += n;
        result = [def.parse];
        let expr: Expression | null = null;
        let done = false;
        let foundCloseFence = false;
        while (!this.atEnd() && !done) {
            this.skipSpace();
            expr = this.matchExpression();
            if (!expr) {
                // No expression. This could be two consecutive separators,
                // i.e. `(1,,3)` which is valid
                // but it could also be a syntax error, i.e. `(?` when `?` is
                // not a valid operator.
                if (this.match(def.separator)) {
                    result.push(NOTHING);
                } else if (this.match(def.closeFence)) {
                    foundCloseFence = true;
                    done = true;
                } else {
                    // Something went wrong, let's exit.
                    done = true;
                }
            } else {
                result.push(expr);
                // Consume separator, if present
                this.match(def.separator);

                if (this.match(def.closeFence)) {
                    foundCloseFence = true;
                    done = true;
                }
                // If we didn't get a fence we'll continue parsing, even if a
                // separator is missing,
                // e.g. `(1 2 3)` will produce the same expression as `(1, 2, 3)`
            }
        }
        if (!foundCloseFence) {
            this.onError({
                code: 'unbalanced-matchfix-operator',
                arg: def.closeFence,
            });
        }

        return result;
    }

    matchDefinition(
        kind:
            | 'symbol'
            | 'infix'
            | 'matchfix'
            | 'prefix'
            | 'postfix'
            | 'superfix'
            | 'subfix'
            | 'operator'
    ): [LatexDictionaryEntry, Expression] {
        // Find the longest string of tokens with a definition of the
        // specified kind
        const [def, tokenCount] = this.peekDefinition(kind);

        // If there is a custom parsing function associated with this
        // definition, invoke it.
        if (typeof def?.parse === 'function') {
            const latexName = this.latexAhead(tokenCount);
            this.index += tokenCount;
            const [, result] = def.parse(null, this, 0, latexName);
            return [def, result];
        }
        this.index += tokenCount;

        return [def, null];
    }

    /**
     * A symbol can be:
     * - a constant: `\pi`
     * - a variable: `x`
     * - a function with explicit arguments `f(x)`
     * - a function with implicit arguments: `\cos x`
     * - a command: `\frac{2}{3}`
     */
    matchSymbol(): Expression | null {
        const [def, result] = this.matchDefinition('symbol');

        // If a result is ready (because there was a parsing function associated
        // with the definition), just
        if (result !== null) return result;

        if (!def) {
            // This is an unknown symbol.
            // Can we promote it?
            if (this.options.promoteUnknownFunctions?.test(this.peek())) {
                const name = this.next();
                // this.onError({ code: 'unknown-function', arg: name });
                const group = this.matchMatchfixOperator();
                // If no arguments, return it as a symbol
                if (!group) return name;
                if (getFunctionName(group) !== GROUP) return null;
                return [name, ...getArgs(group)];
            }
            if (this.options.promoteUnknownSymbols?.test(this.peek())) {
                // this.onError({ code: 'unknown-symbol', arg: this.peek() });
                return this.next();
            }

            // Not a symbol (punctuation or fence, maybe?)...
            return null;
        }

        //
        // Is it a Latex function, e.g. `\frac{}{}`?
        //
        const requiredArgs: Expression[] = [];
        const optionalArgs: Expression[] = [];
        let arg: Expression | null;
        let i = def.optionalLatexArg ?? 0;
        while (i > 0) {
            arg = this.matchOptionalLatexArgument();
            if (arg) optionalArgs.push(arg);
            i--;
        }
        i = def.requiredLatexArg ?? 0;
        while (i > 0) {
            arg = this.matchRequiredLatexArgument();
            // `null` indicate that no required argument was found
            if (arg === null) this.onError({ code: 'expected-argument' });
            // `""` indicate an empty argument, i.e. `{}` was found
            if (arg) requiredArgs.push(arg);
            i--;
        }

        const args = this.matchArguments(def.arguments);
        if (args === null) {
            // Didn't get arguments
            if (requiredArgs.length === 0 && optionalArgs.length === 0) {
                return def.parse as string;
            }
            return [def.parse as string, ...requiredArgs, ...optionalArgs];
        }

        return [def.parse as string, ...requiredArgs, ...args, ...optionalArgs];
    }

    matchOptionalLatexArgument(): Expression | null {
        this.skipSpace();
        if (this.match('[')) {
            const start = this.index;
            let level = 1;
            while (!this.atEnd() && level !== 0) {
                if (this.match('[')) {
                    level += 1;
                } else if (this.match(']')) {
                    level -= 1;
                } else {
                    this.next();
                }
            }
            const scanner = this.clone(start, this.index - 1);
            return scanner.matchExpression();
        }
        return null;
    }

    /**
     * Match a required latex argument:
     * - either enclosed in `{}`
     * - or a single token.
     *
     * Return null if an argument was not found
     * Return '' if an empty argument `{}` was found
     */
    matchRequiredLatexArgument(): Expression | null {
        this.skipSpace();
        if (this.match('<{>')) {
            const start = this.index;
            let level = 1;
            while (!this.atEnd() && level !== 0) {
                if (this.match('<{>')) {
                    level += 1;
                } else if (this.match('<}>')) {
                    level -= 1;
                } else {
                    this.next();
                }
            }
            const scanner = this.clone(start, this.index - 1);
            return scanner.matchExpression() ?? '';
        }

        // Is it a single digit?
        if (/^[0-9]$/.test(this.peek())) {
            // ... only match the digit, i.e. `x^23` is `x^{2}3`, not x^{23}
            return parseFloat(this.next());
        }
        // Is it a single letter (but not a special letter)?
        if (/^[^\\#]$/.test(this.peek())) {
            return this.next();
        }
        // @todo: check. An expression might be too much, i.e. it
        // allows \frac{1}2+1. Maybe just match a primary?
        return this.matchExpression();
    }

    matchSupsub(lhs: Expression | null): Expression | null {
        let result: Expression | null = null;
        this.skipSpace();
        ([
            ['^', 'superfix', this.options.superscriptOperator],
            ['_', 'subfix', this.options.subscriptOperator],
        ] as [string, 'superfix' | 'subfix', string][]).forEach((x) => {
            if (result) return;
            const [triggerChar, opKind, defaultOp] = x;
            if (!defaultOp) return;
            if (!this.match(triggerChar)) return;
            this.skipSpace();
            const savedIndex = this.index;
            let def: LatexDictionaryEntry;
            let n = 0;
            if (this.match('<{>')) {
                this.skipSpace();
                [def, n] = this.peekDefinition(opKind);
                this.index += n;
                this.skipSpace();
                if (def && def.name && this.match('<}>')) {
                    //
                    // It's a supfix/subfix operator (
                    //  i.e. `^{*}` for `superstar`
                    //
                    if (typeof def.parse === 'function') {
                        result = def.parse(lhs, this, 0, def.name)[1];
                    } else {
                        result = [(def.parse as string) ?? def.name, lhs];
                    }
                } else {
                    // Not a supfix/subfix
                    // For example, "^{-1}", start with `"-"` from `superminus`,
                    // but the "1" after it makes it not match
                    this.index = savedIndex;
                }
            } else {
                //
                // Single token argument for a sup/subfix
                //
                [def, n] = this.peekDefinition(opKind);
                if (def && def.name) {
                    this.index += n;
                    if (typeof def.parse === 'function') {
                        result = def.parse(lhs, this, 0, def.name)[1];
                    } else {
                        result = [(def.parse as string) ?? def.name, lhs];
                    }
                }
            }
            if (result) {
                // There could be some arguments following the supsub, e.g.
                // `f^{-1}(x)`
                const args = this.matchArguments(def?.arguments);
                if (args) result = [result, ...args];
            } else {
                [, result] = this.applyOperator(
                    defaultOp,
                    lhs,
                    this.matchRequiredLatexArgument()
                );
            }
        });
        return result;
    }

    matchPostfix(lhs: Expression | null): Expression | null {
        if (!lhs) return null;

        const [def, n] = this.peekDefinition('postfix');
        if (!def) return null;

        if (typeof def.parse === 'function') {
            const latex = this.latexAhead(n);
            this.index += n;
            [, lhs] = def.parse(lhs, this, 0, latex);
            if (!lhs) {
                this.index -= n;
                return null;
            }
            return lhs;
        }

        this.index += n;
        return [def.parse, lhs];
    }

    matchString(): string {
        let result = '';
        let done = this.atEnd();
        while (!done) {
            if (this.match('<space>')) {
                result += ' ';
            } else {
                const token = this.peek();
                if (this.peek() === ']') {
                    done = true;
                } else if (!/^<({|}|\$|\$\$|space)>$/.test(token)) {
                    result += this.next();
                } else if (token[0] === '\\') {
                    // TeX will give a 'Missing \endcsname inserted' error
                    // if it encounters any command when expecting a string.
                    // We're a bit more lax.
                    this.onError({ code: 'unbalanced-braces' });
                    result += this.next();
                } else {
                    // It's '<{>', '<}>', '<$>' or '<$$>
                    done = true;
                }
            }
            done = done || this.atEnd();
        }
        return result;
    }

    matchEnvironmentName(
        command: '\\begin' | '\\end',
        envName: string
    ): boolean {
        if (this.match(command)) {
            const savedIndex = this.index;
            if (this.match('<{>')) {
                const name = this.matchString();
                if (this.match('<}>') && name === envName) {
                    return true;
                }
            }
            this.index = savedIndex;
        }

        return false;
    }

    /**
     * Match an expression in a tabular format,
     * where row are separated by `\\` and columns by `&`
     *
     * Return rows of columns (might be sparse)
     */
    matchTabular(): Expression[] | null {
        // return null;
        const result: Expression = ['list'];

        // debugger;
        let row: Expression[] = ['list'];
        let expr: Expression | null = null;
        let done = false;
        while (!this.atEnd() && !done) {
            if (this.match('&')) {
                // new column
                // Push even if expr is NULL (it represent a skipped column)
                row.push(expr);
                expr = null;
            } else if (this.match('\\\\') || this.match('\\cr')) {
                // new row

                this.skipSpace();
                // Parse but drop optional argument (used to indicate spacing between lines)
                this.matchOptionalLatexArgument();

                if (expr) row.push(expr);
                result.push(row);
                row = ['list'];
                expr = null;
            } else {
                const rhs = this.matchExpression();
                if (!rhs) done = true;
                if (expr) {
                    expr = this.applyInvisibleOperator(expr, rhs);
                } else {
                    expr = rhs;
                }
            }
        }
        // Capture any leftover row
        if (row.length > 1) {
            result.push(row);
        }

        return result;
    }

    matchEnvironment(): Expression | null {
        if (this.match('\\begin')) {
            if (this.match('<{>')) {
                const name = this.matchString();
                if (this.match('<}>')) {
                    const start = this.index;
                    let end = this.index;

                    // Find the end of the environment
                    let level = 1;
                    while (!this.atEnd() && level !== 0) {
                        end = this.index;
                        if (this.matchEnvironmentName('\\begin', name)) {
                            level += 1;
                        } else if (this.matchEnvironmentName('\\end', name)) {
                            level -= 1;
                        } else {
                            this.next();
                        }
                    }

                    const def = this.dictionary.environment.get(name);
                    if (typeof def?.parse === 'function') {
                        return def.parse(
                            null,
                            this.clone(start, end),
                            0,
                            name
                        )[1];
                    }
                    return def?.parse ?? null;
                }
            }
        }
        return null;
    }

    /**
     * Apply the operator `op` to the left-hand-side and right-hand-side
     * expression. Applies the associativity rule specified by the definition,
     * i.e. 'op(a, op(b, c))` -> `op(a, b, c)`, etc...
     *
     * `op` is the name of the operator which should have a corresponding
     * definition.
     *
     * If `op` is an infix operator, it should have both a lhs and rhs.
     * If `op` is a postfix operator, it should only have a lhs.
     * If `op` is a prefix operator, the lhs is returned as the first element
     * of the return tuple.
     *
     * @return a tuple: [lhs, rhs]
     */
    applyOperator(
        op: string,
        lhs: Expression | null,
        rhs: Expression | null
    ): NonNullable<[Expression | null, Expression | null]> {
        const def = this.dictionary.name.get(op);

        if (def?.trigger?.prefix && lhs && !rhs) {
            return [null, [def.name, lhs]];
        }
        if (def?.trigger?.postfix && rhs) {
            return [lhs, [def.name, rhs]];
        }

        if (def?.trigger?.infix && lhs && rhs) {
            // infix
            if (def.associativity === 'non') {
                return [null, [op, lhs, rhs]];
            }
            if (getFunctionName(lhs) === op) {
                // Possible associativity
                if (def.associativity === 'both') {
                    if (getFunctionName(rhs) === op) {
                        // +(+(a, b), +(c, d)) -> +(a, b, c, d)
                        if (Array.isArray(lhs)) {
                            return [null, lhs.concat(getArgs(rhs))];
                        }
                        if (isFunctionObject(lhs)) {
                            return [null, lhs.fn.concat(getArgs(rhs))];
                        }
                    } else {
                        if (Array.isArray(lhs)) {
                            lhs.push(rhs);
                            return [null, lhs];
                        }
                        if (isFunctionObject(lhs)) {
                            lhs.fn.push(rhs);
                        }
                    }
                    return [null, lhs];
                }
                if (def.associativity === 'left') {
                    return [null, [op, lhs, rhs]];
                }
                // Right-associative
                if (Array.isArray(lhs)) {
                    return [null, [op, lhs[1], [op, lhs[2], rhs]]];
                }
                if (isFunctionObject(lhs)) {
                    lhs.fn[2] = [op, lhs.fn[2], rhs];
                }
                return [null, lhs];
            } else if (getFunctionName(rhs) === op) {
                // Possible associativity
                if (def.associativity === 'both') {
                    if (Array.isArray(rhs)) {
                        rhs.splice(1, 0, lhs);
                    }
                    if (isFunctionObject(rhs)) {
                        rhs.fn.splice(1, 0, lhs);
                    }
                    return [null, rhs];
                }
                if (def.associativity === 'right') {
                    return [null, [op, lhs, rhs]];
                }
                // Left-associative
                if (Array.isArray(rhs)) {
                    return [null, [op, rhs[1], [op, rhs[2], lhs]]];
                }
                if (isFunctionObject(rhs)) {
                    rhs.fn[2] = [op, rhs.fn[2], lhs];
                }
                return [null, rhs];
            }
            return [null, [op, lhs, rhs]];
        }
        if (def?.trigger.infix) {
            // Infix, but either right or left operand missing
            this.onError({ code: 'expected-operand' });
            return [lhs, null];
        }

        if (!def) {
            this.onError({ code: 'unknown-operator' });
            return [lhs, rhs];
        }
        return [lhs, null];
    }

    /**
     * Apply an invisible operator between two expressions.
     *
     * If no `invisibleOperator` was specified, use the `latex` operator.
     *
     * If the lhs is a number and the rhs is a fraction, assume an
     * 'invisible plus', that is '2 3/4' -> ['add', 2, [divide, 3, 4]]
     * unless `invisiblePlusOperator` is empty
     *
     */
    applyInvisibleOperator(
        lhs: Expression | null,
        rhs: Expression | null
    ): Expression | null {
        if (!lhs) return rhs;
        if (!rhs) return lhs;
        // @todo: handle invisible plus
        if (this.options.invisiblePlusOperator) {
            if (
                (typeof lhs === 'number' || isNumberObject(lhs)) &&
                getFunctionName(rhs) === DIVIDE
            ) {
                [lhs, rhs] = this.applyOperator(
                    this.options.invisiblePlusOperator,
                    lhs,
                    rhs
                );
                if (!lhs) return rhs;
                return null;
            }
        }
        if (this.options.invisibleOperator) {
            [lhs, rhs] = this.applyOperator(
                this.options.invisibleOperator,
                lhs,
                rhs
            );
            if (!lhs) return rhs;
            return null;
        }
        // No invisible operator, use 'latex'
        let fn: Expression = [LATEX];
        if (getFunctionName(lhs) === LATEX) {
            fn = fn.concat(getArgs(lhs));
        } else {
            fn.push(lhs);
        }
        if (rhs) {
            if (getFunctionName(rhs) === LATEX) {
                fn = fn.concat(getArgs(rhs));
            } else {
                fn.push(rhs);
            }
        }
        if (this.options.invisibleOperator) {
            this.onError({ code: 'unexpected-sequence' });
        }
        return fn;
    }

    matchUnknownLatexCommand(): Expression | null {
        const savedIndex = this.index;
        const command = this.next();
        console.assert(command.length > 1 && command[0] === '\\');

        const optArgs: Expression[] = [];
        const reqArgs: Expression[] = [];

        let done = false;
        do {
            done = true;
            let expr = this.matchOptionalLatexArgument();
            if (expr) {
                optArgs.push(expr);
                done = false;
            }
            this.skipSpace();
            if (this.peek() === '<{>') {
                expr = this.matchRequiredLatexArgument();
                if (expr) {
                    reqArgs.push(expr);
                    done = false;
                }
            }
        } while (!done);

        if (optArgs.length > 0 || reqArgs.length > 0) {
            return [command, ...reqArgs, ...optArgs];
        }
        this.index = savedIndex;
        return null;
    }

    /**
     * <primary> :=
     * (<number> | <symbol> | <environment> | <matchfix-expr>) <subsup>* <postfix-operator>*
     *
     * <symbol> ::= (<symbol-id> | (<latex-command><latex-arguments>)) <arguments>
     *
     * <matchfix-expr> :=
     *  <matchfix-op-open> <expression> [<matchfix-op-separator> <expression>] <matchfix-op-close>
     *
     */
    matchPrimary(): Expression | null {
        let result: Expression | null = null;
        const originalIndex = this.index;

        //
        // 1. Is it a number?
        //
        const num = this.matchNumber();
        if (num) result = { num: num };

        //
        // 2. Is it a symbol, a Latex command or a function call?
        //    `x` or `\pi'
        //    `f(x)` or `\sin(\pi)
        //    `\frac{1}{2}`
        //
        if (!result) result = this.matchSymbol();

        //
        // 3. Is it an environment?
        // `\begin{...}...\end{...}`
        //
        if (!result) result = this.matchEnvironment();

        //
        // 3. Is it a matchfix expression?
        //    (group fence, absolute value, integral, etc...)
        //
        if (!result) result = this.matchMatchfixOperator();

        //
        // 4. Are there subsup or postfix operators?
        //
        let supsub: Expression | null = null;
        do {
            supsub = this.matchSupsub(result);
            result = supsub ?? result;
        } while (supsub);

        let postfix: Expression | null = null;
        do {
            postfix = this.matchPostfix(result);
            result = postfix ?? result;
        } while (postfix);

        return this.decorate(result, originalIndex);
    }

    /**
     *  Parse an expression:
     *
     * <expresion> ::=
     *  | <prefix-op> <primary>
     *  | <primary>
     *  | <primary> <infix-op> <expression>
     *
     * Stop when an operator of precedence less than `minPrec` is encountered
     */
    matchExpression(minPrec = 0): Expression | null {
        let lhs: Expression = null;
        const originalIndex = this.index;

        this.skipSpace();

        //
        // 1. Do we have a prefix operator?
        //
        lhs = this.matchOperator('prefix');

        //
        // 2. Do we have a primary?
        //
        if (!lhs) lhs = this.matchPrimary();
        if (!lhs) return null;

        //
        // 3. Are there some infix operators?
        //
        let done = false;
        while (!this.atEnd() && !done) {
            this.skipSpace();
            let result = this.matchOperator('infix', lhs, minPrec);
            if (!result) {
                // We've encountered something else than an infix operator
                // Could be "y" after "x": time to apply the invisible operator
                // if the next element is *not* an operator.
                const [op] = this.peekDefinition('operator');
                if (!op) {
                    const rhs = this.matchExpression(
                        this.invisibleOperatorPrecedence
                    );
                    if (rhs) {
                        result = this.applyInvisibleOperator(lhs, rhs);
                    } else {
                        done = true;
                    }
                }
            }
            if (result) {
                lhs = result;
            } else {
                // We could not apply the infix operator: the rhs may
                // have been a postfix operator, or something else
                done = true;
            }
        }
        return this.decorate(lhs, originalIndex);
    }

    /**
     * Add latex or other requested metadata to the expression
     */
    decorate(expr: Expression, start: number): Expression {
        if (this.options.preserveLatex) {
            const latex = this.latex(start, this.index);
            if (Array.isArray(expr)) {
                expr = { latex: latex, fn: expr };
            } else if (typeof expr === 'number') {
                expr = { latex: latex, num: Number(expr).toString() };
            } else if (typeof expr === 'string') {
                expr = { latex: latex, sym: expr };
            } else {
                expr.latex = latex;
            }
        }
        return expr;
    }
}
