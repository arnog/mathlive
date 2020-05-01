// const MathLive = require('../dist/mathlive.js');

// import MathLive from '../src/mathlive';
/// <reference path="../dist/mathlive.d.ts" />
import MathLive from '../dist/mathlive.js';

const MathLiveDebug = MathLive['debug'];

// function getProp(s, symbol, prop) {
//     if (typeof s === 'string') s = toSpan(s);
//     return MathLiveDebug.getProp(s, symbol, prop);
// }

function getStyle(s: any, symbol, prop) {
    if (typeof s === 'string') s = toSpan(s);
    return MathLiveDebug.getStyle(s, symbol, prop);
}

function getType(s, symbol) {
    if (typeof s === 'string') s = toSpan(s);
    return MathLiveDebug.getType(s, symbol);
}

function toSpan(formula) {
    return MathLive.latexToMarkup(formula, {
        mathstyle: 'displaystyle',
        format: 'span',
    } as unknown); // 'span' is a secret format, so force it with 'unknown'
}

function spanToString(span) {
    if (typeof span === 'string') span = toSpan(span);
    return MathLiveDebug.spanToString(span)
        .replace(/\t/g, '  ')
        .replace(/\n/g, '\n');
}

function hasClass(s, symbol, cls) {
    let span = s;
    if (typeof span === 'string') {
        span = toSpan(s);
    }

    const result = MathLiveDebug.hasClass(span, symbol, cls);

    expect(result).toBeTruthy();
}

function notHasClass(s, symbol, cls) {
    let span = s;
    if (typeof span === 'string') {
        span = toSpan(s);
    }

    const result = !MathLiveDebug.hasClass(span, symbol, cls);

    expect(result).toBeTruthy();
}

function equalSpan(formula1, formula2) {
    const s1 = spanToString(toSpan(formula1));
    const s2 = spanToString(toSpan(formula2));
    return expect(s1).toBe(s2);
}

function mathJSON(latex) {
    return JSON.stringify(MathLive.latexToAST(latex));
}

function equalMathJSON(latex, json) {
    expect(mathJSON(latex)).toBe(json);
    const latexJSON = MathLive.astToLatex(json, { precision: 100 })
        .replace(/\\, /g, '')
        .trim();
    expect(latexJSON).toBe(latex);
}

function equalASCIIMath(latex, ascii) {
    expect(MathLiveDebug.latexToAsciiMath(latex)).toBe(ascii);

    expect(MathLiveDebug.asciiMathToLatex(ascii)).toBe(latex);
}

////////////////////////////////////////////////////////////////////////////////
test('BASIC PARSING', function () {
    expect(toSpan('')).toBeTruthy();
    equalSpan('%', '');
    equalSpan('a%b', 'a');
    equalSpan('a % b ', 'a');

    expect(getType('x', 0)).toBe('mord');
    hasClass('x', 0, 'ML__mathit');

    const ordString = '1234|/@.`abcdefgzABCDEFGZ';
    // const ordString = '1234|/@.\"`abcdefgzABCDEFGZ';
    const ordSpan = toSpan(ordString);
    expect(ordSpan).toBeTruthy();
    // @todo t.equal(ordSpan.length, 1, 'There should be a single span for all the characters');
    // @todo t.equal(ordSpan[0].body, ordString, 'The body of the span should be the same as the string');
    // @todo t.ok(hasClass(ordSpan, 0, 'mord'), "The span should be a 'mord'");

    equalSpan('a b', 'ab');
    equalSpan('a     b', 'ab');

    equalSpan('a~b', 'a\\space b');

    // equalSpan('{+}', '\\mathord{+}', 'A single item in a group is the same as the item in a "ord"');

    expect(getType('{a}b', 1)).toBe('mord');

    equalSpan('a%b x \\xyz', 'a');
    equalSpan('%b x \\xyz', '');

    equalSpan('a\nb', 'ab');
    equalSpan('a%b c \\xyz\nb', 'ab');

    equalSpan('a = 1 }{}{} ', 'a=1');
    equalSpan('a = 1 }}}}{{{ ', 'a=1');
});

////////////////////////////////////////////////////////////////////////////////
test('CHARACTERS', function () {
    // TeX \char command
    equalSpan('\\char"4A', 'J');
    equalSpan('\\char"004A', 'J');
    equalSpan("\\char'0112", 'J');
    equalSpan('\\char74', 'J');
    equalSpan('\\char "004A', 'J');

    // \unicode, a MathJax extension
    // (MathJax also accepts optional width, height and font arguments which we don't support)
    equalSpan('\\unicode{"4A}', 'J');
    equalSpan('\\unicode{"004A}', 'J');
    equalSpan('\\unicode{x004A}', 'J');
});

// function isTextOrd(symbols) {
//     for (const symbol of symbols) {
//         hasClass('\\text{' + symbol + '}', 0, 'textord',
//             symbol + ' is allowed');
//     }
// }

////////////////////////////////////////////////////////////////////////////////
test('TEXT MODE', function () {
    // t.equal(getType('\\text{ }', [0]), 'textord', "Spaces are preserved.");

    hasClass('\\text{ }', [0], 'ML__text');
});

////////////////////////////////////////////////////////////////////////////////
test('ARGUMENTS', function () {
    equalSpan('\\frac12', '\\frac{1}{2}');
    equalSpan('\\frac  1  2', '\\frac{1}{2}');
    equalSpan('\\frac357', '\\frac{3}{5}7');
    equalSpan('\\frac3a', '\\frac{3}{a}');
    equalSpan('\\frac\\alpha\\beta', '\\frac{\\alpha}{\\beta}');
    // equalSpan('\\frac{{1}}{2}', '\\frac{1}{2}', "Group inside an argument");
    equalSpan('\\frac  {  { 1  } } { 2 }', '\\frac{{1}}{2}');
});

////////////////////////////////////////////////////////////////////////////////
test('INFIX COMMANDS', function () {
    equalSpan('a\\over b', '\\frac{a}{b}');
    equalSpan('a\\over b c', '\\frac{a}{bc}');
    equalSpan('x{a+1\\over1-b}y', 'x{\\frac{a+1}{1-b}}y');

    equalSpan('x{a+1\\over1-b\\over2}y', 'x{a+1\\over1-b2}y');
});

