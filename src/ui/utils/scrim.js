"use strict";
exports.__esModule = true;
exports.Scrim = void 0;
var utils_1 = require("../events/utils");
var Scrim = /** @class */ (function () {
    /**
     * - If `lightDismiss` is true, the scrim is closed if the
     * user clicks on the scrim. That's the behavior for menus, for example.
     * When you need a fully modal situation until the user has made an
     * explicit choice (validating cookie usage, for example), set
     * `lightDismiss` to fallse.
     */
    function Scrim(options) {
        var _a, _b;
        this.lightDismiss = (_a = options === null || options === void 0 ? void 0 : options.lightDismiss) !== null && _a !== void 0 ? _a : true;
        this.translucent = (_b = options === null || options === void 0 ? void 0 : options.translucent) !== null && _b !== void 0 ? _b : false;
        this.state = 'closed';
    }
    Object.defineProperty(Scrim, "scrim", {
        get: function () {
            if (!Scrim._scrim)
                Scrim._scrim = new Scrim();
            return Scrim._scrim;
        },
        enumerable: false,
        configurable: true
    });
    Scrim.open = function (options) {
        Scrim.scrim.open(options);
    };
    Scrim.close = function () {
        Scrim.scrim.close();
    };
    Object.defineProperty(Scrim, "state", {
        get: function () {
            return Scrim.scrim.state;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Scrim, "element", {
        get: function () {
            return Scrim.scrim.element;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Scrim.prototype, "element", {
        get: function () {
            if (this._element)
                return this._element;
            var element = document.createElement('div');
            element.setAttribute('role', 'presentation');
            element.style.position = 'fixed';
            element.style.contain = 'content';
            element.style.top = '0';
            element.style.left = '0';
            element.style.right = '0';
            element.style.bottom = '0';
            element.style.zIndex = 'var(--scrim-zindex, 10099)'; // Bootstrap modals are at 10050 (see #1201)
            element.style.outline = 'none';
            if (this.translucent) {
                element.style.background = 'rgba(255, 255, 255, .2)';
                element.style['backdropFilter'] = 'contrast(40%)';
            }
            else
                element.style.background = 'transparent';
            this._element = element;
            return element;
        },
        enumerable: false,
        configurable: true
    });
    Scrim.prototype.open = function (options) {
        var _a;
        if (this.state !== 'closed')
            return;
        this.state = 'opening';
        this.onDismiss = options === null || options === void 0 ? void 0 : options.onDismiss;
        // Remember the previously focused element. We'll restore it when we close.
        this.savedActiveElement = (0, utils_1.deepActiveElement)();
        var element = this.element;
        ((_a = options === null || options === void 0 ? void 0 : options.root) !== null && _a !== void 0 ? _a : document.body).appendChild(element);
        element.addEventListener('click', this);
        document.addEventListener('touchmove', this, false);
        document.addEventListener('scroll', this, false);
        // Prevent (some) scrolling
        // (touch scrolling will still happen)
        var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        this.savedMarginRight = document.body.style.marginRight;
        this.savedOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        var marginRight = Number.parseFloat(getComputedStyle(document.body).marginRight);
        document.body.style.marginRight = "".concat(marginRight + scrollbarWidth, "px");
        if (options === null || options === void 0 ? void 0 : options.child)
            element.append(options.child);
        this.state = 'open';
    };
    Scrim.prototype.close = function () {
        var _a, _b, _c, _d;
        if (this.state !== 'open') {
            console.assert(this.element.parentElement !== null);
            return;
        }
        this.state = 'closing';
        if (typeof this.onDismiss === 'function')
            this.onDismiss();
        this.onDismiss = undefined;
        var element = this.element;
        element.removeEventListener('click', this);
        document.removeEventListener('touchmove', this, false);
        document.removeEventListener('scroll', this, false);
        element.remove();
        // Restore body state
        document.body.style.overflow = (_a = this.savedOverflow) !== null && _a !== void 0 ? _a : '';
        document.body.style.marginRight = (_b = this.savedMarginRight) !== null && _b !== void 0 ? _b : '';
        // Restore the previously focused element
        if ((0, utils_1.deepActiveElement)() !== this.savedActiveElement)
            (_d = (_c = this.savedActiveElement) === null || _c === void 0 ? void 0 : _c.focus) === null || _d === void 0 ? void 0 : _d.call(_c);
        // Remove all children
        element.innerHTML = '';
        this.state = 'closed';
    };
    Scrim.prototype.handleEvent = function (ev) {
        if (this.lightDismiss) {
            if (ev.target === this._element && ev.type === 'click') {
                this.close();
                ev.preventDefault();
                ev.stopPropagation();
            }
            else if (ev.target === document &&
                (ev.type === 'touchmove' || ev.type === 'scroll')) {
                // This is an attempt at scrolling on a touch-device
                this.close();
                ev.preventDefault();
                ev.stopPropagation();
            }
        }
    };
    return Scrim;
}());
exports.Scrim = Scrim;
