import { isArray } from '../common/types';

import { SelectorPrivate, CommandRegistry } from './types';

import type { _Mathfield } from '../editor-mathfield/mathfield-private';
import { requestUpdate } from '../editor-mathfield/render';
import {
  updateAutocomplete,
  complete,
  removeSuggestion,
} from '../editor-mathfield/autocomplete';
import { canVibrate } from '../ui/utils/capabilities';
import MathfieldElement from '../public/mathfield-element';

export { SelectorPrivate };

// @revisit: move to mathfield.vibrate()
export const HAPTIC_FEEDBACK_DURATION = 3; // In ms

type CommandTarget = 'model' | 'mathfield' | 'virtual-keyboard';

interface CommandOptions {
  target: CommandTarget;
  audioFeedback?: 'keypress' | 'spacebar' | 'delete' | 'plonk' | 'return';
  canUndo?: boolean;
  changeContent?: boolean; // To update popover
  changeSelection?: boolean; // To update inline shortcut buffer
}

export let COMMANDS: CommandRegistry<CommandOptions>;

/**
 * Register one or more selectors.
 * The selector function return true to request a render update of the expression.
 */
export function register(
  commands: Record<string, (...args: any[]) => boolean>,
  options?: CommandOptions
): void {
  options = {
    target: 'mathfield',
    canUndo: false,
    audioFeedback: undefined,
    changeContent: false,
    changeSelection: false,
    ...(options ?? {}),
  };

  if (!COMMANDS) COMMANDS = {};

  for (const selector of Object.keys(commands)) {
    console.assert(!COMMANDS[selector], 'Selector already defined: ', selector);
    COMMANDS[selector] = { ...options, fn: commands[selector] };
  }
}

function getCommandInfo(
  command: SelectorPrivate | [SelectorPrivate, ...any[]]
): CommandOptions | undefined {
  let selector: SelectorPrivate;

  if (Array.isArray(command)) {
    if (command[0] === 'performWithFeedback') return getCommandInfo(command[1]);
    selector = command[0];
  } else selector = command;

  return COMMANDS[selector];
}

export function getCommandTarget(
  command: SelectorPrivate | [SelectorPrivate, ...any[]]
): CommandTarget | undefined {
  return getCommandInfo(command)?.target;
}

export function perform(
  mathfield: _Mathfield,
  command: SelectorPrivate | [SelectorPrivate, ...any[]] | undefined
): boolean {
  command = parseCommand(command);

  if (!command) return false;

  let selector: SelectorPrivate;
  let args: string[] = [];
  let handled = false;
  let dirty = false;

  if (isArray(command)) {
    selector = command[0];
    args = command.slice(1);
  } else selector = command;

  const info = COMMANDS[selector];
  const commandTarget = info?.target;

  if (commandTarget === 'model') {
    // If in promptLocked (readOnly && selection node within prompt) mode,
    // reject commands that would modify the content.
    if (!mathfield.isSelectionEditable && info?.changeContent) {
      mathfield.model.announce('plonk');
      return false;
    }

    if (/^(delete|add)/.test(selector)) {
      if (selector !== 'deleteBackward') mathfield.flushInlineShortcutBuffer();
      mathfield.snapshot(selector);
    }

    if (!/^complete/.test(selector)) removeSuggestion(mathfield);

    COMMANDS[selector]!.fn(mathfield.model, ...args);

    updateAutocomplete(mathfield);

    dirty = true;
    handled = true;
  } else if (commandTarget === 'virtual-keyboard') {
    dirty = window.mathVirtualKeyboard?.executeCommand(command) ?? false;
    handled = true;
  } else if (COMMANDS[selector]) {
    if (!mathfield.isSelectionEditable && info?.changeContent) {
      mathfield.model.announce('plonk');
      return false;
    }
    if (/^(undo|redo)/.test(selector)) mathfield.flushInlineShortcutBuffer();
    dirty = COMMANDS[selector]!.fn(mathfield, ...args);
    handled = true;
  } else throw new Error(`Unknown command "${selector}"`);

  // Virtual keyboard commands do not update mathfield state
  if (commandTarget !== 'virtual-keyboard') {
    // If the command changed the selection so that it is no longer
    // collapsed, or if it was an editing command (but not backspace,
    // which is handled separately), reset the inline shortcut buffer and
    // the user style
    if (
      !mathfield.model.selectionIsCollapsed ||
      (info?.changeSelection && selector !== 'deleteBackward')
    ) {
      mathfield.flushInlineShortcutBuffer();
      if (!info?.changeContent) mathfield.stopCoalescingUndo();
      mathfield.defaultStyle = {};
    }
  }

  // Render the mathfield
  if (dirty) requestUpdate(mathfield);

  return handled;
}

