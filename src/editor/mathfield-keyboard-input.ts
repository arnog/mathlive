import type { Selector } from '../public/commands';
import { suggest } from '../core/definitions';
import { Atom, makeRoot } from '../core/atom';
import { parseString } from '../core/parser';
import { ModelPrivate, removeSuggestion } from './model';
import { moveAfterParent } from './model-selection';
import { mightProducePrintableCharacter, eventToChar } from './keyboard';
import { getInlineShortcutsStartingWith, getInlineShortcut } from './shortcuts';
import {
    getCommandForKeybinding,
    getKeybindingMarkup,
    normalizeKeybindings,
} from './keybindings';
import { hidePopover, showPopoverWithLatex } from './popover';
import { splitGraphemes } from '../core/grapheme-splitter';
import { HAPTIC_FEEDBACK_DURATION } from './commands';
import { getAnchorStyle } from './model-selection-utils';
import { insertSuggestion } from './autocomplete';
import {
    decorateCommandStringAroundInsertionPoint,
    extractCommandStringAroundInsertionPoint,
} from './model-command-mode';

import { contentDidChange, selectionDidChange } from './model-listeners';

import { insert, insertSmartFence, normalizeModel } from './model-insert';
import { requestUpdate } from './mathfield-render';

import type { MathfieldPrivate } from './mathfield-class';

import { removeIsolatedSpace } from './mathfield-smartmode';
import { smartMode } from './mathfield-smartmode';
import {
    getActiveKeyboardLayout,
    validateKeyboardLayout,
} from './keyboard-layout';

