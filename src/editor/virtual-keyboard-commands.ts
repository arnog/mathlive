import { isArray } from '../common/types';

import {
  unshiftKeyboardLayer,
  showVariantsPanel,
  hideVariantsPanel,
  VirtualKeyboard,
} from './virtual-keyboard-utils';
import { register as registerCommand, SelectorPrivate } from './commands';
export { unshiftKeyboardLayer };

/*
 * The variants panel is displayed when a keycap on the virtual keyboard is
 * pressed and held.
 *
 */
registerCommand({ showVariantsPanel }, { target: 'virtual-keyboard' });

export function switchKeyboardLayer(
  keyboard: VirtualKeyboard,
  layer: string | null
): boolean {
  keyboard.show();
  // If the variants panel was visible, hide it
  hideVariantsPanel();
  // If we were in a temporarily shifted state (shift-key held down)
  // restore our state before switching to a new layer.
  unshiftKeyboardLayer(keyboard);
  const layers = keyboard?.element!.querySelectorAll('.MLK__layer');
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

  return true;
}

export function shiftKeyboardLayer(keyboard: VirtualKeyboard): boolean {
  const keycaps = keyboard?.element!.querySelectorAll<HTMLElement>(
    '.MLK__layer.is-visible .MLK__keycap, .MLK__layer.is-visible .action'
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
          const shiftedCommand = keycap.getAttribute('data-shifted-command');
          if (shiftedCommand) keycap.dataset.command = shiftedCommand;
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

export function performVariant(
  keyboard: VirtualKeyboard,
  command: SelectorPrivate | [SelectorPrivate, ...any[]]
): boolean {
  hideVariantsPanel();
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
    hideVariantsPanel: () => hideVariantsPanel(),

    /*
     * The command invoked when a variant key is pressed:
     * hide the Variants panel, then perform the command.
     */
    performVariant,
    switchKeyboardLayer: (keyboard: VirtualKeyboard, layer) =>
      switchKeyboardLayer(keyboard, layer),
    unshiftKeyboardLayer: (keyboard: VirtualKeyboard) =>
      unshiftKeyboardLayer(keyboard),
    insertAndUnshiftKeyboardLayer,
  },
  { target: 'virtual-keyboard' }
);

export function toggleVirtualKeyboardShift(keyboard: VirtualKeyboard): boolean {
  keyboard.options.virtualKeyboardLayout = {
    qwerty: 'azerty',

    azerty: 'qwertz',
    qwertz: 'dvorak',
    dvorak: 'colemak',
    colemak: 'qwerty',
  }[keyboard.options.virtualKeyboardLayout];
  const layer =
    keyboard?.element?.querySelector('.MLK__layer.is-visible')?.id ?? '';
  if (keyboard) keyboard.disable();

  keyboard.show();
  if (layer) switchKeyboardLayer(keyboard, layer);

  return false;
}

/** Toggle the virtual keyboard, but switch another keyboard layout */
registerCommand({ toggleVirtualKeyboardShift }, { target: 'virtual-keyboard' });

function toggleVirtualKeyboard(keyboard: VirtualKeyboard): boolean {
  if (keyboard.visible) keyboard.hide();
  else keyboard.show();

  return false;
}

registerCommand(
  {
    toggleVirtualKeyboard,
    hideVirtualKeyboard: (keyboard) => {
      keyboard.hide();
      return false;
    },
    showVirtualKeyboard: (keyboard) => {
      keyboard.show();
      return false;
    },
  },
  { target: 'virtual-keyboard' }
);
