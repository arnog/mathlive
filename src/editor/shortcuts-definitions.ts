import type { InlineShortcutDefinition } from '../public/options';

/**
 * These shortcut strings are replaced with the corresponding LaTeX expression
 * without requiring an escape sequence or command.
 */
export const INLINE_SHORTCUTS: Record<string, InlineShortcutDefinition> = {
  // Primes
  "''": { mode: 'math', value: '^{\\doubleprime}' },

  // Greek letters
  'alpha': '\\alpha',
  'delta': '\\delta',
  'Delta': '\\Delta',
  'pi': { mode: 'math', value: '\\pi' },
  'pi ': { mode: 'text', value: '\\pi ' },
  'Pi': { mode: 'math', value: '\\Pi' },
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
    mode: 'math',
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\exponentialE',
  },

  'nabla': { mode: 'math', value: '\\nabla' },
  'grad': { mode: 'math', value: '\\nabla' },
  'del': { mode: 'math', value: '\\partial' },

  '\u221E': '\\infty', // @TODO: doesn't work
  // '&infin;': '\\infty',
  // '&#8734;': '\\infty',
  'oo': {
    mode: 'math',
    after:
      'nothing+digit+frac+surd+binop+relop+punct+array+openfence+closefence+space',
    value: '\\infty',
  },

  // Big operators
  '∑': { mode: 'math', value: '\\sum' },
  'sum': { mode: 'math', value: '\\sum_{#?}^{#?}' },
  'prod': { mode: 'math', value: '\\prod_{#?}^{#?}' },
  'sqrt': { mode: 'math', value: '\\sqrt{#?}' },
  // '∫':                    '\\int',             // There's a alt-B command for this
  '∆': { mode: 'math', value: '\\differentialD' }, // @TODO: is \\diffD most common?
  '∂': { mode: 'math', value: '\\differentialD' },

  // Functions
  'arcsin': { mode: 'math', value: '\\arcsin' },
  'arccos': { mode: 'math', value: '\\arccos' },
  'arctan': { mode: 'math', value: '\\arctan' },
  'sin': { mode: 'math', value: '\\sin' },
  'sinh': { mode: 'math', value: '\\sinh' },
  'cos': { mode: 'math', value: '\\cos' },
  'cosh': { mode: 'math', value: '\\cosh' },
  'tan': { mode: 'math', value: '\\tan' },
  'tanh': { mode: 'math', value: '\\tanh' },
  'sec': { mode: 'math', value: '\\sec' },
  'csc': { mode: 'math', value: '\\csc' },
  'cot': { mode: 'math', value: '\\cot' },

  'log': { mode: 'math', value: '\\log' },
  'ln': { mode: 'math', value: '\\ln' },
  'exp': { mode: 'math', value: '\\exp' },
  'lim': { mode: 'math', value: '\\lim_{#?}' },

  // Differentials
  // According to ISO31/XI (ISO 80000-2), differentials should be upright
  'dx': {
    mode: 'math',
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\differentialD x',
  },
  'dy': {
    mode: 'math',
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\differentialD y',
  },
  'dt': {
    mode: 'math',
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\differentialD t',
  },

  // Logic
  'AA': { mode: 'math', value: '\\forall' },
  'EE': { mode: 'math', value: '\\exists' },
  '!EE': { mode: 'math', value: '\\nexists' },
  '&&': { mode: 'math', value: '\\land' },
  // The shortcut for the greek letter "xi" is interfering with "x in"
  'xin': {
    mode: 'math',
    after: 'nothing+text+relop+punct+openfence+space',
    value: 'x \\in',
  },
  'in': {
    mode: 'math',
    after: 'nothing+letter+closefence',
    value: '\\in',
  },
  '!in': { mode: 'math', value: '\\notin' },

  // Sets
  'NN': '\\N', // Natural numbers
  'ZZ': '\\Z', // Integers
  'QQ': '\\Q', // Rational numbers
  'RR': '\\R', // Real numbers
  'CC': '\\C', // Complex numbers
  'PP': '\\P', // Prime numbers

  // Operators
  'xx': { mode: 'math', value: '\\times' },
  '+-': { mode: 'math', value: '\\pm' },

  // Relational operators
  '!=': { mode: 'math', value: '\\ne' },
  '>=': { mode: 'math', value: '\\ge' },
  '<=': { mode: 'math', value: '\\le' },
  '<<': { mode: 'math', value: '\\ll' },
  '>>': { mode: 'math', value: '\\gg' },
  '~~': { mode: 'math', value: '\\approx' },

  // More operators
  '≈': { mode: 'math', value: '\\approx' },
  '?=': { mode: 'math', value: '\\questeq' },
  '÷': { mode: 'math', value: '\\div' },
  '¬': { mode: 'math', value: '\\neg' },
  ':=': { mode: 'math', value: '\\coloneq' },
  '::': { mode: 'math', value: '\\Colon' },

  // Fences
  '(:': { mode: 'math', value: '\\langle' },
  ':)': { mode: 'math', value: '\\rangle' },

  // More Greek letters
  'beta': '\\beta',
  'chi': '\\chi',
  'epsilon': '\\epsilon',
  'varepsilon': '\\varepsilon',
  'eta': {
    mode: 'math',
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\eta',
  },
  'eta ': {
    mode: 'text',
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\eta ',
  },
  'gamma': '\\gamma',
  'Gamma': '\\Gamma',
  'iota': '\\iota',
  'kappa': '\\kappa',
  'lambda': '\\lambda',
  'Lambda': '\\Lambda',
  'mu': {
    mode: 'math',
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\mu',
  },
  'mu ': {
    mode: 'text',
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\mu ',
  },
  'nu': {
    mode: 'math',
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\nu',
  },
  'nu ': {
    mode: 'text',
    after:
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
    value: '\\nu ',
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
      'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
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
  'forall': { mode: 'math', value: '\\forall' },
  'exists': {
    mode: 'math',
    value: '\\exists',
  },
  '!exists': {
    mode: 'math',
    value: '\\nexists',
  },
  ':.': {
    mode: 'math',
    value: '\\therefore',
  },

  // MORE FUNCTIONS
  // 'arg': '\\arg',
  'liminf': '\\operatorname*{lim~inf}_{#?}',
  'limsup': '\\operatorname*{lim~sup}_{#?}',
  'argmin': '\\operatorname*{arg~min}_{#?}',
  'argmax': '\\operatorname*{arg~max}_{#?}',
  'det': '\\det',
  'mod': {
    mode: 'math',
    value: '\\mod',
  },
  'max': {
    mode: 'math',
    value: '\\max',
  },
  'min': {
    mode: 'math',
    value: '\\min',
  },
  'erf': '\\operatorname{erf}',
  'erfc': '\\operatorname{erfc}',
  'bessel': {
    mode: 'math',
    value: '\\operatorname{bessel}',
  },
  'mean': {
    mode: 'math',
    value: '\\operatorname{mean}',
  },
  'median': {
    mode: 'math',
    value: '\\operatorname{median}',
  },
  'fft': {
    mode: 'math',
    value: '\\operatorname{fft}',
  },
  'lcm': {
    mode: 'math',
    value: '\\operatorname{lcm}',
  },
  'gcd': {
    mode: 'math',
    value: '\\operatorname{gcd}',
  },
  'randomReal': '\\operatorname{randomReal}',
  'randomInteger': '\\operatorname{randomInteger}',
  'Re': {
    mode: 'math',
    value: '\\operatorname{Re}',
  },
  'Im': {
    mode: 'math',
    value: '\\operatorname{Im}',
  },

  // UNITS
  'mm': {
    mode: 'math',
    after: 'nothing+digit',
    value: '\\operatorname{mm}', // Millimeter
  },
  'cm': {
    mode: 'math',
    after: 'nothing+digit',
    value: '\\operatorname{cm}', // Centimeter
  },
  'km': {
    mode: 'math',
    after: 'nothing+digit',
    value: '\\operatorname{km}', // Kilometer
  },
  'kg': {
    mode: 'math',
    after: 'nothing+digit',
    value: '\\operatorname{kg}', // Kilogram
  },

  // '||':                   '\\lor',
  '...': '\\ldots', // In general, use \ldots
  '+...': '+\\cdots', // ... but use \cdots after + ...
  '-...': '-\\cdots', // ... - and ...
  '->...': '\\to\\cdots', // ->

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

  /*
    //
    // ASCIIIMath
    //
    // Binary operation symbols
    '**':                   '\\ast',
    '***':                  '\\star',
    '//':                   '\\slash',
    '\\\\':                 '\\backslash',
    'setminus':             '\\backslash',
    '|><':                  '\\ltimes',
    '><|':                  '\\rtimes',
    '|><|':                 '\\bowtie',
    '-:':                   '\\div',
    'divide':               '\\div',
    '@':                    '\\circ',
    'o+':                   '\\oplus',
    'ox':                   '\\otimes',
    'o.':                   '\\odot',
    '^^':                   '\\wedge',
    '^^^':                  '\\bigwedge',
    'vv':                   '\\vee',
    'vvv':                  '\\bigvee',
    'nn':                   '\\cap',
    'nnn':                  '\\bigcap',
    'uu':                   '\\cup',
    'uuu':                  '\\bigcup',

    // Binary relation symbols
    '-=':                   '\\equiv',
    '~=':                   '\\cong',
    'lt':                   '<',
    'lt=':                  '\\leq',
    'gt':                   '>',
    'gt=':                  '\\geq',
    '-<':                   '\\prec',
    '-lt':                  '\\prec',
    '-<=':                  '\\preceq',
    // '>-':                   '\\succ',
    '>-=':                  '\\succeq',
    'prop':                 '\\propto',
    'diamond':              '\\diamond',
    'square':               '\\square',
    'iff':                  '\\iff',

    'sub':                  '\\subset',
    'sup':                  '\\supset',
    'sube':                 '\\subseteq',
    'supe':                 '\\supseteq',
    'uarr':                 '\\uparrow',
    'darr':                 '\\downarrow',
    'rarr':                 '\\rightarrow',
    'rArr':                 '\\Rightarrow',
    'larr':                 '\\leftarrow',
    'lArr':                 '\\Leftarrow',
    'harr':                 '\\leftrightarrow',
    'hArr':                 '\\Leftrightarrow',
    'aleph':                '\\aleph',

    // Logic
    'and':                  '\\land',
    'or':                   '\\lor',
    'not':                  '\\neg',
    '_|_':                   '\\bot',
    'TT':                   '\\top',
    '|--':                  '\\vdash',
    '|==':                  '\\models',
    
    // Other functions
    '|__':                  '\\lfloor',
    '__|':                  '\\rfloor',

    '|~':                   '\\lceil',
    '~|':                   '\\rceil',

    // Arrows
    '>->':                   '\\rightarrowtail',
    '->>':                   '\\twoheadrightarrow',
    '>->>':                  '\\twoheadrightarrowtail'
*/
};
