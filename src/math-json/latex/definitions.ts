import { ErrorListener } from '../../public/core';
import { DictionaryCategory, Expression, ErrorCode } from '../public';
import {
    LatexDictionary,
    Latex,
    LatexToken,
    ParserFunction,
    EmitterFunction,
} from './public';
import { tokensToString } from '../../core/modes';
import { DEFINITIONS_INEQUALITIES } from './definitions-inequalities';
import { DEFINITIONS_OTHERS } from './definitions-other';
import { DEFINITIONS_CORE } from './definitions-core';
import { DEFINITIONS_ARITHMETIC } from './definitions-arithmetic';
import { DEFINITIONS_TRIGONOMETRY } from './definitions-trigonometry';
import { DEFINITIONS_ALGEBRA } from './definitions-algebra';
import { DEFINITIONS_CALCULUS } from './definitions-calculus';
import { DEFINITIONS_SYMBOLS } from './definitions-symbols';

export type IndexedLatexDictionaryEntry = {
    name: string;
    trigger: {
        symbol?: LatexToken | LatexToken[];
        matchfix?: LatexToken | LatexToken[];
        infix?: LatexToken | LatexToken[];
        prefix?: LatexToken | LatexToken[];
        postfix?: LatexToken | LatexToken[];
        superfix?: LatexToken | LatexToken[];
        subfix?: LatexToken | LatexToken[];
    };
    parse: Expression | ParserFunction;
    emit: EmitterFunction | Latex;
    associativity?: 'right' | 'left' | 'non' | 'both';
    precedence?: number;
    arguments?: 'group' | 'implicit' | '';
    optionalLatexArg?: number;
    requiredLatexArg?: number;
    separator?: Latex;
    closeFence?: Latex;
};

export type IndexedLatexDictionary = {
    lookahead: number;
    name: Map<string, IndexedLatexDictionaryEntry>;
    prefix: (Map<Latex, IndexedLatexDictionaryEntry> | null)[];
    infix: (Map<Latex, IndexedLatexDictionaryEntry> | null)[];
    postfix: (Map<Latex, IndexedLatexDictionaryEntry> | null)[];
    matchfix: (Map<Latex, IndexedLatexDictionaryEntry> | null)[];
    superfix: (Map<Latex, IndexedLatexDictionaryEntry> | null)[];
    subfix: (Map<Latex, IndexedLatexDictionaryEntry> | null)[];
    symbol: (Map<Latex, IndexedLatexDictionaryEntry> | null)[];
    environment: Map<string, IndexedLatexDictionaryEntry>;
};

function triggerLength(trigger: LatexToken | LatexToken[]): number {
    if (Array.isArray(trigger)) return trigger.length;
    return 1;
}

function triggerString(trigger: LatexToken | LatexToken[]) {
    if (Array.isArray(trigger)) return tokensToString(trigger);
    return trigger;
}

// function hasDef(dic: LatexDictionary, latex: string): boolean {
//     let result = false;

//     dic.forEach((x) => {
//         if (x.trigger) {
//             if (typeof x.trigger === 'string' && x.trigger === latex) {
//                 result = true;
//             } else if (
//                 typeof x.trigger !== 'string' &&
//                 (triggerString(x.trigger.infix) === latex ||
//                     triggerString(x.trigger.postfix) === latex ||
//                     triggerString(x.trigger.symbol) === latex ||
//                     triggerString(x.trigger.prefix) === latex ||
//                     triggerString(x.trigger.matchfix) === latex ||
//                     triggerString(x.closeFence) === latex)
//             ) {
//                 result = true;
//             }
//         }
//     });
//     return result;
// }

