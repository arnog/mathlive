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
exports.charToLatex = exports.getMacroDefinition = exports.getDefinition = exports.normalizeMacroDictionary = exports.getMacros = exports.defineFunction = exports.defineTabularEnvironment = exports.defineEnvironment = exports.parseArgAsString = exports.suggest = exports.getEnvironmentDefinition = exports.defineSymbolRange = exports.defineSymbols = exports.LETTER_AND_DIGITS = exports.LETTER = exports.COMMAND_MODE_CHARACTERS = exports.BRAKET_MACROS = exports.AMSMATH_MACROS = exports.TEXVC_MACROS = exports.ENVIRONMENTS = exports.LATEX_COMMANDS = exports.MATH_SYMBOLS = exports.argAtoms = void 0;
var capabilities_1 = require("../ui/utils/capabilities");
var unicode_1 = require("../core/unicode");
function argAtoms(arg) {
    if (!arg)
        return [];
    if (Array.isArray(arg))
        return arg;
    if (typeof arg === 'object' && 'group' in arg)
        return arg.group;
    return [];
}
exports.argAtoms = argAtoms;
exports.MATH_SYMBOLS = {};
// Map a character to some corresponding LaTeX.
//
// This is used for some characters such as ² SUPERSCRIPT TWO.
// This is also an opportunity to specify the preferred form when
// a unicode character is encountered that maps to multiple commands,
// for example ≠ could map either to \ne or \neq.
// The table will also be populated by any registered symbol from MATH_SYMBOLS,
//  so an explicit entry is only needed in case of ambiguous mappings.
//
var REVERSE_MATH_SYMBOLS = __assign({}, unicode_1.UNICODE_TO_LATEX);
exports.LATEX_COMMANDS = {};
exports.ENVIRONMENTS = {};
exports.TEXVC_MACROS = {
    //////////////////////////////////////////////////////////////////////
    // texvc.sty
    // The texvc package contains macros available in mediawiki pages.
    // We omit the functions deprecated at
    // https://en.wikipedia.org/wiki/Help:Displaying_a_formula#Deprecated_syntax
    // We also omit texvc's \O, which conflicts with \text{\O}
    darr: '\\downarrow',
    dArr: '\\Downarrow',
    Darr: '\\Downarrow',
    lang: '\\langle',
    rang: '\\rangle',
    uarr: '\\uparrow',
    uArr: '\\Uparrow',
    Uarr: '\\Uparrow',
    N: '\\mathbb{N}',
    R: '\\mathbb{R}',
    Z: '\\mathbb{Z}',
    alef: '\\aleph',
    alefsym: '\\aleph',
    Alpha: '\\mathrm{A}',
    Beta: '\\mathrm{B}',
    bull: '\\bullet',
    Chi: '\\mathrm{X}',
    clubs: '\\clubsuit',
    cnums: '\\mathbb{C}',
    Complex: '\\mathbb{C}',
    Dagger: '\\ddagger',
    diamonds: '\\diamondsuit',
    empty: '\\emptyset',
    Epsilon: '\\mathrm{E}',
    Eta: '\\mathrm{H}',
    exist: '\\exists',
    harr: '\\leftrightarrow',
    hArr: '\\Leftrightarrow',
    Harr: '\\Leftrightarrow',
    hearts: '\\heartsuit',
    image: '\\Im',
    infin: '\\infty',
    Iota: '\\mathrm{I}',
    isin: '\\in',
    Kappa: '\\mathrm{K}',
    larr: '\\leftarrow',
    lArr: '\\Leftarrow',
    Larr: '\\Leftarrow',
    lrarr: '\\leftrightarrow',
    lrArr: '\\Leftrightarrow',
    Lrarr: '\\Leftrightarrow',
    Mu: '\\mathrm{M}',
    natnums: '\\mathbb{N}',
    Nu: '\\mathrm{N}',
    Omicron: '\\mathrm{O}',
    plusmn: '\\pm',
    rarr: '\\rightarrow',
    rArr: '\\Rightarrow',
    Rarr: '\\Rightarrow',
    real: '\\Re',
    reals: '\\mathbb{R}',
    Reals: '\\mathbb{R}',
    Rho: '\\mathrm{P}',
    sdot: '\\cdot',
    sect: '\\S',
    spades: '\\spadesuit',
    sub: '\\subset',
    sube: '\\subseteq',
    supe: '\\supseteq',
    Tau: '\\mathrm{T}',
    thetasym: '\\vartheta',
    // TODO: varcoppa: { def: "\\\mbox{\\coppa}", expand: false },
    weierp: '\\wp',
    Zeta: '\\mathrm{Z}'
};
exports.AMSMATH_MACROS = {
    // amsmath.sty
    // http://mirrors.concertpass.com/tex-archive/macros/latex/required/amsmath/amsmath.pdf
    // Italic Greek capital letters.  AMS defines these with \DeclareMathSymbol,
    // but they are equivalent to \mathit{\Letter}.
    varGamma: '\\mathit{\\Gamma}',
    varDelta: '\\mathit{\\Delta}',
    varTheta: '\\mathit{\\Theta}',
    varLambda: '\\mathit{\\Lambda}',
    varXi: '\\mathit{\\Xi}',
    varPi: '\\mathit{\\Pi}',
    varSigma: '\\mathit{\\Sigma}',
    varUpsilon: '\\mathit{\\Upsilon}',
    varPhi: '\\mathit{\\Phi}',
    varPsi: '\\mathit{\\Psi}',
    varOmega: '\\mathit{\\Omega}',
    // From http://tug.ctan.org/macros/latex/required/amsmath/amsmath.dtx
    // > \newcommand{\pod}[1]{
    // >    \allowbreak
    // >    \if@display
    // >      \mkern18mu
    // >    \else
    // >      \mkern8mu
    // >    \fi
    // >    (#1)
    // > }
    // 18mu = \quad
    // > \renewcommand{\pmod}[1]{
    // >  \pod{{\operator@font mod}\mkern6mu#1}
    // > }
    pmod: {
        def: '\\quad(\\operatorname{mod}\\ #1)',
        args: 1,
        expand: false,
        captureSelection: false
    },
    // > \newcommand{\mod}[1]{
    // >    \allowbreak
    // >    \if@display
    // >      \mkern18mu
    // >    \else
    // >      \mkern12mu
    // >    \fi
    //>     {\operator@font mod}\,\,#1}
    mod: {
        def: '\\quad\\operatorname{mod}\\,\\,#1',
        args: 1,
        expand: false
    },
    // > \renewcommand{\bmod}{
    // >  \nonscript\mskip-\medmuskip\mkern5mu
    // >  \mathbin{\operator@font mod}
    // >  \penalty900 \mkern5mu
    // >  \nonscript\mskip-\medmuskip
    // > }
    // 5mu = \;
    bmod: {
        def: '\\;\\mathbin{\\operatorname{mod }}',
        expand: false
    }
};
// From `braket.sty`, Dirac notation
exports.BRAKET_MACROS = {
    bra: { def: '\\mathinner{\\langle{#1}|}', args: 1, captureSelection: false },
    ket: { def: '\\mathinner{|{#1}\\rangle}', args: 1, captureSelection: false },
    braket: {
        def: '\\mathinner{\\langle{#1}\\rangle}',
        args: 1,
        captureSelection: false
    },
    set: {
        def: '\\mathinner{\\lbrace #1 \\rbrace}',
        args: 1,
        captureSelection: false
    },
    Bra: { def: '\\left\\langle #1\\right|', args: 1, captureSelection: false },
    Ket: { def: '\\left|#1\\right\\rangle', args: 1, captureSelection: false },
    Braket: {
        def: '\\left\\langle{#1}\\right\\rangle',
        args: 1,
        captureSelection: false
    },
    Set: {
        def: '\\left\\lbrace #1 \\right\\rbrace',
        args: 1,
        captureSelection: false
    }
};
var DEFAULT_MACROS = {
    'iff': {
        primitive: true,
        captureSelection: true,
        def: '\\;\\char"27FA\\;'
    },
    'nicefrac': '^{#1}\\!\\!/\\!_{#2}',
    'phase': {
        def: '\\enclose{phasorangle}{#1}',
        args: 1,
        captureSelection: false
    },
    // Proof Wiki
    'rd': '\\mathrm{d}',
    'rD': '\\mathrm{D}',
    // From Wolfram Alpha
    'doubleStruckCapitalN': '\\mathbb{N}',
    'doubleStruckCapitalR': '\\mathbb{R}',
    'doubleStruckCapitalQ': '\\mathbb{Q}',
    'doubleStruckCapitalZ': '\\mathbb{Z}',
    'doubleStruckCapitalP': '\\mathbb{P}',
    'scriptCapitalE': '\\mathscr{E}',
    'scriptCapitalH': '\\mathscr{H}',
    'scriptCapitalL': '\\mathscr{L}',
    'gothicCapitalC': '\\mathfrak{C}',
    'gothicCapitalH': '\\mathfrak{H}',
    'gothicCapitalI': '\\mathfrak{I}',
    'gothicCapitalR': '\\mathfrak{R}',
    'imaginaryI': '\\mathrm{i}',
    'imaginaryJ': '\\mathrm{j}',
    'exponentialE': '\\mathrm{e}',
    'differentialD': '\\mathrm{d}',
    'capitalDifferentialD': '\\mathrm{D}',
    'mathstrut': { def: '\\vphantom{(}', primitive: true },
    // https://ctan.math.washington.edu/tex-archive/macros/latex/contrib/actuarialangle/actuarialangle.pdf
    'angl': '\\enclose{actuarial}{#1}',
    'angln': '\\enclose{actuarial}{n}',
    'anglr': '\\enclose{actuarial}{r}',
    'anglk': '\\enclose{actuarial}{k}',
    //////////////////////////////////////////////////////////////////////
    // mathtools.sty
    // In the summer of 2022, mathtools did some renaming of macros.
    // This is the latest version, with some legacy commands.
    'mathtools': {
        primitive: true,
        package: {
            //\providecommand\ordinarycolon{:}
            ordinarycolon: ':',
            //\def\vcentcolon{\mathrel{\mathop\ordinarycolon}}
            //TODO(edemaine): Not yet centered. Fix via \raisebox or #726
            vcentcolon: '\\mathrel{\\mathop\\ordinarycolon}',
            // \providecommand*\dblcolon{\vcentcolon\mathrel{\mkern-.9mu}\vcentcolon}
            dblcolon: '{\\mathop{\\char"2237}}',
            // \providecommand*\coloneqq{\vcentcolon\mathrel{\mkern-1.2mu}=}
            coloneqq: '{\\mathop{\\char"2254}}',
            // \providecommand*\Coloneqq{\dblcolon\mathrel{\mkern-1.2mu}=}
            Coloneqq: '{\\mathop{\\char"2237\\char"3D}}',
            // \providecommand*\coloneq{\vcentcolon\mathrel{\mkern-1.2mu}\mathrel{-}}
            coloneq: '{\\mathop{\\char"3A\\char"2212}}',
            // \providecommand*\Coloneq{\dblcolon\mathrel{\mkern-1.2mu}\mathrel{-}}
            Coloneq: '{\\mathop{\\char"2237\\char"2212}}',
            // \providecommand*\eqqcolon{=\mathrel{\mkern-1.2mu}\vcentcolon}
            eqqcolon: '{\\mathop{\\char"2255}}',
            // \providecommand*\Eqqcolon{=\mathrel{\mkern-1.2mu}\dblcolon}
            Eqqcolon: '{\\mathop{\\char"3D\\char"2237}}',
            // \providecommand*\eqcolon{\mathrel{-}\mathrel{\mkern-1.2mu}\vcentcolon}
            eqcolon: '{\\mathop{\\char"2239}}',
            // \providecommand*\Eqcolon{\mathrel{-}\mathrel{\mkern-1.2mu}\dblcolon}
            Eqcolon: '{\\mathop{\\char"2212\\char"2237}}',
            // \providecommand*\colonapprox{\vcentcolon\mathrel{\mkern-1.2mu}\approx}
            colonapprox: '{\\mathop{\\char"003A\\char"2248}}',
            // \providecommand*\Colonapprox{\dblcolon\mathrel{\mkern-1.2mu}\approx}
            Colonapprox: '{\\mathop{\\char"2237\\char"2248}}',
            // \providecommand*\colonsim{\vcentcolon\mathrel{\mkern-1.2mu}\sim}
            colonsim: '{\\mathop{\\char"3A\\char"223C}}',
            // \providecommand*\Colonsim{\dblcolon\mathrel{\mkern-1.2mu}\sim}
            Colonsim: '{\\mathop{\\char"2237\\char"223C}}',
            colondash: '\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}',
            Colondash: '\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}',
            dashcolon: '\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\vcentcolon}',
            Dashcolon: '\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\dblcolon}'
        }
    },
    //////////////////////////////////////////////////////////////////////
    // colonequals.sty
    // Alternate names for mathtools's macros:
    'ratio': '\\vcentcolon',
    'coloncolon': '\\dblcolon',
    'colonequals': '\\coloneq',
    'coloncolonequals': '\\Coloneq',
    'equalscolon': '\\eqcolon',
    'equalscoloncolon': '\\Eqcolon',
    'colonminus': '\\colondash',
    'coloncolonminus': '\\Colondash',
    'minuscolon': '\\dashcolon',
    'minuscoloncolon': '\\Dashcolon',
    // \colonapprox name is same in mathtools and colonequals.
    'coloncolonapprox': '\\Colonapprox',
    // \colonsim name is same in mathtools and colonequals.
    'coloncolonsim': '\\Colonsim',
    // Additional macros, implemented by analogy with mathtools definitions:
    'simcolon': '\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\vcentcolon}',
    'Simcolon': '\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\dblcolon}',
    'simcoloncolon': '\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\dblcolon}',
    'approxcolon': '\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\vcentcolon}',
    'Approxcolon': '\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\dblcolon}',
    'approxcoloncolon': '\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\dblcolon}',
    // Present in newtxmath, pxfonts and txfonts
    'notni': '\\mathrel{\\char`\u220C}',
    'limsup': '\\operatorname*{lim\\,sup}',
    'liminf': '\\operatorname*{lim\\,inf}',
    //////////////////////////////////////////////////////////////////////
    // From amsopn.sty
    'injlim': '\\operatorname*{inj\\,lim}',
    'projlim': '\\operatorname*{proj\\,lim}',
    'varlimsup': '\\operatorname*{\\overline{lim}}',
    'varliminf': '\\operatorname*{\\underline{lim}}',
    'varinjlim': '\\operatorname*{\\underrightarrow{lim}}',
    'varprojlim': '\\operatorname*{\\underleftarrow{lim}}',
    //////////////////////////////////////////////////////////////////////
    // statmath.sty
    // https://ctan.math.illinois.edu/macros/latex/contrib/statmath/statmath.pdf
    'argmin': '\\operatorname*{arg\\,min}',
    'argmax': '\\operatorname*{arg\\,max}',
    'plim': '\\mathop{\\operatorname{plim}}\\limits',
    // mhchem
    'tripledash': {
        def: '\\vphantom{-}\\raise{4mu}{\\mkern1.5mu\\rule{2mu}{1.5mu}\\mkern{2.25mu}\\rule{2mu}{1.5mu}\\mkern{2.25mu}\\rule{2mu}{1.5mu}\\mkern{2mu}}',
        expand: true
    },
    'braket.sty': { package: exports.BRAKET_MACROS },
    'amsmath.sty': {
        package: exports.AMSMATH_MACROS,
        primitive: true
    },
    'texvc.sty': {
        package: exports.TEXVC_MACROS,
        primitive: false
    }
};
// Body-text symbols
// See http://ctan.mirrors.hoobly.com/info/symbols/comprehensive/symbols-a4.pdf, p14
var TEXT_SYMBOLS = {
    ' ': 0x0020,
    // want that in Text mode.
    '\\!': 0x0021,
    '\\#': 0x0023,
    '\\$': 0x0024,
    '\\%': 0x0025,
    '\\&': 0x0026,
    '\\_': 0x005f,
    '-': 0x002d,
    '\\textunderscore': 0x005f,
    '\\euro': 0x20ac,
    '\\maltese': 0x2720,
    '\\{': 0x007b,
    '\\}': 0x007d,
    '\\textbraceleft': 0x007b,
    '\\textbraceright': 0x007d,
    '\\lbrace': 0x007b,
    '\\rbrace': 0x007d,
    '\\lbrack': 0x005b,
    '\\rbrack': 0x005d,
    '\\nobreakspace': 0x00a0,
    '\\ldots': 0x2026,
    '\\textellipsis': 0x2026,
    '\\backslash': 0x005c,
    '`': 0x2018,
    "'": 0x2019,
    '``': 0x201c,
    "''": 0x201d,
    '\\degree': 0x00b0,
    '\\textasciicircum': 0x005e,
    '\\textasciitilde': 0x007e,
    '\\textasteriskcentered': 0x002a,
    '\\textbackslash': 0x005c,
    '\\textbullet': 0x2022,
    '\\textdollar': 0x0024,
    '\\textsterling': 0x00a3,
    '\\textdagger': 0x2020,
    '\\textdaggerdbl': 0x2021,
    '–': 0x2013,
    '—': 0x2014,
    '‘': 0x2018,
    '’': 0x2019,
    '“': 0x201c,
    '”': 0x201d,
    '"': 0x201d,
    '\\ss': 0x00df,
    '\\ae': 0x00e6,
    '\\oe': 0x0153,
    '\\AE': 0x00c6,
    '\\OE': 0x0152,
    '\\O': 0x00d8,
    '\\i': 0x0131,
    '\\j': 0x0237,
    '\\aa': 0x00e5,
    '\\AA': 0x00c5
};
exports.COMMAND_MODE_CHARACTERS = /[\w!@*()-=+{}\[\]\\';:?/.,~<>`|$%#&^" ]/;
if ((0, capabilities_1.supportRegexPropertyEscape)()) {
    exports.LETTER = new RegExp('\\p{Letter}', 'u');
    exports.LETTER_AND_DIGITS = new RegExp('[0-9\\p{Letter}]', 'u');
}
else {
    exports.LETTER =
        /[a-zA-ZаАбБвВгГдДеЕёЁжЖзЗиИйЙкКлЛмМнНоОпПрРсСтТуУфФхХцЦчЧшШщЩъЪыЫьЬэЭюЮяĄąĆćĘęŁłŃńÓóŚśŹźŻżàâäôéèëêïîçùûüÿæœÀÂÄÔÉÈËÊÏÎŸÇÙÛÜÆŒößÖẞìíòúÌÍÒÚáñÁÑ]/;
    exports.LETTER_AND_DIGITS =
        /[\da-zA-ZаАбБвВгГдДеЕёЁжЖзЗиИйЙкКлЛмМнНоОпПрРсСтТуУфФхХцЦчЧшШщЩъЪыЫьЬэЭюЮяĄąĆćĘęŁłŃńÓóŚśŹźŻżàâäôéèëêïîçùûüÿæœÀÂÄÔÉÈËÊÏÎŸÇÙÛÜÆŒößÖẞìíòúÌÍÒÚáñÁÑ]/;
}
/**
 * @param symbol    The LaTeX command for this symbol, for
 * example `\alpha` or `+`
 */
function defineSymbol(symbol, codepoint, type, variant) {
    if (type === void 0) { type = 'mord'; }
    if (codepoint === undefined)
        return;
    exports.MATH_SYMBOLS[symbol] = {
        definitionType: 'symbol',
        type: type,
        variant: variant,
        codepoint: codepoint
    };
    if (!REVERSE_MATH_SYMBOLS[codepoint])
        REVERSE_MATH_SYMBOLS[codepoint] = symbol;
}
/**
 * Define a set of single-codepoint symbols
 */
function defineSymbols(value, inType, inVariant) {
    if (typeof value === 'string') {
        for (var i = 0; i < value.length; i++) {
            var ch = value.charAt(i);
            defineSymbol(ch, ch.codePointAt(0));
        }
        return;
    }
    for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
        var _a = value_1[_i], symbol = _a[0], val = _a[1], type = _a[2], variant = _a[3];
        defineSymbol(symbol, val, type !== null && type !== void 0 ? type : inType, variant !== null && variant !== void 0 ? variant : inVariant);
    }
}
exports.defineSymbols = defineSymbols;
/**
 * Define a set of single-character symbols as a range of Unicode codepoints
 * @param from First Unicode codepoint
 * @param to Last Unicode codepoint
 */
