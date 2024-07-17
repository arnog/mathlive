"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
exports.__esModule = true;
exports.VirtualKeyboardProxy = exports.VirtualKeyboard = void 0;
var capabilities_1 = require("../ui/utils/capabilities");
var virtual_keyboard_1 = require("./virtual-keyboard");
var proxy_1 = require("./proxy");
var virtual_keyboard_2 = require("./virtual-keyboard");
__createBinding(exports, virtual_keyboard_2, "VirtualKeyboard");
var proxy_2 = require("./proxy");
__createBinding(exports, proxy_2, "VirtualKeyboardProxy");
if ((0, capabilities_1.isBrowser)() && !('mathVirtualKeyboard' in window)) {
    if (window === window['top']) {
        // When at the top-level window, mathVirtualKeyboard is a singleton
        // VirtualKeyboard. Instantiate it during static init, otherwise
        // mathfields in iFrame will not be able to talk to it until it has been
        // instantiated (which the client may not do)
        var kbd_1 = virtual_keyboard_1.VirtualKeyboard.singleton;
        Object.defineProperty(window, 'mathVirtualKeyboard', {
            get: function () { return kbd_1; }
        });
    }
    else {
        // When in an iFrame, the mathVirtualKeyboard is a proxy
        Object.defineProperty(window, 'mathVirtualKeyboard', {
            get: function () { return proxy_1.VirtualKeyboardProxy.singleton; },
            configurable: true
        });
    }
}
