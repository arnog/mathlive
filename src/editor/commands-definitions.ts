import { Keys } from '../public/types-utils';

import { Selector } from '../public/commands';
import { VirtualKeyboardInterface } from '../public/mathfield';
import { VirtualKeyboard } from './virtual-keyboard-utils';

export type ExecuteCommandFunction = (
  command: SelectorPrivate | [SelectorPrivate, ...any[]]
) => boolean;

// Commands return true if they resulted in a dirty state
// @revisit: maybe a command attribute instead?
export interface CommandsPrivate {
  showVariantsPanel: (keyboard: VirtualKeyboard, variants: string) => boolean;
  hideVariantsPanel: (keyboard: VirtualKeyboardInterface) => boolean;
  /**
   * The command invoked when a variant key is pressed:
   * hide the variants panel, then perform the command.
   */
  performVariant: (
    keyboard: VirtualKeyboardInterface,
    command: SelectorPrivate | [SelectorPrivate, ...any[]]
  ) => boolean;

  switchKeyboardLayer: (keyboard: VirtualKeyboardInterface, layer) => boolean;
  shiftKeyboardLayer: (keyboard: VirtualKeyboardInterface) => boolean;
  unshiftKeyboardLayer: (keyboard: VirtualKeyboardInterface) => boolean;
  insertAndUnshiftKeyboardLayer: (
    keyboard: VirtualKeyboardInterface,
    c: string
  ) => boolean;

  /** Toggle the virtual keyboard, but switch to another keyboard layout */
  toggleVirtualKeyboardShift: (keyboard: VirtualKeyboardInterface) => boolean;
}

export type SelectorPrivate = Selector | Keys<CommandsPrivate>;

export type CommandRegistry<T> = Partial<{
  [K in SelectorPrivate]: { fn: (...args: unknown[]) => boolean } & T;
}>;
