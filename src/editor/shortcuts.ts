import { isArray } from '../common/types';

import { LETTER } from '../core/definitions';
import { MathfieldConfigPrivate, InlineShortcutDefinition } from './config';
import { ParseMode } from '../public/core';
import { Atom } from '../core/Atom';
import { INLINE_SHORTCUTS } from './shortcuts-definitions-inline';
import {
    KEYBOARD_SHORTCUTS,
    REVERSE_KEYBOARD_SHORTCUTS,
} from './shortcuts-definitions-keyboard';
export { InlineShortcutDefinition };

/**
 * Return an array of potential shortcuts
 */
export function getInlineShortcutsStartingWith(
    s: string,
    config: MathfieldConfigPrivate
): string[] {
    const result = [];

    const skipDefaultShortcuts = config.overrideDefaultInlineShortcuts;

    for (let i = 0; i <= s.length - 1; i++) {
        const s2 = s.substring(i);
        if (!skipDefaultShortcuts) {
            Object.keys(INLINE_SHORTCUTS).forEach((key) => {
                if (key.startsWith(s2) && !result.includes(key)) {
                    result.push(key);
                }
            });
        }

        const customInlineShortcuts = config?.inlineShortcuts
            ? config.inlineShortcuts
            : null;
        if (customInlineShortcuts) {
            Object.keys(customInlineShortcuts).forEach((key) => {
                if (key.startsWith(s2)) {
                    result.push(key);
                }
            });
        }
    }
    return result;
}

/**
 *
 * @param siblings atoms preceding this potential shortcut
 */
function validateShortcut(
    mode: ParseMode,
    siblings: Atom[],
    shortcut: InlineShortcutDefinition
): string {
    if (!shortcut) return '';

    // If it's a simple shortcut (no conditional), it's always valid
    if (typeof shortcut === 'string') return shortcut;

    if (shortcut.mode !== mode) {
        return '';
    }

    // If we have no context, we assume all the shortcuts are valid
    if (!siblings) return shortcut.value;

    let nothing = false;
    let letter = false;
    let digit = false;
    let isFunction = false;
    let frac = false;
    let surd = false;
    let binop = false;
    let relop = false;
    let punct = false;
    let array = false;
    let openfence = false;
    let closefence = false;
    let text = false;
    let space = false;
    let sibling = siblings[siblings.length - 1];
    let index = siblings.length - 1;
    while (sibling && /msubsup|placeholder/.test(sibling.type)) {
        index -= 1;
        sibling = siblings[index];
    }
    nothing = !sibling || sibling.type === 'first'; // start of a group
    if (sibling) {
        text = sibling.mode === 'text';
        letter =
            !text &&
            sibling.type === 'mord' &&
            LETTER.test(sibling.body as string);
        digit =
            !text &&
            sibling.type === 'mord' &&
            /[0-9]+$/.test(sibling.body as string);
        isFunction = !text && sibling.isFunction;
        frac = sibling.type === 'genfrac';
        surd = sibling.type === 'surd';
        binop = sibling.type === 'mbin';
        relop = sibling.type === 'mrel';
        punct = sibling.type === 'mpunct' || sibling.type === 'minner';
        array = !!sibling.array;
        openfence = sibling.type === 'mopen';
        closefence = sibling.type === 'mclose' || sibling.type === 'leftright';
        space = sibling.type === 'space';
    }

    if (typeof shortcut.after !== 'undefined') {
        // If this is a conditional shortcut, consider the conditions now
        if (
            (/nothing/.test(shortcut.after) && nothing) ||
            (/letter/.test(shortcut.after) && letter) ||
            (/digit/.test(shortcut.after) && digit) ||
            (/function/.test(shortcut.after) && isFunction) ||
            (/frac/.test(shortcut.after) && frac) ||
            (/surd/.test(shortcut.after) && surd) ||
            (/binop/.test(shortcut.after) && binop) ||
            (/relop/.test(shortcut.after) && relop) ||
            (/punct/.test(shortcut.after) && punct) ||
            (/array/.test(shortcut.after) && array) ||
            (/openfence/.test(shortcut.after) && openfence) ||
            (/closefence/.test(shortcut.after) && closefence) ||
            (/text/.test(shortcut.after) && text) ||
            (/space/.test(shortcut.after) && space)
        ) {
            return shortcut.value;
        }
        return '';
    }

    return shortcut.value;
}

