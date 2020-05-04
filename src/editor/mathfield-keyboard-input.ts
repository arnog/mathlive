import { suggest } from '../core/definitions';
import { makeRoot } from '../core/atom';
import { parseString } from '../core/parser';
import { ModelPrivate, removeSuggestion } from './model';
import { moveAfterParent } from './model-selection';
import Keyboard from './editor-keyboard';
import {
    getInlineShortcutsStartingWith,
    getKeyboardShortcut,
    getInlineShortcut,
    getShortcutMarkup,
} from './shortcuts';
import { hidePopover, showPopoverWithLatex } from './editor-popover';
import { splitGraphemes } from '../core/grapheme-splitter';
import { HAPTIC_FEEDBACK_DURATION } from './commands';
import { getAnchorStyle, setPath } from './model-selection';
import { insertSuggestion } from './autocomplete';
import {
    decorateCommandStringAroundInsertionPoint,
    extractCommandStringAroundInsertionPoint,
} from './model-command-mode';
import { insertSmartFence } from './model-smartfence';

import { contentDidChange, contentWillChange } from './model-listeners';

import { insert } from './model-insert';
import { requestUpdate } from './mathfield-render';

import { Mathfield } from './mathfield-utils';

import { removeIsolatedSpace } from './mathfield-smartmode';
import { smartMode_ } from './mathfield-smartmode';

