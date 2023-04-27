// Import { Keys } from '../types-utils';
import { STRINGS } from '../editor/l10n-strings';
import { isBrowser } from '../common/capabilities';
import { MathfieldElement } from 'mathlive';

interface L10n {
  gLocale: string;
  _gLocale: string;
  strings: Record<string, Record<string, string>>;

  merge(
    locale: string | Record<string, Record<string, string>>,
    strings?: Record<string, string>
  ): void;
}

export const l10n: L10n = {
  strings: STRINGS,
  _gLocale: '', //  Important! Set the locale to empty so it can be determined at runtime

  // Add getter and setter for the _locale property of l10n
  get gLocale(): string {
    // Use the browser defined language as the default language,
    // "english" if not running in a browser (node.js)
    if (!l10n._gLocale)
      l10n._gLocale = isBrowser() ? navigator.language.slice(0, 5) : 'en';

    return l10n._gLocale;
  },

  set gLocale(value: string) {
    l10n._gLocale = value;
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
      const savedLocale = l10n._gLocale;
      l10n.gLocale = locale as string; // Load the necessary json file

      l10n.strings[locale as string] = {
        ...l10n.strings[locale as string],
        ...strings,
      };
      l10n.gLocale = savedLocale;
    } else if (locale && !strings) {
      for (const l of Object.keys(
        locale as Record<string, Record<string, string>>
      ))
        l10n.merge(l, locale[l]);
    }
  },
};

/**
 * Return a localized string for the `key` Based on the given `MathfieldElement`'s locale. Defaults to the current focused mathfield.
 *
 * If you don't want this behavior, you can set the `mf` to `null`, and it will use the browser's locale.
 */
export function localize(key: string, mf?: MathfieldElement | null);
/** Return a localized string for the `key` using the given `locale` */
export function localize(key: string, locale?: string);
export function localize(
  key: string,
  arg: string | MathfieldElement | null | undefined = MathfieldElement?.current
): string | undefined {
  if (typeof arg === 'string') return l10n.strings[arg]?.[key];

  // If a mathfield was provided, attempt to find a match using the mathfield's local locale
  if (arg?.locale && l10n.strings[arg.locale])
    return l10n.strings[arg.locale][key];

  // Attempt to find a match for the current locale
  if (l10n.strings[l10n.gLocale]) return l10n.strings[l10n.gLocale][key];

  // If none is found, attempt to find a match for the language
  const language = l10n.gLocale.slice(0, 2);
  if (l10n.strings[language]) return l10n.strings[language][key];

  return (
    l10n.strings.en[key] ?? // If none is found, try english
    undefined // If that didn't work, return undefined
  );
}
