import { isBrowser } from '../common/capabilities';
import { VirtualKeyboard } from './virtual-keyboard';
import { VirtualKeyboardProxy } from './proxy';

export { VirtualKeyboard } from './virtual-keyboard';
export { VirtualKeyboardProxy } from './proxy';

if (isBrowser() && !('mathVirtualKeyboard' in window)) {
  if (window === window['top']) {
    // When at the top-level window, mathVirtualKeyboard is a singleton
    // VirtualKeyboard. Instantiate it during static init, otherwise
    // mathfields in iFrame will not be able to talk to it until it has been
    // instantiated (which the client may not do)
    const kbd = VirtualKeyboard.singleton;
    Object.defineProperty(window, 'mathVirtualKeyboard', {
      get: () => kbd,
    });
  } else {
    // When in an iFrame, the mathVirtualKeyboard is a proxy
    Object.defineProperty(window, 'mathVirtualKeyboard', {
      get: () => VirtualKeyboardProxy.singleton,
      configurable: true,
    });
  }
}
