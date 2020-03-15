import { FUNCTIONS, MATH_SYMBOLS } from '../core/definitions-utils.js';

// Frequency of a symbol.
// String constants corresponding to frequency values,
// which are the number of results returned by latexsearch.com
// When the precise number is known, it is provided. Otherwise,
// the following constants are used to denote an estimate.
const CRYPTIC = 'CRYPTIC';
const ARCANE = 'ARCANE';
// const VERY_RARE = 'VERY_RARE';
const RARE = 'RARE';
const UNCOMMON = 'UNCOMMON';
const COMMON = 'COMMON';
const SUPERCOMMON = 'SUPERCOMMON';

let gCategory = '';

/**
 * @type {Object.<string, number>}
 * @private
 */
const FREQUENCY_VALUE = {
    CRYPTIC: 0,
    ARCANE: 200,
    VERY_RARE: 600,
    RARE: 1200,
    UNCOMMON: 2000,
    COMMON: 3000,
    SUPERCOMMON: 4000,
};

/**
 * Set the frequency of the specified symbol.
 * Default frequency is UNCOMMON
 * The argument list is a frequency value, followed by one or more symbol strings
 * For example:
 *  frequency(COMMON , '\\sin', '\\cos')
 * @param {string|number} value The frequency as a string constant,
 * or a numeric value [0...2000]
 * @param {...string}
 * @memberof module:definitions
 * @private
 */
function frequency(value, ...symbols) {
    const v = typeof value === 'string' ? FREQUENCY_VALUE[value] : value;

    symbols.forEach(symbol => {
        if (MATH_SYMBOLS[symbol]) {
            MATH_SYMBOLS[symbol].frequency = v;
            MATH_SYMBOLS[symbol].category = gCategory;
        }
        if (FUNCTIONS[symbol]) {
            // Make a copy of the entry, since it could be shared by multiple
            // symbols
            FUNCTIONS[symbol] = {
                ...FUNCTIONS[symbol],
                frequency: v,
                category: gCategory,
            };
        }
    });
}

gCategory = 'Trigonometry';

frequency(SUPERCOMMON, '\\cos', '\\sin', '\\tan');

frequency(
    UNCOMMON,
    '\\arcsin',
    '\\arccos',
    '\\arctan',
    '\\arctg',
    '\\arcctg',
    '\\arcsec',
    '\\arccsc'
);

frequency(
    UNCOMMON,
    '\\arsinh',
    '\\arccosh',
    '\\arctanh',
    '\\arcsech',
    '\\arccsch'
);

frequency(
    UNCOMMON,
    '\\arg',
    '\\ch',
    '\\cosec',
    '\\cosh',
    '\\cot',
    '\\cotg',
    '\\coth',
    '\\csc',
    '\\ctg',
    '\\cth',
    '\\lg',
    '\\lb',
    '\\sec',
    '\\sinh',
    '\\sh',
    '\\tanh',
    '\\tg',
    '\\th'
);

gCategory = 'Functions';

frequency(SUPERCOMMON, '\\ln', '\\log', '\\exp');

frequency(292, '\\hom');
frequency(COMMON, '\\dim');
frequency(COMMON, '\\ker', '\\deg'); // >2,000
frequency(SUPERCOMMON, '\\lim');
frequency(COMMON, '\\det');
frequency(COMMON, '\\mod');
frequency(COMMON, '\\min');
frequency(COMMON, '\\max');

gCategory = 'Decoration';

frequency(0, '\\rule');
frequency(0, '\\color');
frequency(3, '\\textcolor');

frequency(COMMON, '\\overline'); // > 2,000
frequency(COMMON, '\\underline'); // > 2,000
frequency(COMMON, '\\overset'); // > 2,000
frequency(COMMON, '\\underset'); // > 2,000
frequency(COMMON, '\\stackrel'); // > 2,000
frequency(0, '\\stackbin');
frequency(270, '\\rlap');
frequency(18, '\\llap');
frequency(CRYPTIC, '\\mathrlap');
frequency(CRYPTIC, '\\mathllap');
frequency(1236, '\\boxed');
frequency(CRYPTIC, '\\colorbox');
frequency(21, '\\over');
frequency(12, '\\atop');
frequency(1968, '\\choose');
/* \\substack: frequency 16 */

