/// ^.*('\\.*').*
import { FUNCTIONS, MATH_SYMBOLS } from '../core-definitions/definitions';

// Frequency of a symbol.
// String constants corresponding to frequency values,
// which are the number of results returned by latexsearch.com
// When the precise number is known, it is provided. Otherwise,
// the following constants are used to denote an estimate.
export const CRYPTIC = 0;
export const ARCANE = 200;
export const VERY_RARE = 'VERY_RARE';
export const RARE = 1200;
export const UNCOMMON = 2000;
export const COMMON = 3000;
export const SUPERCOMMON = 4000;

/*
 * Set the metadata for the specified symbols
 *
 * metadata('Functions', ['\\sin', '\\cos'], COMMON, '$0{a}')
 *
 */
function metadata(
  category,
  symbols,
  frequency = COMMON,
  template = '$0'
): void {
  symbols.forEach((symbol) => {
    if (MATH_SYMBOLS[symbol]) {
      MATH_SYMBOLS[symbol].frequency = frequency;
      MATH_SYMBOLS[symbol].category = category;
      MATH_SYMBOLS[symbol].template = template.replace(/\$0/g, symbol);
    }

    if (FUNCTIONS[symbol]) {
      // Make a copy of the entry, since it could be shared by multiple
      // symbols
      FUNCTIONS[symbol] = {
        ...FUNCTIONS[symbol],
        frequency,
        category,
        template: template.replace(/\$0/g, symbol),
      };
    }
  });
}

metadata('Trigonometry', ['\\cos', '\\sin', '\\tan'], SUPERCOMMON);

metadata(
  'Trigonometry',
  [
    '\\arcsin',
    '\\arccos',
    '\\arctan',
    '\\arctg',
    '\\arcctg',
    '\\arcsec',
    '\\arccsc',
    '\\arsinh',
    '\\arcosh',
    '\\artanh',
    '\\arcsech',
    '\\arccsch',
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
    '\\th',
  ],
  UNCOMMON
);

metadata('Functions', ['\\ln', '\\log', '\\exp', '\\lim'], SUPERCOMMON);

metadata(
  'Functions',
  ['\\dim', '\\ker', '\\deg', '\\det', '\\mod', '\\min', '\\max'],
  COMMON
);
metadata('Functions', ['\\hom'], RARE);

metadata('Decoration', ['\\rule'], ARCANE, '$0{2em}{1em}');

metadata(
  'Decoration',
  ['\\color', '\\textcolor'],
  ARCANE,
  '{$0{m0}A}{$0{m1}B}{$0{m2}C }{$0{m3}a}{$0{m4}b}{$0{m5}c}{$0{m6}8}'
);
metadata(
  'Decoration',
  ['\\overline', '\\underline'],
  COMMON,
  '$0{\\placeholder{}}'
);
metadata(
  'Decoration',
  ['\\enclose'],
  RARE,
  '\\enclose{updiagonalstrike,roundedbox}[1px solid red, mathbackground="#fbc0bd"]{x=0}'
);
metadata(
  'Decoration',
  ['\\fcolorbox'],
  RARE,
  '\\fcolorbox{#cd0030}{#ffd400}{\\unicode{"2B1A}}'
);

metadata(
  'Decoration',
  ['\\colorbox'],
  RARE,
  '\\colorbox{#fbc0bd}{\\unicode{"2B1A}}'
);

metadata(
  'Decoration',
  ['\\boxed', '\\cancel', '\\bcancel', '\\xcancel'],
  RARE,
  '$0{\\placeholder{}}'
);

metadata(
  'Decoration',
  ['\\bbox'],
  RARE,
  '\\bbox[#ffd400, solid 2px #ffd400]{\\unicode{"2B1A}}'
);