export function showKeystroke(mathfield: Mathfield, keystroke: string) {
    const vb = mathfield.keystrokeCaption;
    if (vb && mathfield.keystrokeCaptionVisible) {
        const bounds = mathfield.element.getBoundingClientRect();
        vb.style.left = bounds.left + 'px';
        vb.style.top = bounds.top - 64 + 'px';
        vb.innerHTML =
            '<span>' +
            (getShortcutMarkup(keystroke) || keystroke) +
            '</span>' +
            vb.innerHTML;
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
 * @param [evt] - An Event corresponding to the keystroke.
 */
export function onKeystroke(
    mathfield: Mathfield,
    keystroke: string,
    evt: KeyboardEvent
) {
    // 1. Display the keystroke in the keystroke panel (if visible)
    showKeystroke(mathfield, keystroke);
    // 2. Reset the timer for the keystroke buffer reset
    clearTimeout(mathfield.keystrokeBufferResetTimer);
    // 3. Give a chance to the custom keystroke handler to intercept the event
    if (
        mathfield.config.onKeystroke &&
        !mathfield.config.onKeystroke(mathfield, keystroke, evt)
    ) {
        if (evt?.preventDefault) {
            evt.preventDefault();
            evt.stopPropagation();
        }
        return false;
    }
    // 4. Let's try to find a matching shortcut or command
    let shortcut;
    let stateIndex;
    let selector;
    let resetKeystrokeBuffer = false;
    // 4.1 Check if the keystroke, prefixed with the previously typed keystrokes,
    // would match a long shortcut (i.e. '~~')
    // Ignore the key if command or control is pressed (it may be a shortcut,
    // see 4.3)
    if (
        mathfield.mode !== 'command' &&
        (!evt || (!evt.ctrlKey && !evt.metaKey))
    ) {
        const c = Keyboard.eventToChar(evt);
        // The Backspace key will be handled as a delete command later (5.4)
        // const c = Keyboard.eventToChar(evt);
        if (c !== 'Backspace') {
            if (!c || c.length > 1) {
                // It was a non-alpha character (PageUp, End, etc...)
                mathfield.resetKeystrokeBuffer();
            } else {
                // Find the longest substring that matches a shortcut
                const candidate = mathfield.keystrokeBuffer + c;
                let i = 0;
                while (!shortcut && i < candidate.length) {
                    let siblings;
                    if (mathfield.keystrokeBufferStates[i]) {
                        const mathlist = new ModelPrivate();
                        mathlist.root = makeRoot(
                            'math',
                            parseString(
                                mathfield.keystrokeBufferStates[i].latex,
                                mathfield.config.defaultMode,
                                null,
                                mathfield.config.macros
                            )
                        );
                        setPath(
                            mathlist,
                            mathfield.keystrokeBufferStates[i].selection
                        );
                        siblings = mathlist.siblings();
                    } else {
                        siblings = mathfield.model.siblings();
                    }
                    shortcut = getInlineShortcut(
                        mathfield.mode,
                        siblings,
                        candidate.slice(i),
                        mathfield.config.inlineShortcuts
                    );
                    i += 1;
                }
                stateIndex = i - 1;
                mathfield.keystrokeBuffer += c;
                mathfield.keystrokeBufferStates.push(
                    mathfield.undoManager.save()
                );
                if (
                    getInlineShortcutsStartingWith(candidate, mathfield.config)
                        .length <= 1
                ) {
                    resetKeystrokeBuffer = true;
                } else {
                    if (mathfield.config.inlineShortcutTimeout) {
                        // Set a timer to reset the shortcut buffer
                        mathfield.keystrokeBufferResetTimer = setTimeout(() => {
                            mathfield.resetKeystrokeBuffer();
                        }, mathfield.config.inlineShortcutTimeout);
                    }
                }
            }
        }
    }
    // 4.2. Should we switch mode?
    // Need to check this before determing if there's a valid shortcut
    // since if we switch to math mode, we may want to apply the shortcut
    // e.g. "slope = rise/run"
    if (mathfield.config.smartMode) {
        const previousMode = mathfield.mode;
        if (shortcut) {
            // If we found a shortcut (e.g. "alpha"),
            // switch to math mode and insert it
            mathfield.mode = 'math';
        } else if (smartMode_(mathfield, keystroke, evt)) {
            mathfield.mode = { math: 'text', text: 'math' }[mathfield.mode];
            selector = '';
        }
        // Notify of mode change
        if (
            mathfield.mode !== previousMode &&
            typeof mathfield.config.onModeChange === 'function'
        ) {
            mathfield.config.onModeChange(mathfield, mathfield.mode);
        }
    }
    // 4.3 Check if this matches a keystroke shortcut
    // Need to check this **after** checking for inline shortcuts because
    // shift+backquote is a keystroke that inserts "\~"", but "~~" is a
    // shortcut for "\approx" and needs to have priority over shift+backquote
    if (!shortcut && !selector) {
        selector = getKeyboardShortcut(mathfield.mode, keystroke);
    }
    // No shortcut :( We're done.
    if (!shortcut && !selector) {
        return true;
    }
    if (mathfield.config.readOnly && selector[0] === 'insert') {
        return true;
    }
    // 5. Perform the action matching this shortcut
    // 5.1 Remove any error indicator (wavy underline) on the current command
    // sequence (if there are any)
    decorateCommandStringAroundInsertionPoint(mathfield.model, false);
    // 5.2 If we have a `moveAfterParent` selector (usually triggered with
    // `spacebar), and we're at the end of a smart fence, close the fence with
    // an empty (.) right delimiter
    const parent = mathfield.model.parent();
    if (
        selector === 'moveAfterParent' &&
        parent &&
        parent.type === 'leftright' &&
        mathfield.model.endOffset() === mathfield.model.siblings().length - 1 &&
        mathfield.config.smartFence &&
        insertSmartFence(mathfield.model, '.', mathfield.style)
    ) {
        // Pressing the space bar (moveAfterParent selector) when at the end
        // of a potential smartFence will close it as a semi-open fence
        selector = '';
        requestUpdate(mathfield); // Re-render the closed smartFence
    }
    // 5.3 If this is the Spacebar and we're just before or right after
    // a text zone, insert the space inside the text zone
    if (mathfield.mode === 'math' && keystroke === 'Spacebar' && !shortcut) {
        const nextSibling = mathfield.model.sibling(1);
        const previousSibling = mathfield.model.sibling(-1);
        if (
            (nextSibling && nextSibling.mode === 'text') ||
            (previousSibling && previousSibling.mode === 'text')
        ) {
            insert(mathfield.model, ' ', { mode: 'text' });
        }
    }
    // 5.4 If there's a selector, perform it.
    if (selector) {
        mathfield.$perform(selector);
    } else if (shortcut) {
        // 5.5 Insert the shortcut
        // If the shortcut is a mandatory escape sequence (\}, etc...)
        // don't make it undoable, this would result in syntactically incorrect
        // formulas
        if (
            !/^(\\{|\\}|\\[|\\]|\\@|\\#|\\$|\\%|\\^|\\_|\\backslash)$/.test(
                shortcut
            )
        ) {
            // To enable the substitution to be undoable,
            // insert the character before applying the substitution
            const style = {
                ...getAnchorStyle(mathfield.model),
                ...mathfield.style,
            };
            insert(mathfield.model, Keyboard.eventToChar(evt), {
                suppressChangeNotifications: true,
                mode: mathfield.mode,
                style: style,
            });
            const saveMode = mathfield.mode;
            // Create a snapshot with the inserted character
            mathfield.undoManager.snapshotAndCoalesce(mathfield.config);
            // Revert to the state before the beginning of the shortcut
            // (restore doesn't change the undo stack)
            mathfield.undoManager.restore(
                mathfield.keystrokeBufferStates[stateIndex],
                { ...mathfield.config, suppressChangeNotifications: true }
            );
            mathfield.mode = saveMode;
        }
        contentWillChange(mathfield.model);
        const save = mathfield.model.suppressChangeNotifications;
        mathfield.model.suppressChangeNotifications = true;
        // Insert the substitute, possibly as a smart fence
        const style = {
            ...getAnchorStyle(mathfield.model),
            ...mathfield.style,
        };
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
        mathfield.undoManager.snapshot(mathfield.config);
        requestUpdate(mathfield);
        mathfield.model.announce('replacement');
        // If we're done with the shortcuts (found a unique one), reset it.
        if (resetKeystrokeBuffer) {
            mathfield.resetKeystrokeBuffer();
        }
    }
    // 6. Make sure the insertion point is scrolled into view
    mathfield.scrollIntoView();
    // 7. Keystroke has been handled, if it wasn't caught in the default
    // case, so prevent propagation
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
export function onTypedText(mathfield: Mathfield, text: string, options?) {
    if (mathfield.config.readOnly) {
        mathfield.model.announce('plonk');
        return;
    }
    options = options || {};
    // Focus, then provide audio and haptic feedback
    if (options.focus) {
        mathfield.$focus();
    }
    if (options.feedback) {
        if (mathfield.config.keypressVibration && navigator.vibrate) {
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
        const ev: KeyboardEvent = Keyboard.charToEvent(c) as KeyboardEvent;
        if (!onKeystroke(mathfield, Keyboard.keyboardEventToString(ev), ev)) {
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
            smartFence: mathfield.config.smartFence,
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
                            mathfield.config.scriptDepth[1]
                        ) {
                            mathfield.model.announce('plonk');
                            return;
                        }
                    } else if (selector === 'moveToSubscript') {
                        if (
                            subscriptDepth(mathfield) >=
                            mathfield.config.scriptDepth[0]
                        ) {
                            mathfield.model.announce('plonk');
                            return;
                        }
                    }
                    mathfield.$perform(selector);
                } else {
                    if (
                        mathfield.config.smartSuperscript &&
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
                            smartFence: mathfield.config.smartFence,
                        });
                    }
                }
            } else if (mathfield.mode === 'text') {
                insert(mathfield.model, c, { mode: 'text', style: style });
            }
        }
    }
    if (mathfield.mode !== 'command') {
        mathfield.undoManager.snapshotAndCoalesce(mathfield.config);
    }
    // Render the mathlist
    requestUpdate(mathfield);
    // Make sure the insertion point is visible
    mathfield.scrollIntoView();
    // Since the location of the popover depends on the position of the caret
    // only show the popover after the formula has been rendered and the
    // position of the caret calculated
    showPopoverWithLatex(mathfield, popoverText, displayArrows);
}

function superscriptDepth(mathfield: Mathfield) {
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
function subscriptDepth(mathfield: Mathfield) {
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
