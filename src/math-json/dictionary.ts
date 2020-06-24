import type {
    Dictionary,
    DictionaryCategory,
    SymbolDefinition,
    FunctionDefinition,
} from './public';
import { ARITHMETIC_DICTIONARY } from './dictionary-arithmetic';
import { CORE_DICTIONARY } from './dictionary-core';

/**
 * These constants are the 'primitives' that are used for some basic manipulations
 * such as parsing, and transforming to canonical form.
 *
 */
export const LATEX = 'Latex';
export const LIST = 'List';
export const IDENTITY = 'Identity';
export const MISSING = 'Missing';
export const SEQUENCE = 'Sequence';
export const GROUP = 'Group';

export const MULTIPLY = 'Multiply';
export const POWER = 'Power';
export const DIVIDE = 'Divide';
export const ADD = 'Add';
export const SUBTRACT = 'Subtract';
export const NEGATE = 'Negate';
export const DERIVATIVE = 'Derivative';
export const INVERSE_FUNCTION = 'InverseFunction';
export const EXP = 'Exp';
export const SQRT = 'Sqrt';
export const ROOT = 'Root';
export const PRIME = 'Prime';

export const COMPLEX_INFINITY = 'COMPLEX_INFINITY';
export const NOTHING = 'NOTHING';
export const PI = 'PI';
export const EXPONENTIAL_E = 'E';
export const IMAGINARY_I = 'I';

export function getDefaultDictionary(
    domain: DictionaryCategory | 'all' = 'all'
): Dictionary {
    let result: Dictionary;
    if (domain === 'all') {
        result = {};
        Object.keys(DICTIONARY).forEach((x) => {
            result = { ...result, ...DICTIONARY[x] };
        });
    } else {
        result = { ...DICTIONARY[domain] };
    }
    return result;
}

export function findInDictionary(
    dic: Dictionary,
    name: string
): SymbolDefinition | FunctionDefinition | null {
    return dic[name];
}
export function findFunctionInDictionary(
    dic: Dictionary,
    name: string
): FunctionDefinition | null {
    if (dic[name] && !('isConstant' in dic[name])) {
        return dic[name] as FunctionDefinition;
    }
    return null;
}
export function findSymbolInDictionary(
    dic: Dictionary,
    name: string
): SymbolDefinition | null {
    if (dic[name] && 'isConstant' in dic[name]) {
        return dic[name] as SymbolDefinition;
    }
    return null;
}

// export const ADD = 'Q32043';
// export const SUBTRACT = 'Q40754';
// export const NEGATE = 'Q715358'; // -x
// export const RECIPROCAL = 'Q216906'; // 1/x
// export const MULTIPLY = 'Q40276';
// export const DIVIDE = 'Q40276';
// export const POWER = 'Q33456';

// export const STRING = 'Q184754';
// export const TEXT = '';

// export const COMPLEX = 'Q11567'; // ℂ Set of complex numbers Q26851286
// export const REAL = 'Q12916'; // ℝ Set of real numbers: Q26851380
// export const RATIONAL = 'Q1244890'; // ℚ
// export const NATURAL_NUMBER = 'Q21199'; // ℕ0 (includes 0) or ℕ* (wihtout 0) Set of Q28777634
// // set of positive integers (incl 0): Q47339953
// // set of natural numbers (w/o 0): Q47007719
// export const INTEGER = 'Q12503'; // ℤ
// export const PRIME = 'Q47370614'; // set of prime numbers

// export const MATRIX = 'Q44337';
// export const FUNCTION = 'Q11348';

// export const LIST = 'Q12139612';

// Unary functions:
// https://query.wikidata.org/#PREFIX%20wd%3A%20%3Chttp%3A%2F%2Fwww.wikidata.org%2Fentity%2F%3E%0APREFIX%20wdt%3A%20%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fdirect%2F%3E%0A%0ASELECT%20DISTINCT%20%3Fitem%0AWHERE%20%7B%0A%20%20%20%20%3Fitem%20wdt%3AP31%2a%20wd%3AQ657596%0A%7D%0A
// https://query.wikidata.org/#PREFIX%20wd%3A%20%3Chttp%3A%2F%2Fwww.wikidata.org%2Fentity%2F%3E%0APREFIX%20wdt%3A%20%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fdirect%2F%3E%0A%0ASELECT%20DISTINCT%20%3Fitem%0AWHERE%20%7B%0A%20%20%20%20%3Fitem%20wdt%3AP279%2a%20wd%3AQ657596%0A%7D%0A
// Binary functions:
// https://query.wikidata.org/#PREFIX%20wd%3A%20%3Chttp%3A%2F%2Fwww.wikidata.org%2Fentity%2F%3E%0APREFIX%20wdt%3A%20%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fdirect%2F%3E%0A%0ASELECT%20DISTINCT%20%3Fitem%0AWHERE%20%7B%0A%20%20%20%20%3Fitem%20wdt%3AP31%2a%20wd%3AQ164307%0A%7D%0A
// Set operations:
// https://query.wikidata.org/#PREFIX%20wd%3A%20%3Chttp%3A%2F%2Fwww.wikidata.org%2Fentity%2F%3E%0APREFIX%20wdt%3A%20%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fdirect%2F%3E%0A%0ASELECT%20DISTINCT%20%3Fitem%0AWHERE%20%7B%0A%20%20%20%20%3Fitem%20wdt%3AP31%2a%20wd%3AQ1964995%0A%7D%0A

