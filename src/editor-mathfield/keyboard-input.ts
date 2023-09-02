import type { Selector } from '../public/commands';

import { splitGraphemes } from '../core/grapheme-splitter';
import { Atom } from '../core/atom';

import {
  keyboardEventToChar,
  mightProducePrintableCharacter,
} from '../editor/keyboard';
import { getInlineShortcut } from '../editor/shortcuts';
import { getCommandForKeybinding } from '../editor/keybindings';
import { SelectorPrivate } from '../editor/commands';
import {
  getActiveKeyboardLayout,
  validateKeyboardLayout,
} from '../editor/keyboard-layout';

import { moveAfterParent } from '../editor-model/commands-move';
import {
  contentDidChange,
  contentWillChange,
  selectionDidChange,
} from '../editor-model/listeners';
import { range } from '../editor-model/selection-utils';

import { removeSuggestion, updateAutocomplete } from './autocomplete';
import { requestUpdate } from './render';
import type { MathfieldPrivate } from './mathfield-private';
import { removeIsolatedSpace, smartMode } from './smartmode';
import { showKeystroke } from './keystroke-caption';
import { ModeEditor } from './mode-editor';
import type { ParseMode, Style } from 'public/core-types';
import type { ModelPrivate } from 'editor-model/model-private';
import { LeftRightAtom } from 'core-atoms/leftright';
import { RIGHT_DELIM, LEFT_DELIM } from 'core/delimiters';

