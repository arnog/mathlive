/* eslint-disable no-debugger */
// Busted: waiting for https://github.com/facebook/jest/issues/10208

import type { Expression, Form } from '../src/math-json/public';
import { parseLatex, emitLatex } from '../src/math-json/math-json';
import {
    GROUP,
    INVERSE_FUNCTION,
} from '../src/math-json/dictionary/dictionary';

beforeEach(() => {
    jest.spyOn(console, 'assert').mockImplementation((assertion) => {
        if (!assertion) debugger;
    });
    jest.spyOn(console, 'log').mockImplementation(() => {
        debugger;
    });
    jest.spyOn(console, 'warn').mockImplementation(() => {
        debugger;
    });
    jest.spyOn(console, 'info').mockImplementation(() => {
        debugger;
    });
});

// Primitives...
const MULTIPLY = 'Multiply';
const DIVIDE = 'Divide';
const ADD = 'Add';
const POWER = 'Power';
const NEGATE = 'Negate';
const SUBTRACT = 'Subtract';
const LATEX = 'Latex';

const PI = 'PI';
// const DERIVATIVE = 'derivative';

function expression(latex: string, options?: { form: Form }): Expression {
    let errors: string[] = [];
    const result = parseLatex(latex, {
        onError: (err) =>
            errors.push(err.code + (err.arg ? ' ' + err.arg : '')),
        form: options?.form ?? 'canonical',
    });
    errors = errors.filter((x) => !/^unknown-symbol /.test(x));
    if (errors.length !== 0) return [result, ...errors];
    return result;
}

function latex(expr: Expression): string {
    let errors: string[] = [];
    const result = emitLatex(expr, {
        onError: (err) =>
            errors.push(err.code + (err.arg ? ' ' + err.arg : '')),
    });
    errors = errors.filter((x) => !/^unknown-symbol /.test(x));
    if (errors.length !== 0) return errors.join('\n');
    return result;
}

function expressionError(latex: string): string | string[] {
    const errors: string[] = [];
    parseLatex(latex, {
        onError: (err) =>
            errors.push(err.code + (err.arg ? ' ' + err.arg : '')),
    });
    return errors.length === 1 ? errors[0] : errors;
}

function rawExpression(latex: string): Expression {
    return JSON.stringify(
        parseLatex(latex, {
            form: 'full',
            invisibleOperator: '',
            parseArgumentsOfUnknownLatexCommands: false,
            invisiblePlusOperator: '',
            promoteUnknownSymbols: /./,
            dictionary: [],
        })
    );
}

function printExpression(expr: Expression): string {
    if (Array.isArray(expr)) {
        return '[' + expr.map((x) => printExpression(x)).join(', ') + ']';
    }
    if (typeof expr === 'string') {
        if (!expr) return "''";
        return "'" + expr + "'";
    }
    if (typeof expr === 'object') {
        return (
            '{' +
            Object.keys(expr)
                .map((x) => x + ': ' + printExpression(expr[x]))
                .join(', ') +
            '}'
        );
    }
    return expr.toString();
}

expect.addSnapshotSerializer({
    // test: (val): boolean => Array.isArray(val) || typeof val === 'object',
    test: (_val): boolean => true,

    serialize: (
        val,
        _config,
        _indentation,
        _depth,
        _refs,
        _printer
    ): string => {
        return printExpression(val);
    },
});

describe('NO DICTIONARY/NO DEFAULTS', () => {
    test('Parsing', () => {
        expect(rawExpression('')).toMatchInlineSnapshot(`'""'`);
        expect(rawExpression('1+x')).toMatchInlineSnapshot(
            `'["Latex",1,"+","x"]'`
        );
        expect(rawExpression('x^2')).toMatchInlineSnapshot(
            `'["Latex","x","^",2]'`
        );
        expect(rawExpression('\\frac{1}{x}')).toMatchInlineSnapshot(
            `'["Latex","\\\\frac","<{>",1,"<}>","<{>","x","<}>"]'`
        );
        expect(
            rawExpression('\\sqrt{(1+x_0)}=\\frac{\\pi^2}{2}')
        ).toMatchInlineSnapshot(
            `'["Latex","\\\\sqrt","<{>","(",1,"+","x","_",0,")","<}>","=","\\\\frac","<{>","\\\\pi","^",2,"<}>","<{>",2,"<}>"]'`
        );
    });
});

describe('EMITTING', () => {
    test('Numbers', () => {
        expect(latex(1)).toMatchInlineSnapshot(`'1'`);
        expect(latex(+1)).toMatchInlineSnapshot(`'1'`);
        expect(latex(-123)).toMatchInlineSnapshot(`'-123'`);
        expect(latex(-1234567.89)).toMatchInlineSnapshot(`'-1\\,234\\,567.89'`);
        expect(latex(-1234567.89e-123)).toMatchInlineSnapshot(
            `'-1.234\\,567\\,89\\cdot10^{-117}'`
        );
        expect(latex({ num: '-1234567.890e-123' })).toMatchInlineSnapshot(
            `'-1\\,234\\,567.890\\\\cdot10^{-123}'`
        );
        expect(
            latex({ num: '-123456789012345678901234567890.890e-123' })
        ).toMatchInlineSnapshot(
            `'-123\\,456\\,789\\,012\\,345\\,678\\,901\\,234\\,567\\,890\\cdot10^{-123}'`
        );
        expect(latex({ num: 'Infinity' })).toMatchInlineSnapshot(`'\\infty'`);
        expect(latex({ num: '-Infinity' })).toMatchInlineSnapshot(`'-\\infty'`);
        expect(latex({ num: 'NaN' })).toMatchInlineSnapshot(`'\\mathtt{NaN}'`);
        expect(latex({ num: 'Infinity' })).toMatchInlineSnapshot(`'\\infty'`);

        // Repeating patern
        expect(
            latex({ num: '3.123456785678567856785678567856785678' })
        ).toMatchInlineSnapshot(`'3.123\\,456\\,785\\,678\\,5\\ldots'`);

        expect(
            latex({ num: '0.1234567872368237462387623876' })
        ).toMatchInlineSnapshot(`'0.123\\,456\\,787\\,236\\,8\\ldots'`);

        expect(expression('  - 1 2')).toMatchInlineSnapshot(`-2`);
        expect(expression('-123,456.789,012')).toMatchInlineSnapshot(
            `['Subsequence', -123, 456.789, {num: '012'}]`
        );
        expect(expression('-1,23456.7890,12')).toMatchInlineSnapshot(
            `['Subsequence', -1, {num: '23456.7890'}, 12]`
        );
    });
    // Leave space between pi and x
    test('Spacing', () => {
        expect(latex([MULTIPLY, PI, 'x'])).toMatchInlineSnapshot(`'\\pi x'`);
    });

    test('Symbols', () => {
        expect(latex('x')).toMatchInlineSnapshot(`'x'`);
        expect(latex('symbol')).toMatchInlineSnapshot(
            `'\\operatorname{symbol}'`
        );
        expect(latex({ sym: 'x' })).toMatchInlineSnapshot(`'x'`);
        expect(latex({ sym: 'symbol' })).toMatchInlineSnapshot(
            `'\\operatorname{symbol}'`
        );
    });

    test('Functions', () => {
        expect(latex(['f', 'x', 1, 0])).toMatchInlineSnapshot(`'f(x, 1, 0)'`);
        expect(latex(['\\foo', 'x', 1, 0])).toMatchInlineSnapshot(
            `'\\foo{x}{1}{0}'`
        );
        expect(latex(['\\frac', 'n', 4])).toMatchInlineSnapshot(
            `'\\frac{n}{4}'`
        );

        expect(expression('\\foo[0]{1}{2}')).toMatchInlineSnapshot(
            `['\\foo', 1, 2, 0]`
        );

        // Head as expression
        expect(latex([['g', 'f'], 'x', 1, 0])).toMatchInlineSnapshot(
            `'g(f)(x, 1, 0)'`
        );
    });

    test('Basic operations', () => {
        expect(latex([ADD, 'a', 'b'])).toMatchInlineSnapshot(`'a+b'`);
        // Invisible operator
        expect(latex([MULTIPLY, 'a', 'b'])).toMatchInlineSnapshot(`'ab'`);
        expect(
            latex([MULTIPLY, [ADD, 'x', 1], [SUBTRACT, 'x', 1]])
        ).toMatchInlineSnapshot(`'(x+1)(x-1)'`);
        expect(
            latex([ADD, [MULTIPLY, 'x', -1], [MULTIPLY, 'x', 2]])
        ).toMatchInlineSnapshot(`'-x+x\\times2'`);
        expect(latex([SUBTRACT, [NEGATE, 'x'], -1])).toMatchInlineSnapshot(
            `'-x--1'`
        );
    });
    test('Power', () => {
        expect(latex([POWER, 'x', -2])).toMatchInlineSnapshot(
            `'\\frac{1}{x^{2}}'`
        );
        expect(latex([POWER, 'x', [DIVIDE, 1, 2]])).toMatchInlineSnapshot(
            `'\\sqrt{x}'`
        );
        expect(
            latex([POWER, [ADD, 'x', 1], [DIVIDE, 1, 2]])
        ).toMatchInlineSnapshot(`'\\sqrt{x+1}'`);
        expect(
            latex([POWER, [MULTIPLY, 2, 'x'], [DIVIDE, 1, 2]])
        ).toMatchInlineSnapshot(`'\\sqrt{2x}'`);
        expect(
            latex([POWER, [MULTIPLY, 2, 'x'], [SUBTRACT, 1, 'n']])
        ).toMatchInlineSnapshot(`'(2x)^{1-n}'`);
    });
});

