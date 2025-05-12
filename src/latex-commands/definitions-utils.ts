import { supportRegexPropertyEscape } from '../ui/utils/capabilities';

import { Atom } from '../core/atom-class';

import { _Mathfield } from '../editor-mathfield/mathfield-private';
import type {
  ArgumentType,
  MacroDefinition,
  MacroDictionary,
  MacroPackageDefinition,
  NormalizedMacroDictionary,
  ParseMode,
  Variant,
  Environment,
} from '../public/core-types';
import { UNICODE_TO_LATEX } from '../core/unicode';
import type {
  AtomType,
  CreateAtomOptions,
  PrivateStyle,
  ToLatexOptions,
} from '../core/types';
import type { Context } from '../core/context';
import { Box } from '../core/box';
import type {
  Argument,
  EnvironmentConstructor,
  EnvironmentDefinition,
  FunctionArgumentDefinition,
  LatexCommandDefinition,
  LatexSymbolDefinition,
  TokenDefinition,
} from './types';
import type { Parser } from 'core/parser';

export function argAtoms(arg: Argument | null | undefined): Readonly<Atom[]> {
  if (!arg) return [];
  if (Array.isArray(arg)) return arg as Atom[];
  if (typeof arg === 'object' && 'group' in arg) return arg.group;
  return [];
}

export const MATH_SYMBOLS: Record<string, LatexSymbolDefinition> = {};

// Map a character to some corresponding LaTeX.
//
// This is used for some characters such as ² SUPERSCRIPT TWO.
// This is also an opportunity to specify the preferred form when
// a unicode character is encountered that maps to multiple commands,
// for example ≠ could map either to \ne or \neq.
// The table will also be populated by any registered symbol from MATH_SYMBOLS,
//  so an explicit entry is only needed in case of ambiguous mappings.
//
const REVERSE_MATH_SYMBOLS: Record<number, string> = { ...UNICODE_TO_LATEX };

export const LATEX_COMMANDS: Record<string, LatexCommandDefinition> = {};

export const ENVIRONMENTS: Record<string, EnvironmentDefinition> = {};

export const TEXVC_MACROS: MacroDictionary = {
  //////////////////////////////////////////////////////////////////////
  // texvc.sty

  // The texvc package
  // (https://ctan.math.illinois.edu/macros/latex/contrib/texvc/texvc.pdf)
  // contains macros available in mediawiki pages.
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
  C: '\\mathbb{C}',
  H: '\\mathbb{H}',
  N: '\\mathbb{N}',
  Q: '\\mathbb{Q}',
  R: '\\mathbb{R}',
  Z: '\\mathbb{Z}',
  alef: '\\aleph',
  alefsym: '\\aleph',
  Alpha: '\\mathrm{A}',
  // and: '\\land',
  //  ang: '\\angle',   // We use the def from the siunitx package
  Beta: '\\mathrm{B}',
  bull: '\\bullet',
  Chi: '\\mathrm{X}',
  clubs: '\\clubsuit',
  cnums: '\\mathbb{C}',
  Complex: '\\mathbb{C}',
  Dagger: '\\ddagger',
  diamonds: '\\diamondsuit',
  //  Doteq: '\\doteq',   // We map it to U+2251, while \doteq is U+2250
  doublecap: '\\Cap',
  doublecup: '\\Cup',
  empty: '\\emptyset',
  Epsilon: '\\mathrm{E}',
  Eta: '\\mathrm{H}',
  exist: '\\exists',
  //  ge: '\\geq', // We have it as a builtin
  //  gggtr: '\\ggg', // We have it as a builtin
  hAar: '\\Leftrightarrow',
  harr: '\\leftrightarrow',
  Harr: '\\Leftrightarrow',
  hearts: '\\heartsuit',
  image: '\\Im',
  infin: '\\infty',
  Iota: '\\mathrm{I}',
  isin: '\\in',
  Kappa: '\\mathrm{K}',
  larr: '\\leftarrow',
  Larr: '\\Leftarrow',
  lArr: '\\Leftarrow',
  //  le: '\\leq', // We have it as a builtin
  lrarr: '\\leftrightarrow',
  Lrarr: '\\Leftrightarrow',
  lrArr: '\\Leftrightarrow',
  Mu: '\\mathrm{M}',
  natnums: '\\mathbb{N}',
  // ne: '\\neq',   // We have it as a builtin
  Nu: '\\mathrm{N}',
  //  O: '\\emptyset', // Conflicts with \O text command
  //  omicron: '\\mathrm{o}', // We have it as a builtin
  Omicron: '\\mathrm{O}',
  // or: '\\lor',
  part: '\\partial',
  plusmn: '\\pm',
  rarr: '\\rightarrow',
  Rarr: '\\Rightarrow',
  rArr: '\\Rightarrow',
  real: '\\Re',
  reals: '\\mathbb{R}',
  Reals: '\\mathbb{R}',
  restriction: '\\upharpoonright',
  Rho: '\\mathrm{P}',
  sdot: '\\cdot',
  sect: '\\S',
  spades: '\\spadesuit',
  sub: '\\subset',
  sube: '\\subseteq',
  supe: '\\supseteq',
  Tau: '\\mathrm{T}',
  thetasym: '\\vartheta',
  varcoppa: '\\coppa',
  weierp: '\\wp',
  Zeta: '\\mathrm{Z}',
};

