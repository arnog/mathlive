
// This file contains unit test suites for MathLive.
// To run it:
//
//      $node test.js
//
// For a prettier display:
//
//      $node test.js | faucet
//
// For code coverage analysis:
//
//      $nyc node test.js

// To generate a HTML report:

//      $ nyc report --reporter html
//      $ open ./coverage/index.html

const requirejs = require('requirejs');
requirejs.config({
    //Pass the top-level main.js/index.js require
    //function to requirejs so that node modules
    //are loaded relative to the top-level JS file.
    nodeRequire: require
});

requirejs(['debug', 'Math'],
function   (MathLiveDebug, MathLive) {

const test = require('tape');

// function getProp(s, symbol, prop) {
//     if (typeof s === 'string') s = toSpan(s);    
//     return MathLiveDebug.getProp(s, symbol, prop);
// }

function getStyle(s, symbol, prop) {
    if (typeof s === 'string') s = toSpan(s);    
    return MathLiveDebug.getStyle(s, symbol, prop);
}

function getType(s, symbol) {
    if (typeof s === 'string') s = toSpan(s);    
    return MathLiveDebug.getType(s, symbol);
}

function toSpan(formula) {
    return MathLive.toMarkup(formula, true, 'span');
}


function spanToString(span) {
    if (typeof span === 'string') span = toSpan(span);
    return MathLiveDebug.spanToString(span).replace(/\t/g, '').replace(/\n/g, '');
}

function hasClass(t, s, symbol, cls, msg) {
    msg = msg || '';
    let span = s;
    if (typeof span === 'string') {
        msg = '$' + s + '$ ' + (msg || '');
        span = toSpan(s);
    }

    const result = MathLiveDebug.hasClass(span, symbol, cls);
    
    let symbolString = '"' + symbol + '"';
    if (Array.isArray(symbol)) {
        symbolString = '[' + symbol.toString() + ']';
    }

    t.ok(result, result ? msg : msg + 
        '. Classes for ' + symbolString + ' = \'' + 
        MathLiveDebug.getClasses(span, symbol) +
         '\" ' + spanToString(s) + ' ');
}


function notHasClass(t, s, symbol, cls, msg) {
    msg = msg || '';
    let span = s;
    if (typeof span === 'string') {
        msg = '$' + s + '$ ' + (msg || '');
        span = toSpan(s);
    }

    const result = !MathLiveDebug.hasClass(span, symbol, cls);
    
    let symbolString = '"' + symbol + '"';
    if (Array.isArray(symbol)) {
        symbolString = '[' + symbol.toString() + ']';
    }

    t.ok(result, result ? msg : msg + 
        ". Classes for " + symbolString + " = \"" + 
        MathLiveDebug.getClasses(span, symbol) +
         "\" " + spanToString(s) + " ");
}

function equalSpan(t, formula1, formula2, msg) {
    const s1 = spanToString(toSpan(formula1));
    const s2 = spanToString(toSpan(formula2));
    return t.equal(s1, s2, '$' + formula1  + '$ ' + msg);
}

////////////////////////////////////////////////////////////////////////////////
test('BASIC PARSING', function (t) {
    t.ok(toSpan(''), 'Empty formula should parse');
    equalSpan(t, '%', '', 'Empty formula with empty comment');
    equalSpan(t, 'a%b', 'a', 'Formula with comment');
    equalSpan(t, 'a % b ', 'a', 'Formula with comment and whitespace');

    t.equal(getType('x', 0), 'mord', 'Single letter variables are mord');
    hasClass(t, 'x', 0, 'mathit', 'Single letter variables are italicized');

    const ordString = '1234|/@.\`abcdefgzABCDEFGZ';
    // const ordString = '1234|/@.\"`abcdefgzABCDEFGZ';
    const ordSpan = toSpan(ordString);
    t.ok(ordSpan, 'Ordinary characters should parse');
    // @todo t.equal(ordSpan.length, 1, 'There shoud be a single span for all the characters');
    // @todo t.equal(ordSpan[0].body, ordString, 'The body of the span should be the same as the string');
    // @todo t.ok(hasClass(ordSpan, 0, 'mord'), "The span should be a 'mord'");

    equalSpan(t, 'a b', 'ab', 'Single space should be ignored in math mode');
    equalSpan(t, 'a     b', 'ab', 'Multiple spaces should be ignored in math mode');

    equalSpan(t, 'a~b', 'a\\space b', 'Tilde (~) is same as \\space');

    equalSpan(t, '{+}', '\\mathord{+}', 'A single item in a group is the same as the item in a "ord"');

    t.equal(getType('{a}b', 1), 'mord', 'An item followed by a group is parsed');

    equalSpan(t, 'a%b x \\xyz', 'a', 'Comments are ignored');
    equalSpan(t, '%b x \\xyz', '', 'Comments are ignored');

    equalSpan(t, 'a\nb', 'ab', 'Multiple lines are concatenated');
    equalSpan(t, 'a%b c \\xyz\nb', 'ab', 'Multiple lines are concatenated, comments ignored');

    equalSpan(t, 'a = 1 }{}{} ', 'a=1', 'Formula with spurious braces');
    equalSpan(t, 'a = 1 }}}}{{{ ', 'a=1', 'Formula with spurious braces');


    t.end();
});

////////////////////////////////////////////////////////////////////////////////
test('CHARACTERS', function (t) {
    // TeX \char command
    equalSpan(t, '\\char\"004A', 'J', '\\char command with hex argument');
    equalSpan(t, '\\char\'0112', 'J', '\\char command with octal argument');
    equalSpan(t, '\\char74', 'J', '\\char command with decimal argument');
    equalSpan(t, '\\char \"004A', 'J', '\\char command with whitespace');

    // \unicode, a MathJax extension 
    // (MathJax also accepts optional width, height and font arguments which we don't support)
    equalSpan(t, '\\unicode{\"004A}', 'J', '\\unicode command');
    equalSpan(t, '\\unicode{x004A}', 'J', '\\unicode command with "x" prefix');

    // Latin extended characters

    // Cyrillic

    // CJK

    t.end();
});


function isTextOrd(t, symbols) {
    for (const symbol of symbols) {
        hasClass(t, '\\text{' + symbol + '}', 0, 'textord', 
            symbol + ' is allowed');
    }
}

////////////////////////////////////////////////////////////////////////////////
test('TEXT MODE', function (t) {
    t.equal(getType('\\text{ }', [0, 0]), 'textord', "Spaces are preserved.");

    equalSpan(t, '\\text{a b   }', '\\text{a   b }', "Multiple-white space are collapsed");

    // TeX doesn't allow Greek letters, but we do.
    // hasClass(t, '\\text{\\alpha}', 0, 'error', 
    //     "Greek letters are not allowed :(");

    // isTextOrd(t, ['\\#', '\\&', '\\euro', '\\maltese', '\\{', '\\}',
    //     '\\$', '\\%', '\\_', 
    //     '`', '\'', '``', '\'\'', '\degree', '0123456789!@*()-=+[]\";:?/.,',
    //     '\u0410\u0411', '“”', 
    //     '\\AA', '\\aa', '\\j', '\\i', '\\ss', '\\ae'
    // ]);

    // @todo: this fails (they're inner)    
    // isTextOrd(t, ['\\ldots', '\\textellipsis']);





    t.end();
});


////////////////////////////////////////////////////////////////////////////////
test('ARGUMENTS', function (t) {
    equalSpan(t, '\\frac12', '\\frac{1}{2}', "Single non-alphabetic characters do not require grouping braces");
    equalSpan(t, '\\frac  1  2', '\\frac{1}{2}', "Single non-alphabetic characters can have whitespace");
    equalSpan(t, '\\frac357', '\\frac{3}{5}7', "If no braces, consume a single character");
    equalSpan(t, '\\frac3a', '\\frac{3}{a}', "The second argument can be alphabetic");
    equalSpan(t, '\\frac\\alpha\\beta', '\\frac{\\alpha}{\\beta}', "Single command can be an argument");
    // equalSpan(t, '\\frac{{1}}{2}', '\\frac{1}{2}', "Group inside an argument");
    equalSpan(t, '\\frac  {  { 1  } } { 2 }', '\\frac{{1}}{2}', "Group inside an argument, with whitespace");

    // @todo: a syntax error in TeX
    // equalSpan(t, '\\frac\\frac123', '\\frac{\\frac{1}{2}}{3}', "Commands with arguments can be an argument");
    // equalSpan(t, '\\frac\\sqrt23', '\\frac{\\frac{1}{2}}{3}', "Commands with arguments can be an argument");



    t.end();
});

////////////////////////////////////////////////////////////////////////////////
test('INFIX COMMANDS', function (t) {
    equalSpan(t, 'a\\over b', '\\frac{a}{b}', "Infix arguments are before and after the operator");
    equalSpan(t, 'a\\over b c', '\\frac{a}{bc}', "Infix arguments are before and after the operator");
    equalSpan(t, 'x{a+1\\over1-b}y', 'x{\\frac{a+1}{1-b}}y', "Infix arguments are scoped by explicit group");

    equalSpan(t, 'x{a+1\\over1-b\\over2}y', 'x{a+1\\over1-b2}y', "Only first infix in a group is valid");


    t.end();
});


////////////////////////////////////////////////////////////////////////////////
test('FUNCTIONAL ARGUMENTS', function (t) {
    equalSpan(t, '\\frac1a', '\\frac{1}{a}', 
        'Single char arguments');

    equalSpan(t, '\\frac a b', '\\frac{a}{b}',
        'Single char arguments separated with white space');

    equalSpan(t, '\\frac  {a}  {b}', '\\frac{a}{b}',
        'Grouped arguments separated with white spaces');

    // equalSpan(t, '\\frac', '\\frac{a}{b}',
    //     'Missing arguments');

    // equalSpan(t, '\\frac{}{}', '\\frac{a}{b}',
    //     'Empty arguments');

    equalSpan(t, '\\frac  {\\frac12}  {b}', '\\frac{\\frac12}{b}',
        'Grouped arguments with fraction separated with white spaces');

    t.end();
});

////////////////////////////////////////////////////////////////////////////////
test('PARSING MODE', function (t) {

// formula.insertText("\\text{hello world}+hello world");
// formula.insertText("$$\\frac12$$\\frac12$$");
// formula.insertText("\\[\\frac12\\]\\frac12");


    t.end();
});



////////////////////////////////////////////////////////////////////////////////
test('FONTS', function (t) {
    hasClass(t, '\\alpha + x - 1 - \\Gamma', 'x', 'mathit', 
        "Variables in roman letters are italicized");
    notHasClass(t, '\\alpha + x - 1 - \\Gamma', '1', 'mathit', 
        "Numbers are not italicized");
    hasClass(t, '\\alpha + x - 1 - \\Gamma', 'α', 'mathit', 
        "Lowercase greek letters are italicized");
    notHasClass(t, '\\alpha + x - 1 - \\Gamma', 'Γ', 'mathit', 
        "Uppercase greek letters are not italicized");

    hasClass(t, '\\mathfrak{\\sin}', 'sin', 'mainrm', 
        "Functions in \\mathfrak should be in roman");

//  formula.insertText("\\mathrm{\\nexists}");      // nexists should use amsrm
// formula.insertText("\\mathbb{\\sin}");              // sin should use mainrm


    t.end();
});

////////////////////////////////////////////////////////////////////////////////
test('ERRORS', function (t) {
    t.equal(getType('\\xyz', 'xyz'), 'error', "Unknown commands should be 'error'");
    t.equal(getType('\\xyz\\zyx', 'zyx'), 'error', "Consecutive unknown commands should not coalesce");
    t.end();
});

////////////////////////////////////////////////////////////////////////////////
test('BINARY OPERATORS', function (t) {
    t.equal(getType('a+b', '+'), 'mbin', "Operator between two symbol should be 'mbin'");
    t.equal(getType('f(a)+f(b)', '+'), 'mbin', "Operator between two fences should be 'mbin'");
    t.equal(getType('x^n+y^n', '+'), 'mbin', "Operator after superscript of ord should be 'mbin'");
    t.equal(getType('+b', '+'), 'mord', "Unary operator should be 'mord'");
    t.equal(getType('(+b', '+'), 'mord', "Unary operator should be 'mord'");
    t.equal(getType('=+b', '+'), 'mord', "Unary operator should be 'mord'");
    t.equal(getType('\\sin+b', '+'), 'mord', "Unary operator should be 'mord'");
    t.equal(getType(', +b', '+'), 'mord', "Unary operator should be 'mord'");
    
    t.equal(getType('\\textcolor{red}{a}+b', '+'), 'mbin', 
        "Color should not affect binary operators demotion");
    t.equal(getType('\\textcolor{red}{a=}+b', '+'), 'mord', 
        "Color should not affect binary operators demotion");

    t.equal(getType('a^2+b', '+'), 'mbin', "Operator before a superscript should be 'mbin'");
    t.equal(getType('a^{2}+b', '+'), 'mbin', "Operator before a grouped superscript should be 'mbin'");


    t.end();
});


////////////////////////////////////////////////////////////////////////////////
test('TYPE COERCION', function (t) {
// formula.insertText("\\operatorname {li}(x)");

// formula.insertText("\\operatorname {li}^2_n(x)");
// formula.insertText("\\operatorname* {li}^2_n(x)");
// formula.insertText("\\mathop {li}(x)");
// formula.insertText("\\mathop {li}^2_n(x)");


// formula.insertText("\\operatorname {\\alpha}(x)");   // Non-textual symbol not allowed

// formula.insertText("\\operatorname{lim}+1");

    t.end();
});

////////////////////////////////////////////////////////////////////////////////
test('SUBSCRIPT, SUPERSCRIPTS AND LIMITS', function (t) {
    equalSpan(t, 'a^x_y', 'a_y^x', 'The order of the superscript and subscript does not matter');
    equalSpan(t, 'a^{x}_{y}', 'a_y^x', 'Single letter grouped sup/sub are identical to ungrouped');

    equalSpan(t, 'a^x^y', 'a^{xy}', 'Extraneous ^ are ignored');
    equalSpan(t, 'a_x^a_y', 'a^{a}_{xy}', 'Extraneous _ are ignored');

    equalSpan(t, '^x', '\\char"200B^x', 
        'Superscript with no nucleus are valid');

    equalSpan(t, "f\'", 'f^{\\prime}', 'Prime (\\\') behave as superscripts');
    equalSpan(t, "f\'\'", 'f^{\\prime\\prime}', "Multiple primes (\\'\\') behave as superscripts");
    equalSpan(t, "f\'\'^2", 'f^{\\prime\\prime2}');
    equalSpan(t, "f\'^2\'", 'f^{\\prime2\\prime}');

    t.end();
});

////////////////////////////////////////////////////////////////////////////////
test('FRACTIONS', function (t) {
    t.ok(toSpan("\\frac57"));
    t.ok(toSpan("\\frac {5} {7}"));
    t.ok(toSpan("\\frac {\\frac57} {\\frac37}"));

    t.ok(toSpan("\\[ 1 + \\frac{q^2}{(1-q)}+\\frac{q^6}{(1-q)(1-q^2)}+\\cdots = \\prod_{j=0}^{\\infty}\\frac{1}{(1-q^{5j+2})(1-q^{5j+3})}, \\quad\\quad \\text{for $|q|<1$}. \\]"));

    t.ok(toSpan("\\binom{n}{k}"));
    t.ok(toSpan("\\dbinom{n}{k}"), 
        'Display math mode binomial');
    t.ok(toSpan("\\tbinom{n}{k}"), 
        'Inline (text) math mode binomial');

    equalSpan(t, 'n \\choose k', '\\binom{n}{k}', 
        'Infix \choose command');

    // @todo: a better rest...
    t.ok(toSpan('\\pdiff{f(x)}{x}'), 
        'Partial differential');


    t.end();
});

function hasSize(t, size) {
    hasClass(t, 'a' + size + '{b c}d', 'a', 'rule', 'Sizing ' + size);
    
}
////////////////////////////////////////////////////////////////////////////////
test('SIZING AND MATH STYLE', function (t) {
    t.ok(toSpan("\\text{a \\tiny x y}b"));
    // t.ok(toSpan("\\text{a \\Big x y}b"));

    // hasClass(t, '\\rule{1em}{2em}', 0, 'rule', 'Simple rule');
    // '{a\LARGE b c}d'

     
    hasClass(t, '\\binom12 \\textstyle \\binom34 \\scriptstyle \\binom56 \\displaystyle \\binom78 \\scriptstyle \\binom90',
        [1, 1, 0, 1], 'reset-textstyle');
    hasClass(t, '\\binom12 \\textstyle \\binom34 \\scriptstyle \\binom56 \\displaystyle \\binom78 \\scriptstyle \\binom90',
        [1, 1, 0, 1], 'scriptstyle');


    // '\\displaystyle \\frac12 \\textstyle \\frac34 \\scriptstyle \\frac56'

    t.end();
});


////////////////////////////////////////////////////////////////////////////////
test('RULE AND DIMENSIONS', function (t) {
    hasClass(t, '\\rule{1em}{2em}', 0, 'rule', 'Simple rule');
    hasClass(t, '\\rule[1em]{1em}{2em}', 0, 'rule', 'Rule with optional parameter');
    hasClass(t, '\\rule{1em}', 0, 'rule', 'Rule with missing parameter');
    hasClass(t, '\\rule{-1em}{+10em}', 0, 'rule', 'Rule with plus/minus sign');

    hasClass(t, '\\rule{0}{4}', 0, 'rule', 'Rule with missing units');
    hasClass(t, '\\rule{1245.5667em}{2902929,292929em}', 0, 'rule', 'Rule with decimal units');

    hasClass(t, '\\rule{5mm}{7mm}', 0, 'rule', 'Rule with mm');
    hasClass(t, '\\rule{5cm}{7cm}', 0, 'rule', 'Rule with cm');
    hasClass(t, '\\rule{5ex}{7ex}', 0, 'rule', 'Rule with ex');
    hasClass(t, '\\rule{5em}{7em}', 0, 'rule', 'Rule with em');
    hasClass(t, '\\rule{5bp}{7bp}', 0, 'rule', 'Rule with bp');
    hasClass(t, '\\rule{5dd}{7dd}', 0, 'rule', 'Rule with dd');
    hasClass(t, '\\rule{5pc}{7pc}', 0, 'rule', 'Rule with pc');
    hasClass(t, '\\rule{5in}{7in}', 0, 'rule', 'Rule with in');
    hasClass(t, '\\rule{5mu}{7mu}', 0, 'rule', 'Rule with mu');

    equalSpan(t, '\\rule{10}{10pt}', '\\rule{10pt}{10pt}', "Missing unit, 'pt' assumed");
    equalSpan(t, '\\rule{+10em}{+  10 em}', '\\rule{10em}{10em}', "Initial plus sign");
    equalSpan(t, '\\rule{\'12em}{10em}', '\\rule{10em}{10em}', "Dimension in octal");
    equalSpan(t, '\\rule{\'12.9999em}{10em}', '\\rule{10pt}{10em}', "The decimal portion of an octal number should be ignored. Default unit is 'pt'");
    
    // However, TeX doesn't parse it either...  Actually, TeX doesn't even parse "a2em
    // For TeX, hex digits have to be uppercase. Interestingly, TeX cannot parse
    // '\\rule{\"A EM}{10em}' (the AE confuses it)
    equalSpan(t, '\\rule{\"A em}{10em}', '\\rule{10em}{10em}', "Dimension in hexadecimal");

    // @todo: rule with color


    t.end();
});


////////////////////////////////////////////////////////////////////////////////
test('DECORATIONS', function (t) {
    t.equal(getStyle('\\bbox{1+x}', 0, 'border'), undefined, 
        'Default \\bbox');

    t.equal(getStyle('\\bbox[border:solid 1px red]{1+x}', 0, 'border'),'solid 1px red', 
        '\\bbox with custom border');

    t.equal(getStyle('\\bbox[4em]{1+x}', 0, 'padding-left'),'4em', 
        '\\bbox with margin');

    t.equal(getStyle('\\bbox[yellow]{1+x}', 0, 'background-color'),'#fff200', 
        '\\bbox with background color');

    t.equal(getStyle('\\bbox[ yellow , border: 1px solid red, 4 em ]{1+x}', 0, 
        'border'),'1px solid red', 
        '\\bbox with border, margin and background');
    t.equal(getStyle('\\bbox[ yellow , border: 1px solid red, 4 em ]{1+x}', 0, 
        'background-color'),'#fff200', 
        '\\bbox with border, margin and background');
    t.equal(getStyle('\\bbox[ yellow , border: 1px solid red, 4 em ]{1+x}', 0, 
        'padding-left'),'4em', 
        '\\bbox with border, margin and background');

    hasClass(t, '\\rlap{x}o', 0, 'rlap', '\rlap');
    hasClass(t, '\\rlap{x}o', [0, 0, 0], 'mathrm', 'The argument of \rlap is in text mode');
    hasClass(t, '\\mathrlap{x}o', [0, 0, 0], 'mathit', 'The argument of \mathrlap is in math mode');

    hasClass(t, '\\llap{x}o', 0, 'llap', '\llap');
    hasClass(t, '\\llap{x}o', [0, 0, 0], 'mathrm', 'The argument of \llap is in text mode');
    hasClass(t, '\\mathllap{x}o', [0, 0, 0], 'mathit', 'The argument of \mathllap is in math mode');

    t.end();
});

////////////////////////////////////////////////////////////////////////////////
test('OVER/UNDERLINE', function (t) {
    t.ok(toSpan("a\\overline{x}b"));
    t.ok(toSpan("\\overline{xyz}\\overline{1+\\frac34}\\underline{abc}\\underline{\\frac57}"));
    t.ok(toSpan("\\underline{\\frac14}"));


    t.end();
});

////////////////////////////////////////////////////////////////////////////////
test('KERN', function (t) {

    t.end();
});


function testDelimiter(t, openDel, closeDel, msg) {
    // Regular sized delimiters
    t.equal(getType("\\left" + openDel + " x + 1" + "\\right" + closeDel, [0,0]), 
        'mopen', "Open delimiter " + openDel + (msg ? ' ' + msg : ''));
    t.equal(getType("\\left" + openDel + " x + 1" + "\\right" + closeDel, [0,4]), 
        'mclose', "Close delimiter " + closeDel + (msg ? ' ' + msg : ''));
    // t.notEqual(getType("\\left" + openDel + " x + 1" + "\\right" + closeDel, [0,0]), 
    //     'nulldelimiter', "Open delimiter " + openDel + (msg ? ' ' + msg : ''));
    // t.notEqual(getType((t, "\\left" + openDel + " x + 1" + "\\right" + closeDel, [0,4]), 
    //     'nulldelimiter', "Close delimiter " + closeDel + (msg ? ' ' + msg : ''));

    // Delimiters with large expression
    t.equal(getType("\\left" + openDel + " x \\frac{\\frac34}{\\frac57}" + "\\right" + closeDel, [0,0]), 
        'mopen', "Large open delimiter " + openDel + (msg ? ' ' + msg : ''));
    t.equal(getType("\\left" + openDel + " x \\frac{\\frac34}{\\frac57}" + "\\right" + closeDel, [0,3]), 
        'mclose', "Large close delimiter " + closeDel + (msg ? ' ' + msg : ''));
    // t.notEqual(getType("\\left" + openDel + " x \\frac{\\frac34}{\\frac57}" + "\\right" + closeDel, [0,0]), 
    //     'nulldelimiter', "Large open delimiter " + openDel + (msg ? ' ' + msg : ''));
    // t.notEqual(getType("\\left" + openDel + " x \\frac{\\frac34}{\\frac57}" + "\\right" + closeDel, [0,3]), 
    //     'nulldelimiter', "Large close delimiter " + closeDel + (msg ? ' ' + msg : ''));

}

////////////////////////////////////////////////////////////////////////////////
test('LEFT/RIGHT', function (t) {
    // equalSpan(t, '\\left(a\\right)', '\\left{(}a\\right{)}', 
    //     '\\left\\right with unbraced arguments');


    t.equal(getType('\\left(a\\right)', [0, 0]), 'mopen');
    t.equal(getType('\\left(a\\right)', [0, 2]), 'mclose');

    t.equal(getType('\\left(\\frac12\\right)', [0, 0]), 'mopen');

    hasClass(t, '\\left.\\frac12\\right.', [0, 0], 'nulldelimiter', 
        "Opening null delimiter");
    hasClass(t, '\\left.\\frac12\\right.', [0, 2], 'nulldelimiter', 
        "Closing null delimiter");

    testDelimiter(t, '[', ']', "Square brackets");

    testDelimiter(t, '\\lfloor', '\\rfloor', 
        "Delimiters as commands");

    hasClass(t, '\\left a\\frac12\\right0', [0, 0], 'nulldelimiter', 
        "Invalid opening delimiter");

    hasClass(t, '\\left a\\frac12\\right0', [0, 2], 'nulldelimiter', 
        "Invalid closing delimiter");

    t.equal(getType('\\left\\ulcorner\\frac12\\right\\urcorner', [0, 0]), 'mopen', 
        "AMS open delimiter");

    t.equal(getType('\\left\\uparrow\\frac12\\right\\Downarrow', [0, 0]), 'mopen', 
        "Symbols that can be used as a delimiter, even though it's neither a 'mopen' or 'mclose'");


    t.equal(getType('\\left\\uparrow\\frac{\\frac34}{2}\\right\\vert', [0, 0]), 'mopen', 
        "'Always stacking' delimiters");

    t.equal(getType('\\left\\uparrow\\frac{\\frac{\\frac57}{\\frac95}}{2}\\right\\vert', [0, 0]), 'mopen', 
        "'Always stacking' delimiters (very large)");

    t.equal(getType('{\\tiny\\left\\uparrow x\\right\\vert}', [0, 0, 0]), 'mopen', 
        "'Always stacking' delimiters (very small)");

    t.equal(getType('\\left\\lfloor\\frac{\\frac34}{2}\\right\\rfloor', [0, 0]), 'mopen', 
        "'Stack large' delimiters (large)");

    t.equal(getType('\\left\\lfloorx\\right\\rfloor', [0, 0]), 'mopen', 
        "'Stack large' delimiters (small)");

    t.equal(getType('\\left\\langle\\frac{\\frac34}{2}\\right\\rangle', [0, 0]), 'mopen', 
        "'Stack never' delimiters (large)");

    t.equal(getType('\\left<\\frac{\\frac34}{2}\\right>', [0, 0]), 'mopen', 
        "Synonyms for \\langle and \\rangle: < & >");

    hasClass(t, '\\left x\\frac{\\frac34}{2}\\right x', [0, 0], 'nulldelimiter',
        "Unknown opening delimiters");
    hasClass(t, '\\left x\\frac{\\frac34}{2}\\right x', [0, 2], 'nulldelimiter',
        "Unknown closing delimiters");

    // All the stacking delimiters
    testDelimiter(t, '\\vert', '\\vert');
    testDelimiter(t, '\\lvert', '\\rvert');
    testDelimiter(t, '\\Vert', '\\Vert');
    testDelimiter(t, '\\lVert', '\\rVert');
    testDelimiter(t, '\\|', '|');
    testDelimiter(t, '\\uparrow', '\\downarrow');
    testDelimiter(t, '\\Downarrow', '\\Uparrow');
    testDelimiter(t, '\\Updownarrow', '\\updownarrow');
    testDelimiter(t, '\\lbrack', '\\rbrack');
    testDelimiter(t, '\\lfloor', '\\rfloor');
    testDelimiter(t, '\\lceil', '\\rceil');
    testDelimiter(t, '(', ')');
    testDelimiter(t, '\\{', '\\}');
    testDelimiter(t, '\\lbrace', '\\rbrace');
    testDelimiter(t, '\\lgroup', '\\rgroup');
    testDelimiter(t, '\\lmoustache', '\\rmoustache');
    testDelimiter(t, '\\surd', '\\surd');

    // Middle
    hasClass(t, '\\left(a\\middle|b\\right)', [0, 2], 'style-wrap',
        "Middle command");
    hasClass(t, '\\left(a\\middle xb\\right)', [0, 2], 'nulldelimiter',
        "Middle command with invalid delimiter");

    t.end();
});

////////////////////////////////////////////////////////////////////////////////
function testSizingDelimiter(t, openCmd, closeCmd, midCmd, ordCmd, msg) {
    msg = msg ? ' ' + msg : '';
    // Regular sized delimiters


    t.equal(getType(openCmd + '\\lbrack x' + 
        midCmd + '\\vert y ' +
        ordCmd + '\\Vert z' +
        closeCmd + '\\rbrack', 0), 
        'mopen', 'Open sizing ' + openCmd + msg);


        t.equal(getType(openCmd + '\\lbrack x' + closeCmd + '\\rbrack', 2),
         'mclose', 'Close sizing ' + openCmd + msg);

    t.equal(getType(openCmd + '< x' + 
        midCmd + '\\vert y ' +
        ordCmd + '\\Vert z' +
        closeCmd + '>', 0),
         'mopen', 'Open sizing with < ' + openCmd + msg);

    t.equal(getType(openCmd + '< x' + closeCmd + '>', 2), 
        'mclose', 'Close sizing with > ' + openCmd + msg);

}

test('SIZED DELIMITERS', function(t) {
    testSizingDelimiter(t, '\\bigl', '\\bigr', '\\bigm', '\\big');
    testSizingDelimiter(t, '\\Bigl', '\\Bigr', '\\Bigm', '\\Big');
    testSizingDelimiter(t, '\\biggl', '\\biggr', '\\biggm', '\\bigg');
    testSizingDelimiter(t, '\\Biggl', '\\Biggr', '\\Biggm', '\\Bigg');

    t.end();
});

////////////////////////////////////////////////////////////////////////////////
test('ENVIRONMENTS', function (t) {
    // t.ok(toSpan('\\begin'), '\\begin with no argument, no \\end');
    // t.ok(toSpan('\\begin{a}'), '\\begin with argument, no \\end');
    // t.ok(toSpan('\\begin{a}\\end'), '\\begin with argument, \\end with no argument');
    // t.ok(toSpan('\\begin{a}\\end{x}'), '\\begin with argument, \\end with mismatched argument');

    equalSpan(t, '\\begin{array}a\\end{xyz}', '\\begin{array}a\\end{array}', 'Mismatched \\begin and \\end');
    equalSpan(t, '\\begin{array}a', '\\begin{array}a\\end{array}', 'Missing \\end');

    t.ok(toSpan('\\begin{\\alpha}\\end{\\alpha}'), 
        'Environment name with symbol');
    t.ok(toSpan('\\begin{1732}\\end{1732}'), 
        'Environment name with digits');
    t.ok(toSpan('\\begin{.}\\end{.}'), 
        'Environment name with non alphanumeric char');
    t.ok(toSpan('\\begin{(}\\end{(}'), 
        'Environment name with non alphanumeric char');

    // t.notok(toSpan('\\begin{\\frac{1}{2}}\\end{\\frac{1}{2}}'), 
    //     'Environment name with function');

    // Environment names with spaces (multiple spaces = 1 space)

    // t.ok(toSpan('\\begin{a}x\\begin{b}y\\end{b}z\\end{a}'), 'Nested environments');

    // // 
    // t.ok(toSpan('\\begin{a}a&b\\c&d\\end{a}'), 'Simple 2x2 matrix');

    t.end();
});

////////////////////////////////////////////////////////////////////////////////
test('SURDS', function (t) {
    t.ok(toSpan('\\sqrt5'), 'Basic square root');

    t.ok(toSpan('\\sqrt{}'), 'No radicand');
    t.ok(toSpan('\\sqrt'), 'No radicand');

    t.ok(toSpan("ax^2+bx+c = a \\left( x - \\frac{-b + \\sqrt {b^2-4ac}}{2a} \\right) \\left( x - \\frac{-b - \\sqrt {b^2-4ac}}{2a} \\right)"));

    t.ok(toSpan('\\sqrt[3]{5}'), 'Cube root');
    t.ok(toSpan('\\sqrt[3]5'), 'Cube root with single char argument');

    t.end();
});

////////////////////////////////////////////////////////////////////////////////
test('ACCENTS', function (t) {

    hasClass(t, '\\vec)', 0, 'accent', "Accent with missing parameter has placeholder inserted");
    hasClass(t, '\\vec{x+1})', 0, 'accent', "Accent over an expression");

    hasClass(t, '\\acute{x+1})', 0, 'accent', "Acute accent");
    hasClass(t, '\\grave{x+1})', 0, 'accent', "Grave accent");
    hasClass(t, '\\dot{x+1})', 0, 'accent', "dot accent");
    hasClass(t, '\\ddot{x+1})', 0, 'accent', "Ddot accent");
    hasClass(t, '\\tilde{x+1})', 0, 'accent', "Tilde accent");
    hasClass(t, '\\bar{x+1})', 0, 'accent', "Bar accent");
    hasClass(t, '\\breve{x+1})', 0, 'accent', "Breve accent");
    hasClass(t, '\\check{x+1})', 0, 'accent', "Check accent");
    hasClass(t, '\\hat{x+1})', 0, 'accent', "Hat accent");
    hasClass(t, '\\vec{x+1})', 0, 'accent', "Vec accent");


    t.end();
});

////////////////////////////////////////////////////////////////////////////////
test('PHANTOM', function (t) {
    t.end();
});

////////////////////////////////////////////////////////////////////////////////
test('COLORS', function (t) {
// formula.insertText("\\sin x \\textcolor{#f00}{red} \\backgroundcolor{yellow}{x + \\frac1{\\frac34}} \\textcolor{m1}{\\blacktriangle}\\textcolor{m2}{\\blacktriangle}\\textcolor{m3}{\\blacktriangle}\\textcolor{m4}{\\blacktriangle}\\textcolor{m5}{\\blacktriangle}\\textcolor{m6}{\\blacktriangle}\\textcolor{m7}{\\blacktriangle}\\textcolor{m8}{\\blacktriangle}\\textcolor{m9}{\\blacktriangle}");
// formula.insertText("\\textcolor{aquamarine}{\\blacksquare}");
// formula.insertText("\\textcolor{rgb(240, 10, 200)}{\\blacksquare}");
// formula.insertText("\\textcolor{#33d}{\\blacksquare}");
// formula.insertText("\\textcolor{#3130da}{\\blacksquare}");
// formula.insertText("a+\\backgroundcolor{#f00}{\\frac1{\\frac{a+1}{b+c}}}"); 
// formula.insertText("a+\\backgroundcolor{#f00}{\\frac{\\frac{\\frac{1}{2}}{c}}{\\frac{a+1}{b+c}}}");
// formula.insertText("a+\\backgroundcolor{#f00}{\\frac{\\frac{\\frac{1}{2}}{c}}{a}");   


    t.equal(getStyle('\\textcolor{white}{x}', 0, 'color'),'#ffffff', 'Named colors');

    t.equal(getStyle('\\textcolor{aquamarine}{x}', 0, 'color'),'#00b5be', 'Named colors');
    t.equal(getStyle('\\textcolor{AquaMarine}{x}', 0, 'color'),'#00b5be', 'Named colors are case insensitive');
    t.equal(getStyle('\\textcolor{M5}{x}', 0, 'color'),'#993d90', 'Named colors can contain digits');

    equalSpan(t, "\\textcolor{#fff}{x}", '\\textcolor{white}{x}', 'Three hex-digit color');
    equalSpan(t, "\\textcolor{#ffffff}{x}", '\\textcolor{white}{x}', 'Six hex-digit color');
    equalSpan(t, "\\textcolor{#fCFcfC}{x}", '\\textcolor{#fcfcfc}{x}', 'Hex-digits are case insensitive');
    equalSpan(t, "\\textcolor{rgb(255, 255, 255)}{x}", '\\textcolor{white}{x}', 'Functional rgb color');

    equalSpan(t, "\\textcolor{rgb(255,255,255)}{x}", '\\textcolor{white}{x}', 'Functional rgb color with no white space');
    equalSpan(t, "\\textcolor{  rgb  (  255  ,  255  ,  255  ) }{x}", '\\textcolor{white}{x}', 'Functional rgb color with extra white space');

    equalSpan(t, "\\textcolor{rgb(3.5, 0, 0)}{x}", '\\textcolor{white}{x}', 'Functional rgb color with fractional values');
    equalSpan(t, "\\textcolor{rgb(3, 5, 7}{x}", '\\textcolor{white}{x}', 'Functional rgb color with missing closing paren');
    equalSpan(t, "\\textcolor{rgb(125.5, 0.556, -12.5)}{x}", '\\textcolor{white}{x}', 'Functional rgb color with invalid values');
    equalSpan(t, "\\textcolor{rgb(xxy)}{x}", '\\textcolor{white}{x}', 'Functional rgb color with invalid values');
    equalSpan(t, "\\textcolor{rgb(3, 5)}{x}", '\\textcolor{white}{x}', 'Functional rgb color with missing values');
    equalSpan(t, "\\textcolor{rgb(3, 5, 7, 11)}{x}", '\\textcolor{white}{x}', 'Functional rgb color with extra values');

    equalSpan(t, "\\textcolor{#111!50}{x}", '\\textcolor{#888888}{x}', 'Mixing hex color with implicit white');
    equalSpan(t, "\\textcolor{#111!50!#fff}{x}", '\\textcolor{#888888}{x}', 'Mixing hex color with explicit white');

    equalSpan(t, "\\textcolor{#111!50!#000}{x}", '\\textcolor{#090909}{x}', 'Mixing hex color with explicit black');

    equalSpan(t, "\\textcolor{#f00!80!#00f}{x}", '\\textcolor{#cc0033}{x}', 'Mixing two colors');

    equalSpan(t, "\\textcolor{-green!40!yellow}{x}", '\\textcolor{#662bdf}{x}', 'Complementary color');

// formula.insertText("a+\\backgroundcolor{#f00}{\\frac1{\\frac{a+1}{b+c}}}"); 
// formula.insertText("a+\\backgroundcolor{#f00}{\\frac{\\frac{\\frac{1}{2}}{c}}{\\frac{a+1}{b+c}}}");
// formula.insertText("a+\\backgroundcolor{#f00}{\\frac{\\frac{\\frac{1}{2}}{c}}{a}");   

// a{b\\color c}d}
    let f = 'a{b\\color{#f00} c}d';
    t.ok(getStyle(f, 'a', 'color') === null && 
        getStyle(f, 'b', 'color') === null && 
        getStyle(f, 'c', 'color') === '#ff0000' && 
        getStyle(f, 'd', 'color') === null, 
        '\\color applies to all elements following it in the same explicit group');

    f = 'a\\left(b\\color{#f00} c\\right)d';
    t.ok(getStyle(f, 'a', 'color') === null && 
        getStyle(f, 'b', 'color') === null && 
        getStyle(f, 'c', 'color') === '#ff0000' && 
        getStyle(f, 'd', 'color') === null, 
        '\\color applies to all elements following it in the same explicit group');

    t.ok(toSpan('{\\color{apricot}\\blacksquare}{\\color{aquamarine}\\blacksquare}{\\color{bittersweet}\\blacksquare}{\\color{black}\\blacksquare}{\\color{blue}\\blacksquare}{\\color{blueGreen}\\blacksquare}{\\color{blueviolet}\\blacksquare}{\\color{brickred}\\blacksquare}{\\color{brown}\\blacksquare}{\\color{burntorange}\\blacksquare}{\\color{cadetblue}\\blacksquare}{\\color{carnationpink}\\blacksquare}{\\color{cerulean}\\blacksquare}{\\color{cornflowerblue}\\blacksquare}{\\color{cyan}\\blacksquare}{\\color{dandelion}\\blacksquare}{\\color{darkorchid}\\blacksquare}{\\color{emerald}\\blacksquare}{\\color{forestgreen}\\blacksquare}{\\color{fuchsia}\\blacksquare}{\\color{goldenrod}\\blacksquare}{\\color{gray}\\blacksquare}{\\color{green}\\blacksquare}{\\color{greenyellow}\\blacksquare}{\\color{junglegreen}\\blacksquare}{\\color{lavender}\\blacksquare}{\\color{limegreen}\\blacksquare}{\\color{magenta}\\blacksquare}{\\color{mahogany}\\blacksquare}{\\color{maroon}\\blacksquare}{\\color{melon}\\blacksquare}{\\color{midnightblue}\\blacksquare}{\\color{mulberry}\\blacksquare}{\\color{navyblue}\\blacksquare}{\\color{olivegreen}\\blacksquare}{\\color{orange}\\blacksquare}{\\color{orangered}\\blacksquare}{\\color{orchid}\\blacksquare}{\\color{peach}\\blacksquare}{\\color{periwinkle}\\blacksquare}{\\color{pinegreen}\\blacksquare}{\\color{plum}\\blacksquare}{\\color{processblue}\\blacksquare}{\\color{purple}\\blacksquare}{\\color{rawsienna}\\blacksquare}{\\color{red}\\blacksquare}{\\color{redorange}\\blacksquare}{\\color{redviolet}\\blacksquare}{\\color{rhodamine}\\blacksquare}{\\color{royalblue}\\blacksquare}{\\color{royalpurple}\\blacksquare}{\\color{rubinered}\\blacksquare}{\\color{salmon}\\blacksquare}{\\color{seagreen}\\blacksquare}{\\color{sepia}\\blacksquare}{\\color{skyblue}\\blacksquare}{\\color{springgreen}\\blacksquare}{\\color{tan}\\blacksquare}{\\color{tealblue}\\blacksquare}{\\color{thistle}\\blacksquare}{\\color{turquoise}\\blacksquare}{\\color{violet}\\blacksquare}{\\color{violetred}\\blacksquare}{\\color{white}\\blacksquare}{\\color{wildstrawberry}\\blacksquare}{\\color{yellow}\\blacksquare}{\\color{yellowgreen}\\blacksquare}{\\color{yelloworange}\\blacksquare}'));

    t.end();
});

});