gCategory = 'Operators';

frequency(SUPERCOMMON, '\\sqrt');

gCategory = 'Styling';

frequency(SUPERCOMMON, '\\mathbb');
frequency(1081, '\\Bbb');
frequency(0, '\\mathcal');
frequency(COMMON, '\\mathfrak');
frequency(271, '\\frak');
frequency(COMMON, '\\mathscr');
frequency(UNCOMMON, '\\mathsf');
frequency(COMMON, '\\mathtt');
frequency(COMMON, '\\boldsymbol');
frequency(CRYPTIC, '\\cancel', '\\bcancel', '\\xcancel');
frequency(CRYPTIC, '\\enclose');
frequency(CRYPTIC, '\\bbox');
frequency(CRYPTIC, '\\fcolorbox');

// frequency(780, '\\tt');

frequency(COMMON, '\\textrm');
frequency(COMMON, '\\textit');
frequency(COMMON, '\\textsf');
frequency(COMMON, '\\texttt');
frequency(433, '\\textnormal');
frequency(COMMON, '\\textbf');
frequency(421, '\\textup');
frequency(819, '\\emph');
frequency(49, '\\em');

frequency(15, '\\overwithdelims');
frequency(COMMON, '\\atopwithdelims');

gCategory = 'Fractions';

// frequency(COMMON, '\\frac');
// frequency(UNCOMMON, '\\binom');
// frequency(RARE, '\\dfrac', '\\tfrac', '\\dbinom', '\\tbinom');

// frequency(RARE, '\\pdiff');
gCategory = 'Variable Sized Symbols';

frequency(SUPERCOMMON, '\\sum', '\\prod', '\\bigcap', '\\bigcup', '\\int');

frequency(COMMON, '\\bigoplus', '\\smallint', '\\iint', '\\oint');
frequency(RARE, '\\bigwedge', '\\bigvee');

frequency(756, '\\coprod');

frequency(723, '\\bigsqcup');
frequency(1241, '\\bigotimes');
frequency(150, '\\bigodot');
frequency(174, '\\biguplus');

frequency(878, '\\iiint');

frequency(97, '\\intop');

frequency(COMMON, '\\bar', '\\ddot', '\\acute', '\\tilde', '\\check');
frequency(1548, '\\breve');
frequency(735, '\\grave');
frequency(SUPERCOMMON, '\\vec');

gCategory = 'Quantifiers';
frequency(SUPERCOMMON, '\\forall', '\\exists', '\\nexists');

gCategory = '';

frequency(COMMON, '\\mid');
frequency(RARE, '\\top', '\\bot');

gCategory = 'Various';

frequency(COMMON, '\\sharp'); // >2,000
frequency(590, '\\flat');
frequency(278, '\\natural');
frequency(RARE, '\\#', '\\&');
frequency(172, '\\clubsuit');
frequency(ARCANE, '\\heartsuit', '\\spadesuit');
frequency(CRYPTIC, '\\diamondsuit');

frequency(COMMON, '\\differencedelta');

gCategory = 'Letters and Letter Like Forms';

frequency(SUPERCOMMON, '\\nabla');
frequency(SUPERCOMMON, '\\partial'); // >2,000

frequency(COMMON, '\\ell'); // >2,000
frequency(COMMON, '\\hbar'); // >2,000
frequency(COMMON, '\\hslash'); // >2,000
frequency(3, '\\Finv');
frequency(1, '\\Game');

frequency(1306, '\\wp');
frequency(77, '\\eth');

frequency(138, '\\mho');
frequency(509, '\\pounds');
frequency(57, '\\yen');
frequency(4, '\\euro'); // NOTE: not TeX built-in, but textcomp package

gCategory = 'Crosses';

frequency(COMMON, '\\dagger'); // >2000
frequency(COMMON, '\\dag'); // >2000 results
frequency(500, '\\ddag'); // 500 results in latexsearch
frequency(353, '\\ddagger'); // 353 results in latexsearch
frequency(24, '\\maltese');

gCategory = 'Arrows';