/**
 * Handler in response to a keystroke event (or to a virtual keyboard keycap
 * with a `key` property).
 *
 * Return `false` if the event has been handled as a shortcut or command and
 * needs no further processing.
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

  // 1. Update the current keyboard layout based on this event
  if (evt.isTrusted) {
    validateKeyboardLayout(evt);

    const activeLayout = getActiveKeyboardLayout();
    if (mathfield.keyboardLayout !== activeLayout.id) {
      mathfield.keyboardLayout = activeLayout.id;
      // If we changed keyboard layout, we'll have to recache the keybindings
      mathfield._keybindings = undefined;
    }
  }

  // 2. Clear the timer for the keystroke buffer reset
  clearTimeout(mathfield.inlineShortcutBufferFlushTimer);
  mathfield.inlineShortcutBufferFlushTimer = 0;

  // 3. Display the keystroke in the keystroke panel (if visible)
  showKeystroke(mathfield, keystroke);

  // If the event has already been handled, return
  if (evt.isTrusted && evt.defaultPrevented) {
    mathfield.flushInlineShortcutBuffer();
    return false;
  }

  //
  // 4. Try to insert a smart fence.
  //
  if (!model.mathfield.smartFence) {
    //
    // 4.1. When smartFence is turned off, only do a "smart" fence insert
    // if we're inside a `leftright`, at the last char
    //
    const { parent } = model.at(model.position);
    if (
      parent instanceof LeftRightAtom &&
      parent.rightDelim === '?' &&
      model.at(model.position).isLastSibling &&
      /^[)}\]|]$/.test(keystroke)
    ) {
      mathfield.snapshot();
      parent.isDirty = true;
      parent.rightDelim = keystroke;
      model.position += 1;
      selectionDidChange(model);
      contentDidChange(model, {
        data: keyboardEventToChar(evt),
        inputType: 'insertText',
      });
      mathfield.snapshot('insert-fence');
      mathfield.dirty = true;
      mathfield.scrollIntoView();
      if (evt.preventDefault) evt.preventDefault();
      return false;
    }

    //
    // 4.2. Or inserting a fence around a selection
    //
    if (!model.selectionIsCollapsed) {
      const fence = keyboardEventToChar(evt);
      if (fence === '(' || fence === '{' || fence === '[') {
        const lDelim = { '(': '(', '{': '\\lbrace', '[': '\\lbrack' }[fence];
        const rDelim = { '(': ')', '{': '\\rbrace', '[': '\\rbrack' }[fence];
        const [start, end] = range(model.selection);
        mathfield.snapshot();
        model.position = end;
        ModeEditor.insert(model, rDelim, { format: 'latex' });
        model.position = start;
        ModeEditor.insert(model, lDelim, { format: 'latex' });
        model.setSelection(start + 1, end + 1);
        contentDidChange(model, {
          data: fence,
          inputType: 'insertText',
        });
        mathfield.snapshot('insert-fence');
        mathfield.dirty = true;
        mathfield.scrollIntoView();
        if (evt.preventDefault) evt.preventDefault();
        return false;
      }
    }
  } else if (
    insertSmartFence(model, keyboardEventToChar(evt), mathfield.style)
  ) {
    mathfield.flushInlineShortcutBuffer();
    mathfield.dirty = true;
    mathfield.scrollIntoView();
    if (evt.preventDefault) evt.preventDefault();
    return false;
  }

  // 5. Let's try to find a matching inline shortcut
  let shortcut: string | undefined;
  let selector: Selector | '' | [Selector, ...any[]] = '';
  let stateIndex: number;

  // 5.1 Check if the keystroke, prefixed with the previously typed keystrokes,
  // would match a long shortcut (i.e. '~~')
  // Ignore the key if Command or Control is pressed (it may be a keybinding,
  // see 5.3)
  const buffer = mathfield.inlineShortcutBuffer;
  if (mathfield.isSelectionEditable) {
    if (model.mode === 'math') {
      if (keystroke === '[Backspace]') buffer.pop();
      else if (!mightProducePrintableCharacter(evt)) {
        // It was a non-alpha character (PageUp, End, etc...)
        mathfield.flushInlineShortcutBuffer();
      } else {
        const c = keyboardEventToChar(evt);

        // Find the longest substring that matches a shortcut
        const keystrokes = [
          ...(buffer[buffer.length - 1]?.keystrokes ?? []),
          c,
        ];
        buffer.push({
          state: model.getState(),
          keystrokes,
          leftSiblings: getLeftSiblings(mathfield),
        });

        //
        // Loop  over possible candidates, from the longest possible, to the shortest
        //
        let i = 0;
        let candidate = '';
        while (!shortcut && i < keystrokes.length) {
          stateIndex = buffer.length - (keystrokes.length - i);
          candidate = keystrokes.slice(i).join('');

          //
          // Is this a simple inline shortcut?
          //
          shortcut = getInlineShortcut(
            buffer[stateIndex].leftSiblings,
            candidate,
            mathfield.options.inlineShortcuts
          );

          //
          // Is this a multichar symbol or other complex inline shortcut?
          //
          if (
            !shortcut &&
            /^[a-zA-Z][a-zA-Z0-9]+?([_\^][a-zA-Z0-9\*\+\-]+?)?$/.test(candidate)
          )
            shortcut = mathfield.options.onInlineShortcut(mathfield, candidate);

          i += 1;
        }

        // Don't flush the inline shortcut buffer yet, but schedule a deferred
        // flush, in case some keys typed later disambiguate the desired
        // shortcut.
        //
        // This handles the case with two shortcuts for "sin" and "sinh", to
        // avoid the detecting of the "sin" shortcut from preventing the "sinh"
        // shortcut from ever being triggered.
        mathfield.flushInlineShortcutBuffer({ defer: true });
      }
    }

    //
    // 5.2. Should we switch mode?
    //
    // Need to check this before determining if there's a valid shortcut
    // since if we switch to math mode, we may want to apply the shortcut
    // e.g. "slope = rise/run"
    if (mathfield.options.smartMode) {
      const previousMode = model.mode;
      if (shortcut) {
        // If we found a shortcut (e.g. "alpha"),
        // switch to math mode and insert it
        model.mode = 'math';
      } else if (smartMode(mathfield, keystroke, evt)) {
        model.mode = { math: 'text', text: 'math' }[model.mode];
        selector = '';
      }

      // Notify of mode change
      if (model.mode !== previousMode) {
        if (
          !mathfield.host?.dispatchEvent(
            new Event('mode-change', {
              bubbles: true,
              composed: true,
              cancelable: true,
            })
          )
        )
          model.mode = previousMode;
      }
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
        model.mode,
        keystroke
      );
    }

    // 5.4 Handle the return/enter key
    if (!selector && (keystroke === '[Enter]' || keystroke === '[Return]')) {
      let result = false;
      if (contentWillChange(model, { inputType: 'insertLineBreak' })) {
        // No matching keybinding: trigger a commit

        if (mathfield.host) {
          result = !mathfield.host.dispatchEvent(
            new Event('change', { bubbles: true, composed: true })
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

    if ((!selector || keystroke === '[Space]') && model.mode === 'math') {
      //
      // 5.5 If this is the Space bar and we're just before or right after
      // a text zone, or if `mathModeSpace` is enabled, insert the space
      //
      if (keystroke === '[Space]') {
        // Temporarily stop adopting the style from surrounding atoms
        mathfield.adoptStyle = 'none';

        // The space bar can be used to separate inline shortcuts
        mathfield.flushInlineShortcutBuffer();

        // If will also terminate styling in progress

        if (mathfield.options.mathModeSpace) {
          ModeEditor.insert(model, mathfield.options.mathModeSpace, {
            format: 'latex',
            mode: 'math',
          });
          mathfield.snapshot('insert-space');
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
          ModeEditor.insert(model, ' ', { mode: 'text' });
          mathfield.snapshot('insert-space');
          mathfield.dirty = true;
          mathfield.scrollIntoView();
          return false;
        }
      }

      //
      // 4.6 Handle the decimal separator
      //
      if (
        model.at(model.position)?.isDigit() &&
        window.MathfieldElement.decimalSeparator === ',' &&
        keyboardEventToChar(evt) === ','
      )
        selector = 'insertDecimalSeparator';
    }
  }

  // No shortcut, no selector. We're done.
  if (!shortcut && !selector) return true;

  //
  // 6. Insert the shortcut or perform the action for this selector
  //

  //
  // 6.1 If we have a `moveAfterParent` selector (usually triggered with
  // `spacebar`), and we're at the end of a smart fence, close the fence with
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
  // 6.2 Cancel the (upcoming) composition
  //

  // This is to prevent starting a composition when the keyboard event
  // has already been handled.
  // Example: alt+U -> \cup, but could also be diaeresis dead key (¨) which
  // starts a composition
  //
  mathfield.keyboardDelegate.cancelComposition();

  //
  // 6.3 Perform the selector or shortcut
  //

  if (selector) mathfield.executeCommand(selector);
  else if (shortcut) {
    //
    // 6.4 Insert the shortcut
    //
    const style = {
      ...model.at(model.position).computedStyle,
      ...mathfield.style,
    };
    //
    // Make the substitution to be undoable
    //
    // Revert to the state before the beginning of the shortcut
    model.setState(buffer[stateIndex!].state);
    // Insert the keystrokes as regular characters
    const keystrokes = buffer[buffer.length - 1].keystrokes;
    for (const c of keystrokes) {
      ModeEditor.insert(model, c, {
        silenceNotifications: true,
        style,
      });
    }

    mathfield.snapshot(`insert-shortcut`);

    //
    // Revert, then insert the substitution
    //

    // Revert to the state before the beginning of the shortcut
    model.setState(buffer[stateIndex!].state);

    model.deferNotifications(
      {
        content: true,
        selection: true,
        data: shortcut,
        type: 'insertText',
      },
      () => {
        // Insert the substitute
        ModeEditor.insert(model, shortcut!, { format: 'latex', style });

        // Check if as a result of the substitution there is now an isolated
        // (text mode) space (surrounded by math). In which case, remove it.

        removeIsolatedSpace(mathfield.model);

        // Switch (back) to text mode if the shortcut ended with a space
        if (shortcut!.endsWith(' ')) {
          model.mode = 'text';
          ModeEditor.insert(model, ' ', { style, mode: 'text' });
        }

        mathfield.snapshot();

        // If as a result of the substitution the selection is not collapsed,
        // the substitution inserted a place holder. Reset the buffer.
        if (!model.selectionIsCollapsed) mathfield.flushInlineShortcutBuffer();

        return true; // Content changed
      }
    );
    mathfield.dirty = true; // Mark the field as dirty. It will get rendered in scrollIntoView()
    model.announce('replacement');
  }

  //
  // 7. Make sure the mathfield and the insertion point is scrolled into view
  // and rendered
  //
  mathfield.scrollIntoView();

  //
  // 8. Keystroke has been handled, if it wasn't caught in the default
  // case, so prevent default
  //
  if (evt.preventDefault) evt.preventDefault();

  return false;
}

/**
 * This handler is invoked when text has been input with an input method.
 * As a result, `text` can be a sequence of characters to be inserted.
 * @param {object} options
 * @param {boolean} options.focus - If true, the mathfield will be focused
 * @param {boolean} options.feedback - If true, provide audio and haptic feedback
 * @param {boolean} options.simulateKeystroke - If true, generate some synthetic
 * keystrokes (useful to trigger inline shortcuts, for example)
 * @private
 */
