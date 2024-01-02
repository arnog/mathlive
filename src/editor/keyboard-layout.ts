import { KeyboardLayoutName } from 'public/options';
import { osPlatform } from '../ui/utils/capabilities';
import { DVORAK } from './keyboard-layouts/dvorak';
import {
  APPLE_ENGLISH,
  WINDOWS_ENGLISH,
  LINUX_ENGLISH,
} from './keyboard-layouts/english';
import {
  APPLE_FRENCH,
  LINUX_FRENCH,
  WINDOWS_FRENCH,
} from './keyboard-layouts/french';
import {
  WINDOWS_GERMAN,
  APPLE_GERMAN,
  LINUX_GERMAN,
} from './keyboard-layouts/german';
import {
  APPLE_SPANISH,
  WINDOWS_SPANISH,
  LINUX_SPANISH,
} from './keyboard-layouts/spanish';
import { KeyboardLayout } from './keyboard-layouts/types';

type KeystrokeModifiers = {
  shift: boolean;
  alt: boolean;
  cmd: boolean;
  win: boolean;
  meta: boolean;
  ctrl: boolean;
  key: string;
};

export function keystrokeModifiersFromString(key: string): KeystrokeModifiers {
  const segments = key.split('+');
  const result: KeystrokeModifiers = {
    shift: false,
    alt: false,
    cmd: false,
    win: false,
    meta: false,
    ctrl: false,
    key: segments.pop()!,
  };
  if (segments.includes('shift')) result.shift = true;
  if (segments.includes('alt')) result.alt = true;
  if (segments.includes('ctrl')) result.ctrl = true;
  if (segments.includes('cmd')) result.cmd = true;
  if (segments.includes('win')) result.win = true;
  if (segments.includes('meta')) result.meta = true;

  return result;
}

export function keystrokeModifiersToString(key: KeystrokeModifiers): string {
  let result = '';
  if (key.shift) result += 'shift+';
  if (key.alt) result += 'alt+';
  if (key.ctrl) result += 'ctrl+';
  if (key.cmd) result += 'cmd+';
  if (key.win) result += 'win+';
  if (key.meta) result += 'meta+';

  return result + key.key;
}

/* prettier-ignore */
const BASE_LAYOUT_MAPPING = {
    enter: '[Enter]',
    escape: '[Escape]',
    backspace: '[Backspace]',
    tab: '[Tab]',
    space: '[Space]',
    pausebreak: '[Pause]',
    insert: '[Insert]',
    home: '[Home]',
    pageup: '[PageUp]',
    delete: '[Delete]',
    end: '[End]',
    pagedown: '[PageDown]',
    right: '[ArrowRight]',
    left: '[ArrowLeft]',
    down: '[ArrowDown]',
    up: '[ArrowUp]',
    numpad0: '[Numpad0]',
    numpad1: '[Numpad1]',
    numpad2: '[Numpad2]',
    numpad3: '[Numpad3]',
    numpad4: '[Numpad4]',
    numpad5: '[Numpad5]',
    numpad6: '[Numpad6]',
    numpad7: '[Numpad7]',
    numpad8: '[Numpad8]',
    numpad9: '[Numpad9]',
    'numpad_divide': '[NumpadDivide]',
    'numpad_multiply': '[NumpadMultiply]',
    'numpad_subtract': '[NumpadSubtract]',
    'numpad_add': '[NumpadAdd]',
    'numpad_decimal': '[NumpadDecimal]',
    'numpad_separator': '[NumpadComma]',
    capslock: '[Capslock]',
    f1: '[F1]',
    f2: '[F2]',
    f3: '[F3]',
    f4: '[F4]',
    f5: '[F5]',
    f6: '[F6]',
    f7: '[F7]',
    f8: '[F8]',
    f9: '[F9]',
    f10: '[F10]',
    f11: '[F11]',
    f12: '[F12]',
    f13: '[F13]',
    f14: '[F14]',
    f15: '[F15]',
    f16: '[F16]',
    f17: '[F17]',
    f18: '[F18]',
    f19: '[F19]',
};

const gKeyboardLayouts: KeyboardLayout[] = [];

export let gKeyboardLayout: KeyboardLayout | undefined;

export function platform(): 'apple' | 'windows' | 'linux' {
  switch (osPlatform()) {
    case 'macos':
    case 'ios':
      return 'apple';
    case 'windows':
      return 'windows';
    // case 'android':
    // case 'chromeos':
  }

  return 'linux';
}

export function register(layout: KeyboardLayout): void {
  if (!layout.platform || layout.platform === platform())
    gKeyboardLayouts.push(layout);
}

/** Given the current estimated keyboard layout,
 *  return the unmodified key for the event.
 * For example, on AZERTY option+shift+'A' = 'Æ' -> 'a'
 * (event though the code is KeyQ)
 */
// export function getUnmodifiedKey(evt: KeyboardEvent): string {
//     if (!evt.shiftKey && !evt.altKey) {
//         return evt.key;
//     }
//     // @todo: iterate over the entries for the current layout,
//     // with the alt+shift modifiers set accordingly
//     // and find the (first) entry that matches
//     const layout = gKeyboardLayouts[0] ?? DEFAULT_KEYBOARD_LAYOUT;
//     const index =
//         evt.shiftKey && evt.altKey ? 3 : evt.altKey ? 2 : evt.shiftKey ? 1 : 0;

