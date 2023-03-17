import { Selector } from 'mathlive';
import type {
  VirtualKeyboardOptions,
  AlphabeticKeyboardLayout,
  VirtualKeyboardLayer,
  LayoutDefinition,
  ActionToolbarOptions,
} from './public';

export interface MathfieldProxy {
  value: string;
  readonly selectionIsCollapsed: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

/**
 * This interface is implemented by:
 * - `VirtualKeyboard`: when the browsing context is a top-level document
 * - `VirtualKeyboardProxy`: when the browsing context is an iframe
 */
export interface VirtualKeyboardInterface extends VirtualKeyboardOptions {
  show(): void;
  hide(): void;
  visible: boolean;

  readonly boundingRect: DOMRect;

  executeCommand(command: string | [string, ...any[]]): boolean;

  /** The content or selection of the mathfield has changed and the toolbar
   * may need to be updated accordingly
   */
  updateToolbar(mf: MathfieldProxy): void;
}

// Commands return true if they resulted in a dirty state
// @revisit: maybe a command attribute instead?
export interface VirtualKeyboardCommands {
  showVariantsPanel: (variants: string) => boolean;
  hideVariantsPanel: () => boolean;
  /**
   * The command invoked when a variant key is pressed:
   * hide the variants panel, then perform the command.
   */
  performVariant: (command: Selector | [Selector, ...any[]]) => boolean;

  switchKeyboardLayer: (layer) => boolean;
  shiftKeyboardLayer: () => boolean;
  unshiftKeyboardLayer: () => boolean;
  insertAndUnshiftKeyboardLayer: (c: string) => boolean;

  toggleVirtualKeyboard: () => boolean;
  hideVirtualKeyboard: () => boolean;
  showVirtualKeyboard: () => boolean;

  /** Toggle the virtual keyboard, but switch to another keyboard layout */
  toggleVirtualKeyboardShift: () => boolean;
}

export type VirtualKeyboardMessageAction =
  | 'proxy-created' // From proxy to VK
  | 'execute-command' // From proxy to VK
  | 'show' // From proxy to VK
  | 'hide' // From proxy to VK
  | 'update-setting' // From proxy to VK
  | 'update-toolbar' // From proxy to VK
  | 'synchronize-proxy' // From VK to proxy
  | 'geometry-changed' // From VK to proxy
  | 'update-state' // From VK to proxy
  | 'focus'
  | 'blur';

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
      layouts: (string | LayoutDefinition)[];
      actionToolbar?: ActionToolbarOptions;
    }
  | {
      // From proxy to VK
      type: 'mathlive#virtual-keyboard-message';
      action: 'update-setting';
      alphabeticLayout?: AlphabeticKeyboardLayout;
      layers: Record<string, string | Partial<VirtualKeyboardLayer>>;
      layouts: (string | LayoutDefinition)[];
      actionToolbar?: ActionToolbarOptions;
    }
  | {
      type: 'mathlive#virtual-keyboard-message';
      action:
        | 'proxy-created'
        | 'show'
        | 'hide'
        | 'focus'
        | 'blur'
        | 'update-state'
        | 'update-toolbar';
      // Omit<
      //   VirtualKeyboardMessageAction,
      //   'execute-command' | 'set-options'
      // >;
    };
