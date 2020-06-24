import {
    LatexNumberOptions,
    ParseLatexOptions,
    EmitLatexOptions,
} from './public';
import { MULTIPLY, POWER, ADD } from '../dictionary';

export const DEFAULT_LATEX_NUMBER_OPTIONS: Required<LatexNumberOptions> = {
    precision: 15, // assume 2^53 bits floating points
    decimalMarker: '.',
    groupSeparator: '\\,', // for thousands, etc...
    exponentProduct: '\\cdot',
    beginExponentMarker: '10^{', // could be 'e'
    endExponentMarker: '}',
    arcSeparator: '\\,',
    notation: 'auto',
    imaginaryNumber: '\\imaginaryI',
    beginRepeatingDigits: '\\overline{',
    endRepeatingDigits: '}',
};

export const DEFAULT_PARSE_LATEX_OPTIONS: Required<ParseLatexOptions> = {
    ...DEFAULT_LATEX_NUMBER_OPTIONS,

    invisibleOperator: MULTIPLY,
    superscriptOperator: POWER,
    subscriptOperator: '',
    skipSpace: true,

    parseArgumentsOfUnknownLatexCommands: true,
    parseNumbers: true,
    promoteUnknownSymbols: /^[a-zA-Z]$/,
    promoteUnknownFunctions: /^[f|g]$/,
    invisiblePlusOperator: ADD,
    dictionary: [],
};

export const DEFAULT_EMIT_LATEX_OPTIONS: Required<EmitLatexOptions> = {
    ...DEFAULT_LATEX_NUMBER_OPTIONS,
    invisibleMultiply: '', // '\\cdot',
    invisiblePlus: '', // '+',
    // invisibleApply: '',

    multiply: '\\times',

    // openGroup: '(',
    // closeGroup: ')',
    // divide: '\\frac{#1}{#2}',
    // subtract: '#1-#2',
    // add: '#1+#2',
    // negate: '-#1',
    // squareRoot: '\\sqrt{#1}',
    // nthRoot: '\\sqrt[#2]{#1}',

    dictionary: [],
};
