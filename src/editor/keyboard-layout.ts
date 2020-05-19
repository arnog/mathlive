import type { KeyboardLayoutName as KeyboardLayoutId } from '../public/config';

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
    locale: string;
    platform: 'windows' | 'apple' | 'linux';
    score: number;
    mapping: { [K in Keycode]?: [string, string, string, string] };
};

const DEFAULT_KEYBOARD_LAYOUT: KeyboardLayout =
    platform() === 'apple'
        ? {
              id: 'apple.en-intl',
              displayName: 'English (international)',
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
    let result: 'apple' | 'windows' | 'linux';
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
        } else if (/\bCrOS\b/i.test(navigator.userAgent)) {
            result = 'linux';
        }
    }

    return result;
}

export function register(layout: KeyboardLayout) {
    if (layout.platform === platform()) {
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
    const layout = gKeyboardLayouts[0] ?? DEFAULT_KEYBOARD_LAYOUT;

    for (const [key, value] of Object.entries(layout.mapping)) {
        if (value[0] === k) return '[' + key + ']';
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