function defineSymbolRange(from, to) {
    for (var i = from; i <= to; i++)
        defineSymbol(String.fromCodePoint(i), i);
}
exports.defineSymbolRange = defineSymbolRange;
function getEnvironmentDefinition(name) {
    var _a;
    return (_a = exports.ENVIRONMENTS[name]) !== null && _a !== void 0 ? _a : null;
}
exports.getEnvironmentDefinition = getEnvironmentDefinition;
/**
 * Return an array of suggestion for completing string 's'.
 * For example, for '\si', it could return ['\sin', '\sinh', '\sim', 'simeq', '\sigma']
 * Infix operators are excluded, since they are deprecated commands.
 */
function suggest(mf, s) {
    var _a, _b;
    if (s.length === 0 || s === '\\' || !s.startsWith('\\'))
        return [];
    var result = [];
    // Iterate over items in the dictionary
    for (var p in exports.LATEX_COMMANDS) {
        // Don't recommend infix commands
        if (p.startsWith(s) && !exports.LATEX_COMMANDS[p].infix)
            result.push({ match: p, frequency: (_a = exports.LATEX_COMMANDS[p].frequency) !== null && _a !== void 0 ? _a : 0 });
    }
    for (var p in exports.MATH_SYMBOLS) {
        if (p.startsWith(s))
            result.push({ match: p, frequency: (_b = exports.MATH_SYMBOLS[p].frequency) !== null && _b !== void 0 ? _b : 0 });
    }
    // Consider macros
    var command = s.substring(1);
    for (var _i = 0, _c = Object.keys(mf.options.macros); _i < _c.length; _i++) {
        var p = _c[_i];
        if (p.startsWith(command))
            result.push({ match: '\\' + p, frequency: 0 });
    }
    result.sort(function (a, b) {
        var _a, _b;
        if (a.frequency === b.frequency) {
            if (a.match.length === b.match.length)
                return a.match < b.match ? -1 : +1;
            return a.match.length - b.match.length;
        }
        return ((_a = b.frequency) !== null && _a !== void 0 ? _a : 0) - ((_b = a.frequency) !== null && _b !== void 0 ? _b : 0);
    });
    return result.map(function (x) { return x.match; });
}
exports.suggest = suggest;
/**
 * An argument template has the following syntax:
 *
 * <placeholder>:<type>
 *
 * where
 * - <placeholder> is a string whose value is displayed when the argument
 *   is missing
 * - <type> is one of 'string', 'color', 'dimen', 'auto', 'text', 'math'
 *
 */
