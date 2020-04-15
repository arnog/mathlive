import {
    defineSymbol,
    defineSymbols,
    defineSymbolRange,
} from './definitions-utils';

// Simple characters allowed in math mode
defineSymbols('0123456789/@.?!');
defineSymbolRange(0x0041, 0x005a); // a-z
defineSymbolRange(0x0061, 0x007a); // A-Z

// Quantifiers

defineSymbol('\\forall', '\u2200');
defineSymbol('\\exists', '\u2203');
defineSymbol('\\nexists', '\u2204', 'mord', 'ams');
defineSymbol('\\mid', '\u2223', 'mrel');
defineSymbol('\\top', '\u22a4');
defineSymbol('\\bot', '\u22a5');

// Misc Symbols

defineSymbol('\\sharp', '\u266f');
defineSymbol('\\flat', '\u266d');
defineSymbol('\\natural', '\u266e');
defineSymbol('\\#', '\u0023');
defineSymbol('\\&', '\u0026');
defineSymbol('\\clubsuit', '\u2663');
defineSymbol('\\heartsuit', '\u2661');
defineSymbol('\\spadesuit', '\u2660');
defineSymbol('\\diamondsuit', '\u2662');

// defineSymbol( '\\cross', '\uF4A0',  'mord',  MAIN); // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\transpose', '\uF3C7',  'mord',  MAIN); // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\conjugate', 'conj'],  MAIN,  'mord', '\uF3C8'); // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\conjugatetranspose', '\uF3C9',  'mord',  MAIN); // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\hermitianconjugate', '\uF3CE',  'mord',  MAIN); // NOTE: not a real TeX symbol, but Mathematica
defineSymbol('\\differencedelta', '\u2206', 'mrel');

defineSymbol('\\backslash', '\\');

defineSymbol('\\nabla', '\u2207');
defineSymbol('\\partial', '\u2202');

defineSymbol('\\ell', '\u2113');
defineSymbol('\\imaginaryI', 'i'); // NOTE: not a real TeX symbol, but Mathematica
// NOTE: set in math as per ISO 80000-2:2009.
defineSymbol('\\imaginaryJ', 'j'); // NOTE: not a real TeX symbol, but Mathematica
// NOTE: set in math as per ISO 80000-2:2009.

defineSymbol('\\hbar', '\u210f');
defineSymbol('\\hslash', '\u210f', 'mord', 'ams');

defineSymbol('\\differentialD', 'd', 'mord', 'main'); // NOTE: not a real TeX symbol, but Mathematica
defineSymbol('\\rd', 'd', 'mord', 'main'); // NOTE: not a real TeX symbol, but used in ProofWiki
// NOTE: set in math as per ISO 80000-2:2009.
defineSymbol('\\capitalDifferentialD', 'D', 'mord', 'main'); // NOTE: not a real TeX symbol, but Mathematica
// NOTE: set in math as per ISO 80000-2:2009.
defineSymbol('\\rD', 'D', 'mord', 'main'); // NOTE: not a real TeX symbol
defineSymbol('\\exponentialE', 'e', 'mord', 'main'); // NOTE: not a real TeX symbol, but Mathematica
// NOTE: set in math as per ISO 80000-2:2009.

defineSymbol('\\Finv', '\u2132', 'mord', 'ams');
defineSymbol('\\Game', '\u2141', 'mord', 'ams');

defineSymbol('\\wp', '\u2118');
defineSymbol('\\eth', '\u00f0', 'mord', 'ams');

defineSymbol('\\mho', '\u2127', 'mord', 'ams');

defineSymbol('\\Bbbk', '\u006b', 'mord', 'ams');
defineSymbol('\\doubleStruckCapitalN', 'N', 'mord', 'double-struck'); // NOTE: Not TeX?
defineSymbol('\\N', 'N', 'mord', 'double-struck'); // NOTE: Check if standard Latex
defineSymbol('\\doubleStruckCapitalR', 'R', 'mord', 'double-struck'); // NOTE: Not TeX?
defineSymbol('\\R', 'R', 'mord', 'double-struck'); // NOTE: Check if standard Latex
defineSymbol('\\doubleStruckCapitalQ', 'Q', 'mord', 'double-struck'); // NOTE: Not TeX?
defineSymbol('\\Q', 'Q', 'mord', 'double-struck'); // NOTE: Check if standard Latex
defineSymbol('\\doubleStruckCapitalC', 'C', 'mord', 'double-struck'); // NOTE: Not TeX?
defineSymbol('\\C', 'C', 'mord', 'double-struck'); // NOTE: Check if standard Latex
defineSymbol('\\doubleStruckCapitalZ', 'Z', 'mord', 'double-struck'); // NOTE: Not TeX?
defineSymbol('\\Z', 'Z', 'mord', 'double-struck'); // NOTE: Check if standard Latex
defineSymbol('\\doubleStruckCapitalP', 'P', 'mord', 'double-struck'); // NOTE: Not TeX?
defineSymbol('\\P', 'P', 'mord', 'double-struck'); // NOTE: Check if standard Latex

