import type { Mathfield, Range } from './mathfield';
import type { Selector } from './commands';
import type { ParseMode, MacroDictionary, Registers } from './core-types';

/**
 * Specify behavior for origin validation.
 *
 * <div class='symbols-table' style='--first-col-width:32ex'>
 *
 * | Value | Description |
 * | ----- | ----------- |
 * | `"same-origin"` | The origin of received message must be the same of hosted window, instead exception will throw. |
 * | `(origin: string) => boolean` | The callback to verify origin to be expected validation. When callback return `false` value, message will rejected and exception will throw. |
 * | `"none"` | No origin validation for post messages. |
 *
 * </div>
 *
 */
export type OriginValidator =
  | ((origin: string) => boolean)
  | 'same-origin'
  | 'none';

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
export type Keybinding = {
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
   */
  key: string;
  /** The command is a single selector, or a selector with arguments */
  command:
    | Selector
    | string[]
    | [string, any]
    | [string, any, any]
    | [string, any, any, any];
  /**
   * If specified, this indicates in which mode this keybinding will apply.
   * If none is specified, the keybinding will apply in every mode.
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
  ifPlatform?:
    | 'macos'
    | '!macos'
    | 'windows'
    | '!windows'
    | 'linux'
    | '!linux'
    | 'ios'
    | '!ios'
    | 'android'
    | '!android'
    | 'chromeos'
    | '!chromeos';

  // An array of ids of a keyboard layout that this keybinding
  // is applicable to. If undefined, applies to all keyboard layouts.
  ifLayout?: string[];
};

/**
 * An inline shortcut can be specified as a simple string or as
 * an object literal with additional options:
 *
 *```javascript
 *     config.inlineShortcuts = {
 *      half: '\\frac{1}{2}',
 *      in: {
 *          after: 'space+letter+digit+symbol+fence',
 *          value: '\\in',
 *      },
 *  };
 *```
 *
 * When using a string, the shortcut applies regardless of the characters
 * surrounding it.
 *
 * When using an object literal the `value` key is required an indicate the
 * shortcut substitution.
 *
 * The `"after"` key, if present, indicate in what context (preceding characters)
 * the shortcut will apply. One or more values can be specified, separated by a '|'
 * character. If any of the values match, the shortcut is applicable.
 *
 *
 * Possible values are:
 *
 *  | | |
 *  | :----- | :----- |
 *  | `"space"` |  A spacing command, such as `\quad` |
 *  | `"nothing"`|  The begining of a group |
 *  | `"surd"` | A square root or n-th root |
 *  | `"frac"` | A fraction|
 *  | `"function"` |A  function such as `\sin` or `f`|
 *  | `"letter"` | A letter, such as `x` or `n`|
 *  | `"digit"` |`0` through `9`|
 *  | `"binop"` | A binary operator, such as `+`|
 *  | `"relop"` | A relational operator, such as `=`|
 *  | `"punct"` | A punctuation mark, such as `,`|
 *  | `"array"` | An array, such as a matrix or cases statement|
 *  | `"openfence"` | An opening fence, such as `(`|
 *  | `"closefence"` | A closing fence such as `}`|
 *  | `"text"`| Some plain text|
 */
export type InlineShortcutDefinition =
  | string
  | {
      value: string;
      after?: string;
    };

export type InlineShortcutDefinitions = Record<
  string,
  InlineShortcutDefinition
>;

/**
 * These hooks provide an opportunity to intercept or modify an action.
 * When their return value is a boolean, it indicates if the default handling
 * should proceed.
 *
 */
export interface MathfieldHooks {
  /**
   * A hook invoked when a string of characters that could be
   * interpreted as shortcut has been typed.
   *
   * If not a special shortcut, return the empty string `""`.
   *
   * Use this handler to detect multi character symbols, and return them wrapped appropriately,
   * for example `\mathrm{${symbol}}`.
   */
  onInlineShortcut: (sender: Mathfield, symbol: string) => string;

  /**
   * A hook invoked when a scrolling the mathfield into view is necessary.
   *
   * Use when scrolling the page would not solve the problem, e.g.
   * when the mathfield is in another div that has scrollable content.
   */
  onScrollIntoView: ((sender: Mathfield) => void) | null;

  /**
   * This hooks is invoked when the user has requested to export the content
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
   *
   */
  onExport: (from: Mathfield, latex: string, range: Range) => string;
}

//  Note that this can't be an arbitrary string (e.g. `insertMath`), as it will
// get normalized when the event is dispatched. It has to be one of the strings
// from here: https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
export type ContentChangeType =
  | 'insertText'
  | 'insertLineBreak'
  | 'insertFromPaste'
  | 'historyUndo'
  | 'historyRedo'
  | 'deleteByCut'
  | 'deleteContent'
  | 'deleteContentBackward'
  | 'deleteContentForward'
  | 'deleteWordBackward'
  | 'deleteWordForward'
  | 'deleteSoftLineBackward'
  | 'deleteSoftLineForward'
  | 'deleteHardLineBackward'
  | 'deleteHardLineForward';

export type ContentChangeOptions = {
  data?: string | null;
  dataTransfer?: DataTransfer | null;
  inputType?: ContentChangeType;
  // isComposing?: boolean;
};

export type KeyboardOptions = {
  keybindings: readonly Keybinding[];
};

export type InlineShortcutsOptions = {
  /**
   * The keys of this object literal indicate the sequence of characters
   * that will trigger an inline shortcut.
   *
   * {@inheritDoc InlineShortcutDefinition}
   */

  inlineShortcuts: InlineShortcutDefinitions;
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

export type EditingOptions = {
  /** When `true`, the user cannot edit the mathfield. The mathfield can still
   * be modified programatically.
   *
   * **Default**: `false`
   */
  readOnly: boolean;
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
   * - `When x<0, x^{2n+1}<0`
   * - `Graph x^2 -x+3 =0 for 0<=x<=5`
   * - `Divide by x-3 and then add x^2-1 to both sides`
   * - `Given g(x) = 4x – 3, when does g(x)=0?`
   * - `Let D be the set {(x,y)|0<=x<=1 and 0<=y<=x}`
   * - `\int\_{the unit square} f(x,y) dx dy`
   * - `For all n in NN`
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
   * When `true` and a digit is entered in an empty superscript, the cursor
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
  scriptDepth: number | [number, number]; // For [superscript, subscript] or for both
  /**
   * If `true`, extra parentheses around a numerator or denominator are
   * removed automatically.
   *
   * **Default**: `true`
   */
  removeExtraneousParentheses: boolean;
  /**
   * The LaTeX string to insert when the spacebar is pressed (on the physical or
   * virtual keyboard).
   *
   * Use `"\;"` for a thick space, `"\:"` for a medium space, `"\,"` for a thin space.
   *
   * Do not use `" "` (a regular space), as whitespace is skipped by LaTeX so this
   * will do nothing.
   *
   * **Default**: `""` (empty string)
   */
  mathModeSpace: string;

  /**
   * The symbol used to represent a placeholder in an expression.
   *
   * **Default**: `▢` `U+25A2 WHITE SQUARE WITH ROUNDED CORNERS`
   */
  placeholderSymbol: string;

  /**
   * A LaTeX string displayed inside the mathfield when there is no content.
   */
  contentPlaceholder: string;

  /**
   * If `"auto"` a popover with suggestions may be displayed when a LaTeX
   * command is input.
   *
   * **Default**: `"auto"`
   */
  popoverPolicy: 'auto' | 'off';

  /**
   * If `"auto"` a popover with commands to edit an environment (matrix)
   * is displayed when the virtual keyboard is displayed.
   *
   * **Default**: `"auto"`
   */
  environmentPopoverPolicy: 'auto' | 'on' | 'off';

  mathVirtualKeyboardPolicy: 'auto' | 'manual' | 'sandboxed';
};

export type LayoutOptions = {
  /**
   * The mode of the element when it is empty:
   * - `"math"`: equivalent to `\displaystyle` (display math mode)
   * - `"inline-math"`: equivalent to `\inlinestyle` (inline math mode)
   * - `"text"`: text mode
   */
  defaultMode: 'inline-math' | 'math' | 'text';
  /**
   * A dictionary of LaTeX macros to be used to interpret and render the content.
   *
   * For example, to add a new macro to the default macro dictionary:
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
   * LaTeX global registers override.
   */
  registers: Registers;

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
   */
  colorMap: (name: string) => string | undefined;
  backgroundColorMap: (name: string) => string | undefined;

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

  /**
   * Set the minimum relative font size for nested superscripts and fractions. The value
   * should be a number between `0` and `1`. The size is in releative `em` units relative to the
   * font size of the `math-field` element. Specifying a value of `0` allows the `math-field`
   * to use its default sizing logic.
   *
   * **Default**: `0`
   */
  minFontScale: number;
};

/**
 * @keywords security, trust, sanitize, errors
 */
export type MathfieldOptions = LayoutOptions &
  EditingOptions &
  InlineShortcutsOptions &
  KeyboardOptions &
  MathfieldHooks & {
    /**
     * Specify the `targetOrigin` parameter for
     * [postMessage](https://developer.mozilla.org/en/docs/Web/API/Window/postMessage)
     * to send control messages from child to parent frame to remote control
     * of mathfield component.
     *
     * **Default**: `window.origin`
     */
    virtualKeyboardTargetOrigin: string;

    /**
     * Specify how origin of message from [postMessage](https://developer.mozilla.org/en/docs/Web/API/Window/postMessage)
     * should be validated.
     *
     * **Default**: `"none"`
     */
    originValidator: OriginValidator;
  };

/**
 * See [[`setKeyboardLayout`]].
 *
 *  | Name | Platform | Display name |
 *  | :----- | :----- | :----- |
 *  | `"apple.en-intl"`         |  Apple    | English (International) |
 *  | `"apple.french"`          |  Apple    | French (AZERTY) |
 *  | `"apple.german"`          |  Apple    | German (QWERTZ) |
 *  | `"dvorak"`                |           | English (Dvorak) |
 *  | `"windows.en-intl"`       |  Windows  | English (International) |
 *  | `"windows.french"`        |  Windows  | French (AZERTY) |
 *  | `"windows.german"`        |  Windows  | German (QWERTZ) |
 *  | `"linux.en"`              |  Linux    | English |
 *  | `"linux.french"`          |  Linux    | French (AZERTY) |
 *  | `"linux.german"`          |  Linux    | German (QWERTZ) |
 */
export type KeyboardLayoutName =
  | 'apple.en-intl'
  | 'apple.french'
  | 'apple.german'
  | 'apple.spanish'
  | 'dvorak'
  | 'windows.en-intl'
  | 'windows.french'
  | 'windows.german'
  | 'windows.spanish'
  | 'linux.en'
  | 'linux.french'
  | 'linux.german'
  | 'linux.spanish';

/**
 * Change the current physical keyboard layout.
 *
 * Note that this affects some keybindings, but not general text input.
 *
 * If set to `auto` the keyboard layout is guessed.
 *
 */
export declare function setKeyboardLayout(
  name: KeyboardLayoutName | 'auto'
): void;

/**
 * Change the current physical keyboard layout to a layout that matches the
 * specified locale, if one is available.
 *
 * Note that this affects some keybindings, but not general text input.
 *
 */
export declare function setKeyboardLayoutLocale(locale: string): void;

export type StaticRenderOptions = {
  /** An array of tag names whose content will
   *  not be scanned for delimiters (unless their class matches the `processClass`
   * pattern below.
   *
   * **Default:** `['math-field', 'noscript', 'style', 'textarea', 'pre', 'code', 'annotation', 'annotation-xml']`
   */
  skipTags?: string[];

  /**
   * A string used as a regular expression of class names of elements whose content will not be
   * scanned for delimiter
   *
   * **Default**: `"tex2jax_ignore"`
   */
  ignoreClass?: string;

  /**
   * A string used as a
   * regular expression of class names of elements whose content **will** be
   * scanned for delimiters,  even if their tag name or parent class name would
   * have prevented them from doing so.
   *
   * **Default**: `"tex2jax_process"`
   *
   * */
  processClass?: string;

  /**
   * `<script>` tags with this type will be processed as LaTeX.
   *
   * **Default**: `"math/tex"`
   */
  processScriptType?: string;

  /**
   * `<script>` tags with this type will be processed as MathJSON.
   *
   * **Default**: `"math/json"`
   */
  processMathJSONScriptType?: string;

  /** The format(s) in
   * which to render the math for screen readers:
   * - `"mathml"` MathML
   * - `"speakable-text"` Spoken representation
   *
   * You can pass an empty string to turn off the rendering of accessible content.
   * You can pass multiple values separated by spaces, e.g `"mathml speakable-text"`
   *
   * **Default**: `"mathml"`
   */
  renderAccessibleContent?: string;

  /**
   * If true, generate markup that can
   * be read aloud later using {@linkcode speak}
   *
   * **Default**: `false`
   */
  readAloud?: boolean;

  asciiMath?: {
    delimiters?: {
      display?: [openDelim: string, closeDelim: string][];
      inline?: [openDelim: string, closeDelim: string][];
    };
  };

  TeX?: {
    /**
     * If true, math expression that start with `\begin{` will automatically be
     * rendered.
     *
     * **Default**: true.
     */

    processEnvironments?: boolean;

    /**
     * Delimiter pairs that will trigger a render of the content in
     * display style or inline, respectively.
     *
     * **Default**: `{display: [ ['$$', '$$'], ['\\[', '\\]'] ] ], inline: [ ['\\(','\\)'] ] ]}`
     *
     */
    delimiters?: {
      display: [openDelim: string, closeDelim: string][];
      inline: [openDelim: string, closeDelim: string][];
    };
  };
};
