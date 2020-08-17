import type { Dictionary } from '../public';

export const CORE_DICTIONARY: Dictionary = {
    Evaluate: {
        // expr, [precision]
    },
    Group: {
        domain: 'expression',
        isListable: true,
        // To support `((a,b),(c,d))`, group is considered non associative
        // and non-idempotent
        isPure: false,
    },
    Latex: {
        domain: 'string',
        isListable: false,
        isPure: true,
    },
    String: {
        domain: 'string',
        isListable: true,
        isPure: true,
    },
};

// https://www.mathworks.com/help/referencelist.html?type=function&listtype=cat&category=&blocktype=&capability=&s_tid=CRUX_lftnav        // list
// xcas/gias https://www-fourier.ujf-grenoble.fr/~parisse/giac/doc/en/cascmd_en/cascmd_en.html
// https://www.haskell.org/onlinereport/haskell2010/haskellch9.html#x16-1720009.1
// length(expr, depth:integer) (for a list, an expression, etc..)
// apply(expr:symbol, arguments) -> [expr, ...arguments] (but symbol is an expression that's evaluated...)
// shape
// length
// depth

// take(n, list) -> n first elements of the list
// repeat(x) -> infinite list with "x" as argument
// cycle(list) -> infinitely repeating list, i.e. cycle({1, 2, 3}) -> {1, 2, 3, 1, 2, 3, 1...}
// iterate(f, acc) -> {f(acc), f(f(acc)), f(f(f(acc)))...}
// == NestList ??

// identity
// range
// index
// evaluate
// bind // replace  ( x-> 1)
// domain
// min, max
// Nothing  -- constants, ignored in lists
// None -- constant for some options
// rule ->
// delayed-rule: :> (value of replacement is recalculated each time)
// set, set delayed
// join
// convert(expr, CONVERT_TO, OPTIONS) -- See Maple
// N
// set, delayed-set
// spread -> expand the elements of a list. If inside a list, insert the list into its parent
// compose (compose(f, g) -> a new function such that compose(f, g)(x) -> f(g(x))
// convert(expr, options), with options such as 'cos', 'sin, 'trig, 'exp', 'ln', 'latex', 'string', etc...)

// symbol(x) -> x as a symbol, e.g. symbol('x' + 'y') -> `xy` (and registers it)
// symbols() -> return list of all known symbols
// variables() -> return list of all free variables
