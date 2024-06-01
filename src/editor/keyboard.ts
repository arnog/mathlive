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
import { Scrim } from '../ui/utils/scrim';
import {
  deepActiveElement,
  mightProducePrintableCharacter,
} from '../ui/events/utils';

export interface KeyboardDelegate {
  cancelComposition: () => void;
  blur: () => void;
  focus: () => void;
  hasFocus: () => boolean;
  setValue: (value: string) => void;
  setAriaLabel: (value: string) => void;
  moveTo: (x: number, y: number) => void;
  dispose: () => void;
}

export interface KeyboardDelegateInterface {
  onKeystroke: (ev: KeyboardEvent) => boolean;
  onInput: (text: string) => void;
  onCut: (ev: ClipboardEvent) => void;
  onCopy: (ev: ClipboardEvent) => void;
  onPaste: (ev: ClipboardEvent) => boolean;
  onFocus: () => void;
  onBlur: () => void;
  onCompositionStart: (composition: string) => void;
  onCompositionUpdate: (composition: string) => void;
  onCompositionEnd: (composition: string) => void;
}

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
export function delegateKeyboardEvents(
  keyboardSink: HTMLElement,
  element: HTMLElement,
  delegate: KeyboardDelegateInterface
): KeyboardDelegate {
  let keydownEvent: KeyboardEvent | null = null;
  let keypressEvent: KeyboardEvent | null = null;
  let compositionInProgress = false;
  let focusInProgress = false;
  let blurInProgress = false;

  const controller = new AbortController();
  const signal = controller.signal;

  keyboardSink.addEventListener(
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
      if (!delegate.onKeystroke(event)) keydownEvent = null;
      else keyboardSink.textContent = '';
    },
    { capture: true, signal }
  );

  keyboardSink.addEventListener(
    'keypress',
    (event) => {
      if (compositionInProgress) return;
      // If this is not the first keypress after a keydown, that is,
      // if this is a repeated keystroke, call the keystroke handler.
      if (keydownEvent && keypressEvent) delegate.onKeystroke(keydownEvent);

      keypressEvent = event;
    },
    { capture: true, signal }
  );

  keyboardSink.addEventListener(
    'compositionstart',
    (event: CompositionEvent) => {
      keyboardSink.textContent = '';
      compositionInProgress = true;

      delegate.onCompositionStart(event.data);
    },
    { capture: true, signal }
  );

  keyboardSink.addEventListener(
    'compositionupdate',
    (ev: CompositionEvent) => {
      if (!compositionInProgress) return;

      delegate.onCompositionUpdate(ev.data);
    },
    { capture: true, signal }
  );

  keyboardSink.addEventListener(
    'compositionend',
    (ev: CompositionEvent) => {
      keyboardSink.textContent = '';
      if (!compositionInProgress) return;

      compositionInProgress = false;
      delegate.onCompositionEnd(ev.data);
    },
    { capture: true, signal }
  );

  keyboardSink.addEventListener(
    'beforeinput',
    (ev) => ev.stopImmediatePropagation(),
    { signal }
  );

  // The `input` events is dispatched when the field is changed,
  // but no other relevant events have been triggered
  // for example with emoji input...
  keyboardSink.addEventListener(
    'input',
    (ev: InputEvent) => {
      if (compositionInProgress) return;

      keyboardSink.textContent = '';

      // If this was an `input` event sent as a result of a commit of
      // IME, ignore it.
      // (This is what FireFox does, even though the spec says it
      // shouldn't happen). See https://github.com/w3c/uievents/issues/202
      if (ev.inputType === 'insertCompositionText') return;

      // Paste is handled in paste handler
      if (ev.inputType === 'insertFromPaste') {
        ev.preventDefault();
        ev.stopPropagation();
        return;
      }

      delegate.onInput(ev.data ?? '');

      // Do not propagate the event (it crosses the shadow dom barrier)
      ev.preventDefault();
      ev.stopPropagation();
    },
    { signal }
  );

  keyboardSink.addEventListener(
    'paste',
    (event: ClipboardEvent) => {
      // In some cases (Linux browsers), the keyboard sink might not be focused
      // when doing a middle-click paste command.
      keyboardSink.focus({ preventScroll: true });
      keyboardSink.textContent = '';
      if (!delegate.onPaste(event)) event.preventDefault();
      event.stopImmediatePropagation();
    },
    { signal }
  );

  keyboardSink.addEventListener('cut', (ev) => delegate.onCut(ev), {
    capture: true,
    signal,
  });

  keyboardSink.addEventListener('copy', (ev) => delegate.onCopy(ev), {
    capture: true,
    signal,
  });

  keyboardSink.addEventListener(
    'blur',
    (event) => {
      // If we're attempting to focus the mathfield (which can happen on iOS if
      // clicking right on the border of the mathfield) ignore it
      // (preventDefault on the event doesn't work)
      if (event['relatedTarget']?.['_mathfield']?.['element'] === element) {
        keyboardSink.focus({ preventScroll: true });
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // If we're attempting to focus an element that is inside the virtual
      // keyboard, ignore the blur (this happens on iOS when doing a multi-touch
      // tap on an element inside the virtual keyboard).
      let isInsideKeyboard = false;
      let target = event.relatedTarget as HTMLElement;
      while (target) {
        if (target.classList.contains('ML__keyboard')) {
          isInsideKeyboard = true;
          break;
        }
        target = target.parentElement as HTMLElement;
      }
      if (isInsideKeyboard) {
        keyboardSink.focus({ preventScroll: true });
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // If the scrim is up, ignore blur (while the variants panel is up)
      const scrimState = Scrim.state;
      if (scrimState === 'open' || scrimState === 'opening') {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // If the relatedTarget (the element that is gaining the focus)
      // is contained in our shadow host, ignore the blur event
      if (
        event.relatedTarget ===
        ((event.target as HTMLElement).getRootNode() as any as ShadowRoot).host
      ) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (blurInProgress || focusInProgress) return;

      blurInProgress = true;
      keydownEvent = null;
      keypressEvent = null;
      delegate.onBlur();
      blurInProgress = false;
    },
    { capture: true, signal }
  );

  keyboardSink.addEventListener(
    'focus',
    (_evt) => {
      if (blurInProgress || focusInProgress) return;

      focusInProgress = true;
      delegate.onFocus();

      focusInProgress = false;
    },
    { capture: true, signal }
  );

  return {
    dispose: (): void => controller.abort(),
    cancelComposition: (): void => {
      // Due to the order of event, we may not have
      // received `compositionstart` by the time we decide
      // to cancel the composition.
      if (!compositionInProgress) return;
      keyboardSink.blur();
      requestAnimationFrame(() => keyboardSink.focus({ preventScroll: true }));
    },

    blur: (): void => {
      if (typeof keyboardSink.blur === 'function') keyboardSink.blur();
    },

    focus: (): void => {
      if (!focusInProgress && typeof keyboardSink.focus === 'function')
        keyboardSink.focus({ preventScroll: true });
    },

    hasFocus: (): boolean => {
      return deepActiveElement() === keyboardSink;
    },

    setAriaLabel: (value: string): void =>
      keyboardSink.setAttribute('aria-label', value),

    setValue: (value: string): void => {
      keyboardSink.textContent = value;
      // Move sink offscreen (Safari will display a visible selection otherwise)
      keyboardSink.style.left = `-1000px`;
      // Select the elements in the sink (Safari will not enable copy/paste if there isn't a selection)
      window.getSelection()?.selectAllChildren(keyboardSink);
    },

    moveTo: (x: number, y: number): void => {
      // Move the sink on screen, used when composition with an IME is in
      // progress so its accessory windows appear at the right place
      keyboardSink.style.top = `${y}px`;
      keyboardSink.style.left = `${x}px`;
    },
  };
}

export function keyboardEventToChar(evt?: KeyboardEvent): string {
  if (!evt || !mightProducePrintableCharacter(evt)) return '';
  let result: string | undefined;
  if (evt.key === 'Unidentified') {
    // On Android, the evt.key seems to always be 'Unidentified'.
    // Get the value entered in the event target
    if (evt.target) result = (evt.target as HTMLInputElement).value;
  }

  // Note that in some  rare cases, the evt.key can be a string of multiple
  // char. This happens on Windows Swedish keyboard with Firefox, where the
  // `¨` key is returned as `¨¨`.
  result = result ?? evt.key ?? evt.code;
  if (
    /^(Dead|Return|Enter|Tab|Escape|Delete|PageUp|PageDown|Home|End|Help|ArrowLeft|ArrowRight|ArrowUp|ArrowDown)$/.test(
      result
    )
  )
    result = '';

  return result;
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
export function keyboardEventToString(evt: KeyboardEvent): string {
  evt = normalizeKeyboardEvent(evt);

  const modifiers: string[] = [];

  if (evt.ctrlKey) modifiers.push('ctrl');
  if (evt.metaKey) modifiers.push('meta');
  if (evt.altKey) modifiers.push('alt');
  if (evt.shiftKey) modifiers.push('shift');

  // If no modifiers, simply return the key name
  if (modifiers.length === 0) return `[${evt.code}]`;

  modifiers.push(`[${evt.code}]`);

  return modifiers.join('+');
}