/**
 *
 * @param context - atoms preceding the candidate, potentially used
 * to reduce which shortcuts are applicable. If 'null', no restrictions are
 * applied.
 * @param s - candidate inline shortcuts (e.g. `'pi'`)
 * @return A replacement string matching the shortcut (e.g. `'\pi'`)
 */
export function getInlineShortcut(
    mode: ParseMode,
    context: Atom[],
    s: string,
    shortcuts?: { [key: string]: InlineShortcutDefinition }
): string {
    return validateShortcut(
        mode,
        context,
        shortcuts?.[s] ?? INLINE_SHORTCUTS[s]
    );
}

/**
 * Return `p`, the platform name if `p` is the current platform, otherwise
 * return `!p`. For example, when running on Windows, `platform('mac')` returns
 * `'!mac'`.
 * The valid values for `p` are:
 * - `'mac'`
 * - `'win'`
 * - `'android`'
 * - `'ios'`
 * - `'chromeos'`
 * - `'other'` (Linux, etc...)
 * @param {string} p The platform to test against.
 * @return {string} if we are running on the candidate platform, return it.
 * Otherwise, return "!" + candidate.
 * @memberof module:editor/shortcuts
 * @private
 */
function platform(p: string): string {
    let result = 'other';
    if (navigator?.platform && navigator.userAgent) {
        if (/^(mac)/i.test(navigator.platform)) {
            result = 'mac';
        } else if (/^(win)/i.test(navigator.platform)) {
            result = 'win';
        } else if (/(android)/i.test(navigator.userAgent)) {
            result = 'android';
        } else if (
            /(iphone)/i.test(navigator.userAgent) ||
            /(ipod)/i.test(navigator.userAgent) ||
            /(ipad)/i.test(navigator.userAgent)
        ) {
            result = 'ios';
        } else if (/\bCrOS\b/i.test(navigator.userAgent)) {
            result = 'chromeos';
        }
    }

    return result === p ? p : '!' + p;
}

/**
 * Return the selector matching the keystroke.
 *
 */
export function getKeyboardShortcut(mode: ParseMode, keystroke): string {
    for (const c of [
        platform('mac') + ':' + mode + ':' + keystroke,
        platform('win') + ':' + mode + ':' + keystroke,
        platform('ios') + ':' + mode + ':' + keystroke,
        platform('android') + ':' + mode + ':' + keystroke,
        platform('chromeos') + ':' + mode + ':' + keystroke,
        platform('other') + ':' + mode + ':' + keystroke,

        platform('mac') + ':' + keystroke,
        platform('win') + ':' + keystroke,
        platform('ios') + ':' + keystroke,
        platform('android') + ':' + keystroke,
        platform('chromeos') + ':' + keystroke,

        mode + ':' + keystroke,

        keystroke,
    ]) {
        if (KEYBOARD_SHORTCUTS[c]) {
            return KEYBOARD_SHORTCUTS[c];
        }
    }

    return '';
}

function commandToString(command): string {
    let result = command;

    if (isArray(result) && result.length > 0) {
        result = result[0] + '(' + result.slice(1).join('') + ')';
    }

    return result;
}

