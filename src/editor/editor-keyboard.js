
/**
 * This modules handles low-level keyboard events and normalize them across
 * browsers.
 * @module editor/keyboard
 * @private
 */


  const KEY_NAMES = {
    'Escape': 'Esc',
    ' ': 'Spacebar',
    'ArrowLeft': 'Left',
    'ArrowUp': 'Up',
    'ArrowRight': 'Right',
    'ArrowDown': 'Down',
    'Delete': 'Del'
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
 */
function keyboardEventToString(evt) {
    let keyname;

    if (evt.key === 'Unidentified') {
        // On Android, the evt.key seems to always be Unidentified. 
        // Get the value entered in the event target
        if (evt.target) {
            keyname = VIRTUAL_KEY_NAMES[evt.target.value] || evt.target.value;
        }
    }

    if (!keyname) {
        keyname = KEY_NAMES[evt.key] || evt.code;

        // For virtual keyboards (iOS, Android) and Microsoft Edge (!)
        // the `evt.code`, which represents the physical key pressed, is set 
        // to undefined. In that case, map the virtual key ("q") to a
        // pseudo-hardware key ("KeyQ")
        if (!keyname) {
            keyname = VIRTUAL_KEY_NAMES[evt.key.toLowerCase()] || evt.key;
        }
    }

    const modifiers = [];

    if (evt.ctrlKey) modifiers.push('Ctrl');
    if (evt.metaKey) modifiers.push('Meta');
    if (evt.altKey) modifiers.push('Alt');
    if (evt.shiftKey) modifiers.push('Shift');

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
 * @param {Element} textarea A `TextArea` element that will capture the keyboard
 * events. While this element will usually be a `TextArea`, it could be any
 * element that is focusable and can receive keyboard events.
 * @param {Object} handlers
 * @param {Element} [handlers.container]
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

    // const noop = function() {};

    // This callback is invoked after a keyboard event has been processed
    // by the textarea
    // let callback = noop;
    let callbackTimeoutID;

    function defer(cb) {
        // callback = cb;
        clearTimeout(callbackTimeoutID);
        callbackTimeoutID = setTimeout(function() {
            // callback = noop;
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
        if ((e.key === 'Dead' || e.key === 'Unidentified') || e.keyCode === 229) {
            deadKey = true;
            compositionInProgress = false;
            // This sequence seems to cancel dead keys
            textarea.blur();
            textarea.focus();
        } else {
            deadKey = false;
        }
        if (!compositionInProgress && 
            e.code !== 'ControlLeft' &&
            e.code !== 'MetaLeft') {
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
        if (handlers.focus) handlers.focus();
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
            textarea.blur();
            textarea.focus();
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

export default {
    delegateKeyboardEvents: delegateKeyboardEvents,
    select: delegateKeyboardEvents.select,
};



