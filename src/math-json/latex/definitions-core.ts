import { LatexDictionary, Scanner, Emitter } from './public';
import {
    LATEX,
    GROUP,
    LIST,
    MISSING,
    PRIME,
    INVERSE_FUNCTION,
    DERIVATIVE,
    NOTHING,
    SEQUENCE,
    SUBSEQUENCE,
} from '../dictionary/dictionary';
import { Expression } from '../public';
import {
    getNumberValue,
    getArg,
    getArgCount,
    getFunctionName,
    getArgs,
    getFunctionHead,
} from '../utils';
import { getGroupStyle } from './emit-style';

export function emitGroup(emitter: Emitter, expr: Expression): string {
    let sep = '';
    let argString = '';
    const anySubsequence = getArgs(expr).some(
        (x) => getFunctionName(x) === SUBSEQUENCE
    );
    for (const arg of getArgs(expr)) {
        if (arg !== null) {
            argString += sep + emitter.emit(arg);
            sep = anySubsequence ? '; ' : ', ';
        }
    }

    return emitter.wrapString(argString, getGroupStyle(expr, emitter.level));
}

function parseSequence(
    lhs: Expression,
    scanner: Scanner,
    minPrec: number,
    _latex: string
): [Expression | null, Expression | null] {
    if (minPrec >= 20) return [lhs, null];
    let args: Expression[] = [];
    let row: Expression[] = [lhs ?? NOTHING];
    let done = false;
    while (!done) {
        scanner.skipSpace();
        const rhs = scanner.matchExpression(20);
        if (rhs === null) {
            scanner.skipSpace();
            if (scanner.match(',')) {
                row.push(NOTHING);
            } else {
                done = true;
            }
        } else {
            if (getFunctionName(rhs) === SEQUENCE) {
                row = row.concat(getArgs(rhs));
            } else {
                row.push(rhs);
            }
            scanner.skipSpace();
            if (scanner.match(',')) {
                scanner.skipSpace();
            } else if (scanner.match(';')) {
                args.push([SUBSEQUENCE, ...row]);
                row = [];
            } else {
                done = true;
            }
        }
    }
    if (args.length === 0) {
        args = row;
    } else {
        args.push([SUBSEQUENCE, ...row]);
    }

    return [null, [SUBSEQUENCE, ...args]];
}

function emitSequence(emitter: Emitter, expr: Expression | null): string {
    if (getFunctionName(expr) === 'Sequence') {
        const anySubsequence = getArgs(expr).some(
            (x) => getFunctionName(x) === SUBSEQUENCE
        );

        if (anySubsequence) {
            return getArgs(expr)
                .map((x) => emitter.emit(x))
                .join('; ');
        }
    }

    return getArgs(expr)
        .map((x) => emitter.emit(x))
        .join(', ');
}

function emitLatex(emitter: Emitter, expr: Expression | null): string {
    if (expr === null) return '';
    const head = getFunctionHead(expr);
    if (head !== null) {
        const args = getArgs(expr);
        if (head === LATEX) {
            return args.map((x) => emitLatex(emitter, x)).join('');
        }
        if (args.length === 0) return emitter.emit(head);
        return (
            emitter.emit(head) +
            args.map((x) => '{' + emitter.emit(x) + '}').join('')
        );
    }
    return emitter.emit(expr);
}

