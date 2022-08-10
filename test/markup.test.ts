import { convertLatexToMarkup, validateLatex } from '../src/mathlive';

function markupAndError(formula: string): [string, string] {
  const markup = convertLatexToMarkup(formula, { mathstyle: 'displaystyle' });
  const errors = validateLatex(formula);
  if (errors.length === 0) return [markup, 'no-error'];
  return [markup, errors[0].code];
}

function error(expression: string) {
  const errors = validateLatex(expression);
  if (errors.length === 0) return 'no-error';
  return errors[0].code;
}

describe('MODE SHIFT', () => {
  test.each(['\\text{\\ensuremath{\\frac34}}'])(
    '%#/ %s renders correctly',
    (a) => {
      expect(markupAndError(a)).toMatchSnapshot();
    }
  );
});

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

describe('BOX', () => {
  test.each([
    '-\\bbox{\\sqrt{\\frac{2}{1+x}}}-',
    '-\\bbox[border:solid 1px red]{\\sqrt{\\frac{2}{1+x}}}-',
    '-\\bbox[yellow]{\\sqrt{\\frac{2}{1+x}}}-',
    '-\\bbox[yellow]{\\sqrt{\\frac{2}{1+x}}}-',
    '-\\bbox[ yellow , border: 1px solid red, 4 em ]{\\sqrt{\\frac{2}{1+x}}}-',
    // '-\\bbox[4em,border: 1px solid red,yellow]{\\sqrt{\\frac{\\frac{2}{\\frac{3}{\\frac{4}{\\frac{5}{\\frac{6}{\\frac{7}{\\frac{8}{\\frac{9}{\\frac{a}{\\frac{b}{\\frac{x}{\\frac{s}{d}}}}}}}}}}}}}{1+x}}}-',
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
    '+-a+b=c+-d=x^{2-\\frac{1}{2}}',
    '\\sqrt[\\placeholder{}]{x}\\scriptstyle \\sqrt[\\placeholder{}]{x}',
    'x \\scriptstyle x',
    '\\vec{x} \\scriptstyle \\vec{x}',
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

describe('SUPERSCRIPT/SUBSCRIPT', () => {
  test('-1-\\frac56-1-x^{2-\\frac34}', () => {
    expect(markupAndError('-1-\\frac56-1-x^{2-\\frac34}')).toMatchSnapshot();
  });
});

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

describe('DELIMTIER SIZING COMMANDS', () => {
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

describe('SIZING COMMANDS', function () {
  test.each([
    '\\text{a \\tiny x y}b',
    '\\mbox{a \\tiny x y}b',
    '\\binom12  \\sqrt[3]{x}  \\Huge \\sqrt[3]{x} \\binom56 x \\text{text is huge}',
  ])('%#/ %s renders correctly', (x) => {
    expect(markupAndError(x)).toMatchSnapshot();
  });
});

// ////////////////////////////////////////////////////////////////////////////////
describe('ENVIRONMENTS', function () {
  test.each([
    '\\begin{bmatrix}a & b & c\\end{bmatrix}',
    '\\begin{bmatrix}a & b & c\\\\ d & e & f\\end{bmatrix}',
    '\\begin{bmatrix}a & b & c\\\\ d \\end{bmatrix}',
    '\\begin{bmatrix}a & b & c\\\\ d \\\\ g & h & i & j\\end{bmatrix}',
    '\\begin{array}{ll}xyz & abc & 123 \\\\ cde & fgh \\end{array}',
    '\\begin{Bmatrix}a & b & c\\end{Bmatrix}',
    '\\begin{pmatrix}a & b & c\\end{pmatrix}',
    '\\begin{cases}\\sum_n^{100}+\\frac{x-y}{4}=\\frac{4-y}{8}\\\\-\\frac{y+3}{8}=\\frac{1-2x}{8}+\\sum_n^{100}\\end{cases}',
    '\\begin{dcases}\\sum_n^{100}+\\frac{x-y}{4}=\\frac{4-y}{8}\\\\-\\frac{y+3}{8}=\\frac{1-2x}{8}+\\sum_n^{100}\\end{dcases}',
  ])('%#/ %s renders correctly', (x) => {
    expect(markupAndError(x)).toMatchSnapshot();
  });

  test.each([
    '\\begin',
    '\\begin{a}',
    '\\begin{a}\\end',
    '\\begin{a}\\end{x}',
    '\\begin{a}\\end{a}',
    '\\begin{array}{ll}\\end{a}',
    '\\begin{array}{ll}xyz\\end{a}',
    '\\begin{array}{ll}xyz',
    '\\begin{array}{ll}xyz',
    '\\begin{\\alpha}',
    '\\begin{.}\\end{.}',
    '\\begin{(}\\end{(}',
  ])('%#/ %s errors', (x) => {
    expect(error(x)).toMatchSnapshot();
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

// The `\not`, `\ne` and `\neq` commands have special encoding to
// handle the fact that the fonts don't have a ≠ glyph...
describe('NOT', () => {
  test.each([
    'a \\ne b',
    'a \\neq b',
    'a\\not= b',
    'a\\not< b',
    'a\\not{c} b',
    'a\\not{cd} b',
    'a\\not{<} b',
    'a\\not{<>} b',
    'a\\not{} b',
    'a\\not',
  ])('%#/ %s renders correctly', (x) => {
    expect(markupAndError(x)).toMatchSnapshot();
  });
});

// ////////////////////////////////////////////////////////////////////////////////
// // describe('PHANTOM', function () {});

// ////////////////////////////////////////////////////////////////////////////////
describe('COLORS', function () {
  test.each([
    '\\sin x \\textcolor{#f00}{red} \\colorbox{yellow}{x + \\frac1{\\frac34}} \\textcolor{m1}{\\blacktriangle}\\textcolor{m2}{\\blacktriangle}\\textcolor{m3}{\\blacktriangle}\\textcolor{m4}{\\blacktriangle}\\textcolor{m5}{\\blacktriangle}\\textcolor{m6}{\\blacktriangle}\\textcolor{m7}{\\blacktriangle}\\textcolor{m8}{\\blacktriangle}\\textcolor{m9}{\\blacktriangle}',
    'a+\\colorbox{#f00}{\\frac1{\\frac{a+1}{b+c}}}',
    'a+\\colorbox{#f00}{\\frac{\\frac{\\frac{1}{2}}{c}}{\\frac{a+1}{b+c}}}',
    'a+\\colorbox{#f00}{\\frac{\\frac{\\frac{1}{2}}{c}}{a}',
    'a+\\colorbox{#f00}{\\frac1{\\frac{a+1}{b+c}}}',
    'a+\\colorbox{#f00}{\\frac{\\frac{\\frac{1}{2}}{c}}{\\frac{a+1}{b+c}}}',
    'a+\\colorbox{#f00}{\\frac{\\frac{\\frac{1}{2}}{c}}{a}',
    'a{b\\color{#f00} c}d',
    'a\\left(b\\color{#f00} c\\right)d',
    `{\\color{Apricot}\\blacksquare}{\\color{Aquamarine}\\blacksquare}
    {\\color{Bittersweet}\\blacksquare}{\\color{Black}\\blacksquare}
    {\\color{Blue}\\blacksquare}{\\color{BlueGreen}\\blacksquare}
    {\\color{BlueViolet}\\blacksquare}{\\color{BrickRed}\\blacksquare}
  
    {\\color{Brown}\\blacksquare}{\\color{BurntOrange}\\blacksquare}
    {\\color{CadetBlue}\\blacksquare}{\\color{CarnationPink}\\blacksquare}
    {\\color{Cerulean}\\blacksquare}{\\color{CornflowerBlue}\\blacksquare}
    {\\color{Cyan}\\blacksquare}{\\color{Dandelion}\\blacksquare}
  
  
    {\\color{DarkOrchid}\\blacksquare}{\\color{Emerald}\\blacksquare}
    {\\color{ForestGreen}\\blacksquare}{\\color{Fuchsia}\\blacksquare}
    {\\color{Goldenrod}\\blacksquare}{\\color{Gray}\\blacksquare}
    {\\color{Green}\\blacksquare}{\\color{GreenYellow}\\blacksquare}
  
    {\\color{JungleGreen}\\blacksquare}{\\color{Lavender}\\blacksquare}
    {\\color{LimeGreen}\\blacksquare}{\\color{Magenta}\\blacksquare}
    {\\color{Mahogany}\\blacksquare}{\\color{Maroon}\\blacksquare}
    {\\color{Melon}\\blacksquare}{\\color{MidnightBlue}\\blacksquare}
  
    {\\color{Mulberry}\\blacksquare}{\\color{NavyBlue}\\blacksquare}
    {\\color{OliveGreen}\\blacksquare}{\\color{Orange}\\blacksquare}
    {\\color{OrangeRed}\\blacksquare}{\\color{Orchid}\\blacksquare}
    {\\color{Peach}\\blacksquare}{\\color{Periwinkle}\\blacksquare}
  
    {\\color{PineGreen}\\blacksquare}{\\color{Plum}\\blacksquare}
    {\\color{ProcessBlue}\\blacksquare}{\\color{Purple}\\blacksquare}
    {\\color{RawSienna}\\blacksquare}{\\color{Red}\\blacksquare}
    {\\color{RedOrange}\\blacksquare}{\\color{RedViolet}\\blacksquare}
  
    {\\color{Rhodamine}\\blacksquare}{\\color{RoyalBlue}\\blacksquare}
    {\\color{RoyalPurple}\\blacksquare}{\\color{RubineRed}\\blacksquare}
    {\\color{Salmon}\\blacksquare}{\\color{SeaGreen}\\blacksquare}
    {\\color{Sepia}\\blacksquare}{\\color{SkyBlue}\\blacksquare}
  
    {\\color{SpringGreen}\\blacksquare}{\\color{Tan}\\blacksquare}
    {\\color{TealBlue}\\blacksquare}{\\color{Thistle}\\blacksquare}
    {\\color{Turquoise}\\blacksquare}{\\color{Violet}\\blacksquare}
    {\\color{VioletRed}\\blacksquare}{\\color{White}\\blacksquare}
  
    {\\color{WildStrawberry}\\blacksquare}{\\color{Yellow}\\blacksquare}
    {\\color{YellowGreen}\\blacksquare}{\\color{YellowOrange}\\blacksquare}
`,
  ])('%#/ %s renders correctly', (x) => {
    expect(markupAndError(x)).toMatchSnapshot();
  });

  test.each([
    'aquamarine', // Not a valid color name (lowercase)
    'rgb(240, 10, 200)',
    '#33d',
    '#3130da',
    'white',
    'Aquamarine',
    'm5',
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

describe('EXTENSIONS', function () {
  test.each([
    '\\htmlData{foo=green}{2+\\frac{1}{x}}',
    '\\htmlData{foo=green, bar}{2+\\frac{1}{x}}',
    '\\htmlData{foo=green, bar=blue}{2+\\frac{1}{x}}',
    '\\htmlData{foo bar=green, bar=blue}{2+\\frac{1}{x}}',
    '\\class{cssClassName}{2+\\frac{1}{x}}',
    '\\class{css class name}{2+\\frac{1}{x}}',
    '\\cssId{a-css-id-1234}{2+\\frac{1}{x}}',
    '\\cssId{a css id 1234}{2+\\frac{1}{x}}',
  ])('%#/ %s renders correctly', (x) => {
    expect(markupAndError(x)).toMatchSnapshot();
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
