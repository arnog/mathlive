"use strict";
exports.__esModule = true;
exports.REVERSE_KEYBINDINGS = exports.DEFAULT_KEYBINDINGS = void 0;
exports.DEFAULT_KEYBINDINGS = [
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
    { key: 'shift+alt+[ArrowLeft]', command: 'extendToPreviousWord' },
    { key: 'shift+alt+[ArrowRight]', command: 'extendToNextWord' },
    { key: 'ctrl+[ArrowLeft]', command: 'moveToGroupStart' },
    { key: 'ctrl+[ArrowRight]', command: 'moveToGroupEnd' },
    { key: 'shift+ctrl+[ArrowLeft]', command: 'extendToGroupStart' },
    { key: 'shift+ctrl+[ArrowRight]', command: 'extendToGroupEnd' },
    { key: '[Home]', command: 'moveToMathfieldStart' },
    { key: 'cmd+[ArrowLeft]', command: 'moveToMathfieldStart' },
    { key: 'shift+[Home]', command: 'extendToMathFieldStart' },
    { key: 'shift+cmd+[ArrowLeft]', command: 'extendToMathFieldStart' },
    { key: '[End]', command: 'moveToMathfieldEnd' },
    { key: 'cmd+[ArrowRight]', command: 'moveToMathfieldEnd' },
    { key: 'shift+[End]', command: 'extendToMathFieldEnd' },
    { key: 'shift+cmd+[ArrowRight]', command: 'extendToMathFieldEnd' },
    { key: '[Pageup]', command: 'moveToGroupStart' },
    { key: '[Pagedown]', command: 'moveToGroupEnd' },
    { key: '[Tab]', command: 'moveToNextGroup' },
    {
        key: 'shift+[Tab]',
        command: 'moveToPreviousGroup'
    },
    { key: '[Escape]', ifMode: 'math', command: ['switchMode', 'latex'] },
    { key: '[Escape]', ifMode: 'text', command: ['switchMode', 'latex'] },
    {
        key: '[Escape]',
        ifMode: 'latex',
        command: ['complete', 'complete', { selectItem: 'true' }]
    },
    {
        key: '\\',
        ifMode: 'math',
        command: ['switchMode', 'latex', '', '\\']
    },
    // { key: '[Backslash]', ifMode: 'math', command: ['switchMode', 'latex'] },
    {
        key: '[IntlBackslash]',
        ifMode: 'math',
        command: ['switchMode', 'latex', '', '\\']
    },
    {
        key: '[Tab]',
        ifMode: 'latex',
        command: ['complete', 'accept-suggestion']
    },
    { key: '[Return]', ifMode: 'latex', command: 'complete' },
    { key: '[Enter]', ifMode: 'latex', command: 'complete' },
    {
        key: 'shift+[Escape]',
        ifMode: 'latex',
        command: ['complete', 'reject']
    },
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
    { key: '[Undo]', command: 'undo' },
    { key: '[Redo]', command: 'redo' },
    { key: '[EraseEof]', command: 'deleteToGroupEnd' },
    // Safari on iOS does not send cut/copy/paste commands when the mathfield
    // is focused, so intercept the keyboard shortcuts.
    // This is less desirable because the full clipboard API is not accessible
    // by this path, and user authorization is required.
    { key: 'ctrl+x', ifPlatform: 'ios', command: 'cutToClipboard' },
    { key: 'cmd+x', ifPlatform: 'ios', command: 'cutToClipboard' },
    { key: 'ctrl+c', ifPlatform: 'ios', command: 'copyToClipboard' },
    { key: 'cmd+c', ifPlatform: 'ios', command: 'copyToClipboard' },
    { key: 'ctrl+v', ifPlatform: 'ios', command: 'pasteFromClipboard' },
    { key: 'cmd+v', ifPlatform: 'ios', command: 'pasteFromClipboard' },
    { key: 'ctrl+z', ifPlatform: '!macos', command: 'undo' },
    { key: 'cmd+z', command: 'undo' },
    { key: 'ctrl+y', ifPlatform: '!macos', command: 'redo' },
    { key: 'shift+cmd+y', command: 'redo' },
    { key: 'shift+ctrl+z', ifPlatform: '!macos', command: 'redo' },
    { key: 'shift+cmd+z', command: 'redo' },
    // EMACS/MACOS BINDINGS
    { key: 'ctrl+b', ifPlatform: 'macos', command: 'moveToPreviousChar' },
    { key: 'ctrl+f', ifPlatform: 'macos', command: 'moveToNextChar' },
    { key: 'ctrl+p', ifPlatform: 'macos', command: 'moveUp' },
    { key: 'ctrl+n', ifPlatform: 'macos', command: 'moveDown' },
    { key: 'ctrl+a', ifPlatform: 'macos', command: 'moveToMathfieldStart' },
    { key: 'ctrl+e', ifPlatform: 'macos', command: 'moveToMathfieldEnd' },
    {
        key: 'shift+ctrl+b',
        ifPlatform: 'macos',
        command: 'extendSelectionBackward'
    },
    {
        key: 'shift+ctrl+f',
        ifPlatform: 'macos',
        command: 'extendSelectionForward'
    },
    {
        key: 'shift+ctrl+p',
        ifPlatform: 'macos',
        command: 'extendSelectionUpward'
    },
    {
        key: 'shift+ctrl+n',
        ifPlatform: 'macos',
        command: 'extendSelectionDownward'
    },
    {
        key: 'shift+ctrl+a',
        ifPlatform: 'macos',
        command: 'extendToMathFieldStart'
    },
    {
        key: 'shift+ctrl+e',
        ifPlatform: 'macos',
        command: 'extendToMathFieldEnd'
    },
    { key: 'alt+ctrl+b', ifPlatform: 'macos', command: 'moveToPreviousWord' },
    { key: 'alt+ctrl+f', ifPlatform: 'macos', command: 'moveToNextWord' },
    {
        key: 'shift+alt+ctrl+b',
        ifPlatform: 'macos',
        command: 'extendToPreviousWord'
    },
    {
        key: 'shift+alt+ctrl+f',
        ifPlatform: 'macos',
        command: 'extendToNextWord'
    },
    { key: 'ctrl+h', ifPlatform: 'macos', command: 'deleteBackward' },
    { key: 'ctrl+d', ifPlatform: 'macos', command: 'deleteForward' },
    { key: 'ctrl+l', ifPlatform: 'macos', command: 'scrollIntoView' },
    // { key: 'ctrl+t', ifPlatform: 'macos', command: 'transpose' },
    // WOLFRAM MATHEMATICA BINDINGS
    {
        key: 'ctrl+[Digit2]',
        ifMode: 'math',
        command: ['insert', '\\sqrt{#0}']
    },
    { key: 'ctrl+[Digit5]', ifMode: 'math', command: 'moveToOpposite' },
    { key: 'ctrl+[Digit6]', ifMode: 'math', command: 'moveToSuperscript' },
    { key: 'ctrl+[Return]', ifMode: 'math', command: 'addRowAfter' },
    { key: 'ctrl+[Enter]', ifMode: 'math', command: 'addRowAfter' },
    { key: 'cmd+[Return]', ifMode: 'math', command: 'addRowAfter' },
    { key: 'cmd+[Enter]', ifMode: 'math', command: 'addRowAfter' },
    // Excel keybindings:
    // shift+space: select entire row, ctrl+space: select an entire column
    // shift+ctrl++ or ctrl+numpad+
    // ctrl+- to delete a row or columns
    // MATHLIVE BINDINGS
    { key: 'alt+p', ifMode: 'math', command: ['insert', '\\pi'] },
    { key: 'alt+v', ifMode: 'math', command: ['insert', '\\sqrt{#0}'] },
    { key: 'alt+o', ifMode: 'math', command: ['insert', '\\emptyset'] },
    {
        key: 'alt+d',
        ifMode: 'math',
        command: ['insert', '\\differentialD']
    },
    {
        key: 'shift+alt+o',
        ifMode: 'math',
        command: ['insert', '\\varnothing']
    },
    {
        key: 'shift+alt+d',
        ifMode: 'math',
        command: ['insert', '\\partial']
    },
    {
        key: 'alt+[Backslash]',
        ifMode: 'math',
        command: ['insert', '\\backslash']
    },
    {
        key: '[NumpadDivide]',
        ifMode: 'math',
        command: ['insert', '\\frac{#@}{#?}']
    },
    {
        key: 'alt+[NumpadDivide]',
        ifMode: 'math',
        command: ['insert', '\\frac{#?}{#@}']
    },
    // Accessibility
    { key: 'shift+alt+k', command: 'toggleKeystrokeCaption' },
    { key: 'alt+[Space]', command: 'toggleContextMenu' },
    { key: 'alt+shift+[Space]', command: 'toggleVirtualKeyboard' },
    // Note: On Mac OS (as of 10.12), there is a bug/behavior that causes
    // a beep to be generated with certain command+control key combinations.
    // The workaround is to create a default binding file to silence them.
    // In ~/Library/KeyBindings/DefaultKeyBinding.dict add these entries:
    //
    //   {
    //      "^@\UF701" = "noop:";
    //    "^@\UF702" = "noop:";
    //      "^@\UF703" = "noop:";
    //  }
    {
        key: 'alt+ctrl+[ArrowUp]',
        command: ['speak', 'all', { withHighlighting: false }]
    },
    {
        key: 'alt+ctrl+[ArrowDown]',
        command: ['speak', 'selection', { withHighlighting: false }]
    },
    //
    // Punctuations and some non-alpha key combinations
    // only work with specific keyboard layouts
    //
    {
        key: 'shift+[Quote]',
        ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
        ifMode: 'math',
        command: ['switchMode', 'text', '', '']
    },
    {
        key: 'shift+[Quote]',
        ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
        ifMode: 'text',
        command: ['switchMode', 'math', '', '']
    },
    {
        key: 'shift+alt+[KeyT]',
        ifMode: 'math',
        command: ['switchMode', 'text']
    },
    {
        key: 'shift+alt+[KeyT]',
        ifMode: 'text',
        command: ['switchMode', 'math']
    },
    {
        key: '/',
        ifMode: 'math',
        command: ['insert', '\\frac{#@}{#?}']
    },
    {
        key: 'alt+/',
        ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
        ifMode: 'math',
        command: ['insert', '/']
    },
    {
        key: 'alt+shift+/',
        ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
        ifMode: 'math',
        command: ['insert', '/']
    },
    {
        key: 'alt+[BracketLeft]',
        ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
        ifMode: 'math',
        command: ['insert', '\\left\\lbrack #0 \\right\\rbrack']
    },
    {
        key: 'ctrl+[Minus]',
        ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
        ifMode: 'math',
        command: 'moveToSubscript'
    },
    {
        key: 'shift+alt+[BracketLeft]',
        ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
        ifMode: 'math',
        command: ['insert', '\\left\\lbrace #0 \\right\\rbrace']
    },
    {
        key: 'ctrl+;',
        ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
        ifMode: 'math',
        command: 'addRowAfter'
    },
    {
        key: 'cmd+;',
        ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
        ifMode: 'math',
        command: 'addRowAfter'
    },
    {
        key: 'shift+ctrl+;',
        ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
        ifMode: 'math',
        command: 'addRowBefore'
    },
    {
        key: 'shift+cmd+;',
        ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
        ifMode: 'math',
        command: 'addRowBefore'
    },
    {
        key: 'ctrl+[Backspace]',
        ifMode: 'math',
        command: 'removeRow'
    },
    {
        key: 'cmd+[Backspace]',
        ifMode: 'math',
        command: 'removeRow'
    },
    // {
    //   key: 'ctrl+[Comma]',
    //   ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
    //   ifMode: 'math',
    //   command: 'addColumnAfter',
    // },
    // {
    //   key: 'cmd+[Comma]',
    //   ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
    //   ifMode: 'math',
    //   command: 'addColumnAfter',
    // },
    // {
    //   key: 'shift+ctrl+[Comma]',
    //   ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
    //   ifMode: 'math',
    //   command: 'addColumnBefore',
    // },
    // {
    //   key: 'shift+cmd+[Comma]',
    //   ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
    //   ifMode: 'math',
    //   command: 'addColumnBefore',
    // },
    { key: 'alt+[Tab]', ifMode: 'math', command: 'addColumnAfter' },
    { key: 'shift+alt+[Tab]', ifMode: 'math', command: 'addColumnBefore' },
    { key: 'alt+[Enter]', ifMode: 'math', command: 'addRowAfter' },
    { key: 'shift+alt+[Enter]', ifMode: 'math', command: 'addRowBefore' },
    { key: 'alt+[Return]', ifMode: 'math', command: 'addRowAfter' },
    { key: 'shift+alt+[Return]', ifMode: 'math', command: 'addRowBefore' },
    {
        key: 'shift+[Backspace]',
        ifMode: 'math',
        command: 'removeColumn'
    },
    {
        key: 'alt+[Digit5]',
        ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
        ifMode: 'math',
        command: ['insert', '$\\infty']
    },
    {
        key: 'alt+[Digit9]',
        ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
        ifMode: 'math',
        command: ['insert', '(']
    },
    {
        key: 'alt+[Digit0]',
        ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
        ifMode: 'math',
        command: ['insert', ')']
    },
    {
        key: 'alt+|',
        ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
        ifMode: 'math',
        command: ['insert', '|']
    },
    {
        key: 'shift+[Backquote]',
        ifLayout: ['apple.en-intl', 'windows.en-intl', 'linux.en'],
        ifMode: 'math',
        command: ['insert', '\\~']
    },
    {
        key: '[Backquote]',
        ifLayout: ['windows.french', 'linux.french'],
        ifMode: 'math',
        command: ['insert', '^2']
    },
    {
        key: '[Backquote]',
        ifLayout: ['windows.german', 'linux.german'],
        ifMode: 'math',
        command: ['insert', '^']
    },
    {
        key: '[IntlBackslash]',
        ifLayout: ['apple.german'],
        ifMode: 'math',
        command: ['insert', '^']
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
exports.REVERSE_KEYBINDINGS = {
    '\\sqrt': ['alt+v', 'ctrl+[Digit2]'],
    '\\pi': 'alt+p',
    '\\infty': 'alt+[Digit5]',
    '\\differentialD': 'alt+d',
    '\\partial': 'shift+alt+d',
    '\\frac': 'Slash',
    '\\emptyset': 'alt+o',
    '\\varnothing': 'shift+alt+o',
    '\\~': '~'
};
