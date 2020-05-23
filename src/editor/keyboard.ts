/**
 * This modules handles low-level keyboard events and normalize them across
 * browsers.
 *
 * See https://dvcs.w3.org/hg/d4e/raw-file/tip/key-event-test.html
 * (also at https://w3c.github.io/uievents/tools/key-event-viewer.html)
 *
 *
 * - **KeyboardEvent.key** (the printable value associated with the key or a string
 * for special keys)
 *  https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 *  https://www.w3.org/TR/uievents-key/
 *
 * - **KeyboardEvent.code** (the physical key being pressed. On an AZERTY keyboard
 * the key labelled "A" is KeyQ)
 *  https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
 *  https://www.w3.org/TR/uievents-code/
 *
 * Note:
 * - `charCode`, `keyCode` and `which` are deprecated
 *
 * For background, see this info regarding keybinding in VSCode:
 * - https://github.com/microsoft/vscode/tree/master/src/vs/workbench/services/keybinding
 * - https://github.com/microsoft/vscode/wiki/Keybinding-Issues
 */

import { normalizeKeyboardEvent } from './keyboard-layout';

const PRINTABLE_KEYCODE = [
    'Backquote', // Japanese keyboard: hankaku/zenkaku/kanji key, which is non-printable
    'Digit0',
    'Digit1',
    'Digit2',
    'Digit3',
    'Digit4',
    'Digit5',
    'Digit6',
    'Digit7',
    'Digit8',
    'Digit9',
    'Minus',
    'Equal',
    'IntlYen', // Japanese Keyboard. Russian keyboard: \/

    'KeyQ', // AZERTY keyboard: labeled 'a'
    'KeyW', // AZERTY keyboard: labeled 'z'
    'KeyE',
    'KeyR',
    'KeyT',
    'KeyY', // QWERTZ keyboard: labeled 'z'
    'KeyU',
    'KeyI',
    'KeyO',
    'KeyP',
    'BracketLeft',
    'BracketRight',
    'Backslash', // May be labeled #~ on UK 102 keyboard
    'KeyA', // AZERTY keyboard: labeled 'q'
    'KeyS',
    'KeyD',
    'KeyF',
    'KeyG',
    'KeyH',
    'KeyJ',
    'KeyK',
    'KeyL',
    'Semicolon',
    'Quote',
    'IntlBackslash', // QWERTZ keyboard '><'
    'KeyZ', // AZERTY: 'w', QWERTZ: 'y'
    'KeyX',
    'KeyC',
    'KeyV',
    'KeyB',
    'KeyN',
    'KeyM',
    'Comma',
    'Period',
    'Slash',
    'IntlRo', // Japanse keyboard '\ろ'

    'Space',

    'Numpad0',
    'Numpad1',
    'Numpad2',
    'Numpad3',
    'Numpad4',
    'Numpad5',
    'Numpad6',
    'Numpad7',
    'Numpad8',
    'Numpad9',
    'NumpadAdd',
    'NumpadComma',
    'NumpadDecimal',
    'NumpadDivide',
    'NumpadEqual',
    'NumpadHash',
    'NumpadMultiply',
    'NumpadParenLeft',
    'NumpadParenRight',
    'NumpadStar',
    'NumpadSubstract',
];

export function mightProducePrintableCharacter(evt: KeyboardEvent): boolean {
    if (evt.ctrlKey || evt.metaKey) {
        // ignore ctrl/cmd-combination but not shift/alt-combinatios
        return false;
    }

    if (evt.key === 'Dead') {
        return false;
    }

    return PRINTABLE_KEYCODE.indexOf(evt.code) >= 0;
}

/**
 * Create a normalized representation of a keyboard event,
 * i.e., key code and modifier keys. For example:
 * - `ctrl+Shift+alt+[KeyF]`
 *
 * Note: the key code corresponds to a physical key, e.g. 'KeyQ' is
 * the key labeled 'A' on a French keyboard
 *
 */
function keyboardEventToString(evt: KeyboardEvent): string {
    evt = normalizeKeyboardEvent(evt);

    const modifiers = [];

    if (evt.ctrlKey) modifiers.push('ctrl');
    if (evt.metaKey) modifiers.push('meta');
    if (evt.altKey) modifiers.push('alt');
    if (evt.shiftKey) modifiers.push('shift');

    // If no modifiers, simply return the key name
    if (modifiers.length === 0) return '[' + evt.code + ']';

    modifiers.push('[' + evt.code + ']');

    return modifiers.join('+');
}

/**
 * Setup to capture the keyboard events from a `TextArea` and redispatch them to
 * handlers.
 *
 * In general, commands (arrows, delete, etc..) should be handled
 * in the `keystroke()` handler while text input should be handled in
 * `typedtext()`.
 *
 * @param {HTMLElement} textarea A `TextArea` element that will capture the keyboard
 * events. While this element will usually be a `TextArea`, it could be any
 * element that is focusable and can receive keyboard events.
 * @param {Object.<string, any>} handlers
 * @param {function} handlers.keystroke invoked on a key down event, including
 * for special keys such as ESC, arrow keys, tab, etc... and their variants
 * with modifiers.
 * @param {function} handlers.typedtext invoked on a keypress or other events
 * when a key corresponding to a character has been pressed. This include `a-z`,
 * `0-9`, `{}`, `^_()`, etc...
 * This does not include arrow keys, tab, etc... but does include 'space'
 * When a 'character' key is pressed, both `keystroke()` and `typedtext()` will
 * be invoked. When a control/function key is pressed, only `keystroke()` will
 * be invoked. In some cases, for example when using input methods or entering
 * emoji, only `typedtext()` will be invoked.
 */