defineSymbol('\\scriptCapitalE', 'E', 'mord', 'script'); // NOTE: Not TeX?
defineSymbol('\\scriptCapitalH', 'H', 'mord', 'script'); // NOTE: Not TeX?
defineSymbol('\\scriptCapitalL', 'L', 'mord', 'script'); // NOTE: Not TeX?

defineSymbol('\\gothicCapitalC', 'C', 'mord', 'fraktur'); // NOTE: Not TeX?
defineSymbol('\\gothicCapitalH', 'H', 'mord', 'fraktur'); // NOTE: Not TeX?
defineSymbol('\\gothicCapitalI', 'I', 'mord', 'fraktur'); // NOTE: Not TeX?
defineSymbol('\\gothicCapitalR', 'R', 'mord', 'fraktur'); // NOTE: Not TeX?

defineSymbol('\\pounds', '\u00a3');
defineSymbol('\\yen', '\u00a5', 'mord', 'ams');
defineSymbol('\\euro', '\u20AC'); // NOTE: not TeX built-in, but textcomp package

// TODO Koppa, Stigma, Sampi

// Math and Text

defineSymbol('\\textdagger', '\u2020', 'mbin');
defineSymbol('\\dagger', '\u2020', 'mbin');
defineSymbol('\\dag', '\u2020', 'mbin');
defineSymbol('\\ddag', '\u2021', 'mbin');
defineSymbol('\\textdaggerdbl', '\u2021', 'mbin');
defineSymbol('\\ddagger', '\u2021', 'mbin');
defineSymbol('\\maltese', '\u2720', 'mord', 'ams');

// Arrow Symbols

defineSymbol('\\rightarrow', '\u2192', 'mrel');
defineSymbol('\\leftarrow', '\u2190', 'mrel');
defineSymbol('\\Rightarrow', '\u21d2', 'mrel');
defineSymbol('\\Leftarrow', '\u21d0', 'mrel');
defineSymbol('\\longrightarrow', '\u27f6', 'mrel');
defineSymbol('\\longleftarrow', '\u27f5', 'mrel');
defineSymbol('\\Longrightarrow', '\u27f9', 'mrel'); // See \\implies
defineSymbol('\\Longleftarrow', '\u27f8', 'mrel');
defineSymbol('\\dashrightarrow', '\u21e2', 'mrel', 'ams');
defineSymbol('\\dashleftarrow', '\u21e0', 'mrel', 'ams');
defineSymbol('\\Rrightarrow', '\u21db', 'mrel', 'ams');
defineSymbol('\\Lleftarrow', '\u21da', 'mrel', 'ams');

defineSymbol('\\longleftrightarrow', '\u27f7', 'mrel');
defineSymbol('\\Longleftrightarrow', '\u27fa', 'mrel');

defineSymbol('\\leftrightarrows', '\u21c6', 'mrel', 'ams');
defineSymbol('\\rightleftarrows', '\u21c4', 'mrel', 'ams');

defineSymbol('\\mapsto', '\u21a6', 'mrel');
defineSymbol('\\longmapsto', '\u27fc', 'mrel');

defineSymbol('\\uparrow', '\u2191', 'mrel');
defineSymbol('\\downarrow', '\u2193', 'mrel');
defineSymbol('\\Uparrow', '\u21d1', 'mrel');
defineSymbol('\\Downarrow', '\u21d3', 'mrel');
defineSymbol('\\updownarrow', '\u2195', 'mrel');
defineSymbol('\\Updownarrow', '\u21d5', 'mrel');

defineSymbol('\\curvearrowright', '\u21b7', 'mrel', 'ams');
defineSymbol('\\curvearrowleft', '\u21b6', 'mrel', 'ams');

defineSymbol('\\hookrightarrow', '\u21aa', 'mrel');
defineSymbol('\\hookleftarrow', '\u21a9', 'mrel');

defineSymbol('\\rightharpoonup', '\u21c0', 'mrel');
defineSymbol('\\leftharpoonup', '\u21bc', 'mrel');
defineSymbol('\\rightharpoondown', '\u21c1', 'mrel');
defineSymbol('\\leftharpoondown', '\u21bd', 'mrel');

defineSymbol('\\rightrightarrows', '\u21c9', 'mrel', 'ams');
defineSymbol('\\leftleftarrows', '\u21c7', 'mrel', 'ams');
defineSymbol('\\upuparrows', '\u21c8', 'mrel', 'ams');
defineSymbol('\\downdownarrows', '\u21ca', 'mrel', 'ams');

defineSymbol('\\leftarrowtail', '\u21a2', 'mrel', 'ams');
defineSymbol('\\rightarrowtail', '\u21a3', 'mrel', 'ams');

defineSymbol('\\looparrowright', '\u21ac', 'mrel', 'ams');
defineSymbol('\\looparrowleft', '\u21ab', 'mrel', 'ams');

defineSymbol('\\twoheadleftarrow', '\u219e', 'mrel', 'ams');
defineSymbol('\\twoheadrightarrow', '\u21a0', 'mrel', 'ams');

