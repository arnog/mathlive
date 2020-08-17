import { LatexDictionary, Scanner, Emitter } from './public';
import { Expression } from '../public';
import { NOTHING, SEQUENCE, LIST } from '../dictionary/dictionary';
import { getFunctionName, getArgs, getArg, getFunctionHead } from '../utils';

export const DEFINITIONS_OTHERS: LatexDictionary = [
    {
        name: 'Overscript',
        trigger: { infix: '\\overset' },
        precedence: 700, // @todo: not in MathML
    },
    {
        name: 'Underscript',
        trigger: { infix: '\\underset' },
        precedence: 700, // @todo: not in MathML
    },
    {
        name: 'Increment',
        trigger: { postfix: ['+', '+'] },
        precedence: 880,
    },
    {
        name: 'Decrement',
        trigger: { postfix: ['-', '-'] },
        precedence: 880,
    },
    {
        name: 'PreIncrement',
        trigger: { prefix: ['+', '+'] },
        precedence: 880,
    },
    {
        name: 'PreDecrement',
        trigger: { prefix: ['-', '-'] },
        precedence: 880,
    },
    {
        name: 'Ring', // Aka 'Composition', i.e. function composition
        trigger: { infix: '\\circ' },
        precedence: 265,
    },
    {
        // @todo: if lhs is a list/tensor
        name: 'Transpose',
        trigger: { superfix: 'T' },
    },
    {
        // @todo: if lhs is a list/tensor
        name: 'ConjugateTranspose',
        trigger: { superfix: 'H' },
    },
    {
        name: 'StringJoin', // @todo From Mathematica...?
        trigger: { infix: ['\\lt', '\\gt'] },
        precedence: 780,
    },
    {
        name: 'Starstar',

        trigger: { infix: ['\\star', '\\star'] },
        precedence: 780,
    },
    {
        // Partial derivative using a variation of the Euler notation: `∂_xf(x)`
        // (the Euler notation uses `D_1f(x)` where "1" is for the first variable
        // For the Leibniz notation see 'Divide' that handles `∂f/∂x`
        name: 'PartialDerivative', // PartialDerivative(expr, {lists of vars}, degree)
        trigger: { prefix: '\\partial' },
        parse: (
            _lhs: Expression,
            scanner: Scanner,
            _minPrec: number,
            _latex: string
        ): [Expression | null, Expression | null] => {
            let done = false;
            let sup: Expression = NOTHING;
            let sub: Expression = NOTHING;
            while (!done) {
                scanner.skipSpace();
                if (scanner.match('_')) {
                    sub = scanner.matchRequiredLatexArgument();
                } else if (scanner.match('^')) {
                    sup = scanner.matchRequiredLatexArgument();
                } else {
                    done = true;
                }
            }
            if (getFunctionName(sub) === SEQUENCE) {
                sub = [LIST, ...getArgs(sub)];
            }
            let rhs = scanner.matchRequiredLatexArgument() ?? NOTHING;
            if (rhs !== NOTHING) {
                rhs = [rhs, ...scanner.matchArguments('group')];
            }
            return [null, ['PartialDerivative', rhs, sub, sup]];
        },
        emit: (emitter: Emitter, expr: Expression): string => {
            let result = '\\partial';
            const fn = getArg(expr, 1);
            const vars = getArg(expr, 2);
            const degree = getArg(expr, 3);
            if (vars !== null && vars !== NOTHING) {
                if (getFunctionHead(vars) === LIST) {
                    result +=
                        '_{' + emitter.emit([SEQUENCE, ...getArgs(vars)]) + '}';
                } else {
                    result += '_{' + emitter.emit(vars) + '}';
                }
            }
            if (degree !== null && degree !== NOTHING) {
                result += '^{' + emitter.emit(degree) + '}';
            }
            if (fn !== null && fn !== NOTHING) {
                result += emitter.emit(fn);
            }
            return result;
        },
        precedence: 740,
    },
    {
        name: 'OverBar',
        trigger: { symbol: '\\overline' },
        requiredLatexArg: 1,
    },
    {
        name: 'UnderBar',
        trigger: { symbol: '\\underline' },
        requiredLatexArg: 1,
    },
    {
        name: 'OverVector',
        trigger: { symbol: '\\vec' },
        requiredLatexArg: 1,
    },
    {
        name: 'OverTile',
        trigger: { symbol: '\\tilde' },
        requiredLatexArg: 1,
    },
    {
        name: 'OverHat',
        trigger: { symbol: '\\hat' },
        requiredLatexArg: 1,
    },
    {
        name: 'OverHat',
        trigger: { symbol: '\\hat' },
        requiredLatexArg: 1,
    },
    {
        name: 'OverRightArrow',
        trigger: { symbol: '\\overrightarrow' },
        requiredLatexArg: 1,
    },
    {
        name: 'OverLeftArrow',
        trigger: { symbol: '\\overleftarrow' },
        requiredLatexArg: 1,
    },
    {
        name: 'OverRightDoubleArrow',
        trigger: { symbol: '\\Overrightarrow' },
        requiredLatexArg: 1,
    },
    {
        name: 'OverLeftHarpoon',
        trigger: { symbol: '\\overleftharpoon' },
        requiredLatexArg: 1,
    },
    {
        name: 'OverRightHarpoon',
        trigger: { symbol: '\\overrightharpoon' },
        requiredLatexArg: 1,
    },
    {
        name: 'OverLeftRightArrow',
        trigger: { symbol: '\\overleftrightarrow' },
        requiredLatexArg: 1,
    },
    {
        name: 'OverBrace',
        trigger: { symbol: '\\overbrace' },
        requiredLatexArg: 1,
    },
    {
        name: 'OverLineSegment',
        trigger: { symbol: '\\overlinesegment' },
        requiredLatexArg: 1,
    },
    {
        name: 'OverGroup',
        trigger: { symbol: '\\overgroup' },
        requiredLatexArg: 1,
    },

    // {
    //     name: '',
    //     trigger: { symbol: '\\mathring' },
    //     requiredLatexArg: 1,
    // },
    // {
    //     name: '',
    //     trigger: { symbol: '\\check' },
    //     requiredLatexArg: 1,
    // },
];

// https://reference.wolfram.com/language/tutorial/TextualInputAndOutput.html