describe('BASIC PARSING', () => {
    test('', () => {
        expect(expression('')).toMatchInlineSnapshot(`''`);
        expect(expression('1')).toMatchInlineSnapshot(`1`);
        expect(expression('2{xy}')).toMatchInlineSnapshot(
            `[2, 'syntax-error']`
        ); // @todo: interpret as a group?
    });
});

describe('NUMBERS', () => {
    test('Parsing', () => {
        expect(expression('1')).toMatchInlineSnapshot(`1`);
        expect(expression('-1')).toMatchInlineSnapshot(`-1`);
        expect(expression('1.0')).toMatchInlineSnapshot(`{num: '1.0'}`);
        expect(expression('-1.0')).toMatchInlineSnapshot(`{num: '-1.0'}`);
        expect(expression('-1.1234')).toMatchInlineSnapshot(`-1.1234`);
        expect(expression('-1.1234e5')).toMatchInlineSnapshot(
            `{num: '-1.1234e5'}`
        );
        expect(expression('-1.1234E5')).toMatchInlineSnapshot(
            `{num: '-1.1234e5'}`
        );
        expect(expression('-1.1234e-5')).toMatchInlineSnapshot(
            `{num: '-1.1234e-5'}`
        );
        // Invalid expression (the argument of "num" should be a string)
        expect(latex(({ num: 4 } as any) as Expression)).toMatchInlineSnapshot(
            `'4'`
        );
        expect(expression('3\\times10^4')).toMatchInlineSnapshot(
            `{num: '3e4'}`
        );
    });
    test('Parsing plus/minus', () => {
        expect(expression('+1')).toMatchInlineSnapshot(`1`);
        expect(expression('++1')).toMatchInlineSnapshot(`['PreIncrement', 1]`);
        expect(expression('-1')).toMatchInlineSnapshot(`-1`);
        expect(expression('--1')).toMatchInlineSnapshot(`['PreDecrement', 1]`);
        expect(expression('-+-1')).toMatchInlineSnapshot(
            `['Multiply', -1, ['Negate', 1]]`
        );
    });
    test('Parsing whitepsace with number sign', () => {
        expect(expression('  1')).toMatchInlineSnapshot(`1`);
        expect(expression('+ 1')).toMatchInlineSnapshot(`1`);
        expect(expression(' -  +   -   -1')).toMatchInlineSnapshot(
            `['Multiply', -1, ['Negate', ['Negate', 1]]]`
        );
    });
    test('Parsing digits', () => {
        // Number with exactly three digits after the decimal point
        expect(expression('3.423e4')).toMatchInlineSnapshot(`{num: '3.423e4'}`);
        // Number with more than three, less than six digits after the decimal point
        expect(expression('3.42334e4')).toMatchInlineSnapshot(
            `{num: '3.42334e4'}`
        );
        // Number with more then 6 digits after the decimal point
        expect(expression('3.424242334e4')).toMatchInlineSnapshot(
            `{num: '3.424242334e4'}`
        );
    });

    test('Large numbers', () => {
        expect(expression('421.35d+1000')).toMatchInlineSnapshot(
            `{num: '421.35e1000'}`
        );
        expect(expression('9007199234534554740991')).toMatchInlineSnapshot(
            `{num: '9007199234534554740991'}`
        );
        expect(
            expression('900719923453434553453454740992')
        ).toMatchInlineSnapshot(`{num: '900719923453434553453454740992'}`);
        expect(
            expression(
                '900719923453434553982347938645934876598347659823479234879234867923487692348792348692348769234876923487692348769234876923487634876234876234987692348762348769234876348576453454740992123456789'
            )
        ).toMatchInlineSnapshot(
            `{num: '900719923453434553982347938645934876598347659823479234879234867923487692348792348692348769234876923487692348769234876923487634876234876234987692348762348769234876348576453454740992123456789'}`
        );
        expect(
            expression('31324234.23423143\\times10^{5000}')
        ).toMatchInlineSnapshot(`{num: '31324234.23423143e5000'}`);
    });
    test('Non-finite numbers', () => {
        expect(expression('-\\infty')).toMatchInlineSnapshot(
            `{num: '-Infinity'}`
        );
        expect(expression('2+\\infty')).toMatchInlineSnapshot(
            `['Add', 2, {num: 'Infinity'}]`
        );
        expect(expression('\\infty-\\infty')).toMatchInlineSnapshot(
            `['Add', {num: '-Infinity'}, {num: 'Infinity'}]`
        );
        // Should not be interpreted as infinity
        expect(expression('\\frac{0}{0}')).toMatchInlineSnapshot(
            `['Multiply', 0, ['Power', 0, -1]]`
        );
        expect(latex({ num: 'NaN' })).toMatchInlineSnapshot(`'\\mathtt{NaN}'`);
        expect(latex({ num: 'Infinity' })).toMatchInlineSnapshot(`'\\infty'`);
    });
    test('Not numbers', () => {
        expect(latex('NaN')).toMatchInlineSnapshot(`'\\operatorname{NaN}'`);
        expect(latex(Infinity)).toMatchInlineSnapshot(`'Infinity'`);
        // Invalid expression
        expect(
            latex(({ num: Infinity } as any) as Expression)
        ).toMatchInlineSnapshot(`'Infinity'`);
        expect(latex({ num: 'infinity' })).toMatchInlineSnapshot(
            `'syntax-error {"num":"infinity"}'`
        );
        expect(expression('3\\times x')).toMatchInlineSnapshot(
            `['Multiply', 3, 'x']`
        );
        expect(expression('3\\times10^n')).toMatchInlineSnapshot(
            `['Multiply', 3, ['Power', 10, 'n']]`
        );
        expect(expression('NaN')).toMatchInlineSnapshot(
            `['Multiply', 'N', 'N', 'a']`
        );
    });
    test('Bigints', () => {
        // expect(latex({ num: 12n })).toMatchInlineSnapshot();
        expect(latex({ num: '12n' })).toMatchInlineSnapshot(`'12'`);
        expect(
            latex({
                num:
                    '18734619237861928346123987612981923064237689123876492384769123786412837040123612308964123876412307864012346012837491237864192837641923876419238764123987642198764987162398716239871236912347619238764192387641920836419238764123087641287642n',
            })
        ).toMatchInlineSnapshot(
            `'1.873\\,461\\,923\\,786\\,1\\ldots\\ldots\\cdot10^{235}'`
        );
    });
});