export function delegateKeyboardEvents(
    textarea: HTMLElement,
    handlers: {
        allowDeadKey: () => boolean;
        typedText: (text: string) => void;
        paste: (text: string) => void;
        keystroke: (keystroke: string, e: KeyboardEvent) => void;
        focus: () => void;
        blur: () => void;
    }
): void {
    let keydownEvent = null;
    let keypressEvent = null;
    let compositionInProgress = false;
    let deadKey = false;

    // This callback is invoked after a keyboard event has been processed
    // by the textarea
    let callbackTimeoutID: number;
    function defer(cb: () => void): void {
        clearTimeout(callbackTimeoutID);
        callbackTimeoutID = setTimeout(function () {
            clearTimeout(callbackTimeoutID);
            cb();
        });
    }

    function handleTypedText() {
        // Some browsers (Firefox, Opera) fire a keypress event for commands
        // such as command-C where there might be a non-empty selection.
        // We need to ignore these.
        if (hasSelection(textarea)) return;

        const text = textarea['value'];
        textarea['value'] = '';
        if (text.length > 0) handlers.typedText(text);
    }

    const target = textarea;

    target.addEventListener(
        'keydown',
        (e) => {
            const allowDeadKey = handlers.allowDeadKey();
            if (
                !allowDeadKey &&
                (e.key === 'Dead' ||
                    e.key === 'Unidentified' ||
                    e.keyCode === 229)
            ) {
                deadKey = true;
                compositionInProgress = false;
                // This sequence seems to cancel dead keys
                // but don't call our blur/focus handlers
                const savedBlur = handlers.blur;
                const savedFocus = handlers.focus;
                handlers.blur = null;
                handlers.focus = null;
                if (typeof textarea.blur === 'function') {
                    textarea.blur();
                    textarea.focus();
                }
                handlers.blur = savedBlur;
                handlers.focus = savedFocus;
            } else {
                deadKey = false;
            }
            if (
                !compositionInProgress &&
                e.code !== 'CapsLock' &&
                !/(Control|Meta|Alt|Shift)(Right|Left)/.test(e.code)
            ) {
                keydownEvent = e;
                keypressEvent = null;
                return handlers.keystroke(keyboardEventToString(e), e);
            }
            return true;
        },
        true
    );
    target.addEventListener(
        'keypress',
        (e) => {
            // If this is not the first keypress after a keydown, that is,
            // if this is a repeated keystroke, call the keystroke handler.
            if (!compositionInProgress) {
                if (keydownEvent && keypressEvent) {
                    handlers.keystroke(
                        keyboardEventToString(keydownEvent),
                        keydownEvent
                    );
                }

                keypressEvent = e;
                defer(handleTypedText);
            }
        },
        true
    );
    target.addEventListener(
        'keyup',
        () => {
            // If we've received a keydown, but no keypress, check what's in the
            // textarea field.
            if (!compositionInProgress && keydownEvent && !keypressEvent) {
                handleTypedText();
            }
        },
        true
    );
    target.addEventListener(
        'paste',
        () => {
            // In some cases (Linux browsers), the text area might not be focused
            // when doing a middle-click paste command.
            textarea.focus();
            const text = textarea['value'];
            textarea['value'] = '';
            if (text.length > 0) handlers.paste(text);
        },
        true
    );
    target.addEventListener(
        'blur',
        () => {
            keydownEvent = null;
            keypressEvent = null;
            if (handlers.blur) handlers.blur();
        },
        true
    );
    target.addEventListener(
        'focus',
        () => {
            if (handlers.focus) handlers.focus();
        },
        true
    );
    target.addEventListener(
        'compositionstart',
        () => {
            compositionInProgress = true;
        },
        true
    );
    target.addEventListener(
        'compositionend',
        () => {
            compositionInProgress = false;
            if (deadKey && handlers.allowDeadKey()) {
                defer(handleTypedText);
            }
        },
        true
    );

    // The `input` handler gets called when the field is changed,
    // for example with input methods or emoji input...
    target.addEventListener('input', () => {
        if (deadKey) {
            const savedBlur = handlers.blur;
            const savedFocus = handlers.focus;
            handlers.blur = null;
            handlers.focus = null;
            textarea.blur();
            textarea.focus();
            handlers.blur = savedBlur;
            handlers.focus = savedFocus;
            deadKey = false;
            compositionInProgress = false;
            if (handlers.allowDeadKey()) {
                defer(handleTypedText);
            }
        } else if (!compositionInProgress) {
            defer(handleTypedText);
        }
    });
}

function hasSelection(textarea): boolean {
    return textarea.selectionStart !== textarea.selectionEnd;
}

export function eventToChar(evt: KeyboardEvent): string {
    if (!evt) return '';
    let result: string;
    if (evt.key === 'Unidentified') {
        // On Android, the evt.key seems to always be 'Unidentified'.
        // Get the value entered in the event target
        if (evt.target) {
            result = evt.target['value'];
        }
    }
    result = result ?? evt.key ?? evt.code;
    if (
        /^(Dead|Return|Enter|Tab|Escape|Delete|PageUp|PageDown|Home|End|Help|ArrowLeft|ArrowRight|ArrowUp|ArrowDown)$/.test(
            result
        )
    ) {
        result = '';
    }
    return result;
}
