/* 0.56.0 */import { MathfieldOptions } from './options';
import { Selector } from './commands';
import { InsertOptions, Mathfield, OutputFormat, Range } from './mathfield';
import { MathfieldErrorCode, ParseMode, ParserErrorCode, Style } from './core';
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
export declare type MathErrorEvent = {
    code: ParserErrorCode | MathfieldErrorCode;
    arg?: string;
    latex?: string;
    before?: string;
    after?: string;
};
export declare type KeystrokeEvent = {
    keystroke: string;
    event: KeyboardEvent;
};
/**
 * This event signals that the mathfield has lost focus through keyboard
 * navigation with arrow keys or the tab key.
 *
 * The event `detail.direction` property indicates the direction the cursor
 * was moving which can be useful to decide which element to focus next.
 */
export declare type FocusOutEvent = {
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
/**
 * The `MathfieldElement` class provides special properties and
 * methods to control the display and behavior of `<math-field>`
 * elements.
 *
 *
 * ### Attributes
 *
 * An attribute is a key-value pair set as part of the tag, for example in
 * `<math-field locale="fr"></math-field>`, `locale` is an attribute.
 *
 * The supported attributes are listed in the table below with their correspnding
 * property. The property can be changed either directly on the
 * `MathfieldElement` object, or using `setOptions()` when it is prefixed with
 * `options.`, for example
 * ```
 *  getElementById('mf').value = '\\sin x';
 *  getElementById('mf').setOptions({horizontalSpacingScale: 1.1});
 * ```
 *
 * Most properties are reflected: changing the attribute will also change the
 * property and vice versa) except for `value` whose attribute value is not
 * updated.
 *
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
 * | Attribute | Property |
 * |:---|:---|
 * | `disabled` | `disabled` |
 * | `default-mode` | `options.defaultMode` |
 * | `fonts-directory` | `options.fontsDirectory` |
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
 * | `virtual-keyboard-layout` | `options.keyboardLayout` |
 * | `virtual-keyboard-mode` | `options.keyboardMode` |
 * | `virtual-keyboard-theme` | `options.keyboardTheme` |
 * | `virtual-keyboards` | `options.keyboards` |
 *
 *  See {@see config} for more details about these options.
 *
 * ### Events
 *
 * Listen to these events by using `addEventListener()`. For events with additional
 * arguments, the arguments are availble in `event.detail`.
 *
 * | Event Name | Event Arguments | Description |
 * |:---|:---|:---|
 * | `blur` | `(): void ` | The mathfield is losing focus |
 * | `change` | `(): void ` | The value of the mathfield has changed |
 * | `math-error` | `ErrorListener<ParserErrorCode | MathfieldErrorCode>` | A parsing or configuration error happened |
 * | `focus` | `(): void` | The mathfield is gaining focus |
 * | `keystroke` | `(keystroke: string, event: KeyboardEvent): boolean` | The user typed a keystroke with a physical keyboard |
 * | `mode-change` | `(): void` | The mode of the mathfield has changed |
 * | `focus-out` | `(direction: 'forward' | 'backward' | 'upward' | 'downward'): boolean` | The user is navigating out of the mathfield, typically using the keyboard |
 * | `read-aloud-status-change` | `(): void` | The status of a read aloud operation has changed |
 * | `selection-change` | `(): void` | The selection of the mathfield has changed |
 * | `undo-state-change` | `(): void` | The state of the undo stack has changed |
 * | `virtual-keyboard-toggle` | `(): void` | The visibility of the virtual keyboard has changed |
 *
 */
export declare class MathfieldElement extends HTMLElement implements Mathfield {
    #private;
    /**
     * Private lifecycle hooks
     * @internal
     */
    static get optionsAttributes(): {
        [attribute: string]: 'number' | 'boolean' | 'string';
    };
    /**
     * Custom elements lifecycle hooks
     * @internal
     */
    static get observedAttributes(): string[];
    /**
     * A new mathfield can be created using
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
    // Attach the element
    document.body.appendChild(mfe);
    * ```
    */
    constructor(options?: Partial<MathfieldOptions>);
    get mode(): ParseMode;
    set mode(value: ParseMode);
    getOptions<K extends keyof MathfieldOptions>(keys: K[]): Pick<MathfieldOptions, K>;
    getOptions(): MathfieldOptions;
    getOption<K extends keyof MathfieldOptions>(key: K): MathfieldOptions[K];
    setOptions(options: Partial<MathfieldOptions>): void;
    /**
     * {@inheritDoc Mathfield.executeCommand}
     */
    executeCommand(command: Selector | [Selector, ...any[]]): boolean;
    getValue(format?: OutputFormat): string;
    setValue(value?: string, options?: InsertOptions): void;
    hasFocus(): boolean;
    focus(): void;
    blur(): void;
    select(): void;
    insert(s: string, options?: InsertOptions): boolean;
    applyStyle(style: Style): void;
    getCaretPosition(): {
        x: number;
        y: number;
    };
    setCaretPosition(x: number, y: number): boolean;
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
    set disabled(value: boolean);
    get disabled(): boolean;
    set value(value: string);
    /**
     * The content of the mathfield as a Latex expression.
     * ```
     * document.querySelector('mf').value = '\\frac{1}{\\pi}'
     * ```
     */
    get value(): string;
    /**
     * A range representing the selection.
     *
     */
    get selection(): Range[];
    /**
     * Change the selection
     *
     */
    set selection(value: Range[]);
    /**
     * Read the position of the caret
     *
     */
    get position(): number;
    /**
     * Change the position of the caret
     *
     */
    set position(value: number);
    get lastPosition(): number;
}
export default MathfieldElement;
declare global {
    /** @internal */
    interface Window {
        MathfieldElement: typeof MathfieldElement;
    }
}
