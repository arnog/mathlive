import type { KeyboardLayoutName as KeyboardLayoutId } from '../public/options';

// From https://www.w3.org/TR/uievents-code/
type Keycode =
  | 'Sleep'
  | 'WakeUp'
  | 'KeyA'
  | 'KeyB'
  | 'KeyC'
  | 'KeyD'
  | 'KeyE'
  | 'KeyF'
  | 'KeyG'
  | 'KeyH'
  | 'KeyI'
  | 'KeyJ'
  | 'KeyK'
  | 'KeyL'
  | 'KeyM'
  | 'KeyN'
  | 'KeyO'
  | 'KeyP'
  | 'KeyQ'
  | 'KeyR'
  | 'KeyS'
  | 'KeyT'
  | 'KeyU'
  | 'KeyV'
  | 'KeyW'
  | 'KeyX'
  | 'KeyY'
  | 'KeyZ'
  | 'Digit1'
  | 'Digit2'
  | 'Digit3'
  | 'Digit4'
  | 'Digit5'
  | 'Digit6'
  | 'Digit7'
  | 'Digit8'
  | 'Digit9'
  | 'Digit0'
  | 'Enter'
  | 'Escape'
  | 'Backspace'
  | 'Tab'
  | 'Space'
  | 'Minus'
  | 'Equal'
  | 'BracketLeft'
  | 'BracketRight'
  | 'Backslash'
  | 'Semicolon'
  | 'Quote'
  | 'Backquote'
  | 'Comma'
  | 'Period'
  | 'Slash'
  | 'CapsLock'
  | 'F1'
  | 'F2'
  | 'F3'
  | 'F4'
  | 'F5'
  | 'F6'
  | 'F7'
  | 'F8'
  | 'F9'
  | 'F10'
  | 'F11'
  | 'F12'
  | 'F13'
  | 'F14'
  | 'F15'
  | 'F16'
  | 'F17'
  | 'F18'
  | 'F19'
  | 'F20'
  | 'F21'
  | 'F22'
  | 'F23'
  | 'F24'
  | 'PrintScreen'
  | 'ScrollLock'
  | 'Pause'
  | 'Insert'
  | 'Home'
  | 'PageUp'
  | 'Delete'
  | 'End'
  | 'PageDown'
  | 'ArrowRight'
  | 'ArrowLeft'
  | 'ArrowDown'
  | 'ArrowUp'
  | 'NumLock'
  | 'Numpad1'
  | 'Numpad2'
  | 'Numpad3'
  | 'Numpad4'
  | 'Numpad5'
  | 'Numpad6'
  | 'Numpad7'
  | 'Numpad8'
  | 'Numpad9'
  | 'Numpad0'
  | 'NumpadDivide'
  | 'NumpadMultiply'
  | 'NumpadSubtract'
  | 'NumpadAdd'
  | 'NumpadEnter'
  | 'NumpadDecimal'
  | 'NumpadEqual'
  | 'NumpadParenLeft'
  | 'NumpadParenRight'
  | 'IntlBackslash'
  | 'ContextMenu'
  | 'Power'
  | 'Help'
  | 'Undo'
  | 'Cut'
  | 'Copy'
  | 'Paste'
  | 'AudioVolumeMute'
  | 'AudioVolumeUp'
  | 'AudioVolumeDown'
  | 'NumpadComma'
  | 'IntlRo'
  | 'KanaMode'
  | 'IntlYen'
  | 'Convert'
  | 'NonConvert'
  | 'Lang1'
  | 'Lang2'
  | 'Lang3'
  | 'Lang4'
  | 'ControlLeft'
  | 'ShiftLeft'
  | 'AltLeft'
  | 'MetaLeft'
  | 'ControlRight'
  | 'ShiftRight'
  | 'AltRight'
  | 'MetaRight'
  | 'MediaTrackNext'
  | 'MediaTrackPrevious'
  | 'MediaStop'
  | 'Eject'
  | 'MediaPlayPause'
  | 'MediaSelect'
  | 'LaunchMail'
  | 'LaunchApp2'
  | 'LaunchApp1'
  | 'BrowserSearch'
  | 'BrowserHome'
  | 'BrowserBack'
  | 'BrowserForward'
  | 'BrowserStop'
  | 'BrowserRefresh'
  | 'BrowserFavorites';

type KeyboardLayout = {
  id: KeyboardLayoutId;
  displayName: string; // Doesn't have to be unique
  virtualLayout: 'qwerty' | 'azerty' | 'qwertz' | 'dvorak' | 'colemak';
  locale: string;
  platform: 'windows' | 'apple' | 'linux' | '';
  score: number;
  mapping: { [K in Keycode]?: [string, string, string, string] };
};

