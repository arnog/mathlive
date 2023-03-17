import { SelectorPrivate } from 'editor/types';
import { isArray } from '../common/types';

import { unshiftKeyboardLayer } from './utils';
import { showVariantsPanel, hideVariantsPanel } from './variants';
import { VirtualKeyboard } from './virtual-keyboard';
import { register } from 'editor/commands';

/*
 * The variants panel is displayed when a keycap on the virtual keyboard is
 * pressed and held.
 *
 */
register({ showVariantsPanel }, { target: 'virtual-keyboard' });

export function switchKeyboardLayer(layer: string | null): boolean {
  VirtualKeyboard.singleton.show();
  // If the variants panel was visible, hide it
  hideVariantsPanel();
  // If we were in a temporarily shifted state (shift-key held down)
  // restore our state before switching to a new layer.
  unshiftKeyboardLayer();
  const layers =
    VirtualKeyboard.singleton?.element!.querySelectorAll('.MLK__layer');
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

  VirtualKeyboard.singleton.focus();

  return true;
}

export function shiftKeyboardLayer(): boolean {
  const keycaps =
    VirtualKeyboard.singleton?.element!.querySelectorAll<HTMLElement>(
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

        keycap.innerHTML = window.MathfieldElement.createHTML(shiftedContent);
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
register(
  {
    shiftKeyboardLayer,
  },
  { target: 'virtual-keyboard' }
);

function performVariant(
  command: SelectorPrivate | [SelectorPrivate, ...any[]]
): boolean {
  hideVariantsPanel();
  return VirtualKeyboard.singleton.executeCommand(command);
}

function insertAndUnshiftKeyboardLayer(c: string): boolean {
  VirtualKeyboard.singleton.executeCommand(['insert', c]);
  unshiftKeyboardLayer();
  return true;
}

register(
  {
    hideVariantsPanel: () => hideVariantsPanel(),

    /*
     * The command invoked when a variant key is pressed:
     * hide the Variants panel, then perform the command.
     */
    performVariant,
    switchKeyboardLayer: (layer) => switchKeyboardLayer(layer),
    unshiftKeyboardLayer: () => unshiftKeyboardLayer(),
    insertAndUnshiftKeyboardLayer,
  },
  { target: 'virtual-keyboard' }
);

function toggleVirtualKeyboardShift(): boolean {
  const kbd = VirtualKeyboard.singleton;
  kbd.alphabeticLayout = {
    qwerty: 'azerty',

    azerty: 'qwertz',
    qwertz: 'dvorak',
    dvorak: 'colemak',
    colemak: 'qwerty',
  }[kbd.alphabeticLayout];
  const layer = kbd?.element?.querySelector('.MLK__layer.is-visible')?.id ?? '';

  kbd.show();
  if (layer) switchKeyboardLayer(layer);

  return false;
}

/** Toggle the virtual keyboard, but switch another keyboard layout */
register({ toggleVirtualKeyboardShift }, { target: 'virtual-keyboard' });

function toggleVirtualKeyboard(): boolean {
  const kbd = VirtualKeyboard.singleton;
  if (kbd.visible) kbd.hide();
  else kbd.show();

  return false;
}

register(
  {
    toggleVirtualKeyboard,
    hideVirtualKeyboard: () => {
      VirtualKeyboard.singleton.hide();
      return false;
    },
    showVirtualKeyboard: () => {
      VirtualKeyboard.singleton.show();
      return false;
    },
  },
  { target: 'virtual-keyboard' }
);