metadata('Styling', ['\\mathbb'], SUPERCOMMON, '$0{Don Knuth}');
metadata(
  'Styling',
  [
    '\\textbf',
    '\\textup',
    '\\textit',
    '\\textrm',
    '\\textsf',
    '\\texttt',
    '\\textnormal',
    '\\textmd',
    '\\textsl',
    '\\textsc',

    '\\mathsf',
    '\\mathtt',
    '\\mathrm',
    '\\mathfrak',
    '\\mathcal',
    '\\mathscr',
    '\\mathbf',
    '\\mathmd',
    '\\mathit',
    '\\text',
    '\\mbox',
    '\\Bbb',
    '\\bold',
    '\\bm',
    '\\boldsymbol',
  ],
  COMMON,
  '$0{Don Knuth}'
);
metadata(
  'Styling',
  [
    '\\frak',
    '\\tt',
    '\\bf',
    '\\it',
    '\\rmfamily', // Note: In LaTeX, /rmfamily is a no-op in math mode
    '\\sffamily',
    '\\ttfamily',
    '\\class',
    '\\cssId',
    '\\htmlData',
  ],
  RARE,
  '{$0 Don Knuth}'
);
metadata(
  'Styling',
  ['\\bfseries', '\\mdseries', '\\upshape', '\\slshape', '\\scshape'],
  RARE,
  '\\text{$0 Don Knuth}'
);

metadata(
  'Styling',
  ['\\class', '\\cssId'],
  RARE,
  '$0{testIdentifier}{Don Knuth}'
);

// Note: In LaTeX, \fontseries, \fontfamily, \fontshape are applicable to
// text mode only
metadata('Styling', ['\\fontseries'], RARE, '\\text{$0{b}Don Knuth}');
metadata('Styling', ['\\fontfamily'], RARE, '\\text{$0{cmtt}Don Knuth}');
metadata('Styling', ['\\fontshape'], RARE, '\\text{$0{sc}Don Knuth}');
metadata('Styling', ['\\selectfont'], RARE, '\\text{$0}'); // No-op, but only valid in text mode

metadata('Styling', ['\\emph'], RARE, 'Don$0{Knuth}');
metadata('Styling', ['\\em'], RARE, 'Don{$0 Knuth}');

metadata(
  'Layout',
  [
    '\\mathop',
    '\\mathbin',
    '\\mathrel',
    '\\mathopen',
    '\\mathclose',
    '\\mathpunct',
    '\\mathord',
    '\\mathinner',
    '\\operatorname',
    '\\operatorname*',
  ],
  RARE,
  'x=$0{arg}=0'
);
metadata('Layout', ['\\middle'], RARE, '\\left\\{x$0|x>0\\right\\}');
metadata(
  'Layout',
  ['\\overset', '\\underset', '\\stackrel', '\\stackbin'],
  RARE,
  '$0{arg}{x=0}'
);

metadata('Layout', ['\\rlap', '\\mathrlap'], RARE, '$0{/}0');
metadata('Layout', ['\\llap', '\\mathllap'], RARE, 'o$0{/}');

metadata(
  'Fractions',
  ['\\frac'],
  SUPERCOMMON,
  '$0{\\placeholder{}}{\\placeholder{}}'
);
metadata(
  'Fractions',
  [
    '\\binom',
    '\\dfrac',
    '\\tfrac',
    '\\dbinom',
    '\\tbinom',
    '\\pdiff',
    '\\cfrac',
  ],
  RARE,
  '$0{\\placeholder{}}{\\placeholder{}}'
);
metadata(
  'Fractions',
  ['\\over', '\\atop', '\\choose'],
  RARE,
  '\\unicode{"2B1A} $0 \\unicode{"2B1A}'
);
metadata(
  'Fractions',
  ['\\overwithdelims', '\\atopwithdelims'],
  RARE,
  '{\\unicode{"2B1A} $0{\\lbrace}{\\rbrace} \\unicode{"2B1A}}'
);