defineSymbol('\\rightleftharpoons', '\u21cc', 'mrel');
defineSymbol('\\leftrightharpoons', '\u21cb', 'mrel', 'ams');

defineSymbol('\\Rsh', '\u21b1', 'mrel', 'ams');
defineSymbol('\\Lsh', '\u21b0', 'mrel', 'ams');

defineSymbol('\\searrow', '\u2198', 'mrel');
defineSymbol('\\nearrow', '\u2197', 'mrel');
defineSymbol('\\swarrow', '\u2199', 'mrel');
defineSymbol('\\nwarrow', '\u2196', 'mrel');

defineSymbol('\\circlearrowright', '\u21bb', 'mrel', 'ams');
defineSymbol('\\circlearrowleft', '\u21ba', 'mrel', 'ams');

defineSymbol('\\restriction', '\u21be', 'mrel', 'ams');
defineSymbol('\\upharpoonright', '\u21be', 'mrel', 'ams');
defineSymbol('\\upharpoonleft', '\u21bf', 'mrel', 'ams');
defineSymbol('\\downharpoonright', '\u21c2', 'mrel', 'ams');
defineSymbol('\\downharpoonleft', '\u21c3', 'mrel', 'ams');

defineSymbol('\\rightsquigarrow', '\u21dd', 'mrel', 'ams');
defineSymbol('\\leadsto', '\u21dd', 'mrel', 'ams');
defineSymbol('\\leftrightsquigarrow', '\u21ad', 'mrel', 'ams');

defineSymbol('\\multimap', '\u22b8', 'mrel', 'ams');

// 'ams' Negated Arrows

defineSymbol('\\nrightarrow', '\u219b', 'mrel', 'ams');
defineSymbol('\\nleftarrow', '\u219a', 'mrel', 'ams');
defineSymbol('\\nRightarrow', '\u21cf', 'mrel', 'ams');
defineSymbol('\\nLeftarrow', '\u21cd', 'mrel', 'ams');
defineSymbol('\\nleftrightarrow', '\u21ae', 'mrel', 'ams');
defineSymbol('\\nLeftrightarrow', '\u21ce', 'mrel', 'ams');

// 'ams' Negated Binary Relations

defineSymbol('\\nless', '\u226e', 'mrel', 'ams');
defineSymbol('\\nleqslant', '\ue010', 'mrel', 'ams');
defineSymbol('\\lneq', '\u2a87', 'mrel', 'ams');
defineSymbol('\\lneqq', '\u2268', 'mrel', 'ams');
defineSymbol('\\nleqq', '\ue011', 'mrel', 'ams');

defineSymbol('\\unlhd', '\u22b4', 'mbin', 'ams');
defineSymbol('\\unrhd', '\u22b5', 'mbin', 'ams');

defineSymbol('\\lvertneqq', '\ue00c', 'mrel', 'ams');
defineSymbol('\\lnsim', '\u22e6', 'mrel', 'ams');
defineSymbol('\\lnapprox', '\u2a89', 'mrel', 'ams');
defineSymbol('\\nprec', '\u2280', 'mrel', 'ams');
defineSymbol('\\npreceq', '\u22e0', 'mrel', 'ams');
defineSymbol('\\precnsim', '\u22e8', 'mrel', 'ams');
defineSymbol('\\precnapprox', '\u2ab9', 'mrel', 'ams');
defineSymbol('\\nsim', '\u2241', 'mrel', 'ams');
defineSymbol('\\nshortmid', '\ue006', 'mrel', 'ams');
defineSymbol('\\nmid', '\u2224', 'mrel', 'ams');
defineSymbol('\\nvdash', '\u22ac', 'mrel', 'ams');
defineSymbol('\\nvDash', '\u22ad', 'mrel', 'ams');
defineSymbol('\\ngtr', '\u226f', 'mrel', 'ams');
defineSymbol('\\ngeqslant', '\ue00f', 'mrel', 'ams');
defineSymbol('\\ngeqq', '\ue00e', 'mrel', 'ams');
defineSymbol('\\gneq', '\u2a88', 'mrel', 'ams');
defineSymbol('\\gneqq', '\u2269', 'mrel', 'ams');
defineSymbol('\\gvertneqq', '\ue00d', 'mrel', 'ams');
defineSymbol('\\gnsim', '\u22e7', 'mrel', 'ams');
defineSymbol('\\gnapprox', '\u2a8a', 'mrel', 'ams');
defineSymbol('\\nsucc', '\u2281', 'mrel', 'ams');
defineSymbol('\\nsucceq', '\u22e1', 'mrel', 'ams');
defineSymbol('\\succnsim', '\u22e9', 'mrel', 'ams');
defineSymbol('\\succnapprox', '\u2aba', 'mrel', 'ams');
defineSymbol('\\ncong', '\u2246', 'mrel', 'ams');
defineSymbol('\\nshortparallel', '\ue007', 'mrel', 'ams');
defineSymbol('\\nparallel', '\u2226', 'mrel', 'ams');
defineSymbol('\\nVDash', '\u22af', 'mrel', 'ams');
defineSymbol('\\nsupseteqq', '\ue018', 'mrel', 'ams');
defineSymbol('\\supsetneq', '\u228b', 'mrel', 'ams');
defineSymbol('\\varsupsetneq', '\ue01b', 'mrel', 'ams');
defineSymbol('\\supsetneqq', '\u2acc', 'mrel', 'ams');
defineSymbol('\\varsupsetneqq', '\ue019', 'mrel', 'ams');
defineSymbol('\\nVdash', '\u22ae', 'mrel', 'ams');
defineSymbol('\\precneqq', '\u2ab5', 'mrel', 'ams');
defineSymbol('\\succneqq', '\u2ab6', 'mrel', 'ams');
defineSymbol('\\nsubseteqq', '\ue016', 'mrel', 'ams');

