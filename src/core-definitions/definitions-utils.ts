import { supportRegexPropertyEscape } from '../common/capabilities';

import type { Atom, AtomType, BBoxParameter } from '../core/atom-class';
import type { ColumnFormat } from '../core-atoms/array';

import { MathfieldPrivate } from '../editor-mathfield/mathfield-private';
import type {
  ArgumentType,
  Dimension,
  Glue,
  MacroDefinition,
  MacroDictionary,
  MacroPackageDefinition,
  NormalizedMacroDictionary,
  ParseMode,
  Variant,
  MathstyleName,
} from '../public/core-types';
import { unicodeToMathVariant } from './unicode';
import { GlobalContext, BoxType, PrivateStyle } from 'core/types';

export type FunctionArgumentDefinition = {
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

export type ParseResult =
  | Atom
  | PrivateStyle
  | ParseMode
  | MathstyleName
  | {
      error: string;
    };

export type TokenDefinition = FunctionDefinition | SymbolDefinition;

export type FunctionDefinition = {
  definitionType: 'function';
  command?: string;
  params: FunctionArgumentDefinition[];
  /** Infix commands are generally deprecated in LaTeX, but there are
   * a few that we might encounter (e.g. \choose).
   */
  infix: boolean;
  /** If true, the command should be considered a function name, e.g. `\sin` */
  isFunction: boolean;
  /** The mode in which this command can be used */
  ifMode?: ParseMode;
  /**  */
  applyMode?: ParseMode;
  createAtom?: (
    command: string,
    args: (null | Argument)[],
    style: PrivateStyle,
    context: GlobalContext
  ) => Atom;
  applyStyle?: (
    command: string,
    args: (null | Argument)[],
    context: GlobalContext
  ) => PrivateStyle;

  frequency?: number;
  category?: string;
  template?: string;
};

type EnvironmentDefinition = {
  /** If true, the 'content' of the environment is parsed in tabular mode,
   *  i.e. with '&' creating a new column and '\\' creating a new row.
   */
  tabular: boolean;
  params: FunctionArgumentDefinition[];
  createAtom: EnvironmentConstructor;
};

export type SymbolDefinition = {
  definitionType: 'symbol';
  command?: string;
  type: AtomType;
  codepoint: number;
  variant?: Variant;

  isFunction?: boolean;

  frequency?: number;
  category?: string;
  template?: string;
};

export const MATH_SYMBOLS: Record<string, SymbolDefinition> = {};

// Map a character to some corresponding LaTeX.
//
// This is used for some characters such as ² SUPERSCRIPT TWO.
// This is also an opportunity to specify the preferred form when
// a unicode character is encountered that maps to multiple commands,
// for example ≠ could map either to \ne or \neq.
// The table will also be populated by any registered symbol from MATH_SYMBOLS,
//  so an explicit entry is only needed in case of ambiguous mappings.
//
// prettier-ignore
const REVERSE_MATH_SYMBOLS = {
    0x003C: '\\lt',
    0x003E: '\\gt',
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

    0x27F7: '\\biconditional',    // Also \longleftrightarrow
    0x27F8: '\\impliedby', // Also \Longleftarrow
    0x27F9: '\\implies', // Also \Longrightarrow
    0x27fa: '\\iff',

    0x2102: '\\mathbb{C}',    // Also \doubleStruckCapitalC
    0x2115: '\\mathbb{N}',    // Also \doubleStruckCapitalN
    0x2119: '\\mathbb{P}',    // Also \doubleStruckCapitalP
    0x211A: '\\mathbb{Q}',    // Also \doubleStruckCapitalQ
    0x211D: '\\mathbb{R}',    // Also \doubleStruckCapitalR
    0x2124: '\\mathbb{Z}',    // Also \doubleStruckCapitalZ
    0x210d: '\\mathbb{H}',

    0x211c: '\\Re',
    0x2111: '\\Im',
    0x002A: '\\ast',


    0x2b1c: '\\square',
    0x25a1: '\\square',
    0x2210: '\\coprod',
    0x220c: '\\not\\ni',
    0x25c7: '\\diamond',
    0x228e: '\\uplus',
    0x2293: '\\sqcap',
    0x2294: '\\sqcup',
    0x2240: '\\wr',
    0x222e: '\\oint',
    0x2022: '\\textbullet',
    0x2212: '-',

    0x03d2 : '\\Upsilon',
};
export const LATEX_COMMANDS: Record<string, FunctionDefinition> = {};

export const ENVIRONMENTS: Record<string, EnvironmentDefinition> = {};

type EnvironmentConstructor = (
  context: GlobalContext,
  name: string,
  array: Atom[][][],
  rowGaps: Dimension[],
  args: (null | Argument)[]
) => Atom | null;

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
    definitionType: 'symbol',
    type,
    variant,
    codepoint: value,
  };
  if (!REVERSE_MATH_SYMBOLS[value]) REVERSE_MATH_SYMBOLS[value] = symbol;

  // We accept all math symbols in text mode as well
  // which is a bit more permissive than TeX
  if (!TEXT_SYMBOLS[symbol]) TEXT_SYMBOLS[symbol] = value;
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

  for (const [symbol, val, type, variant] of value)
    newSymbol(symbol, val, type ?? inType, variant ?? inVariant);
}

