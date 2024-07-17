"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var atom_class_1 = require("../core/atom-class");
var accent_1 = require("../atoms/accent");
var overunder_1 = require("../atoms/overunder");
var definitions_utils_1 = require("./definitions-utils");
var box_1 = require("../core/box");
var ACCENTS = {
    acute: 0x02ca,
    grave: 0x02cb,
    dot: 0x02d9,
    ddot: 0x00a8,
    mathring: 0x02da,
    tilde: 0x007e,
    bar: 0x02c9,
    breve: 0x02d8,
    check: 0x02c7,
    hat: 0x005e,
    vec: 0x20d7
};
(0, definitions_utils_1.defineFunction)(Object.keys(ACCENTS), '{body:auto}', {
    createAtom: function (options) {
        return new accent_1.AccentAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), accentChar: ACCENTS[options.command.slice(1)] }));
    }
});
(0, definitions_utils_1.defineFunction)(['widehat', 'widecheck', 'widetilde'], '{body:auto}', {
    createAtom: function (options) {
        // Pick the correct SVG template based on the length of the body
        var baseString = (0, definitions_utils_1.parseArgAsString)((0, definitions_utils_1.argAtoms)(options.args[0]));
        return new accent_1.AccentAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), svgAccent: options.command.slice(1) +
                (baseString.length > 5
                    ? '4'
                    : ['1', '1', '2', '2', '3', '3'][baseString.length]) }));
    }
});
(0, definitions_utils_1.defineFunction)(['overarc', 'overparen', 'wideparen'], '{body:auto}', {
    createAtom: function (options) {
        return new accent_1.AccentAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), svgAccent: 'overarc' }));
    }
});
(0, definitions_utils_1.defineFunction)(['underarc', 'underparen'], '{body:auto}', {
    createAtom: function (options) {
        return new overunder_1.OverunderAtom(__assign(__assign({}, options), { body: (0, definitions_utils_1.argAtoms)(options.args[0]), svgBelow: 'underarc' }));
    }
});
(0, definitions_utils_1.defineFunction)('utilde', '{body:auto}', {
    createAtom: function (options) {
        var body = (0, definitions_utils_1.argAtoms)(options.args[0]);
        var baseString = (0, definitions_utils_1.parseArgAsString)(body);
        var accent = 'widetilde' +
            (baseString.length > 5
                ? '4'
                : ['1', '1', '2', '2', '3', '3'][baseString.length]);
        return new overunder_1.OverunderAtom(__assign(__assign({}, options), { body: body, svgBelow: accent, boxType: (0, box_1.atomsBoxType)(body) }));
    }
});
/*
 * From plain.tex
 *
 */