metadata(
  'Extensible Operators',
  ['\\sum', '\\prod', '\\bigcap', '\\bigcup', '\\int'],
  SUPERCOMMON
);
metadata(
  'Extensible Operators',
  ['\\bigoplus', '\\smallint', '\\iint', '\\oint'],
  COMMON
);
metadata(
  'Extensible Operators',
  [
    '\\bigwedge',
    '\\bigvee',
    '\\coprod',

    '\\bigsqcup',
    '\\bigotimes',
    '\\bigodot',
    '\\biguplus',

    '\\intop',
    '\\sqcup',
    '\\sqcap',
    '\\uplus',
    '\\wr',
    '\\Cap',
    '\\Cup',
    '\\doublecap',
    '\\doublecup',
    '\\amalg',

    '\\iiint',
    '\\oiint',
    '\\oiiint',
    '\\intclockwise',
    '\\varointclockwise',
    '\\ointctrclockwise',
    '\\intctrclockwise',
  ],
  RARE
);

metadata('Accents', ['\\vec'], SUPERCOMMON);
metadata(
  'Accents',
  ['\\bar', '\\ddot', '\\acute', '\\tilde', '\\check'],
  COMMON,
  '$0{\\placeholder{}}'
);
metadata('Accents', ['\\^', '\\`', "\\'"], RARE, '$0{e}');
metadata('Accents', ['\\c'], RARE, '$0{c}');
metadata('Accents', ['\\~'], RARE, '$0{n}');
metadata(
  'Accents',
  ['\\mathring', '\\hat', '\\dot', '\\breve', '\\grave'],
  RARE,
  '$0{\\placeholder{}}'
);

metadata(
  'Extensible Symbols',
  [
    '\\overrightarrow',
    '\\overleftarrow',
    '\\Overrightarrow',
    '\\overleftharpoon',
    '\\overrightharpoon',
    '\\overleftrightarrow',
    '\\overbrace',
    '\\overlinesegment',
    '\\overgroup',
    '\\widehat',
    '\\widecheck',
    '\\widetilde',
  ],
  COMMON,
  '$0{ABC}'
);

metadata(
  'Extensible Symbols',
  [
    '\\underrightarrow',
    '\\underleftarrow',
    '\\underleftrightarrow',
    '\\underbrace',
    '\\underlinesegment',
    '\\undergroup',
    '\\utilde',
  ],
  COMMON,
  '$0{ABC}'
);

metadata(
  'Sizing',
  [
    '\\tiny',
    '\\scriptsize',
    '\\footnotesize',
    '\\small',
    '\\normalsize',
    '\\large',
    '\\Large',
    '\\LARGE',
    '\\huge',
    '\\Huge',
  ],
  RARE,
  '$0{x=0}'
);

metadata('Sizing', ['\\big', '\\Big', '\\bigg', '\\Bigg'], RARE, '$0($0)');
metadata('Sizing', ['\\bigl', '\\Bigl', '\\biggl', '\\Biggl'], RARE, '$0(');
metadata('Sizing', ['\\bigr', '\\Bigr', '\\biggr', '\\Biggr'], RARE, '$0)');
metadata('Sizing', ['\\bigm', '\\Bigm', '\\biggm', '\\Biggm'], RARE, '$0|');

metadata(
  'Letterlike Symbols',
  [
    '\\nabla',
    '\\partial',
    '\\N',
    '\\R',
    '\\Q',
    '\\C',
    '\\Z',
    '\\exponentialE',
    '\\forall',
    '\\exists',
    '\\nexists',
  ],
  SUPERCOMMON
);

