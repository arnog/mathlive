import { isArray } from '../common/types';

import type { Selector } from '../public/commands';
import type { Keybinding } from '../public/options';

import {
  getCodeForKey,
  keystrokeModifiersFromString,
  keystrokeModifiersToString,
} from './keyboard-layout';
import { REVERSE_KEYBINDINGS } from './keybindings-definitions';
import { isBrowser, osPlatform } from '../ui/utils/capabilities';
import { ParseMode } from '../public/core-types';
import { KeyboardLayout } from './keyboard-layouts/types';
import { getKeybindingMarkup } from '../ui/events/keyboard';

/**
 * @param p The platform to test against.
 */
function matchPlatform(p: string): boolean {
  if (isBrowser()) {
    const plat = osPlatform();
    const isNeg = p.startsWith('!');
    const isMatch = p.endsWith(plat);
    if (isNeg && !isMatch) return true;
    if (!isNeg && isMatch) return true;
  }
  if (p === '!other') return false;
  return p === 'other';
}

/**
 * Return the selector matching the keystroke.
 * The keybindings and keystroke should be in normalized form
 * (i.e. using key code, e.g. `[KeyQ]`)
 *
 */
export function getCommandForKeybinding(
  keybindings: Keybinding[],
  mode: ParseMode,
  inKeystroke: string
): Selector | [Selector, ...any[]] | '' {
  if (keybindings.length === 0) return '';

  // Normalize keystroke to the format (order of modifiers) expected
  // by keybindings
  const keystroke = keystrokeModifiersToString(
    keystrokeModifiersFromString(inKeystroke)
  );

  // Try to match using a virtual keystroke
  for (let i = keybindings.length - 1; i >= 0; i--) {
    if (keybindings[i].key === keystroke) {
      if (!keybindings[i].ifMode || keybindings[i].ifMode === mode)
        return keybindings[i].command as Selector | [Selector, ...any[]];
    }
  }

  return '';
}

function commandToString(command: string | Selector | string[]): string {
  let result: string | string[] = command;

  if (isArray<string>(result)) {
    result =
      result.length > 0 ? result[0] + '(' + result.slice(1).join('') + ')' : '';
  }

  return result;
}

export function getKeybindingsForCommand(
  keybindings: Keybinding[],
  command: string
): string[] {
  let result: string[] = [];

  if (typeof command === 'string') {
    const candidate = REVERSE_KEYBINDINGS[command];
    if (isArray<string>(candidate)) result = candidate.slice();
    else if (candidate) result.push(candidate);
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
  for (const keybinding of keybindings) {
    if (regex.test(commandToString(keybinding.command)))
      result.push(keybinding.key);
  }

  return result.map(getKeybindingMarkup);
}

function normalizeKeybinding(
  keybinding: Keybinding,
  layout: KeyboardLayout
): Keybinding | undefined {
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

  if (
    keybinding.ifLayout !== undefined &&
    (layout.score === 0 || !keybinding.ifLayout.includes(layout.id))
  )
    return undefined;

  const modifiers = keystrokeModifiersFromString(keybinding.key);
  let platform = keybinding.ifPlatform;

  if (modifiers.cmd) {
    if (platform && platform !== 'macos' && platform !== 'ios') {
      throw new Error(
        'Unexpected "cmd" modifier with platform "' +
          platform +
          '"' +
          '\n' +
          '"cmd" modifier can only be used with macOS or iOS platform.'
      );
    }

    if (!platform) platform = osPlatform() === 'ios' ? 'ios' : 'macos';

    modifiers.win = false;
    modifiers.cmd = false;
    modifiers.meta = true;
  }

  if (modifiers.win) {
    if (platform && platform !== 'windows') {
      throw new Error(
        'Unexpected "win" modifier with platform "' +
          platform +
          '"' +
          '\n' +
          '"win" modifier can only be used with Windows platform.'
      );
    }

    platform = 'windows';
    modifiers.win = false;
    modifiers.cmd = false;
    modifiers.meta = true;
  }

  if (platform && !matchPlatform(platform)) return undefined;

  // if (/^\[.+\]$/.test(modifiers.key)) {
  //   // This is a keybinding specified with a key code (e.g.  `[KeyW]`)
  //   return {
  //     ...keybinding,
  //     ifPlatform: platform,
  //     key: keystrokeModifiersToString(modifiers),
  //   };
  // }
  // Is this a keybinding specified with a key code (e.g.  `[KeyW]`)?
  if (/^\[.+\]$/.test(modifiers.key))
    return { ...keybinding, key: keystrokeModifiersToString(modifiers) };

  // This is not a key code (e.g. `[KeyQ]`) it's a simple key (e.g. `a`).
  // Convert it to a key code.
  const code = getCodeForKey(modifiers.key, layout);
  // if (!code) throw new Error('Invalid keybinding key "' + keybinding.key + '"');
  if (!code)
    return { ...keybinding, key: keystrokeModifiersToString(modifiers) };

  if ((code.shift && modifiers.shift) || (code.alt && modifiers.alt)) {
    throw new Error(
      `The keybinding ${keybinding.key} (${selectorToString(
        keybinding.command as Selector | [Selector, ...any[]]
      )}) is conflicting with the key combination ${keystrokeModifiersToString(
        code
      )} using the ${layout.displayName} keyboard layout`
    );
  }
  code.shift = code.shift || modifiers.shift;
  code.alt = code.alt || modifiers.alt;
  code.meta = modifiers.meta;
  code.ctrl = modifiers.ctrl;
  return {
    ...keybinding,
    ifPlatform: platform,
    key: keystrokeModifiersToString(code),
  };
  // return { ...keybinding, key: keystrokeModifiersToString(code) };
}

function selectorToString(selector: Selector | [Selector, ...any[]]): string {
  if (Array.isArray(selector)) {
    const sel = [...selector];
    return (
      sel.shift() +
      '(' +
      sel
        .map((x) => (typeof x === 'string' ? `"${x}"` : x.toString()))
        .join(', ') +
      ')'
    );
  }

  return selector as string;
}

/**
 * Parse the input keybindings and return them normalized:
 * - 'keys' are transformed to 'code' according to the current keyboard layout
 * - keybindings that don't apply to the current platform are removed
 */
export function normalizeKeybindings(
  keybindings: Keybinding[],
  layout: KeyboardLayout
): [result: Keybinding[], errors: string[]] {
  const result: Keybinding[] = [];
  const errors: string[] = [];

  for (const x of keybindings) {
    try {
      const keybinding = normalizeKeybinding(x, layout);
      if (keybinding) {
        const matches = result.filter(
          (x) => x.key === keybinding.key && x.ifMode === keybinding.ifMode
        );
        if (matches.length > 0) {
          throw new Error(
            `Ambiguous key binding ${x.key} (${selectorToString(
              x.command as Selector | [Selector, ...any[]]
            )}) matches ${matches[0].key} (${selectorToString(
              matches[0].command as Selector | [Selector, ...any[]]
            )}) with the ${layout.displayName} keyboard layout`
          );
        }
        result.push(keybinding);
      }
    } catch (error: unknown) {
      if (error instanceof Error) errors.push(error.message);
    }
  }

  return [result, errors];
}