(0, definitions_utils_1.defineFunction)('^', '{:string}', {
    createAtom: function (options) {
        var _a;
        return new atom_class_1.Atom(__assign(__assign({}, options), { type: 'mord', isFunction: false, limits: 'adjacent', value: options.args[0]
                ? (_a = {
                    a: 'â',
                    e: 'ê',
                    i: 'î',
                    o: 'ô',
                    u: 'û',
                    A: 'Â',
                    E: 'Ê',
                    I: 'Î',
                    O: 'Ô',
                    U: 'Û'
                }[options.args[0]]) !== null && _a !== void 0 ? _a : '^'
                : '^' }));
    }
});
(0, definitions_utils_1.defineFunction)('`', '{:string}', {
    createAtom: function (options) {
        var _a;
        return new atom_class_1.Atom(__assign(__assign({}, options), { type: 'mord', isFunction: false, limits: 'adjacent', value: options.args[0]
                ? (_a = {
                    a: 'à',
                    e: 'è',
                    i: 'ì',
                    o: 'ò',
                    u: 'ù',
                    A: 'À',
                    E: 'È',
                    I: 'Ì',
                    O: 'Ò',
                    U: 'Ù'
                }[options.args[0]]) !== null && _a !== void 0 ? _a : '`'
                : '`' }));
    }
});
(0, definitions_utils_1.defineFunction)("'", '{:string}', {
    createAtom: function (options) {
        var _a;
        return new atom_class_1.Atom(__assign(__assign({}, options), { type: 'mord', isFunction: false, limits: 'adjacent', value: options.args[0]
                ? (_a = {
                    a: 'á',
                    e: 'é',
                    i: 'í',
                    o: 'ó',
                    u: 'ú',
                    A: 'Á',
                    E: 'É',
                    I: 'Í',
                    O: 'Ó',
                    U: 'Ú'
                }[options.args[0]]) !== null && _a !== void 0 ? _a : "'"
                : "'" }));
    }
});
(0, definitions_utils_1.defineFunction)('"', '{:string}', {
    createAtom: function (options) {
        var _a, _b;
        return new atom_class_1.Atom(__assign(__assign({}, options), { type: 'mord', isFunction: false, limits: 'adjacent', value: ((_a = options.args) === null || _a === void 0 ? void 0 : _a[0])
                ? (_b = {
                    a: 'ä',
                    e: 'ë',
                    i: 'ï',
                    o: 'ö',
                    u: 'ü',
                    A: 'Ä',
                    E: 'Ë',
                    I: 'Ë',
                    O: 'Ö',
                    U: 'Ü'
                }[options.args[0]]) !== null && _b !== void 0 ? _b : '"' + options.args[0]
                : '"' }));
    }
});
(0, definitions_utils_1.defineFunction)('.', '{:string}', {
    createAtom: function (options) {
        var _a, _b;
        return new atom_class_1.Atom(__assign(__assign({}, options), { type: 'mord', isFunction: false, limits: 'adjacent', value: ((_a = options.args) === null || _a === void 0 ? void 0 : _a[0])
                ? (_b = {
                    // a with single dot above
                    a: 'ȧ',
                    e: 'ė',
                    // i with single dot above (combining character)
                    i: '\u0307\u0069',
                    o: 'ȯ',
                    // U with single dot above (combining character)
                    u: '\u0307\u0075',
                    A: 'Ȧ',
                    E: 'Ė',
                    I: 'İ',
                    O: 'Ȯ',
                    // U with single dot above (combining character)
                    U: '\u0307\u0055'
                }[options.args[0]]) !== null && _b !== void 0 ? _b : '.' + options.args[0]
                : '.' }));
    }
});
(0, definitions_utils_1.defineFunction)('=', '{:string}', {
    createAtom: function (options) {
        var _a, _b;
        return new atom_class_1.Atom(__assign(__assign({}, options), { type: 'mord', isFunction: false, limits: 'adjacent', value: ((_a = options.args) === null || _a === void 0 ? void 0 : _a[0])
                ? (_b = {
                    // a with macron
                    a: 'ā',
                    e: 'ē',
                    i: 'ī',
                    o: 'ō',
                    u: 'ū',
                    A: 'Ā',
                    E: 'Ē',
                    I: 'Ī',
                    O: 'Ō',
                    U: 'Ū'
                }[options.args[0]]) !== null && _b !== void 0 ? _b : '=' + options.args[0]
                : '=' }));
    }
});
(0, definitions_utils_1.defineFunction)('~', '{:string}', {
    createAtom: function (options) {
        var _a;
        return new atom_class_1.Atom(__assign(__assign({ type: 'mord' }, options), { isFunction: false, limits: 'adjacent', value: options.args[0]
                ? (_a = { n: 'ñ', N: 'Ñ', a: 'ã', o: 'õ', A: 'Ã', O: 'Õ' }[options.args[0]]) !== null && _a !== void 0 ? _a : '\u00B4'
                : '\u00B4' }));
    }
});
(0, definitions_utils_1.defineFunction)('c', '{:string}', {
    createAtom: function (options) {
        var _a;
        return new atom_class_1.Atom(__assign(__assign({}, options), { type: 'mord', isFunction: false, limits: 'adjacent', value: options.args[0]
                ? (_a = { c: 'ç', C: 'Ç' }[options.args[0]]) !== null && _a !== void 0 ? _a : ''
                : '' }));
    }
});
