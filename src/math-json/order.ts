import { Expression, Dictionary } from './public';
import {
    isNumberObject,
    isSymbolObject,
    getFunctionHead,
    getFunctionName,
    getNumberValue,
    getSymbolName,
    getArg,
    getArgs,
} from './utils';
import { findFunctionInDictionary, POWER, MULTIPLY, ADD } from './dictionary';

export function order(a: Expression, b: Expression): number {
    const lexA = getLex(a);
    const lexB = getLex(b);
    if (lexA < lexB) return -1;
    if (lexA > lexB) return 1;

    let valA = getExprValue(a);
    if (isNaN(valA)) valA = +Infinity;
    let valB = getExprValue(b);
    if (isNaN(valB)) valB = +Infinity;
    if (valA < valB) return -1;
    if (valA > valB) return 1;

    const lenA = getExprLength(a);
    const lenB = getExprLength(b);
    if (lenA === lenB) {
        // Order arg by arg
        for (let i = 1; i <= lenA; i++) {
            const comp = order(getArg(a, i), getArg(b, i));
            if (comp !== 0) return comp;
        }
    }
    return lenB - lenA;
}

/**
 * Return the (total) degree of the term
 */
export function degree(expr: Expression, sortedVars: string[]): number {
    if (expr === 0) return -Infinity;
    const name = getFunctionName(expr);

    if (name === POWER) {
        const exponent = getNumberValue(getArg(expr, 2));
        if (isFinite(exponent)) return exponent;
        return 0;
    }

    if (name === MULTIPLY) {
        let result = 0;
        getArgs(expr).forEach((x) => {
            result += degree(x, sortedVars);
        });
        return result;
    }

    if (sortedVars.includes(getSymbolName(expr))) return 1;
    return 0;
}

/**
 *  Return the degree of variable v
 *  i.e. if "v" -> degree 1
 *  if "v^2" -> degree 2
 *  if "v^2v^3" -> degree 5
 *  if "v^n" -> degree 0
 */

function getDegree(expr: Expression, v: string): number {
    const name = getFunctionName(expr);
    if (name === POWER) {
        if (getSymbolName(getArg(expr, 1)) === v) {
            const exponent = getNumberValue(getArg(expr, 2));
            if (isFinite(exponent)) return exponent;
        }
        return 0;
    }
    if (name === MULTIPLY) {
        let result = 0;
        for (const arg of getArgs(expr)) {
            result += getDegree(arg, v);
        }
        return result;
    }

    if (getSymbolName(expr) === v) return 1;

    return 0;
}

/**
 * Get a string representing, in order, all the symbols of the expression.
 * This assumes that each of the argument of the expression, if any,
 * have already been sorted.
 */
function getLex(expr: Expression | null): string {
    if (getFunctionHead(expr)) {
        return getArgs(expr).map(getLex).join(' ');
    }
    if (typeof expr === 'string') return expr;
    if (isSymbolObject(expr)) return expr.sym;
    return '';
}

/**
 * Get  the "length" of the expression, i.e. the number of arguments, recursively
 *
 */
function getExprLength(expr: Expression | null): number {
    if (getFunctionHead(expr)) {
        return getArgs(expr)
            .map(getExprLength)
            .reduce((acc: number, x: number) => acc + x, 0);
    }
    if (typeof expr === 'string') return 1;
    if (getSymbolName(expr)) return 1;
    return 0;
}

function getExprValue(expr: Expression | null): number {
    if (getFunctionHead(expr)) return NaN;

    if (typeof expr === 'number') return expr;
    if (isNumberObject(expr)) return getNumberValue(expr);

    return 0;
}

/**
 * The deglex order is used for sum of factors:
 * - first by total degree of each factor
 * - then lexicographically for each variable
 * - then lexicogaphcially for other symbols
 * - then by length
 * - then by value
 *
 */
export function deglex(
    a: Expression,
    b: Expression,
    sortedVars: string[]
): number {
    const aDeg = degree(a, sortedVars);
    const bDeg = degree(b, sortedVars);

    if (aDeg < bDeg) return 1;
    if (aDeg > bDeg) return -1;

    // Lexicographic order:
    // Compare order of lexicographically sorted vars
    // (i.e. "x" first, then "y", then "z", etc...
    // a = 5 x^5 y^7
    // b =   x^2 y^3
    for (const x of sortedVars) {
        const aDegX = getDegree(a, x);
        const bDegX = getDegree(b, x);
        if (aDegX !== bDegX) return bDegX - aDegX;
    }

    const aLex = getLex(a);
    const bLex = getLex(b);
    if (aLex > bLex) return -1;
    if (aLex < bLex) return 1;

    // Inverse than the regular order: smaller first
    // let valA = getExprValue(a);
    // if (isNaN(valA)) valA = +Infinity;
    // let valB = getExprValue(b);
    // if (isNaN(valB)) valB = +Infinity;
    // if (valA < valB) return -1;
    // if (valA > valB) return 1;

    return order(a, b);
}

export function canonicalOrder(
    dic: Dictionary,
    sortedVars: string[],
    expr: Expression
): Expression {
    let args: Expression[] = getArgs(expr);
    if (args.length === 0) return expr;

    // Sort each of the arguments
    args = args.map((x) => canonicalOrder(dic, sortedVars, x));

    const name: Expression = getFunctionName(expr);
    if (name === ADD) {
        // Use the deglex sort order for sums
        args.sort((a, b) => deglex(a, b, sortedVars));
    } else {
        // Is the function commutative?
        const def = findFunctionInDictionary(dic, name);
        if (def?.isCommutative ?? false) {
            // Sort the argument list
            args.sort(order);
        }
    }

    return [getFunctionHead(expr), ...args];
}