export function showKeystroke(
    mathfield: MathfieldPrivate,
    keystroke: string
): void {
    const vb = mathfield.keystrokeCaption;
    if (vb && mathfield.keystrokeCaptionVisible) {
        const bounds = mathfield.element.getBoundingClientRect();
        vb.style.left = bounds.left + 'px';
        vb.style.top = bounds.top - 64 + 'px';
        vb.innerHTML = mathfield.options.createHTML(
            '<span>' +
                (getKeybindingMarkup(keystroke) || keystroke) +
                '</span>' +
                vb.innerHTML
        );
        vb.style.visibility = 'visible';
        setTimeout(function () {
            if (vb.childNodes.length > 0) {
                vb.removeChild(vb.childNodes[vb.childNodes.length - 1]);
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
    // 1. Update the keybindings according to the current keyboard layout

    // 1.1 Possibly update the current keyboard layout based on this event
    validateKeyboardLayout(evt);

    const activeLayout = getActiveKeyboardLayout();
    if (mathfield.keyboardLayout !== activeLayout.id) {
        console.log('Switching to keyboard layout ' + activeLayout.id);
        mathfield.keyboardLayout = activeLayout.id;
        mathfield.keybindings = normalizeKeybindings(
            mathfield.options.keybindings,
            (e) => {
                if (typeof mathfield.options.onError === 'function') {
                    mathfield.options.onError({
                        code: 'invalid-keybinding',
                        arg: e.join('\n'),
                    });
                }
                console.log(e.join('\n'));
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
    if (
        mathfield.mode !== 'command' &&
        (!evt || (!evt.ctrlKey && !evt.metaKey))
    ) {
        if (keystroke === '[Backspace]') {
            // Special case for backspace
            mathfield.keystrokeBuffer = mathfield.keystrokeBuffer.slice(0, -1);
            mathfield.keystrokeBufferStates.push(mathfield.getUndoRecord());
            if (mathfield.options.inlineShortcutTimeout) {
                // Set a timer to reset the shortcut buffer
                mathfield.keystrokeBufferResetTimer = setTimeout(() => {
                    mathfield.resetKeystrokeBuffer();
                }, mathfield.options.inlineShortcutTimeout);
            }
        } else if (!mightProducePrintableCharacter(evt)) {
            // It was a non-alpha character (PageUp, End, etc...)
            mathfield.resetKeystrokeBuffer();
        } else {
            const c = eventToChar(evt);
            // Find the longest substring that matches a shortcut
            const candidate = mathfield.keystrokeBuffer + c;
            let i = 0;
            while (!shortcut && i < candidate.length) {
                let siblings: Atom[];
                if (mathfield.keystrokeBufferStates[i]) {
                    const iter = new ModelPrivate();
                    iter.root = makeRoot(
                        'math',
                        parseString(
                            mathfield.keystrokeBufferStates[i].latex,
                            mathfield.options.defaultMode,
                            null,
                            mathfield.options.macros
                        )
                    );
                    normalizeModel(iter);
                    iter.selection =
                        mathfield.keystrokeBufferStates[i].selection;
                    siblings = iter.siblings();
                } else {
                    siblings = mathfield.model.siblings();
                }
                shortcut = getInlineShortcut(
                    siblings,
                    candidate.slice(i),
                    mathfield.options.inlineShortcuts
                );
                console.log(
                    'shortcut ',
                    '@ ',
                    i,
                    candidate.slice(i),
                    ' = ',
                    shortcut
                );
                i += 1;
            }
            stateIndex = mathfield.keystrokeBufferStates.length - i + 1;
            mathfield.keystrokeBuffer += c;
            mathfield.keystrokeBufferStates.push(mathfield.getUndoRecord());
            if (
                getInlineShortcutsStartingWith(candidate, mathfield.options)
                    .length <= 1
            ) {
                resetKeystrokeBuffer = true;
            } else {
                if (mathfield.options.inlineShortcutTimeout) {
                    // Set a timer to reset the shortcut buffer
                    mathfield.keystrokeBufferResetTimer = setTimeout(() => {
                        mathfield.resetKeystrokeBuffer();
                    }, mathfield.options.inlineShortcutTimeout);
                }
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
    // 6.1 Remove any error indicator (wavy underline) on the current command
    // sequence (if there are any)
    //
    decorateCommandStringAroundInsertionPoint(mathfield.model, false);

    //
    // 6.2 If we have a `moveAfterParent` selector (usually triggered with
    // `spacebar), and we're at the end of a smart fence, close the fence with
    // an empty (.) right delimiter
    //
    const parent = mathfield.model.parent();
    if (
        selector === 'moveAfterParent' &&
        parent &&
        parent.type === 'leftright' &&
        mathfield.model.endOffset() === mathfield.model.siblings().length - 1 &&
        mathfield.options.smartFence &&
        insertSmartFence(mathfield.model, '.', mathfield.style)
    ) {
        // Pressing the space bar (moveAfterParent selector) when at the end
        // of a potential smartFence will close it as a semi-open fence
        selector = '';
        requestUpdate(mathfield); // Re-render the closed smartFence
    }
    //
    // 6.3 If this is the Spacebar and we're just before or right after
    // a text zone, insert the space inside the text zone
    //
    if (mathfield.mode === 'math' && keystroke === '[Spacebar]' && !shortcut) {
        const nextSibling = mathfield.model.sibling(1);
        const previousSibling = mathfield.model.sibling(-1);
        if (
            (nextSibling && nextSibling.mode === 'text') ||
            (previousSibling && previousSibling.mode === 'text')
        ) {
            insert(mathfield.model, ' ', { mode: 'text' });
        }
    }
    //
    // 6.4 If there's a selector, perform it.
    //
    if (selector) {
        mathfield.executeCommand(selector);
    } else if (shortcut) {
        //
        // 6.5 Insert the shortcut
        // If the shortcut is a mandatory escape sequence (\}, etc...)
        // don't make it undoable, this would result in syntactically incorrect
        // formulas
        //
        const style = {
            ...getAnchorStyle(mathfield.model),
            ...mathfield.style,
        };
        if (
            !/^(\\{|\\}|\\[|\\]|\\@|\\#|\\$|\\%|\\^|\\_|\\backslash)$/.test(
                shortcut
            )
        ) {
            // To enable the substitution to be undoable,
            // insert the character before applying the substitution
            const saveMode = mathfield.mode;
            insert(mathfield.model, eventToChar(evt), {
                suppressChangeNotifications: true,
                mode: mathfield.mode,
                style: style,
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
        const save = mathfield.model.suppressChangeNotifications;
        mathfield.model.suppressChangeNotifications = true;
        // Insert the substitute, possibly as a smart fence
        insert(mathfield.model, shortcut, {
            format: 'latex',
            mode: mathfield.mode,
            style: style,
            smartFence: true,
        });
        // Check if as a result of the substitution there is now an isolated
        // (text mode) space (surrounded by math). In which case, remove it.
        removeIsolatedSpace(mathfield);
        // Switch (back) to text mode if the shortcut ended with a space
        if (shortcut.endsWith(' ')) {
            mathfield.mode = 'text';
            insert(mathfield.model, ' ', { mode: 'text', style: style });
        }
        mathfield.model.suppressChangeNotifications = save;
        contentDidChange(mathfield.model);
        selectionDidChange(mathfield.model);
        mathfield.snapshot();
        mathfield.dirty = true; // Mark the field as dirty. It will get rendered in scrollIntoView()
        mathfield.model.announce('replacement');
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
 * @param {string} text
 * @param {object} options
 * @param {boolean} options.focus - If true, the mathfield will be focused
 * @param {boolean} options.feedback - If true, provide audio and haptic feedback
 * @param {boolean} options.simulateKeystroke - If true, generate some synthetic
 * keystrokes (useful to trigger inline shortcuts, for example)
 * @param {boolean} options.commandMode - If true, switch to command mode if
 * necessary, then insert text
 * @private
 */
export function onTypedText(
    mathfield: MathfieldPrivate,
    text: string,
    options?: {
        focus?: boolean;
        feedback?: boolean;
        commandMode?: boolean;
        simulateKeystroke?: boolean;
    }
): void {
    if (mathfield.options.readOnly) {
        mathfield.model.announce('plonk');
        return;
    }
    options = options ?? {};
    // Focus, then provide audio and haptic feedback
    if (options.focus) {
        mathfield.focus();
    }
    if (options.feedback) {
        if (mathfield.options.keypressVibration && navigator?.vibrate) {
            navigator.vibrate(HAPTIC_FEEDBACK_DURATION);
        }
        if (mathfield.keypressSound) {
            mathfield.keypressSound.load();
            mathfield.keypressSound.play().catch((err) => console.warn(err));
        }
    }
    if (options.commandMode && mathfield.mode !== 'command') {
        mathfield.switchMode('command');
    }
    // Remove any error indicator on the current command sequence
    // (if there is one)
    decorateCommandStringAroundInsertionPoint(mathfield.model, false);
    if (options.simulateKeystroke) {
        // for (const c of text) {
        const c = text.charAt(0);
        const ev = new KeyboardEvent('keypress', { key: c });
        if (!onKeystroke(mathfield, c, ev)) {
            return;
        }
        // }
    }
    // Insert the specified text at the current insertion point.
    // If the selection is not collapsed, the content will be deleted first.
    let popoverText = '';
    let displayArrows = false;
    if (mathfield.pasteInProgress) {
        mathfield.pasteInProgress = false;
        // This call was made in response to a paste event.
        // Interpret `text` as a 'smart' expression (could be LaTeX, could be
        // UnicodeMath)
        insert(mathfield.model, text, {
            smartFence: mathfield.options.smartFence,
            mode: 'math',
        });
    } else {
        const style = {
            ...getAnchorStyle(mathfield.model),
            ...mathfield.style,
        };
        // Decompose the string into an array of graphemes.
        // This is necessary to correctly process what is displayed as a single
        // glyph (a grapheme) but which is composed of multiple Unicode
        // codepoints. This is the case in particular for some emojis, such as
        // those with a skin tone modifier, the country flags emojis or
        // compound emojis such as the professional emojis, including the
        // David Bowie emoji: 👨🏻‍🎤
        const graphemes = splitGraphemes(text);
        for (const c of graphemes) {
            if (mathfield.mode === 'command') {
                removeSuggestion(mathfield.model);
                mathfield.suggestionIndex = 0;
                const command = extractCommandStringAroundInsertionPoint(
                    mathfield.model
                );
                const suggestions = suggest(command + c);
                displayArrows = suggestions.length > 1;
                if (suggestions.length === 0) {
                    insert(mathfield.model, c, { mode: 'command' });
                    if (/^\\[a-zA-Z\\*]+$/.test(command + c)) {
                        // This looks like a command name, but not a known one
                        decorateCommandStringAroundInsertionPoint(
                            mathfield.model,
                            true
                        );
                    }
                    hidePopover(mathfield);
                } else {
                    insert(mathfield.model, c, { mode: 'command' });
                    if (suggestions[0].match !== command + c) {
                        insertSuggestion(
                            mathfield.model,
                            suggestions[0].match,
                            -suggestions[0].match.length + command.length + 1
                        );
                    }
                    popoverText = suggestions[0].match;
                }
            } else if (mathfield.mode === 'math') {
                // Some characters are mapped to commands. Handle them here.
                // This is important to handle synthetic text input and
                // non-US keyboards, on which, fop example, the '^' key is
                // not mapped to  'Shift-Digit6'.
                const selector = {
                    '^': 'moveToSuperscript',
                    _: 'moveToSubscript',
                    ' ': 'moveAfterParent',
                }[c];
                if (selector) {
                    if (selector === 'moveToSuperscript') {
                        if (
                            superscriptDepth(mathfield) >=
                            mathfield.options.scriptDepth[1]
                        ) {
                            mathfield.model.announce('plonk');
                            return;
                        }
                    } else if (selector === 'moveToSubscript') {
                        if (
                            subscriptDepth(mathfield) >=
                            mathfield.options.scriptDepth[0]
                        ) {
                            mathfield.model.announce('plonk');
                            return;
                        }
                    }
                    mathfield.executeCommand(selector);
                } else {
                    if (
                        mathfield.options.smartSuperscript &&
                        mathfield.model.relation() === 'superscript' &&
                        /[0-9]/.test(c) &&
                        mathfield.model
                            .siblings()
                            .filter((x) => x.type !== 'first').length === 0
                    ) {
                        // We are inserting a digit into an empty superscript
                        // If smartSuperscript is on, insert the digit, and
                        // exit the superscript.
                        insert(mathfield.model, c, {
                            mode: 'math',
                            style: style,
                        });
                        moveAfterParent(mathfield.model);
                    } else {
                        insert(mathfield.model, c, {
                            mode: 'math',
                            style: style,
                            smartFence: mathfield.options.smartFence,
                        });
                    }
                }
            } else if (mathfield.mode === 'text') {
                insert(mathfield.model, c, { mode: 'text', style: style });
            }
        }
    }
    if (mathfield.mode !== 'command') {
        mathfield.snapshotAndCoalesce();
    }
    // Mark the mathfield dirty
    // (it will get rendered in scrollIntoView())
    mathfield.dirty = true;

    // Make sure the insertion point is visible
    mathfield.scrollIntoView();

    // Since the location of the popover depends on the position of the caret
    // only show the popover after the formula has been rendered and the
    // position of the caret calculated
    showPopoverWithLatex(mathfield, popoverText, displayArrows);
}

function superscriptDepth(mathfield: MathfieldPrivate): number {
    let result = 0;
    let i = 0;
    let atom = mathfield.model.ancestor(i);
    let wasSuperscript = false;
    while (atom) {
        if (atom.superscript || atom.subscript) {
            result += 1;
        }
        if (atom.superscript) {
            wasSuperscript = true;
        } else if (atom.subscript) {
            wasSuperscript = false;
        }
        i += 1;
        atom = mathfield.model.ancestor(i);
    }
    return wasSuperscript ? result : 0;
}
function subscriptDepth(mathfield: MathfieldPrivate): number {
    let result = 0;
    let i = 0;
    let atom = mathfield.model.ancestor(i);
    let wasSubscript = false;
    while (atom) {
        if (atom.superscript || atom.subscript) {
            result += 1;
        }
        if (atom.superscript) {
            wasSubscript = false;
        } else if (atom.subscript) {
            wasSubscript = true;
        }
        i += 1;
        atom = mathfield.model.ancestor(i);
    }
    return wasSubscript ? result : 0;
}
