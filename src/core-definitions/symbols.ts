import { SpacingAtom } from '../core-atoms/spacing';

import {
  newSymbols,
  newSymbolRange,
  defineFunction,
} from './definitions-utils';

// See http://www.gang.umass.edu/~franz/latexmanual.pdf p. 139
// for a list of symbols and their Unicode value

// Simple characters allowed in math mode
newSymbols('0123456789/@.?!');
newSymbolRange(0x0041, 0x005a); // a-z
newSymbolRange(0x0061, 0x007a); // A-Z

// Quantifiers

newSymbols([
  ['\\forall', 0x2200],
  ['\\exists', 0x2203],
  ['\\nexists', 0x2204, 'mord', 'ams'],
  ['\\mid', 0x2223, 'mrel'],
  ['\\top', 0x22a4],
  ['\\bot', 0x22a5],
]);

// Misc Symbols

newSymbols([
  ['\\#', 0x0023],
  ['\\&', 0x0026],
  ['\\parallelogram', 0x25b1],
  ['\\spadesuit', 0x2660],
  ['\\heartsuit', 0x2661],
  ['\\diamondsuit', 0x2662],
  ['\\clubsuit', 0x2663],
  ['\\flat', 0x266d],
  ['\\natural', 0x266e],
  ['\\sharp', 0x266f],
]);

// DefineSymbol( '\\cross', 0xF4A0,  'mord',  MAIN], // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\transpose', 0xF3C7,  'mord',  MAIN], // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\conjugate', 'conj'],  MAIN,  'mord', 0xF3C8], // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\conjugatetranspose', 0xF3C9,  'mord',  MAIN], // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\hermitianconjugate', 0xF3CE,  'mord',  MAIN], // NOTE: not a real TeX symbol, but Mathematica

newSymbols([
  ['\\backslash', 0x005c],

  ['\\nabla', 0x2207],
  ['\\partial', 0x2202],

  ['\\ell', 0x2113],

  ['\\hbar', 0x210f],
  ['\\Q', 0x0051, 'mord', 'double-struck'], // NOTE: Check if standard LaTeX
  ['\\C', 0x0043, 'mord', 'double-struck'], // NOTE: Check if standard LaTeX
  ['\\P', 0x0050, 'mord', 'double-struck'], // NOTE: Check if standard LaTeX

  ['\\pounds', 0x00a3],
  ['\\euro', 0x20ac], // NOTE: not TeX built-in, but textcomp package

  // TODO Koppa, Stigma, Sampi
]);

// Arrow Symbols
newSymbols(
  [
    ['\\rightarrow', 0x2192],
    ['\\to', 0x2192],
    ['\\leftarrow', 0x2190],
    ['\\gets', 0x2190],
    ['\\Rightarrow', 0x21d2],
    ['\\Leftarrow', 0x21d0],
    ['\\longrightarrow', 0x27f6],
    ['\\longleftarrow', 0x27f5],
    ['\\Longrightarrow', 0x27f9],
    ['\\implies', 0x27f9],
    ['\\Longleftarrow', 0x27f8],
    ['\\impliedby', 0x27f8],

    ['\\longleftrightarrow', 0x27f7],
    ['\\biconditional', 0x27f7],
    ['\\Longleftrightarrow', 0x27fa],

    ['\\mapsto', 0x21a6],
    ['\\longmapsto', 0x27fc],

    ['\\uparrow', 0x2191],
    ['\\downarrow', 0x2193],
    ['\\Uparrow', 0x21d1],
    ['\\Downarrow', 0x21d3],
    ['\\updownarrow', 0x2195],
    ['\\Updownarrow', 0x21d5],

    ['\\hookrightarrow', 0x21aa],
    ['\\hookleftarrow', 0x21a9],

    ['\\rightharpoonup', 0x21c0],
    ['\\leftharpoonup', 0x21bc],
    ['\\rightharpoondown', 0x21c1],
    ['\\leftharpoondown', 0x21bd],

    ['\\searrow', 0x2198],
    ['\\nearrow', 0x2197],
    ['\\swarrow', 0x2199],
    ['\\nwarrow', 0x2196],

    ['\\originalof', 0x22b6],
    ['\\laplace', 0x22b6],
    ['\\imageof', 0x22b7],
    ['\\Laplace', 0x22b7],
  ],
  'mrel'
);

