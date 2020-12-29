import {
  defineSymbol,
  defineSymbols,
  defineSymbolRange,
} from './definitions-utils';

// Simple characters allowed in math mode
defineSymbols('0123456789/@.?!');
defineSymbolRange(0x0041, 0x005a); // A-z
defineSymbolRange(0x0061, 0x007a); // A-Z

// Quantifiers

defineSymbol('\\forall', '\u2200');
defineSymbol('\\exists', '\u2203');
defineSymbol('\\nexists', '\u2204', 'mord', 'ams');
defineSymbol('\\mid', '\u2223', 'mrel');
defineSymbol('\\top', '\u22A4');
defineSymbol('\\bot', '\u22A5');

// Misc Symbols

defineSymbol('\\sharp', '\u266F');
defineSymbol('\\flat', '\u266D');
defineSymbol('\\natural', '\u266E');
defineSymbol('\\#', '\u0023');
defineSymbol('\\&', '\u0026');
defineSymbol('\\clubsuit', '\u2663');
defineSymbol('\\heartsuit', '\u2661');
defineSymbol('\\spadesuit', '\u2660');
defineSymbol('\\diamondsuit', '\u2662');

// DefineSymbol( '\\cross', '\uF4A0',  'mord',  MAIN); // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\transpose', '\uF3C7',  'mord',  MAIN); // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\conjugate', 'conj'],  MAIN,  'mord', '\uF3C8'); // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\conjugatetranspose', '\uF3C9',  'mord',  MAIN); // NOTE: not a real TeX symbol, but Mathematica
// defineSymbol( '\\hermitianconjugate', '\uF3CE',  'mord',  MAIN); // NOTE: not a real TeX symbol, but Mathematica
defineSymbol('\\differencedelta', '\u2206', 'mrel');

defineSymbol('\\backslash', '\\');

defineSymbol('\\nabla', '\u2207');
defineSymbol('\\partial', '\u2202');

defineSymbol('\\ell', '\u2113');

defineSymbol('\\hbar', '\u210F');
defineSymbol('\\hslash', '\u210F', 'mord', 'ams');

defineSymbol('\\Finv', '\u2132', 'mord', 'ams');
defineSymbol('\\Game', '\u2141', 'mord', 'ams');

defineSymbol('\\wp', '\u2118');
defineSymbol('\\eth', '\u00F0', 'mord', 'ams');

defineSymbol('\\mho', '\u2127', 'mord', 'ams');

defineSymbol('\\Bbbk', '\u006B', 'mord', 'ams');
defineSymbol('\\N', 'N', 'mord', 'double-struck'); // NOTE: Check if standard Latex
defineSymbol('\\R', 'R', 'mord', 'double-struck'); // NOTE: Check if standard Latex
defineSymbol('\\Q', 'Q', 'mord', 'double-struck'); // NOTE: Check if standard Latex
defineSymbol('\\C', 'C', 'mord', 'double-struck'); // NOTE: Check if standard Latex
defineSymbol('\\Z', 'Z', 'mord', 'double-struck'); // NOTE: Check if standard Latex
defineSymbol('\\P', 'P', 'mord', 'double-struck'); // NOTE: Check if standard Latex

defineSymbol('\\pounds', '\u00A3');
defineSymbol('\\yen', '\u00A5', 'mord', 'ams');
defineSymbol('\\euro', '\u20AC'); // NOTE: not TeX built-in, but textcomp package

// TODO Koppa, Stigma, Sampi

// Math and Text

defineSymbol('\\dagger', '\u2020', 'mbin');
defineSymbol('\\dag', '\u2020', 'mbin');
defineSymbol('\\ddag', '\u2021', 'mbin');
defineSymbol('\\ddagger', '\u2021', 'mbin');
defineSymbol('\\maltese', '\u2720', 'mord', 'ams');

// Arrow Symbols

defineSymbol('\\rightarrow', '\u2192', 'mrel');
defineSymbol('\\to', '\u2192', 'mrel');
defineSymbol('\\leftarrow', '\u2190', 'mrel');
defineSymbol('\\gets', '\u2190', 'mrel');
defineSymbol('\\Rightarrow', '\u21D2', 'mrel');
defineSymbol('\\Leftarrow', '\u21D0', 'mrel');
defineSymbol('\\longrightarrow', '\u27F6', 'mrel');
defineSymbol('\\longleftarrow', '\u27F5', 'mrel');
defineSymbol('\\Longrightarrow', '\u27F9', 'mrel');
defineSymbol('\\implies', '\u27F9', 'mrel');
defineSymbol('\\Longleftarrow', '\u27F8', 'mrel');
defineSymbol('\\impliedby', '\u27F8', 'mrel');
defineSymbol('\\dashrightarrow', '\u21E2', 'mrel', 'ams');
defineSymbol('\\dashleftarrow', '\u21E0', 'mrel', 'ams');
defineSymbol('\\Rrightarrow', '\u21DB', 'mrel', 'ams');
defineSymbol('\\Lleftarrow', '\u21DA', 'mrel', 'ams');

