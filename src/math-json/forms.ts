import type { Expression, Dictionary, Form } from './public';
import {
    isNumberObject,
    isFunctionObject,
    isSymbolObject,
    getNumberValue,
    getFunctionName,
    getArgs,
    getArg,
    mapArgs,
    getArgCount,
    vars,
    getFunctionHead,
} from './utils';
import {
    findFunctionInDictionary,
    GROUP,
    POWER,
    DIVIDE,
    MULTIPLY,
    NEGATE,
    ADD,
    EXP,
    EXPONENTIAL_E,
    LIST,
    IDENTITY,
    SEQUENCE,
    SQRT,
    ROOT,
    SUBTRACT,
    NOTHING,
} from './dictionary';
import { canonicalOrder } from './order';

function ungroup(expr: Expression): Expression {
    const head = getFunctionHead(expr);
    if (!head) return expr;
    if (head === GROUP && getArgCount(expr) === 1) {
        return ungroup(getArg(expr, 1));
    }
    return mapArgs(expr, ungroup);
}

/**
 * Return an expression that's the inverse (1/x) of the input
 *
 */

function applyInvert(expr: Expression | null): Expression | null {
    if (expr === null) return null;
    expr = ungroup(expr);
    const head = getFunctionHead(expr);
    if (head === POWER && getArgCount(expr) === 2) {
        return [POWER, getArg(expr, 1), applyNegate(getArg(expr, 2))];
    }
    if (head === DIVIDE && getArgCount(expr) === 2) {
        return [MULTIPLY, [POWER, getArg(expr, 1), -1], getArg(expr, 2)];
    }
    return [POWER, expr, -1];
}

export function applyNegate(expr: Expression): Expression {
    if (expr === null) return expr;
    expr = ungroup(expr);
    if (typeof expr === 'number') {
        expr = -expr;
    } else if (expr && isNumberObject(expr)) {
        if (expr.num[0] === '-') {
            expr = { num: expr.num.slice(1) };
        } else {
            expr = { num: '-' + expr.num };
        }
    } else {
        // [NEGATE, [NEGATE, x]] -> x
        const name = getFunctionName(expr);
        const argCount = getArgCount(expr);
        if (name === NEGATE && argCount === 1) {
            return getArg(expr, 1);
        } else if (name === MULTIPLY) {
            let arg = getArg(expr, 1);
            if (typeof arg === 'number') {
                arg = -arg;
            } else if (isNumberObject(arg)) {
                if (arg.num[0] === '-') {
                    arg = { num: arg.num.slice(1) };
                } else {
                    arg = { num: '-' + arg.num };
                }
            } else {
                arg = [NEGATE, arg];
            }
            return [MULTIPLY, arg, ...getArgs(expr).slice(1)];
        } else if (name === GROUP && argCount === 1) {
            return applyNegate(getArg(getArg(expr, 1), 1));
        }

        expr = [NEGATE, expr];
    }
    return expr;
}

function flatten(expr: Expression | null, flatName: string): Expression | null {
    const head = getFunctionHead(expr);
    if (!head) return expr;

    expr = mapArgs(expr, (x) => flatten(x, flatName));

    if (head !== flatName) return expr;

    const args = getArgs(expr);
    let newArgs: Expression[] = [];
    for (let i = 0; i < args.length; i++) {
        if (getFunctionName(args[i]) === flatName) {
            // [f, a, [f, b, c]] -> [f, a, b, c]
            // or [f, f[a]] -> f[a]
            newArgs = newArgs.concat(getArgs(args[i]));
        } else {
            newArgs.push(args[i]);
        }
    }
    return [head, ...newArgs];
}

function flattenIdempotent(
    dic: Dictionary,
    expr: Expression | null
): Expression | null {
    const name = getFunctionName(expr);
    const def = findFunctionInDictionary(dic, name);
    if (def?.isIdempotent) return flatten(expr, name);

    return mapArgs(expr, (x) => flattenIdempotent(dic, x));
}