////////////////////////////////////////////////////////////////////////////////
test('FUNCTIONAL ARGUMENTS', function () {
    equalSpan('\\frac1a', '\\frac{1}{a}');

    equalSpan('\\frac a b', '\\frac{a}{b}');

    equalSpan('\\frac  {a}  {b}', '\\frac{a}{b}');

    // equalSpan('\\frac', '\\frac{a}{b}',
    //     'Missing arguments');

    // equalSpan('\\frac{}{}', '\\frac{a}{b}',
    //     'Empty arguments');

    equalSpan('\\frac  {\\frac12}  {b}', '\\frac{\\frac12}{b}');
});

////////////////////////////////////////////////////////////////////////////////
// test('PARSING MODE', function () {});

////////////////////////////////////////////////////////////////////////////////
test('FONTS', function () {
    hasClass('\\alpha + x - 1 - \\Gamma', 'x', 'ML__mathit');
    notHasClass('\\alpha + x - 1 - \\Gamma', '1', 'ML__mathit');
    hasClass('\\alpha + x - 1 - \\Gamma', 'α', 'ML__mathit');
    notHasClass('\\alpha + x - 1 - \\Gamma', 'Γ', 'ML__mathit');

    notHasClass('\\mathfrak{\\sin}', 'sin', 'mathfrak');
});

////////////////////////////////////////////////////////////////////////////////
// test('ERRORS', function () {});

////////////////////////////////////////////////////////////////////////////////
test('BINARY OPERATORS', function () {
    expect(getType('a+b', '+')).toBe('mbin');
    expect(getType('f(a)+f(b)', '+')).toBe('mbin');
    expect(getType('x^n+y^n', '+')).toBe('mbin');
    expect(getType('+b', '+')).toBe('mord');
    expect(getType('(+b', '+')).toBe('mord');
    expect(getType('=+b', '+')).toBe('mord');
    expect(getType('\\sin+b', '+')).toBe('mord');
    expect(getType(', +b', '+')).toBe('mord');

    expect(getType('\\textcolor{red}{a}+b', '+')).toBe('mbin');
    expect(getType('\\textcolor{red}{a=}+b', '+')).toBe('mord');

    expect(getType('a^2+b', '+')).toBe('mbin');
    expect(getType('a^{2}+b', '+')).toBe('mbin');
});

////////////////////////////////////////////////////////////////////////////////
// test('TYPE COERCION', function () {});

////////////////////////////////////////////////////////////////////////////////
// test('SUBSCRIPSUPERSCRIPTS AND LIMITS', function () {});

////////////////////////////////////////////////////////////////////////////////
test('FRACTIONS', function () {
    expect(toSpan('\\frac57')).toBeTruthy();
    expect(toSpan('\\frac {5} {7}')).toBeTruthy();
    expect(toSpan('\\frac {\\frac57} {\\frac37}')).toBeTruthy();

    expect(
        toSpan(
            '\\[ 1 + \\frac{q^2}{(1-q)}+\\frac{q^6}{(1-q)(1-q^2)}+\\cdots = \\prod_{j=0}^{\\infty}\\frac{1}{(1-q^{5j+2})(1-q^{5j+3})}, \\quad\\quad \\text{for $|q|<1$}. \\]'
        )
    ).toBeTruthy();

    expect(toSpan('\\binom{n}{k}')).toBeTruthy();
    expect(toSpan('\\dbinom{n}{k}')).toBeTruthy();
    expect(toSpan('\\tbinom{n}{k}')).toBeTruthy();

    equalSpan('n \\choose k', '\\binom{n}{k}');

    // @todo: a better rest...
    expect(toSpan('\\pdiff{f(x)}{x}')).toBeTruthy();
});

// function hasSize(size) {
//     hasClass('a' + size + '{b c}d', 'a', 'rule', 'Sizing ' + size);
// }

////////////////////////////////////////////////////////////////////////////////
test('SIZING AND MATH STYLE', function () {
    expect(toSpan('\\text{a \\tiny x y}b')).toBeTruthy();
});

////////////////////////////////////////////////////////////////////////////////
test('RULE AND DIMENSIONS', function () {
    hasClass('\\rule{1em}{2em}', 0, 'rule');
    hasClass('\\rule[1em]{1em}{2em}', 0, 'rule');
    hasClass('\\rule{1em}', 0, 'rule');
    hasClass('\\rule{-1em}{+10em}', 0, 'rule');

    hasClass('\\rule{0}{4}', 0, 'rule');
    hasClass('\\rule{1245.5667em}{2902929,292929em}', 0, 'rule');

    hasClass('\\rule{5mm}{7mm}', 0, 'rule');
    hasClass('\\rule{5cm}{7cm}', 0, 'rule');
    hasClass('\\rule{5ex}{7ex}', 0, 'rule');
    hasClass('\\rule{5em}{7em}', 0, 'rule');
    hasClass('\\rule{5bp}{7bp}', 0, 'rule');
    hasClass('\\rule{5dd}{7dd}', 0, 'rule');
    hasClass('\\rule{5pc}{7pc}', 0, 'rule');
    hasClass('\\rule{5in}{7in}', 0, 'rule');
    hasClass('\\rule{5mu}{7mu}', 0, 'rule');

    equalSpan('\\rule{10}{10pt}', '\\rule{10pt}{10pt}');
    equalSpan('\\rule{+10em}{+  10 em}', '\\rule{10em}{10em}');
    equalSpan("\\rule{'12em}{10em}", '\\rule{10em}{10em}');
    equalSpan("\\rule{'12.9999em}{10em}", '\\rule{10pt}{10em}');

    // However, TeX doesn't parse it either...  Actually, TeX doesn't even parse "a2em
    // For TeX, hex digits have to be uppercase. Interestingly, TeX cannot parse
    // '\\rule{\"A EM}{10em}' (the AE confuses it)
    equalSpan('\\rule{"A em}{10em}', '\\rule{10em}{10em}');
});

