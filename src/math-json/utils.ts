import {
    Expression,
    MathJsonRealNumber,
    MathJsonSymbol,
    MathJsonFunction,
    FunctionDefinition,
    SymbolDefinition,
    ErrorCode,
    Dictionary,
} from './public';
import { ErrorListener } from '../public/core';
import {
    findSymbolInDictionary,
    NEGATE,
    POWER,
    DIVIDE,
    MULTIPLY,
    ADD,
    SUBTRACT,
    DERIVATIVE,
    INVERSE_FUNCTION,
    LATEX,
    SQRT,
    ROOT,
    GROUP,
    LIST,
    MISSING,
    PRIME,
    IDENTITY,
    SEQUENCE,
    NOTHING,
} from './dictionary/dictionary';

export function isNumberObject(expr: Expression): expr is MathJsonRealNumber {
    return Boolean(expr) && typeof expr === 'object' && 'num' in expr;
}

export function isSymbolObject(expr: Expression): expr is MathJsonSymbol {
    return Boolean(expr) && typeof expr === 'object' && 'sym' in expr;
}
export function isFunctionObject(expr: Expression): expr is MathJsonFunction {
    return Boolean(expr) && typeof expr === 'object' && 'fn' in expr;
}

export function getNumberValue(expr: Expression): number {
    if (typeof expr === 'number') {
        return expr;
    }
    if (isNumberObject(expr)) {
        return parseFloat(expr.num);
    }
    if (getFunctionName(expr) === NEGATE) {
        return -getNumberValue(getArg(expr, 1));
    }
    return NaN;
}

/**
 * Return a rational (numer over denom) representation of the expression,
 * if possibe, `[NaN, NaN]` otherwise.
 *
 * The expression can be:
 * - a number
 * - ["power", d, -1]
 * - ["power", n, 1]
 * - ["divide", n, d]
 * - ["multiply", n, ["power", d, -1]]
 */
export function getRationalValue(expr: Expression): [number, number] {
    if (typeof expr === 'number') return [expr, 1];
    if (isNumberObject(expr)) return [getNumberValue(expr), 1];
    if (isAtomic(expr)) return [NaN, NaN];
    const head = getFunctionName(expr);

    if (head === POWER) {
        const exponent = getNumberValue(getArg(expr, 2));
        if (exponent === 1) {
            return [getNumberValue(getArg(expr, 1)), 1];
        } else if (exponent === -1) {
            return [1, getNumberValue(getArg(expr, 1))];
        }
        return [NaN, NaN];
    }

    if (head === DIVIDE) {
        return [
            getNumberValue(getArg(expr, 1)),
            getNumberValue(getArg(expr, 2)),
        ];
    }

    if (
        head === MULTIPLY &&
        getFunctionName(getArg(expr, 2)) === POWER &&
        getNumberValue(getArg(getArg(expr, 2), 2)) === -1
    ) {
        return [
            getNumberValue(getArg(expr, 1)),
            getNumberValue(getArg(getArg(expr, 2), 1)),
        ];
    }

    return [NaN, NaN];
}

/**
 * The head of an expression can either be a string or an expression.
 *
 * Examples:
 * `["negate", 5]`  -> "negate"
 * `[["prime", "f"], "x"] -> `["prime", "f"]
 */
export function getFunctionHead(expr: Expression): Expression {
    if (Array.isArray(expr)) {
        return expr[0];
    }
    if (isFunctionObject(expr)) {
        return expr.fn[0];
    }
    return null;
}

/**
 * True if the expression is a number or a symbol
 */
export function isAtomic(expr: Expression): boolean {
    // return (
    //     typeof expr === 'string' ||
    //     typeof expr === 'number' ||
    //     (typeof expr === 'object' && ('num' in expr || 'sym' in expr))
    // );
    return (
        expr === null ||
        (!Array.isArray(expr) && (typeof expr !== 'object' || !('fn' in expr)))
    );
}

export function getFunctionName(
    expr: Expression
):
    | typeof MULTIPLY
    | typeof POWER
    | typeof DIVIDE
    | typeof ADD
    | typeof SUBTRACT
    | typeof NEGATE
    | typeof DERIVATIVE
    | typeof INVERSE_FUNCTION
    | typeof LATEX
    | typeof SQRT
    | typeof ROOT
    | typeof GROUP
    | typeof LIST
    | typeof MISSING
    | typeof PRIME
    | typeof IDENTITY
    | typeof NOTHING
    | typeof SEQUENCE
    | typeof PRIME
    | ''
    | string {
    const head = getFunctionHead(expr);
    if (typeof head === 'string') return head as any;
    return '';
}

export function getSymbolName(expr: Expression): string | null {
    if (typeof expr === 'string') {
        return expr;
    }
    if (isSymbolObject(expr)) {
        return expr.sym;
    }
    return null;
}

/**
 * Return the arguments
 */
export function getArgs(expr: Expression): (Expression | null)[] {
    if (Array.isArray(expr)) {
        return expr.slice(1);
    }
    if (isFunctionObject(expr)) {
        return expr.fn.slice(1);
    }
    return [];
}

