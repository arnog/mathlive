import { MacroDictionary, ParseMode } from './core';
import { InlineShortcutDefinition } from './shortcuts';
export declare class Mathfield {
}
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
    textToSpeechRules?: 'mathlive' | 'sre';
    /**
     * The markup syntax to use for the output of conversion to spoken text.
     *
     * Possible values are `ssml` for the SSML markup or `mac` for the macOS
     * markup, i.e. `&#91;&#91;ltr&#93;&#93;`.
     *
     */
    textToSpeechMarkup?: '' | 'ssml' | 'ssml_step' | 'mac';
    /**
     * A set of key/value pairs that can be used to configure the speech rule
     * engine.
     *
     * Which options are available depends on the speech rule engine in use.
     * There are no options available with MathLive's built-in engine. The
     * options for the SRE engine are documented
     * {@link https://github.com/zorkow/speech-rule-engine | here}
     */
    textToSpeechRulesOptions?: {
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
    speechEngine?: 'local' | 'amazon';
    /**
     * Indicates the voice to use with the speech engine.
     *
     * This is dependent on the speech engine. For Amazon Polly, see here:
     * https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
     *
     */
    speechEngineVoice?: string;
    /**
     * Sets the speed of the selected voice.
     *
     * One of `x-slow`, `slow`, `medium`, `fast`, `x-fast` or a value as a
     * percentage.
     *
     * Range is `20%` to `200%` For example `200%` to indicate a speaking rate
     * twice the default rate.
     */
    speechEngineRate?: string;
    speakHook?: (text: string, config: MathfieldConfig) => void;
    readAloudHook?: (element: HTMLElement, text: string, config: MathfieldConfig) => void;
};
export declare type VirtualKeyboardOptions = {
    /**
     * If specified, the markup to be used to display the virtual keyboard
     * toggle glyph. If none is specified a default keyboard icon is used.
     */
    virtualKeyboardToggleGlyph?: string;
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
    virtualKeyboardMode?: 'auto' | 'manual' | 'onfocus' | 'off';
    /**
     * A space separated list of the keyboards that should be available. The
     * keyboard `'all'` is synonym with `'numeric'`, `'roman'`, `'greek'`,
     * `'functions'` and `'command'`
     *
     * The keyboards will be displayed in the order indicated.
     */
    virtualKeyboards?: 'all' | 'numeric' | 'roman' | 'greek' | 'functions' | 'command' | string;
    virtualKeyboardLayout?: 'auto' | 'qwerty' | 'azerty' | 'qwertz' | 'dvorak' | 'colemak';
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
    customVirtualKeyboardLayers?: {
        [layer: string]: string;
    };
    customVirtualKeyboards?: {
        [layer: string]: string;
    };
    /**
     * The visual theme used for the virtual keyboard.
     *
     * If empty, the theme will switch automatically based on the device it's
     * running on. The two supported themes are 'material' and 'apple' (the
     * default).
     */
    virtualKeyboardTheme?: 'material' | 'apple' | '';
    /**
     * When a key on the virtual keyboard is pressed, produce a short haptic
     * feedback, if the device supports it.
     */
    keypressVibration?: boolean;
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
    keypressSound?: string | HTMLAudioElement | {
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
    onKeystroke?: (sender: Mathfield, keystroke: string, ev: KeyboardEvent) => boolean;
    /**
     * A hook invoked when keyboard navigation would cause the insertion
     * point to leave the mathfield.
     *
     * <var>direction</var> indicates the direction of the navigation, either
     * `"forward"` or `"backward"`.
     *
     * Return `false` to prevent the move, `true` to wrap around to the
     * start of the field.
     *
     * By default, the insertion point will wrap around.
     */
    onMoveOutOf?: (sender: Mathfield, direction: 'forward' | 'backward') => boolean;
    /**
     * A hook invoked when pressing tab (or shift-tab) would cause the
     * insertion point to leave the mathfield.
     *
     * <var>direction</var> indicates the direction of the navigation, either
     * `"forward"` or `"backward"`.
     *
     * By default, the insertion point jumps to the next/previous focussable
     * element.
     *
     */
    onTabOutOf?: (sender: Mathfield, direction: 'forward' | 'backward') => boolean;
}
export declare type UndoStateChangeListener = (target: Mathfield, action: 'undo' | 'redo' | 'snapshot') => void;
/**
 * The methods provide a notification that an event is about to occur or has
 * occured.
 */
export interface MathfieldListeners {
    /** The mathfield has lost keyboard focus */
    onBlur?: (sender: Mathfield) => void;
    /** The mathfield has gained keyboard focus */
    onFocus?: (sender: Mathfield) => void;
    onContentWillChange?: (sender: Mathfield) => void;
    onContentDidChange?: (sender: Mathfield) => void;
    onSelectionWillChange?: (sender: Mathfield) => void;
    onSelectionDidChange?: (sender: Mathfield) => void;
    onUndoStateWillChange?: UndoStateChangeListener;
    onUndoStateDidChange?: UndoStateChangeListener;
    onModeChange?: (sender: Mathfield, mode: ParseMode) => void;
    onVirtualKeyboardToggle?: (sender: Mathfield, visible: boolean, keyboardElement: HTMLElement) => void;
    onReadAloudStatus?: (sender: Mathfield) => void;
}
export declare type InlineShortcutsOptions = {
    /** @deprecated Use:
     * ```typescript
     * mf.setConfig(
     *      'inlineShortcuts',
     *      {   ...mf.getConfig('inlineShortcuts'),
     *          ...newShortcuts
     *      }
     * )
     * ```
     * to add `newShortcuts` to the default ones */
    overrideDefaultInlineShortcuts?: boolean;
    /**
     * A map of shortcuts → replacement value.
     *
     * For example `{ 'pi': '\\pi'}`. If `overrideDefaultInlineShortcuts` is
     * false, these shortcuts are applied after any default ones, and can
     * therefore override them.
     *
     * A shortcut can also be specified with additional options:
     *
     *```javascript
     *     config.inlineShortcuts = {
     *      in: {
     *          mode: 'math',
     *          after: 'space+letter+digit+symbol+fence',
     *          value: '\\in',
     *      },
     *  };
     *```
     *
     * The `value` key is required an indicate the shortcut substitution.
     *
     * The `mode` key, if present, indicate in which mode this shortcut should
     * apply, either `'math'` or `'text'`. If the key is not present the
     * shortcut apply in both modes.
     *
     * The `'after'` key, if present, indicate in what context the shortcut
     * should apply. One or more values can be specified, separated by a '+'
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
    inlineShortcuts?: {
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
    inlineShortcutTimeout?: number;
};
export declare type LocalizationOptions = {
    /**
     * The locale (language + region) to use for string localization.
     *
     * If not is provided, the locale of the browser is used.
     *
     */
    locale?: string;
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
    strings?: {
        [locale: string]: {
            [key: string]: string;
        };
    };
};
export declare type EditingOptions = {
    /** When true, the user cannot edit the mathfield. */
    readOnly?: boolean;
    /**
     * When true, during text input the field will switch automatically between
     * 'math' and 'text' mode depending on what is typed and the context of the
     * formula. If necessary, what was previously typed will be 'fixed' to
     * account for the new info.
     *
     * For example, when typing "if x >0":
     *
     * -   "i" -> math mode, imaginary unit
     * -   "if" -> text mode, english word "if"
     * -   "if x" -> all in text mode, maybe the next word is xylophone?
     * -   "if x >" -> "if" stays in text mode, but now "x >" is in math mode
     * -   "if x > 0" -> "if" in text mode, "x > 0" in math mode
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
    smartMode?: boolean;
    /**
     * When `true` and an open fence is entered via `typedText()` it will
     * generate a contextually appropriate markup, for example using
     * `\left...\right` if applicable.
     *
     * When `false`, the literal value of the character will be inserted instead.
     */
    smartFence?: boolean;
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
    smartSuperscript?: boolean;
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
    scriptDepth?: number | [number, number];
    /**
     * If `true`, extra parentheses around a numerator or denominator are
     * removed automatically.
     */
    removeExtraneousParentheses?: boolean;
    /**
     * When `true` and the spacebar is pressed, no space is inserted.
     *
     * When `false`, a space is inserted when the spacebar is pressed.
     */
    ignoreSpacebarInMathMode?: boolean;
};
export declare type LayoutOptions = {
    defaultMode?: 'math' | 'text';
    /**
 *A dictionary of LaTeX macros to be used to interpret and render the content.
 *
 *For example:
 *
```javascript
mf.setConfig({
    macros: {
        smallfrac: '^{#1}\\!\\!/\\!_{#2}',
    },
});
```
 *
 *The code above will support the following notation:
 *
```tex
\smallfrac{5}{16}
```
 */
    macros?: MacroDictionary;
    /**
     * Scaling factor to be applied to horizontal spacing between elements of
     * the formula. A value greater than 1.0 can be used to improve the
     * legibility.
     *
     */
    horizontalSpacingScale?: number;
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
    letterShapeStyle?: 'auto' | 'tex' | 'iso' | 'french' | 'upright';
};
/**
 *
 * * <var>namespace</var> Namespace that is added to `data-` attributes
 * to avoid collisions with other libraries.
 *
 * It is empty by default.
 *
 * The namespace should be a string of lowercase letters.
 *
 * * <var>substituteTextArea</var> A function that returns a focusable
 * element that can be used to capture text input.
 *
 * An (invisible) DOM element is used to capture the keyboard events. By
 * default, this element is a `<textarea>` on desktop and a `<span>` on
 * mobile devices, to prevent the device virtual keyboard from being
 * displayed.
 *
 * This function provides the option of substituting the DOM element
 * used for keyboard capture.
 *
 * Alternatively, the ID of a DOM element can be provided.
 */
export declare type MathfieldConfig = LayoutOptions & EditingOptions & LocalizationOptions & InlineShortcutsOptions & VirtualKeyboardOptions & TextToSpeechOptions & MathfieldHooks & MathfieldListeners & {
    namespace?: string;
    substituteTextArea?: string | (() => HTMLElement);
};
