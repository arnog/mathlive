import { on } from './utils';
import {
  ExecuteCommandFunction,
  SelectorPrivate,
} from '../editor/commands-definitions';

export type ButtonHandlersRecord = {
  default: SelectorPrivate | [SelectorPrivate, ...any[]];
  pressed?: SelectorPrivate | [SelectorPrivate, ...any[]];
  alt?: SelectorPrivate | [SelectorPrivate, ...any[]];
  altshift?: SelectorPrivate | [SelectorPrivate, ...any[]];
  shift?: SelectorPrivate | [SelectorPrivate, ...any[]];
  pressAndHoldStart?: SelectorPrivate | [SelectorPrivate, ...any[]];
  pressAndHoldEnd?: SelectorPrivate | [SelectorPrivate, ...any[]];
};

function isButtonHandlersRecord(x: ButtonHandlers): x is ButtonHandlersRecord {
  return typeof x === 'object' && ('default' in x || 'pressed' in x);
}

export type ButtonHandlers =
  | SelectorPrivate
  | [SelectorPrivate, ...any[]]
  | ButtonHandlersRecord;

/**
 * Attach event handlers to an element so that it will react by executing
 * a command when pressed.
 * `"command"` can be:
 * - a string, a single selector
 * - an array, whose first element is a selector followed by one or more arguments.
 * - an object, with the following keys:
 *    * 'default': command performed on up, with a down + up sequence with no
 *      delay between down and up
 *    * 'alt', 'shift', 'altshift' keys: command performed on up with
 *      one of these modifiers pressed
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
  executeCommand: ExecuteCommandFunction,
  element: HTMLElement,
  command: ButtonHandlers
): void {
  if (isButtonHandlersRecord(command)) {
    // Attach the default (no modifiers pressed) command to the element
    if (command.default)
      element.dataset.command = JSON.stringify(command.default);

    if (command.alt) element.dataset.commandAlt = JSON.stringify(command.alt);

    if (command.altshift)
      element.dataset.commandAltshift = JSON.stringify(command.altshift);

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
  } else {
    // We need to turn the command into a string to attach it to the dataset
    // associated with the button (the command could be an array made of a
    // selector and one or more parameters)
    element.dataset.command = JSON.stringify(command);
  }

  let pressHoldStart: number;
  let pressHoldElement: HTMLElement;
  let touchID;
  let syntheticTarget; // Target while touch move
  let pressAndHoldTimer;
  on(
    element,
    'mousedown touchstart:passive',
    (ev: MouseEvent & TouchEvent & PointerEvent) => {
      if (ev.type !== 'mousedown' || ev.buttons === 1) {
        // The primary button was pressed or the screen was tapped.
        ev.stopPropagation();
        // Can't preventDefault() in a passive listener
        if (ev.type !== 'touchstart') ev.preventDefault();

        // Safari on iOS will aggressively attempt to select when there is a long
        // press. Prevent userSelect for the entire document.
        // document.body.style.userSelect = 'none';
        // document.body.style['-webkit-touch-callout'] = 'none';
        document.body.style['-webkit-user-select'] = 'none';

        element.classList.add('is-pressed');
        pressHoldStart = Date.now();
        // Record the ID of the primary touch point for tracking on touchmove
        if (ev.type === 'touchstart') touchID = ev.changedTouches[0].identifier;

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
          pressHoldElement = element;
          if (pressAndHoldTimer) clearTimeout(pressAndHoldTimer);

          pressAndHoldTimer = setTimeout(() => {
            if (element.classList.contains('is-pressed'))
              executeCommand(JSON.parse(pressAndHoldStartCommand));
          }, 300);
        }
      }
    }
  );
  on(element, 'mouseleave touchcancel', () => {
    element.classList.remove('is-pressed');
  });
  on(
    element,
    'touchmove:passive',
    (ev: MouseEvent & TouchEvent & PointerEvent) => {
      // Unlike with mouse tracking, touch tracking only sends events
      // to the target that was originally tapped on. For consistency,
      // we want to mimic the behavior of the mouse interaction by
      // tracking the touch events and dispatching them to potential targets
      // ev.preventDefault(); // can't preventDefault inside a passive event handler
      for (let i = 0; i < ev.changedTouches.length; i++) {
        if (ev.changedTouches[i].identifier === touchID) {
          // Found a touch matching our primary/tracked touch
          const targets = document.elementsFromPoint(
            ev.changedTouches[i].clientX,
            ev.changedTouches[i].clientY
          );
          const target = targets[targets.length - 1];
          if (target !== syntheticTarget && syntheticTarget) {
            syntheticTarget.dispatchEvent(new MouseEvent('mouseleave'), {
              bubbles: true,
            });
            syntheticTarget = null;
          }

          if (target) {
            syntheticTarget = target;
            target.dispatchEvent(
              new MouseEvent('mouseenter', {
                bubbles: true,
                buttons: 1,
              })
            );
          }
        }
      }
    }
  );
  on(element, 'mouseenter', (ev: MouseEvent & TouchEvent & PointerEvent) => {
    if (ev.buttons === 1) element.classList.add('is-pressed');
  });
  on(
    element,
    'mouseup touchend click',
    (ev: MouseEvent & TouchEvent & PointerEvent) => {
      document.body.style['-webkit-user-select'] = '';
      if (syntheticTarget) {
        ev.stopPropagation();
        ev.preventDefault();
        const target = syntheticTarget;
        syntheticTarget = null;
        target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        return;
      }

      element.classList.remove('is-pressed');
      element.classList.add('is-active');
      if (ev.type === 'click' && ev.detail !== 0) {
        // This is a click event triggered by a mouse interaction
        // (and not a keyboard interaction)
        // Ignore it, we'll handle the mouseup (or touchend) instead.
        ev.stopPropagation();
        ev.preventDefault();
        return;
      }

      // Since we want the active state to be visible for a while,
      // use a timer to remove it after a short delay
      setTimeout(() => element.classList.remove('is-active'), 150);
      let command = element.getAttribute('data-command-press-and-hold-end');
      const now = Date.now();
      // If the button has not been pressed for very long or if we were
      // not the button that started the press and hold, don't consider
      // it a press-and-hold.
      if (element !== pressHoldElement || now < pressHoldStart + 300)
        command = null;

      if (!command && ev.altKey && ev.shiftKey)
        command = element.getAttribute('data-command-altshift');

      if (!command && ev.altKey)
        command = element.getAttribute('data-command-alt');

      if (!command && ev.shiftKey)
        command = element.getAttribute('data-command-shift');

      if (!command) command = element.getAttribute('data-command');

      if (command) {
        // Parse the JSON to get the command (and its optional arguments)
        // and perform it
        executeCommand(JSON.parse(command));
      }

      ev.stopPropagation();
      ev.preventDefault();
    }
  );
}
