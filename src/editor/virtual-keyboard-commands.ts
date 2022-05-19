import { isArray } from '../common/types';

import {
  makeKeyboardElement,
  unshiftKeyboardLayer,
  onUndoStateChanged,
  showAlternateKeys,
  hideAlternateKeys,
  VirtualKeyboard,
} from './virtual-keyboard-utils';
import { register as registerCommand, SelectorPrivate } from './commands';
import { on } from '../editor-mathfield/utils';
export { unshiftKeyboardLayer };

/*
 * Alternate options are displayed when a key on the virtual keyboard is pressed
 * and held.
 *
 */
registerCommand(
  {
    showAlternateKeys,
  },
  { target: 'virtual-keyboard' }
);

export function switchKeyboardLayer(
  keyboard: VirtualKeyboard,
  layer: string | null
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
    const layers = keyboard?.element!.querySelectorAll('.keyboard-layer');
    // Search for the requested layer
    let found = false;
    for (const layer_ of layers) {
      if ((layer_ as HTMLElement).dataset.layer === layer) {
        found = true;
        break;
      }
    }

    // We did find the layer, switch to it.
    // If we didn't find it, do nothing and keep the current layer
    if (found) {
      for (const layer_ of layers) {
        if ((layer_ as HTMLElement).dataset.layer === layer)
          layer_.classList.add('is-visible');
        else layer_.classList.remove('is-visible');
      }
    }

    keyboard.focusMathfield();
  }

  return true;
}

export function shiftKeyboardLayer(keyboard: VirtualKeyboard): boolean {
  const keycaps = keyboard?.element!.querySelectorAll<HTMLElement>(
    'div.keyboard-layer.is-visible .rows .keycap, div.keyboard-layer.is-visible .rows .action'
  );
  if (keycaps) {
    for (const keycap of keycaps) {
      // If there's already an unshiftedContent attribute, we're already in
      // shifted mode. Don't do it twice.
      if (keycap.dataset.unshiftedContent) return false;

      let shiftedContent = keycap.getAttribute('data-shifted');
      if (shiftedContent || /^[a-z]$/.test(keycap.innerHTML)) {
        keycap.dataset.unshiftedContent = keycap.innerHTML;
        if (!shiftedContent) shiftedContent = keycap.innerHTML.toUpperCase();

        keycap.innerHTML = keyboard.options.createHTML(shiftedContent);
        const command = keycap.getAttribute('data-command');
        if (command) {
          keycap.dataset.unshiftedCommand = command;
          const shifteCommand = keycap.getAttribute('data-shifted-command');
          if (shifteCommand) keycap.dataset.command = shifteCommand;
          else {
            const commandObject = JSON.parse(command);
            if (isArray(commandObject))
              commandObject[1] = commandObject[1].toUpperCase();

            keycap.dataset.command = JSON.stringify(commandObject);
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
    shiftKeyboardLayer,
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
    performAlternateKeys,
    switchKeyboardLayer: (keyboard: VirtualKeyboard, layer) =>
      switchKeyboardLayer(keyboard, layer),
    unshiftKeyboardLayer: (keyboard: VirtualKeyboard) =>
      unshiftKeyboardLayer(keyboard),
    insertAndUnshiftKeyboardLayer,
  },
  { target: 'virtual-keyboard' }
);

export function toggleVirtualKeyboardAlt(keyboard: VirtualKeyboard): boolean {
  let hadAltTheme = false;
  if (keyboard?.element) {
    hadAltTheme = keyboard?.element.classList.contains('material');
    keyboard.disable();
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
    keyboard?.element!.querySelector('div.keyboard-layer.is-visible')?.id ?? '';
  if (keyboard) keyboard.disable();

  showVirtualKeyboard(keyboard);
  if (layer) switchKeyboardLayer(keyboard, layer);

  return false;
}

registerCommand(
  {
    /* Toggle the virtual keyboard, but switch to the alternate theme if available */
    toggleVirtualKeyboardAlt,
    /** Toggle the virtual keyboard, but switch another keyboard layout */
    toggleVirtualKeyboardShift,
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
  if (!keyboard.options.virtualKeyboardContainer) return false;

  keyboard.visible = !keyboard.visible;
  if (keyboard.visible) {
    keyboard.focusMathfield();
    if (keyboard.element) keyboard.element.classList.add('is-visible');
    else {
      // Construct the virtual keyboard
      keyboard.element = makeKeyboardElement(keyboard, theme ?? '');
      // Let's make sure that tapping on the keyboard focuses the field
      on(keyboard.element, 'touchstart:passive mousedown', () =>
        keyboard.focusMathfield()
      );
      keyboard.options.virtualKeyboardContainer.appendChild(keyboard.element);
    }

    // For the transition effect to work, the property has to be changed
    // after the insertion in the DOM. Use setTimeout
    setTimeout(() => keyboard.element?.classList.add('is-visible'), 1);
  } else if (keyboard.element) {
    // Remove the element from the DOM
    keyboard.disable();
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