defineSymbol('\\longleftrightarrow', '\u27F7', 'mrel');
defineSymbol('\\biconditional', '\u27F7', 'mrel');
defineSymbol('\\Longleftrightarrow', '\u27FA', 'mrel');

defineSymbol('\\leftrightarrows', '\u21C6', 'mrel', 'ams');
defineSymbol('\\rightleftarrows', '\u21C4', 'mrel', 'ams');

defineSymbol('\\mapsto', '\u21A6', 'mrel');
defineSymbol('\\longmapsto', '\u27FC', 'mrel');

defineSymbol('\\uparrow', '\u2191', 'mrel');
defineSymbol('\\downarrow', '\u2193', 'mrel');
defineSymbol('\\Uparrow', '\u21D1', 'mrel');
defineSymbol('\\Downarrow', '\u21D3', 'mrel');
defineSymbol('\\updownarrow', '\u2195', 'mrel');
defineSymbol('\\Updownarrow', '\u21D5', 'mrel');

defineSymbol('\\curvearrowright', '\u21B7', 'mrel', 'ams');
defineSymbol('\\curvearrowleft', '\u21B6', 'mrel', 'ams');

defineSymbol('\\hookrightarrow', '\u21AA', 'mrel');
defineSymbol('\\hookleftarrow', '\u21A9', 'mrel');

defineSymbol('\\rightharpoonup', '\u21C0', 'mrel');
defineSymbol('\\leftharpoonup', '\u21BC', 'mrel');
defineSymbol('\\rightharpoondown', '\u21C1', 'mrel');
defineSymbol('\\leftharpoondown', '\u21BD', 'mrel');

defineSymbol('\\rightrightarrows', '\u21C9', 'mrel', 'ams');
defineSymbol('\\leftleftarrows', '\u21C7', 'mrel', 'ams');
defineSymbol('\\upuparrows', '\u21C8', 'mrel', 'ams');
defineSymbol('\\downdownarrows', '\u21CA', 'mrel', 'ams');

defineSymbol('\\leftarrowtail', '\u21A2', 'mrel', 'ams');
defineSymbol('\\rightarrowtail', '\u21A3', 'mrel', 'ams');

defineSymbol('\\looparrowright', '\u21AC', 'mrel', 'ams');
defineSymbol('\\looparrowleft', '\u21AB', 'mrel', 'ams');

defineSymbol('\\twoheadleftarrow', '\u219E', 'mrel', 'ams');
defineSymbol('\\twoheadrightarrow', '\u21A0', 'mrel', 'ams');

defineSymbol('\\rightleftharpoons', '\u21CC', 'mrel');
defineSymbol('\\leftrightharpoons', '\u21CB', 'mrel', 'ams');

defineSymbol('\\Rsh', '\u21B1', 'mrel', 'ams');
defineSymbol('\\Lsh', '\u21B0', 'mrel', 'ams');

defineSymbol('\\searrow', '\u2198', 'mrel');
defineSymbol('\\nearrow', '\u2197', 'mrel');
defineSymbol('\\swarrow', '\u2199', 'mrel');
defineSymbol('\\nwarrow', '\u2196', 'mrel');

defineSymbol('\\circlearrowright', '\u21BB', 'mrel', 'ams');
defineSymbol('\\circlearrowleft', '\u21BA', 'mrel', 'ams');

defineSymbol('\\restriction', '\u21BE', 'mrel', 'ams');
defineSymbol('\\upharpoonright', '\u21BE', 'mrel', 'ams');
defineSymbol('\\upharpoonleft', '\u21BF', 'mrel', 'ams');
defineSymbol('\\downharpoonright', '\u21C2', 'mrel', 'ams');
defineSymbol('\\downharpoonleft', '\u21C3', 'mrel', 'ams');

defineSymbol('\\rightsquigarrow', '\u21DD', 'mrel', 'ams');
defineSymbol('\\leadsto', '\u21DD', 'mrel', 'ams');
defineSymbol('\\leftrightsquigarrow', '\u21AD', 'mrel', 'ams');

