import {
  convertLatexToAsciiMath,
  convertAsciiMathToLatex,
} from '../src/public/mathlive-ssr';

function equalASCIIMath(latex: string, ascii: string) {
  test(latex, () => {
    expect(convertLatexToAsciiMath(latex)).toBe(ascii);
    expect(convertAsciiMathToLatex(ascii)).toBe(latex);
  });
}

describe('ASCII MATH', function () {
  equalASCIIMath('123', '123');
  equalASCIIMath('-123.456', '-123.456');
  equalASCIIMath('-123.456e9', '-123.456e9');
  equalASCIIMath('x', 'x');
  equalASCIIMath('-x', '-x');

  equalASCIIMath('npq', 'npq');
  equalASCIIMath('2npq', '2npq');

  expect(convertLatexToAsciiMath('(x)')).toBe('(x)');
  expect(convertAsciiMathToLatex('(x)')).toBe('\\left(x\\right)');

  expect(convertLatexToAsciiMath('(x + 1)')).toBe('(x+1)');
  expect(convertAsciiMathToLatex('(x + 1)')).toBe('\\left(x +1\\right)');

  equalASCIIMath('f\\left(x\\right)=\\sin x', 'f(x)=sin x');

  equalASCIIMath('x^{2}', 'x^2');
  equalASCIIMath('x^{234}', 'x^(234)');
  equalASCIIMath('x^{-234.56}', 'x^(-234.56)');
  equalASCIIMath('x^{-234.56}+1', 'x^(-234.56)+1');
  equalASCIIMath('x^{n}+1', 'x^n+1');
  equalASCIIMath('x^{npq}+1', 'x^(npq)+1');
  equalASCIIMath('x^{n+2}', 'x^(n+2)');

  equalASCIIMath('x_{2}', 'x_2');
  equalASCIIMath('x_{234}', 'x_(234)');
  equalASCIIMath('x_{-234.56}', 'x_(-234.56)');
  equalASCIIMath('x_{-234.56}+1', 'x_(-234.56)+1');
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

  // Avoid collisions with digits
  expect(convertLatexToAsciiMath('1^2 3^4')).toBe('1^2 3^4');

  equalASCIIMath('\\text{if }x>0', '"if " x>0');
  equalASCIIMath(
    '\\text{if }x>0\\text{ then }f\\left(x\\right)=x^{2}',
    '"if " x>0" then " f(x)=x^2'
  );
  // equalASCIIMath('\\begin{pmatrix}a & b & c\\end{pmatrix}', '((a),(b),(c))');

  // equalASCIIMath(
  //   '\\begin{pmatrix}a & b & c \\\\ d & e\\end{pmatrix}',
  //   '((a),(b),(c),(d),(e),())'
  // );

  // equalASCIIMath(
  //   '\\begin{bmatrix}a & b & c \\\\ d & e & f\\end{bmatrix}',
  //   '[[a],[b],[c],[d],[e],[f]]'
  // );
});
