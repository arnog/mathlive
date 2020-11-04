/* 0.59.0 */import { ErrorListener, MacroDictionary, ParseMode, ParserErrorCode, MathfieldErrorCode } from './core';
import type { Mathfield } from './mathfield';
import type { Selector } from './commands';
/**
 * A keybinding associates a combination of physical keyboard keys with a
 * command.
 *
 * For example:
 *
 * ```javascript
 * {
 *      "key": "cmd+a",
 *      "command": "selectAll",
 * },
 * {
 *      "key": 'ctrl+[Digit2]',
 *      "ifMode": 'math',
 *      "command": ['insert', '\\sqrt{#0}'],
 * }
 * ```
 *
 */
export declare type Keybinding = {
    /**
     * The pressed keys that will trigger this keybinding.
     *
     * The `key` is made up of modifiers and the key itself.
     *
     * The following modifiers can be used:
     *
     *  | Platform | Modifiers |
     *  | :----- | :----- |
     *  | macOS, iOS |  `ctrl`, `shift`, `alt`, `cmd` |
     *  | Windows |  `ctrl`, `shift`, `alt`, `win` |
     *  | Linux, Android, ChromeOS |  `ctrl`, `shift`, `alt`, `meta` |
     *
     * If the `cmd` modifier is used, the keybinding will only apply on macOS.
     * If the `win` modifier is used, the keybinding will only apply to Windows.
     * If the `meta` modifier is used, the keybinding will apply to platforms
     * other than macOS or Windows.
     *
     * The `alt` key is the `option` key on Apple keyboards.
     *
     *
     * The following values for keys can be used:
     * * `a`&ndash;`z`, `0`&ndash;`9`
     * * `` ` ``, `-`, `=`, `[`, `]`, `\`, `;`, `'`, `,`, `.`, `/`
     * * `left`, `up`, `right`, `down`, `pageup`, `pagedown`, `end`, `home`
     * * `tab`, `enter`, `escape`, `space`, `backspace`, `delete`
     * * `f1`&ndash;`f19`
     * * `pausebreak`, `capslock`, `insert`
     * * `numpad0`&ndash;`numpad9`, `numpad_multiply`, `numpad_add`, `numpad_separator`
     * * `numpad_subtract`, `numpad_decimal`, `numpad_divide`
     *
     * The values will be remapped based on the current keyboard layout. So, for
     * example if `a` is used, on a French AZERTY keyboard the keybinding will be
     * associated with the key labeled 'A' (event though it corresponds to the
     * key labeled 'Q' on a US QWERTY keyboard).
     *
     * To associate keybindings with physical keys independent of the keyboard
     * layout, use the following keycodes:
     *
     * - `[KeyA]`&ndash;`[KeyZ]`, `[Digit0]`&ndash;`[Digit9]`
     * - `[Backquote]`, `[Minus]`, `[Equal]`, `[BracketLeft]`, `[BracketRight]`, `[Backslash]`, `[Semicolon]`, `[Quote]`, `[Comma]`, `[Period]`, `[Slash]`
     * - `[ArrowLeft]`, `[ArrowUp]`, `[ArrowRight]`, `[ArrowDown]`, `[PageUp]`, `[PageDown]`, `[End]`, `[Home]`
     * - `[Tab]`, `[Enter]`, `[Escape]`, `[Space]`, `[Backspace]`, `[Delete]`
     * - `[F1]`&ndash;`[F19]`
     * - `[Pause]`, `[CapsLock]`, `[Insert]`
     * - `[Numpad0]`&ndash;`[Numpad9]`, `[NumpadMultiply]`, `[NumpadAdd]`, `[NumpadComma]`
     * - `[NumpadSubtract]`, `[NumpadDecimal]`, `[NumpadDivide]`
     *
     * For example, using `[KeyQ]` will map to the the key labeled 'Q' on a QWERTY
     * keyboard, and to the key labeled 'A' on an AZERTY keyboard.
     *
     * As a general guideline, it is preferable to use the key values `a`&ndash;`z`
     * for keybinding that are pseudo-mnemotechnic. For the other, it is generally
     * preferable to use the keycodes.
     *
     * Consider the key combination: `alt+2`. With an AZERTY (French) layout,
     * the digits (i.e. '2') are only accessible when shifted. The '2' key produces
     * 'é' when not shifted. It is therefore impossible on an AZERTY keyboard to
     * produce the `alt+2` key combination, at best it would be `alt+shift+2`.
     * To indicate that the intended key combination should be `alt` and the
     * key on the keyboard which has the position of the `2` key on a US keyboard,
     * a key code should be used instead: `alt+[Digit2]`. This will correspond
     * to a key combination that can be generated on any keyboard.
     *
     * If a keybinding is invalid (impossible to produce) with the current
     * keyboard layout, an error will be generated, and the `onError` listener
     * will be called with a `invalid-keybinding` error code.
     *
     */
    key: string;
    /** The command is a single selector, or a selector with arguments */
    command: Selector | [Selector, ...any[]];
    /**
     * If specified, this indicates in which mode this keybinding will apply.
     * If none is specified, the keybinding apply in every mode.
     */
    ifMode?: ParseMode;
    /**
     * If specified, this indicates the OS platform to which this keybinding
     * apply.
     *
     * For example, if set to `!macos` this key binding will apply to every
     * platform, except macOS.
     *
     */
    ifPlatform?: 'macos' | '!macos' | 'windows' | '!windows' | 'linux' | '!linux' | 'ios' | '!ios' | 'android' | '!android' | 'chromeos' | '!chromeos';
};
/**
 * An inline shortcut can be specified as a simple string or as
 * an object literal with additional options:
 *
 *```javascript
 *     config.inlineShortcuts = {
 *      half: '\\frac{1}{2}',
 *      in: {
 *          mode: 'math',
 *          after: 'space+letter+digit+symbol+fence',
 *          value: '\\in',
 *      },
 *  };
 *```
 *
 * When using a string, the shortcut will apply in any mode, and regardless
 * of the characters surrounding it.
 *
 * When using an object literal the `value` key is required an indicate the
 * shortcut substitution.
 *
 * The `mode` key, if present, indicate which mode this shortcut will
 * apply in, either `'math'` or `'text'`. If the key is not present the
 * shortcut apply in all modes.
 *
 * The `'after'` key, if present, indicate in what context (surrounding characters)
 * the shortcut will apply. One or more values can be specified, separated by a '+'
 * sign. If any of the values match, the shortcut will be applicable.
 *
 *
 * Possible values are:
 *
 *  | | |
 *  | :----- | :----- |
 *  | `'space'` |  A spacing command, such as `\quad` |
 *  | `'nothing'`|  The begining of a group |
 *  | `'surd'` |A square root or n-th root |
 *  | `'frac'` |A fraction|
 *  | `'function'` |A function such as `\sin` or `f`|
 *  | `'letter'` |A letter, such as `x` or `n`|
 *  | `'digit'` |`0` through `9`|
 *  | `'binop'` |A binary operator, such as `+`|
 *  | `'relop'` |A relational operator, such as `=`|
 *  | `'punct'` |A punctuation mark, such as `,`|
 *  | `'array'` |An array, such as a matrix or cases statement|
 *  | `'openfence'` |An opening fence, such as `(`|
 *  | `'closefence'` | A closing fence such as `}`|
 *  | `'text'`| Some plain text|
 */
