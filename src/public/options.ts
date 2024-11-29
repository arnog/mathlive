import type { Mathfield, InsertStyleHook } from './mathfield';
import type { Selector } from './commands';
import type {
  ParseMode,
  MacroDictionary,
  Registers,
  Range,
} from './core-types';

/**
 * Specify behavior for origin validation.
 *
 * <div className='symbols-table' style={{"--first-col-width":"32ex"}}>
 *
 * | Value | Description |
 * | ----- | ----------- |
 * | `"same-origin"` | The origin of received message must be the same of hosted window, instead exception will throw. |
 * | `(origin: string) => boolean` | The callback to verify origin to be expected validation. When callback return `false` value, message will rejected and exception will throw. |
 * | `"none"` | No origin validation for post messages. |
 *
 * </div>
 *
 * @category Options
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
 * @category Options
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
 *
 * @category Options
 */
export type InlineShortcutDefinition =
  | string
  | {
      value: string;
      after?: string;
    };

/** @category Options */
export type InlineShortcutDefinitions = Record<
  string,
  InlineShortcutDefinition
>;

/**
 * These hooks provide an opportunity to intercept or modify an action.
 * When their return value is a boolean, it indicates if the default handling
 * should proceed.
 * @category Options
 */
export interface MathfieldHooks {
  onInlineShortcut: (sender: Mathfield, symbol: string) => string;

  onInsertStyle: InsertStyleHook | undefined | null;

  onScrollIntoView: ((sender: Mathfield) => void) | null;

  onExport: (from: Mathfield, latex: string, range: Range) => string;
}

//  Note that this can't be an arbitrary string (e.g. `insertMath`), as it will
// get normalized when the event is dispatched. It has to be one of the strings
// from here: https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
/** @category Options */
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

/** @category Options */
export type ContentChangeOptions = {
  data?: string | null;
  dataTransfer?: DataTransfer | null;
  inputType?: ContentChangeType;
  // isComposing?: boolean;
};

/** @category Options */
export type KeyboardOptions = {
  keybindings: Readonly<Keybinding[]>;
};

/** @category Options */
export type InlineShortcutsOptions = {
  inlineShortcuts: InlineShortcutDefinitions;
  inlineShortcutTimeout: number;
};

/** @category Options */
export type EditingOptions = {
  /** When `true`, the user cannot edit the mathfield. The mathfield can still
   * be modified programatically.
   *
   * **Default**: `false`
   */
  readOnly: boolean;

  smartMode: boolean;

  smartFence: boolean;

  smartSuperscript: boolean;

  scriptDepth: number | [number, number]; // For [superscript, subscript] or for both

  removeExtraneousParentheses: boolean;

  /**
   * Return true if the latex command is a function that could take
   * implicit arguments. By default, this includes trigonometric function,
   * so `\sin x` is interpreted as `\sin(x)`.
   *
   * This affects editing, for example how the `/` key is interpreted after
   * such as symbol.
   *
   */
  isImplicitFunction: (name: string) => boolean;

  mathModeSpace: string;

  placeholderSymbol: string;

  contentPlaceholder: string;

  popoverPolicy: 'auto' | 'off';

  environmentPopoverPolicy: 'auto' | 'on' | 'off';

  mathVirtualKeyboardPolicy: 'auto' | 'manual' | 'sandboxed';
};

/** @category Options */
export type LayoutOptions = {
  defaultMode: 'inline-math' | 'math' | 'text';

  macros: MacroDictionary;

  /**
   * LaTeX global registers override.
   */
  registers: Registers;

  colorMap: (name: string) => string | undefined;
  backgroundColorMap: (name: string) => string | undefined;

  letterShapeStyle: 'auto' | 'tex' | 'iso' | 'french' | 'upright';

  minFontScale: number;

  maxMatrixCols: number;
};

/**
 * @category Options
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
 * See {@linkcode setKeyboardLayout}.
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
 *
 * @category Options
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
 * @category Options
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
 * @category Options
 *
 */
export declare function setKeyboardLayoutLocale(locale: string): void;

/** @category Static Rendering */
export type StaticRenderOptions = Partial<LayoutOptions> & {
  /**
   * An array of tag names whose content will not be scanned for delimiters
   * (unless their class matches the `processClass` pattern below).
   *
   * **Default:** `['math-field', 'noscript', 'style', 'textarea', 'pre', 'code', 'annotation', 'annotation-xml']`
   */
  skipTags?: string[];

  /**
   * A string used as a regular expression of class names of elements whose
   * content will not be scanned for delimiter
   *
   * **Default**: `"tex2jax_ignore"`
   */
  ignoreClass?: string;

  /**
   * A string used as a regular expression of class names of elements whose
   * content **will** be scanned for delimiters,  even if their tag name or
   * parent class name would have prevented them from doing so.
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

  /** The format(s) in which to render the math for screen readers:
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
     * If true, math expression that start with `\begin{`
     * will automatically be rendered.
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

    className?: {
      display?: string;
      inline?: string;
    };
  };
};
