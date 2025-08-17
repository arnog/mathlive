import { isBrowser } from '../ui/utils/capabilities';
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
    initVirtualKeyboardInCurrentBrowsingContext();
  } else {
    // When in an iFrame, the mathVirtualKeyboard is a proxy
    // This can be overridden by calling initVirtualKeyboardInCurrentBrowsingContext()
    Object.defineProperty(window, 'mathVirtualKeyboard', {
      get: () => VirtualKeyboardProxy.singleton,
      configurable: true,
    });
  }
}

/**
 * Initialize the virtual keyboard so that it appears in the current browsing context.
 * (By default, it would only appear in the top-level window)
 *
 * @category Virtual Keyboard
 */
export function initVirtualKeyboardInCurrentBrowsingContext() {
  const kbd = VirtualKeyboard.singleton;
  if (window.mathVirtualKeyboard !== kbd) {
    Object.defineProperty(window, 'mathVirtualKeyboard', {
      get: () => kbd,
    });
  }
  return kbd;
}
