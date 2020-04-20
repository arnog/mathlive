import { Keys } from './types-utils';

import { ParseMode } from './core';
import { Mathfield } from './mathfield';
import { Model } from './model';

export type SpeechScope =
    | 'all'
    | 'selection'
    | 'left'
    | 'right'
    | 'group'
    | 'parent';

// Commands return true if they resulted in a dirty state
// @revisit: maybe a command attribute instead?
export interface Commands {
    undo: (mathfield: Mathfield) => boolean;
    redo: (mathfield: Mathfield) => boolean;

    performWithFeedback: (mathfield: Mathfield, command: string) => boolean;

    complete: (mathfield: Mathfield) => boolean;
    nextSuggestion: (mathfield: Mathfield) => boolean;
    previousSuggestion: (mathfield: Mathfield) => boolean;
    copyToClipboard: (mathfield: Mathfield) => boolean;
    cutToClipboard: (mathfield: Mathfield) => boolean;
    pasteFromClipboard: (mathfield: Mathfield) => boolean;

    scrollIntoView: (mathfield: Mathfield) => boolean;
    scrollToStart: (mathfield: Mathfield) => boolean;
    scrollToEnd: (mathfield: Mathfield) => boolean;
    enterCommandMode: (mathfield: Mathfield) => boolean;
    toggleKeystrokeCaption: (mathfield: Mathfield) => boolean;

    switchMode: (mathfield: Mathfield, mode: ParseMode) => boolean;
    insert: (mathfield: Mathfield, s: string, options) => boolean;
    /**
     *
     * @param {string} text
     * @param {object} [options]
     * @param {boolean} [options.focus] - If true, the mathfield will be focused.
     * @param {boolean} [options.feedback] - If true, provide audio and haptic feedback.
     * @param {boolean} [options.simulateKeystroke] - If true, generate some synthetic
     * keystrokes (useful to trigger inline shortcuts, for example).
     */
    typedText: (text, options) => boolean;

    speak: (
        mathfield: Mathfield,
        scope: SpeechScope,
        options: { withHighlighting: boolean }
    ) => boolean;

    addRowAfter: (model: Model) => boolean;
    addColumnAfter: (model: Model) => boolean;
    addRowBefore: (model: Model) => boolean;
    addColumnBefore: (model: Model) => boolean;

    deleteAll: (model: Model) => boolean;

    moveToOpposite: (model: Model) => boolean;
    moveBeforeParent: (model: Model) => boolean;
    moveAfterParent: (model: Model) => boolean;
    moveToNextPlaceholder: (model: Model) => boolean;
    moveToPreviousPlaceholder: (model: Model) => boolean;
    moveToNextChar: (model: Model) => boolean;
    moveToPreviousChar: (model: Model) => boolean;
    moveUp: (model: Model) => boolean;
    moveDown: (model: Model) => boolean;
    moveToNextWord: (model: Model) => boolean;
    moveToPreviousWord: (model: Model) => boolean;

    moveToGroupStart: (model: Model) => boolean;
    moveToGroupEnd: (model: Model) => boolean;
    moveToMathFieldStart: (model: Model) => boolean;
    moveToMathFieldEnd: (model: Model) => boolean;
    moveToSuperscript: (model: Model) => boolean;

    selectGroup: (model: Model) => boolean;
    selectAll: (model: Model) => boolean;
    extendToNextChar: (model: Model) => boolean;
    extendToPreviousChar: (model: Model) => boolean;
    extendToNextWord: (model: Model) => boolean;
    extendToPreviousWord: (model: Model) => boolean;
    extendUp: (model: Model) => boolean;
    extendDown: (model: Model) => boolean;
    extendToNextBoundary: (model: Model) => boolean;
    extendToPreviousBoundary: (model: Model) => boolean;
    extendToGroupStart: (model: Model) => boolean;
    extendToGroupEnd: (model: Model) => boolean;
    extendToMathFieldStart: (model: Model) => boolean;
    extendToMathFieldEnd: (model: Model) => boolean;
}

export type Selector = Keys<Commands>;
