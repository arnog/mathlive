/* 0.110.0 */import type { KeyboardLayoutName } from './options';
/**
 * Change the current physical keyboard layout.
 *
 * @category Localization
 */
export declare function setKeyboardLayout(name: KeyboardLayoutName | 'auto'): void;
/**
 * Change the current physical keyboard layout to match the specified locale.
 *
 * @category Localization
 */
export declare function setKeyboardLayoutLocale(locale: string): void;