function flattenAssociative(
    dic: Dictionary,
    expr: Expression | null
): Expression | null {
    const name = getFunctionName(expr);
    const def = findFunctionInDictionary(dic, name);
    if (def?.isAssociative) return flatten(expr, name);

    return mapArgs(expr, (x) => flattenAssociative(dic, x));
}

function canonicalAddForm(
    dic: Dictionary,
    expr: Expression | null
): Expression | null {
    const head = getFunctionHead(expr);
    if (!head) return expr;
    if (head !== ADD) {
        return mapArgs(expr, (x) => canonicalAddForm(dic, x));
    }
    expr = flatten(ungroup(expr), ADD);
    let args = getArgs(expr);
    args = args
        .map((x) => canonicalAddForm(dic, x))
        .filter((x) => getNumberValue(x) !== 0);
    const argCount = args.length;
    if (argCount === 0) return 0;
    if (argCount === 1) return args[0];
    return [ADD, ...args];
}

function canonicalDivideForm(
    dic: Dictionary,
    expr: Expression | null
): Expression | null {
    const head = getFunctionHead(expr);
    if (!head) return expr;
    if (head !== DIVIDE) {
        return mapArgs(expr, (x) => canonicalDivideForm(dic, x));
    }

    if (getArgCount(expr) !== 2) return expr;

    const arg1 = canonicalDivideForm(dic, getArg(expr, 1));
    const arg2 = canonicalDivideForm(dic, getArg(expr, 2));
    const val2 = getNumberValue(arg2);
    if (val2 === 1) return arg1;
    return [MULTIPLY, arg1, applyInvert(arg2)];
}

function canonicalExpForm(
    dic: Dictionary,
    expr: Expression | null
): Expression | null {
    const head = getFunctionHead(expr);
    if (!head) return expr;
    if (head !== EXP) {
        return mapArgs(expr, (x) => canonicalExpForm(dic, x));
    }

    if (getArgCount(expr) !== 1) return expr;

    return [POWER, EXPONENTIAL_E, canonicalExpForm(dic, getArg(expr, 1))];
}

function canonicalListForm(
    dic: Dictionary,
    expr: Expression | null
): Expression | null {
    const name = getFunctionName(expr);
    if (!name) return expr;

    const isList = name === LIST;
    const args = getArgs(expr);
    let newArgs: Expression[] = [];

    for (let arg of args) {
        arg = canonicalListForm(dic, arg);
        const name = getFunctionName(arg);
        if (name === IDENTITY) {
            const newArg = getArg(arg, 1);
            if (newArg !== null && typeof newArg !== 'undefined') {
                newArgs.push(newArg);
            }
        } else if (name === NOTHING) {
            if (!isList) {
                newArgs.push(arg);
            }
            // Skip it...
        } else if (name === SEQUENCE) {
            newArgs = newArgs.concat(getArgs(arg));
        } else {
            newArgs.push(arg);
        }
    }

    return [getFunctionHead(expr), ...newArgs];
}

function getRootDegree(expr: Expression): number {
    const name = getFunctionName(expr);
    if (name === SQRT) return 2;
    if (name === ROOT) return getNumberValue(getArg(expr, 2));
    if (name !== POWER) return 1;
    const exponent = getArg(expr, 2);
    if (!exponent) return 1;
    if (
        getFunctionName(exponent) === POWER &&
        getNumberValue(getArg(exponent, 2)) === -1
    ) {
        const val = getNumberValue(getArg(exponent, 1));
        if (isFinite(val)) return val;
    }
    return 1;
}

/**
 * Assuming that `expr` is a `"multiply"`, return in the first member
 * of the tuples all the arguments that are square roots,
 * and in the second member of the tuples all those that aren't
 */

