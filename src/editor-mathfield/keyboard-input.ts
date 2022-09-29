import type { Selector } from '../public/commands';
import { ParseMode, Style } from '../public/core';

import { canVibrate } from '../common/capabilities';

import { splitGraphemes } from '../core/grapheme-splitter';
import { Atom } from '../core/atom';

import {
  mightProducePrintableCharacter,
  eventToChar,
} from '../editor/keyboard';
import { getInlineShortcut } from '../editor/shortcuts';
import { getCommandForKeybinding } from '../editor/keybindings';
import { HAPTIC_FEEDBACK_DURATION, SelectorPrivate } from '../editor/commands';
import {
  getActiveKeyboardLayout,
  validateKeyboardLayout,
} from '../editor/keyboard-layout';

import { moveAfterParent } from '../editor-model/commands-move';
import { contentDidChange, contentWillChange } from '../editor-model/listeners';
import { range } from '../editor-model/selection-utils';

import { removeSuggestion, updateAutocomplete } from './autocomplete';
import { requestUpdate } from './render';
import type { MathfieldPrivate } from './mathfield-private';
import { removeIsolatedSpace, smartMode } from './smartmode';
import { showKeystroke } from './keystroke-caption';
import { ModeEditor } from './mode-editor';
import { insertSmartFence } from './mode-editor-math';

