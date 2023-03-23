// import { convertToDimension, convertToGlue } from './parser';
import type { GlobalContext, Registers } from '../public/core-types';

import { convertToGlue, convertToDimension } from '../core/parser';

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

const DEFAULT_DIMENSION_REGISTERS: Registers = {
  'p@': '1pt ',
  'z@': '0pt',
  'maxdimen': '16383.99999pt',
  'hfuzz': '0.1pt',
  'vfuzz': '0.1pt',
  'overfullrule': '5pt',
  'hsize': '6.5in',
  'vsize': '8.9in',
  'parindent': '20pt',
  'maxdepth': '4pt',
  'splitmaxdepth': '\\maxdimen',
  'boxmaxdepth': '\\maxdimen',
  'delimitershortfall': '5pt', //      @todo used in makeLeftRightDelim()
  'nulldelimiterspace': '1.2pt', //       @todo use in makeNullDelimiter
  'scriptspace': '0.5pt', // In pt.
  'topskip': '10pt',
  'splittopskip': '10pt',
  'normalbaselineskip': '12pt',
  'normallineskip': '1pt',
  'normallineskiplimit': '0pt',
  // @todo: The vertical space between the lines for all math expressions which
  // allow multiple lines (see array, multline)
  'jot': '3pt',

  // The space between adjacent `|` columns in an array definition.
  // From article.cls.txt:455
  'doublerulesep': '2pt',

  // The width of separator lines in {array} environments.
  'arrayrulewidth': '0.4pt',
  'arraycolsep': '5pt',

  // Two values from LaTeX source2e:
  'fboxsep': '3pt', // From letter.dtx:1626
  'fboxrule': '0.4pt', // From letter.dtx:1627
};

const DEFAULT_GLUE_REGISTERS: Registers = {
  'z@skip': '0pt plust0pt minus0pt',
  'hideskip': '-1000pt plust 1fill', // LaTeX
  '@flushglue': '0pt plust 1fill', // LaTeX
  'parskip': '0pt plus 1pt',
  // @todo  the "shortskip" are used if the formula starts to the right of the
  // line before (i.e. centered and short line before)
  'abovedisplayskip': '12pt plus 3pt minus 9pt',
  'abovedisplayshortskip': '0pt plus 3pt',
  'belowdisplayskip': '12pt plus 3pt minus 9pt',
  'belowdisplayshortskip': '7pt plus 3pt minus 4pt',

  'parfillskip': '0pt plus 1fil',

  'thinmuskip': '3mu', //  @todo for inter atom spacing
  'medmuskip': '4mu plus 2mu minus 4mu', // @todo for inter atom spacing
  'thickmuskip': '5mu plus 5mu', //  @todo for inter atom spacing

  'smallskipamount': '3pt plus1pt minus1pt',
  'medskipamount': '6pt plus2pt minus2pt',
  'bigskipamount': '12pt plus4pt minus4pt',
};

// From TeXBook p.348
// See also https://ctan.math.washington.edu/tex-archive/info/macros2e/macros2e.pdf
const DEFAULT_NUMBER_REGISTERS: Registers = {
  // 'voidb@x'

  pretolerance: 100,
  tolerance: 200,
  hbadness: 1000,
  vbadness: 1000,
  linepenalty: 10,
  hyphenpenalty: 50,
  exhyphenpenalty: 50,
  binoppenalty: 700,
  relpenalty: 500,
  clubpenalty: 150,
  widowpenalty: 150,
  displaywidowpenalty: 50,
  brokenpenalty: 100,
  predisplaypenalty: 10000,
  doublehyphendemerits: 10000,
  finalhyphendemerits: 5000,
  adjdemerits: 10000,
  tracinglostchars: 1,
  uchyph: 1,
  delimiterfactor: 901,
  defaulthyphenchar: '\\-',
  defaultskewchar: -1,
  newlinechar: -1,
  showboxbreadth: 5,
  showboxdepth: 3,
  errorcontextlines: 5,

  interdisplaylinepenalty: 100,
  interfootnotelinepenalty: 100,

  baselineSkip: 1.2,

  // @todo:
  arraystretch: '',

  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  year: new Date().getFullYear(),
};

let gDefaultRegisters: Registers;

export function getDefaultRegisters(context: GlobalContext): Registers {
  if (gDefaultRegisters) return gDefaultRegisters;

  gDefaultRegisters = { ...DEFAULT_NUMBER_REGISTERS };

  for (const reg of Object.keys(DEFAULT_DIMENSION_REGISTERS)) {
    gDefaultRegisters[reg] =
      convertToDimension(DEFAULT_DIMENSION_REGISTERS[reg], {
        ...context,
        registers: gDefaultRegisters,
      }) ?? 0;
  }

  for (const reg of Object.keys(DEFAULT_GLUE_REGISTERS)) {
    gDefaultRegisters[reg] =
      convertToGlue(DEFAULT_GLUE_REGISTERS[reg], {
        ...context,
        registers: gDefaultRegisters,
      }) ?? 0;
  }
  return gDefaultRegisters;
}
