import { ErrorListener } from '../../public/core';
import type { Expression, ErrorCode } from '../public';
import { Latex, EmitLatexOptions, LatexDictionary } from './public';
import {
    getArg,
    getSymbolName,
    isNumberObject,
    getArgs,
    isSymbolObject,
    getFunctionName,
    getArgCount,
    replaceLatex,
    getFunctionHead,
} from '../utils';
import {
    IndexedLatexDictionary,
    IndexedLatexDictionaryEntry,
    indexLatexDictionary,
} from './definitions';
import { joinLatex } from '../../core/modes';
import { emitNumber } from './emit-number';
import { getApplyFunctionStyle, getGroupStyle } from './emit-style';
import { GROUP } from '../dictionary';

function getSymbolStyle(expr: Expression, _level: number): 'asis' | 'upright' {
    console.assert(typeof expr === 'string' || isSymbolObject(expr));

    return getSymbolName(expr).length > 1 ? 'upright' : 'asis';
}

function emitMatchfix(
    emitter: Emitter,
    expr: Expression,
    def: IndexedLatexDictionaryEntry
): string {
    let segments: string[] = [];
    if (typeof def.trigger.matchfix === 'string') {
        segments.push(def.trigger.matchfix);
    } else if (Array.isArray(def.trigger.matchfix)) {
        segments = [...def.trigger.matchfix];
    }
    if (getArgCount(expr) >= 1) {
        let sep = '';
        for (const arg of getArgs(expr)) {
            if (arg) {
                segments.push(sep);
                segments.push(emitter.emit(arg));
                sep = def.separator;
            }
        }
    }
    if (def.closeFence) segments.push(def.closeFence);
    return joinLatex(segments);
}

function emitOperator(
    emitter: Emitter,
    expr: Expression,
    def: IndexedLatexDictionaryEntry
): string {
    let result = '';
    const count = getArgCount(expr);
    const name = getFunctionName(expr);
    if (def.trigger.superfix || def.trigger.subfix) {
        if (count !== 1) {
            emitter.onError({
                code: 'operator-requires-one-operand',
                arg: emitter.emitSymbol(name),
            });
        }
        return replaceLatex(def.emit as string, [
            emitter.emit(getArg(expr, 1)),
        ]);
    }
    if (def.trigger.postfix) {
        if (count !== 1) {
            emitter.onError({
                code: 'postfix-operator-requires-one-operand',
                arg: emitter.emitSymbol(name),
            });
        }
        return replaceLatex(def.emit as string, [
            emitter.wrap(getArg(expr, 1), def.precedence),
        ]);
    }
    if (def.trigger.prefix) {
        if (count !== 1) {
            emitter.onError({
                code: 'prefix-operator-requires-one-operand',
                arg: emitter.emitSymbol(name),
            });
        }
        return replaceLatex(def.emit as string, [
            emitter.wrap(getArg(expr, 1), def.precedence + 1),
        ]);
    }
    if (def.trigger.infix) {
        result = emitter.wrap(getArg(expr, 1), def.precedence);
        for (let i = 2; i < count + 1; i++) {
            const arg = getArg(expr, i);
            if (arg !== null) {
                result = replaceLatex(def.emit as string, [
                    result,
                    emitter.wrap(arg, def.precedence),
                ]);
            }
        }
    }
    return result;
}

export class Emitter implements Emitter {
    readonly dictionary?: IndexedLatexDictionary;
    readonly onError: ErrorListener<ErrorCode>;
    readonly options: Required<EmitLatexOptions>;
    level = -1;
    constructor(
        options: Required<EmitLatexOptions> & {
            dictionary: LatexDictionary;
            onError: ErrorListener<ErrorCode>;
        }
    ) {
        this.options = options;
        if (options.invisibleMultiply) {
            if (
                !/#1/.test(options.invisibleMultiply) ||
                !/#2/.test(options.invisibleMultiply)
            ) {
                options.onError({
                    code: 'expected-argument',
                    arg: 'invisibleMultiply',
                });
            }
        }
        this.onError = options.onError;
        this.dictionary = indexLatexDictionary(
            options.dictionary,
            options.onError
        );
    }
    /**
     * Emit the expression, and if the expression is an operator
     * of precedence less than or equal to prec, wrap it in some paren.
     */
    wrap(expr: Expression | null, prec?: number): string {
        if (expr === null) return '';
        if (typeof prec === 'undefined') {
            return '(' + this.emit(expr) + ')';
        }
        if (
            typeof expr === 'number' ||
            isNumberObject(expr) ||
            typeof expr === 'string' ||
            isSymbolObject(expr)
        ) {
            return this.emit(expr);
        }
        const name = getFunctionName(expr);
        if (typeof name === 'string' && name) {
            const def = this.dictionary.name.get(name);
            if (
                def &&
                typeof def.precedence !== 'undefined' &&
                def.precedence < prec
            ) {
                return this.wrapString(
                    this.emit(expr),
                    getApplyFunctionStyle(expr, this.level)
                );
            }
        }
        return this.emit(expr);
    }

    /** If this is a "short" expression (atomic), wrap it.
     *
     */
    wrapShort(expr: Expression): string {
        const exprStr = this.emit(expr);

        if (getFunctionName(expr) === GROUP) return exprStr;

        if (
            typeof expr !== 'number' &&
            !isNumberObject(expr) &&
            !/(^(.|\\[a-zA-Z*]+))$/.test(exprStr)
        ) {
            // It's a long expression, wrap it
            return this.wrapString(
                exprStr,
                getGroupStyle(expr, this.level + 1)
            );
        }

        return exprStr;
    }