// 'ams' Misc

defineSymbol('\\checkmark', '\u2713', 'mord', 'ams');

defineSymbol('\\diagup', '\u2571', 'mord', 'ams');
defineSymbol('\\diagdown', '\u2572', 'mord', 'ams');

defineSymbol('\\measuredangle', '\u2221', 'mord', 'ams');
defineSymbol('\\sphericalangle', '\u2222', 'mord', 'ams');

defineSymbol('\\backprime', '\u2035', 'mord', 'ams');
defineSymbol('\\backdoubleprime', '\u2036', 'mord', 'ams');

defineSymbol('\\ast', '\u2217', 'mbin');
defineSymbol('\\star', '\u22c6', 'mbin');
defineSymbol('\\diamond', '\u22c4', 'mbin');
defineSymbol('\\Diamond', '\u25ca', 'mord', 'ams');
defineSymbol('\\lozenge', '\u25ca', 'mord', 'ams');
defineSymbol('\\blacklozenge', '\u29eb', 'mord', 'ams');
defineSymbol('\\bigstar', '\u2605', 'mord', 'ams');

// 'ams' Hebrew

defineSymbol('\\aleph', '\u2135');
defineSymbol('\\beth', '\u2136', 'mord', 'ams');
defineSymbol('\\daleth', '\u2138', 'mord', 'ams');
defineSymbol('\\gimel', '\u2137', 'mord', 'ams');

// 'ams' Delimiters

defineSymbol('\\lbrace', '{', 'mopen');
defineSymbol('\\rbrace', '}', 'mclose');
defineSymbol('\\langle', '\u27e8', 'mopen');
defineSymbol('\\rangle', '\u27e9', 'mclose');
defineSymbol('\\lfloor', '\u230a', 'mopen');
defineSymbol('\\rfloor', '\u230b', 'mclose');
defineSymbol('\\lceil', '\u2308', 'mopen');
defineSymbol('\\rceil', '\u2309', 'mclose');

defineSymbol('\\vert', '\u2223');
defineSymbol('\\mvert', '\u2223', 'mrel');
defineSymbol('\\lvert', '\u2223', 'mopen');
defineSymbol('\\rvert', '\u2223', 'mclose');
defineSymbol('\\|', '\u2225');
defineSymbol('\\Vert', '\u2225');
defineSymbol('\\mVert', '\u2225');
defineSymbol('\\lVert', '\u2225', 'mopen');
defineSymbol('\\rVert', '\u2225', 'mclose');

defineSymbol('\\lbrack', '[', 'mopen');
defineSymbol('\\rbrack', ']', 'mclose');
defineSymbol('\\{', '{', 'mopen');
defineSymbol('\\}', '}', 'mclose');

defineSymbol('(', '(', 'mopen');
defineSymbol(')', ')', 'mclose');
defineSymbol('[', '[', 'mopen');
defineSymbol(']', ']', 'mclose');

defineSymbol('\\ulcorner', '\u250c', 'mopen', 'ams');
defineSymbol('\\urcorner', '\u2510', 'mclose', 'ams');
defineSymbol('\\llcorner', '\u2514', 'mopen', 'ams');
defineSymbol('\\lrcorner', '\u2518', 'mclose', 'ams');

// Large Delimiters

defineSymbol('\\lgroup', '\u27ee', 'mopen');
defineSymbol('\\rgroup', '\u27ef', 'mclose');
defineSymbol('\\lmoustache', '\u23b0', 'mopen');
defineSymbol('\\rmoustache', '\u23b1', 'mclose');

// Relations

defineSymbol('=', '=', 'mrel');
defineSymbol('\\ne', '\u2260', 'mrel');
defineSymbol('\\neq', '\u2260', 'mrel');
// defineSymbol( '\\longequal', '\uF7D9',  'mrel',  MAIN);   // NOTE: Not TeX

defineSymbol('<', '<', 'mrel');
defineSymbol('\\lt', '<', 'mrel');
defineSymbol('>', '>', 'mrel');
defineSymbol('\\gt', '>', 'mrel');

defineSymbol('\\le', '\u2264', 'mrel');
defineSymbol('\\ge', '\u2265', 'mrel');

defineSymbol('\\leqslant', '\u2a7d', 'mrel', 'ams');
defineSymbol('\\geqslant', '\u2a7e', 'mrel', 'ams');

