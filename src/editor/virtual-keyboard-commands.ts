import { isArray } from '../common/types';

import {
    makeKeycap,
    makeKeyboard,
    hideAlternateKeys,
    unshiftKeyboardLayer,
} from './virtual-keyboard-utils';
import { complete } from './autocomplete';
import { getSharedElement } from './mathfield-utils';
import { register as registerCommand } from './commands';
import { on } from './mathfield-utils';
import type { MathfieldPrivate } from './mathfield-class';
/*
 * Alternate options are displayed when a key on the virtual keyboard is pressed
 * and held.
 *
 */
registerCommand(
    {
        showAlternateKeys: (mathfield: MathfieldPrivate, keycap, altKeys) => {
            const altContainer = getSharedElement(
                'mathlive-alternate-keys-panel',
                'ML__keyboard alternate-keys'
            );
            if (mathfield.virtualKeyboard.classList.contains('material')) {
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
                    markup +=
                        ' data-latex="' + altKey.replace(/"/g, '&quot;') + '"';
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
            altContainer.innerHTML = mathfield.config.createHTML(markup);
            makeKeycap(
                mathfield,
                [].slice.call(altContainer.getElementsByTagName('li')),
                'performAlternateKeys'
            );
            const keycapEl = mathfield.virtualKeyboard.querySelector(
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
                    } else {
                        altContainer.style.height = '205px'; // 3 rows
                    }
                }
                const top =
                    (position.top - altContainer.clientHeight + 5).toString() +
                    'px';
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
                altContainer.style.transform =
                    'translate(' + left + ',' + top + ')';
                altContainer.classList.add('is-visible');
            }
            return false;
        },
    },
    { target: 'virtual-keyboard' }
);