describe('SUPSUB', () => {
    test('Superscript', () => {
        expect(expression('2^2')).toMatchInlineSnapshot(`['Power', 2, 2]`);
        expect(expression('x^t')).toMatchInlineSnapshot(`['Power', 'x', 't']`);
        expect(expression('2^{10}')).toMatchInlineSnapshot(`['Power', 2, 10]`);
        expect(expression('\\pi^2')).toMatchInlineSnapshot(
            `['Power', 'PI', 2]`
        );
        expect(expression('2^23')).toMatchInlineSnapshot(
            `['Multiply', 3, ['Power', 2, 2]]`
        );
        expect(expression('2^\\pi')).toMatchInlineSnapshot(
            `['Power', 2, 'PI']`
        );
        expect(expression('2^\\frac12')).toMatchInlineSnapshot(
            `['Power', 2, ['Power', 2, -1]]`
        );
        expect(expression('2^{3^4}')).toMatchInlineSnapshot(
            `['Power', 2, ['Power', 3, 4]]`
        );
        expect(expression('2^{10}')).toMatchInlineSnapshot(`['Power', 2, 10]`);
        expect(expression('2^{-2}')).toMatchInlineSnapshot(`['Power', 2, -2]`);
        expect(expression('2^3^4')).toMatchInlineSnapshot(
            `['Power', ['Power', 2, 3], 4]`
        ); // @todo: unclear what the right answer is... (and it's invalid Latex)
        expect(expression('2^{3^4}')).toMatchInlineSnapshot(
            `['Power', 2, ['Power', 3, 4]]`
        );
        expect(expression('12^34.5')).toMatchInlineSnapshot(
            `['Multiply', 4.5, ['Power', 12, 3]]`
        );
        expect(expression('x^2')).toMatchInlineSnapshot(`['Power', 'x', 2]`);
        expect(expression('x^{x+1}')).toMatchInlineSnapshot(
            `['Power', 'x', ['Add', 'x', 1]]`
        );
    });
    test('Subscript', () => {
        expect(expression('x_0')).toMatchInlineSnapshot(
            `['Subscript', 'x', 0]`
        ); // @todo: nope...
        expect(expression('x^2_0')).toMatchInlineSnapshot(
            `['Subscript', ['Power', 'x', 2], 0]`
        ); // @todo: nope...
        expect(expression('x_0^2')).toMatchInlineSnapshot(
            `['Power', ['Subscript', 'x', 0], 2]`
        ); // @todo: nope...
        expect(expression('x_{n+1}')).toMatchInlineSnapshot(
            `['Subscript', 'x', ['Add', 'n', 1]]`
        ); // @todo: nope...
        expect(expression('x_n_{+1}')).toMatchInlineSnapshot(
            `['Subscript', ['Subscript', 'x', 'n'], 1]`
        ); // @todo: nope...
    });
    test('Pre-sup, pre-sub', () => {
        expect(expression('_p^qx')).toMatchInlineSnapshot(
            `['', 'syntax-error']`
        ); // @todo: nope...
        expect(expression('_p^qx_r^s')).toMatchInlineSnapshot(
            `['', 'syntax-error']`
        ); // @todo: nope...
        expect(expression('_{p+1}^{q+1}x_{r+1}^{s+1}')).toMatchInlineSnapshot(
            `['', 'syntax-error']`
        ); // @todo: nope...
        expect(
            expression('x{}_{p+1}^{q+1}x_{r+1}^{s+1}')
        ).toMatchInlineSnapshot(`['x', 'syntax-error']`); // @todo: nope...
    });
    test('Sup/Sub groups', () => {
        expect(expression('(x+1)^{n-1}')).toMatchInlineSnapshot(
            `['Power', ['Subsequence', ['Add', 'x', 1]], ['Add', 'n', -1]]`
        );
        expect(expression('(x+1)_{n-1}')).toMatchInlineSnapshot(
            `['Subscript', ['Group', ['Subsequence', ['Add', 'x', 1]]], ['Add', 'n', -1]]`
        ); // @todo: nope...
        expect(expression('(x+1)^n_0')).toMatchInlineSnapshot(
            `['Subscript', ['Power', ['Subsequence', ['Add', 'x', 1]], 'n'], 0]`
        ); // @todo: nope...
        expect(expression('^p_q{x+1}^n_0')).toMatchInlineSnapshot(
            `['', 'expected-operand', 'syntax-error']`
        ); // @todo: nope...
        expect(expression('^{12}_{34}(x+1)^n_0')).toMatchInlineSnapshot(
            `['', 'expected-operand', 'syntax-error']`
        ); // @todo: nope...
    });
    test('Accents', () => {
        expect(expression('\\vec{x}')).toMatchInlineSnapshot(
            `['OverVector', 'x']`
        ); // @todo: nope...
        expect(expression('\\vec{AB}')).toMatchInlineSnapshot(
            `['OverVector', ['Multiply', 'A', 'B']]`
        ); // @todo: nope...
        expect(expression('\\vec{AB}^{-1}')).toMatchInlineSnapshot(
            `['Power', ['OverVector', ['Multiply', 'A', 'B']], -1]`
        ); // @todo: nope...
    });
});
describe('SYMBOLS', () => {
    test('Basic', () => {
        expect(expression('x')).toMatchInlineSnapshot(`'x'`);
        expect(expression('\\alpha')).toMatchInlineSnapshot(`'α'`);
        expect(expression('x\\alpha\\beta')).toMatchInlineSnapshot(
            `['Multiply', 'x', 'α', 'β']`
        );
        expect(expression('x \\beta \\alpha ')).toMatchInlineSnapshot(
            `['Multiply', 'x', 'α', 'β']`
        );
        // Unknown symbol is OK
        expect(expression('\\foo')).toMatchInlineSnapshot(`'\\foo'`);
    });
    test('Symbol expressions', () => {
        expect(expression('2x')).toMatchInlineSnapshot(`['Multiply', 2, 'x']`);
        expect(expression('2x^3')).toMatchInlineSnapshot(
            `['Multiply', 2, ['Power', 'x', 3]]`
        );
    });
    test('Latex concatenation', () => {
        // Letter following command
        expect(expression('\\alpha b')).toMatchInlineSnapshot(
            `['Multiply', 'b', 'α']`
        );
    });
    test('Errors', () => {
        expect(expressionError('=')).toMatchInlineSnapshot(`'syntax-error'`);
        expect(expressionError('x_5')).toMatchInlineSnapshot(`[]`);
    });
});

