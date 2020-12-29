import type { Keys } from './types-utils';

import type { ParseMode, Style } from './core';
import type {
  InsertOptions,
  Mathfield,
  Model,
  VirtualKeyboardInterface,
} from './mathfield';

/**
 * How much of the formula should be spoken:
 * | | |
 * |---:|:---|
 * | `all` | the entire formula |
 * | `selection` | the selection portion of the formula |
 * | `left` | the element to the left of the selection |
 * | `right` | the element to the right of the selection |
 * | `group` | the group (numerator, root, etc..) the selection is in |
 * | `parent` | the parent of the selection |
 */

export type SpeechScope =
  | 'all'
  | 'selection'
  | 'left'
  | 'right'
  | 'group'
  | 'parent';

// @revisit: maybe a command attribute instead?
/**
 * Commands return true if they resulted in a dirty state
 * @command executeCommand
 */
export interface Commands {
  /**
   * @category Undo/Redo
   */
  undo: (mathfield: Mathfield) => boolean;
  /**
   * @category Undo/Redo
   */
  redo: (mathfield: Mathfield) => boolean;

  /**
   * Perform a command and include interactive feedback such as sound and
   * haptic feedback. This is useful to simulate user interaction,
   * for example for commands from the virtual keyboard
   */
  performWithFeedback: (mathfield: Mathfield, command: string) => boolean;

  commit: (mathfield: Mathfield) => boolean;

  /**
   * @category Auto-complete
   */
  complete: (mathfield: Mathfield) => boolean;
  /**
   * @category Auto-complete
   */
  nextSuggestion: (mathfield: Mathfield) => boolean;
  /**
   * @category Auto-complete
   */
  previousSuggestion: (mathfield: Mathfield) => boolean;

  /**
   * @category Clipboard
   */
  copyToClipboard: (mathfield: Mathfield) => boolean;
  /**
   * @category Clipboard
   */
  cutToClipboard: (mathfield: Mathfield) => boolean;
  /**
   * @category Clipboard
   */
  pasteFromClipboard: (mathfield: Mathfield) => boolean;

  /**
   * @category Scrolling
   */
  scrollIntoView: (mathfield: Mathfield) => boolean;
  /**
   * @category Scrolling
   */
  scrollToStart: (mathfield: Mathfield) => boolean;
  /**
   * @category Scrolling
   */
  scrollToEnd: (mathfield: Mathfield) => boolean;

  toggleKeystrokeCaption: (mathfield: Mathfield) => boolean;

  switchMode: (mathfield: Mathfield, mode: ParseMode) => boolean;
  insert: (mathfield: Mathfield, s: string, options: InsertOptions) => boolean;
  typedText: (
    text: string,
    options: {
      /** If true, the mathfield will be focused */
      focus: boolean;
      /** If true, provide audio and haptic feedback */
      feedback: boolean;
      /** If true, generate some synthetic
       * keystrokes (useful to trigger inline shortcuts, for example).
       */
      simulateKeystroke: boolean;
    }
  ) => boolean;

  speak: (
    mathfield: Mathfield,
    /** {@inheritDoc SpeechScope} */
    scope: SpeechScope,
    options: {
      /**
       * In addition to speaking the requested portion of the formula,
       * visually highlight it as it is read (read aloud functionality)
       */
      withHighlighting: boolean;
    }
  ) => boolean;

  /**
   * @category Array
   */
  addRowAfter: (model: Model) => boolean;
  /**
   * @category Array
   */
  addColumnAfter: (model: Model) => boolean;
  /**
   * @category Array
   */
  addRowBefore: (model: Model) => boolean;
  /**
   * @category Array
   */
  addColumnBefore: (model: Model) => boolean;

  /**
   * @category Deleting
   */
  deleteAll: (model: Model) => boolean;

  /**
   * @category Deleting
   */
  deleteForward: (model: Model) => boolean;

  /**
   * @category Deleting
   */
  deleteBackward: (model: Model) => boolean;

  /**
   * @category Deleting
   */
  deleteNextWord: (model: Model) => boolean;