defineSymbol('\\originalof', '\u22B6', 'mrel');
defineSymbol('\\laplace', '\u22B6', 'mrel');
defineSymbol('\\imageof', '\u22B7', 'mrel');
defineSymbol('\\Laplace', '\u22B7', 'mrel');
defineSymbol('\\multimap', '\u22B8', 'mrel', 'ams');

// 'ams' Negated Arrows

defineSymbol('\\nrightarrow', '\u219B', 'mrel', 'ams');
defineSymbol('\\nleftarrow', '\u219A', 'mrel', 'ams');
defineSymbol('\\nRightarrow', '\u21CF', 'mrel', 'ams');
defineSymbol('\\nLeftarrow', '\u21CD', 'mrel', 'ams');
defineSymbol('\\nleftrightarrow', '\u21AE', 'mrel', 'ams');
defineSymbol('\\nLeftrightarrow', '\u21CE', 'mrel', 'ams');

// 'ams' Negated Binary Relations

defineSymbol('\\nless', '\u226E', 'mrel', 'ams');
defineSymbol('\\nleqslant', '\uE010', 'mrel', 'ams');
defineSymbol('\\lneq', '\u2A87', 'mrel', 'ams');
defineSymbol('\\lneqq', '\u2268', 'mrel', 'ams');
defineSymbol('\\nleqq', '\uE011', 'mrel', 'ams');

defineSymbol('\\unlhd', '\u22B4', 'mbin', 'ams');
defineSymbol('\\unrhd', '\u22B5', 'mbin', 'ams');

defineSymbol('\\lvertneqq', '\uE00C', 'mrel', 'ams');
defineSymbol('\\lnsim', '\u22E6', 'mrel', 'ams');
defineSymbol('\\lnapprox', '\u2A89', 'mrel', 'ams');
defineSymbol('\\nprec', '\u2280', 'mrel', 'ams');
defineSymbol('\\npreceq', '\u22E0', 'mrel', 'ams');
defineSymbol('\\precnsim', '\u22E8', 'mrel', 'ams');
defineSymbol('\\precnapprox', '\u2AB9', 'mrel', 'ams');
defineSymbol('\\nsim', '\u2241', 'mrel', 'ams');
defineSymbol('\\nshortmid', '\uE006', 'mrel', 'ams');
defineSymbol('\\nmid', '\u2224', 'mrel', 'ams');
defineSymbol('\\nvdash', '\u22AC', 'mrel', 'ams');
defineSymbol('\\nvDash', '\u22AD', 'mrel', 'ams');
defineSymbol('\\ngtr', '\u226F', 'mrel', 'ams');
defineSymbol('\\ngeqslant', '\uE00F', 'mrel', 'ams');
defineSymbol('\\ngeqq', '\uE00E', 'mrel', 'ams');
defineSymbol('\\gneq', '\u2A88', 'mrel', 'ams');
defineSymbol('\\gneqq', '\u2269', 'mrel', 'ams');
defineSymbol('\\gvertneqq', '\uE00D', 'mrel', 'ams');
defineSymbol('\\gnsim', '\u22E7', 'mrel', 'ams');
defineSymbol('\\gnapprox', '\u2A8A', 'mrel', 'ams');
defineSymbol('\\nsucc', '\u2281', 'mrel', 'ams');
defineSymbol('\\nsucceq', '\u22E1', 'mrel', 'ams');
defineSymbol('\\succnsim', '\u22E9', 'mrel', 'ams');
defineSymbol('\\succnapprox', '\u2ABA', 'mrel', 'ams');
defineSymbol('\\ncong', '\u2246', 'mrel', 'ams');
defineSymbol('\\nshortparallel', '\uE007', 'mrel', 'ams');
defineSymbol('\\nparallel', '\u2226', 'mrel', 'ams');
defineSymbol('\\nVDash', '\u22AF', 'mrel', 'ams');
defineSymbol('\\nsupseteqq', '\uE018', 'mrel', 'ams');
defineSymbol('\\supsetneq', '\u228B', 'mrel', 'ams');
defineSymbol('\\varsupsetneq', '\uE01B', 'mrel', 'ams');
defineSymbol('\\supsetneqq', '\u2ACC', 'mrel', 'ams');
defineSymbol('\\varsupsetneqq', '\uE019', 'mrel', 'ams');
defineSymbol('\\nVdash', '\u22AE', 'mrel', 'ams');
defineSymbol('\\precneqq', '\u2AB5', 'mrel', 'ams');
defineSymbol('\\succneqq', '\u2AB6', 'mrel', 'ams');
defineSymbol('\\nsubseteqq', '\uE016', 'mrel', 'ams');

// 'ams' Misc

defineSymbol('\\checkmark', '\u2713', 'mord', 'ams');

