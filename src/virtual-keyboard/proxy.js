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
exports.VirtualKeyboardProxy = exports.isVirtualKeyboardMessage = exports.VIRTUAL_KEYBOARD_MESSAGE = void 0;
var utils_1 = require("../editor-mathfield/utils");
var commands_1 = require("../editor/commands");
exports.VIRTUAL_KEYBOARD_MESSAGE = 'mathlive#virtual-keyboard-message';
function isVirtualKeyboardMessage(evt) {
    var _a;
    if (evt.type !== 'message')
        return false;
    var msg = evt;
    return ((_a = msg.data) === null || _a === void 0 ? void 0 : _a.type) === exports.VIRTUAL_KEYBOARD_MESSAGE;
}
exports.isVirtualKeyboardMessage = isVirtualKeyboardMessage;
/**
 * The `VirtualKeyboardProxy` singleton is used when inside an
 * iframe (a non-top level browsing context).
 *
 * It relays messages to the top level `VirtualKeyboard` instance.
 */
var VirtualKeyboardProxy = /** @class */ (function () {
    function VirtualKeyboardProxy() {
        this.targetOrigin = window.origin;
        this.originValidator = 'none';
        this._boundingRect = new DOMRect(0, 0, 0, 0);
        this._isShifted = false;
        window.addEventListener('message', this);
        this.sendMessage('proxy-created');
        this.listeners = {};
    }
    Object.defineProperty(VirtualKeyboardProxy, "singleton", {
        get: function () {
            if (!this._singleton)
                this._singleton = new VirtualKeyboardProxy();
            return this._singleton;
        },
        enumerable: false,
        configurable: true
    });
    VirtualKeyboardProxy.prototype.getKeycap = function (keycap) {
        return undefined;
    };
    VirtualKeyboardProxy.prototype.setKeycap = function (keycap, value) {
        this.sendMessage('update-setting', { setKeycap: { keycap: keycap, value: value } });
    };
    Object.defineProperty(VirtualKeyboardProxy.prototype, "alphabeticLayout", {
        set: function (value) {
            this.sendMessage('update-setting', { alphabeticLayout: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VirtualKeyboardProxy.prototype, "layouts", {
        set: function (value) {
            this.sendMessage('update-setting', { layouts: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VirtualKeyboardProxy.prototype, "normalizedLayouts", {
        get: function () {
            return [];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VirtualKeyboardProxy.prototype, "editToolbar", {
        set: function (value) {
            this.sendMessage('update-setting', { editToolbar: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VirtualKeyboardProxy.prototype, "container", {
        set: function (value) {
            throw new Error('Container inside an iframe cannot be changed');
        },
        enumerable: false,
        configurable: true
    });
    VirtualKeyboardProxy.prototype.show = function (options) {
        var success = this.dispatchEvent(new CustomEvent('before-virtual-keyboard-toggle', {
            detail: { visible: true },
            bubbles: true,
            cancelable: true,
            composed: true
        }));
        if (success) {
            this.sendMessage('show', options);
            this.dispatchEvent(new Event('virtual-keyboard-toggle'));
        }
    };
    VirtualKeyboardProxy.prototype.hide = function (options) {
        var success = this.dispatchEvent(new CustomEvent('before-virtual-keyboard-toggle', {
            detail: { visible: false },
            bubbles: true,
            cancelable: true,
            composed: true
        }));
        if (success) {
            this.sendMessage('hide', options);
            this.dispatchEvent(new Event('virtual-keyboard-toggle'));
        }
    };
    Object.defineProperty(VirtualKeyboardProxy.prototype, "isShifted", {
        get: function () {
            return this._isShifted;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VirtualKeyboardProxy.prototype, "visible", {
        get: function () {
            return this._boundingRect.height > 0;
        },
        set: function (value) {
            if (value)
                this.show();
            else
                this.hide();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VirtualKeyboardProxy.prototype, "boundingRect", {
        get: function () {
            return this._boundingRect;
        },
        enumerable: false,
        configurable: true
    });
    VirtualKeyboardProxy.prototype.executeCommand = function (command) {
        this.sendMessage('execute-command', { command: command });
        return true; // true = dirty
    };
    VirtualKeyboardProxy.prototype.updateToolbar = function (mf) {
        this.sendMessage('update-toolbar', mf);
    };
    VirtualKeyboardProxy.prototype.update = function (mf) {
        this.sendMessage('update-setting', mf);
    };
    VirtualKeyboardProxy.prototype.connect = function () {
        this.sendMessage('connect');
    };
    VirtualKeyboardProxy.prototype.disconnect = function () {
        this.sendMessage('disconnect');
    };
    VirtualKeyboardProxy.prototype.addEventListener = function (type, callback, _options) {
        if (!this.listeners[type])
            this.listeners[type] = new Set();
        if (!this.listeners[type].has(callback))
            this.listeners[type].add(callback);
    };
    VirtualKeyboardProxy.prototype.dispatchEvent = function (event) {
        if (!this.listeners[event.type] || this.listeners[event.type].size === 0)
            return true;
        this.listeners[event.type].forEach(function (x) {
            if (typeof x === 'function')
                x(event);
            else
                x === null || x === void 0 ? void 0 : x.handleEvent(event);
        });
        return !event.defaultPrevented;
    };
    VirtualKeyboardProxy.prototype.removeEventListener = function (type, callback, _options) {
        if (this.listeners[type])
            this.listeners[type]["delete"](callback);
    };
    VirtualKeyboardProxy.prototype.handleEvent = function (evt) {
        if (isVirtualKeyboardMessage(evt)) {
            if (!(0, utils_1.validateOrigin)(evt.origin, this.originValidator)) {
                throw new DOMException("Message from unknown origin (".concat(evt.origin, ") cannot be handled"), 'SecurityError');
            }
            this.handleMessage(evt.data);
        }
    };
    VirtualKeyboardProxy.prototype.handleMessage = function (msg) {
        var action = msg.action;
        if (action === 'execute-command') {
            var command = msg.command;
            var commandTarget = (0, commands_1.getCommandTarget)(command);
            if (commandTarget === 'virtual-keyboard')
                this.executeCommand(command);
            return;
        }
        if (action === 'synchronize-proxy') {
            this._boundingRect = msg.boundingRect;
            this._isShifted = msg.isShifted;
            return;
        }
        if (action === 'geometry-changed') {
            this._boundingRect = msg.boundingRect;
            this.dispatchEvent(new Event('geometrychange'));
            return;
        }
    };
    VirtualKeyboardProxy.prototype.sendMessage = function (action, payload) {
        if (payload === void 0) { payload = {}; }
        if (!window.top) {
            throw new DOMException("A frame does not have access to the top window and can\u2018t communicate with the keyboard. Review virtualKeyboardTargetOrigin and originValidator on mathfields embedded in an iframe", 'SecurityError');
        }
        window.top.postMessage(__assign({ type: exports.VIRTUAL_KEYBOARD_MESSAGE, action: action }, payload), this.targetOrigin);
    };
    return VirtualKeyboardProxy;
}());
exports.VirtualKeyboardProxy = VirtualKeyboardProxy;