describe('INVISIBLE OPERATOR', () => {
    test('Invisible product', () => {
        expect(expression('2x')).toMatchInlineSnapshot(`['Multiply', 2, 'x']`);
        expect(expression('2\\times-x')).toMatchInlineSnapshot(
            `['Multiply', -2, 'x']`
        );
        expect(expression('2(x+1)')).toMatchInlineSnapshot(
            `['Multiply', 2, ['Subsequence', ['Add', 'x', 1]]]`
        );
        expect(expression('3\\pi')).toMatchInlineSnapshot(
            `['Multiply', 3, 'PI']`
        );
        expect(expression('\\frac{1}{2}\\pi')).toMatchInlineSnapshot(
            `['Multiply', ['Power', 2, -1], 'PI']`
        );
        expect(expression('2\\sin(x)')).toMatchInlineSnapshot(
            `['Multiply', 2, ['Sin', ['Subsequence', 'x']]]`
        );
        expect(expression('2x\\sin(x)\\frac{1}{2}')).toMatchInlineSnapshot(
            `['Multiply', 2, ['Power', 2, -1], 'x', ['Sin', ['Subsequence', 'x']]]`
        );
        expect(expression('3\\pi5')).toMatchInlineSnapshot(
            `['Multiply', 3, 5, 'PI']`
        );
        expect(expression('2\\times-x')).toMatchInlineSnapshot(
            `['Multiply', -2, 'x']`
        );
    });
    test('Invisible Plus', () => {
        expect(expression('2\\frac{3}{4}')).toMatchInlineSnapshot(
            `['Add', 2, ['Multiply', 3, ['Power', 4, -1]]]`
        );
        expect(expression('2\\frac{a}{b}')).toMatchInlineSnapshot(
            `['Add', ['Multiply', 'a', ['Power', 'b', -1]], 2]`
        );
    });
});

describe('OPERATORS', () => {
    test('Basic', () => {
        expect(expression('3+5')).toMatchInlineSnapshot(`['Add', 3, 5]`);
        expect(expression('-2-1')).toMatchInlineSnapshot(`['Add', -2, -1]`);
        expect(expression('a+b')).toMatchInlineSnapshot(`['Add', 'a', 'b']`);
        expect(expression('3\\times5')).toMatchInlineSnapshot(
            `['Multiply', 3, 5]`
        );
        expect(expression('13\\times15')).toMatchInlineSnapshot(
            `['Multiply', 13, 15]`
        );
    });
    test('Prefix', () => {
        expect(expression('-1')).toMatchInlineSnapshot(`-1`);
        expect(expression('-x')).toMatchInlineSnapshot(`['Multiply', -1, 'x']`);
        expect(expression('-ab')).toMatchInlineSnapshot(
            `['Multiply', -1, 'a', 'b']`
        );
        expect(expression('-(ab)')).toMatchInlineSnapshot(
            `['Multiply', -1, ['Subsequence', ['Multiply', 'a', 'b']]]`
        );
        expect(expression('-x-1')).toMatchInlineSnapshot(
            `['Add', ['Multiply', -1, 'x'], -1]`
        );
        expect(expression('-(x+1)')).toMatchInlineSnapshot(
            `['Multiply', -1, ['Subsequence', ['Add', 'x', 1]]]`
        );
        expect(expression('-x+(-(x+1))')).toMatchInlineSnapshot(
            `['Add', ['Multiply', -1, 'x'], ['Subsequence', ['Multiply', -1, ['Subsequence', ['Add', 'x', 1]]]]]`
        );
        expect(
            expression('-\\frac{-x+2\\times x}{-2\\times x + 1}')
        ).toMatchInlineSnapshot(
            `['Multiply', -1, ['Power', ['Add', ['Multiply', -2, 'x'], 1], -1], ['Add', ['Multiply', 2, 'x'], ['Negate', 'x']]]`
        );
    });

    test('Infix-prefix associative', () => {
        expect(expression('2+3x+4')).toMatchInlineSnapshot(
            `['Add', ['Multiply', 3, 'x'], 2, 4]`
        );
        expect(expression('-5-3-2')).toMatchInlineSnapshot(
            `['Add', ['Multiply', -1, ['Add', -2, 3]], -5]`
        );
        expect(expression('13+15+17')).toMatchInlineSnapshot(
            `['Add', 13, 15, 17]`
        );
        expect(expression('+23')).toMatchInlineSnapshot(`23`);
        expect(expression('+\\pi')).toMatchInlineSnapshot(`'PI'`);
        expect(expression('-1-x(2)')).toMatchInlineSnapshot(
            `['Add', ['Multiply', -1, ['Subsequence', 2], 'x'], -1]`
        );
    });
    test('Postfix', () => {
        expect(expression('-2!-2')).toMatchInlineSnapshot(
            `['Add', ['Multiply', -1, ['Factorial', 2]], -2]`
        );
        expect(expression('-2!')).toMatchInlineSnapshot(
            `['Multiply', -1, ['Factorial', 2]]`
        );
        expect(expression('2+n!')).toMatchInlineSnapshot(
            `['Add', ['Factorial', 'n'], 2]`
        );
        expect(expression('x!!!')).toMatchInlineSnapshot(
            `['Factorial', ['Factorial2', 'x']]`
        );
    });
    test('Errors', () => {
        expect(expressionError('+')).toMatchInlineSnapshot(`'syntax-error'`);
        expect(expressionError('12+')).toMatchInlineSnapshot(`[]`);
        expect(expressionError('\\times')).toMatchInlineSnapshot(`[]`);
        expect(expressionError('\\times5')).toMatchInlineSnapshot(`[]`);
        expect(expressionError('3\\times\\times5')).toMatchInlineSnapshot(`[]`);
    });
});

describe('MINUS OPERATOR', () => {
    test('Invalid forms', () => {
        expect(expression('-')).toMatchInlineSnapshot(`['', 'syntax-error']`);
        expect(expression('1-')).toMatchInlineSnapshot(`1`);
    });
});

describe('ROOT FUNCTION', () => {
    test('Valid forms', () => {
        expect(expression('\\sqrt{1}')).toMatchInlineSnapshot(`1`);
        expect(expression('\\sqrt[3]{1}')).toMatchInlineSnapshot(`1`);
        expect(expression('\\frac{1}{\\sqrt[3]{1}}')).toMatchInlineSnapshot(
            `1`
        );
        expect(
            expression('\\frac{1}{\\sqrt[3]{\\sqrt{x}}}')
        ).toMatchInlineSnapshot(
            `['Power', ['Power', 'x', ['Power', 2, -1]], ['Multiply', -1, ['Power', 3, -1]]]`
        );
    });
    test('Invalid forms', () => {
        expect(expression('\\sqrt')).toMatchInlineSnapshot(`['Sqrt']`);
        expect(expression('\\sqrt{}')).toMatchInlineSnapshot(
            `['Power', '', ['Power', 2, -1]]`
        );
        expect(expression('1-')).toMatchInlineSnapshot(`1`);
        expect(expression('\\sqrt{1}[3]')).toMatchInlineSnapshot(
            `[1, 'syntax-error']`
        );
    });
});

describe('MATCHFIX', () => {
    test('Parse valid matchfix', () => {
        expect(expression('\\lbrack\\rbrack')).toMatchInlineSnapshot(
            `['Multiply', '\\lbrack', '\\rbrack']`
        );
        expect(expression('\\lbrack a\\rbrack')).toMatchInlineSnapshot(
            `['Multiply', '\\lbrack', '\\rbrack', 'a']`
        );
        expect(expression('\\lbrack a, b\\rbrack')).toMatchInlineSnapshot(
            `['Subsequence', ['Multiply', '\\lbrack', 'a'], ['Multiply', '\\rbrack', 'b']]`
        );
        expect(
            expression('\\lbrack a, \\lbrack b, c\\rbrack\\rbrack')
        ).toMatchInlineSnapshot(
            `['Subsequence', ['Multiply', '\\lbrack', 'a'], ['Multiply', '\\lbrack', 'b'], ['Multiply', '\\rbrack', '\\rbrack', 'c']]`
        );
        expect(
            expression('\\sin\\lbrack a, \\lbrack b, c\\rbrack\\rbrack')
        ).toMatchInlineSnapshot(
            `['Subsequence', ['Multiply', ['Sin', '\\lbrack'], 'a'], ['Multiply', '\\lbrack', 'b'], ['Multiply', '\\rbrack', '\\rbrack', 'c']]`
        );
    });
    test('Emit valid matchfix', () => {
        expect(latex(['List'])).toMatchInlineSnapshot(`'\\lbrack\\rbrack'`);
        expect(latex(['List', 'a'])).toMatchInlineSnapshot(
            `'\\lbrack a\\rbrack'`
        );
        expect(latex(['List', 'a', 'b'])).toMatchInlineSnapshot(
            `'\\lbrack a,b\\rbrack'`
        );
        expect(latex(['List', 'a', ['List', 'b', 'c']])).toMatchInlineSnapshot(
            `'\\lbrack a,\\lbrack b,c\\rbrack\\rbrack'`
        );
    });
});

