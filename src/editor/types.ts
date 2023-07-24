import { Selector } from '../public/commands';
import { Keys } from '../public/types-utils';

import type { VirtualKeyboardCommands } from '../public/virtual-keyboard';

export type SelectorPrivate = Selector | Keys<VirtualKeyboardCommands>;

export type ExecuteCommandFunction = (
  command: SelectorPrivate | [SelectorPrivate, ...any[]]
) => boolean;

export type CommandRegistry<T> = Partial<{
  [K in SelectorPrivate]: { fn: (...args: unknown[]) => boolean } & T;
}>;