defineSymbol('\\leq', '\u2264', 'mrel');
defineSymbol('\\geq', '\u2265', 'mrel');

defineSymbol('\\ll', '\u226a', 'mrel');
defineSymbol('\\gg', '\u226b', 'mrel');
defineSymbol('\\coloneq', '\u2254', 'mrel');
defineSymbol('\\measeq', '\u225d', 'mrel'); // MEASSURED BY
defineSymbol('\\eqdef', '\u225e', 'mrel');
defineSymbol('\\questeq', '\u225f', 'mrel'); // QUESTIONED EQUAL TO

defineSymbol(':', ':', 'mrel');
defineSymbol('\\cong', '\u2245', 'mrel');

defineSymbol('\\equiv', '\u2261', 'mrel');

defineSymbol('\\prec', '\u227a', 'mrel');
defineSymbol('\\preceq', '\u2aaf', 'mrel');
defineSymbol('\\succ', '\u227b', 'mrel');
defineSymbol('\\succeq', '\u2ab0', 'mrel');

defineSymbol('\\perp', '\u22a5', 'mrel');
defineSymbol('\\parallel', '\u2225', 'mrel');

defineSymbol('\\propto', '\u221d', 'mrel');
defineSymbol('\\Colon', '\u2237', 'mrel');

defineSymbol('\\smile', '\u2323', 'mrel');
defineSymbol('\\frown', '\u2322', 'mrel');

defineSymbol('\\sim', '\u223c', 'mrel');
defineSymbol('\\gtrsim', '\u2273', 'mrel', 'ams');

defineSymbol('\\approx', '\u2248', 'mrel');

defineSymbol('\\approxeq', '\u224a', 'mrel', 'ams');
defineSymbol('\\thickapprox', '\u2248', 'mrel', 'ams');
defineSymbol('\\lessapprox', '\u2a85', 'mrel', 'ams');
defineSymbol('\\gtrapprox', '\u2a86', 'mrel', 'ams');
defineSymbol('\\precapprox', '\u2ab7', 'mrel', 'ams');
defineSymbol('\\succapprox', '\u2ab8', 'mrel', 'ams');

defineSymbol('\\thicksim', '\u223c', 'mrel', 'ams');
defineSymbol('\\succsim', '\u227f', 'mrel', 'ams');
defineSymbol('\\precsim', '\u227e', 'mrel', 'ams');
defineSymbol('\\backsim', '\u223d', 'mrel', 'ams');
defineSymbol('\\eqsim', '\u2242', 'mrel', 'ams');
defineSymbol('\\backsimeq', '\u22cd', 'mrel', 'ams');
defineSymbol('\\simeq', '\u2243', 'mrel');
defineSymbol('\\lesssim', '\u2272', 'mrel', 'ams');

defineSymbol('\\nleq', '\u2270', 'mrel', 'ams');
defineSymbol('\\ngeq', '\u2271', 'mrel', 'ams');

defineSymbol('\\smallsmile', '\u2323', 'mrel', 'ams');
defineSymbol('\\smallfrown', '\u2322', 'mrel', 'ams');
defineSymbol('\\bowtie', '\u22c8', 'mrel');

defineSymbol('\\asymp', '\u224d', 'mrel');

defineSymbol('\\sqsubseteq', '\u2291', 'mrel');
defineSymbol('\\sqsupseteq', '\u2292', 'mrel');

defineSymbol('\\leqq', '\u2266', 'mrel', 'ams');
defineSymbol('\\eqslantless', '\u2a95', 'mrel', 'ams');

defineSymbol('\\lll', '\u22d8', 'mrel', 'ams');
defineSymbol('\\lessgtr', '\u2276', 'mrel', 'ams');
defineSymbol('\\lesseqgtr', '\u22da', 'mrel', 'ams');
defineSymbol('\\lesseqqgtr', '\u2a8b', 'mrel', 'ams');
defineSymbol('\\risingdotseq', '\u2253', 'mrel', 'ams');
defineSymbol('\\fallingdotseq', '\u2252', 'mrel', 'ams');
defineSymbol('\\subseteqq', '\u2ac5', 'mrel', 'ams');
defineSymbol('\\Subset', '\u22d0', 'mrel', 'ams');
defineSymbol('\\sqsubset', '\u228f', 'mrel', 'ams');
defineSymbol('\\preccurlyeq', '\u227c', 'mrel', 'ams');
defineSymbol('\\curlyeqprec', '\u22de', 'mrel', 'ams');
defineSymbol('\\vDash', '\u22a8', 'mrel', 'ams');
defineSymbol('\\Vvdash', '\u22aa', 'mrel', 'ams');
defineSymbol('\\bumpeq', '\u224f', 'mrel', 'ams');
defineSymbol('\\Bumpeq', '\u224e', 'mrel', 'ams');
defineSymbol('\\geqq', '\u2267', 'mrel', 'ams');
defineSymbol('\\eqslantgtr', '\u2a96', 'mrel', 'ams');
defineSymbol('\\ggg', '\u22d9', 'mrel', 'ams');
defineSymbol('\\gtrless', '\u2277', 'mrel', 'ams');
defineSymbol('\\gtreqless', '\u22db', 'mrel', 'ams');
defineSymbol('\\gtreqqless', '\u2a8c', 'mrel', 'ams');

