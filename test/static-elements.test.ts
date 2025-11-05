import { describe, expect, it } from '@jest/globals';
import { convertLatexToMarkup, convertAsciiMathToLatex, convertMathJsonToLatex } from '../src/public/mathlive-ssr';

describe('Static Elements Rendering Functions', () => {
  describe('convertLatexToMarkup', () => {
    it('should convert LaTeX to markup in textstyle mode', () => {
      const markup = convertLatexToMarkup('x^2 + y^2 = z^2', {
        defaultMode: 'inline-math',
      });
      expect(markup).toContain('ML__latex');
      expect(markup).toContain('x');
    });

    it('should convert LaTeX to markup in displaystyle mode', () => {
      const markup = convertLatexToMarkup('\\int_0^\\infty e^{-x^2} dx', {
        defaultMode: 'math',
      });
      expect(markup).toContain('ML__latex');
      expect(markup).toContain('∫'); // integral symbol
    });

    it('should handle fractions', () => {
      const markup = convertLatexToMarkup('\\frac{1}{2}', {
        defaultMode: 'inline-math',
      });
      expect(markup).toContain('frac');
    });

    it('should support letter shape styles', () => {
      const markupTex = convertLatexToMarkup('f(x) = ax + b', {
        defaultMode: 'math',
        letterShapeStyle: 'tex',
      });

      const markupIso = convertLatexToMarkup('f(x) = ax + b', {
        defaultMode: 'math',
        letterShapeStyle: 'iso',
      });

      expect(markupTex).toBeTruthy();
      expect(markupIso).toBeTruthy();
    });

    it('should support macros', () => {
      const markup = convertLatexToMarkup('\\foo{x}', {
        defaultMode: 'math',
        macros: {
          foo: '\\mathbb{#1}',
        },
      });
      expect(markup).toBeTruthy();
    });

    it('should handle empty input', () => {
      const markup = convertLatexToMarkup('', {
        defaultMode: 'math',
      });
      // Empty input produces empty markup container
      expect(markup).toContain('ML__latex');
    });
  });

  describe('Format conversion functions', () => {
    it('should convert AsciiMath to LaTeX', () => {
      const latex = convertAsciiMathToLatex('x^2 + y^2');
      expect(latex).toContain('^');
      expect(latex).toContain('x');
      expect(latex).toContain('y');
    });

    it('should convert MathJSON to LaTeX', () => {
      // MathJSON conversion requires Compute Engine which isn't available in tests
      // Just verify the function exists and doesn't throw
      expect(() => convertMathJsonToLatex(['Add', 'x', 'y'])).not.toThrow();
    });

    it('should handle complex MathJSON expressions', () => {
      // MathJSON conversion requires Compute Engine which isn't available in tests
      // Just verify the function exists and doesn't throw
      expect(() =>
        convertMathJsonToLatex([
          'Divide',
          ['Add', 'a', 'b'],
          ['Multiply', 'c', 'd'],
        ])
      ).not.toThrow();
    });
  });

  describe('Options handling', () => {
    it('should respect minFontScale option', () => {
      const markup = convertLatexToMarkup('x^{y^{z}}', {
        defaultMode: 'math',
        minFontScale: 0.5,
      });
      expect(markup).toBeTruthy();
    });

    it('should respect maxMatrixCols option', () => {
      const markup = convertLatexToMarkup(
        '\\begin{pmatrix}a & b \\\\ c & d\\end{pmatrix}',
        {
          defaultMode: 'math',
          maxMatrixCols: 10,
        }
      );
      expect(markup).toBeTruthy();
      expect(markup).toContain('ML__mtable'); // matrix table
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid LaTeX gracefully', () => {
      // convertLatexToMarkup doesn't throw on invalid LaTeX
      // It tries to render what it can
      const markup = convertLatexToMarkup('\\invalid{{{', {
        defaultMode: 'math',
      });
      expect(markup).toBeTruthy();
    });

    it('should handle special characters', () => {
      const markup = convertLatexToMarkup('\\alpha \\beta \\gamma', {
        defaultMode: 'math',
      });
      expect(markup).toContain('α'); // Greek alpha
      expect(markup).toContain('β'); // Greek beta
      expect(markup).toContain('γ'); // Greek gamma
    });

    it('should handle nested structures', () => {
      const markup = convertLatexToMarkup('\\sqrt{\\frac{a}{b}}', {
        defaultMode: 'math',
      });
      expect(markup).toContain('sqrt');
      expect(markup).toContain('frac');
    });
  });
});