frequency(SUPERCOMMON, '\\longrightarrow'); // >2,000
frequency(SUPERCOMMON, '\\rightarrow'); // >2,000
frequency(SUPERCOMMON, '\\Longrightarrow'); // See \\implies
frequency(SUPERCOMMON, '\\Rightarrow'); // >2,000

frequency(COMMON, '\\longmapsto'); // >2,000
frequency(COMMON, '\\mapsto'); // >2,000

frequency(COMMON, '\\Longleftrightarrow'); // >2,000

frequency(COMMON, '\\rightleftarrows'); // >2,000

frequency(COMMON, '\\leftarrow'); // >2,000

frequency(COMMON, '\\curvearrowleft'); // >2,000

frequency(COMMON, '\\uparrow'); // >2,000
frequency(COMMON, '\\downarrow'); // >2,000

frequency(COMMON, '\\hookrightarrow'); // >2,000
frequency(COMMON, '\\rightharpoonup'); // >2,000
frequency(COMMON, '\\rightleftharpoons'); // >2,000

frequency(1695, '\\Leftarrow');
frequency(1599, '\\longleftrightarrow');
frequency(878, '\\longleftarrow');
frequency(296, '\\Longleftarrow');

frequency(1609, '\\searrow');
frequency(1301, '\\nearrow');
frequency(167, '\\swarrow');
frequency(108, '\\nwarrow');

frequency(257, '\\Uparrow');
frequency(556, '\\Downarrow');
frequency(192, '\\updownarrow');
frequency(161, '\\Updownarrow');

frequency(115, '\\hookleftarrow');
frequency(93, '\\leftharpoonup');
frequency(42, '\\leftharpoondown');
frequency(80, '\\rightharpoondown');

frequency(765, '\\leftrightarrows');

frequency(311, '\\dashrightarrow');
frequency(5, '\\dashleftarrow');
frequency(8, '\\leftleftarrows');
frequency(7, '\\Lleftarrow');
frequency(32, '\\twoheadleftarrow');
frequency(25, '\\leftarrowtail');
frequency(6, '\\looparrowleft');
frequency(205, '\\leftrightharpoons');
frequency(105, '\\circlearrowleft');
frequency(11, '\\Lsh');
frequency(15, '\\upuparrows');
frequency(21, '\\downharpoonleft');
frequency(108, '\\multimap');
frequency(31, '\\leftrightsquigarrow');
frequency(835, '\\twoheadrightarrow');
frequency(195, '\\rightarrowtail');
frequency(37, '\\looparrowright');
frequency(209, '\\curvearrowright');
frequency(63, '\\circlearrowright');
frequency(18, '\\Rsh');
frequency(6, '\\downdownarrows');
frequency(579, '\\upharpoonright');
frequency(39, '\\downharpoonright');
frequency(674, '\\rightsquigarrow');
frequency(709, '\\leadsto');
frequency(62, '\\Rrightarrow');
frequency(29, '\\restriction');
frequency(CRYPTIC, '\\upharpoonleft');
frequency(CRYPTIC, '\\rightrightarrows');

// AMS Negated Arrows
gCategory = 'Negated Arrows';
frequency(324, '\\nrightarrow');
frequency(107, '\\nRightarrow');
frequency(36, '\\nleftrightarrow');
frequency(20, '\\nLeftrightarrow');
frequency(7, '\\nleftarrow');
frequency(5, '\\nLeftarrow');

// AMS Negated Binary Relations
gCategory = 'Negated Relations';
frequency(146, '\\nless');
frequency(58, '\\nleqslant');
frequency(54, '\\lneq');
frequency(36, '\\lneqq');
frequency(18, '\\nleqq');

frequency(253, '\\unlhd');
frequency(66, '\\unrhd');

