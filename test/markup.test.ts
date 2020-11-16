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

describe('FONTS', () => {
    test.each([
        '\\alpha + x - 1 - \\Gamma',
        '\\alpha + x - 1 - \\Gamma',
        '\\alpha + x - 1 - \\Gamma',
        '\\alpha + x - 1 - \\Gamma',
        '\\mathfrak{\\sin}',
    ])('%#/ %s renders correctly', (a) => {
        expect(markupAndError(a)).toMatchSnapshot();
    });
});

describe('BINARY OPERATORS', () => {
    test.each([
        'a+b',
        'f(a)+f(b)',
        'x^n+y^n',
        '+b',
        '(+b',
        '=+b',
        '\\sin+b',
        ', +b',
        '\\textcolor{red}{a}+b',
        '\\textcolor{red}{a=}+b',
    ])('%#/ %s renders corectly', (a) => {
        expect(markupAndError(a)).toMatchSnapshot();
    });
});

describe('FRACTIONS', function () {
    test.each([
        '\\frac57',
        '\\frac {5} {7}',
        '\\frac {\\frac57} {\\frac37}',
        '\\[ 1 + \\frac{q^2}{(1-q)}+\\frac{q^6}{(1-q)(1-q^2)}+\\cdots = \\prod_{j=0}^{\\infty}\\frac{1}{(1-q^{5j+2})(1-q^{5j+3})}, \\quad\\quad \\text{for $|q|<1$}. \\]',
        '\\binom{n}{k}',
        '\\dbinom{n}{k}',
        '\\tbinom{n}{k}',
        'n \\choose k',
        '\\pdiff{f(x)}{x}',
    ])('%#/ %s renders correctly', (x) => {
        expect(markupAndError(x)).toMatchSnapshot();
    });
});

describe('SIZING STYLE', function () {
    test.each(['\\text{a \\tiny x y}b'])('%#/ %s renders correctly', (x) => {
        expect(markupAndError(x)).toMatchSnapshot();
    });
});

describe('RULE AND DIMENSIONS', function () {
    test.each([
        '\\rule{1em}{2em}',
        '\\rule[1em]{1em}{2em}',
        '\\rule{1em}',
        '\\rule{-1em}{+10em}',
        '\\rule{0}{4}',
        '\\rule{1245.5667em}{2902929,292929em}',
        '\\rule{5mm}{7mm}',
        '\\rule{5cm}{7cm}',
        '\\rule{5ex}{7ex}',
        '\\rule{5em}{7em}',
        '\\rule{5bp}{7bp}',
        '\\rule{5dd}{7dd}',
        '\\rule{5pc}{7pc}',
        '\\rule{5in}{7in}',
        '\\rule{5mu}{7mu}',
    ])('%#/ %s renders correctly', (x) => {
        expect(markupAndError(x)).toMatchSnapshot();
    });

    test.each([
        ['\\rule{10}{10pt}', '\\rule{10pt}{10pt}'],
        ['\\rule{+10em}{+  10 em}', '\\rule{10em}{10em}'],
        ["\\rule{'12em}{10em}", '\\rule{10em}{10em}'],
        ["\\rule{'12.9999em}{10em}", '\\rule{10pt}{10em}'],
        ['\\rule{"A em}{10em}', '\\rule{10em}{10em}'],
    ])('%#/ %s matches %s', (a, b) => {
        expect(convertLatexToMarkup(a)).toMatch(convertLatexToMarkup(b));
    });
    // However, TeX doesn't parse it either...  Actually, TeX doesn't even parse "a2em
    // For TeX, hex digits have to be uppercase. Interestingly, TeX cannot parse
    // '\\rule{\"A EM}{10em}' (the AE confuses it)
});

describe('BOX AND RULE', () => {
    test.each([
        '\\bbox{1+x}',
        '\\bbox[border:solid 1px red]{1+x}',
        '\\bbox[yellow]{1+x}',
        '\\bbox[yellow]{1+x}',
        '\\bbox[ yellow , border: 1px solid red, 4 em ]{1+x}',
        '\\rlap{x}o',
        '\\mathrlap{x}o',
        '\\llap{x}o',
        '\\mathllap{x}o',
    ])('%#/ %s renders correctly', (x) => {
        expect(markupAndError(x)).toMatchSnapshot();
    });
});

