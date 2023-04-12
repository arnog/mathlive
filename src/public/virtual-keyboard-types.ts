import { ArrayAtom } from 'core-atoms/array';
import { Environment } from 'core-definitions/environment-types';
import { ParseMode, Selector, Style } from 'mathlive';
import type {
  VirtualKeyboardOptions,
  AlphabeticKeyboardLayout,
  VirtualKeyboardLayer,
  VirtualKeyboardLayout,
  EditToolbarOptions,
  VirtualKeyboardKeycap,
} from './virtual-keyboard';

export interface MathfieldProxy {
  value: string;
  readonly selectionIsCollapsed: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly mode: ParseMode;
  readonly style: Style;
  readonly array?: ArrayAtom;
  readonly boundingRect?: DOMRect;
}

/**
 * This interface is implemented by:
 * - `VirtualKeyboard`: when the browsing context is a top-level document
 * - `VirtualKeyboardProxy`: when the browsing context is an iframe
 */
export interface VirtualKeyboardInterface extends VirtualKeyboardOptions {
  show(options?: { animate: boolean }): void;
  hide(options?: { animate: boolean }): void;
  visible: boolean;

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
export interface VirtualKeyboardCommands {
  /**
   * The command invoked when a variant key is pressed:
   * hide the variants panel, then perform the command.
   */
  performVariant: (command: Selector | [Selector, ...any[]]) => boolean;

  switchKeyboardLayer: (layer: string) => boolean;

  toggleVirtualKeyboard: () => boolean;
  hideVirtualKeyboard: () => boolean;
  showVirtualKeyboard: () => boolean;
}

export type VirtualKeyboardMessageAction =
  | 'connect' // From proxy or mf to VK
  | 'disconnect' // From proxy or mf to VK
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
      layouts: (string | VirtualKeyboardLayout)[];
      editToolbar?: EditToolbarOptions;
      actionKeycap: string | Partial<VirtualKeyboardKeycap>;
      shiftKeycap: string | Partial<VirtualKeyboardKeycap>;
      backspaceKeycap: string | Partial<VirtualKeyboardKeycap>;
      tabKeycap: string | Partial<VirtualKeyboardKeycap>;
    }
  | {
      // From proxy to VK
      type: 'mathlive#virtual-keyboard-message';
      action: 'update-setting';
      alphabeticLayout?: AlphabeticKeyboardLayout;
      layers: Record<string, string | Partial<VirtualKeyboardLayer>>;
      layouts: (string | VirtualKeyboardLayout)[];
      editToolbar?: EditToolbarOptions;
      actionKeycap: string | Partial<VirtualKeyboardKeycap>;
      shiftKeycap: string | Partial<VirtualKeyboardKeycap>;
      backspaceKeycap: string | Partial<VirtualKeyboardKeycap>;
      tabKeycap: string | Partial<VirtualKeyboardKeycap>;
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
