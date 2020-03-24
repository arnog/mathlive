import { defineFunction, parseArgAsString } from './definitions-utils.js';

const ACCENTS = {
    acute: '\u02ca',
    grave: '\u02cb',
    dot: '\u02d9',
    ddot: '\u00a8',
    mathring: '\u02da',
    tilde: '\u007e',
    bar: '\u02c9',
    breve: '\u02d8',
    check: '\u02c7',
    hat: '\u005e',
    vec: '\u20d7',
};
defineFunction(Object.keys(ACCENTS), '{body:auto}', null, function (
    name,
    args
) {
    return {
        type: 'accent',
        accent: ACCENTS[name.slice(1)],
        limits: 'accent', // This will suppress the regular
        // supsub attachment and will delegate
        // it to the decomposeAccent
        // (any non-null value would do)
        skipBoundary: true,
        body: args[0],
    };
});

defineFunction(
    ['widehat', 'widecheck', 'widetilde'],
    '{body:auto}',
    null,
    (name, args) => {
        const baseString = parseArgAsString(args[0]);
        const accent =
            name.slice(1) +
            (baseString.length > 5
                ? '4'
                : ['1', '1', '2', '2', '3', '3'][baseString.length]);
        return {
            type: 'accent',
            svgAccent: accent,
            limits: 'accent', // This will suppress the regular
            // supsub attachment and will delegate
            // it to the decomposeAccent
            // (any non-null value would do)
            skipBoundary: true,
            body: args[0],
        };
    }
);

defineFunction(
    'utilde',
    '{body:auto}',
    null,
    (_name, args) => {
        const baseString = parseArgAsString(args[0]);
        const accent =
            'widetilde' +
            (baseString.length > 5
                ? '4'
                : ['1', '1', '2', '2', '3', '3'][baseString.length]);

        return {
            type: 'overunder',

            body: args[0],
            svgBelow: accent,

            skipBoundary: true,
        };
    },
    (_name, _parent, atom, emit) => `\\utilde{${emit(atom, atom.body)}}`
);

/*
 * From plain.tex
 *
 */

defineFunction('^', '{:string}', {}, function (name, args) {
    return {
        type: 'mord',
        limits: 'nolimits',
        symbol: true,
        isFunction: false,
        body: args[0]
            ? {
                  a: 'â',
                  e: 'ê',
                  i: 'î',
                  o: 'ô',
                  u: 'û',
                  A: 'Â',
                  E: 'Ê',
                  I: 'Î',
                  O: 'Ô',
                  U: 'Û',
              }[args[0]] || '^'
            : '^',
        baseFontFamily: 'cmr',
    };
});

defineFunction('`', '{:string}', {}, function (name, args) {
    return {
        type: 'mord',
        limits: 'nolimits',
        symbol: true,
        isFunction: false,
        body: args[0]
            ? {
                  a: 'à',
                  e: 'è',
                  i: 'ì',
                  o: 'ò',
                  u: 'ù',
                  A: 'À',
                  E: 'È',
                  I: 'Ì',
                  O: 'Ò',
                  U: 'Ù',
              }[args[0]] || '`'
            : '`',
        baseFontFamily: 'cmr',
    };
});

defineFunction("'", '{:string}', {}, function (name, args) {
    return {
        type: 'mord',
        limits: 'nolimits',
        symbol: true,
        isFunction: false,
        body: args[0]
            ? {
                  a: 'á',
                  e: 'é',
                  i: 'í',
                  o: 'ó',
                  u: 'ú',
                  A: 'Á',
                  E: 'É',
                  I: 'Í',
                  O: 'Ó',
                  U: 'Ú',
              }[args[0]] || '\u005e'
            : '\u005e',
        baseFontFamily: 'cmr',
    };
});

defineFunction('~', '{:string}', {}, function (name, args) {
    return {
        type: 'mord',
        limits: 'nolimits',
        symbol: true,
        isFunction: false,
        body: args[0]
            ? { n: 'ñ', N: 'Ñ', a: 'ã', o: 'õ', A: 'Ã', O: 'Õ' }[args[0]] ||
              '\u00B4'
            : '\u00B4',
        baseFontFamily: 'cmr',
    };
});

defineFunction('c', '{:string}', {}, function (name, args) {
    return {
        type: 'mord',
        limits: 'nolimits',
        symbol: true,
        isFunction: false,
        body: args[0] ? { c: 'ç', C: 'Ç' }[args[0]] || '' : '',
        baseFontFamily: 'cmr',
    };
});
