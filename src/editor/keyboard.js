"use strict";
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
exports.__esModule = true;
exports.keyboardEventToString = exports.keyboardEventToChar = exports.delegateKeyboardEvents = void 0;
var keyboard_layout_1 = require("./keyboard-layout");
var scrim_1 = require("../ui/utils/scrim");
var utils_1 = require("../ui/events/utils");
/**
 * Setup to capture the keyboard events from a `TextArea` and redispatch them to
 * handlers.
 *
 * In general, commands (arrows, delete, etc..) should be handled
 * in the `keystroke()` handler while text input should be handled in
 * `typedtext()`.
 *
 * @param {HTMLElement} keyboardSink The element that captures the keyboard
 * events.
 * @param {KeyboardDelegateInterface} delegate
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
 * emoji, only `onInput()` will be invoked.
 */
function delegateKeyboardEvents(keyboardSink, element, delegate) {
    var keydownEvent = null;
    var keypressEvent = null;
    var compositionInProgress = false;
    var focusInProgress = false;
    var blurInProgress = false;
    var controller = new AbortController();
    var signal = controller.signal;
    keyboardSink.addEventListener('keydown', function (event) {
        // "Process" key indicates commit of IME session (on Firefox)
        // It's handled with compositionEnd so it can be safely ignored
        if (compositionInProgress ||
            event.key === 'Process' ||
            event.code === 'CapsLock' ||
            /(Control|Meta|Alt|Shift)(Left|Right)/.test(event.code)) {
            keydownEvent = null;
            return;
        }
        keydownEvent = event;
        keypressEvent = null;
        if (!delegate.onKeystroke(event))
            keydownEvent = null;
        else
            keyboardSink.textContent = '';
    }, { capture: true, signal: signal });
    keyboardSink.addEventListener('keypress', function (event) {
        if (compositionInProgress)
            return;
        // If this is not the first keypress after a keydown, that is,
        // if this is a repeated keystroke, call the keystroke handler.
        if (keydownEvent && keypressEvent)
            delegate.onKeystroke(keydownEvent);
        keypressEvent = event;
    }, { capture: true, signal: signal });
    keyboardSink.addEventListener('compositionstart', function (event) {
        keyboardSink.textContent = '';
        compositionInProgress = true;
        delegate.onCompositionStart(event.data);
    }, { capture: true, signal: signal });
    keyboardSink.addEventListener('compositionupdate', function (ev) {
        if (!compositionInProgress)
            return;
        delegate.onCompositionUpdate(ev.data);
    }, { capture: true, signal: signal });
    keyboardSink.addEventListener('compositionend', function (ev) {
        keyboardSink.textContent = '';
        if (!compositionInProgress)
            return;
        compositionInProgress = false;
        delegate.onCompositionEnd(ev.data);
    }, { capture: true, signal: signal });
    keyboardSink.addEventListener('beforeinput', function (ev) { return ev.stopImmediatePropagation(); }, { signal: signal });
    // The `input` events is dispatched when the field is changed,
    // but no other relevant events have been triggered
    // for example with emoji input...
    keyboardSink.addEventListener('input', function (ev) {
        var _a;
        if (compositionInProgress)
            return;
        keyboardSink.textContent = '';
        // If this was an `input` event sent as a result of a commit of
        // IME, ignore it.
        // (This is what FireFox does, even though the spec says it
        // shouldn't happen). See https://github.com/w3c/uievents/issues/202
        if (ev.inputType === 'insertCompositionText')
            return;
        // Paste is handled in paste handler
        if (ev.inputType === 'insertFromPaste') {
            ev.preventDefault();
            ev.stopPropagation();
            return;
        }
        delegate.onInput((_a = ev.data) !== null && _a !== void 0 ? _a : '');
        // Do not propagate the event (it crosses the shadow dom barrier)
        ev.preventDefault();
        ev.stopPropagation();
    }, { signal: signal });
    keyboardSink.addEventListener('paste', function (event) {
        // In some cases (Linux browsers), the keyboard sink might not be focused
        // when doing a middle-click paste command.
        keyboardSink.focus({ preventScroll: true });
        keyboardSink.textContent = '';
        if (!delegate.onPaste(event))
            event.preventDefault();
        event.stopImmediatePropagation();
    }, { signal: signal });
    keyboardSink.addEventListener('cut', function (ev) { return delegate.onCut(ev); }, {
        capture: true,
        signal: signal
    });
    keyboardSink.addEventListener('copy', function (ev) { return delegate.onCopy(ev); }, {
        capture: true,
        signal: signal
    });
    keyboardSink.addEventListener('blur', function (event) {
        var _a, _b;
        // If we're attempting to focus the mathfield (which can happen on iOS if
        // clicking right on the border of the mathfield) ignore it
        // (preventDefault on the event doesn't work)
        if (((_b = (_a = event['relatedTarget']) === null || _a === void 0 ? void 0 : _a['_mathfield']) === null || _b === void 0 ? void 0 : _b['element']) === element) {
            keyboardSink.focus({ preventScroll: true });
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        // If we're attempting to focus an element that is inside the virtual
        // keyboard, ignore the blur (this happens on iOS when doing a multi-touch
        // tap on an element inside the virtual keyboard).
        var isInsideKeyboard = false;
        var target = event.relatedTarget;
        while (target) {
            if (target.classList.contains('ML__keyboard')) {
                isInsideKeyboard = true;
                break;
            }
            target = target.parentElement;
        }
        if (isInsideKeyboard) {
            keyboardSink.focus({ preventScroll: true });
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        // If the scrim is up, ignore blur (while the variants panel is up)
        var scrimState = scrim_1.Scrim.state;
        if (scrimState === 'open' || scrimState === 'opening') {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        // If the relatedTarget (the element that is gaining the focus)
        // is contained in our shadow host, ignore the blur event
        if (event.relatedTarget ===
            event.target.getRootNode().host) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        if (blurInProgress || focusInProgress)
            return;
        blurInProgress = true;
        keydownEvent = null;
        keypressEvent = null;
        delegate.onBlur();
        blurInProgress = false;
    }, { capture: true, signal: signal });
    keyboardSink.addEventListener('focus', function (_evt) {
        if (blurInProgress || focusInProgress)
            return;
        focusInProgress = true;
        delegate.onFocus();
        focusInProgress = false;
    }, { capture: true, signal: signal });
    return {
        dispose: function () { return controller.abort(); },
        cancelComposition: function () {
            // Due to the order of event, we may not have
            // received `compositionstart` by the time we decide
            // to cancel the composition.
            if (!compositionInProgress)
                return;
            keyboardSink.blur();
            requestAnimationFrame(function () { return keyboardSink.focus({ preventScroll: true }); });
        },
        blur: function () {
            if (typeof keyboardSink.blur === 'function')
                keyboardSink.blur();
        },
        focus: function () {
            if (!focusInProgress && typeof keyboardSink.focus === 'function')
                keyboardSink.focus({ preventScroll: true });
        },
        hasFocus: function () {
            return (0, utils_1.deepActiveElement)() === keyboardSink;
        },
        setAriaLabel: function (value) {
            return keyboardSink.setAttribute('aria-label', value);
        },
        setValue: function (value) {
            var _a;
            if (keyboardSink.textContent === value)
                return;
            keyboardSink.textContent = value;
            // Move sink offscreen (Safari will display a visible selection otherwise)
            keyboardSink.style.left = "-1000px";
            // Select the elements in the sink (Safari will not enable copy/paste if there isn't a selection)
            (_a = window.getSelection()) === null || _a === void 0 ? void 0 : _a.selectAllChildren(keyboardSink);
        },
        moveTo: function (x, y) {
            // Move the sink on screen, used when composition with an IME is in
            // progress so its accessory windows appear at the right place
            keyboardSink.style.top = "".concat(y, "px");
            keyboardSink.style.left = "".concat(x, "px");
        }
    };
}
exports.delegateKeyboardEvents = delegateKeyboardEvents;
function keyboardEventToChar(evt) {
    var _a;
    if (!evt || !(0, utils_1.mightProducePrintableCharacter)(evt))
        return '';
    var result;
    if (evt.key === 'Unidentified') {
        // On Android, the evt.key seems to always be 'Unidentified'.
        // Get the value entered in the event target
        if (evt.target)
            result = evt.target.value;
    }
    // Note that in some  rare cases, the evt.key can be a string of multiple
    // char. This happens on Windows Swedish keyboard with Firefox, where the
    // `¨` key is returned as `¨¨`.
    result = (_a = result !== null && result !== void 0 ? result : evt.key) !== null && _a !== void 0 ? _a : evt.code;
    if (/^(Dead|Return|Enter|Tab|Escape|Delete|PageUp|PageDown|Home|End|Help|ArrowLeft|ArrowRight|ArrowUp|ArrowDown)$/.test(result))
        result = '';
    return result;
}
exports.keyboardEventToChar = keyboardEventToChar;
/**
 * Create a normalized representation of a keyboard event,
 * i.e., key code and modifier keys. For example:
 * - `ctrl+Shift+alt+[KeyF]`
 *
 * Note: the key code corresponds to a physical key, e.g. 'KeyQ' is
 * the key labeled 'A' on a French keyboard
 *
 */
function keyboardEventToString(evt) {
    evt = (0, keyboard_layout_1.normalizeKeyboardEvent)(evt);
    var modifiers = [];
    if (evt.ctrlKey)
        modifiers.push('ctrl');
    if (evt.metaKey)
        modifiers.push('meta');
    if (evt.altKey)
        modifiers.push('alt');
    if (evt.shiftKey)
        modifiers.push('shift');
    // If no modifiers, simply return the key name
    if (modifiers.length === 0)
        return "[".concat(evt.code, "]");
    modifiers.push("[".concat(evt.code, "]"));
    return modifiers.join('+');
}
exports.keyboardEventToString = keyboardEventToString;