// Bindings to:
// - stdlib: https://github.com/stdlib-js/stdlib
// - mathjs
// - others...?

export const DICTIONARY: { [category in DictionaryCategory]: Dictionary } = {
    core: CORE_DICTIONARY,
    arithmetic: ARITHMETIC_DICTIONARY,
    algebra: {
        // polynomial([0, 2, 0, 4]:list, x:symbol) -> 2x + 4x^3
        // polynomial(2x + 4x^3, x) -> {0, 2, 0, 4}
        // rational(2x + 4x^3, {3, 1}, x) -> (2x + 4x^3)/(3+x)
        // https://reference.wolfram.com/language/tutorial/AlgebraicCalculations.html
        // simplify-trig (macsyma)
        //  - trigReduce, trigExpand, trigFactor, trigToExp (mathematica)
        // Mathematica:
        // - distribute -> (a+b)(c+d) -> ac+ ad+ bc+ bd (doesn't have to be multiply,
        // f(a+b, c+d) -> f(a, c) + f(a, d) + f(b, c) + f(b, d)
        // -- distribute(expr, over=add, with=multiply)
        // https://reference.wolfram.com/language/ref/Distribute.html
        // - expand, expand-all
        // - factor
        // - simplify
    },

    calculus: {
        // D
        // Derivative (mathematica)
        // diff (macsyma)
        // nth-diff
        // int
        // - integrate(expression, symbol)  -- indefinite integral
        // - integrate(expression, range) <range> = {symbol, min, max} -- definite integral
        // - integrate(expression, range1, range2) -- multiple integral
        // def-int
    },
    combinatorics: {}, // fibonacci, binomial, etc...
    complex: {
        // real
        // imaginary
        // complex-cartesian (constructor)
        // complex-polar
        // argument
        // conjugate
    },
    dimensions: {
        // volume, speed, area
    },
    lists: {
        // first    or head
        // rest     or tail
        // cons -> cons(first (element), rest (list)) = list
        // append -> append(list, list) -> list
        // reverse
        // rotate
        // in
        // map   ⁡ map(2x, x, list) ( 2 ⁢ x | x ∈ [ 0 , 10 ] )
        // such-that {x ∈ Z | x ≥ 0 ∧ x < 100 ∧ x 2 ∈ Z}
        // select : picks out all elements ei of list for which crit[ei] is True.
        // sort
        // contains / find
    },
    logic: {
        // true, false
        // and, or, not, xor,, nand, nor, xnor,
        // equivalent, implies
        // for-all
        // exists
    },

    intervals: {
        // interval of integers vs interval of other sets (integer interval don't need to be open/closed)
        // interval vs. ranges
        // interval, open-interval, etc..
        // upper     or min?
        // lower    or max?
    },
    'linear-algebra': {
        // matrix
        // transpose
        // cross-product
        // outer-product
        // determinant
        // vector
        // matrix
        // rank
        // scalar-matrix
        // constant-matrix
        // identitity-matrix
    },
    numeric: {
        // Gamma function
        // Zeta function
        // erf function
        // numerator(fraction)
        // denominator(fraction)
        // exactFloatToRational
        // N -> eval as a number
        // random
        // hash
    },
    polynomials: {
        // degree
        // expand
        // factors
        // roots
    },
    physics: {
        'mu-0': {
            isConstant: true,
            wikidata: 'Q1515261',
            domain: 'R+',
            value: 1.25663706212e-6,
            unit: [MULTIPLY, 'H', [POWER, 'm', -1]],
        },
    },
    quantifiers: {},
    relations: {
        // eq, lt, leq, gt, geq, neq, approx
        //     shortLogicalImplies: 52, // ->
        // shortImplies => 51
        // implies ==> 49
        //    impliedBy: 45, // <==
        // := assign 80
        // less-than-or-equal-to: Q55935272 241
        // greater-than-or-equal: Q55935291 242
        // greater-than: Q47035128  243
        // less-than: Q52834024 245
    },
    rounding: {
        // ceiling, floor, trunc, round,
    },
    sets: {
        // cartesian-product
        // empty-set
        // intersect
        // union
        // set-diff / minus
        // subset
        // Z, P, N, Q, R, C
    },
    statistics: {
        // average
        // mean
        // variance = size(l) * stddev(l)^2 / (size(l) - 1)
        // stddev
        // median
        // quantile
    },
    transcendentals: {
        // log, ln, exp,
    },
    trigonometry: {
        // sin, cos, tan, sec, csc, cot, sinh,
        // cosh, tanh, sechh, csch, coth,
        // arcsin, arccos, arctan, arcsec, arccsc, arccot, arcsinh,
        // arcosh, artanh, arcsech, arccsch, arccoth,
        // arctan2
    },
    units: {},
};
