import { MathfieldOptions } from './options';
import { Selector } from './commands';
import {
  Mathfield,
  InsertOptions,
  OutputFormat,
  Offset,
  Range,
  Selection,
  FindOptions,
  ReplacementFunction,
} from './mathfield';
import { MathfieldErrorCode, ParseMode, ParserErrorCode, Style } from './core';

import {
  get as getOptions,
  getDefault as getDefaultOptions,
  update as updateOptions,
} from '../editor/options';
import { MathfieldPrivate } from '../editor-mathfield/mathfield-private';
import { isOffset, isRange, isSelection } from '../editor/model';

//
// Custom Events
//

/*
    ## Event retargeting
    Some events bubble up through the DOM tree, so that they are detectable by
     any element on the page.

    Bubbling events fired from within shadow DOM are retargeted so that, to any
    listener external to your component, they appear to come from your component itself.

    ## Custom Event Bubbling

    By default, a bubbling custom event fired inside shadow DOM will stop
    bubbling when it reaches the shadow root.

    To make a custom event pass through shadow DOM boundaries, you must set
    both the `composed` and `bubbles` flags to true.
*/

/**
 * The `math-error` custom event signals an error while parsing an expression.
 *
 * ```javascript
 * document.getElementById('mf').addEventListener('math-error', (ev) => {
 *  const err = ev.detail;
 *  console.warn(err.code + (err.arg ? ': ' + err.arg : '') +
 *         '\n%c|  ' + err.before + '%c' + err.after +
 *         '\n%c|  ' + String(' ').repeat(err.before.length) +
 *         '▲',
 *         'font-weight: bold',
 *         'font-weight: normal; color: rgba(160, 160, 160)',
 *         'font-weight: bold; color: hsl(4deg, 90%, 50%)'
 *     );
 * });
 * ```
 */
export type MathErrorEvent = {
  code: ParserErrorCode | MathfieldErrorCode;
  arg?: string;
  latex?: string;
  before?: string;
  after?: string;
};

/**
 * The `keystroke` event is fired when a keystroke is about to be procesed.
 * The event is cancellable, which wills suprress further handling of the event.
 *
 */
export type KeystrokeEvent = {
  /** A string descring the keystroke, for example `"Alt-KeyU". See [W3C UIEvents](https://www.w3.org/TR/uievents/#keys-keyvalues)
   * for more information on the format of the descriptor.
   *
   */
  keystroke: string;
  /** The native keyboard event */
  event?: KeyboardEvent;
};

/**
 * The `focus-out` event signals that the mathfield has lost focus through keyboard
 * navigation with arrow keys or the tab key.
 *
 * The event `detail.direction` property indicates the direction the cursor
 * was moving which can be useful to decide which element to focus next.
 *
 * The event is cancelable, which will prevent the field from losing focus.
 *
 * ```javascript
 * mfe.addEventListener('focus-out', (ev) => {
 *  console.log("Losing focus ", ev.detail.direction);
 * });
 * ```
 */
export type FocusOutEvent = {
  direction: 'forward' | 'backward' | 'upward' | 'downward';
};

declare global {
  /**
   * Map the custom event names to types
   * @internal
   */
  interface DocumentEventMap {
    ['math-error']: CustomEvent<MathErrorEvent>;
    ['keystroke']: CustomEvent<KeystrokeEvent>;
    ['focus-out']: CustomEvent<FocusOutEvent>;
  }
}

const MATHFIELD_TEMPLATE = document.createElement('template');
MATHFIELD_TEMPLATE.innerHTML = `<style>
:host {
    display: block;
}
:host([hidden]) {
    display: none;
}
:host([disabled]) {
    opacity:  .5;
}
:host(:focus), :host(:focus-within) {
    outline: Highlight auto 1px;    /* For Firefox */
    outline: -webkit-focus-ring-color auto 1px;
}
</style>
<div></div><slot style="display:none"></slot>`;

