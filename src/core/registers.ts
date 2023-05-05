import type { Registers } from '../public/core-types';

/**
 * Registers
 *
 * Registers are scoped to the current group.
 *
 * - When accessing a register, the scope chain is used to resolve it.
 * Unless `\global` is used, in which case the global register is returned.
 *
 * - When modifying a register, the local one is modified and all the parent
 * ones, except for the global one are cleared.
 *
```tex
\newcount\R
global $R = $\the\abc  ~ (default value is 0)

{
  \par
  before top $R =$ \the\R ~ ($= 0$ access global)
  \R=1
  \par
  local top $R =$ \the\R ~ ($ = 1$ modifies local register)
  {
    \par
    inner before $R = $ \the\R ~ ($= 1$ access parent register)
    \abc=2
    \par
    inner after $R = $ \the\R ~ ($= 2$ local value)
    
    global R $R = $ \the\global\R ~ ($= 0$ global value)

    \global\R=1000
    
    $R = $ \the\R  ~ ($=1000 $ sets global and clear all locals)
    
  }
  \par
  after top $R = $ \the\R ~($= 1000$ local cleared)
}

\par
global $R = $\the\R ~($= 1000$)
```
 *
 *
 */

const DEFAULT_REGISTERS: Registers = {
  'p@': { dimension: 1 },
  'z@': { dimension: 0 },
  'maxdimen': { dimension: 16383.99999 },
  'hfuzz': { dimension: 0.1 },
  'vfuzz': { dimension: 0.1 },
  'overfullrule': { dimension: 5 },
  'hsize': { dimension: 6.5, unit: 'in' },
  'vsize': { dimension: 8.9, unit: 'in' },
  'parindent': { dimension: 20 },
  'maxdepth': { dimension: 4 },
  'splitmaxdepth': { register: 'maxdimen' },
  'boxmaxdepth': { register: 'maxdimen' },
  'delimitershortfall': { dimension: 5 }, //      @todo used in makeLeftRightDelim()
  'nulldelimiterspace': { dimension: 1.2, unit: 'pt' },
  'scriptspace': { dimension: 0.5 }, // In pt.
  'topskip': { dimension: 10 },
  'splittopskip': { dimension: 10 },
  'normalbaselineskip': { dimension: 12 },
  'normallineskip': { dimension: 1 },
  'normallineskiplimit': { dimension: 0 },
  // The vertical space between the lines for all math expressions which
  // allow multiple lines (see array, multline)
  'jot': { dimension: 3 },

  // The space between adjacent `|` columns in an array definition.
  // From article.cls.txt:455
  'doublerulesep': { dimension: 2 },

  // The width of separator lines in {array} environments.
  'arrayrulewidth': { dimension: 0.4 },
  'arraycolsep': { dimension: 5 },

  // Two values from LaTeX source2e:
  'fboxsep': { dimension: 3 }, // From letter.dtx:1626
  'fboxrule': { dimension: 0.4 }, // From letter.dtx:1627

  'z@skip': {
    glue: { dimension: 0 },
    shrink: { dimension: 0 },
    grow: { dimension: 0 },
  },
  'hideskip': {
    glue: { dimension: -1000 },
    grow: { dimension: 1, unit: 'fill' },
  }, // LaTeX
  '@flushglue': {
    glue: { dimension: 0 },
    grow: { dimension: 1, unit: 'fill' },
  }, // LaTeX
  'parskip': {
    glue: { dimension: 0 },
    grow: { dimension: 1 },
  },

  // @todo  the "shortskip" are used if the formula starts to the right of the
  // line before (i.e. centered and short line before)
  'abovedisplayskip': {
    glue: { dimension: 12 },
    grow: { dimension: 3 },
    shrink: { dimension: 9 },
  },
  'abovedisplayshortskip': {
    glue: { dimension: 0 },
    grow: { dimension: 3 },
  },
  'belowdisplayskip': {
    glue: { dimension: 12 },
    grow: { dimension: 3 },
    shrink: { dimension: 9 },
  },
  'belowdisplayshortskip': {
    glue: { dimension: 7 },
    grow: { dimension: 3 },
    shrink: { dimension: 4 },
  },

  'parfillskip': {
    glue: { dimension: 0 },
    grow: { dimension: 1, unit: 'fil' },
  },
  'thinmuskip': { glue: { dimension: 3, unit: 'mu' } },
  'medmuskip': {
    glue: { dimension: 4, unit: 'mu' },
    grow: { dimension: 2, unit: 'mu' },
    shrink: { dimension: 4, unit: 'mu' },
  },
  'thickmuskip': {
    glue: { dimension: 5, unit: 'mu' },
    grow: { dimension: 5, unit: 'mu' },
  },

  'smallskipamount': {
    glue: { dimension: 3 },
    grow: { dimension: 1 },
    shrink: { dimension: 1 },
  },
  'medskipamount': {
    glue: { dimension: 6 },
    grow: { dimension: 2 },
    shrink: { dimension: 3 },
  },
  'bigskipamount': {
    glue: { dimension: 12 },
    grow: { dimension: 2 },
    shrink: { dimension: 4 },
  },

  // From TeXBook p.348
  // See also https://ctan.math.washington.edu/tex-archive/info/macros2e/macros2e.pdf
  // 'voidb@x'

  'pretolerance': 100,
  'tolerance': 200,
  'hbadness': 1000,
  'vbadness': 1000,
  'linepenalty': 10,
  'hyphenpenalty': 50,
  'exhyphenpenalty': 50,
  'binoppenalty': 700,
  'relpenalty': 500,
  'clubpenalty': 150,
  'widowpenalty': 150,
  'displaywidowpenalty': 50,
  'brokenpenalty': 100,
  'predisplaypenalty': 10000,
  'doublehyphendemerits': 10000,
  'finalhyphendemerits': 5000,
  'adjdemerits': 10000,
  'tracinglostchars': 1,
  'uchyph': 1,
  'delimiterfactor': 901,
  'defaulthyphenchar': '\\-',
  'defaultskewchar': -1,
  'newlinechar': -1,
  'showboxbreadth': 5,
  'showboxdepth': 3,
  'errorcontextlines': 5,

  'interdisplaylinepenalty': 100,
  'interfootnotelinepenalty': 100,

  'baselineSkip': 1.2,

  'arraystretch': 1.0,

  'month': new Date().getMonth() + 1,
  'day': new Date().getDate(),
  'year': new Date().getFullYear(),
};

export function getDefaultRegisters(): Registers {
  return { ...DEFAULT_REGISTERS };
}