////////////////////////////////////////////////////////////////////////////////
test('DECORATIONS', function () {
    expect(getStyle('\\bbox{1+x}', 0, 'border')).toBe(undefined);

    expect(
        getStyle('\\bbox[border:solid 1px red]{1+x}', [0, 0], 'border')
    ).toBe('solid 1px red');

    // t.equal(getStyle('\\bbox[4em]{1+x}', 0, 'padding-left'),'4em',
    //     '\\bbox with margin');

    expect(getStyle('\\bbox[yellow]{1+x}', [0, 0], 'background-color')).toBe(
        '#fff200'
    );

    expect(
        getStyle(
            '\\bbox[ yellow , border: 1px solid red, 4 em ]{1+x}',
            [0, 0],
            'border'
        )
    ).toBe('1px solid red');
    expect(
        getStyle(
            '\\bbox[ yellow , border: 1px solid red, 4 em ]{1+x}',
            [0, 0],
            'background-color'
        )
    ).toBe('#fff200');
    // t.equal(getStyle('\\bbox[ yellow , border: 1px solid red, 4 em ]{1+x}', 0,
    //     'margin-left'),'4em',
    //     '\\bbox with border, margin and background');

    hasClass('\\rlap{x}o', 0, 'rlap');
    // hasClass('\\rlap{x}o', [0, 0, 0], 'ML__text', 'The argument of \\rlap is in text mode');
    hasClass('\\mathrlap{x}o', [0, 0, 0], 'ML__mathit');

    hasClass('\\llap{x}o', 0, 'llap');
    // hasClass('\\llap{x}o', [0, 0, 0], 'ML__text', 'The argument of \\llap is in text mode');
    hasClass('\\mathllap{x}o', [0, 0, 0], 'ML__mathit');
});

////////////////////////////////////////////////////////////////////////////////
test('OVER/UNDERLINE', function () {
    expect(toSpan('a\\overline{x}b')).toBeTruthy();
    expect(
        toSpan(
            '\\overline{xyz}\\overline{1+\\frac34}\\underline{abc}\\underline{\\frac57}'
        )
    ).toBeTruthy();
    expect(toSpan('\\underline{\\frac14}')).toBeTruthy();
});

////////////////////////////////////////////////////////////////////////////////
test('SPACING AND KERN', function () {
    expect(toSpan('a\\hskip 3em b')).toBeTruthy();
    expect(toSpan('a\\kern 3em b')).toBeTruthy();
    expect(toSpan('a\\hspace{3em} b')).toBeTruthy();
    equalSpan('a\\hskip 3em b', 'a\\hspace{3em} b');
});

function testDelimiter(openDel, closeDel) {
    // Regular sized delimiters
    expect(
        getType('\\left' + openDel + ' x + 1' + '\\right' + closeDel, [0, 0])
    ).toBe('mopen');
    expect(
        getType('\\left' + openDel + ' x + 1' + '\\right' + closeDel, [0, 4])
    ).toBe('mclose');
    // t.notEqual(getType("\\left" + openDel + " x + 1" + "\\right" + closeDel, [0,0]),
    //     'nulldelimiter', "Open delimiter " + openDel + (msg ? ' ' + msg : ''));
    // t.notEqual(getType(("\\left" + openDel + " x + 1" + "\\right" + closeDel, [0,4]),
    //     'nulldelimiter', "Close delimiter " + closeDel + (msg ? ' ' + msg : ''));

    // Delimiters with large expression
    expect(
        getType(
            '\\left' +
                openDel +
                ' x \\frac{\\frac34}{\\frac57}' +
                '\\right' +
                closeDel,
            [0, 0]
        )
    ).toBe('mopen');
    expect(
        getType(
            '\\left' +
                openDel +
                ' x \\frac{\\frac34}{\\frac57}' +
                '\\right' +
                closeDel,
            [0, 3]
        )
    ).toBe('mclose');
    // t.notEqual(getType("\\left" + openDel + " x \\frac{\\frac34}{\\frac57}" + "\\right" + closeDel, [0,0]),
    //     'nulldelimiter', "Large open delimiter " + openDel + (msg ? ' ' + msg : ''));
    // t.notEqual(getType("\\left" + openDel + " x \\frac{\\frac34}{\\frac57}" + "\\right" + closeDel, [0,3]),
    //     'nulldelimiter', "Large close delimiter " + closeDel + (msg ? ' ' + msg : ''));
}

////////////////////////////////////////////////////////////////////////////////
test('LEFT/RIGHT', function () {
    // equalSpan('\\left(a\\right)', '\\left{(}a\\right{)}',
    //     '\\left\\right with unbraced arguments');

    expect(getType('\\left(a\\right)', [0, 0])).toBe('mopen');
    expect(getType('\\left(a\\right)', [0, 2])).toBe('mclose');

    expect(getType('\\left(\\frac12\\right)', [0, 0])).toBe('mopen');

    hasClass('\\left.\\frac12\\right.', [0, 0], 'nulldelimiter');
    hasClass('\\left.\\frac12\\right.', [0, 2], 'nulldelimiter');

    testDelimiter('[', ']');

    testDelimiter('\\lfloor', '\\rfloor');

    hasClass('\\left a\\frac12\\right0', [0, 0], 'nulldelimiter');

    hasClass('\\left a\\frac12\\right0', [0, 2], 'nulldelimiter');

    expect(getType('\\left\\ulcorner\\frac12\\right\\urcorner', [0, 0])).toBe(
        'mopen'
    );

    expect(getType('\\left\\uparrow\\frac12\\right\\Downarrow', [0, 0])).toBe(
        'mopen'
    );

    expect(
        getType('\\left\\uparrow\\frac{\\frac34}{2}\\right\\vert', [0, 0])
    ).toBe('mopen');

    expect(
        getType(
            '\\left\\uparrow\\frac{\\frac{\\frac57}{\\frac95}}{2}\\right\\vert',
            [0, 0]
        )
    ).toBe('mopen');

    expect(getType('{\\tiny\\left\\uparrow x\\right\\vert}', [0, 0, 0])).toBe(
        'mopen'
    );

    expect(
        getType('\\left\\lfloor\\frac{\\frac34}{2}\\right\\rfloor', [0, 0])
    ).toBe('mopen');

    expect(getType('\\left\\lfloor x\\right\\rfloor', [0, 0])).toBe('mopen');

    expect(
        getType('\\left\\langle\\frac{\\frac34}{2}\\right\\rangle', [0, 0])
    ).toBe('mopen');

    expect(getType('\\left<\\frac{\\frac34}{2}\\right>', [0, 0])).toBe('mopen');

    hasClass('\\left x\\frac{\\frac34}{2}\\right x', [0, 0], 'nulldelimiter');
    hasClass('\\left x\\frac{\\frac34}{2}\\right x', [0, 2], 'nulldelimiter');

    // All the stacking delimiters
    testDelimiter('\\vert', '\\vert');
    testDelimiter('\\lvert', '\\rvert');
    testDelimiter('\\Vert', '\\Vert');
    testDelimiter('\\lVert', '\\rVert');
    testDelimiter('\\|', '|');
    testDelimiter('\\uparrow', '\\downarrow');
    testDelimiter('\\Downarrow', '\\Uparrow');
    testDelimiter('\\Updownarrow', '\\updownarrow');
    testDelimiter('\\lbrack', '\\rbrack');
    testDelimiter('\\lfloor', '\\rfloor');
    testDelimiter('\\lceil', '\\rceil');
    testDelimiter('(', ')');
    testDelimiter('\\{', '\\}');
    testDelimiter('\\lbrace', '\\rbrace');
    testDelimiter('\\lgroup', '\\rgroup');
    testDelimiter('\\lmoustache', '\\rmoustache');
    testDelimiter('\\surd', '\\surd');

    // Middle
    hasClass('\\left(a\\middle|b\\right)', [0, 2], 'style-wrap');
    hasClass('\\left(a\\middle xb\\right)', [0, 2], 'nulldelimiter');
});

