import { register } from '../editor/commands';

import { hideVariantsPanel } from './variants';
import { VirtualKeyboard } from './virtual-keyboard';

export function switchKeyboardLayer(
  mathfield: undefined,
  layerName: string
): boolean {
  const keyboard = VirtualKeyboard.singleton;
  if (!keyboard) return false;

  keyboard.show();

  // If the variants panel was visible, hide it
  hideVariantsPanel();

  keyboard.currentLayer = layerName;
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