export function mapArgs(
    expr: Expression,
    fn: (x: Expression) => Expression
): Expression {
    if (Array.isArray(expr)) {
        return expr.map((x, i) => (i === 0 ? x : fn(x)));
    }
    if (isFunctionObject(expr)) {
        return expr.fn.map((x, i) => (i === 0 ? x : fn(x)));
    }
    return expr;
}

export function getArg(expr: Expression, n: number): Expression | null {
    if (Array.isArray(expr)) {
        return expr[n];
    }
    if (isFunctionObject(expr)) {
        return expr.fn[n];
    }
    return null;
}
export function getArgCount(expr: Expression): number {
    if (Array.isArray(expr)) {
        return Math.max(0, expr.length - 1);
    }
    if (isFunctionObject(expr)) {
        return Math.max(0, expr.fn.length - 1);
    }
    return 0;
}

export function normalizeDefinition(
    name: string,
    def: FunctionDefinition | SymbolDefinition,
    onError: ErrorListener<ErrorCode>
): Required<FunctionDefinition> | Required<SymbolDefinition> {
    if (!/[A-Za-z][A-Za-z0-9-]*/.test(name) && name.length !== 1) {
        onError({ code: 'invalid-name', arg: name });
    }

    if ('isConstant' in def) {
        return {
            domain: 'any',
            isConstant: false,
            ...def,
        } as Required<SymbolDefinition>;
    }

    const result: Required<FunctionDefinition> = {
        optionalLatexArg: 0,
        requiredLatexArg: 0,

        domain: 'any',
        isListable: false,
        isAssociative: false,
        isCommutative: false,
        isIdempotent: false,
        sequenceHold: false,
        isPure: false,
        hold: 'none',
        argCount: def.isAssociative ?? false ? Infinity : 0,
        argDomain: [],
        ...def,
    } as Required<FunctionDefinition>;
    if (
        result.isAssociative &&
        typeof def.argCount !== 'undefined' &&
        isFinite(Number(def.argCount))
    ) {
        onError({
            code: 'associative-function-has-too-few-arguments',
            arg: name,
        });
        result.argCount = Infinity;
    }
    if (result.isCommutative && result.argCount <= 1) {
        onError({
            code: 'commutative-function-has-too-few-arguments',
            arg: name,
        });
    }
    if (result.isListable && result.argCount === 0) {
        onError({
            code: 'listable-function-has-too-few-arguments',
            arg: name,
        });
    }
    if (result.hold === 'first' && result.argCount === 0) {
        onError({
            code: 'hold-first-function-has-too-few-arguments',
            arg: name,
        });
    }
    if (result.hold === 'rest' && result.argCount <= 1) {
        onError({
            code: 'hold-rest-function-has-too-few-arguments',
            arg: name,
        });
    }
    return result;
}

export function appendLatex(src: string, s: string): string {
    if (!s) return src;

    // If the source end in a Latex command,
    // and the appended string begins with a letter
    if (/\\[a-zA-Z]+\*?$/.test(src) && /[a-zA-Z*]/.test(s[0])) {
        // Add a space between them
        return src + ' ' + s;
    }
    // No space needed
    return src + s;
}

/**
 * Replace '#1', '#2' in the latex template stings with the corresponding
 * values from `replacement`, in a Latex syntax safe manner (i.e. inserting spaces when needed)
 */
export function replaceLatex(template: string, replacement: string[]): string {
    console.assert(typeof template === 'string');
    console.assert(template.length > 0);
    let result = template;
    for (let i = 0; i < replacement.length; i++) {
        let s = replacement[i] ?? '';
        if (/[a-zA-Z*]/.test(s[0])) {
            const m = result.match(
                new RegExp('(.*)#' + Number(i + 1).toString())
            );
            if (m && /\\[a-zA-Z*]+/.test(m[1])) {
                s = ' ' + s;
            }
        }
        result = result.replace('#' + Number(i + 1).toString(), s);
    }

    return result;
}

/**
 * Return the nth term in expr.
 * If expr is not a "add" function, returns null.
 */
// export function nth(_expr: Expression, _vars?: string[]): Expression {
//     return null;
// }

export function varsRecursive(
    dic: Dictionary,
    vars: Set<string>,
    expr: Expression
): void {
    const args = getArgs(expr);
    if (args.length > 0) {
        args.forEach((x) => varsRecursive(dic, vars, x));
    } else {
        // It has a name, but no arguments. It's a symbol
        const name = getSymbolName(expr);
        if (name && !vars.has(name)) {
            const def = findSymbolInDictionary(dic, name);
            if (!def || !def.isConstant) {
                // It's not in the dictionary, or it's in the dictionary
                // but not as a constant -> it's a variable
                vars.add(name);
            }
        }
    }
}

/**
 * Return an array of the non-constant symbols in the expression.
 */
export function vars(dic: Dictionary, expr: Expression): Set<string> {
    const result = new Set<string>();
    varsRecursive(dic, result, expr);
    return result;
}

/**
 * Return the coefficient of the expression, assuming vars are variables.
 */
export function coef(_expr: Expression, _vars: string[]): Expression | null {
    return null;
}