////////////////////////////////////////////////////////////////////////////////
function testSizingDelimiter(openCmd, closeCmd, midCmd, ordCmd) {
    // Regular sized delimiters

    expect(
        getType(
            openCmd +
                '\\lbrack x' +
                midCmd +
                '\\vert y ' +
                ordCmd +
                '\\Vert z' +
                closeCmd +
                '\\rbrack',
            0
        )
    ).toBe('mopen');

    expect(getType(openCmd + '\\lbrack x' + closeCmd + '\\rbrack', 2)).toBe(
        'mclose'
    );

    expect(
        getType(
            openCmd +
                '< x' +
                midCmd +
                '\\vert y ' +
                ordCmd +
                '\\Vert z' +
                closeCmd +
                '>',
            0
        )
    ).toBe('mopen');

    expect(getType(openCmd + '< x' + closeCmd + '>', 2)).toBe('mclose');
}

test('SIZED DELIMITERS', function () {
    testSizingDelimiter('\\bigl', '\\bigr', '\\bigm', '\\big');
    testSizingDelimiter('\\Bigl', '\\Bigr', '\\Bigm', '\\Big');
    testSizingDelimiter('\\biggl', '\\biggr', '\\biggm', '\\bigg');
    testSizingDelimiter('\\Biggl', '\\Biggr', '\\Biggm', '\\Bigg');
});

////////////////////////////////////////////////////////////////////////////////
test('ENVIRONMENTS', function () {
    // t.ok(toSpan('\\begin'), '\\begin with no argumenno \\end');
    // t.ok(toSpan('\\begin{a}'), '\\begin with argumenno \\end');
    // t.ok(toSpan('\\begin{a}\\end'), '\\begin with argumen\\end with no argument');
    // t.ok(toSpan('\\begin{a}\\end{x}'), '\\begin with argumen\\end with mismatched argument');

    equalSpan('\\begin{array}a\\end{xyz}', '\\begin{array}a\\end{array}');
    equalSpan('\\begin{array}a', '\\begin{array}a\\end{array}');

    // A legal environment name consist only of letters and "*"
    expect(toSpan('\\begin{\\alpha}\\end{\\alpha}')).toBeTruthy();
    expect(toSpan('\\begin{1732}\\end{1732}')).toBeTruthy();
    expect(toSpan('\\begin{.}\\end{.}')).toBeTruthy();
    expect(toSpan('\\begin{(}\\end{(}')).toBeTruthy();
});

////////////////////////////////////////////////////////////////////////////////
test('SURDS', function () {
    expect(toSpan('\\sqrt5')).toBeTruthy();

    expect(toSpan('\\sqrt{}')).toBeTruthy();
    expect(toSpan('\\sqrt')).toBeTruthy();

    expect(
        toSpan(
            'ax^2+bx+c = a \\left( x - \\frac{-b + \\sqrt {b^2-4ac}}{2a} \\right) \\left( x - \\frac{-b - \\sqrt {b^2-4ac}}{2a} \\right)'
        )
    ).toBeTruthy();

    expect(toSpan('\\sqrt[3]{5}')).toBeTruthy();
    expect(toSpan('\\sqrt[3]5')).toBeTruthy();
});

////////////////////////////////////////////////////////////////////////////////
test('ACCENTS', function () {
    hasClass('\\vec)', 0, 'accent');
    hasClass('\\vec{x+1})', 0, 'accent');

    hasClass('\\acute{x+1})', 0, 'accent');
    hasClass('\\grave{x+1})', 0, 'accent');
    hasClass('\\dot{x+1})', 0, 'accent');
    hasClass('\\ddot{x+1})', 0, 'accent');
    hasClass('\\tilde{x+1})', 0, 'accent');
    hasClass('\\bar{x+1})', 0, 'accent');
    hasClass('\\breve{x+1})', 0, 'accent');
    hasClass('\\check{x+1})', 0, 'accent');
    hasClass('\\hat{x+1})', 0, 'accent');
    hasClass('\\vec{x+1})', 0, 'accent');
});

////////////////////////////////////////////////////////////////////////////////
// test('PHANTOM', function () {});

