import { convertLatexToMarkup } from '../dist/mathlive';

function markupAndError(formula: string): [string, string] {
    let errorCode = 'no-error';
    const markup = convertLatexToMarkup(formula, {
        mathstyle: 'displaystyle',
        onError: (err) => {
            if (errorCode === 'no-error') {
                // Catch the first error only
                errorCode = err.code;
            }
        },
    });
    return [markup, errorCode];
}

function error(expression: string) {
    return markupAndError(expression)[1];
}

describe('BASIC PARSING', () => {
    test.each([
        'x',
        ' x ', // Spaces do not matter
        '%', // '%' is start of comment
        '% comment',
        'x % comment',
        'x',
        '-12',
        '1234|/@.`abcdefgzABCDEFGZ', // Basic literals
        'a b', // Spaces are ignored
        'ab', // Same as previous
        'a~b', // ~ is space, same as previous
        'a\\space b',
        '{a}b', // Group
        '{-}', // Operator in group
        '-a', // Spacing as unary operator
        'a-', // Spacing as postfix operator
        'a-b', // Spacing as infix operator
        'a\nb',
        'a=1}',
        'a=1{', // Syntax error
        'a=1{}', // Valid
    ])('%#/ %p renders correctly', (x) => {
        expect(markupAndError(x)).toMatchSnapshot();
    });
    // expect(error('a=1}}}}{{{{')).toMatch('unbalanced-braces');
});

describe('CHARACTERS', () => {
    const ref = convertLatexToMarkup('J0');
    test.each([
        '^^4a0',
        '^^^^004a0',
        '\\char"4A 0',
        "\\char'0112 0",
        '\\char74 0',
        '\\char "004A 0',
        '\\char`J 0',
        '\\char`\\J 0',
        '\\char `\\J 0',
        '\\char   `\\J 0',
        '\\char +- +-  `\\J 0',
        '\\char +- -  `\\J 0',
        '\\char +- -- -++ `\\J 0',
        '\\unicode{"4A} 0',
        '\\unicode{"004A} 0',
        '\\unicode{x004A} 0',
    ])('%#/ %p renders as "J0"', (x) => {
        expect(convertLatexToMarkup(x)).toEqual(ref);
    });
});
describe('EXPANSION PRIMITIVES', () => {
    test.each([
        ['\\obeyspaces =   =', '=\\space\\space\\space='],
        ['\\csname alpha\\endcsname', '\\alpha'],
        ['\\csname alph\\char"41\\endcsname', '\\alph A'],
        ['=\\sqrt\\bgroup x \\egroup=', '=\\sqrt{x}='],
        ['\\string\\alpha', '\\backslash alpha'],
        ['#?', '\\placeholder{}'],
    ])('%#/ %p matches %p', (a, b) => {
        expect(convertLatexToMarkup(a)).toMatch(convertLatexToMarkup(b));
    });
});

describe('ARGUMENTS', () => {
    test.each([
        ['\\frac12', '\\frac{1}{2}'],
        ['\\frac  1  2', '\\frac{1}{2}'],
        ['\\frac357', '\\frac{3}{5}7'],
        ['\\frac3a', '\\frac{3}{a}'],
        ['\\frac\\alpha\\beta', '\\frac{\\alpha}{\\beta}'],
        // ['\\frac{{1}}{2}', '\\frac{1}{2}'],
        ['\\frac  {  { 1  } } { 2 }', '\\frac{{1}}{2}'],
    ])('%#/ %p matches %p', (a, b) => {
        expect(convertLatexToMarkup(a)).toMatch(convertLatexToMarkup(b));
    });
    test.each(['\\frac', '\\frac{}', '\\frac{}{}'])(
        '%#/ %p renders correctly',
        (x) => {
            expect(markupAndError(x)).toMatchSnapshot();
        }
    );
});

describe('INFIX COMMANDS', () => {
    test.each([
        ['a\\over b', '\\frac{a}{b}'],
        ['a\\over b c', '\\frac{a}{bc}'],
        ['x{a+1\\over1-b}y', 'x{\\frac{a+1}{1-b}}y'],
        ['x{a+1\\over1-b\\over2}y', 'x{a+1\\over1-b2}y'],
    ])('%#/ %p matches %p', (a, b) => {
        expect(convertLatexToMarkup(a)).toMatch(convertLatexToMarkup(b));
    });

    expect(error('a\\over b \\over c')).toMatch('too-many-infix-commands');
});
