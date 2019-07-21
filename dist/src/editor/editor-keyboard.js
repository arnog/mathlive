
/**
 * This modules handles low-level keyboard events and normalize them across
 * browsers.
 * @module editor/keyboard
 * @private
 */

// These keys on international (non-US QWERTY) keyboards should 
// be mapped to the coresponding virtual keys (they could be shifted keys on
// international keyboards)
const INTL_KEY = {
    '#':            '#',
    '|':            '|',
    '[':            'BracketLeft',
    ']':            'BracketRight',
    '-':            'Minus',
    '+':            'Plus',
    '=':            'Equal',
    '/':            'Slash',
    '\\':           'Backslash',
}

const KEY_NAMES = {
    'Space':        'Spacebar',
    ' ':            'Spacebar',
    'Escape':       'Esc',
    'ArrowLeft':    'Left',
    'ArrowUp':      'Up',
    'ArrowRight':   'Right',
    'ArrowDown':    'Down',
    'Delete':       'Del'
};

  const VIRTUAL_KEY_NAMES = {
      'q'           : 'KeyQ',
      'w'           : 'KeyW',
      'e'           : 'KeyE',
      'r'           : 'KeyR',
      't'           : 'KeyT',
      'y'           : 'KeyY',
      'u'           : 'KeyU',
      'i'           : 'KeyI',
      'o'           : 'KeyO',
      'p'           : 'KeyP',
      'a'           : 'KeyA',
      's'           : 'KeyS',
      'd'           : 'KeyD',
      'f'           : 'KeyF',
      'g'           : 'KeyG',
      'h'           : 'KeyH',
      'j'           : 'KeyJ',
      'k'           : 'KeyK',
      'l'           : 'KeyL',
      'z'           : 'KeyZ',
      'x'           : 'KeyX',
      'c'           : 'KeyC',
      'v'           : 'KeyV',
      'b'           : 'KeyB',
      'n'           : 'KeyN',
      'm'           : 'KeyM',

      '1'           : 'Digit1',
      '2'           : 'Digit2',
      '3'           : 'Digit3',
      '4'           : 'Digit4',
      '5'           : 'Digit5',
      '6'           : 'Digit6',
      '7'           : 'Digit7',
      '8'           : 'Digit8',
      '9'           : 'Digit9',
      '0'           : 'Digit0',

      '!'           : 'Shift-Digit1',      
      '@'           : 'Shift-Digit2',
      '#'           : 'Shift-Digit3',      
      '$'           : 'Shift-Digit4',      
      '%'           : 'Shift-Digit5',      
      '^'           : 'Shift-Digit6',      
      '&'           : 'Shift-Digit7',      
      '*'           : 'Shift-Digit8',      
      '('           : 'Shift-Digit9',      
      ')'           : 'Shift-Digit0',

      '-'           : 'Minus',
      '_'           : 'Shift-Minus',

      '/'           : 'Slash',
      '\\'          : 'Backslash',  // Some virtual keyboards (iOS) return '\' as the event.key
                                    // with no evt.code
      '|'           : 'Shift-Backslash',
      '?'           : 'Shift-Slash',

      ' '           : 'Spacebar'
  };

/**
 * 
 * Create a normalized string representation of the key combo,
 * i.e., key code and modifier keys. For example:
 * - `Ctrl-Shift-Alt-KeyF`
 * - `Alt-Space`
 * - `Shift-Digit6`
 * @todo See https://github.com/madrobby/keymaster/blob/master/keymaster.js
 * - Doesn't work very well for command-<key>
 * - Returns "Alt-Alt" when only the Alt key is pressed
 * @memberof module:editor/keyboard
 * @param {Event} evt 
 * @private
 */