describe('SEQUENCES AND GROUPS', () => {
    test('Valid groups', () => {
        expect(expression('(a+b)')).toMatchInlineSnapshot(
            `['Group', ['Subsequence', ['Add', 'a', 'b']]]`
        );
        expect(expression('-(a+b)')).toMatchInlineSnapshot(
            `['Multiply', -1, ['Subsequence', ['Add', 'a', 'b']]]`
        );
        expect(expression('(a+(c+d))')).toMatchInlineSnapshot(
            `['Group', ['Subsequence', ['Add', 'a', ['Subsequence', ['Add', 'c', 'd']]]]]`
        );
        expect(expression('(a\\times(c\\times d))')).toMatchInlineSnapshot(
            `['Group', ['Subsequence', ['Multiply', 'a', ['Subsequence', ['Multiply', 'c', 'd']]]]]`
        );
        expect(expression('(a\\times(c+d))')).toMatchInlineSnapshot(
            `['Group', ['Subsequence', ['Multiply', 'a', ['Subsequence', ['Add', 'c', 'd']]]]]`
        );
        // Sequence with empty element
        expect(expression('(a,,b)')).toMatchInlineSnapshot(
            `['Group', ['Subsequence', 'a', 'Nothing', 'Nothing', 'b']]`
        );
    });
    test('Groups', () => {
        expect(expression('(a, b, c)')).toMatchInlineSnapshot(
            `['Group', ['Subsequence', 'a', 'Nothing', 'b', 'c']]`
        );
        expect(expression('(a, b; c, d, e, ;; n ,, m)')).toMatchInlineSnapshot(
            `[['Subsequence', ['Subsequence', ['Group', ['Subsequence', ['Subsequence', 'a', 'Nothing', 'b'], ['Subsequence', 'c', 'd', 'E']]]], 'n', 'Nothing', 'm'], 'unbalanced-matchfix-operator ()', 'syntax-error']`
        );
        expect(expression('(a, (b, c))')).toMatchInlineSnapshot(
            `['Group', ['Subsequence', 'a', 'Nothing', ['Group', ['Subsequence', 'b', 'Nothing', 'c']]]]`
        );
        expect(expression('(a, (b; c))')).toMatchInlineSnapshot(
            `[['Group', ['Subsequence', ['Subsequence', 'a', 'Nothing', ['Group', ['Subsequence', 'b']]], ['Subsequence', 'c']]], 'unbalanced-matchfix-operator ()', 'syntax-error']`
        );
    });
    test('Sequences', () => {
        expect(expression('a, b, c')).toMatchInlineSnapshot(
            `['Subsequence', 'a', 'b', 'c']`
        );
        // Sequence with missing element
        expect(expression('a,, c')).toMatchInlineSnapshot(
            `['Subsequence', 'a', 'Nothing', 'c']`
        );
        // Sequence with missing final element
        expect(expression('a,c,')).toMatchInlineSnapshot(
            `['Subsequence', 'a', 'c']`
        );
        // Sequence with missing initial element
        expect(expression(',c,b')).toMatchInlineSnapshot(
            `['', 'syntax-error']`
        );
    });
    test('Subsequences', () => {
        expect(expression('a,b;c,d,e;f;g,h')).toMatchInlineSnapshot(
            `['Subsequence', ['Subsequence', 'a', 'b'], ['Subsequence', 'c', 'd', 'E'], ['Subsequence', 'f'], ['Subsequence', 'g', 'h']]`
        );
        expect(expression(';;a;')).toMatchInlineSnapshot(
            `['', 'syntax-error']`
        );
    });
    test('Absolute value & Norm', () => {
        expect(expression('1+|a|+2')).toMatchInlineSnapshot(
            `['Add', ['Abs', 'a'], 1, 2]`
        );
        expect(expression('|(1+|a|+2)|')).toMatchInlineSnapshot(
            `['Abs', ['Group', ['Subsequence', ['Add', ['Abs', 'a'], 1, 2]]]]`
        );
        expect(expression('|1+|a|+2|')).toMatchInlineSnapshot(
            `['Multiply', ['Abs', 1], ['Abs', 2], 'a']`
        );
        expect(expression('||a||')).toMatchInlineSnapshot(`['Norm', 'a']`);
        expect(expression('||a||+|b|')).toMatchInlineSnapshot(
            `['Add', ['Abs', 'b'], ['Norm', 'a']]`
        );
    });
    test('Invalid groups', () => {
        expect(expression('(')).toMatchInlineSnapshot(
            `[['Group', ['Subsequence', 'Nothing']], 'unbalanced-matchfix-operator ()']`
        );
        expect(expression(')')).toMatchInlineSnapshot(`['', 'syntax-error']`);
        expect(expressionError('-(')).toMatchInlineSnapshot(
            `'unbalanced-matchfix-operator ()'`
        );
    });
});