frequency(6, '\\lvertneqq');
frequency(4, '\\lnsim');
frequency(CRYPTIC, '\\lnapprox');
frequency(71, '\\nprec');
frequency(57, '\\npreceq');
frequency(4, '\\precnsim');
frequency(2, '\\precnapprox');
frequency(40, '\\nsim');
frequency(1, '\\nshortmid');
frequency(417, '\\nmid');
frequency(266, '\\nvdash');
frequency(405, '\\nvDash');
frequency(90, '\\ngtr');
frequency(23, '\\ngeqslant');
frequency(12, '\\ngeqq');
frequency(29, '\\gneq');
frequency(35, '\\gneqq');
frequency(6, '\\gvertneqq');
frequency(3, '\\gnsim');
frequency(CRYPTIC, '\\gnapprox');
frequency(44, '\\nsucc');
frequency(CRYPTIC, '\\nsucceq');
frequency(4, '\\succnsim');
frequency(CRYPTIC, '\\succnapprox');
frequency(128, '\\ncong');
frequency(6, '\\nshortparallel');
frequency(54, '\\nparallel');
frequency(5, '\\nVDash');
frequency(1, '\\nsupseteqq');
frequency(286, '\\supsetneq');
frequency(2, '\\varsupsetneq');
frequency(49, '\\supsetneqq');
frequency(3, '\\varsupsetneqq');
frequency(179, '\\nVdash');
frequency(11, '\\precneqq');
frequency(3, '\\succneqq');
frequency(16, '\\nsubseteqq');

// AMS Misc
gCategory = 'Various';
frequency(1025, '\\checkmark');

frequency(440, '\\diagup');
frequency(175, '\\diagdown');

frequency(271, '\\measuredangle');
frequency(156, '\\sphericalangle');

frequency(104, '\\backprime');
frequency(CRYPTIC, '\\backdoubleprime');

gCategory = 'Shapes';

frequency(SUPERCOMMON, '\\ast'); // >2,000
frequency(COMMON, '\\star'); // >2,000
frequency(1356, '\\diamond');
frequency(695, '\\Diamond');
frequency(422, '\\lozenge');
frequency(344, '\\blacklozenge');
frequency(168, '\\bigstar');

// AMS Hebrew
gCategory = 'Hebrew';
frequency(1381, '\\aleph');
frequency(54, '\\beth');
frequency(43, '\\daleth');
frequency(36, '\\gimel');

gCategory = 'Fences';

frequency(SUPERCOMMON, '\\lbrace'); // >2,000
frequency(SUPERCOMMON, '\\rbrace'); // >2,000
frequency(COMMON, '\\langle'); // >2,000
frequency(COMMON, '\\rangle');
frequency(COMMON, '\\lfloor'); // >2,000
frequency(COMMON, '\\rfloor'); // >2,000
frequency(COMMON, '\\lceil'); // >2,000
frequency(COMMON, '\\rceil'); // >2,000

frequency(SUPERCOMMON, '\\vert'); // >2,000

frequency(496, '\\lvert');
frequency(496, '\\rvert');
frequency(SUPERCOMMON, '\\Vert'); // >2,000
frequency(287, '\\lVert');
frequency(CRYPTIC, '\\rVert');
frequency(574, '\\lbrack');
frequency(213, '\\rbrack');
frequency(296, '\\ulcorner');
frequency(310, '\\urcorner');
frequency(137, '\\llcorner');
frequency(199, '\\lrcorner');
frequency(24, '\\lgroup');
frequency(24, '\\rgroup');
frequency(CRYPTIC, '\\lmoustache');
frequency(CRYPTIC, '\\rmoustache');

gCategory = 'Relations';

frequency('=', SUPERCOMMON);
frequency(SUPERCOMMON, '\\ne'); // >2,000
frequency(COMMON, '\\neq'); // >2,000
frequency('<', SUPERCOMMON); // >2,000
frequency(COMMON, '\\lt'); // >2,000
frequency('>', SUPERCOMMON); // >2,000
frequency(COMMON, '\\gt'); // >2,000

frequency(COMMON, '\\le'); // >2,000
frequency(COMMON, '\\ge'); // >2,000

frequency(SUPERCOMMON, '\\leqslant'); // > 2,000
frequency(SUPERCOMMON, '\\geqslant'); // > 2,000

frequency(COMMON, '\\leq'); // >2,000
frequency(COMMON, '\\geq'); // >2,000
frequency(COMMON, '\\gg'); // >2,000
frequency(5, '\\coloneq');
frequency(COMMON, '\\cong'); // >2,000

frequency(COMMON, '\\equiv'); // >2,000

