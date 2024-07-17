"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.deepActiveElement = exports.mightProducePrintableCharacter = exports.equalKeyboardModifiers = exports.keyboardModifiersFromEvent = exports.eventLocation = void 0;
function eventLocation(evt) {
    if (evt instanceof MouseEvent || evt instanceof PointerEvent)
        return { x: evt.clientX, y: evt.clientY };
    if (typeof TouchEvent !== 'undefined' && evt instanceof TouchEvent) {
        var result = __spreadArray([], evt.touches, true).reduce(function (acc, x) { return ({ x: acc.x + x.clientX, y: acc.y + x.clientY }); }, { x: 0, y: 0 });
        var l = evt.touches.length;
        return { x: result.x / l, y: result.y / l };
    }
    return undefined;
}
exports.eventLocation = eventLocation;
// export function eventPointerCount(evt: Event): number {
//   if (evt instanceof MouseEvent) return 1;
//   if (evt instanceof TouchEvent) return evt.touches.length;
//   return 0;
// }
function keyboardModifiersFromEvent(ev) {
    var result = {
        alt: false,
        control: false,
        shift: false,
        meta: false
    };
    if (ev instanceof MouseEvent ||
        ev instanceof PointerEvent ||
        (typeof TouchEvent !== 'undefined' && ev instanceof TouchEvent) ||
        ev instanceof KeyboardEvent) {
        if (ev.altKey)
            result.alt = true;
        if (ev.ctrlKey)
            result.control = true;
        if (ev.metaKey)
            result.meta = true;
        if (ev.shiftKey)
            result.shift = true;
    }
    return result;
}
exports.keyboardModifiersFromEvent = keyboardModifiersFromEvent;
function equalKeyboardModifiers(a, b) {
    if ((!a && b) || (a && !b))
        return false;
    if (!a || !b)
        return true;
    return (a.alt === b.alt &&
        a.control === b.control &&
        a.shift === b.shift &&
        a.meta === b.meta);
}
exports.equalKeyboardModifiers = equalKeyboardModifiers;
var PRINTABLE_KEYCODE = new Set([
    'Backquote',
    'Digit0',
    'Digit1',
    'Digit2',
    'Digit3',
    'Digit4',
    'Digit5',
    'Digit6',
    'Digit7',
    'Digit8',
    'Digit9',
    'Minus',
    'Equal',
    'IntlYen',
    'KeyQ',
    'KeyW',
    'KeyE',
    'KeyR',
    'KeyT',
    'KeyY',
    'KeyU',
    'KeyI',
    'KeyO',
    'KeyP',
    'BracketLeft',
    'BracketRight',
    'Backslash',
    'KeyA',
    'KeyS',
    'KeyD',
    'KeyF',
    'KeyG',
    'KeyH',
    'KeyJ',
    'KeyK',
    'KeyL',
    'Semicolon',
    'Quote',
    'IntlBackslash',
    'KeyZ',
    'KeyX',
    'KeyC',
    'KeyV',
    'KeyB',
    'KeyN',
    'KeyM',
    'Comma',
    'Period',
    'Slash',
    'IntlRo',
    'Space',
    'Numpad0',
    'Numpad1',
    'Numpad2',
    'Numpad3',
    'Numpad4',
    'Numpad5',
    'Numpad6',
    'Numpad7',
    'Numpad8',
    'Numpad9',
    'NumpadAdd',
    'NumpadComma',
    'NumpadDecimal',
    'NumpadDivide',
    'NumpadEqual',
    'NumpadHash',
    'NumpadMultiply',
    'NumpadParenLeft',
    'NumpadParenRight',
    'NumpadStar',
    'NumpadSubstract',
]);
function mightProducePrintableCharacter(evt) {
    // Ignore ctrl/cmd-combinations but not shift/alt-combinations
    if (evt.ctrlKey || evt.metaKey)
        return false;
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
    if (['Dead', 'Process'].includes(evt.key))
        return false;
    // When issued via a composition, the `code` field is empty
    if (evt.code === '')
        return true;
    return PRINTABLE_KEYCODE.has(evt.code);
}
exports.mightProducePrintableCharacter = mightProducePrintableCharacter;
function deepActiveElement() {
    var _a;
    var a = document.activeElement;
    while ((_a = a === null || a === void 0 ? void 0 : a.shadowRoot) === null || _a === void 0 ? void 0 : _a.activeElement)
        a = a.shadowRoot.activeElement;
    return a;
}
exports.deepActiveElement = deepActiveElement;