// 'ams' Misc
newSymbols([
  // 'ams' Delimiters

  ['\\lbrace', 0x007b, 'mopen'],
  ['\\rbrace', 0x007d, 'mclose'],
  ['\\lparen', 0x0028, 'mopen'], // mathtools.sty
  ['\\rparen', 0x0029, 'mclose'], // mathtools.sty
  ['\\langle', 0x27e8, 'mopen'],
  ['\\rangle', 0x27e9, 'mclose'],
  ['\\lfloor', 0x230a, 'mopen'],
  ['\\rfloor', 0x230b, 'mclose'],
  ['\\lceil', 0x2308, 'mopen'],
  ['\\rceil', 0x2309, 'mclose'],

  ['\\vert', 0x2223],
  ['\\lvert', 0x2223, 'mopen'],
  ['\\rvert', 0x2223, 'mclose'],
  ['\\|', 0x2225],
  ['\\Vert', 0x2225],
  ['\\mVert', 0x2225],
  ['\\lVert', 0x2225, 'mopen'],
  ['\\rVert', 0x2225, 'mclose'],

  ['\\lbrack', 0x005b, 'mopen'],
  ['\\rbrack', 0x005d, 'mclose'],
  ['\\{', 0x007b, 'mopen'],
  ['\\}', 0x007d, 'mclose'],

  ['(', 0x0028, 'mopen'],
  [')', 0x029, 'mclose'],
  ['[', 0x005b, 'mopen'],
  [']', 0x005d, 'mclose'],

  ['\\ulcorner', 0x250c, 'mopen', 'ams'],
  ['\\urcorner', 0x2510, 'mclose', 'ams'],
  ['\\llcorner', 0x2514, 'mopen', 'ams'],
  ['\\lrcorner', 0x2518, 'mclose', 'ams'],

  // Large Delimiters

  ['\\lgroup', 0x27ee, 'mopen'],
  ['\\rgroup', 0x27ef, 'mclose'],
  ['\\lmoustache', 0x23b0, 'mopen'],
  ['\\rmoustache', 0x23b1, 'mclose'],

  // defineSymbol('\\ne', 0x2260, 'mrel'],
  // defineSymbol('\\neq', 0x2260, 'mrel'],
  // defineSymbol( '\\longequal', 0xF7D9,  'mrel',  MAIN],   // NOTE: Not TeX
]);

