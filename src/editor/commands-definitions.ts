import { Keys } from '../public/types-utils';

import { Selector } from '../public/commands';
import { VirtualKeyboardInterface } from '../public/mathfield';

export type ExecuteCommandFunction = (
  command: SelectorPrivate | [SelectorPrivate, ...any[]]
) => boolean;

// Commands return true if they resulted in a dirty state
// @revisit: maybe a command attribute instead?
export interface CommandsPrivate {
  hideAlternateKeys: (keyboard: VirtualKeyboardInterface) => boolean;
  /**
   * The command invoked when an alternate key is pressed.
   * We need to hide the Alternate Keys panel, then perform the
   * command.
   */
  performAlternateKeys: (
    keyboard: VirtualKeyboardInterface,
    command
  ) => boolean;

  switchKeyboardLayer: (keyboard: VirtualKeyboardInterface, layer) => boolean;
  unshiftKeyboardLayer: (keyboard: VirtualKeyboardInterface) => boolean;
  insertAndUnshiftKeyboardLayer: (
    keyboard: VirtualKeyboardInterface,
    c
  ) => boolean;

  /** Toggle the virtual keyboard, but switch to the alternate theme if available */
  toggleVirtualKeyboardAlt: (keyboard: VirtualKeyboardInterface) => boolean;

  /** Toggle the virtual keyboard, but switch another keyboard layout */
  toggleVirtualKeyboardShift: (keyboard: VirtualKeyboardInterface) => boolean;

  onUndoStateChanged: (
    keyboard: VirtualKeyboardInterface,
    canUndoState: boolean,
    canRedoState: boolean
  ) => boolean;
}

export type SelectorPrivate = Selector | Keys<CommandsPrivate>;

export type CommandRegistry<T> = Partial<
  { [K in SelectorPrivate]: { fn: (...args: any[]) => boolean } & T }
>;