const DEFAULT_KEYBOARD_LAYOUT: KeyboardLayout =
  platform() === 'apple'
    ? {
        id: 'apple.en-intl',
        displayName: 'English (international)',
        virtualLayout: 'qwerty',
        platform: 'apple',
        locale: 'en',
        score: 0,
        mapping: {
          KeyA: ['a', 'A', 'å', 'Å'],
          KeyB: ['b', 'B', '∫', 'ı'],
          KeyC: ['c', 'C', 'ç', 'Ç'],
          KeyD: ['d', 'D', '∂', 'Î'],
          KeyE: ['e', 'E', '´', '´'],
          KeyF: ['f', 'F', 'ƒ', 'Ï'],
          KeyG: ['g', 'G', '©', '˝'],
          KeyH: ['h', 'H', '˙', 'Ó'],
          KeyI: ['i', 'I', 'ˆ', 'ˆ'],
          KeyJ: ['j', 'J', '∆', 'Ô'],
          KeyK: ['k', 'K', '˚', ''],
          KeyL: ['l', 'L', '¬', 'Ò'],
          KeyM: ['m', 'M', 'µ', 'Â'],
          KeyN: ['n', 'N', '˜', '˜'],
          KeyO: ['o', 'O', 'ø', 'Ø'],
          KeyP: ['p', 'P', 'π', '∏'],
          KeyQ: ['q', 'Q', 'œ', 'Œ'],
          KeyR: ['r', 'R', '®', '‰'],
          KeyS: ['s', 'S', 'ß', 'Í'],
          KeyT: ['t', 'T', '†', 'ˇ'],
          KeyU: ['u', 'U', '¨', '¨'],
          KeyV: ['v', 'V', '√', '◊'],
          KeyW: ['w', 'W', '∑', '„'],
          KeyX: ['x', 'X', '≈', '˛'],
          KeyY: ['y', 'Y', '¥', 'Á'],
          KeyZ: ['z', 'Z', 'Ω', '¸'],
          Digit1: ['1', '!', '¡', '⁄'],
          Digit2: ['2', '@', '™', '€'],
          Digit3: ['3', '#', '£', '‹'],
          Digit4: ['4', '$', '¢', '›'],
          Digit5: ['5', '%', '∞', 'ﬁ'],
          Digit6: ['6', 'ˆ', '§', 'ﬂ'],
          Digit7: ['7', '&', '¶', '‡'],
          Digit8: ['8', '*', '•', '°'],
          Digit9: ['9', '(', 'ª', '·'],
          Digit0: ['0', ')', 'º', '‚'],
          Space: [' ', ' ', ' ', ' '],
          Minus: ['-', '_', '–', '—'],
          Equal: ['=', '+', '≠', '±'],
          BracketLeft: ['[', '{', '“', '”'],
          BracketRight: [']', '}', '‘', '’'],
          Backslash: ['\\', '|', '«', '»'],
          Semicolon: [';', ':', '…', 'Ú'],
          Quote: ["'", '"', 'æ', 'Æ'],
          Backquote: ['`', '˜', '`', '`'],
          Comma: [',', '<', '≤', '¯'],
          Period: ['.', '>', '≥', '˘'],
          Slash: ['/', '?', '÷', '¿'],
          NumpadDivide: ['/', '/', '/', '/'],
          NumpadMultiply: ['*', '*', '*', '*'],
          NumpadSubtract: ['-', '-', '-', '-'],
          NumpadAdd: ['+', '+', '+', '+'],
          Numpad1: ['1', '1', '1', '1'],
          Numpad2: ['2', '2', '2', '2'],
          Numpad3: ['3', '3', '3', '3'],
          Numpad4: ['4', '4', '4', '4'],
          Numpad5: ['5', '5', '5', '5'],
          Numpad6: ['6', '6', '6', '6'],
          Numpad7: ['7', '7', '7', '7'],
          Numpad8: ['8', '8', '8', '8'],
          Numpad9: ['9', '9', '9', '9'],
          Numpad0: ['0', '0', '0', '0'],
          NumpadDecimal: ['.', '.', '.', '.'],
          IntlBackslash: ['§', '±', '§', '±'],
          NumpadEqual: ['=', '=', '=', '='],
          AudioVolumeUp: ['', '=', '', '='],
        },
      }
    : platform() === 'windows'
    ? {
        id: 'windows.en-intl',
        displayName: 'English (international)',
        platform: 'windows',
        virtualLayout: 'qwerty',
        locale: 'en',
        score: 0,
        mapping: {
          KeyA: ['a', 'A', 'á', 'Á'],
          KeyB: ['b', 'B', '', ''],
          KeyC: ['c', 'C', '©', '¢'],
          KeyD: ['d', 'D', 'ð', 'Ð'],
          KeyE: ['e', 'E', 'é', 'É'],
          KeyF: ['f', 'F', '', ''],
          KeyG: ['g', 'G', '', ''],
          KeyH: ['h', 'H', '', ''],
          KeyI: ['i', 'I', 'í', 'Í'],
          KeyJ: ['j', 'J', '', ''],
          KeyK: ['k', 'K', '', ''],
          KeyL: ['l', 'L', 'ø', 'Ø'],
          KeyM: ['m', 'M', 'µ', ''],
          KeyN: ['n', 'N', 'ñ', 'Ñ'],
          KeyO: ['o', 'O', 'ó', 'Ó'],
          KeyP: ['p', 'P', 'ö', 'Ö'],
          KeyQ: ['q', 'Q', 'ä', 'Ä'],
          KeyR: ['r', 'R', '®', ''],
          KeyS: ['s', 'S', 'ß', '§'],
          KeyT: ['t', 'T', 'þ', 'Þ'],
          KeyU: ['u', 'U', 'ú', 'Ú'],
          KeyV: ['v', 'V', '', ''],
          KeyW: ['w', 'W', 'å', 'Å'],
          KeyX: ['x', 'X', '', ''],
          KeyY: ['y', 'Y', 'ü', 'Ü'],
          KeyZ: ['z', 'Z', 'æ', 'Æ'],
          Digit1: ['1', '!', '¡', '¹'],
          Digit2: ['2', '@', '²', ''],
          Digit3: ['3', '#', '³', ''],
          Digit4: ['4', '$', '¤', '£'],
          Digit5: ['5', '%', '€', ''],
          Digit6: ['6', '^', '¼', ''],
          Digit7: ['7', '&', '½', ''],
          Digit8: ['8', '*', '¾', ''],
          Digit9: ['9', '(', '‘', ''],
          Digit0: ['0', ')', '’', ''],
          Space: [' ', ' ', '', ''],
          Minus: ['-', '_', '¥', ''],
          Equal: ['=', '+', '×', '÷'],
          BracketLeft: ['[', '{', '«', ''],
          BracketRight: [']', '}', '»', ''],
          Backslash: ['\\', '|', '¬', '¦'],
          Semicolon: [';', ':', '¶', '°'],
          Quote: ["'", '"', '´', '¨'],
          Backquote: ['`', '~', '', ''],
          Comma: [',', '<', 'ç', 'Ç'],
          Period: ['.', '>', '', ''],
          Slash: ['/', '?', '¿', ''],
          NumpadDivide: ['/', '/', '', ''],
          NumpadMultiply: ['*', '*', '', ''],
          NumpadSubtract: ['-', '-', '', ''],
          NumpadAdd: ['+', '+', '', ''],
          IntlBackslash: ['\\', '|', '', ''],
        },
      }
    : {
        id: 'linux.en',
        displayName: 'English',
        platform: 'linux',
        virtualLayout: 'qwerty',
        locale: 'en',
        score: 0,
        mapping: {
          KeyA: ['a', 'A', 'a', 'A'],
          KeyB: ['b', 'B', 'b', 'B'],
          KeyC: ['c', 'C', 'c', 'C'],
          KeyD: ['d', 'D', 'd', 'D'],
          KeyE: ['e', 'E', 'e', 'E'],
          KeyF: ['f', 'F', 'f', 'F'],
          KeyG: ['g', 'G', 'g', 'G'],
          KeyH: ['h', 'H', 'h', 'H'],
          KeyI: ['i', 'I', 'i', 'I'],
          KeyJ: ['j', 'J', 'j', 'J'],
          KeyK: ['k', 'K', 'k', 'K'],
          KeyL: ['l', 'L', 'l', 'L'],
          KeyM: ['m', 'M', 'm', 'M'],
          KeyN: ['n', 'N', 'n', 'N'],
          KeyO: ['o', 'O', 'o', 'O'],
          KeyP: ['p', 'P', 'p', 'P'],
          KeyQ: ['q', 'Q', 'q', 'Q'],
          KeyR: ['r', 'R', 'r', 'R'],
          KeyS: ['s', 'S', 's', 'S'],
          KeyT: ['t', 'T', 't', 'T'],
          KeyU: ['u', 'U', 'u', 'U'],
          KeyV: ['v', 'V', 'v', 'V'],
          KeyW: ['w', 'W', 'w', 'W'],
          KeyX: ['x', 'X', 'x', 'X'],
          KeyY: ['y', 'Y', 'y', 'Y'],
          KeyZ: ['z', 'Z', 'z', 'Z'],
          Digit1: ['1', '!', '1', '!'],
          Digit2: ['2', '@', '2', '@'],
          Digit3: ['3', '#', '3', '#'],
          Digit4: ['4', '$', '4', '$'],
          Digit5: ['5', '%', '5', '%'],
          Digit6: ['6', '^', '6', '^'],
          Digit7: ['7', '&', '7', '&'],
          Digit8: ['8', '*', '8', '*'],
          Digit9: ['9', '(', '9', '('],
          Digit0: ['0', ')', '0', ')'],
          Space: [' ', ' ', ' ', ' '],
          Minus: ['-', '_', '-', '_'],
          Equal: ['=', '+', '=', '+'],
          BracketLeft: ['[', '{', '[', '{'],
          BracketRight: [']', '}', ']', '}'],
          Backslash: ['\\', '|', '\\', '|'],
          Semicolon: [';', ':', ';', ':'],
          Quote: ["'", '"', "'", '"'],
          Backquote: ['`', '~', '`', '~'],
          Comma: [',', '<', ',', '<'],
          Period: ['.', '>', '.', '>'],
          Slash: ['/', '?', '/', '?'],
          NumpadDivide: ['/', '/', '/', '/'],
          NumpadMultiply: ['*', '*', '*', '*'],
          NumpadSubtract: ['-', '-', '-', '-'],
          NumpadAdd: ['+', '+', '+', '+'],
          Numpad1: ['1', '1', '1', '1'],
          Numpad2: ['2', '2', '2', '2'],
          Numpad3: ['3', '3', '3', '3'],
          Numpad4: ['4', '4', '4', '4'],
          Numpad5: ['5', '5', '5', '5'],
          Numpad6: ['6', '6', '6', '6'],
          Numpad7: ['7', '7', '7', '7'],
          Numpad8: ['8', '8', '8', '8'],
          Numpad9: ['9', '9', '9', '9'],
          Numpad0: ['0', '0', '0', '0'],
          NumpadDecimal: ['', '.', '', '.'],
          IntlBackslash: ['<', '>', '|', '¦'],
          NumpadEqual: ['=', '=', '=', '='],
          NumpadComma: ['.', '.', '.', '.'],
          NumpadParenLeft: ['(', '(', '(', '('],
          NumpadParenRight: [')', ')', ')', ')'],
        },
      };

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

