import type { Dictionary } from '../public';

// Set operations:
// https://query.wikidata.org/#PREFIX%20wd%3A%20%3Chttp%3A%2F%2Fwww.wikidata.org%2Fentity%2F%3E%0APREFIX%20wdt%3A%20%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fdirect%2F%3E%0A%0ASELECT%20DISTINCT%20%3Fitem%0AWHERE%20%7B%0A%20%20%20%20%3Fitem%20wdt%3AP31%2a%20wd%3AQ1964995%0A%7D%0A

export const SETS_DICTIONARY: Dictionary = {
    CartesianProduct: {
        // Aka the product set, the set direct product or cross product
        // Notation: \times
        wikidata: 'Q173740',
    },
    // empty-set
    Intersection: {
        // notation: \Cap
        wikidata: 'Q185359',
    },
    Complement: {
        // Return the element of the first argument that are not in any of
        // the subsequent lists
        wikidata: 'Q242767',
    },
    Union: {
        // Works on set, but can also work on lists
        wikidata: 'Q185359',
    },
    // disjoint union Q842620 ⊔
    SymmetricDifference: {
        // symmetric difference = disjunctive union  (circled minus)
        /** = Union(Complemenent(a, b), Complement(b, a) */
        /** Corresponds to XOR in boolean logic */
        wikidata: 'Q1147242',
    },
    // set-diff / minus
    // subset
    // Z, P, N, Q, R, C
};