defineSymbol('\\diagup', '\u2571', 'mord', 'ams');
defineSymbol('\\diagdown', '\u2572', 'mord', 'ams');

defineSymbol('\\measuredangle', '\u2221', 'mord', 'ams');
defineSymbol('\\sphericalangle', '\u2222', 'mord', 'ams');

defineSymbol('\\backprime', '\u2035', 'mord', 'ams');
defineSymbol('\\backdoubleprime', '\u2036', 'mord', 'ams');

defineSymbol('\\ast', '\u2217', 'mbin');
defineSymbol('\\star', '\u22C6', 'mbin');
defineSymbol('\\diamond', '\u22C4', 'mbin');
defineSymbol('\\Diamond', '\u25CA', 'mord', 'ams');
defineSymbol('\\lozenge', '\u25CA', 'mord', 'ams');
defineSymbol('\\blacklozenge', '\u29EB', 'mord', 'ams');
defineSymbol('\\bigstar', '\u2605', 'mord', 'ams');

// 'ams' Hebrew

defineSymbol('\\aleph', '\u2135');
defineSymbol('\\beth', '\u2136', 'mord', 'ams');
defineSymbol('\\daleth', '\u2138', 'mord', 'ams');
defineSymbol('\\gimel', '\u2137', 'mord', 'ams');

// 'ams' Delimiters

defineSymbol('\\lbrace', '{', 'mopen');
defineSymbol('\\rbrace', '}', 'mclose');
defineSymbol('\\langle', '\u27E8', 'mopen');
defineSymbol('\\rangle', '\u27E9', 'mclose');
defineSymbol('\\lfloor', '\u230A', 'mopen');
defineSymbol('\\rfloor', '\u230B', 'mclose');
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
defineSymbol('\\parallel', '\u2225', 'mrel');
defineSymbol('\\shortparallel', '\u2225', 'mrel', 'ams');

defineSymbol('\\lbrack', '[', 'mopen');
defineSymbol('\\rbrack', ']', 'mclose');
defineSymbol('\\{', '{', 'mopen');
defineSymbol('\\}', '}', 'mclose');

defineSymbol('(', '(', 'mopen');
defineSymbol(')', ')', 'mclose');
defineSymbol('[', '[', 'mopen');
defineSymbol(']', ']', 'mclose');

defineSymbol('\\ulcorner', '\u250C', 'mopen', 'ams');
defineSymbol('\\urcorner', '\u2510', 'mclose', 'ams');
defineSymbol('\\llcorner', '\u2514', 'mopen', 'ams');
defineSymbol('\\lrcorner', '\u2518', 'mclose', 'ams');

// Large Delimiters

defineSymbol('\\lgroup', '\u27EE', 'mopen');
defineSymbol('\\rgroup', '\u27EF', 'mclose');
defineSymbol('\\lmoustache', '\u23B0', 'mopen');
defineSymbol('\\rmoustache', '\u23B1', 'mclose');

// Relations

defineSymbol('=', '=', 'mrel');
defineSymbol('\\ne', '\u2260', 'mrel');
defineSymbol('\\neq', '\u2260', 'mrel');
// DefineSymbol( '\\longequal', '\uF7D9',  'mrel',  MAIN);   // NOTE: Not TeX

defineSymbol('<', '<', 'mrel');
defineSymbol('\\lt', '<', 'mrel');
defineSymbol('>', '>', 'mrel');
defineSymbol('\\gt', '>', 'mrel');

defineSymbol('\\le', '\u2264', 'mrel');
defineSymbol('\\leq', '\u2264', 'mrel');
defineSymbol('\\ge', '\u2265', 'mrel');
defineSymbol('\\geq', '\u2265', 'mrel');

defineSymbol('\\leqslant', '\u2A7D', 'mrel', 'ams');
defineSymbol('\\geqslant', '\u2A7E', 'mrel', 'ams');

defineSymbol('\\ll', '\u226A', 'mrel');
defineSymbol('\\gg', '\u226B', 'mrel');
defineSymbol('\\coloneq', '\u2254', 'mrel');
defineSymbol('\\measeq', '\u225D', 'mrel'); // MEASSURED BY
defineSymbol('\\eqdef', '\u225E', 'mrel');
defineSymbol('\\questeq', '\u225F', 'mrel'); // QUESTIONED EQUAL TO

defineSymbol(':', ':', 'mrel');
defineSymbol('\\cong', '\u2245', 'mrel');

defineSymbol('\\equiv', '\u2261', 'mrel');

