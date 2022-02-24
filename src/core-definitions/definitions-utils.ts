import type { ArgumentType, Parser } from '../core/parser';
import type { Atom, AtomType, BBoxParameter } from '../core/atom-class';
import type { ColumnFormat } from '../core-atoms/array';
import type {
  ParseMode,
  Variant,
  VariantStyle,
  MacroDictionary,
  MacroDefinition,
  MacroPackageDefinition,
  Dimension,
  Glue,
} from '../public/core';
import { supportRegexPropertyEscape } from '../common/capabilities';
import { PrivateStyle } from '../core/context';
import { MathstyleName } from '../core/mathstyle';

export type FunctionArgumentDefiniton = {
  isOptional: boolean;
  type: ArgumentType;
};

export type Argument =
  | string
  | number
  | Dimension
  | Glue
  | BBoxParameter
  | ColumnFormat[]
  | Atom[];

export type CreateAtomOptions = {
  colorMap?: (name: string) => string | undefined;
  backgroundColorMap?: (name: string) => string | undefined;
};

export type ApplyStyleDefinitionOptions = {
  colorMap?: (name: string) => string | undefined;
  backgroundColorMap?: (name: string) => string | undefined;
};

export type ParseResult =
  | Atom
  | PrivateStyle
  | ParseMode
  | MathstyleName
  | {
      error: string;
    };

export type CommandDefinition = {
  parse: (parser: Parser) => ParseResult;
};

export type FunctionDefinition = {
  params: FunctionArgumentDefiniton[];
  infix: boolean;
  isFunction: boolean;
  ifMode?: ParseMode;
  applyMode?: ParseMode;
  createAtom?: (
    command: string,
    args: (null | Argument)[],
    style: PrivateStyle,
    options: CreateAtomOptions
  ) => Atom;
  applyStyle?: (
    command: string,
    args: (null | Argument)[],
    options: ApplyStyleDefinitionOptions
  ) => PrivateStyle;

  frequency?: number;
  category?: string;
  template?: string;
};

type EnvironmentDefinition = {
  /** If true, the 'content' of the environment is parsed in tabular mode,
   *  i.e. wiht '&' creating a new column and '\\' creating a new row.
   */
  tabular: boolean;
  params: FunctionArgumentDefiniton[];
  createAtom: EnvironmentConstructor;
};

export type SymbolDefinition = {
  type: AtomType;
  codepoint: number;
  variant?: Variant;
  // VariantStyle: VariantStyle;

  frequency?: number;
  category?: string;
  template?: string;
};

export const MATH_SYMBOLS: Record<string, SymbolDefinition> = {};