defineSymbol('\\supseteqq', '\u2ac6', 'mrel', 'ams');
defineSymbol('\\Supset', '\u22d1', 'mrel', 'ams');
defineSymbol('\\sqsupset', '\u2290', 'mrel', 'ams');
defineSymbol('\\succcurlyeq', '\u227d', 'mrel', 'ams');
defineSymbol('\\curlyeqsucc', '\u22df', 'mrel', 'ams');
defineSymbol('\\Vdash', '\u22a9', 'mrel', 'ams');
defineSymbol('\\shortmid', '\u2223', 'mrel', 'ams');
defineSymbol('\\shortparallel', '\u2225', 'mrel', 'ams');
defineSymbol('\\between', '\u226c', 'mrel', 'ams');
defineSymbol('\\pitchfork', '\u22d4', 'mrel', 'ams');
defineSymbol('\\varpropto', '\u221d', 'mrel', 'ams');
defineSymbol('\\backepsilon', '\u220d', 'mrel', 'ams');
defineSymbol('\\llless', '\u22d8', 'mrel', 'ams');
defineSymbol('\\gggtr', '\u22d9', 'mrel', 'ams');
defineSymbol('\\lhd', '\u22b2', 'mbin', 'ams');
defineSymbol('\\rhd', '\u22b3', 'mbin', 'ams');
defineSymbol('\\Join', '\u22c8', 'mrel');

defineSymbol('\\doteq', '\u2250', 'mrel');
defineSymbol('\\doteqdot', '\u2251', 'mrel', 'ams');
defineSymbol('\\Doteq', '\u2251', 'mrel', 'ams');
defineSymbol('\\eqcirc', '\u2256', 'mrel', 'ams');
defineSymbol('\\circeq', '\u2257', 'mrel', 'ams');
defineSymbol('\\lessdot', '\u22d6', 'mbin', 'ams');
defineSymbol('\\gtrdot', '\u22d7', 'mbin', 'ams');

// In TeX, '~' is a spacing command (non-breaking space).
// However, '~' is used as an ASCII Math shortctut character, so define a \\~
// command which maps to the '~' character
defineSymbol('\\~', '~', 'mrel');

defineSymbol('\\leftrightarrow', '\u2194', 'mrel');
defineSymbol('\\Leftrightarrow', '\u21d4', 'mrel');
defineSymbol('\\to', '\u2192', 'mrel');
defineSymbol('\\models', '\u22a8', 'mrel');
defineSymbol('\\vdash', '\u22a2', 'mrel');

defineSymbol('\\therefore', '\u2234', 'mrel', 'ams');
defineSymbol('\\because', '\u2235', 'mrel', 'ams');
defineSymbol('\\implies', '\u27f9', 'mrel');
defineSymbol('\\gets', '\u2190', 'mrel');
defineSymbol('\\dashv', '\u22a3', 'mrel');
defineSymbol('\\impliedby', '\u27f8', 'mrel');
defineSymbol('\\biconditional', '\u27f7', 'mrel');
defineSymbol('\\roundimplies', '\u2970', 'mrel');

// 'ams' Binary Operators

defineSymbol('+', '+', 'mbin');
defineSymbol('-', '\u2212', 'mbin');
defineSymbol('\u2212', '\u2212', 'mbin');
defineSymbol('\\pm', '\u00b1', 'mbin');
defineSymbol('\\mp', '\u2213', 'mbin');
defineSymbol('*', '\u2217', 'mbin');
defineSymbol('\\times', '\u00d7', 'mbin');
defineSymbol('\\div', '\u00f7', 'mbin');
defineSymbol('\\surd', '\u221a');

defineSymbol('\\divides', '\u2223', 'mbin');
// From MnSymbol package

defineSymbol('\\ltimes', '\u22c9', 'mbin', 'ams');
defineSymbol('\\rtimes', '\u22ca', 'mbin', 'ams');
defineSymbol('\\leftthreetimes', '\u22cb', 'mbin', 'ams');
defineSymbol('\\rightthreetimes', '\u22cc', 'mbin', 'ams');
defineSymbol('\\intercal', '\u22ba', 'mbin', 'ams');
defineSymbol('\\dotplus', '\u2214', 'mbin', 'ams');
defineSymbol('\\centerdot', '\u22c5', 'mbin', 'ams');
defineSymbol('\\doublebarwedge', '\u2a5e', 'mbin', 'ams');
defineSymbol('\\divideontimes', '\u22c7', 'mbin', 'ams');
defineSymbol('\\cdot', '\u22c5', 'mbin');

defineSymbol('\\infty', '\u221e');
defineSymbol('\\prime', '\u2032');
defineSymbol('\\doubleprime', '\u2033'); // NOTE: Not in TeX, but Mathematica
defineSymbol('\\angle', '\u2220');
defineSymbol('`', '\u2018');
defineSymbol('\\$', '$');
defineSymbol('\\%', '%');
defineSymbol('\\_', '_');

