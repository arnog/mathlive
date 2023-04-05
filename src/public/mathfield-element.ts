/// <reference types="./cortex-compute-engine.d.ts" />

import { Selector } from './commands';
import type {
  LatexSyntaxError,
  MacroDictionary,
  ParseMode,
  Registers,
  Style,
} from './core-types';
import {
  InsertOptions,
  OutputFormat,
  Offset,
  Range,
  Selection,
  Mathfield,
} from './mathfield';
import {
  InlineShortcutDefinitions,
  Keybinding,
  MathfieldOptions,
} from './options';

import {
  get as getOptions,
  getDefault as getDefaultOptions,
  update as updateOptions,
} from '../editor/options';
import { isOffset, isRange, isSelection } from '../editor/model';
import { MathfieldPrivate } from '../editor-mathfield/mathfield-private';
import { offsetFromPoint } from '../editor-mathfield/pointer-input';
import { getAtomBounds } from '../editor-mathfield/utils';
import { isBrowser } from '../common/capabilities';
import { resolveUrl } from '../common/script-url';
import { requestUpdate } from '../editor-mathfield/render';
import { reloadFonts, loadFonts } from '../core/fonts';
import { defaultSpeakHook } from '../editor/speech';
import { defaultReadAloudHook } from '../editor/speech-read-aloud';
import type { ComputeEngine } from '@cortex-js/compute-engine';