export function getShortcutForCommand(command): string {
    let result = [];

    if (typeof command === 'string') {
        const candidate = REVERSE_KEYBOARD_SHORTCUTS[command];
        if (isArray(candidate)) {
            result = candidate.slice();
        } else if (candidate) {
            result.push(candidate);
        }
    }

    // A command can be either a simple selector, or a selector
    // with arguments. Normalize it to a string
    command = commandToString(command);

    const regex = new RegExp(
        '^' +
            command
                .replace('\\', '\\\\')
                .replace('|', '\\|')
                .replace('*', '\\*')
                .replace('$', '\\$')
                .replace('^', '\\^') +
            '([^*a-zA-Z]|$)'
    );
    Object.keys(KEYBOARD_SHORTCUTS).forEach((shortcut) => {
        if (regex.test(commandToString(KEYBOARD_SHORTCUTS[shortcut]))) {
            const m = shortcut.match(/:([^:]*)$/);
            if (m) result.push(m[1]);
        }
    });

    return result.map(getShortcutMarkup).join('');
}

/**
 * Return a human readable representation of a shortcut as a markup string
 */
export function getShortcutMarkup(shortcut: string): string {
    let result: string;
    const platMatch = shortcut.match(/(^[^:]*):/);
    const plat = platMatch ? platMatch[1] : '';

    if (
        plat === platform('mac') ||
        plat === platform('win') ||
        plat === platform('ios') ||
        plat === platform('android') ||
        plat === platform('chromeos') ||
        plat === platform('other')
    ) {
        const m = shortcut.match(/:([^:]*)$/);
        result = m ? m[1] : shortcut;
    } else if (
        ![
            'mac',
            '!mac',
            'win',
            '!win',
            'ios',
            '!ios',
            'android',
            '!android',
            'chromeos',
            '!chromeos',
            'other',
            '!other',
        ].includes(plat)
    ) {
        const m = shortcut.match(/:([^:]*)$/);
        result = m ? m[1] : shortcut;
    }
    if (result) {
        const useSymbol =
            platform('mac') === 'mac' || platform('ios') === 'ios';
        const modifiers = result.length > 1 ? result.split('-') : [result];
        result = '';
        for (const modifier of modifiers) {
            if (!useSymbol && result) {
                result += '<span class="ML__shortcut-join">+</span>';
            }
            if (modifier.substr(0, 3) === 'Key') {
                result += modifier.substr(3, 1);
            } else if (modifier.substr(0, 5) === 'Digit') {
                result += modifier.substr(5, 1);
            } else {
                result +=
                    {
                        Meta: useSymbol ? '\u2318' : 'command',
                        Shift: useSymbol ? '\u21e7' : 'shift',
                        Alt: useSymbol ? '\u2325' : 'alt',
                        Ctrl: useSymbol ? '\u2303' : 'control',
                        '\n': useSymbol ? '\u23ce' : 'return',
                        Return: useSymbol ? '\u23ce' : 'return',
                        Enter: useSymbol ? '\u2324' : 'enter',
                        Tab: useSymbol ? '\u21e5' : 'tab',
                        // 'Esc':          useSymbol ? '\u238b' : 'esc',
                        Esc: 'esc',

                        Backspace: useSymbol ? '\u232b' : 'backspace',
                        Del: useSymbol ? '\u2326' : 'del',
                        PageUp: useSymbol ? '\u21de' : 'page up',
                        PageDown: useSymbol ? '\u21df' : 'page down',
                        Home: useSymbol ? '\u2912' : 'home',
                        End: useSymbol ? '\u2913' : 'end',
                        Spacebar: 'space',
                        Semicolon: ';',
                        Period: '.',
                        Comma: ',',
                        Minus: '-',
                        Equal: '=',
                        Quote: "'",
                        BracketLeft: '[',
                        BracketRight: ']',
                        Backslash: '\\',
                        IntlBackslash: '\\',
                        Backquote: '`',
                        Slash: '/',
                        NumpadMultiply: '* &#128290;',
                        NumpadDivide: '/ &#128290;', // Numeric keypad
                        NumpadSubtract: '- &#128290;',
                        NumpadAdd: '+ &#128290;',
                        NumpadDecimal: '. &#128290;',
                        NumpadComma: ', &#128290;',
                        Help: 'help',
                        Left: '\u21E0',
                        Up: '\u21E1',
                        Right: '\u21E2',
                        Down: '\u21E3',
                    }[modifier] || modifier;
            }
        }
    }
    return result;
}
