import type { Dictionary } from '../public';

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
        /** Elem */
        wikidata: 'Q3317982', //magnitude 'Q120812 (for reals)
        isPure: true,
        isListable: true,
        isIdempotent: true,
    },
    Add: {
        /** Elem */
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
    Ceil: {
        /** rounds a number up to the next largest integer */
        isPure: true,
    },
    Equal: {
        // mathematical relationship asserting that two quantities have the same value
        wikidata: 'Q842346',
        isPure: true,
    },
    E: {
        isConstant: true,
        value: { num: '2.7182818284590452354' },
    },
    Exp: {
        /** Elem */
        isPure: true,
    },
    Exp2: {
        /** Elem */
        isPure: true,
    },
    Exp10: {
        /** Elem */
        isPure: true,
    },
    Erf: {
        /** Elem */
        // Error function
        isPure: true,
    },
    Erfc: {
        /** Elem */
        // Error function complement
        isPure: true,
    },
    ExpMinusOne: {
        /** Elem */
        isPure: true,
    },
    Factorial: {
        wikidata: 'Q120976',
        isPure: true,
    },
    Floor: {
        isPure: true,
    },
    Gamma: {
        /** Elem */
        isPure: true,
    },
    LogGamma: {
        /** Elem */
        isPure: true,
    },
    Log: {
        /** Elem */
        isPure: true,
    },
    Log2: {
        /** Elem */
        isPure: true,
    },
    Log10: {
        /** Elem */
        isPure: true,
    },
    LogOnePlus: {
        /** Elem */
        isPure: true,
    },
    MachineEpsilon: {
        /*
            The difference between 1 and the next larger floating point number
            
            2^{−52}
            
            See https://en.wikipedia.org/wiki/Machine_epsilon
        */
        isConstant: true,
        value: { num: '2.220446049250313e-16' },
    },
    Multiply: {
        /** Elem */
        wikidata: 'Q40276',
        isAssociative: true,
        isCommutative: true,
        isIdempotent: true,
        isPure: true,
    },
    NotEqual: {
        // Not equal
        wikidata: 'Q28113351',
        isCommutative: true,
        isPure: true,
    },
    Negate: {
        /** Elem */
        wikidata: 'Q715358',
        isPure: true,
    },
    Power: {
        /** Elem */
        wikidata: 'Q33456',
        isCommutative: false,
        isPure: true,
    },
    Round: {
        isPure: true,
    },
    SignGamma: {
        /** Elem */
        /** The sign of the gamma function: -1 or +1 */
        isPure: true,
    },
    Sqrt: {
        /** Elem */
        isPure: true,
    },
    Root: {
        /** Elem */
        isCommutative: false,
        isPure: true,
    },
    Subtract: {
        /** Elem */
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
