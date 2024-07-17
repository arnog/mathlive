"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var _a, _b, _c;
var _d;
exports.__esModule = true;
exports.MathfieldElement = void 0;
var options_1 = require("../editor-mathfield/options");
var mathfield_private_1 = require("../editor-mathfield/mathfield-private");
var pointer_input_1 = require("../editor-mathfield/pointer-input");
var utils_1 = require("../editor-mathfield/utils");
var capabilities_1 = require("../ui/utils/capabilities");
var script_url_1 = require("../common/script-url");
var render_1 = require("../editor-mathfield/render");
var fonts_1 = require("../core/fonts");
var speech_1 = require("../editor/speech");
var speech_read_aloud_1 = require("../editor/speech-read-aloud");
var l10n_1 = require("../core/l10n");
var stylesheet_1 = require("../common/stylesheet");
var scrim_1 = require("../ui/utils/scrim");
var selection_utils_1 = require("editor-model/selection-utils");
var styling_1 = require("editor-mathfield/styling");
if (!(0, capabilities_1.isBrowser)()) {
    console.error("MathLive {{SDK_VERSION}}: this version of the MathLive library is for use in the browser. A subset of the API is available on the server side in the \"mathlive-ssr\" library. If using server side rendering (with React for example) you may want to do a dynamic import of the MathLive library inside a `useEffect()` call.");
}
//
// Deferred State
//
// Operations that modify the state of the mathfield before it has been
// connected to the DOM will be stashed in this object and they
// will be applied to the element when it gets connected to the DOM.
//
var gDeferredState = new WeakMap();
var AUDIO_FEEDBACK_VOLUME = 0.5; // From 0.0 to 1.0
/** @internal */
var DEPRECATED_OPTIONS = {
    letterShapeStyle: 'mf.letterShapeStyle = ...',
    horizontalSpacingScale: 'Removed. Use `"thinmuskip"`, `"medmuskip"`, and `"thickmuskip"` registers ',
    macros: 'mf.macros = ...',
    registers: 'mf.registers = ...',
    backgroundColorMap: 'mf.backgroundColorMap = ...',
    colorMap: 'mf.colorMap = ...',
    enablePopover: 'mf.popoverPolicy = ...',
    mathModeSpace: 'mf.mathModeSpace = ...',
    placeholderSymbol: 'mf.placeholderSymbol = ...',
    readOnly: 'mf.readOnly = ...',
    removeExtraneousParentheses: 'mf.removeExtraneousParentheses = ...',
    scriptDepth: 'mf.scriptDepth = ...',
    smartFence: 'mf.smartFence = ...',
    smartMode: 'mf.smartMode = ...',
    smartSuperscript: 'mf.smartSuperscript = ...',
    inlineShortcutTimeout: 'mf.inlineShortcutTimeout = ...',
    inlineShortcuts: 'mf.inlineShortcuts = ...',
    keybindings: 'mf.keybindings = ...',
    virtualKeyboardMode: 'mf.mathVirtualKeyboardPolicy = ...',
    customVirtualKeyboardLayers: 'mathVirtualKeyboard.layers = ...',
    customVirtualKeyboards: 'mathVirtualKeyboard.layouts = ...',
    keypressSound: 'mathVirtualKeyboard.keypressSound = ...',
    keypressVibration: 'mathVirtualKeyboard.keypressVibration = ...',
    plonkSound: 'mathVirtualKeyboard.plonkSound = ...',
    virtualKeyboardContainer: 'mathVirtualKeyboard.container = ...',
    virtualKeyboardLayout: 'mathVirtualKeyboard.alphabeticLayout = ...',
    virtualKeyboardTheme: 'No longer supported',
    virtualKeyboardToggleGlyph: 'No longer supported',
    virtualKeyboardToolbar: 'mathVirtualKeyboard.editToolbar = ...',
    virtualKeyboards: 'Use `mathVirtualKeyboard.layouts`',
    speechEngine: '`MathfieldElement.speechEngine`',
    speechEngineRate: '`MathfieldElement.speechEngineRate`',
    speechEngineVoice: '`MathfieldElement.speechEngineVoice`',
    textToSpeechMarkup: '`MathfieldElement.textToSpeechMarkup`',
    textToSpeechRules: '`MathfieldElement.textToSpeechRules`',
    textToSpeechRulesOptions: '`MathfieldElement.textToSpeechRulesOptions`',
    readAloudHook: '`MathfieldElement.readAloudHook`',
    speakHook: '`MathfieldElement.speakHook`',
    computeEngine: '`MathfieldElement.computeEngine`',
    fontsDirectory: '`MathfieldElement.fontsDirectory`',
    soundsDirectory: '`MathfieldElement.soundsDirectory`',
    createHTML: '`MathfieldElement.createHTML`',
    onExport: '`mf.onExport`',
    onInlineShortcut: '`mf.onInlineShortcut`',
    onScrollIntoView: '`mf.onScrollIntoView`',
    locale: 'MathfieldElement.locale = ...',
    strings: 'MathfieldElement.strings = ...',
    decimalSeparator: 'MathfieldElement.decimalSeparator = ...',
    fractionNavigationOrder: 'MathfieldElement.fractionNavigationOrder = ...'
};
/**
 * The `MathfieldElement` class represent a DOM element that displays
 * math equations.
 *
 * It is a subclass of the standard
 * [`HTMLElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)
 * class and as such inherits all of its properties and methods.
 *
 * It inherits many useful properties and methods from `HTMLElement` such
 * as `style`, `tabIndex`, `addEventListener()`, `getAttribute()`,  etc...
 *
 * It is typically used to render a single equation.
 *
 * To render multiple equations, use multiple instances of `MathfieldElement`.
 *
 * The `MathfieldElement` class provides special properties and methods to
 * control the display and behavior of `<math-field>` elements.
 *
 *
 * You will usually instantiate a `MathfieldElement` using the
 * `<math-field>` tag in HTML. However, if necessary you can also create
 * it programmatically using `new MathfieldElement()`.
 *
 *
 * ```javascript
 * // 1. Create a new MathfieldElement
 * const mf = new MathfieldElement();
 *
 * // 2. Attach it to the DOM
 * document.body.appendChild(mf);
 * ```
 *
 * The `MathfieldElement` constructor has an optional argument of
 * `MathfieldOptions` to configure the element. The options can also
 * be modified later:
 *
 * ```javascript
 * // Setting options during construction
 * const mf = new MathfieldElement({ smartFence: false });
 *
 * // Modifying options after construction
 * mf.smartFence = true;
 * ```
 *
 * #### MathfieldElement CSS Variables
 *
 * To customize the appearance of the mathfield, declare the following CSS
 * variables (custom properties) in a ruleset that applies to the mathfield.
 *
 * ```css
 * math-field {
 *  --hue: 10       // Set the highlight color and caret to a reddish hue
 * }
 * ```
 *
 * Alternatively you can set these CSS variables programatically:
 *
 * ```js
 * document.body.style.setProperty("--hue", "10");
 * ```
 * <div className='symbols-table' style={{"--first-col-width":"25ex"}}>
 *
 * | CSS Variable | Usage |
 * |:---|:---|
 * | `--hue` | Hue of the highlight color and the caret |
 * | `--contains-highlight-background-color` | Backround property for items that contain the caret |
 * | `--primary-color` | Primary accent color, used for example in the virtual keyboard |
 * | `--text-font-family` | The font stack used in text mode |
 * | `--smart-fence-opacity` | Opacity of a smart fence (default is 50%) |
 * | `--smart-fence-color` | Color of a smart fence (default is current color) |
 *
 * </div>
 *
 * You can customize the appearance and zindex of the virtual keyboard panel
 * with some CSS variables associated with a selector that applies to the
 * virtual keyboard panel container.
 *
 * Read more about [customizing the virtual keyboard appearance](mathfield/guides/virtual-keyboards/#custom-appearance)
 *
 * #### MathfieldElement CSS Parts
 *
 * To style the virtual keyboard toggle, use the `virtual-keyboard-toggle` CSS
 * part. To use it, define a CSS rule with a `::part()` selector
 * for example:
 *
 * ```css
 * math-field::part(virtual-keyboard-toggle) {
 *  color: red;
 * }
 * ```
 *
 *
 * #### MathfieldElement Attributes
 *
 * An attribute is a key-value pair set as part of the tag:
 *
 * ```html
 * <math-field letter-shape-style="tex"></math-field>
 * ```
 *
 * The supported attributes are listed in the table below with their
 * corresponding property.
 *
 * The property can also be changed directly on the `MathfieldElement` object:
 *
 * ```javascript
 *  getElementById('mf').value = "\\sin x";
 *  getElementById('mf').letterShapeStyle = "text";
 * ```
 *
 * The values of attributes and properties are reflected, which means you can
 * change one or the other, for example:
 *
 * ```javascript
 * getElementById('mf').setAttribute('letter-shape-style',  'french');
 * console.log(getElementById('mf').letterShapeStyle);
 * // Result: "french"
 * getElementById('mf').letterShapeStyle ='tex;
 * console.log(getElementById('mf').getAttribute('letter-shape-style');
 * // Result: 'tex'
 * ```
 *
 * An exception is the `value` property, which is not reflected on the `value`
 * attribute: for consistency with other DOM elements, the `value` attribute
 * remains at its initial value.
 *
 *
 * <div className='symbols-table' style={{"--first-col-width":"32ex"}}>
 *
 * | Attribute | Property |
 * |:---|:---|
 * | `disabled` | `mf.disabled` |
 * | `default-mode` | `mf.defaultMode` |
 * | `letter-shape-style` | `mf.letterShapeStyle` |
 * | `min-font-scale` | `mf.minFontScale` |
 * | `max-matrix-cols` | `mf.maxMatrixCols` |
 * | `popover-policy` | `mf.popoverPolicy` |
 * | `math-mode-space` | `mf.mathModeSpace` |
 * | `read-only` | `mf.readOnly` |
 * | `remove-extraneous-parentheses` | `mf.removeExtraneousParentheses` |
 * | `smart-fence` | `mf.smartFence` |
 * | `smart-mode` | `mf.smartMode` |
 * | `smart-superscript` | `mf.smartSuperscript` |
 * | `inline-shortcut-timeout` | `mf.inlineShortcutTimeout` |
 * | `script-depth` | `mf.scriptDepth` |
 * | `value` | `value` |
 * | `math-virtual-keyboard-policy` | `mathVirtualKeyboardPolicy` |
 *
 * </div>
 *
 * See `MathfieldOptions` for more details about these options.
 *
 * In addition, the following [global attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes)
 * can also be used:
 * - `class`
 * - `data-*`
 * - `hidden`
 * - `id`
 * - `item*`
 * - `style`
 * - `tabindex`
 *
 *
 * #### MathfieldElement Events
 *
 * Listen to these events by using `addEventListener()`. For events with
 * additional arguments, the arguments are available in `event.detail`.
 *
 * <div className='symbols-table' style={{"--first-col-width":"27ex"}}>
 *
 * | Event Name  | Description |
 * |:---|:---|
 * | `beforeinput` | The value of the mathfield is about to be modified.  |
 * | `input` | The value of the mathfield has been modified. This happens on almost every keystroke in the mathfield. The `evt.data` property includes a copy of `evt.inputType`. See `InputEvent` |
 * | `change` | The user has committed the value of the mathfield. This happens when the user presses **Return** or leaves the mathfield. |
 * | `selection-change` | The selection (or caret position) in the mathfield has changed |
 * | `mode-change` | The mode (`math`, `text`) of the mathfield has changed |
 * | `undo-state-change` |  The state of the undo stack has changed. The `evt.detail.type` indicate if a snapshot was taken or an undo performed. |
 * | `read-aloud-status-change` | The status of a read aloud operation has changed |
 * | `before-virtual-keyboard-toggle` | The visibility of the virtual keyboard panel is about to change. The `evt.detail.visible` property indicate if the keyboard will be visible or not. Listen for this event on `window.mathVirtualKeyboard` |
 * | `virtual-keyboard-toggle` | The visibility of the virtual keyboard panel has changed. Listen for this event on `window.mathVirtualKeyboard` |
 * | `geometrychange` | The geometry of the virtual keyboard has changed. The `evt.detail.boundingRect` property is the new bounding rectangle of the virtual keyboard. Listen for this event on `window.mathVirtualKeyboard` |
 * | `blur` | The mathfield is losing focus |
 * | `focus` | The mathfield is gaining focus |
 * | `move-out` | The user has pressed an **arrow** key or the **tab** key, but there is nowhere to go. This is an opportunity to change the focus to another element if desired. <br\> `detail: \{direction: 'forward' | 'backward' | 'upward' | 'downward'\}` **cancellable**|
 * | `keypress` | The user pressed a physical keyboard key |
 * | `mount` | The element has been attached to the DOM |
 * | `unmount` | The element is about to be removed from the DOM |
 *
 * </div>
 *
 * @category Web Component
 * @keywords zindex, events, attribute, attributes, property, properties, parts, variables, css, mathfield, mathfieldelement

 */
