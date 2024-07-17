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
exports.atomToSpeakableText = void 0;
var atom_to_math_ml_1 = require("./atom-to-math-ml");
var types_1 = require("../common/types");
var capabilities_1 = require("../ui/utils/capabilities");
var definitions_utils_1 = require("../latex-commands/definitions-utils");
// Markup
// Two common flavor of markups: SSML and 'mac'. The latter is only available
// when using the native TTS synthesizer on Mac OS.
// Use SSML in the production rules below. The markup will either be striped
// off or replaced with the 'mac' markup as necessary.
//
// SSML                                             Mac
// ----                                             ----
// <emphasis>WORD</emphasis>                        [[emph +]]WORD
// <break time="150ms"/>                            [[slc 150]]
// <say-as interpret-as="character">A</say-as>      [[char LTRL] A [[char NORM]]
// https://developer.apple.com/library/content/documentation/UserExperience/Conceptual/SpeechSynthesisProgrammingGuide/FineTuning/FineTuning.html#//apple_ref/doc/uid/TP40004365-CH5-SW3
// https://pdfs.semanticscholar.org/8887/25b82b8dbb45dd4dd69b36a65f092864adb0.pdf
// "<audio src='non_existing_file.au'>File could not be played.</audio>"
// "I am now <prosody rate='+0.06'>speaking 6% faster.</prosody>"
var PRONUNCIATION = {
    '\\alpha': 'alpha ',
    '\\mu': 'mew ',
    '\\sigma': 'sigma ',
    '\\pi': 'pie ',
    '\\imaginaryI': 'imaginary eye ',
    '\\imaginaryJ': 'imaginary jay ',
    '\\sum': 'Summation ',
    '\\prod': 'Product ',
    '+': 'plus ',
    '-': 'minus ',
    ';': '<break time="150ms"/> semi-colon <break time="150ms"/>',
    ',': '<break time="150ms"/> comma  <break time="150ms"/>',
    '|': '<break time="150ms"/>Vertical bar<break time="150ms"/>',
    '(': '<break time="150ms"/>Open paren. <break time="150ms"/>',
    ')': '<break time="150ms"/> Close paren. <break time="150ms"/>',
    '=': 'equals ',
    '<': 'is less than ',
    '\\lt': 'is less than ',
    '<=': 'is less than or equal to ',
    '\\le': 'is less than or equal to ',
    '\\gt': 'is greater than ',
    '>': 'is greater than ',
    '\\pm': 'plus or minus',
    '\\mp': 'minus or plus',
    '\\ge': 'is greater than or equal to ',
    '\\geq': 'is greater than or equal to ',
    '\\leq': 'is less than or equal to ',
    '\\ne': 'is not equal to ',
    '\\neq': 'is not equal to ',
    '!': 'factorial ',
    '\\sin': 'sine ',
    '\\cos': 'cosine ',
    '\u200B': '',
    '\u2212': 'minus ',
    ':': '<break time="150ms"/> such that <break time="200ms"/> ',
    '\\colon': '<break time="150ms"/> such that <break time="200ms"/> ',
    '\\hbar': 'etch bar ',
    '\\iff': '<break time="200ms"/>if, and only if, <break time="200ms"/>',
    '\\Longleftrightarrow': '<break time="200ms"/>if, and only if, <break time="200ms"/>',
    '\\land': 'and ',
    '\\lor': 'or ',
    '\\neg': 'not ',
    '\\div': 'divided by ',
    '\\forall': 'for all ',
    '\\exists': 'there exists ',
    '\\nexists': 'there does not exists ',
    '\\in': 'element of ',
    '\\N': 'the set <break time="150ms"/><say-as interpret-as="character">n</say-as>',
    '\\C': 'the set <break time="150ms"/><say-as interpret-as="character">c</say-as>',
    '\\Z': 'the set <break time="150ms"/><say-as interpret-as="character">z</say-as>',
    '\\Q': 'the set <break time="150ms"/><say-as interpret-as="character">q</say-as>',
    '\\infty': 'infinity ',
    '\\nabla': 'nabla ',
    '\\partial': 'partial derivative of ',
    '\\cdot': 'times ',
    '\\cdots': 'dot dot dot ',
    '\\Rightarrow': 'implies ',
    '\\lparen': '<break time="150ms"/>open paren<break time="150ms"/>',
    '\\rparen': '<break time="150ms"/>close paren<break time="150ms"/>',
    '\\lbrace': '<break time="150ms"/>open brace<break time="150ms"/>',
    '\\{': '<break time="150ms"/>open brace<break time="150ms"/>',
    '\\rbrace': '<break time="150ms"/>close brace<break time="150ms"/>',
    '\\}': '<break time="150ms"/>close brace<break time="150ms"/>',
    '\\langle': '<break time="150ms"/>left angle bracket<break time="150ms"/>',
    '\\rangle': '<break time="150ms"/>right angle bracket<break time="150ms"/>',
    '\\lfloor': '<break time="150ms"/>open floor<break time="150ms"/>',
    '\\rfloor': '<break time="150ms"/>close floor<break time="150ms"/>',
    '\\lceil': '<break time="150ms"/>open ceiling<break time="150ms"/>',
    '\\rceil': '<break time="150ms"/>close ceiling<break time="150ms"/>',
    '\\vert': '<break time="150ms"/>vertical bar<break time="150ms"/>',
    '\\mvert': '<break time="150ms"/>divides<break time="150ms"/>',
    '\\lvert': '<break time="150ms"/>left vertical bar<break time="150ms"/>',
    '\\rvert': '<break time="150ms"/>right vertical bar<break time="150ms"/>',
    // '\\lbrack':		'left bracket',
    // '\\rbrack':		'right bracket',
    '\\lbrack': '<break time="150ms"/> open square bracket <break time="150ms"/>',
    '\\rbrack': '<break time="150ms"/> close square bracket <break time="150ms"/>',
    // Need to add code to detect singluar/plural. Until then spoken as plural since that is vastly more common
    // note: need to worry about intervening &InvisibleTimes;.
    // note: need to also do this when in numerator of fraction and number preceeds fraction
    // note: need to do this for <msup>
    'mm': 'millimeters',
    'cm': 'centimeters',
    'km': 'kilometers',
    'kg': 'kilograms'
};
var ENVIRONMENTS_NAMES = {
    'array': 'array',
    'matrix': 'matrix',
    'pmatrix': 'parenthesis matrix',
    'bmatrix': 'square brackets matrix',
    'Bmatrix': 'braces matrix',
    'vmatrix': 'bars matrix',
    'Vmatrix': 'double bars matrix',
    'matrix*': 'matrix',
    'smallmatrix': 'small matrix'
};
function getSpokenName(latex) {
    var result = '';
    if (latex.startsWith('\\'))
        result = ' ' + latex.replace('\\', '') + ' ';
    return result;
}
function isAtomic(atoms) {
    var count = 0;
    if ((0, types_1.isArray)(atoms))
        for (var _i = 0, atoms_1 = atoms; _i < atoms_1.length; _i++) {
            var atom = atoms_1[_i];
            if (atom.type !== 'first')
                count += 1;
        }
    return count === 1;
}
function atomicID(atoms) {
    if ((0, types_1.isArray)(atoms)) {
        for (var _i = 0, atoms_2 = atoms; _i < atoms_2.length; _i++) {
            var atom = atoms_2[_i];
            if (atom.type !== 'first' && atom.id)
                return atom.id.toString();
        }
    }
    return '';
}
function atomicValue(atoms) {
    var result = '';
    if ((0, types_1.isArray)(atoms)) {
        for (var _i = 0, atoms_3 = atoms; _i < atoms_3.length; _i++) {
            var atom = atoms_3[_i];
            if (atom.type !== 'first' && typeof atom.value === 'string')
                result += atom.value;
        }
    }
    return result;
}
function atomsAsText(atoms) {
    if (!atoms)
        return '';
    return atoms.map(function (atom) { return atom.value; }).join('');
}
function emph(s) {
    return "<emphasis>".concat(s, "</emphasis>");
}
function atomsToSpeakableFragment(mode, atom) {
    var _a;
    var result = '';
    var isInDigitRun = false; // Need to group sequence of digits
    var isInTextRun = false; // Need to group text
    for (var i = 0; i < atom.length; i++) {
        if (atom[i].type === 'first')
            continue;
        if (atom[i].mode !== 'text')
            isInTextRun = false;
        if (i < atom.length - 2 &&
            atom[i].type === 'mopen' &&
            atom[i + 2].type === 'mclose' &&
            atom[i + 1].type === 'mord') {
            result += ' of ';
            result += emph(atomToSpeakableFragment(mode, atom[i + 1]));
            i += 2;
        }
        else if (atom[i].mode === 'text') {
            if (isInTextRun)
                result += (_a = atom[i].value) !== null && _a !== void 0 ? _a : ' ';
            else {
                isInTextRun = true;
                result += atomToSpeakableFragment('text', atom[i]);
            }
            // '.' and ',' should only be allowed if prev/next entry is a digit
            // However, if that isn't the case, this still works because 'toSpeakableFragment' is called in either case.
            // Note: the first char in a digit/text run potentially needs to have a 'mark', hence the call to 'toSpeakableFragment'
        }
        else if (atom[i].isDigit()) {
            if (isInDigitRun)
                result += atom[i].asDigit();
            else {
                isInDigitRun = true;
                result += atomToSpeakableFragment(mode, atom[i]);
            }
        }
        else {
            isInDigitRun = false;
            result += atomToSpeakableFragment(mode, atom[i]);
        }
    }
    return result;
}
function atomToSpeakableFragment(mode, atom) {
    var _a, _b, _c, _d;
    function letter(c) {
        if (!globalThis.MathfieldElement.textToSpeechMarkup) {
            if (/[a-z]/.test(c))
                return " '" + c.toUpperCase() + "'";
            if (/[A-Z]/.test(c))
                return " 'capital " + c.toUpperCase() + "'";
            return c;
        }
        if (/[a-z]/.test(c))
            return " <say-as interpret-as=\"character\">".concat(c, "</say-as>");
        if (/[A-Z]/.test(c))
            return "capital <say-as interpret-as=\"character\">".concat(c.toLowerCase(), "</say-as>");
        return c;
    }
    if (!atom)
        return '';
    if ((0, types_1.isArray)(atom))
        return atomsToSpeakableFragment(mode, atom);
    var result = '';
    if (atom.id && mode === 'math')
        result += '<mark name="' + atom.id.toString() + '"/>';
    if (atom.mode === 'text')
        return result + atom.value;
    var numer = '';
    var denom = '';
    var body = '';
    var supsubHandled = false;
    var command = atom.command;
    switch (command) {
        case '\\vec':
            return 'vector ' + atomToSpeakableFragment(mode, atom.body);
        case '\\acute':
            return atomToSpeakableFragment(mode, atom.body) + ' acute';
        case '\\grave':
            return atomToSpeakableFragment(mode, atom.body) + ' grave';
        case '\\dot':
            return 'dot over' + atomToSpeakableFragment(mode, atom.body);
        case '\\ddot':
            return 'double dot over' + atomToSpeakableFragment(mode, atom.body);
        case '\\mathring':
            return 'ring over' + atomToSpeakableFragment(mode, atom.body);
        case '\\tilde':
        case '\\widetilde':
            return 'tilde over' + atomToSpeakableFragment(mode, atom.body);
        case '\\bar':
            return atomToSpeakableFragment(mode, atom.body) + ' bar';
        case '\\breve':
            return atomToSpeakableFragment(mode, atom.body) + ' breve';
        case '\\check':
        case '\\widecheck':
            return 'check over ' + atomToSpeakableFragment(mode, atom.body);
        case '\\hat':
        case '\\widehat':
            return 'hat over' + atomToSpeakableFragment(mode, atom.body);
        case '\\overarc':
        case '\\overparen':
        case '\\wideparen':
            return 'arc over ' + atomToSpeakableFragment(mode, atom.body);
        case '\\underarc':
        case '\\underparen':
            return 'arc under ' + atomToSpeakableFragment(mode, atom.body);
    }
    switch (atom.type) {
        case 'prompt':
            var input = atom.body.length > 1
                ? 'start input . <break time="500ms"/> ' +
                    atomToSpeakableFragment(mode, atom.body) +
                    '. <break time="500ms"/> end input'
                : 'blank';
            result +=
                ' <break time="300ms"/> ' +
                    input +
                    '. <break time="700ms"/>' +
                    ((_a = atom.correctness) !== null && _a !== void 0 ? _a : '') +
                    ' . <break time="700ms"/> ';
            break;
        case 'array':
            var array = atom.array;
            var environment = atom.environmentName;
            if (Object.keys(ENVIRONMENTS_NAMES).includes(environment)) {
                result += " begin ".concat(ENVIRONMENTS_NAMES[environment], " ");
                for (var i = 0; i < array.length; i++) {
                    if (i > 0)
                        result += ',';
                    result += " row ".concat(i + 1, " ");
                    for (var j = 0; j < array[i].length; j++) {
                        if (j > 0)
                            result += ',';
                        result += " column ".concat(j + 1, ": ");
                        result += atomToSpeakableFragment('math', array[i][j]);
                    }
                }
                result += " end ".concat(ENVIRONMENTS_NAMES[environment], " ");
            }
            // @todo add support for other array environments
            break;
        case 'group':
            if (command === '\\ne')
                result += ' not equal ';
            else if (command === '\\not') {
                result += ' not ';
                result += atomToSpeakableFragment('math', atom.body);
            }
            else {
                // @todo add support for other groups
                result += atomToSpeakableFragment('math', atom.body);
            }
            break;
        case 'root':
            result += atomToSpeakableFragment('math', atom.body);
            break;
        case 'genfrac':
            numer = atomToSpeakableFragment('math', atom.above);
            denom = atomToSpeakableFragment('math', atom.below);
            if (isAtomic(atom.above) && isAtomic(atom.below)) {
                var COMMON_FRACTIONS = {
                    '1/2': ' half ',
                    '1/3': ' one third ',
                    '2/3': ' two third',
                    '1/4': ' one quarter ',
                    '3/4': ' three quarter ',
                    '1/5': ' one fifth ',
                    '2/5': ' two fifths ',
                    '3/5': ' three fifths ',
                    '4/5': ' four fifths ',
                    '1/6': ' one sixth ',
                    '5/6': ' five sixths ',
                    '1/8': ' one eight ',
                    '3/8': ' three eights ',
                    '5/8': ' five eights ',
                    '7/8': ' seven eights ',
                    '1/9': ' one ninth ',
                    '2/9': ' two ninths ',
                    '4/9': ' four ninths ',
                    '5/9': ' five ninths ',
                    '7/9': ' seven ninths ',
                    '8/9': ' eight ninths '
                };
                var commonFraction = COMMON_FRACTIONS[atomicValue(atom.above) + '/' + atomicValue(atom.below)];
                if (commonFraction)
                    result = commonFraction;
                else
                    result += numer + ' over ' + denom;
            }
            else {
                result +=
                    ' the fraction <break time="150ms"/>' +
                        numer +
                        ' over <break time="150ms"/>' +
                        denom +
                        '.<break time="150ms"/> End fraction.<break time="150ms"/>';
            }
            break;
        case 'surd':
            body = atomToSpeakableFragment('math', atom.body);
            if (atom.hasEmptyBranch('above')) {
                result += isAtomic(atom.body)
                    ? ' the square root of ' + body + ' , '
                    : ' the square root of <break time="200ms"/>' +
                        body +
                        '. <break time="200ms"/> End square root';
            }
            else {
                var index = atomToSpeakableFragment('math', atom.above);
                index = index.trim();
                var index2 = index.replace(/<mark([^/]*)\/>/g, '');
                if (index2 === '3') {
                    result +=
                        ' the cube root of <break time="200ms"/>' +
                            body +
                            '. <break time="200ms"/> End cube root';
                }
                else if (index2 === 'n') {
                    result +=
                        ' the nth root of <break time="200ms"/>' +
                            body +
                            '. <break time="200ms"/> End root';
                }
                else {
                    result +=
                        ' the root with index: <break time="200ms"/>' +
                            index +
                            ', of <break time="200ms"/>' +
                            body +
                            '. <break time="200ms"/> End root';
                }
            }
            break;
        case 'leftright':
            {
                var delimAtom = atom;
                result +=
                    (_b = (delimAtom.leftDelim
                        ? PRONUNCIATION[delimAtom.leftDelim]
                        : undefined)) !== null && _b !== void 0 ? _b : delimAtom.leftDelim;
                result += atomToSpeakableFragment('math', atom.body);
                result +=
                    (_c = (delimAtom.rightDelim
                        ? PRONUNCIATION[delimAtom.rightDelim]
                        : undefined)) !== null && _c !== void 0 ? _c : delimAtom.rightDelim;
            }
            break;
        case 'rule':
            // @todo
            break;
        case 'overunder':
            // @todo
            break;
        case 'overlap':
            // @todo
            break;
        case 'macro':
            // @todo implement custom speech for macros
            // Workaround: if the macro is expand = true, speak the atom body, otherwise speak the macro name
            var macroName = command.replace(/^\\/g, '');
            var macro = (0, definitions_utils_1.getMacros)()[macroName];
            if (macro) {
                if (macro === null || macro === void 0 ? void 0 : macro.expand)
                    result += atomToSpeakableFragment('math', atom.body);
                else
                    result += "".concat(macroName, " ");
            }
            break;
        case 'placeholder':
            result += 'placeholder ';
            break;
        case 'delim':
        case 'sizeddelim':
        case 'mord':
        case 'minner':
        case 'mbin':
        case 'mrel':
        case 'mpunct':
        case 'mopen':
        case 'mclose': {
            if (command === '\\mathbin' ||
                command === '\\mathrel' ||
                command === '\\mathopen' ||
                command === '\\mathclose' ||
                command === '\\mathpunct' ||
                command === '\\mathord' ||
                command === '\\mathinner') {
                result = atomToSpeakableFragment(mode, atom.body);
                break;
            }
            var atomValue = atom.isDigit() ? atom.asDigit() : atom.value;
            var latexValue = atom.command;
            if (atom.type === 'delim' || atom.type === 'sizeddelim') {
                latexValue = atom.value;
                atomValue = latexValue;
            }
            if (mode === 'text')
                result += atomValue;
            else {
                if (atom.type === 'mbin')
                    result += '<break time="150ms"/>';
                if (atomValue) {
                    var value = PRONUNCIATION[atomValue] ||
                        (latexValue ? PRONUNCIATION[latexValue.trim()] : '');
                    if (value)
                        result += ' ' + value;
                    else {
                        var spokenName = latexValue
                            ? getSpokenName(latexValue.trim())
                            : '';
                        result += spokenName ? spokenName : letter(atomValue);
                    }
                }
                else
                    result += atomToSpeakableFragment('math', atom.body);
                if (atom.type === 'mbin')
                    result += '<break time="150ms"/>';
            }
            break;
        }
        case 'mop':
        case 'operator':
        case 'extensible-symbol':
            // @todo
            if (atom.value !== '\u200B') {
                // Not ZERO-WIDTH
                var trimLatex = atom.command;
                if (trimLatex === '\\sum') {
                    if (!atom.hasEmptyBranch('superscript') &&
                        !atom.hasEmptyBranch('subscript')) {
                        var sup = atomToSpeakableFragment('math', atom.superscript);
                        sup = sup.trim();
                        var sub = atomToSpeakableFragment('math', atom.subscript);
                        sub = sub.trim();
                        result +=
                            ' the summation from <break time="200ms"/>' +
                                sub +
                                '<break time="200ms"/> to  <break time="200ms"/>' +
                                sup +
                                '<break time="200ms"/> of <break time="150ms"/>';
                        supsubHandled = true;
                    }
                    else if (!atom.hasEmptyBranch('subscript')) {
                        var sub = atomToSpeakableFragment('math', atom.subscript);
                        sub = sub.trim();
                        result +=
                            ' the summation from <break time="200ms"/>' +
                                sub +
                                '<break time="200ms"/> of <break time="150ms"/>';
                        supsubHandled = true;
                    }
                    else
                        result += ' the summation of';
                }
                else if (trimLatex === '\\prod') {
                    if (!atom.hasEmptyBranch('superscript') &&
                        !atom.hasEmptyBranch('subscript')) {
                        var sup = atomToSpeakableFragment('math', atom.superscript);
                        sup = sup.trim();
                        var sub = atomToSpeakableFragment('math', atom.subscript);
                        sub = sub.trim();
                        result +=
                            ' the product from <break time="200ms"/>' +
                                sub +
                                '<break time="200ms"/> to <break time="200ms"/>' +
                                sup +
                                '<break time="200ms"/> of <break time="150ms"/>';
                        supsubHandled = true;
                    }
                    else if (!atom.hasEmptyBranch('subscript')) {
                        var sub = atomToSpeakableFragment('math', atom.subscript);
                        sub = sub.trim();
                        result +=
                            ' the product from <break time="200ms"/>' +
                                sub +
                                '<break time="200ms"/> of <break time="150ms"/>';
                        supsubHandled = true;
                    }
                    else
                        result += ' the product  of ';
                }
                else if (trimLatex === '\\int') {
                    if (!atom.hasEmptyBranch('superscript') &&
                        !atom.hasEmptyBranch('subscript')) {
                        var sup = atomToSpeakableFragment('math', atom.superscript);
                        sup = sup.trim();
                        var sub = atomToSpeakableFragment('math', atom.subscript);
                        sub = sub.trim();
                        result +=
                            ' the integral from <break time="200ms"/>' +
                                emph(sub) +
                                '<break time="200ms"/> to <break time="200ms"/>' +
                                emph(sup) +
                                ' <break time="200ms"/> of ';
                        supsubHandled = true;
                    }
                    else
                        result += ' the integral of <break time="200ms"/> ';
                }
                else if (trimLatex === '\\operatorname' ||
                    trimLatex === '\\operatorname*')
                    result += atomsAsText(atom.body) + ' ';
                else if (typeof atom.value === 'string') {
                    var value = (_d = PRONUNCIATION[atom.value]) !== null && _d !== void 0 ? _d : (atom.command ? PRONUNCIATION[atom.command] : undefined);
                    result += value ? value : ' ' + atom.value;
                }
                else if (atom.command) {
                    if (atom.command === '\\mathop')
                        result += atomToSpeakableFragment('math', atom.body);
                    else {
                        result += atom.command.startsWith('\\')
                            ? ' ' + atom.command.slice(1)
                            : ' ' + atom.command;
                    }
                }
            }
            break;
        case 'enclose':
            body = atomToSpeakableFragment('math', atom.body);
            result += ' crossed out ' + body + '. End crossed out.';
            break;
        case 'space':
        case 'spacing':
            // @todo
            break;
    }
    if (!supsubHandled && !atom.hasEmptyBranch('superscript')) {
        var sup = atomToSpeakableFragment(mode, atom.superscript);
        sup = sup.trim();
        var sup2 = sup.replace(/<[^>]*>/g, '');
        if (isAtomic(atom.superscript)) {
            if (mode === 'math') {
                var id = atomicID(atom.superscript);
                if (id)
                    result += '<mark name="' + id + '"/>';
            }
            if (sup2 === '\u2032')
                result += ' prime ';
            else if (sup2 === '2')
                result += ' squared ';
            else if (sup2 === '3')
                result += ' cubed ';
            else if (Number.isNaN(Number.parseInt(sup2)))
                result += ' to the ' + sup + '; ';
            else {
                result +=
                    ' to the <say-as interpret-as="ordinal">' +
                        sup2 +
                        '</say-as> power; ';
            }
        }
        else if (Number.isNaN(Number.parseInt(sup2)))
            result += ' raised to the ' + sup + '; ';
        else {
            result +=
                ' raised to the <say-as interpret-as="ordinal">' +
                    sup2 +
                    '</say-as> power; ';
        }
    }
    if (!supsubHandled && !atom.hasEmptyBranch('subscript')) {
        var sub = atomToSpeakableFragment('math', atom.subscript);
        sub = sub.trim();
        result += isAtomic(atom.subscript)
            ? ' sub ' + sub
            : ' subscript ' + sub + '. End subscript. ';
    }
    return result;
}
/**
 * @param  atoms The atoms to represent as speakable text.
 */
