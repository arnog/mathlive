import type { Selector } from './commands';
import type {
  LatexSyntaxError,
  LatexValue,
  MacroDictionary,
  ParseMode,
  Registers,
  Style,
} from './core-types';
import type {
  InsertOptions,
  OutputFormat,
  Offset,
  Range,
  Selection,
  Mathfield,
} from './mathfield';
import type {
  InlineShortcutDefinitions,
  Keybinding,
  MathfieldOptions,
} from './options';
import type { MenuItem } from './ui-menu-types';

import {
  get as getOptions,
  getDefault as getDefaultOptions,
  update as updateOptions,
} from '../editor-mathfield/options';
import { _Mathfield } from '../editor-mathfield/mathfield-private';
import { offsetFromPoint } from '../editor-mathfield/pointer-input';
import { getAtomBounds } from '../editor-mathfield/utils';
import { isBrowser } from '../ui/utils/capabilities';
import { resolveUrl } from '../common/script-url';
import { requestUpdate } from '../editor-mathfield/render';
import { reloadFonts, loadFonts } from '../core/fonts';
import { defaultSpeakHook } from '../editor/speech';
import { defaultReadAloudHook } from '../editor/speech-read-aloud';
import type { ComputeEngine } from '@cortex-js/compute-engine';

import { l10n } from '../core/l10n';
import { getStylesheet, getStylesheetContent } from '../common/stylesheet';
import { Scrim } from '../ui/utils/scrim';
import { isOffset, isRange, isSelection } from 'editor-model/selection-utils';
import { KeyboardModifiers } from './ui-events-types';

/** @category MathJSON */
export declare type Expression =
  | number
  | string
  | { [key: string]: any }
  | [Expression, ...Expression[]];

if (!isBrowser()) {
  console.error(
    `MathLive {{SDK_VERSION}}: this version of the MathLive library is for use in the browser. A subset of the API is available on the server side in the "mathlive-ssr" library. If using server side rendering (with React for example) you may want to do a dynamic import of the MathLive library inside a \`useEffect()\` call.`
  );
}

//
// Custom Events
//

/*
    ## Event re-targeting
    Some events bubble up through the DOM tree, so that they are detectable by
     any element on the page.

    Bubbling events fired from within shadow DOM are re-targeted so that, to any
    listener external to your component, they appear to come from your component itself.

    ## Custom Event Bubbling

    By default, a bubbling custom event fired inside shadow DOM will stop
    bubbling when it reaches the shadow root.

    To make a custom event pass through shadow DOM boundaries, you must set
    both the `composed` and `bubbles` flags to true.
*/

/**
 * The `move-out` event signals that the user pressed an **arrow** key or
 * **tab** key but there was no navigation possible inside the mathfield.
 *
 * This event provides an opportunity to handle this situation, for example
 * by focusing an element adjacent to the mathfield.
 *
 * If the event is canceled (i.e. `evt.preventDefault()` is called inside your
 * event handler), the default behavior is to play a "plonk" sound.
 *
 * @category Web Component
 */
export type MoveOutEvent = {
  direction: 'forward' | 'backward' | 'upward' | 'downward';
};

/**
 * - `"auto"`: the virtual keyboard is triggered when a
 * mathfield is focused on a touch capable device.
 * - `"manual"`: the virtual keyboard is not triggered automatically
 * - `"sandboxed"`: the virtual keyboard is displayed in the current browsing
 * context (iframe) if it has a defined container or is the top-level browsing
 * context.
 *
 * @category Virtual Keyboard
 */
export type VirtualKeyboardPolicy = 'auto' | 'manual' | 'sandboxed';

declare global {
  /**
   * Map the custom event names to types
   * @internal
   */
  interface HTMLElementEventMap {
    // Mathfield Element events
    'mode-change': CustomEvent;
    'mount': Event;
    'unmount': Event;
    'move-out': CustomEvent<MoveOutEvent>;
    'read-aloud-status-change': Event;
    'selection-change': Event;
    'undo-state-change': CustomEvent;

    // Virtual Keyboard events
    'before-virtual-keyboard-toggle': Event;
    'virtual-keyboard-toggle': Event;
  }
}

//
// Deferred State
//
// Operations that modify the state of the mathfield before it has been
// connected to the DOM will be stashed in this object and they
// will be applied to the element when it gets connected to the DOM.
//
const gDeferredState = new WeakMap<
  MathfieldElement,
  {
    value: string | undefined;
    selection: Selection;
    options: Partial<MathfieldOptions>;
    menuItems: Readonly<MenuItem[]> | undefined;
  }
>();

/**
 * These attributes of the `<math-field>` element correspond to the
 * [MathfieldOptions] properties.
 *
 * @category Web Component
 */
export interface MathfieldElementAttributes {
  // Allow for global aria attributes, data- attributes, micro-data attributes
  // and global element attributes
  [key: string]: unknown;
  'default-mode': string;
  'letter-shape-style': string;
  'min-font-scale': number;
  'max-matrix-cols': number;
  'popover-policy': string;
  /**
   * The LaTeX string to insert when the spacebar is pressed (on the physical or
   * virtual keyboard). Empty by default. Use `\;` for a thick space, `\:` for
   * a medium space, `\,` for a thin space.
   */
  'math-mode-space': string;
  /** When true, the user cannot edit the mathfield. */
  'read-only': boolean;
  'remove-extraneous-parentheses': boolean;
  /**
   * When `on` and an open fence is entered via `typedText()` it will
   * generate a contextually appropriate markup, for example using
   * `\left...\right` if applicable.
   *
   * When `off`, the literal value of the character will be inserted instead.
   */
  'smart-fence': string;
  /**
   * When `on`, during text input the field will switch automatically between
   * 'math' and 'text' mode depending on what is typed and the context of the
   * formula. If necessary, what was previously typed will be 'fixed' to
   * account for the new info.
   *
   * For example, when typing "if x >0":
   *
   * | Type  | Interpretation |
   * |---:|:---|
   * | "i" | math mode, imaginary unit |
   * | "if" | text mode, english word "if" |
   * | "if x" | all in text mode, maybe the next word is xylophone? |
   * | "if x >" | "if" stays in text mode, but now "x >" is in math mode |
   * | "if x > 0" | "if" in text mode, "x > 0" in math mode |
   *
   * Smart Mode is `off` by default.
   *
   * Manually switching mode (by typing `alt/option+=`) will temporarily turn
   * off smart mode.
   *
   *
   * **Examples**
   *
   * -   slope = rise/run
   * -   If x > 0, then f(x) = sin(x)
   * -   x^2 + sin (x) when x > 0
   * -   When x&lt;0, x^{2n+1}&lt;0
   * -   Graph x^2 -x+3 =0 for 0&lt;=x&lt;=5
   * -   Divide by x-3 and then add x^2-1 to both sides
   * -   Given g(x) = 4x – 3, when does g(x)=0?
   * -   Let D be the set {(x,y)|0&lt;=x&lt;=1 and 0&lt;=y&lt;=x}
   * -   \int\_{the unit square} f(x,y) dx dy
   * -   For all n in NN
   *
   */
  'smart-mode': string;
  /**
   * When `on`, when a digit is entered in an empty superscript, the cursor
   * leaps automatically out of the superscript. This makes entry of common
   * polynomials easier and faster. If entering other characters (for example
   * "n+1") the navigation out of the superscript must be done manually (by
   * using the cursor keys or the spacebar to leap to the next insertion
   * point).
   *
   * When `off`, the navigation out of the superscript must always be done
   * manually.
   *
   */
  'smart-superscript': string;
  /**
   * Maximum time, in milliseconds, between consecutive characters for them to be
   * considered part of the same shortcut sequence.
   *
   * A value of 0 is the same as infinity: any consecutive character will be
   * candidate for an inline shortcut, regardless of the interval between this
   * character and the previous one.
   *
   * A value of 750 will indicate that the maximum interval between two
   * characters to be considered part of the same inline shortcut sequence is
   * 3/4 of a second.
   *
   * This is useful to enter "+-" as a sequence of two characters, while also
   * supporting the "±" shortcut with the same sequence.
   *
   * The first result can be entered by pausing slightly between the first and
   * second character if this option is set to a value of 250 or so.
   *
   * Note that some operations, such as clicking to change the selection, or
   * losing the focus on the mathfield, will automatically timeout the
   * shortcuts.
   */
  'inline-shortcut-timeout': string;