describe('ARITHMETIC FUNCTIONS', () => {
    test('Invisible operator', () => {
        expect(expression('2^{3}4+5')).toMatchInlineSnapshot(
            `['Add', ['Multiply', 4, ['Power', 2, 3]], 5]`
        );
        expect(expression('2x3')).toMatchInlineSnapshot(
            `['Multiply', 2, 3, 'x']`
        );
    });
    test('Negate', () => {
        expect(expression('-1')).toMatchInlineSnapshot(`-1`);
        expect(expression('-2+3-4')).toMatchInlineSnapshot(
            `['Add', -4, -2, 3]`
        );
        expect(expression('-x')).toMatchInlineSnapshot(`['Multiply', -1, 'x']`);
        expect(expression('--x')).toMatchInlineSnapshot(
            `['PreDecrement', 'x']`
        );
        expect(expression('-(-x)')).toMatchInlineSnapshot(
            `['Multiply', -1, ['Subsequence', ['Negate', 'x']]]`
        );
        expect(expression('-i')).toMatchInlineSnapshot(`['Multiply', -1, 'I']`);
        expect(expression('-\\infty')).toMatchInlineSnapshot(
            `{num: '-Infinity'}`
        );
    });
    test('Infix plus', () => {
        expect(expression('+1')).toMatchInlineSnapshot(`1`);
        expect(expression('+x')).toMatchInlineSnapshot(`'x'`);
        expect(expression('+i')).toMatchInlineSnapshot(`'I'`);
        expect(expression('+\\infty')).toMatchInlineSnapshot(
            `{num: 'Infinity'}`
        );
    });
    test('Add/subtract', () => {
        expect(expression('-1-2+3-4')).toMatchInlineSnapshot(
            `['Add', -4, -2, -1, 3]`
        );
        expect(expression('a-b+c-d')).toMatchInlineSnapshot(
            `['Add', 'a', ['Multiply', -1, 'b'], 'c', ['Multiply', -1, 'd']]`
        );
    });
    test('Precedence of add/multiply', () => {
        expect(expression('2\\times3+4')).toMatchInlineSnapshot(
            `['Add', ['Multiply', 2, 3], 4]`
        );
        expect(expression('-2\\times-3-4')).toMatchInlineSnapshot(
            `['Add', ['Multiply', 2, 3], -4]`
        );
    });
});
describe('ALL OPERATORS', () => {
    test('First order partial Derivative', () => {
        expect(expression('\\partial f')).toMatchInlineSnapshot();
        expect(expression('\\partial_x f')).toMatchInlineSnapshot();
        expect(expression('\\partial_x f(x)')).toMatchInlineSnapshot();

        expect(
            expression('\\frac{\\partial f}{\\partial x} ')
        ).toMatchInlineSnapshot();
    });
    test('Second order partial Derivative', () => {});

    test('Second order mixed Derivative', () => {
        expect(expression('\\partial_{x,y} f(x,y)')).toMatchInlineSnapshot(
            `['PartialDerivative', ['f', ['Subsequence', 'x', 'Nothing', 'y']], ['Subsequence', 'x', 'y'], 'Nothing']`
        );
        expect(expression('\\partial^2_{x,y} f(x,y)')).toMatchInlineSnapshot(
            `['PartialDerivative', ['f', ['Subsequence', 'x', 'Nothing', 'y']], ['Subsequence', 'x', 'y'], 2]`
        );
        expect(
            expression('\\frac{\\partial^2}{\\partial_{x,y}} f(x,y)')
        ).toMatchInlineSnapshot(
            `['PartialDerivative', ['f', ['Subsequence', 'x', 'Nothing', 'y']], [['Subsequence', 'x', 'y']], 2]`
        );
        expect(
            expression('\\frac{\\partial^2 f(x, y, z)}{\\partial_{x,y}} ')
        ).toMatchInlineSnapshot(
            `['PartialDerivative', ['f', ['Subsequence', 'x', 'Nothing', 'y', 'z']], [['Subsequence', 'x', 'y']], 2]`
        );
    });
});

describe('PRIME', () => {
    test('Valid forms', () => {
        expect(expression("f'")).toMatchInlineSnapshot(`['f', 'syntax-error']`);
        expect(expression("f''")).toMatchInlineSnapshot(
            `['f', 'syntax-error']`
        );
        expect(expression("f'''")).toMatchInlineSnapshot(
            `['f', 'syntax-error']`
        );
        expect(expression('f\\prime')).toMatchInlineSnapshot(
            `['Multiply', '\\prime', 'f']`
        );
        expect(expression('f\\prime\\prime')).toMatchInlineSnapshot(
            `['Multiply', '\\prime', '\\prime', 'f']`
        );
        expect(expression('f\\prime\\prime\\prime')).toMatchInlineSnapshot(
            `['Multiply', '\\prime', '\\prime', '\\prime', 'f']`
        );
        expect(expression('f\\doubleprime')).toMatchInlineSnapshot(
            `['Multiply', '\\doubleprime', 'f']`
        );
        expect(expression('f^{\\prime}')).toMatchInlineSnapshot(
            `['Prime', 'f']`
        );
        expect(expression('f^{\\prime\\prime}')).toMatchInlineSnapshot(
            `['Power', 'f', ['Multiply', '\\prime', '\\prime']]`
        );
        expect(expression('f^{\\prime\\prime\\prime}')).toMatchInlineSnapshot(
            `['Power', 'f', ['Multiply', '\\prime', '\\prime', '\\prime']]`
        );
        expect(expression('f^{\\doubleprime}')).toMatchInlineSnapshot(
            `['Power', 'f', '\\doubleprime']`
        );
    });
});

describe('ADD/SUBTRACT', () => {
    test('Add Valid forms', () => {
        expect(expression('1+2')).toMatchInlineSnapshot(`['Add', 1, 2]`);
        expect(expression('1+2+3')).toMatchInlineSnapshot(`['Add', 1, 2, 3]`);
        expect(expression('1+(2+3)')).toMatchInlineSnapshot(
            `['Add', ['Subsequence', ['Add', 2, 3]], 1]`
        );
        expect(expression('-1-2')).toMatchInlineSnapshot(`['Add', -2, -1]`);
        expect(expression('1+\\infty')).toMatchInlineSnapshot(
            `['Add', 1, {num: 'Infinity'}]`
        );
        expect(latex([ADD, 1, [DIVIDE, 3, 4]])).toMatchInlineSnapshot(
            `'1\\frac{3}{4}'`
        );
    });
    test('Subtract Valid forms', () => {
        expect(latex([SUBTRACT, 1, 2])).toMatchInlineSnapshot(`'1-2'`);
        expect(latex([SUBTRACT, -1, -2])).toMatchInlineSnapshot(`'-1--2'`);
    });
    test('Subtract Invalid forms', () => {
        expect(latex([SUBTRACT])).toMatchInlineSnapshot(`'syntax-error'`);
        expect(latex([SUBTRACT, null])).toMatchInlineSnapshot(`''`);
        expect(latex([SUBTRACT, undefined])).toMatchInlineSnapshot(
            `'syntax-error'`
        );
        expect(latex([SUBTRACT, 1])).toMatchInlineSnapshot(`'1'`);
        expect(latex([SUBTRACT, 1, 2, 3])).toMatchInlineSnapshot(`'1-2-3'`);
    });
});

describe('MULTIPLY', () => {
    test('Multiply Invalid forms', () => {
        expect(latex([MULTIPLY, 2, 3])).toMatchInlineSnapshot(`'2\\times3'`);
        expect(
            latex([MULTIPLY, [DIVIDE, 2, 'x'], [DIVIDE, 'x', 3]])
        ).toMatchInlineSnapshot(`'\\frac{2}{x}\\frac{x}{3}'`);
        expect(
            latex([MULTIPLY, [DIVIDE, 2, 'x'], [POWER, 'x', -2]])
        ).toMatchInlineSnapshot(`'\\frac{\\frac{2}{x}}{x^{2}}'`);
    });
    test('Multiply Invalid forms', () => {
        expect(latex([MULTIPLY])).toMatchInlineSnapshot(`''`);
        expect(latex([MULTIPLY, null])).toMatchInlineSnapshot(`''`);
        expect(latex([MULTIPLY, undefined])).toMatchInlineSnapshot(
            `'syntax-error'`
        );
        expect(latex([MULTIPLY, 1])).toMatchInlineSnapshot(`''`);
        expect(latex([MULTIPLY, NaN])).toMatchInlineSnapshot(`'NaN'`);
        expect(latex([MULTIPLY, Infinity])).toMatchInlineSnapshot(`'Infinity'`);
    });
});

describe('POWER', () => {
    test('Power Invalid forms', () => {
        expect(latex([POWER])).toMatchInlineSnapshot(`
            'syntax-error
            syntax-error'
        `);
        expect(latex([POWER, null])).toMatchInlineSnapshot(`''`);
        expect(latex([POWER, undefined])).toMatchInlineSnapshot(`
            'syntax-error
            syntax-error'
        `);
        expect(latex([POWER, 1])).toMatchInlineSnapshot(`'syntax-error'`);
        expect(latex([POWER, NaN])).toMatchInlineSnapshot(`'syntax-error'`);
        expect(latex([POWER, Infinity])).toMatchInlineSnapshot(
            `'syntax-error'`
        );
    });
});

describe('INVERSE FUNCTION', () => {
    test('Valid forms', () => {
        expect(latex([INVERSE_FUNCTION, 'Sin'])).toMatchInlineSnapshot(
            `'\\sin^{-1}'`
        );
        expect(latex([INVERSE_FUNCTION, 'f'])).toMatchInlineSnapshot(
            `'f^{-1}'`
        );
    });
});