export declare type InlineShortcutDefinition = string | {
    value: string;
    mode?: ParseMode;
    after?: string;
};
export declare type TextToSpeechOptions = {
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
     * {@link https://github.com/arnog/mathlive/tree/master/examples/speech | speech example}
     */
    textToSpeechRules: 'mathlive' | 'sre';
    /**
     * The markup syntax to use for the output of conversion to spoken text.
     *
     * Possible values are `ssml` for the SSML markup or `mac` for the macOS
     * markup, i.e. `&#91;&#91;ltr&#93;&#93;`.
     *
     */
    textToSpeechMarkup: '' | 'ssml' | 'ssml_step' | 'mac';
    /**
     * A set of key/value pairs that can be used to configure the speech rule
     * engine.
     *
     * Which options are available depends on the speech rule engine in use.
     * There are no options available with MathLive's built-in engine. The
     * options for the SRE engine are documented
     * {@link https://github.com/zorkow/speech-rule-engine | here}
     */
    textToSpeechRulesOptions: {
        [key: string]: string;
    };
    /**
     * Indicates which speech engine to use for speech output.
     *
     * Use `local` to use the OS-specific TTS engine.
     *
     * Use `amazon` for Amazon Text-to-Speech cloud API. You must include the
     * AWS API library and configure it with your API key before use.
     *
     * **See**
     * {@link https://github.com/arnog/mathlive/tree/master/examples/speech | speech example}
     */
    speechEngine: 'local' | 'amazon';
    /**
     * Indicates the voice to use with the speech engine.
     *
     * This is dependent on the speech engine. For Amazon Polly, see here:
     * https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
     *
     */
    speechEngineVoice: string;
    /**
     * Sets the speed of the selected voice.
     *
     * One of `x-slow`, `slow`, `medium`, `fast`, `x-fast` or a value as a
     * percentage.
     *
     * Range is `20%` to `200%` For example `200%` to indicate a speaking rate
     * twice the default rate.
     */
    speechEngineRate: string;
    speakHook: (text: string, config: Partial<MathfieldOptions>) => void;
    readAloudHook: (element: HTMLElement, text: string, config: MathfieldOptions) => void;
};
/**
 *
 */
export interface VirtualKeyboardKeycap {
    /**
     * The string displayed for the keycap
     */
    label?: string;
    /**
     * Command to perform when the keycap is pressed
     */
    command?: string;
    /**
     * Latex fragment to insert when the keycap is pressed
     * (ignored if command is specified)
     */
    insert?: string;
    /**
     * Label of the key as a Latex expression, also the Latex
     * inserted if no `command` or `insert` property is specified.
     */
    latex?: string;
    /**
     * Key to insert when keycap is pressed
     * (ignored if `command`, `insert` or `latex` is specified)
     */
    key?: string;
    /** CSS class to apply to the keycap.
     */
    class?: string;
    /**
     * Markup displayed with the key label (for example to explain what the symbol of the key is)
     */
    aside?: string;
    /**
     * A named set of alternate keys to display when there is a long press on the key.
     */
    altKeys?: string;
    /**
     * Markup for the label of the key when the shift key is pressed
     */
    shifted?: string;
    /**
     * Command to perform when the shifted key is pressed
     */
    shiftedCommand?: string;
}
export interface VirtualKeyboardLayer {
    styles?: string;
    backdrop?: string;
    container?: string;
    rows?: VirtualKeyboardKeycap[][];
}
export declare type VirtualKeyboardOptions = {
    /**
     * If specified, the markup to be used to display the virtual keyboard
     * toggle glyph. If none is specified a default keyboard icon is used.
     */
    virtualKeyboardToggleGlyph: string;
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
    virtualKeyboardMode: 'auto' | 'manual' | 'onfocus' | 'off';
    /**
     * A space separated list of the keyboards that should be available. The
     * keyboard `'all'` is synonym with `'numeric'`, `'functions'``, `'symbols'``
     * `'roman'` and `'greek'`,
     *
     * The keyboards will be displayed in the order indicated.
     */
    virtualKeyboards: 'all' | 'numeric' | 'roman' | 'greek' | 'functions' | 'symbols' | 'command' | string;
    virtualKeyboardLayout: 'auto' | 'qwerty' | 'azerty' | 'qwertz' | 'dvorak' | 'colemak';
    /**
     * Some additional custom virtual keyboard layers.
     *
     * A keyboard is made up of one or more layers (think of the main layer and the
     * shift layer on a hardware keyboard). Each key in this object define a new
     * keyboard layer (or replace an existing one). The value of the key should be
     * some HTML markup.
     *
     * **See**
     * {@link https://github.com/arnog/mathlive/tree/master/examples/virtual_keyboard | virtual keyboard example}
     *
     */
    customVirtualKeyboardLayers: {
        [layerName: string]: string | VirtualKeyboardLayer;
    };
    customVirtualKeyboards: {
        [layerName: string]: string;
    };
    /**
     * The visual theme used for the virtual keyboard.
     *
     * If empty, the theme will switch automatically based on the device it's
     * running on. The two supported themes are 'material' and 'apple' (the
     * default).
     */
    virtualKeyboardTheme: 'material' | 'apple' | '';
    /**
     * When a key on the virtual keyboard is pressed, produce a short haptic
     * feedback, if the device supports it.
     */
    keypressVibration: boolean;
    /**
     * When a key on the virtual keyboard is pressed, produce a short audio
     * feedback. The value should be either a URL to a sound file or an object
     * with the following keys:
     *
     * -   `delete` URL to a sound file played when the delete key is pressed
     * -   `return` ... when the return/tab key is pressed
     * -   `spacebar` ... when the spacebar is pressed
     * -   `default` ... when any other key is pressed. This key is required,
     *     the others are optional. If they are missing, this sound is played as
     *     well.
     */
    keypressSound: string | HTMLAudioElement | {
        spacebar?: string | HTMLAudioElement;
        return?: string | HTMLAudioElement;
        delete?: string | HTMLAudioElement;
        default: string | HTMLAudioElement;
    };
    /**
     * URL to a sound file which will be played to provide feedback when a
     * command has no effect, for example when pressing the spacebar at the root
     * level.
     */
    plonkSound?: string | HTMLAudioElement;
};
/**
 * These methods provide an opportunity to intercept or modify an action.
 * Their return value indicate whether the default handling should proceed.
 *
 * @deprecated Use corresponding events of `MathfieldEvent` instead
 */
export interface MathfieldHooks {
    /**
     * A hook invoked when a keystroke is about to be processed.
     *
     * -   <var>keystroke</var>: a string describing the keystroke
     * -   <var>ev</var>: the native keyboard event
     *
     * Return `false` to stop the handling of the event.
     */
    onKeystroke: (sender: Mathfield, keystroke: string, ev: KeyboardEvent) => boolean;
    /**
     * A hook invoked when keyboard navigation would cause the insertion
     * point to leave the mathfield.
     *
     * - <var>direction</var> indicates the direction of the navigation, either
     * `"forward"` or `"backward"` or `"upward"` or `"downward"`.
     *
     * Return `false` to prevent the move, `true` to wrap around to the
     * start of the field.
     *
     * By default, the insertion point will wrap around.
     */
    onMoveOutOf: (sender: Mathfield, direction: 'forward' | 'backward' | 'upward' | 'downward') => boolean;
    /**
     * A hook invoked when pressing tab (or shift-tab) would cause the
     * insertion point to leave the mathfield.
     *
     * <var>direction</var> indicates the direction of the navigation.
     *
     * By default, the insertion point jumps to the next/previous focussable
     * element.
     *
     */
    onTabOutOf: (sender: Mathfield, direction: 'forward' | 'backward') => boolean;
}
export declare type UndoStateChangeListener = (target: Mathfield, action: 'undo' | 'redo' | 'snapshot') => void;
/**
 * The methods provide a notification that an event is about to occur or has
 * occured.
 *
 * In general instead of using this interface you should be listening to the
 * corresponding event on `MathfieldElement`, i.e.
 * ```javascript
mfe.addEventListener('input', (ev) => {
    console.log(ev.target.value);
});
 * ```
 * @deprecated Use corresponding events of `MathfieldEvent` instead
 */
export interface MathfieldListeners {
    /** The mathfield has lost keyboard focus */
    onBlur: (sender: Mathfield) => void;
    /** The mathfield has gained keyboard focus */
    onFocus: (sender: Mathfield) => void;
    onContentWillChange: (sender: Mathfield) => void;
    onContentDidChange: (sender: Mathfield) => void;
    onSelectionWillChange: (sender: Mathfield) => void;
    onSelectionDidChange: (sender: Mathfield) => void;
    onUndoStateWillChange: UndoStateChangeListener;
    onUndoStateDidChange: UndoStateChangeListener;
    onCommit: (sender: Mathfield) => void;
    onModeChange: (sender: Mathfield, mode: ParseMode) => void;
    onVirtualKeyboardToggle: (sender: Mathfield, visible: boolean, keyboardElement: HTMLElement) => void;
    onReadAloudStatus: (sender: Mathfield) => void;
}
export declare type KeyboardOptions = {
    keybindings: Keybinding[];
};
export declare type InlineShortcutsOptions = {
    /** @deprecated Use:
     * ```javascript
     * mf.setConfig(
     *      'inlineShortcuts',
     *      {   ...mf.getConfig('inlineShortcuts'),
     *          ...newShortcuts
     *      }
     * )
     * ```
     * to add `newShortcuts` to the default ones */
    overrideDefaultInlineShortcuts: boolean;
    /**
     * The keys of this object literal indicate the sequence of characters
     * that will trigger an inline shortcut.
     *
     * {@inheritDoc InlineShortcutDefinition}
     */
    inlineShortcuts: {
        [key: string]: InlineShortcutDefinition;
    };
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
    inlineShortcutTimeout: number;
};
export declare type LocalizationOptions = {
    /**
     * The locale (language + region) to use for string localization.
     *
     * If none is provided, the locale of the browser is used.
     *
     */
    locale: string;
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
    strings: {
        [locale: string]: {
            [key: string]: string;
        };
    };
};
export declare type EditingOptions = {
    /** When true, the user cannot edit the mathfield. */
    readOnly: boolean;
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
    smartMode: boolean;
    /**
     * When `true` and an open fence is entered via `typedText()` it will
     * generate a contextually appropriate markup, for example using
     * `\left...\right` if applicable.
     *
     * When `false`, the literal value of the character will be inserted instead.
     */
    smartFence: boolean;
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
    smartSuperscript: boolean;
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
     */
    scriptDepth: number | [number, number];
    /**
     * If `true`, extra parentheses around a numerator or denominator are
     * removed automatically.
     */
    removeExtraneousParentheses: boolean;
    /**
     * When `true` and the spacebar is pressed, no space is inserted.
     *
     * When `false`, a space is inserted when the spacebar is pressed.
     */
    ignoreSpacebarInMathMode: boolean;
};
export declare type LayoutOptions = {
    defaultMode: 'math' | 'text';
    /**
 *A dictionary of LaTeX macros to be used to interpret and render the content.
 *
 *For example, to add a new macro to the default macro dictionary:
 *
```javascript
mf.setConfig({
    macros: {
        ...mf.getOption('macros'),
        smallfrac: '^{#1}\\!\\!/\\!_{#2}',
    },
});
```
 *
 * Note that `getOption()` is called to keep the existing macros and add to them.
 * Otherwise, all the macros are replaced with the new definition.
 *
 * The code above will support the following notation:
 *
```tex
\smallfrac{5}{16}
```
 */
    macros: MacroDictionary;
    /**
     * Scaling factor to be applied to horizontal spacing between elements of
     * the formula. A value greater than 1.0 can be used to improve the
     * legibility.
     *
     */
    horizontalSpacingScale: number;
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
     * **(Historical Note)**
     *
     * Where do the "french" rules come from? The
     * TeX standard font, Computer Modern, is based on Monotype 155M, itself
     * based on the Porson greek font which was one of the most widely used
     * Greek fonts in english-speaking countries. This font had upright
     * capitals, but slanted lowercase. In France, the traditional font for
     * greek was Didot, which has both upright capitals and lowercase.
     *
     *
     * As for roman uppercase, they are recommended by "Lexique des règles
     * typographiques en usage à l’Imprimerie Nationale". It should be noted
     * that this convention is not universally followed.
     * ---
    */
    letterShapeStyle: 'auto' | 'tex' | 'iso' | 'french' | 'upright';
};
/**
 * @keywords security, trust, sanitize, errors
 */
export declare type MathfieldOptions = LayoutOptions & EditingOptions & LocalizationOptions & InlineShortcutsOptions & KeyboardOptions & VirtualKeyboardOptions & TextToSpeechOptions & MathfieldHooks & MathfieldListeners & {
    /**
     * Namespace that is added to `data-` attributes to avoid collisions
     * with other libraries.
     *
     * The namespace should be a string of lowercase letters.
     *
     * It is empty by default.
     *
     * @deprecated
     */
    namespace: string;
    /**
     * An optional listener function that will be
     * invoked when an error is encountered.
     *
     * This could be a Latex parsing error, for the initial value of the
     * mathfield, a value inserted programmatically later, or through a
     * user interaction (pasting in the mathfield for example).
     * See [[`ParserErrorCode`]] for the list of possible parsing errors.
     *
     * This could also be another kind of error, such as an invalid keybinding.
     *
     */
    onError: ErrorListener<ParserErrorCode | MathfieldErrorCode>;
    /**
     * This function provides the option of substituting the focusable DOM
     * element used to capture keyboard input.
     *
     * An (invisible) DOM element is used to capture the keyboard events. By
     * default, this element is a `<textarea>` on desktop and a `<span>` on
     * mobile devices, to prevent the device virtual keyboard from being
     * displayed.
     *
     * Alternatively, the ID of a DOM element can be provided.
     */
    substituteTextArea: string | (() => HTMLElement);
    /**
     * A URL fragment pointing to the directory containing the fonts
     * necessary to render a formula.
     *
     * These fonts are available in the `/dist/fonts` directory of the SDK.
     *
     * Customize this value to reflect where you have copied these fonts,
     * or to use the CDN version.
     *
     * The default value is './fonts'.
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
     * ```javascript
     * {
     *      // Use a directory called 'fonts', located next to the
     *      // `mathlive.js` (or `mathlive.mjs`) file.
     *      fontsDirectory: './fonts'
     * }
     * ```
     * ```javascript
     * {
     *      // Use a directory located at the top your website
     *      fontsDirectory: 'https://example.com/fonts'
     * }
     * ```
     *
     */
    fontsDirectory: string;
    /**
     * Support for [Trusted Type](https://w3c.github.io/webappsec-trusted-types/dist/spec/).
     *
     * This optional function will be called before a string of HTML is
     * injected in the DOM, allowing that string to be sanitized
     * according to a policy defined by the host.
     */
    createHTML: (html: string) => any;
};
/**
 * @deprecated Use [[`MathfieldOptions`]]
 */
export declare type MathfieldConfig = MathfieldOptions;
/**
 * See [[`setKeyboardLayout`]].
 *
 *  | Name | Platform | Display name |
 *  | :----- | :----- | :----- |
 *  | `'apple.en-intl'`         |  Apple | English (International) |
 *  | `'apple.french'`          |  Apple | French (AZERTY) |
 *  | `'apple.german'`          |  Apple | German (QWERTZ) |
 *  | `'windows.en-intl'`       |  Windows | English (International) |
 *  | `'windows.french'`        |  Windows | French (AZERTY) |
 *  | `'windows.german'`          |  Windows | German (QWERTZ) |
 *  | `'linux.en'`              |  Linux | English |
 *  | `'linux.french'`          |  Linux | French (AZERTY) |
 *  | `'linux.german'`          |  Linux | German (QWERTZ) |
 */
export declare type KeyboardLayoutName = 'apple.en-intl' | 'apple.french' | 'apple.german' | 'apple.spanish' | 'windows.en-intl' | 'windows.french' | 'windows.german' | 'windows.spanish' | 'linux.en' | 'linux.french' | 'linux.german' | 'linux.spanish';
/**
 * Change the current physical keyboard layout.
 *
 * Note that this affects some keybindings, but not general text input.
 *
 * If set to `auto` the keyboard layout is guessed.
 *
 */
export declare function setKeyboardLayout(name: KeyboardLayoutName | 'auto'): void;
/**
 * Change the current physical keyboard layout to a layout that matches the
 * specified locale, if one is available.
 *
 * Note that this affects some keybindings, but not general text input.
 *
 */
export declare function setKeyboardLayoutLocale(locale: string): void;