frequency(COMMON, '\\prec'); // >2,000
frequency(COMMON, '\\preceq'); // >2,000
frequency(COMMON, '\\succ'); // >2,000
frequency(1916, '\\succeq');

frequency(COMMON, '\\perp'); // > 2,000
frequency(COMMON, '\\parallel'); // >2,000

frequency(COMMON, '\\propto'); // > 2,000

frequency(COMMON, '\\smile'); // > 2,000
frequency(COMMON, '\\frown'); // > 2,000

frequency(COMMON, '\\sim'); // >2,000
frequency(COMMON, '\\gtrsim'); // >2,000

frequency(SUPERCOMMON, '\\approx'); // >2,000

frequency(147, '\\approxeq');
frequency(377, '\\thickapprox');
frequency(146, '\\lessapprox');
frequency(95, '\\gtrapprox');
frequency(50, '\\precapprox');
frequency(CRYPTIC, '\\succapprox');

frequency(779, '\\thicksim');
frequency(251, '\\succsim');
frequency(104, '\\precsim');
frequency(251, '\\backsim');
frequency(62, '\\eqsim');
frequency(91, '\\backsimeq');
frequency(CRYPTIC, '\\simeq');
frequency(CRYPTIC, '\\lesssim');

frequency(369, '\\nleq');
frequency(164, '\\ngeq');

frequency(31, '\\smallsmile');
frequency(71, '\\smallfrown');
frequency(558, '\\bowtie');

frequency(755, '\\asymp');

frequency(1255, '\\sqsubseteq');
frequency(183, '\\sqsupseteq');

frequency(1356, '\\leqq');
frequency(15, '\\eqslantless');

frequency(157, '\\lll');
frequency(281, '\\lessgtr');
frequency(134, '\\lesseqgtr');
frequency(CRYPTIC, '\\lesseqqgtr');
frequency(8, '\\risingdotseq');
frequency(99, '\\fallingdotseq');
frequency(82, '\\subseteqq');
frequency('\u22d0', '\\Subset');
frequency(309, '\\sqsubset');
frequency(549, '\\preccurlyeq');
frequency(14, '\\curlyeqprec');
frequency(646, '\\vDash');
frequency(20, '\\Vvdash');
frequency(13, '\\bumpeq');
frequency(12, '\\Bumpeq');
frequency(972, '\\geqq');
frequency(13, '\\eqslantgtr');
frequency(127, '\\ggg');
frequency(417, '\\gtrless');
frequency(190, '\\gtreqless');
frequency(91, '\\gtreqqless');

frequency(6, '\\supseteqq');
frequency(34, '\\Supset');
frequency(71, '\\sqsupset');
frequency(442, '\\succcurlyeq');
frequency(10, '\\curlyeqsucc');
frequency(276, '\\Vdash');
frequency(67, '\\shortmid');
frequency(17, '\\shortparallel');
frequency(110, '\\between');
frequency(66, '\\pitchfork');
frequency(203, '\\varpropto');
frequency(176, '\\backepsilon');
frequency(CRYPTIC, '\\llless');
frequency(CRYPTIC, '\\gggtr');
frequency(447, '\\lhd');
frequency(338, '\\rhd');
frequency(35, '\\Join');

frequency(1450, '\\doteq');
frequency(60, '\\doteqdot');
frequency(CRYPTIC, '\\Doteq');
frequency(6, '\\eqcirc');
frequency(31, '\\circeq');
frequency(88, '\\lessdot');
frequency(45, '\\gtrdot');

gCategory = 'Logic';

frequency(SUPERCOMMON, '\\leftrightarrow'); // >2,000
frequency(SUPERCOMMON, '\\Leftrightarrow'); // >2,000
frequency(SUPERCOMMON, '\\to'); // >2,000
frequency(COMMON, '\\models'); // >2,000
frequency(COMMON, '\\vdash'); // >2,000

frequency(1129, '\\therefore');
frequency(388, '\\because');
frequency(1858, '\\implies');
frequency(150, '\\gets');
frequency(299, '\\dashv');
frequency(CRYPTIC, '\\impliedby');
frequency(CRYPTIC, '\\biconditional');
frequency(CRYPTIC, '\\roundimplies');

gCategory = 'Operators';