newSymbols(
  [
    // 'ams' arrows
    ['\\dashrightarrow', 0x21e2],
    ['\\dashleftarrow', 0x21e0],
    ['\\Rrightarrow', 0x21db],
    ['\\Lleftarrow', 0x21da],
    ['\\leftrightarrows', 0x21c6],
    ['\\rightleftarrows', 0x21c4],
    ['\\curvearrowright', 0x21b7],
    ['\\curvearrowleft', 0x21b6],
    ['\\rightrightarrows', 0x21c9],
    ['\\leftleftarrows', 0x21c7],
    ['\\upuparrows', 0x21c8],
    ['\\downdownarrows', 0x21ca],

    ['\\vartriangle', 0x25b3],
    ['\\triangleq', 0x225c],
    ['\\vartriangleleft', 0x22b2],
    ['\\trianglelefteq', 0x22b4],
    ['\\ntriangleleft', 0x22ea],
    ['\\ntrianglelefteq', 0x22ec],
    ['\\vartriangleright', 0x22b3],
    ['\\trianglerighteq', 0x22b5],
    ['\\ntriangleright', 0x22eb],
    ['\\ntrianglerighteq', 0x22ed],
    ['\\blacktriangleleft', 0x25c0],
    ['\\blacktriangleright', 0x25b6],

    ['\\leftarrowtail', 0x21a2],
    ['\\rightarrowtail', 0x21a3],

    ['\\looparrowright', 0x21ac],
    ['\\looparrowleft', 0x21ab],

    ['\\twoheadleftarrow', 0x219e],
    ['\\twoheadrightarrow', 0x21a0],
    ['\\twoheadrightarrowtail', 0x2916],

    ['\\rightleftharpoons', 0x21cc],
    ['\\leftrightharpoons', 0x21cb],

    ['\\Rsh', 0x21b1],
    ['\\Lsh', 0x21b0],
    // 'ams' Relations
    ['\\circlearrowright', 0x21bb],
    ['\\circlearrowleft', 0x21ba],

    ['\\restriction', 0x21be],
    ['\\upharpoonright', 0x21be],
    ['\\upharpoonleft', 0x21bf],
    ['\\downharpoonright', 0x21c2],
    ['\\downharpoonleft', 0x21c3],

    ['\\rightsquigarrow', 0x21dd],
    ['\\leadsto', 0x21dd],
    ['\\leftrightsquigarrow', 0x21ad],
    ['\\multimap', 0x22b8],

    // 'ams' Negated Arrows

    ['\\nleftarrow', 0x219a],
    ['\\nrightarrow', 0x219b],
    ['\\nRightarrow', 0x21cf],
    ['\\nLeftarrow', 0x21cd],
    ['\\nleftrightarrow', 0x21ae],
    ['\\nLeftrightarrow', 0x21ce],
    ['\\nvrightarrow', 0x21f8],
    ['\\nvtwoheadrightarrow', 0x2900],
    ['\\nvrightarrowtail', 0x2914],
    ['\\nvtwoheadrightarrowtail', 0x2917],

    // 'ams' Negated Relations
    ['\\shortparallel', 0x2225],

    ['\\nless', 0x226e],
    ['\\nleqslant', 0xe010],
    ['\\lneq', 0x2a87],
    ['\\lneqq', 0x2268],
    ['\\nleqq', 0xe011],
    ['\\lvertneqq', 0xe00c],
    ['\\lnsim', 0x22e6],
    ['\\lnapprox', 0x2a89],
    ['\\nprec', 0x2280],
    ['\\npreceq', 0x22e0],
    ['\\precnsim', 0x22e8],
    ['\\precnapprox', 0x2ab9],
    ['\\nsim', 0x2241],
    ['\\nshortmid', 0xe006],
    ['\\nmid', 0x2224],
    ['\\nvdash', 0x22ac],
    ['\\nvDash', 0x22ad],
    ['\\ngtr', 0x226f],
    ['\\ngeqslant', 0xe00f],
    ['\\ngeqq', 0xe00e],
    ['\\gneq', 0x2a88],
    ['\\gneqq', 0x2269],
    ['\\gvertneqq', 0xe00d],
    ['\\gnsim', 0x22e7],
    ['\\gnapprox', 0x2a8a],
    ['\\nsucc', 0x2281],
    ['\\nsucceq', 0x22e1],
    ['\\succnsim', 0x22e9],
    ['\\succnapprox', 0x2aba],
    ['\\ncong', 0x2246],
    ['\\nshortparallel', 0xe007],
    ['\\nparallel', 0x2226],
    ['\\nVDash', 0x22af],
    ['\\nsupseteqq', 0xe018],
    ['\\supsetneq', 0x228b],
    ['\\varsupsetneq', 0xe01b],
    ['\\supsetneqq', 0x2acc],
    ['\\varsupsetneqq', 0xe019],
    ['\\nVdash', 0x22ae],
    ['\\precneqq', 0x2ab5],
    ['\\succneqq', 0x2ab6],
    ['\\nsubseteqq', 0xe016],
    ['\\leqslant', 0x2a7d],
    ['\\geqslant', 0x2a7e],
    ['\\gtrsim', 0x2273],
    ['\\approxeq', 0x224a],
    ['\\thickapprox', 0x2248],
    ['\\lessapprox', 0x2a85],
    ['\\gtrapprox', 0x2a86],
    ['\\precapprox', 0x2ab7],
    ['\\succapprox', 0x2ab8],

    ['\\thicksim', 0x223c],
    ['\\succsim', 0x227f],
    ['\\precsim', 0x227e],
    ['\\backsim', 0x223d],
    ['\\eqsim', 0x2242],
    ['\\backsimeq', 0x22cd],
    ['\\lesssim', 0x2272],

    ['\\nleq', 0x2270],
    ['\\ngeq', 0x2271],

    ['\\smallsmile', 0x2323],
    ['\\smallfrown', 0x2322],

    ['\\leqq', 0x2266],
    ['\\eqslantless', 0x2a95],

    ['\\lll', 0x22d8],
    ['\\lessgtr', 0x2276],
    ['\\lesseqgtr', 0x22da],
    ['\\lesseqqgtr', 0x2a8b],
    ['\\risingdotseq', 0x2253],
    ['\\fallingdotseq', 0x2252],
    ['\\subseteqq', 0x2ac5],
    ['\\Subset', 0x22d0],
    ['\\sqsubset', 0x228f],
    ['\\preccurlyeq', 0x227c],
    ['\\curlyeqprec', 0x22de],
    ['\\vDash', 0x22a8],
    ['\\Vvdash', 0x22aa],
    ['\\bumpeq', 0x224f],
    ['\\Bumpeq', 0x224e],
    ['\\geqq', 0x2267],
    ['\\eqslantgtr', 0x2a96],
    ['\\ggg', 0x22d9],
    ['\\gtrless', 0x2277],
    ['\\gtreqless', 0x22db],
    ['\\gtreqqless', 0x2a8c],

    ['\\supseteqq', 0x2ac6],
    ['\\Supset', 0x22d1],
    ['\\sqsupset', 0x2290],
    ['\\succcurlyeq', 0x227d],
    ['\\curlyeqsucc', 0x22df],
    ['\\Vdash', 0x22a9],
    ['\\shortmid', 0x2223],
    ['\\between', 0x226c],
    ['\\pitchfork', 0x22d4],
    ['\\varpropto', 0x221d],
    ['\\backepsilon', 0x220d],
    ['\\llless', 0x22d8],
    ['\\gggtr', 0x22d9],

    ['\\doteqdot', 0x2251],
    ['\\Doteq', 0x2251],
    ['\\eqcirc', 0x2256],
    ['\\circeq', 0x2257],
    ['\\therefore', 0x2234],
    ['\\because', 0x2235],
  ],
  'mrel',
  'ams'
);