describe('CASES/PIECEWISE', () => {
    test('Valid forms', () => {
        expect(
            expression(`\\begin{cases}
0 & n =  0\\\\
1 & n =  1\\\\
x f(n - 1)(x) + f(n - 2)(x)& n \\geq 2\\end{cases}`)
        ).toMatchInlineSnapshot(
            `[['Multiply', 0, ['\\begin', ['Multiply', 'E', 'a', 'c', 's', 's']]], 'syntax-error']`
        );
    });
});

describe('DIVIDE', () => {
    test('Divide Valid forms', () => {
        expect(latex([DIVIDE, 2, 3])).toMatchInlineSnapshot(`'\\frac{2}{3}'`);
    });
    test('Divide Invalid forms', () => {
        expect(latex([DIVIDE])).toMatchInlineSnapshot(`
            'syntax-error
            syntax-error'
        `);
        expect(latex([DIVIDE, 1])).toMatchInlineSnapshot(`'1'`);
        expect(latex([DIVIDE, null])).toMatchInlineSnapshot(`''`);
        expect(latex([DIVIDE, undefined])).toMatchInlineSnapshot(
            `'syntax-error'`
        );
        expect(latex([DIVIDE, NaN])).toMatchInlineSnapshot(`'NaN'`);
        expect(latex([DIVIDE, Infinity])).toMatchInlineSnapshot(`'Infinity'`);
    });
});

describe('LATEX', () => {
    test('Latex Valid forms', () => {
        expect(latex([LATEX, 3, 4])).toMatchInlineSnapshot(`'34'`);
        expect(latex([LATEX, 'x', 3])).toMatchInlineSnapshot(`'x3'`);
        expect(
            latex([LATEX, '\\frac', '<{>', 42.12, '<}'])
        ).toMatchInlineSnapshot(`'\\frac{42.12\\operatorname{<}}'`);
    });
});

describe('TRIGONOMETRIC FUNCTIONS', () => {
    test('Trig functions with implicit argument', () => {
        expect(expression('\\cos x + 1')).toMatchInlineSnapshot(
            `['Add', ['Cos', 'x'], 1]`
        );
        expect(expression('\\cos x - \\sin x')).toMatchInlineSnapshot(
            `['Add', ['Cos', 'x'], ['Multiply', -1, ['Sin', 'x']]]`
        );
        expect(expression('\\cos \\frac{x}{2}^2')).toMatchInlineSnapshot(
            `['Cos', ['Power', ['Multiply', ['Power', 2, -1], 'x'], 2]]`
        );
    });
    test('Trig functions with superscript', () => {
        expect(expression("\\sin^{-1}'(x)")).toMatchInlineSnapshot(
            `[['Derivative', 1, ['InverseFunction', 'Sin']], ['Subsequence', 'x']]`
        );
        expect(expression("\\sin^{-1}''(x)")).toMatchInlineSnapshot(
            `[['Derivative', 2, ['InverseFunction', 'Sin']], ['Subsequence', 'x']]`
        );
        expect(expression('\\cos^{-1\\doubleprime}(x)')).toMatchInlineSnapshot(
            `[['Derivative', 2, ['InverseFunction', 'Cos']], ['Subsequence', 'x']]`
        );
        expect(expression('\\cos^{-1}\\doubleprime(x)')).toMatchInlineSnapshot(
            `[['Derivative', 2, ['InverseFunction', 'Cos']], ['Subsequence', 'x']]`
        );
    });
});

describe('UNKNOWN COMMANDS', () => {
    test('Parse', () => {
        expect(expression('\\foo')).toMatchInlineSnapshot(`'\\foo'`);
        expect(expression('x=\\foo+1')).toMatchInlineSnapshot(
            `['Equal', 'x', ['Add', '\\foo', 1]]`
        );
        expect(expression('x=\\foo   {1}  {x+1}+1')).toMatchInlineSnapshot(
            `['Equal', 'x', ['Add', ['\\foo', 1, ['Add', 'x', 1]], 1]]`
        );
    });
    test('Errors', () => {
        expect(expressionError('\\foo')).toMatchInlineSnapshot(`[]`);
        expect(expressionError('x=\\foo+1')).toMatchInlineSnapshot(`[]`);
        expect(expressionError('x=\\foo   {1}  {x+1}+1')).toMatchInlineSnapshot(
            `[]`
        );
    });
});

describe('FRACTIONS', () => {
    test('Basic', () => {
        expect(expression('\\frac12')).toMatchInlineSnapshot(
            `['Power', 2, -1]`
        );
        expect(expression('\\frac{1}{2}')).toMatchInlineSnapshot(
            `['Power', 2, -1]`
        );
    });
    test('Errors', () => {
        expect(expressionError('\\frac')).toMatchInlineSnapshot(`[]`);
        expect(expressionError('\\frac{}')).toMatchInlineSnapshot(`[]`);
    });
});
describe('POLYNOMIALS', () => {
    test('Univariate', () => {
        expect(expressionError('6x+2+3x^5')).toMatchInlineSnapshot(`[]`);
        expect(
            expressionError('6x+2+q+\\sqrt{2}x^3+c+3x^5')
        ).toMatchInlineSnapshot(`[]`);
    });
    test('Multivariate', () => {
        expect(expressionError('y^4x^2+ 6x+2+3y^7x^5')).toMatchInlineSnapshot(
            `[]`
        );
    });
});

