/**
 * @private
 */

import Definitions from '../core/definitions.js';

/**
 * The index of this array is a keystroke combination as returned by the key
 * field of a JavaScript keyboard event as documented here:
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 * except for:
 * - `Escape`         → `Esc`
 * - `LeftArrow`...   → `Left/Right/Up/Down`
 * - `Delete`         → `Del`
 * - `Escape`         → `Esc`
 * - ' '              → `Spacebar`
 * 
 * The modifiers are specified before the main key, in the following order:
 * 1. `Ctrl`
 * 2. `Meta`: Command key on Mac OS. On Windows this is the Windows key,
 * but the system intercepts those key combinations so they are never received
 * 3. `Alt`: Option key on Mac OS
 * 4. `Shift`
 * 
 * The keys can be preceded by a context to restrict when the shortcut is 
 * applicable. For example, "math:Ctrl-KeyA" will restrict this shortcut
 * to only apply in the "math" context (parseMode). Other valid context include
 * "text" and "command".
 * 
 * The value of the entries represent the command to perform. 
 * This can be either a single selector, or an array of a selector followed
 * by its arguments.
 * Selectors uses the following naming conventions:
 * - a 'char' is a math atom (a letter, digit, symbol or compound atom)
 * - a 'word' is a sequence of math atoms of the same type
 * - a 'group' is a sequence of sibling atoms, for example a numerator or 
 * a superscript
 * - the 'MathField' is the entire expression being edited
 * - a 'placeholder' is either an actual placeholder atom or an empty child 
 * list, for example an empty numerator
 * - 'move' changes the position of the insertion point (and collapses the 
 * selection range if necessary)
 * - 'extend' keeps the anchor of the  selection, but moves the focus (extends,
 * or shrinks, the range of selected items)
 * 
 * @type {Object<string,string>}
 * @private
 */
