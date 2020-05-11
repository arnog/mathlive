import { on } from './mathfield-utils';
import type { MathfieldPrivate } from './mathfield-class';

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
    mathfield: MathfieldPrivate,
    el: Element,
    command:
        | string
        | {
              default: string | any[];
              pressed?: string | any[];
              acceptSuggestion?: boolean;
              alt?: string | any[];
              altshift?: string | any[];
              shift?: string | any[];
              pressAndHoldStart?: string | any[];
              pressAndHoldEnd?: string | any[];
          }
): void {
    if (typeof command === 'object' && (command.default || command.pressed)) {
        // Attach the default (no modifiers pressed) command to the element
        if (command.default) {
            el.setAttribute(
                'data-' + mathfield.config.namespace + 'command',
                JSON.stringify(command.default)
            );
        }
        if (command.alt) {
            el.setAttribute(
                'data-' + mathfield.config.namespace + 'command-alt',
                JSON.stringify(command.alt)
            );
        }
        if (command.altshift) {
            el.setAttribute(
                'data-' + mathfield.config.namespace + 'command-altshift',
                JSON.stringify(command.altshift)
            );
        }
        if (command.shift) {
            el.setAttribute(
                'data-' + mathfield.config.namespace + 'command-shift',
                JSON.stringify(command.shift)
            );
        }
        // .pressed: command to perform when the button is pressed (i.e.
        // on mouse down/touch). Otherwise the command is performed when
        // the button is released
        if (command.pressed) {
            el.setAttribute(
                'data-' + mathfield.config.namespace + 'command-pressed',
                JSON.stringify(command.pressed)
            );
        }
        if (command.pressAndHoldStart) {
            el.setAttribute(
                'data-' +
                    mathfield.config.namespace +
                    'command-pressAndHoldStart',
                JSON.stringify(command.pressAndHoldStart)
            );
        }
        if (command.pressAndHoldEnd) {
            el.setAttribute(
                'data-' +
                    mathfield.config.namespace +
                    'command-pressAndHoldEnd',
                JSON.stringify(command.pressAndHoldEnd)
            );
        }
    } else {
        // We need to turn the command into a string to attach it to the dataset
        // associated with the button (the command could be an array made of a
        // selector and one or more parameters)
        el.setAttribute(
            'data-' + mathfield.config.namespace + 'command',
            JSON.stringify(command)
        );
    }
    let pressHoldStart;
    let pressHoldElement;
    let touchID;
    let syntheticTarget; // Target while touch move
    let pressAndHoldTimer;
    on(el, 'mousedown touchstart:passive', function (ev) {
        if (ev.type !== 'mousedown' || ev.buttons === 1) {
            // The primary button was pressed or the screen was tapped.
            ev.stopPropagation();
            ev.preventDefault();
            el.classList.add('pressed');
            pressHoldStart = Date.now();
            // Record the ID of the primary touch point for tracking on touchmove
            if (ev.type === 'touchstart') {
                touchID = ev.changedTouches[0].identifier;
            }
            // Parse the JSON to get the command (and its optional arguments)
            // and perform it immediately
            const command = el.getAttribute(
                'data-' + mathfield.config.namespace + 'command-pressed'
            );
            if (command) {
                mathfield.$perform(JSON.parse(command));
            }
            // If there is a `press and hold start` command, perform it
            // after a delay, if we're still pressed by then.
            const pressAndHoldStartCommand = el.getAttribute(
                'data-' +
                    mathfield.config.namespace +
                    'command-pressAndHoldStart'
            );
            if (pressAndHoldStartCommand) {
                pressHoldElement = el;
                if (pressAndHoldTimer) {
                    clearTimeout(pressAndHoldTimer);
                }
                pressAndHoldTimer = window.setTimeout(function () {
                    if (el.classList.contains('pressed')) {
                        mathfield.$perform(
                            JSON.parse(pressAndHoldStartCommand)
                        );
                    }
                }, 300);
            }
        }
    });
    on(el, 'mouseleave touchcancel', function () {
        el.classList.remove('pressed');
        // let command = el.getAttribute('data-' + mathfield.config.namespace +
        //     'command-pressAndHoldEnd');
        // const now = Date.now();
        // if (command && now > pressHoldStart + 300) {
        //     mathfield.$perform(JSON.parse(command));
        // }
    });
    on(el, 'touchmove:passive', function (ev) {
        // Unlike with mouse tracking, touch tracking only sends events
        // to the target that was originally tapped on. For consistency,
        // we want to mimic the behavior of the mouse interaction by
        // tracking the touch events and dispatching them to potential targets
        ev.preventDefault();
        for (let i = 0; i < ev.changedTouches.length; i++) {
            if (ev.changedTouches[i].identifier === touchID) {
                // Found a touch matching our primary/tracked touch
                const target = document.elementFromPoint(
                    ev.changedTouches[i].clientX,
                    ev.changedTouches[i].clientY
                );
                if (target !== syntheticTarget && syntheticTarget) {
                    syntheticTarget.dispatchEvent(
                        new MouseEvent('mouseleave'),
                        { bubbles: true }
                    );
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
    });
    on(el, 'mouseenter', function (ev) {
        if (ev.buttons === 1) {
            el.classList.add('pressed');
        }
    });
    on(el, 'mouseup touchend click', function (ev) {
        if (syntheticTarget) {
            ev.stopPropagation();
            ev.preventDefault();
            const target = syntheticTarget;
            syntheticTarget = null;
            target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            return;
        }
        el.classList.remove('pressed');
        el.classList.add('active');
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
        window.setTimeout(function () {
            el.classList.remove('active');
        }, 150);
        let command = el.getAttribute(
            'data-' + mathfield.config.namespace + 'command-pressAndHoldEnd'
        );
        const now = Date.now();
        // If the button has not been pressed for very long or if we were
        // not the button that started the press and hold, don't consider
        // it a press-and-hold.
        if (el !== pressHoldElement || now < pressHoldStart + 300) {
            command = undefined;
        }
        if (!command && ev.altKey && ev.shiftKey) {
            command = el.getAttribute(
                'data-' + mathfield.config.namespace + 'command-altshift'
            );
        }
        if (!command && ev.altKey) {
            command = el.getAttribute(
                'data-' + mathfield.config.namespace + 'command-alt'
            );
        }
        if (!command && ev.shiftKey) {
            command = el.getAttribute(
                'data-' + mathfield.config.namespace + 'command-shift'
            );
        }
        if (!command) {
            command = el.getAttribute(
                'data-' + mathfield.config.namespace + 'command'
            );
        }
        if (command) {
            // Parse the JSON to get the command (and its optional arguments)
            // and perform it
            mathfield.$perform(JSON.parse(command));
        }
        ev.stopPropagation();
        ev.preventDefault();
    });
}