  /**
   * @category Deleting
   */
  deletePreviousWord: (model: Model) => boolean;
  /**
   * @category Deleting
   */
  deleteToGroupStart: (model: Model) => boolean;
  /**
   * @category Deleting
   */
  deleteToGroupEnd: (model: Model) => boolean;
  /**
   * @category Deleting
   */
  deleteToMathFieldStart: (model: Model) => boolean;
  /**
   * @category Deleting
   */
  deleteToMathFieldEnd: (model: Model) => boolean;

  /**
   * @category Selection
   */
  moveToOpposite: (model: Model) => boolean;
  /**
   * @category Selection
   */
  moveBeforeParent: (model: Model) => boolean;
  /**
   * @category Selection
   */
  moveAfterParent: (model: Model) => boolean;
  /**
   * @category Selection
   */
  moveToNextPlaceholder: (model: Model) => boolean;
  /**
   * @category Selection
   */
  moveToPreviousPlaceholder: (model: Model) => boolean;
  /**
   * @category Selection
   */
  moveToNextChar: (model: Model) => boolean;
  /**
   * @category Selection
   */
  moveToPreviousChar: (model: Model) => boolean;
  /**
   * @category Selection
   */
  moveUp: (model: Model) => boolean;
  /**
   * @category Selection
   */
  moveDown: (model: Model) => boolean;
  /**
   * @category Selection
   */
  moveToNextWord: (model: Model) => boolean;
  /**
   * @category Selection
   */
  moveToPreviousWord: (model: Model) => boolean;

  /**
   * @category Selection
   */
  moveToGroupStart: (model: Model) => boolean;
  /**
   * @category Selection
   */
  moveToGroupEnd: (model: Model) => boolean;
  /**
   * @category Selection
   */
  moveToMathFieldStart: (model: Model) => boolean;
  /**
   * @category Selection
   */
  moveToMathFieldEnd: (model: Model) => boolean;
  /**
   * @category Selection
   */
  moveToSuperscript: (model: Model) => boolean;
  /**
   * @category Selection
   */
  moveToSubscript: (model: Model) => boolean;

  /**
   * @category Selection
   */
  selectGroup: (model: Model) => boolean;
  /**
   * @category Selection
   */
  selectAll: (model: Model) => boolean;
  /**
   * @category Selection
   */
  extendSelectionForward: (model: Model) => boolean;
  /**
   * @category Selection
   */
  extendSelectionBackward: (model: Model) => boolean;
  /**
   * @category Selection
   */
  extendToNextWord: (model: Model) => boolean;
  /**
   * @category Selection
   */
  extendToPreviousWord: (model: Model) => boolean;
  /**
   * @category Selection
   */
  extendSelectionUpward: (model: Model) => boolean;
  /**
   * @category Selection
   */
  extendSelectionDownward: (model: Model) => boolean;
  /**
   * @category Selection
   */
  extendToNextBoundary: (model: Model) => boolean;
  /**
   * @category Selection
   */
  extendToPreviousBoundary: (model: Model) => boolean;
  /**
   * @category Selection
   */
  extendToGroupStart: (model: Model) => boolean;
  /**
   * @category Selection
   */
  extendToGroupEnd: (model: Model) => boolean;
  /**
   * @category Selection
   */
  extendToMathFieldStart: (model: Model) => boolean;
  /**
   * @category Selection
   */
  extendToMathFieldEnd: (model: Model) => boolean;

  applyStyle: (mathfield: Mathfield, style: Style) => boolean;

  /**
   * @category Virtual Keyboard
   */
  toggleVirtualKeyboard: (
    keyboard: VirtualKeyboardInterface,
    theme: 'apple' | 'material' | ''
  ) => boolean;
  /**
   * @category Virtual Keyboard
   */
  hideVirtualKeyboard: (keyboard: VirtualKeyboardInterface) => boolean;
  /**
   * @category Virtual Keyboard
   */
  showVirtualKeyboard: (
    keyboard: VirtualKeyboardInterface,
    theme: 'apple' | 'material' | ''
  ) => boolean;
}

export type Selector = Keys<Commands>;