describe('OVER/UNDERLINE', () => {
    test.each([
        'a\\overline{x}b',
        '\\overline{xyz}\\overline{1+\\frac34}\\underline{abc}\\underline{\\frac57}',
    ])('%#/ %s renders correctly', (x) => {
        expect(markupAndError(x)).toMatchSnapshot();
    });
});

describe('SPACING AND KERN', () => {
    test.each([
        'a\\hskip 3em b',
        'a\\kern 3em b',
        'a\\hspace{3em} b',
        'a\\hskip 3em b',
    ])('%#/ %s renders correctly', (x) => {
        expect(markupAndError(x)).toMatchSnapshot();
    });
});

function testLeftRightDelimiter(openDel, closeDel) {
    // Regular sized delimiters
    test('Delimiters ' + openDel + ' ' + closeDel, () => {
        expect(
            markupAndError('\\left' + openDel + ' x + 1' + '\\right' + closeDel)
        ).toMatchSnapshot();

        // Delimiters with large expression
        expect(
            markupAndError(
                '\\left' +
                    openDel +
                    ' x \\frac{\\frac34}{\\frac57}' +
                    '\\right' +
                    closeDel
            )
        ).toMatchSnapshot();
    });
}

// ////////////////////////////////////////////////////////////////////////////////
describe('LEFT/RIGHT', () => {
    [
        ['(', ')'],
        ['{(}', '{)}'],
        ['.', '.'],
        ['\\lfloor', '\\rfloor'],
        ['\\ulcorner', '\\urcorner'],
        ['\\uparrow', '\\Downarrow'],
        ['\\downarrow', '\\vert'],
        ['\\langle', '\\rangle'],
        ['<', '>'],
        ['\\vert', '\\vert'],
        ['\\lvert', '\\rvert'],
        ['\\Vert', '\\Vert'],
        ['\\lVert', '\\rVert'],
        ['\\|', '|'],
        ['\\uparrow', '\\downarrow'],
        ['\\Downarrow', '\\Uparrow'],
        ['\\Updownarrow', '\\updownarrow'],
        ['\\lbrack', '\\rbrack'],
        ['\\lfloor', '\\rfloor'],
        ['\\lceil', '\\rceil'],
        ['(', ')'],
        ['\\{', '\\}'],
        ['\\lbrace', '\\rbrace'],
        ['\\lgroup', '\\rgroup'],
        ['\\lmoustache', '\\rmoustache'],
        ['\\surd', '\\surd'],
    ].forEach((x) => {
        const [openDelim, closeDelim] = x;
        testLeftRightDelimiter(openDelim, closeDelim);
    });
    test('invalid delimiters', () => {
        expect(error('\\left a\\right)')).toMatch('unexpected-delimiter');
        expect(error('\\left0\\right)')).toMatch('unexpected-delimiter');
    });
    test('middle delimiters', () => {
        expect(markupAndError('\\left(a\\middle|b\\right)')).toMatchSnapshot();
        expect(markupAndError('\\left(a\\middle xb\\right)')).toMatchSnapshot();
    });
});

describe('SIZING COMMANDS', () => {
    test.each([
        ['\\bigl', '\\bigr', '\\bigm', '\\big'],
        ['\\Bigl', '\\Bigr', '\\Bigm', '\\Big'],
        ['\\biggl', '\\biggr', '\\biggm', '\\bigg'],
        ['\\Biggl', '\\Biggr', '\\Biggm', '\\Bigg'],
    ])('%#/ sizing command %s, %s, %s, %s', (a, b, c, d) => {
        expect(
            markupAndError(`${a}(x${c}|y${b}) = x+${d}x${d}+`)
        ).toMatchSnapshot();
    });
});

