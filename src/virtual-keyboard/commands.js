"use strict";
exports.__esModule = true;
exports.switchKeyboardLayer = void 0;
var commands_1 = require("../editor/commands");
var variants_1 = require("./variants");
var virtual_keyboard_1 = require("./virtual-keyboard");
function switchKeyboardLayer(mathfield, layerName) {
    var keyboard = virtual_keyboard_1.VirtualKeyboard.singleton;
    if (!keyboard)
        return false;
    keyboard.show();
    // If the variants panel was visible, hide it
    (0, variants_1.hideVariantsPanel)();
    keyboard.currentLayer = layerName;
    keyboard.render(); // Account for shift state
    keyboard.focus();
    return true;
}
exports.switchKeyboardLayer = switchKeyboardLayer;
function toggleVirtualKeyboard() {
    var kbd = window.mathVirtualKeyboard;
    if (kbd.visible)
        kbd.hide({ animate: true });
    else
        kbd.show({ animate: true });
    return false;
}
(0, commands_1.register)({
    switchKeyboardLayer: switchKeyboardLayer,
    toggleVirtualKeyboard: toggleVirtualKeyboard,
    hideVirtualKeyboard: function () {
        window.mathVirtualKeyboard.hide({ animate: true });
        return false;
    },
    showVirtualKeyboard: function () {
        window.mathVirtualKeyboard.show({ animate: true });
        return false;
    }
}, { target: 'virtual-keyboard' });