function parseParameterTemplateArgument(argTemplate) {
    var type = 'auto';
    // Parse the type (:type)
    var r = argTemplate.match(/:([^=]+)/);
    if (r)
        type = r[1].trim();
    return type;
}
function parseParameterTemplate(parameterTemplate) {
    if (!parameterTemplate)
        return [];
    var result = [];
    var parameters = parameterTemplate.split(']');
    if (parameters[0].startsWith('[')) {
        // We found at least one optional parameter.
        result.push({
            isOptional: true,
            type: parseParameterTemplateArgument(parameters[0].slice(1))
        });
        // Parse the rest
        for (var i = 1; i <= parameters.length; i++)
            result.push.apply(result, parseParameterTemplate(parameters[i]));
    }
    else {
        parameters = parameterTemplate.split('}');
        if (parameters[0].startsWith('{')) {
            // We found a required parameter
            result.push({
                isOptional: false,
                type: parseParameterTemplateArgument(parameters[0].slice(1))
            });
            // Parse the rest
            for (var i = 1; i <= parameters.length; i++)
                result.push.apply(result, parseParameterTemplate(parameters[i]));
        }
    }
    return result;
}
/**
 * If possible, i.e. if they are all simple atoms, return a string made up of
 * their body
 */
function parseArgAsString(atoms) {
    if (!atoms)
        return '';
    var result = '';
    var success = true;
    for (var _i = 0, atoms_1 = atoms; _i < atoms_1.length; _i++) {
        var atom = atoms_1[_i];
        if (typeof atom.value === 'string')
            result += atom.value;
        else
            success = false;
    }
    return success ? result : '';
}
exports.parseArgAsString = parseArgAsString;
/**
 * Define one or more environments to be used with
 *         \begin{<env-name>}...\end{<env-name>}.
 *
 * @param params The number and type of required and optional parameters.
 */