////////////////////////////////////////////////////////////////////////////////
test('COLORS', function () {
    // formula.insertText("\\sin x \\textcolor{#f00}{red} \\backgroundcolor{yellow}{x + \\frac1{\\frac34}} \\textcolor{m1}{\\blacktriangle}\\textcolor{m2}{\\blacktriangle}\\textcolor{m3}{\\blacktriangle}\\textcolor{m4}{\\blacktriangle}\\textcolor{m5}{\\blacktriangle}\\textcolor{m6}{\\blacktriangle}\\textcolor{m7}{\\blacktriangle}\\textcolor{m8}{\\blacktriangle}\\textcolor{m9}{\\blacktriangle}");
    // formula.insertText("\\textcolor{aquamarine}{\\blacksquare}");
    // formula.insertText("\\textcolor{rgb(240, 10, 200)}{\\blacksquare}");
    // formula.insertText("\\textcolor{#33d}{\\blacksquare}");
    // formula.insertText("\\textcolor{#3130da}{\\blacksquare}");
    // formula.insertText("a+\\backgroundcolor{#f00}{\\frac1{\\frac{a+1}{b+c}}}");
    // formula.insertText("a+\\backgroundcolor{#f00}{\\frac{\\frac{\\frac{1}{2}}{c}}{\\frac{a+1}{b+c}}}");
    // formula.insertText("a+\\backgroundcolor{#f00}{\\frac{\\frac{\\frac{1}{2}}{c}}{a}");

    expect(getStyle('\\textcolor{white}{x}', 0, 'color')).toBe('#ffffff');

    expect(getStyle('\\textcolor{aquamarine}{x}', 0, 'color')).toBe('#00b5be');
    expect(getStyle('\\textcolor{AquaMarine}{x}', 0, 'color')).toBe('#00b5be');
    expect(getStyle('\\textcolor{M5}{x}', 0, 'color')).toBe('#993d90');

    equalSpan('\\textcolor{#fff}{x}', '\\textcolor{white}{x}');
    equalSpan('\\textcolor{#ffffff}{x}', '\\textcolor{white}{x}');
    equalSpan('\\textcolor{#fCFcfC}{x}', '\\textcolor{#fcfcfc}{x}');
    equalSpan('\\textcolor{rgb(255, 255, 255)}{x}', '\\textcolor{white}{x}');

    equalSpan('\\textcolor{rgb(255,255,255)}{x}', '\\textcolor{white}{x}');
    equalSpan(
        '\\textcolor{  rgb  (  255  ,  255  ,  255  ) }{x}',
        '\\textcolor{white}{x}'
    );

    equalSpan('\\textcolor{rgb(3.5, 0, 0)}{x}', '\\textcolor{white}{x}');
    equalSpan('\\textcolor{rgb(3, 5, 7}{x}', '\\textcolor{white}{x}');
    equalSpan(
        '\\textcolor{rgb(125.5, 0.556, -12.5)}{x}',
        '\\textcolor{white}{x}'
    );
    equalSpan('\\textcolor{rgb(xxy)}{x}', '\\textcolor{white}{x}');
    equalSpan('\\textcolor{rgb(3, 5)}{x}', '\\textcolor{white}{x}');
    equalSpan('\\textcolor{rgb(3, 5, 7, 11)}{x}', '\\textcolor{white}{x}');

    equalSpan('\\textcolor{#111!50}{x}', '\\textcolor{#888888}{x}');
    equalSpan('\\textcolor{#111!50!#fff}{x}', '\\textcolor{#888888}{x}');

    equalSpan('\\textcolor{#111!50!#000}{x}', '\\textcolor{#090909}{x}');

    equalSpan('\\textcolor{#f00!80!#00f}{x}', '\\textcolor{#cc0033}{x}');

    equalSpan('\\textcolor{-green!40!yellow}{x}', '\\textcolor{#662bdf}{x}');

    // formula.insertText("a+\\backgroundcolor{#f00}{\\frac1{\\frac{a+1}{b+c}}}");
    // formula.insertText("a+\\backgroundcolor{#f00}{\\frac{\\frac{\\frac{1}{2}}{c}}{\\frac{a+1}{b+c}}}");
    // formula.insertText("a+\\backgroundcolor{#f00}{\\frac{\\frac{\\frac{1}{2}}{c}}{a}");

    // a{b\\color c}d}
    let f = 'a{b\\color{#f00} c}d';
    expect(
        getStyle(f, 'a', 'color') === null &&
            getStyle(f, 'b', 'color') === null &&
            getStyle(f, 'c', 'color') === '#ff0000' &&
            getStyle(f, 'd', 'color') === null
    ).toBeTruthy();

    f = 'a\\left(b\\color{#f00} c\\right)d';
    expect(
        getStyle(f, 'a', 'color') === null &&
            getStyle(f, 'b', 'color') === null &&
            getStyle(f, 'c', 'color') === '#ff0000' &&
            getStyle(f, 'd', 'color') === null
    ).toBeTruthy();

    expect(
        toSpan(
            '{\\color{apricot}\\blacksquare}{\\color{aquamarine}\\blacksquare}{\\color{bittersweet}\\blacksquare}{\\color{black}\\blacksquare}{\\color{blue}\\blacksquare}{\\color{blueGreen}\\blacksquare}{\\color{blueviolet}\\blacksquare}{\\color{brickred}\\blacksquare}{\\color{brown}\\blacksquare}{\\color{burntorange}\\blacksquare}{\\color{cadetblue}\\blacksquare}{\\color{carnationpink}\\blacksquare}{\\color{cerulean}\\blacksquare}{\\color{cornflowerblue}\\blacksquare}{\\color{cyan}\\blacksquare}{\\color{dandelion}\\blacksquare}{\\color{darkorchid}\\blacksquare}{\\color{emerald}\\blacksquare}{\\color{forestgreen}\\blacksquare}{\\color{fuchsia}\\blacksquare}{\\color{goldenrod}\\blacksquare}{\\color{gray}\\blacksquare}{\\color{green}\\blacksquare}{\\color{greenyellow}\\blacksquare}{\\color{junglegreen}\\blacksquare}{\\color{lavender}\\blacksquare}{\\color{limegreen}\\blacksquare}{\\color{magenta}\\blacksquare}{\\color{mahogany}\\blacksquare}{\\color{maroon}\\blacksquare}{\\color{melon}\\blacksquare}{\\color{midnightblue}\\blacksquare}{\\color{mulberry}\\blacksquare}{\\color{navyblue}\\blacksquare}{\\color{olivegreen}\\blacksquare}{\\color{orange}\\blacksquare}{\\color{orangered}\\blacksquare}{\\color{orchid}\\blacksquare}{\\color{peach}\\blacksquare}{\\color{periwinkle}\\blacksquare}{\\color{pinegreen}\\blacksquare}{\\color{plum}\\blacksquare}{\\color{processblue}\\blacksquare}{\\color{purple}\\blacksquare}{\\color{rawsienna}\\blacksquare}{\\color{red}\\blacksquare}{\\color{redorange}\\blacksquare}{\\color{redviolet}\\blacksquare}{\\color{rhodamine}\\blacksquare}{\\color{royalblue}\\blacksquare}{\\color{royalpurple}\\blacksquare}{\\color{rubinered}\\blacksquare}{\\color{salmon}\\blacksquare}{\\color{seagreen}\\blacksquare}{\\color{sepia}\\blacksquare}{\\color{skyblue}\\blacksquare}{\\color{springgreen}\\blacksquare}{\\color{tan}\\blacksquare}{\\color{tealblue}\\blacksquare}{\\color{thistle}\\blacksquare}{\\color{turquoise}\\blacksquare}{\\color{violet}\\blacksquare}{\\color{violetred}\\blacksquare}{\\color{white}\\blacksquare}{\\color{wildstrawberry}\\blacksquare}{\\color{yellow}\\blacksquare}{\\color{yellowgreen}\\blacksquare}{\\color{yelloworange}\\blacksquare}'
        )
    ).toBeTruthy();
});

