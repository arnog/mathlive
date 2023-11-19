import { osPlatform } from '../utils/capabilities';

/**
 * Return a human readable representation of a keybinding as a markup string
 *
 * A keybinding has the format `cmd+A` or `ctrl+[KeyA]`.
 *
 * To represent either command (on macOS) or control (on other platforms),
 * use the `meta` modifier, e.g. `meta+[KeyA]`.
 *
 */
export function getKeybindingMarkup(keybinding: string): string {
  const useGlyph = /macos|ios/.test(osPlatform());
  const segments = keybinding.split('+');
  let result = '';
  for (const segment of segments) {
    if (result) {
      result += useGlyph
        ? '\u2009'
        : '<span class="ML__shortcut-join">+</span>';
    }
    if (segment.startsWith('[Key')) result += segment.slice(4, 5);
    else if (segment.startsWith('Key')) result += segment.slice(3, 4);
    else if (segment.startsWith('[Digit')) result += segment.slice(6, 7);
    else if (segment.startsWith('Digit')) result += segment.slice(5, 6);
    else {
      result +=
        {
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
          'bracketLeft': '[',
          'bracketRight': ']',
          'backslash': '\\',
          'intlbackslash': '\\',
          'backquote': '`',
          'slash': '/',
          'numpadmultiply': '* &#128290;',
          'numpaddivide': '/ &#128290;', // Numeric keypad
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
          '[arrowdown]': '\u21E3',
        }[segment.toLowerCase()] ?? segment.toUpperCase();
    }
  }

  return result;
}