metadata(
  'Letterlike Symbols',
  [
    '\\doubleStruckCapitalP',
    '\\P',
    '\\ell',
    '\\hbar',
    '\\hslash',
    '\\imath',
    '\\jmath',
    '\\imaginaryI',
    '\\imaginaryJ',
    '\\differentialD',
    '\\rd',
    '\\capitalDifferentialD',
    '\\doubleStruckCapitalN',
    '\\doubleStruckCapitalR',
    '\\doubleStruckCapitalQ',
    '\\doubleStruckCapitalC',
    '\\doubleStruckCapitalZ',
    '\\rD',
    '\\differencedelta',
    '\\mid',
    '@',
    '\\Re',
    '\\Im',
    '\\$',
    '\\%',
    '\\And',
    '\\degree',
  ],
  COMMON
);
metadata(
  'Letterlike Symbols',
  [
    '\\top',
    '\\bot',
    '\\scriptCapitalE',
    '\\scriptCapitalH',
    '\\scriptCapitalL',
    '\\gothicCapitalC',
    '\\gothicCapitalH',
    '\\gothicCapitalI',
    '\\gothicCapitalR',
    '\\Bbbk',
    '\\Finv',
    '\\Game',
    '\\wp',
    '\\eth',
    '\\mho',
    '\\pounds',
    '\\yen',
    '\\euro',
  ],
  RARE
);

metadata('Crosses', ['\\dagger', '\\dag'], SUPERCOMMON);

metadata(
  'Crosses',
  ['\\ddag', '\\ddagger', '\\maltese', '\\textdagger', '\\textdaggerdbl'],
  RARE
);

metadata(
  'Various',
  [
    '\\checkmark',

    '\\diagup',
    '\\diagdown',

    '\\angle',
    '\\measuredangle',
    '\\sphericalangle',

    '\\prime',
    '\\doubleprime',
    '\\backprime',
    '\\backdoubleprime',
    '\\sharp',
    '\\flat',
    '\\natural',
    '\\&',
    '\\#',
    '\\clubsuit',
    '\\spadesuit',
    '\\diamondsuit',
    '\\heartsuit',
    '\\backslash',
    '\\infty',
    '/',
    '\\_',
    '\\/',
    '|',
    "'",
  ],
  RARE
);

metadata('Various', ['\\unicode'], RARE, '$0{"2B1A}');

metadata(
  'Arrows',
  ['\\longrightarrow', '\\rightarrow', '\\Longrightarrow', '\\Rightarrow'],
  SUPERCOMMON
);
metadata(
  'Arrows',
  [
    '\\longmapsto',
    '\\mapsto',
    '\\Longleftrightarrow',
    '\\rightleftarrows',
    '\\leftarrow',
    '\\curvearrowleft',
    '\\uparrow',
    '\\downarrow',
    '\\hookrightarrow',
    '\\rightharpoonup',
    '\\rightleftharpoons',
  ],
  COMMON
);
metadata(
  'Arrows',
  [
    '\\Leftarrow',
    '\\longleftrightarrow',
    '\\longleftarrow',
    '\\Longleftarrow',

    '\\searrow',
    '\\nearrow',
    '\\swarrow',
    '\\nwarrow',

    '\\Uparrow',
    '\\Downarrow',
    '\\updownarrow',
    '\\Updownarrow',

    '\\hookleftarrow',
    '\\leftharpoonup',
    '\\leftharpoondown',
    '\\rightharpoondown',

    '\\leftrightarrows',

    '\\dashrightarrow',
    '\\dashleftarrow',
    '\\leftleftarrows',
    '\\Lleftarrow',
    '\\twoheadleftarrow',
    '\\leftarrowtail',
    '\\looparrowleft',
    '\\leftrightharpoons',
    '\\circlearrowleft',
    '\\Lsh',
    '\\upuparrows',
    '\\downharpoonleft',
    '\\multimap',
    '\\leftrightsquigarrow',
    '\\twoheadrightarrow',
    '\\rightarrowtail',
    '\\looparrowright',
    '\\curvearrowright',
    '\\circlearrowright',
    '\\Rsh',
    '\\downdownarrows',
    '\\upharpoonright',
    '\\downharpoonright',
    '\\rightsquigarrow',
    '\\leadsto',
    '\\Rrightarrow',
    '\\restriction',
  ],
  RARE
);
metadata('Arrows', ['\\upharpoonleft', '\\rightrightarrows'], CRYPTIC);

// AMS Negated Arrows
metadata(
  'Negated Arrows',
  [
    '\\nrightarrow',
    '\\nRightarrow',
    '\\nleftrightarrow',
    '\\nLeftrightarrow',
    '\\nleftarrow',
    '\\nLeftarrow',
  ],
  RARE
);