// Binary Operators
newSymbols(
  [
    ['+', 0x002b],
    ['-', 0x2212],
    ['\u2212', 0x2212],
    ['\\pm', 0x00b1],
    ['\\mp', 0x2213],
    ['*', 0x2217],
    ['\\times', 0x00d7],
    ['\\div', 0x00f7],

    ['\\divides', 0x2223],
    ['\\cdot', 0x22c5],
    ['\\cap', 0x2229],
    ['\\cup', 0x222a],
    ['\\setminus', 0x2216],
    ['\\land', 0x2227],
    ['\\wedge', 0x2227],
    ['\\lor', 0x2228],
    ['\\vee', 0x2228],
    ['\\circ', 0x2218],
    ['\\bigcirc', 0x25ef],
    ['\\bullet', 0x2219],
    ['\\oplus', 0x2295],
    ['\\ominus', 0x2296],
    ['\\otimes', 0x2297],
    ['\\odot', 0x2299],
    ['\\oslash', 0x2298],
    ['\\bigtriangleup', 0x25b3],
    ['\\bigtriangledown', 0x25bd],

    ['\\triangleleft', 0x25c3],
    ['\\triangleright', 0x25b9],
    ['\\And', 0x0026],
    ['\\dagger', 0x2020],
    ['\\dag', 0x2020],
    ['\\ddag', 0x2021],
    ['\\ddagger', 0x2021],
    ['\\ast', 0x2217],
    ['\\star', 0x22c6],
    ['\\bigstar', 0x2605],
    ['\\diamond', 0x22c4],
  ],
  'mbin'
);

// 'ams' Binary Operators
newSymbols(
  [
    ['\\lhd', 0x22b2],
    ['\\rhd', 0x22b3],
    ['\\lessdot', 0x22d6],
    ['\\gtrdot', 0x22d7],
    ['\\ltimes', 0x22c9],
    ['\\rtimes', 0x22ca],
    ['\\leftthreetimes', 0x22cb],
    ['\\rightthreetimes', 0x22cc],
    ['\\intercal', 0x22ba],
    ['\\dotplus', 0x2214],
    ['\\doublebarwedge', 0x2a5e],
    ['\\divideontimes', 0x22c7],
    ['\\centerdot', 0x22c5],
    ['\\smallsetminus', 0x2216],
    ['\\barwedge', 0x22bc],
    ['\\veebar', 0x22bb],
    ['\\nor', 0x22bb], // NOTE: Not TeX, Mathematica
    ['\\curlywedge', 0x22cf],
    ['\\curlyvee', 0x22ce],
    ['\\boxminus', 0x229f],
    ['\\boxplus', 0x229e],
    ['\\boxtimes', 0x22a0],
    ['\\boxdot', 0x22a1],
    ['\\circleddash', 0x229d],
    ['\\circledast', 0x229b],
    ['\\circledcirc', 0x229a],
    ['\\unlhd', 0x22b4],
    ['\\unrhd', 0x22b5],
  ],
  'mbin',
  'ams'
);

