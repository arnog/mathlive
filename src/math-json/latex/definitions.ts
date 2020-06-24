import { ErrorListener } from '../../public/core';
import { DictionaryCategory, Expression, ErrorCode } from '../public';
import {
    LatexDictionary,
    Emitter,
    Scanner,
    Latex,
    LatexToken,
    ParserFunction,
    EmitterFunction,
} from './public';
import {
    getArgCount,
    getFunctionName,
    getArg,
    getNumberValue,
    getArgs,
    isNumberObject,
    getRationalValue,
    getFunctionHead,
} from '../utils';
import { applyNegate } from '../forms';
import { tokensToString, joinLatex } from '../../core/modes';
import { getFractionStyle, getGroupStyle, getRootStyle } from './emit-style';
import {
    MULTIPLY,
    POWER,
    NEGATE,
    ROOT,
    SQRT,
    SUBTRACT,
    ADD,
    INVERSE_FUNCTION,
    DERIVATIVE,
    DIVIDE,
    LATEX,
    GROUP,
    LIST,
    MISSING,
    PRIME,
    COMPLEX_INFINITY,
    EXPONENTIAL_E,
    IMAGINARY_I,
    PI,
    NOTHING,
} from '../dictionary';

export type IndexedLatexDictionaryEntry = {
    name: string;
    trigger: {
        symbol?: LatexToken | LatexToken[];
        matchfix?: LatexToken | LatexToken[];
        infix?: LatexToken | LatexToken[];
        prefix?: LatexToken | LatexToken[];
        postfix?: LatexToken | LatexToken[];
        superfix?: LatexToken | LatexToken[];
        subfix?: LatexToken | LatexToken[];
    };
    parse: Expression | ParserFunction;
    emit: EmitterFunction | Latex;
    associativity?: 'right' | 'left' | 'non' | 'both';
    precedence?: number;
    arguments?: 'group' | 'implicit' | '';
    optionalLatexArg?: number;
    requiredLatexArg?: number;
    separator?: Latex;
    closeFence?: Latex;
};

export type IndexedLatexDictionary = {
    lookahead: number;
    name: Map<string, IndexedLatexDictionaryEntry>;
    prefix: (Map<Latex, IndexedLatexDictionaryEntry> | null)[];
    infix: (Map<Latex, IndexedLatexDictionaryEntry> | null)[];
    postfix: (Map<Latex, IndexedLatexDictionaryEntry> | null)[];
    matchfix: (Map<Latex, IndexedLatexDictionaryEntry> | null)[];
    superfix: (Map<Latex, IndexedLatexDictionaryEntry> | null)[];
    subfix: (Map<Latex, IndexedLatexDictionaryEntry> | null)[];
    symbol: (Map<Latex, IndexedLatexDictionaryEntry> | null)[];
    environment: Map<string, IndexedLatexDictionaryEntry>;
};

/**
 * If expression is a product, collect all the terms with a
 * negative exponents in the denominator, and all the terms
 * with a positive exponent (or no exponent) in the numerator.
 */
function numeratorDenominator(
    expr: Expression
): [Expression[] | null, Expression[] | null] {
    if (getFunctionName(expr) !== MULTIPLY) return [null, null];
    const numerator: Expression[] = [];
    const denominator: Expression[] = [];
    const args = getArgs(expr);
    for (const arg of args) {
        if (getFunctionName(arg) === POWER) {
            if (getFunctionName(getArg(arg, 2)) === NEGATE) {
                denominator.push([
                    POWER,
                    getArg(arg, 1),
                    getArg(getArg(arg, 2), 1),
                ]);
            } else {
                const exponentVal = getNumberValue(getArg(arg, 2));
                if (exponentVal === -1) {
                    denominator.push(getArg(arg, 1));
                } else if (exponentVal < 0) {
                    denominator.push([
                        POWER,
                        getArg(arg, 1),
                        applyNegate(getArg(arg, 2)),
                    ]);
                } else {
                    numerator.push(arg);
                }
            }
        } else {
            numerator.push(arg);
        }
    }
    return [numerator, denominator];
}