function keyboardEventToString(evt) {
    let keyname;
    let useModifiers = true;

    if (evt.key === 'Unidentified') {
        // On Android, the evt.key seems to always be Unidentified. 
        // Get the value entered in the event target
        if (evt.target) {
            keyname = VIRTUAL_KEY_NAMES[evt.target.value] || evt.target.value;
        }
    }

    if (!keyname) {
        if (INTL_KEY[evt.key]) {
            keyname = INTL_KEY[evt.key];
            useModifiers = false;
        } else {
            keyname = KEY_NAMES[evt.key];
        }

        // For virtual keyboards (iOS, Android) and Microsoft Edge (!)
        // the `evt.code`, which represents the physical key pressed, is set 
        // to undefined. In that case, map the virtual key ("q") to a
        // pseudo-hardware key ("KeyQ")
        if (!keyname) {
            keyname = VIRTUAL_KEY_NAMES[evt.key.toLowerCase()] || evt.key;
        }
    }

    if (!keyname && evt.code) {
        keyname = KEY_NAMES[evt.code] || evt.code;
    }

    const modifiers = [];

    if (evt.ctrlKey) modifiers.push('Ctrl');
    if (evt.metaKey) modifiers.push('Meta');
    if (useModifiers && evt.altKey) modifiers.push('Alt');
    if (useModifiers && evt.shiftKey) modifiers.push('Shift');

    // If no modifiers, simply return the key name
    if (modifiers.length === 0) return keyname;

    modifiers.push(keyname);

    return modifiers.join('-');
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
 * @param {HTMLElement} [handlers.container]
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
 * @param {function} handlers.paste(text) Invoked in response to a paste 
 * command. Not all browsers support this (Chrome doesn't), so typedtext() 
 * will be invoked instead.
 * @param {function} handlers.cut
 * @param {function} handlers.copy
 * @memberof module:editor/keyboard
 * @private
 */
function delegateKeyboardEvents(textarea, handlers) {
    let keydownEvent = null;
    let keypressEvent = null;
    let compositionInProgress = false;
    let deadKey = false;

    // This callback is invoked after a keyboard event has been processed
    // by the textarea
    let callbackTimeoutID;

    function defer(cb) {
        clearTimeout(callbackTimeoutID);
        callbackTimeoutID = setTimeout(function() {
            clearTimeout(callbackTimeoutID);
            cb();
        });
    }

    function handleTypedText() {
        // Some browsers (Firefox, Opera) fire a keypress event for commands
        // such as command-C where there might be a non-empty selection.
        // We need to ignore these.
        if (hasSelection(textarea)) return;

        const text = textarea.value;
        textarea.value = '';
        if (text.length > 0) handlers.typedText(text);
    }

    function onKeydown(e) {
        const allowDeadKey = typeof handlers.allowDeadKey === 'function' && 
            handlers.allowDeadKey();
        if (!allowDeadKey && 
            ((e.key === 'Dead' || e.key === 'Unidentified') || e.keyCode === 229)) {
            deadKey = true;
            compositionInProgress = false;
            // This sequence seems to cancel dead keys
            // but don't call our blur/focus handlers
            const savedBlur = handlers.blur;
            const savedFocus = handlers.focus;
            handlers.blur = null;
            handlers.focus = null;
            textarea.blur();
            textarea.focus();
            handlers.blur = savedBlur;
            handlers.focus = savedFocus;
        } else {
            deadKey = false;
        }
        if (!compositionInProgress && 
            e.code !== 'CapsLock' && 
            !/(Control|Meta|Alt|Shift)(Right|Left)/.test(e.code)) {
            keydownEvent = e;
            keypressEvent = null;
            return handlers.keystroke(keyboardEventToString(e), e);
        }
        return true;
    }

    function onKeypress(e) {
        // If this is not the first keypress after a keydown, that is,
        // if this is a repeated keystroke, call the keystroke handler.
        if (!compositionInProgress) {
            if (keydownEvent && keypressEvent) {
                handlers.keystroke(keyboardEventToString(keydownEvent), keydownEvent);
            }

            keypressEvent = e;
            defer(handleTypedText);
        }
    }

    function onKeyup() {
       // If we've received a keydown, but no keypress, check what's in the
        // textarea field.
        if (!compositionInProgress && keydownEvent && !keypressEvent) {
            handleTypedText();
        }
    }

    function onPaste() {
        // In some cases (Linux browsers), the text area might not be focused
        // when doing a middle-click paste command.
        textarea.focus();
        const text = textarea.value;
        textarea.value = '';
        if (text.length > 0) handlers.paste(text);
    }

    function onCopy(e) {
        if (handlers.copy) handlers.copy(e);
    }

    function onCut(e) {
        if (handlers.cut) handlers.cut(e);
    }

    function onBlur() {
        keydownEvent = null;
        keypressEvent = null;
        if (handlers.blur) handlers.blur();
    }
    function onFocus() {
        if (handlers.focus) {
            handlers.focus();
        }
    }

    const target = textarea || handlers.container;

    target.addEventListener('keydown', onKeydown, true);
    target.addEventListener('keypress', onKeypress, true);
    target.addEventListener('keyup', onKeyup, true);
    target.addEventListener('paste', onPaste, true);
    target.addEventListener('copy', onCopy, true);
    target.addEventListener('cut', onCut, true);
    target.addEventListener('blur', onBlur, true);
    target.addEventListener('focus', onFocus, true);
    target.addEventListener('compositionstart', 
        () => { compositionInProgress = true }, true);
    target.addEventListener('compositionend', 
        () => { compositionInProgress = false; defer(handleTypedText); }, true);

    // The `input` handler gets called when the field is changed, for example 
    // with input methods or emoji input...
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
            defer(handleTypedText); 
        } else if (!compositionInProgress) {
            defer(handleTypedText); 
        }
    });

}

function hasSelection(textarea) {
    return textarea.selectionStart !== textarea.selectionEnd;
}


function eventToChar(evt) {
    if (!evt) return '';
    let result;
    if (evt.key === 'Unidentified') {
        // On Android, the evt.key seems to always be 'Unidentified'.
        // Get the value entered in the event target
        if (evt.target) {
            result = evt.target.value;
        }
    }
    result = result || evt.key || evt.code;
    if (/^(Return|Enter|Tab|Escape|Delete|PageUp|PageDown|Home|End|Help|ArrowLeft|ArrowRight|ArrowUp|ArrowDown)$/.test(result)) {
        result = '';
    }
    return result;
}

function charToEvent(c) {
    const result = {
        key: c,
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        shiftKey: false
    };

    return result;
}

export default {
    delegateKeyboardEvents: delegateKeyboardEvents,
    select: delegateKeyboardEvents.select,
    keyboardEventToString,
    eventToChar,
    charToEvent
};



