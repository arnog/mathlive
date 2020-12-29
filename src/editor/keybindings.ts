import { isArray } from '../common/types';

import type { Selector } from '../public/commands';
import type { Keybinding } from '../public/options';

import { getCodeForKey } from './keyboard-layout';
import { REVERSE_KEYBINDINGS } from './keybindings-definitions';
import type { ParseMode } from '../public/core';

type KeybindingPlatform =
  | 'macos'
  | 'windows'
  | 'android'
  | 'ios'
  | 'chromeos'
  | 'other';

/**
 * @param p The platform to test against.
 */
function matchPlatform(p: string): boolean {
  if (navigator?.platform && navigator?.userAgent) {
    let plat: KeybindingPlatform;
    if (/^(mac)/i.test(navigator.platform)) {
      plat = 'macos';
    } else if (/^(win)/i.test(navigator.platform)) {
      plat = 'windows';
    } else if (/(android)/i.test(navigator.userAgent)) {
      plat = 'android';
    } else if (
      /(iphone)/i.test(navigator.userAgent) ||
      /(ipod)/i.test(navigator.userAgent) ||
      /(ipad)/i.test(navigator.userAgent)
    ) {
      plat = 'ios';
    } else if (/\bcros\b/i.test(navigator.userAgent)) {
      plat = 'chromeos';
    }

    if (p.startsWith('!') && !p.endsWith(plat)) return true;
    if (p.endsWith(plat)) return true;
  }

  return false;
}

/**
 * Return the selector matching the keystroke.
 * The keybindings and keystroke should be in normalized form
 * (i.e. using key code, e.g. `[KeyQ]`
 *
 */
export function getCommandForKeybinding(
  keybindings: Keybinding[],
  mode: ParseMode,
  keystroke: string
): Selector | [Selector, ...any[]] | '' {
  if (keybindings.length === 0) return '';

  // Try to match using a virtual keystroke
  for (let i = keybindings.length - 1; i >= 0; i--) {
    if (keybindings[i].key === keystroke) {
      if (!keybindings[i].ifMode || keybindings[i].ifMode === mode) {
        return keybindings[i].command;
      }
    }
  }

  return '';
}

function commandToString(command: string | Selector | string[]): string {
  let result: string | string[] = command;

  if (isArray(result)) {
    result =
      result.length > 0 ? result[0] + '(' + result.slice(1).join('') + ')' : '';
  }

  return result;
}

export function getKeybindingsForCommand(
  keybindings: Keybinding[],
  command: string
): string[] {
  let result = [];

  if (typeof command === 'string') {
    const candidate = REVERSE_KEYBINDINGS[command];
    if (isArray(candidate)) {
      result = candidate.slice();
    } else if (candidate) {
      result.push(candidate);
    }
  }

  // A command can be either a simple selector, or a selector
  // with arguments. Normalize it to a string
  const normalizedCommand = commandToString(command);

  const regex = new RegExp(
    '^' +
      normalizedCommand
        .replace('\\', '\\\\')
        .replace('|', '\\|')
        .replace('*', '\\*')
        .replace('$', '\\$')
        .replace('^', '\\^') +
      '([^*a-zA-Z]|$)'
  );
  keybindings.forEach((keybinding) => {
    if (regex.test(commandToString(keybinding.command))) {
      result.push(keybinding);
    }
  });

  return result.map(getKeybindingMarkup);
}

/**
 * Return a human readable representation of a shortcut as a markup string
 * @revisit
 */