defineSymbol('\\prec', '\u227A', 'mrel');
defineSymbol('\\preceq', '\u2AAF', 'mrel');
defineSymbol('\\succ', '\u227B', 'mrel');
defineSymbol('\\succeq', '\u2AB0', 'mrel');

defineSymbol('\\perp', '\u22A5', 'mrel');

defineSymbol('\\propto', '\u221D', 'mrel');
defineSymbol('\\Colon', '\u2237', 'mrel');

defineSymbol('\\smile', '\u2323', 'mrel');
defineSymbol('\\frown', '\u2322', 'mrel');

defineSymbol('\\sim', '\u223C', 'mrel');
defineSymbol('\\gtrsim', '\u2273', 'mrel', 'ams');

defineSymbol('\\approx', '\u2248', 'mrel');

defineSymbol('\\approxeq', '\u224A', 'mrel', 'ams');
defineSymbol('\\thickapprox', '\u2248', 'mrel', 'ams');
defineSymbol('\\lessapprox', '\u2A85', 'mrel', 'ams');
defineSymbol('\\gtrapprox', '\u2A86', 'mrel', 'ams');
defineSymbol('\\precapprox', '\u2AB7', 'mrel', 'ams');
defineSymbol('\\succapprox', '\u2AB8', 'mrel', 'ams');

defineSymbol('\\thicksim', '\u223C', 'mrel', 'ams');
defineSymbol('\\succsim', '\u227F', 'mrel', 'ams');
defineSymbol('\\precsim', '\u227E', 'mrel', 'ams');
defineSymbol('\\backsim', '\u223D', 'mrel', 'ams');
defineSymbol('\\eqsim', '\u2242', 'mrel', 'ams');
defineSymbol('\\backsimeq', '\u22CD', 'mrel', 'ams');
defineSymbol('\\simeq', '\u2243', 'mrel');
defineSymbol('\\lesssim', '\u2272', 'mrel', 'ams');

defineSymbol('\\nleq', '\u2270', 'mrel', 'ams');
defineSymbol('\\ngeq', '\u2271', 'mrel', 'ams');

defineSymbol('\\smallsmile', '\u2323', 'mrel', 'ams');
defineSymbol('\\smallfrown', '\u2322', 'mrel', 'ams');
defineSymbol('\\bowtie', '\u22C8', 'mrel');
defineSymbol('\\Join', '\u22C8', 'mrel');

defineSymbol('\\asymp', '\u224D', 'mrel');

defineSymbol('\\sqsubseteq', '\u2291', 'mrel');
defineSymbol('\\sqsupseteq', '\u2292', 'mrel');

defineSymbol('\\leqq', '\u2266', 'mrel', 'ams');
defineSymbol('\\eqslantless', '\u2A95', 'mrel', 'ams');

defineSymbol('\\lll', '\u22D8', 'mrel', 'ams');
defineSymbol('\\lessgtr', '\u2276', 'mrel', 'ams');
defineSymbol('\\lesseqgtr', '\u22DA', 'mrel', 'ams');
defineSymbol('\\lesseqqgtr', '\u2A8B', 'mrel', 'ams');
defineSymbol('\\risingdotseq', '\u2253', 'mrel', 'ams');
defineSymbol('\\fallingdotseq', '\u2252', 'mrel', 'ams');
defineSymbol('\\subseteqq', '\u2AC5', 'mrel', 'ams');
defineSymbol('\\Subset', '\u22D0', 'mrel', 'ams');
defineSymbol('\\sqsubset', '\u228F', 'mrel', 'ams');
defineSymbol('\\preccurlyeq', '\u227C', 'mrel', 'ams');
defineSymbol('\\curlyeqprec', '\u22DE', 'mrel', 'ams');
defineSymbol('\\vDash', '\u22A8', 'mrel', 'ams');
defineSymbol('\\Vvdash', '\u22AA', 'mrel', 'ams');
defineSymbol('\\bumpeq', '\u224F', 'mrel', 'ams');
defineSymbol('\\Bumpeq', '\u224E', 'mrel', 'ams');
defineSymbol('\\geqq', '\u2267', 'mrel', 'ams');
defineSymbol('\\eqslantgtr', '\u2A96', 'mrel', 'ams');
defineSymbol('\\ggg', '\u22D9', 'mrel', 'ams');
defineSymbol('\\gtrless', '\u2277', 'mrel', 'ams');
defineSymbol('\\gtreqless', '\u22DB', 'mrel', 'ams');
defineSymbol('\\gtreqqless', '\u2A8C', 'mrel', 'ams');

