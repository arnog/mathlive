"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.localize = exports.l10n = void 0;
var l10n_strings_1 = require("../editor/l10n-strings");
var capabilities_1 = require("../ui/utils/capabilities");
exports.l10n = {
    strings: l10n_strings_1.STRINGS,
    _locale: '',
    _dirty: false,
    _subscribers: [],
    _numberFormatter: undefined,
    get locale() {
        // Use the browser defined language as the default language,
        // "english" if not running in a browser (node.js)
        if (!exports.l10n._locale)
            exports.l10n._locale = (0, capabilities_1.isBrowser)() ? navigator.language.slice(0, 5) : 'en-US';
        return exports.l10n._locale;
    },
    set locale(value) {
        exports.l10n._locale = value;
        exports.l10n._numberFormatter = undefined;
        exports.l10n.dirty = true;
    },
    get numberFormatter() {
        if (!exports.l10n._numberFormatter)
            exports.l10n._numberFormatter = new Intl.NumberFormat(exports.l10n.locale);
        return exports.l10n._numberFormatter;
    },
    /*
     * Two forms for this function:
     * - merge(locale, strings)
     * Merge a dictionary of keys -> values for the specified locale
     * - merge(strings)
     * Merge a dictionary of locale code -> dictionary of keys -> values
     *
     */
    merge: function (locale, strings) {
        if (typeof locale === 'string' && strings) {
            exports.l10n.strings[locale] = __assign(__assign({}, exports.l10n.strings[locale]), strings);
            exports.l10n.dirty = true;
        }
        else {
            for (var _i = 0, _a = Object.keys(locale); _i < _a.length; _i++) {
                var l = _a[_i];
                exports.l10n.merge(l, locale[l]);
            }
        }
    },
    get dirty() {
        return exports.l10n._dirty;
    },
    set dirty(val) {
        var _this = this;
        if (exports.l10n._dirty || exports.l10n._dirty === val)
            return;
        exports.l10n._dirty = true;
        setTimeout(function () {
            exports.l10n._dirty = false;
            _this._subscribers.forEach(function (x) { return x === null || x === void 0 ? void 0 : x(); });
        }, 0);
    },
    subscribe: function (callback) {
        exports.l10n._subscribers.push(callback);
        return exports.l10n._subscribers.length - 1;
    },
    unsubscribe: function (id) {
        if (id < 0 || id >= exports.l10n._subscribers.length)
            return;
        exports.l10n._subscribers[id] = undefined;
    },
    /**
     * Update the l10n strings in the DOM
     */
    update: function (root) {
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
        var elements = root.querySelectorAll('[data-l10n-tooltip]');
        for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
            var element = elements_1[_i];
            var key = element.getAttribute('data-l10n-tooltip');
            if (key) {
                var localized = localize(key);
                if (localized)
                    element.setAttribute('data-tooltip', localized);
            }
        }
        // Update the aria-labels
        elements = root.querySelectorAll('[data-l10n-arial-label]');
        for (var _a = 0, elements_2 = elements; _a < elements_2.length; _a++) {
            var element = elements_2[_a];
            var key = element.getAttribute('data-l10n-arial-label');
            if (key) {
                var localized = localize(key);
                if (localized)
                    element.setAttribute('aria-label', localized);
            }
        }
    }
};
/**
 * Return a localized string for the `key`.
 */
function localize(key) {
    var params = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        params[_i - 1] = arguments[_i];
    }
    if (key === undefined)
        return undefined;
    var result = '';
    // Attempt to find a match for the current locale
    var locale = exports.l10n.locale;
    if (exports.l10n.strings[locale])
        result = exports.l10n.strings[locale][key];
    // If none is found, attempt to find a match for the language
    var language = locale.slice(0, 2);
    if (!result && exports.l10n.strings[language])
        result = exports.l10n.strings[language][key];
    // If none is found, try english
    if (!result)
        result = exports.l10n.strings.en[key];
    // If that didn't work, return undefined
    if (!result)
        return undefined;
    // Now substitute any parameters in the string. Parameters have the format
    // %@ or %1$@, where the $1 indicates the index of the parameter to substitute
    // and the @ indicates that the parameter is a string
    // eslint-disable-next-line no-control-regex
    var regex = /(%@|%([0-9]+)\$@)/g;
    var match = regex.exec(result);
    var index = 0;
    while (match) {
        var parameter = params[index++];
        if (parameter) {
            var parameterIndex = match[2] ? parseInt(match[2], 10) - 1 : index - 1;
            var repl = params[parameterIndex];
            if (typeof repl === 'number')
                repl = exports.l10n.numberFormatter.format(repl);
            result = result.replace(match[1], repl);
        }
        match = regex.exec(result);
    }
    // Now substitute any `%%` with `%`
    result = result.replace(/%%/g, '%');
    return result;
}
exports.localize = localize;