metadata(
  'Extensible Symbols',
  [
    '\\xrightarrow',
    '\\xleftarrow',
    '\\xRightarrow',
    '\\xLeftarrow',
    '\\xleftharpoonup',
    '\\xleftharpoondown',
    '\\xrightharpoonup',
    '\\xrightharpoondown',
    '\\xlongequal',
    '\\xtwoheadleftarrow',
    '\\xtwoheadrightarrow',
    '\\xleftrightarrow',
    '\\xLeftrightarrow',
    '\\xrightleftharpoons',
    '\\xleftrightharpoons',
    '\\xhookleftarrow',
    '\\xhookrightarrow',
    '\\xmapsto',
    '\\xtofrom',
    '\\xrightleftarrows', // From mhchem.sty package
    '\\xrightequilibrium', // From mhchem.sty package
    '\\xleftequilibrium',
  ],
  RARE,
  '$0[below]{above}=0'
);

// AMS Negated Binary Relations
metadata(
  'Negated Relations',
  [
    '\\nless',
    '\\nleqslant',
    '\\lneq',
    '\\lneqq',
    '\\nleqq',

    '\\unlhd',
    '\\unrhd',

    '\\lvertneqq',
    '\\lnsim',
    '\\lnapprox',
    '\\nprec',
    '\\npreceq',
    '\\precnsim',
    '\\precnapprox',
    '\\nsim',
    '\\nshortmid',
    '\\nmid',
    '\\nvdash',
    '\\nvDash',
    '\\ngtr',
    '\\ngeqslant',
    '\\ngeqq',
    '\\gneq',
    '\\gneqq',
    '\\gvertneqq',
    '\\gnsim',
    '\\nsucc',
    '\\succnsim',
    '\\ncong',
    '\\nshortparallel',
    '\\nparallel',
    '\\nVDash',
    '\\nVdash',
    '\\precneqq',
    '\\succneqq',
    '\\gnapprox',
    '\\succnapprox',
    '\\nsucceq',
  ],
  RARE
);

// AMS Hebrew
metadata('Hebrew', ['\\aleph', '\\beth', '\\daleth', '\\gimel'], RARE);

metadata(
  'Fences',
  [
    '\\lbrace',
    '\\rbrace',
    '\\vert',
    '\\Vert',
    '\\{',
    '\\}',
    '(',
    ')',
    '[',
    ']',
  ],
  SUPERCOMMON
);
metadata(
  'Fences',
  [
    '\\langle',
    '\\rangle',
    '\\lfloor',
    '\\rfloor',
    '\\lceil',
    '\\rceil',
    '\\mvert',
    '\\|',
    '\\mVert',
  ],
  COMMON
);
metadata(
  'Fences',
  [
    '\\lvert',
    '\\rvert',
    '\\lVert',
    '\\rVert',
    '\\lbrack',
    '\\rbrack',
    '\\ulcorner',
    '\\urcorner',
    '\\llcorner',
    '\\lrcorner',
    '\\lgroup',
    '\\rgroup',
    '\\lmoustache',
    '\\rmoustache',
  ],
  RARE
);