const KEYBOARD_SHORTCUTS = {
    'Left':                     'moveToPreviousChar',
    'Right':                    'moveToNextChar',
    'Up':                       'moveUp',
    'Down':                     'moveDown',

    'Shift-Left':               'extendToPreviousChar',
    'Shift-Right':              'extendToNextChar',
    'Shift-Up':                 'extendUp',
    'Shift-Down':               'extendDown',

    'Backspace':                'deletePreviousChar',
    'Alt-Del':                  'deletePreviousChar',

    'Del':                      'deleteNextChar',
    'Alt-Backspace':            'deleteNextChar',

    'Alt-Left':                 'moveToPreviousWord',
    'Alt-Right':                'moveToNextWord',

    'Alt-Shift-Left':           'extendToPreviousWord',
    'Alt-Shift-Right':          'extendToNextWord',

    'Ctrl-Left':                'moveToGroupStart',
    'Ctrl-Right':               'moveToGroupEnd',

    'Ctrl-Shift-Left':          'extendToGroupStart',
    'Ctrl-Shift-Right':         'extendToGroupEnd',

    'math:Spacebar':            'moveAfterParent',
    'math:Shift-Spacebar':      'moveBeforeParent',

    'Home':                     'moveToMathFieldStart',
    'mac:Meta-Left':            'moveToMathFieldStart',
    'Shift-Home':               'extendToMathFieldStart',
    'mac:Meta-Shift-Left':      'extendToMathFieldStart',

    'End':                      'moveToMathFieldEnd',
    'mac:Meta-Right':           'moveToMathFieldEnd',
    'Shift-End':                'extendToMathFieldEnd',
    'mac:Meta-Shift-Right':     'extendToMathFieldEnd',

    'PageUp':                   'moveToGroupStart',
    'PageDown':                 'moveToGroupEnd',

    'math:Tab':                 'moveToNextPlaceholder',
    'math:F8':                  'moveToNextPlaceholder',    // Visual Studio
    'math:Shift-Tab':           'moveToPreviousPlaceholder',
    'math:Shift-F8':            'moveToPreviousPlaceholder',    // Visual Studio

    'text:Tab':                 'moveToNextPlaceholder',
    'text:F8':                  'moveToNextPlaceholder',    // Visual Studio
    'text:Shift-Tab':           'moveToPreviousPlaceholder',
    'text:Shift-F8':            'moveToPreviousPlaceholder',    // Visual Studio

    'math:Esc':                 ['switch-mode', 'command'],
    'math:Backslash':           ['switch-mode', 'command'],
    'math:IntlBackslash':       ['switch-mode', 'command'],

    'math:Alt-Equal':           ['apply-style', {mode: 'text'}],
    'text:Alt-Equal':           ['apply-style', {mode: 'math'}],

    'command:Esc':              ['complete', {discard: true}], // discard the command, insert nothing
    'command:Tab':              ['complete', {acceptSuggestion: true}], // complete the suggestion
    'command:Return':           'complete',
    'command:Enter':            'complete',
    'command:Shift-Esc':        ['complete', {discard: true}],     // Some keyboards can't generate 
            // this combination, for example in 60% keyboards it is mapped to ~
    'command:Down':             'nextSuggestion',
    'ios:command:Tab':          'nextSuggestion',
    'command:Up':               'previousSuggestion',

    '!mac:Ctrl-KeyA':      'selectAll',
    'mac:Meta-KeyA':       'selectAll',

    // Rare keys on some extended keyboards
    'Cut':                      'cut',
    'Copy':                     'copy',
    'Paste':                    'paste',
    'Clear':                    'delete',

    '!mac:Ctrl-KeyZ':           'undo',
    'mac:Meta-KeyZ':            'undo',
    'Undo':                     'undo',
    '!mac:Ctrl-KeyY':           'redo',             // ARIA recommendation
    'mac:Meta-Shift-KeyY':      'redo',
    '!mac:Ctrl-Shift-KeyZ':     'redo',
    'mac:Meta-Shift-KeyZ':      'redo',
    'Redo':                     'redo',

    'EraseEof':                 'deleteToGroupEnd',


    // EMACS/MACOS BINDINGS
    'mac:Ctrl-KeyB':            'moveToPreviousChar',
    'mac:Ctrl-KeyF':            'moveToNextChar',
    'mac:Ctrl-KeyP':            'moveUp',
    'mac:Ctrl-KeyN':            'moveDown',
    'mac:Ctrl-KeyA':            'moveToMathFieldStart',    
    'mac:Ctrl-KeyE':            'moveToMathFieldEnd',

    'mac:Ctrl-Shift-KeyB':      'extendToPreviousChar',
    'mac:Ctrl-Shift-KeyF':      'extendToNextChar',
    'mac:Ctrl-Shift-KeyP':      'extendUp',
    'mac:Ctrl-Shift-KeyN':      'extendDown',
    'mac:Ctrl-Shift-KeyA':      'extendToMathFieldStart',    
    'mac:Ctrl-Shift-KeyE':      'extendToMathFieldEnd',
    'mac:Ctrl-Alt-KeyB':        'moveToPreviousWord',
    'mac:Ctrl-Alt-KeyF':        'moveToNextWord',
    'mac:Ctrl-Shift-Alt-KeyB':  'extendToPreviousWord',
    'mac:Ctrl-Shift-Alt-KeyF':  'extendToNextWord',

    'mac:Ctrl-KeyH':            'deletePreviousChar',
    'mac:Ctrl-KeyD':            'deleteNextChar',
    'mac:Ctrl-KeyL':            'scrollIntoView',
    'mac:Ctrl-KeyT':            'transpose',

    'math:Shift-Quote':         ['switch-mode', 'text', '', '“'],
    'text:Shift-Quote':         ['switch-mode', 'math', '”', ''],

    // WOLFRAM MATHEMATICA BINDINGS
    'math:Ctrl-Digit2':          ['insert', '\\sqrt{#0}'],
    'math:Ctrl-Digit5':          'moveToOpposite',
    'math:Ctrl-Digit6':          'moveToSuperscript',
    'math:Ctrl-Minus':           'moveToSubscript',
    'math:Alt-BracketLeft':      ['insert', '\\left\\lbrack #0 \\right\\rbrack'],
    'math:Alt-Shift-BracketLeft':  ['insert', '\\left\\lbrace #0 \\right\\rbrace'],
    'math:Return':               'addRowAfter',
    'math:Enter':                'addRowAfter',
    'math:Ctrl-Comma':           'addColumnAfter',      
    // Excel shortcuts:
    // Shift-space: select entire row, ctrl+space: select an entire column
    // ctrl+shift++ or ctrl+numpad+
    // ctrl+- to delete a row or columns

    // MATHLIVE BINDINGS
    'math:Alt-KeyQ':             ['insert', '\\theta'],
    'math:Alt-KeyP':             ['insert', '\\pi'],
    'math:Alt-KeyV':             ['insert', '\\sqrt{#0}'],
    'math:Alt-KeyW':             ['insert', '\\sum_{i=#?}^{#?}'],
    'math:Alt-KeyB':             ['insert', '\\int_{#?}^{#?}'],
    'math:Alt-KeyU':             ['insert', '\\cup'],
    'math:Alt-KeyN':             ['insert', '\\cap'],
    'math:Alt-KeyO':             ['insert', '\\emptyset'],
    'math:Alt-KeyD':             ['insert', '\\differentialD'],
    'math:Alt-Shift-KeyO':       ['insert', '\\varnothing'],
    'math:Alt-Shift-KeyD':       ['insert', '\\partial'],
    'math:Alt-Shift-KeyP':       ['insert', '\\prod_{i=#?}^{#?}'],
    'math:Alt-Shift-KeyU':       ['insert', '\\bigcup'],
    'math:Alt-Shift-KeyN':       ['insert', '\\bigcap'],
    'math:Alt-Shift-KeyA':       ['insert', '\\forall'],
    'math:Alt-Shift-KeyE':       ['insert', '\\exists'],
    'math:Alt-Digit5':           ['insert', '\\infty'],      // "%" key
    'math:Alt-Digit6':           ['insert', '\\wedge'],      // "^" key
    'math:Alt-Shift-Digit6':     ['insert', '\\vee'],        // "^" key
    'math:Alt-Digit9':           ['insert', '('],            // "(" key, override smartFence
    'math:Alt-Digit0':           ['insert', ')'],            // ")" key, override smartFence
    'math:Alt-Shift-Backslash':  ['insert', '|'],            // "|" key, override smartFence
    'math:Alt-Backslash':        ['insert', '\\backslash'],   // "|" key, override command mode
    'math:Slash':                ['insert', '\\frac{#@}{#?}'],
    'math:Alt-Slash':            ['insert', '\\frac{#?}{#@}'],
    'math:NumpadDivide':         ['insert', '\\frac{#@}{#?}'],
    'math:Alt-NumpadDivide':     ['insert', '\\frac{#?}{#@}'],
    'math:Shift-Backquote':      ['insert', '\\~'],
    'math:Alt-Shift-Slash':      ['insert', '\\/'],

    // Accessibility
    'Alt-Shift-KeyK':           'toggleKeystrokeCaption',
    'Alt-Space':                'toggleVirtualKeyboard',

    // Note: On Mac OS (as of 10.12), there is a bug/behavior that causes
    // a beep to be generated with certain command+control key combinations.
    // The workaround is to create a default binding file to silence them.
    // In ~/Library/KeyBindings/DefaultKeyBinding.dict add these entries:
 /*
 {
    "^@\UF701" = "noop:";
    "^@\UF702" = "noop:";
    "^@\UF703" = "noop:";
}
*/
    'mac:Ctrl-Meta-Up':           ['speak', 'parent', {withHighlighting: false}],
    '!mac:Ctrl-Alt-Up':           ['speak', 'parent', {withHighlighting: false}],
    'mac:Ctrl-Meta-Down':         ['speak', 'all', {withHighlighting: false}],
    '!mac:Ctrl-Alt-Down':         ['speak', 'all', {withHighlighting: false}],
    'mac:Ctrl-Meta-Left':         ['speak', 'left', {withHighlighting: false}],
    '!mac:Ctrl-Alt-Left':         ['speak', 'left', {withHighlighting: false}],
    'mac:Ctrl-Meta-Right':        ['speak', 'right', {withHighlighting: false}],
    '!mac:Ctrl-Alt-Right':        ['speak', 'right', {withHighlighting: false}],
    '!mac:Ctrl-Alt-Period':       ['speak', 'selection', {withHighlighting: false}],
    'mac:Ctrl-Meta-Period':       ['speak', 'selection', {withHighlighting: false}],
  
    'mac:Ctrl-Meta-Shift-Up':     ['speak', 'parent', {withHighlighting: true}],
    '!mac:Ctrl-Alt-Shift-Up':     ['speak', 'parent', {withHighlighting: true}],
    'mac:Ctrl-Meta-Shift-Down':   ['speak', 'all', {withHighlighting: true}],
    '!mac:Ctrl-Alt-Shift-Down':   ['speak', 'all', {withHighlighting: true}],
    'mac:Ctrl-Meta-Shift-Left':   ['speak', 'left', {withHighlighting: true}],
    '!mac:Ctrl-Alt-Shift-Left':   ['speak', 'left', {withHighlighting: true}],
    'mac:Ctrl-Meta-Shift-Right':  ['speak', 'right', {withHighlighting: true}],
    '!mac:Ctrl-Alt-Shift-Right':  ['speak', 'right', {withHighlighting: true}],
    '!mac:Ctrl-Alt-Shift-Period': ['speak', 'selection', {withHighlighting: true}],
    'mac:Ctrl-Meta-Shift-Period': ['speak', 'selection', {withHighlighting: true}],
    // '!mac:Ctrl-Alt-Shift-Home': ['speak', 'start', {withHighlighting: true}],
    // 'mac:Ctrl-Alt-Shift-Home':  ['speak', 'start', {withHighlighting: true}],
    // '!mac:Ctrl-Alt-Shift-End':  ['speak', 'end', {withHighlighting: true}],
    // 'mac:Ctrl-Alt-Shift-End':   ['speak', 'end', {withHighlighting: true}],
}