function atomToSpeakableText(atoms) {
    var _a, _b;
    var mfe = globalThis.MathfieldElement;
    if (mfe.textToSpeechRules === 'sre' && ('sre' in window || 'SRE' in window)) {
        var mathML = (0, atom_to_math_ml_1.toMathML)(atoms);
        if (mathML) {
            if (mfe.textToSpeechMarkup) {
                mfe.textToSpeechRulesOptions = (_a = mfe.textToSpeechRulesOptions) !== null && _a !== void 0 ? _a : {};
                mfe.textToSpeechRulesOptions = __assign(__assign({}, mfe.textToSpeechRulesOptions), { markup: mfe.textToSpeechMarkup });
                if (mfe.textToSpeechRulesOptions.markup === 'ssml') {
                    mfe.textToSpeechRulesOptions = __assign(__assign({}, mfe.textToSpeechRulesOptions), { markup: 'ssml_step' });
                }
                mfe.textToSpeechRulesOptions = __assign(__assign({}, mfe.textToSpeechRulesOptions), { rate: mfe.speechEngineRate });
            }
            var SRE = (_b = window['SRE']) !== null && _b !== void 0 ? _b : globalThis.sre.System.getInstance();
            if (mfe.textToSpeechRulesOptions)
                SRE.setupEngine(mfe.textToSpeechRulesOptions);
            var result_1 = '';
            try {
                result_1 = SRE.toSpeech(mathML);
            }
            catch (e) {
                console.error("MathLive {{SDK_VERSION}}: `SRE.toSpeech()` runtime error", e);
            }
            return result_1;
        }
        return '';
    }
    var result = atomToSpeakableFragment('math', atoms);
    if (mfe.textToSpeechMarkup === 'ssml') {
        var prosody = '';
        if (mfe.speechEngineRate)
            prosody = '<prosody rate="' + mfe.speechEngineRate + '">';
        result =
            "<?xml version=\"1.0\"?><speak version=\"1.1\" xmlns=\"http://www.w3.org/2001/10/synthesis\" xml:lang=\"en-US\">" +
                '<amazon:auto-breaths>' +
                prosody +
                '<p><s>' +
                result +
                '</s></p>' +
                (prosody ? '</prosody>' : '') +
                '</amazon:auto-breaths>' +
                '</speak>';
    }
    else if (mfe.textToSpeechMarkup === 'mac' && (0, capabilities_1.osPlatform)() === 'macos') {
        // Convert SSML to Mac markup
        result = result
            .replace(/<mark([^/]*)\/>/g, '')
            .replace(/<emphasis>/g, '[[emph+]]')
            .replace(/<\/emphasis>/g, '')
            .replace(/<break time="(\d*)ms"\/>/g, '[[slc $1]]')
            .replace(/<say-as[^>]*>/g, '')
            .replace(/<\/say-as>/g, '');
    }
    else {
        // If no markup was requested, or 'mac' markup, but we're not on a mac,
        // remove any that we may have
        // Strip out the SSML markup
        result = result.replace(/<[^>]*>/g, '').replace(/\s{2,}/g, ' ');
    }
    return result;
}
exports.atomToSpeakableText = atomToSpeakableText;
