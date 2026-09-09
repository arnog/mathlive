import '../src/public/mathlive-ssr';
import { parseLatex } from '../src/core/parser';
import { Atom } from '../src/core/atom-class';
import { _MathEnvironment } from '../src/core/math-environment';

function roundtrip(latex: string): string {
  const atoms = parseLatex(latex, { parseMode: 'math' });
  // Discard verbatim LaTeX so the serializer logic is exercised
  for (const atom of atoms) atom.verbatimLatex = undefined;
  return Atom.serialize(atoms, { defaultMode: 'math' });
}

describe('compact serialization', () => {
  afterEach(() => {
    _MathEnvironment.compactSerialization = true;
  });

  test('compact (default)', () => {
    expect(roundtrip('\\frac{1}{2}')).toBe('\\frac12');
    expect(roundtrip('\\binom{1}{2}')).toBe('\\binom12');
    expect(roundtrip('\\sqrt{2}')).toBe('\\sqrt2');
    expect(roundtrip('x^{2}')).toBe('x^2');
    expect(roundtrip('x_{1}')).toBe('x_1');
  });

  test('explicit braces when compactSerialization is false', () => {
    _MathEnvironment.compactSerialization = false;
    expect(roundtrip('\\frac{1}{2}')).toBe('\\frac{1}{2}');
    expect(roundtrip('\\frac{12}{2}')).toBe('\\frac{12}{2}');
    expect(roundtrip('\\binom{1}{2}')).toBe('\\binom{1}{2}');
    expect(roundtrip('\\sqrt{2}')).toBe('\\sqrt{2}');
    expect(roundtrip('\\sqrt{12}')).toBe('\\sqrt{12}');
    expect(roundtrip('\\sqrt[3]{8}')).toBe('\\sqrt[3]{8}');
    expect(roundtrip('x^{2}')).toBe('x^{2}');
    expect(roundtrip('x_{1}')).toBe('x_{1}');
    expect(roundtrip('x^{12}')).toBe('x^{12}');
  });

  test('non-digit superscripts are unaffected', () => {
    expect(roundtrip("x'")).toBe('x^{\\prime}');
    expect(roundtrip('x^{n}')).toBe('x^{n}');
    _MathEnvironment.compactSerialization = false;
    expect(roundtrip("x'")).toBe('x^{\\prime}');
    expect(roundtrip('x^{n}')).toBe('x^{n}');
  });

  test('digits are not glued to a following digit', () => {
    // These round-trip correctly either way, but the compact form is
    // hard to read: `\frac123` is a half followed by 3, not 1/23
    _MathEnvironment.compactSerialization = false;
    expect(roundtrip('\\frac{1}{2}3')).toBe('\\frac{1}{2}3');
    expect(roundtrip('x^{2}3')).toBe('x^{2}3');
    expect(roundtrip('x_{1}2')).toBe('x_{1}2');
  });

  test('`\\sqrt12` is the root of 1, followed by 2', () => {
    // `\sqrt` takes a single mandatory argument, so `\sqrt12` is
    // `\sqrt{1}2`, not `\sqrt{12}`
    expect(roundtrip('\\sqrt12')).toBe('\\sqrt12');
    _MathEnvironment.compactSerialization = false;
    expect(roundtrip('\\sqrt12')).toBe('\\sqrt{1}2');
  });
});