export function switchKeyboardLayer(
    mathfield: MathfieldPrivate,
    layer: string
): boolean {
    if (mathfield.config.virtualKeyboardMode !== 'off') {
        if (
            layer !== 'lower-command' &&
            layer !== 'upper-command' &&
            layer !== 'symbols-command'
        ) {
            // If we switch to a non-command keyboard layer, first exit command mode.
            complete(mathfield);
        }
        showVirtualKeyboard(mathfield);
        // If the alternate keys panel was visible, hide it
        hideAlternateKeys(mathfield);
        // If we were in a temporarily shifted state (shift-key held down)
        // restore our state before switching to a new layer.
        unshiftKeyboardLayer(mathfield);
        const layers = mathfield.virtualKeyboard.getElementsByClassName(
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
        mathfield.$focus();
    }
    return true;
}

/*
 * Temporarily change the labels and the command of the keys
 * (for example when a modifier key is held down.)
 */
registerCommand(
    {
        shiftKeyboardLayer: (mathfield: MathfieldPrivate) => {
            const keycaps = mathfield.virtualKeyboard.querySelectorAll(
                'div.keyboard-layer.is-visible .rows .keycap, div.keyboard-layer.is-visible .rows .action'
            );
            if (keycaps) {
                for (let i = 0; i < keycaps.length; i++) {
                    const keycap = keycaps[i];
                    let shiftedContent = keycap.getAttribute('data-shifted');
                    if (shiftedContent || /^[a-z]$/.test(keycap.innerHTML)) {
                        keycap.setAttribute(
                            'data-unshifted-content',
                            keycap.innerHTML
                        );
                        if (!shiftedContent) {
                            shiftedContent = keycap.innerHTML.toUpperCase();
                        }
                        keycap.innerHTML = mathfield.config.createHTML(
                            shiftedContent
                        );
                        const command = keycap.getAttribute(
                            'data-' + mathfield.config.namespace + 'command'
                        );
                        if (command) {
                            keycap.setAttribute(
                                'data-unshifted-command',
                                command
                            );
                            const shifteCommand = keycap.getAttribute(
                                'data-shifted-command'
                            );
                            if (shifteCommand) {
                                keycap.setAttribute(
                                    'data-' +
                                        mathfield.config.namespace +
                                        'command',
                                    shifteCommand
                                );
                            } else {
                                const commandObj = JSON.parse(command);
                                if (isArray(commandObj)) {
                                    commandObj[1] = commandObj[1].toUpperCase();
                                }
                                keycap.setAttribute(
                                    'data-' +
                                        mathfield.config.namespace +
                                        'command',
                                    JSON.stringify(commandObj)
                                );
                            }
                        }
                    }
                }
            }
            return false;
        },
    },
    { target: 'virtual-keyboard' }
);

registerCommand(
    {
        hideAlternateKeys: (mathfield: MathfieldPrivate) =>
            hideAlternateKeys(mathfield),

        /*
         * The command invoked when an alternate key is pressed.
         * We need to hide the Alternate Keys panel, then perform the
         * command.
         */
        performAlternateKeys: (mathfield: MathfieldPrivate, command) => {
            hideAlternateKeys(mathfield);
            return mathfield.$perform(command);
        },
        switchKeyboardLayer: (mathfield: MathfieldPrivate, layer) =>
            switchKeyboardLayer(mathfield, layer),
        unshiftKeyboardLayer: (mathfield: MathfieldPrivate) =>
            unshiftKeyboardLayer(mathfield),

        insertAndUnshiftKeyboardLayer: (mathfield: MathfieldPrivate, c) => {
            mathfield.$insert(c);
            unshiftKeyboardLayer(mathfield);
            return true;
        },
    },
    { target: 'virtual-keyboard' }
);

registerCommand(
    {
        /* Toggle the virtual keyboard, but switch to the alternate theme if available */
        toggleVirtualKeyboardAlt: (mathfield: MathfieldPrivate) => {
            let hadAltTheme = false;
            if (mathfield.virtualKeyboard) {
                hadAltTheme = mathfield.virtualKeyboard.classList.contains(
                    'material'
                );
                mathfield.virtualKeyboard.remove();
                delete mathfield.virtualKeyboard;
                mathfield.virtualKeyboard = null;
            }
            showVirtualKeyboard(mathfield, hadAltTheme ? '' : 'material');
            return false;
        },
        /** Toggle the virtual keyboard, but switch another keyboard layout */
        toggleVirtualKeyboardShift: (mathfield: MathfieldPrivate) => {
            mathfield.config.virtualKeyboardLayout = {
                qwerty: 'azerty',

                azerty: 'qwertz',
                qwertz: 'dvorak',
                dvorak: 'colemak',
                colemak: 'qwerty',
            }[mathfield.config.virtualKeyboardLayout];
            const layer =
                mathfield.virtualKeyboard?.querySelector(
                    'div.keyboard-layer.is-visible'
                ).id ?? '';
            if (mathfield.virtualKeyboard) {
                mathfield.virtualKeyboard.remove();
                delete mathfield.virtualKeyboard;
                mathfield.virtualKeyboard = null;
            }
            showVirtualKeyboard(mathfield);
            if (layer) {
                switchKeyboardLayer(mathfield, layer);
            }
            return false;
        },
    },
    { target: 'virtual-keyboard' }
);

export function showVirtualKeyboard(
    mathfield: MathfieldPrivate,
    theme: 'apple' | 'material' | '' = ''
): boolean {
    mathfield.virtualKeyboardVisible = false;
    toggleVirtualKeyboard(mathfield, theme);
    return false;
}

export function hideVirtualKeyboard(mathfield: MathfieldPrivate): boolean {
    mathfield.virtualKeyboardVisible = true;
    toggleVirtualKeyboard(mathfield);
    return false;
}

function toggleVirtualKeyboard(
    mathfield: MathfieldPrivate,
    theme?: 'apple' | 'material' | ''
): boolean {
    mathfield.virtualKeyboardVisible = !mathfield.virtualKeyboardVisible;
    if (mathfield.virtualKeyboardVisible) {
        mathfield.$focus();
        if (mathfield.virtualKeyboard) {
            mathfield.virtualKeyboard.classList.add('is-visible');
        } else {
            // Construct the virtual keyboard
            mathfield.virtualKeyboard = makeKeyboard(mathfield, theme);
            // Let's make sure that tapping on the keyboard focuses the field
            on(
                mathfield.virtualKeyboard,
                'touchstart:passive mousedown',
                () => {
                    mathfield.$focus();
                }
            );
            document.body.appendChild(mathfield.virtualKeyboard);
        }
        // For the transition effect to work, the property has to be changed
        // after the insertion in the DOM. Use setTimeout
        window.setTimeout(() => {
            mathfield.virtualKeyboard.classList.add('is-visible');
        }, 1);
    } else if (mathfield.virtualKeyboard) {
        mathfield.virtualKeyboard.classList.remove('is-visible');
    }
    if (typeof mathfield.config.onVirtualKeyboardToggle === 'function') {
        mathfield.config.onVirtualKeyboardToggle(
            mathfield,
            mathfield.virtualKeyboardVisible,
            mathfield.virtualKeyboard
        );
    }
    return false;
}

registerCommand(
    {
        toggleVirtualKeyboard: (mathfield: MathfieldPrivate, theme) =>
            toggleVirtualKeyboard(mathfield, theme),
        hideVirtualKeyboard: (mathfield: MathfieldPrivate) =>
            hideVirtualKeyboard(mathfield),
        showVirtualKeyboard: (mathfield: MathfieldPrivate, theme): boolean =>
            showVirtualKeyboard(mathfield, theme),
    },
    { target: 'virtual-keyboard' }
);