frequency(COMMON, '\\pm'); // > 2,000
frequency(COMMON, '\\mp'); // > 2,000
frequency(COMMON, '\\times'); // > 2,000
frequency(COMMON, '\\div'); // > 2,000
frequency(COMMON, '\\surd'); // > 2,000
frequency(CRYPTIC, '\\divides');
frequency(576, '\\ltimes');
frequency(946, '\\rtimes');
frequency(34, '\\leftthreetimes');
frequency(14, '\\rightthreetimes');
frequency(478, '\\intercal');
frequency(81, '\\dotplus');
frequency(271, '\\centerdot');
frequency(5, '\\doublebarwedge');
frequency(51, '\\divideontimes');
frequency(CRYPTIC, '\\cdot');

gCategory = 'Others';

frequency(SUPERCOMMON, '\\infty'); // >2,000
frequency(SUPERCOMMON, '\\prime'); // >2,000
frequency(COMMON, '\\angle'); // >2,000

gCategory = 'Greek';

frequency(COMMON, '\\alpha'); // >2,000
frequency(COMMON, '\\beta'); // >2,000
frequency(COMMON, '\\gamma'); // >2,000
frequency(COMMON, '\\delta'); // >2,000
frequency(COMMON, '\\epsilon'); // >2,000
frequency(COMMON, '\\zeta'); // >2,000
frequency(COMMON, '\\eta'); // >2,000
frequency(COMMON, '\\theta'); // >2,000
frequency(COMMON, '\\vartheta'); // >2,000
frequency(COMMON, '\\iota'); // >2,000
frequency(COMMON, '\\kappa'); // >2,000
frequency(COMMON, '\\varkappa'); // >2,000
frequency(COMMON, '\\lambda'); // >2,000
frequency(COMMON, '\\mu'); // >2,000
frequency(COMMON, '\\nu'); // >2,000
frequency(COMMON, '\\xi'); // >2,000
frequency(COMMON, '\\pi'); // >2,000
frequency(COMMON, '\\varpi'); // >2,000
frequency(COMMON, '\\rho'); // >2,000
frequency(COMMON, '\\varrho'); // >2,000
frequency(COMMON, '\\sigma'); // >2,000
frequency(COMMON, '\\varsigma'); // >2,000
frequency(COMMON, '\\tau'); // >2,000
frequency(COMMON, '\\phi'); // >2,000
frequency(COMMON, '\\varphi'); // >2,000
frequency(COMMON, '\\upsilon'); // >2,000
frequency(COMMON, '\\chi'); // >2,000
frequency(COMMON, '\\psi'); // >2,000
frequency(COMMON, '\\omega'); // >2,000
frequency(COMMON, '\\Gamma'); // >2,000
frequency(COMMON, '\\Delta'); // >2,000
frequency(COMMON, '\\Theta'); // >2,000
frequency(COMMON, '\\Lambda'); // >2,000
frequency(COMMON, '\\Xi'); // >2,000
frequency(COMMON, '\\Pi'); // >2,000
frequency(COMMON, '\\Sigma'); // >2,000
frequency(COMMON, '\\Upsilon'); // >2,000
frequency(COMMON, '\\Phi'); // >2,000
frequency(COMMON, '\\Psi'); // >2,000
frequency(COMMON, '\\Omega'); // >2,000
frequency(248, '\\digamma');

gCategory = 'Others';

frequency(SUPERCOMMON, '\\emptyset'); // >2,000
frequency(SUPERCOMMON, '\\varnothing'); // >2,000

gCategory = 'Set Operators';

frequency(SUPERCOMMON, '\\cap');
frequency(SUPERCOMMON, '\\cup');
frequency(COMMON, '\\setminus'); // >2,000
frequency(254, '\\smallsetminus');
frequency(200, '\\complement');

gCategory = 'Set Relations';