export const AMSMATH_MACROS: MacroDictionary = {
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
    captureSelection: false,
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
    expand: false,
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
    expand: false,
  },
};

// From `braket.sty`, Dirac notation
export const BRAKET_MACROS: MacroDictionary = {
  bra: { def: '\\mathinner{\\langle{#1}|}', args: 1, captureSelection: false },
  ket: { def: '\\mathinner{|{#1}\\rangle}', args: 1, captureSelection: false },
  braket: {
    def: '\\mathinner{\\langle{#1}\\rangle}',
    args: 1,
    captureSelection: false,
  },
  set: {
    def: '\\mathinner{\\lbrace #1 \\rbrace}',
    args: 1,
    captureSelection: false,
  },
  Bra: { def: '\\left\\langle #1\\right|', args: 1, captureSelection: false },
  Ket: { def: '\\left|#1\\right\\rangle', args: 1, captureSelection: false },
  Braket: {
    def: '\\left\\langle{#1}\\right\\rangle',
    args: 1,
    captureSelection: false,
  },
  Set: {
    def: '\\left\\lbrace #1 \\right\\rbrace',
    args: 1,
    captureSelection: false,
  },
};

const DEFAULT_MACROS: MacroDictionary = {
  'strut': {
    primitive: true,
    def: '\\phantom{\\rule[0.3\\baselineskip]{0}{0.7\\baselineskip}}',
    args: 0,
    captureSelection: true,
  },

  'iff': {
    primitive: true,
    captureSelection: true,
    def: '\\;\\Longleftrightarrow\\;}', // >2,000 Note: additional spaces around the arrows, as per AMSMATH package definition
  },

  'nicefrac': '^{#1}\\!\\!/\\!_{#2}',

  'phase': {
    def: '\\enclose{phasorangle}{#1}',
    args: 1,
    captureSelection: false,
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

  'imaginaryI': '\\mathrm{i}', // NOTE: set in main (upright) as per ISO 80000-2:2009.
  'imaginaryJ': '\\mathrm{j}', // NOTE: set in main (upright) as per ISO 80000-2:2009.

  'exponentialE': '\\mathrm{e}', // NOTE: set in main (upright) as per ISO 80000-2:2009.
  'differentialD': '\\mathrm{d}', // NOTE: set in main (upright) as per ISO 80000-2:2009.
  'capitalDifferentialD': '\\mathrm{D}', // NOTE: set in main (upright) as per ISO 80000-2:2009.

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
  // See https://mirrors.ircam.fr/pub/CTAN/macros/latex/contrib/mathtools/mathtools.pdf

  'mathtools': {
    primitive: true,
    package: {
      //\providecommand\ordinarycolon{:}
      ordinarycolon: ':',
      //\def\vcentcolon{\mathrel{\mathop\ordinarycolon}}
      //TODO(edemaine): Not yet centered. Fix via \raisebox or #726
      vcentcolon: '\\mathrel{\\mathop\\ordinarycolon}',
      // \providecommand*\dblcolon{\vcentcolon\mathrel{\mkern-.9mu}\vcentcolon}
      dblcolon: '{\\mathop{\\char"2237}}', // ∷
      // \providecommand*\coloneqq{\vcentcolon\mathrel{\mkern-1.2mu}=}
      coloneqq: '{\\mathop{\\char"2254}}', // ≔
      // \providecommand*\Coloneqq{\dblcolon\mathrel{\mkern-1.2mu}=}
      Coloneqq: '{\\mathop{\\char"2a74}}', // ⩴
      // \providecommand*\coloneq{\vcentcolon\mathrel{\mkern-1.2mu}\mathrel{-}}
      coloneq: '{\\mathop{\\char"2254}}', // ≔
      // \providecommand*\Coloneq{\dblcolon\mathrel{\mkern-1.2mu}\mathrel{=}}
      Coloneq: '{\\mathop{\\char"2A74}}', // ⩴
      // \providecommand*\eqqcolon{=\mathrel{\mkern-1.2mu}\vcentcolon}
      eqqcolon: '{\\mathop{\\char"2255}}', // ≕
      // \providecommand*\Eqqcolon{=\mathrel{\mkern-1.2mu}\dblcolon}
      Eqqcolon: '{\\mathop{\\char"3D\\char"2237}}', // =∷
      // \providecommand*\eqcolon{\mathrel{-}\mathrel{\mkern-1.2mu}\vcentcolon}
      eqcolon: '{\\mathop{\\char"2255}}', // ≕
      // \providecommand*\Eqcolon{\mathrel{-}\mathrel{\mkern-1.2mu}\dblcolon}
      Eqcolon: '{\\mathop{\\char"3D\\char"2237}}', // =∷
      // \providecommand*\colonapprox{\vcentcolon\mathrel{\mkern-1.2mu}\approx}
      colonapprox: '{\\mathop{\\char"003A\\char"2248}}', // :≈
      // \providecommand*\Colonapprox{\dblcolon\mathrel{\mkern-1.2mu}\approx}
      Colonapprox: '{\\mathop{\\char"2237\\char"2248}}', // ∷≈
      // \providecommand*\colonsim{\vcentcolon\mathrel{\mkern-1.2mu}\sim}
      colonsim: '{\\mathop{\\char"3A\\char"223C}}', // :∼
      // \providecommand*\Colonsim{\dblcolon\mathrel{\mkern-1.2mu}\sim}
      Colonsim: '{\\mathop{\\char"2237\\char"223C}}', // ∷∼

      colondash: '\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}', // :-
      Colondash: '\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}',

      dashcolon: '\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\vcentcolon}',
      Dashcolon: '\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\dblcolon}',
    },
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
    expand: true,
  },
  'braket.sty': { package: BRAKET_MACROS } as MacroPackageDefinition,
  'amsmath.sty': {
    package: AMSMATH_MACROS,
    primitive: true,
  } as MacroPackageDefinition,
  'texvc.sty': {
    package: TEXVC_MACROS,
    primitive: false,
  } as MacroPackageDefinition,
};

// Body-text symbols
// See http://ctan.mirrors.hoobly.com/info/symbols/comprehensive/symbols-a4.pdf, p14

const TEXT_SYMBOLS: Record<string, number> = {
  ' ': 0x0020,
  // want that in Text mode.
  '\\!': 0x0021,
  '\\#': 0x0023,
  '\\$': 0x0024,
  '\\%': 0x0025,
  '\\&': 0x0026,
  '\\_': 0x005f,
  '-': 0x002d, // In Math mode, '-' is substituted to U+2212, but we don't
  '\\textunderscore': 0x005f, // '_'
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
  '\\textbackslash': 0x005c, // '\'
  '\\textbullet': 0x2022,
  '\\textdollar': 0x0024,
  '\\textsterling': 0x00a3,
  '\\textdagger': 0x2020,
  '\\textdaggerdbl': 0x2021,

  '–': 0x2013, // EN DASH
  '—': 0x2014, // EM DASH
  '‘': 0x2018, // LEFT SINGLE QUOTATION MARK
  '’': 0x2019, // RIGHT SINGLE QUOTATION MARK
  '“': 0x201c, // LEFT DOUBLE QUOTATION MARK
  '”': 0x201d, // RIGHT DOUBLE QUOTATION MARK
  '"': 0x201d, // DOUBLE PRIME
  '\\ss': 0x00df, // LATIN SMALL LETTER SHARP S
  '\\ae': 0x00e6, // LATIN SMALL LETTER AE
  '\\oe': 0x0153, // LATIN SMALL LIGATURE OE
  '\\AE': 0x00c6, // LATIN CAPITAL LETTER AE
  '\\OE': 0x0152, // LATIN CAPITAL LIGATURE OE
  '\\O': 0x00d8, // LATIN CAPITAL LETTER O WITH STROKE
  '\\i': 0x0131, // LATIN SMALL LETTER DOTLESS I
  '\\j': 0x0237, // LATIN SMALL LETTER DOTLESS J
  '\\aa': 0x00e5, // LATIN SMALL LETTER A WITH RING ABOVE
  '\\AA': 0x00c5, // LATIN CAPITAL LETTER A WITH RING ABOVE
};

export const COMMAND_MODE_CHARACTERS =
  /[\w!@*()-=+{}\[\]\\';:?/.,~<>`|$%#&^" ]/;

export let LETTER: RegExp;
export let LETTER_AND_DIGITS: RegExp;

if (supportRegexPropertyEscape()) {
  LETTER = new RegExp('\\p{Letter}', 'u');
  LETTER_AND_DIGITS = new RegExp('[0-9\\p{Letter}]', 'u');
} else {
  LETTER =
    /[a-zA-ZаАбБвВгГдДеЕёЁжЖзЗиИйЙкКлЛмМнНоОпПрРсСтТуУфФхХцЦчЧшШщЩъЪыЫьЬэЭюЮяĄąĆćĘęŁłŃńÓóŚśŹźŻżàâäôéèëêïîçùûüÿæœÀÂÄÔÉÈËÊÏÎŸÇÙÛÜÆŒößÖẞìíòúÌÍÒÚáñÁÑ]/;

  LETTER_AND_DIGITS =
    /[\da-zA-ZаАбБвВгГдДеЕёЁжЖзЗиИйЙкКлЛмМнНоОпПрРсСтТуУфФхХцЦчЧшШщЩъЪыЫьЬэЭюЮяĄąĆćĘęŁłŃńÓóŚśŹźŻżàâäôéèëêïîçùûüÿæœÀÂÄÔÉÈËÊÏÎŸÇÙÛÜÆŒößÖẞìíòúÌÍÒÚáñÁÑ]/;
}

/**
 * @param symbol    The LaTeX command for this symbol, for
 * example `\alpha` or `+`
 */
function defineSymbol(
  symbol: string,
  codepoint: number | undefined,
  type: AtomType = 'mord',
  variant?: Variant
): void {
  if (codepoint === undefined) return;
  MATH_SYMBOLS[symbol] = {
    definitionType: 'symbol',
    type,
    variant,
    codepoint,
  };
  if (!REVERSE_MATH_SYMBOLS[codepoint])
    REVERSE_MATH_SYMBOLS[codepoint] = symbol;
}

/**
 * Define a set of single-codepoint symbols
 */
export function defineSymbols(
  value:
    | string
    | [symbol: string, codepoint: number, type?: AtomType, variant?: Variant][],
  inType?: AtomType,
  inVariant?: Variant
): void {
  if (typeof value === 'string') {
    for (let i = 0; i < value.length; i++) {
      const ch = value.charAt(i);
      defineSymbol(ch, ch.codePointAt(0));
    }
    return;
  }

  for (const [symbol, val, type, variant] of value)
    defineSymbol(symbol, val, type ?? inType, variant ?? inVariant);
}

/**
 * Define a set of single-character symbols as a range of Unicode codepoints
 * @param from First Unicode codepoint
 * @param to Last Unicode codepoint
 */
export function defineSymbolRange(from: number, to: number): void {
  for (let i = from; i <= to; i++) defineSymbol(String.fromCodePoint(i), i);
}

export function getEnvironmentDefinition(name: string): EnvironmentDefinition {
  return ENVIRONMENTS[name] ?? null;
}

/**
 * Return an array of suggestion for completing string 's'.
 * For example, for '\si', it could return ['\sin', '\sinh', '\sim', 'simeq', '\sigma']
 * Infix operators are excluded, since they are deprecated commands.
 */
export function suggest(mf: _Mathfield, s: string): string[] {
  if (s.length === 0 || s === '\\' || !s.startsWith('\\')) return [];

  const result: { match: string; frequency: number }[] = [];

  // Iterate over items in the dictionary
  for (const p in LATEX_COMMANDS) {
    // Don't recommend infix commands
    if (p.startsWith(s) && !LATEX_COMMANDS[p].infix)
      result.push({ match: p, frequency: LATEX_COMMANDS[p].frequency ?? 0 });
  }

  for (const p in MATH_SYMBOLS) {
    if (p.startsWith(s))
      result.push({ match: p, frequency: MATH_SYMBOLS[p].frequency ?? 0 });
  }

  // Consider macros
  const command = s.substring(1);
  for (const p of Object.keys(mf.options.macros))
    if (p.startsWith(command)) result.push({ match: '\\' + p, frequency: 0 });

  result.sort((a, b) => {
    if (a.frequency === b.frequency) {
      if (a.match.length === b.match.length) return a.match < b.match ? -1 : +1;

      return a.match.length - b.match.length;
    }

    return (b.frequency ?? 0) - (a.frequency ?? 0);
  });

  return result.map((x) => x.match);
}

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
function parseParameterTemplateArgument(argTemplate: string): ArgumentType {
  let type: ArgumentType = 'auto';

  // Parse the type (:type)
  const r = argTemplate.match(/:([^=]+)/);
  if (r) type = r[1].trim() as ArgumentType;

  return type;
}

function parseParameterTemplate(
  parameterTemplate: string
): FunctionArgumentDefinition[] {
  if (!parameterTemplate) return [];

  const result: FunctionArgumentDefinition[] = [];
  let parameters = parameterTemplate.split(']');
  if (parameters[0].startsWith('[')) {
    // We found at least one optional parameter.
    result.push({
      isOptional: true,
      type: parseParameterTemplateArgument(parameters[0].slice(1)),
    });
    // Parse the rest
    for (let i = 1; i <= parameters.length; i++)
      result.push(...parseParameterTemplate(parameters[i]));
  } else {
    parameters = parameterTemplate.split('}');
    if (parameters[0].startsWith('{')) {
      // We found a required parameter
      result.push({
        isOptional: false,
        type: parseParameterTemplateArgument(parameters[0].slice(1)),
      });
      // Parse the rest
      for (let i = 1; i <= parameters.length; i++)
        result.push(...parseParameterTemplate(parameters[i]));
    }
  }

  return result;
}

/**
 * If possible, i.e. if they are all simple atoms, return a string made up of
 * their body
 */
export function parseArgAsString(atoms: Readonly<Atom[]>): string {
  if (!atoms) return '';
  let result = '';
  let success = true;
  for (const atom of atoms) {
    if (typeof atom.value === 'string') result += atom.value;
    else success = false;
  }
  return success ? result : '';
}

/**
 * Define one or more environments to be used with
 *         \begin{<env-name>}...\end{<env-name>}.
 *
 * @param params The number and type of required and optional parameters.
 */
export function defineEnvironment(
  names: string | string[],
  createAtom: EnvironmentConstructor
): void {
  if (typeof names === 'string') names = [names];

  const def: EnvironmentDefinition = {
    tabular: false,
    rootOnly: false,
    params: [],
    createAtom,
  };
  for (const name of names) ENVIRONMENTS[name] = def;
}

/**
 * Like defineEnvironment, but for a tabular environment, i.e.
 * one whose content is in tabular mode, where '&' indicata a new column
 * and '\\' indicate a new row.
 */
export function defineTabularEnvironment(
  names: Environment | Environment[],
  parameters: string,
  createAtom: EnvironmentConstructor
): void {
  if (typeof names === 'string') names = [names];

  // The parameters for this function, an array of
  // {optional, type}
  const parsedParameters = parseParameterTemplate(parameters);

  const data: EnvironmentDefinition = {
    tabular: true,
    rootOnly: false,
    params: parsedParameters,
    createAtom,
  };
  for (const name of names) ENVIRONMENTS[name] = data;
}

export function defineRootEnvironment(
  names: string | string[],
  createAtom: EnvironmentConstructor,
  options?: { tabular?: boolean; params?: string }
): void {
  if (typeof names === 'string') names = [names];

  const def: EnvironmentDefinition = {
    tabular: options?.tabular ?? false,
    rootOnly: true,
    params: [],
    createAtom,
  };
  for (const name of names) ENVIRONMENTS[name] = def;
}

/**
 * Define one of more functions.
 *
 * @param names
 * @param parameters The number and type of required and optional parameters.
 * For example: '{}' defines a single mandatory parameter
 * '[string]{auto}' defines two params, one optional, one required
 */
export function defineFunction(
  names: string | string[],
  parameters: string,
  options: {
    ifMode?: ParseMode;
    applyMode?: ParseMode;
    infix?: boolean;
    isFunction?: boolean;
    parse?: (parser: Parser) => Argument[];
    createAtom?: (options: CreateAtomOptions) => Atom;
    applyStyle?: (
      style: PrivateStyle,
      name: string,
      args: (null | Argument)[],
      context: Context
    ) => PrivateStyle;
    command?: string;
    serialize?: (atom: Atom, options: ToLatexOptions) => string;
    render?: (atom: Atom, context: Context) => Box | null;
  }
): void {
  if (!options) options = {};

  // Set default values of functions
  const data: LatexCommandDefinition = {
    definitionType: 'function',
    // The parameters for this function, an array of
    // {optional, type}
    params: parseParameterTemplate(parameters),

    ifMode: options.ifMode,
    isFunction: options.isFunction ?? false,
    applyMode: options.applyMode,
    infix: options.infix ?? false,
    parse: options.parse,
    createAtom: options.createAtom,
    applyStyle: options.applyStyle,
    serialize: options.serialize,
    render: options.render,
  };
  if (typeof names === 'string') LATEX_COMMANDS['\\' + names] = data;
  else for (const name of names) LATEX_COMMANDS['\\' + name] = data;
}

let _DEFAULT_MACROS: NormalizedMacroDictionary;

export function getMacros(
  otherMacros?: MacroDictionary | null
): NormalizedMacroDictionary {
  if (!_DEFAULT_MACROS)
    _DEFAULT_MACROS = normalizeMacroDictionary(DEFAULT_MACROS);

  if (!otherMacros) return _DEFAULT_MACROS;
  return normalizeMacroDictionary({ ..._DEFAULT_MACROS, ...otherMacros });
}

function normalizeMacroDefinition(
  def: string | Partial<MacroDefinition>,
  options?: { expand?: boolean; captureSelection?: boolean }
): MacroDefinition {
  if (typeof def === 'string') {
    // It's a shorthand definition, let's expand it
    let argCount = 0;
    const defString: string = def as string;
    // Let's see if there are arguments in the definition.
    if (/(^|[^\\])#1/.test(defString)) argCount = 1;
    if (/(^|[^\\])#2/.test(defString)) argCount = 2;
    if (/(^|[^\\])#3/.test(defString)) argCount = 3;
    if (/(^|[^\\])#4/.test(defString)) argCount = 4;
    if (/(^|[^\\])#5/.test(defString)) argCount = 5;
    if (/(^|[^\\])#6/.test(defString)) argCount = 6;
    if (/(^|[^\\])#7/.test(defString)) argCount = 7;
    if (/(^|[^\\])#8/.test(defString)) argCount = 8;
    if (/(^|[^\\])#9/.test(defString)) argCount = 9;
    return {
      expand: options?.expand ?? true,
      captureSelection: options?.captureSelection ?? true,
      args: argCount,
      def: defString,
    };
  }
  return {
    expand: options?.expand ?? true,
    captureSelection: options?.captureSelection ?? true,
    args: 0,
    ...(def as MacroDefinition),
  };
}

export function normalizeMacroDictionary(
  macros: MacroDictionary
): NormalizedMacroDictionary {
  if (!macros) return {};
  const result: NormalizedMacroDictionary = {};
  for (const macro of Object.keys(macros)) {
    const macroDef = macros[macro];
    if (macroDef === undefined || macroDef === null) delete result[macro];
    else if (typeof macroDef === 'object' && 'package' in macroDef) {
      for (const packageMacro of Object.keys(macroDef.package)) {
        result[packageMacro] = normalizeMacroDefinition(
          macroDef.package[packageMacro],
          {
            expand: !macroDef.primitive,
            captureSelection: macroDef.captureSelection,
          }
        );
      }
    } else result[macro] = normalizeMacroDefinition(macroDef);
  }
  return result;
}

export function getDefinition(
  token: string,
  parseMode: ParseMode = 'math'
): TokenDefinition | null {
  if (!token || token.length === 0) return null;

  let info: TokenDefinition | null = null;

  if (token.startsWith('\\')) {
    // This could be a function or a token
    info = LATEX_COMMANDS[token];
    if (info) {
      if (!info.ifMode || info.ifMode === parseMode) return info;
      return null;
    }

    // It wasn't a function, maybe it's a token?
    if (parseMode === 'math') info = MATH_SYMBOLS[token];
    else if (TEXT_SYMBOLS[token]) {
      info = {
        definitionType: 'symbol',
        type: 'mord',
        codepoint: TEXT_SYMBOLS[token],
      };
    }
  } else if (parseMode === 'math') {
    info = MATH_SYMBOLS[token];
    if (!info && token.length === 1) {
      //Check if this is a Unicode character that has a definition
      const command = charToLatex('math', token.codePointAt(0));
      if (command.startsWith('\\'))
        return { ...getDefinition(command, 'math')!, command };
      return null;
    }
  } else if (TEXT_SYMBOLS[token]) {
    info = {
      definitionType: 'symbol',
      type: 'mord',
      codepoint: TEXT_SYMBOLS[token],
    };
  } else if (parseMode === 'text') {
    info = {
      definitionType: 'symbol',
      type: 'mord',
      codepoint: token.codePointAt(0)!,
    };
  }

  return info ?? null;
}

export function getMacroDefinition(
  token: string,
  macros: NormalizedMacroDictionary
): MacroDefinition | null {
  if (!token.startsWith('\\')) return null;
  const command = token.slice(1);
  return macros[command];
}

/**
 * Given a codepoint, return a matching LaTeX expression.
 * If there is a matching command (e.g. `\alpha`) it is returned.
 */
export function charToLatex(
  parseMode: ParseMode,
  codepoint: number | undefined
): string {
  if (codepoint === undefined) return '';
  if (parseMode === 'math' && REVERSE_MATH_SYMBOLS[codepoint])
    return REVERSE_MATH_SYMBOLS[codepoint];

  if (parseMode === 'text') {
    const textSymbol = Object.keys(TEXT_SYMBOLS).find(
      (x) => TEXT_SYMBOLS[x] === codepoint
    );
    if (textSymbol) return textSymbol;
    return String.fromCodePoint(codepoint);
  }

  // const hex = codepoint.toString(16).toLowerCase();
  // return '^'.repeat(hex.length) + hex;
  return String.fromCodePoint(codepoint);
}