// Note: In TeX, greek symbols are only available in Math mode
defineSymbol('\\alpha', '\u03b1');
defineSymbol('\\beta', '\u03b2');
defineSymbol('\\gamma', '\u03b3');
defineSymbol('\\delta', '\u03b4');
defineSymbol('\\epsilon', '\u03f5');
defineSymbol('\\varepsilon', '\u03b5');
defineSymbol('\\zeta', '\u03b6');
defineSymbol('\\eta', '\u03b7');
defineSymbol('\\theta', '\u03b8');
defineSymbol('\\vartheta', '\u03d1');
defineSymbol('\\iota', '\u03b9');
defineSymbol('\\kappa', '\u03ba');
defineSymbol('\\varkappa', '\u03f0', 'mord', 'ams');
defineSymbol('\\lambda', '\u03bb');
defineSymbol('\\mu', '\u03bc');
defineSymbol('\\nu', '\u03bd');
defineSymbol('\\xi', '\u03be');
defineSymbol('\\omicron', 'o');
defineSymbol('\\pi', '\u03c0');
defineSymbol('\\varpi', '\u03d6');
defineSymbol('\\rho', '\u03c1');
defineSymbol('\\varrho', '\u03f1');
defineSymbol('\\sigma', '\u03c3');
defineSymbol('\\varsigma', '\u03c2');
defineSymbol('\\tau', '\u03c4');
defineSymbol('\\phi', '\u03d5');
defineSymbol('\\varphi', '\u03c6');
defineSymbol('\\upsilon', '\u03c5');
defineSymbol('\\chi', '\u03c7');
defineSymbol('\\psi', '\u03c8');
defineSymbol('\\omega', '\u03c9');

defineSymbol('\\Gamma', '\u0393');
defineSymbol('\\Delta', '\u0394');
defineSymbol('\\Theta', '\u0398');
defineSymbol('\\Lambda', '\u039b');
defineSymbol('\\Xi', '\u039e');
defineSymbol('\\Pi', '\u03a0');
defineSymbol('\\Sigma', '\u03a3');
defineSymbol('\\Upsilon', '\u03a5');
defineSymbol('\\Phi', '\u03a6');
defineSymbol('\\Psi', '\u03a8');
defineSymbol('\\Omega', '\u03a9');

// 'ams' Greek
defineSymbol('\\digamma', '\u03dd', 'mord', 'ams');

defineSymbol('\\emptyset', '\u2205');
defineSymbol('\\varnothing', '\u2205', 'mord', 'ams');

defineSymbol('\\cap', '\u2229', 'mbin');
defineSymbol('\\cup', '\u222a', 'mbin');
defineSymbol('\\setminus', '\u2216', 'mbin');
defineSymbol('\\smallsetminus', '\u2216', 'mbin', 'ams');
defineSymbol('\\complement', '\u2201', 'mord', 'ams');

defineSymbol('\\in', '\u2208', 'mrel');
defineSymbol('\\notin', '\u2209', 'mrel');
defineSymbol('\\not', '\u0338', 'mrel');
defineSymbol('\\ni', '\u220b', 'mrel');
defineSymbol('\\owns', '\u220b', 'mrel');
defineSymbol('\\subset', '\u2282', 'mrel');
defineSymbol('\\supset', '\u2283', 'mrel');
defineSymbol('\\subseteq', '\u2286', 'mrel');
defineSymbol('\\supseteq', '\u2287', 'mrel');
defineSymbol('\\subsetneq', '\u228a', 'mrel', 'ams');
defineSymbol('\\varsubsetneq', '\ue01a', 'mrel', 'ams');
defineSymbol('\\subsetneqq', '\u2acb', 'mrel', 'ams');
defineSymbol('\\varsubsetneqq', '\ue017', 'mrel', 'ams');
defineSymbol('\\nsubset', '\u2284', 'mrel', 'ams'); // NOTE: Not TeX?
defineSymbol('\\nsupset', '\u2285', 'mrel', 'ams'); // NOTE: Not TeX?
defineSymbol('\\nsubseteq', '\u2288', 'mrel', 'ams');
defineSymbol('\\nsupseteq', '\u2289', 'mrel', 'ams');

// See http://tex.stackexchange.com/questions/41476/lengths-and-when-to-use-them
defineSymbol('\\ ', '\u00a0', 'spacing');
defineSymbol('~', '\u00a0', 'spacing');
defineSymbol('\\space', '\u00a0', 'spacing');

defineSymbol('\\!', null, 'spacing');
defineSymbol('\\,', null, 'spacing');
defineSymbol('\\:', null, 'spacing');
defineSymbol('\\;', null, 'spacing');
defineSymbol('\\enskip', null, 'spacing');
// \enspace is a TeX command (not LaTeX) equivalent to a \skip
defineSymbol('\\enspace', null, 'spacing');
defineSymbol('\\quad', null, 'spacing');
defineSymbol('\\qquad', null, 'spacing');

// Punctuation