function defineEnvironment(names, createAtom) {
    if (typeof names === 'string')
        names = [names];
    var def = {
        tabular: false,
        params: [],
        createAtom: createAtom
    };
    for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
        var name_1 = names_1[_i];
        exports.ENVIRONMENTS[name_1] = def;
    }
}
exports.defineEnvironment = defineEnvironment;
/**
 * Like defineEnvironment, but for a tabular environment, i.e.
 * one whose content is in tabular mode, where '&' indicata a new column
 * and '\\' indicate a new row.
 */
function defineTabularEnvironment(names, parameters, createAtom) {
    if (typeof names === 'string')
        names = [names];
    // The parameters for this function, an array of
    // {optional, type}
    var parsedParameters = parseParameterTemplate(parameters);
    var data = {
        tabular: true,
        params: parsedParameters,
        createAtom: createAtom
    };
    for (var _i = 0, names_2 = names; _i < names_2.length; _i++) {
        var name_2 = names_2[_i];
        exports.ENVIRONMENTS[name_2] = data;
    }
}
exports.defineTabularEnvironment = defineTabularEnvironment;
/**
 * Define one of more functions.
 *
 * @param names
 * @param parameters The number and type of required and optional parameters.
 * For example: '{}' defines a single mandatory parameter
 * '[string]{auto}' defines two params, one optional, one required
 */