/**
 * Perform a command, but:
 * * focus the mathfield
 * * provide haptic and audio feedback
 * This is used by the virtual keyboard when command keys (delete, arrows,
 *  etc..) are pressed.
 */

function performWithFeedback(
  mathfield: _Mathfield | undefined,
  selector: SelectorPrivate
): boolean {
  if (!mathfield) return false;
  mathfield.focus();

  if (MathfieldElement.keypressVibration && canVibrate())
    navigator.vibrate(HAPTIC_FEEDBACK_DURATION);

  const info = getCommandInfo(selector);
  globalThis.MathfieldElement.playSound(info?.audioFeedback ?? 'keypress');

  const result = mathfield.executeCommand(selector);
  mathfield.scrollIntoView();
  return result;
}

register({
  performWithFeedback: (
    mathfield: _Mathfield,
    command: SelectorPrivate
  ): boolean => performWithFeedback(mathfield, command),
});

function nextSuggestion(mathfield: _Mathfield): boolean {
  // The modulo of the suggestionIndex is used to determine which suggestion
  // to display, so no need to worry about rolling over.
  updateAutocomplete(mathfield, { atIndex: mathfield.suggestionIndex + 1 });
  return false;
}

function previousSuggestion(mathfield: _Mathfield): boolean {
  updateAutocomplete(mathfield, { atIndex: mathfield.suggestionIndex - 1 });
  return false;
}

register(
  { complete },
  {
    target: 'mathfield',
    audioFeedback: 'return',
    canUndo: true,
    changeContent: true,
    changeSelection: true,
  }
);

register(
  { nextSuggestion, previousSuggestion },
  {
    target: 'mathfield',
    audioFeedback: 'keypress',
    changeSelection: true,
  }
);

/**
 * A command can be a string or an array of strings.
 * - string: `selector(arg1, arg2)`
 * - array: `['selector', arg1, arg2]`
 *
 * In both cases, the selector can be in kebab or camel case.
 *
 */
export function parseCommand(
  command: undefined | string | [string, ...any[]]
): [SelectorPrivate, ...any[]] | undefined {
  if (!command) return undefined;
  if (isArray(command) && command.length > 0) {
    let selector = command[0];
    // Convert kebab case (like-this) to camel case (likeThis).
    selector.replace(/-\w/g, (m) => m[1].toUpperCase());
    if (selector === 'performWithFeedback' && command.length === 2) {
      return [selector, parseCommand(command[1])];
    }
    return [selector as SelectorPrivate, ...command.slice(1)];
  }

  // Is it a string of the form `selector(arg1, arg2)`?
  if (typeof command !== 'string') return undefined;

  const match = command.trim().match(/^([a-zA-Z0-9-]+)\((.*)\)$/);
  if (match) {
    const selector = match[1];
    selector.replace(/-\w/g, (m) => m[1].toUpperCase());
    let args = match[2].split(',').map((x) => x.trim());
    return [
      selector as SelectorPrivate,
      ...args.map((arg) => {
        if (/"[^"]*"/.test(arg)) return arg.slice(1, -1);
        if (/'[^']*'/.test(arg)) return arg.slice(1, -1);
        if (/^true$/.test(arg)) return true;
        if (/^false$/.test(arg)) return false;
        if (/^[-]?\d+$/.test(arg)) return parseInt(arg, 10);
        // Is it an object literal?
        if (/^\{.*\}$/.test(arg)) {
          try {
            return JSON.parse(arg);
          } catch (e) {
            console.error('Invalid argument:', arg);
            return arg;
          }
        }
        return parseCommand(arg);
      }),
    ];
  }

  let selector = command;
  selector.replace(/-\w/g, (m) => m[1].toUpperCase());

  return [selector as SelectorPrivate];
}
