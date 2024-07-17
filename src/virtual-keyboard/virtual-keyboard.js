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
exports.VirtualKeyboard = void 0;
var mathfield_element_1 = require("../public/mathfield-element");
var capabilities_1 = require("../ui/utils/capabilities");
var types_1 = require("../common/types");
var utils_1 = require("../editor-mathfield/utils");
var commands_1 = require("../editor/commands");
var proxy_1 = require("./proxy");
var utils_2 = require("./utils");
var variants_1 = require("./variants");
var utils_3 = require("../ui/events/utils");
var VirtualKeyboard = /** @class */ (function () {
    function VirtualKeyboard() {
        var _this = this;
        var _a;
        this.originalContainerBottomPadding = null;
        this.keycapRegistry = {};
        /**
         * `0`: not pressed
         * `1`: Shift is locked for next char only
         * `2`: Shift is locked for all characters
         */
        this._shiftPressCount = 0;
        this.targetOrigin = window.origin;
        this.originValidator = 'none';
        this._alphabeticLayout = 'auto';
        this._layouts = Object.freeze(['default']);
        this._editToolbar = 'default';
        this._container = undefined;
        this._visible = false;
        this._rebuilding = false;
        this.observer = new ResizeObserver(function (_entries) {
            _this.adjustBoundingRect();
            _this.dispatchEvent(new Event('geometrychange'));
            _this.sendMessage('geometry-changed', { boundingRect: _this.boundingRect });
        });
        this.listeners = {};
        try {
            (_a = window.top) === null || _a === void 0 ? void 0 : _a.addEventListener('message', this);
        }
        catch (e) {
            // We are in an iframe and the parent document is not accessible
            // (different domains)
            window.addEventListener('message', this);
        }
        // Listen for when a mathfield gets focused, and show
        // the virtual keyboard if needed
        document.addEventListener('focusin', function (event) {
            var target = event.target;
            if (!(target === null || target === void 0 ? void 0 : target.isConnected))
                return;
            setTimeout(function () {
                var mf = focusedMathfield();
                if (mf &&
                    !mf.readOnly &&
                    mf.mathVirtualKeyboardPolicy === 'auto' &&
                    (0, capabilities_1.isTouchCapable)())
                    _this.show({ animate: true });
            }, 300);
        });
        document.addEventListener('focusout', function (evt) {
            if (!(evt.target instanceof mathfield_element_1.MathfieldElement))
                return;
            if (evt.target.mathVirtualKeyboardPolicy !== 'manual') {
                // If after a short delay the active element is no longer
                // a mathfield (or there is no active element), hide the virtual keyboard
                setTimeout(function () {
                    if (!focusedMathfield())
                        _this.hide();
                }, 300);
            }
        });
    }
    Object.defineProperty(VirtualKeyboard.prototype, "currentLayer", {
        get: function () {
            var _a, _b, _c;
            return (_c = (_b = (_a = this._element) === null || _a === void 0 ? void 0 : _a.querySelector('.MLK__layer.is-visible')) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : '';
        },
        set: function (id) {
            var _a;
            if (!this._element) {
                this.latentLayer = id;
                return;
            }
            var newActive = id
                ? this._element.querySelector("#".concat(id, ".MLK__layer"))
                : null;
            if (!newActive)
                newActive = this._element.querySelector('.MLK__layer');
            if (newActive) {
                (_a = this._element
                    .querySelector('.MLK__layer.is-visible')) === null || _a === void 0 ? void 0 : _a.classList.remove('is-visible');
                newActive.classList.add('is-visible');
            }
            this.render();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VirtualKeyboard.prototype, "shiftPressCount", {
        get: function () {
            return this._shiftPressCount;
        },
        set: function (count) {
            var _a;
            this._shiftPressCount = count > 2 || count < 0 ? 0 : count;
            (_a = this._element) === null || _a === void 0 ? void 0 : _a.classList.toggle('is-caps-lock', this.shiftPressCount === 2);
            this.render();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VirtualKeyboard.prototype, "isShifted", {
        get: function () {
            return this._shiftPressCount > 0;
        },
        enumerable: false,
        configurable: true
    });
    VirtualKeyboard.prototype.resetKeycapRegistry = function () {
        this.keycapRegistry = {};
    };
    VirtualKeyboard.prototype.registerKeycap = function (keycap) {
        var id = 'ML__k' +
            Date.now().toString(36).slice(-2) +
            Math.floor(Math.random() * 0x186a0).toString(36);
        this.keycapRegistry[id] = keycap;
        return id;
    };
    VirtualKeyboard.prototype.setKeycap = function (keycap, value) {
        utils_2.KEYCAP_SHORTCUTS[keycap] = (0, utils_2.normalizeKeycap)(value);
        this.rebuild();
    };
    VirtualKeyboard.prototype.getKeycap = function (id) {
        var _a;
        return id ? (_a = utils_2.KEYCAP_SHORTCUTS[id]) !== null && _a !== void 0 ? _a : this.keycapRegistry[id] : undefined;
    };
    VirtualKeyboard.prototype.getLayer = function (id) {
        var layouts = this.normalizedLayouts;
        for (var _i = 0, layouts_1 = layouts; _i < layouts_1.length; _i++) {
            var layout = layouts_1[_i];
            for (var _a = 0, _b = layout.layers; _a < _b.length; _a++) {
                var layer = _b[_a];
                if (layer.id === id)
                    return layer;
            }
        }
        return undefined;
    };
    Object.defineProperty(VirtualKeyboard.prototype, "alphabeticLayout", {
        get: function () {
            return this._alphabeticLayout;
        },
        set: function (value) {
            this._alphabeticLayout = value;
            this._normalizedLayouts = undefined;
            this.rebuild();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VirtualKeyboard.prototype, "layouts", {
        get: function () {
            return this._layouts;
        },
        set: function (value) {
            this.updateNormalizedLayouts(value);
            this.rebuild();
        },
        enumerable: false,
        configurable: true
    });
    VirtualKeyboard.prototype.updateNormalizedLayouts = function (value) {
        var layouts = Array.isArray(value) ? __spreadArray([], value, true) : [value];
        var defaultIndex = layouts.findIndex(function (x) { return x === 'default'; });
        if (defaultIndex >= 0) {
            layouts.splice(defaultIndex, 1, 'numeric', 'symbols', 'alphabetic', 'greek');
        }
        this._layouts = Object.freeze(layouts);
        this._normalizedLayouts = layouts.map(function (x) { return (0, utils_2.normalizeLayout)(x); });
    };
    Object.defineProperty(VirtualKeyboard.prototype, "normalizedLayouts", {
        get: function () {
            if (!this._normalizedLayouts)
                this.updateNormalizedLayouts(this._layouts);
            return this._normalizedLayouts;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VirtualKeyboard.prototype, "editToolbar", {
        get: function () {
            return this._editToolbar;
        },
        set: function (value) {
            this._editToolbar = value;
            this.rebuild();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VirtualKeyboard.prototype, "container", {
        get: function () {
            if (this._container === undefined)
                return window.document.body;
            return this._container;
        },
        set: function (value) {
            this._container = value;
            this.rebuild();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VirtualKeyboard, "singleton", {
        get: function () {
            if (this._singleton === undefined) {
                try {
                    this._singleton = new VirtualKeyboard();
                }
                catch (e) {
                    this._singleton = null;
                }
            }
            return this._singleton;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VirtualKeyboard.prototype, "style", {
        get: function () {
            return this._style;
        },
        enumerable: false,
        configurable: true
    });
    VirtualKeyboard.prototype.addEventListener = function (type, callback, _options) {
        if (!this.listeners[type])
            this.listeners[type] = new Set();
        if (!this.listeners[type].has(callback))
            this.listeners[type].add(callback);
    };
    VirtualKeyboard.prototype.dispatchEvent = function (event) {
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
    VirtualKeyboard.prototype.removeEventListener = function (type, callback, _options) {
        if (this.listeners[type])
            this.listeners[type]["delete"](callback);
    };
    Object.defineProperty(VirtualKeyboard.prototype, "element", {
        get: function () {
            return this._element;
        },
        set: function (val) {
            var _a;
            if (this._element === val)
                return;
            (_a = this._element) === null || _a === void 0 ? void 0 : _a.remove();
            this._element = val;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VirtualKeyboard.prototype, "visible", {
        get: function () {
            return this._visible;
        },
        set: function (val) {
            if (val)
                this.show();
            else
                this.hide();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VirtualKeyboard.prototype, "boundingRect", {
        get: function () {
            var _a;
            if (!this._visible)
                return new DOMRect();
            var plate = (_a = this._element) === null || _a === void 0 ? void 0 : _a.getElementsByClassName('MLK__plate')[0];
            if (plate)
                return plate.getBoundingClientRect();
            return new DOMRect();
        },
        enumerable: false,
        configurable: true
    });
    VirtualKeyboard.prototype.adjustBoundingRect = function () {
        var _a, _b;
        // Adjust the keyboard height
        var h = this.boundingRect.height;
        if (this.container === document.body) {
            (_a = this._element) === null || _a === void 0 ? void 0 : _a.style.setProperty('--_keyboard-height', "calc(".concat(h, "px + var(--_padding-top) + var(--_padding-bottom) + env(safe-area-inset-bottom, 0))"));
            var keyboardHeight = h - 1;
            this.container.style.paddingBottom = this.originalContainerBottomPadding
                ? "calc(".concat(this.originalContainerBottomPadding, " + ").concat(keyboardHeight, "px)")
                : "".concat(keyboardHeight, "px");
        }
        else
            (_b = this._element) === null || _b === void 0 ? void 0 : _b.style.setProperty('--_keyboard-height', "".concat(h, "px"));
    };
    VirtualKeyboard.prototype.rebuild = function () {
        var _this = this;
        if (this._rebuilding || !this._element)
            return;
        this._rebuilding = true;
        var currentLayerId = this.currentLayer;
        requestAnimationFrame(function () {
            _this._rebuilding = false;
            // By the time the handler is called, the _element may have been destroyed
            if (_this._element) {
                _this._element.remove();
                _this._element = undefined;
            }
            if (_this.visible) {
                _this.buildAndAttachElement();
                // Restore the active keyboard
                _this.currentLayer = currentLayerId;
                _this.render();
                _this.adjustBoundingRect();
                // Show the keyboard panel
                _this._element.classList.add('is-visible');
            }
        });
    };
    /** Update the keycaps to account for the current state */
    VirtualKeyboard.prototype.render = function () {
        var _a;
        if (!this._element)
            return;
        // If there's a container, hide the default backdrop
        var layer = this.getLayer(this.currentLayer);
        this._element.classList.toggle('backdrop-is-transparent', Boolean(layer && (layer.backdrop || layer.container)));
        var keycaps = this._element.querySelectorAll('.MLK__layer.is-visible .MLK__keycap, .MLK__layer.is-visible .action, .fnbutton, .MLK__layer.is-visible .bigfnbutton, .MLK__layer.is-visible .shift');
        if (!keycaps)
            return;
        var shifted = this.isShifted;
        for (var _i = 0, keycaps_1 = keycaps; _i < keycaps_1.length; _i++) {
            var keycapElement = keycaps_1[_i];
            var keycap = this.getKeycap(keycapElement.id);
            if (keycap) {
                var _b = (0, utils_2.renderKeycap)(keycap, { shifted: shifted }), markup = _b[0], cls = _b[1];
                keycapElement.innerHTML =
                    globalThis.MathfieldElement.createHTML(markup);
                keycapElement.className = cls;
                if (shifted &&
                    typeof keycap.shift === 'object' &&
                    ((_a = keycap.shift) === null || _a === void 0 ? void 0 : _a.tooltip))
                    keycapElement.dataset.tooltip = keycap.shift.tooltip;
                else if (!shifted && keycap.tooltip)
                    keycapElement.dataset.tooltip = keycap.tooltip;
            }
        }
    };
    VirtualKeyboard.prototype.show = function (options) {
        var _this = this;
        var _a;
        if (this._visible)
            return;
        var container = this.container;
        if (!container)
            return;
        if (!window.mathVirtualKeyboard)
            return;
        // Confirm
        if (!this.stateWillChange(true))
            return;
        if (!this._element) {
            this.buildAndAttachElement();
            this.adjustBoundingRect();
        }
        if (!this._visible) {
            var plate = this._element.getElementsByClassName('MLK__plate')[0];
            if (plate)
                this.observer.observe(plate);
            if (container === window.document.body) {
                var padding = container.style.paddingBottom;
                this.originalContainerBottomPadding = padding;
                var keyboardHeight = plate.offsetHeight - 1;
                container.style.paddingBottom = padding
                    ? "calc(".concat(padding, " + ").concat(keyboardHeight, "px)")
                    : "".concat(keyboardHeight, "px");
            }
            window.addEventListener('mouseup', this);
            window.addEventListener('blur', this);
            window.addEventListener('keydown', this, { capture: true });
            window.addEventListener('keyup', this, { capture: true });
            (_a = this._element) === null || _a === void 0 ? void 0 : _a.classList.toggle('is-caps-lock', this.shiftPressCount === 2);
            this.currentLayer = this.latentLayer;
        }
        this._visible = true;
        // For the transition effect to work, the property has to be changed
        // after the insertion in the DOM.
        if (options === null || options === void 0 ? void 0 : options.animate) {
            requestAnimationFrame(function () {
                if (_this._element) {
                    _this._element.classList.add('animate');
                    _this._element.addEventListener('transitionend', function () { var _a; return (_a = _this._element) === null || _a === void 0 ? void 0 : _a.classList.remove('animate'); }, { once: true });
                    _this._element.classList.add('is-visible');
                    _this.stateChanged();
                }
            });
        }
        else {
            this._element.classList.add('is-visible');
            this.stateChanged();
        }
    };
    VirtualKeyboard.prototype.hide = function (_options) {
        var _a;
        var container = this.container;
        if (!container)
            return;
        if (!this._visible)
            return;
        // Confirm
        if (!this.stateWillChange(false))
            return;
        this._visible = false;
        if (this._element) {
            this.latentLayer = this.currentLayer;
            var plate = this._element.getElementsByClassName('MLK__plate')[0];
            if (plate)
                this.observer.unobserve(plate);
            // Remove the element from the DOM
            window.removeEventListener('mouseup', this);
            window.removeEventListener('blur', this);
            window.removeEventListener('keydown', this, { capture: true });
            window.removeEventListener('keyup', this, { capture: true });
            window.removeEventListener('contextmenu', this, { capture: true });
            (0, variants_1.hideVariantsPanel)();
            (0, utils_2.releaseStylesheets)();
            (_a = this._element) === null || _a === void 0 ? void 0 : _a.remove();
            this._element = undefined;
            if (this.originalContainerBottomPadding !== null)
                container.style.paddingBottom = this.originalContainerBottomPadding;
        }
        this.stateChanged();
    };
    Object.defineProperty(VirtualKeyboard.prototype, "height", {
        get: function () {
            var _a, _b;
            return (_b = (_a = this.element) === null || _a === void 0 ? void 0 : _a.offsetHeight) !== null && _b !== void 0 ? _b : 0;
        },
        enumerable: false,
        configurable: true
    });
    VirtualKeyboard.prototype.buildAndAttachElement = function () {
        var _a;
        console.assert(!this.element);
        this.element = (0, utils_2.makeKeyboardElement)(this);
        // this.element.addEventListener('pointerdown', () => this.focus());
        // To prevent the long press contextmenu from showing up in Chrome...
        window.addEventListener('contextmenu', this, { capture: true });
        this.element.addEventListener('contextmenu', function (ev) {
            if (!ev.shiftKey) {
                if (ev.ctrlKey || ev.button === 2)
                    (0, variants_1.showVariantsPanel)(ev.target);
                ev.preventDefault();
                ev.stopPropagation();
            }
        }, { capture: true });
        (_a = this.container) === null || _a === void 0 ? void 0 : _a.appendChild(this.element);
    };
    VirtualKeyboard.prototype.handleEvent = function (evt) {
        if ((0, proxy_1.isVirtualKeyboardMessage)(evt)) {
            if (!(0, utils_1.validateOrigin)(evt.origin, this.originValidator)) {
                throw new DOMException("Message from unknown origin (".concat(evt.origin, ") cannot be handled"), 'SecurityError');
            }
            if (evt.data.action === 'disconnect')
                this.connectedMathfieldWindow = undefined;
            else if (evt.data.action !== 'update-setting' &&
                evt.data.action !== 'proxy-created' &&
                evt.data.action !== 'execute-command') {
                console.assert(evt.source !== undefined);
                this.connectedMathfieldWindow = evt.source;
            }
            this.handleMessage(evt.data, evt.source);
        }
        if (!this._element)
            return;
        switch (evt.type) {
            case 'mouseup':
            case 'blur':
                // Safari on iOS will aggressively attempt to select when there is a long
                // press. Restore the userSelect on mouse up
                document.body.style.userSelect = '';
                this.shiftPressCount = 0;
                break;
            case 'contextmenu':
                if (evt.button !== 2)
                    evt.preventDefault();
                break;
            case 'keydown': {
                if (evt.key === 'Shift' && !evt.repeat)
                    this.shiftPressCount = 1;
                break;
            }
            case 'keyup': {
                if (evt.key === 'Shift' ||
                    (!evt.getModifierState('Shift') && this.shiftPressCount !== 2))
                    this.shiftPressCount = 0;
                break;
            }
        }
    };
    VirtualKeyboard.prototype.handleMessage = function (msg, source) {
        var action = msg.action;
        if (action === 'execute-command') {
            var command = msg.command;
            // Avoid an infinite messages loop if within one window
            var commandTarget = (0, commands_1.getCommandTarget)(command);
            if (window.top !== undefined && commandTarget !== 'virtual-keyboard')
                return;
            this.executeCommand(command);
            return;
        }
        if (action === 'connect' || action === 'show') {
            this.sendMessage('synchronize-proxy', {
                boundingRect: this.boundingRect,
                alphabeticLayout: this._alphabeticLayout,
                layouts: this._layouts,
                editToolbar: this._editToolbar
            }, source);
        }
        if (action === 'disconnect')
            return;
        // If the mathVirtualKeyboardPolicy was set to `sandboxed`,
        // we can be a VirtualKeyboard instance (not a proxy) inside a non-top-level
        // browsing context. If that's the case, safely ignored messages that could
        // be dispatched from other mathfields, as we will only respond to
        // direct invocation via function dispatching on the VK instance.
        if (window !== window.top)
            return;
        if (action === 'show') {
            if (typeof msg.animate !== 'undefined')
                this.show({ animate: msg.animate });
            else
                this.show();
            return;
        }
        if (action === 'hide') {
            if (typeof msg.animate !== 'undefined')
                this.hide({ animate: msg.animate });
            else
                this.hide();
            return;
        }
        if (action === 'update-setting') {
            // A proxy has an updated setting
            if (msg.alphabeticLayout)
                this.alphabeticLayout = msg.alphabeticLayout;
            if (msg.layouts)
                this.layouts = msg.layouts;
            if (msg.editToolbar)
                this.editToolbar = msg.editToolbar;
            if (msg.setKeycap) {
                var _a = msg.setKeycap, keycap = _a.keycap, value = _a.value;
                this.setKeycap(keycap, value);
                this.render();
            }
            return;
        }
        if (action === 'proxy-created') {
            // A new proxy has been created. Dispatch a message to synchronize
            // the reflected state
            this.sendMessage('synchronize-proxy', {
                boundingRect: this.boundingRect,
                alphabeticLayout: this._alphabeticLayout,
                layouts: this._layouts,
                editToolbar: this._editToolbar
            }, source);
            return;
        }
    };
    VirtualKeyboard.prototype.sendMessage = function (action, payload, target) {
        // Dispatch an event. The listeners must listen to `mathVirtualKeyboard`
        if (payload.command) {
            this.dispatchEvent(new CustomEvent('math-virtual-keyboard-command', {
                detail: payload.command
            }));
        }
        if (!target)
            target = this.connectedMathfieldWindow;
        if (this.targetOrigin === null ||
            this.targetOrigin === 'null' ||
            target === window) {
            window.dispatchEvent(new MessageEvent('message', {
                source: window,
                data: __assign({ type: proxy_1.VIRTUAL_KEYBOARD_MESSAGE, action: action }, payload)
            }));
            return;
        }
        if (target) {
            target.postMessage(__assign({ type: proxy_1.VIRTUAL_KEYBOARD_MESSAGE, action: action }, payload), { targetOrigin: this.targetOrigin });
        }
        else {
            if (action === 'execute-command' &&
                Array.isArray(payload.command) &&
                payload.command[0] === 'insert') {
                var s = payload.command[1].split('');
                for (var _i = 0, s_1 = s; _i < s_1.length; _i++) {
                    var c = s_1[_i];
                    this.dispatchEvent(new KeyboardEvent('keydown', { key: c, bubbles: true }));
                    this.dispatchEvent(new KeyboardEvent('keyup', { key: c, bubbles: true }));
                }
            }
        }
    };
    VirtualKeyboard.prototype.stateWillChange = function (visible) {
        var success = this.dispatchEvent(new CustomEvent('before-virtual-keyboard-toggle', {
            detail: { visible: visible },
            bubbles: true,
            cancelable: true,
            composed: true
        }));
        return success;
    };
    VirtualKeyboard.prototype.stateChanged = function () {
        this.dispatchEvent(new Event('virtual-keyboard-toggle'));
        if (!this._visible) {
            this.dispatchEvent(new Event('geometrychange'));
            this.sendMessage('geometry-changed', {
                boundingRect: this.boundingRect
            });
        }
    };
    /**
     * @category Focus
     */
    VirtualKeyboard.prototype.focus = function () {
        this.sendMessage('focus', {});
    };
    /**
     * @category Focus
     */
    VirtualKeyboard.prototype.blur = function () {
        this.sendMessage('blur', {});
    };
    VirtualKeyboard.prototype.updateToolbar = function (mf) {
        var el = this._element;
        if (!el)
            return;
        el.classList.toggle('is-math-mode', mf.mode === 'math');
        el.classList.toggle('is-text-mode', mf.mode === 'text');
        el.classList.toggle('can-undo', mf.canUndo);
        el.classList.toggle('can-redo', mf.canRedo);
        el.classList.toggle('can-copy', !mf.selectionIsCollapsed);
        el.classList.toggle('can-copy', !mf.selectionIsCollapsed);
        el.classList.toggle('can-paste', true);
        var toolbars = el.querySelectorAll('.ML__edit-toolbar');
        if (!toolbars)
            return;
        for (var _i = 0, toolbars_1 = toolbars; _i < toolbars_1.length; _i++) {
            var toolbar_1 = toolbars_1[_i];
            toolbar_1.innerHTML = (0, utils_2.makeEditToolbar)(this, mf);
        }
    };
    VirtualKeyboard.prototype.update = function (mf) {
        this._style = mf.style;
        this.updateToolbar(mf);
    };
    VirtualKeyboard.prototype.connect = function () {
        this.connectedMathfieldWindow = window;
    };
    VirtualKeyboard.prototype.disconnect = function () {
        this.connectedMathfieldWindow = undefined;
    };
    VirtualKeyboard.prototype.executeCommand = function (command) {
        var _a;
        command = (0, commands_1.parseCommand)(command);
        if (!command)
            return false;
        var selector;
        var args = [];
        var target = (0, commands_1.getCommandTarget)(command);
        if ((0, types_1.isArray)(command)) {
            selector = command[0];
            if (selector === 'performWithFeedback') {
                target = (0, commands_1.getCommandTarget)(command.slice(1));
            }
            args = command.slice(1);
        }
        else
            selector = command;
        if (target === 'virtual-keyboard')
            return (_a = commands_1.COMMANDS[selector]).fn.apply(_a, __spreadArray([undefined], args, false));
        this.sendMessage('execute-command', { command: command });
        return false;
    };
    VirtualKeyboard.prototype.dispose = function () {
        window.removeEventListener('mouseup', this);
        window.removeEventListener('blur', this);
        window.removeEventListener('message', this);
    };
    return VirtualKeyboard;
}());
exports.VirtualKeyboard = VirtualKeyboard;
function focusedMathfield() {
    var target = (0, utils_3.deepActiveElement)();
    var mf = null;
    while (target) {
        if ('host' in target && target.host instanceof mathfield_element_1.MathfieldElement) {
            mf = target.host;
            break;
        }
        target = target.parentNode;
    }
    return mf;
}
