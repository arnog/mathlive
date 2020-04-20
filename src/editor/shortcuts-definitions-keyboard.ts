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
 * - the 'Mathfield' is the entire expression being edited
 * - a 'placeholder' is either an actual placeholder atom or an empty child
 * list, for example an empty numerator
 * - 'move' changes the position of the insertion point (and collapses the
 * selection range if necessary)
 * - 'extend' keeps the anchor of the  selection, but moves the focus (extends,
 * or shrinks, the range of selected items)
 *
 */
export const KEYBOARD_SHORTCUTS = {
    Left: 'moveToPreviousChar',
    Right: 'moveToNextChar',
    Up: 'moveUp',
    Down: 'moveDown',

    'Shift-Left': 'extendToPreviousChar',
    'Shift-Right': 'extendToNextChar',
    'Shift-Up': 'extendUp',
    'Shift-Down': 'extendDown',

    Backspace: 'deletePreviousChar',
    'Alt-Del': 'deletePreviousChar',

    Del: 'deleteNextChar',
    'Alt-Backspace': 'deleteNextChar',

    'Alt-Left': 'moveToPreviousWord',
    'Alt-Right': 'moveToNextWord',

    'Alt-Shift-Left': 'extendToPreviousWord',
    'Alt-Shift-Right': 'extendToNextWord',

    'Ctrl-Left': 'moveToGroupStart',
    'Ctrl-Right': 'moveToGroupEnd',

    'Ctrl-Shift-Left': 'extendToGroupStart',
    'Ctrl-Shift-Right': 'extendToGroupEnd',

    'math:Spacebar': 'moveAfterParent',
    'math:Shift-Spacebar': 'moveBeforeParent',

    Home: 'moveToMathFieldStart',
    'mac:Meta-Left': 'moveToMathFieldStart',
    'Shift-Home': 'extendToMathFieldStart',
    'mac:Meta-Shift-Left': 'extendToMathFieldStart',

    End: 'moveToMathFieldEnd',
    'mac:Meta-Right': 'moveToMathFieldEnd',
    'Shift-End': 'extendToMathFieldEnd',
    'mac:Meta-Shift-Right': 'extendToMathFieldEnd',

    PageUp: 'moveToGroupStart',
    PageDown: 'moveToGroupEnd',

    'math:Tab': 'moveToNextPlaceholder',
    'math:F8': 'moveToNextPlaceholder', // Visual Studio
    'math:Shift-Tab': 'moveToPreviousPlaceholder',
    'math:Shift-F8': 'moveToPreviousPlaceholder', // Visual Studio

    'text:Tab': 'moveToNextPlaceholder',
    'text:F8': 'moveToNextPlaceholder', // Visual Studio
    'text:Shift-Tab': 'moveToPreviousPlaceholder',
    'text:Shift-F8': 'moveToPreviousPlaceholder', // Visual Studio

    'math:Esc': ['switch-mode', 'command'],
    'math:Backslash': ['switch-mode', 'command'],
    'math:IntlBackslash': ['switch-mode', 'command'],

    'math:Alt-Equal': ['apply-style', { mode: 'text' }],
    'text:Alt-Equal': ['apply-style', { mode: 'math' }],

    'command:Esc': ['complete', { discard: true }], // discard the command, insert nothing
    'command:Tab': ['complete', { acceptSuggestion: true }], // complete the suggestion
    'command:Return': 'complete',
    'command:Enter': 'complete',
    'command:Shift-Esc': ['complete', { discard: true }], // Some keyboards can't generate
    // this combination, for example in 60% keyboards it is mapped to ~
    'command:Down': 'nextSuggestion',
    'ios:command:Tab': 'nextSuggestion',
    'command:Up': 'previousSuggestion',

    '!mac:Ctrl-KeyA': 'selectAll',
    'mac:Meta-KeyA': 'selectAll',

    // Rare keys on some extended keyboards
    Cut: 'cut',
    Copy: 'copy',
    Paste: 'paste',
    Clear: 'delete',

    '!mac:Ctrl-KeyZ': 'undo',
    'mac:Meta-KeyZ': 'undo',
    Undo: 'undo',
    '!mac:Ctrl-KeyY': 'redo', // ARIA recommendation
    'mac:Meta-Shift-KeyY': 'redo',
    '!mac:Ctrl-Shift-KeyZ': 'redo',
    'mac:Meta-Shift-KeyZ': 'redo',
    Redo: 'redo',

    EraseEof: 'deleteToGroupEnd',

    // EMACS/MACOS BINDINGS
    'mac:Ctrl-KeyB': 'moveToPreviousChar',
    'mac:Ctrl-KeyF': 'moveToNextChar',
    'mac:Ctrl-KeyP': 'moveUp',
    'mac:Ctrl-KeyN': 'moveDown',
    'mac:Ctrl-KeyA': 'moveToMathFieldStart',
    'mac:Ctrl-KeyE': 'moveToMathFieldEnd',

    'mac:Ctrl-Shift-KeyB': 'extendToPreviousChar',
    'mac:Ctrl-Shift-KeyF': 'extendToNextChar',
    'mac:Ctrl-Shift-KeyP': 'extendUp',
    'mac:Ctrl-Shift-KeyN': 'extendDown',
    'mac:Ctrl-Shift-KeyA': 'extendToMathFieldStart',
    'mac:Ctrl-Shift-KeyE': 'extendToMathFieldEnd',
    'mac:Ctrl-Alt-KeyB': 'moveToPreviousWord',
    'mac:Ctrl-Alt-KeyF': 'moveToNextWord',
    'mac:Ctrl-Shift-Alt-KeyB': 'extendToPreviousWord',
    'mac:Ctrl-Shift-Alt-KeyF': 'extendToNextWord',

    'mac:Ctrl-KeyH': 'deletePreviousChar',
    'mac:Ctrl-KeyD': 'deleteNextChar',
    'mac:Ctrl-KeyL': 'scrollIntoView',
    'mac:Ctrl-KeyT': 'transpose',

    'math:Shift-Quote': ['switch-mode', 'text', '', '“'],
    'text:Shift-Quote': ['switch-mode', 'math', '”', ''],

    // WOLFRAM MATHEMATICA BINDINGS
    'math:Ctrl-Digit2': ['insert', '$$\\sqrt{#0}$$'],
    'math:Ctrl-Digit5': 'moveToOpposite',
    'math:Ctrl-Digit6': 'moveToSuperscript',
    'math:Ctrl-Minus': 'moveToSubscript',
    'math:Alt-BracketLeft': ['insert', '$$\\left\\lbrack #0 \\right\\rbrack$$'],
    'math:Alt-Shift-BracketLeft': [
        'insert',
        '$$\\left\\lbrace #0 \\right\\rbrace$$',
    ],
    'math:Return': 'addRowAfter',
    'math:Enter': 'addRowAfter',
    'math:Ctrl-Comma': 'addColumnAfter',
    // Excel shortcuts:
    // Shift-space: select entire row, ctrl+space: select an entire column
    // ctrl+shift++ or ctrl+numpad+
    // ctrl+- to delete a row or columns

    // MATHLIVE BINDINGS
    'math:Alt-KeyQ': ['insert', '$$\\theta$$'],
    'math:Alt-KeyP': ['insert', '$$\\pi$$'],
    'math:Alt-KeyV': ['insert', '$$\\sqrt{#0}$$'],
    'math:Alt-KeyW': ['insert', '$$\\sum_{i=#?}^{#?}$$'],
    'math:Alt-KeyB': ['insert', '$$\\int_{#?}^{#?}$$'],
    'math:Alt-KeyU': ['insert', '$$\\cup$$'],
    'math:Alt-KeyN': ['insert', '$$\\cap$$'],
    'math:Alt-KeyO': ['insert', '$$\\emptyset$$'],
    'math:Alt-KeyD': ['insert', '$$\\differentialD$$'],
    'math:Alt-Shift-KeyO': ['insert', '$$\\varnothing$$'],
    'math:Alt-Shift-KeyD': ['insert', '$$\\partial$$'],
    'math:Alt-Shift-KeyP': ['insert', '$$\\prod_{i=#?}^{#?}$$'],
    'math:Alt-Shift-KeyU': ['insert', '$$\\bigcup$$'],
    'math:Alt-Shift-KeyN': ['insert', '$$\\bigcap$$'],
    'math:Alt-Shift-KeyA': ['insert', '$$\\forall$$'],
    'math:Alt-Shift-KeyE': ['insert', '$$\\exists$$'],
    'math:Alt-Digit5': ['insert', '$\\infty$$'], // "%" key
    'math:Alt-Digit6': ['insert', '$$\\wedge$$'], // "^" key
    'math:Alt-Shift-Digit6': ['insert', '$$\\vee$$'], // "^" key
    'math:Alt-Digit9': ['insert', '('], // "(" key, override smartFence
    'math:Alt-Digit0': ['insert', ')'], // ")" key, override smartFence
    'math:Alt-Shift-Backslash': ['insert', '|'], // "|" key, override smartFence
    'math:Alt-Backslash': ['insert', '$$\\backslash$$'], // "|" key, override command mode
    'math:Slash': ['insert', '$$\\frac{#@}{#?}$$'],
    'math:Alt-Slash': ['insert', '$$\\frac{#?}{#@}$$'],
    'math:NumpadDivide': ['insert', '$$\\frac{#@}{#?}$$'],
    'math:Alt-NumpadDivide': ['insert', '\\frac{#?}{#@}'],
    'math:Shift-Backquote': ['insert', '$$\\~$$'],
    'math:Alt-Shift-Slash': ['insert', '$$\\/$$'],

    // Accessibility
    'Alt-Shift-KeyK': 'toggleKeystrokeCaption',
    'Alt-Space': 'toggleVirtualKeyboard',

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
    'mac:Ctrl-Meta-Up': ['speak', 'parent', { withHighlighting: false }],
    '!mac:Ctrl-Alt-Up': ['speak', 'parent', { withHighlighting: false }],
    'mac:Ctrl-Meta-Down': ['speak', 'all', { withHighlighting: false }],
    '!mac:Ctrl-Alt-Down': ['speak', 'all', { withHighlighting: false }],
    'mac:Ctrl-Meta-Left': ['speak', 'left', { withHighlighting: false }],
    '!mac:Ctrl-Alt-Left': ['speak', 'left', { withHighlighting: false }],
    'mac:Ctrl-Meta-Right': ['speak', 'right', { withHighlighting: false }],
    '!mac:Ctrl-Alt-Right': ['speak', 'right', { withHighlighting: false }],
    '!mac:Ctrl-Alt-Period': ['speak', 'selection', { withHighlighting: false }],
    'mac:Ctrl-Meta-Period': ['speak', 'selection', { withHighlighting: false }],

    'mac:Ctrl-Meta-Shift-Up': ['speak', 'parent', { withHighlighting: true }],
    '!mac:Ctrl-Alt-Shift-Up': ['speak', 'parent', { withHighlighting: true }],
    'mac:Ctrl-Meta-Shift-Down': ['speak', 'all', { withHighlighting: true }],
    '!mac:Ctrl-Alt-Shift-Down': ['speak', 'all', { withHighlighting: true }],
    'mac:Ctrl-Meta-Shift-Left': ['speak', 'left', { withHighlighting: true }],
    '!mac:Ctrl-Alt-Shift-Left': ['speak', 'left', { withHighlighting: true }],
    'mac:Ctrl-Meta-Shift-Right': ['speak', 'right', { withHighlighting: true }],
    '!mac:Ctrl-Alt-Shift-Right': ['speak', 'right', { withHighlighting: true }],
    '!mac:Ctrl-Alt-Shift-Period': [
        'speak',
        'selection',
        { withHighlighting: true },
    ],
    'mac:Ctrl-Meta-Shift-Period': [
        'speak',
        'selection',
        { withHighlighting: true },
    ],
    // '!mac:Ctrl-Alt-Shift-Home': ['speak', 'start', {withHighlighting: true}],
    // 'mac:Ctrl-Alt-Shift-Home':  ['speak', 'start', {withHighlighting: true}],
    // '!mac:Ctrl-Alt-Shift-End':  ['speak', 'end', {withHighlighting: true}],
    // 'mac:Ctrl-Alt-Shift-End':   ['speak', 'end', {withHighlighting: true}],
};