/**
 * Most commands can be associated to their keyboard shortcuts from the 
 * KEYBOARD_SHORTCUTS table above, for example 'speakSelection' -> 'Ctrl-KeyR'
 * However, those that contain complex commands are more ambiguous.
 * For example, '\sqrt' -> 'math:Alt-KeyV'. This table provides the reverse
 * mapping for those more complex commands. It is used when displaying 
 * keyboard shortcuts for specific commands in the popover.
 * @type {Object<string,string>}
 * @private
 */
const REVERSE_KEYBOARD_SHORTCUTS = {
    '\\theta':                  'Alt-KeyQ',
    '\\sqrt':                   ['Alt-KeyV', 'Ctrl-Digit2'],
    '\\pi':                     'Alt-KeyP',
    '\\prod':                   'Alt-Shift-KeyP',
    '\\sum':                    'Alt-KeyW',
    '\\int':                    'Alt-KeyB',
    '\\cup':                    'Alt-KeyU',
    '\\cap':                    'Alt-KeyN',
    '\\bigcup':                 'Alt-Shift-KeyU',
    '\\bigcap':                 'Alt-Shift-KeyN',
    '\\forall':                 'Alt-Shift-KeyA',
    '\\exists':                 'Alt-Shift-KeyE',
    '\\infty':                  'Alt-Digit5',
    '\\wedge':                  'Alt-Digit5',
    '\\vee':                    'Alt-Shift-Digit6',
    '\\differentialD':          'Alt-keyD',
    '\\partial':                'Alt-Shift-KeyD',
    '\\frac':                   'Slash',
    '\\emptyset':               'Alt-KeyO',
    '\\varnothing':             'Alt-Shift-KeyO',
    '\\~':                      '~'

}