/**
 * Define a set of single-character symbols as a range of Unicode codepoints
 * @param from First Unicode codepoint
 * @param to Last Unicode codepoint
 */
export function newSymbolRange(from: number, to: number): void {
  for (let i = from; i <= to; i++) newSymbol(String.fromCodePoint(i), i);
}

// export function unicodeStringToLatex(
//   parseMode: ArgumentType,
//   s: string
// ): string {
//   let result = '';
//   let needSpace = false;
//   for (const c of s) {
//     if (needSpace) result += parseMode === 'text' ? '{}' : ' ';

//     needSpace = false;
//     const latex = unicodeCharToLatex(parseMode, c);
//     if (latex) {
//       result += latex;
//       needSpace = /\\[a-zA-Z\d]+\*?$/.test(latex);
//     } else result += c;
//   }

//   return result;
// }

export function getEnvironmentDefinition(name: string): EnvironmentDefinition {
  return ENVIRONMENTS[name] ?? null;
}

/**
 * Return an array of suggestion for completing string 's'.
 * For example, for '\si', it could return ['\sin', '\sinh', '\sim', 'simeq', '\sigma']
 * Infix operators are excluded, since they are deprecated commands.
 */
export function suggest(mf: MathfieldPrivate, s: string): string[] {
  if (s === '\\') return [];
  if (!s.startsWith('\\')) return [];

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
export function parseArgAsString(atoms: Atom[]): string {
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
  parameters: string,
  createAtom: EnvironmentConstructor,
  isTabular = false
): void {
  if (typeof names === 'string') names = [names];

  const parsedParameters = parseParameterTemplate(parameters);

  // Set default values of functions
  const data: EnvironmentDefinition = {
    tabular: isTabular,
    // Params: the parameters for this function, an array of
    // {optional, type}
    params: parsedParameters,

    // Handler to create an atom
    createAtom,
  };
  for (const name of names) ENVIRONMENTS[name] = data;
}

/**
 * Like defineEnvironment, but for a tabular environment, i.e.
 * one whose content is in tabular mode, where '&' indicata a new column
 * and '\\' indicate a new row.
 */
export function defineTabularEnvironment(
  names: string | string[],
  parameters: string,
  createAtom: EnvironmentConstructor
): void {
  defineEnvironment(names, parameters, createAtom, true);
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
    createAtom?: (
      name: string,
      args: (null | Argument)[],
      style: PrivateStyle,
      context: GlobalContext
    ) => Atom;
    applyStyle?: (
      name: string,
      args: (null | Argument)[],
      context: GlobalContext
    ) => PrivateStyle;
    command?: string;
  }
): void {
  if (!options) options = {};

  // Set default values of functions
  const data: FunctionDefinition = {
    definitionType: 'function',
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
            expand: macroDef.expand,
            captureSelection: macroDef.captureSelection,
          }
        );
      }
    } else result[macro] = normalizeMacroDefinition(macroDef);
  }
  return result;
}

export function binRelType(atoms: Atom[]): BoxType {
  if (atoms.length === 1) {
    const atom = atoms[0];
    if (atom.type === 'mbin') return 'mbin';
    if (atom.type === 'mrel') return 'mrel';
  }
  return 'mord';
}

export function defaultGetDefinition(
  token: string,
  parseMode: ParseMode = 'math'
): TokenDefinition | null {
  if (!token || token.length === 0) return null;

  let info: TokenDefinition | null = null;

  if (token.startsWith('\\')) {
    // This could be a function or a token
    info = LATEX_COMMANDS[token];
    if (info) return info;

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
        return { ...defaultGetDefinition(command, 'math')!, command };
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

  // Special case `f`, `g` and `h` are recognized as functions.
  if (
    info &&
    info.definitionType === 'symbol' &&
    info.type === 'mord' &&
    (info.codepoint === 0x66 ||
      info.codepoint === 0x67 ||
      info.codepoint === 0x68)
  )
    info.isFunction = true;

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

export function unicodeCharToLatex(
  parseMode: ArgumentType,
  char: string
): string {
  if (parseMode === 'text')
    return charToLatex(parseMode, char.codePointAt(0)) ?? char;

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
  if (v.variant) result = '\\' + v.variant + '{' + result + '}';

  if (v.style === 'bold') result = '\\mathbf{' + result + '}';
  else if (v.style === 'italic') result = '\\mathit{' + result + '}';
  else if (v.style === 'bolditalic') result = '\\mathbfit{' + result + '}';

  return '\\mathord{' + result + '}';
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
  if (parseMode === 'math' && REVERSE_MATH_SYMBOLS[codepoint])
    return REVERSE_MATH_SYMBOLS[codepoint];

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