function getSquareRoots(expr: Expression): [Expression[], Expression[]] {
    const args = getArgs(expr);
    const roots: Expression[] = [];
    const nonRoots: Expression[] = [];
    for (const arg of args) {
        if (getRootDegree(arg) === 2) {
            roots.push(getArg(arg, 1));
        } else {
            nonRoots.push(arg);
        }
    }
    return [roots, nonRoots];
}

function canonicalMultiplyForm(
    dic: Dictionary,
    expr: Expression | null
): Expression | null {
    const head = getFunctionHead(expr);
    if (!head) return expr;
    expr = mapArgs(expr, (x) => canonicalMultiplyForm(dic, x));
    if (head !== MULTIPLY) return expr;

    expr = flatten(ungroup(expr), MULTIPLY);

    // Group all square roots together
    const [squareRoots, nonSquareRoots] = getSquareRoots(expr);
    let args: Expression[];
    if (squareRoots.length === 0) {
        args = nonSquareRoots;
    } else if (squareRoots.length === 1) {
        expr = [
            MULTIPLY,
            ...nonSquareRoots,
            [POWER, squareRoots[0], [POWER, 2, -1]],
        ];
        args = getArgs(expr);
    } else {
        expr = [
            MULTIPLY,
            ...nonSquareRoots,
            [POWER, [MULTIPLY, ...squareRoots], [POWER, 2, -1]],
        ];
        args = getArgs(expr);
    }

    // Hoist any negative (numbers or `"negate"` function)
    let isNegative = false;
    let hasNegative = false;
    args = args.map((x) => {
        if (getFunctionName(x) === NEGATE) {
            hasNegative = true;
            isNegative = !isNegative;
            return getArg(x, 1);
        }
        const val = getNumberValue(x);
        if (val < 0) {
            hasNegative = true;
            isNegative = !isNegative;
            return -val;
        }
        return x;
    });
    if (isNegative) {
        const val = getNumberValue(args[0]);
        if (isFinite(val)) {
            // If the first argument is a finite number, negate it
            args = getArgs(
                flatten([MULTIPLY, -val, ...args.slice(1)], MULTIPLY)
            );
        } else {
            args = getArgs(flatten([MULTIPLY, -1, ...args], MULTIPLY));
        }
    } else if (hasNegative) {
        // At least one term was hoisted, it could require flatening
        // e.g. `[MULTIPLY, [NEGATE, [MULTIPLY, 2, 3]], 4]`
        args = getArgs(flatten([MULTIPLY, ...args], MULTIPLY));
    } else {
        args = getArgs(flatten([MULTIPLY, ...args], MULTIPLY));
    }

    // Any arg is 0? Return 0.
    // WARNING: we can't do this. If any of the argument, or the result
    // of the evaluation of any of the argument was non-finit, the
    // result is undefined (NaN), not 0.
    // if (args.some((x) => getNumberValue(x) === 0)) return 0;

    // Any 1? Eliminate them.
    args = args.filter((x) => getNumberValue(x) !== 1);

    // If no arguments left, return 1
    if (args.length === 0) return 1;

    // Only one argument, return it (`"multiply"` is idempotent)
    if (args.length === 1) return args[0];

    return [MULTIPLY, ...args];
}

// @todo: see https://docs.sympy.org/1.6/modules/core.html#pow
function canonicalPowerForm(
    dic: Dictionary,
    expr: Expression | null
): Expression | null {
    const head = getFunctionHead(expr);
    if (!head) return expr;
    if (head !== POWER) {
        return mapArgs(expr, (x) => canonicalPowerForm(dic, x));
    }

    expr = ungroup(expr);

    if (getArgCount(expr) !== 2) return expr;

    const arg1 = canonicalPowerForm(dic, getArg(expr, 1));
    const val1 = getNumberValue(arg1);
    const arg2 = canonicalPowerForm(dic, getArg(expr, 2));
    const val2 = getNumberValue(arg2);

    if (val2 === 0) return 1;
    if (val2 === 1) return arg1;
    if (val1 === -1 && val2 === -1) return -1;
    // -1 +oo           nan
    // -1 -oo           nan

    // 0 -1             zoo
    // 0 oo             0
    // 0 -oo            zoo

    if (val1 === 1 && val2 === -1) return 1;
    if (val1 === 1) return 1;
    // 1 oo             nan
    // 1 -oo            nan

    // oo -1            0
    // oo oo            oo
    // oo -oo           0
    // oo i             nan
    // oo 1+i           zoo
    // oo -1+i          0

    // -oo -1           0
    // -oo oo           nan
    // -oo -oo          nan
    // -oo i            nan
    // -oo 1+i          zoo
    // -oo -1+i         0

    // b zoo            nan

    return expr;
}