defineSymbol('\\supseteqq', '\u2AC6', 'mrel', 'ams');
defineSymbol('\\Supset', '\u22D1', 'mrel', 'ams');
defineSymbol('\\sqsupset', '\u2290', 'mrel', 'ams');
defineSymbol('\\succcurlyeq', '\u227D', 'mrel', 'ams');
defineSymbol('\\curlyeqsucc', '\u22DF', 'mrel', 'ams');
defineSymbol('\\Vdash', '\u22A9', 'mrel', 'ams');
defineSymbol('\\shortmid', '\u2223', 'mrel', 'ams');
defineSymbol('\\between', '\u226C', 'mrel', 'ams');
defineSymbol('\\pitchfork', '\u22D4', 'mrel', 'ams');
defineSymbol('\\varpropto', '\u221D', 'mrel', 'ams');
defineSymbol('\\backepsilon', '\u220D', 'mrel', 'ams');
defineSymbol('\\llless', '\u22D8', 'mrel', 'ams');
defineSymbol('\\gggtr', '\u22D9', 'mrel', 'ams');
defineSymbol('\\lhd', '\u22B2', 'mbin', 'ams');
defineSymbol('\\rhd', '\u22B3', 'mbin', 'ams');

defineSymbol('\\doteq', '\u2250', 'mrel');
defineSymbol('\\doteqdot', '\u2251', 'mrel', 'ams');
defineSymbol('\\Doteq', '\u2251', 'mrel', 'ams');
defineSymbol('\\eqcirc', '\u2256', 'mrel', 'ams');
defineSymbol('\\circeq', '\u2257', 'mrel', 'ams');
defineSymbol('\\lessdot', '\u22D6', 'mbin', 'ams');
defineSymbol('\\gtrdot', '\u22D7', 'mbin', 'ams');

// In TeX, '~' is a spacing command (non-breaking space).
// However, '~' is used as an ASCII Math shortctut character, so define a \\~
// command which maps to the '~' character
defineSymbol('\\~', '~', 'mrel');

defineSymbol('\\leftrightarrow', '\u2194', 'mrel');
defineSymbol('\\Leftrightarrow', '\u21D4', 'mrel');
defineSymbol('\\models', '\u22A8', 'mrel');
defineSymbol('\\vdash', '\u22A2', 'mrel');

defineSymbol('\\therefore', '\u2234', 'mrel', 'ams');
defineSymbol('\\because', '\u2235', 'mrel', 'ams');
defineSymbol('\\dashv', '\u22A3', 'mrel');
defineSymbol('\\roundimplies', '\u2970', 'mrel');

// 'ams' Binary Operators

defineSymbol('+', '+', 'mbin');
defineSymbol('-', '\u2212', 'mbin');
defineSymbol('\u2212', '\u2212', 'mbin');
defineSymbol('\\pm', '\u00B1', 'mbin');
defineSymbol('\\mp', '\u2213', 'mbin');
defineSymbol('*', '\u2217', 'mbin');
defineSymbol('\\times', '\u00D7', 'mbin');
defineSymbol('\\div', '\u00F7', 'mbin');
defineSymbol('\\surd', '\u221A');

defineSymbol('\\divides', '\u2223', 'mbin');
// From MnSymbol package

defineSymbol('\\ltimes', '\u22C9', 'mbin', 'ams');
defineSymbol('\\rtimes', '\u22CA', 'mbin', 'ams');
defineSymbol('\\leftthreetimes', '\u22CB', 'mbin', 'ams');
defineSymbol('\\rightthreetimes', '\u22CC', 'mbin', 'ams');
defineSymbol('\\intercal', '\u22BA', 'mbin', 'ams');
defineSymbol('\\dotplus', '\u2214', 'mbin', 'ams');
defineSymbol('\\doublebarwedge', '\u2A5E', 'mbin', 'ams');
defineSymbol('\\divideontimes', '\u22C7', 'mbin', 'ams');
defineSymbol('\\centerdot', '\u22C5', 'mbin', 'ams');
defineSymbol('\\cdot', '\u22C5', 'mbin');

defineSymbol('\\infty', '\u221E');
defineSymbol('\\prime', '\u2032');
defineSymbol('\\doubleprime', '\u2033'); // NOTE: Not in TeX, but Mathematica
defineSymbol('\\angle', '\u2220');
defineSymbol('`', '\u2018');
defineSymbol('\\$', '$');
defineSymbol('\\%', '%');
defineSymbol('\\_', '_');