function triggerLength(trigger: LatexToken | LatexToken[]): number {
    if (Array.isArray(trigger)) return trigger.length;
    return 1;
}

function triggerString(trigger: LatexToken | LatexToken[]) {
    if (Array.isArray(trigger)) return tokensToString(trigger);
    return trigger;
}

export function indexLatexDictionary(
    dic: LatexDictionary,
    onError: ErrorListener<ErrorCode>
): IndexedLatexDictionary {
    const result = {
        lookahead: 1,
        name: new Map(),
        prefix: [],
        infix: [],
        postfix: [],
        matchfix: [],
        superfix: [],
        subfix: [],
        symbol: [],
        environment: new Map(),
    };

    for (const x of dic) {
        const record = x;
        if (!record.parse) {
            // By default, when a latex string triggers, the generated
            // output is the name of this record, i.e. MULTIPLY
            record.parse = record.name;
        }
        // If the trigger is a string, it's a shortcut for a symbol
        if (typeof record.trigger === 'string') {
            record.trigger = { symbol: record.trigger };
        }
        if (typeof record.emit === 'string') {
            if (record.trigger?.symbol) {
                if (/#[0-9]/.test(record.emit)) {
                    onError({ code: 'unexpected-argument', arg: record.name });
                }
            }
        }
        if (!record.emit) {
            // By default, when latex is emitted for this record,
            // it is the same as the trigger (note there could be multiple
            // triggers, so we just pick one)
            if (record.trigger?.postfix) {
                record.emit = '#1' + triggerString(record.trigger.postfix);
            } else if (record.trigger?.prefix) {
                record.emit = record.trigger.prefix + '#1';
            } else if (record.trigger?.infix) {
                record.emit = '#1' + triggerString(record.trigger.infix) + '#2';
            } else if (record.trigger?.symbol) {
                record.emit = triggerString(record.trigger.symbol);
            } else if (record.trigger?.superfix) {
                record.emit =
                    '#1^{' + triggerString(record.trigger?.superfix) + '}';
            } else if (record.trigger?.subfix) {
                record.emit =
                    '#1_{' + triggerString(record.trigger?.subfix) + '}';
            } else {
                record.emit = '';
            }
        }
        if (record.trigger?.infix) {
            if (!record.precedence) {
                onError({
                    code: 'syntax-error',
                    arg: 'Infix operators require a precedence',
                });
            }
            if (!record.associativity) {
                record.associativity = 'non';
            }
        }
        if (record.trigger?.symbol) {
            record.arguments = record.arguments ?? '';
            record.optionalLatexArg = record.optionalLatexArg ?? 0;
            record.requiredLatexArg = record.requiredLatexArg ?? 0;
        }
        if (record.trigger?.matchfix) {
            if (record.parse !== 'function' && !record.closeFence) {
                onError({
                    code: 'syntax-error',
                    arg:
                        'Matchfix operators require a close fence or a custom parse function',
                });
            }
        }

        if (record.trigger) {
            [
                'infix',
                'prefix',
                'postfix',
                'symbol',
                'matchfix',
                'superfix',
                'subfix',
            ].forEach((x) => {
                const n = triggerLength(record.trigger[x]);
                result.lookahead = Math.max(result.lookahead, n);
                if (!result[x][n]) {
                    result[x][n] = new Map<
                        string,
                        IndexedLatexDictionaryEntry
                    >();
                }
                result[x][n].set(triggerString(record.trigger[x]), record);
            });
            if (record.trigger.environment) {
                result.environment.set(record.trigger.environment, record);
            }
        }
        if (record.name) {
            result.name.set(triggerString(record.name), record);
        }
        if (!record.trigger && !record.name) {
            // A trigger OR a name is required.
            // The trigger maps latex -> json
            // The name maps json -> latex
            onError({
                code: 'syntax-error',
                arg: 'Need at least a trigger or a name',
            });
        }
    }

    return result;
}

