import { isArray } from '../common/types';

import { SelectorPrivate, CommandRegistry } from './commands-definitions';

import type { MathfieldPrivate } from '../editor-mathfield/mathfield-private';
import { requestUpdate } from '../editor-mathfield/render';
import {
  updateAutocomplete,
  complete,
  removeSuggestion,
} from '../editor-mathfield/autocomplete';
import { canVibrate } from '../common/capabilities';

export { SelectorPrivate };

// @revisit: move to mathfield.vibrate()
export const HAPTIC_FEEDBACK_DURATION = 3; // In ms

type CommandTarget = 'model' | 'mathfield' | 'virtual-keyboard';

interface RegisterCommandOptions {
  target: CommandTarget;
  category?:
    | 'delete'
    | 'edit' // Changes the content
    | 'array-edit' // Changes the content
    | 'autocomplete'
    | 'clipboard'
    | 'scroll'
    | 'selection-anchor'
    | 'selection-extend'
    | 'speech'
    | 'virtual-keyboard'
    | '';
  audioFeedback?: string;
  canUndo?: boolean;
  changeContent?: boolean; // To update popover
  changeSelection?: boolean; // To update inline shortcut buffer
}

export const COMMANDS: CommandRegistry<RegisterCommandOptions> = {};

/**
 * Register one or more selectors.
 * The selector function return true to request a render update of the expression.
 */
export function register(
  commands: Record<string, (...args: any[]) => boolean>,
  options?: RegisterCommandOptions
): void {
  options = options ?? { target: 'mathfield', canUndo: false };

  for (const selector of Object.keys(commands)) {
    console.assert(!COMMANDS[selector], 'Selector already defined: ', selector);
    COMMANDS[selector] = { ...options, fn: commands[selector] };
  }
}

export function getCommandTarget(
  command: SelectorPrivate | [SelectorPrivate, ...any[]]
): CommandTarget | undefined {
  let selector: SelectorPrivate;

  selector = isArray(command) ? command[0] : command;

  // Convert kebab case (like-this) to camel case (likeThis).
  selector = selector.replace(/-\w/g, (m) =>
    m[1].toUpperCase()
  ) as SelectorPrivate;

  return COMMANDS[selector]?.target;
}

export function perform(
  mathfield: MathfieldPrivate,
  command: SelectorPrivate | [SelectorPrivate, ...any[]]
): boolean {
  if (!command) return false;

  let selector: SelectorPrivate;
  let args: string[] = [];
  let handled = false;
  let dirty = false;

  if (isArray(command)) {
    selector = command[0];
    args = command.slice(1);
  } else selector = command;

  // Convert kebab case (like-this) to camel case (likeThis).
  selector = selector.replace(/-\w/g, (m) =>
    m[1].toUpperCase()
  ) as SelectorPrivate;

  const commandTarget = COMMANDS[selector]?.target;

  // @todo Refactor this method
  // Using commands this way increases code complexity,
  //  ideally all code must be moved under command code, maybe it is
  //  a good idea to implement new Command API with additional hooks
  //  and callbacks to make command code more transparent. Now logic of
  //  commands are splitted between command function, registration options
  //  and there.
  if (commandTarget === 'model') {
    // If in promptLocked (readOnly && selection node within prompt) mode, reject commands that would modify the
    // content.
    if (
      mathfield.promptSelectionLocked &&
      /^(paste|cut|insert|delete|transpose|add)/.test(selector)
    ) {
      mathfield.model.announce('plonk');
      return false;
    }

    if (
      /^(delete|transpose|add)/.test(selector) &&
      selector !== 'deleteBackward'
    )
      mathfield.flushInlineShortcutBuffer();

    if (
      /^(delete|transpose|add)/.test(selector) &&
      mathfield.mode !== 'latex'
    ) {
      // Update the undo state to account for the current selection
      mathfield.popUndoStack();
      mathfield.snapshot();
    }

    if (mathfield.mode === 'latex' && !/^(complete)/.test(selector))
      removeSuggestion(mathfield);

    COMMANDS[selector]!.fn(mathfield.model, ...args);
    if (mathfield.mode !== 'latex' && /^(delete|transpose|add)/.test(selector))
      mathfield.snapshot();

    if (mathfield.mode === 'latex') updateAutocomplete(mathfield);

    dirty = true;
    handled = true;
  } else if (commandTarget === 'virtual-keyboard') {
    dirty = mathfield.virtualKeyboard?.executeCommand(command) ?? false;
    handled = true;
  } else if (COMMANDS[selector]) {
    if (/^(undo|redo)/.test(selector)) mathfield.flushInlineShortcutBuffer();
    dirty = COMMANDS[selector]!.fn(mathfield, ...args);
    handled = true;
  } else throw new Error(`Unknown command "${selector}"`);

  // Virtual keyboard commands do not update mathfield state
  if (commandTarget !== 'virtual-keyboard') {
    // If the command changed the selection so that it is no longer
    // collapsed, or if it was an editing command, reset the inline
    // shortcut buffer and the user style
    if (
      !mathfield.model.selectionIsCollapsed ||
      /^(transpose|paste|complete|((moveToNextChar|moveToPreviousChar|extend).*))_$/.test(
        selector
      )
    ) {
      mathfield.flushInlineShortcutBuffer();
      mathfield.style = {};
    }
  }

  // Render the mathlist
  if (dirty) requestUpdate(mathfield);

  return handled;
}

/**
 * Perform a command, but:
 * * focus the mathfield
 * * provide haptic and audio feedback
 * This is used by the virtual keyboard when command keys (delete, arrows, etc..)
 * are pressed.
 */

export function performWithFeedback(
  mathfield: MathfieldPrivate,
  selector: SelectorPrivate
): boolean {
  // @revisit: have a registry of commands -> sound
  mathfield.focus();
  if (mathfield.options.keypressVibration && canVibrate())
    navigator.vibrate(HAPTIC_FEEDBACK_DURATION);

  // Convert kebab case to camel case.
  selector = selector.replace(/-\w/g, (m) =>
    m[1].toUpperCase()
  ) as SelectorPrivate;
  if (
    selector === 'moveToNextPlaceholder' ||
    selector === 'moveToPreviousPlaceholder' ||
    selector === 'complete'
  )
    mathfield.playSound('return');
  else if (
    selector === 'deleteBackward' ||
    selector === 'deleteForward' ||
    selector === 'deletePreviousWord' ||
    selector === 'deleteNextWord' ||
    selector === 'deleteToGroupStart' ||
    selector === 'deleteToGroupEnd' ||
    selector === 'deleteToMathFieldStart' ||
    selector === 'deleteToMathFieldEnd'
  )
    mathfield.playSound('delete');
  else mathfield.playSound('keypress');

  const result = mathfield.executeCommand(selector);
  mathfield.scrollIntoView();
  return result;
}

register({
  performWithFeedback: (
    mathfield: MathfieldPrivate,
    command: SelectorPrivate
  ): boolean => performWithFeedback(mathfield, command),
});

function nextSuggestion(mathfield: MathfieldPrivate): boolean {
  // The modulo of the suggestionIndex is used to determine which suggestion
  // to display, so no need to worry about rolling over.
  updateAutocomplete(mathfield, { atIndex: mathfield.suggestionIndex + 1 });
  return false;
}

function previousSuggestion(mathfield: MathfieldPrivate): boolean {
  updateAutocomplete(mathfield, { atIndex: mathfield.suggestionIndex - 1 });
  return false;
}

register(
  {
    complete,
    nextSuggestion,
    previousSuggestion,
  },
  { target: 'mathfield', category: 'autocomplete' }
);