/**
 * Handler in response to a keystroke event.
 *
 * Return `false` if the event has been handled as a shortcut or command and
 * need no further processing.
 *
 * Return `true` if the event should be handled as a regular textual input.
 *
 *
 * Theory of Operation
 *
 * When the user types on the keyboard, printable keys (i.e. not arrows, shift,
 * escape, etc...) are captured in a `keystrokeBuffer`.
 *
 * The buffer is used to determine if the user intended to type an
 * inline shortcut (e.g. "pi" for `\pi`) or a multichar symbol.
 *
 * Characters are added to this buffer while the user type printable characters
 * consecutively. If the user change selection (with the mouse, or by
 * navigating with the keyboard), if an unambiguous match for the buffer is
 * found, the buffer is cleared.
 *
 * Associated with this buffer are `states`
 *
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
    mathfield.keyboardLayout = activeLayout.id;
    // If we changed keyboard layout, we'll have to recache the keybindings
    mathfield._keybindings = undefined;
  }

  // 2. Clear the timer for the keystroke buffer reset
  clearTimeout(mathfield.inlineShortcutBufferFlushTimer);
  mathfield.inlineShortcutBufferFlushTimer = 0;

  // 3. Display the keystroke in the keystroke panel (if visible)
  showKeystroke(mathfield, keystroke);

  // If the event has already been handled, return
  if (evt.defaultPrevented) {
    mathfield.flushInlineShortcutBuffer();
    return false;
  }

  // 4. Let's try to find a matching inline shortcut
  let shortcut: string | undefined;
  let selector: Selector | '' | [Selector, ...any[]] = '';
  let stateIndex: number;

  // 4.1 Check if the keystroke, prefixed with the previously typed keystrokes,
  // would match a long shortcut (i.e. '~~')
  // Ignore the key if Command or Control is pressed (it may be a keybinding,
  // see 4.3)
  if (!mathfield.options.readOnly) {
    if (mathfield.mode === 'math' && !evt.ctrlKey && !evt.metaKey) {
      if (keystroke === '[Backspace]') {
        // Special case for backspace to correctly handle undoing
        mathfield.inlineShortcutBuffer.pop();
        mathfield.flushInlineShortcutBuffer({ defer: true });
      } else if (!mightProducePrintableCharacter(evt)) {
        // It was a non-alpha character (PageUp, End, etc...)
        mathfield.flushInlineShortcutBuffer();
        mathfield.snapshot();
      } else {
        const c = eventToChar(evt);

        // Find the longest substring that matches a shortcut
        const keystrokes =
          (mathfield.inlineShortcutBuffer[
            mathfield.inlineShortcutBuffer.length - 1
          ]?.keystrokes ?? '') + c;
        mathfield.inlineShortcutBuffer.push({
          state: model.getState(),
          keystrokes,
          leftSiblings: getLeftSiblings(mathfield),
        });

        // Loop  over possible candidates, from the longest possible, to the shortest
        let i = 0;
        let candidate = '';
        while (!shortcut && i < keystrokes.length) {
          stateIndex =
            mathfield.inlineShortcutBuffer.length - (keystrokes.length - i);
          candidate = keystrokes.slice(i);
          const leftSiblings =
            mathfield.inlineShortcutBuffer[stateIndex].leftSiblings;

          // Is this an inline shortcut?
          shortcut = getInlineShortcut(
            leftSiblings,
            candidate,
            mathfield.options.inlineShortcuts
          );

          // Could this be interpreted as a multichar symbol or other complex
          // inline shortcut
          if (
            !shortcut &&
            /^[a-zA-Z][a-zA-Z0-9]+'?([_\^][a-zA-Z0-9\*\+\-]'?)?$/.test(
              candidate
            )
          )
            shortcut = mathfield.options.onInlineShortcut(mathfield, candidate);

          i += 1;
        }

        // Don't flush the inline shortcut buffer yet, but schedule a deferred
        // flush, in case some keys typed later disambiguate the desired shortcut.
        //
        // This handles the case with two shortcuts for "sin" and "sinh", to
        // avoid the detecting of the "sin" shortcut from preventing the "sinh"
        // shortcut from ever being triggered.
        mathfield.flushInlineShortcutBuffer({ defer: true });
      }
    }

    //
    // 4.2. Should we switch mode?
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
      if (mathfield.mode !== previousMode) {
        if (
          !mathfield.host?.dispatchEvent(
            new Event('mode-change', {
              bubbles: true,
              composed: true,
              cancelable: true,
            })
          )
        )
          mathfield.mode = previousMode;
      }
    }
  }

  // 4.3 Check if this matches a keybinding.
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

    // 4.4 Handle the return/enter key
    if (!selector && (keystroke === '[Enter]' || keystroke === '[Return]')) {
      let result = false;
      if (contentWillChange(model, { inputType: 'insertLineBreak' })) {
        // No matching keybinding: trigger a commit

        if (mathfield.host) {
          result = !mathfield.host.dispatchEvent(
            new Event('change', {
              bubbles: true,
              composed: true,
            })
          );
        }

        if (!result) {
          if (evt.preventDefault) {
            evt.preventDefault();
            evt.stopPropagation();
          }
        }

        // Dispatch an 'input' event matching the behavior of `<textarea>`
        contentDidChange(model, { inputType: 'insertLineBreak' });
      }
      return result;
    }

    if (mathfield.mode === 'math') {
      //
      // 4.5 If this is the Space bar and we're just before or right after
      // a text zone, or if `mathModeSpace` is enabled, insert the space
      //
      if (keystroke === '[Space]') {
        // The space bar can be used to separate inline shortcuts
        mathfield.flushInlineShortcutBuffer();

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
          return false;
        }
        const nextSibling = model.at(model.position + 1);
        const previousSibling = model.at(model.position - 1);
        if (nextSibling?.mode === 'text' || previousSibling?.mode === 'text') {
          mathfield.snapshot();
          ModeEditor.insert('text', model, ' ');
          mathfield.dirty = true;
        }
      }

      //
      // 4.6 Handle the decimal separator
      //
      if (
        model.at(model.position)?.isDigit() &&
        mathfield.options.decimalSeparator === ',' &&
        eventToChar(evt) === ','
      )
        selector = 'insertDecimalSeparator';
    }
  }

  // No shortcut, no selector. We're done.
  if (!shortcut && !selector) return true;

  //
  // 5. Perform the action matching this selector or insert the shortcut
  //

  //
  // 5.1 If we have a `moveAfterParent` selector (usually triggered with
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
  // 5.2 If there's a selector, perform it.
  //
  if (selector) mathfield.executeCommand(selector);
  else if (shortcut) {
    //
    // 5.3 Cancel the (upcoming) composition

    // This is to prevent starting a composition when the keyboard event
    // has already been handled.
    // Example: alt+U -> \cup, but could also be diaeresis deak key (¨) which
    // starts a composition
    //
    mathfield.keyboardDelegate!.cancelComposition();

    //
    // 5.4 Insert the shortcut
    //
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
      model.setState(mathfield.inlineShortcutBuffer[stateIndex!].state);
      mathfield.mode = saveMode;
    }

    model.deferNotifications(
      {
        content: true,
        selection: true,
        data: shortcut ?? null,
        type: 'insertText',
      },
      () => {
        // Insert the substitute
        ModeEditor.insert(mathfield.mode, model, shortcut!, {
          format: 'latex',
          style,
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
  }

  //
  // 6. Make sure the mathfield and the insertion point is scrolled into view
  //
  mathfield.scrollIntoView();

  //
  // 7. Keystroke has been handled, if it wasn't caught in the default
  // case, so prevent default
  //
  if (evt.preventDefault) evt.preventDefault();

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
  // 1/ Focus (and scroll into view), then provide audio and haptic feedback
  //
  if (options.focus) mathfield.focus();

  if (options.feedback) {
    if (mathfield.options.keypressVibration && canVibrate())
      navigator.vibrate(HAPTIC_FEEDBACK_DURATION);

    mathfield.keypressSound?.play().catch(console.warn);
  }

  //
  // 2/ Switch mode if requested
  //
  if (typeof options.mode === 'string' && mathfield.mode !== options.mode)
    mathfield.switchMode(options.mode);

  //
  // 3/ Simulate keystroke, if requested
  //
  if (options.simulateKeystroke) {
    // For (const c of text) {
    const c = text.charAt(0);
    const ev = new KeyboardEvent('keypress', { key: c });
    if (!onKeystroke(mathfield, c, ev)) return;

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
    model.deleteAtoms(range(model.selection));
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
    model.deferNotifications(
      { content: true, selection: true, data: text, type: 'insertText' },
      () => {
        removeSuggestion(mathfield);

        for (const c of graphemes) ModeEditor.insert('latex', model, c);

        updateAutocomplete(mathfield);
      }
    );
  } else if (mathfield.mode === 'text')
    for (const c of graphemes) ModeEditor.insert('text', model, c, { style });
  else if (mathfield.mode === 'math') {
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
      if (c === ' ' && mathfield.options.mathModeSpace)
        selector = ['insert', mathfield.options.mathModeSpace];

      if (selector) mathfield.executeCommand(selector);
      else if (
        /\d/.test(c) &&
        mathfield.options.smartSuperscript &&
        atom.treeBranch === 'superscript' &&
        atom.parent?.type !== 'mop' &&
        atom.hasNoSiblings
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
        ModeEditor.insert('math', model, c, { style });
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

  // Render and make sure the mathfield and the insertion point is visible
  mathfield.scrollIntoView();
}

function getLeftSiblings(mf: MathfieldPrivate): Atom[] {
  const model = mf.model;

  const result: Atom[] = [];
  let atom = model.at(Math.min(model.position, model.anchor));
  while (atom.type !== 'first') {
    result.push(atom);
    atom = atom.leftSibling;
  }

  return result;
}
