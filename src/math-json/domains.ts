export const DOMAIN_NONE = 0x00000;

// x = a | b => b isA x

export const DOMAIN_ZERO = 0x000001;
export const DOMAIN_PRIME_NUMBER = 0x0000100;
export const DOMAIN_POSITIVE_INTEGER = 0x000002 | DOMAIN_PRIME_NUMBER;
export const DOMAIN_NEGATIVE_INTEGER = 0x000004;
export const DOMAIN_EVEN_NUMBER = 0x000080 | DOMAIN_ZERO;
export const DOMAIN_INTEGER =
    DOMAIN_ZERO |
    DOMAIN_POSITIVE_INTEGER |
    DOMAIN_NEGATIVE_INTEGER |
    DOMAIN_EVEN_NUMBER;
export const DOMAIN_POSITIVE_REAL = 0x000008 | DOMAIN_POSITIVE_INTEGER;
export const DOMAIN_NEGATIVE_REAL = 0x000010 | DOMAIN_POSITIVE_INTEGER;
export const DOMAIN_REAL =
    DOMAIN_NEGATIVE_REAL | DOMAIN_POSITIVE_REAL | DOMAIN_ZERO;
export const DOMAIN_POSITIVE_IMAGINARY = 0x000020;
export const DOMAIN_NEGATIVE_IMAGINARY = 0x000040;
export const DOMAIN_COMPLEX =
    DOMAIN_REAL | DOMAIN_NEGATIVE_IMAGINARY | DOMAIN_POSITIVE_IMAGINARY;
export const DOMAIN_FINITE_NUMBER = 0x0000200;
export const DOMAIN_NUMBER = 0xfff;

export const DOMAIN_BOOLEAN = 0x001000;
export const DOMAIN_SYMBOL = 0x002000;
export const DOMAIN_STRING = 0x004000;
/** Functions, except those used to represent list-like data structures and rules */
export const DOMAIN_FUNCTION = 0x008000; // DOMAIN_CLOSURE ?

// Some special functions: rules and lists

export const DOMAIN_RULE = 0x010000; // a pattern and an expression

export const DOMAIN_VECTOR = 0x200000; // a list of numbers
export const DOMAIN_MATRIX = 0x400000; // a list of lists of number

export const DOMAIN_ARRAY = 0x800000 | DOMAIN_MATRIX; // a list of lists of any
export const DOMAIN_TABLE = 0x1000000; // a list of rules

export const DOMAIN_DICTIONARY = 0x200000; // a set of rules DOMAIN_RULES ???

export const DOMAIN_SET = 0x200000 | DOMAIN_DICTIONARY; // a list with unique elements

export const DOMAIN_LIST =
    0x100000 | DOMAIN_VECTOR | DOMAIN_ARRAY | DOMAIN_TABLE | DOMAIN_SET;

export const DOMAIN_ANY_FUNCTION = DOMAIN_RULE | DOMAIN_LIST | DOMAIN_FUNCTION;

export const DOMAIN_EXPRESSION =
    DOMAIN_ANY_FUNCTION | DOMAIN_SYMBOL | DOMAIN_NUMBER;

export const DOMAIN_ANY = 0xfffffffffffff;

// Other domains to consider:
// - FRAC: rational numbers
// - p-adic
// - polynomials
// - SERIE power series (finite Laurent series)
// - rational functions
// - row
// - column

// See also sympy 'assumptions'
// https://docs.sympy.org/latest/modules/core.html#module-sympy.core.assumptions

/**
 *
 * - "any"         any domain, no checking is done
 * - "N"           Q28920044 Natural numbers (positive integers): 1, 2, 3, 4, ...
 * - "N0"          Q28920052 Non-negative integers: 0, 1, 2, 3, 4
 * - "Z*"          Non-Zero integers: -2, -1, 1, 2, 3, ...
 * - "Z"           Q47007735 Integers: ...-3, -2, -1, 0, 1, 2, 3, 4, ...
 * - "R-":         Q200227 Negative real number <0
 * - "R+"          Q3176558 Positive real numbers (JS float) >0
 * - "R0-":        Q47341108 Non-positive real number <= 0
 * - "R0+"         Q13896108 Non-negative real numbers (JS float) >=0
 * - "R"           Real numbers (JS float)
 * - "I"           Q47310259 Imaginary numbers (complex numbers on the imaginary line)
 * - "C"           Q26851286 Complex numbers
 * - "boolean"     JS boolean
 * - "symbol"      JS string
 * - "string"      JS string
 * - "list"        JS array
 * - "array"       JS array
 * - "expression"  Math JSON node
 * - "table"        JS object literal, key (string)/ value (any) pairs
 */

export const DOMAINS: { [domain: string]: number } = {
    any: DOMAIN_ANY,
    none: DOMAIN_NONE,

    N: DOMAIN_POSITIVE_INTEGER,
    N0: DOMAIN_ZERO | DOMAIN_POSITIVE_INTEGER,
    'Z*': DOMAIN_POSITIVE_INTEGER | DOMAIN_NEGATIVE_INTEGER,
    Z: DOMAIN_ZERO | DOMAIN_POSITIVE_INTEGER | DOMAIN_NEGATIVE_INTEGER,
    'R-': DOMAIN_NEGATIVE_REAL,
    'R+': DOMAIN_POSITIVE_REAL,
    'R0-': DOMAIN_ZERO | DOMAIN_NEGATIVE_REAL,
    'R0+': DOMAIN_ZERO | DOMAIN_POSITIVE_REAL,
    R: DOMAIN_ZERO | DOMAIN_POSITIVE_REAL | DOMAIN_NEGATIVE_REAL,
    I: DOMAIN_ZERO | DOMAIN_POSITIVE_IMAGINARY | DOMAIN_NEGATIVE_IMAGINARY,
    C:
        DOMAIN_ZERO |
        DOMAIN_POSITIVE_REAL |
        DOMAIN_NEGATIVE_REAL |
        DOMAIN_POSITIVE_IMAGINARY |
        DOMAIN_NEGATIVE_IMAGINARY,

    number: DOMAIN_NUMBER,
    symbol: DOMAIN_SYMBOL,
    function: DOMAIN_FUNCTION,
    expression: DOMAIN_EXPRESSION,

    boolean: DOMAIN_BOOLEAN,
    string: DOMAIN_STRING,
    list: DOMAIN_LIST,
    // 'polynomial'
    // 'rational'
    // 'rule'
    array: DOMAIN_ARRAY,
    table: DOMAIN_TABLE,
};

export type Domain = keyof typeof DOMAINS;
