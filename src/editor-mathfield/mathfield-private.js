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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
exports._Mathfield = void 0;
var capabilities_1 = require("../ui/utils/capabilities");
var atom_class_1 = require("../core/atom-class");
var fonts_1 = require("../core/fonts");
var color_1 = require("../core/color");
var definitions_utils_1 = require("../latex-commands/definitions-utils");
var latex_1 = require("../atoms/latex");
var parser_1 = require("../core/parser");
var registers_1 = require("../core/registers");
var styling_1 = require("../editor-model/styling");
var selection_utils_1 = require("../editor-model/selection-utils");
var composition_1 = require("../editor-model/composition");
var array_1 = require("../editor-model/array");
var keyboard_1 = require("../editor/keyboard");
var undo_1 = require("../editor/undo");
var suggestion_popover_1 = require("../editor/suggestion-popover");
var l10n_1 = require("../core/l10n");
var commands_1 = require("../editor/commands");
var options_1 = require("./options");
var keybindings_1 = require("../editor/keybindings");
var keyboard_layout_1 = require("../editor/keyboard-layout");
var keyboard_input_1 = require("./keyboard-input");
var autocomplete_1 = require("./autocomplete");
var render_1 = require("./render");
require("./commands");
require("./styling");
var utils_1 = require("./utils");
var pointer_input_1 = require("./pointer-input");
var mode_editor_1 = require("./mode-editor");
require("./mode-editor-math");
require("./mode-editor-text");
var styling_2 = require("./styling");
var keystroke_caption_1 = require("./keystroke-caption");
var proxy_1 = require("../virtual-keyboard/proxy");
require("../public/mathfield-element");
require("../virtual-keyboard/virtual-keyboard");
require("../virtual-keyboard/global");
var mathfield_proxy_1 = require("../virtual-keyboard/mathfield-proxy");
var environment_popover_1 = require("editor/environment-popover");
var menu_1 = require("ui/menu/menu");
var context_menu_1 = require("ui/menu/context-menu");
var utils_2 = require("../ui/events/utils");
var default_menu_1 = require("editor/default-menu");
var model_private_1 = require("editor-model/model-private");
var delete_1 = require("editor-model/delete");
require("editor-model/commands-delete");
require("editor-model/commands-move");
require("editor-model/commands-select");
var mathfield_element_1 = require("../public/mathfield-element");
var parse_math_string_1 = require("formats/parse-math-string");
var text_1 = require("atoms/text");
var mode_editor_latex_1 = require("./mode-editor-latex");
var DEFAULT_KEYBOARD_TOGGLE_GLYPH = "<svg xmlns=\"http://www.w3.org/2000/svg\" style=\"width: 21px;\"  viewBox=\"0 0 576 512\" role=\"img\" aria-label=\"".concat((0, l10n_1.localize)('tooltip.toggle virtual keyboard'), "\"><path d=\"M528 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h480c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm16 336c0 8.823-7.177 16-16 16H48c-8.823 0-16-7.177-16-16V112c0-8.823 7.177-16 16-16h480c8.823 0 16 7.177 16 16v288zM168 268v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-336 80v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm384 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zM120 188v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-96 152v-8c0-6.627-5.373-12-12-12H180c-6.627 0-12 5.373-12 12v8c0 6.627 5.373 12 12 12h216c6.627 0 12-5.373 12-12z\"/></svg>");
var MENU_GLYPH = "<svg xmlns=\"http://www.w3.org/2000/svg\" style=\"height: 18px;\" viewBox=\"0 0 448 512\" role=\"img\" aria-label=\"".concat((0, l10n_1.localize)('tooltip.menu'), "\"><path d=\"M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z\"/></svg>");
/** @internal */
var _Mathfield = /** @class */ (function () {
    /**
     *
     * - `options.computeEngine`: An instance of a `ComputeEngine`. It is used to parse and serialize
     * LaTeX strings, using the information contained in the dictionaries
     * of the Compute Engine to determine, for example, which symbols are
     * numbers or which are functions, and therefore correctly interpret
     * `bf(x)` as `b \\times f(x)`.
     *
     * If no instance is provided, a new default one is created.
     *
     * @param element - The DOM element that this mathfield is attached to.
     * Note that `element.mathfield` is this object.
     */
    function _Mathfield(element, options) {
        var _this = this;
        var _a, _b, _c;
        this.focusBlurInProgress = false;
        // Setup default config options
        this.options = __assign(__assign(__assign({}, (0, options_1.getDefault)()), { macros: (0, definitions_utils_1.getMacros)(), registers: (0, registers_1.getDefaultRegisters)() }), (0, options_1.update)(options));
        this.eventController = new AbortController();
        var signal = this.eventController.signal;
        if (options.eventSink)
            this.host = options.eventSink;
        this.element = element;
        element.mathfield = this;
        // Focus/blur state
        this.blurred = true;
        // The keystroke caption panel is initially hidden
        this.keystrokeCaptionVisible = false;
        // This index indicates which of the suggestions available to
        // display in the popover panel
        this.suggestionIndex = 0;
        this.inlineShortcutBuffer = [];
        this.inlineShortcutBufferFlushTimer = 0;
        // Default style (color, weight, italic, etc...):
        // reflects the style to be applied on next insertion
        // if styleBias is "none".
        this.defaultStyle = {};
        // Adopt the style of the left sibling by default
        this.styleBias = 'left';
        if (this.options.defaultMode === 'inline-math')
            this.element.classList.add('ML__is-inline');
        else
            this.element.classList.remove('ML__is-inline');
        this.dirty = false;
        // Use the content of the element for the initial value of the mathfield
        var elementText = (_b = (_a = options.value) !== null && _a !== void 0 ? _a : this.element.textContent) !== null && _b !== void 0 ? _b : '';
        elementText = elementText.trim();
        // The initial input mode (text or math): the mode the next character
        // typed will be interpreted in, which may be different from the mode
        // of the current selection.
        var mode = (0, options_1.effectiveMode)(this.options);
        // Setup the model
        var root = new atom_class_1.Atom({
            type: 'root',
            mode: mode,
            body: (0, parser_1.parseLatex)(elementText, { context: this.context })
        });
        this.model = new model_private_1._Model(this, mode, root);
        // Prepare to manage undo/redo
        this.undoManager = new undo_1.UndoManager(this.model);
        // Additional elements used for UI.
        var markup = [];
        // const accessibleNodeID =
        //   Date.now().toString(36).slice(-2) +
        //   Math.floor(Math.random() * 0x186a0).toString(36);
        // Add "aria-labelledby="${accessibleNodeID}"" to the keyboard sink
        // 1/ The keyboard event capture element.
        markup.push("<span contenteditable=true role=textbox aria-autocomplete=none aria-multiline=false part=keyboard-sink class=ML__keyboard-sink autocapitalize=off autocomplete=off autocorrect=off spellcheck=false inputmode=none tabindex=0></span>");
        // 2/ The field, where the math equation will be displayed
        // Start with hidden content to minimize flashing during creation
        // The visibility will be reset during render
        markup.push('<span part=container class=ML__container aria-hidden=true  style="visibility:hidden">');
        markup.push('<span part=content class=ML__content>');
        markup.push((0, render_1.contentMarkup)(this));
        markup.push('</span>');
        // 2.1/ The virtual keyboard toggle
        if (window.mathVirtualKeyboard) {
            markup.push("<div part=virtual-keyboard-toggle class=ML__virtual-keyboard-toggle role=button ".concat(this.hasEditableContent ? '' : 'style="display:none;"', " data-l10n-tooltip=\"tooltip.toggle virtual keyboard\">"));
            markup.push(DEFAULT_KEYBOARD_TOGGLE_GLYPH);
            markup.push('</div>');
        }
        // 2.2// The menu toggle
        markup.push("<div part=menu-toggle class=ML__menu-toggle role=button data-l10n-tooltip=\"tooltip.menu\">");
        markup.push(MENU_GLYPH);
        markup.push('</div>');
        markup.push('</span>'); // end container
        // 3.1/ The aria-live region for announcements
        markup.push('<span class=ML__sr-only>');
        markup.push('<span role=status aria-live=assertive aria-atomic=true></span>');
        // markup.push(
        //   `<span class=accessibleMathML id="${accessibleNodeID}"></span>`
        // );
        markup.push('</span>');
        this.element.innerHTML = globalThis.MathfieldElement.createHTML(markup.join(''));
        if (!this.element.children) {
            console.error("%cMathLive {{SDK_VERSION}}: Something went wrong and the mathfield could not be created.%c\nIf you are using Vue, this may be because you are using the runtime-only build of Vue. Make sure to include `runtimeCompiler: true` in your Vue configuration. There may a warning from Vue in the log above.", 'color:red;font-family:system-ui;font-size:1.2rem;font-weight:bold', 'color:inherit;font-family:system-ui;font-size:inherit;font-weight:inherit');
            return;
        }
        // Update the localizable elements, and subscribe to
        // future updates
        this._l10Subscription = l10n_1.l10n.subscribe(function () { return l10n_1.l10n.update(_this.element); });
        l10n_1.l10n.update(this.element);
        this.field = this.element.querySelector('[part=content]');
        // Listen to 'click' events on the part of the field that doesn't have
        // content, so we avoid sending two 'click' events
        this.field.addEventListener('click', function (evt) { return evt.stopImmediatePropagation(); }, { capture: false, signal: signal });
        // Listen to 'wheel' events to scroll (horizontally) the field when it overflows
        this.field.addEventListener('wheel', this, { passive: false, signal: signal });
        // Delegate pointer events
        if ('PointerEvent' in window)
            this.field.addEventListener('pointerdown', this, { signal: signal });
        else
            this.field.addEventListener('mousedown', this, { signal: signal });
        (_c = this.element
            .querySelector('[part=virtual-keyboard-toggle]')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', function () {
            if (window.mathVirtualKeyboard.visible)
                window.mathVirtualKeyboard.hide();
            else {
                window.mathVirtualKeyboard.show({ animate: true });
                window.mathVirtualKeyboard.update((0, mathfield_proxy_1.makeProxy)(_this));
            }
        }, { signal: signal });
        // Listen for contextmenu events on the field
        this.field.addEventListener('contextmenu', this, { signal: signal });
        var menuToggle = this.element.querySelector('[part=menu-toggle]');
        menuToggle === null || menuToggle === void 0 ? void 0 : menuToggle.addEventListener('pointerdown', function (ev) {
            if (ev.currentTarget !== menuToggle)
                return;
            var menu = _this.menu;
            if (menu.state !== 'closed')
                return;
            _this.element.classList.add('tracking');
            var bounds = menuToggle.getBoundingClientRect();
            menu.modifiers = (0, utils_2.keyboardModifiersFromEvent)(ev);
            menu.show({
                target: menuToggle,
                location: { x: bounds.left, y: bounds.bottom },
                onDismiss: function () { return _this.element.classList.remove('tracking'); }
            });
            ev.preventDefault();
            ev.stopPropagation();
        }, { signal: signal });
        if (this.model.atoms.length <= 1 ||
            this.disabled ||
            (this.readOnly && !this.hasEditableContent) ||
            this.userSelect === 'none')
            menuToggle.style.display = 'none';
        this.ariaLiveText = this.element.querySelector('[role=status]');
        // this.accessibleMathML = this.element.querySelector('.accessibleMathML')!;
        // Capture clipboard events
        // Delegate keyboard events
        this.keyboardDelegate = (0, keyboard_1.delegateKeyboardEvents)(this.element.querySelector('.ML__keyboard-sink'), this.element, this);
        // Request notification for when the window is resized, the device
        // switched from portrait to landscape or the document is scrolled
        // to adjust the UI (popover, etc...)
        window.addEventListener('resize', this, { signal: signal });
        document.addEventListener('scroll', this, { signal: signal });
        this.resizeObserver = new ResizeObserver(function (entries) {
            if (_this.resizeObserverStarted) {
                _this.resizeObserverStarted = false;
                return;
            }
            (0, render_1.requestUpdate)(_this);
        });
        this.resizeObserverStarted = true;
        this.resizeObserver.observe(this.field);
        window.mathVirtualKeyboard.addEventListener('virtual-keyboard-toggle', this, { signal: signal });
        if (keyboard_layout_1.gKeyboardLayout && !l10n_1.l10n.locale.startsWith(keyboard_layout_1.gKeyboardLayout.locale))
            (0, keyboard_layout_1.setKeyboardLayoutLocale)(l10n_1.l10n.locale);
        // When fonts are done loading, re-render
        // (the selection highlighting may be out of date due to the HTML layout
        // having been updated with the new font metrics)
        if (fonts_1.gFontsState !== 'ready')
            document.fonts.ready.then(function () { return (0, render_1.renderSelection)(_this); });
        // The mathfield container is initially set with a visibility of hidden
        // to minimize flashing during construction.
        element
            .querySelector('[part=container]')
            .style.removeProperty('visibility');
        // Now start recording potentially undoable actions
        this.undoManager.startRecording();
        // Snapshot as 'set-value' operation, so that any other subsequent
        // `setValue()` gets coalesced
        this.undoManager.snapshot('set-value');
    }
    _Mathfield.prototype.connectToVirtualKeyboard = function () {
        if (this.connectedToVirtualKeyboard)
            return;
        this.connectedToVirtualKeyboard = true;
        window.addEventListener('message', this, {
            signal: this.eventController.signal
        });
        // Connect the kbd or kbd proxy to the current window
        window.mathVirtualKeyboard.connect();
        if (window.mathVirtualKeyboard.visible)
            window.mathVirtualKeyboard.update((0, mathfield_proxy_1.makeProxy)(this));
        (0, environment_popover_1.updateEnvironmentPopover)(this);
    };
    _Mathfield.prototype.disconnectFromVirtualKeyboard = function () {
        if (!this.connectedToVirtualKeyboard)
            return;
        window.removeEventListener('message', this);
        window.mathVirtualKeyboard.disconnect();
        this.connectedToVirtualKeyboard = false;
        (0, environment_popover_1.hideEnvironmentPopover)();
    };
    _Mathfield.prototype.showMenu = function (_) {
        var _a, _b;
        var location = (_b = (_a = _ === null || _ === void 0 ? void 0 : _.location) !== null && _a !== void 0 ? _a : (0, utils_1.getCaretPoint)(this.field)) !== null && _b !== void 0 ? _b : undefined;
        var modifiers = _ === null || _ === void 0 ? void 0 : _.modifiers;
        var target = this.element.querySelector('[part=container]');
        return this._menu.show({ target: target, location: location, modifiers: modifiers });
    };
    Object.defineProperty(_Mathfield.prototype, "colorMap", {
        get: function () {
            var _this = this;
            return function (name) { var _a, _b, _c; return (_c = (_b = (_a = _this.options).colorMap) === null || _b === void 0 ? void 0 : _b.call(_a, name)) !== null && _c !== void 0 ? _c : (0, color_1.defaultColorMap)(name); };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Mathfield.prototype, "backgroundColorMap", {
        get: function () {
            var _this = this;
            return function (name) {
                var _a, _b, _c, _d, _e, _f;
                return (_f = (_c = (_b = (_a = _this.options).backgroundColorMap) === null || _b === void 0 ? void 0 : _b.call(_a, name)) !== null && _c !== void 0 ? _c : (_e = (_d = _this.options).colorMap) === null || _e === void 0 ? void 0 : _e.call(_d, name)) !== null && _f !== void 0 ? _f : (0, color_1.defaultBackgroundColorMap)(name);
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Mathfield.prototype, "smartFence", {
        get: function () {
            var _a;
            return (_a = this.options.smartFence) !== null && _a !== void 0 ? _a : false;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Mathfield.prototype, "readOnly", {
        get: function () {
            var _a;
            return (_a = this.options.readOnly) !== null && _a !== void 0 ? _a : false;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Mathfield.prototype, "disabled", {
        get: function () {
            var _a, _b;
            return (_b = (_a = this.host) === null || _a === void 0 ? void 0 : _a['disabled']) !== null && _b !== void 0 ? _b : false;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Mathfield.prototype, "contentEditable", {
        // This reflects the contenteditable attribute.
        // Use hasEditableContent instead to take into account readonly and disabled
        // states.
        get: function () {
            if (!this.host)
                return false;
            return this.host.getAttribute('contenteditable') !== 'false';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Mathfield.prototype, "userSelect", {
        // This reflect the `user-select` CSS property
        get: function () {
            if (!this.host)
                return '';
            var style = getComputedStyle(this.host);
            // Safari uses '-webkit-user-select'. Other browsers use 'user-select'
            return (style.getPropertyValue('user-select') ||
                style.getPropertyValue('-webkit-user-select'));
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Mathfield.prototype, "hasEditableContent", {
        // Use to hide/show the virtual keyboard toggle. If false, no point in
        // showing  the toggle.
        get: function () {
            if (this.disabled || !this.contentEditable)
                return false;
            return !this.readOnly || this.hasEditablePrompts;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Mathfield.prototype, "hasEditablePrompts", {
        get: function () {
            return (this.readOnly &&
                !this.disabled &&
                this.contentEditable &&
                this.model.findAtom(function (a) { return a.type === 'prompt' && !a.locked; }) !== undefined);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Mathfield.prototype, "isSelectionEditable", {
        /** Returns true if the selection is editable:
         * - mathfield is not disabled, and has contentEditable
         * - if mathfield is readonly, the current selection is in a prompt which is editable (not locked)
         */
        get: function () {
            if (this.disabled || !this.contentEditable)
                return false;
            if (!this.readOnly)
                return true;
            var anchor = this.model.at(this.model.anchor);
            var cursor = this.model.at(this.model.position);
            var ancestor = atom_class_1.Atom.commonAncestor(anchor, cursor);
            if ((ancestor === null || ancestor === void 0 ? void 0 : ancestor.type) === 'prompt' || (ancestor === null || ancestor === void 0 ? void 0 : ancestor.parentPrompt))
                return true;
            return false;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Mathfield.prototype, "letterShapeStyle", {
        get: function () {
            var _a;
            return ((_a = this.options.letterShapeStyle) !== null && _a !== void 0 ? _a : 'tex');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Mathfield.prototype, "minFontScale", {
        get: function () {
            return this.options.minFontScale;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Mathfield.prototype, "maxMatrixCols", {
        get: function () {
            return this.options.maxMatrixCols;
        },
        enumerable: false,
        configurable: true
    });
    /**
     *
     * If there is a selection, return if all the atoms in the selection,
     * some of them or none of them match the `style` argument.
     *
     * If there is no selection, return 'all' if the current implicit style
     * (determined by a combination of the style of the previous atom and
     * the current style) matches the `style` argument, 'none' if it does not.
     */
    _Mathfield.prototype.queryStyle = function (inStyle) {
        var _a;
        var style = (0, styling_2.validateStyle)(this, inStyle);
        if ('verbatimColor' in style)
            delete style.verbatimColor;
        if ('verbatimBackgroundColor' in style)
            delete style.verbatimBackgroundColor;
        var keyCount = Object.keys(style).length;
        if (keyCount === 0)
            return 'all';
        if (keyCount > 1) {
            for (var _i = 0, _b = Object.keys(style); _i < _b.length; _i++) {
                var prop_1 = _b[_i];
                var result = this.queryStyle((_a = {}, _a[prop_1] = style[prop_1], _a));
                if (result === 'none')
                    return 'none';
                if (result === 'some')
                    return 'some';
            }
            return 'all';
        }
        var prop = Object.keys(style)[0];
        var value = style[prop];
        if (this.model.selectionIsCollapsed) {
            var style_1 = (0, styling_2.computeInsertStyle)(this);
            return style_1[prop] === value ? 'all' : 'none';
        }
        var atoms = this.model.getAtoms(this.model.selection, {
            includeChildren: true
        });
        var length = atoms.length;
        if (length === 0)
            return 'none';
        var count = 0;
        for (var _c = 0, atoms_1 = atoms; _c < atoms_1.length; _c++) {
            var atom = atoms_1[_c];
            if (atom.type === 'first') {
                length -= 1;
                continue;
            }
            if (atom.style[prop] === value)
                count += 1;
        }
        if (count === 0)
            return 'none';
        if (count === length)
            return 'all';
        return 'some';
    };
    Object.defineProperty(_Mathfield.prototype, "keybindings", {
        get: function () {
            var _a, _b;
            if (this._keybindings)
                return this._keybindings;
            var _c = (0, keybindings_1.normalizeKeybindings)(this.options.keybindings, (_a = (0, keyboard_layout_1.getActiveKeyboardLayout)()) !== null && _a !== void 0 ? _a : (0, keyboard_layout_1.getDefaultKeyboardLayout)()), keybindings = _c[0], errors = _c[1];
            if (((_b = (0, keyboard_layout_1.getActiveKeyboardLayout)()) === null || _b === void 0 ? void 0 : _b.score) > 0) {
                this._keybindings = keybindings;
                if (errors.length > 0) {
                    console.error("MathLive {{SDK_VERSION}}: Invalid keybindings for current keyboard layout", errors);
                }
            }
            return keybindings;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Mathfield.prototype, "menu", {
        get: function () {
            var _a;
            (_a = this._menu) !== null && _a !== void 0 ? _a : (this._menu = new menu_1.Menu((0, default_menu_1.getDefaultMenuItems)(this), { host: this.host }));
            return this._menu;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(_Mathfield.prototype, "menuItems", {
        set: function (menuItems) {
            if (this._menu)
                this._menu.menuItems = menuItems;
            else
                this._menu = new menu_1.Menu(menuItems, { host: this.host });
        },
        enumerable: false,
        configurable: true
    });
    _Mathfield.prototype.setOptions = function (config) {
        var _a;
        this.options = __assign(__assign({}, this.options), (0, options_1.update)(config));
        this._keybindings = undefined;
        if (this.options.defaultMode === 'inline-math')
            this.element.classList.add('ML__is-inline');
        else
            this.element.classList.remove('ML__is-inline');
        // The mode of the 'first' atom is the mode of the  expression when empty
        var mode = this.options.defaultMode;
        if (mode === 'inline-math')
            mode = 'math';
        if (((_a = this.model.root.firstChild) === null || _a === void 0 ? void 0 : _a.mode) !== mode)
            this.model.root.firstChild.mode = mode;
        if (this.options.readOnly) {
            if (this.hasFocus() && window.mathVirtualKeyboard.visible)
                this.executeCommand('hideVirtualKeyboard');
        }
        // Changing some config options (i.e. `macros`) may
        // require the content to be reparsed and re-rendered
        var content = atom_class_1.Atom.serialize([this.model.root], {
            expandMacro: false,
            defaultMode: this.options.defaultMode
        });
        if ('macros' in config || this.model.getValue() !== content)
            (0, render_1.reparse)(this);
        if ('value' in config ||
            'registers' in config ||
            'colorMap' in config ||
            'backgroundColorMap' in config ||
            'letterShapeStyle' in config ||
            'minFontScale' in config ||
            'maxMatrixCols' in config ||
            'readOnly' in config ||
            'placeholderSymbol' in config)
            (0, render_1.requestUpdate)(this);
    };
    _Mathfield.prototype.getOptions = function (keys) {
        return (0, options_1.get)(this.options, keys);
    };
    _Mathfield.prototype.getOption = function (key) {
        return (0, options_1.get)(this.options, key);
    };
    /*
     * handleEvent is a function invoked when an event is registered with an
     * object.
     * The name is defined by `addEventListener()` and cannot be changed.
     * This pattern is used to be able to release bound event handlers,
     * (event handlers that need access to `this`) as the `bind()` function
     * would create a new function that would have to be kept track of
     * to be able to properly remove the event handler later.
     */
    _Mathfield.prototype.handleEvent = function (evt) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var action, command, _b;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(0, utils_1.isValidMathfield)(this))
                            return [2 /*return*/];
                        if ((0, proxy_1.isVirtualKeyboardMessage)(evt)) {
                            if (!(0, utils_1.validateOrigin)(evt.origin, (_a = this.options.originValidator) !== null && _a !== void 0 ? _a : 'none')) {
                                throw new DOMException("Message from unknown origin (".concat(evt.origin, ") cannot be handled"), 'SecurityError');
                            }
                            action = evt.data.action;
                            if (action === 'execute-command') {
                                command = (0, commands_1.parseCommand)(evt.data.command);
                                if (!command)
                                    return [2 /*return*/];
                                if ((0, commands_1.getCommandTarget)(command) === 'virtual-keyboard')
                                    return [2 /*return*/];
                                this.executeCommand(command);
                            }
                            else if (action === 'update-state') {
                            }
                            else if (action === 'focus')
                                this.focus({ preventScroll: true });
                            else if (action === 'blur')
                                this.blur();
                            return [2 /*return*/];
                        }
                        _b = evt.type;
                        switch (_b) {
                            case 'focus': return [3 /*break*/, 1];
                            case 'blur': return [3 /*break*/, 2];
                            case 'mousedown': return [3 /*break*/, 3];
                            case 'pointerdown': return [3 /*break*/, 4];
                            case 'contextmenu': return [3 /*break*/, 7];
                            case 'virtual-keyboard-toggle': return [3 /*break*/, 10];
                            case 'resize': return [3 /*break*/, 11];
                            case 'scroll': return [3 /*break*/, 12];
                            case 'wheel': return [3 /*break*/, 13];
                            case 'message': return [3 /*break*/, 14];
                        }
                        return [3 /*break*/, 15];
                    case 1:
                        this.onFocus();
                        return [3 /*break*/, 16];
                    case 2:
                        this.onBlur();
                        return [3 /*break*/, 16];
                    case 3:
                        if (this.userSelect !== 'none')
                            (0, pointer_input_1.onPointerDown)(this, evt);
                        return [3 /*break*/, 16];
                    case 4:
                        if (!(!evt.defaultPrevented && this.userSelect !== 'none')) return [3 /*break*/, 6];
                        (0, pointer_input_1.onPointerDown)(this, evt);
                        if (!(evt.shiftKey === false)) return [3 /*break*/, 6];
                        return [4 /*yield*/, (0, context_menu_1.onContextMenu)(evt, this.element.querySelector('[part=container]'), this.menu)];
                    case 5:
                        if (_c.sent())
                            pointer_input_1.PointerTracker.stop();
                        _c.label = 6;
                    case 6: return [3 /*break*/, 16];
                    case 7:
                        if (!(this.userSelect !== 'none' &&
                            evt.shiftKey === false)) return [3 /*break*/, 9];
                        return [4 /*yield*/, (0, context_menu_1.onContextMenu)(evt, this.element.querySelector('[part=container]'), this.menu)];
                    case 8:
                        if (_c.sent())
                            pointer_input_1.PointerTracker.stop();
                        _c.label = 9;
                    case 9: return [3 /*break*/, 16];
                    case 10:
                        if (this.hasFocus())
                            (0, environment_popover_1.updateEnvironmentPopover)(this);
                        return [3 /*break*/, 16];
                    case 11:
                        if (this.geometryChangeTimer)
                            cancelAnimationFrame(this.geometryChangeTimer);
                        this.geometryChangeTimer = requestAnimationFrame(function () { return (0, utils_1.isValidMathfield)(_this) && _this.onGeometryChange(); });
                        return [3 /*break*/, 16];
                    case 12:
                        if (this.geometryChangeTimer)
                            cancelAnimationFrame(this.geometryChangeTimer);
                        this.geometryChangeTimer = requestAnimationFrame(function () { return (0, utils_1.isValidMathfield)(_this) && _this.onGeometryChange(); });
                        return [3 /*break*/, 16];
                    case 13:
                        this.onWheel(evt);
                        return [3 /*break*/, 16];
                    case 14: return [3 /*break*/, 16];
                    case 15:
                        console.warn('Unexpected event type', evt.type);
                        _c.label = 16;
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    _Mathfield.prototype.dispose = function () {
        if (!(0, utils_1.isValidMathfield)(this))
            return;
        l10n_1.l10n.unsubscribe(this._l10Subscription);
        this.keyboardDelegate.dispose();
        this.keyboardDelegate = undefined;
        this.eventController.abort();
        this.eventController = undefined;
        this.resizeObserver.disconnect();
        window.mathVirtualKeyboard.removeEventListener('virtual-keyboard-toggle', this);
        this.disconnectFromVirtualKeyboard();
        this.model.dispose();
        var element = this.element;
        delete element.mathfield;
        this.element = undefined;
        this.host = undefined;
        this.field = undefined;
        this.ariaLiveText = undefined;
        (0, keystroke_caption_1.disposeKeystrokeCaption)();
        (0, suggestion_popover_1.disposeSuggestionPopover)();
        (0, environment_popover_1.disposeEnvironmentPopover)();
    };
    _Mathfield.prototype.flushInlineShortcutBuffer = function (options) {
        var _this = this;
        options !== null && options !== void 0 ? options : (options = { defer: false });
        if (!options.defer) {
            this.inlineShortcutBuffer = [];
            clearTimeout(this.inlineShortcutBufferFlushTimer);
            this.inlineShortcutBufferFlushTimer = 0;
            return;
        }
        // If there is a timeout greater than 0, defer the reset
        // If the timeout is 0, never do the reset: regardless of the amount
        // of time between keystrokes, consider them as candidates for
        // a shortcut
        if (this.options.inlineShortcutTimeout > 0) {
            // Set a timer to reset the shortcut buffer
            clearTimeout(this.inlineShortcutBufferFlushTimer);
            this.inlineShortcutBufferFlushTimer = setTimeout(function () { return _this.flushInlineShortcutBuffer(); }, this.options.inlineShortcutTimeout);
        }
    };
    _Mathfield.prototype.executeCommand = function (command) {
        var _this = this;
        if ((0, commands_1.getCommandTarget)(command) === 'virtual-keyboard') {
            this.focus({ preventScroll: true });
            window.mathVirtualKeyboard.executeCommand(command);
            requestAnimationFrame(function () {
                return window.mathVirtualKeyboard.update((0, mathfield_proxy_1.makeProxy)(_this));
            });
            return false;
        }
        return (0, commands_1.perform)(this, command);
    };
    Object.defineProperty(_Mathfield.prototype, "errors", {
        get: function () {
            return (0, parser_1.validateLatex)(this.model.getValue(), { context: this.context });
        },
        enumerable: false,
        configurable: true
    });
    _Mathfield.prototype.getValue = function (arg1, arg2, arg3) {
        return this.model.getValue(arg1, arg2, arg3);
    };
    _Mathfield.prototype.setValue = function (value, options) {
        var _a;
        options = options !== null && options !== void 0 ? options : { mode: 'math' };
        if (options.insertionMode === undefined)
            options.insertionMode = 'replaceAll';
        if (options.format === undefined || options.format === 'auto')
            options.format = 'latex';
        if (options.mode === undefined || options.mode === 'auto')
            options.mode = (_a = (0, selection_utils_1.getMode)(this.model, this.model.position)) !== null && _a !== void 0 ? _a : 'math';
        var couldUndo = this.undoManager.canUndo();
        if (mode_editor_1.ModeEditor.insert(this.model, value, options)) {
            (0, render_1.requestUpdate)(this);
            // If this is the first insertion, drop the previous (empty) snapshot
            if (!couldUndo)
                this.undoManager.reset();
            this.undoManager.snapshot('set-value');
        }
    };
    Object.defineProperty(_Mathfield.prototype, "expression", {
        get: function () {
            var ce = globalThis.MathfieldElement.computeEngine;
            if (!ce) {
                console.error("MathLive {{SDK_VERSION}}:  no compute engine available. Make sure the Compute Engine library is loaded.");
                return null;
            }
            return ce.box(ce.parse(this.model.getValue('latex-unstyled')));
        },
        enumerable: false,
        configurable: true
    });
    /** Make sure the caret is visible within the matfield.
     * If using mathfield element, make sure the mathfield element is visible in
     * the page
     */
    _Mathfield.prototype.scrollIntoView = function () {
        var _a;
        if (!this.element)
            return;
        //
        // 1/ If using a mathfield element, make sure that the element is visible.
        //
        if (this.host) {
            if (this.options.onScrollIntoView)
                this.options.onScrollIntoView(this);
            else {
                // 1.1/ Bring the mathfield into the viewport
                this.host.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                // 1.2/ If the virtual keyboard obscures the mathfield, adjust
                if (window.mathVirtualKeyboard.visible &&
                    window.mathVirtualKeyboard.container === window.document.body) {
                    var kbdBounds = window.mathVirtualKeyboard.boundingRect;
                    var mathfieldBounds = this.host.getBoundingClientRect();
                    if (mathfieldBounds.bottom > kbdBounds.top) {
                        (_a = window.document.scrollingElement) === null || _a === void 0 ? void 0 : _a.scrollBy(0, mathfieldBounds.bottom - kbdBounds.top + 8);
                    }
                }
            }
        }
        //
        // 2/ If a render is pending, do it now to make sure we have correct layout
        // and caret position
        //
        if (this.dirty)
            (0, render_1.render)(this, { interactive: true });
        //
        // 3/ Get the position of the caret
        //
        var fieldBounds = this.field.getBoundingClientRect();
        var caretPoint = null;
        if (this.model.selectionIsCollapsed)
            caretPoint = (0, utils_1.getCaretPoint)(this.field);
        else {
            var selectionBounds = (0, utils_1.getSelectionBounds)(this);
            if (selectionBounds.length > 0) {
                var maxRight = -Infinity;
                var minTop = -Infinity;
                for (var _i = 0, selectionBounds_1 = selectionBounds; _i < selectionBounds_1.length; _i++) {
                    var r = selectionBounds_1[_i];
                    if (r.right > maxRight)
                        maxRight = r.right;
                    if (r.top < minTop)
                        minTop = r.top;
                }
                caretPoint = {
                    x: maxRight + fieldBounds.left - this.field.scrollLeft,
                    y: minTop + fieldBounds.top - this.field.scrollTop,
                    height: 0
                };
            }
        }
        //
        // 4/ Make sure that the caret is vertically visible, but because
        // vertical scrolling of the field occurs via a scroller that includes
        // the field and the virtual keyboard toggle, we'll handle the horizontal
        // scrolling separately
        //
        if (this.host && caretPoint) {
            var hostBounds = this.host.getBoundingClientRect();
            var y = caretPoint.y;
            var top_1 = this.host.scrollTop;
            if (y < hostBounds.top)
                top_1 = y - hostBounds.top + this.host.scrollTop;
            else if (y > hostBounds.bottom)
                top_1 = y - hostBounds.bottom + this.host.scrollTop + caretPoint.height;
            this.host.scroll({ top: top_1, left: 0 });
        }
        //
        // 5/  Make sure the caret is horizontally visible within the field
        //
        if (caretPoint) {
            var x = caretPoint.x - window.scrollX;
            var left = this.field.scrollLeft;
            if (x < fieldBounds.left)
                left = x - fieldBounds.left + this.field.scrollLeft - 20;
            else if (x > fieldBounds.right)
                left = x - fieldBounds.right + this.field.scrollLeft + 20;
            this.field.scroll({
                top: this.field.scrollTop,
                left: left
            });
        }
    };
    _Mathfield.prototype.insert = function (s, options) {
        if (typeof s !== 'string')
            return false;
        if (s.length === 0 &&
            ((options === null || options === void 0 ? void 0 : options.insertionMode) === 'insertBefore' ||
                (options === null || options === void 0 ? void 0 : options.insertionMode) === 'insertAfter'))
            return false;
        if (s.length === 0 && this.model.selectionIsCollapsed)
            return false;
        // This code path is used when inserting content from the virtual keyboard
        // (i.e. inserting `\sin`). We need to ignore previous key combinations
        // in this case
        this.flushInlineShortcutBuffer();
        options = options !== null && options !== void 0 ? options : { mode: 'math' };
        if (options.focus)
            this.focus();
        if (options.feedback) {
            if (globalThis.MathfieldElement.keypressVibration && (0, capabilities_1.canVibrate)())
                navigator.vibrate(commands_1.HAPTIC_FEEDBACK_DURATION);
            globalThis.MathfieldElement.playSound('keypress');
        }
        if (s === '\\\\') {
            // This string is interpreted as an "insert row after" command
            (0, array_1.addRowAfter)(this.model);
        }
        else if (s === '&')
            (0, array_1.addColumnAfter)(this.model);
        else {
            if (this.model.selectionIsCollapsed) {
                mode_editor_1.ModeEditor.insert(this.model, s, __assign({ style: this.model.at(this.model.position).style }, options));
            }
            else
                mode_editor_1.ModeEditor.insert(this.model, s, options);
        }
        this.snapshot("insert-".concat(this.model.at(this.model.position).type));
        (0, render_1.requestUpdate)(this);
        if (options.scrollIntoView)
            this.scrollIntoView();
        return true;
    };
    /**
     * Switch from the current mode to the new mode, if different.
     * Prefix and suffix are optional strings to be inserted before and after
     * the mode change, so prefix is interpreted with the current mode and
     * suffix with the new mode.
     */
    _Mathfield.prototype.switchMode = function (mode, prefix, suffix) {
        var _this = this;
        if (prefix === void 0) { prefix = ''; }
        if (suffix === void 0) { suffix = ''; }
        if (this.model.mode === mode ||
            !this.hasEditableContent ||
            !this.contentEditable ||
            this.disabled)
            return;
        var model = this.model;
        //
        // 1. Confirm that the mode change is allowed
        //
        // Dispatch event with the option of canceling.
        // Set the mode to the requested mode so the event handler can inspect it.
        var previousMode = model.mode;
        model.mode = mode;
        if (this.host &&
            !this.host.dispatchEvent(new Event('mode-change', {
                bubbles: true,
                composed: true,
                cancelable: true
            }))) {
            model.mode = previousMode;
            return;
        }
        // Restore to the current mode
        model.mode = previousMode;
        //
        // 2. Perform the mode change, accounting for selection and prefix/suffix
        //
        model.deferNotifications({
            content: Boolean(suffix) || Boolean(prefix),
            selection: true,
            type: 'insertText'
        }, function () {
            var cursor = model.at(model.position);
            var insertString = function (s, options) {
                if (!s)
                    return;
                var atoms = model.mode === 'math'
                    ? (0, parser_1.parseLatex)((0, parse_math_string_1.parseMathString)(s, { format: 'ascii-math' })[1], {
                        context: _this.context
                    })
                    : __spreadArray([], s, true).map(function (c) { return new text_1.TextAtom(c, c, {}); });
                if (options.select) {
                    var end = cursor.parent.addChildrenAfter(atoms, cursor);
                    model.setSelection(model.offsetOf(atoms[0].leftSibling), model.offsetOf(end));
                }
                else {
                    model.position = model.offsetOf(cursor.parent.addChildrenAfter(atoms, cursor));
                }
                contentChanged = true;
            };
            var insertLatexGroup = function (latex, options) {
                var atom = new latex_1.LatexGroupAtom(latex);
                cursor.parent.addChildAfter(atom, cursor);
                if (options.select) {
                    model.setSelection(model.offsetOf(atom.firstChild), model.offsetOf(atom.lastChild));
                }
                else
                    model.position = model.offsetOf(atom.lastChild);
                contentChanged = true;
            };
            var getContent = function () {
                var format = mode === 'latex'
                    ? 'latex'
                    : mode === 'math'
                        ? 'plain-text'
                        : 'ascii-math';
                var selRange = (0, selection_utils_1.range)(model.selection);
                var content = _this.model.getValue(selRange, format);
                var atoms = _this.model.extractAtoms(selRange);
                // If we just had a placeholder selected, pretend we had an empty
                // selection
                if (atoms.length === 1 && atoms[0].type === 'placeholder')
                    content = suffix;
                cursor = model.at(selRange[0]);
                return content;
            };
            var contentChanged = false;
            // 2.1. Disregard any pending inline shortcut
            _this.flushInlineShortcutBuffer();
            _this.stopCoalescingUndo();
            // 2.2 If there is a LaTeX group, remove it
            (0, autocomplete_1.complete)(_this, 'accept');
            if (model.selectionIsCollapsed) {
                //
                // 2.4a. If empty selection: insert prefix and suffix
                //
                insertString(prefix, { select: false });
                model.mode = mode;
                if (mode === 'latex')
                    insertLatexGroup(suffix, { select: false });
                else
                    insertString(suffix, { select: false });
            }
            else {
                //
                // 2.4b. Non-empty selection: convert the selection to the new mode
                //
                var content = getContent();
                model.mode = mode;
                if (mode === 'latex')
                    insertLatexGroup(content, { select: true });
                else
                    insertString(content, { select: true });
            }
            (0, render_1.requestUpdate)(_this);
            _this.undoManager.snapshot(mode === 'latex' ? 'insert-latex' : 'insert');
            return contentChanged;
        });
        model.mode = mode;
        // Update the toolbar
        window.mathVirtualKeyboard.update((0, mathfield_proxy_1.makeProxy)(this));
    };
    _Mathfield.prototype.hasFocus = function () {
        return !this.blurred;
    };
    _Mathfield.prototype.focus = function (options) {
        var _a;
        if (!this.hasFocus()) {
            this.keyboardDelegate.focus();
            this.connectToVirtualKeyboard();
            this.onFocus();
            this.model.announce('line');
        }
        if (!((_a = options === null || options === void 0 ? void 0 : options.preventScroll) !== null && _a !== void 0 ? _a : false))
            this.scrollIntoView();
    };
    _Mathfield.prototype.blur = function () {
        this.disconnectFromVirtualKeyboard();
        if (!this.hasFocus())
            return;
        this.keyboardDelegate.blur();
    };
    _Mathfield.prototype.select = function () {
        this.model.selection = { ranges: [[0, this.model.lastOffset]] };
        // The behavior of select() is not clearly defined. Some implementations
        // focus, others don't. Selecting the sink may focus it in some cases
        // so, to be safe, we focus the field as well
        this.focus();
    };
    _Mathfield.prototype.applyStyle = function (inStyle, inOptions) {
        var _this = this;
        var _a;
        if (inOptions === void 0) { inOptions = {}; }
        var range;
        var operation = 'set';
        var silenceNotifications = false;
        if ((0, selection_utils_1.isRange)(inOptions))
            range = inOptions;
        else {
            if (inOptions.operation === 'toggle')
                operation = 'toggle';
            range = inOptions.range;
            silenceNotifications = (_a = inOptions.silenceNotifications) !== null && _a !== void 0 ? _a : false;
        }
        if (range)
            range = this.model.normalizeRange(range);
        if (range && range[0] === range[1])
            range = undefined;
        var style = (0, styling_2.validateStyle)(this, inStyle);
        if (range === undefined && this.model.selectionIsCollapsed) {
            // We don't have a selection. Set the global style instead.
            if (operation === 'set') {
                var newStyle_1 = __assign({}, this.defaultStyle);
                if ('color' in style)
                    delete newStyle_1.verbatimColor;
                if ('backgroundColor' in style)
                    delete newStyle_1.verbatimBackgroundColor;
                this.defaultStyle = __assign(__assign({}, newStyle_1), style);
                this.styleBias = 'none';
                return;
            }
            // Toggle the properties
            var newStyle = __assign({}, this.defaultStyle);
            for (var _i = 0, _b = Object.keys(style); _i < _b.length; _i++) {
                var prop = _b[_i];
                if (newStyle[prop] === style[prop]) {
                    if (prop === 'color')
                        delete newStyle.verbatimColor;
                    if (prop === 'backgroundColor')
                        delete newStyle.verbatimBackgroundColor;
                    delete newStyle[prop];
                }
                else
                    newStyle[prop] = style[prop];
            }
            this.defaultStyle = newStyle;
            this.styleBias = 'none';
            return;
        }
        this.model.deferNotifications({ content: !silenceNotifications, type: 'insertText' }, function () {
            if (range === undefined) {
                for (var _i = 0, _a = _this.model.selection.ranges; _i < _a.length; _i++) {
                    var range_1 = _a[_i];
                    (0, styling_1.applyStyle)(_this.model, range_1, style, { operation: operation });
                }
            }
            else
                (0, styling_1.applyStyle)(_this.model, range, style, { operation: operation });
        });
        (0, render_1.requestUpdate)(this);
    };
    _Mathfield.prototype.toggleContextMenu = function () {
        var _this = this;
        var _a;
        var menu = this.menu;
        if (!menu.visible)
            return false;
        if (menu.state === 'open') {
            menu.hide();
            return true;
        }
        var caretBounds = (_a = (0, utils_1.getElementInfo)(this, this.model.position)) === null || _a === void 0 ? void 0 : _a.bounds;
        if (!caretBounds)
            return false;
        var location = { x: caretBounds.right, y: caretBounds.bottom };
        menu.show({
            target: this.element.querySelector('[part=container]'),
            location: location,
            onDismiss: function () { var _a; return (_a = _this.element) === null || _a === void 0 ? void 0 : _a.focus(); }
        });
        return true;
    };
    _Mathfield.prototype.getPrompt = function (id) {
        var prompt = this.model.findAtom(function (a) { return a.type === 'prompt' && a.placeholderId === id; });
        console.assert(prompt !== undefined, "MathLive {{SDK_VERSION}}:  no prompts with matching ID found");
        return prompt;
    };
    _Mathfield.prototype.getPromptValue = function (id, format) {
        var prompt = this.getPrompt(id);
        if (!prompt)
            return '';
        var first = this.model.offsetOf(prompt.firstChild);
        var last = this.model.offsetOf(prompt.lastChild);
        return this.model.getValue(first, last, format);
    };
    _Mathfield.prototype.getPrompts = function (filter) {
        return this.model
            .getAllAtoms()
            .filter(function (a) {
            if (a.type !== 'prompt')
                return false;
            if (!filter)
                return true;
            if (filter.id && a.placeholderId !== filter.id)
                return false;
            if (filter.locked && a.locked !== filter.locked)
                return false;
            if (filter.correctness === 'undefined' && a.correctness)
                return false;
            if (filter.correctness && a.correctness !== filter.correctness)
                return false;
            return true;
        })
            .map(function (a) { return a.placeholderId; });
    };
    _Mathfield.prototype.setPromptValue = function (id, value, insertOptions) {
        if (value !== undefined) {
            var prompt_1 = this.getPrompt(id);
            if (!prompt_1) {
                console.error("MathLive {{SDK_VERSION}}: unknown prompt ".concat(id));
                return;
            }
            var branchRange = this.model.getBranchRange(this.model.offsetOf(prompt_1), 'body');
            this.model.setSelection(branchRange);
            this.insert(value, __assign(__assign({}, insertOptions), { insertionMode: 'replaceSelection' }));
        }
        if (insertOptions === null || insertOptions === void 0 ? void 0 : insertOptions.silenceNotifications)
            this.valueOnFocus = this.getValue();
        (0, render_1.requestUpdate)(this);
    };
    _Mathfield.prototype.setPromptState = function (id, state, locked) {
        var prompt = this.getPrompt(id);
        if (!prompt) {
            console.error("MathLive {{SDK_VERSION}}: unknown prompt ".concat(id));
            return;
        }
        if (state === 'undefined')
            prompt.correctness = undefined;
        else if (typeof state === 'string')
            prompt.correctness = state;
        if (typeof locked === 'boolean') {
            prompt.locked = locked;
            prompt.captureSelection = locked;
        }
        (0, render_1.requestUpdate)(this);
    };
    _Mathfield.prototype.getPromptState = function (id) {
        var prompt = this.getPrompt(id);
        if (!prompt) {
            console.error("MathLive {{SDK_VERSION}}: unknown prompt ".concat(id));
            return [undefined, true];
        }
        return [prompt.correctness, prompt.locked];
    };
    _Mathfield.prototype.getPromptRange = function (id) {
        var prompt = this.getPrompt(id);
        if (!prompt) {
            console.error("MathLive {{SDK_VERSION}}: unknown prompt ".concat(id));
            return [0, 0];
        }
        return this.model.getBranchRange(this.model.offsetOf(prompt), 'body');
    };
    _Mathfield.prototype.canUndo = function () {
        return this.undoManager.canUndo();
    };
    _Mathfield.prototype.canRedo = function () {
        return this.undoManager.canRedo();
    };
    _Mathfield.prototype.popUndoStack = function () {
        this.undoManager.pop();
    };
    _Mathfield.prototype.snapshot = function (op) {
        var _a;
        if (this.undoManager.snapshot(op)) {
            if (window.mathVirtualKeyboard.visible)
                window.mathVirtualKeyboard.update((0, mathfield_proxy_1.makeProxy)(this));
            (_a = this.host) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new CustomEvent('undo-state-change', {
                bubbles: true,
                composed: true,
                detail: { type: 'snapshot' }
            }));
        }
    };
    _Mathfield.prototype.stopCoalescingUndo = function () {
        this.undoManager.stopCoalescing(this.model.selection);
    };
    _Mathfield.prototype.stopRecording = function () {
        this.undoManager.stopRecording();
    };
    _Mathfield.prototype.startRecording = function () {
        this.undoManager.startRecording();
    };
    _Mathfield.prototype.undo = function () {
        var _a;
        if (!this.undoManager.undo())
            return;
        (_a = this.host) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new CustomEvent('undo-state-change', {
            bubbles: true,
            composed: true,
            detail: { type: 'undo' }
        }));
    };
    _Mathfield.prototype.redo = function () {
        var _a;
        if (!this.undoManager.redo())
            return;
        (_a = this.host) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new CustomEvent('undo-state-change', {
            bubbles: true,
            composed: true,
            detail: { type: 'redo' }
        }));
    };
    _Mathfield.prototype.resetUndo = function () {
        var _a;
        (_a = this.undoManager) === null || _a === void 0 ? void 0 : _a.reset();
    };
    _Mathfield.prototype.onSelectionDidChange = function () {
        var _a, _b;
        var model = this.model;
        // Keep the content of the keyboard sink in sync with the selection.
        // Safari will not dispatch cut/copy/paste unless there is a DOM selection.
        this.keyboardDelegate.setValue(model.getValue(model.selection, 'latex-expanded'));
        // If we move the selection outside of a LaTeX group, close the group
        if (model.selectionIsCollapsed) {
            var latexGroup = (0, mode_editor_latex_1.getLatexGroup)(model);
            var pos = model.position;
            var cursor = model.at(pos);
            var mode = (_a = cursor.mode) !== null && _a !== void 0 ? _a : (0, options_1.effectiveMode)(this.options);
            if (latexGroup &&
                (pos < model.offsetOf(latexGroup.firstChild) - 1 ||
                    pos > model.offsetOf(latexGroup.lastChild) + 1)) {
                // We moved outside a LaTeX group
                (0, autocomplete_1.complete)(this, 'accept', { mode: mode });
                model.position = model.offsetOf(cursor);
            }
            else {
                // If we're at the start or the end of a LaTeX group,
                // move inside the group and don't switch mode.
                var sibling = model.at(pos + 1);
                if ((sibling === null || sibling === void 0 ? void 0 : sibling.type) === 'first' && sibling.mode === 'latex') {
                    model.position = pos + 1;
                }
                else if (latexGroup && (sibling === null || sibling === void 0 ? void 0 : sibling.mode) !== 'latex') {
                    model.position = pos - 1;
                }
                else {
                    // We may have moved from math to text, or text to math.
                    this.switchMode(mode);
                }
            }
        }
        // Dispatch `selection-change` event
        (_b = this.host) === null || _b === void 0 ? void 0 : _b.dispatchEvent(new Event('selection-change', {
            bubbles: true,
            composed: true
        }));
        if (window.mathVirtualKeyboard.visible)
            window.mathVirtualKeyboard.update((0, mathfield_proxy_1.makeProxy)(this));
        (0, environment_popover_1.updateEnvironmentPopover)(this);
    };
    _Mathfield.prototype.onContentWillChange = function (options) {
        var _a, _b, _c;
        return ((_c = (_a = this.host) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new InputEvent('beforeinput', __assign(__assign({}, options), { 
            // To work around a bug in WebKit/Safari (the inputType property gets stripped), include the inputType as the 'data' property. (see #1843)
            data: options.data ? options.data : (_b = options.inputType) !== null && _b !== void 0 ? _b : '', cancelable: true, bubbles: true, composed: true })))) !== null && _c !== void 0 ? _c : true);
    };
    _Mathfield.prototype.onFocus = function () {
        if (this.focusBlurInProgress || !this.blurred)
            return;
        this.focusBlurInProgress = true;
        this.blurred = false;
        // As a side effect, a `focus` and `focusin` events will be dispatched
        this.keyboardDelegate.focus();
        this.stopCoalescingUndo();
        (0, render_1.render)(this, { interactive: true });
        // Save the current value.
        // It will be compared in `onBlur()` to see if the
        // `change` event needs to be dispatched. This
        // mimic the `<input>` and `<textarea>` behavior
        this.valueOnFocus = this.model.getValue();
        // If we're in prompt mode, and the selection is
        // not in a prompt, move it to a prompt
        if (this.hasEditablePrompts &&
            !this.model.at(this.model.anchor).parentPrompt)
            this.executeCommand('moveToNextPlaceholder');
        this.focusBlurInProgress = false;
    };
    _Mathfield.prototype.onBlur = function () {
        var _this = this;
        var _a, _b, _c;
        if (this.focusBlurInProgress || this.blurred)
            return;
        this.focusBlurInProgress = true;
        this.stopCoalescingUndo();
        this.blurred = true;
        this.ariaLiveText.textContent = '';
        (0, suggestion_popover_1.hideSuggestionPopover)(this);
        if (this.model.getValue() !== this.valueOnFocus) {
            (_a = this.host) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        }
        this.disconnectFromVirtualKeyboard();
        (_b = this.host) === null || _b === void 0 ? void 0 : _b.dispatchEvent(new Event('blur', {
            bubbles: false,
            composed: true
        }));
        (_c = this.host) === null || _c === void 0 ? void 0 : _c.dispatchEvent(new UIEvent('focusout', {
            bubbles: true,
            composed: true
        }));
        (0, render_1.requestUpdate)(this);
        this.focusBlurInProgress = false;
        (0, environment_popover_1.hideEnvironmentPopover)();
        if (mathfield_element_1["default"].restoreFocusWhenDocumentFocused) {
            //
            // When the document/window loses focus, for example by switching
            // to another tab, the mathfield will be blured. When the window
            // regains focus, we'd like the focus to be restored on the mathfield,
            // like the browsers do for `<textarea>` elements. However, they
            // don't do that for custom elements, so we do it ourselves. @futureweb
            //
            // Wait for the window/document visibility to change
            // (the mathfield gets blurred before the window)
            var controller_1 = new AbortController();
            var signal_1 = controller_1.signal;
            document.addEventListener('visibilitychange', function () {
                if (document.visibilityState === 'hidden') {
                    document.addEventListener('visibilitychange', function () {
                        if ((0, utils_1.isValidMathfield)(_this) &&
                            document.visibilityState === 'visible')
                            _this.focus({ preventScroll: true });
                    }, { once: true, signal: signal_1 });
                }
            }, { once: true, signal: signal_1 });
            // If something else gets the focus (could be the mathfield too),
            // cancel the above
            document.addEventListener('focusin', function () { return controller_1.abort(); }, {
                once: true
            });
        }
    };
    _Mathfield.prototype.onInput = function (text) {
        (0, keyboard_input_1.onInput)(this, text);
    };
    _Mathfield.prototype.onKeystroke = function (evt) {
        return (0, keyboard_input_1.onKeystroke)(this, evt);
    };
    _Mathfield.prototype.onCompositionStart = function (_composition) {
        var _this = this;
        // Clear the selection if there is one
        this.model.deleteAtoms((0, selection_utils_1.range)(this.model.selection));
        var caretPoint = (0, utils_1.getCaretPoint)(this.field);
        if (!caretPoint)
            return;
        requestAnimationFrame(function () {
            (0, render_1.render)(_this); // Recalculate the position of the caret
            // Synchronize the location and style of the keyboard sink
            // so that the IME candidate window can align with the composition
            _this.keyboardDelegate.moveTo(caretPoint.x, caretPoint.y - caretPoint.height);
        });
    };
    _Mathfield.prototype.onCompositionUpdate = function (composition) {
        (0, composition_1.updateComposition)(this.model, composition);
        (0, render_1.requestUpdate)(this);
    };
    _Mathfield.prototype.onCompositionEnd = function (composition) {
        (0, composition_1.removeComposition)(this.model);
        (0, keyboard_input_1.onInput)(this, composition, { simulateKeystroke: true });
    };
    _Mathfield.prototype.onCut = function (ev) {
        // Ignore if in read-only mode
        if (!this.isSelectionEditable) {
            this.model.announce('plonk');
            return;
        }
        if (this.model.contentWillChange({ inputType: 'deleteByCut' })) {
            // Snapshot the undo state
            this.stopCoalescingUndo();
            // Copy to the clipboard
            if (ev.clipboardData)
                mode_editor_1.ModeEditor.onCopy(this, ev);
            else
                mode_editor_1.ModeEditor.copyToClipboard(this, 'latex');
            // Delete the selection
            (0, delete_1.deleteRange)(this.model, (0, selection_utils_1.range)(this.model.selection), 'deleteByCut');
            this.snapshot('cut');
            (0, render_1.requestUpdate)(this);
        }
    };
    _Mathfield.prototype.onCopy = function (ev) {
        if (ev.clipboardData)
            mode_editor_1.ModeEditor.onCopy(this, ev);
        else
            mode_editor_1.ModeEditor.copyToClipboard(this, 'latex');
    };
    _Mathfield.prototype.onPaste = function (ev) {
        // Ignore if in read-only mode
        var result = this.isSelectionEditable;
        if (result) {
            result = mode_editor_1.ModeEditor.onPaste(this.model.at(this.model.position).mode, this, ev.clipboardData);
        }
        if (!result)
            this.model.announce('plonk');
        ev.preventDefault();
        ev.stopPropagation();
        return result;
    };
    _Mathfield.prototype.onGeometryChange = function () {
        var _a;
        (_a = this._menu) === null || _a === void 0 ? void 0 : _a.hide();
        (0, suggestion_popover_1.updateSuggestionPopoverPosition)(this);
        (0, environment_popover_1.updateEnvironmentPopover)(this);
    };
    _Mathfield.prototype.onWheel = function (ev) {
        var wheelDelta = 5 * ev.deltaX;
        if (!Number.isFinite(wheelDelta) || wheelDelta === 0)
            return;
        var field = this.field;
        if (wheelDelta < 0 && field.scrollLeft === 0)
            return;
        if (wheelDelta > 0 &&
            field.offsetWidth + field.scrollLeft >= field.scrollWidth)
            return;
        field.scrollBy({ top: 0, left: wheelDelta });
        ev.preventDefault();
        ev.stopPropagation();
    };
    _Mathfield.prototype.getHTMLElement = function (atom) {
        // Find an atom id in this atom or its children
        var target = atom;
        while (!target.id && target.hasChildren)
            target = atom.children[0];
        return this.field.querySelector("[data-atom-id=\"".concat(target.id, "\"]"));
    };
    Object.defineProperty(_Mathfield.prototype, "context", {
        get: function () {
            var _this = this;
            var _a, _b;
            return {
                registers: (_a = this.options.registers) !== null && _a !== void 0 ? _a : {},
                smartFence: this.smartFence,
                letterShapeStyle: this.letterShapeStyle,
                minFontScale: this.minFontScale,
                maxMatrixCols: this.maxMatrixCols,
                placeholderSymbol: (_b = this.options.placeholderSymbol) !== null && _b !== void 0 ? _b : '▢',
                colorMap: function (name) { return _this.colorMap(name); },
                backgroundColorMap: function (name) { return _this.backgroundColorMap(name); },
                getMacro: function (token) {
                    return (0, definitions_utils_1.getMacroDefinition)(token, _this.options.macros);
                },
                atomIdsSettings: { seed: 'random', groupNumbers: false }
            };
        },
        enumerable: false,
        configurable: true
    });
    return _Mathfield;
}());
exports._Mathfield = _Mathfield;