// Ordinary symbols
newSymbols([
  ['\\surd', 0x221a],

  // From MnSymbol package

  ['\\infty', 0x221e],
  ['\\prime', 0x2032],
  ['\\doubleprime', 0x2033], // NOTE: Not in TeX, but Mathematica
  ['\\angle', 0x2220],
  ['`', 0x2018],
  ['\\$', 0x0024],
  ['\\%', 0x0025],
  ['\\_', 0x005f],

  // Note: In TeX, greek symbols are only available in Math mode
  ['\\alpha', 0x03b1],
  ['\\beta', 0x03b2],
  ['\\gamma', 0x03b3],
  ['\\delta', 0x03b4],
  ['\\epsilon', 0x03f5],
  ['\\varepsilon', 0x03b5],
  ['\\zeta', 0x03b6],
  ['\\eta', 0x03b7],
  ['\\theta', 0x03b8],
  ['\\vartheta', 0x03d1],
  ['\\iota', 0x03b9],
  ['\\kappa', 0x03ba],
  ['\\varkappa', 0x03f0, 'mord', 'ams'],
  ['\\lambda', 0x03bb],
  ['\\mu', 0x03bc],
  ['\\nu', 0x03bd],
  ['\\xi', 0x03be],
  ['\\omicron', 0x006f],
  ['\\pi', 0x03c0],
  ['\\varpi', 0x03d6],
  ['\\rho', 0x03c1],
  ['\\varrho', 0x03f1],
  ['\\sigma', 0x03c3],
  ['\\varsigma', 0x03c2],
  ['\\tau', 0x03c4],
  ['\\phi', 0x03d5],
  ['\\varphi', 0x03c6],
  ['\\upsilon', 0x03c5],
  ['\\chi', 0x03c7],
  ['\\psi', 0x03c8],
  ['\\omega', 0x03c9],

  ['\\Gamma', 0x0393],
  ['\\Delta', 0x0394],
  ['\\Theta', 0x0398],
  ['\\Lambda', 0x039b],
  ['\\Xi', 0x039e],
  ['\\Pi', 0x03a0],
  ['\\Sigma', 0x03a3],
  ['\\Upsilon', 0x03a5],
  ['\\Phi', 0x03a6],
  ['\\Psi', 0x03a8],
  ['\\Omega', 0x03a9],

  // 'ams' Greek
  ['\\digamma', 0x03dd, 'mord', 'ams'],

  ['\\emptyset', 0x2205],
]);

// Relational symbols
newSymbols(
  [
    ['=', 0x003d],
    ['<', 0x003c],
    ['\\lt', 0x003c],
    ['>', 0x003e],
    ['\\gt', 0x003e],

    ['\\le', 0x2264],
    ['\\leq', 0x2264],
    ['\\ge', 0x2265],
    ['\\geq', 0x2265],

    ['\\ll', 0x226a],
    ['\\gg', 0x226b],
    ['\\coloneq', 0x2254],
    ['\\measeq', 0x225d], // MEASSURED BY
    ['\\eqdef', 0x225e],
    ['\\questeq', 0x225f], // QUESTIONED EQUAL TO

    [':', 0x003a],
    ['\\cong', 0x2245],

    ['\\equiv', 0x2261],

    ['\\prec', 0x227a],
    ['\\preceq', 0x2aaf],
    ['\\succ', 0x227b],
    ['\\succeq', 0x2ab0],

    ['\\perp', 0x22a5],

    ['\\propto', 0x221d],
    ['\\Colon', 0x2237],

    ['\\smile', 0x2323],
    ['\\frown', 0x2322],

    ['\\sim', 0x223c],
    ['\\doteq', 0x2250],
    ['\\bowtie', 0x22c8],
    ['\\Join', 0x22c8],

    ['\\asymp', 0x224d],

    ['\\sqsubseteq', 0x2291],
    ['\\sqsupseteq', 0x2292],

    ['\\approx', 0x2248], // In TeX, '~' is a spacing command (non-breaking space).
    // However, '~' is used as an ASCII Math shortctut character, so define a \\~
    // command which maps to the '~' character
    ['\\~', 0x007e],

    ['\\leftrightarrow', 0x2194],
    ['\\Leftrightarrow', 0x21d4],
    ['\\models', 0x22a8],
    ['\\vdash', 0x22a2],

    ['\\dashv', 0x22a3],
    ['\\roundimplies', 0x2970],

    ['\\in', 0x2208],
    ['\\notin', 0x2209],
    // defineSymbol('\\not', 0x0338],
    // defineSymbol('\\not', 0xe020],
    ['\\ni', 0x220b],
    ['\\owns', 0x220b],
    ['\\subset', 0x2282],
    ['\\supset', 0x2283],
    ['\\subseteq', 0x2286],
    ['\\supseteq', 0x2287],
    ['\\differencedelta', 0x2206],
    ['\\mvert', 0x2223],
    ['\\parallel', 0x2225],

    ['\\simeq', 0x2243],
  ],
  'mrel'
);

