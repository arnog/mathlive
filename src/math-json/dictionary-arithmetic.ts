import type { Dictionary } from './public';

export const ARITHMETIC_DICTIONARY: Dictionary = {
    //
    // Constants
    //
    PI: {
        wikidata: 'Q167',
        isConstant: true,
        domain: 'R+',
    },

    //
    // Functions
    //
    Abs: {
        wikidata: 'Q3317982', //magnitude 'Q120812 (for reals)
        isPure: true,
        isListable: true,
        isIdempotent: true,
    },
    Add: {
        wikidata: 'Q32043',
        isAssociative: true,
        isCommutative: true,
        isListable: true,
        isIdempotent: true,
        isPure: true,
    },
    Chop: {
        isAssociative: true,
        isListable: true,
        isPure: true,
        isIdempotent: true,
    },
    Eq: {
        // mathematical relationship asserting that two quantities have the same value
        wikidata: 'Q842346',
        isPure: true,
    },
    Factorial: {
        wikidata: 'Q120976',
        isPure: true,
    },
    Multiply: {
        wikidata: 'Q40276',
        isAssociative: true,
        isCommutative: true,
        isIdempotent: true,
        isPure: true,
    },
    Ne: {
        // Not equal
        wikidata: 'Q28113351',
        isCommutative: true,
        isPure: true,
    },
    Negate: {
        wikidata: 'Q715358',
        isPure: true,
    },
    Power: {
        wikidata: 'Q33456',
        isCommutative: false,
        isPure: true,
    },
    Subtract: {
        wikidata: 'Q32043',
        isCommutative: false,
        isPure: true,
    },

    // mod (modulo)
    // lcm
    // gcd
    // root
    // sum
    // product
};
