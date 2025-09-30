import type { KeyboardLayoutName } from './options';
import {
  setKeyboardLayout as setKeyboardLayoutImpl,
  setKeyboardLayoutLocale as setKeyboardLayoutLocaleImpl,
} from '../editor/keyboard-layout';

/**
 * Change the current physical keyboard layout.
 *
 * @category Localization
 */
export function setKeyboardLayout(name: KeyboardLayoutName | 'auto'): void {
  setKeyboardLayoutImpl(name);
}

/**
 * Change the current physical keyboard layout to match the specified locale.
 *
 * @category Localization
 */
export function setKeyboardLayoutLocale(locale: string): void {
  setKeyboardLayoutLocaleImpl(locale);
}
