import { KeyboardModifiers } from './types';

export function eventLocation(
  evt: Event
): { x: number; y: number } | undefined {
  if (evt instanceof MouseEvent || evt instanceof PointerEvent)
    return { x: evt.clientX, y: evt.clientY };

  if (evt instanceof TouchEvent) {
    const result = [...evt.touches].reduce(
      (acc, x) => ({ x: acc.x + x.clientX, y: acc.y + x.clientY }),
      { x: 0, y: 0 }
    );
    const l = evt.touches.length;
    return { x: result.x / l, y: result.y / l };
  }

  return undefined;
}

// export function eventPointerCount(evt: Event): number {
//   if (evt instanceof MouseEvent) return 1;

//   if (evt instanceof TouchEvent) return evt.touches.length;

//   return 0;
// }

export function keyboardModifiersFromEvent(ev: Event): KeyboardModifiers {
  const result = {
    alt: false,
    control: false,
    shift: false,
    meta: false,
  };
  if (
    ev instanceof MouseEvent ||
    ev instanceof PointerEvent ||
    ev instanceof TouchEvent ||
    ev instanceof KeyboardEvent
  ) {
    if (ev.altKey) result.alt = true;
    if (ev.ctrlKey) result.control = true;
    if (ev.metaKey) result.meta = true;
    if (ev.shiftKey) result.shift = true;
  }

  return result;
}

export function equalKeyboardModifiers(
  a?: KeyboardModifiers,
  b?: KeyboardModifiers
): boolean {
  if ((!a && b) || (a && !b)) return false;
  if (!a || !b) return true;
  return (
    a.alt === b.alt &&
    a.control === b.control &&
    a.shift === b.shift &&
    a.meta === b.meta
  );
}

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
  // Ignore ctrl/cmd-combinations but not shift/alt-combinations
  if (evt.ctrlKey || evt.metaKey) return false;

  // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
  if (['Dead', 'Process'].includes(evt.key)) return false;

  // When issued via a composition, the `code` field is empty
  if (evt.code === '') return true;

  return PRINTABLE_KEYCODE.has(evt.code);
}

export function deepActiveElement(): HTMLOrSVGElement | null {
  let a = document.activeElement;
  while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;

  return a as unknown as HTMLOrSVGElement;
}
