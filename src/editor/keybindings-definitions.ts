import type { Keybinding } from '../public/options';

export const DEFAULT_KEYBINDINGS: Keybinding[] = [
  { key: 'ctrl+alt+e', command: ['insert', '\\text{cmd+alt+e}'] },
  { key: 'cmd+alt+a', command: ['insert', '\\text{cmd+alt+a}'] },
  { key: 'ctrl+alt+a', command: ['insert', '\\text{ctrl+alt+a}'] },
  { key: 'meta+alt+2', command: ['insert', '\\text{meta+alt+2}'] },
  {
    key: 'ctrl+alt+shift+a',
    command: ['insert', '\\text{ctrl+alt+shift+a}'],
  },
  // { key: 'meta+alt+@', command: ['insert', '\\text{cmd+alt+@}'] },

  { key: 'left', command: 'moveToPreviousChar' },
  { key: 'right', command: 'moveToNextChar' },
  { key: 'up', command: 'moveUp' },
  { key: 'down', command: 'moveDown' },

  { key: 'shift+[ArrowLeft]', command: 'extendSelectionBackward' },
  { key: 'shift+[ArrowRight]', command: 'extendSelectionForward' },
  { key: 'shift+[ArrowUp]', command: 'extendSelectionUpward' },
  { key: 'shift+[ArrowDown]', command: 'extendSelectionDownward' },

  { key: '[Backspace]', command: 'deleteBackward' },
  { key: 'alt+[Delete]', command: 'deleteBackward' },

  { key: '[Delete]', command: 'deleteForward' },
  { key: 'alt+[Backspace]', command: 'deleteForward' },

  { key: 'alt+[ArrowLeft]', command: 'moveToPreviousWord' },
  { key: 'alt+[ArrowRight]', command: 'moveToNextWord' },

  { key: 'alt+shift+[ArrowLeft]', command: 'extendToPreviousWord' },
  { key: 'alt+shift+[ArrowRight]', command: 'extendToNextWord' },

  { key: 'ctrl+[ArrowLeft]', command: 'moveToGroupStart' },
  { key: 'ctrl+[ArrowRight]', command: 'moveToGroupEnd' },

  { key: 'ctrl+shift+[ArrowLeft]', command: 'extendToGroupStart' },
  { key: 'ctrl+shift+[ArrowRight]', command: 'extendToGroupEnd' },

  { key: '[Space]', ifMode: 'math', command: 'moveAfterParent' },
  { key: 'shift+[Space]', ifMode: 'math', command: 'moveBeforeParent' },

  { key: '[Home]', command: 'moveToMathFieldStart' },
  { key: 'cmd+[ArrowLeft]', command: 'moveToMathFieldStart' },
  { key: 'shift+[Home]', command: 'extendToMathFieldStart' },
  { key: 'cmd+shift+[ArrowLeft]', command: 'extendToMathFieldStart' },

  { key: '[End]', command: 'moveToMathFieldEnd' },
  { key: 'cmd+[ArrowRight]', command: 'moveToMathFieldEnd' },
  { key: 'shift+[End]', command: 'extendToMathFieldEnd' },
  { key: 'cmd+shift+[ArrowRight]', command: 'extendToMathFieldEnd' },

  { key: '[Pageup]', command: 'moveToGroupStart' },
  { key: '[Pagedown]', command: 'moveToGroupEnd' },

  { key: '[Tab]', ifMode: 'math', command: 'moveToNextPlaceholder' },
  {
    key: 'shift+[Tab]',
    ifMode: 'math',
    command: 'moveToPreviousPlaceholder',
  },

  { key: '[Tab]', ifMode: 'text', command: 'moveToNextPlaceholder' },
  {
    key: 'shift+[Tab]',
    ifMode: 'text',
    command: 'moveToPreviousPlaceholder',
  },

  { key: '[Escape]', ifMode: 'math', command: ['switchMode', 'latex'] },
  { key: '\\', ifMode: 'math', command: ['switchMode', 'latex'] },

  {
    key: 'alt+[Equal]',
    ifMode: 'math',
    command: ['applyStyle', { mode: 'text' }],
  },
  {
    key: 'alt+[Equal]',
    ifMode: 'text',
    command: ['applyStyle', { mode: 'math' }],
  },

  {
    key: '[Escape]',
    ifMode: 'latex',
    command: ['complete', 'complete', { selectItem: 'true' }],
  }, // Accept the entry (without the suggestion) and select
  {
    key: '[Tab]',
    ifMode: 'latex',
    command: ['complete', 'accept-suggestion'],
  }, // Complete the suggestion
  { key: '[Return]', ifMode: 'latex', command: 'complete' },
  { key: '[Enter]', ifMode: 'latex', command: 'complete' },
  {
    key: 'shift+[Escape]',
    ifMode: 'latex',
    command: ['complete', 'reject'],
  }, // Some keyboards can't generate
  // this combination, for example in 60% keyboards it is mapped to ~
  { key: '[ArrowDown]', ifMode: 'latex', command: 'nextSuggestion' },
  // { key: 'ios:command:[Tab]', ifMode: 'latex',command: 'nextSuggestion' },
  { key: '[ArrowUp]', ifMode: 'latex', command: 'previousSuggestion' },

  { key: 'ctrl+a', ifPlatform: '!macos', command: 'selectAll' },
  { key: 'cmd+a', command: 'selectAll' },

  // Rare keys on some extended keyboards
  { key: '[Cut]', command: 'cutToClipboard' },
  { key: '[Copy]', command: 'copyToClipboard' },
  { key: '[Paste]', command: 'pasteFromClipboard' },
  { key: '[Clear]', command: 'deleteBackward' },

  { key: 'ctrl+z', ifPlatform: '!macos', command: 'undo' },
  { key: 'cmd+z', command: 'undo' },
  { key: '[Undo]', command: 'undo' },
  { key: 'ctrl+y', ifPlatform: '!macos', command: 'redo' }, // ARIA recommendation
  { key: 'cmd+shift+y', command: 'redo' },
  { key: 'ctrl+shift+z', ifPlatform: '!macos', command: 'redo' },
  { key: 'cmd+shift+z', command: 'redo' },
  { key: '[Redo]', command: 'redo' },

  { key: '[EraseEof]', command: 'deleteToGroupEnd' },

  // EMACS/MACOS BINDINGS
  { key: 'ctrl+b', ifPlatform: 'macos', command: 'moveToPreviousChar' },
  { key: 'ctrl+f', ifPlatform: 'macos', command: 'moveToNextChar' },
  { key: 'ctrl+p', ifPlatform: 'macos', command: 'moveUp' },
  { key: 'ctrl+n', ifPlatform: 'macos', command: 'moveDown' },
  { key: 'ctrl+a', ifPlatform: 'macos', command: 'moveToMathFieldStart' },
  { key: 'ctrl+e', ifPlatform: 'macos', command: 'moveToMathFieldEnd' },
  {
    key: 'ctrl+shift+b',
    ifPlatform: 'macos',
    command: 'extendSelectionBackward',
  },
  {
    key: 'ctrl+shift+f',
    ifPlatform: 'macos',
    command: 'extendSelectionForward',
  },
  {
    key: 'ctrl+shift+p',
    ifPlatform: 'macos',
    command: 'extendSelectionUpward',
  },
  {
    key: 'ctrl+shift+n',
    ifPlatform: 'macos',
    command: 'extendSelectionDownward',
  },
  {
    key: 'ctrl+shift+a',
    ifPlatform: 'macos',
    command: 'extendToMathFieldStart',
  },
  {
    key: 'ctrl+shift+e',
    ifPlatform: 'macos',
    command: 'extendToMathFieldEnd',
  },
  { key: 'ctrl+alt+b', ifPlatform: 'macos', command: 'moveToPreviousWord' },
  { key: 'ctrl+alt+f', ifPlatform: 'macos', command: 'moveToNextWord' },
  {
    key: 'ctrl+shift+alt+b',
    ifPlatform: 'macos',
    command: 'extendToPreviousWord',
  },
  {
    key: 'ctrl+shift+alt+f',
    ifPlatform: 'macos',
    command: 'extendToNextWord',
  },

  { key: 'ctrl+h', ifPlatform: 'macos', command: 'deleteBackward' },
  { key: 'ctrl+d', ifPlatform: 'macos', command: 'deleteForward' },
  { key: 'ctrl+l', ifPlatform: 'macos', command: 'scrollIntoView' },
  // { key: 'ctrl+t', ifPlatform: 'macos', command: 'transpose' },

  {
    key: 'shift+[Quote]',
    ifMode: 'math',
    command: ['switchMode', 'text', '', '“'],
  }, // ??
  {
    key: 'shift+[Quote]',
    ifMode: 'text',
    command: ['switchMode', 'math', '”', ''],
  }, // ??

  // WOLFRAM MATHEMATICA BINDINGS
  {
    key: 'ctrl+[Digit2]',
    ifMode: 'math',
    command: ['insert', '$$\\sqrt{#0}$$'],
  },
  { key: 'ctrl+[Digit5]', ifMode: 'math', command: 'moveToOpposite' },
  { key: 'ctrl+[Digit6]', ifMode: 'math', command: 'moveToSuperscript' },
  { key: 'ctrl+[Minus]', ifMode: 'math', command: 'moveToSubscript' }, // ??
  {
    key: 'alt+[BracketLeft]',
    ifMode: 'math',
    command: ['insert', '$$\\left\\lbrack #0 \\right\\rbrack$$'],
  }, // ??
  {
    key: 'alt+shift+[BracketLeft]',
    ifMode: 'math',
    command: ['insert', '$$\\left\\lbrace #0 \\right\\rbrace$$'],
  }, // ??

  { key: 'ctrl+[Return]', ifMode: 'math', command: 'addRowAfter' },
  { key: 'ctrl+[Enter]', ifMode: 'math', command: 'addRowAfter' },
  { key: 'cmd+[Return]', ifMode: 'math', command: 'addRowAfter' },
  { key: 'cmd+[Enter]', ifMode: 'math', command: 'addRowAfter' },
  { key: 'ctrl+;', ifMode: 'math', command: 'addRowAfter' },
  { key: 'cmd+;', ifMode: 'math', command: 'addRowAfter' },
  { key: 'ctrl+shift+;', ifMode: 'math', command: 'addRowBefore' },
  { key: 'cmd+shift+;', ifMode: 'math', command: 'addRowBefore' },

  { key: 'ctrl+[Comma]', ifMode: 'math', command: 'addColumnAfter' },
  { key: 'cmd+[Comma]', ifMode: 'math', command: 'addColumnAfter' },
  { key: 'ctrl+shift+[Comma]', ifMode: 'math', command: 'addColumnAfter' },
  { key: 'cmd+shift+[Comma]', ifMode: 'math', command: 'addColumnAfter' },

  // Excel keybindings:
  // shift+space: select entire row, ctrl+space: select an entire column
  // ctrl+shift++ or ctrl+numpad+
  // ctrl+- to delete a row or columns

  // MATHLIVE BINDINGS
  // { key: 'alt+a', command: ['insert', '$$\\theta$$'] },
  { key: 'alt+p', ifMode: 'math', command: ['insert', '$$\\pi$$'] },
  { key: 'alt+v', ifMode: 'math', command: ['insert', '$$\\sqrt{#0}$$'] },
  {
    key: 'alt+w',
    ifMode: 'math',
    command: ['insert', '$$\\sum_{i=#?}^{#?}$$'],
  },
  // { key: 'alt+b', command: ['insert', '$$\\int_{#?}^{#?}$$'] },
  { key: 'alt+u', ifMode: 'math', command: ['insert', '$$\\cup$$'] },
  { key: 'alt+n', ifMode: 'math', command: ['insert', '$$\\cap$$'] },
  { key: 'alt+o', ifMode: 'math', command: ['insert', '$$\\emptyset$$'] },
  {
    key: 'alt+d',
    ifMode: 'math',
    command: ['insert', '$$\\differentialD$$'],
  },
  {
    key: 'alt+shift+o',
    ifMode: 'math',
    command: ['insert', '$$\\varnothing$$'],
  },
  {
    key: 'alt+shift+d',
    ifMode: 'math',
    command: ['insert', '$$\\partial$$'],
  },
  {
    key: 'alt+shift+p',
    ifMode: 'math',
    command: ['insert', '$$\\prod_{i=#?}^{#?}$$'],
  },
  { key: 'alt+shift+u', ifMode: 'math', command: ['insert', '$$\\bigcup$$'] },
  { key: 'alt+shift+n', ifMode: 'math', command: ['insert', '$$\\bigcap$$'] },
  { key: 'alt+shift+a', ifMode: 'math', command: ['insert', '$$\\forall$$'] },
  { key: 'alt+shift+e', ifMode: 'math', command: ['insert', '$$\\exists$$'] },
  { key: 'alt+[Digit5]', ifMode: 'math', command: ['insert', '$\\infty$$'] }, // "%" key
  { key: 'alt+[Digit6]', ifMode: 'math', command: ['insert', '$$\\wedge$$'] }, // "^" key
  {
    key: 'alt+shift+[Digit6]',
    ifMode: 'math',
    command: ['insert', '$$\\vee$$'],
  }, // "^" key
  { key: 'alt+[Digit9]', ifMode: 'math', command: ['insert', '('] }, // "(" key} override smartFence
  { key: 'alt+[Digit0]', ifMode: 'math', command: ['insert', ')'] }, // ")" key} override smartFence
  { key: 'alt+shift+[Backslash]', ifMode: 'math', command: ['insert', '|'] }, // "|" key} override smartFence
  {
    key: 'alt+[Backslash]',
    ifMode: 'math',
    command: ['insert', '$$\\backslash$$'],
  }, // "|" key} override command mode
  {
    key: '/',
    ifMode: 'math',
    command: ['insert', '$$\\frac{#@}{#?}$$'],
  },
  {
    key: 'alt+/',
    ifMode: 'math',
    command: ['insert', '$$\\/$$'],
  },
  {
    key: '[NumpadDivide]',
    ifMode: 'math',
    command: ['insert', '$$\\frac{#@}{#?}$$'],
  }, // ??
  {
    key: 'alt+[NumpadDivide]',
    ifMode: 'math',
    command: ['insert', '\\frac{#?}{#@}'],
  }, // ??
  {
    key: 'shift+[Backquote]',
    ifMode: 'math',
    command: ['insert', '$$\\~$$'],
  }, // ??

  // Accessibility
  { key: 'alt+shift+k', command: 'toggleKeystrokeCaption' },
  { key: 'alt+[Space]', command: 'toggleVirtualKeyboard' },

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
  {
    key: 'ctrl+alt+[ArrowUp]',
    command: ['speak', 'parent', { withHighlighting: false }],
  },
  {
    key: 'ctrl+alt+[ArrowDown]',
    command: ['speak', 'all', { withHighlighting: false }],
  },
];

