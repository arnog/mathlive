import { debug } from '../dist/mathlive';

function equalASCIIMath(latex: string, ascii: string) {
    test(latex, () => {
        expect(debug.latexToAsciiMath(latex)).toBe(ascii);
        expect(debug.asciiMathToLatex(ascii)).toBe(latex);
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

    expect(debug.latexToAsciiMath('(x)')).toBe('(x)');
    expect(debug.asciiMathToLatex('(x)')).toBe('\\left(x\\right)');

    expect(debug.latexToAsciiMath('(x + 1)')).toBe('(x+1)');
    expect(debug.asciiMathToLatex('(x + 1)')).toBe('\\left(x +1\\right)');

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
