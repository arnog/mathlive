
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
    'mathlive/editor/editor-popover', 
    'mathlive/editor/editor-virtualKeyboard',
    'mathlive/core/grapheme-splitter',
    'mathlive/addons/outputLatex', 
    'mathlive/addons/outputMathML', 
    'mathlive/addons/maston', 
    'mathlive/addons/outputSpokenText'], 
    function(Definitions, MathAtom, Lexer, ParserModule, Span, 
    EditableMathlist, MathPath, Keyboard, Undo, Shortcuts, Popover, 
    VirtualKeyboard, GraphemeSplitter,
// eslint-disable-next-line no-unused-vars
    OutputLatex, OutputMathML, MASTON, OutputSpokenText) {

/* 
    Note: 
    The OutputLatex, OutputMathML, MASTON and OutputSpokenText  modules are required, 
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
    // 4/ The virtual keyboard
    // 5.0/ The area to stick MathML for screen reading larger exprs (not used right now)
    //      The for the area is that focus would bounce their and then back triggering the
    //         screen reader to read it
    // 5.1/ The aria-live region for announcements
    let markup = ''
    if (!this.config.substituteTextArea) {
        if (/android|ipad|ipod|iphone/i.test(navigator.userAgent)) {
            // On Android or iOS, don't use a textarea, which has the side effect of
            // bringing up the OS virtual keyboard
            markup += `<span class='ML__textarea'> 
                <span class='ML__textarea--textarea'
                    tabindex="0" role="textbox" 
                    style='display:inline-block;height:1px;width:1px' >
                </span>
            </span>`;
        } else {
            markup += '<span class="ML__textarea">' +
                '<textarea class="ML__textarea--textarea" autocapitalize="off" autocomplete="off" ' + 
                'autocorrect="off" spellcheck="false" aria-hidden="true" tabindex="-1">' +
                '</textarea>' +
            '</span>';
        }

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

    // Only display the virtual keyboard toggle if the virtual keyboard mode is
    // 'manual'
    if (this.config.virtualKeyboardMode === 'manual') {
        markup += `<span class="ML__virtualKeyboardToggle"
                    role="button" tabindex="0" aria-label="Toggle Virtual Keyboard" 
                    >`;
                    // data-tooltip='Toggle Virtual Keyboard'
        if (this.config.virtualKeyboardToggleGlyph) {
            markup += this.config.virtualKeyboardToggleGlyph;
        } else {
            markup += `<span style="width: 21px; margin-top: 5px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M528 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h480c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm16 336c0 8.823-7.177 16-16 16H48c-8.823 0-16-7.177-16-16V112c0-8.823 7.177-16 16-16h480c8.823 0 16 7.177 16 16v288zM168 268v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-336 80v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm384 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zM120 188v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-96 152v-8c0-6.627-5.373-12-12-12H180c-6.627 0-12 5.373-12 12v8c0 6.627 5.373 12 12 12h216c6.627 0 12-5.373 12-12z"/></svg></span>`;
        }
        markup += '</span>';
    } else {
        markup += '<span ></span>';
    }
    markup += '</span>';
    
    markup += `
        <div class="ML__popover" aria-hidden="true"></div>
        <div class="ML__keystrokecaption" aria-hidden="true"></div>
        <div class="ML__HiddenAccessibleMath">
            <span></span>
            <span aria-live="assertive" aria-atomic="true"> math </span>
        '</div>
    `;

    this.element.innerHTML = markup;

    let iChild = 0;       // index of child -- used to make changes below easier
    if (typeof this.config.substituteTextArea === 'function') {
        this.textarea =  this.config.substituteTextArea();
    } else {
        this.textarea = this.element.children[iChild++].firstElementChild;
    }
    this.field = this.element.children[iChild].children[0];
    this.virtualKeyboardToggleDOMNode = this.element.children[iChild++].children[1];
    this._attachButtonHandlers(this.virtualKeyboardToggleDOMNode, 
        {default: 'toggleVirtualKeyboard', alt: 'toggleVirtualKeyboardAlt'}
    );
    this.popover = this.element.children[iChild++];
    this.keystrokeCaption = this.element.children[iChild++];
    this.accessibleNode = this.element.children[iChild].children[0];
    this.ariaLiveText = this.element.children[iChild++].children[1];
 
    // The keystroke caption panel and the command bar are 
    // initially hidden
    this.keystrokeCaptionVisible = false;
    this.virtualKeyboardVisible = false;

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
    if (document && document.fonts) {
        const that = this;
        document.fonts.ready.then(() => that._render());
    }
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
    this.textarea.remove();
    delete this.textarea;
    this.virtualKeyboardToggleDOMNode.remove()
    delete this.virtualKeyboardToggleDOMNode;
    this.popover.remove();
    delete this.popover;
    delete this.keystrokeCaption;
    // this.virtualKeyboard.remove();
    delete this.virtualKeyboard;
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
            // If the atom allows children to be selected, match only if 
            // the ID of  the atom matches the one we're looking for.
            if (!atom.captureSelection) {
                return atom.id === id; 
            }
            // If the atom does not allow children to be selected 
            // (captureSelection === true), the element matches if any of 
            // its children has an ID that matches.
            return atom.filter(function(childAtom) {
                return childAtom.id === id;
            }).length > 0;
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
    let anchor;
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
            if (that.mathlist.setRange(anchor, focus)) {
                // Re-render if the range has actually changed
                setTimeout(that._render.bind(that), 0);
            }
        }
        // Prevent synthetic mouseMove event when this is a touch event
        moveEvt.preventDefault();
        moveEvt.stopPropagation();
    }
    const that = this;
    let trackingPointer = false;
    let dirty = false;

    // Focus the math field
    if (!this.hasFocus()) {
        dirty = true;
        if (this.textarea.focus) this.textarea.focus();
    }

    const bounds = this.element.getBoundingClientRect();
    const x = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const y = evt.touches ? evt.touches[0].clientY : evt.clientY;
    if (x > bounds.left && x < bounds.right &&
        y > bounds.top && y < bounds.bottom) {

        // This should not be necessary, but just in case we got in a weird state...
        off(this.field, 'touchmove', onPointerMove);
        off(this.field, 'touchend touchleave', endPointerTracking);
        off(window, 'mousemove', onPointerMove);
        off(window, 'mouseup blur', endPointerTracking);
        
        // If a mouse button other than the main one was pressed, return
        if (evt.buttons && evt.buttons !== 1) return;

        anchor = this._pathFromPoint(x, y);
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

            // evt.details contains the number of consecutive clicks 
            // for double-click, triple-click, etc...
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
        // The textarea may be a span (on mobile, for example), so check that
        // it has a select() before calling it.
        if (this.hasFocus() && this.textarea.select) {
            this.textarea.select();
        }
    } else {
        this.textarea.value = '';
        this.textarea.setAttribute('aria-label', '');
    }

    // Defer the updating of the popover position: we'll need the tree to be
    // re-rendered first to get an updated caret position
    Popover.updatePopoverPosition(this, {deferred:true});

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
    if (this.undoManager.canRedo()) {
        this.element.classList.add('can-redo');
    } else {
        this.element.classList.remove('can-redo');
    }
    if (this.undoManager.canUndo()) {
        this.element.classList.add('can-undo');
    } else {
        this.element.classList.remove('can-undo');
    }
    if (this.config.onContentDidChange) {
        this.config.onContentDidChange(this);
    }
}

/* Returns the speech text of the next atom after the selection or
 *   an 'end of' phrasing based on what structure we are at the end of
 */
function nextAtomSpeechText(oldMathlist, mathlist) {
    function relation(parent, leaf) {
        const EXPR_NAME = {
        //    'array': 'should not happen',
            'numer': 'numerator',
            'denom': 'denominator',
            'index': 'index',
            'body': 'parent',
            'subscript': 'subscript',
            'superscript': 'superscript'
        }

        const PARENT_NAME = {
            'enclose': 'cross out', // FIX -- should base on type of enclose
            'leftright': 'fence',
            'surd': 'square root'
        }
        return (leaf.relation === 'body' ? PARENT_NAME[parent.type] : EXPR_NAME[leaf.relation]);
    }

    const oldPath = oldMathlist ? oldMathlist.path : [];
    const path = mathlist.path;
    const leaf = path[path.length - 1];
    let result = '';

    while (oldPath.length > path.length) {
        result += 'out of ' + relation(oldMathlist.parent(), oldPath[oldPath.length - 1]) + '; ';
        oldPath.pop(); 
    }
    if (!mathlist.isCollapsed()) {
        return MathAtom.toSpeakableText(mathlist.extractContents());
    }

    // announce start of denominator, etc
    const relationName = relation(mathlist.parent(), leaf);
    if (leaf.offset === 0) {
        result += relationName ? 'start of ' + relationName + ': ' : 'unknown';
    }
    const atom = mathlist.sibling(Math.max(1, mathlist.extent));
    if (atom) {
        result += MathAtom.toSpeakableText(atom);
    } else if (leaf.offset !== 0) { // don't say both start and end
        result += relationName ? 'end of ' + relationName : 'unknown';
    }
    return result;
}

/**
 * Set the aria-live region to announce the change and the following character/notation
 * E.g, "in numerator, x"
 * @param {string} command the command that invoked the change 
 * @param {object} oldMathlist [null] the previous value of mathlist before the change 
 * @param {object} array [null] or atom: atomsToSpeak the command that invoked the change 
 */
MathField.prototype._announceChange = function(command, oldMathlist, atomsToSpeak) {
//** Fix: the focus is the end of the selection, so it is before where we want it
    // aria-live regions are only spoken when it changes; force a change by 
    // alternately using nonbreaking space or narrow nonbreaking space
    const ariaLiveChangeHack = /\u00a0/.test(this.ariaLiveText.textContent) ? 
        ' \u202f ' : ' \u00a0 ';
    // const command = moveAmount > 0 ? "right" : "left";
    if (command === 'delete') {
        this.ariaLiveText.textContent = 'deleted: ' + ariaLiveChangeHack + MathAtom.toSpeakableText(atomsToSpeak);
    //*** FIX: could also be moveUp or moveDown -- do something different like provide context???
    } else if (command === 'focus' || /move/.test(command)) {
        //*** FIX -- should be xxx selected/unselected */
        this.ariaLiveText.textContent = ariaLiveChangeHack +
                    (this.mathlist.isCollapsed() ? '' : 'selected: ') +
                    nextAtomSpeechText(oldMathlist, this.mathlist);
    } else if (command === 'replacement') {
        // announce the contents
        this.ariaLiveText.textContent = ariaLiveChangeHack + MathAtom.toSpeakableText(this.mathlist.sibling(0));
    } else if (command === 'line') {
        // announce the current line -- currently that's everything
        const spokenText = MathAtom.toSpeakableText(this.mathlist.root);
        this.ariaLiveText.textContent = ariaLiveChangeHack + spokenText;
        this.accessibleNode.innerHTML = 
            '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
                MathAtom.toMathML(this.mathlist.root) +
            '</math>';

        this.textarea.setAttribute('aria-label', 'after: ' + spokenText)

        /*** FIX -- testing hack for setting braille ***/
        // this.accessibleNode.focus();
        // console.log("before sleep");
        // sleep(1000).then(() => {
        //     this.textarea.focus();
        //     console.log("after sleep");
        // });
    } else {
        this.ariaLiveText.textContent = ariaLiveChangeHack + command + " " + 
            (atomsToSpeak ? MathAtom.toSpeakableText(atomsToSpeak) : "");        
    }
}

MathField.prototype._onFocus = function() {
    if (this.blurred) {
        this.blurred = false;
        // The textarea may be a span (on mobile, for example), so check that
        // it has a select() before calling it.
        if (this.textarea.select) this.textarea.select();
        if (this.config.virtualKeyboardMode === 'onfocus') {
            this.showVirtualKeyboard_();
        }
        Popover.updatePopoverPosition(this);
        this._render();
        if (this.config.onFocus) this.config.onFocus(this);
    }
}

MathField.prototype._onBlur = function() {
    if (!this.blurred) {
        this.blurred = true;
        this.ariaLiveText.textContent = '';
        if (this.config.virtualKeyboardMode === 'onfocus') {
            this.hideVirtualKeyboard_();
        }
        Popover.updatePopoverPosition(this);
        this._render();
        if (this.config.onBlur) this.config.onBlur(this);
    }
}

MathField.prototype._onResize = function() {

    this.element.classList.remove('ML__isNarrowWidth', 'ML__isWideWidth', 'ML__isExtendedWidth');
    if (window.innerWidth >= 1024) {
        this.element.classList.add('ML__isExtendedWidth');
    } else if (window.innerWidth >= 768) {
        this.element.classList.add('ML__isWideWidth');
    } else {
        this.element.classList.add('ML__isNarrowWidth');
    }
    Popover.updatePopoverPosition(this);
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
 * @param {string|Array.<string>} command - A selector and its parameters
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
 * @param {Event} evt - optional, an Event corresponding to the keystroke
 * @method MathField#_onKeystroke
 * @private
 */
MathField.prototype._onKeystroke = function(keystroke, evt) {

    // Give a chance to the custom keystroke handler to intercept the event
    if (this.config.onKeystroke && !this.config.onKeystroke(keystroke, evt)) {
        if (evt) {
            evt.preventDefault();
            evt.stopPropagation();
        }
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
    if (evt) {
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
        // emojis or compound emojis such as the professional emojis, including
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
                    Popover.hidePopover(this);
                } else {
                    this.mathlist.insert(c);
                    if (suggestions[0].match !== command + c) {

                        this.mathlist.insertSuggestion(suggestions[0].match, 
                            -suggestions[0].match.length + command.length + 1);
                    }
                    popoverText = suggestions[0].match;
                }
            } else if (this.mathlist.parseMode() === 'math') {
                // Inline shortcuts (i.e. 'p' + 'i' = '\pi') only apply in 
                // `math` parseMode

                let count = this.mathlist.startOffset();
                let shortcut;
                // Try to find the longest matching shortcut possible
                while (!shortcut && count > 0) {
                    // Note that 'count' is a number of atoms
                    // An atom can be more than one character (for example '\sin')
                    const prefix = this.mathlist.extractCharactersBeforeInsertionPoint(count);
                    shortcut = Shortcuts.match(prefix + c, this.config);
                    count -= 1;
                }

                if (shortcut) {
                    const savedState = this.undoManager.save();

                    // To enable the substitution to be undoable, 
                    // insert the character before applying the substitution
                    this.mathlist.insert(c);

                    // Create a snapshot with the inserted character
                    this.undoManager.snapshot();

                    // Revert to before inserting the character
                    // (restore doesn't change the undo stack)
                    this.undoManager.restore(savedState);

                    // Remove the atoms from the prefix string
                    this.mathlist.delete(-count - 1);

                    // Insert the substitute
                    this.mathlist.insert(shortcut, {format: 'latex'});
                    this._announceChange("replacement");        
                } 
                
                if (!shortcut) {
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
    Popover.showPopoverWithLatex(this, popoverText, displayArrows);
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
            generateID: true
        }, this.mathlist.root.body);



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
    this.accessibleNode.innerHTML = 
       "<math xmlns='http://www.w3.org/1998/Math/MathML'>" +
           MathAtom.toMathML(this.mathlist.root) +
       "</math>";
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
 * @param {string} [format='latex']. One of 
 *    * `'latex'`
 *    * `'expandedLatex'` : all macros are recursively expanded to their definition
 *    * `'spoken'`
 *    * `'mathML'`
 * or `'mathML'`.
 * @return {string}
 * @method MathField#text
 */
MathField.prototype.text = function(format) {
    format = format || 'latex';
    let result = '';
    if (format === 'latex' || format === 'expandedLatex') {
        result = this.mathlist.root.toLatex(format === 'expandedLatex');
    } else if (format === 'mathML') {
            result = this.mathlist.root.toMathML();
    } else if (format === 'spoken') {
        result = MathAtom.toSpeakableText(this.mathlist.root, {markup:true});
    }

    return result;
}

/**
 * Return a textual representation of the selection in the mathfield.
 * @param {string} [format='latex']. One of 
 *    * `'latex'`
 *    * `'expandedLatex'` : all macros are recursively expanded to their definition
 *    * `'spoken'`
 *    * `'mathML'`
 * @return {string}
 * @method MathField#selectedText
 */
MathField.prototype.selectedText = function(format) {
    format = format || 'latex';
    let result = '';
    const selection = this.mathlist.extractContents();
    if (selection) {
        if (format === 'latex' || format === 'expandedLatex') {
            
            for (const atom of selection) {
                result += atom.toLatex(format === 'expandedLatex');
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
            selectionMode: 'after',
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
    Popover.hidePopover(this);
    this.suggestionIndex = 0;

    // Switch to the command mode keyboard layer
    if (this.virtualKeyboardVisible) {
        this.switchKeyboardLayer_('lower-command');
    }

    this.undoManager.snapshot();
    this.mathlist.insert('\u0027');
}


MathField.prototype.copyToClipboard_ = function() {
    this.focus();
    // If the selection is empty, select the entire field before 
    // copying it.
    if (this.mathlist.isCollapsed()) {
        this.select();
    }
    document.execCommand('copy');
}

MathField.prototype.cutToClipboard_ = function() {
    this.focus();
    document.execCommand('cut');
}

MathField.prototype.pasteFromClipboard_ = function() {
    this.focus();
    document.execCommand('paste');
}


/**
 * This function can be invoked as a selector with `perform()` or called explicitly.
 * It will insert the specified block of latex at the current selection point,
 * according to the insertion mode specified. After the insertion, the 
 * selection will be set according to the selectionMode.
 * @param {string} latex
 * @param {string} options.selectionMode - Describes where the selection 
 * will be after the insertion:
 *    * `'placeholder'`: the selection will be the first available placeholder 
 * in the item that has been inserted) (default)
 *    * `'after'`: the selection will be an insertion point after the item that 
 * has been inserted), 
 *    * `'before'`: the selection will be an insertion point before 
 * the item that has been inserted) or 'item' (the item that was inserted will
 * be selected).
 * 
 * @param {string} options.format - The format of the string `s`:
 *    * `'auto'`: the string is interpreted as a latex fragment or command) 
 * (default)
 *    * `'latex'`: the string is interpreted strictly as a latex fragment
 * 
 * @param {boolean} options.focus - If true, the mathfield will be focused
 * @method MathField#insert
 */
MathField.prototype.insert_ = 
MathField.prototype.insert = function(s, options) {
    if (typeof s === 'string' && s.length > 0) {
        if (options && options.focus) this.focus();
        this.undoManager.snapshot();
        this.mathlist.insert(s, options);
    }
}


/**
 * Completes an operation in progress, for example when in command mode, 
 * interpret the command
 * @method MathField#complete_
 * @private
 */
MathField.prototype.complete_ = function() {
    Popover.hidePopover(this);

    const command = this.mathlist.extractCommandStringAroundInsertionPoint();
    if (command) {
        const mode = 'math'; // @todo this.mathlist.parseMode();
        let match = Definitions.matchFunction(mode, command);
        if (!match) {
            match = Definitions.matchSymbol(mode, command);
        }
        if (match) {
            const mathlist = ParserModule.parseTokens(
                    Lexer.tokenize(match.latexName), mode, null, Definitions.MACROS);

            this.mathlist.spliceCommandStringAroundInsertionPoint(mathlist);
        } else {
            // This wasn't a simple function or symbol.
            // Interpret the input as LaTeX code
            const mathlist = ParserModule.parseTokens(
                    Lexer.tokenize(command), mode, null, Definitions.MACROS);
            if (mathlist) {
                this.mathlist.spliceCommandStringAroundInsertionPoint(mathlist);
            } else {            
                this.mathlist.decorateCommandStringAroundInsertionPoint(true);
            }
        }
        this._announceChange("replacement"); 
    }
}


MathField.prototype._updateSuggestion = function() {
    this.mathlist.positionInsertionPointAfterCommitedCommand();
    this.mathlist.removeSuggestion();
    const command = this.mathlist.extractCommandStringAroundInsertionPoint();
    const suggestions = Definitions.suggest(command);
    if (suggestions.length === 0) {
        Popover.hidePopover(this);
        this.mathlist.decorateCommandStringAroundInsertionPoint(true);
    } else {
        const index = this.suggestionIndex % suggestions.length;
        const l = command.length - suggestions[index].match.length;
        if (l !== 0) {
            this.mathlist.insertSuggestion(suggestions[index].match, l);
        }
        Popover.showPopoverWithLatex(this, suggestions[index].match, suggestions.length > 1);
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

/**
 * Attach event handlers to an element so that it will react by executing
 * a command when pressed.
 * `'command'` can be:
 * - a string, a single selector
 * - an array, whose first element is a selector followed by one or more arguments.
 * - an object, with the following keys:
 *    * 'default': command performed on up, with a down + up sequence with no
 *      delay between down and up
 *    * 'alt', 'shift', 'altshift' keys: command performed on up with 
 *      one of these modifiers pressed
 *    * 'pressed': command performed on 'down'
 *    * 'pressAndHoldStart': command performed after a tap/down followed by a 
 * delay (optional)
 *    * 'pressAndHoldEnd': command performed on up, if there was a delay
 *     between down and up, if absent, 'default' is performed
 * The value of the keys specify which selector (string
 * or array) to perform depending on the keyboard state when the button is 
 * pressed.
 *
 * The 'pressed' and 'active' classes will get added to 
 * the element, as the :hover and :active pseudo-classes are not reliable
 * (at least on Chrome Android).
 * 
 * @param {*} el 
 * @param {*} command
 */
MathField.prototype._attachButtonHandlers = function(el, command) {
    const that = this;

    if (typeof command === 'object' && (command.default || command.pressed)) {
        // Attach the default (no modifiers pressed) command to the element
        if (command.default) {
            el.setAttribute('data-' + this.config.namespace + 'command', 
                JSON.stringify(command.default));
        }
        if (command.alt) {
            el.setAttribute('data-' + this.config.namespace + 'command-alt', 
                JSON.stringify(command.alt));
        }
        if (command.altshift) {
            el.setAttribute('data-' + this.config.namespace + 'command-altshift', 
                JSON.stringify(command.altshift));
        }
        if (command.shift) {
            el.setAttribute('data-' + this.config.namespace + 'command-shift', 
                JSON.stringify(command.shift));
        }
        // .pressed: command to perform when the button is pressed (i.e. 
        // on mouse down/touch). Otherwise the command is performed when 
        // the button is released
        if (command.pressed) {
            el.setAttribute('data-' + this.config.namespace + 'command-pressed', 
                JSON.stringify(command.pressed));
        }
        if (command.pressAndHoldStart) {
            el.setAttribute('data-' + this.config.namespace + 'command-pressAndHoldStart', 
                JSON.stringify(command.pressAndHoldStart));
        }
        if (command.pressAndHoldEnd) {
            el.setAttribute('data-' + this.config.namespace + 'command-pressAndHoldEnd', 
                JSON.stringify(command.pressAndHoldEnd));
        }
    } else {
        // We need to turn the command into a string to attach it to the dataset 
        // associated with the button (the command could be an array made of a 
        // selector and one or more parameters)
        el.setAttribute('data-' + this.config.namespace + 'command', 
            JSON.stringify(command));
    }


    let pressHoldStart;
    let pressHoldElement;
    let touchID;
    let syntheticTarget;    // Target while touch move

    on(el, 'mousedown touchstart', function(ev) {
        if (ev.type !== 'mousedown' || ev.buttons === 1) {
            // The primary button was pressed or the screen was tapped.
            ev.stopPropagation(); 
            ev.preventDefault();

            el.classList.add('pressed');
            pressHoldStart = Date.now();

            // Record the ID of the primary touch point for tracking on touchmove
            if (ev.type === 'touchstart') touchID = ev.changedTouches[0].identifier;

            // Parse the JSON to get the command (and its optional arguments) 
            // and perform it immediately
            const command = el.getAttribute('data-' + that.config.namespace + 'command-pressed');
            if (command) {
                that.perform(JSON.parse(command));
            }

            // If there is a `press and hold start` command, perform it
            // after a delay, if we're still pressed by then.
            const pressAndHoldStartCommand = el.getAttribute('data-' + that.config.namespace + 'command-pressAndHoldStart');
            if (pressAndHoldStartCommand) {
                pressHoldElement = el;
                window.setTimeout(function() {
                    if (el.classList.contains('pressed')) {
                        that.perform(JSON.parse(pressAndHoldStartCommand));
                    }
                }, 300);
            }

        }
    }, {passive: false, capture: false});
    on (el, 'mouseleave touchcancel', function() {
        el.classList.remove('pressed');
        // let command = el.getAttribute('data-' + that.config.namespace + 
        //     'command-pressAndHoldEnd');
        // const now = Date.now();
        // if (command && now > pressHoldStart + 300) {
        //     that.perform(JSON.parse(command));
        // }
    });
    on (el, 'touchmove', function(ev) {
        // Unlike with mouse tracking, touch tracking only sends events
        // to the target that was originally tapped on. For consistency,
        // we want to mimic the behavior of the mouse interaction by 
        // tracking the touch events and dispatching them to potential targets
        ev.preventDefault();
        for (let i = 0; i < ev.changedTouches.length; i++) {
            if (ev.changedTouches[i].identifier === touchID) {
                // Found a touch matching our primary/tracked touch
                const target = document.elementFromPoint(
                        ev.changedTouches[i].clientX,
                        ev.changedTouches[i].clientY);
                if (target !== syntheticTarget && syntheticTarget) {
                    syntheticTarget.dispatchEvent(
                        new MouseEvent('mouseleave'), {bubbles: true});
                    syntheticTarget = null;
                }
                if (target) {
                    syntheticTarget = target;
                    target.dispatchEvent(new MouseEvent('mouseenter',
                        {bubbles: true, buttons: 1}));
                }
            }
        }
    });
    on (el, 'mouseenter', function(ev) {
        if (ev.buttons === 1) {
            el.classList.add('pressed');
        }
    });

    on(el, 'mouseup touchend', function(ev) {
        if (syntheticTarget) {
            ev.stopPropagation();
            ev.preventDefault();
            const target = syntheticTarget;
            syntheticTarget = null;
            target.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}));
            return;
        }
        el.classList.remove('pressed');
        el.classList.add('active');

        // Since we want the active state to be visible for a while,
        // use a timer to remove it after a short delay
        window.setTimeout(function(){ el.classList.remove('active'); }, 150);

        let command = el.getAttribute('data-' + that.config.namespace + 
            'command-pressAndHoldEnd');
        const now = Date.now();
        // If the button has not been pressed for very long or if we were 
        // not the button that started the press and hold, don't consider
        // it a press-and-hold.
        if (el !== pressHoldElement || now < pressHoldStart + 300) {
            command = undefined;
        }
        if (!command && ev.altKey && ev.shiftKey) {
            command = el.getAttribute('data-' + that.config.namespace + 
                'command-altshift');
        }
        if (!command && ev.altKey) {
            command = el.getAttribute('data-' + that.config.namespace + 
                'command-alt');
        }
        if (!command && ev.shiftKey) {
            command = el.getAttribute('data-' + that.config.namespace + 
                'command-shift');
        }
        if (!command) {
            command = el.getAttribute('data-' + that.config.namespace + 
                'command');
        }
        if (command) {
            // Parse the JSON to get the command (and its optional arguments) 
            // and perform it
            that.perform(JSON.parse(command));
        }
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


/**
 * Alternate options are displayed when a key on the virtual keyboard is pressed
 * and held.
 * 
 */
MathField.prototype.showAlternateKeys_ = function(keycap, altKeys) {
    let altContainer = this.virtualKeyboard.getElementsByClassName('alternate-keys');
    if (!altContainer || altContainer.length === 0) return;

    altContainer = altContainer[0];

    if (altKeys.length >= 7) {
        // Width 4
        altContainer.style.width = '286px';
    } else if (altKeys.length === 4 || altKeys.length === 2) {
        // Width 2
        altContainer.style.width = '146px';
    } else if (altKeys.length === 1) {
        // Width 1
        altContainer.style.width = '86px';
    } else {
        // Width 3
        altContainer.style.width = '146px';
    }


    let markup = '';
    for (const altKey of altKeys) {
        markup += '<li';
        if (typeof altKey === 'string') {
            markup += ' data-latex="' + altKey + '"';
        } else {
            if (altKey.latex) {
                markup += ' data-latex="' + altKey.latex + '"';
            }
            if (altKey.insert) {
                markup += ' data-insert="' + altKey.insert + '"';
            }
            if (altKey.command) {
                markup += " data-command='" + altKey.command + "'";
            }
            if (altKey.aside) {
                markup += ' data-aside="' + altKey.aside + '"';
            }
            if (altKey.classes) {
                markup += ' data-classes="' + altKey.classes + '"';
            }
        }

        markup += '>';        
        markup += altKey.label || '';

        markup += '</li>';
    }
    markup = '<ul>' + markup + '</ul>';
    altContainer.innerHTML = markup;

    VirtualKeyboard.makeKeycap(this, 
        altContainer.querySelectorAll('li'), 'performAlternateKeys');

    const keycapEl = this.virtualKeyboard.querySelector(
        'div.keyboard-layer.visible div.rows ul li[data-alt-keys="' + keycap + '"]');
    const position = keycapEl.getBoundingClientRect();
    if (position) {
        altContainer.style.top = (position.top - altContainer.clientHeight + 5).toString() + 'px';
        altContainer.style.left = Math.max(0, 
            Math.min(window.innerWidth - altContainer.offsetWidth,
            ((position.left + position.right - altContainer.offsetWidth) / 2) )) + 'px';
        altContainer.classList.add('visible');
    }
}


MathField.prototype.hideAlternateKeys_ = function() {
    let altContainer = this.virtualKeyboard.getElementsByClassName('alternate-keys');
    if (altContainer && altContainer.length > 0) {
        altContainer = altContainer[0];
    } else {
        return;
    }
    altContainer.classList.remove('visible');
    altContainer.innerHTML = '';
}

/**
 * The command invoked when an alternate key is pressed.
 * We need to hide the Alternate Keys panel, then perform the 
 * command.
 */
MathField.prototype.performAlternateKeys_ = function(command) {
    this.hideAlternateKeys_();
    this.perform(command);
}


MathField.prototype.switchKeyboardLayer_ = function(layer) {
    if (this.config.virtualKeyboardMode) {

        if (layer !== 'lower-command' && layer !== 'upper-command' && layer !== 'symbols-command') {
            // If we switch to a non-command keyboard layer, first exit command mode.
            this.complete_();
        }

        this.showVirtualKeyboard_();
        const layers = this.virtualKeyboard.getElementsByClassName('keyboard-layer');

        // If the alternate keys panel was visible, hide it
        this.hideAlternateKeys_();

        // If we were in a temporarily shifted state (shift-key held down)
        // restore our state before switching to a new layer.
        this.unshiftKeyboardLayer_();

        // Search for the requested layer
        let found = false;
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].id === layer) {
                found = true;
                break;
            }
        }

        // We did find the layer, switch to it.
        // If we didn't find it, do nothing and keep the current layer
        if (found) {
            for (let i = 0; i < layers.length; i++) {
                if (layers[i].id === layer) {
                    layers[i].classList.add('visible');
                } else {
                    layers[i].classList.remove('visible');
                }
            }
        }

        this.focus();
    }
}


/** 
 * Temporarily change the labels and the command of the keys 
 * (for example when a modifier key is held down.)
 */
MathField.prototype.shiftKeyboardLayer_ = function() {
    const keycaps = this.virtualKeyboard.querySelectorAll(
        'div.keyboard-layer.visible .rows .keycap, div.keyboard-layer.visible .rows .action');
    if (keycaps) {
        for (let i = 0; i < keycaps.length; i++) {
            const keycap = keycaps[i];
            let shiftedContent = keycap.getAttribute('data-shifted');
            if (shiftedContent || /^[a-z]$/.test(keycap.innerHTML)) {
                keycap.setAttribute('data-unshifted-content', keycap.innerHTML);

                if (!shiftedContent) {
                    shiftedContent = keycap.innerHTML.toUpperCase();
                }
                keycap.innerHTML = shiftedContent;

                const command = keycap.getAttribute('data-' + this.config.namespace + 'command');
                if (command) {
                    keycap.setAttribute('data-unshifted-command', command);
                    const shiftedCommand = keycap.getAttribute('data-shifted-command');
                    if (shiftedCommand) {
                        keycap.setAttribute('data-' + this.config.namespace + 'command', 
                            shiftedCommand);
                    } else {
                        const commandObj = JSON.parse(command);
                        if (Array.isArray(commandObj)) {
                            commandObj[1] = commandObj[1].toUpperCase()
                        }
                        keycap.setAttribute('data-' + this.config.namespace + 'command', 
                            JSON.stringify(commandObj));
                    }
                }

            }
        }
    }
}



/** 
 * Restore the key labels and commands to the state before a modifier key
 * was pressed.
 * 
 */
MathField.prototype.unshiftKeyboardLayer_ = function() {
    const keycaps = this.virtualKeyboard.querySelectorAll(
        'div.keyboard-layer.visible .rows .keycap, div.keyboard-layer.visible .rows .action');
    if (keycaps) {
        for (let i = 0; i < keycaps.length; i++) {
            const keycap = keycaps[i];
            const content = keycap.getAttribute('data-unshifted-content');
            if (content) {
                keycap.innerHTML = content;
            }
            const command = keycap.getAttribute('data-unshifted-command');
            if (command) {
                keycap.setAttribute('data-' + this.config.namespace + 'command', 
                    command);
            }
        }
    }
}

MathField.prototype.insertAndUnshiftKeyboardLayer_ = function(c) {
    this.insert_(c);
    this.unshiftKeyboardLayer_();
}

/* Toggle the command bar, but switch to the alternate theme if available */
MathField.prototype.toggleVirtualKeyboardAlt_ = function() {
    let hadAltTheme = false;
    if (this.virtualKeyboard) {
        hadAltTheme = this.virtualKeyboard.classList.contains('material');
        this.virtualKeyboard.remove();
        delete this.virtualKeyboard;
        this.virtualKeyboard = null;
    }
    this.showVirtualKeyboard_(hadAltTheme ? '' : 'material');
}

MathField.prototype.showVirtualKeyboard_ = function(theme) {
    this.virtualKeyboardVisible = false;
    this.toggleVirtualKeyboard_(theme)
}

MathField.prototype.hideVirtualKeyboard_ = function() {
    this.virtualKeyboardVisible = true;
    this.toggleVirtualKeyboard_()
}

MathField.prototype.toggleVirtualKeyboard_ = function(theme) {
    this.virtualKeyboardVisible = !this.virtualKeyboardVisible;
    if (this.virtualKeyboardVisible) {
        if (this.virtualKeyboard) {
            this.virtualKeyboard.classList.add('visible');
        } else {
            // Construct the virtual keyboard
            this.virtualKeyboard = VirtualKeyboard.make(this, theme);

            // Let's make sure that tapping on the keyboard focuses the field
            on(this.virtualKeyboard, 'touchstart mousedown', function(evt) {
                that.focus();
                evt.preventDefault();
            });
            this.element.appendChild(this.virtualKeyboard);
        }
        // For the transition effect to work, the property has to be changed
        // after the insertion in the DOM. Use setTimeout
        const that = this;
        window.setTimeout(function() { that.virtualKeyboard.classList.add('visible'); }, 1);
    } else if (this.virtualKeyboard) {
        this.virtualKeyboard.classList.remove('visible');
    }
}

MathField.prototype.hasFocus = function() {
    return document.hasFocus() && document.activeElement === this.textarea;
}

MathField.prototype.focus = function() {
    if (!this.hasFocus()) {
        // The textarea may be a span (on mobile, for example), so check that
        // it has a select() before calling it.
        if (this.textarea.select) this.textarea.select();
        this._announceChange('line');
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
 * @param {Event} evt
 * @method MathField#keystroke
 */
MathField.prototype.keystroke = function(keys, evt) {
    // This is the public API, while onKeystroke is the 
    // internal handler
    return this._onKeystroke(keys, evt);
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

MathField.prototype.typedText_ = function(text) {
    this.focus();
    return this._onTypedText(text);
}


/**
 * @param {Object} [conf] See `MathLive.config()` for details
 * 

 * @method MathField#config
 */
MathField.prototype.config = function(conf) {
    // Copy the values from `config` to `def`
    this.config = Object.assign({
        overrideDefaultInlineShortcuts: false,
        virtualKeyboard: '',
        namespace: ''
    }, conf);

    // Validate the namespace (used for `data-` attributes)
    if (!/^[a-z]*[-]?$/.test(this.config.namespace)) {
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