export function getKeybindingMarkup(keystroke: string): string {
  const useSymbol = matchPlatform('macos') || matchPlatform('ios');
  const segments = keystroke.split('+');
  let result = '';
  for (const segment of segments) {
    if (!useSymbol && result) {
      result += '<span class="ML__shortcut-join">+</span>';
    }

    if (segment.startsWith('Key')) {
      result += segment.slice(3, 4);
    } else if (segment.startsWith('Digit')) {
      result += segment.slice(5, 6);
    } else {
      result +=
        {
          'cmd': '\u2318',
          'meta': useSymbol ? '\u2318' : 'command',
          'shift': useSymbol ? '\u21E7' : 'shift',
          'alt': useSymbol ? '\u2325' : 'alt',
          'ctrl': useSymbol ? '\u2303' : 'control',
          '\n': useSymbol ? '\u23CE' : 'return',
          '[return]': useSymbol ? '\u23CE' : 'return',
          '[enter]': useSymbol ? '\u2324' : 'enter',
          '[tab]': useSymbol ? '\u21E5' : 'tab',
          // 'Esc':          useSymbol ? '\u238b' : 'esc',
          '[escape]': 'esc',

          '[backspace]': useSymbol ? '\u232B' : 'backspace',
          '[delete]': useSymbol ? '\u2326' : 'del',
          '[pageup]': useSymbol ? '\u21DE' : 'page up',
          '[pagedown]': useSymbol ? '\u21DF' : 'page down',
          '[home]': useSymbol ? '\u2912' : 'home',
          '[end]': useSymbol ? '\u2913' : 'end',
          '[space]': 'space',
          '[equal]': '=',
          '[minus]': '-',
          '[comma]': ',',
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
          '[digit0]': '0',
          '[digit1]': '1',
          '[digit2]': '2',
          '[digit3]': '3',
          '[digit4]': '4',
          '[digit5]': '5',
          '[digit6]': '6',
          '[digit7]': '7',
          '[digit8]': '8',
          '[digit9]': '9',
        }[segment.toLowerCase()] ?? segment.toUpperCase();
    }
  }

  return result;
}

function normalizeKeybinding(keybinding: Keybinding): Keybinding {
  if (
    keybinding.ifPlatform &&
    !/^!?(macos|windows|android|ios|chromeos|other)$/.test(
      keybinding.ifPlatform
    )
  ) {
    throw new Error(
      `Unexpected platform "${keybinding.ifPlatform}" for keybinding ${keybinding.key}`
    );
  }

  let segments = keybinding.key.split('+');
  const key = segments.pop();
  let platform = keybinding.ifPlatform;

  segments = segments.map((segment) => {
    const x = segment.toLowerCase();
    if (x === 'cmd') {
      if (platform && platform !== 'macos' && platform !== 'ios') {
        throw new Error(
          'Unexpected "cmd" modifier with platform "' + platform + '"'
        );
      }

      if (!platform) {
        platform = matchPlatform('ios') ? 'ios' : 'macos';
      }

      return 'meta';
    }

    if (x === 'win') {
      if (platform && platform !== 'windows') {
        throw new Error(
          'Unexpected "win" modifier with platform "' + platform + '"'
        );
      }

      platform = 'windows';
      return 'meta';
    }

    return x;
  });

  if (platform && !matchPlatform(platform)) return undefined;

  if (!/^\[(.*)]$/.test(key)) {
    // This is not a key code (e.g. `[KeyQ]`) it's a simple key (e.g. `a`)
    // Convert it to a key code
    const code = getCodeForKey(key);
    if (!code) {
      throw new Error('Invalid keybinding key "' + keybinding.key + '"');
    }

    segments = segments.concat(code.split('+'));
  } else {
    segments.push(key);
  }

  return { ...keybinding, ifPlatform: platform, key: segments.join('+') };
}

/**
 * Parse the input keybindings and return them normalized:
 * - 'keys' are transformed to 'code' according to the current keyboard layout
 * - keybindings that don't apply to the current platform are removed
 */
export function normalizeKeybindings(
  keybindings: Keybinding[],
  onError: (error: any) => void
): Keybinding[] {
  const result = [];
  const errors = [];
  keybindings.forEach((x) => {
    try {
      const keybinding = normalizeKeybinding(x);
      if (keybinding) {
        result.push(keybinding);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        errors.push(error.message);
      }
    }
  });
  if (errors.length > 0) {
    onError(errors);
  }

  return result;
}
