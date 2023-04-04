import { Selector } from './commands';
import { OriginValidator } from './options';

export type AlphabeticKeyboardLayout =
  | 'auto'
  | 'qwerty'
  | 'azerty'
  | 'qwertz'
  | 'dvorak'
  | 'colemak';

/**
 *
 */
export interface VirtualKeyboardKeycap {
  /**
   * The HTML markup displayed for the keycap
   */
  label: string;

  tooltip: string;

  /**
   * Command to perform when the keycap is pressed
   */
  command:
    | Selector
    | string[]
    | [string, any]
    | [string, any, any]
    | [string, any, any, any];

  /**
   * LaTeX fragment to insert when the keycap is pressed
   * (ignored if command is specified)
   */
  insert: string;
  /**
   * Label of the key as a LaTeX expression, also the LaTeX
   * inserted if no `command` or `insert` property is specified.
   */
  latex: string;
  /**
   * Key to insert when keycap is pressed
   * (ignored if `command`, `insert` or `latex` is specified)
   */
  key: string;

  /**
   * CSS classes to apply to the keycap.
   *
   * - `tex`: use the TeX font for its label.
   *    Using the tex class is not necessary if using the latex property to
   *    define the label.
   * - `shift`: a shift key
   * - `small`: display the label in a smaller size
   * - `action`: an “action” keycap (for arrows, return, etc…)
   * - `separator w5`: a half-width blank used as a separator. Other widths
   *    include `w15` (1.5 width), `w20` (double width) and `w50` (five-wide,
   *    used for the space bar).
   * - `bottom`, `left`, `right`: alignment of the label
   *
   */
  class: string;

  /** Width of the keycap, as a multiple of the standard keycap width */
  width: 0.5 | 1.0 | 1.5 | 2.0 | 5.0;

  /**
   * HTML markup to represent the keycap.
   *
   * This property is only useful when using a custom keycap shape or appearance.
   * Usually, setting the `label` property is sufficient.
   */
  // content: string;

  /**
   * Markup displayed with the key label (for example to explain what the
   * symbol of the key is)
   */
  aside: string;

  /**
   * A set of keycap variants displayed on a long press
   *
   * ```js
   * variants: [
   *  '\\alpha',    // Same label as value inserted
   *  { latex: '\\beta', label: 'beta' }
   * ]
   *
   * ```
   */
  variants: string | (string | Partial<VirtualKeyboardKeycap>)[];

  /**
   * Variant of the keycap when the shift key is pressed
   */
  shift: string | Partial<VirtualKeyboardKeycap>;

  /** Name of the layer to shift to when the key is pressed */
  layer: string;
}
export type VirtualKeyboardLayoutCore = {
  /** A human readable string displayed in the layout switcher toolbar */
  label?: string;
  labelClass?: string;
  /** A human readable tooltip associated with the label */
  tooltip?: string;
  /** A unique string identifying the layout */
  id?: string;
  /** If false, keycaps that have a shifted variant will be displayed as if they don't */
  displayShiftedKeycaps?: boolean;
  /** If false, do not include the edit toolbar in the layout */
  displayEditToolbar?: boolean;
};

export type VirtualKeyboardLayout = VirtualKeyboardLayoutCore &
  (
    | /** The set of layers for this layout */
    { layers: (string | VirtualKeyboardLayer)[] }
    /** As a shortcut, if a single layer, the rows of that layer */
    | { rows: (string | Partial<VirtualKeyboardKeycap>)[][] }
    | { markup: string }
  );

export type NormalizedVirtualKeyboardLayout = VirtualKeyboardLayoutCore & {
  layers: NormalizedVirtualKeyboardLayer[];
};

export interface VirtualKeyboardLayer {
  /** The rows of keycaps in this layer */
  rows?: (Partial<VirtualKeyboardKeycap> | string)[][];
  markup?: string;
  /** The CSS stylesheet associated with this layer */
  style?: string;
  /** A CSS class name to customize the appearance of the background of the layer */
  backdrop?: string;
  /** A CSS class name to customize the appearance of the container the layer */
  container?: string;
  /** A unique string identifying the layer */
  id?: string;
}

export interface NormalizedVirtualKeyboardLayer {
  rows?: Partial<VirtualKeyboardKeycap>[][];
  markup?: string;

  style?: string;
  backdrop?: string;
  container?: string;
  id?: string;
}

export type ActionToolbarOptions = 'none' | 'default';

export interface VirtualKeyboardOptions {
  /**
   * A layout is made up of one or more layers (think of the main layer
   * and the shift layer on a hardware keyboard).
   *
   * A layout has a name and styling information.
   *
   * In addition, a layout can be represented as a standard name which
   * includes `"numeric"`, `"functions"`, `"symbols"`, `"alphabetic"`
   * and `"greek".
   *
   * **See* {@link https://cortexjs.io/mathlive/guides/virtual-keyboards | Guide: Virtual Keyboards}
   *
   *
   */
  set layouts(value: 'default' | (string | VirtualKeyboardLayout)[]);

  /**
   * Configuration of the action toolbar, displayed on the right-hand side.
   *
   * Use `"none"` to disable the right hand side toolbar of the
   * virtual keyboard.
   */
  set actionToolbar(value: ActionToolbarOptions);

  /** Layout of the alphabetic layers: AZERTY, QWERTY, etc... */
  set alphabeticLayout(value: AlphabeticKeyboardLayout);

  /**
   * Element the virtual keyboard element gets appended to.
   *
   * When using [full screen elements](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
   * that contain mathfield, set this property to the full screen element to
   * ensure the virtual keyboard will be visible.
   *
   * **Default**: `document.body`
   */
  set container(value: null | HTMLElement);

  /**
   * Specify the `targetOrigin` parameter for [postMessage](https://developer.mozilla.org/en/docs/Web/API/Window/postMessage)
   * to send control messages from parent to child frame to remote control of
   * mathfield component.
   *
   * **Default**: `globalThis.origin`
   */
  targetOrigin: string;

  /**
   * Specify behavior how origin of message from [postMessage](https://developer.mozilla.org/en/docs/Web/API/Window/postMessage)
   * should be validated.
   *
   * **Default**: `"none"`
   */
  originValidator: OriginValidator;
}