export function onInput(
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
  if (!mathfield.isSelectionEditable) {
    model.announce('plonk');
    return;
  }
  options ??= {};

  //
  // 1/ Focus (and scroll into view), then provide audio and haptic feedback
  //
  if (options.focus) mathfield.focus();

  if (options.feedback) window.MathfieldElement.playSound('keypress');

  //
  // 2/ Switch mode if requested
  //
  if (typeof options.mode === 'string') {
    mathfield.switchMode(options.mode);
    mathfield.snapshot();
  }

  //
  // 3/ Simulate keystroke, if requested
  //

  // Decompose the string into an array of graphemes.
  // This is necessary to correctly process what is displayed as a single
  // glyph (a grapheme) but which is composed of multiple Unicode
  // codepoints. This is the case in particular for some emojis, such as
  // those with a skin tone modifier, the country flags emojis or
  // compound emojis such as the professional emojis, including the
  // David Bowie emoji: 👨🏻‍🎤
  let graphemes = splitGraphemes(text);

  const keyboard = window.mathVirtualKeyboard;
  if (keyboard?.isShifted) {
    graphemes =
      typeof graphemes === 'string'
        ? graphemes.toUpperCase()
        : graphemes.map((c) => c.toUpperCase());
  }

  if (options.simulateKeystroke) {
    let handled = true;
    for (const c of graphemes) {
      if (onKeystroke(mathfield, c, new KeyboardEvent('keypress', { key: c })))
        handled = false;
    }
    if (handled) return;
  }

  //
  // 4/ Insert the specified text at the current insertion point.
  // If the selection is not collapsed, the content will be deleted first
  //
  const atom = model.at(model.position);
  const style = { ...atom.computedStyle, ...mathfield.style };

  if (!model.selectionIsCollapsed) {
    model.deleteAtoms(range(model.selection));
    mathfield.snapshot('delete');
  }

  if (model.mode === 'latex') {
    model.deferNotifications(
      { content: true, selection: true, data: text, type: 'insertText' },
      () => {
        removeSuggestion(mathfield);

        for (const c of graphemes) ModeEditor.insert(model, c);

        mathfield.snapshot('insert-latex');

        updateAutocomplete(mathfield);
      }
    );
  } else if (model.mode === 'text') {
    for (const c of graphemes) ModeEditor.insert(model, c, { style });
    mathfield.snapshot('insert-text');
  } else if (model.mode === 'math')
    for (const c of graphemes) insertMathModeChar(mathfield, c, style, atom);

  //
  // 5/ Render the mathfield
  //    and make sure the caret is visible
  //
  mathfield.dirty = true;
  mathfield.scrollIntoView();
}