function canonicalNegateForm(
    dic: Dictionary,
    expr: Expression | null
): Expression | null {
    expr = ungroup(expr);
    const head = getFunctionName(expr);
    if (head === NEGATE) {
        const arg = getArg(expr, 1);
        if (typeof arg === 'number') {
            expr = -arg;
        } else if (arg && isNumberObject(arg)) {
            if (getNumberValue(arg) === 0) return 0;
            if (arg.num[0] === '-') {
                expr = { num: arg.num.slice(1) };
            } else {
                expr = { num: '-' + arg.num };
            }
        } else if (getFunctionName(arg) === MULTIPLY) {
            let fact = getArg(arg, 1);
            if (typeof fact === 'number') {
                fact = -fact;
            } else if (isNumberObject(fact)) {
                if (fact.num[0] === '-') {
                    fact = { num: fact.num.slice(1) };
                } else {
                    fact = { num: '-' + fact.num };
                }
            } else {
                return [MULTIPLY, -1, fact, ...getArgs(arg).slice(1)];
            }
            return [MULTIPLY, fact, ...getArgs(arg).slice(1)];
        } else {
            return [MULTIPLY, -1, arg];
        }
    } else if (head) {
        return mapArgs(expr, (x) => canonicalNegateForm(dic, x));
    }
    return expr;
}

function canonicalNumberForm(
    dic: Dictionary,
    expr: Expression | null
): Expression | null {
    if (getFunctionHead(expr)) {
        return mapArgs(expr, (x) => canonicalNumberForm(dic, x));
    }

    if (typeof expr === 'number') {
        if (isNaN(expr)) {
            return { num: 'NaN' };
        } else if (!isFinite(expr) && expr > 0) {
            return { num: 'Infinity' };
        } else if (!isFinite(expr) && expr < 0) {
            return { num: '-Infinity' };
        }
        // } else if (typeof expr === 'bigint') {
        //     return { num: BigInt(expr).toString().slice(0, -1) };
        // }
    } else if (isNumberObject(expr)) {
        if (isNaN(Number(expr.num))) {
            // Only return true if it's not a number
            // If it's an overflow, Number() is Infinity
            // If it's an underflow Number() is 0
            return { num: 'NaN' };
        }
        if (expr.num.endsWith('n')) {
            // It's a bigint string
            return { num: expr.num.slice(0, -1) };
        }
        // if (typeof expr.num === 'bigint') {
        //     return { num: BigInt(expr.num).toString().slice(0, -1) };
        // }
    }

    return expr;
}

function canonicalSubtractForm(
    dic: Dictionary,
    expr: Expression | null
): Expression | null {
    const head = getFunctionHead(expr);
    if (!head) return expr;
    if (head !== SUBTRACT) {
        return mapArgs(expr, (x) => canonicalSubtractForm(dic, x));
    }

    if (getArgCount(expr) !== 2) return expr;

    const arg1 = canonicalSubtractForm(dic, getArg(expr, 1));
    const val1 = getNumberValue(arg1);
    const arg2 = canonicalSubtractForm(dic, getArg(expr, 2));
    const val2 = getNumberValue(arg2);

    if (val1 === 0) {
        if (val2 === 0) return 0;
        return canonicalSubtractForm(dic, [ADD, arg1, applyNegate(arg2)]);
    }
    return canonicalSubtractForm(dic, [ADD, arg1, applyNegate(arg2)]);
}