/**
 * Most commands can be associated to their keyboard shortcuts from the
 * KEYBOARD_SHORTCUTS table above, for example 'speakSelection' -> 'Ctrl-KeyR'
 * However, those that contain complex commands are more ambiguous.
 * For example, '\sqrt' -> 'math:Alt-KeyV'. This table provides the reverse
 * mapping for those more complex commands. It is used when displaying
 * keyboard shortcuts for specific commands in the popover.
 */
export const REVERSE_KEYBOARD_SHORTCUTS = {
    '\\theta': 'Alt-KeyQ',
    '\\sqrt': ['Alt-KeyV', 'Ctrl-Digit2'],
    '\\pi': 'Alt-KeyP',
    '\\prod': 'Alt-Shift-KeyP',
    '\\sum': 'Alt-KeyW',
    '\\int': 'Alt-KeyB',
    '\\cup': 'Alt-KeyU',
    '\\cap': 'Alt-KeyN',
    '\\bigcup': 'Alt-Shift-KeyU',
    '\\bigcap': 'Alt-Shift-KeyN',
    '\\forall': 'Alt-Shift-KeyA',
    '\\exists': 'Alt-Shift-KeyE',
    '\\infty': 'Alt-Digit5',
    '\\wedge': 'Alt-Digit5',
    '\\vee': 'Alt-Shift-Digit6',
    '\\differentialD': 'Alt-keyD',
    '\\partial': 'Alt-Shift-KeyD',
    '\\frac': 'Slash',
    '\\emptyset': 'Alt-KeyO',
    '\\varnothing': 'Alt-Shift-KeyO',
    '\\~': '~',
};