// ////////////////////////////////////////////////////////////////////////////////
describe('ENVIRONMENTS', function () {
    test.each([
        '\\begin',
        '\\begin{a}',
        '\\begin{a}\\end',
        '\\begin{a}\\end{x}',
        '\\begin{a}\\end{a}',
        '\\begin{array}\\end{a}',
        '\\begin{array}xyz\\end{a}',
        '\\begin{array}xyz\\end{array}',
        '\\begin{array}xyz',
        '\\begin{\\alpha}',
        '\\begin{.}\\end{.}',
        '\\begin{(}\\end{(}',
        '\\begin{bmatrix}a & b & c\\end{bmatrix}',
        '\\begin{bmatrix}a & b & c\\\\ d & e & f\\end{bmatrix}',
        '\\begin{bmatrix}a & b & c\\\\ d \\end{bmatrix}',
        '\\begin{bmatrix}a & b & c\\\\ d \\\\ g & h & i & j\\end{bmatrix}',
    ])('%#/ %s renders correctly', (x) => {
        expect(markupAndError(x)).toMatchSnapshot();
    });
});

// ////////////////////////////////////////////////////////////////////////////////
describe('SURDS', function () {
    test.each([
        '\\sqrt5',
        '\\sqrt{}',
        'ax^2+bx+c = a \\left( x - \\frac{-b + \\sqrt {b^2-4ac}}{2a} \\right) \\left( x - \\frac{-b - \\sqrt {b^2-4ac}}{2a} \\right)',
        '\\sqrt[3]{5}',
        '\\sqrt[3]5',
    ])('%#/ %s renders correctly', (x) => {
        expect(markupAndError(x)).toMatchSnapshot();
    });
});

// ////////////////////////////////////////////////////////////////////////////////
describe('ACCENTS', function () {
    test.each([
        '\\vec',
        '\\acute',
        '\\grave',
        '\\dot',
        '\\ddot',
        '\\tilde',
        '\\bar',
        '\\breve',
        '\\check',
        '\\hat',
    ])('%#/ %s renders correctly', (x) => {
        expect(markupAndError(`${x}{x}${x}{x + 1}${x}`)).toMatchSnapshot();
    });
});

// ////////////////////////////////////////////////////////////////////////////////
// // describe('PHANTOM', function () {});

