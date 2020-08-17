import type { Dictionary } from '../public';

// sec, csc, cot
// sechh, csch, coth,
// arcsec, arccsc, arccot, arcsinh,
// arcsech, arccsch, arccoth,

export const TRIGONOMETRY_DICTIONARY: Dictionary = {
    Arcosh: {
        /** Elem */
        isPure: true,
    },
    Arccos: {
        /** Elem */
        isPure: true,
    },
    Arcsin: {
        /** Elem */
        isPure: true,
    },
    Arctan: {
        /** Elem */
        isPure: true,
    },
    Arctan2: {
        /** Elem */
        isPure: true,
    },
    Arsinh: {
        /** Elem */
        isPure: true,
    },
    Artanh: {
        /** Elem */
        isPure: true,
    },
    Cos: {
        /** Elem */
        isPure: true,
    },
    Degrees: {
        /* = Pi / 180 */
        isConstant: true,
        value: { num: '0.017453292519943295769236907' },
    },
    FromPolarCoordinates: {
        /* converts (radius, angle) -> (x, y) */
        isPure: true,
    },
    Haversine: {
        /** = sin(z/2)^2 */
        isPure: true,
    },
    Hypot: {
        /** Elem */
        // sqrt(x*x + y*y)
        isPure: true,
    },
    InverseHaversine: {
        /** = 2 * Arcsin(Sqrt(z)) */
        isPure: true,
    },
    Sin: {
        /** Elem */
        isPure: true,
    },
    Sinh: {
        /** Elem */
        isPure: true,
    },
    Tan: {
        /** Elem */
        isPure: true,
    },
    Tanh: {
        /** Elem */
        isPure: true,
    },
    ToPolarCoordinates: {
        /* converts (x, y) -> (radius, angle) */
        isPure: true,
    },
};
