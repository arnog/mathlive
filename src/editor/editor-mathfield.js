
/**
 * See {@linkcode MathField}
 * @module editor/mathfield
 * @private
 */
define([
    'mathlive/core/definitions', 
    'mathlive/core/mathAtom', 
    'mathlive/core/lexer', 
    'mathlive/core/parser', 
    'mathlive/core/span', 
    'mathlive/editor/editor-editableMathlist', 
    'mathlive/editor/editor-mathpath', 
    'mathlive/editor/editor-keyboard', 
    'mathlive/editor/editor-undo', 
    'mathlive/editor/editor-shortcuts', 
    'mathlive/editor/editor-commands',
    'mathlive/core/grapheme-splitter',
    'mathlive/addons/outputLatex', 
    'mathlive/addons/outputMathML', 
    'mathlive/addons/outputSpokenText'], 
    function(Definitions, MathAtom, Lexer, ParserModule, Span, 
    EditableMathlist, MathPath, Keyboard, Undo, Shortcuts, Commands, GraphemeSplitter,
// eslint-disable-next-line no-unused-vars
    OutputLatex, OutputMathML, OutputSpokenText) {

/* 
    Note: 
    The OutputLatex, OutputMathML and OutputSpokenText  modules are required, 
    even though they are not referenced directly.

    They modify the MathAtom class, adding toLatex(), toMathML() and
    toSpeakableText() respectively.
*/



function on(el, selectors, listener, options) {
    selectors = selectors.split(' ');
    for (const sel of selectors) {
        el.addEventListener(sel, listener, options);
    }
}

function off(el, selectors, listener, options) {
    selectors = selectors.split(' ');
    for (const sel of selectors) {
        el.removeEventListener(sel, listener, options);
    }
}




/**
 * **Note**
 * - Method names that _begin with_ an underbar `_` are private and meant
 * to be used only by the implementation of the class.
 * - Method names that _end with_ an underbar `_` are selectors. They can 
 * be invoked by calling the `perform()` function of a `MathField` object. Note
 * that the selector name does not include the underbar.
 * 
 * For example:
 * ```
 *    mf.perform('selectAll');
 * ```
 *  
 * @param {Element} element 
 * @param {Object} config - See [`MathLive.makeMathField()`]{@link MathLive#makeMathField} for details
 * @property {Element} element - The DOM element this mathfield is attached to.
 * @property {Object} config - A key/value/pair object that includes options
 * customizing the behavior of the mathfield
 * @property {string} id - A unique ID identifying this mathfield
 * @property {boolean} keystrokeCaptionVisible - True if the keystroke caption
 * panel is visible
 * @class
 * @global
 */
function MathField(element, config) {
    // Setup default config options
    this.config(config || {});

    this.element = element;

    // Save existing content
    this.originalContent = element.innerHTML;
    let elementText = this.element.textContent;
    if (elementText) elementText = elementText.trim();

    // Additional elements used for UI.
    // They are retrieved in order a bit later, so they need to be kept in sync
    // 1.0/ The field, where the math equation will be displayed
    // 1.1/ The widget to activate the command bar
    // 2/ The popover panel which displays info in command mode
    // 3/ The keystroke caption panel (option+shift+K)
    // 4/ The command bar
    // 5.0/ The area to stick MathML for screen reading larger exprs (not used right now)
    //      The for the area is that focus would bounce their and then back triggering the
    //         screen reader to read it
    // 5.1/ The aria-live region for announcements
    let markup = ''
    if (!this.config.substituteTextArea) {
        markup += '<span class="ML__textarea">' +
            '<textarea class="ML__textarea--textarea" autocapitalize="off" autocomplete="off" ' + 
            'autocorrect="off" spellcheck="false" aria-hidden="true" tabindex="0">' +
            '</textarea>' +
        '</span>';
    } else {
        if (typeof this.config.substituteTextArea === 'string') {
            markup += this.config.substituteTextArea;
        } else {
            // We don't really need this one, but we keep it here so that the 
            // indexes below remain the same whether a substituteTextArea is 
            // provided or not.
            markup += '<span></span>';
        }
    }
    markup += '<span class="ML__fieldcontainer" aria-hidden="true">' +
            '<span class="ML__fieldcontainer--field"></span>';

    if (this.config.commandbarToggle === 'visible') {
        markup += '<span class="ML__commandbartoggle"' +
                    'role="button" tabindex="0" aria-label="Toggle Command Bar">' +
                    '<svg viewBox="0 0 21 14" height="14">' +
                    '<path d="M10.35 13.55L0 3.2 3.06.13l7.16 7.17 7.3-7.3 3.2 3.2-10.36 10.35v-.01l-.01.01z" fill-rule="evenodd" clip-rule="evenodd"></path>' +
                    '</svg>' +
                '</span>';
    } else {
        markup += '<span ></span>';
    }
    markup += '</span>';
    
    markup +=
        '<div class="ML__popover" aria-hidden="true"></div>' + 
        '<div class="ML__keystrokecaption" aria-hidden="true"></div>' + 
        '<div class="ML__commandbar" aria-hidden="true">' +
            '<div class="ML__commandbar--buttons" role="toolbar" aria-label="Command Bar"></div>' + 
            '<div class="ML__commandbar--panel"></div>' +
        '</div>';
    
    markup +=   '<div class="ML__HiddenAccessibleMath">' +
                    '<span></span>' + 
                    '<span aria-live="assertive" aria-atomic="true">  </span>' +
                '</div>';

    this.element.innerHTML = markup;

    let iChild = 0;       // index of child -- used to make changes below easier
    if (typeof this.config.substituteTextArea === 'function') {
        this.textarea =  this.config.substituteTextArea();
    } else {
        this.textarea = this.element.children[iChild++].firstElementChild;
    }
    this.field = this.element.children[iChild].children[0];
    this.commandbarToggle = this.element.children[iChild++].children[1];
    this._attachButtonHandlers(this.commandbarToggle, 'toggleCommandBar');
    this.popover = this.element.children[iChild++];
    this.keystrokeCaption = this.element.children[iChild++];
    this.commandBar = this.element.children[iChild++];
    this.commandButtons = this.commandBar.children[0];
    this.commandPanel = this.commandBar.children[1];
    this.accessibleNode = this.element.children[iChild].children[0];
    this.ariaLiveText = this.element.children[iChild++].children[1];
 
    // The keystroke caption panel and the command bar are 
    // initially hidden
    this.keystrokeCaptionVisible = false;
    this.commandBarVisible = false;

    // This index indicates which of the suggestions available to 
    // display in the popover panel
    this.suggestionIndex = 0;

    // Focus/blur state
    this.blurred = true;
    on(window, 'focus', this._onFocus.bind(this));
    on(window, 'blur', this._onBlur.bind(this));

    // Capture clipboard events
    on(this.textarea, 'cut', this._onCut.bind(this));
    on(this.textarea, 'copy', this._onCopy.bind(this));
    on(this.textarea, 'paste', this._onPaste.bind(this));

    // Delegate keyboard events
    Keyboard.delegateKeyboardEvents(this.textarea, {
        container:      this.element,
        typedText:      this._onTypedText.bind(this),
        paste:          this._onPaste.bind(this),
        keystroke:      this._onKeystroke.bind(this),
        focus:          this._onFocus.bind(this),
        blur:           this._onBlur.bind(this),
    })


    // Delegate mouse and touch events
    on(this.element, 'touchstart mousedown', this._onPointerDown.bind(this), 
        {passive: false, capture: false});

    // Request notification for when the window is resized (
    // or the device switched from portrait to landscape) to adjust
    // the UI (popover, etc...)
    on(window, 'resize', this._onResize.bind(this));


    // Override some handlers in the config
    const localConfig = Object.assign({}, config);
    localConfig.onSelectionDidChange = 
        MathField.prototype._onSelectionDidChange.bind(this);
    localConfig.onSelectionWillChange = 
        MathField.prototype._onSelectionWillChange.bind(this);
    localConfig.onContentWillChange = 
        MathField.prototype._onContentWillChange.bind(this);
        localConfig.onContentDidChange = 
        MathField.prototype._onContentDidChange.bind(this);
    localConfig.announceChange = 
        MathField.prototype._announceChange.bind(this);

    this.mathlist = new EditableMathlist.EditableMathlist(localConfig);

    // Prepare to manage undo/redo
    this.undoManager = new Undo.UndoManager(this.mathlist);

    // If there was some content in the element, use it for the initial
    // value of the mathfield
    if (elementText.length > 0) {
        this.latex(elementText);
    }

    // If fonts get loaded (which could happen as a result of the first pass 
    // rendering done in .latex()), render again.
    const that = this;
    document.fonts.ready.then(() => that._render());
}

/**
 * Revert this math field to its original content. After this method has been 
 * called, no other methods can be called on the MathField object. To turn the
 * element back into a MathField, call `MathLive.makeMathField()` on the 
 * element again to get a new math field object.
 * 
 * @method MathField#revertToOriginalContent
 */
MathField.prototype.revertToOriginalContent = function() {
    this.element.innerHTML = this.originalContent;
    delete this.accessibleNode;
    delete this.ariaLiveText;
    delete this.field;
    delete this.textarea;
    delete this.commandbarToggle;
    delete this.popover;
    delete this.keystrokeCaption;
    delete this.commandBar;
    delete this.commandButtons;
    delete this.commandPanel;
    off(this.element, 'touchstart mousedown', this._onPointerDown.bind(this));
    off(window, 'resize', this._onResize.bind(this));
}


/**
 * Utility function that returns the element which has the caret
 * 
 * @param {DomElement} el 
 * @private
 */
function _findElementWithCaret(el) {
    if (el.classList.contains('ML__caret')) {
        return el;
    }
    let result;
    Array.from(el.children).forEach(function(child) {
        result = result || _findElementWithCaret(child);
    });
    return result;
}



/**
 * Return the (x,y) client coordinates of the caret
 * 
 * @method MathField#_getCaretPosition
 * @private
 */
MathField.prototype._getCaretPosition = function() {
    const caret = _findElementWithCaret(this.field);
    if (caret) {
        const bounds = caret.getBoundingClientRect();
        return {
            x: bounds.right + window.scrollX, 
            y: bounds.bottom + window.scrollY };
    }
    return null;
}


/**
 * Return a tuple of an element and a distance from point (x, y)
 * @param {Element} el 
 * @param {number} x 
 * @param {number} y 
 * @function module:editor/mathfield#nearestElementFromPoint
 * @private
 */
function nearestElementFromPoint(el, x, y) {
    let result = { element: null };
    let considerChildren = true;
    const r = el.getBoundingClientRect();
    if (!el.getAttribute('data-atom-id')) {
        // This element may not have a matching atom, but its children might
        result.distance = Number.POSITIVE_INFINITY;
    } else {
        result.element = el;

        // Calculate the (square of the ) distance to the rectangle
        const dx = Math.max(r.left - x, 0, x - r.right);
        const dy = Math.max(r.top - y, 0, y - r.bottom);
        result.distance = dx * dx + dy * dy;

        // Only consider children if the target is inside the (horizontal) bounds of 
        // of the element.
        // This avoid searching the numerator/denominator when a fraction
        // is the last element in the formula.
        considerChildren = x >= r.left && x <= r.right;
    }

    if (considerChildren && el.children) {
        Array.from(el.children).forEach(function(child) {
            const nearest = nearestElementFromPoint(child, x, y);
            if (nearest.element && nearest.distance <= result.distance) {
                result = nearest;
            }
        });
    }

    return result;
}

MathField.prototype._pathFromPoint = function(x, y) {
    let result;
    // Try to find the deepest element that is near the point that was 
    // clicked on (the point could be outside of the element)
    const nearest = nearestElementFromPoint(this.element, x, y);
    const el = nearest.element;
    const id = el ? el.getAttribute('data-atom-id') : null;

    if (id) {
        // Let's find the atom that has a matching ID with the element that 
        // was clicked on (or near)
        const atoms = this.mathlist.filter(function(path, atom) {
            return atom.id === id;
        });

        if (atoms && atoms.length > 0) {
            // (There should be exactly one atom that matches this ID...)
            // Set the result to the path to this atom

            // If the point clicked is to the left of the vertical midline,
            // adjust the path to *before* the atom (i.e. after the 
            // preceding atom)
            const bounds = el.getBoundingClientRect();
            result = MathPath.pathFromString(atoms[0]).path;
            if (x < bounds.left + bounds.width / 2 && !el.classList.contains('ML__placeholder')) {
                result[result.length - 1].offset -= 1;
            }
        }
    }
    return result;
}

MathField.prototype._onPointerDown = function(evt) {
    const that = this;
    let trackingPointer = false;

    // This should not be necessary, but just in case we got in a weird state...
    off(this.field, 'touchmove', onPointerMove);
    off(this.field, 'touchend touchleave', endPointerTracking);
    off(window, 'mousemove', onPointerMove);
    off(window, 'mouseup blur', endPointerTracking);


    function endPointerTracking(evt) {
        off(that.field, 'touchmove', onPointerMove);
        off(that.field, 'touchend touchleave', endPointerTracking);
        off(window, 'mousemove', onPointerMove);
        off(window, 'mouseup blur', endPointerTracking);

        trackingPointer = false;
        evt.preventDefault();
        evt.stopPropagation();
    }
    function onPointerMove(moveEvt) {
        const x = moveEvt.touches ? moveEvt.touches[0].clientX : moveEvt.clientX;
        const y = moveEvt.touches ? moveEvt.touches[0].clientY : moveEvt.clientY;
        const focus = that._pathFromPoint(x, y);
        if (anchor && focus) {
            that.mathlist.setRange(anchor, focus);
            setTimeout(that._render.bind(that), 0);
        }
        // Prevent synthetic mouseMove event when this is a touch event
        moveEvt.preventDefault();
        moveEvt.stopPropagation();
    }

    let dirty = false;
    
    // Switch the keyboard focus to the textarea to receive keyboard events
    // on behalf of the MathField
    if (!this.hasFocus()) {
        dirty = true;
        this.textarea.focus();
    }

    // If a mouse button other than the main one was pressed, return
    if (evt.buttons && evt.buttons !== 1) return;

    const x = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const y = evt.touches ? evt.touches[0].clientY : evt.clientY;
    let anchor = this._pathFromPoint(x, y);
    if (anchor) {
        if (evt.shiftKey) {
            // Extend the selection if the shift-key is down
            this.mathlist.setRange(this.mathlist.path, anchor);
            anchor = MathPath.clone(this.mathlist.path);
            anchor[anchor.length - 1].offset -= 1;
        } else {
            this.mathlist.setPath(anchor, 0);
        }
        // The selection has changed, so we'll need to re-render
        dirty = true;

        if (evt.detail === 2 || evt.detail === 3) {
            off(this.field, 'touchmove', onPointerMove);
            off(this.field, 'touchend', endPointerTracking);
            off(window, 'mousemove', onPointerMove);
            off(window, 'mouseup blur', endPointerTracking);
            trackingPointer = false;
            if (evt.detail === 3) {
                // This is a triple-click
                this.mathlist.selectAll_();
            } else if (evt.detail === 2) {
                // This is a double-click
                this.mathlist.selectGroup_();
            }
        } else {
            if (!trackingPointer) {
                trackingPointer = true;
                on(window, 'blur', endPointerTracking);
                if (evt.touches) {
                    // To receive the subsequent touchmove/touch, need to 
                    // listen to this evt.target.
                    // This was a touch event
                    on(evt.target, 'touchend', endPointerTracking);
                    on(evt.target, 'touchmove', onPointerMove);
                } else {
                    on(window, 'mouseup', endPointerTracking);
                    on(window, 'mousemove', onPointerMove);
                }
            }
        }
    }


    if (dirty) this._render();

    // Prevent the browser from handling, in particular when this is a 
    // touch event prevent the synthetic mouseDown event from being generated
    evt.preventDefault();
}

MathField.prototype._onSelectionDidChange = function() {
    // Every atom before the new caret position is now committed
    this.mathlist.commitCommandStringBeforeInsertionPoint();

    // If the selection is not collapsed, put it in the textarea
    // This will allow cut/copy to work.
    const mathlist = this.mathlist.extractContents();
    if (mathlist && !this.mathlist.isCollapsed()) {
        let result = '';
        for (const atom of mathlist) {
            result += atom.toLatex();
        }
        this.textarea.value = result;
        if (this.hasFocus()) {
            this.textarea.select();
        }
    } else {
        this.textarea.value = '';
        this.textarea.setAttribute('aria-label', '');
    }

    // Update the command bar
    this._updateCommandBar();

    // Defer the updating of the popover position: we'll need the tree to be
    // re-rendered first to get an updated caret position
    this._updatePopoverPosition({deferred:true});

    // Invoke client handlers, if provided.
    if (this.config.onSelectionDidChange) {
        this.config.onSelectionDidChange(this);
    }
}

MathField.prototype._onSelectionWillChange = function() {
    if (this.config.onSelectionWillChange) {
        this.config.onSelectionWillChange(this);
    }
}

MathField.prototype._onContentWillChange = function() {
    if (this.config.onContentWillChange) {
        this.config.onContentWillChange(this);
    }
}

MathField.prototype._onContentDidChange = function() {
    if (this.config.onContentDidChange) {
        this.config.onContentDidChange(this);
    }
}

/* Returns the speech text of the next atom after the selection or
 *   an 'end of' phrasing based on what structure we are at the end of
 */
function nextAtomSpeechText(mathlist) {
    const EXPR_NAME = {
        'children': 'line',   // not sure what it should be -- happens at end of exprs
    //    'array': 'should not happen',
        'numer': 'numerator',
        'denom': 'denominator',
        'index': 'index',
        'body': 'square root',
        'subscript': 'subscript',
        'superscript': 'superscript'
    }

    if (!mathlist.isCollapsed()) {
        return MathAtom.toSpeakableText(mathlist.extractContents());
    }
    const path = mathlist.path;
    const leaf = path[path.length - 1];
    const relationName = EXPR_NAME[leaf.relation];
    let result = "";

    // announce start of denominator, etc
    if (leaf.offset === 0) {
        result += relationName ? "start of " + relationName + ": " : "unknown";
    }
    const atom = mathlist.sibling(Math.max(1, mathlist.extent));
    if (atom) {
        result += MathAtom.toSpeakableText(atom);
    } else {
        result += relationName ? "end of " + relationName : "unknown";
    }
    return result;
}

/**
 * Set the aria-live region to announce the change and the following character/notation
 * E.g, "in numerator, x"
 * @param {command} string the command that invoked the change 
 */
MathField.prototype._announceChange = function(command, atomsToSpeak) {
    //** the focus is the end of the selection, so it is before where we want it
    // aria-live regions are only spoken when it changes; force a change by alternately using nonbreaking space or narrow nonbreaking space
    const ariaLiveChangeHack = /\u00a0/.test(this.ariaLiveText.textContent) ? " \u202f " : " \u00a0 ";
    // const command = moveAmount > 0 ? "right" : "left";
    if (command === "delete") {
        this.ariaLiveText.textContent = "deleted: " + ariaLiveChangeHack + MathAtom.toSpeakableText(atomsToSpeak);
    } else if (command === "extend") {
        //*** FIX -- should be xxx selected/unselected */
        this.ariaLiveText.textContent = "selected: " + ariaLiveChangeHack + MathAtom.toSpeakableText(this.mathlist.extractContents());
//*** FIX: could also be moveUp or moveDown -- do something different like provide context???
    } else if (command === "focus" || /move/.test(command)) {
        this.ariaLiveText.textContent = ariaLiveChangeHack + nextAtomSpeechText(this.mathlist);
    } else if (command === "replacement") {
        // announce the contents
        this.ariaLiveText.textContent = ariaLiveChangeHack + "changed to: " + MathAtom.toSpeakableText(this.mathlist.sibling(0));
    } else if (command === "line") {
        // announce the current line -- currently that's everything
        this.ariaLiveText.textContent = ariaLiveChangeHack + MathAtom.toSpeakableText(this.mathlist.root);
    } else {
        this.ariaLiveText.textContent = ariaLiveChangeHack + command + " " + (atomsToSpeak ? MathAtom.toSpeakableText(atomsToSpeak) : "");        
    }
}

MathField.prototype._onFocus = function() {
    if (this.blurred) {
        this.blurred = false;
        this._announceChange("focus");
        // this.textarea.setAttribute('aria-label', 'after: ' + MathAtom.toSpeakableText(this.mathlist.root))
        this.textarea.select();
        this._updatePopoverPosition();
        this._updateCommandBar();
        this._render();
        if (this.config.onFocus) this.config.onFocus(this);
    }
}

MathField.prototype._onBlur = function() {
    if (!this.blurred) {
        this.blurred = true;
        this.ariaLiveText.textContent = '';
        this._updatePopoverPosition();
        this._updateCommandBar();
        this._render();
        if (this.config.onBlur) this.config.onBlur(this);
    }
}

MathField.prototype._onResize = function() {
    this._updatePopoverPosition();
}


MathField.prototype._showKeystroke = function(keystroke) {
    const vb = this.keystrokeCaption;
    if (vb && this.keystrokeCaptionVisible) {
        const bounds = this.element.getBoundingClientRect();
        vb.style.left = bounds.left + 'px';
        vb.style.top = (bounds.top - 56) + 'px';
        vb.innerHTML += '<span>' + 
            (Shortcuts.stringify(keystroke) || keystroke) + 
            '</span>';
        vb.style.visibility = 'visible';
        setTimeout(function() {
            if (vb.childNodes.length > 0) {
                vb.removeChild(vb.childNodes[0]);
            }
            if (vb.childNodes.length === 0) {
                vb.style.visibility = 'hidden';
            }
        }, 3000);
    }
}

/**
 * @param {Array.<string>} command - A selector and its parameters
 * @method MathField#perform
 */
/**
 * @param {string} command - A selector
 * @method MathField#perform
 */
MathField.prototype.perform = function(command) {
    let result = false;
    let selector;
    let args = [];
    if (Array.isArray(command)) {
        selector =  command[0] + '_';
        args = command.slice(1);
    } else {
        selector = command + '_';
    }

    if (typeof this.mathlist[selector] === 'function') {
        if (['delete_', 'transpose_', 'deleteToMathFieldEnd_',
            'deleteToGroupEnd_', 'deleteToGroupStart_', 'deletePreviousWord_',
            'deleteNextWord_', 'deletePreviousChar_', 'deleteNextChar_'].includes(selector)) {
            this.undoManager.snapshot();
        }

        this.mathlist[selector](...args);

        result = true;
    } else if (typeof this[selector] === 'function') {
        if (['complete_'].includes(selector)) {
            this.undoManager.snapshot();
        }
        
        this[selector](...args);

        result = true;
    } 

    if (result) {
        // Render the mathlist
        this._render();

        this.scrollIntoView_();
    }

    return result;
}

/**
 * @param {string} keystroke
 * @param {Event} evt
 * @method MathField#_onKeystroke
 * @private
 */
MathField.prototype._onKeystroke = function(keystroke, evt) {

    // Give a chance to the custom keystroke handler to intercept the event
    if (this.config.onKeystroke && !this.config.onKeystroke(keystroke, evt)) {
        evt.preventDefault();
        evt.stopPropagation();
        return false;
    }
    
    const shortcut = Shortcuts.matchKeystroke(this.mathlist.parseMode(), 
        keystroke);

    if (!shortcut) return true;

    // Remove any error indicator (wavy underline) on the current command sequence 
    // (if there are any)
    this.mathlist.decorateCommandStringAroundInsertionPoint(false);

    this._showKeystroke(keystroke);

    if (!this.perform(shortcut)) {
        this.mathlist.insert(shortcut);
        // Render the mathlist
        this._render();

        this.scrollIntoView_();
    }

    // Keystroke has been handled, if it wasn't caught in the default
    // case, so prevent propagation
    evt.preventDefault();
    evt.stopPropagation();
    return false;
}





/**
 * This handler is invoked when text has been typed, pasted in or input with
 * an input method. As a result, `text` can be a sequence of characters to
 * be inserted.
 * @param {string} text
 */
MathField.prototype._onTypedText = function(text) {
    // Remove any error indicator on the current command sequence (if there is one)
    this.mathlist.decorateCommandStringAroundInsertionPoint(false);

    // Insert the specified text at the current insertion point.
    // If the selection is not collapsed, the content will be deleted first.

    let popoverText = '';
    let displayArrows = false;

    if (this.pasteInProgress) {
        this.pasteInProgress = false;
        // This call was made in response to a paste event.
        // Interpret `text` as a LaTeX expression
        this.mathlist.insert(text);

    } else {
        // Decompose the string into an array of graphemes. This is necessary
        // to correctly process what would be visually perceived by a human 
        // as a single glyph (a grapheme) but which is actually composed of 
        // multiple Unicode codepoints. This is the case in particular for 
        // emojis, such as emojis with a skin tone modifier, the country flags
        // emojis or compound emoji such as the professional emojis, including
        // the David Bowie emoji.
        const graphemes = GraphemeSplitter.splitGraphemes(text);
        for (const c of graphemes) {
            this._showKeystroke(c);

            if (this.mathlist.parseMode() === 'command') {
                this.mathlist.removeSuggestion();
                this.suggestionIndex = 0;
                const command = this.mathlist.extractCommandStringAroundInsertionPoint();
                const suggestions = Definitions.suggest(command + c);
                displayArrows = suggestions.length > 1;
                if (suggestions.length === 0) {
                    this.mathlist.insert(c);
                    if (/^\\[a-zA-Z\\*]+$/.test(command + c)) {
                        // This looks like a command name, but not a known one
                        this.mathlist.decorateCommandStringAroundInsertionPoint(true);
                    }
                    this._hidePopover();
                } else {
                    this.mathlist.insert(c);
                    if (suggestions[0].match !== command + c) {

                        this.mathlist.insertSuggestion(suggestions[0].match, 
                            -suggestions[0].match.length + command.length + 1);
                    }
                    popoverText = suggestions[0].match;
                }
            } else if (this.mathlist.parseMode() === 'math') {
                // Inline shortcuts (i.e. 'p' + 'i' = '\pi') only apply in `math` 
                // parseMode
                const prefix = this.mathlist.extractGroupStringBeforeInsertionPoint();
                const shortcut = Shortcuts.matchEndOf(prefix + c, this.config);
                if (shortcut) {
                    // Insert the character before applying the substitution
                    this.mathlist.insert(c);

                    // Create a snapshot with the inserted character so we can 
                    // revert to that. This will allow to undo the effect of 
                    // the substitution if it was undesired.
                    this.undoManager.snapshot();

                    // Remove the characters we're replacing
                    this.mathlist.delete(-shortcut.match.length - 1);

                    // Insert the substitute
                    this.mathlist.insert(shortcut.substitute);
                    this._announceChange("replacement");        
                } else {
                    // Some characters are mapped to commands. Handle them here.
                    // This is important to handle synthetic text input and
                    // non-US keyboards, on which, fop example, the '^' key is
                    // not mapped to  'Shift-Digit6'.
                    const selector = {
                        '^': 'moveToSuperscript',
                        '_': 'moveToSubscript',
                        ' ': 'moveAfterParent'
                    }[c];
                    if (selector) {
                        this.perform(selector);
                    } else {
                        this.undoManager.snapshot();
                        this.mathlist.insert(c);
                    }
                }
            }
        }
    }


    // Render the mathlist
    this._render();

    // Since the location of the popover depends on the position of the caret
    // only show the popover after the formula has been rendered and the 
    // position of the caret calculated
    this._showPopoverWithLatex(popoverText, displayArrows);
}

/**
 * Call `render()` to re-layout the field and generate the updated DOM.
 * This is usually done automatically, but if the font-size, or other geometric
 * attributes are modified, outside of MathLive, this function may need to be
 * called.
 * 
 * @method MathField#render
 * @private
 */
MathField.prototype._render = function() {
    //
    // 1. Update selection state and blinking cursor (caret)
    //
    this.mathlist.root.forEach( a => { 
            a.hasCaret = false;
            a.isSelected = this.mathlist.contains(a);
        } );
    const hasFocus = this.hasFocus();
    if (hasFocus && this.mathlist.isCollapsed()) {
        this.mathlist.anchor().hasCaret = true;
    }

    //
    // 2. Create spans corresponding to the updated mathlist
    //
    const spans = MathAtom.decompose(
        {
            mathstyle: 'displaystyle', 
            generateID: 'true'
        }, this.mathlist.root.children);



    //
    // 3. Construct struts around the spans
    //

    const base = Span.makeSpan(spans, 'ML__base');
    base.attributes = {
        // Hint to screen readers to not attempt to read this span
        // They should use instead the 'aria-label' below.
        'aria-hidden': 'true',
        'role': 'none presentation'
    }

    const topStrut = Span.makeSpan('', 'ML__strut')
    topStrut.setStyle('height', base.height, 'em');
    const struts = [topStrut];
    if (base.depth !== 0) {
        const bottomStrut = Span.makeSpan('', 'ML__strut ML__bottom');
        bottomStrut.setStyle('height', base.height + base.depth, 'em');
        bottomStrut.setStyle('vertical-align', -base.depth, 'em');
        struts.push(bottomStrut);
    } 
    struts.push(base);
    const wrapper = Span.makeSpan(struts, 'ML__mathlive');
    wrapper.classes += hasFocus ? ' ML__focused' : ' ML__blurred';

    //
    // 4. Decorate with a spoken text version for accessibility
    // We only want the label to speak when focused into.
    // After that, it should be blank to avoid it being spoken after a char is typed.
    //

    wrapper.attributes = {
        // Accessibility: make sure this text span is taken into account
        // and read by screen readers, since it's intended to replace
        // the base span.
    };

    //
    // 5. Generate markup and set the accessibility to reflect that
    //

    this.field.innerHTML = wrapper.toMarkup();
    // Probably want to generate content on fly depending on what to speak
    //this.accessibleNode.innerHTML = 
    //    "<math xmlns='http://www.w3.org/1998/Math/MathML'>" +
    //        MathAtom.toMathML(this.mathlist.root) +
    //    "</math>";
    //this.ariaLiveText.textContent = "";


    //
    // 6. Stop event propagation, and scroll cursor into view
    //

    // evt.preventDefault();
    this.scrollIntoView_();
}


MathField.prototype._onPaste = function() {
    // Make note we're in the process of pasting. The subsequent call to 
    // onTypedText() will take care of interpreting the clipboard content
    this.pasteInProgress = true;
    return true;
}

MathField.prototype._onCut = function() {
    // Clearing the selection will have the side effect of clearing the 
    // content of the textarea. However, the textarea value is what will 
    // be copied to the clipboard, so defer the clearing of the selection
    // to later, after the cut operation has been handled.
    setTimeout(function() {
        this.clearSelection();
        this._render(); 
    }.bind(this), 0);
    return true;
}

MathField.prototype._onCopy = function() {
    return true;
}


//
// PUBLIC API
//

/**
 * Return a textual representation of the mathfield.
 * @param {string} [format='latex']. One of `'latex'`, `'spoken'`, 
 * or `'mathML'`.
 * @return {string}
 * @method MathField#text
 */
MathField.prototype.text = function(format) {
    format = format || 'latex';
    let result = '';
    if (format === 'latex') {
        result = this.mathlist.root.toLatex();
    } else if (format === 'mathML') {
            result = this.mathlist.root.toMathML();
    } else if (format === 'spoken') {
        result = MathAtom.toSpeakableText(this.mathlist.root, {markup:true});
    }

    return result;
}

/**
 * Return a textual representation of the selection in the mathfield.
 * @param {string} [format='latex']. One of `'latex'`, `'spoken'` or 
 * `'mathML'`
 * @return {string}
 * @method MathField#selectedText
 */
MathField.prototype.selectedText = function(format) {
    format = format || 'latex';
    let result = '';
    const selection = this.mathlist.extractContents();
    if (selection) {
        if (format === 'latex') {
            
            for (const atom of selection) {
                result += atom.toLatex();
            }

        } else if (format === 'mathML') {
            
            for (const atom of selection) {
                result += atom.toMathML();
            }

        } else if (format === 'spoken') {
            result = MathAtom.toSpeakableText(selection, {markup:true})
        }
    }

    return result;
}


/**
 * Return true if the length of the selection is 0, that is, if it is a single
 * insertion point.
 * @return {boolean}
 * @method MathField#selectionIsCollapsed
 */
MathField.prototype.selectionIsCollapsed = function() {
    return this.mathlist.isCollapsed();
}

/**
 * Return the depth of the selection group. If the selection is at the root level, 
 * returns 0. If the selection is a portion of the numerator of a fraction 
 * which is at the root level, return 1. Note that in that case, the numerator
 * would be the "selection group".
 * @return {integer}
 * @method MathField#selectionDepth
 */
MathField.prototype.selectionDepth = function() {
    return this.mathlist.path.length;
}

/**
 * Return true if the selection starts at the beginning of the selection group.
 * @return {boolean}
 * @method MathField#selectionAtStart
 */
MathField.prototype.selectionAtStart = function() {
    return this.mathlist.startOffset() === 0;
}

/**
 * Return true if the selection extends to the end of the selection group.
 * @return {boolean}
 * @method MathField#selectionAtEnd
 */
MathField.prototype.selectionAtEnd = function() {
    return this.mathlist.endOffset() >= this.mathlist.siblings().length - 1;
}

/**
 * If `text` is not empty, sets the content of the mathfield to the 
 * text interpreted as a LaTeX expression.
 * If `text` is empty (or omitted), return the content of the mahtfield as a 
 * LaTeX expression.
 * @param {string} text
 * @return {string}
 * @method MathField#latex
 */
MathField.prototype.latex = function(text) {
    if (text) {
        this.undoManager.snapshot();
        this.mathlist.insert(text, {
            insertionMode: 'replaceAll',
            format: 'latex'
        });
        this._render();
        return text;
    }

    // Return the content as LaTeX
    // (The result might be different than the optional input, 
    // for example it may have been simplified or some commands ignored)
    return this.mathlist.root.toLatex();
}


/**
 * Return the DOM element associated with this mathfield.
 * @return {Element}
 * @method MathField#el
 */
MathField.prototype.el = function() {
    return this.element;
}

MathField.prototype.undo_ = MathField.prototype.undo = function() {
    this.undoManager.undo();
}

MathField.prototype.redo_ = MathField.prototype.redo = function() {
    this.undoManager.redo();
}


MathField.prototype.scrollIntoView_ = MathField.prototype.scrollIntoView = function() {
    // @todo
}

MathField.prototype.scrollToStart_ = MathField.prototype.scrollToStart = function() {
    // @todo
}

MathField.prototype.scrollToEnd_ = MathField.prototype.scrollToEnd = function() {
    // @todo
}

/**
 * 
 * @method MathField#enterCommandMode_
 * @private
 */
MathField.prototype.enterCommandMode_ = function() {
    // Remove any error indicator on the current command sequence (if there is one)
    this.mathlist.decorateCommandStringAroundInsertionPoint(false);

    this.mathlist.removeSuggestion();
    this._hidePopover();
    this.suggestionIndex = 0;

    this.undoManager.snapshot();
    this.mathlist.insert('\u0027');
}

MathField.prototype.copyToClipboard_ = function() {
    document.execCommand('copy');
}

MathField.prototype.cutToClipboard_ = function() {
    document.execCommand('cut');
}

MathField.prototype.pasteFromClipboard_ = function() {
    document.execCommand('paste');
}


/**
 * This function can be invoked as a selector with `perform()` or called explicitly.
 * It will insert the specified block of latex at the current selection point,
 * according to the insertion mode specified. After the insertion, the 
 * selection will be set according to the selectionMode.
 * @param {string} latex
 * @param {Object} options
 * @param {string} options.insertionMode - One of `"replaceSelection"`, 
 * `"replaceAll"`, `"insertBefore"` or `"insertAfter"`. Default: `"replaceSelection"`
 * @param {string} options.selectionMode - Describes where the selection 
 * will be after the insertion. One of 'placeholder' (the selection will be 
 * the first available placeholder in the item that has been inserted), 
 * 'after' (the selection will be an insertion point after the item that has 
 * been inserted), 'before' (the selection will be an insertion point before 
 * the item that has been inserted) or 'item' (the item that was inserted will
 * be selected). Default: 'placeholder'.
 * @method MathField#insert
 */
MathField.prototype.insert_ = 
MathField.prototype.insert = function(latex, options) {
    if (typeof latex === 'string' && latex.length > 0) {
        if (!options) options = {};
        if (!options.format) options.format = 'auto';
        this.undoManager.snapshot();
        this.mathlist.insert(latex, options);
    }
}


/**
 * Completes an operation in progress, for example when in command mode, 
 * interpret the command
 * @method MathField#complete_
 * @private
 */
MathField.prototype.complete_ = function() {
    this._hidePopover();

    const command = this.mathlist.extractCommandStringAroundInsertionPoint();
    if (command) {
        const mode = 'math'; // @todo this.mathlist.parseMode();
        let match = Definitions.matchFunction(mode, command);
        if (!match) {
            match = Definitions.matchSymbol(mode, command);
        }
        if (match) {
            const mathlist = ParserModule.parseTokens(
                    Lexer.tokenize(match.latexName), mode, null);

            this.mathlist.spliceCommandStringAroundInsertionPoint(mathlist);
        } else {
            // This wasn't a simple function or symbol.
            // Interpret the input as LaTeX code
            const mathlist = ParserModule.parseTokens(
                    Lexer.tokenize(command), mode, null);
            if (mathlist) {
                this.mathlist.spliceCommandStringAroundInsertionPoint(mathlist);
            } else {            
                this.mathlist.decorateCommandStringAroundInsertionPoint(true);
            }
        }
        this._announceChange("replacement"); 
    }
}

function latexToMarkup(latex) {
    const parse = ParserModule.parseTokens(Lexer.tokenize(latex), 'math', null);
    const spans = MathAtom.decompose({mathstyle: 'displaystyle'}, parse);
    
    const base = Span.makeSpan(spans, 'ML__base');

    const topStrut = Span.makeSpan('', 'ML__strut');
    topStrut.setStyle('height', base.height, 'em');
    const bottomStrut = Span.makeSpan('', 'ML__strut ML__bottom');
    bottomStrut.setStyle('height', base.height + base.depth, 'em');
    bottomStrut.setStyle('vertical-align', -base.depth, 'em');
    const wrapper = Span.makeSpan([topStrut, bottomStrut, base], 'ML__mathlive');

    return wrapper.toMarkup();
}

MathField.prototype._showPopoverWithLatex = function(latex, displayArrows) {
    if (!latex || latex.length === 0) {
        this._hidePopover();
        return;
    }

    const command = latex;
    const command_markup = latexToMarkup(Definitions.SAMPLES[command] || latex);
    const command_note = Definitions.getNote(command);
    const command_shortcuts = Shortcuts.stringify(
        Shortcuts.getShortcutsForCommand(command)) || '';

    let template = displayArrows ? 
        '<div class="ML__popover_prev-shortcut" role="button" aria-label="Previous suggestion"><span><span>&#x25B2;</span></span></div>' : '';
    template += '<span class="ML__popover_content">';
    template += '<div class="ML__popover_command" role="button" >' + 
        command_markup + '</div>';
    if (command_note) {
        template += '<div class="ML__popover_note">' + 
            command_note + '</div>';
    }
    if (command_shortcuts) {
        template += '<div class="ML__popover_shortcut">' + 
            command_shortcuts + '</div>';
    }
    template += '</span>';
    template += displayArrows ? '<div class="ML__popover_next-shortcut" role="button" aria-label="Next suggestion"><span><span>&#x25BC;</span></span></div>' : '';
    this._showPopover(template);

    let el = this.popover.getElementsByClassName('ML__popover_content');
    if (el && el.length > 0) {
        this._attachButtonHandlers(el[0], 'complete');
    }
    
    
    el = this.popover.getElementsByClassName('ML__popover_prev-shortcut');
    if (el && el.length > 0) {
        this._attachButtonHandlers(el[0], 'previousSuggestion');
    }

    el = this.popover.getElementsByClassName('ML__popover_next-shortcut');
    if (el && el.length > 0) {
        this._attachButtonHandlers(el[0], 'nextSuggestion');
    }

}

MathField.prototype._updatePopoverPosition = function(options) {
    // If the popover pane is visible...
    if (this.popover.classList.contains('ML__popover_visible')) {
        if (options && options.deferred) {
            // Call ourselves again later, typically after the 
            // rendering/layout of the DOM has been completed
            setTimeout(this._updatePopoverPosition.bind(this), 0);    
        } else {
            if (this.blurred || !this.mathlist.anchor() || this.mathlist.anchor().type !== 'command') {
                this._hidePopover();
            } else {
                // ... get the caret position
                const position = this._getCaretPosition();
                if (position) {
                    // and position the popover right below the caret
                    this.popover.style.left = 
                        (position.x - this.popover.offsetWidth / 2) + 'px';
                    this.popover.style.top = (position.y + 5) + 'px';
                }
            }
        }
    }
}

MathField.prototype._showPopover = function(markup) {
    // Temporarily hide the command bar
    if (this.commandBar.style.visibility === 'visible') {
        this.commandBar.style.visibility = 'hidden';
    }

    this.popover.innerHTML = markup;

    const position = this._getCaretPosition();
    if (position) {
        this.popover.style.left = (position.x - this.popover.offsetWidth / 2) + 'px';
        this.popover.style.top = (position.y + 5) + 'px';
    }

    this.popover.classList.add('ML__popover_visible');
}


MathField.prototype._hidePopover = function() {
    this.popover.classList.remove('ML__popover_visible');    

    // Make the command bar visible again
    if (this.commandBarVisible) {
        this.commandBar.style.visibility = 'visible';
    }
}

MathField.prototype._updateSuggestion = function() {
    this.mathlist.positionInsertionPointAfterCommitedCommand();
    this.mathlist.removeSuggestion();
    const command = this.mathlist.extractCommandStringAroundInsertionPoint();
    const suggestions = Definitions.suggest(command);
    if (suggestions.length === 0) {
        this._hidePopover();
        this.mathlist.decorateCommandStringAroundInsertionPoint(true);
    } else {
        const index = this.suggestionIndex % suggestions.length;
        const l = command.length - suggestions[index].match.length;
        if (l !== 0) {
            this.mathlist.insertSuggestion(suggestions[index].match, l);
        }
        this._showPopoverWithLatex(suggestions[index].match, suggestions.length > 1);
    }

    this._render();
}

MathField.prototype.nextSuggestion_ = function() {
    this.suggestionIndex += 1;
    // The modulo of the suggestionIndex is used to determine which suggestion
    // to display, so no need to worry about rolling over.
    this._updateSuggestion();
}

MathField.prototype.previousSuggestion_ = function() {
    this.suggestionIndex -= 1;
    if (this.suggestionIndex < 0) {
        // We're rolling over
        // Get the list of suggestions, so we can know how many there are
        // Not very efficient, but simple.
        this.mathlist.removeSuggestion();
        const command = this.mathlist.extractCommandStringAroundInsertionPoint();
        const suggestions = Definitions.suggest(command);
        this.suggestionIndex = suggestions.length - 1;
    }
    this._updateSuggestion();
}


MathField.prototype.toggleKeystrokeCaption_ = function() {
    this.keystrokeCaptionVisible = !this.keystrokeCaptionVisible;
    const vb = this.keystrokeCaption;
    vb.innerHTML = '';
    if (this.keystrokeCaptionVisible) {
        vb.style.visibility = 'visible';
    } else {
        vb.style.visibility = 'hidden';
    }
}

MathField.prototype._attachButtonHandlers = function(el, command) {
    const that = this;
    // Command can be either a single selector or an array consisting of 
    // one selector followed by one or more arguments.

    // We need to turn the command into a string to attach it to the dataset 
    // associated with the button (the command could be an array made of a 
    // selector and one or more parameters)

    el.setAttribute(
        'data-' + this.config.namespace + 'command', JSON.stringify(command));

    on(el, 'mousedown touchstart', function(ev) {
        if (ev.type !== 'mousedown' || ev.buttons === 1) {
            // The primary button was pressed.
            ev.target.classList.add('pressed');
            ev.stopPropagation(); 
            ev.preventDefault();
        }
    }, {passive: false, capture: false});
    on (el, 'mouseleave touchcancel', function(ev) {
        ev.target.classList.remove('pressed');
    });
    on (el, 'mouseenter', function(ev) {
        if (ev.buttons === 1) {
            ev.target.classList.add('pressed');
        }
    });

    on(el, 'mouseup touchend', function(ev) {
        el.classList.remove('pressed');
        el.classList.add('active');

        // Since we want the active state to be visible for a while,
        // use a timer to remove it after a while
        setTimeout(
            function(){ el.classList.remove('active'); },
            150);

        // Restore the command (and its optional arguments) and perform it
        that.perform(JSON.parse(
            el.getAttribute('data-' + that.config.namespace + 'command')));
        ev.stopPropagation();
        ev.preventDefault();
    });
}

MathField.prototype._makeButton = function(label, cls, ariaLabel, command) {
    const button = document.createElement('span');
    button.innerHTML = label;

    if (cls) button.classList.add([].slice.call(cls.split(' ')));

    if (ariaLabel) button.setAttribute('aria-label', ariaLabel);

    this._attachButtonHandlers(button, command);

    return button;
}

MathField.prototype._updateCommandBar = function() {
    if (!this.blurred && this.commandBarVisible) {
        this.textarea.select();
        this.commandBar.style.visibility = 'visible';
        this.commandButtons.textContent = '';
        // let content = '';
        // content += '<span>bold</span><span>solve</span><span>&#x21e2;</span>';
        // content += '<span class="ML__round">&#8943;</span></div>';
        // content += '<div>color: #566778</div>';
        // content += '<div>gap: #566778</div>';

        const commands = Commands.suggest(
            this.mathlist.parseMode(), 
            '' /* environment */, 
            '' /* modifiers */, 
            this.mathlist.parent(),
            this.mathlist.extractGroupBeforeSelection(), 
            this.mathlist.extractContents(),
            this.mathlist.extractGroupAfterSelection(), 
            this.config);


        for (const command of commands) {
            const button  = this._makeButton(
                command.label, 
                command.cls,
                command.ariaLabel,
                command.selector);
            this.commandButtons.appendChild(button);
        }
    } else {
        this.commandBar.style.visibility = 'hidden';
    }
}

MathField.prototype.toggleCommandBar_ = function() {
    this.commandBarVisible = !this.commandBarVisible;

    // If the commandbar toggle was tapped, switch the focus to the mathfield
    // To trigger the keyboard reveal on iOS, this needs to be done from 
    // an invocation of a user action (mousedown)
    if (this.commandBarVisible) this.focus();

    this._updateCommandBar();
}

MathField.prototype.hasFocus = function() {
    return document.hasFocus() && document.activeElement === this.textarea;
}

MathField.prototype.focus = function() {
        if (!this.hasFocus()) {
        // this.textarea.focus();
        this.textarea.select();
        this._render();
    }
}

MathField.prototype.blur = function() {
    if (this.hasFocus()) {
        this.textarea.blur();
        this._render();
    }
}

MathField.prototype.select = function() {
    this.mathlist.selectAll_();
}

MathField.prototype.clearSelection = function() {
    this.mathlist.delete_();
}


/**
 * @param {string} keys - A string representation of a key combination. For
 * example `'Alt-KeyU'`.
 * See https://www.w3.org/TR/2012/WD-DOM-Level-3-Events-20120614/#fixed-virtual-key-codes
 * @method MathField#keystroke
 */
MathField.prototype.keystroke = function(keys) {
    // This is the public API, while onKeystroke is the 
    // internal handler
    this._onKeystroke(keys);
}

/**
 * Simulate a user typing the keys indicated by text.
 * @param {string} text - A sequence of one or more characters.
 * @method MathField#typedText
 */
MathField.prototype.typedText = function(text) {
    // This is the public API, while onTypedText is the 
    // internal handler
    this._onTypedText(text);
}


/**
 * @param {Object} [config] See `MathLive.config()` for details
 * 

 * @method MathField#config
 */
MathField.prototype.config = function(config) {
    const def = {
        // If true, spacebar and shift-spacebar escape from the current block
        // spacesBehavesLikeTab: false,
        // leftRightIntoCmdGoes: 
        overrideDefaultInlineShortcuts: false,
        commandbarToggle: 'visible',
        overrideDefaultCommands: false,

    }

    // Copy the values from `config` to `def`
    this.config = Object.assign({}, def, config);

    // Validate the namespace (used for `data-` attributes)
    if (!/^[a-z]+[-]?$/.test(this.config.namespace)) {
        throw Error('options.namespace must be a string of lowercase characters only');
    }
    if (!/-$/.test(this.config.namespace)) {
        this.config.namespace += '-';
    }

}

return {
    MathField: MathField
}


})


