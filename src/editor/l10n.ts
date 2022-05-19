// Import { Keys } from '../types-utils';
import { STRINGS } from './l10n-strings';
import { isBrowser } from '../common/capabilities';

interface L10n {
  locale: string;
  _locale: string;
  strings: Record<string, Record<string, string>>;

  merge(
    locale: string | Record<string, Record<string, string>>,
    strings?: Record<string, string>
  ): void;
}

// Type '{ strings: { en: { 'keyboard.tooltip.functions': string;
// 'keyboard.tooltip.symbols': string; 'keyboard.tooltip.greek': string;
// 'keyboard.tooltip.command': string; 'keyboard.tooltip.numeric': string; ... 4
// more ...; 'tooltip.undo': string; }; ... 9 more ...; ru: { ...; }; }; ... 8
// more ...; merge(locale: string | Rec...' is missing the following properties
// from type 'L10n': _ordinal, _cardinalPluralCategories,
// _cardinalEnglishPluralCategories, _cardinal, _locale

export const l10n: L10n = {
  strings: STRINGS,
  _locale: '', //  Important! Set the locale to empty so it can be determined at runtime

  // Add getter and setter for the _locale property of l10n
  get locale(): string {
    // Use the browser defined language as the default language,
    // "english" if not running in a browser (node.js)
    if (!l10n._locale)
      l10n._locale = isBrowser() ? navigator.language.slice(0, 5) : 'en';

    return l10n._locale;
  },

  set locale(value: string) {
    l10n._locale = value;
  },

  /*
   * Two forms for this function:
   * - merge(locale, strings)
   * Merge a dictionary of keys -> values for the specified locale
   * - merge(strings)
   * Merge a dictionary of locale code -> dictionary of keys -> values
   *
   */
  merge(
    locale: string | Record<string, Record<string, string>>,
    strings?: Record<string, string>
  ): void {
    if (locale && strings) {
      const savedLocale = l10n._locale;
      l10n.locale = locale as string; // Load the necessary json file

      l10n.strings[locale as string] = {
        ...l10n.strings[locale as string],
        ...strings,
      };
      l10n.locale = savedLocale;
    } else if (locale && !strings) {
      for (const l of Object.keys(
        locale as Record<string, Record<string, string>>
      ))
        l10n.merge(l, locale[l]);
    }
  },
};

/**
 * Return a localised string for the `key`.
 */
export function localize(key?: string): string | undefined {
  if (key === undefined) return undefined;

  const language = l10n.locale.slice(0, 2);

  let result = '';

  // Attempt to find a match for the current locale
  if (l10n.strings[l10n.locale]) result = l10n.strings[l10n.locale][key];
  // If none is found, attempt to find a match for the language
  if (!result && l10n.strings[language]) result = l10n.strings[language][key];
  // If none is found, try english
  if (!result) result = l10n.strings.en[key];
  // If that didn't work, return undefined
  if (!result) return undefined;

  return result;
}