metadata(
  'Relations',
  ['=', '\\ne', '\\neq', '<', '>', '\\leqslant', '\\geqslant', '\\approx'],
  SUPERCOMMON
);
metadata(
  'Relations',
  [
    '\\lt',
    '\\gt',
    '\\le',
    '\\ge',
    '\\leq',
    '\\geq',
    '\\gg',
    '\\cong',
    '\\equiv',
    '\\prec',
    '\\preceq',
    '\\succ',
    '\\perp',
    '\\parallel',
    '\\propto',
    '\\smile',
    '\\frown',
    '\\sim',
    '\\gtrsim',
  ],
  COMMON
);
metadata(
  'Relations',
  [
    '\\coloneq',
    '\\succeq',

    '\\approxeq',
    '\\thickapprox',
    '\\lessapprox',
    '\\gtrapprox',
    '\\precapprox',
    '\\succapprox',

    '\\thicksim',
    '\\succsim',
    '\\precsim',
    '\\backsim',
    '\\eqsim',
    '\\backsimeq',
    '\\simeq',
    '\\lesssim',

    '\\nleq',
    '\\ngeq',

    '\\smallsmile',
    '\\smallfrown',
    '\\bowtie',

    '\\asymp',

    '\\leqq',
    '\\eqslantless',

    '\\ll',

    '\\lll',
    '\\lessgtr',
    '\\lesseqgtr',
    '\\lesseqqgtr',
    '\\risingdotseq',
    '\\fallingdotseq',
    '\\preccurlyeq',
    '\\curlyeqprec',
    '\\vDash',
    '\\Vvdash',
    '\\bumpeq',
    '\\Bumpeq',
    '\\geqq',
    '\\eqslantgtr',
    '\\ggg',
    '\\gtrless',
    '\\gtreqless',
    '\\gtreqqless',

    '\\succcurlyeq',
    '\\curlyeqsucc',
    '\\Vdash',
    '\\shortmid',
    '\\shortparallel',
    '\\between',
    '\\pitchfork',
    '\\varpropto',
    '\\backepsilon',
    '\\llless',
    '\\gggtr',
    '\\lhd',
    '\\rhd',
    '\\Join',

    '\\doteq',
    '\\doteqdot',
    '\\Doteq',
    '\\eqcirc',
    '\\circeq',
    '\\lessdot',
    '\\gtrdot',
    '\\measeq',
    '\\eqdef',
    '\\questeq',
  ],
  RARE
);

metadata(
  'Logic',
  ['\\leftrightarrow', '\\Leftrightarrow', '\\to'],
  SUPERCOMMON
);
metadata('Logic', ['\\models', '\\vdash'], COMMON);
metadata(
  'Logic',
  [
    '\\therefore',
    '\\because',
    '\\implies',
    '\\gets',
    '\\dashv',
    '\\impliedby',
    '\\biconditional',
    '\\roundimplies',
  ],
  RARE
);

metadata('Operators', ['+', '-', '*', '\\cdot'], SUPERCOMMON);
metadata('Operators', ['\\sqrt'], SUPERCOMMON, '$0{\\placeholder{}}');

metadata('Operators', ['\\pm', '\\mp', '\\times', '\\div', '\\surd'], COMMON);

metadata(
  'Operators',
  [
    '\\ltimes',
    '\\rtimes',
    '\\leftthreetimes',
    '\\rightthreetimes',
    '\\intercal',
    '\\dotplus',
    '\\centerdot',
    '\\doublebarwedge',
    '\\divideontimes',
    '\\divides',
  ],
  RARE
);

metadata('Logic', ['\\wedge', '\\vee', '\\neg'], SUPERCOMMON);
metadata('Logic', ['\\lnot'], COMMON);
metadata(
  'Logic',
  [
    '\\land',
    '\\lor',
    '\\barwedge',
    '\\veebar',
    '\\nor',
    '\\curlywedge',
    '\\curlyvee',
  ],
  RARE
);

metadata(
  'Greek',
  [
    '\\alpha',
    '\\beta',
    '\\gamma',
    '\\delta',
    '\\epsilon',
    '\\varepsilon',
    '\\zeta',
    '\\eta',
    '\\theta',
    '\\vartheta',
    '\\iota',
    '\\kappa',
    '\\varkappa',
    '\\lambda',
    '\\mu',
    '\\nu',
    '\\xi',
    '\\pi',
    '\\varpi',
    '\\rho',
    '\\varrho',
    '\\sigma',
    '\\varsigma',
    '\\tau',
    '\\phi',
    '\\varphi',
    '\\upsilon',
    '\\chi',
    '\\psi',
    '\\omega',
    '\\Gamma',
    '\\Delta',
    '\\Theta',
    '\\Lambda',
    '\\Xi',
    '\\Pi',
    '\\Sigma',
    '\\Upsilon',
    '\\Phi',
    '\\Psi',
    '\\Omega',
    '\\digamma',
    '\\omicron',
  ],
  COMMON
);