export const DEFINITIONS_CORE: LatexDictionary = [
    { name: LATEX, emit: emitLatex },
    {
        name: GROUP,
        trigger: { matchfix: '(' },
        parse: (
            lhs: Expression,
            scanner: Scanner,
            _minPrec: number,
            _latex: string
        ): [Expression | null, Expression | null] => {
            const originalIndex = scanner.getIndex();
            //
            // 1. Attempt to scan a base-n number
            // i.e. `(deadbeef)_{16}`
            //
            let done = false;
            let couldBeBaseNumber = true;
            let maxDigit = 0;
            let base = '';
            while (!done && couldBeBaseNumber) {
                const token = scanner.next();
                if (scanner.atEnd() || token === ')') {
                    done = true;
                } else if (!/^[0-9a-zA-Z]$/.test(token)) {
                    couldBeBaseNumber = false;
                } else {
                    maxDigit = Math.max(maxDigit, parseInt(token, 36));
                    base += token;
                }
            }
            scanner.skipSpace();
            if (couldBeBaseNumber && scanner.match('_')) {
                const radix = getNumberValue(
                    scanner.matchRequiredLatexArgument()
                );
                if (isFinite(radix) && maxDigit < radix) {
                    return [lhs, ['BaseForm', parseInt(base, radix), radix]];
                }
            }

            //
            // 2. It wasn't a number in a base. Scan a sequence
            //
            scanner.setIndex(originalIndex);

            const [, seq]: Expression[] = parseSequence(
                scanner.matchExpression(20),
                scanner,
                0,
                ''
            );

            if (!scanner.match(')')) {
                scanner.onError({
                    code: 'unbalanced-matchfix-operator',
                    arg: '()',
                });
            }
            return [lhs, [GROUP, seq]];
        },
        emit: emitGroup,
        separator: ',',
        closeFence: ')',
        precedence: 20,
    },
    {
        name: LIST,
        trigger: { matchfix: '\\lbrack' },
        separator: ',',
        closeFence: '\\rbrack',
        precedence: 20,
        // @todo
        // parse: (
        //     lhs: Expression,
        //     scanner: Scanner,
        //     _minPrec: number,
        //     _latex: string
        // ): [Expression | null, Expression | null] => {
        //     if (lhs === null) {
        //         // No lhs -> it's a list
        //     }
        //     // There is a lhs -> it might be an index accessor, i.e. `v[23]`
        // },
    },
    {
        name: 'BaseForm',
        emit: (emitter: Emitter, expr: Expression): string => {
            const radix = getNumberValue(getArg(expr, 2));
            if (isFinite(radix) && radix > 0 && radix <= 36) {
                const num = getNumberValue(getArg(expr, 1));
                if (isFinite(num)) {
                    let digits = Number(num).toString(radix);
                    let groupLength = 0;
                    if (radix === 2) {
                        groupLength = 4;
                    } else if (radix === 10) {
                        groupLength = 4;
                    } else if (radix === 16) {
                        groupLength = 2;
                    } else if (radix > 16) {
                        groupLength = 4;
                    }
                    if (groupLength > 0) {
                        const oldDigits = digits;
                        digits = '';
                        for (let i = 0; i < oldDigits.length; i++) {
                            if (i > 0 && i % groupLength === 0) {
                                digits = '\\; ' + digits;
                            }
                            digits =
                                oldDigits[oldDigits.length - i - 1] + digits;
                        }
                    }
                    return (
                        '\\mathtt{' +
                        digits +
                        '}_{' +
                        Number(radix).toString() +
                        '}'
                    );
                }
            }
            return (
                '\\operatorname{BaseForm}(' +
                emitter.emit(getArg(expr, 1)) +
                ', ' +
                emitter.emit(getArg(expr, 2)) +
                ')'
            );
        },
    },
    {
        name: 'Set',
        trigger: { matchfix: '\\lbrace' },
        separator: ',',
        closeFence: '\\rbrace',
        precedence: 20,
    },
    {
        name: SEQUENCE,
        trigger: { infix: ',' },
        // Unlike the matchfix version of List,
        // when the comma operator is used, the lhs and rhs are flattened,
        // i.e. `1,2,3` -> `["Sequence", 1, 2, 3],
        // but `1, (2, 3)` -> ["Sequence", 1, ["Group", 2, 3]]`
        parse: parseSequence,
        emit: emitSequence,
        precedence: 20,
    },
    {
        name: SUBSEQUENCE,
        trigger: { infix: ';' },
        parse: parseSequence,
        emit: emitSequence,
        precedence: 20,
    },
    {
        name: MISSING,
        trigger: '\\placeholder',
        emit: '\\placeholder',
        requiredLatexArg: 1,
    },
    {
        name: 'Subscript',
        trigger: { infix: '_' },
        precedence: 720,
        emit: (emitter: Emitter, expr: Expression): string => {
            if (getArgCount(expr) === 2) {
                return (
                    emitter.emit(getArg(expr, 1)) +
                    '_{' +
                    emitter.emit(getArg(expr, 2)) +
                    '}'
                );
            }
            return '_{' + emitter.emit(getArg(expr, 1)) + '}';
        },
        parse: (
            lhs: Expression,
            scanner: Scanner,
            _minPrec: number,
            _latex: string
        ): [Expression | null, Expression | null] => {
            const rhs = scanner.matchRequiredLatexArgument();
            return [null, ['Subscript', lhs, rhs]];
        },
    },
    {
        name: 'Superplus',
        trigger: { superfix: '+' },
    },
    {
        name: 'Subplus',
        trigger: { subfix: '+' },
    },
    {
        name: 'Superminus',
        trigger: { superfix: '-' },
    },
    {
        name: 'Subminus',
        trigger: { subfix: '-' },
    },
    {
        // @todo: when lhs is a complex number, 'Conjugate'
        name: 'Superstar',
        trigger: { superfix: '*' },
    },
    {
        // @todo: when lhs is a complex number, 'Conjugate'
        name: 'Superstar',
        trigger: { superfix: '\\star' },
    },
    {
        name: 'Substar',
        trigger: { subfix: '*' },
    },
    {
        name: 'Substar',
        trigger: { subfix: '\\star' },
    },
    {
        name: 'Superdagger',
        trigger: { superfix: '\\dagger' },
    },
    {
        name: 'Superdagger',
        trigger: { superfix: '\\dag' },
    },
    {
        name: PRIME,
        trigger: { superfix: '\\prime' },
        arguments: 'group',
    },
    {
        // name: 'prime',
        trigger: { superfix: '\\doubleprime' },
        parse: (lhs: Expression): [Expression, Expression] => {
            return [null, [PRIME, lhs, 2]];
        },
        arguments: 'group',
    },
    {
        name: INVERSE_FUNCTION,
        emit: (emitter: Emitter, expr: Expression): string => {
            return emitter.emit(getArg(expr, 1)) + '^{-1}';
        },
    },
    {
        name: DERIVATIVE,
        trigger: 'D',
        parse: (
            lhs: Expression,
            _scanner: Scanner
        ): [Expression, Expression] => {
            return [lhs, [DERIVATIVE, 1]];
        },
        emit: (emitter: Emitter, expr: Expression): string => {
            const degree = getNumberValue(getArg(expr, 1));
            if (!isFinite(degree)) return '';
            const base = emitter.emit(getArg(expr, 2));
            if (degree === 1) {
                return base + '^{\\prime}';
            } else if (degree === 2) {
                return base + '^{\\doubleprime}';
            }
            return base + '^{(' + Number(degree).toString() + ')}';
        },
    },
    {
        name: 'Piecewise',
        trigger: { environment: 'cases' },
        parse: (
            _lhs: Expression,
            scanner: Scanner
        ): [Expression, Expression] => {
            return [null, ['piecewise', scanner.matchTabular()]];
        },
        emit: (emitter: Emitter, expr: Expression): string => {
            if (getFunctionName(getArg(expr, 1)) !== LIST) return '';
            const rows = getArgs(getArg(expr, 1));
            let body = '';
            let rowSep = '';
            for (const row of rows) {
                body += rowSep;
                const arg1 = getArg(row, 1);
                if (arg1 !== null) {
                    body += emitter.emit(arg1);
                    const arg2 = getArg(row, 2);
                    if (arg2 !== null) body += '&' + emitter.emit(arg2);
                }
                rowSep = '\\\\';
            }
            return '\\begin{cases}' + body + '\\end{cases}';
        },
    },
];
