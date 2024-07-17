"use strict";
exports.__esModule = true;
exports.hasVariants = exports.hideVariantsPanel = exports.showVariantsPanel = void 0;
var scrim_1 = require("../ui/utils/scrim");
var utils_1 = require("./utils");
var virtual_keyboard_1 = require("./virtual-keyboard");
var color_1 = require("../core/color");
var mathfield_element_1 = require("../public/mathfield-element");
var VARIANTS = {
    // '0-extended': [
    //   '\\emptyset',
    //   '\\varnothing',
    //   '\\infty',
    //   { latex: '#?_0', insert: '#@_0' },
    //   '\\circ',
    //   '\\bigcirc',
    //   '\\bullet',
    // ],
    '0': ['\\varnothing', '\\infty'],
    '1': ['\\frac{1}{#@}', '#@^{-1}', '\\times 10^{#?}', '\\phi', '\\imaginaryI'],
    '2': ['\\frac{1}{2}', '#@^2', '\\sqrt2', '\\exponentialE'],
    '3': ['\\frac{1}{3}', '#@^3', '\\sqrt3', '\\pi'],
    '4': ['\\frac{1}{4}', '#@^4'],
    '5': ['\\frac{1}{5}', '#@^5', '\\sqrt5'],
    '6': ['\\frac{1}{6}', '#@^6'],
    '7': ['\\frac{1}{7}', '#@^7'],
    '8': ['\\frac{1}{8}', '#@^8'],
    '9': ['\\frac{1}{9}', '#@^9'],
    '.': ['.', ',', ';', '\\colon'],
    ',': ['{,}', '.', ';', '\\colon'],
    'a': [
        { latex: '\\aleph', aside: 'aleph' },
        { latex: '\\forall', aside: 'for all' },
        'å',
        'à',
        'á',
        'â',
        'ä',
        'æ',
    ],
    'A': [
        { latex: '\\aleph', aside: 'aleph' },
        { latex: '\\forall', aside: 'for all' },
        'Å',
        'À',
        'Á',
        'Â',
        'Ä',
        'Æ',
    ],
    'b': [{ latex: '\\beth', aside: 'beth' }],
    'c': [{ latex: '\\C', aside: 'set of complex numbers' }, 'ç'],
    'd': [{ latex: '\\daleth', aside: 'daleth' }],
    'e': [
        { latex: '\\exponentialE', aside: 'exponential e' },
        { latex: '\\exists', aside: 'there is' },
        { latex: '\\nexists', aside: 'there isn’t' },
        'è',
        'é',
        'ê',
        'ë',
    ],
    'E': [
        { latex: '\\exponentialE', aside: 'exponential e' },
        { latex: '\\exists', aside: 'there is' },
        { latex: '\\nexists', aside: 'there isn’t' },
        'È',
        'É',
        'Ê',
        'Ë',
    ],
    'g': [{ latex: '\\gimel', aside: 'gimel' }],
    'h': [
        { latex: '\\hbar', aside: 'h bar' },
        { latex: '\\hslash', aside: 'h slash' },
    ],
    'i': [{ latex: '\\imaginaryI', aside: 'imaginary i' }, 'ì', 'í', 'î', 'ï'],
    'I': [{ latex: '\\imaginaryI', aside: 'imaginary i' }, 'Ì', 'Í', 'Î', 'Ï'],
    'j': [{ latex: '\\imaginaryJ', aside: 'imaginary j' }],
    'l': [{ latex: '\\ell', aside: 'ell' }],
    'n': [{ latex: '\\mathbb{N}', aside: 'set of natural numbers' }, 'ñ'],
    'o': ['ø', 'œ', 'ò', 'ó', 'ô', 'ö'],
    'O': ['ø', 'Œ', 'Ò', 'Ó', 'Ô', 'Ö'],
    'p': [{ latex: '\\mathbb{P}', aside: 'set of primes' }],
    'q': [{ latex: '\\mathbb{Q}', aside: 'set of rational numbers' }],
    'r': [{ latex: '\\mathbb{R}', aside: 'set of real numbers' }],
    'u': ['ù', 'ú', 'û', 'ü'],
    'U': ['Ù', 'Ú', 'Û', 'Ü'],
    'z': [{ latex: '\\mathbb{Z}', aside: 'set of integers' }],
    'y': ['ý', 'ÿ'],
    'Y': ['Ÿ'],
    'space': [
        {
            latex: '\\char"203A\\!\\char"2039',
            insert: '\\!',
            aside: 'negative thin space<br>⁻³⧸₁₈ em'
        },
        {
            latex: '\\char"203A\\,\\char"2039',
            insert: '\\,',
            aside: 'thin space<br>³⧸₁₈ em'
        },
        {
            latex: '\\char"203A\\:\\char"2039',
            insert: '\\:',
            aside: 'medium space<br>⁴⧸₁₈ em'
        },
        {
            latex: '\\char"203A\\;\\char"2039',
            insert: '\\;',
            aside: 'thick space<br>⁵⧸₁₈ em'
        },
        {
            latex: '\\char"203A\\ \\char"2039',
            insert: '\\ ',
            aside: '⅓ em'
        },
        {
            latex: '\\char"203A\\enspace\\char"2039',
            insert: '\\enspace',
            aside: '½ em'
        },
        {
            latex: '\\char"203A\\quad\\char"2039',
            insert: '\\quad',
            aside: '1 em'
        },
        {
            latex: '\\char"203A\\qquad\\char"2039',
            insert: '\\qquad',
            aside: '2 em'
        },
    ]
};
var gVariantPanelController;
function showVariantsPanel(element, onClose) {
    var _a, _b, _c, _d, _e;
    var keyboard = virtual_keyboard_1.VirtualKeyboard.singleton;
    if (!keyboard)
        return;
    var keycap = (0, utils_1.parentKeycap)(element);
    var variantDef = '';
    if (window.mathVirtualKeyboard.isShifted) {
        var shiftedDefinition = (_a = keyboard.getKeycap(keycap === null || keycap === void 0 ? void 0 : keycap.id)) === null || _a === void 0 ? void 0 : _a.shift;
        if (typeof shiftedDefinition === 'object' &&
            'variants' in shiftedDefinition) {
            variantDef = (_b = shiftedDefinition.variants) !== null && _b !== void 0 ? _b : '';
        }
    }
    else
        variantDef = (_d = (_c = keyboard.getKeycap(keycap === null || keycap === void 0 ? void 0 : keycap.id)) === null || _c === void 0 ? void 0 : _c.variants) !== null && _d !== void 0 ? _d : '';
    if ((typeof variantDef === 'string' && !hasVariants(variantDef)) ||
        (Array.isArray(variantDef) && variantDef.length === 0)) {
        onClose === null || onClose === void 0 ? void 0 : onClose();
        return;
    }
    var variants = {};
    var markup = '';
    for (var _i = 0, _f = getVariants(variantDef); _i < _f.length; _i++) {
        var variant = _f[_i];
        var keycap_1 = (0, utils_1.normalizeKeycap)(variant);
        var id = Date.now().toString(36).slice(-2) +
            Math.floor(Math.random() * 0x186a0).toString(36);
        variants[id] = keycap_1;
        var _g = (0, utils_1.renderKeycap)(keycap_1), keycapMarkup = _g[0], keycapCls = _g[1];
        markup += "<div id=".concat(id, " class=\"item ").concat(keycapCls, "\">").concat(keycapMarkup, "</div>");
    }
    var variantPanel = document.createElement('div');
    variantPanel.setAttribute('aria-hidden', 'true');
    variantPanel.className = 'MLK__variant-panel';
    // Reset variant panel height
    variantPanel.style.height = 'auto';
    var l = Object.keys(variants).length;
    var w = 5; // l >= 14, width 5
    if (l === 1)
        w = 1;
    else if (l === 2 || l === 4)
        w = 2;
    else if (l === 3 || l === 5 || l === 6)
        w = 3;
    else if (l >= 7 && l < 14)
        w = 4;
    variantPanel.style.width = "calc(var(--variant-keycap-length) * ".concat(w, " + 12px)");
    variantPanel.innerHTML = mathfield_element_1["default"].createHTML(markup);
    //
    // Create the scrim and attach the variants panel to it
    //
    scrim_1.Scrim.open({
        root: (_e = keyboard === null || keyboard === void 0 ? void 0 : keyboard.container) === null || _e === void 0 ? void 0 : _e.querySelector('.ML__keyboard'),
        child: variantPanel
    });
    gVariantPanelController = new AbortController();
    var signal = gVariantPanelController.signal;
    //
    // Position the variants panel
    //
    var position = element === null || element === void 0 ? void 0 : element.getBoundingClientRect();
    if (position) {
        if (position.top - variantPanel.clientHeight < 0) {
            // variantPanel.style.maxWidth = '320px';  // Up to six columns
            variantPanel.style.width = 'auto';
            if (l <= 6)
                variantPanel.style.height = '56px'; // 1 row
            else if (l <= 12)
                variantPanel.style.height = '108px'; // 2 rows
            else if (l <= 18)
                variantPanel.style.height = '205px'; // 3 rows
            else
                variantPanel.classList.add('compact');
        }
        var left = Math.max(0, Math.min(window.innerWidth - variantPanel.offsetWidth, (position.left + position.right - variantPanel.offsetWidth) / 2));
        var top_1 = position.top - variantPanel.clientHeight + 5;
        console.log('left: ', left);
        variantPanel.style.left = "".concat(left, "px");
        variantPanel.style.top = "".concat(top_1, "px");
        variantPanel.classList.add('is-visible');
        // Add the events handlers (which may dismiss the panel) only after the
        // panel has been displayed
        requestAnimationFrame(function () {
            variantPanel.addEventListener('pointerup', function (ev) {
                var target = (0, utils_1.parentKeycap)(ev.target);
                if (!(target === null || target === void 0 ? void 0 : target.id) || !variants[target.id])
                    return;
                (0, utils_1.executeKeycapCommand)(variants[target.id]);
                hideVariantsPanel();
                onClose === null || onClose === void 0 ? void 0 : onClose();
                ev.preventDefault();
            }, { capture: true, passive: false, signal: signal });
            variantPanel.addEventListener('pointerenter', function (ev) {
                var target = (0, utils_1.parentKeycap)(ev.target);
                if (!(target === null || target === void 0 ? void 0 : target.id) || !variants[target.id])
                    return;
                target.classList.add('is-active');
            }, { capture: true, signal: signal });
            variantPanel.addEventListener('pointerleave', function (ev) {
                var target = (0, utils_1.parentKeycap)(ev.target);
                if (!(target === null || target === void 0 ? void 0 : target.id) || !variants[target.id])
                    return;
                target.classList.remove('is-active');
            }, { capture: true, signal: signal });
            window.addEventListener('pointercancel', function () {
                hideVariantsPanel();
                onClose === null || onClose === void 0 ? void 0 : onClose();
            }, { signal: signal });
            window.addEventListener('pointerup', function () {
                hideVariantsPanel();
                onClose === null || onClose === void 0 ? void 0 : onClose();
            }, { signal: signal });
        });
    }
    return;
}
exports.showVariantsPanel = showVariantsPanel;
function hideVariantsPanel() {
    gVariantPanelController === null || gVariantPanelController === void 0 ? void 0 : gVariantPanelController.abort();
    gVariantPanelController = null;
    if (scrim_1.Scrim.state === 'open')
        scrim_1.Scrim.close();
}
exports.hideVariantsPanel = hideVariantsPanel;
function makeVariants(id) {
    if (id === 'foreground-color') {
        var result = [];
        for (var _i = 0, _a = Object.keys(color_1.FOREGROUND_COLORS); _i < _a.length; _i++) {
            var color = _a[_i];
            result.push({
                "class": 'swatch-button',
                label: '<span style="border: 3px solid ' +
                    color_1.FOREGROUND_COLORS[color] +
                    '"></span>',
                command: ['applyStyle', { color: color }]
            });
        }
        return result;
    }
    if (id === 'background-color') {
        var result = [];
        for (var _b = 0, _c = Object.keys(color_1.BACKGROUND_COLORS); _b < _c.length; _b++) {
            var color = _c[_b];
            result.push({
                "class": 'swatch-button',
                label: '<span style="background:' + color_1.BACKGROUND_COLORS[color] + '"></span>',
                command: ['applyStyle', { backgroundColor: color }]
            });
        }
        return result;
    }
    return undefined;
}
function hasVariants(id) {
    return VARIANTS[id] !== undefined;
}
exports.hasVariants = hasVariants;
function getVariants(id) {
    var _a;
    if (typeof id !== 'string')
        return id;
    if (!VARIANTS[id])
        VARIANTS[id] = (_a = makeVariants(id)) !== null && _a !== void 0 ? _a : [];
    return VARIANTS[id];
}
