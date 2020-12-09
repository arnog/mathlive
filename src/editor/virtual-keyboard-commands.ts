import { isArray } from '../common/types';

import {
    makeKeycap,
    makeKeyboardElement,
    hideAlternateKeys,
    unshiftKeyboardLayer,
    onUndoStateChanged,
    VirtualKeyboard,
} from './virtual-keyboard-utils';
import { getSharedElement } from '../editor-mathfield/utils';
import { register as registerCommand, SelectorPrivate } from './commands';
import { on } from '../editor-mathfield/utils';

export { unshiftKeyboardLayer };
export { hideAlternateKeys };

export function showAlternateKeys(
    keyboard: VirtualKeyboard,
    keycap: string,
    altKeys: string | any[]
): boolean {
    const altContainer = getSharedElement(
        'mathlive-alternate-keys-panel',
        'ML__keyboard alternate-keys'
    );
    if (keyboard.element.classList.contains('material')) {
        altContainer.classList.add('material');
    }
    if (altKeys.length >= 7) {
        // Width 4
        altContainer.style.width = '286px';
    } else if (altKeys.length === 4 || altKeys.length === 2) {
        // Width 2
        altContainer.style.width = '146px';
    } else if (altKeys.length === 1) {
        // Width 1
        altContainer.style.width = '86px';
    } else {
        // Width 3
        altContainer.style.width = '146px';
    }
    // Reset container height
    altContainer.style.height = 'auto';
    let markup = '';
    for (const altKey of altKeys) {
        markup += '<li';
        if (typeof altKey === 'string') {
            markup += ' data-latex="' + altKey.replace(/"/g, '&quot;') + '"';
        } else {
            if (altKey.latex) {
                markup +=
                    ' data-latex="' +
                    altKey.latex.replace(/"/g, '&quot;') +
                    '"';
            }
            if (altKey.content) {
                markup +=
                    ' data-content="' +
                    altKey.content.replace(/"/g, '&quot;') +
                    '"';
            }
            if (altKey.insert) {
                markup +=
                    ' data-insert="' +
                    altKey.insert.replace(/"/g, '&quot;') +
                    '"';
            }
            if (altKey.command) {
                markup +=
                    " data-command='" +
                    altKey.command.replace(/"/g, '&quot;') +
                    "'";
            }
            if (altKey.aside) {
                markup +=
                    ' data-aside="' +
                    altKey.aside.replace(/"/g, '&quot;') +
                    '"';
            }
            if (altKey.classes) {
                markup += ' data-classes="' + altKey.classes + '"';
            }
        }
        markup += '>';
        markup += altKey.label || '';
        markup += '</li>';
    }
    markup = '<ul>' + markup + '</ul>';
    altContainer.innerHTML = keyboard.options.createHTML(markup);
    makeKeycap(
        keyboard,
        [].slice.call(altContainer.getElementsByTagName('li')),
        'performAlternateKeys'
    );
    const keycapEl = keyboard?.element.querySelector(
        'div.keyboard-layer.is-visible div.rows ul li[data-alt-keys="' +
            keycap +
            '"]'
    );
    const position = keycapEl.getBoundingClientRect();
    if (position) {
        if (position.top - altContainer.clientHeight < 0) {
            // altContainer.style.maxWidth = '320px';  // Up to six columns
            altContainer.style.width = 'auto';
            if (altKeys.length <= 6) {
                altContainer.style.height = '56px'; // 1 row
            } else if (altKeys.length <= 12) {
                altContainer.style.height = '108px'; // 2 rows
            } else if (altKeys.length <= 18) {
                altContainer.style.height = '205px'; // 3 rows
            } else {
                altContainer.classList.add('compact');
            }
        }
        const top =
            (position.top - altContainer.clientHeight + 5).toString() + 'px';
        const left =
            Math.max(
                0,
                Math.min(
                    window.innerWidth - altContainer.offsetWidth,
                    (position.left +
                        position.right -
                        altContainer.offsetWidth) /
                        2
                )
            ) + 'px';
        altContainer.style.transform = 'translate(' + left + ',' + top + ')';
        altContainer.classList.add('is-visible');
    }
    return false;
}

/*
 * Alternate options are displayed when a key on the virtual keyboard is pressed
 * and held.
 *
 */
registerCommand(
    {
        showAlternateKeys: showAlternateKeys,
    },
    { target: 'virtual-keyboard' }
);

export function switchKeyboardLayer(
    keyboard: VirtualKeyboard,
    layer: string
): boolean {
    // TODO This check are really required?
    if (keyboard.options.virtualKeyboardMode !== 'off') {
        if (
            layer !== 'lower-command' &&
            layer !== 'upper-command' &&
            layer !== 'symbols-command'
        ) {
            // If we switch to a non-command keyboard layer, first exit command mode.
            keyboard.executeCommand('complete');
        }
        showVirtualKeyboard(keyboard);
        // If the alternate keys panel was visible, hide it
        hideAlternateKeys();
        // If we were in a temporarily shifted state (shift-key held down)
        // restore our state before switching to a new layer.
        unshiftKeyboardLayer(keyboard);
        const layers = keyboard?.element.getElementsByClassName(
            'keyboard-layer'
        );
        // Search for the requested layer
        let found = false;
        for (let i = 0; i < layers.length; i++) {
            if ((layers[i] as HTMLElement).dataset.layer === layer) {
                found = true;
                break;
            }
        }
        // We did find the layer, switch to it.
        // If we didn't find it, do nothing and keep the current layer
        if (found) {
            for (let i = 0; i < layers.length; i++) {
                if ((layers[i] as HTMLElement).dataset.layer === layer) {
                    layers[i].classList.add('is-visible');
                } else {
                    layers[i].classList.remove('is-visible');
                }
            }
        }
        keyboard.focusMathfield();
    }
    return true;
}

export function shiftKeyboardLayer(keyboard: VirtualKeyboard): boolean {
    const keycaps = keyboard?.element.querySelectorAll(
        'div.keyboard-layer.is-visible .rows .keycap, div.keyboard-layer.is-visible .rows .action'
    );
    if (keycaps) {
        for (let i = 0; i < keycaps.length; i++) {
            const keycap = keycaps[i];
            let shiftedContent = keycap.getAttribute('data-shifted');
            if (shiftedContent || /^[a-z]$/.test(keycap.innerHTML)) {
                keycap.setAttribute('data-unshifted-content', keycap.innerHTML);
                if (!shiftedContent) {
                    shiftedContent = keycap.innerHTML.toUpperCase();
                }
                keycap.innerHTML = keyboard.options.createHTML(shiftedContent);
                const command = keycap.getAttribute('data-command');
                if (command) {
                    keycap.setAttribute('data-unshifted-command', command);
                    const shifteCommand = keycap.getAttribute(
                        'data-shifted-command'
                    );
                    if (shifteCommand) {
                        keycap.setAttribute('data-command', shifteCommand);
                    } else {
                        const commandObj = JSON.parse(command);
                        if (isArray(commandObj)) {
                            commandObj[1] = commandObj[1].toUpperCase();
                        }
                        keycap.setAttribute(
                            'data-command',
                            JSON.stringify(commandObj)
                        );
                    }
                }
            }
        }
    }
    return false;
}

/*
 * Temporarily change the labels and the command of the keys
 * (for example when a modifier key is held down.)
 */
registerCommand(
    {
        shiftKeyboardLayer: shiftKeyboardLayer,
    },
    { target: 'virtual-keyboard' }
);

export function performAlternateKeys(
    keyboard: VirtualKeyboard,
    command: SelectorPrivate | [SelectorPrivate, ...any[]]
): boolean {
    hideAlternateKeys();
    return keyboard.executeCommand(command);
}

export function insertAndUnshiftKeyboardLayer(
    keyboard: VirtualKeyboard,
    c: string
): boolean {
    keyboard.executeCommand(['insert', c]);
    unshiftKeyboardLayer(keyboard);
    return true;
}

registerCommand(
    {
        hideAlternateKeys: () => hideAlternateKeys(),

        /*
         * The command invoked when an alternate key is pressed.
         * We need to hide the Alternate Keys panel, then perform the
         * command.
         */
        performAlternateKeys: performAlternateKeys,
        switchKeyboardLayer: (keyboard: VirtualKeyboard, layer) =>
            switchKeyboardLayer(keyboard, layer),
        unshiftKeyboardLayer: (keyboard: VirtualKeyboard) =>
            unshiftKeyboardLayer(keyboard),
        insertAndUnshiftKeyboardLayer: insertAndUnshiftKeyboardLayer,
    },
    { target: 'virtual-keyboard' }
);

export function toggleVirtualKeyboardAlt(keyboard: VirtualKeyboard): boolean {
    let hadAltTheme = false;
    if (keyboard?.element) {
        hadAltTheme = keyboard?.element.classList.contains('material');
        keyboard.dispose();
    }
    showVirtualKeyboard(keyboard, hadAltTheme ? '' : 'material');
    return false;
}

export function toggleVirtualKeyboardShift(keyboard: VirtualKeyboard): boolean {
    keyboard.options.virtualKeyboardLayout = {
        qwerty: 'azerty',

        azerty: 'qwertz',
        qwertz: 'dvorak',
        dvorak: 'colemak',
        colemak: 'qwerty',
    }[keyboard.options.virtualKeyboardLayout];
    const layer =
        keyboard?.element.querySelector('div.keyboard-layer.is-visible').id ??
        '';
    if (keyboard) {
        keyboard.dispose();
    }
    showVirtualKeyboard(keyboard);
    if (layer) {
        switchKeyboardLayer(keyboard, layer);
    }
    return false;
}

registerCommand(
    {
        /* Toggle the virtual keyboard, but switch to the alternate theme if available */
        toggleVirtualKeyboardAlt: toggleVirtualKeyboardAlt,
        /** Toggle the virtual keyboard, but switch another keyboard layout */
        toggleVirtualKeyboardShift: toggleVirtualKeyboardShift,
    },
    { target: 'virtual-keyboard' }
);

export function showVirtualKeyboard(
    keyboard: VirtualKeyboard,
    theme: 'apple' | 'material' | '' = ''
): boolean {
    keyboard.visible = false;
    toggleVirtualKeyboard(keyboard, theme);
    return false;
}

export function hideVirtualKeyboard(keyboard: VirtualKeyboard): boolean {
    keyboard.visible = true;
    toggleVirtualKeyboard(keyboard);
    return false;
}

function toggleVirtualKeyboard(
    keyboard: VirtualKeyboard,
    theme?: 'apple' | 'material' | ''
): boolean {
    keyboard.visible = !keyboard.visible;
    if (keyboard.visible) {
        keyboard.focusMathfield();
        if (keyboard.element) {
            keyboard.element.classList.add('is-visible');
        } else {
            // Construct the virtual keyboard
            keyboard.element = makeKeyboardElement(keyboard, theme);
            // Let's make sure that tapping on the keyboard focuses the field
            on(keyboard.element, 'touchstart:passive mousedown', () =>
                keyboard.focusMathfield()
            );
            document.body.appendChild(keyboard.element);
        }
        // For the transition effect to work, the property has to be changed
        // after the insertion in the DOM. Use setTimeout
        window.setTimeout(() => {
            keyboard?.element.classList.add('is-visible');
        }, 1);
    } else if (keyboard?.element) {
        keyboard.element.classList.remove('is-visible');
        keyboard.element.dispatchEvent(
            new Event('virtual-keyboard-toggle', {
                bubbles: true,
                cancelable: false,
            })
        );
    }
    keyboard.stateChanged();
    return false;
}

registerCommand(
    {
        toggleVirtualKeyboard: (keyboard: VirtualKeyboard, theme) =>
            toggleVirtualKeyboard(keyboard, theme),
        hideVirtualKeyboard: (keyboard: VirtualKeyboard) =>
            hideVirtualKeyboard(keyboard),
        showVirtualKeyboard: (keyboard: VirtualKeyboard, theme): boolean =>
            showVirtualKeyboard(keyboard, theme),
        onUndoStateChanged: (
            keyboard: VirtualKeyboard,
            canUndoState,
            canRedoState
        ) => onUndoStateChanged(keyboard, canUndoState, canRedoState),
    },
    { target: 'virtual-keyboard' }
);