export function getDefaultLatexDictionary(
    domain: DictionaryCategory | 'all' = 'all'
): LatexDictionary {
    let result: LatexDictionary;
    if (domain === 'all') {
        result = [];
        Object.keys(DEFAULT_LATEX_DICTIONARY).forEach((x) => {
            result = [...result, ...DEFAULT_LATEX_DICTIONARY[x]];
        });
    } else {
        result = [...DEFAULT_LATEX_DICTIONARY[domain]];
    }
    return result;
}

function parseRoot(
    lhs: Expression,
    scanner: Scanner,
    _minPrec: number,
    _latex: string
): [Expression | null, Expression | null] {
    const degree = scanner.matchOptionalLatexArgument();
    const base = scanner.matchRequiredLatexArgument();
    if (base === null) return [lhs, [SQRT]];
    if (degree !== null) return [lhs, [ROOT, base ?? NOTHING, degree]];
    return [lhs, [SQRT, base]];
}

function parseMinusSign(
    lhs: Expression,
    scanner: Scanner,
    minPrec: number,
    _latex: string
): [Expression | null, Expression | null] {
    if (275 < minPrec) return [lhs, null];
    const rhs = scanner.matchExpression(!lhs ? 400 : 276);
    if (!rhs) return [null, lhs];
    if (!lhs) return [null, [NEGATE, rhs]];
    return [null, [SUBTRACT, lhs, rhs]];
}

function parsePlusSign(
    lhs: Expression,
    scanner: Scanner,
    minPrec: number,
    _latex: string
): [Expression | null, Expression | null] {
    if (275 < minPrec) return [lhs, null];
    const rhs = scanner.matchExpression(!lhs ? 400 : 275);
    if (!rhs) return [lhs, null];
    if (!lhs) return [null, rhs];
    return scanner.applyOperator(ADD, lhs, rhs);
}

/**
 * Trigonometric functions have some special conventions that require a
 * custom parser: they can be followed by a "-1" superscript indicating
 * that the inversion function should be used, i.e. "sin^{-1}" for "arcsin".
 *
 */
function parseTrig(
    _lhs: Expression,
    scanner: Scanner,
    _minPrec: number,
    latex: string
): [Expression | null, Expression | null] {
    let isInverse = false;

    let primeLevel = 0;

    scanner.skipSpace();
    if (scanner.match('^')) {
        scanner.skipSpace();
        if (scanner.match('<{>')) {
            scanner.skipSpace();
            // There's a superscript..., parse it.
            if (scanner.match('-') && scanner.match('1')) {
                isInverse = true;
            }
            do {
                if (scanner.match('\\doubleprime')) {
                    primeLevel += 2;
                }
                if (scanner.match('\\prime')) {
                    primeLevel += 1;
                }
                if (scanner.match("'")) {
                    primeLevel += 1;
                }
            } while (!scanner.match('<}>') && !scanner.atEnd());
        }
        let done = false;
        while (!done) {
            scanner.skipSpace();
            if (scanner.match('\\doubleprime')) {
                primeLevel += 2;
            } else if (scanner.match('\\prime')) {
                primeLevel += 1;
            } else if (scanner.match("'")) {
                primeLevel += 1;
            } else {
                done = true;
            }
        }
    }

    // Note: names as per NIST-DLMF
    let head =
        {
            '\\arcsin': 'arcsin',
            '\\arccos': 'arccos',
            '\\arctan': 'arctan',
            '\\arctg': 'arctan',
            '\\arcctg': 'arctan',
            '\\arcsec': 'arcsec',
            '\\arccsc': ' arccsc',
            '\\arsinh': 'arsinh',
            '\\arcosh': 'arcosh',
            '\\artanh': 'artanh',
            '\\arcsech': 'arcsech',
            '\\arccsch': 'arcsch',
            // '\\arg',
            '\\ch': 'cosh',
            '\\cos': 'cos',
            '\\cosec': 'csc',
            '\\cosh': 'csch',
            '\\cot': 'cot',
            '\\cotg': 'cot',
            '\\coth': 'coth',
            '\\csc': 'csc',
            '\\ctg': 'cot',
            '\\cth': 'coth',
            '\\sec': 'sec',
            '\\sin': 'sin',
            '\\sinh': 'sinh',
            '\\sh': 'sinh',
            '\\tan': 'tan',
            '\\tanh': 'tanh',
            '\\tg': 'tan',
            '\\th': 'tanh',
        }[latex] ?? latex;

    if (isInverse) {
        head = [INVERSE_FUNCTION, head];
    }
    if (primeLevel >= 1) {
        head = [DERIVATIVE, primeLevel, head];
    }

    const args = scanner.matchArguments('implicit');
    if (args === null) {
        return [null, head];
    }
    return [null, [head, ...args]];
}

