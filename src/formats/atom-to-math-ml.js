"use strict";
exports.__esModule = true;
exports.toMathML = void 0;
var atom_class_1 = require("../core/atom-class");
var unicode_1 = require("../core/unicode");
var APPLY_FUNCTION = '<mo>&#x2061;</mo>';
var INVISIBLE_TIMES = '<mo>&#8290;</mo>';
function xmlEscape(string) {
    return (string
        // .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;'));
}
function makeID(id, options) {
    if (!id || !options.generateID)
        return '';
    // Note: the 'extid' attribute is recognized by SRE as an attribute
    // to be passed to SSML as a <mark> tag.
    return " extid=\"".concat(id, "\"");
}
function scanIdentifier(stream, final, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var result = false;
    final = final !== null && final !== void 0 ? final : stream.atoms.length;
    var mathML = '';
    var body = '';
    var atom = stream.atoms[stream.index];
    var variant = (_a = atom.style) === null || _a === void 0 ? void 0 : _a.variant;
    var variantStyle = (_b = atom.style) === null || _b === void 0 ? void 0 : _b.variantStyle;
    var variantProp = '';
    if (atom.value && (variant || variantStyle)) {
        var unicodeVariant = (_c = (0, unicode_1.mathVariantToUnicode)(atom.value, variant, variantStyle)) !== null && _c !== void 0 ? _c : atom.value;
        if (unicodeVariant !== atom.value) {
            stream.index += 1;
            mathML = "<mi".concat(makeID(atom.id, options), ">").concat(unicodeVariant, "</mi>");
            if (!parseSubsup(mathML, stream, options)) {
                stream.mathML += mathML;
                stream.lastType = 'mi';
            }
            return true;
        }
        variantProp =
            (_d = {
                'upnormal': 'normal',
                'boldnormal': 'bold',
                'italicmain': 'italic',
                'bolditalicmain': 'bold-italic',
                'updouble-struck': 'double-struck',
                'double-struck': 'double-struck',
                'boldfraktur': 'bold-fraktur',
                'calligraphic': 'script',
                'upcalligraphic': 'script',
                'script': 'script',
                'boldscript': 'bold-script',
                'boldcalligraphic': 'bold-script',
                'fraktur': 'fraktur',
                'upsans-serif': 'sans-serif',
                'boldsans-serif': 'bold-sans-serif',
                'italicsans-serif': 'sans-serif-italic',
                'bolditalicsans-serif': 'sans-serif-bold-italic',
                'monospace': 'monospace'
            }[(variantStyle !== null && variantStyle !== void 0 ? variantStyle : '') + (variant !== null && variant !== void 0 ? variant : '')]) !== null && _d !== void 0 ? _d : '';
        if (variantProp)
            variantProp = " mathvariant=\"".concat(variantProp, "\"");
    }
    var SPECIAL_IDENTIFIERS = {
        '\\exponentialE': '&#x02147;',
        '\\imaginaryI': '&#x2148;',
        '\\differentialD': '&#x2146;',
        '\\capitalDifferentialD': '&#x2145;',
        '\\alpha': '&#x03b1;',
        '\\pi': '&#x03c0;',
        '\\infty': '&#x221e;',
        '\\forall': '&#x2200;',
        '\\nexists': '&#x2204;',
        '\\exists': '&#x2203;',
        '\\hbar': '\u210F',
        '\\cdotp': '\u22C5',
        '\\ldots': '\u2026',
        '\\cdots': '\u22EF',
        '\\ddots': '\u22F1',
        '\\vdots': '\u22EE',
        '\\ldotp': '\u002E'
    };
    if (atom.command === '!') {
        stream.index += 1;
        mathML = '<mo>!</mo>';
        if (!parseSubsup(mathML, stream, options)) {
            stream.mathML += mathML;
            stream.lastType = 'mo';
        }
        return true;
    }
    if (SPECIAL_IDENTIFIERS[atom.command]) {
        stream.index += 1;
        var mathML_1 = "<mi".concat(makeID(atom.id, options)).concat(variantProp, ">").concat(SPECIAL_IDENTIFIERS[atom.command], "</mi>");
        if (stream.lastType === 'mi' ||
            stream.lastType === 'mn' ||
            stream.lastType === 'mtext' ||
            stream.lastType === 'fence')
            mathML_1 = INVISIBLE_TIMES + mathML_1;
        if (!parseSubsup(mathML_1, stream, options)) {
            stream.mathML += mathML_1;
            stream.lastType = 'mi';
        }
        return true;
    }
    if (atom.command === '\\operatorname') {
        body = toString(atom.body);
        stream.index += 1;
    }
    else {
        if (variant || variantStyle) {
            while (stream.index < final &&
                (atom.type === 'mord' || atom.type === 'macro') &&
                !atom.isDigit() &&
                variant === ((_f = (_e = atom.style) === null || _e === void 0 ? void 0 : _e.variant) !== null && _f !== void 0 ? _f : '') &&
                variantStyle === ((_h = (_g = atom.style) === null || _g === void 0 ? void 0 : _g.variantStyle) !== null && _h !== void 0 ? _h : '')) {
                body += toString([atom]);
                stream.index += 1;
                atom = stream.atoms[stream.index];
            }
        }
        else if ((atom.type === 'mord' || atom.type === 'macro') &&
            !atom.isDigit()) {
            body += toString([atom]);
            stream.index += 1;
        }
    }
    if (body.length > 0) {
        result = true;
        mathML = "<mi".concat(variantProp, ">").concat(body, "</mi>");
        var lastType = stream.lastType;
        if (mathML.endsWith('>f</mi>') || mathML.endsWith('>g</mi>')) {
            mathML += APPLY_FUNCTION;
            stream.lastType = 'applyfunction';
        }
        else
            stream.lastType = /^<mo>(.*)<\/mo>$/.test(mathML) ? 'mo' : 'mi';
        if (!parseSubsup(mathML, stream, options)) {
            if (lastType === 'mi' ||
                lastType === 'mn' ||
                lastType === 'mtext' ||
                lastType === 'fence')
                mathML = INVISIBLE_TIMES + mathML;
            stream.mathML += mathML;
        }
    }
    return result;
}
/**
 * Return true if the current atom is a standalone superscript atom
 * i.e. an atom with no content, except of a superscript.
 * Superscripts can be encoded either as an attribute on the last atom
 * or as a standalone, empty, atom following the one to which it applies.
 * @param {object} stream
 */
function isSuperscriptAtom(stream) {
    return (stream.index < stream.atoms.length &&
        stream.atoms[stream.index].superscript &&
        stream.atoms[stream.index].type === 'subsup');
}
function indexOfSuperscriptInNumber(stream) {
    var result = -1;
    var i = stream.index;
    var done = false;
    var found = false;
    while (i < stream.atoms.length && !done && !found) {
        var atom = stream.atoms[i];
        done = !atom.isDigit();
        found = !done && atom.superscript !== undefined;
        i++;
    }
    if (found)
        result = i - 1;
    return result;
}
function parseSubsup(base, stream, options) {
    var _a;
    var atom = stream.atoms[stream.index - 1];
    if (!atom)
        return false;
    if (!atom.superscript && !atom.subscript) {
        if (((_a = stream.atoms[stream.index]) === null || _a === void 0 ? void 0 : _a.type) === 'subsup') {
            atom = stream.atoms[stream.index];
            stream.index += 1;
        }
        else
            return false;
    }
    var lastType = stream.lastType;
    stream.lastType = '';
    var superscript = toMathML(atom.superscript, options);
    stream.lastType = '';
    var subscript = toMathML(atom.subscript, options);
    stream.lastType = lastType;
    if (!superscript && !subscript)
        return false;
    var mathML = '';
    if (superscript && subscript)
        mathML = "<msubsup>".concat(base).concat(subscript).concat(superscript, "</msubsup>");
    else if (superscript)
        mathML = "<msup>".concat(base).concat(superscript, "</msup>");
    else if (subscript)
        mathML = "<msub>".concat(base).concat(subscript, "</msub>");
    stream.mathML += mathML;
    stream.lastType = '';
    return true;
}
function scanText(stream, final, options) {
    final = final !== null && final !== void 0 ? final : stream.atoms.length;
    var initial = stream.index;
    var mathML = '';
    var superscript = indexOfSuperscriptInNumber(stream);
    if (superscript >= 0 && superscript < final)
        final = superscript;
    while (stream.index < final && stream.atoms[stream.index].mode === 'text') {
        mathML += stream.atoms[stream.index].value
            ? stream.atoms[stream.index].value
            : ' ';
        stream.index += 1;
    }
    if (mathML.length > 0) {
        mathML = "<mtext ".concat(makeID(stream.atoms[initial].id, options), ">").concat(mathML, "</mtext>");
        if (superscript < 0 && isSuperscriptAtom(stream)) {
            superscript = stream.index;
            stream.index += 1;
        }
        if (!parseSubsup(mathML, stream, options)) {
            stream.mathML += mathML;
            stream.lastType = 'mtext';
        }
        return true;
    }
    return false;
}
function scanNumber(stream, final, options) {
    final = final !== null && final !== void 0 ? final : stream.atoms.length;
    var initial = stream.index;
    var mathML = '';
    var superscript = indexOfSuperscriptInNumber(stream);
    if (superscript >= 0 && superscript < final)
        final = superscript;
    while (stream.index < final && stream.atoms[stream.index].isDigit()) {
        mathML += stream.atoms[stream.index].asDigit();
        stream.index += 1;
    }
    if (mathML.length <= 0)
        return false;
    mathML =
        '<mn' + makeID(stream.atoms[initial].id, options) + '>' + mathML + '</mn>';
    if (superscript < 0 && isSuperscriptAtom(stream)) {
        superscript = stream.index;
        stream.index += 1;
    }
    if (!parseSubsup(mathML, stream, options)) {
        stream.mathML += mathML;
        stream.lastType = 'mn';
    }
    return true;
}
function scanFence(stream, final, options) {
    var result = false;
    final = final !== null && final !== void 0 ? final : stream.atoms.length;
    var mathML = '';
    var lastType = '';
    if (stream.index < final && stream.atoms[stream.index].type === 'mopen') {
        var found = false;
        var depth = 0;
        var openIndex = stream.index;
        var closeIndex = -1;
        var index = openIndex + 1;
        while (index < final && !found) {
            if (stream.atoms[index].type === 'mopen')
                depth += 1;
            else if (stream.atoms[index].type === 'mclose')
                depth -= 1;
            if (depth === -1) {
                found = true;
                closeIndex = index;
            }
            index += 1;
        }
        if (found) {
            mathML = '<mrow>';
            mathML += toMo(stream.atoms[openIndex], options);
            mathML += toMathML(stream.atoms, options, openIndex + 1, closeIndex);
            mathML += toMo(stream.atoms[closeIndex], options);
            mathML += '</mrow>';
            stream.index = closeIndex + 1;
            if (stream.lastType === 'mi' ||
                stream.lastType === 'mn' ||
                stream.lastType === 'mfrac' ||
                stream.lastType === 'fence')
                stream.mathML += INVISIBLE_TIMES;
            if (parseSubsup(mathML, stream, options)) {
                result = true;
                stream.lastType = '';
                mathML = '';
            }
            lastType = 'fence';
        }
    }
    if (mathML.length > 0) {
        result = true;
        stream.mathML += mathML;
        stream.lastType = lastType;
    }
    return result;
}
function scanOperator(stream, final, options) {
    var result = false;
    final = final !== null && final !== void 0 ? final : stream.atoms.length;
    var mathML = '';
    var lastType = '';
    var atom = stream.atoms[stream.index];
    if (!atom)
        return false;
    var SPECIAL_OPERATORS = {
        '\\ne': '&ne;',
        '\\neq': '&ne;',
        '\\pm': '&#177;',
        '\\times': '&#215;',
        '\\colon': ':',
        '\\vert': '|',
        '\\Vert': '\u2225',
        '\\mid': '\u2223',
        '\\{': '{',
        '\\}': '}',
        '\\lbrace': '{',
        '\\rbrace': '}',
        '\\lbrack': '[',
        '\\rbrack': ']',
        '\\lparen': '(',
        '\\rparen': ')',
        '\\langle': '\u27E8',
        '\\rangle': '\u27E9',
        '\\lfloor': '\u230A',
        '\\rfloor': '\u230B',
        '\\lceil': '\u2308',
        '\\rceil': '\u2309'
    };
    if (SPECIAL_OPERATORS[atom.command]) {
        stream.index += 1;
        var mathML_2 = "<mo".concat(makeID(atom.id, options), ">").concat(SPECIAL_OPERATORS[atom.command], "</mo>");
        if (!parseSubsup(mathML_2, stream, options)) {
            stream.mathML += mathML_2;
            stream.lastType = 'mo';
        }
        return true;
    }
    if (stream.index < final && (atom.type === 'mbin' || atom.type === 'mrel')) {
        mathML += atomToMathML(stream.atoms[stream.index], options);
        stream.index += 1;
        lastType = 'mo';
    }
    else if (stream.index < final &&
        (atom.type === 'mop' ||
            atom.type === 'operator' ||
            atom.type === 'extensible-symbol')) {
        // MathML += '<mrow>';
        if (atom.subsupPlacement === 'over-under' &&
            (atom.superscript || atom.subscript)) {
            // Operator with limits, e.g. \sum
            var op = toMo(atom, options);
            if (atom.superscript && atom.subscript) {
                // Both superscript and subscript
                mathML += '<munderover>' + op;
                mathML += toMathML(atom.subscript, options);
                mathML += toMathML(atom.superscript, options);
                mathML += '</munderover>';
            }
            else if (atom.superscript) {
                // Superscript only
                mathML += '<mover>' + op;
                mathML += toMathML(atom.superscript, options);
                mathML += '</mover>';
            }
            else if (atom.subscript) {
                // Subscript only
                mathML += '<munder>' + op;
                mathML += toMathML(atom.subscript, options);
                mathML += '</munder>';
            }
            stream.mathML += mathML;
            stream.lastType = 'mo';
            stream.index += 1;
            return true;
        }
        {
            var atom_1 = stream.atoms[stream.index];
            var isUnit = atom_1.value === '\\operatorname';
            var op = isUnit
                ? '<mi class="MathML-Unit"' +
                    makeID(atom_1.id, options) +
                    '>' +
                    toString(atom_1.value) +
                    '</mi>'
                : toMo(atom_1, options);
            mathML += op;
            if (!isUnit && !/^<mo>(.*)<\/mo>$/.test(op)) {
                mathML += APPLY_FUNCTION;
                // mathML += scanArgument(stream);
                lastType = 'applyfunction';
            }
            else
                lastType = isUnit ? 'mi' : 'mo';
        }
        if ((stream.lastType === 'mi' || stream.lastType === 'mn') &&
            !/^<mo>(.*)<\/mo>$/.test(mathML))
            mathML = INVISIBLE_TIMES + mathML;
        stream.index += 1;
    }
    if (mathML.length > 0) {
        result = true;
        if (!parseSubsup(mathML, stream, options)) {
            stream.mathML += mathML;
            stream.lastType = lastType;
        }
    }
    return result;
}
/**
 * Given an atom or an array of atoms, return their MathML representation as
 * a string.
 * @param {string|Atom|Atom[]} input
 * @param initial index of the input to start conversion from
 * @param final last index of the input to stop conversion to
 */
function toMathML(input, options, initial, final) {
    options !== null && options !== void 0 ? options : (options = {});
    var result = {
        atoms: [],
        index: initial !== null && initial !== void 0 ? initial : 0,
        mathML: '',
        lastType: ''
    };
    if (typeof input === 'number' || typeof input === 'boolean')
        result.mathML = input.toString();
    else if (typeof input === 'string')
        result.mathML = input;
    else if (input instanceof atom_class_1.Atom)
        result.mathML = atomToMathML(input, options);
    else if (Array.isArray(input)) {
        result.atoms = input;
        var count = 0;
        final = final ? final : input ? input.length : 0;
        while (result.index < final) {
            if (scanText(result, final, options) ||
                scanNumber(result, final, options) ||
                scanIdentifier(result, final, options) ||
                scanOperator(result, final, options) ||
                scanFence(result, final, options))
                count += 1;
            else if (result.index < final) {
                var mathML = atomToMathML(result.atoms[result.index], options);
                if (result.lastType === 'mn' &&
                    mathML.length > 0 &&
                    result.atoms[result.index].type === 'genfrac') {
                    // If this is a fraction preceded by a number (e.g. 2 1/2),
                    // add an "invisible plus" (U+0264) character in front of it
                    mathML = '<mo>&#x2064;</mo>' + mathML;
                }
                if (result.atoms[result.index].type === 'genfrac')
                    result.lastType = 'mfrac';
                else
                    result.lastType = '';
                result.index += 1;
                if (parseSubsup(mathML, result, options))
                    count += 1;
                else {
                    if (mathML.length > 0) {
                        result.mathML += mathML;
                        count += 1;
                    }
                }
            }
        }
        // If there are more than a single element, wrap them in a mrow tag.
        if (count > 1)
            result.mathML = '<mrow>' + result.mathML + '</mrow>';
    }
    return result.mathML;
}
exports.toMathML = toMathML;
function toMo(atom, options) {
    var result = '';
    var body = toString(atom.value);
    if (body)
        result = '<mo' + makeID(atom.id, options) + '>' + body + '</mo>';
    return result;
}
function toString(atoms) {
    if (!atoms)
        return '';
    if (typeof atoms === 'string')
        return xmlEscape(atoms);
    if (!Array.isArray(atoms) && typeof atoms.body === 'string')
        return xmlEscape(atoms.body);
    var result = '';
    for (var _i = 0, atoms_1 = atoms; _i < atoms_1.length; _i++) {
        var atom = atoms_1[_i];
        if (typeof atom.value === 'string')
            result += atom.value;
    }
    return xmlEscape(result);
}
/**
 * Return a MathML fragment representation of a single atom
 *
 */
function atomToMathML(atom, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
    if (atom.mode === 'text')
        return "<mi".concat(makeID(atom.id, options), ">").concat(atom.value, "</mi>");
    // For named SVG atoms, map to a Unicode char
    var SVG_CODE_POINTS = {
        widehat: '^',
        widecheck: 'ˇ',
        widetilde: '~',
        utilde: '~',
        overleftarrow: '\u2190',
        underleftarrow: '\u2190',
        xleftarrow: '\u2190',
        longleftarrow: '\u2190',
        overrightarrow: '\u2192',
        underrightarrow: '\u2192',
        xrightarrow: '\u2192',
        longrightarrow: '\u2192',
        underbrace: '\u23DF',
        overbrace: '\u23DE',
        overgroup: '\u23E0',
        undergroup: '\u23E1',
        overleftrightarrow: '\u2194',
        underleftrightarrow: '\u2194',
        xleftrightarrow: '\u2194',
        Overrightarrow: '\u21D2',
        xRightarrow: '\u21D2',
        overleftharpoon: '\u21BC',
        xleftharpoonup: '\u21BC',
        overrightharpoon: '\u21C0',
        xrightharpoonup: '\u21C0',
        xLeftarrow: '\u21D0',
        xLeftrightarrow: '\u21D4',
        xhookleftarrow: '\u21A9',
        xhookrightarrow: '\u21AA',
        xmapsto: '\u21A6',
        xrightharpoondown: '\u21C1',
        xleftharpoondown: '\u21BD',
        xrightleftharpoons: '\u21CC',
        longrightleftharpoons: '\u21CC',
        xleftrightharpoons: '\u21CB',
        xtwoheadleftarrow: '\u219E',
        xtwoheadrightarrow: '\u21A0',
        xlongequal: '=',
        xtofrom: '\u21C4',
        xleftrightarrows: '\u21C4',
        xRightleftharpoons: '\u21CC',
        longRightleftharpoons: '\u21CC',
        xLeftrightharpoons: '\u21CB',
        longLeftrightharpoons: '\u21CB'
    };
    var SPACING = {
        '\\!': -3 / 18,
        '\\ ': 6 / 18,
        '\\,': 3 / 18,
        '\\:': 4 / 18,
        '\\>': 4 / 18,
        '\\;': 5 / 18,
        '\\enspace': 0.5,
        '\\quad': 1,
        '\\qquad': 2,
        '\\enskip': 0.5
    };
    var result = '';
    var sep = '';
    var col;
    var row;
    var i;
    var underscript;
    var overscript;
    var body;
    var command = atom.command;
    if (atom.command === '\\error') {
        return "<merror".concat(makeID(atom.id, options), ">").concat(toMathML(atom.body, options), "</merror>");
    }
    var SPECIAL_DELIMS = {
        '\\vert': '|',
        '\\Vert': '\u2225',
        '\\mid': '\u2223',
        '\\lbrack': '[',
        '\\rbrack': ']',
        '\\{': '{',
        '\\}': '}',
        '\\lbrace': '{',
        '\\rbrace': '}',
        '\\lparen': '(',
        '\\rparen': ')',
        '\\langle': '\u27E8',
        '\\rangle': '\u27E9',
        '\\lfloor': '\u230A',
        '\\rfloor': '\u230B',
        '\\lceil': '\u2308',
        '\\rceil': '\u2309'
    };
    var SPECIAL_ACCENTS = {
        '\\vec': '&#x20d7;',
        '\\acute': '&#x00b4;',
        '\\grave': '&#x0060;',
        '\\dot': '&#x02d9;',
        '\\ddot': '&#x00a8;',
        '\\tilde': '&#x007e;',
        '\\bar': '&#x00af;',
        '\\breve': '&#x02d8;',
        '\\check': '&#x02c7;',
        '\\hat': '&#x005e;'
    };
    switch (atom.type) {
        case 'first':
            break; // Nothing to do
        case 'group':
        case 'root':
            result = toMathML(atom.body, options);
            break;
        case 'array':
            if ((atom.leftDelim && atom.leftDelim !== '.') ||
                (atom.rightDelim && atom.rightDelim !== '.')) {
                result += '<mrow>';
                if (atom.leftDelim && atom.leftDelim !== '.') {
                    result +=
                        '<mo>' +
                            (SPECIAL_DELIMS[atom.leftDelim] || atom.leftDelim) +
                            '</mo>';
                }
            }
            result += '<mtable';
            if (atom.colFormat) {
                result += ' columnalign="';
                for (i = 0; i < atom.colFormat.length; i++) {
                    if (atom.colFormat[i].align) {
                        result +=
                            { l: 'left', c: 'center', r: 'right' }[atom.colFormat[i].align] +
                                ' ';
                    }
                }
                result += '"';
            }
            result += '>';
            for (row = 0; row < atom.array.length; row++) {
                result += '<mtr>';
                for (col = 0; col < atom.array[row].length; col++) {
                    result +=
                        '<mtd>' + toMathML(atom.array[row][col], options) + '</mtd>';
                }
                result += '</mtr>';
            }
            result += '</mtable>';
            if ((atom.leftDelim && atom.leftDelim !== '.') ||
                (atom.rightDelim && atom.rightDelim !== '.')) {
                if (atom.rightDelim && atom.rightDelim !== '.') {
                    result +=
                        '<mo>' +
                            (SPECIAL_DELIMS[atom.leftDelim] || atom.rightDelim) +
                            '</mo>';
                }
                result += '</mrow>';
            }
            break;
        case 'genfrac':
            if (atom.leftDelim || atom.rightDelim)
                result += '<mrow>';
            if (atom.leftDelim && atom.leftDelim !== '.') {
                result +=
                    '<mo' +
                        makeID(atom.id, options) +
                        '>' +
                        (SPECIAL_DELIMS[atom.leftDelim] || atom.leftDelim) +
                        '</mo>';
            }
            if (atom.hasBarLine) {
                result += '<mfrac>';
                result += toMathML(atom.above, options) || '<mi>&nbsp;</mi>';
                result += toMathML(atom.below, options) || '<mi>&nbsp;</mi>';
                result += '</mfrac>';
            }
            else {
                // No bar line, i.e. \choose, etc...
                result += '<mtable' + makeID(atom.id, options) + '>';
                result += '<mtr>' + toMathML(atom.above, options) + '</mtr>';
                result += '<mtr>' + toMathML(atom.below, options) + '</mtr>';
                result += '</mtable>';
            }
            if (atom.rightDelim && atom.rightDelim !== '.') {
                result +=
                    '<mo' +
                        makeID(atom.id, options) +
                        '>' +
                        (SPECIAL_DELIMS[atom.rightDelim] || atom.rightDelim) +
                        '</mo>';
            }
            if (atom.leftDelim || atom.rightDelim)
                result += '</mrow>';
            break;
        case 'surd':
            if (!atom.hasEmptyBranch('above')) {
                result += '<mroot' + makeID(atom.id, options) + '>';
                result += toMathML(atom.body, options);
                result += toMathML(atom.above, options);
                result += '</mroot>';
            }
            else {
                result += '<msqrt' + makeID(atom.id, options) + '>';
                result += toMathML(atom.body, options);
                result += '</msqrt>';
            }
            break;
        case 'leftright':
            var leftrightAtom = atom;
            var lDelim = leftrightAtom.leftDelim;
            result = '<mrow>';
            if (lDelim && lDelim !== '.') {
                result += "<mo".concat(makeID(atom.id, options), ">").concat((_a = SPECIAL_DELIMS[lDelim]) !== null && _a !== void 0 ? _a : lDelim, "</mo>");
            }
            if (atom.body)
                result += toMathML(atom.body, options);
            var rDelim = leftrightAtom.matchingRightDelim();
            if (rDelim && rDelim !== '.') {
                result += "<mo".concat(makeID(atom.id, options), ">").concat((_b = SPECIAL_DELIMS[rDelim]) !== null && _b !== void 0 ? _b : rDelim, "</mo>");
            }
            result += '</mrow>';
            break;
        case 'sizeddelim':
        case 'delim':
            result += "<mo".concat(makeID(atom.id, options), ">").concat(SPECIAL_DELIMS[atom.value] || atom.value, "</mo>");
            break;
        case 'accent':
            result += '<mover accent="true"' + makeID(atom.id, options) + '>';
            result += toMathML(atom.body, options);
            result += '<mo>' + (SPECIAL_ACCENTS[command] || atom.accent) + '</mo>';
            result += '</mover>';
            break;
        case 'line':
        case 'overlap':
            break;
        case 'overunder':
            overscript = atom.above;
            underscript = atom.below;
            if ((atom.svgAbove || overscript) && (atom.svgBelow || underscript))
                body = atom.body;
            else if (overscript && overscript.length > 0) {
                body = atom.body;
                if ((_d = (_c = atom.body) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.below) {
                    underscript = atom.body[0].below;
                    body = atom.body[0].body;
                }
                else if (((_f = (_e = atom.body) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.type) === 'first' && ((_h = (_g = atom.body) === null || _g === void 0 ? void 0 : _g[1]) === null || _h === void 0 ? void 0 : _h.below)) {
                    underscript = atom.body[1].below;
                    body = atom.body[1].body;
                }
            }
            else if (underscript && underscript.length > 0) {
                body = atom.body;
                if ((_k = (_j = atom.body) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.above) {
                    overscript = atom.body[0].above;
                    body = atom.body[0].body;
                }
                else if (((_m = (_l = atom.body) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.type) === 'first' && ((_p = (_o = atom.body) === null || _o === void 0 ? void 0 : _o[1]) === null || _p === void 0 ? void 0 : _p.above)) {
                    overscript = atom.body[1].overscript;
                    body = atom.body[1].body;
                }
            }
            if ((atom.svgAbove || overscript) && (atom.svgBelow || underscript)) {
                result += "<munderover ".concat(makeID(atom.id, options), ">");
                result += (_q = SVG_CODE_POINTS[atom.svgBody]) !== null && _q !== void 0 ? _q : toMathML(body, options);
                result +=
                    (_r = SVG_CODE_POINTS[atom.svgBelow]) !== null && _r !== void 0 ? _r : toMathML(underscript, options);
                result +=
                    (_s = SVG_CODE_POINTS[atom.svgAbove]) !== null && _s !== void 0 ? _s : toMathML(overscript, options);
                result += '</munderover>';
            }
            else if (atom.svgAbove || overscript) {
                result +=
                    "<mover ".concat(makeID(atom.id, options), ">") +
                        ((_t = SVG_CODE_POINTS[atom.svgBody]) !== null && _t !== void 0 ? _t : toMathML(body, options));
                result +=
                    (_u = SVG_CODE_POINTS[atom.svgAbove]) !== null && _u !== void 0 ? _u : toMathML(overscript, options);
                result += '</mover>';
            }
            else if (atom.svgBelow || underscript) {
                result +=
                    "<munder ".concat(makeID(atom.id, options), ">") +
                        ((_v = SVG_CODE_POINTS[atom.svgBody]) !== null && _v !== void 0 ? _v : toMathML(body, options));
                result +=
                    (_w = SVG_CODE_POINTS[atom.svgBelow]) !== null && _w !== void 0 ? _w : toMathML(underscript, options);
                result += '</munder>';
            }
            break;
        case 'placeholder': // No real equivalent in MathML -- will generate a '?'qq
            result += '?';
            break;
        case 'mord': {
            result = typeof atom.value === 'string' ? atom.value : command;
            if (command === '\\char') {
                // It's a \char command
                result =
                    '&#x' + ('000000' + atom.args[0].number.toString(16)).slice(-4) + ';';
            }
            else if (result.length > 0 && result.startsWith('\\')) {
                // This is an identifier with no special handling. Use the
                // Unicode value
                if (typeof atom.value === 'string' && atom.value.charCodeAt(0) > 255) {
                    result =
                        '&#x' +
                            ('000000' + atom.value.charCodeAt(0).toString(16)).slice(-4) +
                            ';';
                }
                else if (typeof atom.value === 'string')
                    result = atom.value.charAt(0);
                else {
                    console.error('Did not expect this');
                    result = '';
                }
            }
            var tag = /\d/.test(result) ? 'mn' : 'mi';
            result = "<".concat(tag).concat(makeID(atom.id, options), ">").concat(xmlEscape(result), "</").concat(tag, ">");
            break;
        }
        case 'mbin':
        case 'mrel':
        case 'minner':
            result = toMo(atom, options);
            break;
        case 'mpunct':
            result =
                '<mo separator="true"' +
                    makeID(atom.id, options) +
                    '>' +
                    command +
                    '</mo>';
            break;
        case 'mop':
        case 'operator':
        case 'extensible-symbol':
            if (atom.body !== '\u200B') {
                // Not ZERO-WIDTH
                result = '<mo' + makeID(atom.id, options) + '>';
                result +=
                    command === '\\operatorname' ? atom.body : command || atom.body;
                result += '</mo>';
            }
            break;
        // Case 'mathstyle':
        // TODO: mathstyle is a switch. Need to figure out its scope to properly wrap it around a <mstyle> tag
        // if (atom.mathstyle === 'displaystyle') {
        //     result += '<mstyle displaystyle="true">';
        //     result += '</mstyle>';
        // } else {
        //     result += '<mstyle displaystyle="false">';
        //     result += '</mstyle>';
        // };
        // break;
        case 'box':
            result = '<menclose notation="box"';
            if (atom.backgroundcolor)
                result += ' mathbackground="' + atom.backgroundcolor + '"';
            result +=
                makeID(atom.id, options) +
                    '>' +
                    toMathML(atom.body, options) +
                    '</menclose>';
            break;
        case 'spacing':
            result += '<mspace width="' + ((_x = SPACING[command]) !== null && _x !== void 0 ? _x : 0) + 'em"/>';
            break;
        case 'enclose':
            result = '<menclose notation="';
            for (var notation in atom.notation) {
                if (Object.prototype.hasOwnProperty.call(atom.notation, notation) &&
                    atom.notation[notation]) {
                    result += sep + notation;
                    sep = ' ';
                }
            }
            result +=
                makeID(atom.id, options) +
                    '">' +
                    toMathML(atom.body, options) +
                    '</menclose>';
            break;
        case 'prompt':
            result =
                '<menclose notation="roundexbox""">' +
                    toMathML(atom.body, options) +
                    '</menclose>';
            break;
        case 'space':
            result += '&nbsp;';
            break;
        case 'subsup':
            // if (atom.superscript && atom.subscript) {
            //   result = '<msubsup>' + base;
            //   result += toMathML(atom.subscript, 0, 0, options).mathML;
            //   result += toMathML(atom.superscript, 0, 0, options).mathML;
            //   result += '</msubsup>';
            // } else if (atom.superscript) {
            //   result = '<msup>' + base;
            //   result += toMathML(atom.superscript, 0, 0, options).mathML;
            //   result += '</msup>';
            // } else if (atom.subscript) {
            //   result = '<msub>' + base;
            //   result += toMathML(atom.subscript, 0, 0, options).mathML;
            //   result += '</msub>';
            // }
            break;
        case 'phantom':
            break;
        case 'composition':
            break;
        case 'rule':
            // @todo
            break;
        case 'chem':
            break;
        case 'mopen':
            result += toMo(atom, options);
            break;
        case 'mclose':
            result += toMo(atom, options);
            break;
        case 'macro':
            {
                var body_1 = atom.command + toString(atom.macroArgs);
                if (body_1)
                    result += "<mo ".concat(makeID(atom.id, options), ">").concat(body_1, "</mo>");
            }
            break;
        case 'latexgroup':
            result += toMathML(atom.body, options);
            break;
        case 'latex':
            result +=
                '<mtext' + makeID(atom.id, options) + '>' + atom.value + '</mtext>';
            break;
        case 'tooltip':
            result += toMathML(atom.body, options);
            break;
        case 'text':
            result += "<mtext ".concat(makeID(atom.id, options), "x>").concat(atom.value, "</mtext>");
            break;
        default:
            if (atom.command === '\\displaystyle') {
                return "<mrow ".concat(makeID(atom.id, options), " displaystyle=\"true\">").concat(toMathML(atom.body, options), "</mrow>");
            }
            if (atom.command === '\\textstyle') {
                return "<mrow ".concat(makeID(atom.id, options), " displaystyle=\"false\">").concat(toMathML(atom.body, options), "</mrow>");
            }
            console.info('Unexpected element in conversion to MathML:', atom);
    }
    return result;
}
