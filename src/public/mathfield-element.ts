import {
  get as getOptions,
  getDefault as getDefaultOptions,
  update as updateOptions,
} from '../editor/options';
import { MathfieldPrivate } from '../editor-mathfield/mathfield-private';
import { offsetFromPoint } from '../editor-mathfield/pointer-input';
import { isOffset, isRange, isSelection } from '../editor/model';
import { isBrowser, throwIfNotInBrowser } from '../common/capabilities';

import { Selector } from './commands';
import { LatexSyntaxError, ParseMode, Style } from './core';
import {
  Mathfield,
  InsertOptions,
  OutputFormat,
  Offset,
  Range,
  Selection,
} from './mathfield';
import { MathfieldOptions } from './options';
import { getAtomBounds } from '../editor-mathfield/utils';

export declare type Expression =
  | number
  | string
  | { [key: string]: any }
  | [Expression, ...Expression[]];

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

/**  The `placeholder-change` event signals that an editable placeholder inside
 * a read-only mathfield has been modified. The `placeholderId` property
 * indicates which placeholder was changed.
 */
export type PlaceholderChange = {
  placeholderId: string;
};

/**
 * See documentation for the `virtual-keyboard-mode` option.
 */
export type VirtualKeyboardMode = 'auto' | 'manual' | 'onfocus' | 'off';

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
    'placeholder-change': CustomEvent<PlaceholderChange>;
    'unmount': Event;
    'read-aloud-status-change': Event;
    'selection-change': Event;
    'undo-state-change': Event;
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
:host { display: block; position: relative; overflow: hidden auto;}
:host([hidden]) { display: none; }
:host([disabled]) { opacity:  .5; }
:host(:focus), :host(:focus-within) {
  outline: Highlight auto 1px;    /* For Firefox */
  outline: -webkit-focus-ring-color auto 1px;
}
:host([readonly]), :host([read-only]) { outline: none; }
</style>
<div></div><slot style="display:none"></slot>`;
}
//
// Deferred State
//
// Methods such as `setOptions()` or `getOptions()` could be called before
// the element has been connected (i.e. `mf = new MathfieldElement(); mf.setOptions()`...)
// and therefore before the mathfield instance has been created.
// So we'll stash any deferred operations on options (and value) here, and
// will apply them to the element when it gets connected to the DOM.
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
  'fonts-directory': string;
  /**
   * Scaling factor to be applied to horizontal spacing between elements of
   * the formula. A value greater than 1.0 can be used to improve the
   * legibility.
   *
   * @deprecated Use registers `\thinmuskip`, `\medmuskip` and `\thickmuskip`
   *
   */
  'horizontal-spacing-scale': string;
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
  'keypress-vibration': string;
  /**
   * When a key on the virtual keyboard is pressed, produce a short audio
   * feedback.
   *
   * The value of the properties should a string, the name of an audio file in
   * the `soundsDirectory` directory or 'none' to suppress the sound.
   */
  'keypress-sound': string;
  /**
   * Sound played to provide feedback when a command has no effect, for example
   * when pressing the spacebar at the root level.
   *
   * The property is either:
   * - a string, the name of an audio file in the `soundsDirectory` directory
   * - 'none' to turn off the sound
   */
  'plonk-sound': string;

  'letter-shape-style': string;
  /**
   * The locale (language + region) to use for string localization.
   *
   * If none is provided, the locale of the browser is used.
   *
   */
  'locale': string;
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
  'speech-engine': string;
  'speech-engine-rate': string;
  'speech-engine-voice': string;
  'text-to-speech-markup': string;
  'text-to-speech-rules': string;
  'virtual-keyboard-layout': string;
  /**
   * -   `"manual"`: pressing the virtual keyboard toggle button will show or hide
   *     the virtual keyboard. If hidden, the virtual keyboard is not shown when
   *     the field is focused until the toggle button is pressed.
   * -   `"onfocus"`: the virtual keyboard will be displayed whenever the field is
   *     focused and hidden when the field loses focus. In that case, the virtual
   *     keyboard toggle button is not displayed.
   * -   `"off"`: the virtual keyboard toggle button is not displayed, and the
   *     virtual keyboard is never triggered.
   *
   * If the setting is `"auto"`, it will default to `"onfocus"` on touch-capable
   * devices and to `"off"` otherwise.
   *
   */
  'virtual-keyboard-mode': VirtualKeyboardMode;
  /**
   * The visual theme used for the virtual keyboard.
   *
   * If empty, the theme will switch automatically based on the device it's
   * running on. The two supported themes are 'material' and 'apple' (the
   * default).
   */
  'virtual-keyboard-theme': string;
  /**
   * A space separated list of the keyboards that should be available. The
   * keyboard `"all"` is synonym with `"numeric"`, `"functions"``, `"symbols"``
   * `"roman"` and `"greek"`,
   *
   * The keyboards will be displayed in the order indicated.
   */
  'virtual-keyboards':
    | 'all'
    | 'numeric'
    | 'roman'
    | 'greek'
    | 'functions'
    | 'symbols'
    | 'latex'
    | string;
  /**
   * When `true`, use a shared virtual keyboard for all the mathfield
   * elements in the page, even across _iframes_.
   *
   * When setting this option to true, you must create the shared
   * virtual keyboard in the the parent document:
   *
   * ```javascript
   * import { makeSharedVirtualKeyboard } from 'mathlive';
   *
   *     makeSharedVirtualKeyboard({
   *         virtualKeyboardToolbar: 'none',
   *     });
   * ```
   * You should call `makeSharedVirtualKeyboard()` as early as possible.
   * `makeSharedVirtualKeyboard()` only applies to mathfield instances created
   *  after it is called.
   *
   *
   * **Default**: `false`
   */
  'use-shared-virtual-keyboard': boolean;
  /**
   * Specify the `targetOrigin` parameter for
   * [postMessage](https://developer.mozilla.org/en/docs/Web/API/Window/postMessage)
   * to send control messages from child to parent frame to remote control
   * of mathfield component.
   *
   * **Default**: `globalThis.origin`
   */
  'shared-virtual-keyboard-target-origin': string;

  /**
   * The LaTeX string to insert when the spacebar is pressed (on the physical or
   * virtual keyboard). Empty by default. Use `\;` for a thick space, `\:` for
   * a medium space, `\,` for a thin space.
   */
  'math-mode-space': string;
}

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
 * <math-field locale="fr"></math-field>
 * ```
 *
 * The supported attributes are listed in the table below with their
 * corresponding property.
 *
 * The property can be changed either directly on the
 * `MathfieldElement` object, or using `setOptions()` if it is prefixed with
 * `options.`, for example:
 *
 * ```javascript
 *  getElementById('mf').value = '\\sin x';
 *  getElementById('mf').setOptions({horizontalSpacingScale: 1.1});
 * ```
 *
 * The values of attributes and properties are reflected, which means you can change one or the
 * other, for example:
 *
 * ```javascript
 * getElementById('mf').setAttribute('virtual-keyboard-mode',  'manual');
 * console.log(getElementById('mf').getOption('virtualKeyboardMode'));
 * // Result: "manual"
 * getElementById('mf').setOptions({virtualKeyboardMode: 'onfocus');
 * console.log(getElementById('mf').getAttribute('virtual-keyboard-mode');
 * // Result: 'onfocus'
 * ```
 *
 * An exception is the `value` property, which is not reflected on the `value`
 * attribute: the `value` attribute remains at its initial value.
 *
 *
 * <div class='symbols-table' style='--first-col-width:32ex'>
 *
 * | Attribute | Property |
 * |:---|:---|
 * | `disabled` | `disabled` |
 * | `default-mode` | `options.defaultMode` |
 * | `fonts-directory` | `options.fontsDirectory` |
 * | `sounds-directory` | `options.soundsDirectory` |
 * | `horizontal-spacing-scale` | `options.horizontalSpacingScale` |
 * | `inline-shortcut-timeout` | `options.inlineShortcutTimeout` |
 * | `keypress-vibration` | `options.keypressVibration` |
 * | `keypress-sound` | `options.keypressSound` |
 * | `plonk-sound` | `options.plonkSound` |
 * | `letter-shape-style` | `options.letterShapeStyle` |
 * | `locale` | `options.locale` |
 * | `math-mode-space` | `options.mathModeSpace` |
 * | `read-only` | `options.readOnly` |
 * | `remove-extraneous-parentheses` | `options.removeExtraneousParentheses` |
 * | `smart-fence` | `options.smartFence` |
 * | `smart-mode` | `options.smartMode` |
 * | `smart-superscript` | `options.superscript` |
 * | `speech-engine` | `options.speechEngine` |
 * | `speech-engine-rate` | `options.speechEngineRate` |
 * | `speech-engine-voice` | `options.speechEngineVoice` |
 * | `text-to-speech-markup` | `options.textToSpeechMarkup` |
 * | `text-to-speech-rules` | `options.textToSpeechRules` |
 * | `value` | `value` |
 * | `virtual-keyboard-layout` | `options.virtualKeyboardLayout` |
 * | `virtual-keyboard-mode` | `options.virtualKeyboardMode` |
 * | `virtual-keyboard-theme` | `options.virtualKeyboardTheme` |
 * | `virtual-keyboards` | `options.virtualKeyboards` |
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
 * Listen to these events by using `addEventListener()`. For events with additional
 * arguments, the arguments are available in `event.detail`.
 *
 * <div class='symbols-table' style='--first-col-width:27ex'>
 *
 * | Event Name  | Description |
 * |:---|:---|
 * | `input` | The value of the mathfield has been modified. This happens on almost every keystroke in the mathfield.  |
 * | `change` | The user has committed the value of the mathfield. This happens when the user presses **Return** or leaves the mathfield. |
 * | `selection-change` | The selection (or caret position) in the mathfield has changed |
 * | `mode-change` | The mode (`math`, `text`) of the mathfield has changed |
 * | `undo-state-change` |  The state of the undo stack has changed |
 * | `read-aloud-status-change` | The status of a read aloud operation has changed |
 * | `virtual-keyboard-toggle` | The visibility of the virtual keyboard panel has changed. When using `makeSharedVirtualKeyboard()`, listen for this even on the object returned by `makeSharedVirtualKeyboard()` |
 * | `blur` | The mathfield is losing focus |
 * | `focus` | The mathfield is gaining focus |
 * | `focus-out` | The user is navigating out of the mathfield, typically using the **tab** key<br> `detail: {direction: 'forward' | 'backward' | 'upward' | 'downward'}` **cancellable**|
 * | `move-out` | The user has pressed an **arrow** key, but there is nowhere to go. This is an opportunity to change the focus to another element if desired. <br> `detail: {direction: 'forward' | 'backward' | 'upward' | 'downward'}` **cancellable**|
 * | `math-error` | A parsing or configuration error happened <br> `detail: ErrorListener<ParserErrorCode | MathfieldErrorCode>` |
 * | `keystroke` | The user typed a keystroke with a physical keyboard <br> `detail: {keystroke: string, event: KeyboardEvent}` |
 * | `mount` | The element has been attached to the DOM |
 * | `unmount` | The element is about to be removed from the DOM |
 *
 * </div>
 *
 * @keywords zindex, events, attribute, attributes, property, properties, parts, variables, css, mathfield, mathfieldelement

 */