//
// Deferred State
//
// Methods such as `setOptions()` or `getOptions()` could be called before
// the element has been connected (i.e. `mf = new MathfieldElement(); mf.setConfig()`...)
// and therefore before the matfield instance has been created.
// So we'll stash any deferred operations on options (and value) here, and
// will apply them to the element when it gets connected to the DOM.
//
const gDeferredState = new WeakMap<
  MathfieldElement,
  {
    value: string;
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
  [key: string]: number | string | boolean | undefined;
  'default-mode': string;
  'fonts-directory': string;
  /**
   * Scaling factor to be applied to horizontal spacing between elements of
   * the formula. A value greater than 1.0 can be used to improve the
   * legibility.
   *
   */
  'horizontal-spacing-scale': string;
  'ignore-spacebar-in-math-mode': boolean;
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
  'keypress-vibration': boolean;
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
   * When `true` and an open fence is entered via `typedText()` it will
   * generate a contextually appropriate markup, for example using
   * `\left...\right` if applicable.
   *
   * When `false`, the literal value of the character will be inserted instead.
   */
  'smart-fence': boolean;
  /**
   * When true, during text input the field will switch automatically between
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
   * Smart Mode is off by default.
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
  'smart-mode': boolean;
  /**
   * When `true`, when a digit is entered in an empty superscript, the cursor
   * leaps automatically out of the superscript. This makes entry of common
   * polynomials easier and faster. If entering other characters (for example
   * "n+1") the navigation out of the superscript must be done manually (by
   * using the cursor keys or the spacebar to leap to the next insertion
   * point).
   *
   * When `false`, the navigation out of the superscript must always be done
   * manually.
   *
   */
  'smart-superscript': boolean;
  'speech-engine': string;
  'speech-engine-rate': string;
  'speech-engine-voice': string;
  'text-to-speech-markup': string;
  'text-to-speech-rules': string;
  'virtual-keyboard-layout': string;
  /**
   * -   `'manual'`: pressing the virtual keyboard toggle button will show or hide
   *     the virtual keyboard. If hidden, the virtual keyboard is not shown when
   *     the field is focused until the toggle button is pressed.
   * -   `'onfocus'`: the virtual keyboard will be displayed whenever the field is
   *     focused and hidden when the field loses focus. In that case, the virtual
   *     keyboard toggle button is not displayed.
   * -   `'off'`: the virtual keyboard toggle button is not displayed, and the
   *     virtual keyboard is never triggered.
   *
   * If the setting is empty, it will default to `'onfocus'` on touch-capable
   * devices and to `'off'` otherwise.
   *
   */
  'virtual-keyboard-mode': 'auto' | 'manual' | 'onfocus' | 'off';
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
   * keyboard `'all'` is synonym with `'numeric'`, `'functions'``, `'symbols'``
   * `'roman'` and `'greek'`,
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
   * When true, use a shared virtual keyboard for all the mathfield
   * elements in the page, even across iframes.
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
   * **Default**: `window.origin`
   */
  'shared-virtual-keyboard-target-origin': string;
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
 * const mfe = new MathfieldElement({smartFence: false});
 * // Modifying options after construction
 * mfe.setOptions({smartFence: true});
 * ```
 *
 * ### CSS Variables
 *
 * To customize the appearance of the mathfield, declare the following CSS
 * variables (custom properties) in a ruleset that applied to the mathfield.
 * ```css
 * math-field {
 *  --hue: 10       // Set the highlight color and caret to a reddish hue
 * }
 * ```
 *
 * | CSS Variable | Usage |
 * |:---|:---|
 * | `--hue` | Hue of the highlight color and the caret |
 * | `--highlight` | Color of the selection |
 * | `--highlight-inactive` | Color of the selection, when the mathfield is not focused |
 * | `--caret` | Color of the caret/insertion point |
 * | `--primary` | Primary accent color, used for example in the virtual keyboard |
 * | `--text-font-family` | The font stack used in text mode |
 * | `--keyboard-zindex` | The z-index attribute of the virtual keyboard panel |
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
 * The supported attributes are listed in the table below with their correspnding
 * property.
 *
 * The property can be changed either directly on the
 * `MathfieldElement` object, or using `setOptions()` if it is prefixed with
 * `options.`, for example
 * ```javascript
 *  getElementById('mf').value = '\\sin x';
 *  getElementById('mf').setOptions({horizontalSpacingScale: 1.1});
 * ```
 *
 * The values of attributes and properties are reflected, which means you can change one or the
 * other, for example:
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
 * | Attribute | Property |
 * |:---|:---|
 * | `disabled` | `disabled` |
 * | `default-mode` | `options.defaultMode` |
 * | `fonts-directory` | `options.fontsDirectory` |
 * | `sounds-directory` | `options.soundsDirectory` |
 * | `horizontal-spacing-scale` | `options.horizontalSpacingScale` |
 * | `ignore-spacebar-in-math-mode` | `options.ignoreSpacbarInMathMode` |
 * | `inline-shortcut-timeout` | `options.inlineShortcutTimeout` |
 * | `keypress-vibration` | `options.keypressVibration` |
 * | `letter-shape-style` | `options.letterShapeStyle` |
 * | `locale` | `options.locale` |
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
 * | `value` | value |
 * | `virtual-keyboard-layout` | `options.keyboardLayout` |
 * | `virtual-keyboard-mode` | `options.keyboardMode` |
 * | `virtual-keyboard-theme` | `options.keyboardTheme` |
 * | `virtual-keyboards` | `options.keyboards` |
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
 * arguments, the arguments are availble in `event.detail`.
 *
 * | Event Name  | Description |
 * |:---|:---|
 * | `input` | The value of the mathfield has been modified. This happens on almost every keystroke in the mathfield.  |
 * | `change` | The user has commited the value of the mathfield. This happens when the user presses **Return** or leaves the mathfield. |
 * | `selection-change` | The selection (or caret position) in the mathfield has changed |
 * | `mode-change` | The mode (`math`, `text`) of the mathfield has changed |
 * | `undo-state-change` |  The state of the undo stack has changed |
 * | `read-aloud-status-change` | The status of a read aloud operation has changed |
 * | `virtual-keyboard-toggle` | The visibility of the virtual keyboard panel has changed |
 * | `blur` | The mathfield is losing focus |
 * | `focus` | The mathfield is gaining focus |
 * | `focus-out` | The user is navigating out of the mathfield, typically using the keyboard<br> `detail: {direction: 'forward' | 'backward' | 'upward' | 'downward'}` **cancellable**|
 * | `math-error` | A parsing or configuration error happened <br> `detail: ErrorListener<ParserErrorCode | MathfieldErrorCode>` |
 * | `keystroke` | The user typed a keystroke with a physical keyboard <br> `detail: {keystroke: string, event: KeyboardEvent}` |
 * | `mount` | The element has been attached to the DOM |
 * | `unmount` | The element is about to be removed from the DOM |
 *
 */
export class MathfieldElement extends HTMLElement implements Mathfield {
  /**
   * Private lifecycle hooks
   * @internal
   */
  static get optionsAttributes(): Record<
    string,
    'number' | 'boolean' | 'string'
  > {
    return {
      'default-mode': 'string',
      'fonts-directory': 'string',
      'horizontal-spacing-scale': 'string',
      'ignore-spacebar-in-math-mode': 'boolean',
      'inline-shortcut-timeout': 'string',
      'keypress-vibration': 'boolean',
      'letter-shape-style': 'string',
      'locale': 'string',
      'read-only': 'boolean',
      'remove-extraneous-parentheses': 'boolean',
      'smart-fence': 'boolean',
      'smart-mode': 'boolean',
      'smart-superscript': 'boolean',
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
    return [...Object.keys(MathfieldElement.optionsAttributes), 'disabled'];
  }

  private _mathfield: MathfieldPrivate;

  /**
     * To create programmatically a new mahfield use:
     * ```javascript
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
    * ```
    */
  constructor(options?: Partial<MathfieldOptions>) {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(MATHFIELD_TEMPLATE.content.cloneNode(true));
    const slot = this.shadowRoot.querySelector<HTMLSlotElement>(
      'slot:not([name])'
    );

    // When the elements get focused (through tabbing for example)
    // focus the mathfield
    this.shadowRoot.host.addEventListener(
      'focus',
      (_event) => this._mathfield?.focus(),
      true
    );
    this.shadowRoot.host.addEventListener(
      'blur',
      (_event) => this._mathfield?.blur(),
      true
    );

    // Inline options (as a JSON structure in the markup)
    try {
      const json = slot
        .assignedElements()
        .filter(
          (x) =>
            x.tagName === 'SCRIPT' &&
            (x as HTMLScriptElement).type === 'application/json'
        )
        .map((x) => x.textContent)
        .join('');
      if (json) {
        this.setOptions(JSON.parse(json));
      }
    } catch (error: unknown) {
      console.log(error);
    }

    // Record the (optional) configuration options, as a deferred state
    if (options) {
      this.setOptions(options);
    }

    // Check if there is a `value` attribute and set the initial value
    // of the mathfield from it
    if (this.hasAttribute('value')) {
      this.value = this.getAttribute('value');
    } else {
      this.value =
        slot
          ?.assignedNodes()
          .map((x) => (x.nodeType === 3 ? x.textContent : ''))
          .join('')
          .trim() ?? '';
    }

    slot.addEventListener('slotchange', (event) => {
      if (event.target !== slot) return;
      const value = slot
        .assignedNodes()
        .map((x) => (x.nodeType === 3 ? x.textContent : ''))
        .join('')
        .trim();
      if (!this._mathfield) {
        this.value = value;
      } else {
        // Don't suppress notification changes. We need to know
        // if the value has changed indirectly through slot manipulation
        this._mathfield.setValue(value, {
          insertionMode: 'replaceAll',
        });
      }
    });
  }

  get mode(): ParseMode {
    return this._mathfield?.mode;
  }

  set mode(value: ParseMode) {
    if (!this._mathfield) return;
    this._mathfield.mode = value;
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
  ): any | Partial<MathfieldOptions> {
    if (this._mathfield) {
      return getOptions(this._mathfield.options, keys);
    }

    if (!gDeferredState.has(this)) return null;
    return getOptions(
      updateOptions(getDefaultOptions(), gDeferredState.get(this).options),
      keys
    );
  }

  /**
   *  @category Options
   */
  getOption<K extends keyof MathfieldOptions>(key: K): MathfieldOptions[K] {
    return (this.getOptions([key]) as unknown) as MathfieldOptions[K];
  }

  /**
   *  @category Options
   */
  setOptions(options: Partial<MathfieldOptions>): void {
    if (this._mathfield) {
      this._mathfield.setOptions(options);
    } else if (gDeferredState.has(this)) {
      gDeferredState.set(this, {
        value: gDeferredState.get(this).value,
        selection: { ranges: [[0, -1]] },
        options: {
          ...gDeferredState.get(this).options,
          ...options,
        },
      });
    } else {
      gDeferredState.set(this, {
        value: '',
        selection: { ranges: [[0, 0]] },
        options,
      });
    }

    // Reflect options to attributes
    reflectAttributes(this);
  }

  /**
   * Execute a [[`Commands`|command]] defined by a selector.
   * ```javascript
   * mfe.executeCommand('add-column-after');
   * mfe.executeCommand(['switch-mode', 'math']);
   * ```
   *
   * @param command - A selector, or an array whose first element
   * is a selector, and whose subsequent elements are arguments to the selector.
   *
   * Selectors can be passed either in camelCase or kebab-case.
   *
   * ```javascript
   * // Both calls do the same thing
   * mfe.executeCommand('selectAll');
   * mfe.executeCommand('select-all');
   * ```
   */
  executeCommand(command: Selector | [Selector, ...any[]]): boolean {
    return this._mathfield?.executeCommand(command) ?? false;
  }

  /**
   *  @category Accessing and changing the content
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
    if (this._mathfield) {
      return this._mathfield.getValue(arg1 as any, arg2 as any, arg3);
    }

    if (gDeferredState.has(this)) {
      let start: Offset;
      let end: Offset;
      let format: OutputFormat;
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

      if (format === 'latex' && start === 0 && end === -1) {
        return gDeferredState.get(this).value;
      }
    }

    return undefined;
  }

  /**
   *  @category Accessing and changing the content
   */
  setValue(value?: string, options?: InsertOptions): void {
    if (this._mathfield) {
      this._mathfield.setValue(value, options);
      return;
    }

    if (gDeferredState.has(this)) {
      gDeferredState.set(this, {
        value,
        selection: { ranges: [[0, -1]], direction: 'forward' },
        options: gDeferredState.get(this).options,
      });
      return;
    }

    gDeferredState.set(this, {
      value,
      selection: { ranges: [[0, -1]], direction: 'forward' },
      options: getOptionsFromAttributes(this),
    });
  }

  /**
   * Return true if the mathfield is currently focused (responds to keyboard
   * input).
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
    super.focus();
    // If (this._mathfield) {
    //     // Don't call this._mathfield.focus(): it checks the focus state,
    //     // but super.focus() just changed it...
    //     this._mathfield.keyboardDelegate.focus();
    //     this._mathfield.model.announce('line');
    // }
  }

  /**
   * Remove the focus from the mathfield (will no longer respond to keyboard
   * input).
   *
   * @category Focus
   *
   */
  blur(): void {
    super.blur();
    // If (this._mathfield) {
    //     // Don't call this._mathfield.focs(): it checks the focus state,
    //     // but super.blur() just changed it...
    //     this._mathfield.keyboardDelegate.blur();
    // }
  }

  /**
   * Select the content of the mathfield.
   * @category Selection
   */
  select(): void {
    this._mathfield?.select();
  }

  /**
   * Inserts a block of text at the current insertion point.
   *
   * This method can be called explicitly or invoked as a selector with
   * `executeCommand("insert")`.
   *
   * After the insertion, the selection will be set according to the
   * `options.selectionMode`.
   *
   *  @category Accessing and changing the content
   */
  insert(s: string, options?: InsertOptions): boolean {
    return this._mathfield?.insert(s, options) ?? false;
  }

  /**
   * Updates the style (color, bold, italic, etc...) of the selection or sets
   * the style to be applied to future input.
   *
   * If there is no selection and no range is specified, the style will
   * apply to the next character typed.
   *
   * If a range is specified, the style is applied to the range, otherwise,
   * if there is a selection, the style is applied to the selection.
   *
   * If the operation is 'toggle' and the range already has this style,
   * remove it. If the range
   * has the style partially applied (i.e. only some sections), remove it from
   * those sections, and apply it to the entire range.
   *
   * If the operation is 'set', the style is applied to the range,
   * whether it already has the style or not.
   *
   * The default operation is 'set'.
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
   * See also [[`setCaretPoint`]]
   * @category Selection
   */
  get caretPoint(): { x: number; y: number } {
    return this._mathfield?.getCaretPoint() ?? null;
  }

  set caretPoint(point: { x: number; y: number }) {
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

  /**
   *  Return an array of ranges matching the argument.
   *
   * An array is always returned, but it has no element if there are no
   * matching items.
   */
  find(pattern: string | RegExp, options?: FindOptions): Range[] {
    return this._mathfield?.find(pattern, options) ?? [];
  }

  /**
   * Replace the pattern items matching the **pattern** with the
   * **replacement** value.
   *
   * If **replacement** is a function, the function is called
   * for each match and the function return value will be
   * used as the replacement.
   */
  replace(
    pattern: string | RegExp,
    replacement: string | ReplacementFunction,
    options?: FindOptions
  ): void {
    this._mathfield?.replace(pattern, replacement, options);
  }

  /**
   * Custom elements lifecycle hooks
   * @internal
   */
  connectedCallback(): void {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'textbox');
    // This.setAttribute('aria-multiline', 'false');
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');

    this._mathfield = new MathfieldPrivate(
      this.shadowRoot.querySelector(':host > div'),
      {
        onBlur: () => {
          this.dispatchEvent(
            new Event('blur', {
              cancelable: false,
              bubbles: false, // DOM 'focus' and 'blur' don't bubble
            })
          );
        },
        onContentDidChange: () => {
          this.dispatchEvent(
            new Event('input', {
              cancelable: false,
              bubbles: true,
            })
          );
        },
        onError: (err: {
          code: ParserErrorCode | MathfieldErrorCode;
          arg?: string;
          latex?: string;
          before?: string;
          after?: string;
        }) => {
          this.dispatchEvent(
            new CustomEvent<MathErrorEvent>('math-error', {
              detail: {
                code: err.code,
                arg: err.arg,
                latex: err.latex,
                before: err.before,
                after: err.after,
              },
              cancelable: false,
              bubbles: true,
            })
          );
        },
        onFocus: () => {
          this.dispatchEvent(
            new Event('focus', {
              cancelable: false,
              bubbles: false, // DOM 'focus' and 'blur' don't bubble
            })
          );
        },
        onKeystroke: (
          _sender: Mathfield,
          keystroke: string,
          ev: KeyboardEvent
        ): boolean => {
          return this.dispatchEvent(
            new CustomEvent<KeystrokeEvent>('keystroke', {
              detail: {
                keystroke,
                event: ev,
              },
              cancelable: true,
              bubbles: true,
            })
          );
        },
        onModeChange: (_sender: Mathfield, _mode: ParseMode) => {
          this.dispatchEvent(
            new Event('mode-change', {
              cancelable: false,
              bubbles: true,
            })
          );
        },
        onCommit: (_sender: Mathfield) => {
          // Match the DOM event sent by `<input>`, `<textarea>`, etc...
          // Sent when the [Return] or [Enter] key is pressed, or on
          // focus loss if the content has changed.
          this.dispatchEvent(
            new Event('change', {
              cancelable: false,
              bubbles: true,
            })
          );
        },
        onMoveOutOf: (
          _sender: Mathfield,
          direction: 'forward' | 'backward' | 'upward' | 'downward'
        ): boolean => {
          return this.dispatchEvent(
            new CustomEvent<FocusOutEvent>('focus-out', {
              detail: { direction },
              cancelable: true,
              bubbles: true,
            })
          );
        },
        onTabOutOf: (
          _sender: Mathfield,
          direction: 'forward' | 'backward'
        ): boolean => {
          return this.dispatchEvent(
            new CustomEvent<FocusOutEvent>('focus-out', {
              detail: { direction },
              cancelable: true,
              bubbles: true,
            })
          );
        },
        onReadAloudStatus: () => {
          this.dispatchEvent(
            new Event('read-aloud-status-change', {
              cancelable: false,
              bubbles: true,
            })
          );
        },
        onSelectionDidChange: () => {
          this.dispatchEvent(
            new Event('selection-change', {
              cancelable: false,
              bubbles: true,
            })
          );
        },
        onUndoStateDidChange: () => {
          this.dispatchEvent(
            new Event('undo-state-change', {
              cancelable: false,
              bubbles: true,
            })
          );
        },
        ...getOptionsFromAttributes(this),
        ...(gDeferredState.has(this) ? gDeferredState.get(this).options : {}),
      }
    );

    this.upgradeProperty('disabled');

    // The mathfield creation could have failed
    if (!this._mathfield || !this._mathfield.model) {
      this._mathfield = null;
      return;
    }

    // This._mathfield.field.parentElement.addEventListener(
    //     'focus',
    //     (_event) => this._mathfield.focus(),
    //     true
    // );
    // this._mathfield.field.parentElement.addEventListener(
    //     'blur',
    //     (_event) => this._mathfield.blur(),
    //     true
    // );

    if (gDeferredState.has(this)) {
      this._mathfield.model.deferNotifications(
        { content: false, selection: false },
        () => {
          this._mathfield.setValue(gDeferredState.get(this).value);
          this._mathfield.selection = gDeferredState.get(this).selection;
          gDeferredState.delete(this);
        }
      );
    }

    // Notify listeners that we're mounted and ready
    this.dispatchEvent(
      new Event('mount', {
        cancelable: false,
        bubbles: true,
      })
    );
  }

  /**
   * Custom elements lifecycle hooks
   * @internal
   */
  disconnectedCallback(): void {
    // Notify listeners that we're about to be unmounted
    this.dispatchEvent(
      new Event('unmount', {
        cancelable: false,
        bubbles: true,
      })
    );

    if (!this._mathfield) return;

    // Save the state (in case the elements get reconnected later)
    const options = {};
    Object.keys(MathfieldElement.optionsAttributes).forEach((x) => {
      options[toCamelCase(x)] = this._mathfield.getOption(
        toCamelCase(x) as any
      );
    });
    gDeferredState.set(this, {
      value: this._mathfield.getValue(),
      selection: this._mathfield.selection,
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
      default:
    }
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
   * The content of the mathfield as a Latex expression.
   * ```
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
    if (this._mathfield) {
      return this._mathfield.selection;
    }

    if (gDeferredState.has(this)) {
      return gDeferredState.get(this).selection;
    }

    return { ranges: [[0, 0]], direction: 'forward' };
  }

  /**
   *
   * @category Selection
   */
  set selection(value: Selection) {
    if (this._mathfield) {
      this._mathfield.selection = value;
    }

    if (gDeferredState.has(this)) {
      gDeferredState.set(this, {
        value: gDeferredState.get(this).value,
        selection: value,
        options: gDeferredState.get(this).options,
      });
      return;
    }

    gDeferredState.set(this, {
      value: '',
      selection: value,
      options: getOptionsFromAttributes(this),
    });
  }

  /**
   * The position of the caret/insertion point, from 0 to `lastOffset`.
   *
   * @category Selection
   *
   */
  get position(): Offset {
    return this._mathfield.model.position;
  }

  /**
   * @category Selection
   */
  set position(offset: Offset) {
    this._mathfield.model.position = offset;
  }

  /**
   * The last valid offset.
   * @category Selection
   */
  get lastOffset(): Offset {
    return this._mathfield?.lastOffset ?? -1;
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
    if (defaultOptions[prop] !== options[prop]) {
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
      if (attribs[x] === 'boolean') {
        result[toCamelCase(x)] = true;
      } else if (attribs[x] === 'number') {
        result[toCamelCase(x)] = Number.parseFloat(value);
      } else {
        result[toCamelCase(x)] = value;
      }
    } else if (attribs[x] === 'boolean') {
      result[toCamelCase(x)] = false;
    }
  });
  return result;
}

export default MathfieldElement;

declare global {
  /** @internal */
  interface Window {
    MathfieldElement: typeof MathfieldElement;
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'math-field': MathfieldElementAttributes;
    }
  }
}

if (!window.customElements?.get('math-field')) {
  window.MathfieldElement = MathfieldElement;
  window.customElements?.define('math-field', MathfieldElement);
}