export function indexLatexDictionary(
    dic: LatexDictionary,
    onError: ErrorListener<ErrorCode>
): IndexedLatexDictionary {
    const result = {
        lookahead: 1,
        name: new Map(),
        prefix: [],
        infix: [],
        postfix: [],
        matchfix: [],
        superfix: [],
        subfix: [],
        symbol: [],
        environment: new Map(),
    };

    for (const x of dic) {
        const record = x;
        if (typeof record.parse === 'undefined') {
            // By default, when a latex string triggers, the generated
            // output is the name of this record, i.e. MULTIPLY
            record.parse = record.name;
        }
        // If the trigger is a string, it's a shortcut for a symbol
        if (typeof record.trigger === 'string') {
            record.trigger = { symbol: record.trigger };
        }
        if (typeof record.emit === 'string') {
            if (typeof record.trigger?.symbol !== 'undefined') {
                if (/#[0-9]/.test(record.emit)) {
                    onError({ code: 'unexpected-argument', arg: record.name });
                }
            }
        }
        if (typeof record.emit === 'undefined') {
            // By default, when latex is emitted for this record,
            // it is the same as the trigger (note there could be multiple
            // triggers, so we just pick one)
            if (typeof record.trigger?.postfix !== 'undefined') {
                record.emit = '#1' + triggerString(record.trigger.postfix);
            } else if (typeof record.trigger?.prefix !== 'undefined') {
                record.emit = triggerString(record.trigger.prefix) + '#1';
            } else if (typeof record.trigger?.infix !== 'undefined') {
                record.emit = '#1' + triggerString(record.trigger.infix) + '#2';
            } else if (typeof record.trigger?.symbol !== 'undefined') {
                record.emit = triggerString(record.trigger.symbol);
            } else if (typeof record.trigger?.superfix !== 'undefined') {
                record.emit =
                    '#1^{' + triggerString(record.trigger?.superfix) + '}';
            } else if (typeof record.trigger?.subfix !== 'undefined') {
                record.emit =
                    '#1_{' + triggerString(record.trigger?.subfix) + '}';
            } else {
                record.emit = '';
            }
        }
        if (typeof record.trigger?.infix !== 'undefined') {
            if (typeof record.precedence === 'undefined') {
                onError({
                    code: 'syntax-error',
                    arg: 'Infix operators require a precedence',
                });
            }
            if (!record.associativity) {
                record.associativity = 'non';
            }
        }
        if (typeof record.trigger?.symbol !== 'undefined') {
            record.arguments = record.arguments ?? '';
            record.optionalLatexArg = record.optionalLatexArg ?? 0;
            record.requiredLatexArg = record.requiredLatexArg ?? 0;
        }
        if (typeof record.trigger?.matchfix !== 'undefined') {
            if (record.parse !== 'function' && !record.closeFence) {
                onError({
                    code: 'syntax-error',
                    arg:
                        'Matchfix operators require a close fence or a custom parse function',
                });
            }
        }

        if (typeof record.trigger !== 'undefined') {
            [
                'infix',
                'prefix',
                'postfix',
                'symbol',
                'matchfix',
                'superfix',
                'subfix',
            ].forEach((x) => {
                const n = triggerLength(record.trigger[x]);
                result.lookahead = Math.max(result.lookahead, n);
                if (typeof result[x][n] === 'undefined') {
                    result[x][n] = new Map<
                        string,
                        IndexedLatexDictionaryEntry
                    >();
                }
                result[x][n].set(triggerString(record.trigger[x]), record);
            });
            if (typeof record.trigger.environment !== 'undefined') {
                result.environment.set(record.trigger.environment, record);
            }
        }
        if (record.name) {
            result.name.set(triggerString(record.name), record);
        }
        if (typeof record.trigger === 'undefined' && !record.name) {
            // A trigger OR a name is required.
            // The trigger maps latex -> json
            // The name maps json -> latex
            onError({
                code: 'syntax-error',
                arg: 'Need at least a trigger or a name',
            });
        }
    }

    return result;
}

export function getDefaultLatexDictionary(
    domain: DictionaryCategory | 'all' = 'all'
): LatexDictionary {
    let result: LatexDictionary;
    if (domain === 'all') {
        result = [];
        Object.keys(DEFAULT_LATEX_DICTIONARY).forEach((x) => {
            result = [...result, ...DEFAULT_LATEX_DICTIONARY[x]];
        });
    } else {
        result = [...DEFAULT_LATEX_DICTIONARY[domain]];
    }

    return result;
}

// left-operators, supfix/subfix:
// subscript
// sub-plus     super-plus
// sub-minus    super-minus
// sub-star     super-star
//              super-dagger
// over-bar     under-bar
// over-vector
// over-tilde
// over-hat
// over-dot
// overscript   underscript

// matchfix:
// angle-brack
// floor
// ceiling

// infix operators:
// ->   rule
// :>   rule-delayed
// ==   eq
// !=   ne
// https://reference.wolfram.com/language/tutorial/OperatorInputForms.html

const DEFAULT_LATEX_DICTIONARY: {
    [category in DictionaryCategory]?: LatexDictionary;
} = {
    algebra: DEFINITIONS_ALGEBRA,
    arithmetic: DEFINITIONS_ARITHMETIC,
    calculus: DEFINITIONS_CALCULUS,
    core: DEFINITIONS_CORE,
    inequalities: DEFINITIONS_INEQUALITIES,
    other: DEFINITIONS_OTHERS,
    physics: [
        {
            name: 'mu-0',
            trigger: { symbol: ['\\mu', '_', '0'] },
        },
    ],
    symbols: DEFINITIONS_SYMBOLS,
    trigonometry: DEFINITIONS_TRIGONOMETRY,
};

// {
//     const defaultDic = getDefaultLatexDictionary();
//     let i = 0;
//     for (const x of Object.keys(FUNCTIONS)) {
//         if (x.startsWith('\\') && !hasDef(defaultDic, x)) {
//             i++;
//             console.log(i + ' No def for function ' + x);
//         }
//     }
//     for (const x of Object.keys(MATH_SYMBOLS)) {
//         if (x.startsWith('\\') && !hasDef(defaultDic, x)) {
//             i++;
//             console.log(i + ' No def for symbol ' + x);
//         }
//     }
// }

// {
//     const defaultLatexDic = indexLatexDictionary(
//         getDefaultLatexDictionary('all'),
//         () => {
//             return;
//         }
//     );
//     const defaultDic = getDefaultDictionary('all');

//     let i = 0;
//     Array.from(defaultLatexDic.name.keys()).forEach((x) => {
//         if (!findInDictionary(defaultDic, x)) {
//             console.log(Number(i++).toString() + ' No entry for ' + x);
//         }
//     });
// }