export function emitGroup(emitter: Emitter, expr: Expression): string {
    let sep = '';
    let argString = '';
    for (const arg of getArgs(expr)) {
        if (arg) {
            argString += sep + emitter.emit(arg);
            sep = ', ';
        }
    }

    return emitter.wrapString(argString, getGroupStyle(expr, emitter.level));
}

function emitAdd(emitter: Emitter, expr: Expression): string {
    // "add" doesn't increase the "level" for styling purposes
    // so, preventatively decrease it now.
    emitter.level -= 1;

    const name = getFunctionName(expr);
    let result = '';
    let arg = getArg(expr, 1);
    let argWasNumber = !isNaN(getNumberValue(arg));
    if (name === NEGATE) {
        result = '-' + [emitter.wrap(arg, 276)];
    } else if (name === ADD) {
        result = emitter.emit(arg);
        const last = getArgCount(expr) + 1;
        for (let i = 2; i < last; i++) {
            arg = getArg(expr, i);
            const val = getNumberValue(arg);
            const argIsNumber = !isNaN(val);
            if (arg !== null) {
                const [numer, denom] = getRationalValue(arg);
                if (
                    argWasNumber &&
                    isFinite(numer) &&
                    isFinite(denom) &&
                    denom !== 1
                ) {
                    // Don't include the '+' sign, it's a rational, use 'invisible plus'
                    result += emitter.options.invisiblePlus + emitter.emit(arg);
                } else if (val < 0) {
                    // Don't include the minus sign, it will be emitted for the arg
                    result += emitter.emit(arg);
                } else if (getFunctionName(arg) === NEGATE) {
                    result += emitter.wrap(arg, 275);
                } else {
                    const term = emitter.wrap(arg, 275);
                    if (term[0] === '-' || term[0] === '+') {
                        result += term;
                    } else {
                        result = result + '+' + term;
                    }
                }
            }
            argWasNumber = argIsNumber;
        }
    } else if (name === SUBTRACT) {
        const arg2 = getArg(expr, 2);
        if (arg2 !== null) {
            result = emitter.wrap(arg, 275) + '-' + emitter.wrap(arg2, 275);
        } else {
            result = emitter.wrap(arg, 275);
        }
    }

    // Restore the level
    emitter.level += 1;

    return result;
}