test('MATH JSON', function () {
    equalMathJSON('', undefined);
    equalMathJSON('7', '{"num":"7"}');
    equalMathJSON('-7', '{"num":"-7"}');
    equalMathJSON('+7', '{"fn":"add","arg":[{"num":"7"}]}');
    equalMathJSON(
        '123456789012345678901234567890',
        '{"num":"123456789012345678901234567890"}'
    );
    equalMathJSON(
        '123456789012345678901234567890.12345678909876543210123456789',
        '{"num":"123456789012345678901234567890.12345678909876543210123456789"}'
    );
    equalMathJSON('-x', '{"fn":"negate","arg":[{"sym":"x"}]}');
    equalMathJSON('+x', '{"fn":"add","arg":[{"sym":"x"}]}');
    equalMathJSON('279479', '{"num":"279479"}');
    equalMathJSON('3.1415', '{"num":"3.1415"}');
    equalMathJSON('-67', '{"num":"-67"}');
    equalMathJSON('-67.354658', '{"num":"-67.354658"}');
    expect(mathJSON('-23.45e5')).toBe('{"num":"-2345000"}');
    expect(mathJSON('-23.45e-11')).toBe('{"num":"-2.345e-10"}');
    expect(mathJSON('-2.345\\cdot  10^{-10}')).toBe('{"num":"-2.345e-10"}');

    equalMathJSON('2\\imaginaryI', '{"num":{"im":"2"}}');
    equalMathJSON('1+2\\imaginaryI', '{"num":{"re":"1","im":"2"}}');
    equalMathJSON('-1-2\\imaginaryI', '{"num":{"re":"-1","im":"-2"}}');
    equalMathJSON(
        '2\\imaginaryI  + 1',
        '{"fn":"add","arg":[{"num":{"im":"2"}},{"num":"1"}]}'
    );
    equalMathJSON(
        '\\frac{1}{5}\\imaginaryI  + \\frac{1}{2}',
        '{"fn":"add","arg":[{"fn":"multiply","arg":[{"fn":"divide","arg":[{"num":"1"},{"num":"5"}]},{"num":{"im":"1"}}]},{"fn":"divide","arg":[{"num":"1"},{"num":"2"}]}]}'
    );
    equalMathJSON(
        '\\imaginaryI \\imaginaryI',
        '{"fn":"multiply","arg":[{"num":{"im":"1"}},{"num":{"im":"1"}}]}'
    );

    equalMathJSON('1 + 2', '{"fn":"add","arg":[{"num":"1"},{"num":"2"}]}');
    equalMathJSON('1 + x', '{"fn":"add","arg":[{"num":"1"},{"sym":"x"}]}');
    equalMathJSON(
        '1 + 2 + 3 + x',
        '{"fn":"add","arg":[{"num":"1"},{"num":"2"},{"num":"3"},{"sym":"x"}]}'
    );
    expect(mathJSON('2 * 4')).toBe(
        '{"fn":"multiply","arg":[{"num":"2"},{"num":"4"}]}'
    );
    expect(mathJSON('2*3*4')).toBe(
        '{"fn":"multiply","arg":[{"num":"2"},{"num":"3"},{"num":"4"}]}'
    );
    expect(mathJSON('2 \\cdot 3 \\times 4')).toBe(
        '{"fn":"multiply","arg":[{"num":"2"},{"num":"3"},{"num":"4"}]}'
    );
    expect(mathJSON('2 * 4 * x * 7')).toBe(
        '{"fn":"multiply","arg":[{"num":"2"},{"num":"4"},{"sym":"x"},{"num":"7"}]}'
    );

    equalMathJSON('7 - 5', '{"fn":"subtract","arg":[{"num":"7"},{"num":"5"}]}');
    equalMathJSON('7 - x', '{"fn":"subtract","arg":[{"num":"7"},{"sym":"x"}]}');
    equalMathJSON(
        '7-5-3',
        '{"fn":"add","arg":[{"num":"7"},{"num":"-5"},{"num":"-3"}]}'
    );

    equalMathJSON(
        'a-b-c',
        '{"fn":"add","arg":[{"sym":"a"},{"fn":"negate","arg":[{"sym":"b"}]},{"fn":"negate","arg":[{"sym":"c"}]}]}'
    );

    equalMathJSON(
        'x = y = z',
        '{"fn":"equal","arg":[{"sym":"x"},{"sym":"y"},{"sym":"z"}]}'
    );

    equalMathJSON(
        'x < y < z',
        '{"fn":"lt","arg":[{"fn":"lt","arg":[{"sym":"x"},{"sym":"y"}]},{"sym":"z"}]}'
    );

    equalMathJSON(
        '7-5-2 + 8 + 2-1',
        '{"fn":"add","arg":[{"num":"7"},{"num":"-5"},{"num":"-2"},{"num":"8"},{"num":"2"},{"num":"-1"}]}'
    );

    equalMathJSON(
        '2(x + 1)',
        '{"fn":"multiply","arg":[{"num":"2"},{"fn":"add","arg":[{"sym":"x"},{"num":"1"}]}]}'
    );

    equalMathJSON(
        '\\frac{12}{17}',
        '{"fn":"divide","arg":[{"num":"12"},{"num":"17"}]}'
    );

    equalMathJSON('2^{5}', '{"num":"2","sup":{"num":"5"}}');
    equalMathJSON('2^{-2}', '{"num":"2","sup":{"num":"-2"}}');
    equalMathJSON(
        '(1 + 2)^{3}',
        '{"group":{"fn":"add","arg":[{"num":"1"},{"num":"2"}]},"sup":{"num":"3"}}'
    );
    equalMathJSON(
        '(1 + 2)^{3 + 4}',
        '{"group":{"fn":"add","arg":[{"num":"1"},{"num":"2"}]},"sup":{"fn":"add","arg":[{"num":"3"},{"num":"4"}]}}'
    );
    expect(mathJSON('(x)=0')).toBe(
        '{"fn":"equal","arg":[{"sym":"x"},{"num":"0"}]}'
    );
    expect(mathJSON('\\left(1+2\\right)^{3}')).toBe(
        '{"group":{"fn":"add","arg":[{"num":"1"},{"num":"2"}]},"sup":{"num":"3"}}'
    );
    equalMathJSON('2^{0.5}', '{"num":"2","sup":{"num":"0.5"}}');
    equalMathJSON(
        '2^{\\frac{1}{2}}',
        '{"num":"2","sup":{"fn":"divide","arg":[{"num":"1"},{"num":"2"}]}}'
    );
    equalMathJSON(
        '(2 \\times 4)^{2}',
        '{"group":{"fn":"multiply","arg":[{"num":"2"},{"num":"4"}]},"sup":{"num":"2"}}'
    );
    equalMathJSON(
        '(2\\imaginaryI )^{2}',
        '{"group":{"num":{"im":"2"}},"sup":{"num":"2"}}'
    );
    equalMathJSON(
        '(2\\imaginaryI  + 1)^{2}',
        '{"group":{"fn":"add","arg":[{"num":{"im":"2"}},{"num":"1"}]},"sup":{"num":"2"}}'
    );

    expect(mathJSON('\\sqrt{3}x')).toBe(
        '{"fn":"multiply","arg":[{"fn":"sqrt","arg":[{"num":"3"}]},{"sym":"x"}]}'
    );

    expect(mathJSON('\\sqrt{3}i')).toBe(
        '{"fn":"multiply","arg":[{"fn":"sqrt","arg":[{"num":"3"}]},{"sym":"i"}]}'
    );

    expect(mathJSON('\\cos ^{-1}x')).toBe(
        '{"fn":"arccos","arg":[{"sym":"x"}]}'
    );

    equalMathJSON('\\N', '{"sym":"\u2115"}');

    equalMathJSON(
        '\\sin x^{2}',
        '{"fn":"sin","arg":[{"sym":"x","sup":{"num":"2"}}]}'
    );
    equalMathJSON(
        '\\sin \\theta^{2}',
        '{"fn":"sin","arg":[{"sym":"θ","sup":{"num":"2"}}]}'
    );

    equalMathJSON('n!', '{"fn":"factorial","arg":[{"sym":"n"}]}');
    equalMathJSON(
        'n + 3!',
        '{"fn":"add","arg":[{"sym":"n"},{"fn":"factorial","arg":[{"num":"3"}]}]}'
    );

    equalMathJSON('x', '{"sym":"x"}');
    equalMathJSON('2x', '{"fn":"multiply","arg":[{"num":"2"},{"sym":"x"}]}');
    equalMathJSON(
        '\\frac{x}{7}',
        '{"fn":"divide","arg":[{"sym":"x"},{"num":"7"}]}'
    );
    // equalMathJSON('(x+1)3', '', 'Implicit multiplication of group');
    equalMathJSON('x^{4}', '{"sym":"x","sup":{"num":"4"}}');
    equalMathJSON(
        '2^{x + 1}',
        '{"num":"2","sup":{"fn":"add","arg":[{"sym":"x"},{"num":"1"}]}}'
    );
    equalMathJSON(
        '2x^{3}',
        '{"fn":"multiply","arg":[{"num":"2"},{"sym":"x","sup":{"num":"3"}}]}'
    );
    equalMathJSON(
        '2x^{3} + 3x^{2} + 19x',
        '{"fn":"add","arg":[{"fn":"multiply","arg":[{"num":"2"},{"sym":"x","sup":{"num":"3"}}]},{"fn":"multiply","arg":[{"num":"3"},{"sym":"x","sup":{"num":"2"}}]},{"fn":"multiply","arg":[{"num":"19"},{"sym":"x"}]}]}'
    );
    equalMathJSON('x_{2}', '{"sym":"x","sub":{"num":"2"}}');

    equalMathJSON('\\sin x', '{"fn":"sin","arg":[{"sym":"x"}]}');
    equalMathJSON(
        '\\sin x + 1',
        '{"fn":"add","arg":[{"fn":"sin","arg":[{"sym":"x"}]},{"num":"1"}]}'
    );
    equalMathJSON('f (x)', '{"fn":"f","arg":[{"sym":"x"}]}');
    equalMathJSON(
        'f^{\\prime} (x)',
        '{"fn":"f","sup":{"sym":"′"},"arg":[{"sym":"x"}]}'
    );

    equalMathJSON(
        '\\sum_{k = 1}^{n} b_{k}',
        '{"fn":"sum","sub":{"fn":"equal","arg":[{"sym":"k"},{"num":"1"}]},"sup":{"sym":"n"},"arg":[{"sym":"b","sub":{"sym":"k"}}]}'
    );

    equalMathJSON(
        'x^{2} + 3x|_{x = 1}',
        '{"fn":"bind","arg":[{"fn":"add","arg":[{"sym":"x","sup":{"num":"2"}},{"fn":"multiply","arg":[{"num":"3"},{"sym":"x"}]}]},{"sym":"x"},{"num":"1"}]}'
    );

    equalMathJSON(
        'x^{2} + 3x|_{x = y}',
        '{"fn":"bind","arg":[{"fn":"add","arg":[{"sym":"x","sup":{"num":"2"}},{"fn":"multiply","arg":[{"num":"3"},{"sym":"x"}]}]},{"sym":"x"},{"sym":"y"}]}'
    );

    equalMathJSON(
        'x^{2} + 3x|_{x = x^{2} + x}',
        '{"fn":"bind","arg":[{"fn":"add","arg":[{"sym":"x","sup":{"num":"2"}},{"fn":"multiply","arg":[{"num":"3"},{"sym":"x"}]}]},{"sym":"x"},{"fn":"add","arg":[{"sym":"x","sup":{"num":"2"}},{"sym":"x"}]}]}'
    );

    expect(mathJSON('x^2+3x|_1')).toBe(
        '{"fn":"bind","arg":[{"fn":"add","arg":[{"sym":"x","sup":{"num":"2"}},{"fn":"multiply","arg":[{"num":"3"},{"sym":"x"}]}]},{"sym":"x"},{"num":"1"}]}'
    );

    equalMathJSON(
        'x^{2} + 3x|_{y = 1, x = 2}',
        '{"fn":"bind","arg":[{"fn":"add","arg":[{"sym":"x","sup":{"num":"2"}},{"fn":"multiply","arg":[{"num":"3"},{"sym":"x"}]}]},{"sym":"y"},{"num":"1"},{"sym":"x"},{"num":"2"}]}'
    );

    expect(mathJSON('\\sin (\\theta ^{2})|_{\\theta = \\pi  }')).toBe(
        '{"fn":"bind","arg":[{"fn":"sin","arg":[{"sym":"θ","sup":{"num":"2"}}]},{"sym":"θ"},{"sym":"π"}]}'
    );

    equalMathJSON(
        '\\sqrt{x}|_{x = 2}',
        '{"fn":"bind","arg":[{"fn":"sqrt","arg":[{"sym":"x"}]},{"sym":"x"},{"num":"2"}]}'
    );

    equalMathJSON(
        '\\ln_{10} (10^{2})',
        '{"fn":"ln","sub":{"num":"10"},"arg":[{"num":"10","sup":{"num":"2"}}]}'
    );

    // equalMathJSON('x^{2} + 3x|_{x = 1, 2, 3}',
    //     '{"fn":"bind","arg":[{"fn":"add","arg":[{"sym":"x","sup":{"num":"2"}},{"fn":"multiply","arg":[{"num":"3"},{"sym":"x"}]}]},{"sym":"x"},{"num":"1"}]}',
    //     'Bind polynomial with list');

    expect(mathJSON('|-1|')).toBe('{"fn":"abs","arg":[{"num":"-1"}]}');

    equalMathJSON('\\left| -1 \\right|', '{"fn":"abs","arg":[{"num":"-1"}]}');

    equalMathJSON(
        '\\lceil 100\\operatorname{randomReal}() \\rceil',
        '{"fn":"ceil","arg":[{"fn":"multiply","arg":[{"num":"100"},{"fn":"randomReal"}]}]}'
    );

    equalMathJSON(
        'f (x) = \\sin x',
        '{"fn":"equal","arg":[{"fn":"f","arg":[{"sym":"x"}]},{"fn":"sin","arg":[{"sym":"x"}]}]}'
    );
});

