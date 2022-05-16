import type { Selector } from '../public/commands';
import {
  mightProducePrintableCharacter,
  eventToChar,
} from '../editor/keyboard';
import {
  countInlineShortcutsStartingWith,
  getInlineShortcut,
} from '../editor/shortcuts';
import { getCommandForKeybinding } from '../editor/keybindings';
import { splitGraphemes } from '../core/grapheme-splitter';
import { HAPTIC_FEEDBACK_DURATION, SelectorPrivate } from '../editor/commands';
import { updateAutocomplete } from './autocomplete';

import { requestUpdate } from './render';

import type { MathfieldPrivate } from './mathfield-private';

import { removeIsolatedSpace, smartMode } from './smartmode';

import {
  getActiveKeyboardLayout,
  validateKeyboardLayout,
} from '../editor/keyboard-layout';
import { ParseMode, Style } from '../public/core';
import { moveAfterParent } from '../editor-model/commands-move';
import { range } from '../editor-model/selection-utils';
import { insertSmartFence } from './mode-editor-math';
import { ModeEditor } from './mode-editor';
import { canVibrate } from '../common/capabilities';
import { showKeystroke } from './keystroke-caption';
import { Atom } from '../core/atom';

/**
 * @param evt - An Event corresponding to the keystroke.
 */