//     for (const [key, value] of Object.entries(layout.mapping)) {
//         if (key === evt.code && value[index] === evt.key) {
//             return value[0];
//         }
//     }

//     // We did not find a perfect match...
//     // Look for an entry even if the keycode doesn't match...
//     for (const [, value] of Object.entries(layout.mapping)) {
//         if (value[index] === evt.key) {
//             return value[0];
//         }
//     }

//     // Really? Nothing matched?! Just return the key...
//     return evt.key;
// }

export function getCodeForKey(
  k: string,
  layout: KeyboardLayout
): KeystrokeModifiers {
  const result: KeystrokeModifiers = {
    shift: false,
    alt: false,
    cmd: false,
    win: false,
    meta: false,
    ctrl: false,
    key: '',
  };
  if (!k) return result;

  for (const [key, value] of Object.entries(layout.mapping)) {
    if (value![0] === k) {
      result.key = `[${key}]`;
      return result;
    }
    if (value![1] === k) {
      result.shift = true;
      result.key = `[${key}]`;
      return result;
    }
    if (value![2] === k) {
      result.alt = true;
      result.key = `[${key}]`;
      return result;
    }
    if (value![3] === k) {
      result.shift = true;
      result.alt = true;
      result.key = `[${key}]`;
      return result;
    }
  }

  result.key = BASE_LAYOUT_MAPPING[k] ?? '';
  return result;
}

export function normalizeKeyboardEvent(evt: KeyboardEvent): KeyboardEvent {
  if (evt.code) return evt;
  // For virtual keyboards (iOS, Android) and Microsoft Edge (!)
  // the `evt.code`, which represents the physical key pressed, is set
  // to undefined. In that case, map the virtual key ("q") to a
  // pseudo-hardware key ("KeyQ")
  const mapping = Object.entries(getActiveKeyboardLayout().mapping);
  let altKey = false;
  let shiftKey = false;
  let code = '';
  for (let index = 0; index < 4; index++) {
    for (const [key, value] of mapping) {
      if (value![index] === evt.key) {
        code = key;
        if (index === 3) {
          altKey = true;
          shiftKey = true;
        } else if (index === 2) altKey = true;
        else if (index === 1) shiftKey = true;

        break;
      }
    }

    if (code) break;
  }

  return new KeyboardEvent(evt.type, { ...evt, altKey, shiftKey, code });
}

// Given this keyboard event, and the `code`, `key` and modifiers
// in it, increase the score of layouts that do match it.
// Calling repeatedly this function will improve the accuracy of the
// keyboard layout estimate.
export function validateKeyboardLayout(evt?: KeyboardEvent): void {
  if (!evt) return;

  if (evt.key === 'Unidentified') return;

  // Dead keys do not have enough info to validate the keyboard
  // (we don't know what char they could produce, only the physical key associated with them )
  if (evt.key === 'Dead') return;

  const index =
    evt.shiftKey && evt.altKey ? 3 : evt.altKey ? 2 : evt.shiftKey ? 1 : 0;

  for (const layout of gKeyboardLayouts) {
    if (layout.mapping[evt.code]?.[index] === evt.key) {
      // Increase the score of the layouts that have a mapping compatible with
      // this keyboard event.
      layout.score += 1;
    } else if (layout.mapping[evt.code]?.[index]) {
      // There is a mapping, but it's not compatible with this keystroke:
      // zero-out the score
      layout.score = 0;
    }
  }

  gKeyboardLayouts.sort((a, b) => b.score - a.score);
}

export function setKeyboardLayoutLocale(locale: string): void {
  gKeyboardLayout = gKeyboardLayouts.find((x) => locale.startsWith(x.locale));
}

export function setKeyboardLayout(
  name: KeyboardLayoutName | 'auto'
): KeyboardLayout | undefined {
  // If name is 'auto', the layout is not found, and set to undefined
  gKeyboardLayout = gKeyboardLayouts.find((x) => x.id === name);
  return gKeyboardLayout;
}

export function getActiveKeyboardLayout(): KeyboardLayout {
  return gKeyboardLayout ?? gKeyboardLayouts[0];
}

export function getKeyboardLayouts(): KeyboardLayout[] {
  return gKeyboardLayouts;
}

export function getDefaultKeyboardLayout(): KeyboardLayout {
  switch (platform()) {
    case 'apple':
      return APPLE_ENGLISH;
    case 'windows':
      return WINDOWS_ENGLISH;
    case 'linux':
      return LINUX_ENGLISH;
  }
  return APPLE_ENGLISH;
}

switch (platform()) {
  case 'apple':
    register(APPLE_ENGLISH);
    register(APPLE_FRENCH);
    register(APPLE_SPANISH);
    register(APPLE_GERMAN);
    break;
  case 'windows':
    register(WINDOWS_ENGLISH);
    register(WINDOWS_FRENCH);
    register(WINDOWS_SPANISH);
    register(WINDOWS_GERMAN);
    break;
  case 'linux':
    register(LINUX_ENGLISH);
    register(LINUX_FRENCH);
    register(LINUX_SPANISH);
    register(LINUX_GERMAN);
    break;
}

register(DVORAK);