/**
 * Most commands can be associated to their keyboard shortcuts from the
 * DEFAULT_KEYBINDINGS table above, for example 'speakSelection' -> 'ctrl+KeyR'
 * However, those that contain complex commands are more ambiguous.
 * For example, '\sqrt' -> 'math:alt+KeyV'. This table provides the reverse
 * mapping for those more complex commands. It is used when displaying
 * keybindings for specific commands in the popover.
 */
export const REVERSE_KEYBINDINGS = {
  '\\theta': 'alt+q',
  '\\sqrt': ['alt+v', 'ctrl+[Digit2]'],
  '\\pi': 'alt+p',
  '\\prod': 'alt+shift+p',
  '\\sum': 'alt+w',
  '\\int': 'alt+b',
  '\\cup': 'alt+u',
  '\\cap': 'alt+n',
  '\\bigcup': 'alt+shift+u',
  '\\bigcap': 'alt+shift+n',
  '\\forall': 'alt+shift+a',
  '\\exists': 'alt+shift+e',
  '\\infty': 'alt+[Digit5]',
  '\\wedge': 'alt+[Digit5]',
  '\\vee': 'alt+shift+[Digit6]',
  '\\differentialD': 'alt+d',
  '\\partial': 'alt+shift+d',
  '\\frac': 'Slash',
  '\\emptyset': 'alt+o',
  '\\varnothing': 'alt+shift+o',
  '\\~': '~',
};