  'script-depth': string;

  /** When the mathfield is empty, display this placeholder LaTeX string
   *  instead */
  'placeholder': string;

  /**
   * - `"auto"`: the virtual keyboard is triggered when a
   * mathfield is focused on a touch capable device.
   * - `"manual"`: the virtual keyboard is not triggered automatically
   * - `"sandboxed"`: the virtual keyboard is displayed in the current browsing
   * context (iframe) if it has a defined container or is the top-level browsing
   * context.
   *
   */
  'math-virtual-keyboard-policy': VirtualKeyboardPolicy;

  /**
   * Specify the `targetOrigin` parameter for
   * [postMessage](https://developer.mozilla.org/en/docs/Web/API/Window/postMessage)
   * to send control messages from child to parent frame to remote control
   * of mathfield component.
   *
   * **Default**: `window.origin`
   */
  'virtual-keyboard-target-origin': string;
}

const AUDIO_FEEDBACK_VOLUME = 0.5; // From 0.0 to 1.0

/** @internal */
const DEPRECATED_OPTIONS = {
  letterShapeStyle: 'mf.letterShapeStyle = ...',
  horizontalSpacingScale:
    'Removed. Use `"thinmuskip"`, `"medmuskip"`, and `"thickmuskip"` registers ',
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
  onExport: '`MathfieldElement.onExport`',
  onInlineShortcut: '`MathfieldElement.onInlineShortcut`',
  onScrollIntoView: '`MathfieldElement.onScrollIntoView`',
  locale: 'MathfieldElement.locale = ...',
  strings: 'MathfieldElement.strings = ...',
  decimalSeparator: 'MathfieldElement.decimalSeparator = ...',
  fractionNavigationOrder: 'MathfieldElement.fractionNavigationOrder = ...',
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
export class MathfieldElement extends HTMLElement implements Mathfield {
  static version = '{{SDK_VERSION}}';
  static get formAssociated(): boolean {
    return isElementInternalsSupported();
  }
  /**
   * Private lifecycle hooks.
   * If adding a 'boolean' attribute, add its default value to getOptionsFromAttributes
   * @internal
   */
  static get optionsAttributes(): Readonly<
    Record<string, 'number' | 'boolean' | 'string' | 'on/off'>
  > {
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
      'math-virtual-keyboard-policy': 'string',
    };
  }

  /**
   * Custom elements lifecycle hooks
   * @internal
   */
  static get observedAttributes(): readonly string[] {
    return [
      ...Object.keys(this.optionsAttributes),
      'contenteditable', // Global attribute
      'disabled', // Global attribute
      'readonly', // A semi-global attribute (not all standard elements support it, but some do)
      'read-only', // Alternate spelling for `readonly`
    ];
  }

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
  static get fontsDirectory(): string | null {
    return this._fontsDirectory;
  }
  static set fontsDirectory(value: string | null) {
    if (value !== this._fontsDirectory) {
      this._fontsDirectory = value;
      reloadFonts();
    }
  }

  /** @internal */
  get fontsDirectory(): never {
    throw new Error('Use MathfieldElement.fontsDirectory instead');
  }
  /** @internal */
  set fontsDirectory(_value: unknown) {
    throw new Error('Use MathfieldElement.fontsDirectory instead');
  }

  /** @internal */
  private static _fontsDirectory: string | null = './fonts';

  /**
   * A URL fragment pointing to the directory containing the optional
   * sounds used to provide feedback while typing.
   *
   * Some default sounds are available in the `/dist/sounds` directory of the SDK.
   *
   * Use `null` to prevent any sound from being loaded.
   * @category Virtual Keyboard
   */
  static get soundsDirectory(): string | null {
    return this._soundsDirectory;
  }
  static set soundsDirectory(value: string | null) {
    this._soundsDirectory = value;
    this.audioBuffers = {};
  }

  /** @internal */
  get soundsDirectory(): never {
    throw new Error('Use MathfieldElement.soundsDirectory instead');
  }
  /** @internal */
  set soundsDirectory(_value: unknown) {
    throw new Error('Use MathfieldElement.soundsDirectory instead');
  }

  /** @internal */
  private static _soundsDirectory: string | null = './sounds';

  /**
   * When a key on the virtual keyboard is pressed, produce a short haptic
   * feedback, if the device supports it.
   * @category Virtual Keyboard
   */
  static keypressVibration = true;

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
  static get keypressSound(): Readonly<{
    spacebar: null | string;
    return: null | string;
    delete: null | string;
    default: null | string;
  }> {
    return this._keypressSound;
  }
  static set keypressSound(
    value:
      | null
      | string
      | {
          spacebar?: null | string;
          return?: null | string;
          delete?: null | string;
          default: null | string;
        }
  ) {
    this.audioBuffers = {};

    if (value === null) {
      this._keypressSound = {
        spacebar: null,
        return: null,
        delete: null,
        default: null,
      };
    } else if (typeof value === 'string') {
      this._keypressSound = {
        spacebar: value,
        return: value,
        delete: value,
        default: value,
      };
    } else if (typeof value === 'object' && 'default' in value) {
      this._keypressSound = {
        spacebar: value.spacebar ?? value.default,
        return: value.return ?? value.default,
        delete: value.delete ?? value.default,
        default: value.default,
      };
    }
  }
  /** @internal */
  private static _keypressSound: {
    spacebar: null | string;
    return: null | string;
    delete: null | string;
    default: null | string;
  } = {
    spacebar: 'keypress-spacebar.wav',
    return: 'keypress-return.wav',
    delete: 'keypress-delete.wav',
    default: 'keypress-standard.wav',
  };

  /** @ignore */
  private static _plonkSound: string | null = 'plonk.wav';

  /**
   * Sound played to provide feedback when a command has no effect, for example
   * when pressing the spacebar at the root level.
   *
   * The property is either:
   * - a string, the name of an audio file in the `soundsDirectory` directory
   * - null to turn off the sound
   */
  static get plonkSound(): string | null {
    return this._plonkSound;
  }
  static set plonkSound(value: string | null) {
    this.audioBuffers = {};
    this._plonkSound = value;
  }

  /** @internal */
  private static audioBuffers: { [key: string]: AudioBuffer } = {};
  /** @internal */
  private static _audioContext: AudioContext;
  /** @internal */
  private static get audioContext(): AudioContext {
    if (!this._audioContext) this._audioContext = new AudioContext();
    return this._audioContext;
  }

  /**
   * Support for [Trusted Type](https://w3c.github.io/webappsec-trusted-types/dist/spec/).
   *
   * This optional function will be called before a string of HTML is
   * injected in the DOM, allowing that string to be sanitized
   * according to a policy defined by the host.
   */
  static createHTML: (html: string) => any = (x) => x;
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
  static get speechEngine(): 'local' | 'amazon' {
    return this._speechEngine;
  }
  static set speechEngine(value: 'local' | 'amazon') {
    this._speechEngine = value;
  }
  /** @internal */
  private static _speechEngine: 'local' | 'amazon';

  /**
   * Sets the speed of the selected voice.
   *
   * One of `x-slow`, `slow`, `medium`, `fast`, `x-fast` or a value as a
   * percentage.
   *
   * Range is `20%` to `200%` For example `200%` to indicate a speaking rate
   * twice the default rate.
   */
  static get speechEngineRate(): string {
    return this._speechEngineRate;
  }
  static set speechEngineRate(value: string) {
    this._speechEngineRate = value;
  }
  /** @internal */
  private static _speechEngineRate = '100%';

  /**
   * Indicates the voice to use with the speech engine.
   *
   * This is dependent on the speech engine. For Amazon Polly, see here:
   * https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
   *
   */
  static get speechEngineVoice(): string {
    return this._speechEngineVoice;
  }
  static set speechEngineVoice(value: string) {
    this._speechEngineVoice = value;
  }
  /** @internal */
  private static _speechEngineVoice = 'Joanna';

  /**
   * The markup syntax to use for the output of conversion to spoken text.
   *
   * Possible values are `ssml` for the SSML markup or `mac` for the macOS
   * markup, i.e. `&#91;&#91;ltr&#93;&#93;`.
   *
   */
  static get textToSpeechMarkup(): '' | 'ssml' | 'ssml_step' | 'mac' {
    return this._textToSpeechMarkup;
  }
  static set textToSpeechMarkup(value: '' | 'ssml' | 'ssml_step' | 'mac') {
    this._textToSpeechMarkup = value;
  }
  /** @internal */
  private static _textToSpeechMarkup: '' | 'ssml' | 'ssml_step' | 'mac' = '';

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
  static get textToSpeechRules(): 'mathlive' | 'sre' {
    return this._textToSpeechRules;
  }
  static set textToSpeechRules(value: 'mathlive' | 'sre') {
    this._textToSpeechRules = value;
  }
  /** @internal */
  private static _textToSpeechRules: 'mathlive' | 'sre' = 'mathlive';

  /**
   * A set of key/value pairs that can be used to configure the speech rule
   * engine.
   *
   * Which options are available depends on the speech rule engine in use.
   * There are no options available with MathLive's built-in engine. The
   * options for the SRE engine are documented
   * {@link https://github.com/zorkow/speech-rule-engine | here}
   */
  static get textToSpeechRulesOptions(): Readonly<Record<string, string>> {
    return this._textToSpeechRulesOptions;
  }
  static set textToSpeechRulesOptions(value: Record<string, string>) {
    this._textToSpeechRulesOptions = value;
  }
  /** @internal */
  private static _textToSpeechRulesOptions: Record<string, string> = {};

  static speakHook: (text: string) => void = defaultSpeakHook;
  static readAloudHook: (element: HTMLElement, text: string) => void =
    defaultReadAloudHook;

  /**
   * The locale (language + region) to use for string localization.
   *
   * If none is provided, the locale of the browser is used.
   * @category Localization
   *
   */
  static get locale(): string {
    return l10n.locale;
  }
  static set locale(value: string) {
    if (value === 'auto') value = navigator.language.slice(0, 5);
    l10n.locale = value;
  }

  /** @internal */
  get locale(): never {
    throw new Error('Use MathfieldElement.locale instead');
  }
  /** @internal */
  set locale(_value: unknown) {
    throw new Error('Use MathfieldElement.locale instead');
  }

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
  static get strings(): Readonly<Record<string, Record<string, string>>> {
    return l10n.strings;
  }
  static set strings(value: Record<string, Record<string, string>>) {
    l10n.merge(value);
  }

  /** @internal */
  get strings(): never {
    throw new Error('Use MathfieldElement.strings instead');
  }
  /** @internal */
  set strings(_val: unknown) {
    throw new Error('Use MathfieldElement.strings instead');
  }

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
  static get decimalSeparator(): ',' | '.' {
    return this._decimalSeparator;
  }
  static set decimalSeparator(value: ',' | '.') {
    this._decimalSeparator = value;
    if (this._computeEngine) {
      this._computeEngine.latexOptions.decimalMarker =
        this.decimalSeparator === ',' ? '{,}' : '.';
    }
  }

  /** @internal */
  get decimalSeparator(): never {
    throw new Error('Use MathfieldElement.decimalSeparator instead');
  }
  /** @internal */
  set decimalSeparator(_val: unknown) {
    throw new Error('Use MathfieldElement.decimalSeparator instead');
  }

  /** @internal */
  private static _decimalSeparator: ',' | '.' = '.';

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
  static fractionNavigationOrder:
    | 'numerator-denominator'
    | 'denominator-numerator' = 'numerator-denominator';

  /**
   * A custom compute engine instance. If none is provided, a default one is
   * used. If `null` is specified, no compute engine is used.
   */
  static get computeEngine(): ComputeEngine | null {
    if (this._computeEngine === undefined) {
      const ComputeEngineCtor =
        window[Symbol.for('io.cortexjs.compute-engine')]?.ComputeEngine;

      if (!ComputeEngineCtor) return null;

      this._computeEngine = new ComputeEngineCtor();

      if (this._computeEngine && this.decimalSeparator === ',')
        this._computeEngine.latexOptions.decimalMarker = '{,}';
    }
    return this._computeEngine ?? null;
  }
  static set computeEngine(value: ComputeEngine | null) {
    this._computeEngine = value;
  }

  /** @internal */
  get computeEngine(): never {
    throw new Error('Use MathfieldElement.computeEngine instead');
  }
  /** @internal */
  set computeEngine(_val: unknown) {
    throw new Error('Use MathfieldElement.computeEngine instead');
  }

  /** @internal */
  private static _computeEngine: ComputeEngine | null;

  /** @internal */
  private static _isFunction: (command: string) => boolean = (command) => {
    const ce = globalThis.MathfieldElement.computeEngine;
    return ce?.parse(command).domain?.isFunction ?? false;
  };

  static get isFunction(): (command: string) => boolean {
    if (typeof this._isFunction !== 'function') return () => false;
    return this._isFunction;
  }

  static set isFunction(value: (command: string) => boolean) {
    this._isFunction = value;
  }

  static async loadSound(
    sound: 'plonk' | 'keypress' | 'spacebar' | 'delete' | 'return'
  ): Promise<void> {
    //  Clear out the cached audio buffer
    delete this.audioBuffers[sound];

    let soundFile: string | undefined | null = '';
    switch (sound) {
      case 'keypress':
        soundFile = this._keypressSound.default;
        break;
      case 'return':
        soundFile = this._keypressSound.return;
        break;
      case 'spacebar':
        soundFile = this._keypressSound.spacebar;
        break;
      case 'delete':
        soundFile = this._keypressSound.delete;
        break;
      case 'plonk':
        soundFile = this.plonkSound;
        break;
    }

    if (typeof soundFile !== 'string') return;
    soundFile = soundFile.trim();
    const soundsDirectory = this.soundsDirectory;
    if (
      soundsDirectory === undefined ||
      soundsDirectory === null ||
      soundsDirectory === 'null' ||
      soundFile === 'none' ||
      soundFile === 'null'
    )
      return;

    // Fetch the audio buffer
    try {
      const response = await fetch(
        await resolveUrl(`${soundsDirectory}/${soundFile}`)
      );
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.audioBuffers[sound] = audioBuffer;
    } catch {}
  }

  static async playSound(
    name: 'keypress' | 'spacebar' | 'delete' | 'plonk' | 'return'
  ): Promise<void> {
    // According to MDN:
    // https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state
    //In iOS Safari, when a user leaves the page (e.g. switches tabs, minimizes the browser, or turns off the screen) the audio context's state changes to "interrupted" and needs to be resumed

    if (
      this.audioContext.state === 'suspended' ||
      this.audioContext.state === ('interrupted' as AudioContextState)
    )
      await this.audioContext.resume();

    if (!this.audioBuffers[name]) await this.loadSound(name);
    if (!this.audioBuffers[name]) return;

    // A sound source can't be played twice, so creeate a new one
    const soundSource = this.audioContext.createBufferSource();
    soundSource.buffer = this.audioBuffers[name];

    // Set the volume
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = AUDIO_FEEDBACK_VOLUME;
    soundSource.connect(gainNode).connect(this.audioContext.destination);

    soundSource.start();
  }

  /** @internal */
  private _mathfield: null | _Mathfield;

  /** @internal
   * Supported by some browser: allows some (static) attributes to be set
   * without being reflected on the element instance.
   */
  private _internals: ElementInternals;

  /** @internal */
  private _observer: MutationObserver | null = null;

  // The content of <style> tags inside the element.
  /** @internal */
  private _style: string;

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
  constructor(options?: Partial<MathfieldOptions>) {
    super();

    if (options) {
      const warnings: string[] = [];
      for (const key of Object.keys(options)) {
        if (DEPRECATED_OPTIONS[key]) {
          if (DEPRECATED_OPTIONS[key].startsWith('mf.')) {
            if (!DEPRECATED_OPTIONS[key].startsWith(`mf.${key}`)) {
              const newName = DEPRECATED_OPTIONS[key].match(/([a-zA-Z]+) =/);
              warnings.push(
                `Option \`${key}\` has been renamed \`${newName[1]}\``
              );
            } else {
              warnings.push(
                `Option \`${key}\` cannot be used as a constructor option. Use ${DEPRECATED_OPTIONS[key]}`
              );
            }
          } else {
            warnings.push(
              `Option \`${key}\` cannot be used as a constructor option. Use ${DEPRECATED_OPTIONS[key]}`
            );
          }
        }
      }

      if (warnings.length > 0) {
        console.group(
          `%cMathLive {{SDK_VERSION}}: %cInvalid Options`,
          'color:#12b; font-size: 1.1rem',
          'color:#db1111; font-size: 1.1rem'
        );
        console.warn(
          `Some of the options passed to \`new MathfieldElement(...)\` are invalid. 
          See mathfield/changelog/ for details.`
        );
        for (const warning of warnings) console.warn(warning);

        console.groupEnd();
      }
    }

    if (isElementInternalsSupported()) {
      this._internals = this.attachInternals();
      this._internals['role'] = 'math';
      this._internals.ariaLabel = 'math input field';
      this._internals.ariaMultiLine = 'false';
    }

    this.attachShadow({ mode: 'open', delegatesFocus: true });

    if (this.shadowRoot && 'adoptedStyleSheets' in this.shadowRoot) {
      // @ts-ignore
      this.shadowRoot!.adoptedStyleSheets = [
        getStylesheet('core'),
        getStylesheet('mathfield'),
        getStylesheet('mathfield-element'),
        getStylesheet('ui'),
        getStylesheet('menu'),
      ];

      // @ts-ignore
      this.shadowRoot!.appendChild(document.createElement('span'));

      const slot = document.createElement('slot');
      slot.style.display = 'none';
      // @ts-ignore
      this.shadowRoot!.appendChild(slot);
    } else {
      // @ts-ignore
      this.shadowRoot!.innerHTML =
        '<style>' +
        getStylesheetContent('core') +
        getStylesheetContent('mathfield') +
        getStylesheetContent('mathfield-element') +
        getStylesheetContent('ui') +
        getStylesheetContent('menu') +
        '</style>' +
        '<span></span><slot style="display:none"></slot>';
    }

    // Record the (optional) configuration options, as a deferred state
    if (options) this._setOptions(options);
  }

  showMenu(_: {
    location: { x: number; y: number };
    modifiers: KeyboardModifiers;
  }): boolean {
    return this._mathfield?.showMenu(_) ?? false;
  }

  /** @internal */
  get mathVirtualKeyboard(): never {
    throw new Error(
      'The `mathVirtualKeyboard` property is not available on the MathfieldElement. Use `window.mathVirtualKeyboard` instead.'
    );
  }

  /** @internal */
  onPointerDown(): void {
    window.addEventListener(
      'pointerup',
      (evt) => {
        // Disabled elements do not dispatch 'click' events
        if (evt.target === this && !this._mathfield?.disabled) {
          this.dispatchEvent(
            new MouseEvent('click', {
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
              shiftKey: evt.shiftKey,
            })
          );
        }
      },
      { once: true }
    );
  }

  /**
   * @inheritDoc _Mathfield#getPromptValue
   * @category Prompts */
  getPromptValue(placeholderId: string, format?: OutputFormat): string {
    return this._mathfield?.getPromptValue(placeholderId, format) ?? '';
  }

  /**
   * @inheritDoc _Mathfield.setPromptValue
   * @category Prompts
   * */
  setPromptValue(
    id: string,
    content: string,
    insertOptions: Omit<InsertOptions, 'insertionMode'>
  ): void {
    this._mathfield?.setPromptValue(id, content, insertOptions);
  }

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

  getPromptRange(id: string): Range | null {
    return this._mathfield?.getPromptRange(id) ?? null;
  }

  /** Return the id of the prompts matching the filter.
   * @category Prompts
   */
  getPrompts(filter?: {
    id?: string;
    locked?: boolean;
    correctness?: 'correct' | 'incorrect' | 'undefined';
  }): string[] {
    return this._mathfield?.getPrompts(filter) ?? [];
  }

  get form(): HTMLFormElement | null {
    return this._internals?.['form'];
  }

  get name(): string {
    return this.getAttribute('name') ?? '';
  }

  get type(): string {
    return this.localName;
  }

  get mode(): ParseMode {
    return (
      this._mathfield?.model.mode ??
      (this.defaultMode === 'text' ? 'text' : 'math')
    );
  }

  set mode(value: ParseMode) {
    this._mathfield?.switchMode(value);
  }

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
  get expression(): any | null {
    if (!this._mathfield) return undefined;
    if (!window[Symbol.for('io.cortexjs.compute-engine')]) {
      console.error(
        `MathLive {{SDK_VERSION}}: The CortexJS Compute Engine library is not available.
        
        Load the library, for example with:
        
        import "https://unpkg.com/@cortex-js/compute-engine?module"`
      );
      return null;
    }
    return this._mathfield.expression;
  }

  set expression(mathJson: Expression | any) {
    if (!this._mathfield) return;
    const latex = MathfieldElement.computeEngine?.box(mathJson).latex ?? null;
    if (latex !== null) this._mathfield.setValue(latex);

    if (!window[Symbol.for('io.cortexjs.compute-engine')]) {
      console.error(
        `MathLive {{SDK_VERSION}}: The Compute Engine library is not available.
        
        Load the library, for example with:
        
        import "https://unpkg.com/@cortex-js/compute-engine?module"`
      );
    }
  }

  /**
   * Return an array of LaTeX syntax errors, if any.
   * @category Accessing and changing the content
   */
  get errors(): readonly LatexSyntaxError[] {
    return this._mathfield?.errors ?? [];
  }

  /** @internal */
  private _getOptions<K extends keyof MathfieldOptions>(
    keys: K[]
  ): Pick<MathfieldOptions, K>;
  private _getOptions(): MathfieldOptions;
  private _getOptions(
    keys?: keyof MathfieldOptions | (keyof MathfieldOptions)[]
  ): null | Partial<MathfieldOptions> {
    if (this._mathfield) return getOptions(this._mathfield.options, keys);

    if (!gDeferredState.has(this)) return null;
    return {
      ...getOptions(
        {
          ...getDefaultOptions(),
          ...updateOptions(gDeferredState.get(this)!.options),
        },
        keys
      ),
    };
  }

  /**
   *  @category Options
   *  @deprecated
   */
  private getOptions<K extends keyof MathfieldOptions>(
    keys: K[]
  ): Pick<MathfieldOptions, K>;
  private getOptions(): MathfieldOptions;
  private getOptions(
    keys?: keyof MathfieldOptions | (keyof MathfieldOptions)[]
  ): null | Partial<MathfieldOptions> {
    console.warn(
      `%cMathLive {{SDK_VERSION}}: %cDeprecated Usage%c
      \`mf.getOptions()\` is deprecated. Read the property directly on the mathfield instead.
      See mathfield/changelog/ for details.`,
      'color:#12b; font-size: 1.1rem',
      'color:#db1111; font-size: 1.1rem',
      'color: inherit, font-size: 1rem'
    );

    if (this._mathfield) return getOptions(this._mathfield.options, keys);

    if (!gDeferredState.has(this)) return null;
    return getOptions(
      {
        ...getDefaultOptions(),
        ...updateOptions(gDeferredState.get(this)!.options),
      },
      keys
    );
  }
  /** @internal */
  private reflectAttributes() {
    const defaultOptions = getDefaultOptions();
    const options = this._getOptions();
    Object.keys(MathfieldElement.optionsAttributes).forEach((x) => {
      const prop = toCamelCase(x);
      if (MathfieldElement.optionsAttributes[x] === 'on/off') {
        if (defaultOptions[prop] !== options[prop])
          this.setAttribute(x, options[prop] ? 'on' : 'off');
        else this.removeAttribute(x);
      } else if (defaultOptions[prop] !== options[prop]) {
        if (MathfieldElement.optionsAttributes[x] === 'boolean') {
          if (options[prop]) {
            // Add attribute
            this.setAttribute(x, '');
          } else {
            // Remove attribute
            this.removeAttribute(x);
          }
        } else {
          // Set attribute (as string)
          if (
            typeof options[prop] === 'string' ||
            typeof options[prop] === 'number'
          )
            this.setAttribute(x, options[prop].toString());
        }
      }
    });
  }

  /**
   *  @category Options
   * @deprecated
   */
  private getOption<K extends keyof MathfieldOptions>(
    key: K
  ): MathfieldOptions[K] {
    console.warn(
      `%cMathLive {{SDK_VERSION}}: %cDeprecated Usage%c
      \`mf.getOption()\` is deprecated. Read the property directly on the mathfield instead.
      See mathfield/changelog/ for details.`,
      'color:#12b; font-size: 1.1rem',
      'color:#db1111; font-size: 1.1rem',
      'color: inherit, font-size: 1rem'
    );
    return this._getOptions([key])[key];
  }

  /** @internal */
  private _getOption<K extends keyof MathfieldOptions>(
    key: K
  ): MathfieldOptions[K] {
    return this._getOptions([key])[key];
  }

  /** @internal */
  private _setOptions(options: Partial<MathfieldOptions>): void {
    if (this._mathfield) this._mathfield.setOptions(options);
    else if (gDeferredState.has(this)) {
      const mergedOptions = {
        ...gDeferredState.get(this)!.options,
        ...options,
      };
      gDeferredState.set(this, {
        ...gDeferredState.get(this)!,
        selection: { ranges: mergedOptions.readOnly ? [[0, 0]] : [[0, -1]] },
        options: mergedOptions,
      });
    } else {
      gDeferredState.set(this, {
        value: undefined,
        selection: { ranges: [[0, 0]] },
        options,
        menuItems: undefined,
      });
    }

    // Reflect options to attributes
    this.reflectAttributes();
  }

  /**
   *  @category Options
   * @deprecated
   */
  private setOptions(options: Partial<MathfieldOptions>): void {
    console.group(
      `%cMathLive {{SDK_VERSION}}: %cDeprecated Usage`,
      'color:#12b; font-size: 1.1rem',
      'color:#db1111; font-size: 1.1rem'
    );
    console.warn(
      ` \`mf.setOptions()\` is deprecated. Set the property directly on the mathfield instead.
      See mathfield/changelog/ for details.`
    );
    for (const key of Object.keys(options)) {
      if (DEPRECATED_OPTIONS[key]) {
        console.warn(
          `\`mf.setOptions({${key}:...})\` -> ${DEPRECATED_OPTIONS[key]}`
        );
      }
    }
    console.groupEnd();
    this._setOptions(options);
  }

  /**
   * @inheritDoc _Mathfield.executeCommand
   */
  executeCommand(selector: Selector): boolean;
  executeCommand(selector: Selector, ...args: unknown[]): boolean;
  executeCommand(selector: [Selector, ...unknown[]]): boolean;
  executeCommand(...args: unknown[]): boolean {
    let selector: Selector | [Selector, ...unknown[]];
    if (args.length === 1)
      selector = args[0] as Selector | [Selector, ...unknown[]];
    else selector = [args[0] as Selector, ...args.slice(1)];

    if (selector) return this._mathfield?.executeCommand(selector) ?? false;

    throw new Error('Invalid selector');
  }

  /**
   * @inheritDoc _Mathfield.getValue
   * @category Accessing and changing the content
   */
  getValue(format?: OutputFormat): string;
  getValue(start: Offset, end: Offset, format?: OutputFormat): string;
  getValue(range: Range, format?: OutputFormat): string;
  getValue(selection: Selection, format?: OutputFormat): string;
  getValue(
    arg1?: Offset | Range | Selection | OutputFormat,
    arg2?: Offset | OutputFormat,
    arg3?: OutputFormat
  ): string {
    if (this._mathfield)
      return this._mathfield.model.getValue(arg1 as any, arg2 as any, arg3);

    if (gDeferredState.has(this)) {
      let start: Offset;
      let end: Offset;
      let format: OutputFormat | undefined = undefined;
      if (isSelection(arg1)) {
        [start, end] = arg1.ranges[0];
        format = arg2 as OutputFormat;
      } else if (isRange(arg1)) {
        [start, end] = arg1;
        format = arg2 as OutputFormat;
      } else if (isOffset(arg1) && isOffset(arg2)) {
        start = arg1;
        end = arg2;
        format = arg3;
      } else {
        start = 0;
        end = -1;
        format = arg1 as OutputFormat;
      }

      if (
        (format === undefined || format === 'latex') &&
        start === 0 &&
        end === -1
      )
        return gDeferredState.get(this)!.value ?? this.textContent ?? '';
    }

    return '';
  }

  /**
   * @inheritDoc _Mathfield.setValue
   * @category Accessing and changing the content
   */
  setValue(value?: string, options?: InsertOptions): void {
    if (this._mathfield && value !== undefined) {
      const currentValue = this._mathfield.model.getValue();
      if (currentValue === value) return;

      options ??= { silenceNotifications: true, mode: 'math' };
      this._mathfield.setValue(value, options);

      return;
    }

    if (gDeferredState.has(this)) {
      const options = gDeferredState.get(this)!.options;
      gDeferredState.set(this, {
        value,
        selection: { ranges: [[-1, -1]], direction: 'forward' },
        options,
        menuItems: undefined,
      });
      return;
    }

    const attrOptions = getOptionsFromAttributes(this);
    gDeferredState.set(this, {
      value,
      selection: { ranges: [[-1, -1]], direction: 'forward' },
      options: attrOptions,
      menuItems: undefined,
    });
  }

  /**
   * @inheritDoc _Mathfield.hasFocus
   *
   * @category Focus
   *
   */
  hasFocus(): boolean {
    return this._mathfield?.hasFocus() ?? false;
  }

  /**
   * Sets the focus to the mathfield (will respond to keyboard input).
   *
   * @category Focus
   *
   */
  focus(): void {
    this._mathfield?.focus();
  }

  /**
   * Remove the focus from the mathfield (will no longer respond to keyboard
   * input).
   *
   * @category Focus
   *
   */
  blur(): void {
    this._mathfield?.blur();
  }

  /**
   * Select the content of the mathfield.
   * @category Selection
   */
  select(): void {
    this._mathfield?.select();
  }

  /**
   * @inheritDoc _Mathfield.insert

   *  @category Accessing and changing the content
   */
  insert(s: string, options?: InsertOptions): boolean {
    return this._mathfield?.insert(s, options) ?? false;
  }

  /**
   * @inheritDoc _Mathfield.applyStyle
   *
   * @category Accessing and changing the content
   */
  applyStyle(
    style: Readonly<Style>,
    options?: Range | { range?: Range; operation?: 'set' | 'toggle' }
  ): void {
    return this._mathfield?.applyStyle(style, options);
  }

  /**
   *
   * @category Accessing and changing the content
   */
  queryStyle(style: Readonly<Style>): 'some' | 'all' | 'none' {
    return this._mathfield?.queryStyle(style) ?? 'none';
  }

  /**
   * @inheritDoc _Mathfield.getCaretPoint
   * @category Selection
   */
  get caretPoint(): null | Readonly<{ x: number; y: number }> {
    return this._mathfield?.getCaretPoint() ?? null;
  }

  set caretPoint(point: null | { x: number; y: number }) {
    if (!point) return;
    this._mathfield?.setCaretPoint(point.x, point.y);
  }

  /**
   * `x` and `y` are in viewport coordinates.
   *
   * Return true if the location of the point is a valid caret location.
   *
   * See also [[`caretPoint`]]
   * @category Selection
   */
  setCaretPoint(x: number, y: number): boolean {
    return this._mathfield?.setCaretPoint(x, y) ?? false;
  }

  /** The offset closest to the location `(x, y)` in viewport coordinate.
   *
   * **`bias`**:  if `0`, the vertical midline is considered to the left or
   * right sibling. If `-1`, the left sibling is favored, if `+1`, the right
   * sibling is favored.
   *
   * @category Selection
   */
  offsetFromPoint(
    x: number,
    y: number,
    options?: { bias?: -1 | 0 | 1 }
  ): Offset {
    if (!this._mathfield) return -1;
    return offsetFromPoint(this._mathfield, x, y, options);
  }

  /** The bounding rect of the atom at offset
   *
   * @category Selection
   *
   */
  hitboxFromOffset(offset: number): DOMRect | null {
    if (!this._mathfield) return null;
    const atom = this._mathfield.model.at(offset);
    if (!atom) return null;
    const bounds = getAtomBounds(this._mathfield, atom);
    if (!bounds) return null;
    return new DOMRect(
      bounds.left,
      bounds.top,
      bounds.right - bounds.left,
      bounds.bottom - bounds.top
    );
  }

  /**
   * Reset the undo stack
   *
   * @category Undo
   */
  resetUndo(): void {
    this._mathfield?.resetUndo();
  }

  /**
   * Return whether there are undoable items
   * @category Undo
   */
  canUndo(): boolean {
    if (!this._mathfield) return false;
    return this._mathfield.canUndo();
  }

  /**
   * Return whether there are redoable items
   * @category Undo
   */
  canRedo(): boolean {
    if (!this._mathfield) return false;
    return this._mathfield.canRedo();
  }

  /** @internal */
  handleEvent(evt: Event): void {
    // If the scrim for the variant panel or the menu is
    // open, ignore events.
    // Otherwise we may end up disconecting from the VK
    if (Scrim.state !== 'closed') return;

    // Also, if the menu is open
    if (this._mathfield?.menu?.state !== 'closed') return;

    if (evt.type === 'pointerdown') this.onPointerDown();
    if (evt.type === 'focus') this._mathfield?.focus();

    // Ignore blur events if the scrim is open (case where the variant panel
    // is open). Otherwise we disconect from the VK and end up in a weird state.
    if (evt.type === 'blur' && Scrim.scrim?.state === 'closed')
      this._mathfield?.blur();
  }

  /**
   * Custom elements lifecycle hooks
   * @internal
   */
  connectedCallback(): void {
    const computedStyle = window.getComputedStyle(this);
    const shadowRoot = this.shadowRoot!;
    const host = shadowRoot.host;
    const userSelect = computedStyle.userSelect !== 'none';

    if (userSelect) host.addEventListener('pointerdown', this, true);
    else {
      const span = shadowRoot.querySelector('span');
      span!.style.pointerEvents = 'none';
    }
    // Listen for an element *inside* the mathfield to get focus, e.g. the virtual keyboard toggle
    host.addEventListener('focus', this, true);
    host.addEventListener('blur', this, true);

    // Create an observer instance to detect when the innerHTML or textContent
    // of the element is modified
    this._observer = new MutationObserver(() => {
      this.value = this.textContent ?? '';
    });
    this._observer.observe(this, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    if (!isElementInternalsSupported()) {
      if (!this.hasAttribute('role')) this.setAttribute('role', 'math');
      if (!this.hasAttribute('aria-label'))
        this.setAttribute('aria-label', 'math input field');
      this.setAttribute('aria-multiline', 'false');
    }

    // NVDA on Firefox seems to require this attribute
    if (userSelect && !this.hasAttribute('contenteditable'))
      this.setAttribute('contenteditable', 'true');

    // When the elements get focused (through tabbing for example)
    // focus the mathfield
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');

    const slot = shadowRoot.querySelector<HTMLSlotElement>('slot:not([name])');
    if (slot) {
      try {
        this._style = slot
          .assignedElements()
          .filter((x) => x.tagName.toLowerCase() === 'style')
          .map((x) => x.textContent)
          .join('');
      } catch (error: unknown) {
        console.error(error);
      }
    }
    // Add shadowed stylesheet if one was provided
    // (this is important to support the `\class{}{}` command)
    if (this._style) {
      const styleElement = document.createElement('style');
      styleElement.textContent = this._style;
      shadowRoot.appendChild(styleElement);
    }

    let value = '';
    // Check if there is a `value` attribute and set the initial value
    // of the mathfield from it
    if (this.hasAttribute('value')) value = this.getAttribute('value')!;
    else {
      value =
        slot
          ?.assignedNodes()
          .map((x) => (x.nodeType === 3 ? x.textContent : ''))
          .join('')
          .trim() ?? '';
    }

    this._mathfield = new _Mathfield(
      shadowRoot.querySelector(':host > span')!,
      {
        ...(gDeferredState.get(this)?.options ??
          getOptionsFromAttributes(this)),
        eventSink: this,
        value,
      }
    );

    if (!gDeferredState.has(this)) {
      this.upgradeProperty('disabled');
      this.upgradeProperty('readonly');
      for (const attr of Object.keys(MathfieldElement.optionsAttributes))
        this.upgradeProperty(toCamelCase(attr));
    }

    // The mathfield creation could have failed
    if (!this._mathfield?.model) {
      this._mathfield = null;
      return;
    }

    if (gDeferredState.has(this)) {
      const mf = this._mathfield!;
      const state = gDeferredState.get(this)!;
      const menuItems = state.menuItems;
      mf.model.deferNotifications({ content: false, selection: false }, () => {
        const value = state.value;
        if (value !== undefined) mf.setValue(value);
        mf.model.selection = state.selection;

        gDeferredState.delete(this);
      });

      if (menuItems) this.menuItems = menuItems;
    }

    // Notify listeners that we're mounted and ready
    window.queueMicrotask(() => {
      if (!this.isConnected) return;
      this.dispatchEvent(
        new Event('mount', {
          cancelable: false,
          bubbles: true,
          composed: true,
        })
      );
    });

    // Load the fonts
    void loadFonts();
  }

  /**
   * Custom elements lifecycle hooks
   * @internal
   */
  disconnectedCallback(): void {
    this.shadowRoot!.host.removeEventListener('pointerdown', this, true);

    if (!this._mathfield) return;

    this._observer?.disconnect();
    this._observer = null;

    window.queueMicrotask(() =>
      // Notify listeners that we have been unmounted
      this.dispatchEvent(
        new Event('unmount', {
          cancelable: false,
          bubbles: true,
          composed: true,
        })
      )
    );

    // Save the state (in case the element gets reconnected later)
    const options = getOptions(
      this._mathfield.options,
      Object.keys(MathfieldElement.optionsAttributes).map((x) => toCamelCase(x))
    );
    gDeferredState.set(this, {
      value: this._mathfield.getValue(),
      selection: this._mathfield.model.selection,
      menuItems: this._mathfield.menu?.menuItems ?? undefined,
      options,
    });

    // Dispose of the mathfield
    this._mathfield.dispose();
    this._mathfield = null;
  }

  /**
   * Private lifecycle hooks
   * @internal
   */
  upgradeProperty(prop: string): void {
    if (this.hasOwnProperty(prop)) {
      const value: unknown = this[prop];
      // A property may have already been set on the object, before
      // the element was connected: delete the property (after saving its value)
      // and use the setter to (re-)set its value.
      delete this[prop];
      if (prop === 'readonly' || prop === 'read-only') prop = 'readOnly';
      this[prop] = value;
    }
  }

  /**
   * Custom elements lifecycle hooks
   * @internal
   */
  attributeChangedCallback(
    name: string,
    oldValue: unknown,
    newValue: unknown
  ): void {
    if (oldValue === newValue) return;
    const hasValue: boolean = newValue !== null;
    switch (name) {
      case 'contenteditable':
        requestUpdate(this._mathfield);
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
  }

  get readonly(): boolean {
    return this.hasAttribute('readonly') || this.hasAttribute('read-only');
  }

  set readonly(value: boolean) {
    const isReadonly = Boolean(value);

    // Note that `readonly` is a "boolean attribute" as
    // per the HTML5 spec. Its value must be the empty string to indicate
    // a value of true, or it must be absent to indicate a value of false.
    // https://html.spec.whatwg.org/#boolean-attribute
    if (isReadonly) {
      // The canonical spelling is "readonly" (no dash. It's a global attribute
      // name and follows HTML attribute conventions)
      this.setAttribute('readonly', '');
      if (isElementInternalsSupported()) this._internals.ariaReadOnly = 'true';
      else this.setAttribute('aria-readonly', 'true');

      this.setAttribute('aria-readonly', 'true');
    } else {
      if (isElementInternalsSupported()) this._internals.ariaReadOnly = 'false';
      else this.removeAttribute('aria-readonly');

      this.removeAttribute('readonly');
      this.removeAttribute('read-only');
    }

    this._setOptions({ readOnly: isReadonly });
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  set disabled(value: boolean) {
    const isDisabled = Boolean(value);
    if (isDisabled) this.setAttribute('disabled', '');
    else this.removeAttribute('disabled');

    if (isElementInternalsSupported())
      this._internals.ariaDisabled = isDisabled ? 'true' : 'false';
    else this.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');

    if (
      isDisabled &&
      this._mathfield?.hasFocus &&
      window.mathVirtualKeyboard.visible
    )
      this._mathfield.executeCommand('hideVirtualKeyboard');
  }

  /**
   * The content of the mathfield as a LaTeX expression.
   * ```js
   * document.querySelector('mf').value = '\\frac{1}{\\pi}'
   * ```
   *  @category Accessing and changing the content
   */
  get value(): string {
    return this.getValue();
  }

  /**
   *  @category Accessing and changing the content
   */
  set value(value: string) {
    this.setValue(value);
  }

  /** @category Customization
   * @inheritDoc LayoutOptions.defaultMode
   */
  get defaultMode(): 'inline-math' | 'math' | 'text' {
    return this._getOption('defaultMode');
  }
  set defaultMode(value: 'inline-math' | 'math' | 'text') {
    this._setOptions({ defaultMode: value });
  }

  /** @category Customization
   * @inheritDoc LayoutOptions.macros
   */
  get macros(): Readonly<MacroDictionary> {
    return this._getOption('macros');
  }
  set macros(value: MacroDictionary) {
    this._setOptions({ macros: value });
  }

  /** @category Customization
   * @inheritDoc Registers
   */
  get registers(): Readonly<Registers> {
    const that = this;
    return new Proxy(
      {},
      {
        get: (_, prop): number | string | LatexValue | undefined => {
          if (typeof prop !== 'string') return undefined;
          return that._getOption('registers')[prop];
        },
        set(_, prop, value): boolean {
          if (typeof prop !== 'string') return false;
          that._setOptions({
            registers: { ...that._getOption('registers'), [prop]: value },
          });
          return true;
        },
      }
    );
  }

  set registers(value: Registers) {
    this._setOptions({ registers: value });
  }

  /** @category Customization
   * @inheritDoc LayoutOptions.colorMap
   */
  get colorMap(): (name: string) => string | undefined {
    return this._getOption('colorMap');
  }
  set colorMap(value: (name: string) => string | undefined) {
    this._setOptions({ colorMap: value });
  }

  /** @category Customization
   * @inheritDoc LayoutOptions.backgroundColorMap
   */
  get backgroundColorMap(): (name: string) => string | undefined {
    return this._getOption('backgroundColorMap');
  }
  set backgroundColorMap(value: (name: string) => string | undefined) {
    this._setOptions({ backgroundColorMap: value });
  }

  /** @category Customization
   * @inheritDoc LayoutOptions.letterShapeStyle
   */
  get letterShapeStyle(): 'auto' | 'tex' | 'iso' | 'french' | 'upright' {
    return this._getOption('letterShapeStyle');
  }
  set letterShapeStyle(value: 'auto' | 'tex' | 'iso' | 'french' | 'upright') {
    this._setOptions({ letterShapeStyle: value });
  }

  /** @category Customization
   * @inheritDoc LayoutOptions.minFontScale
   */
  get minFontScale(): number {
    return this._getOption('minFontScale');
  }
  set minFontScale(value: number) {
    this._setOptions({ minFontScale: value });
  }

  /** @category Customization
   * @inheritDoc LayoutOptions.maxMatrixCols
   */
  get maxMatrixCols(): number {
    return this._getOption('maxMatrixCols');
  }
  set maxMatrixCols(value: number) {
    this._setOptions({ maxMatrixCols: value });
  }

  /** @category Customization
   * @inheritDoc EditingOptions.smartMode
   */
  get smartMode(): boolean {
    return this._getOption('smartMode');
  }
  set smartMode(value: boolean) {
    this._setOptions({ smartMode: value });
  }

  /** @category Customization
   * @inheritDoc EditingOptions.smartFence
   */
  get smartFence(): boolean {
    return this._getOption('smartFence');
  }
  set smartFence(value: boolean) {
    this._setOptions({ smartFence: value });
  }

  /** @category Customization
   * @inheritDoc EditingOptions.smartSuperscript
   */
  get smartSuperscript(): boolean {
    return this._getOption('smartSuperscript');
  }
  set smartSuperscript(value: boolean) {
    this._setOptions({ smartSuperscript: value });
  }

  /** @category Customization
   * @inheritDoc EditingOptions.scriptDepth
   */
  get scriptDepth(): number | [number, number] {
    return this._getOption('scriptDepth');
  }
  set scriptDepth(value: number | [number, number]) {
    this._setOptions({ scriptDepth: value });
  }

  /** @category Customization
   * @inheritDoc EditingOptions.removeExtraneousParentheses
   */
  get removeExtraneousParentheses(): boolean {
    return this._getOption('removeExtraneousParentheses');
  }
  set removeExtraneousParentheses(value: boolean) {
    this._setOptions({ removeExtraneousParentheses: value });
  }

  /** @category Customization
   * @inheritDoc EditingOptions.mathModeSpace
   */
  get mathModeSpace(): string {
    return this._getOption('mathModeSpace');
  }
  set mathModeSpace(value: string) {
    this._setOptions({ mathModeSpace: value });
  }

  /** @category Customization
   * @inheritDoc EditingOptions.placeholderSymbol
   */
  get placeholderSymbol(): string {
    return this._getOption('placeholderSymbol');
  }
  set placeholderSymbol(value: string) {
    this._setOptions({ placeholderSymbol: value });
  }

  /** @category Customization
   * @inheritDoc EditingOptions.popoverPolicy
   */
  get popoverPolicy(): 'auto' | 'off' {
    return this._getOption('popoverPolicy');
  }
  set popoverPolicy(value: 'auto' | 'off') {
    this._setOptions({ popoverPolicy: value });
  }

  /**
   * @category Customization
   * @inheritDoc EditingOptions.environmentPopoverPolicy
   */
  get environmentPopoverPolicy(): 'auto' | 'off' | 'on' {
    return this._getOption('environmentPopoverPolicy');
  }
  set environmentPopoverPolicy(value: 'auto' | 'off' | 'on') {
    this._setOptions({ environmentPopoverPolicy: value });
  }

  /**
   * @category Customization
   */

  get menuItems(): readonly MenuItem[] {
    if (this._mathfield)
      return this._mathfield.menu._menuItems.map((x) => x.menuItem) ?? [];

    return gDeferredState.get(this)?.menuItems ?? [];
  }
  set menuItems(menuItems: Readonly<MenuItem[]>) {
    if (this._mathfield) {
      const btn =
        this._mathfield.element?.querySelector<HTMLElement>(
          '[part=menu-toggle]'
        );
      if (btn) btn.style.display = menuItems.length === 0 ? 'none' : '';
      this._mathfield.menu.menuItems = menuItems;
    }

    if (gDeferredState.has(this)) {
      gDeferredState.set(this, {
        ...gDeferredState.get(this)!,
        menuItems,
      });
    } else {
      gDeferredState.set(this, {
        value: undefined,
        selection: { ranges: [[0, 0]] },
        options: getOptionsFromAttributes(this),
        menuItems,
      });
    }
  }

  /**
   * @category Customization
   * @category Virtual Keyboard
   * @inheritDoc EditingOptions.mathVirtualKeyboardPolicy
   */
  get mathVirtualKeyboardPolicy(): VirtualKeyboardPolicy {
    return this._getOption('mathVirtualKeyboardPolicy');
  }
  set mathVirtualKeyboardPolicy(value: VirtualKeyboardPolicy) {
    this._setOptions({ mathVirtualKeyboardPolicy: value });
  }

  /** @category Customization
   * @inheritDoc EditingOptions.inlineShortcuts
   */
  get inlineShortcuts(): Readonly<InlineShortcutDefinitions> {
    return this._getOption('inlineShortcuts');
  }
  set inlineShortcuts(value: InlineShortcutDefinitions) {
    this._setOptions({ inlineShortcuts: value });
  }

  /** @category Customization
   * @inheritDoc EditingOptions.inlineShortcutTimeout
   */
  get inlineShortcutTimeout(): number {
    return this._getOption('inlineShortcutTimeout');
  }
  set inlineShortcutTimeout(value: number) {
    this._setOptions({ inlineShortcutTimeout: value });
  }

  /** @category Customization
   * @inheritDoc EditingOptions.keybindings
   */
  get keybindings(): readonly Keybinding[] {
    return this._getOption('keybindings');
  }
  set keybindings(value: readonly Keybinding[]) {
    this._setOptions({ keybindings: value });
  }

  /** @category Hooks
   * @inheritDoc _MathfieldHooks.onInlineShortcut
   */
  get onInlineShortcut(): (sender: Mathfield, symbol: string) => string {
    return this._getOption('onInlineShortcut');
  }
  set onInlineShortcut(value: (sender: Mathfield, symbol: string) => string) {
    this._setOptions({ onInlineShortcut: value });
  }

  /** @category Hooks
   * @inheritDoc _MathfieldHooks.onScrollIntoView
   */
  get onScrollIntoView(): ((sender: Mathfield) => void) | null {
    return this._getOption('onScrollIntoView');
  }
  set onScrollIntoView(value: ((sender: Mathfield) => void) | null) {
    this._setOptions({ onScrollIntoView: value });
  }

  /** @category Hooks
   * @inheritDoc _MathfieldHooks.onExport
   */
  get onExport(): (from: Mathfield, latex: string, range: Range) => string {
    return this._getOption('onExport');
  }
  set onExport(
    value: (from: Mathfield, latex: string, range: Range) => string
  ) {
    this._setOptions({ onExport: value });
  }

  get readOnly(): boolean {
    return this._getOption('readOnly');
  }
  set readOnly(value: boolean) {
    this._setOptions({ readOnly: value });
  }

  get isSelectionEditable(): boolean {
    return this._mathfield?.isSelectionEditable ?? false;
  }

  /** @category Prompts */
  setPromptState(
    id: string,
    state: 'correct' | 'incorrect' | 'undefined' | undefined,
    locked?: boolean
  ): void {
    this._mathfield?.setPromptState(id, state, locked);
  }
  getPromptState(id: string): ['correct' | 'incorrect' | undefined, boolean] {
    return this._mathfield?.getPromptState(id) ?? [undefined, true];
  }

  /** @category Virtual Keyboard */
  get virtualKeyboardTargetOrigin(): string {
    return this._getOption('virtualKeyboardTargetOrigin');
  }
  set virtualKeyboardTargetOrigin(value: string) {
    this._setOptions({ virtualKeyboardTargetOrigin: value });
  }

  /**
   * An array of ranges representing the selection.
   *
   * It is guaranteed there will be at least one element. If a discontinuous
   * selection is present, the result will include more than one element.
   *
   * @category Selection
   *
   */
  get selection(): Readonly<Selection> {
    if (this._mathfield) return this._mathfield.model.selection;

    if (gDeferredState.has(this)) return gDeferredState.get(this)!.selection;

    return { ranges: [[0, 0]], direction: 'forward' };
  }

  /**
   *
   * @category Selection
   */
  set selection(sel: Selection | Offset) {
    if (typeof sel === 'number') sel = { ranges: [[sel, sel]] };

    if (this._mathfield) {
      this._mathfield.model.selection = sel;
      requestUpdate(this._mathfield);
      return;
    }

    if (gDeferredState.has(this)) {
      gDeferredState.set(this, {
        ...gDeferredState.get(this)!,
        selection: sel,
      });
      return;
    }

    gDeferredState.set(this, {
      value: undefined,
      selection: sel,
      options: getOptionsFromAttributes(this),
      menuItems: undefined,
    });
  }

  /**
   * @category Selection
   */

  get selectionIsCollapsed(): boolean {
    const selection = this.selection;
    return (
      selection.ranges.length === 1 &&
      selection.ranges[0][0] === selection.ranges[0][1]
    );
  }

  /**
   * The position of the caret/insertion point, from 0 to `lastOffset`.
   *
   * @category Selection
   *
   */
  get position(): Offset {
    if (this._mathfield) return this._mathfield.model.position;

    if (gDeferredState.has(this))
      return gDeferredState.get(this)!.selection.ranges[0][0];

    return 0;
  }

  /**
   * @category Selection
   */
  set position(offset: Offset) {
    if (this._mathfield) {
      this._mathfield.model.position = offset;
      requestUpdate(this._mathfield);
    }

    if (gDeferredState.has(this)) {
      gDeferredState.set(this, {
        ...gDeferredState.get(this)!,
        selection: { ranges: [[offset, offset]] },
      });
      return;
    }

    gDeferredState.set(this, {
      value: undefined,
      selection: { ranges: [[offset, offset]] },
      options: getOptionsFromAttributes(this),
      menuItems: undefined,
    });
  }

  /**
   * The depth of an offset represent the depth in the expression tree.
   * @category Selection
   */
  getOffsetDepth(offset: Offset): number {
    if (!this._mathfield) return 0;
    return (this._mathfield.model.at(offset)?.treeDepth ?? 2) - 2;
  }

  /**
   * The last valid offset.
   * @category Selection
   */
  get lastOffset(): Offset {
    return this._mathfield?.model.lastOffset ?? -1;
  }
}

function toCamelCase(s: string): string {
  return s.replace(/[^a-zA-Z\d]+(.)/g, (_m, c) => c.toUpperCase());
}

// Function toKebabCase(s: string): string {
//     return s
//         .match(
//             /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
//         )
//         .map((x: string) => x.toLowerCase())
//         .join('-');
// }

function getOptionsFromAttributes(
  mfe: MathfieldElement
): Partial<MathfieldOptions> {
  const result: Partial<MathfieldOptions> = { readOnly: false };
  const attribs = MathfieldElement.optionsAttributes;
  Object.keys(attribs).forEach((x) => {
    if (mfe.hasAttribute(x)) {
      const value = mfe.getAttribute(x);

      if (x === 'placeholder') result.contentPlaceholder = value ?? '';
      else if (attribs[x] === 'boolean') result[toCamelCase(x)] = true;
      else if (attribs[x] === 'on/off') {
        if (value === 'on') result[toCamelCase(x)] = true;
        else if (value === 'off') result[toCamelCase(x)] = false;
        else result[toCamelCase(x)] = undefined;
      } else if (attribs[x] === 'number')
        result[toCamelCase(x)] = Number.parseFloat(value ?? '0');
      else result[toCamelCase(x)] = value;
    }
    // else if (attribs[x] === 'boolean') result[toCamelCase(x)] = false;
  });
  return result;
}

function isElementInternalsSupported(): boolean {
  if (!('ElementInternals' in window) || !HTMLElement.prototype.attachInternals)
    return false;
  if (!('role' in window.ElementInternals.prototype)) return false;
  return true;
}

export default MathfieldElement;

declare global {
  interface Window {
    MathfieldElement: typeof MathfieldElement;
  }
}

if (isBrowser() && !window.customElements?.get('math-field')) {
  // The `window[Symbol.for('io.cortexjs.mathlive')]` global is used  to coordinate between mathfield
  // instances that may have been instantiated by different versions of the
  // library
  window[Symbol.for('io.cortexjs.mathlive')] ??= {};
  const global = window[Symbol.for('io.cortexjs.mathlive')];
  global.version = '{{SDK_VERSION}}';

  globalThis.MathfieldElement = MathfieldElement;
  window.customElements?.define('math-field', MathfieldElement);
}
