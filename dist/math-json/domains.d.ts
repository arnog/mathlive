/* 0.53.3 */export declare const DOMAIN_NONE = 0;
export declare const DOMAIN_ZERO = 1;
export declare const DOMAIN_PRIME_NUMBER = 256;
export declare const DOMAIN_POSITIVE_INTEGER: number;
export declare const DOMAIN_NEGATIVE_INTEGER = 4;
export declare const DOMAIN_EVEN_NUMBER: number;
export declare const DOMAIN_INTEGER: number;
export declare const DOMAIN_POSITIVE_REAL: number;
export declare const DOMAIN_NEGATIVE_REAL: number;
export declare const DOMAIN_REAL: number;
export declare const DOMAIN_POSITIVE_IMAGINARY = 32;
export declare const DOMAIN_NEGATIVE_IMAGINARY = 64;
export declare const DOMAIN_COMPLEX: number;
export declare const DOMAIN_FINITE_NUMBER = 512;
export declare const DOMAIN_NUMBER = 4095;
export declare const DOMAIN_BOOLEAN = 4096;
export declare const DOMAIN_SYMBOL = 8192;
export declare const DOMAIN_STRING = 16384;
/** Functions, except those used to represent list-like data structures and rules */
export declare const DOMAIN_FUNCTION = 32768;
export declare const DOMAIN_RULE = 65536;
export declare const DOMAIN_VECTOR = 2097152;
export declare const DOMAIN_MATRIX = 4194304;
export declare const DOMAIN_ARRAY: number;
export declare const DOMAIN_TABLE = 16777216;
export declare const DOMAIN_DICTIONARY = 2097152;
export declare const DOMAIN_SET: number;
export declare const DOMAIN_LIST: number;
export declare const DOMAIN_ANY_FUNCTION: number;
export declare const DOMAIN_EXPRESSION: number;
export declare const DOMAIN_ANY = 4503599627370495;
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
export declare const DOMAINS: {
    [domain: string]: number;
};
export declare type Domain = keyof typeof DOMAINS;
