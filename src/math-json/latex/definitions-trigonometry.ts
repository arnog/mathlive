import { Expression } from '../public';
import { Scanner, LatexDictionary } from './public';
import { INVERSE_FUNCTION, DERIVATIVE } from '../dictionary/dictionary';

/**
 * Trigonometric functions have some special conventions that require a
 * custom parser: they can be followed by a "-1" superscript indicating
 * that the inversion function should be used, i.e. "sin^{-1}" for "arcsin".
 *
 */
function parseTrig(
    _lhs: Expression,
    scanner: Scanner,
    _minPrec: number,
    latex: string
): [Expression | null, Expression | null] {
    let isInverse = false;

    let primeLevel = 0;

    scanner.skipSpace();
    if (scanner.match('^')) {
        scanner.skipSpace();
        if (scanner.match('<{>')) {
            scanner.skipSpace();
            // There's a superscript..., parse it.
            if (scanner.match('-') && scanner.match('1')) {
                isInverse = true;
            }
            do {
                if (scanner.match('\\doubleprime')) {
                    primeLevel += 2;
                }
                if (scanner.match('\\prime')) {
                    primeLevel += 1;
                }
                if (scanner.match("'")) {
                    primeLevel += 1;
                }
            } while (!scanner.match('<}>') && !scanner.atEnd());
        }
        let done = false;
        while (!done) {
            scanner.skipSpace();
            if (scanner.match('\\doubleprime')) {
                primeLevel += 2;
            } else if (scanner.match('\\prime')) {
                primeLevel += 1;
            } else if (scanner.match("'")) {
                primeLevel += 1;
            } else {
                done = true;
            }
        }
    }

    // Note: names as per NIST-DLMF
    let head =
        {
            '\\arcsin': 'Arcsin',
            '\\arccos': 'Arccos',
            '\\arctan': 'Arctan',
            '\\arctg': 'Arctan',
            '\\arcctg': 'Arctan',
            '\\arcsec': 'Arcsec',
            '\\arccsc': ' Arccsc',
            '\\arsinh': 'Arsinh',
            '\\arcosh': 'Arcosh',
            '\\artanh': 'Artanh',
            '\\arcsech': 'Arcsech',
            '\\arccsch': 'Arcsch',
            // '\\arg',
            '\\ch': 'Cosh',
            '\\cos': 'Cos',
            '\\cosec': 'Csc',
            '\\cosh': 'Csch',
            '\\cot': 'Cot',
            '\\cotg': 'Cot',
            '\\coth': 'Coth',
            '\\csc': 'Csc',
            '\\ctg': 'Cot',
            '\\cth': 'Coth',
            '\\sec': 'Sec',
            '\\sin': 'Sin',
            '\\sinh': 'Sinh',
            '\\sh': 'Sinh',
            '\\tan': 'Tan',
            '\\tanh': 'Tanh',
            '\\tg': 'Tan',
            '\\th': 'Tanh',
        }[latex] ?? latex;

    if (isInverse) {
        head = [INVERSE_FUNCTION, head];
    }
    if (primeLevel >= 1) {
        head = [DERIVATIVE, primeLevel, head];
    }

    const args = scanner.matchArguments('implicit');
    if (args === null) {
        return [null, head];
    }
    return [null, [head, ...args]];
}

export const DEFINITIONS_TRIGONOMETRY: LatexDictionary = [
    {
        name: 'Arcsin',
        trigger: '\\arcsin',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Arccos',
        trigger: '\\arccos',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Arctan',
        trigger: '\\arctan',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Arctan',
        trigger: '\\arctg',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Arccot',
        trigger: '\\arcctg',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Arcsec',
        trigger: '\\arcsec',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Arccsc',
        trigger: '\\arccsc',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Arsinh',
        trigger: '\\arsinh',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Arcosh',
        trigger: '\\arcosh',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Artanh',
        trigger: '\\artanh',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Arsech',
        trigger: '\\arsech',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Arcsch',
        trigger: '\\arcsch',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Cosh',
        trigger: '\\ch',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Cosec',
        trigger: '\\cosec',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Cosh',
        trigger: '\\cosh',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Cot',
        trigger: '\\cot',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Cot',
        trigger: '\\cotg',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Coth',
        trigger: '\\coth',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Csc',
        trigger: '\\csc',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Cot',
        trigger: '\\ctg',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Coth',
        trigger: '\\cth',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Sec',
        trigger: '\\sec',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Sinh',
        trigger: '\\sinh',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Sinh',
        trigger: '\\sh',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Tan',
        trigger: '\\tan',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Tanh',
        trigger: '\\tanh',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Tan',
        trigger: '\\tg',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Tanh',
        trigger: '\\th',
        arguments: 'implicit',
        parse: parseTrig,
    },

    {
        name: 'Cos',
        trigger: '\\cos',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Sin',
        trigger: '\\sin',
        arguments: 'implicit',
        parse: parseTrig,
    },
    {
        name: 'Tan',
        trigger: '\\tan',
        arguments: 'implicit',
        parse: parseTrig,
    },
];