export class MathfieldElement extends HTMLElement implements Mathfield {
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
      'fonts-directory': 'string',
      'sounds-directory': 'string',
      'horizontal-spacing-scale': 'string',
      'math-mode-space': 'string',
      'inline-shortcut-timeout': 'string',
      'keypress-vibration': 'on/off',
      'keypress-sound': 'string',
      'plonk-sound': 'string',
      'letter-shape-style': 'string',
      'locale': 'string',
      'read-only': 'boolean',
      'remove-extraneous-parentheses': 'on/off',
      'smart-fence': 'on/off',
      'smart-mode': 'on/off',
      'smart-superscript': 'on/off',
      'speech-engine': 'string',
      'speech-engine-rate': 'string',
      'speech-engine-voice': 'string',
      'text-to-speech-markup': 'string',
      'text-to-speech-rules': 'string',
      'virtual-keyboard-layout': 'string',
      'virtual-keyboard-mode': 'string',
      'virtual-keyboard-theme': 'string',
      'virtual-keyboards': 'string',
      'use-shared-virtual-keyboard': 'boolean',
      'shared-virtual-keyboard-target-origin': 'string',
    };
  }

  /**
   * Custom elements lifecycle hooks
   * @internal
   */
  static get observedAttributes(): string[] {
    return [
      ...Object.keys(MathfieldElement.optionsAttributes),
      'disabled', // Global attribute
      'readonly', // A semi-global attribute (not all standard elements support it, but some do)
      'read-only',
    ];
  }

  /** @internal */
  private _mathfield: null | MathfieldPrivate;
  // The original text content of the slot.
  // Recorded at construction to avoid reacting to it if a `slotchange` event
  // gets fired as part of the construction (different browsers behave
  // differently).
  /** @internal */
  private _slotValue: string;

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
    mfe.setAttribute('virtual-keyboard-layout', 'dvorak');

    // ... or using `setOptions()`
    mfe.setOptions({
        virtualKeyboardMode: 'manual',
    });

    // Attach the element to the DOM
    document.body.appendChild(mfe);
    ```
    */
  constructor(options?: Partial<MathfieldOptions>) {
    throwIfNotInBrowser();
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.append(MATHFIELD_TEMPLATE!.content.cloneNode(true));

    // When the elements get focused (through tabbing for example)
    // focus the mathfield

    const slot =
      this.shadowRoot!.querySelector<HTMLSlotElement>('slot:not([name])');
    this._slotValue = slot!
      .assignedNodes()
      .map((x) => (x.nodeType === 3 ? x.textContent : ''))
      .join('')
      .trim();

    // Record the (optional) configuration options, as a deferred state
    if (options) this.setOptions(options);

    this.shadowRoot!.host.addEventListener(
      'pointerdown',
      (_event) => this.onPointerDown(),
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
  }

  onPointerDown(): void {
    window.addEventListener(
      'pointerup',
      (evt) => {
        if (evt.target === this) {
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

  getPlaceholderField(placeholderId: string): Mathfield | undefined {
    return this._mathfield?.getPlaceholderField(placeholderId);
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

  get mode(): ParseMode {
    return this._mathfield?.mode ?? 'math';
  }

  set mode(value: ParseMode) {
    if (!this._mathfield) return;
    this._mathfield.mode = value;
  }

  get computeEngine(): any {
    if (!this._mathfield) return undefined;
    return this._mathfield.computeEngine;
  }
  set computeEngine(val: any | null) {
    if (!this._mathfield) return;
    this._mathfield.setOptions({ computeEngine: val });
  }

  get expression(): any | null {
    if (!this._mathfield) return undefined;
    return this._mathfield.expression;
  }

  set expression(mathJson: Expression | any) {
    if (!this._mathfield) return;
    const latex = this.computeEngine?.box(mathJson).latex ?? null;
    if (latex !== null) this._mathfield.setValue(latex);
  }

  get errors(): LatexSyntaxError[] {
    return this._mathfield?.errors ?? [];
  }

  get placeholders(): { [id: string]: MathfieldElement } {
    if (!this._mathfield) return {};
    const result = {};
    for (const [key, value] of this._mathfield.placeholders)
      result[key] = value.field;
    return result;
  }

  /**
   *  @category Options
   */
  getOptions<K extends keyof MathfieldOptions>(
    keys: K[]
  ): Pick<MathfieldOptions, K>;
  getOptions(): MathfieldOptions;
  getOptions(
    keys?: keyof MathfieldOptions | (keyof MathfieldOptions)[]
  ): unknown | Partial<MathfieldOptions> {
    if (this._mathfield) return getOptions(this._mathfield.options, keys);

    if (!gDeferredState.has(this)) return null;
    return getOptions(
      updateOptions(getDefaultOptions(), gDeferredState.get(this)!.options),
      keys
    );
  }

  /**
   *  @category Options
   */
  getOption<K extends keyof MathfieldOptions>(key: K): MathfieldOptions[K] {
    return this.getOptions([key])[key];
  }

  /**
   *  @category Options
   */
  setOptions(options: Partial<MathfieldOptions>): void {
    if (this._mathfield) {
      this._mathfield.setOptions(options);
      this._mathfield.placeholders.forEach((placeholder) => {
        placeholder.field.setOptions({
          ...options,
          readOnly: false,
        });
      });
    } else if (gDeferredState.has(this)) {
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
    reflectAttributes(this);
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

  get virtualKeyboardState(): 'hidden' | 'visible' {
    return this._mathfield?.virtualKeyboardState ?? 'hidden';
  }

  set virtualKeyboardState(value: 'hidden' | 'visible') {
    if (this._mathfield) this._mathfield.virtualKeyboardState = value;
  }

  /**
   * Sets the focus to the mathfield (will respond to keyboard input).
   *
   * @category Focus
   *
   */
  focus(): void {
    super.focus();
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
    super.blur();
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
    if (!this.hasAttribute('role')) this.setAttribute('role', 'textbox');
    this.setAttribute('dir', 'ltr');
    if (!this.hasAttribute('aria-label'))
      this.setAttribute('aria-label', 'math input field');

    // NVDA on Firefox seems to require this attribute
    this.setAttribute('contenteditable', 'true');

    this.setAttribute('aria-multiline', 'false');

    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');

    const slot =
      this.shadowRoot!.querySelector<HTMLSlotElement>('slot:not([name])');

    try {
      this._style = slot!
        .assignedElements()
        .filter((x) => x.tagName.toLowerCase() === 'style')
        .map((x) => x.textContent)
        .join('');
    } catch (error: unknown) {
      console.log(error);
    }
    // Add shadowed stylesheet if one was provided
    if (this._style) {
      const styleElement = document.createElement('style');
      styleElement.textContent = this._style;
      this.shadowRoot!.appendChild(styleElement);
    }
    // Inline options (as a JSON structure in the markup)
    try {
      const json = slot!
        .assignedElements()
        .filter(
          (x) =>
            x.tagName.toLowerCase() === 'script' &&
            (x as HTMLScriptElement).type === 'application/json'
        )
        .map((x) => x.textContent)
        .join('');
      if (json) this.setOptions(JSON.parse(json));
    } catch (error: unknown) {
      console.log(error);
    }

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
      this.shadowRoot!.querySelector(':host > div')!,
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

    // Note that `readonly` and `disabled` are "boolean attributes" as
    // per the HTML5 spec. Their value must be the empty string to indicate
    // a value of true, or they must be absent to indicate a value of false.
    // https://html.spec.whatwg.org/#boolean-attribute
    if (isReadonly) {
      this.setAttribute('readonly', '');
      this.setAttribute('disabled', '');
      this.setAttribute('aria-readonly', 'true');
    } else {
      this.removeAttribute('readonly');
      this.removeAttribute('read-only');
      this.removeAttribute('disabled');
      this.removeAttribute('aria-readonly');
    }

    this.setOptions({ readOnly: isReadonly });
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  set disabled(value: boolean) {
    const isDisabled = Boolean(value);
    if (isDisabled) this.setAttribute('disabled', '');
    else this.removeAttribute('disabled');

    this.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
    this.setOptions({ readOnly: isDisabled });
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
    return this.getOption('defaultMode');
  }
  set defaultMode(value: 'inline-math' | 'math' | 'text') {
    this.setOptions({ defaultMode: value });
  }
  get fontsDirectory(): string | null {
    return this.getOption('fontsDirectory');
  }
  set fontsDirectory(value: string | null) {
    this.setOptions({ fontsDirectory: value });
  }
  get mathModeSpace(): string {
    return this.getOption('mathModeSpace');
  }
  set mathModeSpace(value: string) {
    this.setOptions({ mathModeSpace: value });
  }
  get inlineShortcutTimeout(): number {
    return this.getOption('inlineShortcutTimeout');
  }
  set inlineShortcutTimeout(value: number) {
    this.setOptions({ inlineShortcutTimeout: value });
  }
  get keypressVibration(): boolean {
    return this.getOption('keypressVibration');
  }
  set keypressVibration(value: boolean) {
    this.setOptions({ keypressVibration: value });
  }
  get keypressSound():
    | string
    | null
    | {
        spacebar?: null | string;
        return?: null | string;
        delete?: null | string;
        default: null | string;
      } {
    return this.getOption('keypressSound');
  }
  set keypressSound(
    value:
      | string
      | null
      | {
          spacebar?: null | string;
          return?: null | string;
          delete?: null | string;
          default: null | string;
        }
  ) {
    this.setOptions({ keypressSound: value });
  }
  get plonkSound(): string | null {
    return this.getOption('plonkSound') ?? null;
  }
  set plonkSound(value: string | null) {
    this.setOptions({ plonkSound: value });
  }
  get letterShapeStyle(): 'auto' | 'tex' | 'iso' | 'french' | 'upright' {
    return this.getOption('letterShapeStyle');
  }
  set letterShapeStyle(value: 'auto' | 'tex' | 'iso' | 'french' | 'upright') {
    this.setOptions({ letterShapeStyle: value });
  }
  get locale(): string {
    return this.getOption('locale');
  }
  set locale(value: string) {
    this.setOptions({ locale: value });
  }
  get readOnly(): boolean {
    return this.getOption('readOnly');
  }
  set readOnly(value: boolean) {
    this.setOptions({ readOnly: value });
  }
  get removeExtraneousParentheses(): boolean {
    return this.getOption('removeExtraneousParentheses');
  }
  set removeExtraneousParentheses(value: boolean) {
    this.setOptions({ removeExtraneousParentheses: value });
  }
  get smartFence(): boolean {
    return this.getOption('smartFence');
  }
  set smartFence(value: boolean) {
    this.setOptions({ smartFence: value });
  }
  get smartMode(): boolean {
    return this.getOption('smartMode');
  }
  set smartMode(value: boolean) {
    this.setOptions({ smartMode: value });
  }
  get smartSuperscript(): boolean {
    return this.getOption('smartSuperscript');
  }
  set smartSuperscript(value: boolean) {
    this.setOptions({ smartSuperscript: value });
  }

  get speechEngine(): 'local' | 'amazon' {
    return this.getOption('speechEngine');
  }
  set speechEngine(value: 'local' | 'amazon') {
    this.setOptions({ speechEngine: value });
  }
  get speechEngineRate(): string {
    return this.getOption('speechEngineRate');
  }
  set speechEngineRate(value: string) {
    this.setOptions({ speechEngineRate: value });
  }
  get speechEngineVoice(): string {
    return this.getOption('speechEngineVoice');
  }
  set speechEngineVoice(value: string) {
    this.setOptions({ speechEngineVoice: value });
  }
  get textToSpeechMarkup(): '' | 'ssml' | 'ssml_step' | 'mac' {
    return this.getOption('textToSpeechMarkup');
  }
  set textToSpeechMarkup(value: '' | 'ssml' | 'ssml_step' | 'mac') {
    this.setOptions({ textToSpeechMarkup: value });
  }
  get textToSpeechRules(): 'mathlive' | 'sre' {
    return this.getOption('textToSpeechRules');
  }
  set textToSpeechRule(value: 'mathlive' | 'sre') {
    this.setOptions({ textToSpeechRules: value });
  }

  get virtualKeyboardLayout():
    | 'auto'
    | 'qwerty'
    | 'azerty'
    | 'qwertz'
    | 'dvorak'
    | 'colemak' {
    return this.getOption('virtualKeyboardLayout');
  }
  set virtualKeyboardLayout(
    value: 'auto' | 'qwerty' | 'azerty' | 'qwertz' | 'dvorak' | 'colemak'
  ) {
    this.setOptions({ virtualKeyboardLayout: value });
  }
  get virtualKeyboardMode(): VirtualKeyboardMode {
    return this.getOption('virtualKeyboardMode');
  }
  set virtualKeyboardMode(value: VirtualKeyboardMode) {
    this.setOptions({ virtualKeyboardMode: value });
  }
  get virtualKeyboardTheme(): 'material' | 'apple' | '' {
    return this.getOption('virtualKeyboardTheme');
  }
  set virtualKeyboardTheme(value: 'material' | 'apple' | '') {
    this.setOptions({ virtualKeyboardTheme: value });
  }
  get virtualKeyboards(): string {
    return this.getOption('virtualKeyboards');
  }
  set virtualKeyboards(value: string) {
    this.setOptions({ virtualKeyboards: value });
  }
  get useSharedVirtualKeyboard(): boolean {
    return this.getOption('useSharedVirtualKeyboard');
  }
  set useSharedVirtualKeyboard(value: boolean) {
    this.setOptions({ useSharedVirtualKeyboard: value });
  }
  get sharedVirtualKeyboardTargetOrigin(): string {
    return this.getOption('sharedVirtualKeyboardTargetOrigin');
  }
  set sharedVirtualKeyboardTargetOrigin(value: string) {
    this.setOptions({ sharedVirtualKeyboardTargetOrigin: value });
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

function reflectAttributes(element: MathfieldElement) {
  const defaultOptions = getDefaultOptions();
  const options = element.getOptions();
  Object.keys(MathfieldElement.optionsAttributes).forEach((x) => {
    const prop = toCamelCase(x);
    if (MathfieldElement.optionsAttributes[x] === 'on/off') {
      if (defaultOptions[prop] !== options[prop])
        element.setAttribute(x, options[prop] ? 'on' : 'off');
      else element.removeAttribute(x);
    } else if (defaultOptions[prop] !== options[prop]) {
      if (MathfieldElement.optionsAttributes[x] === 'boolean') {
        if (options[prop]) {
          // Add attribute
          element.setAttribute(x, '');
        } else {
          // Remove attribute
          element.removeAttribute(x);
        }
      } else {
        // Set attribute (as string)
        if (
          typeof options[prop] === 'string' ||
          typeof options[prop] === 'number'
        )
          element.setAttribute(x, options[prop].toString());
      }
    }
  });
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

export default MathfieldElement;

declare global {
  /** @internal */
  interface Window {
    MathfieldElement: typeof MathfieldElement;
  }
}

if (isBrowser() && !window.customElements?.get('math-field')) {
  // The `globalThis[Symbol.for('io.cortexjs.mathlive')]` global is used  to coordinate between mathfield
  // instances that may have been instantiated by different versions of the
  // library
  globalThis[Symbol.for('io.cortexjs.mathlive')] ??= {};
  const global = globalThis[Symbol.for('io.cortexjs.mathlive')];
  global.version = '{{SDK_VERSION}}';

  window.MathfieldElement = MathfieldElement;
  window.customElements?.define('math-field', MathfieldElement);
}
