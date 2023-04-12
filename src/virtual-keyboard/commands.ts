import { register } from '../editor/commands';

import { hideVariantsPanel } from './variants';
import { VirtualKeyboard } from './virtual-keyboard';

export function switchKeyboardLayer(layerName: string | null): boolean {
  const keyboard = VirtualKeyboard.singleton;
  keyboard.show();

  // If the variants panel was visible, hide it
  hideVariantsPanel();

  const layers = keyboard.element!.querySelectorAll<HTMLElement>('.MLK__layer');
  // Search for the requested layer
  let found = false;
  for (const layer of layers) {
    if (layer.dataset.layer === layerName) {
      found = true;
      break;
    }
  }

  // We did find the layer, switch to it.
  // If we didn't find it, do nothing and keep the current layer
  if (found) {
    for (const layer of layers) {
      if (layer.dataset.layer === layerName) layer.classList.add('is-visible');
      else layer.classList.remove('is-visible');
    }
  }

  keyboard.render(); // Account for shift state
  keyboard.focus();

  return true;
}

function toggleVirtualKeyboard(): boolean {
  const kbd = window.mathVirtualKeyboard;
  if (kbd.visible) kbd.hide({ animate: true });
  else kbd.show({ animate: true });

  return false;
}

register(
  {
    switchKeyboardLayer,
    toggleVirtualKeyboard,
    hideVirtualKeyboard: () => {
      window.mathVirtualKeyboard.hide({ animate: true });
      return false;
    },
    showVirtualKeyboard: () => {
      window.mathVirtualKeyboard.show({ animate: true });
      return false;
    },
  },
  { target: 'virtual-keyboard' }
);
