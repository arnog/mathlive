import type { Selector } from './commands';
import type { ParseMode, Style } from './core-types';
import type { OriginValidator } from './options';

/**
 * @category Virtual Keyboard
 */

export type AlphabeticKeyboardLayout =
  | 'auto'
  | 'qwerty'
  | 'azerty'
  | 'qwertz'
  | 'dvorak'
  | 'colemak';

/**
 * @category Virtual Keyboard
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
    | string
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
   *    Using the tex class is not necessary if using the `latex` property to
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

  /** Open variants panel without long press and does not close automatically */
  stickyVariantPanel: boolean;
}
/**
 * @category Virtual Keyboard
 */
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

/**
 * @category Virtual Keyboard
 */
export type VirtualKeyboardLayout = VirtualKeyboardLayoutCore &
  (
    | /** The set of layers for this layout */
    { layers: (string | VirtualKeyboardLayer)[] }
    /** As a shortcut, if a single layer, the rows of that layer */
    | { rows: (string | Partial<VirtualKeyboardKeycap>)[][] }
    | { markup: string }
  );

/**
 * @category Virtual Keyboard
 */
export type NormalizedVirtualKeyboardLayout = VirtualKeyboardLayoutCore & {
  layers: NormalizedVirtualKeyboardLayer[];
};

/**
 * @category Virtual Keyboard
 */
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

/**
 * @category Virtual Keyboard
 */
export interface NormalizedVirtualKeyboardLayer {
  rows?: Partial<VirtualKeyboardKeycap>[][];
  markup?: string;

  style?: string;
  backdrop?: string;
  container?: string;
  id?: string;
}

/**
 * @category Virtual Keyboard
 */
export type EditToolbarOptions = 'none' | 'default';

/**
 * @category Virtual Keyboard
 */
export type VirtualKeyboardName =
  | 'default'
  | 'compact'
  | 'minimalist'
  | 'numeric-only'
  | 'numeric'
  | 'symbols'
  | 'alphabetic'
  | 'greek';

/**
 * @category Virtual Keyboard
 */
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
   * **See* {@link mathfield/guides/virtual-keyboards | Guide: Virtual Keyboards}
   *
   *
   */
  get layouts(): Readonly<(VirtualKeyboardName | VirtualKeyboardLayout)[]>;
  set layouts(
    value:
      | VirtualKeyboardName
      | VirtualKeyboardLayout
      | (VirtualKeyboardName | VirtualKeyboardLayout)[]
      | Readonly<(VirtualKeyboardName | VirtualKeyboardLayout)[]>
  );

  /**
   * This property is the "expanded" version of the `layouts` property.
   * It is normalized to include all the default values for the properties
   * of the layout and layers.
   */
  readonly normalizedLayouts: (VirtualKeyboardLayoutCore & {
    layers: NormalizedVirtualKeyboardLayer[];
  })[];

  /**
   * Some keycaps can be customized:
   * `[left]`, `[right]`, `[up]`, `[down]`, `[return]`, `[action]`,
   * `[space]`, `[tab]`, `[backspace]`, `[shift]`,
   * `[undo]`, `[redo]`, `[foreground-color]`, `[background-color]`,
   * `[hide-keyboard]`,
   * `[.]`, `[,]`,
   * `[0]`, `[1]`, `[2]`, `[3]`, `[4]`,
   * `[5]`, `[6]`, `[7]`, `[8]`, `[9]`,
   * `[+]`, `[-]`, `[*]`, `[/]`, `[^]`, `[_]`, `[=]`, `[.]`,
   * `[(]`, `[)]`,
   */
  getKeycap(keycap: string): Partial<VirtualKeyboardKeycap> | undefined;
  setKeycap(keycap: string, value: Partial<VirtualKeyboardKeycap>): void;

  /**
   * Configuration of the action toolbar, displayed on the right-hand side.
   *
   * Use `"none"` to disable the right hand side toolbar of the
   * virtual keyboard.
   */
  set editToolbar(value: EditToolbarOptions);

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

/** @internal */
export interface MathfieldProxy {
  value: string;
  readonly selectionIsCollapsed: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly mode: ParseMode;
  readonly style: Style;
}

