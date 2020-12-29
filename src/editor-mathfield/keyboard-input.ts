import type { Selector } from '../public/commands';
import { Atom } from '../core/atom-class';
import { parseLatex } from '../core/parser';
import {
  mightProducePrintableCharacter,
  eventToChar,
} from '../editor/keyboard';
import {
  getInlineShortcutsStartingWith,
  getInlineShortcut,
} from '../editor/shortcuts';
import {
  getCommandForKeybinding,
  getKeybindingMarkup,
  normalizeKeybindings,
} from '../editor/keybindings';
import { splitGraphemes } from '../core/grapheme-splitter';
import { HAPTIC_FEEDBACK_DURATION } from '../editor/commands';
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

export function showKeystroke(
  mathfield: MathfieldPrivate,
  keystroke: string
): void {
  const vb = mathfield.keystrokeCaption;
  if (vb && mathfield.keystrokeCaptionVisible) {
    const bounds = mathfield.element.getBoundingClientRect();
    vb.style.left = `${bounds.left}px`;
    vb.style.top = `${bounds.top - 64}px`;
    vb.innerHTML = mathfield.options.createHTML(
      '<span>' +
        (getKeybindingMarkup(keystroke) || keystroke) +
        '</span>' +
        vb.innerHTML
    );
    vb.style.visibility = 'visible';
    setTimeout(() => {
      if (vb.childNodes.length > 0) {
        vb.childNodes[vb.childNodes.length - 1].remove();
      }

      if (vb.childNodes.length === 0) {
        vb.style.visibility = 'hidden';
      }
    }, 3000);
  }
}

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
    // Console.log('Switching to keyboard layout ' + activeLayout.id);
    mathfield.keyboardLayout = activeLayout.id;
    mathfield.keybindings = normalizeKeybindings(
      mathfield.options.keybindings,
      (error) => {
        if (typeof mathfield.options.onError === 'function') {
          mathfield.options.onError({
            code: 'invalid-keybinding',
            arg: error.join('\n'),
          });
        }

        console.log(error.join('\n'));
      }
    );
  }

  // 2. Display the keystroke in the keystroke panel (if visible)
  showKeystroke(mathfield, keystroke);

  // 3. Reset the timer for the keystroke buffer reset
  clearTimeout(mathfield.keystrokeBufferResetTimer);

  // 4. Give a chance to the custom keystroke handler to intercept the event
  if (
    mathfield.options.onKeystroke &&
    !mathfield.options.onKeystroke(mathfield, keystroke, evt)
  ) {
    if (evt?.preventDefault) {
      evt.preventDefault();
      evt.stopPropagation();
    }

    return false;
  }

  // 5. Let's try to find a matching shortcut or command
  let shortcut: string;
  let stateIndex: number;
  let selector: Selector | '' | [Selector, ...any[]];
  let resetKeystrokeBuffer = false;
  // 5.1 Check if the keystroke, prefixed with the previously typed keystrokes,
  // would match a long shortcut (i.e. '~~')
  // Ignore the key if command or control is pressed (it may be a keybinding,
  // see 5.3)
  if (mathfield.mode !== 'latex' && (!evt || (!evt.ctrlKey && !evt.metaKey))) {
    if (keystroke === '[Backspace]') {
      // Special case for backspace
      mathfield.keystrokeBuffer = mathfield.keystrokeBuffer.slice(0, -1);
      mathfield.keystrokeBufferStates.pop();
      mathfield.resetKeystrokeBuffer({ defer: true });
    } else if (!mightProducePrintableCharacter(evt)) {
      // It was a non-alpha character (PageUp, End, etc...)
      mathfield.resetKeystrokeBuffer();
    } else {
      const c = eventToChar(evt);
      // Find the longest substring that matches a shortcut
      const candidate = mathfield.keystrokeBuffer + c;
      let i = 0;
      while (!shortcut && i < candidate.length) {
        const context: Atom[] = mathfield.keystrokeBufferStates[i]
          ? parseLatex(
              mathfield.keystrokeBufferStates[i].latex,
              mathfield.options.defaultMode,
              null,
              mathfield.options.macros
            )
          : // The context is from the start of the group to the current position
            model.getAtoms(
              model.offsetOf(model.at(model.position).firstSibling),
              model.position
            );
        shortcut = getInlineShortcut(
          context,
          candidate.slice(i),
          mathfield.options.inlineShortcuts
        );
        i += 1;
      }

      stateIndex =
        mathfield.keystrokeBufferStates.length - (candidate.length - i);
      mathfield.keystrokeBuffer += c;
      mathfield.keystrokeBufferStates.push(mathfield.getUndoRecord());
      if (
        getInlineShortcutsStartingWith(candidate, mathfield.options).length <= 1
      ) {
        // There's only a single shortcut matching this sequence.
        // We can confidently reset the keystroke buffer
        resetKeystrokeBuffer = true;
      } else {
        // There are several potential shortcuts matching this sequence
        // Don't reset the keystroke buffer yet, in case some
        // keys typed later disambiguate the desirted shortcut,
        // but schedule a defered reset. This handles the case if there
        // was a shortcut for "sin" and "sinh", to avoid the detecting
        // of the "sin" shortcut from ever having the "sinh" shortcut
        // triggered.
        mathfield.resetKeystrokeBuffer({ defer: true });
      }
    }
  }

  // 5.2. Should we switch mode?
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

  // 5.3 Check if this matches a keybinding
  // Need to check this **after** checking for inline shortcuts because
  // shift+backquote is a keybinding that inserts "\~"", but "~~" is a
  // shortcut for "\approx" and needs to have priority over shift+backquote
  if (!shortcut && !selector) {
    selector = getCommandForKeybinding(
      mathfield.keybindings,
      mathfield.mode,
      keystroke
    );
  }

  if (
    !shortcut &&
    !selector &&
    (keystroke === '[Enter]' || keystroke === '[Return]')
  ) {
    // No matching keybinding: trigger a commit
    if (typeof mathfield.options.onCommit === 'function') {
      mathfield.options.onCommit(mathfield);
      if (evt?.preventDefault) {
        evt.preventDefault();
        evt.stopPropagation();
      }

      return false;
    }
  }

  // No shortcut :( We're done.
  if (!shortcut && !selector) {
    return true;
  }

  if (mathfield.options.readOnly && selector[0] === 'insert') {
    return true;
  }

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
    parent &&
    parent.type === 'leftright' &&
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
  // 6.2 If this is the Spacebar and we're just before or right after
  // a text zone, insert the space inside the text zone
  //
  if (mathfield.mode === 'math' && keystroke === '[Spacebar]' && !shortcut) {
    const nextSibling = model.at(model.position + 1);
    const previousSibling = model.at(model.position - 1);
    if (
      (nextSibling && nextSibling.mode === 'text') ||
      (previousSibling && previousSibling.mode === 'text')
    ) {
      ModeEditor.insert('text', model, ' ');
    }
  }

  //
  // 6.3 If there's a selector, perform it.
  //
  if (selector) {
    mathfield.executeCommand(selector);
  } else if (shortcut) {
    //
    // 6.5 Cancel the (upcoming) composition

    // This is to prevent starting a composition when the keyboard event
    // has already been handled.
    // Example: alt+U -> \cup, but could also be diaeresis deak key (¨) which
    // starts a composition
    //
    mathfield.keyboardDelegate.cancelComposition();

    //
    // 6.6 Insert the shortcut
    // If the shortcut is a mandatory escape sequence (\}, etc...)
    // don't make it undoable, this would result in syntactically incorrect
    // formulas
    //
    const style: Style = {
      ...model.at(model.position).computedStyle,
      ...mathfield.style,
    };
    if (
      !/^(\\{|\\}|\\[|\\]|\\@|\\#|\\$|\\%|\\^|\\_|\\backslash)$/.test(shortcut)
    ) {
      // To enable the substitution to be undoable,
      // insert the character before applying the substitution
      const saveMode = mathfield.mode;
      ModeEditor.insert(mathfield.mode, model, eventToChar(evt), {
        suppressChangeNotifications: true,
        style,
      });
      // Create a snapshot with the inserted character
      mathfield.snapshotAndCoalesce();
      // Revert to the state before the beginning of the shortcut
      // (restore doesn't change the undo stack)
      mathfield.restoreToUndoRecord(
        mathfield.keystrokeBufferStates[stateIndex]
      );
      mathfield.mode = saveMode;
    }

    model.deferNotifications(
      { content: true, selection: true },
      (): boolean => {
        // Insert the substitute, possibly as a smart fence
        ModeEditor.insert(mathfield.mode, model, shortcut, {
          format: 'latex',
          style,
          smartFence: true,
        });
        // Check if as a result of the substitution there is now an isolated
        // (text mode) space (surrounded by math). In which case, remove it.
        removeIsolatedSpace(mathfield.model);
        // Switch (back) to text mode if the shortcut ended with a space
        if (shortcut.endsWith(' ')) {
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
  if (evt?.preventDefault) {
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
    if (mathfield.options.keypressVibration && navigator?.vibrate) {
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

  const style: Style = {
    ...model.at(model.position).computedStyle,
    // Variant: 'main',
    ...mathfield.style,
  };
  if (!model.selectionIsCollapsed) {
    model.position = model.deleteAtoms(range(model.selection));
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
      // not mapped to  'Shift-Digit6'.
      const selector = {
        '^': 'moveToSuperscript',
        '_': 'moveToSubscript',
        ' ': 'moveAfterParent',
      }[c];
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
