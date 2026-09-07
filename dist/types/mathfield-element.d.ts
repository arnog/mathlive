/* 0.110.0 */import type { Selector } from './commands';
import type { LatexSyntaxError, MacroDictionary, Offset, ParseMode, Registers, Style, Selection, Range, OutputFormat, ElementInfo, InsertOptions } from './core-types';
import type { InsertStyleHook, Mathfield } from './mathfield';
import type { InlineShortcutDefinitions, Keybinding, MathfieldOptions } from './options';
import type { MenuItem } from './ui-menu-types';
import { KeyboardModifiers } from './ui-events-types';
/**
 *  **Event re-targeting**
 *
 *  Some events bubble up through the DOM tree, so that they are detectable by
 *   any element on the page.
 *
 * Bubbling events fired from within shadow DOM are re-targeted so that, to any
 *  listener external to your component, they appear to come from your
 *  component itself.
 *
 *  **Custom Event Bubbling**
 *
 *  By default, a bubbling custom event fired inside shadow DOM will stop
 *  bubbling when it reaches the shadow root.
 *
 *  To make a custom event pass through shadow DOM boundaries, you must set
 *  both the `composed` and `bubbles` flags to true.
 *
 * The `move-out` event signals that the user pressed an **arrow** key or
 * **tab** key but there was no navigation possible inside the mathfield.
 *
 * This event provides an opportunity to handle this situation, for example
 * by focusing an element adjacent to the mathfield.
 *
 * If the event is canceled (i.e. `evt.preventDefault()` is called inside your
 * event handler), the default behavior is to play a "plonk" sound.
 *
 * @category Mathfield
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
        'mode-change': CustomEvent;
        'mount': Event;
        'unmount': Event;
        'move-out': CustomEvent<MoveOutEvent>;
        'read-aloud-status-change': Event;
        'selection-change': Event;
        'undo-state-change': CustomEvent;
        'before-virtual-keyboard-toggle': Event;
        'virtual-keyboard-toggle': Event;
    }
}
/**
 * These attributes of the `<math-field>` element correspond to matching properties.
 *
 * @category Mathfield
 */
