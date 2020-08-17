import { Expression } from '../public';
import { Scanner, Emitter, LatexDictionary } from './public';
import { NOTHING } from '../dictionary/dictionary';

function parseIntegral(
    lhs: Expression,
    scanner: Scanner,
    _minPrec: number,
    _latex: string
): [Expression | null, Expression | null] {
    // There could be some superscript and subscripts
    let sup: Expression = NOTHING;
    let sub: Expression = NOTHING;
    let done = false;
    while (!done) {
        scanner.skipSpace();
        if (scanner.match('_')) {
            sub = scanner.matchRequiredLatexArgument();
        } else if (scanner.match('^')) {
            sup = scanner.matchRequiredLatexArgument();
        } else {
            done = true;
        }
    }

    // Find the next
    let fn: Expression = null;
    if (scanner.match('<{>')) {
        const start = scanner.getIndex();
        let level = 1;
        while (!scanner.atEnd() && level !== 0) {
            if (scanner.match('<{>')) {
                level += 1;
            } else if (scanner.match('<}>')) {
                level -= 1;
            } else {
                scanner.next();
            }
        }
        const exprScanner = scanner.clone(start, scanner.getIndex() - 1);
        fn = exprScanner.matchExpression() ?? '';
    }

    return [lhs, ['Integral', fn, sup, sub]];
}

function emitIntegral(_emitter: Emitter, _expr: Expression): string {
    return '';
}

export const DEFINITIONS_CALCULUS: LatexDictionary = [
    { trigger: { symbol: '\\int' }, parse: parseIntegral, emit: emitIntegral },
];