import { l10n } from '../core/l10n';

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
 * The `focus-out` event signals that the mathfield has lost focus through keyboard
 * navigation with the **tab** key.
 *
 * The event `detail.direction` property indicates if **tab**
 * (`direction === "forward"`) or **shift+tab** (`direction === "backward") was
 * pressed which can be useful to decide which element to focus next.
 *
 * If the event is canceled by calling `ev.preventDefault()`, no change of
 * focus will occur (but you can manually change the focus in your event
 * handler: this gives you an opportunity to override the default behavior
 * and selects which element should get the focus, or to prevent from a change
 * of focus altogether).
 *
 * If the event is not canceled, the default behavior will take place, which is
 * to change the focus to the next/previous focusable element.
 *
 * ```javascript
 * mfe.addEventListener('focus-out', (ev) => {
 *  console.log("Losing focus ", ev.detail.direction);
 * });
 * ```
 */
export type FocusOutEvent = {
  direction: 'forward' | 'backward';
};

/**
 * The `move-out` event signals that the user pressed an **arrow** key but
 * there was no navigation possible inside the mathfield.
 *
 * This event provides an opportunity to handle this situation, for example
 * by focusing an element adjacent to the mathfield.
 *
 * If the event is canceled (i.e. `evt.preventDefault()` is called inside your
 * event handler), the default behavior is to play a "plonk" sound.
 *
 */
export type MoveOutEvent = {
  direction: 'forward' | 'backward' | 'upward' | 'downward';
};

/**
 * -   `"auto"`: the virtual keyboard is triggered when a
 * mathfield is focused on a touch capable device.
 * -   `"manual"`: the virtual keyboard not triggered automatically
 *
 */
export type VirtualKeyboardPolicy = 'auto' | 'manual';

declare global {
  /**
   * Map the custom event names to types
   * @internal
   */
  interface HTMLElementEventMap {
    'focus-out': CustomEvent<FocusOutEvent>;
    'mode-change': Event;
    'mount': Event;
    'move-out': CustomEvent<MoveOutEvent>;
    'unmount': Event;
    'read-aloud-status-change': Event;
    'selection-change': Event;
    'undo-state-change': Event;
    'before-virtual-keyboard-toggle': Event;
    'virtual-keyboard-toggle': Event;
  }
}

//
// Note: the `position: relative` is required to fix https://github.com/arnog/mathlive/issues/971
//

const MATHFIELD_TEMPLATE = isBrowser()
  ? document.createElement('template')
  : null;
if (MATHFIELD_TEMPLATE) {
  MATHFIELD_TEMPLATE.innerHTML = `<style>
  :host { display: inline-block; background-color: field; color: fieldtext; border-width: 1px; border-style: solid; border-color: #acacac; border-radius: 2px; padding:4px; pointer-events: none;}
  :host([hidden]) { display: none; }
  :host([disabled]), :host([disabled]:focus), :host([disabled]:focus-within) { outline: none; opacity:  .5; }
  :host(:focus), :host(:focus-within) {
    outline: Highlight auto 1px;    /* For Firefox */
    outline: -webkit-focus-ring-color auto 1px;
  }
  </style>
  <span style="pointer-events:auto"></span><slot style="display:none"></slot>`;
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
  }
>();

/**
 * These attributes of the `<math-field>` element correspond to the
 * [MathfieldOptions] properties.
 */
export interface MathfieldElementAttributes {
  // Allow for global aria attributes, data- attributes, micro-data attributes
  // and global element attributes
  [key: string]: unknown;
  'default-mode': string;
  'letter-shape-style': string;
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
   * -   When x<0, x^{2n+1}<0
   * -   Graph x^2 -x+3 =0 for 0<=x<=5
   * -   Divide by x-3 and then add x^2-1 to both sides
   * -   Given g(x) = 4x – 3, when does g(x)=0?
   * -   Let D be the set {(x,y)|0<=x<=1 and 0<=y<=x}
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

  /**
   * -   `"auto"`: the virtual keyboard is triggered when a
   * mathfield is focused on a touch capable device.
   * -   `"manual"`: the virtual keyboard not triggered automatically
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
  virtualKeyboardToolbar: 'mathVirtualKeyboard.actionToolbar = ...',
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
  locale: 'MathfieldElement.locale = ...',
  strings: 'MathfieldElement.strings = ...',
  decimalSeparator: 'MathfieldElement.decimalSeparator = ...',
  fractionNavigationOrder: 'MathfieldElement.fractionNavigationOrder = ...',
};

/**
 * The `MathfieldElement` class provides special properties and
 * methods to control the display and behavior of `<math-field>`
 * elements.
 *
 * It inherits many useful properties and methods from [[`HTMLElement`]] such
 * as `style`, `tabIndex`, `addEventListener()`, `getAttribute()`,  etc...
 *
 * To create a new `MathfieldElement`:
 *
 * ```javascript
 * // 1. Create a new MathfieldElement
 * const mfe = new MathfieldElement();
 * // 2. Attach it to the DOM
 * document.body.appendChild(mfe);
 * ```
 *
 * The `MathfieldElement` constructor has an optional argument of
 * [[`MathfieldOptions`]] to configure the element. The options can also
 * be modified later:
 *
 * ```javascript
 * // Setting options during construction
 * const mfe = new MathfieldElement({ smartFence: false });
 * // Modifying options after construction
 * mfe.setOptions({ smartFence: true });
 * ```
 *
 * ### CSS Variables
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
 *   document.body.style.setProperty("--hue", "10");
 * ```
 * <div class='symbols-table' style='--first-col-width:25ex'>
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
 * Read more about [customizing the virtual keyboard appearance](https://cortexjs.io/mathlive/guides/virtual-keyboards/#custom-appearance)
 *
 * ### CSS Parts
 *
 * To style the virtual keyboard toggle, use the `virtual-keyboard-toggle` CSS
 * part. To use it, define a CSS rule with a `::part()` selector
 * for example:
 * ```css
 * math-field::part(virtual-keyboard-toggle) {
 *  color: red;
 * }
 * ```
 *
 *
 * ### Attributes
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
 * <div class='symbols-table' style='--first-col-width:32ex'>
 *
 * | Attribute | Property |
 * |:---|:---|
 * | `disabled` | `mf.disabled` |
 * | `default-mode` | `mf.defaultMode` |
 * | `letter-shape-style` | `mf.letterShapeStyle` |
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
 * See [[`MathfieldOptions`]] for more details about these options.
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
 * ### Events
 *
 * Listen to these events by using `addEventListener()`. For events with
 * additional arguments, the arguments are available in `event.detail`.
 *
 * <div class='symbols-table' style='--first-col-width:27ex'>
 *
 * | Event Name  | Description |
 * |:---|:---|
 * | `beforeinput` | The value of the mathfield is about to be modified.  |
 * | `input` | The value of the mathfield has been modified. This happens on almost every keystroke in the mathfield.  |
 * | `change` | The user has committed the value of the mathfield. This happens when the user presses **Return** or leaves the mathfield. |
 * | `selection-change` | The selection (or caret position) in the mathfield has changed |
 * | `mode-change` | The mode (`math`, `text`) of the mathfield has changed |
 * | `undo-state-change` |  The state of the undo stack has changed |
 * | `read-aloud-status-change` | The status of a read aloud operation has changed |
 * | `before-virtual-keyboard-toggle` | The visibility of the virtual keyboard panel is about to change.  |
 * | `virtual-keyboard-toggle` | The visibility of the virtual keyboard panel has changed. Listen for this event on `window.mathVirtualKeyboard` |
 * | `blur` | The mathfield is losing focus |
 * | `focus` | The mathfield is gaining focus |
 * | `focus-out` | The user is navigating out of the mathfield, typically using the **tab** key<br> `detail: {direction: 'forward' | 'backward' | 'upward' | 'downward'}` **cancellable**|
 * | `move-out` | The user has pressed an **arrow** key, but there is nowhere to go. This is an opportunity to change the focus to another element if desired. <br> `detail: {direction: 'forward' | 'backward' | 'upward' | 'downward'}` **cancellable**|
 * | `keystroke` | The user typed a keystroke with a physical keyboard <br> `detail: {keystroke: string, event: KeyboardEvent}` |
 * | `mount` | The element has been attached to the DOM |
 * | `unmount` | The element is about to be removed from the DOM |
 *
 * </div>
 *
 * @keywords zindex, events, attribute, attributes, property, properties, parts, variables, css, mathfield, mathfieldelement

 */
export class MathfieldElement extends HTMLElement implements Mathfield {
  static version = '{{SDK_VERSION}}';
  static get formAssociated(): boolean {
    return isElementInternalsSupported();
  }
  /**
   * Private lifecycle hooks
   * @internal
   */
  static get optionsAttributes(): Record<
    string,
    'number' | 'boolean' | 'string' | 'on/off'
  > {
    return {
      'default-mode': 'string',
      'letter-shape-style': 'string',
      'popover-policy': 'string',

      'math-mode-space': 'string',
      'read-only': 'boolean',
      'remove-extraneous-parentheses': 'on/off',
      'smart-fence': 'on/off',
      'smart-mode': 'on/off',
      'smart-superscript': 'on/off',
      'inline-shortcut-timeout': 'string',
      'script-depth': 'string',
      'virtual-keyboard-target-origin': 'string',
      'math-virtual-keyboard-policy': 'string',
    };
  }

  /**
   * Custom elements lifecycle hooks
   * @internal
   */
  static get observedAttributes(): string[] {
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
    this._fontsDirectory = value;
    reloadFonts();
  }
  static _fontsDirectory: string | null = './fonts';

  /**
   * A URL fragment pointing to the directory containing the optional
   * sounds used to provide feedback while typing.
   *
   * Some default sounds are available in the `/dist/sounds` directory of the SDK.
   *
   * Use `null` to prevent any sound from being loaded.
   *
   */
  static get soundsDirectory(): string | null {
    return this._soundsDirectory;
  }
  static set soundsDirectory(value: string | null) {
    this._soundsDirectory = value;
    this.audioBuffers = {};
  }
  static _soundsDirectory: string | null = './sounds';

  /**
   * When a key on the virtual keyboard is pressed, produce a short haptic
   * feedback, if the device supports it.
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
   */
  static get keypressSound(): {
    spacebar: null | string;
    return: null | string;
    delete: null | string;
    default: null | string;
  } {
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
  static _keypressSound: {
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

  /**
   * Sound played to provide feedback when a command has no effect, for example
   * when pressing the spacebar at the root level.
   *
   * The property is either:
   * - a string, the name of an audio file in the `soundsDirectory` directory
   * - null to turn off the sound
   */
  static _plonkSound: string | null = 'plonk.wav';
  static get plonkSound(): string | null {
    return this._plonkSound;
  }
  static set plonkSound(value: string | null) {
    this.audioBuffers = {};
    this._plonkSound = value;
  }

  /** @internal */
  static audioBuffers: { [key: string]: AudioBuffer } = {};
  /** @internal */
  static _audioContext: AudioContext;
  static get audioContext(): AudioContext {
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
   * {@link https://cortexjs.io/mathlive/guides/speech/ | Guide: Speech}
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
   * {@link https://cortexjs.io/mathlive/guides/speech/ | Guide: Speech}
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
  static get textToSpeechRulesOptions(): Record<string, string> {
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
   *
   */
  static get locale(): string {
    return l10n.locale;
  }
  static set locale(value: string) {
    if (value === 'auto') value = navigator.language.slice(0, 5);
    l10n.locale = value;
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
   */
  static fractionNavigationOrder:
    | 'numerator-denominator'
    | 'denominator-numerator' = 'numerator-denominator';

  /**
  * An object whose keys are a locale string, and whose values are an object of
  * string identifier to localized string.
  *
  * **Example**
  *
  ```json
  {
    "fr-CA": {
        "tooltip.undo": "Annuler",
        "tooltip.redo": "Refaire",
    }
  }
  ```
  *
  * This will override the default localized strings.
  */
  static get strings(): Record<string, Record<string, string>> {
    return l10n.strings;
  }
  static set strings(value: Record<string, Record<string, string>>) {
    l10n.merge(value);
  }

  /**
   * A custom compute engine instance. If none is provided, a default one is
   * used. If `null` is specified, no compute engine is used.
   */
  static get computeEngine(): ComputeEngine | null {
    if (this._computeEngine === undefined) {
      const ComputeEngineCtor =
        window[Symbol.for('io.cortexjs.compute-engine')]?.ComputeEngine;
      if (ComputeEngineCtor) this._computeEngine = new ComputeEngineCtor();
      else {
        console.error(
          `MathLive {{SDK_VERSION}}: The CortexJS Compute Engine library is not available.
          
          Load the library, for example with:
          
          import "https://unpkg.com/@cortex-js/compute-engine?module"`
        );
      }
      if (this._computeEngine && this.decimalSeparator === ',')
        this._computeEngine.latexOptions.decimalMarker = '{,}';
    }
    return this._computeEngine ?? null;
  }
  static set computeEngine(value: ComputeEngine | null) {
    this._computeEngine = value;
  }
  /** @internal */
  private static _computeEngine: ComputeEngine | null;

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
    const response = await fetch(
      await resolveUrl(`${soundsDirectory}/${soundFile}`)
    );
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.audioBuffers[sound] = audioBuffer;
  }

  static async playSound(
    name: 'keypress' | 'spacebar' | 'delete' | 'plonk' | 'return'
  ): Promise<void> {
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
  private _mathfield: null | MathfieldPrivate;
  // The original text content of the slot.
  // Recorded at construction to avoid reacting to it if a `slotchange` event
  // gets fired as part of the construction (different browsers behave
  // differently).
  /** @internal */
  private _slotValue: string;

  /** @internal
   * Supported by some browser: allows some (static) attributes to be set
   * without being reflected on the element instance.
   */
  private _internals: ElementInternals;

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
        } else warnings.push(`Unexpected option \`${key}\``);
      }

      if (warnings.length > 0) {
        console.group(
          `%cMathLive {{SDK_VERSION}}: %cInvalid Options`,
          'color:#12b; font-size: 1.1rem',
          'color:#db1111; font-size: 1.1rem'
        );
        console.warn(
          `Some of the options passed to \`new MathFieldElement(...)\` are invalid. 
          See https://cortexjs.io/mathlive/changelog/ for details.`
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
    this.shadowRoot!.append(MATHFIELD_TEMPLATE!.content.cloneNode(true));

    const slot =
      this.shadowRoot!.querySelector<HTMLSlotElement>('slot:not([name])');
    this._slotValue = slot!
      .assignedNodes()
      .map((x) => (x.nodeType === 3 ? x.textContent : ''))
      .join('')
      .trim();

    // Record the (optional) configuration options, as a deferred state
    if (options) this._setOptions(options);
  }

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

  getPromptValue(placeholderId: string): string {
    return this._mathfield?.getPromptValue(placeholderId) ?? '';
  }

  /** Return the id of the prompts matching the filter */
  getPrompts(filter?: {
    id?: string;
    locked?: boolean;
    correctness?: 'correct' | 'incorrect' | 'undefined';
  }): string[] {
    return this._mathfield?.getPrompts(filter) ?? [];
  }

  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: MathfieldElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void {
    return super.addEventListener(type, listener, options);
  }
  removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: MathfieldElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void {
    super.removeEventListener(type, listener, options);
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
    return this._mathfield?.mode ?? 'math';
  }

  set mode(value: ParseMode) {
    if (!this._mathfield) return;
    this._mathfield.mode = value;
  }

  /**
   * If the Compute Engine library is available, return a boxed MathJSON expression representing the value of the mathfield.
   *
   * To load the Compute Engine library, use:
   * ```js
import 'https://unpkg.com/@cortex-js/compute-engine?module';
```
   *
   */
  get expression(): any | null {
    if (!this._mathfield) return undefined;
    if (!window[Symbol.for('io.cortexjs.compute-engine')]) {
      console.error(
        `MathLive {{SDK_VERSION}}: The CortexJS Compute Engine library is not available.
        
        Load the library, for example with:
        
        import "https://unpkg.com/@cortex-js/compute-engine?module"`
      );
    }
    return this._mathfield.expression;
  }

  set expression(mathJson: Expression | any) {
    if (!this._mathfield) return;
    const latex = MathfieldElement.computeEngine?.box(mathJson).latex ?? null;
    if (latex !== null) this._mathfield.setValue(latex);

    if (!window[Symbol.for('io.cortexjs.compute-engine')]) {
      console.error(
        `MathLive {{SDK_VERSION}}: The CortexJS Compute Engine library is not available.
        
        Load the library, for example with:
        
        import "https://unpkg.com/@cortex-js/compute-engine?module"`
      );
    }
  }

  get errors(): LatexSyntaxError[] {
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
    return getOptions(
      updateOptions(getDefaultOptions(), gDeferredState.get(this)!.options),
      keys
    );
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
      See https://cortexjs.io/mathlive/changelog/ for details.`,
      'color:#12b; font-size: 1.1rem',
      'color:#db1111; font-size: 1.1rem',
      'color: inherit, font-size: 1rem'
    );

    if (this._mathfield) return getOptions(this._mathfield.options, keys);

    if (!gDeferredState.has(this)) return null;
    return getOptions(
      updateOptions(getDefaultOptions(), gDeferredState.get(this)!.options),
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
      See https://cortexjs.io/mathlive/changelog/ for details.`,
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
      See https://cortexjs.io/mathlive/changelog/ for details.`
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
   * @inheritdoc Mathfield.executeCommand
   */
  executeCommand(command: Selector | [Selector, ...any[]]): boolean {
    return this._mathfield?.executeCommand(command) ?? false;
  }

  /**
   * @inheritdoc Mathfield.getValue
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
   * @inheritdoc Mathfield.setValue
   * @category Accessing and changing the content
   */
  setValue(value?: string, options?: InsertOptions): void {
    if (this._mathfield && value !== undefined) {
      if (!options) options = { suppressChangeNotifications: true };
      this._mathfield.setValue(value, options);
      return;
    }

    if (gDeferredState.has(this)) {
      const options = gDeferredState.get(this)!.options;
      gDeferredState.set(this, {
        value,
        selection: {
          ranges: options.readOnly ? [[0, 0]] : [[0, -1]],
          direction: 'forward',
        },
        options,
      });
      return;
    }

    const attrOptions = getOptionsFromAttributes(this);
    gDeferredState.set(this, {
      value,
      selection: {
        ranges: attrOptions.readOnly ? [[0, 0]] : [[0, -1]],
        direction: 'forward',
      },
      options: attrOptions,
    });
  }

  /**
   * @inheritdoc Mathfield.hasFocus
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
   * @inheritdoc Mathfield.insert

   *  @category Accessing and changing the content
   */
  insert(s: string, options?: InsertOptions): boolean {
    return this._mathfield?.insert(s, options) ?? false;
  }

  /**
   * @inheritdoc Mathfield.applyStyle
   *
   * @category Accessing and changing the content
   */
  applyStyle(
    style: Style,
    options?: Range | { range?: Range; operation?: 'set' | 'toggle' }
  ): void {
    return this._mathfield?.applyStyle(style, options);
  }

  /**
   * The bottom location of the caret (insertion point) in viewport
   * coordinates.
   *
   * @category Selection
   */
  get caretPoint(): null | { x: number; y: number } {
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
   * (for parent components with their own undo/redo)
   */
  resetUndo(): void {
    this._mathfield?.resetUndo();
  }

  /**
   * Return whether there are undoable items
   * (for parent components with their own undo/redo)
   */
  canUndo(): boolean {
    if (!this._mathfield) return false;
    return this._mathfield.canUndo();
  }

  /**
   * Return whether there are redoable items
   * (for parent components with their own undo/redo)
   */
  canRedo(): boolean {
    if (!this._mathfield) return false;
    return this._mathfield.canRedo();
  }

  /**
   * Custom elements lifecycle hooks
   * @internal
   */
  connectedCallback(): void {
    // Load the fonts
    requestAnimationFrame(() => void loadFonts());

    this.shadowRoot!.host.addEventListener(
      'pointerdown',
      () => this.onPointerDown(),
      true
    );
    this.shadowRoot!.host.addEventListener(
      'focus',
      () => this._mathfield?.focus(),
      true
    );
    this.shadowRoot!.host.addEventListener(
      'blur',
      () => this._mathfield?.blur(),
      true
    );

    if (!isElementInternalsSupported()) {
      if (!this.hasAttribute('role')) this.setAttribute('role', 'math');
      if (!this.hasAttribute('aria-label'))
        this.setAttribute('aria-label', 'math input field');
      this.setAttribute('aria-multiline', 'false');
    }

    // NVDA on Firefox seems to require this attribute
    if (!this.hasAttribute('contenteditable'))
      this.setAttribute('contenteditable', 'true');

    // When the elements get focused (through tabbing for example)
    // focus the mathfield
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');

    const slot =
      this.shadowRoot!.querySelector<HTMLSlotElement>('slot:not([name])');

    let value = '';
    // Check if there is a `value` attribute and set the initial value
    // of the mathfield from it
    if (this.hasAttribute('value')) value = this.getAttribute('value') ?? '';
    else {
      value =
        slot
          ?.assignedNodes()
          .map((x) => (x.nodeType === 3 ? x.textContent : ''))
          .join('')
          .trim() ?? '';
    }

    this._mathfield = new MathfieldPrivate(
      this.shadowRoot!.querySelector(':host > span')!,
      {
        ...(gDeferredState.has(this)
          ? gDeferredState.get(this)!.options
          : getOptionsFromAttributes(this)),
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
      this._mathfield.model.deferNotifications(
        { content: false, selection: false },
        () => {
          const value = gDeferredState.get(this)!.value;
          if (value !== undefined) this._mathfield!.setValue(value);
          this._mathfield!.model.selection =
            gDeferredState.get(this)!.selection;
          gDeferredState.delete(this);
        }
      );
    }

    slot!.addEventListener('slotchange', (event) => {
      if (event.target !== slot) return;
      const value = slot!
        .assignedNodes()
        .map((x) => (x.nodeType === 3 ? x.textContent : ''))
        .join('')
        .trim();
      if (value === this._slotValue) return;
      if (!this._mathfield) this.value = value;
      else {
        // Don't suppress notification changes. We need to know
        // if the value has changed indirectly through slot manipulation
        this._mathfield.setValue(value);
      }
    });

    // Notify listeners that we're mounted and ready
    this.dispatchEvent(
      new Event('mount', { cancelable: false, bubbles: true, composed: true })
    );
  }

  /**
   * Custom elements lifecycle hooks
   * @internal
   */
  disconnectedCallback(): void {
    // Notify listeners that we're about to be unmounted
    this.dispatchEvent(
      new Event('unmount', { cancelable: false, bubbles: true, composed: true })
    );

    if (!this._mathfield) return;

    // Save the state (in case the element gets reconnected later)
    const options = getOptions(
      this._mathfield.options,
      Object.keys(MathfieldElement.optionsAttributes).map((x) => toCamelCase(x))
    );
    gDeferredState.set(this, {
      value: this._mathfield.getValue(),
      selection: this._mathfield.model.selection,
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
        if (this._mathfield) requestUpdate(this._mathfield);
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

  get defaultMode(): 'inline-math' | 'math' | 'text' {
    return this._getOption('defaultMode');
  }
  set defaultMode(value: 'inline-math' | 'math' | 'text') {
    this._setOptions({ defaultMode: value });
  }

  get macros(): MacroDictionary {
    return this._getOption('macros');
  }
  set macros(value: MacroDictionary) {
    this._setOptions({ macros: value });
  }

  get registers(): Registers {
    return this._getOption('registers');
  }
  set registers(value: Registers) {
    this._setOptions({ registers: value });
  }

  get colorMap(): (name: string) => string | undefined {
    return this._getOption('colorMap');
  }
  set colorMap(value: (name: string) => string | undefined) {
    this._setOptions({ colorMap: value });
  }

  get backgroundColorMap(): (name: string) => string | undefined {
    return this._getOption('backgroundColorMap');
  }
  set backgroundColorMap(value: (name: string) => string | undefined) {
    this._setOptions({ backgroundColorMap: value });
  }

  get letterShapeStyle(): 'auto' | 'tex' | 'iso' | 'french' | 'upright' {
    return this._getOption('letterShapeStyle');
  }
  set letterShapeStyle(value: 'auto' | 'tex' | 'iso' | 'french' | 'upright') {
    this._setOptions({ letterShapeStyle: value });
  }

  get smartMode(): boolean {
    return this._getOption('smartMode');
  }
  set smartMode(value: boolean) {
    this._setOptions({ smartMode: value });
  }
  get smartFence(): boolean {
    return this._getOption('smartFence');
  }
  set smartFence(value: boolean) {
    this._setOptions({ smartFence: value });
  }

  get smartSuperscript(): boolean {
    return this._getOption('smartSuperscript');
  }
  set smartSuperscript(value: boolean) {
    this._setOptions({ smartSuperscript: value });
  }

  get scriptDepth(): number | [number, number] {
    return this._getOption('scriptDepth');
  }
  set scriptDepth(value: number | [number, number]) {
    this._setOptions({ scriptDepth: value });
  }

  get removeExtraneousParentheses(): boolean {
    return this._getOption('removeExtraneousParentheses');
  }
  set removeExtraneousParentheses(value: boolean) {
    this._setOptions({ removeExtraneousParentheses: value });
  }

  get mathModeSpace(): string {
    return this._getOption('mathModeSpace');
  }
  set mathModeSpace(value: string) {
    this._setOptions({ mathModeSpace: value });
  }

  get placeholderSymbol(): string {
    return this._getOption('placeholderSymbol');
  }
  set placeholderSymbol(value: string) {
    this._setOptions({ placeholderSymbol: value });
  }

  get popoverPolicy(): 'auto' | 'off' {
    return this._getOption('popoverPolicy');
  }
  set popoverPolicy(value: 'auto' | 'off') {
    this._setOptions({ popoverPolicy: value });
  }

  get mathVirtualKeyboardPolicy(): VirtualKeyboardPolicy {
    return this._getOption('mathVirtualKeyboardPolicy');
  }
  set mathVirtualKeyboardPolicy(value: VirtualKeyboardPolicy) {
    this._setOptions({ mathVirtualKeyboardPolicy: value });
  }

  get inlineShortcuts(): InlineShortcutDefinitions {
    return this._getOption('inlineShortcuts');
  }
  set inlineShortcuts(value: InlineShortcutDefinitions) {
    this._setOptions({ inlineShortcuts: value });
  }

  get inlineShortcutTimeout(): number {
    return this._getOption('inlineShortcutTimeout');
  }
  set inlineShortcutTimeout(value: number) {
    this._setOptions({ inlineShortcutTimeout: value });
  }

  get keybindings(): Keybinding[] {
    return this._getOption('keybindings');
  }
  set keybindings(value: Keybinding[]) {
    this._setOptions({ keybindings: value });
  }

  get onInlineShortcut(): (sender: Mathfield, symbol: string) => string {
    return this._getOption('onInlineShortcut');
  }
  set onInlineShortcut(value: (sender: Mathfield, symbol: string) => string) {
    this._setOptions({ onInlineShortcut: value });
  }

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

  setPromptContent(
    id: string,
    content: string,
    insertOptions: Omit<InsertOptions, 'insertionMode'>
  ): void {
    this._mathfield?.setPromptValue(id, content, insertOptions);
  }
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
  get selection(): Selection {
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
    });
  }

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
    if (this._mathfield) this._mathfield.model.position = offset;

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
    });
  }

  /**
   * The depth of an offset represent the depth in the expression tree.
   */
  getOffsetDepth(offset: Offset): number {
    if (this._mathfield)
      return this._mathfield.model.at(offset)?.treeDepth - 2 ?? 0;

    return 0;
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
  return s.toLowerCase().replace(/[^a-zA-Z\d]+(.)/g, (m, c) => c.toUpperCase());
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
  const result = {};
  const attribs = MathfieldElement.optionsAttributes;
  Object.keys(attribs).forEach((x) => {
    if (mfe.hasAttribute(x)) {
      const value = mfe.getAttribute(x);
      if (attribs[x] === 'boolean') result[toCamelCase(x)] = true;
      else if (attribs[x] === 'on/off') {
        if (value === 'on') result[toCamelCase(x)] = true;
        else if (value === 'off') result[toCamelCase(x)] = false;
        else result[toCamelCase(x)] = undefined;
      } else if (attribs[x] === 'number')
        result[toCamelCase(x)] = Number.parseFloat(value ?? '0');
      else result[toCamelCase(x)] = value;
    } else if (attribs[x] === 'boolean') result[toCamelCase(x)] = false;
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

  window.MathfieldElement = MathfieldElement;
  window.customElements?.define('math-field', MathfieldElement);
}
