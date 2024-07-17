"use strict";
exports.__esModule = true;
exports.getKeybindingMarkup = void 0;
var capabilities_1 = require("../utils/capabilities");
/**
 * Return a human readable representation of a keybinding as a markup string
 *
 * A keybinding has the format `cmd+A` or `ctrl+[KeyA]`.
 *
 * To represent either command (on macOS) or control (on other platforms),
 * use the `meta` modifier, e.g. `meta+[KeyA]`.
 *
 */
function getKeybindingMarkup(keybinding) {
    var _a;
    var useGlyph = /macos|ios/.test((0, capabilities_1.osPlatform)());
    var segments = keybinding.split('+');
    var result = '';
    for (var _i = 0, segments_1 = segments; _i < segments_1.length; _i++) {
        var segment = segments_1[_i];
        if (result) {
            result += useGlyph
                ? '\u2009'
                : '<span class="ML__shortcut-join">+</span>';
        }
        if (segment.startsWith('[Key'))
            result += segment.slice(4, 5);
        else if (segment.startsWith('Key'))
            result += segment.slice(3, 4);
        else if (segment.startsWith('[Digit'))
            result += segment.slice(6, 7);
        else if (segment.startsWith('Digit'))
            result += segment.slice(5, 6);
        else {
            result +=
                (_a = {
                    'cmd': '\u2318',
                    'meta': useGlyph ? '\u2318' : 'Ctrl',
                    'shift': useGlyph ? '\u21E7' : 'Shift',
                    'alt': useGlyph ? '\u2325' : 'Alt',
                    'ctrl': useGlyph ? '\u2303' : 'Ctrl',
                    '\n': useGlyph ? '\u23CE' : 'Return',
                    '[return]': useGlyph ? '\u23CE' : 'Return',
                    '[enter]': useGlyph ? '\u2324' : 'Enter',
                    '[tab]': useGlyph ? '\u21E5' : 'Tab',
                    // 'Esc':          useSymbol ? '\u238b' : 'esc',
                    '[escape]': 'Esc',
                    '[backspace]': useGlyph ? '\u232B' : 'Backspace',
                    '[delete]': useGlyph ? '\u2326' : 'Del',
                    '[pageup]': useGlyph ? '\u21DE' : 'Page Up',
                    '[pagedown]': useGlyph ? '\u21DF' : 'Page Down',
                    '[home]': useGlyph ? '\u2912' : 'Home',
                    '[end]': useGlyph ? '\u2913' : 'End',
                    '[space]': 'Space',
                    '[equal]': '=',
                    '[minus]': '-',
                    '[comma]': ',',
                    '[slash]': '/',
                    '[backslash]': '\\',
                    '[bracketleft]': '[',
                    '[bracketright]': ']',
                    'semicolon': ';',
                    'period': '.',
                    'comma': ',',
                    'minus': '-',
                    'equal': '=',
                    'quote': "'",
                    'backslash': '\\',
                    'intlbackslash': '\\',
                    'backquote': '`',
                    'slash': '/',
                    'numpadmultiply': '* &#128290;',
                    'numpaddivide': '/ &#128290;',
                    'numpadsubtract': '- &#128290;',
                    'numpadadd': '+ &#128290;',
                    'numpaddecimal': '. &#128290;',
                    'numpadcomma': ', &#128290;',
                    'help': 'help',
                    'left': '\u21E0',
                    'up': '\u21E1',
                    'right': '\u21E2',
                    'down': '\u21E3',
                    '[arrowleft]': '\u21E0',
                    '[arrowup]': '\u21E1',
                    '[arrowright]': '\u21E2',
                    '[arrowdown]': '\u21E3'
                }[segment.toLowerCase()]) !== null && _a !== void 0 ? _a : segment.toUpperCase();
        }
    }
    return result;
}
exports.getKeybindingMarkup = getKeybindingMarkup;