function defineFunction(names, parameters, options) {
    var _a, _b;
    if (!options)
        options = {};
    // Set default values of functions
    var data = {
        definitionType: 'function',
        // The parameters for this function, an array of
        // {optional, type}
        params: parseParameterTemplate(parameters),
        ifMode: options.ifMode,
        isFunction: (_a = options.isFunction) !== null && _a !== void 0 ? _a : false,
        applyMode: options.applyMode,
        infix: (_b = options.infix) !== null && _b !== void 0 ? _b : false,
        parse: options.parse,
        createAtom: options.createAtom,
        applyStyle: options.applyStyle,
        serialize: options.serialize,
        render: options.render
    };
    if (typeof names === 'string')
        exports.LATEX_COMMANDS['\\' + names] = data;
    else
        for (var _i = 0, names_3 = names; _i < names_3.length; _i++) {
            var name_3 = names_3[_i];
            exports.LATEX_COMMANDS['\\' + name_3] = data;
        }
}
exports.defineFunction = defineFunction;
var _DEFAULT_MACROS;
function getMacros(otherMacros) {
    if (!_DEFAULT_MACROS)
        _DEFAULT_MACROS = normalizeMacroDictionary(DEFAULT_MACROS);
    if (!otherMacros)
        return _DEFAULT_MACROS;
    return normalizeMacroDictionary(__assign(__assign({}, _DEFAULT_MACROS), otherMacros));
}
exports.getMacros = getMacros;
function normalizeMacroDefinition(def, options) {
    var _a, _b, _c, _d;
    if (typeof def === 'string') {
        // It's a shorthand definition, let's expand it
        var argCount = 0;
        var defString = def;
        // Let's see if there are arguments in the definition.
        if (/(^|[^\\])#1/.test(defString))
            argCount = 1;
        if (/(^|[^\\])#2/.test(defString))
            argCount = 2;
        if (/(^|[^\\])#3/.test(defString))
            argCount = 3;
        if (/(^|[^\\])#4/.test(defString))
            argCount = 4;
        if (/(^|[^\\])#5/.test(defString))
            argCount = 5;
        if (/(^|[^\\])#6/.test(defString))
            argCount = 6;
        if (/(^|[^\\])#7/.test(defString))
            argCount = 7;
        if (/(^|[^\\])#8/.test(defString))
            argCount = 8;
        if (/(^|[^\\])#9/.test(defString))
            argCount = 9;
        return {
            expand: (_a = options === null || options === void 0 ? void 0 : options.expand) !== null && _a !== void 0 ? _a : true,
            captureSelection: (_b = options === null || options === void 0 ? void 0 : options.captureSelection) !== null && _b !== void 0 ? _b : true,
            args: argCount,
            def: defString
        };
    }
    return __assign({ expand: (_c = options === null || options === void 0 ? void 0 : options.expand) !== null && _c !== void 0 ? _c : true, captureSelection: (_d = options === null || options === void 0 ? void 0 : options.captureSelection) !== null && _d !== void 0 ? _d : true, args: 0 }, def);
}
function normalizeMacroDictionary(macros) {
    if (!macros)
        return {};
    var result = {};
    for (var _i = 0, _a = Object.keys(macros); _i < _a.length; _i++) {
        var macro = _a[_i];
        var macroDef = macros[macro];
        if (macroDef === undefined || macroDef === null)
            delete result[macro];
        else if (typeof macroDef === 'object' && 'package' in macroDef) {
            for (var _b = 0, _c = Object.keys(macroDef.package); _b < _c.length; _b++) {
                var packageMacro = _c[_b];
                result[packageMacro] = normalizeMacroDefinition(macroDef.package[packageMacro], {
                    expand: !macroDef.primitive,
                    captureSelection: macroDef.captureSelection
                });
            }
        }
        else
            result[macro] = normalizeMacroDefinition(macroDef);
    }
    return result;
}
exports.normalizeMacroDictionary = normalizeMacroDictionary;
function getDefinition(token, parseMode) {
    if (parseMode === void 0) { parseMode = 'math'; }
    if (!token || token.length === 0)
        return null;
    var info = null;
    if (token.startsWith('\\')) {
        // This could be a function or a token
        info = exports.LATEX_COMMANDS[token];
        if (info) {
            if (!info.ifMode || info.ifMode === parseMode)
                return info;
            return null;
        }
        // It wasn't a function, maybe it's a token?
        if (parseMode === 'math')
            info = exports.MATH_SYMBOLS[token];
        else if (TEXT_SYMBOLS[token]) {
            info = {
                definitionType: 'symbol',
                type: 'mord',
                codepoint: TEXT_SYMBOLS[token]
            };
        }
    }
    else if (parseMode === 'math') {
        info = exports.MATH_SYMBOLS[token];
        if (!info && token.length === 1) {
            //Check if this is a Unicode character that has a definition
            var command = charToLatex('math', token.codePointAt(0));
            if (command.startsWith('\\'))
                return __assign(__assign({}, getDefinition(command, 'math')), { command: command });
            return null;
        }
    }
    else if (TEXT_SYMBOLS[token]) {
        info = {
            definitionType: 'symbol',
            type: 'mord',
            codepoint: TEXT_SYMBOLS[token]
        };
    }
    else if (parseMode === 'text') {
        info = {
            definitionType: 'symbol',
            type: 'mord',
            codepoint: token.codePointAt(0)
        };
    }
    return info !== null && info !== void 0 ? info : null;
}
exports.getDefinition = getDefinition;
function getMacroDefinition(token, macros) {
    if (!token.startsWith('\\'))
        return null;
    var command = token.slice(1);
    return macros[command];
}
exports.getMacroDefinition = getMacroDefinition;
/**
 * Given a codepoint, return a matching LaTeX expression.
 * If there is a matching command (e.g. `\alpha`) it is returned.
 */
function charToLatex(parseMode, codepoint) {
    if (codepoint === undefined)
        return '';
    if (parseMode === 'math' && REVERSE_MATH_SYMBOLS[codepoint])
        return REVERSE_MATH_SYMBOLS[codepoint];
    if (parseMode === 'text') {
        var textSymbol = Object.keys(TEXT_SYMBOLS).find(function (x) { return TEXT_SYMBOLS[x] === codepoint; });
        if (textSymbol)
            return textSymbol;
        return String.fromCodePoint(codepoint);
    }
    // const hex = codepoint.toString(16).toLowerCase();
    // return '^'.repeat(hex.length) + hex;
    return String.fromCodePoint(codepoint);
}
exports.charToLatex = charToLatex;
