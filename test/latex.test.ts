import {
  convertLatexToMarkup,
  convertLatexToMathMl,
  validateLatex,
} from '../src/public/mathlive-ssr';
import { parseLatex } from '../src/core/parser';
import { Atom } from '../src/core/atom-class';

function markupAndError(formula: string): [string, string] {
  const markup = convertLatexToMarkup(formula, { defaultMode: 'math' });
  const errors = validateLatex(formula);
  if (errors.length === 0) return [markup, 'no-error'];
  return [markup, errors[0].code];
}

function error(expression: string) {
  const errors = validateLatex(expression);
  if (errors.length === 0) return 'no-error';
  return errors[0].code;
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
    // ['\\obeyspaces =   =', '=\\space\\space\\space='],
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
    ['a^\\frac12', 'a^{\\frac{1}{2}}'],
    ['\\sqrt3^2', '\\sqrt{3}^{2}'],
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

describe('VARIANT SERIALIZATION (issue #2867)', () => {
  function serialize(latex: string): string {
    const atoms = parseLatex(latex, { parseMode: 'math' });
    return Atom.serialize(atoms, { defaultMode: 'math' });
  }

  test.each([
    // Single digit superscripts/subscripts don't have braces
    ['\\mathbb{R}^{0}', '\\mathbb{R}^0'],
    ['\\mathbb{R}^0', '\\mathbb{R}^0'],
    ['\\mathbb{N}_{1}', '\\mathbb{N}_1'],
    ['\\mathcal{F}^{2}', '\\mathcal{F}^2'],
    // Single letter subscripts/superscripts keep braces
    ['\\mathfrak{g}_{n}', '\\mathfrak{g}_{n}'],
    // Multi-character subscripts/superscripts should have braces
    ['\\mathbb{R}^{10}', '\\mathbb{R}^{10}'],
    ['\\mathbb{N}_{abc}', '\\mathbb{N}_{abc}'],
  ])('%#/ %p serializes as %p', (input, expected) => {
    expect(serialize(input)).toBe(expected);
  });
});

describe('MATHRM SERIALIZATION (issue #2818)', () => {
  function serialize(latex: string): string {
    const atoms = parseLatex(latex, { parseMode: 'math' });
    return Atom.serialize(atoms, { defaultMode: 'math' });
  }

  test.each([
    // \mathrm should be preserved in latex-expanded format
    ['\\mathrm{d}', '\\mathrm{d}'],
    ['\\mathrm{dx}', '\\mathrm{dx}'],
    [
      '\\frac{\\mathrm{d}y}{\\mathrm{d}x}',
      '\\frac{\\mathrm{d}y}{\\mathrm{d}x}',
    ],
    ['x\\mathrm{d}x', 'x\\mathrm{d}x'],
    ['a+\\mathrm{b}+c', 'a+\\mathrm{b}+c'],
    // Other upright variants should also work
    ['\\mathsf{A}', '\\mathsf{A}'],
    ['\\mathtt{code}', '\\mathtt{code}'],
  ])('%#/ %p serializes as %p', (input, expected) => {
    expect(serialize(input)).toBe(expected);
  });
});

describe('VALIDATE LATEX WITH MACROS', () => {
  test('custom macro is not flagged as unknown', () => {
    const errors = validateLatex('\\plimsoll', { macros: { plimsoll: '⦵' } });
    expect(errors).toHaveLength(0);
  });

  test('unknown command is still flagged without macros', () => {
    const errors = validateLatex('\\unknowncmd');
    expect(errors).toStrictEqual([
      expect.objectContaining({ code: 'unknown-command' }),
    ]);
  });

  test('unknown command is still flagged even with unrelated macros', () => {
    const errors = validateLatex('\\unknowncmd', { macros: { plimsoll: '⦵' } });
    expect(errors).toStrictEqual([
      expect.objectContaining({ code: 'unknown-command' }),
    ]);
  });
});

describe('REST* ARGUMENT COMMANDS (issue #2570)', () => {
  // Commands with {:rest*} deferred arguments should handle braced arguments
  test.each([
    '\\bf{425}',
    '\\it{text}',
    '\\bfseries{bold}',
    '\\mdseries{medium}',
    '\\upshape{upright}',
    '\\slshape{slanted}',
    '\\scshape{small caps}',
    '\\rmfamily{roman}',
    '\\sffamily{sans-serif}',
    '\\ttfamily{monospace}',
  ])('%#/ %p renders correctly', (x) => {
    expect(markupAndError(x)).toMatchSnapshot();
  });
});

describe('GENFRAC (issue #3048)', () => {
  // Remove the original LaTeX kept by the parser, so that the atoms are
  // serialized by the `\genfrac` serializer.
  function serialize(latex: string): string {
    const atoms = parseLatex(latex, { parseMode: 'math' });
    for (const atom of atoms) atom.verbatimLatex = undefined;
    return Atom.serialize(atoms, { defaultMode: 'math' });
  }

  test.each([
    ['\\genfrac{}{}{}{}{a}{b}', '\\genfrac{}{}{}{}{a}{b}'],
    ['\\genfrac(){0pt}{}{n}{k}', '\\genfrac{(}{)}{0pt}{}{n}{k}'],
    ['\\genfrac{[}{]}{1pt}{0}{a}{b}', '\\genfrac{[}{]}{1pt}{0}{a}{b}'],
    ['\\genfrac{\\lbrace}{.}{}{3}{a}{b}', '\\genfrac{\\lbrace}{}{}{3}{a}{b}'],
    ['\\genfrac{}{}{0.4pt}{2}{a+b}{c}', '\\genfrac{}{}{0.4pt}{2}{a+b}{c}'],
  ])('%#/ %p serializes as %p', (input, expected) => {
    expect(serialize(input)).toBe(expected);
    expect(error(input)).toBe('no-error');
  });

  test('\\genfrac with a zero thickness renders like \\binom', () => {
    expect(convertLatexToMarkup('\\genfrac{(}{)}{0pt}{}{n}{k}')).toBe(
      convertLatexToMarkup('\\binom{n}{k}')
    );
  });

  test('\\genfrac with default arguments renders like \\frac', () => {
    expect(convertLatexToMarkup('\\genfrac{}{}{}{}{a}{b}')).toBe(
      convertLatexToMarkup('\\frac{a}{b}')
    );
  });
});

describe('PRESCRIPT AND SIDESET', () => {
  // Remove the original LaTeX kept by the parser, so that the atoms are
  // serialized by their own serializers.
  function serialize(latex: string): string {
    const atoms = parseLatex(latex, { parseMode: 'math' });
    for (const atom of atoms) {
      atom.verbatimLatex = undefined;
      for (const child of atom.children) child.verbatimLatex = undefined;
    }
    return Atom.serialize(atoms, { defaultMode: 'math' });
  }

  test.each([
    ['\\prescript{14}{6}{C}', '\\prescript{14}{6}{C}'],
    ['\\prescript{}{6}{C}^{2+}', '\\prescript{}{6}{C}^{2+}'],
    ['\\prescript{\\mu}{\\nu}{T}', '\\prescript{\\mu}{\\nu}{T}'],
    ['\\sideset{_a^b}{_c^d}\\sum', '\\sideset{_{a}^{b}}{_{c}^{d}}\\sum'],
    [
      '\\sideset{_a^b}{_c^d}\\sum_{i=1}^{n}x_i',
      '\\sideset{_{a}^{b}}{_{c}^{d}}\\sum_{i=1}^{n}x_{i}',
    ],
    ["\\sideset{}{'}\\sum_{n<k}", '\\sideset{}{^{\\prime}}\\sum_{n<k}'],
    ['\\sideset{}{^*}\\prod', '\\sideset{}{^{*}}\\prod'],
    ['\\sideset{_a}{}\\int', '\\sideset{_{a}}{}\\int'],
    ['\\sideset{_a^b}{_c^d}{\\sum}', '\\sideset{_{a}^{b}}{_{c}^{d}}\\sum'],
    ['\\sideset{}{}\\sum\\limits_{i}', '\\sideset{}{}\\sum\\limits_{i}'],
  ])('%#/ %p serializes as %p', (input, expected) => {
    expect(serialize(input)).toBe(expected);
    expect(error(input)).toBe('no-error');
    // What it writes reads back as itself
    expect(serialize(expected)).toBe(expected);
  });

  test('the scripts of \\prescript come before its base', () => {
    const markup = convertLatexToMarkup('\\prescript{14}{6}{C}');
    expect(markup.indexOf('>6<')).toBeLessThan(markup.indexOf('>C<'));
    expect(markup.indexOf('>1<')).toBeLessThan(markup.indexOf('>C<'));
  });

  test('\\sideset draws its operator once, with its limits', () => {
    const markup = convertLatexToMarkup(
      '\\displaystyle\\sideset{_a^b}{_c^d}\\sum_{i=1}^{n}'
    );
    expect(markup.split('∑').length).toBe(2);
    for (const x of ['a', 'b', 'c', 'd', 'i', 'n'])
      expect(markup).toContain(`>${x}<`);
  });

  test('MathML: <mmultiscripts>, with <none> for a missing script', () => {
    expect(convertLatexToMathMl('\\prescript{14}{6}{C}')).toBe(
      '<mmultiscripts><mi>C</mi><mprescripts></mprescripts><mn>6</mn><mn>14</mn></mmultiscripts>'
    );
    expect(convertLatexToMathMl('\\sideset{_a}{^b}\\sum')).toBe(
      '<mmultiscripts><mo>\u2211</mo><none></none><mi>b</mi><mprescripts></mprescripts><mi>a</mi><none></none></mmultiscripts>'
    );
  });
});