export interface MathfieldElementAttributes {
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
     * -   If x &gt; 0, then f(x) = sin(x)
     * -   x^2 + sin (x) when x > 0
     * -   When x&lt;0, x^&#007b;2n+1&#007d;&lt;0
     * -   Graph x^2 -x+3 =0 for 0&lt;=x&lt;=5
     * -   Divide by x-3 and then add x^2-1 to both sides
     * -   Given g(x) = 4x – 3, when does g(x)=0?
     * -   Let D be the set &#007b;(x,y)|0&lt;=x&lt;=1 and 0&lt;=y&lt;=x&#007d;
     * -   \int\_&#007b;the unit square&#007d; f(x,y) dx dy
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
/**
 *
 * The `MathfieldElement` class is a DOM element that provides a math input
 * field.
 *
 * It is a subclass of the standard
 * [`HTMLElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)
 * class and as such inherits all of its properties and methods, such
 * as `style`, `tabIndex`, `addEventListener()`, `getAttribute()`, etc...
 *
 * The `MathfieldElement` class provides additional properties and methods to
 * control the display and behavior of `<math-field>` elements.
 *
 * **To instantiate a `MathfieldElement`** use the `<math-field>` tag in HTML.
 * You can also instantiate a `MathfieldElement` programmatically using
 * `new MathfieldElement()`.
 *
 * ```javascript
 * // 1. Create a new MathfieldElement
 * const mf = new MathfieldElement();
 *
 * // 2. Attach it to the DOM
 * document.body.appendChild(mf);
 *
 * // 3. Modifying options after the mathfield has been attached to the DOM
 * mf.addEventListener("mount"), () => {
 *  mf.smartFence = true;
 * });
 * ```
 *
 * Read more about customizing the appearance and behavior of the mathfield in
 * the [Customizing the Mathfield](/mathfield/guides/customizing/) guide.
 *
 *
 * #### MathfieldElement CSS Variables
 *
 * **To customize the appearance of the mathfield**, declare the following CSS
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
 *
 * Read more about the [CSS variables](https://mathlive.io/mathfield/guides/customizing/#css-variables) available for customization.
 *
 * You can customize the appearance and zindex of the virtual keyboard panel
 * with some CSS variables associated with a selector that applies to the
 * virtual keyboard panel container.
 *
 * Read more about [customizing the virtual keyboard appearance](https://mathlive.io/mathfield/guides/virtual-keyboard/#custom-appearance)
 *
 * #### MathfieldElement CSS Parts
 *
 * In addition to the CSS variables, the mathfield exposes [CSS
 * parts that can be used to style the mathfield](https://mathlive.io/mathfield/guides/customizing/#mathfield-parts).
 *
 * For example, to hide the menu button:
 *
 * ```css
 * math-field::part(menu-toggle) {
 *    display: none;
 * }
 * ```
 *
 *
 * #### MathfieldElement Attributes
 *
 * An attribute is a key-value pair set as part of the `<math-field>` tag:
 *
 * ```html
 * <math-field letter-shape-style="tex"></math-field>
 * ```
 *
 * The supported attributes are listed in the table below with their
 * corresponding property, which can be changed directly on the
 * `MathfieldElement` object:
 *
 * ```javascript
 *  mf.value = "\\sin x";
 *  mf.letterShapeStyle = "tex";
 * ```
 *
 * The values of attributes and properties are reflected, which means you can
 * change one or the other, for example:
 *
 * ```javascript
 * mf.setAttribute("letter-shape-style",  "french");
 * console.log(mf.letterShapeStyle);
 * // Result: "french"
 *
 * mf.letterShapeStyle ="tex";
 * console.log(mf.getAttribute("letter-shape-style");
 * // Result: "tex"
 * ```
 *
 * An exception is the `value` property, which is not reflected on the `value`
 * attribute. For consistency with other DOM elements, the `value` attribute
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
 * See [more details about these attributes](#mathfieldelementattributes).
 *
 * In addition, the following DOM elements [global attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes)
 * are supported:
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
 * **To listen to these events** use `mf.addEventListener()`. For events with
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
 * | `move-out` | The user has pressed an **arrow** key or the **tab** key, but there is nowhere to go. This is an opportunity to change the focus to another element if desired. <br/> `detail: \{direction: 'forward' | 'backward' | 'upward' | 'downward'\}` **cancellable**|
 * | `keypress` | The user pressed a physical keyboard key |
 * | `mount` | The element has been attached to the DOM |
 * | `unmount` | The element is about to be removed from the DOM |
 *
 * </div>
 * @category Mathfield
 * @keywords zindex, events, attribute, attributes, property, properties, parts, variables, css, mathfield, mathfieldelement
 *
 */
export declare class MathfieldElement extends HTMLElement implements Mathfield {
    static version: string;
    /** @internal */
    static get formAssociated(): boolean;
    /**
     * Private lifecycle hooks.
     * If adding a 'boolean' attribute, add its default value to getOptionsFromAttributes
     * @internal
     */
    static get optionsAttributes(): Readonly<Record<string, 'number' | 'boolean' | 'string' | 'on/off'>>;
    /**
     * Custom elements lifecycle hooks
     * @internal
     */
    static get observedAttributes(): readonly string[];
    /**
     * A URL fragment pointing to the directory containing the fonts
     * necessary to render a formula.
     *
     * These fonts are available in the `/fonts` directory of the npm package.
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
    static get fontsDirectory(): string | null;
    static set fontsDirectory(value: string | null);
    static openUrl: (href: string) => void;
    /** @internal */
    get fontsDirectory(): never;
    /** @internal */
    set fontsDirectory(_value: unknown);
    /** @internal */
    private static _fontsDirectory;
    /**
     * A URL fragment pointing to the directory containing the optional
     * sounds used to provide feedback while typing.
     *
     * Some default sounds are available in the `/dist/sounds` directory of the SDK.
     *
     * Use `null` to prevent any sound from being loaded.
     * @category Virtual Keyboard
     */
    static get soundsDirectory(): string | null;
    static set soundsDirectory(value: string | null);
    /** @internal */
    get soundsDirectory(): never;
    /** @internal */
    set soundsDirectory(_value: unknown);
    /** @internal */
    private static _soundsDirectory;
    /**
     * When a key on the virtual keyboard is pressed, produce a short haptic
     * feedback, if the device supports it.
     * @category Virtual Keyboard
     */
    static keypressVibration: boolean;
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
     * audio file in the `soundsDirectory` directory or `null` to suppress
     * the sound.
     *
     * If the `soundsDirectory` is `null`, no sound will be played.
     *
     * @category Virtual Keyboard
     */
    static get keypressSound(): Readonly<{
        spacebar: null | string;
        return: null | string;
        delete: null | string;
        default: null | string;
    }>;
    static set keypressSound(value: null | string | {
        spacebar?: null | string;
        return?: null | string;
        delete?: null | string;
        default: null | string;
    });
    /** @internal */
    private static _keypressSound;
    /** @ignore */
    private static _plonkSound;
    /**
     * Sound played to provide feedback when a command has no effect, for example
     * when pressing the spacebar at the root level.
     *
     * The property is either:
     * - a string, the name of an audio file in the `soundsDirectory` directory
     * - `null` to turn off the sound
     *
     * If the `soundsDirectory` is `null`, no sound will be played.
     *
     */
    static get plonkSound(): string | null;
    static set plonkSound(value: string | null);
    /** @internal */
    private static audioBuffers;
    /** @internal */
    private static _audioContext;
    /** @internal */
    private static get audioContext();
    /**
     * Support for [Trusted Type](https://www.w3.org/TR/trusted-types/).
     *
     * This optional function will be called before a string of HTML is
     * injected in the DOM, allowing that string to be sanitized
     * according to a policy defined by the host.
     *
     * Consider using this option if you are displaying untrusted content. Read more about [Security Considerations](/mathfield/guides/security/)
     *
     */
    static createHTML: (html: string) => any;
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
     * @category Speech
     */
    static get speechEngine(): 'local' | 'amazon';
    static set speechEngine(value: 'local' | 'amazon');
    /** @internal */
    private static _speechEngine;
    /**
     * Sets the speed of the selected voice.
     *
     * One of `x-slow`, `slow`, `medium`, `fast`, `x-fast` or a value as a
     * percentage.
     *
     * Range is `20%` to `200%` For example `200%` to indicate a speaking rate
     * twice the default rate.
     * @category Speech
     */
    static get speechEngineRate(): string;
    static set speechEngineRate(value: string);
    /** @internal */
    private static _speechEngineRate;
    /**
     * Indicates the voice to use with the speech engine.
     *
     * This is dependent on the speech engine. For Amazon Polly, see here:
     * https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
     *
     * @category Speech
     */
    static get speechEngineVoice(): string;
    static set speechEngineVoice(value: string);
    /** @internal */
    private static _speechEngineVoice;
    /**
     * The markup syntax to use for the output of conversion to spoken text.
     *
     * Possible values are `ssml` for the SSML markup or `mac` for the macOS
     * markup, i.e. `&#91;&#91;ltr&#93;&#93;`.
     * @category Speech
     *
     */
    static get textToSpeechMarkup(): '' | 'ssml' | 'ssml_step' | 'mac';
    static set textToSpeechMarkup(value: '' | 'ssml' | 'ssml_step' | 'mac');
    /** @internal */
    private static _textToSpeechMarkup;
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
     * @category Speech
     */
    static get textToSpeechRules(): 'mathlive' | 'sre';
    static set textToSpeechRules(value: 'mathlive' | 'sre');
    /** @internal */
    private static _textToSpeechRules;
    /**
     * A set of key/value pairs that can be used to configure the speech rule
     * engine.
     *
     * Which options are available depends on the speech rule engine in use.
     * There are no options available with MathLive's built-in engine. The
     * options for the SRE engine are documented
     * {@link https://github.com/zorkow/speech-rule-engine | here}
     * @category Speech
     */
    static get textToSpeechRulesOptions(): Readonly<Record<string, string>>;
    static set textToSpeechRulesOptions(value: Record<string, string>);
    /** @internal */
    private static _textToSpeechRulesOptions;
    /** @category Speech */
    static speakHook: (text: string) => void;
    /** @category Speech */
    static readAloudHook: (element: HTMLElement, text: string) => void;
    /**
     * The locale (language + region) to use for string localization.
     *
     * If none is provided, the locale of the browser is used.
     * @category Localization
     *
     */
    static get locale(): string;
    static set locale(value: string);
    /** @internal */
    get locale(): never;
    /** @internal */
    set locale(_value: unknown);
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
    static get strings(): Readonly<Record<string, Record<string, string>>>;
    static set strings(value: Record<string, Record<string, string>>);
    /** @internal */
    get strings(): never;
    /** @internal */
    set strings(_val: unknown);
    /**
     * When switching from a tab to one that contains a mathfield that was
     * previously focused, restore the focus to the mathfield.
     *
     * This is behavior consistent with `<textarea>`, however it can be
     * disabled if it is not desired.
     *
     * **Default**: `true`
     * @category Customization
     */
    static restoreFocusWhenDocumentFocused: boolean;
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
    static get decimalSeparator(): ',' | '.';
    static set decimalSeparator(value: ',' | '.');
    /** @internal */
    get decimalSeparator(): never;
    /** @internal */
    set decimalSeparator(_val: unknown);
    /** @internal */
    private static _decimalSeparator;
    /** The template used to format numbers in scientific notation.
     * The template should include the placeholders `#1` and `#2`, which will
     * be replaced by the significand and exponent, respectively.
     *
     * The template is used when typing a number in scientific notation, e.g.
     * `1.23e4`, which will be rendered as `1.23×10^4`.
     *
     * **Default**: `'#1\\times10^{#2}'`
     *
     * Other common formats include:
     * - `'#1\\,\\mathrm{E}\\mathop{#2}'` (e.g. `1.23\,\mathrm{E}\mathop{-4}`)
     *
     * @category Localization
     */
    static set scientificNotationTemplate(value: string | null);
    static get scientificNotationTemplate(): string | null;
    /** @internal */
    private static _scientificNotationTemplate;
    /**
     * When using the keyboard to navigate a fraction, the order in which the
     * numerator and navigator are traversed:
     * - `"numerator-denominator"`: first the elements in the numerator, then
     *   the elements in the denominator.
     * - `"denominator-numerator"`: first the elements in the denominator, then
     *   the elements in the numerator. In some East-Asian cultures, fractions
     *   are read and written denominator first ("fēnzhī"). With this option
     *   the keyboard navigation follows this convention.
     *
     * **Default**: `"numerator-denominator"`
     * @category Localization
     */
    static get fractionNavigationOrder(): 'numerator-denominator' | 'denominator-numerator';
    static set fractionNavigationOrder(s: 'numerator-denominator' | 'denominator-numerator');
    /**
     * A custom compute engine instance. If none is provided, a default one is
     * used. If `null` is specified, no compute engine is used.
     */
    static get computeEngine(): any | null;
    static set computeEngine(value: any | null);
    /** @internal */
    get computeEngine(): never;
    /** @internal */
    set computeEngine(_val: unknown);
    /** @internal */
    private static _computeEngine;
    /** @internal */
    private static _isFunction;
    static get isFunction(): (command: string) => boolean;
    static set isFunction(value: (command: string) => boolean);
    static loadSound(sound: 'plonk' | 'keypress' | 'spacebar' | 'delete' | 'return'): Promise<void>;
    static playSound(name: 'keypress' | 'spacebar' | 'delete' | 'plonk' | 'return'): Promise<void>;
    /** @internal */
    private _mathfield;
    /** @internal
     * Supported by some browser: allows some (static) attributes to be set
     * without being reflected on the element instance.
     */
    private _internals;
    /** @internal */
    private _observer;
    /** @internal */
    private _style;
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
    constructor(options?: Partial<MathfieldOptions>);
    /** @category Menu */
    showMenu(_: {
        location: {
            x: number;
            y: number;
        };
        modifiers: KeyboardModifiers;
    }): boolean;
    /** @internal */
    get mathVirtualKeyboard(): never;
    /** @internal */
    onPointerDown(): void;
    /**
     * Return the content of the `\placeholder{}` command with the `placeholderId`
     * @category Prompts
     */
    getPromptValue(placeholderId: string, format?: OutputFormat): string;
    /** @category Prompts */
    setPromptValue(id: string, content: string, insertOptions: Omit<InsertOptions, 'insertionMode'>): void;
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
    getPromptRange(id: string): Range | null;
    /** Return the id of the prompts matching the filter.
     * @category Prompts
     */
    getPrompts(filter?: {
        id?: string;
        locked?: boolean;
        correctness?: 'correct' | 'incorrect' | 'undefined';
    }): string[];
    /** True if the mathfield has editable content, such as unlocked prompts */
    get hasEditableContent(): boolean;
    /** @internal */
    get form(): HTMLFormElement | null;
    /** @internal */
    get name(): string;
    /** @internal */
    get type(): string;
    get mode(): ParseMode;
    set mode(value: ParseMode);
    /**
     * Return an array of LaTeX syntax errors, if any.
     * @category Accessing and changing the content
     */
    get errors(): readonly LatexSyntaxError[];
    /** @internal */
    private _getOptions;
    /**
     *  @category Options
     *  @deprecated
     */
    private getOptions;
    /** @internal */
    private reflectAttributes;
    /**
     *  @category Options
     * @deprecated
     */
    private getOption;
    /** @internal */
    private _getOption;
    /** @internal */
    private _setOptions;
    /**
     *  @category Options
     * @deprecated
     */
    private setOptions;
    /**
     * Execute a [`command`](#commands) defined by a selector.
     * ```javascript
     * mfe.executeCommand('add-column-after');
     * mfe.executeCommand(['switch-mode', 'math']);
     * ```
     *
     * @param selector - A selector, or an array whose first element
     * is a selector, and whose subsequent elements are arguments to the selector.
     *
     * Selectors can be passed either in camelCase or kebab-case.
     *
     * ```javascript
     * // Both calls do the same thing
     * mfe.executeCommand('selectAll');
     * mfe.executeCommand('select-all');
     * ```
     * @category Commands
     */
    executeCommand(selector: Selector): boolean;
    executeCommand(selector: Selector, ...args: unknown[]): boolean;
    executeCommand(selector: [Selector, ...unknown[]]): boolean;
    /**
     * Return a textual representation of the content of the mathfield.
     *
     * @param format - The format of the result.
     *
     * **Default:** `"latex"`
     *
     * @category Accessing and changing the content
     */
    getValue(format?: OutputFormat): string;
    getValue(start: Offset, end: Offset, format?: OutputFormat): string;
    getValue(range: Range, format?: OutputFormat): string;
    getValue(selection: Selection, format?: OutputFormat): string;
    /**
     * Set the content of the mathfield to the text interpreted as a
     * LaTeX expression.
     *
     * @category Accessing and changing the content
     */
    setValue(value?: string, options?: InsertOptions): void;
    /**
     * Return true if the mathfield is currently focused (responds to keyboard
     * input).
     *
     * @category Focus
     *
     */
    hasFocus(): boolean;
    /**
     * Sets the focus to the mathfield (will respond to keyboard input).
     *
     * @category Focus
     *
     */
    focus(): void;
    /**
     * Remove the focus from the mathfield (will no longer respond to keyboard
     * input).
     *
     * @category Focus
     *
     */
    blur(): void;
    /**
     * Select the content of the mathfield.
     * @category Selection
     */
    select(): void;
    /**
     * Insert a block of text at the current insertion point.
     *
     * This method can be called explicitly or invoked as a selector with
     * `executeCommand("insert")`.
     *
     * After the insertion, the selection will be set according to the
     * `options.selectionMode`.
  
     *  @category Accessing and changing the content
     */
    insert(s: string, options?: InsertOptions): boolean;
    /**
     * Update the style (color, bold, italic, etc...) of the selection or sets
     * the style to be applied to future input.
     *
     * If there is no selection and no range is specified, the style will
     * apply to the next character typed.
     *
     * If a range is specified, the style is applied to the range, otherwise,
     * if there is a selection, the style is applied to the selection.
     *
     * If the operation is `"toggle"` and the range already has this style,
     * remove it. If the range
     * has the style partially applied (i.e. only some sections), remove it from
     * those sections, and apply it to the entire range.
     *
     * If the operation is `"set"`, the style is applied to the range,
     * whether it already has the style or not.
     *
     * The default operation is `"set"`.
     *
     *
     *
     * @category Styles
     */
    applyStyle(style: Readonly<Style>, options?: Range | {
        range?: Range;
        operation?: 'set' | 'toggle';
    }): void;
    /**
     * If there is a selection, return if all the atoms in the selection,
     * some of them or none of them match the `style` argument.
     *
     * If there is no selection, return 'all' if the current implicit style
     * (determined by a combination of the style of the previous atom and
     * the current style) matches the `style` argument, 'none' if it does not.
     *
     * @category Styles
     */
    queryStyle(style: Readonly<Style>): 'some' | 'all' | 'none';
    /** The offset closest to the location `(x, y)` in viewport coordinate.
     *
     * **`bias`**:  if `0`, the vertical midline is considered to the left or
     * right sibling. If `-1`, the left sibling is favored, if `+1`, the right
     * sibling is favored.
     *
     * @category Selection
     */
    getOffsetFromPoint(x: number, y: number, options?: {
        bias?: -1 | 0 | 1;
    }): Offset;
    getElementInfo(offset: Offset): ElementInfo | undefined;
    /**
     * Reset the undo stack
     *
     * @category Undo
     */
    resetUndo(): void;
    /**
     * Return whether there are undoable items
     * @category Undo
     */
    canUndo(): boolean;
    /**
     * Return whether there are redoable items
     * @category Undo
     */
    canRedo(): boolean;
    /** @internal */
    handleEvent(evt: Event): void;
    /**
     * Custom elements lifecycle hooks
     * @internal
     */
    connectedCallback(): void;
    /**
     * Custom elements lifecycle hooks
     * @internal
     */
    disconnectedCallback(): void;
    /**
     * Private lifecycle hooks
     * @internal
     */
    upgradeProperty(prop: string): void;
    /**
     * Custom elements lifecycle hooks
     * @internal
     */
    attributeChangedCallback(name: string, oldValue: unknown, newValue: unknown): void;
    get readonly(): boolean;
    set readonly(value: boolean);
    get disabled(): boolean;
    set disabled(value: boolean);
    /**
     * The content of the mathfield as a LaTeX expression.
     * ```js
     * document.querySelector('mf').value = '\\frac{1}{\\pi}'
     * ```
     *  @category Accessing and changing the content
     */
    get value(): string;
    set value(value: string);
    /**
     * The mode of the element when it is empty:
     * - `"math"`: equivalent to `\displaystyle` (display math mode)
     * - `"inline-math"`: equivalent to `\inlinestyle` (inline math mode)
     * - `"text"`: text mode
     * - `"free-text"`: multiline text editing with inline LaTeX
     * - `"free-math"`: multiline math editing with inline text islands
     * @category Customization
     */
    get defaultMode(): 'inline-math' | 'math' | 'text' | 'free-text' | 'free-math';
    set defaultMode(value: 'inline-math' | 'math' | 'text' | 'free-text' | 'free-math');
    /**
     * A dictionary of LaTeX macros to be used to interpret and render the content.
     *
     * For example, to add a new macro to the default macro dictionary:
     *
  ```javascript
  mf.macros = {
    ...mf.macros,
    smallfrac: '^{#1}\\!\\!/\\!_{#2}',
  };
  ```
     *
     * Note that `...mf.macros` is used to keep the existing macros and add to
     * them.
     * Otherwise, all the macros are replaced with the new definition.
     *
     * The code above will support the following notation:
     *
      ```tex
      \smallfrac{5}{16}
      ```
      @category Macros
     */
    get macros(): Readonly<MacroDictionary>;
    set macros(value: MacroDictionary);
    /**
     * @inheritDoc Registers
     * @category Registers
     */
    get registers(): Registers;
    set registers(value: Registers);
    /**
     * Map a color name as used in commands such as `\textcolor{}{}` or
     * `\colorbox{}{}` to a CSS color value.
     *
     * Use this option to override the standard mapping of colors such as "yellow"
     * or "red".
     *
     * If the name is not one you expected, return `undefined` and the default
     * color mapping will be applied.
     *
     * If a `backgroundColorMap()` function is not provided, the `colorMap()`
     * function will be used instead.
     *
     * If `colorMap()` is not provided, default color mappings are applied.
     *
     * The following color names have been optimized for a legible foreground
     * and background values, and are recommended:
     * - `red`, `orange`, `yellow`, `lime`, `green`, `teal`, `blue`, `indigo`,
     * `purple`, `magenta`, `black`, `dark-grey`, `grey`, `light-grey`, `white`
     *
     * @category Customization
     */
    get colorMap(): (name: string) => string | undefined;
    set colorMap(value: (name: string) => string | undefined);
    /** @category Customization */
    get backgroundColorMap(): (name: string) => string | undefined;
    set backgroundColorMap(value: (name: string) => string | undefined);
    /**
    * Control the letter shape style:
  
    | `letterShapeStyle` | xyz | ABC | αβɣ | ΓΔΘ |
    | ------------------ | --- | --- | --- | --- |
    | `iso`              | it  | it  | it  | it  |
    | `tex`              | it  | it  | it  | up  |
    | `french`           | it  | up  | up  | up  |
    | `upright`          | up  | up  | up  | up  |
  
    (it) = italic (up) = upright
  
    * The default letter shape style is `auto`, which indicates that `french`
    * should be used if the locale is "french", and `tex` otherwise.
    *
    * **Historical Note**
    *
    * Where do the "french" rules come from? The
    * TeX standard font, Computer Modern, is based on Monotype 155M, itself
    * based on the Porson greek font which was one of the most widely used
    * Greek fonts in english-speaking countries. This font had upright
    * capitals, but slanted lowercase. In France, the traditional font for
    * greek was Didot, which has both upright capitals and lowercase.
    *
    * As for roman uppercase, they are recommended by "Lexique des règles
    * typographiques en usage à l’Imprimerie Nationale". It should be noted
    * that this convention is not universally followed.
    *
    * @category Customization
  */
    get letterShapeStyle(): 'auto' | 'tex' | 'iso' | 'french' | 'upright';
    set letterShapeStyle(value: 'auto' | 'tex' | 'iso' | 'french' | 'upright');
    /**
     * Set the minimum relative font size for nested superscripts and fractions. The value
     * should be a number between `0` and `1`. The size is in relative `em` units relative to the
     * font size of the `math-field` element. Specifying a value of `0` allows the `math-field`
     * to use its default sizing logic.
     *
     * **Default**: `0`
     *
     * @category Customization
     */
    get minFontScale(): number;
    set minFontScale(value: number);
    /**
     * Sets the maximum number of columns for the matrix environment. The default is
     * 10 columns to match the behavior of the amsmath matrix environment.
     * **Default**: `10`
     *
     * @category Customization
     */
    get maxMatrixCols(): number;
    set maxMatrixCols(value: number);
    /**
     * When `true`, during text input the field will switch automatically between
     * 'math' and 'text' mode depending on what is typed and the context of the
     * formula. If necessary, what was previously typed will be 'fixed' to
     * account for the new info.
     *
     * For example, when typing "if x >0":
     *
     * | Type  | Interpretation |
     * |---:|:---|
     * | `i` | math mode, imaginary unit |
     * | `if` | text mode, english word "if" |
     * | `if x` | all in text mode, maybe the next word is xylophone? |
     * | `if x >` | "if" stays in text mode, but now "x >" is in math mode |
     * | `if x > 0` | "if" in text mode, "x > 0" in math mode |
     *
     * **Default**: `false`
     *
     * Manually switching mode (by typing `alt/option+=`) will temporarily turn
     * off smart mode.
     *
     *
     * **Examples**
     *
     * - `slope = rise/run`
     * - `If x > 0, then f(x) = sin(x)`
     * - `x^2 + sin (x) when x > 0`
     * - `When x&lt;0, x^{2n+1}&lt;0`
     * - `Graph x^2 -x+3 =0 for 0&lt;=x&lt;=5`
     * - `Divide by x-3 and then add x^2-1 to both sides`
     * - `Given g(x) = 4x – 3, when does g(x)=0?`
     * - `Let D be the set {(x,y)|0&lt;=x&lt;=1 and 0&lt;=y&lt;=x}`
     * - `\int\_{the unit square} f(x,y) dx dy`
     * - `For all n in NN`
     *
     * @category Customization
     */
    get smartMode(): boolean;
    set smartMode(value: boolean);
    /**
     *
     * When `true` and an open fence is entered via `typedText()` it will
     * generate a contextually appropriate markup, for example using
     * `\left...\right` if applicable.
     *
     * When `false`, the literal value of the character will be inserted instead.
     * @category Customization
     */
    get smartFence(): boolean;
    set smartFence(value: boolean);
    /**
     * When `true` and a digit is entered in an empty superscript, the cursor
     * leaps automatically out of the superscript. This makes entry of common
     * polynomials easier and faster. If entering other characters (for example
     * "n+1") the navigation out of the superscript must be done manually (by
     * using the cursor keys or the spacebar to leap to the next insertion
     * point).
     *
     * When `false`, the navigation out of the superscript must always be done
     * manually.
     * @category Customization
     */
    get smartSuperscript(): boolean;
    set smartSuperscript(value: boolean);
    /**
     * This option controls how many levels of subscript/superscript can be entered. For
     * example, if `scriptDepth` is "1", there can be one level of superscript or
     * subscript. Attempting to enter a superscript while inside a superscript will
     * be rejected. Setting a value of 0 will prevent entry of any superscript or
     * subscript (but not limits for sum, integrals, etc...)
     *
     * This can make it easier to enter equations that fit what's expected for the
     * domain where the mathfield is used.
     *
     * To control the depth of superscript and subscript independently, provide an
     * array: the first element indicate the maximum depth for subscript and the
     * second element the depth of superscript. Thus, a value of `[0, 1]` would
     * suppress the entry of subscripts, and allow one level of superscripts.
     * @category Customization
     */
    get scriptDepth(): number | [number, number];
    set scriptDepth(value: number | [number, number]);
    /**
     * If `true`, extra parentheses around a numerator or denominator are
     * removed automatically.
     *
     * **Default**: `true`
     * @category Customization
     */
    get removeExtraneousParentheses(): boolean;
    set removeExtraneousParentheses(value: boolean);
    /**
     * The LaTeX string to insert when the spacebar is pressed (on the physical or
     * virtual keyboard).
     *
     * Use `"\;"` for a thick space, `"\:"` for a medium space, `"\,"` for a
     * thin space.
     *
     * Do not use `" "` (a regular space), as whitespace is skipped by LaTeX
     * so this will do nothing.
     *
     * **Default**: `""` (empty string)
     * @category Customization
     */
    get mathModeSpace(): string;
    set mathModeSpace(value: string);
    /**
     * The symbol used to represent a placeholder in an expression.
     *
     * **Default**: `▢` `U+25A2 WHITE SQUARE WITH ROUNDED CORNERS`
     *
     * @category Customization
     */
    get placeholderSymbol(): string;
    set placeholderSymbol(value: string);
    /**
     * A LaTeX string displayed inside the mathfield when there is no content.
     * @category Customization
     */
    get placeholder(): string;
    set placeholder(value: string);
    /**
     * If `"auto"` a popover with suggestions may be displayed when a LaTeX
     * command is input.
     *
     * **Default**: `"auto"`
     *
     * @category Customization
     */
    get popoverPolicy(): 'auto' | 'off';
    set popoverPolicy(value: 'auto' | 'off');
    /**
     *
     * If `"auto"` a popover with commands to edit an environment (matrix)
     * is displayed when the virtual keyboard is displayed.
     *
     * **Default**: `"auto"`
     *
     * @category Customization
     */
    get environmentPopoverPolicy(): 'auto' | 'off' | 'on';
    set environmentPopoverPolicy(value: 'auto' | 'off' | 'on');
    /**
     * @category Menu
     */
    get menuItems(): readonly MenuItem[];
    set menuItems(menuItems: readonly MenuItem[]);
    /**
     * @category Virtual Keyboard
     */
    get mathVirtualKeyboardPolicy(): VirtualKeyboardPolicy;
    set mathVirtualKeyboardPolicy(value: VirtualKeyboardPolicy);
    /**
     * The keys of this object literal indicate the sequence of characters
     * that will trigger an inline shortcut.
     * @category Keyboard Shortcuts
     */
    get inlineShortcuts(): Readonly<InlineShortcutDefinitions>;
    set inlineShortcuts(value: InlineShortcutDefinitions);
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
     * @category Keyboard Shortcuts
     */
    get inlineShortcutTimeout(): number;
    set inlineShortcutTimeout(value: number);
    /** @category Keyboard Shortcuts   */
    get keybindings(): readonly Keybinding[];
    set keybindings(value: readonly Keybinding[]);
    /** @category Styles
     */
    get onInsertStyle(): InsertStyleHook | undefined | null;
    set onInsertStyle(value: InsertStyleHook | undefined | null);
    /**
     * A hook invoked when a string of characters that could be
     * interpreted as shortcut has been typed.
     *
     * If not a special shortcut, return the empty string `""`.
     *
     * Use this handler to detect multi character symbols, and return them wrapped appropriately,
     * for example `\mathrm{${symbol}}`.
     * @category Hooks
     */
    get onInlineShortcut(): (sender: Mathfield, symbol: string) => string;
    set onInlineShortcut(value: (sender: Mathfield, symbol: string) => string);
    /**
     * A hook invoked when scrolling the mathfield into view is necessary.
     *
     * Use when scrolling the page would not solve the problem, e.g.
     * when the mathfield is in another div that has scrollable content.
     * @category Hooks
     */
    get onScrollIntoView(): ((sender: Mathfield) => void) | null;
    set onScrollIntoView(value: ((sender: Mathfield) => void) | null);
    /**
     * This hook is invoked when the user has requested to export the content
     * of the mathfield, for example when pressing ctrl/command+C.
     *
     * This hook should return as a string what should be exported.
     *
     * The `range` argument indicates which portion of the mathfield should be
     * exported. It is not always equal to the current selection, but it can
     * be used to export a format other than LaTeX.
     *
     * By default this is:
     *
     * ```js
     *  return `\\begin{equation*}${latex}\\end{equation*}`;
     * ```
     * @category Hooks
     */
    get onExport(): (from: Mathfield, latex: string, range: Range) => string;
    set onExport(value: (from: Mathfield, latex: string, range: Range) => string);
    get readOnly(): boolean;
    set readOnly(value: boolean);
    /**
     * This is a standard DOM property
     * @internal */
    get isSelectionEditable(): boolean;
    /** @category Prompts */
    setPromptState(id: string, state: 'correct' | 'incorrect' | 'undefined' | undefined, locked?: boolean): void;
    /** @category Prompts */
    getPromptState(id: string): ['correct' | 'incorrect' | undefined, boolean];
    /**
     * An array of ranges representing the selection.
     *
     * It is guaranteed there will be at least one element. If a discontinuous
     * selection is present, the result will include more than one element.
     *
     * @category Selection
     *
     */
    get selection(): Readonly<Selection>;
    /**
     *
     * @category Selection
     */
    set selection(sel: Selection | Offset);
    /**
     * @category Selection
     */
    get selectionIsCollapsed(): boolean;
    /**
     * The position of the caret/insertion point, from 0 to `lastOffset`.
     *
     * @category Selection
     *
     */
    get position(): Offset;
    /**
     * @category Selection
     */
    set position(offset: Offset);
    /**
     * The last valid offset.
     * @category Selection
     */
    get lastOffset(): Offset;
}
export default MathfieldElement;
declare global {
    interface Window {
        MathfieldElement: typeof MathfieldElement;
    }
}