    wrapString(
        s: string,
        style: 'paren' | 'leftright' | 'big' | 'none'
    ): string {
        if (style === 'none') return s;
        return '(' + s + ')';
    }

    emitSymbol(expr: Expression, def?: IndexedLatexDictionaryEntry): string {
        const head: Expression = getFunctionHead(expr);
        if (!head) {
            console.assert(typeof expr === 'string' || isSymbolObject(expr));
            // It's a symbol
            if (typeof def?.emit === 'string') {
                return def.emit;
            }

            const name = getSymbolName(expr);

            switch (getSymbolStyle(expr, this.level)) {
                case 'upright':
                    return '\\operatorname{' + name + '}';

                //            case 'asis':
                default:
                    return name;
            }
        }
        //
        // It's a function
        //
        const args = getArgs(expr);
        if (!def) {
            // We don't know anything about this function
            if (
                typeof head === 'string' &&
                head.length > 0 &&
                head[0] === '\\'
            ) {
                //
                // 1. Is is an unknown latex command?
                //
                // This looks like a Latex command. Emit
                // the arguments as Latex arguments
                let result: string = head;
                for (const arg of args) {
                    result += '{' + this.emit(arg) + '}';
                }
                return result;
            }

            //
            // 2. Is is an unknown function call?
            //
            // It's a function we don't know.
            // Maybe it came from `promoteUnknownSymbols`
            // Emit the arguments as function arguments
            return this.emit(head) + this.emit([GROUP, ...args]);
        }

        if (def.requiredLatexArg) {
            //
            // 3. Is it a known Latex command?
            //
            // This looks like a Latex command. Emit
            // the arguments as Latex arguments
            let optionalArg = '';
            let requiredArg = '';
            let i = 0;
            while (i < def.requiredLatexArg) {
                requiredArg += '{' + this.emit(args[1 + i++]) + '}';
            }
            while (
                i <
                Math.min(
                    args.length,
                    def.optionalLatexArg + def.requiredLatexArg
                )
            ) {
                const optValue = this.emit(args[1 + i++]);
                if (optValue) {
                    optionalArg += '[' + optValue + ']';
                }
            }
            return (def.emit as string) + (optionalArg + requiredArg);
        }

        //
        // 4. Is it a known function?
        //
        const style = getApplyFunctionStyle(expr, this.level);
        if (style === 'none') {
            return (
                (def.emit as string) + joinLatex(args.map((x) => this.emit(x)))
            );
        }
        return (def.emit as string) + this.emit([GROUP, ...args]);
    }

    emit(expr: Expression | null): Latex {
        if (expr === null) return '';

        this.level += 1;

        //
        // 1. Is it a number
        //
        let result = emitNumber(this.options, expr);
        if (result) {
            this.level -= 1;
            return result;
        }

        //
        // 2. Is it a named symbol (Latex token, function, constant, variable or
        //    operator)
        //
        const name = getSymbolName(expr);
        if (name === '<$>') {
            result = '$';
        } else if (name === '<$$>') {
            result = '$$';
        } else if (name === '<{>') {
            result = '{';
        } else if (name === '<}>') {
            result = '}';
        } else if (name === '<space>') {
            result = ' ';
        } else if (name && (name[0] === '\\' || name[0] === '#')) {
            //
            // 2.1 Latex command
            //
            // possibly with arguments.
            // This can happen if we encountered an unrecognized Latex command
            // during parsing, e.g. "\foo{x + 1}"

            this.level -= 1;

            const args = getArgs(expr);
            if (args.length === 0) return name;
            return (
                name +
                '{' +
                args
                    .map((x) => this.emit(x))
                    .filter((x) => !!x)
                    .join('}{') +
                '}'
            );
        } else if (name) {
            // It's a symbol
            const def = this.dictionary.name.get(getSymbolName(expr));
            result = this.emitSymbol(expr, def);
        } else {
            //
            // 2.2 A function, operator or matchfix operator
            //
            const def = this.dictionary.name.get(getFunctionName(expr));
            if (def) {
                // If there is a custom emitter function, use it.
                if (typeof def.emit === 'function') {
                    result = def.emit(this, expr);
                } else {
                    if (
                        !result &&
                        (typeof def.precedence !== 'undefined' ||
                            def.trigger.superfix ||
                            def.trigger.subfix)
                    ) {
                        result = emitOperator(this, expr, def);
                    }
                    if (!result && def.trigger.matchfix) {
                        result = emitMatchfix(this, expr, def);
                    }
                    if (!result && def.trigger.symbol) {
                        result = this.emitSymbol(expr, def);
                    }
                }
            } else if (Array.isArray(expr)) {
                // It's a function, but without definition.
                // It could be a [['derive', "f"], x]
                result = this.emitSymbol(expr);
            } else {
                //  This doesn't look like a symbol, or a function,
                // or anything we were expecting.
                // This is an invalid expression, for example an
                // object literal with no know fields, or an invalid number:
                // `{num: 'not a number'}`
                // `{foo: 'not an expression}`

                this.onError({
                    code: 'syntax-error',
                    arg: JSON.stringify(expr),
                });
            }
        }
        this.level -= 1;
        return result;
    }
}
