export function hasPhysicalKeyboard(): boolean {
  return !isTouchCapable();
}

export function isTouchCapable(): boolean {
  return window.matchMedia?.('(any-pointer: coarse)').matches ?? false;
}

export function osPlatform():
  | 'macos'
  | 'windows'
  | 'android'
  | 'ios'
  | 'chromeos'
  | 'other' {
  const platform = navigator.platform;

  if (/^(mac)/i.test(platform)) {
    // WebKit on iPad OS 14 looks like macOS.
    // Use the number of touch points to distinguish between macOS and iPad OS
    if (navigator.maxTouchPoints === 5) return 'ios';

    return 'macos';
  }

  if (/^(win)/i.test(platform)) return 'windows';

  if (/(android)/i.test(navigator.userAgent)) return 'android';

  if (/(iphone|ipod|ipad)/i.test(navigator.userAgent)) return 'ios';

  if (/\bcros\b/i.test(navigator.userAgent)) return 'chromeos';

  return 'other';
}

export function supportRegexPropertyEscape(): boolean {
  if (navigator === undefined) return true;

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
    return version >= 79; // https://www.mozilla.org/en-US/firefox/78.0/releasenotes/
  }

  return true;
}

export function supportLocalFontEnumeration(): boolean {
  // Firefox and Safari return true for fonts that are not loaded...
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1252821 🤦‍♂️
  // So, if on Firefox, always assume that the fonts are not loaded.
  return !/firefox|safari/i.test(navigator.userAgent);
}