var MathfieldElement = /** @class */ (function (_super) {
    __extends(MathfieldElement, _super);
    /**
       * To create programmatically a new mathfield use:
       *
       ```javascript
      let mfe = new MathfieldElement();
  
      // Set initial value and options
      mfe.value = "\\frac{\\sin(x)}{\\cos(x)}";
  
      // Options can be set either as an attribute (for simple options)...
      mfe.setAttribute("letter-shape-style", "french");
  
      // ... or using properties
      mfe.letterShapeStyle = "french";
  
      // Attach the element to the DOM
      document.body.appendChild(mfe);
      ```
      */
    function MathfieldElement(options) {
        var _this = _super.call(this) || this;
        /** @internal */
        _this._observer = null;
        if (options) {
            var warnings = [];
            for (var _i = 0, _a = Object.keys(options); _i < _a.length; _i++) {
                var key = _a[_i];
                if (DEPRECATED_OPTIONS[key]) {
                    if (DEPRECATED_OPTIONS[key].startsWith('mf.')) {
                        if (!DEPRECATED_OPTIONS[key].startsWith("mf.".concat(key))) {
                            var newName = DEPRECATED_OPTIONS[key].match(/([a-zA-Z]+) =/);
                            warnings.push("Option `".concat(key, "` has been renamed `").concat(newName[1], "`"));
                        }
                        else {
                            warnings.push("Option `".concat(key, "` cannot be used as a constructor option. Use ").concat(DEPRECATED_OPTIONS[key]));
                        }
                    }
                    else {
                        warnings.push("Option `".concat(key, "` cannot be used as a constructor option. Use ").concat(DEPRECATED_OPTIONS[key]));
                    }
                }
            }
            if (warnings.length > 0) {
                console.group("%cMathLive {{SDK_VERSION}}: %cInvalid Options", 'color:#12b; font-size: 1.1rem', 'color:#db1111; font-size: 1.1rem');
                console.warn("Some of the options passed to `new MathfieldElement(...)` are invalid. \n          See mathfield/changelog/ for details.");
                for (var _b = 0, warnings_1 = warnings; _b < warnings_1.length; _b++) {
                    var warning = warnings_1[_b];
                    console.warn(warning);
                }
                console.groupEnd();
            }
        }
        if (isElementInternalsSupported()) {
            _this._internals = _this.attachInternals();
            _this._internals['role'] = 'math';
            _this._internals.ariaLabel = 'math input field';
            _this._internals.ariaMultiLine = 'false';
        }
        _this.attachShadow({ mode: 'open', delegatesFocus: true });
        if (_this.shadowRoot && 'adoptedStyleSheets' in _this.shadowRoot) {
            // @ts-ignore
            _this.shadowRoot.adoptedStyleSheets = [
                (0, stylesheet_1.getStylesheet)('core'),
                (0, stylesheet_1.getStylesheet)('mathfield'),
                (0, stylesheet_1.getStylesheet)('mathfield-element'),
                (0, stylesheet_1.getStylesheet)('ui'),
                (0, stylesheet_1.getStylesheet)('menu'),
            ];
            // @ts-ignore
            _this.shadowRoot.appendChild(document.createElement('span'));
            var slot = document.createElement('slot');
            slot.style.display = 'none';
            // @ts-ignore
            _this.shadowRoot.appendChild(slot);
        }
        else {
            // @ts-ignore
            _this.shadowRoot.innerHTML =
                '<style>' +
                    (0, stylesheet_1.getStylesheetContent)('core') +
                    (0, stylesheet_1.getStylesheetContent)('mathfield') +
                    (0, stylesheet_1.getStylesheetContent)('mathfield-element') +
                    (0, stylesheet_1.getStylesheetContent)('ui') +
                    (0, stylesheet_1.getStylesheetContent)('menu') +
                    '</style>' +
                    '<span></span><slot style="display:none"></slot>';
        }
        // Record the (optional) configuration options, as a deferred state
        if (options)
            _this._setOptions(options);
        return _this;
    }
    Object.defineProperty(MathfieldElement, "formAssociated", {
        get: function () {
            return isElementInternalsSupported();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "optionsAttributes", {
        /**
         * Private lifecycle hooks.
         * If adding a 'boolean' attribute, add its default value to getOptionsFromAttributes
         * @internal
         */
        get: function () {
            return {
                'default-mode': 'string',
                'letter-shape-style': 'string',
                'min-font-scale': 'number',
                'max-matrix-cols': 'number',
                'popover-policy': 'string',
                'math-mode-space': 'string',
                'read-only': 'boolean',
                'remove-extraneous-parentheses': 'on/off',
                'smart-fence': 'on/off',
                'smart-mode': 'on/off',
                'smart-superscript': 'on/off',
                'inline-shortcut-timeout': 'string',
                'script-depth': 'string',
                'placeholder': 'string',
                'virtual-keyboard-target-origin': 'string',
                'math-virtual-keyboard-policy': 'string'
            };
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "observedAttributes", {
        /**
         * Custom elements lifecycle hooks
         * @internal
         */
        get: function () {
            return __spreadArray(__spreadArray([], Object.keys(this.optionsAttributes), true), [
                'contenteditable',
                'disabled',
                'readonly',
                'read-only', // Alternate spelling for `readonly`
            ], false);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "fontsDirectory", {
        /**
         * A URL fragment pointing to the directory containing the fonts
         * necessary to render a formula.
         *
         * These fonts are available in the `/dist/fonts` directory of the SDK.
         *
         * Customize this value to reflect where you have copied these fonts,
         * or to use the CDN version.
         *
         * The default value is `"./fonts"`. Use `null` to prevent
         * any fonts from being loaded.
         *
         * Changing this setting after the mathfield has been created will have
         * no effect.
         *
         * ```javascript
         * {
         *      // Use the CDN version
         *      fontsDirectory: ''
         * }
         * ```
         *
         * ```javascript
         * {
         *      // Use a directory called "fonts", located next to the
         *      // `mathlive.js` (or `mathlive.mjs`) file.
         *      fontsDirectory: './fonts'
         * }
         * ```
         *
         * ```javascript
         * {
         *      // Use a directory located at the root of your website
         *      fontsDirectory: 'https://example.com/fonts'
         * }
         * ```
         *
         */
        get: function () {
            return this._fontsDirectory;
        },
        set: function (value) {
            if (value !== this._fontsDirectory) {
                this._fontsDirectory = value;
                (0, fonts_1.reloadFonts)();
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "fontsDirectory", {
        /** @internal */
        get: function () {
            throw new Error('Use MathfieldElement.fontsDirectory instead');
        },
        /** @internal */
        set: function (_value) {
            throw new Error('Use MathfieldElement.fontsDirectory instead');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "soundsDirectory", {
        /**
         * A URL fragment pointing to the directory containing the optional
         * sounds used to provide feedback while typing.
         *
         * Some default sounds are available in the `/dist/sounds` directory of the SDK.
         *
         * Use `null` to prevent any sound from being loaded.
         * @category Virtual Keyboard
         */
        get: function () {
            return this._soundsDirectory;
        },
        set: function (value) {
            this._soundsDirectory = value;
            this.audioBuffers = {};
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "soundsDirectory", {
        /** @internal */
        get: function () {
            throw new Error('Use MathfieldElement.soundsDirectory instead');
        },
        /** @internal */
        set: function (_value) {
            throw new Error('Use MathfieldElement.soundsDirectory instead');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "keypressSound", {
        /**
         * When a key on the virtual keyboard is pressed, produce a short audio
         * feedback.
         *
         * If the property is set to a `string`, the same sound is played in all
         * cases. Otherwise, a distinct sound is played:
         *
         * -   `delete` a sound played when the delete key is pressed
         * -   `return` ... when the return/tab key is pressed
         * -   `spacebar` ... when the spacebar is pressed
         * -   `default` ... when any other key is pressed. This property is required,
         *     the others are optional. If they are missing, this sound is played as
         *     well.
         *
         * The value of the properties should be either a string, the name of an
         * audio file in the `soundsDirectory` directory or `null` to suppress the sound.
         * @category Virtual Keyboard
         */
        get: function () {
            return this._keypressSound;
        },
        set: function (value) {
            var _a, _b, _c;
            this.audioBuffers = {};
            if (value === null) {
                this._keypressSound = {
                    spacebar: null,
                    "return": null,
                    "delete": null,
                    "default": null
                };
            }
            else if (typeof value === 'string') {
                this._keypressSound = {
                    spacebar: value,
                    "return": value,
                    "delete": value,
                    "default": value
                };
            }
            else if (typeof value === 'object' && 'default' in value) {
                this._keypressSound = {
                    spacebar: (_a = value.spacebar) !== null && _a !== void 0 ? _a : value["default"],
                    "return": (_b = value["return"]) !== null && _b !== void 0 ? _b : value["default"],
                    "delete": (_c = value["delete"]) !== null && _c !== void 0 ? _c : value["default"],
                    "default": value["default"]
                };
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "plonkSound", {
        /**
         * Sound played to provide feedback when a command has no effect, for example
         * when pressing the spacebar at the root level.
         *
         * The property is either:
         * - a string, the name of an audio file in the `soundsDirectory` directory
         * - null to turn off the sound
         */
        get: function () {
            return this._plonkSound;
        },
        set: function (value) {
            this.audioBuffers = {};
            this._plonkSound = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "audioContext", {
        /** @internal */
        get: function () {
            if (!this._audioContext)
                this._audioContext = new AudioContext();
            return this._audioContext;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "speechEngine", {
        // @todo https://github.com/microsoft/TypeScript/issues/30024
        /**
         * Indicates which speech engine to use for speech output.
         *
         * Use `local` to use the OS-specific TTS engine.
         *
         * Use `amazon` for Amazon Text-to-Speech cloud API. You must include the
         * AWS API library and configure it with your API key before use.
         *
         * **See**
         * {@link mathfield/guides/speech/ | Guide: Speech}
         */
        get: function () {
            return this._speechEngine;
        },
        set: function (value) {
            this._speechEngine = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "speechEngineRate", {
        /**
         * Sets the speed of the selected voice.
         *
         * One of `x-slow`, `slow`, `medium`, `fast`, `x-fast` or a value as a
         * percentage.
         *
         * Range is `20%` to `200%` For example `200%` to indicate a speaking rate
         * twice the default rate.
         */
        get: function () {
            return this._speechEngineRate;
        },
        set: function (value) {
            this._speechEngineRate = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "speechEngineVoice", {
        /**
         * Indicates the voice to use with the speech engine.
         *
         * This is dependent on the speech engine. For Amazon Polly, see here:
         * https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
         *
         */
        get: function () {
            return this._speechEngineVoice;
        },
        set: function (value) {
            this._speechEngineVoice = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "textToSpeechMarkup", {
        /**
         * The markup syntax to use for the output of conversion to spoken text.
         *
         * Possible values are `ssml` for the SSML markup or `mac` for the macOS
         * markup, i.e. `&#91;&#91;ltr&#93;&#93;`.
         *
         */
        get: function () {
            return this._textToSpeechMarkup;
        },
        set: function (value) {
            this._textToSpeechMarkup = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "textToSpeechRules", {
        /**
         * Specify which set of text to speech rules to use.
         *
         * A value of `mathlive` indicates that the simple rules built into MathLive
         * should be used.
         *
         * A value of `sre` indicates that the Speech Rule Engine from Volker Sorge
         * should be used.
         *
         * **(Caution)** SRE is not included or loaded by MathLive. For this option to
         * work SRE should be loaded separately.
         *
         * **See**
         * {@link mathfield/guides/speech/ | Guide: Speech}
         */
        get: function () {
            return this._textToSpeechRules;
        },
        set: function (value) {
            this._textToSpeechRules = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "textToSpeechRulesOptions", {
        /**
         * A set of key/value pairs that can be used to configure the speech rule
         * engine.
         *
         * Which options are available depends on the speech rule engine in use.
         * There are no options available with MathLive's built-in engine. The
         * options for the SRE engine are documented
         * {@link https://github.com/zorkow/speech-rule-engine | here}
         */
        get: function () {
            return this._textToSpeechRulesOptions;
        },
        set: function (value) {
            this._textToSpeechRulesOptions = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "locale", {
        /**
         * The locale (language + region) to use for string localization.
         *
         * If none is provided, the locale of the browser is used.
         * @category Localization
         *
         */
        get: function () {
            return l10n_1.l10n.locale;
        },
        set: function (value) {
            if (value === 'auto')
                value = navigator.language.slice(0, 5);
            l10n_1.l10n.locale = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "locale", {
        /** @internal */
        get: function () {
            throw new Error('Use MathfieldElement.locale instead');
        },
        /** @internal */
        set: function (_value) {
            throw new Error('Use MathfieldElement.locale instead');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "strings", {
        /**
        * An object whose keys are a locale string, and whose values are an object of
        * string identifier to localized string.
        *
        * **Example**
        *
        ```js example
        mf.strings = {
          "fr-CA": {
              "tooltip.undo": "Annuler",
              "tooltip.redo": "Refaire",
          }
        }
        ```
        *
        * If the locale is already supported, this will override the existing
        * strings. If the locale is not supported, it will be added.
        *
        * @category Localization
        */
        get: function () {
            return l10n_1.l10n.strings;
        },
        set: function (value) {
            l10n_1.l10n.merge(value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "strings", {
        /** @internal */
        get: function () {
            throw new Error('Use MathfieldElement.strings instead');
        },
        /** @internal */
        set: function (_val) {
            throw new Error('Use MathfieldElement.strings instead');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "decimalSeparator", {
        /**
         * The symbol used to separate the integer part from the fractional part of a
         * number.
         *
         * When `","` is used, the corresponding LaTeX string is `{,}`, in order
         * to ensure proper spacing (otherwise an extra gap is displayed after the
         * comma).
         *
         * This affects:
         * - what happens when the `,` key is pressed (if `decimalSeparator` is
         * `","`, the `{,}` LaTeX string is inserted when following some digits)
         * - the label and behavior of the "." key in the default virtual keyboard
         *
         * **Default**: `"."`
         * @category Localization
         */
        get: function () {
            return this._decimalSeparator;
        },
        set: function (value) {
            this._decimalSeparator = value;
            if (this._computeEngine) {
                this._computeEngine.latexOptions.decimalMarker =
                    this.decimalSeparator === ',' ? '{,}' : '.';
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "decimalSeparator", {
        /** @internal */
        get: function () {
            throw new Error('Use MathfieldElement.decimalSeparator instead');
        },
        /** @internal */
        set: function (_val) {
            throw new Error('Use MathfieldElement.decimalSeparator instead');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "computeEngine", {
        /**
         * A custom compute engine instance. If none is provided, a default one is
         * used. If `null` is specified, no compute engine is used.
         */
        get: function () {
            var _a, _b;
            if (this._computeEngine === undefined) {
                var ComputeEngineCtor = (_a = window[Symbol["for"]('io.cortexjs.compute-engine')]) === null || _a === void 0 ? void 0 : _a.ComputeEngine;
                if (!ComputeEngineCtor)
                    return null;
                this._computeEngine = new ComputeEngineCtor();
                if (this._computeEngine && this.decimalSeparator === ',')
                    this._computeEngine.latexOptions.decimalMarker = '{,}';
            }
            return (_b = this._computeEngine) !== null && _b !== void 0 ? _b : null;
        },
        set: function (value) {
            this._computeEngine = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "computeEngine", {
        /** @internal */
        get: function () {
            throw new Error('Use MathfieldElement.computeEngine instead');
        },
        /** @internal */
        set: function (_val) {
            throw new Error('Use MathfieldElement.computeEngine instead');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement, "isFunction", {
        get: function () {
            if (typeof this._isFunction !== 'function')
                return function () { return false; };
            return this._isFunction;
        },
        set: function (value) {
            this._isFunction = value;
            document.querySelectorAll('math-field').forEach(function (el) {
                if (el instanceof MathfieldElement)
                    (0, render_1.reparse)(el._mathfield);
            });
        },
        enumerable: false,
        configurable: true
    });
    MathfieldElement.loadSound = function (sound) {
        return __awaiter(this, void 0, void 0, function () {
            var soundFile, soundsDirectory, response, _a, arrayBuffer, audioBuffer, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        //  Clear out the cached audio buffer
                        delete this.audioBuffers[sound];
                        soundFile = '';
                        switch (sound) {
                            case 'keypress':
                                soundFile = this._keypressSound["default"];
                                break;
                            case 'return':
                                soundFile = this._keypressSound["return"];
                                break;
                            case 'spacebar':
                                soundFile = this._keypressSound.spacebar;
                                break;
                            case 'delete':
                                soundFile = this._keypressSound["delete"];
                                break;
                            case 'plonk':
                                soundFile = this.plonkSound;
                                break;
                        }
                        if (typeof soundFile !== 'string')
                            return [2 /*return*/];
                        soundFile = soundFile.trim();
                        soundsDirectory = this.soundsDirectory;
                        if (soundsDirectory === undefined ||
                            soundsDirectory === null ||
                            soundsDirectory === 'null' ||
                            soundFile === 'none' ||
                            soundFile === 'null')
                            return [2 /*return*/];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, , 7]);
                        _a = fetch;
                        return [4 /*yield*/, (0, script_url_1.resolveUrl)("".concat(soundsDirectory, "/").concat(soundFile))];
                    case 2: return [4 /*yield*/, _a.apply(void 0, [_c.sent()])];
                    case 3:
                        response = _c.sent();
                        return [4 /*yield*/, response.arrayBuffer()];
                    case 4:
                        arrayBuffer = _c.sent();
                        return [4 /*yield*/, this.audioContext.decodeAudioData(arrayBuffer)];
                    case 5:
                        audioBuffer = _c.sent();
                        this.audioBuffers[sound] = audioBuffer;
                        return [3 /*break*/, 7];
                    case 6:
                        _b = _c.sent();
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    MathfieldElement.playSound = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var soundSource, gainNode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.audioContext.state === 'suspended' ||
                            this.audioContext.state === 'interrupted')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.audioContext.resume()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!!this.audioBuffers[name]) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.loadSound(name)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!this.audioBuffers[name])
                            return [2 /*return*/];
                        soundSource = this.audioContext.createBufferSource();
                        soundSource.buffer = this.audioBuffers[name];
                        gainNode = this.audioContext.createGain();
                        gainNode.gain.value = AUDIO_FEEDBACK_VOLUME;
                        soundSource.connect(gainNode).connect(this.audioContext.destination);
                        soundSource.start();
                        return [2 /*return*/];
                }
            });
        });
    };
    MathfieldElement.prototype.showMenu = function (_) {
        var _a, _b;
        return (_b = (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.showMenu(_)) !== null && _b !== void 0 ? _b : false;
    };
    Object.defineProperty(MathfieldElement.prototype, "mathVirtualKeyboard", {
        /** @internal */
        get: function () {
            throw new Error('The `mathVirtualKeyboard` property is not available on the MathfieldElement. Use `window.mathVirtualKeyboard` instead.');
        },
        enumerable: false,
        configurable: true
    });
    /** @internal */
    MathfieldElement.prototype.onPointerDown = function () {
        var _this = this;
        window.addEventListener('pointerup', function (evt) {
            var mf = _this._mathfield;
            if (!mf)
                return;
            // Disabled elements do not dispatch 'click' events
            if (evt.target === _this && !mf.disabled) {
                _this.dispatchEvent(new MouseEvent('click', {
                    altKey: evt.altKey,
                    button: evt.button,
                    buttons: evt.buttons,
                    clientX: evt.clientX,
                    clientY: evt.clientY,
                    ctrlKey: evt.ctrlKey,
                    metaKey: evt.metaKey,
                    movementX: evt.movementX,
                    movementY: evt.movementY,
                    relatedTarget: evt.relatedTarget,
                    screenX: evt.screenX,
                    screenY: evt.screenY,
                    shiftKey: evt.shiftKey
                }));
                // Check if a \href command was clicked on (or its children)
                var offset = _this.getOffsetFromPoint(evt.clientX, evt.clientY);
                if (offset >= 0)
                    MathfieldElement.openUrl((0, utils_1.getHref)(mf, offset));
                // set cursor position if selection is collapsed on touch events
                if (evt.pointerType === 'touch' && _this.selectionIsCollapsed)
                    _this.position = offset;
            }
        }, { once: true });
    };
    /**
     * @inheritDoc _Mathfield#getPromptValue
     * @category Prompts */
    MathfieldElement.prototype.getPromptValue = function (placeholderId, format) {
        var _a, _b;
        return (_b = (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.getPromptValue(placeholderId, format)) !== null && _b !== void 0 ? _b : '';
    };
    /**  {@inheritDoc _Mathfield.setPromptValue} */
    /** @category Prompts */
    MathfieldElement.prototype.setPromptValue = function (id, content, insertOptions) {
        var _a;
        (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.setPromptValue(id, content, insertOptions);
    };
    /**
     * Return the selection range for the specified prompt.
     *
     * This can be used for example to select the content of the prompt.
     *
     * ```js
     * mf.selection = mf.getPromptRange('my-prompt-id');
     * ```
     *
     * @category Prompts
     *
     */
    MathfieldElement.prototype.getPromptRange = function (id) {
        var _a, _b;
        return (_b = (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.getPromptRange(id)) !== null && _b !== void 0 ? _b : null;
    };
    /** Return the id of the prompts matching the filter.
     * @category Prompts
     */
    MathfieldElement.prototype.getPrompts = function (filter) {
        var _a, _b;
        return (_b = (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.getPrompts(filter)) !== null && _b !== void 0 ? _b : [];
    };
    Object.defineProperty(MathfieldElement.prototype, "form", {
        get: function () {
            var _a;
            return (_a = this._internals) === null || _a === void 0 ? void 0 : _a['form'];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "name", {
        get: function () {
            var _a;
            return (_a = this.getAttribute('name')) !== null && _a !== void 0 ? _a : '';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "type", {
        get: function () {
            return this.localName;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "mode", {
        get: function () {
            var _a, _b;
            return ((_b = (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.model.mode) !== null && _b !== void 0 ? _b : (this.defaultMode === 'text' ? 'text' : 'math'));
        },
        set: function (value) {
            var _a;
            (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.switchMode(value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "expression", {
        /**
         * If the Compute Engine library is available, return a boxed MathJSON expression representing the value of the mathfield.
         *
         * To load the Compute Engine library, use:
         * ```js
      import 'https://unpkg.com/@cortex-js/compute-engine?module';
      ```
         *
         * @category Accessing and changing the content
         */
        get: function () {
            if (!this._mathfield)
                return undefined;
            if (!window[Symbol["for"]('io.cortexjs.compute-engine')]) {
                console.error("MathLive {{SDK_VERSION}}: The CortexJS Compute Engine library is not available.\n        \n        Load the library, for example with:\n        \n        import \"https://unpkg.com/@cortex-js/compute-engine?module\"");
                return null;
            }
            return this._mathfield.expression;
        },
        set: function (mathJson) {
            var _a, _b;
            if (!this._mathfield)
                return;
            var latex = (_b = (_a = MathfieldElement.computeEngine) === null || _a === void 0 ? void 0 : _a.box(mathJson).latex) !== null && _b !== void 0 ? _b : null;
            if (latex !== null)
                this._mathfield.setValue(latex);
            if (!window[Symbol["for"]('io.cortexjs.compute-engine')]) {
                console.error("MathLive {{SDK_VERSION}}: The Compute Engine library is not available.\n        \n        Load the library, for example with:\n        \n        import \"https://unpkg.com/@cortex-js/compute-engine?module\"");
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "errors", {
        /**
         * Return an array of LaTeX syntax errors, if any.
         * @category Accessing and changing the content
         */
        get: function () {
            var _a, _b;
            return (_b = (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.errors) !== null && _b !== void 0 ? _b : [];
        },
        enumerable: false,
        configurable: true
    });
    MathfieldElement.prototype._getOptions = function (keys) {
        if (this._mathfield)
            return (0, options_1.get)(this._mathfield.options, keys);
        if (!gDeferredState.has(this))
            return null;
        return __assign({}, (0, options_1.get)(__assign(__assign({}, (0, options_1.getDefault)()), (0, options_1.update)(gDeferredState.get(this).options)), keys));
    };
    MathfieldElement.prototype.getOptions = function (keys) {
        console.warn("%cMathLive {{SDK_VERSION}}: %cDeprecated Usage%c\n      `mf.getOptions()` is deprecated. Read the property directly on the mathfield instead.\n      See mathfield/changelog/ for details.", 'color:#12b; font-size: 1.1rem', 'color:#db1111; font-size: 1.1rem', 'color: inherit, font-size: 1rem');
        if (this._mathfield)
            return (0, options_1.get)(this._mathfield.options, keys);
        if (!gDeferredState.has(this))
            return null;
        return (0, options_1.get)(__assign(__assign({}, (0, options_1.getDefault)()), (0, options_1.update)(gDeferredState.get(this).options)), keys);
    };
    /** @internal */
    MathfieldElement.prototype.reflectAttributes = function () {
        var _this = this;
        var defaultOptions = (0, options_1.getDefault)();
        var options = this._getOptions();
        Object.keys(MathfieldElement.optionsAttributes).forEach(function (x) {
            var prop = toCamelCase(x);
            if (MathfieldElement.optionsAttributes[x] === 'on/off') {
                if (defaultOptions[prop] !== options[prop])
                    _this.setAttribute(x, options[prop] ? 'on' : 'off');
                else
                    _this.removeAttribute(x);
            }
            else if (defaultOptions[prop] !== options[prop]) {
                if (MathfieldElement.optionsAttributes[x] === 'boolean') {
                    if (options[prop]) {
                        // Add attribute
                        _this.setAttribute(x, '');
                    }
                    else {
                        // Remove attribute
                        _this.removeAttribute(x);
                    }
                }
                else {
                    // Set attribute (as string)
                    if (typeof options[prop] === 'string' ||
                        typeof options[prop] === 'number')
                        _this.setAttribute(x, options[prop].toString());
                }
            }
        });
    };
    /**
     *  @category Options
     * @deprecated
     */
    MathfieldElement.prototype.getOption = function (key) {
        console.warn("%cMathLive {{SDK_VERSION}}: %cDeprecated Usage%c\n      `mf.getOption()` is deprecated. Read the property directly on the mathfield instead.\n      See mathfield/changelog/ for details.", 'color:#12b; font-size: 1.1rem', 'color:#db1111; font-size: 1.1rem', 'color: inherit, font-size: 1rem');
        return this._getOptions([key])[key];
    };
    /** @internal */
    MathfieldElement.prototype._getOption = function (key) {
        return this._getOptions([key])[key];
    };
    /** @internal */
    MathfieldElement.prototype._setOptions = function (options) {
        if (this._mathfield)
            this._mathfield.setOptions(options);
        else if (gDeferredState.has(this)) {
            var mergedOptions = __assign(__assign({}, gDeferredState.get(this).options), options);
            gDeferredState.set(this, __assign(__assign({}, gDeferredState.get(this)), { selection: { ranges: mergedOptions.readOnly ? [[0, 0]] : [[0, -1]] }, options: mergedOptions }));
        }
        else {
            gDeferredState.set(this, {
                value: undefined,
                selection: { ranges: [[0, 0]] },
                options: options,
                menuItems: undefined
            });
        }
        // Reflect options to attributes
        this.reflectAttributes();
    };
    /**
     *  @category Options
     * @deprecated
     */
    MathfieldElement.prototype.setOptions = function (options) {
        console.group("%cMathLive {{SDK_VERSION}}: %cDeprecated Usage", 'color:#12b; font-size: 1.1rem', 'color:#db1111; font-size: 1.1rem');
        console.warn(" `mf.setOptions()` is deprecated. Set the property directly on the mathfield instead.\n      See mathfield/changelog/ for details.");
        for (var _i = 0, _a = Object.keys(options); _i < _a.length; _i++) {
            var key = _a[_i];
            if (DEPRECATED_OPTIONS[key]) {
                console.warn("`mf.setOptions({".concat(key, ":...})` -> ").concat(DEPRECATED_OPTIONS[key]));
            }
        }
        console.groupEnd();
        this._setOptions(options);
    };
    MathfieldElement.prototype.executeCommand = function () {
        var _a, _b;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var selector;
        if (args.length === 1)
            selector = args[0];
        else
            selector = __spreadArray([args[0]], args.slice(1), true);
        if (selector)
            return (_b = (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.executeCommand(selector)) !== null && _b !== void 0 ? _b : false;
        throw new Error('Invalid selector');
    };
    MathfieldElement.prototype.getValue = function (arg1, arg2, arg3) {
        var _a;
        var _b, _c;
        if (this._mathfield)
            return this._mathfield.model.getValue(arg1, arg2, arg3);
        if (gDeferredState.has(this)) {
            var start = void 0;
            var end = void 0;
            var format = undefined;
            if ((0, selection_utils_1.isSelection)(arg1)) {
                _a = arg1.ranges[0], start = _a[0], end = _a[1];
                format = arg2;
            }
            else if ((0, selection_utils_1.isRange)(arg1)) {
                start = arg1[0], end = arg1[1];
                format = arg2;
            }
            else if ((0, selection_utils_1.isOffset)(arg1) && (0, selection_utils_1.isOffset)(arg2)) {
                start = arg1;
                end = arg2;
                format = arg3;
            }
            else {
                start = 0;
                end = -1;
                format = arg1;
            }
            if ((format === undefined || format === 'latex') &&
                start === 0 &&
                end === -1)
                return (_c = (_b = gDeferredState.get(this).value) !== null && _b !== void 0 ? _b : this.textContent) !== null && _c !== void 0 ? _c : '';
        }
        return '';
    };
    /**
     * @inheritDoc _Mathfield.setValue
     * @category Accessing and changing the content
     */
    MathfieldElement.prototype.setValue = function (value, options) {
        if (this._mathfield && value !== undefined) {
            var currentValue = this._mathfield.model.getValue();
            if (currentValue === value)
                return;
            options !== null && options !== void 0 ? options : (options = { silenceNotifications: true, mode: 'math' });
            this._mathfield.setValue(value, options);
            return;
        }
        if (gDeferredState.has(this)) {
            var options_2 = gDeferredState.get(this).options;
            gDeferredState.set(this, {
                value: value,
                selection: { ranges: [[-1, -1]], direction: 'forward' },
                options: options_2,
                menuItems: undefined
            });
            return;
        }
        var attrOptions = getOptionsFromAttributes(this);
        gDeferredState.set(this, {
            value: value,
            selection: { ranges: [[-1, -1]], direction: 'forward' },
            options: attrOptions,
            menuItems: undefined
        });
    };
    /**
     * @inheritDoc _Mathfield.hasFocus
     *
     * @category Focus
     *
     */
    MathfieldElement.prototype.hasFocus = function () {
        var _a, _b;
        return (_b = (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.hasFocus()) !== null && _b !== void 0 ? _b : false;
    };
    /**
     * Sets the focus to the mathfield (will respond to keyboard input).
     *
     * @category Focus
     *
     */
    MathfieldElement.prototype.focus = function () {
        var _a;
        (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.focus();
    };
    /**
     * Remove the focus from the mathfield (will no longer respond to keyboard
     * input).
     *
     * @category Focus
     *
     */
    MathfieldElement.prototype.blur = function () {
        var _a;
        (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.blur();
    };
    /**
     * Select the content of the mathfield.
     * @category Selection
     */
    MathfieldElement.prototype.select = function () {
        var _a;
        (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.select();
    };
    /**
     * @inheritDoc _Mathfield.insert
  
     *  @category Accessing and changing the content
     */
    MathfieldElement.prototype.insert = function (s, options) {
        var _a, _b;
        return (_b = (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.insert(s, options)) !== null && _b !== void 0 ? _b : false;
    };
    /**
     * @inheritDoc _Mathfield.applyStyle
     *
     * @category Accessing and changing the content
     */
    MathfieldElement.prototype.applyStyle = function (style, options) {
        var _a;
        return (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.applyStyle(style, options);
    };
    /**
     * If there is a selection, return if all the atoms in the selection,
     * some of them or none of them match the `style` argument.
     *
     * If there is no selection, return 'all' if the current implicit style
     * (determined by a combination of the style of the previous atom and
     * the current style) matches the `style` argument, 'none' if it does not.
     *
     * @category Accessing and changing the content
     */
    MathfieldElement.prototype.queryStyle = function (style) {
        var _a, _b;
        return (_b = (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.queryStyle(style)) !== null && _b !== void 0 ? _b : 'none';
    };
    /** The offset closest to the location `(x, y)` in viewport coordinate.
     *
     * **`bias`**:  if `0`, the vertical midline is considered to the left or
     * right sibling. If `-1`, the left sibling is favored, if `+1`, the right
     * sibling is favored.
     *
     * @category Selection
     */
    MathfieldElement.prototype.getOffsetFromPoint = function (x, y, options) {
        if (!this._mathfield)
            return -1;
        return (0, pointer_input_1.offsetFromPoint)(this._mathfield, x, y, options);
    };
    MathfieldElement.prototype.getElementInfo = function (offset) {
        return (0, utils_1.getElementInfo)(this._mathfield, offset);
    };
    /**
     * Reset the undo stack
     *
     * @category Undo
     */
    MathfieldElement.prototype.resetUndo = function () {
        var _a;
        (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.resetUndo();
    };
    /**
     * Return whether there are undoable items
     * @category Undo
     */
    MathfieldElement.prototype.canUndo = function () {
        if (!this._mathfield)
            return false;
        return this._mathfield.canUndo();
    };
    /**
     * Return whether there are redoable items
     * @category Undo
     */
    MathfieldElement.prototype.canRedo = function () {
        if (!this._mathfield)
            return false;
        return this._mathfield.canRedo();
    };
    /** @internal */
    MathfieldElement.prototype.handleEvent = function (evt) {
        var _a, _b, _c, _d, _e;
        // If the scrim for the variant panel or the menu is
        // open, ignore events.
        // Otherwise we may end up disconecting from the VK
        if (scrim_1.Scrim.state !== 'closed')
            return;
        // Also, if the menu is open
        if (((_b = (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.menu) === null || _b === void 0 ? void 0 : _b.state) !== 'closed')
            return;
        if (evt.type === 'pointerdown')
            this.onPointerDown();
        if (evt.type === 'focus')
            (_c = this._mathfield) === null || _c === void 0 ? void 0 : _c.focus();
        // Ignore blur events if the scrim is open (case where the variant panel
        // is open), or if we're in an iFrame on a touch device (see #2350).
        // Otherwise we disconnect from the VK and end up in a weird state.
        if (evt.type === 'blur' &&
            ((_d = scrim_1.Scrim.scrim) === null || _d === void 0 ? void 0 : _d.state) === 'closed' &&
            !((0, capabilities_1.isTouchCapable)() && (0, capabilities_1.isInIframe)()))
            (_e = this._mathfield) === null || _e === void 0 ? void 0 : _e.blur();
    };
    /**
     * Custom elements lifecycle hooks
     * @internal
     */
    MathfieldElement.prototype.connectedCallback = function () {
        var _this = this;
        var _a, _b, _c, _d;
        var shadowRoot = this.shadowRoot;
        var host = shadowRoot.host;
        var computedStyle = window.getComputedStyle(this);
        var userSelect = computedStyle.userSelect !== 'none';
        if (userSelect)
            host.addEventListener('pointerdown', this, true);
        else {
            var span = shadowRoot.querySelector('span');
            span.style.pointerEvents = 'none';
        }
        // Listen for an element *inside* the mathfield to get focus, e.g. the virtual keyboard toggle
        host.addEventListener('focus', this, true);
        host.addEventListener('blur', this, true);
        // Create an observer instance to detect when the innerHTML or textContent
        // of the element is modified
        this._observer = new MutationObserver(function () {
            var _a;
            _this.value = (_a = _this.textContent) !== null && _a !== void 0 ? _a : '';
        });
        this._observer.observe(this, {
            childList: true,
            characterData: true,
            subtree: true
        });
        if (!isElementInternalsSupported()) {
            if (!this.hasAttribute('role'))
                this.setAttribute('role', 'math');
            if (!this.hasAttribute('aria-label'))
                this.setAttribute('aria-label', 'math input field');
            this.setAttribute('aria-multiline', 'false');
        }
        // NVDA on Firefox seems to require this attribute
        if (userSelect && !this.hasAttribute('contenteditable'))
            this.setAttribute('contenteditable', 'true');
        // When the elements get focused (through tabbing for example)
        // focus the mathfield
        if (!this.hasAttribute('tabindex'))
            this.setAttribute('tabindex', '0');
        var slot = shadowRoot.querySelector('slot:not([name])');
        if (slot) {
            try {
                this._style = slot
                    .assignedElements()
                    .filter(function (x) { return x.tagName.toLowerCase() === 'style'; })
                    .map(function (x) { return x.textContent; })
                    .join('');
            }
            catch (error) {
                console.error(error);
            }
        }
        // Add shadowed stylesheet if one was provided
        // (this is important to support the `\class{}{}` command)
        if (this._style) {
            var styleElement = document.createElement('style');
            styleElement.textContent = this._style;
            shadowRoot.appendChild(styleElement);
        }
        var value = '';
        // Check if there is a `value` attribute and set the initial value
        // of the mathfield from it
        if (this.hasAttribute('value'))
            value = this.getAttribute('value');
        else {
            value =
                (_a = slot === null || slot === void 0 ? void 0 : slot.assignedNodes().map(function (x) { return (x.nodeType === 3 ? x.textContent : ''); }).join('').trim()) !== null && _a !== void 0 ? _a : '';
        }
        this._mathfield = new mathfield_private_1._Mathfield(shadowRoot.querySelector(':host > span'), __assign(__assign({}, ((_c = (_b = gDeferredState.get(this)) === null || _b === void 0 ? void 0 : _b.options) !== null && _c !== void 0 ? _c : getOptionsFromAttributes(this))), { eventSink: this, value: value }));
        if (!gDeferredState.has(this)) {
            this.upgradeProperty('disabled');
            this.upgradeProperty('readonly');
            for (var _i = 0, _e = Object.keys(MathfieldElement.optionsAttributes); _i < _e.length; _i++) {
                var attr = _e[_i];
                this.upgradeProperty(toCamelCase(attr));
            }
        }
        // The mathfield creation could have failed
        if (!((_d = this._mathfield) === null || _d === void 0 ? void 0 : _d.model)) {
            this._mathfield = null;
            return;
        }
        if (gDeferredState.has(this)) {
            var mf_1 = this._mathfield;
            var state_1 = gDeferredState.get(this);
            var menuItems = state_1.menuItems;
            mf_1.model.deferNotifications({ content: false, selection: false }, function () {
                var value = state_1.value;
                if (value !== undefined)
                    mf_1.setValue(value);
                mf_1.model.selection = state_1.selection;
                gDeferredState["delete"](_this);
            });
            if (menuItems)
                this.menuItems = menuItems;
        }
        // Notify listeners that we're mounted and ready
        window.queueMicrotask(function () {
            if (!_this.isConnected)
                return;
            _this.dispatchEvent(new Event('mount', {
                cancelable: false,
                bubbles: true,
                composed: true
            }));
        });
        // Load the fonts
        void (0, fonts_1.loadFonts)();
    };
    /**
     * Custom elements lifecycle hooks
     * @internal
     */
    MathfieldElement.prototype.disconnectedCallback = function () {
        var _this = this;
        var _a, _b, _c;
        this.shadowRoot.host.removeEventListener('pointerdown', this, true);
        if (!this._mathfield)
            return;
        (_a = this._observer) === null || _a === void 0 ? void 0 : _a.disconnect();
        this._observer = null;
        window.queueMicrotask(function () {
            // Notify listeners that we have been unmounted
            return _this.dispatchEvent(new Event('unmount', {
                cancelable: false,
                bubbles: true,
                composed: true
            }));
        });
        // Save the state (in case the element gets reconnected later)
        var options = (0, options_1.get)(this._mathfield.options, Object.keys(MathfieldElement.optionsAttributes).map(function (x) { return toCamelCase(x); }));
        gDeferredState.set(this, {
            value: this._mathfield.getValue(),
            selection: this._mathfield.model.selection,
            menuItems: (_c = (_b = this._mathfield.menu) === null || _b === void 0 ? void 0 : _b.menuItems) !== null && _c !== void 0 ? _c : undefined,
            options: options
        });
        // Dispose of the mathfield
        this._mathfield.dispose();
        this._mathfield = null;
    };
    /**
     * Private lifecycle hooks
     * @internal
     */
    MathfieldElement.prototype.upgradeProperty = function (prop) {
        if (this.hasOwnProperty(prop)) {
            var value = this[prop];
            // A property may have already been set on the object, before
            // the element was connected: delete the property (after saving its value)
            // and use the setter to (re-)set its value.
            delete this[prop];
            if (prop === 'readonly' || prop === 'read-only')
                prop = 'readOnly';
            this[prop] = value;
        }
    };
    /**
     * Custom elements lifecycle hooks
     * @internal
     */
    MathfieldElement.prototype.attributeChangedCallback = function (name, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        var hasValue = newValue !== null;
        switch (name) {
            case 'contenteditable':
                (0, render_1.requestUpdate)(this._mathfield);
                break;
            case 'disabled':
                this.disabled = hasValue;
                break;
            case 'read-only':
            case 'readonly':
                this.readOnly = hasValue;
                break;
            default:
        }
    };
    Object.defineProperty(MathfieldElement.prototype, "readonly", {
        get: function () {
            return this.hasAttribute('readonly') || this.hasAttribute('read-only');
        },
        set: function (value) {
            var isReadonly = Boolean(value);
            // Note that `readonly` is a "boolean attribute" as
            // per the HTML5 spec. Its value must be the empty string to indicate
            // a value of true, or it must be absent to indicate a value of false.
            // https://html.spec.whatwg.org/#boolean-attribute
            if (isReadonly) {
                // The canonical spelling is "readonly" (no dash. It's a global attribute
                // name and follows HTML attribute conventions)
                this.setAttribute('readonly', '');
                if (isElementInternalsSupported())
                    this._internals.ariaReadOnly = 'true';
                else
                    this.setAttribute('aria-readonly', 'true');
                this.setAttribute('aria-readonly', 'true');
            }
            else {
                if (isElementInternalsSupported())
                    this._internals.ariaReadOnly = 'false';
                else
                    this.removeAttribute('aria-readonly');
                this.removeAttribute('readonly');
                this.removeAttribute('read-only');
            }
            this._setOptions({ readOnly: isReadonly });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "disabled", {
        get: function () {
            return this.hasAttribute('disabled');
        },
        set: function (value) {
            var _a;
            var isDisabled = Boolean(value);
            if (isDisabled)
                this.setAttribute('disabled', '');
            else
                this.removeAttribute('disabled');
            if (isElementInternalsSupported())
                this._internals.ariaDisabled = isDisabled ? 'true' : 'false';
            else
                this.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
            if (isDisabled &&
                ((_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.hasFocus) &&
                window.mathVirtualKeyboard.visible)
                this._mathfield.executeCommand('hideVirtualKeyboard');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "value", {
        /**
         * The content of the mathfield as a LaTeX expression.
         * ```js
         * document.querySelector('mf').value = '\\frac{1}{\\pi}'
         * ```
         *  @category Accessing and changing the content
         */
        get: function () {
            return this.getValue();
        },
        /**
         *  @category Accessing and changing the content
         */
        set: function (value) {
            this.setValue(value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "defaultMode", {
        /** @category Customization
         * @inheritDoc LayoutOptions.defaultMode
         */
        get: function () {
            return this._getOption('defaultMode');
        },
        set: function (value) {
            this._setOptions({ defaultMode: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "macros", {
        /** @category Customization
         * @inheritDoc LayoutOptions.macros
         */
        get: function () {
            if (!this._mathfield)
                throw new Error('Mathfield not mounted');
            return this._getOption('macros');
        },
        set: function (value) {
            this._setOptions({ macros: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "registers", {
        /** @category Customization
         * @inheritDoc Registers
         */
        get: function () {
            if (!this._mathfield)
                throw new Error('Mathfield not mounted');
            var that = this;
            return new Proxy({}, {
                get: function (_, prop) {
                    if (typeof prop !== 'string')
                        return undefined;
                    return that._getOption('registers')[prop];
                },
                set: function (_, prop, value) {
                    var _a;
                    if (typeof prop !== 'string')
                        return false;
                    that._setOptions({
                        registers: __assign(__assign({}, that._getOption('registers')), (_a = {}, _a[prop] = value, _a))
                    });
                    return true;
                }
            });
        },
        set: function (value) {
            this._setOptions({ registers: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "colorMap", {
        /** @category Customization
         */
        /** {@inheritDoc LayoutOptions.colorMap} */
        get: function () {
            return this._getOption('colorMap');
        },
        set: function (value) {
            this._setOptions({ colorMap: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "backgroundColorMap", {
        /** @category Customization */
        /** {@inheritDoc LayoutOptions.backgroundColorMap} */
        get: function () {
            return this._getOption('backgroundColorMap');
        },
        set: function (value) {
            this._setOptions({ backgroundColorMap: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "letterShapeStyle", {
        /** @category Customization */
        /** {@inheritDoc LayoutOptions.letterShapeStyle} */
        get: function () {
            return this._getOption('letterShapeStyle');
        },
        set: function (value) {
            this._setOptions({ letterShapeStyle: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "minFontScale", {
        /** @category Customization */
        /** {@inheritDoc LayoutOptions.minFontScale} */
        get: function () {
            return this._getOption('minFontScale');
        },
        set: function (value) {
            this._setOptions({ minFontScale: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "maxMatrixCols", {
        /** @category Customization */
        /**  {@inheritDoc LayoutOptions.maxMatrixCols} */
        get: function () {
            return this._getOption('maxMatrixCols');
        },
        set: function (value) {
            this._setOptions({ maxMatrixCols: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "smartMode", {
        /** @category Customization */
        /** {@inheritDoc EditingOptions.smartMode}*/
        get: function () {
            return this._getOption('smartMode');
        },
        set: function (value) {
            this._setOptions({ smartMode: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "smartFence", {
        /** @category Customization */
        /** {@inheritDoc EditingOptions.smartFence}*/
        get: function () {
            return this._getOption('smartFence');
        },
        set: function (value) {
            this._setOptions({ smartFence: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "smartSuperscript", {
        /** @category Customization */
        /** {@inheritDoc EditingOptions.smartSuperscript} */
        get: function () {
            return this._getOption('smartSuperscript');
        },
        set: function (value) {
            this._setOptions({ smartSuperscript: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "scriptDepth", {
        /** @category Customization */
        /** {@inheritDoc EditingOptions.scriptDepth} */
        get: function () {
            return this._getOption('scriptDepth');
        },
        set: function (value) {
            this._setOptions({ scriptDepth: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "removeExtraneousParentheses", {
        /** @category Customization */
        /** {@inheritDoc EditingOptions.removeExtraneousParentheses} */
        get: function () {
            return this._getOption('removeExtraneousParentheses');
        },
        set: function (value) {
            this._setOptions({ removeExtraneousParentheses: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "mathModeSpace", {
        /** @category Customization */
        /** {@inheritDoc EditingOptions.mathModeSpace} */
        get: function () {
            return this._getOption('mathModeSpace');
        },
        set: function (value) {
            this._setOptions({ mathModeSpace: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "placeholderSymbol", {
        /** @category Customization */
        /** {@inheritDoc EditingOptions.placeholderSymbol} */
        get: function () {
            return this._getOption('placeholderSymbol');
        },
        set: function (value) {
            this._setOptions({ placeholderSymbol: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "popoverPolicy", {
        /** @category Customization */
        /** {@inheritDoc EditingOptions.popoverPolicy} */
        get: function () {
            return this._getOption('popoverPolicy');
        },
        set: function (value) {
            this._setOptions({ popoverPolicy: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "environmentPopoverPolicy", {
        /**
         * @category Customization */
        /** {@inheritDoc EditingOptions.environmentPopoverPolicy}   */
        get: function () {
            return this._getOption('environmentPopoverPolicy');
        },
        set: function (value) {
            this._setOptions({ environmentPopoverPolicy: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "menuItems", {
        /**
         * @category Customization
         */
        get: function () {
            var _a;
            if (!this._mathfield)
                throw new Error('Mathfield not mounted');
            return (_a = this._mathfield.menu._menuItems.map(function (x) { return x.menuItem; })) !== null && _a !== void 0 ? _a : [];
        },
        set: function (menuItems) {
            var _a;
            if (!this._mathfield)
                throw new Error('Mathfield not mounted');
            if (this._mathfield) {
                var btn = (_a = this._mathfield.element) === null || _a === void 0 ? void 0 : _a.querySelector('[part=menu-toggle]');
                if (btn)
                    btn.style.display = menuItems.length === 0 ? 'none' : '';
                this._mathfield.menu.menuItems = menuItems;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "mathVirtualKeyboardPolicy", {
        /**
         * @category Customization
         * @category Virtual Keyboard
         */
        /**    * {@inheritDoc EditingOptions.mathVirtualKeyboardPolicy} */
        get: function () {
            return this._getOption('mathVirtualKeyboardPolicy');
        },
        set: function (value) {
            this._setOptions({ mathVirtualKeyboardPolicy: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "inlineShortcuts", {
        /** @category Customization */
        /**    * {@inheritDoc EditingOptions.inlineShortcuts} */
        get: function () {
            if (!this._mathfield)
                throw new Error('Mathfield not mounted');
            return this._getOption('inlineShortcuts');
        },
        set: function (value) {
            if (!this._mathfield)
                throw new Error('Mathfield not mounted');
            this._setOptions({ inlineShortcuts: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "inlineShortcutTimeout", {
        /** @category Customization
         * {@inheritDoc EditingOptions.inlineShortcutTimeout}
         */
        get: function () {
            return this._getOption('inlineShortcutTimeout');
        },
        set: function (value) {
            this._setOptions({ inlineShortcutTimeout: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "keybindings", {
        /** @category Customization   */
        /**    * {@inheritDoc EditingOptions.keybindings} */
        get: function () {
            if (!this._mathfield)
                throw new Error('Mathfield not mounted');
            return this._getOption('keybindings');
        },
        set: function (value) {
            if (!this._mathfield)
                throw new Error('Mathfield not mounted');
            this._setOptions({ keybindings: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "onInsertStyle", {
        /** @category Hooks
         * @inheritDoc _MathfieldHooks.onInsertStyle
         */
        get: function () {
            var hook = this._getOption('onInsertStyle');
            if (hook === undefined)
                return styling_1.defaultInsertStyleHook;
            return hook;
        },
        set: function (value) {
            this._setOptions({ onInsertStyle: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "onInlineShortcut", {
        /** @category Hooks
         * @inheritDoc _MathfieldHooks.onInlineShortcut
         */
        get: function () {
            return this._getOption('onInlineShortcut');
        },
        set: function (value) {
            this._setOptions({ onInlineShortcut: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "onScrollIntoView", {
        /** @category Hooks
         * @inheritDoc _MathfieldHooks.onScrollIntoView
         */
        get: function () {
            return this._getOption('onScrollIntoView');
        },
        set: function (value) {
            this._setOptions({ onScrollIntoView: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "onExport", {
        /** @category Hooks
         * @inheritDoc _MathfieldHooks.onExport
         */
        get: function () {
            return this._getOption('onExport');
        },
        set: function (value) {
            this._setOptions({ onExport: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "readOnly", {
        get: function () {
            return this._getOption('readOnly');
        },
        set: function (value) {
            this._setOptions({ readOnly: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "isSelectionEditable", {
        get: function () {
            var _a, _b;
            return (_b = (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.isSelectionEditable) !== null && _b !== void 0 ? _b : false;
        },
        enumerable: false,
        configurable: true
    });
    /** @category Prompts */
    MathfieldElement.prototype.setPromptState = function (id, state, locked) {
        var _a;
        (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.setPromptState(id, state, locked);
    };
    MathfieldElement.prototype.getPromptState = function (id) {
        var _a, _b;
        return (_b = (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.getPromptState(id)) !== null && _b !== void 0 ? _b : [undefined, true];
    };
    Object.defineProperty(MathfieldElement.prototype, "virtualKeyboardTargetOrigin", {
        /** @category Virtual Keyboard */
        get: function () {
            return this._getOption('virtualKeyboardTargetOrigin');
        },
        set: function (value) {
            this._setOptions({ virtualKeyboardTargetOrigin: value });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "selection", {
        /**
         * An array of ranges representing the selection.
         *
         * It is guaranteed there will be at least one element. If a discontinuous
         * selection is present, the result will include more than one element.
         *
         * @category Selection
         *
         */
        get: function () {
            if (this._mathfield)
                return this._mathfield.model.selection;
            if (gDeferredState.has(this))
                return gDeferredState.get(this).selection;
            return { ranges: [[0, 0]], direction: 'forward' };
        },
        /**
         *
         * @category Selection
         */
        set: function (sel) {
            if (typeof sel === 'number')
                sel = { ranges: [[sel, sel]] };
            if (this._mathfield) {
                this._mathfield.model.selection = sel;
                (0, render_1.requestUpdate)(this._mathfield);
                return;
            }
            if (gDeferredState.has(this)) {
                gDeferredState.set(this, __assign(__assign({}, gDeferredState.get(this)), { selection: sel }));
                return;
            }
            gDeferredState.set(this, {
                value: undefined,
                selection: sel,
                options: getOptionsFromAttributes(this),
                menuItems: undefined
            });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "selectionIsCollapsed", {
        /**
         * @category Selection
         */
        get: function () {
            var selection = this.selection;
            return (selection.ranges.length === 1 &&
                selection.ranges[0][0] === selection.ranges[0][1]);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "position", {
        /**
         * The position of the caret/insertion point, from 0 to `lastOffset`.
         *
         * @category Selection
         *
         */
        get: function () {
            if (this._mathfield)
                return this._mathfield.model.position;
            if (gDeferredState.has(this))
                return gDeferredState.get(this).selection.ranges[0][0];
            return 0;
        },
        /**
         * @category Selection
         */
        set: function (offset) {
            if (this._mathfield) {
                this._mathfield.model.position = offset;
                (0, render_1.requestUpdate)(this._mathfield);
            }
            if (gDeferredState.has(this)) {
                gDeferredState.set(this, __assign(__assign({}, gDeferredState.get(this)), { selection: { ranges: [[offset, offset]] } }));
                return;
            }
            gDeferredState.set(this, {
                value: undefined,
                selection: { ranges: [[offset, offset]] },
                options: getOptionsFromAttributes(this),
                menuItems: undefined
            });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MathfieldElement.prototype, "lastOffset", {
        /**
         * The last valid offset.
         * @category Selection
         */
        get: function () {
            var _a, _b;
            return (_b = (_a = this._mathfield) === null || _a === void 0 ? void 0 : _a.model.lastOffset) !== null && _b !== void 0 ? _b : -1;
        },
        enumerable: false,
        configurable: true
    });
    MathfieldElement.version = '{{SDK_VERSION}}';
    MathfieldElement.openUrl = function (href) {
        if (!href)
            return;
        var url = new URL(href);
        if (!['http:', 'https:', 'file:'].includes(url.protocol.toLowerCase())) {
            MathfieldElement.playSound('plonk');
            return;
        }
        window.open(url, '_blank');
    };
    /** @internal */
    MathfieldElement._fontsDirectory = './fonts';
    /** @internal */
    MathfieldElement._soundsDirectory = './sounds';
    /**
     * When a key on the virtual keyboard is pressed, produce a short haptic
     * feedback, if the device supports it.
     * @category Virtual Keyboard
     */
    MathfieldElement.keypressVibration = true;
    /** @internal */
    MathfieldElement._keypressSound = {
        spacebar: 'keypress-spacebar.wav',
        "return": 'keypress-return.wav',
        "delete": 'keypress-delete.wav',
        "default": 'keypress-standard.wav'
    };
    /** @ignore */
    MathfieldElement._plonkSound = 'plonk.wav';
    /** @internal */
    MathfieldElement.audioBuffers = {};
    /**
     * Support for [Trusted Type](https://w3c.github.io/webappsec-trusted-types/dist/spec/).
     *
     * This optional function will be called before a string of HTML is
     * injected in the DOM, allowing that string to be sanitized
     * according to a policy defined by the host.
     */
    MathfieldElement.createHTML = function (x) { return x; };
    /** @internal */
    MathfieldElement._speechEngineRate = '100%';
    /** @internal */
    MathfieldElement._speechEngineVoice = 'Joanna';
    /** @internal */
    MathfieldElement._textToSpeechMarkup = '';
    /** @internal */
    MathfieldElement._textToSpeechRules = 'mathlive';
    /** @internal */
    MathfieldElement._textToSpeechRulesOptions = {};
    MathfieldElement.speakHook = speech_1.defaultSpeakHook;
    MathfieldElement.readAloudHook = speech_read_aloud_1.defaultReadAloudHook;
    /**
     * When switching from a tab to one that contains a mathfield that was
     * previously focused, restore the focus to the mathfield.
     *
     * This is behavior consistent with `<textarea>`, however it can be
     * disabled if it is not desired.
     *
     */
    MathfieldElement.restoreFocusWhenDocumentFocused = true;
    /** @internal */
    MathfieldElement._decimalSeparator = '.';
    /**
     * When using the keyboard to navigate a fraction, the order in which the
     * numerator and navigator are traversed:
     * - "numerator-denominator": first the elements in the numerator, then
     *   the elements in the denominator.
     * - "denominator-numerator": first the elements in the denominator, then
     *   the elements in the numerator. In some East-Asian cultures, fractions
     *   are read and written denominator first ("fēnzhī"). With this option
     *   the keyboard navigation follows this convention.
     *
     * **Default**: `"numerator-denominator"`
     * @category Localization
     */
    MathfieldElement.fractionNavigationOrder = 'numerator-denominator';
    /** @internal */
    MathfieldElement._isFunction = function (command) {
        var _a, _b;
        var ce = globalThis.MathfieldElement.computeEngine;
        return (_b = (_a = ce === null || ce === void 0 ? void 0 : ce.parse(command).domain) === null || _a === void 0 ? void 0 : _a.isFunction) !== null && _b !== void 0 ? _b : false;
    };
    return MathfieldElement;
}(HTMLElement));
exports.MathfieldElement = MathfieldElement;
function toCamelCase(s) {
    return s.replace(/[^a-zA-Z\d]+(.)/g, function (_m, c) { return c.toUpperCase(); });
}
// Function toKebabCase(s: string): string {
//     return s
//         .match(
//             /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
//         )
//         .map((x: string) => x.toLowerCase())
//         .join('-');
// }
function getOptionsFromAttributes(mfe) {
    var result = { readOnly: false };
    var attribs = MathfieldElement.optionsAttributes;
    Object.keys(attribs).forEach(function (x) {
        var _a;
        if (mfe.hasAttribute(x)) {
            var value = mfe.getAttribute(x);
            if (x === 'placeholder')
                result.contentPlaceholder = value !== null && value !== void 0 ? value : '';
            else if (attribs[x] === 'boolean')
                result[toCamelCase(x)] = true;
            else if (attribs[x] === 'on/off') {
                value = (_a = value === null || value === void 0 ? void 0 : value.toLowerCase()) !== null && _a !== void 0 ? _a : '';
                if (value === 'on' || value === 'true')
                    result[toCamelCase(x)] = true;
                else if (value === 'off' || value === 'false')
                    result[toCamelCase(x)] = false;
                else
                    result[toCamelCase(x)] = undefined;
            }
            else if (attribs[x] === 'number')
                result[toCamelCase(x)] = Number.parseFloat(value !== null && value !== void 0 ? value : '0');
            else
                result[toCamelCase(x)] = value;
        }
        // else if (attribs[x] === 'boolean') result[toCamelCase(x)] = false;
    });
    return result;
}
function isElementInternalsSupported() {
    if (!('ElementInternals' in window) || !HTMLElement.prototype.attachInternals)
        return false;
    if (!('role' in window.ElementInternals.prototype))
        return false;
    return true;
}
exports["default"] = MathfieldElement;
if ((0, capabilities_1.isBrowser)() && !((_a = window.customElements) === null || _a === void 0 ? void 0 : _a.get('math-field'))) {
    // The `window[Symbol.for('io.cortexjs.mathlive')]` global is used  to coordinate between mathfield
    // instances that may have been instantiated by different versions of the
    // library
    (_b = window[_d = Symbol["for"]('io.cortexjs.mathlive')]) !== null && _b !== void 0 ? _b : (window[_d] = {});
    var global_1 = window[Symbol["for"]('io.cortexjs.mathlive')];
    global_1.version = '{{SDK_VERSION}}';
    globalThis.MathfieldElement = MathfieldElement;
    (_c = window.customElements) === null || _c === void 0 ? void 0 : _c.define('math-field', MathfieldElement);
}