frequency(SUPERCOMMON, '\\in'); // >2,000
frequency(SUPERCOMMON, '\\notin'); // >2,000
frequency(COMMON, '\\not');
frequency(COMMON, '\\ni'); // >2,000
frequency(18, '\\owns');
frequency(SUPERCOMMON, '\\subset'); // >2,000
frequency(SUPERCOMMON, '\\supset'); // >2,000
frequency(SUPERCOMMON, '\\subseteq'); // >2,000
frequency(SUPERCOMMON, '\\supseteq'); // >2,000
frequency(1945, '\\subsetneq');
frequency(198, '\\varsubsetneq');
frequency(314, '\\subsetneqq');
frequency(55, '\\varsubsetneqq');
frequency(CRYPTIC, '\\nsubset'); // NOTE: Not TeX?
frequency(CRYPTIC, '\\nsupset'); // NOTE: Not TeX?
frequency(950, '\\nsubseteq');
frequency(672, '\\nsupseteq', AMS, REL, '\u2289', 49);

gCategory = 'Spacing';

defineSymbol('\\enspace');
frequency(COMMON, '\\quad'); // >2,000
frequency(COMMON, '\\qquad'); // >2,000

gCategory = 'Punctuation';
frequency(COMMON, '\\colon'); // >2,000
frequency(COMMON, '\\cdotp'); // >2,000
frequency(COMMON, '\\ldots'); // >2,000
frequency(COMMON, '\\cdots'); // >2,000
frequency(COMMON, '\\ddots'); // >2,000
frequency(91, '\\mathellipsis');
frequency(COMMON, '\\vdots'); // >2,000
frequency(18, '\\ldotp');

gCategory = 'Logical Operators';
frequency(SUPERCOMMON, '\\wedge'); // >2,000
frequency(SUPERCOMMON, '\\vee'); // >2,000

frequency(COMMON, '\\lnot'); // >2,000
frequency(SUPERCOMMON, '\\neg'); // >2,000

frequency(659, '\\land');
frequency(364, '\\lor');
frequency(21, '\\barwedge');
frequency(43, '\\veebar');
frequency(7, '\\nor'); // NOTE: Not TeXematica
frequency(58, '\\curlywedge');
frequency(57, '\\curlyvee');

gCategory = 'Boxes';
frequency(COMMON, '\\square'); // >2,000
frequency(COMMON, '\\Box'); // >2,000
frequency(1679, '\\blacksquare');
frequency(79, '\\boxminus');
frequency(276, '\\boxplus');
frequency(457, '\\boxtimes');
frequency(120, '\\boxdot');

gCategory = 'Circles';
frequency(SUPERCOMMON, '\\circ'); // >2,000
frequency(903, '\\bigcirc');
frequency(COMMON, '\\bullet'); // >2,000
frequency(COMMON, '\\circleddash'); // >2,000
frequency(339, '\\circledast');
frequency(COMMON, '\\oplus'); // >2,000
frequency(1568, '\\ominus');
frequency(COMMON, '\\otimes'); // >2,000
frequency(COMMON, '\\odot'); // >2,000
frequency(93, '\\circledcirc');
frequency(497, '\\oslash');
frequency(31, '\\circledS');
frequency(1329, '\\circledR');

gCategory = 'Triangles';
frequency(COMMON, '\\triangle'); // > 2,000
frequency(COMMON, '\\triangleq'); // >2,000
frequency(1773, '\\bigtriangleup');
frequency(762, '\\vartriangle');

frequency(520, '\\triangledown');
frequency(661, '\\bigtriangledown');

frequency(534, '\\triangleleft');
frequency(281, '\\vartriangleleft');
frequency(176, '\\trianglelefteq');
frequency(13, '\\ntriangleleft');
frequency(22, '\\ntrianglelefteq');

frequency(516, '\\triangleright');
frequency(209, '\\vartriangleright');
frequency(45, '\\trianglerighteq');
frequency(15, '\\ntriangleright');
frequency(6, '\\ntrianglerighteq');

frequency(360, '\\blacktriangle');
frequency(159, '\\blacktriangledown');
frequency(101, '\\blacktriangleleft');
frequency(1717, '\\blacktriangleright');

gCategory = 'Big Operators';

frequency(63, '\\sqcup');
frequency(735, '\\sqcap');
frequency(597, '\\uplus');
frequency(286, '\\wr');
frequency(2, '\\Cap');
frequency(2, '\\Cup');
frequency(1, '\\doublecap');
frequency(1, '\\doublecup');
frequency(CRYPTIC, '\\amalg');