defineSymbol('\\colon', ':', 'mpunct');
defineSymbol('\\cdotp', '\u22c5', 'mpunct');
defineSymbol('\\ldots', '\u2026', 'minner');
defineSymbol('\\cdots', '\u22ef', 'minner');
defineSymbol('\\ddots', '\u22f1', 'minner');
defineSymbol('\\mathellipsis', '\u2026', 'minner');
defineSymbol('\\vdots', '\u22ee');
defineSymbol('\\ldotp', '\u002e', 'mpunct');
defineSymbol(',', ',', 'mpunct');
defineSymbol(';', ';', 'mpunct');

defineSymbol('\\wedge', '\u2227', 'mbin');
defineSymbol('\\vee', '\u2228', 'mbin');

defineSymbol('\\lnot', '\u00ac');
defineSymbol('\\neg', '\u00ac');

defineSymbol('\\land', '\u2227', 'mbin');
defineSymbol('\\lor', '\u2228', 'mbin');
defineSymbol('\\barwedge', '\u22bc', 'mbin', 'ams');
defineSymbol('\\veebar', '\u22bb', 'mbin', 'ams');
defineSymbol('\\nor', '\u22bb', 'mbin', 'ams'); // NOTE: Not TeX, Mathematica
defineSymbol('\\curlywedge', '\u22cf', 'mbin', 'ams');
defineSymbol('\\curlyvee', '\u22ce', 'mbin', 'ams');

defineSymbol('\\square', '\u25a1', 'mord', 'ams');
defineSymbol('\\Box', '\u25a1', 'mord', 'ams');
defineSymbol('\\blacksquare', '\u25a0', 'mord', 'ams');
defineSymbol('\\boxminus', '\u229f', 'mbin', 'ams');
defineSymbol('\\boxplus', '\u229e', 'mbin', 'ams');
defineSymbol('\\boxtimes', '\u22a0', 'mbin', 'ams');
defineSymbol('\\boxdot', '\u22a1', 'mbin', 'ams');

defineSymbol('\\circ', '\u2218', 'mbin');
defineSymbol('\\bigcirc', '\u25ef', 'mbin');
defineSymbol('\\bullet', '\u2219', 'mbin');
defineSymbol('\\circleddash', '\u229d', 'mbin', 'ams');
defineSymbol('\\circledast', '\u229b', 'mbin', 'ams');
defineSymbol('\\oplus', '\u2295', 'mbin');
defineSymbol('\\ominus', '\u2296', 'mbin');
defineSymbol('\\otimes', '\u2297', 'mbin');
defineSymbol('\\odot', '\u2299', 'mbin');
defineSymbol('\\circledcirc', '\u229a', 'mbin', 'ams');
defineSymbol('\\oslash', '\u2298', 'mbin');
defineSymbol('\\circledS', '\u24c8', 'mord', 'ams');
defineSymbol('\\circledR', '\u00ae', 'mord', 'ams');

defineSymbol('\\triangle', '\u25b3');
defineSymbol('\\triangleq', '\u225c', 'mrel', 'ams');
defineSymbol('\\bigtriangleup', '\u25b3', 'mbin');
defineSymbol('\\vartriangle', '\u25b3', 'mrel', 'ams');

defineSymbol('\\triangledown', '\u25bd', 'mord', 'ams');
defineSymbol('\\bigtriangledown', '\u25bd', 'mbin');

defineSymbol('\\triangleleft', '\u25c3', 'mbin');
defineSymbol('\\vartriangleleft', '\u22b2', 'mrel', 'ams');
defineSymbol('\\trianglelefteq', '\u22b4', 'mrel', 'ams');
defineSymbol('\\ntriangleleft', '\u22ea', 'mrel', 'ams');
defineSymbol('\\ntrianglelefteq', '\u22ec', 'mrel', 'ams');

defineSymbol('\\triangleright', '\u25b9', 'mbin');
defineSymbol('\\vartriangleright', '\u22b3', 'mrel', 'ams');
defineSymbol('\\trianglerighteq', '\u22b5', 'mrel', 'ams');
defineSymbol('\\ntriangleright', '\u22eb', 'mrel', 'ams');
defineSymbol('\\ntrianglerighteq', '\u22ed', 'mrel', 'ams');

defineSymbol('\\blacktriangle', '\u25b2', 'mord', 'ams');
defineSymbol('\\blacktriangledown', '\u25bc', 'mord', 'ams');
defineSymbol('\\blacktriangleleft', '\u25c0', 'mrel', 'ams');
defineSymbol('\\blacktriangleright', '\u25b6', 'mrel', 'ams');

defineSymbol('\\/', '/');
defineSymbol('|', '\u2223', 'textord');

defineSymbol('\\And', '\u0026', 'mbin');
defineSymbol('\\imath', '\u0131');
defineSymbol('\\jmath', '\u0237');

defineSymbol('\\degree', '\u00b0');

defineSymbol("'", '\u2032'); // Prime
defineSymbol('"', '\u201D'); // Double Prime
// defineSymbol( "\'', '\u2033',  'mord',  MAIN);       // Double Prime