function emitMultiply(emitter: Emitter, expr: Expression | null): string {
    if (expr === null) return '';

    // "multiply" doesn't increase the "level" for styling purposes
    // so, preventatively decrease it now.
    emitter.level -= 1;

    let result = '';

    //
    // Is it a fraction?
    // (i.e. does it have a denominator, i.e. some factors with a negative power)
    //
    const [numer, denom] = numeratorDenominator(expr);
    if (numer && denom && denom.length > 0) {
        if (denom.length === 1 && denom[0] === 1) {
            if (numer.length === 0) {
                result = '1';
            } else if (numer.length === 1) {
                result = emitter.emit(numer[0]);
            } else {
                result = emitMultiply(emitter, [MULTIPLY, ...numer]);
            }
        } else {
            result = emitter.emit([
                DIVIDE,
                numer.length === 1 ? numer[0] : [MULTIPLY, ...numer],
                denom.length === 1 ? denom[0] : [MULTIPLY, ...denom],
            ]);
        }
    }
    if (result) {
        // Restore the level
        emitter.level += 1;
        return result;
    }

    let isNegative = false;
    let arg: Expression | null = null;
    const count = getArgCount(expr) + 1;
    for (let i = 1; i < count; i++) {
        arg = getArg(expr, i);
        if (arg !== null) {
            let term: string;
            //
            // 1. Should the terms be separated by an explicit MULTIPLY?
            //
            if (typeof arg === 'number' || isNumberObject(arg)) {
                term = emitter.emit(arg);
                if (term[0] === '-') {
                    term = term.slice(1);
                    isNegative = !isNegative;
                }
                if (term !== '1') {
                    if (!result) {
                        // First term
                        result = term;
                    } else {
                        result = result
                            ? joinLatex([
                                  result,
                                  emitter.options.multiply,
                                  term,
                              ])
                            : term;
                    }
                }
            } else if (
                getFunctionName(arg) === POWER &&
                !isNaN(getNumberValue(getArg(arg, 1)))
            ) {
                // It's a power and the base is a number...
                // add a multiply...
                result = result
                    ? joinLatex([
                          result,
                          emitter.options.multiply,
                          emitter.emit(arg),
                      ])
                    : emitter.emit(arg);
            } else {
                if (getFunctionName(arg) === NEGATE) {
                    arg = getArg(arg, 1);
                    isNegative = !isNegative;
                }
                // 2.1 Wrap the term if necessary
                // (if it's an operator of precedence less than 390)
                term = emitter.wrap(arg, 390);

                // 2.2. The terms can be separated by an invisible multiply.
                if (!result) {
                    // First term
                    result = term;
                } else {
                    // Not first term, use invisible multiply
                    if (!emitter.options.invisibleMultiply) {
                        // Replace, joining the terms correctly
                        // i.e. inserting a space between '\pi' and 'x'
                        result = joinLatex([result, term]);
                    } else {
                        result = joinLatex([
                            result,
                            emitter.options.invisibleMultiply,
                            term,
                        ]);
                    }
                }
            }
        }
    }

    // Restore the level
    emitter.level += 1;

    return isNegative ? '-' + result : result;
}

function emitFraction(emitter: Emitter, expr: Expression | null): string {
    console.assert(getFunctionName(expr) === DIVIDE);
    if (getArgCount(expr) === 1) return emitter.emit(getArg(expr, 1));
    const style = getFractionStyle(expr, emitter.level);
    if (style === 'inline-solidus' || style === 'nice-solidus') {
        const numerStr = emitter.wrapShort(getArg(expr, 1));
        const denomStr = emitter.wrapShort(getArg(expr, 2));

        if (style === 'nice-solidus') {
            return `^{${numerStr}}\\!\\!/\\!_{${denomStr}}`;
        }
        return `${numerStr}\\/${denomStr}`;
    } else if (style === 'reciprocal') {
        return (
            emitter.wrap(getArg(expr, 1)) +
            emitter.wrap(getArg(expr, 2)) +
            '^{-1}'
        );
    } else if (style === 'factor') {
        return (
            '\\frac{1}{' +
            emitter.emit(getArg(expr, 2)) +
            '}' +
            emitter.wrap(getArg(expr, 1))
        );
    }
    // Quotient (default)
    return (
        '\\frac{' +
        emitter.emit(getArg(expr, 1)) +
        '}{' +
        emitter.emit(getArg(expr, 2)) +
        '}'
    );
}

function emitLatex(emitter: Emitter, expr: Expression | null): string {
    if (expr === null) return '';
    const head = getFunctionHead(expr);
    if (head) {
        const args = getArgs(expr);
        if (head === LATEX) {
            return args.map((x) => emitLatex(emitter, x)).join('');
        }
        if (args.length === 0) return emitter.emit(head);
        return (
            emitter.emit(head) +
            args.map((x) => '{' + emitter.emit(x) + '}').join('')
        );
    }
    return emitter.emit(expr);
}

function emitRoot(
    emitter: Emitter,
    style: 'radical' | 'quotient' | 'solidus',
    base: Expression,
    degree: Expression
): string {
    degree = degree ?? 2;
    if (style === 'solidus') {
        return emitter.wrapShort(base) + '^{1\\/' + emitter.emit(degree) + '}';
    } else if (style === 'quotient') {
        return (
            emitter.wrapShort(base) +
            '^{\\frac{1}{' +
            emitter.emit(degree) +
            '}}'
        );
    }

    const degreeValue = getNumberValue(degree);
    if (degreeValue === 2) {
        return '\\sqrt{' + emitter.emit(base) + '}';
    }

    // It's the n-th root
    return '\\sqrt[' + emitter.emit(degree) + ']{' + emitter.emit(base) + '}';
}