// ////////////////////////////////////////////////////////////////////////////////
describe('COLORS', function () {
    test.each([
        '\\sin x \\textcolor{#f00}{red} \\backgroundcolor{yellow}{x + \\frac1{\\frac34}} \\textcolor{m1}{\\blacktriangle}\\textcolor{m2}{\\blacktriangle}\\textcolor{m3}{\\blacktriangle}\\textcolor{m4}{\\blacktriangle}\\textcolor{m5}{\\blacktriangle}\\textcolor{m6}{\\blacktriangle}\\textcolor{m7}{\\blacktriangle}\\textcolor{m8}{\\blacktriangle}\\textcolor{m9}{\\blacktriangle}',
        'a+\\backgroundcolor{#f00}{\\frac1{\\frac{a+1}{b+c}}}',
        'a+\\backgroundcolor{#f00}{\\frac{\\frac{\\frac{1}{2}}{c}}{\\frac{a+1}{b+c}}}',
        'a+\\backgroundcolor{#f00}{\\frac{\\frac{\\frac{1}{2}}{c}}{a}',
        'a+\\backgroundcolor{#f00}{\\frac1{\\frac{a+1}{b+c}}}',
        'a+\\backgroundcolor{#f00}{\\frac{\\frac{\\frac{1}{2}}{c}}{\\frac{a+1}{b+c}}}',
        'a+\\backgroundcolor{#f00}{\\frac{\\frac{\\frac{1}{2}}{c}}{a}',
        'a{b\\color{#f00} c}d',
        'a\\left(b\\color{#f00} c\\right)d',
        '{\\color{apricot}\\blacksquare}{\\color{aquamarine}\\blacksquare}{\\color{bittersweet}\\blacksquare}{\\color{black}\\blacksquare}{\\color{blue}\\blacksquare}{\\color{blueGreen}\\blacksquare}{\\color{blueviolet}\\blacksquare}{\\color{brickred}\\blacksquare}{\\color{brown}\\blacksquare}{\\color{burntorange}\\blacksquare}{\\color{cadetblue}\\blacksquare}{\\color{carnationpink}\\blacksquare}{\\color{cerulean}\\blacksquare}{\\color{cornflowerblue}\\blacksquare}{\\color{cyan}\\blacksquare}{\\color{dandelion}\\blacksquare}{\\color{darkorchid}\\blacksquare}{\\color{emerald}\\blacksquare}{\\color{forestgreen}\\blacksquare}{\\color{fuchsia}\\blacksquare}{\\color{goldenrod}\\blacksquare}{\\color{gray}\\blacksquare}{\\color{green}\\blacksquare}{\\color{greenyellow}\\blacksquare}{\\color{junglegreen}\\blacksquare}{\\color{lavender}\\blacksquare}{\\color{limegreen}\\blacksquare}{\\color{magenta}\\blacksquare}{\\color{mahogany}\\blacksquare}{\\color{maroon}\\blacksquare}{\\color{melon}\\blacksquare}{\\color{midnightblue}\\blacksquare}{\\color{mulberry}\\blacksquare}{\\color{navyblue}\\blacksquare}{\\color{olivegreen}\\blacksquare}{\\color{orange}\\blacksquare}{\\color{orangered}\\blacksquare}{\\color{orchid}\\blacksquare}{\\color{peach}\\blacksquare}{\\color{periwinkle}\\blacksquare}{\\color{pinegreen}\\blacksquare}{\\color{plum}\\blacksquare}{\\color{processblue}\\blacksquare}{\\color{purple}\\blacksquare}{\\color{rawsienna}\\blacksquare}{\\color{red}\\blacksquare}{\\color{redorange}\\blacksquare}{\\color{redviolet}\\blacksquare}{\\color{rhodamine}\\blacksquare}{\\color{royalblue}\\blacksquare}{\\color{royalpurple}\\blacksquare}{\\color{rubinered}\\blacksquare}{\\color{salmon}\\blacksquare}{\\color{seagreen}\\blacksquare}{\\color{sepia}\\blacksquare}{\\color{skyblue}\\blacksquare}{\\color{springgreen}\\blacksquare}{\\color{tan}\\blacksquare}{\\color{tealblue}\\blacksquare}{\\color{thistle}\\blacksquare}{\\color{turquoise}\\blacksquare}{\\color{violet}\\blacksquare}{\\color{violetred}\\blacksquare}{\\color{white}\\blacksquare}{\\color{wildstrawberry}\\blacksquare}{\\color{yellow}\\blacksquare}{\\color{yellowgreen}\\blacksquare}{\\color{yelloworange}\\blacksquare}',
    ])('%#/ %s renders correctly', (x) => {
        expect(markupAndError(x)).toMatchSnapshot();
    });

    test.each([
        'aquamarine',
        'rgb(240, 10, 200)',
        '#33d',
        '#3130da',
        'white',
        'AquaMarine',
        'M5',
        '#fff',
        '#ffffff',
        '#fCFcfC',
        'rgb(255, 255, 255)',
        'rgb(255,255,255)',
        '  rgb  (  255  ,  255  ,  255  ) ',
        'rgb(3.5, 0, 0)',
        'rgb(3, 5, 7',
        'rgb(125.5, 0.556, -12.5)',
        'rgb(xxy)',
        'rgb(3, 5)',
        'rgb(3, 5, 7, 11)',
        '#111!50',
        '#111!50!#fff',
        '#111!50!#000',
        '-green!40!yellow',
    ])('%#/ color format "%s" renders correctly', (x) => {
        expect(markupAndError(`a\\textcolor{${x}}{x}b`)).toMatchSnapshot();
    });
});

// // \cos(|x| + |y|)

// // \cos (|\frac {x}{5}|+|\frac {y}{5}|)

// // -----------------------------------------------------------
// // Resolved:

// // \left(x^2+3y^2\right)e^{-x^2-y^2}
// // \left(x^2+3y^2\right)\cdot  e^{-x^2-y^2}

// // \sin(\pi*x/5)-\tan(x*2)
// // \sin \pi  \cdot  \frac {x}{5}-\tan 2x
