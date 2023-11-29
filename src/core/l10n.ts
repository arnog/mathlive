import { STRINGS } from '../editor/l10n-strings';
import { isBrowser } from '../ui/utils/capabilities';

interface L10n {
  locale: string;
  strings: Record<string, Record<string, string>>;

  merge(
    locale: string | Record<string, Record<string, string>>,
    strings?: Record<string, string>
  ): void;

  subscribe(callback: () => void): number;
  unsubscribe(id: number): void;

  update(element: HTMLElement): void;

  dirty: boolean;

  _locale: string;
  _dirty: boolean; // True if the DOM needs to be updated
  _subscribers: (undefined | (() => void))[]; // List of subscribers to be notified when the locale changes
}

export const l10n: L10n = {
  strings: STRINGS,

  _locale: '', //  Important! Set the locale to empty so it can be determined at runtime
  _dirty: false,
  _subscribers: [],

  get locale(): string {
    // Use the browser defined language as the default language,
    // "english" if not running in a browser (node.js)
    if (!l10n._locale)
      l10n._locale = isBrowser() ? navigator.language.slice(0, 5) : 'en-US';

    return l10n._locale;
  },

  set locale(value: string) {
    l10n._locale = value;
    l10n.dirty = true;
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
    if (typeof locale === 'string' && strings) {
      l10n.strings[locale] = {
        ...l10n.strings[locale],
        ...strings,
      };
      l10n.dirty = true;
    } else {
      for (const l of Object.keys(
        locale as Record<string, Record<string, string>>
      ))
        l10n.merge(l, locale[l]);
    }
  },

  get dirty(): boolean {
    return l10n._dirty;
  },

  set dirty(val: boolean) {
    if (l10n._dirty || l10n._dirty === val) return;
    l10n._dirty = true;
    setTimeout(() => {
      l10n._dirty = false;
      this._subscribers.forEach((x) => x?.());
    }, 0);
  },

  subscribe(callback: () => void): number {
    l10n._subscribers.push(callback);
    return l10n._subscribers.length - 1;
  },

  unsubscribe(id: number): void {
    if (id < 0 || id >= l10n._subscribers.length) return;
    l10n._subscribers[id] = undefined;
  },

  /**
   * Update the l10n strings in the DOM
   */
  update(root: Element): void {
    // Iterate over all elements with a data-l10n attribute
    // let elements = root.querySelectorAll('[data-l10n]');
    // for (const element of elements) {
    //   const key = element.getAttribute('data-l10n');
    //   if (key) {
    //     const localized = localize(key);
    //     if (localized) element.textContent = localized;
    //   }
    // }

    // Update the tooltips
    let elements = root.querySelectorAll('[data-l10n-tooltip]');
    for (const element of elements) {
      const key = element.getAttribute('data-l10n-tooltip');
      if (key) {
        const localized = localize(key);
        if (localized) element.setAttribute('data-tooltip', localized);
      }
    }

    // Update the aria-labels
    elements = root.querySelectorAll('[data-l10n-arial-label]');
    for (const element of elements) {
      const key = element.getAttribute('data-l10n-arial-label');
      if (key) {
        const localized = localize(key);
        if (localized) element.setAttribute('aria-label', localized);
      }
    }
  },
};

/**
 * Return a localized string for the `key`.
 */
export function localize(key?: string): string | undefined {
  if (key === undefined) return undefined;

  let result = '';

  // Attempt to find a match for the current locale
  const locale = l10n.locale;
  if (l10n.strings[locale]) result = l10n.strings[locale][key];

  // If none is found, attempt to find a match for the language
  const language = locale.slice(0, 2);
  if (!result && l10n.strings[language]) result = l10n.strings[language][key];

  // If none is found, try english
  if (!result) result = l10n.strings.en[key];

  // If that didn't work, return undefined
  if (!result) return undefined;

  return result;
}
