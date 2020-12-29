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

const PRINTABLE_KEYCODE = new Set([
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
]);

export function mightProducePrintableCharacter(evt: KeyboardEvent): boolean {
  if (evt.ctrlKey || evt.metaKey) {
    // ignore ctrl/cmd-combination but not shift/alt-combinations
    return false;
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
  if (evt.key === 'Dead') return false;

  // When issued via a composition, the `code` field is empty
  if (evt.code === '') return true;

  return PRINTABLE_KEYCODE.has(evt.code);
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

export interface KeyboardDelegate {
  cancelComposition: () => void;
  blur: () => void;
  focus: () => void;
  hasFocus: () => boolean;
  setValue: (value: string) => void;
  setAriaLabel: (value: string) => void;
  moveTo: (x: number, y: number) => void;
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
  textarea: HTMLTextAreaElement,
  handlers: {
    typedText: (text: string) => void;
    cut: (ev: ClipboardEvent) => void;
    copy: (ev: ClipboardEvent) => void;
    paste: (ev: ClipboardEvent) => void;
    keystroke: (keystroke: string, ev: KeyboardEvent) => boolean;
    focus: () => void;
    blur: () => void;
    compositionStart: (composition: string) => void;
    compositionUpdate: (composition: string) => void;
    compositionEnd: (composition: string) => void;
  }
): KeyboardDelegate {
  let keydownEvent = null;
  let keypressEvent = null;
  let compositionInProgress = false;
  let focusInProgress = false;
  let blurInProgress = false;

  // This callback is invoked after a keyboard event has been processed
  // by the textarea
  let callbackTimeoutID: number;
  function defer(cb: () => void): void {
    clearTimeout(callbackTimeoutID);
    callbackTimeoutID = setTimeout(() => {
      clearTimeout(callbackTimeoutID);
      cb();
    });
  }

  function handleTypedText(): void {
    // Some browsers (Firefox, Opera) fire a keypress event for commands
    // such as cmd+C where there might be a non-empty selection.
    // We need to ignore these.
    if (textarea.selectionStart !== textarea.selectionEnd) return;

    const text = textarea.value;
    textarea.value = '';
    if (text.length > 0) handlers.typedText(text);
  }

  const target = textarea;

  target.addEventListener(
    'keydown',
    (event: KeyboardEvent): void => {
      // "Process" key indicates commit of IME session (on Firefox)
      // It's handled with compositionEnd so it can be safely ignored
      if (
        compositionInProgress ||
        event.key === 'Process' ||
        event.code === 'CapsLock' ||
        /(Control|Meta|Alt|Shift)(Left|Right)/.test(event.code)
      ) {
        keydownEvent = null;
        return;
      }

      keydownEvent = event;
      keypressEvent = null;
      if (!handlers.keystroke(keyboardEventToString(event), event)) {
        keydownEvent = null;
        textarea.value = '';
      }
    },
    true
  );
  target.addEventListener(
    'keypress',
    (event) => {
      if (compositionInProgress) return;
      // If this is not the first keypress after a keydown, that is,
      // if this is a repeated keystroke, call the keystroke handler.
      if (!compositionInProgress) {
        if (keydownEvent && keypressEvent) {
          handlers.keystroke(keyboardEventToString(keydownEvent), keydownEvent);
        }

        keypressEvent = event;
        defer(handleTypedText);
      }
    },
    true
  );
  target.addEventListener(
    'keyup',
    () => {
      if (compositionInProgress) return;
      // If we've received a keydown, but no keypress, check what's in the
      // textarea field.
      if (keydownEvent && !keypressEvent) {
        handleTypedText();
      }
    },
    true
  );
  target.addEventListener(
    'paste',
    (event: ClipboardEvent) => {
      // In some cases (Linux browsers), the text area might not be focused
      // when doing a middle-click paste command.
      textarea.focus();
      textarea.value = '';
      handlers.paste(event);
    },
    true
  );
  target.addEventListener('cut', (ev) => handlers.cut(ev), true);
  target.addEventListener('copy', (ev) => handlers.copy(ev), true);
  target.addEventListener(
    'blur',
    (event) => {
      // If the relatedTarget (the element that is gaining the focus)
      // is contained in our shadow host, ignore the blur event
      if (
        event.relatedTarget ===
        (((event.target as HTMLElement).getRootNode() as any) as ShadowRoot)
          .host
      ) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (blurInProgress || focusInProgress) return;

      blurInProgress = true;
      keydownEvent = null;
      keypressEvent = null;
      if (handlers.blur) handlers.blur();
      blurInProgress = false;
    },
    true
  );
  target.addEventListener(
    'focus',
    (_ev) => {
      if (blurInProgress || focusInProgress) return;

      focusInProgress = true;
      if (handlers.focus) handlers.focus();
      focusInProgress = false;
    },
    true
  );
  target.addEventListener(
    'compositionstart',
    (event: CompositionEvent) => {
      compositionInProgress = true;
      textarea.value = '';

      if (handlers.compositionStart) {
        handlers.compositionStart(event.data);
      }
    },
    true
  );
  target.addEventListener(
    'compositionupdate',
    (ev: CompositionEvent) => {
      if (!compositionInProgress) return;
      if (handlers.compositionUpdate) handlers.compositionUpdate(ev.data);
    },
    true
  );
  target.addEventListener(
    'compositionend',
    (ev: CompositionEvent) => {
      textarea.value = '';
      if (!compositionInProgress) return;
      compositionInProgress = false;
      if (handlers.compositionEnd) handlers.compositionEnd(ev.data);
    },
    true
  );

  // The `input` handler gets called when the field is changed,
  // but no other relevant events have been triggered
  // for example with emoji input...
  target.addEventListener('input', (ev: InputEvent) => {
    if (compositionInProgress) return;
    // If this was an `input` event sent as a result of a commit of
    // IME, ignore it.
    // (This is what FireFox does, even though the spec says it shouldn't happen)
    // See https://github.com/w3c/uievents/issues/202
    if (ev.inputType === 'insertCompositionText') return;

    // Paste is handled in paste handler
    if (ev.inputType === 'insertFromPaste') {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }

    defer(handleTypedText);
  });

  return {
    cancelComposition: (): void => {
      const savedBlur = handlers.blur;
      const savedFocus = handlers.focus;
      handlers.blur = null;
      handlers.focus = null;
      textarea.blur();
      textarea.focus();
      handlers.blur = savedBlur;
      handlers.focus = savedFocus;
    },
    blur: (): void => {
      if (typeof textarea.blur === 'function') {
        textarea.blur();
      }
    },
    focus: (): void => {
      if (typeof textarea.focus === 'function') {
        textarea.focus();
      }
    },
    hasFocus: (): boolean => {
      return deepActiveElement() === textarea;
    },
    setValue: (value: string): void => {
      if (value) {
        textarea.value = value;
        // The textarea may be a span (on mobile, for example), so check that
        // it has a select() before calling it.
        if (deepActiveElement() === textarea && textarea.select) {
          textarea.select();
        }
      } else {
        textarea.value = '';
        textarea.setAttribute('aria-label', '');
      }
    },
    setAriaLabel: (value: string): void => {
      textarea.setAttribute('aria-label', 'after: ' + value);
    },
    moveTo: (x: number, y: number): void => {
      textarea.style.top = `${y}px`;
      textarea.style.left = `${x}px`;
    },
  };
}

function deepActiveElement(): Element | null {
  let a = document.activeElement;
  while (a?.shadowRoot?.activeElement) {
    a = a.shadowRoot.activeElement;
  }

  return a;
}

export function eventToChar(evt: KeyboardEvent): string {
  if (!evt) return '';
  let result: string;
  if (evt.key === 'Unidentified') {
    // On Android, the evt.key seems to always be 'Unidentified'.
    // Get the value entered in the event target
    if (evt.target) {
      result = (evt.target as HTMLInputElement).value;
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
