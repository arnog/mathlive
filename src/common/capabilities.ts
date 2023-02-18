// Return true if this is a browser environment, false if this is
// a server side environment (node.js) or web worker.
export function isBrowser(): boolean {
  return 'window' in globalThis && 'document' in globalThis;
}

export function throwIfNotInBrowser(): void {
  if (!isBrowser()) {
    throw new Error(
      '<math-field> is an interactive component that needs to run in a browser environment\n' +
        'If you are using nextjs, see https://nextjs.org/docs/advanced-features/dynamic-import#with-no-ssr'
    );
  }
}

export function isTouchCapable(): boolean {
  if ('matchMedia' in globalThis)
    return globalThis.matchMedia('(any-pointer: coarse)').matches;
  return 'ontouchstart' in globalThis || navigator.maxTouchPoints > 0;
}

export function canVibrate(): boolean {
  return typeof navigator.vibrate === 'function';
}

export function osPlatform():
  | 'macos'
  | 'windows'
  | 'android'
  | 'ios'
  | 'chromeos'
  | 'other' {
  if (!isBrowser()) return 'other';

  const platform = navigator['userAgentData']?.platform ?? navigator.platform;

  if (/^mac/i.test(platform)) {
    // WebKit on iPad OS 14 looks like macOS.
    // Use the number of touch points to distinguish between macOS and iPad OS
    if (navigator.maxTouchPoints === 5) return 'ios';

    return 'macos';
  }

  if (/^win/i.test(platform)) return 'windows';

  if (/android/i.test(navigator.userAgent)) return 'android';

  if (/iphone|ipod|ipad/i.test(navigator.userAgent)) return 'ios';

  if (/\bcros\b/i.test(navigator.userAgent)) return 'chromeos';

  return 'other';
}

export function supportRegexPropertyEscape(): boolean {
  if (!isBrowser()) return true;

  if (/firefox/i.test(navigator.userAgent)) {
    const m = navigator.userAgent.match(/firefox\/(\d+)/i);
    if (!m) return false;
    const version = parseInt(m[1]);
    return version >= 78; // https://www.mozilla.org/en-US/firefox/78.0/releasenotes/
  }
  if (/trident/i.test(navigator.userAgent)) return false;

  if (/edge/i.test(navigator.userAgent)) {
    const m = navigator.userAgent.match(/edg\/(\d+)/i);
    if (!m) return false;
    const version = parseInt(m[1]);
    return version >= 79;
  }

  return true;
}
