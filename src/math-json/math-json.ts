import type { ErrorListener } from '../public/core';
import { tokenize } from '../core/tokenizer';
import {
    DEFAULT_LATEX_NUMBER_OPTIONS,
    DEFAULT_PARSE_LATEX_OPTIONS,
    DEFAULT_EMIT_LATEX_OPTIONS,
} from './latex/utils';
import { Scanner } from './latex/parse';
import { form } from './forms';
import { Emitter } from './latex/emit';
import { Dictionary, ErrorCode, Expression, Form } from './public';
import { ParseLatexOptions, EmitLatexOptions } from './latex/public';
import { getDefaultLatexDictionary } from './latex/definitions';
import { getDefaultDictionary } from './dictionary';

declare let process: {
    env: { [key: string]: string };
};

export function parseLatex(
    latex: string,
    options?: ParseLatexOptions & {
        onError?: ErrorListener<ErrorCode>;
        form?: Form | Form[];
    }
): Expression {
    const scanner = new Scanner(tokenize(latex, []), {
        ...DEFAULT_LATEX_NUMBER_OPTIONS,
        ...DEFAULT_PARSE_LATEX_OPTIONS,
        onError: (err) => {
            if (window) {
                if (!err.before || !err.after) {
                    console.warn(err.code + (err.arg ? ': ' + err.arg : ''));
                } else {
                    console.warn(
                        err.code +
                            (err.arg ? ': ' + err.arg : '') +
                            '\n' +
                            '%c' +
                            '|  ' +
                            err.before +
                            '%c' +
                            err.after +
                            '\n' +
                            '%c' +
                            '|  ' +
                            String(' ').repeat(err.before.length) +
                            '▲',
                        'font-weight: bold',
                        'font-weight: normal; color: rgba(160, 160, 160)',
                        'font-weight: bold; color: hsl(4deg, 90%, 50%)'
                    );
                }
            }
            return;
        },
        dictionary: getDefaultLatexDictionary('all'),
        ...options,
    });

    const result = scanner.matchExpression();

    if (!scanner.atEnd()) {
        // eslint-disable-next-line no-unused-expressions
        options?.onError?.({ code: 'syntax-error' });
    }

    let forms: Form | Form[] = options?.form ?? ['canonical'];
    if (!Array.isArray(forms)) {
        forms = [forms];
    }
    return form(getDefaultDictionary('all'), result, forms) ?? '';
}

export function emitLatex(
    expr: Expression,
    options?: EmitLatexOptions & {
        dictionary?: Dictionary;
        onError?: ErrorListener<ErrorCode>;
    }
): string {
    const emitter = new Emitter({
        ...DEFAULT_LATEX_NUMBER_OPTIONS,
        ...DEFAULT_EMIT_LATEX_OPTIONS,
        dictionary: getDefaultLatexDictionary(),
        onError: (_err) => {
            // console.error(err.code + (err.arg ? ': ' + err.arg : ''));
        },
        ...(options ?? {}),
    });
    return emitter.emit(expr);
}
