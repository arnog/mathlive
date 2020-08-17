import { LatexDictionary } from './public';

export const DEFINITIONS_INEQUALITIES: LatexDictionary = [
    {
        name: 'NotLess',
        trigger: { infix: ['!', '<'] },
        associativity: 'right',
        precedence: 246,
    },
    {
        name: 'NotLess',
        trigger: { infix: '\\nless' },
        associativity: 'right',
        precedence: 246,
    },
    {
        name: 'Less',
        trigger: { infix: '<' },
        associativity: 'right',
        precedence: 245,
    },
    {
        name: 'Less',
        trigger: { infix: '\\lt' },
        associativity: 'right',
        precedence: 245,
    },
    {
        name: 'LessEqual',
        trigger: { infix: ['<', '='] },
        associativity: 'right',
        precedence: 241,
    },
    {
        name: 'LessEqual',
        trigger: { infix: '\\le' },
        associativity: 'right',
        precedence: 241,
    },
    {
        name: 'LessEqual',
        trigger: { infix: '\\leq' },
        associativity: 'right',
        precedence: 241,
    },
    {
        name: 'LessEqual',
        trigger: { infix: '\\leqslant' },
        associativity: 'right',
        precedence: 265, // Note different precendence than `<=` as per MathML
    },
    {
        name: 'LessNotEqual',
        trigger: { infix: '\\lneqq' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'NotLessNotEqual',
        trigger: { infix: '\\nleqq' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'LessOverEqual',
        trigger: { infix: '\\leqq' },
        associativity: 'right',
        precedence: 265,
    },
    {
        name: 'GreaterOverEqual',
        trigger: { infix: '\\geqq' },
        associativity: 'right',
        precedence: 265,
    },
    {
        name: 'Equal',
        trigger: { infix: '=' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'StarEqual',
        trigger: { infix: ['*', '='] },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'StarEqual',
        trigger: { infix: ['\\star', '='] },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'PlusEqual',
        trigger: { infix: ['+', '='] },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'MinusEqual',
        trigger: { infix: ['-', '='] },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'SlashEqual',
        trigger: { infix: ['/', '='] },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'EqualEqual',
        trigger: { infix: ['=', '='] },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'EqualEqualEqual',
        trigger: { infix: ['=', '=', '='] },
        associativity: 'right',
        precedence: 265,
    },
    {
        name: 'TildeFullEqual', // MathML: approximately equal to
        trigger: { infix: '\\cong' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'NotTildeFullEqual', // MathML: approximately but not actually equal to
        trigger: { infix: '\\ncong' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'Assign',
        trigger: { infix: [':', '='] },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'Assign',
        trigger: { infix: '\\coloneq' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'Approx', // Note: Mathematica TildeTilde
        trigger: { infix: '\\approx' },
        associativity: 'right',
        precedence: 247,
    },
    {
        name: 'NotApprox', // Note: Mathematica TildeTilde
        trigger: { infix: '\\approx' },
        associativity: 'right',
        precedence: 247,
    },
    {
        name: 'ApproxEqual', // Note: Mathematica TildeEqual, MathML: `asymptotically equal to`
        trigger: { infix: '\\approxeq' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'NotApproxEqual', // Note: Mathematica NotTildeEqual
        trigger: { infix: ['!', '\\approxeq'] }, // Note: no Latex symbol for char U+2249
        associativity: 'right',
        precedence: 250,
    },
    {
        name: 'Unequal',
        trigger: { infix: '\\ne' },
        associativity: 'right',
        precedence: 255,
    },
    {
        name: 'Unequal',
        trigger: { infix: ['!', '='] },
        associativity: 'right',
        precedence: 260, // Note different precendence than \\ne per MathML
    },
    {
        name: 'GreaterEqual',
        trigger: { infix: '\\ge' },
        associativity: 'right',
        precedence: 242, // Note: different precendence than `>=` as per MathML
    },
    {
        name: 'GreaterEqual',
        trigger: { infix: '\\geq' },
        associativity: 'right',
        precedence: 242, // Note: different precendence than `>=` as per MathML
    },
    {
        name: 'GreaterEqual',
        trigger: { infix: ['>', '='] },
        associativity: 'right',
        precedence: 243,
    },
    {
        name: 'GreaterEqual',
        trigger: { infix: '\\geqslant' },
        associativity: 'right',
        precedence: 265, // Note: different precendence than `>=` as per MathML
    },
    {
        name: 'GreaterNotEqual',
        trigger: { infix: '\\gneqq' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'NotGreaterNotEqual',
        trigger: { infix: '\\ngeqq' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'Greater',
        trigger: { infix: '>' },
        associativity: 'right',
        precedence: 245,
    },
    {
        name: 'Greater',
        trigger: { infix: '\\gt' },
        associativity: 'right',
        precedence: 245,
    },
    {
        name: 'NotGreater',
        trigger: { infix: '\\ngtr' },
        associativity: 'right',
        precedence: 244,
    },
    {
        name: 'NotGreater',
        trigger: { infix: ['!', '>'] },
        associativity: 'right',
        precedence: 244,
    },
    {
        name: 'RingEqual',
        trigger: { infix: '\\circeq' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'TriangleEqual', // MathML: delta equal to
        trigger: { infix: '\\triangleq' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'DotEqual', // MathML: approaches the limit
        trigger: { infix: '\\doteq' },
        associativity: 'right',
        precedence: 265,
    },
    {
        name: 'DotEqualDot', // MathML: Geometrically equal
        trigger: { infix: '\\doteqdot' },
        associativity: 'right',
        precedence: 265,
    },
    {
        name: 'FallingDotEqual', // MathML: approximately equal to or the image of
        trigger: { infix: '\\fallingdotseq' },
        associativity: 'right',
        precedence: 265,
    },
    {
        name: 'RisingDotEqual', // MathML: image of or approximately equal to
        trigger: { infix: '\\fallingdotseq' },
        associativity: 'right',
        precedence: 265,
    },
    {
        name: 'QuestionEqual',
        trigger: { infix: '\\questeq' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'Equivalent', // MathML: identical to, Mathematica: Congruent
        trigger: { infix: '\\equiv' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'MuchLess',
        trigger: { infix: '\\ll' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'MuchGreater',
        trigger: { infix: '\\gg' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'Precedes',
        trigger: { infix: '\\prec' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'Succeeds',
        trigger: { infix: '\\succ' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'PrecedesEqual',
        trigger: { infix: '\\preccurlyeq' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'SucceedsEqual',
        trigger: { infix: '\\curlyeqprec' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'NotPrecedes',
        trigger: { infix: '\\nprec' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'NotSucceeds',
        trigger: { infix: '\\nsucc' },
        associativity: 'right',
        precedence: 260,
    },
    {
        name: 'ElementOf',
        trigger: { infix: '\\in' },
        associativity: 'right',
        precedence: 240,
    },
    {
        name: 'NotElementOf',
        trigger: { infix: '\\notin' },
        associativity: 'right',
        precedence: 240,
    },
    {
        name: 'Contains',
        trigger: { infix: '\\ni' },
        associativity: 'right',
        precedence: 160, // As per MathML, lower precedence
    },
    {
        name: 'Subset',
        trigger: { infix: '\\subset' },
        associativity: 'right',
        precedence: 240,
    },
    {
        name: 'SquareSubset', // MathML: square image of
        trigger: { infix: '\\sqsubset' },
        associativity: 'right',
        precedence: 265,
    },
    {
        name: 'SquareSubsetEqal', // MathML: square image of or equal to
        trigger: { infix: '\\sqsubseteq' },
        associativity: 'right',
        precedence: 265,
    },
    {
        name: 'Superset',
        trigger: { infix: '\\supset' },
        associativity: 'right',
        precedence: 240,
    },
    {
        name: 'SquareSuperset', // MathML: square original of
        trigger: { infix: '\\sqsupset' },
        associativity: 'right',
        precedence: 265,
    },
    {
        name: 'SquareSupersetEuqal', // MathML: square original of or equal
        trigger: { infix: '\\sqsupseteq' },
        associativity: 'right',
        precedence: 265,
    },
    {
        name: 'NotSubset',
        trigger: { infix: '\\nsubset' },
        associativity: 'right',
        precedence: 240,
    },
    {
        name: 'NotSuperset',
        trigger: { infix: '\\nsupset' },
        associativity: 'right',
        precedence: 240,
    },
    {
        name: 'SubsetEqual',
        trigger: { infix: '\\subseteq' },
        associativity: 'right',
        precedence: 240,
    },
    {
        name: 'SupersetEqual',
        trigger: { infix: '\\supseteq' },
        associativity: 'right',
        precedence: 240,
    },
    {
        name: 'NotSubsetNotEqual',
        trigger: { infix: '\\nsubseteq' },
        associativity: 'right',
        precedence: 240,
    },
    {
        name: 'NotSupersetNotEqual',
        trigger: { infix: '\\nsupseteq' },
        associativity: 'right',
        precedence: 240,
    },
    {
        name: 'SubsetNotEqual',
        trigger: { infix: '\\subsetneq' },
        associativity: 'right',
        precedence: 240,
    },
    {
        name: 'SupersetNotEqual',
        trigger: { infix: '\\supsetneq' },
        associativity: 'right',
        precedence: 240,
    },
    {
        name: 'SubsetNotEqual',
        trigger: { infix: '\\varsupsetneqq' },
        associativity: 'right',
        precedence: 240,
    },
    {
        name: 'SupersetNotEqual',
        trigger: { infix: '\\varsupsetneq' },
        associativity: 'right',
        precedence: 240,
    },
    {
        name: 'Between',
        trigger: { infix: '\\between' },
        associativity: 'right',
        precedence: 265,
    },
];
