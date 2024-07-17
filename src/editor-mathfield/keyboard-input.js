"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.onInput = exports.onKeystroke = void 0;
var grapheme_splitter_1 = require("../core/grapheme-splitter");
var keyboard_1 = require("../editor/keyboard");
var shortcuts_1 = require("../editor/shortcuts");
var keybindings_1 = require("../editor/keybindings");
var keyboard_layout_1 = require("../editor/keyboard-layout");
var commands_move_1 = require("../editor-model/commands-move");
var selection_utils_1 = require("../editor-model/selection-utils");
var autocomplete_1 = require("./autocomplete");
var render_1 = require("./render");
var smartmode_1 = require("./smartmode");
var keystroke_caption_1 = require("./keystroke-caption");
var mode_editor_1 = require("./mode-editor");
var leftright_1 = require("atoms/leftright");
var delimiters_1 = require("core/delimiters");
var utils_1 = require("../ui/events/utils");
var styling_1 = require("./styling");
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
 * ## Theory of Operation
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
function onKeystroke(mathfield, evt) {
    var _a, _b, _c;
    var model = mathfield.model;
    var keystroke = (0, keyboard_1.keyboardEventToString)(evt);
    // 1. Update the current keyboard layout based on this event
    if (evt.isTrusted) {
        (0, keyboard_layout_1.validateKeyboardLayout)(evt);
        var activeLayout = (0, keyboard_layout_1.getActiveKeyboardLayout)();
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
    (0, keystroke_caption_1.showKeystroke)(mathfield, keystroke);
    // If the event has already been handled, return
    if (evt.isTrusted && evt.defaultPrevented) {
        mathfield.flushInlineShortcutBuffer();
        return false;
    }
    // 4. Let's try to find a matching inline shortcut
    var shortcut;
    var shortcutLength = 0; // How many keys were consumed by the shortcut
    var selector = '';
    var stateIndex = 0;
    // 4.1 Check if the keystroke, prefixed with the previously typed keystrokes,
    // would match a long shortcut (i.e. '~~')
    // Ignore the key if Command or Control is pressed (it may be a keybinding,
    // see 4.3)
    var buffer = mathfield.inlineShortcutBuffer;
    if (mathfield.isSelectionEditable) {
        if (model.mode === 'math') {
            if (keystroke === '[Backspace]') {
                // If last operation was a shortcut conversion, "undo" the
                // conversion, otherwise, discard the last keystroke
                if (mathfield.undoManager.lastOp === 'insert-shortcut')
                    selector = 'undo';
                else
                    buffer.pop();
            }
            else if (!(0, utils_1.mightProducePrintableCharacter)(evt)) {
                // It was a non-alpha character (PageUp, End, etc...)
                mathfield.flushInlineShortcutBuffer();
            }
            else {
                var c = (0, keyboard_1.keyboardEventToChar)(evt);
                // Find the longest substring that matches a shortcut
                var keystrokes = __spreadArray(__spreadArray([], ((_b = (_a = buffer[buffer.length - 1]) === null || _a === void 0 ? void 0 : _a.keystrokes) !== null && _b !== void 0 ? _b : []), true), [
                    c,
                ], false);
                buffer.push({
                    state: model.getState(),
                    keystrokes: keystrokes,
                    leftSiblings: getLeftSiblings(mathfield)
                });
                //
                // Loop  over possible candidates, from the longest possible
                // to the shortest
                //
                shortcutLength = 0;
                var candidate = '';
                while (!shortcut && shortcutLength < keystrokes.length) {
                    stateIndex = buffer.length - (keystrokes.length - shortcutLength);
                    candidate = keystrokes.slice(shortcutLength).join('');
                    //
                    // Is this a simple inline shortcut?
                    //
                    shortcut = (0, shortcuts_1.getInlineShortcut)(buffer[stateIndex].leftSiblings, candidate, mathfield.options.inlineShortcuts);
                    //
                    // Is this a multichar symbol or other complex inline shortcut?
                    //
                    if (!shortcut &&
                        /^[a-zA-Z][a-zA-Z0-9]+?([_\^][a-zA-Z0-9\*\+\-]+?)?$/.test(candidate))
                        shortcut = mathfield.options.onInlineShortcut(mathfield, candidate);
                    shortcutLength += 1;
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
        // 4.2. Should we switch mode?
        //
        // Need to check this before determining if there's a valid shortcut
        // since if we switch to math mode, we may want to apply the shortcut
        // e.g. "slope = rise/run"
        if (mathfield.options.smartMode) {
            if (shortcut) {
                // If we found a shortcut (e.g. "alpha"),
                // switch to math mode and insert it
                mathfield.switchMode('math');
            }
            else if ((0, smartmode_1.smartMode)(mathfield, keystroke, evt)) {
                mathfield.switchMode({ math: 'text', text: 'math' }[model.mode]);
                selector = '';
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
            selector = (0, keybindings_1.getCommandForKeybinding)(mathfield.keybindings, model.mode, evt);
        }
        // 5.4 Handle the return/enter key
        if (!selector && (keystroke === '[Enter]' || keystroke === '[Return]')) {
            var success = true;
            if (model.contentWillChange({ inputType: 'insertLineBreak' })) {
                // No matching keybinding: trigger a commit
                if (mathfield.host) {
                    success = mathfield.host.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                }
                if (!success && evt.preventDefault) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }
                else {
                    // Dispatch an 'input' event matching the behavior of `<textarea>`
                    model.contentDidChange({ inputType: 'insertLineBreak' });
                }
            }
            return success;
        }
        if ((!selector || keystroke === '[Space]') && model.mode === 'math') {
            //
            // 5.5 If this is the Space bar and we're just before or right after
            // a text zone, or if `mathModeSpace` is enabled, insert the space
            //
            if (keystroke === '[Space]') {
                // Stop adopting the style from surrounding atoms
                // (the bias is reset when the selection changes)
                mathfield.styleBias = 'none';
                // The space bar can be used to separate inline shortcuts
                mathfield.flushInlineShortcutBuffer();
                // If will also terminate styling in progress
                if (mathfield.options.mathModeSpace) {
                    mode_editor_1.ModeEditor.insert(model, mathfield.options.mathModeSpace, {
                        format: 'latex',
                        mode: 'math'
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
                var nextSibling = model.at(model.position + 1);
                var previousSibling = model.at(model.position - 1);
                if ((nextSibling === null || nextSibling === void 0 ? void 0 : nextSibling.mode) === 'text' || (previousSibling === null || previousSibling === void 0 ? void 0 : previousSibling.mode) === 'text') {
                    mode_editor_1.ModeEditor.insert(model, ' ', { mode: 'text' });
                    mathfield.snapshot('insert-space');
                    mathfield.dirty = true;
                    mathfield.scrollIntoView();
                    return false;
                }
            }
            //
            // 4.6 Handle the decimal separator
            //
            if (((_c = model.at(model.position)) === null || _c === void 0 ? void 0 : _c.isDigit()) &&
                globalThis.MathfieldElement.decimalSeparator === ',' &&
                (0, keyboard_1.keyboardEventToChar)(evt) === ',')
                selector = 'insertDecimalSeparator';
        }
    }
    // No shortcut, no selector. Consider a smartfence
    if (!shortcut && !selector) {
        //
        // 5. Try to insert a smart fence.
        //
        if (!model.mathfield.smartFence) {
            //
            // 5.1. When smartFence is turned off, only do a "smart" fence insert
            // if we're inside a `leftright`, at the last char
            //
            var parent_1 = model.at(model.position).parent;
            if (parent_1 instanceof leftright_1.LeftRightAtom &&
                parent_1.rightDelim === '?' &&
                model.at(model.position).isLastSibling &&
                /^[)}\]|]$/.test(keystroke)) {
                mathfield.snapshot();
                parent_1.isDirty = true;
                parent_1.rightDelim = keystroke;
                model.position += 1;
                model.selectionDidChange();
                model.contentDidChange({
                    data: (0, keyboard_1.keyboardEventToChar)(evt),
                    inputType: 'insertText'
                });
                mathfield.snapshot('insert-fence');
                mathfield.dirty = true;
                mathfield.scrollIntoView();
                if (evt.preventDefault)
                    evt.preventDefault();
                return false;
            }
            //
            // 5.2. Or inserting a fence around a selection
            //
            if (!model.selectionIsCollapsed) {
                var fence = (0, keyboard_1.keyboardEventToChar)(evt);
                if (fence === '(' || fence === '{' || fence === '[') {
                    var lDelim = { '(': '(', '{': '\\lbrace', '[': '\\lbrack' }[fence];
                    var rDelim = { '(': ')', '{': '\\rbrace', '[': '\\rbrack' }[fence];
                    var _d = (0, selection_utils_1.range)(model.selection), start = _d[0], end = _d[1];
                    mathfield.snapshot();
                    model.position = end;
                    mode_editor_1.ModeEditor.insert(model, rDelim, { format: 'latex' });
                    model.position = start;
                    mode_editor_1.ModeEditor.insert(model, lDelim, { format: 'latex' });
                    model.setSelection(start + 1, end + 1);
                    model.contentDidChange({
                        data: fence,
                        inputType: 'insertText'
                    });
                    mathfield.snapshot('insert-fence');
                    mathfield.dirty = true;
                    mathfield.scrollIntoView();
                    if (evt.preventDefault)
                        evt.preventDefault();
                    return false;
                }
            }
        }
        else if (insertSmartFence(model, (0, keyboard_1.keyboardEventToChar)(evt), (0, styling_1.computeInsertStyle)(mathfield))) {
            mathfield.dirty = true;
            mathfield.scrollIntoView();
            if (evt.preventDefault)
                evt.preventDefault();
            return false;
        }
        return true;
    }
    //
    // 6. Insert the shortcut or perform the action for this selector
    //
    //
    // 6.1 If we have a `moveAfterParent` selector (usually triggered with
    // `spacebar`), and we're at the end of a smart fence, close the fence with
    // an empty (.) right delimiter
    //
    var child = model.at(Math.max(model.position, model.anchor));
    var parent = child.parent;
    if (selector === 'moveAfterParent' &&
        (parent === null || parent === void 0 ? void 0 : parent.type) === 'leftright' &&
        child.isLastSibling &&
        mathfield.options.smartFence &&
        insertSmartFence(model, '.', mathfield.defaultStyle)) {
        // Pressing the space bar (moveAfterParent selector) when at the end
        // of a potential smartFence will close it as a semi-open fence
        selector = '';
        (0, render_1.requestUpdate)(mathfield); // Re-render the closed smartFence
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
    if (selector)
        mathfield.executeCommand(selector);
    else if (shortcut) {
        //
        // 6.4 Insert the shortcut
        //
        var style_1 = (0, styling_1.computeInsertStyle)(mathfield);
        //
        // Make the substitution to be undoable
        //
        // Revert to the state before the beginning of the shortcut
        model.setState(buffer[stateIndex].state);
        // Insert the keystrokes as regular characters
        var keystrokes = buffer[buffer.length - 1].keystrokes;
        keystrokes = keystrokes.slice(shortcutLength - 1);
        for (var _i = 0, keystrokes_1 = keystrokes; _i < keystrokes_1.length; _i++) {
            var c = keystrokes_1[_i];
            mode_editor_1.ModeEditor.insert(model, c, {
                silenceNotifications: true,
                style: style_1
            });
        }
        mathfield.snapshot("insert-shortcut");
        //
        // Revert, then insert the substitution
        //
        // Revert to the state before the beginning of the shortcut
        model.setState(buffer[stateIndex].state);
        model.deferNotifications({
            content: true,
            selection: true,
            data: shortcut,
            type: 'insertText'
        }, function () {
            // Insert the substitute
            mode_editor_1.ModeEditor.insert(model, shortcut, { format: 'latex', style: style_1 });
            // Check if as a result of the substitution there is now an isolated
            // (text mode) space (surrounded by math). In which case, remove it.
            (0, smartmode_1.removeIsolatedSpace)(mathfield.model);
            // Switch (back) to text mode if the shortcut ended with a space
            if (shortcut.endsWith(' ')) {
                mathfield.switchMode('text');
                mode_editor_1.ModeEditor.insert(model, ' ', { style: style_1, mode: 'text' });
            }
            mathfield.snapshot();
            // If as a result of the substitution the selection is not collapsed,
            // the substitution inserted a place holder. Reset the buffer.
            if (!model.selectionIsCollapsed)
                mathfield.flushInlineShortcutBuffer();
            return true; // Content changed
        });
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
    if (evt.preventDefault)
        evt.preventDefault();
    return false;
}
exports.onKeystroke = onKeystroke;
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
function onInput(mathfield, text, options) {
    var model = mathfield.model;
    if (!mathfield.isSelectionEditable) {
        model.announce('plonk');
        return;
    }
    options !== null && options !== void 0 ? options : (options = {});
    //
    // 1/ Focus (and scroll into view), then provide audio and haptic feedback
    //
    if (options.focus)
        mathfield.focus();
    if (options.feedback)
        globalThis.MathfieldElement.playSound('keypress');
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
    var graphemes = (0, grapheme_splitter_1.splitGraphemes)(text);
    var keyboard = window.mathVirtualKeyboard;
    if (keyboard === null || keyboard === void 0 ? void 0 : keyboard.isShifted) {
        graphemes =
            typeof graphemes === 'string'
                ? graphemes.toUpperCase()
                : graphemes.map(function (c) { return c.toUpperCase(); });
    }
    if (options.simulateKeystroke) {
        var handled = true;
        for (var _i = 0, graphemes_1 = graphemes; _i < graphemes_1.length; _i++) {
            var c = graphemes_1[_i];
            if (onKeystroke(mathfield, new KeyboardEvent('keypress', { key: c })))
                handled = false;
        }
        if (handled)
            return;
    }
    //
    // 4/ Insert the specified text at the current insertion point.
    // If the selection is not collapsed, the content will be deleted first
    //
    if (model.mode === 'latex') {
        model.deferNotifications({ content: true, selection: true, data: text, type: 'insertText' }, function () {
            (0, autocomplete_1.removeSuggestion)(mathfield);
            for (var _i = 0, graphemes_4 = graphemes; _i < graphemes_4.length; _i++) {
                var c = graphemes_4[_i];
                mode_editor_1.ModeEditor.insert(model, c, { insertionMode: 'replaceSelection' });
            }
            mathfield.snapshot('insert-latex');
            (0, autocomplete_1.updateAutocomplete)(mathfield);
        });
    }
    else if (model.mode === 'text') {
        var style = __assign(__assign({}, getSelectionStyle(model)), mathfield.defaultStyle);
        for (var _a = 0, graphemes_2 = graphemes; _a < graphemes_2.length; _a++) {
            var c = graphemes_2[_a];
            mode_editor_1.ModeEditor.insert(model, c, { style: style, insertionMode: 'replaceSelection' });
        }
        mathfield.snapshot('insert-text');
    }
    else if (model.mode === 'math')
        for (var _b = 0, graphemes_3 = graphemes; _b < graphemes_3.length; _b++) {
            var c = graphemes_3[_b];
            insertMathModeChar(mathfield, c);
        }
    //
    // 5/ Render the mathfield
    //    and make sure the caret is visible
    //
    mathfield.dirty = true;
    mathfield.scrollIntoView();
}
exports.onInput = onInput;
function getLeftSiblings(mf) {
    var model = mf.model;
    var result = [];
    var atom = model.at(Math.min(model.position, model.anchor));
    while (atom.type !== 'first') {
        result.push(atom);
        atom = atom.leftSibling;
    }
    return result;
}
function insertMathModeChar(mathfield, c) {
    var model = mathfield.model;
    // Some characters are mapped to commands. Handle them here.
    // This is important to handle synthetic text input and
    // non-US keyboards, on which, for example, the '^' key is
    // not mapped to 'Shift-Digit6'.
    var selector = {
        '^': 'moveToSuperscript',
        '_': 'moveToSubscript',
        ' ': mathfield.options.mathModeSpace
            ? ['insert', mathfield.options.mathModeSpace]
            : 'moveAfterParent'
    }[c];
    if (selector) {
        mathfield.executeCommand(selector);
        return;
    }
    var style = __assign({}, (0, styling_1.computeInsertStyle)(mathfield));
    // If we're inserting a non-alphanumeric character, reset the variant
    if (!/[a-zA-Z0-9]/.test(c) && mathfield.styleBias !== 'none') {
        style.variant = 'normal';
        style.variantStyle = undefined;
    }
    var atom = model.at(model.position);
    if (/\d/.test(c) &&
        mathfield.options.smartSuperscript &&
        atom.parentBranch === 'superscript' &&
        atom.parent.type !== 'mop' &&
        atom.parent.type !== 'operator' &&
        atom.parent.type !== 'extensible-symbol' &&
        atom.hasNoSiblings) {
        // We are inserting a digit into an empty superscript
        // If smartSuperscript is on, insert the digit, and exit the superscript.
        if (!mode_editor_1.ModeEditor.insert(model, c, { style: style, insertionMode: 'replaceSelection' })) {
            mathfield.undoManager.pop();
            return;
        }
        mathfield.snapshot('insert-mord');
        (0, commands_move_1.moveAfterParent)(model);
        return;
    }
    // If trying to insert a special character, that is a character that could
    // also be interpreted as a LaTeX metacharacter, escape it.
    var input = c;
    if (input === '{')
        input = '\\lbrace';
    else if (input === '}')
        input = '\\rbrace';
    else if (input === '&')
        input = '\\&';
    else if (input === '#')
        input = '\\#';
    else if (input === '$')
        input = '\\$';
    else if (input === '%')
        input = '\\%';
    else if (input === '~')
        input = '\\~';
    else if (input === '\\')
        input = '\\backslash';
    // General purpose character insertion
    if (!mode_editor_1.ModeEditor.insert(model, input, {
        style: style,
        insertionMode: 'replaceSelection'
    }))
        return;
    mathfield.snapshot("insert-".concat(model.at(model.position).type));
}
function getSelectionStyle(model) {
    var _a, _b, _c, _d;
    // When the selection is collapsed, we inherit the style from the
    // preceding atom
    if (model.selectionIsCollapsed)
        return (_b = (_a = model.at(model.position)) === null || _a === void 0 ? void 0 : _a.style) !== null && _b !== void 0 ? _b : {};
    // Otherwise pick the style of the first (leftmost) atom **in** the
    // selection. This is a behavior consistent with text editors such as
    // TextEdit
    var first = (0, selection_utils_1.range)(model.selection)[0];
    return (_d = (_c = model.at(first + 1)) === null || _c === void 0 ? void 0 : _c.style) !== null && _d !== void 0 ? _d : {};
}
/**
 * Insert a smart fence '(', '{', '[', etc...
 * If not handled (because `key` was not a fence), return false.
 */
function insertSmartFence(model, key, style) {
    var _a;
    var _b;
    if (!key)
        return false;
    if (model.mode !== 'math')
        return false;
    var atom = model.at(model.position);
    var parent = atom.parent;
    // Normalize some fences (`key` is a character input)
    var fence = {
        '(': '(',
        ')': ')',
        '{': '\\lbrace',
        '}': '\\rbrace',
        '[': '\\lbrack',
        ']': '\\rbrack',
        '|': '|'
    }[key];
    if (!fence)
        return false;
    var lDelim = delimiters_1.LEFT_DELIM[fence];
    var rDelim = delimiters_1.RIGHT_DELIM[fence];
    if (!model.selectionIsCollapsed) {
        // There is a selection, wrap it with the fence
        model.mathfield.snapshot();
        var _c = (0, selection_utils_1.range)(model.selection), start = _c[0], end = _c[1];
        var body = model.extractAtoms([start, end]);
        var atom_1 = parent.addChildrenAfter([
            new leftright_1.LeftRightAtom('left...right', body, {
                leftDelim: fence,
                rightDelim: rDelim
            }),
        ], model.at(start));
        model.setSelection(model.offsetOf(atom_1.firstChild), model.offsetOf(atom_1.lastChild));
        model.mathfield.snapshot('insert-fence');
        model.contentDidChange({ data: fence, inputType: 'insertText' });
        return true;
    }
    //
    // 1. Are we inserting a middle fence?
    // ...as in {...|...}
    //
    if (fence === '|') {
        var delims = parent instanceof leftright_1.LeftRightAtom
            ? parent.leftDelim + parent.rightDelim
            : '';
        if (delims === '\\lbrace\\rbrace' ||
            delims === '\\{\\}' ||
            delims === '\\lbrace?') {
            model.mathfield.snapshot();
            mode_editor_1.ModeEditor.insert(model, '\\,\\middle\\vert\\,', {
                format: 'latex',
                style: style
            });
            model.mathfield.snapshot('insert-fence');
            model.contentDidChange({ data: fence, inputType: 'insertText' });
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
        if (parent instanceof leftright_1.LeftRightAtom &&
            parent.firstChild === atom && // At first child
            (parent.leftDelim === '?' || parent.leftDelim === '.')) {
            parent.leftDelim = fence;
            parent.isDirty = true;
            model.mathfield.snapshot();
            model.contentDidChange({ data: fence, inputType: 'insertText' });
            model.mathfield.snapshot('insert-fence');
            return true;
        }
        //
        // 2.2
        //
        // Is there a matching right delim as a right sibling?
        //
        if (!(parent instanceof leftright_1.LeftRightAtom)) {
            var sibling = atom;
            while (sibling) {
                if (sibling.type === 'mclose' && sibling.value === rDelim)
                    break;
                sibling = sibling.rightSibling;
            }
            if (sibling) {
                model.mathfield.snapshot();
                // We've found a matching sibling
                var body = model.extractAtoms([
                    model.offsetOf(atom),
                    model.offsetOf(sibling),
                ]);
                body.pop();
                parent.addChildrenAfter([
                    new leftright_1.LeftRightAtom('left...right', body, {
                        leftDelim: fence,
                        rightDelim: rDelim
                    }),
                ], atom);
                model.position = model.offsetOf(parent.firstChild) + 1;
                model.contentDidChange({ data: fence, inputType: 'insertText' });
                model.mathfield.snapshot('insert-fence');
                return true;
            }
        }
        // If we have a `leftright` sibling to our right
        // with an indeterminate left fence,
        // move what's between us and the `leftright` inside the `leftright`
        var lastSibling = model.offsetOf(atom.lastSibling);
        var i = void 0;
        for (i = model.position; i <= lastSibling; i++) {
            var atom_2 = model.at(i);
            if (atom_2 instanceof leftright_1.LeftRightAtom &&
                (atom_2.leftDelim === '?' || atom_2.leftDelim === '.') &&
                isValidOpen(fence, atom_2.rightDelim))
                break;
        }
        //
        // 2.4
        //
        var match = model.at(i);
        if (i <= lastSibling && match instanceof leftright_1.LeftRightAtom) {
            match.leftDelim = fence;
            model.mathfield.snapshot();
            var extractedAtoms = model.extractAtoms([model.position, i - 1]);
            // remove any atoms of type 'first'
            extractedAtoms = extractedAtoms.filter(function (value) { return value.type !== 'first'; });
            match.addChildren(extractedAtoms, match.parentBranch);
            model.position += 1;
            model.contentDidChange({ data: fence, inputType: 'insertText' });
            model.mathfield.snapshot('insert-fence');
            return true;
        }
        //
        // 2.5
        //
        // If we're inside a `leftright`, but not the first atom,
        // and the `leftright` left delim is indeterminate
        // adjust the body (put everything before the insertion point outside)
        if (parent instanceof leftright_1.LeftRightAtom &&
            (parent.leftDelim === '?' || parent.leftDelim === '.') &&
            isValidOpen(fence, parent.rightDelim)) {
            parent.isDirty = true;
            parent.leftDelim = fence;
            model.mathfield.snapshot();
            var extractedAtoms = model.extractAtoms([
                model.offsetOf(atom.firstSibling),
                model.position,
            ]);
            for (var _i = 0, extractedAtoms_1 = extractedAtoms; _i < extractedAtoms_1.length; _i++) {
                var extractedAtom = extractedAtoms_1[_i];
                parent.parent.addChildBefore(extractedAtom, parent);
            }
            //model.position = model.offsetOf(parent);
            model.contentDidChange({ data: fence, inputType: 'insertText' });
            model.mathfield.snapshot('insert-fence');
            return true;
        }
        //
        // 2.6 Inserting an open delim, with no body
        //
        if (!(parent instanceof leftright_1.LeftRightAtom && parent.leftDelim === '|')) {
            // Are we inserting a repeating decimal indicator, i.e. `1.23(456)`
            // If so, we don't want a left-right, so that the spacing is correct
            // when using a comma as a decimal separator, i.e. `1,23(456)`
            if (fence === '(') {
                // Check if the left siblings follow the pattern of a decimal separator
                // followed by zero or more digits
                var i_1 = model.position - 1;
                var hasDecimalPoint = false;
                while (i_1 >= 0) {
                    var atom_3 = model.at(i_1);
                    if (atom_3.type === 'first')
                        break;
                    if (atom_3.type === 'mord' && atom_3.value && /^[\d]$/.test(atom_3.value)) {
                        // Got a digit, keep looking
                        i_1 -= 1;
                        continue;
                    }
                    if (atom_3.type === 'group' &&
                        ((_b = atom_3.body) === null || _b === void 0 ? void 0 : _b.length) === 2 &&
                        atom_3.body[0].type === 'first' &&
                        atom_3.body[1].value === ',') {
                        hasDecimalPoint = true;
                        break;
                    }
                    if (atom_3.type === 'mord' &&
                        (atom_3.value === ',' || atom_3.value === '.')) {
                        hasDecimalPoint = true;
                        break;
                    }
                    break;
                }
                if (hasDecimalPoint)
                    return false;
            }
            // We have a valid open fence as input
            model.mathfield.snapshot();
            mode_editor_1.ModeEditor.insert(model, "\\left".concat(fence, "\\right?"), {
                format: 'latex',
                style: style
            });
            // If there is content after the anchor, move it into the `leftright` atom
            if (atom.lastSibling.type !== 'first') {
                var lastSiblingOffset = model.offsetOf(atom.lastSibling);
                var content = model.extractAtoms([model.position, lastSiblingOffset]);
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
        // If we have a ), check if we might be in a repeating decimal notation
        // e.g. 1.23(456). If so, skip the smartfence
        if (fence === ')') {
            // Check if the left siblings follow the pattern of one or more digits
            var i_2 = model.position - 1;
            var hasDigits = false;
            while (i_2 >= 0) {
                var atom_4 = model.at(i_2);
                if (atom_4.type === 'first')
                    break;
                if (atom_4.type === 'mord' && atom_4.value && /^[\d]$/.test(atom_4.value)) {
                    // Got a digit, keep looking
                    hasDigits = true;
                    i_2 -= 1;
                    continue;
                }
                break;
            }
            if (hasDigits &&
                model.at(i_2).type === 'mopen' &&
                model.at(i_2).value === '(')
                return false;
        }
        // We found a target open fence matching this delim.
        // Note that `targetLeftDelim` may not match `fence`. That's OK.
        // Check if there's a stand-alone sibling atom matching...
        var sibling = atom;
        while (sibling) {
            // There is a left sibling that matches: make a leftright
            if (sibling.type === 'mopen' && sibling.value === lDelim) {
                model.mathfield.snapshot();
                var insertAfter = sibling.leftSibling;
                var body = model.extractAtoms([
                    model.offsetOf(sibling.leftSibling),
                    model.offsetOf(atom),
                ]);
                // Remove the first element (which is a 'first' atom)
                _a = body, body = _a.slice(1);
                var result = new leftright_1.LeftRightAtom('left...right', body, {
                    leftDelim: lDelim,
                    rightDelim: fence
                });
                parent.addChildrenAfter([result], insertAfter);
                model.position = model.offsetOf(result);
                model.contentDidChange({ data: fence, inputType: 'insertText' });
                model.mathfield.snapshot('insert-fence');
                return true;
            }
            sibling = sibling.leftSibling;
        }
        // If we're the last atom inside a 'leftright', update the parent
        if (parent instanceof leftright_1.LeftRightAtom &&
            atom.isLastSibling &&
            isValidClose(parent.leftDelim, fence)) {
            model.mathfield.snapshot();
            parent.isDirty = true;
            parent.rightDelim = fence;
            model.position += 1;
            model.contentDidChange({ data: fence, inputType: 'insertText' });
            model.mathfield.snapshot('insert-fence');
            return true;
        }
        // If we have a `leftright` sibling to our left
        // with an indeterminate right fence,
        // move what's between us and the `leftright` inside the `leftright`
        var firstSibling = model.offsetOf(atom.firstSibling);
        var i = void 0;
        for (i = model.position; i >= firstSibling; i--) {
            var atom_5 = model.at(i);
            if (atom_5 instanceof leftright_1.LeftRightAtom &&
                (atom_5.rightDelim === '?' || atom_5.rightDelim === '.') &&
                isValidClose(atom_5.leftDelim, fence))
                break;
        }
        var match = model.at(i);
        if (i >= firstSibling && match instanceof leftright_1.LeftRightAtom) {
            model.mathfield.snapshot();
            match.rightDelim = fence;
            match.addChildren(model.extractAtoms([i, model.position]), match.parentBranch);
            model.contentDidChange({ data: fence, inputType: 'insertText' });
            model.mathfield.snapshot('insert-fence');
            return true;
        }
        // If we're inside a `leftright`, but not the last atom,
        // and the `leftright` right delim is indeterminate
        // adjust the body (put everything after the insertion point outside)
        if (parent instanceof leftright_1.LeftRightAtom &&
            (parent.rightDelim === '?' || parent.rightDelim === '.') &&
            isValidClose(parent.leftDelim, fence)) {
            model.mathfield.snapshot();
            parent.isDirty = true;
            parent.rightDelim = fence;
            parent.parent.addChildren(model.extractAtoms([model.position, model.offsetOf(atom.lastSibling)]), parent.parentBranch);
            model.position = model.offsetOf(parent);
            model.contentDidChange({ data: fence, inputType: 'insertText' });
            model.mathfield.snapshot('insert-fence');
            return true;
        }
        // Is our grand-parent a 'leftright'?
        // If `\left(\frac{1}{x|}\right?` with the cursor at `|`
        // go up to the 'leftright' and apply it there instead
        var grandparent = parent.parent;
        if (grandparent instanceof leftright_1.LeftRightAtom &&
            (grandparent.rightDelim === '?' || grandparent.rightDelim === '.') &&
            model.at(model.position).isLastSibling) {
            model.position = model.offsetOf(grandparent);
            return insertSmartFence(model, fence, style);
        }
        // Meh... We couldn't find a matching open fence. Just insert the
        // closing fence as a regular character
        return false;
    }
    return false;
}
function isValidClose(open, close) {
    if (!open)
        return true;
    if (['(', '\\lparen', '{', '\\{', '\\lbrace', '[', '\\lbrack'].includes(open)) {
        return [')', '\\rparen', '}', '\\}', '\\rbrace', ']', '\\rbrack'].includes(close);
    }
    return delimiters_1.RIGHT_DELIM[open] === close;
}
function isValidOpen(open, close) {
    if (!close)
        return true;
    if ([')', '\\rparen', '}', '\\}', '\\rbrace', ']', '\\rbrack'].includes(close)) {
        return ['(', '\\lparen', '{', '\\{', '\\lbrace', '[', '\\lbrack'].includes(open);
    }
    return delimiters_1.LEFT_DELIM[close] === open;
}