// Note: In TeX, greek symbols are only available in Math mode
defineSymbol('\\alpha', '\u03B1');
defineSymbol('\\beta', '\u03B2');
defineSymbol('\\gamma', '\u03B3');
defineSymbol('\\delta', '\u03B4');
defineSymbol('\\epsilon', '\u03F5');
defineSymbol('\\varepsilon', '\u03B5');
defineSymbol('\\zeta', '\u03B6');
defineSymbol('\\eta', '\u03B7');
defineSymbol('\\theta', '\u03B8');
defineSymbol('\\vartheta', '\u03D1');
defineSymbol('\\iota', '\u03B9');
defineSymbol('\\kappa', '\u03BA');
defineSymbol('\\varkappa', '\u03F0', 'mord', 'ams');
defineSymbol('\\lambda', '\u03BB');
defineSymbol('\\mu', '\u03BC');
defineSymbol('\\nu', '\u03BD');
defineSymbol('\\xi', '\u03BE');
defineSymbol('\\omicron', 'o');
defineSymbol('\\pi', '\u03C0');
defineSymbol('\\varpi', '\u03D6');
defineSymbol('\\rho', '\u03C1');
defineSymbol('\\varrho', '\u03F1');
defineSymbol('\\sigma', '\u03C3');
defineSymbol('\\varsigma', '\u03C2');
defineSymbol('\\tau', '\u03C4');
defineSymbol('\\phi', '\u03D5');
defineSymbol('\\varphi', '\u03C6');
defineSymbol('\\upsilon', '\u03C5');
defineSymbol('\\chi', '\u03C7');
defineSymbol('\\psi', '\u03C8');
defineSymbol('\\omega', '\u03C9');

defineSymbol('\\Gamma', '\u0393');
defineSymbol('\\Delta', '\u0394');
defineSymbol('\\Theta', '\u0398');
defineSymbol('\\Lambda', '\u039B');
defineSymbol('\\Xi', '\u039E');
defineSymbol('\\Pi', '\u03A0');
defineSymbol('\\Sigma', '\u03A3');
defineSymbol('\\Upsilon', '\u03A5');
defineSymbol('\\Phi', '\u03A6');
defineSymbol('\\Psi', '\u03A8');
defineSymbol('\\Omega', '\u03A9');

// 'ams' Greek
defineSymbol('\\digamma', '\u03DD', 'mord', 'ams');

defineSymbol('\\emptyset', '\u2205');
defineSymbol('\\varnothing', '\u2205', 'mord', 'ams');

defineSymbol('\\cap', '\u2229', 'mbin');
defineSymbol('\\cup', '\u222A', 'mbin');
defineSymbol('\\setminus', '\u2216', 'mbin');
defineSymbol('\\smallsetminus', '\u2216', 'mbin', 'ams');
defineSymbol('\\complement', '\u2201', 'mord', 'ams');

defineSymbol('\\in', '\u2208', 'mrel');
defineSymbol('\\notin', '\u2209', 'mrel');
defineSymbol('\\not', '\u0338', 'mrel');
defineSymbol('\\ni', '\u220B', 'mrel');
defineSymbol('\\owns', '\u220B', 'mrel');
defineSymbol('\\subset', '\u2282', 'mrel');
defineSymbol('\\supset', '\u2283', 'mrel');
defineSymbol('\\subseteq', '\u2286', 'mrel');
defineSymbol('\\supseteq', '\u2287', 'mrel');
defineSymbol('\\subsetneq', '\u228A', 'mrel', 'ams');
defineSymbol('\\varsubsetneq', '\uE01A', 'mrel', 'ams');
defineSymbol('\\subsetneqq', '\u2ACB', 'mrel', 'ams');
defineSymbol('\\varsubsetneqq', '\uE017', 'mrel', 'ams');
defineSymbol('\\nsubset', '\u2284', 'mrel', 'ams'); // NOTE: Not TeX?
defineSymbol('\\nsupset', '\u2285', 'mrel', 'ams'); // NOTE: Not TeX?
defineSymbol('\\nsubseteq', '\u2288', 'mrel', 'ams');
defineSymbol('\\nsupseteq', '\u2289', 'mrel', 'ams');

// See http://tex.stackexchange.com/questions/41476/lengths-and-when-to-use-them
defineSymbol('\\ ', '\u00A0', 'space');
defineSymbol('~', '\u00A0', 'space');
defineSymbol('\\space', '\u00A0', 'space');

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
defineSymbol('\\cdotp', '\u22C5', 'mpunct');
defineSymbol('\\cdots', '\u22EF', 'minner');
defineSymbol('\\ddots', '\u22F1', 'minner');
defineSymbol('\\ldots', '\u2026', 'minner');
defineSymbol('\\mathellipsis', '\u2026', 'minner');
defineSymbol('\\vdots', '\u22EE');
defineSymbol('\\ldotp', '\u002E', 'mpunct');
defineSymbol(',', ',', 'mpunct');
defineSymbol(';', ';', 'mpunct');

