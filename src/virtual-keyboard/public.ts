import { Selector } from 'public/commands';
import { OriginValidator } from 'public/options';

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
   * - `modifier`: a modifier (shift/option, etc…) keycap
   * - `small`: display the label in a smaller size
   * - `action`: an “action” keycap (for arrows, return, etc…)
   * - `separator w5`: a half-width blank used as a separator. Other widths
   *    include `w15` (1.5 width), `w20` (double width) and `w50` (five-wide,
   *    used for the space bar).
   * - `bottom`, `left`, `right`: alignment of the label
   *
   */
  class: string;

  /**
   * HTML markup to represent the keycap.
   *
   * This property is only useful when using a custom keycap shape or appearance.
   * Usually, setting the `label` property is sufficient.
   */
  content: string;

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
  variants: (string | Partial<VirtualKeyboardKeycap>)[];

  /**
   * Markup for the label of the key when the shift key is pressed
   */
  shifted: string;
  /**
   * Command to perform when the shifted key is pressed
   */
  shiftedCommand: Selector | [Selector, ...any[]];

  /** Name of the layer to shift to when the key is pressed */
  layer: string;
}

export interface VirtualKeyboardDefinition {
  label: string;
  tooltip?: string;
  layer?: string;
  layers?: string[];
  classes?: string;
  command?: string | string[];
}

export interface VirtualKeyboardLayer {
  /** The CSS stylesheet associated with this layer */
  styles: string;
  /** A CSS class name to customize the appearance of the background of the layer */
  backdrop: string;
  /** A CSS class name to customize the appearance of the container the layer */
  container: string;
  /** The rows of keycaps in this layer */
  rows: Partial<VirtualKeyboardKeycap>[][];
}

export type VirtualKeyboardToolbarOptions = 'none' | 'default';

export interface VirtualKeyboardOptions {
  /**
   * A space separated list of the keyboards that should be available. The
   * keyboard `"all"` is synonym with `"numeric"`, `"functions"``, `"symbols"``
   * `"roman"` and `"greek"`,
   *
   * The keyboards will be displayed in the order indicated.
   */
  set virtualKeyboards(
    value:
      | 'all'
      | 'numeric'
      | 'roman'
      | 'greek'
      | 'functions'
      | 'symbols'
      | 'latex'
      | string
  );

  set virtualKeyboardLayout(value: AlphabeticKeyboardLayout);

  /**
   * Custom virtual keyboards.
   *
   * A keyboard is made up of one or more layers (think of the main layer and
   * the shift layer on a hardware keyboard).
   *
   * Each key in `layers` defines a new keyboard layer or replace
   * an existing one. The value of the key can be some HTML Markup
   * or a `VirtualKeyboardLayer` object.
   *
   * Each entry in `keyboards` defines a keyboard as a set of layers
   *
   * **See* {@link https://cortexjs.io/mathlive/guides/virtual-keyboards | Guide: Virtual Keyboards}
   *
   *
   */
  set customVirtualKeyboards(
    value:
      | undefined
      | null
      | {
          layers: Record<string, string | Partial<VirtualKeyboardLayer>>;
          keyboards: Record<string, VirtualKeyboardDefinition>;
        }
  );

  /**
   * The right hand side toolbar configuration.
   *
   * Use `none` to disable the right hand side toolbar of the
   * virtual keyboard.
   */
  set virtualKeyboardToolbar(value: VirtualKeyboardToolbarOptions);

  /**
   * Element the virtual keyboard element gets appended to.
   *
   * When using [full screen elements](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
   * that contain mathfield, set this property to the full screen element to
   * ensure the virtual keyboard will be visible.
   *
   * **Default**: `document.body`
   */
  set virtualKeyboardContainer(value: null | HTMLElement);

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
   * **Default**: `"same-origin"`
   */
  originValidator: OriginValidator;
}
