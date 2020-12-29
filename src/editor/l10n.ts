// Import { Keys } from '../types-utils';
import { STRINGS } from './l10n-strings';

export const l10n: {
  locale?: string;
  _ordinalEnglishPluralCategories?: string[];
  _ordinalPluralCategories?: string[];
  _ordinalEnglish?: Intl.PluralRules;
  _ordinal?: Intl.PluralRules;
  _cardinalPluralCategories?: string[];
  _cardinalEnglishPluralCategories?: string[];
  _cardinalEnglish?: Intl.PluralRules;
  _cardinal?: Intl.PluralRules;
  _locale?: string;
  strings?: Record<string, Record<string, string>>;
  plural?(value, s, options): Intl.PluralRules;
  ordinal?(value, s, options): Intl.PluralRules;
  cardinal?(value, s, options): Intl.PluralRules;
  merge?(
    locale: string | Record<string, Record<string, string>>,
    strings?: Record<string, string>
  ): void;
} = {};

l10n.plural = function (value: number, s: string, options): Intl.PluralRules {
  options = options ?? {};
  options.type = options.type ?? 'cardinal';
  const language = l10n.locale.slice(0, 2);
  const rules = options.type === 'ordinal' ? l10n._ordinal : l10n._cardinal;
  let rule =
    options.type === 'ordinal'
      ? l10n._ordinalPluralCategories.indexOf(rules.select(value))
      : l10n._cardinalPluralCategories.indexOf(rules.select(value));

  let result;
  if (l10n.strings[l10n.locale]) result = l10n.strings[l10n.locale][s];
  if (!result && l10n.strings[language]) result = l10n.strings[language][s];
  if (!result) {
    result = l10n.strings.en[s];
    if (!result) result = s;
    rule =
      options.type === 'ordinal'
        ? l10n._ordinalPluralCategories.indexOf(
            l10n._ordinalEnglish.select(value)
          )
        : l10n._cardinalPluralCategories.indexOf(
            l10n._cardinalEnglish.select(value)
          );
  }

  return result.split(';')[rule] || result.split(';')[0];
};

/*
 * Two forms for this function:
 * - merge(locale, strings)
 * Merge a dictionary of keys -> values for the specified locale
 * - merge(strings)
 * Merge a dictionary of locale code -> dictionary of keys -> values
 *
 */
l10n.merge = function (
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
    Object.keys(locale as Record<string, Record<string, string>>).forEach((l) =>
      l10n.merge(l, locale[l])
    );
  }
};

// Add getter and setter for the _locale property of l10n
Object.defineProperty(l10n, 'locale', {
  set(locale) {
    l10n._locale = locale;
    l10n._ordinal = null;
    l10n._cardinal = null;
  },
  get() {
    // Use the browser defined language as the default language,
    // "english" if not running in a browser (node.js)
    if (!l10n._locale) {
      // Use the setter, which will load the necessary .json files.
      l10n._locale = navigator?.language.slice(0, 5) ?? 'en';
    }

    return l10n._locale;
  },
});

Object.defineProperty(l10n, 'ordinal', {
  get() {
    if (!l10n._ordinal) {
      l10n._ordinalEnglish = new Intl.PluralRules('en', {
        type: 'ordinal',
      });
      l10n._ordinalEnglishPluralCategories = l10n._ordinalEnglish.resolvedOptions().pluralCategories;
      l10n._ordinal = new Intl.PluralRules(l10n.locale, {
        type: 'ordinal',
      });
      l10n._ordinalPluralCategories = l10n._ordinal.resolvedOptions().pluralCategories;
      //    "zero", "one", "two", "few", "many" and "other"
    }

    return l10n._ordinal;
  },
});

Object.defineProperty(l10n, 'cardinal', {
  get() {
    if (!l10n._cardinal) {
      l10n._cardinalEnglish = new Intl.PluralRules('en', {
        type: 'cardinal',
      });
      l10n._cardinalEnglishPluralCategories = l10n._cardinalEnglish.resolvedOptions().pluralCategories;
      l10n._cardinal = new Intl.PluralRules(l10n.locale, {
        type: 'cardinal',
      });
      l10n._cardinalPluralCategories = l10n._ordinal.resolvedOptions().pluralCategories;
    }

    return l10n._cardinal;
  },
});

l10n.strings = STRINGS;

/**
 * Return a localised string for the `key`.
 */
export function localize(key: string): string {
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
