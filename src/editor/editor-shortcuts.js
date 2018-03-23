
/**
 * @module editor/shortcuts
 * @private
 */
define([], function() {


/**
 * The index of this array is a keystroke combination as returned by the key
 * field of a Javascript keyboard event as documented here:
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 * except for:
 * - `Escape`         → `Esc`
 * - `LeftArrow`...   → `Left/Right/Up/Down`
 * - `Delete`         → `Del`
 * - `Escape`         → `Esc`
 * - ' '            → `Spacebar`
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
 * @memberof module:editor/shortcuts
 * @type {Object<string,string>}
 */
const KEYBOARD_SHORTCUTS = {
    'Backspace':                'deletePreviousChar',
    'Alt-Backspace':            'deleteNextChar',

    'Del':                      'deleteNextChar',
    'Alt-Del':                  'deletePreviousChar',

    'Left':                     'moveToPreviousChar',
    'Shift-Left':               'extendToPreviousChar',
    'Ctrl-Left':                'moveToGroupStart',
    'Ctrl-Shift-Left':          'extendToGroupStart',
    'Alt-Left':                 'moveToPreviousWord',
    'Alt-Shift-Left':           'extendToPreviousWord',

    'Right':                    'moveToNextChar',
    'Ctrl-Right':               'moveToGroupEnd',
    'Ctrl-Shift-Right':         'extendToGroupEnd',
    'Shift-Right':              'extendToNextChar',
    'Alt-Right':                'moveToNextWord',
    'Alt-Shift-Right':          'extendToNextWord',

    'Home':                     'moveToMathFieldStart',
    'mac:Meta-Left':            'moveToMathFieldStart',
    'Shift-Home':               'extendToMathFieldStart',
    'mac:Meta-Shift-Left':      'extendToMathFieldStart',

    'End':                      'moveToMathFieldEnd',
    'mac:Meta-Right':           'moveToMathFieldEnd',
    'Shift-End':                'extendToMathFieldEnd',
    'mac:Meta-Shift-Right':     'extendToMathFieldEnd',

    'Up':                       'moveUp',
    'Shift-Up':                 'extendUp',
    'Down':                     'moveDown',
    'Shift-Down':               'extendDown',

    'Shift-Spacebar':           'moveBeforeParent',
    'Spacebar':                 'moveAfterParent',

    'PageUp':                   'moveToGroupStart',
    'PageDown':                 'moveToGroupEnd',

    'math:Tab':                 'moveToNextPlaceholder',
    'math:F8':                  'moveToNextPlaceholder',    // Visual Studio
    'math:Shift-Tab':           'moveToPreviousPlaceholder',
    'math:Shift-F8':            'moveToPreviousPlaceholder',    // Visual Studio

    'math:Esc':                 'enterCommandMode',
    'math:Backslash':           'enterCommandMode',
    'command:Spacebar':         'complete',
    'command:Esc':              'complete',
    'command:Tab':              'complete',
    'ios:command:Tab':          'nextSuggestion',
    'command:Return':           'complete',
    'command:Enter':            'complete',
    'command:Shift-Esc':        'complete',     // Some keyboards can't generate 
            // this combination, for example in 60% keyboards it is mapped to ~
    'command:Down':             'nextSuggestion',
    'command:Up':               'previousSuggestion',

    '!mac:math:Ctrl-KeyA':      'selectAll',
    'mac:math:Meta-KeyA':       'selectAll',
    '!mac:Ctrl-KeyZ':           'undo',
    'mac:Meta-KeyZ':            'undo',
    '!mac:Ctrl-KeyY':           'redo',             // ARIA recommendation
    'mac:Meta-Shift-KeyY':      'redo',
    '!mac:Ctrl-Shift-KeyZ':     'redo',
    'mac:Meta-Shift-KeyZ':      'redo',

    // Rare keys on some extended keyboards
    'Cut':                      'cut',
    'Copy':                     'copy',
    'Paste':                    'paste',
    'Undo':                     'undo',
    'Redo':                     'redo',
    'Clear':                    'delete',
    'EraseEof':                 'deleteToGroupEnd',


    // EMACS/MACOS BINDINGS
    'mac:Ctrl-KeyB':            'moveToPreviousChar',
    'mac:Ctrl-Shift-KeyB':      'extendToPreviousChar',
    'mac:Ctrl-KeyF':            'moveToNextChar',
    'mac:Ctrl-Shift-KeyF':      'extendToNextChar',
    'mac:Ctrl-Alt-KeyB':        'moveToPreviousWord',
    'mac:Ctrl-Shift-Alt-KeyB':  'extendToPreviousWord',
    'mac:Ctrl-Alt-KeyF':        'moveToNextWord',
    'mac:Ctrl-Shift-Alt-KeyF':  'extendToNextWord',
    'mac:Ctrl-KeyA':            'moveToMathFieldStart',    
    'mac:Ctrl-Shift-KeyA':      'extendToMathFieldStart',    
    'mac:Ctrl-KeyE':            'moveToMathFieldEnd',
    'mac:Ctrl-Shift-KeyE':      'extendToMathFieldEnd',
    'mac:Ctrl-KeyP':            'moveUp',
    'mac:Ctrl-Shift-KeyP':      'extendUp',
    'mac:Ctrl-KeyN':            'extendDown',
    'mac:Ctrl-KeyH':            'deletePreviousChar',
    'mac:Ctrl-KeyD':            'deleteNextChar',
    'mac:Ctrl-KeyL':            'scrollIntoView',
    'mac:Ctrl-KeyT':            'transpose',

    // WOLFRAM MATHEMATICA BINDINGS
    'math:Ctrl-Digit2':          ['insert', '\\sqrt{#0}'],
    'math:Ctrl-Digit5':          'moveToOpposite',
    'math:Ctrl-Digit6':          'moveToSuperscript',
    'math:Ctrl-Minus':           'moveToSubscript',
    'math:Alt-BracketLeft':      ['insert', '\\left[ #0 \\right]'],
    'math:Alt-Shift-BracketLeft':  ['insert', '\\left{ #0 \\right}'],
    'math:Ctrl-Enter':           'addRowAfter',
    'math:Ctrl-Comma':           'addColumnAfter',

    // MATHLIVE BINDINGS
    'math:Alt-KeyQ':             ['insert', '\\theta'],
    'math:Alt-KeyV':             ['insert', '\\sqrt{#0}'],
    'math:Alt-KeyP':             ['insert', '\\pi'],
    'math:Alt-Shift-KeyP':       ['insert', '\\prod_{n=#?}^{#?}'],
    'math:Alt-KeyW':             ['insert', '\\sum_{n=#?}^{#?}'],
    'math:Alt-KeyB':             ['insert', '\\int_{#?}^{#?}'],
    'math:Alt-KeyU':             ['insert', '\\cup'],
    'math:Alt-KeyN':             ['insert', '\\cap'],
    'math:Alt-Shift-KeyU':       ['insert', '\\bigcup'],
    'math:Alt-Shift-KeyN':       ['insert', '\\bigcap'],
    'math:Alt-Shift-KeyA':       ['insert', '\\forall'],
    'math:Alt-Shift-KeyE':       ['insert', '\\exists'],
    'math:Alt-Digit5':           ['insert', '\\infty'],      // "%" key
    'math:Alt-Digit6':           ['insert', '\\wedge'],      // "^" key
    'math:Alt-Shift-Digit6':     ['insert', '\\vee'],        // "^" key
    'math:Alt-Digit9':           ['insert', '\\left( #0 \\right)'],      // "(" key
    // 'Alt-Digit0':       '\\right)',      // ")" key
    'math:Alt-keyD':             ['insert', '\\differentialD'],
    'math:Alt-Shift-KeyD':       ['insert', '\\partial'],
    'math:Slash':                ['insert', '\\frac{#0}{#?}'],
    'math:Alt-Slash':            ['insert', '\\frac{#?}{#0}'],
    'math:Alt-KeyO':             ['insert', '\\emptyset'],
    'math:Alt-Shift-KeyO':       ['insert', '\\varnothing'],

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
    'mac:Ctrl-Meta-Up':         'speakParent',
    '!mac:Ctrl-Alt-Up':         'speakParent',
    'mac:Ctrl-Meta-Down':       'speakGroup',
    '!mac:Ctrl-Alt-Down':       'speakGroup',
    'mac:Ctrl-Meta-Left':       'speakLeftSibling',
    '!mac:Ctrl-Alt-Left':       'speakLeftSibling',
    'mac:Ctrl-Meta-Right':      'speakRightSibling',
    '!mac:Ctrl-Alt-Right':      'speakRightSibling',
    
    'mac:Ctrl-Meta-Shift-Down': 'speakSelection',
    '!mac:Ctrl-Alt-Shift-Down': 'speakSelection',
}

/**
 * Most commands can be associated to their keyboard shortcuts from the 
 * KEYBOARD_SHORTCUTS table above, for example 'speakSelection' -> 'Ctrl-KeyR'
 * However, those that contain complex commands are more ambiguous.
 * For example, '\sqrt' -> 'math-Alt-KeyV'. This table provides the reverse
 * mapping for those more complex commands. It is used when displaying 
 * keyboard shortcuts for specific commands in the popover.
 * @memberof module:editor/shortcuts
 * @type {Object<string,string>}
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
    '\\varnothing':             'Alt-Shift-KeyO'

}

/**
 * These shortcut strings are replaced with the corresponding LaTeX expression
 * without requiring an escape sequence or command.
 * 
 * @type {Object.<string,string>}
 * @memberof module:editor/shortcuts
 */
const INLINE_SHORTCUTS = {
    '>=':                   '\\ge',                 //ASCIIMath
    '≥':                    '\\ge',
    '<=':                   '\\le',                 //ASCIIMath
    '≤':                    '\\le',
    '!=':                   '\\ne',
    '≈':                    '\\approx',
    '~~':                   '\\approx',             // ASCIIMath
    '÷':                    '\\div',
    '-:':                   '\\div',                // ASCIIMath
    '¬':                    '\\neg',
    '+-':                   '\\pm',                 // ASCIIMath
    '-=':                   '\\equiv',              // ASCIIMath
    '\u2212=':              '\\equiv',              // ASCIIMath
    '~=':                   '\\cong',               // ASCIIMath
    ':=':                   '\\coloneq',
    '::':                   '\\Colon',
    '(:':                   '\\langle',
    ':)':                   '\\rangle',
    '-<':                   '\\prec',               // ASCIIMath
    '-<=':                  '\\preceq',             // ASCIIMath
    '\u2212<':              '\\prec',               // ASCIIMath
    // '>-':                   '\\succ',               // ASCIIMath
    '>-=':                  '\\succeq',             // ASCIIMath
    '>\u2212=':             '\\succeq',             // ASCIIMath
    'prop':                 '\\propto',             // ASCIIMath
    ':.':                   '\\therefore',          // ASCIIMath
    '**':                   '\\ast',                // ASCIIMath
    // '\u2217*':              '\\ast',             // ASCIIMath
    '\u2217*':              '\\star',               // ASCIIMath
    'xx':                   '\\times',              // ASCIIMath
    '@':                    '\\circ',               // ASCIIMath
    'diamond':              '\\diamond',            // ASCIIMath
    'square':               '\\square',             // ASCIIMath
    'iff':                  '\\iff',                // ASCIIMath



    'alpha':                '\\alpha',            // ASCIIMath
    'beta':                 '\\beta',            // ASCIIMath
    'gamma':                '\\gamma',            // ASCIIMath
    'Gamma':                '\\Gamma',            // ASCIIMath
    'delta':                '\\delta',            // ASCIIMath
    'Delta':                '\\Delta',            // ASCIIMath
    'chi':                  '\\chi',            // ASCIIMath
    'epsilon':              '\\epsilon',            // ASCIIMath
    'varepsilon':           '\\varepsilon',            // ASCIIMath
    'eta':                  '\\eta',            // ASCIIMath
    'iota':                 '\\iota',            // ASCIIMath
    'kappa':                '\\kappa',            // ASCIIMath
    'lambda':               '\\lambda',            // ASCIIMath
    'Lambda':               '\\Lambda',            // ASCIIMath
    'mu':                   '\\mu',            // ASCIIMath
    'µ':                    '\\mu',        // @TODO: or micro?
    'nu':                   '\\nu',            // ASCIIMath
    'pi':                   '\\pi',
    'π':                    '\\pi',
    'Pi':                   '\\Pi',
    'phi':                  '\\phi',
    'Phi':                  '\\Phi',
    'varphi':               '\\varphi',
    'psi':                  '\\psi',
    'Psi':                  '\\Psi',
    'rho':                  '\\rho',
    'tau':                  '\\tau',
    'sigma':                '\\sigma',
    'Sigma':                '\\Sigma',
    'theta':                '\\theta',
    'Theta':                '\\Theta',
    'vartheta':             '\\vartheta',
    'upsilon':              '\\upsilon',
    'xi':                   '\\xi',
    'Xi':                   '\\Xi',
    'zeta':                 '\\zeta',
    'omega':                '\\omega',
    'Ω':                    '\\omega',     // @TODO: or ohm?

    'ii':                   '\\imaginaryI',
    'jj':                   '\\imaginaryJ',
    'ee':                   '\\exponentialE',
    'nabla':                '\\nabla',

    'oo':                   '\\infty',       // ASCIIMath
    '∞':                    '\\infty',         // @TODO: doesn't work
    // '&infin;': '\\infty',
    // '&#8734;': '\\infty',

    '∑':                    '\\sum',
    'sum':                  '\\sum_{#?}^{#?}',       // ASCIIMath
    'prod':                 '\\prod_{#?}^{#?}',       // ASCIIMath
    '∆':                    '\\diffd',     // @TODO: most common?
    'grad':                 '\\nabla',       // ASCIIMath
    '∂':                    '\\differentialD',
    'del':                  '\\partial',       // ASCIIMath
    '√':                    '\\sqrt',
    'sqrt':                 '\\sqrt',
    '∫':                    '\\int',
    'aleph':                '\\aleph',       // ASCIIMath

    'nn':                   '\\cap',            // ASCIIMath
    'nnn':                  '\\bigcap',         // ASCIIMath
    '\u2229n':              '\\bigcap',         // ASCIIMath
    'uu':                   '\\cup',            // ASCIIMath
    'uuu':                  '\\bigcup',         // ASCIIMath
    '\u222au':              '\\bigcup',         // ASCIIMath
    
    // 'arg': '\\arg',
    'sin':                  '\\sin',
    'cos':                  '\\cos',
    'tan':                  '\\tan',
    'tanh':                 '\\tanh',
    'log':                  '\\log',
    'ln':                   '\\ln',
    'exp':                  '\\exp',
    'lim':                  '\\lim',
    'det':                  '\\det',
    'mod':                  '\\mod',
    'max':                  '\\max',
    'min':                  '\\min',
    'erf':                  '\\mathrm{erf}',
    'erfc':                 '\\mathrm{erfc}',
    'lcm':                  '\\mathrm{lcm}',
    'gcd':                  '\\mathrm{gcd}',
    'randomReal':           '\\mathrm{randomReal}',
    'randomInteger':        '\\mathrm{randomInteger}',

    'km':                   '\\mathrm{km}', // Unit: kilometer
    

    'NN':                   '\\N',        // Natural numbers
    'ZZ':                   '\\Z',        // Integers
    'QQ':                   '\\Q',        // Rational numbers
    'RR':                   '\\R',        // Real numbers
    'CC':                   '\\C',        // Complex numbers
    'PP':                   '\\P',        // Prime numbers

    'forall':               '\\forall',
    'AA':                   '\\forall',
    '!exists':              '\\nexists', // TODO: conflicts with 'exists'
    'exists':               '\\exists',
    'EE':                   '\\exists',
    '!EE':                  '\\nexists',
    // 'in':                   '\\in',
    '!in':                  '\\notin',
    'sub':                  '\\subset',     // ASCIIMath
    'sup':                  '\\supset',     // ASCIIMath
    'sube':                 '\\subseteq',     // ASCIIMath
    '\u2282e':              '\\subseteq',     // ASCIIMath
    'supe':                 '\\supseteq',     // ASCIIMath
    '\u2283e':              '\\supseteq',     // ASCIIMath


    '&&':                   '\\land',
    // '||':                   '\\lor',
    '+...':                 '+\\cdots',
    '\u2212...':            '-\\cdots',
    '\u2192...':            '\to\\cdots',
    '...':                  '\\ldots',

    '->':                   '\\to',
    '\u2212>':              '\\to',      // minus sign + >
    '∣−>':                  '\\mapsto',
    '-->':                  '\\longrightarrow',
    '\u2212\u2212>':        '\\longrightarrow',
//    '<-':                   '\\leftarrow',
    '<--':                  '\\longleftarrow',
    '<\u2212-':                  '\\longleftarrow',
    '←-':                   '\\longleftarrow',
    '=>':                   '\\Rightarrow',
    '==>':                  '\\Longrightarrow',
// '<=': '\\Leftarrow',     // CONFLICTS WITH LESS THAN OR EQUAL
    '<=>':                  '\\Leftrightarrow',
    '⩽>':                   '\\Leftrightarrow',
    '<->':                  '\\leftrightarrow',
    '←>':                   '\\leftrightarrow',
    '<<':                   '\\ll',
    '>>':                   '\\gg',
    'uarr':                  '\\uparrow',            // ASCIIMath
    'darr':                  '\\downarrow',            // ASCIIMath
    'rarr':                  '\\rightarrow',            // ASCIIMath
    'rArr':                  '\\Rightarrow',            // ASCIIMath
    'larr':                  '\\leftarrow',            // ASCIIMath
    'lArr':                  '\\Leftarrow',            // ASCIIMath
    'harr':                  '\\leftrightarrow',            // ASCIIMath
    'hArr':                  '\\Leftrightarrow',            // ASCIIMath

    '(.)':                  '\\odot',
    'o.':                   '\\odot',                // ASCIIMath
    '(+)':                  '\\oplus',      
    'o+':                   '\\oplus',                 // ASCIIMath
    // '(/)':                  '\\oslash',
    '(\u2217)':             '\\otimes',
    'ox':                   '\\otimes',            // ASCIIMath

    '\u2223|':              '\\Vert',               // || 
    '{':                    '\\{',
    '}':                    '\\}',

    '(–)':                  '\\ominus',
    '(\u2212)':             '\\circleddash',
    '(-)':                  '\\circleddash',
};

/* 
const MATHEMATICA_COMMANDS = {
    'NotEqual':             '\\ne',
    'LessEqual':            '\\le',
    'GreaterEqual':         '\\ge',
    'TildeFullEqual':       '\\cong',
    'TildeTilde':           '\\approx',
    'TildeEqual':           '\\simeq',
    'SuchThat':             '\\backepsilon',
    'RightTee':             '\\vdash',
    'LeftTee':              '\\dashv',
    'Therefore':            '\\therefore',
    'Because':              '\\because',
    'Implies':              '\\implies',
    'RoundImplies':         '\\roundimplies',
    'PlusMinus':            '\\pm',
    'MinusPlus':            '\\mp',
    'Times':                '\\times',
    'Divide':               '\\div',
    'Infinity':             '\\infty',
    'Prime':                '\\prime',
    'DoublePrime':          '\\doubleprime',

    'Alpha':                '\\alpha',
    'Beta':                 '\\beta',
    'Delta':                '\\delta',
    'Gamma':                '\\gamma',
    'Epsilon':              '\\epsilon',
    'CurlyEpsilon':         '\\varepsilon',
    'Zeta':                 '\\zeta',
    'Eta':                  '\\eta',
    'Theta':                '\\theta',
    'Iota':                 '\\iota',
    'Kappa':                '\\kappa',
    'CurlyKappa':           '\\varkappa',
    'Lambda':               '\\lambda',
    'Mu':                   '\\mu',
    'Nu':                   '\\nu',
    'Xi':                   '\\xi',
    'Omicron':              '\\omicron',
    'Pi':                   '\\pi',
    'CurlyPi':              '\\varpi',
    'Rho':                  '\\rho',
    'Sigma':                '\\sigma',
    'FinalSigma':           '\\varsigma',
    'Tau':                  '\\tau',
    'Phi':                  '\\phi',
    'CurlyPhi':             '\\varphi',
    'Upsilon':              '\\upsilon',
    'Chi':                  '\\chi',
    'Psi':                  '\\psi',
    'Omega':                '\\omega',
    'CapitalGamma':         '\\Gamma',
    'CapitalDelta':         '\\Delta',
    'CapitalTheta':         '\\Theta',
    'CapitalLambda':        '\\Lambda',
    'CapitalPi':            '\\Pi',
    'CapitalSigma':         '\\Sigma',
    'CapitalUpsilon':       '\\Upsilon',
    'CapitalPhi':           '\\Phi',
    'CapitalPsi':           '\\Psi',
    'CapitalOmega':         '\\Omega',
    'Digamma':              '\\digamma',

    'EmptySet':             '\\emptyset',

    'Element':               '\\in',
    'NotElement':            '\\notin',
    'ReverseElement':        '\\ni',
    'Subset':                '\\subset',
    'Superset':              '\\superset',
    'SubsetEqual':           '\\subseteq',
    'SupersetEqual':         '\\supseteq',
    'NotSubset':             '\\nsubset',
    'NotSuperset':           '\\nsupset',

    'Not':                   '\\neg',
    'And':                   '\\land',
    'Or':                    '\\lor',
    'Nand':                  '\\barwedge',
    'Xor':                   '\\veebar',
    'Nor':                   '\\nor',

    'Square':                '\\square',
    'SmallCircle':           '\\circ',
    'CirclePlus':            '\\oplus',
    'CircleTimes':           '\\otimes',

    'Degree':                '\\degree'
};
*/


/**
 * This function is used to resolve inline shortcuts.
 * 
 * @param {string} s candidate inline shortcuts (e.g. `'2+pi'`)
 * @return {string} null if no matching shortcut, the value of the shortcut 
 * otherwise, e.g. `{match: 'pi', substitute: '\pi'}`
 * @memberof module:editor/shortcuts
 * @private
 */
function matchEndOf(s, config) {

    let result = null;
    let matchLength = 0;
    const skipDefaultShortcuts = config && config.overrideDefaultInlineShortcuts;
    if (!skipDefaultShortcuts) {
        for (const k in INLINE_SHORTCUTS) {
            if (INLINE_SHORTCUTS.hasOwnProperty(k)) {
                if (k.length > matchLength && s.substr(-k.length) === k) {
                    result = {
                        match: k,
                        substitute: INLINE_SHORTCUTS[k]
                    };
                    matchLength = k.length;
                }
            }
        }
    }

    const customInlineShortcuts = config && config.inlineShortcuts ? 
        config.inlineShortcuts : null;
    if (customInlineShortcuts) {
        for (const k in customInlineShortcuts) {
            if (customInlineShortcuts.hasOwnProperty(k)) {
                if (k.length >= matchLength && s.substr(-k.length) === k) {
                    result = {
                        match: k,
                        substitute: customInlineShortcuts[k]
                    };
                    matchLength = k.length;
                }
            }
        }
    }
    
    return result;
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
 * Return the command matching the keystroke.
 * 
 * @param {string} mode
 * @param {string} keystroke
 * @memberof module:editor/shortcuts
 * @private
 */
function matchKeystroke(mode, keystroke) {
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

    return null;
}

function commandToString(command) {
    let result = command;

    if (Array.isArray(result) && result.length > 0) {
        result = result[0] + '(' + result.slice(1).join('') + ')';
    }

    return result;
}

function getShortcutsForCommand(command) {
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
    for (const shortcut in KEYBOARD_SHORTCUTS) {
        if (KEYBOARD_SHORTCUTS.hasOwnProperty(shortcut)) {
            if (regex.test(commandToString(KEYBOARD_SHORTCUTS[shortcut]))) {
                const m = shortcut.match(/:([^:]*)$/);
                if (m) result.push(m[1]);
            }
        }
    }

    return result;
}

/**
 * Return a human readable representation of an array of shortcut strings
 * @param {Object<string,string>} shortcuts 
 * @param {string} join optional, string in between each shortcut representation
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
                if (shortcutString.length > 0) {
                    shortcutString += '<span class="ML__shortcut_join">+</span>';
                }
                if (modifier.substr(0, 3) === 'Key') {
                    shortcutString += modifier.substr(3, 1);
                } else if (modifier.substr(0, 5) === 'Digit') {
                    shortcutString += modifier.substr(5, 1);
                } else {
                    shortcutString += {
                        'Meta':         useSymbol ? '\u2318' : 'meta',
                        'Shift':        useSymbol ? '\u21E7' : 'shift',
                        'Alt':          useSymbol ? '\u2325' : 'alt',
                        'Ctrl':         useSymbol ? '\u2303' : 'control',
                        '\n':           useSymbol ? '\u23ce' : 'return',
                        'Return':       useSymbol ? '\u23ce' : 'return',
                        'Enter':        useSymbol ? '\u23ce' : 'return',
                        'Tab':          useSymbol ? '\u21e5' : 'tab',
                        'Esc':          useSymbol ? '\u241b' : 'return',
                        'Backspace':    useSymbol ? '\u232b' : 'backspace',
                        'Backslash':    '\\',
                        'Slash':        '/',
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

return {
    INLINE : INLINE_SHORTCUTS,
    KEYBOARD: KEYBOARD_SHORTCUTS,
    matchEndOf: matchEndOf,
    matchKeystroke: matchKeystroke,
    getShortcutsForCommand: getShortcutsForCommand,
    stringify: stringify,
}

})