// Map a character to some corresponding Latex.
//
// This is used for some characters such as ² SUPERSCRIPT TWO.
// This is also an opportunity to specify the prefered form when
// a unicode character is encountered that maps to multiple commands,
// for example ≠ could map either to \ne or \neq.
// The table will also be populated by any registered symbol from MATH_SYMBOLS,
//  so an explicit entry is only needed in case of ambiguous mappings.
//
// prettier-ignore
const REVERSE_MATH_SYMBOLS = {
    0x003C: '<',   // Also \lt
    0x003E: '>',   // Also \gt
    0x006F: 'o',    // Also \omicron
    0x0026: '\\&',  // Also \And
    0x007B: '\\lbrace',
    0x007D: '\\rbrace',
    0x005B: '\\lbrack',
    0x005D: '\\rbrack',
    0x003A: '\\colon', // Also :
    
    0x00A0: '~', // Also \space
    0x00AC: '\\neg',  // Also \lnot

    0x00B7: '\\cdot',
    0x00BC: '\\frac{1}{4}',
    0x00BD: '\\frac{1}{2}',
    0x00BE: '\\frac{3}{4}',
    0x2070: '^{0}',
    0x2071: '^{i}',
    0x00B9: '^{1}',
    0x00B2: '^{2}',
    0x00B3: '^{3}',

    0x2020: '\\dagger', // Also \dag
    0x2021: '\\ddagger', // Also \ddag
    0x2026: '\\ldots',    // Also \mathellipsis

    0x2074: '^{4}',
    0x2075: '^{5}',
    0x2076: '^{6}',
    0x2077: '^{7}',
    0x2078: '^{8}',
    0x2079: '^{9}',
    0x207A: '^{+}',
    0x207B: '^{-}',
    0x207C: '^{=}',
    0x207F: '^{n}',
    0x2080: '_{0}',
    0x2081: '_{1}',
    0x2082: '_{2}',
    0x2083: '_{3}',
    0x2084: '_{4}',
    0x2085: '_{5}',
    0x2086: '_{6}',
    0x2087: '_{7}',
    0x2088: '_{8}',
    0x2089: '_{9}',
    0x208A: '_{+}',
    0x208B: '_{-}',
    0x208C: '_{=}',
    0x2090: '_{a}',
    0x2091: '_{e}',
    0x2092: '_{o}',
    0x2093: '_{x}',

    0x2032: '\\prime',
    0x0027: '\\prime',

    0x2190: '\\gets', // Also \leftarrow
    0x2192: '\\to',   // Also \rightarrow

    0x25B3: '\\triangle', // Also \bigtriangleup, \vartriangle
    0x25BD: '\\triangledown',

    0x220B: '\\owns', // Also \ni
    0x2217: '\\ast',  // Also *
    0x2223: '\\vert',  // Also |, \mvert, \lvert, \rvert
    0x2225: '\\Vert',  // Also \parallel \shortparallel

    0x2227: '\\land', // Also \wedge
    0x2228: '\\lor', // Also \vee

    0x22C5: '\\cdot', // Also \centerdot, \cdotp
    0x22C8: '\\bowtie', // Also \Joint

    0x2260: '\\ne',   // Also \neq
    0x2264: '\\le',   // Also \leq
    0x2265: '\\ge',   // Also \geq
    0x22A5: '\\bot', // Also \perp

    0x27F7: '\\biconditional',    // Also longleftrightarrow
    0x27F8: '\\impliedby', // Also \Longleftarrow
    0x27F9: '\\implies', // Also \Longrightarrow
    0x27fa: '\\iff',

    0x2102: '\\C',    // Also \doubleStruckCapitalC
    0x2115: '\\N',    // Also \doubleStruckCapitalN
    0x2119: '\\P',    // Also \doubleStruckCapitalP
    0x211A: '\\Q',    // Also \doubleStruckCapitalQ
    0x211D: '\\R',    // Also \doubleStruckCapitalR
    0x2124: '\\Z',    // Also \doubleStruckCapitalZ
};
export const LEGACY_COMMANDS: Record<string, FunctionDefinition> = {};

export const COMMANDS: Record<string, CommandDefinition> = {};

export const ENVIRONMENTS: Record<string, EnvironmentDefinition> = {};

type EnvironmentConstructor = (
  name: string,
  array: Atom[][][],
  rowGaps: Dimension[],
  args: (null | Argument)[]
) => Atom | null;

export type NormalizedMacroDictionary = Record<string, MacroDefinition>;

export const TEXVC_MACROS: MacroDictionary = {
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
    captureSelection: false,
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
  bra: '\\mathinner{\\langle{#1}|}',
  ket: '\\mathinner{|{#1}\\rangle}',
  braket: '\\mathinner{\\langle{#1}\\rangle}',
  set: '\\mathinner{\\lbrace #1 \\rbrace}',
  Bra: '\\left\\langle #1\\right|',
  Ket: '\\left|#1\\right\\rangle',
  Braket: '\\left\\langle{#1}\\right\\rangle',
  Set: '\\left\\lbrace #1 \\right\\rbrace',
};

