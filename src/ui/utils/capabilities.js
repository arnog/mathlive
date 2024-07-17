"use strict";
exports.__esModule = true;
exports.supportPopover = exports.supportRegexPropertyEscape = exports.osPlatform = exports.canVibrate = exports.isInIframe = exports.isTouchCapable = exports.isBrowser = void 0;
// Return true if this is a browser environment, false if this is
// a server side environment (node.js) or web worker.
function isBrowser() {
    return 'window' in globalThis && 'document' in globalThis;
}
exports.isBrowser = isBrowser;
function isTouchCapable() {
    if ('matchMedia' in window)
        return window.matchMedia('(pointer: coarse)').matches;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
exports.isTouchCapable = isTouchCapable;
function isInIframe() {
    try {
        return window.self !== window.top;
    }
    catch (e) {
        return true;
    }
}
exports.isInIframe = isInIframe;
function canVibrate() {
    return typeof navigator.vibrate === 'function';
}
exports.canVibrate = canVibrate;
function osPlatform() {
    var _a, _b;
    if (!isBrowser())
        return 'other';
    var platform = (_b = (_a = navigator['userAgentData']) === null || _a === void 0 ? void 0 : _a.platform) !== null && _b !== void 0 ? _b : navigator.platform;
    if (/^mac/i.test(platform)) {
        // WebKit on iPad OS 14 looks like macOS.
        // Use the number of touch points to distinguish between macOS and iPad OS
        if (navigator.maxTouchPoints === 5)
            return 'ios';
        return 'macos';
    }
    if (/^win/i.test(platform))
        return 'windows';
    if (/android/i.test(navigator.userAgent))
        return 'android';
    if (/iphone|ipod|ipad/i.test(navigator.userAgent))
        return 'ios';
    if (/\bcros\b/i.test(navigator.userAgent))
        return 'chromeos';
    return 'other';
}
exports.osPlatform = osPlatform;
function supportRegexPropertyEscape() {
    if (!isBrowser())
        return true;
    if (/firefox/i.test(navigator.userAgent)) {
        var m = navigator.userAgent.match(/firefox\/(\d+)/i);
        if (!m)
            return false;
        var version = parseInt(m[1]);
        return version >= 78; // https://www.mozilla.org/en-US/firefox/78.0/releasenotes/
    }
    if (/trident/i.test(navigator.userAgent))
        return false;
    if (/edge/i.test(navigator.userAgent)) {
        var m = navigator.userAgent.match(/edg\/(\d+)/i);
        if (!m)
            return false;
        var version = parseInt(m[1]);
        return version >= 79;
    }
    return true;
}
exports.supportRegexPropertyEscape = supportRegexPropertyEscape;
function supportPopover() {
    return HTMLElement.prototype.hasOwnProperty('popover');
}
exports.supportPopover = supportPopover;
