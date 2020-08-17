import { LatexDictionary } from './public';

export const DEFINITIONS_ALGEBRA: LatexDictionary = [
    {
        name: 'To',
        trigger: { infix: '\\to' },
        precedence: 270, // MathML rightwards arrow
    },
];