function canonicalRootForm(
    dic: Dictionary,
    expr: Expression | null
): Expression | null {
    const head = getFunctionHead(expr);
    if (!head) return expr;
    if (head !== ROOT && head !== SQRT) {
        return mapArgs(expr, (x) => canonicalRootForm(dic, x));
    }

    if (getArgCount(expr) < 1) return expr;

    const arg1 = canonicalRootForm(dic, getArg(expr, 1));

    let arg2: Expression = 2;
    if (getArgCount(expr) > 1) {
        arg2 = canonicalPowerForm(dic, getArg(expr, 2));
    }
    const val2 = getNumberValue(arg2);
    if (val2 === 1) {
        return arg1;
    }

    return [POWER, arg1, [DIVIDE, 1, arg2]];
}

/**
 * Return num as a number if it's a valid JSON number (that is
 * a valid JavaScript number but not NaN or +/-Infinity) or
 * as a string otherwise
 */

function isValidJSONNumber(num: string): string | number {
    const val = Number(num);
    if (typeof num === 'string' && val.toString() === num) {
        // If the number roundtrips, it can be represented by a
        // JavaScript number
        // However, NaN and Infinity cannot be represented by JSON
        if (isNaN(val) || !isFinite(val)) {
            return val.toString();
        }
        return val;
    }
    return num;
}

/**
 * Transform the expression so that object literals for numbers, symbols and
 * functions are used only when necessary, i.e. when they have associated
 * metadata attributes. Otherwise, use a plain number, string or array
 *
 * For example:
 * ```
 * {num: 2} -> 2
 * {sym: "x"} -> "x"
 * {fn:['add', {num: 1}, {sym: "x"}]} -> ['add', 1, "x"]
 * ```
 *
 */
export function fullForm(
    dic: Dictionary,
    expr: Expression | null
): Expression | null {
    if (expr === null) return null;
    if (Array.isArray(expr)) {
        return (expr as Expression[]).map((x, i) => {
            if (i === 0) {
                return x;
            }
            return fullForm(dic, x);
        });
    }
    if (typeof expr === 'object') {
        const keys = Object.keys(expr);
        if (keys.length === 1) {
            if (isNumberObject(expr)) {
                // Exclude NaN and Infinity, which are not valid numbers in JSON
                const val = isValidJSONNumber(expr.num);
                if (typeof val === 'number') return val;
                return { num: val };
            }
            if (isFunctionObject(expr)) {
                return expr.fn.map((x) => fullForm(dic, x));
            }
            if (isSymbolObject(expr)) {
                return expr.sym;
            }
        } else {
            if (isFunctionObject(expr)) {
                expr.fn = expr.fn.map((x) => fullForm(dic, x));
            }
        }
    }
    return expr;
}

export function strippedMetadataForm(
    dict: Dictionary,
    expr: Expression
): Expression {
    if (typeof expr === 'number' || typeof expr === 'string') {
        return expr;
    }
    if (Array.isArray(expr)) {
        return mapArgs(expr, (x) => strippedMetadataForm(dict, x));
    }
    if (typeof expr === 'object') {
        if ('num' in expr) {
            const val = isValidJSONNumber(expr.num);
            if (typeof val === 'number') return val;
            return { num: val };
        } else if ('fn' in expr) {
            return mapArgs(expr.fn, (x) => strippedMetadataForm(dict, x));
        }
    }

    return null;
}