function getLeftSiblings(mf: MathfieldPrivate): Atom[] {
  const model = mf.model;

  const result: Atom[] = [];
  let atom = model.at(Math.min(model.position, model.anchor));
  while (atom.type !== 'first') {
    result.push(atom);
    atom = atom.leftSibling!;
  }

  return result;
}

function insertMathModeChar(
  mathfield: MathfieldPrivate,
  c: string,
  style: Style,
  atom: Atom
): void {
  const model = mathfield.model;
  // Some characters are mapped to commands. Handle them here.
  // This is important to handle synthetic text input and
  // non-US keyboards, on which, for example, the '^' key is
  // not mapped to 'Shift-Digit6'.
  let selector: undefined | SelectorPrivate | [SelectorPrivate, ...unknown[]] =
    (
      {
        '^': 'moveToSuperscript',
        '_': 'moveToSubscript',
        ' ': 'moveAfterParent',
      } as const
    )[c];
  if (c === ' ' && mathfield.options.mathModeSpace)
    selector = ['insert', mathfield.options.mathModeSpace];

  if (selector) {
    mathfield.executeCommand(selector);
    return;
  }

  if (
    /\d/.test(c) &&
    mathfield.options.smartSuperscript &&
    atom.parentBranch === 'superscript' &&
    atom.parent?.type !== 'mop' &&
    atom.hasNoSiblings
  ) {
    // We are inserting a digit into an empty superscript
    // If smartSuperscript is on, insert the digit, and exit the superscript.
    clearSelection(model);
    ModeEditor.insert(model, c, { style });
    mathfield.snapshot();
    moveAfterParent(model);
    mathfield.snapshot();
    return;
  }

  if (mathfield.adoptStyle !== 'none') {
    // If adding an alphabetic character, and the neighboring atom is an
    // alphanumeric character, use the same variant/variantStyle (\mathit, \mathrm...)
    const sibling =
      mathfield.adoptStyle === 'left'
        ? atom
        : atom.parent
        ? atom.rightSibling
        : null;
    if (
      sibling?.type === 'mord' &&
      /[a-zA-Z0-9]/.test(sibling.value) &&
      /[a-zA-Z0-9]/.test(c)
    ) {
      style = { ...style };
      if (sibling.style.variant) style.variant = sibling.style.variant;
      if (sibling.style.variantStyle)
        style.variantStyle = sibling.style.variantStyle;
    }
  }

  // General purpose character insertion
  ModeEditor.insert(model, c, { style });
  mathfield.snapshot(`insert-${model.at(model.position).type}`);
}