function emitPower(emitter: Emitter, expr: Expression | null): string {
    const arg1 = getArg(expr, 1);
    const arg2 = getArg(expr, 2);
    if (arg2 === null) {
        return emitter.emit(arg1);
    }
    if (arg1 === null) {
        return '';
    }
    const name = getFunctionName(expr);
    if (name === SQRT || name === ROOT) {
        const style = getRootStyle(expr, emitter.level);
        return emitRoot(emitter, style, getArg(expr, 1), getArg(expr, 2));
    }
    const val2 = getNumberValue(arg2);
    if (val2 === -1) {
        return emitter.emit([DIVIDE, '1', arg1]);
    } else if (val2 < 0) {
        return emitter.emit([DIVIDE, '1', [POWER, arg1, -val2]]);
    } else if (getFunctionName(arg2) === DIVIDE) {
        if (getNumberValue(getArg(arg2, 1)) === 1) {
            // It's x^{1/n} -> it's a root
            const style = getRootStyle(expr, emitter.level);
            return emitRoot(emitter, style, arg1, getArg(arg2, 2));
        }
    } else if (getFunctionName(arg2) === POWER) {
        if (getNumberValue(getArg(arg2, 2)) === -1) {
            // It's x^{n^-1} -> it's a root
            const style = getRootStyle(expr, emitter.level);
            return emitRoot(emitter, style, arg1, getArg(arg2, 1));
        }
    }
    return emitter.wrapShort(arg1) + '^{' + emitter.emit(arg2) + '}';
}

// left-operators, supfix/subfix:
// subscript
// sub-plus     super-plus
// sub-minus    super-minus
// sub-star     super-star
//              super-dagger
// over-bar     under-bar
// over-vector
// over-tilde
// over-hat
// over-dot
// overscript   underscript

// matchfix:
// angle-brack
// floor
// ceiling

// infix operators:
// ->   rule
// :>   rule-delayed
// ==   eq
// !=   ne
// https://reference.wolfram.com/language/tutorial/OperatorInputForms.html