/**
 * These shortcut strings are replaced with the corresponding LaTeX expression
 * without requiring an escape sequence or command.
 * 
 * @type {Object.<string,string>}
 * @private
 */
const INLINE_SHORTCUTS = {
    // Primes
    "''":                   { mode: 'math', value: '^{\\doubleprime}'},

    // Greek letters
    'alpha':                '\\alpha',
    'delta':                '\\delta',
    'Delta':                '\\Delta',
    'pi':                   { mode: 'math', value: '\\pi'},
    'pi ':                  { mode: 'text', value: '\\pi '},
    'Pi':                   { mode: 'math', value: '\\Pi'},
    'theta':                '\\theta',
    'Theta':                '\\Theta',

    // Letter-like
    'ii':                   { after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text', 
                                value: '\\imaginaryI' },
    'jj':                   { after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text', 
                                value: '\\imaginaryJ' },
    'ee':                   {
                                mode: 'math',
                                after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
                                value: '\\exponentialE',
                            },

    'nabla':                { mode: 'math', value: '\\nabla'},
    'grad':                 { mode: 'math', value: '\\nabla'},
    'del':                  { mode: 'math', value: '\\partial'},

    '\u221e':               '\\infty',         // @TODO: doesn't work
    // '&infin;': '\\infty',
    // '&#8734;': '\\infty',
    'oo':                   {
                                mode: 'math',
                                after: 'nothing+digit+frac+surd+binop+relop+punct+array+openfence+closefence+space',
                                value: '\\infty',
                            },

    // Big operators
    '∑':                    { mode: 'math', value: '\\sum'},
    'sum':                  { mode: 'math', value: '\\sum_{#?}^{#?}' },
    'prod':                 { mode: 'math', value: '\\prod_{#?}^{#?}' },
    'sqrt':                 { mode: 'math', value: '\\sqrt'},
    // '∫':                    '\\int',             // There's a alt-B command for this
    '∆':                    { mode: 'math', value: '\\differentialD'},     // @TODO: is \\diffD most common?
    '∂':                    { mode: 'math', value: '\\differentialD'},

    // Functions
    'sin':                  { mode: 'math', value: '\\sin'},
    'cos':                  { mode: 'math', value: '\\cos'},
    'tan':                  { mode: 'math', value: '\\tan'},
    'tanh':                 { mode: 'math', value: '\\tanh'},
    'log':                  { mode: 'math', value: '\\log'},
    'ln':                   { mode: 'math', value: '\\ln'},
    'exp':                  { mode: 'math', value: '\\exp'},
    'lim':                  { mode: 'math', value: '\\lim_{#?}'},

    // Differentials
    // According to ISO31/XI (ISO 80000-2), differentials should be upright
    'dx':                   '\\differentialD x',
    'dy':                   '\\differentialD y',
    'dt':                   '\\differentialD t',

    // Logic
    'AA':                   { mode: 'math', value: '\\forall'},
    'EE':                   { mode: 'math', value: '\\exists'},
    '!EE':                  { mode: 'math', value: '\\nexists'},
    '&&':                   { mode: 'math', value: '\\land'},
    // The shortcut for the greek letter "xi" is interfering with "x in"
    'xin':                   {
                                mode: 'math',
                                after: 'nothing+text+relop+punct+openfence+space',
                                value: 'x \\in',
                            },
    'in':                   {
                                mode: 'math',
                                after: 'nothing+letter+closefence',
                                value: '\\in',
                            },
    '!in':                  { mode: 'math', value: '\\notin'},

    // Sets
    'NN':                   '\\N',        // Natural numbers
    'ZZ':                   '\\Z',        // Integers
    'QQ':                   '\\Q',        // Rational numbers
    'RR':                   '\\R',        // Real numbers
    'CC':                   '\\C',        // Complex numbers
    'PP':                   '\\P',        // Prime numbers

    // Operators
    'xx':                   '\\times',
    '+-':                   '\\pm',

    // Relational operators
    '!=':                   '\\ne',
    '>=':                   '\\ge',
    '<=':                   '\\le',
    '<<':                   '\\ll',
    '>>':                   '\\gg',
    '~~':                   '\\approx', 

    // More operators
    '≈':                    '\\approx',
    '?=':                   '\\questeq',
    '÷':                    '\\div',
    '¬':                    '\\neg',
    ':=':                   '\\coloneq',
    '::':                   '\\Colon',

    // Fences
    '(:':                   '\\langle',
    ':)':                   '\\rangle',

    // More Greek letters
    'beta':                 '\\beta',
    'chi':                  '\\chi',
    'epsilon':              '\\epsilon',
    'varepsilon':           '\\varepsilon',
    'eta':                  { 
                                mode: 'math',
                                after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
                                value: '\\eta'
                            },
    'eta ':                 { 
                                mode: 'text',
                                after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
                                value: '\\eta '
                            },
    'gamma':                '\\gamma',
    'Gamma':                '\\Gamma',
    'iota':                 '\\iota',
    'kappa':                '\\kappa',
    'lambda':               '\\lambda',
    'Lambda':               '\\Lambda',
    'mu':                   {
                                mode: 'math',
                                after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
                                value: '\\mu'
                            },
    'mu ':                   {
                                mode: 'text',
                                after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
                                value: '\\mu '
                            },
    'nu':                   {
                                mode: 'math',
                                after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
                                value:'\\nu'
                            },
    'nu ':                   {
                                mode: 'text',
                                after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
                                value:'\\nu '
                            },
    'µ':                    '\\mu',        // @TODO: or micro?
    'phi':                  {
                                after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
                                value: '\\phi'
                            },
    'Phi':                  {
                                after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
                                value:'\\Phi'
                            },
    'varphi':               '\\varphi',
    'psi':                  {
                                after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
                                value: '\\psi'
                            },
    'Psi':                  {
                                after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
                                value:'\\Psi'
    },
    'rho':                  {
                                after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
                                value: '\\rho'
    },
    'sigma':                '\\sigma',
    'Sigma':                '\\Sigma',
    'tau':                  {
                                after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
                                value: '\\tau'
    },
    'vartheta':             '\\vartheta',
    'upsilon':              '\\upsilon',
    'xi':                   {
                                after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
                                value:'\\xi'},
    'Xi':                   {
                                after: 'nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text',
                                value:'\\Xi'},
    'zeta':                 '\\zeta',
    'omega':                '\\omega',
    'Omega':                '\\Omega',
    'Ω':                    '\\omega',     // @TODO: or ohm?

    // More Logic
    'forall':               '\\forall',
    'exists':               {
                                mode: 'math',
                                value:'\\exists'
                            },
    '!exists':              {
                                mode: 'math',
                                value: '\\nexists'
                            },
    ':.':                   {
                                mode: 'math',
                                value:'\\therefore'
    },

    // MORE FUNCTIONS
    // 'arg': '\\arg',
    'liminf':               '\\operatorname*{lim~inf}_{#?}',
    'limsup':               '\\operatorname*{lim~sup}_{#?}',
    'argmin':               '\\operatorname*{arg~min}_{#?}',
    'argmax':               '\\operatorname*{arg~max}_{#?}',
    'det':                  '\\det',
    'mod':                  {
                                mode: 'math',
                                value:'\\mod'},
    'max':                  {
                                mode: 'math',
                                value:'\\max'},
    'min':                  {
                                mode: 'math',
                                value:'\\min'},
    'erf':                  '\\operatorname{erf}',
    'erfc':                 '\\operatorname{erfc}',
    'bessel':               {
                                mode: 'math',
                                value:'\\operatorname{bessel}'},
    'mean':                 {
                                mode: 'math',
                                value: '\\operatorname{mean}'
    },
    'median':               {
                                mode: 'math',
                                value: '\\operatorname{median}'},
    'fft':                  {
                                mode: 'math',
                                value:'\\operatorname{fft}'},
    'lcm':                  {
                                mode: 'math',
                                value:'\\operatorname{lcm}'},
    'gcd':                  {
                                mode: 'math',
                                value:'\\operatorname{gcd}'},
    'randomReal':           '\\operatorname{randomReal}',
    'randomInteger':        '\\operatorname{randomInteger}',
    'Re':                   {
                                mode: 'math',
                                value:'\\operatorname{Re}'},
    'Im':                   {
                                mode: 'math',
                                value:'\\operatorname{Im}'},

    // UNITS
    'mm':                   {   mode: 'math',
                                after: 'nothing+digit', 
                                value:  '\\operatorname{mm}',         // millimeter
                            },
    'cm':                   {   mode: 'math',
                                after: 'nothing+digit', 
                                value:  '\\operatorname{cm}',         // centimeter
                            },
    'km':                   {   mode: 'math',
                                after: 'nothing+digit', 
                                value:  '\\operatorname{km}',         // kilometer
                            },
    'kg':                   {   mode: 'math',
                                after: 'nothing+digit', 
                                value:  '\\operatorname{kg}',         // kilogram
                            },
                            


    // '||':                   '\\lor',
    '...':                  '\\ldots',          // In general, use \ldots
    '+...':                 '+\\cdots',         // ... but use \cdots after + ...
    '-...':                 '-\\cdots',         // ... - and ...
    '->...':                '\\to\\cdots',       // ->

    '->':                   '\\to',
    '|->':                  '\\mapsto',
    '-->':                  '\\longrightarrow',
//    '<-':                   '\\leftarrow',
    '<--':                  '\\longleftarrow',
    '=>':                   '\\Rightarrow',
    '==>':                  '\\Longrightarrow',
// '<=': '\\Leftarrow',     // CONFLICTS WITH LESS THAN OR EQUAL
    '<=>':                  '\\Leftrightarrow',
    '<->':                  '\\leftrightarrow',

    '(.)':                  '\\odot',
    '(+)':                  '\\oplus',      
    '(/)':                  '\\oslash',
    '(*)':                  '\\otimes',
    '(-)':                  '\\ominus',
    // '(-)':                  '\\circleddash',

    '||':                   '\\Vert',
    '{':                    '\\{',
    '}':                    '\\}',
    
    '*':                    '\\cdot',


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


/**
 * Return an array of potential shortcuts
 * @param {string} s 
 * @param {object} config 
 * @return {string[]}
 */
function startsWithString(s, config) {
    const result = [];

    for (let i = 0; i <= s.length - 1; i++) {
        const s2 = s.substring(i);
        const skipDefaultShortcuts = config && config.overrideDefaultInlineShortcuts;
        if (!skipDefaultShortcuts) {
            Object.keys(INLINE_SHORTCUTS).forEach(key => {
                if (key.startsWith(s2) && !result.includes(key)) {
                    result.push(key);
                }
            });
        }

        const customInlineShortcuts = config && config.inlineShortcuts ? 
            config.inlineShortcuts : null;
        if (customInlineShortcuts) {
            Object.keys(customInlineShortcuts).forEach(key => {
                if (key.startsWith(s2)) {
                    result.push(key);
                }
            });
        }
    }
    return result;
}


/**
 * 
 * @param {string} mode
 * @param {object[]} siblings atoms preceding this potential shortcut
 * @param {string} shortcut 
 */
function validateShortcut(mode, siblings, shortcut) {
    if (!shortcut) return shortcut
    // If it's a simple shortcut (no conditional), it's valid
    if (typeof shortcut === 'string') return shortcut

    if (typeof shortcut.mode === 'string' && shortcut.mode !== mode) return null;

    // If we have no context, we assume all the shortcuts are valid
    if (!siblings) return shortcut ? shortcut.value : undefined;
    
    let nothing = false;
    let letter = false;
    let digit = false;
    let isFunction = false;
    let frac = false;
    let surd = false;
    let binop = false;
    let relop = false;
    let punct = false;
    let array = false;
    let openfence = false;
    let closefence = false;
    let text = false;
    let space = false;
    let sibling = siblings[siblings.length - 1];
    let index = siblings.length - 1;
    while (sibling && /msubsup|placeholder/.test(sibling.type)) {
        index -= 1;
        sibling = siblings[index];
    }
    nothing = !sibling || sibling.type === 'first';         // start of a group
    if (sibling) {
        text = sibling.mode === 'text';
        letter = !text && sibling.type === 'mord' && Definitions.LETTER.test(sibling.body);
        digit = !text && sibling.type === 'mord' && /[0-9]+$/.test(sibling.body);
        isFunction = !text && sibling.isFunction;
        frac = sibling.type === 'genfrac';
        surd = sibling.type === 'surd';
        binop = sibling.type === 'mbin';
        relop = sibling.type === 'mrel';
        punct = sibling.type === 'mpunct' || sibling.type === 'minner';
        array = sibling.array;
        openfence = sibling.type === 'mopen';
        closefence = sibling.type === 'mclose' || sibling.type === 'leftright';
        space = sibling.type === 'space';
    }

    if (typeof shortcut.after !== 'undefined') {
        // If this is a conditional shortcut, consider the conditions now
        if (    (/nothing/.test(shortcut.after) && nothing) ||
                (/letter/.test(shortcut.after) && letter) ||
                (/digit/.test(shortcut.after) && digit) ||
                (/function/.test(shortcut.after) && isFunction) ||
                (/frac/.test(shortcut.after) && frac) ||
                (/surd/.test(shortcut.after) && surd) ||
                (/binop/.test(shortcut.after) && binop) ||
                (/relop/.test(shortcut.after) && relop) ||
                (/punct/.test(shortcut.after) && punct) ||
                (/array/.test(shortcut.after) && array) ||
                (/openfence/.test(shortcut.after) && openfence) ||
                (/closefence/.test(shortcut.after) && closefence) ||
                (/text/.test(shortcut.after) && text) ||
                (/space/.test(shortcut.after) && space)){
            return shortcut.value;
        }
        return null;
    }

    return shortcut.value;
}

/**
 * This function is used to resolve inline shortcuts.
 * 
 * @param {string} mode
 * @param {string} context - atoms preceding the candidate, potentially used
 * to reduce which shortcuts are applicable. If 'null', no restrictions are 
 * applied.
 * @param {string} s - candidate inline shortcuts (e.g. `'pi'`)
 * @param {object} config 
 * @return {string} - A replacement string matching the shortcut (e.g. `'\pi'`)
 * @memberof module:editor/shortcuts
 * @private
 */
function forString(mode, context, s, config) {
    let result = '';

    const skipDefaultShortcuts = config && config.overrideDefaultInlineShortcuts;
    if (!skipDefaultShortcuts) {
        result = validateShortcut(mode, context, INLINE_SHORTCUTS[s]);
    }

    const customInlineShortcuts = config && config.inlineShortcuts ? 
        config.inlineShortcuts : null;
    let customResult;
    if (customInlineShortcuts) {
        customResult = validateShortcut(mode, context, customInlineShortcuts[s]);
    }
    
    return customResult || result;
}

/**
 * Return `p`, the platform name if `p` is the current platform, otherwise
 * return `!p`. For example, when running on Windows, `platform('mac')` returns
 * `'!mac'`.
 * The valid values for `p` are:
 * - `'mac'`
 * - `'win'`
 * - `'android`'
 * - `'ios'`
 * - `'chromeos'`
 * - `'other'` (Linux, etc...)
 * @param {string} p The platform to test against.
 * @return {string} if we are running on the candidate platform, return it.
 * Otherwise, return "!" + candidate.
 * @memberof module:editor/shortcuts
 * @private
 */
function platform(p) {
    let result = 'other';
    if (navigator && navigator.platform && navigator.userAgent) {
        if (/^(mac)/i.test(navigator.platform)) {
            result = 'mac';
        } else if (/^(win)/i.test(navigator.platform)) {
            result = 'win';
        } else if (/(android)/i.test(navigator.userAgent)) {
            result = 'android';
        } else if (/(iphone)/i.test(navigator.userAgent) ||
                    /(ipod)/i.test(navigator.userAgent) ||
                    /(ipad)/i.test(navigator.userAgent)) {
            result = 'ios';
        } else if (/\bCrOS\b/i.test(navigator.userAgent)) {
            result = 'chromeos';
        }
    }

    return result === p ? p : '!' + p;
}

/**
 * Return the selector matching the keystroke.
 * 
 * @param {string} mode
 * @param {string} keystroke
 * @return {string}
 * @memberof module:editor/shortcuts
 * @private
 */
function selectorForKeystroke(mode, keystroke) {
    for (const c of [
        platform('mac') + ':' + mode + ':' + keystroke,
        platform('win') + ':' + mode + ':' + keystroke,
        platform('ios') + ':' + mode + ':' + keystroke,
        platform('android') + ':' + mode + ':' + keystroke,
        platform('chromeos') + ':' + mode + ':' + keystroke,
        platform('other') + ':' + mode + ':' + keystroke,

        platform('mac') + ':' + keystroke,
        platform('win') + ':' + keystroke,
        platform('ios') + ':' + keystroke,
        platform('android') + ':' + keystroke,
        platform('chromeos') + ':' + keystroke,

        mode + ':' + keystroke,

        keystroke,
    ]) {
        if (KEYBOARD_SHORTCUTS[c]) {
            return KEYBOARD_SHORTCUTS[c];
        }
    }

    return '';
}

function commandToString(command) {
    let result = command;

    if (Array.isArray(result) && result.length > 0) {
        result = result[0] + '(' + result.slice(1).join('') + ')';
    }

    return result;
}

function forCommand(command) {
    let result = [];

    if (typeof command === 'string') {
        const candidate = REVERSE_KEYBOARD_SHORTCUTS[command];
        if (Array.isArray(candidate)) {
            result = candidate.slice();
        } else if (candidate) {
            result.push(candidate);
        }
    }

    // A command can be either a simple selector, or a selector
    // with arguments. Normalize it to a string
    command = commandToString(command);

    const regex = new RegExp('^' + 
        command.replace('\\','\\\\').
            replace('|', '\\|').
            replace('*', '\\*').
            replace('$', '\\$').
            replace('^', '\\^')
        + '([^*a-zA-Z]|$)');
    Object.keys(KEYBOARD_SHORTCUTS).forEach(shortcut  => {
            if (regex.test(commandToString(KEYBOARD_SHORTCUTS[shortcut]))) {
                const m = shortcut.match(/:([^:]*)$/);
                if (m) result.push(m[1]);
            }
        }
    );

    return stringify(result);
}

/**
 * Return a human readable representation of an array of shortcut strings
 * @param {Object<string,string>} shortcuts 
 * @param {?string} join - optional, string in between each shortcut representation
 * @memberof module:editor/shortcuts
 * @private
 */
function stringify(shortcuts, join) {
    let result = '';
    if (!Array.isArray(shortcuts)) shortcuts = [shortcuts];
    for (const shortcut of shortcuts) {
        let keyboardShortcut;
        const platMatch = shortcut.match(/(^[^:]*):/);
        const plat = platMatch ? platMatch[1] : '';

        if (plat === platform('mac') || 
            plat === platform('win') || 
            plat === platform('ios') || 
            plat === platform('android') || 
            plat === platform('chromeos') || 
            plat === platform('other')) {

            const m = shortcut.match(/:([^:]*)$/);
            keyboardShortcut = m ? m[1] : shortcut;
        } else if (!['mac', '!mac', 'win', '!win', 'ios', '!ios', 'android', 
            '!android', 'chromeos', '!chromeos', 'other', '!other'].includes(plat)) {
            const m = shortcut.match(/:([^:]*)$/);
            keyboardShortcut = m ? m[1] : shortcut;
        }
        if (keyboardShortcut) {

            const useSymbol = platform('mac') === 'mac' || 
                                platform('ios') === 'ios';
            const modifiers = keyboardShortcut.length > 1 ? 
                keyboardShortcut.split('-') : [keyboardShortcut];
            let shortcutString = '';
            for (const modifier of modifiers) {
                if (!useSymbol && shortcutString.length > 0) {
                    shortcutString += '<span class="ML__shortcut-join">+</span>';
                }
                if (modifier.substr(0, 3) === 'Key') {
                    shortcutString += modifier.substr(3, 1);
                } else if (modifier.substr(0, 5) === 'Digit') {
                    shortcutString += modifier.substr(5, 1);
                } else {
                    shortcutString += {
                        'Meta':         useSymbol ? '\u2318' : 'command',
                        'Shift':        useSymbol ? '\u21e7' : 'shift',
                        'Alt':          useSymbol ? '\u2325' : 'alt',
                        'Ctrl':         useSymbol ? '\u2303' : 'control',
                        '\n':           useSymbol ? '\u23ce' : 'return',
                        'Return':       useSymbol ? '\u23ce' : 'return',
                        'Enter':        useSymbol ? '\u2324' : 'enter',
                        'Tab':          useSymbol ? '\u21e5' : 'tab',
                        // 'Esc':          useSymbol ? '\u238b' : 'esc',
                        'Esc':          'esc',

                        'Backspace':    useSymbol ? '\u232b' : 'backspace',
                        'Del':          useSymbol ? '\u2326' : 'del',
                        'PageUp':       useSymbol ? '\u21de' : 'page up',
                        'PageDown':     useSymbol ? '\u21df' : 'page down',
                        'Home':         useSymbol ? '\u2912' : 'home',
                        'End':          useSymbol ? '\u2913' : 'end',
                        'Spacebar':     'space',
                        'Semicolon':    ';',
                        'Period':       '.',
                        'Comma':        ',',
                        'Minus':        '-',
                        'Equal':        '=',
                        'Quote':        '\'',
                        'BracketLeft':  '[',
                        'BracketRight': ']',
                        'Backslash':    '\\',
                        'IntlBackslash':    '\\',
                        'Backquote':    '`',
                        'Slash':        '/',
                        'NumpadMultiply': '* &#128290;',
                        'NumpadDivide': '/ &#128290;',  // Numeric keypad
                        'NumpadSubtract': '- &#128290;',
                        'NumpadAdd':    '+ &#128290;',
                        'NumpadDecimal':    '. &#128290;',
                        'NumpadComma':    ', &#128290;',
                        'Help':         'help',
                        'Left':         '\u21E0',
                        'Up':           '\u21E1',
                        'Right':        '\u21E2',
                        'Down':         '\u21E3',
                    }[modifier] || modifier;
                }
            }

            if (result.length > 0) {
                result += join || ' or ';
            }
            // if (shortcutString.length === 1) {
            //     shortcutString = shortcutString + ' (U+' + 
            //         ('0000' + shortcutString.codePointAt(0).toString(16)).substr(-4) + 
            //         ')';
            // }
            result += shortcutString;

        }
    }
    return result;
}

export default {
    KEYBOARD_SHORTCUTS,
    INLINE_SHORTCUTS,
    stringify,
    startsWithString,
    forString, 
    selectorForKeystroke,
    forCommand
}