// 'ams' Relational Symbols
newSymbols(
  [
    ['\\lnot', 0x00ac],
    ['\\neg', 0x00ac],

    ['\\triangle', 0x25b3],

    ['\\subsetneq', 0x228a],
    ['\\varsubsetneq', 0xe01a],
    ['\\subsetneqq', 0x2acb],
    ['\\varsubsetneqq', 0xe017],
    ['\\nsubset', 0x2284], // NOTE: Not TeX?
    ['\\nsupset', 0x2285], // NOTE: Not TeX?
    ['\\nsubseteq', 0x2288],
    ['\\nsupseteq', 0x2289],
  ],
  'mrel',
  'ams'
);

newSymbols([
  ['\\wp', 0x2118],
  ['\\aleph', 0x2135],
]);

// 'ams' Ordinary Symbols
newSymbols(
  [
    ['\\blacktriangle', 0x25b2],

    ['\\hslash', 0x210f],

    ['\\Finv', 0x2132],
    ['\\Game', 0x2141],

    ['\\eth', 0x00f0],

    ['\\mho', 0x2127],

    ['\\Bbbk', 0x006b],
    ['\\yen', 0x00a5],

    ['\\square', 0x25a1],
    ['\\Box', 0x25a1],
    ['\\blacksquare', 0x25a0],

    ['\\circledS', 0x24c8],
    ['\\circledR', 0x00ae],
    ['\\triangledown', 0x25bd],
    ['\\blacktriangledown', 0x25bc],
    ['\\checkmark', 0x2713],

    ['\\diagup', 0x2571],

    ['\\measuredangle', 0x2221],
    ['\\sphericalangle', 0x2222],

    ['\\backprime', 0x2035],
    ['\\backdoubleprime', 0x2036],

    ['\\Diamond', 0x25ca],
    ['\\lozenge', 0x25ca],
    ['\\blacklozenge', 0x29eb],

    ['\\varnothing', 0x2205],

    ['\\complement', 0x2201],
    ['\\maltese', 0x2720],

    // 'ams' Hebrew

    ['\\beth', 0x2136],
    ['\\daleth', 0x2138],
    ['\\gimel', 0x2137],
  ],
  'mord',
  'ams'
);

newSymbols(
  [
    // See http://tex.stackexchange.com/questions/41476/lengths-and-when-to-use-them
    ['\\ ', 0x00a0],
    ['~', 0x00a0],
  ],
  'space'
);
// \enspace is a TeX command (not LaTeX)
defineFunction(
  ['!', ',', ':', ';', '>', 'enskip', 'enspace', 'quad', 'qquad'],
  '',
  {
    createAtom: (options) => new SpacingAtom(options),
  }
);

defineFunction('space', '', {
  createAtom: (options) => new SpacingAtom(options),
});

// Punctuation
newSymbols(
  [
    ['\\colon', 0x003a],
    ['\\cdotp', 0x22c5],
    ['\\vdots', 0x22ee, 'mord'],
    ['\\ldotp', 0x002e],
    [',', 0x002c],
    [';', 0x003b],
  ],
  'mpunct'
);
newSymbols(
  [
    ['\\cdots', 0x22ef],
    ['\\ddots', 0x22f1],
    ['\\ldots', 0x2026],
    ['\\mathellipsis', 0x2026],
  ],
  'minner'
);

newSymbols([
  ['\\/', 0x002f],
  ['|', 0x2223, 'mord'],

  ['\\imath', 0x0131],
  ['\\jmath', 0x0237],

  ['\\degree', 0x00b0],

  ["'", 0x2032], // Prime
  ['"', 0x201d], // Double Prime
  // defineSymbol( "\'', 0x2033,  'mord',  MAIN],       // Double Prime
]);