export function onKeystroke(
  mathfield: MathfieldPrivate,
  keystroke: string,
  evt: KeyboardEvent
): boolean {
  const { model } = mathfield;

  // 1. Update the keybindings according to the current keyboard layout

  // 1.1 Possibly update the current keyboard layout based on this event
  validateKeyboardLayout(evt);

  const activeLayout = getActiveKeyboardLayout();
  if (mathfield.keyboardLayout !== activeLayout.id) {
    // console.log('Switching to keyboard layout ' + activeLayout.id);
    mathfield.keyboardLayout = activeLayout.id;
    mathfield._keybindings = undefined;
  }

  // 2. Display the keystroke in the keystroke panel (if visible)
  showKeystroke(mathfield, keystroke);

  // 3. Reset the timer for the keystroke buffer reset
  clearTimeout(mathfield.keystrokeBufferResetTimer);

  // 4. Give a chance to the custom keystroke handler to intercept the event
  // (note that in readonly mode, while you can't modify the content, you
  // can use navigation keys)
  if (
    !mathfield.options.readOnly &&
    mathfield.options.onKeystroke &&
    !mathfield.options.onKeystroke(mathfield, keystroke, evt)
  ) {
    if (evt.preventDefault) {
      evt.preventDefault();
      evt.stopPropagation();
    }

    return false;
  }

  // 5. Let's try to find a matching shortcut or command
  let shortcut: string | undefined;
  let selector: Selector | '' | [Selector, ...any[]] = '';
  let stateIndex: number;
  let resetKeystrokeBuffer = false;

  // 5.1 Check if the keystroke, prefixed with the previously typed keystrokes,
  // would match a long shortcut (i.e. '~~')
  // Ignore the key if Command or Control is pressed (it may be a keybinding,
  // see 5.3)
  if (mathfield.mode !== 'latex' && !evt.ctrlKey && !evt.metaKey) {
    if (keystroke === '[Backspace]') {
      // Special case for backspace to correctly handle undoing
      mathfield.keystrokeBuffer = mathfield.keystrokeBuffer.slice(0, -1);
      mathfield.keystrokeBufferStates.pop();
      mathfield.resetKeystrokeBuffer({ defer: true });
    } else if (!mightProducePrintableCharacter(evt)) {
      // It was a non-alpha character (PageUp, End, etc...)
      mathfield.resetKeystrokeBuffer();
      mathfield.snapshot();
    } else {
      const c = eventToChar(evt);

      // Determine the context to interpret the shortcut, i.e.
      // the set of atoms to the left of the insertion point
      const context = getLeftSiblings(mathfield);

      let multicharSymbol = false;

      // Find the longest substring that matches a shortcut
      const candidate = mathfield.keystrokeBuffer + c;

      // Loop  over possible candidates, from the longest possible, to the shortest
      let i = 0;
      while (!shortcut && i < candidate.length) {
        // At this length (i), what are the left siblings?
        const leftSiblings = getLeftSiblings(
          mathfield,
          mathfield.keystrokeBufferStates.length - (candidate.length - i)
        );

        // Is this an inline shortcut?
        shortcut = getInlineShortcut(
          leftSiblings,
          candidate.slice(i),
          mathfield.options.inlineShortcuts
        );
        console.log(candidate.slice(i), shortcut);

        // If not a shortcut, could this be interpreted as a multichar symbol?
        if (!shortcut && mathfield.mode === 'math') {
          if (context.every((x) => x.type === 'mord')) {
            shortcut = mathfield.options.onMulticharSymbol(
              mathfield,
              candidate.slice(i)
            );
            multicharSymbol = !!shortcut;
          }
        }
        i += 1;
      }

      stateIndex =
        mathfield.keystrokeBufferStates.length - (candidate.length - i);
      mathfield.keystrokeBuffer += c;
      mathfield.keystrokeBufferStates.push(mathfield.getUndoRecord());

      if (
        !multicharSymbol &&
        countInlineShortcutsStartingWith(candidate, mathfield.options) <= 1
      ) {
        // There's only a single shortcut matching this sequence.
        // We can confidently reset the keystroke buffer
        resetKeystrokeBuffer = true;
      } else {
        // There are several potential shortcuts matching this sequence.
        //
        // Don't reset the keystroke buffer yet, but schedule a defered reset,
        // in case some keys typed later disambiguate the desired shortcut.
        //
        // This handles the case with two shortcuts for "sin" and "sinh", to
        // avoid the detecting of the "sin" shortcut from preventing the "sinh"
        // shortcut from ever being triggered.
        mathfield.resetKeystrokeBuffer({ defer: true });
      }
    }
  }

  //
  // 5.2. Should we switch mode?
  //
  // Need to check this before determing if there's a valid shortcut
  // since if we switch to math mode, we may want to apply the shortcut
  // e.g. "slope = rise/run"
  if (mathfield.options.smartMode) {
    const previousMode = mathfield.mode;
    if (shortcut) {
      // If we found a shortcut (e.g. "alpha"),
      // switch to math mode and insert it
      mathfield.mode = 'math';
    } else if (smartMode(mathfield, keystroke, evt)) {
      mathfield.mode = { math: 'text', text: 'math' }[mathfield.mode];
      selector = '';
    }

    // Notify of mode change
    if (
      mathfield.mode !== previousMode &&
      typeof mathfield.options.onModeChange === 'function'
    ) {
      mathfield.options.onModeChange(mathfield, mathfield.mode);
    }
  }

  // 5.3 Check if this matches a keybinding.
  //
  // Need to check this **after** checking for inline shortcuts because
  // Shift+Backquote is a keybinding that inserts "\~"", but "~~" is a
  // shortcut for "\approx" and needs to have priority over Shift+Backquote
  if (!shortcut) {
    if (!selector) {
      selector = getCommandForKeybinding(
        mathfield.keybindings,
        mathfield.mode,
        keystroke
      );
    }

    // 5.4 Handle the return/enter key
    if (!selector && (keystroke === '[Enter]' || keystroke === '[Return]')) {
      // No matching keybinding: trigger a commit
      if (typeof mathfield.options.onCommit === 'function') {
        mathfield.options.onCommit(mathfield);
        if (evt.preventDefault) {
          evt.preventDefault();
          evt.stopPropagation();
        }

        return false;
      }
    }

    if (mathfield.mode === 'math') {
      //
      // 5.5 If this is the Space bar and we're just before or right after
      // a text zone, or if `mathModeSpace` is enabled, insert the space
      //
      if (keystroke === '[Space]') {
        if (mathfield.options.mathModeSpace) {
          mathfield.snapshot();
          ModeEditor.insert('math', model, mathfield.options.mathModeSpace, {
            format: 'latex',
          });
          selector = '';
          mathfield.dirty = true;
          mathfield.scrollIntoView();
          if (evt.preventDefault) {
            evt.preventDefault();
            evt.stopPropagation();
          }
          return true;
        } else {
          const nextSibling = model.at(model.position + 1);
          const previousSibling = model.at(model.position - 1);
          if (
            nextSibling?.mode === 'text' ||
            previousSibling?.mode === 'text'
          ) {
            mathfield.snapshot();
            ModeEditor.insert('text', model, ' ');
            mathfield.dirty = true;
          }
        }
      }

      //
      // 5.6 Handle the decimal separator
      //
      if (eventToChar(evt) === ',') selector = 'insertDecimalSeparator';
    }
  }

  // No shortcut, no selector. We're done.
  if (!shortcut && !selector) return true;

  //
  // 6. Perform the action matching this selector or insert the shortcut
  //

  //
  // 6.1 If we have a `moveAfterParent` selector (usually triggered with
  // `spacebar), and we're at the end of a smart fence, close the fence with
  // an empty (.) right delimiter
  //
  const child = model.at(Math.max(model.position, model.anchor));
  const { parent } = child;
  if (
    selector === 'moveAfterParent' &&
    parent?.type === 'leftright' &&
    child.isLastSibling &&
    mathfield.options.smartFence &&
    insertSmartFence(model, '.', mathfield.style)
  ) {
    // Pressing the space bar (moveAfterParent selector) when at the end
    // of a potential smartFence will close it as a semi-open fence
    selector = '';
    requestUpdate(mathfield); // Re-render the closed smartFence
  }

  //
  // 6.2 If there's a selector, perform it.
  //
  if (selector) {
    mathfield.executeCommand(selector);
  } else if (shortcut) {
    //
    // 6.3 Cancel the (upcoming) composition

    // This is to prevent starting a composition when the keyboard event
    // has already been handled.
    // Example: alt+U -> \cup, but could also be diaeresis deak key (¨) which
    // starts a composition
    //
    mathfield.keyboardDelegate!.cancelComposition();

    //
    // 6.4 Insert the shortcut
    // If the shortcut is a mandatory escape sequence (\}, etc...)
    // don't make it undoable, this would result in syntactically incorrect
    // formulas
    //
    const style: Style = {
      ...model.at(model.position).computedStyle,
      ...mathfield.style,
    };
    if (!/^\\({|}|\[|]|@|#|\$|%|&|\^|_|backslash)$/.test(shortcut)) {
      // To enable the substitution to be undoable,
      // insert the character before applying the substitution
      const saveMode = mathfield.mode;
      ModeEditor.insert(mathfield.mode, model, eventToChar(evt), {
        suppressChangeNotifications: true,
        style,
      });
      // Create a snapshot with the inserted character
      mathfield.snapshot();
      // Revert to the state before the beginning of the shortcut
      // (restore doesn't change the undo stack)
      mathfield.restoreToUndoRecord(
        mathfield.keystrokeBufferStates[stateIndex!]
      );
      mathfield.mode = saveMode;
    }

    model.deferNotifications(
      { content: true, selection: true },
      (): boolean => {
        // Insert the substitute, possibly as a smart fence
        ModeEditor.insert(mathfield.mode, model, shortcut!, {
          format: 'latex',
          style,
          smartFence: true,
        });
        // Check if as a result of the substitution there is now an isolated
        // (text mode) space (surrounded by math). In which case, remove it.
        removeIsolatedSpace(mathfield.model);
        // Switch (back) to text mode if the shortcut ended with a space
        if (shortcut!.endsWith(' ')) {
          mathfield.mode = 'text';
          ModeEditor.insert('text', model, ' ', { style });
        }

        return true; // Content changed
      }
    );
    mathfield.snapshot();
    mathfield.dirty = true; // Mark the field as dirty. It will get rendered in scrollIntoView()
    model.announce('replacement');
    // If we're done with the shortcuts (found a unique one), reset it.
    if (resetKeystrokeBuffer) {
      mathfield.resetKeystrokeBuffer();
    }
  }

  //
  // 7. Make sure the insertion point is scrolled into view
  //
  mathfield.scrollIntoView();

  //
  // 8. Keystroke has been handled, if it wasn't caught in the default
  // case, so prevent propagation
  //
  if (evt.preventDefault) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  return false;
}

/**
 * This handler is invoked when text has been typed, pasted in or input with
 * an input method. As a result, `text` can be a sequence of characters to
 * be inserted.
 * @param {object} options
 * @param {boolean} options.focus - If true, the mathfield will be focused
 * @param {boolean} options.feedback - If true, provide audio and haptic feedback
 * @param {boolean} options.simulateKeystroke - If true, generate some synthetic
 * keystrokes (useful to trigger inline shortcuts, for example)
 * @private
 */
export function onTypedText(
  mathfield: MathfieldPrivate,
  text: string,
  options?: {
    focus?: boolean;
    feedback?: boolean;
    mode?: ParseMode;
    simulateKeystroke?: boolean;
  }
): void {
  const { model } = mathfield;
  if (mathfield.options.readOnly) {
    model.announce('plonk');
    return;
  }
  options = options ?? {};

  //
  // 1/ Focus, then provide audio and haptic feedback
  //
  if (options.focus) {
    mathfield.focus();
  }
  if (options.feedback) {
    if (mathfield.options.keypressVibration && canVibrate()) {
      navigator.vibrate(HAPTIC_FEEDBACK_DURATION);
    }

    mathfield.keypressSound?.play().catch(console.warn);
  }

  //
  // 2/ Switch mode if requested
  //
  if (typeof options.mode === 'string' && mathfield.mode !== options.mode) {
    mathfield.switchMode(options.mode);
  }

  //
  // 3/ Simulate keystroke, if requested
  //
  if (options.simulateKeystroke) {
    // For (const c of text) {
    const c = text.charAt(0);
    const ev = new KeyboardEvent('keypress', { key: c });
    if (!onKeystroke(mathfield, c, ev)) {
      return;
    }
    // }
  }

  //
  // 4/ Insert the specified text at the current insertion point.
  // If the selection is not collapsed, the content will be deleted first.
  //
  const atom = model.at(model.position);
  const style: Style = {
    ...atom.computedStyle,
    ...mathfield.style,
  };
  if (!model.selectionIsCollapsed) {
    model.position = model.deleteAtoms(range(model.selection));
    mathfield.snapshot();
  }

  // Decompose the string into an array of graphemes.
  // This is necessary to correctly process what is displayed as a single
  // glyph (a grapheme) but which is composed of multiple Unicode
  // codepoints. This is the case in particular for some emojis, such as
  // those with a skin tone modifier, the country flags emojis or
  // compound emojis such as the professional emojis, including the
  // David Bowie emoji: 👨🏻‍🎤
  const graphemes = splitGraphemes(text);

  if (mathfield.mode === 'latex') {
    model.deferNotifications({ content: true, selection: true }, () => {
      for (const c of graphemes) {
        ModeEditor.insert('latex', model, c);
      }

      updateAutocomplete(mathfield);
    });
  } else if (mathfield.mode === 'text') {
    for (const c of graphemes) {
      ModeEditor.insert('text', model, c, { style });
    }
  } else if (mathfield.mode === 'math') {
    for (const c of graphemes) {
      // Some characters are mapped to commands. Handle them here.
      // This is important to handle synthetic text input and
      // non-US keyboards, on which, fop example, the '^' key is
      // not mapped to 'Shift-Digit6'.
      let selector:
        | undefined
        | SelectorPrivate
        | [SelectorPrivate, ...unknown[]] = (
        {
          '^': 'moveToSuperscript',
          '_': 'moveToSubscript',
          ' ': 'moveAfterParent',
        } as const
      )[c];
      if (c === ' ' && mathfield.options.mathModeSpace) {
        selector = ['insert', mathfield.options.mathModeSpace];
      }
      if (selector) {
        mathfield.executeCommand(selector);
      } else if (
        /\d/.test(c) &&
        mathfield.options.smartSuperscript &&
        model.at(model.position).treeBranch === 'superscript' &&
        model.at(model.position).hasNoSiblings
      ) {
        // We are inserting a digit into an empty superscript
        // If smartSuperscript is on, insert the digit, and
        // exit the superscript.
        ModeEditor.insert('math', model, c, { style });
        moveAfterParent(model);
      } else {
        // If adding an alphabetic character, and the leftmost atom is an
        // ordinary character, use the same variant/variantStyle (\mathit, \mathrm...)
        if (
          atom.type === 'mord' &&
          /[a-zA-Z]/.test(atom.value) &&
          /[a-zA-Z]/.test(c)
        ) {
          if (atom.style.variant) style.variant = atom.style.variant;
          if (atom.style.variantStyle)
            style.variantStyle = atom.style.variantStyle;
        }

        // General purpose character insertion
        ModeEditor.insert('math', model, c, {
          style,
          smartFence: mathfield.options.smartFence,
        });
      }
    }
  }

  //
  // 5/ Take a snapshot for undo stack
  //
  mathfield.snapshotAndCoalesce();

  //
  // 6/ Render the mathfield
  //
  mathfield.dirty = true;

  // Render and make sure the insertion point is visible
  mathfield.scrollIntoView();
}

function getLeftSiblings(mf: MathfieldPrivate, index = -1): Atom[] {
  const model = mf.model;

  const savedState = mf.getUndoRecord();
  if (index >= 0) mf.restoreToUndoRecord(mf.keystrokeBufferStates[index]);

  let atom = model.at(Math.min(model.position, model.anchor));
  const result: Atom[] = [];
  while (atom.type !== 'first') {
    result.push(atom);
    atom = atom.leftSibling;
  }

  if (index >= 0) mf.restoreToUndoRecord(savedState);

  return result;
}