describe('FORMS', () => {
    const exprs: [string, Expression, Expression][] = [
        ['-0', [NEGATE, 0], 0],
        ['a-0', [SUBTRACT, 'a', 0], 'a'],
        ['0-a', [SUBTRACT, 0, 'a'], [MULTIPLY, -1, 'a']],
        ['7+2+5', [ADD, 7, 2, 5], [ADD, 2, 5, 7]],
        // This one is tricky:
        // the simplifications of POWER and MULTIPLY
        // have to be done in the right order to get the correct result
        ['1^2x', [MULTIPLY, [POWER, 1, 2], 'x'], 'x'],

        // Negative sign on denom, numer or both
        [
            '\\frac{-x}{-n}',
            [DIVIDE, [NEGATE, 'x'], [NEGATE, 'n']],
            [MULTIPLY, -1, [POWER, [MULTIPLY, -1, 'n'], -1], 'x'],
        ],
        [
            '\\frac{x}{-n}',
            [DIVIDE, 'x', [NEGATE, 'n']],
            [MULTIPLY, [POWER, [MULTIPLY, -1, 'n'], -1], 'x'],
        ],
        [
            '\\frac{-x}{n}',
            [DIVIDE, [NEGATE, 'x'], 'n'],
            [MULTIPLY, -1, [POWER, 'n', -1], 'x'],
        ],

        //
        [
            '\\frac{-101}{10^{\\frac{2}{3}}}',
            [DIVIDE, [NEGATE, 101], [POWER, 10, [DIVIDE, 2, 3]]],
            [MULTIPLY, -101, [POWER, 10, [MULTIPLY, -2, [POWER, 3, -1]]]],
        ],

        // Flatten, to multiple levels
        [
            '(1+(2+(3+4)))(((5+6)+7)((8+(9+10)))(11+(12+13)+14))',
            [
                MULTIPLY,
                [GROUP, [ADD, 1, [GROUP, [ADD, 2, [GROUP, [ADD, 3, 4]]]]]],
                [
                    GROUP,
                    [
                        MULTIPLY,
                        [GROUP, [ADD, [GROUP, [ADD, 5, 6]], 7]],
                        [GROUP, [GROUP, [ADD, 8, [GROUP, [ADD, 9, 10]]]]],
                        [GROUP, [ADD, 11, [GROUP, [ADD, 12, 13]], 14]],
                    ],
                ],
            ],
            // Shorter operations first
            [
                MULTIPLY,
                [ADD, 5, 6, 7],
                [ADD, 8, 9, 10],
                [ADD, 1, 2, 3, 4],
                [ADD, 11, 12, 13, 14],
            ],
        ],

        // \frac should get hoisted with multiply, but not cancel
        // (multiplication by 0 does not always = 0)
        [
            '2x\\frac{0}{5}',
            [MULTIPLY, 2, 'x', [DIVIDE, 0, 5]],
            [MULTIPLY, 0, 2, [POWER, 5, -1], 'x'],
        ],
        // Negative exponents become fractions
        [
            '2xy^{-n}',
            [MULTIPLY, 2, 'x', [POWER, 'y', [NEGATE, 'n']]],
            [MULTIPLY, 2, 'x', [POWER, 'y', [MULTIPLY, -1, 'n']]],
        ],

        [
            '2\\times0\\times5\\times4',
            [MULTIPLY, 2, 0, 5, 4],
            [MULTIPLY, 0, 2, 4, 5],
        ],
        [
            '2\\times(5-5)\\times5\\times4',
            [MULTIPLY, 2, [GROUP, [SUBTRACT, 5, 5]], 5, 4],
            [MULTIPLY, 2, 4, 5, [ADD, -5, 5]],
        ],

        [
            '2\\frac{x}{a}\\frac{y}{b}',
            [MULTIPLY, 2, [DIVIDE, 'x', 'a'], [DIVIDE, 'y', 'b']],
            [MULTIPLY, 2, [POWER, 'a', -1], [POWER, 'b', -1], 'x', 'y'],
        ],
    ];

    exprs.forEach((x) =>
        test('Full form "' + x[0] + '"', () => {
            // console.log(
            //     x[0] +
            //         ' full -> ' +
            //         JSON.stringify(expression(x[0], { form: 'full' }))
            // );
            expect(expression(x[0], { form: 'full' })).toStrictEqual(x[1]);
        })
    );
    exprs.forEach((x) =>
        test('Canonical form "' + x[0] + '"', () => {
            // console.log(
            //     x[0] +
            //         ' cano -> ' +
            //         JSON.stringify(expression(x[0], { form: 'canonical' }))
            // );
            expect(expression(x[0], { form: 'canonical' })).toStrictEqual(x[2]);
        })
    );
});

describe('ORDER', () => {
    const exprs: [string, Expression][] = [
        // multiply is commutative and regular canonical sort order applies
        // (numbers before symbols)
        ['yx5z', [MULTIPLY, 5, 'x', 'y', 'z']],

        // addition is deglex ordered, numbers after symbols
        ['c+7+a+5+b', [ADD, 'a', 'b', 'c', 5, 7]],

        // 7a -> degree 1 > degree 0
        // 2b -> degree 1, b > a
        // 5c -> degree 1, c > b
        // 6 -> degree 0
        [
            '6+5c+2b+3+7a',
            [
                ADD,
                [MULTIPLY, 7, 'a'],
                [MULTIPLY, 2, 'b'],
                [MULTIPLY, 5, 'c'],
                3,
                6,
            ],
        ],
        // Arguments sorted by value
        [
            '5a+3a+7a',
            [ADD, [MULTIPLY, 3, 'a'], [MULTIPLY, 5, 'a'], [MULTIPLY, 7, 'a']],
        ],
        // deglex sorting order
        // by total degree, then lexigraphically

        // If degree is the same, longest factor
        [
            'x^{3}2\\pi+3x^{3}4\\pi+x^3',
            [
                ADD,
                [POWER, 'x', 3],
                [MULTIPLY, 2, PI, [POWER, 'x', 3]],
                [MULTIPLY, 3, 4, PI, [POWER, 'x', 3]],
            ],
        ],

        // The arguments of commutative functions are sorted lexicographically
        // constants (by value), then constants (lexicographically),
        // then symbols (lex),
        [
            '-2x5z\\sqrt{y}\\frac{3}{4}3\\pi y',
            [
                MULTIPLY,
                -2, // degree 0, -2 < 3
                3, // degree 0, 3 = 3
                3, // degree 0, 3 = 3
                5, // degree 0, 5 > 3
                [POWER, 4, -1], // degree 0,
                PI, // degree 0,
                'x', // degree 1, x < y
                'y', // degree 1, y < z
                [POWER, 'y', [POWER, 2, -1]], // degree 1, y >
                'z', // degree 1
            ],
        ],

        [
            'x^2y^3+x^3y^2+xy^4+x^4y+x^2y^2',
            [
                ADD,
                [MULTIPLY, [POWER, 'x', 4], 'y'],
                [MULTIPLY, [POWER, 'x', 3], [POWER, 'y', 2]],
                [MULTIPLY, [POWER, 'x', 2], [POWER, 'y', 3]],
                [MULTIPLY, 'x', [POWER, 'y', 4]],
                [MULTIPLY, [POWER, 'x', 2], [POWER, 'y', 2]],
            ],
        ],
        [
            '(b^3c^2d)(x^7y)(a^5f)(b^2x^5b3)',
            [
                MULTIPLY,
                3,
                [POWER, 'a', 5],
                'b',
                [POWER, 'b', 3],
                [POWER, 'b', 2],
                [POWER, 'c', 2],
                'd',
                'f',
                [POWER, 'x', 7],
                [POWER, 'x', 5],
                'y',
            ],
        ],
        [
            '(b^3c^2d)+(x^7y)+(a^5f)+(b^2x^5b3)',
            [
                ADD,
                [MULTIPLY, 3, 'b', [POWER, 'b', 2], [POWER, 'x', 5]],
                [MULTIPLY, [POWER, 'x', 7], 'y'],
                [MULTIPLY, [POWER, 'a', 5], 'f'],
                [MULTIPLY, [POWER, 'b', 3], [POWER, 'c', 2], 'd'],
            ],
        ],
        [
            '(b^3b^2)+(a^3a^2)+(b^6)+(a^5b)+(a^5)',
            [
                ADD,
                [MULTIPLY, [POWER, 'a', 5], 'b'],
                [POWER, 'b', 6],
                [MULTIPLY, [POWER, 'a', 3], [POWER, 'a', 2]],
                [POWER, 'a', 5],
                [MULTIPLY, [POWER, 'b', 3], [POWER, 'b', 2]],
            ],
        ],
        [
            '5c^2a^4+2b^8+7b^3a',
            [
                ADD,
                [MULTIPLY, 2, [POWER, 'b', 8]],
                [MULTIPLY, 5, [POWER, 'a', 4], [POWER, 'c', 2]],
                [MULTIPLY, 7, 'a', [POWER, 'b', 3]],
            ],
        ],
    ];

    exprs.forEach((x) =>
        test('Canonical form "' + x[0] + '"', () => {
            // console.log(
            //     x[0] +
            //         ' order -> ' +
            //         JSON.stringify(expression(x[0], { form: 'canonical' }))
            // );
            expect(expression(x[0], { form: 'canonical' })).toStrictEqual(x[1]);
        })
    );
});

// @todo: sum, products, derivative, integral
// @todo: compare two expressions
// @todo absolute value
// @todo prime (primeOperator)
// @todo derivate: differential / derivative : https://en.wikipedia.org/wiki/Differentiation_rules

// @todo range (for sum, etc..., explicit {2, 4, 6, ...}, {x > 0}, {x in N | 2x+1})

// @todo physics constants from the NIST: https://physics.nist.gov/cuu/Constants/Table/allascii.txt
