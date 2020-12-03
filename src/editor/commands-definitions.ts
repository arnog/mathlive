import { Mathfield } from '../public/mathfield';
import { Keys } from '../public/types-utils';

import { Commands } from '../public/commands';

// Commands return true if they resulted in a dirty state
// @revisit: maybe a command attribute instead?
export interface CommandsPrivate {
    hideAlternateKeys: (mathfield: Mathfield) => boolean;
    /**
     * The command invoked when an alternate key is pressed.
     * We need to hide the Alternate Keys panel, then perform the
     * command.
     */
    performAlternateKeys: (mathfield: Mathfield, command) => boolean;

    switchKeyboardLayer: (mathfield: Mathfield, layer) => boolean;
    unshiftKeyboardLayer: (mathfield: Mathfield) => boolean;
    insertAndUnshiftKeyboardLayer: (mathfield: Mathfield, c) => boolean;

    /** Toggle the virtual keyboard, but switch to the alternate theme if available */
    toggleVirtualKeyboardAlt: (mathfield: Mathfield) => boolean;

    /** Toggle the virtual keyboard, but switch another keyboard layout */
    toggleVirtualKeyboardShift: (mathfield: Mathfield) => boolean;

    updateUndoRedoButtons: (
        mathfield: Mathfield,
        canUndoState: boolean,
        canRedoState: boolean
    ) => boolean;
}

export type SelectorPrivate = Keys<Commands & CommandsPrivate>;

export type CommandRegistry<T> = Partial<
    { [K in SelectorPrivate]: { fn: (...args: any[]) => boolean } & T }
>;