/**
 * This interface is implemented by:
 * - `VirtualKeyboard`: when the browsing context is a top-level document
 * - `VirtualKeyboardProxy`: when the browsing context is an iframe
 *
 * @category Virtual Keyboard
 */
export interface VirtualKeyboardInterface extends VirtualKeyboardOptions {
  show(options?: { animate: boolean }): void;
  hide(options?: { animate: boolean }): void;
  manualClose(options?: { animate: boolean }): void;
  visible: boolean;
  readonly isShifted: boolean;
  readonly boundingRect: DOMRect;

  executeCommand(command: string | [string, ...any[]]): boolean;

  /** The content or selection of the mathfield has changed and the toolbar
   * may need to be updated accordingly
   */
  updateToolbar(mf: MathfieldProxy): void;
  update(mf: MathfieldProxy): void;
  connect(): void;
  disconnect(): void;
}

// Commands return true if they resulted in a dirty state
// @revisit: maybe a command attribute instead?
/**
 * @category Editing Commands
 */
export interface VirtualKeyboardCommands {
  switchKeyboardLayer: (mathfield: undefined, layer: string) => boolean;

  toggleVirtualKeyboard: () => boolean;
  hideVirtualKeyboard: () => boolean;
  showVirtualKeyboard: () => boolean;
}

/**
 * @category Virtual Keyboard
 */
export type VirtualKeyboardMessageAction =
  | 'connect' // From proxy or mf to VK
  | 'disconnect' // From proxy or mf to VK
  | 'proxy-created' // From proxy to VK
  | 'execute-command' // From proxy to VK
  | 'show' // From proxy to VK
  | 'hide' // From proxy to VK
  | 'manual-close' // From proxy to VK
  | 'update-setting' // From proxy to VK
  | 'update-toolbar' // From proxy to VK
  | 'synchronize-proxy' // From VK to proxy
  | 'geometry-changed' // From VK to proxy
  | 'update-state' // From VK to proxy
  | 'focus'
  | 'blur';

/**
 * @category Virtual Keyboard
 */
export type VirtualKeyboardMessage =
  | {
      type: 'mathlive#virtual-keyboard-message';
      // From proxy to VK
      action: 'execute-command';
      command: Selector | [Selector, ...any[]];
    }
  | {
      // From VK to proxy
      type: 'mathlive#virtual-keyboard-message';
      action: 'geometry-changed';
      boundingRect: DOMRect;
    }
  | {
      // From VK to proxy
      type: 'mathlive#virtual-keyboard-message';
      action: 'synchronize-proxy';
      boundingRect: DOMRect;
      alphabeticLayout?: AlphabeticKeyboardLayout;
      layers: Record<string, string | Partial<VirtualKeyboardLayer>>;
      layouts: Readonly<(string | VirtualKeyboardLayout)[]>;
      editToolbar?: EditToolbarOptions;
      setKeycap: { keycap: string; value: Partial<VirtualKeyboardKeycap> };
      isShifted: boolean;
    }
  | {
      // From proxy to VK
      type: 'mathlive#virtual-keyboard-message';
      action: 'update-setting';
      alphabeticLayout?: AlphabeticKeyboardLayout;
      layers: Record<string, string | Partial<VirtualKeyboardLayer>>;
      layouts: Readonly<(VirtualKeyboardName | VirtualKeyboardLayout)[]>;
      editToolbar?: EditToolbarOptions;
      setKeycap: { keycap: string; value: Partial<VirtualKeyboardKeycap> };
    }
  | {
      // From proxy to VK
      type: 'mathlive#virtual-keyboard-message';
      action: 'show' | 'hide';
      animate?: boolean;
    }
  | {
      type: 'mathlive#virtual-keyboard-message';
      action:
        | 'connect'
        | 'disconnect'
        | 'proxy-created'
        | 'focus'
        | 'blur'
        | 'update-state'
        | 'update-toolbar';
      // Omit<
      //   VirtualKeyboardMessageAction,
      //   'execute-command' | 'set-options'
      // >;
    };
