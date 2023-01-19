import { on } from './utils';
import {
  ExecuteCommandFunction,
  SelectorPrivate,
} from '../editor/commands-definitions';

export type ButtonHandlers = {
  default: SelectorPrivate | [SelectorPrivate, ...any[]];
  pressed?: SelectorPrivate | [SelectorPrivate, ...any[]];
  alt?: SelectorPrivate | [SelectorPrivate, ...any[]];
  shift?: SelectorPrivate | [SelectorPrivate, ...any[]];
  pressAndHoldStart?: SelectorPrivate | [SelectorPrivate, ...any[]];
  pressAndHoldEnd?: SelectorPrivate | [SelectorPrivate, ...any[]];
};

/**
 * Attach event handlers to an element so that it will react by executing
 * a command when pressed.
 * `"command"` can be:
 * - a string, a single selector
 * - an array, whose first element is a selector followed by one or more arguments.
 * - an object, with the following keys:
 *    * 'default': command performed on up, with a down + up sequence with no
 *      delay between down and up
 *    * 'pressed': command performed on 'down'
 *    * 'pressAndHoldStart': command performed after a tap/down followed by a
 * delay (optional)
 *    * 'pressAndHoldEnd': command performed on up, if there was a delay
 *     between down and up, if absent, 'default' is performed
 * The value of the keys specify which selector (string
 * or array) to perform depending on the keyboard state when the button is
 * pressed.
 *
 * The 'pressed' and 'active' classes will get added to
 * the element, as the :hover and :active pseudo-classes are not reliable
 * (at least on Chrome Android).
 *
 */
export function attachButtonHandlers(
  element: HTMLElement,
  executeCommand: ExecuteCommandFunction,
  command: ButtonHandlers
): void {
  // Attach the default (no modifiers pressed) command to the element
  if (command.default)
    element.dataset.command = JSON.stringify(command.default);

  if (command.alt) element.dataset.commandAlt = JSON.stringify(command.alt);

  if (command.shift)
    element.dataset.commandShift = JSON.stringify(command.shift);

  // .pressed: command to perform when the button is pressed (i.e.
  // on mouse down/touch). Otherwise the command is performed when
  // the button is released
  if (command.pressed)
    element.dataset.commandPressed = JSON.stringify(command.pressed);

  if (command.pressAndHoldStart) {
    element.dataset.commandPressAndHoldStart = JSON.stringify(
      command.pressAndHoldStart
    );
  }

  if (command.pressAndHoldEnd) {
    element.dataset.commandPressAndHoldEnd = JSON.stringify(
      command.pressAndHoldEnd
    );
  }

  let pressHoldStart: number;
  let pressAndHoldTimer;

  on(element, 'pointerdown:passive', (ev: PointerEvent) => {
    if (ev.buttons !== 1) return;

    // The primary button was pressed or the screen was tapped.
    ev.stopPropagation();

    pressHoldStart = Date.now();
    element.classList.add('is-pressed');

    const target = ev.target! as Element;
    if (target.hasPointerCapture(ev.pointerId))
      target.releasePointerCapture(ev.pointerId);

    // Parse the JSON to get the command (and its optional arguments)
    // and perform it immediately
    const command = element.getAttribute('data-command-pressed');
    if (command) executeCommand(JSON.parse(command));

    // If there is a `press and hold start` command, perform it
    // after a delay, if we're still pressed by then.
    const pressAndHoldStartCommand = element.getAttribute(
      'data-command-press-and-hold-start'
    );
    if (pressAndHoldStartCommand) {
      if (pressAndHoldTimer) clearTimeout(pressAndHoldTimer);

      pressAndHoldTimer = setTimeout(() => {
        if (element.classList.contains('is-pressed')) {
          element.classList.remove('is-pressed');
          executeCommand(JSON.parse(pressAndHoldStartCommand));
        }
      }, 300);
    }
  });
  on(element, 'pointerenter', (ev: PointerEvent) => {
    const target = ev.target! as Element;
    if (target.hasPointerCapture(ev.pointerId))
      target.releasePointerCapture(ev.pointerId);
    if (ev.buttons === 1) element.classList.add('is-pressed');
  });
  on(element, 'pointercancel', () => element.classList.remove('is-pressed'));
  on(element, 'pointerleave', () => element.classList.remove('is-pressed'));
  on(element, 'pointerup', (ev: PointerEvent) => {
    const wasPressed = element.classList.contains('is-pressed');

    element.classList.remove('is-pressed');
    element.classList.add('is-active');

    // Since we want the active state to be visible for a while,
    // use a timer to remove it after a short delay
    setTimeout(() => element.classList.remove('is-active'), 150);

    // If the button has been pressed for a while but is not in the "pressed"
    // state (the pressed state is removed when the press and hold starts)
    // consider it a press-and-hold.
    let command =
      Date.now() >= pressHoldStart && !wasPressed
        ? element.getAttribute('data-command-press-and-hold-end')
        : null;

    if (!command && ev.altKey)
      command = element.getAttribute('data-command-alt');

    if (!command && ev.shiftKey)
      command = element.getAttribute('data-command-shift');

    if (!command) command = element.getAttribute('data-command');

    if (command) executeCommand(JSON.parse(command));

    ev.stopPropagation();
    ev.preventDefault();
  });
}