////////////////////////////////////////////////////////////////////////////////
test('ASCII MATH', function () {
    equalASCIIMath('123', '123');
    equalASCIIMath('-123.456', '-123.456');
    equalASCIIMath('-123.456e9', '-123.456e9');
    equalASCIIMath('x', 'x');
    equalASCIIMath('-x', '-x');

    equalASCIIMath('npq', 'npq');
    equalASCIIMath('2npq', '2npq');

    expect(MathLiveDebug.latexToAsciiMath('(x)')).toBe('(x)');
    expect(MathLiveDebug.asciiMathToLatex('(x)')).toBe('\\left(x\\right)');

    expect(MathLiveDebug.latexToAsciiMath('(x + 1)')).toBe('(x+1)');
    expect(MathLiveDebug.asciiMathToLatex('(x + 1)')).toBe(
        '\\left(x +1\\right)'
    );

    equalASCIIMath('f\\mleft(x\\mright)=\\sin x', 'f(x)=sin x');

    equalASCIIMath('x^{2}', 'x^2');
    equalASCIIMath('x^{234}', 'x^234');
    equalASCIIMath('x^{-234.56}', 'x^-234.56');
    equalASCIIMath('x^{-234.56}+1', 'x^-234.56+1');
    equalASCIIMath('x^{n}+1', 'x^n+1');
    equalASCIIMath('x^{npq}+1', 'x^(npq)+1');
    equalASCIIMath('x^{n+2}', 'x^(n+2)');

    equalASCIIMath('x_{2}', 'x_2');
    equalASCIIMath('x_{234}', 'x_234');
    equalASCIIMath('x_{-234.56}', 'x_-234.56');
    equalASCIIMath('x_{-234.56}+1', 'x_-234.56+1');
    equalASCIIMath('x_{n}+1', 'x_n+1');
    equalASCIIMath('x_{npq}+1', 'x_(npq)+1');
    equalASCIIMath('x_{n+2}', 'x_(n+2)');

    equalASCIIMath('x_{n+2}^{m+3}', 'x_(n+2)^(m+3)');

    equalASCIIMath('\\frac{1}{2}', '(1)/(2)');
    equalASCIIMath('\\frac{x+1}{x-1}', '(x+1)/(x-1)');

    equalASCIIMath('\\sqrt{2}', 'sqrt(2)');
    equalASCIIMath('\\sqrt{x+1}', 'sqrt(x+1)');

    equalASCIIMath('\\alpha +1', 'alpha+1');
    equalASCIIMath('\\Gamma +1', 'Gamma+1');
    equalASCIIMath('\\frac{\\pi }{2\\pi }', '(pi)/(2pi)');

    equalASCIIMath('\\text{if }x>0', '"if "x>0');
    equalASCIIMath(
        '\\text{if }x>0\\text{ then }f\\mleft(x\\mright)=x^{2}',
        '"if "x>0" then "f(x)=x^2'
    );
});

// \cos(|x| + |y|)

// \cos (|\frac {x}{5}|+|\frac {y}{5}|)

// -----------------------------------------------------------
// Resolved:

// \left(x^2+3y^2\right)e^{-x^2-y^2}
// \left(x^2+3y^2\right)\cdot  e^{-x^2-y^2}

// \sin(\pi*x/5)-\tan(x*2)
// \sin \pi  \cdot  \frac {x}{5}-\tan 2x