const DEFAULT_MACROS: MacroDictionary = {
  'iff': '\\;\u27FA\\;', // >2,000 Note: additional spaces around the arrows
  'nicefrac': '^{#1}\\!\\!/\\!_{#2}',

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

  'braket.sty': { package: BRAKET_MACROS } as MacroPackageDefinition,
  'amsmath.sty': {
    package: AMSMATH_MACROS,
    expand: false,
  } as MacroPackageDefinition,
  'texvc.sty': {
    package: TEXVC_MACROS,
    expand: false,
  } as MacroPackageDefinition,
};

// Body-text symbols
// See http://ctan.mirrors.hoobly.com/info/symbols/comprehensive/symbols-a4.pdf, p14

export const TEXT_SYMBOLS: Record<string, number> = {
  ' ': 0x0020,
  '\\#': 0x0023,
  '\\&': 0x0026,
  '\\$': 0x0024,
  '\\%': 0x0025,
  '\\_': 0x005f,
  '\\euro': 0x20ac,
  '\\maltese': 0x2720,
  '\\{': 0x007b,
  '\\}': 0x007d,
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
  '\\textbraceleft': 0x007b,
  '\\textbraceright': 0x007d,
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

export const COMMAND_MODE_CHARACTERS = /[\w!@*()-=+{}[\]\\';:?/.,~<>`|$%#&^" ]/;

export const LETTER = supportRegexPropertyEscape()
  ? /* eslint-disable-next-line prefer-regex-literals */
    new RegExp('\\p{Letter}', 'u')
  : /[a-zA-ZаАбБвВгГдДеЕёЁжЖзЗиИйЙкКлЛмМнНоОпПрРсСтТуУфФхХцЦчЧшШщЩъЪыЫьЬэЭюЮяĄąĆćĘęŁłŃńÓóŚśŹźŻżàâäôéèëêïîçùûüÿæœÀÂÄÔÉÈËÊÏÎŸÇÙÛÜÆŒößÖẞìíòúÌÍÒÚáñÁÑ]/;

export const LETTER_AND_DIGITS = supportRegexPropertyEscape()
  ? /* eslint-disable-next-line prefer-regex-literals */
    new RegExp('[0-9\\p{Letter}]', 'u')
  : /[\da-zA-ZаАбБвВгГдДеЕёЁжЖзЗиИйЙкКлЛмМнНоОпПрРсСтТуУфФхХцЦчЧшШщЩъЪыЫьЬэЭюЮяĄąĆćĘęŁłŃńÓóŚśŹźŻżàâäôéèëêïîçùûüÿæœÀÂÄÔÉÈËÊÏÎŸÇÙÛÜÆŒößÖẞìíòúÌÍÒÚáñÁÑ]/;

/**
 * @param symbol    The LaTeX command for this symbol, for
 * example `\alpha` or `+`
 */
function newSymbol(
  symbol: string,
  value: number | undefined,
  type: AtomType = 'mord',
  variant?: Variant
): void {
  if (value === undefined) return;
  MATH_SYMBOLS[symbol] = {
    type,
    variant,
    codepoint: value,
  };
  if (!REVERSE_MATH_SYMBOLS[value] && !variant) {
    REVERSE_MATH_SYMBOLS[value] = symbol;
  }

  // We accept all math symbols in text mode as well
  // which is a bit more permissive than TeX
  if (!TEXT_SYMBOLS[symbol]) {
    TEXT_SYMBOLS[symbol] = value;
  }
}

/**
 * Define a set of single-character symbols
 */
export function newSymbols(
  value:
    | string
    | [symbol: string, codepoint: number, type?: AtomType, variant?: Variant][],
  inType?: AtomType,
  inVariant?: Variant
): void {
  if (typeof value === 'string') {
    for (let i = 0; i < value.length; i++) {
      const ch = value.charAt(i);
      newSymbol(ch, ch.codePointAt(0));
    }
    return;
  }

  for (const [symbol, val, type, variant] of value) {
    newSymbol(symbol, val, type ?? inType, variant ?? inVariant);
  }
}

/**
 * Define a set of single-character symbols as a range of Unicode codepoints
 * @param from First Unicode codepoint
 * @param to Last Unicode codepoint
 */
export function newSymbolRange(from: number, to: number): void {
  for (let i = from; i <= to; i++) {
    newSymbol(String.fromCodePoint(i), i);
  }
}

/**
 * Given a codepoint, return a matching LaTeX expression.
 * If there is a matching command (e.g. `\alpha`) it is returned.
 */
export function charToLatex(
  parseMode: ArgumentType,
  codepoint: number | undefined
): string {
  if (codepoint === undefined) return '';
  if (parseMode === 'math' && REVERSE_MATH_SYMBOLS[codepoint]) {
    return REVERSE_MATH_SYMBOLS[codepoint];
  }

  if (parseMode === 'text') {
    let textSymbol = Object.keys(TEXT_SYMBOLS).find(
      (x) => TEXT_SYMBOLS[x] === codepoint
    );
    if (!textSymbol) {
      const hex = codepoint.toString(16);
      textSymbol = '^'.repeat(hex.length) + hex;
    }

    return textSymbol;
  }

  return String.fromCodePoint(codepoint);
}

/* Some symbols in the MATHEMATICAL ALPHANUMERICAL SYMBOLS block had
   been previously defined in other blocks. Remap them */
const MATH_LETTER_EXCEPTIONS = {
  0x1d455: 0x0210e,
  0x1d49d: 0x0212c,
  0x1d4a0: 0x02130,
  0x1d4a1: 0x02131,
  0x1d4a3: 0x0210b,
  0x1d4a4: 0x02110,
  0x1d4a7: 0x02112,
  0x1d4a8: 0x02133,
  0x1d4ad: 0x0211b,
  0x1d4ba: 0x0212f,
  0x1d4bc: 0x0210a,
  0x1d4c4: 0x02134,
  0x1d506: 0x0212d,
  0x1d50b: 0x0210c,
  0x1d50c: 0x02111,
  0x1d515: 0x0211c,
  0x1d51d: 0x02128,
  0x1d53a: 0x02102,
  0x1d53f: 0x0210d,
  0x1d545: 0x02115,
  0x1d547: 0x02119,
  0x1d548: 0x0211a,
  0x1d549: 0x0211d,
  0x1d551: 0x02124,
};

const MATH_UNICODE_BLOCKS: {
  start: number;
  len: number;
  offset: number;
  style?: VariantStyle;
  variant?: Variant;
}[] = [
  { start: 0x1d400, len: 26, offset: 65, style: 'bold' },
  { start: 0x1d41a, len: 26, offset: 97, style: 'bold' },
  { start: 0x1d434, len: 26, offset: 65, style: 'italic' },
  { start: 0x1d44e, len: 26, offset: 97, style: 'italic' },
  { start: 0x1d468, len: 26, offset: 65, style: 'bolditalic' },
  { start: 0x1d482, len: 26, offset: 97, style: 'bolditalic' },

  { start: 0x1d49c, len: 26, offset: 65, variant: 'script' },
  { start: 0x1d4b6, len: 26, offset: 97, variant: 'script' },
  { start: 0x1d4d0, len: 26, offset: 65, variant: 'script', style: 'bold' },
  { start: 0x1d4ea, len: 26, offset: 97, variant: 'script', style: 'bold' },

  { start: 0x1d504, len: 26, offset: 65, variant: 'fraktur' },
  { start: 0x1d51e, len: 26, offset: 97, variant: 'fraktur' },
  { start: 0x1d56c, len: 26, offset: 65, variant: 'fraktur', style: 'bold' },
  { start: 0x1d586, len: 26, offset: 97, variant: 'fraktur', style: 'bold' },

  { start: 0x1d538, len: 26, offset: 65, variant: 'double-struck' },
  { start: 0x1d552, len: 26, offset: 97, variant: 'double-struck' },

  { start: 0x1d5a0, len: 26, offset: 65, variant: 'sans-serif' },
  { start: 0x1d5ba, len: 26, offset: 97, variant: 'sans-serif' },
  {
    start: 0x1d5d4,
    len: 26,
    offset: 65,
    variant: 'sans-serif',
    style: 'bold',
  },
  {
    start: 0x1d5ee,
    len: 26,
    offset: 97,
    variant: 'sans-serif',
    style: 'bold',
  },
  {
    start: 0x1d608,
    len: 26,
    offset: 65,
    variant: 'sans-serif',
    style: 'italic',
  },
  {
    start: 0x1d622,
    len: 26,
    offset: 97,
    variant: 'sans-serif',
    style: 'italic',
  },
  {
    start: 0x1d63c,
    len: 26,
    offset: 65,
    variant: 'sans-serif',
    style: 'bolditalic',
  },
  {
    start: 0x1d656,
    len: 26,
    offset: 97,
    variant: 'sans-serif',
    style: 'bolditalic',
  },

  { start: 0x1d670, len: 26, offset: 65, variant: 'monospace' },
  { start: 0x1d68a, len: 26, offset: 97, variant: 'monospace' },

  { start: 0x1d6a8, len: 25, offset: 0x391, style: 'bold' },
  { start: 0x1d6c2, len: 25, offset: 0x3b1, style: 'bold' },
  { start: 0x1d6e2, len: 25, offset: 0x391, style: 'italic' },
  { start: 0x1d6fc, len: 25, offset: 0x3b1, style: 'italic' },
  { start: 0x1d71c, len: 25, offset: 0x391, style: 'bolditalic' },
  { start: 0x1d736, len: 25, offset: 0x3b1, style: 'bolditalic' },
  {
    start: 0x1d756,
    len: 25,
    offset: 0x391,
    variant: 'sans-serif',
    style: 'bold',
  },
  {
    start: 0x1d770,
    len: 25,
    offset: 0x3b1,
    variant: 'sans-serif',
    style: 'bold',
  },
  {
    start: 0x1d790,
    len: 25,
    offset: 0x391,
    variant: 'sans-serif',
    style: 'bolditalic',
  },
  {
    start: 0x1d7aa,
    len: 25,
    offset: 0x3b1,
    variant: 'sans-serif',
    style: 'bolditalic',
  },

  { start: 0x1d7ce, len: 10, offset: 48, variant: 'main', style: 'bold' },
  { start: 0x1d7d8, len: 10, offset: 48, variant: 'double-struck' },
  { start: 0x1d7e3, len: 10, offset: 48, variant: 'sans-serif' },
  {
    start: 0x1d7ec,
    len: 10,
    offset: 48,
    variant: 'sans-serif',
    style: 'bold',
  },
  { start: 0x1d7f6, len: 10, offset: 48, variant: 'monospace' },
];

function unicodeToMathVariant(codepoint: number): {
  char: string;
  variant?: Variant;
  style?: string;
} {
  if (
    (codepoint < 0x1d400 || codepoint > 0x1d7ff) &&
    (codepoint < 0x2100 || codepoint > 0x214f)
  ) {
    return { char: String.fromCodePoint(codepoint) };
  }

  // Handle the 'gap' letters by converting them back into their logical range
  for (const c in MATH_LETTER_EXCEPTIONS) {
    if (MATH_LETTER_EXCEPTIONS[c] === codepoint) {
      codepoint = c.codePointAt(0) ?? 0;
      break;
    }
  }

  for (const MATH_UNICODE_BLOCK of MATH_UNICODE_BLOCKS) {
    if (
      codepoint >= MATH_UNICODE_BLOCK.start &&
      codepoint < MATH_UNICODE_BLOCK.start + MATH_UNICODE_BLOCK.len
    ) {
      return {
        char: String.fromCodePoint(
          codepoint - MATH_UNICODE_BLOCK.start + MATH_UNICODE_BLOCK.offset
        ),
        variant: MATH_UNICODE_BLOCK.variant,
        style: MATH_UNICODE_BLOCK.style,
      };
    }
  }

  return { char: String.fromCodePoint(codepoint) };
}

/**
 * Given a character and variant ('double-struck', 'fraktur', etc...)
 * return the corresponding unicode character (a string)
 */
export function mathVariantToUnicode(
  char: string,
  variant: string,
  style?: string
): string {
  if (!/[A-Za-z\d]/.test(char)) return char;
  if (!variant && !style) return char;

  const codepoint = char.codePointAt(0);
  if (codepoint === undefined) return char;

  for (const MATH_UNICODE_BLOCK of MATH_UNICODE_BLOCKS) {
    if (!variant || MATH_UNICODE_BLOCK.variant === variant) {
      if (!style || MATH_UNICODE_BLOCK.style === style) {
        if (
          codepoint >= MATH_UNICODE_BLOCK.offset &&
          codepoint < MATH_UNICODE_BLOCK.offset + MATH_UNICODE_BLOCK.len
        ) {
          const result =
            MATH_UNICODE_BLOCK.start + codepoint - MATH_UNICODE_BLOCK.offset;
          return String.fromCodePoint(MATH_LETTER_EXCEPTIONS[result] || result);
        }
      }
    }
  }

  return char;
}

export function unicodeCharToLatex(
  parseMode: ArgumentType,
  char: string
): string {
  if (parseMode === 'text') {
    return charToLatex(parseMode, char.codePointAt(0)) ?? char;
  }

  let result: string;
  // Codepoint shortcuts have priority over variants
  // That is, "\N" vs "\mathbb{N}"
  // if (CODEPOINT_SHORTCUTS[cp]) return CODEPOINT_SHORTCUTS[cp];
  result = charToLatex(parseMode, char.codePointAt(0));
  if (result) return result;

  const cp = char.codePointAt(0)!;
  const v = unicodeToMathVariant(cp);
  if (!v.style && !v.variant) return '';

  result = v.char;
  if (v.variant) {
    result = '\\' + v.variant + '{' + result + '}';
  }

  if (v.style === 'bold') {
    result = '\\mathbf{' + result + '}';
  } else if (v.style === 'italic') {
    result = '\\mathit{' + result + '}';
  } else if (v.style === 'bolditalic') {
    result = '\\mathbfit{' + result + '}';
  }

  return '\\mathord{' + result + '}';
}

export function unicodeStringToLatex(
  parseMode: ArgumentType,
  s: string
): string {
  let result = '';
  let needSpace = false;
  for (const c of s) {
    if (needSpace) {
      result += parseMode === 'text' ? '{}' : ' ';
    }

    needSpace = false;
    const latex = unicodeCharToLatex(parseMode, c);
    if (latex) {
      result += latex;
      needSpace = /\\[a-zA-Z\d]+\*?$/.test(latex);
    } else {
      result += c;
    }
  }

  return result;
}

/**
 * Gets the value of a symbol in math mode
 */
// export function getSymbolValue(symbol: string): string {
//     return MATH_SYMBOLS[symbol]?.value ?? symbol;
// }

export function getEnvironmentDefinition(name: string): EnvironmentDefinition {
  return ENVIRONMENTS[name] ?? null;
}

/**
 * @param symbol    A command (e.g. '\alpha') or a character (e.g. 'a')
 * @param parseMode One of 'math' or 'text'
 * @param macros A macros dictionary
 * @return {object} An info structure about the symbol, or null
 */
export function getInfo(
  symbol: string,
  parseMode: ArgumentType,
  macros?: NormalizedMacroDictionary
): (Partial<FunctionDefinition> & Partial<SymbolDefinition>) | null {
  if (!symbol || symbol.length === 0) return null;

  let info: (Partial<FunctionDefinition> & Partial<SymbolDefinition>) | null =
    null;

  if (symbol.startsWith('\\')) {
    // This could be a function or a symbol
    info = LEGACY_COMMANDS[symbol] ?? null;
    if (info) {
      // We've got a match
      return info;
    }

    // It wasn't a function, maybe it's a symbol?
    if (parseMode === 'math') {
      info = MATH_SYMBOLS[symbol];
    } else if (TEXT_SYMBOLS[symbol]) {
      info = { type: 'mord', codepoint: TEXT_SYMBOLS[symbol] };
    }

    if (!info) {
      // Maybe it's a macro
      const command = symbol.slice(1);
      if (macros?.[command]) {
        let argCount = macros[command].args ?? 0;
        info = {
          type: 'group',
          params: [],
          infix: false,
        };
        while (argCount >= 1) {
          info!.params!.push({
            isOptional: false,
            type: 'math',
          });
          argCount -= 1;
        }
      }
    }
  } else if (parseMode === 'math') {
    info = MATH_SYMBOLS[symbol];
  } else if (TEXT_SYMBOLS[symbol]) {
    info = { codepoint: TEXT_SYMBOLS[symbol], type: 'mord' };
  } else if (parseMode === 'text') {
    info = { codepoint: symbol.codePointAt(0)!, type: 'mord' };
  }

  // Special case `f`, `g` and `h` are recognized as functions.
  if (
    info &&
    info.type === 'mord' &&
    (info.codepoint === 0x66 ||
      info.codepoint === 0x67 ||
      info.codepoint === 0x68)
  ) {
    // "f", "g" or "h"
    info.isFunction = true;
  }

  return info;
}

/**
 * Return an array of suggestion for completing string 's'.
 * For example, for 'si', it could return ['sin', 'sinh', 'sim', 'simeq', 'sigma']
 * Infix operators are excluded, since they are deprecated commands.
 */
export function suggest(s: string): { match: string; frequency: number }[] {
  if (s === '\\') return [];

  const result: { match: string; frequency: number }[] = [];

  // Iterate over items in the dictionary
  for (const p in LEGACY_COMMANDS) {
    // Avoid recommended infix commands
    if (p.startsWith(s) && !LEGACY_COMMANDS[p].infix) {
      result.push({ match: p, frequency: LEGACY_COMMANDS[p].frequency ?? 0 });
    }
  }

  for (const p in MATH_SYMBOLS) {
    if (p.startsWith(s)) {
      result.push({ match: p, frequency: MATH_SYMBOLS[p].frequency ?? 0 });
    }
  }

  result.sort((a, b) => {
    if (a.frequency === b.frequency) {
      if (a.match.length === b.match.length) {
        return a.match.localeCompare(b.match);
      }

      return a.match.length - b.match.length;
    }

    return (b.frequency ?? 0) - (a.frequency ?? 0);
  });

  return result;
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
): FunctionArgumentDefiniton[] {
  if (!parameterTemplate) return [];

  let result: FunctionArgumentDefiniton[] = [];
  let parameters = parameterTemplate.split(']');
  if (parameters[0].startsWith('[')) {
    // We found at least one optional parameter.
    result.push({
      isOptional: true,
      type: parseParameterTemplateArgument(parameters[0].slice(1)),
    });
    // Parse the rest
    for (let i = 1; i <= parameters.length; i++) {
      result = result.concat(parseParameterTemplate(parameters[i]));
    }
  } else {
    parameters = parameterTemplate.split('}');
    if (parameters[0].startsWith('{')) {
      // We found a required parameter
      result.push({
        isOptional: false,
        type: parseParameterTemplateArgument(parameters[0].slice(1)),
      });
      // Parse the rest
      for (let i = 1; i <= parameters.length; i++) {
        result = result.concat(parseParameterTemplate(parameters[i]));
      }
    }
  }

  return result;
}

/**
 * If possible, i.e. if they are all simple atoms, return a string made up of
 * their body
 */
export function parseArgAsString(atoms: Atom[]): string {
  if (!atoms) return '';
  let result = '';
  let success = true;
  for (const atom of atoms) {
    if (typeof atom.value === 'string') {
      result += atom.value;
    } else {
      success = false;
    }
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
  parameters: string,
  parser: EnvironmentConstructor,
  isTabular = false
): void {
  if (typeof names === 'string') {
    names = [names];
  }

  const parsedParameters = parseParameterTemplate(parameters);

  // Set default values of functions
  const data: EnvironmentDefinition = {
    tabular: isTabular,
    // Params: the parameters for this function, an array of
    // {optional, type}
    params: parsedParameters,

    // Callback to create an atom
    createAtom: parser,
  };
  for (const name of names) {
    ENVIRONMENTS[name] = data;
  }
}

/**
 * Like defineEnvironment, but for a tabular environment, i.e.
 * one whose content is in tabular mode, where '&' indicata a new column
 * and '\\' indicate a new row.
 */
export function defineTabularEnvironment(
  names: string | string[],
  parameters: string,
  parser: EnvironmentConstructor
): void {
  defineEnvironment(names, parameters, parser, true);
}

/**
 * Define one of more commands.
 *
 * The name of the commands should not include the leading `\`
 */

export function newCommand(
  name: string | string[],
  parse: (parser: Parser) => ParseResult
): void {
  if (typeof name === 'string') {
    COMMANDS[name] = { parse };
    return;
  }
  for (const x of name) COMMANDS[x] = { parse };
}

/**
 * Define one of more functions.
 *
 * @param names
 * @param params The number and type of required and optional parameters.
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
    createAtom?: (
      name: string,
      args: (null | Argument)[],
      style: PrivateStyle,
      options: CreateAtomOptions
    ) => Atom;
    applyStyle?: (
      name: string,
      args: (null | Argument)[],
      options: ApplyStyleDefinitionOptions
    ) => PrivateStyle;
    command?: string;
  }
): void {
  if (!options) options = {};

  // Set default values of functions
  const data: FunctionDefinition = {
    // The parameters for this function, an array of
    // {optional, type}
    params: parseParameterTemplate(parameters),

    ifMode: options.ifMode,
    isFunction: options.isFunction ?? false,
    applyMode: options.applyMode,
    infix: options.infix ?? false,
    createAtom: options.createAtom,
    applyStyle: options.applyStyle,
  };
  if (typeof names === 'string') {
    LEGACY_COMMANDS['\\' + names] = data;
  } else {
    for (const name of names) LEGACY_COMMANDS['\\' + name] = data;
  }
}

let _DEFAULT_MACROS: NormalizedMacroDictionary;

export function getMacros(
  otherMacros?: MacroDictionary | null
): NormalizedMacroDictionary {
  if (!_DEFAULT_MACROS) {
    _DEFAULT_MACROS = normalizeMacroDictionary(DEFAULT_MACROS);
  }
  if (!otherMacros) return _DEFAULT_MACROS;
  return { ..._DEFAULT_MACROS, ...normalizeMacroDictionary(otherMacros) };
}

function normalizeMacroDefinition(
  def: string | MacroDefinition,
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
  macros: MacroDictionary | null
): NormalizedMacroDictionary {
  if (!macros) return {};
  const result: NormalizedMacroDictionary = {};
  for (const macro of Object.keys(macros)) {
    const macroDef = macros[macro];
    if (macroDef === undefined || macroDef === null) {
      delete result[macro];
    } else if (typeof macroDef === 'object' && 'package' in macroDef) {
      for (const packageMacro of Object.keys(macroDef.package)) {
        result[packageMacro] = normalizeMacroDefinition(
          macroDef.package[packageMacro],
          {
            expand: macroDef.expand,
            captureSelection: macroDef.captureSelection,
          }
        );
      }
    } else {
      result[macro] = normalizeMacroDefinition(macroDef);
    }
  }
  return result;
}