metadata(
  'Sets',
  [
    '\\emptyset',
    '\\varnothing',
    '\\cap',
    '\\cup',
    '\\in',
    '\\notin',
    '\\subset',
    '\\supset',
    '\\subseteq',
    '\\supseteq',
    '\\sqsubseteq',
  ],
  SUPERCOMMON
);
metadata(
  'Sets',
  [
    '\\setminus',
    '\\not',
    '\\ni',
    '\\sqsupseteq',
    '\\nsupseteqq',
    '\\supsetneq',
    '\\varsupsetneq',
    '\\supsetneqq',
    '\\varsupsetneqq',
  ],
  COMMON
);
metadata(
  'Sets',
  [
    '\\smallsetminus',
    '\\complement',

    '\\owns',
    '\\subsetneq',
    '\\varsubsetneq',
    '\\subsetneqq',
    '\\varsubsetneqq',
    '\\nsubset',
    '\\nsupset',
    '\\nsubseteq',
    '\\nsupseteq',
    '\\nsubseteqq',
    '\\subseteqq',
    '\\Subset',
    '\\sqsubset',
    '\\supseteqq',
    '\\Supset',
    '\\sqsupset',
  ],
  RARE
);

metadata(
  'Spacing',
  ['\\space, \\quad', '\\qquad'],
  COMMON,
  '\\unicode{"203A}$0\\unicode{"2039}'
);
metadata(
  'Spacing',
  ['\\!', '\\,', '\\:', '\\;', '\\enskip', '\\enspace'],
  RARE,
  '\\unicode{"203A}$0\\unicode{"2039}'
);
metadata(
  'Spacing',
  ['\\hspace', '\\hspace*'],
  RARE,
  '\\unicode{"203A}$0{1em}\\unicode{"2039}'
);
metadata(
  'Punctuation',
  [
    '\\colon',
    '\\cdotp',
    '\\ldots',
    '\\cdots',
    '\\ddots',
    '\\vdots',
    '?',
    '!',
    ':',
    '"',
    ',',
    '.',
    ';',
  ],
  COMMON
);
metadata('Punctuation', ['\\mathellipsis', '\\ldotp', '\\Colon'], RARE);

metadata('Boxes', ['\\square', '\\Box'], COMMON);
metadata(
  'Boxes',
  ['\\blacksquare', '\\boxminus', '\\boxplus', '\\boxtimes', '\\boxdot'],
  RARE
);

metadata(
  'Circles',
  ['\\circ', '\\bullet', '\\circleddash', '\\oplus', '\\otimes'],
  COMMON
);
metadata(
  'Circles',
  [
    '\\bigcirc',
    '\\circledast',
    '\\ominus',
    '\\circledcirc',
    '\\oslash',
    '\\circledS',
    '\\circledR',
    '\\odot',
  ],
  RARE
);

metadata('Triangles', ['\\triangle', '\\triangleq'], COMMON);
metadata(
  'Triangles',
  [
    '\\bigtriangleup',
    '\\vartriangle',
    '\\triangledown',
    '\\bigtriangledown',
    '\\triangleleft',
    '\\vartriangleleft',
    '\\trianglelefteq',
    '\\ntriangleleft',
    '\\ntrianglelefteq',
    '\\triangleright',
    '\\vartriangleright',
    '\\trianglerighteq',
    '\\ntriangleright',
    '\\ntrianglerighteq',
    '\\blacktriangle',
    '\\blacktriangledown',
    '\\blacktriangleleft',
    '\\blacktriangleright',
  ],
  RARE
);

metadata('Shapes', ['\\ast', '\\star'], COMMON);
metadata(
  'Shapes',
  ['\\diamond', '\\Diamond', '\\lozenge', '\\blacklozenge', '\\bigstar'],
  RARE
);
