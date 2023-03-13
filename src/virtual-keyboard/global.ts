import { isBrowser } from 'common/capabilities';
import { VirtualKeyboard } from './virtual-keyboard';
import { VirtualKeyboardProxy } from './proxy';
import { VirtualKeyboardInterface } from './types';

declare global {
  interface Window {
    mathVirtualKeyboard: VirtualKeyboardInterface & EventTarget;
  }
}

if (isBrowser()) {
  Object.defineProperty(window, 'mathVirtualKeyboard', {
    // The value of `window.mathVirtualKeyboard` is either a
    // `VirtualKeyboard` singleton in the top-level browsing context,
    // or a `VirtualKeyboardProxy` otherwise (when in an iframe)
    get: () =>
      window.top !== window
        ? VirtualKeyboardProxy.singleton
        : VirtualKeyboard.singleton,
  });
}