/**
 * Transform the expression so that the arguments of functions that have the
 * `isCommutative` attributes are ordered as per the following:
 *
 * - Real numbers
 * - Complex numbers
 * - Symbols
 * - Functions
 *
 * Within Real Numbers:
 * - by their value
 *
 * With Complex numbers:
 * - by the value of their imaginary component,
 * - then by the value of their real component
 *
 * With Symbols:
 * - constants (`isConstant === true`) before non-constants
 * - then alphabetically
 *
 * With Functions:
 * - if a `[MULTIPLY]` or a `[POWER]`... @todo
 *
 */
export function sortedForm(dic: Dictionary, expr: Expression): Expression {
    // Get the unique variables (not constants) in the expression
    const v: Set<string> = vars(dic, expr);

    return canonicalOrder(dic, Array.from(v).sort(), expr);
}

/**
 *  Return the expression in canonical form:
 *
 * - `"divide"`, `"exp"`,` `"subtract"`, `"root"`, `"exp"` replaced with
 *      `"add"`, `"multiply"`, "`power"`
 * - some trivial simplifications (multiply by 1, addition of 0, division by 1)
 * - terms sorted
 *
 */
export function canonicalForm(
    dic: Dictionary,
    expr: Expression | null
): Expression | null {
    return form(dic, expr, [
        'canonical-number', // -> simplify number
        'canonical-exp', // -> power
        'canonical-root', // -> power, divide
        'canonical-subtract', // -> add, negate, multiply,
        'canonical-divide', // -> multiply, power
        'canonical-power', // simplify power
        'canonical-multiply', // -> multiply, power,    (this might generate
        // some POWER functions, but they are 'safe' (don't need simplification)
        'canonical-negate', // simplify negate
        'canonical-add', // simplify add
        'flatten', // associative, idempotent and groups
        'canonical-list', // 'nothing', 'identity' and 'sequence'
        'sorted',
        'full',
    ]);
}

function flattenForm(
    dic: Dictionary,
    expr: Expression | null
): Expression | null {
    return flattenAssociative(dic, flattenIdempotent(dic, expr));
}

/**
 * Return a string escaped as necessary to comply with the JSON format
 *
 */
export function escapeText(s: string): string {
    return s
        .replace(/[\\]/g, '\\\\')
        .replace(/["]/g, '\\"')
        .replace(/[\b]/g, '\\b')
        .replace(/[\f]/g, '\\f')
        .replace(/[\n]/g, '\\n')
        .replace(/[\r]/g, '\\r')
        .replace(/[\t]/g, '\\t');
}

/**
 * Transform an expression by applying one or more rewriting rules to it,
 * recursively.
 *
 * There are many ways to symbolically manipulate an expression, but
 * transformations with `form` have the following charactersitics:
 *
 * - they don't require calculation or assumption above the domain of free
 * variables or the value of constants
 * - the output expression is expressed with more primitive functions,
 * for example subtraction is replaced with addition
 *
 */
export function form(
    dic: Dictionary,
    expr: Expression | null,
    forms: Form[]
): Expression | null {
    let result = expr;
    forms.forEach((form) => {
        const fn: (
            dic: Dictionary,
            expr: Expression | null
        ) => Expression | null = {
            canonical: canonicalForm,
            'canonical-add': canonicalAddForm,
            'canonical-divide': canonicalDivideForm,
            'canonical-exp': canonicalExpForm,
            'canonical-list': canonicalListForm,
            'canonical-multiply': canonicalMultiplyForm,
            'canonical-power': canonicalPowerForm,
            'canonical-negate': canonicalNegateForm,
            'canonical-number': canonicalNumberForm,
            'canonical-root': canonicalRootForm,
            'canonical-subtract': canonicalSubtractForm,
            full: fullForm,
            flatten: flattenForm,
            sorted: sortedForm,
            'stripped-metadata': strippedMetadataForm,
            // 'sum-product': sumProductForm,
        }[form];
        if (!fn) {
            console.error('Unknown form ' + form);
            result = null;
            return;
        }
        result = fn(dic, result);
        console.log(form + ' = ' + JSON.stringify(result));
    });
    return result;
}