function clearSelection(model: ModelPrivate) {
  if (!model.selectionIsCollapsed) {
    model.deleteAtoms(range(model.selection));
    model.mathfield.snapshot('delete');
  }
}

/**
 * Insert a smart fence '(', '{', '[', etc...
 * If not handled (because `fence` wasn't a fence), return false.
 */
export function insertSmartFence(
  model: ModelPrivate,
  key: string,
  style?: Style
): boolean {
  if (!key) return false;
  if (model.mode !== 'math') return false;
  const atom = model.at(model.position);
  const { parent } = atom;

  // Normalize some fences (`key` is a character input)
  const fence = {
    '(': '(',
    ')': ')',
    '{': '\\lbrace',
    '}': '\\rbrace',
    '[': '\\lbrack',
    ']': '\\rbrack',
    '|': '|',
  }[key];
  if (!fence) return false;
  const lDelim = LEFT_DELIM[fence];
  const rDelim = RIGHT_DELIM[fence];

  if (!model.selectionIsCollapsed) {
    // There is a selection, wrap it with the fence
    model.mathfield.snapshot();
    const [start, end] = range(model.selection);
    const body = model.extractAtoms([start, end]);
    const atom = parent!.addChildrenAfter(
      [
        new LeftRightAtom('left...right', body, {
          leftDelim: fence,
          rightDelim: rDelim,
        }),
      ],
      model.at(start)
    );
    model.setSelection(
      model.offsetOf(atom.firstChild),
      model.offsetOf(atom.lastChild)
    );
    model.mathfield.snapshot('insert-fence');
    contentDidChange(model, { data: fence, inputType: 'insertText' });
    return true;
  }

  //
  // 1. Are we inserting a middle fence?
  // ...as in {...|...}
  //
  if (fence === '|') {
    const delims =
      parent instanceof LeftRightAtom
        ? parent.leftDelim! + parent.rightDelim!
        : '';
    if (
      delims === '\\lbrace\\rbrace' ||
      delims === '\\{\\}' ||
      delims === '\\lbrace?'
    ) {
      model.mathfield.snapshot();
      ModeEditor.insert(model, '\\,\\middle\\vert\\,', {
        format: 'latex',
        style,
      });
      model.mathfield.snapshot('insert-fence');
      contentDidChange(model, { data: fence, inputType: 'insertText' });
      return true;
    }
  }

  //
  // 2. Is it an open fence?
  //
  if (rDelim) {
    //
    // 2.1
    //
    if (
      parent instanceof LeftRightAtom &&
      parent.firstChild === atom && // At first child
      (parent.leftDelim! === '?' || parent.leftDelim! === '.')
    ) {
      parent.leftDelim = fence;
      parent.isDirty = true;
      model.mathfield.snapshot();
      contentDidChange(model, { data: fence, inputType: 'insertText' });
      model.mathfield.snapshot('insert-fence');
      return true;
    }

    //
    // 2.2
    //
    // Is there a matching right delim as a right sibling?
    //
    if (!(parent instanceof LeftRightAtom)) {
      let sibling = atom;
      while (sibling) {
        if (sibling.type === 'mclose' && sibling.value === rDelim) break;
        sibling = sibling.rightSibling;
      }

      if (sibling) {
        model.mathfield.snapshot();
        // We've found a matching sibling
        const body = model.extractAtoms([
          model.offsetOf(atom),
          model.offsetOf(sibling),
        ]);
        body.pop();
        parent!.addChildrenAfter(
          [
            new LeftRightAtom('left...right', body, {
              leftDelim: fence,
              rightDelim: rDelim,
            }),
          ],
          atom
        );
        model.position = model.offsetOf(parent!.firstChild) + 1;
        contentDidChange(model, { data: fence, inputType: 'insertText' });
        model.mathfield.snapshot('insert-fence');
        return true;
      }
    }

    // If we have a `leftright` sibling to our right
    // with an indeterminate left fence,
    // move what's between us and the `leftright` inside the `leftright`
    const lastSibling = model.offsetOf(atom.lastSibling);
    let i: number;
    for (i = model.position; i <= lastSibling; i++) {
      const atom = model.at(i);
      if (
        atom instanceof LeftRightAtom &&
        (atom.leftDelim === '?' || atom.leftDelim === '.') &&
        isValidOpen(fence, atom.rightDelim)
      )
        break;
    }

    //
    // 2.4
    //
    const match = model.at(i);
    if (i <= lastSibling && match instanceof LeftRightAtom) {
      match.leftDelim = fence;

      model.mathfield.snapshot();
      let extractedAtoms = model.extractAtoms([model.position, i - 1]);
      // remove any atoms of type 'first'
      extractedAtoms = extractedAtoms.filter((value) => value.type !== 'first');
      match.addChildren(extractedAtoms, match.parentBranch!);

      model.position += 1;
      contentDidChange(model, { data: fence, inputType: 'insertText' });
      model.mathfield.snapshot('insert-fence');
      return true;
    }

    //
    // 2.5
    //
    // If we're inside a `leftright`, but not the first atom,
    // and the `leftright` left delim is indeterminate
    // adjust the body (put everything before the insertion point outside)
    if (
      parent instanceof LeftRightAtom &&
      (parent.leftDelim === '?' || parent.leftDelim === '.') &&
      isValidOpen(fence, parent.rightDelim)
    ) {
      parent.isDirty = true;
      parent.leftDelim = fence;

      model.mathfield.snapshot();
      const extractedAtoms = model.extractAtoms([
        model.offsetOf(atom.firstSibling),
        model.position,
      ]);

      for (const extractedAtom of extractedAtoms)
        parent.parent!.addChildBefore(extractedAtom, parent);

      //model.position = model.offsetOf(parent);
      contentDidChange(model, { data: fence, inputType: 'insertText' });
      model.mathfield.snapshot('insert-fence');

      return true;
    }

    //
    // 2.6 Inserting an open delim, with no body
    //
    if (!(parent instanceof LeftRightAtom && parent.leftDelim === '|')) {
      // We have a valid open fence as input
      model.mathfield.snapshot();
      ModeEditor.insert(model, `\\left${fence}\\right?`, {
        format: 'latex',
        style,
      });
      // If there is content after the anchor, move it into the `leftright` atom
      if (atom.lastSibling.type !== 'first') {
        const lastSiblingOffset = model.offsetOf(atom.lastSibling);
        const content = model.extractAtoms([model.position, lastSiblingOffset]);
        model.at(model.position).body = content;
        model.position -= 1;
      }
      model.mathfield.snapshot('insert-fence');
      return true;
    }
  }

  //
  // 3. Is it a close fence?
  //
  if (lDelim) {
    // We found a target open fence matching this delim.
    // Note that `targetLeftDelim` may not match `fence`. That's OK.

    // Check if there's a stand-alone sibling atom matching...
    let sibling = atom;
    while (sibling) {
      // There is a left sibling that matches: make a leftright
      if (sibling.type === 'mopen' && sibling.value === lDelim) {
        model.mathfield.snapshot();
        const insertAfter = sibling.leftSibling!;
        const body = model.extractAtoms([
          model.offsetOf(sibling.leftSibling),
          model.offsetOf(atom),
        ]);
        body.shift();
        const result = new LeftRightAtom('left...right', body, {
          leftDelim: lDelim,
          rightDelim: fence,
        });

        parent!.addChildrenAfter([result], insertAfter);
        model.position = model.offsetOf(result);
        contentDidChange(model, { data: fence, inputType: 'insertText' });
        model.mathfield.snapshot('insert-fence');
        return true;
      }
      sibling = sibling.leftSibling;
    }

    // If we're the last atom inside a 'leftright', update the parent
    if (
      parent instanceof LeftRightAtom &&
      atom.isLastSibling &&
      isValidClose(parent.leftDelim, fence)
    ) {
      model.mathfield.snapshot();
      parent.isDirty = true;
      parent.rightDelim = fence;
      model.position += 1;
      contentDidChange(model, { data: fence, inputType: 'insertText' });
      model.mathfield.snapshot('insert-fence');
      return true;
    }

    // If we have a `leftright` sibling to our left
    // with an indeterminate right fence,
    // move what's between us and the `leftright` inside the `leftright`
    const firstSibling = model.offsetOf(atom.firstSibling);
    let i: number;
    for (i = model.position; i >= firstSibling; i--) {
      const atom = model.at(i);
      if (
        atom instanceof LeftRightAtom &&
        (atom.rightDelim === '?' || atom.rightDelim === '.') &&
        isValidClose(atom.leftDelim, fence)
      )
        break;
    }

    const match = model.at(i);
    if (i >= firstSibling && match instanceof LeftRightAtom) {
      model.mathfield.snapshot();
      match.rightDelim = fence;
      match.addChildren(
        model.extractAtoms([i, model.position]),
        match.parentBranch!
      );
      contentDidChange(model, { data: fence, inputType: 'insertText' });
      model.mathfield.snapshot('insert-fence');
      return true;
    }

    // If we're inside a `leftright`, but not the last atom,
    // and the `leftright` right delim is indeterminate
    // adjust the body (put everything after the insertion point outside)
    if (
      parent instanceof LeftRightAtom &&
      (parent.rightDelim === '?' || parent.rightDelim === '.') &&
      isValidClose(parent.leftDelim, fence)
    ) {
      model.mathfield.snapshot();
      parent.isDirty = true;
      parent.rightDelim = fence;

      parent.parent!.addChildren(
        model.extractAtoms([model.position, model.offsetOf(atom.lastSibling)]),
        parent.parentBranch!
      );
      model.position = model.offsetOf(parent);
      contentDidChange(model, { data: fence, inputType: 'insertText' });
      model.mathfield.snapshot('insert-fence');

      return true;
    }

    // Is our grand-parent a 'leftright'?
    // If `\left(\frac{1}{x|}\right?` with the cursor at `|`
    // go up to the 'leftright' and apply it there instead
    const grandparent = parent!.parent;
    if (
      grandparent instanceof LeftRightAtom &&
      (grandparent.rightDelim === '?' || grandparent.rightDelim === '.') &&
      model.at(model.position).isLastSibling
    ) {
      model.position = model.offsetOf(grandparent);
      return insertSmartFence(model, fence, style);
    }

    // Meh... We couldn't find a matching open fence. Just insert the
    // closing fence as a regular character
    return false;
  }

  return false;
}

function isValidClose(open: string | undefined, close: string): boolean {
  if (!open) return true;

  if (
    ['(', '\\lparen', '{', '\\{', '\\lbrace', '[', '\\lbrack'].includes(open)
  ) {
    return [')', '\\rparen', '}', '\\}', '\\rbrace', ']', '\\rbrack'].includes(
      close
    );
  }
  return RIGHT_DELIM[open] === close;
}

function isValidOpen(open: string, close: string | undefined): boolean {
  if (!close) return true;

  if (
    [')', '\\rparen', '}', '\\}', '\\rbrace', ']', '\\rbrack'].includes(close)
  ) {
    return ['(', '\\lparen', '{', '\\{', '\\lbrace', '[', '\\lbrack'].includes(
      open
    );
  }
  return LEFT_DELIM[close] === open;
}