const DEFAULT_LATEX_DICTIONARY: {
    [category in DictionaryCategory]?: LatexDictionary;
} = {
    core: [
        { name: LATEX, emit: emitLatex },
        {
            name: GROUP,
            trigger: { matchfix: '(' },
            emit: emitGroup,
            separator: ',',
            closeFence: ')',
        },
        {
            name: LIST,
            trigger: { matchfix: '\\lbrack' },
            separator: ',',
            closeFence: '\\rbrack',
        },
        {
            name: 'set',
            trigger: { matchfix: '\\lbrace' },
            separator: ',',
            closeFence: '\\rbrace',
        },
        {
            name: MISSING,
            trigger: '\\placeholder',
            emit: '\\placeholder{}',
            requiredLatexArg: 1,
        },
        {
            name: 'superplus',
            trigger: { superfix: '+' },
        },
        {
            name: 'subplus',
            trigger: { subfix: '+' },
        },
        {
            name: 'superminus',
            trigger: { superfix: '-' },
        },
        {
            name: 'subminus',
            trigger: { subfix: '-' },
        },
        {
            name: 'superstar',
            trigger: { superfix: '*' },
        },
        {
            name: 'superstar',
            trigger: { superfix: '\\star' },
        },
        {
            name: 'substar',
            trigger: { subfix: '*' },
        },
        {
            name: 'substar',
            trigger: { subfix: '\\star' },
        },
        {
            name: 'superdagger',
            trigger: { superfix: '\\dagger' },
        },
        {
            name: 'superdagger',
            trigger: { superfix: '\\dag' },
        },
        {
            name: PRIME,
            trigger: { superfix: '\\prime' },
            arguments: 'group',
        },
        {
            // name: 'prime',
            trigger: { superfix: '\\doubleprime' },
            parse: (lhs) => {
                return [null, [PRIME, lhs, 2]];
            },
            arguments: 'group',
        },
        {
            name: INVERSE_FUNCTION,
            emit: (emitter: Emitter, expr: Expression): string => {
                return emitter.emit(getArg(expr, 1)) + '^{-1}';
            },
        },
        {
            name: DERIVATIVE,
            trigger: 'D',
            parse: (lhs, _scanner: Scanner): [Expression, Expression] => {
                return [lhs, [DERIVATIVE, 1]];
            },
            emit: (emitter: Emitter, expr: Expression): string => {
                const degree = getNumberValue(getArg(expr, 1));
                if (!isFinite(degree)) return '';
                const base = emitter.emit(getArg(expr, 2));
                if (degree === 1) {
                    return base + '^{\\prime}';
                } else if (degree === 2) {
                    return base + '^{\\doubleprime}';
                }
                return base + '^{(' + Number(degree).toString() + ')}';
            },
        },
        {
            name: 'piecewise',
            trigger: { environment: 'cases' },
            parse: (_lhs, scanner: Scanner): [Expression, Expression] => {
                return [null, ['piecewise', scanner.matchTabular()]];
            },
            emit: (emitter: Emitter, expr: Expression): string => {
                if (getFunctionName(getArg(expr, 1)) !== LIST) return '';
                const rows = getArgs(getArg(expr, 1));
                let body = '';
                let rowSep = '';
                for (const row of rows) {
                    body += rowSep;
                    const arg1 = getArg(row, 1);
                    if (arg1 !== null) {
                        body += emitter.emit(arg1);
                        const arg2 = getArg(row, 2);
                        if (arg2 !== null) body += '&' + emitter.emit(arg2);
                    }
                    rowSep = '\\\\';
                }
                return '\\begin{cases}' + body + '\\end{cases}';
            },
        },
    ],
    arithmetic: [
        { trigger: { symbol: '\\infty' }, parse: { num: 'Infinity' } },
        {
            name: COMPLEX_INFINITY,
            trigger: { symbol: ['\\tilde', '\\infty'] },
            emit: '\\tilde\\infty',
        },
        {
            name: COMPLEX_INFINITY,
            trigger: { symbol: ['\\tilde', '<{>', '\\infty', '<}>'] },
            emit: '\\tilde\\infty',
        },
        { name: PI, trigger: { symbol: '\\pi' } },
        { name: PI, trigger: { symbol: 'π' }, emit: '\\pi' },
        { name: EXPONENTIAL_E, trigger: { symbol: 'e' }, emit: 'e' },
        { name: IMAGINARY_I, trigger: { symbol: 'i' }, emit: '\\imaginaryI' },
        { name: IMAGINARY_I, trigger: { symbol: '\\imaginaryI' } },
        {
            name: ADD,
            trigger: { prefix: '+', infix: '+' },
            parse: parsePlusSign,
            emit: emitAdd,
            associativity: 'both',
            precedence: 275,
        },
        {
            name: NEGATE,
            trigger: { prefix: '-' },
            parse: parseMinusSign,
            associativity: 'left', // prefix are always left-associative
            precedence: 275,
        },
        {
            name: SUBTRACT,
            trigger: { infix: '-' },
            parse: parseMinusSign,
            associativity: 'both',
            precedence: 275,
        },
        {
            name: MULTIPLY,
            trigger: { infix: '\\times' },
            emit: emitMultiply,
            associativity: 'both',
            precedence: 390,
        },
        {
            name: MULTIPLY,
            trigger: { infix: '\\codt' },
            emit: emitMultiply,
            associativity: 'both',
            precedence: 390,
        },
        {
            name: MULTIPLY,
            trigger: { infix: '*' },
            emit: emitMultiply,
            associativity: 'both',
            precedence: 390,
        },
        {
            name: DIVIDE,
            trigger: '\\frac',
            emit: emitFraction,
            requiredLatexArg: 2,
        },
        {
            name: DIVIDE,
            trigger: { infix: '\\/' },
            emit: emitFraction,
            associativity: 'non',
            precedence: 660, // ??? MathML has 265, but it's wrong.
            // It has to be at least higher than multiply
            // e.g. `1/2+3*x` -> `1/2 + 3*x` , not `1/(2+3*x)`
        },
        {
            name: DIVIDE,
            trigger: { infix: '/' },
            emit: emitFraction,
            associativity: 'non',
            precedence: 660,
        },
        {
            name: DIVIDE,
            trigger: { infix: '\\div' },
            emit: emitFraction,
            associativity: 'non',
            precedence: 660, // ??? according to MathML
        },
        {
            name: POWER,
            trigger: { infix: '^' },
            associativity: 'non',
            precedence: 720,
            emit: emitPower,
        },
        {
            name: POWER,
            trigger: { infix: ['*', '*'] },
            associativity: 'non',
            precedence: 720,
            emit: emitPower,
        },
        {
            name: SQRT,
            trigger: '\\sqrt',
            optionalLatexArg: 1,
            requiredLatexArg: 1,
            parse: parseRoot,
            emit: emitPower,
        },
        {
            name: ROOT,
            trigger: '\\sqrt',
            optionalLatexArg: 1,
            requiredLatexArg: 1,
            parse: parseRoot,
        },
        {
            name: 'eq',
            trigger: { infix: '=' },
            associativity: 'right',
            precedence: 260,
        },
        {
            name: 'ne',
            trigger: { infix: '\\ne' },
            associativity: 'right',
            precedence: 255,
        },
        {
            name: 'abs',
            trigger: { matchfix: '|' },
            precedence: 880,
            closeFence: '|',
        },
        {
            name: 'abs',
            trigger: { matchfix: '|' },
            precedence: 880,
            closeFence: '|',
        },
        {
            name: 'factorial',
            trigger: { postfix: '!' },
            precedence: 880,
        },
        {
            name: 'factorial2',
            trigger: { postfix: ['!', '!'] },
            precedence: 880,
        },
    ],
    algebra: [
        {
            name: 'to',
            trigger: { infix: '\\to' },
            precedence: 270, // MathML rightwards arrow
        },
    ],
    physics: [
        {
            name: 'mu-0',
            trigger: { symbol: ['\\mu', '_', '0'] },
        },
    ],
    trigonometry: [
        {
            name: 'arcsin',
            trigger: '\\arcsin',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'arccos',
            trigger: '\\arccos',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'arctan',
            trigger: '\\arctan',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'arctan',
            trigger: '\\arctg',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'arccot',
            trigger: '\\arcctg',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'arcsec',
            trigger: '\\arcsec',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'arccsc',
            trigger: '\\arccsc',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'arsinh',
            trigger: '\\arsinh',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'arcosh',
            trigger: '\\arcosh',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'artanh',
            trigger: '\\artanh',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'arsech',
            trigger: '\\arsech',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'arcsch',
            trigger: '\\arcsch',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'cosh',
            trigger: '\\ch',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'cosec',
            trigger: '\\cosec',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'cosh',
            trigger: '\\cosh',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'cot',
            trigger: '\\cot',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'cot',
            trigger: '\\cotg',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'coth',
            trigger: '\\coth',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'csc',
            trigger: '\\csc',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'cot',
            trigger: '\\ctg',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'coth',
            trigger: '\\cth',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'sec',
            trigger: '\\sec',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'sinh',
            trigger: '\\sinh',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'sinh',
            trigger: '\\sh',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'tan',
            trigger: '\\tan',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'tanh',
            trigger: '\\tanh',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'tan',
            trigger: '\\tg',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'tanh',
            trigger: '\\th',
            arguments: 'implicit',
            parse: parseTrig,
        },

        {
            name: 'cos',
            trigger: '\\cos',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'sin',
            trigger: '\\sin',
            arguments: 'implicit',
            parse: parseTrig,
        },
        {
            name: 'tan',
            trigger: '\\tan',
            arguments: 'implicit',
            parse: parseTrig,
        },
    ],
};
