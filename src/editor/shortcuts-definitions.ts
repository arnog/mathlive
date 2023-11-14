import type { InlineShortcutDefinitions } from '../public/options';

/**
 * These shortcut strings are replaced with the corresponding LaTeX expression
 * without requiring an escape sequence or command.
 */
export const INLINE_SHORTCUTS: InlineShortcutDefinitions = {
  '&': '\\&',
  '%': '\\%',
  '$': '\\$',

  // Primes
  "''": '^{\\doubleprime}',
  "'''": '^{\\prime\\prime\\prime}',
  "''''": '^{\\prime\\prime\\prime\\prime}',

  // Greek letters
  'alpha': '\\alpha',
  'delta': '\\delta',
  'Delta': '\\Delta',
  'pi': '\\pi',
  'Pi': '\\Pi',
  'theta': '\\theta',
  'Theta': '\\Theta',

  // Letter-like
  'ii': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\imaginaryI',
  },
  'jj': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\imaginaryJ',
  },
  'ee': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\exponentialE',
  },

  'nabla': '\\nabla',
  'grad': '\\nabla',
  'del': '\\partial',
  'deg': { after: 'digit+space', value: '\\degree' },

  'infty': '\\infty',

  '\u221E': '\\infty', // @TODO: doesn't work
  // '&infin;': '\\infty',
  // '&#8734;': '\\infty',
  'oo': {
    after:
      'nothing+digit+frac+surd+binop+relop+punct+array+openfence+closefence+space',
    value: '\\infty',
  },

  // Big operators
  '∑': '\\sum',
  'sum': '\\sum_{#?}^{#?}',
  'int': '\\int_{#?}^{#?}',
  'prod': '\\prod_{#?}^{#?}',
  'sqrt': '\\sqrt{#?}',
  // '∫':                    '\\int',             // There's a alt-B command for this
  '∆': '\\differentialD', // @TODO: is \\diffD most common?
  '∂': '\\differentialD',

  // Functions
  'arcsin': '\\arcsin',
  'arccos': '\\arccos',
  'arctan': '\\arctan',
  'arcsec': '\\arcsec',
  'arccsc': '\\arccsc',

  'arsinh': '\\arsinh',
  'arcosh': '\\arcosh',
  'artanh': '\\artanh',
  'arcsech': '\\arcsech',
  'arccsch': '\\arccsch',
  'arg': '\\arg',
  'ch': '\\ch',
  'cosec': '\\cosec',
  'cosh': '\\cosh',
  'cot': '\\cot',
  'cotg': '\\cotg',
  'coth': '\\coth',
  'csc': '\\csc',
  'ctg': '\\ctg',
  'cth': '\\cth',
  'sec': '\\sec',
  'sinh': '\\sinh',
  'sh': '\\sh',
  'tanh': '\\tanh',
  'tg': '\\tg',
  'th': '\\th',

  'sin': '\\sin',
  'cos': '\\cos',
  'tan': '\\tan',

  'lg': '\\lg',
  'lb': '\\lb',
  'log': '\\log',
  'ln': '\\ln',
  'exp': '\\exp',
  'lim': '\\lim_{#?}',

  // Differentials
  // According to ISO31/XI (ISO 80000-2), differentials should be upright
  'dx': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\differentialD x',
  },
  'dy': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\differentialD y',
  },
  'dt': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\differentialD t',
  },

  // Logic
  'AA': '\\forall',
  'EE': '\\exists',
  '!EE': '\\nexists',
  '&&': '\\land',
  // The shortcut for the greek letter "xi" is interfering with "x in"
  'xin': {
    after: 'nothing+text+relop+punct+openfence+space',
    value: 'x \\in',
  },
  // The shortcut for `\int` is interfering with `\sin x`
  'sint': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\sin t',
  },
  'in': {
    after: 'nothing+letter+closefence',
    value: '\\in',
  },
  '!in': '\\notin',

  // Sets
  'NN': '\\mathbb{N}', // Natural numbers
  'ZZ': '\\Z', // Integers
  'QQ': '\\Q', // Rational numbers
  'RR': '\\R', // Real numbers
  'CC': '\\C', // Complex numbers

  // Operators
  'xx': '\\times',
  '+-': '\\pm',

  // Relational operators
  '≠': '\\ne',
  '!=': '\\ne',
  '\u2265': '\\ge',
  '>=': '\\ge',
  '\u2264': '\\le',
  '<=': '\\le',
  '<<': '\\ll',
  '>>': '\\gg',
  '~~': '\\approx',

  // More operators
  '≈': '\\approx',
  '?=': '\\questeq',
  '÷': '\\div',
  '¬': '\\neg',
  ':=': '\\coloneq',
  '::': '\\Colon',

  // Fences
  '(:': '\\langle',
  ':)': '\\rangle',

  // More Greek letters
  'beta': '\\beta',
  'chi': '\\chi',
  'epsilon': '\\epsilon',
  'varepsilon': '\\varepsilon',
  'eta': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\eta',
  },
  'gamma': '\\gamma',
  'Gamma': '\\Gamma',
  'iota': '\\iota',
  'kappa': '\\kappa',
  'lambda': '\\lambda',
  'Lambda': '\\Lambda',
  'mu': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\mu',
  },
  'nu': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\nu',
  },
  'µ': '\\mu', // @TODO: or micro?
  'phi': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\phi',
  },
  'Phi': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\Phi',
  },
  'varphi': '\\varphi',
  'psi': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\psi',
  },
  'Psi': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\Psi',
  },
  'rho': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\rho',
  },
  'sigma': '\\sigma',
  'Sigma': '\\Sigma',
  'tau': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\tau',
  },
  'vartheta': '\\vartheta',
  'upsilon': '\\upsilon',
  'xi': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space',
    value: '\\xi',
  },
  'Xi': {
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\Xi',
  },
  'zeta': '\\zeta',
  'omega': '\\omega',
  'Omega': '\\Omega',
  'Ω': '\\omega', // @TODO: or ohm?

  // More Logic
  'forall': '\\forall',
  'exists': '\\exists',
  '!exists': '\\nexists',
  ':.': '\\therefore',
  // MORE FUNCTIONS
  // 'arg': '\\arg',
  'liminf': '\\liminf_{#?}',
  'limsup': '\\limsup_{#?}',
  'argmin': '\\operatorname*{arg~min}_{#?}',
  'argmax': '\\operatorname*{arg~max}_{#?}',
  'det': '\\det',
  'mod': '\\mod',
  'max': '\\max',
  'min': '\\min',

  'erf': '\\operatorname{erf}',
  'erfc': '\\operatorname{erfc}',
  'bessel': '\\operatorname{bessel}',
  'mean': '\\operatorname{mean}',
  'median': '\\operatorname{median}',

  'fft': '\\operatorname{fft}',

  'lcm': '\\operatorname{lcm}',

  'gcd': '\\operatorname{gcd}',

  'randomReal': '\\operatorname{randomReal}',
  'randomInteger': '\\operatorname{randomInteger}',
  'Re': '\\operatorname{Re}',

  'Im': '\\operatorname{Im}',

  // UNITS
  'mm': {
    after: 'nothing+digit+operator',
    value: '\\operatorname{mm}', // Millimeter
  },
  'cm': {
    after: 'nothing+digit+operator',
    value: '\\operatorname{cm}', // Centimeter
  },
  'km': {
    after: 'nothing+digit+operator',
    value: '\\operatorname{km}', // Kilometer
  },
  'kg': {
    after: 'nothing+digit+operator',
    value: '\\operatorname{kg}', // Kilogram
  },

  // '||':                   '\\lor',
  '...': '\\ldots', // In general, use \ldots
  '+...': '+\\cdots', // ... but use \cdots after + ...
  '-...': '-\\cdots', // ... - and ...
  '->...': '\\to\\cdots', // ->
  '-->...': '\\longrightarrow\\cdots',

  '->': '\\to',
  '|->': '\\mapsto',
  '-->': '\\longrightarrow',
  //    '<-':                   '\\leftarrow',
  '<--': '\\longleftarrow',
  '=>': '\\Rightarrow',
  '==>': '\\Longrightarrow',
  // '<=': '\\Leftarrow',     // CONFLICTS WITH LESS THAN OR EQUAL
  '<=>': '\\Leftrightarrow',
  '<->': '\\leftrightarrow',

  '(.)': '\\odot',
  '(+)': '\\oplus',
  '(/)': '\\oslash',
  '(*)': '\\otimes',
  '(-)': '\\ominus',
  // '(-)':                  '\\circleddash',

  '||': '\\Vert',
  '{': '\\{',
  '}': '\\}',

  '*': '\\cdot',

  //
  // ASCIIIMath
  //
  // Binary operation symbols
  //
  '**': '\\star',
  '***': '\\ast',
  '//': '\\slash',
  '\\\\': '\\backslash',
  'setminus': '\\backslash',
  '|><': '\\ltimes',
  '><|': '\\rtimes',
  '|><|': '\\bowtie',
  '-:': '\\div',
  'divide': '\\div',
  '@': '\\circ',
  // 'o+': '\\oplus',
  // 'ox': '\\otimes',
  // 'o.': '\\odot',
  '^^': '\\wedge',
  '^^^': '\\bigwedge',
  'vv': '\\vee',
  'vvv': '\\bigvee',
  'nn': '\\cap',
  'nnn': '\\bigcap',
  'uu': '\\cup',
  'uuu': '\\bigcup',

  // Binary relation symbols
  '-=': '\\equiv',
  '~=': '\\cong',
  'lt': '<',
  'lt=': '\\leq',
  'gt': '>',
  'gt=': '\\geq',
  '-<': '\\prec',
  '-lt': '\\prec',
  '-<=': '\\preceq',
  // '>-':                   '\\succ',
  '>-=': '\\succeq',
  'prop': '\\propto',
  'diamond': '\\diamond',
  'square': '\\square',
  'iff': '\\iff',

  'sub': '\\subset',
  'sup': '\\supset',
  'sube': '\\subseteq',
  'supe': '\\supseteq',
  'uarr': '\\uparrow',
  'darr': '\\downarrow',
  'rarr': '\\rightarrow',
  'rArr': '\\Rightarrow',
  'larr': '\\leftarrow',
  'lArr': '\\Leftarrow',
  'harr': '\\leftrightarrow',
  'hArr': '\\Leftrightarrow',
  'aleph': '\\aleph',

  // Logic
  'and': '\\land',
  'or': '\\lor',
  'not': '\\neg',
  '_|_': '\\bot',
  'TT': '\\top',
  '|--': '\\vdash',
  '|==': '\\models',

  // Other functions
  '|__': '\\lfloor',
  '__|': '\\rfloor',

  '|~': '\\lceil',
  '~|': '\\rceil',

  // Arrows
  '>->': '\\rightarrowtail',
  '->>': '\\twoheadrightarrow', // \char"21A0
  '>->>': '\\twoheadrightarrowtail', // \char"2916

  //
  // Desmos Graphing Calculator
  //
  'frac': '\\frac{#?}{#?}',
  'cbrt': '\\sqrt[3]{#?}',
  'nthroot': '\\sqrt[#?]{#?}',
};