defineSymbol('\\land', '\u2227', 'mbin');
defineSymbol('\\wedge', '\u2227', 'mbin');
defineSymbol('\\lor', '\u2228', 'mbin');
defineSymbol('\\vee', '\u2228', 'mbin');
defineSymbol('\\lnot', '\u00AC');
defineSymbol('\\neg', '\u00AC');

defineSymbol('\\barwedge', '\u22BC', 'mbin', 'ams');
defineSymbol('\\veebar', '\u22BB', 'mbin', 'ams');
defineSymbol('\\nor', '\u22BB', 'mbin', 'ams'); // NOTE: Not TeX, Mathematica
defineSymbol('\\curlywedge', '\u22CF', 'mbin', 'ams');
defineSymbol('\\curlyvee', '\u22CE', 'mbin', 'ams');

defineSymbol('\\square', '\u25A1', 'mord', 'ams');
defineSymbol('\\Box', '\u25A1', 'mord', 'ams');
defineSymbol('\\blacksquare', '\u25A0', 'mord', 'ams');
defineSymbol('\\boxminus', '\u229F', 'mbin', 'ams');
defineSymbol('\\boxplus', '\u229E', 'mbin', 'ams');
defineSymbol('\\boxtimes', '\u22A0', 'mbin', 'ams');
defineSymbol('\\boxdot', '\u22A1', 'mbin', 'ams');

defineSymbol('\\circ', '\u2218', 'mbin');
defineSymbol('\\bigcirc', '\u25EF', 'mbin');
defineSymbol('\\bullet', '\u2219', 'mbin');
defineSymbol('\\circleddash', '\u229D', 'mbin', 'ams');
defineSymbol('\\circledast', '\u229B', 'mbin', 'ams');
defineSymbol('\\oplus', '\u2295', 'mbin');
defineSymbol('\\ominus', '\u2296', 'mbin');
defineSymbol('\\otimes', '\u2297', 'mbin');
defineSymbol('\\odot', '\u2299', 'mbin');
defineSymbol('\\circledcirc', '\u229A', 'mbin', 'ams');
defineSymbol('\\oslash', '\u2298', 'mbin');
defineSymbol('\\circledS', '\u24C8', 'mord', 'ams');
defineSymbol('\\circledR', '\u00AE', 'mord', 'ams');

defineSymbol('\\triangle', '\u25B3');
defineSymbol('\\bigtriangleup', '\u25B3', 'mbin');
defineSymbol('\\vartriangle', '\u25B3', 'mrel', 'ams');
defineSymbol('\\triangleq', '\u225C', 'mrel', 'ams');

defineSymbol('\\triangledown', '\u25BD', 'mord', 'ams');
defineSymbol('\\bigtriangledown', '\u25BD', 'mbin');

defineSymbol('\\triangleleft', '\u25C3', 'mbin');
defineSymbol('\\vartriangleleft', '\u22B2', 'mrel', 'ams');
defineSymbol('\\trianglelefteq', '\u22B4', 'mrel', 'ams');
defineSymbol('\\ntriangleleft', '\u22EA', 'mrel', 'ams');
defineSymbol('\\ntrianglelefteq', '\u22EC', 'mrel', 'ams');

defineSymbol('\\triangleright', '\u25B9', 'mbin');
defineSymbol('\\vartriangleright', '\u22B3', 'mrel', 'ams');
defineSymbol('\\trianglerighteq', '\u22B5', 'mrel', 'ams');
defineSymbol('\\ntriangleright', '\u22EB', 'mrel', 'ams');
defineSymbol('\\ntrianglerighteq', '\u22ED', 'mrel', 'ams');

defineSymbol('\\blacktriangle', '\u25B2', 'mord', 'ams');
defineSymbol('\\blacktriangledown', '\u25BC', 'mord', 'ams');
defineSymbol('\\blacktriangleleft', '\u25C0', 'mrel', 'ams');
defineSymbol('\\blacktriangleright', '\u25B6', 'mrel', 'ams');

defineSymbol('\\/', '/');
defineSymbol('|', '\u2223', 'mord');

defineSymbol('\\And', '\u0026', 'mbin');
defineSymbol('\\imath', '\u0131');
defineSymbol('\\jmath', '\u0237');

defineSymbol('\\degree', '\u00B0');

defineSymbol("'", '\u2032'); // Prime
defineSymbol('"', '\u201D'); // Double Prime
// defineSymbol( "\'', '\u2033',  'mord',  MAIN);       // Double Prime