let gKeyboardLayout: KeyboardLayout;

export function platform(): 'apple' | 'windows' | 'linux' {
  let result: 'apple' | 'windows' | 'linux' = 'linux';
  if (navigator?.platform && navigator?.userAgent) {
    if (/^(mac)/i.test(navigator.platform)) {
      result = 'apple';
    } else if (/^(win)/i.test(navigator.platform)) {
      result = 'windows';
    } else if (/(android)/i.test(navigator.userAgent)) {
      result = 'linux';
    } else if (
      /(iphone)/i.test(navigator.userAgent) ||
      /(ipod)/i.test(navigator.userAgent) ||
      /(ipad)/i.test(navigator.userAgent)
    ) {
      result = 'apple';
    } else if (/\bcros\b/i.test(navigator.userAgent)) {
      result = 'linux';
    }
  }

  return result;
}

export function register(layout: KeyboardLayout): void {
  if (!layout.platform || layout.platform === platform()) {
    gKeyboardLayouts.push(layout);
  }
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

export function getCodeForKey(k: string): string {
  const layout = getActiveKeyboardLayout() ?? DEFAULT_KEYBOARD_LAYOUT;

  for (const [key, value] of Object.entries(layout.mapping)) {
    if (value[0] === k) return '[' + key + ']';
    if (value[1] === k) return 'shift+[' + key + ']';
    if (value[2] === k) return 'alt+[' + key + ']';
    if (value[3] === k) return 'shift+alt+[' + key + ']';
  }

  return BASE_LAYOUT_MAPPING[k] ?? '';
}

export function normalizeKeyboardEvent(evt: KeyboardEvent): KeyboardEvent {
  if (!evt.code) {
    // For virtual keyboards (iOS, Android) and Microsoft Edge (!)
    // the `evt.code`, which represents the physical key pressed, is set
    // to undefined. In that case, map the virtual key ("q") to a
    // pseudo-hardware key ("KeyQ")
    const mapping = Object.entries(getActiveKeyboardLayout().mapping);
    let altKey = false;
    let shiftKey = false;
    let code: string;
    for (let index = 0; index < 4; index++) {
      for (const [key, value] of mapping) {
        if (value[index] === evt.key) {
          code = key;
          if (index === 3) {
            altKey = true;
            shiftKey = true;
          } else if (index === 2) {
            altKey = true;
          } else if (index === 1) {
            shiftKey = true;
          }

          break;
        }
      }

      if (code) break;
    }

    return new KeyboardEvent(evt.type, { ...evt, altKey, shiftKey, code });
  }

  return new KeyboardEvent(evt.type, evt);
}

// Given this keyboard event, and the `code`, `key` and modifiers
// in it, increase the score of layouts that do match it.
// Calling repeatedly this function will improve the accuracy of the
// keyboard layout estimate.
export function validateKeyboardLayout(evt: KeyboardEvent): void {
  const index =
    evt.shiftKey && evt.altKey ? 3 : evt.altKey ? 2 : evt.shiftKey ? 1 : 0;

  if (evt.key === 'Unidentified') return;

  // Dead keys do not have enough info to validate the keyboard
  // (we dont' know what char they could produce, only the physical key associated with them )
  if (evt.key === 'Dead') return;

  const layouts = gKeyboardLayouts.filter(
    (layout) => layout.mapping[evt.code]?.[index] === evt.key
  );
  if (layouts.length === 0) return;

  // Increase the score of the layouts that have a mapping compatible with this keyboard event.
  layouts.forEach((x) => {
    x.score += 1;
  });
  gKeyboardLayouts.sort((a, b) => b.score - a.score);
}

export function setKeyboardLayoutLocale(locale: string): void {
  gKeyboardLayout = gKeyboardLayouts.find((x) => locale.startsWith(x.locale));
}

export function setKeyboardLayout(
  name: KeyboardLayoutId | 'auto'
): KeyboardLayout {
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

register(DEFAULT_KEYBOARD_LAYOUT);

register({
  id: 'apple.french',
  locale: 'fr',
  displayName: 'French',
  platform: 'apple',
  virtualLayout: 'azerty',
  score: 0,
  mapping: {
    KeyA: ['q', 'Q', '‡', 'Ω'],
    KeyB: ['b', 'B', 'ß', '∫'],
    KeyC: ['c', 'C', '©', '¢'],
    KeyD: ['d', 'D', '∂', '∆'],
    KeyE: ['e', 'E', 'ê', 'Ê'],
    KeyF: ['f', 'F', 'ƒ', '·'],
    KeyG: ['g', 'G', 'ﬁ', 'ﬂ'],
    KeyH: ['h', 'H', 'Ì', 'Î'],
    KeyI: ['i', 'I', 'î', 'ï'],
    KeyJ: ['j', 'J', 'Ï', 'Í'],
    KeyK: ['k', 'K', 'È', 'Ë'],
    KeyL: ['l', 'L', '¬', '|'],
    KeyM: [',', '?', '∞', '¿'],
    KeyN: ['n', 'N', '~', 'ı'],
    KeyO: ['o', 'O', 'œ', 'Œ'],
    KeyP: ['p', 'P', 'π', '∏'],
    KeyQ: ['a', 'A', 'æ', 'Æ'],
    KeyR: ['r', 'R', '®', '‚'],
    KeyS: ['s', 'S', 'Ò', '∑'],
    KeyT: ['t', 'T', '†', '™'],
    KeyU: ['u', 'U', 'º', 'ª'],
    KeyV: ['v', 'V', '◊', '√'],
    KeyW: ['z', 'Z', 'Â', 'Å'],
    KeyX: ['x', 'X', '≈', '⁄'],
    KeyY: ['y', 'Y', 'Ú', 'Ÿ'],
    KeyZ: ['w', 'W', '‹', '›'],
    Digit1: ['&', '1', '', '´'],
    Digit2: ['é', '2', 'ë', '„'],
    Digit3: ['"', '3', '“', '”'],
    Digit4: ["'", '4', '‘', '’'],
    Digit5: ['(', '5', '{', '['],
    Digit6: ['§', '6', '¶', 'å'],
    Digit7: ['è', '7', '«', '»'],
    Digit8: ['!', '8', '¡', 'Û'],
    Digit9: ['ç', '9', 'Ç', 'Á'],
    Digit0: ['à', '0', 'ø', 'Ø'],
    Space: [' ', ' ', ' ', ' '],
    Minus: [')', '°', '}', ']'],
    Equal: ['-', '_', '—', '–'],
    BracketLeft: ['^', '¨', 'ô', 'Ô'],
    BracketRight: ['$', '*', '€', '¥'],
    Backslash: ['`', '£', '@', '#'],
    Semicolon: ['m', 'M', 'µ', 'Ó'],
    Quote: ['ù', '%', 'Ù', '‰'],
    Backquote: ['<', '>', '≤', '≥'],
    Comma: [';', '.', '…', '•'],
    Period: [':', '/', '÷', '\\'],
    Slash: ['=', '+', '≠', '±'],
    NumpadDivide: ['/', '/', '/', '/'],
    NumpadMultiply: ['*', '*', '*', '*'],
    NumpadSubtract: ['-', '-', '-', '-'],
    NumpadAdd: ['+', '+', '+', '+'],
    NumpadDecimal: [',', '.', ',', '.'],
    IntlBackslash: ['@', '#', '•', 'Ÿ'],
    NumpadEqual: ['=', '=', '=', '='],
  },
});

register({
  id: 'apple.spanish',
  locale: 'es',
  displayName: 'Spanish ISO',
  platform: 'apple',
  virtualLayout: 'qwerty',
  score: 0,
  mapping: {
    KeyA: ['a', 'A', 'å', 'Å'],
    KeyB: ['b', 'B', 'ß', ''],
    KeyC: ['c', 'C', '©', ' '],
    KeyD: ['d', 'D', '∂', '∆'],
    KeyE: ['e', 'E', '€', '€'],
    KeyF: ['f', 'F', 'ƒ', 'ﬁ'],
    KeyG: ['g', 'G', '', 'ﬂ'],
    KeyH: ['h', 'H', '™', ' '],
    KeyI: ['i', 'I', ' ', ' '],
    KeyJ: ['j', 'J', '¶', '¯'],
    KeyK: ['k', 'K', '§', 'ˇ'],
    KeyL: ['l', 'L', ' ', '˘'],
    KeyM: ['m', 'M', 'µ', '˚'],
    KeyN: ['n', 'N', ' ', '˙'],
    KeyO: ['o', 'O', 'ø', 'Ø'],
    KeyP: ['p', 'P', 'π', '∏'],
    KeyQ: ['q', 'Q', 'œ', 'Œ'],
    KeyR: ['r', 'R', '®', ' '],
    KeyS: ['s', 'S', '∫', ' '],
    KeyT: ['t', 'T', '†', '‡'],
    KeyU: ['u', 'U', ' ', ' '],
    KeyV: ['v', 'V', '√', '◊'],
    KeyW: ['w', 'W', 'æ', 'Æ'],
    KeyX: ['x', 'X', '∑', '›'],
    KeyY: ['y', 'Y', '¥', ' '],
    KeyZ: ['z', 'Z', 'Ω', '‹'],
    Digit1: ['1', '!', '|', 'ı'],
    Digit2: ['2', '"', '@', '˝'],
    Digit3: ['3', '·', '#', '•'],
    Digit4: ['4', '$', '¢', '£'],
    Digit5: ['5', '%', '∞', '‰'],
    Digit6: ['6', '&', '¬', ' '],
    Digit7: ['7', '/', '÷', '⁄'],
    Digit8: ['8', '(', '“', '‘'],
    Digit9: ['9', ')', '”', '’'],
    Digit0: ['0', '=', '≠', '≈'],
    Space: [' ', ' ', ' ', ' '],
    Minus: ["'", '?', '´', '¸'],
    Equal: ['¡', '¿', '‚', '˛'],
    BracketLeft: ['`', '^', '[', 'ˆ'],
    BracketRight: ['+', '*', ']', '±'],
    Backslash: ['ç', 'Ç', '}', '»'],
    Semicolon: ['ñ', 'Ñ', '~', '˜'],
    Quote: ['´', '¨', '{', '«'],
    Backquote: ['<', '>', '≤', '≥'],
    Comma: [',', ';', '„', ''],
    Period: ['.', ':', '…', '…'],
    Slash: ['-', '_', '–', '—'],
    NumpadDivide: ['/', '/', '/', '/'],
    NumpadMultiply: ['*', '*', '*', '*'],
    NumpadSubtract: ['-', '-', '-', '-'],
    NumpadAdd: ['+', '+', '+', '+'],
    Numpad1: ['1', '1', '1', '1'],
    Numpad2: ['2', '2', '2', '2'],
    Numpad3: ['3', '3', '3', '3'],
    Numpad4: ['4', '4', '4', '4'],
    Numpad5: ['5', '5', '5', '5'],
    Numpad6: ['6', '6', '6', '6'],
    Numpad7: ['7', '7', '7', '7'],
    Numpad8: ['8', '8', '8', '8'],
    Numpad9: ['9', '9', '9', '9'],
    Numpad0: ['0', '0', '0', '0'],
    NumpadDecimal: [',', ',', ',', ','],
    IntlBackslash: ['º', 'ª', '\\', '°'],
  },
});

register({
  id: 'windows.spanish',
  locale: 'es',
  displayName: 'Spanish',
  platform: 'windows',
  virtualLayout: 'qwerty',
  score: 0,
  mapping: {
    KeyA: ['a', 'A', '', ''],
    KeyB: ['b', 'B', '', ''],
    KeyC: ['c', 'C', '', ''],
    KeyD: ['d', 'D', '', ''],
    KeyE: ['e', 'E', '€', ''],
    KeyF: ['f', 'F', '', ''],
    KeyG: ['g', 'G', '', ''],
    KeyH: ['h', 'H', '', ''],
    KeyI: ['i', 'I', '', ''],
    KeyJ: ['j', 'J', '', ''],
    KeyK: ['k', 'K', '', ''],
    KeyL: ['l', 'L', '', ''],
    KeyM: ['m', 'M', '', ''],
    KeyN: ['n', 'N', '', ''],
    KeyO: ['o', 'O', '', ''],
    KeyP: ['p', 'P', '', ''],
    KeyQ: ['q', 'Q', '', ''],
    KeyR: ['r', 'R', '', ''],
    KeyS: ['s', 'S', '', ''],
    KeyT: ['t', 'T', '', ''],
    KeyU: ['u', 'U', '', ''],
    KeyV: ['v', 'V', '', ''],
    KeyW: ['w', 'W', '', ''],
    KeyX: ['x', 'X', '', ''],
    KeyY: ['y', 'Y', '', ''],
    KeyZ: ['z', 'Z', '', ''],
    Digit1: ['1', '!', '|', ''],
    Digit2: ['2', '"', '@', ''],
    Digit3: ['3', '·', '#', ''],
    Digit4: ['4', '$', '~', ''],
    Digit5: ['5', '%', '€', ''],
    Digit6: ['6', '&', '¬', ''],
    Digit7: ['7', '/', '', ''],
    Digit8: ['8', '(', '', ''],
    Digit9: ['9', ')', '', ''],
    Digit0: ['0', '=', '', ''],
    Space: [' ', ' ', '', ''],
    Minus: ["'", '?', '', ''],
    Equal: ['¡', '¿', '', ''],
    BracketLeft: ['`', '^', '[', ''],
    BracketRight: ['+', '*', ']', ''],
    Backslash: ['ç', 'Ç', '}', ''],
    Semicolon: ['ñ', 'Ñ', '', ''],
    Quote: ['´', '¨', '{', ''],
    Backquote: ['º', 'ª', '\\', ''],
    Comma: [',', ';', '', ''],
    Period: ['.', ':', '', ''],
    Slash: ['-', '_', '', ''],
    NumpadDivide: ['/', '/', '', ''],
    NumpadMultiply: ['*', '*', '', ''],
    NumpadSubtract: ['-', '-', '', ''],
    NumpadAdd: ['+', '+', '', ''],
    IntlBackslash: ['<', '>', '', ''],
  },
});

register({
  id: 'linux.spanish',
  locale: 'es',
  displayName: 'Spanish',
  platform: 'linux',
  virtualLayout: 'qwerty',
  score: 0,
  mapping: {
    KeyA: ['a', 'A', 'æ', 'Æ'],
    KeyB: ['b', 'B', '”', '’'],
    KeyC: ['c', 'C', '¢', '©'],
    KeyD: ['d', 'D', 'ð', 'Ð'],
    KeyE: ['e', 'E', '€', '¢'],
    KeyF: ['f', 'F', 'đ', 'ª'],
    KeyG: ['g', 'G', 'ŋ', 'Ŋ'],
    KeyH: ['h', 'H', 'ħ', 'Ħ'],
    KeyI: ['i', 'I', '→', 'ı'],
    KeyJ: ['j', 'J', '̉', '̛'],
    KeyK: ['k', 'K', 'ĸ', '&'],
    KeyL: ['l', 'L', 'ł', 'Ł'],
    KeyM: ['m', 'M', 'µ', 'º'],
    KeyN: ['n', 'N', 'n', 'N'],
    KeyO: ['o', 'O', 'ø', 'Ø'],
    KeyP: ['p', 'P', 'þ', 'Þ'],
    KeyQ: ['q', 'Q', '@', 'Ω'],
    KeyR: ['r', 'R', '¶', '®'],
    KeyS: ['s', 'S', 'ß', '§'],
    KeyT: ['t', 'T', 'ŧ', 'Ŧ'],
    KeyU: ['u', 'U', '↓', '↑'],
    KeyV: ['v', 'V', '“', '‘'],
    KeyW: ['w', 'W', 'ł', 'Ł'],
    KeyX: ['x', 'X', '»', '>'],
    KeyY: ['y', 'Y', '←', '¥'],
    KeyZ: ['z', 'Z', '«', '<'],
    Digit1: ['1', '!', '|', '¡'],
    Digit2: ['2', '"', '@', '⅛'],
    Digit3: ['3', '·', '#', '£'],
    Digit4: ['4', '$', '~', '$'],
    Digit5: ['5', '%', '½', '⅜'],
    Digit6: ['6', '&', '¬', '⅝'],
    Digit7: ['7', '/', '{', '⅞'],
    Digit8: ['8', '(', '[', '™'],
    Digit9: ['9', ')', ']', '±'],
    Digit0: ['0', '=', '}', '°'],
    Enter: ['\r', '\r', '\r', '\r'],
    Escape: ['\u001B', '\u001B', '\u001B', '\u001B'],
    Backspace: ['\b', '\b', '\b', '\b'],
    Tab: ['\t', '', '\t', ''],
    Space: [' ', ' ', ' ', ' '],
    Minus: ["'", '?', '\\', '¿'],
    Equal: ['¡', '¿', '̃', '~'],
    BracketLeft: ['̀', '̂', '[', '̊'],
    BracketRight: ['+', '*', ']', '̄'],
    Backslash: ['ç', 'Ç', '}', '̆'],
    Semicolon: ['ñ', 'Ñ', '~', '̋'],
    Quote: ['́', '̈', '{', '{'],
    Backquote: ['º', 'ª', '\\', '\\'],
    Comma: [',', ';', '─', '×'],
    Period: ['.', ':', '·', '÷'],
    Slash: ['-', '_', '̣', '̇'],
    NumpadDivide: ['/', '/', '/', '/'],
    NumpadMultiply: ['*', '*', '*', '*'],
    NumpadSubtract: ['-', '-', '-', '-'],
    NumpadAdd: ['+', '+', '+', '+'],
    NumpadEnter: ['\r', '\r', '\r', '\r'],
    Numpad1: ['', '1', '', '1'],
    Numpad2: ['', '2', '', '2'],
    Numpad3: ['', '3', '', '3'],
    Numpad4: ['', '4', '', '4'],
    Numpad5: ['', '5', '', '5'],
    Numpad6: ['', '6', '', '6'],
    Numpad7: ['', '7', '', '7'],
    Numpad8: ['', '8', '', '8'],
    Numpad9: ['', '9', '', '9'],
    Numpad0: ['', '0', '', '0'],
    NumpadDecimal: ['', '.', '', '.'],
    IntlBackslash: ['<', '>', '|', '¦'],
    NumpadEqual: ['=', '=', '=', '='],
    NumpadComma: ['.', '.', '.', '.'],
    NumpadParenLeft: ['(', '(', '(', '('],
    NumpadParenRight: [')', ')', ')', ')'],
  },
});

register({
  id: 'linux.french',
  locale: 'fr',
  displayName: 'French',
  virtualLayout: 'azerty',
  platform: 'apple',
  score: 0,
  mapping: {
    KeyA: ['q', 'Q', '@', 'Ω'],
    KeyB: ['b', 'B', '”', '’'],
    KeyC: ['c', 'C', '¢', '©'],
    KeyD: ['d', 'D', 'ð', 'Ð'],
    KeyE: ['e', 'E', '€', '¢'],
    KeyF: ['f', 'F', 'đ', 'ª'],
    KeyG: ['g', 'G', 'ŋ', 'Ŋ'],
    KeyH: ['h', 'H', 'ħ', 'Ħ'],
    KeyI: ['i', 'I', '→', 'ı'],
    KeyJ: ['j', 'J', '̉', '̛'],
    KeyK: ['k', 'K', 'ĸ', '&'],
    KeyL: ['l', 'L', 'ł', 'Ł'],
    KeyM: [',', '?', '́', '̋'],
    KeyN: ['n', 'N', 'n', 'N'],
    KeyO: ['o', 'O', 'ø', 'Ø'],
    KeyP: ['p', 'P', 'þ', 'Þ'],
    KeyQ: ['a', 'A', 'æ', 'Æ'],
    KeyR: ['r', 'R', '¶', '®'],
    KeyS: ['s', 'S', 'ß', '§'],
    KeyT: ['t', 'T', 'ŧ', 'Ŧ'],
    KeyU: ['u', 'U', '↓', '↑'],
    KeyV: ['v', 'V', '“', '‘'],
    KeyW: ['z', 'Z', '«', '<'],
    KeyX: ['x', 'X', '»', '>'],
    KeyY: ['y', 'Y', '←', '¥'],
    KeyZ: ['w', 'W', 'ł', 'Ł'],
    Digit1: ['&', '1', '¹', '¡'],
    Digit2: ['é', '2', '~', '⅛'],
    Digit3: ['"', '3', '#', '£'],
    Digit4: ["'", '4', '{', '$'],
    Digit5: ['(', '5', '[', '⅜'],
    Digit6: ['-', '6', '|', '⅝'],
    Digit7: ['è', '7', '`', '⅞'],
    Digit8: ['_', '8', '\\', '™'],
    Digit9: ['ç', '9', '^', '±'],
    Digit0: ['à', '0', '@', '°'],
    Enter: ['\r', '\r', '\r', '\r'],
    Escape: ['\u001B', '\u001B', '\u001B', '\u001B'],
    Backspace: ['\b', '\b', '\b', '\b'],
    Tab: ['\t', '', '\t', ''],
    Space: [' ', ' ', ' ', ' '],
    Minus: [')', '°', ']', '¿'],
    Equal: ['=', '+', '}', '̨'],
    BracketLeft: ['̂', '̈', '̈', '̊'],
    BracketRight: ['$', '£', '¤', '̄'],
    Backslash: ['*', 'µ', '̀', '̆'],
    Semicolon: ['m', 'M', 'µ', 'º'],
    Quote: ['ù', '%', '̂', '̌'],
    Backquote: ['²', '~', '¬', '¬'],
    Comma: [';', '.', '─', '×'],
    Period: [':', '/', '·', '÷'],
    Slash: ['!', '§', '̣', '̇'],
    NumpadMultiply: ['*', '*', '*', '*'],
    NumpadSubtract: ['-', '-', '-', '-'],
    NumpadAdd: ['+', '+', '+', '+'],
    NumpadDecimal: ['', '.', '', '.'],
    IntlBackslash: ['<', '>', '|', '¦'],
  },
});

register({
  id: 'windows.french',
  locale: 'fr',
  displayName: 'French',
  virtualLayout: 'azerty',
  platform: 'windows',
  score: 0,
  mapping: {
    KeyA: ['q', 'Q', '', ''],
    KeyB: ['b', 'B', '', ''],
    KeyC: ['c', 'C', '', ''],
    KeyD: ['d', 'D', '', ''],
    KeyE: ['e', 'E', '€', ''],
    KeyF: ['f', 'F', '', ''],
    KeyG: ['g', 'G', '', ''],
    KeyH: ['h', 'H', '', ''],
    KeyI: ['i', 'I', '', ''],
    KeyJ: ['j', 'J', '', ''],
    KeyK: ['k', 'K', '', ''],
    KeyL: ['l', 'L', '', ''],
    KeyM: [',', '?', '', ''],
    KeyN: ['n', 'N', '', ''],
    KeyO: ['o', 'O', '', ''],
    KeyP: ['p', 'P', '', ''],
    KeyQ: ['a', 'A', '', ''],
    KeyR: ['r', 'R', '', ''],
    KeyS: ['s', 'S', '', ''],
    KeyT: ['t', 'T', '', ''],
    KeyU: ['u', 'U', '', ''],
    KeyV: ['v', 'V', '', ''],
    KeyW: ['z', 'Z', '', ''],
    KeyX: ['x', 'X', '', ''],
    KeyY: ['y', 'Y', '', ''],
    KeyZ: ['w', 'W', '', ''],
    Digit1: ['&', '1', '', ''],
    Digit2: ['é', '2', '~', ''],
    Digit3: ['"', '3', '#', ''],
    Digit4: ["'", '4', '{', ''],
    Digit5: ['(', '5', '[', ''],
    Digit6: ['-', '6', '|', ''],
    Digit7: ['è', '7', '`', ''],
    Digit8: ['_', '8', '\\', ''],
    Digit9: ['ç', '9', '^', ''],
    Digit0: ['à', '0', '@', ''],
    Space: [' ', ' ', '', ''],
    Minus: [')', '°', ']', ''],
    Equal: ['=', '+', '}', ''],
    BracketLeft: ['^', '¨', '', ''],
    BracketRight: ['$', '£', '¤', ''],
    Backslash: ['*', 'µ', '', ''],
    Semicolon: ['m', 'M', '', ''],
    Quote: ['ù', '%', '', ''],
    Backquote: ['²', '', '', ''],
    Comma: [';', '.', '', ''],
    Period: [':', '/', '', ''],
    Slash: ['!', '§', '', ''],
    NumpadDivide: ['/', '/', '', ''],
    NumpadMultiply: ['*', '*', '', ''],
    NumpadSubtract: ['-', '-', '', ''],
    NumpadAdd: ['+', '+', '', ''],
    IntlBackslash: ['<', '>', '', ''],
  },
});

register({
  id: 'windows.german',
  locale: 'de',
  displayName: 'German',
  platform: 'windows',
  virtualLayout: 'qwertz',
  score: 0,
  mapping: {
    KeyA: ['a', 'A', '', ''],
    KeyB: ['b', 'B', '', ''],
    KeyC: ['c', 'C', '', ''],
    KeyD: ['d', 'D', '', ''],
    KeyE: ['e', 'E', '€', ''],
    KeyF: ['f', 'F', '', ''],
    KeyG: ['g', 'G', '', ''],
    KeyH: ['h', 'H', '', ''],
    KeyI: ['i', 'I', '', ''],
    KeyJ: ['j', 'J', '', ''],
    KeyK: ['k', 'K', '', ''],
    KeyL: ['l', 'L', '', ''],
    KeyM: ['m', 'M', 'µ', ''],
    KeyN: ['n', 'N', '', ''],
    KeyO: ['o', 'O', '', ''],
    KeyP: ['p', 'P', '', ''],
    KeyQ: ['q', 'Q', '@', ''],
    KeyR: ['r', 'R', '', ''],
    KeyS: ['s', 'S', '', ''],
    KeyT: ['t', 'T', '', ''],
    KeyU: ['u', 'U', '', ''],
    KeyV: ['v', 'V', '', ''],
    KeyW: ['w', 'W', '', ''],
    KeyX: ['x', 'X', '', ''],
    KeyY: ['z', 'Z', '', ''],
    KeyZ: ['y', 'Y', '', ''],
    Digit1: ['1', '!', '', ''],
    Digit2: ['2', '"', '²', ''],
    Digit3: ['3', '§', '³', ''],
    Digit4: ['4', '$', '', ''],
    Digit5: ['5', '%', '', ''],
    Digit6: ['6', '&', '', ''],
    Digit7: ['7', '/', '{', ''],
    Digit8: ['8', '(', '[', ''],
    Digit9: ['9', ')', ']', ''],
    Digit0: ['0', '=', '}', ''],
    Space: [' ', ' ', '', ''],
    Minus: ['ß', '?', '\\', 'ẞ'],
    Equal: ['´', '`', '', ''],
    BracketLeft: ['ü', 'Ü', '', ''],
    BracketRight: ['+', '*', '~', ''],
    Backslash: ['#', "'", '', ''],
    Semicolon: ['ö', 'Ö', '', ''],
    Quote: ['ä', 'Ä', '', ''],
    Backquote: ['^', '°', '', ''],
    Comma: [',', ';', '', ''],
    Period: ['.', ':', '', ''],
    Slash: ['-', '_', '', ''],
    NumpadDivide: ['/', '/', '', ''],
    NumpadMultiply: ['*', '*', '', ''],
    NumpadSubtract: ['-', '-', '', ''],
    NumpadAdd: ['+', '+', '', ''],
    IntlBackslash: ['<', '>', '|', ''],
  },
});

register({
  id: 'apple.german',
  locale: 'de',
  displayName: 'German',
  virtualLayout: 'qwertz',
  platform: 'apple',
  score: 0,
  mapping: {
    KeyA: ['a', 'A', 'å', 'Å'],
    KeyB: ['b', 'B', '∫', '‹'],
    KeyC: ['c', 'C', 'ç', 'Ç'],
    KeyD: ['d', 'D', '∂', '™'],
    KeyE: ['e', 'E', '€', '‰'],
    KeyF: ['f', 'F', 'ƒ', 'Ï'],
    KeyG: ['g', 'G', '©', 'Ì'],
    KeyH: ['h', 'H', 'ª', 'Ó'],
    KeyI: ['i', 'I', '⁄', 'Û'],
    KeyJ: ['j', 'J', 'º', 'ı'],
    KeyK: ['k', 'K', '∆', 'ˆ'],
    KeyL: ['l', 'L', '@', 'ﬂ'],
    KeyM: ['m', 'M', 'µ', '˘'],
    KeyN: ['n', 'N', '~', '›'],
    KeyO: ['o', 'O', 'ø', 'Ø'],
    KeyP: ['p', 'P', 'π', '∏'],
    KeyQ: ['q', 'Q', '«', '»'],
    KeyR: ['r', 'R', '®', '¸'],
    KeyS: ['s', 'S', '‚', 'Í'],
    KeyT: ['t', 'T', '†', '˝'],
    KeyU: ['u', 'U', '¨', 'Á'],
    KeyV: ['v', 'V', '√', '◊'],
    KeyW: ['w', 'W', '∑', '„'],
    KeyX: ['x', 'X', '≈', 'Ù'],
    KeyY: ['z', 'Z', 'Ω', 'ˇ'],
    KeyZ: ['y', 'Y', '¥', '‡'],
    Digit1: ['1', '!', '¡', '¬'],
    Digit2: ['2', '"', '“', '”'],
    Digit3: ['3', '§', '¶', '#'],
    Digit4: ['4', '$', '¢', '£'],
    Digit5: ['5', '%', '[', 'ﬁ'],
    Digit6: ['6', '&', ']', '^'],
    Digit7: ['7', '/', '|', '\\'],
    Digit8: ['8', '(', '{', '˜'],
    Digit9: ['9', ')', '}', '·'],
    Digit0: ['0', '=', '≠', '¯'],
    Space: [' ', ' ', ' ', ' '],
    Minus: ['ß', '?', '¿', '˙'],
    Equal: ['´', '`', "'", '˚'],
    BracketLeft: ['ü', 'Ü', '•', '°'],
    BracketRight: ['+', '*', '±', ''],
    Backslash: ['#', "'", '‘', '’'],
    Semicolon: ['ö', 'Ö', 'œ', 'Œ'],
    Quote: ['ä', 'Ä', 'æ', 'Æ'],
    Backquote: ['<', '>', '≤', '≥'],
    Comma: [',', ';', '∞', '˛'],
    Period: ['.', ':', '…', '÷'],
    Slash: ['-', '_', '–', '—'],
    NumpadDivide: ['/', '/', '/', '/'],
    NumpadMultiply: ['*', '*', '*', '*'],
    NumpadSubtract: ['-', '-', '-', '-'],
    NumpadAdd: ['+', '+', '+', '+'],
    NumpadDecimal: [',', ',', '.', '.'],
    IntlBackslash: ['^', '°', '„', '“'],
    NumpadEqual: ['=', '=', '=', '='],
  },
});

register({
  id: 'dvorak',
  locale: 'en',
  displayName: 'Dvorak',
  virtualLayout: 'dvorak',
  platform: '',
  score: 0,
  mapping: {
    KeyA: ['a', 'A', 'å', 'Å'],
    KeyB: ['x', 'X', '≈', '˛'],
    KeyC: ['j', 'J', '∆', 'Ô'],
    KeyD: ['e', 'E', '´', '´'],
    KeyE: ['.', '>', '≥', '˘'],
    KeyF: ['u', 'U', '¨', '¨'],
    KeyG: ['i', 'I', 'ˆ', 'ˆ'],
    KeyH: ['d', 'D', '∂', 'Î'],
    KeyI: ['c', 'C', 'ç', 'Ç'],
    KeyJ: ['h', 'H', '˙', 'Ó'],
    KeyK: ['t', 'T', '†', 'ˇ'],
    KeyL: ['n', 'N', '˜', '˜'],
    KeyM: ['m', 'M', 'µ', 'Â'],
    KeyN: ['b', 'B', '∫', 'ı'],
    KeyO: ['r', 'R', '®', '‰'],
    KeyP: ['l', 'L', '¬', 'Ò'],
    KeyQ: ["'", '"', 'æ', 'Æ'],
    KeyR: ['p', 'P', 'π', '∏'],
    KeyS: ['o', 'O', 'ø', 'Ø'],
    KeyT: ['y', 'Y', '¥', 'Á'],
    KeyU: ['g', 'G', '©', '˝'],
    KeyV: ['k', 'K', '˚', ''],
    KeyW: [',', '<', '≤', '¯'],
    KeyX: ['q', 'Q', 'œ', 'Œ'],
    KeyY: ['f', 'F', 'ƒ', 'Ï'],
    KeyZ: [';', ':', '…', 'Ú'],
    Digit1: ['1', '!', '¡', '⁄'],
    Digit2: ['2', '@', '™', '€'],
    Digit3: ['3', '#', '£', '‹'],
    Digit4: ['4', '$', '¢', '›'],
    Digit5: ['5', '%', '∞', 'ﬁ'],
    Digit6: ['6', '^', '§', 'ﬂ'],
    Digit7: ['7', '&', '¶', '‡'],
    Digit8: ['8', '*', '•', '°'],
    Digit9: ['9', '(', 'ª', '·'],
    Digit0: ['0', ')', 'º', '‚'],
    Space: [' ', ' ', ' ', ' '],
    Minus: ['[', '{', '“', '”'],
    Equal: [']', '}', '‘', '’'],
    BracketLeft: ['/', '?', '÷', '¿'],
    BracketRight: ['=', '+', '≠', '±'],
    Backslash: ['\\', '|', '«', '»'],
    Semicolon: ['s', 'S', 'ß', 'Í'],
    Quote: ['-', '_', '–', '—'],
    Backquote: ['`', '~', '`', '`'],
    Comma: ['w', 'W', '∑', '„'],
    Period: ['v', 'V', '√', '◊'],
    Slash: ['z', 'Z', 'Ω', '¸'],
    NumpadDivide: ['/', '/', '/', '/'],
    NumpadMultiply: ['*', '*', '*', '*'],
    NumpadSubtract: ['-', '-', '-', '-'],
    NumpadAdd: ['+', '+', '+', '+'],
    Numpad1: ['1', '1', '1', '1'],
    Numpad2: ['2', '2', '2', '2'],
    Numpad3: ['3', '3', '3', '3'],
    Numpad4: ['4', '4', '4', '4'],
    Numpad5: ['5', '5', '5', '5'],
    Numpad6: ['6', '6', '6', '6'],
    Numpad7: ['7', '7', '7', '7'],
    Numpad8: ['8', '8', '8', '8'],
    Numpad9: ['9', '9', '9', '9'],
    Numpad0: ['0', '0', '0', '0'],
    NumpadDecimal: ['.', '.', '.', '.'],
    IntlBackslash: ['§', '±', '§', '±'],
    NumpadEqual: ['=', '=', '=', '='],
    AudioVolumeUp: ['', '=', '', '='],
  },
});
